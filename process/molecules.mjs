import * as T from './three.module.min.js';

/*
 Shared chemistry kit: ball-and-stick molecules (CPK colours) and particles that the
 process scenes move through each treatment step. Everything is instanced, so one
 draw call covers every copy of a kind. Molecules are drawn hugely enlarged; counts
 and speeds are illustrative, not measured.
*/

export const ATOM={C:0x2f3437,H:0xf3f3ee,O:0xe0473b,N:0x4c72e6,S:0xe6cf3c};
const RADIUS={C:.55,H:.33,O:.5,N:.52,S:.62};

function merged(parts){
 const pos=[],nor=[],col=[],idx=[];const c=new T.Color();
 for(const [geo,color] of parts){
  const g=geo.index?geo:geo;const off=pos.length/3;c.set(color);
  const p=g.attributes.position.array,n=g.attributes.normal.array;
  for(let i=0;i<p.length;i+=3){pos.push(p[i],p[i+1],p[i+2]);nor.push(n[i],n[i+1],n[i+2]);col.push(c.r,c.g,c.b)}
  if(g.index)for(const i of g.index.array)idx.push(off+i);else for(let i=0;i<p.length/3;i++)idx.push(off+i);
  geo.dispose();
 }
 const out=new T.BufferGeometry();
 out.setAttribute('position',new T.Float32BufferAttribute(pos,3));out.setAttribute('normal',new T.Float32BufferAttribute(nor,3));
 out.setAttribute('color',new T.Float32BufferAttribute(col,3));out.setIndex(idx);out.computeBoundingSphere();return out;
}
let SEG=[8,6,5],HSEG=[6,4];
function molecule(atoms,bonds=[]){
 const parts=[];
 for(const [el,x,y,z] of atoms){const seg=el==='H'?HSEG:SEG;const g=new T.SphereGeometry(RADIUS[el],seg[0],seg[1]);g.translate(x,y,z);parts.push([g,ATOM[el]])}
 for(const [i,j] of bonds){
  const a=new T.Vector3(...atoms[i].slice(1)),b=new T.Vector3(...atoms[j].slice(1)),d=b.clone().sub(a);
  const g=new T.CylinderGeometry(.11,.11,d.length(),SEG[2]);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize()));
  const m=a.lerp(b,.5);g.translate(m.x,m.y,m.z);parts.push([g,0x9aa3a0]);
 }
 return merged(parts);
}
const tetra=[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]].map(v=>v.map(n=>n*.62));

