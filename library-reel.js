/* Project viewer and image-trail timings reused from the homepage drift wall. */
(() => {
const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let opening = false, origin = null;
  const PROJECTS = [
    { key:'centropark', title:'ЖК ЦентроПарк', dir:'centropark', renders:17 },
    { key:'centropark2', title:'ЖК ЦЕНТРОПАРК 2', dir:'centropark2', renders:7 },
    { key:'hutorskaya', title:'ЖК Хуторская', dir:'hutorskaya', renders:5 },
    { key:'miriady', title:'ЖК Мириады', dir:'miriady', renders:8 },
    { key:'alleyi', title:'ЖК Зеленые Аллеи', dir:'alleyi', renders:5 },
    { key:'ozerny', title:'ЖК Озёрный', dir:'ozerny', renders:7 },
    { key:'innograd', title:'ЖК Инноград', dir:'innograd', renders:6 }
  ];
  const projectByKey = new Map(PROJECTS.map(p => [p.key, p]));
  const assetsOf = p => {
    const assets = [];
    for (let i = 1; i <= (p.renders || 0); i++) {
      const n = String(i).padStart(2, '0');
      assets.push({ kind:'render', full:`media/gal/${p.dir}/${n}.jpg`, thumb:`media/wall/${p.dir}/${n}.jpg` });
    }
    return assets;
  };

const mediaLabel = p => `${p.renders} рендеров`;
  const reel = $('js-reel'), stage = $('js-reel-stage'), dotsEl = $('js-reel-dots'),
        washes = [$('js-reel-w0'), $('js-reel-w1')];
  const intro = $('js-reel-intro');
  let slides = [], srcs = [], idx = -1, atY = 0;
  let introTimers = [], locked = false;              // locked while the opening run plays
  // prog is where the reel IS, target where the input has asked it to be; a frame
  // loop lerps one to the other (the demo's Lenis feel), and the change itself is
  // a pure function of prog - i for every slide, so scrolling back scrubs it back.
  let prog = 0, target = 0, raf = 0, snapT = 0;
  const pad = n => String(n).padStart(2, '0');
  const clampP = t => Math.max(0, Math.min(slides.length - 1, t));
  const WHEEL_PX = 700;                              // wheel travel for one whole change
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;   // power2.inOut

  const SLOT = 12, DEPTH = 750, LENS = 1000;       // slot offset (vw), card spacing and the stage's perspective (px)
  function place(f, d, i) {                          // d = prog - i: how far the camera is past card i
    if (d <= -1 || d >= .85) { f.style.visibility = 'hidden'; return; }
    f.style.visibility = 'visible';
    const sx = (i % 2 ? SLOT : -SLOT);               // the card's slot: even index left, odd right
    const z = d * DEPTH;                              // behind the lens when negative, past it when positive
    const op = d < 0 ? Math.min(1, (1 + d) * 2)      // surfaces over the far half of its approach
                     : Math.max(0, 1 - Math.max(0, d - .2) / .6);   // washes out once it is past the frame
    const bl = d > 0 ? 12 * d : 0;
    f.style.transform = `translate3d(${sx}vw,0,${z.toFixed(1)}px)`;
    f.style.opacity = op.toFixed(3);
    f.style.filter = bl ? `blur(${bl.toFixed(2)}px)` : '';
    f.style.zIndex = 2 + i;
  }
  // the colour field behind the cards is each image's own average colour
  const tints = new Map();
  function tintOf(src) {
    if (tints.has(src)) return tints.get(src);
    tints.set(src, 'rgba(2,10,36,0)');
    const im = new Image(); im.src = src;
    im.decode().then(() => {
      const c = document.createElement('canvas'); c.width = c.height = 1;
      c.getContext('2d').drawImage(im, 0, 0, 1, 1);
      const [r, g, b] = c.getContext('2d').getImageData(0, 0, 1, 1).data;
      tints.set(src, `rgba(${r},${g},${b},.9)`); kick();
    }).catch(() => {});
    return tints.get(src);
  }
  function wash(i, k, op) {                          // layer k glows with image i's colour at opacity op
    washes[k].style.setProperty('--tint', tintOf(srcs[i]));
    washes[k].style.opacity = op.toFixed(3);
  }
  function hud(n) {
    idx = n;
    $('js-reel-num').textContent = `${pad(n + 1)} / ${pad(slides.length)}`;
    Array.from(dotsEl.children).forEach((d, i) => i === n ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current'));
    $('js-reel-prev').disabled = n === 0;
    $('js-reel-next').disabled = n === slides.length - 1;
    reel.classList.remove('sweep'); void reel.offsetWidth; reel.classList.add('sweep');   // replay the arc
  }
  function render() {
    raf = 0;
    prog += (target - prog) * (reduce ? 1 : .12);
    if (Math.abs(target - prog) < .0008) prog = target;
    slides.forEach((f, i) => place(f, prog - i, i));
    const lo = Math.floor(prog), hi = Math.min(slides.length - 1, lo + 1), fr = prog - lo;
    wash(lo, 0, 1 - fr); wash(hi, 1, fr);
    const n = Math.round(prog);
    if (n !== idx) hud(n);
    if (!big.hidden && bigImg.src !== srcs[n]) { bigImg.src = srcs[n]; resetZoom(); }
    if (prog !== target) raf = requestAnimationFrame(render);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(render); };
  function setTarget(t) { if (locked || !slides.length) return; target = clampP(t); kick(); }
  // In-gallery navigation uses the same smooth movement as wheel and drag.
  function jumpTo(n) {
    if (locked || !slides.length) return;
    n = clampP(Math.round(n)); if (n === Math.round(target)) return;
    clearTimeout(snapT);
    setTarget(n);
  }
  // let go and the reel settles on the nearest frame
  function snapSoon() { clearTimeout(snapT); snapT = setTimeout(() => setTarget(Math.round(target)), 160); }

  const others = $('js-reel-others'), grid = $('js-reel-grid'), allBtn = $('js-reel-all');
  function showGrid(on) {
    grid.hidden = !on; allBtn.setAttribute('aria-pressed', String(on));
    if (on) Array.from(grid.children).forEach((b, i) => i === Math.round(target) ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current'));
  }
  allBtn.addEventListener('click', () => showGrid(grid.hidden));

  // The Codrops transition, without GSAP: 6 copies of the pressed image are laid
  // along the straight path from the tile to the reel's card, each wiping in
  // top-to-bottom 50ms after the last and wiping out again after a beat, while
  // the tile itself wipes away and the rest of the wall falls back. The reel
  // fades in under them and its first frame wipes in where the last copy lands.
  const MV = { steps: 6, stepDuration: 350, stepInterval: 50, pause: 140 };
  const CLIP = { from: 'inset(100% 0% 0% 0%)', reveal: 'inset(0% 0% 0% 0%)', hide: 'inset(0% 0% 100% 0%)' };
  function openFromTile(tile) {
    if (opening || reel.hasAttribute('open')) return;
    opening = true; origin = tile;
    const d = tile.dataset;
    const project = projectByKey.get(d.project);
    const projectAssets = assetsOf(project);
    if (reduce) { openReel(d); return; }
    const from = tile.getBoundingClientRect();
    const start = Math.min(Math.max(+d.i || 1, 1), projectAssets.length) - 1;
    const w = Math.min(innerWidth * (innerWidth > 900 ? .56 : .86), 960), h = w * 9 / 16;
    const cx = innerWidth / 2 + (start % 2 ? SLOT : -SLOT) / 100 * innerWidth, cy = innerHeight / 2;
    const to = { left: cx - w / 2, top: cy - h / 2, width: w, height: h };
    // one copy per image of the project, the other frames first and the pressed
    // one last, so the trail that hops to the card runs through the whole project
    const total = projectAssets.length;
    const order = [...Array.from({ length: total }, (_, k) => k).filter(k => k !== start), start];
    const srcOf = k => projectAssets[k].thumb;
    document.querySelector('.cascade').classList.add('gone');
    const steps = order.length, n = steps + 2, movers = [];
    for (let k = 1; k < n - 1; k++) {
      const img = srcOf(order[k - 1]);
      const t = k / (n - 1), m = document.createElement('div'); m.className = 'mover';
      const mw = from.width + (to.width - from.width) * t, mh = from.height + (to.height - from.height) * t;
      const mx = (from.left + from.width / 2) + ((to.left + to.width / 2) - (from.left + from.width / 2)) * t;
      const my = (from.top + from.height / 2) + ((to.top + to.height / 2) - (from.top + from.height / 2)) * t;
      m.style.cssText = `left:${mx - mw / 2}px;top:${my - mh / 2}px;width:${mw}px;height:${mh}px;background-image:url("${img}");z-index:${1000 + k};clip-path:${CLIP.from}`;
      document.body.appendChild(m); movers.push(m);
      m.animate([{ clipPath: CLIP.hide, opacity: .4 }, { clipPath: CLIP.reveal, opacity: 1 }], { duration: MV.stepDuration, delay: (k - 1) * MV.stepInterval, easing: 'ease-in', fill: 'forwards' })
        .finished.then(() => m.animate([{ clipPath: CLIP.reveal }, { clipPath: CLIP.from }], { duration: MV.stepDuration, delay: MV.pause, easing: 'ease-out', fill: 'forwards' }).finished)
        .then(() => m.remove()).catch(() => m.remove());
    }
    // the reel comes up under the copies as the last one lands
    setTimeout(() => { reel.classList.add('opening'); openReel(d, false, true); requestAnimationFrame(() => reel.classList.remove('opening')); }, steps * MV.stepInterval);
    setTimeout(() => { document.querySelector('.cascade').classList.remove('gone'); }, steps * MV.stepInterval + 1100);
  }

  function openReel(d, quick, viaMovers) {
    if (!d) return;
    stopIntro(); showGrid(false);
    const project = projectByKey.get(d.project);
    if (!project) return;
    const projectAssets = assetsOf(project);
    // Every other unique project appears once, using its first available image.
    others.replaceChildren(...PROJECTS.filter(p => p.key !== project.key).map(p => {
      const cover = assetsOf(p)[0];
      const b = document.createElement('button'); b.type = 'button';
      b.innerHTML = `<img src="${cover.thumb}" alt=""><span>${p.title}</span>`;
      b.addEventListener('click', () => { if (locked && !intro.hidden) return; const open = () => openReel({ project:p.key, caption:p.title, i:1 }, true);
        if (window.PTR && !reduce) { locked = true; PTR.leave().then(() => { open(); PTR.enter(); }); } else open(); });
      return b;
    }));
    srcs = projectAssets.map(a => a.full);
    const start = Math.min(Math.max(+d.i || 1, 1), srcs.length) - 1;   // the frame that was pressed
    stage.replaceChildren(intro); dotsEl.textContent = '';   // keep the intro layer, drop the old slides
    slides = srcs.map((src, i) => {
      const f = document.createElement('figure'); f.className = 'slide';
      const im = new Image(); im.src = src; im.alt = `${d.caption} — кадр ${i + 1}`;
      f.appendChild(im); stage.appendChild(f);
      const b = document.createElement('button');
      b.className = 'dot'; b.type = 'button'; b.setAttribute('aria-label', `Кадр ${i + 1}`);
      b.addEventListener('click', () => jumpTo(i)); dotsEl.appendChild(b);
      return f;
    });
    grid.replaceChildren(...projectAssets.map((asset, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', `Кадр ${i + 1}`);
      b.innerHTML = `<img src="${asset.thumb}" alt="" loading="lazy">`;
      b.addEventListener('click', () => { showGrid(false); locked = false; prog = target = i; render(); });
      return b;
    }));
    $('js-reel-name').textContent = project.title;
    $('js-reel-count').textContent = mediaLabel(project);
    $('js-reel-more').href = 'renders.html';
    $('js-reel-more').firstChild.textContent = 'Все рендеры ';
    document.querySelector('.library-shell').inert = true;
    reel.setAttribute('open', '');
    reel.querySelector('.reel__close').focus(); atY = scrollY;                // locking <html> clamps the page to 0
    document.documentElement.style.overflow = 'hidden';
    idx = -1;
    prog = target = start; locked = true; render();              // sit on the pressed frame, no motion
    intro.style.transform = `translate3d(${start % 2 ? SLOT : -SLOT}vw,0,0)`; intro.style.zIndex = 2 + slides.length;
    if (viaMovers) revealFirst(start); else locked = false;      // no run-through: the frame is simply there
  }

  /* The opening run, restored: the pressed frame shows first, every other frame
     of the project wipes in over it top-to-bottom, and the last one to land is
     the pressed frame again — so the slider is handed back exactly where the
     wall left off, and only then does it take input. */
  // arriving from the wall: the pressed frame wipes in top-to-bottom where the last copy
  // landed (the demo's panel reveal), then the intro layer steps aside
  function revealFirst(start) {
    const im = new Image(); im.src = srcs[start]; im.alt = '';
    intro.replaceChildren(im); intro.hidden = false; intro.classList.remove('fast'); $('js-reel-skip').hidden = true;
    introTimers.push(setTimeout(() => im.classList.add('in'), 40));
    introTimers.push(setTimeout(endIntro, 1100));
  }
  function runIntro(start, speed = 1, wipeFirst = false) {
    const order = srcs.length > 1
      ? [start, ...srcs.map((_, i) => i).filter(i => i !== start), start]
      : [start];
    intro.replaceChildren(...order.map((i, k) => {
      const im = new Image(); im.src = srcs[i]; im.alt = '';
      if (k === 0 && !wipeFirst) im.className = 'in';
      return im;
    }));
    // opened from the wall: the first frame wipes in as the copies arrive (the demo's panel reveal)
    if (wipeFirst) introTimers.push(setTimeout(() => intro.firstElementChild && intro.firstElementChild.classList.add('in'), 40));
    intro.hidden = false; intro.classList.toggle('fast', speed > 1); $('js-reel-skip').hidden = order.length === 1;
    if (reduce || order.length === 1) { introTimers.push(setTimeout(endIntro, reduce ? 0 : 700)); return; }
    // a 17-frame project would take 5s at the component's .25s stagger — cap the run at ~4s
    const each = Math.min(.25, 3 / (order.length - 1)) * 1000 / speed, lead = (wipeFirst ? 1100 : 350) / speed, wipe = 1000 / speed;
    const imgs = Array.from(intro.children);
    imgs.slice(1).forEach((im, k) => introTimers.push(setTimeout(() => im.classList.add('in'), lead + k * each)));
    introTimers.push(setTimeout(endIntro, lead + (order.length - 1) * each + wipe));
  }
  function endIntro() { intro.hidden = true; intro.replaceChildren(); $('js-reel-skip').hidden = true; locked = false; }
  $('js-reel-skip').addEventListener('click', stopIntro);
  function stopIntro() { introTimers.forEach(clearTimeout); introTimers = []; endIntro(); }
  const big = $('js-reel-big');
  // zoom state of the enlarged frame: scale about the cursor, drag to look around
  const bigImg = big.firstElementChild;
  let z = 1, zx = 0, zy = 0, pan = null;
  const applyZoom = () => { bigImg.style.transform = `translate(${zx}px,${zy}px) scale(${z})`; big.classList.toggle('zoomed', z > 1); };
  const resetZoom = () => { z = 1; zx = zy = 0; applyZoom(); };
  function showBig(on) {
    big.hidden = !on;
    reel.classList.toggle('is-full-image', on);
    if (on) { bigImg.src = srcs[Math.round(target)]; resetZoom(); }
    $('js-reel-zoom').textContent = on ? 'Уменьшить' : 'Увеличить';
  }
  $('js-reel-zoom').addEventListener('click', () => showBig(big.hidden));
  big.addEventListener('wheel', e => {                            // scroll = zoom in / out at the pointer (1x – 6x)
    e.preventDefault(); e.stopPropagation();
    const r = bigImg.getBoundingClientRect(), k = Math.exp(-e.deltaY * .0015), nz = Math.min(6, Math.max(1, z * k)), f = nz / z;
    // keep the point under the cursor fixed while scaling
    zx = e.clientX - (e.clientX - r.left) * f - (r.left - zx); zy = e.clientY - (e.clientY - r.top) * f - (r.top - zy);
    z = nz; if (z === 1) { zx = zy = 0; } applyZoom();
  }, { passive: false });
  big.addEventListener('pointerdown', e => { if (z > 1) { pan = { x: e.clientX - zx, y: e.clientY - zy, moved: false }; big.classList.add('panning'); e.preventDefault(); } });
  big.addEventListener('pointermove', e => { if (!pan) return; zx = e.clientX - pan.x; zy = e.clientY - pan.y; pan.moved = true; applyZoom(); });
  big.addEventListener('pointerup', e => { const wasPan = pan && pan.moved; pan = null; big.classList.remove('panning'); if (!wasPan) { if (z > 1) resetZoom(); else showBig(false); } });
  big.addEventListener('pointercancel', () => { pan = null; big.classList.remove('panning'); });
  $('js-reel-fs').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else reel.requestFullscreen && reel.requestFullscreen(); });
  document.addEventListener('fullscreenchange', () => {
    const fullscreen = document.fullscreenElement === reel;
    $('js-reel-fs').textContent = fullscreen ? 'Выйти из полного экрана' : 'Во весь экран';
    if (fullscreen) { showGrid(false); reel.querySelector('.reel__close').focus(); }
    else if (reel.hasAttribute('open')) $('js-reel-fs').focus();
  });
  function closeReel() {
    stopIntro(); showGrid(false); showBig(false);
    if (document.fullscreenElement) document.exitFullscreen();
    if (raf) cancelAnimationFrame(raf); raf = 0; clearTimeout(snapT);
    reel.removeAttribute('open'); reel.classList.remove('sweep');
    opening = false; document.querySelector('.library-shell').inert = false;
    origin?.focus({preventScroll:true});
    document.documentElement.style.overflow = '';
    scrollTo({ top: atY, behavior: 'instant' });                                            // ...so put the wall back where it was
  }
  $('js-reel-prev').addEventListener('click', () => jumpTo(Math.round(target) - 1));
  $('js-reel-next').addEventListener('click', () => jumpTo(Math.round(target) + 1));
  reel.querySelector('.reel__close').addEventListener('click', () => {
    // in fullscreen (or enlarged) the cross steps back one level first; the next press closes the gallery
    if (document.fullscreenElement) { document.exitFullscreen(); if (!big.hidden) showBig(false); return; }
    if (!big.hidden) { showBig(false); return; }
    closeReel();
  });
  // wheel scrubs: the change follows the wheel, and settles when it stops
  reel.addEventListener('wheel', e => {
    if (!grid.hidden || !big.hidden) return;                     // the grid scrolls itself; the enlarged frame zooms
    e.preventDefault();
    setTarget(target + e.deltaY / WHEEL_PX); snapSoon();
  }, { passive: false });
  let dragX = null, dragT = 0;
  reel.addEventListener('pointerdown', e => { if (!grid.hidden || !big.hidden || e.target.closest('button')) return; dragX = e.clientX; dragT = target; reel.classList.add('drag'); });
  addEventListener('pointermove', e => {
    if (dragX === null) return;
    setTarget(dragT + (dragX - e.clientX) / (innerWidth * .5));     // half a screen of drag = one frame
  });
  addEventListener('pointerup', e => {
    if (dragX === null) return;
    const moved = Math.abs(e.clientX - dragX) > 6;
    dragX = null; reel.classList.remove('drag'); snapSoon();
    if (!moved && big.hidden && !locked) {                       // a tap on the current frame enlarges it
      const cur = slides[Math.round(target)]; if (!cur) return;
      const r = cur.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) showBig(true);
    }
  });
  addEventListener('keydown', e => {
    if (!reel.hasAttribute('open')) return;
    if (e.key === 'Tab') {
      const controls = [...reel.querySelectorAll('button:not([disabled]),a[href]')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
      const first = controls[0], last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (e.key === 'Escape') { if (!big.hidden) showBig(false); else if (!grid.hidden) showGrid(false); else closeReel(); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); jumpTo(Math.round(target) + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); jumpTo(Math.round(target) - 1); }
  });

window.libraryProjects = PROJECTS;
window.openLibraryProject = openFromTile;
})();
