/** Stránky: stavby, recenze, poptávka, výpočty, o firmě, kariéra, dotazy, kontakt, doplňky. */
import { esc, odstavce, cisloCs } from "./lib.mjs";
import { ikona } from "./ikony.mjs";
import { motivStavby, hvezdy } from "./kresby.mjs";
import { hlavicka, drobecky, kartaStavby, kartaRecenze, ctaPas, pole, souhlas } from "./casti.mjs";
import * as recenzeLib from "../lib/recenze.mjs";
import * as stavbyLib from "../lib/stavby.mjs";

export function stavby(ctx) {
  const { t, site } = ctx;
  const facetyObory = stavbyLib.facety(site.stavby, "obory");
  const roky = stavbyLib.roky(site.stavby);
  const chip = (klic, hodnota, popisek, pocet) =>
    `<button type="button" class="chip" data-filtr="${esc(klic)}" data-hodnota="${esc(hodnota)}"
      aria-pressed="${hodnota === "vse" ? "true" : "false"}">${esc(popisek)}${pocet !== undefined ? `<span class="chip__pocet">${pocet}</span>` : ""}</button>`;
  return [
    hlavicka(ctx, {
      stitek: t("stavby.stitek"), nadpis: t("stavby.nadpis"), lead: t("stavby.lead"),
      drobecky: drobecky(ctx, [["uvod", t("nav.uvod")], ["stavby", t("nav.stavby")]]),
    }),
    `<section class="pas pas--tesny"><div class="obal" data-seznam-staveb>
      <div class="filtry">
        <span class="mono male tise" style="margin-right:.3rem">${esc(t("spolecne.obor"))}</span>
        ${chip("obor", "vse", t("spolecne.vse"))}
        ${facetyObory.map((f) => {
          const o = site.obory.find((x) => x.id === f.id);
          return chip("obor", f.id, o ? o.nazev : f.id, f.pocet);
        }).join("")}
      </div>
      <div class="filtry">
        <span class="mono male tise" style="margin-right:.3rem">${esc(t("spolecne.segmentB2b"))} / ${esc(t("spolecne.segmentB2c"))}</span>
        ${chip("segment", "vse", t("spolecne.vse"))}
        ${chip("segment", "b2b", t("recenze.filtrB2b"))}
        ${chip("segment", "b2c", t("recenze.filtrB2c"))}
        <span class="mono male tise" style="margin:0 .3rem 0 1rem">${esc(t("spolecne.rok"))}</span>
        ${chip("rok", "vse", t("spolecne.vse"))}
        ${roky.map((r) => chip("rok", String(r), String(r))).join("")}
      </div>
      <p class="mono male tise" data-pocet-staveb>${esc(t("stavby.pocet").replace("{zobrazeno}", String(site.stavby.length)).replace("{celkem}", String(site.stavby.length)))}</p>
      <div class="mrizka mrizka--3" style="margin-top:1.2rem" data-vypis-staveb>
        ${site.stavby.map((s) => `<div data-stavba="${esc(s.id)}" data-obory="${esc(s.obory.join(" "))}"
          data-segment="${esc(s.segment)}" data-rok="${esc(String(s.rok))}">${kartaStavby(ctx, s)}</div>`).join("")}
      </div>
      <p class="prazdno" data-prazdno hidden>${esc(t("spolecne.nenalezeno"))}</p>
    </div></section>`,
    ctaPas(ctx, { nadpis: t("uvod.ctaPatka"), text: t("uvod.ctaPatkaText") }),
  ].join("\n");
}

