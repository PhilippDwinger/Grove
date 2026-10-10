# Erzeugt src/js/laub/galerie-daten.js aus docs/design/ANIMATIONEN.md
# Aufruf im Grove-Ordner:  python docs/design/galerie-erzeugen.py
import re, json
import os
R=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..') + os.sep
md=open(R+'docs/design/ANIMATIONEN.md',encoding='utf-8').read()
HEX={'#E3A15A':'--amber','#F2C08A':'--amber-light','#1C1420':'--ground','#160F19':'--ground-deep','#2A1F2C':'--surface-hi',
     '#241A27':'--surface','#3A2C3D':'--border-hi','#2E2231':'--border','#CDBFAE':'--text-soft','#EFE6D6':'--text','#A8957F':'--muted'}
def tag_umbauen(m):
    t=m.group(0)
    farben=[]
    def weg(a):
        nonlocal t
        mm=re.search(r'\s'+a+r'="(#[0-9A-Fa-f]{6})"',t)
        if mm and mm.group(1).upper() in HEX:
            farben.append(f'{a}:var({HEX[mm.group(1).upper()]})'); t=t.replace(mm.group(0),'',1)
    weg('fill'); weg('stroke')
    if not farben: return t
    st=re.search(r'\sstyle="([^"]*)"',t)
    if st: t=t.replace(st.group(0),f' style="{";".join(farben)};{st.group(1)}"',1)
    else: t=re.sub(r'^<(\w+)',lambda x:f'<{x.group(1)} style="{";".join(farben)}"',t,count=1)
    return t
eintraege=[]
for m in re.finditer(r'^## (\d+) · (.+?)\n\n(.+?)\n\n- \*\*Klasse:\*\*.*?\n- \*\*Idee für:\*\* (.+?)\n\n```html\n(.*?)\n```',md,re.S|re.M):
    nr,name,text,idee,snip=int(m.group(1)),m.group(2),m.group(3).strip(),m.group(4),m.group(5)
    snip=re.sub(r'<\w+[^<>]*>',tag_umbauen,snip)
    eintraege.append({'nr':nr,'name':name,'text':text,'idee':idee,'html':snip})
assert eintraege, "keine Animationen gefunden"
js="""// ==========================================================
// Laub · Galerie aller Animationen (01–44)
// AUTOMATISCH ERZEUGT aus docs/design/ANIMATIONEN.md – nicht von Hand ändern.
// Feste Farben aus den Snippets sind hier auf Thema-Variablen umgestellt.
// ==========================================================
export const GALERIE = """+json.dumps(eintraege,ensure_ascii=False,indent=1)+"\n"
open(R+'src/js/laub/galerie-daten.js','w',encoding='utf-8').write(js)
print(len(eintraege), sum(e['html'].count('var(--') for e in eintraege))
