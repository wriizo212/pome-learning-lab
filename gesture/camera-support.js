/* Loaded before app controls so requesting permission never waits for AI model imports. */
(function(){
 function inspect(env=window){const nav=env.navigator||{},policy=env.document?.permissionsPolicy||env.document?.featurePolicy;return {secure:!!env.isSecureContext,api:!!nav.mediaDevices?.getUserMedia,policy:policy?.allowsFeature?policy.allowsFeature('camera'):true,embedded:env.self!==env.top,inApp:/FBAN|FBAV|Instagram|Line\/|; wv\)|Telegram|TikTok|MicroMessenger/i.test(nav.userAgent||''),ios:/iPhone|iPad|iPod/.test(nav.userAgent||'')||(nav.platform==='MacIntel'&&nav.maxTouchPoints>1),mobile:(nav.maxTouchPoints||0)>0,android:/Android/i.test(nav.userAgent||'')};}
 function errorMessage(e,context=inspect()){
  if(!context.secure)return 'Kamera memerlukan HTTPS. Buka pautan GitHub Pages dalam Chrome atau Safari.';
  if(!context.policy)return 'Halaman terbenam ini menyekat kamera. Buka permainan terus dalam tab Chrome atau Safari.';
  if(!context.api)return 'Pelayar dalam aplikasi ini tidak menyediakan kamera. Salin pautan dan buka dalam Chrome (Android) atau Safari (iPhone/iPad).';
  return ({NotAllowedError:'Izin kamera ditolak atau pernah disekat. Buka tetapan laman pada ikon di sebelah alamat, benarkan Kamera dan muat semula. Jika tiada prompt, buka pautan terus dalam Chrome/Safari.',SecurityError:'Tetapan keselamatan atau halaman terbenam menyekat kamera. Buka pautan permainan terus dalam pelayar.',NotFoundError:'Tiada kamera ditemui. Semak kamera dan kebenaran pelayar dalam tetapan peranti.',NotReadableError:'Kamera sedang digunakan aplikasi lain. Tutup aplikasi kamera/panggilan video dan cuba lagi.',OverconstrainedError:'Tetapan kamera tidak disokong. Cuba kamera lain atau Mod Serasi.',AbortError:'Kamera terhenti sebelum selesai. Cuba lagi.'})[e.name]||'Kamera/model tidak dapat dimulakan. Cuba semula atau gunakan kawalan sentuh.';
 }
 function requestStream({facing='user',compatible=false,env=window}={}){const c=inspect(env);if(!c.secure||!c.api||!c.policy){const e=new Error(errorMessage({name:'SecurityError'},c));e.name='PreflightError';throw e}const video=compatible?true:{facingMode:{ideal:facing},width:{ideal:c.mobile?480:640},height:{ideal:c.mobile?360:480},frameRate:{ideal:20,max:30}};return env.navigator.mediaDevices.getUserMedia({video,audio:false});}
 window.CameraSupport={inspect,errorMessage,requestStream};
})();
