/* 右键菜单、复制粘贴、剪切 / 删除属性 / 标签 / 重命名 */
/* ---------- context menu, copy / paste ---------- */
let clipboard=null;   /* {type:'clip',kind,clip} | {type:'line',style,tf} */
const PARAM_KEYS={img:['props','origin','add','fh','fv','nonuni','mode','trig','trigHide','anim'],hit:['hit'],kiai:['kiai'],spec:['spec'],part:['part'],snd:['vol'],text:['text'],trans:['trans']};
function copyClip(c){clipboard={type:'clip',kind:clipKind(c),clip:JSON.parse(JSON.stringify(c))};toast(`已复制${KIND_NAME[clipKind(c)]}片段（Ctrl+V 粘贴参数到同类片段，或在空白处粘贴成新片段）`);}
function pasteParams(c){if(!clipboard||clipboard.type!=='clip'||clipboard.kind!==clipKind(c)){toast('剪贴板里不是同一类片段','err');return;}
  for(const k of PARAM_KEYS[clipKind(c)]||[])if(clipboard.clip[k]!==undefined)c[k]=JSON.parse(JSON.stringify(clipboard.clip[k]));commit();toast('已粘贴参数');}
function pasteNewClip(t,tid){if(!clipboard||clipboard.type!=='clip')return;const src=clipboard.clip,kind=clipboard.kind;
  let tr=tid&&state.tracks.find(x=>x.id===tid&&trackKind(x)===kind);if(!tr)tr=kind==='img'?state.tracks.find(x=>x.id===activeTid&&isImg(x))||imageTracks()[0]:state.tracks.find(x=>trackKind(x)===kind);
  if(!tr){toast(`先添加一条${KIND_NAME[kind]}轨道`,'err');return;}
  const c=JSON.parse(JSON.stringify(src)),d=c.end-c.start;c.id=uid();c.tid=tr.id;c.start=Math.round(snapTime(t,null,false));c.end=c.start+d;if(c.kind==='imp')c.base=c.base+(c.start-src.start);
  state.clips.push(c);sel={type:'clip',id:c.id};commit();toast('已粘贴成新片段');}
function duplicateClip(c){const n=JSON.parse(JSON.stringify(c)),d=c.end-c.start;n.id=uid();n.start=Math.round(c.end);n.end=n.start+d;if(n.kind==='imp')n.base=(c.base||0)+(n.start-c.start);state.clips.push(n);sel={type:'clip',id:n.id};commit();toast('已复制一份，接在后面');}
function copyLine(key){clipboard={type:'line',style:lineStyleOf(key),tf:state.lineTf[key]?{...state.lineTf[key]}:null};toast('已复制这一句的样式和位置');}
function pasteLine(keys){if(!clipboard||clipboard.type!=='line'){toast('剪贴板里不是歌词样式','err');return;}
  for(const k of keys){state.lineStyle[k]={...clipboard.style};if(clipboard.tf)state.lineTf[k]={...clipboard.tf};else delete state.lineTf[k];}commit();toast(`已粘贴到 ${keys.length} 句`);}
