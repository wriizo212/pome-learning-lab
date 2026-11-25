import {clamp,distance} from './gesture-math.mjs';

export const DEFAULT_CAMERA={sensitivity:1,dwell:1000,answerDwell:2500,method:'auto',dominant:'auto',quality:'auto',magnet:true};
export function cameraSettings(raw={}){
 return {sensitivity:clamp(Number(raw.sensitivity)||1,.65,1.6),dwell:clamp(Number(raw.dwell)||1000,600,1800),answerDwell:clamp(Number(raw.answerDwell)||DEFAULT_CAMERA.answerDwell,1000,5000),method:['auto','orb','gun','pinch','fingers'].includes(raw.method)?raw.method:'auto',dominant:['auto','Left','Right'].includes(raw.dominant)?raw.dominant:'auto',quality:['auto','light','detail'].includes(raw.quality)?raw.quality:'auto',magnet:raw.magnet!==false};
}
export function validProfile(p){return !!p&&p.v===1&&[p.left,p.right,p.top,p.bottom,p.pinch].every(Number.isFinite)&&p.left>=0&&p.right<=1&&p.right-p.left>=.14&&p.top>=0&&p.bottom<=1&&p.bottom-p.top>=.1&&p.pinch>=.15&&p.pinch<=.42}
export function mapPointer(tip,profile,sensitivity=1){
 const p=validProfile(profile)?profile:{left:.12,right:.88,top:.08,bottom:.9};
 return {x:clamp((((1-tip.x-p.left)/(p.right-p.left))-.5)*sensitivity+.5,0,1),y:clamp((((tip.y-p.top)/(p.bottom-p.top))-.5)*sensitivity+.5,0,1)};
}
// Low-speed movement is damped more than deliberate large movements.
export class AdaptivePointer{
 reset(){this.point=null;this.time=0}
 constructor(){this.reset()}
 update(next,now){if(!this.point){this.point={...next};this.time=now;return {...next}}const dt=clamp(now-this.time,16,180),speed=Math.hypot(next.x-this.point.x,next.y-this.point.y)/dt,alpha=1-Math.exp(-dt/(speed<.12?150:speed<.6?85:35));this.point.x+=(next.x-this.point.x)*alpha;this.point.y+=(next.y-this.point.y)*alpha;this.time=now;return {...this.point}}
}
export function qualityOfHand(points,hand,previous,dt=100){
 if(!hand)return {ok:false,reason:'Tunjukkan seluruh tangan di dalam kamera.'};
 const visible=points.filter(p=>p.x>=-.12&&p.x<=1.12&&p.y>=-.12&&p.y<=1.12).length;
 if(visible<15||hand.palm.x<-.08||hand.palm.x>1.08||hand.palm.y<-.08||hand.palm.y>1.08)return {ok:false,reason:'Tangan di luar bingkai. Gerakkan tapak tangan ke tengah.'};
 if(hand.scale>.8)return {ok:false,reason:'Tangan terlalu dekat. Jauhkan sedikit daripada kamera.'};
 if(hand.scale<.045)return {ok:false,reason:'Tangan terlalu jauh. Dekatkan sedikit kepada kamera.'};
 if(previous&&distance(hand.palm,previous)>Math.max(.45,dt*.004))return {ok:false,reason:'Gerakan terlalu pantas. Tahan tangan seketika.'};
 return {ok:true,reason:'Tangan dalam bingkai. Pengesanan sedia.'};
}
export class StableTracking{
 constructor(){this.reset()}
 reset(){this.frames=0;this.last=null;this.time=0}
 update(points,hand,now){const q=qualityOfHand(points,hand,this.last,now-this.time||100);this.last=hand?.palm||null;this.time=now;this.frames=q.ok?this.frames+1:0;return {...q,ready:q.ok&&this.frames>=3,progress:clamp(this.frames/3,0,1)}}
}
const quantile=(arr,q)=>[...arr].sort((a,b)=>a-b)[Math.floor((arr.length-1)*q)];
export class HandCalibration{
 constructor(){this.reset()}
 reset(){this.stage=0;this.samples=[];this.since=null;this.bounds=null;this.profile=null}
 update(p,h,now){
  if(!h){this.since=null;return {stage:this.stage,progress:0}}
  if(this.stage===0){if(h.count!==5){this.since=null;return {stage:0,progress:0}}this.since??=now;if(now-this.since>=800){this.stage=1;this.since=null;this.samples=[]}return {stage:this.stage,progress:clamp((now-(this.since??now))/800,0,1)}}
  if(this.stage===1){if(!h.extended[1])return {stage:1,progress:0};this.since??=now;this.samples.push({x:1-p[8].x,y:p[8].y});if(this.samples.length>120)this.samples.shift();const xs=this.samples.map(v=>v.x),ys=this.samples.map(v=>v.y),left=quantile(xs,.05),right=quantile(xs,.95),top=quantile(ys,.05),bottom=quantile(ys,.95),coverage=Math.min((right-left)/.20,(bottom-top)/.16);if(this.samples.length>=18&&now-this.since>=1600&&coverage>=1){this.bounds={left:clamp(left-.025,0,.84),right:clamp(right+.025,.16,1),top:clamp(top-.025,0,.88),bottom:clamp(bottom+.025,.12,1)};this.stage=2;this.samples=[];this.since=null}return {stage:this.stage,progress:clamp(coverage,0,1)}}
  if(this.stage===2){if(h.pinchRatio>.42){this.since=null;this.samples=[];return {stage:2,progress:0}}this.since??=now;this.samples.push(h.pinchRatio);if(now-this.since>=600&&this.samples.length>=4){this.profile={v:1,...this.bounds,pinch:clamp(quantile(this.samples,.6)*1.5,.17,.38)};this.stage=3}return {stage:this.stage,progress:clamp((now-(this.since??now))/600,0,1),profile:this.profile}}
  return {stage:3,progress:1,profile:this.profile};
 }
}
export class AdaptivePerformance{
 constructor(mobile=false){this.mobile=mobile;this.cost=0;this.count=0;this.level=mobile?'balanced':'detail';this.lastChange=0}
 sample(ms,now){this.cost=this.count?this.cost*.85+ms*.15:ms;this.count++;if(this.count>=10&&now-this.lastChange>4000){if(this.cost>95)this.level='light';else if(this.cost<40)this.level=this.mobile?'balanced':'detail';else this.level='balanced';this.lastChange=now}return this.level}
 config(setting='auto'){const level=setting==='auto'?this.level:setting;return level==='light'?{interval:150,width:360,height:270,level:'Ringan'}:level==='detail'?{interval:66,width:640,height:480,level:'Terperinci'}:{interval:100,width:480,height:360,level:'Seimbang'}}
}
