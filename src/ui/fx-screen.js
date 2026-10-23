/* 效果控件：文字、转场 */
function fxHead(box,title,c,extra){const tr=state.tracks.find(x=>x.id===c.tid)||{};let ns=0;for(const s of gen.sprites)if(s.textId===c.id||s.fxId===c.id)ns++;
  const hd=document.createElement('div');hd.className='fx-h';hd.innerHTML=`<b>${esc(title)}</b><span>${esc(tr.name||'')} · ${LAYER_NAME[tr.layer]||''} · ${tc(c.start)} – ${tc(c.end)}（${((c.end-c.start)/1000).toFixed(2)} 秒）· ${ns} 个 sprite${extra?' · '+extra:''}</span>`;box.appendChild(hd);}
function fxSelect(row,label,opts,val,fn){const l=document.createElement('label');l.className='f';l.textContent=label;const s=document.createElement('select');s.setAttribute('aria-label',label);
  for(const[k,n]of opts){const o=document.createElement('option');o.value=k;o.textContent=n;s.appendChild(o);}s.value=String(val);s.addEventListener('change',()=>fn(s.value));l.appendChild(s);row.appendChild(l);return s;}
function fxColor(row,label,val,fn){const l=document.createElement('label');l.className='f';l.textContent=label;const ci=document.createElement('input');ci.type='color';ci.value=hex(val||[255,255,255]);ci.setAttribute('aria-label',label);
  ci.addEventListener('change',()=>fn(unhex(ci.value)));l.appendChild(ci);row.appendChild(l);}
function fxCheck(box,label,on,fn){const l=document.createElement('label');l.className='chk';l.innerHTML='<input type="checkbox"> '+label;const i=l.querySelector('input');i.checked=!!on;i.addEventListener('change',()=>fn(i.checked));box.appendChild(l);}
function fxActs(box,list){box.appendChild(fxSec('快捷操作'));const a=document.createElement('div');a.className='preset';for(const[t,fn]of list){const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent=t;b.addEventListener('click',fn);a.appendChild(b);}box.appendChild(a);}
const fxHint=(box,t)=>{const p=document.createElement('p');p.className='hint';p.textContent=t;box.appendChild(p);};
const BEAT_OPTS=[[0,'不要'],[0.25,'1/4 拍'],[0.5,'半拍'],[1,'1 拍'],[2,'2 拍'],[4,'4 拍']];

