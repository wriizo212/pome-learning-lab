import {frameBudget} from './frame-budget.mjs?v=shift11';
import {TIERS,resolveTier,savedChoice,saveChoice,lower} from './quality.mjs?v=shift11';
import {windify,concrete,texture,environment,premiumSurfaces,contactShadow} from './life.mjs?v=shift11';
import {reactorScenery} from './reactor-scenery.mjs?v=shift11';
import {hdZoom,hardware} from './hd.mjs?v=shift11';
import {reactorPlay} from './play.mjs?v=shift11';
import * as T from './three.module.min.js';

import {batchStations} from './batch.mjs';
import {populate} from './crew.mjs?v=shift11';
import {explore} from './explore.mjs?v=shift11';
import {reactorProcess} from './reactor-flows.mjs?v=shift11';
import {legend} from './molecules.mjs?v=shift11';
const panel=document.querySelector('.stage'), diagram=panel.querySelector('svg');
const view=document.createElement('section');
view.className='reactor-view';
view.innerHTML='<div class="reactor-frame"><canvas tabindex="0" aria-label="UASB reactor cutaway and aerobic basin. Drag to orbit or use arrow keys."></canvas><span class="reactor-caption">UASB section · aerobic basin</span></div><div class="reactor-controls"><label>Inspect <select aria-label="Inspect treatment stage"><option value="">Plant overview</option></select></label><button data-command="section" aria-pressed="true">Cutaway</button><button data-command="motion">Pause flow</button><button data-command="molecules" aria-pressed="true">Molecules</button><button data-command="out" aria-label="Zoom out">−</button><button data-command="in" aria-label="Zoom in">+</button><button data-command="home">Reset view</button><label class="quality">Quality <select data-quality aria-label="Rendering quality"><option value="auto">Auto</option><option value="high">High</option><option value="balanced">Balanced</option><option value="lite">Lite</option></select></label></div>';
diagram.before(view);
const canvas=view.querySelector('canvas'), select=view.querySelector('select'), toggle=view.querySelector('[data-command=section]'), motion=view.querySelector('[data-command=motion]');
const units=[...diagram.querySelectorAll('[data-stage]')];
units.forEach((u,i)=>select.add(new Option(u.getAttribute('aria-label'),i)));
let renderer,tierName=resolveTier(),tier=TIERS[tierName];
try{renderer=new T.WebGLRenderer({canvas,antialias:tierName!=='lite',powerPreference:'high-performance'})}catch{view.remove()}
if(renderer) build();
function build(){
 const scene=new T.Scene(), camera=new T.PerspectiveCamera(37,1,.1,170);
 scene.background=new T.Color(0x203535);scene.fog=new T.FogExp2(0x203535,.028);
 renderer.shadowMap.enabled=tier.shadows;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;
 scene.add(new T.HemisphereLight(0xe4f0ff,0x8f8a6c,2.0));
 const sun=new T.DirectionalLight(0xffe3b5,3.4);sun.position.set(-6,11,8);sun.castShadow=true;sun.shadow.mapSize.set(tier.shadowSize,tier.shadowSize);
 Object.assign(sun.shadow.camera,{left:-12.5,right:12.5,top:10,bottom:-10,near:.5,far:40});sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.012;scene.add(sun);
 const rim=new T.DirectionalLight(0x9adbe9,2);rim.position.set(5,4,-8);scene.add(rim);
 let seed=47;const rand=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
 function finish(base,metal,rough,grain){
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
  ctx.fillStyle=base;ctx.fillRect(0,0,256,256);
  for(let i=0;i<8500;i++){ctx.fillStyle=rand()>.48?'rgba(245,244,220,.13)':'rgba(37,29,21,.16)';ctx.fillRect(rand()*256,rand()*256,grain?1+rand()*22:1+rand()*3,grain?.65:1.6)}
  if(grain){
   for(let i=0;i<45;i++){const x=rand()*256,y=rand()*256;ctx.fillStyle='rgba(39,48,41,.17)';ctx.fillRect(x,y,rand()*9+.4,.7)}
   ctx.fillStyle='rgba(40,43,39,.22)';ctx.fillRect(0,251,256,2);
   for(const x of [8,120,246]){ctx.fillStyle='#515c56';ctx.fillRect(x,245,3,3);ctx.fillStyle='#d4dcd2';ctx.fillRect(x,245,2,1)}
  }else{for(let k=0;k<20;k++){const px=rand()*256,py=rand()*256;const g=ctx.createRadialGradient(px,py,0,px,py,22);g.addColorStop(0,'rgba(58,50,30,.10)');g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(px-22,py-22,44,44)}}
  const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(2,2);tex.colorSpace=T.SRGBColorSpace;
  return new T.MeshStandardMaterial({map:tex,bumpMap:tex,bumpScale:grain?.012:.04,metalness:metal,roughness:rough,side:T.DoubleSide});
 }
 const cementTex=texture(concrete(tier.texture,{base:'#b4aea0'}),{repeat:[1.5,1.5]});
 const steel=finish('#adbcbe',.65,.36,true), shell=finish('#65958b',.53,.4,true), cement=new T.MeshStandardMaterial({map:cementTex,bumpMap:cementTex,bumpScale:.025,roughness:.88,metalness:.03,side:T.DoubleSide}), base=finish('#53615d',.1,.8), sludge=finish('#614437',0,.98), brass=finish('#d99a45',.42,.45,true);
 const color=(c,m=0,r=.55)=>new T.MeshStandardMaterial({color:c,metalness:m,roughness:r,side:T.DoubleSide});
 const dark=color(0x263c40,.45), teal=color(0x429997,.33), water=color(0x498f84,.25,.19), foam=color(0xacddd2,.08,.23), amber=color(0xeebb65,.2), brown=color(0x88694c);
 let group=scene;
 const pickables=[], dynamic=[], solids=[], movers=new Set();
 const groups=units.map((u,i)=>{const g=new T.Group();g.userData.id=i;scene.add(g);return g});
 const v=(x,y,z)=>new T.Vector3(x,y,z);
 function mesh(geo,material,x,y,z){const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;group.add(m);if(group!==scene)pickables.push(m);return m}
 const cube=new T.BoxGeometry(1,1,1);
 function box(x,y,z,w,h,d,mat){const m=mesh(cube,mat,x,y,z);m.scale.set(w,h,d);return m}
 function cyl(x,y,z,r,h,mat,r2=r){return mesh(new T.CylinderGeometry(r,r2,h,48),mat,x,y,z)}
 const pipeSegs=[];
 function pipe(a,b,r,mat){pipeSegs.push([a,b,r]);const start=v(...a),end=v(...b),dir=end.clone().sub(start);const m=mesh(new T.CylinderGeometry(r,r,dir.length(),12),mat,...start.lerp(end,.5).toArray());m.quaternion.setFromUnitVectors(v(0,1,0),dir.normalize());return m}
 function run(points,r,mat){points.slice(1).forEach((p,i)=>pipe(points[i],p,r,mat))}
 function tank(x,z,w,d,h,liquid){box(x,.16,z,w,.32,d,cement);for(const s of [-1,1]){box(x+s*w/2,h/2,z,.1,h,d,cement);const wall=box(x,h/2,z+s*d/2,w,h,.1,cement);if(s===1)solids.push(wall)}solids.push(box(x,h-.13,z,w-.1,.07,d-.1,liquid));box(x,.34,z,w-.14,.1,d-.14,liquid)}
 function label(text,x,y,z,w){
  const c=document.createElement('canvas');c.width=1024;c.height=192;const ctx=c.getContext('2d');ctx.scale(2,2);ctx.fillStyle='#172d2b';ctx.fillRect(0,0,512,96);ctx.fillStyle='#e3ead9';ctx.font='bold 45px Arial';ctx.textAlign='center';ctx.fillText(text,256,64);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
  const sprite=new T.Sprite(new T.SpriteMaterial({map:tex}));sprite.position.set(x,y,z);sprite.scale.set(w,w*96/512,1);sprite.userData.info=text.toLowerCase();group.add(sprite);
 }
 // Pipe runs carry several glowing parcels tinted by what flows inside them.
 const parcels=[];
 function stream(points,r,tint,n){const path=new T.CurvePath();points.slice(1).forEach((p,i)=>path.add(new T.LineCurve3(v(...points[i]),v(...p))));n??=Math.max(4,Math.round(path.getLength()*1.6));for(let k=0;k<n;k++)parcels.push({path,r:r*1.32,tint:new T.Color(tint),k:k/n,speed:.5/Math.max(1,path.getLength())})}
 function route(points,mat,r,tint=0xacddd2){run(points,r,mat);stream(points,r,tint)}
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
 group=groups[3];box(-.4,.14,-2.18,1.86,.18,.94,dark);box(-.4,.54,-2.63,1.86,.83,.07,shell);solids.push(box(-.4,.98,-2.18,1.86,.08,.94,shell),box(-.4,.55,-1.73,1.86,.82,.07,shell));for(let j=0;j<13;j++)solids.push(box(-1.19+j*.13,.58,-1.67,.057,.52,.045,steel));
 const axle=pipe([-1.14,.48,-2.16],[.31,.48,-2.16],.08,steel);for(let j=0;j<4;j++){cyl(-1+j*.2,.55,-2.2,.105,.43,teal);cyl(-1+j*.2,.79,-2.2,.113,.06,steel)}
 const rotor=cyl(.1,.5,-2.19,.25,.46,brass);rotor.rotation.z=Math.PI/2;for(let j=0;j<8;j++){const a=j*Math.PI/4;pipe([-.14,.50+Math.cos(a)*.24,-2.19+Math.sin(a)*.24],[.32,.50+Math.cos(a)*.24,-2.19+Math.sin(a)*.24],.024,dark)}
 movers.add(rotor);movers.add(axle);dynamic.push(t=>{rotor.rotation.x=t*2;axle.rotation.x=t*2});
 route([[x,4.16,0],[x,4.16,-1.55],[-.46,4.16,-1.55],[-.46,.96,-1.55],[-.46,.96,-2.18]],brass,.077,0xffc94a);label('BIOGAS ENGINE',-.4,1.62,-2.18,1.9);
 group=groups[4];tank(3.2,-1.95,2,1.03,.58,sludge);label('DRYING BED',3.2,1.1,-1.95,1.6);run([[2.95,.5,-.5],[3.1,.5,-.98],[3.1,.7,-1.95]],.07,dark);
 group=groups[5];mesh(new T.CylinderGeometry(.74,.74,1,60,1,true,start,arc),cement,4.75,.58,.7);solids.push(mesh(new T.CylinderGeometry(.74,.74,1,60,1,true,start+arc,2*Math.PI-arc),cement,4.75,.58,.7),cyl(4.75,1.1,.7,.66,.04,water));cyl(4.75,.22,.7,.69,.16,water);pipe([4.74,.39,.7],[4.74,.94,.7],.085,teal);for(let j=0;j<6;j++)cyl(4.74,.43+j*.074,.7,.12,.026,steel);route([[3.16,.74,.5],[3.96,.74,.5],[3.96,1.18,.5],[4.49,1.18,.5]],teal,.095,0x9fe3d6);label('OUTLET',4.75,1.7,.7,1.1);
 group=groups[0];route([[-3.44,.57,.91],[-2.82,.57,.91],[x,.57,.91],[x,.57,.48]],teal,.085,0x9a6a38);
 group=groups[1];route([[x+1.17,3.35,0],[.2,3.35,0],[.2,1.18,0],[.78,1.18,0]],teal,.105,0x8f9a58);
 group=groups[0];
 for(let j=0;j<11;j++){const bar=box(-5.33+j*.153,.66,1.07,.043,.69,.045,steel);bar.rotation.x=-.32}
 group=groups[2];for(let j=0;j<3;j++){const z=-.28+j*.68;pipe([.69,.47,z],[2.94,.47,z],.048,teal);for(let k=0;k<7;k++)cyl(.85+k*.31,.52,z,.073,.055,dark)}
 group=groups[4];for(let j=0;j<3;j++)box(3.2,.24+j*.087,-1.95,1.9,.075,.96,[base,cement,sludge][j]);
 pipe([2.32,.17,-1.64],[4.18,.17,-1.64],.051,teal);
 batchStations(groups,pickables,solids,movers);
 group=scene;const leaf=windify(new T.MeshStandardMaterial({color:0x506a43,roughness:.78}),{strength:.006,base:1.6});
 const world=populate(scene,{steel,brass,cement,dark,base,leaf});dynamic.push(world.animate);
 const flows=reactorProcess(scene,{x,steel,brass,dark,teal,cement,world,isCut:()=>cut,tier});dynamic.push(flows.update);
 const scenery=reactorScenery(scene,{steel,brass,dark,cement,teal,tier});dynamic.push(scenery.update);
 environment(renderer,scene,{intensity:.45});
 // Premium finish: normal-mapped relief, sharper texture filtering, contact shadows under equipment.
 premiumSurfaces(scene,tier,renderer);
 for(const [cx,cz,w,d] of [[-4.55,.9,2.9,2.4],[-1.4,0,3.6,3.6],[1.8,.5,3.3,3.0],[-.4,-2.18,2.6,1.6],[3.2,-1.95,2.7,1.7],[4.75,.7,2.1,2.1]])contactShadow(scene,cx,.094,cz,w,d,.38);
 for(const [cx,cz,w,d] of [[-8.55,-.4,3.4,2],[7.55,-1.75,2.9,2.2],[8.45,1.75,2.4,2.4]])contactShadow(scene,cx,-.27,cz,w,d,.4);
 // Fine hardware that appears only when zoomed in: bolt rings, pipe flanges, name plates.
 const flanges=[];for(const [a,b,r] of pipeSegs){const d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],len=Math.hypot(...d);if(len<.45||r<.04)continue;const axis=Math.abs(d[1])>Math.abs(d[0])&&Math.abs(d[1])>Math.abs(d[2])?'y':Math.abs(d[0])>Math.abs(d[2])?'x':'z';for(const k of [.08,.92])flanges.push([a[0]+d[0]*k,a[1]+d[1]*k,a[2]+d[2]*k,r*1.45,axis])}
 const details=hardware(scene,{
  rings:[...[.43,1.5,2.6,3.68].map(y=>({x,y,z:0,r:1.3,n:56,a0:start,sweep:arc})),{x,y:4.15,z:0,r:.42,n:16,vertical:true,s:.014},{x:4.75,y:1.09,z:.7,r:.75,n:26,a0:start,sweep:arc,vertical:true,s:.013},{x,y:.38,z:0,r:1.5,n:40,vertical:true,s:.018}],
  flanges,
  plates:[{title:'R-101 UASB',sub:'1,200 m³ · 35 °C',at:[-1.4,.3,1.535],w:.34},{title:'T-201 AERATION',sub:'DO 2 mg/L',at:[3.185,.62,.5],ry:Math.PI/2,w:.34},{title:'T-001 INLET',sub:'POME 80 °C',at:[-5.715,.62,.9],ry:-Math.PI/2,w:.34},{title:'G-401 GENSET',sub:'biogas · 400 V',at:[.36,.25,-1.7],w:.3},{title:'P-501 OUTLET',sub:'to reuse / drain',at:[5.5,.45,.7],ry:Math.PI/2,w:.3}]});
 stream(scenery.airMain,.055,0xe9f6ff);stream(scenery.reusePipe,.06,0x9fe3d6);stream([[5.38,.34,.7],[6.15,.34,.7]],.07,0x9fe3d6,2);
 const parcelMesh=new T.InstancedMesh(new T.SphereGeometry(1,10,7),new T.MeshStandardMaterial({color:0xffffff,emissive:0x444444,roughness:.3}),parcels.length);
 parcels.forEach((p,i)=>parcelMesh.setColorAt(i,p.tint));parcelMesh.castShadow=false;parcelMesh.frustumCulled=false;scene.add(parcelMesh);
 const pm=new T.Object3D(),pv=new T.Vector3();dynamic.push(t=>{parcels.forEach((p,i)=>{p.path.getPoint((t*p.speed+p.k)%1,pv);pm.position.copy(pv);pm.scale.setScalar(p.r);pm.updateMatrix();parcelMesh.setMatrixAt(i,pm.matrix)});parcelMesh.instanceMatrix.needsUpdate=true});
 const molecules=view.querySelector('[data-command=molecules]');legend(view.querySelector('.reactor-frame'));
 const descriptions=[
  'Inlet and bar screen · Hot raw POME (about 80 °C, COD typically around 50,000 mg/L) pours in from the mill. The bars catch fibre and shell, and the operator rakes them into the skip. Oil floats as droplets, while water, dissolved organics (COD) and ammonium flow on to the reactor.',
  'UASB reactor · Feed rises through a bed of microbial granules. Organic matter is broken down to acetate, and methanogens turn the acetate into CH₄ + CO₂ with a trace of H₂S. The bubbles lift some granules; the hoods separate the gas, and partly treated water overflows the top weir.',
  'Aeration basin · Floor diffusers release fine air bubbles. With the dissolved O₂, bacterial flocs oxidise the remaining organics to CO₂ + H₂O and nitrify ammonium (NH₄⁺) to nitrate (NO₃⁻). The bubbles also keep the flocs circulating.',
  'Biogas engine · Captured biogas burns with air: CH₄ + 2O₂ → CO₂ + 2H₂O. The crankshaft turns the generator, which sends electricity along the cable to the mill grid. The exhaust leaves through the stack.',
  'Sludge drying bed · Waste sludge is spread over sand and gravel. Water drains to the underdrain or evaporates, and the cracked cake is shovelled out for composting. Check sludge quality before any land use.',
  'Outlet chamber · Treated water spirals towards the draw-off strainer while the last flocs settle out. Whether it can be discharged or reused depends on verified effluent quality (BOD, COD and suspended solids).'];
 const caption=view.querySelector('.reactor-caption');
 const targets=[[-4.55,.85,.9],[x,1.96,0],[1.8,.91,.5],[-.4,.7,-2.18],[3.2,.55,-1.95],[4.75,.76,.7]];
 let yaw=.18,pitch=.45,dist=14,goal=v(0,1.25,0),focus=goal.clone(),cut=true,paused=matchMedia('(prefers-reduced-motion:reduce)').matches,drag=null,vis=false,last=0,t=0;
 const ray=new T.Raycaster();
 function home(){visitor.setMode('orbit');caption.textContent='UASB section · aerobic basin';select.value='';goal.set(0,1.25,0);dist=14;yaw=.18;pitch=.45}
 function inspect(i){if(i===''){home();return}visitor.setMode('orbit');select.value=String(i);caption.textContent=descriptions[i];goal.set(...targets[i]);dist=i===1?7.2:6;units[i].dispatchEvent(new Event('click'))}
 select.onchange=()=>inspect(select.value===''?'':Number(select.value));
 function zoom(delta){dist=T.MathUtils.clamp(dist+delta,3.4,24)}
 function updateMotion(){motion.textContent=paused?'Resume flow':'Pause flow'}
 function pick(u,v){ray.setFromCamera(new T.Vector2(u*2-1,1-v*2),camera);const hit=ray.intersectObjects(pickables,false).find(h=>h.object.visible);if(hit)inspect(hit.object.parent.userData.id)}
 const orbit=(dx,dy)=>{yaw-=dx;pitch=T.MathUtils.clamp(pitch+dy,.11,1.4)};
 const visitor=explore(view,canvas,camera,world,orbit,pick,()=>toggle.click(),zoom);
 // Play as a worker: tools, talking crew, clickable labels, sound.
 const play=reactorPlay({scene,camera,canvas,viewport:view.querySelector('.reactor-frame'),world,visitor,flows});
 const UNIT_INFO=['inlet','uasb','aeration','biogas engine','drying bed','outlet'];
 updateMotion();view.querySelector('.reactor-controls').onclick=e=>{switch(e.target.dataset.command){case 'home':home();break;case 'in':zoom(-1);break;case 'out':zoom(1);break;case 'motion':paused=!paused;updateMotion();break;case 'molecules':{const on=molecules.getAttribute('aria-pressed')!=='true';molecules.setAttribute('aria-pressed',String(on));flows.chem.show(on);view.querySelector('.chem-legend').hidden=!on;break}case 'section':budget.refreshShadows();cut=!cut;solids.forEach(m=>m.visible=!cut);toggle.setAttribute('aria-pressed',String(cut));break}};
 solids.forEach(m=>m.visible=false);
 canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,moved:0}};
 canvas.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved+=Math.abs(dx)+Math.abs(dy);if(visitor.isWalking())visitor.look(dx*.009,dy*.007);else orbit(dx*.009,dy*.007);drag.x=e.clientX;drag.y=e.clientY};
 canvas.onpointercancel=()=>drag=null;canvas.onpointerup=e=>{if(drag&&drag.moved<6&&document.pointerLockElement!==canvas){const r=canvas.getBoundingClientRect(),u=(e.clientX-r.left)/r.width,v=(e.clientY-r.top)/r.height;
  if(!play.handleClick(u,v)){ray.setFromCamera(new T.Vector2(u*2-1,1-v*2),camera);const hit=ray.intersectObjects(pickables,false).find(h=>h.object.visible);if(hit){const id=hit.object.parent.userData.id;if(visitor.isWalking())play.showInfo(UNIT_INFO[id]);else inspect(id)}}}drag=null};
 canvas.onwheel=e=>{e.preventDefault();zoom(Math.sign(e.deltaY)*.6)};
 canvas.onkeydown=e=>{const actions={ArrowLeft:()=>yaw-=.13,ArrowRight:()=>yaw+=.13,ArrowUp:()=>pitch=Math.min(1.4,pitch+.1),ArrowDown:()=>pitch=Math.max(.11,pitch-.1),'+':()=>zoom(-1),'-':()=>zoom(1),Home:home};if(actions[e.key]){e.preventDefault();actions[e.key]()}};
 function sync(){const active=document.querySelector('[data-option="1"]').classList.contains('active');if(!active)visitor.stop();view.hidden=!active;diagram.style.display=active?'none':''}
 new MutationObserver(sync).observe(document.querySelector('[data-option="1"]'),{attributes:true,attributeFilter:['class']});sync();
 new IntersectionObserver(es=>{vis=es[0].isIntersecting;if(!vis&&!view.getBoundingClientRect().height)visitor.stop()}).observe(canvas);
 let w=0,h=0;
 const meter=document.createElement('small');meter.title='Rendered frames per second';view.querySelector('.reactor-controls').append(meter);
 const qualitySelect=view.querySelector('[data-quality]');qualitySelect.value=savedChoice();
 function applyTier(name){tierName=name;tier=TIERS[name];renderer.shadowMap.enabled=tier.shadows;renderer.shadowMap.type=tier.cheapShadows?T.PCFShadowMap:T.PCFSoftShadowMap;sun.castShadow=tier.shadows;flows.chem.setDensity(tier.molecules);budget.setCap(tier.ratio);budget.refreshShadows();
  scene.traverse(m=>{if(m.material)m.material.needsUpdate=true});qualitySelect.options[0].textContent=savedChoice()==='auto'?'Auto ('+tier.label+')':'Auto'}
 const budget=frameBudget(renderer,fps=>{meter.textContent=fps+' FPS'},{cap:tier.ratio,onStruggle(){const next=savedChoice()==='auto'&&lower(tierName);if(next){applyTier(next);return true}return false}});
 qualitySelect.onchange=()=>{saveChoice(qualitySelect.value);applyTier(resolveTier(qualitySelect.value));hd.refresh()};applyTier(tierName);
 const hdBadge=document.createElement('span');hdBadge.className='hd-badge';hdBadge.textContent='HD';hdBadge.hidden=true;view.querySelector('.reactor-frame').append(hdBadge);
 const hd=hdZoom({budget,chem:flows.chem,sun,flows,details,getTier:()=>tier,near:8.2,far:10.5,onChange:on=>{hdBadge.hidden=!on}});
 function frame(now){requestAnimationFrame(frame);const dt=Math.min(.07,(now-last)/1000);last=now;if(!vis||view.hidden||document.hidden){budget.idle();return}
 const width=canvas.clientWidth,height=canvas.clientHeight;if(!width||!height)return;if(w!==width||h!==height){w=width;h=height;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
 budget.tick(now);if(!paused)t+=dt;dynamic.forEach(fn=>fn(t));focus.lerp(goal,1-Math.exp(-dt*9));const d=dist*Math.max(1,1.52/camera.aspect);
 const walking=visitor.frame(dt);play.update(dt);if(!walking){camera.position.set(focus.x+d*Math.cos(pitch)*Math.sin(yaw),focus.y+d*Math.sin(pitch),focus.z+d*Math.cos(pitch)*Math.cos(yaw));camera.lookAt(focus)}
 hd.update(walking?0:d,walking?camera.position:focus);renderer.render(scene,camera);budget.end()}
 canvas.addEventListener('webglcontextlost',()=>{visitor.stop();view.remove();diagram.style.display='';panel.classList.add('reactor-fallback');vis=false});requestAnimationFrame(frame);
 if(new URLSearchParams(location.search).has('debug'))window.__pome={renderer,scene,camera,play,visitor,world,hd,flows,details,sun,budget,frame:()=>{dynamic.forEach(fn=>fn(t));renderer.render(scene,camera)},setT:v=>{t=v}};
}
