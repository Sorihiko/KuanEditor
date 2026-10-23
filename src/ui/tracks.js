/* 轨道头（显示 / 独奏 / 图层）、新建轨道与效果 */
/* ---------- track headers ---------- */
const ICON={eye:'<svg viewBox="0 0 12 12"><path d="M1 6s2-3.5 5-3.5S11 6 11 6 9 9.5 6 9.5 1 6 1 6z"/><circle cx="6" cy="6" r="1.5"/></svg>',
  eyeOff:'<svg viewBox="0 0 12 12"><path d="M1 6s2-3.5 5-3.5S11 6 11 6 9 9.5 6 9.5 1 6 1 6z"/><path d="M2 2l8 8"/></svg>',up:'<svg viewBox="0 0 12 12"><path d="M3 7l3-3 3 3"/></svg>',down:'<svg viewBox="0 0 12 12"><path d="M3 5l3 3 3-3"/></svg>',del:'<svg viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6"/></svg>'};
function renderHeaders(){
  const box=$('#theads'),R=rowsLayout();if(box.contains(document.activeElement)&&document.activeElement.isContentEditable)return;
  box.innerHTML='';let vi=imageTracks().length;
  if(!activeTid||!state.tracks.some(t=>t.id===activeTid&&isImg(t))){const it=imageTracks();activeTid=it.length?it[it.length-1].id:null;}
  for(const row of R.list){
    const el=document.createElement('div');el.className='trh';el.style.height=row.h+'px';
    if(row.notes){el.classList.add('notes');el.textContent=`谱面 note · ${(map.notes||[]).length}`;box.appendChild(el);continue;}
    const tr=row.tr;if(tr.lyric)el.classList.add('lyric');if(tr.id===activeTid)el.classList.add('on');
    const nm=document.createElement('div');nm.className='nm';const b=document.createElement('b');b.textContent=tr.lyric?'A1':tr.kiaiFx?'KI':tr.hit?'FX':tr.spec?'SP':tr.part?'PT':tr.imp?'OSB':tr.snd?'SFX':tr.text?'TX':tr.trans?'TR':'V'+(vi--);if(tr.text||tr.trans)el.classList.add('hitt');if(tr.hit||tr.kiaiFx)el.classList.add('hitt');if(tr.spec)el.classList.add('spect');if(tr.part)el.classList.add('partt');if(tr.imp)el.classList.add('impt');if(tr.snd)el.classList.add('sndt');
    const sp=document.createElement('span');sp.textContent=tl(tr.name);
    if(!tr.lyric){sp.contentEditable='true';sp.spellcheck=false;sp.title='点击改名';
      sp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();sp.blur();}});
      sp.addEventListener('blur',()=>{const v=sp.textContent.trim().slice(0,24);if(v&&v!==tl(tr.name)){tr.name=v;commit();}else sp.textContent=tl(tr.name);});}
    nm.append(b,sp);
    const ct=document.createElement('div');ct.className='ct';
    const ls=document.createElement('select');ls.setAttribute('aria-label',`${tr.name} 所在图层`);
    for(const L of ['Background','Fail','Pass','Foreground','Overlay']){const o=document.createElement('option');o.value=L;o.textContent=LAYER_NAME[L];ls.appendChild(o);}ls.value=tr.layer;
    ls.addEventListener('change',()=>{tr.layer=ls.value;commit();});if(tr.imp){ls.disabled=true;ls.title='导入的 .osb 保留原来的图层';}ct.appendChild(ls);
    const ib=(html,title,fn,dis)=>{const bt=document.createElement('button');bt.type='button';bt.className='ib';bt.innerHTML=html;bt.title=title;bt.setAttribute('aria-label',title);bt.disabled=!!dis;bt.addEventListener('click',e=>{e.stopPropagation();fn();});ct.appendChild(bt);};
    const i=state.tracks.indexOf(tr);
    {const eb=document.createElement('button');eb.type='button';eb.className='ib eye'+(tr.hidden?' off':'');eb.innerHTML=tr.hidden?ICON.eyeOff:ICON.eye;
      eb.title=tr.hidden?'显示这条轨道（只影响预览）':'隐藏这条轨道（只影响预览，导出照常）';eb.setAttribute('aria-label',eb.title);eb.setAttribute('aria-pressed',String(!tr.hidden));
      eb.addEventListener('click',e=>{e.stopPropagation();tr.hidden=!tr.hidden;save();renderHeaders();redraw();});nm.appendChild(eb);
      const sb=document.createElement('button');sb.type='button';sb.className='ib solo'+(state.solo===tr.id?' on':'');sb.textContent='S';
      sb.title=state.solo===tr.id?'取消单独显示':'单独显示这条轨道（预览里只看它）';sb.setAttribute('aria-label',sb.title);sb.setAttribute('aria-pressed',String(state.solo===tr.id));
      sb.addEventListener('click',e=>{e.stopPropagation();state.solo=state.solo===tr.id?null:tr.id;save();renderHeaders();redraw();});nm.appendChild(sb);
      if(tr.hidden||(state.solo&&state.solo!==tr.id))el.classList.add('muted');}
    {const cv0=curVer(),db=document.createElement('button');db.type='button';db.className='ib dif'+(tr.diff?' on':'');db.textContent=tr.diff?'专':'全';
      db.title=tr.diff?`只属于难度 [${tr.diff}]（导出进那个 .osu）。点一下改回全难度`:(cv0?`全难度（导出进 .osb）。点一下改成只属于当前难度 [${cv0}]`:'全难度（导出进 .osb）。载入真实谱面后才能设成难度专属');
      db.setAttribute('aria-label',db.title);db.disabled=!tr.diff&&!cv0;
      db.addEventListener('click',e=>{e.stopPropagation();tr.diff=tr.diff?null:cv0;commit();toast(tr.diff?`「${tr.name}」现在只属于 [${tr.diff}]`:`「${tr.name}」改回全难度`);});ct.appendChild(db);
      if(tr.diff&&tr.diff!==cv0)el.classList.add('otherdiff');}
    el.addEventListener('contextmenu',e=>{e.preventDefault();ctxMenu(e.clientX,e.clientY,[
      {label:'上移（画在更前面）',fn:()=>moveTrack(tr.id,-1),disabled:i===0},{label:'下移（画在更后面）',fn:()=>moveTrack(tr.id,1),disabled:i===state.tracks.length-1},
      {label:tr.hidden?'显示':'隐藏（只影响预览）',fn:()=>{tr.hidden=!tr.hidden;save();renderHeaders();redraw();}},
      {label:state.solo===tr.id?'取消单独显示':'单独显示',fn:()=>{state.solo=state.solo===tr.id?null:tr.id;save();renderHeaders();redraw();}},
      ...(tr.lyric?[]:['-',{label:'删除轨道',fn:()=>deleteTrack(tr.id)}])]);});
    const mv=document.createElement('span');mv.className='mv';
    for(const[d,ic,lab,dis]of [[-1,ICON.up,'上移（画在更前面）',i===0],[1,ICON.down,'下移（画在更后面）',i===state.tracks.length-1]]){const bt=document.createElement('button');bt.type='button';bt.className='ib';bt.innerHTML=ic;bt.title=lab;bt.setAttribute('aria-label',lab);bt.disabled=dis;bt.addEventListener('click',e=>{e.stopPropagation();moveTrack(tr.id,d);});mv.appendChild(bt);}
    nm.appendChild(mv);
    if(!tr.lyric)ib(ICON.del,'删除轨道和上面的片段',()=>deleteTrack(tr.id));
    el.append(nm,ct);
    if(isImg(tr))el.addEventListener('click',()=>{activeTid=tr.id;box.querySelectorAll('.trh').forEach(x=>x.classList.remove('on'));el.classList.add('on');});
    box.appendChild(el);
  }
  tcv.style.height=R.H+'px';fitCanvas(tcv);
}

