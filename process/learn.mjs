import * as T from './three.module.min.js';

/*
 Learning while playing: a guided "Follow the POME" trail with glowing checkpoints and a
 direction pointer, a quiz at every stop, quick quizzes from the crew, XP with levels and
 badges, a field notebook that collects everything discovered, and a live COD meter that
 shows how much pollution each stage removes. Progress is kept in the browser.
*/
const LEVELS=[[0,'Trainee'],[80,'Operator'],[200,'Senior operator'],[380,'Process engineer'],[600,'Plant expert']];
const BADGES={first:['First stop','Reached your first trail checkpoint'],trail:['Trail complete','Followed the POME through every stage'],curious:['Curious mind','Discovered 12 things in the plant'],ace:['Quiz ace','Answered 5 quiz questions correctly'],jobs:['Crew favourite','Finished every job the crew asked for']};

export function createLearning({viewport,bar,sound,scene,camera,visitor,key,trail,stages,say}){
 const store='pome-learn-'+key;
 let S;try{S=JSON.parse(localStorage.getItem(store))}catch{}S=Object.assign({xp:0,found:{},badges:{},step:0,correct:0,asked:{}},S||{});
 const save=()=>{try{localStorage.setItem(store,JSON.stringify(S))}catch{}};

 /* ---------- HUD ---------- */
 const hud=document.createElement('div');hud.className='learn-hud';hud.innerHTML=`
  <div class="learn-guide" hidden><i class="arrow">➤</i><span></span></div>
  <div class="learn-level" hidden><b></b><span class="bar"><i></i></span><small></small></div>
  <ol class="learn-stages" hidden aria-label="COD through the plant"></ol>
  <section class="learn-quiz" hidden role="dialog" aria-label="Quiz"><small class="by"></small><h4></h4><div class="opts"></div><p class="why"></p><button class="next" hidden>Continue</button></section>
  <section class="learn-book" hidden role="dialog" aria-label="Field notebook"><header><b>Field notebook</b><button class="close" aria-label="Close">×</button></header><div class="summary"></div><h5>Badges</h5><ul class="badges"></ul><h5>Discovered</h5><ul class="found"></ul><button class="reset">Reset my progress</button></section>`;
 viewport.append(hud);
 const $=s=>hud.querySelector(s),guide=$('.learn-guide'),level=$('.learn-level'),stageList=$('.learn-stages'),quizEl=$('.learn-quiz'),book=$('.learn-book');
 const bookBtn=document.createElement('button');bookBtn.className='learn-book-btn';bar.querySelector('.play-sound').after(bookBtn);
 const trailBtn=document.createElement('button');trailBtn.className='learn-trail-btn';trailBtn.textContent='🧭 Follow the POME trail';bookBtn.after(trailBtn);
 function levelOf(xp){let l=LEVELS[0],next=null;for(let i=0;i<LEVELS.length;i++){if(xp>=LEVELS[i][0]){l=LEVELS[i];next=LEVELS[i+1]||null}}return {name:l[1],from:l[0],to:next?.[0]}}
 function render(){const L=levelOf(S.xp);level.querySelector('b').textContent=L.name;level.querySelector('small').textContent=`${S.xp} XP`+(L.to?` · ${L.to-S.xp} to next`:'');
  level.querySelector('.bar i').style.width=(L.to?Math.round((S.xp-L.from)/(L.to-L.from)*100):100)+'%';bookBtn.textContent=`📓 Notebook (${Object.keys(S.found).length})`;
  trailBtn.textContent=S.step>=trail.length?'🧭 Trail complete ✓':`🧭 POME trail ${S.step}/${trail.length}`}
 function award(n,why){const before=levelOf(S.xp).name;S.xp+=n;save();render();const after=levelOf(S.xp).name;if(after!==before){sound.fx.success();say(`Level up: ${after}!`,4200)}}
 function badge(id){if(S.badges[id])return;S.badges[id]=Date.now();save();sound.fx.success();say(`Badge earned: ${BADGES[id][0]} — ${BADGES[id][1]}`,5200);render()}
 function discover(k,title,text){if(!k||S.found[k])return;S.found[k]=[title,text];award(5,'discovery');if(Object.keys(S.found).length>=12)badge('curious');save()}
 function openBook(){const L=levelOf(S.xp);book.querySelector('.summary').textContent=`${L.name} · ${S.xp} XP · ${S.correct} correct answers · trail ${Math.min(S.step,trail.length)}/${trail.length}`;
  book.querySelector('.badges').replaceChildren(...Object.entries(BADGES).map(([id,[t,d]])=>{const li=document.createElement('li');li.className=S.badges[id]?'got':'';li.innerHTML='<b></b><small></small>';li.querySelector('b').textContent=(S.badges[id]?'🏅 ':'🔒 ')+t;li.querySelector('small').textContent=d;return li}));
  const list=Object.entries(S.found);book.querySelector('.found').replaceChildren(...(list.length?list.map(([,[t,d]])=>{const li=document.createElement('li');li.innerHTML='<b></b><small></small>';li.querySelector('b').textContent=t;li.querySelector('small').textContent=d;return li}):[Object.assign(document.createElement('li'),{textContent:'Click labels, signs and equipment to fill your notebook.'})]));
  book.hidden=false;if(document.pointerLockElement)document.exitPointerLock()}
 bookBtn.onclick=openBook;book.querySelector('.close').onclick=()=>{book.hidden=true};
 book.querySelector('.reset').onclick=()=>{if(!confirm('Reset your XP, badges, notebook and trail for this scene?'))return;S={xp:0,found:{},badges:{},step:0,correct:0,asked:{}};save();render();book.hidden=true;placeMarker()};
 trailBtn.onclick=()=>{if(!visitor.isWalking())bar.querySelector('.play-go').click();if(S.step>=trail.length){S.step=0;save()}placeMarker();say(`Trail: walk to the glowing marker — ${trail[S.step].title}.`,4200)};

 /* ---------- quiz ---------- */
 let quizDone=null,quizItem=null,answered=false;
 function quiz(item,{by='',reward=20,onDone}={}){
  quizItem=item;answered=false;quizDone=onDone;quizEl.hidden=false;quizEl.querySelector('.by').textContent=by;quizEl.querySelector('h4').textContent=item.q;quizEl.querySelector('.why').textContent='';quizEl.querySelector('.next').hidden=true;
  quizEl.dataset.reward=reward;quizEl.querySelector('.opts').replaceChildren(...item.options.map((o,i)=>{const b=document.createElement('button');b.innerHTML=`<kbd>${i+1}</kbd> `;b.append(o);b.onclick=()=>answer(i);return b}));
  if(document.pointerLockElement)document.exitPointerLock();if(sound.enabled)sound.say(item.q,{pitch:1.02,rate:1.02});
 }
 function answer(i){if(answered||!quizItem)return;answered=true;const ok=i===quizItem.answer,btns=[...quizEl.querySelectorAll('.opts button')];
  btns.forEach((b,k)=>{b.disabled=true;b.dataset.state=k===quizItem.answer?'right':k===i?'wrong':''});
  quizEl.querySelector('.why').textContent=(ok?'Correct! ':'Not quite. ')+quizItem.why;quizEl.querySelector('.next').hidden=false;quizEl.querySelector('.next').focus({preventScroll:true});
  if(ok){S.correct++;sound.fx.success();award(Number(quizEl.dataset.reward),'quiz');if(S.correct>=5)badge('ace')}else{sound.fx.beep(-.6);award(5,'quiz')}save();
  if(sound.enabled)sound.say((ok?'Correct! ':'Not quite. ')+quizItem.why,{pitch:1.02,rate:1.04})}
 quizEl.querySelector('.next').onclick=()=>{quizEl.hidden=true;sound.hush();const d=quizDone;quizDone=quizItem=null;d?.();visitor.controls.ownerDocument&&viewport.querySelector('canvas')?.focus({preventScroll:true})};
 function handleKey(code){if(!quizEl.hidden){if(code.startsWith('Digit'))answer(Number(code.slice(5))-1);else if(code==='KeyE'&&answered)quizEl.querySelector('.next').click();return true}return false}

 /* ---------- trail markers ---------- */
 const marker=new T.Group();scene.add(marker);marker.visible=false;
 const ringMat=new T.MeshBasicMaterial({color:0xd9f58a,transparent:true,opacity:.85,depthWrite:false});
 const ring=new T.Mesh(new T.TorusGeometry(.42,.03,8,48),ringMat);ring.rotation.x=Math.PI/2;marker.add(ring);
 const beam=new T.Mesh(new T.CylinderGeometry(.32,.42,3.2,24,1,true),new T.MeshBasicMaterial({color:0xd9f58a,transparent:true,opacity:.16,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}));beam.position.y=1.6;marker.add(beam);
 const numCanvas=document.createElement('canvas');numCanvas.width=numCanvas.height=128;const numTex=new T.CanvasTexture(numCanvas);numTex.colorSpace=T.SRGBColorSpace;
 const num=new T.Sprite(new T.SpriteMaterial({map:numTex,depthWrite:false,transparent:true}));num.scale.set(.42,.42,1);num.position.y=1.55;marker.add(num);
 function placeMarker(){if(S.step>=trail.length){marker.visible=false;guide.hidden=true;return}const c=trail[S.step];marker.position.set(c.at[0],c.y??.12,c.at[1]);
  const g=numCanvas.getContext('2d');g.clearRect(0,0,128,128);g.fillStyle='#d9f58a';g.beginPath();g.arc(64,64,56,0,7);g.fill();g.fillStyle='#102b27';g.font='bold 66px system-ui,Arial';g.textAlign='center';g.fillText(String(S.step+1),64,86);numTex.needsUpdate=true}
 placeMarker();
 function arrive(){const c=trail[S.step];sound.fx.success();award(10,'checkpoint');if(S.step===0)badge('first');
  quiz(c.quiz,{by:`Stop ${S.step+1} of ${trail.length} · ${c.title}`,onDone:()=>{S.step++;save();render();if(S.step>=trail.length){badge('trail');say('You followed the POME all the way through. Open your notebook to review.',5200)}else say(`Next stop: ${trail[S.step].title}.`,3600);placeMarker()}});
  say(c.title+' — '+c.fact,7000)}

 /* ---------- COD meter ---------- */
 function renderStages(active){const vals=stages.map(s=>s.cod());const top=Math.max(...vals,1);
  stageList.replaceChildren(...stages.map((s,i)=>{const li=document.createElement('li');li.className=i===active?'on':'';const v=vals[i];const raw=i?Math.max(0,(1-v/vals[0])*100):null,pct=raw===null?null:raw>=99?raw.toFixed(1):Math.round(raw);
   li.innerHTML=`<span class="n"></span><span class="v"></span><span class="b"><i style="width:${Math.max(2,Math.log10(v+1)/Math.log10(top+1)*100)}%"></i></span>`;li.querySelector('.n').textContent=s.name;li.querySelector('.v').textContent=v.toLocaleString()+' mg/L'+(pct!==null?` · −${pct}%`:'');return li}));
  const note=document.createElement('li');note.className='note';note.textContent='COD after each stage (illustrative)';stageList.append(note)}

 let lastStage=-2,acc=0;
 function update(dt){
  const walking=visitor.isWalking();level.hidden=stageList.hidden=!walking;marker.visible=walking&&S.step<trail.length;
  if(!walking){guide.hidden=true;return}
  const t=performance.now()/1000;ring.scale.setScalar(1+.08*Math.sin(t*3));ringMat.opacity=.6+.3*Math.sin(t*3);beam.rotation.y=t*.5;
  if((acc+=dt)<.12)return;acc=0;const p=visitor.position;
  // Direction pointer to the next checkpoint, relative to where the camera looks.
  if(marker.visible&&quizEl.hidden){const c=trail[S.step],dx=c.at[0]-p.x,dz=c.at[1]-p.z,d=Math.hypot(dx,dz);
   if(d<.85){arrive();guide.hidden=true}else{const v=new T.Vector3();camera.getWorldDirection(v);const rel=Math.atan2(dx,-dz)-Math.atan2(v.x,-v.z);guide.hidden=false;guide.querySelector('.arrow').style.transform=`rotate(${rel*180/Math.PI-90}deg)`;guide.querySelector('span').textContent=`Stop ${S.step+1}: ${c.title} · ${d.toFixed(1)} m`}}
  else guide.hidden=true;
  let best=-1,bd=2.6;stages.forEach((s,i)=>{if(!s.at)return;const d=Math.hypot(s.at[0]-p.x,s.at[1]-p.z);if(d<bd){bd=d;best=i}});
  if(best!==lastStage||Math.random()<.05){lastStage=best;renderStages(best)}
 }
 render();renderStages(-1);
 return {discover,award,quiz,badge,update,handleKey,get busy(){return !quizEl.hidden||!book.hidden}};
}
