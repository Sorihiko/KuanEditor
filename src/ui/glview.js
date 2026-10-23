/* ---------- WebGL preview renderer ----------
   Draws the background, every sprite and the note layer in one GPU pass (batched quads, tint + alpha in the shader,
   additive = blendFunc ONE,ONE), then the 2D monitor canvas copies it and draws guides / selection on top.
   Falls back to the Canvas 2D path when WebGL is unavailable or localStorage 'kuan-gl' = '0'. */
const GLV={ok:false,gl:null,cv:null,prog:null,buf:null,data:null,n:0,tex:null,blend:-1,texMap:new WeakMap(),texCount:0,white:null,notesCv:null,notesTex:null,bgTex:null,bgSrc:null,lost:false};
const GLV_MAX=4096,GLV_STRIDE=8;   // quads per batch, floats per vertex (x,y,u,v,r,g,b,a)
function glvInit(){
  try{if(localStorage.getItem('kuan-gl')==='0')return false;}catch(e){}
  try{
    const c=document.createElement('canvas');const gl=c.getContext('webgl',{alpha:false,antialias:false,premultipliedAlpha:true,preserveDrawingBuffer:false,depth:false,stencil:false});
    if(!gl)return false;
    const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    const pr=gl.createProgram();
    gl.attachShader(pr,sh(gl.VERTEX_SHADER,'attribute vec2 p;attribute vec2 uv;attribute vec4 col;varying vec2 v;varying vec4 c;void main(){v=uv;c=col;gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,'precision mediump float;uniform sampler2D t;varying vec2 v;varying vec4 c;void main(){gl_FragColor=texture2D(t,v)*c;}'));
    gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,GLV_MAX*6*GLV_STRIDE*4,gl.DYNAMIC_DRAW);
    const at=(name,size,off)=>{const l=gl.getAttribLocation(pr,name);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,GLV_STRIDE*4,off*4);};
    at('p',2,0);at('uv',2,2);at('col',4,4);
    gl.uniform1i(gl.getUniformLocation(pr,'t'),0);gl.enable(gl.BLEND);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    Object.assign(GLV,{ok:true,gl,cv:c,prog:pr,buf,data:new Float32Array(GLV_MAX*6*GLV_STRIDE)});
    GLV.white=glvMakeTex(null);
    c.addEventListener('webglcontextlost',e=>{e.preventDefault();GLV.ok=false;GLV.lost=true;});
    window.__kuanGL='webgl';return true;
  }catch(e){console.warn('WebGL preview off:',e);GLV.ok=false;return false;}
}
function glvMakeTex(src){
  if(GLV.n)glvFlush();const gl=GLV.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  if(src)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
  else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
  GLV.tex=null;return t;}
function glvTexOf(src){
  let t=GLV.texMap.get(src);if(t)return t;
  if(GLV.texCount>3000){GLV.texMap=new WeakMap();GLV.texCount=0;}   // let old textures be collected
  let up=src;const mx=GLV.maxTex||(GLV.maxTex=GLV.gl.getParameter(GLV.gl.MAX_TEXTURE_SIZE)||4096),sw=src.naturalWidth||src.width,sh=src.naturalHeight||src.height;
  if(sw>mx||sh>mx){const f=mx/Math.max(sw,sh),c=document.createElement('canvas');c.width=Math.max(1,Math.floor(sw*f));c.height=Math.max(1,Math.floor(sh*f));c.getContext('2d').drawImage(src,0,0,c.width,c.height);up=c;}
  try{t=glvMakeTex(up);}catch(e){return GLV.white;}
  GLV.texMap.set(src,t);GLV.texCount++;return t;}
function glvFlush(){
  if(!GLV.n)return;const gl=GLV.gl;
  gl.bufferSubData(gl.ARRAY_BUFFER,0,GLV.data.subarray(0,GLV.n*6*GLV_STRIDE));
  gl.drawArrays(gl.TRIANGLES,0,GLV.n*6);GLV.n=0;}
function glvState(tex,add){
  const gl=GLV.gl,b=add?1:0;
  if(tex!==GLV.tex||b!==GLV.blend){glvFlush();
    if(tex!==GLV.tex){gl.bindTexture(gl.TEXTURE_2D,tex);GLV.tex=tex;}
    if(b!==GLV.blend){if(add)gl.blendFunc(gl.ONE,gl.ONE);else gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);GLV.blend=b;}}
  if(GLV.n>=GLV_MAX)glvFlush();}
