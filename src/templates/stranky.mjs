/** Stránky: úvod, přehled profesí, detail profese, náročné prostory, postup, B2B, B2C. */
import { esc, odstavce, cisloCs } from "./lib.mjs";
import { ikona, IKONY_OBORU } from "./ikony.mjs";
import { motivStavby, hvezdy } from "./kresby.mjs";
import { rezDum, rezHala } from "./rez.mjs";
import { hlavicka, drobecky, kartaOboru, kartaStavby, kartaRecenze, ctaPas, udaje, pasmo, deliciTrasa } from "./casti.mjs";
import * as recenzeLib from "../lib/recenze.mjs";

export function uvod(ctx) {
  const { t, odkaz, site } = ctx;
  const viditelne = recenzeLib.viditelne(site.recenze);
  const souhrn = recenzeLib.souhrn(viditelne);
  const posledni = recenzeLib.serad(viditelne, "nejnovejsi").slice(0, 3);
  const stavby = [...site.stavby].sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, 3);

  // Hlavička: nadpis, představení a rovnou obory — vše na první obrazovce.
  const scena = `
    <div class="hero__scena" data-scena-hero aria-hidden="true" data-varianta="b2b"
      data-hlasky='${esc(JSON.stringify({ b2b: t("uvod.scenaB2bPopis"), b2c: t("uvod.scenaB2cPopis"), oprava: t("uvod.scenaOprava") }))}'>
      <div data-varianta-obsah="b2b">${rezHala({
        kota1: t("uvod.vykresKota1"), kota2: t("uvod.vykresKota2"),
        jednotka: t("uvod.vykresJednotka"), odbocka: t("uvod.vykresOdbocka"),
      })}</div>
      <div data-varianta-obsah="b2c" hidden>${rezDum({
        kota1: t("uvod.vykresKota1c"), kota2: t("uvod.vykresKota2c"),
        jednotka: t("uvod.vykresTc"), zasobnik: t("uvod.vykresZasobnik"),
      })}</div>
      <p class="hero__scena-popis mono male tise" data-scena-popis></p>
    </div>`;

  const hero = `
  <section class="hero hero--obory">
    <div class="obal">
      <div class="hero__vrch">
      <div class="hero__text">
      <p class="stitek">${esc(t("uvod.stitek"))}</p>
      <h1>${esc(t("uvod.nadpis"))}</h1>
      <span class="podtrzeni" aria-hidden="true"></span>
      <p class="lead hero__lead">${esc(t("uvod.lead"))}</p>
      <div class="tlacitka hero__tlacitka">
        <a class="tl tl--signal" href="${odkaz("poptavka")}">${esc(t("uvod.ctaHlavni"))} ${ikona("sipka", { velikost: 16 })}</a>
        <a class="tl tl--obrys" href="${odkaz("stavby")}">${esc(t("uvod.ctaVedlejsi"))}</a>
      </div>
      </div>
      ${scena}
      </div>
      <div class="volba-segmentu" data-prepinac="obory">
        <div class="volba-segmentu__popis">
          <span class="volba-segmentu__otazka">${esc(t("uvod.prepinacPopis"))}</span>
          <span class="male tise">${esc(t("uvod.prepinacNapoveda"))}</span>
        </div>
        <div class="prepinac prepinac--velky" role="group" data-vyzva="1">
          <button type="button" data-varianta="b2b" aria-pressed="true">
            ${ikona("budova", { velikost: 19 })}
            <span class="jen-siroke">${esc(t("spolecne.segmentB2b"))}</span><span class="jen-uzke">${esc(t("spolecne.segmentB2bKratce"))}</span>
          </button>
          <button type="button" data-varianta="b2c" aria-pressed="false">
            ${ikona("dum", { velikost: 19 })}
            <span class="jen-siroke">${esc(t("spolecne.segmentB2c"))}</span><span class="jen-uzke">${esc(t("spolecne.segmentB2cKratce"))}</span>
          </button>
        </div>
      </div>
      <div class="mrizka mrizka--obory" data-obory>
        ${site.obory.map((o) => kartaOboru(ctx, o, { maly: true })).join("")}
      </div>
      <p class="male tise hero__poznamka">${esc(t("uvod.realstaffPoznamka"))}</p>
    </div>
  </section>`;

  const legenda = pasmo([
    "Vzduchotechnika", "Vytápění a ÚT", "Zdravotechnika", "Chlazení", "Tepelná čerpadla",
    "Realizace staveb", "Dodávka na klíč", "Pronájem techniky", "Správa nemovitostí",
    "Montáž za provozu", "Nemocnice", "Výrobní haly", "Rodinné domy",
  ]);

  const cisla = `
  <section class="pas pas--tesny pas--linka">
    <div class="obal prijezd">${udaje(ctx, site.cisla)}</div>
  </section>`;

  const sekceStavby = `
  <section class="pas">
    <div class="obal">
      <div class="hlavicka-sekce hlavicka-sekce--mezi prijezd">
        <div>
          <p class="stitek">01 — ${esc(t("nav.stavby"))}</p>
          <h2>${esc(t("uvod.stavbyNadpis"))}</h2>
          <p class="lead">${esc(t("uvod.stavbyLead"))}</p>
        </div>
        <a class="sipka" href="${odkaz("stavby")}">${esc(t("spolecne.vsechnyStavby"))} ${ikona("sipka", { velikost: 15 })}</a>
      </div>
      <div class="mrizka mrizka--3 prijezd--rada">${stavby.map((s) => kartaStavby(ctx, s)).join("")}</div>
    </div>
  </section>`;

  const pravidla = t("jakPracujeme.pravidla");
  const postup = `
  <section class="pas pas--vykres">
    <div class="obal mrizka mrizka--bok">
      <div class="prijezd">
        <p class="stitek stitek--bily">02 — ${esc(t("jakPracujeme.stitek"))}</p>
        <h2>${esc(t("uvod.postupNadpis"))}</h2>
        <p class="lead">${esc(t("uvod.postupLead"))}</p>
        <a class="sipka" href="${odkaz("jakPracujeme")}">${esc(t("nav.jakPracujeme"))} ${ikona("sipka", { velikost: 15 })}</a>
      </div>
      <div class="mrizka mrizka--2 prijezd--rada">
        ${(Array.isArray(pravidla) ? pravidla : []).map((p, i) => `
          <div class="karta rohy">
            <span class="karta__cislo">0${i + 1}</span>
            <h3 class="karta__nadpis">${esc(p.nadpis)}</h3>
            <p class="karta__text">${esc(p.text)}</p>
          </div>`).join("")}
      </div>
    </div>
  </section>`;

  const sekceRecenze = `
  <section class="pas">
    <div class="obal">
      <div class="hlavicka-sekce hlavicka-sekce--mezi prijezd">
        <div>
          <p class="stitek">03 — ${esc(t("nav.recenze"))}</p>
          <h2>${esc(t("uvod.recenzeNadpis"))}</h2>
          <p class="lead">${esc(t("uvod.recenzeLead"))}</p>
        </div>
        <div style="text-align:right">
          <div class="udaj__cislo" style="font-size:2.4rem">${cisloCs(souhrn.prumer, 1)}</div>
          ${hvezdy(Math.round(souhrn.prumer))}
          <p class="male tise" style="margin:.3rem 0 0">${esc(t("recenze.zPoctu").replace("{pocet}", String(souhrn.pocet)))}</p>
        </div>
      </div>
      <div class="mrizka mrizka--3 prijezd--rada">${posledni.map((r) => kartaRecenze(ctx, r)).join("")}</div>
      <p style="margin-top:1.6rem"><a class="sipka" href="${odkaz("recenze")}">${esc(t("spolecne.vsechnyRecenze"))} ${ikona("sipka", { velikost: 15 })}</a></p>
    </div>
  </section>`;

  return [hero, legenda, cisla, sekceStavby, `<div class="pas pas--tesny">${deliciTrasa()}</div>`,
    postup, sekceRecenze,
    ctaPas(ctx, { nadpis: t("uvod.ctaPatka"), text: t("uvod.ctaPatkaText"), druhe: ["stavby", t("spolecne.vsechnyStavby")] })].join("\n");
}

