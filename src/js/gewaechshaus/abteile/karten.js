// ==========================================================
// Gewächshaus · Abteil „Karten & Layout“ (NUR ZUM TESTEN)
// C01–C14: Ideen, wie Inhalte in Grove angeordnet werden können.
// CSS: css/dienste/gewaechshaus/karten.css (.gc)
// ==========================================================
import { kacheln } from "../kacheln.js"
import "../../../css/dienste/gewaechshaus/karten.css"

const spark = (werte) => {
  const max = Math.max(...werte), pts = werte.map((w, i) => `${(i / (werte.length - 1) * 120).toFixed(1)},${(34 - w / max * 30).toFixed(1)}`)
  return `<svg class="gc-spark" viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true"><path class="flaeche" d="M0,36 L${pts.join(" L")} L120,36Z"/><path class="linie" d="M${pts.join(" L")}"/></svg>`
}

const KARTEN = [
  { nr: "C01", name: "Karte mit Rillen", idee: "Oben rechts laufen feine Plattenrillen aus der Ecke. Beim Hover werden sie ein wenig heller.",
    einsatz: "Dienst-Karten auf der Lichtung",
    html: `<a class="gc01" href="#" onclick="return false"><strong>Myzel</strong><span>Verknüpfte Notizen</span><em>42 Notizen</em></a>` },
  { nr: "C02", name: "Kennzahl mit Verlauf", idee: "Große Zahl, kleine Einheit, darunter eine leise Sparkline.",
    einsatz: "„Heute“, Server-Übersicht, Bridge",
    html: `<div class="gc02"><span class="gc02__titel">Notizen diese Woche</span><strong>18<small>+5</small></strong>${spark([3, 5, 2, 6, 4, 8, 7, 11, 9, 12])}</div>` },
  { nr: "C03", name: "Jahresringe-Zeitleiste", idee: "Senkrechte Linie mit Ringen als Punkte. Der neueste Ring ist größer und Amber.",
    einsatz: "Jahresringe, Verlauf einer Notiz",
    buehne: "hoch",
    html: `<ol class="gc03">
      <li class="ist-neu"><time>Heute, 14:20</time><span>Bridge 1.1 – Realm „Zuhause“ angelegt</span></li>
      <li><time>Gestern</time><span>Mühle: 30 Umwandlungen getestet</span></li>
      <li><time>9. Okt.</time><span>Grove Mail empfängt</span></li>
    </ol>` },
  { nr: "C04", name: "Geräte-Karte", idee: "Gerät mit Status-Punkt, zuletzt gesehen und – wenn es arbeitet – einem kleinen Equalizer.",
    einsatz: "Bridge: Geräte im Realm",
    html: `<div class="gc04">
      <div class="gc04__zeile ist-arbeitet"><span class="gc04__punkt"></span><strong>Laptop</strong><span class="gc04__eq"><i></i><i></i><i></i></span><em>trainiert …</em></div>
      <div class="gc04__zeile ist-online"><span class="gc04__punkt"></span><strong>Server</strong><em>bereit</em></div>
      <div class="gc04__zeile"><span class="gc04__punkt"></span><strong>Handy</strong><em>vor 2 Std.</em></div>
    </div>` },
  { nr: "C05", name: "Notiz-Karte", idee: "Wie ein Blatt Papier: Titel in Fraunces, zwei Zeilen Vorschau, Tags als kleine Zweige, Verbindungs-Zähler.",
    einsatz: "Myzel-Liste, Suche",
    html: `<article class="gc05"><strong>Server-Pläne</strong><p>ThinkCentre M920q, 2 TB SSD, Cloudflare Tunnel auf eigene Domain …</p><footer><span>#server</span><span>#bridge</span><em>3 ⟷</em></footer></article>` },
  { nr: "C06", name: "Liste mit Tages-Köpfen", idee: "Einträge gruppiert nach „Heute“, „Gestern“ – die Köpfe sind klein, gesperrt geschrieben und bleiben beim Scrollen oben kleben.",
    einsatz: "Grove Mail, Glocke, Harz",
    buehne: "hoch frei",
    html: `<div class="gc06">${[["Heute", ["Willkommen bei Grove Mail", "Bridge: Task erledigt", "Neue Datei in Harz"]], ["Gestern", ["Rinde: Passwort geändert", "Myzel: 4 neue Notizen"]], ["Diese Woche", ["Laub: Preset „Jazzkeller“", "Konto angelegt"]]].map(([k, l]) => `<h4>${k}</h4>${l.map((t) => `<div class="gc06__zeile">${t}</div>`).join("")}`).join("")}</div>` },
  { nr: "C07", name: "Reiter mit Strich", idee: "Tabs, unter denen ein Amber-Strich zum aktiven Reiter gleitet und seine Breite anpasst.",
    einsatz: "Konto, Laub-Bereiche, Harz-Ansichten",
    html: `<div class="gc07"><nav>${["Übersicht", "Dateien", "Geräte", "Einstellungen"].map((t, i) => `<button type="button" aria-selected="${i === 0}">${t}</button>`).join("")}<i></i></nav></div>`,
    an(b) {
      const nav = b.querySelector("nav"), strich = nav.querySelector("i")
      const setzen = (k) => { nav.querySelectorAll("button").forEach((x) => x.setAttribute("aria-selected", x === k)); strich.style.width = k.offsetWidth + "px"; strich.style.translate = k.offsetLeft + "px 0" }
      nav.querySelectorAll("button").forEach((k) => k.addEventListener("click", () => setzen(k)))
      requestAnimationFrame(() => setzen(nav.querySelector("button")))
    } },
  { nr: "C08", name: "Wurzelpfad", idee: "Brotkrumen als Wurzel: Punkte, verbunden mit einer feinen Linie, der letzte ist der Keimling.",
    einsatz: "Harz-Ordner, Myzel-Pfade",
    html: `<nav class="gc08"><a href="#" onclick="return false">Grove</a><a href="#" onclick="return false">Harz</a><a href="#" onclick="return false">Projekte</a><span>Bridge</span></nav>` },
  { nr: "C09", name: "Aufklapp-Fach", idee: "Fragen/Bereiche zum Aufklappen. Der Pfeil dreht sich, der Inhalt gleitet weich auf.",
    einsatz: "Hilfe, Einstellungen, Laub",
    html: `<div class="gc09">${[["Wo liegen meine Dateien?", "Auf deinem Gerät. Supabase kennt nur den Steckbrief."], ["Kostet Grove etwas?", "Nein. Grove bleibt komplett gratis."]].map(([f, a], i) => `<details ${i === 0 ? "open" : ""}><summary>${f}<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></summary><div><p>${a}</p></div></details>`).join("")}</div>` },
  { nr: "C10", name: "Profil mit Ringen", idee: "Avatar in Jahresringen – jeder Ring steht für ein Jahr (oder einen Monat) in Grove.",
    einsatz: "Konto, Nutzermenü",
    html: `<div class="gc10"><span class="gc10__avatar"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="38"/><circle cx="40" cy="40" r="34"/><circle cx="40" cy="40" r="30.5"/></svg><b>P</b></span><div><strong>Paddy</strong><span>paddy@groveme.eu.org</span><em>3 Ringe · seit Oktober</em></div></div>` },
  { nr: "C11", name: "Ruhige Tabelle", idee: "Keine Gitterlinien, nur feine Trenner. Zahlen rechtsbündig und gleich breit, Zeile glimmt beim Hover.",
    einsatz: "Harz-Liste, Mühle-Ergebnisse, Speicher",
    buehne: "hoch",
    html: `<table class="gc11"><thead><tr><th>Name</th><th>Typ</th><th>Größe</th></tr></thead><tbody>${[["bridge-plan.pdf", "PDF", "1,2 MB"], ["logo.svg", "Bild", "8 KB"], ["notizen.zip", "Archiv", "340 KB"], ["mix.mp3", "Audio", "4,8 MB"]].map((z) => `<tr>${z.map((t) => `<td>${t}</td>`).join("")}</tr>`).join("")}</tbody></table>` },
  { nr: "C12", name: "Kennzahl-Reihe", idee: "Drei Zahlen nebeneinander, getrennt durch feine senkrechte Linien. Kein Kasten drumherum.",
    einsatz: "Kopf eines Dienstes",
    html: `<div class="gc12"><div><strong>42</strong><span>Notizen</span></div><div><strong>87</strong><span>Verbindungen</span></div><div><strong>12</strong><span>Tags</span></div></div>` },
  { nr: "C13", name: "Kartenstapel", idee: "Mehrere Dinge als leicht versetzter Stapel. Beim Hover fächert er sich auf.",
    einsatz: "Gruppen (Mails eines Absenders, Dateien)",
    html: `<div class="gc13"><span></span><span></span><span><strong>3 Mails</strong> von Render</span></div>` },
  { nr: "C14", name: "Seitenleiste + Inhalt", idee: "Linke Leiste mit Diensten (Zeichen + Name), rechts der Inhalt. Aktiver Dienst hat einen kleinen Amber-Keil.",
    einsatz: "Grove als App am PC",
    buehne: "hoch frei",
    html: `<div class="gc14"><aside>${["Heute", "Myzel", "Harz", "Bridge", "Mail"].map((t, i) => `<a href="#" onclick="return false" ${i === 1 ? 'aria-current="page"' : ""}>${t}</a>`).join("")}</aside><main><strong>Myzel</strong><span></span><span></span><span class="kurz"></span></main></div>` },
  { nr: "C15", name: "Hervorgehobene Karte", idee: "Eine Karte darf mehr: feiner Amber-Rand oben, warmer Schimmer von oben links.",
    einsatz: "Wichtigster Dienst, Empfehlung, Neu",
    html: `<div class="gc15"><span>Neu</span><strong>Mühle</strong><p>Dateien umwandeln, alles im Browser.</p></div>` },
  { nr: "C16", name: "Raster mit Lücke", idee: "Ungleiches Raster: eine große Kachel, zwei kleine – wie ein Schaufenster.",
    einsatz: "Lichtung mit „Heute“",
    buehne: "hoch",
    html: `<div class="gc16"><div class="gross">Heute</div><div>Knospen</div><div>Glocke</div></div>` },
]

export default {
  id: "karten",
  name: "Karten & Layout",
  kurz: "UI-Formatierung",
  beschreibung: "Wie Inhalte in Grove stehen können: Karten, Listen, Tabellen, Reiter, Zeitleisten. Mit echten Beispieltexten, damit man sich's vorstellen kann.",
  vorschau: `<span class="gh-vs"><svg viewBox="0 0 48 48"><rect x="4" y="6" width="18" height="36" rx="4"/><rect x="26" y="6" width="18" height="16" rx="4"/><rect x="26" y="26" width="18" height="16" rx="4"/></svg></span>`,
  anzahl: KARTEN.length,
  bauen(el) { kacheln(el, KARTEN) },
}
