/* 时间轴上的拖动、裁剪、切开、吸附 */
/* ---------- timeline interaction ---------- */
let tdrag=null,scrub=false;
function hitTimeline(e){
  const row=rowAtY(e.clientY);if(!row||row.notes)return{row,kind:'empty'};
  const t=xToT(e.clientX),r=tcv.getBoundingClientRect(),xc=e.clientX,E=6;
  if(row.tr.lyric){
    const CL=charLine();if(CL&&e.clientY-r.top>=row.y+28){const K=charTicks(CL);let bi=-1,bd=6;K.times.forEach((ct,i)=>{const d=Math.abs(xc-tToX(ct));if(d<bd){bd=d;bi=i;}});if(bi>=0)return{row,kind:'char',L:CL,ci:bi};}
    for(const L of gen.lines){const xs=tToX(L.S),xe=tToX(L.E);if(xc<xs-E||xc>xe+E)continue;
      if(Math.abs(xc-xs)<=E&&xe-xs>14)return{row,kind:'lstart',L};if(Math.abs(xc-xe)<=E&&xe-xs>14)return{row,kind:'lend',L};if(xc>=xs&&xc<=xe)return{row,kind:'lmove',L};}
    return{row,kind:'empty'};}
  const c0=selClip();
  if(c0&&c0.tid===row.tr.id){const yb=r.top+row.y+row.h-9;if(Math.abs(e.clientY-yb)<=6)for(const kt of clipKfTimes(c0)){if(Math.abs(xc-tToX(c0.start+kt))<=5)return{row,kind:'kf',c:c0,kt};}}
  const cs=state.clips.filter(c=>c.tid===row.tr.id&&xc>=tToX(c.start)-E&&xc<=tToX(c.end)+E);
  for(const c of cs.reverse()){const xs=tToX(c.start),xe=tToX(c.end);
    if(c.kind!=='imp'&&c.kind!=='snd'){if(Math.abs(xc-xs)<=E&&xe-xs>14)return{row,kind:'trimL',c};if(Math.abs(xc-xe)<=E&&xe-xs>14)return{row,kind:'trimR',c};}if(xc>=xs&&xc<=xe)return{row,kind:'move',c};}
  return{row,kind:'empty',t};
}
/* marquee: clips (or, if no clips, lyric lines) touched by the rectangle become the selection; Shift/Ctrl adds to it */
function boxSelect(D){
  const r=tcv.getBoundingClientRect(),ya=Math.min(D.y0,D.y1)-r.top,yb=Math.max(D.y0,D.y1)-r.top,ta=xToT(Math.min(D.x0,D.x1)),tb=xToT(Math.max(D.x0,D.x1));
  const rows=rowsLayout().list.filter(R=>R.tr&&R.y+R.h>ya&&R.y<yb),hid=hiddenTids();
  const ids=[],keys=[];
  for(const R of rows){if(R.tr.lyric){for(const L of gen.lines)if(L.E>ta&&L.S<tb)keys.push(L.src.key);continue;}
    if(hid.has(R.tr.id)&&R.tr.diff&&R.tr.diff!==curVer())continue;
    for(const c of state.clips)if(c.tid===R.tr.id&&c.end>ta&&c.start<tb)ids.push(c.id);}
  const B=D.add?D.base:null;
  if(ids.length||(B&&B.type==='clip'&&!keys.length)){const all=[...new Set([...(B&&B.type==='clip'?(B.ids||[B.id]):[]),...ids])];sel=all.length?{type:'clip',id:all[0],ids:all}:null;}
  else if(keys.length){const all=[...new Set([...(B&&B.type==='line'?(B.keys||[B.key]):[]),...keys])];sel={type:'line',key:all[0],keys:all};}
  else sel=B||null;
}
/* tap mode: play from a little before the line and press J on each character */
let tapState=null;
function startTap(L){if(charEditBlocked(L.src))return;const K=charTicks(L);if(!K.chars.length)return;
  tapState={key:L.src.key,i:0,times:K.times.slice(),chars:K.chars,S:L.S,E:L.E};seek(Math.max(0,L.S-2*beatAt(L.S)));setPlaying(true);renderFx();
  toast(`播放中：每唱到一个字按一下 J（第 1 个「${K.chars[0]}」），Esc 取消`);}
