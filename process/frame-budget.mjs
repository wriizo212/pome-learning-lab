export function frameBudget(renderer,report){
 const maxRatio=Math.min(devicePixelRatio,1.5);
 let ratio=Math.min(maxRatio,1),start=0,frames=0,fastWindows=0,lastShadow=0;
 renderer.setPixelRatio(ratio);
 renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 return {
  idle(){start=0;fastWindows=0},
  tick(now){
   if(!start){start=now;frames=0}
   else frames++;
   if(now-start>=1000){
    const fps=frames*1000/(now-start);report?.(Math.round(fps));start=now;frames=0;
    fastWindows=fps>84?fastWindows+1:0;
    const next=fps<54?Math.max(.5,ratio*(fps<35?.72:.9)):fastWindows>=4?Math.min(maxRatio,ratio+.1):ratio;
    if(next!==ratio){ratio=next;renderer.setPixelRatio(ratio);fastWindows=0}
   }
   if(ratio>=.85&&now-lastShadow>240){renderer.shadowMap.needsUpdate=true;lastShadow=now}
  }
 };
}
