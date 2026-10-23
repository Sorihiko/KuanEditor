/* 素材箱：导入图片 / 序列帧 / 音效 */
/* ---------- media bin ---------- */
async function importImages(files,addAt){
  const out=[];
  for(const f of files){
    if(!/^image\//.test(f.type)&&!/\.(png|jpe?g|webp|gif)$/i.test(f.name))continue;
    try{const{img,url}=await decodeImg(f);const id=uid();
      const m={id,name:f.name,w:img.naturalWidth,h:img.naturalHeight,file:safeFile(f.name)};
      const ok=await idbPut(id,f);
      mediaCache.set(id,{img,url,blob:f,w:m.w,h:m.h,g:{key:'m:'+id,canvas:img,w:m.w,h:m.h,tints:new Map(),media:id}});
      state.media.push(m);out.push(m);if(!ok)toast('浏览器不允许保存图片，刷新后需要重新导入。','err');
    }catch(e){toast(`${f.name}：${e.message}`,'err');}
  }
  if(out.length){
    if(addAt){for(const m of out){const c=newClip(m.id,addAt.tid,addAt.t);state.clips.push(c);sel={type:'clip',id:c.id};addAt.t=c.end;}}
    commit();toast(`已导入 ${out.length} 张图片`+(addAt?'并放到时间轴':'。拖到时间轴的图片轨道即可使用'),'good');
  }
  return out;
}
async function importSequence(files){
  files=[...files].filter(f=>/^image\//.test(f.type)||/\.(png|jpe?g|webp|gif)$/i.test(f.name)).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
  if(files.length<2){toast('序列帧至少要选 2 张图片（按文件名排序）','err');return;}
  const id=uid(),fr=[];
  try{for(let i=0;i<files.length;i++){const{img,url}=await decodeImg(files[i]);fr.push({img,url,blob:files[i]});await idbPut(id+'#'+i,files[i]);}}
  catch(e){toast(e.message,'err');return;}
  const n0=files[0].name,dot=n0.lastIndexOf('.'),stem=(dot>0?n0.slice(0,dot):n0).replace(/[_\-\s]*\d+$/,'')||'anim',ext=dot>0?n0.slice(dot):'.png';
  const m={id,kind:'anim',name:`${stem}（${files.length} 帧）`,w:fr[0].img.naturalWidth,h:fr[0].img.naturalHeight,frames:files.length,delay:83,loop:'LoopForever',file:safeFile(stem+ext,'sb/anim')};
  mediaCache.set(id,animEntry(m,fr));state.media.push(m);commit();toast(`已导入序列帧动画：${files.length} 帧。拖到图片轨道即可使用`,'good');
}
$('#importSeq').addEventListener('click',()=>$('#seqIn').click());
$('#importSnd').addEventListener('click',()=>$('#sndIn').click());
$('#sndIn').addEventListener('change',e=>{importSounds([...e.target.files]);e.target.value='';});
$('#seqIn').addEventListener('change',e=>{importSequence([...e.target.files]);e.target.value='';});
$('#importImg').addEventListener('click',()=>$('#imgIn').click());$('#importImg2').addEventListener('click',()=>$('#imgIn').click());
$('#imgIn').addEventListener('change',e=>{importImages([...e.target.files]);e.target.value='';});
async function importSounds(files){
  let n=0;for(const f of files){try{const buf=await sfx().decodeAudioData(await f.arrayBuffer());const id=uid();await idbPut(id,f);
    const m={id,kind:'sound',name:f.name,file:safeFile(f.name,'sb/sfx'),w:0,h:0,dur:Math.round(buf.duration*1000)};mediaCache.set(id,{sound:true,blob:f,buf,dur:m.dur});state.media.push(m);n++;}
    catch(e){toast(`${f.name}：读不了这个音频`,'err');}}
  if(n){commit();toast(`已导入 ${n} 个音效。双击或拖到时间轴，会放进“音效”轨道`,'good');}
}
function addSound(mid,t,tid){
  let tr=state.tracks.find(x=>x.id===tid&&x.snd)||state.tracks.find(x=>x.snd);if(!tr){tr={id:uid(),name:'音效',layer:'Foreground',snd:true};state.tracks.push(tr);}
  const m=state.media.find(x=>x.id===mid);const s0=Math.round(snapTime(t,null,false));
  const c={id:uid(),kind:'snd',tid:tr.id,mid,start:s0,end:s0+Math.max(60,m.dur||300),vol:100};state.clips.push(c);sel={type:'clip',id:c.id};showTab($('#tab-fx'));commit();
}
function addMediaToTrack(mid,tid,t){
  {const m=state.media.find(x=>x.id===mid);if(m&&m.kind==='sound')return addSound(mid,t,tid);}
  const tr=state.tracks.find(x=>x.id===tid&&isImg(x))||imageTracks()[0];if(!tr){toast('先添加一条图片轨道','err');return;}
  const c=newClip(mid,tr.id,snapTime(t,null,false));state.clips.push(c);sel={type:'clip',id:c.id};activeTid=tr.id;showTab($('#tab-fx'));commit();
}
function renderBin(){
  const box=$('#bin');const n=state.media.length;$('#binEmpty').hidden=n>0;$('#binCount').textContent=n?`${n} 个素材`:'';
  const want=state.media.map(m=>m.id+(mediaReady(m.id)||soundReady(m.id)?'+':'-')).join('|');if(box.dataset.ids===want){box.querySelectorAll('.mitem').forEach(el=>{el.classList.toggle('missing',!mediaReady(el.dataset.id)&&!soundReady(el.dataset.id));const m=state.media.find(x=>x.id===el.dataset.id);const sz=el.querySelector('.sz');if(m&&sz)sz.textContent=m.kind==='sound'?`音效 · ${((m.dur||0)/1000).toFixed(2)} 秒 · ${state.clips.filter(x=>x.mid===m.id).length} 处`:`${m.kind==='anim'?m.frames+' 帧 · ':''}${m.w}×${m.h} · ${state.clips.filter(x=>x.mid===m.id).length} 处`;});return;}
  box.dataset.ids=want;box.innerHTML='';
  for(const m of state.media){
    const it=document.createElement('div');it.className='mitem';it.dataset.id=m.id;it.draggable=true;it.setAttribute('role','listitem');it.tabIndex=0;it.title=`${m.name}（${m.w}×${m.h}）\n双击加到当前轨道`;
    const th=document.createElement('div');th.className='th';const c=mediaReady(m.id);if(m.kind==='sound'){th.classList.add('snd');th.textContent='♪';}else if(c){const im=document.createElement('img');im.src=c.url;im.alt='';th.appendChild(im);}else it.classList.add('missing');
    if(m.kind==='sound'&&soundReady(m.id))it.classList.remove('missing');
    const nm=document.createElement('span');nm.className='nm';nm.textContent=m.name;
    const sz=document.createElement('span');sz.className='sz';sz.textContent=m.kind==='sound'?`音效 · ${((m.dur||0)/1000).toFixed(2)} 秒 · ${state.clips.filter(x=>x.mid===m.id).length} 处`:`${m.kind==='anim'?m.frames+' 帧 · ':''}${m.w}×${m.h} · ${state.clips.filter(x=>x.mid===m.id).length} 处`;
    if(m.kind==='anim')it.classList.add('anim');
    const del=document.createElement('button');del.type='button';del.className='del';del.textContent='删除';
    del.addEventListener('click',ev=>{ev.stopPropagation();if(!del.classList.contains('arm')){del.classList.add('arm');del.textContent='确认删除';setTimeout(()=>{del.classList.remove('arm');del.textContent='删除';},2500);return;}
      state.media=state.media.filter(x=>x.id!==m.id);state.clips=state.clips.filter(x=>x.mid!==m.id);if(sel&&sel.type==='clip'&&!clipById(sel.id))sel=null;commit();toast(`已删除素材 ${m.name}`);});
    it.append(th,nm,sz,del);
    it.addEventListener('dragstart',ev=>{ev.dataTransfer.setData('application/x-kuan-media',m.id);ev.dataTransfer.setData('text/plain',m.name);ev.dataTransfer.effectAllowed='copy';});
    it.addEventListener('dblclick',()=>addMediaToTrack(m.id,activeTid,now()));
    it.addEventListener('contextmenu',ev=>{ev.preventDefault();ctxMenu(ev.clientX,ev.clientY,[{label:'加到时间轴（播放头）',fn:()=>addMediaToTrack(m.id,activeTid,now())},'-',
      {label:`删除素材（${state.clips.filter(x=>x.mid===m.id).length} 处在用）`,fn:()=>{state.media=state.media.filter(x=>x.id!==m.id);state.clips=state.clips.filter(x=>x.mid!==m.id);if(sel&&sel.type==='clip'&&!clipById(sel.id))sel=null;commit();toast(`已删除素材 ${m.name}，可撤销`);}}]);});
    it.addEventListener('keydown',ev=>{if(ev.key==='Enter')addMediaToTrack(m.id,activeTid,now());});
    box.appendChild(it);
  }
}
['#binEmpty','#bin'].forEach(id=>{const el=$(id);
  el.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('Files')){e.preventDefault();$('#binEmpty').classList.add('over');}});
  el.addEventListener('dragleave',()=>$('#binEmpty').classList.remove('over'));});

