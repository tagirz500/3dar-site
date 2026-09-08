import {ARTWORKS,mod,layout,visibleCards,hitCard,project} from './geometry.js';
import {WebGLRenderer,CanvasRenderer} from './renderer.js';
import {Water} from './water.js';
const original=document.querySelector('.proj')||document.querySelector('#wall-track');
const isProject = Boolean(ARTWORKS[0]?.project);
const hall=document.createElement('section');hall.className='mirror-gallery';hall.setAttribute('aria-label','3D ролики');
hall.innerHTML='<div class="mirror-caption"><span></span><h2></h2><button type="button">Смотреть видео ↗</button></div><canvas tabindex="0" aria-label="Галерея: стрелки для выбора, Enter для просмотра"></canvas><div class="mirror-controls"><button type="button" aria-label="Предыдущее видео">←</button><button type="button" aria-label="Следующее видео">→</button></div>';
original.before(hall);
let canvas=hall.querySelector('canvas');const caption=hall.querySelector('.mirror-caption');
const dialog=document.createElement('dialog');dialog.className='video-stream-player';dialog.innerHTML='<button type="button" aria-label="Закрыть видео">×</button><div></div>';document.body.append(dialog);
let opening=null,flight=null,openToken=0;
const easePack=t=>t<.5?8*t*t*t*t:1-Math.pow(-2*t+2,4)/2;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const open=async()=>{
  if(opening||dialog.open)return;
  const art=ARTWORKS[mod(Math.round(position))];
  const token=++openToken;
  target=position;drag=null;clearTimeout(wheelTimer);
  const chosen=cards.find(c=>c.index===mod(Math.round(position)));
  if(!chosen)return;
  opening={id:chosen.id,start:performance.now()};
  hall.classList.add('is-opening');kick();
  try{
    if(!motion.matches)await sleep(1300);
    if(token!==openToken)return;
    const corners=[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>project(u,v,chosen.angle,config));
    const bounds=canvas.getBoundingClientRect();
    const left=Math.min(...corners.map(p=>p.x))+bounds.left,top=Math.min(...corners.map(p=>p.y))+bounds.top;
    const width=Math.max(...corners.map(p=>p.x))-Math.min(...corners.map(p=>p.x));
    const height=Math.max(...corners.map(p=>p.y))-Math.min(...corners.map(p=>p.y));
    const image=document.createElement('img');image.src=art.src;image.alt=art.title;image.className='video-flight';
    const maxW=innerWidth*.88,maxH=innerHeight*.86,w=Math.min(maxW,maxH*16/9),h=w*9/16;
    image.style.cssText='position:fixed;z-index:600;object-fit:contain;border-radius:12px;pointer-events:none;left:'+left+'px;top:'+top+'px;width:'+width+'px;height:'+height+'px';
    flight=image;document.body.append(image);
    if(!motion.matches){
      const animation=image.animate([{left:left+'px',top:top+'px',width:width+'px',height:height+'px'},{left:(innerWidth-w)/2+'px',top:(innerHeight-h)/2+'px',width:w+'px',height:h+'px'}],{duration:1000,easing:'cubic-bezier(.76,0,.24,1)',fill:'forwards'});
      await Promise.race([animation.finished.catch(()=>{}),sleep(1400)]);
    }
    if(token!==openToken)return;
    const iframe=document.createElement('iframe');iframe.src='https://kinescope.io/embed/'+art.id+'?autoplay=1';iframe.title=art.title;iframe.allow='autoplay; fullscreen; picture-in-picture';iframe.allowFullscreen=true;
    const removeFlight=()=>{image.remove();if(flight===image)flight=null};
    iframe.addEventListener('load',removeFlight,{once:true});setTimeout(removeFlight,4000);
    dialog.querySelector('div').replaceChildren(iframe);dialog.showModal();
  }catch(error){console.error('Video opening failed',error);flight?.remove();flight=null;opening=null;hall.classList.remove('is-opening')}
};
addEventListener('keydown',event=>{if(event.key==='Escape'&&opening&&!dialog.open){openToken++;flight?.remove();flight=null;opening=null;hall.classList.remove('is-opening');kick()}});
dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{openToken++;flight?.remove();flight=null;opening=null;hall.classList.remove('is-opening');dialog.querySelector('div').replaceChildren();lastInput=performance.now();kick()});caption.querySelector('button').onclick=open;
const motion=matchMedia('(prefers-reduced-motion: reduce)');
if(isProject){hall.setAttribute('aria-label','Библиотека проектов');caption.querySelector('button').textContent='Открыть проект ↗';canvas.setAttribute('aria-label','Проекты: стрелки для выбора, Enter для просмотра')}
let paused=true,position=0,target=0,selected=-1,renderer,config,cards=[],raf=0,previous=0,time=0,visible=true,lastInput=performance.now(),drag=null,wheelTimer;
const water=new Water(),hover=new Map();
function select(delta){if(opening)return;target=Math.round(target)+delta;lastInput=performance.now();kick()}
const buttons=hall.querySelectorAll('.mirror-controls button');buttons[0].onclick=()=>select(-1);buttons[1].onclick=()=>select(1);
function resize(){config=layout(hall.clientWidth,hall.clientHeight);const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(config.width*dpr);canvas.height=Math.round(config.height*dpr);kick()}
function frame(now){
 raf=0;if(!visible||document.hidden||!renderer)return;
 const dt=Math.min((now-(previous||now-16))/1000,.04);previous=now;
 if(!motion.matches&&!dialog.open)time+=dt;
 if(!paused&&!drag&&!dialog.open&&now-lastInput>4500&&!hall.contains(document.activeElement))target+=dt*.11;
 // Frame-rate-independent exponential easing from the previously selected slider pack.
 position=motion.matches?target:position+(target-position)*(1-Math.pow(.925,dt*60));
 cards=visibleCards(position,config);water.update(time);
 if(opening){
   const others=cards.filter(card=>card.id!==opening.id).sort((a,b)=>a.id-b.id);
   others.forEach((card,i)=>{card.sink=motion.matches?1:easePack(Math.max(0,Math.min(1,(now-opening.start-i*100)/1000)))});
 }
 renderer.render(cards,config,time,Math.abs(target-position),hover,canvas.width/config.width,water,time);
 const index=mod(Math.round(position));
 if(index!==selected){selected=index;caption.querySelector('h2').textContent=ARTWORKS[index].title;caption.querySelector('span').textContent=String(index+1).padStart(2,'0')+' / '+ARTWORKS.length;if(!motion.matches)caption.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'ease-out'})}
 if(!motion.matches||Math.abs(position-target)>.001)kick();
}
function kick(){if(!raf&&renderer)raf=requestAnimationFrame(frame)}
function bind(){
 ['wheel','pointerdown','pointermove','pointerup','keydown'].forEach(type=>canvas.addEventListener(type,e=>{if(opening){e.preventDefault();e.stopImmediatePropagation()}},{capture:true,passive:false}));
 const point=e=>{const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
 const hit=e=>{const p=point(e);return hitCard(p.x,p.y,cards,config)||hitCard(p.x,p.y-30,cards,config)||hitCard(p.x,p.y+30,cards,config)};
 canvas.addEventListener('wheel',e=>{if(!hit(e))return;e.preventDefault();target+=Math.max(-1,Math.min(1,(e.deltaX+e.deltaY)*(e.deltaMode===1?16:1)*.003));lastInput=performance.now();clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{target=Math.round(target);kick()},160);kick()},{passive:false});
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!hit(e))return;drag={x:e.clientX,start:e.clientX,moved:false};canvas.setPointerCapture(e.pointerId);lastInput=performance.now()});
 canvas.addEventListener('pointermove',e=>{const p=point(e);if(!motion.matches)water.pointer(p.x,p.y,hitCard(p.x,p.y,cards,config),config);if(!drag)return;if(Math.abs(e.clientX-drag.start)>5)drag.moved=true;target+=(drag.x-e.clientX)/config.spacing;drag.x=e.clientX;lastInput=performance.now();kick()});
 canvas.addEventListener('pointerup',e=>{if(!drag)return;const moved=drag.moved;drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(!moved){const card=hit(e);if(card){if(card.index===mod(Math.round(position)))open();else target=card.id}}else target=Math.round(target);lastInput=performance.now();kick()});
 canvas.addEventListener('pointercancel',()=>{drag=null;target=Math.round(target);kick()});
 canvas.addEventListener('pointerleave',()=>water.leave());
 canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Enter',' '].includes(e.key)){e.preventDefault();if(e.key==='Enter')open();else if(e.key===' ')return;else select(e.key==='ArrowRight'?1:-1)}});
}
async function start(){
 const images=await Promise.all(ARTWORKS.map(art=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=art.src})));
 try{renderer=new WebGLRenderer(canvas,images)}catch{const next=canvas.cloneNode();canvas.replaceWith(next);canvas=next;renderer=new CanvasRenderer(canvas,images)}
 original.hidden=true;document.body.classList.add(isProject?'mirror-home-page':'mirror-video-page');resize();bind();new ResizeObserver(resize).observe(hall);
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;previous=0;if(visible)kick();else{cancelAnimationFrame(raf);raf=0}}).observe(hall);
 document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;previous=0;kick()});kick();
}
start().catch(error=>{console.error('Mirror gallery could not start',error);hall.remove();original.hidden=false});
