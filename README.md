# 🌳🎷 Grove

Meine persönliche digitale Welt – Ökosystem *und* Groove.

## Ordnerstruktur

```
Grove/
├── index.html            Startseite (HTML-Gerüst)          → Claude
├── README.md             Diese Datei                        → beide
│
├── design/               Alles, was man SIEHT                → Claude
│   ├── css/
│   │   ├── base.css        Farben, Schriften, Grundlagen
│   │   ├── layout.css      Aufbau: Kopfzeile, Hero, Karten …
│   │   └── animations.css  Groooove-Schriftzug, Platte, Equalizer
│   └── img/
│       └── grove-logo.svg  Logo (Jahresringe / Schallplatte)
│
├── scripts/              Dein Frontend-JavaScript            → Paddy (TABU für Claude)
└── backend/              Server, Bridge, APIs …             → Paddy (TABU für Claude)
```

## Regeln der Zusammenarbeit

1. **`scripts/` und `backend/` gehören Paddy.** Claude ändert dort nie etwas.
   Wenn Claude etwas an einem Script bräuchte, fragt er nach.
2. **In `index.html` gibt es eine PADDY-ZONE** (ganz unten). Dort bindest du deine
   `<script>`-Tags ein – Claude fasst diesen Bereich nicht an.
3. **Reihenfolge:** Paddy baut zuerst eine Funktion → sagt Claude, welche IDs/Klassen
   sein Script nutzt → Claude baut HTML, CSS und Animationen drumherum.
   Claude arbeitet nicht voraus.
4. Animationen sind **reines CSS** – dafür braucht es kein JavaScript.

## Seite live ansehen (VS Code)

1. Erweiterung **„Live Server“** (von Ritwick Dey) installieren.
2. `index.html` öffnen → unten rechts auf **„Go Live“** klicken.
3. Der Browser lädt automatisch neu, sobald eine Datei gespeichert/geändert wird –
   auch wenn Claude sie ändert.
