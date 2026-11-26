/*
 Keeps the scene smooth without making it blurry for no reason.

 Decisions use the real work per frame (GPU time from a timer query when the browser
 offers one, plus CPU time) rather than frame rate alone. That matters because:
  - the first seconds after loading are slow while shaders compile, so they are ignored;
  - on a 60 Hz screen the frame rate can never exceed 60, so resolution is raised again
    whenever there is spare time, not only when fps > 70;
  - battery/energy-saver modes cap the frame rate (often at 30 fps) even though the GPU
    is idle; lowering resolution there would only blur the image, so it is held.
 Resolution moves between FLOOR and the tier cap. If work stays too high at the floor,
 onStruggle() switches to a lighter quality tier. Shadows are static: call
 refreshShadows() after a change. Call tick(now) before rendering and end() after.
*/
export function frameBudget(renderer,report,{cap=1.5,onStruggle}={}){
 const FLOOR=.8,WARMUP=2500,BUSY=14.5,SPARE=9;
 let maxRatio=Math.min(devicePixelRatio,cap),ratio=maxRatio,ceiling=maxRatio,ceilingUntil=0;
 let start=0,frames=0,warmUntil=performance.now()+WARMUP,slowWindows=0,fastWindows=0,lastRaise=0;
 let frameStart=0,cpuMs=0,gpuMs=null,frameNo=0,active=null;const pending=[];
 const gl=renderer.getContext(),timer=gl.getExtension?.('EXT_disjoint_timer_query_webgl2');
 renderer.setPixelRatio(ratio);
 renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 function apply(r){r=Math.max(Math.min(FLOOR,maxRatio),Math.min(maxRatio,r));if(Math.abs(r-ratio)>.001){ratio=r;renderer.setPixelRatio(ratio)}}
 function pollTimer(){
  for(let i=pending.length-1;i>=0;i--){const q=pending[i];if(!gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE))continue;
   const disjoint=gl.getParameter(timer.GPU_DISJOINT_EXT);if(!disjoint){const ms=gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6;gpuMs=gpuMs===null?ms:gpuMs*.7+ms*.3}gl.deleteQuery(q);pending.splice(i,1)}
 }
 function decide(now,fps){
  const work=Math.max(cpuMs,gpuMs??0),measured=gpuMs!==null;
  if(now<warmUntil){slowWindows=fastWindows=0;return}
  const slow=fps<50,busy=measured?work>BUSY:slow,spare=measured?work<SPARE:fps>=57;
  if(slow&&busy){
   // Genuinely too much work: lower resolution, and remember not to climb straight back.
   if(now-lastRaise<2500){ceiling=Math.max(Math.min(FLOOR,maxRatio),ratio-.1);ceilingUntil=now+30000}
   apply(ratio*(fps<35?.85:.92));fastWindows=0;
   slowWindows=ratio<=Math.min(FLOOR,maxRatio)+.02?slowWindows+1:0;
   if(slowWindows>=3&&onStruggle){slowWindows=0;if(onStruggle()){warmUntil=now+WARMUP;apply(Math.max(ratio,maxRatio))}}
   return;
  }
  slowWindows=0;
  // Frame-rate capped but the GPU is idle (vsync, energy saver): keep the sharp image.
  if(spare&&ratio<maxRatio){fastWindows++;const top=now<ceilingUntil?ceiling:maxRatio;if(fastWindows>=2&&ratio<top){apply(Math.min(top,ratio+(measured&&work<SPARE*.6?.2:.1)));lastRaise=now;fastWindows=0}}
  else fastWindows=0;
 }
 return {
  idle(){start=0;fastWindows=0;warmUntil=Math.max(warmUntil,performance.now()+800)},
  warm(){warmUntil=performance.now()+WARMUP},
  setCap(c){maxRatio=Math.min(devicePixelRatio,c);ceiling=maxRatio;apply(Math.min(ratio,maxRatio)>=maxRatio-.001?maxRatio:Math.min(ratio,maxRatio));warmUntil=performance.now()+WARMUP},
  // Jump straight to a sharper resolution (zoomed-in HD); it backs off only if the GPU is really busy.
  boost(startRatio,ceil=startRatio){maxRatio=Math.min(devicePixelRatio,Math.max(startRatio,ceil));ceiling=maxRatio;apply(Math.max(ratio,startRatio));fastWindows=0},
  refreshShadows(){renderer.shadowMap.needsUpdate=true},
  get stats(){return {ratio,cpuMs:+cpuMs.toFixed(2),gpuMs:gpuMs===null?null:+gpuMs.toFixed(2)}},
  tick(now){
   frameStart=performance.now();
   if(timer&&!active&&frameNo++%6===0){active=gl.createQuery();gl.beginQuery(timer.TIME_ELAPSED_EXT,active)}
   if(!start){start=now;frames=0;return}
   frames++;
   if(now-start>=1000){const fps=frames*1000/(now-start);report?.(Math.round(fps),this.stats);start=now;frames=0;decide(now,fps)}
  },
  end(){
   cpuMs=cpuMs*.9+(performance.now()-frameStart)*.1;
   if(active){gl.endQuery(timer.TIME_ELAPSED_EXT);pending.push(active);active=null}
   if(timer&&pending.length)pollTimer();
  }
 };
}
