/*
 "Design your scenario" for SMK learners. Builds on the original controls (same ids, same
 model in values()), and adds:
  1. sliders that cannot affect the chosen pathway are greyed out with a reason;
  2. an ⓘ help line and an everyday comparison for every control;
  3. mill cards that set the flow AND show the mill's constraints;
  4. pathway cards that show their trade-offs at a glance;
  5. instant results right under the sliders;
  6. a guided "change one thing" challenge with a Run 1/3 counter and Save in the panel;
  7. two numbered sections, value chips, start-value ticks and Reset beside the sliders.
 Conversions are illustrative and state their assumption.
*/
const $=id=>document.getElementById(id);
const panel=document.querySelector('.panel.controls');
if(panel&&$('scenario')&&typeof values==='function')build();

function build(){
 const fmt=n=>Math.round(n).toLocaleString('en');
 const START={flow:300,cod:50000,capture:90,reuse:50};
 const MILLS={
  small:{icon:'🏡',name:'Small mill',flow:100,tags:['💰 Small budget','🗺️ Land available','👷 Few trained staff']},
  medium:{icon:'🏭',name:'Medium mill',flow:300,tags:['💰 Budget in stages','⚡ Needs energy on site','👷 Some trained staff']},
  large:{icon:'🏗️',name:'Large mill',flow:800,tags:['💰 Big budget','👷 Skilled engineers','💧 Can use recovered water']}
 };
 const PATH=[['💰 Cheap','🗺️ Lots of land','💨 Methane escapes'],['💰💰 Medium','⚡ Biogas power','👷 Trained staff'],['💰💰💰 Costly','⚡ Power','💧 Water reuse','🌱 Fertiliser']];
 const HELP={
  flow:['How much POME the mill sends out each day. A bigger mill makes more.',v=>`≈ ${fmt(v/15)} tanker lorries a day (if one lorry holds 15 m³)`],
  cod:['COD shows how dirty the water is: how much oxygen it would take to break the waste down. Higher = dirtier.',v=>v<35000?'Weaker than usual raw POME':v<70000?'Typical raw POME: very strong':'Extremely strong POME'],
  capture:['Of the biogas the bacteria make, how much the cover catches. The rest escapes as methane, a strong greenhouse gas.',v=>`${100-v}% of the methane still escapes`],
  reuse:['How much treated water is cleaned further and used again in the mill instead of taking river water.',v=>`${v}% of the water is reused instead of discharged`]
 };
 const OFF={capture:['Ponds have no cover, so there is nothing to catch.','Pick UASB or Integrated recovery to capture methane.'],reuse:['Reuse needs membrane polishing.','Only Integrated recovery can reuse water.']};

 /* ---- 7. section headings and the mill cards (3) ---- */
 const sel=$('scenario'),ctx=$('context');
 const h1=document.createElement('h4');h1.className='sc-step';h1.innerHTML='<span>1</span> Choose the mill and the treatment';
 panel.querySelector('h3').after(h1);
 const mills=document.createElement('div');mills.className='sc-mills';mills.setAttribute('role','radiogroup');mills.setAttribute('aria-label','Mill size');
 mills.innerHTML=Object.entries(MILLS).map(([k,m])=>`<button type="button" role="radio" data-mill="${k}"><span class="sc-ico">${m.icon}</span><b>${m.name}</b><small>${m.tags.join('<br>')}</small></button>`).join('');
 const millLabel=panel.querySelector('label[for="scenario"]');if(millLabel)millLabel.textContent='Mill size';sel.before(mills);const millTags=document.createElement('div');millTags.className='sc-tags';mills.after(millTags);sel.classList.add('sc-hidden');ctx.classList.add('sc-context');
 mills.addEventListener('click',e=>{const b=e.target.closest('[data-mill]');if(!b)return;sel.value=b.dataset.mill;sel.dispatchEvent(new Event('change'));refresh()});

 /* ---- 4. pathway trade-offs ---- */
 document.querySelectorAll('.controls [data-option]').forEach(b=>{const t=document.createElement('span');t.className='sc-trade';t.textContent=PATH[+b.dataset.option].join(' · ');b.append(t)});

 /* ---- 7. second section heading ---- */
 const h2=document.createElement('h4');h2.className='sc-step';h2.innerHTML='<span>2</span> Change one thing at a time';
 panel.querySelector('label[for="flow"]').before(h2);

 /* ---- 1 + 2. help, comparisons, start ticks and disabled reasons per slider ---- */
 const rows={};
 for(const id of ['flow','cod','capture','reuse']){
  const input=$(id),label=panel.querySelector(`label[for="${id}"]`);
  const wrap=document.createElement('div');wrap.className='sc-row';label.before(wrap);wrap.append(label,input);
  const info=document.createElement('button');info.type='button';info.className='sc-info';info.setAttribute('aria-label','What does this mean?');info.setAttribute('aria-expanded','false');info.textContent='ⓘ';label.insertBefore(info,label.querySelector('output'));
  const help=document.createElement('p');help.className='sc-help';help.hidden=true;help.textContent=HELP[id][0];
  const hint=document.createElement('p');hint.className='sc-hint';
  const off=document.createElement('p');off.className='sc-off';off.hidden=true;
  wrap.append(hint,help,off);
  info.onclick=e=>{e.preventDefault();help.hidden=!help.hidden;info.setAttribute('aria-expanded',String(!help.hidden))};
  const dl=document.createElement('datalist');dl.id='start-'+id;dl.innerHTML=`<option value="${START[id]}"></option>`;wrap.append(dl);input.setAttribute('list',dl.id);
  rows[id]={wrap,input,hint,off};
 }

 /* ---- 5. instant results ---- */
 const live=document.createElement('div');live.className='sc-live';live.setAttribute('aria-live','polite');
 rows.reuse.wrap.after(live);

 /* ---- 6. guided challenge, save with run counter, reset beside the sliders ---- */
 const coach=document.createElement('div');coach.className='sc-coach';
 coach.innerHTML='<p class="sc-task"></p><p class="sc-warn" hidden></p><div class="sc-btns"><button type="button" class="sc-save">💾 Save run <b>1</b> / 3</button><button type="button" class="sc-reset">↺ Reset</button></div>';
 live.after(coach);
 const TASKS=[
  ['Run 1','Keep everything as it is and save. This is your starting point.'],
  ['Run 2','Change only Influent COD (dirtier or cleaner POME), then save. What happens to the water leaving the plant?'],
  ['Run 3','Now change only the treatment pathway, then save. Which one recovers the most?']
 ];
 let saved=0,base=snapshot();
 function snapshot(){const v=values();return {scenario:v.scenario,pathway:v.pathway,flow:v.flow,cod:+$('cod').value,capture:+$('capture').value,reuse:+$('reuse').value}}
 function changed(){const now=snapshot(),names={scenario:'mill size',pathway:'pathway',flow:'POME flow',cod:'Influent COD',capture:'methane capture',reuse:'water reuse'};return Object.keys(names).filter(k=>now[k]!==base[k]).map(k=>names[k])}
 coach.querySelector('.sc-save').onclick=()=>$('save').click();
 $('save').addEventListener('click',()=>{saved++;base=snapshot();queueMicrotask(refresh)});$('clear')?.addEventListener('click',()=>{saved=0;base=snapshot();queueMicrotask(refresh)});
 coach.querySelector('.sc-reset').onclick=()=>{$('reset').click();refresh()};

 function refresh(){
  const v=values();
  // Mill cards follow the select.
  mills.querySelectorAll('[data-mill]').forEach(b=>{const on=b.dataset.mill===sel.value;b.classList.toggle('on',on);b.setAttribute('aria-checked',String(on))});millTags.innerHTML=(MILLS[sel.value]?.tags||[]).map(t=>'<span>'+t+'</span>').join('');
  // Hints, and greyed-out sliders with a reason.
  for(const [id,r] of Object.entries(rows)){
   const val=+r.input.value;r.hint.textContent=HELP[id][1](val);
   const dis=r.input.disabled;r.wrap.classList.toggle('off',dis);r.off.hidden=!dis;r.hint.hidden=dis;
   if(dis)r.off.innerHTML=`🔒 <b>${OFF[id][0]}</b> ${OFF[id][1]}`;
  }
  // Instant results (same model as the result cards below).
  const kwh=v.gas*3.5;
  live.innerHTML=`<div><span>🧪 Water leaving</span><b>${fmt(v.residual)}</b><small>mg/L COD</small></div>`+
   `<div><span>🔥 Methane caught</span><b>${fmt(v.gas)}</b><small>m³/day${v.gas?` · ≈ ${fmt(kwh)} kWh*`:''}</small></div>`+
   `<div><span>💧 Water reused</span><b>${fmt(v.water)}</b><small>m³/day</small></div>`;
  live.title='* Illustrative: about 3.5 kWh of electricity per m³ of methane in a gas engine.';
  // Challenge.
  const step=Math.min(saved,2),[title,text]=TASKS[step],ch=changed();
  coach.querySelector('.sc-task').innerHTML=saved>=3?'✅ <b>Three runs saved!</b> Open the <b>Compare</b> tab and explain each difference.':`🎯 <b>${title}:</b> ${text}`;
  const warn=coach.querySelector('.sc-warn');
  warn.hidden=!(saved>0&&ch.length>1);warn.textContent=`You changed ${ch.length} things (${ch.join(', ')}). Change one at a time so you know what caused the result.`;
  coach.querySelector('.sc-save b').textContent=Math.min(saved+1,3);coach.querySelector('.sc-save').classList.toggle('done',saved>=3);
 }
 // Run after the page's own update() so values and disabled states are current.
 const later=()=>queueMicrotask(refresh);
 panel.addEventListener('input',later);panel.addEventListener('click',later);sel.addEventListener('change',later);
 document.querySelectorAll('[data-option]').forEach(b=>b.addEventListener('click',later));
 refresh();
}
