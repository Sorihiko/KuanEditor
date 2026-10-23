/* ---------- dockable panels: splitters, draggable tabs, workspaces ---------- */
const DOCK_KEY='kuan-layout';
const DOCK_PAGES={};          // id -> {id,tab,body,tool,cls}
let dockTree=null,dockWs='默认',dockNarrow=false;const dockNav=document.querySelector('nav.tools');

function dockCollect(){
  // tabbed panes
  for(const b of document.querySelectorAll('.p-proj [role=tab], .p-fx [role=tab]')){
    const sec=document.getElementById(b.dataset.pane);if(!sec)continue;
    const body=document.createElement('div');body.className='pbody dpage';body.appendChild(sec);
    DOCK_PAGES[b.dataset.pane]={id:b.dataset.pane,tab:b,body,tool:null,cls:''};}
  // monitor + timeline: header controls become the page toolbar
  for(const[id,sel,cls,label]of [['pg-mon','.p-mon','p-mon','节目监视器'],['pg-tl','.p-tl','p-tl','时间线']]){
    const sec=document.querySelector(sel),bar=sec.querySelector('.ptabs'),ttl=bar.querySelector('.ttl');
    const tab=document.createElement('button');tab.type='button';tab.setAttribute('role','tab');tab.dataset.pane=id;tab.textContent=ttl?ttl.textContent:label;tab.title=label;if(ttl)ttl.remove();
    const tool=document.createElement('span');tool.className='dtool';while(bar.firstChild)tool.appendChild(bar.firstChild);bar.remove();
    const body=document.createElement('div');body.className='dpage dfill';while(sec.firstChild)body.appendChild(sec.firstChild);
    DOCK_PAGES[id]={id,tab,body,tool,cls};}
  for(const s of document.querySelectorAll('.p-proj,.p-mon,.p-fx,.p-tl'))s.remove();
  for(const id in DOCK_PAGES){const pg=DOCK_PAGES[id];pg.tab.removeAttribute('aria-selected');
    pg.tab.addEventListener('click',()=>{if(dockSuppress){dockSuppress=false;return;}dockShow(id);});
    pg.tab.addEventListener('pointerdown',e=>dockTabDown(e,id));}
}
/* ---- tree helpers ---- */
function dockGroups(n,out=[]){if(!n||n.t==='tools')return out;if(n.t==='g')out.push(n);else n.k.forEach(c=>dockGroups(c,out));return out;}
function dockCountTools(n){return !n?0:n.t==='tools'?1:n.t==='g'?0:n.k.reduce((a,c)=>a+dockCountTools(c),0);}
function dockValid(t){try{const ids=dockGroups(t).flatMap(g=>g.p);const want=Object.keys(DOCK_PAGES);
  return ids.length===want.length&&want.every(i=>ids.includes(i))&&dockGroups(t).every(g=>g.p.length&&g.p.includes(g.a))&&dockCountTools(t)<=1;}catch(e){return false;}}
function dockFix(t){if(t&&!dockCountTools(t))t=t.t==='r'?{t:'r',k:[TL(),...t.k],s:[1,...t.s]}:{t:'r',k:[TL(),t],s:[1,99]};return t;}
function dockParent(n,target,par=null){if(n===target)return par;if(n.t==='g'||n.t==='tools')return undefined;for(const c of n.k){const r=dockParent(c,target,n);if(r!==undefined)return r;}return undefined;}
function dockNorm(n){
  if(n.t==='tools')return n;
  if(n.t==='g')return n.p.length?n:null;
  const k=[],s=[];n.k.forEach((c,i)=>{const r=dockNorm(c);if(!r)return;const w=n.s[i]||1;
    if(r.t===n.t){const tot=r.s.reduce((a,b)=>a+b,0)||1;r.k.forEach((cc,j)=>{k.push(cc);s.push(w*r.s[j]/tot);});}else{k.push(r);s.push(w);}});
  if(!k.length)return null;if(k.length===1)return k[0];n.k=k;n.s=s;return n;}
