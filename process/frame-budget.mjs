/*
 Keeps the scene sharp first and smooth second.

 Resolution is fixed by a pixel budget, never by the frame rate: the canvas is drawn at
 the screen's native resolution until it would exceed the tier's budget (about Full HD
 on the balanced tier), and never below one image pixel per CSS pixel. Scaling the
 image down to win frames is what made the scenes look blurry, so it no longer happens.

 Smoothness comes from the quality tier instead. Decisions use the real work per frame
 (GPU time from a timer query when the browser offers one, plus CPU time) as well as the
 frame rate, because:
  - the first seconds after loading are slow while shaders compile, so they are ignored;
  - battery/energy-saver modes cap the frame rate (often at 30 fps) while the GPU idles;
    that is not a reason to cut detail.
 If the work stays too high for several seconds, onStruggle() moves to a lighter tier
 (fewer shadows, molecules and scenery). If frames stay comfortably fast for a while,
 onRecover() may step back up once. Shadows are static: call refreshShadows() after a
 change. Call tick(now) before rendering and end() after.
*/
export const FULL_HD=1920*1080;
export function frameBudget(renderer,report,{cap=FULL_HD,onStruggle,onRecover}={}){
 const WARMUP=3500,BUSY=13.5,SLOW_FPS=55,FAST_FPS=58;
 let pixels=cap>100?cap:FULL_HD,boostK=1,ratio=0;
 let start=0,frames=0,warmUntil=performance.now()+WARMUP,slowWindows=0,fastWindows=0,lastStruggle=-1e9,recoveredAt=-1e9,recoverBlocked=false;
 let frameStart=0,cpuMs=0,gpuMs=null,frameNo=0,active=null;const pending=[];
 const gl=renderer.getContext(),timer=gl.getExtension?.('EXT_disjoint_timer_query_webgl2'),canvas=renderer.domElement;
 // Native resolution, limited to the pixel budget and to 2x (beyond that the eye gains nothing).
 function target(){
  const dpr=window.devicePixelRatio||1,area=Math.max(1,(canvas.clientWidth||1)*(canvas.clientHeight||1));
  return Math.max(Math.min(dpr,1),Math.min(dpr,2,Math.sqrt(pixels*boostK/area)));
 }
 function apply(){const r=Math.round(target()*100)/100;if(Math.abs(r-ratio)>.01){ratio=r;renderer.setPixelRatio(r)}}
 renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;apply();
 function pollTimer(){
  for(let i=pending.length-1;i>=0;i--){const q=pending[i];if(!gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE))continue;
   const disjoint=gl.getParameter(timer.GPU_DISJOINT_EXT);if(!disjoint){const ms=gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6;if(ms<200)gpuMs=gpuMs===null?ms:gpuMs*.7+ms*.3}gl.deleteQuery(q);pending.splice(i,1)}
 }
 function decide(now,fps){
  apply();
  if(now<warmUntil||document.hidden){slowWindows=fastWindows=0;return}
  const work=Math.max(cpuMs,gpuMs??0),measured=gpuMs!==null;
  const slow=fps<SLOW_FPS&&(measured?work>BUSY:true);
  if(slow){
   fastWindows=0;
   if(++slowWindows>=3&&onStruggle){
    slowWindows=0;
    if(now-recoveredAt<20000)recoverBlocked=true; // the step up was too heavy: stay down
    if(onStruggle()){lastStruggle=now;warmUntil=now+WARMUP}
   }
   return;
  }
  slowWindows=0;
  if(fps>=FAST_FPS&&onRecover&&!recoverBlocked&&now-lastStruggle>45000){
   if(++fastWindows>=12){fastWindows=0;if(onRecover()){recoveredAt=now;warmUntil=now+WARMUP}}
  }else fastWindows=0;
 }
 return {
  idle(){start=0;fastWindows=0;warmUntil=Math.max(warmUntil,performance.now()+800)},
  warm(){warmUntil=performance.now()+WARMUP},
  // Pixel budget for the current quality tier (legacy callers may still pass a ratio; it is ignored).
  setCap(c){if(c>100)pixels=c;apply();warmUntil=performance.now()+WARMUP},
  // Zoomed-in HD: allow a larger pixel budget while the camera is close.
  boost(k=1.6){boostK=Math.max(1,k);apply()},
  unboost(){boostK=1;apply()},
  refreshShadows(){renderer.shadowMap.needsUpdate=true},
  get stats(){return {ratio,pixels:Math.round((canvas.width||0)*(canvas.height||0)),cpuMs:+cpuMs.toFixed(2),gpuMs:gpuMs===null?null:+gpuMs.toFixed(2)}},
  tick(now){
   frameStart=performance.now();
   if(timer&&!active&&frameNo++%6===0){active=gl.createQuery();gl.beginQuery(timer.TIME_ELAPSED_EXT,active)}
   if(!start){start=now;frames=0;apply();return}
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
