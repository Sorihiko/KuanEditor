/* 歌词排版：冲击 / 散字 / 竖排 / 卡拉OK 生成 sprite */
/* ---------- storyboard model ---------- */
let sprites=[];
function spr(glyph,x,y){const s={glyph,x:Math.round(x),y:Math.round(y),cmds:[],loops:[],style:null};sprites.push(s);return s;}
function cmd(s,type,e,t0,t1,a,b){const A=[].concat(a);s.cmds.push({type,ease:e,t0:Math.round(t0),t1:Math.round(t1),a:A,b:b===undefined?A:[].concat(b)});}
function colorAt(s,col,t){if(col.join()!=='255,255,255')cmd(s,'C',0,t,t,col,col);}

function layoutRow(row,size,track){
  const items=row.map(it=>{const g=it.ch===' '?null:getGlyph(it.ch);const sc=size/GP*(it.emph?1.35:1);return{...it,g,sc,adv:g?g.adv*sc:size*0.35};});
  const total=items.reduce((s,i)=>s+i.adv,0)+track*Math.max(0,items.length-1);
  let x=-total/2;for(const it of items){it.dx=x+it.adv/2;x+=it.adv+track;}
  return{items,width:total};
}
function timesFor(n,S,E,b,ct){
  if(ct&&ct.length===n){const last=Math.max(...ct,S);return{times:ct.slice(),X:Math.max(Math.min(Math.max(E-b/2,last+b/3),E-60),last+40)};}
  const avail=(E-S)*0.55;let step=avail/Math.max(1,n);
  for(const d of [2,4,8]){if(n*b/d<=avail){step=b/d;break;}}
  const times=[];for(let i=0;i<n;i++)times.push(S+i*step);
  const last=times[n-1]||S;const X=Math.max(E-b/2,last+b/2);
  return{times,X};
}
function genSlam(L,c){
  const{S,E,b,rng,pal,size}=c;const rowH=size*1.5;
  const rows=L.rows.map(r=>layoutRow(r,size,size*0.06));
  const y0=240-(rows.length-1)*rowH/2;const items=[];
  rows.forEach((r,ri)=>r.items.forEach(it=>{if(it.g)items.push({...it,x:320+it.dx,y:y0+ri*rowH});}));
  const{times,X}=timesFor(items.length,S,E,b,L.charTimes);
  const band=spr(null,320,240);band.style='slam';
  cmd(band,'V',EZ.expoOut,S,S+b,[760,rows.length*rowH+24],[760,2]);
  cmd(band,'F',EZ.out,S,S+b,0.3,0);colorAt(band,pal.accent,S);cmd(band,'P',0,S,S+b,'A');
  items.forEach((it,i)=>{
    const a=times[i];const s=spr(it.g,it.x,it.y);s.style='slam';
    cmd(s,'F',0,a,a+50,0,1);
    cmd(s,'S',EZ.backOut,a,a+b/2,it.sc*1.8,it.sc);
    cmd(s,'R',EZ.cubicOut,a,a+b/2,(rng()-0.5)*0.7,0);
    colorAt(s,it.emph?pal.accent:pal.text,a);
    cmd(s,'F',EZ.quadIn,X,X+b/2,1,0);
    cmd(s,'M',EZ.quadIn,X,X+b/2,[s.x,s.y],[s.x,s.y-16]);
  });
}
function genScatter(L,c){
  const{S,E,b,rng,pal,size}=c;const rowH=size*1.6;
  const rows=L.rows.map(r=>layoutRow(r,size,size*0.12));
  const baseY=240+(rng()-0.5)*130,shiftX=(rng()-0.5)*110;const items=[];
  rows.forEach((r,ri)=>r.items.forEach(it=>{if(it.g)items.push({...it,x:320+shiftX+it.dx,y:baseY+ri*rowH-(rows.length-1)*rowH/2+(rng()-0.5)*size*0.5});}));
  const{times,X}=timesFor(items.length,S,E,b,L.charTimes);
  items.forEach((it,i)=>{
    const a=times[i];const s=spr(it.g,it.x,it.y);s.style='scatter';const rot=(rng()-0.5)*0.35;
    cmd(s,'F',EZ.out,a,a+b/2,0,1);
    cmd(s,'M',EZ.expoOut,a,a+b,[s.x+(rng()-0.5)*90,s.y+(rng()-0.5)*90],[s.x,s.y]);
    cmd(s,'S',0,a,a,it.sc);cmd(s,'R',0,a,a,rot);
    colorAt(s,it.emph?pal.accent:pal.text,a);
    const xi=X+i*Math.min(b/8,30);
    cmd(s,'F',EZ.quadIn,xi,xi+b/2,1,0);
    cmd(s,'M',EZ.quadIn,xi,xi+b/2,[s.x,s.y],[s.x+(rng()-0.5)*24,s.y+40]);
    cmd(s,'R',EZ.quadIn,xi,xi+b/2,rot,rot+(rng()-0.5)*0.8);
  });
}
function genVertical(L,c){
  const{S,E,b,rng,pal,size,idx}=c;const v=size*0.92,colGap=v*1.55;const cols=L.rows;
  const right=c.mixed?rng()<0.5:idx%2===0;
  const baseX=right?560:80+(cols.length-1)*colGap;
  const items=[];let firstH=0;
  cols.forEach((col,k)=>{
    const x=baseX-k*colGap;const hs=col.map(it=>it.ch===' '?v*0.4:v*1.1*(it.emph?1.35:1));
    const total=hs.reduce((a,h)=>a+h,0);let y=240-total/2;if(k===0)firstH=total;
    col.forEach((it,j)=>{const cy=y+hs[j]/2;y+=hs[j];if(it.ch===' ')return;
      items.push({...it,g:getGlyph(it.ch),sc:v/GP*(it.emph?1.35:1),x,y:cy});});
  });
  const{times,X}=timesFor(items.length,S,E,b,L.charTimes);
  const bar=spr(null,baseX+v*0.95,240);bar.style='vertical';
  cmd(bar,'V',EZ.cubicOut,S,S+b,[3,0],[3,firstH]);cmd(bar,'F',0,S,S,0.75);colorAt(bar,pal.accent,S);
  cmd(bar,'F',EZ.quadIn,X,X+b/2,0.75,0);
  items.forEach((it,i)=>{
    const a=times[i];const s=spr(it.g,it.x,it.y);s.style='vertical';
    cmd(s,'F',0,a,a+b/4,0,1);
    cmd(s,'M',EZ.cubicOut,a,a+b/2,[s.x,s.y-26],[s.x,s.y]);
    cmd(s,'S',0,a,a,it.sc);
    colorAt(s,it.emph?pal.accent:pal.text,a);
    cmd(s,'F',EZ.quadIn,X,X+b/2,1,0);
    cmd(s,'M',EZ.quadIn,X,X+b/2,[s.x,s.y],[s.x-24,s.y]);
  });
}
/* karaoke: the whole line shows dimmed, each character lights up when it is sung */
function genKaraoke(L,c){
  const{S,E,b,pal,size}=c;const rowH=size*1.45;
  const rows=L.rows.map(r=>layoutRow(r,size,size*0.04));
  const y0=240-(rows.length-1)*rowH/2;const items=[];
  rows.forEach((r,ri)=>r.items.forEach(it=>{if(it.g)items.push({...it,x:320+it.dx,y:y0+ri*rowH});}));
  const n=items.length,ct=L.charTimes&&L.charTimes.length===n?L.charTimes:Array.from({length:n},(_,i)=>S+i*(E-S)*0.8/Math.max(1,n));
  const lit=pal.accent,dim=pal.text.map(v=>Math.round(v*0.34));
  const out=Math.max(E-b/2,Math.max(S,...ct)+b/3),fin=Math.max(S-Math.min(b/2,180),0);
  items.forEach((it,i)=>{
    const a=Math.max(S,Math.min(ct[i],out-60)),s=spr(it.g,it.x,it.y);s.style='karaoke';
    cmd(s,'F',EZ.out,fin,S,0,1);cmd(s,'S',0,fin,fin,it.sc);
    cmd(s,'C',0,fin,fin,dim,dim);cmd(s,'C',EZ.out,a,a+80,dim,lit);
    cmd(s,'S',EZ.backOut,a,a+Math.min(b/2,220),it.sc*1.16,it.sc);
    cmd(s,'F',EZ.quadIn,out,out+b/2,1,0);
  });
}
const GEN={slam:genSlam,scatter:genScatter,vertical:genVertical,karaoke:genKaraoke};
function songSpan(lastEnd){
  const audioDur=audio.duration&&isFinite(audio.duration)?audio.duration*1000:0;
  const kiaiEnds=map.kiai.map(k=>k.e||0),clipEnds=state.clips.map(c=>c.end+500);
  const duration=Math.max(lastEnd,audioDur,...kiaiEnds,...clipEnds,10000);
  return{duration,kiai:map.kiai.map(k=>({s:k.s,e:k.e==null?duration:k.e}))};
}
/* move/scale a finished lyric line: global anchor + this line's own offset */
function tfSprites(list,tf){
  const T=(x,y)=>[tf.ax+(x-320)*tf.k+tf.dx,tf.ay+(y-240)*tf.k+tf.dy];
  for(const s of list){const p=T(s.x,s.y);s.x=Math.round(p[0]);s.y=Math.round(p[1]);
    for(const c of s.cmds){if(c.type==='M'){c.a=T(c.a[0],c.a[1]);c.b=T(c.b[0],c.b[1]);}else if(c.type==='S'||c.type==='V'){c.a=c.a.map(v=>v*tf.k);c.b=c.b.map(v=>v*tf.k);}}}
}

