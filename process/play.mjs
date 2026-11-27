import * as T from './three.module.min.js';
import {createSound} from './sound.mjs?v=shift17';
import {createLearning} from './learn.mjs?v=shift17';

/*
 Interactive play layer shared by the Mill Arcade and the main UASB simulator: walk as a
 worker, pick up and use tools, sample and test water, read gas levels, turn valves, talk
 with the crew (branching, voiced dialogue with small jobs to do), and click any label,
 sign or object to learn what it is. Each scene supplies a config (items, places, jobs,
 sounds, words). Readings are illustrative teaching values, not plant data.
*/

const INFO={
 'palm oil mill':['Palm oil mill','Fresh fruit bunches are sterilised with steam, stripped, digested and pressed to get crude palm oil. Steam condensate, clarifier sludge and hydrocyclone water make up POME — roughly 0.5 to 0.75 m³ for every tonne of bunches processed.'],
 'to mill grid':['Generator cable to the mill grid','Electricity from the biogas engine goes back to the mill and replaces diesel or grid power. Each cubic metre of biogas gives roughly 1.8–2 kWh of electricity.'],
 'flare':['Biogas flare','Burns gas the engine cannot use, so it is never vented. Burning turns methane (CH₄, a strong greenhouse gas) into carbon dioxide and water.'],
 'intake':['Intake and screening','Hot raw POME (about 80 °C) arrives from the mill. Bar screens catch fibre and shell, and oil floats to the top. Removing solids early protects the pumps and the digester.'],
 'inlet':['Inlet and bar screen','Hot raw POME (about 80 °C) pours in from the mill. The bar screen catches fibre and shell before the feed is pumped to the UASB reactor; floating oil is skimmed off.'],
 'digester':['Covered anaerobic digester','Without oxygen, microbes break organic matter into acetate, then methanogens turn it into biogas (about 60–65 % CH₄, the rest mostly CO₂, with a little H₂S). The cover captures the gas instead of letting it escape.'],
 'uasb':['UASB reactor','Upflow anaerobic sludge blanket: the feed rises through a bed of dense microbial granules that turn organics into biogas. Three-phase separator hoods at the top split gas, liquid and sludge, so the granules stay in and the gas is collected.'],
 'gas':['Gas engine house','A gas engine burns the biogas (CH₄ + 2O₂ → CO₂ + 2H₂O) and turns a generator. Before the engine, H₂S is scrubbed out because it corrodes metal parts.'],
 'gas engine':['Gas engine house','A gas engine burns the biogas (CH₄ + 2O₂ → CO₂ + 2H₂O) and turns a generator. Before the engine, H₂S is scrubbed out because it corrodes metal parts.'],
 'biogas engine':['Biogas engine and generator','Biogas from the UASB dome is burnt in the engine (CH₄ + 2O₂ → CO₂ + 2H₂O). The crankshaft drives the generator; exhaust leaves through the stack.'],
 'polish':['Aerated polishing basin','Blowers push air through floor diffusers. Bacteria use the dissolved oxygen to break down the organics left after digestion and to turn ammonium into nitrate.'],
 'polishing':['Aerated polishing basin','Blowers push air through floor diffusers. Bacteria use the dissolved oxygen to break down the organics left after digestion and to turn ammonium into nitrate.'],
 'aeration':['Aeration basin','Air from the blowers bubbles up from floor diffusers. Floc bacteria use the dissolved oxygen to oxidise leftover organics to CO₂ and water and to nitrify ammonium to nitrate.'],
 'sludge':['Sludge drying yard','Excess sludge dries on sand and gravel beds; water drains to the pipe below or evaporates. The dried cake can be composted with empty fruit bunches after its quality is checked.'],
 'sludge yard':['Sludge drying yard','Excess sludge dries on sand and gravel beds; water drains to the pipe below or evaporates. The dried cake can be composted with empty fruit bunches after its quality is checked.'],
 'drying bed':['Sludge drying bed','Waste sludge is spread over sand and gravel. Water drains to the underdrain or evaporates; the cracked cake is shovelled out for composting.'],
 'outlet':['Outlet chamber','Treated water spirals to the draw-off strainer while the last flocs settle. From here it goes to the reuse tank or to discharge — only if the tests meet the permit.'],
 'river':['Receiving river','Fish and other river life need dissolved oxygen. Poorly treated effluent feeds bacteria that use that oxygen up, so the fish disappear and scum forms.'],
 'ffb reception':['FFB reception','Lorries tip fresh fruit bunches into a hopper. A conveyor lifts them into the mill, where they must be processed within about a day before the fruit spoils.'],
 'danger':['Danger: biogas','Methane burns in air at about 5–15 % concentration. Keep flames and sparks away from the digester and gas lines.'],
 'caution':['Caution: hot effluent','Raw POME can be 70–90 °C. A splash scalds, so wear gloves and keep clear of the inlet pour.'],
 'sample point':['Sample point','Approved place to take water samples. Wear gloves and goggles, label every bottle and test it quickly so the readings stay valid.'],
 'ppe required':['PPE required','Helmet, safety boots, gloves and a high-visibility vest are required on the treatment plant.'],
 'flammable':['Flammable: flare zone','Only permit holders enter. The flare and gas line can release burning or explosive gas.'],
 'confined space':['Confined space','Tanks and reactors can hold toxic H₂S or too little oxygen. Entry needs a permit, a gas test first, and a standby person outside.'],
 'nutrients':['Nutrient dosing','Urea and phosphate top up nitrogen and phosphorus so the aeration bacteria have balanced food. Too much would end up in the river.'],
 'pome treatment plant':['POME treatment plant','Inlet → UASB reactor → aeration basin → outlet, with biogas to the engine and sludge to the drying bed.'],
 'safety shower':['Safety shower and eye wash','If hot effluent, chemicals or sludge splash on skin or eyes, rinse here for at least 15 minutes and report it.'],
 'palm':['Oil palm (Elaeis guineensis)','A productive palm carries around 40 fronds and gives a fresh fruit bunch of 10–25 kg roughly every two to three weeks. The old frond bases (leaf boots) stay on the trunk in a spiral. Ripe bunches turn orange-red.'],
 'lorry':['FFB lorry','Brings fresh fruit bunches from the plantation to the mill.'],
 'conveyor':['Hopper and conveyor','Bunches roll from the hopper onto a conveyor that lifts them into the steriliser area of the mill.'],
 'blowers':['Aeration blowers','Blowers push air down the air main to the diffusers in the aeration basin. One can run while the other is serviced.'],
 'air blowers':['Aeration blowers','Blowers push air down the air main to the diffusers in the aeration basin. One can run while the other is serviced.'],
 'control':['Control room','Operators watch flows, gas production, temperatures and generator output here. Walk up to the door and press E to read the log.'],
 'reuse':['Treated-water tank','Treated water that passes its tests is stored here for washing and cooling, saving river water. The blue strip shows the level.'],
 'final effluent':['Final effluent tank','With UASB + aerobic treatment only, treated water is held here for monitoring and then discharged within the permit limits. Reusing it in the mill would need the membrane polishing of the integrated design.'],
 'reuse water':['Reuse water tank','Treated water that passes its tests is stored here for washing and cooling, saving river water. The blue strip shows the level.'],
 'windsock':['Windsock','Shows the wind direction, so in a gas leak everyone moves upwind, away from the gas.'],
 'extinguisher':['Fire extinguisher','For small fires only. Pull the pin, aim at the base of the fire, squeeze and sweep.'],
 'valve':['Feed valve','Controls how fast POME is fed to the reactor. Feeding too fast overloads the microbes; acids build up and gas production drops.'],
 'skip':['Screenings skip','Fibre and shell raked from the screen go here. They can be burnt in the mill boiler.'],
 'bench':['Field test bench','Quick tests for pH, dissolved oxygen (DO) and chemical oxygen demand (COD). Bring a filled sample bottle and press E to test it.'],
 'heap':['Compost heap','Dried sludge cake mixed with empty fruit bunches composts into a soil conditioner.'],
 'flowmeter':['Effluent flow meter','Shows how many cubic metres per hour leave the aeration basin. Walk up and press E to read it.'],
 'stile':['Pipe crossover stile','Steps over the feed pipe so nobody trips or stands on it.'],
 'motorbike':['Staff motorbike','How most of the shift arrives at the plant.'],
 'drain':['Surface drain','Collects rainwater and wash-down from the platform and sends it back to the inlet, so spills never reach the ground outside.'],
 'bottle':['Sample bottle','Pick it up, fill it at a sample point, then test it at the field bench.'],
 'rake':['Screen rake','Use it at the screen to pull off trapped fibre and shell.'],
 'detector':['Portable gas detector','Measures methane (as % of the lower explosive limit), H₂S and oxygen. Use it anywhere to take a reading.'],
 'shovel':['Shovel','Use it at the sludge drying area to turn the cake so it dries evenly.'],
 'extinguisher-item':['Fire extinguisher','Press F to spray. Point at the base of a fire and sweep.'],
 'lookout tower':['Lookout tower','Climb the stairs for a bird’s-eye view of the whole treatment plant and the plantation around it.'],
 'guard booth':['Gate booth','Security signs visitors in, checks PPE and logs every lorry that enters or leaves.'],
 'harvest path':['Harvest path','Harvesters walk these paths between the palm rows and carry bunches out to the collection point.'],
 'frond stack':['Frond stack','Cut fronds are stacked between the rows. They rot into mulch, return nutrients and keep the soil moist.'],
 'cattle':['Grazing cattle','Cattle graze the grass and weeds between the palms. This "cattle integration" cuts weeding costs and earns extra income.'],
 'egret':['Cattle egret','These white herons follow grazing cattle and catch the insects the cattle disturb.'],
 'owl box':['Barn owl nest box','Barn owls nest in these boxes and hunt the rats that eat palm fruit — natural pest control instead of rat poison.'],
 'ffb pile':['FFB collection point','Harvested bunches are stacked here for the lorry. They should reach the mill within about a day.'],
 'footbridge':['Footbridge','Villagers cross here to the plantation. From the middle you can look upstream to the outfall.'],
 'kampung house':['Kampung house','A village home on stilts, safe from floods. Families downstream fish in and use the river, so the mill’s effluent matters to them.'],
 'tractor':['Tractor and trailer','Carries empty fruit bunches from the mill back to the palms, where they are spread as mulch.'],
 'heat recovery':['Stage 1 · Heat recovery','Raw POME leaves the mill at about 85 °C. A plate heat exchanger and a cooling tower bring it to about 37 °C, the mesophilic range digesters work best in, and the recovered heat can warm boiler feed water.'],
 'technical cpo':['Stage 1 · Technical CPO recovery','Residual oil skimmed from the inlet is collected as technical crude palm oil — a saleable product that would otherwise foul the digester.'],
 'biogas holder':['Stage 2 · Biogas holder','A membrane dome stores the captured biogas (roughly 60–65 % methane) so the engine and compressor get a steady supply instead of flaring or venting the surplus.'],
 'h₂s scrubber':['Stage 3 · H₂S scrubber','Desulphurisation removes hydrogen sulphide before the gas is used, protecting the engine and compressor from corrosion and cutting sulphur emissions.'],
 'biocng':['Stage 3 · BioCNG skid','Cleaned biogas is upgraded and compressed into cylinders as BioCNG, a renewable fuel for lorries — useful where the grid cannot take exported power.'],
 'uf / ro':['Stage 4 · UF/RO membranes','Ultrafiltration then reverse osmosis remove fine solids, salts and remaining organics so treated water can be reused in the mill, reducing river-water intake. The reject concentrate still needs safe handling.'],
 'screw press':['Stage 5 · Screw press','Dewaters excess sludge so it is lighter and easier to compost; the pressed water returns to treatment.'],
 'efb co-compost':['Stage 5 · EFB co-composting','Dewatered sludge is mixed with shredded empty fruit bunches and composted into bio-fertiliser for the palms — after its quality has been checked.']
};
const ROLE_INFO={operator:'Runs the inlet screen and the reactor feed.',sampler:'Samples and tests water from every stage.',tech:'Keeps the gas engine, meters and instruments working.',handler:'Handles sludge drying, the wheelbarrow and the compost heap.',officer:'Checks for gas leaks and keeps the flare and permits safe.',guard:'Signs people in, checks PPE, logs lorries and patrols the fence.',harvester:'Cuts ripe bunches with the egrek and carries them to the collection point.',angler:'A villager who fishes downstream — the river tells him how well the plant is working.'};
// Quick questions each crew member can ask ("Quiz me!").
const QUIZ=[
 [{q:'Which sign tells you the reactor is being overfed?',options:['Volatile fatty acids rise and gas production drops','More fish appear in the river','The flare gets brighter'],answer:0,why:'Too much feed makes acids faster than methanogens can use them, so pH falls and gas drops.'},
  {q:'About how hot is raw POME when it leaves the mill?',options:['About 80 °C','About 25 °C','About 150 °C'],answer:0,why:'It comes from steam sterilisation and clarification, so it arrives hot — around 70–90 °C.'}],
 [{q:'A high COD means…',options:['A lot of organic pollution is still in the water','The water is very clean','The pH is exactly neutral'],answer:0,why:'COD is the oxygen the pollution would use up — higher COD, dirtier water.'},
  {q:'What do fish need in river water?',options:['Dissolved oxygen','Methane','Acetate'],answer:0,why:'Fish breathe dissolved oxygen; organic pollution lets bacteria use it up.'}],
 [{q:'Roughly how much electricity does 1 m³ of biogas give?',options:['About 2 kWh','About 200 kWh','About 0.01 kWh'],answer:0,why:'With about 60 % methane, a gas engine makes roughly 1.8–2 kWh per cubic metre.'},
  {q:'Why is H₂S removed before the gas engine?',options:['It forms acid that corrodes engine parts','It makes the engine stronger','It cools the gas'],answer:0,why:'Burning H₂S makes sulphur acids that eat metal parts.'}],
 [{q:'What can dried sludge cake become after quality checks?',options:['Compost or soil conditioner','Drinking water','Car fuel'],answer:0,why:'Mixed with empty fruit bunches it composts into a soil conditioner for the plantation.'},
  {q:'How does sludge dry on the drying bed?',options:['Water drains through sand and gravel and evaporates','It is boiled in a kettle','Fish drink the water'],answer:0,why:'The bed lets water drain to the underdrain while the sun evaporates the rest.'}],
 [{q:'Methane can explode in air at about…',options:['5–15 %','50–60 %','0.1 %'],answer:0,why:'Between the lower and upper explosive limits (about 5–15 %), a spark can ignite it.'},
  {q:'In a gas leak you should move…',options:['Upwind — check the windsock','Downwind','Into the digester'],answer:0,why:'Moving upwind keeps you out of the gas cloud.'}]
];
const QUIZ_KIT={operator:QUIZ[0],sampler:QUIZ[1],tech:QUIZ[2],handler:QUIZ[3],officer:QUIZ[4],
 guard:[{q:'Before entering a treatment plant you should…',options:['Sign in and wear the right PPE','Run straight to the digester','Light a cigarette'],answer:0,why:'Signing in and PPE keep everyone safe and accounted for.'}],
 harvester:[{q:'How does a harvester know a bunch is ripe?',options:['A few loose fruits have dropped to the ground','The fronds turn blue','The trunk gets taller'],answer:0,why:'Ripe bunches turn reddish-orange and shed a few loose fruits.'},{q:'Why must bunches reach the mill quickly?',options:['Bruised fruit spoils and the oil quality drops','They get heavier','The bunches grow back'],answer:0,why:'Free fatty acids rise in bruised fruit, lowering the oil quality.'}],
 angler:[{q:'Why do fish leave a river polluted with untreated POME?',options:['Bacteria use up the dissolved oxygen','The water gets too cold','There is too much light'],answer:0,why:'Decomposing organics consume the oxygen fish need to breathe.'}]};
