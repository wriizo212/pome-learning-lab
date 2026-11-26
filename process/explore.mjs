import * as T from './three.module.min.js';
import {gestures} from './visitor-hands.mjs?v=shift5';
export function explore(view,canvas,camera,world,orbit,inspect,cutaway,zoom,arcade=false){
 const controls=document.createElement('div');controls.className='reactor-explore';
 controls.innerHTML='<label>Camera view <select><option value="orbit">Orbit model</option><option value="first">First person</option><option value="third">Third person</option></select></label> <button class="hand-start" aria-pressed="false">Start gesture camera</button> <button class="wide">Fullscreen</button> <button class="tags" aria-pressed="true">Task tags</button><div class="walkpad" hidden><button data-key="w" aria-label="Walk forward">↑</button><button data-key="a" aria-label="Step left">←</button><button data-key="s" aria-label="Walk backward">↓</button><button data-key="d" aria-label="Step right">→</button></div><details><summary>Movement &amp; gestures</summary><p>Walk with W A S D or the arrows above. Drag the scene to look around. With the camera on, move one finger off centre to look. Show an open palm to move forward and steer, lower your open palm to reverse, or make a fist to stop. Hold two fingers to change view, three to open or close the equipment, four to change worker, or aim your fingertip and pinch to inspect a unit.</p></details><span class="tracking" role="status"></span>';
 view.append(controls);const video=document.createElement('video');video.muted=true;video.playsInline=true;video.hidden=true;view.querySelector('.reactor-frame').append(video);
 const marker=document.createElement('span');marker.className='hand-aim';marker.hidden=true;marker.setAttribute('aria-hidden','true');view.querySelector('.reactor-frame').append(marker);
 // Live crew board: what every worker is doing right now.
 const board=document.createElement('ol');board.className='crew-board';board.setAttribute('aria-label','Crew on shift');controls.append(board);
 const rows=world.roles.map((r,i)=>{const li=document.createElement('li');li.dataset.crew=i;li.innerHTML='<i></i><b></b><span></span>';li.querySelector('b').textContent=r.name;board.append(li);return li});
 setInterval(()=>{if(document.hidden||!board.isConnected||!board.offsetParent)return;world.status().forEach((st,i)=>{const span=rows[i].querySelector('span');if(span.textContent!==st.label)span.textContent=st.label;rows[i].dataset.job=st.job})},400);
 const tagButton=controls.querySelector('.tags');tagButton.onclick=()=>{const on=tagButton.getAttribute('aria-pressed')!=='true';tagButton.setAttribute('aria-pressed',String(on));world.tags(on)};
 const picker=controls.querySelector('select'),pad=controls.querySelector('.walkpad'),keys=new Set();
 let player=world.roles[0].actor,pos=player.g.position;
 const label=document.createElement('label');label.textContent='Play as ';const role=document.createElement('select');world.roles.forEach((r,i)=>role.add(new Option(r.name,i)));label.append(role);picker.parentElement.after(label);
 role.onchange=()=>{player.g.visible=true;player=world.roles[Number(role.value)].actor;pos=player.g.position;heading=player.g.rotation.y;setMode(picker.value==='orbit'?'third':picker.value)};
 let heading=0,tilt=.03,forward=0,turn=0,vertical=0,walkTime=0;
 const obstacles=arcade?[[-7.6,-5.8,-3.4,-1.8],[.75,1.05,-3.75,-3.45],[4.9,5.1,-3.4,-3.2],[-5.98,-5.9,-2.25,-.05],[-2.53,.7,-3.25,.02],[.53,4.73,-1.63,.96],[1.59,4.57,-4.21,-2.04],[-4.54,-.67,1.67,3.44],[4.95,5.45,-.42,1.02]]:[[-5.83,-3.26,-.13,1.94],[-2.91,.1,-1.55,1.55],[.32,3.3,-.83,1.87],[-1.57,.76,-2.9,-1.47],[2,4.44,-2.68,-1.22],[3.8,5.68,-.23,1.65]];
 function allowed(x,z){return Math.abs(x)<(arcade?7.6:6.03)&&z>(arcade?-4.36:-3.02)&&z<(arcade?3.67:3.02)&&!obstacles.some(([a,b,c,d])=>x>a&&x<b&&z>c&&z<d)}
 function setMode(mode){if(picker.value==='orbit'||mode!=='orbit')heading=player.g.rotation.y;world.control(mode==='orbit'?null:player);picker.value=mode;pad.hidden=mode==='orbit';player.g.visible=mode!=='first';keys.clear();forward=turn=vertical=0;canvas.focus({preventScroll:true})}
 picker.onchange=()=>setMode(picker.value);
 const wide=controls.querySelector('.wide');wide.hidden=!document.fullscreenEnabled;wide.onclick=()=>{(document.fullscreenElement?document.exitFullscreen():view.requestFullscreen()).catch(()=>{})};
 canvas.addEventListener('keydown',e=>{if(picker.value!=='orbit'&&'wasd'.includes(e.key.toLowerCase())&&e.key.length===1){keys.add(e.key.toLowerCase());e.preventDefault()}});
 window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());canvas.addEventListener('blur',()=>keys.clear());
 for(const b of pad.querySelectorAll('button')){b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);keys.add(b.dataset.key)};b.onlostpointercapture=()=>keys.delete(b.dataset.key);b.onpointerup=b.onpointercancel=()=>keys.delete(b.dataset.key)}
 function look(dx,dy){heading-=dx;tilt=T.MathUtils.clamp(tilt-dy,-1.08,1.08)}
 const stop=gestures(controls.querySelector('.hand-start'),video,controls.querySelector('.tracking'),(cmd,x,y)=>{
  if(cmd==='aim'){marker.hidden=false;marker.style.left=(x*100)+'%';marker.style.top=(y*100)+'%';return}if(cmd==='hideAim'){marker.hidden=true;return}
  forward=turn=vertical=0;if(cmd==='clear')return;
  if(cmd==='role'){role.selectedIndex=(role.selectedIndex+1)%role.options.length;role.onchange();return}
  if(cmd==='view'){const modes=['orbit','first','third'];setMode(modes[(modes.indexOf(picker.value)+1)%3]);return}
  if(cmd==='cut'){cutaway();return}if(cmd==='inspect'){inspect(x,y);return}
  const dead=n=>Math.abs(n)<.1?0:Math.sign(n)*(Math.abs(n)-.1);
  turn=dead(x-.5)*2.6;vertical=dead(y-.5)*1.8;forward=cmd==='move'?(y>.72?-1:1):0;
 });
 const eye=new T.Vector3(),direction=new T.Vector3(),chase=new T.Vector3();
 function frame(dt){
  if(picker.value==='orbit'){orbit(turn*dt,vertical*dt);if(forward)zoom(-forward*dt*1.5);return false}
  look(turn*dt,vertical*dt);
  const f=Number(keys.has('w'))-Number(keys.has('s'))+forward,s=Number(keys.has('d'))-Number(keys.has('a'));
  const speed=dt*1.55/Math.max(1,Math.hypot(f,s));
  const dx=(-Math.sin(heading)*f+Math.cos(heading)*s)*speed,dz=(-Math.cos(heading)*f-Math.sin(heading)*s)*speed;
  if(allowed(pos.x+dx,pos.z))pos.x+=dx;if(allowed(pos.x,pos.z+dz))pos.z+=dz;
  walkTime+=dt;player.pose(walkTime,Math.min(1,Math.hypot(f,s)));player.g.rotation.y=heading;
  eye.copy(pos);eye.y+=.94;direction.set(-Math.sin(heading)*Math.cos(tilt),Math.sin(tilt),-Math.cos(heading)*Math.cos(tilt));
  camera.position.copy(eye);
  if(picker.value==='third'){chase.copy(direction).multiplyScalar(-1.74);chase.y=.72;for(let f=.1;f<=1.01;f+=.1){if(!allowed(eye.x+chase.x*f,eye.z+chase.z*f))break;camera.position.copy(eye).addScaledVector(chase,f)}}
  camera.lookAt(eye.addScaledVector(direction,2));return true;
 }
 return {frame,look,setMode,isWalking:()=>picker.value!=='orbit',stop:()=>{stop();keys.clear()}};
}
