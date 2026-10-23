/* 生成、提交改动、撤销 / 重做 */
/* ---------- build / commit / history ---------- */
let regenTimer=null,genToken=0,statsTimer=null;
function schedule(){clearTimeout(regenTimer);regenTimer=setTimeout(regenerate,180);}
function rebuild(){try{buildAll();}catch(e){toast('生成失败：'+e.message,'err');console.error(e);}redraw();if(kiaiMigReady&&('fxFlash' in state||'fxPulse' in state))setTimeout(migrateKiai,0);}
async function regenerate(){
  const my=++genToken;
  const text=[...new Set((state.lrc.replace(/\[[^\]]*\]/g,'')).replace(/[\s*\/]/g,''))].join('')||'字';
  try{await Promise.race([Promise.all([...[...new Set([state.font,...Object.values(state.lineStyle).map(o=>o.font).filter(Boolean)])].map(f=>document.fonts.load(`900 64px ${FONTS[f]||FONTS.sans}`,text)),document.fonts.load('900 64px "Noto Sans SC"',text)]),new Promise(r=>setTimeout(r,4000))]);}catch(e){}
  if(my!==genToken)return;
  rebuild();finish();
}
function commit(){rebuild();finish();}
function finish(){if(dirH&&state.autoSave){clearTimeout(autoT);autoT=setTimeout(()=>saveToFolder(true),1500);}scheduleStats();updateCharHint();save();recordHistory();renderHeaders();renderFx();renderBin();}
function save(){try{localStorage.setItem('kuan-opts',JSON.stringify(state));}catch(e){}}
if(document.fonts&&document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',()=>{glyphCache.clear();glyphEpoch++;schedule();});
const hist={list:[],i:-1,restoring:false};
function recordHistory(){
  if(hist.restoring){hist.restoring=false;return;}
  const s1=JSON.stringify(state);if(hist.i>=0&&hist.list[hist.i]===s1)return;
  hist.list.length=hist.i+1;hist.list.push(s1);if(hist.list.length>150)hist.list.shift();hist.i=hist.list.length-1;updUndo();
}
function restoreHistory(k){
  const j=hist.i+k;if(j<0||j>=hist.list.length)return false;hist.i=j;
  const o=JSON.parse(hist.list[j]);for(const key of Object.keys(state))delete state[key];Object.assign(state,o);sanitizeState();
  if(sel&&sel.type==='clip'&&!clipById(sel.id))sel=null;
  hist.restoring=true;lrcName=null;glyphCache.clear();glyphEpoch++;syncUI();renderFiles();
  Promise.all(state.media.map(loadMedia)).then(()=>{clearTimeout(regenTimer);regenerate();});updUndo();return true;
}
const canUndo=()=>hist.i>0,canRedo=()=>hist.i<hist.list.length-1;
function updUndo(){}
function undo(){if(restoreHistory(-1))toast('已撤销');}
function redo(){if(restoreHistory(1))toast('已重做');}

