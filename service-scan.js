/* Scroll-11 reference: 20px randomized grid band sweeping down into real text.
   Kept as an HTML mask so the original copy stays selectable and accessible. */
(() => {
  const section=document.getElementById('services');
  if(!section)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cards=[...section.querySelectorAll('.service-card')];
  if(reduced)return;
  // Independent translate/rotate leave the opening transform and scan untouched.
  if(matchMedia('(hover: hover) and (pointer: fine)').matches){
    cards.forEach(card=>{
      let x=0,y=0,tx=0,ty=0,frame=0;
      function tick(){
        x+=(tx-x)*.12;y+=(ty-y)*.12;
        card.style.translate=(x*12)+'px '+(y*10)+'px';
        card.style.rotate=(-y)+' '+x+' 0 '+(Math.hypot(x,y)*2)+'deg';
        frame=Math.abs(tx-x)+Math.abs(ty-y)>.002?requestAnimationFrame(tick):0;
      }
      const kick=()=>{if(!frame)frame=requestAnimationFrame(tick)};
      // A document-level capture listener also sees events over text, icons,
      // and masks; the full card rectangle is the interaction area.
      document.addEventListener('pointermove',e=>{
        if(e.pointerType==='touch')return;
        const r=card.getBoundingClientRect();
        const inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
        const overSection=section.contains(e.target);
        const hit=inside&&overSection&&section.classList.contains('is-hover-ready');
        card.classList.toggle('pointer-active',hit);
        tx=hit?Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1)):0;
        ty=hit?Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1)):0;
        kick();
      },{capture:true,passive:true});
      document.documentElement.addEventListener('pointerleave',()=>{card.classList.remove('pointer-active');tx=ty=0;kick()});
    });
  }
  const clamp=x=>Math.max(0,Math.min(1,x));
  const fract=x=>x-Math.floor(x);
  const states=cards.map(card=>{
    const body=card.querySelector('.service-card__body');
    const band=document.createElement('canvas');band.className='service-scan-band';band.hidden=true;band.setAttribute('aria-hidden','true');card.append(band);
    const mask=document.createElement('canvas');
    card.dataset.serviceScan='true';
    const restored=section.classList.contains('is-open')&&section.classList.contains('is-hover-ready');
    return {card,body,band,mask,p:restored?1:0,lift:restored?1:0,target:restored?1:0};
  });
  let raf=0,openedAt=Infinity,releaseScroll=null;
  function draw(s){
    s.card.style.setProperty('--icon-progress',s.lift);
    // Zero progress must be completely clean; the shader boundary can otherwise
    // paint floating-point/random pixels even before the reveal starts.
    if(s.p<=0){s.band.hidden=true;return}
    s.band.hidden=s.p>=.999;
    const w=s.body.offsetWidth,h=s.body.offsetHeight;
    if(!w||!h)return;
    for(const c of [s.band,s.mask]){if(c.width!==w)c.width=w;if(c.height!==h)c.height=h}
    s.band.style.cssText='left:'+s.body.offsetLeft+'px;top:'+s.body.offsetTop+'px;width:'+w+'px;height:'+h+'px';
    const m=s.mask.getContext('2d'),b=s.band.getContext('2d');
    m.clearRect(0,0,w,h);b.clearRect(0,0,w,h);m.fillStyle='#fff';
    b.fillStyle=getComputedStyle(s.card).getPropertyValue('--scan-color').trim()||'#6ea8ff';
    const front=1.2-s.p*1.4;
    for(let y=0;y<h;y+=20)for(let x=0;x<w;x+=20){
      const gy=1-y/h,gx=x/w;
      const rand=fract(Math.sin(gx*12.9898+gy*78.233)*43758.5453123);
      if(gy>=front)m.fillRect(x,y,21,21);
      const d=Math.abs(gy-front),v=clamp(1-d/.2),smooth=v*v*(3-2*v);
      const alpha=d<=.2?clamp(smooth+rand-.5*(d>.2*rand?1:0)):0;
      b.globalAlpha=alpha;b.fillRect(x,y,20,20);
    }
    s.body.style.maskImage='url('+s.mask.toDataURL()+')';
    s.card.style.setProperty('--scan-progress',s.p);
    if(s.p>=.999){s.body.style.maskImage='none';s.band.hidden=true;s.card.classList.add('has-copy')}
  }
  function tick(){
    raf=0;let more=false;
    states.forEach(s=>{
      if(s.lift<s.target){
        s.lift=Math.min(s.target,s.lift+.024);draw(s);more=true;
      }else if(s.p<s.target){
        s.p=Math.min(s.target,s.p+.018);draw(s);if(s.p<s.target)more=true;
      }
    });
    if(more)raf=requestAnimationFrame(tick);
    else if(releaseScroll){releaseScroll();releaseScroll=null}
  }
  function kick(){if(!raf)raf=requestAnimationFrame(tick)}
  window.SERVICE_SCAN={
    advance(delta,freshGesture=true){
      if(states.every(s=>s.p>=.999))return false;
      if(!freshGesture||!section.classList.contains('is-open'))return true;
      if(!releaseScroll)releaseScroll=window.beginServiceScrollLock?.()||null;
      states.forEach(s=>{s.target=1});
      kick();return true;
    }
  };
  new MutationObserver(()=>{
    if(section.classList.contains('is-open')&&!Number.isFinite(openedAt))openedAt=performance.now();
  }).observe(section,{attributes:true,attributeFilter:['class']});
  function scroll(){
    if(!section.classList.contains('is-open')||performance.now()-openedAt<1550)return;
    states.forEach(s=>{
      const r=s.card.getBoundingClientRect();
      if(r.top<innerHeight*.72&&r.bottom>innerHeight*.2)s.target=Math.max(s.target,clamp((innerHeight*.72-r.top)/(innerHeight*.45)));
    });kick();
  }
  // Copy is released by the next deliberate gesture, never by layout movement.
  addEventListener('resize',()=>states.forEach(draw));
  states.forEach(draw);
  document.fonts?.ready.then(()=>states.forEach(draw));
})();
