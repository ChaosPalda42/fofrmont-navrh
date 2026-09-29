// C-003: Demo administrace – stav, recenze, stavby, došlé poptávky, export

export const KLIC = "fofrmont-admin-v1";

const COMBINING = /[\u0300-\u036f]/g;

export function prazdnyStav() {
  return {
    texty: {},
    recenze: { pridane: [], upravene: {}, smazane: [], stavy: {} },
    stavby: { pridane: [], upravene: {}, smazane: [] },
    poptavky: [],
    zmeneno: null,
  };
}

function jeObjekt(h) {
  return h !== null && typeof h === "object" && !Array.isArray(h);
}

function doplnSekci(sekce, seStavy) {
  const p = prazdnyStav();
  const vysledek = {
    pridane: Array.isArray(sekce?.pridane) ? sekce.pridane : p.recenze.pridane,
    upravene: jeObjekt(sekce?.upravene) ? sekce.upravene : p.recenze.upravene,
    smazane: Array.isArray(sekce?.smazane) ? sekce.smazane : p.recenze.smazane,
  };
  if (seStavy) vysledek.stavy = jeObjekt(sekce?.stavy) ? sekce.stavy : p.recenze.stavy;
  return vysledek;
}

function doplnStav(surovy) {
  const p = prazdnyStav();
  return {
    texty: jeObjekt(surovy.texty) ? surovy.texty : p.texty,
    recenze: doplnSekci(surovy.recenze, true),
    stavby: doplnSekci(surovy.stavby, false),
    poptavky: Array.isArray(surovy.poptavky) ? surovy.poptavky : p.poptavky,
    zmeneno: surovy.zmeneno ?? p.zmeneno,
  };
}

export function nacti(uloziste) {
  try {
    const surovy = uloziste.getItem(KLIC);
    if (surovy === null || surovy === undefined) return prazdnyStav();
    const data = JSON.parse(surovy);
    if (!jeObjekt(data)) return prazdnyStav();
    return doplnStav(data);
  } catch {
    return prazdnyStav();
  }
}

export function uloz(uloziste, stav) {
  const novy = { ...stav, zmeneno: new Date().toISOString() };
  uloziste.setItem(KLIC, JSON.stringify(novy));
  return novy;
}

export function vymaz(uloziste) {
  uloziste.removeItem(KLIC);
}

