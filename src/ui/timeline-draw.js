/* 时间轴的坐标换算与绘制 */
/* ---------- timeline geometry ---------- */
const view={v0:0,v1:null};
function vSpan(){const d=gen.duration;return[view.v0,view.v1==null?d:view.v1];}
function setView(v0,v1){const d=gen.duration;const span=Math.max(800,Math.min(d,v1-v0));if(span>=d-1){view.v0=0;view.v1=null;return;}v0=Math.max(0,Math.min(d-span,v0));view.v0=v0;view.v1=v0+span;}
function zoomAt(t,f){const[v0,v1]=vSpan();const span=(v1-v0)*f,k=(t-v0)/(v1-v0);setView(t-span*k,t-span*k+span);}
function xToT(clientX){const r=tcv.getBoundingClientRect();const[v0,v1]=vSpan();return v0+(clientX-r.left)/r.width*(v1-v0);}
function tToX(t){const r=tcv.getBoundingClientRect();const[v0,v1]=vSpan();return r.left+(t-v0)/(v1-v0)*r.width;}
function rowsLayout(){const out=[];let y=0;for(const tr of state.tracks){const h=tr.lyric?46:40;out.push({tr,y,h});y+=h;}out.push({notes:true,y,h:22});y+=22;return{list:out,H:y};}
function rowAtY(clientY){const r=tcv.getBoundingClientRect(),y=clientY-r.top;return rowsLayout().list.find(R=>y>=R.y&&y<R.y+R.h)||null;}
function snapTime(t,excludeId,free){
  const[v0,v1]=vSpan(),tol=(v1-v0)/Math.max(1,tcv.clientWidth)*8;
  /* Shift: no snapping, except to the playhead */
  if(free)return Math.abs(now()-t)<tol?now():t;if(!state.magnet)return t;let best=t,bd=tol;
  const tryT=x=>{const d=Math.abs(x-t);if(d<bd){bd=d;best=x;}};
  tryT(now());for(const L of gen.lines){tryT(L.S);tryT(L.E);}const ex=excludeId instanceof Set?excludeId:null;for(const c of state.clips){if(ex?!ex.has(c.id):c.id!==excludeId){tryT(c.start);tryT(c.end);}}
  for(const k of gen.kiai||[])tryT(k.s);for(const b of map.bookmarks||[])tryT(b);const n=nearestNote(t,tol);if(n!=null)tryT(n);tryT(snap(t,state.snap||4));return best;
}
function headTol(){const[v0,v1]=vSpan();return (v1-v0)/Math.max(1,tcv.clientWidth)*8;}
function scrubT(e){const t=xToT(e.clientX);if(!e.shiftKey)return t;const tol=headTol()*1.25;let best=t,bd=tol;
  const tryT=x=>{if(x==null||!isFinite(x))return;const d=Math.abs(x-t);if(d<bd){bd=d;best=x;}};
  for(const c of state.clips){const tr=state.tracks.find(r=>r.id===c.tid);if(tr&&tr.hidden)continue;tryT(c.start);tryT(c.end);}
  for(const L of gen.lines){tryT(L.S);tryT(L.E);}for(const k of gen.kiai||[]){tryT(k.s);tryT(k.e);}
  if(best===t){const n=nearestNote(t,tol);if(n!=null)tryT(n);}
  return best;}
/* the characters of a line and when each appears (own word times, note-follow, or the even fallback) */
function charTicks(L){
  const chars=stripChars(L.text),n=chars.length;
  let times=L.charTimes&&L.charTimes.length===n?L.charTimes.slice():timesFor(n,L.S,L.E,L.b,null).times;
  if(tdrag&&tdrag.kind==='char'&&tdrag.L&&tdrag.L.src.key===L.src.key&&tdrag.newTimes)times=tdrag.newTimes.slice();
  if(tapState&&tapState.key===L.src.key)times=tapState.times.slice();
  return{chars,times,own:!!(L.src.chars&&L.src.chars.length)};}
