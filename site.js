/* Shared behaviour: the sliding-stairs menu (injected into every page),
   the renders lightbox, and the Kinescope video facade.

   The menu is built here rather than copied into each page so the labels,
   marquee copies and hrefs cannot drift between pages. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── menu model ────────────────────────────────────────────────────────
     Two thumbnails per row, repeated to fill the marquee. */
  const ITEMS = [
    { label: 'Услуги',        href: 'index.html#services', desc: 'Что мы делаем',          img: ['media/wall/centropark/02.jpg', 'media/wall/miriady/03.jpg'] },
    { label: 'Визуализация',  href: 'renders.html',        desc: '55 рендеров',            img: ['media/wall/centropark2/01.jpg', 'media/wall/alleyi/02.jpg'] },
    { label: 'Анимация',      href: 'animation.html',      desc: '15 роликов',             img: ['media/wall/posters/01.jpg', 'media/wall/posters/07.jpg'] },
    { label: 'О нас',         href: 'index.html#about',    desc: 'Студия премиум-класса',  img: ['media/wall/ozerny/04.jpg', 'media/wall/innograd/02.jpg'] },
    { label: 'Контакты',      href: 'index.html#contact',  desc: 'Обсудить проект',        img: ['media/wall/hutorskaya/03.jpg', 'media/wall/centropark/11.jpg'] },
  ];
  // Each .menu__container must be at least a viewport wide or a seam opens once
  // per loop. Six pairs clears an ultrawide; min-width:100vw is the backstop.
  const PAIRS = 6;

  const pair = (it) =>
    `<span class="menu__img"><img src="${it.img[0]}" alt="" loading="lazy" decoding="async"></span><p>${it.desc}</p>` +
    `<span class="menu__img"><img src="${it.img[1]}" alt="" loading="lazy" decoding="async"></span><p>${it.desc}</p>`;

  const here = location.pathname.split('/').pop() || 'index.html';

  const row = (it, i) => {
    // Only a whole-page link can be "current": on index.html three of these are
    // anchors into the same document, and marking all three reads as broken.
    const [target, hash] = it.href.split('#');
    const current = !hash && target === here ? ' aria-current="page"' : '';
    const strip = pair(it).repeat(PAIRS);
    return `<div class="menu__item">
      <a class="menu__link" href="${it.href}" style="--i:${i}"${current}>${it.label}</a>
      <span class="menu__inner"><span class="menu__container">${strip}</span><span class="menu__container">${strip}</span></span>
    </div>`;
  };

  document.body.insertAdjacentHTML('afterbegin',
    `<button class="burger" id="js-burger" type="button" aria-expanded="false" aria-controls="js-menu">
       <span class="burger__bg"></span>
       <svg class="burger__icon" viewBox="0 0 56 7" fill="none" aria-hidden="true">
         <line x1="56" y1="0.5" x2="0" y2="0.5"/><line x1="56" y1="6.5" x2="28" y2="6.5"/>
       </svg>
       <span class="burger__label">Меню</span>
     </button>
     <div class="stairs" aria-hidden="true">
       ${[0,1,2,3,4].map(i => `<div class="stairs__bar" style="--i:${i}"></div>`).join('')}
       <div class="stairs__bg"></div>
     </div>
     <div class="menu" id="js-menu" role="dialog" aria-modal="true" aria-label="Меню">
       <div class="menu__header">
         <button class="menu__close" id="js-close" type="button" aria-label="Закрыть меню">
           <svg viewBox="0 0 68 68" fill="none" aria-hidden="true"><path d="M1.5 1.5L67 67"/><path d="M66.5 1L1 66.5"/></svg>
         </button>
       </div>
       <div class="menu__body">${ITEMS.map(row).join('')}</div>
       <div class="menu__footer">
         <a href="index.html#faq">FAQ</a>
         <a href="https://t.me/studio_3dar" target="_blank" rel="noopener">TG</a>
         <a href="https://wa.me/79934111650" target="_blank" rel="noopener">WA</a>
         <a href="https://vk.com/club233807764" target="_blank" rel="noopener">VK</a>
       </div>
     </div>`);

  const root   = document.documentElement;
  const burger = document.getElementById('js-burger');
  const menu   = document.getElementById('js-menu');
  let open = false, closeTimer;

  function openMenu() {
    if (open) return;                    // the source stacks timelines on repeat clicks
    open = true;
    clearTimeout(closeTimer);
    // the blot grows from the burger's centre to the farthest corner (Orbit's computeCircle)
    const r = burger.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const maxR = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 20;
    menu.style.setProperty('--cx', cx + 'px'); menu.style.setProperty('--cy', cy + 'px'); menu.style.setProperty('--cr-max', maxR + 'px');
    root.classList.remove('menu-closing');
    root.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
    menu.removeAttribute('inert');
    // The source waits the full 1.4s before accepting a click; the overlay is
    // already legible at 0.9s, so focus lands as soon as it has faded in.
    setTimeout(() => { if (open) menu.querySelector('.menu__link').focus(); }, reduce ? 0 : 900);
  }

  function closeMenu() {
    if (!open) return;
    open = false;
    menu.setAttribute('inert', '');
    burger.setAttribute('aria-expanded', 'false');
    root.classList.add('menu-closing');
    // close runs 0.7s — exactly half the open — then both classes drop together,
    // which is seamless because the end state equals the no-class state.
    closeTimer = setTimeout(() => root.classList.remove('menu-open', 'menu-closing'), reduce ? 20 : 700);
    burger.focus();
  }

  burger.addEventListener('click', openMenu);
  document.getElementById('js-close').addEventListener('click', closeMenu);
  addEventListener('keydown', e => { if (e.key === 'Escape' && open) closeMenu(); });
  menu.setAttribute('inert', '');

  /* Direction-aware wipe. Entering from above reveals downward, from below upward,
     and leaving continues the cursor's motion. */
  const FROM_TOP = 'inset(0 0 100% 0)', FROM_BOTTOM = 'inset(100% 0 0 0)';
  menu.querySelectorAll('.menu__item').forEach(item => {
    const inner = item.querySelector('.menu__inner');
    const above = e => e.clientY < item.getBoundingClientRect().top + item.offsetHeight / 2;
    item.addEventListener('pointerenter', e => {
      inner.style.transition = 'none';
      inner.style.clipPath = above(e) ? FROM_TOP : FROM_BOTTOM;
      void inner.offsetWidth;                    // commit the start before transitioning
      inner.style.transition = '';
      inner.style.clipPath = 'inset(0)';
    });
    item.addEventListener('pointerleave', e => {
      inner.style.clipPath = above(e) ? FROM_TOP : FROM_BOTTOM;
    });
  });

  /* A menu link to another page goes through the stroke transition below; an
     anchor on this page just closes the menu. */
  menu.querySelectorAll('.menu__link').forEach(a => {
    a.addEventListener('click', e => {
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      const samePage = url.pathname.split('/').pop() === here;
      if (samePage && url.hash) { closeMenu(); return; }
      if (reduce) return;
      e.preventDefault(); e.stopPropagation();
      menu.setAttribute('inert', '');
      goWithStrokes(a.href);
    });
  });

  /* ── renders lightbox ──────────────────────────────────────────────── */
  const lb = document.getElementById('js-lb');
  if (lb) {
    const lbImg = lb.querySelector('img');
    const lbNum = lb.querySelector('[data-num]');
    const lbCap = lb.querySelector('[data-cap]');
    let group = [], idx = 0;

    const show = i => {
      idx = (i + group.length) % group.length;
      const el = group[idx];
      lbImg.src = el.dataset.full;
      lbImg.alt = el.querySelector('img').alt;
      lbCap.textContent = el.dataset.project;
      lbNum.textContent = `${idx + 1} / ${group.length}`;
    };
    const openLb = el => {
      // the lightbox walks only the project the shot belongs to, like the real site
      group = [...el.closest('.grid').querySelectorAll('.shot')];
      show(group.indexOf(el));
      lb.setAttribute('open', '');
      root.style.overflow = 'hidden';
    };
    const closeLb = () => { lb.removeAttribute('open'); root.style.overflow = ''; lbImg.removeAttribute('src'); };

    document.querySelectorAll('.shot').forEach(el => el.addEventListener('click', () => openLb(el)));
    lb.querySelector('[data-prev]').addEventListener('click', e => { e.stopPropagation(); show(idx - 1); });
    lb.querySelector('[data-next]').addEventListener('click', e => { e.stopPropagation(); show(idx + 1); });
    lb.querySelector('[data-close]').addEventListener('click', closeLb);
    lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
    addEventListener('keydown', e => {
      if (!lb.hasAttribute('open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ── Kinescope facade: the poster is a button, the iframe only loads on click ── */
  document.querySelectorAll('.vid[data-kin]').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = `https://kinescope.io/embed/${btn.dataset.kin}?autoplay=1`;
      f.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      f.allowFullscreen = true;
      f.title = btn.dataset.name || 'Видео';
      btn.replaceChildren(f);
      btn.style.cursor = 'default';
    }, { once: true });
  });
  /* ── on-scroll typography, every block of copy (Codrops OnScrollTypographyAnimations) ──
     Every heading, paragraph, list item, question and label is split into words and
     characters (inline elements such as <em>/<strong> are kept), and its progress through
     the viewport is scrubbed into a per-character animation:
       headings  → effect 2: chars rise from 120% below, stretched (scaleY 2.3, scaleX .7),
                   with a back.inOut overshoot, stagger .03
       copy      → effect 1: chars from opacity 0, scale .6, a random ±20° tilt, power4, stagger .4
     Staggers are scaled so a long paragraph finishes within the same scroll distance.
     Elements that carry their own effect (data-text-rep, data-nogoo, the hero) are left alone. */
  const FX_PICK = 'h1,h2,h3,h4,p,summary,li,figcaption,blockquote,.eyebrow,.stats b,.stats span,.proj__count';
  const FX_SKIP = '.hero,.nav,.menu,.burger,.stairs,.cta,.reel,#wall-foot,.lb,footer,[data-nogoo],[data-text-rep],.typo';
  if (!reduce && document.body) {
    const HEAD = 'H1,H2,H3,H4,SUMMARY';
    const split = el => {
      const chars = [];
      const walk = node => {
        Array.from(node.childNodes).forEach(n => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(t => {
              if (!t) return;
              if (!t.trim()) { frag.appendChild(document.createTextNode(t)); return; }
              const word = document.createElement('span'); word.className = 'fx-word';
              Array.from(t).forEach(ch => { const c = document.createElement('span'); c.className = 'fx-char'; c.textContent = ch; c.dataset.r = (Math.random() * 40 - 20).toFixed(1); word.appendChild(c); chars.push(c); });
              frag.appendChild(word);
            });
            n.replaceWith(frag);
          } else if (n.nodeName !== 'BR' && n.nodeName !== 'SVG') walk(n);
        });
      };
      walk(el);
      return chars;
    };
    const blocks = Array.from(document.querySelectorAll(FX_PICK))
      .filter(el => !el.closest(FX_SKIP) && el.textContent.trim() && !el.querySelector(FX_PICK))
      .map(el => {
        const chars = split(el), head = HEAD.includes(el.tagName) || el.classList.contains('eyebrow');
        const each = head ? .03 : Math.min(.4, 1.6 / Math.max(1, chars.length));   // effect 2 / effect 1 staggers
        el.classList.add('fx', head ? 'fx--head' : 'fx--copy');
        return { el, chars, head, each, span: 1 + each * (chars.length - 1), done: false };
      });
    const p4 = t => 1 - Math.pow(1 - t, 4);
    const backInOut = t => { const s = 1.70158 * 1.525; return t < .5 ? (Math.pow(2 * t, 2) * ((s + 1) * 2 * t - s)) / 2 : (Math.pow(2 * t - 2, 2) * ((s + 1) * (t * 2 - 2) + s) + 2) / 2; };
    const clamp01 = v => Math.min(1, Math.max(0, v));
    function fxTick() {
      const vh = innerHeight;
      for (const b of blocks) {
        const r = b.el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh * 1.5) { if (r.top > vh * 1.5 && b.done) { b.done = false; } continue; }
        // the scrub runs from the block's top entering at the bottom edge until it reaches 35% down the screen
        const p = clamp01((vh - r.top) / (vh * .65));
        if (p >= 1 && b.done) continue;
        b.done = p >= 1;
        for (let i = 0; i < b.chars.length; i++) {
          const c = b.chars[i], t = clamp01(p * b.span - b.each * i);
          if (b.head) {
            const e = backInOut(t);
            c.style.opacity = clamp01(t * 3).toFixed(3);
            c.style.transform = `translateY(${(120 * (1 - e)).toFixed(1)}%) scale(${(.7 + .3 * e).toFixed(3)},${(2.3 - 1.3 * e).toFixed(3)})`;
          } else {
            const e = p4(t);
            c.style.opacity = e.toFixed(3);
            c.style.transform = `scale(${(.6 + .4 * e).toFixed(3)}) rotate(${(c.dataset.r * (1 - e)).toFixed(1)}deg)`;
          }
        }
      }
    }
    addEventListener('scroll', fxTick, { passive: true }); addEventListener('resize', fxTick); fxTick();
    // collapsed FAQ answers get their pass when they open
    document.querySelectorAll('details').forEach(d => d.addEventListener('toggle', () => requestAnimationFrame(fxTick)));
    window.FX_TICK = fxTick;
  }
  /* ── the particle field ────────────────────────────────────────────────
     The Drive demo (bg-3) mounted as-is: its markup with its data-* settings
     and its script.js untouched (particles.js), fixed under every page. The
     layer takes no pointer events, so the window's mouse is relayed to it for
     the hover parallax. */
  document.body.insertAdjacentHTML('afterbegin',
    '<div class="index bgx"><section class="hero bgx__hero"><div class="particles-container" data-particles="" data-colors="#ffffff" data-count="200" data-spread="10" ' +
    'data-speed="0.1" data-base-size="100" data-size-randomness="1" data-camera-distance="20" data-hover="true" ' +
    'data-hover-factor="1" data-alpha="false" data-rotation="true" data-dpr="1"></div></section></div>');
  const pc = document.querySelector('.bgx .particles-container');
  addEventListener('mousemove', e => pc.dispatchEvent(new MouseEvent('mousemove', { clientX: e.clientX, clientY: e.clientY })));
  const bgScript = document.createElement('script'); bgScript.src = 'particles.js?v=1'; document.body.appendChild(bgScript);
  /* ── SVG stroke page transition (Drive: SVG-Page-transition) ──────────────
     Two thick brush strokes draw across the screen (dashoffset → 0 while the
     stroke fattens 200 → 700), the page changes underneath, then they draw
     away (offset → −length, width back to 200). The demo's paths, timings and
     power1.inOut, without GSAP. Used for page-to-page moves and for the reel's
     button jumps — scrubbing the reel stays plain. */
  document.body.insertAdjacentHTML('beforeend',
    '<div class="ptr" aria-hidden="true"><svg viewBox="0 0 2453 2535" fill="none" preserveAspectRatio="none">' +
    '<path class="ptr__a" d="M227.549 1818.76C227.549 1818.76 406.016 2207.75 569.049 2130.26C843.431 1999.85 -264.104 1002.3 227.549 876.262C552.918 792.849 773.647 2456.11 1342.05 2130.26C1885.43 1818.76 14.9644 455.772 760.548 137.262C1342.05 -111.152 1663.5 2266.35 2209.55 1972.76C2755.6 1679.18 1536.63 384.467 1826.55 137.262C2013.5 -22.1463 2209.55 381.262 2209.55 381.262"/><path class="ptr__b" d="M1661.28 2255.51C1661.28 2255.51 2311.09 1960.37 2111.78 1817.01C1944.47 1696.67 718.456 2870.17 499.781 2255.51C308.969 1719.17 2457.51 1613.83 2111.78 963.512C1766.05 313.198 427.949 2195.17 132.281 1455.51C-155.219 736.292 2014.78 891.514 1708.78 252.012C1437.81 -314.29 369.471 909.169 132.281 566.512C18.1772 401.672 244.781 193.012 244.781 193.012"/></svg></div>');
  const ptrPaths = Array.from(document.querySelectorAll('.ptr path'));
  ptrPaths.forEach(p => { const L = p.getTotalLength(); p.dataset.len = L; p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
  const PTR_EASE = 'cubic-bezier(.37,0,.63,1)';                       // power1.inOut
  function ptrLeave() {
    if (reduce) return Promise.resolve();
    return Promise.all(ptrPaths.map(p => p.animate(
      [{ strokeDashoffset: p.dataset.len, strokeWidth: '200px' }, { strokeDashoffset: 0, strokeWidth: '700px' }],
      { duration: 1000, easing: PTR_EASE, fill: 'forwards' }).finished));
  }
  function ptrEnter() {
    if (reduce) return Promise.resolve();
    return Promise.all(ptrPaths.map(p => p.animate(
      [{ strokeDashoffset: 0, strokeWidth: '700px' }, { strokeDashoffset: -p.dataset.len, strokeWidth: '200px' }],
      { duration: 1000, easing: PTR_EASE, fill: 'forwards' }).finished.then(() => {
        p.getAnimations().forEach(a => a.cancel());
        p.style.strokeDashoffset = p.dataset.len; p.style.strokeWidth = '';   // parked, ready for the next leave
      })));
  }
  window.PTR = { leave: ptrLeave, enter: ptrEnter };
  let leaving = false;
  function goWithStrokes(href) {
    if (leaving) return; leaving = true;
    sessionStorage.setItem('ptr', '1');
    ptrLeave().then(() => { location.href = href; });
  }
  // arriving covered: the strokes are already down, draw them away
  if (sessionStorage.getItem('ptr')) {
    sessionStorage.removeItem('ptr');
    ptrPaths.forEach(p => { p.style.strokeDashoffset = 0; p.style.strokeWidth = '700px'; });
    requestAnimationFrame(() => ptrEnter());
  }
  // every same-site link to another page leaves through the strokes
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || reduce || e.defaultPrevented || e.metaKey || e.ctrlKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname) return;   // anchors on this page stay instant
    e.preventDefault(); goWithStrokes(a.href);
  });
})();
