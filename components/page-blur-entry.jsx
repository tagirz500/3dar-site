import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import GradualBlur from './GradualBlur';
function PageBlur(){
  const [opacity,setOpacity]=useState(1);
  useEffect(()=>{
    const update=()=>setOpacity(Math.min(1,Math.max(0,(document.documentElement.scrollHeight-innerHeight-scrollY)/96)));
    update();addEventListener('scroll',update,{passive:true});addEventListener('resize',update);
    return()=>{removeEventListener('scroll',update);removeEventListener('resize',update)};
  },[]);
  return <GradualBlur target="page" position="bottom" height="6rem" strength={2} divCount={5} curve="bezier" exponential opacity={opacity} zIndex={-64}/>;
}
const host=document.createElement('div');host.className='page-blur-host';host.setAttribute('aria-hidden','true');document.body.append(host);createRoot(host).render(<PageBlur/>);
