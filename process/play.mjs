import * as T from './three.module.min.js';
import {createSound} from './sound.mjs?v=shift8';

/*
 Interactive play layer for the Mill Arcade: walk as a worker, pick up and use tools,
 sample and test water, read gas levels, turn valves, talk with the crew (branching,
 voiced dialogue with small jobs to do), and click any label, sign or object to learn
 what it is. Readings are illustrative teaching values, not plant data.
*/

const INFO={
 'palm oil mill':['Palm oil mill','Fresh fruit bunches are sterilised with steam, stripped, digested and pressed to get crude palm oil. Steam condensate, clarifier sludge and hydrocyclone water make up POME — roughly 0.5 to 0.75 m³ for every tonne of bunches processed.'],
 'to mill grid':['Generator cable to the mill grid','Electricity from the biogas engine goes back to the mill and replaces diesel or grid power. Each cubic metre of biogas gives roughly 1.8–2 kWh of electricity.'],
 'flare':['Biogas flare','Burns gas the engine cannot use, so it is never vented. Burning turns methane (CH₄, a strong greenhouse gas) into carbon dioxide and water.'],
 'intake':['Intake and screening','Hot raw POME (about 80 °C) arrives from the mill. Bar screens catch fibre and shell, and oil floats to the top. Removing solids early protects the pumps and the digester.'],
 'digester':['Covered anaerobic digester','Without oxygen, microbes break organic matter into acetate, then methanogens turn it into biogas (about 60–65 % CH₄, the rest mostly CO₂, with a little H₂S). The cover captures the gas instead of letting it escape.'],
 'gas':['Gas engine house','A gas engine burns the biogas (CH₄ + 2O₂ → CO₂ + 2H₂O) and turns a generator. Before the engine, H₂S is scrubbed out because it corrodes metal parts.'],
 'gas engine':['Gas engine house','A gas engine burns the biogas (CH₄ + 2O₂ → CO₂ + 2H₂O) and turns a generator. Before the engine, H₂S is scrubbed out because it corrodes metal parts.'],
 'polish':['Aerated polishing basin','Blowers push air through floor diffusers. Bacteria use the dissolved oxygen to break down the organics left after digestion and to turn ammonium into nitrate.'],
 'polishing':['Aerated polishing basin','Blowers push air through floor diffusers. Bacteria use the dissolved oxygen to break down the organics left after digestion and to turn ammonium into nitrate.'],
 'sludge':['Sludge drying yard','Excess sludge dries on sand and gravel beds; water drains to the pipe below or evaporates. The dried cake can be composted with empty fruit bunches after its quality is checked.'],
 'sludge yard':['Sludge drying yard','Excess sludge dries on sand and gravel beds; water drains to the pipe below or evaporates. The dried cake can be composted with empty fruit bunches after its quality is checked.'],
 'river':['Receiving river','Fish and other river life need dissolved oxygen. Poorly treated effluent feeds bacteria that use that oxygen up, so the fish disappear and scum forms.'],
 'ffb reception':['FFB reception','Lorries tip fresh fruit bunches into a hopper. A conveyor lifts them into the mill, where they must be processed within about a day before the fruit spoils.'],
 'danger':['Danger: biogas','Methane burns in air at about 5–15 % concentration. Keep flames and sparks away from the digester and gas lines.'],
 'caution':['Caution: hot effluent','Raw POME can be 70–90 °C. A splash scalds, so wear gloves and keep clear of the inlet pour.'],
 'sample point':['Sample point','Approved place to take water samples. Wear gloves and goggles, label every bottle and test it quickly so the readings stay valid.'],
 'ppe required':['PPE required','Helmet, safety boots, gloves and a high-visibility vest are required on the treatment plant.'],
 'flammable':['Flammable: flare zone','Only permit holders enter. The flare and gas line can release burning or explosive gas.'],
 'safety shower':['Safety shower and eye wash','If hot effluent, chemicals or sludge splash on skin or eyes, rinse here for at least 15 minutes and report it.'],
 'palm':['Oil palm (Elaeis guineensis)','A productive palm carries around 40 fronds and gives a fresh fruit bunch of 10–25 kg roughly every two to three weeks. The old frond bases (leaf boots) stay on the trunk in a spiral. Ripe bunches turn orange-red.'],
 'lorry':['FFB lorry','Brings bunches from the plantation. The bed tips backwards to empty into the reception hopper.'],
 'conveyor':['Hopper and conveyor','Bunches roll from the hopper onto a conveyor that lifts them into the steriliser area of the mill.'],
 'blowers':['Aeration blowers','Two blowers push air down the air main to the diffusers in the polishing basin. One can run while the other is serviced.'],
 'control':['Control room','Operators watch flows, gas production, digester temperature and generator output here. Walk up to the door and press E to read the log.'],
 'windsock':['Windsock','Shows the wind direction, so in a gas leak everyone moves upwind, away from the gas.'],
 'extinguisher':['Fire extinguisher','For small fires only. Pull the pin, aim at the base of the fire, squeeze and sweep.'],
 'valve':['Digester feed valve','Controls how fast POME is fed to the digester. Feeding too fast overloads the microbes; acids build up and gas production drops.'],
 'skip':['Screenings skip','Fibre and shell raked from the intake screen go here. They can be burnt in the mill boiler.'],
 'bench':['Field test bench','Quick tests for pH, dissolved oxygen (DO) and chemical oxygen demand (COD). Bring a filled sample bottle and press E to test it.'],
 'heap':['Compost heap','Dried sludge cake mixed with empty fruit bunches composts into a soil conditioner.'],
 'bottle':['Sample bottle','Pick it up, fill it at a sample point (basin, river or intake), then test it at the field bench.'],
 'rake':['Screen rake','Use it at the intake screen to pull off trapped fibre and shell.'],
 'detector':['Portable gas detector','Measures methane (as % of the lower explosive limit), H₂S and oxygen. Use it anywhere to take a reading.'],
 'shovel':['Shovel','Use it at the sludge yard to turn the drying cake so it dries evenly.'],
 'extinguisher-item':['Fire extinguisher','Press F to spray. Point at the base of a fire and sweep.']
};
const ITEM_DEFS={
 bottle:{name:'Sample bottle',at:[5.3,.615,.62]},
 rake:{name:'Screen rake',at:[-2.95,.02,.58]},
 detector:{name:'Gas detector',at:[6.55,.43,1.72]},
 shovel:{name:'Shovel',at:[-.7,.02,3.5]},
 extinguisher:{name:'Fire extinguisher',at:[-.4,0,1.85]}
};
const VOICE=[{pitch:.92,rate:1},{pitch:1.35,rate:1.04},{pitch:.78,rate:.97},{pitch:1.22,rate:1.02},{pitch:1,rate:.95}];