export function stavbaDetail(ctx, s) {
  const { t, odkaz, site } = ctx;
  const obory = s.obory.map((id) => site.obory.find((o) => o.id === id)).filter(Boolean);
  const podobne = stavbyLib.podobne(site.stavby, s.id, 3);
  const recenze = recenzeLib.viditelne(site.recenze).filter((r) => r.stavba === s.id);
  return [
    hlavicka(ctx, {
      stitek: `${s.misto} · ${s.rok}`, nadpis: s.nazev, lead: s.perex,
      drobecky: drobecky(ctx, [["uvod", t("nav.uvod")], ["stavby", t("nav.stavby")], ["x", s.nazev]]),
    }),
    `<section class="pas pas--tesny"><div class="obal mrizka mrizka--bok">
      <div class="prijezd">
        <div style="color:var(--cara);margin-bottom:1.4rem">${motivStavby(s.motiv)}</div>
        <table class="fakta">
          <tr><th>${esc(t("stavby.detailRole"))}</th><td>${esc(s.role)}</td></tr>
          <tr><th>${esc(t("stavby.detailRozsah"))}</th><td>${esc(s.rozsah)}</td></tr>
          <tr><th>${esc(t("stavby.detailTrvani"))}</th><td>${esc(s.trvani)}</td></tr>
          <tr><th>${esc(t("spolecne.kraj"))}</th><td>${esc(s.kraj)}</td></tr>
          <tr><th>${esc(t("stavby.detailObory"))}</th><td>${obory.map((o) => esc(o.zkratka)).join(" · ")}</td></tr>
        </table>
      </div>
      <div class="prijezd">
        <h2 style="font-size:1.5rem">${esc(t("stavby.detailZadani"))}</h2>
        <p class="lead">${esc(s.zadani)}</p>
        <h2 style="font-size:1.5rem;margin-top:2rem">${esc(t("stavby.detailReseni"))}</h2>
        <ul class="seznam">${s.reseni.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
        <div class="mrizka mrizka--3" style="margin-top:2rem">
          ${s.cisla.map((c) => `<div class="udaj"><span class="udaj__cislo">${esc(c.hodnota)}</span><span class="udaj__popis">${esc(c.popis)}</span></div>`).join("")}
        </div>
      </div>
    </div></section>`,
    recenze.length ? `<section class="pas pas--tesny pas--linka"><div class="obal">
      <div class="mrizka mrizka--2 prijezd--rada">${recenze.map((r) => kartaRecenze(ctx, r, { odkazNaStavbu: false })).join("")}</div>
    </div></section>` : "",
    podobne.length ? `<section class="pas pas--linka"><div class="obal">
      <div class="hlavicka-sekce prijezd"><h2 style="font-size:1.6rem">${esc(t("spolecne.souvisejici"))}</h2></div>
      <div class="mrizka mrizka--3 prijezd--rada">${podobne.map((x) => kartaStavby(ctx, x)).join("")}</div>
    </div></section>` : "",
    ctaPas(ctx, { nadpis: t("uvod.ctaPatka"), text: t("uvod.ctaPatkaText") }),
  ].join("\n");
}

