/* 导入现成 .osb：解析、预览、整体平移 */
/* ---------- imported .osb (kept verbatim, previewed, shiftable in time) ---------- */
const impCache=new Map();     /* import id → {blocks:[{layer,raw,sprite}],samples,t0,t1} */
const impTexCache=new Map();  /* path → glyph | 'loading' | 'missing' */
let impTexLoad=null;          /* set by the UI: loads a texture from the mapset folder */
const NUM_LAYER=['Background','Fail','Pass','Foreground','Overlay'];
const NUM_ORIGIN=['TopLeft','Centre','CentreLeft','TopRight','BottomCentre','TopCentre','TopLeft','CentreRight','BottomLeft','BottomRight'];
const CMD_N={F:1,S:1,R:1,MX:1,MY:1,M:2,V:2,C:3};
function splitHeader(l){const out=[];let cur='',q=false;for(const ch of l){if(ch==='"'){q=!q;continue;}if(ch===','&&!q){out.push(cur);cur='';}else cur+=ch;}out.push(cur);return out;}
function impCmd(list,f){
  const type=f[0];if(type==='P'){const t0=+f[2],t1=f[3]===''||f[3]==null?t0:+f[3];list.push({type:'P',ease:0,t0,t1,a:[f[4]],b:[f[4]]});return;}
  const n=CMD_N[type];if(!n)return;const ease=+f[1]||0,t0=+f[2],t1=f[3]===''||f[3]==null?t0:+f[3],v=f.slice(4).map(Number);if(!isFinite(t0)||v.length<n)return;
  const sets=Math.floor(v.length/n),d=t1-t0;
  if(sets<2){list.push({type,ease,t0,t1,a:v.slice(0,n),b:v.slice(0,n)});return;}
  for(let k=0;k<sets-1;k++)list.push({type,ease,t0:t0+k*d,t1:t1+k*d,a:v.slice(k*n,k*n+n),b:v.slice(k*n+n,k*n+2*n)});
}
function parseOsbText(text){
  const vars=[],blocks=[],samples=[];let sec='',cur=null,group=null;
  for(const raw0 of String(text).split(/\r?\n/)){
    if(/^\s*\[.+\]\s*$/.test(raw0)){sec=raw0.trim().toLowerCase();cur=null;continue;}
    if(sec==='[variables]'){const m=raw0.match(/^\s*(\$[^=]+)=(.*)$/);if(m){vars.push([m[1].trim(),m[2].trim()]);vars.sort((a,b)=>b[0].length-a[0].length);}continue;}
    if(sec!=='[events]'||!raw0.trim()||raw0.trim().startsWith('//'))continue;
    let line=raw0;for(const[k,v]of vars)if(line.includes(k))line=line.split(k).join(v);
    const depth=line.match(/^[ _]*/)[0].length,l=line.trim();
    if(depth===0){const f=splitHeader(l),k=f[0];cur=null;group=null;
      if(k==='Sprite'||k==='4'||k==='Animation'||k==='6'){
        const ly=isNaN(+f[1])?f[1]:NUM_LAYER[+f[1]]||'Background',og=isNaN(+f[2])?f[2]:NUM_ORIGIN[+f[2]]||'TopLeft',path=String(f[3]).replace(/\\/g,'/').trim();
        const sp={glyph:null,impPath:path,x:+f[4]||0,y:+f[5]||0,cmds:[],loops:[],trigs:[],layer:LAYERS.includes(ly)?ly:'Background',origin:ORIGINS[og]?og:'TopLeft',style:'imp',imp:true};
        if(k==='Animation'||k==='6'){sp.anim={count:Math.max(1,+f[6]||1),delay:Math.max(1,+f[7]||100),loop:f[8]==='LoopOnce'||f[8]==='1'?'LoopOnce':'LoopForever'};const d=path.lastIndexOf('.');sp.impPath=d>0?path.slice(0,d)+'0'+path.slice(d):path+'0';}
        cur={layer:sp.layer,raw:[line],sprite:sp};blocks.push(cur);}
      else if(k==='Sample'||k==='5')samples.push(line);
      continue;}
    if(!cur)continue;cur.raw.push(line);const f=l.split(',');
    if(depth===1){group=null;
      if(f[0]==='L'){group={start:+f[1],count:Math.max(1,+f[2]||1),cmds:[]};cur.sprite.loops.push(group);continue;}
      if(f[0]==='T'){group={name:f[1],start:+f[2],end:+f[3],cmds:[]};cur.sprite.trigs.push(group);continue;}
      impCmd(cur.sprite.cmds,f);}
    else if(group)impCmd(group.cmds,f);
  }
  let t0=Infinity,t1=-Infinity;for(const b of blocks){compile(b.sprite);if(isFinite(b.sprite.tStart)){t0=Math.min(t0,b.sprite.tStart);t1=Math.max(t1,b.sprite.tEnd);}}
  if(!isFinite(t0)){t0=0;t1=1000;}
  return{blocks,samples,t0:Math.round(t0),t1:Math.round(t1)};
}
function impGlyph(path){const g=impTexCache.get(path);if(g&&typeof g==='object')return g;if(!g&&impTexLoad){impTexCache.set(path,'loading');impTexLoad(path);}return null;}
function impSprites(c,tr){
  const P=impCache.get(c.iid);if(!P)return[];const off=Math.round(c.start-(c.base||0));
  return P.blocks.map(b=>{const o=b.sprite;let s=o;
    if(off){s={...o,cmds:o.cmds.map(q=>({...q,t0:q.t0+off,t1:q.t1+off})),loops:o.loops.map(L=>({...L,start:L.start+off})),trigs:o.trigs.map(T=>({...T,start:T.start+off,end:T.end+off}))};}
    s.glyph=impGlyph(o.impPath);s.tid=tr.id;s.raw=b.raw;s.off=off;return s;});
}
/* shift absolute times of a verbatim block (nested L/T commands are relative and stay) */
function shiftRaw(lines,off){if(!off)return lines;return lines.map(line=>{const d=line.match(/^[ _]*/)[0].length;if(d!==1)return line;
  const pre=line.slice(0,d),f=line.slice(d).split(',');
  if(f[0]==='L')f[1]=String(Math.round(+f[1]+off));else if(f[0]==='T'){f[2]=String(Math.round(+f[2]+off));f[3]=String(Math.round(+f[3]+off));}
  else{f[2]=String(Math.round(+f[2]+off));if(f[3]!=='')f[3]=String(Math.round(+f[3]+off));}return pre+f.join(',');});}

