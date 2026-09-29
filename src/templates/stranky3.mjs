/** Stránky: o firmě, kariéra, časté dotazy, kontakt, doplňkové stránky. */
import { esc, odstavce } from "./lib.mjs";
import { ikona } from "./ikony.mjs";
import { motivStavby } from "./kresby.mjs";
import { hlavicka, drobecky, ctaPas, pole, souhlas, udaje, prilohy } from "./casti.mjs";
import { razitko } from "./layout.mjs";

export function oNas(ctx) {
  const { t, site } = ctx;
  const f = site.firma; const a = f.adresa;
  const pozice = Array.isArray(t("oNas.tymPozice")) ? t("oNas.tymPozice") : [];
  return [
    hlavicka(ctx, {
      stitek: t("oNas.stitek"), nadpis: t("oNas.nadpis"), lead: t("oNas.lead"),
      drobecky: drobecky(ctx, [["uvod", t("nav.uvod")], ["oNas", t("nav.oNas")]]),
    }),
    `<section class="pas pas--tesny"><div class="obal prijezd">${udaje(ctx, site.cisla)}</div></section>`,
    `<section class="pas pas--linka"><div class="obal mrizka mrizka--bok">
      <div class="prijezd">
        <p class="stitek">${esc(t("oNas.pribehNadpis"))}</p>
        <h2 style="font-size:1.7rem">${esc(t("oNas.pribehNadpis"))}</h2>
      </div>
      <div class="prijezd">${odstavce(t("oNas.pribeh"), "lead")}</div>
    </div></section>`,
    `<section class="pas pas--tesny pas--linka"><div class="obal mrizka mrizka--bok">
      <div class="prijezd"><h2 style="font-size:1.5rem">${esc(t("oNas.faktaNadpis"))}</h2></div>
      <div class="prijezd">
        <table class="fakta">
          <tr><th>${esc(t("oNas.ico"))}</th><td>${esc(f.ico)}</td></tr>
          <tr><th>${esc(t("oNas.dic"))}</th><td>${esc(f.dic)}</td></tr>
          <tr><th>${esc(t("oNas.sidlo"))}</th><td>${esc(a.ulice)}, ${esc(a.cast)}, ${esc(a.psc)} ${esc(a.mesto)}</td></tr>
          <tr><th>${esc(t("oNas.vznik"))}</th><td>${esc(ctx.datumText(f.vznik))}</td></tr>
          <tr><th>${esc(t("oNas.jednatel"))}</th><td>${esc(f.jednatel)}</td></tr>
          <tr><th>${esc(t("oNas.zapis"))}</th><td>${esc(f.zapis)}</td></tr>
          <tr><th>${esc(t("oNas.kapital"))}</th><td>${esc(f.kapital)}</td></tr>
          <tr><th>${esc(t("oNas.pusobnost"))}</th><td>${esc(f.pusobnost)}</td></tr>
        </table>
      </div>
    </div></section>`,
    `<section class="pas pas--vykres"><div class="obal">
      <div class="hlavicka-sekce prijezd">
        <h2>${esc(t("oNas.tymNadpis"))}</h2>
        <p class="lead">${esc(t("oNas.tymLead"))}</p>
      </div>
      <div class="mrizka mrizka--4 prijezd--rada">
        ${pozice.map((p, i) => `
          <div class="karta rohy">
            <span class="karta__cislo">${String(i + 1).padStart(2, "0")}</span>
            <div style="color:var(--cyan);margin-bottom:.6rem">${ikona("parta", { velikost: 24 })}</div>
            <h3 class="karta__nadpis">${esc(p.nazev)}</h3>
            <p class="karta__text">${esc(p.text)}</p>
          </div>`).join("")}
      </div>
      <div class="karta rohy prijezd" style="margin-top:1.6rem;max-width:62ch">
        <h3 class="karta__nadpis">${esc(t("oNas.partneriNadpis"))}</h3>
        <p class="karta__text">${esc(t("oNas.partneriText"))}</p>
      </div>
    </div></section>`,
    ctaPas(ctx, { nadpis: t("uvod.ctaPatka"), text: t("uvod.ctaPatkaText"), druhe: ["kariera", t("nav.kariera")] }),
  ].join("\n");
}

