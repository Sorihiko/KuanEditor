/* 素材（图片、帧动画、音效）存进 IndexedDB 与读取 */
/* ---------- media (images kept in IndexedDB) ---------- */
const mediaCache=new Map();
let idbP=null;
function idbOpen(name,create){return new Promise((res,rej)=>{try{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>{if(create)r.result.createObjectStore('m',{keyPath:'id'});};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}catch(e){rej(e);}});}
function idb(){if(idbP)return idbP;idbP=idbOpen('kuan-media',true);return idbP;}
async function idbPut(id,blob){try{const db=await idb();await new Promise((res,rej)=>{const tx=db.transaction('m','readwrite');tx.objectStore('m').put({id,blob});tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});return true;}catch(e){return false;}}
async function idbGet(id){try{const db=await idb();return await new Promise(res=>{const tx=db.transaction('m');const r=tx.objectStore('m').get(id);r.onsuccess=()=>res(r.result?r.result.blob:null);r.onerror=()=>res(null);});}catch(e){return null;}}
function decodeImg(blob){return new Promise((res,rej)=>{const url=URL.createObjectURL(blob);const img=new Image();img.onload=()=>res({img,url});img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('图片无法解码'));};img.src=url;});}
let sfxCtx=null;const sfx=()=>sfxCtx||(sfxCtx=new(window.AudioContext||window.webkitAudioContext)());
async function loadMedia(m){
  if(mediaCache.has(m.id))return mediaCache.get(m.id);
  if(m.kind==='sound'){const blob=await idbGet(m.id);if(!blob){mediaCache.set(m.id,{missing:true});return null;}
    try{const buf=await sfx().decodeAudioData(await blob.arrayBuffer());const c={sound:true,blob,buf,dur:buf.duration*1000};mediaCache.set(m.id,c);return c;}catch(e){mediaCache.set(m.id,{missing:true});return null;}}
  if(m.kind==='anim'){const fr=[];
    for(let i=0;i<m.frames;i++){const blob=await idbGet(m.id+'#'+i);if(!blob){mediaCache.set(m.id,{missing:true});return null;}try{const{img,url}=await decodeImg(blob);fr.push({img,url,blob});}catch(e){mediaCache.set(m.id,{missing:true});return null;}}
    const c=animEntry(m,fr);mediaCache.set(m.id,c);return c;}
  const blob=await idbGet(m.id);if(!blob){mediaCache.set(m.id,{missing:true});return null;}
  try{const{img,url}=await decodeImg(blob);const c={img,url,blob,w:img.naturalWidth,h:img.naturalHeight,g:{key:'m:'+m.id,canvas:img,w:img.naturalWidth,h:img.naturalHeight,tints:new Map(),media:m.id}};mediaCache.set(m.id,c);return c;}
  catch(e){mediaCache.set(m.id,{missing:true});return null;}
}
function animEntry(m,fr){const w=fr[0].img.naturalWidth,h=fr[0].img.naturalHeight;
  const frames=fr.map((f,i)=>({key:'m:'+m.id+'#'+i,canvas:f.img,w,h,tints:new Map()}));
  return{img:fr[0].img,url:fr[0].url,blob:fr[0].blob,frameBlobs:fr.map(f=>f.blob),w,h,g:{key:'m:'+m.id,canvas:fr[0].img,w,h,tints:new Map(),media:m.id,frames}};}
function soundReady(id){const c=mediaCache.get(id);return c&&c.sound?c:null;}
function mediaReady(id){const c=mediaCache.get(id);return c&&c.img?c:null;}
function safeFile(name,dir){
  const dot=name.lastIndexOf('.');let base=(dot>0?name.slice(0,dot):name).replace(/[^A-Za-z0-9._-]+/g,'_').replace(/^_+|_+$/g,'')||'img';
  const ext=(dot>0?name.slice(dot+1):'png').toLowerCase().replace(/[^a-z0-9]/g,'')||'png';
  const d=dir||'sb/img';let f=`${d}/${base}.${ext}`,n=2;const used=new Set(state.media.map(m=>m.file));while(used.has(f))f=`${d}/${base}_${n++}.${ext}`;return f;
}

