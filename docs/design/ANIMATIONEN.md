# Grove · Animations-Bibliothek

44 nummerierte Animationen im Grove-Stil (Wald + Jazz). Reines CSS (41 braucht ein paar Zeilen aus `js/kern/thema.js`).
Ab Nummer 31 sind sie für **Laub** gemacht – dort kann man sie auf feste Plätze legen (Hintergrund, Zeichen, Begrüßung, Erscheinen, Karten).
Live ansehen: `docs/design/animationen-katalog.html` – oben Nummern zum Springen.

## So benutzt du eine Animation

1. Im `<head>` einbinden (Reihenfolge wichtig):
   ```html
   <link rel="stylesheet" href="/css/basis.css">
   <link rel="stylesheet" href="/css/animationen.css">
   ```
2. Das HTML-Snippet der gewünschten Nummer kopieren und einfügen.
3. Größe anpassen: Die meisten Snippets haben feste Größen (`width`/`height` in der CSS-Klasse) –
   für andere Größen eine eigene Klasse ergänzen, nicht die Bibliothek umbauen.

Pfade in den Snippets (`/bilder/marke/...`) gelten für Seiten im Grove-Hauptordner.
Für Seiten in Unterordnern (z. B. `design/beispiele/`) entsprechend `../` voranstellen.

Hinweis zu Containern: Die Animationen 11, 12, 13, 22, 30–36 füllen ihren Eltern-Container
(`position: absolute; inset: 0`). Der Container braucht `position: relative; overflow: hidden;` und eine Höhe.

## Übersicht

| Nr. | Name | Klasse | Idee für |
|---|---|---|---|
| 01 | Groooove-Schriftzug | `.a01` | Startseite, Hero |
| 02 | Logo atmet | `.a02` | Hero, Ladebildschirm |
| 03 | Jahresringe wachsen | `.a03` | Intro, Seitenstart |
| 04 | Platte dreht – Keimling bleibt | `.a04` | Musik läuft, „aktiv“-Zustand |
| 05 | Tonarm senkt sich | `.a05` | Bridge startet, Verbinden |
| 06 | Equalizer | `.a06` | Status „läuft“, Musik |
| 07 | Keimling wächst | `.a07` | Neues Projekt angelegt |
| 08 | Schallwellen | `.a08` | Bridge sendet, Gerät online |
| 09 | Buchstaben-Welle | `.a09` | Überschriften, Hover |
| 10 | Ride-Becken im Swing | `.a10` | Taktgeber für andere Animationen |
| 11 | Glühwürmchen | `.a11` | Hintergrund, Nachtmodus |
| 12 | Noten steigen auf | `.a12` | Erfolg, „gespeichert“ |
| 13 | Blätter fallen | `.a13` | Herbst-Stimmung, Löschen |
| 14 | Bühnenlicht über Text | `.a14` | Hero-Überschrift |
| 15 | Karte reagiert auf die Maus | `.a15` | Projekt-Karten |
| 16 | Bridge – Pakete zwischen Geräten | `.a16` | Bridge-Übersicht |
| 17 | Wurzelnetz | `.a17` | Geräte-Netzwerk, Bridge |
| 18 | Schreibmaschine | `.a18` | Begrüßung auf „Heute“ |
| 19 | Goldener Glanz | `.a19` | Logo-Schriftzug, Buttons |
| 20 | Metronom | `.a20` | Ladezustand, Timer |
| 21 | Echte Schallplatte | `.a21` | Musik-Bereich, Hain |
| 22 | Der Hain wächst | `.a22` | Projekt-Übersicht, Wachstum |
| 23 | Neon-Schild | `.a23` | Nachtmodus, Fehlerseite 404 |
| 24 | Lade-Ringe | `.a24` | Laden, Warten auf Bridge |
| 25 | Button mit Groove-Rand | `.a25` | Haupt-Buttons |
| 26 | Worte steigen auf | `.a26` | Seitenüberschriften |
| 27 | Klangwelle | `.a27` | Sprach-/Audio-Funktionen |
| 28 | Barlicht | `.a28` | Abend-Begrüßung, Hintergrund |
| 29 | Fortschrittsring | `.a29` | Projekt-Fortschritt, Uploads |
| 30 | Ringe im Hintergrund | `.a30` | Seitenhintergrund, große Karten |
| 31 | Sternschnuppen | `.a31` | Hintergrund (Laub), Nachthimmel, Hero |
| 32 | Regen | `.a32` | Hintergrund (Laub), ruhige Stimmung |
| 33 | Sporen steigen auf | `.a33` | Hintergrund (Laub), Myzel |
| 34 | Nebelschwaden | `.a34` | Hintergrund (Laub), Morgentau |
| 35 | Schnee | `.a35` | Hintergrund (Laub), Winter |
| 36 | Polarlicht | `.a36` | Hintergrund (Laub), Abendrot |
| 37 | Zeichen glimmt | `.a37` | Zeichen in der Kopfzeile (Laub) |
| 38 | Zeichen schaukelt | `.a38` | Zeichen in der Kopfzeile (Laub) |
| 39 | Bass | `.a39` | Zeichen in der Kopfzeile (Laub), Jazzkeller |
| 40 | Karte leuchtet | `.a40` | Karten beim Drüberfahren (Laub) |
| 41 | Karte kippt (3D) | `.a41` | Karten beim Drüberfahren (Laub) |
| 42 | Schrift aus dem Nebel | `.a42` | Begrüßung (Laub), Seitenüberschriften |
| 43 | Wachsen | `.a43` | Erscheinen von Karten (Laub) |
| 44 | Aufblättern | `.a44` | Erscheinen von Karten (Laub) |

---

## 01 · Groooove-Schriftzug

