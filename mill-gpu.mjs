import {populate} from './process/crew.mjs?v=shift19';
import {explore} from './process/explore.mjs?v=shift19';
import {arcadeProcess} from './process/arcade-flows.mjs?v=shift19';
import {legend} from './process/molecules.mjs?v=shift19';
import {arcadeScenery,arcadeExtras,arcadeDetails,arcadeWorld} from './process/arcade-scenery.mjs?v=shift19';
import {TIERS,resolveTier,savedChoice,saveChoice,lower,canRaise} from './process/quality.mjs?v=shift19';
import {windify,texture,concrete as concreteCanvas,grass,oilPalm,palmMaterial,environment,rippleNormal,premiumSurfaces,contactShadow} from './process/life.mjs?v=shift19';
import {arcadePlay} from './process/play.mjs?v=shift19';
import {addWaves} from './process/molecules.mjs?v=shift19';
import {hdZoom,hardware} from './process/hd.mjs?v=shift19';
import {frameBudget} from './process/frame-budget.mjs?v=shift19';
import {warmShaders,densityKnob} from './process/warmup.mjs?v=shift19';
import {arcadeWeather} from './process/arcade-weather.mjs?v=shift19';
/* GPU mill diorama. Dimensions share a single model-space scale. */
export function mount(T, host, onPick) {
  let tierName=resolveTier(),tier=TIERS[tierName];
  const renderer = new T.WebGLRenderer({antialias:tierName!=='lite',alpha:false,powerPreference:'high-performance'});
  const canvas = renderer.domElement;
  renderer.shadowMap.enabled=tier.shadows;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.12;
  canvas.tabIndex=0;
  canvas.setAttribute('aria-label','Interactive 3D treatment plant');
  canvas.style.cssText='display:block;width:100%;height:100%;touch-action:none;cursor:grab';
  const scene=new T.Scene(), camera=new T.PerspectiveCamera(36,1,.1,190);
  scene.background=new T.Color(0x243833);
  scene.fog=new T.FogExp2(0x44574a,.021);
  const hemi=new T.HemisphereLight(0xddeeff,0x91856c,2.05);scene.add(hemi);
  const sun=new T.DirectionalLight(0xffdda6,3.15);
  sun.position.set(-8,12,5);sun.castShadow=true;sun.shadow.mapSize.set(tier.shadowSize,tier.shadowSize);
  Object.assign(sun.shadow.camera,{left:-11,right:11,top:12,bottom:-12,near:.2,far:38});
  sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.018;scene.add(sun);
  const rim=new T.DirectionalLight(0xb4e8ec,1.2);rim.position.set(8,5,-7);scene.add(rim);
  let seed=1849;
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  function finish(color,roughness,metalness,kind){
    const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
    g.fillStyle=color;g.fillRect(0,0,256,256);
    for(let i=0;i<10000;i++){const light=random()>.46;g.fillStyle=light?'rgba(255,249,218,.13)':'rgba(19,27,24,.19)';
      const w=kind==='metal'?1+random()*29:1+random()*3;
      g.fillRect(random()*256,random()*256,w,kind==='metal'?.7:1+random()*2);}
    if(kind==='panel'){for(let i=0;i<256;i+=64){g.fillStyle='#26372e69';g.fillRect(i,0,2,256);g.fillRect(0,i,256,1);g.fillStyle='#d7dfd2';g.fillRect(i+4,5,2,2);}}
    const map=new T.CanvasTexture(c);map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(3,2);map.colorSpace=T.SRGBColorSpace;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    return new T.MeshStandardMaterial({map,roughness,metalness,bumpMap:map,bumpScale:kind==='soil'?.055:.012});
  }
  const steel=finish('#a4ada9',.35,.66,'metal'), dark=finish('#34463d',.54,.42,'panel'), concrete=finish('#a49e89',.88,.02,'stone'),
    soil=finish('#777d56',.96,0,'soil'),gravel=finish('#908574',.95,0,'soil'), roof=finish('#647b6a',.5,.4,'panel'),
    bark=finish('#78684a',.92,0,'soil'), compost=finish('#7d5c3b',.98,0,'soil');
  {const ct=texture(concreteCanvas(tier.texture,{base:'#a49e89'}),{repeat:[2,2]});concrete.map=ct;concrete.bumpMap=ct;concrete.bumpScale=.02;const gt=texture(grass(tier.texture),{repeat:[10,8]});soil.map=gt;soil.bumpMap=gt;soil.color.set(0xd9dcc8);}
  const solid=(color,roughness=.52,metalness=.2)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const brass=solid(0xd8a24e), teal=solid(0x50857c), red=solid(0xb85035), leaf=windify(solid(0x466938,.85,0),{strength:.02,base:1.1});leaf.side=T.DoubleSide;
  const units={}, targets={}, movers=[],waters=[],covers=new Set();let cut=false;
  let currentUnit='', parent=scene;
  function unit(id,x,y,z){currentUnit=id;parent=new T.Group();scene.add(parent);units[id]=parent;targets[id]=new T.Vector3(x,y,z);}
  function mesh(geo,mat,x,y,z){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;m.userData.unit=currentUnit;parent.add(m);return m;}
  const boxGeo=new T.BoxGeometry(1,1,1);
  function box(x,y,z,w,h,d,mat){const m=mesh(boxGeo,mat,x,y+h/2,z);m.scale.set(w,h,d);return m;}
  function cyl(x,y,z,rt,rb,h,mat,n=36){return mesh(new T.CylinderGeometry(rt,rb,h,n),mat,x,y+h/2,z);}
  const pipeSegs=[];
  function pipe(a,b,r,mat){pipeSegs.push([a,b,r]);const v=new T.Vector3(...a),d=new T.Vector3(...b).sub(v);const m=mesh(new T.CylinderGeometry(r,r,d.length(),10),mat,...v.addScaledVector(d,.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
  function line(points,r,mat){points.slice(1).forEach((p,i)=>pipe(points[i],p,r,mat));}
  function ring(x,y,z,r,t,mat,horizontal=true){const m=mesh(new T.TorusGeometry(r,t,6,48),mat,x,y,z);if(horizontal)m.rotation.x=Math.PI/2;return m;}
  function palm(x,z,h){
    pipe([x,0,z],[x+.18,h,z],.085,bark);
    for(let j=0;j<9;j++){const a=j*.698+random()*.16,L=1.05+random()*.55,verts=[];
      function point(t,side,drop){return [x+.18+Math.cos(a)*L*t-Math.sin(a)*side,h+Math.sin(Math.PI*t)*.32-t*t*.48-drop,z+Math.sin(a)*L*t+Math.cos(a)*side];}
      for(let i=1;i<=12;i++){const t=i/14,w=.19*Math.sin(Math.PI*t)+.04;for(const s of [-1,1])verts.push(...point(t,0,0),...point(t+.06,0,0),...point(t+.15,s*w,.09));}
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.computeVertexNormals();mesh(geo,leaf,0,0,0);
      line([point(0,0,0),point(.45,0,0),point(1,0,0)],.016,leaf);}
  }
  box(0,-.65,0,16,.65,12,soil);box(0,.009,1.25,15,.024,.86,gravel);box(-5.7,.009,-1,.8,.026,5.4,gravel);
  // Realistic oil palms along the back of the board (instanced, sway in the wind).
  const palmRow=new T.InstancedMesh(oilPalm({fronds:30,leaflets:22,height:2.3,seed:5,bunches:3}),palmMaterial(.022),13),pr=new T.Object3D();
  for(let i=0;i<13;i++){pr.position.set(-7+i*1.16,0,-5.1+random()*.45);pr.rotation.set((random()-.5)*.05,random()*6.28,(random()-.5)*.05);pr.scale.setScalar(.85+random()*.35);pr.updateMatrix();palmRow.setMatrixAt(i,pr.matrix)}
  palmRow.castShadow=palmRow.receiveShadow=true;palmRow.userData.info='palm';scene.add(palmRow);
  function water(x,y,z,w,d,color){const geo=new T.PlaneGeometry(w,d,32,16);geo.rotateX(-Math.PI/2);const m=mesh(geo,solid(color,.22,.24),x,y,z);m.castShadow=false;waters.push(m);return m;}
  function basin(x,z,w,d,color){box(x,.02,z,w,.08,d,concrete);covers.add(water(x,.38,z,w-.14,d-.14,color));for(const s of [-1,1]){const wall=box(x,.09,z+s*d/2,w,.41,.09,concrete);if(s===1)covers.add(wall);box(x+s*w/2,.09,z,.09,.41,d,concrete);}}
  unit('intake',-4,.5,-.7);basin(-4,-.7,2,2,0x664d30);for(let i=0;i<12;i++)pipe([-4.85+i*.14,.53,-1.6],[-4.85+i*.14,.58,-1],.023,steel);
  unit('digester',-.9,1.9,-1.65);const digester=parent;
  cyl(-.9,.02,-1.65,1.52,1.52,.15,concrete);steel.side=T.DoubleSide;mesh(new T.CylinderGeometry(1.38,1.38,1.65,64,1,true,1.25,3.84),steel,-.9,.995,-1.65);
  covers.add(mesh(new T.CylinderGeometry(1.38,1.38,1.65,64,1,true,5.09,Math.PI*2-3.84),steel,-.9,.995,-1.65));
  cyl(-.9,.18,-1.65,1.31,1.31,.44,compost);
  for(const dx of [-.58,0,.58]){cyl(-.9+dx,1.16,-1.65,.09,.36,.38,dark);pipe([-.9+dx,1.54,-1.65],[-.9+dx,1.78,-1.65],.06,brass)}
  const dome=mesh(new T.SphereGeometry(1.4,48,20,0,Math.PI*2,0,Math.PI/2),roof,-.9,1.82,-1.65);dome.scale.y=.43;covers.add(dome);
  for(const y of [.28,.72,1.18,1.78])ring(-.9,y,-1.65,1.39,.025,dark);
  for(let i=0;i<18;i++){const a=i*Math.PI/9;pipe([-.9+1.38*Math.cos(a),.2,-1.65+1.38*Math.sin(a)],[-.9+1.38*Math.cos(a),1.8,-1.65+1.38*Math.sin(a)],.012,steel);}
  for(const x of [-1.11,-.76])pipe([x,.1,-.23],[x,2.1,-.23],.024,brass);
  for(let i=0;i<10;i++)pipe([-1.11,.2+i*.18,-.23],[-.76,.2+i*.18,-.23],.018,steel);
  ring(-.9,1.99,-1.65,1.48,.021,brass);
  for(let i=0;i<16;i++){const a=i*Math.PI/8;const x=-.9+1.48*Math.cos(a),z=-1.65+1.48*Math.sin(a);pipe([x,1.66,z],[x,1.99,z],.017,brass);}
  line([[-.9,2.41,-1.65],[-.9,2.7,-1.65],[-.9,2.7,-3.6],[2.1,2.7,-3.6],[2.1,.55,-3.6]],.075,brass);
  parent=new T.Group();scene.add(parent);const pond=parent;pond.visible=false;basin(-.9,-1.65,2.9,2.6,0x65684b);
  unit('gas',3,1.3,-3);box(3.1,0,-3.1,2.5,.16,1.75,concrete);box(3.1,.16,-3.81,2.25,1.17,.08,dark);covers.add(box(3.1,.16,-2.39,2.25,1.17,.08,dark));for(const dx of [-1,1])box(3.1+dx,.18,-3.1,.09,1.14,1.45,dark);for(let j=0;j<4;j++){cyl(2.35+j*.23,.29,-3.1,.12,.12,.43,teal);cyl(2.35+j*.23,.72,-3.1,.15,.15,.065,steel)}pipe([2.19,.4,-3.1],[3.95,.4,-3.1],.1,steel);pipe([3.45,.51,-3.1],[3.93,.51,-3.1],.26,brass);
  for(let i=0;i<20;i++)covers.add(box(2.02+i*.115,.17,-2.33,.023,1.14,.04,steel));
  covers.add(box(3.1,1.33,-3.1,2.48,.1,1.72,roof));cyl(3.9,1.42,-3.55,.11,.13,.9,steel);cyl(3.9,2.3,-3.55,.16,.16,.055,dark);
  const fan=new T.Group();fan.position.set(2.7,1.49,-3.12);parent.add(fan);const engine=parent;parent=fan;
  for(let i=0;i<5;i++){const a=i*1.2566;const m=box(.21*Math.cos(a),0,.21*Math.sin(a),.4,.035,.10,steel);m.rotation.y=-a;}parent=engine;movers.push(fan);ring(2.7,1.52,-3.12,.46,.035,steel);
  unit('polish',3,.8,-.35);basin(3,-.35,3,2.1,0x447d71);
  for(const z of [-.91,-.35,.19]){pipe([1.71,.16,z],[4.31,.16,z],.042,teal);for(let j=0;j<6;j++)cyl(1.92+j*.43,.19,z,.09,.09,.04,dark)}
  for(const z of [-1.45,.74]){pipe([1.45,.94,z],[4.55,.94,z],.022,brass);for(let i=0;i<6;i++)pipe([1.45+i*.62,.42,z],[1.45+i*.62,.95,z],.019,brass);}
  box(3,.52,-.35,.32,.06,2.26,steel);cyl(3,.58,-.34,.16,.18,.19,teal);
  for(const z of [-.72,.05]){box(.99,.03,z,.65,.13,.48,concrete);pipe([.77,.4,z],[1.21,.4,z],.14,teal);for(let i=0;i<5;i++)pipe([.78+i*.055,.4,z],[.8+i*.055,.4,z],.16,steel);}
  line([[-3,.36,-.8],[-2.5,.36,-.8],[-2.5,.36,-1.65]],.08,steel);line([[.46,.38,-1.65],[.99,.38,-1.65],[.99,.38,-.35],[1.6,.38,-.35]],.08,teal);
  pipe([.99,.38,-1.07],[.99,.73,-1.07],.04,steel);ring(.99,.75,-1.07,.14,.026,red);
  unit('sludge',-2.6,.65,2.5);box(-2.6,0,2.55,3.5,.14,1.4,concrete);
  box(-2.6,.14,2.55,3.45,.09,1.38,gravel);box(-2.6,.23,2.55,3.45,.09,1.38,soil);pipe([-4.15,.20,3.27],[-1.05,.20,3.27],.065,teal);
  for(let i=0;i<4;i++){const m=mesh(new T.SphereGeometry(.45,16,9),compost,-3.8+i*.8,.22,2.55);m.scale.set(1,.64,1.3);}
  unit('river',2,.24,4.75);covers.add(water(0,.09,4.75,15.9,1.9,0x436e64));box(0,.024,4.75,15.9,.034,1.86,gravel);for(let i=0;i<23;i++){const rock=cyl(-7+i*.64,.048,4.38+random()*.8,.1,.15,.07,concrete,7);rock.rotation.y=random()*6}
  line([[4.52,.39,-.35],[5.2,.39,-.35],[5.2,.39,4.05],[5.2,.19,4.05]],.09,steel);
  // Finite shadow-catching ground beneath the landscaped exhibit.
  currentUnit='';parent=scene;box(0,-.77,0,100,.1,100,solid(0x293c33,.99,0));
  const marker=cyl(0,0,0,.11,0,.22,brass,8);
  // Batch fixed pieces by material so individual palm leaflets, pipe joints and rails
  // do not each require a draw call. Keep moving surfaces and pickable units separate.
  for(const group of [scene,...Object.values(units),pond]){
    const batches=new Map();
    for(const part of [...group.children]){
      if(!part.isMesh || waters.includes(part) || part===marker)continue;
      const batchId=part.material.uuid+'-'+part.userData.unit+'-'+covers.has(part);
      if(!batches.has(batchId))batches.set(batchId,[]);
      batches.get(batchId).push(part);
    }
    for(const parts of batches.values()){
      if(parts.length<2)continue;
      const positions=[],normals=[],uvs=[];
      for(const part of parts){
        part.updateMatrix();
        const geometry=part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone();
        geometry.applyMatrix4(part.matrix);
        positions.push(...geometry.attributes.position.array);
        normals.push(...geometry.attributes.normal.array);
        if(geometry.attributes.uv)uvs.push(...geometry.attributes.uv.array);
        else for(let i=0;i<geometry.attributes.position.count;i++)uvs.push(0,0);
        group.remove(part);geometry.dispose();
      }
      const g=new T.BufferGeometry();
      for(const [name,values,n] of [['position',positions,3],['normal',normals,3],['uv',uvs,2]])g.setAttribute(name,new T.Float32BufferAttribute(values,n));
      const m=new T.Mesh(g,parts[0].material);m.userData.unit=parts[0].userData.unit;m.castShadow=m.receiveShadow=true;if(covers.has(parts[0])){for(const p of parts)covers.delete(p);covers.add(m)}group.add(m);
    }
  }
  let stage='intake',yaw=.52,pitch=.65,distance=17,sy=.52,sp=.65,sd=17,spin=false,paused=false,frame,previous=0,time=0,drag;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function reset(){visitor.setMode('orbit');yaw=.52;pitch=.65;distance=17;spin=false;}
  function zoom(delta){distance=Math.max(6,Math.min(40,distance-delta*9));}
  const ray=new T.Raycaster();
  canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,moved:0};canvas.setPointerCapture(e.pointerId);};
  canvas.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved+=Math.abs(dx)+Math.abs(dy);drag.x=e.clientX;drag.y=e.clientY;if(visitor.isWalking())visitor.look(dx*.008,dy*.006);else orbit(dx*.008,dy*.006);};
  canvas.onpointercancel=()=>{drag=null;};
  canvas.onpointerup=e=>{if(drag&&drag.moved<5&&document.pointerLockElement!==canvas){const rect=canvas.getBoundingClientRect(),u=(e.clientX-rect.left)/rect.width,v=(e.clientY-rect.top)/rect.height;if(!play.handleClick(u,v))pick(u,v);}drag=null;};
  canvas.onwheel=e=>{e.preventDefault();zoom(e.deltaY<0?.12:-.12);};
  canvas.onkeydown=e=>{const actions={ArrowLeft:()=>yaw-=.15,ArrowRight:()=>yaw+=.15,ArrowUp:()=>pitch=Math.min(1.33,pitch+.1),ArrowDown:()=>pitch=Math.max(.2,pitch-.1),'+':()=>zoom(.12),'=':()=>zoom(.12),'-':()=>zoom(-.12),Home:reset};if(actions[e.key]){e.preventDefault();actions[e.key]();}};
  const wrapper=document.createElement('div');wrapper.className='mill-gpu';wrapper.style.cssText='width:100%';
  const viewport=document.createElement('div');viewport.className='reactor-frame';viewport.style.cssText='height:clamp(360px,54vh,650px);position:relative';viewport.append(canvas);wrapper.append(viewport);
  const section=document.createElement('button');section.textContent='Cutaway';section.setAttribute('aria-pressed','false');wrapper.append(section);
  const switchSection=()=>{cut=!cut;for(const m of covers)m.visible=!cut;section.setAttribute('aria-pressed',String(cut));budget.refreshShadows()};section.onclick=switchSection;
  const world=populate(scene,{steel,brass,cement:concrete,dark,base:gravel},true);
  let polluted=false;
  const flows=arcadeProcess(scene,{world,isCut:()=>cut,isPond:()=>pond.visible,isPolluted:()=>polluted,tier});
  const scenery=arcadeScenery(scene,{steel,brass,dark,concrete,teal,roof},{isPond:()=>pond.visible,isPolluted:()=>polluted});flows.hook(scenery.hook);
  const extras=arcadeExtras(scene,{steel,brass,dark,concrete,teal},tier);
  const siteDetail=arcadeDetails(scene,{steel,dark,concrete},tier,{isPolluted:()=>polluted});flows.hook(siteDetail.hook);
  // The landscape beyond the board: river, kampung, palms, road, animals.
  const outer=arcadeWorld(scene,{steel,dark,concrete,riverMat:waters.at(-1).material},tier,{emit:e=>world.emit(e)});world.setRiverHealth(()=>!polluted);
  // Sky reflections on water, glass and steel; moving ripple normals on all water.
  environment(renderer,scene,{intensity:.5,horizon:0xb0c3b6,sunDir:new T.Vector3(-8,12,5)});
  // Premium finish: normal-mapped relief, sharper filtering, contact shadows under equipment.
  premiumSurfaces(scene,tier,renderer);
  for(const [cx,cz,w,d] of [[-4,-.7,2.6,2.6],[-.9,-1.65,3.6,3.6],[3.1,-3.1,3,2.3],[3,-.35,3.6,2.7],[-2.6,2.55,4.1,2],[-6.7,-2.6,2.2,2],[7,2.4,1.8,1.3],[6.95,-.55,1.5,1.3],[-7.2,.6,1.2,2.6]])contactShadow(scene,cx,.014,cz,w,d,.4);
  const ripples=rippleNormal(256);ripples.repeat.set(4,4);
  for(const m of waters){m.material.normalMap=ripples;m.material.normalScale=new T.Vector2(.35,.35);m.material.roughness=.08;m.material.metalness=.05;m.material.needsUpdate=true}
  // Water ripples run on the GPU (no per-frame CPU work).
  waters.forEach((m,i)=>addWaves(m.material,i===0?{spot:[-4.85,-.1,.6,1],calm:.2}:m.position.z>4?{amp:.7,calm:.2}:Math.abs(m.position.x-3)<.1?{calm:.5,rows:[-.91,-.35,.19]}:{calm:.3}));
  const flanges=[];for(const [a,b,r] of pipeSegs){const d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],len=Math.hypot(...d);if(len<.45||r<.04)continue;const axis=Math.abs(d[1])>Math.abs(d[0])&&Math.abs(d[1])>Math.abs(d[2])?'y':Math.abs(d[0])>Math.abs(d[2])?'x':'z';for(const k of [.1,.9])flanges.push([a[0]+d[0]*k,a[1]+d[1]*k,a[2]+d[2]*k,r*1.45,axis])}
  const details=hardware(scene,{rings:[...[.28,.72,1.18,1.78].map(y=>({x:-.9,y,z:-1.65,r:1.41,n:60,a0:1.25,sweep:3.84})),{x:-.9,y:.18,z:-1.65,r:1.48,n:44,vertical:true,s:.016}],flanges,
   plates:[{title:'D-101 DIGESTER',sub:'covered · 35 °C',at:[-.9,.1,-.11],w:.36},{title:'T-301 POLISHING',sub:'DO 2 mg/L',at:[4.555,.3,-.35],ry:Math.PI/2,w:.34},{title:'G-401 GENSET',sub:'biogas · 400 V',at:[4.37,.65,-3.1],ry:Math.PI/2,w:.3},{title:'T-001 INTAKE',sub:'POME 80 °C',at:[-5.055,.3,-.7],ry:-Math.PI/2,w:.3}]});
  const molecules=document.createElement('button');molecules.textContent='Molecules';molecules.setAttribute('aria-pressed','true');wrapper.append(molecules);
  const qualityLabel=document.createElement('label');qualityLabel.className='quality';qualityLabel.innerHTML='Quality <select aria-label="Rendering quality"><option value="auto">Auto</option><option value="high">High</option><option value="balanced">Balanced</option><option value="lite">Lite</option></select>';wrapper.append(qualityLabel);
  const qualitySelect=qualityLabel.querySelector('select');qualitySelect.value=savedChoice();
  const hdBadge=document.createElement('span');hdBadge.className='hd-badge';hdBadge.textContent='HD';hdBadge.hidden=true;viewport.append(hdBadge);
  function applyTier(name){tierName=name;tier=TIERS[name];const shadowType=tier.cheapShadows?T.PCFShadowMap:T.PCFSoftShadowMap,recompile=renderer.shadowMap.enabled!==tier.shadows||renderer.shadowMap.type!==shadowType;renderer.shadowMap.enabled=tier.shadows;renderer.shadowMap.type=shadowType;sun.castShadow=tier.shadows;flows.chem.setDensity(tier.molecules);budget.setCap(tier.pixels);budget.refreshShadows();if(recompile){scene.traverse(m=>{if(m.material)m.material.needsUpdate=true});if(knob)warmShaders(renderer,scene,camera)}qualitySelect.options[0].textContent=savedChoice()==='auto'?'Auto ('+tier.label+')':'Auto'}
  const fpsMeter=document.createElement('small');fpsMeter.className='fps-meter';fpsMeter.title='Rendered frames per second';qualityLabel.after(fpsMeter);
  let knob=null;
  const budget=frameBudget(renderer,fps=>{fpsMeter.textContent=fps+' FPS'},{cap:tier.pixels,onStruggle(){if(knob&&knob.level>.6){knob.set(knob.level-.2);return true}const next=savedChoice()==='auto'&&lower(tierName);if(next){applyTier(next);return true}return false},onRecover(){if(knob&&knob.level<1){knob.set(knob.level+.2);return true}const up=canRaise(tierName);if(up){applyTier(up);return true}return false}});
  const hd=hdZoom({budget,chem:flows.chem,sun,flows,details,getTier:()=>tier,near:9.5,far:11.5,onChange:on=>{hdBadge.hidden=!on}});
  qualitySelect.onchange=()=>{saveChoice(qualitySelect.value);applyTier(resolveTier(qualitySelect.value));hd.refresh()};applyTier(tierName);
  const key=legend(viewport,{open:false});molecules.onclick=()=>{const on=molecules.getAttribute('aria-pressed')!=='true';molecules.setAttribute('aria-pressed',String(on));flows.chem.show(on);key.hidden=!on};
  const orbit=(dx,dy)=>{yaw-=dx;pitch=Math.max(.2,Math.min(1.33,pitch+dy))};
  function pick(u,v){ray.setFromCamera(new T.Vector2(u*2-1,1-v*2),camera);const id=ray.intersectObjects([...Object.values(units),pond],true).find(hit=>hit.object.visible&&hit.object.userData.unit&&hit.object.parent.visible)?.object.userData.unit;if(id){onPick(id);play?.showInfo(id)}}
  const visitor=explore(wrapper,canvas,camera,world,orbit,pick,switchSection,delta=>zoom(-delta*.16),true);
  const play=arcadePlay({scene,camera,canvas,viewport,wrapper,world,visitor,flows,outer,isPond:()=>pond.visible,isPolluted:()=>polluted});
  if(new URLSearchParams(location.search).has('debug'))window.__arcade={visitor,world,play,renderer,scene,camera,flows,scenery,extras,budget,hd};
  // Game events shown on the plant: storm, alarm beacons, fireworks.
  const weatherFx=arcadeWeather(scene,{sun,hemi,fogColor:0x44574a,engine:targets.gas?.clone()||new T.Vector3(1.6,0,-3.2)});
  // Live plant status card: river oxygen, captured biogas, power and weather follow the pathway and the games (illustrative values).
  const hud=document.createElement('div');hud.className='plant-hud';viewport.append(hud);let hudT=1;
  function hudUpdate(dt,t){if((hudT+=dt)<.5)return;hudT=0;const open=pond.visible,storm=weatherFx.storm,alarmOn=weatherFx.alarm;
   const DO=polluted?2.1+.3*Math.sin(t):6.9-1.6*storm+.2*Math.sin(t*.7),gas=open?0:alarmOn?165+25*Math.sin(t*3):330+12*Math.sin(t*.9),kw=gas*2;
   const row=(icon,name,value,tone)=>'<div data-tone="'+tone+'"><span>'+icon+' '+name+'</span><b>'+value+'</b></div>';
   hud.innerHTML='<h4>Plant status <small>live · illustrative</small></h4>'+row('🐟','River oxygen',DO.toFixed(1)+' mg/L',DO<4?'bad':DO<5.5?'warn':'good')+row('🔥','Biogas',open?'escaping to air':Math.round(gas)+' m³/h',open?'bad':alarmOn?'warn':'good')+row('⚡','Power',open?'0 kW':Math.round(kw)+' kW',open?'bad':alarmOn?'warn':'good')+row(storm>.5?'⛈️':storm>.05?'🌧️':'☀️','Weather',storm>.5?'Storm':storm>.05?'Rain':'Clear',storm>.5?'warn':'good')+(alarmOn?row('🚨','Alarm','digester upset','bad'):'');}
  // Compile every shader now (hidden units too) so nothing stalls when it first appears.
  warmShaders(renderer,scene,camera);knob=densityKnob(scene);
  wrapper.querySelector('.hand-start').addEventListener('click',()=>window.stopCamera?.(true),true);
  window.addEventListener('pome-quiz-camera',()=>visitor.stop());
  let visible=false;const center=new T.Vector3(0,.5,0);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting});observer.observe(wrapper);
  function draw(now){
    frame=requestAnimationFrame(draw);if(document.hidden||!visible||!wrapper.clientWidth){budget.idle();return}budget.tick(now);
    const dt=Math.min(.08,(now-previous)/1000);previous=now;
    if(!paused&&!reduced){time+=dt;if(spin)yaw+=dt*.18;fan.rotation.y+=dt*4;}
    const w=viewport.clientWidth,h=viewport.clientHeight;world.animate(time);weatherFx.update(dt,time);hudUpdate(dt,time);scenery.update(time);extras.update(time);siteDetail.update(time);outer.update(time);flows.update(time);play.update(dt);ripples.offset.set(time*.03,time*.05);
    if(canvas.width!==Math.floor(w*renderer.getPixelRatio())||canvas.height!==Math.floor(h*renderer.getPixelRatio()))renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();const radius=distance*Math.max(1,1.25/camera.aspect);
    const ck=1-Math.exp(-dt*7);sy+=(yaw-sy)*ck;sp+=(pitch-sp)*ck;sd+=(distance-sd)*ck;const rr=sd*Math.max(1,1.25/camera.aspect);
    const walking=visitor.frame(dt);if(!walking){camera.position.set(rr*Math.cos(sp)*Math.sin(sy),.6+rr*Math.sin(sp),rr*Math.cos(sp)*Math.cos(sy));camera.lookAt(0,.5,0)}
    hd.update(walking?0:distance,walking?camera.position:center);
    marker.visible=Boolean(targets[stage]);if(marker.visible){marker.position.copy(targets[stage]);marker.position.y+=.53+Math.sin(time*2)*.045;}
    renderer.render(scene,camera);budget.end();
  }
  host.replaceWith(wrapper);frame=requestAnimationFrame(draw);
  return {update(s){weatherFx.set(s);if('stage'in s)stage=s.stage;if('paused'in s)paused=s.paused;if(s.pathway!==undefined){renderer.shadowMap.needsUpdate=true;const open=['pond','ponds','conventional','0'].includes(String(s.pathway));digester.visible=!open;pond.visible=open;fan.visible=!open;}if('success'in s){polluted=s.success===false;waters.at(-1).material.color.set(polluted?0x756c42:0x436e64);}},reset,zoom,spin(s){spin=s;},rotate(delta,tilt=0){yaw+=delta;pitch=Math.max(0.2,Math.min(1.33,pitch+tilt));},destroy(){visitor.stop();observer.disconnect();cancelAnimationFrame(frame);renderer.dispose();}};
}