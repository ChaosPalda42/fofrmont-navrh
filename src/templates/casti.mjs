/** Opakující se stavební kameny stránek. */
import { esc, odstavce, cisloCs } from "./lib.mjs";
import { ikona, IKONY_OBORU } from "./ikony.mjs";
import { motivStavby, hvezdy } from "./kresby.mjs";

export function hlavicka(ctx, { stitek, nadpis, lead, akce = "", drobecky = "" }) {
  return `
  <section class="pas pas--tesny">
    <div class="obal">
      ${drobecky}
      ${stitek ? `<p class="stitek">${esc(stitek)}</p>` : ""}
      <h1>${esc(nadpis)}</h1>
      ${lead ? `<p class="lead">${esc(lead)}</p>` : ""}
      ${akce ? `<div class="tlacitka" style="margin-top:1.6rem">${akce}</div>` : ""}
    </div>
  </section>`;
}

export function drobecky(ctx, cesta) {
  const kusy = cesta.map(([id, popisek], i) =>
    (i === cesta.length - 1 ? `<span>${esc(popisek)}</span>`
      : `<a href="${ctx.odkaz(id)}">${esc(popisek)}</a><span aria-hidden="true">/</span>`));
  return `<nav class="drobecky" aria-label="Drobečková navigace">${kusy.join(" ")}</nav>`;
}

export function kartaOboru(ctx, obor, { odkazovat = true } = {}) {
  const { t, odkaz } = ctx;
  const vnitrek = `
    <span class="karta__cislo">${esc(obor.cislo)} — ${esc(obor.zkratka)}</span>
    <div style="color:var(--cara);margin-bottom:.7rem">${ikona(IKONY_OBORU[obor.id] || "vykres", { velikost: 26 })}</div>
    <h3 class="karta__nadpis">${esc(obor.nazev)}</h3>
    <p class="karta__text">${esc(obor.perex)}</p>
    ${odkazovat ? `<p class="karta__pata"><span class="sipka">${esc(t("spolecne.viceOOboru"))} ${ikona("sipka", { velikost: 15 })}</span></p>` : ""}`;
  return odkazovat
    ? `<a class="karta karta--odkaz rohy" href="${odkaz(`obor-${obor.slug}`)}">${vnitrek}</a>`
    : `<div class="karta rohy">${vnitrek}</div>`;
}

export function kartaStavby(ctx, stavba) {
  const { t, odkaz, site, datum } = ctx;
  const obory = stavba.obory.map((id) => site.obory.find((o) => o.id === id)).filter(Boolean);
  return `
  <a class="karta karta--odkaz rohy" href="${odkaz(`stavba-${stavba.id}`)}">
    <div class="karta__motiv" style="margin:-.4rem 0 .9rem;color:var(--cara)">${motivStavby(stavba.motiv)}</div>
    <span class="karta__cislo">${esc(stavba.misto)} · ${esc(String(stavba.rok))}</span>
    <h3 class="karta__nadpis">${esc(stavba.nazev)}</h3>
    <p class="karta__text">${esc(stavba.perex)}</p>
    <p class="karta__pata"><span class="znacky">${obory.map((o) => `<span>${esc(o.zkratka)}</span>`).join("")}</span></p>
  </a>`;
}

export function kartaRecenze(ctx, r, { odkazNaStavbu = true } = {}) {
  const { t, odkaz, site } = ctx;
  const stavba = odkazNaStavbu && r.stavba ? site.stavby.find((s) => s.id === r.stavba) : null;
  return `
  <article class="karta rohy recenze-karta" data-segment="${esc(r.segment)}" data-hodnoceni="${esc(String(r.hodnoceni))}" data-datum="${esc(r.datum)}">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:.8rem;margin-bottom:.9rem">
      ${hvezdy(r.hodnoceni)}
      <span class="mono male tise">${esc(ctx.datumText(r.datum))}</span>
    </div>
    <blockquote>„${esc(r.text)}“</blockquote>
    <div class="recenze-karta__autor karta__pata">
      <span><strong>${esc(r.jmeno)}</strong>${r.firma ? `<br><span class="male tise">${esc(r.firma)}</span>` : ""}</span>
      ${stavba ? `<a class="male mono" href="${odkaz(`stavba-${stavba.id}`)}">${esc(t("recenze.keStavbe"))} →</a>` : ""}
    </div>
  </article>`;
}

