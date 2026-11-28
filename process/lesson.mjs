/*
 40-minute lesson mode and a pre/post test, for SMK learners and their teacher.
  - A sticky step bar: Investigate 5 · Explore 10 · Experiment 8 · Decide 10 · Reflect 7 min.
    Each step takes the class to the right tab and section, with a countdown the teacher
    can pause; it never moves on by itself.
  - The same five questions before (warm-up) and after (Reflect), with the learning gain.
  - One learning record that gathers the prediction, saved runs, decision, quiz, pre/post
    scores and lesson progress; it can be printed for the teacher or downloaded.
 Bilingual: uses window.pomeLang() from i18n.mjs and re-renders on the "pome-lang" event.
*/
const $=id=>document.getElementById(id);
const L=()=>window.pomeLang?.()==='en'?'en':'ms';
const tx=(en,ms)=>L()==='en'?en:ms;
const KEY='pome-lesson';
let S;try{S=JSON.parse(localStorage.getItem(KEY))}catch{}S=Object.assign({on:false,step:0,left:null,running:false,pre:null,post:null,started:null},S||{});
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}};

const STEPS=[
 {en:'Investigate',ms:'Siasat',min:5,goEn:'Warm-up quiz, then read the Start-here briefing and make a prediction.',goMs:'Kuiz pemanasan, kemudian baca taklimat Mula di sini dan buat ramalan.',go(){tab('studio');if(S.pre===null)openTest('pre');openBrief();}},
 {en:'Explore',ms:'Teroka',min:10,goEn:'Press “Play as a worker” and follow the POME trail. Then try Build the Treatment Train in the Mill Arcade.',goMs:'Tekan “Main sebagai pekerja” dan ikut denai POME. Kemudian cuba Build the Treatment Train dalam Mill Arcade.',go(){tab('studio');scrollTo('.reactor-view:not([hidden])')}},
 {en:'Experiment',ms:'Eksperimen',min:8,goEn:'Use the coach box: save three runs, changing one thing each time.',goMs:'Guna kotak cabaran: simpan tiga larian, ubah satu perkara setiap kali.',go(){tab('studio');scrollTo('.panel.controls')}},
 {en:'Decide',ms:'Putuskan',min:10,goEn:'Answer the mill manager with your partner: two reasons, one problem, one condition.',goMs:'Jawab pengurus kilang bersama rakan: dua sebab, satu masalah, satu syarat.',go(){tab('challenge')}},
 {en:'Reflect',ms:'Refleksi',min:7,goEn:'Take the final quiz, compare with your warm-up score, then save your learning record.',goMs:'Jawab kuiz akhir, bandingkan dengan skor pemanasan, kemudian simpan rekod pembelajaran.',go(){tab('challenge');if(S.post===null)openTest('post');else showRecord()}}
];
const QUESTIONS=[
 {en:'What is POME?',ms:'Apakah POME?',a:[['Wastewater from a palm oil mill','Air sisa dari kilang kelapa sawit'],['Palm oil sold in shops','Minyak sawit yang dijual di kedai'],['A type of fertiliser','Sejenis baja'],['Rainwater from the plantation','Air hujan dari ladang']]},
 {en:'Why is untreated POME harmful to a river?',ms:'Mengapa POME yang tidak dirawat berbahaya kepada sungai?',a:[['Bacteria breaking it down use up the oxygen fish need','Bakteria yang menguraikannya menggunakan oksigen yang diperlukan ikan'],['It makes the river colder','Ia menyejukkan sungai'],['It adds extra oxygen','Ia menambah oksigen'],['It has no effect','Ia tiada kesan']]},
 {en:'What escapes from an open (uncovered) pond?',ms:'Apakah yang terlepas dari kolam terbuka (tanpa penutup)?',a:[['Methane, a strong greenhouse gas','Metana, gas rumah hijau yang kuat'],['Pure oxygen','Oksigen tulen'],['Clean drinking water','Air minuman yang bersih'],['Nothing at all','Tiada apa-apa']]},
 {en:'Which system captures biogas to make electricity?',ms:'Sistem manakah yang menangkap biogas untuk menjana elektrik?',a:[['A closed digester such as a UASB','Pencerna tertutup seperti UASB'],['An open pond','Kolam terbuka'],['The river','Sungai'],['A fence around the mill','Pagar di sekeliling kilang']]},
 {en:'What can integrated resource recovery produce from POME?',ms:'Apakah yang boleh dihasilkan oleh pemulihan sumber bersepadu daripada POME?',a:[['Energy, reusable water and fertiliser','Tenaga, air guna semula dan baja'],['Only dirtier water','Hanya air yang lebih kotor'],['More palm oil','Lebih banyak minyak sawit'],['Nothing useful','Tiada yang berguna']]}
];
function tab(id){window.tab?.(id)}
function scrollTo(sel){setTimeout(()=>document.querySelector(sel)?.scrollIntoView({behavior:'smooth',block:'start'}),120)}
function openBrief(){const b=document.querySelector('.brief');if(b?.classList.contains('folded'))b.querySelector('.brief-fold')?.click();scrollTo('.brief')}

