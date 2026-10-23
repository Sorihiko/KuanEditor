/* 文字字形图片的生成与染色缓存 */
/* ---------- glyphs ---------- */
const GP=128,PAD=14;const glyphCache=new Map();
const gctx={font:'sans'};   /* font + text effects of the line being generated (see FX_KEYS) */
for(const k of FX_KEYS)gctx[k]=state[k];
const rgbS=(c,a)=>`rgba(${c[0]},${c[1]},${c[2]},${a==null?1:a})`;
function getGlyph(ch){
  const G=gctx,key=JSON.stringify([G.font,...FX_KEYS.map(k=>G[k]),ch]);
  let g=glyphCache.get(key);if(g)return g;
  const c=document.createElement('canvas'),x=c.getContext('2d');
  const font=`900 ${GP}px ${FONTS[G.font]||FONTS.sans}, "Noto Sans SC", sans-serif`;
  x.font=font;const adv=Math.max(x.measureText(ch).width,GP*0.25);
  const sw=G.outline?clamp(+G.olW||0,0,40):0;
  const extra=Math.max(sw/2,G.glow?(+G.glR||0)*1.3:0,G.shadow?(+G.shDist||0)+(+G.shBlur||0)*1.5:0);
  const pad=PAD+Math.ceil(extra);
  c.width=Math.ceil(adv+pad*2);c.height=Math.ceil(GP*1.3+pad*2);
  x.font=font;x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';
  const cx2=c.width/2,cy2=c.height/2+GP*0.03;
  const body=(fill,stroke)=>{if(sw){x.lineWidth=sw;x.strokeStyle=stroke;x.strokeText(ch,cx2,cy2);}x.fillStyle=fill;x.fillText(ch,cx2,cy2);};
  if(G.glow&&G.glR>0){x.save();x.shadowColor=rgbS(G.glCol);x.shadowBlur=+G.glR;for(let i=0;i<3;i++)body(rgbS(G.glCol),rgbS(G.glCol));x.restore();}
  if(G.shadow){x.save();x.shadowColor=rgbS(G.shCol,0.85);x.shadowBlur=+G.shBlur||0;x.shadowOffsetX=x.shadowOffsetY=(+G.shDist||0)*0.7071;body(rgbS(G.shCol),rgbS(G.shCol));x.restore();}
  let fill='#fff';if(G.grad){const gr=x.createLinearGradient(0,cy2-GP*0.5,0,cy2+GP*0.5);gr.addColorStop(0,rgbS(G.grA));gr.addColorStop(1,rgbS(G.grB));fill=gr;}
  body(fill,rgbS(G.olCol));
  g={key,ch,canvas:c,w:c.width,h:c.height,adv,tints:new Map()};glyphCache.set(key,g);
  if(glyphCache.size>3000)glyphCache.delete(glyphCache.keys().next().value);
  return g;
}
function tinted(g,col){
  const k=col.join(',');if(k==='255,255,255')return g.canvas;
  let c=g.tints.get(k);if(c)return c;
  c=document.createElement('canvas');c.width=g.w;c.height=g.h;const x=c.getContext('2d');
  x.drawImage(g.canvas,0,0,g.w,g.h);x.globalCompositeOperation='multiply';x.fillStyle=`rgb(${k})`;x.fillRect(0,0,g.w,g.h);
  x.globalCompositeOperation='destination-in';x.drawImage(g.canvas,0,0,g.w,g.h);
  if(g.tints.size>256)g.tints.clear();g.tints.set(k,c);return c;
}

