/* 击打特效：效果种类、颜色选项、新建时的默认参数 */
const HIT_TYPES=[['ring','圆环扩散'],['thin','细圆环'],['glow','光晕'],['burst','粒子四散'],['star','十字星光'],['square','方框旋转'],['emit','中心发射'],['spark','火花爆发'],['trail','滑条光迹']];

const HIT_COLOR={custom:'自己的颜色',accent:'跟随字幕配色',combo:'跟随 combo 颜色'};

const HIT_DEF=()=>({src:'notes',every:1,types:['ring','burst'],color:'custom',custom:null,size:100,beats:1,count:6,sparkCount:32,sparkDist:100,add:true,ncOnly:false,onEvery:0,onOff:0,sliderEnd:false,spinner:true,follow:false,trailGap:25,trailHold:'end',trailEnd:'scatter',trailDur:2,trailSize:100,trailAlpha:50,trailPuffs:5});

/* 换收尾方式时自动换成适合它的停留和收尾时长：炸散=等滑条结束一起散；收拢/淡出=光点停半拍就走，像彗星尾巴 */
const TRAIL_MODE_DEF={scatter:{hold:'end',dur:2},gather:{hold:0.5,dur:1},fade:{hold:0.5,dur:1}};
const TRAIL_END={scatter:'炸散成小团',gather:'收拢到滑条终点',fade:'原地淡出'};
