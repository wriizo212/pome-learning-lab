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
  setCap(c){maxRatio=Math.min(devicePixelRatio,c);ratio=Math.min(ratio,maxRatio);renderer.setPixelRatio(ratio)},
  refreshShadows(){renderer.shadowMap.needsUpdate=true},
  tick(now){
   if(!start){start=now;frames=0;return}
   frames++;
   if(now-start>=1000){
    const fps=frames*1000/(now-start);report?.(Math.round(fps));start=now;frames=0;
    fastWindows=fps>70?fastWindows+1:0;
    const next=fps<56?Math.max(.55,ratio*(fps<35?.75:.9)):fastWindows>=4?Math.min(maxRatio,ratio+.1):ratio;
    if(next!==ratio){ratio=next;renderer.setPixelRatio(ratio);fastWindows=0}
    slowWindows=fps<48&&ratio<=.6?slowWindows+1:0;
    if(slowWindows>=3&&onStruggle){slowWindows=0;if(onStruggle()){ratio=Math.min(maxRatio,.8);renderer.setPixelRatio(ratio)}}
   }
  }
 };
}
