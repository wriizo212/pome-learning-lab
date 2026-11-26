import * as T from './three.module.min.js';

/*
 Shared "alive scene" helpers: a global wind clock that sways foliage on the GPU,
 a gradient sky with drifting clouds, soft blob shadows for moving things, static
 mesh merging, and procedural canvas textures (concrete, grass, gravel, asphalt,
 corrugated cladding, safety signs, painted floor markings).
*/

export const wind={value:0};
let seed=777;const rnd=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);

// GPU sway: vertices higher above `base` bend more; no per-frame CPU work.
export function windify(material,{strength=.012,base=0}={}){
 material.onBeforeCompile=shader=>{
  shader.uniforms.uTime=wind;shader.uniforms.uWind={value:strength};shader.uniforms.uBase={value:base};
  shader.vertexShader='uniform float uTime;uniform float uWind;uniform float uBase;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
   vec4 wPos=modelMatrix*instanceMatrix*vec4(transformed,1.);
  #else
   vec4 wPos=modelMatrix*vec4(transformed,1.);
  #endif
  float hgt=max(0.,wPos.y-uBase);
  float sway=(sin(uTime*1.55+wPos.x*.37+wPos.z*.29)+.45*sin(uTime*3.9+wPos.x*1.7+wPos.z*1.1))*uWind*hgt*hgt;
  transformed.x+=sway;transformed.z+=sway*.55;`);
 };
 material.customProgramCacheKey=()=>'wind'+strength+'_'+base;
 return material;
}

export function canvas(size,draw){const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');draw(g,size);return c}
export function texture(c,{repeat=[1,1],srgb=true,aniso=4}={}){const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(...repeat);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=aniso;return t}
function speckle(g,s,n,light,dark,w=2){for(let i=0;i<n;i++){g.fillStyle=rnd()>.5?light:dark;const k=1+rnd()*w;g.fillRect(rnd()*s,rnd()*s,k,k)}}
function blot(g,x,y,r,color){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,color);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}

export function concrete(size,{base='#b4aea0',streaks=true,joints=0}={}){
 return canvas(size,(g,s)=>{g.fillStyle=base;g.fillRect(0,0,s,s);speckle(g,s,s*s/14,'rgba(255,252,235,.12)','rgba(40,32,22,.14)',2.5);
  for(let i=0;i<s/18;i++)blot(g,rnd()*s,rnd()*s,s*(.04+rnd()*.08),'rgba(70,60,40,.11)');
  if(streaks)for(let i=0;i<s/9;i++){const x=rnd()*s,y=rnd()*s*.4,l=s*(.15+rnd()*.5);const gr=g.createLinearGradient(0,y,0,y+l);gr.addColorStop(0,'rgba(45,40,30,.16)');gr.addColorStop(1,'rgba(45,40,30,0)');g.fillStyle=gr;g.fillRect(x,y,1+rnd()*2.5,l)}
  if(streaks){const gr=g.createLinearGradient(0,s*.86,0,s);gr.addColorStop(0,'rgba(64,86,48,0)');gr.addColorStop(1,'rgba(64,86,48,.28)');g.fillStyle=gr;g.fillRect(0,s*.86,s,s*.14)}
  if(joints){g.strokeStyle='rgba(50,44,36,.35)';g.lineWidth=Math.max(1,s/256);for(let k=1;k<joints;k++){const p=k*s/joints;g.beginPath();g.moveTo(p,0);g.lineTo(p,s);g.moveTo(0,p);g.lineTo(s,p);g.stroke()}}
 });
}
export function grass(size){
 return canvas(size,(g,s)=>{g.fillStyle='#5f7a3e';g.fillRect(0,0,s,s);
  for(let i=0;i<s/6;i++)blot(g,rnd()*s,rnd()*s,s*(.05+rnd()*.12),rnd()>.5?'rgba(132,150,72,.35)':'rgba(48,70,34,.35)');
  for(let i=0;i<s*s/9;i++){const x=rnd()*s,y=rnd()*s;g.strokeStyle=['rgba(120,150,70,.55)','rgba(70,100,45,.55)','rgba(160,170,90,.35)'][i%3];g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x+(rnd()-.5)*3,y-2-rnd()*4);g.stroke()}
  for(let i=0;i<s/12;i++)blot(g,rnd()*s,rnd()*s,s*.03,'rgba(120,96,60,.35)');
 });
}
export function gravel(size,base='#8f877a'){
 return canvas(size,(g,s)=>{g.fillStyle=base;g.fillRect(0,0,s,s);
  for(let i=0;i<s*s/22;i++){const r=.8+rnd()*2.4,c=140+rnd()*80|0;g.fillStyle=`rgba(${c},${c-8},${c-22},.8)`;g.beginPath();g.ellipse(rnd()*s,rnd()*s,r,r*.7,rnd()*3,0,7);g.fill();g.fillStyle='rgba(30,26,20,.35)';g.fillRect(rnd()*s,rnd()*s,1.4,1.4)}
 });
}
export function asphalt(size){
 return canvas(size,(g,s)=>{g.fillStyle='#3d4143';g.fillRect(0,0,s,s);speckle(g,s,s*s/8,'rgba(170,170,165,.16)','rgba(10,10,10,.22)',1.6);
  for(let i=0;i<6;i++)blot(g,rnd()*s,rnd()*s,s*.12,'rgba(20,20,20,.25)');
  g.fillStyle='#d8d2bd';for(let x=0;x<s;x+=s/4)g.fillRect(x,s*.49,s/8,s*.02);g.fillStyle='#e4dcc4';g.fillRect(0,s*.05,s,s*.015);g.fillRect(0,s*.93,s,s*.015);
 });
}
export function corrugated(size,base='#8fa39b'){
 return canvas(size,(g,s)=>{for(let x=0;x<s;x++){const k=.5+.5*Math.sin(x/s*Math.PI*24);g.fillStyle=`rgba(${(k*60+150)|0},${(k*60+160)|0},${(k*55+150)|0},1)`;g.fillRect(x,0,1,s)}
  g.globalCompositeOperation='multiply';g.fillStyle=base;g.fillRect(0,0,s,s);g.globalCompositeOperation='source-over';
  for(let i=0;i<s/10;i++){const x=rnd()*s,y=rnd()*s;const gr=g.createLinearGradient(0,y,0,y+s*.3);gr.addColorStop(0,'rgba(140,70,30,.35)');gr.addColorStop(1,'rgba(140,70,30,0)');g.fillStyle=gr;g.fillRect(x,y,2,s*.3)}
 });
}
// A safety sign: coloured header band, symbol and message lines.
export function sign({title,lines=[],band='#d8352a',bg='#f4f1e6',fg='#1d2221',symbol='!'},w=512,h=320){
 const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
 g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle=band;g.fillRect(0,0,w,h*.3);
 g.fillStyle='#fff';g.font=`bold ${h*.17}px Arial`;g.textAlign='center';g.fillText(title,w/2,h*.215);
 g.fillStyle=band;g.beginPath();g.moveTo(w*.14,h*.42);g.lineTo(w*.24,h*.85);g.lineTo(w*.04,h*.85);g.closePath();g.fill();
 g.fillStyle='#fff';g.font=`bold ${h*.25}px Arial`;g.fillText(symbol,w*.14,h*.8);
 g.fillStyle=fg;g.textAlign='left';g.font=`bold ${h*.105}px Arial`;lines.forEach((l,i)=>g.fillText(l,w*.3,h*(.5+i*.15)));
 g.strokeStyle='#1d2221';g.lineWidth=6;g.strokeRect(3,3,w-6,h-6);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}
// Painted platform top: joints, stains, wet patches, walkway lines and hazard edging.
export function platformDecal(px,{w=12.4,d=6.5,aisles=[[1.95,2.95]],keepouts=[]}={}){
 const c=document.createElement('canvas');c.width=px;c.height=Math.round(px*d/w);const g=c.getContext('2d'),W=c.width,H=c.height,sx=W/w,sz=H/d;
 const X=x=>(x+w/2)*sx,Z=z=>(z+d/2)*sz;
 g.drawImage(concrete(512,{base:'#b8b2a3',streaks:false}),0,0,W,H);
 g.strokeStyle='rgba(60,54,44,.4)';g.lineWidth=Math.max(1,W/1200);for(let x=-6;x<=6;x+=1.55){g.beginPath();g.moveTo(X(x),0);g.lineTo(X(x),H);g.stroke()}for(let z=-3;z<=3;z+=1.6){g.beginPath();g.moveTo(0,Z(z));g.lineTo(W,Z(z));g.stroke()}
 for(let i=0;i<40;i++)blot(g,rnd()*W,rnd()*H,W*(.01+rnd()*.025),'rgba(55,45,30,.18)');
 for(const [x,z,r] of [[-4.55,1.9,.5],[1.6,1.85,.45],[4.75,1.55,.35],[3.2,-1.3,.5],[-1.4,1.45,.4]])blot(g,X(x),Z(z),r*sx,'rgba(40,46,44,.32)');
 for(const [a,b] of aisles){g.fillStyle='rgba(90,140,92,.22)';g.fillRect(0,Z(a),W,Z(b)-Z(a));g.fillStyle='#e8c440';const lw=.05*sz;g.fillRect(0,Z(a),W,lw);g.fillRect(0,Z(b)-lw,W,lw);
  g.fillStyle='rgba(240,240,225,.8)';g.font=`bold ${.22*sz}px Arial`;g.textAlign='center';for(const x of [-3.6,.9,4.8]){g.fillText('◀  SAFE WALKWAY  ▶',X(x),Z((a+b)/2)+.08*sz)}}
 const hz=.12*sz;for(let x=0;x<W;x+=hz*2){g.fillStyle='#e8c440';g.beginPath();g.moveTo(x,0);g.lineTo(x+hz,0);g.lineTo(x,hz);g.fill();g.beginPath();g.moveTo(x,H);g.lineTo(x+hz,H);g.lineTo(x,H-hz);g.fill()}
 g.fillStyle='#e8c440';g.fillRect(0,0,W,hz*.25);g.fillRect(0,H-hz*.25,W,hz*.25);
 for(const [x1,z1,x2,z2] of keepouts){g.strokeStyle='rgba(232,196,64,.85)';g.lineWidth=.04*sz;g.setLineDash([.12*sz,.08*sz]);g.strokeRect(X(x1),Z(z1),X(x2)-X(x1),Z(z2)-Z(z1));g.setLineDash([])}
 for(const [x,z] of [[-2.2,2.45],[3.5,2.45],[-5.7,-.5]]){g.fillStyle='#2b2f2e';g.fillRect(X(x)-.25*sx,Z(z)-.12*sz,.5*sx,.24*sz);g.fillStyle='#6d7470';for(let k=0;k<8;k++)g.fillRect(X(x)-.23*sx+k*.06*sx,Z(z)-.1*sz,.025*sx,.2*sz)}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;
}

let blobTex;
export function blobShadow(radius=.24,opacity=.38){
 blobTex||=new T.CanvasTexture(canvas(64,(g,s)=>{const gr=g.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.55,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,s,s)}));
 const m=new T.Mesh(new T.PlaneGeometry(radius*2,radius*2),new T.MeshBasicMaterial({map:blobTex,transparent:true,opacity,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
 m.rotation.x=-Math.PI/2;m.renderOrder=1;return m;
}

// Merge a group's direct mesh children by material so static props cost one draw call each.
export function mergeStatic(group,keep=new Set()){
 const buckets=new Map();
 for(const m of [...group.children]){if(!m.isMesh||m.isInstancedMesh||keep.has(m))continue;const k=m.material.uuid+(m.castShadow?'s':'');if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(m)}
 for(const list of buckets.values()){
  if(list.length<2)continue;const pos=[],nor=[],uv=[];
  for(const m of list){m.updateMatrix();const g=(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone()).applyMatrix4(m.matrix);
   pos.push(...g.attributes.position.array);nor.push(...g.attributes.normal.array);if(g.attributes.uv)uv.push(...g.attributes.uv.array);else for(let i=0;i<g.attributes.position.count;i++)uv.push(0,0);g.dispose();group.remove(m)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeBoundingSphere();
  const out=new T.Mesh(g,list[0].material);out.castShadow=list[0].castShadow;out.receiveShadow=true;group.add(out);
 }
}

// Gradient sky dome with a soft sun glow, plus drifting cloud sprites.
export function sky(scene,{zenith=0x4d7f99,horizon=0xb7c9c0,ground=0x55624f,sunDir=new T.Vector3(-.45,.75,.5)}={}){
 const mat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:{zen:{value:new T.Color(zenith)},hor:{value:new T.Color(horizon)},gnd:{value:new T.Color(ground)},sun:{value:sunDir.clone().normalize()}},
  vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 zen;uniform vec3 hor;uniform vec3 gnd;uniform vec3 sun;varying vec3 vDir;void main(){float h=vDir.y;vec3 c=h>0.?mix(hor,zen,pow(h,.55)):mix(hor,gnd,pow(-h,.4));float s=max(0.,dot(vDir,sun));c+=vec3(1.,.86,.62)*(pow(s,320.)*1.6+pow(s,8.)*.16);gl_FragColor=vec4(c,1.);}'});
 const dome=new T.Mesh(new T.SphereGeometry(95,32,16),mat);dome.renderOrder=-10;dome.frustumCulled=false;scene.add(dome);
 const cloudTex=new T.CanvasTexture(canvas(128,(g,s)=>{for(let i=0;i<14;i++){const x=s*(.2+rnd()*.6),y=s*(.4+rnd()*.25),r=s*(.12+rnd()*.16);blot(g,x,y,r,'rgba(255,255,255,.55)')}}));
 const clouds=Array.from({length:9},(_,i)=>{const sp=new T.Sprite(new T.SpriteMaterial({map:cloudTex,transparent:true,opacity:.75,depthWrite:false,fog:false}));const s=14+rnd()*16;sp.scale.set(s,s*.42,1);sp.userData={a:rnd()*6.28,r:55+rnd()*25,y:20+rnd()*16,sp:.004+rnd()*.004};scene.add(sp);return sp});
 return {dome,update(t){for(const c of clouds){const a=c.userData.a+t*c.userData.sp;c.position.set(Math.cos(a)*c.userData.r,c.userData.y,Math.sin(a)*c.userData.r)}}};
}

/*
 Oil palm (Elaeis guineensis) modelled from life: a stout trunk wrapped in the spiral of
 old frond bases (leaf boots) with a few epiphytic ferns, a crown of long pinnate fronds
 that arch up then droop (younger fronds upright, oldest ones yellowing and hanging),
 leaflets inserted in two planes along the rachis, an unopened spear leaf in the centre,
 and fresh fruit bunches (ripe orange-red and unripe black) tucked in the frond axils.
 One vertex-coloured geometry, meant for InstancedMesh + windify().
*/
export function oilPalm({fronds=30,leaflets=22,height=2.6,trunkR=.19,seed=7,bunches=3,boots=true}={}){
 let s=seed>>>0;const r=()=>((s=Math.imul(1664525,s)+1013904223>>>0)/4294967296);
 const pos=[],nor=[],col=[],c=new T.Color(),tmp=new T.Color();
 function push(geo,color,vary=0){const g=geo.index?geo.toNonIndexed():geo;g.computeVertexNormals();const p=g.attributes.position.array,n=g.attributes.normal.array;
  for(let i=0;i<p.length;i+=3){pos.push(p[i],p[i+1],p[i+2]);nor.push(n[i],n[i+1],n[i+2]);c.set(color);if(vary)c.offsetHSL(0,0,(r()-.5)*vary);col.push(c.r,c.g,c.b)}}
 function tri(list,color,vary=.06){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(list,3));push(g,color,vary)}
 // Trunk: slight taper and lean, rough with ring scars.
 const trunk=new T.CylinderGeometry(trunkR*.92,trunkR*1.12,height,12,12);trunk.translate(0,height/2,0);
 const tp=trunk.attributes.position;for(let i=0;i<tp.count;i++){const y=tp.getY(i),k=1+.07*Math.sin(y*22)+.05*(r()-.5);tp.setX(i,tp.getX(i)*k+.04*Math.sin(y*.9));tp.setZ(i,tp.getZ(i)*k)}
 push(trunk,0x5e5040,.12);
 // Leaf boots: the cut bases of old fronds spiral up the trunk (137.5° phyllotaxis).
 if(boots){const n=Math.round(height*15);for(let i=0;i<n;i++){const y=.35+i/n*(height-.45),a=i*2.39996,b=new T.CylinderGeometry(.018,.042,.17,5);b.rotateX(Math.PI/2);b.scale(1,.55,1);b.translate(0,0,.085);b.rotateX(-.75);b.rotateY(a);b.translate(Math.sin(a)*trunkR*.8+.04*Math.sin(y*.9),y,Math.cos(a)*trunkR*.8);push(b,i%3?0x6b5940:0x7c6a4c,.12)}
  for(let i=0;i<4;i++){const a=r()*6.28,y=.6+r()*(height-1),f=new T.ConeGeometry(.05,.13,5,1,true);f.rotateX(-1.1);f.rotateY(a);f.translate(Math.sin(a)*trunkR*1.15,y,Math.cos(a)*trunkR*1.15);push(f,0x5f8a37,.1)}}
 const top=height+.04;
 // Spear leaves: tightly folded young fronds pointing straight up.
 for(let i=0;i<3;i++){const sp=new T.ConeGeometry(.035,.75+.2*i,5);sp.translate(0,(.75+.2*i)/2,0);sp.rotateX((r()-.5)*.25);sp.rotateZ((r()-.5)*.25);sp.translate(0,top,0);push(sp,0x8fb24a,.05)}
 // Fronds.
 for(let j=0;j<fronds;j++){
  const age=j/(fronds-1),dead=age>.93&&r()<.7,a=j*2.39996+r()*.15;
  const ca=Math.cos(a),sa=Math.sin(a),side=[-sa,0,ca];
  const L=(1.75+.35*r())*(.75+.35*Math.min(1,age*1.6))*(height/2.6),phi0=1.15-1.15*age+.12,droop=.7+1.4*age+(dead?1.2:0);
  const base=[ca*trunkR*.6,top-.22*age,sa*trunkR*.6],pts=[],dirs=[];let p=[...base],segs=14;
  for(let k=0;k<=segs;k++){const t=k/segs,ph=phi0-droop*t*t,d=[Math.cos(ph)*ca,Math.sin(ph),Math.cos(ph)*sa];pts.push([...p]);dirs.push(d);p=[p[0]+d[0]*L/segs,p[1]+d[1]*L/segs,p[2]+d[2]*L/segs]}
  const green=dead?0x9a8a4c:age>.8?0x4e6f2d:age<.2?0x7aa543:0x5c8636;
  // Rachis (midrib) as a tapered ribbon.
  const rib=[];for(let k=0;k<segs;k++){const w0=.03*(1-k/segs)+.006,w1=.03*(1-(k+1)/segs)+.006,a0=pts[k],a1=pts[k+1];
   const q=(pt,w,sgn)=>[pt[0]+side[0]*w*sgn,pt[1]+.008,pt[2]+side[2]*w*sgn];rib.push(...q(a0,w0,-1),...q(a0,w0,1),...q(a1,w1,1),...q(a0,w0,-1),...q(a1,w1,1),...q(a1,w1,-1))}
  tri(rib,dead?0x8a7a44:0x9aa060,.05);
  // Leaflets (pinnae) in two planes, longest mid-frond, drooping at the tips.
  const leaf=[];for(let k=0;k<leaflets;k++){const t=.1+.88*k/leaflets,idx=Math.min(segs-1,Math.floor(t*segs)),f=t*segs-idx;
   const P=pts[idx].map((v,m)=>v+(pts[idx+1][m]-v)*f),D=dirs[idx];const len=(.12+.42*Math.sin(Math.PI*Math.min(1,t*1.05)))*(height/2.6),w=.028+.012*Math.sin(Math.PI*t);
   for(const sgn of [-1,1]){const up=((k+(sgn>0?1:0))%2?.55:-.25)+(r()-.5)*.2;
    const dir=[side[0]*sgn*.85+D[0]*.45,up*.6+D[1]*.3,side[2]*sgn*.85+D[2]*.45],dl=Math.hypot(...dir);dir[0]/=dl;dir[1]/=dl;dir[2]/=dl;
    const tip=[P[0]+dir[0]*len,P[1]+dir[1]*len-(.06+.1*age)*len,P[2]+dir[2]*len],mid=[P[0]+dir[0]*len*.55,P[1]+dir[1]*len*.55-.02*len,P[2]+dir[2]*len*.55];
    const b1=[P[0]-D[0]*w,P[1]-D[1]*w,P[2]-D[2]*w],b2=[P[0]+D[0]*w,P[1]+D[1]*w,P[2]+D[2]*w],m1=[mid[0]-D[0]*w*.8,mid[1]-D[1]*w*.8,mid[2]-D[2]*w*.8],m2=[mid[0]+D[0]*w*.8,mid[1]+D[1]*w*.8,mid[2]+D[2]*w*.8];
    leaf.push(...b1,...b2,...m2,...b1,...m2,...m1,...m1,...m2,...tip)}}
  tri(leaf,green,.1);
 }
 // Fresh fruit bunches in the frond axils.
 for(let b=0;b<bunches;b++){const a=b*2.1+r(),ripe=b%2===0,cx=Math.cos(a)*trunkR*1.25,cz=Math.sin(a)*trunkR*1.25,cy=top-.32-r()*.12;
  for(let k=0;k<22;k++){const u=r()*6.28,v=r()*3.14,rr=.085+.02*r(),fr=new T.IcosahedronGeometry(.027,1);fr.translate(cx+Math.sin(v)*Math.cos(u)*rr,cy+Math.cos(v)*rr*1.3,cz+Math.sin(v)*Math.sin(u)*rr);
   push(fr,ripe?(k%3?0xc4461f:0xe0782c):(k%3?0x241513:0x3a1c16),.08)}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeBoundingSphere();
 return g;
}
export function palmMaterial(strength=.02){return windify(new T.MeshStandardMaterial({vertexColors:true,roughness:.82,metalness:0,side:T.DoubleSide}),{strength,base:1.2})}

// Image-based lighting from the sky dome, so water, glass and steel pick up real reflections.
export function environment(renderer,scene,{intensity=.55,zenith=0x4d7f99,horizon=0xb7c9c0,ground=0x55624f,sunDir=new T.Vector3(-6,11,8)}={}){
 const env=new T.Scene();sky(env,{zenith,horizon,ground,sunDir});
 const pm=new T.PMREMGenerator(renderer);const rt=pm.fromScene(env,.03);pm.dispose();
 scene.environment=rt.texture;scene.environmentIntensity=intensity;return rt.texture;
}

// Tileable ripple normal map (sum of waves) for moving water.
export function rippleNormal(size=256){
 const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d'),img=g.createImageData(size,size);
 const waves=Array.from({length:7},(_,i)=>({kx:Math.round((rnd()-.5)*10)||1,ky:Math.round((rnd()-.5)*10)||2,a:.5/(i+1),p:rnd()*6.28}));
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){let dx=0,dy=0;for(const w of waves){const ph=(w.kx*x+w.ky*y)/size*6.283+w.p,cs=Math.cos(ph)*w.a;dx+=cs*w.kx;dy+=cs*w.ky}
  const n=[-dx*.05,-dy*.05,1],l=Math.hypot(...n),i=(y*size+x)*4;img.data[i]=(n[0]/l*.5+.5)*255;img.data[i+1]=(n[1]/l*.5+.5)*255;img.data[i+2]=(n[2]/l*.5+.5)*255;img.data[i+3]=255}
 g.putImageData(img,0,0);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;return t;
}
