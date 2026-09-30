/* Demo administrace. Stav drží FM.administrace, ukládá se do localStorage. */
(function () {
  "use strict";
  var FM = window.FM || {};
  if (!FM.administrace) return;
  var A = FM.administrace;
  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };
  var esc = function (v) {
    return String(v === undefined || v === null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };

  var uzel = $("#zaklad-dat");
  if (!uzel) return;
  var Z = JSON.parse(uzel.textContent);
  var H = Z.hlasky;
  var ploche = FM.i18n ? FM.i18n.flatten(Z.texty) : {};
  var uloziste = window.localStorage;
  var stav = A.nacti(uloziste);

  function uloz() {
    stav = A.uloz(uloziste, stav);
    var el = $("[data-ulozeno]");
    if (el) el.textContent = H.ulozeno + " " + new Date().toLocaleTimeString("cs-CZ");
    vykresliOdznaky();
  }

  /** Kolik textů je přepsaných. Pomocná zásoba původních znění (_zaklad) se nepočítá. */
  function pocetZmenenychTextu() {
    return Object.keys(stav.texty || {}).filter(function (jazyk) { return jazyk !== "_zaklad"; })
      .reduce(function (soucet, jazyk) { return soucet + Object.keys(stav.texty[jazyk] || {}).length; }, 0);
  }

  function vykresliOdznaky() {
    var s = A.statistiky(stav, Z.recenze, Z.stavby);
    s.textyZmeneno = pocetZmenenychTextu();
    var nastav = function (id, hodnota) {
      var el = $("[data-odznak='" + id + "']");
      if (!el) return;
      el.hidden = !hodnota;
      el.textContent = hodnota;
    };
    nastav("recenze", s.recenzeCeka);
    nastav("poptavky", s.poptavkyNeprectene);
    nastav("texty", s.textyZmeneno);
    return s;
  }


  /* ---------- statistiky návštěvnosti (ukázková data) ---------- */
  var statObdobi = 30;
  var statRada = null;

  function statistiky(panel) {
    if (!FM.statistiky) { panel.innerHTML = "<p class='prazdno'>Statistiky nejsou k dispozici.</p>"; return; }
    var S = FM.statistiky;
    if (!statRada) statRada = S.generuj(20260930, 120, Z.dnes || "2026-09-30");

    var vyrez = S.vyrez(statRada, statObdobi);
    var porovnani = S.porovnani(statRada, statObdobi);
    var souhrn = S.souhrn(vyrez);
    var delka = 96 + (statObdobi % 7) * 11;
    var opusteni = 42 - Math.round(statObdobi / 30);
    var zive = 1 + (souhrn.navstevy % 5);

    var cislo = function (v) { return FM.vypocty ? FM.vypocty.formatujCislo(v) : String(v); };
    var zmenaHtml = function (z) {
      var smer = z > 0 ? "nahoru" : z < 0 ? "dolu" : "stejne";
      var sipka = z > 0 ? "▲" : z < 0 ? "▼" : "–";
      return "<span class='stat-zmena' data-smer='" + smer + "'>" + sipka + " " + Math.abs(z)
        + " % <span class='tise'>" + esc(H.statOprotiMinule) + "</span></span>";
    };
    var dlazdice = function (hodnota, popis, zmena) {
      return "<div class='karta rohy'><div class='stat-cislo'>" + hodnota + "</div>"
        + "<div class='stat-popis'>" + esc(popis) + "</div>"
        + (zmena === null ? "" : zmenaHtml(zmena)) + "</div>";
    };
    var obdobiTlacitko = function (dnu, popisek) {
      return "<button type='button' class='chip' data-obdobi='" + dnu + "' aria-pressed='"
        + (statObdobi === dnu) + "'>" + esc(popisek) + "</button>";
    };

    // --- graf návštěv: plocha + čára, pod ním sloupce poptávek (sdílená osa) ---
    var W = 640, H1 = 150, H2 = 44;
    var k = S.krivka(vyrez, "navstevy", W, H1);
    var osa = S.osa(vyrez, Math.min(6, vyrez.length));
    var maxPoptavek = Math.max(1, vyrez.reduce(function (m, d) { return Math.max(m, d.poptavky); }, 0));
    var sirkaSloupce = Math.max(2, Math.min(9, (W / Math.max(1, vyrez.length)) * 0.55));
    var sloupce = vyrez.map(function (d, i) {
      var x = vyrez.length === 1 ? 0 : (i / (vyrez.length - 1)) * W;
      var v = (d.poptavky / maxPoptavek) * H2;
      return "<rect class='graf-sloupec' x='" + (x - sirkaSloupce / 2).toFixed(1) + "' y='" + (H2 - v).toFixed(1)
        + "' width='" + sirkaSloupce.toFixed(1) + "' height='" + Math.max(0, v).toFixed(1) + "' rx='1.5'/>";
    }).join("");
    var mrizka = [0, 0.5, 1].map(function (podil) {
      var y = (H1 * podil).toFixed(1);
      return "<line class='graf-mrizka' x1='0' y1='" + y + "' x2='" + W + "' y2='" + y + "'/>";
    }).join("");
    var popiskyOsy = osa.map(function (o) {
      var x = vyrez.length === 1 ? 0 : (o.index / (vyrez.length - 1)) * W;
      var kotva = o.index === 0 ? "start" : o.index === vyrez.length - 1 ? "end" : "middle";
      return "<text class='graf-osa' x='" + x.toFixed(1) + "' y='" + (H1 + 14) + "' text-anchor='" + kotva + "'>"
        + esc(o.datum.slice(8) + ". " + Number(o.datum.slice(5, 7)) + ".") + "</text>";
    }).join("");

    panel.innerHTML = "<p class='male tise'>" + esc(H.statLead) + "</p>"
      + "<div class='stat-hlavicka'>"
      + "<div class='filtry' style='margin:0'><span class='mono male tise'>" + esc(H.statObdobi) + "</span>"
      + obdobiTlacitko(7, H.statObdobi7) + obdobiTlacitko(30, H.statObdobi30) + obdobiTlacitko(90, H.statObdobi90)
      + "</div>"
      + "<span class='stat-zive'><i></i>" + esc(String(H.statZive).replace("{pocet}", String(zive))) + "</span>"
      + "</div>"
      + "<div class='stat-dlazdice'>"
      + dlazdice(cislo(porovnani.navstevy.hodnota), H.statNavstevy, porovnani.navstevy.zmena)
      + dlazdice(cislo(porovnani.uzivatele.hodnota), H.statUzivatele, porovnani.uzivatele.zmena)
      + dlazdice(cislo(porovnani.zobrazeni.hodnota), H.statZobrazeni, porovnani.zobrazeni.zmena)
      + dlazdice(S.formatujTrvani(delka), H.statDelka, null)
      + dlazdice(opusteni + " %", H.statOpusteni, null)
      + dlazdice(cislo(porovnani.poptavky.hodnota), H.statPoptavky, porovnani.poptavky.zmena)
      + "</div>"

      + "<div class='karta rohy' style='margin-bottom:1.2rem'>"
      + "<h3 style='font-size:1rem;margin-bottom:.9rem'>" + esc(H.statGrafNadpis) + "</h3>"
      + "<div class='graf' data-graf>"
      + "<svg viewBox='0 0 " + W + " " + (H1 + 22) + "' preserveAspectRatio='none' role='img' aria-label='"
      + esc(H.statGrafNadpis) + "'>" + mrizka
      + "<path class='graf-plocha' d='" + k.plocha + "'/><path class='graf-cara' d='" + k.cesta + "'/>"
      + "<line class='graf-kriz' data-kriz y1='0' y2='" + H1 + "' x1='0' x2='0'/>"
      + "<circle class='graf-bod' data-bod r='4' cx='-99' cy='-99' style='opacity:0'/>"
      + "<rect class='graf-plocha-dotyku' x='0' y='0' width='" + W + "' height='" + (H1 + 22) + "' data-plocha/>"
      + popiskyOsy + "</svg>"
      + "<div class='graf-bublina' data-bublina></div></div>"
      + "<h3 style='font-size:.9rem;margin:1.1rem 0 .5rem;color:var(--sedy)'>" + esc(H.statGrafPoptavky) + "</h3>"
      + "<svg viewBox='0 0 " + W + " " + H2 + "' preserveAspectRatio='none' role='img' aria-label='"
      + esc(H.statGrafPoptavky) + "' style='width:100%;height:" + H2 + "px'>" + sloupce + "</svg>"
      + "</div>"

      + "<div class='mrizka mrizka--2' style='margin-bottom:1.2rem'>"
      + "<div class='karta rohy'><h3 style='font-size:1rem;margin-bottom:.9rem'>" + esc(H.statZdroje) + "</h3>"
      + (Z.statZdroje || []).map(function (z) {
        return "<div class='stat-pruh'><span>" + esc(z.id) + "</span>"
          + "<span class='stat-pruh__drazka'><i style='--podil:" + z.podil + "%'></i></span>"
          + "<span class='stat-pruh__hodnota'>" + cislo(Math.round(souhrn.navstevy * z.podil / 100))
          + " · " + z.podil + " %</span></div>";
      }).join("") + "</div>"
      + "<div class='karta rohy'><h3 style='font-size:1rem;margin-bottom:.9rem'>" + esc(H.statZarizeni) + "</h3>"
      + (Z.statZarizeni || []).map(function (z) {
        return "<div class='stat-pruh'><span>" + esc(z.id) + "</span>"
          + "<span class='stat-pruh__drazka'><i style='--podil:" + z.podil + "%'></i></span>"
          + "<span class='stat-pruh__hodnota'>" + z.podil + " %</span></div>";
      }).join("") + "</div></div>"

      + "<div class='karta rohy'><h3 style='font-size:1rem;margin-bottom:.9rem'>" + esc(H.statStranky) + "</h3>"
      + "<div class='posuvne'><table class='stat-tabulka'><thead><tr><th>" + esc(H.statStranka)
      + "</th><th></th><th>" + esc(H.statZobrazeniSloupec) + "</th></tr></thead><tbody>"
      + (function () {
        var celkem = (Z.statStranky || []).reduce(function (a, s) { return a + s.vaha; }, 0) || 1;
        return (Z.statStranky || []).map(function (s) {
          var zobrazeni = Math.round(souhrn.zobrazeni * s.vaha / celkem);
          var podil = Math.round(s.vaha / (Z.statStranky[0].vaha || 1) * 100);
          return "<tr><td>" + esc(s.nazev) + "<br><span class='mono male tise'>" + esc(s.cesta) + "</span></td>"
            + "<td style='width:40%'><span class='stat-pruh__drazka'><i style='--podil:" + podil + "%'></i></span></td>"
            + "<td>" + cislo(zobrazeni) + "</td></tr>";
        }).join("");
      })() + "</tbody></table></div></div>"

      + "<p class='hlaska hlaska--info' style='margin-top:1.2rem'>" + esc(H.statPoznamka) + "</p>";

    $$("[data-obdobi]", panel).forEach(function (b) {
      b.addEventListener("click", function () { statObdobi = Number(b.dataset.obdobi); statistiky(panel); });
    });
    najedGraf(panel, vyrez, k, W, H1);
  }

  /** Nitkový kříž a bublina nad grafem návštěv. */
  function najedGraf(panel, rada, krivka, sirka, vyska) {
    var graf = $("[data-graf]", panel);
    if (!graf || !rada.length) return;
    var plocha = $("[data-plocha]", graf);
    var kriz = $("[data-kriz]", graf);
    var bod = $("[data-bod]", graf);
    var bublina = $("[data-bublina]", graf);
    var cislo = function (v) { return FM.vypocty ? FM.vypocty.formatujCislo(v) : String(v); };

    plocha.addEventListener("pointermove", function (e) {
      var r = graf.getBoundingClientRect();
      var podil = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      var i = Math.round(podil * (rada.length - 1));
      var den = rada[i];
      var b = krivka.body[i];
      graf.dataset.nad = "1";
      kriz.setAttribute("x1", b.x);
      kriz.setAttribute("x2", b.x);
      bod.setAttribute("cx", b.x);
      bod.setAttribute("cy", b.y);
      bod.style.opacity = "1";
      bublina.style.left = (b.x / sirka * 100) + "%";
      bublina.style.top = (b.y / (vyska + 22) * r.height) + "px";
      var tvar = FM.i18n && Array.isArray(H.statNavstevyTvary)
        ? FM.i18n.pocet(den.navstevy, H.statNavstevyTvary, Z.jazyk)
        : String(H.statNavstevy).toLowerCase();
      bublina.innerHTML = "<b>" + cislo(den.navstevy) + "</b> " + esc(tvar)
        + "<br><span class='tise'>" + esc(den.datum) + "</span>";
    });
    plocha.addEventListener("pointerleave", function () {
      graf.dataset.nad = "0";
      bod.style.opacity = "0";
    });
  }

  /* ---------- panely ---------- */
  function prehled(panel) {
    var st = A.statistiky(stav, Z.recenze, Z.stavby);
    st.textyZmeneno = pocetZmenenychTextu();
    var dlazdice = [
      [H.prehledRecenzeCeka, st.recenzeCeka], [H.prehledPoptavky, st.poptavkyNeprectene],
      [H.prehledStavby, st.stavbyCelkem], [H.prehledTexty, st.textyZmeneno],
    ];
    var cekajici = A.slozSeznam(stav, "recenze", Z.recenze).filter(function (r) { return r.stav === "ceka"; });
    var seznam = function (polozky, vykresli) {
      return polozky.length
        ? "<ul class='seznam' style='margin-top:.6rem'>" + polozky.slice(0, 3).map(vykresli).join("") + "</ul>"
        : "<p class='male tise' style='margin:.6rem 0 0'>" + esc(H.prehledNic) + "</p>";
    };
    panel.innerHTML = "<h2 style='font-size:1.3rem;margin-bottom:.3rem'>" + esc(H.prehledVitejte) + "</h2>"
      + "<p class='male tise' style='max-width:66ch'>" + esc(H.prehledPopis) + "</p>"
      + "<div class='mrizka mrizka--4' style='margin:1.4rem 0'>" + dlazdice.map(function (d) {
        return "<div class='karta rohy'><div class='udaj'><span class='udaj__cislo'>" + d[1]
          + "</span><span class='udaj__popis'>" + esc(d[0]) + "</span></div></div>";
      }).join("") + "</div>"
      + "<div class='mrizka mrizka--2'>"
      + "<div class='karta rohy'><span class='karta__cislo'>" + esc(H.prehledPosledni) + "</span>"
      + seznam(stav.poptavky, function (p) {
        return "<li><strong>" + esc(p.jmeno || "—") + "</strong> <span class='male tise'>"
          + esc(p.prijato || "") + "</span></li>";
      })
      + (stav.poptavky.length ? "<p style='margin:.9rem 0 0'><button class='tl tl--obrys tl--maly' type='button' data-jdi='poptavky'>"
        + esc(H.zalozkaPoptavky || "Poptávky") + " →</button></p>" : "")
      + "</div>"
      + "<div class='karta rohy'><span class='karta__cislo'>" + esc(H.prehledCekaji) + "</span>"
      + seznam(cekajici, function (r) {
        return "<li><strong>" + esc(r.jmeno) + "</strong> <span class='male tise'>" + esc(r.datum || "") + "</span></li>";
      })
      + (cekajici.length ? "<p style='margin:.9rem 0 0'><button class='tl tl--obrys tl--maly' type='button' data-jdi='recenze'>"
        + esc(H.schvalit) + " →</button></p>" : "")
      + "</div></div>"
      + "<div class='karta rohy' style='margin-top:1.4rem'><span class='karta__cislo'>" + esc(H.prehledOstra) + "</span>"
      + "<ul class='seznam' style='margin-top:.7rem'>"
      + (Array.isArray(H.prehledOstraBody) ? H.prehledOstraBody : []).map(function (b) {
        return "<li>" + esc(b) + "</li>";
      }).join("") + "</ul></div>";
    $$("[data-jdi]", panel).forEach(function (b) {
      b.addEventListener("click", function () {
        var cil = $("[data-zalozka='" + b.dataset.jdi + "']");
        if (cil) cil.click();
      });
    });
  }

  /* ---------- texty: rozdělené po stránkách ---------- */
  var textyOblast = null;
  var textyJazyk = null;

  /** Do které oblasti klíč patří (podle prvního segmentu). */
  function oblastKlice(klic) {
    var prvni = klic.split(".")[0];
    var nalezena = (Z.oblasti || []).filter(function (o) { return o.prefixy.indexOf(prvni) >= 0; })[0];
    return nalezena ? nalezena.id : "ostatni";
  }

  /** Lidský popisek pole místo technického klíče. */
  function popisekKlice(klic) {
    var presne = Z.popiskyKlicu || {};
    if (presne[klic]) return presne[klic];
    var casti = klic.split(".");
    var posledni = casti[casti.length - 1];
    var popisky = Z.popisky || {};
    if (popisky[posledni]) return popisky[posledni];
    // pole: "pravidla.2.nadpis" -> "Nadpis"
    if (/^\d+$/.test(posledni) && casti.length > 1) {
      return String(H.textyPolozka || "{cislo}. položka").replace("{cislo}", String(Number(posledni) + 1));
    }
    // z camelCase uděláme větu: "poleJmeno" -> "Pole jméno"
    var slova = posledni.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
    return slova.charAt(0).toUpperCase() + slova.slice(1);
  }

  /** Nadpis skupiny uvnitř stránky (druhý segment klíče). */
  function skupinaKlice(klic) {
    var casti = klic.split(".");
    if (casti.length < 3) return "";
    var druhy = casti[1];
    if (/^\d+$/.test(druhy)) return "";
    var skupiny = Z.skupiny || {};
    if (skupiny[druhy]) return skupiny[druhy];
    var slova = druhy.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
    return slova.charAt(0).toUpperCase() + slova.slice(1);
  }

  /** Pořadí položky v poli, když je klíč tvaru "sekce.pole.2.nadpis". */
  function poradiVPoli(klic) {
    var shoda = klic.match(/\.(\d+)\./);
    return shoda ? Number(shoda[1]) + 1 : 0;
  }

  function texty(panel) {
    var klice = Object.keys(ploche).filter(function (k) { return typeof ploche[k] === "string"; });
    var oblasti = (Z.oblasti || []).slice();
    if (klice.some(function (k) { return oblastKlice(k) === "ostatni"; })) {
      oblasti.push({ id: "ostatni", nazev: "Ostatní", cesta: "", prefixy: [] });
    }
    if (!textyOblast) textyOblast = oblasti.length ? oblasti[0].id : null;
    if (!textyJazyk) textyJazyk = Z.jazyk;

    panel.innerHTML = "<p class='male tise'>" + esc(H.textyLead) + "</p>"
      + "<div class='filtry'>"
      + "<label class='mono male tise' for='admin-jazyk'>" + esc(H.textyJazyk) + "</label>"
      + "<select id='admin-jazyk' class='vstup' style='width:auto' data-jazyk>"
      + [["cs", "Čeština"], ["en", "English"]].map(function (j) {
        return "<option value='" + j[0] + "'" + (j[0] === textyJazyk ? " selected" : "") + ">" + j[1] + "</option>";
      }).join("") + "</select>"
      + "<input type='search' class='vstup' style='flex:1;min-width:12rem' data-hledat-text placeholder='"
      + esc(H.textyHledat) + "'>"
      + "</div>"
      + "<div class='texty'><nav class='texty__oblasti' data-oblasti></nav>"
      + "<div class='texty__obsah' data-vypis-textu></div></div>";

    var vypis = $("[data-vypis-textu]", panel);
    var navigace = $("[data-oblasti]", panel);

    function prepisy() { return A.textyProJazyk(stav, textyJazyk, {}); }

    function vykresliOblasti() {
      var p = prepisy();
      navigace.innerHTML = "<span class='texty__nadpis'>" + esc(H.textyOblasti) + "</span>"
        + oblasti.map(function (o) {
          var vlastni = klice.filter(function (k) { return oblastKlice(k) === o.id; });
          var zmeneno = vlastni.filter(function (k) { return p[k] !== undefined; }).length;
          return "<button type='button' data-oblast='" + esc(o.id) + "' aria-current='"
            + (o.id === textyOblast) + "'><span>" + esc(o.nazev) + "</span>"
            + (zmeneno ? "<span class='odznak'>" + zmeneno + "</span>"
              : "<span class='texty__pocet'>" + vlastni.length + "</span>") + "</button>";
        }).join("");
      $$("[data-oblast]", navigace).forEach(function (b) {
        b.addEventListener("click", function () {
          textyOblast = b.dataset.oblast;
          $("[data-hledat-text]", panel).value = "";
          vykresliOblasti();
          vykresliObsah();
        });
      });
    }

    function polozka(klic, p, ukazOblast) {
      var prepis = p[klic];
      var hodnota = prepis === undefined ? ploche[klic] : prepis;
      var dlouhy = String(hodnota).length > 80;
      var oblast = ukazOblast ? (oblasti.filter(function (o) { return o.id === oblastKlice(klic); })[0] || {}).nazev : "";
      return "<div class='admin-text' data-klic='" + esc(klic) + "' data-zmeneno='" + (prepis === undefined ? "0" : "1") + "'>"
        + "<span class='admin-text__popisek'>" + esc(popisekKlice(klic))
        + (oblast ? " <span class='tise'>· " + esc(oblast) + "</span>" : "")
        + (prepis === undefined ? "" : " <span class='texty__znacka'>" + esc(H.textyUpraveno) + "</span>") + "</span>"
        + "<textarea rows='" + (dlouhy ? Math.min(6, Math.ceil(String(hodnota).length / 70) + 1) : 1) + "'>"
        + esc(hodnota) + "</textarea>"
        + "<span class='admin-text__klic'>" + esc(klic) + "</span>"
        + (prepis === undefined ? "" : "<div class='admin-akce'><button class='tl tl--obrys tl--maly' type='button' data-vratit>"
          + esc(H.textyVratit) + "</button><span class='male tise'>" + esc(H.textyPuvodni) + ": "
          + esc(String(ploche[klic]).slice(0, 90)) + "</span></div>")
        + "</div>";
    }

    function vykresliObsah() {
      var p = prepisy();
      var dotaz = ($("[data-hledat-text]", panel).value || "").trim().toLowerCase();
      if (dotaz) {
        var nalezene = klice.filter(function (k) {
          return k.toLowerCase().indexOf(dotaz) >= 0 || String(ploche[k]).toLowerCase().indexOf(dotaz) >= 0
            || String(p[k] === undefined ? "" : p[k]).toLowerCase().indexOf(dotaz) >= 0;
        });
        vypis.innerHTML = nalezene.length
          ? "<p class='mono male tise'>" + esc(String(H.textyNalezeno).replace("{pocet}", String(nalezene.length))) + "</p>"
            + nalezene.slice(0, 120).map(function (k) { return polozka(k, p, true); }).join("")
          : "<p class='prazdno'>" + esc(H.textyPrazdno) + "</p>";
        pripojUdalosti();
        return;
      }

      var oblast = oblasti.filter(function (o) { return o.id === textyOblast; })[0] || oblasti[0];
      var vlastni = klice.filter(function (k) { return oblastKlice(k) === oblast.id; });
      vlastni.sort(function (a, b) {
        var sa = skupinaKlice(a), sb = skupinaKlice(b);
        if (sa !== sb) return sa === "" ? -1 : sb === "" ? 1 : sa.localeCompare(sb, "cs");
        var pa = poradiVPoli(a), pb = poradiVPoli(b);
        return pa === pb ? 0 : pa - pb;
      });
      var zmenenoTady = vlastni.filter(function (k) { return p[k] !== undefined; });

      var kusy = ["<div class='texty__hlava'><h2 style='font-size:1.2rem;margin:0'>" + esc(oblast.nazev) + "</h2>"
        + (oblast.cesta ? "<a class='sipka' href='" + esc(oblast.cesta) + "' target='_blank' rel='noopener'>"
          + esc(H.textyZobrazit) + " →</a>" : "") + "</div>"];
      if (zmenenoTady.length) {
        kusy.push("<div class='admin-akce' style='margin-bottom:.9rem'>"
          + "<button class='tl tl--obrys tl--maly' type='button' data-vratit-oblast>" + esc(H.textyVratitVse)
          + " (" + zmenenoTady.length + ")</button></div>");
      }
      var predchoziSkupina = null;
      vlastni.forEach(function (k) {
        var skupina = skupinaKlice(k);
        if (skupina !== predchoziSkupina) {
          if (skupina) kusy.push("<h3 class='texty__skupina'>" + esc(skupina) + "</h3>");
          predchoziSkupina = skupina;
        }
        kusy.push(polozka(k, p, false));
      });
      vypis.innerHTML = kusy.join("");
      var vratitVse = $("[data-vratit-oblast]", vypis);
      if (vratitVse) {
        vratitVse.addEventListener("click", function () {
          zmenenoTady.forEach(function (k) {
            stav = A.nastavText(stav, textyJazyk, k, "");
            stav = A.nastavText(stav, "_zaklad", k, "");
          });
          uloz();
          vykresliOblasti();
          vykresliObsah();
        });
      }
      pripojUdalosti();
    }

    function pripojUdalosti() {
      $$(".admin-text textarea", vypis).forEach(function (ta) {
        ta.addEventListener("change", function () {
          var klic = ta.closest(".admin-text").dataset.klic;
          var zmena = ta.value === ploche[klic] ? "" : ta.value;
          stav = A.nastavText(stav, textyJazyk, klic, zmena);
          stav = A.nastavText(stav, "_zaklad", klic, zmena ? ploche[klic] : "");
          uloz();
          vykresliOblasti();
          vykresliObsah();
        });
      });
      $$("[data-vratit]", vypis).forEach(function (b) {
        b.addEventListener("click", function () {
          var klic = b.closest(".admin-text").dataset.klic;
          stav = A.nastavText(stav, textyJazyk, klic, "");
          stav = A.nastavText(stav, "_zaklad", klic, "");
          uloz();
          vykresliOblasti();
          vykresliObsah();
        });
      });
    }

    $("[data-jazyk]", panel).addEventListener("change", function (e) {
      textyJazyk = e.target.value;
      vykresliOblasti();
      vykresliObsah();
    });
    $("[data-hledat-text]", panel).addEventListener("input", vykresliObsah);
    vykresliOblasti();
    vykresliObsah();
  }

  var filtrRecenzi = "vse";

  function recenze(panel) {
    var vsechny = A.slozSeznam(stav, "recenze", Z.recenze);
    var seznam = filtrRecenzi === "vse" ? vsechny : vsechny.filter(function (r) { return r.stav === filtrRecenzi; });
    var hvezdy = function (n) {
      var out = "";
      for (var i = 1; i <= 5; i += 1) out += i <= n ? "\u2605" : "\u2606";
      return out;
    };
    var chip = function (hodnota, popisek) {
      return "<button type='button' class='chip' data-stav-filtr='" + hodnota + "' aria-pressed='"
        + (filtrRecenzi === hodnota) + "'>" + esc(popisek) + "</button>";
    };
    panel.innerHTML = "<p class='male tise'>" + esc(H.recenzeLead) + "</p>"
      + "<div class='filtry'><span class='mono male tise'>" + esc(H.recenzeFiltr) + "</span>"
      + chip("vse", H.recenzeVse) + chip("ceka", H.stavCeka) + chip("schvalena", H.stavSchvalena)
      + chip("skryta", H.stavSkryta) + "</div>"
      + (seznam.length ? seznam.map(function (r) {
        var popis = r.stav === "schvalena" ? H.stavSchvalena : r.stav === "ceka" ? H.stavCeka : H.stavSkryta;
        return "<div class='admin-radek' data-id='" + esc(r.id) + "'>"
          + "<div class='admin-radek__hlava'><span><strong>" + esc(r.jmeno) + "</strong>"
          + (r.firma ? " <span class='male tise'>" + esc(r.firma) + "</span>" : "")
          + "</span><span><span style='color:var(--signal)'>" + hvezdy(r.hodnoceni) + "</span> "
          + "<span class='mono male tise'>" + esc(r.datum || "") + "</span> "
          + "<span class='znacka-stav' data-stav='" + esc(r.stav || "schvalena") + "'>" + esc(popis) + "</span></span></div>"
          + "<p class='male' style='margin:0;color:var(--sedy)'>" + esc(String(r.text).slice(0, 240)) + "</p>"
          + "<div class='admin-akce'>"
          + (r.stav === "schvalena" ? "" : "<button class='tl tl--maly' type='button' data-akce='schvalena'>" + esc(H.schvalit) + "</button>")
          + (r.stav === "skryta" ? "" : "<button class='tl tl--obrys tl--maly' type='button' data-akce='skryta'>" + esc(H.skryt) + "</button>")
          + "<button class='tl tl--obrys tl--maly' type='button' data-akce='smazat'>" + esc(H.smazat) + "</button>"
          + "</div></div>";
      }).join("") : "<p class='prazdno'>" + esc(H.prehledNic) + "</p>");
    $$("[data-stav-filtr]", panel).forEach(function (b) {
      b.addEventListener("click", function () { filtrRecenzi = b.dataset.stavFiltr; recenze(panel); });
    });
    $$("[data-akce]", panel).forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.closest(".admin-radek").dataset.id;
        stav = b.dataset.akce === "smazat"
          ? A.smazPolozku(stav, "recenze", id)
          : A.zmenStavRecenze(stav, id, b.dataset.akce);
        uloz();
        recenze(panel);
      });
    });
  }

  function stavby(panel) {
    var seznam = A.slozSeznam(stav, "stavby", Z.stavby);
    var formular = function (s) {
      s = s || { id: "", nazev: "", misto: "", kraj: "", segment: "b2b", obory: [], rok: 2026, datum: "",
        rozsah: "", perex: "", zadani: "", trvani: "", role: "", motiv: "hala" };
      return "<div class='karta rohy' data-formular-stavby style='margin:1rem 0'>"
        + "<input type='hidden' data-f='id' value='" + esc(s.id) + "'>"
        + "<div class='pole-dvojice'>"
        + pole("nazev", "Název", s.nazev) + pole("misto", "Místo", s.misto) + pole("kraj", "Kraj", s.kraj) + "</div>"
        + "<div class='pole-dvojice'>" + pole("rok", "Rok", s.rok, "number") + pole("datum", "Datum (YYYY-MM-DD)", s.datum)
        + pole("rozsah", "Rozsah", s.rozsah) + "</div>"
        + "<div class='pole-dvojice'>" + pole("trvani", H.stavbyTrvani, s.trvani || "") + pole("role", H.stavbyRole, s.role || "")
        + "<div class='pole'><label>" + esc(H.stavbySegment) + "</label><select data-f='segment'>"
        + [["b2b", "Firma / generální dodavatel"], ["b2c", "Domácnost"]].map(function (m) {
          return "<option value='" + m[0] + "'" + (s.segment === m[0] ? " selected" : "") + ">" + esc(m[1]) + "</option>";
        }).join("") + "</select></div></div>"
        + "<div class='pole'><label>" + esc(H.stavbyMotiv) + "</label><select data-f='motiv'>"
        + (Z.motivy || []).map(function (m) {
          return "<option value='" + m + "'" + (s.motiv === m ? " selected" : "") + ">" + m + "</option>";
        }).join("") + "</select></div>"
        + "<div class='pole'><label>" + esc(H.stavbyPerex) + "</label><textarea data-f='perex' rows='3'>" + esc(s.perex) + "</textarea></div>"
        + "<div class='pole'><label>" + esc(H.stavbyZadani) + "</label><textarea data-f='zadani' rows='3'>" + esc(s.zadani || "") + "</textarea></div>"
        + "<div class='pole'><label>Profese</label><div class='znacky'>" + Z.obory.map(function (o) {
          return "<label class='chip'><input type='checkbox' data-obor='" + o.id + "'"
            + ((s.obory || []).indexOf(o.id) >= 0 ? " checked" : "") + "> " + esc(o.nazev) + "</label>";
        }).join("") + "</div></div>"
        + "<div class='admin-akce'><button class='tl tl--maly' type='button' data-ulozit-stavbu>" + esc(H.ulozit)
        + "</button><button class='tl tl--obrys tl--maly' type='button' data-zrusit>" + esc(H.zrusit) + "</button></div></div>";
    };
    function pole(klic, popisek, hodnota, typ) {
      return "<div class='pole'><label>" + esc(popisek) + "</label><input type='" + (typ || "text")
        + "' data-f='" + klic + "' value='" + esc(hodnota) + "'></div>";
    }
    panel.innerHTML = "<p class='male tise'>" + esc(H.stavbyLead) + "</p>"
      + "<button class='tl tl--signal tl--maly' type='button' data-pridat>" + esc(H.pridatStavbu) + "</button>"
      + "<div data-misto-formulare></div>"
      + seznam.map(function (s) {
        return "<div class='admin-radek' data-id='" + esc(s.id) + "'>"
          + "<div class='admin-radek__hlava'><strong>" + esc(s.nazev) + "</strong>"
          + "<span class='mono male tise'>" + esc(s.misto) + " · " + esc(s.rok) + "</span></div>"
          + "<p class='male' style='margin:0;color:var(--sedy)'>" + esc(s.perex) + "</p>"
          + "<div class='admin-akce'><button class='tl tl--obrys tl--maly' type='button' data-upravit>Upravit</button>"
          + "<button class='tl tl--obrys tl--maly' type='button' data-smazat>" + esc(H.smazat) + "</button></div></div>";
      }).join("");

    var misto = $("[data-misto-formulare]", panel);
    function otevri(s) {
      misto.innerHTML = formular(s);
      $("[data-ulozit-stavbu]", misto).addEventListener("click", function () {
        var f = $("[data-formular-stavby]", misto);
        var polozka = {};
        $$("[data-f]", f).forEach(function (el) { polozka[el.dataset.f] = el.value; });
        if (!polozka.id) delete polozka.id;
        polozka.rok = Number(polozka.rok) || new Date().getFullYear();
        polozka.obory = $$("[data-obor]", f).filter(function (e) { return e.checked; })
          .map(function (e) { return e.dataset.obor; });
        polozka.motiv = polozka.motiv || "hala";
        stav = A.ulozPolozku(stav, "stavby", polozka, Z.stavby);
        uloz();
        stavby(panel);
      });
      $("[data-zrusit]", misto).addEventListener("click", function () { misto.innerHTML = ""; });
    }
    $("[data-pridat]", panel).addEventListener("click", function () { otevri(null); });
    $$("[data-upravit]", panel).forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.closest(".admin-radek").dataset.id;
        otevri(seznam.filter(function (s) { return s.id === id; })[0]);
      });
    });
    $$("[data-smazat]", panel).forEach(function (b) {
      b.addEventListener("click", function () {
        stav = A.smazPolozku(stav, "stavby", b.closest(".admin-radek").dataset.id);
        uloz();
        stavby(panel);
      });
    });
  }

  function poptavky(panel) {
    if (!stav.poptavky.length) {
      panel.innerHTML = "<p class='prazdno'>" + esc(H.poptavkyPrazdno) + "</p>";
      return;
    }
    panel.innerHTML = "<p class='male tise'>" + esc(H.poptavkyLead) + "</p>"
      + "<div class='admin-akce' style='margin-bottom:1rem'><button class='tl tl--obrys tl--maly' type='button' data-vse-prectene>"
      + esc(H.poptavkyVsePrectene) + "</button></div>"
      + stav.poptavky.map(function (p) {
      return "<div class='admin-radek' data-id='" + esc(p.id) + "'"
        + (p.precteno ? "" : " style='border-left:3px solid var(--signal);padding-left:.8rem'") + ">"
        + "<div class='admin-radek__hlava'><strong>" + esc(p.jmeno || "—") + "</strong>"
        + "<span class='mono male tise'>" + esc(p.typ || "poptavka") + " · " + esc(p.prijato || "") + "</span></div>"
        + "<p class='male' style='margin:0;color:var(--sedy)'>" + esc(p.email || "") + " " + esc(p.telefon || "") + "</p>"
        + "<pre class='male' style='white-space:pre-wrap;margin:.4rem 0 0;font-family:inherit;color:var(--sedy)'>"
        + esc(p.zprava || "") + "</pre>"
        + "<div class='admin-akce'><button class='tl tl--obrys tl--maly' type='button' data-precteno>"
        + esc(H.oznacitPrectene) + "</button><button class='tl tl--obrys tl--maly' type='button' data-smazat>"
        + esc(H.smazat) + "</button></div></div>";
    }).join("");
    var vse = $("[data-vse-prectene]", panel);
    if (vse) {
      vse.addEventListener("click", function () {
        stav.poptavky.forEach(function (p) { stav = A.oznacPrectene(stav, p.id, true); });
        uloz(); poptavky(panel);
      });
    }
    $$("[data-precteno]", panel).forEach(function (b) {
      b.addEventListener("click", function () {
        stav = A.oznacPrectene(stav, b.closest(".admin-radek").dataset.id, true);
        uloz(); poptavky(panel);
      });
    });
    $$("[data-smazat]", panel).forEach(function (b) {
      b.addEventListener("click", function () {
        stav = A.smazPoptavku(stav, b.closest(".admin-radek").dataset.id);
        uloz(); poptavky(panel);
      });
    });
  }

  function data(panel) {
    panel.innerHTML = "<p class='male tise'>" + esc(H.dataLead) + "</p>"
      + "<div class='admin-akce'>"
      + "<button class='tl tl--maly' type='button' data-export>" + esc(H.exportovat) + "</button>"
      + "<label class='tl tl--obrys tl--maly'>" + esc(H.importovat)
      + "<input type='file' accept='application/json' data-import hidden></label>"
      + "<button class='tl tl--obrys tl--maly' type='button' data-vymazat>" + esc(H.vymazat) + "</button></div>"
      + "<p class='hlaska hlaska--info' data-zprava hidden style='margin-top:1rem'></p>"
      + "<details style='margin-top:1.4rem'><summary class='mono male tise'>Podoba uložených změn</summary>"
      + "<pre class='male posuvne' style='background:var(--bila);border:1px solid var(--cara-3);padding:1rem;border-radius:3px'>"
      + esc(A.exportJson(stav)) + "</pre></details>";
    $("[data-export]", panel).addEventListener("click", function () {
      var blob = new Blob([A.exportJson(stav)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "fofrmont-zmeny.json";
      document.body.appendChild(a); a.click(); a.remove();
    });
    $("[data-import]", panel).addEventListener("change", function (e) {
      var soubor = e.target.files[0];
      if (!soubor) return;
      soubor.text().then(function (text) {
        var v = A.importJson(stav, text);
        var zprava = $("[data-zprava]", panel);
        zprava.hidden = false;
        if (v.ok) { stav = v.stav; uloz(); zprava.textContent = "Změny načteny."; data(panel); }
        else { zprava.textContent = "Soubor se nepodařilo načíst: " + v.chyba; }
      });
    });
    $("[data-vymazat]", panel).addEventListener("click", function () {
      if (!window.confirm(H.vymazatPotvrzeni)) return;
      A.vymaz(uloziste);
      stav = A.prazdnyStav();
      vykresliOdznaky();
      data(panel);
    });
  }

  function nastaveni(panel) {
    var polozky = [
      ["kontakt.telefon", H.nastaveniTelefon], ["kontakt.email", H.nastaveniEmail],
      ["kontakt.ulice", H.nastaveniUlice], ["kontakt.psc", H.nastaveniPsc],
      ["kontakt.mesto", H.nastaveniMesto], ["kontakt.provozniDoba", H.nastaveniProvozniDoba],
    ];
    var prepisy = A.textyProJazyk(stav, "vse", {});
    panel.innerHTML = "<p class='male tise'>" + esc(H.nastaveniLead) + "</p>"
      + "<div class='karta rohy' style='margin-top:1rem;max-width:44rem'>"
      + polozky.map(function (par) {
        var zaklad = (Z.kontakt || {})[par[0]] || "";
        var hodnota = prepisy[par[0]] === undefined ? zaklad : prepisy[par[0]];
        return "<div class='pole' data-klic='" + esc(par[0]) + "'><label>" + esc(par[1]) + "</label>"
          + "<input type='text' value='" + esc(hodnota) + "'>"
          + (prepisy[par[0]] === undefined ? "" : "<span class='napoveda'>" + esc(H.textyPuvodni) + ": " + esc(zaklad) + "</span>")
          + "</div>";
      }).join("")
      + "<div class='admin-akce'><button class='tl tl--obrys tl--maly' type='button' data-vratit-vse>"
      + esc(H.textyVratit) + "</button></div></div>";
    $$(".pole[data-klic] input", panel).forEach(function (vstup) {
      vstup.addEventListener("change", function () {
        var klic = vstup.closest(".pole").dataset.klic;
        var zaklad = (Z.kontakt || {})[klic] || "";
        stav = A.nastavText(stav, "vse", klic, vstup.value === zaklad ? "" : vstup.value);
        uloz();
        nastaveni(panel);
      });
    });
    $("[data-vratit-vse]", panel).addEventListener("click", function () {
      polozky.forEach(function (par) { stav = A.nastavText(stav, "vse", par[0], ""); });
      uloz();
      nastaveni(panel);
    });
  }

  var PANELY = { prehled: prehled, statistiky: statistiky, texty: texty, recenze: recenze,
    stavby: stavby, poptavky: poptavky, nastaveni: nastaveni, data: data };

  function vykresliPanel(id) {
    var panel = $("[data-panel='" + id + "']");
    if (panel && PANELY[id]) PANELY[id](panel);
  }

  function start() {
    var vstoupit = $("[data-vstoupit]");
    if (vstoupit) {
      vstoupit.addEventListener("click", function () {
        $("[data-prihlaseni]").hidden = true;
        $("[data-admin]").hidden = false;
        vykresliPanel("prehled");
      });
    }
    $$("[data-zalozka]").forEach(function (tl) {
      tl.addEventListener("click", function () {
        var id = tl.dataset.zalozka;
        $$("[data-zalozka]").forEach(function (j) { j.setAttribute("aria-selected", String(j === tl)); });
        $$("[data-panel]").forEach(function (p) { p.hidden = p.dataset.panel !== id; });
        vykresliPanel(id);
      });
    });
    vykresliOdznaky();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
