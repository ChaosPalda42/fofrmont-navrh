/** Technická grafika webu: izometrické výkresy, kóty, značky.
 *  Geometrii počítá src/lib/izometrie.mjs (kontrakt C-008), tady se z ní skládá SVG. */
import * as iso from "../lib/izometrie.mjs";
import { vykresli as vykresliScenu, viewBoxRozsahu } from "../lib/scena.mjs";
import { esc, delkaCesty } from "./lib.mjs";

const M = 15; // měřítko: pixelů na jednotku (1 jednotka ≈ 1 m)
let poradiSvg = 0;

const p = (x, y, z) => iso.projekce({ x, y, z }, M);
const bod = (b) => `${b.x} ${b.y}`;
const cara = (body) => body.map((b, i) => `${i ? "L" : "M"} ${bod(b)}`).join(" ");

/** Podlahová mřížka v izometrii. */
function mrizka(sirka, hloubka, krok = 1) {
  const cesty = [];
  for (let x = 0; x <= sirka; x += krok) cesty.push(cara([p(x, 0, 0), p(x, 0, hloubka)]));
  for (let z = 0; z <= hloubka; z += krok) cesty.push(cara([p(0, 0, z), p(sirka, 0, z)]));
  return `<path class="vykres-cara--tenka" style="stroke:var(--cara);fill:none;stroke-width:.6;opacity:.3" d="${cesty.join(" ")}"/>`;
}

/** Kvádr se třemi viditelnými stěnami a obrysem. */
function kvadr(pozice, rozmer, opts = {}) {
  const k = iso.kvadr(pozice, rozmer);
  const v = k.vrcholy.map((b) => iso.projekce(b, M));
  const sten = (idx, trida) => `<polygon class="${trida}" points="${idx.map((i) => `${v[i].x},${v[i].y}`).join(" ")}"/>`;
  const hrany = k.hrany.map(([a, b]) => cara([v[a], v[b]])).join(" ");
  return [
    sten(k.steny.vrch, "vykres-vypln--2"),
    sten(k.steny.predni, "vykres-vypln"),
    sten(k.steny.bocni, "vykres-vypln"),
    `<path class="vykres-cara${opts.silna ? " vykres-cara--silna" : ""} kresli" style="--delka:${Math.ceil(hrany.length * 1.2)};--zpozdeni:${opts.zpozdeni || 0}ms" d="${hrany}"/>`,
  ].join("");
}

/** Trasa potrubí: lomená čára se spoji a značkou průřezu. */
function potrubi(start, segmenty, opts = {}) {
  const body3 = iso.trasa(start, segmenty);
  const body = body3.map((b) => iso.projekce(b, M));
  const d = cara(body);
  const spoje = body.slice(1, -1).map((b) =>
    `<circle class="spoj" cx="${b.x}" cy="${b.y}" r="3.1" fill="var(--papir)" stroke="var(--cara)" stroke-width="1.2"/>`).join("");
  const tah = opts.signal ? "vykres-cara vykres-cara--signal vykres-cara--silna" : "vykres-cara vykres-cara--silna";
  return {
    body,
    svg: `<path class="${tah} kresli" style="--delka:${delkaCesty(body)};--zpozdeni:${opts.zpozdeni || 0}ms"
       d="${d}"${opts.id ? ` id="${esc(opts.id)}"` : ""} data-trasa="${esc(JSON.stringify(body))}"/>${spoje}`,
  };
}

/** Kóta mezi dvěma promítnutými body. */
function kota(a, b, popis, odsazeni = 16) {
  const k = iso.kota(a, b, odsazeni);
  const smer = { x: (b.x - a.x) / (k.delka || 1), y: (b.y - a.y) / (k.delka || 1) };
  const kolmo = { x: smer.y * 4, y: -smer.x * 4 };
  const patka = (bodA, bodB) =>
    `<path class="vykres-kota" d="M ${bodA.x} ${bodA.y} L ${bodB.x} ${bodB.y}"/>`;
  return `
    ${patka(a, { x: k.start.x + kolmo.x, y: k.start.y + kolmo.y })}
    ${patka(b, { x: k.konec.x + kolmo.x, y: k.konec.y + kolmo.y })}
    <path class="vykres-kota" d="${cara([k.start, k.konec])}" marker-start="url(#sipka-kota)" marker-end="url(#sipka-kota)"/>
    <text class="vykres-popis" x="${k.text.x}" y="${k.text.y}" text-anchor="middle">${esc(popis)}</text>`;
}

