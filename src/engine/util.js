/* 通用小工具：$、clamp、uid */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
/* an effect created now gets its own colour, taken from the current lyric palette once (later palette changes don't touch it) */
function ownColors(o,keys){const pal=palOf(state);for(const[k,src]of keys)if(o[k]==null)o[k]=(src==='flash'?pal.flash:pal.accent).slice();return o;}
const uid=()=>Math.random().toString(36).slice(2,9);

