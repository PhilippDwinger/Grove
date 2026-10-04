# Grove – Anleitung für Claude

Grove ist Paddys persönliche digitale Welt (Website, später auch App).
Gefühl: **Grove** (Ökosystem, Wald, Jahresringe) **+ Groove** (Jazz, Musik, Nachtleben). Warm, ruhig, nicht überladen.
Sprache: Deutsch, locker (du).

## 🚫 Wichtigste Regel: Paddys Code ist tabu

- **`scripts/`** (Frontend-JavaScript) und **`backend/`** (Server, Bridge, APIs) gehören Paddy.
  Dort **niemals** etwas anlegen, ändern, umbenennen oder löschen – auch nicht per Bash.
- In `index.html` (und in künftigen HTML-Seiten) gibt es eine **PADDY-ZONE** für seine `<script>`-Tags.
  Diesen Bereich nicht anfassen.
- Wenn du etwas an seinem Code bräuchtest: **frag Paddy**, ob er es ändern möchte. Mach Vorschläge, aber schreib es nicht selbst.

## Rollen

| Wer    | Was                                                      |
|--------|----------------------------------------------------------|
| Paddy  | Gesamte Logik: JavaScript, Backend, Bridge, Daten        |
| Claude | Design: HTML-Gerüst, CSS, Animationen, Bilder/Icons      |

## Arbeitsweise

1. **Nicht vorausarbeiten.** Paddy baut zuerst eine Funktion.
2. Er sagt, welche IDs/Klassen/Elemente sein Script nutzt (oder du liest sein Script – **nur lesen**).
3. Dann baust du HTML, CSS und Animationen drumherum – passend zu seinen Hooks.
4. Animationen **nur in CSS** (`design/css/animations.css`), kein JavaScript.
5. Paddy sieht alles live über die VS-Code-Erweiterung **Live Server**.

## Ordnerstruktur

```
Grove/
├── CLAUDE.md               diese Anleitung
├── README.md               Übersicht für Paddy
├── index.html              Startseite                    → Claude
├── design/                 alles Sichtbare               → Claude
│   ├── css/base.css          Farben, Schriften, Reset
│   ├── css/layout.css        Seitenaufbau
│   ├── css/animations.css    alle Animationen
│   └── img/                  Logo, Grafiken
├── scripts/                Paddys Frontend-JS            → TABU
└── backend/                Paddys Backend / Bridge       → TABU
```
Neue Seiten kommen als eigene `.html` ins Hauptverzeichnis (oder später `pages/`), neue Styles als eigene Datei in `design/css/`.

## Design-System (v0.1)

**Farben** (als CSS-Variablen in `base.css`):
- Aubergine `--aubergine-900 #1a0f1c` (Hintergrund), `--aubergine-800 #24152a` (Flächen), `--aubergine-700 #321d39` (Hover)
- Amber `--amber-500 #e8a33d` (Akzent), `--amber-400 #f2bb5c`, `--amber-300 #f7d08a`
- Text `--cream #f4e9d8`, Nebentext `--muted #b4a2b3`, Linien `--line`

**Schriften:** Fraunces (Überschriften, die „o“ in Grove kursiv in Amber), Manrope (Fließtext).

**Logo:** Jahresringe + Schallplatte, Amber auf dunklem Aubergine (`design/img/grove-logo.svg`). Kein Text im Logo. Dreht sich langsam (`.vinyl-spin`).

**Signature-Animation:** Schriftzug „Grove“ klappt auf zu „Gr**oooooo**ve“, die Extra-o's wippen nacheinander im Takt und klappen wieder ein (`.groove`, 9-s-Zyklus).

**Weitere Elemente:** Equalizer (`.eq`), pulsierender Status-Punkt (`.status`), Karten (`.card`, `.card--featured`, `.card--empty`), dezentes Filmkorn im Hintergrund, `prefers-reduced-motion` wird respektiert.

## Projekte in Grove

- **Bridge** – das Herzstück: Alle Geräte, die im Web posten können, kommunizieren miteinander und geben sich gegenseitig Aufgaben.
- **SynaPort** – eigenes Projekt von Paddy (Beschreibung folgt).

## Hosting

- Code liegt auf GitHub (Konto `PhilippDwinger`, Repo `Grove`, privat).
- Die Website läuft als **Static Site auf Render** (kostenlos). Jeder Push auf `main` geht automatisch live.
- Achtung: Alles im Repo wird als Website öffentlich ausgeliefert. Sobald `backend/` echten Code bekommt, wird es ein eigener Render-Dienst. Nie Passwörter oder Keys ins Repo (`.env` steht in `.gitignore`).
