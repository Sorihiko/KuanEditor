"""把 Kuan.html 变成离线版放进 app/：字体和 JSZip 用本地文件，不再连 Google / cdnjs；不带示例谱面。"""
import re,os
D=os.path.dirname(os.path.abspath(__file__))
s=open(os.path.join(D,'..','Kuan.html'),encoding='utf-8').read()
s=re.sub(r'<link rel="preconnect"[^>]*>\s*','',s)
s,n1=re.subn(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^"]*">','<link rel="stylesheet" href="fonts/fonts.css">',s)
s,n2=re.subn(r'<script src="https://cdnjs\.cloudflare\.com/ajax/libs/jszip/[^"]*"></script>','<script src="jszip.min.js"></script>',s)
assert n1==1 and n2==1,(n1,n2)
# 桌面版是发给别人用的：不带示例谱面 / 示例歌词，打开就是空的
s,n3=re.subn(r'<meta charset="utf-8">','<meta charset="utf-8">\n<script>window.KUAN_DESKTOP=true</script>',s,count=1)
assert n3==1
open(os.path.join(D,'app','index.html'),'w',encoding='utf-8').write(s);print('app/index.html',len(s))
