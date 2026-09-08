// Preserve the covered frame across document navigation, before the page paints.
(() => {
  if(/\/(contact|feedback)\.html$/.test(location.pathname)) document.documentElement.dataset.feedbackTransition='true';
  try {
    const frame=sessionStorage.getItem('ptr-frame');
    if(!frame)return;
    const cover=document.createElement('div');cover.id='ptr-boot';
    cover.style.cssText='position:fixed;inset:0;z-index:500;pointer-events:all';
    cover.innerHTML=frame;document.documentElement.append(cover);
    setTimeout(()=>cover.remove(),8000);
  } catch {}
})();
