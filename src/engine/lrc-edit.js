/* 在时间轴上拖歌词后写回 LRC */
/* ---------- lyric line edits written back into the LRC ---------- */
function fmtTime(ms,three,br){ms=Math.max(0,Math.round(ms));const m=Math.floor(ms/60000),sec=(ms%60000)/1000;const sx=three?sec.toFixed(3).padStart(6,'0'):sec.toFixed(2).padStart(5,'0');return br[0]+String(m).padStart(2,'0')+':'+sx+br[1];}
function rewriteRow(rows,e,newDisp){
  let line=rows[e.src];if(line==null)return;const newRaw=newDisp-state.offset+e.off,delta=Math.round(newRaw-(e.t+e.off));if(!delta)return;
  if(e.kind==='yrc'){line=line.replace(/^(\s*)\[(\d+),(\d+)\]/,(m,sp2,a,b)=>`${sp2}[${Math.max(0,+a+delta)},${b}]`).replace(/\((\d+),(\d+),(\d+)\)/g,(m,a,b,c)=>`(${Math.max(0,+a+delta)},${b},${c})`);}
  else{let i=0;line=line.replace(/\[(\d+):(\d+)(?:\.(\d+))?\]/g,(m,mm,ss,fr)=>i++===e.tag?fmtTime(newRaw,true,'[]'):m);
    if((e.tagCount||1)===1)line=line.replace(/<(\d+):(\d+(?:\.(\d+))?)>/g,(m,mm,ss,fr)=>fmtTime(msOf(mm,ss)+delta,fr&&fr.length>=3,'<>'));}
  rows[e.src]=line;
}
function lineInfo(L){
  const ents=parseLrc(state.lrc),i=ents.findIndex(e=>e.src===L.src.src&&e.tag===L.src.tag);if(i<0)return null;
  const disp=e=>e.text?startOf(e):e.t+state.offset;
  const S=L.S,E=L.E,dur=E-S,prev=ents[i-1]||null,next=ents[i+1]||null;
  let prevLyric=null;for(let k=i-1;k>=0;k--)if(ents[k].text){prevLyric=ents[k];break;}
  const minS=prevLyric?disp(prevLyric)+200:0;
  let maxE=gen.duration;
  if(next&&!next.text){const fol=ents.slice(i+2).find(e=>e.text);maxE=fol?disp(fol):gen.duration;}
  else if(next&&next.text){const after=ents[i+2],nb=beatAt(disp(next));maxE=(after?disp(after):disp(next)+8*nb)-nb;}
  /* moving the whole line stops at the next lyric's start: it may never cover (and squeeze) the next line.
     Dragging only the end edge (maxE) may still push into the next line, but leaves it at least one beat. */
  const maxS=next&&next.text?Math.max(minS,Math.min(maxE-dur,disp(next)-dur),Math.min(S,disp(next))):Math.max(minS,maxE-dur);
  return{ents,i,S,E,dur,prev,next,minS,maxS,maxE,disp};
}
const DEL_ROW='\u0000del';
/* a blank end-tag that now reaches the next lyric's start is no longer a gap: drop it (if it is alone on its row) */
function setGapEnd(rows,B,newE){const g=B.next,fol=B.ents.slice(B.i+2).find(e=>e.text);
  if(fol&&newE>=B.disp(fol)-2&&/^\s*\[[^\]]*\]\s*$/.test(rows[g.src]||''))rows[g.src]=DEL_ROW;else rewriteRow(rows,g,newE);}
