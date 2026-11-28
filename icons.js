/*
 POME Lab icon set. One consistent line style (24 px grid, 1.8 px rounded strokes, theme
 colours) replaces the emoji that were used as icons. Pages and modules keep writing the
 emoji in their text; this script swaps each one for its SVG icon as the page renders,
 including text that modules add later. window.PomeIcons.svg(name) gives the markup.
 Icons inherit the text colour inside highlighted buttons, so they stay readable.
*/
(()=>{
 const S='#c9d6d0',G='#b6f08a',Y='#ffd34d',O='#ff8a4c',R='#ff7a66',B='#7fc8ee',C='currentColor';
 // name: [colour, path data, filled?]
 const I={
  flame:[O,'M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .2 1.8 1 2.8 2 3.2C11 9 11.5 6 12 3z'],
  flask:['#8fd8e8','M9 3h6M10 3v5.5L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9.5V3M7.6 14h8.8'],
  waves:[B,'M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0'],
  wind:[S,'M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7'],
  smell:['#c3d86a','M7 20c-2-3 2-5 0-8s2-5 0-8M12 20c-2-3 2-5 0-8s2-5 0-8M17 20c-2-3 2-5 0-8s2-5 0-8'],
  map:['#e2c172','M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14'],
  fish:[B,'M3 12c3-5 9-6 14-2l4-3v10l-4-3c-5 4-11 3-14-2zM15.5 11h.01'],
  snow:['#a8dcff','M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17M9 4l3 2 3-2M9 20l3-2 3 2'],
  microbe:[G,'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.5 3.5M15.5 15.5 19 19M19 5l-3.5 3.5M8.5 15.5 5 19M10.5 11h.01M13.5 13h.01'],
  bolt:[Y,'M13 2 4 14h7l-1 8 9-12h-7z',1],
  drop:[B,'M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12zM9 15a3 3 0 0 0 3 3'],
  sprout:['#8fd36a','M12 21v-9M12 12C12 7 8 5 4 5c0 4 3 7 8 7zM12 14c0-4 3-6 8-6 0 4-3 6-8 6z'],
  filter:['#9fd8cf','M3 4h18l-7 8v6l-4 2v-8z'],
  recycle:['#8fd36a','M7 19H4.8a1.8 1.8 0 0 1-1.6-2.7L7 10M11 19h8.2a1.8 1.8 0 0 0 1.6-2.7l-1.2-2.1M14 16l-3 3 3 3M8.3 13.6 7 10l-3.6 1.3M9.3 5.6 11.4 2a1.8 1.8 0 0 1 3.1 0l3.9 6.8M14.7 9.1l3.8 1.1 1.1-3.8'],
  question:['#ffd39b','M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4M12 17h.01'],
  check:[G,'M4 12.5 9.5 18 20 6'],
  x:[R,'M6 6l12 12M18 6 6 18'],
  palm:['#8fd36a','M12 22V11M12 11C9 6 4 6 2 8M12 11c3-5 8-5 10-3M12 11c-1-5-5-8-8-8M12 11c1-5 5-8 8-8M12 11c-4 0-7 3-7 6M12 11c4 0 7 3 7 6'],
  factory:[S,'M3 21V10l5 3V10l5 3V10l5 3V4h3v17zM7 17h2M11 17h2M15 17h2'],
  house:['#e2c172','M3 11 12 4l9 7M5 10v10h14V10M10 20v-5h4v5'],
  plant:[S,'M2 21h20M4 21V9h6v12M10 21V5h5v16M15 21v-8h5v8M6 13h2M12 9h1M17 16h1'],
  coins:[Y,'M12 4c3.9 0 7 1.1 7 2.5S15.9 9 12 9 5 7.9 5 6.5 8.1 4 12 4zM5 6.5v5C5 12.9 8.1 14 12 14s7-1.1 7-2.5v-5M5 11.5v5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5'],
  hardhat:[Y,'M3 18h18M5 18v-3a7 7 0 0 1 14 0v3M10 8V5h4v3M9 18v-5M15 18v-5'],
  save:[C,'M5 3h11l4 4v14H4V4a1 1 0 0 1 1-1zM8 3v5h7V3M8 21v-7h8v7'],
  lock:['#ffd39b','M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M12 15v2'],
  target:[R,'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01'],
  cap:[C,'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5M22 9v6'],
  doc:[C,'M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8'],
  timer:[C,'M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 10v4l2.5 2M10 2h4M19 6l1.5-1.5'],
  printer:[C,'M6 9V3h12v6M6 18H4v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7h-2M7 14h10v7H7z'],
  install:[C,'M7 2h10v20H7zM12 7v7M9 11l3 3 3-3M11 18h2'],
  hourglass:['#ffd39b','M6 2h12M6 22h12M7 2c0 6 10 6 10 10s-10 4-10 10M17 2c0 6-10 6-10 10s10 4 10 10'],
  mouse:[C,'M7 9a5 5 0 0 1 10 0v6a5 5 0 0 1-10 0zM12 5v4'],
  pointer:[C,'M9 11V4.5a1.5 1.5 0 0 1 3 0V11M12 10V8.5a1.5 1.5 0 0 1 3 0V11M15 10.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-.5a6 6 0 0 1-5-2.7L3 15.5a1.6 1.6 0 0 1 2.6-1.8L9 17'],
  play:[C,'M7 4v16l13-8z',1],
  warning:[Y,'M12 3 2 20h20zM12 9v5M12 17h.01'],
  rain:['#a8dcff','M7 15a4 4 0 0 1-.5-8A6 6 0 0 1 18 8a3.5 3.5 0 0 1 0 7zM8 18l-1 3M12 18l-1 3M16 18l-1 3'],
  storm:['#a9b8ff','M7 15a4 4 0 0 1-.5-8A6 6 0 0 1 18 8a3.5 3.5 0 0 1 0 7M13 13l-3 5h4l-2 4'],
  speaker:[C,'M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12'],
  arrow:[C,'M5 12h14M13 6l6 6-6 6'],
  compass:[C,'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z'],
  notebook:['#e2c172','M6 3h12v18H6zM9 3v18M12 8h4M12 12h4'],
  medal:[Y,'M8 2l2 6M16 2l-2 6M12 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 13v4'],
  puzzle:['#e2c172','M4 8h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4h-4a2 2 0 1 0-4 0H4v-4a2 2 0 1 0 0-4z'],
  sliders:['#f0a866','M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M16 4v4M10 10v4M18 16v4'],
  cards:['#a9b8e0','M8 4h11v15H8zM5 7v13h11M13.5 9l2 2.5-2 2.5-2-2.5z'],
  star:[Y,'M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.4L12 17.4l-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z',1],
  'star-o':['#5d7a6c','M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.4L12 17.4l-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z'],
  barrel:['#e08a3a','M6 3h12M6 21h12M6 3c-1 3-1 15 0 18M18 3c1 3 1 15 0 18M5.5 8h13M5.5 16h13'],
  bricks:['#d08a66','M3 5h18v14H3zM3 10h18M3 15h18M9 5v5M15 10v5M9 15v4'],
  bubbles:['#bfe8f0','M8 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM16.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  sludge:['#b07a48','M3 17c3-3 6 2 9-1s6 1 9-2v5H3zM6 12h.01M11 10h.01M16 11h.01'],
  person:[C,'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0'],
  bottle:['#e8f0d0','M10 2h4v4l2 3v12H8V9l2-3zM8 13h8'],
  rake:[C,'M12 2v14M5 16h14M6 16v5M9 16v5M12 16v5M15 16v5M18 16v5'],
  press:[S,'M4 4h16v4H4zM12 8v5M7 13h10v7H7zM9 17h6'],
  ban:[R,'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.6 5.6l12.8 12.8'],
  fog:[S,'M4 9h16M2 13h20M5 17h14M7 5h10'],
  bulb:[Y,'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z'],
  wrench:[S,'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z'],
  down:[C,'M12 4v16M6 14l6 6 6-6'],up:[C,'M12 20V4M6 10l6-6 6 6'],
  salt:['#f4f1e6','M8 9h8l-1 12H9zM8 9c0-3 2-6 4-6s4 3 4 6M11 6h.01M13 6h.01'],
  truck:['#e2c172','M2 6h12v10H2zM14 9h4l4 4v3h-8M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  siren:[R,'M6 18V12a6 6 0 0 1 12 0v6M4 18h16v3H4zM12 2v2M4 6l1.5 1.5M20 6l-1.5 1.5'],
  thermo:[R,'M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0zM12 10v7'],
  tent:[G,'M2 20h20M12 4 3 20M12 4l9 16M12 4v16'],
  microscope:['#9fd8cf','M6 21h12M9 17h6M12 17a5 5 0 0 0 5-5M10 3l4 2-3 6-4-2zM9 12l2 1'],
  search:['#a9b8e0','M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4'],
  sun:[Y,'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4'],
  extinguisher:[R,'M9 8h6v13H9zM12 8V5M12 5h4l2-2M9 3h3'],
  globe:[B,'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z'],
  people:[C,'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M16 4a3.5 3.5 0 0 1 0 7M18 13.5a7 7 0 0 1 4 6.5'],
  next:[C,'M5 5l9 7-9 7zM18 5v14'],
  calendar:['#a9b8e0','M4 5h16v16H4zM4 10h16M8 3v4M16 3v4'],
  heart:['#ff6b7a','M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z',1],
  'heart-o':['#5d6a6c','M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z'],
  trophy:[Y,'M8 3h8v6a4 4 0 0 1-8 0zM8 5H4a3 3 0 0 0 4 4M16 5h4a3 3 0 0 1-4 4M12 13v4M8 21h8M9 17h6v4'],
  camera:[C,'M3 8h4l2-3h6l2 3h4v12H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  gear:[C,'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1']
 };
 const MAP={'🔥':'flame','🧪':'flask','🌊':'waves','💨':'wind','👃':'smell','🗺️':'map','🗺':'map','🐟':'fish','❄️':'snow','❄':'snow','🦠':'microbe','⚡':'bolt','💧':'drop','🌱':'sprout','🧽':'filter','♻️':'recycle','♻':'recycle','🤔':'question',
  '✔':'check','✔️':'check','✓':'check','✅':'check','✖':'x','✕':'x','✖️':'x','🌴':'palm','🏭':'factory','🏡':'house','🏗️':'plant','🏗':'plant','💰':'coins','🪙':'coins','👷':'hardhat','💾':'save','🔒':'lock','🎯':'target','🎓':'cap','📄':'doc',
  '⏱':'timer','⏱️':'timer','⏰':'timer','🖨':'printer','🖨️':'printer','📲':'install','⏳':'hourglass','🖱️':'mouse','🖱':'mouse','👆':'pointer','▶':'play','▶️':'play','⚠':'warning','⚠️':'warning','🌧️':'rain','🌧':'rain','🌦️':'rain','🌦':'rain',
  '⛈️':'storm','⛈':'storm','🔊':'speaker','➤':'arrow','🧭':'compass','📓':'notebook','🏅':'medal','🧩':'puzzle','🎛️':'sliders','🎛':'sliders','🃏':'cards','★':'star','⭐':'star','☆':'star-o','🛢️':'barrel','🛢':'barrel','🧱':'bricks','🫧':'bubbles','🟫':'sludge',
  '🧑‍🌾':'person','🧑':'person','🧴':'bottle','🧹':'rake','🗜️':'press','🗜':'press','🚫':'ban','🌫️':'fog','🌫':'fog','🏞️':'waves','🏞':'waves','💡':'bulb','🔧':'wrench','⬇️':'down','⬇':'down','⬆️':'up','⬆':'up','🧂':'salt','🚚':'truck','🚨':'siren',
  '🌡️':'thermo','🌡':'thermo','⛺':'tent','🔬':'microscope','🕵️':'search','🕵':'search','☀️':'sun','☀':'sun','🧯':'extinguisher','🌍':'globe','👥':'people','⏭':'next','⏭️':'next','📅':'calendar','❤️':'heart','❤':'heart','🖤':'heart-o','🏆':'trophy','⚙':'gear','📷':'camera','📸':'camera','⚙️':'gear'};
 const RE=/(?:\p{Extended_Pictographic}️?(?:‍\p{Extended_Pictographic}️?)*)|[★☆✓✕]/gu;
 function svg(name,label){const d=I[name];if(!d)return '';const [col,path,fill]=d;
  return `<svg class="ico${fill?' fill':''}" viewBox="0 0 24 24" style="--c0:${col}" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`}
 const tpl=document.createElement('template');
 function node(name){tpl.innerHTML=svg(name);const el=tpl.content.firstChild;el.dataset.ico=name;return el}
 const SKIP='script,style,textarea,option,select,title,[data-noicon],.ai-virtual-cursor';
 function fix(t){
  const v=t.nodeValue;if(!v||!RE.test(v)){RE.lastIndex=0;return}RE.lastIndex=0;
  const p=t.parentElement;if(!p||p.closest(SKIP))return;
  const frag=document.createDocumentFragment();let last=0,m,changed=false;
  while((m=RE.exec(v))){const name=MAP[m[0]]||MAP[m[0].replace(/️/g,'')];if(!name)continue;
   if(m.index>last)frag.append(v.slice(last,m.index));frag.append(node(name));changed=true;
   last=m.index+m[0].length;if(v[last]===' ')last++}
  if(!changed)return;
  // Keep the text node itself (others may hold a reference to it): the rest of the text stays in it.
  const rest=v.slice(last);const before=frag;t.nodeValue=rest;p.insertBefore(before,t);
 }
 function scan(root){if(root.nodeType===3){fix(root);return}if(root.nodeType!==1||root.closest?.(SKIP))return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const list=[];let n;while((n=w.nextNode()))list.push(n);list.forEach(fix)}
 const mo=new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')fix(m.target);else m.addedNodes.forEach(scan)}});
 function start(){scan(document.body);mo.observe(document.body,{subtree:true,childList:true,characterData:true})}
 if(document.body)start();else document.addEventListener('DOMContentLoaded',start);
 const css=document.createElement('style');css.textContent=`.ico{width:1.2em;height:1.2em;vertical-align:-.22em;margin-right:.3em;fill:none;stroke:var(--c,var(--c0));stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none;display:inline-block}
.ico.fill{fill:var(--c,var(--c0));stroke-width:1.2}
.active .ico,.on .ico,[aria-pressed=true] .ico,[aria-current=step] .ico,.primary .ico,.g-cta .ico,.lesson-start .ico,.pwa-install .ico,.sc-save .ico,.brief-predict [aria-pressed=true] .ico{--c:currentColor}`;
 document.head.append(css);
 window.PomeIcons={svg,names:Object.keys(I),map:MAP};
})();
