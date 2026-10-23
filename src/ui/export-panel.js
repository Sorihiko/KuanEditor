/* 导出 zip / 复制 .osb */
/* ---------- export ---------- */
const toBlob=c=>new Promise(r=>c.toBlob(r,'image/png'));
/* trim the transparent margin around a glyph, symmetric about its centre so Centre-origin sprites stay put */
function cropCenter(src){const w=src.width,h=src.height,x=document.createElement('canvas').getContext('2d',{willReadFrequently:true});x.canvas.width=w;x.canvas.height=h;x.drawImage(src,0,0);
  const d=x.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(d[(j*w+i)*4+3]>2){if(i<x0)x0=i;if(i>x1)x1=i;if(j<y0)y0=j;if(j>y1)y1=j;}
  if(x1<0)return src;const cx=w/2,cy=h/2,hx=Math.min(Math.ceil(Math.max(cx-x0,x1+1-cx))+1,Math.ceil(cx)),hy=Math.min(Math.ceil(Math.max(cy-y0,y1+1-cy))+1,Math.ceil(cy));
  if(hx*2>=w-1&&hy*2>=h-1)return src;const o=document.createElement('canvas');o.width=hx*2;o.height=hy*2;o.getContext('2d').drawImage(src,cx-hx,cy-hy,hx*2,hy*2,0,0,hx*2,hy*2);return o;}
async function glyphBlob(g){const opt=state.optimize!==false,k=opt?'blobOpt':'blob';if(g[k])return g[k];g[k]=await toBlob(opt&&!g.fxName?cropCenter(g.canvas):g.canvas);return g[k];}
let downloads=null;
if(window.claude&&typeof window.claude.use==='function'){window.claude.use('downloads').then(d=>{downloads=d;}).catch(()=>{});}
$('#exportZip').addEventListener('click',async()=>{
  if(!window.JSZip){toast('压缩库没有加载成功，请先用“复制 .osb 文本”。','err');return;}

  const btn=$('#exportZip');btn.disabled=true;toast('正在打包…');
  try{
    const{text,names,usedMedia,diffs}=buildOsb();const zip=new JSZip();
    zip.file(osbName(),text);let nd=0;const miss=[];
    for(const v in diffs)if(!maps.some(x=>x.ver===v))miss.push(v);
    for(const e of maps){if(!e.file||!e.text)continue;const out=widescreenOsu(e.ver in diffs?patchOsu(e.text,diffs[e.ver]):e.text);if(out!==e.text){zip.file(e.file,out);nd++;}}
    const px=document.createElement('canvas');px.width=px.height=1;const pc=px.getContext('2d');pc.fillStyle='#fff';pc.fillRect(0,0,1,1);
    zip.file('sb/px.png',await toBlob(px));
    const t0=performance.now();const list=[...names.values()];
    await Promise.all(list.map(async({path,g})=>{zip.file(path,await glyphBlob(g));}));
    for(const m of usedMedia.values()){const c=mediaCache.get(m.id);if(!c)continue;
      if(c.frameBlobs){const dot=m.file.lastIndexOf('.'),base=m.file.slice(0,dot),ext=m.file.slice(dot);c.frameBlobs.forEach((b,i)=>zip.file(base+i+ext,b));}
      else if(c.blob)zip.file(m.file,c.blob);}
    const blob=await zip.generateAsync({type:'blob',compression:'STORE'});
    const secs=((performance.now()-t0)/1000).toFixed(1);
    toast(`打包完成（${secs} 秒，${(blob.size/1024).toFixed(0)} KB），请在确认框里保存…`);
    const fn=`${osbName().replace(/\.osb$/,'')} storyboard.zip`;
    if(downloads)await downloads.save({filename:fn,data:blob});
    else{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=fn;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);}
    toast(`已保存：${names.size} 张字图 + ${usedMedia.size} 个图片 / 动画素材 + .osb${nd?` + ${nd} 个难度的 .osu`:''}。解压到谱面文件夹即可。`+(miss.length?` 找不到难度 [${miss.join('] [')}] 的 .osu，它的专属轨道没导出。`:''),miss.length?'err':'good');
  }catch(e){const code=e&&e.code;toast(code==='declined'?'已取消保存。':code==='rate_limited'?'已有一个保存确认在等待，请先处理它。':'导出失败：'+((e&&e.message)||e),code==='declined'?'':'err');}
  finally{btn.disabled=false;}
});
$('#copyOsb').addEventListener('click',()=>{
  const{text}=buildOsb();const ta=$('#osbOut');ta.value=text;
  const fallback=()=>{ta.hidden=false;ta.focus();ta.select();toast('无法写入剪贴板，已在下方选中全文，可手动复制。');};
  try{navigator.clipboard.writeText(text).then(()=>{ta.hidden=true;toast('.osb 文本已复制。图片仍需从 zip 导出。','good');},fallback);}catch(e){fallback();}
});