/* quad from 4 device-pixel corners (tl,tr,br,bl), premultiplied colour */
function glvQuad(P,r,g,b,a){
  const W=GLV.cv.width,H=GLV.cv.height,d=GLV.data;let o=GLV.n*6*GLV_STRIDE;
  const V=(i,u,v)=>{d[o++]=P[i][0]/W*2-1;d[o++]=1-P[i][1]/H*2;d[o++]=u;d[o++]=v;d[o++]=r;d[o++]=g;d[o++]=b;d[o++]=a;};
  V(0,0,0);V(1,1,0);V(2,1,1);V(0,0,0);V(2,1,1);V(3,0,1);GLV.n++;}
function glvSprite(s,e,G,k,lt){
  const o=ORIGINS[s.origin||'Centre'],w=G?G.w:1,h=G?G.h:1;
  let px=e.pos[0],py=e.pos[1];if(lt&&s.lineKey===lt.key){px+=lt.dx;py+=lt.dy;}
  const sx=e.sc*e.vec[0]*(e.fh?-1:1),sy=e.sc*e.vec[1]*(e.fv?-1:1),c=e.r?Math.cos(e.r):1,sn=e.r?Math.sin(e.r):0;
  const x0=G?-w*o[0]:-0.5,y0=G?-h*o[1]:-0.5,x1=x0+w,y1=y0+h;
  const T=(x,y)=>{x*=sx;y*=sy;return[(px+x*c-y*sn+107)*k,(py+x*sn+y*c)*k];};
  glvState(G?glvTexOf(G.canvas):GLV.white,e.add);
  const a=e.al;glvQuad([T(x0,y0),T(x1,y0),T(x1,y1),T(x0,y1)],e.col[0]/255*a,e.col[1]/255*a,e.col[2]/255*a,a);}
/* returns true when the frame was drawn with WebGL */
function glvDraw(t,list,vis,drawNotesTo){
  if(!GLV.ok)return false;const gl=GLV.gl;
  if(gl.isContextLost()){GLV.ok=false;GLV.cv.hidden=true;return false;}
  if(GLV.cv.width!==cv.width||GLV.cv.height!==cv.height){GLV.cv.width=cv.width;GLV.cv.height=cv.height;}
  const W=cv.width,H=cv.height,k=K();
  gl.viewport(0,0,W,H);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);GLV.n=0;GLV.tex=null;GLV.blend=-1;
  if(bgImg&&bgImg.width>0){
    if(GLV.bgSrc!==bgImg){GLV.bgTex=glvMakeTex(bgImg);GLV.bgSrc=bgImg;}
    const s=Math.max(W/bgImg.width,H/bgImg.height),w=bgImg.width*s,h=bgImg.height*s,x=(W-w)/2,y=(H-h)/2,a=clamp(state.pvBg,0,100)/100;
    if(a>0){glvState(GLV.bgTex,false);glvQuad([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],a,a,a,a);}}
  const lt=liveTf;
  const one=s=>{if(s.imp&&!s.glyph)return;const e=evalSprite(s,t);if(!e)return;
    let G=s.glyph;if(s.anim&&G&&G.frames){let i=Math.floor((t-s.tStart)/s.anim.delay);i=s.anim.loop==='LoopOnce'?Math.min(i,s.anim.count-1):((i%s.anim.count)+s.anim.count)%s.anim.count;G=G.frames[i]||G;}
    glvSprite(s,e,G,k,lt);};
  for(const s of list)if(s.layer!=='Overlay'&&vis(s))one(s);
  if(state.showNotes){
    if(!GLV.notesCv)GLV.notesCv=document.createElement('canvas');const nc=GLV.notesCv;if(nc.width!==W||nc.height!==H){nc.width=W;nc.height=H;}
    const x=nc.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,W,H);x.setTransform(k,0,0,k,107*k,0);
    if(drawNotesTo(x,t)){glvFlush();
      if(!GLV.notesTex)GLV.notesTex=glvMakeTex(nc);else{gl.bindTexture(gl.TEXTURE_2D,GLV.notesTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,nc);}
      GLV.tex=null;glvState(GLV.notesTex,false);const na=clamp(state.noteAlpha??60,0,100)/100;glvQuad([[0,0],[W,0],[W,H],[0,H]],na,na,na,na);}}
  for(const s of list)if(s.layer==='Overlay'&&vis(s))one(s);
  glvFlush();
  cx.setTransform(1,0,0,1,0,0);cx.globalAlpha=1;cx.globalCompositeOperation='source-over';cx.clearRect(0,0,W,H);
  return true;}
/* the GL canvas sits under the 2D monitor canvas, which then only carries guides and selection handles */
function glvAttach(){if(!GLV.ok)return;GLV.cv.className='glcv';GLV.cv.setAttribute('aria-hidden','true');cv.parentNode.insertBefore(GLV.cv,cv);
  GLV.cv.addEventListener('webglcontextlost',()=>{GLV.cv.hidden=true;});}
