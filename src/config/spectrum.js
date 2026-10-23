/* 音频频谱：新建时的默认参数 */
const SPEC_DEF=()=>({shape:'bars',n:32,x:320,y:440,width:600,radius:90,barW:0,maxH:120,minH:2,mirror:false,fmin:40,fmax:12000,div:8,smooth:0.35,tol:2,color:'custom',custom:null,alpha:85,add:true,tex:'solid',texImg:null});

/* 柱子的样子：实心矩形 / 柔光柱（软边，像雾） / 光团（圆形柔光，随音量变大） / 自己的图片 */
const SPEC_TEX=[['solid','实心'],['soft','柔光柱'],['blob','光团'],['custom','自己的图片']];