function buildGeometries(){
 const G={};
 G.ch4=molecule([['C',0,0,0],...tetra.map(v=>['H',...v])],[[0,1],[0,2],[0,3],[0,4]]);
 G.co2=molecule([['O',-1.15,0,0],['C',0,0,0],['O',1.15,0,0]],[[0,1],[1,2]]);
 G.o2=molecule([['O',-.6,0,0],['O',.6,0,0]],[[0,1]]);
 G.h2o=molecule([['O',0,0,0],['H',.75,-.58,0],['H',-.75,-.58,0]],[[0,1],[0,2]]);
 G.nh4=molecule([['N',0,0,0],...tetra.map(v=>['H',...v])],[[0,1],[0,2],[0,3],[0,4]]);
 G.no3=molecule([['N',0,0,0],...[0,1,2].map(k=>['O',Math.cos(k*2.094)*1.15,Math.sin(k*2.094)*1.15,0])],[[0,1],[0,2],[0,3]]);
 G.h2s=molecule([['S',0,0,0],['H',.9,-.68,0],['H',-.9,-.68,0]],[[0,1],[0,2]]);
 G.acetate=molecule([['C',0,0,0],['H',-.55,.62,.3],['H',-.55,-.5,.55],['H',-.4,-.25,-.75],['C',1.3,.25,0],['O',2.05,-.45,0],['O',1.65,1.35,0]],[[0,1],[0,2],[0,3],[0,4],[4,5],[4,6]]);
 // Long-chain organic (a fatty-acid / carbohydrate fragment) stands for COD.
 const chain=[],bonds=[];
 for(let i=0;i<6;i++){chain.push(['C',i*.86-2.15,i%2?.5:0,0]);if(i)bonds.push([i-1,i])}
 for(let i=0;i<6;i++){const [,x,y]=chain[i];const up=i%2?1:-1;chain.push(['H',x,y+up*.42,i%2?.62:-.62]);bonds.push([i,chain.length-1])}
 chain.push(['O',2.15+.25,1.3,0]);bonds.push([5,chain.length-1]);chain.push(['O',2.15+.8,.05,0]);bonds.push([5,chain.length-1]);
 G.cod=molecule(chain,bonds);
 G.oil=new T.SphereGeometry(1,SEG[0]+4,SEG[1]+3);
 G.fibre=merged([0,1,2,3].map(k=>{const g=new T.CylinderGeometry(.16,.2,1.1,6);g.rotateZ(Math.PI/2+.35*Math.sin(k*2.1));g.translate(k*.95-1.4,.18*Math.sin(k*1.7),.1*Math.cos(k*2.3));return [g,k%2?0x8a6a3a:0x6e5430]}));
 const floc=[];for(let k=0;k<11;k++){const a=k*2.4,r=k?.55+.25*Math.sin(k*1.3):0,g=new T.SphereGeometry(.42+.12*Math.cos(k*1.9),9,6);g.translate(Math.cos(a)*r,Math.sin(k*1.1)*.4,Math.sin(a)*r);floc.push([g,k%3?0xb69c69:0x8f7848])}
 for(let k=0;k<6;k++){const g=new T.CapsuleGeometry(.08,.3,2,5);g.rotateZ(k);g.translate(Math.cos(k*1.7)*.7,Math.sin(k*2.2)*.5,Math.sin(k*1.7)*.7);floc.push([g,0x4b6b3c])}
 G.floc=merged(floc);
 const gran=[[new T.IcosahedronGeometry(1,1),0x2d2620]];for(let k=0;k<7;k++){const g=new T.SphereGeometry(.22,6,4);g.translate(Math.cos(k*.9)*.92,Math.sin(k*1.7)*.7,Math.sin(k*.9)*.92*Math.cos(k));gran.push([g,0x6b4a31])}
 G.granule=merged(gran);
 G.bubble=new T.SphereGeometry(1,SEG[0]+4,SEG[1]+3);G.steam=new T.SphereGeometry(1,8,6);G.parcel=new T.SphereGeometry(1,12,8);G.spark=new T.OctahedronGeometry(1,0);
 return G;
}

const kits={};
function kit(detail=1){
 const key=detail>=1.5?'x':detail>=.9?'h':detail>=.6?'m':'l';if(kits[key])return kits[key];
 // x = zoomed-in HD: smooth atoms and round bonds.
 SEG={x:[13,9,7],h:[8,6,5],m:[7,5,4],l:[6,4,4]}[key];HSEG={x:[8,6],h:[6,4],m:[5,3],l:[4,3]}[key];
 const G=buildGeometries();
 const atoms=new T.MeshStandardMaterial({vertexColors:true,roughness:.32,metalness:.05});
 const M={
  ch4:atoms,co2:atoms,o2:atoms,h2o:atoms,nh4:atoms,no3:atoms,h2s:atoms,acetate:atoms,cod:atoms,fibre:atoms,floc:atoms,granule:atoms,
  oil:new T.MeshStandardMaterial({color:0xf0c44c,roughness:.12,metalness:.1,transparent:true,opacity:.82,emissive:0x4a3300}),
  bubble:new T.MeshStandardMaterial({color:0xdff7f5,roughness:.04,metalness:.15,transparent:true,opacity:.3,depthWrite:false}),
  steam:new T.MeshStandardMaterial({color:0xffffff,roughness:1,transparent:true,opacity:.16,depthWrite:false}),
  spark:new T.MeshStandardMaterial({color:0xfff2a0,emissive:0xffd54a,emissiveIntensity:2.4,roughness:.4})
 };
 kits[key]={G,M};return kits[key];
}

