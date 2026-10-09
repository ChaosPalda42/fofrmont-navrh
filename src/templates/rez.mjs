/** Řezy budovami pro úvodní stránku: rodinný dům a výrobní hala.
 *  Kreslí se jako technický řez — je vidět dovnitř, na rozvody a stroje. */
import { esc } from "./lib.mjs";

const cara = (body) => body.map((b, i) => `${i ? "L" : "M"} ${b[0]} ${b[1]}`).join(" ");
const trasa = (body) => JSON.stringify(body.map((b) => ({ x: b[0], y: b[1] })));

/** Obdélník s jemnou výplní a obrysem. */
function blok(x, y, s, v, { silny = false, vypln = "vykres-vypln", zpozdeni = 0 } = {}) {
  return `<rect class="${vypln}" x="${x}" y="${y}" width="${s}" height="${v}"/>
    <path class="vykres-cara${silny ? " vykres-cara--silna" : ""} kresli"
      style="--delka:${2 * (s + v) + 8};--zpozdeni:${zpozdeni}ms"
      d="M ${x} ${y} L ${x + s} ${y} L ${x + s} ${y + v} L ${x} ${y + v} Z"/>`;
}

/** Potrubí nebo rozvod — animuje se a dá se po něm poslat značka. */
function rozvod(body, { signal = false, zpozdeni = 0 } = {}) {
  let d = 0;
  for (let i = 1; i < body.length; i += 1) d += Math.hypot(body[i][0] - body[i - 1][0], body[i][1] - body[i - 1][1]);
  return `<path class="vykres-cara vykres-cara--silna${signal ? " vykres-cara--signal" : ""} kresli"
    style="--delka:${Math.ceil(d) + 6};--zpozdeni:${zpozdeni}ms"
    d="${cara(body)}" data-trasa='${esc(trasa(body))}'/>`;
}

/** Terén se šrafováním. */
function teren(y, odX, doX) {
  const ticky = [];
  for (let x = odX; x < doX; x += 11) ticky.push(`M ${x} ${y} L ${x - 6} ${y + 7}`);
  return `<path class="vykres-cara--silna" style="stroke:var(--cara);fill:none;stroke-width:1.8" d="M ${odX} ${y} L ${doX} ${y}"/>
    <path class="vykres-cara--tenka" style="stroke:var(--cara);fill:none;stroke-width:.9;opacity:.5" d="${ticky.join(" ")}"/>`;
}

/** Vodorovná nebo svislá kóta s popiskem. */
function kota(x1, y1, x2, y2, popis) {
  const svisla = x1 === x2;
  const stredX = svisla ? x1 : (x1 + x2) / 2;
  const stredY = svisla ? (y1 + y2) / 2 : y1;
  return `<path class="vykres-kota" d="M ${x1} ${y1} L ${x2} ${y2}" marker-start="url(#sipka-rez)" marker-end="url(#sipka-rez)"/>
    <text class="vykres-popis" x="${svisla ? stredX + 7 : stredX}" y="${svisla ? stredY : stredY - 5}"
      text-anchor="${svisla ? "start" : "middle"}">${esc(popis)}</text>`;
}

/** Odkazová čára s popiskem mimo kresbu. */
function vynoska(zX, zY, body, popis, { doprava = true, signal = false } = {}) {
  const konec = body[body.length - 1];
  return `<path class="vykres-kota" d="${cara([[zX, zY], ...body])}"/>
    <circle cx="${zX}" cy="${zY}" r="2.4" fill="var(--signal)"/>
    <text class="vykres-popis${signal ? " vykres-popis--signal" : ""}" x="${konec[0] + (doprava ? 5 : -5)}"
      y="${konec[1] + 3}" text-anchor="${doprava ? "start" : "end"}">${esc(popis)}</text>`;
}

let poradiRezu = 0;

