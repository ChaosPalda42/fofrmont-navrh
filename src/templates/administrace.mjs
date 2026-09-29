/** Demo administrace — kostra. Obsah panelů dosazuje assets/admin.js. */
import { esc } from "./lib.mjs";
import { ikona } from "./ikony.mjs";
import { hlavicka, drobecky } from "./casti.mjs";

export function administrace(ctx) {
  const { t } = ctx;
  const zalozky = [
    ["prehled", t("administrace.zalozkaPrehled")],
    ["statistiky", t("administrace.zalozkaStatistiky")],
    ["texty", t("administrace.zalozkaTexty")],
    ["recenze", t("administrace.zalozkaRecenze")],
    ["stavby", t("administrace.zalozkaStavby")],
    ["poptavky", t("administrace.zalozkaPoptavky")],
    ["nastaveni", t("administrace.zalozkaNastaveni")],
    ["data", t("administrace.zalozkaData")],
  ];
  return [
    hlavicka(ctx, {
      stitek: t("administrace.stitek"), nadpis: t("administrace.nadpis"), lead: t("administrace.lead"),
      drobecky: drobecky(ctx, [["uvod", t("nav.uvod")], ["administrace", t("nav.administrace")]]),
    }),
    `<section class="pas pas--tesny"><div class="obal">
      <script type="application/json" id="zaklad-dat">${JSON.stringify({
        jazyk: ctx.jazyk,
        texty: ctx.obsah,
        recenze: ctx.site.recenze,
        stavby: ctx.site.stavby.map((s) => ({ id: s.id, nazev: s.nazev, misto: s.misto, kraj: s.kraj,
          segment: s.segment, obory: s.obory, rok: s.rok, datum: s.datum, rozsah: s.rozsah, perex: s.perex })),
        obory: ctx.site.obory.map((o) => ({ id: o.id, nazev: o.nazev })),
        motivy: ["saly", "terminal", "hala", "vila", "skola", "administrativa", "pamatka", "serverovna"],
        dnes: ctx.dnesIso,
        statStranky: [
          { nazev: t("nav.uvod"), cesta: ctx.odkaz("uvod"), vaha: 100 },
          { nazev: t("nav.stavby"), cesta: ctx.odkaz("stavby"), vaha: 46 },
          { nazev: t("narocne.nadpis"), cesta: ctx.odkaz("narocne"), vaha: 38 },
          { nazev: t("nav.kontakt"), cesta: ctx.odkaz("kontakt"), vaha: 31 },
          { nazev: t("nav.montaze"), cesta: ctx.odkaz("montaze"), vaha: 27 },
          { nazev: t("nav.recenze"), cesta: ctx.odkaz("recenze"), vaha: 22 },
          { nazev: t("nav.poptavka"), cesta: ctx.odkaz("poptavka"), vaha: 18 },
          { nazev: t("nav.kalkulacky"), cesta: ctx.odkaz("kalkulacky"), vaha: 12 },
        ],
        statZdroje: [
          { id: t("administrace.zdrojVyhledavace"), podil: 46 },
          { id: t("administrace.zdrojPrimo"), podil: 27 },
          { id: t("administrace.zdrojOdkazy"), podil: 14 },
          { id: t("administrace.zdrojSite"), podil: 9 },
          { id: t("administrace.zdrojEmail"), podil: 4 },
        ],
        statZarizeni: [
          { id: t("administrace.zarizeniMobil"), podil: 58 },
          { id: t("administrace.zarizeniPocitac"), podil: 36 },
          { id: t("administrace.zarizeniTablet"), podil: 6 },
        ],
        kontakt: {
          "kontakt.telefon": ctx.site.kontakt.telefon,
          "kontakt.email": ctx.site.kontakt.email,
          "kontakt.ulice": ctx.site.firma.adresa.ulice,
          "kontakt.psc": ctx.site.firma.adresa.psc,
          "kontakt.mesto": ctx.site.firma.adresa.mesto,
          "kontakt.provozniDoba": ctx.site.kontakt.provozniDoba,
        },
        hlasky: {
          stavSchvalena: t("administrace.stavSchvalena"), stavCeka: t("administrace.stavCeka"),
          stavSkryta: t("administrace.stavSkryta"), schvalit: t("administrace.schvalit"),
          skryt: t("administrace.skryt"), smazat: t("administrace.smazat"),
          ulozit: t("administrace.ulozit"), zrusit: t("administrace.zrusit"),
          pridatStavbu: t("administrace.pridatStavbu"), ulozeno: t("administrace.ulozeno"),
          textyLead: t("administrace.textyLead"), textyHledat: t("administrace.textyHledat"),
          textyVratit: t("administrace.textyVratit"), recenzeLead: t("administrace.recenzeLead"),
          stavbyLead: t("administrace.stavbyLead"), poptavkyLead: t("administrace.poptavkyLead"),
          poptavkyPrazdno: t("administrace.poptavkyPrazdno"), oznacitPrectene: t("administrace.oznacitPrectene"),
          dataLead: t("administrace.dataLead"), exportovat: t("administrace.exportovat"),
          importovat: t("administrace.importovat"), vymazat: t("administrace.vymazat"),
          vymazatPotvrzeni: t("administrace.vymazatPotvrzeni"),
          prehledRecenzeCeka: t("administrace.prehledRecenzeCeka"), prehledPoptavky: t("administrace.prehledPoptavky"),
          prehledStavby: t("administrace.prehledStavby"), prehledTexty: t("administrace.prehledTexty"),
          zalozkaNastaveni: t("administrace.zalozkaNastaveni"), nastaveniLead: t("administrace.nastaveniLead"),
          nastaveniTelefon: t("administrace.nastaveniTelefon"), nastaveniEmail: t("administrace.nastaveniEmail"),
          nastaveniUlice: t("administrace.nastaveniUlice"), nastaveniPsc: t("administrace.nastaveniPsc"),
          nastaveniMesto: t("administrace.nastaveniMesto"), nastaveniProvozniDoba: t("administrace.nastaveniProvozniDoba"),
          prehledVitejte: t("administrace.prehledVitejte"), prehledPopis: t("administrace.prehledPopis"),
          prehledPosledni: t("administrace.prehledPosledni"), prehledCekaji: t("administrace.prehledCekaji"),
          prehledNic: t("administrace.prehledNic"), prehledOstra: t("administrace.prehledOstra"),
          prehledOstraBody: t("administrace.prehledOstraBody"),
          textyJazyk: t("administrace.textyJazyk"), textySekce: t("administrace.textySekce"),
          textyVse: t("administrace.textyVse"), textyPocet: t("administrace.textyPocet"),
          recenzeFiltr: t("administrace.recenzeFiltr"), recenzeVse: t("administrace.recenzeVse"),
          poptavkyVsePrectene: t("administrace.poptavkyVsePrectene"),
          stavbyMotiv: t("administrace.stavbyMotiv"), stavbySegment: t("administrace.stavbySegment"),
          stavbyPerex: t("administrace.stavbyPerex"), stavbyZadani: t("administrace.stavbyZadani"),
          stavbyTrvani: t("administrace.stavbyTrvani"), stavbyRole: t("administrace.stavbyRole"),
          statLead: t("administrace.statLead"), statObdobi: t("administrace.statObdobi"),
          statObdobi7: t("administrace.statObdobi7"), statObdobi30: t("administrace.statObdobi30"),
          statObdobi90: t("administrace.statObdobi90"),
          statNavstevy: t("administrace.statNavstevy"), statUzivatele: t("administrace.statUzivatele"),
          statZobrazeni: t("administrace.statZobrazeni"), statDelka: t("administrace.statDelka"),
          statOpusteni: t("administrace.statOpusteni"), statPoptavky: t("administrace.statPoptavky"),
          statOprotiMinule: t("administrace.statOprotiMinule"), statGrafNadpis: t("administrace.statGrafNadpis"),
          statGrafPoptavky: t("administrace.statGrafPoptavky"), statZdroje: t("administrace.statZdroje"),
          statZarizeni: t("administrace.statZarizeni"), statStranky: t("administrace.statStranky"),
          statStranka: t("administrace.statStranka"), statZobrazeniSloupec: t("administrace.statZobrazeniSloupec"),
          statZive: t("administrace.statZive"), statPoznamka: t("administrace.statPoznamka"),
        },
      }).replace(/</g, "\\u003c")}</script>
      <div class="karta rohy" data-prihlaseni style="max-width:34rem">
        <span class="karta__cislo">${esc(t("administrace.prihlaseni"))}</span>
        <p class="male tise" style="margin:.7rem 0 1.1rem">${esc(t("administrace.prihlaseniLead"))}</p>
        <button class="tl tl--signal" type="button" data-vstoupit>${esc(t("administrace.vstoupit"))} ${ikona("sipka", { velikost: 16 })}</button>
      </div>

      <div class="admin" data-admin hidden>
        <div class="admin__zalozky" role="tablist">
          ${zalozky.map(([id, popisek], i) => `
            <button type="button" role="tab" data-zalozka="${esc(id)}" aria-selected="${i === 0 ? "true" : "false"}">
              <span>${esc(popisek)}</span><span class="odznak" data-odznak="${esc(id)}" hidden>0</span>
            </button>`).join("")}
          <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--cara-3)">
            <p class="mono male tise" data-ulozeno style="margin:0"></p>
          </div>
        </div>
        <div class="admin__panel">
          ${zalozky.map(([id], i) => `<div data-panel="${esc(id)}"${i ? " hidden" : ""}></div>`).join("")}
        </div>
      </div>
    </div></section>`,
  ].join("\n");
}