function groupOf(id){return dockGroups(dockTree).find(g=>g.p.includes(id));}
/* ---- persistence ---- */
function dockLoad(){let o=null;try{o=JSON.parse(localStorage.getItem(DOCK_KEY)||'null');}catch(e){}
  dockSaved=o&&o.saved&&typeof o.saved==='object'?o.saved:{};
  for(const k in dockSaved){dockSaved[k]=dockFix(dockSaved[k]);if(!dockValid(dockSaved[k]))delete dockSaved[k];}
  if(o&&o.cur&&dockValid(o.cur=dockFix(o.cur))){dockTree=o.cur;dockWs=o.ws||'默认';}else{dockTree=DOCK_PRESETS['默认']();dockWs='默认';}}
let dockSaved={};
function dockSave(){try{localStorage.setItem(DOCK_KEY,JSON.stringify({cur:dockTree,ws:dockWs,saved:dockSaved}));}catch(e){}}
/* ---- render ---- */
function dockRender(){
  const host=document.getElementById('dock');host.innerHTML='';
  dockNarrow=window.innerWidth<=1000;host.classList.toggle('narrow',dockNarrow);
  const tools=dockNav;tools.classList.remove('horiz');
  if(dockNarrow){tools.classList.add('horiz');host.appendChild(tools);const order=['pg-mon','pg-tl'];const gs=dockGroups(dockTree).slice().sort((a,b)=>{const ia=order.findIndex(i=>a.p.includes(i)),ib=order.findIndex(i=>b.p.includes(i));return (ia<0?9:ia)-(ib<0?9:ib);});
    for(const g of gs)host.appendChild(dockGroupEl(g));}
  else host.appendChild(dockNodeEl(dockTree));
  try{redraw();}catch(e){}
}
function dockNodeEl(n,par){
  if(n.t==='tools'){const el=dockNav;el.classList.toggle('horiz',!!par&&par.t==='c');return el;}
  if(n.t==='g')return dockGroupEl(n);
  const el=document.createElement('div');el.className='dsplit '+(n.t==='r'?'drow':'dcol');
  n.k.forEach((c,i)=>{
    if(i&&(c.t==='tools'||n.k[i-1].t==='tools')){const sp=document.createElement('div');sp.className='dgap';sp._n=n;sp._i=i;el.appendChild(sp);}
    else if(i){const gu=document.createElement('div');gu.className='dgut';gu.setAttribute('role','separator');gu.setAttribute('aria-orientation',n.t==='r'?'vertical':'horizontal');
      gu._n=n;gu._i=i;gu.title='拖动调整大小，双击平分';gu.addEventListener('pointerdown',e=>dockGutDown(e,n,i-1,el));gu.addEventListener('dblclick',()=>{const w=(n.s[i-1]+n.s[i])/2;n.s[i-1]=n.s[i]=w;dockApplySizes(n,el);dockSave();});el.appendChild(gu);}
    const ce=dockNodeEl(c,n);ce.classList.add('dcell');el.appendChild(ce);});
  dockApplySizes(n,el);return el;}
