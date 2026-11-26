/*
 Rendering quality tiers. "auto" picks a tier from the device, then the frame budget
 can step down at run time if the frame rate stays low. The choice is remembered.
*/
export const TIERS={
 high:{label:'High',ratio:1.6,shadows:true,shadowSize:2048,molecules:1,detail:1,scenery:1,texture:1024},
 balanced:{label:'Balanced',ratio:1.2,shadows:true,shadowSize:1024,molecules:.65,detail:.7,scenery:.65,texture:512},
 lite:{label:'Lite',ratio:.9,shadows:false,shadowSize:512,molecules:.4,detail:.45,scenery:.35,texture:256}
};
const KEY='pome-quality';
export function savedChoice(){try{return localStorage.getItem(KEY)||'auto'}catch{return 'auto'}}
export function saveChoice(v){try{localStorage.setItem(KEY,v)}catch{}}
export function autoTier(){
 const mem=navigator.deviceMemory||8,cores=navigator.hardwareConcurrency||8;
 const coarse=matchMedia('(pointer:coarse)').matches,small=Math.min(screen.width,screen.height)<760;
 const saveData=navigator.connection?.saveData;
 if(saveData||mem<=2||cores<=2)return 'lite';
 if(mem<=4||cores<=4||(coarse&&small))return 'balanced';
 return 'high';
}
export function resolveTier(choice=savedChoice()){return TIERS[choice]?choice:autoTier()}
export const lower=tier=>tier==='high'?'balanced':tier==='balanced'?'lite':null;
