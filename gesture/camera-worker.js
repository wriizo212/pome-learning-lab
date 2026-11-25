/* Inference runs off the UI thread; each input bitmap is closed after use. */
let hand,face,vision,lib,numHands=1;
self.onmessage=async ({data:d})=>{
 try{
  if(d.type==='init'){
   lib||=await import('./vendor/vision_bundle.mjs');vision||=await lib.FilesetResolver.forVisionTasks(d.base+'vendor/');
   if(d.hands&&!hand){numHands=d.numHands||1;hand=await lib.HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:d.base+'vendor/hand_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numHands,minHandDetectionConfidence:.6,minHandPresenceConfidence:.6,minTrackingConfidence:.6})}if(d.hands&&hand&&numHands!==(d.numHands||1)){numHands=d.numHands||1;await hand.setOptions({numHands})}
   if(d.face&&!face)face=await lib.FaceLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:d.base+'vendor/face_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numFaces:1,outputFaceBlendshapes:true,minFaceDetectionConfidence:.6,minFacePresenceConfidence:.6,minTrackingConfidence:.6});
   self.postMessage({type:'ready',hands:!!hand,face:!!face,numHands});return;
  }
  if(d.type==='frame'){
   try{const h=d.hands&&hand?hand.detectForVideo(d.bitmap,d.time):null;const f=d.face&&face?face.detectForVideo(d.bitmap,d.time):null;self.postMessage({type:'result',time:d.time,hands:h?.landmarks||[],face:f?.faceLandmarks?.[0]||null,blendshapes:f?.faceBlendshapes?.[0]?.categories||[],handedness:h?.handedness||[]})}finally{d.bitmap.close()}
  }
 }catch(e){self.postMessage({type:'error',message:e.message||'Inference failed'})}
};