function addSoundTrack(){let tr=state.tracks.find(x=>x.snd);if(tr){toast('已经有音效轨道了，把音效拖到上面即可');return;}tr={id:uid(),name:'音效',layer:'Foreground',snd:true};state.tracks.push(tr);commit();toast('已添加音效轨道。在素材页导入音效后拖上去','good');}
function genAdd(k,o){o=o||{};if(k.startsWith('part:'))return addParticles({...o,preset:k.slice(5)});const it=GEN_ITEMS.find(x=>x.k===k);if(it)it.fn(o);}
function genMenuItems(t){return GEN_ITEMS.map(it=>({label:(t!=null&&it.k!=='img'&&it.k!=='snd'?'在这里添加':'新建')+it.name,fn:()=>genAdd(it.k,t!=null?{t}:{})}));}
function renderGenPane(){const box=$('#genList');if(!box)return;box.innerHTML='';
  const mk=(k,name,desc,sub)=>{const b=document.createElement('button');b.type='button';b.className='gitem'+(sub?' sub':'');b.draggable=true;
    b.innerHTML=`<span class="gn">${esc(name)}</span>${desc?`<span class="gd">${esc(desc)}</span>`:''}`;
    b.title=k==='img'||k==='snd'?'点击添加':'点击添加，或拖到时间轴上的某个时间';
    b.addEventListener('click',()=>genAdd(k));
    b.addEventListener('dragstart',e=>{e.dataTransfer.setData('application/x-kuan-gen',k);e.dataTransfer.effectAllowed='copy';});
    box.appendChild(b);};
  const h=t=>{const d=document.createElement('div');d.className='h3';d.textContent=t;box.appendChild(d);};
  h('轨道');for(const it of GEN_ITEMS.slice(0,2))mk(it.k,it.name,it.desc);
  h('效果');for(const it of GEN_ITEMS.filter(x=>!['img','snd'].includes(x.k)))mk(it.k,it.name,it.desc);
}
function addTrack(o){o=o&&!(o instanceof Event)?o:{};const n=imageTracks().length+1;const tr={id:uid(),name:'图片 '+n,layer:'Foreground'};state.tracks.unshift(tr);activeTid=tr.id;commit();toast('已添加图片轨道，拖素材到上面即可');}
/* Kiai 特效：一条轨道，每段 kiai 一个片段 */
function kiaiTrack(){let tr=state.tracks.find(t=>t.kiaiFx);if(!tr){tr={id:uid(),name:'Kiai 特效',layer:'Foreground',kiaiFx:true};state.tracks.unshift(tr);}return tr;}
function addKiaiClips(o){o=o&&!(o instanceof Event)?o:{};
  const K=songSpan(gen.duration||20000).kiai,tr=kiaiTrack();let made=[];
  if(o.t!=null){const k=K.find(q=>o.t>=q.s-50&&o.t<q.e);const s0=k&&Math.abs(k.s-o.t)<beatAt(o.t)?k.s:o.t,e0=k?k.e:o.t+16*beatAt(o.t);made.push(newKiaiClip(tr.id,s0,Math.min(gen.duration||e0,e0)));}
  else{const mine=state.clips.filter(c=>c.tid===tr.id);for(const k of K)if(!mine.some(c=>c.start<k.e&&c.end>k.s))made.push(newKiaiClip(tr.id,k.s,k.e));
    if(!made.length){if(!K.length){const t=now();made.push(newKiaiClip(tr.id,t,t+16*beatAt(t)));toast('谱面里没有 kiai 段，已在播放头加一段');}else{toast('每段 kiai 都已经有特效了');sel={type:'clip',id:mine[0].id};showTab($('#tab-fx'));commit();return;}}}
  state.clips.push(...made);sel={type:'clip',id:made[0].id};showTab($('#tab-fx'));commit();
  if(made.length>1||o.t!=null||K.length)toast(o.t!=null?'已添加 Kiai 特效':`已给 ${made.length} 段 kiai 加特效`,'good');}
