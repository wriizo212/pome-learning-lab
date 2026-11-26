import * as T from './three.module.min.js';

export function populate(scene, materials){
 const {steel,brass,cement,dark,base}=materials;
 const mat=(color,roughness=.78)=>new T.MeshStandardMaterial({color,roughness});
 const navy=mat(0x273e50),orange=mat(0xe97835),stripe=mat(0xe1ebad),boots=mat(0x342d29),leaf=mat(0x506a43),bark=mat(0x79634a),roof=mat(0x688383);
 const cube=new T.BoxGeometry(),round=new T.SphereGeometry(1,14,10);
 function part(parent,geo,m,x,y,z,w,h,d){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=o.receiveShadow=true;parent.add(o);return o}
 const box=(p,m,x,y,z,w,h,d)=>part(p,cube,m,x,y,z,w,h,d);
 const oval=(p,m,x,y,z,w,h,d)=>part(p,round,m,x,y,z,w,h,d);
 function pivot(p,x,y,z){const g=new T.Group();p.add(g);g.position.set(x,y,z);return g}
 function worker(skin,helmet){
  const g=pivot(scene,0,.1,0), body=pivot(g,0,0,0),legs=[],arms=[];
  oval(body,orange,0,.66,0,.149,.218,.092);
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
   arms.forEach(([sh,el],i)=>{sh.rotation.x=(i?a:-a)*.48;el.rotation.x=.17;if(job==='inspect'){sh.rotation.x=.52;el.rotation.x=.94+.13*Math.sin(time*2+i)}});
  }
  return {g,pose,arms};
 }
 const player=worker(0xb98767,0xf0ede0), patrol=worker(0x875846,0xffbf39),tech=worker(0xc59878,0xffc548);
 const tablet=box(tech.arms[0][1],dark,.08,-.14,-.06,.21,.022,.145);tablet.rotation.x=.3;
 tech.g.position.set(3.38,.11,1.96);tech.g.rotation.y=.44;
 const path=[[-5.75,2.35],[-2.9,2.35],[.05,2.35],[3.54,2.35],[5.65,2.35],[5.65,2.76],[-5.75,2.76]];
 const segments=path.map((a,i)=>{const b=path[(i+1)%path.length];return {a,b,len:Math.hypot(b[0]-a[0],b[1]-a[1])}});
 const cycle=segments.reduce((n,s)=>n+s.len,0);
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
 for(let i=0;i<22;i++){
  const x=-18+(i%11)*3.5,z=-11-Math.floor(i/11)*5-Math.sin(i*3)*1.3,h=2.8+.48*Math.sin(i*5.2);
  repeat(round,bark,x,h*.46,z,.15,h*.55,.15);
  for(let j=0;j<10;j++){const a=j*.628+i,dx=Math.sin(a),dz=Math.cos(a);
   for(let k=1;k<=6;k++){const f=k/6;repeat(round,leaf,x+dx*1.5*f,h+.48*Math.sin(f*3.6)-.32*f,z+dz*1.5*f,.19*(1.2-f*.6),.054,.38,0,a,.12)}
  }
 }
 for(const {geo,m,list} of batches.values()){const o=new T.InstancedMesh(geo,m,list.length);list.forEach((matrix,i)=>o.setMatrixAt(i,matrix));o.castShadow=o.receiveShadow=true;scene.add(o)}
 return {player,animate(t){
  let n=(t*.52)%cycle;for(const {a,b,len} of segments){if(n<=len){const f=n/len;patrol.g.position.set(a[0]+(b[0]-a[0])*f,.11,a[1]+(b[1]-a[1])*f);patrol.g.rotation.y=Math.atan2(a[0]-b[0],a[1]-b[1]);break}n-=len}
  patrol.pose(t,1);tech.pose(t,0,'inspect');
 }};
}