export function arcadePlay({scene,camera,canvas,viewport,wrapper,world,visitor,flows,isPond,isPolluted,onUnit}){
 const sound=createSound();
 const mat=(c,r=.5,m=.1,x={})=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m,...x});
 const quests={screen:{giver:0,title:'Clear the intake screen',hint:'Take the rake by the intake, stand at the screen and press F.',done:false,on:false},
  sample:{giver:1,title:'Test a polishing-basin sample',hint:'Bottle on the field bench → F at the polishing basin edge → E at the bench.',done:false,on:false},
  power:{giver:2,title:'Check the generator output',hint:'Walk to the control room door and press E to read the log.',done:false,on:false},
  cake:{giver:3,title:'Turn the drying cake',hint:'Shovel on the river bank → stand by the sludge yard and press F.',done:false,on:false},
  gas:{giver:4,title:'Gas-test beside the digester',hint:'Detector on the crate at the control room → press F near the digester.',done:false,on:false}};

 /* ---------- HUD ---------- */
 const hud=document.createElement('div');hud.className='play-hud';hud.innerHTML=`
  <div class="play-toast" role="status" aria-live="polite"></div>
  <div class="play-cross" aria-hidden="true"></div>
  <div class="play-tip" hidden></div>
  <div class="play-prompt" hidden></div>
  <div class="play-status" hidden><span class="play-held">Hands free</span><span class="play-stamina" title="Stamina"><i></i></span></div>
  <details class="play-quests" hidden><summary>Jobs <b>0/5</b></summary><ol></ol></details>
  <aside class="play-card" hidden role="dialog" aria-label="Information"><button class="close" aria-label="Close">×</button><button class="speak" aria-label="Read aloud">🔊</button><h4></h4><p></p></aside>
  <section class="play-talk" hidden role="dialog" aria-label="Conversation"><header><i></i><b></b><button class="close" aria-label="End conversation">×</button></header><p class="line"></p><div class="choices"></div></section>
  <div class="play-actions" hidden><button data-k="KeyE">Interact</button><button data-k="KeyF">Use</button><button data-k="KeyQ">Drop</button></div>`;
 viewport.append(hud);
 const $=s=>hud.querySelector(s),toast=$('.play-toast'),prompt=$('.play-prompt'),status=$('.play-status'),staminaBar=$('.play-stamina i'),heldEl=$('.play-held'),card=$('.play-card'),talkEl=$('.play-talk'),questEl=$('.play-quests'),tip=$('.play-tip'),cross=$('.play-cross'),actions=$('.play-actions');
 let toastTimer=0;function say(msg,ms=3200){toast.textContent=msg;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),ms)}
 function showCard(key,custom){const d=custom||INFO[key];if(!d)return false;card.querySelector('h4').textContent=d[0];card.querySelector('p').textContent=d[1];card.hidden=false;sound.fx.ui();return true}
 card.querySelector('.close').onclick=()=>{card.hidden=true;canvas.focus({preventScroll:true})};
 card.querySelector('.speak').onclick=()=>{if(!sound.enabled)setSound(true);sound.say(card.querySelector('h4').textContent+'. '+card.querySelector('p').textContent,{pitch:1,rate:1})};
 function renderQuests(){const list=Object.values(quests);const ol=questEl.querySelector('ol');ol.replaceChildren(...list.filter(q=>q.on||q.done).map(q=>{const li=document.createElement('li');li.className=q.done?'done':'';li.innerHTML=`<b></b><small></small>`;li.querySelector('b').textContent=q.title;li.querySelector('small').textContent=q.done?'Done':q.hint;return li}));
  questEl.querySelector('summary b').textContent=list.filter(q=>q.done).length+'/'+list.length;}
 function complete(id){const q=quests[id];if(!q||q.done)return;q.done=true;q.on=true;renderQuests();sound.fx.success();say('Job done: '+q.title+' ✓',4200)}
 for(const b of actions.querySelectorAll('button'))b.onclick=()=>key(b.dataset.k);

 /* ---------- controls bar: play and sound ---------- */
 const bar=document.createElement('div');bar.className='play-bar';bar.innerHTML='<button class="primary play-go">▶ Play as a worker</button> <button class="play-sound" aria-pressed="false">Sound off</button> <span class="play-keys">W A S D move · Shift run · Space jump · E interact / talk · F use item · Q drop · click a label to learn more</span>';
 visitor.controls.prepend(bar);const soundBtn=bar.querySelector('.play-sound');
 function setSound(on){sound.enable(on);soundBtn.setAttribute('aria-pressed',String(on));soundBtn.textContent=on?'Sound on':'Sound off'}
 soundBtn.onclick=()=>setSound(!sound.enabled);
 bar.querySelector('.play-go').onclick=()=>{setSound(true);visitor.setMode('third');say('You are '+who()+'. Walk up to a worker and press E to talk.',5200)};
 const who=()=>{const r=world.roles[visitor.roleIndex()];return r.person+', '+r.name.toLowerCase()};
 visitor.on('mode',m=>{const walking=m!=='orbit';status.hidden=!walking;prompt.hidden=true;lastPrompt='';questEl.hidden=!walking;actions.hidden=!walking||!matchMedia('(pointer:coarse)').matches;cross.classList.toggle('show',m==='first');if(!walking){endTalk();prompt.hidden=true}renderQuests()});
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
 const crate=new T.Mesh(new T.BoxGeometry(.42,.4,.36),mat(0x8c6a3b,.85));crate.position.set(6.55,.2,1.72);crate.castShadow=crate.receiveShadow=true;crate.userData.info='control';scene.add(crate);
 const items=Object.entries(ITEM_DEFS).map(([kind,d])=>{const m=itemModel(kind);m.position.set(...d.at);scene.add(m);return {kind,name:d.name,mesh:m,held:false}});
 let held=null,sample=null,lastPrompt='',tick=0;
 function pick(it){if(held)drop();it.held=true;it.mesh.visible=false;held=it;world.equip(visitor.player,it.kind);visitor.setHeld(it.kind);sound.fx.pickup();heldEl.textContent='Holding: '+it.name;say('Picked up the '+it.name.toLowerCase()+'. '+(INFO[it.kind==='extinguisher'?'extinguisher-item':it.kind]?.[1]||''),4800)}
 function drop(silent){if(!held)return;const p=visitor.position,h=visitor.heading;held.mesh.position.set(p.x-Math.sin(h)*.45,held.kind==='extinguisher'?0:.02,p.z-Math.cos(h)*.45);held.mesh.visible=true;held.held=false;
  const prop=visitor.player.props[held.kind];if(prop)prop.visible=false;visitor.setHeld(null);if(!silent){sound.fx.drop();say('Put down the '+held.name.toLowerCase()+'.')}held=null;sample=null;heldEl.textContent='Hands free'}

 /* ---------- places you can act ---------- */
 const P=(x,z)=>({x,z});
 const zones={
  polish:{near:p=>p.x>.6&&p.x<4.6&&p.z>.85&&p.z<1.45||p.x>4.7&&p.x<5.0&&p.z>-1.6&&p.z<.9,face:p=>P(Math.max(.9,Math.min(4.3,p.x)),.2)},
  river:{near:p=>p.z>3.2,face:p=>P(p.x,4.6)},
  intake:{near:p=>p.x>-5.1&&p.x<-2.9&&p.z>.4&&p.z<1.2,face:p=>P(p.x,-.6)},
  sludge:{near:p=>(p.x>-4.4&&p.x<-.8&&p.z>1.35&&p.z<1.75)||(p.x>-.75&&p.x<-.3&&p.z>1.8&&p.z<3.4),face:p=>p.z<1.8?P(p.x,2.5):P(-1.6,p.z)},
  digester:{near:p=>Math.hypot(p.x+.9,p.z+1.65)<2.6,face:()=>P(-.9,-1.65)},
  bench:{near:p=>Math.hypot(p.x-5.45,p.z-1.3)<.75,face:()=>P(5.45,.69)},
  control:{near:p=>Math.hypot(p.x-6.8,p.z-1.65)<.8,face:()=>P(6.8,2.4)},
  valve:{near:p=>Math.hypot(p.x-world.valvePosition.x,p.z-world.valvePosition.z-.55)<.7,face:()=>P(world.valvePosition.x,world.valvePosition.z)},
  lorry:{near:p=>Math.hypot(p.x+6.5,p.z-1.0)<.8,face:()=>P(-7.2,1.0)}
 };
 const inZone=id=>zones[id].near(visitor.position);
 function faceZone(id){const f=zones[id].face(visitor.position);visitor.faceTowards(f.x,f.z)}

 /* ---------- conversations ---------- */
 const job=i=>world.roles[i].state;
 const JOBTALK={rake:'raking fibre off the screen so it does not choke the pumps',dump:'tipping the screenings into the skip',valve:'trimming the feed valve so the digester is not overloaded',clipboard:'writing readings in the log',dip:'taking a water sample',test:'testing pH, DO and COD at the bench',tablet:'checking readings on my tablet',kneel:'servicing the engine — plugs and the gas filter',shovel:'shovelling dried sludge cake',tip:'tipping cake on the compost heap',detector:'sniffing the gas line for leaks',walk:'walking to my next job'};
 const TREES=[
  {start:()=>`Morning! I'm ${world.roles[0].person}, shift operator. Careful — the POME comes in at about 80 degrees.`,
   options:()=>[['What are you doing right now?','now'],['Why rake the screen?','why'],['How do you know the digester is healthy?','health'],quests.screen.done?['Screen looks clean now.','thanks']:['Can I help?','help'],['See you later.','end']],
   now:()=>`I'm ${JOBTALK[job(0).job]||'busy'}. Every job here keeps the next unit running smoothly.`,
   why:'Fibre and shell from the press clog pumps and settle in the digester. Pull them out early and they become boiler fuel instead of trouble.',
   health:'Steady gas flow, pH around seven, and the volatile fatty acids not climbing. If acids build up, the methanogens get stressed and the gas drops.',
   help:()=>{quests.screen.on=true;renderQuests();return 'Sure! Grab the rake by the intake, stand at the screen and press F. Pull off all the fibre you can.'},
   thanks:'Nice work. A clean screen means a happy pump — and a happy operator.'},
  {start:()=>`Hi! I'm ${world.roles[1].person}. I sample and test the water from every stage.`,
   options:()=>[['What are you doing now?','now'],['What do pH, DO and COD mean?','terms'],['Is the river safe?','river'],quests.sample.done?['I tested a sample!','thanks']:['Can I help?','help'],['Bye!','end']],
   now:()=>`Right now I'm ${JOBTALK[job(1).job]||'busy'}.`,
   terms:'pH tells us if water is acidic or alkaline. DO is dissolved oxygen — fish need it. COD is how much oxygen the pollution would use up. Lower COD means cleaner water.',
   river:()=>isPolluted()?'Not today. The oxygen is low and the COD is high — the treatment upset is reaching the river. That is why the fish have gone.':'Today it looks good: plenty of dissolved oxygen and low COD. You can see the fish jumping.',
   help:()=>{quests.sample.on=true;renderQuests();return 'Please! There is a sample bottle on the field bench. Fill it at the polishing basin edge with F, then bring it back and press E at the bench to test it.'},
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
   cake:'We mix it with empty fruit bunches and compost it. After the quality is checked it goes back to the plantation as a soil conditioner.',
   help:()=>{quests.cake.on=true;renderQuests();return 'There is a spare shovel on the river bank. Stand by the edge of the sludge yard and press F to turn the cake.'},
   thanks:'Thank you! Turning the cake helps it dry evenly.'},
  {start:()=>`I'm ${world.roles[4].person}, gas safety officer. Safety first — are you wearing your PPE?`,
   options:()=>[['What are you doing now?','now'],['How dangerous is biogas?','danger'],['What is the flare for?','flare'],quests.gas.done?['I took a gas reading.','thanks']:['Can I help?','help'],['Stay safe!','end']],
   now:()=>`I'm ${JOBTALK[job(4).job]||'busy'}.`,
   danger:'Methane can explode at about five to fifteen percent in air, and hydrogen sulphide is toxic even at low levels. So we test before anyone works near the gas line.',
   flare:()=>isPond()?'With open ponds there is no gas to flare — and that is the problem: the methane escapes straight to the sky.':'When the engine cannot use all the biogas, the flare burns it. Burnt methane becomes CO₂, which warms the climate far less than methane.',
   help:()=>{quests.gas.on=true;renderQuests();return 'Take the gas detector from the crate by the control room. Stand near the digester and press F to take a reading.'},
   thanks:'Good habit! Test the air, read the numbers, then decide if it is safe to work.'}
 ];
 const BLOCKED=['Excuse me!','Coming through, please.','Mind the way!','Sorry, could I pass?'];
 let talking=null;
 function npcSay(i,text,done){const a=world.roles[i].actor;sound.say(text,{...VOICE[i],voice:i,onstart:()=>a.talk(true),onend:()=>{a.talk(false);done?.()}})}
 function openTalk(i){if(talking!==null)endTalk();talking=i;world.hold(i,'talk');const a=world.roles[i].actor;visitor.faceTowards(a.g.position.x,a.g.position.z);
  talkEl.hidden=false;talkEl.querySelector('header b').textContent=world.roles[i].person+' · '+world.roles[i].name;talkEl.querySelector('header i').style.background=getComputedStyle(document.documentElement).getPropertyValue('--lime')||'#d9f58a';talkEl.dataset.crew=i;node(i,'start');if(document.pointerLockElement===canvas)document.exitPointerLock()}
 function node(i,id){const tree=TREES[i];if(id==='end'){npcSay(i,['Take care!','See you around.','Stay safe out there.'][Math.floor(Math.random()*3)]);endTalk();return}
  const n=tree[id];const text=typeof n==='function'?n():n;const line=talkEl.querySelector('.line');line.textContent='';let k=0;const typer=setInterval(()=>{line.textContent=text.slice(0,k+=2);if(k>=text.length)clearInterval(typer)},18);
  npcSay(i,text);const choices=talkEl.querySelector('.choices');choices.replaceChildren(...tree.options().map(([label,next],j)=>{const b=document.createElement('button');b.innerHTML=`<kbd>${j+1}</kbd> `;b.append(label);b.onclick=()=>{sound.fx.click();node(i,next)};return b}));}
 function endTalk(){if(talking===null)return;const i=talking;talking=null;setTimeout(()=>{world.hold(i,null);world.roles[i].actor.talk(false)},600);talkEl.hidden=true;canvas.focus({preventScroll:true})}
 talkEl.querySelector('.close').onclick=()=>{sound.hush();endTalk()};

 /* ---------- interaction targets ---------- */
 let npcDist=0,itemDist=0;
 function nearestNPC(){let best=null,bd=1.35;world.roles.forEach((r,i)=>{if(r.actor===visitor.player)return;const d=Math.hypot(r.actor.g.position.x-visitor.position.x,r.actor.g.position.z-visitor.position.z);if(d<bd){bd=d;best=i}});npcDist=bd;return best}
 function nearestItem(){let best=null,bd=.8;for(const it of items){if(it.held)continue;const d=Math.hypot(it.mesh.position.x-visitor.position.x,it.mesh.position.z-visitor.position.z);if(d<bd){bd=d;best=it}}itemDist=bd;return best}
 // The closest thing wins: a worker, an item on the ground, or a place to act.
 function target(){const c=[];
  const npc=nearestNPC();if(npc!==null)c.push({d:npcDist+.15,kind:'talk',label:`E · Talk to ${world.roles[npc].person}`,run:()=>openTalk(npc)});
  const it=nearestItem();if(it)c.push({d:itemDist,kind:'item',label:`E · Pick up ${it.name.toLowerCase()}`,run:()=>pick(it)});
  if(inZone('bench')&&held?.kind==='bottle'&&sample)c.push({d:.3,kind:'spot',label:'E · Test the sample',run:testSample});
  if(inZone('control'))c.push({d:.5,kind:'spot',label:'E · Read the control room log',run:readLog});
  if(inZone('valve'))c.push({d:.5,kind:'spot',label:'E · Turn the digester feed valve',run:turnValve});
  if(inZone('lorry'))c.push({d:.5,kind:'spot',label:'E · Wave to the lorry driver',run:()=>{sound.fx.horn();say('The driver waves back and tips another load of bunches.')}});
  return c.sort((a,b)=>a.d-b.d)[0]||null;
 }
 function useLabel(){if(!held)return null;
  if(held.kind==='bottle'){if(sample)return inZone('bench')?null:'F · Pour away the sample';for(const z of ['polish','river','intake'])if(inZone(z))return 'F · Fill the bottle here';return null}
  if(held.kind==='rake')return inZone('intake')?'F · Rake the intake screen':null;
  if(held.kind==='shovel')return inZone('sludge')?'F · Turn the drying cake':null;
  if(held.kind==='detector')return 'F · Take a gas reading';
  if(held.kind==='extinguisher')return 'F · Spray';
  return null}

 /* ---------- actions ---------- */
 let spray=0,dig=0,valveTurning=0;
 function readLog(){faceZone('control');const pond=isPond(),dirty=isPolluted(),t=performance.now()/1000;const gas=pond?0:Math.round(205+15*Math.sin(t*.3));
  showCard(null,['Control room log',`Biogas to engine: ${gas} m³/h${pond?' (open ponds — methane vents to air)':' · CH₄ 62 %'}\nGenerator output: ${Math.round(gas*1.85)} kW\nDigester temperature: ${pond?'—':'36.4 °C'} · pH ${pond?'—':'7.1'}\nPolishing basin DO: ${dirty?'0.6':'2.1'} mg/L\nFinal discharge COD: ${dirty?'340':'115'} mg/L (illustrative)`]);
  complete('power')}
 function turnValve(){faceZone('valve');if(!visitor.act('valve',3,()=>say('Feed trimmed: the digester gets a steadier, gentler load.')))return;valveTurning=3;sound.fx.squeak();setTimeout(()=>sound.fx.squeak(),1200)}
 function testSample(){faceZone('bench');world.equip(visitor.player,'probe');if(!visitor.act('test',4.5,()=>{const src=sample,dirty=isPolluted();
  const r={polish:dirty?['Polishing basin sample','pH 7.2 · DO 0.6 mg/L · COD 260 mg/L · NH₄-N 18 mg/L\nLow oxygen: the blowers cannot keep up with the load. (Illustrative values.)']:['Polishing basin sample','pH 7.6 · DO 2.2 mg/L · COD 110 mg/L · NH₄-N 6 mg/L\nWell aerated: the bacteria have plenty of oxygen. (Illustrative values.)'],
   river:dirty?['River sample','pH 6.8 · DO 2.1 mg/L · COD 140 mg/L\nToo little oxygen for most fish. (Illustrative values.)']:['River sample','pH 7.0 · DO 6.8 mg/L · COD 18 mg/L\nHealthy for river life. (Illustrative values.)'],
   intake:['Raw POME sample','pH 4.4 · COD about 50,000 mg/L · temperature 78 °C · oil and grease high\nAcidic, hot and very strong — why it needs treatment. (Illustrative values.)']}[src];
  showCard(null,r);sound.fx.beep(0);if(src==='polish')complete('sample');sample=null;heldEl.textContent='Holding: Sample bottle (empty)'}))return;sound.fx.click()}
 function use(){if(!held||visitor.busy())return;const k=held.kind;
  if(k==='bottle'){if(sample){sample=null;heldEl.textContent='Holding: Sample bottle (empty)';sound.fx.splash();say('Sample poured away.');return}
   const z=['polish','river','intake'].find(inZone);if(!z){say('Stand at a sample point first: the polishing basin edge, the river bank or the intake.');return}
   faceZone(z);world.equip(visitor.player,'dipper');visitor.act('dip',4,()=>{sample=z;heldEl.textContent='Holding: Sample bottle ('+{polish:'polishing basin',river:'river',intake:'raw POME'}[z]+')';say('Bottle filled. Take it to the field bench and press E to test it.')});setTimeout(()=>sound.fx.splash(),1300);return}
  if(k==='rake'){if(!inZone('intake')){say('Stand at the intake screen to rake it.');return}faceZone('intake');visitor.act('rake',5.2,()=>{const n=flows.clearScreen?.()||0;say(n?`Screen cleared: ${n} pieces of fibre lifted out.`:'The screen is already clean.');complete('screen')});[0,1300,2600,3900].forEach(t=>setTimeout(()=>sound.fx.scrape(),t+700));return}
  if(k==='shovel'){if(!inZone('sludge')){say('Stand at the edge of the sludge yard to turn the cake.');return}faceZone('sludge');visitor.act('shovel',6.4,()=>{say('Cake turned: the wet underside now faces the sun.');complete('cake')});dig=6.4;[0,3200].forEach(t=>setTimeout(()=>sound.fx.shovel(),t+500));return}
  if(k==='detector'){visitor.act('detector',3.5,gasReading);[0,500,1000,1500,2000,2500].forEach(t=>setTimeout(()=>sound.fx.beep(.2),t));return}
  if(k==='extinguisher'){visitor.act('spray',2.5,()=>say('Remember: pull, aim, squeeze, sweep.'));spray=2.5;sound.fx.spray();return}}
 function gasReading(){const p=visitor.position,pond=isPond();
  const dDig=Math.max(0,Math.hypot(p.x+.9,p.z+1.65)-1.4),dEng=Math.hypot(p.x-3.1,p.z+3.1),dFlare=Math.hypot(p.x-.9,p.z+3.6),dIn=Math.hypot(p.x+4,p.z+.7);
  const lel=Math.max(0,Math.round((pond?14:3)*Math.exp(-dDig/.8)+2*Math.exp(-dEng/1.2)+(pond?0:1.5*Math.exp(-dFlare)))),h2s=Math.max(0,Math.round((pond?9:3)*Math.exp(-dDig/.9)+4*Math.exp(-dIn/1.2)));
  const warn=lel>=10||h2s>=10;if(warn)sound.fx.alarm();
  showCard(null,['Gas detector reading',`CH₄ ${lel} % LEL · H₂S ${h2s} ppm · O₂ 20.9 %\n${warn?'ALARM: move upwind (check the windsock) and report it.':lel||h2s?'Low readings — normal near the digester, but keep checking.':'Clear air here.'}${pond&&dDig<1.5?' Open ponds release methane freely.':''}`]);
  if(dDig<1.3)complete('gas')}

 function key(code){
  if(code.startsWith('Digit')&&talking!==null){const b=talkEl.querySelectorAll('.choices button')[Number(code.slice(5))-1];b?.click();return}
  if(code==='KeyE'){if(talking!==null){endTalk();return}const t=target();if(t)t.run();else if(held&&useLabel())use();return}
  if(code==='KeyF'){use();return}
  if(code==='KeyQ'){drop();return}
 }
 visitor.on('key',key);
 visitor.on('step',({run,x,z})=>{const surf=(z>.8&&z<1.7)||(x>-6.15&&x<-5.25)?'gravel':'grass';sound.fx.step(surf,run)});
 visitor.on('jump',()=>sound.fx.jump());visitor.on('land',v=>sound.fx.land(v/4));

 /* ---------- clickable labels, signs and objects ---------- */
 const infoBoxes=[['blowers',[6.95,.5,-.55],[1.25,1,1]],['control',[7,.45,2.4],[1.35,.9,.95]],['windsock',[-7.6,1.4,-3.9],[.3,2.7,.3]],['conveyor',[-7.2,.5,-1.4],[.8,1.1,1.2]],['skip',[-5.8,.25,.85],[.65,.5,.5]],['bench',[5.45,.45,.69],[.85,.9,.5]],['heap',[-5.85,.2,2.6],[.8,.4,.8]],['valve',[-.35,.8,.02],[.35,.35,.3]],['to mill grid',[5,1,-3.3],[.3,2,.6]],['extinguisher',[-3.15,.2,-.2],[.15,.45,.15]],['extinguisher',[1.95,.2,-1.95],[.15,.45,.15]],['extinguisher',[5.65,.2,-1.55],[.15,.45,.15]]];
 const hidden=new T.MeshBasicMaterial({visible:false});
 for(const [k,p,s] of infoBoxes){const m=new T.Mesh(new T.BoxGeometry(...s),hidden);m.position.set(...p);m.userData.info=k;scene.add(m)}
 let infoTargets=[];function collect(){infoTargets=[];scene.traverse(o=>{if(o.userData.info&&(o.isMesh||o.isSprite))infoTargets.push(o)});world.roles.forEach((r,i)=>r.actor.g.traverse(o=>{if(o.isMesh)o.userData.npc=i}))}
 collect();
 const ray=new T.Raycaster(),v2=new T.Vector2();
 function hitAt(u,v,withPalms=true){v2.set(u*2-1,1-v*2);ray.setFromCamera(v2,camera);ray.far=40;
  const list=withPalms?infoTargets:infoTargets.filter(o=>o.userData.info!=='palm');
  const npcMeshes=[];world.roles.forEach(r=>{if(r.actor!==visitor.player)r.actor.g.traverse(o=>{if(o.isMesh&&o.visible)npcMeshes.push(o)})});
  const hits=ray.intersectObjects([...list,...npcMeshes],false).filter(h=>h.object.visible!==false||h.object.material===hidden);return hits[0]?.object}
 function infoFor(o){if(o.userData.npc!==undefined){const i=o.userData.npc,r=world.roles[i];return [r.person+' · '+r.name,`${({0:'Runs the intake and the digester feed.',1:'Samples and tests water from every stage and the river.',2:'Keeps the gas engine, meters and instruments working.',3:'Handles sludge drying, the wheelbarrow and the compost heap.',4:'Checks for gas leaks and keeps the flare and permits safe.'})[i]} Right now: ${r.state.label.toLowerCase()}. Walk up and press E to talk.`]}return INFO[o.userData.info]}
 function handleClick(u,v){const o=hitAt(u,v);if(!o)return false;const d=infoFor(o);if(!d)return false;showCard(null,d);return true}
 canvas.addEventListener('pointermove',e=>{if(e.buttons||document.pointerLockElement===canvas)return;const now=performance.now();if(now-(handleClick.t||0)<120)return;handleClick.t=now;const r=canvas.getBoundingClientRect();
  const o=hitAt((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height,false),d=o&&infoFor(o);if(d){tip.textContent=d[0];tip.hidden=false;tip.style.left=(e.clientX-r.left+14)+'px';tip.style.top=(e.clientY-r.top+12)+'px';canvas.style.cursor='help'}else{tip.hidden=true;canvas.style.cursor=''}});
 canvas.addEventListener('pointerleave',()=>{tip.hidden=true});
 // While the mouse is locked, a click inspects whatever sits under the crosshair.
 canvas.addEventListener('mousedown',e=>{if(document.pointerLockElement===canvas&&e.button===0){handleClick(.5,.5)}});

 /* ---------- ambience ---------- */
 const amb={engine:sound.ambient('hum',P(3.1,-3.1),{freq:52,gain:.22,radius:7}),blowers:sound.ambient('hum',P(6.95,-.55),{freq:118,gain:.12,radius:5}),flare:sound.ambient('roar',P(.9,-3.6),{gain:.2,radius:6}),
  river:sound.ambient('water',P(0,4.75),{gain:.18,radius:4,line:[-8,8]}),digester:sound.ambient('bubbles',P(-.9,-1.65),{freq:420,gain:.06,radius:3.5}),pour:sound.ambient('water',P(-4.85,-.1),{gain:.1,radius:3}),conveyor:sound.ambient('hum',P(-7.2,-1.3),{freq:76,gain:.07,radius:4})};

 /* ---------- per-frame ---------- */
 const fwd=new T.Vector3();
 flows.hook?.((C,t,dt)=>{if(spray>0){const p=visitor.position,h=visitor.heading;for(let k=0;k<26;k++){const f=((t*3+k/26)%1),r=.25+f*1.6;C.put('steam',p.x-Math.sin(h)*r+(Math.sin(k*7.3)*.25*f),.75-f*.35+Math.sin(k)*.1*f,p.z-Math.cos(h)*r+(Math.cos(k*5.1)*.25*f),.04+.18*f,k)}}
  if(dig>0&&((dig*1.25)%1)<.3){const p=visitor.position,h=visitor.heading;for(let k=0;k<5;k++)C.put('floc',p.x-Math.sin(h)*(.9+k*.05),.25+.2*Math.sin(k),p.z-Math.cos(h)*(.9+k*.05),.035,k)}});
 function update(dt){
  const walking=visitor.isWalking();amb.flare.on=amb.engine.on=!isPond();
  camera.getWorldDirection(fwd);sound.listen(camera.position.x,camera.position.z,Math.atan2(fwd.x,-fwd.z)*-1,dt);
  spray=Math.max(0,spray-dt);dig=Math.max(0,dig-dt);if(valveTurning>0){valveTurning-=dt;world.turnValve(dt)}
  for(const e of world.takeEvents())if(e.type==='blocked'&&walking)npcSay(e.i,BLOCKED[Math.floor(Math.random()*BLOCKED.length)]);
  if(talking!==null){const a=world.roles[talking].actor;if(Math.hypot(a.g.position.x-visitor.position.x,a.g.position.z-visitor.position.z)>2.2)endTalk()}
  if(!walking){ring.visible=false;return}
  staminaBar.style.width=Math.round(visitor.stamina*100)+'%';
  if((tick+=dt)<.1)return;tick=0;
  const t=talking===null?target():null,u=talking===null?useLabel():null,text=[t?.label,u].filter(Boolean).join('   ·   ');
  if(text!==lastPrompt){lastPrompt=text;prompt.textContent=text;prompt.hidden=!text}
  const it=nearestItem();ring.visible=!!it;if(it){ring.position.set(it.mesh.position.x,.03,it.mesh.position.z);ring.scale.setScalar(1+.1*Math.sin(performance.now()/200))}
 }
 return {update,handleClick,showInfo:key=>showCard(key),sound};
}
