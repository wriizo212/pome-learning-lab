import * as T from './three.module.min.js';
import {gestures} from './visitor-hands.mjs?v=shift10';

/*
 Walk the plant as one of the workers. Orbit, first-person and third-person views;
 smooth acceleration, sprint with stamina, jumping with gravity, pointer-lock mouse look,
 collisions with equipment and other workers, and an action API so a play layer can
 make the character use tools. Events: step, jump, land, mode, key, role-change.
*/
export function explore(view,canvas,camera,world,orbit,inspect,cutaway,zoom,arcade=false){
 const controls=document.createElement('div');controls.className='reactor-explore';
 controls.innerHTML='<label>Camera view <select><option value="orbit">Orbit model</option><option value="first">First person</option><option value="third">Third person</option></select></label> <button class="hand-start" aria-pressed="false">Start gesture camera</button> <button class="wide">Fullscreen</button> <button class="tags" aria-pressed="true">Task tags</button><div class="walkpad" hidden><button data-key="w" aria-label="Walk forward">↑</button><button data-key="a" aria-label="Step left">←</button><button data-key="s" aria-label="Walk backward">↓</button><button data-key="d" aria-label="Step right">→</button><button data-key="shift" class="run" aria-label="Run">Run</button><button data-key="jump" class="jump" aria-label="Jump">Jump</button></div><details><summary>Movement &amp; gestures</summary><p>Walk with W A S D or the arrow keys, hold Shift to run and press Space to jump. Click the scene to steer with the mouse (Esc releases it), or drag to look around. With the gesture camera on, move one finger off centre to look. Show an open palm to move forward and steer, lower your open palm to reverse, or make a fist to stop. Hold two fingers to change view, three to open or close the equipment, four to change worker, or aim your fingertip and pinch to inspect a unit.</p></details><span class="tracking" role="status"></span>';
 view.append(controls);const frameEl=view.querySelector('.reactor-frame');const video=document.createElement('video');video.muted=true;video.playsInline=true;video.hidden=true;frameEl.append(video);
 const marker=document.createElement('span');marker.className='hand-aim';marker.hidden=true;marker.setAttribute('aria-hidden','true');frameEl.append(marker);
 // Live crew board: what every worker is doing right now.
 const board=document.createElement('ol');board.className='crew-board';board.setAttribute('aria-label','Crew on shift');controls.append(board);
 const rows=world.roles.map((r,i)=>{const li=document.createElement('li');li.dataset.crew=i;li.innerHTML='<i></i><b></b><span></span>';li.querySelector('b').textContent=(r.person?r.person+' · ':'')+r.name;board.append(li);return li});
 setInterval(()=>{if(document.hidden||!board.isConnected||!board.offsetParent)return;world.status().forEach((st,i)=>{const span=rows[i].querySelector('span');if(span.textContent!==st.label)span.textContent=st.label;rows[i].dataset.job=st.job})},400);
 const tagButton=controls.querySelector('.tags');tagButton.onclick=()=>{const on=tagButton.getAttribute('aria-pressed')!=='true';tagButton.setAttribute('aria-pressed',String(on));world.tags(on)};
 const picker=controls.querySelector('select'),pad=controls.querySelector('.walkpad'),keys=new Set();
 let player=world.roles[0].actor,pos=player.g.position;
 const label=document.createElement('label');label.textContent='Play as ';const role=document.createElement('select');world.roles.forEach((r,i)=>role.add(new Option((r.person?r.person+' · ':'')+r.name,i)));label.append(role);picker.parentElement.after(label);
 const listeners={};const on=(name,fn)=>(listeners[name]||=[]).push(fn),emit=(name,...a)=>(listeners[name]||[]).forEach(fn=>fn(...a));
 role.onchange=()=>{emit('role-change',player);player.g.visible=true;player.g.position.y=.11;baseY=.11;player=world.roles[Number(role.value)].actor;pos=player.g.position;heading=bodyYaw=player.g.rotation.y;setMode(picker.value==='orbit'?'third':picker.value)};
 let heading=0,bodyYaw=0,tilt=.03,forward=0,turn=0,vertical=0,walkTime=0,stridePhase=0,lastStep=0,jumpY=0,vy=0,grounded=true,landing=0,stamina=1,action=null,held=null,jumpQueued=false;
 const vel=new T.Vector2(),baseFov=camera.fov,camPos=new T.Vector3(),camReady={v:false};
 let obstacles=arcade?[[-7.6,-5.8,-3.4,-1.8],[.75,1.05,-3.75,-3.45],[4.9,5.1,-3.4,-3.2],[-5.98,-5.9,-2.25,-.05],[-2.53,.7,-3.25,.02],[.53,4.73,-1.63,.96],[1.59,4.57,-4.21,-2.04],[-4.54,-.67,1.67,3.44],[4.95,5.45,-.42,1.02],
  [-7.62,-6.78,.05,2.1],[-7.65,-6.75,-1.95,-.7],[6.35,7.55,-1.05,-.05],[6.3,7.7,1.9,2.9],[4.62,5.08,-2.45,-2.15]]
  :[[-5.83,-3.26,-.13,1.94],[-2.91,.1,-1.55,1.55],[.32,3.3,-.83,1.87],[-1.57,.76,-2.9,-1.47],[2,4.44,-2.68,-1.22],[3.8,5.68,-.23,1.65]];
 let extraBlock=()=>false,bounds=arcade?{x:7.6,z0:-4.36,z1:3.67}:{x:6.03,z0:-3.02,z1:3.02},ground=()=>.11,baseY=.11;
 function solid(x,z){return !(Math.abs(x)<bounds.x&&z>bounds.z0&&z<bounds.z1)||obstacles.some(([a,b,c,d])=>x>a&&x<b&&z>c&&z<d)}
 function workerAt(x,z){return world.roles.some(r=>r.actor!==player&&Math.hypot(r.actor.g.position.x-x,r.actor.g.position.z-z)<.34)}
 function allowed(x,z){return !solid(x,z)&&!workerAt(x,z)&&!extraBlock(x,z)}
 function setMode(mode){
  if(picker.value==='orbit'||mode!=='orbit')heading=bodyYaw=player.g.rotation.y;
  world.control(mode==='orbit'?null:player);world.setPlayer?.(mode==='orbit'?null:pos);picker.value=mode;pad.hidden=mode==='orbit';player.g.visible=mode!=='first';
  keys.clear();forward=turn=vertical=0;vel.set(0,0);action=null;camReady.v=false;if(mode==='orbit'){camera.fov=baseFov;camera.updateProjectionMatrix();if(document.pointerLockElement===canvas)document.exitPointerLock()}
  canvas.focus({preventScroll:true});emit('mode',mode);
 }
 picker.onchange=()=>setMode(picker.value);
 const wide=controls.querySelector('.wide');wide.hidden=!document.fullscreenEnabled;wide.onclick=()=>{(document.fullscreenElement?document.exitFullscreen():view.requestFullscreen()).catch(()=>{})};
 const codeKey={KeyW:'w',ArrowUp:'w',KeyS:'s',ArrowDown:'s',KeyA:'a',ArrowLeft:'a',KeyD:'d',ArrowRight:'d',ShiftLeft:'shift',ShiftRight:'shift'};
 canvas.addEventListener('keydown',e=>{if(picker.value==='orbit')return;const k=codeKey[e.code];
  if(k){keys.add(k);e.preventDefault();return}
  if(e.code==='Space'){if(!e.repeat)jumpQueued=true;e.preventDefault();return}
  if(!e.repeat&&/^(KeyE|KeyF|KeyQ|KeyR|Digit[1-5])$/.test(e.code)){emit('key',e.code);e.preventDefault()}});
 window.addEventListener('keyup',e=>{const k=codeKey[e.code];if(k)keys.delete(k)});window.addEventListener('blur',()=>keys.clear());canvas.addEventListener('blur',()=>keys.clear());
 for(const b of pad.querySelectorAll('button')){const k=b.dataset.key;b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);if(k==='jump')jumpQueued=true;else keys.add(k)};b.onlostpointercapture=()=>keys.delete(k);b.onpointerup=b.onpointercancel=()=>keys.delete(k)}
 function look(dx,dy){heading-=dx;tilt=T.MathUtils.clamp(tilt-dy,-1.08,1.08)}
 // Pointer lock: click the scene while walking to steer with the mouse.
 canvas.addEventListener('click',()=>{if(picker.value!=='orbit'&&document.pointerLockElement!==canvas&&canvas.requestPointerLock&&!matchMedia('(pointer:coarse)').matches){try{canvas.requestPointerLock()?.catch?.(()=>{})}catch{}}});
 document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas&&picker.value!=='orbit')look(e.movementX*.0024,e.movementY*.002)});
 document.addEventListener('pointerlockchange',()=>{frameEl.classList.toggle('locked',document.pointerLockElement===canvas)});
 const stop=gestures(controls.querySelector('.hand-start'),video,controls.querySelector('.tracking'),(cmd,x,y)=>{
  if(cmd==='aim'){marker.hidden=false;marker.style.left=(x*100)+'%';marker.style.top=(y*100)+'%';return}if(cmd==='hideAim'){marker.hidden=true;return}
  forward=turn=vertical=0;if(cmd==='clear')return;
  if(cmd==='role'){role.selectedIndex=(role.selectedIndex+1)%role.options.length;role.onchange();return}
  if(cmd==='view'){const modes=['orbit','first','third'];setMode(modes[(modes.indexOf(picker.value)+1)%3]);return}
  if(cmd==='cut'){cutaway();return}if(cmd==='inspect'){inspect(x,y);return}
  const dead=n=>Math.abs(n)<.1?0:Math.sign(n)*(Math.abs(n)-.1);
  turn=dead(x-.5)*2.6;vertical=dead(y-.5)*1.8;forward=cmd==='move'?(y>.72?-1:1):0;
 });
 const eye=new T.Vector3(),direction=new T.Vector3(),chase=new T.Vector3(),want=new T.Vector3(),right=new T.Vector3();
 const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
 const longTools=new Set(['rake','shovel','dipper']);
 function frame(dt){
  if(picker.value==='orbit'){orbit(turn*dt,vertical*dt);if(forward)zoom(-forward*dt*1.5);return false}
  look(turn*dt,vertical*dt);
  let f=Number(keys.has('w'))-Number(keys.has('s'))+forward,s=Number(keys.has('d'))-Number(keys.has('a'));
  if(action){f=s=0}
  const len=Math.hypot(f,s),sprint=keys.has('shift')&&f>0&&stamina>.04&&grounded,top=(sprint?3.15:1.5)*(f<0&&!s?.7:1);
  const ix=len?(-Math.sin(heading)*f+Math.cos(heading)*s)/len:0,iz=len?(-Math.cos(heading)*f-Math.sin(heading)*s)/len:0;
  const k=1-Math.exp(-dt*(grounded?(len?9:12):1.5));vel.x+=(ix*top-vel.x)*k;vel.y+=(iz*top-vel.y)*k;
  const ox=pos.x,oz=pos.z,dx=vel.x*dt,dz=vel.y*dt;
  if(allowed(pos.x+dx,pos.z))pos.x+=dx;else vel.x*=.2;if(allowed(pos.x,pos.z+dz))pos.z+=dz;else vel.y*=.2;
  const moved=Math.hypot(pos.x-ox,pos.z-oz),speed=moved/Math.max(dt,1e-4);
  stamina=Math.max(0,Math.min(1,stamina+(sprint&&speed>.5?-dt*.2:dt*(speed>.5?.1:.18))));
  // Body faces where you move in third person; in first person it follows the camera.
  if(picker.value==='first')bodyYaw=heading;else if(speed>.15)bodyYaw+=wrap(Math.atan2(-vel.x,-vel.y)-bodyYaw)*(1-Math.exp(-dt*11));
  // Jumping.
  if(jumpQueued&&grounded&&!action){vy=3.7;grounded=false;emit('jump')}jumpQueued=false;
  if(!grounded){vy-=11.5*dt;jumpY+=vy*dt;if(jumpY<=0){jumpY=0;emit('land',-vy);grounded=true;landing=Math.min(1,-vy/5)}}
  landing=Math.max(0,landing-dt*4);
  const run=speed>2.2;stridePhase+=moved/(run?1.15:.72)*Math.PI*2;
  if(grounded&&moved>1e-4&&Math.floor(stridePhase/Math.PI)!==lastStep){lastStep=Math.floor(stridePhase/Math.PI);emit('step',{run,x:pos.x,z:pos.z})}
  walkTime+=dt;
  const carry=held&&!longTools.has(held)?held:null,tool=held&&longTools.has(held)?held:null;
  if(action){action.t+=dt;player.pose(walkTime,0,action.job,action.t,{carry});if(action.t>=action.dur){const done=action.done;action=null;done?.()}}
  else if(!grounded)player.pose(walkTime,0,'air',walkTime,{vy,carry});
  else player.pose(walkTime,moved>1e-4?Math.min(1,speed/1.5):0,'',walkTime,{phase:stridePhase,run,landing,carry,tool});
  // Ground height can change (platform to yard); step smoothly between levels.
  baseY+=(ground(pos.x,pos.z)-baseY)*(1-Math.exp(-dt*12));
  player.heading=bodyYaw;player.g.rotation.y=bodyYaw;pos.y=baseY+jumpY;world.setPlayer?.(pos);
  // Camera: head-bob in first person, smooth over-the-shoulder follow in third person.
  const bob=grounded&&moved>1e-4?Math.sin(stridePhase*2)*(run?.03:.015):0;
  eye.copy(pos);eye.y+=.83+bob-landing*.06;direction.set(-Math.sin(heading)*Math.cos(tilt),Math.sin(tilt),-Math.cos(heading)*Math.cos(tilt));
  if(picker.value==='third'){
   right.set(Math.cos(heading),0,-Math.sin(heading));want.copy(eye).addScaledVector(right,.32);want.y+=.12;
   chase.copy(direction).multiplyScalar(-2.15);chase.y=.55+Math.max(0,-tilt)*.4;let reach=1;for(let g=.1;g<=1.01;g+=.1){if(solid(want.x+chase.x*g,want.z+chase.z*g)){reach=Math.max(.15,g-.1);break}}
   want.addScaledVector(chase,reach);if(!camReady.v){camPos.copy(want);camReady.v=true}camPos.lerp(want,1-Math.exp(-dt*14));camera.position.copy(camPos);
   camera.lookAt(eye.x+direction.x*2+right.x*.32,eye.y+direction.y*2+.1,eye.z+direction.z*2+right.z*.32);
  }else{camera.position.copy(eye);camera.lookAt(eye.addScaledVector(direction,2))}
  const fov=baseFov+(run?7:0)+(picker.value==='first'?8:3);if(Math.abs(camera.fov-fov)>.05){camera.fov+=(fov-camera.fov)*(1-Math.exp(-dt*6));camera.updateProjectionMatrix()}
  return true;
 }
 return {frame,look,setMode,on,isWalking:()=>picker.value!=='orbit',mode:()=>picker.value,stop:()=>{stop();keys.clear()},
  get player(){return player},get position(){return pos},get heading(){return bodyYaw},get viewHeading(){return heading},get stamina(){return stamina},
  act(job,dur,done){if(action)return false;action={job,dur,t:0,done};vel.set(0,0);return true},busy:()=>!!action,
  setHeld(name){held=name},
  // A scene can widen the walkable area, add obstacles and give the ground a height.
  configure(o){if(o.bounds)bounds=o.bounds;if(o.obstacles)obstacles=o.obstacles;if(o.ground)ground=o.ground},get held(){return held},blockWith(fn){extraBlock=fn},controls,
  roleIndex:()=>Number(role.value),selectRole(i){role.value=String(i);role.onchange()},
  faceTowards(x,z){bodyYaw=Math.atan2(-(x-pos.x),-(z-pos.z));if(picker.value==='first')heading=bodyYaw}};
}
