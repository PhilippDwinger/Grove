---
name: grove-animationen
description: Grove-Animations-Bibliothek (30 nummerierte CSS-Animationen .a01–.a30 im Wald-/Jazz-Stil). Nutzen, wenn Paddy eine Animation per Nummer anfragt („nimm 08“, „Animation 16 auf die Bridge-Seite“) oder wenn eine Grove-Seite Bewegung, Lade-, Erfolgs- oder Hintergrund-Animationen braucht.
---

# Grove-Animationen benutzen

Paddy wählt Animationen **per Nummer** (01–30). So setzt du sie ein:

1. Lies `design/ANIMATIONEN.md` – dort stehen zu jeder Nummer Name, Klasse, Einsatzidee und das **fertige HTML-Snippet**.
2. Stelle sicher, dass die Seite im `<head>` in dieser Reihenfolge einbindet:
   `design/css/base.css` → `design/css/grove-animationen.css` → `design/css/animations.css`
   (Pfade relativ zur Seite anpassen).
3. Füge das Snippet unverändert ein. Pfade zu Bildern (`design/img/...`) relativ zur Seite anpassen.
4. Andere Größe oder Farbe nötig? Eine **neue, eigene Klasse** in `design/css/layout.css` oder einer
   Seiten-CSS ergänzen (z. B. `.hero .a03 { width: 260px; height: 260px; }`) – die Bibliothek
   `grove-animationen.css` selbst nicht umbauen, damit der Katalog (`index.html`) gleich bleibt.
5. Animationen 11, 12, 13, 22, 30 füllen ihren Eltern-Container: Er braucht
   `position: relative; overflow: hidden;` und eine feste Höhe.

## Regeln

- Nur CSS – **kein JavaScript** für Animationen. JavaScript gehört Paddy (`scripts/`, tabu).
- Soll eine Animation auf Paddys Daten reagieren (z. B. „läuft nur, wenn Bridge verbunden ist“),
  schlage ihm eine Klasse vor, die *sein* Script setzt (z. B. `.is-connected`), und style nur diese Klasse.
- `animations.css` enthält die Regel für „Animationen reduzieren“ – auf echten Seiten immer einbinden.
- Neue Animation erfunden? Als nächste Nummer (`.a31` …) ans Ende von `grove-animationen.css`,
  eine Karte in `index.html` und einen Abschnitt in `design/ANIMATIONEN.md` ergänzen.
