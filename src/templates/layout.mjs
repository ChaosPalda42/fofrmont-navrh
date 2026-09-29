/** Kostra stránky: hlavička, navigace, patička s výkresovým razítkem. */
import { esc, atr } from "./lib.mjs";
import { ikona } from "./ikony.mjs";
import { logo } from "./kresby.mjs";

export function navigace(ctx, aktivni) {
  const { t, odkaz, site } = ctx;
  const polozka = (id, popisek) => {
    const je = id === aktivni;
    return `<a href="${odkaz(id)}"${atr({ "aria-current": je ? "page" : null })}>${esc(popisek)}</a>`;
  };
  const rozbal = (klic, popisek, polozky, jeAktivni) => `
    <div class="navigace__vice" data-rozbal>
      <button type="button" aria-expanded="false"${atr({ style: jeAktivni ? "color:var(--cara)" : null })}>
        ${esc(popisek)}${ikona("sipkaDolu", { velikost: 13 })}
      </button>
      <div class="navigace__panel">${polypolozky(polozky)}</div>
    </div>`;
  const polypolozky = (polozky) => polozky.map(([id, p]) => polozka(id, p)).join("");

  const obory = site.obory.map((o) => [`obor-${o.slug}`, `${o.nazev} (${o.zkratka})`]);
  const jeObor = String(aktivni).startsWith("obor-") || aktivni === "montaze";
  return `
  <nav class="navigace" id="navigace" aria-label="${esc(t("nav.uvod"))}">
    ${rozbal("montaze", t("nav.montaze"), [["montaze", t("nav.montaze")], ...obory], jeObor)}
    ${polozka("narocne", t("nav.narocne"))}
    ${polozka("stavby", t("nav.stavby"))}
    ${polozka("recenze", t("nav.recenze"))}
    ${rozbal("prokoho", t("nav.prokoho"), [["b2b", t("nav.b2b")], ["b2c", t("nav.b2c")]],
      aktivni === "b2b" || aktivni === "b2c")}
    ${rozbal("vice", "Další", [
      ["jakPracujeme", t("nav.jakPracujeme")], ["kalkulacky", t("nav.kalkulacky")],
      ["oNas", t("nav.oNas")], ["kariera", t("nav.kariera")],
      ["dotazy", t("nav.dotazy")], ["kontakt", t("nav.kontakt")],
      ["administrace", t("nav.administrace")],
    ], ["jakPracujeme", "kalkulacky", "oNas", "kariera", "dotazy", "kontakt", "administrace"].includes(aktivni))}
    <div class="jazyky">
      ${["cs", "en"].map((kod) => (kod === ctx.jazyk
        ? `<span aria-current="true">${kod.toUpperCase()}</span>`
        : `<a href="${ctx.jazykOdkaz(kod)}" hreflang="${kod}">${kod.toUpperCase()}</a>`)).join("")}
    </div>
    <a class="tl tl--signal tl--maly lista__cta" href="${odkaz("poptavka")}" style="margin-left:.6rem">${esc(t("spolecne.cta"))}</a>
  </nav>`;
}

export function razitko(ctx, { list, meritko = "1 : 100" } = {}) {
  const { t, site } = ctx;
  const pole = [
    [t("spolecne.razitkoInvestor"), site.firma.nazev],
    [t("spolecne.razitkoProfese"), "VZT · ÚT · ZTI · CHL"],
    [t("spolecne.razitkoList"), list || "—"],
    [t("spolecne.razitkoMeritko"), meritko],
    [t("spolecne.razitkoStupen"), t("spolecne.razitkoStupenHodnota")],
    [t("spolecne.razitkoDatum"), ctx.datum],
    [t("spolecne.razitkoKreslil"), "byPalda"],
    ["IČO", site.firma.ico],
  ];
  return `<dl class="razitko">${pole.map(([k, v]) =>
    `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;
}

