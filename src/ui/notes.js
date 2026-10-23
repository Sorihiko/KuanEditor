/* 监视器里的 note 预览与选中框 */
/* ---------- note preview (not exported) ---------- */
function drawNotes(t,cx){if(!cx)cx=$('#cv').getContext('2d');
  const O=map.objs;if(!O||!O.length)return false;
  const R=circleR(),ar=map.ar!=null?map.ar:5,pre=ar<5?1200+600*(5-ar)/5:1200-750*(ar-5)/5,fin=ar<5?800+400*(5-ar)/5:800-500*(ar-5)/5,OUT=240;
  const vis=[];for(const o of O){if(o.t-pre>t)break;if((o.endT||o.t)+OUT<t)continue;vis.push(o);}
  if(!vis.length)return false;
  cx.save();cx.translate(64,56);cx.globalCompositeOperation='source-over';cx.lineCap='round';cx.lineJoin='round';
  const rgb=(c,a)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;
  for(let i=vis.length-1;i>=0;i--){const o=vis[i],ain=clamp((t-(o.t-pre))/fin,0,1);
    if(o.kind==='spinner'){const a=t<o.t?ain:t<=o.endT?1:1-(t-o.endT)/OUT;if(a<=0)continue;cx.globalAlpha=a*0.85;
      const p=t<o.t?0:clamp((t-o.t)/Math.max(1,o.endT-o.t),0,1);cx.strokeStyle='#fff';cx.lineWidth=4;cx.beginPath();cx.arc(256,192,170,0,Math.PI*2);cx.stroke();
      cx.lineWidth=3;cx.strokeStyle=rgb(o.combo,1);cx.beginPath();cx.arc(256,192,Math.max(4,170*(1-p)),0,Math.PI*2);cx.stroke();
      cx.fillStyle='#fff';cx.font='700 22px "Noto Sans SC",sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('SPIN',256,192);continue;}
    if(o.kind==='slider'){const a=t<=o.endT?ain*0.92:0.92*(1-(t-o.endT)/OUT);
      if(a>0){cx.globalAlpha=a;cx.strokeStyle='#fff';cx.lineWidth=R*2;cx.beginPath();o.path.forEach((p,j)=>j?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.stroke();
        cx.strokeStyle=rgb(o.combo.map(v=>Math.round(v*0.35)),1);cx.lineWidth=R*1.76;cx.stroke();
        const ep=o.path[o.path.length-1];cx.strokeStyle='rgba(255,255,255,.5)';cx.lineWidth=R*0.1;cx.beginPath();cx.arc(ep[0],ep[1],R*0.92,0,Math.PI*2);cx.stroke();
        if(t>=o.t&&t<=o.endT){const e=(t-o.t)/Math.max(1,o.span),k=Math.min(o.slides-1,Math.floor(e)),fr=e-k,pos=pathAt(o,k%2?1-fr:fr);
          cx.globalAlpha=1;cx.fillStyle=rgb(o.combo,1);cx.beginPath();cx.arc(pos[0],pos[1],R*0.85,0,Math.PI*2);cx.fill();cx.strokeStyle='#fff';cx.lineWidth=R*0.12;cx.stroke();
          cx.globalAlpha=0.5;cx.lineWidth=R*0.06;cx.beginPath();cx.arc(pos[0],pos[1],R*2,0,Math.PI*2);cx.stroke();}}}
    /* hit circle / slider head */
    let a,sc=1;if(t<o.t)a=ain;else{const p=(t-o.t)/(o.kind==='slider'?150:OUT);a=1-p;sc=1+(o.kind==='slider'?0:0.4*p);}
    if(a>0){cx.globalAlpha=a;cx.fillStyle=rgb(o.combo,0.9);cx.beginPath();cx.arc(o.x,o.y,R*0.92*sc,0,Math.PI*2);cx.fill();cx.strokeStyle='#fff';cx.lineWidth=R*0.12;cx.stroke();
      cx.fillStyle='#fff';cx.font=`700 ${Math.round(R*0.8)}px "Noto Sans SC",sans-serif`;cx.textAlign='center';cx.textBaseline='middle';cx.fillText(String(o.num),o.x,o.y+R*0.04);}
    if(t<o.t){cx.globalAlpha=ain;cx.strokeStyle=rgb(o.combo,1);cx.lineWidth=R*0.09;cx.beginPath();cx.arc(o.x,o.y,R*(1+3*(o.t-t)/pre),0,Math.PI*2);cx.stroke();}
  }
  cx.restore();cx.globalAlpha=1;return true;
}
/* selection outline + handles, in SB coordinates */
function selShape(t){
  if(!sel)return null;
  if(sel.type==='clip'){const tc0=clipById(sel.id);if(tc0&&tc0.kind==='text'){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,any=false;
      for(const s of gen.sprites){if(s.textId!==sel.id||!s.glyph)continue;const e=evalSprite(s,t);if(!e||e.al<0.01)continue;any=true;for(const[x,y]of spriteQuad(s,e)){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
      return any?{kind:'text',q:[[x0,y0],[x1,y0],[x1,y1],[x0,y1]],c:[(x0+x1)/2,(y0+y1)/2],rot:false}:null;}
    const s=gen.sprites.find(x=>x.clipId===sel.id);if(!s)return null;const e=evalSprite(s,t,true);if(!e)return null;
    const q=spriteQuad(s,e);return{kind:'clip',q,c:[e.pos[0],e.pos[1]],rot:true};}
  if(sel.type==='line'){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,any=false;
    for(const s of gen.sprites){if(s.lineKey!==sel.key||!s.glyph)continue;const e=evalSprite(s,t);if(!e)continue;any=true;
      for(const[x,y]of spriteQuad(s,e)){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
    if(!any)return null;const d=liveTf&&liveTf.key===sel.key?liveTf:{dx:0,dy:0};
    x0+=d.dx;x1+=d.dx;y0+=d.dy;y1+=d.dy;
    return{kind:'line',q:[[x0,y0],[x1,y0],[x1,y1],[x0,y1]],c:[(x0+x1)/2,(y0+y1)/2],rot:false};}
  return null;
}
function rotHandle(sh){const q=sh.q,mx=(q[0][0]+q[1][0])/2,my=(q[0][1]+q[1][1])/2,cxp=sh.c[0],cyp=sh.c[1];const dx=mx-cxp,dy=my-cyp,l=Math.hypot(dx,dy)||1;return[mx+dx/l*24/K()*Math.min(2,window.devicePixelRatio||1),my+dy/l*24/K()*Math.min(2,window.devicePixelRatio||1)];}
function drawSelection(t){
  const sh=selShape(t);if(!sh)return;const k=K(),d=Math.min(2,window.devicePixelRatio||1);
  cx.setTransform(1,0,0,1,0,0);cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
  const P=sh.q.map(([x,y])=>toDev(x,y));
  cx.strokeStyle='#4b9dff';cx.lineWidth=1.5*d;cx.beginPath();P.forEach((p,i)=>i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.closePath();cx.stroke();
  cx.fillStyle='#fff';for(const p of P){cx.fillRect(p[0]-4*d,p[1]-4*d,8*d,8*d);cx.strokeRect(p[0]-4*d,p[1]-4*d,8*d,8*d);}
  const C=toDev(sh.c[0],sh.c[1]);cx.beginPath();cx.moveTo(C[0]-6*d,C[1]);cx.lineTo(C[0]+6*d,C[1]);cx.moveTo(C[0],C[1]-6*d);cx.lineTo(C[0],C[1]+6*d);cx.stroke();
  if(sh.rot){const R=toDev(...rotHandle(sh)),M=[(P[0][0]+P[1][0])/2,(P[0][1]+P[1][1])/2];cx.beginPath();cx.moveTo(M[0],M[1]);cx.lineTo(R[0],R[1]);cx.stroke();cx.beginPath();cx.arc(R[0],R[1],5*d,0,Math.PI*2);cx.fill();cx.stroke();}
}
let mdrag=null;
cv.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;const t=now(),p=toSB(e),d=Math.min(2,window.devicePixelRatio||1),hitR=9*d/K();
  let sh=selShape(t),mode=null;
  if(sh){for(const q of sh.q)if(Math.hypot(q[0]-p[0],q[1]-p[1])<=hitR){mode='scale';break;}
    if(!mode&&sh.rot){const R=rotHandle(sh);if(Math.hypot(R[0]-p[0],R[1]-p[1])<=hitR)mode='rot';}
    if(!mode&&inQuad(sh.q,p[0],p[1]))mode='move';}
  if(!mode){let hit=null;
    const hid=hiddenTids();for(let i=gen.sprites.length-1;i>=0;i--){const s=gen.sprites[i];if(!s.clipId&&!s.lineKey&&!s.textId)continue;if(hid.has(s.tid))continue;if(s.lineKey&&!s.glyph)continue;const ev=evalSprite(s,t);if(!ev||ev.al<0.02)continue;if(inQuad(spriteQuad(s,ev),p[0],p[1])){hit=s;break;}}
    if(hit&&hit.lineKey&&(e.ctrlKey||e.metaKey)&&sel&&sel.type==='line'){toggleLine(hit.lineKey);return;}
    if(hit){sel=hit.clipId||hit.textId?{type:'clip',id:hit.clipId||hit.textId}:{type:'line',key:hit.lineKey};if(hit.clipId){activeTid=hit.tid;}if(!(hit.lineKey&&!$('#pane-style').hidden))showTab($('#tab-fx'));renderFx();renderHeaders();sh=selShape(t);mode=sh?'move':null;}
    else{if(sel){sel=null;renderFx();}return;}}
  if(!mode)return;cv.setPointerCapture(e.pointerId);
  const c=selClip();
  mdrag={mode,p0:p,c0:sh.c,shiftAt:e.shiftKey,
    v0:c&&c.text?{x:+c.text.x,y:+c.text.y,size:+c.text.size}:c&&c.props?{p:propAt(c,'p',t).slice(),s:propAt(c,'s',t)[0],r:propAt(c,'r',t)[0]}:null,
    lt0:sel.type==='line'?Object.assign({dx:0,dy:0,s:100},state.lineTf[sel.key]||{}):null,moved:false};
});
cv.addEventListener('pointermove',e=>{
  const p=toSB(e);
  if(!mdrag){const sh=selShape(now());let cur='default';if(sh){const d=Math.min(2,window.devicePixelRatio||1),hitR=9*d/K();
      if(sh.q.some(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<=hitR))cur='nwse-resize';else if(sh.rot&&Math.hypot(...rotHandle(sh).map((v,i)=>v-p[i]))<=hitR)cur='grab';else if(inQuad(sh.q,p[0],p[1]))cur='move';}
    cv.style.cursor=cur;return;}
  const dx=p[0]-mdrag.p0[0],dy=p[1]-mdrag.p0[1];if(!mdrag.moved&&Math.hypot(dx,dy)<1.5)return;mdrag.moved=true;
  const c=selClip(),t=now();
  if(c&&c.text){const q=c.text;
    if(mdrag.mode==='move'){let nx=mdrag.v0.x+dx,ny=mdrag.v0.y+dy;if(e.shiftKey){if(Math.abs(dx)>Math.abs(dy))ny=mdrag.v0.y;else nx=mdrag.v0.x;}q.x=Math.round(nx);q.y=Math.round(ny);}
    else if(mdrag.mode==='scale'){const d0=Math.hypot(mdrag.p0[0]-mdrag.c0[0],mdrag.p0[1]-mdrag.c0[1])||1,d1=Math.hypot(p[0]-mdrag.c0[0],p[1]-mdrag.c0[1]);q.size=clamp(Math.round(mdrag.v0.size*d1/d0),6,300);}
    rebuild();}
  else if(c&&c.props){
    if(mdrag.mode==='move'){let nx=mdrag.v0.p[0]+dx,ny=mdrag.v0.p[1]+dy;if(e.shiftKey){if(Math.abs(dx)>Math.abs(dy))ny=mdrag.v0.p[1];else nx=mdrag.v0.p[0];}setProp(c,'p',[Math.round(nx),Math.round(ny)],t);}
    else if(mdrag.mode==='scale'){const d0=Math.hypot(mdrag.p0[0]-mdrag.c0[0],mdrag.p0[1]-mdrag.c0[1])||1,d1=Math.hypot(p[0]-mdrag.c0[0],p[1]-mdrag.c0[1]);setProp(c,'s',[Math.max(1,+(mdrag.v0.s*d1/d0).toFixed(1))],t);}
    else if(mdrag.mode==='rot'){const a0=Math.atan2(mdrag.p0[1]-mdrag.c0[1],mdrag.p0[0]-mdrag.c0[0]),a1=Math.atan2(p[1]-mdrag.c0[1],p[0]-mdrag.c0[0]);let r=mdrag.v0.r+(a1-a0)*180/Math.PI;if(e.shiftKey)r=Math.round(r/15)*15;setProp(c,'r',[+r.toFixed(1)],t);}
    rebuild();updateFxValues(true);
  }else if(sel&&sel.type==='line'){
    if(mdrag.mode==='move'){let ddx=dx,ddy=dy;if(e.shiftKey){if(Math.abs(dx)>Math.abs(dy))ddy=0;else ddx=0;}liveTf={key:sel.key,dx:Math.round(ddx),dy:Math.round(ddy)};}
    else if(mdrag.mode==='scale'){const d0=Math.hypot(mdrag.p0[0]-mdrag.c0[0],mdrag.p0[1]-mdrag.c0[1])||1,d1=Math.hypot(p[0]-mdrag.c0[0],p[1]-mdrag.c0[1]);
      state.lineTf[sel.key]=Object.assign({},mdrag.lt0,{s:Math.max(10,Math.round(mdrag.lt0.s*d1/d0))});rebuild();}
  }
});
cv.addEventListener('pointerup',()=>{
  if(!mdrag)return;const m=mdrag;mdrag=null;
  if(sel&&sel.type==='line'&&liveTf){const lt=Object.assign({dx:0,dy:0,s:100},state.lineTf[sel.key]||{});lt.dx=(m.lt0.dx||0)+liveTf.dx;lt.dy=(m.lt0.dy||0)+liveTf.dy;state.lineTf[sel.key]=lt;liveTf=null;}
  if(m.moved)commit();
});
cv.addEventListener('pointercancel',()=>{mdrag=null;liveTf=null;});

