/* 界面通用：画布、选中状态、toast 提示、小工具 */
/* ================= UI ================= */
const audio=$('#audio');const cv=$('#cv'),cx=cv.getContext('2d');
const rcv=$('#ruler'),rx=rcv.getContext('2d'),tcv=$('#tracks'),tx=tcv.getContext('2d');
let sel=null;               // {type:'clip',id} | {type:'line',key,keys:[...]}
let tool='sel', activeTid=null;
let kiaiMigReady=false;   /* old projects' global kiai switches are converted once the real map is loaded (ui/tracks.js) */
function toast(msg,kind){const t=$('#toast');t.textContent=msg;t.className='toast'+(kind?' '+kind:'');clearTimeout(toast.h);if(msg)toast.h=setTimeout(()=>{t.textContent='';},kind==='err'?6000:3200);}
function tc(t){t=Math.max(0,Math.floor(t));const m=Math.floor(t/60000),s=Math.floor(t/1000)%60,ms=t%1000;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}:${String(ms).padStart(3,'0')}`;}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clipById=id=>state.clips.find(c=>c.id===id)||null;
const selClip=()=>sel&&sel.type==='clip'?clipById(sel.id):null;
const isImg=t=>!!t&&!t.lyric&&!t.kiaiFx&&!t.hit&&!t.spec&&!t.part&&!t.imp&&!t.snd&&!t.text&&!t.trans;
const trackKind=t=>!t?null:t.lyric?'lyric':t.kiaiFx?'kiai':t.hit?'hit':t.spec?'spec':t.part?'part':t.imp?'imp':t.snd?'snd':t.text?'text':t.trans?'trans':'img';
const clipKind=c=>c.kind||'img';
const imageTracks=()=>state.tracks.filter(isImg);
/* all selected clip ids (box / Ctrl-click selection keeps them in sel.ids; sel.id is the one shown in the panels) */
const selIds=()=>sel&&sel.type==='clip'?(sel.ids&&sel.ids.length?sel.ids:[sel.id]):[];
const selKeys=()=>sel&&sel.type==='line'?(sel.keys&&sel.keys.length?sel.keys:[sel.key]):[];
const lineText=L=>L.text.replace(/\*/g,'').replace(/\//g,' ');

/* keep each slider's filled part (--p) in sync, also when code sets .value directly */
function paintRange(el){const mn=+el.min||0,mx=el.max===''?100:+el.max,v=+el.value;el.style.setProperty('--p',(mx>mn?(v-mn)/(mx-mn)*100:0)+'%');}
document.addEventListener('input',e=>{if(e.target.type==='range')paintRange(e.target);},true);
{const d=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
  Object.defineProperty(HTMLInputElement.prototype,'value',{configurable:true,get(){return d.get.call(this);},set(v){d.set.call(this,v);if(this.type==='range')paintRange(this);}});}
new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes){if(n.nodeType!==1)continue;if(n.type==='range')paintRange(n);else if(n.querySelectorAll)n.querySelectorAll('input[type=range]').forEach(paintRange);}}).observe(document.documentElement,{childList:true,subtree:true});
document.querySelectorAll('input[type=range]').forEach(paintRange);
/* while a slider is being dragged, show its value in a bubble above the knob */
const rangeTip=document.createElement('div');rangeTip.className='rangetip';rangeTip.hidden=true;document.body.appendChild(rangeTip);
let tipEl=null;
function placeTip(){if(!tipEl)return;const r=tipEl.getBoundingClientRect(),mn=+tipEl.min||0,mx=tipEl.max===''?100:+tipEl.max,v=+tipEl.value,k=mx>mn?(v-mn)/(mx-mn):0,th=14;
  const st=+tipEl.step||1,dec=st<1?Math.min(3,String(st).split('.')[1].length):0;
  rangeTip.textContent=v.toFixed(dec);rangeTip.style.left=(r.left+th/2+k*(r.width-th))+'px';rangeTip.style.top=(r.top+r.height/2-12)+'px';}
document.addEventListener('pointerdown',e=>{const t=e.target;if(t&&t.type==='range'&&!t.disabled){tipEl=t;rangeTip.hidden=false;placeTip();}},true);
document.addEventListener('input',e=>{if(e.target===tipEl)placeTip();},true);
for(const ev of ['pointerup','pointercancel'])document.addEventListener(ev,()=>{tipEl=null;rangeTip.hidden=true;},true);
