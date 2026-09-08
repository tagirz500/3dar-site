import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import LiquidGlass from 'liquid-glass-react';
import SpecularButton from './SpecularButton';

function Surface({target}) {
  const measure=()=>({width:target.offsetWidth,height:target.offsetHeight,radius:parseFloat(getComputedStyle(target).borderTopLeftRadius)||20});
  const [size,setSize]=useState(measure);
  useEffect(()=>{
    const observer=new ResizeObserver(()=>setSize(measure()));
    observer.observe(target);return()=>observer.disconnect();
  },[target]);
  const icon=target.classList.contains('contact-icon');
  return <><LiquidGlass padding="0" cornerRadius={size.radius}
    displacementScale={icon?48:30} blurAmount={.07} saturation={135}
    aberrationIntensity={1.3} elasticity={icon||matchMedia('(prefers-reduced-motion: reduce)').matches?0:.06}
    mode="standard" mouseContainer={{current:target}}
    style={{position:'absolute',top:'50%',left:'50%'}}>
    <div style={{width:size.width,height:size.height}} />
  </LiquidGlass>{icon&&<SpecularButton className="icon-specular-rim" radius={size.radius} tintOpacity={0} blur={0} lineColor="#ffffff" baseColor="#525252" intensity={1} shineSize={10} shineFade={40} thickness={1} speed={.35} followMouse proximity={250} autoAnimate={false}>{null}</SpecularButton>}</>;
}
document.querySelectorAll('.contact-icon,.why-grid > article').forEach(target=>{
  const host=document.createElement('span');host.className='liquid-surface';host.setAttribute('aria-hidden','true');
  target.classList.add('has-liquid-glass');target.prepend(host);
  createRoot(host).render(<Surface target={target}/>);
  if(target.matches('.why-grid > article')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    target.style.transition='transform .35s ease-out';
    target.addEventListener('pointermove',event=>{
      const r=target.getBoundingClientRect(),x=(event.clientX-r.left)/r.width-.5,y=(event.clientY-r.top)/r.height-.5;
      target.style.setProperty('--glass-parallax',`perspective(1000px) translate3d(${x*6}px,${y*6}px,0) rotateX(${-y*5}deg) rotateY(${x*5}deg)`);
    });
    target.addEventListener('pointerleave',()=>{target.style.setProperty('--glass-parallax','none')});
  }
});
