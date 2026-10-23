/* 节拍与吸附、随机数、osu! 的 35 种缓动 */
/* ---------- timing ---------- */
function redAt(t){let r=map.red[0];for(const p of map.red){if(p.t<=t)r=p;else break;}return r;}
function beatAt(t){return redAt(t).bl;}
function snap(t,div){if(!div)return t;const r=redAt(t);const st=r.bl/div;return r.t+Math.round((t-r.t)/st)*st;}
function nearestNote(t,within){const N=map.notes||[];if(!N.length)return null;let lo=0,hi=N.length-1;while(lo<hi){const m=(lo+hi)>>1;if(N[m]<t)lo=m+1;else hi=m;}
  let best=null;for(const i of [lo-1,lo]){if(i<0||i>=N.length)continue;if(best==null||Math.abs(N[i]-t)<Math.abs(best-t))best=N[i];}
  return best!=null&&Math.abs(best-t)<=within?best:null;}
function startOf(e){const t=e.t+state.offset;if(!e.text)return t;return e.key&&state.pins[e.key]?t:snapLine(t);}
function snapLine(t){if(state.snapTo==='note'){const n=nearestNote(t,beatAt(t)/2);if(n!=null)return n;}return snap(t,state.snap);}
function charTimesFor(e,S,E){
  if(state.charMode==='off')return null;
  const n=stripChars(e.text).length;if(!n)return null;
  const cl=t=>Math.min(Math.max(t,S),E-60);
  if(e.chars&&e.chars.length){const src=e.chars.map(c=>c.t+state.offset).sort((a,b)=>a-b),m=src.length;
    return Array.from({length:n},(_,i)=>cl(m===n?src[i]:src[Math.round(i*(m-1)/Math.max(1,n-1))]));}
  if(state.charMode==='note'&&map.notes&&map.notes.length){
    const ns=map.notes.filter(t=>t>=S-20&&t<E-60),m=ns.length;if(!m)return null;
    if(m>=n&&m<=2*n)return ns.slice(0,n).map(cl);
    if(m>2*n)return Array.from({length:n},(_,i)=>cl(ns[Math.round(i*(m-1)/Math.max(1,n-1))]));
    const out=ns.slice(),last=ns[m-1],end=Math.max(last+60*(n-m),E-beatAt(S));for(let i=m;i<n;i++)out.push(last+(end-last)*(i-m+1)/(n-m+1));return out.map(cl);}
  return null;
}

/* ---------- rng / easing (all 35 osu! easings) ---------- */
function rngFrom(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const EZ={lin:0,out:1,quadIn:3,cubicOut:7,sineOut:16,expoOut:19,circOut:22,backOut:30};
const bOut=p=>{const n=7.5625,d=2.75;if(p<1/d)return n*p*p;if(p<2/d){p-=1.5/d;return n*p*p+.75;}if(p<2.5/d){p-=2.25/d;return n*p*p+.9375;}p-=2.625/d;return n*p*p+.984375;};
const EIN={quad:p=>p*p,cubic:p=>p*p*p,quart:p=>p**4,quint:p=>p**5,sine:p=>1-Math.cos(p*Math.PI/2),expo:p=>p<=0?0:Math.pow(2,10*p-10),
  circ:p=>1-Math.sqrt(Math.max(0,1-p*p)),back:p=>{const c1=1.70158;return(c1+1)*p*p*p-c1*p*p;},
  elastic:p=>p<=0?0:p>=1?1:-Math.pow(2,10*p-10)*Math.sin((p*10-10.75)*(2*Math.PI)/3),bounce:p=>1-bOut(1-p)};
const eOut=f=>p=>1-f(1-p), eInOut=f=>p=>p<.5?f(2*p)/2:1-f(2-2*p)/2;
const EC=2*Math.PI/0.3;
const EASE_FN={0:p=>p,1:eOut(EIN.quad),2:EIN.quad,3:EIN.quad,4:eOut(EIN.quad),5:eInOut(EIN.quad),6:EIN.cubic,7:eOut(EIN.cubic),8:eInOut(EIN.cubic),
  9:EIN.quart,10:eOut(EIN.quart),11:eInOut(EIN.quart),12:EIN.quint,13:eOut(EIN.quint),14:eInOut(EIN.quint),15:EIN.sine,16:eOut(EIN.sine),17:eInOut(EIN.sine),
  18:EIN.expo,19:eOut(EIN.expo),20:eInOut(EIN.expo),21:EIN.circ,22:eOut(EIN.circ),23:eInOut(EIN.circ),24:EIN.elastic,25:eOut(EIN.elastic),
  26:p=>p>=1?1:Math.pow(2,-10*p)*Math.sin((0.5*p-0.075)*EC)+1,27:p=>p>=1?1:Math.pow(2,-10*p)*Math.sin((0.25*p-0.075)*EC)+1,28:eInOut(EIN.elastic),
  29:EIN.back,30:eOut(EIN.back),31:eInOut(EIN.back),32:EIN.bounce,33:bOut,34:eInOut(EIN.bounce)};
function ease(id,p){p=clamp(p,0,1);const f=EASE_FN[id]||EASE_FN[0];return f(p);}

