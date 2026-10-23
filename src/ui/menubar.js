/* 顶部菜单栏 */
/* ---------- menu bar (文件 / 编辑 / 剪辑 / 时间线 / 播放 / 视图 / 窗口 / 帮助) ---------- */
const mbBtn=id=>()=>{const b=$('#'+id);if(b)b.click();};
const mbOff=id=>{const b=$('#'+id);return !b||b.disabled||b.hidden||!!b.closest('[hidden]:not(.pane):not(.dpage)');};
const mbChk=(on,label)=>(on?'✓ ':'　')+label;
function mbToggle(id){const el=$('#'+id);el.checked=!el.checked;el.dispatchEvent(new Event('change',{bubbles:true}));}
function doCopy(){const c=selClip(),ks=selKeys();if(c)copyClip(c);else if(ks.length)copyLine(ks[0]);else toast('先选中一个片段或一句歌词');}
function doPaste(){const c=selClip(),ks=selKeys();if(clipboard&&clipboard.type==='line'&&ks.length)pasteLine(ks);else if(clipboard&&clipboard.type==='clip'){if(c&&clipKind(c)===clipboard.kind)pasteParams(c);else pasteNewClip(now(),c?c.tid:null);}else toast('剪贴板是空的');}
function showKeys(){const r={x:innerWidth/2-160,y:90};
  const K=[['空格','播放 / 暂停'],['← / →','前后移动一个吸附单位（Shift ×4）'],['Home','回到开头'],['M','静音'],['V / C / H','选择 / 剃刀 / 抓手'],['S','吸附开关'],
    ['Ctrl+Z / Ctrl+Shift+Z','撤销 / 重做'],['Ctrl+X / C / V','剪切 / 复制 / 粘贴'],['Ctrl+D','复制一份接在后面'],['Del','删除片段'],['Ctrl+S','保存到谱面文件夹'],['Ctrl+O','打开项目文件'],
    ['拖时间标尺','移动播放头'],['Shift+拖播放头','吸附到片段 / 歌词边缘'],['Shift+拖片段 / 歌词','只吸附到播放头'],['在时间轴空白处拖','框选片段 / 歌词（按住 Shift 或 Ctrl 加选）'],['Ctrl+点片段','加选 / 取消选中'],['拖歌词下面的小刻度','调整每个字出现的时间'],['J（打点时）','给下一个字定在当前时间'],['拖动选中的一组','一起移动'],['滚轮 / Shift+滚轮','时间轴缩放 / 平移']];
  popForm(r,'<b>快捷键</b><table class="keys">'+K.map(([a,b])=>`<tr><td><kbd>${esc(a)}</kbd></td><td>${esc(b)}</td></tr>`).join('')+'</table>',()=>true);}
const THEMES=[['','默认'],['berry','莓果']];
function setTheme(v){const r=document.documentElement;if(v)r.dataset.theme=v;else delete r.dataset.theme;try{localStorage.setItem('kuan-theme',v);}catch(e){}tokAt=0;redraw();}
let mbOpen=null;
function mbSet(name){mbOpen=name;document.querySelectorAll('.menubar > button').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.m===name)));}
function mbShow(b){const def=MENUS.find(m=>m[0]===b.dataset.m);const r=b.getBoundingClientRect(),at={x:r.left,y:r.bottom+2};
  closeCtx();buildMenu(at.x,at.y,def[2](at),0);mbSet(def[0]);}
(function mbInit(){const bar=document.createElement('nav');bar.className='menubar';bar.setAttribute('aria-label','菜单');
  for(const[n,acc]of MENUS){const b=document.createElement('button');b.type='button';b.dataset.m=n;b.setAttribute('aria-haspopup','menu');b.setAttribute('aria-expanded','false');
    b.textContent=n;
    b.addEventListener('pointerdown',e=>{e.preventDefault();if(mbOpen===n)closeCtx();else mbShow(b);});
    b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '||e.key==='ArrowDown'){e.preventDefault();mbShow(b);}});
    b.addEventListener('pointerenter',()=>{if(mbOpen&&mbOpen!==n)mbShow(b);});bar.appendChild(b);}
  document.querySelector('.bar .brand').after(bar);
  document.addEventListener('keydown',e=>{if(e.altKey&&!e.ctrlKey&&!e.metaKey){const m=MENUS.find(q=>q[1].toLowerCase()===e.key.toLowerCase());if(m){e.preventDefault();mbShow(bar.querySelector(`[data-m="${m[0]}"]`));}}
    if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key.toLowerCase()==='o'){e.preventDefault();$('#openProj').click();}});
})();
renderGenPane();
requestAnimationFrame(frame);

/* 界面语言（视图 → 语言）：画在 canvas 上的字切换后要重画 */
I18N_HOOKS.push(()=>redraw(),()=>renderFiles(),()=>renderHeaders());
i18nStart();setLang(LANG);
