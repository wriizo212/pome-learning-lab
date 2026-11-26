import {populate} from './process/crew.mjs?v=shift3';
import {explore} from './process/explore.mjs?v=shift3';
import {frameBudget} from './process/frame-budget.mjs';
/* GPU mill diorama. Dimensions share a single model-space scale. */
export function mount(T, host, onPick) {
  const renderer = new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  const canvas = renderer.domElement;
  const budget=frameBudget(renderer);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.12;
  canvas.tabIndex=0;
  canvas.setAttribute('aria-label','Interactive 3D treatment plant');
  canvas.style.cssText='display:block;width:100%;height:100%;touch-action:none;cursor:grab';
  const scene=new T.Scene(), camera=new T.PerspectiveCamera(36,1,.1,150);
  scene.background=new T.Color(0x243833);
  scene.fog=new T.FogExp2(0x44574a,.021);
  scene.add(new T.HemisphereLight(0xddeeff,0x91856c,2.05));
  const sun=new T.DirectionalLight(0xffdda6,3.15);
  sun.position.set(-8,12,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
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
  const solid=(color,roughness=.52,metalness=.2)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const brass=solid(0xd8a24e), teal=solid(0x50857c), red=solid(0xb85035), leaf=solid(0x466938,.85,0);leaf.side=T.DoubleSide;
  const units={}, targets={}, movers=[],waters=[],covers=new Set();let cut=false;
  let currentUnit='', parent=scene;
  function unit(id,x,y,z){currentUnit=id;parent=new T.Group();scene.add(parent);units[id]=parent;targets[id]=new T.Vector3(x,y,z);}
  function mesh(geo,mat,x,y,z){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;m.userData.unit=currentUnit;parent.add(m);return m;}
  const boxGeo=new T.BoxGeometry(1,1,1);
  function box(x,y,z,w,h,d,mat){const m=mesh(boxGeo,mat,x,y+h/2,z);m.scale.set(w,h,d);return m;}
  function cyl(x,y,z,rt,rb,h,mat,n=36){return mesh(new T.CylinderGeometry(rt,rb,h,n),mat,x,y+h/2,z);}
  function pipe(a,b,r,mat){const v=new T.Vector3(...a),d=new T.Vector3(...b).sub(v);const m=mesh(new T.CylinderGeometry(r,r,d.length(),10),mat,...v.addScaledVector(d,.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
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
  for(let i=0;i<13;i++)palm(-7+i*1.16,-5.1+random()*.45,1.7+random()*.8);
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
  let stage='intake',yaw=.52,pitch=.65,distance=17,spin=false,paused=false,frame,previous=0,time=0,drag;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function reset(){visitor.setMode('orbit');yaw=.52;pitch=.65;distance=17;spin=false;}
  function zoom(delta){distance=Math.max(6,Math.min(29,distance-delta*9));}
  const ray=new T.Raycaster();
  canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,moved:0};canvas.setPointerCapture(e.pointerId);};
  canvas.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved+=Math.abs(dx)+Math.abs(dy);drag.x=e.clientX;drag.y=e.clientY;if(visitor.isWalking())visitor.look(dx*.008,dy*.006);else orbit(dx*.008,dy*.006);};
  canvas.onpointercancel=()=>{drag=null;};
  canvas.onpointerup=e=>{if(drag&&drag.moved<5){const rect=canvas.getBoundingClientRect();pick((e.clientX-rect.left)/rect.width,(e.clientY-rect.top)/rect.height);}drag=null;};
  canvas.onwheel=e=>{e.preventDefault();zoom(e.deltaY<0?.12:-.12);};
  canvas.onkeydown=e=>{const actions={ArrowLeft:()=>yaw-=.15,ArrowRight:()=>yaw+=.15,ArrowUp:()=>pitch=Math.min(1.33,pitch+.1),ArrowDown:()=>pitch=Math.max(.2,pitch-.1),'+':()=>zoom(.12),'=':()=>zoom(.12),'-':()=>zoom(-.12),Home:reset};if(actions[e.key]){e.preventDefault();actions[e.key]();}};
  const wrapper=document.createElement('div');wrapper.className='mill-gpu';wrapper.style.cssText='width:100%';
  const viewport=document.createElement('div');viewport.className='reactor-frame';viewport.style.cssText='height:clamp(360px,54vh,650px);position:relative';viewport.append(canvas);wrapper.append(viewport);
  const section=document.createElement('button');section.textContent='Cutaway';section.setAttribute('aria-pressed','false');wrapper.append(section);
  const switchSection=()=>{cut=!cut;for(const m of covers)m.visible=!cut;section.setAttribute('aria-pressed',String(cut));renderer.shadowMap.needsUpdate=true};section.onclick=switchSection;
  const world=populate(scene,{steel,brass,cement:concrete,dark,base:gravel},true);
  const orbit=(dx,dy)=>{yaw-=dx;pitch=Math.max(.2,Math.min(1.33,pitch+dy))};
  function pick(u,v){ray.setFromCamera(new T.Vector2(u*2-1,1-v*2),camera);const id=ray.intersectObjects([...Object.values(units),pond],true).find(hit=>hit.object.visible&&hit.object.userData.unit&&hit.object.parent.visible)?.object.userData.unit;if(id)onPick(id)}
  const visitor=explore(wrapper,canvas,camera,world,orbit,pick,switchSection,delta=>zoom(-delta*.16),true);
  const bubbles=new T.InstancedMesh(new T.SphereGeometry(.039,6,4),solid(0xa6d2c7),64);scene.add(bubbles);
  const droplet=new T.Object3D(),seeds=Array.from({length:64},()=>[random(),random(),random()]);
  function aerate(){bubbles.visible=cut;if(!cut)return;seeds.forEach(([a,b,c],i)=>{const t=(time*.32+c)%1;const gas=i<32&&digester.visible;droplet.position.set(gas?-1.72+a*1.6:1.75+a*2.53,gas?.64+t*.68:.16+t*.24,gas?-1.4+b*.52:-1.1+b*1.5);droplet.scale.setScalar(.55+.48*t);droplet.updateMatrix();bubbles.setMatrixAt(i,droplet.matrix)});bubbles.instanceMatrix.needsUpdate=true}
  wrapper.querySelector('.hand-start').addEventListener('click',()=>window.stopCamera?.(true),true);
  window.addEventListener('pome-quiz-camera',()=>visitor.stop());
  let visible=false,lastWater=-1;
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting});observer.observe(wrapper);
  function draw(now){
    frame=requestAnimationFrame(draw);if(document.hidden||!visible||!wrapper.clientWidth){budget.idle();return}budget.tick(now);
    const dt=Math.min(.08,(now-previous)/1000);previous=now;
    if(!paused&&!reduced){time+=dt;if(spin)yaw+=dt*.18;fan.rotation.y+=dt*4;}
    const w=viewport.clientWidth,h=viewport.clientHeight;world.animate(time);aerate();
    if(canvas.width!==Math.floor(w*renderer.getPixelRatio())||canvas.height!==Math.floor(h*renderer.getPixelRatio()))renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();const radius=distance*Math.max(1,1.25/camera.aspect);
    if(!visitor.frame(dt)){camera.position.set(radius*Math.cos(pitch)*Math.sin(yaw),.6+radius*Math.sin(pitch),radius*Math.cos(pitch)*Math.cos(yaw));camera.lookAt(0,.5,0)}
    if(time-lastWater>=1/24){lastWater=time;for(const m of waters){const pos=m.geometry.attributes.position;for(let i=0;i<pos.count;i++){pos.setY(i,.014*Math.sin(pos.getX(i)*5+time*2)+.009*Math.cos(pos.getZ(i)*8+time));}pos.needsUpdate=true;m.geometry.computeVertexNormals();}}
    marker.visible=Boolean(targets[stage]);if(marker.visible){marker.position.copy(targets[stage]);marker.position.y+=.53+Math.sin(time*2)*.045;}
    renderer.render(scene,camera);
  }
  host.replaceWith(wrapper);frame=requestAnimationFrame(draw);
  return {update(s){if('stage'in s)stage=s.stage;if('paused'in s)paused=s.paused;if(s.pathway!==undefined){renderer.shadowMap.needsUpdate=true;const open=['pond','ponds','conventional','0'].includes(String(s.pathway));digester.visible=!open;pond.visible=open;fan.visible=!open;}if('success'in s)waters.at(-1).material.color.set(s.success===false?0x756c42:0x436e64);},reset,zoom,spin(s){spin=s;},rotate(delta,tilt=0){yaw+=delta;pitch=Math.max(0.2,Math.min(1.33,pitch+tilt));},destroy(){visitor.stop();observer.disconnect();cancelAnimationFrame(frame);renderer.dispose();}};
}