function dockApplySizes(n,el){const cells=[...el.children].filter(x=>x.classList.contains('dcell'));cells.forEach((c,i)=>{c.style.flex=n.k[i].t==='tools'?'none':`${n.s[i]} 1 0px`;});}
function dockGroupEl(g){
  const el=document.createElement('section');el.className='panel dgroup';el._g=g;
  const bar=document.createElement('div');bar.className='ptabs dtabs';bar.setAttribute('role','tablist');
  const grip=document.createElement('span');grip.className='dgrip';grip.title='拖动整个面板（也可以拖页签栏的空白处）';grip.setAttribute('aria-hidden','true');
  grip.innerHTML='<svg viewBox="0 0 8 14"><circle cx="2" cy="2" r="1.1"/><circle cx="6" cy="2" r="1.1"/><circle cx="2" cy="7" r="1.1"/><circle cx="6" cy="7" r="1.1"/><circle cx="2" cy="12" r="1.1"/><circle cx="6" cy="12" r="1.1"/></svg>';
  bar.appendChild(grip);
  bar.addEventListener('pointerdown',e=>{const t=e.target;if(t===bar||t.closest('.dgrip')||t.classList.contains('dtool')||t.classList.contains('sp')){if(t.closest('.dgrip'))e.preventDefault();dockTabDown(e,g);}});
  const body=document.createElement('div');body.className='dbody';
  if(!g.p.includes(g.a))g.a=g.p[0];
  for(const id of g.p){const pg=DOCK_PAGES[id],on=id===g.a;pg.tab.setAttribute('aria-selected',String(on));bar.appendChild(pg.tab);
    pg.body.hidden=!on;body.appendChild(pg.body);const sec=pg.body.querySelector(':scope > .pane');if(sec)sec.hidden=!on;}
  const pg=DOCK_PAGES[g.a];if(pg.cls)el.classList.add(pg.cls);el.setAttribute('aria-label',pg.tab.textContent);
  if(pg.tool)bar.appendChild(pg.tool);
  el.append(bar,body);return el;}
function dockShow(id){
  const g=groupOf(id);if(!g)return;
  if(g.a!==id){g.a=id;const el=[...document.querySelectorAll('.dgroup')].find(x=>x._g===g);
    if(el){const bar=el.querySelector('.dtabs');
      for(const pid of g.p){const pg=DOCK_PAGES[pid],on=pid===id;pg.tab.setAttribute('aria-selected',String(on));pg.body.hidden=!on;
        const sec=pg.body.querySelector(':scope > .pane');if(sec)sec.hidden=!on;if(pg.tool&&!on)pg.tool.remove();if(pg.cls)el.classList.toggle(pg.cls,on);}
      const pg=DOCK_PAGES[id];if(pg.tool)bar.appendChild(pg.tool);el.setAttribute('aria-label',pg.tab.textContent);}
    else dockRender();dockSave();}
  try{if(id==='pane-out'&&statsDirty)computeStats();redraw();}catch(e){}}
/* ---- splitter drag ---- */
const DOCK_MIN={r:170,c:90};
function dockGutDown(e,n,i,el){
  e.preventDefault();const g=e.currentTarget;g.setPointerCapture(e.pointerId);g.classList.add('on');
  const cells=[...el.children].filter(x=>x.classList.contains('dcell'));const horiz=n.t==='r';
  const sz=c=>{const r=c.getBoundingClientRect();return horiz?r.width:r.height;};
  const a0=sz(cells[i]),b0=sz(cells[i+1]),tot=a0+b0,sw=n.s[i]+n.s[i+1],p0=horiz?e.clientX:e.clientY,mn=DOCK_MIN[n.t];
  const mv=ev=>{const d=(horiz?ev.clientX:ev.clientY)-p0;const a=Math.max(Math.min(mn,tot/2),Math.min(tot-Math.min(mn,tot/2),a0+d));
    n.s[i]=sw*a/tot;n.s[i+1]=sw-n.s[i];dockApplySizes(n,el);};
  const up=()=>{g.classList.remove('on');g.removeEventListener('pointermove',mv);g.removeEventListener('pointerup',up);g.removeEventListener('pointercancel',up);dockSave();try{redraw();}catch(e){}};
  g.addEventListener('pointermove',mv);g.addEventListener('pointerup',up);g.addEventListener('pointercancel',up);}
