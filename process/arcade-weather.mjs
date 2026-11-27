import * as T from './three.module.min.js';

/*
 Ties the Mill Arcade games to the 3D world, so what happens in a game shows on the plant:
  - storm (POME Rescue): rain sheets, a darker sky and fog, lightning flashes, ripples
  - alarm (Biogas Mission): rotating amber beacons and a red glow by the gas engine
  - celebrate (any win): fireworks bursting over the mill
 Everything is pooled and created once (no shader compiles mid-game) and costs nothing
 when idle.
*/
export function arcadeWeather(scene,{sun,hemi,fogColor=0x44574a,center=new T.Vector3(0,0,0),engine=new T.Vector3(1.6,0,-3.2)}){
 const fog=scene.fog,baseFog=new T.Color(fogColor),stormFog=new T.Color(0x2b3533),baseSun=sun.intensity,baseHemi=hemi?.intensity??1,baseDensity=fog?.density??.02;
 let seed=77;const rnd=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
 // Rain: line segments that fall and wrap, drawn only while it rains.
 const N=1400,pos=new Float32Array(N*6);
 for(let i=0;i<N;i++){const x=center.x+(rnd()-.5)*36,y=rnd()*14,z=center.z+(rnd()-.5)*28;pos.set([x,y,z,x+.06,y-.5,z+.03],i*6)}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));
 const rain=new T.LineSegments(geo,new T.LineBasicMaterial({color:0xcfe3ea,transparent:true,opacity:0,depthWrite:false}));rain.frustumCulled=false;rain.visible=false;scene.add(rain);
 // Ground splashes: small rings that pop where drops land.
 const ringGeo=new T.RingGeometry(.03,.06,12);ringGeo.rotateX(-Math.PI/2);
 const rings=new T.InstancedMesh(ringGeo,new T.MeshBasicMaterial({color:0xdfeff3,transparent:true,opacity:.5,depthWrite:false}),120);rings.visible=false;rings.frustumCulled=false;scene.add(rings);
 const ringData=Array.from({length:120},()=>({x:center.x+(rnd()-.5)*24,z:center.z+(rnd()-.5)*16,p:rnd()}));const o=new T.Object3D();
 // Lightning: a brief cold light that also brightens the sky.
 const flash=new T.DirectionalLight(0xdfe8ff,0);flash.position.set(6,20,-8);scene.add(flash);
 // Alarm beacons near the gas engine.
 const beaconMat=new T.MeshStandardMaterial({color:0xffb020,emissive:0xff8a00,emissiveIntensity:0,roughness:.3});
 const beacons=[[-.6,0],[.6,0]].map(([dx,dz])=>{const g=new T.Group();g.position.set(engine.x+dx,1.25,engine.z+dz);g.visible=false;scene.add(g);
  const dome=new T.Mesh(new T.SphereGeometry(.09,16,10,0,Math.PI*2,0,Math.PI/2),beaconMat);g.add(dome);
  const base=new T.Mesh(new T.CylinderGeometry(.1,.11,.06,16),new T.MeshStandardMaterial({color:0x2b2f2e,roughness:.6}));base.position.y=-.03;g.add(base);
  const beam=new T.Mesh(new T.ConeGeometry(.35,1.6,16,1,true),new T.MeshBasicMaterial({color:0xffb020,transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide}));beam.rotation.z=Math.PI/2;beam.position.x=.8;const spin=new T.Group();spin.add(beam);g.add(spin);g.userData.spin=spin;return g});
 const glow=new T.PointLight(0xff3b1f,0,6,1.6);glow.position.set(engine.x,1.4,engine.z);scene.add(glow);
 // Fireworks: pooled sparks with gravity.
 const SP=360,sparkPos=new Float32Array(SP*3),sparkCol=new Float32Array(SP*3),vel=new Float32Array(SP*3),life=new Float32Array(SP);
 const sgeo=new T.BufferGeometry();sgeo.setAttribute('position',new T.BufferAttribute(sparkPos,3));sgeo.setAttribute('color',new T.BufferAttribute(sparkCol,3));
 const sparks=new T.Points(sgeo,new T.PointsMaterial({size:.12,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));sparks.frustumCulled=false;sparks.visible=false;scene.add(sparks);
 const palette=[[1,.84,.3],[.62,1,.55],[.5,.85,1],[1,.5,.6]];
 let storm=0,stormTarget=0,alarm=false,nextBolt=3,bolt=0,bursts=[],fireUntil=0;
 function burst(t){const c=palette[Math.floor(rnd()*palette.length)],cx=center.x+(rnd()-.5)*8,cy=3.6+rnd()*1.8,cz=center.z-2+(rnd()-.5)*4;
  for(let k=0;k<60;k++){const i=(bursts.length*60+k)%SP;const a=rnd()*6.283,b=Math.acos(2*rnd()-1),s=2+rnd()*2.2;sparkPos.set([cx,cy,cz],i*3);vel.set([Math.sin(b)*Math.cos(a)*s,Math.cos(b)*s,Math.sin(b)*Math.sin(a)*s],i*3);sparkCol.set(c,i*3);life[i]=1}
  bursts.push(t)}
 return {
  set(s){
   if('storm'in s)stormTarget=Math.max(0,Math.min(1,+s.storm||0));
   if('alarm'in s){alarm=!!s.alarm;beacons.forEach(b=>b.visible=alarm);if(!alarm){glow.intensity=0;beaconMat.emissiveIntensity=0}}
   if(s.celebrate){fireUntil=performance.now()/1000+4.5;bursts=[];sparks.visible=true}
  },
  update(dt,t){
   storm+=(stormTarget-storm)*Math.min(1,dt*1.5);
   const raining=storm>.02;rain.visible=rings.visible=raining;
   if(raining){
    rain.material.opacity=.15+.45*storm;const p=geo.attributes.position,fall=dt*(10+8*storm);
    for(let i=0;i<N;i++){let y=p.array[i*6+1]-fall;if(y<0)y+=14;p.array[i*6+1]=y;p.array[i*6+4]=y-.5}p.needsUpdate=true;
    for(let i=0;i<ringData.length;i++){const r=ringData[i],f=(r.p+t*1.6)%1;o.position.set(r.x,.02,r.z);o.scale.setScalar(f<.6?.4+f*3:0.0001);o.updateMatrix();rings.setMatrixAt(i,o.matrix)}rings.instanceMatrix.needsUpdate=true;rings.material.opacity=.45*storm;
    nextBolt-=dt;if(storm>.5&&nextBolt<=0){bolt=1;nextBolt=4+rnd()*6}
   }
   bolt=Math.max(0,bolt-dt*4);const strike=bolt>0?(Math.sin(bolt*40)>0?bolt:bolt*.3):0;
   flash.intensity=strike*4;sun.intensity=baseSun*(1-.65*storm)+strike;if(hemi)hemi.intensity=baseHemi*(1-.35*storm)+strike*.8;
   if(fog){fog.color.copy(baseFog).lerp(stormFog,storm);fog.density=baseDensity*(1+.8*storm)}
   if(scene.background?.isColor)scene.background.copy(fog?fog.color:baseFog);
   if(alarm){const pulse=.5+.5*Math.sin(t*8);beaconMat.emissiveIntensity=1.5+2*pulse;glow.intensity=1.2+1.6*pulse;beacons.forEach(b=>b.userData.spin.rotation.y=t*5)}
   const now=performance.now()/1000;
   if(sparks.visible){
    if(now<fireUntil&&(bursts.length===0||t-bursts.at(-1)>.55))burst(t);
    let alive=false;for(let i=0;i<SP;i++){if(life[i]<=0)continue;alive=true;life[i]-=dt*.55;vel[i*3+1]-=dt*3.2;for(let k=0;k<3;k++){sparkPos[i*3+k]+=vel[i*3+k]*dt;vel[i*3+k]*=.985}if(life[i]<=0)sparkPos[i*3+1]=-50}
    sgeo.attributes.position.needsUpdate=true;sparks.material.opacity=1;if(!alive&&now>fireUntil)sparks.visible=false;
   }
  }
 };
}
