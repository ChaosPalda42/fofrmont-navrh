// C-008 — Izometrická projekce, trasy potrubí a kóty.
// Geometrie pro technické kresby. Vstupní 3D bod = { x, y, z }, chybějící osa = 0.
// Osa y míří v prostoru NAHORU, v SVG roste y dolů — projekce to obrací.

export const COS30 = Math.cos(Math.PI / 6);
export const SIN30 = 0.5;

const OSY = new Set(["x", "y", "z"]);

function r2(v) {
  return Math.round(v * 100) / 100;
}

function r1(v) {
  return Math.round(v * 10) / 10;
}

function bod3(bod) {
  return { x: bod?.x ?? 0, y: bod?.y ?? 0, z: bod?.z ?? 0 };
}

function bod2(bod) {
  return { x: bod?.x ?? 0, y: bod?.y ?? 0 };
}

export function projekce(bod, meritko = 1) {
  const b = bod3(bod);
  return {
    x: r2((b.x - b.z) * COS30 * meritko),
    y: r2(((b.x + b.z) * SIN30 - b.y) * meritko),
  };
}

export function projekceBodu(body, meritko = 1) {
  return (body ?? []).map((b) => projekce(b, meritko));
}

export function cesta(body2d) {
  if (!body2d || body2d.length === 0) return "";
  const casti = body2d.map((b, i) => {
    const p = bod2(b);
    return `${i === 0 ? "M" : "L"} ${String(p.x)} ${String(p.y)}`;
  });
  return casti.join(" ");
}

export function trasa(start, segmenty) {
  const vysledek = [bod3(start)];
  for (const seg of segmenty ?? []) {
    if (!OSY.has(seg.osa)) continue;
    const pred = vysledek[vysledek.length - 1];
    const dalsi = { ...pred, [seg.osa]: pred[seg.osa] + seg.delka };
    vysledek.push(dalsi);
  }
  return vysledek;
}

export function delkaTrasy(segmenty) {
  let soucet = 0;
  for (const seg of segmenty ?? []) {
    if (OSY.has(seg.osa)) soucet += Math.abs(seg.delka);
  }
  return soucet;
}

export function kvadr(pozice, rozmer) {
  const p = bod3(pozice);
  const d = rozmer.d ?? 0;
  const s = rozmer.s ?? 0;
  const v = rozmer.v ?? 0;
  const vrcholy = [
    { x: p.x, y: p.y, z: p.z },
    { x: p.x + d, y: p.y, z: p.z },
    { x: p.x + d, y: p.y, z: p.z + s },
    { x: p.x, y: p.y, z: p.z + s },
    { x: p.x, y: p.y + v, z: p.z },
    { x: p.x + d, y: p.y + v, z: p.z },
    { x: p.x + d, y: p.y + v, z: p.z + s },
    { x: p.x, y: p.y + v, z: p.z + s },
  ];
  const hrany = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  const steny = { vrch: [4, 5, 6, 7], predni: [0, 1, 5, 4], bocni: [1, 2, 6, 5] };
  return { vrcholy, hrany, steny };
}

export function ohraniceni(body2d) {
  if (!body2d || body2d.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, sirka: 0, vyska: 0 };
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const b of body2d) {
    const p = bod2(b);
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return {
    minX: r2(minX),
    minY: r2(minY),
    maxX: r2(maxX),
    maxY: r2(maxY),
    sirka: r2(maxX - minX),
    vyska: r2(maxY - minY),
  };
}

export function viewBox(body2d, okraj = 10) {
  if (!body2d || body2d.length === 0) return "0 0 0 0";
  const o = ohraniceni(body2d);
  const x = o.minX - okraj;
  const y = o.minY - okraj;
  const s = o.sirka + 2 * okraj;
  const v = o.vyska + 2 * okraj;
  return `${String(x)} ${String(y)} ${String(s)} ${String(v)}`;
}

export function delkaPolylinie(body2d) {
  let soucet = 0;
  for (let i = 1; i < (body2d ?? []).length; i++) {
    const a = bod2(body2d[i - 1]);
    const b = bod2(body2d[i]);
    soucet += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return r2(soucet);
}

export function bodNaPolylinii(body2d, podil) {
  const body = (body2d ?? []).map(bod2);
  if (body.length === 0) return { x: 0, y: 0 };
  if (podil <= 0) return { x: r2(body[0].x), y: r2(body[0].y) };
  if (podil >= 1) {
    const p = body[body.length - 1];
    return { x: r2(p.x), y: r2(p.y) };
  }
  const celkova = delkaPolylinie(body);
  if (celkova === 0) return { x: r2(body[0].x), y: r2(body[0].y) };
  let cil = podil * celkova;
  for (let i = 1; i < body.length; i++) {
    const a = body[i - 1];
    const b = body[i];
    const delka = Math.hypot(b.x - a.x, b.y - a.y);
    if (cil <= delka || i === body.length - 1) {
      const t = delka === 0 ? 0 : cil / delka;
      return { x: r2(a.x + (b.x - a.x) * t), y: r2(a.y + (b.y - a.y) * t) };
    }
    cil -= delka;
  }
  const p = body[body.length - 1];
  return { x: r2(p.x), y: r2(p.y) };
}

export function rozdel(body2d, krok) {
  const body = (body2d ?? []).map(bod2);
  if (body.length === 0) return [];
  if (krok <= 0) return body;
  const vysledek = [body[0]];
  let zbytek = krok;
  for (let i = 1; i < body.length; i++) {
    let a = body[i - 1];
    const b = body[i];
    let delka = Math.hypot(b.x - a.x, b.y - a.y);
    while (zbytek < delka) {
      const t = zbytek / delka;
      a = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      vysledek.push({ x: r2(a.x), y: r2(a.y) });
      delka -= zbytek;
      zbytek = krok;
    }
    zbytek -= delka;
  }
  const posledni = body[body.length - 1];
  vysledek.push({ x: r2(posledni.x), y: r2(posledni.y) });
  return vysledek;
}

export function kota(a, b, odsazeni = 12) {
  const A = bod2(a);
  const B = bod2(b);
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const vzdalenost = Math.hypot(dx, dy);
  let n = { x: 0, y: 0 };
  let uhel = 0;
  if (vzdalenost > 0) {
    const s = { x: dx / vzdalenost, y: dy / vzdalenost };
    n = { x: s.y, y: -s.x };
    uhel = (Math.atan2(dy, dx) * 180) / Math.PI;
  }
  return {
    start: { x: r2(A.x + n.x * odsazeni), y: r2(A.y + n.y * odsazeni) },
    konec: { x: r2(B.x + n.x * odsazeni), y: r2(B.y + n.y * odsazeni) },
    text: {
      x: r2((A.x + B.x) / 2 + n.x * (odsazeni + 6)),
      y: r2((A.y + B.y) / 2 + n.y * (odsazeni + 6)),
    },
    delka: r1(vzdalenost),
    uhel: r1(uhel),
  };
}
