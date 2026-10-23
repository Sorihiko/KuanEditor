/* 启动 */
/* ---------- boot ---------- */
map=parseOsu(startOsu());
idbGet('__maps').then(list=>{if(Array.isArray(list)&&list.length&&mapIsSample){try{setMaps(list,state.diffVer);}catch(e){}}}).catch(()=>{}).finally(()=>{kiaiMigReady=true;rebuild();migrateKiai();});
idbGet('__dir').then(h=>{if(h&&h.queryPermission)h.queryPermission({mode:'readwrite'}).then(p=>{if(p==='granted')connectFolder(h,false);else{pendingDir=h;renderFolder();}}).catch(()=>{});});
syncUI();renderFiles();renderHeaders();renderBin();setTool('sel');
fitMonitor();fitCanvas(rcv);fitCanvas(tcv);applyAudio();
rebuild();renderFx();seek(1500);
Promise.all(state.media.map(loadMedia)).then(()=>{renderBin();regenerate();});
Promise.all(state.tracks.filter(t=>t.imp).map(async t=>{const text=await idbGet('imp:'+t.iid);if(text)try{impCache.set(t.iid,parseOsbText(text));}catch(e){}})).then(()=>schedule());
idbGet('__audio').then(f=>{if(!f||audio.src)return;audio.src=URL.createObjectURL(f);audioName=f.name||'上次的音频';renderFiles();decodePcm(f);
  audio.addEventListener('loadedmetadata',()=>{seek(clockPos);schedule();},{once:true});});

