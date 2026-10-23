/* 导出优化：合并命令、去掉无用命令、MX/MY、sprite 复用 */
/* ---------- export optimisation (after storybrew): drop no-ops, merge, MX/MY, pool short-lived sprites ---------- */
const DEF_VAL={S:[1],R:[0],C:[255,255,255],V:[1,1],F:[1]};
const near=(a,b,e)=>Math.abs(a-b)<=(e||1e-4)*Math.max(1,Math.abs(a),Math.abs(b));
const sameV=(x,y,e)=>x.length===y.length&&x.every((v,i)=>near(v,y[i],e));
function extentOf(s){let a=Infinity,z=-Infinity;for(const c of s.cmds){a=Math.min(a,c.t0);z=Math.max(z,c.t1);}
  for(const L of s.loops){const len=Math.max(0,...L.cmds.map(c=>c.t1));a=Math.min(a,L.start+Math.min(...L.cmds.map(c=>c.t0)));z=Math.max(z,L.start+len*L.count);}
  for(const T of s.trigs||[]){a=Math.min(a,T.start);z=Math.max(z,T.end);}return[a,z];}
function tidyCmds(s){
  let cmds=s.cmds.map(c=>({...c}));const ext=extentOf(s);
  const byT=t=>cmds.filter(c=>c.type===t);
  /* merge back-to-back linear segments that continue at the same speed (and equal holds) */
  for(const T of ['M','S','V','R','F','C']){const L=byT(T).sort((p,q)=>p.t0-q.t0);if(L.length<2)continue;const out=[L[0]];
    for(let i=1;i<L.length;i++){const p=out[out.length-1],q=L[i];
      if(p.ease===0&&q.ease===0&&p.t1===q.t0&&p.t1>p.t0&&q.t1>q.t0&&sameV(p.b,q.a,1e-4)){
        const sp=p.a.map((v,j)=>(p.b[j]-v)/(p.t1-p.t0)),sq=q.a.map((v,j)=>(q.b[j]-v)/(q.t1-q.t0));
        if(sp.every((v,j)=>Math.abs(v-sq[j])<=1e-6*Math.max(1,Math.abs(v)))){out[out.length-1]={...p,t1:q.t1,b:q.b};continue;}}
      if(q.t0===q.t1&&p.t0===q.t0&&p.t1===q.t1&&sameV(p.a,q.a)&&sameV(p.b,q.b))continue;
      out.push(q);}
    cmds=cmds.filter(c=>c.type!==T).concat(out);}
  /* a lone command that only restates the default value does nothing — unless it is what keeps the sprite alive */
  for(const T of ['S','R','C','V','M']){const L=byT(T);if(L.length!==1)continue;const c=L[0],d=T==='M'?[s.x,s.y]:DEF_VAL[T];
    if(!sameV(c.a,d,1e-4)||!sameV(c.b,d,1e-4))continue;const rest=cmds.filter(x=>x!==c);
    const e2=extentOf({...s,cmds:rest});if(e2[0]===ext[0]&&e2[1]===ext[1])cmds=rest;}
  cmds.sort((p,q)=>p.t0-q.t0||p.t1-q.t1);
  /* moves on one axis only → MX / MY (needs every move, looped or not, to keep the other axis on the header value) */
  const allM=[...cmds,...s.loops.flatMap(L=>L.cmds),...(s.trigs||[]).flatMap(T=>T.cmds)].filter(c=>c.type==='M');
  if(allM.length){const fx=allM.every(c=>near(c.a[0],s.x)&&near(c.b[0],s.x)),fy=allM.every(c=>near(c.a[1],s.y)&&near(c.b[1],s.y));
    const conv=(c,i,T)=>c.type==='M'?{...c,type:T,a:[c.a[i]],b:[c.b[i]]}:c;
    if(fx&&!fy){cmds=cmds.map(c=>conv(c,1,'MY'));s={...s,loops:s.loops.map(L=>({...L,cmds:L.cmds.map(c=>conv(c,1,'MY'))})),trigs:(s.trigs||[]).map(T=>({...T,cmds:T.cmds.map(c=>conv(c,1,'MY'))}))};}
    else if(fy&&!fx){cmds=cmds.map(c=>conv(c,0,'MX'));s={...s,loops:s.loops.map(L=>({...L,cmds:L.cmds.map(c=>conv(c,0,'MX'))})),trigs:(s.trigs||[]).map(T=>({...T,cmds:T.cmds.map(c=>conv(c,0,'MX'))}))};}}
  return{...s,cmds};
}
/* sprites with the same picture that never overlap in time can share one sprite (storybrew's sprite pools) */
const POOL_SPAN=60000;
function poolable(s){
  if(s.raw||s.imp||s.anim||s.loops.length||(s.trigs&&s.trigs.length)||!s.cmds.length)return false;
  if(s.cmds.some(c=>c.type==='P'&&c.t0===c.t1)||s.cmds.some(c=>c.type==='MX'||c.type==='MY'))return false;
  const F=s.cmds.filter(c=>c.type==='F');if(!F.length)return false;const[a,z]=extentOf(s);
  const first=F.reduce((p,q)=>q.t0<p.t0?q:p),last=F.reduce((p,q)=>q.t1>p.t1?q:p);
  return first.t0===a&&near(last.b[0],0)&&last.t1===z;
}
function poolSprites(list){
  const out=[],groups=new Map();
  for(const s of list){if(!poolable(s)){out.push(s);continue;}const k=[s.glyph?s.glyph.key:'px',s.layer,s.origin||'Centre',s.tid].join('|');(groups.get(k)||groups.set(k,[]).get(k)).push(s);}
  for(const g of groups.values()){if(g.length<2){out.push(...g);continue;}
    const items=g.map(s=>({s,ext:extentOf(s)})).sort((p,q)=>p.ext[0]-q.ext[0]),pools=[];
    for(const it of items){let best=null;for(const P of pools)if(P.end<it.ext[0]&&it.ext[1]-P.start<=POOL_SPAN&&(!best||P.end>best.end))best=P;
      if(!best){best={start:it.ext[0],end:-Infinity,members:[]};pools.push(best);}best.members.push(it);best.end=it.ext[1];}
    for(const P of pools){if(P.members.length===1){out.push(P.members[0].s);continue;}
      const head=P.members[0].s,types=new Set(P.members.flatMap(m=>m.s.cmds.map(c=>c.type)));types.delete('P');if(P.members.some(m=>m.s.x!==head.x||m.s.y!==head.y))types.add('M');const cmds=[];
      for(const{s,ext}of P.members){
        for(const T of types){const L=s.cmds.filter(c=>c.type===T);const at=ext[0];
          if(!L.length){const v=T==='M'?[s.x,s.y]:DEF_VAL[T];cmds.push({type:T,ease:0,t0:at,t1:at,a:v,b:v});}
          else{const f=L.reduce((p,q)=>q.t0<p.t0?q:p);if(f.t0>at)cmds.push({type:T,ease:0,t0:at,t1:at,a:f.a,b:f.a});}}
        cmds.push(...s.cmds);}
      cmds.sort((p,q)=>p.t0-q.t0||p.t1-q.t1);
      out.push({...head,x:head.x,y:head.y,cmds,loops:[],trigs:[],pooled:P.members.length});}}
  return out;
}
function optimizeSprites(list){return poolSprites(list.map(s=>s.raw?s:tidyCmds(s)));}
/* rough size of a sprite's text in the .osb */
function spriteBytes(s){if(s.raw)return s.raw.reduce((a,l)=>a+l.length+2,0);let n=60;
  for(const c of s.cmds)n+=cmdLine(c,' ').length+2;for(const L of s.loops){n+=16;for(const c of L.cmds)n+=cmdLine(c,'  ').length+2;}for(const T of s.trigs||[]){n+=28;for(const c of T.cmds)n+=cmdLine(c,'  ').length+2;}return n;}

