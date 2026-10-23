/* 把所有轨道生成 sprite（带缓存，只重算改动过的部分） */
/* ---------- build everything ---------- */
/* ---------- generation memo: only clips / lyrics whose inputs changed are rebuilt ---------- */
let genMemo=new Map(),glyphEpoch=0,mapSerial=0,lastMapRef=null;
function memo(next,key,make){let v=genMemo.get(key);if(!v){v=make();}next.set(key,v);return v;}
function genList(fn){const i0=sprites.length;fn();return sprites.splice(i0);}
function buildAll(){
  sprites=[];
  if(map!==lastMapRef){lastMapRef=map;mapSerial++;}
  const next=new Map();
  const pal=palOf(state);
  const raw=parseLrc(state.lrc);const lines=[];
  for(let i=0;i<raw.length;i++){
    if(!raw[i].text)continue;
    const S=startOf(raw[i]);const b=beatAt(S);
    let E=i+1<raw.length?startOf(raw[i+1]):S+8*b;
    if(E<S+b/2)E=S+b/2;
    lines.push({S,E,b,text:raw[i].text,rows:parseMarkup(raw[i].text),src:raw[i],charTimes:charTimesFor(raw[i],S,E)});
  }
  const{duration,kiai}=songSpan(lines.length?lines[lines.length-1].E+1000:20000);
  const lyrTr=state.tracks.find(t=>t.lyric);
  const lyrKey='L'+JSON.stringify([lines.map(L=>[L.S,L.E,L.text,L.src.key,L.charTimes]),STYLE_KEYS.map(k=>state[k]),state.lineStyle,state.lineTf,state.lyr,
    kiai,duration,mapSerial,glyphEpoch,lyrTr.layer,lyrTr.id]);
  const LG=memo(next,lyrKey,()=>{const out=genList(()=>buildLyrics(lines,kiai,pal));for(const s of out){s.layer=lyrTr.layer;s.tid=lyrTr.id;}return{sprites:out,styles:lines.map(L=>[L.style,L.custom])};});
  lines.forEach((L,i)=>{L.style=LG.styles[i][0];L.custom=LG.styles[i][1];});
  const lyricGroup=LG.sprites,all=[];
  const pk=JSON.stringify(pal),ck=(c,tr,extra)=>c.kind+JSON.stringify(c)+'|'+tr.id+tr.layer+'|'+pk+'|'+mapSerial+'|'+(extra||'');
  for(const layer of LAYERS)for(let i=state.tracks.length-1;i>=0;i--){const tr=state.tracks[i];if(!tr.imp&&tr.layer!==layer)continue;
    const clipsOf=k=>state.clips.filter(c=>c.tid===tr.id&&(!k||c.kind===k)).sort((a,b)=>a.start-b.start);
    if(tr.lyric)all.push(...lyricGroup);
    else if(tr.snd)continue;
    else if(tr.part){for(const c of clipsOf('part')){const im=c.part.shape==='image'?mediaReady(c.part.img):null,tm=c.part.tex==='custom'?mediaReady(c.part.texImg):null;all.push(...memo(next,ck(c,tr,(im?im.g.key:'')+'|'+(tm?tm.g.key:'')),()=>genList(()=>genPart(c,tr,pal))));}}
    else if(tr.imp){for(const c of clipsOf('imp'))all.push(...impSprites(c,tr).filter(s=>s.layer===layer));}
    else if(tr.spec){for(const c of clipsOf('spec'))all.push(...memo(next,ck(c,tr,pcm?pcm.id:'-'),()=>genList(()=>genSpec(c,tr,pal))));}
    else if(tr.kiaiFx){for(const c of clipsOf('kiai'))all.push(...memo(next,ck(c,tr),()=>genList(()=>genKiai(c,tr,pal))));}
    else if(tr.text){for(const c of clipsOf('text'))all.push(...memo(next,ck(c,tr,glyphEpoch+'|'+JSON.stringify(FX_KEYS.map(k=>state[k]))),()=>genList(()=>genText(c,tr,pal))));}
    else if(tr.trans){for(const c of clipsOf('trans'))all.push(...memo(next,ck(c,tr),()=>genList(()=>genTrans(c,tr,pal))));}
    else if(tr.hit){for(const c of clipsOf('hit'))all.push(...memo(next,ck(c,tr),()=>genList(()=>genHit(c,tr,pal))));}
    else for(const c of clipsOf()){const m=mediaReady(c.mid);if(!m)continue;const sp=memo(next,ck(c,tr,m.g.key),()=>[clipSprite(c,tr)].filter(Boolean));all.push(...sp);}}
  for(const s of all)if(!s._c||s.off){compile(s);s._c=true;}
  genMemo=next;sprites=all;gen={sprites:all,lines,duration,kiai};
}
function buildLyrics(lines,kiai,pal){
  const pool=['slam','scatter','vertical'];let prevG=null;
  const gs=(state.lyr.s||100)/100;
  lines.forEach((L,idx)=>{
    /* the global "mix" chain is picked from global settings only, so changing one line never reshuffles the others */
    const rngG=rngFrom(state.seed+idx*7919);let gst=state.style;
    if(gst==='mix'){const opts=pool.filter(p=>p!==prevG);gst=opts[Math.floor(rngG()*opts.length)];}
    prevG=gst;
    const ov=state.lineStyle[L.src.key]||null,ef=lineStyleOf(L.src.key);
    let rng=rngG,st=gst;
    if(ov&&(ov.style!=null||ov.seed!=null)){rng=rngFrom(ef.seed+idx*7919);st=ef.style;
      if(st==='mix'){const opts=pool.filter(p=>p!==(idx?gst:null));st=opts[Math.floor(rng()*opts.length)];}}
    L.style=st;L.custom=!!ov;
    const lp=palOf(ef);
    gctx.font=ef.font;for(const k of FX_KEYS)gctx[k]=ef[k];
    const i0=sprites.length;
    GEN[st](L,{S:L.S,E:L.E,b:L.b,rng,pal:lp,size:ef.size,idx,mixed:ef.style==='mix'});
    const list=sprites.slice(i0),lt=state.lineTf[L.src.key]||{};
    tfSprites(list,{ax:state.lyr.x,ay:state.lyr.y,k:gs*((lt.s||100)/100),dx:lt.dx||0,dy:lt.dy||0});
    for(const s of list)s.lineKey=L.src.key;
  });
}