const VOICE=[{pitch:.92,rate:1},{pitch:1.35,rate:1.04},{pitch:.78,rate:.97},{pitch:1.22,rate:1.02},{pitch:1,rate:.95},{pitch:.85,rate:.98},{pitch:.95,rate:1.03},{pitch:.7,rate:.9}];
const JOBTALK={rake:'raking fibre off the screen so it does not choke the pumps',dump:'tipping the screenings into the skip',valve:'trimming the feed valve so the reactor is not overloaded',clipboard:'writing readings in the log',dip:'taking a water sample',test:'testing pH, DO and COD at the bench',tablet:'checking readings on my tablet',kneel:'servicing the engine — plugs and the gas filter',shovel:'shovelling dried sludge cake',tip:'tipping cake on the compost heap',detector:'sniffing the gas line for leaks',walk:'walking to my next job'};

export function createPlay({scene,camera,canvas,viewport,world,visitor,flows,isPond=()=>false,isPolluted=()=>false},cfg){
 const sound=createSound();let learn=null;
 Object.assign(INFO,cfg.info||{});
 const mat=(c,r=.5,m=.1,x={})=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m,...x});
 const quests=Object.fromEntries(Object.entries(cfg.quests).map(([k,q])=>[k,{...q,done:false,on:false}]));
 const W=cfg.words;
 if(cfg.walk)visitor.configure(cfg.walk);if(cfg.walk?.block)visitor.blockWith(cfg.walk.block);

 /* ---------- HUD ---------- */
 const hud=document.createElement('div');hud.className='play-hud';hud.innerHTML=`
  <div class="play-toast" role="status" aria-live="polite"></div>
  <div class="play-cross" aria-hidden="true"></div>
  <div class="play-tip" hidden></div>
  <div class="play-prompt" hidden></div>
  <div class="play-status" hidden><span class="play-held">Hands free</span><span class="play-stamina" title="Stamina"><i></i></span></div>
  <details class="play-quests" hidden><summary>Jobs <b>0</b></summary><ol></ol></details>
  <aside class="play-card" hidden role="dialog" aria-label="Information"><button class="close" aria-label="Close">×</button><button class="speak" aria-label="Read aloud">🔊</button><h4></h4><p></p></aside>
  <section class="play-talk" hidden role="dialog" aria-label="Conversation"><header><i></i><b></b><button class="close" aria-label="End conversation">×</button></header><p class="line"></p><div class="choices"></div></section>
  <div class="play-actions" hidden><button data-k="KeyE">Interact</button><button data-k="KeyF">Use</button><button data-k="KeyQ">Drop</button></div>`;
 viewport.append(hud);
 const $=s=>hud.querySelector(s),toast=$('.play-toast'),prompt=$('.play-prompt'),status=$('.play-status'),staminaBar=$('.play-stamina i'),heldEl=$('.play-held'),card=$('.play-card'),talkEl=$('.play-talk'),questEl=$('.play-quests'),tip=$('.play-tip'),cross=$('.play-cross'),actions=$('.play-actions');
 let toastTimer=0;function say(msg,ms=3200){toast.textContent=msg;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),ms)}
 function showCard(key,custom,found){const d=custom||INFO[key];if(!d)return false;if(found||key)learn?.discover(found||key,d[0],d[1]);card.querySelector('h4').textContent=d[0];card.querySelector('p').textContent=d[1];card.hidden=false;sound.fx.ui();return true}
 card.querySelector('.close').onclick=()=>{card.hidden=true;canvas.focus({preventScroll:true})};
 card.querySelector('.speak').onclick=()=>{if(!sound.enabled)setSound(true);sound.say(card.querySelector('h4').textContent+'. '+card.querySelector('p').textContent,{pitch:1,rate:1})};
 function renderQuests(){const list=Object.values(quests);const ol=questEl.querySelector('ol');ol.replaceChildren(...list.filter(q=>q.on||q.done).map(q=>{const li=document.createElement('li');li.className=q.done?'done':'';li.innerHTML=`<b></b><small></small>`;li.querySelector('b').textContent=q.title;li.querySelector('small').textContent=q.done?'Done':q.hint;return li}));
  questEl.querySelector('summary b').textContent=list.filter(q=>q.done).length+'/'+list.length;}
 function complete(id){const q=quests[id];if(!q||q.done)return;q.done=true;q.on=true;renderQuests();sound.fx.success();say('Job done: '+q.title+' ✓ (+30 XP)',4200);learn?.award(30,'job');if(Object.values(quests).every(x=>x.done))learn?.badge('jobs')}
 for(const b of actions.querySelectorAll('button'))b.onclick=()=>key(b.dataset.k);

 /* ---------- controls bar: play and sound ---------- */
 const bar=document.createElement('div');bar.className='play-bar';bar.innerHTML='<button class="primary play-go">▶ Play as a worker</button> <button class="play-sound" aria-pressed="false">Sound off</button> <span class="play-keys">W A S D move · Shift run · Space jump · E interact / talk · F use item · Q drop · click a label to learn more</span>';
 visitor.controls.prepend(bar);const soundBtn=bar.querySelector('.play-sound');
 function setSound(on){sound.enable(on);soundBtn.setAttribute('aria-pressed',String(on));soundBtn.textContent=on?'Sound on':'Sound off'}
 soundBtn.onclick=()=>setSound(!sound.enabled);
 bar.querySelector('.play-go').onclick=()=>{setSound(true);visitor.setMode('third');say('You are '+who()+'. Walk up to a worker and press E to talk.',5200)};
 const who=()=>{const r=world.roles[visitor.roleIndex()];return r.person+', '+r.name.toLowerCase()};
 learn=createLearning({viewport,bar,sound,scene,camera,visitor,key:cfg.key,trail:cfg.trail,stages:cfg.stages,say});
 let held=null,sample=null,lastPrompt='',tick=0;
 visitor.on('mode',m=>{const walking=m!=='orbit';status.hidden=!walking;prompt.hidden=true;lastPrompt='';questEl.hidden=!walking;actions.hidden=!walking||!matchMedia('(pointer:coarse)').matches;cross.classList.toggle('show',m==='first');if(!walking)endTalk();else viewport.querySelector('.chem-legend')?.removeAttribute('open');renderQuests()});
 visitor.on('role-change',()=>{if(held)drop(true);endTalk()});

 /* ---------- world items ---------- */
 function itemModel(kind){const g=new T.Group();
  if(kind==='bottle'){const glass=new T.Mesh(new T.CylinderGeometry(.03,.03,.1,14),mat(0xdff3ee,.1,0,{transparent:true,opacity:.6}));glass.position.y=.05;const cap=new T.Mesh(new T.CylinderGeometry(.024,.024,.025,12),mat(0x2d6fb0));cap.position.y=.112;g.add(glass,cap)}
  if(kind==='rake'){const h=new T.Mesh(new T.CylinderGeometry(.014,.014,1.1,8),mat(0x9a7448,.85));h.rotation.z=Math.PI/2;h.position.y=.03;const head=new T.Mesh(new T.BoxGeometry(.04,.05,.36),mat(0xadbcbe,.4,.6));head.position.set(.55,.03,0);g.add(h,head);g.rotation.y=.6}
  if(kind==='detector'){const b=new T.Mesh(new T.BoxGeometry(.07,.12,.04),mat(0xe0b52a,.5));b.position.y=.06;const sc=new T.Mesh(new T.PlaneGeometry(.045,.03),mat(0x2a3a30,.3,0,{emissive:0x4cff7a,emissiveIntensity:.6}));sc.position.set(0,.085,.021);g.add(b,sc)}
  if(kind==='shovel'){const h=new T.Mesh(new T.CylinderGeometry(.016,.016,.85,8),mat(0x9a7448,.85));h.rotation.z=Math.PI/2;h.position.y=.03;const bl=new T.Mesh(new T.BoxGeometry(.25,.02,.2),mat(0xadbcbe,.4,.6));bl.position.set(.5,.02,0);g.add(h,bl);g.rotation.y=-.4}
  if(kind==='extinguisher'){const b=new T.Mesh(new T.CylinderGeometry(.06,.06,.36,14),mat(0xc8291f,.35,.3));b.position.y=.18;const t=new T.Mesh(new T.CylinderGeometry(.03,.03,.06,10),mat(0x222,.5));t.position.y=.39;g.add(b,t)}
  g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.userData.info=kind==='extinguisher'?'extinguisher-item':kind}});return g}
 const ring=new T.Mesh(new T.TorusGeometry(.2,.012,6,32),new T.MeshBasicMaterial({color:0xd9f58a,transparent:true,opacity:.75,depthWrite:false}));ring.rotation.x=Math.PI/2;ring.visible=false;scene.add(ring);
 for(const [x,y,z] of cfg.crates||[]){const crate=new T.Mesh(new T.BoxGeometry(.42,.4,.36),mat(0x8c6a3b,.85));crate.position.set(x,y+.2,z);crate.castShadow=crate.receiveShadow=true;crate.userData.info='control';scene.add(crate)}
 const items=Object.entries(cfg.items).map(([kind,d])=>{const m=itemModel(kind);m.position.set(...d.at);scene.add(m);return {kind,name:d.name,mesh:m,held:false,groundY:d.at[1]}});
 function pick(it){if(held)drop();it.held=true;it.mesh.visible=false;held=it;world.equip(visitor.player,it.kind);visitor.setHeld(it.kind);sound.fx.pickup();heldEl.textContent='Holding: '+it.name;say('Picked up the '+it.name.toLowerCase()+'. '+(INFO[it.kind==='extinguisher'?'extinguisher-item':it.kind]?.[1]||''),4800)}
 function drop(silent){if(!held)return;const p=visitor.position,h=visitor.heading,dx=p.x-Math.sin(h)*.45,dz=p.z-Math.cos(h)*.45,gy=cfg.walk?.ground?cfg.walk.ground(dx,dz)-.02:0;held.mesh.position.set(dx,gy+(held.kind==='extinguisher'?0:.01),dz);held.mesh.visible=true;held.held=false;
  const prop=visitor.player.props[held.kind];if(prop)prop.visible=false;visitor.setHeld(null);if(!silent){sound.fx.drop();say('Put down the '+held.name.toLowerCase()+'.')}held=null;sample=null;heldEl.textContent='Hands free'}

 /* ---------- places ---------- */
 const zones=cfg.zones;const inZone=id=>!!zones[id]?.near(visitor.position);
 function faceZone(id){const f=zones[id].face(visitor.position);visitor.faceTowards(f.x,f.z)}

 /* ---------- conversations ---------- */
 const job=i=>world.roles[i].state;
 const ctx={world,quests,renderQuests,isPond,isPolluted,W,job,JOBTALK};
 const TREES=cfg.trees(ctx);
 const BLOCKED=['Excuse me!','Coming through, please.','Mind the way!','Sorry, could I pass?'];
 let talking=null;
 function npcSay(i,text,done){const a=world.roles[i].actor;sound.say(text,{...VOICE[i%VOICE.length],voice:i,onstart:()=>a.talk(true),onend:()=>{a.talk(false);done?.()}})}
 function openTalk(i){if(talking!==null)endTalk();talking=i;world.hold(i,'talk');const a=world.roles[i].actor;visitor.faceTowards(a.g.position.x,a.g.position.z);
  talkEl.hidden=false;talkEl.querySelector('header b').textContent=world.roles[i].person+' · '+world.roles[i].name;talkEl.dataset.crew=i;node(i,'start');if(document.pointerLockElement===canvas)document.exitPointerLock()}
 function node(i,id){const tree=TREES[i];if(id==='quizme'){const bank=QUIZ_KIT[world.roles[i].spec.kit]||QUIZ[0],item=bank[Math.floor(Math.random()*bank.length)],who=world.roles[i].person;endTalk();learn.quiz(item,{by:who+' asks you',reward:15});return}
  if(id==='end'){npcSay(i,['Take care!','See you around.','Stay safe out there.'][Math.floor(Math.random()*3)]);endTalk();return}
  const n=tree[id];const text=typeof n==='function'?n():n;const line=talkEl.querySelector('.line');line.textContent='';let k=0;const typer=setInterval(()=>{line.textContent=text.slice(0,k+=2);if(k>=text.length)clearInterval(typer)},18);
  npcSay(i,text);const choices=talkEl.querySelector('.choices');choices.replaceChildren(...[...tree.options().slice(0,-1),['Quiz me!','quizme'],tree.options().at(-1)].map(([label,next],j)=>{const b=document.createElement('button');b.innerHTML=`<kbd>${j+1}</kbd> `;b.append(label);b.onclick=()=>{sound.fx.click();node(i,next)};return b}));}
 function endTalk(){if(talking===null)return;const i=talking;talking=null;setTimeout(()=>{world.hold(i,null);world.roles[i].actor.talk(false)},600);talkEl.hidden=true;canvas.focus({preventScroll:true})}
 talkEl.querySelector('.close').onclick=()=>{sound.hush();endTalk()};

 /* ---------- interaction targets ---------- */
 let npcDist=0,itemDist=0;
 function nearestNPC(){let best=null,bd=1.35;world.roles.forEach((r,i)=>{if(r.actor===visitor.player)return;const d=Math.hypot(r.actor.g.position.x-visitor.position.x,r.actor.g.position.z-visitor.position.z);if(d<bd){bd=d;best=i}});npcDist=bd;return best}
 function nearestItem(){let best=null,bd=.8;for(const it of items){if(it.held)continue;const d=Math.hypot(it.mesh.position.x-visitor.position.x,it.mesh.position.z-visitor.position.z);if(d<bd){bd=d;best=it}}itemDist=bd;return best}
 const SPOT_ACTIONS={testSample,readLog,turnValve,horn:()=>{sound.fx.horn();say('The driver waves back and tips another load of bunches.')},card:s=>{faceZone(s.zone);showCard(null,typeof s.card==='function'?s.card():s.card)}};
 // The closest thing wins: a worker, an item on the ground, or a place to act.
 function target(){const c=[];
  const npc=nearestNPC();if(npc!==null)c.push({d:npcDist+.15,label:`E · Talk to ${world.roles[npc].person}`,run:()=>openTalk(npc)});
  const it=nearestItem();if(it)c.push({d:itemDist,label:`E · Pick up ${it.name.toLowerCase()}`,run:()=>pick(it)});
  for(const s of cfg.spots){if(!inZone(s.zone))continue;if(s.needs==='sample'&&!(held?.kind==='bottle'&&sample))continue;c.push({d:s.d??.5,label:'E · '+s.label,run:()=>SPOT_ACTIONS[s.run](s)})}
  return c.sort((a,b)=>a.d-b.d)[0]||null;
 }
 function useLabel(){if(!held)return null;
  if(held.kind==='bottle'){if(sample)return inZone(cfg.benchZone)?null:'F · Pour away the sample';for(const z of Object.keys(cfg.samples))if(z!=='bench'&&inZone(z))return 'F · Fill the bottle here';return null}
  if(held.kind==='rake')return inZone(cfg.rakeZone)?'F · Rake the screen':null;
  if(held.kind==='shovel')return inZone(cfg.shovelZone)?'F · Turn the drying cake':null;
  if(held.kind==='detector')return 'F · Take a gas reading';
  if(held.kind==='extinguisher')return 'F · Spray';
  return null}

 /* ---------- actions ---------- */
 let spray=0,dig=0,valveTurning=0;
 function readLog(){faceZone(cfg.logZone);showCard(null,cfg.log({isPond,isPolluted,t:performance.now()/1000}));complete('power')}
 function turnValve(){faceZone('valve');if(!visitor.act('valve',3,()=>say('Feed trimmed: the reactor gets a steadier, gentler load.')))return;valveTurning=3;sound.fx.squeak();setTimeout(()=>sound.fx.squeak(),1200)}
 function testSample(){faceZone(cfg.benchZone);world.equip(visitor.player,'probe');if(!visitor.act('test',4.5,()=>{const src=sample;showCard(null,cfg.samples[src]({isPolluted,isPond}));sound.fx.beep(0);if(src===cfg.sampleQuest)complete('sample');sample=null;heldEl.textContent='Holding: Sample bottle (empty)'}))return;sound.fx.click()}
 function use(){if(!held||visitor.busy())return;const k=held.kind;
  if(k==='bottle'){if(sample){sample=null;heldEl.textContent='Holding: Sample bottle (empty)';sound.fx.splash();say('Sample poured away.');return}
   const z=Object.keys(cfg.samples).find(inZone);if(!z){say(cfg.sampleHint);return}
   faceZone(z);world.equip(visitor.player,'dipper');visitor.act('dip',4,()=>{sample=z;heldEl.textContent='Holding: Sample bottle ('+cfg.sampleNames[z]+')';say('Bottle filled. Take it to the field bench and press E to test it.')});setTimeout(()=>sound.fx.splash(),1300);return}
  if(k==='rake'){if(!inZone(cfg.rakeZone)){say('Stand at the screen to rake it.');return}faceZone(cfg.rakeZone);visitor.act('rake',5.2,()=>{const n=flows.clearScreen?.()||0;say(n?`Screen cleared: ${n} pieces of fibre lifted out.`:'The screen is already clean.');complete('screen')});[0,1300,2600,3900].forEach(t=>setTimeout(()=>sound.fx.scrape(),t+700));return}
  if(k==='shovel'){if(!inZone(cfg.shovelZone)){say('Stand at the edge of the drying area to turn the cake.');return}faceZone(cfg.shovelZone);visitor.act('shovel',6.4,()=>{say('Cake turned: the wet underside now faces the sun.');complete('cake')});dig=6.4;[0,3200].forEach(t=>setTimeout(()=>sound.fx.shovel(),t+500));return}
  if(k==='detector'){visitor.act('detector',3.5,gasReading);[0,500,1000,1500,2000,2500].forEach(t=>setTimeout(()=>sound.fx.beep(.2),t));return}
  if(k==='extinguisher'){visitor.act('spray',2.5,()=>say('Remember: pull, aim, squeeze, sweep.'));spray=2.5;sound.fx.spray();return}}
 function gasReading(){const p=visitor.position,pond=isPond();let lel=0,h2s=0;
  for(const s of cfg.gasSources){const d=Math.max(0,Math.hypot(p.x-s.x,p.z-s.z)-(s.r||0));lel+=(pond&&s.pond?s.pond:s.lel||0)*Math.exp(-d/(s.fall||1));h2s+=(pond&&s.pondH2s?s.pondH2s:s.h2s||0)*Math.exp(-d/(s.fall||1))}
  lel=Math.round(lel);h2s=Math.round(h2s);const warn=lel>=10||h2s>=10;if(warn)sound.fx.alarm();
  showCard(null,['Gas detector reading',`CH₄ ${lel} % LEL · H₂S ${h2s} ppm · O₂ 20.9 %\n${warn?'ALARM: move upwind (check the windsock) and report it.':lel||h2s?'Low readings — normal near the reactor, but keep checking.':'Clear air here.'}`]);
  if(cfg.gasQuest&&cfg.gasQuest(p))complete('gas')}

 function key(code){
  if(learn?.handleKey(code))return;
  if(code.startsWith('Digit')&&talking!==null){const b=talkEl.querySelectorAll('.choices button')[Number(code.slice(5))-1];b?.click();return}
  if(code==='KeyE'){if(talking!==null){endTalk();return}const t=target();if(t)t.run();else if(held&&useLabel())use();return}
  if(code==='KeyF'){use();return}
  if(code==='KeyQ'){drop();return}
 }
 visitor.on('key',key);
 visitor.on('step',({run,x,z})=>sound.fx.step(cfg.surface(x,z),run));
 visitor.on('jump',()=>sound.fx.jump());visitor.on('land',v=>sound.fx.land(v/4));

 /* ---------- clickable labels, signs and objects ---------- */
 const hidden=new T.MeshBasicMaterial({visible:false});
 for(const [k,p,s] of cfg.infoBoxes){const m=new T.Mesh(new T.BoxGeometry(...s),hidden);m.position.set(...p);m.userData.info=k;scene.add(m)}
 let infoTargets=[];scene.traverse(o=>{if(o.userData.info&&(o.isMesh||o.isSprite))infoTargets.push(o)});world.roles.forEach((r,i)=>r.actor.g.traverse(o=>{if(o.isMesh)o.userData.npc=i}));
 const ray=new T.Raycaster(),v2=new T.Vector2();
 function hitAt(u,v,withPalms=true){v2.set(u*2-1,1-v*2);ray.setFromCamera(v2,camera);ray.far=45;
  const list=withPalms?infoTargets:infoTargets.filter(o=>o.userData.info!=='palm');
  const npcMeshes=[];world.roles.forEach(r=>{if(r.actor!==visitor.player)r.actor.g.traverse(o=>{if(o.isMesh&&o.visible)npcMeshes.push(o)})});
  const hits=ray.intersectObjects([...list,...npcMeshes],false).filter(h=>h.object.visible!==false&&(h.object.parent?.visible!==false));return hits[0]?.object}
 function infoFor(o){if(o.userData.npc!==undefined){const i=o.userData.npc,r=world.roles[i];return [r.person+' · '+r.name,`${ROLE_INFO[r.spec.kit]||cfg.roleInfo[i]||''} Right now: ${r.state.label.toLowerCase()}. Walk up and press E to talk.`]}return INFO[o.userData.info]}
 function handleClick(u,v){const o=hitAt(u,v);if(!o)return false;const d=infoFor(o);if(!d)return false;showCard(null,d,o.userData.npc!==undefined?'crew-'+o.userData.npc:o.userData.info);return true}
 let hoverT=0;
 canvas.addEventListener('pointermove',e=>{if(e.buttons||document.pointerLockElement===canvas)return;const now=performance.now();if(now-hoverT<120)return;hoverT=now;const r=canvas.getBoundingClientRect();
  const o=hitAt((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height,false),d=o&&infoFor(o);if(d){tip.textContent=d[0];tip.hidden=false;tip.style.left=(e.clientX-r.left+14)+'px';tip.style.top=(e.clientY-r.top+12)+'px';canvas.style.cursor='help'}else{tip.hidden=true;canvas.style.cursor=''}});
 canvas.addEventListener('pointerleave',()=>{tip.hidden=true});
 // While the mouse is locked, a click inspects whatever sits under the crosshair.
 canvas.addEventListener('mousedown',e=>{if(document.pointerLockElement===canvas&&e.button===0)handleClick(.5,.5)});

 /* ---------- ambience ---------- */
 const amb=cfg.ambient.map(([kind,x,z,o,tag])=>Object.assign(sound.ambient(kind,typeof x==='object'?x:{x,z},o),{tag}));

 /* ---------- per-frame ---------- */
 const fwd=new T.Vector3();
 flows.hook?.((C,t)=>{if(spray>0){const p=visitor.position,h=visitor.heading;for(let k=0;k<26;k++){const f=((t*3+k/26)%1),r=.25+f*1.6;C.put('steam',p.x-Math.sin(h)*r+(Math.sin(k*7.3)*.25*f),p.y+.64-f*.35+Math.sin(k)*.1*f,p.z-Math.cos(h)*r+(Math.cos(k*5.1)*.25*f),.04+.18*f,k)}}
  if(dig>0&&((dig*1.25)%1)<.3){const p=visitor.position,h=visitor.heading;for(let k=0;k<5;k++)C.put('floc',p.x-Math.sin(h)*(.9+k*.05),p.y+.14+.2*Math.sin(k),p.z-Math.cos(h)*(.9+k*.05),.035,k)}});
 function update(dt){
  learn?.update(dt);
  const walking=visitor.isWalking();for(const a of amb)if(a.tag==='gas')a.on=!isPond();
  camera.getWorldDirection(fwd);sound.listen(camera.position.x,camera.position.z,-Math.atan2(fwd.x,-fwd.z),dt);
  spray=Math.max(0,spray-dt);dig=Math.max(0,dig-dt);if(valveTurning>0){valveTurning-=dt;world.turnValve(dt)}
  for(const e of world.takeEvents()){if(e.type==='blocked'){if(walking)npcSay(e.i,BLOCKED[Math.floor(Math.random()*BLOCKED.length)])}else{const n={moo:'moo',chop:'chop',thud:'thud',splash:'plop',catch:'reel'}[e.type];if(n)sound.at(n,e.x,e.z,e.type==='moo'?18:12)}}
  if(talking!==null){const a=world.roles[talking].actor;if(Math.hypot(a.g.position.x-visitor.position.x,a.g.position.z-visitor.position.z)>2.2)endTalk()}
  if(!walking){ring.visible=false;return}
  staminaBar.style.width=Math.round(visitor.stamina*100)+'%';
  if((tick+=dt)<.1)return;tick=0;
  const t=talking===null?target():null,u=talking===null?useLabel():null,text=[t?.label,u].filter(Boolean).join('   ·   ');
  if(text!==lastPrompt){lastPrompt=text;prompt.textContent=text;prompt.hidden=!text}
  const it=nearestItem();ring.visible=!!it;if(it){ring.position.set(it.mesh.position.x,it.mesh.position.y+.02,it.mesh.position.z);ring.scale.setScalar(1+.1*Math.sin(performance.now()/200))}
 }
 renderQuests();
 return {update,handleClick,showInfo:key=>showCard(key),sound};
}

