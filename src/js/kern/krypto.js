// Grove-Kern: Verschlüsselung im Browser mit der eingebauten WebCrypto-API.
//
// Ablauf:
// 1. Aus Master-Passwort + zufälligem Salz wird mit PBKDF2 (600.000 Runden, SHA-256)
//    ein AES-256-Schlüssel abgeleitet. Die vielen Runden machen Rateangriffe teuer.
// 2. Mit diesem Schlüssel wird jeder Eintrag per AES-GCM verschlüsselt.
//    GCM merkt außerdem, wenn jemand den Geheimtext verändert hat.
// 3. Der Schlüssel ist "nicht exportierbar": er lebt nur im Arbeitsspeicher dieses Tabs.

export const STANDARD_ITERATIONEN = 600000;

const enc = new TextEncoder();
const dec = new TextDecoder();

export function zuBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

export function ausBase64(text) {
  const s = atob(text);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

export function neuesSalz() {
  return crypto.getRandomValues(new Uint8Array(16));
}

export async function schluesselAbleiten(masterPasswort, salz, iterationen = STANDARD_ITERATIONEN) {
  const basis = await crypto.subtle.importKey('raw', enc.encode(masterPasswort), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salz, iterations: iterationen, hash: 'SHA-256' },
    basis,
    { name: 'AES-GCM', length: 256 },
    false, // nicht exportierbar
    ['encrypt', 'decrypt']
  );
}

// Verschlüsselt einen beliebigen JSON-Wert. Ergebnis: Base64 aus 12 Byte IV + Geheimtext.
export async function verschluesseln(schluessel, wert) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const geheim = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, schluessel, enc.encode(JSON.stringify(wert)))
  );
  const alles = new Uint8Array(iv.length + geheim.length);
  alles.set(iv);
  alles.set(geheim, iv.length);
  return zuBase64(alles);
}

// Wirft einen Fehler, wenn der Schlüssel falsch ist oder der Text verändert wurde.
export async function entschluesseln(schluessel, text) {
  const alles = ausBase64(text);
  const klar = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: alles.subarray(0, 12) },
    schluessel,
    alles.subarray(12)
  );
  return JSON.parse(dec.decode(klar));
}
