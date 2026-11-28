import * as T from './three.module.min.js';
import {seeds,smooth,band,lerpPath} from './molecules.mjs?v=shift20';
import {wind,windify,texture,corrugated,sign,blobShadow,mergeStatic,sky,grass,asphalt,oilPalm,palmMaterial} from './life.mjs?v=shift20';
import {fauna} from './fauna.mjs?v=shift20';

/*
 Extra life for the Mill Arcade diorama: the mill that produces the POME, the hot feed
 line, a biogas flare, the grid connection, flowing pipe parcels, unit labels and a
 living river (reeds, jumping fish, ripples, birds). Molecule-scale effects are written
 into the shared chemistry pools through hook(), so they share its draw calls.
*/
export function arcadeScenery(scene,{steel,brass,dark,concrete,teal,roof},{isPond,isPolluted}){
 const mat=(color,r=.6,m=.1,extra={})=>new T.MeshStandardMaterial({color,roughness:r,metalness:m,...extra});
 function add(geo,m,x,y,z,parent=scene){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o}
 const box=(x,y,z,w,h,d,m,p)=>add(new T.BoxGeometry(w,h,d),m,x,y+h/2,z,p);
 const cyl=(x,y,z,r,h,m,p,r2=r)=>add(new T.CylinderGeometry(r,r2,h,18),m,x,y+h/2,z,p);
 function pipe(a,b,r,m,p){const s=new T.Vector3(...a),e=new T.Vector3(...b),d=e.clone().sub(s);const o=add(new T.CylinderGeometry(r,r,d.length(),12),m,...s.clone().lerp(e,.5).toArray(),p);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o}
 const line=(pts,r,m,p)=>pts.slice(1).forEach((q,i)=>pipe(pts[i],q,r,m,p));
 function label(text,x,y,z,w,color='#e3ead9'){
  const c=document.createElement('canvas');c.width=1024;c.height=192;const g=c.getContext('2d');g.scale(2,2);g.fillStyle='rgba(23,45,43,.92)';g.beginPath();g.roundRect(4,4,504,88,14);g.fill();
  g.fillStyle=color;g.font='bold 44px Arial';g.textAlign='center';g.fillText(text,256,63);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const s=new T.Sprite(new T.SpriteMaterial({map:tex,depthWrite:false}));s.position.set(x,y,z);s.scale.set(w,w*96/512,1);s.userData.info=text.toLowerCase();scene.add(s);return s;
 }

 /* ---- palm oil mill: press house, boiler chimney, FFB bin ---- */
 const wall=mat(0xc9c1a8,.85),tin=mat(0x8a9a90,.45,.5),rust=mat(0x9c5a35,.8,.2);
 box(-6.7,0,-2.6,1.6,1.25,1.4,wall);
 const r1=box(-6.7,1.25,-2.95,1.75,.06,.82,tin);r1.rotation.x=.32;const r2=box(-6.7,1.25,-2.25,1.75,.06,.82,tin);r2.rotation.x=-.32;
 box(-6.7,0,-1.89,.55,.8,.04,dark);for(let k=0;k<3;k++)box(-7.25+k*.55,.75,-1.89,.3,.22,.03,mat(0x9fd4e0,.2,.3,{emissive:0x3a6a70,emissiveIntensity:.5}));
 cyl(-6.15,1.0,-3.0,.14,2.35,dark,scene,.18);cyl(-6.15,2.95,-3.0,.155,.12,rust);
 for(let k=0;k<4;k++){const a=k*Math.PI/2;pipe([-6.15,2.2,-3.0],[-6.15+Math.cos(a)*.9,0,-3.0+Math.sin(a)*.9],.008,steel)}
 box(-7.75,0,-2.0,.6,.45,.55,rust);for(let k=0;k<9;k++)add(new T.SphereGeometry(.07,7,5),mat(k%2?0x7a2d1d:0x4e2a18,.7),-7.95+(k%3)*.2,.5,-2.15+Math.floor(k/3)*.15);
 label('PALM OIL MILL',-6.7,1.95,-2.6,1.6);
 // Hot raw POME feed line from the mill's clarification station.
 const feed=[[-5.95,.75,-2.2],[-5.95,.75,-.1],[-4.85,.75,-.1],[-4.85,.48,-.1]];line(feed,.06,steel);
 for(const z of [-1.6,-.8])pipe([-5.95,0,z],[-5.95,.72,z],.022,dark);

 /* ---- biogas flare and grid connection ---- */
 line([[2.1,1.5,-3.6],[.9,1.5,-3.6]],.05,brass);cyl(.9,0,-3.6,.075,2.65,steel);cyl(.9,0,-3.6,.22,.08,concrete);
 cyl(.9,2.6,-3.6,.11,.12,dark);for(let k=0;k<3;k++){const a=k*2.094;pipe([.9,2.3,-3.6],[.9+Math.cos(a)*.7,0,-3.6+Math.sin(a)*.7],.007,steel)}
 const flameMat=mat(0xffa43a,.4,0,{emissive:0xff7a1a,emissiveIntensity:2.2,transparent:true,opacity:.92});
 const flame=add(new T.ConeGeometry(.1,.42,10),flameMat,.9,2.95,-3.6);flame.castShadow=false;
 const core=add(new T.ConeGeometry(.05,.22,8),mat(0xfff0a0,.4,0,{emissive:0xffe27a,emissiveIntensity:2.5}),.9,2.86,-3.6);core.castShadow=false;
 const flareTag=label('FLARE',.9,3.45,-3.6,.75,'#ffd39b');
 box(1.78,.45,-3.45,.12,.3,.25,mat(0x3d5552));for(let k=0;k<5;k++)box(1.71,.5+k*.05,-3.45,.01,.015,.22,steel);
 cyl(5.0,0,-3.3,.05,1.85,mat(0x7b6a52,.9,0));box(5.0,1.72,-3.3,.07,.05,.55,dark);for(const dz of [-.22,0,.22])cyl(5.0,1.77,-3.3+dz,.025,.08,mat(0xdfe8e2,.3,.1));
 const cable=[[4.35,.95,-3.1],[5.0,1.8,-3.3],[5.0,1.8,-4.55]];line(cable,.012,mat(0x151a1a,.8,0));
 label('TO MILL GRID',5.0,2.2,-3.3,1.15,'#ffe27a');

 /* ---- unit labels and pipe flow parcels ---- */
 label('INTAKE',-4,1.0,-.7,.95);label('DIGESTER',-.9,3.15,-1.65,1.2);label('GAS ENGINE',3.1,2.0,-3.1,1.3);
 label('POLISHING',3,1.05,-.35,1.3);label('SLUDGE YARD',-2.6,1.05,2.55,1.4);label('RIVER',-3.2,.6,4.75,.9,'#bfe8f0');
 const streams=[
  {pts:[[-3,.36,-.8],[-2.5,.36,-.8],[-2.5,.36,-1.65]],r:.08,tint:0x9a6a38},
  {pts:[[.46,.38,-1.65],[.99,.38,-1.65],[.99,.38,-.35],[1.6,.38,-.35]],r:.08,tint:0x8f9a58},
  {pts:[[-.9,2.41,-1.65],[-.9,2.7,-1.65],[-.9,2.7,-3.6],[2.1,2.7,-3.6],[2.1,.55,-3.6]],r:.075,tint:0xffc94a,gas:true},
  {pts:[[4.52,.39,-.35],[5.2,.39,-.35],[5.2,.39,4.05],[5.2,.19,4.05]],r:.09,tint:0x9fe3d6},
  {pts:[[-4.15,.2,3.27],[-1.05,.2,3.27]],r:.065,tint:0x7fc4e8},
  {pts:feed,r:.06,tint:0x9a6a38}
 ].map(s=>{const path=new T.CurvePath();s.pts.slice(1).forEach((p,i)=>path.add(new T.LineCurve3(new T.Vector3(...s.pts[i]),new T.Vector3(...p))));
  const look=mat(s.tint,.3,0,{emissive:s.tint,emissiveIntensity:.5});const n=Math.max(3,Math.round(path.getLength()*1.6));
  const beads=Array.from({length:n},()=>{const b=add(new T.SphereGeometry(s.r*1.32,10,7),look,0,0,0);b.castShadow=false;return b});
  return {...s,path,beads,speed:.45/path.getLength()}});

 /* ---- river life: reeds, fish, ripples, birds ---- */
 const reedGeo=new T.ConeGeometry(.025,1,5),reeds=new T.InstancedMesh(reedGeo,mat(0x5f8a3e,.85,0),90),o=new T.Object3D();
 const RS=seeds(90,4,101);RS.forEach(([a,b,c,d],i)=>{const bank=i%2?3.82:5.68;o.position.set(-7.7+a*15.4,.12+.14*c,bank+(b-.5)*.18);o.scale.set(1,.25+.3*c,1);o.rotation.set((d-.5)*.3,0,(b-.5)*.35);o.updateMatrix();reeds.setMatrixAt(i,o.matrix)});
 reeds.castShadow=true;scene.add(reeds);
 const fishMat=mat(0xa9b8b8,.3,.6),finMat=mat(0x6d7d7c,.5,.3);
 const FS=seeds(7,4,103);const fish=FS.map(()=>{const g=new T.Group();add(new T.SphereGeometry(1,10,7),fishMat,0,0,0,g).scale.set(.11,.04,.035);const tail=add(new T.ConeGeometry(.04,.07,4),finMat,-.13,0,0,g);tail.rotation.z=Math.PI/2;g.visible=false;scene.add(g);return {g,tail}});
 const rippleGeo=new T.TorusGeometry(1,.06,4,28);rippleGeo.rotateX(Math.PI/2);
 const ripples=Array.from({length:10},()=>{const m=add(rippleGeo,new T.MeshBasicMaterial({color:0xd8f2ee,transparent:true,opacity:0,depthWrite:false}),0,.105,0);m.castShadow=m.receiveShadow=false;return {m,born:-99,x:0,z:0}});
 let rippleIndex=0;function ripple(x,z,t){const r=ripples[rippleIndex++%ripples.length];r.born=t;r.x=x;r.z=z}
 const birdMat=mat(0x24302c,.8,0,{side:T.DoubleSide});const wingGeo=new T.BufferGeometry();wingGeo.setAttribute('position',new T.Float32BufferAttribute([0,0,-.05,0,0,.05,.22,0,0],3));wingGeo.computeVertexNormals();
 const birds=[0,1,2,3].map(()=>{const g=new T.Group();const l=add(wingGeo,birdMat,0,0,0,g),r=add(wingGeo,birdMat,0,0,0,g);r.rotation.y=Math.PI;add(new T.SphereGeometry(.03,6,4),birdMat,0,0,0,g);scene.add(g);return {g,l,r}});

 const S={smoke:seeds(22,3,107),pour:seeds(10,3,109),steam:seeds(14,3,113),compost:seeds(16,3,127),air:seeds(10,3,131),spark:seeds(9,1,137),splash:seeds(14,3,139),scum:seeds(16,3,149),flare:seeds(12,3,151)};
 const lastJump=fish.map(()=>-1),spot=[0,0,0];let lastOutfall=-1;
 function update(t){
  const pond=isPond(),dirty=isPolluted();
  flame.visible=core.visible=flareTag.visible=!pond;
  const fl=.85+.25*Math.sin(t*17)+.12*Math.sin(t*41);flame.scale.set(1+.1*Math.sin(t*23),fl,1+.1*Math.cos(t*19));flame.position.y=2.95+.05*fl;core.scale.y=fl;
  for(const s of streams){const on=!(s.gas&&pond);s.beads.forEach((b,k)=>{b.visible=on;if(on)b.position.copy(s.path.getPoint((t*s.speed+k/s.beads.length)%1))})}
  // Fish jump less often, and fewer of them, when the river is polluted.
  fish.forEach((f,i)=>{const [a,b,c,d]=FS[i],period=6+4*a,ph=((t+d*period)%period)/period,jump=.13;
   const active=!dirty||i<2;const cycle=Math.floor((t+d*period)/period);
   if(active&&ph<jump){const k=ph/jump,x=-6.5+((b*13+cycle*2.7)%13),z=4.15+c*1.2;f.g.visible=true;f.g.position.set(x+.6*k,.06+.32*Math.sin(Math.PI*k),z);f.g.rotation.z=.9*(.5-k)*2;f.tail.rotation.y=.5*Math.sin(t*30);
    if(k>.9&&lastJump[i]!==cycle){lastJump[i]=cycle;ripple(x+.6,z,t)}}else f.g.visible=false});
  for(const r of ripples){const age=t-r.born;if(age<0||age>1.6){r.m.material.opacity=0;continue}r.m.position.set(r.x,.105,r.z);r.m.scale.setScalar(.05+.32*age);r.m.material.opacity=.55*(1-age/1.6)}
  birds.forEach(({g,l,r},i)=>{const a=t*.25+i*1.57,R=2.2+.6*i;g.position.set(-1+R*Math.cos(a),2.6+.3*Math.sin(t*.7+i),4.5+.8*Math.sin(a));g.rotation.y=-a;const flap=.6*Math.sin(t*9+i);l.rotation.x=flap;r.rotation.x=-flap});
  const beat=Math.floor(t/1.4);if(beat!==lastOutfall){lastOutfall=beat;ripple(5.2+Math.random()*.1,4.1,t)}
 }
 function hook(C,t){
  const pond=isPond(),dirty=isPolluted();
  for(const [a,b,c] of S.smoke){const f=(a+t/8)%1;C.put('steam',-6.15+.9*f+(b-.5)*.15,3.1+1.9*f,-3.0+.4*f*(c-.5),(.12+.42*f)*(1-smooth(band(f,.8,1))),c*9)}
  for(const [a,b,c] of S.pour){const f=(a+t*.9)%1;C.put(b<.7?'h2o':'cod',-4.85+(c-.5)*.04,.45-f*.1,-.1,.032,t*3+c*5)}
  for(const [a,b,c] of S.steam){const f=(a+t*.12)%1;C.put('steam',-4.9+b*1.8+.15*f,.42+f*.8,-1.6+c*1.8,(.04+.12*f)*(1-smooth(band(f,.72,1))),c*3)}
  for(const [a,b,c] of S.compost){const f=(a+t*.1)%1,heap=Math.floor(b*5),hx=heap<4?-3.8+heap*.8:-5.85,hz=heap<4?2.55:2.6;C.put('steam',hx+(c-.5)*.3+.1*f,.35+.7*f,hz,(.04+.1*f)*(1-smooth(band(f,.7,1))),c*3)}
  if(!pond){
   for(const [a,b,c] of S.air){const f=(a+t/3)%1,k=smooth(f);C.put('o2',1.2+.5*k,.6+(b-.5)*.25*(1-k),-3.45+(c-.5)*.3*(1-k),.024*(1-band(f,.9,1)),t*2+b*9)}
   for(const [a] of S.spark){const v=lerpPath(cable,(a+t*.5)%1,spot);C.put('spark',v[0],v[1]+.02,v[2],.02,t*6+a*9)}
   for(const [a,b,c] of S.flare){const f=(a+t/2.2)%1;C.put(b<.33?'co2':'h2o',.9+.35*f+(c-.5)*.1,3.15+.9*f,-3.6+(b-.5)*.15,.028*(1-smooth(band(f,.7,1))),t*2+c*9)}
  }
  for(const [a,b,c] of S.splash){const f=(a+t*1.1)%1;C.put('h2o',5.2+.25*f+(b-.5)*.06,.17-.09*f+.05*Math.sin(Math.PI*f),4.1+(c-.5)*.12,.026,t*3+c*9)}
  if(dirty)for(const [a,b,c] of S.scum){const f=(a+t/18)%1;C.stretch('floc',5.2+f*2.6,.11,4.1+b*1.1,.07+.05*c,.012,.05+.04*c,c*6)}
 }
 return {update,hook};
}