„Grove“ klappt zu „Groooooove“ auf, die o’s wippen im Takt und klappen wieder ein.

- **Klasse:** `.a01` (CSS in `/css/animationen.css`, Abschnitt 01)
- **Idee für:** Startseite, Hero

```html
<h3 class="a01" aria-label="Grove"><span aria-hidden="true">Gr</span><span class="o" aria-hidden="true">o</span><span class="o x" style="--i:1" aria-hidden="true">o</span><span class="o x" style="--i:2" aria-hidden="true">o</span><span class="o x" style="--i:3" aria-hidden="true">o</span><span class="o x" style="--i:4" aria-hidden="true">o</span><span aria-hidden="true">ve</span></h3>
```

---

## 02 · Logo atmet

Das App-Icon pulsiert langsam und leuchtet dabei warm auf.

- **Klasse:** `.a02` (CSS in `/css/animationen.css`, Abschnitt 02)
- **Idee für:** Hero, Ladebildschirm

```html
<img class="a02" src="/bilder/marke/grove-icon.svg" alt="">
```

---

## 03 · Jahresringe wachsen

Das Logo zeichnet sich Ring für Ring, dann springt der Keimling in die Mitte.

- **Klasse:** `.a03` (CSS in `/css/animationen.css`, Abschnitt 03)
- **Idee für:** Intro, Seitenstart

```html
<svg class="a03" viewBox="0 0 512 512" aria-hidden="true"><circle cx="256" cy="256" r="236" fill="none" stroke="#E3A15A" stroke-width="12" opacity="1" class="ring" pathLength="1" style="--i:0"/><circle cx="251" cy="259" r="192" fill="none" stroke="#E3A15A" stroke-width="9" opacity="0.85" class="ring" pathLength="1" style="--i:1"/><circle cx="247" cy="262" r="150" fill="none" stroke="#E3A15A" stroke-width="9" opacity="0.7" class="ring" pathLength="1" style="--i:2"/><circle cx="244" cy="265" r="112" fill="none" stroke="#E3A15A" stroke-width="8" opacity="0.85" class="ring" pathLength="1" style="--i:3"/><line x1="300" y1="210" x2="440" y2="72" stroke="#1C1420" stroke-width="14" stroke-linecap="round"/><g class="core"><circle cx="242" cy="267" r="64" fill="#E3A15A"/><path d="M242 300 L242 262" stroke="#1C1420" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M242 270 C224 270 214 256 216 240 C232 240 242 252 242 270 Z" fill="#1C1420"/><path d="M242 262 C258 260 270 246 270 230 C254 230 242 242 242 262 Z" fill="#1C1420"/></g></svg>
```

---

## 04 · Platte dreht – Keimling bleibt

Nur die Ringe drehen sich wie eine Schallplatte, der Keimling bleibt aufrecht stehen.

- **Klasse:** `.a04` (CSS in `/css/animationen.css`, Abschnitt 04)
- **Idee für:** Musik läuft, „aktiv“-Zustand

```html
<svg class="a04" viewBox="0 0 512 512" aria-hidden="true"><g class="rings"><circle cx="256" cy="256" r="236" fill="none" stroke="#E3A15A" stroke-width="12" opacity="1"/><circle cx="251" cy="259" r="192" fill="none" stroke="#E3A15A" stroke-width="9" opacity="0.85"/><circle cx="247" cy="262" r="150" fill="none" stroke="#E3A15A" stroke-width="9" opacity="0.7"/><circle cx="244" cy="265" r="112" fill="none" stroke="#E3A15A" stroke-width="8" opacity="0.85"/></g><line x1="300" y1="210" x2="440" y2="72" stroke="#1C1420" stroke-width="14" stroke-linecap="round"/><circle cx="242" cy="267" r="64" fill="#E3A15A"/><path d="M242 300 L242 262" stroke="#1C1420" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M242 270 C224 270 214 256 216 240 C232 240 242 252 242 270 Z" fill="#1C1420"/><path d="M242 262 C258 260 270 246 270 230 C254 230 242 242 242 262 Z" fill="#1C1420"/></svg>
```

---

## 05 · Tonarm senkt sich

Der Tonarm schwenkt auf die Platte, sie dreht drei Runden, der Arm fährt zurück.

- **Klasse:** `.a05` (CSS in `/css/animationen.css`, Abschnitt 05)
- **Idee für:** Bridge startet, Verbinden

```html
<svg class="a05" viewBox="0 0 300 220" aria-hidden="true">
<circle cx="120" cy="110" r="96" fill="#160F19"/>
<g class="disc"><g transform="translate(30 20) scale(0.3515)"><circle cx="256" cy="256" r="236" fill="none" stroke="#E3A15A" stroke-width="12" opacity="1"/><circle cx="251" cy="259" r="192" fill="none" stroke="#E3A15A" stroke-width="9" opacity="0.85"/><circle cx="247" cy="262" r="150" fill="none" stroke="#E3A15A" stroke-width="9" opacity="0.7"/><circle cx="244" cy="265" r="112" fill="none" stroke="#E3A15A" stroke-width="8" opacity="0.85"/><circle cx="242" cy="267" r="64" fill="#E3A15A"/><circle cx="242" cy="267" r="8" fill="#1C1420"/></g></g>
<g class="arm"><circle cx="262" cy="34" r="14" fill="#3A2C3D"/><circle cx="262" cy="34" r="6" fill="#E3A15A"/>
<path d="M262 34 L240 150 L196 176" stroke="#CDBFAE" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="182" y="168" width="22" height="14" rx="3" fill="#CDBFAE" transform="rotate(-30 193 175)"/></g>
</svg>
```

---

## 06 · Equalizer