/* ---------- 文字 ---------- */
function renderTextFx(box,c){
  const q=c.text;fxHead(box,'文字',c);
  box.appendChild(fxSec('内容'));
  const ta=document.createElement('textarea');ta.rows=2;ta.value=q.text;ta.setAttribute('aria-label','文字内容');ta.style.width='100%';
  ta.addEventListener('change',()=>{q.text=ta.value.replace(/\r?\n/g,'/');commit();});box.appendChild(ta);
  fxHint(box,'用 / 或回车换行；用 *星号* 包起来的字用强调色。描边、阴影、发光、渐变跟随「字幕样式」，在那里改。');
  box.appendChild(fxSec('字体与位置'));
  const r1=document.createElement('div');r1.className='row';
  fxSelect(r1,'字体',[...$('#font').options].map(o=>[o.value,o.textContent.split(/（| \(/)[0]]),q.font,v=>{q.font=v;commit();});box.appendChild(r1);
  numRow(box,q,[['字号','size',1,6,300],['字间距 %','track',1,-30,200],['旋转 °','rot',1,-180,180]],commit);
  numRow(box,q,[['中心 X','x',1,-200,840],['中心 Y','y',1,-100,580],['不透明度 %','alpha',5,0,100]],commit);
  const r2=document.createElement('div');r2.className='row';colorField(r2,q,Object.entries(TEXT_COLOR),commit);box.appendChild(r2);
  box.appendChild(fxSec('进场与退场'));
  const r3=document.createElement('div');r3.className='row';
  fxSelect(r3,'进场',Object.entries(TEXT_IN),q.inAnim,v=>{q.inAnim=v;commit();});fxSelect(r3,'用时',BEAT_OPTS.slice(1),q.inBeats,v=>{q.inBeats=+v;commit();});box.appendChild(r3);
  const r4=document.createElement('div');r4.className='row';
  fxSelect(r4,'退场',Object.entries(TEXT_OUT),q.outAnim,v=>{q.outAnim=v;commit();});fxSelect(r4,'用时',BEAT_OPTS.slice(1),q.outBeats,v=>{q.outBeats=+v;commit();});box.appendChild(r4);
  fxCheck(box,'进场时闪一下颜色',q.flash,v=>{q.flash=v;commit();});
  if(q.flash){const r=document.createElement('div');r.className='row';fxColor(r,'闪光颜色',q.flashCol,v=>{q.flashCol=v;commit();});box.appendChild(r);}
  box.appendChild(fxSec('底卡'));
  fxCheck(box,'文字后面垫一张斜放的色卡（名牌、标题用）',q.card,v=>{q.card=v;commit();});
  if(q.card){const r=document.createElement('div');r.className='row';fxColor(r,'卡片颜色',q.cardCol,v=>{q.cardCol=v;commit();});box.appendChild(r);
    numRow(box,q,[['卡片不透明度 %','cardAlpha',5,0,100],['额外倾斜 °','cardTilt',1,-45,45],['留边 px','cardPad',1,0,200]],commit);}
  fxCheck(box,'加色混合（发光）',q.add,v=>{q.add=v;commit();});
  fxActs(box,[['名牌样式',()=>{Object.assign(q,{card:true,cardTilt:-6,cardAlpha:85,inAnim:'left',outAnim:'fade',flash:true,size:Math.min(q.size,32),x:180,y:400});commit();}],
    ['大标题样式',()=>{Object.assign(q,{card:false,inAnim:'pop',outAnim:'zoom',size:64,x:320,y:240,rot:0});commit();}],
    ['跟着这一句',()=>{const L=gen.lines.find(l=>now()>=l.S&&now()<l.E);if(!L){toast('播放头这里没有歌词','err');return;}c.start=Math.round(L.S);c.end=Math.round(L.E);commit();}],
    ['删除片段',()=>deleteClip(c.id)]]);
  fxHint(box,'每个字是一个 sprite（和歌词共用字形图片）。在画面里点中文字可以直接拖动位置，拖角上的方块改字号。');
}

/* ---------- 转场 ---------- */
function renderTransFx(box,c){
  const q=c.trans;fxHead(box,'转场',c);
  box.appendChild(fxSec('样式'));
  const r1=document.createElement('div');r1.className='row';fxSelect(r1,'类型',Object.entries(TRANS_TYPE),q.type,v=>{q.type=v;if(v==='flash'&&q.custom.join()==='0,0,0')q.custom=[255,255,255];commit();});box.appendChild(r1);
  if(q.type==='wipe'){const r=document.createElement('div');r.className='row';fxSelect(r,'方向',Object.entries(TRANS_DIR),q.dir,v=>{q.dir=v;commit();});fxSelect(r,'做法',Object.entries(TRANS_MODE),q.mode,v=>{q.mode=v;commit();});box.appendChild(r);}
  const r2=document.createElement('div');r2.className='row';colorField(r2,q,[['custom','自己的颜色'],['accent','跟随字幕配色']],commit);
  const la=document.createElement('label');la.className='f';la.textContent='不透明度 %';la.appendChild(numInput(q.alpha,5,'不透明度',v=>{if(isFinite(v)){q.alpha=clamp(v,0,100);commit();}}));r2.appendChild(la);box.appendChild(r2);
  fxCheck(box,'加色混合（发光，闪白时好看）',q.add,v=>{q.add=v;commit();});
  const b=beatAt(c.start);
  fxActs(box,[['长度 1/2 拍',()=>{c.end=Math.round(c.start+b/2);commit();}],['1 拍',()=>{c.end=Math.round(c.start+b);commit();}],['2 拍',()=>{c.end=Math.round(c.start+2*b);commit();}],
    ['黑幕从上往下',()=>{Object.assign(q,{type:'wipe',dir:'down',mode:'cover',color:'custom',custom:[0,0,0],alpha:100,add:false});commit();}],
    ['闪白',()=>{Object.assign(q,{type:'flash',color:'custom',custom:[255,255,255],alpha:80,add:true});commit();}],['删除片段',()=>deleteClip(c.id)]]);
  fxHint(box,'片段多长，转场就用多长时间。「盖上」在片段结束时整屏都是这个颜色——把它放在段落结尾，下一段从片段结束开始；「揭开」反过来放在段落开头。');
}

