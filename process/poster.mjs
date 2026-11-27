/*
 The group's Part A poster, rebuilt as an interactive "start here" panel for Part B.
 Conventional management (problems) vs the redesigned integrated resource-recovery
 system (five stages), the central decision question with a prediction learners commit
 to before experimenting, the investigation focus as a checklist that links into the
 simulator, key benefits and the circular-economy loop. Poster figures are shown as the
 group's values and flagged for source checking.
*/
const STORE='pome-poster';
let S;try{S=JSON.parse(localStorage.getItem(STORE))}catch{}S=Object.assign({focus:{},prediction:null},S||{});
const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(S))}catch{}};
const $=id=>document.getElementById(id);

const PROBLEMS=[
 ['Fugitive methane (CH₄) emissions','Open anaerobic ponds release the methane they make straight to the air. Methane traps far more heat than CO₂ over 20 years, so the ponds become a hidden climate liability.'],
 ['Odour complaints','Hydrogen sulphide and volatile fatty acids from open ponds drift to nearby housing, especially when ponds are overloaded.'],
 ['Large land footprint','A series of anaerobic, facultative and aerobic ponds needs long retention times and therefore a lot of land.'],
 ['Difficulty meeting strict BOD limits','Ponds struggle to reach the stricter 20 mg/L BOD limit applied in sensitive areas; overflow in heavy rain adds risk.']
];
const STAGES=[
 {n:1,title:'Pre-treatment & heat recovery',body:'Raw POME leaves the mill at about 85 °C. It is cooled to about 37 °C (the mesophilic range digesters work best in) and residual oil is skimmed off as technical crude palm oil (CPO). Screening removes fibre that would clog pumps.',out:'Technical CPO · heat',unit:0,try:'Open the inlet in 3D, then watch the oil droplets and fibre on the screen.'},
 {n:2,title:'Anaerobic digestion & biogas capture',body:'High-rate digesters (such as UASB) or covered lagoons convert organics to biogas while removing about 90–95 % of COD. The biogas is roughly 60–65 % methane; capturing it stops the emissions an open pond would release.',out:'Biogas (60–65 % CH₄)',unit:1,try:'Choose Integrated recovery, raise Methane capture and compare the methane result.'},
 {n:3,title:'Biogas conditioning & energy',body:'Hydrogen sulphide is removed (desulphurisation) so it cannot corrode engines, then the gas is either burnt in a combined heat-and-power engine (electricity for the mill or the grid) or compressed into BioCNG as transport fuel.',out:'Electricity · BioCNG',unit:3,try:'Open the biogas engine in 3D and find the H₂S scrubber and BioCNG skid.'},
 {n:4,title:'Aerobic polishing & tertiary treatment',body:'Aerobic treatment (for example a sequencing batch reactor) removes the remaining organics and ammonia. Tertiary membranes (UF/RO) then produce water clean enough to reuse in the mill, with the rest discharged below the BOD limit.',out:'Reclaimed process water',unit:2,try:'Set Water reuse fraction and see how much river water is replaced.'},
 {n:5,title:'Sludge & nutrient recovery',body:'Excess sludge is dewatered and co-composted with empty fruit bunches (EFB) into bio-fertiliser for the plantation, closing the nutrient loop — once its quality has been checked.',out:'Bio-fertiliser',unit:4,try:'Open the drying bed in 3D and follow the sludge to the compost windrows.'}
];
const FOCUS=[
 ['characterise','Characterise POME','Look at the raw POME figures on the left, then open the inlet in 3D.',()=>{openUnit(0)}],
 ['compare','Compare biological options','Compare ponds, UASB + aerobic and integrated recovery in the Compare tab.',()=>window.tab?.('compare')],
 ['biogas','Evaluate biogas capture','Choose a recovery pathway and change Methane capture.',()=>{choose(2);$('capture')?.focus()}],
 ['water','Consider water reuse & nutrients','Set the Water reuse fraction in Integrated recovery.',()=>{choose(2);$('reuse')?.focus()}],
 ['assess','Assess the resource-recovery approach','Make and defend your recommendation in Your decision.',()=>window.tab?.('challenge')]
];
const BENEFITS=[['Pollution control','Compliance and RSPO certification'],['GHG reduction','Captured methane is not released'],['Water savings','Reclaimed water replaces river intake'],['Nutrient loop','Bio-fertiliser returns to the palms'],['Value addition','Electricity, BioCNG, bio-fertiliser'],['Market requirement','Buyers increasingly ask for low-carbon oil']];