/* ---- tab drag & dock ---- */
let dockSuppress=false,dockDrag=null;
function dockTabDown(e,id){
  if(e.button!==0||dockNarrow)return;const isG=typeof id==='object';const x0=e.clientX,y0=e.clientY;
  const mv=ev=>{
    if(!dockDrag){if(Math.hypot(ev.clientX-x0,ev.clientY-y0)<6)return;
      const gh=document.createElement('div');gh.className='dghost';gh.textContent=isG&&id.t==='tools'?'工具栏':isG?'面板：'+id.p.map(x=>DOCK_PAGES[x].tab.textContent).join(' · '):DOCK_PAGES[id].tab.textContent;
      const zone=document.createElement('div');zone.className='dzone';zone.hidden=true;document.body.append(gh,zone);
      dockDrag={id,gh,zone,target:null};document.body.classList.add('ddragging');}
    dockDrag.gh.style.left=ev.clientX+12+'px';dockDrag.gh.style.top=ev.clientY+10+'px';dockHover(ev.clientX,ev.clientY);};
  const up=ev=>{document.removeEventListener('pointermove',mv,true);document.removeEventListener('pointerup',up,true);
    if(!dockDrag)return;dockSuppress=true;setTimeout(()=>{dockSuppress=false;},0);
    const D=dockDrag;dockDrag=null;D.gh.remove();D.zone.remove();document.body.classList.remove('ddragging');
    if(D.target)(typeof D.id==='object'?dockMoveGroup:dockMove)(D.id,D.target.g,D.target.where);};
  document.addEventListener('pointermove',mv,true);document.addEventListener('pointerup',up,true);}
function dockHover(x,y){
  const D=dockDrag;D.target=null;D.zone.hidden=true;
  const isT=D.id&&D.id.t==='tools',host=document.getElementById("dock").getBoundingClientRect(),EDGE=8;
  const ed={left:x-host.left,right:host.right-x,top:y-host.top,bottom:host.bottom-y},em=Object.entries(ed).sort((a,b)=>a[1]-b[1])[0];
  const el=document.elementFromPoint(x,y);
  /* over the tool strip: drop the panel right next to it (left / right of a vertical strip, above / below a horizontal one) */
  const te=!isT&&el&&el.closest('nav.tools');if(te&&!dockNarrow){const tn=TOOLS_NODE();if(!tn)return;const r=te.getBoundingClientRect(),hz=te.classList.contains('horiz'),W=Math.min(220,host.width*0.25),Hh=Math.min(160,host.height*0.25);
    const where=hz?(y<r.top+r.height/2?'top':'bottom'):(x<r.left+r.width/2?'left':'right'),z=D.zone.style;
    const R={left:[r.left-W,r.top,W,r.height],right:[r.right,r.top,W,r.height],top:[r.left,r.top-Hh,r.width,Hh],bottom:[r.left,r.bottom,r.width,Hh]}[where];
    z.left=Math.max(host.left,R[0])+'px';z.top=Math.max(host.top,R[1])+'px';z.width=R[2]+'px';z.height=R[3]+'px';D.zone.hidden=false;D.target={g:tn,where};return;}
  if(em[1]<EDGE&&em[1]>=-4){const where=em[0],z=D.zone.style,th=isT?40:Math.min(host.width,host.height)*0.3;
    const R={left:[host.left,host.top,th,host.height],right:[host.right-th,host.top,th,host.height],top:[host.left,host.top,host.width,th],bottom:[host.left,host.bottom-th,host.width,th]}[where];
    z.left=R[0]+'px';z.top=R[1]+'px';z.width=R[2]+'px';z.height=R[3]+'px';D.zone.hidden=false;D.target={g:'root',where};return;}
  /* over the gap between two panels: drop the panel in between them */
  {const gp=el&&(el.closest('.dgut')||el.closest('.dgap'));if(gp&&gp._n){const r=gp.getBoundingClientRect(),row=gp._n.t==='r',W=Math.min(160,host.width*0.2),Hh=Math.min(120,host.height*0.2),z=D.zone.style;
    const R=row?[r.left+r.width/2-W/2,r.top,W,r.height]:[r.left,r.top+r.height/2-Hh/2,r.width,Hh];
    z.left=R[0]+'px';z.top=R[1]+'px';z.width=R[2]+'px';z.height=R[3]+'px';D.zone.hidden=false;D.target={g:{gut:true,n:gp._n,i:gp._i},where:'gut'};return;}}
  const ge=el&&el.closest('.dgroup');if(!ge)return;
  const g=ge._g,r=ge.getBoundingClientRect(),bar=ge.querySelector('.dtabs').getBoundingClientRect();
  const isG=typeof D.id==='object',src=isG?D.id:groupOf(D.id);let where='center';
  if(y>bar.bottom){const fx=(x-r.left)/r.width,fy=(y-bar.bottom)/(r.bottom-bar.bottom);
    const d={left:fx,right:1-fx,top:fy,bottom:1-fy};const m=Object.entries(d).sort((a,b)=>a[1]-b[1])[0];if(m[1]<0.3||isT)where=m[0];}
  else if(isT){const fx=(x-r.left)/r.width;where=fx<0.5?'left':'right';}
  if(g===src&&(isG||where==='center'||src.p.length===1))return;
  const z=D.zone.style,top=where==='center'||isT?r.top:bar.bottom,h=r.bottom-top,hw=isT?Math.min(40,r.width/2):r.width/2,hh=isT?Math.min(40,h/2):h/2;
  const R={center:[r.left,r.top,r.width,r.height],left:[r.left,top,hw,h],right:[r.right-hw,top,hw,h],top:[r.left,top,r.width,hh],bottom:[r.left,r.bottom-hh,r.width,hh]}[where];
  z.left=R[0]+'px';z.top=R[1]+'px';z.width=R[2]+'px';z.height=R[3]+'px';D.zone.hidden=false;D.target={g,where};}
