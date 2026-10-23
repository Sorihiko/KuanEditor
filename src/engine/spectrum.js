/* 音频频谱 */
/* ---------- audio spectrum ---------- */
let pcm=null;   /* {sr, data: mono Float32Array, id} – decoded song audio */
function newSpecClip(tid,start,end){return{id:uid(),kind:'spec',tid,start:Math.round(start),end:Math.round(end),spec:ownColors(SPEC_DEF(),[['custom','accent']])};}
function fftMag(re){const n=re.length,im=new Float32Array(n);
  for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){const t=re[i];re[i]=re[j];re[j]=t;}}
  for(let len=2;len<=n;len<<=1){const a=-2*Math.PI/len,wr=Math.cos(a),wi=Math.sin(a);
    for(let i=0;i<n;i+=len){let cr=1,ci=0;for(let k=0;k<len/2;k++){const p=i+k,q=p+len/2,tr=re[q]*cr-im[q]*ci,ti=re[q]*ci+im[q]*cr;re[q]=re[p]-tr;im[q]=im[p]-ti;re[p]+=tr;im[p]+=ti;const nr=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=nr;}}}
  const out=new Float32Array(n/2);for(let i=0;i<n/2;i++)out[i]=Math.hypot(re[i],im[i]);return out;}
const specCache=new Map();
/* bar heights (0..1) for every analysis step of a clip */
function specFrames(c){
  const p=c.spec;if(!pcm)return null;
  const key=JSON.stringify([pcm.id,c.start,c.end,p.n,p.fmin,p.fmax,p.div,p.smooth]);let F=specCache.get(key);if(F)return F;
  const N=2048,sr=pcm.sr,D=pcm.data,win=new Float32Array(N);for(let i=0;i<N;i++)win[i]=0.5-0.5*Math.cos(2*Math.PI*i/(N-1));
  const n=clamp(Math.round(p.n),4,128),lo=clamp(+p.fmin||40,10,sr/2-10),hi=clamp(+p.fmax||12000,lo+10,sr/2);
  const edges=[];for(let j=0;j<=n;j++)edges.push(Math.min(N/2-1,Math.max(1,Math.round(lo*Math.pow(hi/lo,j/n)/sr*N))));
  const times=[];for(let t=c.start;t<c.end;){times.push(t);t+=Math.max(10,beatAt(t)/clamp(+p.div||8,1,32));}times.push(c.end);
  const raw=times.map(t=>{const st=Math.round(t/1000*sr)-N/2,buf=new Float32Array(N);for(let i=0;i<N;i++){const k=st+i;buf[i]=k>=0&&k<D.length?D[k]*win[i]:0;}
    const m=fftMag(buf),row=new Float32Array(n);
    for(let j=0;j<n;j++){let a=edges[j],b=Math.max(a+1,edges[j+1]),mx=0;for(let k=a;k<b;k++)mx=Math.max(mx,m[k]);row[j]=20*Math.log10(mx*Math.sqrt((a+b)/2/edges[0])+1e-9);}
    return row;});
  let top=-Infinity;for(const r of raw)for(const v of r)top=Math.max(top,v);
  const sm=clamp(+p.smooth||0,0,0.95),prev=new Float32Array(n);
  const vals=raw.map(r=>{const o=new Float32Array(n);for(let j=0;j<n;j++){const v=clamp((r[j]-(top-50))/50,0,1);o[j]=prev[j]=sm*prev[j]+(1-sm)*v;}return o;});
  F={times,vals,n};specCache.set(key,F);if(specCache.size>12)specCache.delete(specCache.keys().next().value);return F;
}
/* Ramer–Douglas–Peucker on a 1-D series: indices of the points worth keeping */
function simplify1d(ts,vs,eps){
  const n=ts.length;if(n<3||!(eps>0))return ts.map((_,i)=>i);
  const keep=new Uint8Array(n);keep[0]=keep[n-1]=1;const st=[[0,n-1]];
  while(st.length){const[a,b]=st.pop();let worst=-1,wd=eps;
    for(let i=a+1;i<b;i++){const f=(ts[i]-ts[a])/((ts[b]-ts[a])||1),d=Math.abs(vs[i]-(vs[a]+(vs[b]-vs[a])*f));if(d>wd){wd=d;worst=i;}}
    if(worst>=0){keep[worst]=1;st.push([a,worst],[worst,b]);}}
  const out=[];for(let i=0;i<n;i++)if(keep[i])out.push(i);return out;
}
function genSpec(c,tr,pal){
  const p=c.spec,F=specFrames(c);if(!F)return;
  const n=F.n,col=p.color==='custom'?p.custom:pal.accent,circ=p.shape==='circle';
  const gap=circ?(2*Math.PI*p.radius)/n:p.width/n,bw=p.barW>0?p.barW:Math.max(1,gap*0.7),minH=Math.max(0,+p.minH||0),rng=Math.max(1,(+p.maxH||100)-minH);
  const tol=rng*clamp(+p.tol||0,0,20)/100,a=clamp(p.alpha,0,100)/100;
  for(let j=0;j<n;j++){
    let x,y,rot=0;
    if(circ){const ang=j/n*2*Math.PI-Math.PI/2;x=p.x+Math.cos(ang)*p.radius;y=p.y+Math.sin(ang)*p.radius;rot=ang+Math.PI/2;}
    else{x=p.x-p.width/2+(j+0.5)*gap;y=p.y;}
    const T=p.tex||'solid',blob=T==='blob',g=T==='soft'?fxTex('softbar'):blob?fxTex('glow'):T==='custom'?(mediaReady(p.texImg)||{}).g||null:null;
    const s=spr(g,x,y);s.style='spec';s.specId=c.id;s.layer=tr.layer;s.tid=tr.id;s.origin=blob||(p.mirror&&!circ)?'Centre':'BottomCentre';
    /* V values: a 1px pixel scales straight to px; a texture is divided by its size (soft edges get a little extra room) */
    const gw=g?g.w:1,gh=g?g.h:1,kx=T==='soft'?1.8:1,ky=T==='soft'?1.15:1,vv=(w,h)=>blob?[Math.round(h/gw*2.2*1000)/1000,Math.round(h/gh*2.2*1000)/1000]:[Math.round(w*kx/gw*1000)/1000,Math.round(h*ky/gh*1000)/1000];
    const H=k=>minH+F.vals[k][j]*rng;
    cmd(s,'F',0,c.start,c.end,a,a);colorAt(s,col,c.start);if(rot)cmd(s,'R',0,c.start,c.start,rot);if(p.add)cmd(s,'P',0,c.start,c.end,'A');
    const hs=F.times.map((_,k)=>Math.round(H(k)*10)/10),keep=simplify1d(F.times,hs,tol);
    cmd(s,'V',0,F.times[0],F.times[0],vv(bw,hs[0]),vv(bw,hs[0]));
    for(let q=1;q<keep.length;q++){const i=keep[q-1],k=keep[q];if(hs[i]===hs[k]&&q<keep.length-1)continue;cmd(s,'V',0,F.times[i],F.times[k],vv(bw,hs[i]),vv(bw,hs[k]));}
  }
}

