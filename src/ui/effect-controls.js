/* 效果控件面板框架、歌词位置、音效 */
/* ---------- effect controls ---------- */
const SVG={sw:'<svg viewBox="0 0 16 16"><circle cx="8" cy="9" r="5.2"/><path d="M8 9V6.4M6.6 2.2h2.8M12.2 4.6l1-1"/></svg>',kf:'<svg viewBox="0 0 16 16"><path d="M8 2.5l5.5 5.5L8 13.5 2.5 8z"/></svg>',
  prev:'<svg viewBox="0 0 16 16"><path d="M10 3.5L5.5 8 10 12.5"/></svg>',next:'<svg viewBox="0 0 16 16"><path d="M6 3.5L10.5 8 6 12.5"/></svg>'};
/* colour row used by every effect: mode select + a picker that is always there; picking a colour switches to the effect's own colour */
function colorField(row,o,modes,done,opt={}){
  const lab=(t,el)=>{const l=document.createElement('label');l.className='f';l.textContent=t;l.appendChild(el);row.appendChild(l);};
  const pal=palOf(state),eff=()=>o.color==='custom'&&o.custom?o.custom:pal.accent;
  const s=document.createElement('select');s.setAttribute('aria-label',opt.label||'颜色');for(const[k,n]of modes){const op=document.createElement('option');op.value=k;op.textContent=n;s.appendChild(op);}
  s.value=o.color;s.addEventListener('change',()=>{if(s.value==='custom'&&!o.custom)o.custom=eff().slice();o.color=s.value;done();});lab(opt.label||'颜色',s);
  const ci=document.createElement('input');ci.type='color';ci.value=hex(eff());ci.setAttribute('aria-label',(opt.label||'颜色')+'色值');
  ci.addEventListener('change',()=>{o.custom=unhex(ci.value);o.color='custom';done();});
  const l=document.createElement('label');l.className='f';l.textContent='色值';l.appendChild(ci);row.appendChild(l);}
