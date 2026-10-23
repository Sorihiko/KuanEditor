/* 导出页的 sprite 统计与 SB load */
/* ---------- stats ---------- */
/* stats (SB load needs every sprite evaluated across the song) only run while the export tab is open, in small slices */
let statsTok=0,statsDirty=true;
function scheduleStats(){statsDirty=true;clearTimeout(statsTimer);if(!$('#pane-out').hidden)statsTimer=setTimeout(computeStats,350);}
function computeStats(){
  statsDirty=false;const my=++statsTok,list=sprites;
  let lines=0;const keys=new Set();
  for(const s of list){lines+=1+s.cmds.length;for(const L of s.loops)lines+=1+L.cmds.length;for(const T of s.trigs||[])lines+=1+T.cmds.length;if(s.glyph)keys.add(s.glyph.key);}
  $('#stSprites').textContent=list.length;$('#stLines').textContent=lines.toLocaleString();$('#stGlyphs').textContent=keys.size;$('#fname').textContent=osbName();
  /* per-track size and what the export optimisation saves */
  {const per=new Map();let raw=0;for(const s of list){const b=spriteBytes(s);raw+=b;const r=per.get(s.tid)||{n:0,b:0};r.n++;r.b+=b;per.set(s.tid,r);}
    let opt=null;try{const o=optimizeSprites(list);fmtDec=3;let ob=0,ol=0;for(const s of o){ob+=spriteBytes(s);ol+=1+s.cmds.length+s.loops.reduce((a,L)=>a+1+L.cmds.length,0)+(s.trigs||[]).reduce((a,T)=>a+1+T.cmds.length,0);}fmtDec=4;opt={n:o.length,b:ob,l:ol};}catch(e){fmtDec=4;}
    const kb=b=>b>1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB';
    $('#optInfo').textContent=opt?`优化后：${opt.n.toLocaleString()} 个 sprite（原 ${list.length.toLocaleString()}）· ${opt.l.toLocaleString()} 行（原 ${lines.toLocaleString()}）· .osb 约 ${kb(opt.b)}（原 ${kb(raw)}）`:'';
    const box=$('#trackStats');box.innerHTML='';const rows=[...per.entries()].map(([tid,r])=>({tr:state.tracks.find(t=>t.id===tid),...r})).filter(r=>r.tr).sort((a,b)=>b.b-a.b);
    for(const r of rows){const d=document.createElement('div');d.className='tsrow';const pct=raw?r.b/raw:0;
      d.innerHTML=`<span class="nm">${esc(r.tr.name)}${r.tr.hidden?'（已隐藏）':''}</span><span class="bar"><i style="width:${(pct*100).toFixed(1)}%"></i></span><span class="v">${r.n.toLocaleString()} 个 · ${kb(r.b)}</span>`;box.appendChild(d);}}
  const ord=list.filter(s=>isFinite(s.tStart)).sort((a,b)=>a.tStart-b.tStart);
  const dur=gen.duration,stepT=Math.max(100,dur/500);let t=0,i=0,sum=0,n=0,peak=0;const act=[];
  $('#ldAvg').textContent='…';$('#ldPeak').textContent='…';
  const slice=()=>{if(my!==statsTok)return;const t0=performance.now();
    for(;t<=dur&&performance.now()-t0<12;t+=stepT){
      while(i<ord.length&&ord[i].tStart<=t)act.push(ord[i++]);
      let a=0;for(let k=act.length-1;k>=0;k--){const s=act[k];if(s.tEnd<t){act.splice(k,1);continue;}const e=evalSprite(s,t);if(!e)continue;const w=s.glyph?s.glyph.w:1,h=s.glyph?s.glyph.h:1;a+=Math.abs(w*h*e.sc*e.sc*e.vec[0]*e.vec[1]);}
      const r=a/(640*480);sum+=r;n++;if(r>peak)peak=r;}
    if(t<=dur){setTimeout(slice,0);return;}
    const avg=n?sum/n:0;
    $('#ldAvg').textContent=avg.toFixed(2)+'×';$('#ldPeak').textContent=peak.toFixed(2)+'×';
    $('#mAvg').style.width=Math.min(100,avg/8*100)+'%';$('#mPeak').style.width=Math.min(100,peak/8*100)+'%';
    const col=peak>5?'var(--bad)':peak>3?'var(--warn)':'var(--ok)';$('#mAvg').style.background=`color-mix(in srgb, ${col} 60%, transparent)`;};
  slice();
}
function updateCharHint(){const ent=parseLrc(state.lrc).filter(e=>e.text);const own=ent.filter(e=>e.chars).length;const nn=(map.notes||[]).length;
  $('#charHint').textContent=`${ent.length} 句里 ${own} 句自带逐字时间 · 谱面有 ${nn} 个 note`+(state.charMode==='note'&&own<ent.length&&nn?'，其余的字跟着 note 出现':'')+'。';}