/* storyboard layer lines for one group of sprites (all-diff .osb, or one difficulty's own events) */
function layerLines(list,names,usedMedia,ctr){
  const out=[];
  for(const L of LAYERS){out.push(LAYER_HEAD[L]);
    for(const s of list){if(s.layer!==L)continue;
      if(s.raw){out.push(...shiftRaw(s.raw,s.off));continue;}
      let path='sb/px.png';
      if(s.glyph&&s.glyph.media){const m=state.media.find(x=>x.id===s.glyph.media);if(!m)continue;path=m.file;usedMedia.set(m.id,m);}
      else if(s.glyph){if(!names.has(s.glyph.key))names.set(s.glyph.key,{path:s.glyph.fxName?`sb/fx/${s.glyph.fxName}.png`:`sb/l/${ctr.i++}.png`,g:s.glyph});path=names.get(s.glyph.key).path;}
      if(s.anim)out.push(`Animation,${L},${s.origin||'Centre'},"${path}",${Math.round(s.x)},${Math.round(s.y)},${s.anim.count},${s.anim.delay},${s.anim.loop}`);
      else out.push(`Sprite,${L},${s.origin||'Centre'},"${path}",${Math.round(s.x)},${Math.round(s.y)}`);
      for(const c of s.cmds)out.push(cmdLine(c,' '));
      for(const lp of s.loops){out.push(` L,${lp.start},${lp.count}`);for(const c of lp.cmds)out.push(cmdLine(c,'  '));}
      for(const tg of s.trigs||[]){out.push(` T,${tg.name},${tg.start},${tg.end}`);for(const c of tg.cmds)out.push(cmdLine(c,'  '));}
    }}
  return out;
}
const trackOf=tid=>state.tracks.find(t=>t.id===tid)||null;
const spriteDiff=s=>{const tr=trackOf(s.tid);return tr&&tr.diff?tr.diff:null;};
/* .osb (tracks for all difficulties) + per-difficulty event lines (tracks bound to one difficulty) */
function buildOsb(){
  const names=new Map(),usedMedia=new Map(),ctr={i:0},opt=state.optimize!==false,src=opt?optimizeSprites(sprites):sprites;fmtDec=opt?3:4;
  const common=src.filter(s=>!spriteDiff(s));
  const smp=[];for(const tr of state.tracks)if(tr.imp&&!tr.diff)for(const c of state.clips.filter(c=>c.tid===tr.id&&c.kind==='imp')){const P=impCache.get(c.iid);if(!P)continue;const off=Math.round(c.start-(c.base||0));
    for(const l of P.samples){const f=l.split(',');if(off)f[1]=String(Math.round(+f[1]+off));smp.push(f.join(','));}}
  const SLN={Background:0,Fail:1,Pass:2,Foreground:3,Overlay:3};
  for(const tr of state.tracks)if(tr.snd&&!tr.diff)for(const c of state.clips.filter(c=>c.tid===tr.id&&c.kind==='snd')){const m=state.media.find(x=>x.id===c.mid);if(!m)continue;usedMedia.set(m.id,m);
    smp.push(`Sample,${Math.round(c.start)},${SLN[tr.layer]??3},"${m.file}",${clamp(Math.round(c.vol??100),0,100)}`);}
  const text=['[Events]','//Made with Kuan Storyboard','//Background and Video events',...layerLines(common,names,usedMedia,ctr),'//Storyboard Sound Samples',...smp,''].join('\r\n');
  const diffs={};for(const tr of state.tracks)if(tr.diff&&!diffs[tr.diff])diffs[tr.diff]=layerLines(src.filter(s=>spriteDiff(s)===tr.diff),names,usedMedia,ctr);
  fmtDec=4;
  return{text,names,usedMedia,diffs};
}
/* Kuan 按 16:9 宽屏做故事板：.osu 里 WidescreenStoryboard 不是 1 时，osu! 会按 4:3 显示（左右被裁掉）。保存 / 导出时打开它 */
function widescreenOsu(osuText){
  if(/^WidescreenStoryboard:\s*1\s*$/m.test(osuText))return osuText;
  if(/^WidescreenStoryboard:.*$/m.test(osuText))return osuText.replace(/^WidescreenStoryboard:.*$/m,'WidescreenStoryboard: 1');
  const nl=/\r\n/.test(osuText)?'\r\n':'\n',rows=osuText.split(/\r?\n/);
  let g=rows.findIndex(r=>r.trim()==='[General]');if(g<0)return osuText;
  let end=rows.findIndex((r,i)=>i>g&&/^\[.+\]\s*$/.test(r.trim()));if(end<0)end=rows.length;
  while(end>g+1&&!rows[end-1].trim())end--;
  rows.splice(end,0,'WidescreenStoryboard: 1');return rows.join(nl);
}
/* put a difficulty's own storyboard lines into its .osu [Events], keeping background / video / breaks / samples */
function patchOsu(osuText,lines){
  const nl=/\r\n/.test(osuText)?'\r\n':'\n',rows=osuText.split(/\r?\n/);
  let ev=rows.findIndex(r=>r.trim()==='[Events]');
  if(ev<0){rows.push('','[Events]','//Background and Video events','//Storyboard Sound Samples');ev=rows.length-3;}
  let end=rows.findIndex((r,i)=>i>ev&&/^\[.+\]\s*$/.test(r.trim()));if(end<0)end=rows.length;
  const sec=rows.slice(ev+1,end);
  let a=sec.findIndex(r=>/^\/\/Storyboard Layer 0/.test(r.trim())),b=sec.findIndex(r=>/^\/\/Storyboard Sound Samples/.test(r.trim()));
  if(b<0){b=sec.length;while(b>0&&!sec[b-1].trim())b--;}
  if(a<0||a>b)a=b;
  const out=[...sec.slice(0,a),...lines,...sec.slice(b)];
  if(!out.some(r=>/^\/\/Storyboard Sound Samples/.test(r.trim()))){let k=out.length;while(k>0&&!out[k-1].trim())k--;out.splice(k,0,'//Storyboard Sound Samples');}
  return[...rows.slice(0,ev+1),...out,...rows.slice(end)].join(nl);
}

