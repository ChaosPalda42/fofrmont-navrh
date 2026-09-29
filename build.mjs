/** Sestavení statického webu do out/. Node 24, bez závislostí. */
import { readFile, writeFile, mkdir, rm, cp, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

import { esc, datumCs, datumEn } from "./src/templates/lib.mjs";
import { stranka } from "./src/templates/layout.mjs";
import * as S1 from "./src/templates/stranky.mjs";
import * as S2 from "./src/templates/stranky2.mjs";
import * as S3 from "./src/templates/stranky3.mjs";
import { administrace } from "./src/templates/administrace.mjs";

const KOREN = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(KOREN, "out");
const JAZYKY = ["cs", "en"];

const SOUBORY = {
  uvod: "index.html", montaze: "co-montujeme.html", narocne: "narocne-prostory.html",
  jakPracujeme: "jak-pracujeme.html", b2b: "pro-generalni-dodavatele.html", b2c: "pro-domacnosti.html",
  stavby: "stavby.html", recenze: "recenze.html", poptavka: "poptavka.html",
  kalkulacky: "orientacni-vypocty.html", oNas: "o-firme.html", kariera: "kariera.html",
  dotazy: "caste-dotazy.html", kontakt: "kontakt.html", administrace: "administrace.html",
  ukazka: "o-ukazce.html", soukromi: "ochrana-udaju.html", chyba404: "404.html",
  prokoho: "pro-generalni-dodavatele.html", vice: "o-firme.html",
};

function ctxProJazyk(jazyk, data, otisky) {
  const { site, obsah } = data;
  const slovnik = obsah[jazyk];
  const zaskok = obsah.cs;
  const cest = (o, cesta) => cesta.split(".").reduce((u, k) => (u && typeof u === "object" ? u[k] : undefined), o);
  const t = (cesta) => {
    const v = cest(slovnik, cesta);
    if (v !== undefined && v !== null && v !== "") return v;
    const z = cest(zaskok, cesta);
    return z === undefined || z === null ? cesta : z;
  };
  const prefix = jazyk === "cs" ? "" : "../";
  const souborProId = (id) => {
    if (id.startsWith("obor-")) return `montaz-${id.slice(5)}.html`;
    if (id.startsWith("stavba-")) return `stavba-${id.slice(7)}.html`;
    return SOUBORY[id] || "index.html";
  };
  return {
    jazyk, site, t, obsah: slovnik,
    datum: "30. 9. 2026", rok: 2026,
    datumText: jazyk === "cs" ? datumCs : datumEn,
    odkaz: (id) => souborProId(id),
    soubor: "index.html",
    jazykOdkaz(cil) {
      if (cil === jazyk) return "#";
      return cil === "cs" ? `../${this.soubor}` : `en/${this.soubor}`;
    },
    asset: (jmeno) => `${prefix}assets/${jmeno}${otisky[jmeno] ? `?v=${otisky[jmeno]}` : ""}`,
  };
}

function nazevExportu(zdroj) {
  const jmena = new Set();
  const re = /export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g;
  let m;
  while ((m = re.exec(zdroj))) jmena.add(m[1]);
  return [...jmena];
}

/** Moduly z src/lib se sesypou do jednoho klasického skriptu pod globální FM.<modul>. */
async function svazekKnihoven() {
  const dir = path.join(KOREN, "src", "lib");
  const soubory = (await readdir(dir)).filter((f) => f.endsWith(".mjs")).sort();
  const kusy = [];
  for (const soubor of soubory) {
    const zdroj = await readFile(path.join(dir, soubor), "utf8");
    const jmena = nazevExportu(zdroj);
    const telo = zdroj.replace(/^\s*export\s+(?=(?:async\s+)?(?:function|const|let|var|class)\s)/gm, "");
    kusy.push(`FM.${soubor.replace(/\.mjs$/, "").replace(/-/g, "_")} = (function () {\n${telo}\nreturn { ${jmena.join(", ")} };\n})();`);
  }
  return `(function (global) {\n"use strict";\nvar FM = global.FM = global.FM || {};\n${kusy.join("\n")}\n})(typeof window !== "undefined" ? window : globalThis);\n`;
}

async function spojSoubory(cesty) {
  const kusy = [];
  for (const c of cesty) kusy.push(await readFile(path.join(KOREN, c), "utf8"));
  return kusy.join("\n");
}

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<rect width="32" height="32" rx="4" fill="#0b1a2d"/>
<path d="M7 24V13.5A3.5 3.5 0 0 1 10.5 10H25" fill="none" stroke="#6fd3ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="25" cy="10" r="3" fill="#ff6a1f"/></svg>`;

async function main() {
  const site = JSON.parse(await readFile(path.join(KOREN, "data/site.json"), "utf8"));
  const obsah = { cs: JSON.parse(await readFile(path.join(KOREN, "data/content/cs.json"), "utf8")) };
  for (const j of JAZYKY.slice(1)) {
    const cesta = path.join(KOREN, `data/content/${j}.json`);
    obsah[j] = existsSync(cesta) ? JSON.parse(await readFile(cesta, "utf8")) : {};
  }

  await rm(OUT, { recursive: true, force: true });
  await mkdir(path.join(OUT, "assets", "fonts"), { recursive: true });
  await mkdir(path.join(OUT, "en"), { recursive: true });

  const app = [await svazekKnihoven(), await spojSoubory(["src/ui/web.js"])].join("\n");
  const admin = await spojSoubory(["src/ui/admin.js"]);
  const css = await readFile(path.join(KOREN, "src/assets/style.css"), "utf8");
  const otisk = (s) => createHash("sha1").update(s).digest("hex").slice(0, 8);
  const otisky = { "style.css": otisk(css), "app.js": otisk(app), "admin.js": otisk(admin) };

  await writeFile(path.join(OUT, "assets/style.css"), css);
  await writeFile(path.join(OUT, "assets/app.js"), app);
  await writeFile(path.join(OUT, "assets/admin.js"), admin);
  await writeFile(path.join(OUT, "assets/favicon.svg"), FAVICON);
  await cp(path.join(KOREN, "src/assets/fonts"), path.join(OUT, "assets/fonts"), { recursive: true });
  await writeFile(path.join(OUT, "robots.txt"), "User-agent: *\nDisallow: /\n");
  await writeFile(path.join(OUT, ".nojekyll"), "");

  let pocet = 0;
  for (const jazyk of JAZYKY) {
    const ctx = ctxProJazyk(jazyk, { site, obsah }, otisky);
    const slozka = jazyk === "cs" ? OUT : path.join(OUT, jazyk);
    const zapis = async (id, html) => {
      const soubor = ctx.odkaz(id);
      await writeFile(path.join(slozka, soubor), html);
      pocet += 1;
    };
    const uloz = (id, titulek, popis, aktivni, obsahFn, telo = "") => {
      ctx.soubor = ctx.odkaz(id);
      const obsahStranky = typeof obsahFn === "function" ? obsahFn() : obsahFn;
      return zapis(id, stranka(ctx, { titulek, popis, aktivni, obsah: obsahStranky, telo }));
    };

    const t = ctx.t;
    await uloz("uvod", "", t("meta.popis"), "uvod", () => S1.uvod(ctx));
    await uloz("montaze", t("montaze.nadpis"), t("montaze.lead"), "montaze", () => S1.montaze(ctx));
    for (const obor of site.obory) {
      await uloz(`obor-${obor.slug}`, obor.nazev, obor.perex, `obor-${obor.slug}`, () => S1.oborDetail(ctx, obor));
    }
    await uloz("narocne", t("narocne.nadpis"), t("narocne.lead"), "narocne", () => S1.narocne(ctx));
    await uloz("jakPracujeme", t("jakPracujeme.nadpis"), t("jakPracujeme.lead"), "jakPracujeme", () => S1.jakPracujeme(ctx));
    await uloz("b2b", t("b2b.nadpis"), t("b2b.lead"), "b2b", () => S1.b2b(ctx));
    await uloz("b2c", t("b2c.nadpis"), t("b2c.lead"), "b2c", () => S1.b2c(ctx));
    await uloz("stavby", t("stavby.nadpis"), t("stavby.lead"), "stavby", () => S2.stavby(ctx));
    for (const s of site.stavby) {
      await uloz(`stavba-${s.id}`, s.nazev, s.perex, "stavby", () => S2.stavbaDetail(ctx, s));
    }
    await uloz("recenze", t("recenze.nadpis"), t("recenze.lead"), "recenze", () => S2.recenze(ctx));
    await uloz("poptavka", t("poptavka.nadpis"), t("poptavka.lead"), "poptavka", () => S2.poptavka(ctx));
    await uloz("kalkulacky", t("kalkulacky.nadpis"), t("kalkulacky.lead"), "kalkulacky", () => S2.kalkulacky(ctx));
    await uloz("oNas", t("oNas.nadpis"), t("oNas.lead"), "oNas", () => S3.oNas(ctx));
    await uloz("kariera", t("kariera.nadpis"), t("kariera.lead"), "kariera", () => S3.kariera(ctx));
    await uloz("dotazy", t("dotazy.nadpis"), t("dotazy.lead"), "dotazy", () => S3.dotazy(ctx));
    await uloz("kontakt", t("kontakt.nadpis"), t("kontakt.lead"), "kontakt", () => S3.kontakt(ctx));
    await uloz("ukazka", "O ukázce", "Co je v ukázce skutečné a co smyšlené.", "ukazka", () => S3.oUkazce(ctx));
    await uloz("soukromi", t("patka.ochranaUdaju"), "", "soukromi", () => S3.soukromi(ctx));
    await uloz("chyba404", t("chyba404.nadpis"), "", "404", () => S3.chyba404(ctx));
    ctx.soubor = ctx.odkaz("administrace");
    await zapis("administrace", stranka(ctx, {
      titulek: t("administrace.nadpis"), popis: t("administrace.lead"), aktivni: "administrace",
      obsah: administrace(ctx),
    }).replace("</body>", `<script src="${ctx.asset("admin.js")}" defer></script>\n</body>`));
  }
  console.log(`hotovo: ${pocet} stránek v out/`);
}

main().catch((e) => { console.error(e); process.exit(1); });
