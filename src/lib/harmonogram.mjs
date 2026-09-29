// C-010 — Harmonogram montáže: pracovní dny, fáze, pruhový diagram.
// Plánování v pracovních dnech (Po–Pá); data "YYYY-MM-DD", výpočty v UTC.

const MS_DNE = 24 * 60 * 60 * 1000;

function parseIso(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function formatIso(ms) {
  const dt = new Date(ms);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function jeVikend(iso) {
  const den = new Date(parseIso(iso)).getUTCDay();
  return den === 0 || den === 6;
}

export function posunDny(iso, dnu) {
  return formatIso(parseIso(iso) + Number(dnu) * MS_DNE);
}

export function prvniPracovni(iso) {
  let den = iso;
  while (jeVikend(den)) den = posunDny(den, 1);
  return den;
}

export function posunPracovni(iso, dnu) {
  const n = Number(dnu);
  let den = prvniPracovni(iso);
  if (n === 0) return den;
  const krok = n > 0 ? 1 : -1;
  let zbylo = Math.abs(n);
  while (zbylo > 0) {
    den = posunDny(den, krok);
    if (!jeVikend(den)) zbylo -= 1;
  }
  return den;
}

export function pracovnichDnu(od, do_) {
  if (parseIso(do_) < parseIso(od)) return 0;
  let pocet = 0;
  let den = od;
  while (parseIso(den) <= parseIso(do_)) {
    if (!jeVikend(den)) pocet += 1;
    den = posunDny(den, 1);
  }
  return pocet;
}

export function naplanuj(faze, start) {
  const vysledek = [];
  const konec = new Map();
  for (const f of faze) {
    const zavislosti = (f.zavisi || []).filter((id) => konec.has(id));
    let zacatek;
    if (zavislosti.length === 0) {
      zacatek = prvniPracovni(start);
    } else {
      const nejpozdeji = zavislosti.reduce((a, b) =>
        parseIso(konec.get(a)) >= parseIso(konec.get(b)) ? a : b
      );
      zacatek = posunPracovni(konec.get(nejpozdeji), 1);
    }
    const dny = Math.max(1, Number(f.dny) || 1);
    const konecFaze = posunPracovni(zacatek, dny - 1);
    vysledek.push({ id: f.id, nazev: f.nazev, start: zacatek, konec: konecFaze, dny });
    konec.set(f.id, konecFaze);
  }
  return vysledek;
}

export function trvani(plan) {
  if (!plan || plan.length === 0) {
    return { start: "", konec: "", pracovnichDnu: 0, kalendarnichDnu: 0 };
  }
  const start = plan.reduce((a, b) => (parseIso(a.start) <= parseIso(b.start) ? a : b)).start;
  const konec = plan.reduce((a, b) => (parseIso(a.konec) >= parseIso(b.konec) ? a : b)).konec;
  const kalendarnichDnu = Math.round((parseIso(konec) - parseIso(start)) / MS_DNE) + 1;
  return {
    start,
    konec,
    pracovnichDnu: pracovnichDnu(start, konec),
    kalendarnichDnu,
  };
}

export function pozice(plan) {
  if (!plan || plan.length === 0) return [];
  const { start, kalendarnichDnu } = trvani(plan);
  const celkem = kalendarnichDnu;
  return plan.map((f) => {
    const levo = Math.round(((parseIso(f.start) - parseIso(start)) / MS_DNE / celkem) * 10000) / 100;
    const delka = Math.round((parseIso(f.konec) - parseIso(f.start)) / MS_DNE) + 1;
    const sirka = Math.round((delka / celkem) * 10000) / 100;
    return { id: f.id, levo, sirka };
  });
}

export function kritickaCesta(faze) {
  if (!faze || faze.length === 0) return [];
  const index = new Map(faze.map((f, i) => [f.id, i]));
  const dny = faze.map((f) => Math.max(1, Number(f.dny) || 1));
  const delka = new Array(faze.length).fill(0);
  const predchudce = new Array(faze.length).fill(-1);
  for (let i = 0; i < faze.length; i++) {
    let nej = 0;
    let pred = -1;
    for (const id of faze[i].zavisi || []) {
      const j = index.get(id);
      if (j === undefined) continue;
      if (delka[j] > nej) {
        nej = delka[j];
        pred = j;
      }
    }
    delka[i] = dny[i] + nej;
    predchudce[i] = pred;
  }
  let konec = 0;
  for (let i = 1; i < faze.length; i++) {
    if (delka[i] > delka[konec]) konec = i;
  }
  const cesta = [];
  for (let i = konec; i !== -1; i = predchudce[i]) cesta.push(faze[i].id);
  return cesta.reverse();
}
