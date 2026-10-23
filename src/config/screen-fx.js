/* 文字片段、转场片段：新建时的默认参数和选项名称 */

/* ---- 文字 ---- */
const TEXT_DEF=()=>({text:'Kiai *Time*!',font:'sans',size:40,x:320,y:240,rot:0,track:4,color:'custom',custom:[255,255,255],alpha:100,
  inAnim:'pop',outAnim:'fade',inBeats:1,outBeats:1,card:false,cardCol:null,cardAlpha:85,cardTilt:-6,cardPad:14,flash:false,flashCol:null,add:false});
const TEXT_IN={pop:'弹出放大',fade:'淡入',up:'从下往上',left:'从左滑入',type:'打字机（一个字一个字）',none:'直接出现'};
const TEXT_OUT={fade:'淡出',down:'往下淡出',zoom:'放大淡出',none:'直接消失'};
const TEXT_COLOR={custom:'自己的颜色',accent:'跟随字幕配色'};

/* ---- 转场 ---- */
const TRANS_DEF=()=>({type:'wipe',dir:'down',mode:'cover',color:'custom',custom:[0,0,0],alpha:100,add:false});
const TRANS_TYPE={wipe:'擦除（色块划过）',flash:'闪白（一下子亮再消失）',fadeout:'渐暗到颜色',fadein:'从颜色渐亮'};
const TRANS_DIR={down:'从上往下',up:'从下往上',right:'从左往右',left:'从右往左'};
const TRANS_MODE={cover:'盖上（片段结束时整屏是颜色）',reveal:'揭开（片段开始时整屏是颜色）',both:'盖上再揭开'};

