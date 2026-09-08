import {gsap} from 'gsap';
import {SplitText} from 'gsap/SplitText';
// User-supplied text-18: line blur, alpha-threshold matrix, original timing.
gsap.registerPlugin(SplitText);
const running=new WeakMap();
function clear(e){const old=running.get(e);if(old){old.tween?.kill();old.split.revert();running.delete(e)}}
function scan(e){
 if(running.has(e)&&e.querySelector('.hero-goo-line'))return;
 const content=e.innerHTML;clear(e);e.innerHTML=content;
 if(!e.textContent.trim()||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 if(!document.getElementById('hero-blur-matrix'))document.body.insertAdjacentHTML('beforeend','<svg aria-hidden="true" style="position:absolute;width:0;height:0;pointer-events:none"><defs><filter id="hero-blur-matrix" x="-50%" y="-50%" width="200%" height="200%"><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140"/></filter></defs></svg>');
 const split=SplitText.create(e,{type:'lines',linesClass:'hero-goo-line'});
 const layers=split.lines.map(line=>{const inner=document.createElement('span');while(line.firstChild)inner.appendChild(line.firstChild);line.append(inner);line.style.filter='url(#hero-blur-matrix) blur(0.4px)';inner.style.display='inline-block';return inner});
 const entry={split,tween:null};running.set(e,entry);gsap.set(layers,{filter:'blur(0.35em)'});
 entry.tween=gsap.to(layers,{filter:'blur(0em)',duration:1.5,ease:'power3.out',stagger:.1,onComplete:()=>{if(running.get(e)===entry){split.revert();running.delete(e)}}});
}
window.HERO_TEXT={scan,clear};
