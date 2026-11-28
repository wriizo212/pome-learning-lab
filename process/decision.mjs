/*
 "Your decision" scaffolding for SMK learners: sentence starters that drop into the answer
 box, and a live checklist of the four success criteria (a choice, two reasons, one
 problem, one condition) that ticks as the learner writes, in Malay or English.
 It checks the structure only, not whether the science is right.
*/
const box=document.getElementById('reason');
if(box)build();
function build(){
 const T=(en,ms)=>window.pomeLang?.()==='en'?en:ms;
 const wrap=document.createElement('div');wrap.className='dec-help';box.before(wrap);
 const list=document.createElement('ul');list.className='dec-check';box.after(list);
 const STARTERS=[['I choose …','Saya pilih …'],[' because …',' kerana …'],[' It is also better for …',' Ia juga lebih baik untuk …'],[' One problem is …',' Satu masalahnya ialah …'],[' Before it starts, the mill must …',' Sebelum dimulakan, kilang mesti …']];
 const CRIT=[
  [['Name your choice','Nyatakan pilihan anda'],t=>/kolam|pond|uasb|bersepadu|integrated|biogas|digester|pencerna/.test(t)||!!document.querySelector('[data-choice].active')],
  [['Give two reasons','Beri dua sebab'],t=>{const hits=['kos','cost','murah','cheap','tanah','land','metana','methane','tenaga','energy','elektrik','electric','air','water','bajet','budget','pekerja','staff','sungai','river','bau','smell','baja','fertili'].filter(w=>t.includes(w)).length;return /kerana|because|sebab/.test(t)&&hits>=2}],
  [['Name one problem it still has','Nyatakan satu masalah yang masih ada'],t=>/masalah|kelemahan|risiko|limitation|problem|risk|tetapi|but |namun/.test(t)],
  [['State one condition','Nyatakan satu syarat'],t=>/perlu|mesti|syarat|must|need|should|require|sebelum|before/.test(t)]
 ];
 function render(){
  wrap.innerHTML=`<p>${T('Build your answer: tap a starter, then finish the sentence.','Bina jawapan anda: tekan permulaan ayat, kemudian lengkapkan.')}</p><div class="dec-starters">${STARTERS.map(([en,ms],i)=>`<button type="button" data-s="${i}">${T(en,ms).trim()}</button>`).join('')}</div>`;
  check();
 }
 function check(){const t=box.value.toLowerCase();const done=CRIT.map(([,f])=>f(t));
  list.innerHTML=CRIT.map(([[en,ms]],i)=>`<li class="${done[i]?'ok':''}">${done[i]?'✔':'○'} ${T(en,ms)}</li>`).join('')+`<li class="dec-score">${done.filter(Boolean).length} / 4</li>`}
 wrap.addEventListener('click',e=>{const b=e.target.closest('[data-s]');if(!b)return;const [en,ms]=STARTERS[+b.dataset.s];const s=T(en,ms);const pos=box.selectionStart??box.value.length;box.value=box.value.slice(0,pos)+s+box.value.slice(pos);box.focus();const c=pos+s.length-1;box.setSelectionRange(c,c+1);check()});
 box.addEventListener('input',check);document.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>setTimeout(check)));
 window.addEventListener('pome-lang',render);render();
}
