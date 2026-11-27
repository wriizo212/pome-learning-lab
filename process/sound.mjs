/*
 Procedural sound for the plant: everything is synthesised with Web Audio (no files).
 One-shot effects, positional ambient loops (gain and stereo pan follow the listener)
 and NPC voices through the browser's speech synthesis. Nothing plays until enabled
 from a user gesture.
*/
export function createSound(){
 let ctx=null,master=null,enabled=false,noiseBuf=null,scale=1,panAt=0,lx=0,lz=0,lyaw=0;const loops=[];let voices=[];
 function init(){
  if(ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();master=ctx.createGain();master.gain.value=.7;master.connect(ctx.destination);
  noiseBuf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const d=noiseBuf.getChannelData(0);let b=0;for(let i=0;i<d.length;i++){const w=Math.random()*2-1;b=(b+.02*w)/1.02;d[i]=w*.6+b*3}
  for(const l of loops)start(l);
 }
 const now=()=>ctx.currentTime;
 function noise(dur,{type='bandpass',freq=1000,q=1,gain=.3,attack=.005,decay,to,pan=0,rate=1}={}){
  if(!enabled||!ctx)return;const src=ctx.createBufferSource();src.buffer=noiseBuf;src.playbackRate.value=rate;const f=ctx.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;
  if(to)f.frequency.exponentialRampToValueAtTime(to,now()+dur);const g=ctx.createGain(),p=ctx.createStereoPanner();p.pan.value=pan;
  g.gain.setValueAtTime(0,now());g.gain.linearRampToValueAtTime(gain*scale,now()+attack);g.gain.exponentialRampToValueAtTime(.0008,now()+(decay??dur));p.pan.value=Math.max(-1,Math.min(1,pan+panAt));
  src.connect(f).connect(g).connect(p).connect(master);src.start(now(),Math.random()*1.5);src.stop(now()+dur+.05);
 }
 function tone(freq,dur,{type='sine',gain=.2,to,attack=.005,pan=0}={}){
  if(!enabled||!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain(),p=ctx.createStereoPanner();o.type=type;o.frequency.setValueAtTime(freq,now());if(to)o.frequency.exponentialRampToValueAtTime(to,now()+dur);
  p.pan.value=Math.max(-1,Math.min(1,pan+panAt));g.gain.setValueAtTime(0,now());g.gain.linearRampToValueAtTime(gain*scale,now()+attack);g.gain.exponentialRampToValueAtTime(.0008,now()+dur);o.connect(g).connect(p).connect(master);o.start();o.stop(now()+dur+.05);
 }
 const fx={
  step(surface='gravel',run=false){const v=run?1.4:1;if(surface==='grass')noise(.12,{freq:900,q:.7,gain:.09*v,decay:.1});else if(surface==='metal'){tone(240+Math.random()*40,.12,{type:'triangle',gain:.06*v});noise(.08,{freq:3000,q:2,gain:.05*v})}else{noise(.14,{freq:1500+Math.random()*700,q:.9,gain:.14*v,decay:.12});noise(.06,{freq:4200,q:1.5,gain:.05*v})}},
  jump(){noise(.18,{freq:600,q:.6,gain:.1})},
  land(power=1){noise(.22,{type:'lowpass',freq:420,gain:.22*Math.min(1.5,power)});noise(.12,{freq:1800,q:.8,gain:.1*power})},
  pickup(){tone(520,.09,{type:'triangle',gain:.12});setTimeout(()=>tone(780,.11,{type:'triangle',gain:.1}),70)},
  drop(){noise(.2,{type:'lowpass',freq:500,gain:.2});tone(150,.14,{type:'triangle',gain:.08})},
  splash(){noise(.6,{freq:900,to:2600,q:.6,gain:.25,decay:.55});setTimeout(()=>noise(.35,{freq:2200,q:1.2,gain:.12}),180)},
  scrape(){noise(.5,{freq:2400,to:1200,q:3,gain:.12,decay:.45});tone(90,.3,{type:'sawtooth',gain:.03})},
  shovel(){noise(.25,{freq:700,q:.8,gain:.22});setTimeout(()=>noise(.3,{type:'lowpass',freq:380,gain:.18}),220)},
  squeak(){tone(900,.35,{type:'sawtooth',gain:.035,to:1250});tone(1310,.25,{type:'square',gain:.012,to:1050})},
  beep(level=0){tone(1800+level*900,.07,{type:'square',gain:.05})},
  alarm(){for(let i=0;i<3;i++)setTimeout(()=>tone(2600,.1,{type:'square',gain:.06}),i*140)},
  spray(){noise(1.6,{type:'highpass',freq:1800,gain:.18,attack:.05,decay:1.5})},
  hiss(){noise(.5,{type:'highpass',freq:3000,gain:.08,decay:.45})},
  ui(){tone(660,.06,{type:'triangle',gain:.08})},
  success(){[523,659,784].forEach((f,i)=>setTimeout(()=>tone(f,.18,{type:'triangle',gain:.1}),i*90))},
  click(){tone(1200,.03,{type:'square',gain:.05})},
  horn(){tone(310,.5,{type:'sawtooth',gain:.05});tone(392,.5,{type:'sawtooth',gain:.04})},
  moo(){tone(150,1.3,{type:'sawtooth',gain:.07,to:112,attack:.25});tone(300,1.2,{type:'triangle',gain:.03,to:220,attack:.3});noise(1.2,{freq:500,to:350,q:4,gain:.04,attack:.3})},
  chop(){noise(.08,{freq:2800,q:2,gain:.2});tone(420,.06,{type:'square',gain:.05})},
  thud(){noise(.25,{type:'lowpass',freq:260,gain:.35});tone(70,.2,{type:'sine',gain:.15})},
  reel(){for(let i=0;i<8;i++)setTimeout(()=>tone(2400,.015,{type:'square',gain:.03}),i*45)},
  plop(){tone(700,.12,{type:'sine',gain:.08,to:300});noise(.18,{freq:1400,q:1,gain:.08})}
 };
 // Ambient loops: kind = hum | roar | water | bubbles | birds.
 function ambient(kind,pos,{gain=.2,freq=110,radius=7,line=null}={}){const l={kind,pos,gain,freq,radius,line,node:null,out:null,panner:null,on:true};loops.push(l);if(ctx)start(l);return l}
 function start(l){
  const out=ctx.createGain();out.gain.value=0;const pan=ctx.createStereoPanner();out.connect(pan).connect(master);l.out=out;l.panner=pan;
  if(l.kind==='hum'){const o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain();o.type='sawtooth';o.frequency.value=l.freq;o2.type='square';o2.frequency.value=l.freq*2.01;const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=l.freq*5;g.gain.value=.4;
   const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=l.freq/9;lg.gain.value=.15;lfo.connect(lg).connect(g.gain);o.connect(f);o2.connect(f);f.connect(g).connect(out);o.start();o2.start();lfo.start()}
  else{const src=ctx.createBufferSource();src.buffer=noiseBuf;src.loop=true;const f=ctx.createBiquadFilter();
   if(l.kind==='roar'){f.type='lowpass';f.frequency.value=320}else if(l.kind==='water'){f.type='bandpass';f.frequency.value=1100;f.Q.value=.5}else{f.type='bandpass';f.frequency.value=l.freq;f.Q.value=2}
   const g=ctx.createGain();g.gain.value=1;if(l.kind==='bubbles'){const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.type='square';lfo.frequency.value=7;lg.gain.value=.8;lfo.connect(lg).connect(g.gain);lfo.start()}
   src.connect(f).connect(g).connect(out);src.start()}
 }
 let birdTimer=0;
 function listen(x,z,yaw,dt=0){
  lx=x;lz=z;lyaw=yaw;if(!enabled||!ctx)return;
  for(const l of loops){if(!l.out)continue;let px=l.pos.x,pz=l.pos.z;if(l.line){px=Math.max(l.line[0],Math.min(l.line[1],x))}
   const dx=px-x,dz=pz-z,d=Math.hypot(dx,dz),g=l.on?l.gain*Math.max(0,1-d/l.radius)**2:0;l.out.gain.setTargetAtTime(g,now(),.15);
   const ang=Math.atan2(dx,-dz)+yaw;l.panner.pan.setTargetAtTime(Math.max(-.9,Math.min(.9,Math.sin(ang))),now(),.15)}
  birdTimer-=dt;if(birdTimer<=0){birdTimer=2+Math.random()*5;const f=2600+Math.random()*1800,pan=Math.random()*1.6-.8;for(let i=0;i<2+Math.random()*3;i++)setTimeout(()=>tone(f*(1+.1*Math.random()),.08,{type:'sine',gain:.03,to:f*1.35,pan}),i*110)}
 }
 // NPC voices with per-character pitch; callbacks drive lip movement.
 function loadVoices(){voices=(speechSynthesis?.getVoices?.()||[]).filter(v=>/^en/i.test(v.lang))}
 if('speechSynthesis' in window){loadVoices();speechSynthesis.onvoiceschanged=loadVoices}
 function say(text,{pitch=1,rate=1,voice=0,onstart,onend}={}){
  if(!enabled||!('speechSynthesis' in window)){onstart?.();const ms=Math.min(9000,600+text.length*55);setTimeout(()=>onend?.(),ms);return}
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.pitch=pitch;u.rate=rate;u.lang='en-GB';
  const pick=voices.filter(v=>/en-(GB|IN|AU|SG|MY)/i.test(v.lang));const list=pick.length?pick:voices;if(list.length)u.voice=list[voice%list.length];
  u.onstart=()=>onstart?.();u.onend=u.onerror=()=>onend?.();speechSynthesis.speak(u);
 }
 // One-shot sound placed in the world: quieter with distance, panned by direction.
 function at(name,x,z,radius=12){if(!enabled||!fx[name])return;const dx=x-lx,dz=z-lz,d=Math.hypot(dx,dz);if(d>radius)return;scale=Math.max(.05,(1-d/radius)**1.5);panAt=Math.max(-.9,Math.min(.9,Math.sin(Math.atan2(dx,-dz)+lyaw)));fx[name]();scale=1;panAt=0}
 return {
  at,
  get enabled(){return enabled},
  enable(on=true){enabled=on;if(on){init();ctx?.resume()}else{ctx?.suspend();if('speechSynthesis' in window)speechSynthesis.cancel()}},
  fx,ambient,listen,say,hush(){if('speechSynthesis' in window)speechSynthesis.cancel()}
 };
}
