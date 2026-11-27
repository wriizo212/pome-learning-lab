import * as T from './three.module.min.js';

/*
 Zoom-dependent detail ("HD when you zoom in"). Far away the scene stays light; once the
 camera comes close it switches to high-resolution molecules at full density, renders at
 the device's full pixel ratio, fits the sun's shadow map tightly around what you are
 looking at (much sharper shadows), and reveals fine hardware (bolts, flanges, name
 plates) plus micro-bubbles. Hysteresis stops it flickering at the threshold.
*/
export function hdZoom({renderer,budget,chem,sun,flows,details,getTier,near=8,far=10.5,onChange}){
 let hd=false,lastFocus=new T.Vector3(1e9,0,0),shadowDir=sun.position.clone().normalize();
 const wide={left:sun.shadow.camera.left,right:sun.shadow.camera.right,top:sun.shadow.camera.top,bottom:sun.shadow.camera.bottom};
 if(!sun.target.parent)sun.parent?.add(sun.target);
 function fit(focus,radius){
  const cam=sun.shadow.camera;sun.target.position.copy(focus);sun.position.copy(focus).addScaledVector(shadowDir,18);
  Object.assign(cam,radius?{left:-radius,right:radius,top:radius,bottom:-radius}:wide);cam.near=.5;cam.far=45;cam.updateProjectionMatrix();sun.target.updateMatrixWorld();budget.refreshShadows();
 }
 function set(on,focus){
  hd=on;const tier=getTier();
  chem?.setDetail(on?2:tier.detail);chem?.setDensity(on?1:tier.molecules);
  if(on)budget.boost(1.6);else budget.unboost?.();
  if(details)details.visible=on;flows?.setHD?.(on);
  if(on){fit(focus,4.2);lastFocus.copy(focus)}else fit(new T.Vector3(),0);
  onChange?.(on);
 }
 return {
  get on(){return hd},
  update(distance,focus){
   if(!hd&&distance<near)set(true,focus);
   else if(hd&&distance>far)set(false,focus);
   else if(hd&&focus.distanceTo(lastFocus)>1.2){fit(focus,4.2)}
   if(hd&&focus.distanceTo(lastFocus)>1.2)lastFocus.copy(focus);
  },
  refresh(){set(hd,lastFocus)}
 };
}

// Fine hardware shown only up close: bolt rings, pipe flanges and name plates (instanced).
export function hardware(scene,{rings=[],flanges=[],plates=[]}){
 const group=new T.Group();group.visible=false;scene.add(group);
 const steel=new T.MeshStandardMaterial({color:0x9aa6a4,metalness:.7,roughness:.35});
 const boltGeo=new T.CylinderGeometry(1,1,.6,6);const total=rings.reduce((n,r)=>n+r.n,0);
 const bolts=new T.InstancedMesh(boltGeo,steel,Math.max(1,total)),o=new T.Object3D();let i=0;
 for(const r of rings)for(let k=0;k<r.n;k++){const a=(r.a0??0)+k/r.n*(r.sweep??Math.PI*2);o.position.set(r.x+Math.sin(a)*r.r,r.y,r.z+Math.cos(a)*r.r);o.rotation.set(Math.PI/2,a,0);o.scale.setScalar(r.s??.016);if(r.vertical){o.rotation.set(0,0,0)}o.updateMatrix();bolts.setMatrixAt(i++,o.matrix)}
 bolts.count=i;group.add(bolts);
 const flangeGeo=new T.TorusGeometry(1,.28,6,18);const fl=new T.InstancedMesh(flangeGeo,steel,Math.max(1,flanges.length));
 flanges.forEach(([x,y,z,r,axis],k)=>{o.position.set(x,y,z);o.rotation.set(axis==='y'?Math.PI/2:0,axis==='x'?Math.PI/2:0,0);o.scale.setScalar(r);o.updateMatrix();fl.setMatrixAt(k,o.matrix)});group.add(fl);
 for(const p of plates){const c=document.createElement('canvas');c.width=256;c.height=96;const g=c.getContext('2d');g.fillStyle='#c9cfc9';g.fillRect(0,0,256,96);g.strokeStyle='#4a524f';g.lineWidth=5;g.strokeRect(4,4,248,88);g.fillStyle='#1d2422';g.font='bold 30px monospace';g.textAlign='center';g.fillText(p.title,128,42);g.font='20px monospace';g.fillText(p.sub||'',128,74);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;const m=new T.Mesh(new T.PlaneGeometry(p.w||.3,(p.w||.3)*96/256),new T.MeshStandardMaterial({map:t,metalness:.4,roughness:.4}));m.position.set(...p.at);m.rotation.y=p.ry||0;group.add(m)}
 return group;
}
