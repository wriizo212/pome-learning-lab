/* Geometry and time gates are independent of camera/browser APIs for repeatable tests. */
export const HAND_EDGES=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
export const FINGER_NAMES=['Ibu Jari','Telunjuk','Tengah','Manis','Kelingking'];
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z===undefined||b.z===undefined?0:(a.z-b.z)*.35);
export const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export function angle(a,b,c){const u={x:a.x-b.x,y:a.y-b.y},v={x:c.x-b.x,y:c.y-b.y};return Math.acos(clamp((u.x*v.x+u.y*v.y)/(Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y)||1),-1,1))*180/Math.PI}
export function classifyHand(p){
 if(!p||p.length!==21||p.some(v=>!Number.isFinite(v.x)||!Number.isFinite(v.y)))return null;
 const scale=Math.max(.025,distance(p[0],p[9]));
 const extended=[false,...[[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]].map(([m,b,d,t])=>angle(p[m],p[b],p[t])>145&&distance(p[t],p[0])>distance(p[b],p[0])*1.06&&distance(p[t],p[m])>distance(p[b],p[m])*1.25)];
 // Thumb uses its own IP/MCP geometry; no screen-up test, so thumb-up and mirrored hands work.
 const thumbStraight=angle(p[2],p[3],p[4])>145;
 const thumbAway=distance(p[4],p[5])>distance(p[3],p[5])*1.16||distance(p[4],p[17])>distance(p[3],p[17])*1.13;
 const palmAxis={x:p[5].x-p[17].x,y:p[5].y-p[17].y};
 const thumbSide=((p[4].x-p[5].x)*palmAxis.x+(p[4].y-p[5].y)*palmAxis.y)/(palmAxis.x**2+palmAxis.y**2||1);
 // A straight thumb laid across the palm (a natural V sign) is still folded.
 extended[0]=thumbStraight&&thumbAway&&thumbSide>-.15&&distance(p[4],p[0])>distance(p[2],p[0])*1.12;
 // A mildly bent ring finger in the index+middle+ring sign is common; a folded PIP is still rejected.
 if(extended[1]&&extended[2]&&!extended[4]&&!extended[3])extended[3]=angle(p[13],p[14],p[16])>120&&distance(p[16],p[0])>distance(p[14],p[0])*1.015&&distance(p[16],p[13])>distance(p[14],p[13])*1.18;
 const names=FINGER_NAMES.filter((_,i)=>extended[i]);
 return {extended,count:names.length,names,label:`${names.length} Jari${names.length?' ('+names.join('+')+')':''}`,tips:[4,8,12,16,20].filter((_,i)=>extended[i]),palm:{x:(p[0].x+p[5].x+p[9].x+p[17].x)/4,y:(p[0].y+p[5].y+p[9].y+p[17].y)/4},scale,pinchRatio:distance(p[4],p[8])/scale,gun:extended[0]&&extended[1]&&!extended[2]&&!extended[3]&&!extended[4]};
}
export class HoldGate{
 constructor(ms){this.ms=ms;this.reset()}
 reset(){this.start=null;this.key=null;this.fired=false;this.pausedAt=null}
 pause(now){this.pausedAt??=now}
 resume(now){if(this.pausedAt!==null){if(now-this.pausedAt>1500)this.reset();else if(this.start!==null)this.start+=now-this.pausedAt;this.pausedAt=null}}
 update(key,now){if(!key){this.reset();return {progress:0,fire:false}}if(this.key!==key){this.key=key;this.start=now;this.fired=false}const progress=clamp((now-this.start)/this.ms,0,1);const fire=progress>=1&&!this.fired;if(fire)this.fired=true;return {progress,fire}}
}
export class HandNextTracker{
 constructor(){this.hold=new HoldGate(900);this.reset()}
 reset(){this.history=[];this.hold.reset();this.fired=false;this.unlockAt=0;this.wasReleased=false}
 update(hand,now,canAdvance){
  if(!canAdvance){this.reset();return null}
  if(this.fired)return null;
  if(!hand){this.history=[];this.hold.reset();return null}
  const open=hand.count===5;const hold=this.hold.update(open?'palm':null,now);
  if(hold.fire){this.fired=true;return 'five'}
  // Coordinates are mirrored to match the preview and the player's left-to-right movement.
  const point={x:1-hand.palm.x,y:hand.palm.y,t:now};
  if(hand.count>=3){this.history.push(point);this.history=this.history.filter(v=>now-v.t<850)}else this.history=[];
  if(this.history.length>=5){let first=this.history[0],last=point,dx=last.x-first.x,dy=Math.abs(last.y-first.y),span=now-first.t;let reverse=0;for(let i=1;i<this.history.length;i++)reverse+=Math.max(0,this.history[i-1].x-this.history[i].x);if(span>=180&&dx>.22&&dy<.16&&reverse<.07){this.fired=true;return 'swipe'}}
  return null;
 }
}
export function faceMetrics(points,blendshapes=[]){
 if(!points?.[263])return null;const a=points[33],b=points[263],nose=points[1],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};let dx=b.x-a.x,dy=b.y-a.y;if(dx<0){dx=-dx;dy=-dy}const len=Math.max(.02,Math.hypot(dx,dy)),ux=dx/len,uy=dy/len;
 const nx=nose.x-mid.x,ny=nose.y-mid.y;const mouthWidth=Math.max(.01,distance(points[78],points[308]));const geometric=distance(points[13],points[14])/mouthWidth;
 return {yaw:-(nx*ux+ny*uy)/len,pitch:(-nx*uy+ny*ux)/len,jaw:blendshapes.find(b=>b.categoryName==='jawOpen')?.score??geometric,geometricMouth:geometric};
}
export class FaceController{
 constructor(){this.reset()}
 reset(){this.baseline=null;this.samples=[];this.hold=new HoldGate(650);this.nextMouth=new HoldGate(650);this.center=new HoldGate(300);this.armed=false;this.answerLatched=false;this.nextLatched=false;this.lastPhase=''}
 calibrate(){this.reset()}
 rearm(){this.hold.reset();this.nextMouth.reset();this.center.reset();this.armed=false;this.answerLatched=false;this.nextLatched=false;this.lastPhase=''}
 update(m,now,phase){
  if(!m){this.hold.reset();this.nextMouth.reset();this.center.reset();return {calibrating:!this.baseline}}
  if(!this.baseline){this.samples.push({...m,t:now});if(this.samples.length>=8&&now-this.samples[0].t>=850){this.baseline={yaw:this.samples.reduce((s,v)=>s+v.yaw,0)/this.samples.length,pitch:this.samples.reduce((s,v)=>s+v.pitch,0)/this.samples.length};return {calibrating:false,ready:true}}return {calibrating:true}}
  if(phase!==this.lastPhase){this.hold.reset();this.nextMouth.reset();this.center.reset();this.armed=false;this.nextLatched=false;this.lastPhase=phase}
  const yaw=m.yaw-this.baseline.yaw,pitch=m.pitch-this.baseline.pitch,centered=Math.abs(yaw)<.075&&Math.abs(pitch)<.065;
  const centeredHold=this.center.update(centered?'center':null,now);if(centeredHold.fire){this.armed=true;this.answerLatched=false}
  if(phase==='next'){
   const mouth=this.nextMouth.update(m.jaw>.27||m.geometricMouth>.22?'mouth':null,now);
   if(!this.nextLatched&&(mouth.fire||(this.armed&&(yaw>.11||pitch<-.10)))){this.nextLatched=true;return {next:mouth.fire?'mouth':'head',yaw,pitch,jaw:m.jaw}}
   return {yaw,pitch,jaw:m.jaw,progress:mouth.progress,armed:this.armed};
  }
  this.nextMouth.reset();if(phase!=='answer'||this.answerLatched)return {yaw,pitch,jaw:m.jaw};
  let choice=null;if(Math.abs(yaw)>.11&&Math.abs(yaw)>Math.abs(pitch))choice=yaw<0?0:1;else if(Math.abs(pitch)>.10)choice=pitch<0?2:3;
  const h=this.hold.update(choice===null?null:String(choice),now);
  if(h.fire){this.answerLatched=true;return {choice,progress:1,yaw,pitch,jaw:m.jaw}}
  return {target:choice,progress:h.progress,yaw,pitch,jaw:m.jaw};
 }
}
