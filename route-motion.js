/* Supplied PixelTransition demo4 is reserved for Contacts <-> feedback.
   Real document navigation is retained; no duplicated live forms or scroll locks. */
(() => {
  const root=document.documentElement, reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const read=k=>{try{return sessionStorage.getItem(k)}catch{return null}};
  const put=(k,v)=>{try{sessionStorage.setItem(k,v)}catch{}};
  const del=k=>{try{sessionStorage.removeItem(k)}catch{}};
  const path=location.pathname.split('/').pop();
  let navigating=false;
  function grid(){
    let el=document.getElementById('route-pixels');
    if(el)return el;
    el=document.createElement('div');el.id='route-pixels';el.setAttribute('aria-hidden','true');
    for(let i=0;i<153;i++)el.append(document.createElement('i'));
    document.documentElement.append(el);return el;
  }
  async function pixels(show,reverse=false){
    const el=grid(), cells=[...el.children];
    const distances=cells.map((_,i)=>Math.hypot(i%17-8,Math.floor(i/17)-4));
    const max=Math.max(...distances);
    await Promise.all(cells.map((cell,i)=>{
      const delay=((show!==reverse)?max-distances[i]:distances[i])*35;
      const a=cell.animate(show?[{transform:'scale(0)',opacity:0},{transform:'scale(1.03)',opacity:1}]:[{transform:'scale(1.03)',opacity:1},{transform:'scale(0)',opacity:0}],{duration:250,delay,easing:show?'ease-in':'ease-out',fill:'both'});
      return a.finished.catch(()=>{});
    }));
    if(!show)el.remove();
  }
  function isFeedback(target){return target==='feedback.html'||(path==='feedback.html'&&target==='contact.html')}
  window.ROUTE_MOTION={
    handles:url=>isFeedback(url.pathname.split('/').pop()),
    async navigate(href){
      if(navigating)return;navigating=true;
      const target=new URL(href,location.href).pathname.split('/').pop();
      if(reduce){location.href=href;return}
      delete root.dataset.feedbackTransition;
      del('feedback-direction');del('pixel-contact');
      const reverse=target==='contact.html';
      // Disable native crossfade here: the pixel cover owns this route.
      root.dataset.pixelTransition='true';put('pixel-feedback',target);put('pixel-direction',reverse?'reverse':'forward');
      const fallback=setTimeout(()=>{location.href=href},2200);
      try{
        const content=document.querySelector('main,.library-shell');
        content?.animate([{transform:'scale(1)',opacity:1},{transform:'scale(.75)',opacity:0}],{duration:700,easing:'ease-in',fill:'forwards'});
        await pixels(true,reverse);
      }finally{clearTimeout(fallback);location.href=href}
    }
  };
  del('feedback-direction');del('pixel-contact');
  if(read('pixel-feedback')===path){
    const reverse=read('pixel-direction')==='reverse';
    root.dataset.pixelTransition='true';del('pixel-feedback');del('pixel-direction');
    const cover=grid();cover.querySelectorAll('i').forEach(c=>{c.style.transform='scale(1.03)';c.style.opacity='1'});
    const reveal=()=>{
      const entrance=document.querySelector('main')?.animate([{transform:'scale(.5)',opacity:0},{transform:'scale(1)',opacity:1}],{duration:800,easing:'cubic-bezier(.16,1,.3,1)'});
      // Glass measures its host in screen coordinates. Refresh only after scale settles.
      entrance?.finished.catch(()=>{}).then(()=>dispatchEvent(new Event('resize')));
      pixels(false,reverse).finally(()=>{delete root.dataset.pixelTransition});
    };
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',reveal,{once:true});else reveal();
    setTimeout(()=>cover.remove(),3000);
  }
  addEventListener('pageshow',e=>{
    if(e.persisted){
      navigating=false;document.getElementById('route-pixels')?.remove();
      document.querySelector('main,.library-shell')?.getAnimations().forEach(a=>a.cancel());
      delete root.dataset.pixelTransition;delete root.dataset.feedbackTransition;
    }
  });
})();
