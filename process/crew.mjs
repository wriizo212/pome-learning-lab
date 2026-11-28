import * as T from './three.module.min.js';
import {blobShadow,oilPalm,palmMaterial} from './life.mjs?v=shift18';

// Each worker has a person behind the role (used for name tags and conversations).
const PEOPLE=['Azlan','Mei Ling','Ravi','Siti','Farid','Hafiz','Joko','Pak Ali'];
const KIT_PEOPLE={operator:'Azlan',sampler:'Mei Ling',tech:'Ravi',handler:'Siti',officer:'Farid',guard:'Hafiz',harvester:'Joko',angler:'Pak Ali'};
const KIT_VEST={operator:0xe97835,sampler:0xe2c13a,tech:0x4f9fd8,handler:0x6fc06b,officer:0xd8473b,guard:0x2e4a7a,harvester:0x7a8f45,angler:0x3f7fb0};

/*
 Mill crew. Each worker follows a looping shift plan made of walking legs and jobs.
 A job has its own pose, hand tools and world props (rake, dipper, wrench, shovel,
 wheelbarrow, valve wheel) so the viewer can read what every person is doing.
 The plan is a pure function of time, so pausing, resuming and orbiting stay in sync.
*/

const SPEED=.5,RAMP=.45,STRIDE=.72;
// Distance walked τ seconds into a leg, with gentle acceleration and braking.
function walkDistance(step,τ){const V=SPEED,r=RAMP,d=step.dur;if(τ<=0)return 0;if(τ>=d)return step.len;if(τ<r)return .5*V*τ*τ/r;if(τ<d-r)return .5*V*r+V*(τ-r);const q=d-τ;return step.len-.5*V*q*q/r}
function walkSpeed(step,τ){return Math.max(0,Math.min(1,τ/RAMP,(step.dur-τ)/RAMP))}