const charLine=()=>selKeys().length===1?gen.lines.find(l=>l.src.key===selKeys()[0])||null:null;
function lyricTarget(t,free){if(free||state.magnet){if(Math.abs(now()-t)<headTol())return now();}if(free||!state.magnet)return t;if(state.snapTo==='note'){const n=nearestNote(t,beatAt(t)/2);if(n!=null)return n;}return snap(t,state.snap);}

/* ---------- timeline drawing ---------- */
const TICK_COL={2:'#d8424f',3:'#a35fd6',4:'#3f86e8',6:'#c48be8',8:'#e0b33a',12:'#c48be8',16:'#888'};
function gcd(a,b){return b?gcd(b,a%b):a;}
let tok={},tokAt=0;
function tokens(){if(performance.now()-tokAt<1000)return tok;const cs=getComputedStyle(document.documentElement);
  for(const k of ['panel','panel2','panel3','line','muted','fg','accent','kiai','redline','sel','st-slam','st-scatter','st-vertical','clip','clip2','mono','body','bad','hit','spec','part','imp','st-karaoke','r-clip','greenline','bookmark'])tok[k]=cs.getPropertyValue('--'+k).trim();tokAt=performance.now();return tok;}
function forBeats(v0,v1,W,dpr,cb){
  const sp=v1-v0,dv=state.snap||4;
  for(let i=0;i<map.red.length;i++){const r=map.red[i];const end=i+1<map.red.length?map.red[i+1].t:v1;if(end<v0||r.t>v1)continue;
    const beatPx=r.bl/sp*W,subOK=beatPx/dv>=6*dpr,beatOK=beatPx>=6*dpr,measOK=beatPx*r.meter>=6*dpr;if(!measOK)continue;
    const step=subOK?r.bl/dv:beatOK?r.bl:r.bl*r.meter;let n=Math.max(0,Math.floor((v0-r.t)/step));
    for(let x=r.t+n*step;x<Math.min(end,v1+step);x+=step,n++){
      const inBeat=subOK?n%dv:0,isBeat=inBeat===0,beatIdx=subOK?n/dv:beatOK?n:n*r.meter,isMeas=isBeat&&Math.round(beatIdx)%r.meter===0;
      cb(x,isMeas?'m':isBeat?'b':dv/gcd(inBeat,dv));}}
}
function drawRuler(t){
  const T=tokens(),W=rcv.width,H=rcv.height,[v0,v1]=vSpan(),sp=v1-v0,px=v=>(v-v0)/sp*W,dpr=W/Math.max(1,rcv.clientWidth||W);
  rx.setTransform(1,0,0,1,0,0);rx.fillStyle=T.panel2;rx.fillRect(0,0,W,H);
  const RH=state.rulerHide||{};
  rx.globalAlpha=0.3;rx.fillStyle=T.kiai;if(!RH.kiai)for(const k of gen.kiai||[])rx.fillRect(px(k.s),H-5*dpr,Math.max(1,px(k.e)-px(k.s)),5*dpr);rx.globalAlpha=1;
  forBeats(v0,v1,W,dpr,(x,kind)=>{const X=Math.round(px(x));let col,h,a;if(kind==='m'){col=T.fg;h=H*0.5;a=0.7;}else if(kind==='b'){col=T.fg;h=H*0.32;a=0.4;}else{col=TICK_COL[kind]||T.muted;h=H*0.22;a=0.9;}
    rx.globalAlpha=a;rx.fillStyle=col;rx.fillRect(X,H-h,Math.max(1,dpr*0.8),h);});
  rx.globalAlpha=1;
  /* time labels */
  const steps=[100,250,500,1000,2000,5000,10000,15000,30000,60000];const minGap=70*dpr/W*sp;const st=steps.find(s=>s>=minGap)||60000;
  rx.fillStyle=T.muted;rx.font=`${Math.round(10*dpr)}px ${T.mono||'monospace'}`;rx.textBaseline='top';
  for(let x=Math.ceil(v0/st)*st;x<=v1;x+=st){const X=px(x);rx.fillRect(Math.round(X),0,1,H*0.25);const s=x/1000;rx.fillText(st<1000?s.toFixed(st<250?2:1)+'s':`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`,X+3*dpr,2*dpr);}
  if(!RH.green){rx.fillStyle=T.greenline||'#4fd36b';rx.globalAlpha=0.85;for(const g of map.green||[]){const X=Math.round(px(g.t));if(X>=-2&&X<=W+2)rx.fillRect(X,H*0.35,Math.max(1,dpr),H*0.65);}rx.globalAlpha=1;}
  if(!RH.blue){rx.fillStyle=T.bookmark||'#3d7bff';for(const b of map.bookmarks||[]){const X=Math.round(px(b));if(X<-8||X>W+8)continue;rx.fillRect(X,0,Math.max(1,1.5*dpr),H);rx.beginPath();rx.moveTo(X,0);rx.lineTo(X+7*dpr,0);rx.lineTo(X,6*dpr);rx.closePath();rx.fill();}}
  if(!RH.red){rx.fillStyle=T.redline;for(const r of map.red){const X=Math.round(px(r.t));if(X>=-2&&X<=W+2)rx.fillRect(X,0,2*dpr,H);}}
  const P=px(t);rx.fillStyle=T.sel;rx.beginPath();rx.moveTo(P-6*dpr,0);rx.lineTo(P+6*dpr,0);rx.lineTo(P+6*dpr,H*0.45);rx.lineTo(P,H*0.75);rx.lineTo(P-6*dpr,H*0.45);rx.closePath();rx.fill();rx.fillRect(P-dpr*0.6,0,dpr*1.2,H);
}
function rrect(c,x,y,w,h,r){c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);}
function clipKfTimes(c){if(!c.props)return[];const ts=new Set();for(const k of Object.keys(c.props)){if(k==='v'&&!c.nonuni)continue;const K=c.props[k].kf;if(K&&K.length>1)for(const q of K)ts.add(q.t);}return[...ts].sort((a,b)=>a-b);}
function drawTracks(t){
  const T=tokens(),W=tcv.width,H=tcv.height,[v0,v1]=vSpan(),sp=v1-v0,px=v=>(v-v0)/sp*W,dpr=W/Math.max(1,tcv.clientWidth||W);
  const R=rowsLayout();
  tx.setTransform(1,0,0,1,0,0);tx.fillStyle=T.panel;tx.fillRect(0,0,W,H);
  R.list.forEach((row,i)=>{const y=row.y*dpr,h=row.h*dpr;tx.fillStyle=row.tr&&row.tr.id===activeTid?T.panel3:(i%2?T.panel:T.panel2);tx.fillRect(0,y,W,h);tx.fillStyle=T.line;tx.fillRect(0,y+h-dpr,W,dpr);});
  tx.globalAlpha=0.08;tx.fillStyle=T.kiai;if(!(state.rulerHide||{}).kiai)for(const k of gen.kiai||[])tx.fillRect(px(k.s),0,Math.max(1,px(k.e)-px(k.s)),H);
  forBeats(v0,v1,W,dpr,(x,kind)=>{if(kind!=='m'&&kind!=='b')return;tx.globalAlpha=kind==='m'?0.12:0.05;tx.fillStyle=T.fg;tx.fillRect(Math.round(px(x)),0,dpr,H);});
  tx.globalAlpha=1;
  const CR=Math.max(2,+T['r-clip']||4);
  const font=`${Math.round(11*dpr)}px ${T.body||'sans-serif'}`;
  for(const row of R.list){const y=row.y*dpr,h=row.h*dpr;
    if(row.notes){const N=map.notes||[];tx.fillStyle=T.muted;let lo=0,hi=N.length;while(lo<hi){const m=(lo+hi)>>1;if(N[m]<v0)lo=m+1;else hi=m;}
      const big=sp/W*dpr<14;for(let i=lo;i<N.length&&N[i]<=v1;i++){const X=px(N[i]);if(big){tx.beginPath();tx.arc(X,y+h/2,3*dpr,0,Math.PI*2);tx.fill();}else tx.fillRect(Math.round(X),y+h*0.3,1,h*0.4);}continue;}
    if(row.tr.lyric){
      for(const L of gen.lines){const x=px(L.S),w=Math.max(2,px(L.E)-px(L.S)-2);if(x>W||x+w<0)continue;
        tx.fillStyle=T['st-'+L.style]||T.accent;tx.globalAlpha=(t>=L.S&&t<L.E)?1:0.8;rrect(tx,x,y+4*dpr,w,h-8*dpr,CR*dpr);tx.fill();tx.globalAlpha=1;
        if(L.custom){tx.fillStyle='#fff';tx.beginPath();tx.arc(x+w-7*dpr,y+10*dpr,2.5*dpr,0,Math.PI*2);tx.fill();}
        if(selKeys().includes(L.src.key)){tx.strokeStyle='#fff';tx.lineWidth=2*dpr;rrect(tx,x,y+4*dpr,w,h-8*dpr,CR*dpr);tx.stroke();}
        if(w>30*dpr){tx.save();tx.beginPath();tx.rect(x+3*dpr,y,w-6*dpr,h);tx.clip();tx.fillStyle='#fff';tx.font=font;tx.textBaseline='top';
          tx.fillText(tl(STYLE_NAME[L.style]||''),x+5*dpr,y+7*dpr);if(w>90*dpr&&!(selKeys().length===1&&selKeys()[0]===L.src.key)){tx.globalAlpha=0.85;tx.fillText(L.text.replace(/\*/g,'').replace(/\//g,' '),x+5*dpr,y+22*dpr);}tx.restore();tx.globalAlpha=1;}
        tx.fillStyle='rgba(255,255,255,.35)';tx.fillRect(x,y+8*dpr,2*dpr,h-16*dpr);tx.fillRect(x+w-2*dpr,y+8*dpr,2*dpr,h-16*dpr);}
      /* per-character ticks on the selected line: drag to retime */
      const CL=charLine();if(CL){const K=charTicks(CL),tap=tapState&&tapState.key===CL.src.key;tx.save();tx.font=`${Math.round(11*dpr)}px ${T.body||'sans-serif'}`;tx.textBaseline='top';tx.textAlign='center';
        let lastLab=-1e9;
        K.times.forEach((ct,i)=>{const X=Math.round(px(ct));if(X<-20||X>W+20)return;const done=!tap||i<tapState.i,cur=tap&&i===tapState.i;
          tx.fillStyle=cur?T.sel:done?'#fff':'rgba(255,255,255,.35)';tx.fillRect(X-dpr*0.75,y+32*dpr,dpr*1.5,h-38*dpr);
          tx.beginPath();tx.moveTo(X-4*dpr,y+h-4*dpr);tx.lineTo(X+4*dpr,y+h-4*dpr);tx.lineTo(X,y+h-9*dpr);tx.closePath();tx.fill();
          if(X-lastLab>=12*dpr){tx.fillStyle=cur?T.sel:'#fff';tx.fillText(K.chars[i],X,y+20*dpr);lastLab=X;}});
        tx.restore();tx.textAlign='left';}
      continue;}
    for(const c of state.clips){if(c.tid!==row.tr.id)continue;const x=px(c.start),w=Math.max(3,px(c.end)-px(c.start));if(x>W||x+w<0)continue;
      const on=selIds().includes(c.id);
      if(c.kind==='snd'){const m=state.media.find(q=>q.id===c.mid);tx.fillStyle=clipFill(c,on?'#4f86b8':'#2f5272');rrect(tx,x,y+3*dpr,w,h-6*dpr,CR*dpr);tx.fill();if(on){tx.strokeStyle='#fff';tx.lineWidth=2*dpr;tx.stroke();}
        tx.save();tx.beginPath();tx.rect(x+2*dpr,y,Math.max(w,140*dpr),h);tx.clip();tx.fillStyle='#fff';tx.font=font;tx.textBaseline='top';tx.fillText(tl(`♪ ${clipName(c,m?m.name:'丢失的音效')}${c.vol!=null&&c.vol!==100?` · ${c.vol}%`:''}`),x+5*dpr,y+7*dpr);tx.restore();
        tx.fillStyle='#9cc8f0';tx.fillRect(Math.round(x),y+3*dpr,Math.max(1,2*dpr),h-6*dpr);continue;}
      if(c.kind==='part'||c.kind==='imp'){const P=c.kind==='part';tx.fillStyle=clipFill(c,on?(P?'#2f9c8c':'#6b7c4a'):(P?T.part||'#246e63':T.imp||'#4d5a36'));rrect(tx,x,y+3*dpr,w,h-6*dpr,CR*dpr);tx.fill();if(on){tx.strokeStyle='#fff';tx.lineWidth=2*dpr;tx.stroke();}
        tx.save();tx.beginPath();tx.rect(x+2*dpr,y,w-4*dpr,h);tx.clip();tx.fillStyle='#fff';tx.font=font;tx.textBaseline='top';
        if(P){const pr=PART_PRESETS[c.part.preset];tx.fillText(tl(`✧ ${clipName(c,'粒子')} · ${pr?pr[0]:'自定义'} · ${c.part.count} 个`),x+6*dpr,y+7*dpr);}
        else{const I=impCache.get(c.iid),off=Math.round(c.start-(c.base||0));tx.fillText(tl(`${clipName(c,'OSB')} · ${I?I.blocks.length:'…'} 个 sprite${off?` · 平移 ${off>0?'+':''}${off} ms`:''}`),x+6*dpr,y+7*dpr);}
        tx.restore();continue;}
      if(c.kind==='spec'){tx.fillStyle=clipFill(c,on?'#6d4fc4':T.spec||'#45367a');rrect(tx,x,y+3*dpr,w,h-6*dpr,CR*dpr);tx.fill();if(on){tx.strokeStyle='#fff';tx.lineWidth=2*dpr;tx.stroke();}
        tx.save();tx.beginPath();tx.rect(x+2*dpr,y,w-4*dpr,h);tx.clip();
        const F=pcm?specFrames(c):null;if(F){tx.fillStyle='rgba(255,255,255,.4)';const k0=Math.max(0,F.times.findIndex(q=>q>=v0)-1);
          for(let k=k0;k<F.times.length&&F.times[k]<=v1;k+=Math.max(1,Math.floor(F.times.length/Math.max(1,w/(2*dpr))))){let m=0;for(const v of F.vals[k])m+=v;m/=F.n;const X=px(F.times[k]),hh=m*(h-14*dpr);tx.fillRect(Math.round(X),y+h-5*dpr-hh,Math.max(1,dpr),hh);}}
        tx.fillStyle='#fff';tx.font=font;tx.textBaseline='top';tx.fillText(tl(`♪ ${clipName(c,'频谱')} · ${c.spec.shape==='circle'?'圆形':'条形'} · ${c.spec.n} 条${pcm?'':' · 未载入音频'}`),x+6*dpr,y+7*dpr);
        tx.restore();continue;}
      if(c.kind==='kiai'){const q=c.kiai;tx.fillStyle=clipFill(c,on?'#d98a2b':'#9a6420');rrect(tx,x,y+3*dpr,w,h-6*dpr,CR*dpr);tx.fill();if(on){tx.strokeStyle='#fff';tx.lineWidth=2*dpr;tx.stroke();}
        tx.save();tx.beginPath();tx.rect(x+2*dpr,y,w-4*dpr,h);tx.clip();tx.fillStyle='#fff';tx.font=font;tx.textBaseline='top';
        tx.fillText(tl(`✺ ${clipName(c,'Kiai')} · ${[q.flash?'闪光':'',q.pulse?'边框':''].filter(Boolean).join(' + ')||'（都关了）'}`),x+6*dpr,y+7*dpr);tx.restore();continue;}
      if(c.kind==='text'||c.kind==='trans'){const K=c.kind,base={text:'#3f6f8f',trans:'#5c5f6b'}[K],hi={text:'#5a9ac4',trans:'#8a8f9e'}[K];
        tx.fillStyle=clipFill(c,on?hi:base);rrect(tx,x,y+3*dpr,w,h-6*dpr,CR*dpr);tx.fill();if(on){tx.strokeStyle='#fff';tx.lineWidth=2*dpr;tx.stroke();}
        if(K==='trans'){const q=c.trans;tx.fillStyle='rgba(255,255,255,.22)';tx.beginPath();if(q.type==='fadein'||q.mode==='reveal'){tx.moveTo(x,y+3*dpr);tx.lineTo(x+w,y+h-3*dpr);tx.lineTo(x,y+h-3*dpr);}else if(q.type==='flash'){tx.moveTo(x,y+3*dpr);tx.lineTo(x+w,y+h-3*dpr);tx.lineTo(x,y+h-3*dpr);}else if(q.mode==='both'&&q.type==='wipe'){tx.moveTo(x,y+h-3*dpr);tx.lineTo(x+w/2,y+3*dpr);tx.lineTo(x+w,y+h-3*dpr);}else{tx.moveTo(x,y+h-3*dpr);tx.lineTo(x+w,y+3*dpr);tx.lineTo(x+w,y+h-3*dpr);}tx.closePath();tx.fill();}
        tx.save();tx.beginPath();tx.rect(x+2*dpr,y,w-4*dpr,h);tx.clip();tx.fillStyle='#fff';tx.font=font;tx.textBaseline='top';
        const lab=K==='text'?`T ${clipName(c,'')||'「'+String(c.text.text).replace(/[*]/g,'').replace(/\//g,' ')+'」'}`:tl(`⇋ ${clipName(c,'转场')} · ${(TRANS_TYPE[c.trans.type]||'').split('（')[0]}${c.trans.type==='wipe'?' '+(TRANS_DIR[c.trans.dir]||''):''}`);
        tx.fillText(lab,x+6*dpr,y+7*dpr);tx.restore();continue;}
      if(c.kind==='hit'){tx.fillStyle=clipFill(c,on?'#c4762a':T.hit||'#8a5a2a');rrect(tx,x,y+3*dpr,w,h-6*dpr,CR*dpr);tx.fill();if(on){tx.strokeStyle='#fff';tx.lineWidth=2*dpr;tx.stroke();}
        tx.save();tx.beginPath();tx.rect(x+2*dpr,y,w-4*dpr,h);tx.clip();tx.fillStyle='rgba(255,255,255,.55)';
        for(const o of map.objs||[]){if(o.t<c.start)continue;if(o.t>c.end||o.t>v1)break;if(o.t<v0)continue;const X=px(o.t);tx.fillRect(Math.round(X),y+h-12*dpr,Math.max(1,dpr),6*dpr);}
        tx.fillStyle='#fff';tx.font=font;tx.textBaseline='top';tx.fillText(tl((c.name?'✦ '+c.name+' · ':'✦ ')+c.hit.types.map(k=>(HIT_TYPES.find(q=>q[0]===k)||[])[1]).filter(Boolean).join(' + ')||'✦ （没选效果）'),x+6*dpr,y+7*dpr);
        tx.restore();continue;}
      const m=mediaReady(c.mid);
      tx.fillStyle=clipFill(c,on?'#3a78bf':T.clip);rrect(tx,x,y+3*dpr,w,h-6*dpr,CR*dpr);tx.fill();
      if(on){tx.strokeStyle='#fff';tx.lineWidth=2*dpr;tx.stroke();}
      tx.save();tx.beginPath();tx.rect(x+2*dpr,y,w-4*dpr,h);tx.clip();
      let tx0=x+5*dpr;
      if(m&&w>40*dpr){const th=h-12*dpr,tw=Math.min(th*m.w/m.h,th*2.2);tx.globalAlpha=0.95;tx.drawImage(m.img,tx0,y+6*dpr,tw,th);tx.globalAlpha=1;tx0+=tw+5*dpr;}
      if(!m){tx.fillStyle=T.bad;}else tx.fillStyle='#fff';
      tx.font=font;tx.textBaseline='top';const med=state.media.find(q=>q.id===c.mid);tx.fillText((m?'':'⚠ ')+(c.mode==='loop'?'↻ ':c.mode==='trigger'?'⚡ ':'')+clipName(c,med?med.name:tl('丢失的素材')),tx0,y+7*dpr);
      if(c.add){tx.globalAlpha=0.75;tx.fillText(tl('加色'),tx0,y+21*dpr);tx.globalAlpha=1;}
      tx.restore();
      const kts=clipKfTimes(c);for(const kt of kts){const X=px(c.start+kt);if(X<x-1||X>x+w+1)continue;const yy=y+h-9*dpr;tx.fillStyle=on?'#fff':'rgba(255,255,255,.55)';tx.beginPath();tx.moveTo(X,yy-4*dpr);tx.lineTo(X+4*dpr,yy);tx.lineTo(X,yy+4*dpr);tx.lineTo(X-4*dpr,yy);tx.closePath();tx.fill();}
    }
  }
  {const hid=hiddenTids();for(const row of R.list){if(!row.tr||!hid.has(row.tr.id)||(row.tr.diff&&row.tr.diff!==curVer()))continue;tx.fillStyle='rgba(0,0,0,.42)';tx.fillRect(0,row.y*dpr,W,row.h*dpr);}}
  {const v=curVer();for(const row of R.list){if(!row.tr||!row.tr.diff||row.tr.diff===v)continue;tx.fillStyle='rgba(0,0,0,.5)';tx.fillRect(0,row.y*dpr,W,row.h*dpr);
    tx.fillStyle='rgba(255,255,255,.6)';tx.font=font;tx.textBaseline='middle';tx.fillText(tl(`只属于 [${row.tr.diff}]，当前难度不显示`),8*dpr,(row.y+row.h/2)*dpr);}}
  if(tdrag&&tdrag.ghost){const g=tdrag.ghost;tx.setLineDash([4*dpr,3*dpr]);tx.strokeStyle=T.sel;tx.lineWidth=2*dpr;const row=R.list.find(r=>r.tr&&r.tr.id===g.tid)||R.list[0];
    rrect(tx,px(g.s),row.y*dpr+3*dpr,Math.max(2,px(g.e)-px(g.s)),row.h*dpr-6*dpr,CR*dpr);tx.stroke();tx.setLineDash([]);}
  if(tdrag&&tdrag.kind==='box'&&tdrag.moved){const D=tdrag,r=tcv.getBoundingClientRect(),x0=(Math.min(D.x0,D.x1)-r.left)*dpr,y0=(Math.min(D.y0,D.y1)-r.top)*dpr,bw=Math.abs(D.x1-D.x0)*dpr,bh=Math.abs(D.y1-D.y0)*dpr;
    tx.fillStyle='rgba(120,170,230,.18)';tx.fillRect(x0,y0,bw,bh);tx.strokeStyle='rgba(150,195,245,.85)';tx.lineWidth=dpr;tx.strokeRect(x0+0.5,y0+0.5,bw,bh);}
  const P=Math.round(px(t));tx.fillStyle=T.sel;tx.fillRect(P-dpr*0.6,0,dpr*1.2,H);
}

