import * as T from './three.module.min.js';

const panel=document.querySelector('.stage'), diagram=panel.querySelector('svg');
const view=document.createElement('section');
view.className='reactor-view';
view.innerHTML='<div class="reactor-frame"><canvas tabindex="0" aria-label="UASB reactor cutaway and aerobic basin. Drag to orbit or use arrow keys."></canvas><span class="reactor-caption">UASB section · aerobic basin</span></div><div class="reactor-controls"><label>Inspect <select aria-label="Inspect treatment stage"><option value="">Plant overview</option></select></label><button data-command="section" aria-pressed="true">Cutaway</button><button data-command="motion">Pause flow</button><button data-command="out" aria-label="Zoom out">−</button><button data-command="in" aria-label="Zoom in">+</button><button data-command="home">Reset view</button></div>';
diagram.before(view);
const canvas=view.querySelector('canvas'), select=view.querySelector('select'), toggle=view.querySelector('[data-command=section]'), motion=view.querySelector('[data-command=motion]');
const units=[...diagram.querySelectorAll('[data-stage]')];
units.forEach((u,i)=>select.add(new Option(u.getAttribute('aria-label'),i)));
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'})}catch{view.remove()}
if(renderer) build();
function build(){
 const scene=new T.Scene(), camera=new T.PerspectiveCamera(37,1,.1,110);
 scene.background=new T.Color(0x203535);scene.fog=new T.FogExp2(0x203535,.028);
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;
 scene.add(new T.HemisphereLight(0xf1f6ff,0x999176,2.2));
 const sun=new T.DirectionalLight(0xffe0ad,3.2);sun.position.set(-6,11,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
 Object.assign(sun.shadow.camera,{left:-10,right:10,top:9,bottom:-9});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.012;scene.add(sun);
 const rim=new T.DirectionalLight(0x9adbe9,2);rim.position.set(5,4,-8);scene.add(rim);
 let seed=47;const rand=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
 function finish(base,metal,rough,grain){
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
  ctx.fillStyle=base;ctx.fillRect(0,0,256,256);
  for(let i=0;i<8500;i++){ctx.fillStyle=rand()>.48?'rgba(245,244,220,.13)':'rgba(37,29,21,.16)';ctx.fillRect(rand()*256,rand()*256,grain?1+rand()*22:1+rand()*3,grain?.65:1.6)}
  const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(2,2);tex.colorSpace=T.SRGBColorSpace;
  return new T.MeshStandardMaterial({map:tex,bumpMap:tex,bumpScale:grain?.012:.04,metalness:metal,roughness:rough,side:T.DoubleSide});
 }
 const steel=finish('#adbcbe',.65,.36,true), shell=finish('#65958b',.53,.4,true), cement=finish('#b4aea0',.04,.86), base=finish('#53615d',.1,.8), sludge=finish('#614437',0,.98), brass=finish('#d99a45',.42,.45,true);
 const color=(c,m=0,r=.55)=>new T.MeshStandardMaterial({color:c,metalness:m,roughness:r,side:T.DoubleSide});
 const dark=color(0x263c40,.45), teal=color(0x429997,.33), water=color(0x498f84,.25,.19), foam=color(0xacddd2,.08,.23), amber=color(0xeebb65,.2), brown=color(0x88694c);
 let group=scene;
 const pickables=[], dynamic=[], solids=[];
 const groups=units.map((u,i)=>{const g=new T.Group();g.userData.id=i;scene.add(g);return g});
 const v=(x,y,z)=>new T.Vector3(x,y,z);
 function mesh(geo,material,x,y,z){const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;group.add(m);if(group!==scene)pickables.push(m);return m}
 const cube=new T.BoxGeometry(1,1,1);
 function box(x,y,z,w,h,d,mat){const m=mesh(cube,mat,x,y,z);m.scale.set(w,h,d);return m}
 function cyl(x,y,z,r,h,mat,r2=r){return mesh(new T.CylinderGeometry(r,r2,h,48),mat,x,y,z)}
 function pipe(a,b,r,mat){const start=v(...a),end=v(...b),dir=end.clone().sub(start);const m=mesh(new T.CylinderGeometry(r,r,dir.length(),12),mat,...start.lerp(end,.5).toArray());m.quaternion.setFromUnitVectors(v(0,1,0),dir.normalize());return m}
 function run(points,r,mat){points.slice(1).forEach((p,i)=>pipe(points[i],p,r,mat))}
 function tank(x,z,w,d,h,liquid){box(x,.16,z,w,.32,d,cement);for(const s of [-1,1]){box(x+s*w/2,h/2,z,.1,h,d,cement);box(x,h/2,z+s*d/2,w,h,.1,cement)}box(x,h-.13,z,w-.1,.07,d-.1,liquid)}
 function label(text,x,y,z,w){
  const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#172d2b';ctx.fillRect(0,0,512,96);ctx.fillStyle='#e3ead9';ctx.font='bold 45px Arial';ctx.textAlign='center';ctx.fillText(text,256,64);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
  const sprite=new T.Sprite(new T.SpriteMaterial({map:tex}));sprite.position.set(x,y,z);sprite.scale.set(w,w*96/512,1);group.add(sprite);
 }
 function route(points,mat,r){run(points,r,mat);const path=new T.CurvePath();points.slice(1).forEach((p,i)=>path.add(new T.LineCurve3(v(...points[i]),v(...p))));const marker=mesh(new T.SphereGeometry(r*1.3,12,8),foam,...points[0]);dynamic.push(t=>marker.position.copy(path.getPoint((t*.16)%1)))}
 box(0,-.41,0,200,.24,200,base);box(0,-.12,0,12.4,.42,6.5,cement);box(0,.08,2.94,12,.03,.12,brass);
 group=groups[0];tank(-4.55,.9,2.2,1.7,1,brown);for(let i=0;i<14;i++)box(-5.38+i*.13,1.02,.68,.04,.09,1.02,steel).rotation.x=-.17;
 label('INLET',-4.55,1.5,1,1.3);
 group=groups[1];const x=-1.4;
 cyl(x,.22,0,1.52,.3,cement);
 const start=Math.PI*.45,arc=Math.PI*1.26;
 function jacket(y,r,h,angle,sweep,mat){return mesh(new T.CylinderGeometry(r,r,h,80,1,true,angle,sweep),mat,x,y,0)}
 jacket(2.01,1.25,3.45,start,arc,shell);
 const closed=jacket(2.01,1.25,3.45,start+arc,2*Math.PI-arc,shell);solids.push(closed);
 for(const y of [.43,1.5,2.6,3.68]){jacket(y,1.28,.065,start,arc,steel);solids.push(jacket(y,1.28,.065,start+arc,2*Math.PI-arc,steel))}
 cyl(x,3.85,0,.43,.35,shell,1.27);cyl(x,4.08,0,.44,.12,steel);
 cyl(x,.65,0,1.19,.49,sludge);const grain=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),sludge,360);const transform=new T.Object3D();
 for(let i=0;i<360;i++){const a=rand()*6.28,r=Math.sqrt(rand())*1.12;transform.position.set(x+r*Math.cos(a),.86+rand()*.19,r*Math.sin(a));transform.scale.setScalar(.048+rand()*.06);transform.updateMatrix();grain.setMatrixAt(i,transform.matrix)}group.add(grain);
 for(const offset of [-.55,0,.55]){const hood=cyl(x+offset,2.82,.05,.1,.46,steel,.33);hood.scale.z=2;pipe([x+offset,3.06,.05],[x+offset,3.35,.05],.06,brass)}
 for(const s of [-1,1])pipe([x-1.27,.4,.24+s*.17],[x-1.27,3.97,.24+s*.17],.031,steel);
 for(let i=0;i<15;i++)pipe([x-1.27,.49+i*.23,.07],[x-1.27,.49+i*.23,.41],.026,brass);
 label('UASB',x,4.56,0,1.5);
 group=groups[2];tank(1.8,.5,2.65,2.3,1.05,water);
 for(const z of [-.42,.46,1.35]){pipe([.64,1.07,z],[2.95,1.07,z],.042,steel);for(let j=0;j<6;j++)cyl(.85+j*.36,1.04,z,.095,.055,dark)}
 for(const xx of [.51,3.09]){for(const z of [-.7,.5,1.7])pipe([xx,1.05,z],[xx,1.52,z],.027,brass);pipe([xx,1.51,-.7],[xx,1.51,1.7],.027,brass)}
 label('AERATION',1.8,2.12,.5,1.85);
 group=groups[3];box(-.4,.52,-2.18,1.86,.92,.94,dark);for(let j=0;j<13;j++)box(-1.19+j*.13,.58,-1.69,.057,.52,.045,steel);
 route([[x,4.16,0],[x,4.16,-1.55],[-.46,4.16,-1.55],[-.46,.96,-1.55],[-.46,.96,-2.18]],brass,.077);
 group=groups[4];tank(3.2,-1.95,2,1.03,.58,sludge);run([[2.95,.5,-.5],[3.1,.5,-.98],[3.1,.7,-1.95]],.07,dark);
 group=groups[5];cyl(4.75,.58,.7,.74,1,cement);cyl(4.75,1.1,.7,.66,.04,water);route([[3.16,.74,.5],[3.96,.74,.5],[3.96,1.18,.5],[4.49,1.18,.5]],teal,.095);
 group=groups[0];route([[-3.44,.57,.91],[-2.82,.57,.91],[x,.57,.91],[x,.57,.48]],teal,.085);
 group=groups[1];route([[x+1.17,3.35,0],[.2,3.35,0],[.2,1.18,0],[.78,1.18,0]],teal,.105);
 const particles=new T.InstancedMesh(new T.SphereGeometry(1,8,5),foam,140);scene.add(particles);
 const drops=Array.from({length:140},(_,i)=>({rx:rand(),rz:rand(),phase:rand(),speed:.19+rand()*.15,reactor:i<54}));
 dynamic.push(t=>{drops.forEach((p,i)=>{const f=(p.phase+t*p.speed)%1;transform.position.set(p.reactor?x+(p.rx-.5)*1.38:.62+p.rx*2.35,p.reactor?1.08+f*1.5:.94+f*.27,p.reactor?.45+p.rz*.41:-.44+p.rz*1.9);transform.scale.setScalar(.017+.022*Math.sin(Math.PI*f));transform.updateMatrix();particles.setMatrixAt(i,transform.matrix)});particles.instanceMatrix.needsUpdate=true});
 const targets=[[-4.55,.85,.9],[x,1.96,0],[1.8,.91,.5],[-.4,.7,-2.18],[3.2,.55,-1.95],[4.75,.76,.7]];
 let yaw=.18,pitch=.45,dist=14,goal=v(0,1.25,0),focus=goal.clone(),cut=true,paused=matchMedia('(prefers-reduced-motion:reduce)').matches,drag=null,vis=false,last=0,t=0;
 const ray=new T.Raycaster();
 function home(){select.value='';goal.set(0,1.25,0);dist=14;yaw=.18;pitch=.45}
 function inspect(i){if(i===''){home();return}select.value=String(i);goal.set(...targets[i]);dist=i===1?7.2:6;units[i].dispatchEvent(new Event('click'))}
 select.onchange=()=>inspect(select.value===''?'':Number(select.value));
 function zoom(delta){dist=T.MathUtils.clamp(dist+delta,3.4,24)}
 function updateMotion(){motion.textContent=paused?'Resume flow':'Pause flow'}
 updateMotion();view.querySelector('.reactor-controls').onclick=e=>{switch(e.target.dataset.command){case 'home':home();break;case 'in':zoom(-1);break;case 'out':zoom(1);break;case 'motion':paused=!paused;updateMotion();break;case 'section':cut=!cut;solids.forEach(m=>m.visible=!cut);toggle.setAttribute('aria-pressed',String(cut));break}};
 solids.forEach(m=>m.visible=false);
 canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,moved:0}};
 canvas.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved+=Math.abs(dx)+Math.abs(dy);yaw-=dx*.009;pitch=T.MathUtils.clamp(pitch+dy*.007,.11,1.4);drag.x=e.clientX;drag.y=e.clientY};
 canvas.onpointercancel=()=>drag=null;canvas.onpointerup=e=>{if(drag&&drag.moved<6){const r=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),camera);const hit=ray.intersectObjects(pickables,false).find(h=>h.object.visible);if(hit)inspect(hit.object.parent.userData.id)}drag=null};
 canvas.onwheel=e=>{e.preventDefault();zoom(Math.sign(e.deltaY)*.6)};
 canvas.onkeydown=e=>{const actions={ArrowLeft:()=>yaw-=.13,ArrowRight:()=>yaw+=.13,ArrowUp:()=>pitch=Math.min(1.4,pitch+.1),ArrowDown:()=>pitch=Math.max(.11,pitch-.1),'+':()=>zoom(-1),'-':()=>zoom(1),Home:home};if(actions[e.key]){e.preventDefault();actions[e.key]()}};
 function sync(){const active=document.querySelector('[data-option="1"]').classList.contains('active');view.hidden=!active;diagram.style.display=active?'none':''}
 new MutationObserver(sync).observe(document.querySelector('[data-option="1"]'),{attributes:true,attributeFilter:['class']});sync();
 new IntersectionObserver(es=>{vis=es[0].isIntersecting}).observe(canvas);
 let w=0,h=0;
 function frame(now){requestAnimationFrame(frame);const dt=Math.min(.07,(now-last)/1000);last=now;if(!vis||view.hidden||document.hidden)return;
 const width=canvas.clientWidth,height=canvas.clientHeight;if(!width||!height)return;if(w!==width||h!==height){w=width;h=height;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
 if(!paused)t+=dt;dynamic.forEach(fn=>fn(t));focus.lerp(goal,1-Math.exp(-dt*9));const d=dist*Math.max(1,1.52/camera.aspect);
 camera.position.set(focus.x+d*Math.cos(pitch)*Math.sin(yaw),focus.y+d*Math.sin(pitch),focus.z+d*Math.cos(pitch)*Math.cos(yaw));camera.lookAt(focus);renderer.render(scene,camera)}
 canvas.addEventListener('webglcontextlost',()=>{view.remove();diagram.style.display='';panel.classList.add('reactor-fallback');vis=false});requestAnimationFrame(frame);
}