// Pools hold instanced copies; the scene fills them every frame.
export function chemistry(scene,capacity={},enlarge=1.3,{density=1,detail=1}={}){
 const {G,M}=kit(detail);const pools={};const o=new T.Object3D();const root=new T.Group();root.name='chemistry';scene.add(root);
 const defaults={ch4:160,co2:160,o2:220,h2o:320,nh4:40,no3:40,h2s:24,acetate:60,cod:160,oil:40,fibre:40,floc:60,granule:40,bubble:260,steam:60,spark:40};
 for(const [k,n] of Object.entries({...defaults,...capacity})){const m=new T.InstancedMesh(G[k],M[k],n);m.frustumCulled=false;m.castShadow=m.receiveShadow=false;m.count=0;m.userData.capacity=n;root.add(m);pools[k]={mesh:m,used:0,n,seq:0}}
 // Density thins every kind evenly (lighter tiers draw fewer copies).
 function keep(p){p.seq++;return density>=1||Math.floor(p.seq*density)!==Math.floor((p.seq-1)*density)}
 function put(kind,x,y,z,s=1,spin=0,tilt=0){const p=pools[kind];if(!p||p.used>=p.n||s<=.001||!keep(p))return;o.position.set(x,y,z);o.rotation.set(tilt+spin*.7,spin,spin*.4);o.scale.setScalar(s*enlarge);o.updateMatrix();p.mesh.setMatrixAt(p.used++,o.matrix)}
 function stretch(kind,x,y,z,sx,sy,sz,ry=0){const p=pools[kind];if(!p||p.used>=p.n||!keep(p))return;o.position.set(x,y,z);o.rotation.set(0,ry,0);o.scale.set(sx,sy,sz);o.updateMatrix();p.mesh.setMatrixAt(p.used++,o.matrix)}
 function begin(){for(const p of Object.values(pools)){p.used=0;p.seq=0}}
 function end(){for(const p of Object.values(pools)){p.mesh.count=p.used;p.mesh.instanceMatrix.needsUpdate=true}}
 // Swap every pool to another detail level (used by zoom-in HD) without reallocating instances.
 function setDetail(d){const next=kit(d);for(const [k,p] of Object.entries(pools))if(next.G[k])p.mesh.geometry=next.G[k]}
 return {put,stretch,begin,end,root,pools,show(v){root.visible=v},setDensity(d){density=d},setDetail};
}

// Deterministic per-slot random tables.
export function seeds(n,k,seed=11){let s=seed>>>0;const r=()=>((s=Math.imul(1664525,s)+1013904223>>>0)/4294967296);return Array.from({length:n},()=>Array.from({length:k},r))}
export const clamp01=x=>Math.min(1,Math.max(0,x));
export const smooth=x=>{x=clamp01(x);return x*x*(3-2*x)};
export const band=(f,a,b)=>clamp01((f-a)/(b-a));
export function lerpPath(pts,f,out){const n=pts.length-1,u=clamp01(f)*n,i=Math.min(n-1,Math.floor(u)),k=u-i;out[0]=pts[i][0]+(pts[i+1][0]-pts[i][0])*k;out[1]=pts[i][1]+(pts[i+1][1]-pts[i][1])*k;out[2]=pts[i][2]+(pts[i+1][2]-pts[i][2])*k;return out}

