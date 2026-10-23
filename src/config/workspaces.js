/* 内置工作区（面板布局）：G(页签…) = 一组页签，r = 左右排列，c = 上下排列，s = 各部分比例 */
const G=(...p)=>({t:'g',p,a:p[0]});

const TL=()=>({t:'tools'}),withTools=f=>()=>{const t=f();return t.t==='r'?{t:'r',k:[TL(),...t.k],s:[1,...t.s]}:{t:'r',k:[TL(),t],s:[1,99]};};

const DOCK_PRESETS={
  '默认':withTools(()=>({t:'c',k:[{t:'r',k:[G('pane-bin','pane-lrc','pane-map','pane-gen'),G('pg-mon'),G('pane-fx','pane-style','pane-out')],s:[21,55,24]},G('pg-tl')],s:[62,38]})),
  '歌词':withTools(()=>({t:'c',k:[{t:'r',k:[G('pane-lrc','pane-bin','pane-map','pane-gen'),G('pg-mon'),G('pane-style','pane-fx','pane-out')],s:[26,48,26]},G('pg-tl')],s:[58,42]})),
  '特效':withTools(()=>({t:'c',k:[{t:'r',k:[G('pane-gen','pane-bin','pane-lrc','pane-map'),G('pg-mon'),G('pane-fx','pane-style','pane-out')],s:[20,50,30]},G('pg-tl')],s:[62,38]})),
  '大监视器':withTools(()=>({t:'r',k:[{t:'c',k:[G('pg-mon'),G('pg-tl')],s:[66,34]},{t:'c',k:[G('pane-fx','pane-style','pane-out'),G('pane-bin','pane-lrc','pane-map','pane-gen')],s:[58,42]}],s:[74,26]}))};
