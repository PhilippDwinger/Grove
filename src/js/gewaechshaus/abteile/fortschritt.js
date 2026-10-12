// ==========================================================
// Gewächshaus · Abteil „Fortschritt & Status“ (NUR ZUM TESTEN)
// P01–P12: Balken, Ringe, Schritte, Speicher, Status-Punkte, Pegel.
// Viele Kacheln haben einen Regler zum Ausprobieren. CSS: css/dienste/gewaechshaus/fortschritt.css (.gp)
// ==========================================================
import { kacheln } from "../kacheln.js"
import "../../../css/dienste/gewaechshaus/fortschritt.css"

const regler = (wert = 60) => `<input class="gp-regler" type="range" min="0" max="100" value="${wert}" aria-label="Wert ausprobieren">`
const mitRegler = (fn) => (b) => { const r = b.querySelector(".gp-regler"); const los = () => fn(b, +r.value); r.addEventListener("input", los); los() }

const FORTSCHRITT = [
  { nr: "P01", name: "Ast wächst", idee: "Fortschritt als Ast: Bei 25, 50 und 75 % treibt ein Blatt aus.", einsatz: "Hochladen, Umwandeln",
    html: `<div class="gp01"><div class="gp01__ast"><i class="gp01__holz"></i>${[25, 50, 75].map((p) => `<b data-ab="${p}" style="left:${p}%"></b>`).join("")}</div>${regler(55)}</div>`,
    an: mitRegler((b, v) => { b.querySelector(".gp01__holz").style.width = v + "%"; b.querySelectorAll("[data-ab]").forEach((x) => x.classList.toggle("ist-da", v >= +x.dataset.ab)) }) },
  { nr: "P02", name: "Jahresring füllt sich", idee: "Kreis-Fortschritt; innen stehen feine Ringe, außen läuft der Amber-Bogen.", einsatz: "Mühle, Backup, Sync",
    html: `<div class="gp02"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="34" class="spur"/><circle cx="40" cy="40" r="26" class="innen"/><circle cx="40" cy="40" r="18" class="innen"/><circle cx="40" cy="40" r="34" class="bogen" pathLength="100"/></svg><strong>0 %</strong>${regler(68)}</div>`,
    an: mitRegler((b, v) => { b.querySelector(".bogen").style.strokeDasharray = `${v} 100`; b.querySelector("strong").textContent = v + " %" }) },
  { nr: "P03", name: "Schritte als Wurzel", idee: "Schritte 1–4 als Knoten an einer Wurzel. Erledigte sind gefüllt, der aktuelle glimmt.", einsatz: "Mühle (1 rein → 4 Ergebnis), Einrichtung",
    html: `<div class="gp03" data-schritt="2">${["Datei", "Ziel", "Einstellen", "Fertig"].map((t, i) => `<button type="button" data-n="${i + 1}"><i>${i + 1}</i><span>${t}</span></button>`).join("")}</div>`,
    an(b) { const g = b.querySelector(".gp03"); g.querySelectorAll("button").forEach((k) => k.onclick = () => g.dataset.schritt = k.dataset.n) } },
  { nr: "P04", name: "Speicheranzeige", idee: "„Grove nutzt 12 MB von 500 MB“ – farbig aufgeteilt nach Diensten, mit kleiner Legende.", einsatz: "Konto: Supabase-Speicher, später Server",
    html: `<div class="gp04"><p><strong>12 MB</strong> von 500 MB</p><div class="gp04__balken"><i style="--w:1.2%;--f:var(--amber)"></i><i style="--w:.6%;--f:var(--flieder)"></i><i style="--w:.3%;--f:var(--gut)"></i><i style="--w:.3%;--f:var(--text-soft)"></i></div><ul><li style="--f:var(--amber)">Myzel 6 MB</li><li style="--f:var(--flieder)">Mail 3 MB</li><li style="--f:var(--gut)">Rinde 1,5 MB</li><li style="--f:var(--text-soft)">Rest</li></ul></div>` },
  { nr: "P05", name: "Status-Punkte", idee: "Vier Zustände, jeder mit eigenem Verhalten: online ruhig, arbeitet atmet, offline hohl, Fehler mit Kerbe.", einsatz: "Bridge-Geräte, Sync, Server",
    html: `<div class="gp05"><span class="an">online</span><span class="arbeit">arbeitet</span><span class="aus">offline</span><span class="fehler">Fehler</span></div>` },
  { nr: "P06", name: "VU-Meter", idee: "Pegel wie am Verstärker: grün-amber-rot Segmente, zeigt die Busy-Points eines Geräts.", einsatz: "Bridge: Auslastung",
    html: `<div class="gp06"><div class="gp06__pegel">${Array.from({ length: 12 }, (_, i) => `<i data-i="${i}"></i>`).join("")}</div><span>Busy-Points: <b>0</b></span>${regler(50)}</div>`,
    an: mitRegler((b, v) => { const n = Math.round(v / 100 * 12); b.querySelectorAll(".gp06__pegel i").forEach((x, i) => x.classList.toggle("an", i < n)); b.querySelector("b").textContent = Math.round(v / 10) }) },
  { nr: "P07", name: "Upload-Liste", idee: "Jede Datei mit eigenem feinen Balken unter dem Namen; fertige bekommen einen Haken.", einsatz: "Harz: mehrere Dateien",
    buehne: "hoch",
    html: `<div class="gp07">${[["bild.png", 100], ["bericht.pdf", 64], ["mix.mp3", 18], ["notizen.zip", 0]].map(([n, p]) => `<div class="${p === 100 ? "ist-fertig" : ""}"><span>${n}</span><em>${p === 100 ? "✓" : p ? p + " %" : "wartet"}</em><i style="--p:${p}%"></i></div>`).join("")}</div>` },
  { nr: "P08", name: "Countdown-Ring", idee: "Ring läuft ab bis zur Auto-Sperre. Die letzte Minute wird er warm.", einsatz: "Rinde: Auto-Sperre, Zwischenablage leeren",
    html: `<div class="gp08"><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" class="spur"/><circle cx="22" cy="22" r="18" class="rest" pathLength="100"/></svg><div><strong>0:30</strong><span>bis die Zwischenablage geleert wird</span></div></div>`,
    nochmal: true,
    an(b) {
      let s = 30; const r = b.querySelector(".rest"), t = b.querySelector("strong"), box = b.querySelector(".gp08")
      const tick = () => { if (!b.isConnected || !box.isConnected) return; r.style.strokeDasharray = `${s / 30 * 100} 100`; t.textContent = `0:${String(s).padStart(2, "0")}`; box.classList.toggle("ist-knapp", s <= 10); if (s-- > 0) setTimeout(tick, 1000) }
      tick()
    } },
  { nr: "P09", name: "Tagesziel in Knospen", idee: "Fünf Knospen für fünf Aufgaben. Erledigt = aufgeblüht. Klick auf eine Knospe!", einsatz: "„Heute“: Knospen-Ziel",
    html: `<div class="gp09">${Array.from({ length: 5 }, (_, i) => `<button type="button" class="${i < 2 ? "ist-offen" : ""}" aria-label="Knospe ${i + 1}"><svg viewBox="0 0 24 24"><path class="stiel" d="M12 22v-8"/><path class="zu" d="M12 14c-3 0-4.5-2.5-4.5-5S10 4.2 12 3c2 1.2 4.5 3.5 4.5 6s-1.5 5-4.5 5z"/><g class="auf"><circle cx="12" cy="5.5" r="2.6"/><circle cx="15.8" cy="8.3" r="2.6"/><circle cx="14.4" cy="12.6" r="2.6"/><circle cx="9.6" cy="12.6" r="2.6"/><circle cx="8.2" cy="8.3" r="2.6"/><circle class="m" cx="12" cy="9.5" r="1.8"/></g></svg></button>`).join("")}<span><b>2</b> von 5</span></div>`,
    an(b) { const z = b.querySelector("b"); b.querySelectorAll(".gp09 button").forEach((k) => k.onclick = () => { k.classList.toggle("ist-offen"); z.textContent = b.querySelectorAll(".gp09 .ist-offen").length }) } },
  { nr: "P10", name: "Bernstein füllt sich", idee: "Ein Tropfen, der sich von unten mit Harz füllt – mit leichter Wellenkante.", einsatz: "Harz: Platz auf dem Gerät",
    html: `<div class="gp10"><svg viewBox="0 0 60 80" aria-hidden="true"><defs><clipPath id="gp10c"><path d="M30 4C18 22 8 36 8 50a22 22 0 0 0 44 0C52 36 42 22 30 4z"/></clipPath></defs><g clip-path="url(#gp10c)"><rect width="60" height="80" class="grund"/><g class="harz-hoehe"><path class="harz" d="M-60 0q7.5-5 15 0t15 0 15 0 15 0 15 0 15 0 15 0 15 0 15 0V90h-120z"/></g></g><path class="rand" d="M30 4C18 22 8 36 8 50a22 22 0 0 0 44 0C52 36 42 22 30 4z"/></svg><span><b>40 %</b> belegt</span>${regler(40)}</div>`,
    an: mitRegler((b, v) => { b.querySelector(".harz-hoehe").setAttribute("transform", `translate(0 ${(76 - v / 100 * 66).toFixed(1)})`); b.querySelector("b").textContent = v + " %" }) },
  { nr: "P11", name: "Wellenform-Spur", idee: "Audio-Fortschritt als Wellenform: Gespieltes ist Amber, Rest grau. Klick springt an die Stelle.", einsatz: "Audio in Harz, Sprachnotizen",
    html: `<div class="gp11">${Array.from({ length: 48 }, (_, i) => `<i style="--h:${(20 + Math.abs(Math.sin(i * 0.7) * 60 + Math.sin(i * 2.3) * 20)).toFixed(0)}%"></i>`).join("")}</div>`,
    an(b) { const w = b.querySelector(".gp11"), s = w.querySelectorAll("i"); const setz = (p) => s.forEach((x, i) => x.classList.toggle("an", i / s.length < p)); setz(.35); w.onclick = (e) => { const r = w.getBoundingClientRect(); setz((e.clientX - r.left) / r.width) } } },
  { nr: "P12", name: "Unbestimmt laden", idee: "Wenn man nicht weiß, wie lange es dauert: ein kurzer Amber-Abschnitt gleitet ruhig hin und her.", einsatz: "Verbinden mit Server, Anmelden",
    html: `<div class="gp12"><span>Verbinde mit Bridge …</span><div class="gp12__bahn"><i></i></div></div>` },
]

export default {
  id: "fortschritt",
  name: "Fortschritt & Status",
  kurz: "Balken, Ringe, Pegel",
  beschreibung: "Wie Grove zeigt, wie weit etwas ist und wie es Geräten geht. Unter vielen Kacheln liegt ein Regler – zieh dran.",
  vorschau: `<span class="gh-vs"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" opacity=".3"/><path d="M24 6a18 18 0 0 1 17 23"/></svg></span>`,
  anzahl: FORTSCHRITT.length,
  bauen(el) { kacheln(el, FORTSCHRITT) },
}
