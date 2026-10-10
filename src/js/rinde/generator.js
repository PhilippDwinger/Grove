// Rinde: Passwort-Generator.
// Nutzt crypto.getRandomValues (echter Zufall des Betriebssystems), nie Math.random.

const SAETZE = {
  klein:   { alle: 'abcdefghijklmnopqrstuvwxyz', eindeutig: 'abcdefghijkmnopqrstuvwxyz' }, // ohne l
  gross:   { alle: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', eindeutig: 'ABCDEFGHJKLMNPQRSTUVWXYZ' },   // ohne I, O
  ziffern: { alle: '0123456789',                 eindeutig: '23456789' },                   // ohne 0, 1
  sonder:  { alle: '!@#$%&*?-_=+.:;',            eindeutig: '!@#$%&*?-_=+' },
};

export const STANDARD = { laenge: 20, klein: true, gross: true, ziffern: true, sonder: true, eindeutig: true };

// Gleichverteilte Zufallszahl 0..max-1 (verwirft Werte, die sonst manche Zeichen bevorzugen würden).
function zufall(max) {
  const grenze = Math.floor(0x100000000 / max) * max;
  const b = new Uint32Array(1);
  do { crypto.getRandomValues(b); } while (b[0] >= grenze);
  return b[0] % max;
}

function zeichensaetze(o) {
  return Object.keys(SAETZE)
    .filter((k) => o[k])
    .map((k) => SAETZE[k][o.eindeutig ? 'eindeutig' : 'alle']);
}

export function passwortErzeugen(optionen = {}) {
  const o = { ...STANDARD, ...optionen };
  let saetze = zeichensaetze(o);
  if (!saetze.length) saetze = [SAETZE.klein.eindeutig];

  const pool = saetze.join('');
  const zeichen = saetze.map((s) => s[zufall(s.length)]); // aus jeder gewählten Art mindestens eins
  while (zeichen.length < o.laenge) zeichen.push(pool[zufall(pool.length)]);

  for (let i = zeichen.length - 1; i > 0; i--) { // mischen
    const j = zufall(i + 1);
    [zeichen[i], zeichen[j]] = [zeichen[j], zeichen[i]];
  }
  return zeichen.join('');
}

// Stärke in Bit: wie viele Versuche ein Angreifer im Schnitt bräuchte (2^Bit).
export function staerkeBits(optionen = {}) {
  const o = { ...STANDARD, ...optionen };
  const pool = zeichensaetze(o).join('').length || 1;
  return Math.round(o.laenge * Math.log2(pool));
}

export function staerkeWort(bits) {
  if (bits < 50) return 'schwach';
  if (bits < 80) return 'brauchbar';
  if (bits < 110) return 'stark';
  return 'sehr stark';
}

export function zeichenArt(z) {
  if (/[0-9]/.test(z)) return 'ziffer';
  if (/[a-zA-Z]/.test(z)) return 'buchstabe';
  return 'sonder';
}
