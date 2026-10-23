/* 效果控件：导入的 .osb、频谱、击打特效 */
function renderImpFx(box,c){
  const I=impCache.get(c.iid),tr=state.tracks.find(x=>x.id===c.tid)||{},off=Math.round(c.start-(c.base||0));
  const missing=I?new Set(I.blocks.map(b=>b.sprite.impPath).filter(p=>{const g=impTexCache.get(p);return!g||typeof g!=='object';})).size:0;
  const hd=document.createElement('div');hd.className='fx-h';hd.innerHTML=`<b>${esc(tr.name||'导入的 .osb')}</b><span>${I?I.blocks.length:0} 个 sprite · ${I?I.samples.length:0} 个音效 · 原时间 ${tc(c.base||0)} – ${tc((c.base||0)+(c.end-c.start))}</span>`;box.appendChild(hd);
  box.appendChild(fxSec('时间'));
  numRow(box,{v:off},[['整体平移 ms','v',1,-600000,600000]],()=>{});
  box.lastChild.querySelector('input').addEventListener('change',e=>{const v=+e.target.value;if(!isFinite(v))return;const d=c.end-c.start;c.start=Math.round((c.base||0)+v);c.end=c.start+d;commit();});
  const p=document.createElement('p');p.className='hint';
  p.textContent=`导出时这些 sprite 一行不改地原样写回（平移时只改时间），图层和顺序跟原文件一样。`+(missing?` 有 ${missing} 张图片还没显示：${dirH?'在谱面文件夹里没找到。':'打开谱面文件夹后才能预览。'}`:'');box.appendChild(p);
  const acts=document.createElement('div');acts.className='preset';
  const b1=document.createElement('button');b1.type='button';b1.className='ghost';b1.textContent='平移归零';b1.addEventListener('click',()=>{const d=c.end-c.start;c.start=c.base||0;c.end=c.start+d;commit();});acts.appendChild(b1);
  const b2=document.createElement('button');b2.type='button';b2.className='ghost';b2.textContent='移除这个 .osb';b2.addEventListener('click',()=>{state.tracks=state.tracks.filter(t=>t.id!==c.tid);state.clips=state.clips.filter(x=>x.tid!==c.tid);sel=null;commit();toast('已移除导入的 .osb，可撤销');});acts.appendChild(b2);
  box.appendChild(acts);
}
function renderSpecFx(box,c){
  const p=c.spec,tr=state.tracks.find(x=>x.id===c.tid)||{};
  let nc=0;for(const s of gen.sprites)if(s.specId===c.id)nc+=s.cmds.length;
  const hd=document.createElement('div');hd.className='fx-h';hd.innerHTML=`<b>音频频谱</b><span>${esc(tr.name||'')} · ${LAYER_NAME[tr.layer]||''} · ${tc(c.start)} – ${tc(c.end)} · ${p.n} 条 · ${nc.toLocaleString()} 行命令</span>`;box.appendChild(hd);
  if(!pcm){const w=document.createElement('p');w.className='warnbox';w.textContent=audioName?'音频还在解码…':'还没有音频：到左边“谱面”页载入 mp3 / ogg 后，频谱才会生成。';box.appendChild(w);}
  const ch=fn=>{fn();commit();};
  const seg=document.createElement('div');seg.className='seg';
  for(const[k,n]of [['bars','条形'],['circle','圆形']]){const b=document.createElement('button');b.type='button';b.textContent=n;b.setAttribute('aria-pressed',String(p.shape===k));
    b.addEventListener('click',()=>ch(()=>{p.shape=k;if(k==='circle'&&p.y>400){p.x=320;p.y=240;p.maxH=Math.min(p.maxH,70);}if(k==='bars'&&p.y<300){p.y=440;}}));seg.appendChild(b);}
  box.appendChild(fxSec('形状'));box.appendChild(seg);
  const rowOf=list=>{const r=document.createElement('div');r.className='row';for(const[lab,key,step,mn,mx]of list){const l=document.createElement('label');l.className='f';l.textContent=lab;
    l.appendChild(numInput(p[key],step,lab,v=>{if(!isFinite(v))return;ch(()=>{p[key]=clamp(v,mn,mx);});}));r.appendChild(l);}box.appendChild(r);};
  box.appendChild(fxSec('布局'));
  rowOf([['数量','n',1,4,128],['中心 X','x',1,-200,840],[p.shape==='circle'?'圆心 Y':'底边 Y','y',1,-100,580]]);
  rowOf([p.shape==='circle'?['半径','radius',1,4,400]:['总宽','width',5,20,860],['柱宽（0=自动）','barW',0.5,0,80],['最大高度','maxH',1,4,480]]);
  if(p.shape==='bars'){const l=document.createElement('label');l.className='chk';l.innerHTML='<input type="checkbox"> 上下对称（从中线往两边长）';const i=l.querySelector('input');i.checked=!!p.mirror;i.addEventListener('change',()=>ch(()=>{p.mirror=i.checked;}));box.appendChild(l);}
  box.appendChild(fxSec('分析'));
  rowOf([['低频 Hz','fmin',10,10,2000],['高频 Hz','fmax',100,500,22000]]);
  const r3=document.createElement('div');r3.className='row';
  const dv=document.createElement('select');dv.setAttribute('aria-label','采样间隔');for(const d of [2,4,8,16]){const o=document.createElement('option');o.value=d;o.textContent=`1/${d} 拍`;dv.appendChild(o);}dv.value=String(p.div);dv.addEventListener('change',()=>ch(()=>{p.div=+dv.value;}));
  const l1=document.createElement('label');l1.className='f';l1.textContent='采样间隔';l1.appendChild(dv);r3.appendChild(l1);
  const l2=document.createElement('label');l2.className='f';l2.textContent='平滑 %';l2.appendChild(numInput(Math.round(p.smooth*100),5,'平滑',v=>{if(isFinite(v))ch(()=>{p.smooth=clamp(v,0,95)/100;});}));r3.appendChild(l2);
  const l3=document.createElement('label');l3.className='f';l3.textContent='精简阈值 %';l3.appendChild(numInput(p.tol,0.5,'精简阈值',v=>{if(isFinite(v))ch(()=>{p.tol=clamp(v,0,20);});}));r3.appendChild(l3);
  box.appendChild(r3);
  box.appendChild(fxSec('外观'));
  const r4=document.createElement('div');r4.className='row';
  colorField(r4,p,[['custom','自己的颜色'],['accent','跟随字幕配色']],()=>ch(()=>{}));
  const l6=document.createElement('label');l6.className='f';l6.textContent='不透明度 %';l6.appendChild(numInput(p.alpha,5,'不透明度',v=>{if(isFinite(v))ch(()=>{p.alpha=clamp(v,0,100);});}));r4.appendChild(l6);
  box.appendChild(r4);
  {const r5=document.createElement('div');r5.className='row';const ts=document.createElement('select');ts.setAttribute('aria-label','柱子样子');
    for(const[k,n]of SPEC_TEX){const o=document.createElement('option');o.value=k;o.textContent=n;ts.appendChild(o);}ts.value=p.tex||'solid';
    ts.addEventListener('change',()=>ch(()=>{p.tex=ts.value;if(p.tex==='custom'&&!p.texImg){const im=state.media.find(m=>!m.kind);if(im)p.texImg=im.id;}if(p.tex==='blob'&&p.n>48)p.n=32;}));
    const lt=document.createElement('label');lt.className='f';lt.textContent='柱子样子';lt.appendChild(ts);r5.appendChild(lt);
    if(p.tex==='custom'){const imgs=state.media.filter(m=>!m.kind),is=document.createElement('select');is.setAttribute('aria-label','柱子用的图片');
      if(!imgs.length){const o=document.createElement('option');o.textContent='（素材库里还没有图片）';is.appendChild(o);is.disabled=true;}
      for(const m of imgs){const o=document.createElement('option');o.value=m.id;o.textContent=m.name;is.appendChild(o);}is.value=p.texImg||'';is.addEventListener('change',()=>ch(()=>{p.texImg=is.value;}));
      const li=document.createElement('label');li.className='f';li.textContent='图片';li.appendChild(is);r5.appendChild(li);}
    box.appendChild(r5);
    const ht=document.createElement('p');ht.className='hint';ht.textContent=p.tex==='soft'?'柔光柱：边缘是软的，配加色混合像一根根光柱。':p.tex==='blob'?'光团：每一条变成一团圆形柔光，音量越大越大（「最大高度」= 最大直径）。配圆形 + 加色混合就是一圈跟着音乐呼吸的光环。':p.tex==='custom'?'图片会被拉伸成柱子的宽高，一起导出。竖长的柔边图片效果最好。':'';if(ht.textContent)box.appendChild(ht);}
  const la=document.createElement('label');la.className='chk';la.innerHTML='<input type="checkbox"> 加色混合（发光）';const ia=la.querySelector('input');ia.checked=!!p.add;ia.addEventListener('change',()=>ch(()=>{p.add=ia.checked;}));box.appendChild(la);
  box.appendChild(fxSec('快捷操作'));
  const acts=document.createElement('div');acts.className='preset';
  const act=(t,fn)=>{const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent=t;b.addEventListener('click',fn);acts.appendChild(b);};
  act('底部条形',()=>ch(()=>{Object.assign(p,{shape:'bars',x:320,y:470,width:760,maxH:110,mirror:false});}));
  act('中心圆环',()=>ch(()=>{Object.assign(p,{shape:'circle',x:320,y:240,radius:90,maxH:60});}));
  act('柔光光环',()=>ch(()=>{Object.assign(p,{shape:'circle',x:320,y:240,radius:110,n:24,maxH:70,minH:20,tex:'blob',add:true,alpha:70});}));
  act('覆盖整首',()=>ch(()=>{c.start=0;c.end=Math.round(gen.duration);}));
  act('删除片段',()=>deleteClip(c.id));
  box.appendChild(acts);
  const h=document.createElement('p');h.className='hint';h.textContent='每一条是一个 sprite，按“采样间隔”取一次频谱，用 V（宽高缩放）命令跟着音乐变化。精简阈值越大，变化小的地方越会合并成一条命令，文件更小、SB load 更低。';box.appendChild(h);
}
function renderKiaiFx(box,c){
  const q=c.kiai,tr=state.tracks.find(x=>x.id===c.tid)||{};let ns=0;for(const s of gen.sprites)if(s.kiaiId===c.id)ns++;
  const hd=document.createElement('div');hd.className='fx-h';hd.innerHTML=`<b>Kiai 特效</b><span>${esc(tr.name||'')} · ${LAYER_NAME[tr.layer]||''} · ${tc(c.start)} – ${tc(c.end)} · ${ns} 个 sprite</span>`;box.appendChild(hd);
  const ck=(t,k,sec)=>{const l=document.createElement('label');l.className='chk';l.innerHTML=`<input type="checkbox"> ${t}`;const i=l.querySelector('input');i.checked=!!q[k];i.addEventListener('change',()=>{q[k]=i.checked;commit();});(sec||box).appendChild(l);};
  const row=()=>{const r=document.createElement('div');r.className='row';box.appendChild(r);return r;};
  const lab=(r,t,el)=>{const l=document.createElement('label');l.className='f';l.textContent=t;l.appendChild(el);r.appendChild(l);};
  const sel=(opts,v,fn,aria)=>{const s=document.createElement('select');s.setAttribute('aria-label',aria);for(const[k,n]of opts){const o=document.createElement('option');o.value=k;o.textContent=n;s.appendChild(o);}s.value=String(v);s.addEventListener('change',()=>fn(s.value));return s;};
  box.appendChild(fxSec('开头全屏闪光'));ck('片段开始时全屏闪一下','flash');
  if(q.flash){const r=row();lab(r,'亮度 %',numInput(q.flashAlpha??55,5,'闪光亮度',v=>{if(isFinite(v)){q.flashAlpha=clamp(Math.round(v),0,100);commit();}}));
    lab(r,'淡出',sel([[0.5,'半拍'],[1,'1 拍'],[2,'2 拍'],[4,'4 拍'],[8,'8 拍']],q.flashBeats||2,v=>{q.flashBeats=+v;commit();},'闪光淡出时长'));}
  box.appendChild(fxSec('上下边框随拍闪'));ck('片段期间上下边框跟着节拍闪','pulse');
  if(q.pulse){const r=row();lab(r,'亮度 %',numInput(q.pulseAlpha??70,5,'边框亮度',v=>{if(isFinite(v)){q.pulseAlpha=clamp(Math.round(v),0,100);commit();}}));
    lab(r,'粗细 px',numInput(q.pulseH||6,1,'边框粗细',v=>{if(isFinite(v)&&v>0){q.pulseH=clamp(Math.round(v),1,120);commit();}}));
    lab(r,'间隔',sel([[0.5,'每半拍'],[1,'每拍'],[2,'每 2 拍'],[4,'每小节']],q.every||1,v=>{q.every=+v;commit();},'闪的间隔'));}
  box.appendChild(fxSec('颜色'));
  {const r=row();colorField(r,q,Object.entries(KIAI_COLOR),commit,{label:'边框颜色'});
    if(q.color==='custom'&&q.flash){const ci=document.createElement('input');ci.type='color';ci.value=hex(q.flashCol||q.custom);ci.setAttribute('aria-label','闪光颜色');ci.addEventListener('change',()=>{q.flashCol=unhex(ci.value);commit();});lab(r,'闪光颜色',ci);}}
  ck('加色混合（发光）','add');
  box.appendChild(fxSec('快捷操作'));
  const acts=document.createElement('div');acts.className='preset';
  const act=(t,fn)=>{const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent=t;b.addEventListener('click',fn);acts.appendChild(b);};
  act('对齐到最近的 kiai 段',()=>{const K=songSpan(gen.duration||20000).kiai;if(!K.length){toast('谱面里没有 kiai','err');return;}
    const k=K.reduce((a,b)=>Math.abs(b.s-c.start)<Math.abs(a.s-c.start)?b:a);c.start=Math.round(k.s);c.end=Math.round(k.e);commit();toast('已对齐到 '+tc(k.s)+' 那段 kiai','good');});
  act('删除片段',()=>deleteClip(c.id));box.appendChild(acts);
  const p=document.createElement('p');p.className='hint';p.textContent='片段开头闪光，片段期间边框随拍闪。可以拖动、裁剪、切开、复制到别的位置；从“新建”里点「Kiai 特效」会给每段还没有特效的 kiai 各加一段。';box.appendChild(p);
}
function renderHitFx(box,c){
  const h=c.hit,tr=state.tracks.find(x=>x.id===c.tid)||{},nEv=hitEvents(c).length,nSp=hitSpriteCount(c);
  const hd=document.createElement('div');hd.className='fx-h';hd.innerHTML=`<b>击打特效</b><span>${esc(tr.name||'')} · ${LAYER_NAME[tr.layer]||''} · ${tc(c.start)} – ${tc(c.end)} · ${nEv} 次触发 · 约 ${nSp.toLocaleString()} 个 sprite</span>`;box.appendChild(hd);
  box.appendChild(fxSec('什么时候出'));
  {const r=document.createElement('div');r.className='row';const ss=document.createElement('select');ss.setAttribute('aria-label','触发来源');
    for(const[k,n]of [['notes','每个 note 被打中时'],['beats','跟着节拍（不看 note）']]){const o=document.createElement('option');o.value=k;o.textContent=n;ss.appendChild(o);}ss.value=h.src||'notes';
    ss.addEventListener('change',()=>{h.src=ss.value;if(h.src==='beats'&&!h.types.includes('emit'))h.types=[...h.types,'emit'];commit();});
    const l=document.createElement('label');l.className='f';l.textContent='触发';l.appendChild(ss);r.appendChild(l);
    if(h.src==='beats'){const es=document.createElement('select');es.setAttribute('aria-label','间隔');for(const[v,n]of [[0.5,'每半拍'],[1,'每拍'],[2,'每 2 拍'],[4,'每小节（4 拍）']]){const o=document.createElement('option');o.value=v;o.textContent=n;es.appendChild(o);}
      es.value=String(h.every||1);es.addEventListener('change',()=>{h.every=+es.value;commit();});const l2=document.createElement('label');l2.className='f';l2.textContent='间隔';l2.appendChild(es);r.appendChild(l2);}
    box.appendChild(r);}
  box.appendChild(fxSec('效果（可以叠加多个）'));
  const chips=document.createElement('div');chips.className='chips';
  for(const[k,n]of HIT_TYPES){const b=document.createElement('button');b.type='button';b.className='chip';b.textContent=n;b.setAttribute('aria-pressed',String(h.types.includes(k)));
    b.addEventListener('click',()=>{h.types=h.types.includes(k)?h.types.filter(x=>x!==k):[...h.types,k].sort((a,b2)=>HIT_TYPES.findIndex(q=>q[0]===a)-HIT_TYPES.findIndex(q=>q[0]===b2));commit();});chips.appendChild(b);}
  box.appendChild(chips);
  box.appendChild(fxSec('参数'));
  const row=document.createElement('div');row.className='row';
  const lab=(t,el)=>{const l=document.createElement('label');l.className='f';l.textContent=t;l.appendChild(el);row.appendChild(l);return l;};
  lab('大小 %',numInput(h.size,5,'大小 %',v=>{if(isFinite(v)&&v>0){h.size=clamp(v,10,600);commit();}}));
  const ds=document.createElement('select');ds.setAttribute('aria-label','持续时间');for(const[v,n]of [[0.25,'1/4 拍'],[0.5,'1/2 拍'],[1,'1 拍'],[2,'2 拍'],[4,'4 拍']]){const o=document.createElement('option');o.value=v;o.textContent=n;ds.appendChild(o);}
  ds.value=String(h.beats);ds.addEventListener('change',()=>{h.beats=+ds.value;commit();});lab('持续',ds);
  if(h.types.includes('burst'))lab('粒子数',numInput(h.count,1,'粒子数',v=>{if(isFinite(v)){h.count=clamp(Math.round(v),2,24);commit();}}));
  if(h.types.includes('spark')){lab('火花数',numInput(h.sparkCount??32,4,'火花数',v=>{if(isFinite(v)){h.sparkCount=clamp(Math.round(v),4,80);commit();}}));
    lab('火花飞多远 px',numInput(h.sparkDist??100,10,'火花距离',v=>{if(isFinite(v)&&v>0){h.sparkDist=clamp(Math.round(v),20,400);commit();}}));}
  box.appendChild(row);
  if(h.types.includes('trail')){box.appendChild(fxSec('滑条光迹'));
    const tr2=document.createElement('div');tr2.className='row';const lb=(t,el)=>{const l=document.createElement('label');l.className='f';l.textContent=t;l.appendChild(el);tr2.appendChild(l);};
    const sl=(opts,v,fn,aria)=>{const s=document.createElement('select');s.setAttribute('aria-label',aria);for(const[k,n]of opts){const o=document.createElement('option');o.value=k;o.textContent=n;s.appendChild(o);}s.value=String(v);s.addEventListener('change',()=>{fn(s.value);commit();});return s;};
    lb('光点间隔 ms',numInput(h.trailGap??25,5,'光点间隔',v=>{if(isFinite(v)){h.trailGap=clamp(Math.round(v),10,500);commit();}}));
    lb('停留',sl([['end','到滑条结束，一起散'],[0,'不停'],[0.25,'1/4 拍'],[0.5,'半拍'],[1,'1 拍'],[2,'2 拍']],h.trailHold??'end',v=>{h.trailHold=v==='end'?'end':+v;},'停留时长'));
    lb('收尾',sl(Object.entries(TRAIL_END),h.trailEnd||'scatter',v=>{h.trailEnd=v;const d=TRAIL_MODE_DEF[v]||TRAIL_MODE_DEF.scatter;h.trailHold=d.hold;h.trailDur=d.dur;
      for(const[k,x]of[['停留时长',d.hold],['收尾时长',d.dur]]){const e=document.querySelector('#fxBody select[aria-label="'+k+'"]');if(e)e.value=String(x);}},'收尾方式'));
    if((h.trailEnd||'scatter')==='scatter')lb('每点小团数',numInput(h.trailPuffs??5,1,'每点小团数',v=>{if(isFinite(v)){h.trailPuffs=clamp(Math.round(v),1,12);commit();}}));
    lb('收尾时长',sl([[0.5,'半拍'],[1,'1 拍'],[2,'2 拍'],[4,'4 拍']],h.trailDur||2,v=>{h.trailDur=+v;},'收尾时长'));
    lb('大小 %',numInput(h.trailSize??100,5,'光点大小',v=>{if(isFinite(v)&&v>0){h.trailSize=clamp(Math.round(v),10,400);commit();}}));
    lb('不透明度 %',numInput(h.trailAlpha??50,5,'光点不透明度',v=>{if(isFinite(v)){h.trailAlpha=clamp(Math.round(v),0,100);commit();}}));
    box.appendChild(tr2);
    const hp=document.createElement('p');hp.className='hint';hp.textContent='滑条球滑过的地方每隔一段时间留一个光点，铺满整条滑条；默认等滑条结束时整条一起炸散成小团、边飞边缩小。间隔越小越连贯，sprite 也越多。只对滑条有效。';box.appendChild(hp);}
  const row2=document.createElement('div');row2.className='row';
  colorField(row2,h,Object.entries(HIT_COLOR),commit);
  box.appendChild(row2);
  box.appendChild(fxSec('触发'));
  const ck=(t,k)=>{const l=document.createElement('label');l.className='chk';l.innerHTML=`<input type="checkbox"> ${t}`;const i=l.querySelector('input');i.checked=!!h[k];i.addEventListener('change',()=>{h[k]=i.checked;commit();});box.appendChild(l);};
  ck('只在每组 combo 的第一个 note','ncOnly');{const rw=document.createElement('div');rw.className='row';
    const mkS=(lbl,aria,opts,v,fn)=>{const l=document.createElement('label');l.className='f';l.textContent=lbl;const s=document.createElement('select');s.setAttribute('aria-label',aria);
      for(const[k,n]of opts){const o=document.createElement('option');o.value=k;o.textContent=n;s.appendChild(o);}s.value=String(v);s.addEventListener('change',()=>{fn(+s.value);commit();});l.appendChild(s);rw.appendChild(l);return s;};
    mkS('只在拍子上的 note','节拍筛选',[[0,'不限'],[1,'每拍'],[2,'每 2 拍'],[4,'每 4 拍'],[8,'每 8 拍']],h.onEvery||0,v=>{h.onEvery=v;if(!v)h.onOff=0;});
    if(+h.onEvery>1)mkS('往后错开','节拍错开',Array.from({length:+h.onEvery},(_,i)=>[i,i?i+' 拍':'不错开']),h.onOff||0,v=>{h.onOff=v;});
    box.appendChild(rw);}ck('跟着滑条走（滑条上一路发光，滑条结束时再出特效）','follow');ck('滑条尾也触发','sliderEnd');ck('转盘结束时在中心触发','spinner');ck('加色混合（发光）','add');
  box.appendChild(fxSec('快捷操作'));
  const acts=document.createElement('div');acts.className='preset';
  const act=(t,fn)=>{const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent=t;b.addEventListener('click',fn);acts.appendChild(b);};
  act('只保留 kiai 段',()=>{const parts=(gen.kiai||[]).map(k=>[Math.max(k.s,c.start),Math.min(k.e,c.end)]).filter(q=>q[1]-q[0]>50);
    if(!parts.length){toast('这段里没有 kiai','err');return;}
    state.clips=state.clips.filter(x=>x!==c);let first=null;for(const[a,b]of parts){const n=JSON.parse(JSON.stringify(c));n.id=uid();n.start=Math.round(a);n.end=Math.round(b);state.clips.push(n);first=first||n;}
    sel={type:'clip',id:first.id};commit();toast(`已拆成 ${parts.length} 段，只在 kiai 里出特效`,'good');});
  act('覆盖整首',()=>{const O=map.objs||[];if(!O.length)return;const last=O[O.length-1];c.start=Math.max(0,Math.round(O[0].t-50));c.end=Math.round((last.endT||last.t)+50);commit();});
  act('删除片段',()=>deleteClip(c.id));
  box.appendChild(acts);
  const p=document.createElement('p');p.className='hint';p.textContent='片段覆盖到的 note 被打中时出特效。像图片片段一样拖动、裁剪，或用剃刀切开，只留想要的几段。打开画面上方的“显示 note”可以对照位置。sprite 太多会让 SB load 变高，可以在导出页看估算。';box.appendChild(p);
}
