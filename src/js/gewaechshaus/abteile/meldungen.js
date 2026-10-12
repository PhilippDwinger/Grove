// ==========================================================
// Gewächshaus · Abteil „Meldungen“ (NUR ZUM TESTEN)
// M01–M12: Toasts, Hinweise, Zähler, Bestätigen ohne Dialog.
// CSS: css/dienste/gewaechshaus/meldungen.css (.gm)
// ==========================================================
import { kacheln, warten } from "../kacheln.js"
import "../../../css/dienste/gewaechshaus/meldungen.css"

const blatt = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14z"/><path d="M5 19l7-7"/></svg>`
const keim = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20v-8" pathLength="1"/><path d="M12 14c0-4-3-6-7-6 0 4 3 6 7 6zM12 12c0-4 3-6 7-6 0 4-3 6-7 6z" pathLength="1"/></svg>`
const achtung = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/></svg>`
const laterne = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 7l1.3-3h4.4L15.5 7"/><rect x="7" y="7" width="10" height="11" rx="2"/><path d="M9 20.5h6"/><path d="M12 10c1.2 1.4 1.6 2.4 1.6 3.2a1.6 1.6 0 0 1-3.2 0c0-.8.4-1.8 1.6-3.2z"/></svg>`

// Toast in eine Bühne setzen und nach ms wieder entfernen
function toast(buehne, html, klasse = "", ms = 2600) {
  const t = document.createElement("div")
  t.className = "gm-toast " + klasse
  t.innerHTML = html
  buehne.querySelector(".gm-platz").append(t)
  if (ms) setTimeout(() => weg(t), ms)
  return t
}
function weg(t) { t.classList.add("ist-weg"); t.addEventListener("animationend", () => t.remove(), { once: true }) }
const knopf = (text) => `<button class="gh-demo-knopf" type="button" data-los>${text}</button><div class="gm-platz"></div>`

