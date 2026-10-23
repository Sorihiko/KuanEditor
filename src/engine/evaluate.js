/* 按 osu! 规则计算某一时刻 sprite 的位置、颜色等 */
/* ---------- evaluation (osu! semantics) ---------- */
function compile(s){
  const all=[...s.cmds];
  for(const L of s.loops){const len=Math.max(...L.cmds.map(c=>c.t1));for(let i=0;i<L.count;i++){const o=L.start+i*len;for(const c of L.cmds)all.push({...c,t0:c.t0+o,t1:c.t1+o});}}
  s.by={};let a=Infinity,z=-Infinity;
  for(const c of all){(s.by[c.type]||(s.by[c.type]=[])).push(c);a=Math.min(a,c.t0);z=Math.max(z,c.t1);}
  for(const k in s.by)s.by[k].sort((p,q)=>p.t0-q.t0);
  s.tStart=a;s.tEnd=z;
  s.tg=null;
  if(s.trigs&&s.trigs.length){const T=s.trigs[0],by={};let len=0;
    for(const c of T.cmds){(by[c.type]||(by[c.type]=[])).push(c);len=Math.max(len,c.t1);}
    for(const k in by)by[k].sort((p,q)=>p.t0-q.t0);
    s.tg={by,len,fires:triggerFires(T)};}
}
const TRIGGERS=[['HitSound','任何打击音'],['HitSoundClap','Clap 音效'],['HitSoundWhistle','Whistle 音效'],['HitSoundFinish','Finish 音效'],['Passing','状态变好（通过）'],['Failing','状态变差（失败）']];
/* note times inside the trigger window whose hitsound matches (preview only; Passing/Failing never fire here) */
function triggerFires(T){const bit={HitSoundClap:8,HitSoundWhistle:2,HitSoundFinish:4}[T.name];if(!/^HitSound/.test(T.name))return[];
  return(map.objs||[]).filter(o=>o.kind!=='spinner'&&o.t>=T.start&&o.t<=T.end&&(!bit||(o.hs&bit))).map(o=>o.t);}
function val(list,t,def){
  if(!list)return def;
  if(t<=list[0].t0)return list[0].a;
  if(list.length>24){let lo=0,hi=list.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(list[m].t0<=t)lo=m;else hi=m-1;}
    const c=list[lo];if(t>c.t1)return c.b;if(c.t1===c.t0)return c.b;const p=ease(c.ease,(t-c.t0)/(c.t1-c.t0));return c.a.map((v,j)=>v+(c.b[j]-v)*p);}
  for(let i=0;i<list.length;i++){const c=list[i];
    if(t<c.t0)return list[i-1].b;
    if(t<=c.t1){if(c.t1===c.t0)return c.b;const p=ease(c.ease,(t-c.t0)/(c.t1-c.t0));return c.a.map((v,j)=>v+(c.b[j]-v)*p);}}
  return list[list.length-1].b;
}
function pOn(s,t,f){const l=s.by.P;if(!l)return false;return l.some(c=>c.a[0]===f&&(c.t0===c.t1||(t>=c.t0&&t<=c.t1)));}
function evalSprite(s,t,force){
  if(t<s.tStart||t>s.tEnd)return null;
  let V=(k,d)=>val(s.by[k],t,d);
  if(s.tg&&s.tg.fires.length){const F=s.tg.fires;let lo=0,hi=F.length-1,f=null;while(lo<=hi){const m=(lo+hi)>>1;if(F[m]<=t){f=F[m];lo=m+1;}else hi=m-1;}
    if(f!=null&&t-f<=s.tg.len){const by=s.tg.by,rt=t-f;V=(k,d)=>by[k]?val(by[k],rt,d):val(s.by[k],t,d);}}
  const al=V('F',[1])[0];if(al<=0.004&&!force)return null;
  let pos=V('M',[s.x,s.y]);if(s.by.MX||s.by.MY)pos=[s.by.MX?V('MX',[pos[0]])[0]:pos[0],s.by.MY?V('MY',[pos[1]])[0]:pos[1]];
  return{al:clamp(al,0,1),pos,sc:V('S',[1])[0],vec:V('V',[1,1]),r:V('R',[0])[0],
    col:V('C',[255,255,255]).map(v=>clamp(Math.round(v),0,255)),add:pOn(s,t,'A'),fh:pOn(s,t,'H'),fv:pOn(s,t,'V')};
}
function spriteQuad(s,e){
  const g=s.glyph,w=g?g.w:1,h=g?g.h:1,o=ORIGINS[s.origin||'Centre'];
  const sx=e.sc*e.vec[0],sy=e.sc*e.vec[1],c=Math.cos(e.r),sn=Math.sin(e.r);
  return[[-w*o[0],-h*o[1]],[w*(1-o[0]),-h*o[1]],[w*(1-o[0]),h*(1-o[1])],[-w*o[0],h*(1-o[1])]].map(([x,y])=>{x*=sx;y*=sy;return[e.pos[0]+x*c-y*sn,e.pos[1]+x*sn+y*c];});
}
function inQuad(q,x,y){let sg=0;for(let i=0;i<4;i++){const a=q[i],b=q[(i+1)%4],cr=(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);if(cr){const s2=cr>0?1:-1;if(sg&&s2!==sg)return false;sg=s2;}}return true;}