function endTap(save){const T=tapState;tapState=null;if(!T)return;setPlaying(false);
  const L=gen.lines.find(l=>l.src.key===T.key);if(save&&L&&setLineCharTimes(L,T.times)){renderFiles();regenerate();toast(`已给「${T.chars.join('')}」打好 ${T.chars.length} 个字的时间`,'good');}else{renderFx();if(!save)toast('已取消打点');}}
document.addEventListener('keydown',e=>{if(!tapState)return;const k=e.key.toLowerCase();
  if(k==='escape'){e.preventDefault();e.stopPropagation();endTap(false);return;}
  if(k!=='j'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;e.preventDefault();e.stopPropagation();const T=tapState;
  const lo=T.i>0?T.times[T.i-1]+15:T.S;T.times[T.i]=Math.round(clamp(now(),lo,Math.max(lo,T.E-60)));T.i++;
  for(let j=T.i;j<T.times.length;j++)if(T.times[j]<T.times[j-1]+15)T.times[j]=T.times[j-1]+15;
  if(T.i>=T.times.length)endTap(true);else $('#tlInfo').textContent=`打点 ${T.i}/${T.times.length} · 下一个「${T.chars[T.i]}」`;},true);
function toggleLine(k){const ks=selKeys().slice();const i=ks.indexOf(k);if(i>=0)ks.splice(i,1);else ks.push(k);
  sel=ks.length?{type:'line',key:ks.includes(sel.key)?sel.key:ks[0],keys:ks}:null;renderFx();toast(ks.length?`已选中 ${ks.length} 句`:'已取消选择');}
function splitClip(c,t){
  if(t<=c.start+30||t>=c.end-30)return;const k=t-c.start;
  const b=JSON.parse(JSON.stringify(c));b.id=uid();b.start=Math.round(t);
  if(c.kind==='imp'||c.kind==='snd'){toast(c.kind==='snd'?'音效不能切开':'导入的 .osb 不能切开，只能整体平移');return;}
  if(c.kind==='hit'||c.kind==='kiai'||c.kind==='spec'||c.kind==='part'||c.kind==='text'||c.kind==='trans'){c.end=Math.round(t);state.clips.push(b);sel={type:'clip',id:b.id};commit();toast('已切开片段');return;}
  for(const p of Object.values(b.props))if(p.kf){
    const keep=p.kf.filter(q=>q.t>=k).map(q=>({...q,t:q.t-k}));
    const vAt=kfVal(p,k);const left=[...p.kf].reverse().find(q=>q.t<k);
    p.kf=[{t:0,v:vAt,e:left?left.e:0},...keep.filter(q=>q.t>0)];if(p.kf.length<2&&!keep.length){p.v=vAt;}}
  for(const p of Object.values(c.props))if(p.kf){const vAt=kfVal(p,k);p.kf=p.kf.filter(q=>q.t<k);p.kf.push({t:k,v:vAt,e:0});}
  c.end=Math.round(t);state.clips.push(b);sel={type:'clip',id:b.id};commit();toast('已切开片段');
}
tcv.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;tcv.setPointerCapture(e.pointerId);
  if(tool==='hand'){const[v0,v1]=vSpan();tdrag={kind:'pan',x0:e.clientX,v0,v1};tcv.style.cursor='grabbing';return;}
  const h=hitTimeline(e);
  if(tool==='razor'){if(h.c&&(h.kind==='move'||h.kind==='trimL'||h.kind==='trimR'))splitClip(h.c,snapTime(xToT(e.clientX),h.c.id,e.shiftKey));return;}
  if(h.row&&isImg(h.row.tr)&&activeTid!==h.row.tr.id){activeTid=h.row.tr.id;renderHeaders();}
  if(h.kind==='empty'){tdrag={kind:'box',x0:e.clientX,y0:e.clientY,x1:e.clientX,y1:e.clientY,moved:false,add:e.shiftKey||e.ctrlKey||e.metaKey,base:sel};return;}
  const prevSel=sel;
  if(h.c){const ids=selIds();
    if(ids.length>1&&ids.includes(h.c.id))sel={type:'clip',id:h.c.id,ids};else sel={type:'clip',id:h.c.id};}
  else if(h.L){const k=h.L.src.key;
    if((e.ctrlKey||e.metaKey)&&sel&&sel.type==='line'){toggleLine(k);return;}
    if(!(selKeys().length>1&&selKeys().includes(k)))sel={type:'line',key:k};}
  renderFx();
  const orig=h.c?JSON.parse(JSON.stringify(h.c)):null;
  const group=h.c&&h.kind==='move'&&selIds().length>1?selIds().map(clipById).filter(Boolean).map(c=>({c,s:c.start,e:c.end})):null;
  tdrag={prevSel,group,ci:h.ci,kind:h.kind,c:h.c||null,L:h.L||null,kt:h.kt,orig,x0:e.clientX,y0:e.clientY,t0:xToT(e.clientX),moved:false,row:h.row};
});
tcv.addEventListener('pointermove',e=>{
  if(!tdrag){
    if(scrub){seek(scrubT(e));return;}
    if(tool!=='sel')return;const h=hitTimeline(e);
    tcv.style.cursor=h.kind==='trimL'||h.kind==='trimR'||h.kind==='lstart'||h.kind==='lend'||h.kind==='char'?'ew-resize':h.kind==='move'||h.kind==='lmove'?'grab':h.kind==='kf'?'pointer':'default';
    const t=xToT(e.clientX),info={trimL:'拖动裁剪入点',trimR:'拖动裁剪出点',move:'拖动移动片段（可换轨道）',kf:'拖动关键帧改时间，点一下跳过去',lstart:'拖动只改这一句的开始',lend:'拖动只改这一句的结束',char:'拖动调整这个字出现的时间，点一下跳过去',lmove:'拖动整句移动（长度不变）'}[h.kind];
    $('#tlInfo').textContent=tc(t)+(info?' · '+info:'')+(h.L?` · 「${h.L.text.replace(/\*/g,'').replace(/\//g,' ')}」`:'');return;}
  const D=tdrag;
  if(D.kind==='pan'){const r=tcv.getBoundingClientRect(),dt=(e.clientX-D.x0)/r.width*(D.v1-D.v0);setView(D.v0-dt,D.v1-dt);return;}
  if(D.kind==='char'){if(!D.moved&&Math.abs(e.clientX-D.x0)<3)return;D.moved=true;const L=D.L,K=D.ticks||(D.ticks=charTicks(L)),n=K.times.length,i=D.ci;
    const lo=i>0?K.times[i-1]+15:L.S,hi=i<n-1?K.times[i+1]-15:L.E-60;const tt=clamp(Math.round(snapTime(xToT(e.clientX),null,e.shiftKey)),lo,Math.max(lo,hi));
    const nt=K.times.slice();nt[i]=tt;D.newTimes=nt;$('#tlInfo').textContent=`「${K.chars[i]}」 ${tc(tt)}${e.shiftKey?'（只吸播放头）':''}`;return;}
  if(D.kind==='box'){D.x1=e.clientX;D.y1=e.clientY;if(!D.moved&&Math.hypot(D.x1-D.x0,D.y1-D.y0)<4)return;D.moved=true;boxSelect(D);return;}
  if(!D.moved&&Math.abs(e.clientX-D.x0)<4&&!(D.kind==='move'&&Math.abs(e.clientY-D.y0)>8))return;D.moved=true;
  const t=xToT(e.clientX),free=e.shiftKey,dt=t-D.t0;
  if(D.c){const c=D.c,o=D.orig,dur=o.end-o.start;
    if(D.kind==='move'&&D.group){const gx=D.gx||(D.gx=new Set(D.group.map(g=>g.c.id)));let s=snapTime(o.start+dt,gx,free);const s2=snapTime(o.end+dt,gx,free);{const ds=s-(o.start+dt),de=s2-(o.end+dt);if(de!==0&&(ds===0||Math.abs(de)<Math.abs(ds)))s=s2-dur;}
      let d=Math.round(s-o.start);d=Math.max(d,-Math.min(...D.group.map(g=>g.s)));for(const g of D.group){g.c.start=g.s+d;g.c.end=g.e+d;}rebuild();$('#tlInfo').textContent=`${D.group.length} 个片段 · ${d>=0?'+':''}${(d/1000).toFixed(3)} 秒`;return;}
    if(D.kind==='move'){let s=snapTime(o.start+dt,c.id,free);const s2=snapTime(o.end+dt,c.id,free);{const ds=s-(o.start+dt),de=s2-(o.end+dt);if(de!==0&&(ds===0||Math.abs(de)<Math.abs(ds)))s=s2-dur;}
      s=Math.max(0,Math.round(s));c.start=s;c.end=s+dur;const row=rowAtY(e.clientY);if(row&&row.tr&&c.kind!=='imp'&&trackKind(row.tr)===clipKind(c))c.tid=row.tr.id;}
    else if(D.kind==='trimL'){let s=Math.round(clamp(snapTime(o.start+dt,c.id,free),0,o.end-50));const d=s-o.start;c.start=s;
      if(c.props)for(const k of Object.keys(c.props)){const K=o.props[k].kf;if(K)c.props[k].kf=K.map(q=>({...q,t:q.t-d}));}}
    else if(D.kind==='trimR'){c.end=Math.round(Math.max(o.start+50,snapTime(o.end+dt,c.id,free)));}
    else if(D.kind==='kf'){const nt=clamp(Math.round(snapTime(o.start+D.kt+dt,c.id,free)-o.start),0,o.end-o.start);
      for(const k of Object.keys(c.props)){const K=o.props[k].kf;if(!K)continue;c.props[k].kf=K.map(q=>Math.abs(q.t-D.kt)<=2?{...q,t:nt}:q).sort((a,b)=>a.t-b.t);}}
    rebuild();$('#tlInfo').textContent=`${tc(c.start)} – ${tc(c.end)}`;return;}
  if(D.L){const L=D.L;const B=lineInfo(L);if(!B)return;
    if(D.kind==='lmove'){const len=L.E-L.S,ph=now();let s=((free||state.magnet)&&Math.abs(L.E+dt-ph)<headTol()&&Math.abs(L.S+dt-ph)>=headTol())?ph-len:lyricTarget(L.S+dt,free);s=clamp(s,B.minS,B.maxS);D.ghost={tid:'lyrics',s,e:s+L.E-L.S};D.newT=s;}
    else if(D.kind==='lstart'){const s=clamp(lyricTarget(L.S+dt,free),B.minS-0,L.E-200);D.ghost={tid:'lyrics',s,e:L.E};D.newT=s;}
    else if(D.kind==='lend'){const en=clamp(lyricTarget(L.E+dt,free),L.S+200,B.maxE);D.ghost={tid:'lyrics',s:L.S,e:en};D.newT=en;}
    const ph=now(),onHead=(free||state.magnet)&&(Math.abs(D.ghost.s-ph)<0.5||Math.abs(D.ghost.e-ph)<0.5);D.headSnap=onHead;
    D.free=free||onHead;$('#tlInfo').textContent=`${tc(D.ghost.s)} – ${tc(D.ghost.e)}${onHead?'（吸附到播放头）':free?'（只吸播放头）':''}`;}
});
tcv.addEventListener('pointerup',e=>{
  scrub=false;const D=tdrag;tdrag=null;if(!D)return;
  if(D.kind==='pan'){tcv.style.cursor='grab';return;}
  if(D.kind==='char'){if(D.moved&&D.newTimes){const L=D.L;if(setLineCharTimes(L,D.newTimes)){renderFiles();regenerate();toast(`「${charTicks(L).chars[D.ci]}」改到 ${tc(D.newTimes[D.ci])}`,'good');}}
    else{const K=charTicks(D.L);seek(K.times[D.ci]);}return;}
  if(D.kind==='box'){if(!D.moved&&!D.add&&sel){sel=null;renderFx();}else if(D.moved){renderFx();const n=selIds().length||selKeys().length;if(n)toast(`已框选 ${n} 个${sel.type==='clip'?'片段':'句子'}`);}return;}
  if(!D.moved&&D.L&&e.shiftKey&&D.prevSel&&D.prevSel.type==='line'){
    const ks=gen.lines.map(l=>l.src.key),a=ks.indexOf(D.prevSel.key),b=ks.indexOf(D.L.src.key);
    if(a>=0&&b>=0){sel={type:'line',key:D.prevSel.key,keys:ks.slice(Math.min(a,b),Math.max(a,b)+1)};renderFx();toast(`已选中 ${sel.keys.length} 句`);return;}}
  if(!D.moved&&D.c&&(e.ctrlKey||e.metaKey||e.shiftKey)){/* Ctrl/Shift-click (no drag) adds / removes the clip from the selection */
    const P=D.prevSel,ids=P&&P.type==='clip'?(P.ids&&P.ids.length?P.ids:[P.id]):[],id=D.c.id,n=ids.includes(id)?ids.filter(x=>x!==id):[...ids,id];
    sel=n.length?{type:'clip',id:n.includes(id)?id:n[n.length-1],ids:n}:null;renderFx();return;}
  if(!D.moved&&D.c&&D.group){sel={type:'clip',id:D.c.id};}
  if(!D.moved&&D.L&&selKeys().length>1&&!e.shiftKey){sel={type:'line',key:D.L.src.key};renderFx();}
  if(!D.moved){
    if(D.kind==='kf'&&D.c){seek(D.c.start+D.kt);}
    else if(D.c){const c=D.c;if(now()<c.start||now()>c.end)seek(c.start+Math.min(300,(c.end-c.start)/2));}
    else if(D.L){const L=D.L;if(now()<L.S||now()>=L.E)seek(L.S+Math.min(900,(L.E-L.S)/2));}
    renderFx();return;}
  if(D.c){commit();return;}
  if(D.L&&D.newT!=null){const L=D.L;
    if(D.kind==='lmove')moveBlock(L,D.newT,D.free);else if(D.kind==='lstart')moveStart(L,D.newT,D.free);else moveEnd(L,D.newT);
    renderFiles();regenerate();toast(D.kind==='lmove'?`整句移到 ${tc(D.newT)}`:D.kind==='lstart'?`开始改为 ${tc(D.newT)}`:`结束改为 ${tc(D.newT)}`,'good');}
});
tcv.addEventListener('pointercancel',()=>{tdrag=null;scrub=false;});
tcv.addEventListener('dragover',e=>{const tps=e.dataTransfer.types;if(tps.includes('application/x-kuan-gen')){e.preventDefault();e.dataTransfer.dropEffect='copy';const s=snapTime(xToT(e.clientX),null,e.shiftKey);tdrag={ghost:{tid:null,s,e:s+16*beatAt(s)},kind:'dropghost'};return;}
  if(tps.includes('application/x-kuan-media')||tps.includes('Files')){e.preventDefault();e.dataTransfer.dropEffect='copy';
  const row=rowAtY(e.clientY);const tid=row&&isImg(row.tr)?row.tr.id:activeTid;const s=snapTime(xToT(e.clientX),null,e.shiftKey);tdrag={ghost:{tid,s,e:s+Math.max(2000,8*beatAt(s))},kind:'dropghost'};}});
