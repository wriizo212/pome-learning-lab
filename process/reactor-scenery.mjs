import * as T from './three.module.min.js';
import {wind,windify,texture,concrete,grass,gravel,asphalt,corrugated,sign,platformDecal,blobShadow,mergeStatic,sky,oilPalm,palmMaterial} from './life.mjs?v=shift11';

/*
 Surroundings for the main UASB + aerobic simulator: ground, road and plantation,
 the support buildings a real effluent plant needs (control room, aeration blowers,
 reuse tank, nutrient dosing), safety furniture, and moving life (wind, lorry, birds,
 butterflies, chimney smoke). Static pieces are merged per material; moving pieces
 stay separate. Counts scale with the quality tier.
*/
export function reactorScenery(scene,{steel,brass,dark,cement,teal,tier}){
 const q=tier.scenery,texSize=tier.texture;let seed=2024;const rnd=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
 const mat=(color,r=.7,m=.05,extra={})=>new T.MeshStandardMaterial({color,roughness:r,metalness:m,...extra});
 const stat=new T.Group();scene.add(stat);
 function add(geo,m,x,y,z,parent=stat,shadow=true){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o}
 const box=(x,y,z,w,h,d,m,p)=>add(new T.BoxGeometry(w,h,d),m,x,y+h/2,z,p);
 const cyl=(x,y,z,r,h,m,p,r2=r,n=16)=>add(new T.CylinderGeometry(r,r2,h,n),m,x,y+h/2,z,p);
 function pipe(a,b,r,m,p){const s=new T.Vector3(...a),e=new T.Vector3(...b),d=e.clone().sub(s);const o=add(new T.CylinderGeometry(r,r,d.length(),12),m,...s.clone().lerp(e,.5).toArray(),p);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o}
 const run=(pts,r,m,p)=>pts.slice(1).forEach((q,i)=>pipe(pts[i],q,r,m,p));
 function plane(w,d,m,x,y,z,p=stat){const o=add(new T.PlaneGeometry(w,d),m,x,y,z,p,false);o.rotation.x=-Math.PI/2;return o}
 function label(text,x,y,z,w,color='#e3ead9'){const c=document.createElement('canvas');c.width=1024;c.height=192;const g=c.getContext('2d');g.scale(2,2);g.fillStyle='#172d2b';g.fillRect(0,0,512,96);g.fillStyle=color;g.font='bold 42px Arial';g.textAlign='center';g.fillText(text,256,62);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;const s=new T.Sprite(new T.SpriteMaterial({map:t}));s.position.set(x,y,z);s.scale.set(w,w*96/512,1);s.userData.info=text.toLowerCase();scene.add(s);return s}
 function signPost(spec,x,z,face=0,h=.78){const t=sign(spec);const g=new T.Group();g.position.set(x,.09,z);g.rotation.y=face;scene.add(g);
  add(new T.CylinderGeometry(.022,.022,h,8),steel,0,h/2,0,g);const p=add(new T.PlaneGeometry(.56,.35),new T.MeshStandardMaterial({map:t,roughness:.6}),0,h,.026,g);p.castShadow=false;p.userData.info=spec.title.toLowerCase();add(new T.BoxGeometry(.58,.37,.02),dark,0,h,.012,g);return g}
 const dynamic=[];

 /* ---------- sky, ground, road ---------- */
 const atmosphere=sky(scene,{sunDir:new T.Vector3(-6,11,8)});scene.background=null;scene.fog=new T.FogExp2(0xb3c5bd,.0105);
 const grassMat=new T.MeshStandardMaterial({map:texture(grass(texSize),{repeat:[46,46]}),roughness:.95});
 plane(150,150,grassMat,0,-.284,0);
 const gravelMat=new T.MeshStandardMaterial({map:texture(gravel(texSize),{repeat:[9,6]}),roughness:.95});plane(16.5,11.2,gravelMat,0,-.278,.2);
 const road=new T.MeshStandardMaterial({map:texture(asphalt(texSize),{repeat:[38,1]}),roughness:.88});plane(150,2.5,road,0,-.272,6.45);
 const kerb=mat(0xc9c4b4,.8);box(0,-.29,5.17,150,.07,.1,kerb);box(0,-.29,7.73,150,.07,.1,kerb);
 // Drain channel along the platform front, with flowing water.
 box(0,-.29,3.55,12.4,.07,.32,cement);const drainWater=mat(0x6f9e94,.12,.1,{transparent:true,opacity:.85});const drain=plane(12.2,.2,drainWater,0,-.215,3.55,scene);
 const drainTex=texture(gravel(64,'#7aa79c'),{repeat:[40,1]});drainWater.map=drainTex;dynamic.push(t=>{drainTex.offset.x=-t*.15});
 // Painted platform top.
 const decal=plane(12.4,6.5,new T.MeshStandardMaterial({map:platformDecal(texSize*2,{keepouts:[[-5.75,-.05,-3.35,1.85],[1.95,-2.55,4.45,-1.35]]}),roughness:.88,polygonOffset:true,polygonOffsetFactor:-1}),0,.0915,0,scene);decal.receiveShadow=true;

 /* ---------- oil palm plantation (instanced, sways in the wind) ---------- */
 function palmGeometry(){
  const parts=[],c=new T.Color();
  const trunk=new T.CylinderGeometry(.13,.2,3.2,8,6);trunk.translate(0,1.6,0);
  const tp=trunk.attributes.position;for(let i=0;i<tp.count;i++){const y=tp.getY(i);tp.setX(i,tp.getX(i)*(1+.12*Math.sin(y*9)));tp.setZ(i,tp.getZ(i)*(1+.12*Math.sin(y*9)))}
  parts.push([trunk,0x6e5a40]);
  for(let j=0;j<11;j++){const a=j*.571+.2*Math.sin(j*3),L=1.7+.4*Math.sin(j*1.7),verts=[];
   const pt=(t,side,drop)=>[Math.cos(a)*L*t-Math.sin(a)*side,3.15+Math.sin(Math.PI*t)*.5-t*t*.95-drop,Math.sin(a)*L*t+Math.cos(a)*side];
   for(let i=1;i<=9;i++){const t=i/10,w=.28*Math.sin(Math.PI*t)+.05;for(const s of [-1,1])verts.push(...pt(t,0,0),...pt(t+.08,0,0),...pt(t+.16,s*w,.12))}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.computeVertexNormals();parts.push([g,j%3?0x4f7a34:0x63883c])}
  const pos=[],nor=[],col=[];for(const [g0,color] of parts){const g=g0.index?g0.toNonIndexed():g0;c.set(color);pos.push(...g.attributes.position.array);nor.push(...g.attributes.normal.array);for(let i=0;i<g.attributes.position.count;i++)col.push(c.r,c.g,c.b)}
  const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(pos,3));out.setAttribute('normal',new T.Float32BufferAttribute(nor,3));out.setAttribute('color',new T.Float32BufferAttribute(col,3));return out;
 }
 const spots=[];
 // Keep the camera's line of sight (in front of the plant) clear of trees.
 const free=(x,z)=>!(Math.abs(x)<11.5&&z>-9&&z<9)&&!(Math.abs(x)<30&&z>4)&&!(z>4.6&&z<8.4)&&!(Math.abs(x)<19&&z>-17.5&&z<-9.5);
 for(let gx=-46;gx<=46;gx+=4.6)for(let gz=-40;gz<=34;gz+=4.6){const x=gx+(rnd()-.5)*1.6+(Math.round(gz/4.6)%2)*2.3,z=gz+(rnd()-.5)*1.6;if(free(x,z)&&Math.hypot(x,z)<52)spots.push([x,z])}
 spots.sort(()=>rnd()-.5);const palmCount=Math.round(spots.length*Math.min(1,.25+.75*q));
 // Realistic oil palms; frond and leaflet counts follow the quality tier.
 // Two levels of detail: fuller palms in the first rows, very light ones further out.
 const nearSpots=[],farSpots=[];for(let i=0;i<palmCount;i++)(Math.hypot(spots[i][0],spots[i][1]*1.3)<20?nearSpots:farSpots).push(spots[i]);
 const pm=palmMaterial(.006),o=new T.Object3D(),palmSets=[];
 for(const [list,opts] of [[nearSpots,{fronds:Math.round(14+8*tier.detail),leaflets:Math.round(8+6*tier.detail),lod:1,boots:tier.detail>.6,bunches:2}],[farSpots,{fronds:10,leaflets:5,lod:2,boots:false,bunches:1}]]){
  if(!list.length)continue;const m=new T.InstancedMesh(oilPalm({height:3.4,seed:9,...opts}),pm,list.length);m.userData.info='palm';
  list.forEach(([x,z],i)=>{o.position.set(x,-.29,z);o.rotation.set((rnd()-.5)*.06,rnd()*6.28,(rnd()-.5)*.06);o.scale.setScalar(.85+rnd()*.45);o.updateMatrix();m.setMatrixAt(i,o.matrix)});
  m.castShadow=false;m.receiveShadow=true;scene.add(m);palmSets.push(m)}
 // Grass tufts around the yard.
 const tuftGeo=new T.ConeGeometry(.035,.22,4,1,true);tuftGeo.translate(0,.11,0);
 const tuftMat=windify(new T.MeshStandardMaterial({color:0x6f8f45,roughness:.9,side:T.DoubleSide}),{strength:1.1,base:-.29});
 const tuftCount=Math.round(900*q),tufts=new T.InstancedMesh(tuftGeo,tuftMat,tuftCount);let placed=0;
 while(placed<tuftCount){const x=(rnd()-.5)*40,z=(rnd()-.5)*30;if((Math.abs(x)<8.3&&z>-5.4&&z<5.8)||(z>5.1&&z<7.8))continue;o.position.set(x,-.29,z);o.rotation.set((rnd()-.5)*.4,rnd()*6,(rnd()-.5)*.4);o.scale.set(1,.6+rnd()*.9,1);o.updateMatrix();tufts.setMatrixAt(placed++,o.matrix)}
 scene.add(tufts);

 /* ---------- fences, gate and street lights ---------- */
 // Front fence stays low so it never hides the plant from the default camera.
 const fencePost=new T.CylinderGeometry(.03,.03,1,6),posts=[];
 for(let x=-10.5;x<=10.5;x+=1.5)if(x<6.3||x>8.8)posts.push([x,4.45]);for(let z=-4.6;z<=4.45;z+=1.5)posts.push([-10.5,z],[10.5,z]);
 const postMesh=new T.InstancedMesh(fencePost,steel,posts.length);posts.forEach(([x,z],i)=>{o.position.set(x,.21,z);o.rotation.set(0,0,0);o.scale.set(1,1,1);o.updateMatrix();postMesh.setMatrixAt(i,o.matrix)});postMesh.castShadow=true;scene.add(postMesh);
 for(const y of [.2,.5,.68]){box(-2.1,y-.29,4.45,16.8,.025,.025,steel);box(9.65,y-.29,4.45,1.7,.025,.025,steel);box(-10.5,y-.29,-.08,.025,.025,9.05,steel);box(10.5,y-.29,-.08,.025,.025,9.05,steel)}
 const gateMat=mat(0xe8c440,.5,.3);for(const gx of [6.3,8.8])box(gx,-.29,4.45,.09,1.55,.09,dark);box(7.55,.35,4.45,2.4,.32,.05,mat(0x1f4d3f,.6));add(new T.PlaneGeometry(2.3,.27),new T.MeshStandardMaterial({map:sign({title:'POME TREATMENT PLANT',band:'#1f4d3f',lines:[],symbol:''},1024,120)}),7.55,.51,4.48,stat,false);
 box(6.95,-.1,4.6,1.2,.04,.04,gateMat);
 const lampHead=mat(0xfff6d8,.4,0,{emissive:0xfff1c4,emissiveIntensity:.6});
 for(let x=-18;x<=18;x+=6){cyl(x,-.29,7.95,.045,2.6,dark);box(x,2.25,7.7,.06,.05,.5,dark);box(x,2.17,7.48,.22,.06,.13,lampHead)}

 /* ---------- control room container ---------- */
 const clad=new T.MeshStandardMaterial({map:texture(corrugated(texSize,'#7f97a3'),{repeat:[3,1]}),roughness:.55,metalness:.35});
 const cr=new T.Group();cr.position.set(-8.55,-.29,-.4);scene.add(cr);
 box(0,0,0,2.7,.12,1.3,cement,cr);box(0,.12,0,2.6,1.15,1.15,clad,cr);box(0,1.27,0,2.7,.06,1.25,dark,cr);
 const glass=mat(0x9fd8e6,.15,.4,{emissive:0x5ab4c8,emissiveIntensity:.35});for(const x of [-.75,.15])box(x,.62,.585,.62,.42,.02,glass,cr);
 box(.85,.12,.585,.42,.88,.025,mat(0x435a62,.5,.3),cr);box(.85,0,.95,.6,.12,.5,steel,cr);box(.85,0,1.25,.6,.06,.3,steel,cr);
 const crSign=add(new T.PlaneGeometry(1.2,.19),new T.MeshStandardMaterial({map:sign({title:'CONTROL ROOM',band:'#1f4d3f',lines:[],symbol:''},512,80)}),-.3,1.16,.6,cr,false);
 box(1.42,.5,-.2,.18,.42,.55,mat(0xdfe3de,.6),cr);const acFan=new T.Group();acFan.position.set(1.52,.71,-.2);cr.add(acFan);
 for(let k=0;k<3;k++){const b=add(new T.BoxGeometry(.012,.3,.06),dark,0,0,0,acFan,false);b.rotation.x=k*2.09}
 cyl(-1.1,1.3,-.4,.015,.7,steel,cr);const beacon=add(new T.SphereGeometry(.035,8,6),mat(0xff3b2f,.3,0,{emissive:0xff2a1a,emissiveIntensity:1}),-1.1,2.02,-.4,cr,false);
 // Parked motorbike.
 const bike=new T.Group();bike.position.set(-7.2,-.29,.95);bike.rotation.y=.4;scene.add(bike);
 for(const z of [-.32,.32]){const w=add(new T.TorusGeometry(.14,.04,6,16),mat(0x1d2222,.9),0,.15,z,bike);w.rotation.y=Math.PI/2}
 box(0,.22,0,.12,.14,.55,mat(0xb33b2e,.4,.3),bike);box(0,.35,.05,.1,.06,.32,dark,bike);pipe([0,.3,-.25],[0,.5,-.32],.015,steel,bike);pipe([-.18,.52,-.32],[.18,.52,-.32],.012,steel,bike);
 box(0,0,0,.4,.02,.9,mat(0x000000,1,0,{transparent:true,opacity:.18}),bike);

 /* ---------- aeration blowers with the air main to the basin ---------- */
 const bh=new T.Group();bh.position.set(7.55,-.29,-1.75);scene.add(bh);
 box(0,0,0,2.2,.12,1.5,cement,bh);for(const s of [-1,1])box(s*1.02,.12,0,.08,1.15,1.4,clad,bh);box(0,1.27,0,2.3,.06,1.55,dark,bh);
 const fans=[];for(const dx of [-.45,.45]){box(dx,.12,.1,.62,.3,.7,mat(0x3e6a8a,.45,.4),bh);cyl(dx,.42,.25,.13,.34,mat(0x2f4e65,.4,.5),bh);
  const housing=add(new T.CylinderGeometry(.2,.2,.08,18),steel,dx,.6,-.32,bh);housing.rotation.x=Math.PI/2;const f=new T.Group();f.position.set(dx,.6,-.37);bh.add(f);
  for(let k=0;k<5;k++){const b=add(new T.BoxGeometry(.03,.17,.012),dark,0,.08,0,f,false);b.position.set(Math.sin(k*1.257)*.08,Math.cos(k*1.257)*.08,0);b.rotation.z=-k*1.257}fans.push(f);
  pipe([dx,.42,-.1],[dx,.7,-.1],.06,steel,bh);}
 pipe([-.45,.7,-.1],[.45,.7,-.1],.07,steel,bh);label('AIR BLOWERS',7.55,1.62,-1.75,1.4);
 const airMain=[[6.95,.41,-1.85],[6.95,1.62,-1.85],[3.62,1.62,-1.85],[3.62,1.62,-.7],[3.09,1.62,-.7],[3.09,1.52,-.7]];run(airMain,.055,mat(0x8fb2c4,.4,.5));
 for(const [x,z] of [[5.4,-1.85],[3.62,-1.25]]){cyl(x,.09,z,.035,1.5,steel);box(x,1.55,z,.3,.04,.08,steel)}

 /* ---------- treated-water reuse tank and nutrient dosing ---------- */
 const tankMat=new T.MeshStandardMaterial({map:texture(concrete(texSize,{base:'#9fb4b0'})),roughness:.6,metalness:.2});
 cyl(8.45,-.29,1.75,.85,2.1,tankMat,stat,.85,28);cyl(8.45,1.81,1.75,.88,.08,dark);
 box(8.45,-.25,2.62,.08,1.9,.02,mat(0x223030,.5),stat);const level=box(8.45,-.25,2.64,.05,1.4,.02,mat(0x6fd3e0,.3,0,{emissive:0x2c8da0,emissiveIntensity:.6}),scene);
 for(let k=0;k<12;k++)box(7.58,-.2+k*.17,1.75,.03,.02,.3,steel);for(const s of [-1,1])box(7.58,-.29,1.75+s*.15,.025,2.15,.025,steel);
 label('REUSE WATER',8.45,2.35,1.75,1.35);run([[6.15,.34,.7],[7.25,.34,.7],[7.25,.34,1.75],[7.6,.34,1.75]],.06,teal);
 const tote=mat(0xf2f2ea,.3,0,{transparent:true,opacity:.78}),cage=mat(0x9aa49f,.4,.6);
 for(const x of [6.75,7.55]){box(x,-.29,3.1,.62,.12,.62,cage);box(x,-.17,3.1,.56,.6,.56,tote);box(x,-.17,3.1,.5,.38,.5,mat(0xd9e6b8,.3,0));
  for(const dx of [-.3,.3])for(const dz of [-.3,.3])box(x+dx,-.17,3.1+dz,.02,.62,.02,cage);cyl(x,.45,3.1,.08,.06,mat(0x2d6fb0,.5),stat)}
 signPost({title:'NUTRIENTS',band:'#2d6fb0',lines:['Urea + phosphate','dosed to aeration'],symbol:'+'},7.15,3.55,0,.55);

 /* ---------- safety furniture ---------- */
 signPost({title:'DANGER',lines:['BIOGAS','NO NAKED FLAMES'],symbol:'!'},-1.4,3.17);
 signPost({title:'CAUTION',band:'#e0a321',fg:'#1d2221',lines:['HOT EFFLUENT','about 80 °C'],symbol:'!'},-4.55,3.17);
 signPost({title:'SAMPLE POINT',band:'#1f6fb0',lines:['WEAR GLOVES','AND GOGGLES'],symbol:'i'},1.8,3.17);
 signPost({title:'PPE REQUIRED',band:'#1f6fb0',lines:['HELMET · BOOTS','GLOVES · VEST'],symbol:'✓'},4.7,3.17);
 signPost({title:'CONFINED SPACE',lines:['PERMIT TO ENTER','GAS TEST FIRST'],symbol:'!'},-2.95,-.95,-Math.PI/2,.9);
 const green=mat(0x2c9c5a,.5,.3);const sh=new T.Group();sh.position.set(6.0,.09,-2.9);scene.add(sh);
 for(const dx of [-.22,.22])box(dx,0,0,.05,1.9,.05,green,sh);box(0,1.85,0,.5,.05,.05,green,sh);cyl(0,1.62,0,.1,.06,steel,sh,.05);box(0,.75,-.05,.26,.04,.2,green,sh);
 add(new T.PlaneGeometry(.36,.22),new T.MeshStandardMaterial({map:sign({title:'SAFETY SHOWER',band:'#2c9c5a',lines:['EYE WASH'],symbol:'+'})}),0,1.25,.03,sh,false);
 const red=mat(0xc8291f,.35,.3);for(const [x,z] of [[-2.85,-2.95],[5.95,2.9]]){cyl(x,.09,z,.07,.42,red);cyl(x,.51,z,.035,.06,dark);box(x,.09,z+.09,.14,.65,.02,mat(0xf4f1e6,.6))}
 // Windsock on a mast: points downwind and flutters.
 cyl(-6.0,.09,-3.0,.03,3.1,mat(0xdfe5e0,.4,.4));const sock=new T.Group();sock.position.set(-6.0,3.12,-3.0);scene.add(sock);
 const sockTex=new T.CanvasTexture((()=>{const c=document.createElement('canvas');c.width=128;c.height=32;const g=c.getContext('2d');for(let k=0;k<5;k++){g.fillStyle=k%2?'#f4f1e6':'#e8642c';g.fillRect(k*25.6,0,25.6,32)}return c})());
 const sockBody=new T.Mesh(new T.CylinderGeometry(.07,.13,.7,12,4,true),new T.MeshStandardMaterial({map:sockTex,side:T.DoubleSide,roughness:.8}));sockBody.rotation.z=Math.PI/2;sockBody.position.x=.38;sock.add(sockBody);

 /* ---------- distant mill with a smoking boiler chimney ---------- */
 const millWall=new T.MeshStandardMaterial({map:texture(corrugated(texSize,'#a7b0a4'),{repeat:[6,2]}),roughness:.6,metalness:.3});
 box(22,-.29,-24,10,5,6,millWall);box(22,4.71,-24,10.4,.3,6.4,dark);box(16,-.29,-21,3,3.2,3,millWall);cyl(26,-.29,-22,.55,11,mat(0x7d7f78,.8),stat,.7,14);cyl(26,10.71,-22,.6,.4,mat(0xa3412d,.7));
 for(let k=0;k<3;k++)cyl(18+k*2,-.29,-28.5,1,3.5,mat(0xb6bcb3,.5,.4),stat,1,18);label('PALM OIL MILL',22,6.3,-24,4.5);
 const puffTex=new T.CanvasTexture((()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(235,235,230,.9)');gr.addColorStop(1,'rgba(235,235,230,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return c})());
 const puffs=Array.from({length:Math.round(14*Math.max(.5,q))},(_,i)=>{const s=new T.Sprite(new T.SpriteMaterial({map:puffTex,transparent:true,depthWrite:false}));s.userData.o=i/14;scene.add(s);return s});

 /* ---------- moving life: lorry, birds, butterflies ---------- */
 const lorry=new T.Group();lorry.userData.info='lorry';scene.add(lorry);
 const cabPaint=mat(0x2f6fa6,.4,.4);box(1.35,.25,0,.95,.85,1.05,cabPaint,lorry);box(1.83,.6,0,.02,.36,.9,glass,lorry);box(-.55,.25,0,2.9,.12,1.1,dark,lorry);
 for(const s of [-1,1])box(-.55,.37,s*.53,2.9,.5,.04,mat(0x8c6a3b,.8),lorry);box(-1.98,.37,0,.04,.5,1.1,mat(0x8c6a3b,.8),lorry);
 const ffb=new T.InstancedMesh(new T.IcosahedronGeometry(.17,1),mat(0x6a1f15,.7),36);for(let k=0;k<36;k++){o.position.set(-1.8+(k%9)*.38,.62+Math.floor(k/18)*.18+(rnd()-.5)*.06,-.32+(Math.floor(k/9)%2)*.64);o.rotation.set(rnd()*3,rnd()*3,0);o.scale.setScalar(.9+rnd()*.3);o.updateMatrix();ffb.setMatrixAt(k,o.matrix)}ffb.castShadow=false;lorry.add(ffb);
 const wheels=[];for(const x of [1.3,-.3,-1.4])for(const s of [-1,1]){const w=add(new T.CylinderGeometry(.24,.24,.18,14),mat(0x1b1d1d,.9),x,.24,s*.55,lorry,false);w.rotation.x=Math.PI/2;wheels.push(w)}
 const lorryBlob=blobShadow(1.9,.35);lorryBlob.scale.set(1,.42,1);lorryBlob.position.y=.01;lorry.add(lorryBlob);lorry.traverse(m=>{if(m.isMesh)m.castShadow=false});
 const birdGeo=new T.BufferGeometry();birdGeo.setAttribute('position',new T.Float32BufferAttribute([0,0,-.07,0,0,.07,.3,0,0],3));birdGeo.computeVertexNormals();const birdMat=mat(0x2a3330,.8,0,{side:T.DoubleSide});
 const birds=Array.from({length:Math.round(7*Math.max(.45,q))},(_,i)=>{const g=new T.Group();const l=new T.Mesh(birdGeo,birdMat),r=new T.Mesh(birdGeo,birdMat);r.rotation.y=Math.PI;g.add(l,r);scene.add(g);return {g,l,r,a:rnd()*6.28,R:7+rnd()*6,h:5+rnd()*3,s:.18+rnd()*.12}});
 const flyMat=mat(0xf2b93a,.6,0,{side:T.DoubleSide});const wingGeo=new T.PlaneGeometry(.06,.05);wingGeo.translate(.03,0,0);
 const flies=Array.from({length:Math.round(5*Math.max(.4,q))},()=>{const g=new T.Group();const l=new T.Mesh(wingGeo,flyMat),r=new T.Mesh(wingGeo,flyMat);r.rotation.y=Math.PI;g.add(l,r);scene.add(g);return {g,l,r,cx:(rnd()-.5)*14,cz:4+rnd()*.3,ph:rnd()*9}});

 // Steps down from the platform to the yard on both sides and at the front.
 const stepMat=mat(0xb9b3a4,.85);for(const [x,z,ax] of [[-6.38,.7,'x'],[6.38,-.4,'x'],[-2.2,3.42,'z'],[2.6,3.42,'z']])for(let k=0;k<3;k++){const o2=(k+.5)*.12;const w=ax==='x'?.12:.9,d=ax==='x'?.9:.12;box(x+(ax==='x'?Math.sign(x)*(o2-.18):0),-.29,z+(ax==='z'?Math.sign(z)*(o2-.18):0),w,.38-k*.12,d,stepMat)}
 mergeStatic(stat);
 function update(t){
  wind.value=t;atmosphere.update(t);
  for(const f of fans)f.rotation.z=-t*18;acFan.rotation.z=t*14;beacon.material.emissiveIntensity=(t%1.6)<.15?3:.2;
  level.scale.y=.78+.12*Math.sin(t*.05);level.position.y=-.25+.7*level.scale.y;
  const dir=.6+.35*Math.sin(t*.11);sock.rotation.y=dir+.12*Math.sin(t*1.7);sock.rotation.z=-.25+.18*Math.sin(t*.9)+.05*Math.sin(t*7);sockBody.scale.y=1+.05*Math.sin(t*9);
  puffs.forEach((p,i)=>{const f=(p.userData.o+t*.035)%1;p.position.set(26+f*6*Math.cos(dir),11.2+f*7,-22+f*4*Math.sin(dir));const s=1.2+f*5.5;p.scale.set(s,s,1);p.material.opacity=.55*(1-f)})
  const cycle=34,ph=(t%cycle)/cycle;const lx=-48+ph*96;lorry.position.set(lx,-.29,6.05);lorry.visible=ph<.98;for(const w of wheels)w.rotation.y=-lx/.24;lorry.position.y=-.29+.008*Math.sin(t*23);
  for(const b of birds){const a=b.a+t*b.s;b.g.position.set(Math.cos(a)*b.R,b.h+.4*Math.sin(t*.6+b.a),-2+Math.sin(a)*b.R*.6);b.g.rotation.y=-a;const flap=.7*Math.sin(t*10+b.a*5);b.l.rotation.x=flap;b.r.rotation.x=-flap}
  for(const f of flies){const k=t*.5+f.ph;f.g.position.set(f.cx+1.2*Math.sin(k*.7)+.3*Math.sin(k*3.1),-.05+.25*Math.abs(Math.sin(k*1.3)),f.cz+.5*Math.sin(k*.9));f.g.rotation.y=k;const flap=1.1*Math.sin(t*28+f.ph);f.l.rotation.y=flap;f.r.rotation.y=Math.PI-flap}
  for(const fn of dynamic)fn(t);
 }
 return {update,airMain,reusePipe:[[6.15,.34,.7],[7.25,.34,.7],[7.25,.34,1.75],[7.6,.34,1.75]]};
}
