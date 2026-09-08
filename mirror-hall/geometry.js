const videos = [...document.querySelectorAll('.vid[data-kin]')];
const projects = [...new Map([...document.querySelectorAll('#wall-plane .tile[data-project]')].map(b=>[b.dataset.project,b])).values()];
export const ARTWORKS = (videos.length ? videos : projects).map(b=>({title:b.dataset.name||b.dataset.caption,id:b.dataset.kin,project:b.dataset.project,src:b.querySelector('img').getAttribute('src')}));

export const mod = (n, d = ARTWORKS.length) => ((n % d) + d) % d;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const nearestPosition = (index, current) => current + mod(index - current + ARTWORKS.length/2) - ARTWORKS.length/2;

export function layout(width, height) {
  const mobile = width < 600;
  const radius = 10;
  const cardWidth = 4.2;
  const cardHeight = 2.3625;
  const focal = mobile
    ? Math.min(width * 0.40, height * 0.90)
    : Math.min(width * 0.40, height * 0.90);
  const centralHeight = focal * cardHeight / radius;
  const waterline = height * (mobile ? 0.594 : 0.605);
  const camera = cardHeight * 0.80;
  const horizon = waterline - focal * camera / radius;
  return {
    width, height, radius, cardWidth, cardHeight, focal, camera, horizon,
    step: 0.49,
    spacing: focal * 0.49,
    centralHeight, waterline, lift: 0.12,
  };
}

export function project(u, v, angle, config, reflection = false, scale = 1, lift = config.lift) {
  const xLocal = (u - 0.5) * config.cardWidth * scale;
  const x = Math.sin(angle) * config.radius + Math.cos(angle) * xLocal;
  const extent = (1 - v) * config.cardHeight * scale + lift;
  // Flat panels tangent to an inward-facing arc; only the arrangement curves.
  const z = Math.cos(angle) * config.radius - Math.sin(angle) * xLocal;
  const y = config.camera + (reflection ? 1 : -1) * extent;
  return {
    x: config.width / 2 + config.focal * x / z,
    y: config.horizon + config.focal * y / z,
    z,
  };
}

export function visibleCards(position, config) {
  const range = 2;
  const center = Math.round(position);
  const cards = [];
  for (let n = center - range; n <= center + range; n++) {
    const angle = (n - position) * config.step;
    cards.push({ id: n, index: mod(n), angle, z: Math.cos(angle) * config.radius });
  }
  return cards.sort((a, b) => b.z - a.z);
}

export function hitCard(x, y, cards, config) {
  for (const card of [...cards].reverse()) {
    const points = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([u, v]) => project(u, v, card.angle, config, false, card.scale ?? 1, card.lift ?? config.lift));
    let inside = false;
    for (let i = 0, j = 3; i < 4; j = i++) {
      const a = points[i], b = points[j];
      if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
    }
    if (inside) return card;
  }
  return null;
}