tcv.addEventListener('dragleave',()=>{if(tdrag&&tdrag.kind==='dropghost')tdrag=null;});
tcv.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();if(tdrag&&tdrag.kind==='dropghost')tdrag=null;
  const row=rowAtY(e.clientY);const tid=row&&isImg(row.tr)?row.tr.id:(activeTid||(imageTracks()[0]||{}).id);const t=snapTime(xToT(e.clientX),null,e.shiftKey);
  const gk=e.dataTransfer.getData('application/x-kuan-gen');if(gk){genAdd(gk,gk==='img'||gk==='snd'?{}:{t:Math.max(0,Math.round(t))});return;}
  const mid=e.dataTransfer.getData('application/x-kuan-media');
  if(mid){addMediaToTrack(mid,tid,t);return;}
  if(row&&row.tr&&row.tr.snd&&e.dataTransfer.files&&e.dataTransfer.files.length){const fs=[...e.dataTransfer.files].filter(f=>/^audio\//.test(f.type)||/\.(wav|ogg|mp3)$/i.test(f.name));
    if(fs.length){const before=state.media.length;importSounds(fs).then(()=>{for(const m of state.media.slice(before))addSound(m.id,t,row.tr.id);});return;}}
  if(e.dataTransfer.files&&e.dataTransfer.files.length){if(!tid){toast('先添加一条图片轨道','err');return;}importImages([...e.dataTransfer.files],{tid,t});}
});
rcv.addEventListener('pointerdown',e=>{rcv.setPointerCapture(e.pointerId);scrub=true;seek(scrubT(e));});
rcv.addEventListener('pointermove',e=>{if(scrub){seek(scrubT(e));return;}
  /* hover info for the line under the cursor */
  const H=state.rulerHide||{},tol=headTol()*0.6,t=xToT(e.clientX),near=(arr,f)=>{let b=null,bd=tol;for(const x of arr||[]){const d=Math.abs(f(x)-t);if(d<bd){bd=d;b=x;}}return b;};
  const r=!H.red&&near(map.red,x=>x.t),g=!H.green&&near(map.green,x=>x.t),bk=!H.blue&&near(map.bookmarks,x=>x);
  const parts=[];if(r)parts.push(`红线 ${tc(r.t)} · ${Math.round(60000/r.bl*10)/10} BPM · ${r.meter}/4 拍`);if(g)parts.push(`绿线 ${tc(g.t)} · 滑条速度 ${g.sv}×`);if(bk!=null&&bk!==false)parts.push(`蓝线（书签） ${tc(bk)}`);
  $('#tlInfo').textContent=parts.length?parts.join('　|　'):tc(t);});
