// C-006: Náročnost prostoru – bodování podle faktorů

const zaokrouhli1 = (x) => Math.round(x * 10) / 10;

export function najdiMoznost(faktor, volby) {
  const id = volby?.[faktor.id];
  if (id === undefined || id === null) return null;
  return (faktor.moznosti ?? []).find((m) => m.id === id) ?? null;
}

export function skore(faktory, volby) {
  let body = 0;
  let max = 0;
  for (const faktor of faktory) {
    const vaha = Number(faktor.vaha) || 0;
    const moznost = najdiMoznost(faktor, volby);
    if (moznost) body += vaha * Number(moznost.body);
    const nejvyssi = (faktor.moznosti ?? []).reduce(
      (m, o) => Math.max(m, Number(o.body)),
      0
    );
    max += vaha * nejvyssi;
  }
  body = zaokrouhli1(body);
  max = zaokrouhli1(max);
  const procent = max === 0 ? 0 : Math.round((body / max) * 100);
  let stupen;
  if (procent < 25) stupen = "bezna";
  else if (procent < 50) stupen = "narocna";
  else if (procent < 75) stupen = "slozita";
  else stupen = "extremni";
  return { body, max, procent, stupen };
}

export function chybejici(faktory, volby) {
  return faktory
    .filter((faktor) => najdiMoznost(faktor, volby) === null)
    .map((faktor) => faktor.id);
}

export function prispevky(faktory, volby) {
  const seznam = faktory.map((faktor, index) => {
    const moznost = najdiMoznost(faktor, volby);
    const body = moznost
      ? zaokrouhli1((Number(faktor.vaha) || 0) * Number(moznost.body))
      : 0;
    return { id: faktor.id, nazev: faktor.nazev, body, index };
  });
  const celkem = seznam.reduce((s, x) => s + x.body, 0);
  seznam.sort((a, b) => b.body - a.body || a.index - b.index);
  return seznam.map(({ id, nazev, body }) => ({
    id,
    nazev,
    body,
    podil: celkem === 0 ? 0 : Math.round((body / celkem) * 100),
  }));
}

export function doporuceni(faktory, volby, katalog) {
  const vysledek = [];
  const videne = new Set();
  for (const p of prispevky(faktory, volby)) {
    const faktor = faktory.find((f) => f.id === p.id);
    const moznost = najdiMoznost(faktor, volby);
    if (!moznost) continue;
    const text = katalog?.[faktor.id]?.[moznost.id];
    if (typeof text !== "string" || text === "") continue;
    if (videne.has(text)) continue;
    videne.add(text);
    vysledek.push(text);
  }
  return vysledek;
}

export function porovnej(faktory, a, b) {
  const rozdil = skore(faktory, a).procent - skore(faktory, b).procent;
  const narocnejsi = rozdil > 0 ? "a" : rozdil < 0 ? "b" : "shoda";
  return { rozdil, narocnejsi };
}

export function popisStupne(stupen, katalog) {
  return katalog?.[stupen] ?? stupen;
}
