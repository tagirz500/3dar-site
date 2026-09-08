// Supplied Drive defaultTransition, scoped exclusively to the feedback-form button.
import {gsap} from 'gsap';
import {CustomEase} from 'gsap/CustomEase';
gsap.registerPlugin(CustomEase);
const ease=CustomEase.create('contactPage','M0,0 C0.38,0.05 0.48,0.58 0.65,0.82 0.82,1 1,1 1,1');
let active=false;
document.querySelector('.form-jump')?.addEventListener('click',event=>{
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(active)return;
  const old=document.querySelector('.contact-methods'),next=document.getElementById('callback');
  if(!old||!next)return;
  active=true;
  const oldStyle=old.getAttribute('style'),nextStyle=next.getAttribute('style');
  let done=false,timer;
  const finish=()=>{
    if(done)return;done=true;clearTimeout(timer);
    oldStyle===null?old.removeAttribute('style'):old.setAttribute('style',oldStyle);
    nextStyle===null?next.removeAttribute('style'):next.setAttribute('style',nextStyle);
    next.scrollIntoView({behavior:'instant',block:'start'});
    history.replaceState(null,'','#callback');
    next.querySelector('h2')?.focus({preventScroll:true});active=false;
  };
  gsap.set(next,{clipPath:'inset(100% 0% 0% 0%)',position:'fixed',top:0,left:0,width:'100%',height:'100svh',overflow:'hidden',margin:0,zIndex:190,background:getComputedStyle(document.body).backgroundColor});
  const timeline=gsap.timeline({onComplete:finish,onInterrupt:finish})
    .to(old,{y:'-30vh',opacity:.4,scale:.8,duration:.7,force3D:true,ease},0)
    .to(next,{clipPath:'inset(0% 0% 0% 0%)',duration:.7,force3D:true,ease},0);
  timer=setTimeout(()=>{timeline.progress(1);finish()},1500);
},true);