export function kariera(ctx) {
  const { t, site } = ctx;
  const nabizime = Array.isArray(t("kariera.nabizime")) ? t("kariera.nabizime") : [];
  return [
    hlavicka(ctx, {
      stitek: t("kariera.stitek"), nadpis: t("kariera.nadpis"), lead: t("kariera.lead"),
      drobecky: drobecky(ctx, [["uvod", t("nav.uvod")], ["kariera", t("nav.kariera")]]),
    }),
    `<section class="pas pas--tesny"><div class="obal mrizka mrizka--bok">
      <div class="prijezd"><h2 style="font-size:1.5rem">${esc(t("kariera.nabizimeNadpis"))}</h2></div>
      <div class="prijezd"><ul class="seznam seznam--fajfka">${nabizime.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></div>
    </div></section>`,
    `<section class="pas pas--linka"><div class="obal">
      <div class="hlavicka-sekce prijezd"><h2 style="font-size:1.7rem">${esc(t("kariera.poziceNadpis"))}</h2></div>
      <div class="mrizka mrizka--2 prijezd--rada">
        ${site.pozice.map((p, i) => `
          <article class="karta rohy">
            <span class="karta__cislo">${String(i + 1).padStart(2, "0")} — ${esc(p.uvazek)}</span>
            <h3 class="karta__nadpis">${esc(p.nazev)}</h3>
            <p class="karta__text">${esc(p.text)}</p>
            <div class="karta__pata">
              <p class="mono male tise" style="margin:0 0 .5rem">${esc(t("kariera.misto"))}: ${esc(p.misto)}</p>
              <p class="male" style="margin:0 0 .4rem;font-weight:600">${esc(t("kariera.pozadujeme"))}</p>
              <ul class="seznam">${p.pozadujeme.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
            </div>
          </article>`).join("")}
      </div>
    </div></section>`,
    `<section class="pas pas--vykres"><div class="obal" style="max-width:48rem">
      <p class="stitek stitek--bily">${esc(t("kariera.formularNadpis"))}</p>
      <h2>${esc(t("kariera.formularNadpis"))}</h2>
      <p class="lead">${esc(t("kariera.formularLead"))}</p>
      <form data-formular="kariera" novalidate style="margin-top:1.6rem">
        <div class="pole-dvojice">
          ${pole("jmeno", t("kariera.poleJmeno"), { povinne: true })}
          ${pole("telefon", t("kariera.poleTelefon"), { typ: "tel", povinne: true })}
        </div>
        <div class="pole-dvojice">
          ${pole("email", t("kariera.poleEmail"), { typ: "email" })}
          ${pole("pozice", t("kariera.polePozice"), { moznosti: site.pozice.map((p) => [p.id, p.nazev]).concat([["jina", "Jiná"]]) })}
        </div>
        ${pole("zprava", t("kariera.poleText"), { radku: 4, povinne: true })}
        ${souhlas("souhlas", t("kariera.poleSouhlas"))}
        <button class="tl tl--signal" type="submit">${esc(t("kariera.odeslat"))}</button>
        <p class="hlaska" data-hotovo hidden style="margin-top:1rem">${esc(t("kariera.odeslano"))}</p>
      </form>
    </div></section>`,
  ].join("\n");
}

export function dotazy(ctx) {
  const { t, site } = ctx;
  return [
    hlavicka(ctx, {
      stitek: t("dotazy.stitek"), nadpis: t("dotazy.nadpis"), lead: t("dotazy.lead"),
      drobecky: drobecky(ctx, [["uvod", t("nav.uvod")], ["dotazy", t("nav.dotazy")]]),
    }),
    `<section class="pas pas--tesny"><div class="obal" style="max-width:52rem" data-dotazy>
      <div class="pole">
        <label for="hledat-dotaz" class="skryte">${esc(t("dotazy.hledat"))}</label>
        <input type="search" id="hledat-dotaz" placeholder="${esc(t("dotazy.hledat"))}" data-hledat>
      </div>
      <div style="margin-top:1.4rem">
        ${site.faq.map((f, i) => `
          <div class="dotaz" data-dotaz data-text="${esc((f.otazka + " " + f.odpoved).toLowerCase())}">
            <h3 style="margin:0"><button class="dotaz__tlacitko" type="button" aria-expanded="false" aria-controls="dotaz-${i}">${esc(f.otazka)}</button></h3>
            <div class="dotaz__obsah" id="dotaz-${i}"><div><p>${esc(f.odpoved)}</p></div></div>
          </div>`).join("")}
      </div>
      <p class="prazdno" data-prazdno hidden>${esc(t("dotazy.nenalezeno"))}</p>
    </div></section>`,
    ctaPas(ctx, { nadpis: t("uvod.ctaPatka"), text: t("uvod.ctaPatkaText") }),
  ].join("\n");
}

export function kontakt(ctx) {
  const { t, site } = ctx;
  const f = site.firma; const a = f.adresa; const k = site.kontakt;
  return [
    hlavicka(ctx, {
      stitek: t("kontakt.stitek"), nadpis: t("kontakt.nadpis"), lead: t("kontakt.lead"),
      drobecky: drobecky(ctx, [["uvod", t("nav.uvod")], ["kontakt", t("nav.kontakt")]]),
    }),
    `<section class="pas pas--tesny"><div class="obal mrizka mrizka--bok">
      <div class="prijezd">
        <div class="karta rohy">
          <span class="karta__cislo">${esc(t("kontakt.udajeNadpis"))}</span>
          <p style="display:flex;gap:.6rem;align-items:center;margin:.9rem 0 .2rem;font-size:1.06rem;font-weight:600">
            ${ikona("telefon", { velikost: 18 })} <span class="mono" data-udaj="kontakt.telefon">${esc(k.telefon)}</span></p>
          <p class="male tise" style="margin:0 0 1rem">${esc(t("spolecne.telefonDoplnit"))}</p>
          <p style="display:flex;gap:.6rem;align-items:center;margin:0 0 1rem">
            ${ikona("obalka", { velikost: 18 })} <a href="mailto:${esc(k.email)}" data-udaj="kontakt.email" data-udaj-mailto>${esc(k.email)}</a></p>
          <p style="display:flex;gap:.6rem;align-items:flex-start;margin:0">
            ${ikona("pin", { velikost: 18 })} <span><span data-udaj="kontakt.ulice">${esc(a.ulice)}</span><br>${esc(a.cast)}<br>
              <span data-udaj="kontakt.psc">${esc(a.psc)}</span> <span data-udaj="kontakt.mesto">${esc(a.mesto)}</span></span></p>
          <div class="karta__pata">
            <p class="male tise" style="margin:0">${esc(t("kontakt.provozniDoba"))}:
              <span data-udaj="kontakt.provozniDoba">${esc(k.provozniDoba)}</span></p>
          </div>
        </div>
        <div class="karta rohy" style="margin-top:1rem">
          <span class="karta__cislo">${esc(t("kontakt.fakturacniNadpis"))}</span>
          <table class="fakta" style="margin-top:.6rem">
            <tr><th>${esc(t("oNas.ico"))}</th><td>${esc(f.ico)}</td></tr>
            <tr><th>${esc(t("oNas.dic"))}</th><td>${esc(f.dic)}</td></tr>
            <tr><th>${esc(t("oNas.zapis"))}</th><td>${esc(f.zapis)}</td></tr>
          </table>
        </div>
      </div>
      <div class="prijezd">
        <h2 style="font-size:1.5rem">${esc(t("kontakt.formularNadpis"))}</h2>
        <form data-formular="kontakt" novalidate>
          <div class="pole-dvojice">
            ${pole("jmeno", t("kontakt.poleJmeno"), { povinne: true })}
            ${pole("firma", t("kontakt.poleFirma"))}
          </div>
          <div class="pole-dvojice">
            ${pole("email", t("kontakt.poleEmail"), { typ: "email", povinne: true })}
            ${pole("telefon", t("kontakt.poleTelefon"), { typ: "tel" })}
          </div>
          ${pole("typ", t("kontakt.poleTyp"), { moznosti: [
            ["poptavka", t("kontakt.typPoptavka")], ["obhlidka", t("kontakt.typObhlidka")],
            ["kariera", t("kontakt.typKariera")], ["jine", t("kontakt.typJine")]] })}
          ${pole("zprava", t("kontakt.poleZprava"), { radku: 5, povinne: true })}
          ${prilohy(ctx)}
          ${souhlas("souhlas", t("kontakt.poleSouhlas"))}
          <button class="tl tl--signal" type="submit">${esc(t("kontakt.odeslat"))}</button>
          <p class="hlaska" data-hotovo hidden style="margin-top:1rem">${esc(t("kontakt.odeslano"))}</p>
        </form>
      </div>
    </div></section>`,
  ].join("\n");
}

export function oUkazce(ctx) {
  const { t, odkaz, site } = ctx;
  const skutecne = [
    "Název, IČO, DIČ, sídlo, datum vzniku, jednatel a spisová značka — z veřejného rejstříku (ARES).",
    "Popis toho, co firma montuje a co naopak nedělá — podle zadání od klienta.",
  ];
  const smyslene = [
    "Všech osm staveb včetně čísel, termínů a rolí. Žádná z nich neproběhla.",
    "Všechny recenze i jejich autoři.",
    "Údaje „24 montérů“ a podobná čísla v přehledu.",
    "Otevřené pozice v sekci Kariéra.",
    "Telefon (je uvedený jako XXX) a e-mailové adresy — doména zatím neexistuje.",
  ];
  return [
    hlavicka(ctx, {
      stitek: "Ukázka", nadpis: "Co je v této ukázce skutečné a co ne",
      lead: "Tohle je návrh webu, ne ostrá prezentace firmy. Aby stránky vypadaly jako hotové, jsou v nich smyšlené reference i recenze. Tady je seznam, co je co.",
      drobecky: drobecky(ctx, [["uvod", t("nav.uvod")], ["x", "O ukázce"]]),
    }),
    `<section class="pas pas--tesny"><div class="obal mrizka mrizka--2">
      <div class="karta rohy prijezd">
        <span class="karta__cislo">Skutečné</span>
        <ul class="seznam seznam--fajfka" style="margin-top:.8rem">${skutecne.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      </div>
      <div class="karta rohy prijezd">
        <span class="karta__cislo">Smyšlené</span>
        <ul class="seznam seznam--krizek" style="margin-top:.8rem">${smyslene.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      </div>
    </div></section>`,
    `<section class="pas pas--tesny pas--linka"><div class="obal" style="max-width:62ch">
      <h2 style="font-size:1.4rem">Jak to nahradit skutečnými daty</h2>
      <p>Všechny texty, stavby i recenze se dají přepsat v <a href="${odkaz("administrace")}">demo administraci</a>.
      Změny se v ukázce ukládají jen do vašeho prohlížeče a dají se stáhnout jako soubor.
      V ostré verzi by se stejné rozhraní napojilo na server.</p>
      <p>Stránky se neindexují (<span class="mono male">noindex, nofollow</span>) a nemají odkaz z žádného veřejného webu.</p>
      ${razitko(ctx, { list: "99", meritko: "—" })}
    </div></section>`,
  ].join("\n");
}

export function soukromi(ctx) {
  const { t, site } = ctx;
  const f = site.firma; const a = f.adresa;
  return [
    hlavicka(ctx, {
      stitek: "Právní", nadpis: t("patka.ochranaUdaju"),
      lead: "Vzorový text pro ukázku. Před spuštěním webu ho projde váš právník.",
      drobecky: drobecky(ctx, [["uvod", t("nav.uvod")], ["x", t("patka.ochranaUdaju")]]),
    }),
    `<section class="pas pas--tesny"><div class="obal" style="max-width:68ch">
      <h2 style="font-size:1.3rem">Kdo údaje zpracovává</h2>
      <p>${esc(f.nazev)}, IČO ${esc(f.ico)}, se sídlem ${esc(a.ulice)}, ${esc(a.psc)} ${esc(a.mesto)}.</p>
      <h2 style="font-size:1.3rem">Jaké údaje a proč</h2>
      <p>Z formulářů zpracováváme jméno, e-mail, telefon a text zprávy — výhradně proto, abychom mohli odpovědět
      na poptávku nebo na reakci na inzerát. Údaje nepředáváme nikomu dalšímu a nepoužíváme je k rozesílání nabídek.</p>
      <h2 style="font-size:1.3rem">Jak dlouho</h2>
      <p>Poptávky uchováváme po dobu jednání a dále po dobu záruky u realizovaných zakázek. Nevyužité reakce na
      inzerát mažeme do šesti měsíců.</p>
      <h2 style="font-size:1.3rem">Vaše práva</h2>
      <p>Můžete nás kdykoli požádat o výpis, opravu nebo výmaz svých údajů na adrese
      <a href="mailto:${esc(site.kontakt.email)}">${esc(site.kontakt.email)}</a>.</p>
      <h2 style="font-size:1.3rem">Soubory cookie</h2>
      <p>Tento web nepoužívá žádné analytické ani reklamní cookie. Demo administrace si ukládá rozpracované
      změny do úložiště prohlížeče (localStorage) — data zůstávají ve vašem počítači.</p>
    </div></section>`,
  ].join("\n");
}

export function chyba404(ctx) {
  const { t, odkaz } = ctx;
  return `
  <section class="pas"><div class="obal" style="max-width:56ch;text-align:center">
    <p class="stitek" style="justify-content:center">404</p>
    <h1>${esc(t("chyba404.nadpis"))}</h1>
    <p class="lead" style="margin-inline:auto">${esc(t("chyba404.lead"))}</p>
    <div class="tlacitka" style="justify-content:center;margin-top:1.6rem">
      <a class="tl tl--signal" href="${odkaz("uvod")}">${esc(t("chyba404.cta"))}</a>
      <a class="tl tl--obrys" href="${odkaz("stavby")}">${esc(t("nav.stavby"))}</a>
    </div>
    <div style="margin-top:3rem;color:var(--cara);opacity:.5">${motivStavby("hala")}</div>
  </div></section>`;
}
