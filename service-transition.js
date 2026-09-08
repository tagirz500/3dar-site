/* Opening fold, card orbit and star timings adapted from the supplied
   ai-studio/motion.mjs recreation. Service copy comes from the live page. */
(() => {
  // Capture original copy before the site's text effects create decorative clones.
  const services = [...document.querySelectorAll('#services article')].map(source => ({
    title: source.querySelector('h3').textContent,
    paragraph: source.querySelector('p').textContent,
    icon: source.querySelector('svg').cloneNode(true)
  }));
  // Ordered to match the service articles: visualization, animation, VR, brand.
  const backgrounds = [
    { src:'media/service-cards/3d-visualization.jpg', position:'50% 50%' },
    { src:'media/service-cards/3d-animation.jpg', position:'52% 50%' },
    { src:'media/service-cards/vr-tours.jpg', position:'57% 50%' },
    { src:'media/service-cards/brand-solutions.jpg', position:'50% 50%' }
  ];
  backgrounds.forEach(background => { const image = new Image(); image.src = background.src; });
  const clamp = v => Math.max(0, Math.min(1, v));
  const mix = (a, b, p) => a + (b - a) * p;
  const smooth = p => p * p * (3 - 2 * p);
  const ease = (t, a, b) => smooth(clamp((t - a) / (b - a)));
  function keys(t, points, eased = false) {
    for (let i = 1; i < points.length; i++) {
      if (t <= points[i][0]) {
        const p = clamp((t - points[i - 1][0]) / (points[i][0] - points[i - 1][0]));
        return mix(points[i - 1][1], points[i][1], eased ? smooth(p) : p);
      }
    }
    return points.at(-1)[1];
  }
  window.playServiceTransition = (film, revealPage) => new Promise(resolve => {
    const root = document.createElement('div');
    root.className = 'service-transition';
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', 'Услуги студии 3DAR');
    root.innerHTML = '<div class="st-lightfall" aria-hidden="true"></div><div class="st-world"><div class="st-collection"><div class="st-camera"><div class="st-orbit"></div></div></div></div><div class="st-fold"><canvas></canvas><div class="st-fold-copy"></div></div><svg class="st-star" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 1C60 31 69 40 99 50C69 60 60 69 50 99C40 69 31 60 1 50C31 40 40 31 50 1Z"/></svg><div class="st-controls" aria-hidden="true"><span>Прокрутите</span><div class="st-dots"><i class="on"></i><i></i><i></i><i></i></div></div>';
    const world = root.querySelector('.st-world');
    const orbit = root.querySelector('.st-orbit');
    const camera = root.querySelector('.st-camera');
    const lightfall = root.querySelector('.st-lightfall');
    const fold = root.querySelector('.st-fold');
    const foldCopy = root.querySelector('.st-fold-copy');
    const canvas = root.querySelector('canvas');
    const star = root.querySelector('.st-star');
    const controls = root.querySelector('.st-controls');
    const dots = [...root.querySelectorAll('.st-dots i')];
    services.forEach((source, i) => {
      const panel = document.createElement('div');
      panel.className = 'st-panel';
      panel.style.transform = `rotateY(${i * 90}deg) translateZ(450px)`;
      panel.style.setProperty('--st-image', `url("${backgrounds[i].src}")`);
      const card = document.createElement('article');
      card.className = 'st-card';
      card.style.setProperty('--st-image', `url("${backgrounds[i].src}")`);
      card.style.setProperty('--st-position', backgrounds[i].position);
      const number = document.createElement('span');
      number.className = 'st-number'; number.textContent = `0${i + 1} / 04`;
      const title = document.createElement('h2'); title.textContent = source.title;
      const paragraph = document.createElement('p'); paragraph.textContent = source.paragraph;
      card.append(number, source.icon.cloneNode(true), title, paragraph);
      const back = document.createElement('div'); back.className = 'st-back'; back.setAttribute('aria-hidden', 'true');
      const edge = document.createElement('div'); edge.className = 'st-panel-edge'; edge.setAttribute('aria-hidden', 'true');
      panel.append(card, back, edge); orbit.append(panel);
    });
    foldCopy.append(orbit.querySelector('.st-card').cloneNode(true));
    foldCopy.firstElementChild.style.transform = 'none';
    const width = innerWidth, height = innerHeight;
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#020a24'; ctx.fillRect(0, 0, width, height);
    if (film.videoWidth) {
      const cover = Math.max(width / film.videoWidth, height / film.videoHeight);
      ctx.drawImage(film, (width - film.videoWidth * cover) / 2, (height - film.videoHeight * cover) / 2, film.videoWidth * cover, film.videoHeight * cover);
    }
    document.body.append(root);
    const unmountLightfall = window.mountServiceLightfall?.(lightfall, root);
    let time = .68, phase = 'fold', animation = 0, revealed = false;
    let progress = 0, target = 0, touchY = 0, motionFrame = 0, previous = 0;
    let pointerX = 0, pointerY = 0, mouseX = 0, mouseY = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const input = delta => {
      if (phase !== 'cards') return;
      target = Math.max(0, Math.min(4.4, target + delta / 1600));
    };

    function render(t) {
      const scale = Math.min(innerWidth / (innerWidth < 700 ? 1050 : 1560), innerHeight / 1080);
      world.style.transform = `translate(-50%,-50%) scale(${scale})`;
      const p = ease(t, .68, 1.64);
      fold.style.width = `${mix(width, 775 * scale, p)}px`;
      fold.style.height = `${mix(height, 520 * scale, p)}px`;
      fold.style.transform = `translate(-50%,-50%) perspective(2400px) rotateX(${-Math.sin(p * Math.PI) * 8}deg) rotateZ(${keys(t, [[.68,0],[.9,15],[1.12,39],[1.29,59],[1.47,74],[1.64,90]])}deg)`;
      fold.style.borderRadius = `${40 * scale * p}px`;
      fold.style.visibility = t < 1.64 ? 'visible' : 'hidden';
      canvas.style.opacity = 1 - ease(t, 1.05, 1.59);
      foldCopy.style.opacity = ease(t, 1.05, 1.59);
      foldCopy.style.transform = `translate(-50%,-50%) rotate(-90deg) scale(${scale})`;
      orbit.style.opacity = ease(t, 1.48, 1.64);
      const depthBlend = ease(t, 1.58, 1.8);
      camera.style.transform = `rotateX(${(-3 - mouseY * 3) * depthBlend}deg) rotateY(${(5 + mouseX * 6) * depthBlend}deg) translate3d(${mouseX * 14}px,${mouseY * 9}px,0)`;
      orbit.style.transform = `translateZ(-450px) rotateY(${-Math.min(progress, 3) * 90}deg)`;
      const face = Math.min(3, Math.round(progress));
      dots.forEach((dot, i) => dot.classList.toggle('on', i === face));
      controls.style.opacity = t >= 3.2 ? '0' : '';
      lightfall.style.opacity = String(1 - ease(t, 3.70, 3.79));
      world.style.visibility = t >= 3.79 ? 'hidden' : 'visible';
      const size = keys(t, [[3.20,100],[3.28,148],[3.375,350],[3.50,690],[3.62,1820],[3.72,5800],[3.78,10500]]) * Math.max(scale, innerWidth / 1440);
      star.style.width = star.style.height = `${size}px`;
      star.style.visibility = t >= 3.20 ? 'visible' : 'hidden';
      if (t >= 3.79 && !revealed) {
        revealed = true;
        revealPage();
      }
      if (t >= 3.79) star.style.visibility = 'hidden';
      root.style.opacity = 1 - ease(t, 3.79, 4.12);
    }

    function animateTo(destination, duration, done) {
      cancelAnimationFrame(animation);
      const start = time, began = performance.now();
      const tick = now => {
        const p = smooth(clamp((now - began) / duration));
        time = mix(start, destination, p); render(time);
        if (p < 1) animation = requestAnimationFrame(tick);
        else { animation = 0; done && done(); }
      };
      animation = requestAnimationFrame(tick);
    }

    root.addEventListener('wheel', event => {
      if (event.ctrlKey) return;
      event.preventDefault();
      event.stopPropagation();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
      input(Math.max(-320, Math.min(320, event.deltaY * unit)));
    }, { passive:false });
    root.addEventListener('touchstart', event => { touchY = event.touches[0].clientY; }, { passive:true });
    root.addEventListener('touchmove', event => {
      event.preventDefault(); event.stopPropagation();
      const y = event.touches[0].clientY; input((touchY - y) * 2.5); touchY = y;
    }, { passive:false });
    root.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || reduced) return;
      pointerX = (event.clientX / innerWidth - .5) * 2;
      pointerY = (event.clientY / innerHeight - .5) * 2;
    });
    root.addEventListener('pointerleave', () => { pointerX = pointerY = 0; });
    const onKey = event => {
      const direction = ['ArrowDown','ArrowRight','PageDown',' '].includes(event.key) ? 1 : ['ArrowUp','ArrowLeft','PageUp'].includes(event.key) ? -1 : 0;
      if (!direction) return;
      event.preventDefault(); input(direction * 320);
    };
    addEventListener('keydown', onKey);

    function finish() {
      phase = 'finished'; cancelAnimationFrame(animation); cancelAnimationFrame(motionFrame);
      removeEventListener('keydown', onKey);
      unmountLightfall?.();
      root.remove(); resolve();
    }

    // A damped camera follows accumulated wheel travel, including partial turns.
    // No gesture latch or forced 90-degree jumps; reverse scroll retraces the path.
    function motion(now) {
      const dt = previous ? Math.min(.05, (now - previous) / 1000) : 0;
      previous = now;
      const damping = reduced ? 1 : 1 - Math.exp(-dt / .18);
      mouseX += (pointerX - mouseX) * damping;
      mouseY += (pointerY - mouseY) * damping;
      if (phase === 'cards') {
        progress += (target - progress) * damping;
        if (Math.abs(target - progress) < .0001) progress = target;
        time = progress <= 3.3 ? 1.8 : mix(3.19, 4.12, clamp((progress - 3.3) / 1.1));
        render(time);
        if (progress >= 4.399) { finish(); return; }
      }
      motionFrame = requestAnimationFrame(motion);
    }

    render(time);
    animateTo(1.80, 1120, () => {
      phase = 'cards';
      controls.classList.add('ready');
    });
    motionFrame = requestAnimationFrame(motion);
  });
})();