function dockInsert(node,tg,where,keepW){
  if(tg==='root'){const dir=where==='left'||where==='right'?'r':'c',before=where==='left'||where==='top';
    if(dockTree.t===dir){const others=dockTree.k.reduce((a,c,j)=>c.t==='tools'?a:a+(dockTree.s[j]||1),0)||1,w=node.t==='tools'?1:others*0.3;if(before){dockTree.k.unshift(node);dockTree.s.unshift(w);}else{dockTree.k.push(node);dockTree.s.push(w);}}
    else dockTree={t:dir,k:before?[node,dockTree]:[dockTree,node],s:node.t==='tools'?[1,1]:before?[30,70]:[70,30]};return;}
  if(tg.t==='tools'){/* next to the tool strip: the strip keeps its fixed width, the panel gets a reasonable share of the row / column */
    const dir=where==='left'||where==='right'?'r':'c',before=where==='left'||where==='top',par=dockParent(dockTree,tg);
    if(par&&par.t===dir){const i=par.k.indexOf(tg),others=par.k.reduce((a,c,j)=>c.t==='tools'?a:a+par.s[j],0)||1;par.k.splice(before?i:i+1,0,node);par.s.splice(before?i:i+1,0,others*0.3);}
    else{const sp={t:dir,k:before?[node,tg]:[tg,node],s:[1,1]};if(!par)dockTree=sp;else par.k[par.k.indexOf(tg)]=sp;}
    return;}
  if(where==='center'){tg.p.push(...node.p);tg.a=node.a;return;}
  const dir=where==='left'||where==='right'?'r':'c',before=where==='left'||where==='top',par=dockParent(dockTree,tg);
  if(par&&par.t===dir){const i=par.k.indexOf(tg);let w;if(keepW>0){w=Math.min(keepW,par.s[i]*1.5);}else{w=par.s[i]/2;par.s[i]=w;}par.k.splice(before?i:i+1,0,node);par.s.splice(before?i:i+1,0,w);}
  else{const sp={t:dir,k:before?[node,tg]:[tg,node],s:[1,1]};if(!par)dockTree=sp;else par.k[par.k.indexOf(tg)]=sp;}}