Zwölf Balken hüpfen in unterschiedlichen Tempi.

- **Klasse:** `.a06` (CSS in `/css/animationen.css`, Abschnitt 06)
- **Idee für:** Status „läuft“, Musik

```html
<div class="a06" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
```

---

## 07 · Keimling wächst

Ein Stiel wächst aus der Erde, zwei Blätter entfalten sich und wiegen sanft.

- **Klasse:** `.a07` (CSS in `/css/animationen.css`, Abschnitt 07)
- **Idee für:** Neues Projekt angelegt

```html
<svg class="a07" viewBox="0 0 160 190" aria-hidden="true">
<path d="M20 172 Q80 162 140 172" stroke="#3A2C3D" stroke-width="4" fill="none" stroke-linecap="round"/>
<g class="sway"><path class="stem" pathLength="1" d="M80 170 C80 145 77 120 80 92" stroke="#E3A15A" stroke-width="6" fill="none" stroke-linecap="round"/>
<path class="leaf leaf--l" d="M80 100 C60 100 46 82 49 62 C69 62 81 78 80 100 Z" fill="#E3A15A"/>
<path class="leaf leaf--r" d="M80 92 C100 89 115 72 114 52 C94 52 79 68 80 92 Z" fill="#F2C08A"/></g>
</svg>
```

---

## 08 · Schallwellen

Ringe laufen vom Logo nach außen, wie Schall oder ein Funksignal.

- **Klasse:** `.a08` (CSS in `/css/animationen.css`, Abschnitt 08)
- **Idee für:** Bridge sendet, Gerät online

```html
<div class="a08" aria-hidden="true"><i></i><i></i><i></i><img src="/bilder/marke/grove-logo-klein.svg" alt=""></div>
```

---

## 09 · Buchstaben-Welle

Die Buchstaben von „Grove“ hüpfen nacheinander wie eine Welle.

- **Klasse:** `.a09` (CSS in `/css/animationen.css`, Abschnitt 09)
- **Idee für:** Überschriften, Hover

```html
<h3 class="a09" aria-label="Grove"><span aria-hidden="true" style="--i:0">G</span><span aria-hidden="true" style="--i:1">r</span><span aria-hidden="true" style="--i:2">o</span><span aria-hidden="true" style="--i:3">v</span><span aria-hidden="true" style="--i:4">e</span></h3>
```

---

## 10 · Ride-Becken im Swing

Ein Becken schlägt den typischen Jazz-Rhythmus: ding · ding-a · ding · ding-a.

- **Klasse:** `.a10` (CSS in `/css/animationen.css`, Abschnitt 10)
- **Idee für:** Taktgeber für andere Animationen

```html
<div class="a10" aria-hidden="true"><div class="a10__cymbal"></div><div class="a10__label">ding · ding-a · ding · ding-a</div></div>
```

---

## 11 · Glühwürmchen

Warme Lichtpunkte schweben und blinken, wie abends auf einer Lichtung.

- **Klasse:** `.a11` (CSS in `/css/animationen.css`, Abschnitt 11)
- **Idee für:** Hintergrund, Nachtmodus

```html
<div class="a11" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
```

---

## 12 · Noten steigen auf

Kleine Noten steigen schwingend nach oben und lösen sich auf.

- **Klasse:** `.a12` (CSS in `/css/animationen.css`, Abschnitt 12)
- **Idee für:** Erfolg, „gespeichert“

```html
<div class="a12" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="8" cy="18" rx="5" ry="3.6" transform="rotate(-20 8 18)"/><rect x="11.6" y="3" width="2" height="15"/><path d="M13.6 3 C17 4 20 6 19 10 C18 8 16 7 13.6 7 Z"/></svg><svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="8" cy="18" rx="5" ry="3.6" transform="rotate(-20 8 18)"/><rect x="11.6" y="3" width="2" height="15"/><path d="M13.6 3 C17 4 20 6 19 10 C18 8 16 7 13.6 7 Z"/></svg><svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="8" cy="18" rx="5" ry="3.6" transform="rotate(-20 8 18)"/><rect x="11.6" y="3" width="2" height="15"/><path d="M13.6 3 C17 4 20 6 19 10 C18 8 16 7 13.6 7 Z"/></svg><svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="8" cy="18" rx="5" ry="3.6" transform="rotate(-20 8 18)"/><rect x="11.6" y="3" width="2" height="15"/><path d="M13.6 3 C17 4 20 6 19 10 C18 8 16 7 13.6 7 Z"/></svg><svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="8" cy="18" rx="5" ry="3.6" transform="rotate(-20 8 18)"/><rect x="11.6" y="3" width="2" height="15"/><path d="M13.6 3 C17 4 20 6 19 10 C18 8 16 7 13.6 7 Z"/></svg></div>
```

---

## 13 · Blätter fallen

Blätter segeln drehend von oben herab.

- **Klasse:** `.a13` (CSS in `/css/animationen.css`, Abschnitt 13)
- **Idee für:** Herbst-Stimmung, Löschen