function ctxMenu(x,y,items){closeCtx();return buildMenu(x,y,items,0);}
function buildMenu(x,y,items,level){
  const m=document.createElement('div');m.className='ctxmenu';m.setAttribute('role','menu');m.dataset.level=level;
  const closeDeeper=()=>document.querySelectorAll('.ctxmenu[data-level]').forEach(q=>{if(+q.dataset.level>level)q.remove();});
  for(const it of items){if(!it)continue;if(it==='-'){m.appendChild(document.createElement('hr'));continue;}
    const b=document.createElement('button');b.type='button';b.setAttribute('role','menuitem');b.disabled=!!it.disabled;
    b.innerHTML=`<span>${it.sw?`<i class="sw" style="background:${it.sw}"></i>`:''}${esc(it.label)}</span>${it.sub?'<kbd>▸</kbd>':it.key?`<kbd>${esc(it.key)}</kbd>`:''}`;
    if(it.sub){b.setAttribute('aria-haspopup','menu');
      const open=()=>{if(b.disabled)return;closeDeeper();const r=b.getBoundingClientRect();const sm=buildMenu(r.right-2,r.top-5,typeof it.sub==='function'?it.sub():it.sub,level+1);
        const sr=sm.getBoundingClientRect();if(r.right+sr.width>innerWidth-6)sm.style.left=Math.max(6,r.left-sr.width+2)+'px';m.querySelectorAll('button').forEach(q=>q.classList.toggle('subon',q===b));};
      b.addEventListener('pointerenter',open);b.addEventListener('click',open);b.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();open();const f=document.querySelector(`.ctxmenu[data-level="${level+1}"] button:not([disabled])`);if(f)f.focus();}});}
    else{b.addEventListener('pointerenter',()=>{closeDeeper();m.querySelectorAll('.subon').forEach(q=>q.classList.remove('subon'));});b.addEventListener('click',()=>{closeCtx();it.fn();});}
    m.appendChild(b);}
  m.addEventListener('keydown',e=>{const bs=[...m.querySelectorAll(':scope > button:not([disabled])')],i=bs.indexOf(document.activeElement);
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const n=bs[(i+(e.key==='ArrowDown'?1:-1)+bs.length)%bs.length];if(n)n.focus();}
    else if(e.key==='ArrowLeft'&&level>0){e.preventDefault();m.remove();}});
  document.body.appendChild(m);const r=m.getBoundingClientRect();
  m.style.left=Math.max(6,Math.min(x,innerWidth-r.width-6))+'px';m.style.top=Math.max(6,Math.min(y,innerHeight-r.height-6))+'px';
  if(level===0){const f=m.querySelector('button:not([disabled])');if(f)f.focus({preventScroll:true});}
  return m;}
function closeCtx(){document.querySelectorAll('.ctxmenu').forEach(x=>x.remove());if(typeof mbSet==='function')mbSet(null);}
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.ctxmenu')&&!e.target.closest('.menubar'))closeCtx();},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCtx();});
function clipMenuItems(c){const k=clipKind(c),t=now(),r=lastCtx;return[
  {label:'剪切',key:'Ctrl+X',fn:()=>cutClip(c)},
  {label:'复制',key:'Ctrl+C',fn:()=>copyClip(c)},
  {label:'粘贴参数',key:'Ctrl+V',fn:()=>pasteParams(c),disabled:!(clipboard&&clipboard.type==='clip'&&clipboard.kind===k)},
  {label:k==='img'?'删除属性…':'恢复默认参数…',fn:()=>removeAttrs(c,r),disabled:k==='imp'},
  {label:'复制一份接在后面',key:'Ctrl+D',fn:()=>duplicateClip(c)},
  {label:'在播放头切开',fn:()=>splitClip(c,t),disabled:k==='imp'||k==='snd'||t<=c.start+30||t>=c.end-30},
  '-',{label:'标签',key:'▸',sw:c.label&&CLIP_LABELS[c.label]?CLIP_LABELS[c.label][1]:null,fn:()=>labelMenu(c,r)},
  {label:'重命名…',fn:()=>renameClip(c,r)},
  '-',{label:selIds().length>1&&selIds().includes(c.id)?`删除选中的 ${selIds().length} 个片段`:'删除',key:'Del',fn:()=>selIds().length>1&&selIds().includes(c.id)?deleteClips(selIds()):deleteClip(c.id)}];}
/* ---- PR-style clip extras: cut, remove attributes, label colour, rename ---- */
let lastCtx={x:0,y:0};document.addEventListener('contextmenu',e=>{lastCtx={x:e.clientX,y:e.clientY};},true);
const clipFill=(c,def)=>c.label&&CLIP_LABELS[c.label]?CLIP_LABELS[c.label][1]:def;
const clipName=(c,def)=>c.name?c.name:def;
function cutClip(c){copyClip(c);deleteClip(c.id);toast(`已剪切${KIND_NAME[clipKind(c)]}片段（Ctrl+V 粘贴）`);}
function labelMenu(c,r){ctxMenu(r.x,r.y,[{label:(c.label?'　':'✓ ')+'无（默认颜色）',fn:()=>{delete c.label;commit();}},'-',
  ...Object.entries(CLIP_LABELS).map(([k,[n,col]])=>({label:(c.label===k?'✓ ':'')+n,sw:col,fn:()=>{c.label=k;commit();}}))]);}
