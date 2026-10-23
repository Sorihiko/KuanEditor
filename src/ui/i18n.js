/* 界面语言（中文 / English）
   代码和页面里写的都是中文；切到英文时，这里按 config/i18n-en.js 的对照表把页面上的文字换掉：
   - 页面上的文字和 title / placeholder / aria-label 由 MutationObserver 自动换，新出现的也会换；
   - 画在 canvas 上的字（时间轴片段名等）要在代码里用 tl('中文') 包一下；
   - 歌词、文件名这类用户内容不要翻：给元素加 translate="no"。
   对照表里 {} 是“任意内容”（数字、名字），{0} {1} 可以调换顺序。
   在控制台运行 i18nMissing() 可以看到还没有英文的中文句子。 */
const HAN_RE=/[\u4e00-\u9fff]/,PUNCT_ONLY=/^\s*[、，。：；（）]+\s*$/;
let LANG=(()=>{try{const s=localStorage.getItem('kuan-lang');if(s==='zh'||s==='en')return s;}catch(e){}
  const l=(navigator.languages&&navigator.languages[0])||navigator.language||'';return /^zh/i.test(l)?'zh':'en';})();
const I18N=(()=>{
  const exact=new Map(),tpls=[],byFirst=new Map(),missing=new Set(),cache=new Map();
  const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  for(const[k,v]of I18N_EN){
    if(!k.includes('{}')){exact.set(k,v);const f=k[0];if(!byFirst.has(f))byFirst.set(f,[]);byFirst.get(f).push(k);continue;}
    const parts=k.split('{}'),lit=parts.join('').length;
    const body=parts.map(esc).join('([\\s\\S]*?)');
    tpls.push({k,v,lit,full:new RegExp('^'+body+'$'),
      /* 拼接用：最后一个 {} 只吃非汉字，免得把后面的句子吞掉 */
      lead:!parts[0],part:new RegExp(parts.map(esc).join('([\\s\\S]*?)').replace(/\(\[\\s\\S\]\*\?\)$/,'([^\\u4e00-\\u9fff「“『]*)'),'y')});}
  for(const a of byFirst.values())a.sort((x,y)=>y.length-x.length);
  tpls.sort((a,b)=>b.lit-a.lit);
  /* “1 items” → “1 item” */
  const ONE=/(^|[^\d.,])1 (item|use|sprite|sample|image|clip|line|frame|bar|trigger|section|kiai section|character|beat|note|grain|track|glyph image|command line|red line)s\b/g;
  const fill=(v,caps)=>{let i=0;return v.replace(/\{(\d?)\}/g,(m,n)=>{const c=caps[n===''?i++:+n];return c==null?'':sub(c);}).replace(ONE,'$11 $2').replace(/(^|[^\d.,])1 difficulties/g,'$11 difficulty');};
  /* 填进 {} 的内容（名字、数字）：只整句对照，不拆 */
  const sub=s=>{if(!HAN_RE.test(s))return s;const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(s);const r=whole(m[2]);return r==null?s:m[1]+r+m[3];};
  /* 引号里的内容只认带 {} 的句式（比如默认轨道名「图片 2」），不认单个词，免得把歌词翻掉 */
  function tplOnly(s){for(const t of tpls){const m=t.full.exec(s);if(m)return fill(t.v,m.slice(1));}return null;}
  function whole(s){
    if(exact.has(s))return exact.get(s);
    for(const t of tpls){const m=t.full.exec(s);if(m)return fill(t.v,m.slice(1));}
    return null;}
  const QUOTE={'「':'」','“':'”','『':'』'};
  const PUNCT={'。':'.','，':', ','：':': ','；':'; ','、':', ','（':' (','）':')','！':'!','？':'?'};
  const DECO=/^([\s✓✦✧♪⚠↻⚡✺⇋·•‹›→←—–\-:：、,，.。;；!！?？0-9×%+=()（）\[\]【】"'*/　]*)([\s\S]*?)([\s✓·•‹›→←—–\-:：、,，.。;；!！?？0-9×%+=()（）\[\]【】"'*/　…▾]*)$/;
  function core(s){
    let r=whole(s);if(r!=null)return r;
    const d=DECO.exec(s);
    if(d&&(d[1]||d[3])&&d[2]){r=whole(d[2]);if(r!=null)return d[1]+r+d[3];}
    /* 几段拼起来的句子：从左到右每次找最长能对上的一段 */
    let out='',i=0,ok=true;
    while(i<s.length){
      /* 「」“”里是歌词、名字这类用户内容，原样保留 */
      const q=QUOTE[s[i]];if(q){const j=s.indexOf(q,i+1);if(j>0){const inner=s.slice(i+1,j);out+=s[i]+(tplOnly(inner)??inner)+q;i=j+1;continue;}}
      let best=null,bl=0;
      for(const k of byFirst.get(s[i])||[]){if(k.length<=bl||k.length<2)break;if(s.startsWith(k,i)){best=exact.get(k);bl=k.length;break;}}
      for(const t of tpls){if((t.lead&&i>0)||t.lit<=bl)continue;t.part.lastIndex=i;const m=t.part.exec(s);if(m&&m[0].length>bl){best=fill(t.v,m.slice(1));bl=m[0].length;}}
      if(best!=null){
        /* 英文片段之间补空格 */
        if(out&&/[A-Za-z0-9)”.!?;:,]$/.test(out)&&/^[A-Za-z(“]/.test(best))out+=' ';
        out+=best;i+=bl;continue;}
      if(HAN_RE.test(s[i]))ok=false;
      /* 英文后面跟着的中文标点换成英文标点 */
      const pc=PUNCT[s[i]];
      if(pc!=null&&/[\x21-\x7e’”]$/.test(out)){out+=pc;i++;if(pc.endsWith(' ')&&s[i]===' ')i++;continue;}
      if(out.endsWith(':')&&!/\s/.test(s[i]))out+=' ';
      out+=s[i];i++;}
    if(!ok)missing.add(s);
    return out;}
  function tr(s){
    if(LANG==='zh'||!s)return s;
    if(!HAN_RE.test(s))return PUNCT_ONLY.test(s)?s.replace(/[、，。：；（）]/g,c=>PUNCT[c]):s;
    let r=cache.get(s);if(r!==undefined)return r;
    const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(s);r=m[1]+core(m[2])+m[3];
    if(cache.size>4000)cache.clear();cache.set(s,r);return r;}
  return{tr,missing,exact};
})();
const tl=s=>I18N.tr(String(s));
window.i18nMissing=()=>[...I18N.missing];

/* ---------- 把页面上的字换掉 / 换回来 ---------- */
const I18N_ATTRS=['title','placeholder','aria-label'];
const i18nText=new WeakMap(),i18nAttr=new WeakMap();
const i18nSkip=el=>!el||!!el.closest('[translate="no"],textarea,script,style');
function i18nNode(n){
  const rec=i18nText.get(n),cur=n.data;
  if(rec&&cur===rec.out){if(LANG==='zh'){n.data=rec.zh;i18nText.delete(n);}else if(rec.lang!==LANG){/* 以后多语言用 */}return;}
  if(LANG==='zh'||!(HAN_RE.test(cur)||PUNCT_ONLY.test(cur)))return;
  if(i18nSkip(n.parentElement)||n.parentElement.isContentEditable)return;
  const out=tl(cur);if(out!==cur){i18nText.set(n,{zh:cur,out,lang:LANG});n.data=out;}}
function i18nEl(el){
  let rec=i18nAttr.get(el);
  for(const a of I18N_ATTRS){const v=el.getAttribute(a);if(v==null)continue;
    const r=rec&&rec[a];
    if(r&&v===r.out){if(LANG==='zh'){el.setAttribute(a,r.zh);delete rec[a];}continue;}
    if(LANG==='zh'||!HAN_RE.test(v)||el.closest('[translate="no"]'))continue;
    const out=tl(v);if(out!==v){if(!rec){rec={};i18nAttr.set(el,rec);}rec[a]={zh:v,out};el.setAttribute(a,out);}}}
function i18nWalk(root){
  if(!root)return;
  if(root.nodeType===3){i18nNode(root);return;}
  if(root.nodeType!==1&&root.nodeType!==11)return;
  if(root.nodeType===1)i18nEl(root);
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n;
  while((n=w.nextNode()))n.nodeType===3?i18nNode(n):i18nEl(n);}
let i18nBusy=false;
const i18nObs=new MutationObserver(list=>{
  if(i18nBusy)return;i18nBusy=true;
  try{for(const m of list){
    if(m.type==='characterData')i18nNode(m.target);
    else if(m.type==='attributes')i18nEl(m.target);
    else for(const n of m.addedNodes)i18nWalk(n);}}
  finally{i18nObs.takeRecords();i18nBusy=false;}});
function i18nStart(){
  document.documentElement.lang=LANG==='zh'?'zh-CN':'en';
  i18nWalk(document.body);document.title=tl(document.title);
  i18nObs.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:I18N_ATTRS});}
const I18N_HOOKS=[];
function setLang(l){
  if(l!==LANG&&(l==='zh'||l==='en')){
    try{localStorage.setItem('kuan-lang',l);}catch(e){}
    const zhTitle=i18nTitle;LANG=l;document.documentElement.lang=l==='zh'?'zh-CN':'en';
    i18nWalk(document.body);i18nObs.takeRecords();document.title=tl(zhTitle);
    for(const f of I18N_HOOKS){try{f();}catch(e){console.error(e);}}}
}
const i18nTitle=document.title;
/* i18nStart() 在所有脚本跑完后由 menubar.js 调用：面板、页签都建好了再翻，复制出来的元素也能记住中文原文 */
