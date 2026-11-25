import {QUIZ_POWERS} from './quiz-controls.mjs';
import {classifyHand,distance} from './gesture-math.mjs';
import {practice} from './practice.mjs';
import './board.mjs';
const el=id=>document.getElementById(id);
const mission=window.PomeMission, board=window.BioQuestBoard, power=el('power'), area=el('activity');
let mode=power.value, palm=null, since=0, spread=null, point=null, toastTimer;
const hints={
 menu:'Hala dan tahan, cubit atau bentuk pistol untuk klik. Cubit dan gerakkan tangan di atas loji untuk putar. Jarakkan dua tapak tangan untuk zum.',
 practice:'Latih empat gerakan dengan sasaran bergerak atau cuba versi sentuh.',
 board:'Seret kad dengan cubitan atau isyarat pistol. Jarakkan dua tapak tangan untuk zum.',
 valve:'Buka tapak tangan untuk membuka injap model. Genggam untuk menutupnya. Cuba capai bukaan 60–70%.'
};
function toast(text){
 const node=el('toast');node.textContent=text;node.classList.add('show');
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('show'),1700);
}
function burst(x,y,color){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const spark=document.createElement('span');spark.textContent='✦';
 Object.assign(spark.style,{position:'fixed',left:x+'px',top:y+'px',color,pointerEvents:'none',zIndex:99});
 document.body.append(spark);spark.animate([{opacity:1},{opacity:0,transform:'translateY(-24px) scale(2)'}],450).onfinish=()=>spark.remove();
}
window.BioQuest={
 getGame:()=>QUIZ_POWERS[mode]?{power:mode,...mission.state()}:null,
 choose:mission.choose,nextQuestion:mission.next,toast,burst,
 showActivityResult({answers}){
  el('boardStatus').textContent=answers.filter(a=>a.correct).length+' / '+answers.length+' tepat. '+answers.map(a=>a.q.prompt+' → '+a.q.options[a.q.answer]).join(' · ');
  el('boardReset').onclick=()=>selectMode('board');
 }
};
function releaseGesture(){spread=null;point=null;palm=null}
window.BioQuestLab={
 isActive:()=>mode==='menu',releaseGesture,
 onHands(hands,hand,p,now,threshold){
  const r=document.querySelector('.world canvas').getBoundingClientRect();
  if(hands.length===2 && r.top<innerHeight && r.bottom>0){
   const [a,b]=hands.map(h=>classifyHand(h));
   if(a?.count>=3 && b?.count>=3){
    const gap=Math.max(.06,distance(a.palm,b.palm));
    if(spread!==null)mission.zoom(Math.log(gap/spread));spread=gap;point=null;return true;
   }
  }
  spread=null;
  if(hand.pinchRatio<threshold && p.x>=r.left && p.x<=r.right && p.y>=r.top && p.y<=r.bottom){
   if(point)mission.rotate((p.x-point.x)*.008,(p.y-point.y)*.006);
   point={...p};return true;
  }
  point=null;return false;
 }
};
function updateValve(value){
 const slider=el('valveRange');slider.value=Math.max(0,Math.min(100,value));
 const n=Number(slider.value);el('valveState').textContent=n+'%'+(n>=60 && n<=70?' · Sasaran dicapai':'');
}
window.BioQuestAdventure={
 isActive:()=>practice.isActive()||mode==='valve',
 practiceMethod:()=>practice.isActive()?practice.practiceMethod():null,
 onGestureClick:practice.onGestureClick,
 onHands(hands,hand,now){
  if(practice.isActive())return practice.onHands(hands,hand,now);
  if(hand.count!==5 && hand.count!==0){palm=null;return false}
  if(palm!==hand.count){palm=hand.count;since=now}
  if(now-since<=300)return false;
  updateValve(Number(el('valveRange').value)+(palm===5?7:-7));return true;
 },
 isDragging:()=>false,cancelDrag(){palm=null},beginDrag:()=>false,panAt:()=>false
};
function selectMode(next){
 window.stopCamera?.(true);board.destroy();practice.destroy();releaseGesture();
 mode=next;power.value=mode;area.replaceChildren();
 el('powerHint').textContent=QUIZ_POWERS[mode]?.hint||hints[mode];
 if(mode==='practice'){
  area.innerHTML='<div id="adventureContent"></div><p id="adventureStatus" role="status"></p><button id="restartPractice">Ulang latihan</button>';
  practice.init();el('restartPractice').onclick=practice.init;
 }else if(mode==='board'){area.innerHTML=board.page();board.init()}
 else if(mode==='valve'){
  area.innerHTML='<label>Bukaan injap <input id="valveRange" type="range" min="0" max="100" value="30"></label> <output id="valveState"></output>';
  el('valveRange').oninput=e=>updateValve(e.target.value);updateValve(30);
 }
 window.BioQuestCamera?.quizModeChanged(QUIZ_POWERS[mode]?mode:'orb');
}
window.PomeGestureMode=selectMode;
power.onchange=()=>selectMode(power.value);
el('gestureSettings').onclick=()=>window.BioQuestCamera.settings();
el('gestureReset').onclick=()=>{window.BioQuestCamera.resetOriginal();toast('Tetapan asal dipulihkan.')};
el('closeModal').onclick=()=>el('modal').close();
document.addEventListener('keydown',event=>{
 if(event.key==='Enter'&&!event.repeat && !el('modal').open && el('cameraHelp').hidden && !event.target.closest('button,a,input,select,textarea,summary'))mission.next();
});
el('powerHint').textContent=QUIZ_POWERS[mode].hint;
await import('./camera.js');
