/* 字幕样式面板 */
/* ---------- lyrics / style controls ---------- */
const sw0=$('#swatches');
for(const p of PALETTES){const b=document.createElement('button');b.type='button';b.className='sw';b.dataset.v=p.id;b.title=p.name;b.setAttribute('aria-label','配色：'+p.name);
  const s=document.createElement('span');s.style.background=`linear-gradient(135deg, rgb(${p.text}) 0 50%, rgb(${p.accent}) 50% 100%)`;b.appendChild(s);
  sw0.appendChild(b);}
{const b=document.createElement('button');b.type='button';b.className='sw custom';b.dataset.v='custom';b.title='自定义配色';b.setAttribute('aria-label','配色：自定义');
  const s=document.createElement('span');b.appendChild(s);sw0.appendChild(b);}
function syncUI(){
  $('#offset').value=state.offset;$('#snapDiv').value=String(state.snap);$('#snapTo').value=state.snapTo;$('#charMode').value=state.charMode;
  $('#guide').checked=state.guide;$('#showNotes').checked=state.showNotes!==false;$('#pvState').value=state.pvPass===false?'fail':'pass';$('#pvBg').value=state.pvBg;$('#noteAlpha').value=state.noteAlpha??60;$('#autoSave').checked=!!state.autoSave;$('#optimize').checked=state.optimize!==false;
  if($('#lrc').value!==state.lrc)$('#lrc').value=state.lrc;
  $('#toolMagnet').setAttribute('aria-pressed',String(state.magnet!==false));
  syncStyle();
}
/* style controls edit the selected lines only; with nothing selected they edit the global default */
function syncStyle(){
  const ks=selKeys(),ef=lineStyleOf(ks[0]||null);
  $$('#styleSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===ef.style)));
  $$('.sw').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===ef.palette)));
  {const cp=palOf({...ef,palette:'custom'});$('.sw.custom span').style.background=`linear-gradient(135deg, rgb(${cp.text}) 0 50%, rgb(${cp.accent}) 50% 100%)`;
   $('#customPal').hidden=ef.palette!=='custom';for(const k of ['cText','cAccent']){const el=$('#'+k);if(document.activeElement!==el)el.value=hex(ef[k]);}}
  $('#font').value=ef.font;if(document.activeElement!==$('#seed'))$('#seed').value=ef.seed;$('#size').value=ef.size;$('#sizeVal').textContent=ef.size+' px';
  for(const k of FX_KEYS){const el=$('#'+k);if(!el||document.activeElement===el&&el.type!=='checkbox')continue;if(el.type==='checkbox')el.checked=!!ef[k];else if(el.type==='color')el.value=hex(ef[k]);else el.value=ef[k];}
  $$('.fxr').forEach(r=>r.classList.toggle('off',!ef[r.dataset.k]));
  const box=$('#styleScope');box.innerHTML='';box.classList.toggle('on',ks.length>0);
  const t=document.createElement('div');t.className='st';
  const bt=(txt,fn,cls)=>{const b=document.createElement('button');b.type='button';b.className=cls||'ghost';b.textContent=txt;b.addEventListener('click',fn);return b;};
  if(ks.length){const L=gen.lines.find(l=>l.src.key===ks[0]);
    t.innerHTML=`<b>只改选中的 ${ks.length} 句</b><span>${L?'「'+esc(lineText(L))+'」':''}${ks.length>1?' 等':''}</span>`;box.appendChild(t);
    const r=document.createElement('div');r.className='row';
    const anyOv=ks.some(k=>state.lineStyle[k]);
    r.append(bt('恢复跟随全部',()=>{for(const k of ks)delete state.lineStyle[k];syncStyle();schedule();toast('这几句已恢复跟随全部');}),bt('取消选择（改全部）',()=>{sel=null;renderFx();}));
    r.firstChild.disabled=!anyOv;box.appendChild(r);}
  else{const n=gen.lines.filter(l=>state.lineStyle[l.src.key]).length;
    t.innerHTML=`<b>正在改：全部歌词</b><span>${n?`单独设置过的 ${n} 句不受影响`:'在时间轴或画面里点一句，就只改那一句；Ctrl 点击多选，Shift 点击选一段'}</span>`;box.appendChild(t);
    if(n){const r=document.createElement('div');r.className='row';r.append(bt('全部统一（清除单独设置）',()=>{state.lineStyle={};syncStyle();schedule();toast('已清除所有单独设置');}));box.appendChild(r);}}
}
function setStyle(k,v){
  const ks=selKeys();
  if(ks.length)for(const key of ks)state.lineStyle[key]=Object.assign({},state.lineStyle[key]||{},{[k]:v});
  else state[k]=v;
  syncStyle();schedule();
}
for(const b of $$('.sw'))b.addEventListener('click',()=>setStyle('palette',b.dataset.v));
$$('#styleSeg button').forEach(b=>b.addEventListener('click',()=>setStyle('style',b.dataset.v)));
$('#font').addEventListener('change',e=>setStyle('font',e.target.value));
$('#seed').addEventListener('input',e=>{const v=parseInt(e.target.value,10);if(!isNaN(v))setStyle('seed',v);});
$('#size').addEventListener('input',e=>setStyle('size',+e.target.value));
for(const k of FX_KEYS){const el=$('#'+k);if(!el)continue;
  if(el.type==='checkbox')el.addEventListener('change',()=>setStyle(k,el.checked));
  else if(el.type==='color')el.addEventListener('input',()=>setStyle(k,unhex(el.value)));
  else el.addEventListener('input',()=>setStyle(k,+el.value));}
