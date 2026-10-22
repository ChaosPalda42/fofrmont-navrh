/**
 * Značka FOFRMONT — skutečné logo klienta.
 *
 * Zdroj je tiskové PDF (podklady/logo/FOFRMONT_CZ_logo_tisk.pdf), vektorovou sadu
 * z něj vytáhla session „Loga a animované titulky". Tvary se nesmí měnit — kdyby
 * bylo potřeba jiné ořezání nebo jiná varianta, patří to zpátky k ní.
 *
 * Soubory se čtou při sestavení, do stránky jdou vložené (inline), aby se daly
 * obarvit přes currentColor a rozhýbat přes CSS.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const KOREN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const nacti = (jmeno) => readFileSync(path.join(KOREN, "podklady/logo", jmeno), "utf8");

/** Kořenový <svg> i s komentářem nad ním; vrátíme jen tu značku a obsah. */
function rozeber(zdroj) {
  const zacatek = zdroj.indexOf("<svg");
  const konecHlavicky = zdroj.indexOf(">", zacatek);
  const hlavicka = zdroj.slice(zacatek, konecHlavicky + 1);
  const telo = zdroj.slice(konecHlavicky + 1, zdroj.lastIndexOf("</svg>"));
  const viewBox = (hlavicka.match(/viewBox="([^"]+)"/) || [])[1] || "0 0 1 1";
  const [, , sirka, vyska] = viewBox.split(/\s+/).map(Number);
  // xmlns u vloženého SVG v HTML nic nepřidá a jen zabírá místo
  const atributy = hlavicka
    .replace(/^<svg\s*/, "")
    .replace(/>$/, "")
    .replace(/\s*xmlns="[^"]*"/, "")
    .replace(/\s*viewBox="[^"]*"/, "")
    .trim();
  return { viewBox, sirka, vyska, atributy, telo };
}

const SOUBORY = {
  znak: rozeber(nacti("znak.svg")),
  znakMaly: rozeber(nacti("znak-maly.svg")),
  znakDily: rozeber(nacti("znak-dily.svg")),
  dumObrys: rozeber(nacti("dum-obrys.svg")),
  napis: rozeber(nacti("napis.svg")),
};

/** Poměr stran značky — ať se dá spočítat výška z šířky, znak není čtvercový. */
export const POMER = {
  znak: SOUBORY.znak.sirka / SOUBORY.znak.vyska,
  znakMaly: SOUBORY.znakMaly.sirka / SOUBORY.znakMaly.vyska,
  napis: SOUBORY.napis.sirka / SOUBORY.napis.vyska,
};

function vloz(klic, { trida = "", sirka = null, popis = null, prefix = null } = {}) {
  const s = SOUBORY[klic];
  let telo = s.telo;
  // Id jsou v souboru jen tam, kde se na ně animace odkazuje. Když by se stejné
  // SVG dostalo na stránku dvakrát, id by se zdvojila — proto vlastní předpona.
  if (prefix) telo = telo.replace(/id="([^"]+)"/g, (_, id) => `id="${prefix}${id}"`);
  const rozmer = sirka === null ? "" : ` width="${sirka}" height="${Math.round((sirka / s.sirka) * s.vyska)}"`;
  const pristupnost = popis
    ? ` role="img" aria-label="${popis}"`
    : ` aria-hidden="true" focusable="false"`;
  return `<svg${trida ? ` class="${trida}"` : ""} viewBox="${s.viewBox}"${rozmer} ${s.atributy}${pristupnost}>${telo}</svg>`;
}

/**
 * Značka do hlavičky a kamkoli do textu.
 *
 * Pod ~48 px se vlnky vzduchu slijí do šmouhy (pás vlnky vychází na 0,88 px při
 * 28 px šířky), proto má malá velikost vlastní zjednodušenou kresbu — bez vlnek,
 * bez držadla kohoutku a bez vývodu.
 *
 * `dily: true` vloží značku rozsekanou na pojmenované části, aby se daly
 * jednotlivé díly (třeba vlnky vzduchu) rozhýbat z CSS. Pak je potřeba vlastní
 * `prefix`, ať se id nesrazí s jinou kopií značky na téže stránce.
 */
export function znacka(sirka = 34, { popis = null, trida = "znacka__mark", dily = false, prefix = null } = {}) {
  if (dily) return vloz("znakDily", { trida, sirka, popis, prefix });
  const klic = sirka < 56 ? "znakMaly" : "znak";
  return vloz(klic, { trida, sirka, popis });
}

/** Nápis FOFRMONT jako cesty (font originálu se nepodařilo určit). */
export function napisLoga({ trida = "", sirka = null, popis = null } = {}) {
  return vloz("napis", { trida, sirka, popis });
}

/** Značka rozsekaná na pojmenované díly — pro úvodní animaci. */
export function znackaDily(trida = "") {
  return vloz("znakDily", { trida, prefix: "fm-" });
}

/** Dům jako otevřené čáry — kreslí se přes stroke-dasharray, pak se překryje výplní. */
export function dumObrys(trida = "") {
  return vloz("dumObrys", { trida, prefix: "fm-" });
}

/**
 * Favicon. Znak je na šířku (poměr 1,115), ikona musí být čtvercová, tak ho
 * vycentrujeme do čtverce — jen posun, kresba se nemění.
 */
export function favicona() {
  const s = SOUBORY.znakMaly;
  const strana = Math.max(s.sirka, s.vyska);
  const dx = (strana - s.sirka) / 2;
  const dy = (strana - s.vyska) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${strana} ${strana}" fill="#203c5a" fill-rule="nonzero">
<g transform="translate(${dx.toFixed(2)} ${dy.toFixed(2)})">${s.telo}</g>
</svg>`;
}
