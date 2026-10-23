/* 每帧刷新 */
/* ---------- frame loop ---------- */

let sfxLast=null;
function playSfx(c,offMs){const S=soundReady(c.mid);if(!S)return;const ctx=sfx();if(ctx.state==='suspended')ctx.resume();
  const g=ctx.createGain();g.gain.value=state.muted?0:Math.pow(clamp(state.vol,0,100)/100,2)*clamp(c.vol??100,0,100)/100;
  const src=ctx.createBufferSource();src.buffer=S.buf;src.playbackRate.value=rate();src.connect(g).connect(ctx.destination);src.start(0,Math.max(0,offMs/1000));}
function tickSfx(t){
  if(!playing){sfxLast=null;return;}
  if(sfxLast==null||t<sfxLast||t-sfxLast>400){sfxLast=t;return;}
  const hid=hiddenTids(),pass=state.pvPass!==false;
  for(const c of state.clips){if(c.kind!=='snd'||c.start<=sfxLast||c.start>t)continue;const tr=state.tracks.find(x=>x.id===c.tid);if(!tr||hid.has(tr.id))continue;
    if((tr.layer==='Fail'&&pass)||(tr.layer==='Pass'&&!pass))continue;playSfx(c,t-c.start);}
  sfxLast=t;
}
function frame(){
  let t=now();tickSfx(t);
  const sig=Math.round(t)+'|'+redrawSeq+'|'+playing+'|'+Math.floor(performance.now()/500);
  if(sig===lastSig){requestAnimationFrame(frame);return;}lastSig=sig;
  if(!hasAudio()&&playing&&t>gen.duration){seek(0);t=0;}
  if(playing&&view.v1!=null&&$('#zFollow').checked){const[v0,v1]=vSpan(),sp=v1-v0;if(t>v1-sp*0.06||t<v0)setView(t-sp*0.1,t+sp*0.9);}
  {const t0=performance.now();drawScreen(t);const d=performance.now()-t0;window.__drawMs=(window.__drawMs||d)*0.9+d*0.1;}drawRuler(t);drawTracks(t);
  $('#tc').firstChild.nodeValue=tc(t);$('#tc2').textContent=tc(t);
  const r=redAt(t);const beat=Math.floor((t-r.t)/r.bl);
  $('#beatInfo').textContent=` ${Math.round(60000/r.bl)} BPM · 拍 ${beat>=0?(beat%r.meter)+1:'-'}/${r.meter}`;
  updateFxValues(false);
  requestAnimationFrame(frame);
}
glvInit();glvAttach();
new ResizeObserver(()=>{fitMonitor();fitCanvas(rcv);fitCanvas(tcv);redraw();}).observe(document.body);
new ResizeObserver(()=>{fitMonitor();redraw();}).observe($('#screenbox'));
new ResizeObserver(()=>{fitCanvas(rcv);fitCanvas(tcv);redraw();}).observe($('#tlscroll'));