```html
<div class="a13" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22 C4 20 2 11 6 2 C15 5 19 13 12 22 Z" fill="#E3A15A" opacity=".85"/><path d="M12 21 C10 15 8 9 6.5 3.5" stroke="#1C1420" stroke-width="1.2" fill="none"/></svg><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22 C4 20 2 11 6 2 C15 5 19 13 12 22 Z" fill="#E3A15A" opacity=".85"/><path d="M12 21 C10 15 8 9 6.5 3.5" stroke="#1C1420" stroke-width="1.2" fill="none"/></svg><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22 C4 20 2 11 6 2 C15 5 19 13 12 22 Z" fill="#E3A15A" opacity=".85"/><path d="M12 21 C10 15 8 9 6.5 3.5" stroke="#1C1420" stroke-width="1.2" fill="none"/></svg><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22 C4 20 2 11 6 2 C15 5 19 13 12 22 Z" fill="#E3A15A" opacity=".85"/><path d="M12 21 C10 15 8 9 6.5 3.5" stroke="#1C1420" stroke-width="1.2" fill="none"/></svg><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22 C4 20 2 11 6 2 C15 5 19 13 12 22 Z" fill="#E3A15A" opacity=".85"/><path d="M12 21 C10 15 8 9 6.5 3.5" stroke="#1C1420" stroke-width="1.2" fill="none"/></svg><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22 C4 20 2 11 6 2 C15 5 19 13 12 22 Z" fill="#E3A15A" opacity=".85"/><path d="M12 21 C10 15 8 9 6.5 3.5" stroke="#1C1420" stroke-width="1.2" fill="none"/></svg></div>
```

---

## 14 · Bühnenlicht über Text

Ein Spotlight wandert über den Schriftzug wie auf einer Clubbühne.

- **Klasse:** `.a14` (CSS in `/css/animationen.css`, Abschnitt 14)
- **Idee für:** Hero-Überschrift

```html
<h3 class="a14">Heute Abend live</h3>
```

---

## 15 · Karte reagiert auf die Maus

Fahr mit der Maus drüber: Die Karte hebt sich, die Ringe drehen sich, der Pfeil rückt vor.

- **Klasse:** `.a15` (CSS in `/css/animationen.css`, Abschnitt 15)
- **Idee für:** Projekt-Karten

```html
<a class="a15" href="#a15"><svg class="bg" viewBox="0 0 512 512" aria-hidden="true"><circle cx="256" cy="256" r="236" fill="none" stroke="#E3A15A" stroke-width="12" opacity="1"/><circle cx="251" cy="259" r="192" fill="none" stroke="#E3A15A" stroke-width="9" opacity="0.85"/><circle cx="247" cy="262" r="150" fill="none" stroke="#E3A15A" stroke-width="9" opacity="0.7"/><circle cx="244" cy="265" r="112" fill="none" stroke="#E3A15A" stroke-width="8" opacity="0.85"/></svg><span class="tag">Herzstück</span><h3>Bridge</h3><p>Geräte sprechen miteinander und geben sich Aufgaben.</p><span class="go">Öffnen →</span></a>
```

---

## 16 · Bridge – Pakete zwischen Geräten

Datenpakete wandern hin und her, das Ziel-Display blinkt beim Empfang.

- **Klasse:** `.a16` (CSS in `/css/animationen.css`, Abschnitt 16)
- **Idee für:** Bridge-Übersicht

```html
<svg class="a16" viewBox="0 0 380 150" aria-hidden="true">
<line class="wire" x1="80" y1="75" x2="300" y2="75" stroke="#3A2C3D" stroke-width="3"/>
<rect x="30" y="35" width="46" height="80" rx="9" fill="none" stroke="#CDBFAE" stroke-width="3"/><rect class="scr-l" x="37" y="45" width="32" height="56" rx="3" fill="#2A1F2C"/>
<rect x="290" y="45" width="66" height="44" rx="5" fill="none" stroke="#CDBFAE" stroke-width="3"/><rect class="scr-r" x="296" y="51" width="54" height="32" rx="2" fill="#2A1F2C"/><path d="M280 99 H366" stroke="#CDBFAE" stroke-width="4" stroke-linecap="round"/>
<circle class="p1" cx="90" cy="75" r="7" fill="#E3A15A"/><circle class="p2" cx="290" cy="75" r="7" fill="#F2C08A"/>
</svg>
```

---

## 17 · Wurzelnetz

Knoten tauchen auf und verbinden sich wie Wurzeln unter dem Waldboden.

- **Klasse:** `.a17` (CSS in `/css/animationen.css`, Abschnitt 17)
- **Idee für:** Geräte-Netzwerk, Bridge

```html
<svg class="a17" viewBox="0 0 380 200" aria-hidden="true">
<path class="ln" pathLength="1" style="--i:1" d="M190 100 C150 70 110 60 70 50" stroke="#E3A15A" stroke-width="2.5" fill="none" opacity=".7"/>
<path class="ln" pathLength="1" style="--i:2" d="M190 100 C230 60 270 50 310 40" stroke="#E3A15A" stroke-width="2.5" fill="none" opacity=".7"/>
<path class="ln" pathLength="1" style="--i:3" d="M190 100 C160 130 120 150 80 160" stroke="#E3A15A" stroke-width="2.5" fill="none" opacity=".7"/>
<path class="ln" pathLength="1" style="--i:4" d="M190 100 C230 140 270 150 320 155" stroke="#E3A15A" stroke-width="2.5" fill="none" opacity=".7"/>
<path class="ln" pathLength="1" style="--i:5" d="M70 50 C60 100 70 130 80 160" stroke="#F2C08A" stroke-width="1.5" fill="none" opacity=".4"/>
<path class="ln" pathLength="1" style="--i:6" d="M310 40 C330 90 330 120 320 155" stroke="#F2C08A" stroke-width="1.5" fill="none" opacity=".4"/>
<circle class="nd" style="--i:0" cx="190" cy="100" r="14" fill="#E3A15A"/>
<circle class="nd" style="--i:2" cx="70" cy="50" r="8" fill="#F2C08A"/><circle class="nd" style="--i:3" cx="310" cy="40" r="8" fill="#F2C08A"/>
<circle class="nd" style="--i:4" cx="80" cy="160" r="8" fill="#F2C08A"/><circle class="nd" style="--i:5" cx="320" cy="155" r="8" fill="#F2C08A"/>
</svg>
```