// Shift plans per scene. Points are [x,z] or [x,z,height] (height lifts the walker over a stile).
const LAYOUTS={
 reactor:{
  lane:2.39,
  skip:[-5.75,2.78],heap:[1.12,-2.82],valve:[-2.4,.86,.91],stile:[-3.08,.91],barrow:[4.75,-1.4],
  bench:[5.75,1.74],dial:[3.43,1.88],
  roles:[
   {name:'Shift operator',kit:'operator',skin:0xb98767,helmet:0xf0ede0,start:[-4.6,2.2],toss:1,plan:[
    ['do','rake',10,[-4.6,1.0],'Raking screenings off the bar screen'],
    ['go',[[-5.5,2.38]],{tool:'rake',label:'Carrying screenings to the skip'}],
    ['do','dump',3,[-5.75,2.78],'Tipping screenings into the skip'],
    ['go',[[-4.1,2.5],[-2.4,2.3],[-2.4,1.27]],{tool:'rake',label:'Walking to the UASB feed valve'}],
    ['do','valve',6,[-2.4,.91],'Trimming the UASB feed flow at the valve'],
    ['go',[[-.7,2.12]],{label:'Moving to the sludge-bed sight glass'}],
    ['do','clipboard',6,[-1.2,.6],'Logging sludge-bed level and gas pressure'],
    ['go',[[-3.0,2.5],[-4.6,2.2]],{label:'Returning to the inlet screen'}]
   ]},
   {name:'Water sampler',kit:'sampler',skin:0x875846,helmet:0xffbf39,start:[1.6,2.1],plan:[
    ['do','dip',7,[1.6,1.0],'Dipping a mixed-liquor sample from the aeration basin'],
    ['go',[[2.9,2.72],[4.1,2.72],[4.6,2.08]],{carry:'bottle',label:'Carrying the sample bottle'}],
    ['do','dip',6,[4.75,.7],'Sampling treated effluent at the outlet chamber'],
    ['go',[[5.75,2.36]],{carry:'bottle',label:'Taking samples to the field bench'}],
    ['do','test',9,[5.75,1.74],'Testing pH, dissolved oxygen and COD'],
    ['do','clipboard',4,[5.75,1.74],'Recording the lab results'],
    ['go',[[4.1,2.72],[2.9,2.72],[1.6,2.1]],{label:'Heading back to the aeration basin'}]
   ]},
   {name:'Instrumentation technician',kit:'tech',skin:0xc59878,helmet:0xffc548,start:[3.43,2.3],plan:[
    ['do','tablet',6,[3.43,1.88],'Verifying the effluent flow meter'],
    ['go',[[2.2,2.82],[-3.08,2.82],[-3.08,1.4],[-3.08,1.12,.19],[-3.08,.7,.19],[-3.08,.42],[-3.08,-2.2],[-1.95,-2.2]],{label:'Walking to the biogas engine'}],
    ['do','kneel',10,[-.4,-2.2],'Servicing the biogas engine: plugs and gas filter'],
    ['do','tablet',5,[-.4,-2.2],'Logging engine output (kW) and biogas flow'],
    ['go',[[-3.08,-2.2],[-3.08,.42],[-3.08,.7,.19],[-3.08,1.12,.19],[-3.08,1.4],[-3.08,2.82],[2.2,2.82],[3.43,2.3]],{label:'Returning to the instrument loop'}]
   ]},
   {name:'Sludge handler',kit:'handler',skin:0x9c6b4f,helmet:0x74c8a4,start:[4.75,-1.95],toss:1,plan:[
    ['do','shovel',10,[3.6,-1.95],'Shovelling dried sludge cake into the barrow'],
    ['go',[[4.75,-2.82],[2.05,-2.82]],{push:true,label:'Wheeling sludge cake to the compost heap'}],
    ['do','tip',3.5,[1.12,-2.82],'Tipping cake onto the compost heap'],
    ['go',[[4.75,-2.82],[4.75,-1.95]],{push:true,label:'Returning with the empty barrow'}]
   ]},
   {name:'Security guard',kit:'guard',skin:0x8a5a40,helmet:0x23324a,start:[9.2,4.85,-.38],plan:[
    ['do','clipboard',9,[7.55,4.45],'Logging lorries in and out at the gate'],
    ['go',[[6.9,4.85,-.38],[-2,4.85,-.38],[-10,4.85,-.38]],{label:'Patrolling the fence line'}],
    ['do','look',5,[-10,0],'Checking the fence for gaps'],
    ['go',[[-2,4.85,-.38],[6.9,4.85,-.38],[9.2,4.85,-.38]],{label:'Walking back to the gate booth'}]
   ]},
   {name:'FFB harvester',kit:'harvester',skin:0x7a4e35,helmet:0xd8c9a0,start:[-16,3.8,-.38],plan:[
    ['go',[[-16,-4.5,-.38],[-16.6,-4.5,-.38]],{tool:'pole',label:'Walking the harvest path'}],
    ['do','harvest',7,[-17.6,-4.5],'Cutting a ripe bunch with the egrek'],
    ['do','gather',3,[-17.6,-4.5],'Picking up the bunch and loose fruit'],
    ['go',[[-16,-3,-.38],[-15.4,-3,-.38]],{carry:'ffb',label:'Moving to the next ripe palm'}],
    ['do','harvest',7,[-14.4,-3],'Cutting a ripe bunch with the egrek'],
    ['do','gather',3,[-14.4,-3],'Picking up the bunch and loose fruit'],
    ['go',[[-16,-.5,-.38],[-16.6,-.5,-.38]],{carry:'ffb',label:'Moving to the next ripe palm'}],
    ['do','harvest',7,[-17.6,-.5],'Cutting a ripe bunch with the egrek'],
    ['do','gather',3,[-17.6,-.5],'Picking up the bunch and loose fruit'],
    ['go',[[-16,3.8,-.38]],{carry:'ffb',label:'Carrying bunches to the collection point'}],
    ['do','load',3,[-16,4.6],'Stacking bunches at the collection point']
   ]}
  ],
  harvest:{palms:[[-17.6,-4.5],[-14.4,-3],[-17.6,-.5],[-14.4,1],[-17.6,3.5],[-14.4,5.2]],pile:[-16,4.6],y:-.29,worker:5}},
 arcade:{
  lane:1.27,
  skip:[-5.8,.85],heap:[-5.85,2.6],valve:[-.35,.8,.02],stile:null,barrow:[-.35,3.1],
  bench:[5.45,.69],dial:[1.02,.76],
  roles:[
   {name:'Shift operator',kit:'operator',skin:0xb98767,helmet:0xf0ede0,start:[-4,.72],plan:[
    ['do','rake',10,[-4,-1.3],'Raking screenings off the intake screen'],
    ['go',[[-5.3,.85]],{tool:'rake',label:'Carrying screenings to the skip'}],
    ['do','dump',3,[-5.8,.85],'Tipping screenings into the skip'],
    ['go',[[-4,1.27],[-.35,1.27],[-.35,.56]],{tool:'rake',label:'Walking to the digester feed valve'}],
    ['do','valve',6,[-.35,-.3],'Trimming the digester feed at the valve'],
    ['go',[[.15,1.2]],{label:'Moving to the digester gauges'}],
    ['do','clipboard',5,[-.9,-1.65],'Logging digester temperature and gas pressure'],
    ['go',[[-4,1.27],[-4,.72]],{label:'Returning to the intake screen'}]
   ]},
   {name:'Water sampler',kit:'sampler',skin:0x875846,helmet:0xffbf39,start:[2.6,1.15],plan:[
    ['do','dip',7,[2.6,0],'Dipping a sample from the polishing basin'],
    ['go',[[2.9,1.4],[3.1,3.4]],{carry:'bottle',label:'Walking down to the river bank'}],
    ['do','dip',6,[3.1,4.6],'Sampling the receiving river downstream'],
    ['go',[[5.45,1.55],[5.45,1.36]],{carry:'bottle',label:'Taking samples to the field bench'}],
    ['do','test',9,[5.45,.69],'Testing pH, dissolved oxygen and COD'],
    ['do','clipboard',4,[5.45,.69],'Recording the lab results'],
    ['go',[[4.2,1.4],[2.6,1.15]],{label:'Heading back to the polishing basin'}]
   ]},
   {name:'Instrumentation technician',kit:'tech',skin:0xc59878,helmet:0xffc548,start:[1.02,1.3],plan:[
    ['do','tablet',6,[1.02,.76],'Verifying the flow meter reading'],
    ['go',[[6.0,1.45],[6.0,-1.83],[2.6,-1.83]],{label:'Walking to the gas engine house'}],
    ['do','kneel',10,[2.6,-3.1],'Servicing the gas engine: plugs and gas filter'],
    ['do','tablet',5,[2.6,-3.1],'Logging engine output (kW) and biogas flow'],
    ['go',[[6.0,-1.83],[6.0,1.45],[1.02,1.3]],{label:'Returning to the instrument loop'}]
   ]},
   {name:'Sludge handler',kit:'handler',skin:0x9c6b4f,helmet:0x74c8a4,start:[-.35,2.55],toss:1,plan:[
    ['do','shovel',10,[-1.6,2.55],'Shovelling dried sludge cake into the barrow'],
    ['go',[[-.35,1.45],[-4.75,1.45],[-4.75,2.55],[-4.95,2.55]],{push:true,label:'Wheeling sludge cake to the compost heap'}],
    ['do','tip',3.5,[-5.85,2.55],'Tipping cake onto the compost heap'],
    ['go',[[-4.75,2.55],[-4.75,1.45],[-.35,1.45],[-.35,2.55]],{push:true,label:'Returning with the empty barrow'}]
   ]},
   {name:'Gas safety officer',kit:'officer',skin:0xa77657,helmet:0xf4f1e6,start:[1.55,-2.95],plan:[
    ['do','detector',7,[2.1,-3.6],'Sniffing gas-line joints for CH₄ and H₂S leaks'],
    ['go',[[1.3,-3.0]],{label:'Moving to the flare stack'}],
    ['do','clipboard',5,[.9,-3.45],'Confirming the flare pilot flame is lit'],
    ['go',[[1.3,-1.83],[6.1,-1.83],[6.1,3.35],[5.45,3.45]],{label:'Patrolling to the river outfall'}],
    ['do','detector',6,[5.2,4.1],'Checking the outfall for foam, odour and colour'],
    ['go',[[6.1,3.35],[6.1,-1.83],[1.55,-1.83],[1.55,-2.95]],{label:'Returning to the gas line'}]
   ]},
   {name:'FFB harvester',kit:'harvester',skin:0x7a4e35,helmet:0xd8c9a0,start:[11.5,-3.9],plan:[
    ['go',[[11.5,-3],[11.2,-3]],{tool:'pole',label:'Walking the harvest path'}],
    ['do','harvest',7,[10.2,-3],'Cutting a ripe bunch with the egrek'],
    ['do','gather',3,[10.2,-3],'Picking up the bunch and loose fruit'],
    ['go',[[11.5,-1.5],[11.8,-1.5]],{carry:'ffb',label:'Moving to the next ripe palm'}],
    ['do','harvest',7,[12.8,-1.5],'Cutting a ripe bunch with the egrek'],
    ['do','gather',3,[12.8,-1.5],'Picking up the bunch and loose fruit'],
    ['go',[[11.5,0],[11.2,0]],{carry:'ffb',label:'Moving to the next ripe palm'}],
    ['do','harvest',7,[10.2,0],'Cutting a ripe bunch with the egrek'],
    ['do','gather',3,[10.2,0],'Picking up the bunch and loose fruit'],
    ['go',[[11.5,-3.9]],{carry:'ffb',label:'Carrying bunches to the collection point'}],
    ['do','load',3,[11.5,-4.7],'Stacking bunches at the collection point']
   ]},
   {name:'Village angler',kit:'angler',skin:0x6e4a33,helmet:0x2a2a2a,start:[1.7,3.48],plan:[
    ['do','fish',24,[1.7,4.7],'Fishing from the river bank'],
    ['go',[[.4,3.42],[-1.0,3.48]],{tool:'rod',label:'Moving to a new fishing spot'}],
    ['do','fish',20,[-1.0,4.7],'Fishing from the river bank'],
    ['go',[[.4,3.42],[1.7,3.48]],{tool:'rod',label:'Moving back to the first spot'}]
   ]}
  ],
  harvest:{palms:[[10.2,-3],[12.8,-1.5],[10.2,0],[12.8,1.5],[10.2,2.9],[12.8,-4.2]],pile:[11.5,-4.7],y:0,worker:5},
  fishing:{worker:6,spots:[[1.7,3.48],[-1.0,3.48]]}},
 // Conventional ponds (ponds3d.mjs): ground at y=0, embankment crests at y=.7.
 ponds:{
  y0:0,backdrop:false,
  skip:[-9.9,2.1],heap:[2.5,-4.9],valve:[-8.3,.9,1.15],stile:null,barrow:[-2.6,-7.2],
  bench:[4.0,4.0],dial:[-8.3,-1.6],
  roles:[
   {name:'Shift operator',kit:'operator',skin:0xb98767,helmet:0xf0ede0,start:[-9.2,1.35],toss:1,plan:[
    ['do','rake',10,[-8.9,-.2],'Skimming oil and fibre off the oil trap'],
    ['go',[[-9.9,1.7]],{tool:'rake',label:'Carrying skimmings to the skip'}],
    ['do','dump',3,[-9.9,2.1],'Tipping skimmings into the skip'],
    ['go',[[-8.3,1.75]],{label:'Walking to the pond inlet valve'}],
    ['do','valve',6,[-8.3,1.15],'Adjusting the POME flow into the anaerobic pond'],
    ['go',[[-8.4,3.8],[-4.2,3.8],[-4.2,3.1,.39],[-4.2,2.55,.7]],{label:'Climbing the bank to check the anaerobic pond'}],
    ['do','clipboard',6,[-4.2,0],'Logging the pond level and the thickness of the scum crust'],
    ['go',[[-4.2,3.1,.39],[-4.2,3.8],[-8.4,3.8],[-9.2,1.35]],{label:'Returning to the oil trap'}]
   ]},
   {name:'Water sampler',kit:'sampler',skin:0x875846,helmet:0xffbf39,start:[6.4,3.8],plan:[
    ['go',[[6.4,3.1,.39],[6.4,2.55,.7]],{label:'Climbing the bank of the aerobic pond'}],
    ['do','dip',7,[6.4,0],'Dipping a sample from the aerobic pond'],
    ['go',[[6.4,3.1,.39],[6.4,3.8],[4.0,3.8],[4.0,3.55]],{carry:'bottle',label:'Carrying the sample to the field bench'}],
    ['do','test',9,[4.0,4.0],'Testing pH, dissolved oxygen and BOD'],
    ['do','clipboard',4,[4.0,4.0],'Recording the results in the pond log'],
    ['go',[[4.0,3.8],[8.9,3.8],[9.3,2.45]],{carry:'bottle',label:'Walking to the final discharge sampling point'}],
    ['do','dip',6,[9.3,1.6],'Sampling the final discharge at the V-notch weir'],
    ['go',[[8.9,3.8],[6.4,3.8]],{carry:'bottle',label:'Heading back to the aerobic pond'}]
   ]},
   {name:'Pump technician',kit:'tech',skin:0xc59878,helmet:0xffc548,start:[-8.3,-2.2],plan:[
    ['do','tablet',6,[-8.3,-1.6],'Reading the pond inlet flow meter'],
    ['go',[[-8.35,-3.0]],{label:'Walking to the pump house'}],
    ['do','kneel',10,[-8.8,-3.0],'Servicing the transfer pump: seals, bearings and strainer'],
    ['do','tablet',5,[-8.8,-3.0],'Logging pump hours and power use'],
    ['go',[[-8.3,-2.2]],{label:'Returning to the flow meter'}]
   ]},
   {name:'Sludge handler',kit:'handler',skin:0x9c6b4f,helmet:0x74c8a4,start:[-2.6,-6.75],toss:1,plan:[
    ['do','shovel',10,[-2.6,-5.6],'Shovelling dried sludge cake into the barrow'],
    ['go',[[-.9,-7.05],[2.1,-6.2],[2.1,-5.45]],{push:true,label:'Wheeling sludge cake to the stockpile'}],
    ['do','tip',3.5,[2.5,-4.9],'Tipping cake onto the stockpile'],
    ['go',[[2.1,-6.2],[-.9,-7.05],[-2.6,-6.75]],{push:true,label:'Returning with the empty barrow'}]
   ]},
   {name:'Gas safety officer',kit:'officer',skin:0xa77657,helmet:0xf4f1e6,start:[-2.0,3.8],plan:[
    ['go',[[-2.0,3.1,.39],[-2.0,2.55,.7]],{label:'Climbing to the anaerobic pond'}],
    ['do','detector',8,[-3.2,0],'Measuring CH₄ and H₂S above the open pond'],
    ['go',[[-2.0,3.1,.39],[-2.0,3.8],[8.6,3.8],[9.1,2.6]],{label:'Patrolling to the discharge channel'}],
    ['do','detector',6,[9.5,1.6],'Checking the discharge for foam, odour and colour'],
    ['go',[[8.6,3.8],[-2.0,3.8]],{label:'Walking back to the ponds'}]
   ]},
   {name:'FFB harvester',kit:'harvester',skin:0x7a4e35,helmet:0xd8c9a0,start:[-11.2,6.0],plan:[
    ['go',[[-12.4,6.0]],{tool:'pole',label:'Walking the harvest path'}],
    ['do','harvest',7,[-13.4,6.0],'Cutting a ripe bunch with the egrek'],
    ['do','gather',3,[-13.4,6.0],'Picking up the bunch and loose fruit'],
    ['go',[[-12.4,8.2]],{carry:'ffb',label:'Moving to the next ripe palm'}],
    ['do','harvest',7,[-13.4,8.2],'Cutting a ripe bunch with the egrek'],
    ['do','gather',3,[-13.4,8.2],'Picking up the bunch and loose fruit'],
    ['go',[[-11.2,6.0]],{carry:'ffb',label:'Carrying bunches to the collection point'}],
    ['do','load',3,[-10.4,6.0],'Stacking bunches for the mill lorry']
   ]},
   {name:'Village angler',kit:'angler',skin:0x6e4a33,helmet:0x2a2a2a,start:[9.3,-3],plan:[
    ['do','fish',24,[11.4,-3],'Fishing from the river bank below the ponds'],
    ['go',[[9.3,-4.8],[9.3,-6.5]],{tool:'rod',label:'Moving to a new fishing spot'}],
    ['do','fish',20,[11.4,-6.5],'Fishing from the river bank'],
    ['go',[[9.3,-4.8],[9.3,-3]],{tool:'rod',label:'Moving back to the first spot'}]
   ]}
  ],
  harvest:{palms:[[-13.4,6.0],[-13.4,8.2],[-15.6,6.0],[-15.6,8.2],[-13.4,10.4],[-15.6,10.4]],pile:[-10.4,6.0],y:0,worker:5},
  fishing:{worker:6,spots:[[9.3,-3],[9.3,-6.5]]}}
};

