/** Stránky: úvod, přehled profesí, detail profese, náročné prostory, postup, B2B, B2C. */
import { esc, odstavce, cisloCs } from "./lib.mjs";
import { ikona, IKONY_OBORU } from "./ikony.mjs";
import { vykresB2b, vykresB2c, motivStavby, hvezdy } from "./kresby.mjs";
import { hlavicka, drobecky, kartaOboru, kartaStavby, kartaRecenze, ctaPas, udaje, pasmo, deliciTrasa } from "./casti.mjs";
import * as recenzeLib from "../lib/recenze.mjs";

export function uvod(ctx) {
  const { t, odkaz, site } = ctx;
  const viditelne = recenzeLib.viditelne(site.recenze);
  const souhrn = recenzeLib.souhrn(viditelne);
  const posledni = recenzeLib.serad(viditelne, "nejnovejsi").slice(0, 3);
  const stavby = [...site.stavby].sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, 3);

  const hero = `
  <section class="hero">
    <div class="obal hero__mrizka">
      <div>
        <p class="stitek">${esc(t("uvod.stitek"))}</p>
        <h1>${esc(t("uvod.nadpis"))}</h1>
        <span class="podtrzeni" aria-hidden="true"></span>
        <p class="lead hero__lead">${esc(t("uvod.lead"))}</p>
        <div class="tlacitka" style="margin:1.8rem 0 1.6rem">
          <a class="tl tl--signal" href="${odkaz("poptavka")}">${esc(t("uvod.ctaHlavni"))} ${ikona("sipka", { velikost: 16 })}</a>
          <a class="tl tl--obrys" href="${odkaz("stavby")}">${esc(t("uvod.ctaVedlejsi"))}</a>
        </div>
        <div data-prepinac="hero">
          <p class="mono male tise" style="margin-bottom:.5rem">${esc(t("uvod.prepinacPopis"))}</p>
          <div class="prepinac" role="group">
            <button type="button" data-varianta="b2b" aria-pressed="true">${esc(t("spolecne.segmentB2b"))}</button>
            <button type="button" data-varianta="b2c" aria-pressed="false">${esc(t("spolecne.segmentB2c"))}</button>
          </div>
          <div style="margin-top:1.1rem;max-width:46ch">
            <div data-varianta-obsah="b2b">
              <h2 style="font-size:1.12rem;margin-bottom:.3rem">${esc(t("uvod.heroB2bNadpis"))}</h2>
              <p class="male tise" style="margin:0">${esc(t("uvod.heroB2bText"))}</p>
            </div>
            <div data-varianta-obsah="b2c" hidden>
              <h2 style="font-size:1.12rem;margin-bottom:.3rem">${esc(t("uvod.heroB2cNadpis"))}</h2>
              <p class="male tise" style="margin:0">${esc(t("uvod.heroB2cText"))}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="hero__vykres je-videt" data-kriz>
        <div data-varianta-obsah="b2b">${vykresB2b({
          kota1: "4 000", kota2: "+3,60", jednotka: "VZT jednotka 12 000 m³/h", odbocka: "Ø 400 — odbočka do sálu",
        })}</div>
        <div data-varianta-obsah="b2c" hidden>${vykresB2c({
          kota1: "2 600", kota2: "+4,40", jednotka: "TČ vzduch–voda 14 kW", zasobnik: "Akumulace + TUV",
        })}</div>
        <div class="kriz" aria-hidden="true">
          <div class="kriz__v"></div><div class="kriz__h"></div>
          <div class="kriz__popis"></div>
        </div>
      </div>
    </div>
  </section>`;

  const legenda = pasmo([
    "Vzduchotechnika", "Vytápění a ÚT", "Zdravotechnika", "Chlazení", "Tepelná čerpadla",
    "Dodávka na klíč", "Montáž za provozu", "Nemocnice", "Terminály", "Výrobní haly",
    "Rodinné domy", "Památky", "Serverovny",
  ]);

  const cisla = `
  <section class="pas pas--tesny pas--linka">
    <div class="obal prijezd">${udaje(ctx, site.cisla)}</div>
  </section>`;

  const obory = `
  <section class="pas">
    <div class="obal">
      <div class="hlavicka-sekce prijezd">
        <p class="stitek">01 — ${esc(t("nav.montaze"))}</p>
        <h2>${esc(t("uvod.oboryNadpis"))}</h2>
        <p class="lead">${esc(t("uvod.oboryLead"))}</p>
      </div>
      <div class="mrizka mrizka--3 prijezd--rada">
        ${site.obory.map((o) => kartaOboru(ctx, o)).join("")}
      </div>
    </div>
  </section>`;

  const narocne = `
  <section class="pas pas--vykres">
    <div class="obal">
      <div class="mrizka mrizka--2" style="align-items:center">
        <div class="prijezd">
          <p class="stitek stitek--bily">02 — ${esc(t("narocne.stitek"))}</p>
          <h2>${esc(t("uvod.narocneNadpis"))}</h2>
          <p class="lead">${esc(t("uvod.narocneLead"))}</p>
          <div class="tlacitka" style="margin-top:1.4rem">
            <a class="tl tl--signal" href="${odkaz("narocne")}">${esc(t("uvod.narocneCta"))} ${ikona("sipka", { velikost: 16 })}</a>
          </div>
        </div>
        <div class="prijezd">
          <div class="karta rohy">
            <span class="karta__cislo">${esc(t("narocne.mericNadpis"))}</span>
            <div class="merka" style="margin:1.2rem 0 .3rem">
              <div class="merka__pruh" style="--procent:78%"></div>
              <div class="merka__stupnice"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
            </div>
            <p class="stupen" data-stupen="extremni" style="margin:1rem 0 .2rem">78 / 100</p>
            <p class="male tise" style="margin:0">${esc(site.stavby[0].perex)}</p>
          </div>
        </div>
      </div>
    </div>
  </section>`;

  const sekceStavby = `
  <section class="pas">
    <div class="obal">
      <div class="hlavicka-sekce hlavicka-sekce--mezi prijezd">
        <div>
          <p class="stitek">03 — ${esc(t("nav.stavby"))}</p>
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
  <section class="pas pas--linka">
    <div class="obal mrizka mrizka--bok">
      <div class="prijezd">
        <p class="stitek">04 — ${esc(t("jakPracujeme.stitek"))}</p>
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
          <p class="stitek">05 — ${esc(t("nav.recenze"))}</p>
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

  return [hero, legenda, cisla, obory, `<div class="pas pas--tesny">${deliciTrasa()}</div>`, narocne, sekceStavby, postup, sekceRecenze,
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
      stitek: `${t("obor.stitek")} ${obor.cislo} — ${obor.zkratka}`, nadpis: obor.nazev, lead: obor.perex,
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

export function narocne(ctx) {
  const { t, site } = ctx;
  const faktory = site.faktoryObtiznosti;
  const nejtezsi = site.stavby.slice(0, 3);
  const otazka = (f) => `
    <fieldset class="prijezd" data-faktor="${esc(f.id)}">
      <legend class="legenda" style="margin-bottom:.55rem">${esc(f.nazev)}</legend>
      <div class="volby">
        ${f.moznosti.map((m, i) => `
          <label class="volba">
            <input type="radio" name="f-${esc(f.id)}" value="${esc(m.id)}">
            <span data-znak="${String(i + 1).padStart(2, "0")}">${esc(m.popis)}</span>
          </label>`).join("")}
      </div>
    </fieldset>`;
  return [
    hlavicka(ctx, {
      stitek: t("narocne.stitek"), nadpis: t("narocne.nadpis"), lead: t("narocne.lead"),
      drobecky: drobecky(ctx, [["uvod", t("nav.uvod")], ["narocne", t("nav.narocne")]]),
    }),
    `<section class="pas pas--tesny"><div class="obal">
      <div class="meric" data-meric
        data-faktory='${esc(JSON.stringify(faktory))}'
        data-doporuceni='${esc(JSON.stringify(site.doporuceniObtiznosti))}'
        data-stupne='${esc(JSON.stringify(site.popisyStupnu))}'
        data-hlasky='${esc(JSON.stringify({ chybi: t("narocne.vysledekChybi"), doporuceni: t("narocne.doporuceniNadpis"), prispevky: t("narocne.prispevkyNadpis") }))}'>
        <div>
          <p class="stitek">${esc(t("narocne.mericNadpis"))}</p>
          <p class="male tise" style="max-width:56ch">${esc(t("narocne.mericPopis"))}</p>
          <div style="margin-top:1.6rem;display:grid;gap:1.4rem">${faktory.map(otazka).join("")}</div>
        </div>
        <aside class="meric__vysledek">
          <div class="karta rohy">
            <span class="karta__cislo">${esc(t("narocne.vysledekNadpis"))}</span>
            <p class="stupen" data-stupen="bezna" data-vystup="stupen" style="margin:.7rem 0 .1rem">—</p>
            <p class="male tise" data-vystup="popis" style="min-height:3em">${esc(t("narocne.vysledekChybi").replace("{pocet}", String(faktory.length)))}</p>
            <div class="merka" style="margin:1.2rem 0 .3rem">
              <div class="merka__pruh" data-vystup="merka" style="--procent:0%"></div>
              <div class="merka__stupnice"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
            </div>
            <div data-vystup="prispevky" style="margin-top:1.4rem"></div>
            <div data-vystup="doporuceni" style="margin-top:1.2rem"></div>
          </div>
        </aside>
      </div>
    </div></section>`,
    `<section class="pas pas--linka"><div class="obal">
      <div class="hlavicka-sekce prijezd"><h2 style="font-size:1.7rem">${esc(t("narocne.priklady"))}</h2></div>
      <div class="mrizka mrizka--3 prijezd--rada">${nejtezsi.map((s) => kartaStavby(ctx, s)).join("")}</div>
    </div></section>`,
    ctaPas(ctx, { nadpis: t("narocne.ctaNadpis"), text: t("narocne.ctaText") }),
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