/*
 Second layer of arcade life, matched to the main simulator: sky and clouds, swaying grass,
 an FFB lorry tipping bunches into the mill's reception hopper with a moving conveyor,
 polishing-basin blowers with their air main, a control room, safety signs, lamps,
 extinguishers, a safety shower, a windsock and butterflies. Scales with the quality tier.
*/
export function arcadeExtras(scene,{steel,brass,dark,concrete,teal},tier){
 const q=tier.scenery;let seed=4242;const rnd=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
 const mat=(color,r=.6,m=.1,extra={})=>new T.MeshStandardMaterial({color,roughness:r,metalness:m,...extra});
 const stat=new T.Group();scene.add(stat);
 function add(geo,m,x,y,z,parent=stat,shadow=true){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o}
 const box=(x,y,z,w,h,d,m,p=stat)=>add(new T.BoxGeometry(w,h,d),m,x,y+h/2,z,p);
 const cyl=(x,y,z,r,h,m,p=stat,r2=r)=>add(new T.CylinderGeometry(r,r2,h,16),m,x,y+h/2,z,p);
 function pipe(a,b,r,m,p=stat){const s=new T.Vector3(...a),e=new T.Vector3(...b),d=e.clone().sub(s);const o=add(new T.CylinderGeometry(r,r,d.length(),12),m,...s.clone().lerp(e,.5).toArray(),p);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o}
 const line=(pts,r,m)=>pts.slice(1).forEach((p,i)=>pipe(pts[i],p,r,m));
 function signPost(spec,x,z,face=0,h=.7){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=face;scene.add(g);add(new T.CylinderGeometry(.02,.02,h,8),steel,0,h/2,0,g);add(new T.BoxGeometry(.5,.32,.02),dark,0,h,.01,g);add(new T.PlaneGeometry(.48,.3),new T.MeshStandardMaterial({map:sign(spec),roughness:.6}),0,h,.022,g,false).userData.info=spec.title.toLowerCase()}
 const atmosphere=sky(scene,{sunDir:new T.Vector3(-8,12,5),horizon:0xb0c3b6});scene.background=null;scene.fog=new T.FogExp2(0xadc0b4,.013);
 // Grass tufts on open ground only.
 const keepOut=[[-5.3,-2.7,-1.95,.55],[-2.65,.8,-3.35,.15],[1.5,4.65,-4.3,-1.95],[.45,4.85,-1.75,1.05],[-4.65,-.55,1.6,3.5],[-6.15,-5.25,-3.75,1.75],[-7.7,-5.75,-3.45,-1.75],[-7.75,-6.55,-1.35,2.35],[4.85,6.05,-.55,1.1],[6.2,7.8,1.85,3.0],[6.25,7.7,-1.15,.05],[-8,8,.78,1.72],[5.85,6.25,-2,3.5]];
 const tuftGeo=new T.ConeGeometry(.03,.2,4,1,true);tuftGeo.translate(0,.1,0);
 const tufts=new T.InstancedMesh(tuftGeo,windify(new T.MeshStandardMaterial({color:0x6c8f43,roughness:.9,side:T.DoubleSide}),{strength:1.2,base:0}),Math.round(700*q)),o=new T.Object3D();
 let n=0,guard=0;while(n<tufts.count&&guard++<20000){const x=(rnd()-.5)*15.6,z=(rnd()-.5)*11.6;if(z>3.7||keepOut.some(([a,b,c,d])=>x>a&&x<b&&z>c&&z<d))continue;o.position.set(x,0,z);o.rotation.set((rnd()-.5)*.4,rnd()*6,(rnd()-.5)*.4);o.scale.set(1,.6+rnd()*.9,1);o.updateMatrix();tufts.setMatrixAt(n++,o.matrix)}tufts.count=n;scene.add(tufts);

 /* FFB reception: lorry tips bunches into a hopper; a conveyor carries them into the mill. */
 box(-7.2,0,-1.0,.8,.18,.55,concrete);box(-7.2,.18,-1.0,.7,.06,.45,dark);
 const conveyorPts=[[-7.2,.24,-1.0],[-7.2,1.05,-1.88]];pipe([-7.45,.2,-1.0],[-7.45,1.05,-1.88],.025,steel);pipe([-6.95,.2,-1.0],[-6.95,1.05,-1.88],.025,steel);
 const belt=pipe([-7.2,.22,-1.0],[-7.2,1.03,-1.88],.2,mat(0x2a2d2c,.9));belt.scale.z=.12;for(const k of [.3,.7])pipe([-7.2,.22+.81*k-.1,-1.0-.88*k],[-7.2,0,-1.0-.88*k],.02,steel);
 const lorry=new T.Group();lorry.position.set(-7.2,0,.95);scene.add(lorry);lorry.userData.info='lorry';
 const cab=mat(0x2f6fa6,.4,.4);box(0,.18,.85,.68,.6,.5,cab,lorry);box(0,.48,.6,.6,.24,.02,mat(0x9fd8e6,.15,.4),lorry);box(0,.18,0,.68,.08,1.7,dark,lorry);
 const bedPivot=new T.Group();bedPivot.position.set(0,.3,-.72);lorry.add(bedPivot);const wood=mat(0x8c6a3b,.8);
 box(0,0,.62,.66,.05,1.25,wood,bedPivot);for(const s of [-1,1])box(s*.32,0,.62,.03,.32,1.25,wood,bedPivot);box(0,0,1.23,.66,.32,.03,wood,bedPivot);
 const bunchGeo=new T.IcosahedronGeometry(.085,1),bunchMat=mat(0x6a1f15,.75),load=new T.InstancedMesh(bunchGeo,bunchMat,18);
 for(let k=0;k<18;k++){o.position.set(-.2+(k%3)*.2,.1+Math.floor(k/9)*.12,.2+(Math.floor(k/3)%3)*.38);o.rotation.set(rnd()*3,rnd()*3,0);o.scale.setScalar(.9+rnd()*.3);o.updateMatrix();load.setMatrixAt(k,o.matrix)}bedPivot.add(load);
 for(const [z,s] of [[.85,1],[.85,-1],[-.5,1],[-.5,-1]]){const w=add(new T.CylinderGeometry(.14,.14,.1,12),mat(0x1b1d1d,.9),s*.36,.14,z,lorry);w.rotation.z=Math.PI/2}
 const lorryShadow=blobShadow(1.1,.3);lorryShadow.scale.set(.6,1,1);lorryShadow.position.y=.005;lorry.add(lorryShadow);
 const beltBunches=new T.InstancedMesh(bunchGeo,bunchMat,10);beltBunches.castShadow=false;scene.add(beltBunches);
 const falling=new T.InstancedMesh(bunchGeo,bunchMat,8);falling.castShadow=false;scene.add(falling);
 signPost({title:'FFB RECEPTION',band:'#1f4d3f',lines:['Lorries tip here','Keep clear'],symbol:'!'},-6.45,-1.3,0,.6);

 /* Polishing-basin blowers and air main. */
 box(6.95,0,-.55,1.1,.1,.9,concrete);const fans=[];
 for(const dz of [-.22,.22]){box(6.95,.1,-.55+dz,.5,.22,.3,mat(0x3e6a8a,.45,.4));cyl(7.25,.17,-.55+dz,.08,.2,mat(0x2f4e65,.4,.5));const f=new T.Group();f.position.set(6.66,.24,-.55+dz);scene.add(f);
  for(let k=0;k<4;k++){const b=add(new T.BoxGeometry(.01,.12,.03),dark,0,0,0,f,false);b.position.set(0,Math.cos(k*1.57)*.05,Math.sin(k*1.57)*.05);b.rotation.x=k*1.57}fans.push(f)}
 box(6.95,.98,-.55,1.2,.04,1.0,dark);for(const [dx,dz] of [[-.55,-.45],[.55,-.45],[-.55,.45],[.55,.45]])box(6.95+dx,.1,-.55+dz,.04,.88,.04,steel);
 const airMain=[[6.55,.4,-.55],[6.55,1.45,-.55],[6.55,1.45,-.91],[4.62,1.45,-.91],[4.62,.45,-.91],[4.33,.45,-.91],[4.33,.16,-.91]];line(airMain,.04,mat(0x8fb2c4,.4,.5));
 /* Control room. */
 const clad=new T.MeshStandardMaterial({map:texture(corrugated(tier.texture,'#7f97a3'),{repeat:[2,1]}),roughness:.55,metalness:.35});
 box(7.0,0,2.4,1.35,.08,.95,concrete);box(7.0,.08,2.4,1.25,.72,.85,clad);box(7.0,.8,2.4,1.35,.05,.95,dark);
 const glass=mat(0x9fd8e6,.15,.4,{emissive:0x5ab4c8,emissiveIntensity:.35});box(6.8,.38,1.97,.5,.26,.02,glass);box(7.4,.08,1.97,.26,.56,.02,mat(0x435a62,.5,.3));
 const beacon=add(new T.SphereGeometry(.03,8,6),mat(0xff3b2f,.3,0,{emissive:0xff2a1a,emissiveIntensity:1}),6.5,1.1,2.6,scene,false);cyl(6.5,.85,2.6,.012,.22,steel);
 /* Safety furniture, lamps and windsock. */
 signPost({title:'DANGER',lines:['BIOGAS','NO NAKED FLAMES'],symbol:'!'},-1.95,.32);
 signPost({title:'CAUTION',band:'#e0a321',lines:['HOT EFFLUENT','about 80 °C'],symbol:'!'},-2.6,.62);
 signPost({title:'SAMPLE POINT',band:'#1f6fb0',lines:['WEAR GLOVES','AND GOGGLES'],symbol:'i'},4.15,1.12);
 signPost({title:'PPE REQUIRED',band:'#1f6fb0',lines:['HELMET · BOOTS','GLOVES · VEST'],symbol:'✓'},7.45,1.5);
 signPost({title:'FLAMMABLE',lines:['FLARE ZONE','PERMIT ONLY'],symbol:'!'},1.25,-4.0);
 const red=mat(0xc8291f,.35,.3);for(const [x,z] of [[-3.15,-.2],[1.95,-1.95],[5.65,-1.55]]){cyl(x,0,z,.06,.36,red);cyl(x,.36,z,.03,.05,dark)}
 const green=mat(0x2c9c5a,.5,.3);for(const dx of [-.18,.18])box(4.85+dx,0,-2.3,.04,1.6,.04,green);box(4.85,1.58,-2.3,.4,.04,.04,green);cyl(4.85,1.38,-2.3,.08,.05,steel,stat,.04);
 add(new T.PlaneGeometry(.32,.2),new T.MeshStandardMaterial({map:sign({title:'SAFETY SHOWER',band:'#2c9c5a',lines:['EYE WASH'],symbol:'+'})}),4.85,1.05,-2.27,scene,false).userData.info='safety shower';
 const lampHead=mat(0xfff6d8,.4,0,{emissive:0xfff1c4,emissiveIntensity:.6});for(const [x,z] of [[-4,-4.3],[0,-4.3],[4,-4.3],[-7.6,3.5],[7.6,3.5]]){cyl(x,0,z,.035,2.2,dark);box(x,2.1,z+.2,.05,.04,.4,dark);box(x,2.03,z+.38,.18,.05,.1,lampHead)}
 cyl(-7.6,0,-3.9,.025,2.6,mat(0xdfe5e0,.4,.4));const sock=new T.Group();sock.position.set(-7.6,2.62,-3.9);scene.add(sock);
 const sockTex=new T.CanvasTexture((()=>{const c=document.createElement('canvas');c.width=128;c.height=32;const g=c.getContext('2d');for(let k=0;k<5;k++){g.fillStyle=k%2?'#f4f1e6':'#e8642c';g.fillRect(k*25.6,0,25.6,32)}return c})());
 const sockBody=new T.Mesh(new T.CylinderGeometry(.06,.11,.6,12,4,true),new T.MeshStandardMaterial({map:sockTex,side:T.DoubleSide,roughness:.8}));sockBody.rotation.z=Math.PI/2;sockBody.position.x=.32;sock.add(sockBody);
 const flyMat=mat(0xf2b93a,.6,0,{side:T.DoubleSide}),wingGeo=new T.PlaneGeometry(.06,.05);wingGeo.translate(.03,0,0);
 const flies=Array.from({length:Math.round(6*Math.max(.4,q))},()=>{const g=new T.Group();const l=new T.Mesh(wingGeo,flyMat),r=new T.Mesh(wingGeo,flyMat);r.rotation.y=Math.PI;g.add(l,r);scene.add(g);return {g,l,r,cx:(rnd()-.5)*12,cz:3.2+rnd()*.4,ph:rnd()*9}});
 mergeStatic(stat);
 const conv=new T.CurvePath();conv.add(new T.LineCurve3(new T.Vector3(...conveyorPts[0]),new T.Vector3(...conveyorPts[1])));const pv=new T.Vector3();
 function update(t){
  wind.value=t;atmosphere.update(t);for(const f of fans)f.rotation.x=t*20;beacon.material.emissiveIntensity=(t%1.6)<.15?3:.2;
  const dir=.6+.35*Math.sin(t*.11);sock.rotation.y=dir+.12*Math.sin(t*1.7);sock.rotation.z=-.25+.18*Math.sin(t*.9)+.05*Math.sin(t*7);
  // Tipping cycle: raise the bed, bunches roll into the hopper, lower the bed.
  const c=(t%24)/24,raise=c<.15?smooth(c/.15):c<.45?1:c<.6?1-smooth((c-.45)/.15):0;bedPivot.rotation.x=-.75*raise;load.visible=c<.3||c>.75;
  for(let k=0;k<8;k++){const f=band(c,.17+k*.015,.3+k*.015);if(f<=0||f>=1){o.scale.setScalar(0)}else{o.position.set(-7.2+(k%3-1)*.15,.55*(1-f)+.12*Math.sin(Math.PI*f),.2-1.0*f);o.scale.setScalar(1);o.rotation.set(t*5+k,k,0)}o.updateMatrix();falling.setMatrixAt(k,o.matrix)}falling.instanceMatrix.needsUpdate=true;
  for(let k=0;k<10;k++){conv.getPoint((t*.12+k/10)%1,pv);o.position.set(pv.x+(k%2?.05:-.05),pv.y+.1,pv.z);o.rotation.set(k,k*2,0);o.scale.setScalar(1);o.updateMatrix();beltBunches.setMatrixAt(k,o.matrix)}beltBunches.instanceMatrix.needsUpdate=true;
  for(const f of flies){const k=t*.5+f.ph;f.g.position.set(f.cx+1.1*Math.sin(k*.7)+.3*Math.sin(k*3.1),.1+.25*Math.abs(Math.sin(k*1.3)),f.cz+.4*Math.sin(k*.9));f.g.rotation.y=k;const flap=1.1*Math.sin(t*28+f.ph);f.l.rotation.y=flap;f.r.rotation.y=Math.PI-flap}
 }
 return {update,airMain};
}