---

## 18 · Schreibmaschine

„Guten Abend.“ tippt sich Buchstabe für Buchstabe, mit blinkendem Cursor.

- **Klasse:** `.a18` (CSS in `/css/animationen.css`, Abschnitt 18)
- **Idee für:** Begrüßung auf „Heute“

```html
<h3 class="a18" aria-label="Guten Abend."><span aria-hidden="true" style="--i:0">G</span><span aria-hidden="true" style="--i:1">u</span><span aria-hidden="true" style="--i:2">t</span><span aria-hidden="true" style="--i:3">e</span><span aria-hidden="true" style="--i:4">n</span><span aria-hidden="true" style="--i:5"> </span><span aria-hidden="true" style="--i:6">A</span><span aria-hidden="true" style="--i:7">b</span><span aria-hidden="true" style="--i:8">e</span><span aria-hidden="true" style="--i:9">n</span><span aria-hidden="true" style="--i:10">d</span><span aria-hidden="true" style="--i:11">.</span><span class="cur" aria-hidden="true"></span></h3>
```

---

## 19 · Goldener Glanz

Ein Lichtschimmer läuft über den Schriftzug.

- **Klasse:** `.a19` (CSS in `/css/animationen.css`, Abschnitt 19)
- **Idee für:** Logo-Schriftzug, Buttons

```html
<h3 class="a19">Grove</h3>
```

---

## 20 · Metronom

Ein Pendel schwingt im Takt von 80 Schlägen pro Minute.

- **Klasse:** `.a20` (CSS in `/css/animationen.css`, Abschnitt 20)
- **Idee für:** Ladezustand, Timer

```html
<svg class="a20" viewBox="0 0 150 190" aria-hidden="true">
<path d="M50 20 H100 L130 175 H20 Z" fill="#2A1F2C" stroke="#3A2C3D" stroke-width="3" stroke-linejoin="round"/>
<g class="pend"><line x1="75" y1="160" x2="75" y2="30" stroke="#CDBFAE" stroke-width="3" stroke-linecap="round"/><rect x="66" y="62" width="18" height="14" rx="3" fill="#E3A15A"/></g>
<circle cx="75" cy="160" r="6" fill="#E3A15A"/>
</svg>
```

---

## 21 · Echte Schallplatte

Feine Rillen, ein Lichtreflex, das Label dreht mit 33⅓ Umdrehungen pro Minute.

- **Klasse:** `.a21` (CSS in `/css/animationen.css`, Abschnitt 21)
- **Idee für:** Musik-Bereich, Hain

```html
<div class="a21" aria-hidden="true"><div class="a21__label"></div></div>
```

---

## 22 · Der Hain wächst

Bäume schießen nacheinander aus dem Boden – ein kleiner Wald entsteht.

- **Klasse:** `.a22` (CSS in `/css/animationen.css`, Abschnitt 22)
- **Idee für:** Projekt-Übersicht, Wachstum

```html
<div class="a22" aria-hidden="true"><i style="--i:0;--h:90px;--o:0.6"></i><i style="--i:1;--h:140px;--o:0.8"></i><i style="--i:2;--h:110px;--o:0.7"></i><i style="--i:3;--h:180px;--o:1"></i><i style="--i:4;--h:130px;--o:0.85"></i><i style="--i:5;--h:160px;--o:0.9"></i><i style="--i:6;--h:100px;--o:0.65"></i><i style="--i:7;--h:150px;--o:0.8"></i><i style="--i:8;--h:80px;--o:0.55"></i></div>
```

---

## 23 · Neon-Schild

„Grove“ als Leuchtreklame im Jazzclub – mit gelegentlichem Flackern.

- **Klasse:** `.a23` (CSS in `/css/animationen.css`, Abschnitt 23)
- **Idee für:** Nachtmodus, Fehlerseite 404

```html
<h3 class="a23">Grove</h3>
```

---

## 24 · Lade-Ringe

Drei Ringe drehen in verschiedenen Richtungen und Tempi um einen pulsierenden Kern.

- **Klasse:** `.a24` (CSS in `/css/animationen.css`, Abschnitt 24)
- **Idee für:** Laden, Warten auf Bridge

```html
<div class="a24" aria-hidden="true"><i></i><i></i><i></i><b></b></div>
```

---

## 25 · Button mit Groove-Rand

Ein Lichtstreifen läuft um den Button. Beim Drüberfahren füllt er sich in Amber.

- **Klasse:** `.a25` (CSS in `/css/animationen.css`, Abschnitt 25)
- **Idee für:** Haupt-Buttons

```html
<button class="a25" type="button">Weitermachen</button>
```

---

## 26 · Worte steigen auf

Jedes Wort steigt einzeln aus einer unsichtbaren Linie und verschwindet nach oben.

- **Klasse:** `.a26` (CSS in `/css/animationen.css`, Abschnitt 26)
- **Idee für:** Seitenüberschriften

```html
<h3 class="a26"><span><span style="--i:0">Willkommen</span></span><span><span style="--i:1">im</span></span><span><span style="--i:2"><em>Grove</em></span></span></h3>
```

---

## 27 · Klangwelle

Zwei Wellen laufen gegeneinander, wie ein Audiosignal.

- **Klasse:** `.a27` (CSS in `/css/animationen.css`, Abschnitt 27)
- **Idee für:** Sprach-/Audio-Funktionen

