/* 粒子：默认参数、预设（下雪 / 下雨 …）、贴图种类 */
const PART_DEF=()=>({preset:'snow',tex:'dot',count:60,life:7000,shape:'line',x:320,y:-20,spread:440,angle:-90,angleSpread:25,speed:70,size:10,sizeVar:60,color:'custom',custom:[255,255,255],colorVar:30,alpha:85,add:false,spin:0,ease:0,fadeIn:20,fadeOut:20});

const PART_PRESETS={
  snow:['下雪',{tex:'dot',count:60,life:7000,shape:'line',x:320,y:-20,spread:440,angle:-90,angleSpread:25,speed:70,size:10,sizeVar:60,color:'custom',custom:[255,255,255],colorVar:20,alpha:85,add:false,spin:0,ease:0,fadeIn:15,fadeOut:20}],
  rain:['下雨',{tex:'streak',count:140,life:900,shape:'line',x:300,y:-40,spread:520,angle:-100,angleSpread:3,speed:700,size:28,sizeVar:35,color:'custom',custom:[190,210,235],colorVar:15,alpha:55,add:false,spin:0,ease:0,fadeIn:5,fadeOut:8,align:true,randRot:false}],
  rise:['上升光点',{tex:'glow',count:30,life:6000,shape:'line',x:320,y:500,spread:440,angle:90,angleSpread:30,speed:60,size:26,sizeVar:60,color:'custom',custom:null,colorVar:40,alpha:70,add:true,spin:0,ease:0,fadeIn:25,fadeOut:35}],
  petal:['花瓣',{tex:'petal',count:36,life:8000,shape:'line',x:420,y:-30,spread:480,angle:-115,angleSpread:35,speed:75,size:14,sizeVar:40,color:'custom',custom:[255,176,206],colorVar:25,alpha:90,add:false,spin:120,ease:0,fadeIn:10,fadeOut:20}],
  twinkle:['星星闪烁',{tex:'star',count:40,life:2400,shape:'circle',x:320,y:240,spread:420,angle:90,angleSpread:360,speed:4,size:16,sizeVar:70,color:'custom',custom:[255,246,214],colorVar:20,alpha:90,add:true,spin:45,ease:0,fadeIn:45,fadeOut:45}],
  picture:['图片聚散',{tex:'dot',shape:'image',x:320,y:240,width:360,step:9,size:8,sizeVar:30,spread:320,speed:260,color:'image',colorVar:0,alpha:100,add:false,spin:0,ease:19,fadeIn:30,fadeOut:30}],
  suck:['向中心吸入',{tex:'glow',count:80,life:1100,shape:'circle',motion:'in',x:320,y:240,spread:430,angle:0,angleSpread:0,speed:0,size:16,sizeVar:50,color:'custom',custom:null,colorVar:30,alpha:85,add:true,spin:0,ease:3,fadeIn:25,fadeOut:10,shrinkTo:30}],
  orbit:['环绕光点',{tex:'glow',count:40,life:4000,shape:'circle',motion:'orbit',x:320,y:240,spread:260,angle:0,angleSpread:0,speed:70,size:18,sizeVar:50,color:'custom',custom:null,colorVar:30,alpha:75,add:true,spin:0,ease:0,fadeIn:20,fadeOut:20,orbitDir:'mix',tilt:100}],
  burst:['中心散射',{tex:'glow',count:50,life:2000,shape:'circle',x:320,y:240,spread:12,angle:0,angleSpread:360,speed:220,size:18,sizeVar:50,color:'custom',custom:null,colorVar:40,alpha:90,add:true,spin:0,ease:19,fadeIn:5,fadeOut:50}],
};

/* 运动方式：沿方向飘 / 从四周吸向中心 / 绕中心转圈 */
const PART_MOTION=[['dir','沿方向飘'],['in','向中心吸入'],['orbit','绕中心转圈']];
const ORBIT_DIR=[['mix','顺逆都有'],['cw','顺时针'],['ccw','逆时针']];

const PART_TEX=[['dot','圆点'],['glow','光晕'],['star','星光'],['petal','花瓣'],['streak','雨丝'],['ring','圆环'],['square','方框'],['custom','自定义图片']];