const ease=x=>.5-.5*Math.cos(Math.PI*Math.min(1,Math.max(0,x)));
const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
const faceTo=(from,to)=>Math.atan2(-(to[0]-from[0]),-(to[1]-from[1]));

function compile(role){
 let pos=[role.start[0],role.start[1],role.start[2]||0],t=0,heading=0;const steps=[];
 for(const s of role.plan){
  if(s[0]==='go'){
   const pts=[pos,...s[1].map(p=>[p[0],p[1],p[2]||0])],segs=[];let len=0;
   for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);segs.push({a:pts[i-1],b:pts[i],l,from:len});len+=l}
   const last=segs.at(-1);const dur=len/SPEED+RAMP;
   steps.push({kind:'go',segs,len,dur,start:t,opts:s[2]||{},label:(s[2]||{}).label||'Walking'});
   heading=faceTo(last.a,last.b);pos=pts.at(-1);t+=dur;
  }else{
   const [,job,dur,face,label]=s;const h=face?faceTo(pos,face):heading;
   steps.push({kind:'do',job,dur,at:pos,face,h0:heading,h1:h,label,start:t});heading=h;t+=dur;
  }
 }
 // The first job turns from the heading the loop ended on.
 for(const s of steps)if(s.kind==='do'&&s.start===0)s.h0=heading;
 return {steps,total:t};
}