const hex=v=>'#'+v.map(x=>clamp(Math.round(x),0,255).toString(16).padStart(2,'0')).join('');
const unhex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
let fxRows=[];
function numInput(val,step,label,onChange){const i=document.createElement('input');i.type='number';i.step=String(step);i.value=val;i.setAttribute('aria-label',label);i.addEventListener('change',()=>onChange(+i.value));return i;}
function fxSec(title){const d=document.createElement('div');d.className='fx-sec';d.textContent=title;return d;}
function renderFx(){renderFx0();syncStyle();}
function renderFx0(){
  const box=$('#fxBody');if(box.contains(document.activeElement)&&document.activeElement.tagName==='INPUT'&&document.activeElement.type!=='checkbox')return;
  box.innerHTML='';fxRows=[];
  const c=selClip();
  if(c&&c.kind==='hit')return renderHitFx(box,c);
  if(c&&c.kind==='kiai')return renderKiaiFx(box,c);
  if(c&&c.kind==='spec')return renderSpecFx(box,c);
  if(c&&c.kind==='part')return renderPartFx(box,c);
  if(c&&c.kind==='snd')return renderSndFx(box,c);
  if(c&&c.kind==='imp')return renderImpFx(box,c);
  if(c&&c.kind==='text')return renderTextFx(box,c);
  if(c&&c.kind==='trans')return renderTransFx(box,c);
  if(c)return renderClipFx(box,c);
  if(sel&&sel.type==='line'){const L=gen.lines.find(l=>l.src.key===sel.key);if(L)renderLineFx(box,L);else sel=null;}
  if(!sel){const h=document.createElement('div');h.className='fx-h';h.innerHTML='<b>未选择片段</b><span>在时间轴或画面里点一张图片或一句歌词</span>';box.appendChild(h);}
  renderGlobalLyr(box);
}
function renderGlobalLyr(box){
  box.appendChild(fxSec('歌词整体位置'));
  const pr=document.createElement('div');pr.className='preset';
  for(const[n,y]of [['顶部',110],['居中',240],['底部',375]]){const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent=n;b.addEventListener('click',()=>{state.lyr.y=y;state.lyr.x=320;commit();});pr.appendChild(b);}
  box.appendChild(pr);
  const row=document.createElement('div');row.className='row';
  const f=(lab,key,step)=>{const l=document.createElement('label');l.className='f';l.textContent=lab;l.appendChild(numInput(state.lyr[key],step,lab,v=>{if(isFinite(v)){state.lyr[key]=v;commit();}}));row.appendChild(l);};
  f('中心 X','x',1);f('中心 Y','y',1);f('缩放 %','s',1);box.appendChild(row);
  const p=document.createElement('p');p.className='hint';p.textContent='整体位置以画面中心 (320, 240) 为基准移动和缩放所有歌词；单独一句可以在画面里直接拖。';box.appendChild(p);
}
function renderLineFx(box,L){
  const n=selKeys().length;
  const h=document.createElement('div');h.className='fx-h';h.innerHTML=`<b>歌词「${esc(lineText(L))}」</b><span>${tc(L.S)} – ${tc(L.E)} · ${STYLE_NAME[L.style]||''}${n>1?` · 共选中 ${n} 句`:''}</span>`;box.appendChild(h);
  box.appendChild(fxSec('样式'));
  const ef=lineStyleOf(L.src.key),pal=palOf(ef);
  const sr=document.createElement('div');sr.className='stylesum';
  sr.innerHTML=`<span>${ef.style==='mix'?'混合 → '+(STYLE_NAME[L.style]||''):STYLE_NAME[ef.style]||''} · ${esc(pal.name)} · ${esc($('#font').querySelector(`option[value="${ef.font}"]`).textContent.split(/（| \(/)[0])} · ${ef.size}px</span>${L.custom?'<em>单独设置</em>':'<em class="g">跟随全部</em>'}`;
  const eb=document.createElement('button');eb.type='button';eb.className='ghost';eb.textContent=n>1?`改选中 ${n} 句的样式 →`:'改这一句的样式 →';eb.addEventListener('click',()=>showTab($('#tab-style')));sr.appendChild(eb);box.appendChild(sr);
  box.appendChild(fxSec(n>1?'位置（只改当前这句）':'这一句的位置'));
  const lt=Object.assign({dx:0,dy:0,s:100},state.lineTf[L.src.key]||{});
  const row=document.createElement('div');row.className='row';
  const f=(lab,key)=>{const l=document.createElement('label');l.className='f';l.textContent=lab;l.appendChild(numInput(lt[key],1,lab,v=>{if(!isFinite(v))return;const o=Object.assign({dx:0,dy:0,s:100},state.lineTf[L.src.key]||{});o[key]=v;state.lineTf[L.src.key]=o;commit();}));row.appendChild(l);};
  f('偏移 X','dx');f('偏移 Y','dy');f('缩放 %','s');box.appendChild(row);
  const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent='重置这一句的位置';b.addEventListener('click',()=>{delete state.lineTf[L.src.key];commit();});box.appendChild(b);
  const p=document.createElement('p');p.className='hint';p.textContent='在画面里拖动这一句可以移动，拖角上的方块可以缩放；按住 Shift 只沿一个方向移动。Ctrl 点击可以多选，Shift 点击选一段。';box.appendChild(p);
  if(n===1){box.appendChild(fxSec('逐字时间'));const K=charTicks(L);
    const st=document.createElement('p');st.className='hint';st.textContent=(K.own?'这一句自带逐字时间。':state.charMode==='note'&&L.charTimes?'这一句没有自带逐字时间，现在每个字跟着 note 出现。':'这一句没有自带逐字时间，现在是自动平均分配的。')+
      '时间轴上这句下面的每个小刻度就是一个字：拖动改它出现的时间（会吸附 note、拍子；按住 Shift 只吸播放头），点一下跳过去。改过之后会写进歌词（<分:秒> 标签）。';box.appendChild(st);
    const acts=document.createElement('div');acts.className='preset';
    const tb=document.createElement('button');tb.type='button';tb.className='ghost';tb.textContent=tapState&&tapState.key===L.src.key?'打点中…（Esc 取消）':'跟着音乐打点（按 J）';
    tb.addEventListener('click',()=>{if(tapState)endTap(false);else startTap(L);});acts.appendChild(tb);
    if(K.own){const cb=document.createElement('button');cb.type='button';cb.className='ghost';cb.textContent='清除这一句的逐字时间';cb.addEventListener('click',()=>{if(clearLineCharTimes(L)){renderFiles();regenerate();toast('已清除，这一句的字回到自动时间');}});acts.appendChild(cb);}
    box.appendChild(acts);}
}
/* generic numeric row for effect panels */
function numRow(box,obj,list,after){const r=document.createElement('div');r.className='row';
  for(const[lab,key,step,mn,mx,scale]of list){const l=document.createElement('label');l.className='f';l.textContent=lab;const k=scale||1;
    l.appendChild(numInput(+(obj[key]*k).toFixed(3),step,lab,v=>{if(!isFinite(v))return;obj[key]=clamp(v/k,mn,mx);after();}));r.appendChild(l);}box.appendChild(r);}
function renderSndFx(box,c){
  const m=state.media.find(x=>x.id===c.mid),tr=state.tracks.find(x=>x.id===c.tid)||{};
  const hd=document.createElement('div');hd.className='fx-h';hd.innerHTML=`<b>♪ ${esc(m?m.name:'丢失的音效')}</b><span>${esc(tr.name||'')} · ${tc(c.start)} 开始 · ${((m&&m.dur||0)/1000).toFixed(2)} 秒 · 导出为 ${esc(m?m.file:'')}</span>`;box.appendChild(hd);
  numRow(box,c,[['音量 %','vol',5,0,100]],()=>commit());
  const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent='试听';b.addEventListener('click',()=>playSfx(c,0));box.appendChild(b);
  const p=document.createElement('p');p.className='hint';p.textContent='音效轨道的图层决定在什么状态下播放：背景/前景 = 一直播，失败 = 只在失败状态，通过 = 只在通过状态（叠加按前景处理）。音效不能裁剪，只能拖动开始时间。';box.appendChild(p);
}
