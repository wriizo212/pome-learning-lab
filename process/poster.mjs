/*
 The group's Part A poster, rebuilt as a guided "Start here" briefing for SMK learners.
 Instead of showing everything at once, it walks through four steps, one screen at a
 time: 1 the problem, 2 the big question (make a prediction), 3 the solution (five
 recovery stages, each linked to the 3D plant), 4 your mission (a checklist that opens
 the right part of the simulator). Progress is remembered, the briefing can be folded
 away, and poster figures that still need a source are marked with *.
*/
const STORE='pome-poster';
let S;try{S=JSON.parse(localStorage.getItem(STORE))}catch{}S=Object.assign({focus:{},prediction:null,step:0,folded:false},S||{});
const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(S))}catch{}};
const $=id=>document.getElementById(id);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);

const FACTS=[['🔥','Very hot','About 80–90 °C when it leaves the mill'],['🧪','Acidic and oily','Full of oil, fibre and rotting plant matter'],['🌊','A lot of it','About 0.6 m³ for every tonne of fruit bunches*']];
const PROBLEMS=[
 ['💨','Methane escapes','Open ponds let methane (CH₄) bubble into the air. Methane traps much more heat than CO₂, so it speeds up climate change.'],
 ['👃','Bad smell','Hydrogen sulphide (H₂S) smells like rotten eggs and drifts to nearby homes.'],
 ['🗺️','Needs lots of land','A chain of ponds holds POME for a long time, so it needs a very large area.'],
 ['🐟','Hard to keep the river safe','Ponds struggle to meet strict BOD limits, and heavy rain can make them overflow into the river.']
];
const STAGES=[
 {n:1,icon:'❄️',title:'Clean and cool',out:'Oil to sell · heat',body:'Hot POME is cooled to about 37 °C, the temperature digester bacteria like. Floating oil is skimmed off and sold, and fibre is screened out.',unit:0},
 {n:2,icon:'🦠',title:'Digest and catch biogas',out:'Biogas',body:'In a closed digester, bacteria that live without air eat most of the pollution and make biogas (mostly methane). The cover catches the gas instead of letting it escape.',unit:1},
 {n:3,icon:'⚡',title:'Make energy',out:'Electricity · BioCNG',body:'The smelly H₂S is scrubbed out, then the biogas is burnt in an engine to make electricity, or squeezed into tanks as BioCNG fuel for lorries.',unit:3},
 {n:4,icon:'💧',title:'Polish the water',out:'Water to reuse',body:'Air bubbles help other bacteria clean up what is left. Membranes can then filter the water so the mill can use it again.',unit:2},
 {n:5,icon:'🌱',title:'Turn sludge into fertiliser',out:'Fertiliser',body:'Leftover sludge is pressed and composted with empty fruit bunches (EFB) into fertiliser for the palms, after its quality is checked.',unit:4}
];
const MISSION=[
 ['characterise','Look at raw POME','Open the inlet in 3D and see what comes from the mill.',()=>openUnit(0)],
 ['compare','Compare the three ways','Try Conventional ponds, then UASB + aerobic, then Integrated recovery.',()=>{choose(0);scrollTo('.grid')}],
 ['biogas','Catch the biogas','Pick Integrated recovery and move the Methane capture slider.',()=>{choose(2);$('capture')?.focus()}],
 ['water','Save water','Move the Water reuse slider and watch the result change.',()=>{choose(2);$('reuse')?.focus()}],
 ['assess','Make your decision','Answer the mill manager in the Your decision tab.',()=>window.tab?.('challenge')]
];
const STEPS=[['1','The problem'],['2','The big question'],['3','The solution'],['4','Your mission']];
const PRED={removal:'Just clean the water',recovery:'Clean it and recover resources',depends:'It depends on the mill'};

function choose(i){document.querySelector(`[data-option="${i}"]`)?.click()}
function scrollTo(sel){document.querySelector(sel)?.scrollIntoView({behavior:'smooth',block:'start'})}
// The 3D plant may still be loading, so wait for it (up to 8 s) before jumping to the unit.
function openUnit(i){choose(i===0?1:2);window.pomeLoad3D?.('reactor');let n=0;const go=()=>{const sel=document.querySelector('.reactor-view:not(.ponds-view) .reactor-controls select');if(!sel){if(++n<32)setTimeout(go,250);return}document.querySelector('.reactor-view:not(.ponds-view)')?.scrollIntoView({behavior:'smooth',block:'center'});sel.value=String(i);sel.onchange?.()};setTimeout(go,250)}
function tick(id){if(!S.focus[id]){S.focus[id]=true;save();render()}}

const section=document.createElement('section');section.className='brief';section.setAttribute('aria-labelledby','brief-title');
const studio=document.getElementById('studio'),grid=studio?.querySelector('.grid');if(grid)grid.before(section);
const challenge=document.getElementById('challenge');if(challenge){const recall=document.createElement('p');recall.id='prediction-recall';recall.className='notice';const h=challenge.querySelector('h1');(h||challenge.firstChild)?.after(recall)}