/* put node into split n at index i, taking its share from the two neighbours */
function dockInsertGut(node,tg){const n=tg.n,i=tg.i,L=n.k[i-1].t!=='tools',Rt=n.k[i].t!=='tools',tot=(L?n.s[i-1]:0)+(Rt?n.s[i]:0)||1,f=L&&Rt?0.25:0.3,w=tot*f;
  if(L)n.s[i-1]*=1-f;if(Rt)n.s[i]*=1-f;n.k.splice(i,0,node);n.s.splice(i,0,w);}
function dockMoveGroup(src,tg,where){
  if(src===tg)return;const par=dockParent(dockTree,src);if(!par)return;
  if(tg&&tg.gut){if(tg.n===par&&(tg.i===par.k.indexOf(src)||tg.i===par.k.indexOf(src)+1))return;
    let oi=par.k.indexOf(src);dockInsertGut(src,tg);if(par===tg.n&&tg.i<=oi)oi++;par.k.splice(oi,1);par.s.splice(oi,1);
    dockTree=dockNorm(dockTree)||DOCK_PRESETS['默认']();dockSave();dockRender();toast(src.t==='tools'?'已移动工具栏':'已移动整个面板','good');return;}
  if(tg==='root'&&par===dockTree&&((dockTree.t==='r'&&(where==='left'||where==='right'))||(dockTree.t==='c'&&(where==='top'||where==='bottom')))){const i=par.k.indexOf(src),w=par.s[i];par.k.splice(i,1);par.s.splice(i,1);
    if(where==='left'||where==='top'){par.k.unshift(src);par.s.unshift(w);}else{par.k.push(src);par.s.push(w);}dockSave();dockRender();return;}
  const i=par.k.indexOf(src),oldW=par.s[i]/(par.s.reduce((a,b)=>a+b,0)||1);par.k.splice(i,1);par.s.splice(i,1);
  dockTree=dockNorm(dockTree);
  /* coming back into a row / column: keep roughly the share it had before (relative to its new siblings) */
  let kw=0;if(tg!=='root'&&tg.t==='g'&&where!=='center'){const np=dockParent(dockTree,tg),dir=where==='left'||where==='right'?'r':'c';if(np&&np.t===dir){const tot=np.s.reduce((a,b)=>a+b,0)||1;kw=tot*oldW/(1-oldW||1);}}
  dockInsert(src,tg,where,kw);
  dockTree=dockNorm(dockTree)||DOCK_PRESETS['默认']();dockSave();dockRender();toast(src.t==='tools'?'已移动工具栏':'已移动整个面板','good');}
function dockMove(id,tg,where){
  const src=groupOf(id);if(!src)return;
  if(tg===src&&(where==='center'||src.p.length===1))return;
  src.p=src.p.filter(x=>x!==id);if(src.a===id)src.a=src.p[0];
  if(tg&&tg.gut){dockInsertGut({t:'g',p:[id],a:id},tg);}
  else if(tg==='root'||tg.t==='tools'){dockInsert({t:'g',p:[id],a:id},tg,where);}
  else if(where==='center'){tg.p.push(id);tg.a=id;}
  else{const ng={t:'g',p:[id],a:id},dir=where==='left'||where==='right'?'r':'c',before=where==='left'||where==='top';
    const par=dockParent(dockTree,tg);
    if(par&&par.t===dir){const i=par.k.indexOf(tg),w=par.s[i]/2;par.s[i]=w;par.k.splice(before?i:i+1,0,ng);par.s.splice(before?i:i+1,0,w);}
    else{const sp={t:dir,k:before?[ng,tg]:[tg,ng],s:[1,1]};
      if(!par)dockTree=sp;else{const i=par.k.indexOf(tg);par.k[i]=sp;}}}
  dockTree=dockNorm(dockTree)||DOCK_PRESETS['默认']();
  dockSave();dockRender();toast(`已移动「${DOCK_PAGES[id].tab.textContent}」`,'good');}