function obalka(vnitrek) {
  poradiRezu += 1;
  const znacka = `sipka-rez-${poradiRezu}`;
  return `<svg viewBox="0 0 440 300" role="img" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="${znacka}" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto">
        <path d="M1 1 7 4 1 7" fill="none" stroke="var(--sedy-2)" stroke-width="1"/>
      </marker>
    </defs>
    ${vnitrek.replace(/url\(#sipka-rez\)/g, `url(#${znacka})`)}</svg>`;
}

/** Řez rodinným domem: tepelné čerpadlo, akumulace, podlahovka, radiátor. */
export function rezDum(popisky) {
  const podlahovka = [];
  for (let x = 216; x <= 320; x += 12) podlahovka.push(`<circle class="vykres-cara" cx="${x}" cy="250" r="2.6"/>`);

  return obalka([
    teren(256, 10, 430),
    // dům
    blok(150, 150, 180, 106, { silny: true, zpozdeni: 60 }),
    `<polygon class="vykres-vypln--2" points="138,152 240,86 342,152"/>
     <path class="vykres-cara vykres-cara--silna kresli" style="--delka:300;--zpozdeni:0ms"
       d="M 138 152 L 240 86 L 342 152"/>`,
    blok(290, 100, 16, 52, { zpozdeni: 220 }),
    `<path class="vykres-osa" d="M 150 202 L 330 202"/>`,
    // okna a dveře
    blok(168, 164, 30, 26, { zpozdeni: 320, vypln: "vykres-vypln--2" }),
    blok(168, 212, 30, 26, { zpozdeni: 360, vypln: "vykres-vypln--2" }),
    blok(300, 214, 24, 42, { zpozdeni: 400, vypln: "vykres-vypln--2" }),
    // venkovní jednotka tepelného čerpadla
    blok(58, 208, 60, 42, { silny: true, zpozdeni: 140 }),
    `<circle class="vykres-cara" cx="88" cy="229" r="13"/>
     <path class="vykres-cara--tenka" style="stroke:var(--cara);fill:none;stroke-width:1.2"
       d="M 88 229 L 88 217 M 88 229 L 98 235 M 88 229 L 78 235"/>
     <path class="vykres-cara" d="M 52 250 L 124 250 L 124 256 L 52 256 Z"/>`,
    // zásobník a rozvody
    blok(162, 208, 30, 42, { zpozdeni: 480 }),
    `<path class="vykres-osa" d="M 162 218 L 192 218"/>`,
    rozvod([[118, 226], [140, 226], [140, 232], [162, 232]], { zpozdeni: 620 }),
    rozvod([[177, 208], [177, 186], [252, 186], [252, 196]], { zpozdeni: 760 }),
    rozvod([[177, 250], [177, 254], [212, 254], [212, 250]], { zpozdeni: 900, signal: true }),
    podlahovka.join(""),
    // radiátor v patře
    blok(252, 170, 42, 26, { zpozdeni: 840 }),
    `<path class="vykres-cara--tenka" style="stroke:var(--cara);fill:none;stroke-width:1"
       d="M 260 172 L 260 194 M 268 172 L 268 194 M 276 172 L 276 194 M 284 172 L 284 194"/>`,
    // prostup zdí
    `<circle class="vykres-cara" cx="150" cy="232" r="4"/>`,
    // kóty a popisky
    kota(58, 276, 150, 276, popisky.kota1),
    kota(378, 88, 378, 256, popisky.kota2),
    vynoska(88, 208, [[88, 54], [128, 54]], popisky.jednotka, { signal: true }),
    vynoska(264, 252, [[264, 286], [300, 286]], popisky.zasobnik),
  ].join("\n"));
}

/** Řez výrobní halou: VZT jednotka na střeše, potrubí pod stropem, odbočky. */
export function rezHala(popisky) {
  const vyustky = [230, 286, 342].map((x, i) =>
    `${rozvod([[x, 124], [x, 152]], { zpozdeni: 900 + i * 120, signal: i === 1 })}
     <path class="vykres-cara" d="M ${x - 9} 152 L ${x + 9} 152 L ${x + 5} 160 L ${x - 5} 160 Z"/>`).join("");

  return obalka([
    teren(256, 10, 430),
    // hala s mírně sedlovou střechou
    blok(60, 96, 320, 160, { silny: true, zpozdeni: 60 }),
    `<polygon class="vykres-vypln--2" points="52,98 220,70 388,98"/>
     <path class="vykres-cara vykres-cara--silna kresli" style="--delka:400;--zpozdeni:0ms"
       d="M 52 98 L 220 70 L 388 98"/>`,
    // VZT jednotka na střeše
    blok(176, 36, 88, 36, { silny: true, zpozdeni: 260 }),
    `<path class="vykres-cara" d="M 192 36 L 192 24 L 200 24 L 200 36 M 240 36 L 240 24 L 248 24 L 248 36"/>
     <path class="vykres-osa" d="M 176 54 L 264 54"/>`,
    // vrata a okna
    blok(76, 190, 54, 66, { zpozdeni: 420, vypln: "vykres-vypln--2" }),
    `<path class="vykres-cara--tenka" style="stroke:var(--cara);fill:none;stroke-width:1"
       d="M 76 204 L 130 204 M 76 218 L 130 218 M 76 232 L 130 232 M 76 246 L 130 246"/>`,
    blok(300, 112, 60, 26, { zpozdeni: 460, vypln: "vykres-vypln--2" }),
    // hlavní potrubí pod stropem
    rozvod([[220, 72], [220, 124], [360, 124]], { zpozdeni: 620 }),
    rozvod([[220, 124], [150, 124]], { zpozdeni: 760 }),
    vyustky,
    // technologie v hale
    blok(150, 196, 62, 60, { zpozdeni: 540 }),
    `<path class="vykres-cara--tenka" style="stroke:var(--cara);fill:none;stroke-width:1.2"
       d="M 162 196 L 162 182 L 200 182 L 200 196"/>
     <circle class="vykres-cara" cx="181" cy="226" r="12"/>`,
    // kotelna vpravo dole
    blok(300, 206, 60, 50, { zpozdeni: 580 }),
    `<path class="vykres-osa" d="M 300 220 L 360 220"/>`,
    rozvod([[330, 206], [330, 176], [360, 176]], { zpozdeni: 1020 }),
    // kóty a popisky
    kota(60, 276, 220, 276, popisky.kota1),
    kota(406, 70, 406, 256, popisky.kota2),
    vynoska(220, 36, [[220, 14], [262, 14]], popisky.jednotka, { signal: true }),
    vynoska(286, 158, [[286, 286], [322, 286]], popisky.odbocka),
  ].join("\n"));
}