export function montaze(ctx) {
  const { t, site } = ctx;
  return [
    hlavicka(ctx, {
      stitek: t("nav.montaze"), nadpis: t("montaze.nadpis"), lead: t("montaze.lead"),
      drobecky: drobecky(ctx, [["uvod", t("nav.uvod")], ["montaze", t("nav.montaze")]]),
    }),
    `<section class="pas pas--tesny"><div class="obal">
      <div class="mrizka mrizka--3 prijezd--rada">${site.obory.map((o) => kartaOboru(ctx, o)).join("")}</div>
    </div></section>`,
    `<section class="pas pas--linka"><div class="obal mrizka mrizka--bok">
      <div class="prijezd">
        <p class="stitek">${esc(t("montaze.nedelameNadpis"))}</p>
        <h2 style="font-size:1.7rem">${esc(t("montaze.nedelameNadpis"))}</h2>
        <p class="lead">${esc(t("montaze.nedelameLead"))}</p>
      </div>
      <div class="mrizka mrizka--2 prijezd--rada">
        ${site.nedelame.map((n) => `
          <div class="karta rohy">
            <div style="color:var(--cervena);margin-bottom:.6rem">${ikona("krizek", { velikost: 22 })}</div>
            <h3 class="karta__nadpis">${esc(n.nazev)}</h3>
            <p class="karta__text">${esc(n.text)}</p>
          </div>`).join("")}
      </div>
    </div></section>`,
    ctaPas(ctx, { nadpis: t("uvod.ctaPatka"), text: t("uvod.ctaPatkaText") }),
  ].join("\n");
}