/** Odkazová čára s popiskem (výnoska). Vrací i krajní bod, aby se vešel do viewBoxu. */
function vynoska(z, dx, dy, popis, opts = {}) {
  const konec = { x: z.x + dx, y: z.y + dy };
  const konecCary = { x: konec.x + (dx > 0 ? 30 : -30), y: konec.y };
  const sirkaTextu = Math.max(40, popis.length * 5.4);
  const kraj = { x: konecCary.x + (dx > 0 ? sirkaTextu : -sirkaTextu), y: konecCary.y };
  return {
    kraj,
    svg: `
    <path class="vykres-kota" d="${cara([z, konec, konecCary])}"/>
    <circle cx="${z.x}" cy="${z.y}" r="2" fill="var(--signal)"/>
    <text class="vykres-popis${opts.signal ? " vykres-popis--signal" : ""}" x="${konecCary.x + (dx > 0 ? 5 : -5)}" y="${konecCary.y + 3}"
      text-anchor="${dx > 0 ? "start" : "end"}">${esc(popis)}</text>`,
  };
}

function obalka(vnitrek, body, okraj = 62) {
  poradiSvg += 1;
  const znacka = `sipka-kota-${poradiSvg}`;
  return `<svg viewBox="${iso.viewBox(body, okraj)}" role="img" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="${znacka}" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto">
        <path d="M1 1 7 4 1 7" fill="none" stroke="var(--sedy-2)" stroke-width="1"/>
      </marker>
    </defs>
    ${vnitrek.replace(/url\(#sipka-kota\)/g, `url(#${znacka})`)}</svg>`;
}

/** Scéna hero výkresu — data, ne kresba. Stejný popis používá prohlížeč,
 *  když se výkres otáčí tažením myši. */
export function scenaB2b(popisky) {
  return {
    meritko: M, stred: { x: 5.2, z: 3 }, okraj: 18, tok: "tok-b2b",
    mrizka: { sirka: 10.5, hloubka: 6, krok: 1.5 },
    kvadry: [
      { pozice: { x: 0.5, y: 0, z: 0.8 }, rozmer: { d: 3.6, s: 2.8, v: 2.4 }, silna: true, zpozdeni: 120 },
      { pozice: { x: 0.9, y: 0, z: 4.6 }, rozmer: { d: 1, s: 0.9, v: 1.8 }, zpozdeni: 420 },
    ],
    zavesy: [5.4, 9, 10.2].map((x) => ({ x, y1: 3.2, y2: 4.8, z: 2.2 })),
    trasy: [
      { id: "trasa-b2b", start: { x: 4.1, y: 1.8, z: 2.2 }, zpozdeni: 300, segmenty: [
        { osa: "x", delka: 3.4 }, { osa: "y", delka: 1.4 }, { osa: "x", delka: 3 }, { osa: "z", delka: 3.4 }] },
      { start: { x: 7.5, y: 3.2, z: 2.2 }, zpozdeni: 900, signal: true, segmenty: [
        { osa: "z", delka: 2.8 }, { osa: "y", delka: -1.1 }] },
    ],
    kotace: [
      { a: { x: 0.5, y: 0, z: 0.8 }, b: { x: 4.1, y: 0, z: 0.8 }, popis: popisky.kota1, odsazeni: 20 },
      { a: { x: 10.5, y: 0, z: 6 }, b: { x: 10.5, y: 3.2, z: 6 }, popis: popisky.kota2, odsazeni: 18 },
    ],
    vynosky: [
      { kotva: { x: 2.3, y: 2.4, z: 2.2 }, dx: 34, dy: -48, popis: popisky.jednotka, signal: true },
      { kotva: { x: 7.5, y: 4.8, z: 5 }, dx: 40, dy: 30, popis: popisky.odbocka },
    ],
  };
}

export function scenaB2c(popisky) {
  return {
    meritko: M, stred: { x: 5.2, z: 3 }, okraj: 18, tok: "tok-b2c",
    mrizka: { sirka: 10.5, hloubka: 6, krok: 1.5 },
    kvadry: [
      { pozice: { x: 3, y: 0, z: 1 }, rozmer: { d: 6, s: 5, v: 3.6 }, silna: true, zpozdeni: 120 },
      { pozice: { x: 0.4, y: 0.3, z: 2.6 }, rozmer: { d: 1.5, s: 0.8, v: 1.3 }, zpozdeni: 560 },
      { pozice: { x: 5, y: 0, z: 4.1 }, rozmer: { d: 0.9, s: 0.9, v: 1.8 }, zpozdeni: 980 },
    ],
    polygony: [
      { body: [{ x: 3, y: 3.6, z: 1 }, { x: 6, y: 5.4, z: 1 }, { x: 6, y: 5.4, z: 6 }, { x: 3, y: 3.6, z: 6 }] },
    ],
    cary: [
      { zpozdeni: 360, body: [{ x: 3, y: 3.6, z: 1 }, { x: 6, y: 5.4, z: 1 }, { x: 9, y: 3.6, z: 1 }] },
      { zpozdeni: 420, body: [{ x: 3, y: 3.6, z: 6 }, { x: 6, y: 5.4, z: 6 }, { x: 9, y: 3.6, z: 6 }] },
      { zpozdeni: 480, body: [{ x: 6, y: 5.4, z: 1 }, { x: 6, y: 5.4, z: 6 }] },
    ],
    trasy: [
      { id: "trasa-b2c", start: { x: 1.9, y: 0.9, z: 3 }, zpozdeni: 760, signal: true, segmenty: [
        { osa: "x", delka: 1.1 }, { osa: "z", delka: 1.3 }, { osa: "x", delka: 2 }, { osa: "y", delka: 0.5 }] },
    ],
    kotace: [
      { a: { x: 0.4, y: 0, z: 2.6 }, b: { x: 3, y: 0, z: 2.6 }, popis: popisky.kota1, odsazeni: 18 },
      { a: { x: 10.5, y: 0, z: 6 }, b: { x: 10.5, y: 3.6, z: 6 }, popis: popisky.kota2, odsazeni: 18 },
    ],
    vynosky: [
      { kotva: { x: 1.1, y: 1.6, z: 3 }, dx: -30, dy: -44, popis: popisky.jednotka, signal: true },
      { kotva: { x: 5.45, y: 1.8, z: 4.55 }, dx: 46, dy: 24, popis: popisky.zasobnik },
    ],
  };
}

/** Hero výkres — vykreslí scénu a přibalí její popis pro otáčení v prohlížeči. */
function heroVykres(scena) {
  poradiSvg += 1;
  const znacka = `sipka-kota-${poradiSvg}`;
  const viewBox = viewBoxRozsahu(iso, scena);
  const { vnitrek } = vykresliScenu(iso, scena, { uhel: 0, znacka, viewBox });
  return `<svg viewBox="${viewBox}" role="img" xmlns="http://www.w3.org/2000/svg"
      data-scena="${esc(JSON.stringify(scena))}" data-znacka="${znacka}" data-viewbox="${viewBox}">
    <defs>
      <marker id="${znacka}" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto">
        <path d="M1 1 7 4 1 7" fill="none" stroke="var(--sedy-2)" stroke-width="1"/>
      </marker>
    </defs>
    ${vnitrek}</svg>`;
}

export function vykresB2b(popisky) { return heroVykres(scenaB2b(popisky)); }
export function vykresB2c(popisky) { return heroVykres(scenaB2c(popisky)); }

/** Malý izometrický motiv pro kartu stavby (osm variant podle typu). */
export function motivStavby(druh) {
  const scen = {
    saly: [[{ x: 0, y: 0, z: 0 }, { d: 5, s: 4, v: 1.6 }], [{ x: 1, y: 1.6, z: 1 }, { d: 3, s: 2, v: 1 }]],
    terminal: [[{ x: 0, y: 0, z: 0 }, { d: 7, s: 3, v: 0.5 }], [{ x: 1, y: 2.6, z: 0.6 }, { d: 5, s: 0.9, v: 0.9 }]],
    hala: [[{ x: 0, y: 0, z: 0 }, { d: 7, s: 5, v: 2.4 }], [{ x: 5.4, y: 0, z: 1 }, { d: 1.4, s: 1.4, v: 3.4 }]],
    vila: [[{ x: 0, y: 0, z: 0 }, { d: 3.6, s: 3.4, v: 2.6 }], [{ x: 4.2, y: 0, z: 1 }, { d: 1.4, s: 0.9, v: 1.2 }]],
    skola: [[{ x: 0, y: 0, z: 0 }, { d: 6.4, s: 3, v: 2.2 }], [{ x: 0.6, y: 2.2, z: 0.4 }, { d: 1.2, s: 1.2, v: 0.8 }]],
    administrativa: [[{ x: 0, y: 0, z: 0 }, { d: 4, s: 4, v: 4.6 }], [{ x: 0.6, y: 4.6, z: 0.6 }, { d: 2.4, s: 2.4, v: 0.7 }]],
    pamatka: [[{ x: 0, y: 0, z: 0 }, { d: 4.4, s: 3.4, v: 3.4 }], [{ x: 1.2, y: 3.4, z: 0.8 }, { d: 1.8, s: 1.8, v: 1.2 }]],
    serverovna: [[{ x: 0, y: 0, z: 0 }, { d: 5.4, s: 3.4, v: 0.4 }], [{ x: 0.8, y: 0.4, z: 0.8 }, { d: 1, s: 1.8, v: 2.4 }],
                 [{ x: 3, y: 0.4, z: 0.8 }, { d: 1, s: 1.8, v: 2.4 }]],
  };
  const kusy = scen[druh] || scen.hala;
  const svg = kusy.map(([poz, roz], i) => kvadr(poz, roz, { zpozdeni: i * 180, silna: i === 0 })).join("");
  const body = kusy.flatMap(([poz, roz]) =>
    iso.kvadr(poz, roz).vrcholy.map((b) => iso.projekce(b, M)));
  return `<svg viewBox="${iso.viewBox(body, 16)}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`;
}

/** Značka firmy: izometrické koleno v rámečku. */
export function logo(velikost = 34) {
  return `<svg class="znacka__mark" width="${velikost}" height="${velikost}" viewBox="0 0 32 32" aria-hidden="true">
    <rect x="1.2" y="1.2" width="29.6" height="29.6" rx="2" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".28"/>
    <path d="M7 24V13.5A3.5 3.5 0 0 1 10.5 10H25" fill="none" stroke="var(--cara)" stroke-width="2.6"
      stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12.5 17.5H21" fill="none" stroke="var(--cara)" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>
    <circle cx="25" cy="10" r="2.6" fill="var(--signal)"/>
    <path d="M4 7h2M4 25h2M26 25h2" stroke="currentColor" stroke-width="1.2" opacity=".35" stroke-linecap="round"/>
  </svg>`;
}

/** Hvězdičky hodnocení. */
export function hvezdy(hodnoceni, velikost = 15) {
  const plna = `<path d="m10 2.8 2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1L2.5 8.3l5.2-.8z" fill="currentColor"/>`;
  const prazdna = `<path d="m10 2.8 2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1L2.5 8.3l5.2-.8z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>`;
  const kusy = [];
  for (let i = 1; i <= 5; i += 1) {
    kusy.push(`<svg width="${velikost}" height="${velikost}" viewBox="0 0 20 20" aria-hidden="true">${i <= hodnoceni ? plna : prazdna}</svg>`);
  }
  return `<span class="hvezdy" data-hodnoceni="${hodnoceni}">${kusy.join("")}</span>`;
}