for(const k of ['cText','cAccent'])$('#'+k).addEventListener('input',e=>setStyles({palette:'custom',[k]:unhex(e.target.value)}));
function setStyles(o){const ks=selKeys();if(ks.length)for(const key of ks)state.lineStyle[key]=Object.assign({},state.lineStyle[key]||{},o);else Object.assign(state,o);syncStyle();schedule();}
const accNow=()=>{const ef=lineStyleOf(selKeys()[0]||null);return palOf(ef).accent.slice();};
const OFF={shadow:false,glow:false,grad:false};
for(const[n,fn]of [['普通',()=>({...OFF,outline:true,olW:16,olCol:[0,0,0]})],['无描边',()=>({...OFF,outline:false})],
  ['投影',()=>({...OFF,outline:true,olW:10,olCol:[0,0,0],shadow:true,shDist:10,shBlur:4,shCol:[0,0,0]})],
  ['霓虹',()=>({...OFF,outline:false,glow:true,glR:24,glCol:accNow()})],
  ['渐变',()=>({...OFF,outline:true,olW:12,olCol:[24,10,30],grad:true,grA:[255,255,255],grB:accNow()})]]){
  const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent=n;b.addEventListener('click',()=>setStyles(fn()));$('#fxPresets').appendChild(b);}
$('#offset').addEventListener('input',e=>{state.offset=+e.target.value||0;schedule();});
$('#snapDiv').addEventListener('change',e=>{state.snap=+e.target.value;schedule();});
$('#snapTo').addEventListener('change',e=>{state.snapTo=e.target.value;schedule();});
$('#charMode').addEventListener('change',e=>{state.charMode=e.target.value;schedule();});
$('#guide').addEventListener('change',e=>{state.guide=e.target.checked;save();redraw();});
$('#showNotes').addEventListener('change',e=>{state.showNotes=e.target.checked;save();});
$('#pvState').addEventListener('change',e=>{state.pvPass=e.target.value==='pass';save();});
$('#pvBg').addEventListener('input',e=>{state.pvBg=+e.target.value;redraw();});$('#pvBg').addEventListener('change',save);
$('#noteAlpha').addEventListener('input',e=>{state.noteAlpha=+e.target.value;redraw();});$('#noteAlpha').addEventListener('change',save);
$('#optimize').addEventListener('change',e=>{state.optimize=e.target.checked;save();toast(state.optimize?'导出时会优化':'导出时不优化（原样输出）');});
$('#autoSave').addEventListener('change',e=>{state.autoSave=e.target.checked;save();if(state.autoSave&&dirH)saveToFolder(true);});
$('#lrc').addEventListener('input',e=>{state.lrc=e.target.value;lrcName=null;state.lrcSrc=null;renderFiles();schedule();});
$('#dice').addEventListener('click',()=>{const r=Math.random,roll=()=>({seed:Math.floor(r()*99999),palette:PALETTES[Math.floor(r()*PALETTES.length)].id,font:['sans','serif','dela'][Math.floor(r()*3)],style:['slam','scatter','vertical','mix','mix'][Math.floor(r()*5)]});
  const ks=selKeys();
  if(ks.length){for(const k of ks)state.lineStyle[k]=Object.assign({},state.lineStyle[k]||{},roll(),{style:['slam','scatter','vertical'][Math.floor(r()*3)]});toast(`已随机选中的 ${ks.length} 句`);}
  else Object.assign(state,roll());
  syncStyle();schedule();});