export function populate(scene, materials, arcade=false){
 const {steel,brass,cement,dark,base}=materials;
 const layout=typeof arcade==='string'?LAYOUTS[arcade]:arcade?LAYOUTS.arcade:LAYOUTS.reactor,Y0=layout.y0??.11;
 const mat=(color,roughness=.78,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const navy=mat(0x273e50),stripe=mat(0xe1ebad),boots=mat(0x342d29),leaf=materials.leaf||mat(0x506a43),bark=mat(0x79634a),roof=mat(0x688383);
 const wood=mat(0x9a7448,.85),rubber=mat(0x1d2222,.9),glove=mat(0xd9c46a,.85),paper=mat(0xf2efe2,.9),screen=new T.MeshStandardMaterial({color:0x5fd4e6,emissive:0x2b8fa8,emissiveIntensity:.9,roughness:.3});
 const cake=mat(0x5a3f2c,.97),screenings=mat(0x6f5a35,.95),sampleWater=new T.MeshStandardMaterial({color:0x8fbfa9,transparent:true,opacity:.75,roughness:.15});
 const vests=[0xe97835,0xe2c13a,0x4f9fd8,0x6fc06b,0xd8473b];
 // Repeating woven fabric remains visible in shoulder view.
 const cloth=document.createElement('canvas');cloth.width=cloth.height=128;const weave=cloth.getContext('2d');
 weave.fillStyle='#f3eada';weave.fillRect(0,0,128,128);
 for(let n=0;n<128;n+=3){weave.fillStyle='rgba(103,94,86,.13)';weave.fillRect(n,0,1,128);weave.fillStyle='rgba(255,255,255,.45)';weave.fillRect(0,n,128,1)}
 const textile=new T.CanvasTexture(cloth);textile.colorSpace=T.SRGBColorSpace;navy.map=textile;navy.roughness=.91;
 const kitDark=mat(0x2a3437,.6,.2),visorMat=mat(0x37525a,.25,.3);
 const eyeMat=new T.MeshBasicMaterial({color:0x1a1512}),mouthMat=new T.MeshBasicMaterial({color:0x5a2a24}),cuff=mat(0xb5a24f,.85);
 const cube=new T.BoxGeometry(),round=new T.SphereGeometry(1,10,7),tube=new T.CylinderGeometry(1,1,1,10);
 function part(parent,geo,m,x,y,z,w,h,d){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=o.receiveShadow=true;parent.add(o);return o}
 const box=(p,m,x,y,z,w,h,d)=>part(p,cube,m,x,y,z,w,h,d);
 const oval=(p,m,x,y,z,w,h,d)=>part(p,round,m,x,y,z,w,h,d);
 const rod=(p,m,x,y,z,r,l)=>part(p,tube,m,x,y,z,r,l,r);
 function pivot(p,x,y,z){const g=new T.Group();p.add(g);g.position.set(x,y,z);return g}
 // Each rig joint's body parts merge into one vertex-coloured mesh: ~14 draw calls per worker.
 const skin=new T.MeshStandardMaterial({vertexColors:true,roughness:.78,metalness:.02});
 function mergeJoint(joint){
  const parts=joint.children.filter(o=>o.isMesh);if(!parts.length)return null;
  const pos=[],nor=[],col=[],c=new T.Color();
  for(const m of parts){m.updateMatrix();const g=(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone()).applyMatrix4(m.matrix);c.copy(m.material.color);
   pos.push(...g.attributes.position.array);nor.push(...g.attributes.normal.array);for(let i=0;i<g.attributes.position.count;i++)col.push(c.r,c.g,c.b);g.dispose();joint.remove(m)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeBoundingSphere();
  const out=new T.Mesh(g,skin);out.castShadow=false;out.receiveShadow=true;joint.add(out);return out;
 }

 /* ---------- hand tools (built in the torso frame: forward is -z) ---------- */
 function rakeTool(parent){
  const g=pivot(parent,.02,.2,-.12),shaft=pivot(g,0,0,0);
  const h=rod(shaft,wood,0,0,-.55,.014,1.1);h.rotation.x=Math.PI/2;
  box(shaft,steel,0,-.02,-1.1,.36,.03,.04);
  for(let i=0;i<9;i++)box(shaft,steel,-.16+i*.04,-.07,-1.1,.01,.09,.012);
  const load=oval(shaft,screenings,0,-.06,-1.07,.12,.05,.05);
  return {g,shaft,load};
 }
 function shovelTool(parent){
  const g=pivot(parent,.04,.16,-.1),shaft=pivot(g,0,0,0);
  const h=rod(shaft,wood,0,0,-.42,.016,.85);h.rotation.x=Math.PI/2;
  box(shaft,dark,0,0,.02,.1,.025,.03);
  const blade=box(shaft,steel,0,-.02,-.93,.2,.015,.25);blade.rotation.x=-.2;
  const load=oval(shaft,cake,0,.02,-.93,.09,.04,.1);
  return {g,shaft,load};
 }
 function dipperTool(parent){
  const g=pivot(parent,.08,.22,-.1),shaft=pivot(g,0,0,0);
  const h=rod(shaft,steel,0,0,-.65,.011,1.3);h.rotation.x=Math.PI/2;
  rod(shaft,steel,0,-.04,-1.3,.045,.08);const fill=rod(shaft,sampleWater,0,-.045,-1.3,.04,.05);
  return {g,shaft,fill};
 }
 function bottleProp(hand){const g=pivot(hand,0,-.02,-.02);rod(g,sampleWater,0,0,0,.026,.09);rod(g,navy,0,.055,0,.02,.025);return g}
 function tabletProp(hand){const g=pivot(hand,.02,-.02,-.05);box(g,dark,0,0,0,.2,.016,.14);const s=box(g,screen,0,.009,0,.18,.003,.12);g.rotation.x=.45;return {g,s}}
 function clipboardProp(hand){const g=pivot(hand,.02,-.03,-.05);box(g,wood,0,0,0,.16,.012,.22);box(g,paper,0,.008,.01,.14,.004,.18);box(g,steel,0,.012,-.1,.06,.01,.02);g.rotation.x=.55;return g}
 function wrenchProp(hand){const g=pivot(hand,0,-.04,-.01);box(g,steel,0,-.05,0,.018,.13,.012);box(g,steel,0,-.12,0,.045,.025,.015);return g}
 function detectorProp(hand){const g=pivot(hand,0,-.03,-.03);box(g,mat(0xe0b52a,.5),0,0,0,.06,.11,.035);const led=box(g,new T.MeshStandardMaterial({color:0x4cff7a,emissive:0x2bff66,emissiveIntensity:1.5}),0,.035,-.019,.035,.02,.004);rod(g,dark,0,.08,0,.006,.06);return {g,led}}
 function extinguisherProp(hand){const g=pivot(hand,0,-.06,-.02);const red=mat(0xc8291f,.35,.3);rod(g,red,0,-.05,0,.045,.2);rod(g,dark,0,.07,0,.02,.04);box(g,dark,.03,.09,0,.06,.012,.02);const hose=rod(g,dark,0,.06,-.07,.008,.14);hose.rotation.x=1.2;rod(g,dark,0,.03,-.14,.014,.04).rotation.x=Math.PI/2;return g}
 // Egrek: long aluminium harvesting pole with a curved sickle at the tip.
 function poleTool(parent){const g=pivot(parent,.03,.24,-.1),shaft=pivot(g,0,0,0);const h=rod(shaft,mat(0xc9d0d4,.35,.7),0,0,-1.35,.016,2.7);h.rotation.x=Math.PI/2;
  const blade=box(shaft,steel,0,-.04,-2.72,.012,.14,.03);blade.rotation.x=.5;const hook=box(shaft,steel,0,-.1,-2.64,.012,.03,.12);hook.rotation.x=-.3;return {g,shaft}}
 function rodTool(parent){const g=pivot(parent,.06,.2,-.1),shaft=pivot(g,0,0,0);const h=part(shaft,new T.CylinderGeometry(.004,.012,1.5,6),mat(0x2b2b2b,.4,.2),0,0,-.75,1,1,1);h.rotation.x=Math.PI/2;
  box(shaft,mat(0x9aa3a0,.4,.6),0,-.03,-.12,.03,.03,.04);const tip=pivot(shaft,0,0,-1.5);return {g,shaft,tip}}
 function ffbProp(parent){const g=pivot(parent,0,.06,-.2);const red=mat(0xb8411f,.7),dk=mat(0x2a1512,.7);for(let k=0;k<14;k++){const a=k*2.4,r=.05+.02*(k%3);oval(g,k%3?red:dk,Math.cos(a)*r,(k%4)*.025-.03,Math.sin(a)*r,.028,.028,.028)}return g}
 function penProp(hand){const g=pivot(hand,0,-.02,-.02);rod(g,navy,0,0,0,.006,.08).rotation.x=.6;return g}
 function probeProp(hand){const g=pivot(hand,0,-.03,-.02);box(g,mat(0x31363a),0,0,0,.05,.09,.03);rod(g,steel,0,-.09,0,.006,.12);return g}

 /* ---------- worker rig ---------- */
 function worker(spec,index){
  // Body parts use their own solid colours (scene materials may keep colour in a texture).
  const dark=kitDark;
  const g=pivot(scene,0,.1,0),pelvis=pivot(g,0,.48,0),torso=pivot(pelvis,0,0,0),legs=[],arms=[],hands=[];
  const vest=mat(KIT_VEST[spec.kit]??vests[index%vests.length],.88);vest.map=textile;
  oval(torso,vest,0,.18,0,.149,.218,.092);
  box(torso,navy,0,.262,-.093,.008,.104,.009);box(torso,stripe,-.075,.276,-.083,.052,.029,.01);
  for(const y of [.13,.19])oval(torso,stripe,0,y,0,.15,.018,.095);
  box(torso,dark,.08,.26,-.087,.047,.066,.025);box(torso,dark,-.09,.05,-.08,.03,.05,.02);
  box(pelvis,navy,0,-.01,0,.242,.09,.15);box(pelvis,dark,0,.03,0,.25,.025,.155);
  const head=pivot(torso,0,.36,0),face=mat(spec.skin),hat=mat(spec.helmet,.45);
  oval(head,face,0,.087,0,.093,.129,.093);oval(head,hat,0,.17,0,.108,.083,.106);oval(head,hat,0,.15,-.011,.122,.017,.134);
  box(head,visorMat,0,.103,-.086,.147,.029,.018);
  // Face and PPE detail: nose, ears, brows, helmet ridge, neck, collar, ID badge.
  const noseMat=mat(new T.Color(spec.skin).multiplyScalar(.86).getHex());
  oval(head,noseMat,0,.07,-.09,.014,.022,.018);for(const sx of [-1,1]){oval(head,face,sx*.092,.085,.004,.016,.028,.02);box(head,dark,sx*.033,.124,-.087,.03,.006,.006)}
  box(head,hat,0,.246,0,.022,.02,.19);oval(torso,face,0,.335,0,.045,.05,.045);oval(torso,navy,0,.305,0,.085,.026,.065);box(torso,paper,-.06,.215,-.094,.028,.036,.004);
  for(const s of [-1,1]){
   const hip=pivot(pelvis,s*.069,0,0),knee=pivot(hip,0,-.196,0);
   oval(hip,navy,0,-.097,0,.069,.133,.066);oval(knee,navy,0,-.089,0,.052,.113,.053);
   oval(knee,boots,0,-.171,-.025,.059,.053,.093);box(knee,dark,0,-.222,-.025,.1,.012,.17);oval(knee,stripe,0,-.04,0,.054,.01,.055);legs.push([hip,knee]);
   const shoulder=pivot(torso,s*.143,.31,0),elbow=pivot(shoulder,s*.021,-.145,0);
   oval(shoulder,vest,s*.014,-.064,0,.064,.096,.061);oval(elbow,navy,0,-.054,0,.043,.077,.044);
   oval(shoulder,stripe,s*.014,-.03,0,.067,.012,.063);
   const hand=pivot(elbow,0,-.13,0);oval(hand,glove,0,0,0,.039,.045,.038);oval(hand,cuff,0,.036,0,.043,.02,.042);box(hand,glove,0,-.04,-.012,.032,.028,.022);arms.push([shoulder,elbow]);hands.push(hand);
  }
  const joints=[pelvis,torso,head,...legs.flat(),...arms.flat(),...hands];
  let chest=null;for(const j of joints){const m=mergeJoint(j);if(j===torso)chest=m}
  const eyes=new T.Group();head.add(eyes);for(const sx of [-.034,.034]){const e=new T.Mesh(round,eyeMat);e.position.set(sx,.1,-.097);e.scale.set(.012,.014,.004);eyes.add(e)}
  const mouth=new T.Mesh(round,mouthMat);mouth.position.set(0,.043,-.088);mouth.scale.set(.022,.005,.006);head.add(mouth);let talking=false;
  const blob=blobShadow(.26,.4);blob.position.y=-.005;g.add(blob);
  // Name and task tag floats above the helmet.
  const tagCanvas=document.createElement('canvas');tagCanvas.width=512;tagCanvas.height=128;
  const tagTex=new T.CanvasTexture(tagCanvas);tagTex.colorSpace=T.SRGBColorSpace;
  const tag=new T.Sprite(new T.SpriteMaterial({map:tagTex,depthWrite:false,transparent:true}));tag.position.set(0,1.32,0);tag.scale.set(.95,.238,1);tag.renderOrder=5;g.add(tag);
  let tagText='';
  function setTag(text){if(text===tagText)return;tagText=text;const c=tagCanvas.getContext('2d');c.clearRect(0,0,512,128);
   c.fillStyle='rgba(16,36,33,.86)';c.beginPath();c.roundRect(6,10,500,96,18);c.fill();
   c.fillStyle='#'+(KIT_VEST[spec.kit]??vests[index%vests.length]).toString(16).padStart(6,'0');c.fillRect(6,10,14,96);
   c.fillStyle='#e8f6c4';c.font='bold 34px system-ui,Arial';c.fillText((spec.person?spec.person+' · ':'')+spec.name,34,50);
   c.fillStyle='#cfe1d6';c.font='26px system-ui,Arial';let line=text;while(c.measureText(line).width>456&&line.length>4)line=line.slice(0,-2);if(line!==text)line=line.trimEnd()+'…';c.fillText(line,34,88);
   tagTex.needsUpdate=true}

  const props={},tools={};
  function rest(){
   pelvis.position.set(0,.48,0);pelvis.rotation.set(0,0,0);torso.rotation.set(0,0,0);head.rotation.set(0,0,0);
   for(const [h,k] of legs){h.rotation.set(0,0,0);k.rotation.set(0,0,0)}
   for(const [s,e] of arms){s.rotation.set(0,0,0);e.rotation.set(0,0,0)}
   for(const h of hands)h.rotation.set(0,0,0);
   for(const p of Object.values(props))p.visible=false;
  }
  // Gait driven by distance walked (phase), so boots plant instead of sliding.
  function stride(phase,amount){
   const a=Math.sin(phase)*amount;
   pelvis.position.y=.48-.02*amount*(1-Math.cos(2*phase))*.5;pelvis.rotation.y=.09*a;pelvis.rotation.z=.04*a;
   torso.rotation.y=-.15*a;torso.rotation.z=-.03*a;torso.rotation.x=-.05*amount;head.rotation.y=.1*a;head.rotation.z=.025*a;
   legs.forEach(([h,k],i)=>{const p=phase+(i?Math.PI:0),n=Math.sin(p)*amount;h.rotation.x=n*.5;k.rotation.x=-(.95*Math.max(0,Math.sin(p+1.25))+.06)*amount});
   return a;
  }
  const inward=(i,amt)=>{arms[i][0].rotation.z=i?-amt:amt};
  function show(name){if(props[name])props[name].visible=true}

  // Pose library. τ is seconds into the current job.
  function pose(time,walk,job='',τ=time,extra={}){
   rest();
   const [L,R]=arms;
   body(time,walk,job,τ,extra,L,R);
   settle(time,walk);
  }
  function body(time,walk,job,τ,extra,L,R){
   if(walk>0||job===''){
    const a=stride(extra.phase??time*9,walk);
    L[0].rotation.x=-a*.55;R[0].rotation.x=a*.55;L[1].rotation.x=.22+.25*Math.max(0,a);R[1].rotation.x=.22+.25*Math.max(0,-a);inward(0,.06);inward(1,.06);
    if(walk===0){L[1].rotation.x=R[1].rotation.x=.12;head.rotation.y=.35*Math.sin(time*.37)*Math.max(0,Math.sin(time*.13));pelvis.position.x=.012*Math.sin(time*.45);pelvis.rotation.z=.025*Math.sin(time*.45);torso.rotation.z=-.03*Math.sin(time*.45)}
    if(extra.run&&walk>0){const r=Math.sin(extra.phase??0);stride(extra.phase??0,Math.min(1.35,walk*1.35));torso.rotation.x=-.22;head.rotation.x=.12;
     L[0].rotation.x=-r*.95;R[0].rotation.x=r*.95;L[1].rotation.x=R[1].rotation.x=1.25;inward(0,.12);inward(1,.12)}
    if(extra.landing){pelvis.position.y-=.08*extra.landing;for(const [h,k] of legs){h.rotation.x+=.45*extra.landing;k.rotation.x-=.8*extra.landing}torso.rotation.x-=.15*extra.landing}
    if(extra.carry==='bottle'){show('bottle');R[0].rotation.x=.45;R[1].rotation.x=.75;inward(1,.1)}
    else if(extra.carry==='ffb'){show('ffb');L[0].rotation.x=R[0].rotation.x=.7;L[1].rotation.x=R[1].rotation.x=1.15;inward(0,.3);inward(1,.3)}
    else if(extra.carry){show(extra.carry);R[0].rotation.x=.55;R[1].rotation.x=.85;inward(1,.12)}
    if(extra.tool&&tools[extra.tool]){show(extra.tool);const t=tools[extra.tool];t.g.rotation.set(1.15,0,-.25);t.g.position.set(.12,.33,.02);R[0].rotation.x=-.2;R[0].rotation.z=-1.9;R[1].rotation.x=1.4;if(t.load)t.load.visible=extra.tool==='rake'&&extra.loaded}
    if(extra.push){torso.rotation.x=-.2;L[0].rotation.x=R[0].rotation.x=.55;L[1].rotation.x=R[1].rotation.x=.12;inward(0,.08);inward(1,.08);head.rotation.x=.12}
    return;
   }
   switch(job){
    case 'air':{const up=Math.max(-1,Math.min(1,(extra.vy||0)/3.6));for(const [i,[h,k]] of legs.entries()){h.rotation.x=(i?.15:.7)*(1-.4*up);k.rotation.x=-(i?.5:1.2)*(1-.3*up)}
     L[0].rotation.x=R[0].rotation.x=.4+.6*up;L[0].rotation.z=.6;R[0].rotation.z=-.6;L[1].rotation.x=R[1].rotation.x=.6;torso.rotation.x=-.12;head.rotation.x=.1;if(extra.carry)show(extra.carry);break}
    case 'talk':{const g1=Math.max(0,Math.sin(τ*1.7)),g2=Math.sin(τ*2.3);R[0].rotation.x=.3+.35*g1;R[1].rotation.x=.95+.25*g2;inward(1,.28);L[0].rotation.x=.12+.15*Math.max(0,Math.sin(τ*1.1+2));L[1].rotation.x=.4;
     head.rotation.x=.05*Math.sin(τ*3.1);head.rotation.y=.12*Math.sin(τ*.7);pelvis.rotation.z=.02*Math.sin(τ*.5);break}
    case 'spray':{show('extinguisher');const sw=Math.sin(τ*2.2);R[0].rotation.x=1.15;R[1].rotation.x=.25;R[0].rotation.z=-.1+.25*sw;L[0].rotation.x=.8;L[1].rotation.x=1.1;inward(0,.35);torso.rotation.y=.25*sw;legs[0][0].rotation.x=.3;legs[1][0].rotation.x=-.2;torso.rotation.x=-.1;break}
    case 'rake':{const c=(τ%2.6)/2.6,s=c<.45?ease(c/.45):1-ease((c-.45)/.55);const t=tools.rake;if(!t)break;show('rake');
     torso.rotation.x=-(.22+.24*s);head.rotation.x=.18;legs[0][0].rotation.x=.32;legs[0][1].rotation.x=-.25;legs[1][0].rotation.x=-.18;
     L[0].rotation.x=.95+.45*s;R[0].rotation.x=.75+.45*s;L[1].rotation.x=.55-.35*s;R[1].rotation.x=.75-.35*s;inward(0,.28);inward(1,.18);
     t.g.rotation.set(0,0,0);t.g.position.set(.02,.2,-.12-.18*s);t.shaft.rotation.x=-(.62-.12*s)-.1*Math.sin(c*Math.PI*2);
     t.load.visible=c>.45;break}
    case 'dump':{const s=ease(Math.min(1,τ/.8)),shake=τ>.8&&τ<2.4?Math.sin(τ*26)*.07:0;const t=tools.rake;if(!t)break;show('rake');
     L[0].rotation.x=R[0].rotation.x=.9+.6*s;L[1].rotation.x=R[1].rotation.x=.4;inward(0,.25);inward(1,.2);torso.rotation.x=-.1;
     t.g.rotation.set(0,0,0);t.g.position.set(.02,.24,-.12);t.shaft.rotation.x=-.75+.55*s+shake;t.load.visible=τ<1.4;break}
    case 'valve':{const turn=τ*2.2;show('');
     L[0].rotation.x=1.3+.12*Math.sin(turn);R[0].rotation.x=1.3-.12*Math.sin(turn);L[1].rotation.x=R[1].rotation.x=.45;
     L[0].rotation.z=.25+.1*Math.cos(turn);R[0].rotation.z=-.25+.1*Math.cos(turn);torso.rotation.x=-.08;torso.rotation.y=.05*Math.sin(turn);
     head.rotation.x=-.05;break}
    case 'clipboard':{show('clipboard');show('pen');const look=Math.sin(τ*.9)>0;
     L[0].rotation.x=.75;L[1].rotation.x=1.25;inward(0,.42);
     R[0].rotation.x=.7+.03*Math.sin(τ*12);R[1].rotation.x=1.15+.06*Math.sin(τ*15);inward(1,.36);
     head.rotation.x=look?.22:-.38;head.rotation.y=look?.08*Math.sin(τ):0;break}
    case 'tablet':{show('tablet');const look=Math.sin(τ*.7+1)>.35;
     L[0].rotation.x=.82;L[1].rotation.x=1.05;inward(0,.35);
     R[0].rotation.x=.72;R[1].rotation.x=1.05+.12*Math.max(0,Math.sin(τ*8));inward(1,.4);
     head.rotation.x=look?.18:-.36;if(tools.tablet)tools.tablet.s.material.emissiveIntensity=.6+.4*Math.max(0,Math.sin(τ*3));break}
    case 'dip':{const c=(τ%6)/6;const s=c<.3?ease(c/.3):c<.62?1:1-ease((c-.62)/.38);const t=tools.dipper;if(!t)break;show('dipper');
     torso.rotation.x=-(.12+.25*s);head.rotation.x=.1;legs[0][0].rotation.x=.25;legs[0][1].rotation.x=-.2;
     R[0].rotation.x=.75+.35*s;R[1].rotation.x=.3;L[0].rotation.x=.6+.3*s;L[1].rotation.x=.5;inward(0,.3);inward(1,.05);
     t.shaft.rotation.x=-.25-.75*s+(c>.3&&c<.62?.04*Math.sin(τ*9):0);t.fill.visible=c>.45;break}
    case 'test':{const c=(τ%9)/9;show('bottle');show('probe');torso.rotation.x=-.18;head.rotation.x=-.42;
     L[0].rotation.x=.65;L[1].rotation.x=.75;inward(0,.3);
     if(c<.45){const p=ease(c/.2)-ease((c-.3)/.15);R[0].rotation.x=.75+.35*p;R[1].rotation.x=.75;hands[1].rotation.z=-1.3*p;inward(1,.35)}
     else{R[0].rotation.x=.7;R[1].rotation.x=.95+.05*Math.sin(τ*6);inward(1,.45);head.rotation.y=.15*Math.sin(τ*.8)}
     if(props.probe)props.probe.visible=c>=.45;break}
    case 'kneel':{show('wrench');pelvis.position.y=.31;
     legs[0][0].rotation.x=1.38;legs[0][1].rotation.x=-1.42;legs[1][0].rotation.x=-.05;legs[1][1].rotation.x=-1.52;
     torso.rotation.x=-.28;head.rotation.x=-.22;
     R[0].rotation.x=1.15+.08*Math.sin(τ*2);R[1].rotation.x=.55+.35*Math.max(0,Math.sin(τ*5));inward(1,.18);hands[1].rotation.z=.5*Math.sin(τ*5);
     L[0].rotation.x=.55;L[1].rotation.x=.95;inward(0,.1);break}
    case 'shovel':{const c=(τ%3.2)/3.2,t=tools.shovel;if(!t)break;show('shovel');
     const drive=c<.35?ease(c/.35):1,lift=c<.35?0:c<.65?ease((c-.35)/.3):1,toss=c<.65?0:c<.85?ease((c-.65)/.2):1-ease((c-.85)/.15);
     const dir=spec.toss||1;
     torso.rotation.x=-(.5*drive-.32*lift);torso.rotation.y=dir*.95*toss;pelvis.position.y=.48-.06*drive+.05*lift;
     legs[0][0].rotation.x=.45;legs[0][1].rotation.x=-.55*drive;legs[1][0].rotation.x=-.25;legs[1][1].rotation.x=-.3*drive;
     L[0].rotation.x=.7+.3*drive-.15*lift;R[0].rotation.x=.4+.5*lift;L[1].rotation.x=.4;R[1].rotation.x=.6;inward(0,.3);inward(1,.25);
     t.g.rotation.set(0,0,0);t.shaft.rotation.x=-.95*drive+.55*lift+.25*toss;t.shaft.rotation.z=dir*-.9*toss;
     t.load.visible=c>.33&&c<.8;break}
    case 'detector':{show('detector');const sweep=Math.sin(τ*1.3);
     R[0].rotation.x=1.05+.25*Math.sin(τ*.7);R[1].rotation.x=.35;R[0].rotation.z=-.15+.4*sweep;
     L[0].rotation.x=.2;L[1].rotation.x=.3;torso.rotation.y=-.2*sweep;head.rotation.y=-.35*sweep;head.rotation.x=-.05;
     legs[0][0].rotation.x=.15;if(tools.detector)tools.detector.led.material.emissiveIntensity=Math.sin(τ*9)>0?2:.2;break}
    case 'harvest':{const t=tools.pole;if(!t)break;show('pole');const saw=Math.sin(τ*5),done=τ>5.2;
     torso.rotation.x=.1;head.rotation.x=.5;legs[0][0].rotation.x=.25;legs[1][0].rotation.x=-.2;
     L[0].rotation.x=2.35-(done?.6:0);R[0].rotation.x=2.1-(done?.6:0);L[1].rotation.x=R[1].rotation.x=.45+.12*saw;inward(0,.35);inward(1,.3);
     t.g.rotation.set(0,0,0);t.g.position.set(.03,.3,-.06);t.shaft.rotation.x=(done?.75:1.12)+.05*saw;break}
    case 'gather':{const reach=ease(Math.min(1,τ/.8))-ease((τ-2.2)/.8);torso.rotation.x=-1.05*reach;pelvis.position.y=.48-.12*reach;
     for(const [h,k] of legs){h.rotation.x=.7*reach;k.rotation.x=-.8*reach}L[0].rotation.x=R[0].rotation.x=1.2*reach+.2;L[1].rotation.x=R[1].rotation.x=.25;inward(0,.25);inward(1,.25);head.rotation.x=-.2;
     if(τ>1.4)show('ffb');break}
    case 'load':{const s=ease(τ/1)-ease((τ-1.6)/.8);show(τ<1.3?'ffb':'');L[0].rotation.x=R[0].rotation.x=.8+1.1*s;L[1].rotation.x=R[1].rotation.x=.6-.4*s;inward(0,.25);inward(1,.25);torso.rotation.x=-.2+.2*s;break}
    case 'look':{L[0].rotation.x=2.3;L[1].rotation.x=2.1;inward(0,.55);head.rotation.y=.6*Math.sin(τ*.8);head.rotation.x=.08;R[1].rotation.x=.2;break}
    case 'fish':{const t=tools.rod;if(!t)break;show('rod');const c=(τ%12)/12,cast=c>.72&&c<.86?Math.sin((c-.72)/.14*Math.PI):0;
     pelvis.position.y=.29;legs.forEach(([h,k])=>{h.rotation.x=1.45;k.rotation.x=-1.5});torso.rotation.x=-.12+.15*cast;head.rotation.x=-.1;
     L[0].rotation.x=R[0].rotation.x=.95+.6*cast;L[1].rotation.x=R[1].rotation.x=.55;inward(0,.3);inward(1,.2);
     t.g.rotation.set(0,0,0);t.g.position.set(.06,.2,-.1);t.shaft.rotation.x=.5+.05*Math.sin(τ*1.3)+1.1*cast;break}
    case 'tip':{const s=ease(τ/1.2)-ease((τ-2.4)/1);torso.rotation.x=-.12-.1*s;
     L[0].rotation.x=R[0].rotation.x=.55+.65*s;L[1].rotation.x=R[1].rotation.x=.15;inward(0,.08);inward(1,.08);
     legs[0][0].rotation.x=.3;legs[1][0].rotation.x=-.2;break}
   }
  }
  // Blend from the previous pose so job changes and stops ease in, then add breath and blinks.
  const blendJoints=[pelvis,torso,head,...legs.flat(),...arms.flat(),...hands],memory=blendJoints.map(j=>[j.rotation.x,j.rotation.y,j.rotation.z]);let memY=.48,memX=0,lastTime=null;
  function settle(time,walk){
   const dt=lastTime===null?1:time-lastTime;lastTime=time;const k=dt<0||dt>.5?1:1-Math.exp(-dt*(walk>0?16:9));
   blendJoints.forEach((j,i)=>{const m=memory[i];m[0]+=(j.rotation.x-m[0])*k;m[1]+=(j.rotation.y-m[1])*k;m[2]+=(j.rotation.z-m[2])*k;j.rotation.set(m[0],m[1],m[2])});
   memY+=(pelvis.position.y-memY)*k;memX+=(pelvis.position.x-memX)*k;pelvis.position.y=memY;pelvis.position.x=memX;
   const b=Math.sin(time*1.9+index);if(chest)chest.scale.set(1+.012*b,1+.006*b,1+.018*b);
   const blink=((time+index*1.3)%3.9)<.13;eyes.scale.y=blink?.12:1;
   mouth.scale.y=talking?.004+.014*Math.abs(Math.sin(time*17)*Math.sin(time*5.3+index)):.005;
  }
  const actor={g,pose,arms,hands,torso,head,setTag,tag,tools,props,spec,heading:0,lookYaw:0,talkingNow:false,talk(on){talking=on;this.talkingNow=on}};
  return actor;
 }

 // Build the crew and their personal kit.
 const roles=layout.roles.map((spec,i)=>{
  spec.person=KIT_PEOPLE[spec.kit]||PEOPLE[i];
  const actor=worker(spec,i),{props,tools,hands,torso}=actor;
  const kit=spec.kit;
  if(kit==='operator'){tools.rake=rakeTool(torso);props.rake=tools.rake.g;props.clipboard=clipboardProp(hands[0]);props.pen=penProp(hands[1]);props.walkie=box(torso,dark,.09,.32,-.09,.03,.07,.02)}
  if(kit==='sampler'){tools.dipper=dipperTool(torso);props.dipper=tools.dipper.g;props.bottle=bottleProp(hands[1]);props.clipboard=clipboardProp(hands[0]);props.pen=penProp(hands[1]);props.probe=probeProp(hands[1])}
  if(kit==='tech'){tools.tablet=tabletProp(hands[0]);props.tablet=tools.tablet.g;props.wrench=wrenchProp(hands[1])}
  if(kit==='handler'){tools.shovel=shovelTool(torso);props.shovel=tools.shovel.g}
  if(kit==='officer'){tools.detector=detectorProp(hands[1]);props.detector=tools.detector.g;props.clipboard=clipboardProp(hands[0]);props.pen=penProp(hands[1])}
  if(kit==='guard'){props.clipboard=clipboardProp(hands[0]);props.pen=penProp(hands[1]);props.walkie=box(torso,dark,.09,.32,-.09,.03,.07,.02)}
  if(kit==='harvester'){tools.pole=poleTool(torso);props.pole=tools.pole.g;props.ffb=ffbProp(torso)}
  if(kit==='angler'){tools.rod=rodTool(torso);props.rod=tools.rod.g}
  const plan=compile(spec);actor.heading=plan.steps[0].h1??0;
  return {name:spec.name,person:spec.person,actor,spec,...plan,offset:i*3.7,phase0:i*3.7,hold:null,state:{job:'',label:'',τ:0}};
 });
 const player=roles[0].actor;

 /* ---------- shared world props: skip, valve wheel, stile, barrow, compost heap ---------- */
 const skip=new T.Group();skip.position.set(layout.skip[0],Y0-.02,layout.skip[1]);scene.add(skip);
 box(skip,mat(0x2f6b5a,.6,.3),0,.2,0,.62,.4,.44);box(skip,dark,0,.41,0,.66,.03,.48);
 const skipFill=box(skip,screenings,0,.38,0,.56,.06,.38);for(let k=0;k<7;k++)oval(skip,screenings,-.22+k*.075,.43,(k%3-1)*.1,.05,.035,.04);
 const valve=new T.Group();valve.position.set(...layout.valve);scene.add(valve);
 rod(valve,steel,0,-.17,0,.035,.34);box(valve,dark,0,-.36,0,.12,.1,.12);
 const wheel=new T.Group();wheel.position.y=.02;valve.add(wheel);
 const rim=new T.Mesh(new T.TorusGeometry(.13,.014,8,28),mat(0xb8382c,.5,.2));rim.castShadow=true;wheel.add(rim);
 for(let k=0;k<3;k++){const sp=box(wheel,mat(0xb8382c,.5,.2),0,0,0,.25,.016,.016);sp.rotation.z=k*Math.PI/3}
 rod(wheel,steel,0,0,0,.02,.05).rotation.x=Math.PI/2;
 if(layout.stile){const [sx,sz]=layout.stile,stile=new T.Group();stile.position.set(sx,.09,sz);scene.add(stile);
  box(stile,mat(0x9aa7a0,.4,.6),0,.19,0,.42,.035,.46);for(const dz of [-.37,.37])box(stile,mat(0x9aa7a0,.4,.6),0,.09,dz,.42,.03,.2);
  for(const dx of [-.2,.2]){for(const dz of [-.18,.18])box(stile,steel,dx,.095,dz,.03,.2,.03);box(stile,brass,dx,.48,0,.025,.025,.5);for(const dz of [-.22,.22])box(stile,brass,dx,.34,dz,.025,.3,.025)}}
 const heap=new T.Group();heap.position.set(layout.heap[0],Y0-.02,layout.heap[1]);scene.add(heap);
 for(let k=0;k<9;k++){const a=k*2.3,r=k?.18+.06*(k%3):0;oval(heap,cake,Math.cos(a)*r,.06+(k?0:.08),Math.sin(a)*r,.24-r*.4,.13+(k?0:.05),.22-r*.3)}
 for(let k=0;k<3;k++)oval(heap,leaf,-.2+k*.18,.05,.28,.06,.03,.05);
 const barrow=new T.Group();scene.add(barrow);
 const axle=pivot(barrow,0,.14,-.33),tray=pivot(axle,0,-.14,.33),barrowPaint=mat(0x4f8db0,.5,.4);
 box(tray,barrowPaint,0,.34,0,.42,.04,.52);for(const s of [-1,1]){const side=box(tray,barrowPaint,s*.22,.42,0,.03,.17,.52);side.rotation.z=s*.25}
 box(tray,barrowPaint,0,.42,-.27,.44,.17,.03);box(tray,barrowPaint,0,.42,.27,.44,.17,.03);
 for(const s of [-1,1]){rod(tray,steel,s*.17,.34,.45,.014,.6).rotation.x=Math.PI/2;rod(tray,steel,s*.15,.2,.22,.012,.3)}
 const tyre=new T.Mesh(new T.TorusGeometry(.11,.035,8,18),rubber);tyre.rotation.y=Math.PI/2;tyre.position.set(0,.14,-.33);tyre.castShadow=true;tray.add(tyre);
 const barrowLoad=oval(tray,cake,0,.4,0,.17,.08,.22);
 tray.traverse(o=>{if(o.isMesh)o.castShadow=false});const barrowBlob=blobShadow(.42,.32);barrowBlob.position.set(0,.006,0);barrow.add(barrowBlob);
 let barrowPos=new T.Vector3(layout.barrow[0],Y0-.02,layout.barrow[1]),barrowHeading=0;

 /* ---------- instanced backdrop: fence, shed, pipe rack, palms, bench, dial ---------- */
 const batches=new Map();
 function repeat(geo,m,x,y,z,w,h,d,rx=0,ry=0,rz=0){
  const key=geo.uuid+m.uuid;if(!batches.has(key))batches.set(key,{geo,m,list:[]});
  const o=new T.Object3D();o.position.set(x,y,z);o.scale.set(w,h,d);o.rotation.set(rx,ry,rz);o.updateMatrix();batches.get(key).list.push(o.matrix);
 }
 const po=new T.Object3D();
 if(layout.backdrop!==false){
 for(let i=-10;i<=10;i++){repeat(cube,steel,i,-.03+.66,-4.6,.048,1.4,.048);if(i<10)for(const y of [.35,.9])repeat(cube,steel,i+.5,y,-4.6,1,.03,.035)}
 for(let i=0;i<6;i++){repeat(cube,brass,-5.7+i*2.2,.112,2.91,.9,.011,.055)}
 box(scene,base,-6,.8,-7,4.6,1.9,2.35);for(let i=0;i<45;i++)repeat(cube,roof,-8.24+i*.102,.9,-5.81,.039,1.94,.04);
 for(const side of [-1,1])repeat(cube,steel,-6,2.03,-7+side*.64,4.94,.095,1.4,-side*.19);
 for(let i=0;i<4;i++){repeat(cube,dark,-7.55+i*.88,1.25,-5.77,.54,.46,.08);for(let k=0;k<5;k++)repeat(cube,steel,-7.55+i*.88,1.08+k*.076,-5.72,.51,.019,.035)}
 for(const z of [-5.9,-6.48]){repeat(cube,steel,1.52,.53,z,.09,1.1,.09);repeat(cube,steel,4.18,.53,z,.09,1.1,.09);repeat(cube,brass,2.85,.71,z,2.83,.055,.065)}
 for(let k=0;k<5;k++)repeat(tube,steel,2.85,.84,-5.88-k*.145,.07,3.4,.07,0,0,Math.PI/2);
 // Background oil palms (instanced, sway in the wind).
 const backPalms=new T.InstancedMesh(oilPalm({fronds:16,leaflets:9,height:2.9,seed:31,bunches:1,lod:1}),palmMaterial(.012),22);
 for(let i=0;i<22;i++){const x=-18+(i%11)*3.5,z=-11-Math.floor(i/11)*5-Math.sin(i*3)*1.3,h=2.8+.48*Math.sin(i*5.2);po.position.set(x,layout.harvest?.y??0,z);po.rotation.set(0,i*1.7,0);po.scale.setScalar(h/2.9);po.updateMatrix();backPalms.setMatrixAt(i,po.matrix)}
 backPalms.castShadow=true;backPalms.receiveShadow=true;backPalms.userData.info='palm';scene.add(backPalms);
 }
 /* ---------- harvest block: palms with ripe bunches, collection pile ---------- */
 const harvest=layout.harvest,harvestState=[];
 if(harvest){const hp=new T.InstancedMesh(oilPalm({fronds:24,leaflets:15,height:2.6,seed:61,bunches:2,lod:1}),palmMaterial(.02),harvest.palms.length);hp.userData.info='palm';
  harvest.palms.forEach(([x,z],k)=>{po.position.set(x,harvest.y,z);po.rotation.set(0,k*2.1,0);po.scale.setScalar(1);po.updateMatrix();hp.setMatrixAt(k,po.matrix)});hp.castShadow=hp.receiveShadow=true;scene.add(hp);
  const red=mat(0xc4461f,.7),dk=mat(0x2a1512,.7);
  harvest.palms.forEach(([x,z],k)=>{const g=new T.Group();for(let j=0;j<16;j++){const a=j*2.4,r=.07+.03*(j%3);oval(g,j%3?red:dk,Math.cos(a)*r,(j%5)*.03-.05,Math.sin(a)*r,.036,.036,.036)}scene.add(g);harvestState.push({g,x,z,crown:harvest.y+2.25})});
  const pile=new T.Group();pile.position.set(harvest.pile[0],harvest.y,harvest.pile[1]);scene.add(pile);pile.userData.info='ffb pile';
  for(let j=0;j<10;j++){const b=new T.Group();for(let q=0;q<9;q++){const a=q*2.4;oval(b,q%3?red:dk,Math.cos(a)*.06,(q%3)*.03,Math.sin(a)*.06,.034,.034,.034)}b.position.set((j%4-1.5)*.17,.05+Math.floor(j/4)*.09,(Math.floor(j/2)%2-.5)*.16);pile.add(b)}
  harvest.pileGroup=pile;box(pile,mat(0x3a4a3a,.8),0,.01,0,.9,.02,.6);
  // Where each bunch hangs (on the path side of the crown) and where it lands when cut.
  const hr=roles[harvest.worker];harvestState.forEach(h=>{const k=hr.steps.findIndex(s=>s.job==='harvest'&&s.face&&Math.hypot(s.face[0]-h.x,s.face[1]-h.z)<.01);h.hs=k;
   const sx=k>=0?hr.steps[k].at[0]:h.x+1,sz=k>=0?hr.steps[k].at[1]:h.z,d=Math.hypot(sx-h.x,sz-h.z)||1;h.cx=h.x+(sx-h.x)/d*.24;h.cz=h.z+(sz-h.z)/d*.24;h.gx=h.x+(sx-h.x)*.55;h.gz=h.z+(sz-h.z)*.55})}
 const fishing=layout.fishing;let line=null,bobber=null,fish=null;
 if(fishing){for(const [x,z] of fishing.spots){box(scene,wood,x,Y0,z+.05,.2,.18,.18);rod(scene,mat(0x3f6fa0,.5),x+.25,.07,z,.06,.14)}
  line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:0xe8e8e0,transparent:true,opacity:.7}));scene.add(line);
  bobber=new T.Group();oval(bobber,mat(0xd83a2a,.4),0,.015,0,.022,.022,.022);oval(bobber,mat(0xf4f1e6,.4),0,-.005,0,.02,.016,.02);scene.add(bobber);
  fish=new T.Group();oval(fish,mat(0xa9b8b8,.3,.6),0,0,0,.08,.03,.025);fish.visible=false;scene.add(fish)}
 // Sampling bench with capped vials, a pH meter with a live display and a wash bottle.
 const [bx,bz]=layout.bench;
 repeat(cube,steel,bx,.58,bz,.82,.055,.47);
 for(const dx of [-.32,.32])for(const dz of [-.16,.16])repeat(cube,dark,bx+dx,.31,bz+dz,.045,.54,.045);
 for(let k=0;k<4;k++){repeat(round,stripe,bx-.26+k*.10,.66,bz,.036,.08,.036);repeat(cube,navy,bx-.26+k*.1,.74,bz,.042,.025,.042)}
 box(scene,mat(0x31363a,.5),bx+.2,.66,bz-.05,.16,.1,.12);
 const meterCanvas=document.createElement('canvas');meterCanvas.width=128;meterCanvas.height=64;const meterTex=new T.CanvasTexture(meterCanvas);meterTex.colorSpace=T.SRGBColorSpace;
 const meterFace=part(scene,new T.PlaneGeometry(.13,.065),new T.MeshStandardMaterial({map:meterTex,emissive:0xffffff,emissiveMap:meterTex,emissiveIntensity:.7}),bx+.2,.672,bz+.012,1,1,1);meterFace.castShadow=false;
 let meterText='';function meter(text){if(text===meterText)return;meterText=text;const c=meterCanvas.getContext('2d');c.fillStyle='#16302a';c.fillRect(0,0,128,64);c.fillStyle='#9ff5b8';c.font='bold 30px monospace';c.textAlign='center';c.fillText(text,64,44);meterTex.needsUpdate=true}
 meter('--.-');
 rod(scene,mat(0xe8eef0,.3),bx+.3,.67,bz+.12,.03,.12);
 const c=document.createElement('canvas');c.width=256;c.height=256;const ctx=c.getContext('2d');
 const dialTex=new T.CanvasTexture(c);dialTex.colorSpace=T.SRGBColorSpace;
 function drawDial(v){ctx.fillStyle='#dedcc8';ctx.fillRect(0,0,256,256);ctx.strokeStyle='#33403d';ctx.lineWidth=4;
  for(let k=0;k<=20;k++){const a=2.5+k*.223;ctx.beginPath();ctx.moveTo(128+Math.cos(a)*78,128+Math.sin(a)*78);ctx.lineTo(128+Math.cos(a)*91,128+Math.sin(a)*91);ctx.stroke()}
  const a=2.5+v*4.46;ctx.strokeStyle='#a7412e';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(128,128);ctx.lineTo(128+Math.cos(a)*70,128+Math.sin(a)*70);ctx.stroke();
  ctx.fillStyle='#33403d';ctx.font='bold 24px sans-serif';ctx.textAlign='center';ctx.fillText('FLOW m³/h',128,182);dialTex.needsUpdate=true}
 drawDial(.62);
 const [ix,iz]=layout.dial;
 repeat(cube,steel,ix,.48,iz,.055,.82,.055);repeat(cube,dark,ix,.92,iz,.31,.33,.085);
 part(scene,new T.PlaneGeometry(.28,.28),new T.MeshStandardMaterial({map:dialTex}),ix,.92,iz+.047,1,1,1);
 for(const {geo,m,list} of batches.values()){const o=new T.InstancedMesh(geo,m,list.length);list.forEach((matrix,i)=>o.setMatrixAt(i,matrix));o.castShadow=o.receiveShadow=true;scene.add(o)}

 /* ---------- shift scheduler ---------- */
 let controlled=null,tagsOn=true,lastDial=-1,playerPos=null,valveSpin=0,lastAnim=null,riverClean=()=>true;const events=[],memo={};const tipW=new T.Vector3();
 function pointAt(step,d){let seg=step.segs[0];for(const s of step.segs)if(d>=s.from)seg=s;const f=seg.l?Math.min(1,(d-seg.from)/seg.l):1;return [seg.a[0]+(seg.b[0]-seg.a[0])*f,seg.a[1]+(seg.b[1]-seg.a[1])*f,seg.a[2]+(seg.b[2]-seg.a[2])*f]}
 function locate(r,t){
  const local=((t+r.offset)%r.total+r.total)%r.total;
  let step=r.steps[0];for(const s of r.steps)if(local>=s.start)step=s;
  return {step,τ:local-step.start};
 }
 function animate(t){
  const gdt=lastAnim===null?0:Math.max(0,Math.min(.2,t-lastAnim));lastAnim=t;
  for(const r of roles){
   let {step,τ}=locate(r,t);const a=r.actor;
   if(a===controlled){r.state.job=step.kind==='do'?step.job:'walk';r.state.label=step.label;r.state.τ=τ;r.state.step=step;a.tag.visible=false;continue}
   const dt=a.lastT===undefined?1:t-a.lastT;a.lastT=t;const k=dt<0||dt>.5?1:1-Math.exp(-dt*7);
   // Awareness of the player: wait if they block the path, stop to talk, glance at them.
   let blocked=false,near=Infinity;
   if(playerPos){near=Math.hypot(playerPos.x-a.g.position.x,playerPos.z-a.g.position.z);
    if(step.kind==='go'){const d=walkDistance(step,τ),ahead=pointAt(step,Math.min(step.len,d+.45));blocked=Math.hypot(playerPos.x-ahead[0],playerPos.z-ahead[1])<.5||near<.42}}
   if(r.hold||blocked){
    r.offset-=gdt;({step,τ}=locate(r,t));
    if(blocked&&!r.blockedSaid){r.blockedSaid=true;events.push({type:'blocked',i:roles.indexOf(r)})}
    const want=playerPos&&(r.hold||near<1.6)?faceTo([a.g.position.x,a.g.position.z],[playerPos.x,playerPos.z]):a.heading;
    a.heading+=wrapAngle(want-a.heading)*(1-Math.exp(-Math.max(0,dt)*5));a.g.rotation.y=a.heading;
    r.state.job=step.kind==='do'?step.job:'walk';r.state.label=r.hold==='talk'?'Talking with you':'Waiting for you to pass';r.state.τ=τ;r.state.step=step;
    a.tag.visible=tagsOn;a.setTag(r.state.label);
    a.pose(t+r.phase0,0,r.hold==='talk'&&a.talkingNow?'talk':'',t,{});continue;
   }
   if(!blocked)r.blockedSaid=false;
   r.state.job=step.kind==='do'?step.job:'walk';r.state.label=step.label;r.state.τ=τ;r.state.step=step;
   a.tag.visible=tagsOn;a.setTag(step.label);
   if(step.kind==='go'){
    const d=walkDistance(step,τ),p=pointAt(step,d),ahead=pointAt(step,Math.min(step.len,d+.35)),speed=walkSpeed(step,τ);
    a.g.position.set(p[0],Y0+p[2],p[1]);
    const want=Math.hypot(ahead[0]-p[0],ahead[1]-p[1])>.02?faceTo(p,ahead):faceTo(step.segs.at(-1).a,step.segs.at(-1).b);
    a.heading+=wrapAngle(want-a.heading)*k;a.g.rotation.y=a.heading;
    a.pose(t+r.phase0,.25+.75*speed,'',τ,{...step.opts,phase:d/STRIDE*Math.PI*2,loaded:step.opts.tool==='rake'&&step===r.steps[1]});
   }else{
    a.g.position.set(step.at[0],Y0+(step.at[2]||0),step.at[1]);
    const turn=wrapAngle(step.h1-a.heading);a.heading+=turn*(dt<0||dt>.5?1:1-Math.exp(-dt*4.5));a.g.rotation.y=a.heading;
    // Small shuffling steps while turning on the spot, then the job pose.
    if(Math.abs(turn)>.16){a.turnPhase=(a.turnPhase||0)+Math.abs(turn)*Math.max(0,dt)*9;a.pose(t+r.phase0,Math.min(.45,Math.abs(turn)),'',τ,{phase:a.turnPhase})}
    else a.pose(t+r.phase0,0,step.job,τ);
   }
   // Glance at the player when they are close.
   const look=playerPos&&near<2.6?Math.max(-1.1,Math.min(1.1,wrapAngle(faceTo([a.g.position.x,a.g.position.z],[playerPos.x,playerPos.z])-a.heading))):0;
   a.lookYaw+=(look*(step.kind==='do'?.55:.8)-a.lookYaw)*(1-Math.exp(-Math.max(0,dt)*4));a.head.rotation.y+=a.lookYaw;
  }
  // Harvest: bunches fall when cut, are gathered and carried to the pile.
  if(harvest){const r=roles[harvest.worker],si=r.steps.indexOf(r.state.step),τh=r.state.τ,loop=Math.floor((t+r.offset)/r.total);
   harvestState.forEach((h,p)=>{let x=h.cx,z=h.cz,y=h.crown,vis=true;const hs=h.hs;
    if(hs>=0){
     if(si===hs){if(τh>1.5&&memo['chop'+p]!==loop){memo['chop'+p]=loop;events.push({type:'chop',x:h.x,z:h.z})}
      if(τh>=5){const f=Math.min(1,(τh-5)/.55);x=h.cx+(h.gx-h.cx)*f;z=h.cz+(h.gz-h.cz)*f;y=h.crown+(harvest.y+.06-h.crown)*f*f;if(f>=1&&memo['thud'+p]!==loop){memo['thud'+p]=loop;events.push({type:'thud',x:h.gx,z:h.gz})}}}
     else if(si===hs+1){x=h.gx;z=h.gz;y=harvest.y+.06;vis=τh<1.4}
     else if(si>hs+1)vis=false}
    h.g.visible=vis;h.g.position.set(x,y,z)});
   const loads=r.steps.filter((s,k)=>s.job==='load'&&(k<si||(k===si&&τh>1.3))).length;harvest.pileGroup.children.forEach((b,j)=>{if(j<10)b.visible=j<6+loads*3})}
  // Angler: line to the bobber, a catch only when the river is clean.
  if(fishing){const r=roles[fishing.worker],a=r.actor,st=r.state,fishing_=st.job==='fish'&&a!==controlled;line.visible=bobber.visible=fishing_;fish.visible=false;
   if(fishing_){const c=(st.τ%12)/12,h=a.heading,bx=a.g.position.x-Math.sin(h)*1.35,bz=a.g.position.z-Math.cos(h)*1.35;a.tools.rod?.tip.getWorldPosition(tipW);
    const cast=c>.72&&c<.86;bobber.position.set(bx,.1+.008*Math.sin(t*3),bz);bobber.visible=!cast;
    const lp=line.geometry.attributes.position;lp.setXYZ(0,tipW.x,tipW.y,tipW.z);lp.setXYZ(1,cast?tipW.x:bx,cast?tipW.y-.4:.11,cast?tipW.z:bz);lp.needsUpdate=true;
    const loop=Math.floor(st.τ/12);if(c>.86&&c<.9&&memo.splash!==loop+'_'+st.step.start){memo.splash=loop+'_'+st.step.start;events.push({type:'splash',x:bx,z:bz})}
    if(riverClean()&&c>.5&&c<.68&&loop%2===0){const f=(c-.5)/.18;fish.visible=true;fish.position.set(bx+(tipW.x-bx)*f,.1+(tipW.y-.35-.1)*Math.sin(f*Math.PI*.5),bz+(tipW.z-bz)*f);fish.rotation.z=Math.sin(t*20)*.6;if(memo.catch!==loop+'_'+st.step.start){memo.catch=loop+'_'+st.step.start;events.push({type:'catch',x:bx,z:bz})}}}}
  // Valve wheel spins while the operator turns it.
  const op=roles[0].state;wheel.rotation.z=(op.job==='valve'&&!roles[0].hold?-op.τ*2.2:0)-valveSpin;
  // Skip fills a little each time screenings are tipped.
  skipFill.scale.y=.06+.05*((t/40)%1);
  // Field meter cycles through readings while the sampler tests.
  const sm=roles[1].state;
  if(sm.job==='test'){const c=(sm.τ%9)/9;meter(c<.45?'pH 7.4':c<.7?'DO 2.1':'COD 96')}else if(sm.job!=='clipboard')meter('--.-');
  // The flow dial needle trembles with the pumped flow.
  const dv=.6+.04*Math.sin(t*1.3)+.015*Math.sin(t*7.1);if(Math.abs(dv-lastDial)>.004){lastDial=dv;drawDial(dv)}
  // Wheelbarrow travels in front of the sludge handler while pushed, otherwise stays parked.
  const sh=roles[3],ss=sh.state;
  if(sh.actor!==controlled&&(ss.job==='walk'&&ss.step.opts.push||ss.job==='tip')){
   const h=sh.actor.heading;barrowHeading=h;
   barrowPos.set(sh.actor.g.position.x-Math.sin(h)*.62,.09,sh.actor.g.position.z-Math.cos(h)*.62);
  }
  barrow.position.copy(barrowPos);barrow.rotation.y=barrowHeading;
  const pushing=ss.job==='walk';axle.rotation.x=ss.job==='tip'?-.9*(ease(ss.τ/1.2)-ease((ss.τ-2.4)/1)):pushing?-.14:0;
  if(pushing)tyre.rotation.x=-walkDistance(ss.step,ss.τ)/.11;
  const fill=ss.job==='shovel'?Math.min(1,ss.τ/ss.step.dur):ss.job==='tip'?Math.max(0,1-ss.τ/1.8):(ss.step===sh.steps[1]?1:0);
  barrowLoad.visible=fill>.05;barrowLoad.scale.set(.17,.03+.09*fill,.22);barrowLoad.position.y=.36+.05*fill;
 }
 animate(0);
 return {
  roles,animate,
  control(actor){if(controlled)controlled.tag.visible=tagsOn;controlled=actor},
  activity(i){return roles[i]?.state},
  setPlayer(p){playerPos=p},
  hold(i,mode){const r=roles[i];if(r)r.hold=mode||null},
  turnValve(dt){valveSpin+=dt*2.6},
  valvePosition:new T.Vector3(...layout.valve),
  takeEvents(){return events.splice(0)},
  emit(e){events.push(e)},
  setRiverHealth(fn){riverClean=fn},
  // Give any worker a tool or hand prop (used when the player picks something up).
  equip(actor,name){const {tools,props,hands,torso}=actor;if(props[name])return props[name];
   if(name==='rake'){tools.rake=rakeTool(torso);props.rake=tools.rake.g}
   else if(name==='dipper'){tools.dipper=dipperTool(torso);props.dipper=tools.dipper.g}
   else if(name==='shovel'){tools.shovel=shovelTool(torso);props.shovel=tools.shovel.g}
   else if(name==='detector'){tools.detector=detectorProp(hands[1]);props.detector=tools.detector.g}
   else if(name==='bottle')props.bottle=bottleProp(hands[1]);
   else if(name==='probe')props.probe=probeProp(hands[1]);
   else if(name==='extinguisher')props.extinguisher=extinguisherProp(hands[1]);
   else if(name==='pole'){tools.pole=poleTool(torso);props.pole=tools.pole.g}
   else if(name==='ffb')props.ffb=ffbProp(torso);
   if(props[name])props[name].visible=false;return props[name]},
  status(){return roles.map(r=>({name:r.name,label:r.actor===controlled?'Controlled by you':r.state.label,job:r.state.job}))},
  tags(on){tagsOn=on;for(const r of roles)r.actor.tag.visible=on&&r.actor!==controlled}
 };
}
