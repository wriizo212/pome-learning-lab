import * as T from './three.module.min.js';
import {texture,canvas as drawCanvas,grass,gravel,concrete,corrugated,sign,oilPalm,palmMaterial,environment,rippleNormal,sky,wind,premiumSurfaces,contactShadow,mergeStatic} from './life.mjs?v=shift20';
import {TIERS,resolveTier} from './quality.mjs?v=shift20';
import {frameBudget} from './frame-budget.mjs?v=shift20';
import {warmShaders} from './warmup.mjs?v=shift20';
import {populate} from './crew.mjs?v=shift20';
import {explore} from './explore.mjs?v=shift20';
import {pondsPlay} from './play.mjs?v=shift20';
import {chemistry,seeds,legend} from './molecules.mjs?v=shift20';

/*
 Conventional ponding system in 3D (shown when "Conventional ponds" is the pathway).
 Hot POME leaves the mill, passes an oil trap, then flows through an uncovered anaerobic
 pond, a facultative pond and an aerobic pond before discharge to the river.

 Built to the same standard as the other plants: embankments swept along a rounded
 outline (grass outer slope, gravel crest track, laterite inner slope with a wet
 waterline band), procedural water for each pond (sludge crust, algae swirls, green
 bloom), rip-rap stones, grass and reeds, fence, safety signs and lifebuoys, transfer
 chambers, a stepped discharge channel with a V-notch weir and sampling point, sludge
 drying beds, an excavator and tipper, and a fuller mill. Shadows tighten when you zoom.

 What learners should notice: the ponds are huge (land), methane bubbles straight into
 the air (no cover), smell drifts away, sludge has to be dug out, and a storm can make
 the ponds overflow into the river ("Storm test").
*/
const panel=document.querySelector('.stage'),diagram=panel?.querySelector('svg'),option=document.querySelector('[data-option="0"]');
if(panel&&diagram&&option)mount();

