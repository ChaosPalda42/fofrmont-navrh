// Průvodce poptávkou – stavový automat nad definicí kroků (C-002).
// Modul neobsahuje žádný konkrétní text otázek; kroky přicházejí jako data.

export function vyplneno(hodnota) {
  if (hodnota === undefined || hodnota === null) return false;
  if (typeof hodnota === "string") return hodnota.trim().length > 0;
  if (Array.isArray(hodnota)) return hodnota.length > 0;
  return true; // číslo (i 0), boolean (i false), objekty
}

export function splnenaPodminka(podminka, stav) {
  if (!podminka) return true;
  const v = stav[podminka.krok];
  if (podminka.jednaZ !== undefined) {
    if (Array.isArray(v)) return podminka.jednaZ.some((x) => v.includes(x));
    return podminka.jednaZ.includes(v);
  }
  if (podminka.hodnota !== undefined) {
    if (Array.isArray(v)) return v.includes(podminka.hodnota);
    return v === podminka.hodnota;
  }
  return vyplneno(v);
}

export function viditelneKroky(definice, stav) {
  return definice.filter((krok) => splnenaPodminka(krok.podminka, stav));
}

export function validujKrok(krok, hodnota) {
  if (!vyplneno(hodnota)) {
    return krok.povinne === true ? "required" : null;
  }
  const ids = (krok.moznosti ?? []).map((m) => m.id);
  switch (krok.typ) {
    case "volba":
      return ids.includes(hodnota) ? null : "volba";
    case "vicevolba": {
      if (!Array.isArray(hodnota) || !hodnota.every((x) => ids.includes(x))) {
        return "volba";
      }
      if (krok.min !== undefined && hodnota.length < krok.min) return "min";
      if (krok.max !== undefined && hodnota.length > krok.max) return "max";
      return null;
    }
    case "cislo": {
      const c = Number(hodnota);
      if (!Number.isFinite(c)) return "cislo";
      if (krok.min !== undefined && c < krok.min) return "min";
      if (krok.max !== undefined && c > krok.max) return "max";
      return null;
    }
    case "text": {
      const delka = String(hodnota).trim().length;
      if (krok.min !== undefined && delka < krok.min) return "min";
      if (krok.max !== undefined && delka > krok.max) return "max";
      return null;
    }
    case "ano-ne":
      return typeof hodnota === "boolean" ? null : "volba";
    default:
      return null;
  }
}

export function chyby(definice, stav) {
  const vysledek = {};
  for (const krok of viditelneKroky(definice, stav)) {
    const kod = validujKrok(krok, stav[krok.id]);
    if (kod !== null) vysledek[krok.id] = kod;
  }
  return vysledek;
}

export function dalsiKrok(definice, stav, aktualni = null) {
  const viditelne = viditelneKroky(definice, stav);
  if (aktualni === null) return viditelne.length ? viditelne[0].id : null;
  const i = viditelne.findIndex((k) => k.id === aktualni);
  if (i === -1) return null;
  return i + 1 < viditelne.length ? viditelne[i + 1].id : null;
}

export function predchoziKrok(definice, stav, aktualni) {
  const viditelne = viditelneKroky(definice, stav);
  const i = viditelne.findIndex((k) => k.id === aktualni);
  if (i <= 0) return null;
  return viditelne[i - 1].id;
}

export function postup(definice, stav) {
  const viditelne = viditelneKroky(definice, stav);
  const celkem = viditelne.length;
  const hotovo = viditelne.filter(
    (krok) => vyplneno(stav[krok.id]) && validujKrok(krok, stav[krok.id]) === null,
  ).length;
  const procent = celkem === 0 ? 0 : Math.round((hotovo / celkem) * 100);
  return { hotovo, celkem, procent };
}

export function lzeOdeslat(definice, stav) {
  const viditelne = viditelneKroky(definice, stav);
  if (Object.keys(chyby(definice, stav)).length > 0) return false;
  return viditelne.every((krok) => !krok.povinne || vyplneno(stav[krok.id]));
}

function popisMoznosti(krok, id) {
  const m = (krok.moznosti ?? []).find((x) => x.id === id);
  return m ? m.popis : id;
}

export function popisHodnoty(krok, hodnota) {
  if (!vyplneno(hodnota)) return "";
  switch (krok.typ) {
    case "ano-ne":
      return hodnota ? "ano" : "ne";
    case "volba":
      return popisMoznosti(krok, hodnota);
    case "vicevolba":
      return hodnota.map((id) => popisMoznosti(krok, id)).join(", ");
    default:
      return String(hodnota);
  }
}

export function shrnuti(definice, stav) {
  return viditelneKroky(definice, stav)
    .filter((krok) => vyplneno(stav[krok.id]))
    .map((krok) => ({
      id: krok.id,
      otazka: krok.otazka,
      hodnota: popisHodnoty(krok, stav[krok.id]),
    }));
}

export function doTextu(shrnuti) {
  return shrnuti.map((r) => `${r.otazka}: ${r.hodnota}`).join("\n");
}

export function vycisti(definice, stav) {
  const viditelne = new Set(viditelneKroky(definice, stav).map((k) => k.id));
  const vysledek = {};
  for (const [klic, hodnota] of Object.entries(stav)) {
    if (viditelne.has(klic)) vysledek[klic] = hodnota;
  }
  return vysledek;
}