/* ---------- step bar ---------- */
const bar=document.createElement('div');bar.className='lesson-bar';bar.setAttribute('role','region');
document.querySelector('header')?.after(bar);
let tick=0;
function fmtTime(s){s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function render(){
 if(!S.on){bar.innerHTML=`<button class="lesson-start">🎓 ${tx('Start the 40-minute lesson','Mula pelajaran 40 minit')}</button><span class="lesson-sub">${tx('Five steps, a timer for the teacher and a quiz before and after.','Lima langkah, pemasa untuk guru dan kuiz sebelum dan selepas.')}</span>${S.pre!==null||S.post!==null?`<button class="lesson-rec">📄 ${tx('Learning record','Rekod pembelajaran')}</button>`:''}`;bar.setAttribute('aria-label',tx('Lesson mode','Mod pelajaran'));return}
 const st=STEPS[S.step],left=S.left??st.min*60,low=left<=60;
 bar.innerHTML=`<ol class="lesson-steps">${STEPS.map((s,i)=>`<li><button data-step="${i}" class="${i<S.step?'past':''}" aria-current="${i===S.step?'step':'false'}"><span>${i+1}</span>${tx(s.en,s.ms)}<small>${s.min} min</small></button></li>`).join('')}</ol>
  <div class="lesson-now"><p><b>${tx('Now','Sekarang')}:</b> ${tx(st.goEn,st.goMs)}</p>
  <div class="lesson-ctl"><span class="lesson-time ${low?'low':''}" aria-live="off">⏱ ${fmtTime(left)}</span><button data-act="pause">${S.running?tx('Pause','Jeda'):tx('Resume','Sambung')}</button><button data-act="go">${tx('Take me there','Bawa saya ke sana')}</button>${S.step<4?`<button class="primary" data-act="next">${tx('Next step','Langkah seterusnya')} →</button>`:`<button class="primary" data-act="record">📄 ${tx('Learning record','Rekod pembelajaran')}</button>`}<button data-act="end" title="${tx('End lesson mode','Tamat mod pelajaran')}">✕</button></div></div>`;
 bar.setAttribute('aria-label',tx('Lesson mode','Mod pelajaran'));
}
function goStep(i){S.step=Math.max(0,Math.min(4,i));S.left=STEPS[S.step].min*60;S.running=true;save();render();STEPS[S.step].go()}
bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.classList.contains('lesson-start')){S.on=true;S.started=Date.now();save();goStep(0);return}
 if(b.classList.contains('lesson-rec')){showRecord();return}
 if(b.dataset.step){goStep(+b.dataset.step);return}
 const a=b.dataset.act;if(a==='pause'){S.running=!S.running;save();render()}if(a==='go')STEPS[S.step].go();if(a==='next')goStep(S.step+1);if(a==='record')showRecord();if(a==='end'){S.on=false;save();render()}});
setInterval(()=>{if(!S.on||!S.running||document.hidden)return;const st=STEPS[S.step];S.left=(S.left??st.min*60)-1;if(S.left===0)toast(tx(`Time for ${st.en} is up. Move on when the class is ready.`,`Masa untuk ${st.ms} sudah tamat. Teruskan bila kelas sudah bersedia.`));if(++tick%5===0)save();const t=bar.querySelector('.lesson-time');if(t){t.textContent='⏱ '+fmtTime(S.left);t.classList.toggle('low',S.left<=60)}},1000);