```html
<svg class="a27" viewBox="0 0 400 140" preserveAspectRatio="none" aria-hidden="true"><path class="w1" d="M0 70 Q50 20 100 70 Q150 120 200 70 Q250 20 300 70 Q350 120 400 70 Q450 20 500 70 Q550 120 600 70 Q650 20 700 70 Q750 120 800 70" stroke="#E3A15A" stroke-width="3" fill="none"/><path class="w2" d="M0 70 Q50 45 100 70 Q150 95 200 70 Q250 45 300 70 Q350 95 400 70 Q450 45 500 70 Q550 95 600 70 Q650 45 700 70 Q750 95 800 70" stroke="#F2C08A" stroke-width="2" fill="none" opacity=".45"/></svg>
```

---

## 28 · Barlicht

Ein warmer Lichtschein flackert unruhig hinter dem Text, wie Kerzen an der Bar.

- **Klasse:** `.a28` (CSS in `/css/animationen.css`, Abschnitt 28)
- **Idee für:** Abend-Begrüßung, Hintergrund

```html
<div class="a28"><span>Nachtmodus</span></div>
```

---

## 29 · Fortschrittsring

Ein Ring füllt sich, die Zahl in der Mitte zählt mit hoch.

- **Klasse:** `.a29` (CSS in `/css/animationen.css`, Abschnitt 29)
- **Idee für:** Projekt-Fortschritt, Uploads

```html
<div class="a29" aria-hidden="true"><svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="66" fill="none" stroke="#2A1F2C" stroke-width="10"/><circle class="bar" cx="75" cy="75" r="66" fill="none" stroke="#E3A15A" stroke-width="10" stroke-linecap="round" pathLength="100"/></svg><b></b></div>
```

---

## 30 · Ringe im Hintergrund

Große, blasse Jahresringe drehen und treiben ganz langsam hinter dem Inhalt.

- **Klasse:** `.a30` (CSS in `/css/animationen.css`, Abschnitt 30)
- **Idee für:** Seitenhintergrund, große Karten

```html
<div class="a30" aria-hidden="true"><svg viewBox="0 0 512 512" aria-hidden="true"><circle cx="256" cy="256" r="236" fill="none" stroke="#E3A15A" stroke-width="12" opacity="1"/><circle cx="251" cy="259" r="192" fill="none" stroke="#E3A15A" stroke-width="9" opacity="0.85"/><circle cx="247" cy="262" r="150" fill="none" stroke="#E3A15A" stroke-width="9" opacity="0.7"/><circle cx="244" cy="265" r="112" fill="none" stroke="#E3A15A" stroke-width="8" opacity="0.85"/></svg><svg viewBox="0 0 512 512" aria-hidden="true"><circle cx="256" cy="256" r="236" fill="none" stroke="#E3A15A" stroke-width="12" opacity="1"/><circle cx="251" cy="259" r="192" fill="none" stroke="#E3A15A" stroke-width="9" opacity="0.85"/><circle cx="247" cy="262" r="150" fill="none" stroke="#E3A15A" stroke-width="9" opacity="0.7"/><circle cx="244" cy="265" r="112" fill="none" stroke="#E3A15A" stroke-width="8" opacity="0.85"/></svg></div><div class="a30__text"><h3>Guten Abend.</h3><p>Ruhiger Tag. Zwei Dinge warten noch auf dich.</p></div>
```

---

## 31 · Sternschnuppen

Ab und zu zieht eine Sternschnuppe schräg über den Himmel.

- **Klasse:** `.a31` (CSS in `/css/animationen.css`, Abschnitt 31)
- **Idee für:** Hintergrund (Laub), Nachthimmel, Hero

```html
<div class="a31" aria-hidden="true"><i style="--x:53%;--y:6%;--d:13.2s;--v:-0.2s"></i><i style="--x:68%;--y:15%;--d:8.5s;--v:-4.2s"></i><i style="--x:33%;--y:17%;--d:8.6s;--v:-5.7s"></i><i style="--x:60%;--y:33%;--d:9.0s;--v:-8.8s"></i><i style="--x:74%;--y:38%;--d:12.6s;--v:-12.0s"></i></div>
```

---

## 32 · Regen

Feine Regenfäden fallen leicht schräg – wie Regen auf dem Blätterdach.

- **Klasse:** `.a32` (CSS in `/css/animationen.css`, Abschnitt 32)
- **Idee für:** Hintergrund (Laub), ruhige Stimmung

```html
<div class="a32" aria-hidden="true"><i style="--x:24%;--d:1.28s;--v:-0.74s;--o:0.60"></i><i style="--x:63%;--d:0.95s;--v:-0.03s;--o:0.72"></i><i style="--x:26%;--d:1.06s;--v:-1.99s;--o:0.54"></i><i style="--x:84%;--d:1.23s;--v:-1.28s;--o:0.38"></i><i style="--x:63%;--d:1.51s;--v:-1.05s;--o:0.67"></i><i style="--x:67%;--d:0.94s;--v:-1.52s;--o:0.60"></i><i style="--x:30%;--d:0.92s;--v:-1.73s;--o:0.54"></i><i style="--x:72%;--d:1.52s;--v:-1.43s;--o:0.76"></i><i style="--x:39%;--d:1.46s;--v:-0.89s;--o:0.77"></i><i style="--x:88%;--d:0.97s;--v:-0.27s;--o:0.41"></i><i style="--x:97%;--d:1.21s;--v:-1.25s;--o:0.45"></i><i style="--x:51%;--d:1.17s;--v:-0.70s;--o:0.59"></i><i style="--x:58%;--d:1.53s;--v:-1.36s;--o:0.76"></i><i style="--x:86%;--d:1.59s;--v:-1.34s;--o:0.38"></i><i style="--x:86%;--d:1.58s;--v:-1.81s;--o:0.58"></i><i style="--x:71%;--d:1.05s;--v:-1.66s;--o:0.59"></i><i style="--x:28%;--d:0.94s;--v:-1.71s;--o:0.79"></i><i style="--x:9%;--d:1.46s;--v:-0.82s;--o:0.38"></i><i style="--x:29%;--d:1.44s;--v:-1.75s;--o:0.32"></i><i style="--x:61%;--d:0.93s;--v:-1.44s;--o:0.47"></i><i style="--x:88%;--d:1.59s;--v:-1.01s;--o:0.80"></i><i style="--x:31%;--d:0.95s;--v:-1.20s;--o:0.32"></i><i style="--x:20%;--d:1.19s;--v:-1.22s;--o:0.38"></i><i style="--x:4%;--d:1.51s;--v:-0.63s;--o:0.78"></i></div>
```

