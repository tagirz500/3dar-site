import { Mesh, Program, Renderer, Triangle } from 'ogl';

const vertex = `#version 300 es
in vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uScroll;
uniform float uTime,uSpeed,uScale,uRotation,uLayers,uWaveAmplitude,uWaveFrequency,uWaveSpeed,uLayerSpeed,uTwist,uTwistFrequency,uTwistSpeed,uLineFrequency,uLineSpacing,uLineSharpness,uGlowFalloff,uGlowIntensity,uBrightness,uBlueBoost,uVignette,uGrain,uRotationSpeed;
uniform vec3 uLineColor,uGlowColor;
out vec4 fragColor;
#define MAX_LAYERS 10
mat2 rotate2d(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
float grainHash(vec2 p){p=floor(p);return fract(52.9829189*fract(dot(p,vec2(.065,.005))));}
float fieldNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(grainHash(i),grainHash(i+vec2(1,0)),f.x),mix(grainHash(i+vec2(0,1)),grainHash(i+vec2(1,1)),f.x),f.y);}
float layeredGrain(vec2 p){p=mod(p+vec2(uTime*30.0,-uTime*21.0),1024.0);vec2 r=mat2(.8,-.5,.5,.8)*p;float g=0.0;g+=.40*grainHash(r);g+=.25*grainHash(r*2.0+17.0);g+=.20*grainHash(r*4.0+47.0);g+=.10*grainHash(r*8.0+113.0);g+=.05*grainHash(r*16.0+191.0);return g;}
void main(){
  vec2 resolution=max(uResolution,vec2(1.0));
  vec2 uv=(2.0*gl_FragCoord.xy-resolution)/resolution.y;
  float time=uTime*uSpeed;
  vec3 backdrop=vec3(.070588,.058824,.090196);
  vec3 centerTone=max(uLineColor*.85567-uGlowColor*.06186,vec3(0.0));
  vec3 cloudTone=uLineColor*.19588+uGlowColor*.2268;
  vec2 p=uv/max(uScale,.05);
  p=rotate2d(radians(uRotation)+time*uRotationSpeed)*p;
  // Travel through a continuous field without wrapping at section boundaries.
  p+=vec2(0.0,uScroll*.00065+time*.04);
  vec2 warp=vec2(fieldNoise(p*.73+vec2(11.3,7.1)),fieldNoise(p*.57+vec2(31.7,19.4)))-.5;
  p+=warp*.65;
  vec3 color=vec3(0.0);
  for(int index=0;index<MAX_LAYERS;index++){
    float fi=float(index)+1.0;if(fi>uLayers)break;
    p+=uWaveAmplitude*sin(p.yx*fi*uWaveFrequency+time*(uWaveSpeed+fi*uLayerSpeed));
    float radius=length(p),angle=atan(p.y,p.x);
    angle+=sin(radius*uTwistFrequency-time*uTwistSpeed+fi)*uTwist;
    p=vec2(cos(angle),sin(angle))*radius;
    float lines=abs(sin(p.x*(uLineFrequency+fi*uLineSpacing)+sin(p.y*3.0+time)));
    lines=pow(max(0.0,1.0-lines),uLineSharpness);
    color+=uLineColor*lines/fi;
    float glow=exp(-uGlowFalloff*abs(sin(p.x*3.0+time+fi)));
    color+=uGlowColor*glow*uGlowIntensity/(fi*2.0);
  }
  float center=exp(-2.2*dot(uv,uv));color+=centerTone*center;
  float cloud=exp(-1.5*length(uv+vec2(sin(time*.3)*.25,cos(time*.25)*.18)));color+=cloudTone*cloud;
  float vignette=1.0-smoothstep(.35,1.45,length(uv));color*=mix(1.0-uVignette,1.0,vignette);
  color=1.0-exp(-color*uBrightness);color.b*=uBlueBoost;
  vec3 outputColor=backdrop+color;
  float noise=(layeredGrain(gl_FragCoord.xy)-.5)*uGrain;
  fragColor=vec4(clamp(outputColor+noise,0.0,1.0),1.0);
}`;

const rgb = hex => {
  const value=hex.replace('#','');
  return new Float32Array([0,2,4].map(i=>parseInt(value.slice(i,i+2),16)/255));
};

window.mountGhostFibers = container => {
  if (!container || container.dataset.mounted) return () => {};
  container.dataset.mounted='true';
  const renderer=new Renderer({webgl:2,alpha:false,antialias:false,dpr:.75});
  const gl=renderer.gl,canvas=gl.canvas;
  canvas.setAttribute('aria-hidden','true');container.appendChild(canvas);
  const uniforms={
    uScroll:{value:window.scrollY},
    uResolution:{value:new Float32Array([1,1])},uTime:{value:0},uSpeed:{value:.2},uScale:{value:2},uRotation:{value:0},uRotationSpeed:{value:0},uLayers:{value:4},
    uWaveAmplitude:{value:.015},uWaveFrequency:{value:3},uWaveSpeed:{value:.15},uLayerSpeed:{value:.08},uTwist:{value:.1},uTwistFrequency:{value:5},uTwistSpeed:{value:1.2},
    uLineFrequency:{value:5},uLineSpacing:{value:2},uLineSharpness:{value:16},uGlowFalloff:{value:10},uGlowIntensity:{value:1.6},uBrightness:{value:.2},uBlueBoost:{value:1.25},
    uVignette:{value:.47},uGrain:{value:.05},uLineColor:{value:rgb('#003893')},uGlowColor:{value:rgb('#3437A0')}
  };
  const program=new Program(gl,{vertex,fragment,uniforms}),mesh=new Mesh(gl,{geometry:new Triangle(gl),program});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,elapsed=0,previous=performance.now(),visible=true,pageVisible=!document.hidden;
  const render=()=>{uniforms.uScroll.value=reduced.matches?0:window.scrollY;renderer.render({scene:mesh})};
  const resize=()=>{const r=container.getBoundingClientRect();renderer.setSize(Math.max(1,Math.floor(r.width)),Math.max(1,Math.floor(r.height)));uniforms.uResolution.value[0]=gl.drawingBufferWidth;uniforms.uResolution.value[1]=gl.drawingBufferHeight;render()};
  const canRun=()=>visible&&pageVisible&&!reduced.matches;
  const stop=()=>{if(frame)cancelAnimationFrame(frame);frame=0};
  const loop=now=>{frame=0;if(!canRun())return;elapsed+=Math.min((now-previous)/1000,.1);previous=now;uniforms.uTime.value=elapsed;render();frame=requestAnimationFrame(loop)};
  const start=()=>{if(!canRun()||frame)return;previous=performance.now();frame=requestAnimationFrame(loop)};
  const ro=new ResizeObserver(resize);ro.observe(container);
  const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;visible?start():stop()});io.observe(container);
  const visibility=()=>{pageVisible=!document.hidden;pageVisible?start():stop()};
  const motion=()=>{reduced.matches?(stop(),render()):start()};
  document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',motion);
  resize();start();
  return ()=>{stop();ro.disconnect();io.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motion);canvas.remove();gl.getExtension('WEBGL_lose_context')?.loseContext()};
};