/* ---------- pre / post test ---------- */
const dlg=document.createElement('dialog');dlg.className='lesson-test';document.body.append(dlg);
let mode='pre',answers=[],order=[];
function openTest(m){mode=m;answers=Array(QUESTIONS.length).fill(null);order=QUESTIONS.map(q=>q.a.map((_,i)=>i).sort(()=>Math.random()-.5));renderTest();if(!dlg.open)dlg.showModal()}
function renderTest(){
 const done=answers.every(a=>a!==null);
 dlg.innerHTML=`<form method="dialog"><h2>${mode==='pre'?tx('Warm-up quiz','Kuiz pemanasan'):tx('Final quiz','Kuiz akhir')}</h2>
  <p class="lesson-sub">${mode==='pre'?tx('Five quick questions before you start. It is fine not to know yet!','Lima soalan ringkas sebelum mula. Tidak mengapa jika belum tahu!'):tx('The same five questions again. Let us see how much you have learnt.','Lima soalan yang sama sekali lagi. Mari lihat berapa banyak yang anda telah belajar.')}</p>
  ${QUESTIONS.map((q,qi)=>`<fieldset><legend>${qi+1}. ${tx(q.en,q.ms)}</legend>${order[qi].map(ai=>`<label><input type="radio" name="q${qi}" value="${ai}" ${answers[qi]===ai?'checked':''}> ${tx(q.a[ai][0],q.a[ai][1])}</label>`).join('')}</fieldset>`).join('')}
  <div class="lesson-test-btns"><button value="cancel" class="ghost">${tx('Later','Nanti')}</button><button type="button" class="primary" data-submit ${done?'':'disabled'}>${tx('Check my answers','Semak jawapan saya')}</button></div></form>`;
 dlg.querySelectorAll('input').forEach(i=>i.onchange=()=>{answers[+i.name.slice(1)]=+i.value;dlg.querySelector('[data-submit]').disabled=!answers.every(a=>a!==null)});
 dlg.querySelector('[data-submit]').onclick=finishTest;
}
function finishTest(){
 const score=answers.filter(a=>a===0).length;S[mode]=score;save();
 const gain=S.pre!==null&&S.post!==null?S.post-S.pre:null;
 dlg.innerHTML=`<form method="dialog"><h2>${tx('Your score','Skor anda')}: ${score} / 5</h2>
  <ol class="lesson-review">${QUESTIONS.map((q,qi)=>`<li class="${answers[qi]===0?'ok':'bad'}">${answers[qi]===0?'✔':'✖'} ${tx(q.en,q.ms)}<small>${tx('Answer','Jawapan')}: ${tx(q.a[0][0],q.a[0][1])}</small></li>`).join('')}</ol>
  ${mode==='pre'?`<p>${tx('Keep this score in mind. You will answer the same questions at the end of the lesson.','Ingat skor ini. Anda akan menjawab soalan yang sama di akhir pelajaran.')}</p>`:`<p class="lesson-gain">${tx('Warm-up','Pemanasan')} ${S.pre??'–'} / 5 → ${tx('Final','Akhir')} ${score} / 5 ${gain!==null?`<b>${gain>0?'+'+gain:gain}</b>`:''}</p>`}
  <div class="lesson-test-btns"><button type="button" data-ok class="primary">${mode==='pre'?tx('Start the lesson','Mula pelajaran'):tx('See my learning record','Lihat rekod pembelajaran saya')}</button></div></form>`;
 // Act on the button itself (the dialog close event can be delayed in background tabs).
 dlg.querySelector('[data-ok]').onclick=()=>{dlg.close();if(mode==='post')showRecord();else openBrief();render()};
}