/* 旧项目里的“Kiai 全局开关”一次性转换成 Kiai 特效轨道（只在打开旧项目时做一次） */
function migrateKiai(){if(!kiaiMigReady||!('fxFlash' in state||'fxPulse' in state))return;
  const fl=state.fxFlash!==false,pu=state.fxPulse!==false;delete state.fxFlash;delete state.fxPulse;
  if((fl||pu)&&!state.tracks.some(t=>t.kiaiFx)){const K=songSpan(gen.duration||20000).kiai;
    if(K.length){const tr=kiaiTrack();for(const k of K){const c=newKiaiClip(tr.id,k.s,k.e);c.kiai.flash=fl;c.kiai.pulse=pu;state.clips.push(c);}rebuild();renderHeaders();}}
  save();}
function addHitFx(o){o=o&&!(o instanceof Event)?o:{};
  if(!(map.objs&&map.objs.length)){toast('谱面里没有 note','err');return;}
  let tr=state.tracks.find(t=>t.hit);
  if(!tr){tr={id:uid(),name:'击打特效',layer:'Overlay',hit:true};state.tracks.unshift(tr);}
  const mine=state.clips.filter(c=>c.tid===tr.id),O=map.objs,last=O[O.length-1];
  let s0,s1;const L=selKeys().length?gen.lines.find(l=>l.src.key===sel.key):null;
  if(o.t!=null){s0=o.t;s1=Math.min(gen.duration,s0+16*beatAt(s0));}
  else if(L){s0=L.S;s1=L.E;}
  else if(!mine.length){s0=Math.max(0,O[0].t-50);s1=(last.endT||last.t)+50;}
  else{s0=now();s1=s0+8*beatAt(s0);}
  const c=newHitClip(tr.id,s0,s1);state.clips.push(c);sel={type:'clip',id:c.id};showTab($('#tab-fx'));commit();
  toast(o.t!=null?'已添加击打特效':L?'已给这一句范围内的 note 加特效':!mine.length?'已给整首的 note 加特效，可以裁剪 / 切开只留某几段':'已在播放头加一段击打特效','good');
}
function addParticles(o){o=o&&!(o instanceof Event)?o:{};const k=o.preset&&PART_PRESETS[o.preset]?o.preset:null;
  const tr={id:uid(),name:k?PART_PRESETS[k][0]:'粒子',layer:'Foreground',part:true};state.tracks.unshift(tr);
  const L=o.t==null&&selKeys().length?gen.lines.find(l=>l.src.key===sel.key):null;
  const s0=o.t!=null?o.t:L?L.S:0,s1=o.t!=null?Math.min(gen.duration,o.t+32*beatAt(o.t)):L?L.E:gen.duration;
  const c=newPartClip(tr.id,s0,s1);if(k){Object.assign(c.part,JSON.parse(JSON.stringify(PART_PRESETS[k][1])),{preset:k});ownColors(c.part,[['custom','accent']]);}
  state.clips.push(c);sel={type:'clip',id:c.id};showTab($('#tab-fx'));commit();toast(`已添加粒子（${PART_PRESETS[c.part.preset||'snow'][0]}）。在右边换预设或调参数`,'good');
}
function addSpectrum(o){o=o&&!(o instanceof Event)?o:{};
  let tr=state.tracks.find(t=>t.spec);
  if(!tr){tr={id:uid(),name:'音频频谱',layer:'Foreground',spec:true};state.tracks.unshift(tr);}
  const mine=state.clips.filter(c=>c.tid===tr.id);const L=selKeys().length?gen.lines.find(l=>l.src.key===sel.key):null;
  let s0,s1;if(o.t!=null){s0=o.t;s1=Math.min(gen.duration,s0+16*beatAt(s0));}else if(L){s0=L.S;s1=L.E;}else if(!mine.length){s0=0;s1=gen.duration;}else{s0=now();s1=s0+16*beatAt(s0);}
  const c=newSpecClip(tr.id,s0,s1);state.clips.push(c);sel={type:'clip',id:c.id};showTab($('#tab-fx'));commit();
  toast(pcm?'已添加频谱':'已添加频谱。还需要载入音频（谱面页）才会动起来',pcm?'good':'');
}
/* 文字 / 转场：各用一条轨道，在播放头（或拖到的位置）加一段 */
const SCREEN_FX={text:{name:'文字',layer:'Foreground',beats:8,make:newTextClip,msg:'已添加文字。在右边改内容、字体和进场方式；也可以在画面里直接拖'},
  trans:{name:'转场',layer:'Overlay',beats:1,make:newTransClip,msg:'已添加转场。拖到两段之间，长度就是转场时间'}};
