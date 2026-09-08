// Preserve the covered frame across document navigation, before the page paints.
(() => {
  try{
    if(sessionStorage.getItem('pixel-feedback')===location.pathname.split('/').pop()){
      document.documentElement.dataset.pixelTransition='true';
      const cover=document.createElement('div');cover.id='route-pixels';cover.setAttribute('aria-hidden','true');
      cover.style.cssText='position:fixed;inset:0;z-index:10000;display:grid;grid-template-columns:repeat(17,1fr);grid-template-rows:repeat(9,1fr)';
      for(let i=0;i<153;i++){const cell=document.createElement('i');cell.style.cssText='background:var(--bg,#040c24);transform:scale(1.03);opacity:1';cover.append(cell)}
      document.documentElement.append(cover);setTimeout(()=>cover.remove(),5000);
    }
  }catch{}
  const motion=document.createElement('script');motion.src='route-motion.js';motion.async=false;document.head.append(motion);
  const motionCSS=document.createElement('link');motionCSS.rel='stylesheet';motionCSS.href='route-motion.css';document.head.append(motionCSS);
  try {
    const frame=sessionStorage.getItem('ptr-frame');
    if(!frame)return;
    const cover=document.createElement('div');cover.id='ptr-boot';
    cover.style.cssText='position:fixed;inset:0;z-index:500;pointer-events:all';
    cover.innerHTML=frame;document.documentElement.append(cover);
    setTimeout(()=>cover.remove(),8000);
  } catch {}
})();
