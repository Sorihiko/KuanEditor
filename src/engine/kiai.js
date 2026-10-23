/* Kiai 特效片段：片段开始时全屏闪光，片段期间上下边框随拍闪 */
function newKiaiClip(tid,start,end){return{id:uid(),kind:'kiai',tid,start:Math.round(start),end:Math.round(end),kiai:ownColors(KIAI_DEF(),[['custom','accent'],['flashCol','flash']])};}
function genKiai(c,tr,pal){
  const q=c.kiai,s0=c.start,b=beatAt(s0),fl=q.color==='custom'?(q.flashCol||q.custom):pal.flash,ac=q.color==='custom'?q.custom:pal.accent;
  const tag=s=>{s.style='fx';s.kiaiId=c.id;s.layer=tr.layer;s.tid=tr.id;return s;};
  if(q.flash){const fb=b*(q.flashBeats||2),p=tag(spr(null,320,240));cmd(p,'V',0,s0,s0,[860,480]);cmd(p,'F',EZ.out,s0,s0+fb,clamp(q.flashAlpha??55,0,100)/100,0);colorAt(p,fl,s0);if(q.add)cmd(p,'P',0,s0,s0+fb,'A');}
  if(q.pulse){const bi=Math.max(20,Math.round(b*(q.every||1))),count=Math.max(1,Math.floor((c.end-s0)/bi)),h=clamp(q.pulseH||6,1,120),a=clamp(q.pulseAlpha??70,0,100)/100;
    for(const y of [h/2,480-h/2]){const p=tag(spr(null,320,y));cmd(p,'V',0,s0,s0,[860,h]);colorAt(p,ac,s0);if(q.add)cmd(p,'P',0,s0,s0,'A');
      p.loops.push({start:Math.round(s0),count,cmds:[{type:'F',ease:EZ.out,t0:0,t1:Math.round(bi*0.9),a:[a],b:[0]},{type:'F',ease:0,t0:Math.round(bi*0.9),t1:bi,a:[0],b:[0]}]});}}
}
