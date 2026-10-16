// Saat · Kurs „Bäume“ – Fotos als App-Dateien (Vite legt sie unter /assets/ ab, der Service Worker
// hält sie offline vor). Beim Herunterladen des Kurses werden sie in den Lernspeicher kopiert.
// NUR im Browser laden (import.meta.glob ist Vite) – die Tests nutzen baeume.js direkt.
const DATEIEN = import.meta.glob("./baeume/*.jpg", { eager: true, query: "?url", import: "default" })
export const MEDIEN = Object.fromEntries(Object.entries(DATEIEN).map(([pfad, url]) => [`medien/kurs-baeume-${pfad.split("/").pop()}`, url]))
