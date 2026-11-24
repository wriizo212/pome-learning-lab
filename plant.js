/* Original low-poly palm oil mill diorama. Geometry is expressed in metres in XYZ space. */
(function () {
  "use strict";
  const TAU = Math.PI * 2;
  const units = {
    intake: [-4, 0, -1], digester: [-0.6, 0, -1.6], polish: [2.65, 0, 0.2],
    gas: [2.6, 0, -3], sludge: [-2.5, 0, 2.45], river: [4.4, 0, 3.7]
  };
  const labels = { intake: 'Intake', digester: 'Digester', polish: 'Polishing', gas: 'Biogas engine', sludge: 'Sludge beds', river: 'River' };
  const mix = (a, b, t) => a.map((v, i) => v + (b[i]-v)*t);
  function shade(hex, factor) {
    const n = parseInt(hex.slice(1), 16);
    return 'rgb(' + [16,8,0].map(s => Math.min(255, Math.round(((n >> s) & 255)*factor))).join(',') + ')';
  }
  function mount(canvas, onPick = () => {}) {
    const ctx = canvas.getContext('2d');
    let yaw = -0.61, pitch = 0.61, zoom = 1, spin = false, t = 0, last = 0, raf;
    let faces = [], hits = [], key = null, width, height, scale, pointer, moved, disposed=false;
    const state = {stage:'', success:null, pathway:1};
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const project = ([x,y,z]) => {
      const u = x*Math.cos(yaw)-z*Math.sin(yaw), v=x*Math.sin(yaw)+z*Math.cos(yaw);
      return [width/2+u*scale, height*.54+(v*Math.sin(pitch)-y*Math.cos(pitch))*scale, v*Math.cos(pitch)+y*Math.sin(pitch)];
    };
    function polygon(points, color, edge) {
      const p=points.map(project);
      faces.push({p, color, edge, key, d:p.reduce((sum,v)=>sum+v[2],0)/p.length});
    }
    function box(x,y,z,w,h,l,c) {
      const a=[x-w/2,y,z-l/2], b=[x+w/2,y,z-l/2], d=[x-w/2,y,z+l/2], e=[x+w/2,y,z+l/2];
      const up=p=>[p[0],p[1]+h,p[2]], A=up(a), B=up(b), D=up(d), E=up(e);
      polygon([a,b,B,A],shade(c,.65)); polygon([b,e,E,B],shade(c,.8));
      polygon([e,d,D,E],shade(c,.73)); polygon([d,a,A,D],shade(c,.87)); polygon([A,B,E,D],c);
    }
    function cone(x,y,z,r,R,h,c,n=16) {
      const pt=(i,rad,Y)=>[x+rad*Math.cos(TAU*i/n),Y,z+rad*Math.sin(TAU*i/n)];
      const top=[];
      for(let i=0;i<n;i++){
        const a=pt(i,r,y), b=pt(i+1,r,y), A=pt(i,R,y+h), B=pt(i+1,R,y+h);
        polygon([a,b,B,A],shade(c,.81+.16*Math.cos(TAU*i/n+2.2))); top.push(A);
      }
      if(R>0)polygon(top,c);
    }
    function beam(a,b,r,c){
      const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2], len=Math.hypot(dx,dy,dz);
      if(!len)return;
      const s=Math.hypot(dx,dz), u=s?[-dz/s,0,dx/s]:[1,0,0];
      const v=[dy*u[2]/len,(dz*u[0]-dx*u[2])/len,-dy*u[0]/len];
      const ring=(p,i)=>p.map((c,j)=>c+r*(Math.cos(i*TAU/6)*u[j]+Math.sin(i*TAU/6)*v[j]));
      for(let i=0;i<6;i++)polygon([ring(a,i),ring(b,i),ring(b,i+1),ring(a,i+1)],shade(c,.83+.12*Math.cos(i)));
    }
    function pipe(points,c,active=true){
      for(let i=1;i<points.length;i++)beam(points[i-1],points[i],.09,c);
      if(active){const u=(t*.75)%(points.length-1), a=mix(points[Math.floor(u)],points[Math.floor(u)+1],u%1);cone(...a,.105,.095,.06,'#fff7bc',7);}
    }
    function palm(x,z,h){
      beam([x,0,z],[x+.22,h,z],.1,'#bb9170');
      for(let i=0;i<7;i++){
        const a=i*TAU/7, u=Math.cos(a), v=Math.sin(a), w=.22, X=x+.22, sway=.05*Math.sin(t+i);
        const p=[X,h,z], m=[X+u*.68,h+.28+sway,z+v*.68], tip=[X+u*1.25,h-.29+sway,z+v*1.25];
        const l=[m[0]-v*w,m[1]-.12,m[2]+u*w], r=[m[0]+v*w,m[1]-.12,m[2]-u*w];
        polygon([p,l,m,tip],i%2?'#56a965':'#86c975');polygon([p,m,r],'#367e56');polygon([m,r,tip],'#418e57');
      }
    }
    function basin(x,z,w,d,water){
      box(x,.08,z,w,.45,d,'#a8c5b0');box(x,.53,z,w-.17,.015,d-.17,water);
      for(let i=0;i<5;i++){
        const off=((i/5+t*.12)%1-.5)*(d-.38);
        beam([x-w*.29,.56,z+off],[x-w*.09,.56,z+off],.014,'#c3ead2');
      }
    }
    function scene(){
      const activeGas=!['0','pond','ponds','conventional'].includes(String(state.pathway).toLowerCase());
      key=null; box(0,-.78,0,12,.66,9.6,'#53665a'); box(0,-.12,0,12,.15,9.6,'#89a67a');
      // The continuous terrain sits below every piece of equipment at every orbit angle.
      faces.forEach(face => face.d -= 50);
      for(const x of [-4,-.6,2.65]) box(x,.035,-1.6,2.6,.015,2.5,'#aeb2a1');
      for(let x=-5.6;x<6;x+=.6)box(x,.05,1.25,.43,.04,.3,'#c6c4aa');
      for(const [x,z,h] of [[-5,-3.5,2],[-4,-3.8,2.3],[4.7,-3.5,1.7],[5,-2.1,1.9],[-4.8,2.5,2]])palm(x,z,h);
      key='river';box(0,.045,3.95,11.96,.02,1.24,state.success===false?'#848f68':'#4baaa6');
      for(let i=0;i<13;i++){
        const x=((i*.89+t*.45)%11.2)-5.65,z=3.58+(i%3)*.32;
        beam([x,.08,z],[x+.31,.08,z+.015],.018,'#adede0');
      }
      key='intake';basin(-4,-1,2,1.65,'#966b42');
      for(let i=0;i<5;i++)beam([-4.65+i*.22,.59,-1.65],[-4.65+i*.22,.59,-1.18],.025,'#e6d6ac');
      key='digester';
      if(activeGas){
        cone(-.6,.06,-1.6,1.2,1.2,1.48,'#99c9a3',24);
        for(const h of [.35,1.23])cone(-.6,h,-1.6,1.22,1.22,.055,'#d6ddba',24);
        cone(-.6,1.54,-1.6,1.22,.83,.39,'#537f63',24);cone(-.6,1.93,-1.6,.83,.13,.25,'#6f9a71',24);
        cone(-.6,2.18,-1.6,.12,.12,.24,'#e2c78d',12);
        for(const x of [-.81,-.48])beam([x,.12,-.38],[x,1.77,-.38],.027,'#f0c571');
        for(let i=1;i<8;i++)beam([-.81,i*.21,-.38],[-.48,i*.21,-.38],.022,'#dbb164');
        for(let i=0;i<12;i++){
          const a=i*TAU/12;
          beam([-.6+1.16*Math.cos(a),1.59,-1.6+1.16*Math.sin(a)],[-.6+.15*Math.cos(a),2.19,-1.6+.15*Math.sin(a)],.015,'#94ad94');
        }
      } else basin(-.6,-1.6,2.65,2.12,'#777d4b');
      key='polish';basin(2.65,.2,2.65,1.55,'#61bab2');
      key='gas';box(2.65,.06,-3,1.75,.95,1.25,'#d4c390');box(2.65,1.01,-3,1.86,.1,1.36,'#edf0c9');
      cone(3.2,1.11,-3,.12,.12,.76,'#819a91',12);
      for(let i=0;i<6;i++)box(2.1+i*.2,.43,-2.355,.13,.28,.03,'#476762');
      for(const x of [1.45,2.65,3.85])beam([x,.57,.95],[x,.91,.95],.025,'#e6bb68');
      beam([1.45,.91,.95],[3.85,.91,.95],.025,'#e6bb68');
      for(let i=0;i<3;i++){
        const a=i*TAU/3+(activeGas?t*4:0);
        beam([2.5,1.16,-3],[2.5+.47*Math.cos(a),1.17,-3+.47*Math.sin(a)],.067,'#527878');
      }
      key='sludge';basin(-2.5,2.4,2.75,1.22,'#906b4a');
      for(let i=0;i<5;i++)cone(-3.4+i*.45,.56,2.48,.28,.04,.22,'#ad8959',8);
      key='intake';pipe([[-3,.38,-1],[-2.13,.38,-1],[-2.13,.38,-1.6],[-1.72,.38,-1.6]],'#689687');
      key='gas';if(activeGas)pipe([[-.6,2.35,-1.6],[-.6,2.35,-2.95],[1.6,2.35,-2.95],[1.6,.55,-2.95],[2,.55,-2.95]],'#dcc37b');
      key='polish';pipe([[.52,.44,-1.6],[1.05,.44,-1.6],[1.05,.44,.2],[1.4,.44,.2]],'#79bfba');
      key='river';pipe([[3.9,.38,.2],[4.55,.38,.2],[4.55,.38,3.6],[4.55,.1,3.6]],'#6ba69a');
      key=null;
    }
    function inside(x,y,p){
      let result=false;
      for(let i=0,j=p.length-1;i<p.length;j=i++){
        const a=p[i],b=p[j];
        if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])result=!result;
      }return result;
    }
    function draw(now){
      if(disposed)return;
      raf=requestAnimationFrame(draw);
      if(document.hidden||now-last<32||!canvas.clientWidth||!canvas.clientHeight)return;
      if(!reduced && !state.paused)t+=Math.min(.08,(now-last)/1000);last=now;
      width=canvas.clientWidth;height=canvas.clientHeight;
      const dpr=Math.min(devicePixelRatio||1,2);
      if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){
        canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      }
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
      scale=Math.min(width/16.8,height/10.7)*zoom;
      if(spin&&!reduced&&!state.paused)yaw+=.003;
      faces=[];scene();faces.sort((a,b)=>a.d-b.d);hits=[];
      for(const f of faces){
        ctx.beginPath();f.p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
        ctx.fillStyle=f.color;ctx.fill();ctx.strokeStyle=f.color;ctx.lineWidth=.45;ctx.stroke();
        if(f.key)hits.push(f);
      }
      if(units[state.stage]){
        const pos=units[state.stage].slice();pos[1]=state.stage==='digester'?2.75:1.65;
        const [x,y]=project(pos), label=labels[state.stage];ctx.font='600 12px system-ui';const w=ctx.measureText(label).width+18;
        ctx.fillStyle='#102f2a';ctx.fillRect(x-w/2,y-22,w,22);ctx.textAlign='center';ctx.fillStyle='#e4faa1';ctx.fillText(label,x,y-7);
      }
    }
    function down(e){pointer={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,id:e.pointerId};moved=false;canvas.setPointerCapture(e.pointerId);}
    function move(e){if(!pointer||pointer.id!==e.pointerId)return;
      if(Math.hypot(e.clientX-pointer.startX,e.clientY-pointer.startY)>4)moved=true;
      if(moved){yaw+=(e.clientX-pointer.x)*.009;pitch=Math.max(.27,Math.min(1.15,pitch+(e.clientY-pointer.y)*.006));}
      pointer.x=e.clientX;pointer.y=e.clientY;
    }
    function up(e){if(!pointer||e.pointerId!==pointer.id)return;pointer=null;
      if(moved)return;const b=canvas.getBoundingClientRect();
      const f=hits.slice().reverse().find(v=>inside(e.clientX-b.left,e.clientY-b.top,v.p));if(f){state.stage=f.key;onPick(f.key);}
    }
    function changeZoom(delta){zoom=Math.max(.75,Math.min(1.65,zoom+delta));}
    function wheel(e){e.preventDefault();changeZoom(e.deltaY>0?-.08:.08);}
    function keyboard(e){if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key))return;
      e.preventDefault(); if(e.key==='ArrowLeft')yaw-=.14;if(e.key==='ArrowRight')yaw+=.14;
      if(e.key==='ArrowUp')pitch=Math.min(1.15,pitch+.08);if(e.key==='ArrowDown')pitch=Math.max(.27,pitch-.08);
      if(e.key==='+'||e.key==='=')changeZoom(.08);if(e.key==='-')changeZoom(-.08);if(e.key==='Home')reset();
    }
    function reset(){yaw=-.61;pitch=.61;zoom=1;spin=false;}
    function cancel(){pointer=null;}
    const handlers={pointerdown:down,pointermove:move,pointerup:up,pointercancel:cancel,wheel,keydown:keyboard};
    canvas.tabIndex=0;canvas.style.touchAction='none';canvas.style.cursor='grab';
    for(const [name,fn] of Object.entries(handlers))canvas.addEventListener(name,fn,{passive:false});
    raf=requestAnimationFrame(draw);
    return {update(next){Object.assign(state,next);},reset,zoom:changeZoom,rotate(delta){yaw+=delta;},spin(value){spin=!!value;},
      destroy(){disposed=true;cancelAnimationFrame(raf);for(const [name,fn] of Object.entries(handlers))canvas.removeEventListener(name,fn);}};
  }
  window.Plant={mount};
})();