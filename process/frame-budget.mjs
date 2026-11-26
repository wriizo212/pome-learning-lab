/*
 Keeps the scene at a smooth frame rate. Resolution scales between a floor and the
 tier's cap; if the frame rate stays low at the floor, onStruggle() lets the scene drop
 to a lighter quality tier. Shadows are static: call refreshShadows() after a change.
*/
export function frameBudget(renderer,report,{cap=1.5,onStruggle}={}){
 let maxRatio=Math.min(devicePixelRatio,cap),ratio=Math.min(maxRatio,1),start=0,frames=0,fastWindows=0,slowWindows=0;
 renderer.setPixelRatio(ratio);
 renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 return {
  idle(){start=0;fastWindows=0},
  setCap(c,lower=false){maxRatio=Math.min(devicePixelRatio,c);ratio=lower?Math.min(ratio,maxRatio):Math.min(ratio,maxRatio);renderer.setPixelRatio(ratio)},
  // Jump straight to a sharper resolution (zoomed-in HD); the budget still backs off if frames drop.
  // start: resolution applied now; ceiling: where it may climb while frames stay fast.
  boost(start,ceiling=start){maxRatio=Math.min(devicePixelRatio,Math.max(start,ceiling));ratio=Math.min(maxRatio,Math.max(ratio,start));fastWindows=0;renderer.setPixelRatio(ratio)},
  refreshShadows(){renderer.shadowMap.needsUpdate=true},
  tick(now){
   if(!start){start=now;frames=0;return}
   frames++;
   if(now-start>=1000){
    const fps=frames*1000/(now-start);report?.(Math.round(fps));start=now;frames=0;
    fastWindows=fps>70?fastWindows+1:0;
    // Climb faster when there is clear headroom (zoomed-in HD on a strong GPU).
    const next=fps<56?Math.max(.55,ratio*(fps<35?.75:.9)):fastWindows>=(fps>100?1:3)?Math.min(maxRatio,ratio+(fps>100?.2:.1)):ratio;
    if(next!==ratio){ratio=next;renderer.setPixelRatio(ratio);fastWindows=0}
    slowWindows=fps<48&&ratio<=.6?slowWindows+1:0;
    if(slowWindows>=3&&onStruggle){slowWindows=0;if(onStruggle()){ratio=Math.min(maxRatio,.8);renderer.setPixelRatio(ratio)}}
   }
  }
 };
}