export function patka(ctx) {
  const { t, odkaz, site } = ctx;
  const a = site.firma.adresa;
  const odkazy = [["montaze", t("nav.montaze")], ["narocne", t("nav.narocne")], ["stavby", t("nav.stavby")],
    ["recenze", t("nav.recenze")], ["jakPracujeme", t("nav.jakPracujeme")], ["kalkulacky", t("nav.kalkulacky")]];
  const odkazy2 = [["b2b", t("nav.b2b")], ["b2c", t("nav.b2c")], ["oNas", t("nav.oNas")],
    ["kariera", t("nav.kariera")], ["dotazy", t("nav.dotazy")], ["kontakt", t("nav.kontakt")]];
  const sloupec = (nadpis, polozky) => `
    <div><h3>${esc(nadpis)}</h3><ul class="patka__seznam">
      ${polozky.map(([id, p]) => `<li><a href="${odkaz(id)}">${esc(p)}</a></li>`).join("")}
    </ul></div>`;
  return `
  <footer class="patka">
    <div class="obal">
      ${razitko(ctx, { list: "00" })}
      <div class="patka__mrizka">
        <div>
          <h3>${esc(t("patka.oNasNadpis"))}</h3>
          <p style="font-size:.92rem;color:#9fb4cc;max-width:32ch">${esc(t("patka.oNasText"))}</p>
        </div>
        ${sloupec(t("patka.navigaceNadpis"), odkazy)}
        ${sloupec(t("patka.navigaceNadpis2"), odkazy2)}
        <div>
          <h3>${esc(t("patka.kontaktNadpis"))}</h3>
          <ul class="patka__seznam">
            <li>${esc(site.kontakt.telefon)}</li>
            <li><a href="mailto:${esc(site.kontakt.email)}">${esc(site.kontakt.email)}</a></li>
            <li style="margin-top:.5rem">${esc(a.ulice)}<br>${esc(a.psc)} ${esc(a.mesto)}</li>
            <li style="color:#7f9bbb">IČO ${esc(site.firma.ico)} · DIČ ${esc(site.firma.dic)}</li>
          </ul>
        </div>
      </div>
      <div class="patka__spodek">
        <span>${esc(t("patka.copyright").replace("{rok}", ctx.rok))}</span>
        <span><a href="${odkaz("ukazka")}">${esc(t("patka.ukazkaPozn"))}</a></span>
      </div>
    </div>
  </footer>`;
}

export function stranka(ctx, { titulek, popis, aktivni, obsah, telo = "" }) {
  const { t, odkaz, asset } = ctx;
  const celyTitulek = titulek ? `${titulek} — ${t("meta.pripona")}` : t("meta.titulek");
  return `<!doctype html>
<html lang="${ctx.jazyk}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(celyTitulek)}</title>
<meta name="description" content="${esc(popis || t("meta.popis"))}">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0b1a2d">
<link rel="icon" href="${asset("favicon.svg")}" type="image/svg+xml">
<link rel="stylesheet" href="${asset("style.css")}">
</head>
<body${telo}>
<a class="preskocit" href="#obsah">Přeskočit na obsah</a>
<div class="rastr" aria-hidden="true"></div>
<div class="rastr-svit" aria-hidden="true"></div>
<div class="rastr-snap" aria-hidden="true"></div>
<div class="ukazka">${esc(t("spolecne.ukazka"))} <a href="${odkaz("ukazka")}">${esc(t("spolecne.ukazkaOdkaz"))}</a></div>
<header class="lista">
  <div class="obal lista__obal">
    <a class="znacka" href="${odkaz("uvod")}">
      ${logo()}
      <span><span class="znacka__text">FOFR<span>MONT</span></span>
      <span class="znacka__pod">montáže TZB · Praha</span></span>
    </a>
    <button class="hamburger" type="button" aria-label="Menu" aria-controls="navigace" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    ${navigace(ctx, aktivni)}
  </div>
</header>
<div class="merit" aria-hidden="true"><i></i></div>
<main id="obsah">
${obsah}
</main>
${patka(ctx)}
<script src="${asset("app.js")}" defer></script>
</body>
</html>`;
}