function mount(){
 const STAGES=[
  {name:'Mill and oil trap',at:[-9.4,.6,-.2],d:9,text:'Mill and oil trap · Hot POME (about 80–90 °C) leaves the mill. In the oil trap the oil floats and is skimmed off, and the POME cools as it flows on to the ponds.'},
  {name:'Anaerobic pond',at:[-4.2,.4,0],d:10,text:'Anaerobic pond · A deep pond with no cover. Bacteria that live without air break the waste down and make biogas, but the methane (CH₄) bubbles straight into the air. The rotten-egg smell (H₂S) drifts towards homes, and sludge builds up until it is dug out.'},
  {name:'Facultative pond',at:[1.4,.4,0],d:10,text:'Facultative pond · The top layer gets oxygen from the air and from algae; the bottom has none. Both kinds of bacteria keep lowering the BOD, but slowly, so the POME stays here for a long time.'},
  {name:'Aerobic pond',at:[6.4,.4,0],d:9,text:'Aerobic pond · Shallow and green with algae. Floating aerators splash in oxygen so bacteria can finish the clean-up before the water leaves.'},
  {name:'River discharge',at:[10.2,.2,1.4],d:8,text:'River discharge · Treated water runs down a stepped channel, over a V-notch weir where it is sampled, and into the river. It must meet the DOE BOD limit. In a heavy storm the ponds can overflow into the river.'},
  {name:'Desludging yard',at:[-2.4,.2,-5.4],d:9,text:'Desludging yard · Sludge settles at the bottom of the anaerobic pond. Every so often an excavator digs it out and spreads it on drying beds. It still needs safe handling before any use.'}
 ];
 const tierName=resolveTier(),tier=TIERS[tierName],hi=tier.detail>=.65;
 const view=document.createElement('div');view.className='reactor-view ponds-view';view.hidden=true;
 view.innerHTML='<div class="reactor-frame"><canvas tabindex="0" aria-label="Conventional ponding system in 3D. Drag to orbit, scroll to zoom, click a pond to learn about it."></canvas><span class="reactor-caption">Conventional ponds · open to the air</span><span class="ponds-alert" hidden>⚠ Overflow! Untreated POME is reaching the river</span><span class="hd-badge" hidden>HD</span></div><div class="reactor-controls"><label>Inspect <select aria-label="Inspect a pond"><option value="">Pond overview</option></select></label><button data-act="storm" aria-pressed="false">🌧️ Storm test</button><button data-act="gas" aria-pressed="true">CH₄ bubbles</button><button data-act="mol" aria-pressed="false">Molecules</button><button data-act="out" aria-label="Zoom out">−</button><button data-act="in" aria-label="Zoom in">+</button><button data-act="home">Reset view</button><small class="fps-meter"></small></div>';
 diagram.before(view);
 const canvasEl=view.querySelector('canvas'),caption=view.querySelector('.reactor-caption'),alert=view.querySelector('.ponds-alert'),select=view.querySelector('select'),fps=view.querySelector('.fps-meter'),hdBadge=view.querySelector('.hd-badge');
 STAGES.forEach((s,i)=>select.add(new Option(s.name,i)));
 let renderer;
 try{renderer=new T.WebGLRenderer({canvas:canvasEl,antialias:true,powerPreference:'high-performance'})}catch{view.remove();return}
 panel.dataset.ponds3d='1';
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(42,2,.1,240);
 scene.fog=new T.FogExp2(0xb3c5bd,.011);
 const atmosphere=sky(scene,{sunDir:new T.Vector3(-6,11,8)});environment(renderer,scene,{intensity:.55});
 const hemi=new T.HemisphereLight(0xdfeee6,0x4d5b3f,.7);scene.add(hemi);
 const sun=new T.DirectionalLight(0xfff1d6,2.2);sun.position.set(-10,16,9);sun.castShadow=true;const SS=hi?2048:1024;sun.shadow.mapSize.set(SS,SS);
 const WIDE={left:-17,right:17,top:12,bottom:-12};Object.assign(sun.shadow.camera,WIDE,{near:1,far:60});sun.shadow.bias=-.0005;sun.shadow.normalBias=.02;scene.add(sun);scene.add(sun.target);
 let seed=31;const rnd=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
 const mat=(color,r=.8,m=0,extra={})=>new T.MeshStandardMaterial({color,roughness:r,metalness:m,...extra});
 const stat=new T.Group();scene.add(stat);
 function add(geo,m,x,y,z,parent=stat,shadow=true){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o}
 const box=(x,y,z,w,h,d,m,p)=>add(new T.BoxGeometry(w,h,d),m,x,y+h/2,z,p);
 const cyl=(x,y,z,r,h,m,p,r2=r,n=16)=>add(new T.CylinderGeometry(r,r2,h,n),m,x,y+h/2,z,p);
 function pipe(a,b,r,m,p){const s=new T.Vector3(...a),e=new T.Vector3(...b),d=e.clone().sub(s);const o=add(new T.CylinderGeometry(r,r,d.length(),14),m,...s.clone().lerp(e,.5).toArray(),p);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o}
 const run=(pts,r,m,p)=>pts.slice(1).forEach((q,i)=>pipe(pts[i],q,r,m,p));
 const pickables=[];
 function label(text,x,y,z,w,key,color='#e3ead9'){const c=document.createElement('canvas');c.width=1024;c.height=192;const g=c.getContext('2d');g.scale(2,2);g.fillStyle='#172d2b';g.fillRect(0,0,512,96);g.fillStyle=color;g.font='bold 40px Arial';g.textAlign='center';g.fillText(text,256,62);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;const s=new T.Sprite(new T.SpriteMaterial({map:t}));s.position.set(x,y,z);w*=1.35;s.scale.set(w,w*96/512,1);s.userData.stage=key;s.userData.info='ponds:'+text.toLowerCase();scene.add(s);if(key!==undefined)pickables.push(s);return s}

 /* ---------- materials and textures ---------- */
 const TS=tier.texture;
 const grassTex=texture(grass(TS),{repeat:[70,70]});
 const groundMat=mat(0x7a9154,.95,0,{map:grassTex,bumpMap:grassTex,bumpScale:.02});
 const bankGrassTex=texture(grass(TS),{repeat:[18,1.2]}),bankGrass=mat(0x86a05a,.95,0,{map:bankGrassTex,bumpMap:bankGrassTex,bumpScale:.02});
 const gravelTex=texture(gravel(TS,'#9a8f7d'),{repeat:[40,.6]}),crestMat=mat(0xb9ad97,.95,0,{map:gravelTex,bumpMap:gravelTex,bumpScale:.03});
 const steel=mat(0x8f9a98,.4,.6),dark=mat(0x2f3534,.6,.4),yellow=mat(0xe2b03a,.5,.2),cementMat=mat(0xa49e89,.85,0,{map:texture(concrete(TS,{base:'#aaa38f',joints:4}),{repeat:[2,2]})});
 cementMat.bumpMap=cementMat.map;cementMat.bumpScale=.02;
 // Inner slope: dry laterite above, a dark wet band at the waterline, slimy below.
 const slopeTex=texture(drawCanvas(256,(g,s)=>{const gr=g.createLinearGradient(0,0,0,s);gr.addColorStop(0,'#b27a4b');gr.addColorStop(.16,'#9d6a40');gr.addColorStop(.2,'#4a3322');gr.addColorStop(.26,'#3a2a1c');gr.addColorStop(1,'#2b2218');g.fillStyle=gr;g.fillRect(0,0,s,s);
  for(let i=0;i<1800;i++){g.fillStyle=rnd()>.5?'rgba(255,230,190,.12)':'rgba(30,20,10,.18)';g.fillRect(rnd()*s,rnd()*s*.2,1+rnd()*2,1+rnd()*2)}
  for(let i=0;i<40;i++){g.strokeStyle='rgba(60,40,25,.35)';g.beginPath();const x=rnd()*s;g.moveTo(x,0);g.lineTo(x+(rnd()-.5)*10,s*.18);g.stroke()}
  g.fillStyle='rgba(90,120,60,.35)';for(let i=0;i<60;i++)g.fillRect(rnd()*s,s*.17+rnd()*6,2+rnd()*4,2)}),{repeat:[14,1]});
 const slopeMat=mat(0xffffff,.92,0,{map:slopeTex,bumpMap:slopeTex,bumpScale:.03,side:T.DoubleSide});
 const ripple=rippleNormal(256);ripple.repeat.set(5,5);
 function waterTex(draw){return texture(drawCanvas(512,draw),{repeat:[1,1]})}
 const scumTex=waterTex((g,s)=>{g.fillStyle='#3d2a1b';g.fillRect(0,0,s,s);
  for(let i=0;i<70;i++){const x=rnd()*s,y=rnd()*s,r=8+rnd()*42;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(120,92,58,.95)');gr.addColorStop(.7,'rgba(95,72,45,.7)');gr.addColorStop(1,'rgba(60,44,28,0)');g.fillStyle=gr;g.beginPath();g.ellipse(x,y,r,r*(.5+rnd()*.5),rnd()*3,0,7);g.fill()}
  for(let i=0;i<900;i++){g.fillStyle=rnd()>.6?'rgba(220,200,160,.5)':'rgba(30,20,12,.5)';g.fillRect(rnd()*s,rnd()*s,1.5,1.5)}
  for(let i=0;i<12;i++){const x=rnd()*s,y=rnd()*s;const gr=g.createRadialGradient(x,y,0,x,y,30);gr.addColorStop(0,'rgba(150,120,200,.16)');gr.addColorStop(.5,'rgba(90,180,160,.1)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-30,y-30,60,60)}});
 const facultTex=waterTex((g,s)=>{g.fillStyle='#5a6234';g.fillRect(0,0,s,s);
  for(let i=0;i<90;i++){g.strokeStyle=`rgba(${110+rnd()*40|0},${130+rnd()*40|0},60,.28)`;g.lineWidth=3+rnd()*10;g.beginPath();let x=rnd()*s,y=rnd()*s;g.moveTo(x,y);for(let k=0;k<5;k++){x+=(rnd()-.5)*80;y+=(rnd()-.5)*80;g.lineTo(x,y)}g.stroke()}
  for(let i=0;i<30;i++){const x=rnd()*s,y=rnd()*s,r=10+rnd()*30;g.fillStyle='rgba(80,60,35,.25)';g.beginPath();g.ellipse(x,y,r,r*.6,rnd()*3,0,7);g.fill()}});
 const aerobicTex=waterTex((g,s)=>{g.fillStyle='#2f6e47';g.fillRect(0,0,s,s);
  for(let i=0;i<160;i++){const x=rnd()*s,y=rnd()*s,r=4+rnd()*26;g.fillStyle=`rgba(${120+rnd()*60|0},${170+rnd()*50|0},70,${.25+rnd()*.35})`;g.beginPath();g.ellipse(x,y,r,r*(.4+rnd()*.6),rnd()*3,0,7);g.fill()}
  for(let i=0;i<400;i++){g.fillStyle='rgba(220,255,200,.35)';g.fillRect(rnd()*s,rnd()*s,1.2,1.2)}});
 const waterMats={
  anaerobic:mat(0xffffff,.42,.05,{map:scumTex,normalMap:ripple,normalScale:new T.Vector2(.12,.12)}),
  facult:mat(0xffffff,.16,.08,{map:facultTex,normalMap:ripple,normalScale:new T.Vector2(.3,.3)}),
  aerobic:mat(0xffffff,.12,.1,{map:aerobicTex,normalMap:ripple,normalScale:new T.Vector2(.4,.4)})
 };

 /* ---------- ground, roads and river ---------- */
 add(new T.PlaneGeometry(220,220),groundMat,0,0,0,scene,false).rotation.x=-Math.PI/2;
 const roadTex=texture(gravel(TS,'#a0764e'),{repeat:[30,1]}),road=mat(0xb07d52,.95,0,{map:roadTex,bumpMap:roadTex,bumpScale:.03});
 add(new T.PlaneGeometry(24,1.3),road,-.3,.012,4.95,stat,false).rotation.x=-Math.PI/2;
 add(new T.PlaneGeometry(1.3,8),road,-10.3,.013,1.4,stat,false).rotation.x=-Math.PI/2;
 add(new T.PlaneGeometry(14,1.3),road,-1.6,.012,-7.1,stat,false).rotation.x=-Math.PI/2;
 const rippleRiver=rippleNormal(256);rippleRiver.repeat.set(4,28);
 const riverMat=mat(0x3f7f86,.1,.15,{normalMap:rippleRiver,normalScale:new T.Vector2(.45,.45),transparent:true,opacity:.92});
 const riverClean=new T.Color(0x3f7f86),riverDirty=new T.Color(0x6b5a35);
 add(new T.PlaneGeometry(3.6,70),riverMat,11.4,.03,0,scene,false).rotation.x=-Math.PI/2;
 const mudTex=texture(drawCanvas(256,(g,s)=>{g.fillStyle='#6b5a3c';g.fillRect(0,0,s,s);for(let i=0;i<2000;i++){g.fillStyle=rnd()>.5?'rgba(140,120,80,.4)':'rgba(40,30,20,.4)';g.fillRect(rnd()*s,rnd()*s,2,2)}}),{repeat:[1,30]});
 for(const sd of [-1,1]){const b=add(new T.PlaneGeometry(1.1,70),mat(0xffffff,.95,0,{map:mudTex}),11.4+sd*2.3,.02,0,stat,false);b.rotation.x=-Math.PI/2}
 const riverHit=add(new T.BoxGeometry(3.6,.3,20),new T.MeshBasicMaterial({visible:false}),11.4,.1,2.5,scene,false);riverHit.userData.stage=4;pickables.push(riverHit);
 label('RIVER',11.4,1.7,-3,1.4,4,'#bfe8f0');
 // River stones and reeds.
 const stoneGeo=new T.DodecahedronGeometry(1,0),stoneMat=mat(0x8c8676,.9);
 const river=new T.InstancedMesh(stoneGeo,stoneMat,70),o=new T.Object3D();
 for(let i=0;i<70;i++){const sd=i%2?1:-1;o.position.set(11.4+sd*(1.75+rnd()*.3),.02,-30+rnd()*60);o.rotation.set(rnd()*3,rnd()*3,rnd()*3);o.scale.set(.12+rnd()*.15,.06+rnd()*.06,.1+rnd()*.15);o.updateMatrix();river.setMatrixAt(i,o.matrix)}river.receiveShadow=true;scene.add(river);

 /* ---------- grass tufts and reeds (crossed planes, alpha-tested) ---------- */
 const bladeTex=new T.CanvasTexture(drawCanvas(128,(g,s)=>{for(let i=0;i<26;i++){const x=s*(.2+rnd()*.6),h=s*(.45+rnd()*.55),lean=(rnd()-.5)*s*.3;g.strokeStyle=`rgb(${70+rnd()*60|0},${110+rnd()*60|0},${40+rnd()*30|0})`;g.lineWidth=2+rnd()*2;g.beginPath();g.moveTo(x,s);g.quadraticCurveTo(x+lean*.3,s-h*.6,x+lean,s-h);g.stroke()}}));bladeTex.colorSpace=T.SRGBColorSpace;
 const tuftGeo=(()=>{const a=new T.PlaneGeometry(.5,.38);a.translate(0,.19,0);const b=a.clone().rotateY(Math.PI/2);const g=new T.BufferGeometry();const merge=[a,b];const pos=[],uv=[],nor=[],idx=[];let base=0;for(const q of merge){pos.push(...q.attributes.position.array);uv.push(...q.attributes.uv.array);nor.push(...q.attributes.normal.array);idx.push(...[...q.index.array].map(i=>i+base));base+=q.attributes.position.count}g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setIndex(idx);return g})();
 const tuftMat=new T.MeshStandardMaterial({map:bladeTex,alphaTest:.45,side:T.DoubleSide,roughness:.9});
 const tufts=[];const reeds=[];

 /* ---------- embanked ponds swept along a rounded outline ---------- */
 const CREST=.7,FLOOR=.02,WATER=.56;
 function outline(w,d,r,n=10){const pts=[];const hw=w/2-r,hd=d/2-r;const corners=[[hw,hd,0],[-hw,hd,Math.PI/2],[-hw,-hd,Math.PI],[hw,-hd,Math.PI*1.5]];
  for(const [cx,cz,a0] of corners)for(let k=0;k<=n;k++){const a=a0+k/n*Math.PI/2;pts.push({x:cx+Math.cos(a)*r,z:cz+Math.sin(a)*r,nx:Math.cos(a),nz:Math.sin(a)})}return pts}
 function sweep(pts,cx,a,b,m,stageKey){const pos=[],uv=[],idx=[];let len=0;const n=pts.length;
  for(let i=0;i<=n;i++){const p=pts[i%n],q=pts[(i+n-1)%n];if(i)len+=Math.hypot(p.x-q.x,p.z-q.z);
   pos.push(cx+p.x+p.nx*a[0],a[1],p.z+p.nz*a[0],cx+p.x+p.nx*b[0],b[1],p.z+p.nz*b[0]);uv.push(len/4,0,len/4,1)}
  for(let i=0;i<n;i++){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const mesh=add(g,m,0,0,0,stageKey===undefined?stat:scene);if(stageKey!==undefined){mesh.userData.stage=stageKey;pickables.push(mesh)}return mesh}
 const ponds=[];
 function pond(cx,w,d,water,key){
  const pts=outline(w,d,.9);
  sweep(pts,cx,[1.35,0],[.55,CREST],bankGrass);          // outer slope
  sweep(pts,cx,[.55,CREST],[0,CREST],crestMat);          // gravel crest track
  sweep(pts,cx,[0,CREST],[-.8,FLOOR],slopeMat,key);      // inner slope with waterline
  const inset=.8*(CREST-WATER)/(CREST-FLOOR)+.02;
  const shape=new T.Shape();const ip=outline(w-inset*2,d-inset*2,.9-inset);ip.forEach((p,i)=>i?shape.lineTo(p.x,-p.z):shape.moveTo(p.x,-p.z));
  const wg=new T.ShapeGeometry(shape,6);wg.rotateX(-Math.PI/2);
  // Map the water texture once across the pond.
  const uvs=wg.attributes.uv;for(let i=0;i<uvs.count;i++){const x=wg.attributes.position.getX(i),z=wg.attributes.position.getZ(i);uvs.setXY(i,x/w*1.3+.5,z/d*1.1+.5)}
  const surf=add(wg,water,cx,WATER,0,scene,false);surf.userData.stage=key;surf.userData.base=WATER;pickables.push(surf);
  // Rip-rap stones at the waterline, grass on the outer slope, reeds at the water's edge.
  for(let i=0;i<pts.length;i+=1){const p=pts[i];if(rnd()<.35)continue;const off=-.18-rnd()*.12;tufts.push([cx+p.x+p.nx*(.8+rnd()*.5),0,p.z+p.nz*(.8+rnd()*.5),.7+rnd()*.6]);
   if(key!==1&&rnd()<.6)reeds.push([cx+p.x+p.nx*(-.22),WATER-.05,p.z+p.nz*(-.22)]);
   ponds.stones=(ponds.stones||[]);ponds.stones.push([cx+p.x+p.nx*off,WATER+.02,p.z+p.nz*off])}
  const P={cx,w,d,surf,pts};ponds.push(P);return P;
 }
 const P1=pond(-4.2,5.2,4.4,waterMats.anaerobic,1),P2=pond(1.4,4.6,4.4,waterMats.facult,2),P3=pond(6.4,3.8,4.4,waterMats.aerobic,3);
 const riprap=new T.InstancedMesh(stoneGeo,mat(0x8a8473,.9),ponds.stones.length);ponds.stones.forEach(([x,y,z],i)=>{o.position.set(x,y,z);o.rotation.set(rnd()*3,rnd()*3,rnd()*3);o.scale.set(.09+rnd()*.08,.05+rnd()*.05,.08+rnd()*.08);o.updateMatrix();riprap.setMatrixAt(i,o.matrix)});riprap.castShadow=true;riprap.receiveShadow=true;scene.add(riprap);
 label('ANAEROBIC POND',-4.2,2.3,0,2,1,'#ffd39b');label('FACULTATIVE POND',1.4,2.3,0,2.1,2,'#e8f0a0');label('AEROBIC POND',6.4,2.3,0,1.8,3,'#bff5c8');
 // Floating scum rafts on the anaerobic pond (drift slowly), algae mats on the others.
 const crust=new T.InstancedMesh(new T.CircleGeometry(1,10),mat(0x7a5f3e,.95,0,{bumpMap:scumTex,bumpScale:.03}),22);const crustBase=[];
 for(let i=0;i<22;i++){o.position.set(-4.2+(rnd()-.5)*3.8,WATER+.012,(rnd()-.5)*3);o.rotation.set(-Math.PI/2,0,rnd()*6);o.scale.set(.2+rnd()*.4,.15+rnd()*.3,1);o.updateMatrix();crust.setMatrixAt(i,o.matrix);crustBase.push(o.matrix.clone())}scene.add(crust);

 /* ---------- mill, oil trap and pump house ---------- */
 const clad=mat(0xffffff,.55,.35,{map:texture(corrugated(TS,'#9fb2b0'),{repeat:[3,1]})}),roofM=mat(0xffffff,.5,.45,{map:texture(corrugated(TS,'#6f8186'),{repeat:[4,1]})});
 box(-12.6,0,-.6,3.4,2.7,3.6,clad);const rf=box(-12.6,2.7,-.6,3.8,.12,4,roofM);rf.rotation.z=.08;
 box(-12.6,0,-3.6,2.6,2.0,2.2,clad);box(-12.6,2.0,-3.6,2.9,.1,2.5,roofM);
 cyl(-11.4,0,-2.1,.24,4.8,mat(0x9a9a92,.6,.3),stat,.3);for(let k=0;k<3;k++)cyl(-11.4,1.2+k*1.3,-2.1,.27,.06,dark);
 for(let k=0;k<3;k++){const t=pipe([-14.6,.55,.6-k*.75],[-13.2,.55,.6-k*.75],.3,mat(0x8d9896,.45,.55));for(const e of [-14.6,-13.2])cyl(e,.25,.6-k*.75,.33,.6,dark)}
 label('MILL',-12.6,3.8,-.6,1.3,0);label('STERILISERS',-14,1.4,-.2,1.6,0,'#ffd39b');
 // Oil trap: concrete tank with baffles, grating walkway and yellow handrails.
 box(-8.9,0,-.2,2.2,.6,1.6,cementMat);const trapTop=add(new T.PlaneGeometry(2,1.4),mat(0x7a4f22,.15,.25,{normalMap:ripple,normalScale:new T.Vector2(.15,.15)}),-8.9,.55,-.2,scene,false);trapTop.rotation.x=-Math.PI/2;
 for(const dx of [-.4,.35])box(-8.9+dx,.3,-.2,.06,.35,1.5,cementMat);
 const grating=mat(0x6b7472,.5,.6,{map:texture(drawCanvas(64,(g,s)=>{g.fillStyle='#4b5452';g.fillRect(0,0,s,s);g.strokeStyle='#9aa6a3';g.lineWidth=3;for(let i=0;i<s;i+=8){g.beginPath();g.moveTo(i,0);g.lineTo(i,s);g.stroke()}}),{repeat:[6,1]})});
 box(-8.9,.6,.72,2.3,.04,.42,grating);for(const x of [-10,-8.9,-7.8]){cyl(x,.62,.92,.02,.55,yellow)}pipe([-10,1.15,.92],[-7.8,1.15,.92],.022,yellow);pipe([-10,.88,.92],[-7.8,.88,.92],.018,yellow);
 for(let i=0;i<9;i++){const blob=add(new T.CircleGeometry(.05+rnd()*.08,10),mat(0xd8a640,.1,.3,{emissive:0x332200}),-9.7+rnd()*1.6,.565,-.8+rnd()*1.2,scene,false);blob.rotation.x=-Math.PI/2}
 label('OIL TRAP',-8.9,1.55,-.2,1.25,0);
 const brownPipe=mat(0x6e4a2a,.5,.3);run([[-10.9,1.0,-.2],[-10.1,1.0,-.2],[-10.1,.65,-.2]],.09,brownPipe);run([[-7.8,.35,-.2],[-7.2,.35,-.2],[-7.2,.82,.8],[-6.2,.82,.8]],.09,brownPipe);
 for(const p of [[-10.5,1.0,-.2],[-7.5,.35,-.2]]){const f=add(new T.TorusGeometry(.11,.025,8,16),steel,...p);f.rotation.y=Math.PI/2}
 cyl(-8.3,0,1.15,.03,.72,steel);
 // Pump house with transformer.
 const brick=mat(0xffffff,.85,0,{map:texture(drawCanvas(128,(g,s)=>{g.fillStyle='#9c5a3c';g.fillRect(0,0,s,s);g.fillStyle='#c9b9a3';for(let y=0;y<s;y+=16){g.fillRect(0,y,s,2);for(let x=(y/16%2)*16;x<s;x+=32)g.fillRect(x,y,2,16)}}),{repeat:[3,2]})});
 box(-9.6,0,-3,1.6,1.2,1.4,brick);box(-9.6,1.2,-3,1.9,.08,1.7,roofM);box(-8.79,0,-3,.02,.8,.5,mat(0x3f5a64,.5,.4));label('PUMP HOUSE',-9.6,1.8,-3,1.4,0);
 box(-8.4,0,-3.6,.6,.7,.45,mat(0x7c8a86,.5,.5));for(let k=0;k<3;k++)cyl(-8.55+k*.15,.7,-3.6,.03,.18,mat(0xd9d4c4,.4));
 contactShadow(scene,-12.6,.015,-.6,4.4,4.4,.45);contactShadow(scene,-8.9,.015,-.2,2.8,2.2,.35);contactShadow(scene,-9.6,.015,-3,2.2,2,.35);

 /* ---------- transfer chambers between ponds ---------- */
 const pipeGrey=mat(0x7b8a86,.45,.45);
 for(const [a,b] of [[-1.55,-.95],[3.65,4.55]]){box(a,0,.8,.5,CREST+.05,.5,cementMat);box(b,0,.8,.5,CREST+.05,.5,cementMat);pipe([a,CREST-.05,.8],[b,CREST-.05,.8],.08,pipeGrey);
  for(const x of [a,b]){const lid=box(x,CREST+.05,.8,.46,.03,.46,grating);lid.castShadow=false}}

 /* ---------- stepped discharge channel, V-notch weir, sampling point ---------- */
 box(8.65,0,1.6,.6,CREST+.05,.6,cementMat);
 const chanWater=mat(0x6f9a8e,.08,.1,{normalMap:ripple,normalScale:new T.Vector2(.5,.5),transparent:true,opacity:.85});
 for(let k=0;k<4;k++){const x=9.0+k*.22,h=CREST-.08-k*.17;box(x,0,1.6,.24,h,.5,cementMat);const w=add(new T.PlaneGeometry(.22,.4),chanWater,x,h+.02,1.6,scene,false);w.rotation.x=-Math.PI/2}
 const vplate=add(new T.ShapeGeometry(new T.Shape([new T.Vector2(-.25,0),new T.Vector2(-.04,0),new T.Vector2(0,-.08),new T.Vector2(.04,0),new T.Vector2(.25,0),new T.Vector2(.25,-.3),new T.Vector2(-.25,-.3)])),mat(0xb8c2c0,.35,.6,{side:T.DoubleSide}),9.1,CREST+.08,1.6);vplate.rotation.y=Math.PI/2;
 const kiosk=box(8.7,0,2.55,.5,.9,.4,mat(0xe9eae3,.5,.1));box(8.7,.9,2.55,.62,.05,.52,roofM);cyl(8.95,0,2.3,.02,1,yellow);
 const sp=new T.Mesh(new T.PlaneGeometry(.5,.32),new T.MeshStandardMaterial({map:sign({title:'SAMPLING',lines:['Final discharge','BOD · COD · pH'],band:'#1f6fb2',symbol:'i'}),roughness:.6}));sp.position.set(8.44,.62,2.55);sp.rotation.y=-Math.PI/2;stat.add(sp);
 label('SAMPLING POINT',8.7,1.5,2.55,1.5,4,'#bfe8f0');

 /* ---------- fence, gate, signs and lifebuoys ---------- */
 const postGeo=new T.CylinderGeometry(.03,.03,.95,6),posts=[];for(let x=-7.6;x<=9.2;x+=.9)posts.push([x,4.35]);
 const postMesh=new T.InstancedMesh(postGeo,steel,posts.length);posts.forEach(([x,z],i)=>{o.position.set(x,.47,z);o.rotation.set(0,0,0);o.scale.set(1,1,1);o.updateMatrix();postMesh.setMatrixAt(i,o.matrix)});postMesh.castShadow=true;scene.add(postMesh);
 for(const y of [.3,.6,.88]){pipe([-7.6,y,4.35],[-.6,y,4.35],.008,steel);pipe([.8,y,4.35],[9.2,y,4.35],.008,steel)}
 function signPost(spec,x,z,face=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=face;stat.add(g);add(new T.CylinderGeometry(.025,.025,1,8),steel,0,.5,0,g);const p=add(new T.PlaneGeometry(.6,.38),new T.MeshStandardMaterial({map:sign(spec),roughness:.6}),0,.95,.02,g);p.castShadow=false;add(new T.BoxGeometry(.62,.4,.02),dark,0,.95,0,g)}
 signPost({title:'DANGER',lines:['Deep water','No swimming'],symbol:'!'},-3,4.45);signPost({title:'NOTICE',lines:['Effluent ponds','Authorised only'],band:'#1f6fb2',symbol:'i'},.1,4.45);signPost({title:'CAUTION',lines:['Biogas & H₂S','No naked flames'],band:'#e2b03a',symbol:'!'},-6.6,4.45);
 const buoyMat=new T.MeshStandardMaterial({map:texture(drawCanvas(64,(g,s)=>{for(let i=0;i<8;i++){g.fillStyle=i%2?'#f4f1e6':'#e8541e';g.fillRect(i*s/8,0,s/8,s)}}),{repeat:[1,1]}),roughness:.5});
 for(const [x,z] of [[-4.2,3.0],[1.4,3.0],[6.4,3.0]]){cyl(x,CREST,z,.025,.7,steel);const b=add(new T.TorusGeometry(.16,.05,10,20),buoyMat,x,CREST+.5,z+.04);b.castShadow=true}

 /* ---------- desludging yard: drying beds, excavator, tipper ---------- */
 const cakeTex=texture(drawCanvas(256,(g,s)=>{g.fillStyle='#4d3a26';g.fillRect(0,0,s,s);g.strokeStyle='rgba(25,18,10,.8)';g.lineWidth=2;for(let i=0;i<60;i++){g.beginPath();let x=rnd()*s,y=rnd()*s;g.moveTo(x,y);for(let k=0;k<4;k++){x+=(rnd()-.5)*50;y+=(rnd()-.5)*50;g.lineTo(x,y)}g.stroke()}for(let i=0;i<800;i++){g.fillStyle='rgba(140,110,70,.3)';g.fillRect(rnd()*s,rnd()*s,2,2)}}),{repeat:[2,1]});
 const cake=mat(0xffffff,.97,0,{map:cakeTex,bumpMap:cakeTex,bumpScale:.04});
 for(const x of [-2.6,.4]){box(x,0,-5.6,2.6,.28,1.6,cementMat);const c=add(new T.PlaneGeometry(2.4,1.4),cake,x,.27,-5.6);c.rotation.x=-Math.PI/2}
 label('DRYING BEDS',-1.1,1.3,-5.6,1.5,5,'#ffd39b');
 const yel=mat(0xe2a92a,.5,.3),ex=new T.Group();ex.position.set(-5.2,0,-4.1);ex.rotation.y=-.35;scene.add(ex);
 const track=mat(0x2b2d2c,.8,.3);for(const z of [-.32,.32]){box(0,0,z,1.3,.26,.24,track,ex);for(let k=0;k<5;k++)cyl(-.5+k*.25,.13,z,.09,.25,dark,ex).rotation.x=Math.PI/2}
 const upper=new T.Group();upper.position.y=.3;ex.add(upper);box(-.1,0,0,1.0,.42,.82,yel,upper);box(.2,.42,.25,.42,.48,.36,mat(0x9ec6d0,.1,.3,{transparent:true,opacity:.6}),upper);box(-.45,.42,0,.3,.22,.7,yel,upper);cyl(-.4,.64,-.25,.04,.25,dark,upper);
 const arm=new T.Group();arm.position.set(.45,.35,-.1);upper.add(arm);box(.7,-.06,0,1.4,.14,.16,yel,arm);const fore=new T.Group();fore.position.set(1.38,0,0);arm.add(fore);box(0,-.7,0,.12,.72,.12,yel,fore);const bucket=add(new T.BoxGeometry(.3,.2,.32),mat(0x3b3b36,.6,.5),.08,-.78,0,fore);
 cyl(.6,.15,-.1,.05,.5,steel,arm).rotation.z=Math.PI/2;
 const tip=new T.Group();tip.position.set(3,0,-7.1);tip.rotation.y=Math.PI/2;scene.add(tip);
 for(const [x,z] of [[-.6,-.35],[-.6,.35],[.5,-.35],[.5,.35]])cyl(x,.17,z,.17,.12,track,tip).rotation.x=Math.PI/2;
 box(.75,.2,0,.55,.6,.72,mat(0x2f6fa6,.5,.3),tip);box(.75,.55,.0,.5,.22,.68,mat(0x9ec6d0,.1,.3,{transparent:true,opacity:.6}),tip);
 const bed=new T.Group();bed.position.set(-.35,.42,0);tip.add(bed);box(0,0,0,1.25,.42,.78,mat(0xc9b06a,.6,.4),bed);add(new T.SphereGeometry(.42,12,8,0,Math.PI*2,0,Math.PI/2),cake,0,.4,0,bed).scale.set(1.3,.4,.8);
 contactShadow(scene,-5.2,.016,-4.1,1.8,1.4,.4);contactShadow(scene,3,.016,-7.1,1.2,2,.35);
 label('DESLUDGING',-5.6,2.1,-4.2,1.5,5,'#ffd39b');
 label('Ponds need a lot of land',1.4,1.4,-3.5,2.4,2,'#ffe3a3');

 /* ---------- grass tufts, reeds, palms ---------- */
 for(let i=0;i<(hi?320:160);i++){const a=rnd()*6.28,r=6+rnd()*14;const x=-1+Math.cos(a)*r*1.3,z=Math.sin(a)*r*.7;if(x>9&&x<14)continue;tufts.push([x,0,z,.6+rnd()*.7])}
 const tuftMesh=new T.InstancedMesh(tuftGeo,tuftMat,tufts.length);tufts.forEach(([x,y,z,s],i)=>{o.position.set(x,y,z);o.rotation.set(0,rnd()*3,0);o.scale.setScalar(s);o.updateMatrix();tuftMesh.setMatrixAt(i,o.matrix)});tuftMesh.receiveShadow=true;scene.add(tuftMesh);
 for(let i=0;i<90;i++){const sd=i%2?1:-1;reeds.push([11.4+sd*(1.65+rnd()*.4),0,-28+rnd()*56])}
 const reedMat=new T.MeshStandardMaterial({map:bladeTex,alphaTest:.45,side:T.DoubleSide,roughness:.9,color:0xb8c890});
 const reedMesh=new T.InstancedMesh(tuftGeo,reedMat,reeds.length);reeds.forEach(([x,y,z],i)=>{o.position.set(x,y,z);o.rotation.set(0,rnd()*3,0);o.scale.set(.8,1.6+rnd()*.8,.8);o.updateMatrix();reedMesh.setMatrixAt(i,o.matrix)});scene.add(reedMesh);
 const palmGeo=oilPalm({fronds:hi?24:18,leaflets:hi?14:10,height:2.4,seed:9,bunches:2,lod:2}),palms=[];
 for(let i=0;i<(hi?110:80);i++){const a=rnd()*6.28,rr=16+rnd()*20;const x=Math.cos(a)*rr*1.1,z=Math.sin(a)*rr*.8;if(x>8&&x<15)continue;palms.push([x,z])}
 const nearPalms=[];for(let x=-14;x<=8;x+=2.6)nearPalms.push([x+(rnd()-.5)*.6,-9.4+(rnd()-.5)*.6]);
 const nearGeo=oilPalm({fronds:hi?32:24,leaflets:hi?24:16,height:2.7,seed:13,bunches:3,lod:0}),nearMesh=new T.InstancedMesh(nearGeo,palmMaterial(.022),nearPalms.length);
 nearPalms.forEach(([x,z],i)=>{o.position.set(x,0,z);o.rotation.set(0,rnd()*6.28,0);o.scale.setScalar(.95+rnd()*.25);o.updateMatrix();nearMesh.setMatrixAt(i,o.matrix)});nearMesh.castShadow=nearMesh.receiveShadow=true;nearMesh.userData.info='palm';scene.add(nearMesh);
 const palmMesh=new T.InstancedMesh(palmGeo,palmMaterial(.02),palms.length);palms.forEach(([x,z],i)=>{o.position.set(x,0,z);o.rotation.set(0,rnd()*6.28,0);o.scale.setScalar(.85+rnd()*.35);o.updateMatrix();palmMesh.setMatrixAt(i,o.matrix)});palmMesh.castShadow=true;palmMesh.userData.info='palm';scene.add(palmMesh);

 /* ---------- moving things: aerators, egrets, people, flows, gas, rain, fish ---------- */
 const puffTex=new T.CanvasTexture(drawCanvas(64,(g,s)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,.85)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64)}));
 const sprite=(opts)=>{const s=new T.Sprite(new T.SpriteMaterial({map:puffTex,transparent:true,depthWrite:false,opacity:0,...opts}));scene.add(s);return s};
 const aerators=[[5.6,-.9],[7.2,1]].map(([x,z])=>{const g=new T.Group();g.position.set(x,WATER+.02,z);scene.add(g);add(new T.CylinderGeometry(.28,.32,.12,18),mat(0xd9d4c4,.5,.2),0,0,0,g).userData.info='ponds:aerator';add(new T.CylinderGeometry(.06,.06,.3,8),mat(0x52605d,.4,.6),0,.2,0,g);const rot=new T.Group();g.add(rot);for(let k=0;k<4;k++){const b=add(new T.BoxGeometry(.34,.03,.07),mat(0x2f3a38,.5,.5),0,.32,0,rot);b.rotation.y=k*Math.PI/4}return {g,rot}});
 const splash=Array.from({length:14},(_,i)=>{const s=sprite({color:0xe8fff4});s.userData={o:i/14,a:aerators[i%2].g};return s});
 const smoke=Array.from({length:8},(_,i)=>{const s=sprite({});s.userData.o=i/8;return s});
 const egretMat=mat(0xf6f4ee,.6),legMat=mat(0x2b2b28,.6);
 const egrets=[[5.3,1.3],[7.4,-1.2],[6.2,1.8]].map(([x,z],i)=>{const g=new T.Group();g.position.set(x,WATER-.05,z);g.rotation.y=i*2;g.scale.setScalar(.7);scene.add(g);const body=add(new T.SphereGeometry(.09,12,8),egretMat,0,.28,0,g);body.userData.info='ponds:egret';body.scale.set(1.6,1,1);const neck=new T.Group();neck.position.set(.11,.32,0);g.add(neck);add(new T.CylinderGeometry(.018,.022,.2,8),egretMat,0,.1,0,neck);add(new T.SphereGeometry(.03,10,8),egretMat,0,.21,0,neck);add(new T.ConeGeometry(.012,.09,6),mat(0xe6b33a,.5),.05,.21,0,neck).rotation.z=-Math.PI/2;for(const z of [-.03,.03])add(new T.CylinderGeometry(.007,.007,.24,5),legMat,0,.12,z,g);return {g,neck,o:i*1.3}});
 const live=[];
 const parcelPaths=[[[-10.9,1.0,-.2],[-10.1,1.0,-.2]],[[-7.8,.35,-.2],[-7.2,.35,-.2]],[[-7.2,.82,.8],[-6.2,.82,.8]],[[-1.55,.7,.8],[-.95,.7,.8]],[[3.65,.7,.8],[4.55,.7,.8]],[[9.0,.74,1.6],[9.9,.2,1.6]]];
 const parcels=new T.InstancedMesh(new T.SphereGeometry(.05,8,6),mat(0x8a5a2a,.4,0,{emissive:0x2a1400}),parcelPaths.length*3);parcels.frustumCulled=false;scene.add(parcels);
 live.push((dt,t)=>{parcelPaths.forEach(([a,b],i)=>{for(let k=0;k<3;k++){const f=(t*.35+k/3+i*.13)%1;o.position.set(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f+.06,a[2]+(b[2]-a[2])*f);o.rotation.set(0,0,0);o.scale.setScalar(1);o.updateMatrix();parcels.setMatrixAt(i*3+k,o.matrix)}});parcels.instanceMatrix.needsUpdate=true});
 live.push((dt,t)=>{const m=new T.Matrix4(),off=new T.Matrix4();for(let i=0;i<crustBase.length;i++){off.makeTranslation(Math.sin(t*.05+i)*.12,0,Math.cos(t*.04+i*1.7)*.1);m.multiplyMatrices(off,crustBase[i]);m.elements[13]=P1.surf.position.y+.012;crust.setMatrixAt(i,m)}crust.instanceMatrix.needsUpdate=true});
 // Methane: bubbles swell and pop leaving ripple rings, then drift up as CH4 (and a little H2S).
 const bubbles=new T.InstancedMesh(new T.SphereGeometry(1,12,8),mat(0xd8dccb,.15,.1,{transparent:true,opacity:.75}),60);{const z=new T.Matrix4().makeScale(0,0,0);for(let i=0;i<60;i++)bubbles.setMatrixAt(i,z)}scene.add(bubbles);
 const bub=Array.from({length:60},()=>({x:-4.2+(rnd()-.5)*4.2,z:(rnd()-.5)*3.4,ph:rnd(),sp:.4+rnd()*.6}));
 const ringGeo=new T.RingGeometry(.7,1,20);ringGeo.rotateX(-Math.PI/2);const rings=new T.InstancedMesh(ringGeo,new T.MeshBasicMaterial({color:0xd8d2bf,transparent:true,opacity:.35,depthWrite:false}),60);rings.frustumCulled=false;scene.add(rings);
 function textTex(t,color){const c=document.createElement('canvas');c.width=128;c.height=64;const g=c.getContext('2d');g.font='bold 38px Arial';g.textAlign='center';g.fillStyle='rgba(0,0,0,.45)';g.fillText(t,66,46);g.fillStyle=color;g.fillText(t,64,44);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return tx}
 const gasTex=textTex('CH₄','#ffe27a'),smellTex=textTex('H₂S','#c9f59a');
 const gas=Array.from({length:10},(_,i)=>{const s=new T.Sprite(new T.SpriteMaterial({map:i%4===3?smellTex:gasTex,transparent:true,depthWrite:false,opacity:0}));s.userData={o:i/10,x:-4.2+(rnd()-.5)*3.6,z:(rnd()-.5)*3};scene.add(s);return s});
 const RN=1100,rp=new Float32Array(RN*6);for(let i=0;i<RN;i++){const x=(rnd()-.5)*32,y=rnd()*12,z=(rnd()-.5)*18;rp.set([x,y,z,x+.05,y-.45,z],i*6)}const rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.BufferAttribute(rp,3));
 const rain=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:0xcfe3ea,transparent:true,opacity:.45}));rain.visible=false;rain.frustumCulled=false;scene.add(rain);
 const spill=add(new T.PlaneGeometry(1.2,1.6),mat(0x5a4426,.3,0,{transparent:true,opacity:0}),9.2,.06,-.4,scene,false);spill.rotation.x=-Math.PI/2;
 const fish=[0,1,2].map(i=>{const f=add(new T.SphereGeometry(.1,10,8),mat(0x9fb3b8,.3,.4),11.4,-1,-4+i*4,scene,false);f.scale.set(2.2,.8,.8);f.userData.o=i*1.7;return f});
 const birds=Array.from({length:5},(_,i)=>{const g=new T.Group();scene.add(g);const w1=add(new T.BoxGeometry(.3,.01,.08),mat(0x2b2b28,.7),.15,0,0,g,false),w2=add(new T.BoxGeometry(.3,.01,.08),mat(0x2b2b28,.7),-.15,0,0,g,false);return {g,w1,w2,a:i*1.25,r:9+i*1.6,h:5+i*.5}});

 /* ---------- embankment ground model: crest height, slopes and the water you cannot walk into ---------- */
 function sdPond(P,x,z){const r=.9,qx=Math.abs(x-P.cx)-(P.w/2-r),qz=Math.abs(z)-(P.d/2-r);return Math.hypot(Math.max(qx,0),Math.max(qz,0))+Math.min(Math.max(qx,qz),0)-r}
 function bankHeight(sd){if(sd>=1.35)return 0;if(sd>=.55)return CREST*(1.35-sd)/.8;if(sd>=0)return CREST;if(sd>=-.8)return CREST+(FLOOR-CREST)*(-sd/.8);return FLOOR}
 const groundAt=(x,z)=>Math.max(0,...ponds.map(P=>bankHeight(sdPond(P,x,z))));
 const edge=(x,z)=>ponds.findIndex(P=>{const d=sdPond(P,x,z);return d>-.12&&d<.62});
 const blocked=(x,z)=>ponds.some(P=>sdPond(P,x,z)<-.14);
 /* ---------- the crew: every worker has a shift of real jobs around the ponds ---------- */
 const world=populate(scene,{steel,brass:mat(0xc9a23f,.4,.6),cement:cementMat,dark,base:mat(0x6f7f60,.9),leaf:mat(0x506a43,.78)},'ponds');
 /* ---------- molecules: what happens inside each pond (toggle "Molecules") ---------- */
 const C=chemistry(scene,{ch4:120,co2:120,o2:160,h2o:120,nh4:40,no3:40,h2s:30,acetate:60,cod:160,oil:50,floc:60,bubble:120},1.3,{density:tier.molecules,detail:hi?1:.7});C.show(false);
 const MS={anC:seeds(70,3,201),anG:seeds(26,3,203),fa:seeds(40,3,207),ae:seeds(40,3,211),oil:seeds(24,3,213),nit:seeds(16,3,217)};
 function molecules(t){C.begin();const y1=P1.surf.position.y,y3=P3.surf.position.y;
  for(const [a,b,c] of MS.anC){const f=(a+t*.03)%1;C.put(f<.5?'cod':'acetate',-4.2+(b-.5)*4.2+.3*Math.sin(t*.2+a*9),.12+.3*c+.05*Math.sin(t+b*7),(c-.5)*3.4,.07,t*.5+a*6)}
  for(const [a,b,c] of MS.anG){const f=(a+t*.12)%1;const x=-4.2+(b-.5)*4,z=(c-.5)*3.2;C.put(b<.82?'ch4':'h2s',x,f<.45?.1+f*.95:y1+(f-.45)*3.2,z+(f>.45?(f-.45)*.8:0),.085,t+a*5);if(f>.45&&b<.3)C.put('co2',x+.2,y1+(f-.45)*2.6,z,.07,t+b*4)}
  for(const [a,b,c] of MS.fa){const f=(a+t*.05)%1,x=1.4+(b-.5)*3.8,z=(c-.5)*3.2;if(c<.5)C.put('o2',x,P2.surf.position.y-.05-.06*f,z,.07,t+a*4);else C.put(f<.6?'cod':'co2',x,.2+.25*f,z,.06,t+a*6)}
  for(const [a,b,c] of MS.ae){const f=(a+t*.2)%1,ar=aerators[b<.5?0:1].g.position,ang=a*6.283+t*.3;C.put('o2',ar.x+Math.cos(ang)*(.3+f*1.1),y3-.05-.2*f,ar.z+Math.sin(ang)*(.3+f*1.1),.07,t+a*3)}
  for(const [a,b,c] of MS.nit){const f=(a+t*.06)%1,x=6.4+(b-.5)*2.8,z=(c-.5)*3;C.put(f<.5?'nh4':'no3',x,y3-.12,z,.075,t+a*5);if(c<.3)C.put('floc',x+.15,y3-.2,z,.06,t)}
  for(const [a,b,c] of MS.oil){const x=-8.9+(b-.5)*1.7,z=-.2+(c-.5)*1.2;C.put('oil',x+.05*Math.sin(t+a*7),.565,z,.07,a*3)}
  C.end()}
 premiumSurfaces(scene,tier,renderer);mergeStatic(stat);

 /* ---------- camera, picking, controls ---------- */
 const goal=new T.Vector3(-1,0,0),look=goal.clone();let yaw=.35,pitch=.62,dist=20,sy=yaw,sp2=pitch,sd=dist;
 function home(){goal.set(-1,0,0);yaw=.35;pitch=.62;dist=20;select.value='';caption.textContent='Conventional ponds · open to the air';}
 function inspect(i){const s=STAGES[i];if(!s)return home();select.value=String(i);goal.set(...s.at);dist=s.d;caption.textContent=s.text;budget.refreshShadows()}
 select.onchange=()=>select.value===''?home():inspect(+select.value);
 let drag=null,moved=0;const ray=new T.Raycaster();
 const orbit=(dx,dy)=>{yaw-=dx;pitch=Math.max(.12,Math.min(1.35,pitch+dy))};
 function pick(u,v){ray.setFromCamera(new T.Vector2(u*2-1,1-v*2),camera);const hit=ray.intersectObjects(pickables,false)[0];if(hit)inspect(hit.object.userData.stage)}
 const visitor=explore(view,canvasEl,camera,world,orbit,pick,()=>{},d=>{dist=Math.max(3.5,Math.min(34,dist+d))});
 let stormT=0;
 const play=pondsPlay({scene,camera,canvas:canvasEl,viewport:view.querySelector('.reactor-frame'),world,visitor,flows:{},isPond:()=>true,isPolluted:()=>stormT>.7,groundAt,edge,blocked,palmSpots:nearPalms});
 world.setRiverHealth?.(()=>stormT<.6);
 const chemKey=legend(view.querySelector('.reactor-frame'),{open:false});chemKey.hidden=true;
 canvasEl.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};moved=0;canvasEl.setPointerCapture(e.pointerId)});
 canvasEl.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved+=Math.abs(dx)+Math.abs(dy);if(visitor.isWalking())visitor.look(dx*.009,dy*.007);else orbit(dx*.006,dy*.005);drag={x:e.clientX,y:e.clientY}});
 canvasEl.addEventListener('pointerup',e=>{if(drag&&moved<6&&document.pointerLockElement!==canvasEl){const r=canvasEl.getBoundingClientRect(),u=(e.clientX-r.left)/r.width,v=(e.clientY-r.top)/r.height;if(!play.handleClick(u,v)&&!visitor.isWalking())pick(u,v)}drag=null});
 canvasEl.addEventListener('wheel',e=>{if(visitor.isWalking())return;e.preventDefault();dist=Math.max(3.5,Math.min(34,dist*(e.deltaY>0?1.1:.9)))},{passive:false});
 canvasEl.addEventListener('keydown',e=>{if(visitor.isWalking())return;const k={ArrowLeft:()=>yaw+=.12,ArrowRight:()=>yaw-=.12,ArrowUp:()=>pitch=Math.min(1.35,pitch+.08),ArrowDown:()=>pitch=Math.max(.12,pitch-.08)}[e.key];if(k){k();e.preventDefault()}});
 let storm=false;
 view.querySelector('.reactor-controls').addEventListener('click',e=>{const a=e.target.closest('button')?.dataset.act;if(!a)return;
  if(a==='storm'){storm=!storm;e.target.setAttribute('aria-pressed',String(storm));rain.visible=storm;caption.textContent=storm?'Storm test · heavy rain fills the open ponds. Watch the last pond and the river.':'Conventional ponds · open to the air';if(storm){goal.set(5,0,0);dist=18}}
  if(a==='gas'){const on=e.target.getAttribute('aria-pressed')!=='true';e.target.setAttribute('aria-pressed',String(on));bubbles.visible=rings.visible=on;gas.forEach(s=>s.visible=on)}
  if(a==='mol'){const on=e.target.getAttribute('aria-pressed')!=='true';e.target.setAttribute('aria-pressed',String(on));C.show(on);chemKey.hidden=!on}
  if(a==='in')dist=Math.max(3.5,dist*.85);if(a==='out')dist=Math.min(34,dist*1.18);if(a==='home')home()});

 /* ---------- loop ---------- */
 const budget=frameBudget(renderer,f=>{fps.textContent=f+' FPS'},{cap:tier.pixels});
 warmShaders(renderer,scene,camera);
 let visible=false,last=performance.now(),time=0,close=false;new IntersectionObserver(es=>{visible=es[0].isIntersecting}).observe(view);
 const m4=new T.Object3D();
 function fitShadow(on){close=on;hdBadge.hidden=!on;const cam=sun.shadow.camera;if(on){Object.assign(cam,{left:-6,right:6,top:6,bottom:-6});sun.target.position.copy(look);sun.position.copy(look).add(new T.Vector3(-10,16,9))}else{Object.assign(cam,WIDE);sun.target.position.set(0,0,0);sun.position.set(-10,16,9)}cam.updateProjectionMatrix();budget.refreshShadows()}
 let lastFit=new T.Vector3(1e9,0,0);
 function frame(now){requestAnimationFrame(frame);if(view.hidden||!visible||document.hidden){budget.idle();last=now;return}
  budget.tick(now);const dt=Math.min(.08,(now-last)/1000);last=now;time+=dt;wind.value=time;atmosphere.update(time);
  const w=canvasEl.clientWidth,h=canvasEl.clientHeight;if(canvasEl.width!==Math.floor(w*renderer.getPixelRatio())||canvasEl.height!==Math.floor(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
  ripple.offset.set(time*.01,-time*.03);rippleRiver.offset.set(time*.01,-time*.08);
  stormT=Math.max(0,Math.min(1,stormT+(storm?dt/18:-dt/10)));
  if(storm){const p=rainGeo.attributes.position;for(let i=0;i<RN;i++){let y=p.array[i*6+1]-dt*14;if(y<0)y+=12;p.array[i*6+1]=y;p.array[i*6+4]=y-.45}p.needsUpdate=true}
  sun.intensity=2.2*(1-.55*stormT);hemi.intensity=.7*(1-.3*stormT);
  for(const p of ponds)p.surf.position.y=p.surf.userData.base+stormT*.12;
  const over=stormT>.75;spill.material.opacity=Math.max(0,(stormT-.75)*3.2);alert.hidden=!over;
  riverMat.color.copy(riverClean).lerp(new T.Color(0x6b5a35),Math.max(0,(stormT-.7)*2.5));
  if(bubbles.visible){bub.forEach((b,i)=>{const f=(b.ph+time*b.sp*.4)%1;m4.position.set(b.x,P1.surf.position.y+.02,b.z);m4.rotation.set(0,0,0);m4.scale.setScalar(f<.8?.02+f*.07:.0001);m4.updateMatrix();bubbles.setMatrixAt(i,m4.matrix);
    const rf=f<.8?0:(f-.8)/.2;m4.position.y=P1.surf.position.y+.015;m4.scale.setScalar(rf>0?.05+rf*.35:.0001);m4.updateMatrix();rings.setMatrixAt(i,m4.matrix)});bubbles.instanceMatrix.needsUpdate=true;rings.instanceMatrix.needsUpdate=true;
   gas.forEach(s=>{const f=(s.userData.o+time*.06)%1;s.position.set(s.userData.x+Math.sin(time*.5+s.userData.o*9)*.4,.9+f*4,s.userData.z+f*1.2);const k=.55+f*.4;s.scale.set(k,k*.5,1);s.material.opacity=f<.15?f/.15:1-(f-.15)/.85})}
  aerators.forEach((a,i)=>{a.rot.rotation.y=time*(5+i);a.g.position.y=P3.surf.position.y+.02+.015*Math.sin(time*3+i)});
  splash.forEach(s=>{const f=(s.userData.o+time*.9)%1,a=s.userData.o*6.28*2;s.position.set(s.userData.a.position.x+Math.cos(a)*(.3+f*.4),s.userData.a.position.y+Math.sin(f*Math.PI)*.35,s.userData.a.position.z+Math.sin(a)*(.3+f*.4));s.scale.setScalar(.18+f*.2);s.material.opacity=.6*(1-f)});
  smoke.forEach(s=>{const f=(s.userData.o+time*.05)%1;s.position.set(-11.4+f*2.5,4.9+f*4,-2.1+f*1.2);s.scale.setScalar(.6+f*2.4);s.material.opacity=.45*(1-f)});
  egrets.forEach(e=>{const c=(time*.4+e.o)%4;e.neck.rotation.z=c<.5?-.9*Math.sin(c/.5*Math.PI):.1*Math.sin(time*2+e.o);e.g.position.y=P3.surf.position.y-.05});
  birds.forEach(b=>{const a=b.a+time*.25;b.g.position.set(-1+Math.cos(a)*b.r,b.h+.3*Math.sin(time+b.a),Math.sin(a)*b.r*.6);b.g.rotation.y=-a;const fl=.6*Math.sin(time*9+b.a*4);b.w1.rotation.z=fl;b.w2.rotation.z=-fl});
  fish.forEach(f=>{const c=(time*.5+f.userData.o)%5;const healthy=stormT<.6;f.visible=healthy&&c<.7;if(f.visible){f.position.y=.05+Math.sin(c/.7*Math.PI)*.45;f.rotation.z=Math.cos(c/.7*Math.PI)*.9}});
  for(const fn of live)fn(dt,time);
  world.animate(time);const walking=visitor.frame(dt);play.update(dt);if(C.root.visible)molecules(time);
  upper.rotation.y=Math.sin(time*.35)*.5;arm.rotation.z=-.15+Math.sin(time*.6)*.22;fore.rotation.z=-.35+Math.sin(time*.6+1)*.35;bed.rotation.z=Math.max(0,Math.sin(time*.2))*.35;
  const k=1-Math.exp(-dt*6);sy+=(yaw-sy)*k;sp2+=(pitch-sp2)*k;sd+=(dist-sd)*k;look.lerp(goal,k);
  if(!walking){camera.position.set(look.x+sd*Math.cos(sp2)*Math.sin(sy),look.y+sd*Math.sin(sp2),look.z+sd*Math.cos(sp2)*Math.cos(sy));camera.lookAt(look)}else look.copy(visitor.position);
  // HD when close: shadows fitted tightly around what you are looking at.
  const near=walking||sd<8.5;if(!close&&near)fitShadow(true);else if(close&&!walking&&sd>10.5)fitShadow(false);else if(close&&look.distanceTo(lastFit)>1.5){fitShadow(true)}
  if(close&&look.distanceTo(lastFit)>1.5)lastFit.copy(look);
  renderer.render(scene,camera);budget.end();
 }
 requestAnimationFrame(frame);
 function sync(){const on=option.classList.contains('active');view.hidden=!on;if(!on)visitor.stop();if(on){diagram.style.display='none';budget.refreshShadows()}}
 new MutationObserver(sync).observe(option,{attributes:true,attributeFilter:['class']});sync();
 canvasEl.addEventListener('webglcontextlost',()=>{view.remove();delete panel.dataset.ponds3d;diagram.style.display=''});
 if(new URLSearchParams(location.search).has('debug'))window.__ponds={renderer,scene,camera,budget,inspect,atmosphere,world,visitor,play,groundAt,edge,blocked};
}
