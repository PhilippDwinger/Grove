// ==========================================================
// Gewächshaus · Abteil „Leere Zustände“ (NUR ZUM TESTEN)
// I01–I12: kleine Illustrationen + Satz für „hier ist (noch) nichts“.
// Linien-Illustrationen in Amber, Flächen in Grove-Tönen. CSS: css/dienste/gewaechshaus/leer.css (.gi)
// ==========================================================
import { kacheln } from "../kacheln.js"
import "../../../css/dienste/gewaechshaus/leer.css"

const leer = (svg, titel, text, knopf = "") => `<div class="gi">${svg}<strong>${titel}</strong><span>${text}</span>${knopf ? `<button class="gh-demo-knopf gh-demo-knopf--leise" type="button">${knopf}</button>` : ""}</div>`
const bild = (inhalt) => `<svg class="gi-bild" viewBox="0 0 120 80" aria-hidden="true">${inhalt}</svg>`

const LEER = [
  { nr: "I01", name: "Leeres Nest", idee: "Ein Nest auf einem Ast, nichts drin. Ein Federchen schaukelt langsam herunter.", einsatz: "Grove Mail: Posteingang leer",
    html: leer(bild(`<path class="ast" d="M8 58c30-6 70-4 104 2"/><path class="flaeche" d="M36 52c0 10 10 16 24 16s24-6 24-16z"/><path d="M36 52c0 10 10 16 24 16s24-6 24-16M38 56c8 3 36 3 44 0M40 61c8 3 32 3 40 0"/><path d="M34 52h52"/><path class="feder" d="M92 14c-6 4-8 10-6 16 6-2 8-8 6-16zM86 30l-3 5"/>`), "Kein neuer Brief", "Alles gelesen. Das Nest wartet.") },
  { nr: "I02", name: "Leeres Blatt", idee: "Ein einzelnes leeres Blatt hängt am Zweig – bereit, beschrieben zu werden.", einsatz: "Myzel: noch keine Notizen",
    html: leer(bild(`<path class="ast" d="M10 18c20 4 40 2 60-6"/><path d="M50 15v10"/><path class="flaeche" d="M50 25c-16 6-22 22-14 40 18-2 26-16 14-40z"/><path d="M50 25c-16 6-22 22-14 40 18-2 26-16 14-40zM48 32c-4 10-6 20-12 33"/><path class="punkt" d="M80 40h22M80 48h16M80 56h20"/>`), "Noch keine Notizen", "Das erste Blatt ist leer.", "Notiz anlegen") },
  { nr: "I03", name: "Leerer Bernstein", idee: "Ein Harztropfen ohne Einschluss – Harz wartet auf die erste Datei.", einsatz: "Harz: keine Dateien",
    html: leer(bild(`<path class="ast" d="M30 8v20"/><path class="harz" d="M60 18c-14 16-22 28-22 38a22 22 0 0 0 44 0c0-10-8-22-22-38z"/><path d="M60 18c-14 16-22 28-22 38a22 22 0 0 0 44 0c0-10-8-22-22-38z"/><path class="glanzlinie" d="M50 50c0-6 3-11 7-16"/>`), "Noch nichts verwahrt", "Zieh Dateien hierher, Harz hebt sie auf.", "Datei wählen") },
  { nr: "I04", name: "Laterne aus", idee: "Eine Laterne ohne Flamme. Statt „Fehler“ fühlt sich offline so ruhig an.", einsatz: "Offline-Seite, keine Verbindung",
    html: leer(bild(`<path d="M50 16l4-8h12l4 8M60 4v4"/><rect class="flaeche" x="46" y="16" width="28" height="36" rx="5"/><rect x="46" y="16" width="28" height="36" rx="5"/><path d="M50 58h20"/><path class="rauch" d="M60 30c-3 3 3 5 0 8s3 5 0 8"/>`), "Gerade offline", "Was lokal liegt, geht trotzdem. Der Rest kommt, sobald das Netz zurück ist.") },
  { nr: "I05", name: "Blüte – alles erledigt", idee: "Alle Knospen sind aufgegangen: eine offene Blüte, ein paar Pollen schweben.", einsatz: "Knospen: nichts mehr offen",
    html: leer(bild(`<path d="M60 74V44"/><path d="M60 62c-8 0-12-4-14-8 6-2 11 0 14 4"/>${[0, 72, 144, 216, 288].map((w) => `<ellipse class="flaeche" cx="60" cy="24" rx="7" ry="11" transform="rotate(${w} 60 36)"/><ellipse cx="60" cy="24" rx="7" ry="11" transform="rotate(${w} 60 36)"/>`).join("")}<circle class="mitte" cx="60" cy="36" r="5"/><circle class="pollen" cx="84" cy="18" r="1.6"/><circle class="pollen p2" cx="92" cy="30" r="1.2"/><circle class="pollen p3" cx="30" cy="22" r="1.4"/>`), "Alles erblüht", "Keine offenen Knospen. Gönn dir 'ne Pause.") },
  { nr: "I06", name: "Lupe im Moos", idee: "Eine Lupe liegt im Moos – hier ist nichts zu finden.", einsatz: "Suche ohne Treffer",
    html: leer(bild(`<path class="moos" d="M6 68c8-8 14 0 20-6s12 2 18-4 12 4 18-2 12 2 18-4 14 4 20 0 12 2 14 4"/><circle class="flaeche" cx="56" cy="34" r="16"/><circle cx="56" cy="34" r="16"/><path d="M68 46l16 16"/><path class="glanzlinie" d="M48 28a10 10 0 0 1 8-5"/>`), "Nichts gefunden", "Versuch's mit einem anderen Wort.") },
  { nr: "I07", name: "Schlafender Plattenspieler", idee: "Tonarm in der Ruhe, ein kleines „z“ steigt auf. Kein Gerät ist gerade da.", einsatz: "Bridge: kein Gerät online",
    html: leer(bild(`<rect class="flaeche" x="20" y="22" width="80" height="50" rx="6"/><rect x="20" y="22" width="80" height="50" rx="6"/><circle cx="54" cy="47" r="18"/><circle cx="54" cy="47" r="4"/><path d="M88 28v20l-8 6"/><text class="zzz" x="96" y="16">z</text><text class="zzz z2" x="104" y="8">z</text>`), "Alle schlafen", "Kein Gerät ist im Realm. Starte einen Client, dann geht's los.") },
  { nr: "I08", name: "Keimling am Morgen", idee: "Ein Keimling, dahinter geht die Sonne auf. Für den allerersten Besuch.", einsatz: "Willkommen nach dem Registrieren",
    html: leer(bild(`<path class="sonne" d="M30 64a30 30 0 0 1 60 0"/><path d="M14 64h92"/><path d="M60 64V42"/><path class="flaeche" d="M60 50c0-8-6-12-14-12 0 8 6 12 14 12zM60 46c0-8 6-12 14-12 0 8-6 12-14 12z"/><path d="M60 50c0-8-6-12-14-12 0 8 6 12 14 12zM60 46c0-8 6-12 14-12 0 8-6 12-14 12z"/>`), "Willkommen in Grove", "Hier wächst ab jetzt deine Welt.", "Rundgang starten") },
  { nr: "I09", name: "Schloss mit Ranke", idee: "Ein Schloss, um das sich eine Ranke legt. Rinde ist zu – und das ist gut so.", einsatz: "Rinde gesperrt",
    html: leer(bild(`<rect class="flaeche" x="40" y="34" width="40" height="34" rx="6"/><rect x="40" y="34" width="40" height="34" rx="6"/><path d="M48 34v-8a12 12 0 0 1 24 0v8"/><circle cx="60" cy="49" r="3"/><path d="M60 52v6"/><path class="ranke" d="M34 70c6-10 2-18 8-26s14-6 14-14M42 50c-6-2-8-6-6-10M86 66c-4-8 0-14-4-20"/>`), "Rinde ist gesperrt", "Gib dein Master-Passwort ein, um sie zu öffnen.", "Entsperren") },
  { nr: "I10", name: "Wegweiser", idee: "Ein Holz-Wegweiser zeigt in zwei Richtungen – keine davon ist die gesuchte Seite.", einsatz: "404: Hier wächst nichts",
    html: leer(bild(`<path d="M58 14v60"/><path class="flaeche" d="M60 20h30l8 7-8 7H60z"/><path d="M60 20h30l8 7-8 7H60z"/><path class="flaeche" d="M56 38H28l-8 7 8 7h28z"/><path d="M56 38H28l-8 7 8 7h28z"/><path d="M44 74h28"/>`), "Hier wächst nichts", "Diese Seite gibt's nicht. Zurück zur Lichtung?", "Zur Lichtung") },
  { nr: "I11", name: "Leere Zeitleiste", idee: "Ein einzelner Ring ganz am Anfang einer langen Linie – die Geschichte beginnt gerade.", einsatz: "Jahresringe: noch keine Einträge",
    html: leer(bild(`<path class="punkt" d="M20 40h86"/><circle cx="20" cy="40" r="8"/><circle cx="20" cy="40" r="4"/><circle class="mitte" cx="20" cy="40" r="1.5"/>`), "Der erste Ring", "Was du in Grove tust, legt sich hier Ring um Ring an.") },
  { nr: "I12", name: "Stilles Mikro", idee: "Ein Mikrofon auf leerer Bühne, ein Lichtkegel. Noch keine Aufnahme.", einsatz: "Sprachnotizen, Audio in Harz",
    html: leer(bild(`<path class="kegel" d="M50 4h20l22 70H28z"/><rect class="flaeche" x="54" y="22" width="12" height="20" rx="6"/><rect x="54" y="22" width="12" height="20" rx="6"/><path d="M48 36a12 12 0 0 0 24 0M60 48v20M50 72h20"/>`), "Noch keine Aufnahme", "Die Bühne gehört dir.", "Aufnehmen") },
]

export default {
  id: "leer",
  name: "Leere Zustände",
  kurz: "Wenn (noch) nichts da ist",
  beschreibung: "Kleine Illustrationen mit einem freundlichen Satz für leere Listen, Offline, 404 und den ersten Besuch – damit Leere nicht nach Fehler aussieht.",
  vorschau: `<span class="gh-vs"><svg viewBox="0 0 48 48"><path d="M24 8c-8 9-12 16-12 22a12 12 0 0 0 24 0c0-6-4-13-12-22z"/></svg></span>`,
  anzahl: LEER.length,
  bauen(el) { kacheln(el, LEER.map((l) => ({ ...l, buehne: "hoch" }))) },
}