/* ======================= scene configs ======================= */

function crewTrees(ctx,words){
 const {world,quests,renderQuests,isPond,isPolluted,job,JOBTALK}=ctx,{reactor,basin,waterQ,waterA,cakeA,shovelSpot,binder}=words;
 const trees=[
  {start:()=>`Morning! I'm ${world.roles[0].person}, shift operator. Careful — the POME comes in at about 80 degrees.`,
   options:()=>[['What are you doing right now?','now'],['Why rake the screen?','why'],[`How do you know the ${reactor} is healthy?`,'health'],quests.screen.done?['Screen looks clean now.','thanks']:['Can I help?','help'],['See you later.','end']],
   now:()=>`I'm ${JOBTALK[job(0).job]||'busy'}. Every job here keeps the next unit running smoothly.`,
   why:`Fibre and shell from the press clog pumps and settle in the ${reactor}. Pull them out early and they become boiler fuel instead of trouble.`,
   health:'Steady gas flow, pH around seven, and the volatile fatty acids not climbing. If acids build up, the methanogens get stressed and the gas drops.',
   help:()=>{quests.screen.on=true;renderQuests();return `Sure! Grab the rake ${binder.rake}, stand at the screen and press F. Pull off all the fibre you can.`},
   thanks:'Nice work. A clean screen means a happy pump — and a happy operator.'},
  {start:()=>`Hi! I'm ${world.roles[1].person}. I sample and test the water from every stage.`,
   options:()=>[['What are you doing now?','now'],['What do pH, DO and COD mean?','terms'],[waterQ,'water'],quests.sample.done?['I tested a sample!','thanks']:['Can I help?','help'],['Bye!','end']],
   now:()=>`Right now I'm ${JOBTALK[job(1).job]||'busy'}.`,
   terms:'pH tells us if water is acidic or alkaline. DO is dissolved oxygen — fish need it. COD is how much oxygen the pollution would use up. Lower COD means cleaner water.',
   water:()=>waterA(isPolluted()),
   help:()=>{quests.sample.on=true;renderQuests();return `Please! There is a sample bottle on the field bench. Fill it at the ${basin} edge with F, then bring it back and press E at the bench to test it.`},
   thanks:'Great sampling! Always label the bottle and test quickly so the result is valid.'},
  {start:()=>`Hello, I'm ${world.roles[2].person}, the instrument technician. I keep the engine and the meters honest.`,
   options:()=>[['What are you doing now?','now'],['How much power does the biogas make?','power'],['Why remove H₂S?','h2s'],quests.power.done?['I checked the log.','thanks']:['Can I help?','help'],['Thanks, bye.','end']],
   now:()=>`I'm ${JOBTALK[job(2).job]||'busy'}.`,
   power:()=>isPond()?'Right now nothing — with open ponds the methane goes straight to the air. Cover the digester and each cubic metre of biogas gives us about two kilowatt-hours.':'Each cubic metre of biogas gives us about two kilowatt-hours. A medium mill can run much of its equipment on it instead of diesel.',
   h2s:'Hydrogen sulphide turns into acid when it burns. It eats engine parts and smells like rotten eggs, so we scrub it out before the engine.',
   help:()=>{quests.power.on=true;renderQuests();return 'Could you check the generator output? Walk to the control room door and press E to read the log.'},
   thanks:'Perfect. If the kilowatts drop while the gas flow is steady, I know the engine needs attention.'},
  {start:()=>`Hai! I'm ${world.roles[3].person}. I look after the sludge — the part nobody wants, but it makes good compost!`,
   options:()=>[['What are you doing now?','now'],['Why dry the sludge?','dry'],['What happens to the cake?','cake'],quests.cake.done?['I turned the cake.','thanks']:['Can I help?','help'],['See you!','end']],
   now:()=>`I'm ${JOBTALK[job(3).job]||'busy'}.`,
   dry:'Wet sludge is heavy and smelly. On the drying bed the water drains through sand and gravel or evaporates in the sun, so the cake is light and easy to handle.',
   cake:()=>cakeA?.()||'We mix it with empty fruit bunches and compost it. After the quality is checked it goes back to the plantation as a soil conditioner.',
   help:()=>{quests.cake.on=true;renderQuests();return `There is a spare shovel ${shovelSpot}. Stand at the edge of the drying area and press F to turn the cake.`},
   thanks:'Thank you! Turning the cake helps it dry evenly.'}
 ];
 ['operator','sampler','tech','handler'].forEach((k,i)=>trees[i].kit=k);
 const oi=world.roles.findIndex(r=>r.spec.kit==='officer');
 if(oi>=0)trees.push({kit:'officer',start:()=>`I'm ${world.roles[oi].person}, gas safety officer. Safety first — are you wearing your PPE?`,
   options:()=>[['What are you doing now?','now'],['How dangerous is biogas?','danger'],['What is the flare for?','flare'],quests.gas?.done?['I took a gas reading.','thanks']:['Can I help?','help'],['Stay safe!','end']],
   now:()=>`I'm ${JOBTALK[job(oi).job]||'busy'}.`,
   danger:'Methane can explode at about five to fifteen percent in air, and hydrogen sulphide is toxic even at low levels. So we test before anyone works near the gas line.',
   flare:()=>isPond()?'With open ponds there is no gas to flare — and that is the problem: the methane escapes straight to the sky.':'When the engine cannot use all the biogas, the flare burns it. Burnt methane becomes CO₂, which warms the climate far less than methane.',
   help:()=>{quests.gas.on=true;renderQuests();return 'Take the gas detector from the crate by the control room. Stand near the digester and press F to take a reading.'},
   thanks:'Good habit! Test the air, read the numbers, then decide if it is safe to work.'});
 const gi=world.roles.findIndex(r=>r.spec.kit==='guard'),hi=world.roles.findIndex(r=>r.spec.kit==='harvester'),ai=world.roles.findIndex(r=>r.spec.kit==='angler');
 if(gi>=0)trees.push({kit:'guard',start:()=>`Selamat datang! I'm ${world.roles[gi].person}, security. Everyone signs in at the gate — even you!`,
  options:()=>[['What do you do here?','job'],['Why log every lorry?','lorry'],['Where can I see the whole plant?','tower'],['Thanks!','end']],
  job:'I check that everyone wears PPE, log the lorries in and out, and patrol the fence so nobody wanders near the gas lines.',
  lorry:'Each lorry brings fresh fruit bunches. More bunches processed today means more POME tomorrow, so the plant uses our log to plan its load.',
  tower:'Walk east along the road to the lookout tower and climb the stairs. You can see every stage from the top.'});
 if(hi>=0)trees.push({kit:'harvester',start:()=>`Hello! I'm ${world.roles[hi].person}. I cut the ripe bunches with this egrek — a long pole with a sickle on the end.`,
  options:()=>[['What are you doing now?','now'],['How do you know a bunch is ripe?','ripe'],['How often do you harvest a palm?','round'],['Where do the bunches go?','next'],['See you!','end']],
  now:()=>`I'm ${JOBTALK[job(hi).job]||({harvest:'cutting a ripe bunch',gather:'picking up the bunch and the loose fruit',load:'stacking bunches for the lorry'})[job(hi).job]||'busy'}.`,
  ripe:'Look for a reddish-orange bunch and a few loose fruits on the ground. Black, unripe bunches give much less oil.',
  round:'We come back to every palm about every 10 to 15 days, so each ripe bunch is cut in time.',
  next:'They go to the collection point, then by lorry to the mill. They should be processed within about a day, or the oil quality drops.'});
 if(ai>=0)trees.push({kit:'angler',start:()=>isPolluted()?`Assalamualaikum. I'm ${world.roles[ai].person}. No bites today — look at the colour of that water.`:`Assalamualaikum! I'm ${world.roles[ai].person}. The fish are biting today!`,
  options:()=>[['Catching anything?','fish'],['Has the river changed?','change'],['What does the village use the river for?','use'],['Good luck!','end']],
  fish:()=>isPolluted()?'Nothing. When the water turns dark and smelly the fish swim away — they need oxygen to breathe.':'Yes — tilapia and catfish. Clean water means plenty of fish for the village.',
  change:'Years ago untreated effluent turned the river brown and the fish died. Since the treatment plant was built, they have come back.',
  use:'We fish, wash and water our gardens. That is why what the mill sends downstream matters to us.'});
 const byKit={};trees.forEach(t=>byKit[t.kit]=t);
 return world.roles.map(r=>byKit[r.spec.kit]);
}
const P=(x,z)=>({x,z});
const sampleCards={
 basin:(name,{isPolluted})=>isPolluted()?[name+' sample','pH 7.2 · DO 0.6 mg/L · COD 260 mg/L · NH₄-N 18 mg/L\nLow oxygen: the blowers cannot keep up with the load. (Illustrative values.)']:[name+' sample','pH 7.6 · DO 2.2 mg/L · COD 110 mg/L · NH₄-N 6 mg/L\nWell aerated: the bacteria have plenty of oxygen. (Illustrative values.)'],
 intake:()=>['Raw POME sample','pH 4.4 · COD about 50,000 mg/L · temperature 78 °C · oil and grease high\nAcidic, hot and very strong — why it needs treatment. (Illustrative values.)']
};
function controlLog({isPond,isPolluted,t}){const pond=isPond(),dirty=isPolluted(),gas=pond?0:Math.round(205+15*Math.sin(t*.3));
 return ['Control room log',`Biogas to engine: ${gas} m³/h${pond?' (open ponds — methane vents to air)':' · CH₄ 62 %'}\nGenerator output: ${Math.round(gas*1.85)} kW\nReactor temperature: ${pond?'—':'36.4 °C'} · pH ${pond?'—':'7.1'}\nAeration DO: ${dirty?'0.6':'2.1'} mg/L\nFinal discharge COD: ${dirty?'340':'115'} mg/L (illustrative)`]}

