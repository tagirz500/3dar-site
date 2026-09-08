/* Scroll at the page boundary uses the same navigation as the form button. */
(() => {
  if(!document.body.classList.contains('contact-page'))return;
  const feedback=document.body.classList.contains('feedback-page');
  let sum=0,last=0,touch=0,ready=performance.now()+1800;
  const excluded=target=>target.closest('input,textarea,select,.menu,.burger,[contenteditable]');
  function move(delta,target,event){
    if(performance.now()<ready||excluded(target)||document.documentElement.classList.contains('menu-open'))return;
    const boundary=feedback?scrollY<=2:true;
    if(!boundary|| (feedback?delta>=0:delta<=0)){sum=0;return}
    if(event?.cancelable)event.preventDefault();
    const now=performance.now();if(now-last>220)sum=0;last=now;sum+=Math.abs(delta);
    if(sum<40)return;
    sum=0;ready=Infinity;
    const destination=feedback?'contact.html':'feedback.html';
    if(window.navigateSite)window.navigateSite(destination);else location.assign(destination);
  }
  addEventListener('wheel',e=>{if(!e.ctrlKey)move(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1),e.target,e)},{passive:false});
  addEventListener('touchstart',e=>{touch=e.touches[0].clientY},{passive:true});
  addEventListener('touchend',e=>move(touch-e.changedTouches[0].clientY,e.target),{passive:true});
  addEventListener('pageshow',()=>{ready=performance.now()+1800;sum=0});
  // Retain an unfinished callback when reversing back to the contact methods.
  const form=document.querySelector('.callback-form');
  if(form){
    try{const draft=JSON.parse(sessionStorage.getItem('callback-draft')||'{}');for(const field of form.elements)if(field.name&&draft[field.name]!=null)field.value=draft[field.name]}catch{}
    form.addEventListener('input',()=>{try{sessionStorage.setItem('callback-draft',JSON.stringify(Object.fromEntries(new FormData(form))))}catch{}});
  }
})();