function applyRows(rows,inserts){
  inserts.sort((a,b)=>b.after-a.after).forEach(x=>{rows.splice(Math.floor(x.after)+1,0,fmtTime(x.time-state.offset+x.off,true,'[]'));});
  state.lrc=rows.filter(r=>r!==DEL_ROW).join('\n');$('#lrc').value=state.lrc;lrcName=null;
}
function moveStart(L,newS,free){
  const B=lineInfo(L);if(!B||Math.abs(newS-B.S)<1)return;const rows=state.lrc.split(/\r?\n/);
  rewriteRow(rows,B.ents[B.i],newS);applyRows(rows,[]);
  const key=B.ents[B.i].key;if(key){if(free)state.pins[key]=true;else delete state.pins[key];}
}
function moveBlock(L,newS,free){
  const B=lineInfo(L);if(!B)return;const d=newS-B.S;if(Math.abs(d)<1)return;
  const rows=state.lrc.split(/\r?\n/),ins=[],pinNext=[];
  rewriteRow(rows,B.ents[B.i],newS);
  if(d>0&&B.prev&&B.prev.text)ins.push({after:B.ents[B.i].src-0.5,time:B.S,off:B.ents[B.i].off});
  const newE=B.E+d;
  if(B.next){if(!B.next.text)setGapEnd(rows,B,newE);
    else if(d<0)ins.push({after:B.ents[B.i].src,time:newE,off:B.ents[B.i].off});
    else{rewriteRow(rows,B.next,newE);pinNext.push(B.next);}}
  applyRows(rows,ins);
  const key=B.ents[B.i].key;if(key){if(free)state.pins[key]=true;else delete state.pins[key];}
  for(const e of pinNext)if(e.key)state.pins[e.key]=true;
}
function moveEnd(L,newE){
  const B=lineInfo(L);if(!B||Math.abs(newE-B.E)<1)return;
  const rows=state.lrc.split(/\r?\n/),ins=[];
  if(B.next&&!B.next.text)setGapEnd(rows,B,newE);
  else if(B.next&&B.next.text){if(newE<B.E)ins.push({after:B.ents[B.i].src,time:newE,off:B.ents[B.i].off});else{rewriteRow(rows,B.next,newE);if(B.next.key)state.pins[B.next.key]=true;}}
  else ins.push({after:B.ents[B.i].src,time:newE,off:B.ents[B.i].off});
  applyRows(rows,ins);
}


/* ---------- per-character times (enhanced LRC <mm:ss.xxx> word tags) ---------- */
function charEditBlocked(e){
  if(e.kind==='yrc'){toast('这句是逐字 YRC 格式，暂时不能在这里改逐字时间','err');return true;}
  if((e.tagCount||1)>1){toast('这一行带了多个时间（同一句唱了好几遍），先在歌词里把它拆成几行再调逐字时间','err');return true;}
  return false;}
/* times: display times (ms) for each visible character of the line, in order */
function setLineCharTimes(L,times){
  const e=L.src;if(charEditBlocked(e))return false;
  const rows=state.lrc.split(/\r?\n/),raw=rows[e.src];if(raw==null)return false;
  const pre=(raw.match(/^\s*(?:\[[^\]]*\]\s*)+/)||[''])[0],body=raw.slice(pre.length).replace(/<\d+:\d+(?:\.\d+)?>/g,'');
  const n=stripChars(body).length;let k=0,out='';
  for(const ch of body){if(k<n&&ch.trim()&&ch!=='*'&&ch!=='/'){const t=times[Math.min(k,times.length-1)];out+=fmtTime(t-state.offset+e.off,true,'<>');k++;}out+=ch;}
  rows[e.src]=pre+out;state.lrc=rows.join('\n');$('#lrc').value=state.lrc;lrcName=null;
  if(state.charMode==='off'){state.charMode='note';$('#charMode').value='note';toast('「逐字时间」原来是「不用」，已改成「歌词自带，没有就跟 note」');}
  return true;}
function clearLineCharTimes(L){
  const e=L.src;if(charEditBlocked(e))return false;
  const rows=state.lrc.split(/\r?\n/);if(rows[e.src]==null)return false;
  rows[e.src]=rows[e.src].replace(/<\d+:\d+(?:\.\d+)?>/g,'');state.lrc=rows.join('\n');$('#lrc').value=state.lrc;lrcName=null;return true;}
