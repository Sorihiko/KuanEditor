/* 直接读写谱面文件夹 */
/* ---------- mapset folder (File System Access API; local Chrome / Edge) ---------- */
const fsOK=()=>typeof window.showDirectoryPicker==='function';
let dirH=null,pendingDir=null,folder={imgs:[],lrc:[]},watchT={},selfWrite=new Map(),written=new Map(),pollT=null,autoT=null,polling=false,saving=false,saveAgain=false;
async function fileAt(path,create){const parts=path.split('/').filter(Boolean);let d=dirH;for(let i=0;i<parts.length-1;i++)d=await d.getDirectoryHandle(parts[i],{create});return d.getFileHandle(parts[parts.length-1],{create});}
async function readPath(path){return(await fileAt(path,false)).getFile();}
async function writePath(path,data){const fh=await fileAt(path,true);const w=await fh.createWritable();await w.write(data);await w.close();try{selfWrite.set(path,(await fh.getFile()).lastModified);}catch(e){}}
async function scanDir(d,prefix,depth,out){for await(const[name,h]of d.entries()){if(out.length>1500)return;const p=prefix+name;
  if(h.kind==='directory'){if(depth<3)await scanDir(h,p+'/',depth+1,out);}else out.push({path:p,h});}}
async function openFolder(){
  if(!fsOK()){toast('这个浏览器不能打开文件夹。请在电脑上用 Chrome 或 Edge 直接打开 Kuan.html。','err');return;}
  try{const h=await window.showDirectoryPicker({id:'kuan-mapset',mode:'readwrite'});await connectFolder(h,true);}
  catch(e){if(e&&e.name==='AbortError')return;toast(e&&e.name==='SecurityError'?'这里（claude.ai 里）不能访问电脑上的文件夹。请在电脑上用 Chrome / Edge 打开本地的 Kuan.html。':'打开文件夹失败：'+((e&&e.message)||e),'err');}
}
async function connectFolder(h,gesture){
  let perm='denied';try{perm=await h.queryPermission({mode:'readwrite'});if(perm!=='granted'&&gesture)perm=await h.requestPermission({mode:'readwrite'});}catch(e){}
  if(perm!=='granted'){pendingDir=h;renderFolder();if(gesture)toast('没有得到这个文件夹的读写权限','err');return false;}
  dirH=h;pendingDir=null;written=new Map();watchT={};selfWrite=new Map();idbPut('__dir',h);
  const all=[];try{await scanDir(h,'',0,all);}catch(e){toast('读取文件夹失败：'+e.message,'err');}
  const osus=all.filter(f=>/\.osu$/i.test(f.path)&&!f.path.includes('/'));
  folder.imgs=all.filter(f=>/\.(png|jpe?g|webp|gif)$/i.test(f.path)&&!/^sb\/(l|fx)\//.test(f.path));
  folder.lrc=all.filter(f=>/\.(lrc|srt|ass|ssa|sbv)$/i.test(f.path));
  folder.kuan=all.filter(f=>/\.kuan$/i.test(f.path)&&!f.path.includes('/'));
  const list=[];for(const f of osus){try{const file=await f.h.getFile();list.push({file:f.path,text:await file.text(),mtime:file.lastModified});}catch(e){}}
  if(list.length){const ok=list.filter(x=>{try{parseOsu(x.text);return true;}catch(e){return false;}});if(ok.length){setMaps(ok,state.diffVer);saveMaps();}}
  await loadFolderAssets();
  /* an existing storyboard not made by Kuan would be overwritten on save → bring it in first */
  for(const f of all.filter(f=>/\.osb$/i.test(f.path)&&!f.path.includes('/'))){
    if(state.tracks.some(t=>t.imp&&t.src===f.path))continue;
    try{const text=await(await f.h.getFile()).text();if(/\/\/Made with Kuan/.test(text))continue;await importOsbText(f.path,text,f.path);toast(`文件夹里原有的 ${f.path} 已导入，保存时会一起保留，不会被覆盖`,'good');}catch(e){}}
  for(const[k,v]of[...impTexCache])if(v==='missing')impTexCache.delete(k);
  renderFolder();renderFiles();clearInterval(pollT);pollT=setInterval(poll,1500);
  toast(list.length?`已打开谱面文件夹「${h.name}」：${list.length} 个难度`:`已打开「${h.name}」，但里面没有 .osu 文件`,list.length?'good':'err');
  return true;
}
async function loadFolderAssets(){
  if(mapIsSample)return;
  const want=map.general.AudioFilename;
  if(want&&audioName!==want){try{const f=await readPath(want);if(audio.src)URL.revokeObjectURL(audio.src);setPlaying(false);audio.src=URL.createObjectURL(f);audioName=want;idbPut('__audio',f);decodePcm(f);
    audio.addEventListener('loadedmetadata',()=>{seek(clockPos);schedule();},{once:true});}catch(e){}}
  if(map.bg&&bgName!==map.bg){try{const f=await readPath(map.bg);const img=new Image();img.onload=()=>{bgImg=img;};img.src=URL.createObjectURL(f);bgName=map.bg;}catch(e){}}
}
function closeFolder(){dirH=null;pendingDir=null;clearInterval(pollT);idbPut('__dir',null);folder={imgs:[],lrc:[]};renderFolder();toast('已断开谱面文件夹（已载入的内容保留）');}
async function poll(){
  if(!dirH||polling)return;polling=true;let imgChanged=false;
  try{
    const m=maps[mapIdx];
    if(m&&!mapIsSample){const f=await readPath(m.file);if(m.mtime==null)m.mtime=f.lastModified;
      else if(f.lastModified!==m.mtime){m.mtime=f.lastModified;if(f.lastModified!==selfWrite.get(m.file)){m.text=await f.text();saveMaps();selectDiff(mapIdx,true);toast(`[${m.ver}] 的 .osu 有改动，已重新载入`,'good');}}}
    if(state.lrcSrc){const f=await readPath(state.lrcSrc);if(watchT.lrc==null)watchT.lrc=f.lastModified;
      else if(watchT.lrc!==f.lastModified){watchT.lrc=f.lastModified;state.lrc=SUB_RE.test(state.lrcSrc)?subToLrc(state.lrcSrc,await f.text()):await f.text();syncUI();renderFiles();schedule();toast('歌词文件有改动，已重新载入','good');}}
    for(const md of state.media){if(!md.src||md.kind==='anim')continue;let f;try{f=await readPath(md.src);}catch(e){continue;}
      const k='m:'+md.id;if(watchT[k]==null){watchT[k]=f.lastModified;continue;}
      if(watchT[k]!==f.lastModified){watchT[k]=f.lastModified;if(f.lastModified===selfWrite.get(md.src))continue;
        try{const{img,url}=await decodeImg(f);md.w=img.naturalWidth;md.h=img.naturalHeight;await idbPut(md.id,f);
          mediaCache.set(md.id,{img,url,blob:f,w:md.w,h:md.h,g:{key:'m:'+md.id+':'+f.lastModified,canvas:img,w:md.w,h:md.h,tints:new Map(),media:md.id}});imgChanged=true;}catch(e){}}}
    if(imgChanged){renderBin();schedule();toast('文件夹里的图片有改动，已刷新','good');}
  }catch(e){if(e&&e.name==='NotAllowedError'){clearInterval(pollT);pendingDir=dirH;dirH=null;renderFolder();toast('文件夹权限失效了，点“重新连接”','err');}}
  finally{polling=false;}
}
const pxBlob=()=>{const c=document.createElement('canvas');c.width=c.height=1;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,1,1);return toBlob(c);};
async function saveToFolder(quiet){
  if(!dirH){toast('还没打开谱面文件夹','err');return;}
  if(saving){saveAgain=true;return;}saving=true;
  try{
    const{text,names,usedMedia,diffs}=buildOsb();let n=0,nd=0;const miss=[];
    if(mapIsSample){toast(NO_SAMPLE?'还没有载入谱面，先在文件夹里选一个难度':'现在是示例谱面，先在文件夹里选一个难度','err');return;}
    await writePath(osbName(),text);
    if(!written.has('sb/px.png')){await writePath('sb/px.png',await pxBlob());written.set('sb/px.png','px');}
    const wk=g=>g.key+(state.optimize!==false?'|o':'');
    for(const{path,g}of names.values()){if(written.get(path)===wk(g))continue;await writePath(path,await glyphBlob(g));written.set(path,wk(g));n++;}
    for(const m of usedMedia.values()){if(m.src&&m.file===m.src)continue;const c=mediaCache.get(m.id);if(!c||written.get(m.file)===m.id)continue;
      if(c.frameBlobs){const dot=m.file.lastIndexOf('.'),base=m.file.slice(0,dot),ext=m.file.slice(dot);for(let i=0;i<c.frameBlobs.length;i++)await writePath(base+i+ext,c.frameBlobs[i]);}
      else if(c.blob)await writePath(m.file,c.blob);written.set(m.file,m.id);n++;}
    for(const v in diffs)if(!maps.some(x=>x.ver===v))miss.push(v);
    /* 每个难度：写入难度专属轨道，并打开宽屏故事板 */
    for(const e of maps){if(!e.file)continue;
      let cur;try{cur=await(await readPath(e.file)).text();}catch(err){if(e.ver in diffs)miss.push(e.ver);continue;}let out=e.ver in diffs?patchOsu(cur,diffs[e.ver]):cur;out=widescreenOsu(out);
      if(out!==cur){await writePath(e.file,out);e.text=out;e.mtime=selfWrite.get(e.file);nd++;}}
    saveMaps();
    if(!quiet){try{await writePath(projName(),await projectBlob());}catch(e){}}
    $('#saveState').textContent=`已保存 ${new Date().toLocaleTimeString()}`;
    if(!quiet||miss.length)toast(`已保存到「${dirH.name}」：${osbName()}${n?`，写入 ${n} 个图片文件`:''}${nd?`，更新 ${nd} 个难度的 .osu`:''}`+(miss.length?`；找不到难度 [${miss.join('] [')}]`:''),miss.length?'err':'good');
  }catch(e){toast('保存失败：'+((e&&e.message)||e),'err');}
  finally{saving=false;if(saveAgain){saveAgain=false;saveToFolder(true);}}
}
async function importFolderImage(entry){
  const ex=state.media.find(m=>m.src===entry.path);if(ex){toast(`${entry.path} 已经在素材里了`);return;}
  try{const f=await entry.h.getFile();const{img,url}=await decodeImg(f);const id=uid();
    const m={id,name:entry.path.split('/').pop(),w:img.naturalWidth,h:img.naturalHeight,file:entry.path,src:entry.path};
    await idbPut(id,f);mediaCache.set(id,{img,url,blob:f,w:m.w,h:m.h,g:{key:'m:'+id,canvas:img,w:m.w,h:m.h,tints:new Map(),media:id}});
    state.media.push(m);watchT['m:'+id]=f.lastModified;commit();toast(`已导入 ${entry.path}（直接用文件夹里的这个文件，改了会自动刷新）`,'good');}
  catch(e){toast(`${entry.path}：${e.message}`,'err');}
}
async function loadFolderLrc(entry){try{const f=await entry.h.getFile();state.lrc=SUB_RE.test(entry.path)?subToLrc(entry.path,await f.text()):await f.text();state.lrcSrc=entry.path;lrcName=entry.path;watchT.lrc=f.lastModified;syncUI();renderFiles();schedule();toast(`已载入 ${entry.path}，文件改了会自动重新载入`,'good');}catch(e){toast(e.message,'err');}}
function renderFolder(){
  const on=!!dirH;$('#folderActs').hidden=!on;$('#autoSaveRow').hidden=!on;$('#saveTop').hidden=!on;
  $('#openFolder').textContent=on?'换一个文件夹…':'打开谱面文件夹…';
  const rc=$('#reconnect');rc.hidden=!pendingDir;if(pendingDir){rc.textContent=`重新连接「${pendingDir.name}」`;rc.title=`重新连接谱面文件夹「${pendingDir.name}」`;}
  const chip=$('#foldChip');chip.hidden=!on;if(on)chip.textContent='📁 '+dirH.name;
  $('#folderInfo').textContent=on?`已连接「${dirH.name}」· ${maps.length} 个难度 · ${folder.imgs.length} 张图片。保存会写入 .osb、字图和难度专属的 .osu；谱面、歌词、图片在外面改了会自动刷新。`
    :fsOK()?'打开 osu! Songs 里的谱面文件夹后，会自动读入所有难度、音频和背景，保存时直接写进这个文件夹。':'在电脑上用 Chrome / Edge 打开本地的 Kuan.html 才能直接读写谱面文件夹（claude.ai 里不行）。可以继续用下面的手动载入和导出 zip。';
  const fl=$('#flist');fl.innerHTML='';$('#folderImgs').hidden=!on||!folder.imgs.length;
  for(const e of folder.imgs.slice(0,300)){const b=document.createElement('button');b.type='button';b.className='fitem';const used=state.media.some(m=>m.src===e.path);
    b.textContent=(used?'✓ ':'＋ ')+e.path;b.title=used?'已在素材里':'导入到素材（直接引用这个文件）';b.disabled=used;b.addEventListener('click',()=>importFolderImage(e).then(renderFolder));fl.appendChild(b);}
  const kp=$('#folderProj');kp.innerHTML='';kp.hidden=!on||!(folder.kuan&&folder.kuan.length);
  for(const e of folder.kuan||[]){const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent='打开项目 '+e.path;b.addEventListener('click',async()=>{const f=await e.h.getFile();await openProject(await f.text(),e.path);});kp.appendChild(b);}
  const lr=$('#folderLrc');lr.innerHTML='';lr.hidden=!on||!folder.lrc.length;
  for(const e of folder.lrc){const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent=(state.lrcSrc===e.path?'✓ ':'载入 ')+e.path;b.addEventListener('click',()=>loadFolderLrc(e).then(renderFolder));lr.appendChild(b);}
}
$('#openFolder').addEventListener('click',openFolder);
$('#reconnect').addEventListener('click',()=>{if(pendingDir)connectFolder(pendingDir,true);});
$('#closeFolder').addEventListener('click',closeFolder);
$('#saveFolder').addEventListener('click',()=>saveToFolder(false));
$('#saveTop').addEventListener('click',()=>saveToFolder(false));
renderFolder();
impTexLoad=async path=>{
  if(!dirH){impTexCache.delete(path);return;}
  try{const f=await readPath(path);const{img}=await decodeImg(f);impTexCache.set(path,{key:'imp:'+path,canvas:img,w:img.naturalWidth,h:img.naturalHeight,tints:new Map()});schedule();}
  catch(e){impTexCache.set(path,'missing');}
};
$('#bgTl').addEventListener('click',bgToTimeline);
$('#saveProj').addEventListener('click',saveProjectFile);
$('#openProj').addEventListener('click',()=>$('#projIn').click());
$('#projIn').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(f)await openProject(await f.text(),f.name);});
$('#importOsb').addEventListener('click',()=>$('#osbIn').click());
$('#osbIn').addEventListener('change',async e=>{for(const f of e.target.files)await importOsbText(f.name,await f.text());e.target.value='';});