---

## 33 · Sporen steigen auf

Kleine Lichtpunkte steigen langsam und wiegend nach oben – wie Sporen im Myzel.

- **Klasse:** `.a33` (CSS in `/css/animationen.css`, Abschnitt 33)
- **Idee für:** Hintergrund (Laub), Myzel

```html
<div class="a33" aria-hidden="true"><i style="--x:45%;--d:18.7s;--v:-18.5s;--g:3.4px"></i><i style="--x:51%;--d:19.0s;--v:-3.7s;--g:3.5px"></i><i style="--x:63%;--d:21.5s;--v:-1.9s;--g:2.9px"></i><i style="--x:9%;--d:21.7s;--v:-13.9s;--g:2.1px"></i><i style="--x:98%;--d:23.6s;--v:-13.1s;--g:3.8px"></i><i style="--x:16%;--d:12.2s;--v:-10.6s;--g:2.2px"></i><i style="--x:19%;--d:14.9s;--v:-0.6s;--g:3.4px"></i><i style="--x:44%;--d:22.1s;--v:-10.4s;--g:3.9px"></i><i style="--x:50%;--d:19.9s;--v:-9.1s;--g:2.8px"></i><i style="--x:100%;--d:23.9s;--v:-16.8s;--g:4.1px"></i><i style="--x:32%;--d:14.8s;--v:-5.8s;--g:2.2px"></i><i style="--x:77%;--d:16.8s;--v:-16.9s;--g:3.2px"></i><i style="--x:96%;--d:22.2s;--v:-0.0s;--g:2.6px"></i><i style="--x:91%;--d:17.6s;--v:-19.6s;--g:3.2px"></i></div>
```

---

## 34 · Nebelschwaden

Weiche Nebelbänke treiben sehr langsam von links nach rechts.

- **Klasse:** `.a34` (CSS in `/css/animationen.css`, Abschnitt 34)
- **Idee für:** Hintergrund (Laub), Morgentau

```html
<div class="a34" aria-hidden="true"><i style="--y:-15%;--d:34s"></i><i style="--y:-3%;--d:44s;--v:-12s"></i><i style="--y:9%;--d:38s;--v:-25s"></i></div>
```

---

## 35 · Schnee

Flocken in verschiedenen Größen fallen und wiegen dabei hin und her.

- **Klasse:** `.a35` (CSS in `/css/animationen.css`, Abschnitt 35)
- **Idee für:** Hintergrund (Laub), Winter

```html
<div class="a35" aria-hidden="true"><i style="--x:52%;--d:17.1s;--v:-17.3s;--g:3.2px"></i><i style="--x:77%;--d:16.0s;--v:-11.9s;--g:2.4px"></i><i style="--x:3%;--d:12.8s;--v:-13.4s;--g:3.0px"></i><i style="--x:50%;--d:12.2s;--v:-15.2s;--g:5.8px"></i><i style="--x:40%;--d:19.0s;--v:-1.1s;--g:5.3px"></i><i style="--x:88%;--d:10.5s;--v:-12.7s;--g:4.2px"></i><i style="--x:96%;--d:11.1s;--v:-9.7s;--g:5.5px"></i><i style="--x:64%;--d:12.1s;--v:-1.5s;--g:5.8px"></i><i style="--x:47%;--d:19.0s;--v:-2.5s;--g:5.2px"></i><i style="--x:81%;--d:18.2s;--v:-0.3s;--g:3.5px"></i><i style="--x:5%;--d:16.5s;--v:-6.4s;--g:5.8px"></i><i style="--x:37%;--d:16.7s;--v:-15.6s;--g:3.0px"></i><i style="--x:56%;--d:18.6s;--v:-9.5s;--g:3.4px"></i><i style="--x:27%;--d:16.9s;--v:-3.5s;--g:4.4px"></i><i style="--x:56%;--d:14.5s;--v:-2.3s;--g:4.6px"></i><i style="--x:92%;--d:12.2s;--v:-6.0s;--g:5.6px"></i><i style="--x:58%;--d:11.7s;--v:-0.2s;--g:5.0px"></i><i style="--x:35%;--d:13.7s;--v:-4.9s;--g:4.5px"></i><i style="--x:73%;--d:12.1s;--v:-1.4s;--g:5.9px"></i><i style="--x:91%;--d:9.2s;--v:-10.2s;--g:4.7px"></i><i style="--x:40%;--d:16.3s;--v:-17.3s;--g:4.4px"></i><i style="--x:39%;--d:11.0s;--v:-4.5s;--g:2.6px"></i></div>
```

---

## 36 · Polarlicht

Zwei weiche Lichtbänder in Akzent, Flieder und Grün wogen am Himmel.

- **Klasse:** `.a36` (CSS in `/css/animationen.css`, Abschnitt 36)
- **Idee für:** Hintergrund (Laub), Abendrot

```html
<div class="a36" aria-hidden="true"><i style="--y:0%;--d:18s"></i><i style="--y:14%;--d:24s;--v:-9s"></i></div>
```