/* ---- workspaces ---- */
function dockUse(name){const f=DOCK_PRESETS[name];const t=f?f():dockSaved[name]?JSON.parse(JSON.stringify(dockSaved[name])):null;if(!t)return;
  dockTree=t;dockWs=name;dockSave();dockRender();toast(`工作区：${name}`,'good');}
function dockMenuItems(r){const mark=n=>(n===dockWs?'✓ ':'　')+n;
  const items=Object.keys(DOCK_PRESETS).map(n=>({label:mark(n),fn:()=>dockUse(n)}));
  const own=Object.keys(dockSaved);if(own.length){items.push('-');for(const n of own)items.push({label:mark(n),fn:()=>dockUse(n)});}
  items.push('-',{label:`重置「${dockWs}」`,fn:()=>dockUse(dockWs)},{label:'把当前布局存为工作区…',fn:()=>dockAsk(r)});
  if(dockSaved[dockWs])items.push({label:`删除「${dockWs}」`,fn:()=>{delete dockSaved[dockWs];dockWs='默认';dockSave();toast('已删除工作区');}});
  return items;}
function dockMenu(btn){const r=btn.getBoundingClientRect();ctxMenu(r.left,r.bottom+4,dockMenuItems(r));}
function dockAsk(r){
  closeCtx();const m=document.createElement('div');m.className='ctxmenu dask';
  m.innerHTML='<label class="f">工作区名称<input type="text" maxlength="16"></label><div class="row"><button type="button" class="btn primary">保存</button><button type="button" class="ghost">取消</button></div>';
  document.body.appendChild(m);m.style.left=Math.min(r.left,innerWidth-240)+'px';m.style.top=r.bottom+4+'px';
  const inp=m.querySelector('input'),[ok,no]=m.querySelectorAll('button');let n=1;while(dockSaved['自定义 '+n])n++;inp.value='自定义 '+n;inp.focus();inp.select();
  const done=()=>{const v=inp.value.trim();if(!v){inp.focus();return;}if(DOCK_PRESETS[v]){toast('这个名字是内置工作区，换一个','err');return;}
    dockSaved[v]=JSON.parse(JSON.stringify(dockTree));dockWs=v;dockSave();m.remove();toast(`已保存工作区「${v}」`,'good');};
  ok.addEventListener('click',done);no.addEventListener('click',()=>m.remove());inp.addEventListener('keydown',e=>{if(e.key==='Enter')done();else if(e.key==='Escape')m.remove();});}
const TOOLS_NODE=()=>{const f=n=>!n?null:n.t==='tools'?n:n.t==='g'?null:n.k.map(f).find(Boolean)||null;return f(dockTree);};
function dockInit(){
  const nav=dockNav;const grip=document.createElement('span');grip.className='dgrip tgrip';grip.title='拖动工具栏';grip.setAttribute('aria-hidden','true');
  grip.innerHTML='<svg viewBox="0 0 14 8"><circle cx="2" cy="2" r="1.1"/><circle cx="7" cy="2" r="1.1"/><circle cx="12" cy="2" r="1.1"/><circle cx="2" cy="6" r="1.1"/><circle cx="7" cy="6" r="1.1"/><circle cx="12" cy="6" r="1.1"/></svg>';
  nav.prepend(grip);
  nav.addEventListener('pointerdown',e=>{const t=e.target;if(t===nav||t.closest('.tgrip')||t.tagName==='HR'){e.preventDefault();const n=TOOLS_NODE();if(n)dockTabDown(e,n);}});
  dockCollect();dockLoad();dockRender();
  document.getElementById('wsBtn').addEventListener('click',e=>dockMenu(e.currentTarget));
  let wasNarrow=dockNarrow;window.addEventListener('resize',()=>{const n=window.innerWidth<=1000;if(n!==wasNarrow){wasNarrow=n;dockRender();}});}
dockInit();
