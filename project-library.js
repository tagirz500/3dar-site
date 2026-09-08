/* Scroll-driven falling card stack, based on the supplied Cards Cascade recording. */
(() => {
  const projects = window.libraryProjects;
  const stage = document.querySelector('.cascade');
  const library = document.querySelector('.library');
  const track = document.querySelector('.library-track');
  const count = document.querySelector('.library-count strong');
  const status = document.querySelector('.library-status');
  const arrows = [...document.querySelectorAll('[data-direction]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let position = 0, target = 0, frame = 0, lastTime = 0, settle = 0, active = -1;
  let touch = null, suppressClickUntil = 0;
  const pad = n => String(n).padStart(2, '0');
  const clamp = n => Math.max(0, Math.min(projects.length - 1, n));
  const blocked = () => !!document.querySelector('.reel[open]') || document.querySelector('.library-shell').inert || stage.classList.contains('gone');
  const dots = projects.map((project, i) => {
    const dot = document.createElement('button'); dot.type = 'button'; dot.className = 'library-dot';
    dot.style.top = `${i / (projects.length - 1) * 100}%`;
    dot.setAttribute('aria-label', `${i + 1} из 7 — ${project.title}`);
    dot.addEventListener('click', () => { if (!blocked()) { clearTimeout(settle); move(i); } });
    track.append(dot); return dot;
  });
  const cards = projects.map((project, i) => {
    const card = document.createElement('button');
    card.className = 'project-card'; card.type = 'button';
    card.dataset.project = project.key; card.dataset.caption = project.title; card.dataset.i = '1';
    card.setAttribute('aria-label', `Открыть ${project.title}`);
    card.innerHTML = `<img src="media/gal/${project.dir}/01.jpg" alt="${project.title}" decoding="async"><span class="project-card-top"><span>${pad(i + 1)} / 07</span><span>3DAR</span></span><span class="project-card-copy"><small>АРХИТЕКТУРНАЯ ВИЗУАЛИЗАЦИЯ</small><h2>${project.title}</h2><p>${project.renders} рендеров · Открыть проект ↗</p></span>`;
    card.addEventListener('click', () => {
      if (blocked() || performance.now() < suppressClickUntil) return;
      if (i !== active) { move(i); return; }
      clearTimeout(settle); target = position = i; paint();
      window.openLibraryProject(card);
    });
    const edge = document.createElement('span'); edge.className = 'edge'; edge.setAttribute('aria-hidden','true'); card.append(edge);
    card.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || blocked()) return;
      const r = card.getBoundingClientRect();
      const x = event.clientX - r.left - r.width / 2, y = event.clientY - r.top - r.height / 2;
      const proximity = Math.min(1, Math.max(Math.abs(x) / (r.width / 2), Math.abs(y) / (r.height / 2)));
      card.classList.add('hot');
      card.style.setProperty('--edge-proximity', String(proximity * 100));
      card.style.setProperty('--cursor-angle', `${Math.atan2(y,x) * 180 / Math.PI + 90}deg`);
    });
    card.addEventListener('pointerleave', () => { card.classList.remove('hot'); card.style.setProperty('--edge-proximity','0'); });
    card.addEventListener('focus', () => { card.classList.add('hot'); card.style.setProperty('--edge-proximity','100'); });
    card.addEventListener('blur', () => { card.classList.remove('hot'); card.style.setProperty('--edge-proximity','0'); });
    stage.append(card); return card;
  });
  function paint() {
    const height = stage.clientHeight;
    cards.forEach((card, i) => {
      // At the beginning, the last unique card rests on the floor behind the sequence.
      let d = i - position;
      if (d > projects.length - 2) d -= projects.length;
      const falling = Math.max(0, -d);
      const depth = Math.max(0, d);
      const y = d >= 0 ? -depth * height * .14 : height * (.79 * Math.min(falling, 1) + Math.max(0, falling - 1) * .6);
      const scale = d >= 0 ? Math.max(.72, 1 - depth * .05) : 1 - Math.min(falling, 1) * .04;
      const tilt = Math.min(falling, 1) * 74;
      card.style.transform = `translate3d(0,${y}px,${-depth * 8}px) rotateX(${tilt}deg) scale(${scale})`;
      const opacity = d >= 0 ? Math.min(1, Math.max(0, 4 - depth)) : Math.max(0, 1 - Math.max(0, falling - 1) / .22);
      card.style.opacity = String(opacity);
      card.style.visibility = opacity <= 0 ? 'hidden' : 'visible';
      // Stable paint order: the departing card stays above the incoming card.
      // Distance-based rounding created ties and exposed the later DOM card early.
      card.style.zIndex = String(100 - i);
    });
    const current = Math.round(position);
    if (current !== active) {
      active = current; count.textContent = pad(active + 1);
      status.textContent = projects[active].title;
      cards.forEach((card, i) => { card.tabIndex = i === active ? 0 : -1; card.setAttribute('aria-hidden', String(i !== active)); });
      arrows[0].disabled = active === 0; arrows[1].disabled = active === projects.length - 1;
    }
    track.style.setProperty('--progress', position / (projects.length - 1));
    dots.forEach((dot, i) => { dot.classList.toggle('passed', i <= position); dot.setAttribute('aria-current', String(i === active)); });
  }
  function tick(now) {
    const dt = lastTime ? Math.min((now - lastTime) / 1000, .05) : 1 / 60; lastTime = now;
    position += (target - position) * (reduced.matches ? 1 : 1 - Math.exp(-dt / .16));
    if (Math.abs(target - position) < .0005) position = target;
    paint(); frame = position === target ? 0 : requestAnimationFrame(tick);
  }
  function move(value) { target = clamp(value); if (!frame) { lastTime = 0; frame = requestAnimationFrame(tick); } }
  // Keep partial wheel travel between slow notches; only settle near a full card.
  const snap = () => { clearTimeout(settle); settle = setTimeout(() => {
    if (Math.abs(target - Math.round(target)) < .12) move(Math.round(target));
  }, 220); };
  let wheelLast = -Infinity, wheelStep = -Infinity;
  library.addEventListener('wheel', event => {
    if (blocked() || event.ctrlKey) return;
    event.preventDefault();
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (!delta) return;
    const now = performance.now();
    // Treat a trackpad's momentum events as one gesture, not extra project steps.
    const freshGesture = now - wheelLast > 180 && now - wheelStep > 450;
    wheelLast = now;
    if (!freshGesture) return;
    wheelStep = now;
    clearTimeout(settle);
    move(Math.round(target) + Math.sign(delta));
  }, {passive:false});
  library.addEventListener('pointerdown', event => {
    if (blocked() || event.pointerType === 'mouse' || event.target.closest('.library-track')) return;
    touch = {y:event.clientY, start:event.clientY};
  });
  library.addEventListener('pointermove', event => {
    if (!touch) return;
    const delta = touch.y - event.clientY; touch.y = event.clientY;
    if (Math.abs(touch.start - event.clientY) > 8) suppressClickUntil = performance.now() + 400;
    move(target + delta / 260);
  });
  const release = () => { if (touch) { touch = null; snap(); } };
  addEventListener('pointerup', release); addEventListener('pointercancel', release);
  arrows.forEach(button => button.addEventListener('click', () => { clearTimeout(settle); move(Math.round(target) + Number(button.dataset.direction)); }));
  document.querySelector('.library-open').addEventListener('click', () => cards[active].click());
  addEventListener('keydown', event => {
    if (blocked() || event.target.closest('input,.menu,.burger') || event.altKey || event.ctrlKey || event.metaKey) return;
    const direction = ['ArrowDown','ArrowRight','PageDown'].includes(event.key) ? 1 : ['ArrowUp','ArrowLeft','PageUp'].includes(event.key) ? -1 : 0;
    if (direction || event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); clearTimeout(settle);
      move(event.key === 'Home' ? 0 : event.key === 'End' ? projects.length - 1 : Math.round(target) + direction);
    }
  });
  addEventListener('resize', paint); paint();
})();
