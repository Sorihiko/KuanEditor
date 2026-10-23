/* 效果控件：图片片段的属性与关键帧 */
function renderClipFx(box,c){
  const m=state.media.find(x=>x.id===c.mid),tr=state.tracks.find(x=>x.id===c.tid);
  const h=document.createElement('div');h.className='fx-h';h.innerHTML=`<b>${esc(m?m.name:'丢失的素材')}</b><span>${esc(tr?tr.name:'')} · ${LAYER_NAME[tr?tr.layer:'Foreground']} · ${tc(c.start)} – ${tc(c.end)}（${((c.end-c.start)/1000).toFixed(2)} 秒）</span>`;box.appendChild(h);
  box.appendChild(fxSec('运动'));
  for(const k of ['p','s'])box.appendChild(propRow(c,k));
  const nu=document.createElement('label');nu.className='chk';nu.innerHTML='<input type="checkbox"> 分别设置宽和高';const nuI=nu.querySelector('input');nuI.checked=!!c.nonuni;
  nuI.addEventListener('change',()=>{c.nonuni=nuI.checked;if(!c.nonuni)c.props.v={v:[100,100],kf:null};commit();});box.appendChild(nu);
  if(c.nonuni)box.appendChild(propRow(c,'v'));
  box.appendChild(propRow(c,'r'));
  {box.appendChild(fxSec('镜头晃动'));const w=c.sway;
    const lw=document.createElement('label');lw.className='chk';lw.innerHTML='<input type="checkbox"> 像手持镜头一样慢慢晃（适合背景图）';const iw=lw.querySelector('input');iw.checked=!!(w&&w.on);
    iw.addEventListener('change',()=>{if(iw.checked)c.sway=Object.assign(SWAY_DEF(),c.sway||{},{on:true});else if(c.sway)c.sway.on=false;commit();});box.appendChild(lw);
    if(w&&w.on){numRow(box,w,[['幅度 px','amp',1,0,200],['倾斜 °','rot',0.1,0,45],['放大 %','zoom',1,0,50]],commit);
      const r=document.createElement('div');r.className='row';const bs=document.createElement('select');bs.setAttribute('aria-label','多久晃一次');
      for(const[v,n]of [[1,'每拍'],[2,'每 2 拍'],[4,'每 4 拍'],[8,'每 8 拍'],[16,'每 16 拍']]){const o=document.createElement('option');o.value=v;o.textContent=n;bs.appendChild(o);}bs.value=String(w.beats||4);
      bs.addEventListener('change',()=>{w.beats=+bs.value;commit();});const lb=document.createElement('label');lb.className='f';lb.textContent='多久晃一次';lb.appendChild(bs);r.appendChild(lb);box.appendChild(r);
      const ok=swayable(c),hn=document.createElement('p');hn.className='hint';
      hn.textContent='每隔几拍随机挪到一个新位置、转一点点角度，缓入缓出。「放大」让图片稍微大一点，晃的时候不会露出边。'+(!ok.p||!ok.r||!ok.s?`（${[!ok.p&&'位置',!ok.r&&'旋转',!ok.s&&'缩放'].filter(Boolean).join('、')}有关键帧，那一项不参与晃动）`:'');box.appendChild(hn);}}
  box.appendChild(fxSec('不透明度与颜色'));box.appendChild(propRow(c,'a'));box.appendChild(propRow(c,'c'));
  box.appendChild(fxSec('原点与混合'));
  const og=document.createElement('label');og.className='f';og.textContent='原点（缩放和旋转围绕这里）';const os=document.createElement('select');
  for(const k of Object.keys(ORIGINS)){const o=document.createElement('option');o.value=k;o.textContent=`${ORIGIN_NAME[k]}（${k}）`;os.appendChild(o);}os.value=c.origin||'Centre';
  os.addEventListener('change',()=>{c.origin=os.value;commit();});og.appendChild(os);box.appendChild(og);
  const ck=(lab,key)=>{const l=document.createElement('label');l.className='chk';l.innerHTML=`<input type="checkbox"> ${lab}`;const i=l.querySelector('input');i.checked=!!c[key];i.addEventListener('change',()=>{c[key]=i.checked;commit();});box.appendChild(l);};
  ck('加色混合（发光叠加）','add');ck('水平翻转','fh');ck('垂直翻转','fv');
  if(m&&m.kind==='anim'){box.appendChild(fxSec('帧动画'));const a=c.anim||(c.anim={delay:m.delay||83,loop:m.loop||'LoopForever'});
    const r=document.createElement('div');r.className='row';
    const l1=document.createElement('label');l1.className='f';l1.textContent='每帧 ms';l1.appendChild(numInput(a.delay,1,'每帧毫秒',v=>{if(isFinite(v)&&v>0){a.delay=Math.round(v);commit();}}));r.appendChild(l1);
    const l2=document.createElement('label');l2.className='f';l2.textContent='帧率 fps';l2.appendChild(numInput(+(1000/a.delay).toFixed(2),1,'帧率',v=>{if(isFinite(v)&&v>0){a.delay=Math.max(1,Math.round(1000/v));commit();}}));r.appendChild(l2);
    const ls=document.createElement('select');ls.setAttribute('aria-label','循环方式');for(const[k,n]of [['LoopForever','一直循环'],['LoopOnce','播放一次后停在最后一帧']]){const o=document.createElement('option');o.value=k;o.textContent=n;ls.appendChild(o);}ls.value=a.loop;
    ls.addEventListener('change',()=>{a.loop=ls.value;commit();});const l3=document.createElement('label');l3.className='f';l3.textContent='播放';l3.appendChild(ls);r.appendChild(l3);box.appendChild(r);
    const pr2=document.createElement('div');pr2.className='preset';
    for(const[lab,beats]of [['一拍放完一轮',1],['两拍放完一轮',2],['一小节放完一轮',4]]){const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent=lab;b.addEventListener('click',()=>{a.delay=Math.max(1,Math.round(beatAt(c.start)*beats/m.frames));commit();});pr2.appendChild(b);}
    box.appendChild(pr2);}
  box.appendChild(fxSec('播放方式'));
  const mseg=document.createElement('div');mseg.className='seg';const mode=c.mode||'normal';
  for(const[k,n]of [['normal','普通'],['loop','循环 (L)'],['trigger','触发 (T)']]){const b=document.createElement('button');b.type='button';b.textContent=n;b.setAttribute('aria-pressed',String(mode===k));b.addEventListener('click',()=>{c.mode=k;commit();});mseg.appendChild(b);}
  box.appendChild(mseg);
  const kfLen=Math.max(0,...['p','s','v','r','a','c'].filter(k=>k!=='v'||c.nonuni).map(k=>{const K=c.props[k].kf;return K&&K.length>1?K[K.length-1].t:0;}));
  const mh=document.createElement('p');mh.className='hint';
  if(mode==='loop')mh.textContent=kfLen?`从片段开头到最后一个关键帧（${(kfLen/1000).toFixed(2)} 秒）这段动画，会重复 ${Math.max(1,Math.floor((c.end-c.start)/kfLen))} 次直到片段结束。导出成一个 L 循环，命令比一条条写少很多。`:'先给某个属性打至少两个关键帧，这段动画才会循环。';
  else if(mode==='trigger'){mh.textContent=kfLen?`片段时间内，每次触发都会从头播放一遍关键帧动画（${(kfLen/1000).toFixed(2)} 秒）。导出成 T 触发组。预览里按谱面 note 的音效来触发；“通过 / 失败”在预览里不会触发。`:'先给某个属性打至少两个关键帧，作为每次触发时播放的动画。';
    const r=document.createElement('div');r.className='row';const ts=document.createElement('select');ts.setAttribute('aria-label','触发条件');
    for(const[k,n]of TRIGGERS){const o=document.createElement('option');o.value=k;o.textContent=n;ts.appendChild(o);}ts.value=c.trig||'HitSound';ts.addEventListener('change',()=>{c.trig=ts.value;commit();});
    const l=document.createElement('label');l.className='f';l.textContent='触发条件';l.appendChild(ts);r.appendChild(l);box.appendChild(r);
    const hl=document.createElement('label');hl.className='chk';hl.innerHTML='<input type="checkbox"> 没触发时隐藏';const hi=hl.querySelector('input');hi.checked=c.trigHide!==false;hi.addEventListener('change',()=>{c.trigHide=hi.checked;commit();});box.appendChild(hl);
    const fires=(()=>{const T={name:c.trig||'HitSound',start:c.start,end:c.end};return triggerFires(T).length;})();mh.textContent+=` 这段里会触发约 ${fires} 次。`;}
  else mh.textContent='普通：关键帧动画只播放一遍。循环 / 触发会把关键帧动画打包成 osu 的 L / T 命令组。';
  box.appendChild(mh);
  box.appendChild(fxSec('快捷操作'));
  const acts=document.createElement('div');acts.className='preset';
  const act=(lab,fn)=>{const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent=lab;b.addEventListener('click',fn);acts.appendChild(b);};
  const mm=mediaReady(c.mid);
  act('适应画面高度',()=>{if(!mm)return;c.props.s={v:[+(480/mm.h*100).toFixed(2)],kf:null};c.props.p={v:[320,240],kf:null};c.origin='Centre';c.nonuni=false;commit();});
  act('铺满宽屏',()=>{if(!mm)return;c.props.s={v:[+(Math.max(854/mm.w,480/mm.h)*100).toFixed(2)],kf:null};c.props.p={v:[320,240],kf:null};c.origin='Centre';c.nonuni=false;commit();});
  act('删除片段',()=>deleteClip(c.id));
  box.appendChild(acts);
  const p=document.createElement('p');p.className='hint';p.textContent='点秒表开启关键帧：之后在不同时间改数值会自动加关键帧，菱形按钮可以手动增删。两帧之间的缓动在下拉框里选，导出时会换成对应的 SB 命令。';box.appendChild(p);
  updateFxValues(true);
}
function propRow(c,k){
  const P=PROP[k],pr=c.props[k],wrap=document.createElement('div');
  const row=document.createElement('div');row.className='prow';
  const sw=document.createElement('button');sw.type='button';sw.className='ib';sw.innerHTML=SVG.sw;sw.title='切换动画（关键帧）';sw.setAttribute('aria-label',P.name+' 关键帧开关');sw.setAttribute('aria-pressed',String(!!pr.kf));
  sw.addEventListener('click',()=>{const t=now();if(pr.kf){pr.v=propAt(c,k,t);pr.kf=null;}else{pr.kf=[{t:relT(c,t),v:pr.v.slice(),e:0}];}commit();});
  const pn=document.createElement('span');pn.className='pn';pn.textContent=P.name;pn.title='左右拖动可以调整数值';
  const vals=document.createElement('div');vals.className='vals';const inputs=[];
  const commitVal=v=>{setProp(c,k,v,now());commit();};
  if(k==='c'){const i=document.createElement('input');i.type='color';i.setAttribute('aria-label',P.name);i.addEventListener('change',()=>commitVal(unhex(i.value)));vals.appendChild(i);inputs.push(i);}
  else P.dims.forEach((d,j)=>{const i=document.createElement('input');i.type='number';i.step=String(P.step);if(P.min!=null)i.min=P.min;if(P.max!=null)i.max=P.max;i.setAttribute('aria-label',`${P.name} ${d}`);i.title=d;
    i.addEventListener('change',()=>{const cur=propAt(c,k,now()).slice();cur[j]=+i.value;if(isFinite(cur[j]))commitVal(cur);});vals.appendChild(i);inputs.push(i);});
  const nav=document.createElement('div');nav.className='kfn';
  const mk=(html,lab,fn,cls)=>{const b=document.createElement('button');b.type='button';b.className='ib'+(cls?' '+cls:'');b.innerHTML=html;b.title=lab;b.setAttribute('aria-label',lab);b.addEventListener('click',fn);nav.appendChild(b);return b;};
  const prev=mk(SVG.prev,'上一个关键帧',()=>{const t=relT(c,now()),q=[...(pr.kf||[])].reverse().find(x=>x.t<t-4);if(q)seek(c.start+q.t);});
  const kfb=mk(SVG.kf,'在播放头添加 / 删除关键帧',()=>{const t=relT(c,now());if(!pr.kf){pr.kf=[{t,v:pr.v.slice(),e:0}];commit();return;}const f=kfAt(pr,t);
    if(f){pr.kf=pr.kf.filter(q=>q!==f);if(!pr.kf.length){pr.v=f.v;pr.kf=null;}}else{const left=[...pr.kf].reverse().find(q=>q.t<t);pr.kf.push({t,v:kfVal(pr,t).slice(),e:left?left.e:0});pr.kf.sort((a,b)=>a.t-b.t);}commit();},'kf');
  const next=mk(SVG.next,'下一个关键帧',()=>{const t=relT(c,now()),q=(pr.kf||[]).find(x=>x.t>t+4);if(q)seek(c.start+q.t);});
  row.append(sw,pn,vals,nav);wrap.appendChild(row);
  let er=null,es=null;
  if(pr.kf){er=document.createElement('div');er.className='erow';er.innerHTML='<span></span><span title="作用在播放头所在、或刚到达播放头的那一段">缓动</span>';es=document.createElement('select');es.setAttribute('aria-label',P.name+' 缓动');
    for(const[id,n]of EASES){const o=document.createElement('option');o.value=id;o.textContent=n;es.appendChild(o);}
    es.addEventListener('change',()=>{const q=easeKf(pr,relT(c,now()));if(q){q.e=+es.value;commit();}});er.appendChild(es);wrap.appendChild(er);}
  /* scrubby label */
  pn.addEventListener('pointerdown',e=>{if(k==='c')return;pn.setPointerCapture(e.pointerId);const v0=propAt(c,k,now()).slice(),x0=e.clientX;let moved=false;
    const mv=ev=>{const d=(ev.clientX-x0)*(ev.shiftKey?10:1)*P.step*(k==='s'||k==='v'?0.5:1);if(Math.abs(ev.clientX-x0)>2)moved=true;const v=v0.slice();v[0]=+(v0[0]+d).toFixed(P.dec||0);if(k==='v'||k==='p'){if(ev.altKey){v[0]=v0[0];v[1]=+(v0[1]+d).toFixed(P.dec||0);}}
      if(P.min!=null)v[0]=Math.max(P.min,v[0]);if(P.max!=null)v[0]=Math.min(P.max,v[0]);setProp(c,k,v,now());rebuild();updateFxValues(true);};
    const up=()=>{pn.removeEventListener('pointermove',mv);pn.removeEventListener('pointerup',up);if(moved)commit();};
    pn.addEventListener('pointermove',mv);pn.addEventListener('pointerup',up);});
  fxRows.push({c,k,inputs,kfb,prev,next,es});
  return wrap;
}
/* the keyframe whose outgoing ease shapes the motion arriving at (or passing through) the playhead */
function easeKf(pr,tr){if(!pr.kf||!pr.kf.length)return null;return[...pr.kf].reverse().find(x=>x.t<tr-4)||pr.kf[0];}
let fxLastT=-1;
function updateFxValues(force){
  const t=now();if(!force&&Math.abs(t-fxLastT)<1)return;fxLastT=t;
  for(const R of fxRows){const{c,k,inputs}=R,pr=c.props[k];if(!pr)continue;const v=propAt(c,k,t),P=PROP[k];
    if(k==='c'){if(document.activeElement!==inputs[0])inputs[0].value=hex(v);}
    else inputs.forEach((i,j)=>{if(document.activeElement!==i)i.value=String(+(+v[j]).toFixed(P.dec||0));});
    const tr=relT(c,t),f=kfAt(pr,tr);R.kfb.setAttribute('aria-pressed',String(!!f));
    R.prev.disabled=!(pr.kf&&pr.kf.some(q=>q.t<tr-4));R.next.disabled=!(pr.kf&&pr.kf.some(q=>q.t>tr+4));
    if(R.es&&pr.kf&&document.activeElement!==R.es){const q=easeKf(pr,tr);R.es.value=String(q?q.e||0:0);}}
}

