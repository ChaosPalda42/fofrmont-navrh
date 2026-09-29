// C-007 — Orientační výpočty VZT a tepelných čerpadel.
// Všechny výsledky jsou orientační; jde o přesně danou aritmetiku.

export function zaokrouhli(hodnota, desetinna = 0) {
  if (typeof hodnota !== "number" || !Number.isFinite(hodnota)) return 0;
  const moc = 10 ** desetinna;
  return Math.round(hodnota * moc) / moc;
}

export function objem(delka, sirka, vyska) {
  const d = Number(delka) || 0;
  const s = Number(sirka) || 0;
  const v = Number(vyska) || 0;
  return zaokrouhli(d * s * v, 1);
}

export function prutokVymeny(objem, vymeny) {
  const o = Number(objem);
  const v = Number(vymeny);
  if (!Number.isFinite(o) || !Number.isFinite(v) || o < 0 || v < 0) return 0;
  return zaokrouhli(o * v, 0);
}

export function prutokOsoby(osob, davka) {
  const o = Number(osob) || 0;
  const d = Number(davka) || 0;
  return zaokrouhli(o * d, 0);
}

export function navrhPrutok(mistnost = {}) {
  const delka = Number(mistnost.delka) || 0;
  const sirka = Number(mistnost.sirka) || 0;
  const vyska = Number(mistnost.vyska) || 0;
  const vymeny = Number(mistnost.vymeny) || 0;
  const osoby = Number(mistnost.osoby) || 0;
  const davka = Number(mistnost.davka) || 0;
  const objemV = objem(delka, sirka, vyska);
  const podleVymen = prutokVymeny(objemV, vymeny);
  const podleOsob = prutokOsoby(osoby, davka);
  const navrh = Math.ceil(Math.max(podleVymen, podleOsob) / 10) * 10;
  return { objem: objemV, podleVymen, podleOsob, navrh };
}

export const RADA_KRUHOVA = [
  100, 125, 140, 160, 180, 200, 224, 250, 280, 315,
  355, 400, 450, 500, 560, 630, 710, 800, 900, 1000,
];

export function nejblizsiPrumer(prumer) {
  const p = Number(prumer);
  if (!Number.isFinite(p) || p <= 0) return RADA_KRUHOVA[0];
  for (const clen of RADA_KRUHOVA) {
    if (clen >= p) return clen;
  }
  return RADA_KRUHOVA[RADA_KRUHOVA.length - 1];
}

export function dimenzeKruhova(prutok, rychlost) {
  const p = Number(prutok);
  const r = Number(rychlost);
  if (!Number.isFinite(p) || !Number.isFinite(r) || p <= 0 || r <= 0) {
    return { plocha: 0, prumer: 0, prumerNorm: RADA_KRUHOVA[0], skutecnaRychlost: 0 };
  }
  const plochaP = p / 3600 / r;
  const plocha = zaokrouhli(plochaP, 4);
  const prumer = zaokrouhli(Math.sqrt((4 * plochaP) / Math.PI) * 1000, 1);
  const prumerNorm = nejblizsiPrumer(prumer);
  const skutecnaRychlost = zaokrouhli((p / 3600) / (Math.PI * (prumerNorm / 1000) ** 2 / 4), 2);
  return { plocha, prumer, prumerNorm, skutecnaRychlost };
}

export function dimenzeHranata(prutok, rychlost, vyska) {
  const p = Number(prutok);
  const r = Number(rychlost);
  const v = Number(vyska);
  if (!Number.isFinite(p) || !Number.isFinite(r) || !Number.isFinite(v) || p <= 0 || r <= 0 || v <= 0) {
    return { sirka: 100, vyska: v, skutecnaRychlost: 0 };
  }
  const plocha = p / 3600 / r;
  const sirka = Math.max(100, Math.ceil((plocha / (v / 1000) * 1000) / 50) * 50);
  const skutecnaRychlost = zaokrouhli((p / 3600) / ((sirka / 1000) * (v / 1000)), 2);
  return { sirka, vyska: v, skutecnaRychlost };
}

export function rychlost(prutok, prumer) {
  const p = Number(prutok);
  const d = Number(prumer);
  if (!Number.isFinite(p) || !Number.isFinite(d) || d === 0) return 0;
  return zaokrouhli((p / 3600) / (Math.PI * (d / 1000) ** 2 / 4), 2);
}

export function tepelnaZtrata(plocha, vyska, merna) {
  const p = Number(plocha) || 0;
  const v = Number(vyska) || 0;
  const m = Number(merna) || 0;
  let ztrata = (p * m) / 1000;
  if (v > 2.6) ztrata *= v / 2.6;
  return zaokrouhli(ztrata, 1);
}

export const RADA_TC = [3, 5, 6, 8, 9, 11, 12, 14, 16, 20, 24];

export function navrhTC(ztrata, moznosti = {}) {
  const bivalence = Number(moznosti.bivalence) || 0.85;
  const tuv = Number(moznosti.tuv) || 0;
  const z = Number(ztrata) || 0;
  const potreba = zaokrouhli(z * bivalence + tuv, 1);
  let vykon = RADA_TC[RADA_TC.length - 1];
  for (const clen of RADA_TC) {
    if (clen >= potreba) {
      vykon = clen;
      break;
    }
  }
  const jmenovatel = z + tuv;
  const pokryti = jmenovatel === 0 ? 0 : Math.round((vykon / jmenovatel) * 100);
  return { potreba, vykon, pokryti };
}

export function usporaRekuperace(prutok, hodin, dnu, ucinnost, deltaT, cena) {
  const p = Number(prutok) || 0;
  const h = Number(hodin) || 0;
  const d = Number(dnu) || 0;
  const u = Number(ucinnost) || 0;
  const dt = Number(deltaT) || 0;
  const c = Number(cena) || 0;
  const vykonP = (p * 1.2 * 1.01 * dt) / 3600;
  const vykon = zaokrouhli(vykonP, 2);
  const kwhRok = zaokrouhli(vykonP * u * h * d, 0);
  const korunRok = Math.round(kwhRok * c);
  return { vykon, kwhRok, korunRok };
}

export function formatujCislo(hodnota, desetinna = 0) {
  const z = zaokrouhli(hodnota, desetinna);
  const znamenko = z < 0 ? "-" : "";
  const abs = Math.abs(z);
  const [cel, dec] = abs.toFixed(desetinna).split(".");
  const sroupeno = cel.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return znamenko + sroupeno + (desetinna > 0 ? "," + dec : "");
}
