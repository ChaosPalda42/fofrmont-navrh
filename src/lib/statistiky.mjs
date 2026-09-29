// C-013: Ukázková statistika návštěvnosti – řada dat, souhrny, křivka

const M32 = 2 ** 32;

export function nahodne(seed) {
  let stav = seed >>> 0;
  return function () {
    stav = (Math.imul(stav, 1664525) + 1013904223) % M32;
    if (stav < 0) stav += M32;
    return stav / M32;
  };
}

function datumUTC(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function isoUTC(d) {
  return d.toISOString().slice(0, 10);
}

export function generuj(seed, dnu, konec) {
  if (!Number.isFinite(dnu) || dnu <= 0) return [];
  const g = nahodne(seed);
  const konecD = datumUTC(konec);
  const rada = [];
  for (let i = 0; i < dnu; i += 1) {
    const den = new Date(konecD.getTime() - (dnu - 1 - i) * 86400000);
    const r1 = g();
    const r2 = g();
    const r3 = g();
    const r4 = g();
    const zaklad = 40 + Math.round(i * 0.35);
    const denTydne = den.getUTCDay();
    const vikend = denTydne === 0 || denTydne === 6 ? 0.55 : 1;
    const navstevy = Math.max(1, Math.round(zaklad * vikend * (0.75 + r1 * 0.5)));
    const uzivatele = Math.max(1, Math.round(navstevy * (0.72 + r2 * 0.1)));
    const zobrazeni = Math.round(navstevy * (1.9 + r3 * 0.8));
    const poptavky = r4 < 0.22 ? 1 : 0;
    rada.push({
      datum: isoUTC(den),
      navstevy,
      uzivatele,
      zobrazeni,
      poptavky,
    });
  }
  return rada;
}

export function vyrez(rada, dnu) {
  if (!Number.isFinite(dnu) || dnu <= 0) return [];
  return rada.slice(-dnu);
}

export function predchozi(rada, dnu) {
  if (!Number.isFinite(dnu) || dnu <= 0) return [];
  const konec = rada.length - dnu;
  if (konec <= 0) return [];
  return rada.slice(Math.max(0, konec - dnu), konec);
}

export function souhrn(rada) {
  let navstevy = 0;
  let uzivatele = 0;
  let zobrazeni = 0;
  let poptavky = 0;
  let maximum = 0;
  for (const d of rada) {
    navstevy += d.navstevy;
    uzivatele += d.uzivatele;
    zobrazeni += d.zobrazeni;
    poptavky += d.poptavky;
    if (d.navstevy > maximum) maximum = d.navstevy;
  }
  return { navstevy, uzivatele, zobrazeni, poptavky, maximum, dnu: rada.length };
}

export function zmena(ted, drive) {
  if (drive === 0) return 0;
  return Math.round(((ted - drive) / drive) * 100);
}

export function porovnani(rada, dnu) {
  const vy = vyrez(rada, dnu);
  const pred = predchozi(rada, dnu);
  const s = (pole, klic) => pole.reduce((t, d) => t + d[klic], 0);
  const vysledek = {};
  for (const klic of ["navstevy", "uzivatele", "zobrazeni", "poptavky"]) {
    const hodnota = s(vy, klic);
    vysledek[klic] = { hodnota, zmena: zmena(hodnota, s(pred, klic)) };
  }
  return vysledek;
}

function zaok2(x) {
  return Math.round(x * 100) / 100;
}

export function krivka(rada, klic, sirka, vyska) {
  if (rada.length === 0) return { body: [], cesta: "", plocha: "", max: 1 };
  const n = rada.length;
  let max = 1;
  for (const d of rada) {
    if (d[klic] > max) max = d[klic];
  }
  const body = [];
  for (let i = 0; i < n; i += 1) {
    const x = n === 1 ? 0 : (i / (n - 1)) * sirka;
    const y = vyska - (rada[i][klic] / max) * vyska;
    body.push({ x: zaok2(x), y: zaok2(y) });
  }
  const cesta = body
    .map((b, i) => (i === 0 ? "M" : "L") + " " + b.x + " " + b.y)
    .join(" ");
  const plocha = cesta + " L " + sirka + " " + vyska + " L 0 " + vyska + " Z";
  return { body, cesta, plocha, max };
}

export function osa(rada, pocet) {
  const n = rada.length;
  if (n === 0) return [];
  if (!Number.isFinite(pocet) || pocet <= 1) {
    return [{ index: 0, datum: rada[0].datum }];
  }
  const vysledek = [];
  const videne = new Set();
  for (let i = 0; i < pocet; i += 1) {
    const index = Math.round((i * (n - 1)) / (pocet - 1));
    if (videne.has(index)) continue;
    videne.add(index);
    vysledek.push({ index, datum: rada[index].datum });
  }
  return vysledek;
}

export function podily(polozky) {
  const soucet = polozky.reduce((t, p) => t + p.hodnota, 0);
  return [...polozky]
    .map((p) => ({
      id: p.id,
      hodnota: p.hodnota,
      podil: soucet === 0 ? 0 : Math.round((p.hodnota / soucet) * 100),
    }))
    .sort(
      (a, b) => b.hodnota - a.hodnota || String(a.id).localeCompare(String(b.id), "cs")
    );
}

export function formatujTrvani(sekundy) {
  const s = Number(sekundy);
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const celkem = Math.floor(s);
  const minuty = Math.floor(celkem / 60);
  const zbytek = String(celkem % 60).padStart(2, "0");
  return minuty + ":" + zbytek;
}
