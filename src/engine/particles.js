/* 粒子系统 */
/* ---------- particles (after storybrew's Particles script) ---------- */
/* particle picture: a built-in texture, or an image from the bin (exported with the storyboard) */
function partTex(p){if(p.tex==='custom'){const m=mediaReady(p.texImg);if(m)return m.g;}return fxTex(p.tex&&p.tex!=='custom'?p.tex:'dot');}
function newPartClip(tid,start,end){return{id:uid(),kind:'part',tid,start:Math.round(start),end:Math.round(end),part:ownColors(PART_DEF(),[['custom','accent']])};}
/* pixel grid of an image (cached): [{x,y,col,a}] centred on 0,0, cols scaled to `width` px */
const pixCache=new Map();
function imagePixels(mid,step,width){
  const m=mediaReady(mid);if(!m)return null;const key=[m.g.key,step,width].join('|');let P=pixCache.get(key);if(P)return P;
  const gw=Math.max(2,Math.round(width/step)),gh=Math.max(2,Math.round(gw*m.h/m.w)),cv=document.createElement('canvas');cv.width=gw;cv.height=gh;
  const x=cv.getContext('2d',{willReadFrequently:true});x.drawImage(m.img,0,0,gw,gh);const d=x.getImageData(0,0,gw,gh).data;P=[];
  for(let j=0;j<gh;j++)for(let i=0;i<gw;i++){const o=(j*gw+i)*4;if(d[o+3]<110)continue;P.push({x:(i-(gw-1)/2)*step,y:(j-(gh-1)/2)*step,col:[d[o],d[o+1],d[o+2]],a:d[o+3]/255});}
  pixCache.set(key,P);if(pixCache.size>12)pixCache.delete(pixCache.keys().next().value);return P;
}
/* image mode: particles fly in to form the picture, hold, then scatter */
function genPartImage(c,tr,pal){
  const p=c.part,S=c.start,E=c.end,dur=E-S;let step=Math.max(2,+p.step||10);
  let P=imagePixels(p.img,step,+p.width||360);if(!P||!P.length)return;
  while(P.length>1500){step=Math.round(step*1.3)+1;P=imagePixels(p.img,step,+p.width||360);}
  let h=0;for(const ch of c.id)h=(h*31+ch.charCodeAt(0))>>>0;const rng=rngFrom(h);
  const tex=partTex(p),sz=(+p.size||step*0.9)/Math.max(tex.w,tex.h)*(p.tex==='glow'?2.2:1),a=clamp(p.alpha,0,100)/100;
  const tin=dur*clamp(+p.fadeIn||30,1,95)/100,tout=dur*clamp(+p.fadeOut||30,1,95)/100,hold1=E-tout;
  for(const q of P){
    const tx=Math.round(p.x+q.x),ty=Math.round(p.y+q.y),ang=rng()*Math.PI*2,r=(+p.spread||300)*(0.4+rng()*0.6);
    const fx=Math.round(tx+Math.cos(ang)*r),fy=Math.round(ty+Math.sin(ang)*r),t0=Math.round(S+rng()*tin*0.35),t1=Math.round(S+tin*(0.65+rng()*0.35));
    const oa=rng()*Math.PI*2,od=(+p.speed||200)*(0.5+rng()),t2=Math.round(hold1+rng()*tout*0.3),t3=Math.round(E-rng()*tout*0.2);
    const col=p.color==='image'?q.col:p.color==='accent'?pal.accent:p.custom;
    const s=spr(tex,fx,fy);s.style='part';s.partId=c.id;s.layer=tr.layer;s.tid=tr.id;
    cmd(s,'S',0,t0,t0,+(sz*(1+(rng()*2-1)*clamp(p.sizeVar,0,100)/200)).toFixed(4));colorAt(s,col,t0);if(p.add)cmd(s,'P',0,t0,t3,'A');
    cmd(s,'F',EZ.out,t0,t1,0,a*q.a);cmd(s,'M',+p.ease||EZ.expoOut,t0,t1,[fx,fy],[tx,ty]);
    cmd(s,'M',EZ.quadIn,t2,t3,[tx,ty],[Math.round(tx+Math.cos(oa)*od),Math.round(ty+Math.sin(oa)*od)]);cmd(s,'F',EZ.quadIn,t2,t3,a*q.a,0);
  }
}
function genPart(c,tr,pal){
  const p=c.part,S=c.start,E=c.end,dur=E-S;if(dur<100)return;
  if(p.shape==='image')return genPartImage(c,tr,pal);
  const life=clamp(+p.life||1000,150,120000),loops=Math.max(1,Math.floor(dur/life)),ld=dur/loops,n=clamp(Math.round(p.count),1,500);
  let h=0;for(const ch of c.id)h=(h*31+ch.charCodeAt(0))>>>0;const rng=rngFrom(h);
  const tex=partTex(p),base=(+p.size||10)/Math.max(tex.w,tex.h)*(p.tex==='glow'?2.2:1),col0=p.color==='accent'?pal.accent:p.custom,a=clamp(p.alpha,0,100)/100;
  const fi=clamp(+p.fadeIn||0,0,100)/100,fo=clamp(+p.fadeOut||0,0,100)/100;
  for(let i=0;i<n;i++){
    const st=Math.round(S+i*ld/n),cnt=Math.max(1,Math.floor((E-st)/ld+1e-6));
    let x,y;if(p.shape==='circle'){const ang=rng()*Math.PI*2,r=p.spread*Math.sqrt(rng());x=p.x+Math.cos(ang)*r;y=p.y+Math.sin(ang)*r;}else{x=p.x+(rng()*2-1)*p.spread;y=p.y;}
    const ma=(p.angle+(rng()-0.5)*p.angleSpread)*Math.PI/180,dist=p.speed*ld/1000,ex=x+Math.cos(ma)*dist,ey=y-Math.sin(ma)*dist;
    const sc=Math.max(0.01,base*(1+(rng()*2-1)*clamp(p.sizeVar,0,100)/100));
    const f=(rng()*2-1)*clamp(p.colorVar,0,100)/100,col=col0.map(v=>Math.round(f>0?v+(255-v)*f:v*(1+f)));
    const mo=p.motion||'dir';
    if(mo==='in'||mo==='orbit'){genPartRound(c,tr,p,mo,{st,cnt,ld,sc,col,a,fi,fo,rng,tex});continue;}
    const s=spr(tex,x,y);s.style='part';s.partId=c.id;s.layer=tr.layer;s.tid=tr.id;
    cmd(s,'S',0,st,st,sc);colorAt(s,col,st);if(p.add)cmd(s,'P',0,st,Math.round(st+ld*cnt),'A');
    const L=Math.round(ld),r0=rng()*Math.PI*2,lc=[];
    lc.push({type:'F',ease:EZ.out,t0:0,t1:Math.max(1,Math.round(L*fi)),a:[0],b:[a]});
    lc.push({type:'F',ease:EZ.quadIn,t0:Math.round(L*(1-fo)),t1:L,a:[a],b:[0]});
    lc.push({type:'M',ease:+p.ease||0,t0:0,t1:L,a:[Math.round(x),Math.round(y)],b:[Math.round(ex),Math.round(ey)]});
    if(p.align){const r=-(ma+Math.PI/2);if(Math.abs(r)>1e-3)cmd(s,'R',0,st,st,+r.toFixed(4));}
    else if(p.spin)lc.push({type:'R',ease:0,t0:0,t1:L,a:[+r0.toFixed(3)],b:[+(r0+p.spin*Math.PI/180*L/1000*(rng()<0.5?-1:1)).toFixed(3)]});
    else if(p.randRot??(p.tex==='petal'||p.tex==='star'))cmd(s,'R',0,st,st,+r0.toFixed(3));
    s.loops.push({start:st,count:cnt,cmds:lc});
  }
}


