// Macht Text sicher für innerHTML (verhindert, dass Inhalte als HTML ausgeführt werden).
const ZEICHEN = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(wert) {
  return String(wert ?? '').replace(/[&<>"']/g, (z) => ZEICHEN[z]);
}