export function arcadePlay(env){
 const {world}=env;
 const outer=env.outer,palmsBack=Array.from({length:22},(_,i)=>[-18+(i%11)*3.5,-11-Math.floor(i/11)*5-Math.sin(i*3)*1.3,.35]),row=Array.from({length:13},(_,i)=>[-7+i*1.16,-4.9,.35]);
 return createPlay(env,{
  key:'arcade',
  walk:{bounds:{x:26,z0:-13,z1:15},obstacles:[...[[-7.6,-5.8,-3.4,-1.8],[.75,1.05,-3.75,-3.45],[4.9,5.1,-3.4,-3.2],[-5.98,-5.9,-2.25,-.05],[-2.53,.7,-3.25,.02],[.53,4.73,-1.63,.96],[1.59,4.57,-4.21,-2.04],[-4.54,-.67,1.67,3.44],[4.95,5.45,-.42,1.02],[-7.62,-6.78,.05,2.1],[-7.65,-6.75,-1.95,-.7],[6.35,7.55,-1.05,-.05],[6.3,7.7,1.9,2.9],[4.62,5.08,-2.45,-2.15]],...(outer?.obstacles||[]),[11.05,11.95,-5.05,-4.35]],
   circles:[...(outer?.spots||[]).map(([x,z])=>[x,z,.32]),...palmsBack,...row,[10.2,-3,.32],[12.8,-1.5,.32],[10.2,0,.32],[12.8,1.5,.32],[10.2,2.9,.32],[12.8,-4.2,.32],[10.6,-6.2,.12],[-12.5,9.6,.12]],
   ground:(x,z)=>x>-3.42&&x<-2.58&&z>3.5&&z<6.0?.39:.11},
  trail:[
   {at:[-4,.78],title:'Intake',fact:'Hot raw POME from the mill is screened here: fibre and shell come out, oil floats.',quiz:{q:'Why is raw POME screened before treatment?',options:['Fibre and shell would clog pumps and the digester','To make it hotter','To add oxygen'],answer:0,why:'Solids are removed early so the pumps and digester keep working.'}},
   {at:[-.9,.42],title:'Covered digester',fact:'Microbes without oxygen turn organics into biogas — mostly methane and CO₂.',quiz:{q:'Which gas do methanogens mainly produce?',options:['Methane (CH₄)','Oxygen (O₂)','Nitrogen (N₂)'],answer:0,why:'Methanogens turn acetate into methane, the fuel in biogas.'}},
   {at:[2.4,-1.83],title:'Gas engine house',fact:'Biogas burns in the engine to make electricity for the mill.',quiz:{q:'When methane burns in the engine it becomes…',options:['Carbon dioxide and water','Hydrogen sulphide','Ammonia'],answer:0,why:'CH₄ + 2O₂ → CO₂ + 2H₂O, releasing energy.'}},
   {at:[2.6,1.2],title:'Polishing basin',fact:'Blowers bubble air through the water so bacteria can clean up what is left.',quiz:{q:'Why do the blowers push air into the basin?',options:['Bacteria need dissolved oxygen to break down the leftover organics','To cool the water down','To make more biogas'],answer:0,why:'Aerobic bacteria use oxygen to oxidise organics to CO₂ and water.'}},
   {at:[5.2,3.4],title:'River outfall',fact:'Treated water joins the river here — the oil boom catches any sheen.',quiz:{q:'What happens to fish if poorly treated POME reaches the river?',options:['Oxygen drops and the fish die or leave','The fish grow faster','Nothing changes'],answer:0,why:'Bacteria feeding on the pollution use up the dissolved oxygen fish need.'}},
   {at:[-2.6,1.45],title:'Sludge yard',fact:'Waste sludge dries on sand beds and is composted with empty fruit bunches.',quiz:{q:'How does the sludge cake dry?',options:['Water drains through sand and gravel and evaporates','It is boiled','Bacteria drink the water'],answer:0,why:'The underdrain removes water and the sun evaporates the rest.'}},
   {at:[11.5,-.8],title:'Harvest block',fact:'Ripe bunches are cut with a long-pole sickle (egrek) and carried to the collection point.',quiz:{q:'How does a harvester know a bunch is ripe?',options:['A few loose fruits have dropped to the ground','The fronds turn blue','The trunk gets taller'],answer:0,why:'Ripe bunches turn reddish-orange and shed a few loose fruits.'}},
   {at:[.6,8.4],title:'Kampung downstream',fact:'The village fishes and washes in the river below the outfall.',quiz:{q:'Why does the village care about the mill’s effluent?',options:['They fish and use the river downstream','It makes their houses taller','It brings more lorries'],answer:0,why:'Whatever the plant discharges flows straight past the village.'}}],
  stages:[{name:'Raw POME (intake)',at:[-4,-.7],cod:()=>50000},{name:'After the digester',at:[-.9,-1.65],cod:()=>env.isPond()?12000:7500},{name:'After polishing',at:[3,-.35],cod:()=>env.isPolluted()?340:120},{name:'River below outfall',at:[5.2,4.2],cod:()=>env.isPolluted()?140:18}],
  items:{bottle:{name:'Sample bottle',at:[5.3,.615,.62]},rake:{name:'Screen rake',at:[-2.95,.02,.58]},detector:{name:'Gas detector',at:[6.55,.43,1.72]},shovel:{name:'Shovel',at:[-.7,.02,3.5]},extinguisher:{name:'Fire extinguisher',at:[-.4,0,1.85]}},
  crates:[[6.55,0,1.72]],
  quests:{screen:{giver:0,title:'Clear the intake screen',hint:'Take the rake by the intake, stand at the screen and press F.'},
   sample:{giver:1,title:'Test a polishing-basin sample',hint:'Bottle on the field bench → F at the polishing basin edge → E at the bench.'},
   power:{giver:2,title:'Check the generator output',hint:'Walk to the control room door and press E to read the log.'},
   cake:{giver:3,title:'Turn the drying cake',hint:'Shovel on the river bank → stand by the sludge yard and press F.'},
   gas:{giver:4,title:'Gas-test beside the digester',hint:'Detector on the crate at the control room → press F near the digester.'}},
  zones:{
   polish:{near:p=>p.x>.6&&p.x<4.6&&p.z>.85&&p.z<1.45||p.x>4.7&&p.x<5.0&&p.z>-1.6&&p.z<.9,face:p=>P(Math.max(.9,Math.min(4.3,p.x)),.2)},
   river:{near:p=>p.z>3.2,face:p=>P(p.x,4.6)},
   intake:{near:p=>p.x>-5.1&&p.x<-2.9&&p.z>.4&&p.z<1.2,face:p=>P(p.x,-.6)},
   sludge:{near:p=>(p.x>-4.4&&p.x<-.8&&p.z>1.35&&p.z<1.75)||(p.x>-.75&&p.x<-.3&&p.z>1.8&&p.z<3.4),face:p=>p.z<1.8?P(p.x,2.5):P(-1.6,p.z)},
   bench:{near:p=>Math.hypot(p.x-5.45,p.z-1.3)<.75,face:()=>P(5.45,.69)},
   control:{near:p=>Math.hypot(p.x-6.8,p.z-1.65)<.8,face:()=>P(6.8,2.4)},
   valve:{near:p=>Math.hypot(p.x-world.valvePosition.x,p.z-world.valvePosition.z-.55)<.7,face:()=>P(world.valvePosition.x,world.valvePosition.z)},
   lorry:{near:p=>Math.hypot(p.x+6.5,p.z-1.0)<.8,face:()=>P(-7.2,1.0)}},
  spots:[{zone:'bench',label:'Test the sample',run:'testSample',needs:'sample',d:.3},{zone:'control',label:'Read the control room log',run:'readLog'},{zone:'valve',label:'Turn the digester feed valve',run:'turnValve'},{zone:'lorry',label:'Wave to the lorry driver',run:'horn'}],
  samples:{polish:o=>sampleCards.basin('Polishing basin',o),river:({isPolluted})=>isPolluted()?['River sample','pH 6.8 · DO 2.1 mg/L · COD 140 mg/L\nToo little oxygen for most fish. (Illustrative values.)']:['River sample','pH 7.0 · DO 6.8 mg/L · COD 18 mg/L\nHealthy for river life. (Illustrative values.)'],intake:sampleCards.intake},
  sampleNames:{polish:'polishing basin',river:'river',intake:'raw POME'},sampleQuest:'polish',sampleHint:'Stand at a sample point first: the polishing basin edge, the river bank or the intake.',
  benchZone:'bench',rakeZone:'intake',shovelZone:'sludge',logZone:'control',log:controlLog,
  gasSources:[{x:-.9,z:-1.65,r:1.4,lel:3,pond:14,h2s:3,pondH2s:9,fall:.8},{x:3.1,z:-3.1,lel:2,fall:1.2},{x:.9,z:-3.6,lel:1.5,fall:1},{x:-4,z:-.7,h2s:4,fall:1.2}],
  gasQuest:p=>Math.hypot(p.x+.9,p.z+1.65)<2.7,
  infoBoxes:[['blowers',[6.95,.5,-.55],[1.25,1,1]],['control',[7,.45,2.4],[1.35,.9,.95]],['windsock',[-7.6,1.4,-3.9],[.3,2.7,.3]],['conveyor',[-7.2,.5,-1.4],[.8,1.1,1.2]],['skip',[-5.8,.25,.85],[.65,.5,.5]],['bench',[5.45,.45,.69],[.85,.9,.5]],['heap',[-5.85,.2,2.6],[.8,.4,.8]],['valve',[-.35,.8,.02],[.35,.35,.3]],['to mill grid',[5,1,-3.3],[.3,2,.6]],['extinguisher',[-3.15,.2,-.2],[.15,.45,.15]],['extinguisher',[1.95,.2,-1.95],[.15,.45,.15]],['extinguisher',[5.65,.2,-1.55],[.15,.45,.15]]],
  ambient:[...(outer?[['hum',outer.tractor.position,0,{freq:68,gain:.14,radius:9}]]:[]),['hum',3.1,-3.1,{freq:52,gain:.22,radius:7},'gas'],['hum',6.95,-.55,{freq:118,gain:.12,radius:5}],['roar',.9,-3.6,{gain:.2,radius:6},'gas'],['water',0,4.75,{gain:.18,radius:4,line:[-8,8]}],['bubbles',-.9,-1.65,{freq:420,gain:.06,radius:3.5}],['water',-4.85,-.1,{gain:.1,radius:3}],['hum',-7.2,-1.3,{freq:76,gain:.07,radius:4}]],
  surface:(x,z)=>(z>.8&&z<1.7)||(x>-6.15&&x<-5.25)?'gravel':'grass',
  roleInfo:['Runs the intake and the digester feed.','Samples and tests water from every stage and the river.','Keeps the gas engine, meters and instruments working.','Handles sludge drying, the wheelbarrow and the compost heap.','Checks for gas leaks and keeps the flare and permits safe.'],
  words:{reactor:'digester',basin:'polishing basin',waterQ:'Is the river safe?',waterA:dirty=>dirty?'Not today. The oxygen is low and the COD is high — the treatment upset is reaching the river. That is why the fish have gone.':'Today it looks good: plenty of dissolved oxygen and low COD. You can see the fish jumping.',shovelSpot:'on the river bank',binder:{rake:'by the intake'}},
  info:{'do probe':['Dissolved-oxygen probe','Hangs in the polishing basin from the walkway and shows live dissolved oxygen. About 2 mg/L keeps the bacteria working; below 1 mg/L the blowers need attention.'],
   'oil boom':['Floating oil boom','Orange floats with a hanging skirt ring the outfall, so any oil sheen is trapped and skimmed before it can spread down the river.'],
   'outfall':['River outfall','Treated water enters the river through a concrete headwall. The flap gate stops river water flowing back in a flood, and rip-rap stones stop the bank eroding.'],
   'control panel':['Local control panel','Green: feed pump running. Amber blinking: digester gas holder filling. Red: high-level or low-oxygen alarm.'],
   'handwheel':['Isolation valve','Turning the handwheel closes this pipe so a pump or unit can be serviced safely.'],
   'puddle':['Puddle','Rain and wash-down water. Surface drains lead it back to the treatment plant, not to the river.']},
  trees:ctx=>crewTrees(ctx,ctx.W)
 });
}

