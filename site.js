/* Shared behaviour: the sliding-stairs menu (injected into every page),
   the renders lightbox, and the Kinescope video facade.

   The menu is built here rather than copied into each page so the labels,
   marquee copies and hrefs cannot drift between pages. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // GooeyNav's original particle paths and timing, shared by menu and contact controls.
  window.playGooeyBurst = target => {
    if(reduce)return;
    const r=target.getBoundingClientRect(),fx=document.createElement('span');
    fx.className='control-goo';fx.setAttribute('aria-hidden','true');
    if(target.classList.contains('contact-icon')){
      fx.classList.add('control-goo--icon');
      // Punch out the icon's center; blobs remain outside and meet its perimeter.
      fx.style.clipPath='polygon(evenodd, -100px -100px, calc(100% + 100px) -100px, calc(100% + 100px) calc(100% + 100px), -100px calc(100% + 100px), -100px -100px, 0 0, 0 100%, 100% 100%, 100% 0, 0 0)';
    }
    Object.assign(fx.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
    const noise=n=>n/2-Math.random()*n;
    for(let i=0;i<8;i++){
      const angle=(360+noise(8))/8*(8-i)*Math.PI/180,end=10+noise(7),rotation=noise(20);
      const particle=document.createElement('span'),point=document.createElement('span');
      particle.className='control-goo__particle';point.className='control-goo__point';
      particle.style.cssText=`--sx:${90*Math.cos(angle)}px;--sy:${90*Math.sin(angle)}px;--ex:${end*Math.cos(angle)}px;--ey:${end*Math.sin(angle)}px;--r:${(rotation>0?rotation+10:rotation-10)*10}deg;--time:${1200+noise(400)}ms;--scale:${1+noise(.2)}`;
      particle.append(point);fx.append(particle);
    }
    document.body.append(fx);setTimeout(()=>fx.remove(),1500);
  };

  /* ── menu model ────────────────────────────────────────────────────────
     Two thumbnails per row, repeated to fill the marquee. */
  const ITEMS = [
    { label: 'Услуги',        href: 'index.html#services', desc: 'Что мы делаем',          img: ['media/wall/centropark/02.jpg', 'media/wall/miriady/03.jpg'] },
    { label: 'Визуализация',  href: 'renders.html',        desc: '55 рендеров',            img: ['media/wall/centropark2/01.jpg', 'media/wall/alleyi/02.jpg'] },
    { label: 'Анимация',      href: 'animation.html',      desc: '15 роликов',             img: ['media/wall/posters/01.jpg', 'media/wall/posters/07.jpg'] },
    { label: 'О нас',         href: 'index.html#about',    desc: 'Студия премиум-класса',  img: ['media/wall/ozerny/04.jpg', 'media/wall/innograd/02.jpg'] },
    { label: 'Частые вопросы', href: 'index.html#faq', desc: 'Частые вопросы', img: ['media/wall/centropark2/01.jpg', 'media/wall/centropark/11.jpg'] },
    { label: 'Контакты',      href: 'contact.html',  desc: 'Обсудить проект',        img: ['media/wall/hutorskaya/03.jpg', 'media/wall/centropark/11.jpg'] },
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
     </div>`);

  const root   = document.documentElement;
  const burger = document.getElementById('js-burger');
  const menu   = document.getElementById('js-menu');
  // Equal pixel speed, not equal loop duration: longer labels travel farther.
  const strips = [...menu.querySelectorAll('.menu__container')];
  const animationStrip = menu.querySelector('a[href="animation.html"]')?.parentElement.querySelector('.menu__container');
  function syncMenuSpeed(){
    const referenceWidth = animationStrip?.getBoundingClientRect().width;
    if(!referenceWidth)return;
    const pixelsPerSecond = referenceWidth / 12;
    strips.forEach(strip=>{
      strip.style.animationDuration = (strip.getBoundingClientRect().width / pixelsPerSecond) + 's';
    });
  }
  const stripObserver = new ResizeObserver(syncMenuSpeed);
  strips.forEach(strip=>stripObserver.observe(strip));
  document.fonts.ready.then(syncMenuSpeed);
  syncMenuSpeed();
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

  let menuPending=false;
  burger.addEventListener('click',()=>{
    if(open||menuPending)return;
    window.playGooeyBurst(burger);menuPending=true;
    setTimeout(()=>{menuPending=false;openMenu()},reduce?0:350);
  });
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
  if (!reduce && document.body && !document.body.classList.contains('no-body-text-fx')) {
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
  /* ── React Bits GhostFibers background, fixed behind the page ───────── */
  document.body.insertAdjacentHTML('afterbegin','<div class="index bgx" aria-hidden="true"><div class="bgx__ghost" id="ghost-fibers-bg"></div></div>');
  const bgScript = document.createElement('script');
  bgScript.src = 'media/bundles/ghost-fibers.js?v=20260908-downward';
  bgScript.onload = () => window.mountGhostFibers?.(document.getElementById('ghost-fibers-bg'));
  document.body.appendChild(bgScript);
  for(const href of ['media/bundles/liquid-glass.css']){
    const css=document.createElement('link');css.rel='stylesheet';css.href=href;document.head.append(css);
  }
  if(document.querySelector('.contact-icon,.why-grid')){
    const glassScript=document.createElement('script');glassScript.src='media/bundles/liquid-glass.js';document.body.append(glassScript);
  }
  /* ── SVG stroke page transition (Drive: SVG-Page-transition) ──────────────
     Two thick brush strokes draw across the screen (dashoffset → 0 while the
     stroke fattens 200 → 700), the page changes underneath, then they draw
     away (offset → −length, width back to 200). The demo's paths, timings and
     power1.inOut, without GSAP. Used for page-to-page moves and for the reel's
     button jumps — scrubbing the reel stays plain. */
  document.body.insertAdjacentHTML('beforeend',
    '<div class="ptr" aria-hidden="true"><svg viewBox="0 0 2453 2535" fill="none" preserveAspectRatio="none">' +
    '<path class="ptr__a" d="M227.549 1818.76C227.549 1818.76 406.016 2207.75 569.049 2130.26C843.431 1999.85 -264.104 1002.3 227.549 876.262C552.918 792.849 773.647 2456.11 1342.05 2130.26C1885.43 1818.76 14.9644 455.772 760.548 137.262C1342.05 -111.152 1663.5 2266.35 2209.55 1972.76C2755.6 1679.18 1536.63 384.467 1826.55 137.262C2013.5 -22.1463 2209.55 381.262 2209.55 381.262"/><path class="ptr__b" d="M1661.28 2255.51C1661.28 2255.51 2311.09 1960.37 2111.78 1817.01C1944.47 1696.67 718.456 2870.17 499.781 2255.51C308.969 1719.17 2457.51 1613.83 2111.78 963.512C1766.05 313.198 427.949 2195.17 132.281 1455.51C-155.219 736.292 2014.78 891.514 1708.78 252.012C1437.81 -314.29 369.471 909.169 132.281 566.512C18.1772 401.672 244.781 193.012 244.781 193.012"/></svg></div>');
  const ptrPaths=[...document.querySelectorAll('.ptr path')];
  ptrPaths.forEach(p=>{p.dataset.len=p.getTotalLength();p.style.strokeDasharray=p.dataset.len;p.style.strokeDashoffset=p.dataset.len});
  const PTR_EASE='cubic-bezier(.37,0,.63,1)';
  document.body.insertAdjacentHTML('beforeend','<div class="ptr-logo" aria-hidden="true"><svg viewBox="0 0 334.4 145"><path d="M41.32 126.80Q31.12 126.80 25.30 122.96Q19.48 119.12 17.02 112.22Q14.56 105.32 14.56 96.32L14.56 92.84L34.60 92.84Q34.60 92.96 34.60 94.16Q34.60 95.36 34.60 96.32Q34.60 101.12 35.20 104.12Q35.80 107.12 37.36 108.50Q38.92 109.88 41.68 109.88Q44.44 109.88 45.82 108.44Q47.20 107 47.68 104.12Q48.16 101.24 48.16 96.92Q48.16 89.72 46.18 85.94Q44.20 82.16 37.96 82.04Q37.84 82.04 36.64 82.04Q35.44 82.04 34.24 82.04L34.24 68.24Q35.08 68.24 35.92 68.24Q36.76 68.24 37.48 68.24Q43.84 68.24 46 64.76Q48.16 61.28 48.16 53.96Q48.16 48.32 46.66 45.32Q45.16 42.32 41.08 42.32Q37.12 42.32 35.86 45.68Q34.60 49.04 34.60 54.32Q34.60 55.52 34.60 56.78Q34.60 58.04 34.60 59.36L14.56 59.36L14.56 53.48Q14.56 44.72 17.74 38.66Q20.92 32.60 26.86 29.48Q32.80 26.36 41.08 26.36Q49.48 26.36 55.48 29.36Q61.48 32.36 64.72 38.18Q67.96 44 67.96 52.64Q67.96 61.16 64.48 66.92Q61 72.68 56.08 74Q59.44 75.20 62.14 77.84Q64.84 80.48 66.40 84.98Q67.96 89.48 67.96 96.44Q67.96 105.32 65.38 112.16Q62.80 119 56.92 122.90Q51.04 126.80 41.32 126.80"/><path d="M106.72 125L81.88 125L81.88 27.80L106.48 27.80Q119.20 27.80 126.28 30.98Q133.36 34.16 136.24 40.94Q139.12 47.72 139.12 58.52L139.12 93.80Q139.12 104.72 136.24 111.62Q133.36 118.52 126.34 121.76Q119.32 125 106.72 125M103.36 42.80L103.36 110.12L106.72 110.12Q111.64 110.12 113.80 108.68Q115.96 107.24 116.50 104.36Q117.04 101.48 117.04 97.16L117.04 54.80Q117.04 50.48 116.38 47.84Q115.72 45.20 113.56 44Q111.40 42.80 106.60 42.80"/><path d="M170.80 125L150.52 125L168.88 27.80L193.36 27.80L211.48 125L191.68 125L188.44 104.48L174.16 104.48L170.80 125M181.24 53.72L176.08 91.64L186.40 91.64"/><path d="M245.80 125L224.32 125L224.32 27.80L251.08 27.80Q260.92 27.80 268.12 29.96Q275.32 32.12 279.34 37.70Q283.36 43.28 283.36 53.48Q283.36 59.48 282.40 64.16Q281.44 68.84 278.86 72.26Q276.28 75.68 271.48 77.96L284.80 125L262.60 125L251.92 81.44L245.80 81.44L245.80 125M245.80 42.20L245.80 69.08L251.80 69.08Q256.36 69.08 258.88 67.46Q261.40 65.84 262.42 62.78Q263.44 59.72 263.44 55.40Q263.44 49.16 261.16 45.68Q258.88 42.20 252.76 42.20"/><path d="M316.12 125L297.64 125L297.64 106.52L316.12 106.52"/></svg></div>');
  const pageLogo=document.querySelector('.ptr-logo'),letters=[...pageLogo.querySelectorAll('path')];
  const store={get:key=>{try{return sessionStorage.getItem(key)}catch{return null}},set:(key,value)=>{try{sessionStorage.setItem(key,value)}catch{}},remove:key=>{try{sessionStorage.removeItem(key)}catch{}}};
  let leaving=false,arrivalTimer;
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function animate(el,frames,options){
    const animation=el.animate(frames,options);
    let timer;
    await Promise.race([animation.finished.catch(()=>{}),new Promise(resolve=>{timer=setTimeout(()=>{try{animation.finish()}catch{}resolve()},options.duration+(options.delay||0)+500)})]);
    clearTimeout(timer);
  }
  function resetLogo(){
    pageLogo.getAnimations({subtree:true}).forEach(a=>a.cancel());
    pageLogo.style.opacity='0';
    letters.forEach(p=>{p.style.fill='#081a3b';p.style.fillOpacity='0';p.style.strokeDasharray=p.getTotalLength();p.style.strokeDashoffset=p.getTotalLength()});
  }
  function cleanup(){
    clearTimeout(arrivalTimer);resetLogo();
    document.getElementById('ptr-boot')?.remove();
    ptrPaths.forEach(p=>{p.getAnimations().forEach(a=>a.cancel());p.style.strokeDashoffset=p.dataset.len;p.style.strokeWidth='200px'});
    store.remove('ptr');store.remove('ptr-frame');
  }
  resetLogo();
  async function drawLogo(){
    resetLogo();pageLogo.style.opacity='1';
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    await Promise.all(letters.map((p,i)=>animate(p,[{strokeDashoffset:p.getTotalLength()},{strokeDashoffset:0}],{duration:1000,delay:i*75,easing:PTR_EASE,fill:'forwards'})));
    await Promise.all(letters.map(p=>animate(p,[{fillOpacity:0},{fillOpacity:1}],{duration:420,easing:'ease-out',fill:'forwards'})));
    await wait(200);
  }
  async function ptrLeave(){
    if(reduce)return;
    await Promise.all(ptrPaths.map(p=>animate(p,[{strokeDashoffset:p.dataset.len,strokeWidth:'200px'},{strokeDashoffset:0,strokeWidth:'700px'}],{duration:900,easing:PTR_EASE,fill:'forwards'})));
    ptrPaths.forEach(p=>{p.style.strokeDashoffset='0';p.style.strokeWidth='700px';p.getAnimations().forEach(a=>a.cancel())});
  }
  async function ptrEnter(){
    if(reduce){cleanup();return}
    await Promise.all(ptrPaths.map(p=>animate(p,[{strokeDashoffset:0,strokeWidth:'700px'},{strokeDashoffset:p.dataset.len,strokeWidth:'200px'}],{duration:1100,easing:PTR_EASE,fill:'forwards'})));
    ptrPaths.forEach(p=>{p.getAnimations().forEach(a=>a.cancel());p.style.strokeDashoffset=p.dataset.len;p.style.strokeWidth='200px'});
  }
  window.PTR={leave:ptrLeave,enter:ptrEnter};
  async function goWithStrokes(href){
    if(leaving)return;leaving=true;
    const target=new URL(href,location.href);
    if(/\/(contact|feedback)\.html$/.test(target.pathname)){
      cleanup();
      document.documentElement.dataset.feedbackTransition='true';
      // Both routes share the same real-document transition, without a competing loader.
      root.classList.remove('menu-open','menu-closing');root.style.overflow='';
      menu.style.visibility='hidden';
      requestAnimationFrame(()=>requestAnimationFrame(()=>{location.href=href}));return;
    }
    delete document.documentElement.dataset.feedbackTransition;
    const fallback=setTimeout(()=>{cleanup();location.href=href},3500);
    try{
      await ptrLeave();
      store.set('ptr','1');
      store.set('ptr-frame',document.querySelector('.ptr').outerHTML);
    }finally{clearTimeout(fallback);location.href=href}
  }
  const arrived=Boolean(store.get('ptr'));
  if(arrived&&!reduce){
    ptrPaths.forEach(p=>{p.style.strokeDashoffset='0';p.style.strokeWidth='700px'});
    // No stale filled-logo clone covers the new drawing: the destination owns the full sequence.
    document.getElementById('ptr-boot')?.remove();store.remove('ptr-frame');store.remove('ptr');
    arrivalTimer=setTimeout(cleanup,6500);
    (async()=>{
      try{
        await drawLogo();
        dispatchEvent(new Event('page-reveal'));
        await Promise.all([
          animate(pageLogo,[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(1.1)'}],{duration:650,easing:'ease-in',fill:'forwards'}),
          ptrEnter()
        ]);
      }finally{cleanup()}
    })().catch(cleanup);
  }else{cleanup();dispatchEvent(new Event('page-reveal'))}
  addEventListener('pageshow',event=>{
    if(!event.persisted)return;
    cleanup();leaving=false;open=false;menuPending=false;
    root.classList.remove('menu-open','menu-closing');root.style.overflow='';
    menu.setAttribute('inert','');burger.setAttribute('aria-expanded','false');
    menu.style.visibility='';
    delete root.dataset.feedbackTransition;
  });
  document.addEventListener('click',e=>{
    const a=e.target.closest?.('a[href]');
    if(!a||reduce||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank'||a.hasAttribute('download'))return;
    const url=new URL(a.href,location.href);
    if(url.origin!==location.origin||url.pathname===location.pathname)return;
    e.preventDefault();goWithStrokes(a.href);
  });
})();
