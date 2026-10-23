/* 片段类型名称、标签颜色、“新建”面板的条目 */
const KIND_NAME={img:'图片',kiai:'Kiai 特效',hit:'击打特效',spec:'频谱',part:'粒子',imp:'导入的 .osb',snd:'音效',text:'文字',trans:'转场'};

const CLIP_LABELS={red:['红','#b8434b'],orange:['橙','#c06f2c'],yellow:['黄','#b39222'],green:['绿','#3b8a50'],teal:['青','#2a8b85'],blue:['蓝','#3866b3'],purple:['紫','#7650b4'],pink:['粉','#b44f88'],gray:['灰','#5d6470']};

const GEN_ITEMS=[
  {k:'img',name:'图片轨道',desc:'放图片、帧动画，可做关键帧',fn:o=>addTrack(o)},
  {k:'snd',name:'音效轨道',desc:'放 .wav / .ogg 音效，导出为 Sample',fn:()=>addSoundTrack()},
  {k:'hit',name:'击打特效',desc:'在 note 或每隔几拍上出光圈、光点',fn:o=>addHitFx(o)},
  {k:'kiai',name:'Kiai 特效',desc:'每段 kiai：开头全屏闪光、期间上下边框随拍闪',fn:o=>addKiaiClips(o)},
  {k:'spec',name:'音频频谱',desc:'跟着音乐跳动的柱状 / 圆形频谱',fn:o=>addSpectrum(o)},
  {k:'text',name:'文字',desc:'任意文字：标题、名牌、提示，可加底卡',fn:o=>addScreenFx('text',o)},
  {k:'trans',name:'转场',desc:'擦除、闪白、渐暗 / 渐亮，切段落用',fn:o=>addScreenFx('trans',o)},
  {k:'part',name:'粒子',desc:'下雪、光点、环绕等，在右边换预设',fn:o=>addParticles(o)}];
