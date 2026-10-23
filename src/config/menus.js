/* 顶部菜单栏：每个菜单 = [名称, Alt 快捷字母, 菜单项]；菜单项 {label 文字, key 显示的快捷键, fn 点击后做什么, sub 子菜单, disabled 是否灰掉} */
const MENUS=[
  ['文件','F',r=>[
    {label:'打开项目文件…',key:'Ctrl+O',fn:mbBtn('openProj')},{label:'保存项目文件',fn:mbBtn('saveProj')},'-',
    {label:'打开谱面文件夹…',fn:mbBtn('openFolder')},{label:'重新连接上次的文件夹',fn:mbBtn('reconnect'),disabled:mbOff('reconnect')},
    {label:'保存到谱面文件夹',key:'Ctrl+S',fn:mbBtn('saveFolder'),disabled:mbOff('saveFolder')},{label:'断开谱面文件夹',fn:mbBtn('closeFolder'),disabled:mbOff('closeFolder')},'-',
    {label:'导入',sub:()=>[{label:'图片…',fn:mbBtn('importImg')},{label:'序列帧…',fn:mbBtn('importSeq')},{label:'音效…',fn:mbBtn('importSnd')},'-',
      {label:'谱面 / 歌词 / 字幕 / 音频…',fn:mbBtn('pick')},{label:'.osb…',fn:mbBtn('importOsb')},{label:'预览背景图…',fn:mbBtn('pickBg')}]},
    {label:'导出',sub:()=>[{label:'导出 zip',fn:mbBtn('exportZip')},{label:'复制 .osb 文本',fn:mbBtn('copyOsb')},{label:'打开导出页',fn:openExport}]},
    ...(NO_SAMPLE?[]:['-',{label:'载入示例谱面',fn:mbBtn('loadSample')}])]],
  ['编辑','E',r=>{const c=selClip();return[
    {label:'撤销',key:'Ctrl+Z',fn:undo,disabled:!canUndo()},{label:'重做',key:'Ctrl+Shift+Z',fn:redo,disabled:!canRedo()},'-',
    {label:'剪切',key:'Ctrl+X',fn:()=>cutClip(c),disabled:!c},{label:'复制',key:'Ctrl+C',fn:doCopy,disabled:!c&&!selKeys().length},
    {label:'粘贴',key:'Ctrl+V',fn:doPaste,disabled:!clipboard},{label:'清除',key:'Del',fn:()=>deleteClip(c.id),disabled:!c},'-',
    {label:'取消选择',fn:()=>{sel=null;renderFx();redraw();},disabled:!sel}];}],
  ['剪辑','C',r=>{const c=selClip(),t=now(),k=c?clipKind(c):null;return[
    {label:'复制一份接在后面',key:'Ctrl+D',fn:()=>duplicateClip(c),disabled:!c},
    {label:'在播放头切开',fn:()=>splitClip(c,t),disabled:!c||k==='imp'||k==='snd'||t<=c.start+30||t>=c.end-30},'-',
    {label:k&&k!=='img'?'恢复默认参数…':'删除属性…',fn:()=>removeAttrs(c,r),disabled:!c||k==='imp'},
    {label:'标签',sub:()=>[{label:(c.label?'　':'✓ ')+'无（默认颜色）',fn:()=>{delete c.label;commit();}},'-',
      ...Object.entries(CLIP_LABELS).map(([kk,[n,col]])=>({label:(c.label===kk?'✓ ':'')+n,sw:col,fn:()=>{c.label=kk;commit();}}))],disabled:!c},
    {label:'重命名…',fn:()=>renameClip(c,r),disabled:!c},
    ...(c?[]:['-',{label:'（先在时间轴上选中一个片段）',disabled:true,fn:()=>{}}])];}],
  ['时间线','S',r=>[
    {label:'新建',sub:()=>genMenuItems(null)},'-',
    {label:'放大',fn:mbBtn('zIn')},{label:'缩小',fn:mbBtn('zOut')},{label:'显示全部',fn:mbBtn('zAll')},
    {label:mbChk($('#zFollow').checked,'播放时跟随'),fn:()=>{const z=$('#zFollow');z.checked=!z.checked;}},'-',
    {label:'工具',sub:()=>[{label:mbChk(tool==='sel','选择'),key:'V',fn:()=>setTool('sel')},{label:mbChk(tool==='razor','剃刀'),key:'C',fn:()=>setTool('razor')},{label:mbChk(tool==='hand','抓手'),key:'H',fn:()=>setTool('hand')}]},
    {label:mbChk(state.magnet,'吸附'),key:'S',fn:()=>setMagnet(!state.magnet)}]],
  ['播放','P',r=>[
    {label:playing?'暂停':'播放',key:'空格',fn:()=>setPlaying(!playing)},'-',
    {label:'上一句',fn:()=>jumpLine(-1)},{label:'下一句',fn:()=>jumpLine(1)},{label:'回到开头',key:'Home',fn:()=>seek(0)},'-',
    {label:mbChk(state.muted,'静音'),key:'M',fn:()=>{state.muted=!state.muted;applyAudio();save();}},
    {label:'播放速度',sub:()=>['0.25','0.5','0.75','1'].map(v=>({label:mbChk(+$('#rateSel').value===+v,v+'×'),fn:()=>{$('#rateSel').value=v;$('#rateSel').dispatchEvent(new Event('change'));}}))}]],
  ['视图','V',r=>{let off=false;try{off=localStorage.getItem('kuan-gl')==='0';}catch(e){}return[
    {label:fsOn?'退出全屏预览':'全屏预览',key:'F',fn:fsToggle},'-',
    {label:mbChk($('#showNotes').checked,'显示 note'),fn:()=>mbToggle('showNotes')},
    {label:'预览状态',sub:()=>[['pass','通过状态'],['fail','失败状态']].map(([v,n])=>({label:mbChk($('#pvState').value===v,n),fn:()=>{$('#pvState').value=v;$('#pvState').dispatchEvent(new Event('change'));}}))},
    {label:mbChk($('#guide').checked,'安全区虚线'),fn:()=>mbToggle('guide')},'-',
    {label:'主题',sub:()=>THEMES.map(([v,n])=>({label:mbChk((document.documentElement.dataset.theme||'')===v,n),fn:()=>setTheme(v)}))},
    {label:'语言 / Language',sub:()=>[['zh','中文'],['en','English']].map(([v,n])=>({label:mbChk(LANG===v,n),fn:()=>setLang(v)}))},
    {label:mbChk(GLV.ok,'GPU 加速预览'),disabled:!GLV.ok&&!off,fn:()=>{try{localStorage.setItem('kuan-gl',GLV.ok?'0':'1');}catch(e){}toast('刷新页面后生效');}}];}],
  ['窗口','W',r=>[
    {label:'工作区',sub:()=>dockMenuItems(r)},'-',
    ...Object.keys(DOCK_PAGES).map(id=>{const pg=DOCK_PAGES[id],on=!pg.body.hidden;return{label:mbChk(on,pg.tab.title||pg.tab.textContent),fn:()=>dockShow(id)};})]],
  ['帮助','H',r=>[{label:'快捷键…',fn:showKeys},{label:'关于 宽',fn:()=>popForm(r,'<b>宽 Kuan Storyboard</b><p class="hint">osu! 歌词 storyboard 编辑器。导出的 .osb 第一行带 “Made with Kuan Storyboard”。</p>',()=>true)}]]];
