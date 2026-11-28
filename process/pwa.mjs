/*
 Offline support: registers the service worker (sw.js), offers an "Install" button where
 the browser allows it, shows when the page is offline, and tells the user when a newer
 version has been downloaded so one reload picks it up.
*/
const T=(en,ms)=>window.pomeLang?.()==='en'?en:ms;
const header=document.querySelector('header nav')||document.querySelector('header');
const css=document.createElement('style');css.textContent=`.pwa-install{margin-left:8px;padding:6px 12px;border-radius:999px;background:var(--lime,#d7f88e);color:#14342b;border:0;font-weight:800}
.pwa-banner{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:70;display:flex;gap:10px;align-items:center;padding:10px 14px;border-radius:14px;background:#0f2620;border:1px solid #d7f88e;color:#eff5df;box-shadow:0 12px 30px #0008;font-size:14px}
.pwa-banner button{padding:6px 12px;border-radius:999px;background:#d7f88e;color:#14342b;border:0;font-weight:800}.pwa-off{border-color:#ffd39b}`;
document.head.append(css);
function banner(text,action,cls=''){document.querySelector('.pwa-banner'+(cls?'.'+cls:''))?.remove();const b=document.createElement('div');b.className='pwa-banner '+cls;b.setAttribute('role','status');b.textContent=text;if(action){const btn=document.createElement('button');btn.textContent=action[0];btn.onclick=action[1];b.append(btn)}document.body.append(b);return b}
if('serviceWorker' in navigator&&location.protocol!=='file:'){
 const hadController=!!navigator.serviceWorker.controller;
 navigator.serviceWorker.register('./sw.js').then(reg=>{
  reg.addEventListener('updatefound',()=>{const w=reg.installing;w?.addEventListener('statechange',()=>{
   if(w.state==='activated'&&!hadController)banner(T('Ready to use offline ✓','Sedia digunakan tanpa internet ✓'),null).dataset.auto='1';
  })});
 }).catch(()=>{});
 let reloading=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController||reloading)return;
  banner(T('A newer version is ready.','Versi baharu sudah tersedia.'),[T('Reload','Muat semula'),()=>{reloading=true;location.reload()}])});
}
setTimeout(()=>document.querySelectorAll('.pwa-banner[data-auto]').forEach(b=>b.remove()),6000);
// Install button where the browser supports it.
let deferred=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;if(header&&!document.querySelector('.pwa-install')){const b=document.createElement('button');b.className='pwa-install';b.type='button';b.textContent='📲 '+T('Install','Pasang');b.title=T('Install POME Lab so it opens without internet','Pasang POME Lab supaya boleh dibuka tanpa internet');b.onclick=async()=>{deferred?.prompt();await deferred?.userChoice;deferred=null;b.remove()};header.append(b)}});
// Offline / online notice.
window.addEventListener('offline',()=>banner(T('You are offline: saved pages still work.','Anda di luar talian: halaman yang disimpan masih berfungsi.'),null,'pwa-off'));
window.addEventListener('online',()=>document.querySelector('.pwa-banner.pwa-off')?.remove());
