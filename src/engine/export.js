/* .osb 文本输出的数字格式 */
/* ---------- export ---------- */
let fmtDec=4;
function fmt(n){return Number.isInteger(n)?String(n):String(+n.toFixed(fmtDec));}
function cmdLine(c,ind){
  const same=c.a.length===c.b.length&&c.a.every((v,i)=>v===c.b[i]);
  let vals;
  if(c.type==='P')vals=[c.a[0]];
  else{vals=same?c.a:[...c.a,...c.b];vals=c.type==='M'||c.type==='MX'||c.type==='MY'||c.type==='C'?vals.map(v=>Math.round(v)):vals.map(fmt);}
  return `${ind}${c.type},${c.ease},${c.t0},${c.t1===c.t0?'':c.t1},${vals.join(',')}`;
}
const LAYER_HEAD={Background:'//Storyboard Layer 0 (Background)',Fail:'//Storyboard Layer 1 (Fail)',Pass:'//Storyboard Layer 2 (Pass)',Foreground:'//Storyboard Layer 3 (Foreground)',Overlay:'//Storyboard Layer 4 (Overlay)'};