export function ctaPas(ctx, { nadpis, text, tlacitko, odkazCil = "poptavka", druhe = null }) {
  const { t, odkaz } = ctx;
  return `
  <section class="pas pas--vykres prijezd">
    <div class="obal" style="display:grid;gap:1.6rem;align-items:center">
      <div style="max-width:62ch">
        <p class="stitek stitek--bily">${esc(t("spolecne.cta"))}</p>
        <h2>${esc(nadpis)}</h2>
        <p class="lead">${esc(text)}</p>
      </div>
      <div class="tlacitka">
        <a class="tl tl--signal" href="${odkaz(odkazCil)}">${esc(tlacitko || t("spolecne.cta"))}</a>
        ${druhe ? `<a class="tl tl--obrys" href="${odkaz(druhe[0])}">${esc(druhe[1])}</a>` : ""}
        <a class="tl tl--obrys" href="${odkaz("kontakt")}">${esc(t("nav.kontakt"))}</a>
      </div>
      <p class="mono male" style="color:#7f9bbb;margin:0">${esc(t("spolecne.ctaPopis"))}</p>
    </div>
  </section>`;
}

export function udaje(ctx, cisla) {
  return `<div class="mrizka mrizka--4 prijezd--rada">${cisla.map((c) => `
    <div class="udaj">
      <span class="udaj__cislo" data-cil="${esc(String(c.hodnota))}" data-format="${esc(c.format || "")}" data-sufix="${esc(c.sufix || "")}">${c.format === "rok" ? esc(String(c.hodnota)) : cisloCs(c.hodnota)}${esc(c.sufix || "")}</span>
      <span class="udaj__popis">${esc(c.popis)}</span>
    </div>`).join("")}</div>`;
}

export function pole(id, popisek, { typ = "text", napoveda = "", povinne = false, hodnota = "", moznosti = null, radku = 0 } = {}) {
  const zakladni = `id="${esc(id)}" name="${esc(id)}"${povinne ? " required" : ""}`;
  let vstup;
  if (moznosti) {
    vstup = `<select ${zakladni}>${moznosti.map(([v, p]) => `<option value="${esc(v)}">${esc(p)}</option>`).join("")}</select>`;
  } else if (radku) {
    vstup = `<textarea ${zakladni} rows="${radku}">${esc(hodnota)}</textarea>`;
  } else {
    vstup = `<input type="${esc(typ)}" ${zakladni} value="${esc(hodnota)}">`;
  }
  return `
  <div class="pole" data-pole="${esc(id)}">
    <label for="${esc(id)}">${esc(popisek)}${povinne ? ' <span aria-hidden="true" style="color:var(--signal)">*</span>' : ""}</label>
    ${vstup}
    ${napoveda ? `<span class="napoveda">${esc(napoveda)}</span>` : ""}
    <span class="chyba" data-chyba hidden></span>
  </div>`;
}

export function souhlas(id, popisek) {
  return `
  <div class="pole pole--souhlas" data-pole="${esc(id)}">
    <input type="checkbox" id="${esc(id)}" name="${esc(id)}">
    <label for="${esc(id)}">${esc(popisek)}</label>
    <span class="chyba" data-chyba hidden style="grid-column:1/-1"></span>
  </div>`;
}

/** Běžící legenda — technické termíny jako pásek pod hlavičkou sekce. */
export function pasmo(polozky) {
  const rada = polozky.map((x) => `<span>${esc(x)}</span>`).join("");
  return `<div class="pasmo" aria-hidden="true"><div class="pasmo__pas">${rada}${rada}</div></div>`;
}

/** Dělicí trasa potrubí, která se při zobrazení sama nakreslí. */
export function deliciTrasa() {
  const d = "M 0 42 H 170 L 222 14 H 498 L 550 42 H 872 L 924 16 H 1200";
  const uzly = [[170, 42], [222, 14], [498, 14], [550, 42], [872, 42], [924, 16]];
  return `
  <div class="obal prijezd" aria-hidden="true">
    <svg class="delici-trasa" viewBox="0 0 1200 56" preserveAspectRatio="none">
      <path class="kresli" style="--delka:1400" d="${d}" vector-effect="non-scaling-stroke"/>
      ${uzly.map(([x, y], i) => `<rect class="${i % 3 === 0 ? "znak" : ""}" x="${x - 3}" y="${y - 3}" width="6" height="6"
        fill="${i % 3 === 0 ? "var(--signal)" : "var(--cara-2)"}" vector-effect="non-scaling-stroke"/>`).join("")}
    </svg>
  </div>`;
}
