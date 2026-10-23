/* 内置示例谱面 / 歌词，以及字体、配色、图层、缓动等基础常量 */
/* ---------- sample material ---------- */
const SAMPLE_OSU=`osu file format v14

[General]
AudioFilename: audio.mp3

[Metadata]
Title:Night Signal
TitleUnicode:夜间信号
Artist:Sample Artist
ArtistUnicode:示例歌手
Creator:Sorihiko
Version:Lyric Test

[Difficulty]
CircleSize:4
OverallDifficulty:8
ApproachRate:9
SliderMultiplier:1.6
SliderTickRate:1

[Events]
0,0,"bg.jpg",0,0

[TimingPoints]
420,352.941176470588,4,2,1,60,1,0
22000,-100,4,2,1,70,0,1
44580,-100,4,2,1,60,0,0
`;
const SAMPLE_LRC=`[00:01.80]把今晚的信号
[00:04.60]调到*最亮*的频道
[00:07.40]我在拍子之间/等你回答
[00:11.60]屏幕那头的光
[00:14.40]一格一格*亮起来*
[00:18.00]别让这首歌停下
[00:22.00]*跳*过所有的犹豫
[00:24.80]让节奏替我说话
[00:27.60]Full combo 的梦/还没醒
[00:31.80]再一次 *点下去*
[00:35.00]心跳和鼓点重叠
[00:38.40]这一秒/不需要答案
[00:42.20]*亮*到最后
[00:46.00]`;
/* 桌面版（发给别人用的）不带示例：打开时是一张空谱面（120 BPM、没有 note），等用户打开自己的谱面 */
const NO_SAMPLE=typeof window!=='undefined'&&!!window.KUAN_DESKTOP;
function blankOsu(){return`osu file format v14

[General]
AudioFilename: audio.mp3

[Metadata]
Title:No beatmap
TitleUnicode:未载入谱面
Artist:
Version:

[Difficulty]
CircleSize:4

[TimingPoints]
0,500,4,2,1,60,1,0

[HitObjects]
`;}
const startOsu=()=>NO_SAMPLE?blankOsu():sampleOsu();
function sampleOsu(){const bl=352.941176470588,o=420,h=bl/2,ent=parseLrc(SAMPLE_LRC),rows=[];
  ent.forEach((e,i)=>{if(!e.text)return;const n=stripChars(e.text).length,next=i+1<ent.length?ent[i+1].t:e.t+8*bl;let k=Math.round((e.t-o)/h);
    for(let j=0;j<n;j++){const t=Math.round(o+(k+j)*h);if(t>=next-h/2)break;const x=64+((j*97)%384),y=96+((j*53+i*31)%192);
      if(j%5===3){const d=x>256?-1:1;rows.push(`${x},${y},${t},2,0,B|${x+d*40}:${y-30}|${x+d*70}:${y},1,70`);}
      else rows.push(`${x},${y},${t},${j?1:5},0,0:0:0:0:`);}});
  return SAMPLE_OSU+'\n[HitObjects]\n'+rows.join('\n')+'\n';}

const LAYERS=['Background','Fail','Pass','Foreground','Overlay'];
const LAYER_NAME={Background:'背景',Fail:'失败',Pass:'通过',Foreground:'前景',Overlay:'叠加'};
const ORIGINS={TopLeft:[0,0],TopCentre:[.5,0],TopRight:[1,0],CentreLeft:[0,.5],Centre:[.5,.5],CentreRight:[1,.5],BottomLeft:[0,1],BottomCentre:[.5,1],BottomRight:[1,1]};
const ORIGIN_NAME={TopLeft:'左上',TopCentre:'上中',TopRight:'右上',CentreLeft:'左中',Centre:'中心',CentreRight:'右中',BottomLeft:'左下',BottomCentre:'下中',BottomRight:'右下'};
const PROPS=[
  {k:'p',name:'位置',dims:['X','Y'],def:[320,240],step:1,dec:0},
  {k:'s',name:'缩放',dims:['%'],def:[100],step:1,dec:1},
  {k:'v',name:'宽 / 高',dims:['宽%','高%'],def:[100,100],step:1,dec:1},
  {k:'r',name:'旋转',dims:['°'],def:[0],step:1,dec:1},
  {k:'a',name:'不透明度',dims:['%'],def:[100],step:1,dec:0,min:0,max:100},
  {k:'c',name:'颜色',dims:['color'],def:[255,255,255]},
];
const PROP=Object.fromEntries(PROPS.map(p=>[p.k,p]));
const EASES=[[0,'线性'],[1,'缓出'],[2,'缓入'],[4,'Quad 缓出'],[3,'Quad 缓入'],[5,'Quad 缓入缓出'],[7,'Cubic 缓出'],[6,'Cubic 缓入'],[8,'Cubic 缓入缓出'],
  [10,'Quart 缓出'],[9,'Quart 缓入'],[13,'Quint 缓出'],[16,'Sine 缓出'],[15,'Sine 缓入'],[17,'Sine 缓入缓出'],[19,'Expo 缓出'],[18,'Expo 缓入'],[20,'Expo 缓入缓出'],
  [22,'Circ 缓出'],[21,'Circ 缓入'],[30,'Back 缓出（回弹）'],[29,'Back 缓入'],[31,'Back 缓入缓出'],[25,'Elastic 缓出（弹性）'],[26,'Elastic 半程'],[27,'Elastic 四分之一'],
  [33,'Bounce 缓出（落地弹跳）'],[32,'Bounce 缓入'],[34,'Bounce 缓入缓出']];