/* ---------- one learning record ---------- */
const rec=document.createElement('dialog');rec.className='lesson-test lesson-record';document.body.append(rec);
function gather(){
 let poster={};try{poster=JSON.parse(localStorage.getItem('pome-poster'))||{}}catch{}
 const choice=document.querySelector('[data-choice].active')?.textContent||'';
 return {prediction:{removal:'Just clean the water',recovery:'Clean it and recover resources',depends:'It depends on the mill'}[poster.prediction]||'',missionTasks:Object.values(poster.focus||{}).filter(Boolean).length,
  runs:(typeof runs!=='undefined'?runs:[]).map(v=>({mill:v.scenario,pathway:v.pathway,flow:v.flow,cod:v.cod,residualCOD:Math.round(v.residual),methane:Math.round(v.gas),waterReused:Math.round(v.water)})),
  choice,recommendation:$('reason')?.value||'',quizScore:typeof lastScore!=='undefined'?lastScore:null,pre:S.pre,post:S.post,lessonStep:S.on?STEPS[S.step].en:'not started'};
}
function showRecord(){
 const r=gather(),gain=r.pre!==null&&r.post!==null?r.post-r.pre:null;const name=localStorage.getItem('pome-learner')||'';
 rec.innerHTML=`<form method="dialog"><h2>📄 ${tx('Learning record','Rekod pembelajaran')}</h2>
  <label>${tx('Name','Nama')} <input id="lr-name" value="${name.replace(/"/g,'&quot;')}" placeholder="${tx('Your name','Nama anda')}"></label>
  <table><tbody>
  <tr><th>${tx('Prediction','Ramalan')}</th><td>${r.prediction||'–'}</td></tr>
  <tr><th>${tx('Mission tasks','Tugasan misi')}</th><td>${r.missionTasks} / 5</td></tr>
  <tr><th>${tx('Saved runs','Larian disimpan')}</th><td>${r.runs.length?r.runs.map((v,i)=>`${i+1}. ${v.mill} · ${v.pathway} · COD ${v.residualCOD} mg/L · CH₄ ${v.methane} m³/d · ${tx('water','air')} ${v.waterReused} m³/d`).join('<br>'):'–'}</td></tr>
  <tr><th>${tx('Decision','Keputusan')}</th><td>${r.choice||'–'}</td></tr>
  <tr><th>${tx('Reasons','Hujah')}</th><td>${(r.recommendation||'–').replace(/</g,'&lt;')}</td></tr>
  <tr><th>${tx('Quizzes','Kuiz')}</th><td>${tx('Warm-up','Pemanasan')} ${r.pre??'–'} / 5 → ${tx('Final','Akhir')} ${r.post??'–'} / 5${gain!==null?` <b>(${gain>0?'+':''}${gain})</b>`:''}${r.quizScore!=null?` · ${tx('Concept check','Semakan konsep')} ${r.quizScore} / 3`:''}</td></tr>
  </tbody></table>
  <p class="lesson-sub">${tx('Illustrative educational model: values are not plant measurements.','Model pendidikan: nilai hanyalah anggaran, bukan ukuran loji sebenar.')}</p>
  <div class="lesson-test-btns"><button value="close" class="ghost">${tx('Close','Tutup')}</button><button type="button" data-dl>${tx('Download (JSON)','Muat turun (JSON)')}</button><button type="button" class="primary" data-print>🖨 ${tx('Print / save as PDF','Cetak / simpan PDF')}</button></div></form>`;
 rec.querySelector('#lr-name').oninput=e=>{try{localStorage.setItem('pome-learner',e.target.value)}catch{}};
 rec.querySelector('[data-print]').onclick=()=>{document.body.classList.add('print-record');window.print();setTimeout(()=>document.body.classList.remove('print-record'),500)};
 rec.querySelector('[data-dl]').onclick=()=>{const blob=new Blob([JSON.stringify({title:'POME Lab learning record',learner:rec.querySelector('#lr-name').value,...gather(),assumptions:'Illustrative educational model; not plant predictions or compliance evidence.'},null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='pome-learning-record.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
 if(!rec.open)rec.showModal();
}
// The old export button now opens the same complete record.
const exp=$('export');if(exp)exp.onclick=showRecord;

/* ---------- toast ---------- */
const toastEl=document.createElement('div');toastEl.className='lesson-toast';toastEl.setAttribute('role','status');document.body.append(toastEl);
function toast(t){toastEl.textContent=t;toastEl.classList.add('show');setTimeout(()=>toastEl.classList.remove('show'),5000)}

window.addEventListener('pome-lang',()=>{render();if(dlg.open&&answers.length&&dlg.querySelector('fieldset'))renderTest()});
render();
