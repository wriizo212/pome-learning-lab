import * as T from './three.module.min.js';
import {texture,grass,concrete,oilPalm,palmMaterial,environment,rippleNormal,sky,wind} from './life.mjs?v=shift16';
import {TIERS,resolveTier} from './quality.mjs?v=shift16';
import {frameBudget} from './frame-budget.mjs?v=shift16';
import {warmShaders} from './warmup.mjs?v=shift16';

/*
 Conventional ponding system in 3D (shown when "Conventional ponds" is the pathway).
 Hot POME leaves the mill, passes an oil trap, then flows through an uncovered anaerobic
 pond, a facultative pond and an aerobic pond before discharge to the river.
 What learners should notice: the ponds are huge (land), methane bubbles straight into
 the air (no cover), smell drifts away, sludge has to be dug out, and a storm can make
 the ponds overflow into the river ("Storm test").
*/
const panel=document.querySelector('.stage'),diagram=panel?.querySelector('svg'),option=document.querySelector('[data-option="0"]');
if(panel&&diagram&&option)mount();

function mount(){
 const STAGES=[
  {name:'Mill and oil trap',at:[-9.2,.6,-.5],d:9,text:'Mill and oil trap · Hot POME (about 80–90 °C) leaves the mill. In the oil trap the oil floats and is skimmed off, and the POME cools as it flows on to the ponds.'},
  {name:'Anaerobic pond',at:[-4.2,.3,0],d:10,text:'Anaerobic pond · A deep pond with no cover. Bacteria that live without air break the waste down and make biogas, but the methane (CH₄) bubbles straight into the air. The rotten-egg smell (H₂S) drifts towards homes, and sludge builds up until it is dug out.'},
  {name:'Facultative pond',at:[1.4,.3,0],d:10,text:'Facultative pond · The top layer gets oxygen from the air and from algae; the bottom has none. Both kinds of bacteria keep lowering the BOD, but slowly, so the POME stays here for a long time.'},
  {name:'Aerobic pond',at:[6.4,.3,0],d:9,text:'Aerobic pond · Shallow and green with algae. Floating aerators splash in oxygen so bacteria can finish the clean-up before the water leaves.'},
  {name:'River discharge',at:[10.6,0,2.5],d:9,text:'River discharge · Treated water flows to the river and must meet the DOE BOD limit. In a heavy storm the ponds can overflow and send poorly treated POME into the river.'}
 ];
 const tierName=resolveTier(),tier=TIERS[tierName];
 const view=document.createElement('div');view.className='reactor-view ponds-view';view.hidden=true;
 view.innerHTML='<div class="reactor-frame"><canvas tabindex="0" aria-label="Conventional ponding system in 3D. Drag to orbit, scroll to zoom, click a pond to learn about it."></canvas><span class="reactor-caption">Conventional ponds · open to the air</span><span class="ponds-alert" hidden>⚠ Overflow! Untreated POME is reaching the river</span></div><div class="reactor-controls"><label>Inspect <select aria-label="Inspect a pond"><option value="">Pond overview</option></select></label><button data-act="storm" aria-pressed="false">🌧️ Storm test</button><button data-act="gas" aria-pressed="true">CH₄ bubbles</button><button data-act="out" aria-label="Zoom out">−</button><button data-act="in" aria-label="Zoom in">+</button><button data-act="home">Reset view</button><small class="fps-meter"></small></div>';
 diagram.before(view);
 const canvas=view.querySelector('canvas'),caption=view.querySelector('.reactor-caption'),alert=view.querySelector('.ponds-alert'),select=view.querySelector('select'),fps=view.querySelector('.fps-meter');
 STAGES.forEach((s,i)=>select.add(new Option(s.name,i)));
 let renderer;
 try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'})}catch{view.remove();return}
 panel.dataset.ponds3d='1';
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(42,2,.1,240);
 scene.fog=new T.FogExp2(0xb3c5bd,.012);
 const atmosphere=sky(scene,{sunDir:new T.Vector3(-6,11,8)});environment(renderer,scene,{intensity:.5});
 scene.add(new T.HemisphereLight(0xdfeee6,0x4d5b3f,.75));
 const sun=new T.DirectionalLight(0xfff1d6,2.1);sun.position.set(-10,16,9);sun.castShadow=true;sun.shadow.mapSize.set(tier.shadowSize,tier.shadowSize);
 Object.assign(sun.shadow.camera,{left:-16,right:16,top:12,bottom:-12,near:1,far:50});sun.shadow.bias=-.0006;scene.add(sun);
 const mat=(color,r=.8,m=0,extra={})=>new T.MeshStandardMaterial({color,roughness:r,metalness:m,...extra});
 function add(geo,m,x,y,z,parent=scene,shadow=true){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o}
 const box=(x,y,z,w,h,d,m,p)=>add(new T.BoxGeometry(w,h,d),m,x,y+h/2,z,p);
 const pickables=[];
 function label(text,x,y,z,w,key,color='#e3ead9'){const c=document.createElement('canvas');c.width=1024;c.height=192;const g=c.getContext('2d');g.scale(2,2);g.fillStyle='#172d2b';g.fillRect(0,0,512,96);g.fillStyle=color;g.font='bold 40px Arial';g.textAlign='center';g.fillText(text,256,62);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;const s=new T.Sprite(new T.SpriteMaterial({map:t}));s.position.set(x,y,z);w*=1.35;s.scale.set(w,w*96/512,1);s.userData.stage=key;scene.add(s);if(key!==undefined)pickables.push(s);return s}
 function pipe(a,b,r,m){const s=new T.Vector3(...a),e=new T.Vector3(...b),d=e.clone().sub(s);const o=add(new T.CylinderGeometry(r,r,d.length(),12),m,...s.clone().lerp(e,.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o}

 /* ---- ground, path and river ---- */
 const grassTex=texture(grass(tier.texture),{repeat:[60,60]});
 add(new T.PlaneGeometry(220,220),mat(0x6f8a4c,.95,0,{map:grassTex}),0,0,0).rotation.x=-Math.PI/2;
 const laterite=mat(0xa0683f,.95,0,{map:texture(concrete(256,{base:'#a8714a',streaks:false}),{repeat:[8,2]})});
 add(new T.PlaneGeometry(22,1.2),laterite,-.5,.012,-4.2,scene,false).rotation.x=-Math.PI/2;
 const ripple=rippleNormal(256);ripple.repeat.set(6,24);
 const riverMat=mat(0x3f7f86,.12,.15,{normalMap:ripple,normalScale:new T.Vector2(.35,.35),transparent:true,opacity:.9});
 const riverClean=new T.Color(0x3f7f86),riverDirty=new T.Color(0x6b5a35);
 add(new T.PlaneGeometry(3.6,60),riverMat,11.4,.03,0,scene,false).rotation.x=-Math.PI/2;
 for(const s of [-1,1])add(new T.PlaneGeometry(.9,60),mat(0x6b5a3c,1),11.4+s*2.15,.02,0,scene,false).rotation.x=-Math.PI/2;
 const reeds=new T.InstancedMesh(new T.ConeGeometry(.04,.7,5),mat(0x5f7d3a,.9),160),ro=new T.Object3D();let seed=31;const rnd=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
 for(let i=0;i<160;i++){const side=i%2?1:-1;ro.position.set(11.4+side*(1.75+rnd()*.5),.3,-28+rnd()*56);ro.rotation.set((rnd()-.5)*.3,0,(rnd()-.5)*.3);ro.scale.setScalar(.6+rnd()*.8);ro.updateMatrix();reeds.setMatrixAt(i,ro.matrix)}scene.add(reeds);
 const riverHit=add(new T.BoxGeometry(3.6,.3,20),new T.MeshBasicMaterial({visible:false}),11.4,.1,2.5,scene,false);riverHit.userData.stage=4;pickables.push(riverHit);
 label('RIVER',11.4,1.6,-3,1.4,4,'#bfe8f0');

 /* ---- mill and oil trap ---- */
 const shed=mat(0x8f9fa0,.55,.35),roof=mat(0x5d6f74,.5,.4),cementM=mat(0xa49e89,.85);
 box(-12.2,0,-.5,3.4,2.6,3.6,shed);const r=box(-12.2,2.6,-.5,3.8,.14,4,roof);r.rotation.z=.08;
 add(new T.CylinderGeometry(.22,.28,4.4,14),mat(0x9a9a92,.6,.3),-11.2,2.2+1.1,-1.9);
 label('MILL',-12.2,3.7,-.5,1.3,0);
 box(-8.9,0,-.5,1.8,.55,1.4,cementM);const oilTop=add(new T.PlaneGeometry(1.6,1.2),mat(0x8a5a24,.15,.2,{normalMap:ripple,normalScale:new T.Vector2(.2,.2)}),-8.9,.5,-.5,scene,false);oilTop.rotation.x=-Math.PI/2;
 for(let i=0;i<10;i++){const blob=add(new T.CircleGeometry(.06+rnd()*.08,10),mat(0xd8a640,.1,.3,{emissive:0x332200}),-9.6+rnd()*1.4,.512,-1+rnd()*1,scene,false);blob.rotation.x=-Math.PI/2}
 label('OIL TRAP',-8.9,1.2,-.5,1.25,0);
 const brown=mat(0x6e4a2a,.5,.3);pipe([-10.5,.9,-.5],[-9.8,.9,-.5],.09,brown);pipe([-8,.35,-.5],[-6.9,.35,-.5],.09,brown);
 const smoke=Array.from({length:8},(_,i)=>{const s=new T.Sprite(new T.SpriteMaterial({map:puff(),transparent:true,depthWrite:false,opacity:0}));s.userData.o=i/8;scene.add(s);return s});

 /* ---- the three ponds (embanked earth basins) ---- */
 const earth=mat(0x8a6a44,.97,0,{map:texture(concrete(256,{base:'#8f6e48',streaks:false}),{repeat:[4,2]})}),bankGrass=mat(0x7b9550,.95,0,{map:grassTex});
 function pond(cx,w,d,{water,depth=.7,key}){
  const g=new T.Group();g.position.set(cx,0,0);scene.add(g);const h=.55,rim=.55;
  const frustum=(top,bottom,height,y,m,side)=>{const geo=new T.CylinderGeometry(top,bottom,height,4,1,true);geo.rotateY(Math.PI/4);const o=add(geo,m,0,y,0,g);o.scale.set(w/d,1,1);m.side=side;return o};
  const R=d/2*Math.SQRT2;frustum(R+rim*1.41,R+rim*2.6,h,h/2,bankGrass,T.FrontSide);const capGeo=new T.RingGeometry(R,R+rim*1.41,4,1);capGeo.rotateX(-Math.PI/2);capGeo.rotateY(Math.PI/4);const cap=add(capGeo,bankGrass,0,h,0,g);cap.scale.set(w/d,1,1);
  const inner=frustum(R,R-depth*1.2,h+.02,h/2-.01,earth.clone(),T.BackSide);inner.userData.stage=key;pickables.push(inner);
  add(new T.PlaneGeometry(w,d),mat(0x3d2c1c,1),0,.02,0,g,false).rotation.x=-Math.PI/2;
  const surf=add(new T.PlaneGeometry(w*.88,d*.88,1,1),water,0,h-.14,0,g,false);surf.rotation.x=-Math.PI/2;surf.userData.stage=key;pickables.push(surf);surf.userData.base=h-.14;
  return {g,surf,w,d};
 }
 const anaerobicWater=mat(0x4a3322,.35,.05,{normalMap:ripple,normalScale:new T.Vector2(.15,.15)});
 const facultWater=mat(0x5e6b37,.2,.08,{normalMap:ripple,normalScale:new T.Vector2(.25,.25)});
 const aerobicWater=mat(0x3d7d4c,.15,.1,{normalMap:ripple,normalScale:new T.Vector2(.35,.35)});
 const P1=pond(-4.2,5.2,4.4,{water:anaerobicWater,depth:1,key:1}),P2=pond(1.4,4.6,4.4,{water:facultWater,key:2}),P3=pond(6.4,3.8,4.4,{water:aerobicWater,depth:.5,key:3});
 label('ANAEROBIC POND',-4.2,2.2,0,2,1,'#ffd39b');label('FACULTATIVE POND',1.4,2.2,0,2.1,2,'#e8f0a0');label('AEROBIC POND',6.4,2.2,0,1.8,3,'#bff5c8');
 // Scum crust on the anaerobic pond, algae on the others.
 const crust=new T.InstancedMesh(new T.CircleGeometry(1,9),mat(0x6b5236,.95),26);for(let i=0;i<26;i++){ro.position.set(-4.2+(rnd()-.5)*4.4,P1.surf.userData.base+.012,(rnd()-.5)*3.6);ro.rotation.set(-Math.PI/2,0,rnd()*6);ro.scale.set(.2+rnd()*.45,.15+rnd()*.35,1);ro.updateMatrix();crust.setMatrixAt(i,ro.matrix)}scene.add(crust);
 const algae=new T.InstancedMesh(new T.CircleGeometry(1,8),mat(0x7fae4a,.7),40);for(let i=0;i<40;i++){const inA=i<16;ro.position.set((inA?1.4:6.4)+(rnd()-.5)*(inA?3.8:3.1),.42,(rnd()-.5)*3.6);ro.rotation.set(-Math.PI/2,0,rnd()*6);ro.scale.set(.1+rnd()*.3,.08+rnd()*.2,1);ro.updateMatrix();algae.setMatrixAt(i,ro.matrix)}scene.add(algae);
 // Overflow weirs between ponds.
 for(const [a,b] of [[-6.9,-6.9],[-1.3,-.8],[3.9,4.3],[8.4,9.6]]){pipe([a-.4,.45,.8],[b+.4,.45,.8],.08,mat(0x7b8a86,.5,.4))}
 pipe([8.6,.4,1.6],[9.7,.12,1.6],.1,mat(0x7b8a86,.5,.4));
 // Floating aerators on the aerobic pond.
 const aerators=[[5.6,-.9],[7.2,1]].map(([x,z])=>{const g=new T.Group();g.position.set(x,.43,z);scene.add(g);add(new T.CylinderGeometry(.28,.32,.12,16),mat(0xd9d4c4,.5,.2),0,0,0,g);add(new T.CylinderGeometry(.06,.06,.3,8),mat(0x52605d,.4,.6),0,.2,0,g);const rot=new T.Group();g.add(rot);for(let k=0;k<4;k++){const b=add(new T.BoxGeometry(.32,.03,.07),mat(0x2f3a38,.5,.5),0,.32,0,rot);b.rotation.y=k*Math.PI/4}return rot});
 const splash=Array.from({length:12},(_,i)=>{const s=new T.Sprite(new T.SpriteMaterial({map:puff(),transparent:true,depthWrite:false,opacity:0,color:0xe8fff4}));s.userData={o:i/12,a:aerators[i%2].parent};scene.add(s);return s});
 // Desludging corner: excavator and a heap of dug-out sludge.
 const yellow=mat(0xe2b03a,.5,.3);const ex=new T.Group();ex.position.set(-4.2,0,-3.6);scene.add(ex);
 box(0,0,0,1.1,.3,.7,mat(0x2c2f2e,.8),ex);box(0,.3,0,.9,.4,.6,yellow,ex);box(-.25,.7,0,.45,.4,.5,mat(0x9ec6d0,.1,.3,{transparent:true,opacity:.7}),ex);
 const arm=new T.Group();arm.position.set(.4,.6,0);ex.add(arm);box(.55,0,0,1.1,.1,.12,yellow,arm);const fore=new T.Group();fore.position.set(1.1,.05,0);arm.add(fore);box(0,-.5,0,.1,.6,.1,yellow,fore);box(.05,-.62,0,.25,.18,.24,mat(0x3b3b36,.6,.5),fore);
 const heap=add(new T.SphereGeometry(.8,14,8,0,Math.PI*2,0,Math.PI/2),mat(0x4d3a26,1),-6.6,0,-3.7);heap.scale.set(1.3,.55,1);
 label('DESLUDGING',-5.2,1.9,-3.7,1.5,1,'#ffd39b');
 // A sign about land use.
 const sign=label('Ponds need a lot of land',1.4,1.25,-3.4,2.4,2,'#ffe3a3');
 /* ---- methane, smell, rain, fish ---- */
 const bubbles=new T.InstancedMesh(new T.SphereGeometry(1,10,8),mat(0xcfd8c8,.2,.1,{transparent:true,opacity:.7}),60);const bub=Array.from({length:60},()=>({x:-4.2+(rnd()-.5)*4.4,z:(rnd()-.5)*3.6,ph:rnd(),sp:.4+rnd()*.6}));scene.add(bubbles);{const z=new T.Matrix4().makeScale(0,0,0);for(let i=0;i<60;i++)bubbles.setMatrixAt(i,z)}
 const gasTex=textTex('CH₄','#ffe27a'),smellTex=textTex('H₂S','#c9f59a');
 const gas=Array.from({length:10},(_,i)=>{const s=new T.Sprite(new T.SpriteMaterial({map:i%4===3?smellTex:gasTex,transparent:true,depthWrite:false,opacity:0}));s.userData={o:i/10,x:-4.2+(rnd()-.5)*3.6,z:(rnd()-.5)*3};scene.add(s);return s});
 const rainGeo=new T.BufferGeometry(),RN=900,rp=new Float32Array(RN*6);for(let i=0;i<RN;i++){const x=(rnd()-.5)*30,y=rnd()*12,z=(rnd()-.5)*16;rp.set([x,y,z,x+.05,y-.45,z],i*6)}rainGeo.setAttribute('position',new T.BufferAttribute(rp,3));
 const rain=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:0xcfe3ea,transparent:true,opacity:.45}));rain.visible=false;rain.frustumCulled=false;scene.add(rain);
 const spill=add(new T.PlaneGeometry(1.8,1.2),mat(0x5a4426,.3,0,{transparent:true,opacity:0}),9.4,.06,-.6,scene,false);spill.rotation.x=-Math.PI/2;
 const fish=[0,1,2].map(i=>{const f=add(new T.SphereGeometry(.1,10,8),mat(0x9fb3b8,.3,.4),11.4,-1,-4+i*4,scene,false);f.scale.set(2.2,.8,.8);f.userData.o=i*1.7;return f});
 /* ---- people and flows: a sampler walks the banks, an operator checks the inlet, POME moves through the weirs ---- */
 const live=[];
 function person(shirt,hat){const g=new T.Group();scene.add(g);const skin=mat(0x8d5a3b,.7),pants=mat(0x2d3a4a,.8);
  const legs=[-.06,.06].map(x=>{const l=new T.Group();l.position.set(x,.42,0);g.add(l);add(new T.BoxGeometry(.08,.42,.09),pants,0,-.21,0,l);return l});
  add(new T.BoxGeometry(.26,.34,.15),mat(shirt,.7),0,.6,0,g);add(new T.BoxGeometry(.27,.04,.16),mat(0xd8e24a,.5,0,{emissive:0x333300}),0,.66,0,g);
  add(new T.SphereGeometry(.085,14,10),skin,0,.86,0,g);add(new T.SphereGeometry(.095,14,8,0,Math.PI*2,0,Math.PI/2),mat(hat,.4,.1),0,.89,0,g);
  const arms=[-.17,.17].map(x=>{const a=new T.Group();a.position.set(x,.74,0);g.add(a);add(new T.BoxGeometry(.06,.3,.07),mat(shirt,.7),0,-.15,0,a);return a});
  return {g,legs,arms}}
 const sampler=person(0x2f6fa6,0xffffff),operator=person(0xd9772a,0xf2c230);
 const bottle=add(new T.CylinderGeometry(.025,.025,.09,10),mat(0xd8ecf2,.1,0,{transparent:true,opacity:.8}),0,-.3,.04,sampler.arms[1]);
 operator.g.position.set(-8.9,0,.45);operator.g.rotation.y=Math.PI;
 const route=[[-6.8,3.5],[9.35,3.5],[9.35,1.9],[9.35,3.5]];let leg=0,legT=0;
 live.push((dt,t)=>{const [ax,az]=route[leg],[bx,bz]=route[(leg+1)%route.length],len=Math.hypot(bx-ax,bz-az);legT+=dt*.7/len;if(legT>=1){legT=0;leg=(leg+1)%route.length}
  const pause=leg===2;const k=pause?1:legT;sampler.g.position.set(ax+(bx-ax)*k,0,az+(bz-az)*k);sampler.g.rotation.y=Math.atan2(bx-ax,bz-az);
  const sw=pause?0:Math.sin(t*7)*.5;sampler.legs[0].rotation.x=sw;sampler.legs[1].rotation.x=-sw;sampler.arms[0].rotation.x=-sw*.7;sampler.arms[1].rotation.x=pause?-1.1+.3*Math.sin(t*2):sw*.7;
  operator.arms[1].rotation.x=-.9+.5*Math.sin(t*1.6);operator.arms[0].rotation.x=-.4;});
 const parcelMat=mat(0x8a5a2a,.4,0,{emissive:0x2a1400}),parcelPaths=[[[-10.5,.9,-.5],[-9.8,.9,-.5]],[[-8,.35,-.5],[-6.9,.35,-.5]],[[-7.3,.45,.8],[-6.5,.45,.8]],[[-1.7,.45,.8],[-.4,.45,.8]],[[3.5,.45,.8],[4.7,.45,.8]],[[8,.45,.8],[9.8,.45,.8]]];
 const parcels=new T.InstancedMesh(new T.SphereGeometry(.05,8,6),parcelMat,parcelPaths.length*3);parcels.frustumCulled=false;scene.add(parcels);
 live.push((dt,t)=>{parcelPaths.forEach(([a,b],i)=>{for(let k=0;k<3;k++){const f=(t*.35+k/3+i*.13)%1;ro.position.set(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f+.06,a[2]+(b[2]-a[2])*f);ro.rotation.set(0,0,0);ro.scale.setScalar(1);ro.updateMatrix();parcels.setMatrixAt(i*3+k,ro.matrix)}});parcels.instanceMatrix.needsUpdate=true});
 // Floating scum slowly drifts on the anaerobic pond.
 const crustBase=[];for(let i=0;i<26;i++){const m=new T.Matrix4();crust.getMatrixAt(i,m);crustBase.push(m)}
 live.push((dt,t)=>{const m=new T.Matrix4(),off=new T.Matrix4();for(let i=0;i<26;i++){off.makeTranslation(Math.sin(t*.05+i)*.12,0,Math.cos(t*.04+i*1.7)*.1);m.multiplyMatrices(off,crustBase[i]);m.elements[13]=P1.surf.position.y+.012;crust.setMatrixAt(i,m)}crust.instanceMatrix.needsUpdate=true});
 /* ---- oil palms around the field ---- */
 const palmGeo=oilPalm({fronds:22,leaflets:14,height:2.4,seed:9,bunches:2,lod:1}),palms=[];
 for(let i=0;i<90;i++){const a=rnd()*6.28,rr=15+rnd()*20;const x=Math.cos(a)*rr*1.1,z=Math.sin(a)*rr*.8;if(x>8&&x<15)continue;palms.push([x,z])}
 for(let x=-14;x<=8;x+=2.6)for(const z of [-8.2])palms.push([x+(rnd()-.5)*.6,z+(rnd()-.5)*.6]);
 const palmMesh=new T.InstancedMesh(palmGeo,palmMaterial(.02),palms.length);palms.forEach(([x,z],i)=>{ro.position.set(x,0,z);ro.rotation.set(0,rnd()*6.28,0);ro.scale.setScalar(.85+rnd()*.35);ro.updateMatrix();palmMesh.setMatrixAt(i,ro.matrix)});palmMesh.castShadow=true;scene.add(palmMesh);

 function puff(){return puff.t||=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,.85)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new T.CanvasTexture(c)})()}
 function textTex(t,color){const c=document.createElement('canvas');c.width=128;c.height=64;const g=c.getContext('2d');g.font='bold 38px Arial';g.textAlign='center';g.fillStyle='rgba(0,0,0,.45)';g.fillText(t,66,46);g.fillStyle=color;g.fillText(t,64,44);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return tx}

 /* ---- camera, picking, controls ---- */
 const goal=new T.Vector3(-1,0,0),look=goal.clone();let yaw=.35,pitch=.62,dist=20,sy=yaw,sp=pitch,sd=dist;
 function home(){goal.set(-1,0,0);yaw=.35;pitch=.62;dist=20;select.value='';caption.textContent='Conventional ponds · open to the air';}
 function inspect(i){const s=STAGES[i];if(!s)return home();select.value=String(i);goal.set(...s.at);dist=s.d;caption.textContent=s.text;budget.refreshShadows()}
 select.onchange=()=>select.value===''?home():inspect(+select.value);
 let drag=null,moved=0;const ray=new T.Raycaster();
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};moved=0;canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved+=Math.abs(dx)+Math.abs(dy);yaw-=dx*.006;pitch=Math.max(.15,Math.min(1.35,pitch+dy*.005));drag={x:e.clientX,y:e.clientY}});
 canvas.addEventListener('pointerup',e=>{if(drag&&moved<6){const r=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1),camera);const hit=ray.intersectObjects(pickables,false)[0];if(hit)inspect(hit.object.userData.stage)}drag=null});
 canvas.addEventListener('wheel',e=>{e.preventDefault();dist=Math.max(5,Math.min(34,dist*(e.deltaY>0?1.1:.9)))},{passive:false});
 canvas.addEventListener('keydown',e=>{const k={ArrowLeft:()=>yaw+=.12,ArrowRight:()=>yaw-=.12,ArrowUp:()=>pitch=Math.min(1.35,pitch+.08),ArrowDown:()=>pitch=Math.max(.15,pitch-.08)}[e.key];if(k){k();e.preventDefault()}});
 let storm=false,stormT=0,showGas=true;
 view.querySelector('.reactor-controls').addEventListener('click',e=>{const a=e.target.closest('button')?.dataset.act;if(!a)return;
  if(a==='storm'){storm=!storm;e.target.setAttribute('aria-pressed',String(storm));rain.visible=storm;caption.textContent=storm?'Storm test · heavy rain fills the open ponds. Watch the last pond.':'Conventional ponds · open to the air';if(storm){goal.set(4,0,0);dist=20}}
  if(a==='gas'){showGas=!showGas;e.target.setAttribute('aria-pressed',String(showGas));bubbles.visible=showGas;gas.forEach(s=>s.visible=showGas)}
  if(a==='in')dist=Math.max(5,dist*.85);if(a==='out')dist=Math.min(34,dist*1.18);if(a==='home')home()});

 /* ---- loop ---- */
 const budget=frameBudget(renderer,f=>{fps.textContent=f+' FPS'},{cap:tier.pixels});
 warmShaders(renderer,scene,camera);
 let visible=false,last=performance.now(),time=0;new IntersectionObserver(es=>{visible=es[0].isIntersecting}).observe(view);
 const m4=new T.Object3D(),overflowColor=new T.Color();
 function frame(now){requestAnimationFrame(frame);if(view.hidden||!visible||document.hidden){budget.idle();last=now;return}
  budget.tick(now);const dt=Math.min(.08,(now-last)/1000);last=now;time+=dt;wind.value=time;atmosphere.update(time);
  const w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==Math.floor(w*renderer.getPixelRatio())||canvas.height!==Math.floor(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
  ripple.offset.set(time*.01,-time*.05);
  // Storm: rain falls, the ponds fill, the last pond spills and the river turns brown.
  stormT=Math.max(0,Math.min(1,stormT+(storm?dt/18:-dt/10)));
  if(storm){const pos=rainGeo.attributes.position;for(let i=0;i<RN;i++){let y=pos.getY(i*2)-dt*14;if(y<0)y+=12;pos.setY(i*2,y);pos.setY(i*2+1,y-.45)}pos.needsUpdate=true}
  for(const p of [P1,P2,P3])p.surf.position.y=p.surf.userData.base+stormT*.16;
  const over=stormT>.75;spill.material.opacity=Math.max(0,(stormT-.75)*3.2);alert.hidden=!over;
  riverMat.color.copy(riverClean).lerp(riverDirty,Math.max(0,(stormT-.7)*2.5));
  // Methane bubbles swell, pop and drift up as CH4 (and a little H2S).
  if(bubbles.visible){bub.forEach((b,i)=>{const f=(b.ph+time*b.sp*.4)%1;m4.position.set(b.x,P1.surf.position.y+.02,b.z);m4.scale.setScalar(f<.8?.02+f*.07:.0001);m4.updateMatrix();bubbles.setMatrixAt(i,m4.matrix)});bubbles.instanceMatrix.needsUpdate=true;
   gas.forEach(s=>{const f=(s.userData.o+time*.06)%1;s.position.set(s.userData.x+Math.sin(time*.5+s.userData.o*9)*.4,.7+f*4,s.userData.z+f*1.2);const k=.55+f*.4;s.scale.set(k,k*.5,1);s.material.opacity=f<.15?f/.15:1-(f-.15)/.85})}
  aerators.forEach((r,i)=>{r.rotation.y=time*(5+i)});splash.forEach(s=>{const f=(s.userData.o+time*.9)%1,a=s.userData.o*6.28*2;s.position.set(s.userData.a.position.x+Math.cos(a)*(.3+f*.4),.5+Math.sin(f*Math.PI)*.35,s.userData.a.position.z+Math.sin(a)*(.3+f*.4));s.scale.setScalar(.18+f*.2);s.material.opacity=.6*(1-f)});
  smoke.forEach(s=>{const f=(s.userData.o+time*.05)%1;s.position.set(-11.2+f*2.5,4.6+f*4,-1.9+f*1.2);s.scale.setScalar(.6+f*2.4);s.material.opacity=.45*(1-f)});
  fish.forEach(f=>{const c=(time*.5+f.userData.o)%5;const healthy=stormT<.6;f.visible=healthy&&c<.7;if(f.visible){f.position.y=.05+Math.sin(c/.7*Math.PI)*.45;f.rotation.z=Math.cos(c/.7*Math.PI)*.9}});
  for(const fn of live)fn(dt,time);
  arm.rotation.z=-.25+Math.sin(time*.6)*.25;fore.rotation.z=-.3+Math.sin(time*.6+1)*.35;
  // Smooth orbit camera.
  const k=1-Math.exp(-dt*6);sy+=(yaw-sy)*k;sp+=(pitch-sp)*k;sd+=(dist-sd)*k;look.lerp(goal,k);
  camera.position.set(look.x+sd*Math.cos(sp)*Math.sin(sy),look.y+sd*Math.sin(sp),look.z+sd*Math.cos(sp)*Math.cos(sy));camera.lookAt(look);
  renderer.render(scene,camera);budget.end();
 }
 requestAnimationFrame(frame);
 // Show this view (and hide the old flat diagram) whenever Conventional ponds is the active pathway.
 function sync(){const on=option.classList.contains('active');view.hidden=!on;if(on){diagram.style.display='none';budget.refreshShadows()}}
 new MutationObserver(sync).observe(option,{attributes:true,attributeFilter:['class']});sync();
 canvas.addEventListener('webglcontextlost',()=>{view.remove();delete panel.dataset.ponds3d;diagram.style.display=''});
 if(new URLSearchParams(location.search).has('debug'))window.__ponds={renderer,scene,camera,budget,inspect};
}