/*
 Third layer of arcade detail: a walkway bridge with a live dissolved-oxygen probe over
 the polishing basin, the river outfall (headwall, flap gate, rip-rap) with a floating oil
 boom, a driver in the lorry cab, steam from the mill's steriliser vents, a local control
 panel with blinking status lights, valve handwheels on the pipe runs, reflective puddles
 and pebbles along the walkway. Everything is clickable for an explanation.
*/
export function arcadeDetails(scene,{steel,dark,concrete},tier,{isPolluted}){
 let seed=777;const rnd=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
 const mat=(color,r=.6,m=.1,extra={})=>new T.MeshStandardMaterial({color,roughness:r,metalness:m,...extra});
 const stat=new T.Group();scene.add(stat);
 function add(geo,m,x,y,z,parent=stat,shadow=true){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o}
 const box=(x,y,z,w,h,d,m,p=stat)=>add(new T.BoxGeometry(w,h,d),m,x,y+h/2,z,p);
 const cyl=(x,y,z,r,h,m,p=stat,r2=r,n=12)=>add(new T.CylinderGeometry(r,r2,h,n),m,x,y+h/2,z,p);
 const o=new T.Object3D();
 const hit=(key,x,y,z,w,h,d)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshBasicMaterial({visible:false}));m.position.set(x,y,z);m.userData.info=key;scene.add(m)};
 const grate=mat(0x8d9a93,.5,.5),rail=mat(0xe8c440,.45,.3);

 /* Walkway bridge across the polishing basin with a DO probe and live display. */
 box(3.0,.5,-.35,.4,.04,2.3,grate);for(let k=0;k<12;k++)box(3.0,.505,-1.45+k*.2,.38,.008,.02,dark);
 for(const s of [-1,1]){box(3.0+s*.19,.54,-.35,.025,.025,2.3,rail);box(3.0+s*.19,.75,-.35,.025,.025,2.3,rail);for(let k=0;k<5;k++)box(3.0+s*.19,.5,-1.45+k*.55,.025,.28,.025,rail)}
 cyl(3.12,.18,-.35,.012,.4,steel);cyl(3.12,.12,-.35,.025,.08,dark);
 const doCanvas=document.createElement('canvas');doCanvas.width=256;doCanvas.height=128;const doTex=new T.CanvasTexture(doCanvas);doTex.colorSpace=T.SRGBColorSpace;
 box(3.19,.66,-.35,.03,.16,.24,mat(0xdfe3de,.5));const screen=add(new T.PlaneGeometry(.2,.1),new T.MeshStandardMaterial({map:doTex,emissive:0xffffff,emissiveMap:doTex,emissiveIntensity:.8}),3.206,.74,-.35,scene,false);screen.rotation.y=Math.PI/2;
 let doText='';function drawDO(t){const dirty=isPolluted(),v=(dirty?.6:2.1)+.08*Math.sin(t*.7);const text=`DO ${v.toFixed(1)} mg/L`;if(text===doText)return;doText=text;const g=doCanvas.getContext('2d');g.fillStyle='#10231f';g.fillRect(0,0,256,128);g.fillStyle=dirty?'#ff9b6b':'#9ff5b8';g.font='bold 44px monospace';g.textAlign='center';g.fillText(text,128,62);g.font='22px monospace';g.fillStyle='#cfe1d6';g.fillText(dirty?'LOW — check blowers':'aeration OK',128,100);doTex.needsUpdate=true}
 hit('do probe',3.0,.65,-.35,.5,.4,2.3);

 /* River outfall: headwall, flap gate, rip-rap and a floating oil boom. */
 box(5.2,0,3.82,.9,.34,.16,concrete);for(const s of [-1,1])box(5.2+s*.48,0,3.95,.12,.3,.4,concrete);
 const flap=add(new T.CylinderGeometry(.11,.11,.03,16),mat(0x2f3a38,.5,.5),5.2,.19,3.92);flap.rotation.x=Math.PI/2;
 const rocks=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),mat(0x8a8576,.9),Math.round(26*Math.max(.5,tier.scenery)));
 for(let k=0;k<rocks.count;k++){const a=-Math.PI*.1+rnd()*Math.PI*1.2,r=.35+rnd()*.45;o.position.set(5.2+Math.cos(a)*r*1.4,.04,3.95+Math.sin(a)*r*.6);o.rotation.set(rnd()*3,rnd()*3,rnd()*3);o.scale.set(.06+rnd()*.07,.04+rnd()*.04,.06+rnd()*.07);o.updateMatrix();rocks.setMatrixAt(k,o.matrix)}
 rocks.castShadow=rocks.receiveShadow=true;scene.add(rocks);hit('outfall',5.2,.15,3.95,1.2,.4,.6);
 const boomPts=[];for(let k=0;k<=16;k++){const a=Math.PI*(k/16);boomPts.push([5.2+Math.cos(a)*1.05,3.95+Math.sin(a)*.95])}
 const floats=new T.InstancedMesh(new T.CapsuleGeometry(.045,.1,3,8),mat(0xf08a24,.45,.05),boomPts.length);floats.castShadow=false;scene.add(floats);
 const skirt=new T.InstancedMesh(new T.BoxGeometry(1,.06,.012),mat(0xe1d3b0,.8),boomPts.length-1);scene.add(skirt);
 hit('oil boom',5.2,.1,4.5,2.3,.25,1.2);

 /* Driver in the lorry cab. */
 const lorry=scene.children.find(c=>c.userData.info==='lorry');let driverHead=null;
 if(lorry){const d=new T.Group();d.position.set(0,.42,.9);lorry.add(d);const skin=mat(0x9c6b4f,.7),shirt=mat(0x3f6fa0,.8);
  add(new T.BoxGeometry(.16,.18,.12),shirt,0,0,0,d,false);driverHead=add(new T.SphereGeometry(.06,12,9),skin,0,.15,0,d,false);add(new T.SphereGeometry(.064,12,6,0,Math.PI*2,0,Math.PI/2),mat(0x2a2a2a,.6),0,.17,0,driverHead.parent,false).position.set(0,.165,0);
  const wheel=add(new T.TorusGeometry(.06,.01,6,16),dark,0,.05,-.1,d,false);wheel.rotation.x=1.1}

 /* Local control panel with blinking status lights beside the digester. */
 cyl(-1.45,0,.5,.025,.55,steel);box(-1.45,.5,.5,.3,.4,.12,mat(0xc9cfca,.45,.3));
 const leds=[0x44ff77,0xffc23a,0xff4433].map((c,k)=>{const m=add(new T.SphereGeometry(.018,8,6),new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:1}),-1.53+k*.08,.82,.565,scene,false);return m});
 box(-1.45,.6,.565,.2,.1,.01,mat(0x1d2a28,.4));hit('control panel',-1.45,.6,.5,.35,.6,.2);

 /* Valve handwheels on the pipe runs. */
 const hw=mat(0xb8382c,.5,.2);for(const [x,y,z,ry] of [[-2.75,.36,-.8,0],[1.3,.38,-.35,Math.PI/2],[4.9,.39,-.35,Math.PI/2]]){cyl(x,y,z,.012,.16,steel);const w=add(new T.TorusGeometry(.065,.012,6,18),hw,x,y+.17,z);w.rotation.x=Math.PI/2;hit('handwheel',x,y+.12,z,.18,.25,.18)}

 /* Reflective puddles and pebbles along the walkway. */
 const puddleMat=new T.MeshStandardMaterial({color:0x5f7470,roughness:.05,metalness:.2,transparent:true,opacity:.75,polygonOffset:true,polygonOffsetFactor:-2});
 for(const [x,z,r] of [[-3.4,1.5,.32],[1.8,1.22,.26],[5.6,1.62,.22],[3.6,1.55,.24]]){const p=add(new T.CircleGeometry(r,22),puddleMat,x,.026,z,scene,false);p.rotation.x=-Math.PI/2;p.scale.set(1,.65,1);p.userData.info='puddle'}
 const pebbles=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),mat(0xa8a090,.9),Math.round(220*Math.max(.4,tier.scenery)));
 for(let k=0;k<pebbles.count;k++){const edge=k%2?.8:1.72;o.position.set(-7.5+rnd()*15,.02,edge+(rnd()-.5)*.12);o.rotation.set(rnd()*3,rnd()*3,rnd()*3);o.scale.setScalar(.012+rnd()*.022);o.updateMatrix();pebbles.setMatrixAt(k,o.matrix)}
 pebbles.receiveShadow=true;scene.add(pebbles);
 mergeStatic(stat);

 const steam=seeds(20,3,301);
 function update(t){
  drawDO(t);
  for(let k=0;k<boomPts.length;k++){const [x,z]=boomPts[k];o.position.set(x,.1+.012*Math.sin(t*2.2+k*.7),z);o.rotation.set(0,Math.atan2(boomPts[Math.min(k+1,boomPts.length-1)][1]-boomPts[Math.max(0,k-1)][1],boomPts[Math.min(k+1,boomPts.length-1)][0]-boomPts[Math.max(0,k-1)][0])*-1,Math.PI/2);o.scale.setScalar(1);o.updateMatrix();floats.setMatrixAt(k,o.matrix)}
  floats.instanceMatrix.needsUpdate=true;
  for(let k=0;k<boomPts.length-1;k++){const [x1,z1]=boomPts[k],[x2,z2]=boomPts[k+1];o.position.set((x1+x2)/2,.07+.01*Math.sin(t*2.2+k*.7),(z1+z2)/2);o.rotation.set(0,-Math.atan2(z2-z1,x2-x1),0);o.scale.set(Math.hypot(x2-x1,z2-z1),1,1);o.updateMatrix();skirt.setMatrixAt(k,o.matrix)}
  skirt.instanceMatrix.needsUpdate=true;
  leds[0].material.emissiveIntensity=1.6;leds[1].material.emissiveIntensity=(t%2)<1?1.8:.15;leds[2].material.emissiveIntensity=isPolluted()&&(t%.6)<.3?2.2:.1;
  if(driverHead)driverHead.rotation.y=.5*Math.sin(t*.4)*Math.max(0,Math.sin(t*.13));
 }
 function hook(C,t){for(const [a,b,c] of steam){const f=(a+t*.11)%1;C.put('steam',-6.95+b*.5+.2*f,1.35+.9*f,-2.95+c*.3,(.05+.16*f)*(1-smooth(band(f,.7,1))),c*3)}}
 return {update,hook};
}

