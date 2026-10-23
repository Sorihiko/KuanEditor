/* 文字片段、转场片段：生成 sprite */
function newTextClip(tid,start,end){return{id:uid(),kind:'text',tid,start:Math.round(start),end:Math.round(end),text:ownColors(TEXT_DEF(),[['cardCol','accent'],['flashCol','accent']])};}
function newTransClip(tid,start,end){return{id:uid(),kind:'trans',tid,start:Math.round(start),end:Math.round(end),trans:TRANS_DEF()};}
const seedOf=id=>{let h=0;for(const ch of String(id))h=(h*31+ch.charCodeAt(0))>>>0;return h;};
const r3=v=>Math.round(v*1000)/1000;

/* ---------- free text: one sprite per character (the same glyphs as the lyrics), optional card behind ---------- */
function textLayout(q){
  gctx.font=q.font||'sans';for(const k of FX_KEYS)gctx[k]=state[k];
  const size=clamp(+q.size||40,6,300),rowH=size*1.35,rows=parseMarkup(String(q.text||'')).map(r=>layoutRow(r,size,size*(+q.track||0)/100));
  const W=rows.reduce((m,r)=>Math.max(m,r.width),0),H=rows.length*rowH,items=[];
  rows.forEach((r,ri)=>r.items.forEach(it=>{if(it.g)items.push({...it,dy:(ri-(rows.length-1)/2)*rowH});}));
  return{size,rowH,W,H,items};
}
function genText(c,tr,pal){
  const q=c.text,S=c.start,E=c.end,D=E-S;if(D<60)return;
  const b=beatAt(S),tin=Math.max(1,Math.min(D*0.45,b*clamp(+q.inBeats||0,0,16))),tout=Math.max(1,Math.min(D*0.45,beatAt(E)*clamp(+q.outBeats||0,0,16)));
  const{size,W,H,items}=textLayout(q);if(!items.length)return;
  const rot=(+q.rot||0)*Math.PI/180,co=Math.cos(rot),si=Math.sin(rot),X=+q.x,Y=+q.y,at=(dx,dy)=>[Math.round((X+dx*co-dy*si)*10)/10,Math.round((Y+dx*si+dy*co)*10)/10];
  const a=clamp(+q.alpha||0,0,100)/100,col=q.color==='accent'?pal.accent:(q.custom||[255,255,255]),emc=q.color==='accent'?pal.text:pal.accent;
  const tag=s=>{s.style='text';s.textId=c.id;s.layer=tr.layer;s.tid=tr.id;return s;},eOut=E-tout;
  if(q.card){const pad=clamp(+q.cardPad||0,0,200),cw=Math.round(W+pad*2),ch=Math.round(H+pad*1.2),ca=clamp(+q.cardAlpha||0,0,100)/100;
    const s=tag(spr(null,X,Y)),cr=rot+(+q.cardTilt||0)*Math.PI/180;
    if(Math.abs(cr)>1e-3)cmd(s,'R',0,S,S,r3(cr));colorAt(s,q.cardCol||pal.accent,S);if(q.add)cmd(s,'P',0,S,E,'A');
    if(q.inAnim==='none')cmd(s,'V',0,S,S,[cw,ch]);else cmd(s,'V',EZ.expoOut,S,S+tin,[0,ch],[cw,ch]);
    cmd(s,'F',0,S,S+Math.min(80,tin),0,ca);
    if(q.outAnim==='none')cmd(s,'F',0,E,E,0);else cmd(s,'F',EZ.quadIn,eOut,E,ca,0);}
  const n=items.length;
  items.forEach((it,i)=>{
    const P=at(it.dx,it.dy),sc=r3(it.sc),c0=it.emph?emc:col,t0=Math.round(q.inAnim==='type'?S+i*tin/n:S);
    const s=tag(spr(it.g,P[0],P[1]));
    if(Math.abs(rot)>1e-3)cmd(s,'R',0,t0,t0,r3(rot));
    if(q.add)cmd(s,'P',0,t0,E,'A');
    /* entrance */
    switch(q.inAnim){
      case 'pop':cmd(s,'F',0,t0,t0+Math.min(80,tin),0,a);cmd(s,'S',EZ.backOut,t0,t0+tin,r3(sc*1.6),sc);break;
      case 'fade':cmd(s,'S',0,t0,t0,sc);cmd(s,'F',EZ.out,t0,t0+tin,0,a);break;
      case 'up':cmd(s,'S',0,t0,t0,sc);cmd(s,'F',EZ.out,t0,t0+tin,0,a);cmd(s,'M',EZ.cubicOut,t0,t0+tin,at(it.dx,it.dy+size*0.8),P);break;
      case 'left':cmd(s,'S',0,t0,t0,sc);cmd(s,'F',EZ.out,t0,t0+tin,0,a);cmd(s,'M',EZ.cubicOut,t0,t0+tin,at(it.dx-size*2.2,it.dy),P);break;
      case 'type':cmd(s,'S',0,t0,t0,sc);cmd(s,'F',0,t0,t0,a);break;
      default:cmd(s,'S',0,t0,t0,sc);cmd(s,'F',0,t0,t0,a);}
    /* colour (optional flash on entry) */
    if(q.flash&&q.flashCol)cmd(s,'C',EZ.out,t0,t0+Math.max(tin,b),q.flashCol,c0);else colorAt(s,c0,t0);
    /* exit */
    switch(q.outAnim){
      case 'fade':cmd(s,'F',EZ.quadIn,eOut,E,a,0);break;
      case 'down':cmd(s,'F',EZ.quadIn,eOut,E,a,0);cmd(s,'M',EZ.quadIn,eOut,E,P,at(it.dx,it.dy+size*0.6));break;
      case 'zoom':cmd(s,'F',EZ.quadIn,eOut,E,a,0);cmd(s,'S',EZ.out,eOut,E,sc,r3(sc*1.5));break;
      default:cmd(s,'F',0,E,E,0);}
  });
}

/* ---------- transitions: one full-screen colour sprite ---------- */
function genTrans(c,tr,pal){
  const q=c.trans,S=c.start,E=c.end,D=E-S;if(D<20)return;
  const col=q.color==='accent'?pal.accent:(q.custom||[0,0,0]),a=clamp(+q.alpha||0,0,100)/100,W=870,H=490;
  const s=spr(null,320,240);s.style='trans';s.fxId=c.id;s.layer=tr.layer;s.tid=tr.id;
  cmd(s,'V',0,S,S,[W,H]);colorAt(s,col,S);if(q.add)cmd(s,'P',0,S,E,'A');
  if(q.type==='flash'){cmd(s,'F',EZ.out,S,E,a,0);return;}
  if(q.type==='fadeout'){cmd(s,'F',0,S,E,0,a);return;}
  if(q.type==='fadein'){cmd(s,'F',0,S,E,a,0);return;}
  const v={down:[0,-H],up:[0,H],right:[-W,0],left:[W,0]}[q.dir]||[0,-H],from=[320+v[0],240+v[1]],mid=[320,240],to=[320-v[0],240-v[1]];
  cmd(s,'F',0,S,E,a,a);
  if(q.mode==='reveal')cmd(s,'M',EZ.cubicOut,S,E,mid,to);
  else if(q.mode==='both'){const m=Math.round(S+D/2);cmd(s,'M',EZ.cubicOut,S,m,from,mid);cmd(s,'M',3,m,E,mid,to);}
  else cmd(s,'M',EZ.cubicOut,S,E,from,mid);
}

