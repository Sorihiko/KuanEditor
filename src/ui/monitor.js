/* 节目监视器的 2D 绘制 */
/* ---------- monitor ---------- */
function fitCanvas(c){const r=c.getBoundingClientRect();const d=Math.min(2,window.devicePixelRatio||1);const w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(c.width!==w||c.height!==h){c.width=w;c.height=h;}}
/* full-screen preview: the whole monitor box goes full screen (or fills the window when the browser refuses, e.g. inside an iframe) */
let fsOn=false,fsFake=false,fsHintT=0;
function fsToggle(){if(fsOn)fsExit();else fsEnter();}
function fsEnter(){const box=$('#screenbox');fsOn=true;box.classList.add('fs');closeCtx();
  const fake=()=>{fsFake=true;box.classList.add('fakefs');};
  try{if(box.requestFullscreen)box.requestFullscreen({navigationUI:'hide'}).catch(fake);else fake();}catch(e){fake();}
  const h=$('#fsHint');h.hidden=false;h.classList.remove('gone');clearTimeout(fsHintT);fsHintT=setTimeout(()=>h.classList.add('gone'),2200);
  $('#fsBtn').setAttribute('aria-pressed','true');setTimeout(()=>{fitMonitor();redraw();},50);}
function fsExit(){const box=$('#screenbox');fsOn=false;fsFake=false;box.classList.remove('fs','fakefs');$('#fsHint').hidden=true;
  if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});$('#fsBtn').setAttribute('aria-pressed','false');setTimeout(()=>{fitMonitor();redraw();},50);}
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&fsOn&&!fsFake)fsExit();else{fitMonitor();redraw();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&fsOn)fsExit();});
$('#fsBtn').addEventListener('click',fsToggle);
$('#screenbox').addEventListener('dblclick',e=>{if(fsOn)fsExit();});
function fitMonitor(){const box=$('#screenbox'),cs=getComputedStyle(box);const bw=box.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),bh=box.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
  let w=bw,h=w*9/16;if((window.innerWidth>1000||fsOn)&&h>bh){h=Math.max(60,bh);w=h*16/9;}
  const sc=$('#screen');sc.style.width=Math.floor(w)+'px';sc.style.height=Math.floor(h)+'px';fitCanvas(cv);}
const K=()=>cv.width/854;
const toDev=(x,y)=>[(x+107)*K(),y*K()];
function toSB(e){const r=cv.getBoundingClientRect(),d=cv.width/r.width;return[(e.clientX-r.left)*d/K()-107,(e.clientY-r.top)*d/K()];}
function drawScreen(t){
  const k=K();
  const hid=hiddenTids(),pass=state.pvPass!==false;
  const vis=s=>!hid.has(s.tid)&&!(s.layer==='Fail'&&pass)&&!(s.layer==='Pass'&&!pass);
  if(glvDraw(t,gen.sprites,vis,(x,tt)=>drawNotes(tt,x))){cx.setTransform(k,0,0,k,107*k,0);drawScreenTop(t,k);return;}
  cx.setTransform(1,0,0,1,0,0);cx.globalAlpha=1;cx.globalCompositeOperation='source-over';
  cx.fillStyle='#000';cx.fillRect(0,0,cv.width,cv.height);
  if(bgImg){const s=Math.max(cv.width/bgImg.width,cv.height/bgImg.height);const w=bgImg.width*s,h=bgImg.height*s;cx.globalAlpha=clamp(state.pvBg,0,100)/100;cx.drawImage(bgImg,(cv.width-w)/2,(cv.height-h)/2,w,h);cx.globalAlpha=1;}
  cx.setTransform(k,0,0,k,107*k,0);
  const lt=liveTf;
  const drawSpr=s=>{if(s.imp&&!s.glyph)return;const e=evalSprite(s,t);if(!e)return;
    cx.save();cx.globalAlpha=e.al;cx.globalCompositeOperation=e.add?'lighter':'source-over';
    let px2=e.pos[0],py2=e.pos[1];if(lt&&s.lineKey===lt.key){px2+=lt.dx;py2+=lt.dy;}
    cx.translate(px2,py2);if(e.r)cx.rotate(e.r);cx.scale(e.sc*e.vec[0]*(e.fh?-1:1),e.sc*e.vec[1]*(e.fv?-1:1));
    let G=s.glyph;if(s.anim&&G&&G.frames){let i=Math.floor((t-s.tStart)/s.anim.delay);i=s.anim.loop==='LoopOnce'?Math.min(i,s.anim.count-1):((i%s.anim.count)+s.anim.count)%s.anim.count;G=G.frames[i]||G;}
    if(G){const o=ORIGINS[s.origin||'Centre'];cx.drawImage(tinted(G,e.col),-G.w*o[0],-G.h*o[1],G.w,G.h);}
    else{cx.fillStyle=`rgb(${e.col.join(',')})`;cx.fillRect(-0.5,-0.5,1,1);}
    cx.restore();};
  /* osu! draws gameplay above Background/Foreground and below Overlay; Fail/Pass follow the preview state; other difficulties' tracks are hidden */
  for(const s of gen.sprites)if(s.layer!=='Overlay'&&vis(s))drawSpr(s);
  if(state.showNotes){/* notes go to their own layer first so the opacity slider fades them as one picture */
    const nc=drawScreen.nc||(drawScreen.nc=document.createElement('canvas'));if(nc.width!==cv.width||nc.height!==cv.height){nc.width=cv.width;nc.height=cv.height;}
    const x=nc.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,nc.width,nc.height);x.setTransform(k,0,0,k,107*k,0);
    if(drawNotes(t,x)){cx.save();cx.setTransform(1,0,0,1,0,0);cx.globalAlpha=clamp(state.noteAlpha??60,0,100)/100;cx.globalCompositeOperation='source-over';cx.drawImage(nc,0,0);cx.restore();}}
  for(const s of gen.sprites)if(s.layer==='Overlay'&&vis(s))drawSpr(s);
  drawScreenTop(t,k);
}
function drawScreenTop(t,k){
  if(fsOn)return;
  if(state.guide){cx.globalAlpha=1;cx.globalCompositeOperation='source-over';cx.strokeStyle='rgba(255,255,255,.28)';cx.lineWidth=1/k;cx.setLineDash([4/k,4/k]);cx.strokeRect(0,0,640,480);cx.setLineDash([]);}
  drawSelection(t);
  if(NO_SAMPLE&&mapIsSample&&!gen.sprites.length){cx.globalAlpha=1;cx.globalCompositeOperation='source-over';cx.textAlign='center';cx.textBaseline='middle';
    cx.fillStyle='rgba(255,255,255,.55)';cx.font=`600 18px "IBM Plex Sans","Noto Sans SC",sans-serif`;cx.fillText(tl('文件 → 打开谱面文件夹'),320,226);
    cx.fillStyle='rgba(255,255,255,.32)';cx.font=`13px "IBM Plex Sans","Noto Sans SC",sans-serif`;cx.fillText(tl('或者把 .osu、歌词（.lrc / .srt / .ass）、音频直接拖进窗口'),320,254);cx.textAlign='left';}
}
let liveTf=null;
/* tracks not drawn in the preview: other difficulties, hidden (eye off), or not the solo track (preview only — export is unaffected) */
function hiddenTids(){const v=curVer(),solo=state.solo&&state.tracks.some(t=>t.id===state.solo)?state.solo:null;
  return new Set(state.tracks.filter(t=>(t.diff&&t.diff!==v)||t.hidden||(solo&&t.id!==solo)).map(t=>t.id));}