const MELDUNGEN = [
  { nr: "M01", name: "Blatt-Toast", idee: "Kleine Meldung unten mittig. Gleitet hoch, bleibt kurz, sinkt wieder ab.",
    einsatz: "Gespeichert, Kopiert, Verschoben",
    buehne: "hoch", html: knopf("Notiz speichern"),
    an(b) { b.querySelector("[data-los]").onclick = () => toast(b, `${blatt}<span>Notiz gespeichert</span>`) } },
  { nr: "M02", name: "Keimling-Erfolg", idee: "Bei echten Erfolgen wächst im Toast ein kleiner Keimling.",
    einsatz: "Konto angelegt, Realm erstellt, Mail gesendet",
    buehne: "hoch", html: knopf("Realm erstellen"),
    an(b) { b.querySelector("[data-los]").onclick = () => toast(b, `${keim}<span><strong>Realm „Zuhause“</strong> ist bereit</span>`, "gm--gut gm--keim", 3200) } },
  { nr: "M03", name: "Ruhiger Fehler", idee: "Fehler ohne Wackeln und ohne Rot-Alarm: warmer roter Streifen links, klarer Satz, Knopf zum Nochmal-Versuchen.",
    einsatz: "Netzfehler, Speichern ging schief",
    buehne: "hoch", html: knopf("Senden (geht schief)"),
    an(b) { b.querySelector("[data-los]").onclick = () => {
      const t = toast(b, `${achtung}<span>Konnte nicht senden.<br><small>Keine Verbindung zum Server.</small></span><button type="button">Nochmal</button>`, "gm--fehler", 0)
      t.querySelector("button").onclick = () => weg(t)
    } } },
  { nr: "M04", name: "Rückgängig mit Zeitlinie", idee: "Nach dem Löschen: „Rückgängig“ und eine Linie, die in 5 s abläuft. Bis dahin ist nichts endgültig.",
    einsatz: "Löschen in Myzel, Harz, Mail",
    buehne: "hoch", html: knopf("Notiz löschen"),
    an(b) { b.querySelector("[data-los]").onclick = () => {
      const t = toast(b, `<span>Notiz gelöscht</span><button type="button">Rückgängig</button><i class="gm-zeit"></i>`, "gm--rueck", 5000)
      t.querySelector("button").onclick = () => { t.querySelector("span").textContent = "Wiederhergestellt"; t.querySelector("button").remove(); t.querySelector(".gm-zeit").remove(); setTimeout(() => weg(t), 1200) }
    } } },
  { nr: "M05", name: "Fortschritts-Toast", idee: "Für Dinge, die dauern: Toast mit Prozent und feinem Balken – wird am Ende zu „Fertig“.",
    einsatz: "Hochladen, Umwandeln (Mühle), Backup",
    buehne: "hoch", html: knopf("3 Dateien hochladen"),
    an(b) { b.querySelector("[data-los]").onclick = async () => {
      const t = toast(b, `<span>Lädt hoch … <b>0 %</b></span><i class="gm-balken"><i></i></i>`, "gm--fort", 0)
      for (let p = 0; p <= 100; p += 4) { t.querySelector("b").textContent = p + " %"; t.querySelector(".gm-balken i").style.width = p + "%"; await warten(60) }
      t.querySelector("span").innerHTML = "3 Dateien in Harz"; t.classList.add("gm--gut"); await warten(1600); weg(t)
    } } },
  { nr: "M06", name: "Hinweis-Leiste", idee: "Ein Streifen oben in der Seite für Dinge, die noch zu tun sind. Mit Laterne und Schließen-Kreuz.",
    einsatz: "„Migration fehlt“, „Offline“, Updates",
    html: `<div class="gm06">${laterne}<span><strong>Noch ein Schritt:</strong> Migration 008 in Supabase ausführen.</span><button type="button" aria-label="Schließen">×</button></div>`,
    nochmal: true,
    an(b) { b.querySelector("button").onclick = (e) => e.target.closest(".gm06").classList.add("ist-zu") } },
  { nr: "M07", name: "Hüpfender Zähler", idee: "Die Zahl an der Glocke springt einmal kurz, wenn etwas dazukommt – sonst ist sie still.",
    einsatz: "Glocke, Postfach",
    html: `<button class="gm07" type="button" aria-label="Benachrichtigungen"><svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg><b>2</b></button><span class="gm07__tipp">Klick = neue Meldung</span>`,
    an(b) {
      let n = 2
      const k = b.querySelector(".gm07"), z = k.querySelector("b")
      k.onclick = () => { z.textContent = ++n; k.classList.remove("ist-neu"); void k.offsetWidth; k.classList.add("ist-neu") }
    } },
  { nr: "M08", name: "Info-Kasten", idee: "Ruhiger Kasten im Text für Hinweise. Vier Stimmungen: Info, Tipp, Achtung, Gut.",
    einsatz: "Anleitungen, Einstellungen, Hilfe",
    buehne: "hoch",
    html: `<div class="gm08-liste">
      <p class="gm08">${laterne}<span>Dateien bleiben auf deinem Gerät.</span></p>
      <p class="gm08 gm08--tipp">${keim}<span>Tipp: Strg K sucht überall.</span></p>
      <p class="gm08 gm08--achtung">${achtung}<span>Master-Passwort ist nicht zurücksetzbar.</span></p>
      <p class="gm08 gm08--gut">${blatt}<span>Alles synchron.</span></p>
    </div>` },
  { nr: "M09", name: "Gestapelte Toasts", idee: "Kommen mehrere Meldungen, stapeln sie sich ordentlich – die älteren rutschen nach oben und werden blasser.",
    einsatz: "Viele Bridge-Antworten auf einmal",
    buehne: "hoch", html: knopf("3 Antworten von Bridge"),
    an(b) { b.querySelector("[data-los]").onclick = async () => {
      for (const g of ["Laptop", "Server", "Handy"]) { toast(b, `<span class="gm-punkt"></span><span><strong>${g}</strong> hat geantwortet</span>`, "gm--stapel", 3500); await warten(450) }
    } } },
  { nr: "M10", name: "Bestätigen an Ort und Stelle", idee: "Statt Dialog verwandelt sich der Knopf selbst in „Wirklich? Ja / Nein“. Nach 4 s ohne Klick geht er zurück.",
    einsatz: "Löschen, Abmelden, Zurücksetzen",
    html: `<div class="gm10"><button class="gm10__start" type="button">Zurücksetzen</button><span class="gm10__frage">Wirklich?<button type="button" data-ja>Ja</button><button type="button" data-nein>Nein</button></span></div>`,
    an(b) {
      const g = b.querySelector(".gm10"); let uhr
      const zu = () => { clearTimeout(uhr); g.classList.remove("ist-offen") }
      g.querySelector(".gm10__start").onclick = () => { g.classList.add("ist-offen"); uhr = setTimeout(zu, 4000) }
      g.querySelector("[data-nein]").onclick = zu
      g.querySelector("[data-ja]").onclick = () => { zu(); g.querySelector(".gm10__start").textContent = "Zurückgesetzt ✓" }
    } },
  { nr: "M11", name: "Glocken-Meldung", idee: "So könnte eine Meldung in der Glocke aussehen: Dienst-Zeichen, Titel, ein Satz, Zeit – ungelesen mit Amber-Punkt.",
    einsatz: "Glocke (Benachrichtigungen)",
    buehne: "hoch",
    html: `<div class="gm11">
      <a class="ist-neu" href="#" onclick="return false"><span class="gm11__z">${keim}</span><span><strong>Bridge</strong>Laptop hat das Training beendet.<em>vor 2 Min.</em></span></a>
      <a href="#" onclick="return false"><span class="gm11__z">${blatt}</span><span><strong>Grove Mail</strong>Render: Deploy erfolgreich.<em>vor 1 Std.</em></span></a>
    </div>` },
  { nr: "M12", name: "Status in der Kopfzeile", idee: "Ganz leise: ein Satz rechts oben neben der Glocke, der kurz erscheint – „Gespeichert · 14:32“ – und dann verblasst.",
    einsatz: "Autosave (Myzel), Sync",
    html: `<div class="gm12"><span class="gm12__text"></span><button class="gh-demo-knopf gh-demo-knopf--leise" type="button">Tippen simulieren</button></div>`,
    an(b) {
      const t = b.querySelector(".gm12__text")
      b.querySelector("button").onclick = async () => {
        t.className = "gm12__text ist-an"; t.textContent = "Speichert …"
        await warten(700)
        const d = new Date(); t.textContent = `Gespeichert · ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`
        await warten(1800); t.className = "gm12__text"
      }
    } },
]

export default {
  id: "meldungen",
  name: "Meldungen",
  kurz: "Toasts & Hinweise",
  beschreibung: "Wie Grove dir Dinge sagt – ohne Browser-Dialoge, ohne Alarm. Drück die Knöpfe in den Kacheln, dann erscheinen die Meldungen.",
  vorschau: `<span class="gh-vs"><span class="gm-toast gm--gut" style="position:static;animation:none">${keim}<span>Gespeichert</span></span></span>`,
  anzahl: MELDUNGEN.length,
  bauen(el) { kacheln(el, MELDUNGEN) },
}
