/* 击打特效（note / 节拍触发） */
/* ---------- note hit effects ---------- */
const fxTexCache=new Map();
function fxTex(kind){
  let g=fxTexCache.get(kind);if(g)return g;
  const N=kind==='dot'||kind==='spark'?32:128,c=document.createElement('canvas');c.width=c.height=N;if(kind==='streak')c.width=12;if(kind==='softbar')c.width=40;const x=c.getContext('2d'),m=N/2;
  if(kind==='ring'){x.shadowColor='#fff';x.shadowBlur=10;x.strokeStyle='#fff';x.lineWidth=7;x.beginPath();x.arc(m,m,50,0,Math.PI*2);x.stroke();}
  else if(kind==='glow'||kind==='dot'){const gr=x.createRadialGradient(m,m,0,m,m,m);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(kind==='dot'?0.35:0.2,'rgba(255,255,255,.8)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,N,N);}
  else if(kind==='star'){x.fillStyle='#fff';x.shadowColor='#fff';x.shadowBlur=8;for(const r of [0,Math.PI/2]){x.save();x.translate(m,m);x.rotate(r);x.beginPath();x.moveTo(0,-58);x.quadraticCurveTo(3,-3,58,0);x.quadraticCurveTo(3,3,0,58);x.quadraticCurveTo(-3,3,-58,0);x.quadraticCurveTo(-3,-3,0,-58);x.fill();x.restore();}}
  else if(kind==='streak'){const gr=x.createLinearGradient(0,0,0,N);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(0.75,'rgba(255,255,255,.85)');gr.addColorStop(1,'rgba(255,255,255,1)');x.fillStyle=gr;x.beginPath();if(x.roundRect)x.roundRect(4,2,4,N-4,2);else x.rect(4,2,4,N-4);x.fill();}
  else if(kind==='petal'){x.fillStyle='#fff';x.shadowColor='#fff';x.shadowBlur=4;x.translate(m,m);x.beginPath();x.ellipse(0,0,54,30,0,0,Math.PI*2);x.fill();x.setTransform(1,0,0,1,0,0);}
  else if(kind==='softbar'){const gr=x.createRadialGradient(m,m,0,m,m,m);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.45,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.setTransform(c.width/N,0,0,1,0,0);x.fillRect(0,0,N,N);x.setTransform(1,0,0,1,0,0);}
  else if(kind==='thin'){x.strokeStyle='#fff';x.lineWidth=2.5;x.beginPath();x.arc(m,m,60,0,Math.PI*2);x.stroke();}
  else if(kind==='spark'){const gr=x.createRadialGradient(m,m,0,m,m,m);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.3,'rgba(255,255,255,.95)');gr.addColorStop(0.45,'rgba(255,255,255,.15)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,N,N);}
  else if(kind==='square'){x.shadowColor='#fff';x.shadowBlur=8;x.strokeStyle='#fff';x.lineWidth=7;x.strokeRect(22,22,N-44,N-44);}
  g={key:'fx:'+kind,canvas:c,w:c.width,h:c.height,tints:new Map(),fxName:kind};fxTexCache.set(kind,g);return g;
}
function newHitClip(tid,start,end){return{id:uid(),kind:'hit',tid,start:Math.round(start),end:Math.round(end),hit:ownColors(HIT_DEF(),[['custom','accent']])};}
const circleR=()=>54.4-4.48*(map.cs!=null?map.cs:5);
/* the (time, position, colour) events a hit-effect clip reacts to */
function hitEvents(c){
  const h=c.hit,out=[];
  if(h.src==='beats'){const ev=Math.max(0.125,+h.every||1);let t=c.start,r=redAt(t),k=Math.ceil((t-r.t)/(r.bl*ev)-1e-6),i=0;
    for(let g=0;g<5000;g++){r=redAt(t);let bt=r.t+k*r.bl*ev;if(bt<c.start-1){k++;continue;}if(bt>c.end)break;
      const nr=redAt(bt);if(nr!==r){r=nr;k=Math.ceil((bt-r.t)/(r.bl*ev)-1e-6);bt=r.t+k*r.bl*ev;}
      out.push({t:Math.round(bt),x:320,y:240,col:null,idx:i++});k++;t=bt;}
    return out;}
  for(const o of map.objs||[]){if(o.t>c.end)break;if(h.ncOnly&&!(o.nc||o.num===1))continue;if(+h.onEvery&&!onBeatGrid(o.t,+h.onEvery,+h.onOff||0))continue;
    if(o.kind==='spinner'){if(h.spinner&&o.endT>=c.start&&o.endT<=c.end)out.push({t:o.endT,x:320,y:248,col:o.combo,big:true});continue;}
    if(o.t>=c.start)out.push({t:o.t,x:o.x+64,y:o.y+56,col:o.combo,obj:o.kind==='slider'&&h.follow?o:null,sl:o.kind==='slider'?o:null});
    if(o.kind==='slider'&&h.sliderEnd&&o.endT>=c.start&&o.endT<=c.end)out.push({t:Math.round(o.endT),x:o.endPos[0]+64,y:o.endPos[1]+56,col:o.combo});}
  return out;
}
/* is this time on the beat grid "every n beats, shifted by off beats" (counted from the timing point, within 15 ms)? */
function onBeatGrid(t,n,off){const r=redAt(t);if(!r)return false;const b=(t-r.t)/r.bl-off,i=Math.round(b);return Math.abs(b-i)*r.bl<15&&((i%n)+n)%n===0;}
function genHit(c,tr,pal){
  const h=c.hit,ev=hitEvents(c),R=circleR(),k=(h.size||100)/100,rng=rngFrom(c.start*31+7);
  for(const e of ev){
    if(e.sl&&h.types.includes('trail'))genTrail(c,tr,e.sl,h.color==='combo'&&e.col?e.col:h.color==='custom'?h.custom:pal.accent,R,k,rng);
    let t=e.t;const D=Math.max(60,beatAt(t)*(h.beats||1)),big=e.big?3:1;
    const col=h.color==='combo'&&e.col?e.col:h.color==='custom'?h.custom:pal.accent;
    const mk=(kind,dd=D)=>{const s=spr(fxTex(kind),e.x,e.y);s.style='hit';s.hitId=c.id;s.layer=tr.layer;s.tid=tr.id;colorAt(s,col,t);if(h.add)cmd(s,'P',0,t,t+dd,'A');return s;};
    /* follow the slider ball: a glow rides the slider, the chosen effects then fire at the slider end */
    if(e.obj){const o=e.obj,t1=Math.round(o.endT),st=Math.max(16,beatAt(t)/8),g=spr(fxTex('glow'),e.x,e.y);g.style='hit';g.hitId=c.id;g.layer=tr.layer;g.tid=tr.id;
      colorAt(g,col,t);if(h.add)cmd(g,'P',0,t,t1+D/2,'A');const gs=R*2/128*k*1.5;cmd(g,'S',0,t,t,gs);cmd(g,'F',0,t,t1,0.85,0.85);cmd(g,'F',EZ.out,t1,t1+D/2,0.85,0);
      let pt=t,pp=[e.x,e.y];for(let tt=t+st;;tt+=st){const last=tt>=t1;const q=ballAt(o,last?t1:tt),np=[Math.round(q[0]+64),Math.round(q[1]+56)];cmd(g,'M',0,pt,last?t1:tt,pp,np);pt=last?t1:tt;pp=np;if(last)break;}
      e.x=pp[0];e.y=pp[1];t=t1;}
    const base=R*2/128*k*big;
    for(const ty of h.types){
      if(ty==='ring'){const s=mk('ring');cmd(s,'S',EZ.expoOut,t,t+D,base*0.95,base*1.9);cmd(s,'F',EZ.out,t,t+D,0.9,0);}
      else if(ty==='thin'){/* after Deity Mode: a 1px-ish outline the size of the note opens to twice its size and fades (CircOut) */
        const s=mk('thin'),r0=R*2/120*k*big;cmd(s,'S',EZ.circOut,t,t+D,r0,r0*2);cmd(s,'F',EZ.circOut,t,t+D,1,0);}
      else if(ty==='glow'){const s=mk('glow');cmd(s,'S',EZ.out,t,t+D,base*1.2,base*2.2);cmd(s,'F',EZ.out,t,t+D,0.75,0);}
      else if(ty==='star'){const s=mk('star');cmd(s,'S',EZ.backOut,t,t+D*0.45,base*0.3,base*1.5);cmd(s,'R',EZ.out,t,t+D,0,Math.PI/4);cmd(s,'F',EZ.quadIn,t+D*0.3,t+D,1,0);}
      else if(ty==='square'){const s=mk('square');cmd(s,'S',EZ.out,t,t+D,base*0.9,base*1.6);cmd(s,'R',EZ.cubicOut,t,t+D,0,Math.PI/2);cmd(s,'F',EZ.out,t,t+D,0.85,0);}
      else if(ty==='emit'){/* from the screen centre toward the note (or around the circle for beats) */
        let dx=e.x-320,dy=e.y-240,l=Math.hypot(dx,dy);if(l<1||e.idx!=null){const a=(e.idx!=null?e.idx*2.39996:rng()*6.283);dx=Math.cos(a);dy=Math.sin(a);l=1;}
        const dist=330*k,s=mk('glow');s.x=320;s.y=240;cmd(s,'M',EZ.expoOut,t,t+D*1.2,[320,240],[Math.round(320+dx/l*dist),Math.round(240+dy/l*dist)]);
        cmd(s,'S',EZ.out,t,t+D*1.2,base*1.4,base*0.5);cmd(s,'F',EZ.quadIn,t,t+D*1.2,1,0);}
      else if(ty==='trail')continue;
      else if(ty==='spark'){/* after Deity Mode 02:02: a thin ring opens over the duration, and a spray of tiny sparks shoots
           100–150 px out (CircOut) over twice the duration, holding full brightness for the first half */
        const r=mk('thin'),r0=R*2/120*k*big;cmd(r,'S',EZ.circOut,t,t+D,r0,r0*2);cmd(r,'F',EZ.circOut,t,t+D,1,0);
        const n=clamp(Math.round(h.sparkCount??32),4,80),d0=(+h.sparkDist||100)*k*big;
        for(let i=0;i<n;i++){const a=rng()*Math.PI*2,dist=d0*(1+rng()*0.5),s=mk('spark',D*2);
          cmd(s,'S',0,t,t,Math.round((0.2+rng()*0.3)*k*1000)/1000);cmd(s,'M',EZ.circOut,t,t+D*2,[e.x,e.y],[Math.round(e.x+Math.cos(a)*dist),Math.round(e.y+Math.sin(a)*dist)]);
          cmd(s,'F',EZ.circOut,t+D,t+D*2,1,0);}}
      else if(ty==='burst'){const n=clamp(Math.round(h.count||6),2,24),off=rng()*Math.PI*2,ds=R/16*0.45*k*big;
        for(let i=0;i<n;i++){const a=off+i/n*Math.PI*2+(rng()-0.5)*0.5,dist=R*(1.5+rng()*1.1)*k*big;
          const s=mk('dot');cmd(s,'M',EZ.expoOut,t,t+D,[e.x,e.y],[Math.round(e.x+Math.cos(a)*dist),Math.round(e.y+Math.sin(a)*dist)]);cmd(s,'S',0,t,t,ds*(0.7+rng()*0.6));cmd(s,'F',EZ.quadIn,t,t+D,1,0);}}
    }
  }
}
function hitSpriteCount(c){const h=c.hit,ev=hitEvents(c),n=ev.length;let m=n*h.types.reduce((a,t)=>a+(t==='trail'?0:t==='burst'?clamp(Math.round(h.count||6),2,24):t==='spark'?1+clamp(Math.round(h.sparkCount??32),4,80):1),0);
  if(h.types.includes('trail')){const gap=Math.max(10,+h.trailGap||25),per=(h.trailEnd||'scatter')==='scatter'?1+clamp(Math.round(h.trailPuffs??5),1,12):1;for(const e of ev)if(e.sl)m+=(Math.floor((e.sl.endT-e.sl.t)/gap)+1)*per;}return m;}
/* slider trail: the ball leaves a glow every few ms; the glows stay (for a while, or until the slider ends) and then
   burst into small puffs, gather into the slider end, or fade in place */
function genTrail(c,tr,o,col,R,k,rng){
  const h=c.hit,gap=Math.max(10,+h.trailGap||25),a=clamp(h.trailAlpha??50,0,100)/100,sz=R*2/128*k*clamp(h.trailSize??100,10,400)/100,mode=h.trailEnd||'scatter';
  const end=[Math.round(o.endPos[0]+64),Math.round(o.endPos[1]+56)],tEnd=Math.round(o.endT),puffs=clamp(Math.round(h.trailPuffs??5),1,12);
  for(let tt=o.t;tt<=o.endT+1;tt+=gap){
    const q=ballAt(o,Math.min(tt,o.endT)),p=[Math.round((q[0]+64)*10)/10,Math.round((q[1]+56)*10)/10],t0=Math.round(tt),b=beatAt(t0);
    const t1=h.trailHold==='end'||h.trailHold==null?Math.max(t0+40,tEnd):t0+Math.round(b*(+h.trailHold||0)),dur=Math.max(60,Math.round(beatAt(t1)*(h.trailDur||2))),t2=t1+dur;
    const mk=(x,y,u0,u1)=>{const s=spr(fxTex('glow'),x,y);s.style='hit';s.hitId=c.id;s.layer=tr.layer;s.tid=tr.id;colorAt(s,col,u0);if(h.add)cmd(s,'P',0,u0,u1,'A');return s;};
    if(mode==='scatter'){
      const s=mk(p[0],p[1],t0,t1);cmd(s,'S',0,t0,t0,sz);cmd(s,'F',0,t0,t0+Math.min(60,t1-t0),0,a);cmd(s,'F',0,t1,t1,0);
      for(let i=0;i<puffs;i++){const an=rng()*Math.PI*2,d=R*0.9*k*Math.sqrt(rng()),u=mk(p[0],p[1],t1,t2);
        cmd(u,'F',0,t1,t1,a);cmd(u,'M',22,t1,t2,p,[Math.round(p[0]+Math.cos(an)*d),Math.round(p[1]+Math.sin(an)*d)]);cmd(u,'S',22,t1,t2,sz*(0.7+rng()*0.3),0);}
      continue;}
    const s=mk(p[0],p[1],t0,t2);cmd(s,'S',0,t0,t0,sz);cmd(s,'F',0,t0,t0+Math.min(80,Math.max(20,t1-t0)),0,a);
    if(mode==='gather'){
      /* follow the slider body to the end instead of cutting straight across (a straight line looks like the light is falling off the slider).
         n short linear moves along the path; their times follow a sine-out curve so it still starts fast and settles */
      const rest=Math.max(0,o.endT-tt),n=Math.max(1,Math.min(8,Math.ceil(rest/90)));let prev=p,pt=t1;
      for(let j=1;j<=n;j++){const u=j/n,q2=j===n?[end[0]-64,end[1]-56]:ballAt(o,Math.min(tt,o.endT)+rest*u),np=[Math.round((q2[0]+64)*10)/10,Math.round((q2[1]+56)*10)/10];
        const nt=j===n?t2:t1+Math.round((t2-t1)*Math.asin(u)*2/Math.PI);if(nt>pt){cmd(s,'M',0,pt,nt,prev,np);prev=np;pt=nt;}}cmd(s,'S',EZ.sineOut,t1,t2,sz,0);cmd(s,'F',EZ.sineOut,t1,t2,a,0);}
    else{cmd(s,'S',EZ.out,t1,t2,sz,sz*0.6);cmd(s,'F',EZ.out,t1,t2,a,0);}
  }
}


