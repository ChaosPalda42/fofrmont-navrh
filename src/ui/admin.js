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


  /* ---------- fotky k realizacím ---------- */
  var MAX_FOTEK = 8;

  /** Fotku zmenšíme a uložíme jako datovou adresu — v ukázce není kam ji nahrát. */
  function zmensiFotku(soubor, maxSirka) {
    return new Promise(function (hotovo, chyba) {
      var cteni = new FileReader();
      cteni.onerror = function () { chyba(new Error("soubor se nepodařilo přečíst")); };
      cteni.onload = function () {
        var obrazek = new Image();
        obrazek.onerror = function () { chyba(new Error("neplatný obrázek")); };
        obrazek.onload = function () {
          var pomer = Math.min(1, maxSirka / obrazek.width);
          var platno = document.createElement("canvas");
          platno.width = Math.round(obrazek.width * pomer);
          platno.height = Math.round(obrazek.height * pomer);
          platno.getContext("2d").drawImage(obrazek, 0, 0, platno.width, platno.height);
          hotovo(platno.toDataURL("image/jpeg", 0.68));
        };
        obrazek.src = cteni.result;
      };
      cteni.readAsDataURL(soubor);
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
      + "<div class='pole texty__vyber'><label for='admin-oblast'>" + esc(H.textyOblasti) + "</label>"
      + "<select id='admin-oblast' data-oblast-vyber></select></div>"
      + "<div class='texty'><nav class='texty__oblasti' data-oblasti></nav>"
      + "<div class='texty__obsah' data-vypis-textu></div></div>";

    var vypis = $("[data-vypis-textu]", panel);
    var navigace = $("[data-oblasti]", panel);

    function prepisy() { return A.textyProJazyk(stav, textyJazyk, {}); }

    var vyber = $("[data-oblast-vyber]", panel);

    function vykresliOblasti() {
      var p = prepisy();
      var pocty = {};
      oblasti.forEach(function (o) {
        var vlastni = klice.filter(function (k) { return oblastKlice(k) === o.id; });
        pocty[o.id] = { celkem: vlastni.length, zmeneno: vlastni.filter(function (k) { return p[k] !== undefined; }).length };
      });
      vyber.innerHTML = oblasti.map(function (o) {
        var c = pocty[o.id];
        return "<option value='" + esc(o.id) + "'" + (o.id === textyOblast ? " selected" : "") + ">"
          + esc(o.nazev) + " (" + c.celkem + (c.zmeneno ? ", " + c.zmeneno + " " + esc(H.textyUpraveno) : "") + ")</option>";
      }).join("");
      navigace.innerHTML = "<span class='texty__nadpis'>" + esc(H.textyOblasti) + "</span>"
        + oblasti.map(function (o) {
          var zmeneno = pocty[o.id].zmeneno;
          var vlastni = { length: pocty[o.id].celkem };
          return "<button type='button' data-oblast='" + esc(o.id) + "' aria-current='"
            + (o.id === textyOblast) + "'><span>" + esc(o.nazev) + "</span>"
            + (zmeneno ? "<span class='odznak'>" + zmeneno + "</span>"
              : "<span class='texty__pocet'>" + vlastni.length + "</span>") + "</button>";
        }).join("");
      $$("[data-oblast]", navigace).forEach(function (b) {
        b.addEventListener("click", function () { zvolOblast(b.dataset.oblast); });
      });
    }

    function zvolOblast(id) {
      textyOblast = id;
      $("[data-hledat-text]", panel).value = "";
      vykresliOblasti();
      vykresliObsah();
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
    vyber.addEventListener("change", function () { zvolOblast(vyber.value); });
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
      + "<div class='hlaska hlaska--info' style='margin-bottom:1rem'><strong>" + esc(H.googleNadpis)
      + "</strong><br>" + esc(H.googleText) + "</div>"
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
        + "<div class='pole'><label>" + esc(H.stavbyFotky) + "</label>"
        + "<label class='prilohy__zona' for='fotky-vstup'>"
        + "<svg width='22' height='22' viewBox='0 0 20 20' fill='none' stroke='currentColor' stroke-width='1.5'"
        + " stroke-linecap='round' stroke-linejoin='round'><rect x='2.5' y='4.5' width='15' height='11' rx='1.5'/>"
        + "<circle cx='7' cy='8.5' r='1.3'/><path d='m3.5 14 4-4 3.5 3.5 2.5-2 3 2.5'/></svg>"
        + "<span><strong>" + esc(H.fotkyPridat) + "</strong><br><span class='napoveda'>" + esc(H.fotkyPopis)
        + "</span></span></label>"
        + "<input type='file' id='fotky-vstup' accept='image/jpeg,image/png,image/webp,image/heic' multiple class='skryte' data-fotky-vstup>"
        + "<div class='admin-fotky' data-fotky></div>"
        + "<span class='chyba' data-fotky-chyba hidden></span></div>"
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
          + "<div class='admin-radek__hlava'><strong>" + esc(s.nazev)
          + (s.fotky && s.fotky.length ? " <span class='texty__pocet'>" + s.fotky.length + " foto</span>" : "")
          + "</strong><span class='mono male tise'>" + esc(s.misto) + " · " + esc(s.rok) + "</span></div>"
          + "<p class='male' style='margin:0;color:var(--sedy)'>" + esc(s.perex) + "</p>"
          + "<div class='admin-akce'><button class='tl tl--obrys tl--maly' type='button' data-upravit>Upravit</button>"
          + "<button class='tl tl--obrys tl--maly' type='button' data-smazat>" + esc(H.smazat) + "</button></div></div>";
      }).join("");

    var misto = $("[data-misto-formulare]", panel);
    function otevri(s) {
      misto.innerHTML = formular(s);
      var fotky = ((s && s.fotky) || []).slice();
      var pas = $("[data-fotky]", misto);
      var chybaFotek = $("[data-fotky-chyba]", misto);

      function vykresliFotky() {
        pas.innerHTML = fotky.length
          ? fotky.map(function (f, i) {
            return "<figure><img src='" + f + "' alt=''>"
              + "<button type='button' data-smazat-fotku='" + i + "' aria-label='" + esc(H.fotkyOdebrat) + "'>"
              + "<svg width='13' height='13' viewBox='0 0 20 20' fill='none' stroke='currentColor' stroke-width='2'"
              + " stroke-linecap='round'><path d='m5 5 10 10M15 5 5 15'/></svg></button></figure>";
          }).join("")
          : "<p class='male tise' style='grid-column:1/-1;margin:0'>" + esc(H.fotkyPrazdno) + "</p>";
        $$("[data-smazat-fotku]", pas).forEach(function (b) {
          b.addEventListener("click", function () {
            fotky.splice(Number(b.dataset.smazatFotku), 1);
            vykresliFotky();
          });
        });
      }

      $("[data-fotky-vstup]", misto).addEventListener("change", function (e) {
        var soubory = Array.prototype.slice.call(e.target.files);
        chybaFotek.hidden = true;
        if (fotky.length + soubory.length > MAX_FOTEK) {
          chybaFotek.hidden = false;
          chybaFotek.textContent = H.fotkyLimit;
          soubory = soubory.slice(0, Math.max(0, MAX_FOTEK - fotky.length));
        }
        Promise.all(soubory.map(function (f) { return zmensiFotku(f, 1100).catch(function () { return null; }); }))
          .then(function (nove) {
            nove.filter(Boolean).forEach(function (f) { fotky.push(f); });
            vykresliFotky();
          });
        e.target.value = "";
      });
      vykresliFotky();
      $("[data-ulozit-stavbu]", misto).addEventListener("click", function () {
        var f = $("[data-formular-stavby]", misto);
        var polozka = {};
        $$("[data-f]", f).forEach(function (el) { polozka[el.dataset.f] = el.value; });
        if (!polozka.id) delete polozka.id;
        polozka.rok = Number(polozka.rok) || new Date().getFullYear();
        polozka.obory = $$("[data-obor]", f).filter(function (e) { return e.checked; })
          .map(function (e) { return e.dataset.obor; });
        polozka.motiv = polozka.motiv || "hala";
        polozka.fotky = fotky;
        var zaloha = stav;
        stav = A.ulozPolozku(stav, "stavby", polozka, Z.stavby);
        try {
          uloz();
        } catch (chyba) {
          stav = zaloha;                      // úložiště prohlížeče je plné
          chybaFotek.hidden = false;
          chybaFotek.textContent = "Úložiště prohlížeče je plné. Odeberte část fotek, nebo v záložce "
            + "Export a import stáhněte a vymažte starší změny.";
          return;
        }
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

  var PANELY = { prehled: prehled, texty: texty, recenze: recenze,
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