export function slug(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function nastavText(stav, jazyk, klic, hodnota) {
  const novy = { ...stav, texty: { ...stav.texty } };
  const jazykObj = { ...(novy.texty[jazyk] ?? {}) };
  if (hodnota === null || hodnota === undefined || String(hodnota).trim() === "") {
    delete jazykObj[klic];
  } else {
    jazykObj[klic] = hodnota;
  }
  novy.texty[jazyk] = jazykObj;
  return novy;
}

export function textyProJazyk(stav, jazyk, zaklad) {
  const vysledek = { ...zaklad };
  const jazykObj = stav.texty?.[jazyk];
  if (jeObjekt(jazykObj)) {
    for (const [klic, hodnota] of Object.entries(jazykObj)) {
      vysledek[klic] = hodnota;
    }
  }
  return vysledek;
}

function volneId(sekce, zaklad, zakladni) {
  const obsazene = new Set([
    ...sekce.pridane.map((p) => p.id),
    ...Object.keys(sekce.upravene),
    ...zaklad.map((z) => z.id),
  ]);
  if (!obsazene.has(zakladni)) return zakladni;
  let n = 2;
  while (obsazene.has(`${zakladni}-${n}`)) n += 1;
  return `${zakladni}-${n}`;
}

export function ulozPolozku(stav, sekce, polozka, zaklad = []) {
  if (sekce !== "recenze" && sekce !== "stavby") return stav;
  const puvodni = stav[sekce];
  const id = polozka.id ?? volneId(puvodni, zaklad, slug(polozka.nazev ?? polozka.jmeno));
  const item = { ...polozka, id };
  const vZakladu = zaklad.some((z) => z.id === id);
  let pridane;
  let upravene;
  let smazane;
  if (vZakladu) {
    upravene = { ...puvodni.upravene, [id]: { ...(puvodni.upravene[id] ?? {}), ...item } };
    smazane = puvodni.smazane.filter((x) => x !== id);
    pridane = puvodni.pridane;
  } else {
    const index = puvodni.pridane.findIndex((p) => p.id === id);
    if (index >= 0) {
      pridane = puvodni.pridane.map((p, i) => (i === index ? item : p));
    } else {
      pridane = [item, ...puvodni.pridane];
    }
    upravene = puvodni.upravene;
    smazane = puvodni.smazane;
  }
  const novaSekce = { ...puvodni, pridane, upravene, smazane };
  if (sekce === "recenze") novaSekce.stavy = puvodni.stavy;
  return { ...stav, [sekce]: novaSekce };
}

export function smazPolozku(stav, sekce, id) {
  if (sekce !== "recenze" && sekce !== "stavby") return stav;
  const puvodni = stav[sekce];
  let pridane;
  let upravene;
  let smazane;
  if (puvodni.pridane.some((p) => p.id === id)) {
    pridane = puvodni.pridane.filter((p) => p.id !== id);
    upravene = puvodni.upravene;
    smazane = puvodni.smazane;
  } else {
    pridane = puvodni.pridane;
    upravene = { ...puvodni.upravene };
    delete upravene[id];
    smazane = puvodni.smazane.includes(id) ? puvodni.smazane : [...puvodni.smazane, id];
  }
  const novaSekce = { ...puvodni, pridane, upravene, smazane };
  if (sekce === "recenze") novaSekce.stavy = puvodni.stavy;
  return { ...stav, [sekce]: novaSekce };
}

const POVOLENE_STAVY = ["schvalena", "ceka", "skryta"];

export function zmenStavRecenze(stav, id, novyStav) {
  if (!POVOLENE_STAVY.includes(novyStav)) return stav;
  const r = stav.recenze;
  const pridane = r.pridane.map((p) => (p.id === id ? { ...p, stav: novyStav } : p));
  return {
    ...stav,
    recenze: { ...r, pridane, stavy: { ...r.stavy, [id]: novyStav } },
  };
}

export function slozSeznam(stav, sekce, zaklad) {
  const s = stav[sekce];
  const zbyly = zaklad
    .filter((z) => !s.smazane.includes(z.id))
    .map((z) => ({ item: { ...z, ...(s.upravene[z.id] ?? {}) }, nova: false }));
  const pridane = s.pridane.map((p) => ({ item: { ...p }, nova: true }));
  const vse = [...zbyly, ...pridane];
  if (sekce === "recenze") {
    for (const v of vse) {
      const st = stav.recenze.stavy[v.item.id];
      if (st !== undefined) v.item.stav = st;
    }
  }
  vse.sort((a, b) => {
    const da = a.item.datum != null ? String(a.item.datum) : "";
    const db = b.item.datum != null ? String(b.item.datum) : "";
    if (da !== db) return da < db ? 1 : -1;
    return a.nova === b.nova ? 0 : a.nova ? -1 : 1;
  });
  return vse.map((v) => v.item);
}

export function pridejPoptavku(stav, poptavka) {
  const id =
    poptavka.id ?? `p-${stav.poptavky.length}-${slug(poptavka.jmeno ?? "")}`;
  const item = { ...poptavka, id, prijato: poptavka.prijato ?? "", precteno: false };
  const poptavky = [item, ...stav.poptavky].slice(0, 50);
  return { ...stav, poptavky };
}

export function oznacPrectene(stav, id, hodnota = true) {
  const poptavky = stav.poptavky.map((p) => (p.id === id ? { ...p, precteno: hodnota } : p));
  return { ...stav, poptavky };
}

export function smazPoptavku(stav, id) {
  return { ...stav, poptavky: stav.poptavky.filter((p) => p.id !== id) };
}

export function statistiky(stav, zakladRecenzi = [], zakladStaveb = []) {
  const recenze = slozSeznam(stav, "recenze", zakladRecenzi);
  const stavby = slozSeznam(stav, "stavby", zakladStaveb);
  let textyZmeneno = 0;
  for (const jazyk of Object.values(stav.texty)) {
    if (jeObjekt(jazyk)) textyZmeneno += Object.keys(jazyk).length;
  }
  return {
    recenzeCeka: recenze.filter((r) => r.stav === "ceka").length,
    recenzeCelkem: recenze.length,
    stavbyCelkem: stavby.length,
    poptavkyNeprectene: stav.poptavky.filter((p) => p.precteno !== true).length,
    textyZmeneno,
  };
}

export function exportJson(stav) {
  return JSON.stringify(stav, null, 2);
}

export function importJson(stav, text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { ok: false, chyba: String(e?.message ?? e) };
  }
  if (!jeObjekt(data)) return { ok: false, chyba: "Očekáván objekt" };
  return { ok: true, stav: doplnStav(data) };
}
