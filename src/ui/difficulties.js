/* 难度切换、拖入文件 */
/* ---------- files ---------- */
/* ---------- difficulties ---------- */
let mapIdx=0;
const verOf=t=>{const m=String(t).match(/^\s*Version\s*:(.*)$/m);return m?m[1].trim()||'?':'?';};
const titleOf=t=>{const m=String(t).match(/^\s*Title\s*:(.*)$/m);return m?m[1].trim():'';};
const curVer=()=>mapIsSample||!maps[mapIdx]?null:maps[mapIdx].ver;
function setMaps(list,prefer){
  maps=list.map(x=>({...x,ver:verOf(x.text)}));
  let i=maps.findIndex(m=>m.ver===prefer);if(i<0)i=maps.findIndex(m=>m.ver===state.diffVer);if(i<0)i=0;
  return selectDiff(i,true);
}
function selectDiff(i,quiet){
  const m=maps[i];if(!m)return false;
  try{map=parseOsu(m.text);}catch(e){toast(`${m.file}：${e.message}`,'err');return false;}
  mapIsSample=false;mapIdx=i;state.diffVer=m.ver;save();renderFiles();renderHeaders();schedule();
  if(!quiet)toast(`已切换到难度 [${m.ver}]`,'good');return true;
}
async function importOsbText(name,text,src){
  let P;try{P=parseOsbText(text);}catch(e){toast(`${name}：${e.message}`,'err');return null;}
  if(!P.blocks.length&&!P.samples.length){toast(`${name} 里没有 sprite`,'err');return null;}
  const iid=uid();await idbPut('imp:'+iid,text);impCache.set(iid,P);
  const tr={id:uid(),name:'OSB · '+name,layer:'Background',imp:true,iid,src:src||null};state.tracks.push(tr);
  state.clips.push({id:uid(),kind:'imp',tid:tr.id,iid,start:P.t0,end:Math.max(P.t1,P.t0+100),base:P.t0});
  commit();toast(`已导入 ${name}：${P.blocks.length} 个 sprite，导出时原样保留`,'good');return tr;
}
const SUB_RE=/\.(srt|ass|ssa|sbv)$/i;
async function bgToTimeline(){
  let blob=null,src=null,name=null;
  if(dirH&&!mapIsSample&&map.bg){try{blob=await readPath(map.bg);src=map.bg;name=map.bg.split('/').pop();}catch(e){}}
  if(!blob&&bgFile){blob=bgFile;name=bgFile.name;}
  if(!blob){toast('先打开谱面文件夹，或在“谱面”页设置预览背景图','err');return;}
  try{const{img,url}=await decodeImg(blob);const id=uid();
    let m=src?state.media.find(x=>x.src===src):null;
    if(!m){m={id,name,w:img.naturalWidth,h:img.naturalHeight,file:src||safeFile(name),src:src||undefined};await idbPut(id,blob);mediaCache.set(id,{img,url,blob,w:m.w,h:m.h,g:{key:'m:'+id,canvas:img,w:m.w,h:m.h,tints:new Map(),media:id}});state.media.push(m);}
    let tr=state.tracks.filter(isImg).find(t=>t.layer==='Background');if(!tr){tr={id:uid(),name:'背景',layer:'Background'};state.tracks.push(tr);}
    const c=newClip(m.id,tr.id,0);c.start=0;c.end=Math.round(gen.duration);
    c.props.s={v:[+(Math.max(854/m.w,480/m.h)*100).toFixed(2)],kf:null};c.props.p={v:[320,240],kf:null};c.props.a={v:[60],kf:null};
    state.clips.push(c);sel={type:'clip',id:c.id};activeTid=tr.id;showTab($('#tab-fx'));commit();
    toast(src?'已把谱面背景铺满整首、不透明度 60%。用的是同一个文件，osu! 会自动隐藏原背景':'已把背景图铺满整首、不透明度 60%','good');}
  catch(e){toast(e.message,'err');}
}
