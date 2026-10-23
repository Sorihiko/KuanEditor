/* 项目状态 state 的默认值与读取 */
/* ---------- state ---------- */
const DEFAULT_TRACKS=()=>[{id:'v2',name:'图片 2',layer:'Foreground'},{id:'lyrics',name:'歌词',layer:'Foreground',lyric:true},{id:'v1',name:'图片 1',layer:'Background'}];
const state={style:'mix',palette:'rose',font:'sans',seed:2027,size:46,outline:true,offset:0,snap:2,snapTo:'beat',charMode:'note',guide:true,
  lrc:NO_SAMPLE?'':SAMPLE_LRC,pins:{},lyr:{x:320,y:240,s:100},lineTf:{},lineStyle:{},media:[],tracks:DEFAULT_TRACKS(),clips:[],magnet:true,showNotes:true,diffVer:null,autoSave:false,pvPass:true,lrcSrc:null,vol:50,muted:false,rate:1,solo:null,pvBg:30,noteAlpha:60,optimize:true,
  cText:[255,255,255],cAccent:[120,200,255],
  olW:16,olCol:[0,0,0],shadow:false,shCol:[0,0,0],shDist:8,shBlur:6,glow:false,glCol:[255,72,140],glR:18,grad:false,grA:[255,255,255],grB:[255,160,200]};
const FX_KEYS=['outline','olW','olCol','shadow','shCol','shDist','shBlur','glow','glCol','glR','grad','grA','grB'];
const STYLE_KEYS=['style','palette','cText','cAccent','font','size','seed',...FX_KEYS];
/* palette of a resolved style; 'custom' is built from the user's two colours */
function palOf(ef){if(ef.palette==='custom'){const t=ef.cText||[255,255,255],a=ef.cAccent||[255,72,140];return{id:'custom',name:'自定义',text:t,accent:a,flash:a.map(v=>Math.round(v+(255-v)*0.7))};}
  return PALETTES.find(p=>p.id===ef.palette)||PALETTES[0];}
try{const s=JSON.parse(localStorage.getItem('kuan-opts')||'null');if(s&&typeof s==='object')Object.assign(state,s);}catch(e){}
function sanitizeState(){
  for(const k of Object.keys(state))if(/^jz|^engine$/.test(k))delete state[k];
  if(NO_SAMPLE&&state.lrc===SAMPLE_LRC)state.lrc='';   /* 桌面版：以前存下来的示例歌词也清掉 */
  if(!state.pins||typeof state.pins!=='object')state.pins={};
  if(!state.lineTf||typeof state.lineTf!=='object')state.lineTf={};
  if(!state.lineStyle||typeof state.lineStyle!=='object')state.lineStyle={};
  if(!state.lyr||typeof state.lyr!=='object')state.lyr={x:320,y:240,s:100};
  if(!Array.isArray(state.media))state.media=[];
  if(!Array.isArray(state.clips))state.clips=[];
  if(!Array.isArray(state.tracks)||!state.tracks.length)state.tracks=DEFAULT_TRACKS();
  if(!state.tracks.some(t=>t.lyric))state.tracks.splice(1,0,{id:'lyrics',name:'歌词',layer:'Foreground',lyric:true});
  state.tracks=state.tracks.filter(t=>!t.strobe);   /* 频闪条纹已删除：去掉旧项目里的那条轨道 */
  const ids=new Set(state.tracks.map(t=>t.id));state.clips=state.clips.filter(c=>{if(!ids.has(c.tid))return false;const tr=state.tracks.find(t=>t.id===c.tid);
    if(c.kind==='snd')return!!tr.snd;
    if(c.kind==='kiai')return!!(c.kiai&&tr.kiaiFx);
    if(c.kind==='text'||c.kind==='trans')return!!(c[c.kind]&&tr[c.kind]);
    return c.kind==='hit'?!!(c.hit&&tr.hit):c.kind==='spec'?!!(c.spec&&tr.spec):c.kind==='part'?!!(c.part&&tr.part):c.kind==='imp'?!!tr.imp:!!(c.props&&!tr.kiaiFx&&!tr.hit&&!tr.spec&&!tr.part&&!tr.imp&&!tr.snd&&!tr.text&&!tr.trans&&!tr.strobe);});
}
sanitizeState();
let maps=[];   /* loaded difficulties: {file, text, ver} – map is the parsed current one */
let map=null, mapIsSample=true, audioName=null, bgImg=null, bgName=null, lrcName=null;
let gen={sprites:[],lines:[],duration:30000,kiai:[]};