export function oborDetail(ctx, obor) {
  const { t, odkaz, site } = ctx;
  const texty = t(`obor.${obor.id}`) || {};
  const stavby = site.stavby.filter((s) => s.obory.includes(obor.id));
  const dalsi = site.obory.filter((o) => o.id !== obor.id);
  return [
    hlavicka(ctx, {
      stitek: obor.znacka === "realstaff"
        ? `${t("obor.stitek")} ${obor.cislo} · ${t("obor.znackaRealstaff")}`
        : `${t("obor.stitek")} ${obor.cislo} — ${obor.zkratka}`,
      nadpis: obor.nazev, lead: obor.perex,
      drobecky: drobecky(ctx, [["uvod", t("nav.uvod")], ["montaze", t("nav.montaze")], ["x", obor.nazev]]),
      akce: `<a class="tl tl--signal" href="${odkaz("poptavka")}">${esc(t("spolecne.cta"))}</a>`,
    }),
    `<section class="pas pas--tesny"><div class="obal mrizka mrizka--bok">
      <div class="karta rohy prijezd" style="background:var(--tus);color:#dbe7f5;border-color:var(--tus)">
        <span class="karta__cislo" style="color:var(--cyan)">${esc(t("obor.kdyVolat"))}</span>
        <p style="margin:.6rem 0 0;font-size:1.02rem">${esc(texty.kdyVolat || "")}</p>
      </div>
      <div class="prijezd">
        <h2 style="font-size:1.6rem">${esc(t("obor.coDelameNadpis"))}</h2>
        ${odstavce(texty.detail || "", "lead")}
        <ul class="seznam" style="margin-top:1.4rem">${obor.polozky.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      </div>
    </div></section>`,
    stavby.length ? `<section class="pas pas--linka"><div class="obal">
      <div class="hlavicka-sekce prijezd"><h2 style="font-size:1.7rem">${esc(t("obor.stavbyNadpis"))}</h2></div>
      <div class="mrizka mrizka--3 prijezd--rada">${stavby.slice(0, 3).map((s) => kartaStavby(ctx, s)).join("")}</div>
    </div></section>` : "",
    `<section class="pas pas--tesny pas--linka"><div class="obal">
      <p class="stitek">${esc(t("obor.dalsiObory"))}</p>
      <div class="znacky">${dalsi.map((o) =>
        `<a href="${odkaz(`obor-${o.slug}`)}" class="chip">${esc(o.nazev)}</a>`).join("")}</div>
    </div></section>`,
    ctaPas(ctx, { nadpis: t("uvod.ctaPatka"), text: t("uvod.ctaPatkaText") }),
  ].join("\n");
}

export function jakPracujeme(ctx) {
  const { t, site } = ctx;
  const pravidla = Array.isArray(t("jakPracujeme.pravidla")) ? t("jakPracujeme.pravidla") : [];
  return [
    hlavicka(ctx, {
      stitek: t("jakPracujeme.stitek"), nadpis: t("jakPracujeme.nadpis"), lead: t("jakPracujeme.lead"),
      drobecky: drobecky(ctx, [["uvod", t("nav.uvod")], ["jakPracujeme", t("nav.jakPracujeme")]]),
    }),
    `<section class="pas pas--tesny"><div class="obal mrizka mrizka--bok">
      <div class="prijezd">
        <p class="stitek">${esc(t("jakPracujeme.harmonogramNadpis"))}</p>
        <p class="male tise">${esc(t("jakPracujeme.harmonogramPopis"))}</p>
        <p class="mono male" style="margin-top:1rem"><span style="display:inline-block;width:10px;height:10px;background:var(--signal);border-radius:2px;vertical-align:middle"></span>
          ${esc(t("jakPracujeme.kritickaCesta"))}</p>
        <p class="mono male tise" data-vystup="trvani"></p>
      </div>
      <div class="prijezd">
        <div class="gantt" data-gantt='${esc(JSON.stringify(site.faze))}'></div>
      </div>
    </div></section>`,
    `<section class="pas pas--linka"><div class="obal">
      <div class="kroky prijezd--rada">
        ${site.faze.map((f) => `
          <div class="krok">
            <h3>${esc(f.nazev)}</h3>
            <p>${esc(f.text)}</p>
          </div>`).join("")}
      </div>
    </div></section>`,
    `<section class="pas pas--vykres"><div class="obal">
      <div class="hlavicka-sekce prijezd"><h2>${esc(t("jakPracujeme.pravidlaNadpis"))}</h2></div>
      <div class="mrizka mrizka--4 prijezd--rada">
        ${pravidla.map((p, i) => `
          <div class="karta rohy">
            <span class="karta__cislo">0${i + 1}</span>
            <h3 class="karta__nadpis">${esc(p.nadpis)}</h3>
            <p class="karta__text">${esc(p.text)}</p>
          </div>`).join("")}
      </div>
    </div></section>`,
    ctaPas(ctx, { nadpis: t("uvod.ctaPatka"), text: t("uvod.ctaPatkaText") }),
  ].join("\n");
}

