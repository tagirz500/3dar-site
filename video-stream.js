// Exponential slider geometry and interpolation from the supplied sliders-22 demo.
(() => {
  const originals=[...document.querySelectorAll('.vid[data-kin]')];
  if(!originals.length)return;
  document.body.classList.add('video-stream-page');
  const data=originals.map(b=>({id:b.dataset.kin,title:b.dataset.name,src:b.querySelector('img').getAttribute('src')}));
  const gallery=document.querySelector('.proj');gallery.hidden=true;
  const slider=document.createElement('section');slider.className='video-stream';slider.setAttribute('aria-label','3D ролики');
  gallery.before(slider);
  const controls=document.createElement('div');controls.className='video-stream-controls';
  controls.innerHTML='<button type="button" aria-label="Предыдущее видео">←</button><span></span><button type="button" aria-label="Следующее видео">→</button>';
  slider.after(controls);
  const player=document.createElement('dialog');player.className='video-stream-player';
  player.innerHTML='<button type="button" aria-label="Закрыть видео">×</button><div></div>';
  document.body.append(player);
  const close=()=>{player.close();player.querySelector('div').replaceChildren()};
  player.querySelector('button').onclick=close;player.addEventListener('cancel',()=>player.querySelector('div').replaceChildren());
  player.addEventListener('click',e=>{if(e.target===player)close()});
  const open=item=>{const iframe=document.createElement('iframe');iframe.src=`https://kinescope.io/embed/${item.id}?autoplay=1`;iframe.title=item.title;iframe.allow='autoplay; fullscreen; picture-in-picture';iframe.allowFullscreen=true;player.querySelector('div').replaceChildren(iframe);player.showModal()};
  const growth=.25,ratio=Math.exp(growth),minSize=.1,count=Math.ceil(Math.log(1+(ratio-1)/minSize)/growth)+4;
  const edge=(position,width)=>width*minSize*(Math.pow(ratio,position)-1)/(ratio-1);
  const wrap=(n,max)=>((n%max)+max)%max;
  let scroll=0,target=0,raf=0,drag=null,moved=false,visible=true;
  const slides=Array.from({length:count},(_,i)=>{
    const button=document.createElement('button');button.type='button';button.className='video-stream-slide';button.innerHTML='<img alt=""><span></span>';
    slider.append(button);button.addEventListener('click',()=>{if(!moved)open(data[Number(button.dataset.index)])});
    return {button,index:i};
  });
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function render(){
    raf=0;if(!visible)return;
    scroll=reduced?target:scroll+(target-scroll)*.075;
    const width=slider.clientWidth;
    for(const s of slides){
      while(edge(s.index+scroll,width)>width)s.index-=count;
      while(edge(s.index+scroll+1,width)<0)s.index+=count;
      const left=Math.round(edge(s.index+scroll,width)),right=Math.round(edge(s.index+scroll+1,width)),w=right-left;
      const i=wrap(s.index,data.length),item=data[i];
      if(s.button.dataset.index!==String(i)){
        s.button.dataset.index=i;s.button.querySelector('img').src=item.src;s.button.querySelector('span').textContent=item.title;s.button.setAttribute('aria-label','Смотреть: '+item.title);
      }
      s.button.style.cssText=`width:${w}px;height:${w/(16/9)}px;z-index:${Math.round(right)};transform:translateX(${left}px)`;
    }
    controls.querySelector('span').textContent=`${data.length} роликов`;
    if(Math.abs(target-scroll)>.001)raf=requestAnimationFrame(render);
  }
  const kick=()=>{if(!raf)raf=requestAnimationFrame(render)};
  const overImage=e=>slides.some(({button})=>{
    const r=button.getBoundingClientRect();
    return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top-30&&e.clientY<=r.bottom+30;
  });
  slider.addEventListener('wheel',e=>{if(!overImage(e))return;e.preventDefault();target+=(e.deltaY+e.deltaX)*(e.deltaMode===1?16:1)*3.5*.0014;kick()},{passive:false});
  slider.addEventListener('pointerdown',e=>{if(!overImage(e))return;drag=e.clientX;moved=false});
  slider.addEventListener('pointermove',e=>{if(drag===null)return;const dx=drag-e.clientX;if(Math.abs(dx)>3)moved=true;target+=dx*3.5*-.005;drag=e.clientX;kick()});
  addEventListener('pointerup',()=>{drag=null});slider.addEventListener('pointercancel',()=>{drag=null});
  controls.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{target+=i?1:-1;kick()});
  slider.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();target+=e.key==='ArrowRight'?1:-1;kick()}});
  new ResizeObserver(kick).observe(slider);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)kick();else{cancelAnimationFrame(raf);raf=0}}).observe(slider);
  render();
})();