rcv.addEventListener('pointerup',()=>{scrub=false;});
for(const el of [rcv,tcv])el.addEventListener('wheel',e=>{e.preventDefault();const[v0,v1]=vSpan(),r=tcv.getBoundingClientRect();
  if(e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)){const dpx=e.deltaX||e.deltaY;setView(v0+dpx/r.width*(v1-v0),v1+dpx/r.width*(v1-v0));}
  else zoomAt(xToT(e.clientX),Math.exp(e.deltaY*0.0016));},{passive:false});
$('#zIn').addEventListener('click',()=>zoomAt(now(),0.5));$('#zOut').addEventListener('click',()=>zoomAt(now(),2));$('#zAll').addEventListener('click',()=>{view.v0=0;view.v1=null;});


/* ruler legend: click Kiai / 红线 / 绿线 / 蓝线 to show or hide them */
function syncLegend(){const H=state.rulerHide||{};for(const b of document.querySelectorAll('#rulerLegend button'))b.classList.toggle('off',!!H[b.dataset.k]);}
for(const b of document.querySelectorAll('#rulerLegend button'))b.addEventListener('click',()=>{const H=state.rulerHide=Object.assign({},state.rulerHide||{});H[b.dataset.k]=!H[b.dataset.k];save();syncLegend();redraw();});
syncLegend();