function popForm(r,html,onOk){
  closeCtx();document.querySelectorAll('.popform').forEach(x=>x.remove());
  const m=document.createElement('div');m.className='ctxmenu popform';m.innerHTML=html+'<div class="row"><button type="button" class="btn primary" data-ok>确定</button><button type="button" class="ghost" data-no>取消</button></div>';
  document.body.appendChild(m);const R=m.getBoundingClientRect();m.style.left=Math.max(6,Math.min(r.x,innerWidth-R.width-6))+'px';m.style.top=Math.max(6,Math.min(r.y,innerHeight-R.height-6))+'px';
  const close=()=>{m.remove();document.removeEventListener('pointerdown',outside,true);};
  const outside=e=>{if(!m.contains(e.target))close();};setTimeout(()=>document.addEventListener('pointerdown',outside,true),0);
  m.querySelector('[data-ok]').addEventListener('click',()=>{if(onOk(m)!==false)close();});m.querySelector('[data-no]').addEventListener('click',close);
  m.addEventListener('keydown',e=>{if(e.key==='Escape')close();else if(e.key==='Enter'&&e.target.tagName==='INPUT'&&e.target.type==='text'){if(onOk(m)!==false)close();}});
  const f=m.querySelector('input,button');if(f){f.focus();if(f.select)f.select();}return m;}
function renameClip(c,r){
  const def=c.kind==='text'?'文字':c.kind==='trans'?'转场':c.kind==='part'?'粒子':c.kind==='kiai'?'Kiai 特效':c.kind==='hit'?'击打特效':c.kind==='spec'?'频谱':c.kind==='imp'?'OSB':((state.media.find(q=>q.id===c.mid)||{}).name||'片段');
  popForm(r,`<label class="f">片段名称<input type="text" maxlength="40" placeholder="${esc(def)}" value="${esc(c.name||'')}"></label><p class="hint">留空 = 用默认名字</p>`,m=>{
    const v=m.querySelector('input').value.trim();if(v)c.name=v;else delete c.name;commit();toast(v?`已重命名为「${v}」`:'已恢复默认名字','good');});}
const ATTRS=[['p','位置'],['s','缩放'],['r','旋转'],['a','不透明度'],['c','颜色'],['blend','混合与翻转']];
function removeAttrs(c,r){
  const k=clipKind(c);
  if(k!=='img'){const nm={kiai:'Kiai 特效',hit:'击打特效',spec:'频谱',part:'粒子',snd:'音效',text:'文字',trans:'转场'}[k];
    popForm(r,`<b>恢复${nm}的默认参数？</b><p class="hint">${k==='part'?'会恢复成当前预设的默认值，贴图和图片保留。':'可以撤销（Ctrl+Z）。'}</p>`,()=>{
      if(k==='hit')c.hit=ownColors(HIT_DEF(),[['custom','accent']]);else if(k==='kiai')c.kiai=ownColors(KIAI_DEF(),[['custom','accent'],['flashCol','flash']]);else if(k==='spec')c.spec=ownColors(SPEC_DEF(),[['custom','accent']]);else if(k==='snd')c.vol=100;else if(k==='text'){const keep=c.text.text;c.text=ownColors(TEXT_DEF(),[['cardCol','accent'],['flashCol','accent']]);c.text.text=keep;}else if(k==='trans')c.trans=TRANS_DEF();
      else if(k==='part'){const p=c.part,pre=PART_PRESETS[p.preset]?p.preset:'snow';c.part=ownColors(Object.assign(PART_DEF(),JSON.parse(JSON.stringify(PART_PRESETS[pre][1])),{preset:pre,img:p.img,texImg:p.texImg,tex:p.tex==='custom'?'custom':PART_PRESETS[pre][1].tex||PART_DEF().tex}),[['custom','accent']]);}
      commit();renderFx();toast('已恢复默认参数','good');});return;}
  const D=newClip(c.mid,c.tid,c.start).props,P=c.props;
  const changed=a=>a==='blend'?!!(c.add||c.fh||c.fv):a==='s'?(!!P.s.kf||!!P.v.kf||c.nonuni||JSON.stringify(P.s.v)!==JSON.stringify(D.s.v)):(!!P[a].kf||JSON.stringify(P[a].v)!==JSON.stringify(D[a].v));
  const html='<b>删除属性</b><p class="hint">勾选的属性会去掉关键帧，恢复成默认值。</p>'+ATTRS.map(([a,n])=>`<label class="chk"><input type="checkbox" data-a="${a}"${changed(a)?' checked':''}${changed(a)?'':' disabled'}> ${n}${changed(a)?((a!=='blend'&&(P[a].kf||(a==='s'&&P.v.kf)))?' <span class="hint">（有关键帧）</span>':''):' <span class="hint">（已是默认）</span>'}</label>`).join('');
  popForm(r,html,m=>{const sel2=[...m.querySelectorAll('input[data-a]:checked')].map(i=>i.dataset.a);if(!sel2.length){toast('没有勾选任何属性');return false;}
    for(const a of sel2){if(a==='blend'){c.add=false;c.fh=false;c.fv=false;continue;}
      P[a]=JSON.parse(JSON.stringify(D[a]));if(a==='s'){P.v=JSON.parse(JSON.stringify(D.v));c.nonuni=false;}}
    commit();renderFx();toast(`已删除 ${sel2.map(a=>ATTRS.find(x=>x[0]===a)[1]).join('、')}`,'good');});}
