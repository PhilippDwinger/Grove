// Grove-Kern: Dienst-Register.
//
// Jeder Dienst meldet hier an, wie man seine Objekte findet und anzeigt.
// Dadurch können Suche (Strg+K) und "Verknüpfen" mit allen Diensten arbeiten,
// ohne dass sie einen einzelnen Dienst kennen müssen.
//
// dienstRegistrieren({
//   typ:    'myzel',                        // Kürzel, landet in der Verbindungen-Tabelle
//   name:   'Myzel',                        // Anzeigename
//   url:    (id) => `/dienste/myzel/?notiz=${id}`,
//   suchen: async (text) => [{ id, titel, untertitel }],   // text kann leer sein → "Zuletzt"
//   holen:  async (id)   =>  { id, titel, untertitel } | null,
// });

const dienste = new Map();

export function dienstRegistrieren(def) {
  for (const feld of ['typ', 'name', 'url', 'suchen', 'holen']) {
    if (!def[feld]) throw new Error(`Dienst-Registrierung ohne "${feld}"`);
  }
  dienste.set(def.typ, def);
}

export function alleDienste() {
  return [...dienste.values()];
}

export function dienst(typ) {
  return dienste.get(typ);
}

// Sucht in allen Diensten gleichzeitig. Fällt ein Dienst aus, liefern die anderen trotzdem.
export async function ueberallSuchen(text) {
  const ergebnisse = await Promise.allSettled(
    alleDienste().map(async (d) => {
      const treffer = (await d.suchen(text)) || [];
      return treffer.map((t) => ({
        ...t,
        typ: d.typ,
        dienstName: d.name,
        url: d.url(t.id),
      }));
    })
  );
  return ergebnisse.flatMap((e) => (e.status === 'fulfilled' ? e.value : []));
}

// Holt ein einzelnes Objekt zum Anzeigen (z. B. in der Liste "Verbunden mit").
export async function objektHolen(typ, id) {
  const d = dienst(typ);
  if (!d) {
    return { typ, id, titel: 'Unbekannter Dienst', untertitel: typ, dienstName: typ, url: null, geloescht: false };
  }
  try {
    const o = await d.holen(id);
    if (!o) return { typ, id, titel: 'Gelöscht', dienstName: d.name, url: null, geloescht: true };
    return { ...o, typ, id, dienstName: d.name, url: d.url(id) };
  } catch {
    return { typ, id, titel: 'Nicht erreichbar', dienstName: d.name, url: d.url(id), geloescht: false };
  }
}