// Wavy translucent liquid surface. Waves and their normals are computed on the GPU.
// calm: base agitation; rows: up to 3 z-lines of strong agitation (aeration diffusers); spot: [x,z,radius,strength].
export const liquidClock={value:0};
export function liquidSurface(parent,{x,y,z,w,d,r,color,opacity=.86,rough=.18,calm=0,rows=[],spot=[0,0,1,0]}){
 const geo=r?new T.CircleGeometry(r,48,0,Math.PI*2):new T.PlaneGeometry(w,d,Math.max(8,Math.round(w*16)),Math.max(6,Math.round(d*16)));geo.rotateX(-Math.PI/2);
 const mat=new T.MeshStandardMaterial({color,roughness:rough,metalness:.15,transparent:true,opacity,depthWrite:false,side:T.DoubleSide});
 addWaves(mat,{calm,rows,spot});
 const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.receiveShadow=true;m.renderOrder=2;parent.add(m);
 return {mesh:m,mat,update(){}};
}
// GPU waves for any flat (XZ) water mesh; normals follow the waves.
export function addWaves(mat,{calm=0,rows=[],spot=[0,0,1,0],amp=1}={}){
 const rowV=[0,1,2].map(i=>new T.Vector3(rows[i]??99,0,rows[i]===undefined?0:1));
 mat.onBeforeCompile=sh=>{
  Object.assign(sh.uniforms,{uT:liquidClock,uCalm:{value:calm},uRows:{value:rowV},uSpot:{value:new T.Vector4(...spot)},uAmp:{value:amp}});
  sh.vertexShader=`uniform float uT;uniform float uCalm;uniform vec3 uRows[3];uniform vec4 uSpot;uniform float uAmp;
  float agit(vec2 p){float k=uCalm;for(int i=0;i<3;i++)k+=uRows[i].z*max(0.,1.-abs(p.y-uRows[i].x)*6.);k+=uSpot.w*max(0.,1.-distance(p,uSpot.xy)/uSpot.z);return k;}
  float wave(vec2 p){float k=agit(p);return uAmp*((.006+.02*k)*sin(p.x*9.+uT*2.1+p.y*3.)+(.004+.016*k)*cos(p.y*11.-uT*2.7)+.012*k*sin(p.x*23.+p.y*17.+uT*9.));}
  `+sh.vertexShader.replace('#include <beginnormal_vertex>',`vec2 wp=(modelMatrix*vec4(position,1.)).xz;float h0=wave(wp);
  vec3 objectNormal=normalize(vec3(-(wave(wp+vec2(.01,0.))-h0)/.01,1.,-(wave(wp+vec2(0.,.01))-h0)/.01));
  #ifdef USE_TANGENT
  vec3 objectTangent=vec3(tangent.xyz);
  #endif`).replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.y+=h0;');
 };
 mat.customProgramCacheKey=()=>'liquid';
 return mat;
}

// Translucent liquid body that reveals the molecules inside a cut-away tank.
export function liquidVolume(parent,{x,y,z,w,h,d,r,color,opacity=.26}){
 const geo=r?new T.CylinderGeometry(r,r,h,40):new T.BoxGeometry(w,h,d);
 const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.1,metalness:0,transparent:true,opacity,depthWrite:false}));
 m.position.set(x,y,z);m.renderOrder=1;parent.add(m);return m;
}

const LEGEND=[
 ['ch4','CH₄ methane','biogas fuel',['C','H']],
 ['co2','CO₂ carbon dioxide','from digestion and respiration',['O','C','O']],
 ['o2','O₂ oxygen','blown in as air',['O','O']],
 ['h2o','H₂O water','most of POME',['H','O','H']],
 ['cod','Organic matter (COD)','oil, sugar and protein fragments',['C','C','C','O']],
 ['acetate','CH₃COO⁻ acetate','volatile fatty acid made in the digester',['C','C','O']],
 ['nh4','NH₄⁺ ammonium → NO₃⁻ nitrate','nitrified in the aeration basin',['N','H']],
 ['h2s','H₂S hydrogen sulphide','trace gas, corrosive and odorous',['S','H']]
];
export function legend(frame,{open}={}){
 const box=document.createElement('details');box.className='chem-legend';box.open=open??matchMedia('(min-width:820px)').matches;
 const hex=n=>'#'+n.toString(16).padStart(6,'0');
 box.innerHTML='<summary>Molecule key</summary><ul>'+LEGEND.map(([,name,note,atoms])=>`<li><span class="atoms">${atoms.map(a=>`<i style="background:${hex(ATOM[a])}"></i>`).join('')}</span><b>${name}</b><small>${note}</small></li>`).join('')+
 '<li><span class="atoms"><i style="background:#f0c44c"></i></span><b>Oil and grease droplet</b></li><li><span class="atoms"><i style="background:#b69c69"></i><i style="background:#2d2620"></i></span><b>Biomass floc or sludge granule</b><small>microbes doing the treatment</small></li><li><span class="atoms"><i style="background:#8a6a3a;border-radius:2px;width:18px"></i></span><b>Fibre and shell (screenings)</b></li></ul>'+
 '<p class="atom-key">'+Object.entries(ATOM).map(([el,c])=>`<span><i style="background:${hex(c)}"></i>${el}</span>`).join('')+'</p><p class="scale-note">Molecules are drawn about 100 million times enlarged. Counts and speeds are illustrative.</p>';
 frame.append(box);return box;
}
