/*
 Loads each 3D scene only when it is needed, so the page opens fast on school computers:
  - the UASB / integrated plant when the process model scrolls near the screen (or a
    recovery pathway is chosen);
  - the conventional ponds only when that pathway is chosen.
 While a scene loads, the flat diagram stays visible with a small "Loading 3D…" note.
 The first time a 3D view appears, a short how-to card explains the controls.
*/
const V='shift21';
const stage=document.querySelector('.stage'),opt=i=>document.querySelector(`[data-option="${i}"]`);
const T=(en,ms)=>window.pomeLang?.()==='en'?en:ms;
const note=document.createElement('p');note.className='load3d';note.hidden=true;stage?.querySelector('svg')?.before(note);
let reactor=null,ponds=null;
function busy(on){note.hidden=!on;note.textContent='⏳ '+T('Loading the 3D plant…','Memuatkan loji 3D…')}
function load(kind){
 if(kind==='reactor'&&!reactor){busy(true);reactor=import(`./reactor.mjs?v=${V}`).finally(()=>{busy(false);tips()})}
 if(kind==='ponds'&&!ponds){busy(true);ponds=import(`./ponds3d.mjs?v=${V}`).finally(()=>{busy(false);tips()})}
 return kind==='reactor'?reactor:ponds;
}
window.pomeLoad3D=load;
const wanted=()=>opt(0)?.classList.contains('active')?'ponds':'reactor';
if(stage){
 new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))load(wanted())},{rootMargin:'700px'}).observe(stage);
 opt(0)?.addEventListener('click',()=>load('ponds'));opt(1)?.addEventListener('click',()=>load('reactor'));opt(2)?.addEventListener('click',()=>load('reactor'));
}

/* ---------- first-time 3D tips ---------- */
const SEEN='pome-3d-tips';
function tips(){
 let seen=false;try{seen=localStorage.getItem(SEEN)==='1'}catch{}
 if(seen)return;
 const frame=[...document.querySelectorAll('.reactor-view:not([hidden]) .reactor-frame')][0];if(!frame||frame.querySelector('.tips3d'))return;
 const card=document.createElement('div');card.className='tips3d';card.setAttribute('role','dialog');card.setAttribute('aria-label',T('How to use the 3D view','Cara guna paparan 3D'));
 card.innerHTML=`<h4>${T('How to explore','Cara meneroka')}</h4><ol>
  <li><b>🖱️ ${T('Drag','Seret')}</b> ${T('to turn the plant, scroll to zoom.','untuk memusing loji, skrol untuk zum.')}</li>
  <li><b>👆 ${T('Click a label','Klik label')}</b> ${T('to learn what each part does.','untuk tahu fungsi setiap bahagian.')}</li>
  <li><b>▶ ${T('Play as a worker','Main sebagai pekerja')}</b> ${T('to walk around: W A S D to move, Shift to run, E to talk.','untuk berjalan: W A S D untuk bergerak, Shift untuk lari, E untuk bercakap.')}</li>
  <li><b>🧪 ${T('Molecules','Molekul')}</b> ${T('shows what happens inside the water.','menunjukkan apa yang berlaku di dalam air.')}</li></ol>
  <button type="button">${T('Got it!','Faham!')}</button>`;
 card.querySelector('button').onclick=()=>{card.remove();try{localStorage.setItem(SEEN,'1')}catch{}};
 frame.append(card);
}