function choose(i){document.querySelector(`[data-option="${i}"]`)?.click()}
function openUnit(i){choose(i===0?1:2);setTimeout(()=>{const v=document.querySelector('.reactor-view');v?.scrollIntoView({behavior:'smooth',block:'center'});const sel=document.querySelector('.reactor-controls select');if(sel){sel.value=String(i);sel.onchange?.()}},250)}
function tick(id){S.focus[id]=true;save();render()}

const section=document.createElement('section');section.className='poster panel';section.setAttribute('aria-labelledby','poster-title');
section.innerHTML=`
 <header class="poster-head"><span class="eyebrow">Start here · from the group's Part A poster</span><h2 id="poster-title">POME in Malaysia: wastewater problem or renewable resource?</h2>
 <p>High-strength organic wastewater from processing fresh fruit bunches (FFB) — about <b>0.60–0.67 m³ for every tonne of FFB</b>.<sup class="flag" title="Poster figure: cite the source in Part A">*</sup></p></header>
 <div class="poster-grid">
  <article class="poster-col conv"><h3>Conventional POME management <small>wastewater focus</small></h3>
   <div class="raw"><b>Raw POME<sup class="flag" title="Poster figures: cite the source in Part A">*</sup></b><span>BOD₃ (30 °C) 18,000–30,000 mg/L</span><span>COD 45,000–75,000 mg/L</span><span>Hot, acidic, oily, high in suspended solids</span></div>
   <p class="flowline">Raw POME → open anaerobic ponds &amp; lagoons → discharge</p>
   <ul class="problems">${PROBLEMS.map(([t],i)=>`<li><button data-problem="${i}">⚠ ${t}</button></li>`).join('')}</ul>
   <p class="liability">Result: environmental liability and operating costs</p></article>
  <article class="poster-col mid"><h3>Decision question</h3><p class="question">Optimise for <b>pollution removal</b>, or redesign for <b>resource recovery</b>?</p>
   <div class="predict" role="group" aria-label="Your prediction"><span>Before you experiment, what do you predict?</span><button data-predict="removal">Optimise pollution removal</button><button data-predict="recovery">Redesign for recovery</button><button data-predict="depends">It depends on the mill</button></div>
   <p class="predicted" aria-live="polite"></p>
   <h4>Investigation focus</h4><ol class="focus">${FOCUS.map(([id,t,h])=>`<li><button data-focus="${id}"><i aria-hidden="true"></i><b>${t}</b><small>${h}</small></button></li>`).join('')}</ol></article>
  <article class="poster-col integ"><h3>Integrated resource recovery <small>the opportunity</small></h3>
   <ol class="stages">${STAGES.map(s=>`<li><button data-stage-n="${s.n}"><span class="num">${s.n}</span><b>${s.title}</b><small>${s.out}</small></button></li>`).join('')}</ol>
   <div class="outputs"><span>⚡ Grid-connected CHP</span><span>🚛 Off-grid BioCNG</span><span>💧 Reclaimed water</span><span>🌱 Bio-fertiliser with EFB</span></div></article>
 </div>
 <div class="poster-detail" aria-live="polite" hidden><h4></h4><p class="body"></p><p class="try"></p><div class="acts"></div></div>
 <div class="poster-foot"><svg class="loop" viewBox="0 0 160 160" role="img" aria-label="Circular economy loop: plantation, mill, POME treatment and back to the plantation">
   <circle cx="80" cy="80" r="56" class="ring"/><circle cx="80" cy="80" r="56" class="flow"/>
   <text x="80" y="20" text-anchor="middle">Plantation</text><text x="148" y="84" text-anchor="end">Mill</text><text x="80" y="150" text-anchor="middle">POME</text><text x="12" y="84">Recovery</text>
   <text x="80" y="78" text-anchor="middle" class="big">Circular</text><text x="80" y="94" text-anchor="middle" class="big">economy</text></svg>
  <ul class="benefits">${BENEFITS.map(([t,d])=>`<li><b>${t}</b><small>${d}</small></li>`).join('')}<li class="ghg"><b>GHG example</b><small>about 45,000–52,000 t CO₂e a year avoided for a 60 t/h mill<sup class="flag" title="Poster figure: cite the source in Part A">*</sup></small></li></ul></div>
 <p class="note"><sup class="flag">*</sup> Figures are taken from the group's Part A poster and must be traced to the sources cited in Part A before they are used as evidence.</p>`;

