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
