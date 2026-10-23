/* 项目文件 .kuan 的保存与打开 */
/* ---------- project file (.kuan): settings + every imported file in one JSON, so work isn't tied to one browser ---------- */
const toDataURL=b=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(b);});
const fromDataURL=async(u,name)=>{const b=await(await fetch(u)).blob();return name?new File([b],name,{type:b.type}):b;};
async function projectBlob(){
  const media=[];
  for(const m of state.media){const ids=m.kind==='anim'?Array.from({length:m.frames},(_,i)=>m.id+'#'+i):[m.id],data=[];
    for(const id of ids){const b=await idbGet(id);data.push(b?await toDataURL(b):null);}media.push({id:m.id,ids,data});}
  const imports=[];for(const t of state.tracks)if(t.imp){const text=await idbGet('imp:'+t.iid);if(text)imports.push({iid:t.iid,text});}
  const au=await idbGet('__audio');
  const obj={kuan:1,saved:new Date().toISOString(),state:JSON.parse(JSON.stringify(state)),media,imports,maps:maps.map(({file,text})=>({file,text})),mapIdx,
    audio:au&&au.size<40e6?{name:au.name||audioName||'audio',data:await toDataURL(au)}:null};
  return new Blob([JSON.stringify(obj)],{type:'application/json'});
}
const projName=()=>osbName().replace(/\.osb$/,'')+'.kuan';
async function saveProjectFile(){
  try{toast('正在打包项目…');const blob=await projectBlob(),fn=projName();
    if(dirH){await writePath(fn,blob);toast(`项目已保存到谱面文件夹：${fn}（${(blob.size/1024/1024).toFixed(1)} MB）`,'good');return;}
    if(downloads)await downloads.save({filename:fn,data:blob});
    else{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=fn;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);}
    toast(`已保存项目文件 ${fn}`,'good');}
  catch(e){toast(e&&e.code==='declined'?'已取消保存':'保存项目失败：'+((e&&e.message)||e),e&&e.code==='declined'?'':'err');}
}
async function openProject(text,name){
  let o;try{o=JSON.parse(text);}catch(e){toast(`${name} 不是有效的项目文件`,'err');return;}
  if(!o||o.kuan!==1||!o.state){toast(`${name} 不是 Kuan 项目文件`,'err');return;}
  toast('正在载入项目…');
  for(const m of o.media||[])for(let i=0;i<m.ids.length;i++)if(m.data[i]){const sm=(o.state.media||[]).find(x=>x.id===m.id);await idbPut(m.ids[i],await fromDataURL(m.data[i],sm&&sm.kind!=='anim'?sm.name:null));mediaCache.delete(m.id);}
  for(const im of o.imports||[]){await idbPut('imp:'+im.iid,im.text);try{impCache.set(im.iid,parseOsbText(im.text));}catch(e){}}
  Object.assign(state,o.state);sanitizeState();sel=null;
  if(o.maps&&o.maps.length){setMaps(o.maps,state.diffVer);saveMaps();}
  if(o.audio&&o.audio.data){const f=await fromDataURL(o.audio.data,o.audio.name);if(audio.src)URL.revokeObjectURL(audio.src);setPlaying(false);audio.src=URL.createObjectURL(f);audioName=o.audio.name;idbPut('__audio',f);decodePcm(f);}
  await Promise.all(state.media.map(loadMedia));
  syncUI();renderFiles();renderHeaders();renderBin();renderFx();regenerate();
  toast(`已打开项目 ${name}`,'good');
}
function saveMaps(){idbPut('__maps',maps.map(({file,text})=>({file,text})));}
function renderFiles(){
  const m=map.meta;const bpm=Math.round(60000/map.red[0].bl);
  $('#mapinfo').innerHTML='';const add=html=>{const s=document.createElement('span');s.innerHTML=html;$('#mapinfo').appendChild(s);};
  if(mapIsSample&&NO_SAMPLE){add('<span class="tag">未载入谱面</span>');add('文件 → 打开谱面文件夹，或把 .osu / 歌词 / 音频拖进来');}
  else{if(mapIsSample)add('<span class="tag">示例谱面</span>');
  add(`<strong translate="no">${esc(m.ArtistUnicode||m.Artist||'?')} - ${esc(m.TitleUnicode||m.Title||'?')}</strong> [${esc(m.Version||'?')}]`);
  add(`${bpm} BPM · ${map.red.length} 红线 · ${map.kiai.length} 段 kiai`);}
  {const pg=typeof DOCK_PAGES!=='undefined'&&DOCK_PAGES['pg-mon'];if(pg){const nm=mapIsSample&&NO_SAMPLE?'':`${m.TitleUnicode||m.Title||'?'} [${m.Version||'?'}]`;pg.tab.setAttribute('translate','no');pg.tab.textContent=nm?tl('预览')+' · '+nm:tl('预览');pg.tab.title=tl('预览：')+nm+(mapIsSample?tl('（示例谱面）'):'');pg.tab.classList.add('montab');}}
  const f=$('#files');f.innerHTML='';
  const row=(k,v,none)=>{const dt=document.createElement('dt');dt.textContent=k;const dd=document.createElement('dd');dd.textContent=v;if(none)dd.className='none';f.append(dt,dd);};
  row('谱面',mapIsSample?(NO_SAMPLE?'未载入（打开谱面文件夹，或拖入 .osu）':'示例（拖入你的 .osu 替换）'):(m.Version?`${m.Title} [${m.Version}]`:'已载入'),mapIsSample);
  row('歌词',lrcName||(state.lrc===SAMPLE_LRC?'示例歌词':'手动编辑'),!lrcName&&state.lrc===SAMPLE_LRC);
  const want=map.general.AudioFilename;
  row('音频',audioName||(want&&!mapIsSample?`未载入，谱面要的是 ${want}`:'未载入，预览用内部时钟'),!audioName);
  row('背景',bgName||'未设置（只用于预览）',!bgName);
  const ds=$('#diffSel');ds.innerHTML='';
  if(mapIsSample||!maps.length){const o=document.createElement('option');o.textContent='示例谱面';ds.appendChild(o);ds.disabled=true;}
  else{maps.forEach((m,i)=>{const o=document.createElement('option');o.value=i;const n=state.tracks.filter(t=>t.diff===m.ver).length;o.textContent=m.ver+(n?`（${n} 条专属轨道）`:'');ds.appendChild(o);});ds.value=String(mapIdx);ds.disabled=maps.length<2;}
}
$('#diffSel').addEventListener('change',e=>selectDiff(+e.target.value));
async function handleFiles(list,opts={}){
  const imgs=[],osus=[];
  for(const f of list){const n=f.name.toLowerCase();
    try{
      if(n.endsWith('.osu')){const text=await f.text();parseOsu(text);osus.push({file:f.name,text});}
      else if(n.endsWith('.lrc')||n.endsWith('.txt')){state.lrc=await f.text();lrcName=f.name;state.lrcSrc=null;syncUI();}
      else if(SUB_RE.test(n)){const l=subToLrc(f.name,await f.text());if(!l.trim()){toast(`${f.name} 里没有读到字幕`,'err');continue;}state.lrc=l;lrcName=f.name;state.lrcSrc=null;syncUI();toast(`已把字幕 ${f.name} 转成歌词`,'good');}
      else if(n.endsWith('.osb'))await importOsbText(f.name,await f.text());
      else if(n.endsWith('.kuan'))await openProject(await f.text(),f.name);
      else if(f.type.startsWith('audio/')||/\.(mp3|ogg|wav|m4a|flac)$/.test(n)){
        if(audio.src)URL.revokeObjectURL(audio.src);setPlaying(false);audio.src=URL.createObjectURL(f);audioName=f.name;idbPut('__audio',f);decodePcm(f);
        audio.addEventListener('loadedmetadata',()=>{seek(clockPos);schedule();},{once:true});}
      else if(f.type.startsWith('image/')||/\.(png|jpe?g|webp|gif)$/.test(n))imgs.push(f);
      else toast(`不认识的文件：${f.name}`,'err');
    }catch(e){toast(`${f.name}：${e.message}`,'err');}
  }
  if(osus.length){
    /* same song → add / replace difficulties; another song → start a new list */
    const same=!mapIsSample&&maps.length&&titleOf(maps[0].text)===titleOf(osus[0].text);
    const merged=same?maps.filter(m=>!osus.some(o=>o.file===m.file||verOf(o.text)===m.ver)).map(({file,text})=>({file,text})):[];
    setMaps([...merged,...osus],verOf(osus[0].text));saveMaps();
    toast(osus.length>1?`已载入 ${osus.length} 个难度`:`已载入谱面 ${osus[0].file}`,'good');}
  if(imgs.length)await importImages(imgs);
  renderFiles();schedule();
}
$('#pick').addEventListener('click',()=>$('#fileIn').click());
$('#fileIn').addEventListener('change',e=>{handleFiles([...e.target.files]);e.target.value='';});
$('#pickBg').addEventListener('click',()=>$('#bgIn').click());
let bgFile=null;
$('#bgIn').addEventListener('change',e=>{const f=e.target.files[0];e.target.value='';if(!f)return;bgFile=f;const img=new Image();img.onload=()=>{bgImg=img;};img.src=URL.createObjectURL(f);bgName=f.name;renderFiles();});
$('#clearBg').addEventListener('click',()=>{bgImg=null;bgName=null;renderFiles();});
window.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('Files'))e.preventDefault();});
window.addEventListener('drop',e=>{if(!e.dataTransfer.files||!e.dataTransfer.files.length)return;e.preventDefault();$('#binEmpty').classList.remove('over');handleFiles([...e.dataTransfer.files]);});
if(NO_SAMPLE)$('#loadSample').hidden=true;
$('#loadSample').addEventListener('click',()=>{map=parseOsu(sampleOsu());mapIsSample=true;maps=[];saveMaps();state.lrc=SAMPLE_LRC;lrcName=null;syncUI();renderFiles();schedule();toast('已恢复示例谱面和歌词。');});

/* decode the song once for the spectrum (mono, original sample rate) */
async function decodePcm(blob){
  pcm=null;const id=(blob.name||'audio')+':'+blob.size;
  try{const AC=window.AudioContext||window.webkitAudioContext;const ac=new AC();const buf=await ac.decodeAudioData(await blob.arrayBuffer());ac.close&&ac.close();
    const n=buf.length,ch=buf.numberOfChannels,d=new Float32Array(n);for(let c=0;c<ch;c++){const x=buf.getChannelData(c);for(let i=0;i<n;i++)d[i]+=x[i]/ch;}
    pcm={sr:buf.sampleRate,data:d,id};schedule();renderFx();}
  catch(e){toast('音频解码失败，频谱用不了：'+e.message,'err');}
}

