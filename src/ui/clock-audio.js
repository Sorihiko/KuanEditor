/* 播放时钟、音量 / 静音 / 播放速度 */
/* ---------- clock ---------- */
let playing=false,clockT=0,clockPos=0;
const hasAudio=()=>!!audio.src&&audio.readyState>0;
const rate=()=>clamp(+state.rate||1,0.1,4);
/* without audio the preview runs on an internal clock that follows the playback speed */
function now(){if(hasAudio())return audio.currentTime*1000;return playing?clockPos+(performance.now()-clockT)*rate():clockPos;}
function seek(t){t=Math.max(0,Math.min(gen.duration,t));if(hasAudio())audio.currentTime=t/1000;clockPos=t;clockT=performance.now();}
function setPlaying(p){
  if(!hasAudio()){clockPos=now();clockT=performance.now();}
  playing=p;
  if(hasAudio()){if(p)audio.play().catch(()=>{playing=false;updIcon();});else audio.pause();}
  updIcon();}
/* ---------- audio settings: volume, mute, playback speed ---------- */
function applyAudio(){
  audio.volume=Math.pow(clamp(state.vol,0,100)/100,2);audio.muted=!!state.muted;
  audio.defaultPlaybackRate=audio.playbackRate=rate();try{audio.preservesPitch=true;}catch(e){}
  const v=$('#vol');if(v&&document.activeElement!==v)v.value=state.vol;
  const mb=$('#muteBtn');if(mb){const off=state.muted||state.vol==0;mb.setAttribute('aria-pressed',String(!!state.muted));mb.title=state.muted?'取消静音（M）':'静音（M）';
    mb.innerHTML=off?'<svg viewBox="0 0 20 20"><path d="M3 8h3l4-3v10l-4-3H3z"/><path d="M13 8l4 4M17 8l-4 4"/></svg>':'<svg viewBox="0 0 20 20"><path d="M3 8h3l4-3v10l-4-3H3z"/><path d="M13 7.5a3.5 3.5 0 0 1 0 5M15 5.5a6.5 6.5 0 0 1 0 9"/></svg>';}
  const r=$('#rateSel');if(r)r.value=String(rate());
  $('#volVal')&&($('#volVal').textContent=state.muted?'静音':state.vol+'%');
}
function setRate(v){if(!hasAudio()){clockPos=now();clockT=performance.now();}state.rate=v;applyAudio();save();}
function updIcon(){$('#playIcon').innerHTML=playing?'<path d="M5 3h4v14H5zM11 3h4v14h-4z"/>':'<path d="M5 3l12 7-12 7z"/>';$('#play').setAttribute('aria-label',playing?'暂停':'播放');}
$('#play').addEventListener('click',()=>setPlaying(!playing));
audio.addEventListener('ended',()=>{playing=false;updIcon();});
audio.addEventListener('loadedmetadata',applyAudio);
$('#vol').addEventListener('input',e=>{state.vol=+e.target.value;if(state.vol>0)state.muted=false;applyAudio();});
$('#vol').addEventListener('change',save);
$('#muteBtn').addEventListener('click',()=>{state.muted=!state.muted;applyAudio();save();});
$('#rateSel').addEventListener('change',e=>setRate(+e.target.value));
function jumpLine(dir){const t=now();const ls=gen.lines;if(!ls.length)return;
  if(dir>0){const n=ls.find(l=>l.S>t+30);seek(n?n.S-150:ls[ls.length-1].S-150);}else{const p=[...ls].reverse().find(l=>l.S<t-400);seek(p?p.S-150:0);}}
$('#prevL').addEventListener('click',()=>jumpLine(-1));$('#nextL').addEventListener('click',()=>jumpLine(1));