function stepBody(step){
 if(step===0)return `<h3 class="brief-h">What is POME, and why is it a problem?</h3>
  <p class="brief-lead">POME (palm oil mill effluent) is the dirty wastewater left after palm oil is made.</p>
  <div class="brief-facts">${FACTS.map(([i,t,d])=>`<div><span>${i}</span><b>${esc(t)}</b><small>${esc(d)}</small></div>`).join('')}</div>
  <h4 class="brief-sub">Most mills use open ponds. Tap each card to see what goes wrong:</h4>
  <div class="brief-cards">${PROBLEMS.map(([i,t,d],k)=>`<button class="brief-card" data-problem="${k}" aria-expanded="false"><span>${i}</span><b>${esc(t)}</b><small>${esc(d)}</small></button>`).join('')}</div>`;
 if(step===1)return `<h3 class="brief-h">The big question</h3>
  <p class="brief-q">Should the mill <b>just clean the water</b>, or <b>clean it and recover useful things</b> from it?</p>
  <p class="brief-lead">There is no wrong answer yet. Choose what you think now; you will test it in the simulator.</p>
  <div class="brief-predict" role="group" aria-label="Your prediction">${Object.entries(PRED).map(([k,t])=>`<button data-predict="${k}" aria-pressed="${S.prediction===k}">${k==='removal'?'🧽':k==='recovery'?'♻️':'🤔'} ${esc(t)}</button>`).join('')}</div>
  <p class="brief-saved" aria-live="polite">${S.prediction?'✔ Saved: “'+esc(PRED[S.prediction])+'”. You will see it again when you decide.':''}</p>`;
 if(step===2)return `<h3 class="brief-h">The solution: five steps that turn waste into resources</h3>
  <p class="brief-lead">Tap a step to learn what happens, then see it in the 3D plant.</p>
  <ol class="brief-flow">${STAGES.map(s=>`<li><button data-stage-n="${s.n}" aria-pressed="false"><span class="num">${s.n}</span><span class="ico">${s.icon}</span><b>${esc(s.title)}</b><small>${esc(s.out)}</small></button></li>`).join('')}</ol>
  <div class="brief-detail" aria-live="polite" hidden></div>
  <div class="brief-loop"><span>🌴 Palms</span><i>→</i><span>🏭 Mill</span><i>→</i><span>💧 POME</span><i>→</i><span>♻️ Recovery</span><i>→</i><span>🌱 back to the palms</span></div>
  <p class="brief-note">Why it matters: less greenhouse gas, less river water used, energy and fertiliser from waste. A 60 t/h mill could avoid about 45,000–52,000 t CO₂e a year*.</p>`;
 return `<h3 class="brief-h">Your mission</h3>
  <p class="brief-lead">Do these five tasks in order. Each button takes you to the right place.</p>
  <ol class="brief-mission">${MISSION.map(([id,t,h],k)=>`<li class="${S.focus[id]?'done':''}"><span class="tick">${S.focus[id]?'✔':k+1}</span><div><b>${esc(t)}</b><small>${esc(h)}</small></div><button data-focus="${id}">${S.focus[id]?'Again':'Go'} →</button></li>`).join('')}</ol>`;
}
function render(){
 const done=Object.values(S.focus).filter(Boolean).length;
 section.classList.toggle('folded',S.folded);
 section.innerHTML=`<div class="brief-top"><div><span class="eyebrow">Start here · mission briefing</span><h2 id="brief-title">POME: wastewater problem or useful resource?</h2></div>
  <button class="brief-fold" aria-expanded="${!S.folded}">${S.folded?'Open briefing ▾':'Hide briefing ▴'}</button></div>
  ${S.folded?`<p class="brief-mini">Mission progress: <b>${done} / 5</b> tasks${S.prediction?' · your prediction: “'+esc(PRED[S.prediction])+'”':''}</p>`:`
  <nav class="brief-steps" aria-label="Briefing steps">${STEPS.map(([n,t],i)=>`<button data-step="${i}" aria-current="${i===S.step?'step':'false'}" class="${i<S.step?'past':''}"><span>${n}</span>${esc(t)}</button>`).join('')}</nav>
  <div class="brief-body">${stepBody(S.step)}</div>
  <div class="brief-nav"><button data-go="-1" ${S.step===0?'disabled':''}>← Back</button><span>Step ${S.step+1} of 4</span>${S.step<3?`<button class="primary" data-go="1">Next: ${esc(STEPS[S.step+1][1])} →</button>`:`<button class="primary" data-fold>Start the simulator ↓</button>`}</div>
  <p class="brief-src">* From the group's Part A poster; check the source before using it as evidence.</p>`}`;
 const banner=$('prediction-recall');if(banner)banner.textContent=S.prediction?`Earlier you predicted: “${PRED[S.prediction]}”. Has the evidence changed your mind? Say why in your answer.`:'';
}
section.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.matches('.brief-fold')||b.dataset.fold!==undefined){S.folded=!S.folded||b.dataset.fold!==undefined;save();render();if(b.dataset.fold!==undefined)scrollTo('.grid');return}
 if(b.dataset.step){S.step=+b.dataset.step;save();render();return}
 if(b.dataset.go){S.step=Math.max(0,Math.min(3,S.step+ +b.dataset.go));if(S.step===1)tick('characterise');save();render();section.scrollIntoView({behavior:'smooth',block:'start'});return}
 if(b.dataset.problem){const open=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',String(open));return}
 if(b.dataset.predict){S.prediction=b.dataset.predict;save();render();return}
 if(b.dataset.stageN){const s=STAGES[+b.dataset.stageN-1],d=section.querySelector('.brief-detail');section.querySelectorAll('[data-stage-n]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  d.hidden=false;d.innerHTML=`<b>Step ${s.n} · ${esc(s.title)}</b><p>${esc(s.body)}</p><button data-unit="${s.unit}">See it in 3D →</button>`;if(s.n===2)tick('biogas');if(s.n===4)tick('water');return}
 if(b.dataset.unit){openUnit(+b.dataset.unit);return}
 if(b.dataset.focus){const item=MISSION.find(x=>x[0]===b.dataset.focus);tick(item[0]);item[3]()}
});
render();