export function recenze(ctx) {
  const { t, site } = ctx;
  const viditelne = recenzeLib.viditelne(site.recenze);
  const souhrn = recenzeLib.souhrn(viditelne);
  const hist = souhrn.histogram;
  const max = Math.max(1, ...Object.values(hist));
  return [
    hlavicka(ctx, {
      stitek: t("recenze.stitek"), nadpis: t("recenze.nadpis"), lead: t("recenze.lead"),
      drobecky: drobecky(ctx, [["uvod", t("nav.uvod")], ["recenze", t("nav.recenze")]]),
    }),
    `<section class="pas pas--tesny"><div class="obal">
      <div class="karta rohy prijezd">
        <div class="hodnoceni-souhrn">
          <div style="text-align:center">
            <div class="udaj__cislo">${cisloCs(souhrn.prumer, 1)}</div>
            ${hvezdy(Math.round(souhrn.prumer))}
            <p class="male tise" style="margin:.4rem 0 0">${esc(t("recenze.prumerPopis"))}<br>${esc(t("recenze.zPoctu").replace("{pocet}", String(souhrn.pocet)))}</p>
          </div>
          <div>
            <div class="histogram">
              ${[5, 4, 3, 2, 1].map((h) => `
                <div class="histogram__radek">
                  <span>${h} ★</span>
                  <span class="histogram__pruh"><i style="--podil:${Math.round((hist[String(h)] / max) * 100)}%"></i></span>
                  <span>${hist[String(h)]}</span>
                </div>`).join("")}
            </div>
            <p class="male tise" style="margin:.9rem 0 0">${esc(t("recenze.doporucuje").replace("{procent}", String(souhrn.doporucujeProcent)))}</p>
          </div>
        </div>
      </div>
    </div></section>`,
    `<section class="pas pas--tesny"><div class="obal" data-seznam-recenzi>
      <div class="filtry">
        <button type="button" class="chip" data-filtr="segment" data-hodnota="vse" aria-pressed="true">${esc(t("recenze.filtrVse"))}</button>
        <button type="button" class="chip" data-filtr="segment" data-hodnota="b2b" aria-pressed="false">${esc(t("recenze.filtrB2b"))}</button>
        <button type="button" class="chip" data-filtr="segment" data-hodnota="b2c" aria-pressed="false">${esc(t("recenze.filtrB2c"))}</button>
        <span style="flex:1"></span>
        <label class="mono male tise" for="razeni-recenzi">${esc(t("recenze.razeni"))}</label>
        <select id="razeni-recenzi" class="vstup" data-razeni style="width:auto">
          <option value="nejnovejsi">${esc(t("recenze.razeniNejnovejsi"))}</option>
          <option value="nejlepsi">${esc(t("recenze.razeniNejlepsi"))}</option>
          <option value="nejhorsi">${esc(t("recenze.razeniNejhorsi"))}</option>
        </select>
      </div>
      <div class="mrizka mrizka--2" data-vypis-recenzi>
        ${viditelne.map((r) => kartaRecenze(ctx, r)).join("")}
      </div>
      <p class="prazdno" data-prazdno hidden>${esc(t("spolecne.nenalezeno"))}</p>
    </div></section>`,
    `<section class="pas pas--vykres"><div class="obal" style="max-width:52rem">
      <p class="stitek stitek--bily">${esc(t("recenze.formularNadpis"))}</p>
      <h2>${esc(t("recenze.formularNadpis"))}</h2>
      <p class="lead">${esc(t("recenze.formularLead"))}</p>
      <form data-formular="recenze" novalidate style="margin-top:1.6rem">
        <div class="pole-dvojice">
          ${pole("jmeno", t("recenze.poleJmeno"), { povinne: true })}
          ${pole("firma", t("recenze.poleFirma"))}
        </div>
        <div class="pole-dvojice">
          ${pole("email", t("recenze.poleEmail"), { typ: "email" })}
          ${pole("segment", t("recenze.poleSegment"), { moznosti: [["b2c", t("spolecne.segmentB2c")], ["b2b", t("spolecne.segmentB2b")]] })}
        </div>
        <div class="pole" data-pole="hodnoceni">
          <label for="hodnoceni">${esc(t("recenze.poleHodnoceni"))}</label>
          <div class="volby" style="grid-template-columns:repeat(auto-fit,minmax(90px,1fr))">
            ${[5, 4, 3, 2, 1].map((h) => `
              <label class="volba"><input type="radio" name="hodnoceni" value="${h}"${h === 5 ? " checked" : ""}>
              <span data-znak="${h} ★">${h === 5 ? "Výborně" : h === 4 ? "Dobře" : h === 3 ? "Ujde" : h === 2 ? "Slabé" : "Špatné"}</span></label>`).join("")}
          </div>
          <span class="chyba" data-chyba hidden></span>
        </div>
        ${pole("text", t("recenze.poleText"), { radku: 5, povinne: true })}
        <div class="pole pole--souhlas"><input type="checkbox" id="doporucuje" name="doporucuje" checked>
          <label for="doporucuje">${esc(t("recenze.poleDoporucuje"))}</label></div>
        ${souhlas("souhlas", t("recenze.poleSouhlas"))}
        <button class="tl tl--signal" type="submit">${esc(t("recenze.odeslat"))}</button>
        <p class="hlaska" data-hotovo hidden style="margin-top:1rem">${esc(t("recenze.odeslano"))}</p>
      </form>
    </div></section>`,
  ].join("\n");
}