/*
 The world beyond the diorama board: the ground continues as grass, the river runs on past
 both edges, a footbridge leads to a kampung on the far bank, oil palms surround the site,
 a tractor carries empty fruit bunches along the back road, cattle graze with egrets and
 barn owl boxes stand in the palms. Returns spots and boxes for walking collisions.
*/
export function arcadeWorld(scene,{steel,dark,concrete,riverMat},tier,{emit=()=>{}}={}){
 const q=tier.scenery;let seed=515;const rnd=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
 const mat=(color,r=.7,m=.05,extra={})=>new T.MeshStandardMaterial({color,roughness:r,metalness:m,...extra});
 const stat=new T.Group();scene.add(stat);
 function add(geo,m,x,y,z,parent=stat,shadow=true){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o}
 const box=(x,y,z,w,h,d,m,p=stat)=>add(new T.BoxGeometry(w,h,d),m,x,y+h/2,z,p);
 const hit=(key,x,y,z,w,h,d)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshBasicMaterial({visible:false}));m.position.set(x,y,z);m.userData.info=key;scene.add(m)};
 const o=new T.Object3D();
 // Ground beyond the board, at board level so the site joins the landscape.
 const grassMat=new T.MeshStandardMaterial({map:texture(grass(tier.texture),{repeat:[50,50]}),roughness:.95});
 const ground=add(new T.PlaneGeometry(160,160),grassMat,0,-.004,0,scene,false);ground.rotation.x=-Math.PI/2;
 // River continues past both edges of the board, with muddy banks.
 for(const s of [-1,1]){const w=add(new T.PlaneGeometry(52,1.9,208,8).rotateX(-Math.PI/2),riverMat,s*34,.09,4.75,scene,false);w.renderOrder=2;
  for(const z of [3.72,5.78]){const b=add(new T.PlaneGeometry(52,.28),mat(0x6b5a40,.95),s*34,.004,z,scene,false);b.rotation.x=-Math.PI/2}}
 const bed=add(new T.PlaneGeometry(120,1.86),mat(0x4f5a48,.95),0,.02,4.75,scene,false);bed.rotation.x=-Math.PI/2;
 // Footbridge across the river to the kampung.
 const plank=mat(0x8a6a48,.85),post=mat(0x5e4630,.9);
 box(-3,.24,4.75,.8,.06,2.5,plank);for(let k=0;k<12;k++)box(-3,.3,3.6+k*.21,.78,.008,.02,dark);
 for(const sx of [-3.38,-2.62]){for(const z of [3.6,4.2,4.75,5.3,5.9])box(sx,-.05,z,.06,.85,.06,post);box(sx,.72,4.75,.04,.04,2.5,post);box(sx,.5,4.75,.03,.03,2.5,post)}
 hit('footbridge',-3,.5,4.75,.9,.6,2.6);
 // Kampung houses on stilts across the river.
 const plankTex=texture((()=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#8f6b45';g.fillRect(0,0,256,256);for(let y=0;y<256;y+=21){g.fillStyle=`rgba(${60+rnd()*40|0},${40+rnd()*30|0},20,.35)`;g.fillRect(0,y,256,2);for(let i=0;i<14;i++){g.fillStyle='rgba(40,25,10,.2)';g.fillRect(rnd()*256,y+3+rnd()*15,30+rnd()*60,1)}}return c})(),{repeat:[1,1]});
 const wall=new T.MeshStandardMaterial({map:plankTex,roughness:.85}),zinc=new T.MeshStandardMaterial({map:texture(corrugated(tier.texture,'#9aa49f'),{repeat:[3,1]}),roughness:.5,metalness:.4,side:T.DoubleSide});
 const houses=[[-5.4,9.2,.15,0xc7d9c3],[.6,10.2,-.1,0xe6d2a6],[5.8,9.0,.2,0xbcd0e0]];
 for(const [x,z,ry,trim] of houses){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);g.userData.info='kampung house';
  for(const px of [-.75,0,.75])for(const pz of [-.55,.55])add(new T.CylinderGeometry(.05,.06,.62,8),post,px,.31,pz,g);
  add(new T.BoxGeometry(1.75,.08,1.35),plank,0,.64,0,g);add(new T.BoxGeometry(1.6,.85,1.2),wall,0,1.1,0,g);
  // Gable roof of corrugated zinc (ridge along the length of the house).
  const pitch=.62;for(const s of [-1,1]){const r=add(new T.PlaneGeometry(1.95,.85),zinc,0,1.73,s*.34,g);r.rotation.x=s>0?-(Math.PI/2-pitch):-(Math.PI/2+pitch)}
  const gable=new T.BufferGeometry();gable.setAttribute('position',new T.Float32BufferAttribute([.8,0,-.6,.8,0,.6,.8,.45,0,-.8,0,.6,-.8,0,-.6,-.8,.45,0],3));gable.computeVertexNormals();
  add(gable,mat(0x8f6b45,.85,0,{side:T.DoubleSide}),0,1.525,0,g);
  const trimM=mat(trim,.6);add(new T.BoxGeometry(.32,.6,.02),mat(0x5a3a22,.7),0,1.0,-.61,g);for(const s of [-1,1]){add(new T.BoxGeometry(.3,.26,.02),mat(0x2a3338,.3,.3),s*.52,1.18,-.61,g);add(new T.BoxGeometry(.12,.3,.02),trimM,s*.73,1.18,-.615,g);add(new T.BoxGeometry(.12,.3,.02),trimM,s*.31,1.18,-.615,g)}
  for(let k=0;k<4;k++)add(new T.BoxGeometry(.42,.03,.16),plank,0,.12+k*.16,-.72-k*.13,g);
  add(new T.CylinderGeometry(.09,.07,.18,10),mat(0x9c4a2a,.8),.7,.75,-.62,g);add(new T.SphereGeometry(.12,8,6),mat(0x4f8a3a,.85),.7,.9,-.62,g)}
 // Clothes line between two houses and a parked motorbike.
 const line=add(new T.CylinderGeometry(.004,.004,4.2,4),mat(0xdddddd,.5),-2.4,1.05,9.7,stat,false);line.rotation.z=Math.PI/2;line.rotation.y=-.18;
 for(let k=0;k<5;k++)box(-3.6+k*.55,.72,9.7+k*.09,.28,.3,.01,mat([0xd8473b,0x4f9fd8,0xf2c14e,0xf4f1e6,0x6fc06b][k],.9));
 // Back road with a tractor hauling empty fruit bunches to the palms (mulch).
 const road=add(new T.PlaneGeometry(160,1.6),new T.MeshStandardMaterial({map:texture(asphalt(tier.texture),{repeat:[40,1]}),roughness:.88}),0,.006,-9,scene,false);road.rotation.x=-Math.PI/2;
 const tractor=new T.Group();scene.add(tractor);tractor.userData.info='tractor';
 const red=mat(0xb8392a,.45,.3),tyre=mat(0x1b1d1d,.9);add(new T.BoxGeometry(.7,.35,.5),red,0,.45,0,tractor);add(new T.BoxGeometry(.32,.38,.46),mat(0x2a3338,.3,.3),-.12,.82,0,tractor);
 add(new T.CylinderGeometry(.03,.03,.35,8),dark,.25,.8,.12,tractor);const wheels=[];for(const [x,r] of [[-.2,.26],[.3,.15]])for(const s of [-1,1]){const w=add(new T.CylinderGeometry(r,r,.12,14),tyre,x,r,s*.3,tractor);w.rotation.x=Math.PI/2;wheels.push([w,r])}
 const trailer=new T.Group();trailer.position.set(-1.0,0,0);tractor.add(trailer);add(new T.BoxGeometry(1.1,.08,.6),mat(0x5f6b5f,.7,.4),0,.32,0,trailer);for(const s of [-1,1])add(new T.BoxGeometry(1.1,.22,.03),mat(0x5f6b5f,.7,.4),0,.47,s*.3,trailer);
 for(let k=0;k<9;k++)add(new T.IcosahedronGeometry(.12,0),mat(0x6b5536,.95),-.4+(k%3)*.4,.5+(k%2)*.05,-.18+Math.floor(k/3)*.18,trailer);for(const s of [-1,1]){const w=add(new T.CylinderGeometry(.16,.16,.1,12),tyre,0,.16,s*.33,trailer);w.rotation.x=Math.PI/2;wheels.push([w,.16])}
 const tractorShadow=blobShadow(1.4,.32);tractorShadow.scale.set(1,.4,1);tractorShadow.position.set(-.5,.01,0);tractor.add(tractorShadow);
 // Surrounding oil palms (very light far-detail palms) with frond stacks between rows.
 const spots=[];for(let gx=-40;gx<=40;gx+=4.4)for(let gz=-30;gz<=30;gz+=4.4){const x=gx+(rnd()-.5)*1.4+(Math.round(gz/4.4)%2)*2.2,z=gz+(rnd()-.5)*1.4;
  if(Math.abs(x)<9.5&&z>-6.4&&z<6.6)continue;if(z>3.2&&z<6.3)continue;if(x>-9&&x<9&&z>6.3&&z<13.5)continue;if(z>-10.2&&z<-7.8)continue;if(x>8.8&&x<14.5&&z>-5.6&&z<4)continue;if(x>-17&&x<-8&&z>6.4&&z<14.5)continue;if(Math.hypot(x,z)>46)continue;spots.push([x,z])}
 const keep=Math.round(spots.length*Math.min(1,.35+.65*q));spots.length=keep;
 const palms=new T.InstancedMesh(oilPalm({fronds:12,leaflets:6,height:2.6,seed:83,lod:2,bunches:1,boots:false}),palmMaterial(.016),spots.length);palms.userData.info='palm';
 spots.forEach(([x,z],i)=>{o.position.set(x,0,z);o.rotation.set((rnd()-.5)*.06,rnd()*6.28,(rnd()-.5)*.06);o.scale.setScalar(.85+rnd()*.4);o.updateMatrix();palms.setMatrixAt(i,o.matrix)});palms.receiveShadow=true;scene.add(palms);
 const stacks=new T.InstancedMesh(new T.BoxGeometry(1,1,1),mat(0x6b6a3a,.95),Math.round(50*Math.max(.5,q)));
 for(let k=0;k<stacks.count;k++){const [x,z]=spots[Math.floor(rnd()*spots.length)]||[20,20];o.position.set(x+2.2,.04,z+(rnd()-.5));o.rotation.set(0,(k%2)*Math.PI/2,0);o.scale.set(.45,.1,1.6+rnd());o.updateMatrix();stacks.setMatrixAt(k,o.matrix)}stacks.userData.info='frond stack';scene.add(stacks);
 const animals=fauna(scene,{cattle:{area:[-15.5,-9.5,7.2,13.5],count:Math.max(2,Math.round(4*q))},egrets:3,owls:[[10.6,-6.2],[-12.5,9.6]],y:0,emit});
 scene.fog&&(scene.fog.density=.0095);
 mergeStatic(stat);
 let lastT=0;
 function update(t){
  const c=(t%46)/46,x=-48+c*96;tractor.position.set(x,0,-9.25);tractor.rotation.y=0;const dist=x-lastT;lastT=x;for(const [w,r] of wheels)w.rotation.y=-x/r;
  tractor.position.y=.008*Math.sin(t*18);animals.update(t);
 }
 const houseBoxes=houses.map(([x,z])=>[x-.95,x+.95,z-.95,z+.85]);
 return {update,spots,tractor,cows:animals.cows,obstacles:[[-60,-3.42,3.78,5.72],[-2.58,60,3.78,5.72],...houseBoxes,[-10.6,10.6,-4.7,-4.5],[-8.3,-3.7,-8.2,-5.8],[1.4,4.3,-6.6,-5.8]]};
}
