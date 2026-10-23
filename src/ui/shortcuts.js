/* 页签切换、工具、键盘快捷键 */
/* ---------- tabs, tools, shortcuts ---------- */
function showTab(btn){if(btn&&btn.dataset.pane)dockShow(btn.dataset.pane);}
function openExport(){showTab($('#tab-out'));computeStats();}
/* repaint only when something can have changed (playing, input, rebuild); idle frames are skipped */
let redrawSeq=0,lastSig='';const redraw=()=>{redrawSeq++;};
for(const ev of ['pointerdown','pointermove','pointerup','wheel','keydown','dragover','drop'])document.addEventListener(ev,redraw,{passive:true,capture:true});
window.addEventListener('resize',redraw);
function setTool(t){tool=t;$('#toolSel').setAttribute('aria-pressed',String(t==='sel'));$('#toolRazor').setAttribute('aria-pressed',String(t==='razor'));$('#toolHand').setAttribute('aria-pressed',String(t==='hand'));
  tcv.style.cursor=t==='hand'?'grab':t==='razor'?'crosshair':'default';}
$('#toolSel').addEventListener('click',()=>setTool('sel'));$('#toolRazor').addEventListener('click',()=>setTool('razor'));$('#toolHand').addEventListener('click',()=>setTool('hand'));
function setMagnet(on){state.magnet=on;$('#toolMagnet').setAttribute('aria-pressed',String(on));save();}
$('#toolMagnet').addEventListener('click',()=>setMagnet(!state.magnet));
$('#toolAddTrack').addEventListener('click',e=>{const r=e.currentTarget.getBoundingClientRect();ctxMenu(r.right+4,r.top,genMenuItems(null));});
document.addEventListener('keydown',e=>{
  const mod=e.ctrlKey||e.metaKey,k=e.key.toLowerCase(),typing=(/^(TEXTAREA|INPUT|SELECT)$/.test(e.target.tagName)&&!['checkbox','range','color'].includes(e.target.type))||e.target.isContentEditable;
  if(mod&&k==='s'){e.preventDefault();if(dirH)saveToFolder(false);else{showTab($('#tab-out'));toast('还没打开谱面文件夹，可以先在“谱面”页打开，或者在这里导出 zip');}return;}
  if(mod&&!typing&&(k==='c'||k==='v'||k==='d'||k==='x')){const c=selClip(),ks=selKeys();
    if(k==='x'){if(c){e.preventDefault();cutClip(c);}return;}
    if(k==='c'){if(c){e.preventDefault();copyClip(c);}else if(ks.length){e.preventDefault();copyLine(ks[0]);}return;}
    if(k==='v'){e.preventDefault();if(clipboard&&clipboard.type==='line'&&ks.length)pasteLine(ks);else if(clipboard&&clipboard.type==='clip'){if(c&&clipKind(c)===clipboard.kind)pasteParams(c);else pasteNewClip(now(),c?c.tid:null);}return;}
    if(k==='d'&&c){e.preventDefault();duplicateClip(c);return;}}
  if(mod&&!typing&&(k==='z'||k==='y')){e.preventDefault();if(k==='y'||e.shiftKey)redo();else undo();return;}
  if(typing||mod||e.altKey)return;
  if(e.code==='Space'&&!/^(BUTTON)$/.test(e.target.tagName)){e.preventDefault();setPlaying(!playing);}
  else if(k==='v')setTool('sel');else if(k==='c')setTool('razor');else if(k==='h')setTool('hand');else if(k==='s')setMagnet(!state.magnet);
  else if((k==='delete'||k==='backspace')&&selClip()){e.preventDefault();const ids=selIds();if(ids.length>1)deleteClips(ids);else deleteClip(selClip().id);}
  else if(k==='arrowleft'||k==='arrowright'){e.preventDefault();const t=now(),st=beatAt(t)/(state.snap||4),dir=k==='arrowright'?1:-1;seek(snap(t+dir*st*(e.shiftKey?4:1)*0.999,state.snap||4));}
  else if(k==='home')seek(0);
  else if(k==='f'){e.preventDefault();fsToggle();}
  else if(k==='m'){state.muted=!state.muted;applyAudio();save();toast(state.muted?'已静音':'已取消静音');}
});

