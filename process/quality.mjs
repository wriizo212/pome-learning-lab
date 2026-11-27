/*
 Rendering quality tiers. "auto" picks a tier from the device, then the frame budget
 can step down (or back up) at run time. The choice is remembered.
 Every tier renders at the screen's native resolution up to its pixel budget
 (balanced = Full HD), so lighter tiers trade effects, never sharpness.
*/
export const TIERS={
 high:{label:'High',ratio:1.6,pixels:2560*1440,shadows:true,shadowSize:2048,molecules:1,detail:1,scenery:1,texture:1024},
 balanced:{label:'Balanced',ratio:1.25,pixels:1920*1080,shadows:true,shadowSize:1024,cheapShadows:true,molecules:.65,detail:.7,scenery:.65,texture:512},
 lite:{label:'Lite',ratio:1,pixels:1600*900,shadows:true,shadowSize:512,cheapShadows:true,molecules:.4,detail:.45,scenery:.35,texture:256}
};
const KEY='pome-quality';
export function savedChoice(){try{return localStorage.getItem(KEY)||'auto'}catch{return 'auto'}}
export function saveChoice(v){try{localStorage.setItem(KEY,v)}catch{}}
// Integrated and mobile GPUs share memory bandwidth with the CPU, so they start one tier lower.
let gpuName;
export function gpu(){if(gpuName!==undefined)return gpuName;try{const gl=document.createElement('canvas').getContext('webgl2')||document.createElement('canvas').getContext('webgl');const ext=gl?.getExtension('WEBGL_debug_renderer_info');gpuName=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):(gl?.getParameter(gl.RENDERER)||'');gl?.getExtension('WEBGL_lose_context')?.loseContext()}catch{gpuName=''}return gpuName}
const INTEGRATED=/Intel(?!.*Arc)|UHD|Iris|Radeon\(TM\)\s*(Graphics|[0-9]{3}M)|Radeon (Vega|Graphics)|Vega [0-9]|Mali|Adreno|PowerVR|SwiftShader|llvmpipe|Microsoft Basic/i;
export function autoTier(){
 const mem=navigator.deviceMemory||8,cores=navigator.hardwareConcurrency||8,name=gpu(),soft=/SwiftShader|llvmpipe|Microsoft Basic/i.test(name);
 if(soft)return 'lite';
 const coarse=matchMedia('(pointer:coarse)').matches,small=Math.min(screen.width,screen.height)<760;
 const saveData=navigator.connection?.saveData;
 if(saveData||mem<=2||cores<=2)return 'lite';
 if(mem<=4||cores<=4||(coarse&&small)||INTEGRATED.test(name))return 'balanced';
 return 'high';
}
export function resolveTier(choice=savedChoice()){return TIERS[choice]?choice:autoTier()}
export const lower=tier=>tier==='high'?'balanced':tier==='balanced'?'lite':null;
export const higher=tier=>tier==='lite'?'balanced':tier==='balanced'?'high':null;
const RANK={lite:0,balanced:1,high:2};
// In auto mode, step back up after a temporary slowdown, but never above what the device was given.
export function canRaise(current){const up=higher(current);return savedChoice()==='auto'&&up&&RANK[up]<=RANK[autoTier()]?up:null}