function detail(title,body,tryText,actions){const d=section.querySelector('.poster-detail');d.hidden=false;d.querySelector('h4').textContent=title;d.querySelector('.body').textContent=body;d.querySelector('.try').textContent=tryText||'';
 d.querySelector('.acts').replaceChildren(...actions.map(([label,fn])=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;return b}))}
section.addEventListener('click',e=>{
 const p=e.target.closest('[data-problem]'),st=e.target.closest('[data-stage-n]'),f=e.target.closest('[data-focus]'),pr=e.target.closest('[data-predict]');
 if(p){const [t,b]=PROBLEMS[+p.dataset.problem];detail(t,b,'Compare: choose Conventional ponds in the simulator, then UASB + aerobic.',[['Choose conventional ponds',()=>choose(0)],['Compare with UASB + aerobic',()=>choose(1)]]);tick('characterise')}
 if(st){const s=STAGES[+st.dataset.stageN-1];detail(`Stage ${s.n}: ${s.title}`,s.body,'Try it: '+s.try,[['View in 3D',()=>openUnit(s.unit)],['Use the integrated pathway',()=>choose(2)]]);section.querySelectorAll('[data-stage-n]').forEach(b=>b.classList.toggle('on',b===st));if(s.n===2)tick('biogas');if(s.n===4)tick('water')}
 if(f){const item=FOCUS.find(x=>x[0]===f.dataset.focus);tick(item[0]);item[3]()}
 if(pr){S.prediction=pr.dataset.predict;save();render()}
});
function render(){section.querySelectorAll('[data-focus]').forEach(b=>b.classList.toggle('done',!!S.focus[b.dataset.focus]));
 section.querySelectorAll('[data-predict]').forEach(b=>b.setAttribute('aria-pressed',String(S.prediction===b.dataset.predict)));
 const labels={removal:'optimise for pollution removal',recovery:'redesign for resource recovery',depends:'it depends on the mill'};
 section.querySelector('.predicted').textContent=S.prediction?`Your prediction: ${labels[S.prediction]}. Test it in the simulator, then revisit it in Your decision.`:'';
 const banner=document.getElementById('prediction-recall');if(banner)banner.textContent=S.prediction?`Earlier you predicted: “${labels[S.prediction]}”. Has the evidence changed your mind? Say why in your recommendation.`:''}
// Place the poster at the top of the simulator, and recall the prediction in the decision task.
const studio=document.getElementById('studio'),grid=studio?.querySelector('.grid');if(grid)grid.before(section);
const challenge=document.getElementById('challenge');if(challenge){const recall=document.createElement('p');recall.id='prediction-recall';recall.className='notice';const h=challenge.querySelector('h1');(h||challenge.firstChild)?.after(recall)}
render();
