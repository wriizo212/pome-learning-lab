import * as T from './three.module.min.js';
import {seeds,smooth,band,lerpPath} from './molecules.mjs';

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
  const c=document.createElement('canvas');c.width=512;c.height=96;const g=c.getContext('2d');g.fillStyle='rgba(23,45,43,.92)';g.beginPath();g.roundRect(4,4,504,88,14);g.fill();
  g.fillStyle=color;g.font='bold 44px Arial';g.textAlign='center';g.fillText(text,256,63);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const s=new T.Sprite(new T.SpriteMaterial({map:tex,depthWrite:false}));s.position.set(x,y,z);s.scale.set(w,w*96/512,1);scene.add(s);return s;
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
