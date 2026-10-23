/* 解析 .osu 谱面、LRC / yrc 歌词 */
/* ---------- parsing ---------- */
function parseOsu(txt){
  const meta={},general={},diff={},cols=[],tps=[],notes=[],objs=[];let sec='',bg=null,bookmarks=[];
  for(const raw of txt.split(/\r?\n/)){
    const l=raw.trim(); if(!l||l.startsWith('//'))continue;
    const m=l.match(/^\[(.+)\]$/); if(m){sec=m[1];continue;}
    if(sec==='General'||sec==='Metadata'||sec==='Difficulty'){const i=l.indexOf(':');if(i>0)(sec==='General'?general:sec==='Metadata'?meta:diff)[l.slice(0,i).trim()]=l.slice(i+1).trim();}
    else if(sec==='Editor'){const bm=l.match(/^Bookmarks\s*:\s*(.*)$/);if(bm)bookmarks=bm[1].split(',').map(Number).filter(isFinite).sort((a,b)=>a-b);}
    else if(sec==='Colours'){const c=l.match(/^Combo(\d+)\s*:\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);if(c)cols[+c[1]-1]=[+c[2],+c[3],+c[4]];}
    else if(sec==='TimingPoints'){const p=l.split(',');if(p.length>=2){const fx=p.length>7?(+p[7]||0):0;tps.push({t:+p[0],bl:+p[1],meter:+p[2]||4,unin:p.length>6?p[6]==='1':true,kiai:(fx&1)===1});}}
    else if(sec==='Events'&&!bg){const m2=l.match(/^0,0,"([^"]+)"/);if(m2)bg=m2[1];}
    else if(sec==='HitObjects'){const p=l.split(',');if(p.length<4)continue;const t=+p[2];if(!isFinite(t))continue;const type=+p[3]||0;
      const o={x:+p[0]||0,y:+p[1]||0,t,type,nc:!!(type&4),skip:(type>>4)&7,hs:+p[4]||0};
      if((type&2)&&p[8]){const e0=+String(p[8]).split('|')[0];if(isFinite(e0))o.hs=e0;}
      if(type&2){const cp=(p[5]||'').split('|');o.kind='slider';o.curve=cp[0]||'B';o.pts=[[o.x,o.y],...cp.slice(1).map(q=>q.split(':').map(Number)).filter(q=>q.length===2&&q.every(isFinite))];o.slides=Math.max(1,+p[6]||1);o.len=Math.max(0,+p[7]||0);}
      else if(type&8){o.kind='spinner';o.x=256;o.y=192;o.endT=Math.max(t,+p[5]||t);}
      else o.kind='circle';
      objs.push(o);notes.push(t);}
  }
  tps.sort((a,b)=>a.t-b.t);
  const red=tps.filter(p=>p.unin&&p.bl>0).map(p=>({t:p.t,bl:p.bl,meter:p.meter}));
  if(!red.length)throw new Error('这个 .osu 里没有红线（非继承 timing point）');
  /* green lines: inherited timing points (slider velocity); sv = speed multiplier */
  const green=tps.filter(p=>!p.unin&&p.bl<0).map(p=>({t:p.t,sv:Math.round(-100/p.bl*100)/100}));
  const kiai=[];let on=null;
  for(const p of tps){if(p.kiai&&on===null)on=p.t;else if(!p.kiai&&on!==null){kiai.push({s:on,e:p.t});on=null;}}
  if(on!==null)kiai.push({s:on,e:null});
  notes.sort((a,b)=>a-b);objs.sort((a,b)=>a.t-b.t);
  /* slider geometry + timing, combo numbers & colours */
  const sm=+diff.SliderMultiplier||1.4,colours=cols.filter(Boolean);
  const pal=colours.length?colours:[[255,192,0],[0,202,0],[18,124,255],[242,24,57]];
  let ti=0,curRed=red[0],sv=1,ci=-1,num=0;
  objs.forEach((o,i)=>{
    while(ti<tps.length&&tps[ti].t<=o.t+1){const p=tps[ti++];if(p.unin&&p.bl>0){curRed=p;sv=1;}else if(!p.unin&&p.bl<0)sv=clamp(-100/p.bl,0.1,10);}
    if(i===0||o.nc||o.kind==='spinner'||(objs[i-1]&&objs[i-1].kind==='spinner')){ci=(ci+1+(i?o.skip:0))%pal.length;num=0;}
    o.combo=pal[ci];o.num=++num;
    if(o.kind==='slider'){o.path=sliderPath(o);const span=o.len/(sm*100*sv)*curRed.bl;o.span=span;o.endT=o.t+span*o.slides;
      const last=o.path[o.path.length-1];o.endPos=o.slides%2?last:o.path[0];}
    else if(o.kind==='circle')o.endT=o.t;
  });
  const cs=diff.CircleSize!=null?+diff.CircleSize:5,ar=diff.ApproachRate!=null?+diff.ApproachRate:(diff.OverallDifficulty!=null?+diff.OverallDifficulty:5);
  return {meta,general,red,green,bookmarks,kiai,bg,notes:notes.filter((t,i)=>i===0||t!==notes[i-1]),objs,cs,ar,colours:pal};
}
/* slider path in osu! pixels, cut / extended to the pixel length */
function sliderPath(o){
  const P=o.pts;let pts=[];
  const bez=cp=>{if(cp.length<3)return cp.slice();const n=Math.max(8,Math.min(80,cp.length*12)),out=[];
    for(let k=0;k<=n;k++){const t=k/n;let q=cp.map(v=>v.slice());while(q.length>1){const r=[];for(let j=0;j<q.length-1;j++)r.push([q[j][0]+(q[j+1][0]-q[j][0])*t,q[j][1]+(q[j+1][1]-q[j][1])*t]);q=r;}out.push(q[0]);}return out;};
  if(P.length<2)pts=[P[0],P[0]];
  else if(o.curve==='L')pts=P.slice();
  else if(o.curve==='P'&&P.length===3&&(pts=arcPts(P[0],P[1],P[2]))){}
  else if(o.curve==='C'){const Q=[P[0],...P,P[P.length-1]];pts=[];
    for(let i=1;i<Q.length-2;i++){const a=Q[i-1],b=Q[i],c=Q[i+1],d=Q[i+2];for(let k=0;k<12;k++){const t=k/12,t2=t*t,t3=t2*t;
      pts.push([0,1].map(j=>0.5*(2*b[j]+(-a[j]+c[j])*t+(2*a[j]-5*b[j]+4*c[j]-d[j])*t2+(-a[j]+3*b[j]-3*c[j]+d[j])*t3)));}}
    pts.push(P[P.length-1]);}
  else{const segs=[];let seg=[P[0]];
    for(let i=1;i<P.length;i++){seg.push(P[i]);if(i+1<P.length&&P[i][0]===P[i+1][0]&&P[i][1]===P[i+1][1]){segs.push(seg);seg=[];}}
    if(seg.length>1)segs.push(seg);pts=[];for(const g of segs)pts.push(...bez(g));}
  if(!pts||pts.length<2)pts=[P[0],P[P.length-1]||P[0]];
  /* walk to the pixel length */
  const L=o.len;if(!(L>0))return pts;
  const out=[pts[0]];let acc=0;
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!d)continue;
    if(acc+d>=L){const k=(L-acc)/d;out.push([a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k]);return out;}acc+=d;out.push(b);}
  let a=pts[pts.length-2],b=pts[pts.length-1];for(let i=pts.length-2;i>=0&&a[0]===b[0]&&a[1]===b[1];i--)a=pts[i];
  const d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d)out.push([b[0]+(b[0]-a[0])/d*(L-acc),b[1]+(b[1]-a[1])/d*(L-acc)]);
  return out;
}
function pathCum(o){if(o.cum)return o.cum;const c=[0];for(let i=1;i<o.path.length;i++)c.push(c[i-1]+Math.hypot(o.path[i][0]-o.path[i-1][0],o.path[i][1]-o.path[i-1][1]));o.cum=c;return c;}
function pathAt(o,f){const c=pathCum(o),L=c[c.length-1]*clamp(f,0,1);let i=1;while(i<c.length-1&&c[i]<L)i++;const a=o.path[i-1],b=o.path[i],d=c[i]-c[i-1]||1,k=(L-c[i-1])/d;return[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];}
/* slider ball position (osu! pixels) at time t */
function ballAt(o,t){const e=clamp((t-o.t)/Math.max(1,o.span),0,o.slides),k=Math.min(o.slides-1,Math.floor(e)),fr=e-k;return pathAt(o,k%2?1-fr:fr);}
function arcPts(a,b,c){
  const d=2*(a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]));if(Math.abs(d)<1e-3)return null;
  const A=a[0]**2+a[1]**2,B=b[0]**2+b[1]**2,C=c[0]**2+c[1]**2;
  const ux=(A*(b[1]-c[1])+B*(c[1]-a[1])+C*(a[1]-b[1]))/d,uy=(A*(c[0]-b[0])+B*(a[0]-c[0])+C*(b[0]-a[0]))/d,r=Math.hypot(a[0]-ux,a[1]-uy);
  const T=2*Math.PI,md=x=>((x%T)+T)%T,t0=Math.atan2(a[1]-uy,a[0]-ux),t1=t0+md(Math.atan2(b[1]-uy,b[0]-ux)-t0);let t2=t0+md(Math.atan2(c[1]-uy,c[0]-ux)-t0);
  if(t1>t2)t2-=T;const n=Math.max(8,Math.ceil(Math.abs(t2-t0)*r/6)),out=[];
  /* allow the walk to run past c along the same circle */
  const ext=(t2-t0)*1.6;for(let k=0;k<=Math.ceil(n*1.6);k++){const t=t0+ext*k/Math.ceil(n*1.6);out.push([ux+r*Math.cos(t),uy+r*Math.sin(t)]);}
  return out;
}
function stripChars(text){return[...String(text).replace(/<\d+:\d+(?:\.\d+)?>/g,'').replace(/[!！]\s*$/,'')].filter(ch=>ch.trim()&&ch!=='*'&&ch!=='/');}
const LRC_TAG=/\[(\d+):(\d+(?:\.\d+)?)\]/g, WORD_TAG=/<(\d+):(\d+(?:\.\d+)?)>/g;
const msOf=(m,s2)=>(+m*60+ +s2)*1000;
function parseLrc(txt){
  let off=0;const out=[];const rows=String(txt).split(/\r?\n/);
  rows.forEach((raw,src)=>{
    const om=raw.match(/^\s*\[offset:\s*([+-]?\d+)\]/i);if(om){off=+om[1];return;}
    if(/^\s*\{/.test(raw))return;
    const ym=raw.match(/^\s*\[(\d+),(\d+)\]/);
    if(ym){
      const segs=[...raw.slice(ym[0].length).matchAll(/\((\d+),(\d+),\d+\)([^(]*)/g)];
      const text=segs.map(m=>m[3]).join('').trim();const chars=[];
      for(const m of segs){const cs=[...m[3]].filter(ch=>ch.trim()&&ch!=='*'&&ch!=='/');const t0=+m[1],d=+m[2];
        cs.forEach((ch,j)=>chars.push({ch,t:t0+d*j/Math.max(1,cs.length)-off}));}
      out.push({t:+ym[1]-off,text,src,tag:0,kind:'yrc',off,chars:chars.length?chars:null});return;
    }
    const tags=[...raw.matchAll(LRC_TAG)];if(!tags.length)return;
    const body=raw.replace(/\[[^\]]*\]/g,'');
    const text=body.replace(WORD_TAG,'').trim();
    let chars=null;
    if(WORD_TAG.test(body)){WORD_TAG.lastIndex=0;
      const parts=[];let last=0,cur=null,m;
      while((m=WORD_TAG.exec(body))){if(cur!==null||m.index>last)parts.push({t:cur,txt:body.slice(last,m.index)});cur=msOf(m[1],m[2]);last=m.index+m[0].length;}
      parts.push({t:cur,txt:body.slice(last)});
      const first=msOf(tags[0][1],tags[0][2]);chars=[];
      parts.forEach((p,i)=>{const cs=[...p.txt].filter(ch=>ch.trim()&&ch!=='*'&&ch!=='/');if(!cs.length)return;
        const t0=p.t==null?first:p.t,nx=parts.slice(i+1).find(q=>q.t!=null),t1=nx?nx.t:t0+140*cs.length;
        cs.forEach((ch,j)=>chars.push({ch,t:t0+(t1-t0)*j/cs.length}));});
      if(/[!！]\s*$/.test(text)&&chars.length&&/[!！]/.test(chars[chars.length-1].ch))chars.pop();
      if(!chars.length)chars=null;
    }
    tags.forEach((m,ti)=>{const t=msOf(m[1],m[2]);const sh=t-msOf(tags[0][1],tags[0][2]);
      out.push({t:t-off,text,src,tag:ti,kind:'lrc',off,chars:chars?chars.map(c=>({ch:c.ch,t:c.t+sh-off})):null,tagCount:tags.length});});
  });
  out.sort((a,b)=>a.t-b.t);
  const occ={};for(const e of out)if(e.text){occ[e.text]=(occ[e.text]||0)+1;e.key=e.text+'#'+occ[e.text];}
  return out;
}
/* .srt / .sbv / .ass / .ssa → enhanced LRC (ass \k syllables become <mm:ss.xx> word times) */
function subToLrc(name,text){
  const ext=String(name).toLowerCase().split('.').pop(),ents=[],T=t=>fmtTime(t,false,'[]'),W=t=>fmtTime(t,false,'<>');
  const hms=(h,m,s2,frac,fd)=>((+h*60+ +m)*60+ +s2)*1000+(frac?Math.round(+frac*Math.pow(10,3-fd)):0);
  const clean=t=>t.replace(/<[^>]+>/g,'').replace(/\{[^}]*\}/g,'').trim();
  if(ext==='srt'||ext==='sbv'){
    for(const blk of String(text).replace(/\r/g,'').split(/\n\s*\n/)){const ls=blk.split('\n').filter(l=>l.trim());let i=ls.findIndex(l=>ext==='srt'?/-->/.test(l):/^\d+:\d+:\d+[.,]\d+\s*,\s*\d+:\d+:\d+[.,]\d+/.test(l));if(i<0)continue;
      const m=ls[i].match(/(\d+):(\d+):(\d+)[.,](\d+)\s*(?:-->|,)\s*(\d+):(\d+):(\d+)[.,](\d+)/);if(!m)continue;
      const s0=hms(m[1],m[2],m[3],m[4],m[4].length),e0=hms(m[5],m[6],m[7],m[8],m[8].length),tx=ls.slice(i+1).map(clean).filter(Boolean).join('/');if(tx)ents.push({s:s0,e:e0,text:tx});}}
  else{
    const rows=String(text).split(/\r?\n/);let inEv=false,fmt=null;
    for(const r of rows){const l=r.trim();if(/^\[.+\]$/.test(l)){inEv=/^\[events\]$/i.test(l);continue;}if(!inEv)continue;
      if(/^format\s*:/i.test(l)){fmt=l.replace(/^format\s*:/i,'').split(',').map(x=>x.trim().toLowerCase());continue;}
      if(!/^dialogue\s*:/i.test(l)||!fmt)continue;const body=l.replace(/^dialogue\s*:/i,''),parts=[];let rest=body;
      for(let k=0;k<fmt.length-1;k++){const j=rest.indexOf(',');parts.push(rest.slice(0,j).trim());rest=rest.slice(j+1);}parts.push(rest);
      const g=k=>parts[fmt.indexOf(k)],tm=v=>{const m=String(v).match(/(\d+):(\d+):(\d+)[.](\d+)/);return m?hms(m[1],m[2],m[3],m[4],m[4].length):0;};
      const s0=tm(g('start')),e0=tm(g('end'));let raw=String(g('text')||'').replace(/\\N|\\n/g,'/').replace(/\\h/g,' ');
      const syl=[];let cur=s0,pend=null;const toks=raw.split(/(\{[^}]*\})/);
      for(const t of toks){if(!t)continue;if(t[0]==='{'){const k=t.match(/\\[kK][fo]?(\d+)/);if(k){if(pend!=null)cur+=pend;pend=+k[1]*10;syl.push({t:cur,txt:''});}continue;}
        if(syl.length)syl[syl.length-1].txt+=t;else syl.push({t:cur,txt:t,lead:true});}
      const tx=clean(raw);if(!tx)continue;
      const useK=syl.some(x=>!x.lead)&&syl.filter(x=>x.txt.trim()).length>1;
      ents.push({s:s0,e:e0,text:tx,syl:useK?syl.filter(x=>x.txt):null});}}
  ents.sort((a,b)=>a.s-b.s);const out=[];
  ents.forEach((e,i)=>{out.push(T(e.s)+(e.syl?e.syl.map(x=>W(x.t)+x.txt).join(''):e.text));const nx=ents[i+1];if(!nx||nx.s>e.e+60)out.push(T(e.e));});
  return out.join('\n');
}
function parseMarkup(text){
  const rows=[];let emph=false;
  for(const part of text.split('/')){
    const row=[];for(const ch of [...part]){if(ch==='*'){emph=!emph;continue;}row.push({ch,emph});}
    while(row.length&&row[0].ch===' ')row.shift();while(row.length&&row[row.length-1].ch===' ')row.pop();
    if(row.length)rows.push(row);
  }
  return rows;
}
function osbName(){
  const m=map.meta;const clean=s=>(s||'').replace(/[\\/:*?"<>|]/g,'');
  return `${clean(m.Artist||'Unknown')} - ${clean(m.Title||'Untitled')} (${clean(m.Creator||'Unknown')}).osb`;
}