function addScreenFx(k,o){o=o&&!(o instanceof Event)?o:{};const D=SCREEN_FX[k];
  let tr=state.tracks.find(t=>t[k]);if(!tr){tr={id:uid(),name:D.name,layer:D.layer,[k]:true};state.tracks.unshift(tr);}
  const L=o.t==null&&selKeys().length?gen.lines.find(l=>l.src.key===sel.key):null;
  const s0=Math.max(0,Math.round(o.t!=null?o.t:L&&k==='text'?L.S:now())),s1=Math.min(gen.duration||s0+10000,L&&k==='text'&&o.t==null?L.E:s0+D.beats*beatAt(s0));
  const c=D.make(tr.id,s0,Math.max(s0+100,s1));state.clips.push(c);sel={type:'clip',id:c.id};showTab($('#tab-fx'));commit();toast(D.msg,'good');}
function deleteTrack(id){const n=state.clips.filter(c=>c.tid===id).length;state.tracks=state.tracks.filter(t=>t.id!==id);state.clips=state.clips.filter(c=>c.tid!==id);if(sel&&sel.type==='clip'&&!clipById(sel.id))sel=null;commit();toast(`已删除轨道${n?`和上面的 ${n} 个片段`:''}，可撤销`);}
function moveTrack(id,d){const i=state.tracks.findIndex(t=>t.id===id),j=i+d;if(j<0||j>=state.tracks.length)return;const a=state.tracks;[a[i],a[j]]=[a[j],a[i]];commit();}
