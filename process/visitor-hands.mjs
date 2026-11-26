import {classifyHand} from '../gesture/gesture-math.mjs';

export function gestures(button,video,status,act){
 let generation=0,stream,detector,frame=0,last=-1,lastTime=0,held='',since=0,fired=false,loading=false;
 function stop(message='Camera off'){
  generation++;loading=false;cancelAnimationFrame(frame);stream?.getTracks().forEach(track=>track.stop());stream=null;
  detector?.close();detector=null;video.srcObject=null;video.hidden=true;held='';fired=false;last=-1;act('clear');act('hideAim');
  button.textContent='Start gesture camera';button.setAttribute('aria-pressed','false');status.textContent=message;
 }
 function tick(now){
  if(document.hidden){stop();return}
  if(video.readyState>=2 && video.currentTime!==last && now-lastTime>=75){
   last=video.currentTime;lastTime=now;
   try{
    const points=detector.detectForVideo(video,now).landmarks[0],hand=classifyHand(points);
    const command=!hand?'clear':hand.pinchRatio<.28?'inspect':hand.count===5?'move':hand.count===3?'cut':hand.count===2?'view':hand.count===1?'look':'clear';
    if(points)act('aim',1-points[8].x,points[8].y);else act('hideAim');
    if(command!==held){held=command;since=now;fired=false}
    if(command==='move'||command==='look')act(command,1-hand.palm.x,hand.palm.y);
    else {act('clear');if(!fired&&now-since>750&&command!=='clear'){act(command,1-points[8].x,points[8].y);fired=true}}
    status.textContent=({clear:hand?'Stopped':'Show a hand',move:'Walking / approaching',look:'Looking',inspect:'Pinch · inspect',cut:'Three fingers · cutaway',view:'Two fingers · camera view'})[command];
   }catch{stop('Tracking interrupted. Start the camera to retry.');return}
  }
  frame=requestAnimationFrame(tick);
 }
 button.onclick=async()=>{
  if(stream||loading){stop();return}const id=++generation;loading=true;
  button.textContent='Cancel camera';status.textContent='Requesting camera…';
  try{
   const s=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:480},height:{ideal:360}}});
   if(id!==generation){s.getTracks().forEach(t=>t.stop());return}
   stream=s;video.srcObject=s;await video.play();if(id!==generation)return;video.hidden=false;status.textContent='Loading hand tracking…';
   const base=new URL('../gesture/vendor/',import.meta.url),lib=await import('../gesture/vendor/vision_bundle.mjs');
   const files=await lib.FilesetResolver.forVisionTasks(base.href);
   if(id!==generation)return;
   const model=await lib.HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:new URL('hand_landmarker.task',base).href},runningMode:'VIDEO',numHands:1});
   if(id!==generation){model.close();return}
   detector=model;loading=false;button.textContent='Stop gesture camera';button.setAttribute('aria-pressed','true');
   stream.getVideoTracks()[0].onended=()=>{if(id===generation)stop('Camera disconnected')};frame=requestAnimationFrame(tick);
  }catch(e){if(id===generation)stop(e.name==='NotAllowedError'?'Camera permission was declined. You can use the movement controls.':'Camera unavailable. Check the device and try again.')}
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});window.addEventListener('pagehide',()=>stop());
 return stop;
}