// Main simulator: the yard beyond the platform is walkable (it sits lower, with steps).
export function reactorPlay(env){
 const {world}=env;
 const onPlatform=(x,z)=>Math.abs(x)<6.2&&Math.abs(z)<3.25;
 const num=id=>Number(String(document.getElementById(id)?.value??document.getElementById(id)?.textContent??'').replace(/[^0-9.]/g,''))||0;
 const codIn=()=>num('cod')||50000,codOut=()=>num('residual')||Math.round(codIn()*.05);
 const sc=env.scenery,TW=sc?.tower;
 // Height of the ground (platform, yard, tower stairs and deck). y is the walker's current height.
 const groundAt=(x,z,y=.11)=>{if(onPlatform(x,z))return .11;if(TW){if(x>TW.x0&&x<TW.x1&&z>TW.z0&&z<TW.z1&&y>TW.top-.7)return TW.top+.02;
   if(x>TW.sx0&&x<TW.sx1&&z>TW.sz0&&z<TW.sz1){const h=TW.top-(TW.top+.29)*(z-TW.sz0)/(TW.sz1-TW.sz0)+.02;if(y>h-.75)return h}}return -.27};
 // Footprints of the integrated-recovery units, solid only while that pathway is shown.
 const INTEG_UNITS=[[-7.45,-6.65,1.7,2.2],[-8.5,-7.6,2.3,3.2],[-5.35,-4.65,-1.6,-.9],[-4.95,-3.65,-4.5,-3.3],[-2.7,-2.2,-4.15,-3.65],[2.8,4.95,-4.35,-3.6],[6.35,7.35,-.15,.45],[5.1,6.0,-3.9,-3.5],[6.55,8.85,-4.45,-3.05]];
 return createPlay(env,{
  key:'reactor',
  trail:[
   {at:[-4.6,2.3],title:'Inlet and bar screen',fact:'Raw POME pours in hot; the bar screen catches fibre and shell before the reactor.',quiz:{q:'Why is raw POME screened before treatment?',options:['Fibre and shell would clog pumps and the reactor','To make it hotter','To add oxygen'],answer:0,why:'Solids are removed early so the pumps and UASB keep working.'}},
   {at:[-1.4,1.95],title:'UASB reactor',fact:'Feed rises through a blanket of microbial granules that turn organics into biogas.',quiz:{q:'What keeps the granules inside a UASB reactor?',options:['Hoods at the top separate gas, liquid and sludge','A fine sieve at the bottom','Freezing them'],answer:0,why:'The three-phase separator lets gas out and drops the granules back into the blanket.'}},
   {at:[-2.4,-2.3],title:'Biogas engine',fact:'Biogas from the UASB dome is burnt to make electricity for the mill.',quiz:{q:'When methane burns in the engine it becomes…',options:['Carbon dioxide and water','Hydrogen sulphide','Ammonia'],answer:0,why:'CH₄ + 2O₂ → CO₂ + 2H₂O, releasing energy.'}},
   {at:[1.6,2.2],title:'Aeration basin',fact:'Air from the blowers lets floc bacteria finish the clean-up and turn ammonium into nitrate.',quiz:{q:'Why do the blowers push air into the basin?',options:['Bacteria need dissolved oxygen to break down the leftover organics','To cool the water down','To make more biogas'],answer:0,why:'Aerobic bacteria use oxygen to oxidise organics to CO₂ and water.'}},
   {at:[4.75,1.95],title:'Outlet chamber',fact:'Treated water is checked here before it is reused or discharged.',quiz:{q:'Which test shows how much oxygen the remaining pollution would use up?',options:['COD','Temperature','Colour'],answer:0,why:'Chemical oxygen demand measures the oxygen needed to oxidise what is left.'}},
   {at:[4.8,-1.05],title:'Sludge drying bed',fact:'Excess sludge dries on sand and gravel; the cake is composted.',quiz:{q:'How does the sludge cake dry?',options:['Water drains through sand and gravel and evaporates','It is boiled','Bacteria drink the water'],answer:0,why:'The underdrain removes water and the sun evaporates the rest.'}},
   {at:[-16,-2.0],y:-.26,title:'FFB harvesting',fact:'Outside the fence, harvesters cut ripe bunches with a long-pole sickle (egrek) and carry them to the collection point.',quiz:{q:'How does a harvester know a bunch is ripe?',options:['A few loose fruits have dropped to the ground','The fronds turn blue','The trunk gets taller'],answer:0,why:'Ripe bunches turn reddish-orange and shed a few loose fruits.'}},
   {at:[13.0,4.6],y:-.26,title:'Lookout tower',fact:'Climb the stairs and look back over every stage of the plant.',quiz:{q:'In which order does POME flow through this plant?',options:['Inlet → UASB → aeration → outlet','Outlet → aeration → UASB → inlet','Aeration → inlet → outlet → UASB'],answer:0,why:'Solids out first, then anaerobic digestion makes biogas, then aeration polishes the water.'}},
   {at:[8.45,.55],y:-.26,title:'Treated-water tank',fact:'Treated water is held here. Reusing it for washing and cooling needs membrane polishing (integrated design); otherwise it is discharged within the permit.',quiz:{q:'Why reuse treated water at the mill?',options:['It saves river water and cuts discharge','It makes more biogas','It is required to cool the flare'],answer:0,why:'Every cubic metre reused is one less taken from, or sent to, the river.'}}],
  stages:[{name:'Raw POME (inlet)',at:[-4.55,.9],cod:codIn},{name:'After UASB',at:[-1.4,0],cod:()=>Math.round(codIn()*.15)},{name:'After aeration',at:[1.8,.5],cod:()=>Math.round(codOut()*1.3)},{name:'Outlet',at:[4.75,.7],cod:codOut}],
  walk:{bounds:{x:32,z0:-26,z1:22},ground:groundAt,
   // Railings: once up on the tower you can only leave by the stairs.
   block:(x,z)=>{if(env.isIntegrated?.()&&INTEG_UNITS.some(([a,b,c,d])=>x>a&&x<b&&z>c&&z<d))return true;if(!TW||env.visitor.position.y<TW.top-.6)return false;const deck=x>TW.x0+.06&&x<TW.x1-.06&&z>TW.z0+.06&&z<TW.z1-.06,stairs=x>TW.sx0+.03&&x<TW.sx1-.03&&z>=TW.z1-.12&&z<TW.sz1;return !(deck||stairs)},
   circles:[...(sc?.palmSpots||[]).map(([x,z])=>[x,z,.34]),[-17.6,-4.5,.34],[-14.4,-3,.34],[-17.6,-.5,.34],[-14.4,1,.34],[-17.6,3.5,.34],[-14.4,5.2,.34],[-21,-9,.1],[19,9,.1],[22,-14,.1],...[-18,-12,-6,0,6,12,18].map(x=>[x,7.95,.1]),...(TW?[[TW.x0+.08,TW.z0+.08,.12],[TW.x1-.08,TW.z0+.08,.12],[TW.x0+.08,TW.z1-.08,.12],[TW.x1-.08,TW.z1-.08,.12]]:[])],
   obstacles:[[-5.83,-3.26,-.13,1.94],[-2.91,.1,-1.55,1.55],[.32,3.3,-.83,1.87],[-1.57,.76,-2.9,-1.47],[2,4.44,-2.68,-1.22],[3.8,5.68,-.23,1.65],[5.34,6.16,1.5,1.98],
    [-9.95,-7.15,-1.1,.28],[6.4,8.7,-2.55,-.95],[7.55,9.35,.85,2.65],[6.4,7.9,2.75,3.45],[-7.45,-6.95,.6,1.3],[-6.1,-5.4,2.55,3.0],[.75,1.5,-3.2,-2.45],
    [-10.6,6.3,4.37,4.53],[8.8,10.6,4.37,4.53],[-10.6,-10.4,-4.7,4.53],[10.4,10.6,-4.7,4.53],[-10.6,10.6,-4.7,-4.5],[9.55,10.35,4.5,5.2],[-8.3,-3.7,-8.2,-5.8],[1.4,4.3,-6.6,-5.8],[16.8,27.2,-27.2,-20.8],[-16.5,-15.5,4.25,4.95]]},
  items:{bottle:{name:'Sample bottle',at:[5.48,.61,1.62]},detector:{name:'Gas detector',at:[5.72,.61,1.58]},rake:{name:'Screen rake',at:[-3.3,.1,2.62]},shovel:{name:'Shovel',at:[4.95,.1,-.95]},extinguisher:{name:'Fire extinguisher',at:[-6.0,.09,2.0]}},
  quests:{screen:{giver:0,title:'Clear the inlet bar screen',hint:'Take the rake on the walkway, stand at the inlet and press F.'},
   sample:{giver:1,title:'Test an aeration-basin sample',hint:'Bottle on the field bench → F at the aeration basin edge → E at the bench.'},
   power:{giver:2,title:'Check the generator output',hint:'Walk off the platform to the control room door (left) and press E.'},
   cake:{giver:3,title:'Turn the drying cake',hint:'Shovel beside the outlet → stand at the drying bed and press F.'}},
  zones:{
   aeration:{near:p=>p.x>.45&&p.x<3.15&&p.z>1.86&&p.z<2.45,face:p=>P(p.x,1.0)},
   outlet:{near:p=>Math.hypot(p.x-4.75,p.z-.7)<1.4&&!(p.x>3.8&&p.x<5.68&&p.z>-.23&&p.z<1.65),face:()=>P(4.75,.7)},
   intake:{near:p=>p.x>-5.6&&p.x<-3.5&&p.z>1.92&&p.z<2.55,face:p=>P(p.x,1.07)},
   drying:{near:p=>(p.x>4.42&&p.x<5.1&&p.z>-2.65&&p.z<-1.25)||(p.x>2.1&&p.x<4.3&&p.z>-1.21&&p.z<-.85),face:()=>P(3.2,-1.95)},
   bench:{near:p=>Math.hypot(p.x-5.75,p.z-2.3)<.75,face:()=>P(5.75,1.74)},
   control:{near:p=>Math.hypot(p.x+7.7,p.z-.6)<.8,face:()=>P(-7.7,-.4)},
   valve:{near:p=>Math.hypot(p.x-world.valvePosition.x,p.z-world.valvePosition.z-.4)<.6,face:()=>P(world.valvePosition.x,world.valvePosition.z)},
   flowmeter:{near:p=>Math.hypot(p.x-3.43,p.z-2.3)<.5,face:()=>P(3.43,1.88)},
   blowers:{near:p=>Math.hypot(p.x-7.55,p.z+.75)<.9,face:()=>P(7.55,-1.75)},
   reuse:{near:p=>Math.hypot(p.x-8.45,p.z-1.75)<1.45,face:()=>P(8.45,1.75)}},
  spots:[{zone:'bench',label:'Test the sample',run:'testSample',needs:'sample',d:.3},{zone:'control',label:'Read the control room log',run:'readLog'},{zone:'valve',label:'Turn the UASB feed valve',run:'turnValve'},
   {zone:'flowmeter',label:'Read the flow meter',run:'card',card:()=>['Effluent flow meter',`${(12.5+.6*Math.sin(performance.now()/3000)).toFixed(1)} m³/h leaving the aeration basin (about 300 m³ a day).`]},
   {zone:'blowers',label:'Check the blowers',run:'card',card:['Aeration blowers','Duty blower running · discharge 0.45 bar · air flow about 620 Nm³/h. Standby blower ready. (Illustrative values.)']},
   {zone:'reuse',label:'Read the treated-water tank level',run:'card',card:()=>{const on=env.isIntegrated?.(),lvl=Math.round(72+8*Math.sin(performance.now()/20000));return on?['Reuse water tank',`Level ${lvl} % · membrane-polished water used for washing and cooling. Water only comes here after it passes its tests.`]:['Final effluent tank',`Level ${lvl} % · treated water held for monitoring, then discharged to the drain within the permit. No reuse without membrane polishing.`]}}],
  samples:{aeration:o=>sampleCards.basin('Aeration basin',o),outlet:()=>['Outlet sample','pH 7.4 · COD 95 mg/L · suspended solids 40 mg/L · NO₃-N 12 mg/L\nReady to check against the permit or reuse needs. (Illustrative values.)'],intake:sampleCards.intake},
  sampleNames:{aeration:'aeration basin',outlet:'outlet',intake:'raw POME'},sampleQuest:'aeration',sampleHint:'Stand at a sample point first: the aeration basin edge, the outlet or the inlet.',
  benchZone:'bench',rakeZone:'intake',shovelZone:'drying',logZone:'control',log:controlLog,
  gasSources:[{x:-1.4,z:0,r:1.25,lel:3,h2s:3,fall:.8},{x:-.4,z:-2.18,lel:2,fall:1.2},{x:-4.55,z:.9,h2s:4,fall:1.2}],
  infoBoxes:[['air blowers',[7.55,.35,-1.75],[2.3,1.3,1.6]],['control',[-8.55,.35,-.4],[2.7,1.4,1.3]],['reuse',[8.45,.75,1.75],[1.8,2.2,1.8]],['nutrients',[7.15,.05,3.1],[1.6,.7,.7]],['windsock',[-6,1.6,-3],[.3,3.2,.3]],['skip',[-5.75,.33,2.78],[.66,.45,.48]],['bench',[5.75,.4,1.74],[.85,.8,.5]],['heap',[1.12,.25,-2.82],[.8,.4,.8]],['valve',[-2.4,.86,.91],[.32,.32,.3]],['flowmeter',[3.43,.85,1.88],[.35,.9,.15]],['stile',[-3.08,.35,.91],[.45,.5,.9]],['motorbike',[-7.2,-.05,.95],[.45,.6,.9]],['to mill grid',[.62,.8,-3.02],[.2,1.6,.45]],['drain',[0,-.22,3.55],[12.4,.12,.34]],['extinguisher',[-2.85,.3,-2.95],[.16,.5,.16]],['extinguisher',[5.95,.3,2.9],[.16,.5,.16]],['safety shower',[6.0,1,-2.9],[.5,1.9,.2]]],
  ambient:[['hum',-.4,-2.18,{freq:52,gain:.2,radius:6}],['hum',7.55,-1.75,{freq:118,gain:.14,radius:6}],['bubbles',1.8,.5,{freq:520,gain:.07,radius:3.5}],['bubbles',-1.4,0,{freq:400,gain:.05,radius:3}],['water',-5.45,1.45,{gain:.1,radius:3}],['water',0,3.55,{gain:.06,radius:2,line:[-6,6]}],['hum',-7.13,-.6,{freq:160,gain:.05,radius:3}]],
  surface:(x,z)=>onPlatform(x,z)?'gravel':Math.abs(x)<8.3&&z>-5.4&&z<5.8?'gravel':'grass',
  roleInfo:['Runs the inlet screen and the UASB feed.','Samples and tests water from every stage.','Keeps the biogas engine, meters and instruments working.','Handles the drying bed, the wheelbarrow and the compost heap.'],
  words:{reactor:'UASB reactor',basin:'aeration basin',waterQ:'Where does the treated water go?',waterA:()=>env.isIntegrated?.()?'In the integrated design it passes the UF/RO membranes, then goes to the reuse tank for washing and cooling — only after the tests pass. If not, it goes back for more treatment.':'With UASB + aerobic only, it is held in the final effluent tank and discharged within the permit limits. The integrated design would polish it with membranes and reuse it instead.',
   cakeA:()=>env.isIntegrated?.()?'In the integrated design the screw press squeezes it first, then we co-compost it with shredded EFB in the windrows behind the blowers. Once the quality is checked it goes back to the palms as bio-fertiliser.':'Here we just dry it and send the cake off for composting or disposal. The integrated design would co-compost it with EFB into bio-fertiliser.',shovelSpot:'beside the outlet chamber',binder:{rake:'on the walkway by the inlet'}},
  trees:ctx=>crewTrees(ctx,ctx.W)
 });
}
