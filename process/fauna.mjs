import * as T from './three.module.min.js';
import {blobShadow} from './life.mjs?v=shift12';

/*
 Plantation animals, each with a real role on an oil palm estate:
  - cattle graze between the palms (they keep weeds down — "cattle integration");
  - cattle egrets follow them and snap up insects the cattle disturb;
  - barn owl nest boxes on poles (barn owls hunt the rats that damage fruit).
 Cattle wander, stop to graze, swish their tails and sometimes moo (an event for sound).
*/
export function fauna(scene,{cattle,egrets=3,owls=[],y=0,emit=()=>{}}){
 let seed=909;const rnd=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
 const mat=(c,r=.8,m=0)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m});
 function part(p,geo,m,x,yy,z,sx=1,sy=1,sz=1){const o=new T.Mesh(geo,m);o.position.set(x,yy,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;p.add(o);return o}
 const ball=new T.SphereGeometry(1,12,8),stick=new T.CylinderGeometry(1,1,1,7);
 const cows=[];
 if(cattle){const {area,count}=cattle,coats=[0x8a5a36,0xd8d2c4,0x5b3a26,0xb08257];
  for(let i=0;i<count;i++){const coat=mat(coats[i%coats.length],.85),dark=mat(0x2a211c,.7),pink=mat(0xc89a8a,.6),horn=mat(0xe4dccb,.5);
   const g=new T.Group();g.position.set(area[0]+rnd()*(area[1]-area[0]),y,area[2]+rnd()*(area[3]-area[2]));g.rotation.y=rnd()*6.28;scene.add(g);g.userData.info='cattle';
   part(g,ball,coat,0,.6,0,.22,.24,.48);part(g,ball,coat,0,.68,-.28,.2,.2,.18);part(g,ball,coat,0,.66,.3,.19,.21,.2);
   const neck=new T.Group();neck.position.set(0,.68,-.42);g.add(neck);part(neck,ball,coat,0,0,-.08,.11,.13,.16);
   const head=new T.Group();head.position.set(0,.02,-.2);neck.add(head);part(head,ball,coat,0,0,-.06,.09,.1,.15);part(head,ball,pink,0,-.04,-.19,.065,.055,.05);
   for(const s of [-1,1]){part(head,ball,coat,s*.1,.04,.0,.05,.025,.03);const h=part(head,stick,horn,s*.06,.1,0,.012,.08,.012);h.rotation.z=-s*.6;part(head,ball,dark,s*.06,.03,-.13,.012,.012,.012)}
   const legs=[];for(const [lx,lz] of [[-.12,-.3],[.12,-.3],[-.12,.32],[.12,.32]]){const hip=new T.Group();hip.position.set(lx,.5,lz);g.add(hip);part(hip,stick,coat,0,-.2,0,.045,.4,.045);part(hip,stick,dark,0,-.44,0,.05,.07,.05);legs.push(hip)}
   const tail=new T.Group();tail.position.set(0,.7,.5);g.add(tail);part(tail,stick,coat,0,-.18,0,.015,.36,.015);part(tail,ball,dark,0,-.38,0,.03,.06,.03);
   const shadow=blobShadow(.55,.3);shadow.scale.set(.7,1.3,1);shadow.position.y=.01;g.add(shadow);
   cows.push({g,neck,head,legs,tail,area,tx:g.position.x,tz:g.position.z,state:'graze',until:rnd()*6,phase:rnd()*9,step:0})}}
 // Cattle egrets: small white herons that stay close to the grazing cattle.
 const birds=[];const white=mat(0xf4f2ea,.6),beak=mat(0xe6b43a,.5),legM=mat(0x3a3328,.7);
 for(let i=0;i<(cows.length?egrets:0);i++){const g=new T.Group();scene.add(g);g.userData.info='egret';
  part(g,ball,white,0,.2,0,.05,.055,.09);const neck=new T.Group();neck.position.set(0,.24,-.06);g.add(neck);part(neck,stick,white,0,.05,0,.015,.1,.015);
  const head=new T.Group();head.position.set(0,.1,0);neck.add(head);part(head,ball,white,0,0,0,.025,.025,.03);const b=part(head,stick,beak,0,-.005,-.05,.006,.06,.006);b.rotation.x=Math.PI/2;
  for(const s of [-1,1])part(g,stick,legM,s*.02,.08,0,.005,.16,.005);
  birds.push({g,neck,cow:cows[i%cows.length],ang:rnd()*6.28,phase:rnd()*9})}
 // Barn owl nest boxes.
 const owlParts=[];const wood=mat(0x7c5b3a,.85),roof=mat(0x4a4a44,.6,.3),owlM=mat(0xe8d6b0,.7),face=mat(0xf6f1e4,.6),eye=new T.MeshBasicMaterial({color:0x111111});
 for(const [x,z] of owls){const g=new T.Group();g.position.set(x,y,z);scene.add(g);g.userData.info='owl box';
  part(g,stick,wood,0,1.2,0,.04,2.4,.04);part(g,new T.BoxGeometry(1,1,1),wood,0,2.5,0,.34,.3,.36);const rf=part(g,new T.BoxGeometry(1,1,1),roof,0,2.7,0,.42,.04,.44);rf.rotation.z=.1;
  part(g,new T.CylinderGeometry(1,1,1,16),new T.MeshBasicMaterial({color:0x14100c}),0,2.52,-.181,.06,.01,.06).rotation.x=Math.PI/2;
  const head=new T.Group();head.position.set(0,2.52,-.17);g.add(head);part(head,ball,owlM,0,0,0,.06,.055,.05);part(head,ball,face,0,0,-.035,.05,.045,.02);for(const s of [-1,1])part(head,ball,eye,s*.018,.005,-.052,.008,.008,.004);
  owlParts.push({head,phase:rnd()*9})}
 const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));let last=0;
 function update(t){
  const dt=Math.max(0,Math.min(.1,t-last));last=t;
  for(const c of cows){
   if(t>c.until){if(c.state==='graze'){c.state='walk';const [x0,x1,z0,z1]=c.area;c.tx=x0+rnd()*(x1-x0);c.tz=z0+rnd()*(z1-z0);c.until=t+12}else{c.state='graze';c.until=t+5+rnd()*9}
    if(rnd()<.18)emit({type:'moo',x:c.g.position.x,z:c.g.position.z})}
   const dx=c.tx-c.g.position.x,dz=c.tz-c.g.position.z,d=Math.hypot(dx,dz);let walk=0;
   if(c.state==='walk'){if(d<.2){c.state='graze';c.until=t+5+rnd()*8}else{const want=Math.atan2(-dx,-dz);c.g.rotation.y+=wrap(want-c.g.rotation.y)*Math.min(1,dt*1.5);
     const sp=.22*dt;c.g.position.x-=Math.sin(c.g.rotation.y)*sp;c.g.position.z-=Math.cos(c.g.rotation.y)*sp;walk=1;c.step+=sp/.35*Math.PI*2}}
   c.legs.forEach((l,k)=>{l.rotation.x=walk*.35*Math.sin(c.step+(k===0||k===3?0:Math.PI))});
   const graze=c.state==='graze'?1:0,bob=Math.sin(t*2.2+c.phase);
   c.neck.rotation.x+=((graze?-.95+.08*bob:-.15+.04*Math.sin(t*1.3))-c.neck.rotation.x)*Math.min(1,dt*2.5);c.head.rotation.y=graze?.15*Math.sin(t*.9+c.phase):.25*Math.sin(t*.4+c.phase);
   c.tail.rotation.z=.35*Math.sin(t*2.3+c.phase)*Math.max(.2,Math.sin(t*.5+c.phase));c.tail.rotation.x=.25}
  for(const b of birds){b.ang+=dt*.15*Math.sin(t*.3+b.phase);const cx=b.cow.g.position.x+Math.cos(b.ang)*.75,cz=b.cow.g.position.z+Math.sin(b.ang)*.75;
   const dx=cx-b.g.position.x,dz=cz-b.g.position.z,d=Math.hypot(dx,dz);if(d>.02){b.g.position.x+=dx*Math.min(1,dt*1.2);b.g.position.z+=dz*Math.min(1,dt*1.2);b.g.rotation.y=Math.atan2(-dx,-dz)}
   b.g.position.y=y+(d>.4?.05*Math.abs(Math.sin(t*9)):0);const peck=Math.max(0,Math.sin(t*3.1+b.phase))**6;b.neck.rotation.x=-1.1*peck}
  for(const o of owlParts){o.head.rotation.y=.9*Math.sin(t*.35+o.phase)*Math.max(0,Math.sin(t*.11+o.phase));o.head.position.y=2.52+(Math.sin(t*.07+o.phase)>.6?.04:-.06)}
 }
 return {update,cows};
}
