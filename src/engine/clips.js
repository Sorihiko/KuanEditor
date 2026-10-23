/* 图片片段与关键帧 → sprite 命令 */
/* ---------- clips & keyframes ---------- */
function newClip(mid,tid,start){
  const m=state.media.find(x=>x.id===mid);const b=beatAt(start);const dur=Math.max(2000,Math.round(8*b));
  const fit=m&&m.h>480?+(480/m.h*100).toFixed(1):100;
  return{id:uid(),mid,tid,start:Math.round(start),end:Math.round(start+dur),origin:'Centre',add:false,fh:false,fv:false,nonuni:false,
    props:{p:{v:[320,240],kf:null},s:{v:[fit],kf:null},v:{v:[100,100],kf:null},r:{v:[0],kf:null},a:{v:[100],kf:null},c:{v:[255,255,255],kf:null}}};
}
function kfVal(pr,t){
  const K=pr.kf;if(!K||!K.length)return pr.v;
  if(t<=K[0].t)return K[0].v;const L=K[K.length-1];if(t>=L.t)return L.v;
  for(let i=0;i<K.length-1;i++){const a=K[i],b=K[i+1];if(t>=a.t&&t<=b.t){const p=b.t===a.t?1:(t-a.t)/(b.t-a.t),e=ease(a.e||0,p);return a.v.map((v,j)=>v+(b.v[j]-v)*e);}}
  return L.v;
}
function propAt(c,k,tAbs){return kfVal(c.props[k],tAbs-c.start);}
function relT(c,tAbs){return clamp(Math.round(tAbs-c.start),0,c.end-c.start);}
function kfAt(pr,t){return pr.kf?pr.kf.find(q=>Math.abs(q.t-t)<=4)||null:null;}
function setProp(c,k,val,tAbs){
  const pr=c.props[k];
  if(pr.kf){const t=relT(c,tAbs);const f=kfAt(pr,t);
    if(f)f.v=val;else{const left=[...pr.kf].reverse().find(q=>q.t<t);pr.kf.push({t,v:val,e:left?left.e:0});pr.kf.sort((a,b)=>a.t-b.t);}}
  else pr.v=val;
}
const SBV={p:v=>v,s:v=>[v[0]/100],v:v=>[v[0]/100,v[1]/100],r:v=>[v[0]*Math.PI/180],a:v=>[clamp(v[0],0,100)/100],c:v=>v.map(x=>clamp(Math.round(x),0,255))};
const SBC={p:'M',s:'S',v:'V',r:'R',a:'F',c:'C'};
function segsOf(pr,dur){
  const K=pr.kf;if(!K||K.length<2)return null;const out=[];
  for(let i=0;i<K.length-1;i++){const a=K[i],b=K[i+1];if(b.t<=0||a.t>=dur||b.t<=a.t)continue;
    const t0=Math.max(0,a.t),t1=Math.min(dur,b.t);out.push({t0,t1,a:t0===a.t?a.v:kfVal(pr,t0),b:t1===b.t?b.v:kfVal(pr,t1),e:a.e||0});}
  return out.length?out:null;
}
/* one image clip → one osu! sprite; keyframe pairs become commands */
function clipSprite(c,tr){
  const m=mediaReady(c.mid);if(!m)return null;
  const S=c.start,E=c.end,dur=E-S;if(dur<=0)return null;
  const p0=kfVal(c.props.p,0);
  const s={glyph:m.g,x:Math.round(p0[0]),y:Math.round(p0[1]),cmds:[],loops:[],trigs:[],layer:tr.layer,origin:c.origin||'Centre',clipId:c.id,tid:tr.id,style:'img'};
  if(m.g.frames){const md=state.media.find(x=>x.id===c.mid)||{},a=c.anim||{};s.anim={count:m.g.frames.length,delay:Math.max(1,+(a.delay||md.delay)||83),loop:(a.loop||md.loop)==='LoopOnce'?'LoopOnce':'LoopForever'};}
  /* loop / trigger: the keyframed motion (0 … last keyframe) becomes an L or T group */
  const mode=c.mode==='loop'||c.mode==='trigger'?c.mode:'normal';
  let len=0;if(mode!=='normal')for(const k of ['p','s','v','r','a','c']){if(k==='v'&&!c.nonuni)continue;const K=c.props[k].kf;if(K&&K.length>1)len=Math.max(len,K[K.length-1].t);}
  const grouped=mode!=='normal'&&len>0,gcmds=[];
  for(const k of ['p','s','v','r','a','c']){
    if(k==='v'&&!c.nonuni)continue;
    const pr=c.props[k],T=SBC[k],cv=SBV[k];
    if(grouped&&pr.kf&&pr.kf.length>1){
      const sg=segsOf(pr,len);if(sg)for(const q of sg)gcmds.push({type:T,ease:q.e,t0:Math.round(q.t0),t1:Math.round(q.t1),a:cv(q.a),b:cv(q.b)});
      const v0=kfVal(pr,0);
      if(k==='a')cmd(s,'F',0,S,E,cv(mode==='trigger'&&c.trigHide!==false?[0]:v0),cv(mode==='trigger'&&c.trigHide!==false?[0]:v0));
      else if(k==='p'){s.x=Math.round(v0[0]);s.y=Math.round(v0[1]);}
      else cmd(s,T,0,S,S,cv(v0),cv(v0));
      continue;}
    const sg=segsOf(pr,dur);
    if(sg){
      if(k==='a'&&sg[0].t0>0)cmd(s,'F',0,S,S+sg[0].t0,cv(sg[0].a),cv(sg[0].a));
      for(const q of sg)cmd(s,T,q.e,S+q.t0,S+q.t1,cv(q.a),cv(q.b));
      if(k==='a'){const l=sg[sg.length-1];if(l.t1<dur)cmd(s,'F',0,S+l.t1,E,cv(l.b),cv(l.b));}
    }else{
      const v=pr.kf&&pr.kf.length?kfVal(pr,0):pr.v;
      if(k==='a'){const hide=mode==='trigger'&&grouped&&c.trigHide!==false;cmd(s,'F',0,S,E,hide?[0]:cv(v),hide?[0]:cv(v));}
      else if(k==='p'){s.x=Math.round(v[0]);s.y=Math.round(v[1]);}
      else{const def=PROP[k].def;if(v.some((x,i)=>Math.abs(x-def[i])>1e-6))cmd(s,T,0,S,S,cv(v),cv(v));}
    }
  }
  if(grouped&&gcmds.length){
    if(mode==='loop')s.loops.push({start:S,count:Math.max(1,Math.floor(dur/len)),cmds:gcmds});
    else{if(!gcmds.some(q=>q.type==='F')&&c.trigHide!==false)gcmds.push({type:'F',ease:0,t0:0,t1:Math.round(len),a:cv1(c),b:cv1(c)});
      s.trigs.push({name:c.trig||'HitSound',start:S,end:E,cmds:gcmds});}}
  if(c.sway&&c.sway.on&&mode==='normal')applySway(s,c,S,E);
  if(c.add)cmd(s,'P',0,S,E,'A');if(c.fh)cmd(s,'P',0,S,E,'H');if(c.fv)cmd(s,'P',0,S,E,'V');
  return s;
}
/* handheld camera: every few beats drift to a new random offset / tilt with ease-in-out (only where that property has no keyframes) */
const SWAY_DEF=()=>({on:true,amp:6,rot:0.6,beats:4,zoom:3});
function swayable(c){const P=c.props;return{p:!(P.p.kf&&P.p.kf.length),r:!(P.r.kf&&P.r.kf.length),s:!(P.s.kf&&P.s.kf.length)&&!(c.nonuni&&P.v.kf&&P.v.kf.length)};}
function applySway(s,c,S,E){
  const w=c.sway,ok=swayable(c),amp=clamp(+w.amp||0,0,200),rotA=clamp(+w.rot||0,0,45)*Math.PI/180;
  let h=0;for(const ch of c.id)h=(h*31+ch.charCodeAt(0))>>>0;const rng=rngFrom(h^0x5ea);
  const ts=[S];for(let t=S;t<E;){t=Math.min(E,t+Math.max(80,beatAt(t)*clamp(+w.beats||4,0.25,64)));ts.push(t);}
  const bx=s.x,by=s.y,br=ok.r?(c.props.r.v[0]||0)*Math.PI/180:0;
  if(ok.p&&amp>0){s.cmds=s.cmds.filter(q=>q.type!=='M');let px=bx,py=by;
    for(let i=1;i<ts.length;i++){const nx=i===ts.length-1&&false?bx:Math.round((bx+(rng()*2-1)*amp)*10)/10,ny=Math.round((by+(rng()*2-1)*amp)*10)/10;cmd(s,'M',17,ts[i-1],ts[i],[px,py],[nx,ny]);px=nx;py=ny;}}
  if(ok.r&&rotA>0){s.cmds=s.cmds.filter(q=>q.type!=='R');let pr=br;
    for(let i=1;i<ts.length;i++){const nr=+(br+(rng()*2-1)*rotA).toFixed(4);cmd(s,'R',17,ts[i-1],ts[i],pr,nr);pr=nr;}}
  const z=clamp(+w.zoom||0,0,50)/100;
  if(ok.s&&z>0){const old=s.cmds.find(q=>q.type==='S'),v=old?old.a[0]:(c.props.s.v[0]||100)/100;s.cmds=s.cmds.filter(q=>q.type!=='S');cmd(s,'S',0,S,S,+(v*(1+z)).toFixed(4));}
}
const cv1=c=>SBV.a(c.props.a.kf?kfVal(c.props.a,0):c.props.a.v);
/* effective style of one lyric line: global settings + that line's own overrides */
function lineStyleOf(key){const o={};for(const k of STYLE_KEYS)o[k]=state[k];const ov=key&&state.lineStyle[key];if(ov)for(const k of STYLE_KEYS)if(ov[k]!=null)o[k]=ov[k];return o;}

