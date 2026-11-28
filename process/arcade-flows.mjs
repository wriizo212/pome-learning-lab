import * as T from './three.module.min.js';
import {chemistry,seeds,smooth,band,lerpPath,liquidVolume,liquidClock} from './molecules.mjs?v=shift23';

/*
 Molecular process layer for the Mill Arcade diorama (mill-gpu.mjs).
 The digester story switches with the pathway: covered digesters capture CH4 for the
 engine, open ponds let it escape to the air. The river shows dissolved O2 falling and
 organics appearing when a mission decision lets poorly treated water through.
*/
export function arcadeProcess(scene,{world,isCut,isPond,isPolluted,tier={molecules:1,detail:1}}){
 const C=chemistry(scene,{h2o:340,o2:220,bubble:260,steam:110},1.3,{density:tier.molecules,detail:tier.detail});
 const volumes=[
  liquidVolume(scene,{x:-4,y:.24,z:-.7,w:1.84,h:.28,d:1.84,color:0x6d4b28,opacity:.3}),
  liquidVolume(scene,{x:-.9,y:1.1,z:-1.65,r:1.3,h:.96,color:0x4a4a2e,opacity:.2}),
  liquidVolume(scene,{x:3,y:.24,z:-.35,w:2.84,h:.28,d:1.94,color:0x5f8a70,opacity:.22}),
  liquidVolume(scene,{x:0,y:.05,z:4.75,w:15.8,h:.09,d:1.86,color:0x3f6e62,opacity:.3})
 ];
 const S={inW:seeds(30,5,3),inF:seeds(14,4,5),oil:seeds(8,3,7),
  dOrg:seeds(36,7,11),dW:seeds(26,4,13),dHead:seeds(14,3,17),pond:seeds(26,4,19),
  bub:seeds(54,3,23),floc:seeds(12,4,29),pOrg:seeds(20,3,31),pN:seeds(8,3,37),
  exh:seeds(14,3,41),bed:seeds(18,3,43),evap:seeds(10,3,47),river:seeds(46,4,53),rCod:seeds(14,3,59)};
 const v=[0,0,0];
 const fibres=S.inF.map(([a,b,c,d])=>({mode:0,k:-d*6,sx:-4.8+a*1.6,spin:c*6}));
 const hoods=[-.58,0,.58],rows=[-.91,-.35,.19],flocPos=Array.from({length:12},()=>[0,0,0]);
 let last=0,hd=false;const hooks=[],micro=seeds(110,3,97);
 function update(t){
  const dt=Math.max(0,Math.min(.1,t-last));last=t;liquidClock.value=t;const cut=isCut(),pond=isPond(),dirty=isPolluted();
  volumes.forEach((m,i)=>m.visible=cut&&!(i===1&&pond));
  C.begin();
  // Intake: raw POME flows to the digester feed; floating fibre gathers at the front wall.
  for(const [a,b,c,d,e] of S.inW){const f=(d+t*.08)%1;lerpPath([[-4.85,.34,-.1],[-4.6+a*1.2,.18+b*.16,-.4-c*.9],[-3.1,.3,-.8]],f,v);const k=e<.6?'h2o':e<.88?'cod':'nh4';C.put(k,v[0],v[1]+.01*Math.sin(t*3+e*9),v[2],k==='cod'?.032:.038,t+e*9)}
  for(const [a,b,c] of S.oil){const f=(a+t*.03)%1;C.put('oil',-4.85+f*1.7,.375,-1.5+b*1.5,.025+.02*c)}
  const op=world.activity(0),raking=op&&op.job==='rake'&&((op.τ%2.6)/2.6)>.45;
  for(const fb of fibres){
   if(fb.mode===0){fb.k+=dt/7;if(fb.k>=1){fb.mode=1;fb.k=0}}else if(fb.mode===1){if(raking){fb.mode=2;fb.k=0}}else{fb.k+=dt/1.3;if(fb.k>=1){fb.mode=0;fb.k=-Math.random()*5}}
   if(fb.mode===0&&fb.k<0)continue;
   const f=smooth(fb.k);let px=fb.sx,py=.38,pz=.18;
   if(fb.mode===0){px=-4.85+(fb.sx+4.85)*f;pz=-.4+.58*f}else if(fb.mode===2){px=fb.sx+(-4-fb.sx)*f*.6;py=.38+.5*f;pz=.18+.45*f}
   C.put('fibre',px,py,pz,.03,fb.spin+(fb.mode===0?t*.5:0));
  }
  if(!pond){
   // Covered digester: organics → acetate → CH4 + CO2 bubbles under the gas hoods.
   for(let i=0;i<S.dOrg.length;i++){
    const [s0,s1,s2,s3,s4,s5,s6]=S.dOrg[i],f=(s0+t/9)%1,a=s1*6.283,r=Math.sqrt(s2)*1.15,bx=-.9+r*Math.cos(a),bz=-1.65+r*Math.sin(a),by=.32+.26*s3;
    if(f<.22)C.put('cod',bx,.22+(by-.22)*smooth(f/.22),bz,.032,t*1.2+s4*9);
    else if(f<.46){const k=band(f,.22,.32);if(k<1)C.put('cod',bx,by,bz,.032*(1-k),t*4);C.put('acetate',bx+.02*Math.sin(t*5+s5*9),by,bz,.034*smooth(k)*(1-smooth(band(f,.46,.52))),t*2+s5*9)}
    else{const birth=band(f,.46,.52);if(birth<1)C.put('acetate',bx,by,bz,.034*(1-birth),t*3);
     const h=-.9+hoods[Math.floor(s6*3)];let px,py,pz,sb=0;
     if(f<.9){const k=smooth(band(f,.52,.9));px=bx+(h-bx)*k;py=by+(1.14-by)*k;pz=bz+(-1.65-bz)*k;sb=(.05+.02*k)*smooth(birth*3)}else{const k=band(f,.9,1);px=h;py=1.14+.6*k;pz=-1.65}
     const fade=f>.9?1-band(f,.94,1):1;if(sb)C.put('bubble',px,py,pz,sb);
     C.put('ch4',px-.018,py,pz,.03*smooth(birth*2)*fade,t*2+s4*7);C.put(i%7===0?'h2s':'co2',px+.022,py+.01,pz,.028*smooth(birth*2)*fade,t*1.7+s5*7)}
   }
   for(const [s0,s1,s2,s3] of S.dW){const f=(s0+t/12)%1;lerpPath([[-2.25,.36,-1.65+(s1-.5)*.6],[-1.6+s2*.6,.8+s3*.5,-1.65+(s1-.5)*1.6],[-.4+s2*.5,1.0+s3*.4,-1.65+(s3-.5)*1.4],[.38,.38,-1.65]],f,v);C.put(s3<.15?'nh4':'h2o',...v,.036,t+s2*9)}
   for(const [s0,s1,s2] of S.dHead){const f=(s0+t/5)%1,a=s1*6.283+t*.3,r=.95*(1-f*.6);C.put(s2<.62?'ch4':'co2',-.9+r*Math.cos(a),1.82+.22*f,-1.65+r*Math.sin(a),.03,t*2)}
  }else{
   // Open anaerobic pond: the same biogas escapes straight to the atmosphere.
   for(const [s0,s1,s2,s3] of S.pond){const f=(s0+t/5)%1,px=-.9+(s1-.5)*2.6,pz=-1.65+(s2-.5)*2.3,py=.12+f*1.4;const pop=f<.2?smooth(f/.2):1;
    if(f<.2)C.put('bubble',px,py,pz,.045*pop);C.put(s3<.62?'ch4':'co2',px+.05*Math.sin(t+s1*9)*f,py,pz,.032*(1-smooth(band(f,.8,1))),t*2+s3*9)}
  }
  // Polishing basin: diffused O2, floc respiration, nitrification.
  for(let i=0;i<S.bub.length;i++){const [s0,s1,s2]=S.bub[i],row=rows[Math.floor(i/18)],col=Math.floor((i%18)/3),px=1.92+col*.43+(s1-.5)*.06,pz=row+(s2-.5)*.06,f=(s0+t/1.3)%1;const pop=1-smooth(band(f,.88,1));C.put('bubble',px,.22+f*.15,pz,(.022+.014*f)*pop);C.put('o2',px,.22+f*.15,pz,.02*pop,t*3+s1*9)}
  for(let j=0;j<12;j++){const [s0,s1,s2,s3]=S.floc[j],th=t*.4*(s0>.5?1:-1)+s1*6.283;flocPos[j][0]=1.75+s2*2.5;flocPos[j][1]=.27+.06*Math.sin(th);flocPos[j][2]=-.35+.75*Math.cos(th);C.put('floc',...flocPos[j],.045+.02*s3,t*.4+s2*9)}
  for(let i=0;i<S.pOrg.length;i++){const [s0,s1,s2]=S.pOrg[i],f=(s0+t/8)%1,fl=flocPos[i%12];
   if(f<.4){const k=smooth(f/.4);C.put('cod',1.6+(fl[0]-1.6)*k,.36+(fl[1]-.36)*k,-.35+(fl[2]+.35)*k,.03,t*1.5+s1*9)}
   else if(f<.5){const k=band(f,.4,.5);C.put('cod',...fl,.03*(1-k),t*4);C.put('o2',fl[0]+.1*(1-k),fl[1]+.04,fl[2],.02*(1-k),t*3);C.put('co2',fl[0],fl[1]+.02,fl[2],.028*k);C.put('h2o',fl[0]-.03,fl[1],fl[2],.032*k)}
   else{const k=smooth(band(f,.5,1));C.put('co2',fl[0]+.05*k,fl[1]+.9*k,fl[2],.028*(1-band(f,.85,1)),t*2);C.put('h2o',fl[0]+(4.45-fl[0])*k,fl[1]+(.33-fl[1])*k,fl[2]+(-.35-fl[2])*k,.032*(1-band(f,.93,1)),t+s2*9)}}
  for(let i=0;i<S.pN.length;i++){const [s0,s1]=S.pN[i],f=(s0+t/10)%1,fl=flocPos[(i*5+3)%12];
   if(f<.45){const k=smooth(f/.45);C.put('nh4',1.6+(fl[0]-1.6)*k,.34,-.35+(fl[2]+.35)*k,.032,t*2)}else if(f<.55){const k=band(f,.45,.55);C.put('nh4',...fl,.032*(1-k));C.put('no3',...fl,.032*k)}else{const k=smooth(band(f,.55,1));C.put('no3',fl[0]+(4.45-fl[0])*k,.33,fl[2]+(-.35-fl[2])*k,.032*(1-band(f,.93,1)),t*1.5+s1*9)}}
  // Gas engine exhaust (only while biogas is captured).
  if(!pond)for(let i=0;i<S.exh.length;i++){const [s0,s1,s2]=S.exh[i],f=(s0+t/3)%1;C.put(i%3===0?'co2':'h2o',3.9+.3*f+(s1-.5)*.08,2.36+.8*f,-3.55+(s2-.5)*.1,.03*(1-smooth(band(f,.7,1))),t*2+s1*9);if(i%2===0)C.put('steam',3.9+.25*f,2.38+.6*f,-3.55,(.03+.08*f)*(1-f))}
  // Sludge bed drainage and evaporation.
  for(const [s0,s1,s2] of S.bed){const f=(s0+t/7)%1,sx=-4.25+s1*3.3,sz=1.95+s2*1.2;let px=sx,py,pz=sz;if(f<.5){py=.32-.12*(f/.5)}else{const k=smooth(band(f,.5,1));py=.2;pz=sz+(3.27-sz)*Math.min(1,k*3);px=sx+(-1.05-sx)*k}C.put('h2o',px,py,pz,.03,t*2+s2*9)}
  for(const [s0,s1,s2] of S.evap){const f=(s0+t/6)%1;C.put('h2o',-4.2+s1*3.2+.2*f,.36+.85*f,1.95+s2*1.2,.03*(1-smooth(band(f,.6,1))),t)}
  // River: dissolved oxygen supports aquatic life; poor effluent adds organics and depletes it.
  const o2Share=dirty?.35:.7;
  for(let i=0;i<S.river.length;i++){const [s0,s1,s2,s3]=S.river[i],f=(s0+t/22)%1,px=-7.8+f*15.6,pz=3.95+s1*1.6,py=.03+.04*s2;
   const isO2=s3<o2Share;C.put(isO2?'o2':'h2o',px,py+.01*Math.sin(t*2+s1*9),pz,isO2?.026:.032,t*(1+s2)+s1*9)}
  if(dirty)for(const [s0,s1,s2] of S.rCod){const f=(s0+t/16)%1,px=5.2+f*2.6,pz=4.05+s1*1.3;C.put(s2<.8?'cod':'nh4',px,.05,pz,.032,t+s1*9)}
  for(const h of hooks)h(C,t,dt);
  if(hd){
   if(!pond)for(let i=0;i<50;i++){const [a,b,c]=micro[i],f=(a+t/4)%1,ang=b*6.283,r=Math.sqrt(c)*1.2;C.put('bubble',-.9+r*Math.cos(ang),.62+1.0*f,-1.65+r*Math.sin(ang),.01+.005*f)}
   for(let i=50;i<110;i++){const [a,b,c]=micro[i],f=(a+t/.9)%1;C.put('bubble',1.8+b*2.4,.21+.16*f,rows[i%3]+(c-.5)*.2,.007+.005*f)}
  }
  C.end();
 }
 // The player can rake the screen: everything stuck on it lifts off.
 function clearScreen(){let n=0;for(const fb of fibres)if(fb.mode===1){fb.mode=2;fb.k=0;n++}return n}
 return {update,chem:C,hook:h=>hooks.push(h),setHD(on){hd=on},clearScreen};
}