/* "in": spawn on a ring around (x,y) and get pulled into the centre (shrinking); "orbit": circle around (x,y) */
function genPartRound(c,tr,p,mo,o){
  const{st,cnt,ld,sc,col,a,fi,fo,rng,tex}=o,L=Math.round(ld),cx=+p.x,cy=+p.y,R=Math.max(1,+p.spread||200),flat=clamp(p.tilt??100,5,100)/100;
  const ang=rng()*Math.PI*2,lc=[];let x0,y0;
  lc.push({type:'F',ease:EZ.out,t0:0,t1:Math.max(1,Math.round(L*fi)),a:[0],b:[a]});
  lc.push({type:'F',ease:EZ.quadIn,t0:Math.round(L*(1-fo)),t1:L,a:[a],b:[0]});
  if(mo==='in'){const r0=R*(0.75+0.25*rng()),j=R*0.03;x0=Math.round(cx+Math.cos(ang)*r0);y0=Math.round(cy+Math.sin(ang)*r0*flat);
    const x1=Math.round(cx+(rng()*2-1)*j),y1=Math.round(cy+(rng()*2-1)*j);
    lc.push({type:'M',ease:+p.ease||EZ.quadIn,t0:0,t1:L,a:[x0,y0],b:[x1,y1]});
    const k=clamp(p.shrinkTo??30,0,100)/100;if(k<0.999)lc.push({type:'S',ease:+p.ease||EZ.quadIn,t0:0,t1:L,a:[+sc.toFixed(4)],b:[+(sc*k).toFixed(4)]});
    if(p.align){const r=Math.atan2(y1-y0,x1-x0)+Math.PI/2;var rot=+r.toFixed(4);}}
  else{const r=R*(0.55+0.45*Math.sqrt(rng())),dirs=p.orbitDir==='cw'?1:p.orbitDir==='ccw'?-1:(rng()<0.5?1:-1);
    const th=dirs*(Math.max(0,+p.speed||0)*L/1000)/r,n=clamp(Math.ceil(Math.abs(th)/(Math.PI/6)),1,24),pt=k=>{const q=ang+th*k/n;return[Math.round(cx+Math.cos(q)*r),Math.round(cy+Math.sin(q)*r*flat)];};
    let prev=pt(0);x0=prev[0];y0=prev[1];
    for(let k=1;k<=n;k++){const nx=pt(k);lc.push({type:'M',ease:0,t0:Math.round(L*(k-1)/n),t1:Math.round(L*k/n),a:prev,b:nx});prev=nx;}}
  const s=spr(tex,x0,y0);s.style='part';s.partId=c.id;s.layer=tr.layer;s.tid=tr.id;
  if(mo!=='in'||(clamp(p.shrinkTo??30,0,100)>=99.9))cmd(s,'S',0,st,st,sc);colorAt(s,col,st);if(p.add)cmd(s,'P',0,st,Math.round(st+ld*cnt),'A');
  if(typeof rot==='number'&&Math.abs(rot)>1e-3)cmd(s,'R',0,st,st,rot);
  else if(p.spin){const r0=rng()*Math.PI*2;lc.push({type:'R',ease:0,t0:0,t1:L,a:[+r0.toFixed(3)],b:[+(r0+p.spin*Math.PI/180*L/1000).toFixed(3)]});}
  else if(p.randRot??(p.tex==='petal'||p.tex==='star'))cmd(s,'R',0,st,st,+(rng()*Math.PI*2).toFixed(3));
  s.loops.push({start:st,count:cnt,cmds:lc});
}
