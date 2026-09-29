// C-005: Stavby – filtr, facety, řazení, stránkování, podobné stavby

const COMBINING = /[\u0300-\u036f]/g;

export function normalizuj(hodnota) {
  return String(hodnota)
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING, "");
}

export function filtruj(stavby, filtr = {}) {
  const { obor, segment, kraj, rok, dotaz } = filtr;
  const slova =
    dotaz && String(dotaz).trim() !== ""
      ? String(dotaz).trim().split(/\s+/).map(normalizuj).filter(Boolean)
      : [];
  return stavby.filter((s) => {
    if (obor !== undefined && obor !== "" && obor !== "vse") {
      if (!Array.isArray(s.obory) || !s.obory.includes(obor)) return false;
    }
    if (segment !== undefined && segment !== "" && segment !== "vse") {
      if (s.segment !== segment) return false;
    }
    if (kraj !== undefined && kraj !== "") {
      if (s.kraj !== kraj) return false;
    }
    if (rok !== undefined && rok !== "" && rok !== 0) {
      if (Number(s.rok) !== Number(rok)) return false;
    }
    if (slova.length > 0) {
      const text = normalizuj(
        (s.nazev ?? "") +
          " " +
          (s.misto ?? "") +
          " " +
          (s.kraj ?? "") +
          " " +
          (s.perex ?? "") +
          " " +
          (Array.isArray(s.obory) ? s.obory.join(" ") : "")
      );
      for (const slovo of slova) {
        if (!text.includes(slovo)) return false;
      }
    }
    return true;
  });
}

export function facety(stavby, klic) {
  const pocity = new Map();
  const pridat = (hodnota) => {
    if (hodnota === undefined || hodnota === null || hodnota === "") return;
    const id = String(hodnota);
    pocity.set(id, (pocity.get(id) ?? 0) + 1);
  };
  for (const s of stavby) {
    if (klic === "obory") {
      for (const obor of s.obory ?? []) pridat(obor);
    } else {
      pridat(s[klic]);
    }
  }
  const seznam = [...pocity.entries()].map(([id, pocet]) => ({ id, pocet }));
  seznam.sort(
    (a, b) => b.pocet - a.pocet || String(a.id).localeCompare(String(b.id), "cs")
  );
  return seznam;
}

export function roky(stavby) {
  const unikatni = new Set();
  for (const s of stavby) {
    if (s.rok !== undefined && s.rok !== null && s.rok !== "") {
      unikatni.add(Number(s.rok));
    }
  }
  return [...unikatni].sort((a, b) => b - a);
}

export function serad(stavby, mode) {
  const kopie = [...stavby];
  switch (mode) {
    case "nejstarsi":
      kopie.sort((a, b) =>
        String(a.datum ?? "").localeCompare(String(b.datum ?? ""))
      );
      break;
    case "nazev":
      kopie.sort((a, b) =>
        String(a.nazev ?? "").localeCompare(String(b.nazev ?? ""), "cs")
      );
      break;
    case "rozsah":
      kopie.sort((a, b) => cisloZRozsahu(b.rozsah) - cisloZRozsahu(a.rozsah));
      break;
    case "nejnovejsi":
    default:
      kopie.sort((a, b) =>
        String(b.datum ?? "").localeCompare(String(a.datum ?? ""))
      );
      break;
  }
  return kopie;
}

export function cisloZRozsahu(hodnota) {
  if (hodnota === undefined || hodnota === null) return 0;
  const text = String(hodnota).replace(/[\u00a0\u202f]/g, " ");
  const match = text.match(/(\d+(?:[ ]\d{3})*(?:[.,]\d+)?)/);
  if (!match) return 0;
  return Number(match[1].replace(/[ ]/g, "").replace(",", "."));
}

export function strankuj(stavby, stranka, naStranku) {
  const celkem = stavby.length;
  const stranek = Math.max(1, Math.ceil(celkem / naStranku));
  const aktualni = Math.min(Math.max(1, Math.floor(Number(stranka) || 1)), stranek);
  const od = (aktualni - 1) * naStranku;
  return {
    polozky: stavby.slice(od, od + naStranku),
    stranka: aktualni,
    stranek,
    celkem,
  };
}

export function podobne(stavby, id, pocet = 3) {
  const cil = stavby.find((s) => s.id === id);
  if (!cil) return [];
  const skore = (s) => {
    let b = 0;
    const cilObory = new Set(cil.obory ?? []);
    for (const obor of s.obory ?? []) {
      if (cilObory.has(obor)) b += 2;
    }
    if (s.segment === cil.segment) b += 1;
    if (s.kraj === cil.kraj) b += 1;
    return b;
  };
  return stavby
    .filter((s) => s.id !== id)
    .map((s) => ({ s, b: skore(s) }))
    .filter((x) => x.b > 0)
    .sort(
      (a, b) =>
        b.b - a.b ||
        String(b.s.datum ?? "").localeCompare(String(a.s.datum ?? ""))
    )
    .slice(0, pocet)
    .map((x) => x.s);
}

export function statistiky(stavby) {
  const obory = new Set();
  const kraje = new Set();
  let odRoku = 0;
  let doRoku = 0;
  let celkovyRozsah = 0;
  let maRok = false;
  for (const s of stavby) {
    for (const obor of s.obory ?? []) obory.add(obor);
    if (s.kraj !== undefined && s.kraj !== null && s.kraj !== "") {
      kraje.add(s.kraj);
    }
    if (s.rok !== undefined && s.rok !== null && s.rok !== "") {
      const rok = Number(s.rok);
      if (!maRok) {
        odRoku = rok;
        doRoku = rok;
        maRok = true;
      } else {
        odRoku = Math.min(odRoku, rok);
        doRoku = Math.max(doRoku, rok);
      }
    }
    celkovyRozsah += cisloZRozsahu(s.rozsah);
  }
  return {
    pocet: stavby.length,
    obory: obory.size,
    kraje: kraje.size,
    odRoku,
    doRoku,
    celkovyRozsah: Math.round(celkovyRozsah),
  };
}
