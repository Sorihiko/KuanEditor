/* 效果控件：粒子 */
function renderPartFx(box,c){
  const p=c.part,tr=state.tracks.find(x=>x.id===c.tid)||{},after=()=>{p.preset='custom';commit();};
  let nc=0,ns=0;for(const s of gen.sprites)if(s.partId===c.id){ns++;nc+=s.cmds.length+s.loops.reduce((a,L)=>a+1+L.cmds.length,0);}
  const hd=document.createElement('div');hd.className='fx-h';hd.innerHTML=`<b>粒子</b><span>${esc(tr.name||'')} · ${LAYER_NAME[tr.layer]||''} · ${tc(c.start)} – ${tc(c.end)} · ${ns} 个 sprite · ${nc} 行命令</span>`;box.appendChild(hd);
  box.appendChild(fxSec('预设'));const pr=document.createElement('div');pr.className='preset';
  for(const k in PART_PRESETS){const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent=PART_PRESETS[k][0];b.setAttribute('aria-pressed',String(p.preset===k));
    b.addEventListener('click',()=>{const keep={img:p.img,texImg:p.texImg};delete p.align;delete p.randRot;Object.assign(p,PART_DEF(),JSON.parse(JSON.stringify(PART_PRESETS[k][1])),keep,{preset:k});ownColors(p,[['custom','accent']]);
      if(p.shape==='image'&&!p.img){const im=state.media.find(m=>!m.kind);if(!im){toast('先在素材库导入一张图片','err');}else p.img=im.id;}commit();});pr.appendChild(b);}box.appendChild(pr);
  box.appendChild(fxSec('外观'));
  const r0=document.createElement('div');r0.className='row';
  const ts=document.createElement('select');ts.setAttribute('aria-label','粒子图案');for(const[k,n]of PART_TEX){const o=document.createElement('option');o.value=k;o.textContent=n;ts.appendChild(o);}ts.value=p.tex;ts.addEventListener('change',()=>{p.tex=ts.value;if(p.tex==='custom'&&!p.texImg){const im=state.media.find(m=>!m.kind);if(im)p.texImg=im.id;if(p.color==='custom'&&p.custom.join()!=='255,255,255')p.custom=[255,255,255];if(p.size<24)p.size=28;}after();});
  const l0=document.createElement('label');l0.className='f';l0.textContent='图案';l0.appendChild(ts);r0.appendChild(l0);
  colorField(r0,p,[['custom','自己的颜色'],['accent','跟随字幕配色'],...(p.shape==='image'?[['image','取图片原色']]:[])],after);
  box.appendChild(r0);
  if(p.tex==='custom'){
    const imgs=state.media.filter(m=>!m.kind),r=document.createElement('div');r.className='row';
    const is=document.createElement('select');is.setAttribute('aria-label','粒子用的图片');
    if(!imgs.length){const o=document.createElement('option');o.textContent='（还没有图片，点右边上传）';is.appendChild(o);is.disabled=true;}
    for(const m of imgs){const o=document.createElement('option');o.value=m.id;o.textContent=m.name;is.appendChild(o);}is.value=p.texImg||'';
    is.addEventListener('change',()=>{p.texImg=is.value;after();});
    const l=document.createElement('label');l.className='f';l.textContent='粒子图片';l.appendChild(is);r.appendChild(l);
    const up=document.createElement('button');up.type='button';up.className='ghost';up.textContent='上传图片…';up.style.flex='0 0 auto';
    const fi=document.createElement('input');fi.type='file';fi.accept='image/png,image/jpeg,image/webp,image/gif';fi.hidden=true;
    up.addEventListener('click',()=>fi.click());
    fi.addEventListener('change',async()=>{const f=fi.files[0];fi.value='';if(!f)return;const out=await importImages([f]);if(out&&out[0]){p.texImg=out[0].id;p.preset='custom';commit();toast(`粒子改用 ${out[0].name}`,'good');}});
    r.append(up,fi);box.appendChild(r);
    const tm=mediaReady(p.texImg);const hn=document.createElement('p');hn.className='hint';
    hn.textContent=(tm?`${tm.w}×${tm.h}，`:'')+'图片会一起导出。建议用透明背景的 PNG，尺寸不用太大（几十到一两百像素就够）。颜色选“自定义 + 白色”可以保持图片原色。';box.appendChild(hn);}
  numRow(box,p,[['大小 px','size',1,1,400],['大小随机 %','sizeVar',5,0,100],['颜色随机 %','colorVar',5,0,100]],after);
  numRow(box,p,[['不透明度 %','alpha',5,0,100],['淡入 %','fadeIn',5,0,100],['淡出 %','fadeOut',5,0,100]],after);
  const la=document.createElement('label');la.className='chk';la.innerHTML='<input type="checkbox"> 加色混合（发光）';const ia=la.querySelector('input');ia.checked=!!p.add;ia.addEventListener('change',()=>{p.add=ia.checked;after();});box.appendChild(la);
  const lg=document.createElement('label');lg.className='chk';lg.innerHTML='<input type="checkbox"> 朝运动方向转（雨丝、流星这类细长图案用）';const ig=lg.querySelector('input');ig.checked=!!p.align;ig.addEventListener('change',()=>{p.align=ig.checked;after();});if(p.shape!=='image')box.appendChild(lg);
  const lr=document.createElement('label');lr.className='chk';lr.innerHTML='<input type="checkbox"> 每个粒子随机初始角度';const ir=lr.querySelector('input');ir.checked=!!(p.randRot??(p.tex==='petal'||p.tex==='star'));ir.addEventListener('change',()=>{p.randRot=ir.checked;after();});box.appendChild(lr);
  box.appendChild(fxSec('生成'));
  const seg=document.createElement('div');seg.className='seg';
  for(const[k,n]of [['line','从一条横线'],['circle','从一个圆形区域'],['image','拼成一张图片']]){const b=document.createElement('button');b.type='button';b.textContent=n;b.setAttribute('aria-pressed',String(p.shape===k));b.addEventListener('click',()=>{p.shape=k;after();});seg.appendChild(b);}
  box.appendChild(seg);
  if(p.shape==='image'){
    const imgs=state.media.filter(m=>!m.kind);const r=document.createElement('div');r.className='row';const is=document.createElement('select');is.setAttribute('aria-label','图片');
    if(!imgs.length){const o=document.createElement('option');o.textContent='（素材库里还没有图片）';is.appendChild(o);is.disabled=true;}
    for(const m of imgs){const o=document.createElement('option');o.value=m.id;o.textContent=m.name;is.appendChild(o);}is.value=p.img||(imgs[0]?imgs[0].id:'');
    is.addEventListener('change',()=>{p.img=is.value;after();});if(!c.part.img&&imgs[0]){c.part.img=imgs[0].id;setTimeout(commit,0);}const l=document.createElement('label');l.className='f';l.textContent='图片';l.appendChild(is);r.appendChild(l);box.appendChild(r);
    numRow(box,p,[['中心 X','x',1,-300,940],['中心 Y','y',1,-300,780],['图片宽度','width',10,40,860]],after);
    numRow(box,p,[['颗粒间距 px','step',1,2,80],['飞来距离','spread',10,0,900],['散开距离','speed',10,0,900]],after);
    const pts=p.img?imagePixels(p.img,Math.max(2,+p.step||10),+p.width||360):null;
    const hn=document.createElement('p');hn.className='hint';hn.textContent=`${pts?pts.length:0} 个颗粒（最多 1500，超过会自动加大间距）。淡入 % = 飞来聚合用的时间，淡出 % = 散开用的时间，中间保持成图。透明的像素会跳过。`;box.appendChild(hn);
  }else{
  numRow(box,p,[['中心 X','x',1,-300,940],['中心 Y','y',1,-300,780],[p.shape==='line'&&(p.motion||'dir')==='dir'?'半宽':'半径','spread',5,0,900]],after);
  numRow(box,p,[['数量','count',1,1,500],['寿命 ms','life',100,150,120000]],after);}
  if(p.shape!=='image'){box.appendChild(fxSec('运动'));const mo=p.motion||'dir';
  const ms=document.createElement('div');ms.className='seg';ms.setAttribute('aria-label','运动方式');
  for(const[k,n]of PART_MOTION){const b=document.createElement('button');b.type='button';b.textContent=n;b.setAttribute('aria-pressed',String(mo===k));
    b.addEventListener('click',()=>{p.motion=k;if(k!=='dir'){p.shape='circle';if(k==='orbit'&&!(+p.speed>0))p.speed=70;}after();});ms.appendChild(b);}
  box.appendChild(ms);
  if(mo==='dir'){numRow(box,p,[['方向 °（0 右，90 上）','angle',5,-360,360],['方向随机 °','angleSpread',5,0,360]],after);
    numRow(box,p,[['速度 px/秒','speed',5,0,5000],['自转 °/秒','spin',10,-2000,2000]],after);}
  else if(mo==='in'){numRow(box,p,[['飞到中心时缩小到 %','shrinkTo',5,0,100],['上下压扁 %','tilt',5,5,100],['自转 °/秒','spin',10,-2000,2000]],after);
    const hn=document.createElement('p');hn.className='hint';hn.textContent='粒子从半径那么远的一圈出现，在一个寿命的时间里被吸到中心（中心 X / Y）。寿命越短吸得越快；缓动选「加速」类效果最好。';box.appendChild(hn);}
  else{numRow(box,p,[['速度 px/秒','speed',5,0,5000],['上下压扁 %','tilt',5,5,100],['自转 °/秒','spin',10,-2000,2000]],after);
    const os=document.createElement('select');os.setAttribute('aria-label','转圈方向');for(const[k,n]of ORBIT_DIR){const o=document.createElement('option');o.value=k;o.textContent=n;os.appendChild(o);}os.value=p.orbitDir||'mix';os.addEventListener('change',()=>{p.orbitDir=os.value;after();});
    const lo=document.createElement('label');lo.className='f';lo.textContent='转圈方向';lo.appendChild(os);box.appendChild(lo);
    const hn=document.createElement('p');hn.className='hint';hn.textContent='粒子散在中心周围（半径的 55%–100%）绕着中心转。压扁到 30%–50% 像一个斜着看的光环。';box.appendChild(hn);}}
  const es=document.createElement('select');es.setAttribute('aria-label','运动缓动');for(const[id,n]of EASES){const o=document.createElement('option');o.value=id;o.textContent=n;es.appendChild(o);}es.value=String(p.ease||0);es.addEventListener('change',()=>{p.ease=+es.value;after();});
  const le=document.createElement('label');le.className='f';le.textContent='运动缓动';le.appendChild(es);box.appendChild(le);
  const acts=document.createElement('div');acts.className='preset';
  const act=(t,fn)=>{const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent=t;b.addEventListener('click',fn);acts.appendChild(b);};
  act('覆盖整首',()=>{c.start=0;c.end=Math.round(gen.duration);commit();});act('只在 kiai',()=>{const k=(gen.kiai||[])[0];if(!k){toast('没有 kiai','err');return;}c.start=Math.round(k.s);c.end=Math.round(k.e);commit();});act('删除片段',()=>deleteClip(c.id));
  box.appendChild(fxSec('快捷操作'));box.appendChild(acts);
  const h=document.createElement('p');h.className='hint';h.textContent='每个粒子是一个 sprite，用 L 循环反复飘，所以就算铺满整首，命令也很少。数量越多画面越满，SB load 也越高。';box.appendChild(h);
}
