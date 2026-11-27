import * as T from './three.module.min.js';
import {chemistry,seeds,smooth,band,lerpPath,liquidSurface,liquidVolume,liquidClock} from './molecules.mjs?v=shift16';

/*
 Molecular process layer for the UASB + aerobic cutaway (index.html simulator).
 Each unit runs its own story:
  inlet     hot raw POME pours in, fibre is caught on the bar screen and raked off,
            oil floats, water and organics pass through to the reactor feed.
  UASB      organics rise into the granular sludge bed, break into acetate, then
            methanogens release CH4 + CO2 (+ trace H2S) bubbles that the hoods collect.
  aeration  diffusers release O2 bubbles; flocs use dissolved O2 to turn organics into
            CO2 + H2O and ammonium into nitrate.
  engine    biogas burns with air: CH4 + 2O2 -> CO2 + 2H2O, the shaft drives a generator.
  drying    water drains through sand and gravel to the underdrain or evaporates.
  outlet    clear water spirals to the draw-off strainer while the last flocs settle.
*/
export function reactorProcess(scene,{x,steel,brass,dark,teal,cement,world,isCut,tier={molecules:1,detail:1}}){
 const C=chemistry(scene,{},1.3,{density:tier.molecules,detail:tier.detail});
 const mat=(color,r=.6,m=.2)=>new T.MeshStandardMaterial({color,roughness:r,metalness:m});
 function add(geo,m,px,py,pz){const o=new T.Mesh(geo,m);o.position.set(px,py,pz);o.castShadow=o.receiveShadow=true;scene.add(o);return o}
 function pipe(a,b,r,m){const s=new T.Vector3(...a),e=new T.Vector3(...b),d=e.clone().sub(s);const o=add(new T.CylinderGeometry(r,r,d.length(),12),m,...s.clone().lerp(e,.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o}
 const box=(px,py,pz,w,h,d,m)=>{const o=add(new T.BoxGeometry(w,h,d),m,px,py,pz);return o};

 /* ---- extra plant hardware that the processes need ---- */
 // Hot raw POME feed from the mill clarification station.
 pipe([-6.2,1.28,1.45],[-5.45,1.28,1.45],.07,steel);pipe([-5.45,1.28,1.45],[-5.45,1.04,1.45],.07,steel);
 for(const px of [-6.05])pipe([px,.09,1.45],[px,1.24,1.45],.025,dark);
 add(new T.TorusGeometry(.075,.018,6,16),brass,-5.45,1.05,1.45).rotation.x=Math.PI/2;
 // Engine exhaust stack, air filter and pushrod covers.
 pipe([-1.05,1.0,-2.45],[-1.05,1.8,-2.45],.05,dark);add(new T.ConeGeometry(.09,.07,12),dark,-1.05,1.86,-2.45);
 box(-1.47,.72,-1.95,.13,.18,.22,mat(0x3d5552));for(let k=0;k<5;k++)box(-1.54,.65+k*.032,-1.95,.01,.012,.19,steel);
 const rockers=[0,1,2,3].map(j=>box(-1+j*.2,.84,-2.2,.12,.035,.16,steel));
 // Generator cable to the mill grid pole.
 const cable=[[.42,.62,-2.42],[.62,.62,-2.95],[.62,1.42,-2.98],[.62,1.42,-3.4]];
 for(let i=1;i<cable.length;i++)pipe(cable[i-1],cable[i],.014,mat(0x161b1b,.8,0));
 pipe([.62,.09,-3.02],[.62,1.55,-3.02],.035,mat(0x7b6a52,.9,0));box(.62,1.47,-3.02,.06,.04,.42,dark);
 // Treated water discharge pipe to the drain channel.
 pipe([5.38,.34,.7],[6.15,.34,.7],.07,teal);box(6.12,.06,.7,.18,.06,.5,cement);
 // Drying-bed cake surface with shrinkage cracks.
 const cv=document.createElement('canvas');cv.width=cv.height=256;const g=cv.getContext('2d');g.fillStyle='#5b3e2b';g.fillRect(0,0,256,256);
 let rs=91;const rr=()=>((rs=Math.imul(1664525,rs)+1013904223>>>0)/4294967296);
 for(let i=0;i<2600;i++){g.fillStyle=rr()>.5?'rgba(140,104,70,.25)':'rgba(30,20,12,.25)';g.fillRect(rr()*256,rr()*256,2,2)}
 g.strokeStyle='rgba(22,14,9,.85)';g.lineWidth=2.2;for(let i=0;i<34;i++){let px=rr()*256,py=rr()*256;g.beginPath();g.moveTo(px,py);for(let k=0;k<5;k++){px+=(rr()-.5)*60;py+=(rr()-.5)*60;g.lineTo(px,py)}g.stroke()}
 const crackTex=new T.CanvasTexture(cv);crackTex.colorSpace=T.SRGBColorSpace;crackTex.wrapS=crackTex.wrapT=T.RepeatWrapping;crackTex.repeat.set(2,1);
 const cakeTop=add(new T.PlaneGeometry(1.88,.9),new T.MeshStandardMaterial({map:crackTex,bumpMap:crackTex,bumpScale:.03,roughness:.97}),3.2,.458,-1.95);cakeTop.rotation.x=-Math.PI/2;

 /* ---- liquids: wavy surfaces and translucent bodies for the cutaway ---- */
 const diffuserRows=[-.28,.4,1.08];
 const surfaces=[
  liquidSurface(scene,{x:-4.55,y:.915,z:.9,w:2.0,d:1.6,color:0x7b5a33,opacity:.9,spot:[-5.45,1.45,.45,1]}),
  liquidSurface(scene,{x,y:3.38,z:0,r:1.2,color:0x4c4a30,opacity:.78}),
  liquidSurface(scene,{x:1.8,y:.965,z:.5,w:2.55,d:2.2,color:0x7c8c5c,opacity:.85,calm:.6,rows:diffuserRows.map(r=>r)}),
  liquidSurface(scene,{x:4.75,y:1.125,z:.7,r:.68,color:0x6fb6ab,opacity:.62,rough:.08})
 ];
 for(const s of surfaces)s.base=s.mat.opacity;
 const volumes=[
  liquidVolume(scene,{x:-4.55,y:.61,z:.9,w:2.0,h:.58,d:1.6,color:0x6d4b28,opacity:.32}),
  liquidVolume(scene,{x,y:2.14,z:0,r:1.18,h:2.48,color:0x4a4a2e,opacity:.2}),
  liquidVolume(scene,{x:1.8,y:.64,z:.5,w:2.55,h:.64,d:2.2,color:0x6e7f50,opacity:.22}),
  liquidVolume(scene,{x:4.75,y:.65,z:.7,r:.68,h:.94,color:0x78c0b5,opacity:.14})
 ];

 /* ---- slot tables ---- */
 const S={inW:seeds(40,6,3),inF:seeds(18,4,5),inO:seeds(10,4,7),steam:seeds(14,4,9),pour:seeds(10,3,13),
  uOrg:seeds(44,9,17),uW:seeds(44,5,19),uGran:seeds(22,4,23),uHead:seeds(18,4,29),
  bub:seeds(63,4,31),dO2:seeds(30,5,37),floc:seeds(16,4,41),aOrg:seeds(28,4,43),aN:seeds(10,4,47),
  oW:seeds(30,4,53),oF:seeds(8,3,59),dDrain:seeds(28,3,61),dEvap:seeds(12,3,67),dPour:seeds(6,2,71),
  exh:seeds(18,3,73),air:seeds(10,3,79),spark:seeds(10,1,83)};
 const v=[0,0,0],w=[0,0,0];
 // Fibre pieces keep state so they can pile up on the screen until the operator rakes them off.
 const fibres=S.inF.map(([a,b,c,d])=>({mode:0,k:-d*6,sx:-5.3+a*1.45,sy:.45+b*.38,spin:c*6}));
 const hoods=[-.55,0,.55];
 const flocPos=Array.from({length:16},()=>[0,0,0]);
 let last=0,hd=false;const micro=seeds(150,4,97);

 function update(t){
  const dt=Math.max(0,Math.min(.1,t-last));last=t;const cut=isCut();liquidClock.value=t;
  for(const s of surfaces){s.update(t);s.mat.opacity=cut?s.base*.55:s.base}for(const m of volumes)m.visible=cut;
  rockers.forEach((r,j)=>{r.position.y=.84+.012*Math.max(0,Math.sin(t*14+j*1.57))});
  C.begin();

  /* INLET: raw POME (~80 °C) from the mill */
  for(const [a,b,c,d,e,k] of S.inW){
   const f=(d+t*.07)%1;
   lerpPath([[-5.45,.9,1.45],[-5.4+a*1.5,.5+b*.33,1.2+.42*c],[-5.35+a*1.6,.45+b*.36,.22+.62*c],[-3.6,.57,.91]],f,v);
   const kind=k<.62?'h2o':k<.9?'cod':'nh4';
   C.put(kind,v[0]+.03*Math.sin(t*2+e*6),v[1]+.02*Math.sin(t*3+e*9),v[2],kind==='cod'?.034:.04,t*(.6+e)+e*9);
  }
  for(const [a,b,c] of S.pour){const f=(a+t*.9)%1;C.put(b<.7?'h2o':'cod',-5.45+(c-.5)*.05,1.03-f*.14,1.45+(b-.5)*.05,.036*(1-f*.4),t*3+c*5)}
  for(const [a,b,c,d] of S.inO){const f=(d+t*.025)%1;C.put('oil',-5.4+f*1.75,.9+.008*Math.sin(t*2+a*9),1.15+.5*b,.028+.022*c)}
  for(const [a,b,c,d] of S.steam){const f=(d+t*.12)%1,s=(.05+.15*f)*(1-smooth(band(f,.72,1)));C.put('steam',-5.5+a*2+.15*f,.95+f*.95,.2+b*1.5,s,c*3)}
  const op=world.activity(0),raking=op&&op.job==='rake'&&((op.τ%2.6)/2.6)>.45;
  for(const fb of fibres){
   if(fb.mode===0){fb.k+=dt/6;if(fb.k>=1){fb.mode=1;fb.k=0}}
   else if(fb.mode===1){if(raking&&Math.abs(fb.sx+4.6)<.75){fb.mode=2;fb.k=0}}
   else{fb.k+=dt/1.3;if(fb.k>=1){fb.mode=0;fb.k=-Math.random()*5}}
   if(fb.k<0&&fb.mode===0)continue;
   let px,py,pz;
   if(fb.mode===0){const f=smooth(fb.k);px=-5.45+(fb.sx+5.45)*f;py=.86+(fb.sy-.86)*f;pz=1.45+(1.14-1.45)*f}
   else if(fb.mode===1){px=fb.sx;py=fb.sy;pz=1.14}
   else{const f=smooth(fb.k);px=fb.sx+(-4.6-fb.sx)*f*.6;py=fb.sy+(1.2-fb.sy)*f;pz=1.14+.5*f}
   C.put('fibre',px,py,pz,.032,fb.spin+(fb.mode===0?t:0),fb.mode===1?.2:0);
  }

  /* UASB: hydrolysis → acidogenesis → methanogenesis */
  for(let i=0;i<S.uOrg.length;i++){
   const [s0,s1,s2,s3,s4,s5,s6,s7,s8]=S.uOrg[i],f=(s0+t/10)%1;
   const a=s1*6.283,r=Math.sqrt(s2)*1.0,bx=x+r*Math.cos(a),bz=r*Math.sin(a),by=.62+.32*s3;
   const jig=.025*Math.sin(t*5+s4*20);
   if(f<.22){const k=smooth(f/.22);C.put('cod',bx+jig,.45+(by-.45)*k,bz,.034,t*1.2+s5*9)}
   else if(f<.46){
    const k=band(f,.22,.32);if(k<1)C.put('cod',bx,by,bz,.034*(1-k),t*4+s5*9);
    const ag=smooth(k)*(1-smooth(band(f,.46,.52)));
    C.put('acetate',bx-.04+jig,by+.02,bz+jig,.036*ag,t*2+s6*9);if(s8>.4)C.put('acetate',bx+.05,by-.02+jig,bz-.03,.036*ag,t*2.4+s7*9);
   }else{
    const birth=band(f,.46,.52),acet=1-birth;if(acet>0){C.put('acetate',bx,by,bz,.036*acet,t*3)}
    const h=hoods[Math.floor(s6*3)],hz=.05+(s7-.5)*.8;
    let px,py,pz,sb;
    if(f<.92){const k=smooth(band(f,.52,.92));px=bx+(x+h-bx)*k+.04*Math.sin(t*3+s4*7)*(1-k);py=by+(2.6-by)*k;pz=bz+(hz-bz)*k;sb=(.055+.025*k)*smooth(birth*3)}
    else{const k=band(f,.92,1);px=x+h;py=2.6+.7*k;pz=hz+(.05-hz)*k;sb=0}
    const fade=f>.92?1-band(f,.95,1):1;
    if(sb>0)C.put('bubble',px,py,pz,sb);
    C.put('ch4',px-.018,py,pz,.032*smooth(birth*2)*fade,t*2+s5*7);
    C.put(i%6===0?'h2s':'co2',px+.025,py+.012,pz-.01,.03*smooth(birth*2)*fade,t*1.7+s4*7);
   }
  }
  for(let i=0;i<S.uW.length;i++){
   const [s0,s1,s2,s3,s4]=S.uW[i],f=(s0+t/16)%1,a=s1*6.283+f*1.5,r=Math.sqrt(s2)*1.05;
   let px,py,pz;
   if(f<.85){px=x+r*Math.cos(a);pz=r*Math.sin(a);py=.45+2.85*(f/.85)}
   else{const k=smooth(band(f,.85,1));px=x+r*Math.cos(a)+(x+1.17-(x+r*Math.cos(a)))*k;pz=r*Math.sin(a)*(1-k);py=3.3+.05*k}
   const kind=i%5===0?'nh4':i%9===0?'cod':'h2o';
   C.put(kind,px,py,pz,kind==='cod'?.03:.036,t*(1+s3)+s4*9);
  }
  for(const [s0,s1,s2,s3] of S.uGran){
   const f=(s0+t/7)%1,a=s1*6.283,r=Math.sqrt(s2)*1.0,lift=f<.5?smooth(f/.5):1-smooth((f-.5)/.5);
   C.put('granule',x+r*Math.cos(a),1.0+1.45*lift*s3,r*Math.sin(a),.04+.02*s3,t*.8+s1*9);
  }
  for(const [s0,s1,s2,s3] of S.uHead){
   const f=(s0+t/5)%1,a=s1*6.283+t*.3,r=.7*s2*(1-f);
   C.put(s3<.62?'ch4':'co2',x+r*Math.cos(a),3.5+.45*f,r*Math.sin(a),.032,t*2+s3*9);
  }

  /* AERATION: diffused air, floc respiration and nitrification */
  for(let i=0;i<S.bub.length;i++){
   const [s0,s1,s2]=S.bub[i],row=Math.floor(i/21),col=Math.floor((i%21)/3),dx=.85+col*.31,dz=diffuserRows[row];
   const f=(s0+t/1.8)%1,px=dx+(s1-.5)*.07+.025*Math.sin(t*6+s2*9),pz=dz+(s2-.5)*.07+.02*Math.cos(t*5+s1*9),py=.56+f*.38;
   const pop=1-smooth(band(f,.9,1));
   C.put('bubble',px,py,pz,(.026+.02*f)*pop);C.put('o2',px,py,pz,.024*pop*(1-.5*f),t*3+s1*9);
  }
  for(let j=0;j<16;j++){
   const [s0,s1,s2,s3]=S.floc[j],th=t*.32*(s0>.5?1:-1)+s1*6.283;
   flocPos[j][0]=.75+s2*2.15+.05*Math.sin(t*.7+s3*9);flocPos[j][1]=.63+.24*Math.sin(th);flocPos[j][2]=.5+.88*Math.cos(th);
   C.put('floc',...flocPos[j],.05+.025*s3,t*.4+s2*9);
  }
  for(const [s0,s1,s2,s3,s4] of S.dO2){
   const f=(s0+t/6)%1,row=diffuserRows[Math.floor(s1*3)],sx=.85+Math.floor(s2*7)*.31;
   const k=smooth(f),tx=.6+s3*2.4,tz=-.5+s4*2;
   C.put('o2',sx+(tx-sx)*k,.66+.18*Math.sin(f*3.14)+.05*s3,row+(tz-row)*k,.024*(1-smooth(band(f,.8,1))),t*2+s3*9);
  }
  for(let i=0;i<S.aOrg.length;i++){
   const [s0,s1,s2,s3]=S.aOrg[i],f=(s0+t/9)%1,fl=flocPos[i%16];
   const entry=[.8+(s1-.5)*.08,1.12,(s2-.5)*.08];
   if(f<.4){let px,py,pz;if(f<.08){const k=f/.08;px=entry[0];py=1.12-.25*k;pz=entry[2]}else{const k=smooth(band(f,.08,.4));px=entry[0]+(fl[0]-entry[0])*k;py=.87+(fl[1]-.87)*k;pz=entry[2]+(fl[2]-entry[2])*k}
    C.put('cod',px,py,pz,.032,t*1.5+s3*9)}
   else if(f<.5){const k=band(f,.4,.5);C.put('cod',fl[0],fl[1],fl[2],.032*(1-k),t*5);
    for(const s of [-1,1])C.put('o2',fl[0]+s*.12*(1-k),fl[1]+.06*(1-k),fl[2]+s*.05,.024*(1-k*.8),t*4+s);
    C.put('co2',fl[0]+.03,fl[1]+.02,fl[2],.03*k,t*2);C.put('h2o',fl[0]-.03,fl[1],fl[2]+.02,.034*k,t*2)}
   else{const k=smooth(band(f,.5,1));
    const cy=fl[1]+(1.55-fl[1])*k;C.put('co2',fl[0]+.03+.1*k,cy,fl[2],.03*(1-smooth(band(f,.85,1))),t*2+s1*9);
    C.put('h2o',fl[0]+(3.0-fl[0])*k,fl[1]+(.74-fl[1])*k,fl[2]+(.5-fl[2])*k,.034*(1-smooth(band(f,.92,1))),t*1.3+s2*9)}
  }
  for(let i=0;i<S.aN.length;i++){
   const [s0,s1,s2]=S.aN[i],f=(s0+t/11)%1,fl=flocPos[(i*3+5)%16];
   if(f<.45){const k=smooth(f/.45);C.put('nh4',.8+(fl[0]-.8)*k,1.0+(fl[1]-1.0)*k,(fl[2])*k,.034,t*2+s1*9)}
   else if(f<.55){const k=band(f,.45,.55);C.put('nh4',...fl,.034*(1-k),t*4);C.put('no3',...fl,.034*k,t*2);C.put('o2',fl[0]+.1*(1-k),fl[1]+.05,fl[2],.024*(1-k),t*3)}
   else{const k=smooth(band(f,.55,1));C.put('no3',fl[0]+(3.0-fl[0])*k,fl[1]+(.74-fl[1])*k,fl[2]+(.5-fl[2])*k,.034*(1-band(f,.94,1)),t*1.5+s2*9)}
  }

  /* BIOGAS ENGINE: combustion and electricity */
  for(let i=0;i<S.exh.length;i++){const [s0,s1,s2]=S.exh[i],f=(s0+t/3)%1;
   C.put(i%3===0?'co2':'h2o',-1.05+.35*f+(s1-.5)*.08,1.88+.8*f,-2.45+(s2-.5)*.1+.1*f,.032*(1-smooth(band(f,.7,1))),t*2+s1*9);
   if(i%2===0)C.put('steam',-1.05+.3*f,1.9+.7*f,-2.45,(.03+.09*f)*(1-f),s2*9)}
  for(const [s0,s1,s2] of S.air){const f=(s0+t/3)%1,k=smooth(f);C.put('o2',-2.05+.5*k,.72+(s1-.5)*.25*(1-k),-1.95+(s2-.5)*.3*(1-k),.026*(1-band(f,.9,1)),t*2+s1*9)}
  for(const [s0] of S.spark){lerpPath(cable,(s0+t*.55)%1,v);C.put('spark',v[0],v[1]+.02,v[2],.022,t*6+s0*9)}

  /* DRYING BED: drainage through sand and gravel, evaporation */
  for(const [s0,s1,s2] of S.dDrain){
   const f=(s0+t/7)%1,sx=2.32+s1*1.76,sz=-2.38+s2*.86;let px,py,pz;
   if(f<.55){const k=f/.55;px=sx+.01*Math.sin(t*4+s1*9);py=.45-.27*k;pz=sz}else{const k=smooth(band(f,.55,1));px=sx+(2.3-sx)*k;py=.18;pz=sz+(-1.64-sz)*Math.min(1,k*4)}
   C.put('h2o',px,py,pz,.03,t*2+s2*9);
  }
  for(const [s0,s1,s2] of S.dEvap){const f=(s0+t/6)%1;C.put('h2o',2.35+s1*1.7+.2*f,.48+.85*f,-2.35+s2*.8,.03*(1-smooth(band(f,.6,1))),t*1.5+s2*9)}
  for(const [s0,s1] of S.dPour){const f=(s0+t*.8)%1;C.put('floc',3.1+(s1-.5)*.05,.68-.22*f,-1.95,.035,t*2)}

  /* OUTLET: clear water to the strainer, last flocs settle */
  for(let i=0;i<S.oW.length;i++){
   const [s0,s1,s2]=S.oW[i],f=(s0+t/10)%1;let px,py,pz;
   if(f<.15){const k=f/.15;px=4.49+.15*k;py=1.1-.1*k;pz=.5+.05*k}
   else if(f<.8){const k=band(f,.15,.8),th=s1*6.283+k*5,r=.55*(1-k*.75);px=4.74+r*Math.cos(th);pz=.7+r*Math.sin(th);py=1.0-.45*k}
   else{const k=band(f,.8,1);px=4.74;pz=.7;py=.55-.13*k}
   const kind=i%11===0?'no3':i%17===0?'cod':'h2o';
   C.put(kind,px,py,pz,(kind==='cod'?.028:.034)*(f>.8?1-band(f,.9,1):1),t*1.2+s2*9);
  }
  for(const [s0,s1,s2] of S.oF){const f=(s0+t/14)%1,a=s1*6.283,r=.25+.35*s2;C.put('floc',4.74+r*Math.cos(a),1.0-.72*smooth(f),.7+r*Math.sin(a),.035,t*.3+s1*9)}

  /* Zoomed-in HD extras: micro-bubbles and fine suspended solids. */
  if(hd){
   for(let i=0;i<50;i++){const [a,b,c,d]=micro[i],f=(a+t/(3+2*d))%1,ang=b*6.283,r=Math.sqrt(c)*1.1;C.put('bubble',x+r*Math.cos(ang)+.02*Math.sin(t*4+i),.95+2.35*f,r*Math.sin(ang),.011+.006*f)}
   for(let i=50;i<110;i++){const [a,b,c]=micro[i],row=diffuserRows[i%3],f=(a+t/1.1)%1;C.put('bubble',.75+b*2.2+.015*Math.sin(t*7+i),.56+.39*f,row+(c-.5)*.25,.008+.006*f)}
   for(let i=110;i<150;i++){const [a,b,c]=micro[i],f=(a+t*.05)%1;C.put('floc',-5.45+b*1.9+.8*f,.4+c*.45+.02*Math.sin(t+i),.15+((a*7)%1)*1.5,.012)}
  }
  C.end();
 }
 // The player can rake the screen: everything stuck on it lifts off.
 function clearScreen(){let n=0;for(const fb of fibres)if(fb.mode===1){fb.mode=2;fb.k=0;n++}return n}
 return {update,chem:C,setHD(on){hd=on},clearScreen};
}