function lineMenuItems(L){const ks=selKeys().includes(L.src.key)?selKeys():[L.src.key];return[
  {label:ks.length>1?`改选中 ${ks.length} 句的样式`:'改这一句的样式',fn:()=>showTab($('#tab-style'))},
  {label:'复制样式和位置',key:'Ctrl+C',fn:()=>copyLine(L.src.key)},
  {label:ks.length>1?`粘贴到选中的 ${ks.length} 句`:'粘贴样式和位置',key:'Ctrl+V',fn:()=>pasteLine(ks),disabled:!(clipboard&&clipboard.type==='line')},
  '-',{label:'恢复跟随全部样式',fn:()=>{for(const k of ks)delete state.lineStyle[k];commit();},disabled:!ks.some(k=>state.lineStyle[k])},
  {label:'重置位置',fn:()=>{for(const k of ks)delete state.lineTf[k];commit();},disabled:!ks.some(k=>state.lineTf[k])}];}
tcv.addEventListener('contextmenu',e=>{e.preventDefault();const h=hitTimeline(e);
  if(h.c){sel={type:'clip',id:h.c.id};renderFx();ctxMenu(e.clientX,e.clientY,clipMenuItems(h.c));return;}
  if(h.L){if(!selKeys().includes(h.L.src.key))sel={type:'line',key:h.L.src.key};renderFx();ctxMenu(e.clientX,e.clientY,lineMenuItems(h.L));return;}
  const t=xToT(e.clientX),tid=h.row&&h.row.tr?h.row.tr.id:null;
  ctxMenu(e.clientX,e.clientY,[{label:'在这里粘贴片段',key:'Ctrl+V',fn:()=>pasteNewClip(t,tid),disabled:!(clipboard&&clipboard.type==='clip')},{label:'播放头移到这里',fn:()=>seek(t)},'-',...genMenuItems(t)]);});
cv.addEventListener('contextmenu',e=>{e.preventDefault();const t=now(),p=toSB(e),hid=hiddenTids();
  for(let i=gen.sprites.length-1;i>=0;i--){const s=gen.sprites[i];if((!s.clipId&&!s.lineKey)||hid.has(s.tid)||(s.lineKey&&!s.glyph))continue;const ev=evalSprite(s,t);if(!ev||ev.al<0.02)continue;
    if(inQuad(spriteQuad(s,ev),p[0],p[1])){if(s.clipId){const c=clipById(s.clipId);if(c){sel={type:'clip',id:c.id};renderFx();ctxMenu(e.clientX,e.clientY,clipMenuItems(c));}}
      else{const L=gen.lines.find(l=>l.src.key===s.lineKey);if(L){if(!selKeys().includes(L.src.key))sel={type:'line',key:L.src.key};renderFx();ctxMenu(e.clientX,e.clientY,lineMenuItems(L));}}return;}}
  let off=false;try{off=localStorage.getItem('kuan-gl')==='0';}catch(er){}
  ctxMenu(e.clientX,e.clientY,[{label:GLV.ok?'GPU 加速预览：开（点击关闭）':off?'GPU 加速预览：关（点击打开）':'GPU 加速预览：不可用',disabled:!GLV.ok&&!off,fn:()=>{try{localStorage.setItem('kuan-gl',GLV.ok?'0':'1');}catch(er){}toast('刷新页面后生效');}}]);});
function deleteClips(ids){const S=new Set(ids);state.clips=state.clips.filter(c=>!S.has(c.id));sel=null;commit();toast(`已删除 ${S.size} 个片段，可撤销`);}
function deleteClip(id){state.clips=state.clips.filter(c=>c.id!==id);if(sel&&sel.id===id)sel=null;commit();toast('已删除片段，可撤销');}

