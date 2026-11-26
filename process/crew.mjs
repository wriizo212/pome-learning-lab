import * as T from './three.module.min.js';

export function populate(scene, materials, arcade=false){
 const {steel,brass,cement,dark,base}=materials;
 const mat=(color,roughness=.78)=>new T.MeshStandardMaterial({color,roughness});
 const navy=mat(0x273e50),orange=mat(0xe97835),stripe=mat(0xe1ebad),boots=mat(0x342d29),leaf=mat(0x506a43),bark=mat(0x79634a),roof=mat(0x688383);
 // Repeating woven fabric and a stitched placket remain visible in shoulder view.
 const cloth=document.createElement('canvas');cloth.width=cloth.height=128;const weave=cloth.getContext('2d');
 weave.fillStyle='#f3eada';weave.fillRect(0,0,128,128);
 for(let n=0;n<128;n+=3){weave.fillStyle='rgba(103,94,86,.13)';weave.fillRect(n,0,1,128);weave.fillStyle='rgba(255,255,255,.45)';weave.fillRect(0,n,128,1)}
 const textile=new T.CanvasTexture(cloth);textile.colorSpace=T.SRGBColorSpace;
 for(const fabric of [orange,navy]){fabric.map=textile;fabric.roughness=.91}
 const cube=new T.BoxGeometry(),round=new T.SphereGeometry(1,10,7);
 function part(parent,geo,m,x,y,z,w,h,d){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=o.receiveShadow=true;parent.add(o);return o}
 const box=(p,m,x,y,z,w,h,d)=>part(p,cube,m,x,y,z,w,h,d);
 const oval=(p,m,x,y,z,w,h,d)=>part(p,round,m,x,y,z,w,h,d);
 function pivot(p,x,y,z){const g=new T.Group();p.add(g);g.position.set(x,y,z);return g}
 function worker(skin,helmet){
  const g=pivot(scene,0,.1,0), body=pivot(g,0,0,0),legs=[],arms=[];
  oval(body,orange,0,.66,0,.149,.218,.092);
  box(body,navy,0,.742,-.093,.008,.104,.009);box(body,stripe,-.075,.756,-.083,.052,.029,.01);
  for(const y of [.61,.67])oval(body,stripe,0,y,0,.15,.018,.095);
  box(body,navy,0,.47,0,.242,.09,.15);box(body,dark,.08,.74,-.087,.047,.066,.025);
  const face=mat(skin),hat=mat(helmet);
  oval(body,face,0,.927,0,.093,.129,.093);oval(body,hat,0,1.01,0,.108,.083,.106);oval(body,hat,0,.99,-.011,.122,.017,.134);
  box(body,dark,0,.943,-.086,.147,.029,.018);
  for(const s of [-1,1]){
   const hip=pivot(body,s*.069,.48,0),knee=pivot(hip,0,-.196,0);
   oval(hip,navy,0,-.097,0,.069,.133,.066);oval(knee,navy,0,-.089,0,.052,.113,.053);
   oval(knee,boots,0,-.171,-.025,.059,.053,.093);legs.push([hip,knee]);
   const shoulder=pivot(body,s*.143,.79,0),elbow=pivot(shoulder,s*.021,-.145,0);
   oval(shoulder,orange,s*.014,-.064,0,.064,.096,.061);oval(elbow,navy,0,-.054,0,.043,.077,.044);
   oval(elbow,boots,0,-.13,0,.039,.045,.038);arms.push([shoulder,elbow]);
  }
  function pose(time,walk,job=''){
   const a=Math.sin(time*7)*walk;body.position.y=.015*Math.abs(a);
   legs.forEach(([hip,knee],i)=>{const n=i?-a:a;hip.rotation.x=n*.58;knee.rotation.x=-Math.max(0,n)*.67});
   arms.forEach(([sh,el],i)=>{sh.rotation.x=(i?a:-a)*.48;el.rotation.x=.17;if(job==='sample'&&i===1){sh.rotation.x=.85+.32*Math.sin(time*1.8);el.rotation.x=.3}if(job==='inspect'){sh.rotation.x=.52;el.rotation.x=.94+.13*Math.sin(time*2+i)}});
  }
  return {g,pose,arms};
 }
 const player=worker(0xb98767,0xf0ede0), patrol=worker(0x875846,0xffbf39),tech=worker(0xc59878,0xffc548);
 const tablet=box(tech.arms[0][1],dark,.08,-.14,-.06,.21,.022,.145);tablet.rotation.x=.3;
 const lane=arcade?1.27:2.39;
 const roles=[{name:'Shift operator',actor:player,from:-4.65,to:.12,offset:1.4,job:'inspect'},
  {name:'Water sampler',actor:patrol,from:3.8,to:5.48,offset:7.8,job:'sample'},
  {name:'Instrumentation technician',actor:tech,from:.35,to:3.1,offset:4.2,job:'inspect'}];
 oval(patrol.arms[1][1],steel,0,-.17,-.015,.039,.07,.039);
 box(patrol.arms[1][1],mat(0x228683),0,-.093,-.015,.036,.025,.036);

 box(player.arms[0][1],brass,.02,-.13,-.06,.082,.032,.14);
 let controlled=null;
 // Repeated fasteners, fence rails and canopy leaves share geometry in GPU batches.
 const batches=new Map();
 function repeat(geo,m,x,y,z,w,h,d,rx=0,ry=0,rz=0){
  const key=geo.uuid+m.uuid;if(!batches.has(key))batches.set(key,{geo,m,list:[]});
  const o=new T.Object3D();o.position.set(x,y,z);o.scale.set(w,h,d);o.rotation.set(rx,ry,rz);o.updateMatrix();batches.get(key).list.push(o.matrix);
 }
 for(let i=-10;i<=10;i++){repeat(cube,steel,i,-.03+.66,-4.6,.048,1.4,.048);if(i<10)for(const y of [.35,.9])repeat(cube,steel,i+.5,y,-4.6,1,.03,.035)}
 for(let i=0;i<6;i++){repeat(cube,brass,-5.7+i*2.2,.112,2.91,.9,.011,.055)}
 // Mill service shed with ventilated cladding and an open-sided maintenance canopy.
 box(scene,base,-6,.8,-7,4.6,1.9,2.35);for(let i=0;i<45;i++)repeat(cube,roof,-8.24+i*.102,.9,-5.81,.039,1.94,.04);
 for(const side of [-1,1])repeat(cube,steel,-6,2.03,-7+side*.64,4.94,.095,1.4,-side*.19);
 for(let i=0;i<4;i++){repeat(cube,dark,-7.55+i*.88,1.25,-5.77,.54,.46,.08);for(let k=0;k<5;k++)repeat(cube,steel,-7.55+i*.88,1.08+k*.076,-5.72,.51,.019,.035)}
 // A pipe rack and bundled spare stock sit beside the service shed.
 for(const z of [-5.9,-6.48]){repeat(cube,steel,1.52,.53,z,.09,1.1,.09);repeat(cube,steel,4.18,.53,z,.09,1.1,.09);repeat(cube,brass,2.85,.71,z,2.83,.055,.065)}
 const tube=new T.CylinderGeometry(1,1,1,12);
 for(let k=0;k<5;k++)repeat(tube,steel,2.85,.84,-5.88-k*.145,.07,3.4,.07,0,0,Math.PI/2);
 const frond=new T.OctahedronGeometry(1,0);
 for(let i=0;i<22;i++){
  const x=-18+(i%11)*3.5,z=-11-Math.floor(i/11)*5-Math.sin(i*3)*1.3,h=2.8+.48*Math.sin(i*5.2);
  repeat(round,bark,x,h*.46,z,.15,h*.55,.15);
  for(let j=0;j<10;j++){const a=j*.628+i,dx=Math.sin(a),dz=Math.cos(a);
   for(let k=1;k<=6;k++){const f=k/6;repeat(frond,leaf,x+dx*1.5*f,h+.48*Math.sin(f*3.6)-.32*f,z+dz*1.5*f,.19*(1.2-f*.6),.054,.38,0,a,.12)}
  }
 }
 // Sampling bench with capped vials, a handheld meter cradle and instrument dial.
 const bx=arcade?5.45:5.75,bz=arcade?.69:1.74;
 repeat(cube,steel,bx,.58,bz,.82,.055,.47);
 for(const dx of [-.32,.32])for(const dz of [-.16,.16])repeat(cube,dark,bx+dx,.31,bz+dz,.045,.54,.045);
 for(let k=0;k<4;k++){repeat(round,stripe,bx-.26+k*.10,.66,bz,.036,.08,.036);repeat(cube,navy,bx-.26+k*.1,.74,bz,.042,.025,.042)}
 const c=document.createElement('canvas');c.width=256;c.height=256;const ctx=c.getContext('2d');
 ctx.fillStyle='#dedcc8';ctx.fillRect(0,0,256,256);ctx.strokeStyle='#33403d';ctx.lineWidth=4;
 for(let k=0;k<=20;k++){const a=2.5+k*.223;ctx.beginPath();ctx.moveTo(128+Math.cos(a)*78,128+Math.sin(a)*78);ctx.lineTo(128+Math.cos(a)*91,128+Math.sin(a)*91);ctx.stroke()}
 ctx.strokeStyle='#a7412e';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(128,128);ctx.lineTo(154,61);ctx.stroke();ctx.fillStyle='#33403d';ctx.font='bold 24px sans-serif';ctx.textAlign='center';ctx.fillText('FLOW',128,175);
 const dial=new T.CanvasTexture(c);dial.colorSpace=T.SRGBColorSpace;
 const ix=arcade?1.02:3.43,iz=arcade?.76:1.88;
 repeat(cube,steel,ix,.48,iz,.055,.82,.055);repeat(cube,dark,ix,.92,iz,.31,.33,.085);
 part(scene,new T.PlaneGeometry(.28,.28),new T.MeshStandardMaterial({map:dial}),ix,.92,iz+.047,1,1,1);
 for(const {geo,m,list} of batches.values()){const o=new T.InstancedMesh(geo,m,list.length);list.forEach((matrix,i)=>o.setMatrixAt(i,matrix));o.castShadow=o.receiveShadow=true;scene.add(o)}
 function animate(t){
  for(const [i,r] of roles.entries()){
   if(r.actor===controlled)continue;
   const duration=(r.to-r.from)/.48,wait=3.4,phase=(t+r.offset)%(2*(duration+wait));
   const outbound=phase<duration+wait,leg=outbound?phase:phase-duration-wait,walking=leg<duration;
   const f=Math.min(1,leg/duration),px=outbound?r.from+(r.to-r.from)*f:r.to-(r.to-r.from)*f;
   r.actor.g.position.set(px,.11,lane+i*.13);r.actor.g.rotation.y=walking?(outbound?-Math.PI/2:Math.PI/2):0;
   r.actor.pose(t+r.offset,walking?1:0,walking?'':r.job);
  }
 }
 animate(0);
 return {roles,animate,control(actor){controlled=actor}};
}