---

## 37 · Zeichen glimmt

Ein unruhiger, warmer Schein um das Zeichen – wie eine Laterne.

- **Klasse:** `.a37` (CSS in `/css/animationen.css`, Abschnitt 37)
- **Idee für:** Zeichen in der Kopfzeile (Laub)

```html
<img class="a37" src="/bilder/marke/grove-logo-klein.svg" alt="" width="110">
```

---

## 38 · Zeichen schaukelt

Das Zeichen schaukelt sanft wie ein Blatt im Wind (nur ±4°, der Keimling bleibt aufrecht).

- **Klasse:** `.a38` (CSS in `/css/animationen.css`, Abschnitt 38)
- **Idee für:** Zeichen in der Kopfzeile (Laub)

```html
<img class="a38" src="/bilder/marke/grove-logo-klein.svg" alt="" width="110">
```

---

## 39 · Bass

Das Zeichen pulsiert im 4/4-Takt mit 120 BPM, die Eins am stärksten.

- **Klasse:** `.a39` (CSS in `/css/animationen.css`, Abschnitt 39)
- **Idee für:** Zeichen in der Kopfzeile (Laub), Jazzkeller

```html
<img class="a39" src="/bilder/marke/grove-logo-klein.svg" alt="" width="110">
```

---

## 40 · Karte leuchtet

Beim Drüberfahren läuft ein Lichtstreif über die Karte, der Rand glüht warm.

- **Klasse:** `.a40` (CSS in `/css/animationen.css`, Abschnitt 40)
- **Idee für:** Karten beim Drüberfahren (Laub)

```html
<div class="a40" style="width:min(300px,90%);padding:22px;border:1px solid var(--border-hi);border-radius:18px;background:var(--surface-hi)"><h3 style="font-family:var(--font-display);font-weight:600;font-size:1.5rem">Myzel</h3><p style="color:var(--text-soft);font-size:.9rem">Fahr mit der Maus drüber.</p></div>
```

---

## 41 · Karte kippt (3D)

Die Karte neigt sich zur Maus, ein Lichtpunkt folgt dem Zeiger. Braucht js/kern/thema.js.

- **Klasse:** `.a41` (CSS in `/css/animationen.css`, Abschnitt 41)
- **Idee für:** Karten beim Drüberfahren (Laub)

```html
<div class="a41" style="position:relative;width:min(300px,90%);padding:22px;border:1px solid var(--border-hi);border-radius:18px;background:var(--surface-hi)"><h3 style="font-family:var(--font-display);font-weight:600;font-size:1.5rem">Rinde</h3><p style="color:var(--text-soft);font-size:.9rem">Beweg die Maus über die Karte.</p></div>
```

---

## 42 · Schrift aus dem Nebel

Buchstaben tauchen einzeln unscharf auf und werden klar (einmal beim Laden).

- **Klasse:** `.a42` (CSS in `/css/animationen.css`, Abschnitt 42)
- **Idee für:** Begrüßung (Laub), Seitenüberschriften

```html
<h3 class="a42" aria-label="Guten Abend." style="font-family:var(--font-display);font-size:3rem;font-weight:400"><span aria-hidden="true" style="--i:0">G</span><span aria-hidden="true" style="--i:1">u</span><span aria-hidden="true" style="--i:2">t</span><span aria-hidden="true" style="--i:3">e</span><span aria-hidden="true" style="--i:4">n</span><span aria-hidden="true" style="--i:5"> </span><span aria-hidden="true" style="--i:6">A</span><span aria-hidden="true" style="--i:7">b</span><span aria-hidden="true" style="--i:8">e</span><span aria-hidden="true" style="--i:9">n</span><span aria-hidden="true" style="--i:10">d</span><span aria-hidden="true" style="--i:11">.</span></h3>
```

---

## 43 · Wachsen

Ein Element wächst mit kleinem Federn aus dem Boden (einmal beim Laden).

- **Klasse:** `.a43` (CSS in `/css/animationen.css`, Abschnitt 43)
- **Idee für:** Erscheinen von Karten (Laub)

```html
<div style="display:flex;gap:12px"><div class="a43" style="--i:0;width:64px;height:84px;border-radius:14px;background:var(--surface-hi);border:1px solid var(--border-hi)"></div><div class="a43" style="--i:1;width:64px;height:84px;border-radius:14px;background:var(--surface-hi);border:1px solid var(--border-hi)"></div><div class="a43" style="--i:2;width:64px;height:84px;border-radius:14px;background:var(--surface-hi);border:1px solid var(--border-hi)"></div><div class="a43" style="--i:3;width:64px;height:84px;border-radius:14px;background:var(--surface-hi);border:1px solid var(--border-hi)"></div></div>
```

---

## 44 · Aufblättern

Elemente klappen von oben herunter wie umgeschlagene Seiten (einmal beim Laden).

- **Klasse:** `.a44` (CSS in `/css/animationen.css`, Abschnitt 44)
- **Idee für:** Erscheinen von Karten (Laub)

```html
<div style="display:flex;gap:12px"><div class="a44" style="--i:0;width:64px;height:84px;border-radius:14px;background:var(--surface-hi);border:1px solid var(--border-hi)"></div><div class="a44" style="--i:1;width:64px;height:84px;border-radius:14px;background:var(--surface-hi);border:1px solid var(--border-hi)"></div><div class="a44" style="--i:2;width:64px;height:84px;border-radius:14px;background:var(--surface-hi);border:1px solid var(--border-hi)"></div><div class="a44" style="--i:3;width:64px;height:84px;border-radius:14px;background:var(--surface-hi);border:1px solid var(--border-hi)"></div></div>
```
