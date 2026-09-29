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

  function vykresliOdznaky() {
    var s = A.statistiky(stav, Z.recenze, Z.stavby);
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

  /* ---------- panely ---------- */
  function prehled(panel) {
    var s = A.statistiky(stav, Z.recenze, Z.stavby);
    var dlazdice = [
      [H.prehledRecenzeCeka, s.recenzeCeka], [H.prehledPoptavky, s.poptavkyNeprectene],
      [H.prehledStavby, s.stavbyCelkem], [H.prehledTexty, s.textyZmeneno],
    ];
    panel.innerHTML = "<div class='mrizka mrizka--4'>" + dlazdice.map(function (d) {
      return "<div class='karta rohy'><div class='udaj'><span class='udaj__cislo'>" + d[1]
        + "</span><span class='udaj__popis'>" + esc(d[0]) + "</span></div></div>";
    }).join("") + "</div>"
      + "<p class='male tise' style='margin-top:1.4rem'>Změny se ukládají jen do tohoto prohlížeče. "
      + "V záložce „Export a import“ si je můžete stáhnout jako soubor.</p>";
  }

  function texty(panel) {
    var klice = Object.keys(ploche).filter(function (k) { return typeof ploche[k] === "string"; });
    panel.innerHTML = "<p class='male tise'>" + esc(H.textyLead) + "</p>"
      + "<div class='pole'><input type='search' data-hledat-text placeholder='" + esc(H.textyHledat) + "'></div>"
      + "<div data-vypis-textu></div>";
    var vypis = $("[data-vypis-textu]", panel);
    function vykresli(dotaz) {
      var d = (dotaz || "").toLowerCase();
      var vybrane = klice.filter(function (k) {
        if (!d) return true;
        return k.toLowerCase().indexOf(d) >= 0 || String(ploche[k]).toLowerCase().indexOf(d) >= 0;
      }).slice(0, 220);
      vypis.innerHTML = vybrane.map(function (k) {
        var prepis = A.textyProJazyk(stav, Z.jazyk, {})[k];
        var hodnota = prepis === undefined ? ploche[k] : prepis;
        return "<div class='admin-text' data-klic='" + esc(k) + "' data-zmeneno='" + (prepis === undefined ? "0" : "1") + "'>"
          + "<span class='admin-text__klic'>" + esc(k) + "</span>"
          + "<textarea rows='" + (String(hodnota).length > 90 ? 3 : 1) + "'>" + esc(hodnota) + "</textarea>"
          + (prepis === undefined ? "" : "<div class='admin-akce'><button class='tl tl--obrys tl--maly' type='button' data-vratit>"
            + esc(H.textyVratit) + "</button><span class='male tise'>" + esc(H.textyPuvodni) + ": "
            + esc(String(ploche[k]).slice(0, 80)) + "</span></div>")
          + "</div>";
      }).join("") || "<p class='prazdno'>Nic nenalezeno.</p>";
      $$(".admin-text textarea", vypis).forEach(function (ta) {
        ta.addEventListener("change", function () {
          var klic = ta.closest(".admin-text").dataset.klic;
          var puvodni = ploche[klic];
          stav = A.nastavText(stav, Z.jazyk, klic, ta.value === puvodni ? "" : ta.value);
          uloz();
          vykresli($("[data-hledat-text]", panel).value);
        });
      });
      $$("[data-vratit]", vypis).forEach(function (b) {
        b.addEventListener("click", function () {
          var klic = b.closest(".admin-text").dataset.klic;
          stav = A.nastavText(stav, Z.jazyk, klic, "");
          uloz();
          vykresli($("[data-hledat-text]", panel).value);
        });
      });
    }
    $("[data-hledat-text]", panel).addEventListener("input", function (e) { vykresli(e.target.value); });
    vykresli("");
  }

  function recenze(panel) {
    var seznam = A.slozSeznam(stav, "recenze", Z.recenze);
    panel.innerHTML = "<p class='male tise'>" + esc(H.recenzeLead) + "</p>" + seznam.map(function (r) {
      var popis = r.stav === "schvalena" ? H.stavSchvalena : r.stav === "ceka" ? H.stavCeka : H.stavSkryta;
      return "<div class='admin-radek' data-id='" + esc(r.id) + "'>"
        + "<div class='admin-radek__hlava'><strong>" + esc(r.jmeno) + "</strong>"
        + "<span class='znacka-stav' data-stav='" + esc(r.stav || "schvalena") + "'>" + esc(popis) + "</span></div>"
        + "<p class='male' style='margin:0;color:var(--sedy)'>" + esc(String(r.text).slice(0, 220)) + "</p>"
        + "<div class='admin-akce'>"
        + "<button class='tl tl--obrys tl--maly' type='button' data-akce='schvalena'>" + esc(H.schvalit) + "</button>"
        + "<button class='tl tl--obrys tl--maly' type='button' data-akce='skryta'>" + esc(H.skryt) + "</button>"
        + "<button class='tl tl--obrys tl--maly' type='button' data-akce='smazat'>" + esc(H.smazat) + "</button>"
        + "</div></div>";
    }).join("");
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
      s = s || { id: "", nazev: "", misto: "", kraj: "", segment: "b2b", obory: [], rok: 2026, datum: "", rozsah: "", perex: "" };
      return "<div class='karta rohy' data-formular-stavby style='margin:1rem 0'>"
        + "<input type='hidden' data-f='id' value='" + esc(s.id) + "'>"
        + "<div class='pole-dvojice'>"
        + pole("nazev", "Název", s.nazev) + pole("misto", "Místo", s.misto) + pole("kraj", "Kraj", s.kraj) + "</div>"
        + "<div class='pole-dvojice'>" + pole("rok", "Rok", s.rok, "number") + pole("datum", "Datum (YYYY-MM-DD)", s.datum)
        + pole("rozsah", "Rozsah", s.rozsah) + "</div>"
        + "<div class='pole'><label>Perex</label><textarea data-f='perex' rows='3'>" + esc(s.perex) + "</textarea></div>"
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
        polozka.motiv = "hala";
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
    panel.innerHTML = "<p class='male tise'>" + esc(H.poptavkyLead) + "</p>" + stav.poptavky.map(function (p) {
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

  var PANELY = { prehled: prehled, texty: texty, recenze: recenze, stavby: stavby, poptavky: poptavky, data: data };

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