function segmentStranka(ctx, klic, { stavby, obory }) {
  const { t, odkaz, site } = ctx;
  const vyhody = Array.isArray(t(`${klic}.vyhody`)) ? t(`${klic}.vyhody`) : [];
  const postup = Array.isArray(t(`${klic}.postup`)) ? t(`${klic}.postup`) : null;
  return [
    hlavicka(ctx, {
      stitek: t(`${klic}.stitek`), nadpis: t(`${klic}.nadpis`), lead: t(`${klic}.lead`),
      drobecky: drobecky(ctx, [["uvod", t("nav.uvod")], [klic, t(`nav.${klic}`)]]),
      akce: `<a class="tl tl--signal" href="${odkaz("poptavka")}">${esc(t("spolecne.cta"))}</a>
             <a class="tl tl--obrys" href="${odkaz("stavby")}">${esc(t("spolecne.vsechnyStavby"))}</a>`,
    }),
    `<section class="pas pas--tesny"><div class="obal">
      <div class="hlavicka-sekce prijezd"><h2 style="font-size:1.7rem">${esc(t(`${klic}.vyhodyNadpis`))}</h2></div>
      <div class="mrizka mrizka--3 prijezd--rada">
        ${vyhody.map((v, i) => `
          <div class="karta rohy">
            <span class="karta__cislo">${String(i + 1).padStart(2, "0")}</span>
            <h3 class="karta__nadpis">${esc(v.nadpis)}</h3>
            <p class="karta__text">${esc(v.text)}</p>
          </div>`).join("")}
      </div>
    </div></section>`,
    postup ? `<section class="pas pas--linka"><div class="obal mrizka mrizka--bok">
      <div class="prijezd"><h2 style="font-size:1.7rem">${esc(t(`${klic}.postupNadpis`))}</h2></div>
      <div class="kroky prijezd--rada">${postup.map((p) => `<div class="krok"><p style="color:var(--tus);font-size:1rem">${esc(p)}</p></div>`).join("")}</div>
    </div></section>` : `<section class="pas pas--vykres"><div class="obal mrizka mrizka--2" style="align-items:center">
      <div class="prijezd">
        <h2 style="font-size:1.7rem">${esc(t(`${klic}.tcNadpis`))}</h2>
        <p class="lead">${esc(t(`${klic}.tcText`))}</p>
      </div>
      <div class="prijezd">${motivStavby("vila")}</div>
    </div></section>`,
    `<section class="pas"><div class="obal">
      <div class="hlavicka-sekce hlavicka-sekce--mezi prijezd">
        <h2 style="font-size:1.7rem">${esc(t("obor.stavbyNadpis"))}</h2>
        <a class="sipka" href="${odkaz("stavby")}">${esc(t("spolecne.vsechnyStavby"))} ${ikona("sipka", { velikost: 15 })}</a>
      </div>
      <div class="mrizka mrizka--3 prijezd--rada">${stavby.slice(0, 3).map((s) => kartaStavby(ctx, s)).join("")}</div>
    </div></section>`,
    ctaPas(ctx, { nadpis: t(`${klic}.ctaNadpis`), text: t(`${klic}.ctaText`) }),
  ].join("\n");
}

export function b2b(ctx) {
  return segmentStranka(ctx, "b2b", { stavby: ctx.site.stavby.filter((s) => s.segment === "b2b") });
}
export function b2c(ctx) {
  const domaci = ctx.site.stavby.filter((s) => s.segment === "b2c");
  const zbytek = ctx.site.stavby.filter((s) => s.segment !== "b2c").slice(0, 3 - domaci.length);
  return segmentStranka(ctx, "b2c", { stavby: [...domaci, ...zbytek] });
}
