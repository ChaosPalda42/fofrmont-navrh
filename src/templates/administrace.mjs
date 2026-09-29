/** Demo administrace — kostra. Obsah panelů dosazuje assets/admin.js. */
import { esc } from "./lib.mjs";
import { ikona } from "./ikony.mjs";
import { hlavicka, drobecky } from "./casti.mjs";

export function administrace(ctx) {
  const { t } = ctx;
  const zalozky = [
    ["prehled", t("administrace.zalozkaPrehled")],
    ["texty", t("administrace.zalozkaTexty")],
    ["recenze", t("administrace.zalozkaRecenze")],
    ["stavby", t("administrace.zalozkaStavby")],
    ["poptavky", t("administrace.zalozkaPoptavky")],
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