export function poptavka(ctx) {
  const { t, site } = ctx;
  const definice = [
    { id: "segment", otazka: t("poptavka.otazky.segment"), typ: "volba", povinne: true,
      moznosti: [{ id: "b2b", popis: t("spolecne.segmentB2b") }, { id: "b2c", popis: t("spolecne.segmentB2c") }] },
    { id: "obory", otazka: t("poptavka.otazky.obory"), typ: "vicevolba", povinne: true, min: 1,
      moznosti: site.obory.map((o) => ({ id: o.id, popis: o.nazev })) },
    { id: "objektFirma", otazka: t("poptavka.otazky.objekt"), typ: "volba", povinne: true,
      podminka: { krok: "segment", hodnota: "b2b" },
      moznosti: ["Kancelar", "Hala", "Zdravotnictvi", "Skola", "Bd", "Jine"]
        .map((k) => ({ id: k.toLowerCase(), popis: t(`poptavka.moznosti.objekt${k}`) })) },
    { id: "objektDomacnost", otazka: t("poptavka.otazky.objekt"), typ: "volba", povinne: true,
      podminka: { krok: "segment", hodnota: "b2c" },
      moznosti: ["Rd", "Byt", "Bd", "Chata", "Jine"]
        .map((k) => ({ id: k.toLowerCase(), popis: t(`poptavka.moznosti.objekt${k}`) })) },
    { id: "projekt", otazka: t("poptavka.otazky.projekt"), typ: "ano-ne", povinne: true,
      podminka: { krok: "segment", hodnota: "b2b" } },
    { id: "provoz", otazka: t("poptavka.otazky.provoz"), typ: "ano-ne", povinne: true,
      podminka: { krok: "segment", hodnota: "b2b" } },
    { id: "plocha", otazka: t("poptavka.otazky.plocha"), typ: "cislo", min: 5, max: 100000 },
    { id: "termin", otazka: t("poptavka.otazky.termin"), typ: "volba", povinne: true,
      moznosti: ["Ihned", "Kvartal", "Pul", "Nevim"].map((k) => ({ id: k.toLowerCase(), popis: t(`poptavka.moznosti.termin${k}`) })) },
    { id: "pozn", otazka: t("poptavka.otazky.pozn"), typ: "text", max: 800 },
  ];
  return [
    hlavicka(ctx, {
      stitek: t("poptavka.stitek"), nadpis: t("poptavka.nadpis"), lead: t("poptavka.lead"),
      drobecky: drobecky(ctx, [["uvod", t("nav.uvod")], ["poptavka", t("nav.poptavka")]]),
    }),
    `<section class="pas pas--tesny"><div class="obal">
      <div class="pruvodce" data-pruvodce='${esc(JSON.stringify(definice))}'>
        <div>
          <div class="pruvodce__postup"><i style="--procent:0%"></i></div>
          <p class="mono male tise" data-krok-popis></p>
          <div data-kroky></div>
          <div class="karta rohy" data-kontakt hidden style="margin-top:1.4rem">
            <h3 style="font-size:1.1rem">${esc(t("poptavka.kontaktNadpis"))}</h3>
            <div class="pole-dvojice">
              ${pole("jmeno", t("poptavka.poleJmeno"), { povinne: true })}
              ${pole("firma", t("poptavka.poleFirma"))}
            </div>
            <div class="pole-dvojice">
              ${pole("email", t("poptavka.poleEmail"), { typ: "email", povinne: true })}
              ${pole("telefon", t("poptavka.poleTelefon"), { typ: "tel" })}
            </div>
            ${pole("ico", t("poptavka.poleIco"), { napoveda: "Nepovinné, urychlí to fakturaci." })}
            ${souhlas("souhlas", t("poptavka.poleSouhlas"))}
          </div>
          <div class="tlacitka" style="margin-top:1.6rem">
            <button class="tl tl--obrys" type="button" data-zpet hidden>${esc(t("poptavka.zpet"))}</button>
            <button class="tl" type="button" data-dalsi>${esc(t("poptavka.dalsi"))}</button>
            <button class="tl tl--signal" type="button" data-odeslat hidden>${esc(t("poptavka.odeslat"))}</button>
          </div>
          <div class="hlaska" data-hotovo hidden style="margin-top:1.4rem">
            <strong>${esc(t("poptavka.odeslano"))}</strong><br>${esc(t("poptavka.odeslanoText"))}
            <p style="margin:.8rem 0 0"><button class="tl tl--obrys tl--maly" type="button" data-znovu>${esc(t("poptavka.znovu"))}</button></p>
          </div>
        </div>
        <aside class="pruvodce__shrnuti">
          <div class="karta rohy">
            <span class="karta__cislo">${esc(t("poptavka.shrnutiNadpis"))}</span>
            <dl data-shrnuti style="margin-top:.8rem"></dl>
          </div>
        </aside>
      </div>
    </div></section>`,
  ].join("\n");
}

