/* FOFRMONT — chování webu. Logiku dodávají moduly ve window.FM (src/lib). */
(function () {
  "use strict";
  var FM = window.FM || {};
  var $ = function (sel, kde) { return (kde || document).querySelector(sel); };
  var $$ = function (sel, kde) { return Array.prototype.slice.call((kde || document).querySelectorAll(sel)); };
  var jsonAttr = function (el, jmeno, zaskok) {
    try { return JSON.parse(el.getAttribute(jmeno)); } catch (e) { return zaskok; }
  };
  var tlumene = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ROZTEC = (function () {   // rozteč mřížky se čte z CSS (--rastr), ať se nemůže rozejít
    var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--rastr"));
    return v > 0 ? v : 24;
  })();
  var posunRastru = 0;      // svislé posunutí mřížky při rolování (parallax)


  /* ---------- mřížka, která se rozsvítí pod kurzorem ---------- */
  function svitivaMrizka() {
    var vrstva = $(".rastr-svit");
    var snap = $(".rastr-snap");
    if (!vrstva || tlumene) return;
    var tmave = $$(".pas--vykres").map(function (sekce) {
      var svit = document.createElement("div");
      svit.className = "pas__svit";
      sekce.insertBefore(svit, sekce.firstChild);
      return { sekce: sekce, svit: svit };
    });
    var cx = -999, cy = -999, x = -999, y = -999, bezi = false;

    /** Nejbližší uzel mřížky pod kurzorem. Světlé pozadí má počátek v okně
     *  (posunutý parallaxem), tmavý pás má vlastní počátek u svého horního okraje. */
    function uzel(sekce) {
      var posunY = sekce ? sekce.getBoundingClientRect().top : posunRastru;
      var posunX = sekce ? sekce.getBoundingClientRect().left : 0;
      return {
        x: Math.round((cx - posunX) / ROZTEC) * ROZTEC + posunX + 0.5,
        y: Math.round((cy - posunY) / ROZTEC) * ROZTEC + posunY + 0.5,
      };
    }

    function ramec() {
      x += (cx - x) * 0.2;
      y += (cy - y) * 0.2;
      vrstva.style.setProperty("--mx", x.toFixed(1) + "px");
      vrstva.style.setProperty("--my", y.toFixed(1) + "px");
      var nadTmavou = null;
      for (var i = 0; i < tmave.length; i += 1) {
        var r = tmave[i].sekce.getBoundingClientRect();
        var uvnitr = cy > r.top - 240 && cy < r.bottom + 240 && r.height > 0;
        tmave[i].sekce.dataset.svit = uvnitr ? "1" : "0";
        if (uvnitr) {
          tmave[i].svit.style.setProperty("--mx", (x - r.left).toFixed(1) + "px");
          tmave[i].svit.style.setProperty("--my", (y - r.top).toFixed(1) + "px");
          if (cy >= r.top && cy <= r.bottom) nadTmavou = tmave[i].sekce;
        }
      }
      var u = uzel(nadTmavou);
      snap.style.transform = "translate3d(" + u.x.toFixed(1) + "px," + u.y.toFixed(1) + "px,0)";
      if (Math.abs(cx - x) > 0.4 || Math.abs(cy - y) > 0.4) requestAnimationFrame(ramec);
      else bezi = false;
    }

    document.addEventListener("pointermove", function (e) {
      if (cx < -500) { x = e.clientX; y = e.clientY; }
      cx = e.clientX; cy = e.clientY;
      document.body.dataset.kurzor = "1";
      if (!bezi) { bezi = true; requestAnimationFrame(ramec); }
    }, { passive: true });
    document.addEventListener("pointerleave", function () { document.body.dataset.kurzor = "0"; });
    document.addEventListener("pointerup", function (e) {
      if (e.pointerType === "touch") window.setTimeout(function () { document.body.dataset.kurzor = "0"; }, 900);
    });
    window.addEventListener("blur", function () { document.body.dataset.kurzor = "0"; });
  }

  /* ---------- pravítko postupu čtení ---------- */
  function pravitko() {
    var pruh = $(".merit i");
    if (!pruh) return;
    var ceka = false;
    var prepocti = function () {
      var vyska = document.documentElement.scrollHeight - window.innerHeight;
      var podil = vyska > 0 ? (window.scrollY / vyska) * 100 : 0;
      pruh.style.setProperty("--postup", Math.min(100, Math.max(0, podil)).toFixed(2) + "%");
      ceka = false;
    };
    window.addEventListener("scroll", function () {
      if (ceka) return;
      ceka = true;
      window.requestAnimationFrame(prepocti);
    }, { passive: true });
    prepocti();
  }

  /* ---------- počítadla u velkých čísel ---------- */
  function pocitadla() {
    var cile = $$(".udaj__cislo[data-cil]");
    if (!cile.length) return;
    var format = function (hodnota, druh) {
      if (druh === "rok") return String(Math.round(hodnota));
      return FM.vypocty ? FM.vypocty.formatujCislo(Math.round(hodnota)) : String(Math.round(hodnota));
    };
    var rozjed = function (el) {
      var cil = Number(el.dataset.cil);
      if (!isFinite(cil)) return;
      var druh = el.dataset.format;
      var sufix = el.dataset.sufix || "";
      if (tlumene) { el.textContent = format(cil, druh) + sufix; return; }
      var zacatek = druh === "rok" ? cil - 24 : 0;
      var start = null;
      var doba = 1100;
      var krok = function (cas) {
        if (start === null) start = cas;
        var t = Math.min(1, (cas - start) / doba);
        var e = 1 - Math.pow(1 - t, 3);
        el.textContent = format(zacatek + (cil - zacatek) * e, druh) + sufix;
        if (t < 1) requestAnimationFrame(krok);
      };
      requestAnimationFrame(krok);
    };
    if (!("IntersectionObserver" in window)) { cile.forEach(rozjed); return; }
    var pozorovatel = new IntersectionObserver(function (zaznamy) {
      zaznamy.forEach(function (z) {
        if (!z.isIntersecting) return;
        rozjed(z.target);
        pozorovatel.unobserve(z.target);
      });
    }, { threshold: 0.5 });
    cile.forEach(function (el) { pozorovatel.observe(el); });
  }

  /* ---------- náklon výkresu a parallax motivů ---------- */
  function naklon() {
    if (tlumene) return;
    var vykres = $(".hero__vykres");
    if (vykres) {
      vykres.addEventListener("pointermove", function (e) {
        var r = vykres.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        vykres.dataset.drzi = "1";
        vykres.style.setProperty("--naklonY", (px * 7).toFixed(2) + "deg");
        vykres.style.setProperty("--naklonX", (-py * 5).toFixed(2) + "deg");
      }, { passive: true });
      vykres.addEventListener("pointerleave", function () {
        vykres.dataset.drzi = "0";
        vykres.style.setProperty("--naklonY", "0deg");
        vykres.style.setProperty("--naklonX", "0deg");
      });
    }
    $$(".karta--odkaz").forEach(function (karta) {
      var motiv = $(".karta__motiv", karta);
      if (!motiv) return;
      karta.addEventListener("pointerenter", function () {
        $$("path.kresli", motiv).forEach(function (cesta) {
          cesta.style.animation = "none";
          void cesta.getBoundingClientRect();
          cesta.style.animation = "";
        });
      });
      karta.addEventListener("pointermove", function (e) {
        var r = karta.getBoundingClientRect();
        motiv.style.setProperty("--posunX", (((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(1) + "px");
        motiv.style.setProperty("--posunY", (((e.clientY - r.top) / r.height - 0.5) * 8).toFixed(1) + "px");
      }, { passive: true });
      karta.addEventListener("pointerleave", function () {
        motiv.style.setProperty("--posunX", "0px");
        motiv.style.setProperty("--posunY", "0px");
      });
    });
  }

  /* ---------- magnetická hlavní tlačítka ---------- */
  function magnety() {
    if (tlumene) return;
    $$(".tl--signal").forEach(function (tl) {
      tl.classList.add("tl--magnet");
      tl.addEventListener("pointermove", function (e) {
        var r = tl.getBoundingClientRect();
        tl.style.setProperty("--magX", (((e.clientX - r.left) / r.width - 0.5) * 9).toFixed(1) + "px");
        tl.style.setProperty("--magY", (((e.clientY - r.top) / r.height - 0.5) * 6).toFixed(1) + "px");
      }, { passive: true });
      tl.addEventListener("pointerleave", function () {
        tl.style.setProperty("--magX", "0px");
        tl.style.setProperty("--magY", "0px");
      });
    });
  }

  /** Znovu vpluje prvky, které se po filtrování objevily. */
  function vplyn(prvky) {
    if (tlumene) return;
    prvky.forEach(function (el, i) {
      el.classList.remove("vplyn");
      void el.offsetWidth;
      el.style.animationDelay = Math.min(i * 45, 320) + "ms";
      el.classList.add("vplyn");
    });
  }

  /** Údaje přepsané v administraci se promítnou na celý web. */
  function prepisyUdaju() {
    if (!FM.administrace) return;
    var stav, prepisy;
    try {
      stav = FM.administrace.nacti(window.localStorage);
      prepisy = FM.administrace.textyProJazyk(stav, "vse", {});
    } catch (e) { return; }
    $$("[data-udaj]").forEach(function (el) {
      var hodnota = prepisy[el.dataset.udaj];
      if (hodnota === undefined || hodnota === "") return;
      el.textContent = hodnota;
      if (el.hasAttribute("data-udaj-mailto")) el.setAttribute("href", "mailto:" + hodnota);
    });
    prepisyTextu(stav);
  }

  /** Texty přepsané v administraci se na statické stránce vymění podle
   *  původního znění, které si administrace uložila k přepisu. */
  function prepisyTextu(stav) {
    var jazyk = document.documentElement.lang || "cs";
    var prepisy = FM.administrace.textyProJazyk(stav, jazyk, {});
    var zaklady = FM.administrace.textyProJazyk(stav, "_zaklad", {});
    var mapa = {};
    var kolik = 0;
    Object.keys(prepisy).forEach(function (klic) {
      var zaklad = zaklady[klic];
      if (!zaklad || !prepisy[klic] || zaklad === prepisy[klic]) return;
      mapa[String(zaklad).trim()] = prepisy[klic];
      kolik += 1;
    });
    if (!kolik) return;
    var prochazeni = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (uzel) {
        var rodic = uzel.parentNode;
        if (!rodic || rodic.closest("script, style, textarea, [data-panel]")) return NodeFilter.FILTER_REJECT;
        return uzel.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    var uzel;
    while ((uzel = prochazeni.nextNode())) {
      var nahrada = mapa[uzel.nodeValue.trim()];
      if (nahrada !== undefined) uzel.nodeValue = uzel.nodeValue.replace(uzel.nodeValue.trim(), nahrada);
    }
  }

  /* ---------- navigace ---------- */
  function navigace() {
    var tlacitko = $(".hamburger");
    if (tlacitko) {
      tlacitko.addEventListener("click", function () {
        var otevreno = document.body.dataset.menu === "1";
        document.body.dataset.menu = otevreno ? "0" : "1";
        tlacitko.setAttribute("aria-expanded", otevreno ? "false" : "true");
      });
    }
    $$("[data-rozbal]").forEach(function (obal) {
      var tl = $("button", obal);
      tl.addEventListener("click", function (e) {
        e.stopPropagation();
        var otevreno = obal.dataset.otevreno === "1";
        $$("[data-rozbal]").forEach(function (j) { j.dataset.otevreno = "0"; $("button", j).setAttribute("aria-expanded", "false"); });
        obal.dataset.otevreno = otevreno ? "0" : "1";
        tl.setAttribute("aria-expanded", otevreno ? "false" : "true");
      });
    });
    document.addEventListener("click", function () {
      $$("[data-rozbal]").forEach(function (j) { j.dataset.otevreno = "0"; $("button", j).setAttribute("aria-expanded", "false"); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      document.body.dataset.menu = "0";
      $$("[data-rozbal]").forEach(function (j) { j.dataset.otevreno = "0"; });
    });
  }

  /* ---------- příjezd sekcí a kreslení čar ---------- */
  function prijezd() {
    var cile = $$(".prijezd, .prijezd--rada, .hero__vykres, .gantt, [data-kresli]");
    if (!("IntersectionObserver" in window) || tlumene) {
      cile.forEach(function (el) { el.classList.add("je-videt"); });
      return;
    }
    $$("path.kresli").forEach(function (p) {
      if (p.style.getPropertyValue("--delka")) return;
      try { p.style.setProperty("--delka", Math.ceil(p.getTotalLength()) + 4); } catch (e) { /* prázdná cesta */ }
    });
    var pozorovatel = new IntersectionObserver(function (zaznamy) {
      zaznamy.forEach(function (z) {
        if (!z.isIntersecting) return;
        z.target.classList.add("je-videt");
        pozorovatel.unobserve(z.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    cile.forEach(function (el) { pozorovatel.observe(el); });
  }

  /* ---------- posun rastru při rolování ---------- */
  function rastr() {
    var koren = document.documentElement;
    if (!$(".rastr") || tlumene) return;
    var ceka = false;
    window.addEventListener("scroll", function () {
      if (ceka) return;
      ceka = true;
      window.requestAnimationFrame(function () {
        posunRastru = -(window.scrollY * 0.06) % (ROZTEC * 5);
        koren.style.setProperty("--rastr-posun", posunRastru + "px");
        ceka = false;
      });
    }, { passive: true });
  }

  /* ---------- hero: přepínač, nitkový kříž, tok potrubím ---------- */
  function hero() {
    $$("[data-prepinac]").forEach(function (obal) {
      var tlacitka = $$("button[data-varianta]", obal);
      tlacitka.forEach(function (tl) {
        tl.addEventListener("click", function () {
          var varianta = tl.dataset.varianta;
          tlacitka.forEach(function (j) { j.setAttribute("aria-pressed", String(j === tl)); });
          $$("[data-varianta-obsah]").forEach(function (el) { el.hidden = el.dataset.variantaObsah !== varianta; });
          prekresli(varianta);
          spustTok();
        });
      });
    });

    var plocha = $("[data-kriz]");
    if (plocha) {
      var kriz = $(".kriz", plocha);
      var popis = $(".kriz__popis", kriz);
      plocha.addEventListener("pointermove", function (e) {
        var r = plocha.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        kriz.dataset.aktivni = "1";
        $(".kriz__v", kriz).style.left = x + "px";
        $(".kriz__h", kriz).style.top = y + "px";
        popis.style.left = x + "px";
        popis.style.top = y + "px";
        popis.textContent = "X " + Math.round(x) + "  Y " + Math.round(y);
      });
      plocha.addEventListener("pointerleave", function () { kriz.dataset.aktivni = "0"; });
    }

    /** Po přepnutí varianty se výkres nakreslí znovu od začátku. */
    function prekresli(varianta) {
      if (tlumene) return;
      var plocha = $("[data-kriz]");
      if (!plocha) return;
      var obal = $("[data-varianta-obsah='" + varianta + "']", plocha);
      if (!obal) return;
      plocha.classList.remove("je-videt");
      $$("path.kresli", obal).forEach(function (cesta) {
        cesta.style.animation = "none";
        void cesta.offsetWidth;
        cesta.style.animation = "";
      });
      void plocha.offsetWidth;
      plocha.classList.add("je-videt");
    }

    var beh = null;
    function spustTok() {
      if (tlumene || !FM.izometrie) return;
      if (beh) { cancelAnimationFrame(beh); beh = null; }
      var viditelnaTrasa = $$("[data-trasa]").filter(function (p) {
        var obal = p.closest("[data-varianta-obsah]");
        return !obal || !obal.hidden;
      })[0];
      if (!viditelnaTrasa) return;
      var body = jsonAttr(viditelnaTrasa, "data-trasa", []);
      var znacka = viditelnaTrasa.parentNode.querySelector("circle[id^='tok-']");
      if (!znacka || !body.length) return;
      var zacatek = null;
      var krok = function (cas) {
        if (zacatek === null) zacatek = cas;
        var podil = ((cas - zacatek) % 3600) / 3600;
        var b = FM.izometrie.bodNaPolylinii(body, podil);
        znacka.setAttribute("cx", b.x);
        znacka.setAttribute("cy", b.y);
        znacka.setAttribute("opacity", podil < 0.04 || podil > 0.96 ? "0" : "0.9");
        beh = requestAnimationFrame(krok);
      };
      beh = requestAnimationFrame(krok);
    }
    setTimeout(spustTok, 1400);
  }


  /* ---------- otáčení izometrického výkresu (myš i prst) ---------- */
  function otacecka() {
    var plocha = $("[data-kriz]");
    if (!plocha || !FM.scena || !FM.izometrie) return;
    var stav = { uhel: 0, cil: 0, tazeni: false, zacatekX: 0, zacatekUhel: 0, beh: null };
    plocha.dataset.tahatelne = "1";

    function aktivniSvg() {
      return $$("svg[data-scena]", plocha).filter(function (svg) {
        var obal = svg.closest("[data-varianta-obsah]");
        return !obal || !obal.hidden;
      })[0];
    }

    function vykresli(uhel) {
      var svg = aktivniSvg();
      if (!svg) return;
      var scena = jsonAttr(svg, "data-scena", null);
      if (!scena) return;
      var v = FM.scena.vykresli(FM.izometrie, scena, {
        uhel: uhel, animace: false, znacka: svg.dataset.znacka || "sipka-kota",
        viewBox: svg.dataset.viewbox || null,
      });
      var defs = svg.querySelector("defs");
      svg.innerHTML = (defs ? defs.outerHTML : "") + v.vnitrek;
    }

    function plyn() {
      stav.uhel += (stav.cil - stav.uhel) * (stav.tazeni ? 0.45 : 0.14);
      vykresli(Math.round(stav.uhel * 10) / 10);
      if (Math.abs(stav.cil - stav.uhel) > 0.15) stav.beh = requestAnimationFrame(plyn);
      else { stav.uhel = stav.cil; vykresli(stav.cil); stav.beh = null; }
    }
    function rozjed() { if (!stav.beh) stav.beh = requestAnimationFrame(plyn); }

    plocha.addEventListener("pointerdown", function (e) {
      if (tlumene) return;
      stav.tazeni = true;
      stav.zacatekX = e.clientX;
      stav.zacatekUhel = stav.cil;
      plocha.dataset.tazeni = "1";
      try { plocha.setPointerCapture(e.pointerId); } catch (chyba) { /* nevadí */ }
    });
    plocha.addEventListener("pointermove", function (e) {
      if (!stav.tazeni) return;
      stav.cil = FM.scena.omez(stav.zacatekUhel + (e.clientX - stav.zacatekX) * 0.22);
      rozjed();
    });
    var pust = function () {
      if (!stav.tazeni) return;
      stav.tazeni = false;
      plocha.dataset.tazeni = "0";
      stav.cil = 0;                 // výkres se vrátí do základního pohledu
      rozjed();
    };
    plocha.addEventListener("pointerup", pust);
    plocha.addEventListener("pointercancel", pust);
    plocha.addEventListener("pointerleave", pust);
    window.FMotoc = { vykresli: vykresli, stav: stav };
  }

  /* ---------- měřič náročnosti ---------- */
  function meric() {
    var obal = $("[data-meric]");
    if (!obal || !FM.obtiznost) return;
    var faktory = jsonAttr(obal, "data-faktory", []);
    var katalog = jsonAttr(obal, "data-doporuceni", {});
    var stupne = jsonAttr(obal, "data-stupne", {});
    var hlasky = jsonAttr(obal, "data-hlasky", {});
    var volby = {};

    function vykresli() {
      var s = FM.obtiznost.skore(faktory, volby);
      var chybi = FM.obtiznost.chybejici(faktory, volby);
      var stupenEl = $("[data-vystup='stupen']", obal);
      var popisEl = $("[data-vystup='popis']", obal);
      $("[data-vystup='merka']", obal).style.setProperty("--procent", s.procent + "%");
      stupenEl.dataset.stupen = s.stupen;
      stupenEl.textContent = s.procent + " / 100";
      if (chybi.length) {
        popisEl.textContent = (hlasky.chybi || "Zbývá {pocet}").replace("{pocet}", String(chybi.length));
      } else {
        popisEl.textContent = FM.obtiznost.popisStupne(s.stupen, stupne);
      }
      var prispevky = FM.obtiznost.prispevky(faktory, volby).filter(function (p) { return p.body > 0; });
      $("[data-vystup='prispevky']", obal).innerHTML = prispevky.length
        ? "<p class='mono male tise' style='margin:0 0 .6rem'>" + (hlasky.prispevky || "") + "</p>" + prispevky.map(function (p) {
          return "<div class='prispevek'><span>" + p.nazev + "</span><span class='mono male'>" + p.podil + " %</span>"
            + "<span class='prispevek__pruh'><i style='--podil:" + p.podil + "%'></i></span></div>";
        }).join("") : "";
      var dop = FM.obtiznost.doporuceni(faktory, volby, katalog);
      $("[data-vystup='doporuceni']", obal).innerHTML = dop.length
        ? "<p class='mono male tise' style='margin:0 0 .5rem'>" + (hlasky.doporuceni || "") + "</p>"
          + "<ul class='seznam'>" + dop.map(function (d) { return "<li>" + d + "</li>"; }).join("") + "</ul>"
        : "";
    }

    $$("input[type='radio']", obal).forEach(function (vstup) {
      vstup.addEventListener("change", function () {
        var faktor = vstup.closest("[data-faktor]").dataset.faktor;
        volby[faktor] = vstup.value;
        vykresli();
      });
    });
    vykresli();
  }

  /* ---------- harmonogram ---------- */
  function gantt() {
    var obal = $("[data-gantt]");
    if (!obal || !FM.harmonogram) return;
    var faze = jsonAttr(obal, "data-gantt", []);
    var plan = FM.harmonogram.naplanuj(faze, "2026-04-06");
    var pozice = FM.harmonogram.pozice(plan);
    var kriticka = FM.harmonogram.kritickaCesta(faze);
    obal.innerHTML = plan.map(function (f, i) {
      var p = pozice[i] || { levo: 0, sirka: 10 };
      var jeKriticka = kriticka.indexOf(f.id) >= 0 ? "1" : "0";
      return "<div class='gantt__radek'><span class='gantt__nazev'>" + f.nazev
        + " <span class='gantt__dny'>" + f.dny + " d</span></span>"
        + "<span class='gantt__drazka'><i class='gantt__pruh' data-kriticka='" + jeKriticka
        + "' style='--levo:" + p.levo + "%;--sirka:" + p.sirka + "%;transition-delay:" + (i * 90) + "ms'></i></span></div>";
    }).join("");
    $$(".gantt__radek", obal).forEach(function (radek, i) {
      radek.addEventListener("pointerenter", function () {
        var krok = $$(".krok")[i];
        if (krok) krok.dataset.zvyrazneno = "1";
      });
      radek.addEventListener("pointerleave", function () {
        $$(".krok").forEach(function (k) { k.dataset.zvyrazneno = "0"; });
      });
    });
    var t = FM.harmonogram.trvani(plan);
    var vystup = $("[data-vystup='trvani']");
    if (vystup) vystup.textContent = t.start + " → " + t.konec + " · " + t.pracovnichDnu + " pracovních dnů";
  }

  /* ---------- filtry ---------- */
  function filtrujStavby() {
    var obal = $("[data-seznam-staveb]");
    if (!obal) return;
    var stav = { obor: "vse", segment: "vse", rok: "vse" };
    var polozky = $$("[data-stavba]", obal);
    var pocetEl = $("[data-pocet-staveb]", obal);
    var sablona = pocetEl ? pocetEl.textContent : "";
    function pouzij() {
      var videt = 0;
      polozky.forEach(function (el) {
        var ok = (stav.obor === "vse" || el.dataset.obory.split(" ").indexOf(stav.obor) >= 0)
          && (stav.segment === "vse" || el.dataset.segment === stav.segment)
          && (stav.rok === "vse" || el.dataset.rok === stav.rok);
        el.hidden = !ok;
        if (ok) videt += 1;
      });
      $("[data-prazdno]", obal).hidden = videt > 0;
      vplyn(polozky.filter(function (el) { return !el.hidden; }));
      if (pocetEl) pocetEl.textContent = sablona.replace(/^\D*\d+/, function (m) { return m.replace(/\d+$/, String(videt)); });
    }
    $$("button[data-filtr]", obal).forEach(function (tl) {
      tl.addEventListener("click", function () {
        var klic = tl.dataset.filtr;
        stav[klic] = tl.dataset.hodnota;
        $$("button[data-filtr='" + klic + "']", obal).forEach(function (j) {
          j.setAttribute("aria-pressed", String(j === tl));
        });
        pouzij();
      });
    });
  }

  function filtrujRecenze() {
    var obal = $("[data-seznam-recenzi]");
    if (!obal || !FM.recenze) return;
    var vypis = $("[data-vypis-recenzi]", obal);
    var karty = $$(".recenze-karta", vypis).map(function (el) {
      return { el: el, segment: el.dataset.segment, hodnoceni: Number(el.dataset.hodnoceni), datum: el.dataset.datum };
    });
    var stav = { segment: "vse", razeni: "nejnovejsi" };
    function pouzij() {
      var vybrane = FM.recenze.filtruj(karty, { segment: stav.segment });
      var serazene = FM.recenze.serad(vybrane, stav.razeni);
      karty.forEach(function (k) { k.el.hidden = true; });
      serazene.forEach(function (k) { k.el.hidden = false; vypis.appendChild(k.el); });
      vplyn(serazene.map(function (k) { return k.el; }));
      $("[data-prazdno]", obal).hidden = serazene.length > 0;
    }
    $$("button[data-filtr]", obal).forEach(function (tl) {
      tl.addEventListener("click", function () {
        stav.segment = tl.dataset.hodnota;
        $$("button[data-filtr]", obal).forEach(function (j) { j.setAttribute("aria-pressed", String(j === tl)); });
        pouzij();
      });
    });
    var razeni = $("[data-razeni]", obal);
    if (razeni) razeni.addEventListener("change", function () { stav.razeni = razeni.value; pouzij(); });
  }

  /* ---------- časté dotazy ---------- */
  function dotazy() {
    $$(".dotaz__tlacitko").forEach(function (tl) {
      tl.addEventListener("click", function () {
        var dotaz = tl.closest(".dotaz");
        var otevreno = dotaz.dataset.otevreno === "1";
        dotaz.dataset.otevreno = otevreno ? "0" : "1";
        tl.setAttribute("aria-expanded", otevreno ? "false" : "true");
      });
    });
    var hledat = $("[data-hledat]");
    if (!hledat) return;
    var obal = hledat.closest("[data-dotazy]");
    hledat.addEventListener("input", function () {
      var dotaz = hledat.value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
      var videt = 0;
      $$("[data-dotaz]", obal).forEach(function (el) {
        var text = el.dataset.text.normalize("NFD").replace(/[̀-ͯ]/g, "");
        var ok = !dotaz || dotaz.split(/\s+/).every(function (s) { return text.indexOf(s) >= 0; });
        el.hidden = !ok;
        if (ok) videt += 1;
      });
      $("[data-prazdno]", obal).hidden = videt > 0;
    });
  }

  /* ---------- kalkulačky ---------- */
  function kalkulacky() {
    if (!FM.vypocty) return;
    var V = FM.vypocty;
    var c = function (id) { var el = document.getElementById(id); return el ? Number(el.value) || 0 : 0; };
    var vypis = function (id, text) { var el = $("[data-vystup='" + id + "']"); if (el) el.textContent = text; };

    function vzt() {
      if (!$("[data-kalk='vzt']")) return;
      var n = V.navrhPrutok({ delka: c("vzt-delka"), sirka: c("vzt-sirka"), vyska: c("vzt-vyska"),
        vymeny: c("vzt-vymeny"), osoby: c("vzt-osoby"), davka: c("vzt-davka") });
      var rychlost = c("vzt-rychlost") || 4;
      var d = V.dimenzeKruhova(n.navrh, rychlost);
      var h = V.dimenzeHranata(n.navrh, rychlost, 200);
      vypis("vzt-objem", V.formatujCislo(n.objem, 1) + " m³");
      vypis("vzt-vymeny-out", V.formatujCislo(n.podleVymen) + " m³/h");
      vypis("vzt-osoby-out", V.formatujCislo(n.podleOsob) + " m³/h");
      vypis("vzt-navrh", V.formatujCislo(n.navrh) + " m³/h");
      vypis("vzt-prumer", V.formatujCislo(d.prumer, 1) + " mm");
      vypis("vzt-norma", "Ø " + d.prumerNorm + " mm");
      vypis("vzt-skutecna", V.formatujCislo(d.skutecnaRychlost, 2) + " m/s");
      vypis("vzt-hranate", h.sirka + " × " + h.vyska + " mm");
      prurez(d.prumerNorm, h.sirka, h.vyska);
    }

    /** Živý průřez: kruhové a čtyřhranné potrubí ve stejném měřítku. */
    function prurez(prumer, sirka, vyska) {
      var svg = $("[data-vykres-vzt]");
      if (!svg) return;
      var nejvetsi = Math.max(prumer, sirka, vyska, 1);
      var m = 110 / nejvetsi;
      var r = (prumer * m) / 2;
      var sx = sirka * m, sy = vyska * m;
      var stredK = { x: 82, y: 92 };
      var levo = 232 - sx / 2;
      var kusy = [
        "<circle class='obrys' cx='" + stredK.x + "' cy='" + stredK.y + "' r='" + r.toFixed(1) + "'/>",
        "<path class='proud' d='M " + (stredK.x - r * 0.62) + " " + stredK.y + " H " + (stredK.x + r * 0.62) + "'/>",
        "<path class='kotaCara' d='M " + (stredK.x - r) + " " + (stredK.y + r + 12) + " H " + (stredK.x + r) + "'/>",
        "<text x='" + stredK.x + "' y='" + (stredK.y + r + 26) + "' text-anchor='middle'>\u2300 " + prumer + "</text>",
        "<text x='" + stredK.x + "' y='20' text-anchor='middle'>kruhové</text>",
        "<rect class='obrys obrys--hranaty' x='" + levo.toFixed(1) + "' y='" + (92 - sy / 2).toFixed(1)
          + "' width='" + sx.toFixed(1) + "' height='" + sy.toFixed(1) + "' rx='2'/>",
        "<path class='proud' d='M " + (levo + sx * 0.2) + " 92 H " + (levo + sx * 0.8) + "'/>",
        "<path class='kotaCara' d='M " + levo.toFixed(1) + " " + (92 + sy / 2 + 12).toFixed(1)
          + " H " + (levo + sx).toFixed(1) + "'/>",
        "<text x='232' y='" + (92 + sy / 2 + 26).toFixed(1) + "' text-anchor='middle'>" + sirka + " \u00d7 " + vyska + "</text>",
        "<text x='232' y='20' text-anchor='middle'>čtyřhranné</text>",
      ];
      svg.innerHTML = kusy.join("");
    }
    function tc() {
      if (!$("[data-kalk='tc']")) return;
      var merna = Number(($("#tc-merna") || {}).value || 55);
      var ztrata = V.tepelnaZtrata(c("tc-plocha"), c("tc-vyska"), merna);
      var n = V.navrhTC(ztrata, { tuv: c("tc-tuv") });
      vypis("tc-ztrata", V.formatujCislo(ztrata, 1) + " kW");
      vypis("tc-potreba", V.formatujCislo(n.potreba, 1) + " kW");
      vypis("tc-vykon", n.vykon + " kW");
      vypis("tc-pokryti", n.pokryti + " %");
    }
    function rek() {
      if (!$("[data-kalk='rek']")) return;
      var u = V.usporaRekuperace(c("rek-prutok"), c("rek-hodin"), c("rek-dnu"),
        c("rek-ucinnost"), c("rek-delta"), c("rek-cena"));
      vypis("rek-vykon", V.formatujCislo(u.vykon, 2) + " kW");
      vypis("rek-kwh", V.formatujCislo(u.kwhRok) + " kWh");
      vypis("rek-koruny", V.formatujCislo(u.korunRok) + " Kč");
    }
    var prepocti = function () { vzt(); tc(); rek(); };
    $$("[data-kalk] input, [data-kalk] select").forEach(function (el) {
      el.addEventListener("input", prepocti);
      el.addEventListener("change", prepocti);
    });
    prepocti();
  }

  /* ---------- průvodce poptávkou ---------- */
  function pruvodce() {
    var obal = $("[data-pruvodce]");
    if (!obal || !FM.poptavka) return;
    var P = FM.poptavka;
    var definice = jsonAttr(obal, "data-pruvodce", []);
    var stav = {};
    var index = 0;
    var kontaktniFaze = false;
    var kroky = $("[data-kroky]", obal);
    var shrnutiEl = $("[data-shrnuti]", obal);
    var popisEl = $("[data-krok-popis]", obal);
    var kontaktEl = $("[data-kontakt]", obal);

    function vykresliKrok() {
      var viditelne = P.viditelneKroky(definice, stav);
      if (index >= viditelne.length) index = viditelne.length - 1;
      var krok = viditelne[index];
      if (!krok) return;
      var hodnota = stav[krok.id];
      var vstupy = "";
      if (krok.typ === "volba" || krok.typ === "vicevolba") {
        var mnoho = krok.typ === "vicevolba";
        vstupy = "<div class='volby'>" + krok.moznosti.map(function (m, i) {
          var vybrano = mnoho ? (hodnota || []).indexOf(m.id) >= 0 : hodnota === m.id;
          return "<label class='volba'><input type='" + (mnoho ? "checkbox" : "radio") + "' name='k-" + krok.id
            + "' value='" + m.id + "'" + (vybrano ? " checked" : "") + "><span data-znak='"
            + String(i + 1).padStart(2, "0") + "'>" + m.popis + "</span></label>";
        }).join("") + "</div>";
      } else if (krok.typ === "ano-ne") {
        vstupy = "<div class='volby' style='grid-template-columns:repeat(2,minmax(0,1fr));max-width:24rem'>"
          + [["ano", true], ["ne", false]].map(function (par, i) {
            return "<label class='volba'><input type='radio' name='k-" + krok.id + "' value='" + par[0] + "'"
              + (hodnota === par[1] ? " checked" : "") + "><span data-znak='0" + (i + 1) + "'>"
              + (par[0] === "ano" ? "Ano" : "Ne") + "</span></label>";
          }).join("") + "</div>";
      } else if (krok.typ === "cislo") {
        vstupy = "<input class='vstup' type='number' name='k-" + krok.id + "' value='"
          + (hodnota === undefined ? "" : hodnota) + "' style='max-width:16rem'>";
      } else {
        vstupy = "<textarea class='vstup' name='k-" + krok.id + "' rows='4'>" + (hodnota || "") + "</textarea>";
      }
      kroky.innerHTML = "<div class='karta rohy'><span class='karta__cislo'>"
        + String(index + 1).padStart(2, "0") + "</span><h2 style='font-size:1.3rem'>" + krok.otazka + "</h2>"
        + vstupy + "<p class='chyba' data-chyba-krok hidden></p></div>";
      $$("[name='k-" + krok.id + "']", kroky).forEach(function (el) {
        el.addEventListener("change", function () { uloz(krok); });
        if (el.tagName === "TEXTAREA" || el.type === "number") el.addEventListener("input", function () { uloz(krok); });
      });
      popisEl.textContent = "Krok " + (index + 1) + " z " + viditelne.length;
      $("[data-zpet]", obal).hidden = index === 0;
      var posledni = index === viditelne.length - 1;
      $("[data-dalsi]", obal).hidden = posledni && kontaktniFaze;
      kontaktEl.hidden = !(posledni && kontaktniFaze);
      jenProFirmu(stav.segment === "b2b");
      $("[data-odeslat]", obal).hidden = !(posledni && kontaktniFaze);
      vykresliShrnuti();
    }

    /** Fakturační pole dávají smysl jen firmě; domácnost je nevidí ani nevyplňuje. */
    function jenProFirmu(zobrazit) {
      $$("[data-jen-firma]", kontaktEl).forEach(function (blok) {
        blok.hidden = !zobrazit;
        $$("input, select, textarea", blok).forEach(function (vstup) {
          vstup.disabled = !zobrazit;
          if (!zobrazit) vstup.value = "";
        });
      });
    }

    function uloz(krok) {
      var prvky = $$("[name='k-" + krok.id + "']", kroky);
      if (krok.typ === "vicevolba") {
        stav[krok.id] = prvky.filter(function (e) { return e.checked; }).map(function (e) { return e.value; });
      } else if (krok.typ === "ano-ne") {
        var vybrany = prvky.filter(function (e) { return e.checked; })[0];
        stav[krok.id] = vybrany ? vybrany.value === "ano" : undefined;
      } else if (krok.typ === "volba") {
        var v = prvky.filter(function (e) { return e.checked; })[0];
        stav[krok.id] = v ? v.value : undefined;
      } else if (krok.typ === "cislo") {
        stav[krok.id] = prvky[0].value === "" ? undefined : Number(prvky[0].value);
      } else {
        stav[krok.id] = prvky[0].value;
      }
      stav = P.vycisti(definice, stav);
      vykresliShrnuti();
      aktualizujPostup();
    }

    function vykresliShrnuti() {
      var s = P.shrnuti(definice, stav);
      shrnutiEl.innerHTML = s.length
        ? s.map(function (p) { return "<dt>" + p.otazka + "</dt><dd>" + p.hodnota + "</dd>"; }).join("")
        : "<dd class='tise'>Zatím nic nevybráno.</dd>";
    }
    function aktualizujPostup() {
      var p = P.postup(definice, stav);
      $(".pruvodce__postup i", obal).style.setProperty("--procent", p.procent + "%");
    }

    $("[data-dalsi]", obal).addEventListener("click", function () {
      var viditelne = P.viditelneKroky(definice, stav);
      var krok = viditelne[index];
      var chyba = P.validujKrok(krok, stav[krok.id]);
      var chybaEl = $("[data-chyba-krok]", kroky);
      if (chyba) {
        chybaEl.hidden = false;
        chybaEl.textContent = chyba === "required" ? "Tuhle odpověď potřebujeme." : "Zkontrolujte prosím odpověď.";
        return;
      }
      if (index === viditelne.length - 1) { kontaktniFaze = true; vykresliKrok(); return; }
      index += 1;
      vykresliKrok();
    });
    $("[data-zpet]", obal).addEventListener("click", function () {
      if (kontaktniFaze) { kontaktniFaze = false; vykresliKrok(); return; }
      index = Math.max(0, index - 1);
      vykresliKrok();
    });
    $("[data-odeslat]", obal).addEventListener("click", function () {
      var proFirmu = stav.segment === "b2b";
      var pravidla = { jmeno: ["required"], email: ["required", "email"], telefon: ["telefon"],
        souhlas: ["souhlas"] };
      if (proFirmu) pravidla.ico = ["ico"];
      var hodnoty = {};
      ["jmeno", "email", "telefon"].concat(proFirmu ? ["firma", "ico"] : []).forEach(function (id) {
        var el = document.getElementById(id); if (el) hodnoty[id] = el.value;
      });
      hodnoty.souhlas = (document.getElementById("souhlas") || {}).checked === true;
      var v = FM.validace.validuj(hodnoty, pravidla);
      zobrazChyby(kontaktEl, v.errors);
      if (!v.ok) return;
      ulozPoptavku({
        typ: "poptavka", jmeno: hodnoty.jmeno, email: hodnoty.email, telefon: hodnoty.telefon,
        firma: hodnoty.firma, ico: hodnoty.ico, zprava: P.doTextu(P.shrnuti(definice, stav)),
      });
      $("[data-hotovo]", obal).hidden = false;
      kroky.hidden = true; kontaktEl.hidden = true;
      $$("[data-dalsi],[data-zpet],[data-odeslat]", obal).forEach(function (b) { b.hidden = true; });
    });
    $("[data-znovu]", obal).addEventListener("click", function () { window.location.reload(); });

    vykresliKrok();
    aktualizujPostup();
  }

  /* ---------- přílohy ---------- */
  var HLASKY_PRILOH = {};
  // Co od lidí bereme: výkresy, modely, tabulky, dokumenty a fotky.
  // Archivy ani spustitelné soubory ne — ty bývají nosičem škodlivého kódu.
  var PRIPONY_PRILOH = ["pdf", "dwg", "dxf", "ifc", "stp", "step", "xlsx", "csv", "docx",
    "jpg", "jpeg", "png", "heic", "webp"];
  var MAX_SOUBOR = 15 * 1048576;
  var MAX_CELKEM = 40 * 1048576;
  var MAX_POCET = 10;

  function velikost(bajty) {
    if (bajty >= 1048576) return (bajty / 1048576).toFixed(1).replace(".", ",") + " MB";
    return Math.max(1, Math.round(bajty / 1024)) + " kB";
  }

  function prilohy() {
    $$("[data-prilohy]").forEach(function (obal) {
      HLASKY_PRILOH = jsonAttr(obal, "data-hlasky", HLASKY_PRILOH) || HLASKY_PRILOH;
      var vstup = $("input[type='file']", obal);
      var seznam = $("[data-seznam-priloh]", obal);
      var chyba = $("[data-chyba]", obal);
      var soubory = [];
      obal.soubory = soubory;

      function vykresli() {
        seznam.innerHTML = soubory.map(function (s, i) {
          return "<li><span class='jmeno'>" + s.name.replace(/</g, "&lt;") + "</span>"
            + "<span class='velikost'>" + velikost(s.size) + "</span>"
            + "<button type='button' data-odebrat='" + i + "' aria-label='"
            + (HLASKY_PRILOH.odebrat || "Odebrat") + "'>"
            + "<svg width='16' height='16' viewBox='0 0 20 20' fill='none' stroke='currentColor' stroke-width='1.6'"
            + " stroke-linecap='round'><path d='m5 5 10 10M15 5 5 15'/></svg></button></li>";
        }).join("");
        $$("[data-odebrat]", seznam).forEach(function (b) {
          b.addEventListener("click", function () {
            soubory.splice(Number(b.dataset.odebrat), 1);
            vykresli();
          });
        });
      }

      function odmitni(zprava) {
        chyba.hidden = false;
        chyba.textContent = zprava;
      }

      function pridej(nove) {
        chyba.hidden = true;
        Array.prototype.forEach.call(nove, function (s) {
          var pripona = String(s.name).split(".").pop().toLowerCase();
          if (PRIPONY_PRILOH.indexOf(pripona) < 0) {
            odmitni(String(HLASKY_PRILOH.typ || "{jmeno} nepřijímáme.").replace("{jmeno}", s.name));
            return;
          }
          if (s.size > MAX_SOUBOR) {
            odmitni(String(HLASKY_PRILOH.velke || "{jmeno} je příliš velký.")
              .replace("{jmeno}", s.name).replace("{velikost}", velikost(s.size)));
            return;
          }
          if (soubory.length >= MAX_POCET) {
            odmitni(HLASKY_PRILOH.pocet || "Příliš mnoho souborů.");
            return;
          }
          var celkem = soubory.reduce(function (a, x) { return a + x.size; }, 0);
          if (celkem + s.size > MAX_CELKEM) {
            odmitni(HLASKY_PRILOH.celkem || "Přílohy jsou dohromady moc velké.");
            return;
          }
          var uz = soubory.some(function (x) { return x.name === s.name && x.size === s.size; });
          if (!uz) soubory.push(s);
        });
        vykresli();
      }

      vstup.addEventListener("change", function () { pridej(vstup.files); vstup.value = ""; });
      ["dragenter", "dragover"].forEach(function (udalost) {
        obal.addEventListener(udalost, function (e) { e.preventDefault(); obal.dataset.nad = "1"; });
      });
      ["dragleave", "drop"].forEach(function (udalost) {
        obal.addEventListener(udalost, function (e) { e.preventDefault(); obal.dataset.nad = "0"; });
      });
      obal.addEventListener("drop", function (e) {
        if (e.dataTransfer && e.dataTransfer.files) pridej(e.dataTransfer.files);
      });
    });
  }

  /** Názvy příloh, které se přiloží k textu poptávky. */
  function popisPriloh(korene) {
    var obal = $("[data-prilohy]", korene);
    if (!obal) return "";
    var odkaz = $("input[type='url']", obal);
    var radky = [];
    if (obal.soubory.length) {
      radky.push((HLASKY_PRILOH.seznam || "Přílohy") + ": "
        + obal.soubory.map(function (s) { return s.name + " (" + velikost(s.size) + ")"; }).join(", "));
    }
    if (odkaz && odkaz.value.trim()) radky.push((HLASKY_PRILOH.odkaz || "Odkaz") + ": " + odkaz.value.trim());
    return radky.length ? "\n" + radky.join("\n") : "";
  }

  /* ---------- formuláře ---------- */
  function zobrazChyby(obal, errors) {
    $$("[data-pole]", obal).forEach(function (pole) {
      var kod = errors[pole.dataset.pole];
      var zprava = $("[data-chyba]", pole);
      pole.classList.toggle("pole--chyba", Boolean(kod));
      if (!zprava) return;
      zprava.hidden = !kod;
      zprava.textContent = kod ? HLASKY[kod] || "Zkontrolujte prosím údaj." : "";
    });
  }
  var HLASKY = {
    required: "Tohle pole potřebujeme vyplnit.",
    email: "E-mail nemá správný tvar.",
    telefon: "Telefon nevypadá jako české číslo.",
    ico: "IČO neprošlo kontrolou.",
    psc: "PSČ má mít pět číslic.",
    souhlas: "Bez souhlasu to bohužel nejde.",
    min: "Napište prosím víc.",
    max: "Tohle je moc dlouhé.",
    "jmeno-kratke": "Jméno je moc krátké.",
    "text-kratky": "Napište prosím aspoň pár vět.",
    "text-dlouhy": "Recenze je moc dlouhá.",
    hodnoceni: "Vyberte prosím hodnocení.",
  };

  function ulozPoptavku(poptavka) {
    if (!FM.administrace) return;
    try {
      var stav = FM.administrace.nacti(window.localStorage);
      poptavka.prijato = new Date().toISOString().slice(0, 16).replace("T", " ");
      FM.administrace.uloz(window.localStorage, FM.administrace.pridejPoptavku(stav, poptavka));
    } catch (e) { /* soukromé okno */ }
  }

  function formulare() {
    var pravidla = {
      kontakt: { jmeno: ["required"], email: ["required", "email"], telefon: ["telefon"],
        zprava: ["required", { typ: "min", hodnota: 10 }], souhlas: ["souhlas"] },
      kariera: { jmeno: ["required"], telefon: ["required", "telefon"], email: ["email"],
        zprava: ["required", { typ: "min", hodnota: 10 }], souhlas: ["souhlas"] },
    };
    $$("form[data-formular]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var druh = form.dataset.formular;
        var hodnoty = {};
        $$("input, textarea, select", form).forEach(function (el) {
          hodnoty[el.name || el.id] = el.type === "checkbox" ? el.checked : el.value;
        });
        if (druh === "recenze") {
          var vybrane = $("input[name='hodnoceni']:checked", form);
          hodnoty.hodnoceni = vybrane ? Number(vybrane.value) : 0;
          var v = FM.recenze.validuj(hodnoty);
          zobrazChyby(form, v.errors);
          if (!v.ok) return;
          try {
            var stav = FM.administrace.nacti(window.localStorage);
            var nova = FM.recenze.nova(hodnoty, new Date().toISOString().slice(0, 10));
            nova.stavba = "";
            FM.administrace.uloz(window.localStorage, FM.administrace.ulozPolozku(stav, "recenze", nova, []));
          } catch (err) { /* soukromé okno */ }
        } else {
          var vysledek = FM.validace.validuj(hodnoty, pravidla[druh] || {});
          zobrazChyby(form, vysledek.errors);
          if (!vysledek.ok) return;
          ulozPoptavku({ typ: druh, jmeno: hodnoty.jmeno, email: hodnoty.email,
            telefon: hodnoty.telefon, firma: hodnoty.firma,
            zprava: (hodnoty.zprava || "") + popisPriloh(form) });
        }
        $("[data-hotovo]", form).hidden = false;
        $$("input, textarea, select, button", form).forEach(function (el) { el.disabled = true; });
      });
    });
  }

  /** Načítací překryv zmizí sám (CSS), po načtení stránky ale dřív. */
  function nacitani() {
    var od = Date.now();
    var hotovo = function () {
      var zbyva = Math.max(0, 620 - (Date.now() - od));
      window.setTimeout(function () { document.body.dataset.nacteno = "1"; }, zbyva);
    };
    if (document.readyState === "complete") hotovo();
    else window.addEventListener("load", hotovo);
  }

  function start() {
    nacitani();
    prepisyUdaju();
    prilohy();
    navigace(); prijezd(); rastr(); svitivaMrizka(); pravitko(); pocitadla();
    hero(); naklon(); otacecka(); magnety(); meric(); gantt();
    filtrujStavby(); filtrujRecenze(); dotazy(); kalkulacky(); pruvodce(); formulare();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  window.FMweb = { zobrazChyby: zobrazChyby, HLASKY: HLASKY };
})();
