import {classifyHand} from '../gesture/gesture-math.mjs';

export function gestures(button,video,status,act){
 let generation=0,stream,worker,detector,timer,deadline,last=-1,held='',since=0,fired=false,loading=false;
 let interval=80,lastSubmit=0,inFlight=false;
 const base=new URL('../gesture/',import.meta.url);
 const say=message=>{if(status.textContent!==message)status.textContent=message};
 function stop(message='Camera off'){
  generation++;loading=false;clearTimeout(timer);clearTimeout(deadline);worker?.terminate();worker=null;
  stream?.getTracks().forEach(track=>track.stop());stream=null;detector?.close();detector=null;
  video.srcObject=null;video.hidden=true;held='';fired=false;last=-1;inFlight=false;act('clear');act('hideAim');
  button.textContent='Start gesture camera';button.setAttribute('aria-pressed','false');say(message);
 }
 function interpret(points,now){
  const hand=classifyHand(points);
  const command=!hand?'clear':hand.pinchRatio<.28?'inspect':hand.count===5?'move':hand.count===4?'role':hand.count===3?'cut':hand.count===2?'view':hand.count===1?'look':'clear';
  if(points)act('aim',1-points[8].x,points[8].y);else act('hideAim');
  if(command!==held){held=command;since=now;fired=false}
  if(command==='move'||command==='look')act(command,1-hand.palm.x,hand.palm.y);
  else{act('clear');if(!fired&&now-since>750&&command!=='clear'){act(command,1-points[8].x,points[8].y);fired=true}}
  say(({clear:hand?'Stopped':'Show a hand',move:'Walking / approaching',look:'Looking',inspect:'Pinch · inspect',cut:'Three fingers · cutaway',view:'Two fingers · camera view',role:'Four fingers · change worker'})[command]);
 }
 function schedule(id){if(id===generation)timer=setTimeout(()=>sample(id),Math.max(10,lastSubmit+interval-performance.now()))}
 function result(id,points){
  if(id!==generation)return;
  clearTimeout(deadline);inFlight=false;const now=performance.now(),cost=now-lastSubmit;
  interval=Math.min(280,Math.max(worker?65:120,interval*.7+cost*(worker?1.7:3)*.3));
  interpret(points,now);schedule(id);
 }
 async function sample(id){
  if(id!==generation||inFlight)return;
  if(video.readyState<2||video.currentTime===last){timer=setTimeout(()=>sample(id),24);return}
  last=video.currentTime;lastSubmit=performance.now();inFlight=true;
  try{
   if(worker){
    const bitmap=await createImageBitmap(video);if(id!==generation){bitmap.close();return}
    worker.postMessage({type:'frame',hands:true,bitmap,time:lastSubmit},[bitmap]);
    deadline=setTimeout(()=>{if(id===generation)stop('Tracking interrupted. Restart camera to retry.')},8000);
   }else result(id,detector.detectForVideo(video,lastSubmit).landmarks[0]);
  }catch{if(id===generation)stop('Tracking interrupted. Restart camera to retry.')}
 }
 function ready(id){if(id!==generation)return;loading=false;button.textContent='Stop gesture camera';button.setAttribute('aria-pressed','true');schedule(id)}
 async function fallback(id){
  if(id!==generation)return;worker?.terminate();worker=null;clearTimeout(deadline);inFlight=false;
  try{
   const lib=await import('../gesture/vendor/vision_bundle.mjs');
   const files=await lib.FilesetResolver.forVisionTasks(new URL('vendor/',base).href);
   if(id!==generation)return;
   const model=await lib.HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:new URL('vendor/hand_landmarker.task',base).href},runningMode:'VIDEO',numHands:1});
   if(id!==generation){model.close();return}detector=model;interval=150;ready(id);
  }catch{if(id===generation)stop('Tracking unavailable. Try another browser or use the movement controls.')}
 }
 button.onclick=async()=>{
  if(stream||loading){stop();return}const id=++generation;loading=true;
  button.textContent='Cancel camera';say('Requesting camera…');
  try{
   const s=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:320,max:640},height:{ideal:240,max:480},frameRate:{ideal:15,max:20}}});
   if(id!==generation){s.getTracks().forEach(t=>t.stop());return}
   stream=s;video.srcObject=s;await video.play();if(id!==generation)return;video.hidden=false;say('Loading hand tracking…');
   stream.getVideoTracks()[0].onended=()=>{if(id===generation)stop('Camera disconnected')};
   if(!window.Worker||!window.createImageBitmap||!window.OffscreenCanvas){await fallback(id);return}
   try{worker=new Worker(new URL('camera-worker.js',base))}catch{await fallback(id);return}
   let started=false;
   const fail=()=>{if(id!==generation||!worker)return;if(!started)fallback(id);else stop('Tracking interrupted. Restart camera to retry.')};
   worker.onerror=fail;worker.onmessage=({data})=>{
    if(id!==generation)return;
    if(data.type==='ready'){clearTimeout(deadline);started=true;interval=80;ready(id)}
    else if(data.type==='result')result(id,data.hands?.[0]);
    else if(data.type==='error')fail();
   };
   deadline=setTimeout(fail,30000);
   worker.postMessage({type:'init',base:new URL('./',base).href,hands:true,numHands:1});
  }catch(e){if(id===generation)stop(e.name==='NotAllowedError'?'Camera permission was declined. You can use the movement controls.':'Camera unavailable. Check the device and try again.')}
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});window.addEventListener('pagehide',()=>stop());
 return stop;
}