export function kalkulacky(ctx) {
  const { t } = ctx;
  const vysledek = (klic, popis, hlavni = false) =>
    `<div class="vysledek${hlavni ? " vysledek--hlavni" : ""}"><span class="vysledek__popis">${esc(popis)}</span>
      <span class="vysledek__hodnota" data-vystup="${esc(klic)}">—</span></div>`;
  return [
    hlavicka(ctx, {
      stitek: t("kalkulacky.stitek"), nadpis: t("kalkulacky.nadpis"), lead: t("kalkulacky.lead"),
      drobecky: drobecky(ctx, [["uvod", t("nav.uvod")], ["kalkulacky", t("nav.kalkulacky")]]),
    }),
    `<section class="pas pas--tesny"><div class="obal">
      <p class="hlaska hlaska--info">${esc(t("kalkulacky.upozorneni"))}</p>

      <div class="karta rohy prijezd" style="margin-top:1.6rem" data-kalk="vzt">
        <span class="karta__cislo">01</span>
        <h2 style="font-size:1.4rem">${esc(t("kalkulacky.vztNadpis"))}</h2>
        <p class="male tise" style="max-width:62ch">${esc(t("kalkulacky.vztPopis"))}</p>
        <div class="kalk" style="margin-top:1.4rem">
          <div>
            <div class="pole-dvojice">
              ${pole("vzt-delka", t("kalkulacky.vztDelka"), { typ: "number", hodnota: "8" })}
              ${pole("vzt-sirka", t("kalkulacky.vztSirka"), { typ: "number", hodnota: "6" })}
              ${pole("vzt-vyska", t("kalkulacky.vztVyska"), { typ: "number", hodnota: "3" })}
            </div>
            <div class="pole-dvojice">
              ${pole("vzt-vymeny", t("kalkulacky.vztVymeny"), { typ: "number", hodnota: "4" })}
              ${pole("vzt-osoby", t("kalkulacky.vztOsoby"), { typ: "number", hodnota: "20" })}
              ${pole("vzt-davka", t("kalkulacky.vztDavka"), { typ: "number", hodnota: "30" })}
            </div>
            ${pole("vzt-rychlost", t("kalkulacky.vztRychlost"), { typ: "number", hodnota: "4" })}
          </div>
          <div>
            <svg class="prurez" data-vykres-vzt viewBox="0 0 320 180" role="img"
              aria-label="Porovnání kruhového a čtyřhranného potrubí"></svg>
          <div class="vysledky">
            ${vysledek("vzt-objem", t("kalkulacky.vztObjem"))}
            ${vysledek("vzt-vymeny-out", t("kalkulacky.vztPodleVymen"))}
            ${vysledek("vzt-osoby-out", t("kalkulacky.vztPodleOsob"))}
            ${vysledek("vzt-navrh", t("kalkulacky.vztNavrh"), true)}
            ${vysledek("vzt-prumer", t("kalkulacky.vztPrumer"))}
            ${vysledek("vzt-norma", t("kalkulacky.vztNorma"))}
            ${vysledek("vzt-skutecna", t("kalkulacky.vztSkutecna"))}
            ${vysledek("vzt-hranate", t("kalkulacky.vztHranate"))}
          </div>
          </div>
        </div>
      </div>

      <div class="karta rohy prijezd" style="margin-top:1.6rem" data-kalk="tc">
        <span class="karta__cislo">02</span>
        <h2 style="font-size:1.4rem">${esc(t("kalkulacky.tcNadpis"))}</h2>
        <p class="male tise" style="max-width:62ch">${esc(t("kalkulacky.tcPopis"))}</p>
        <div class="kalk" style="margin-top:1.4rem">
          <div>
            <div class="pole-dvojice">
              ${pole("tc-plocha", t("kalkulacky.tcPlocha"), { typ: "number", hodnota: "140" })}
              ${pole("tc-vyska", t("kalkulacky.tcVyska"), { typ: "number", hodnota: "2.6" })}
            </div>
            <div class="pole" data-pole="tc-merna">
              <label for="tc-merna">${esc(t("kalkulacky.tcMerna"))}</label>
              <select id="tc-merna">
                <option value="30">${esc(t("kalkulacky.tcNovostavba"))}</option>
                <option value="55" selected>${esc(t("kalkulacky.tcZateplenyDum"))}</option>
                <option value="100">${esc(t("kalkulacky.tcStarsi"))}</option>
              </select>
            </div>
            ${pole("tc-tuv", t("kalkulacky.tcTuv"), { typ: "number", hodnota: "1.5" })}
          </div>
          <div class="vysledky">
            ${vysledek("tc-ztrata", t("kalkulacky.tcZtrata"))}
            ${vysledek("tc-potreba", t("kalkulacky.tcPotreba"))}
            ${vysledek("tc-vykon", t("kalkulacky.tcVykon"), true)}
            ${vysledek("tc-pokryti", t("kalkulacky.tcPokryti"))}
          </div>
        </div>
      </div>

      <div class="karta rohy prijezd" style="margin-top:1.6rem" data-kalk="rek">
        <span class="karta__cislo">03</span>
        <h2 style="font-size:1.4rem">${esc(t("kalkulacky.rekNadpis"))}</h2>
        <p class="male tise" style="max-width:62ch">${esc(t("kalkulacky.rekPopis"))}</p>
        <div class="kalk" style="margin-top:1.4rem">
          <div>
            <div class="pole-dvojice">
              ${pole("rek-prutok", t("kalkulacky.rekPrutok"), { typ: "number", hodnota: "2000" })}
              ${pole("rek-hodin", t("kalkulacky.rekHodin"), { typ: "number", hodnota: "10" })}
              ${pole("rek-dnu", t("kalkulacky.rekDnu"), { typ: "number", hodnota: "250" })}
            </div>
            <div class="pole-dvojice">
              ${pole("rek-ucinnost", t("kalkulacky.rekUcinnost"), { typ: "number", hodnota: "0.8" })}
              ${pole("rek-delta", t("kalkulacky.rekDelta"), { typ: "number", hodnota: "20" })}
              ${pole("rek-cena", t("kalkulacky.rekCena"), { typ: "number", hodnota: "4.8" })}
            </div>
          </div>
          <div class="vysledky">
            ${vysledek("rek-vykon", t("kalkulacky.rekVykon"))}
            ${vysledek("rek-kwh", t("kalkulacky.rekKwh"))}
            ${vysledek("rek-koruny", t("kalkulacky.rekKoruny"), true)}
          </div>
        </div>
      </div>
    </div></section>`,
    ctaPas(ctx, { nadpis: t("uvod.ctaPatka"), text: t("uvod.ctaPatkaText") }),
  ].join("\n");
}
