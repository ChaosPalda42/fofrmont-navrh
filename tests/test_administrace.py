"""Akceptační test C-003 — src/lib/administrace.mjs (demo administrace)."""
from __future__ import annotations

import pytest

ULOZISTE = """
const U = { data: {},
  getItem: (k) => (Object.prototype.hasOwnProperty.call(U.data, k) ? U.data[k] : null),
  setItem: (k, v) => { U.data[k] = String(v); },
  removeItem: (k) => { delete U.data[k]; } };
"""
ZAKLAD_R = [
    {"id": "z1", "jmeno": "Alena", "datum": "2025-01-01", "stav": "schvalena", "hodnoceni": 5},
    {"id": "z2", "jmeno": "Bohdan", "datum": "2026-01-01", "stav": "schvalena", "hodnoceni": 4},
]
ZAKLAD_S = [
    {"id": "poliklinika", "nazev": "Poliklinika", "datum": "2025-05-01"},
    {"id": "hala", "nazev": "Hala", "datum": "2024-05-01"},
]


@pytest.fixture()
def js():
    from tests.jsmod import run_js

    def call(body, **args):
        return run_js("administrace.mjs", ULOZISTE + body,
                      args={"zr": ZAKLAD_R, "zs": ZAKLAD_S, **args})

    return call


def test_klic_a_prazdny_stav(js):
    assert js("out(m.KLIC);") == "fofrmont-admin-v1"
    assert js("out(m.prazdnyStav());") == {
        "texty": {},
        "recenze": {"pridane": [], "upravene": {}, "smazane": [], "stavy": {}},
        "stavby": {"pridane": [], "upravene": {}, "smazane": []},
        "poptavky": [], "zmeneno": None,
    }


def test_nacti_z_prazdneho_uloziste(js):
    assert js("out(m.nacti(U));") == js("out(m.prazdnyStav());")


def test_nacti_snese_rozbity_obsah(js):
    assert js('U.setItem(m.KLIC, "{nesmysl"); out(m.nacti(U).texty);') == {}
    assert js('U.setItem(m.KLIC, "[1,2]"); out(m.nacti(U).recenze.pridane);') == []


def test_nacti_doplni_chybejici_casti(js):
    v = js('U.setItem(m.KLIC, JSON.stringify({ texty: { cs: { a: "b" } } })); out(m.nacti(U));')
    assert v["texty"] == {"cs": {"a": "b"}}
    assert v["stavby"] == {"pridane": [], "upravene": {}, "smazane": []}
    assert v["poptavky"] == []


def test_uloz_a_vymaz(js):
    v = js("out(m.uloz(U, m.prazdnyStav()).zmeneno);")
    assert isinstance(v, str) and v.endswith("Z")
    assert js("m.uloz(U, m.prazdnyStav()); out(JSON.parse(U.getItem(m.KLIC)).texty);") == {}
    assert js("m.uloz(U, m.prazdnyStav()); m.vymaz(U); out(U.getItem(m.KLIC));") is None


def test_nastav_text_a_slozeni(js):
    assert js('out(m.nastavText(m.prazdnyStav(), "cs", "hero.nadpis", "Montujeme").texty);') == {
        "cs": {"hero.nadpis": "Montujeme"}}
    assert js('const s = m.nastavText(m.prazdnyStav(), "cs", "a", "x"); out(m.nastavText(s, "cs", "a", "   ").texty);') == {"cs": {}}
    assert js('const s = m.prazdnyStav(); m.nastavText(s, "cs", "a", "x"); out(s.texty);') == {}


def test_texty_pro_jazyk(js):
    body = ('const s = m.nastavText(m.nastavText(m.prazdnyStav(), "cs", "a", "A2"), "en", "a", "EN");'
            'out(m.textyProJazyk(s, "cs", { a: "A", b: "B" }));')
    assert js(body) == {"a": "A2", "b": "B"}
    body2 = ('const s = m.nastavText(m.prazdnyStav(), "cs", "novy", "N");'
             'out(m.textyProJazyk(s, "cs", { a: "A" }));')
    assert js(body2) == {"a": "A", "novy": "N"}


def test_uloz_polozku_nova_jde_na_zacatek(js):
    body = ('let s = m.ulozPolozku(m.prazdnyStav(), "stavby", { nazev: "Nová hala" }, A.zs);'
            's = m.ulozPolozku(s, "stavby", { nazev: "Další" }, A.zs);'
            'out(s.stavby.pridane.map((x) => x.id));')
    assert js(body) == ["dalsi", "nova-hala"]


def test_uloz_polozku_resi_kolizi_id(js):
    body = ('out(m.ulozPolozku(m.prazdnyStav(), "stavby", { nazev: "Poliklinika" }, A.zs).stavby.pridane[0].id);')
    assert js(body) == "poliklinika-2"


def test_uloz_polozku_upravuje_zaklad(js):
    body = ('const s = m.ulozPolozku(m.prazdnyStav(), "stavby", { id: "hala", nazev: "Hala II" }, A.zs);'
            'out(s.stavby.upravene);')
    assert js(body) == {"hala": {"id": "hala", "nazev": "Hala II"}}


def test_uloz_polozku_slucuje_opakovanou_upravu(js):
    body = ('let s = m.ulozPolozku(m.prazdnyStav(), "stavby", { id: "hala", nazev: "Hala II" }, A.zs);'
            's = m.ulozPolozku(s, "stavby", { id: "hala", misto: "Brno" }, A.zs);'
            'out(s.stavby.upravene.hala);')
    assert js(body) == {"id": "hala", "nazev": "Hala II", "misto": "Brno"}


def test_uloz_polozku_prepise_pridanou_na_miste(js):
    body = ('let s = m.ulozPolozku(m.prazdnyStav(), "stavby", { nazev: "A" }, A.zs);'
            's = m.ulozPolozku(s, "stavby", { nazev: "B" }, A.zs);'
            's = m.ulozPolozku(s, "stavby", { id: "a", nazev: "A nová" }, A.zs);'
            'out(s.stavby.pridane.map((x) => x.nazev));')
    assert js(body) == ["B", "A nová"]


def test_uloz_polozku_ignoruje_neznamou_sekci(js):
    assert js('out(m.ulozPolozku(m.prazdnyStav(), "cokoli", { nazev: "X" }).texty);') == {}


def test_smaz_polozku(js):
    assert js('out(m.smazPolozku(m.prazdnyStav(), "stavby", "hala").stavby.smazane);') == ["hala"]
    body = ('let s = m.ulozPolozku(m.prazdnyStav(), "stavby", { nazev: "A" }, A.zs);'
            's = m.smazPolozku(s, "stavby", "a"); out([s.stavby.pridane.length, s.stavby.smazane.length]);')
    assert js(body) == [0, 0]
    body2 = ('let s = m.ulozPolozku(m.prazdnyStav(), "stavby", { id: "hala", nazev: "X" }, A.zs);'
             's = m.smazPolozku(s, "stavby", "hala"); out([s.stavby.smazane, s.stavby.upravene]);')
    assert js(body2) == [["hala"], {}]


def test_smaz_polozku_bez_duplicit(js):
    body = ('let s = m.smazPolozku(m.prazdnyStav(), "stavby", "hala");'
            's = m.smazPolozku(s, "stavby", "hala"); out(s.stavby.smazane);')
    assert js(body) == ["hala"]


def test_zmen_stav_recenze(js):
    assert js('out(m.zmenStavRecenze(m.prazdnyStav(), "z1", "skryta").recenze.stavy);') == {"z1": "skryta"}
    assert js('out(m.zmenStavRecenze(m.prazdnyStav(), "z1", "nesmysl").recenze.stavy);') == {}
    body = ('const s = m.zmenStavRecenze(m.prazdnyStav(), "z1", "skryta");'
            'out(m.slozSeznam(s, "recenze", A.zr).find((x) => x.id === "z1").stav);')
    assert js(body) == "skryta"


def test_zmen_stav_u_pridane_recenze(js):
    body = ('let s = m.ulozPolozku(m.prazdnyStav(), "recenze", { id: "nova", jmeno: "C", datum: "2026-02-02", stav: "ceka" }, A.zr);'
            's = m.zmenStavRecenze(s, "nova", "schvalena");'
            'out(m.slozSeznam(s, "recenze", A.zr).find((x) => x.id === "nova").stav);')
    assert js(body) == "schvalena"


def test_sloz_seznam_radi_podle_data(js):
    body = ('const s = m.ulozPolozku(m.prazdnyStav(), "recenze", { id: "p1", jmeno: "P", datum: "2026-01-01" }, A.zr);'
            'out(m.slozSeznam(s, "recenze", A.zr).map((x) => x.id));')
    assert js(body) == ["p1", "z2", "z1"]


def test_sloz_seznam_vynecha_smazane_a_aplikuje_upravy(js):
    body = ('let s = m.smazPolozku(m.prazdnyStav(), "stavby", "hala");'
            's = m.ulozPolozku(s, "stavby", { id: "poliklinika", misto: "Písek" }, A.zs);'
            'out(m.slozSeznam(s, "stavby", A.zs));')
    assert js(body) == [{"id": "poliklinika", "nazev": "Poliklinika", "datum": "2025-05-01", "misto": "Písek"}]


def test_sloz_seznam_nemutuje_zaklad(js):
    body = ('const s = m.ulozPolozku(m.prazdnyStav(), "stavby", { id: "hala", nazev: "X" }, A.zs);'
            'm.slozSeznam(s, "stavby", A.zs); out(A.zs.map((x) => x.nazev));')
    assert js(body) == ["Poliklinika", "Hala"]


def test_pridej_poptavku(js):
    body = ('const s = m.pridejPoptavku(m.prazdnyStav(), { jmeno: "Jan Novák", email: "a@b.cz", prijato: "2026-03-01" });'
            'out(s.poptavky[0]);')
    v = js(body)
    assert v["jmeno"] == "Jan Novák"
    assert v["precteno"] is False
    assert v["prijato"] == "2026-03-01"
    assert v["id"].endswith("jan-novak")


def test_poptavky_jdou_na_zacatek_a_maji_strop(js):
    body = ('let s = m.prazdnyStav();'
            'for (let i = 0; i < 60; i += 1) { s = m.pridejPoptavku(s, { jmeno: "J" + i }); }'
            'out([s.poptavky.length, s.poptavky[0].jmeno]);')
    assert js(body) == [50, "J59"]


def test_oznac_prectene_a_smaz(js):
    body = ('let s = m.pridejPoptavku(m.prazdnyStav(), { id: "p1", jmeno: "A" });'
            's = m.oznacPrectene(s, "p1"); out(s.poptavky[0].precteno);')
    assert js(body) is True
    body2 = ('let s = m.pridejPoptavku(m.prazdnyStav(), { id: "p1", jmeno: "A" });'
             's = m.oznacPrectene(s, "neznamy"); out(s.poptavky[0].precteno);')
    assert js(body2) is False
    body3 = ('let s = m.pridejPoptavku(m.prazdnyStav(), { id: "p1", jmeno: "A" });'
             's = m.smazPoptavku(s, "p1"); out(s.poptavky);')
    assert js(body3) == []


def test_statistiky(js):
    body = ('let s = m.ulozPolozku(m.prazdnyStav(), "recenze", { id: "nova", jmeno: "C", datum: "2026-02-02", stav: "ceka" }, A.zr);'
            's = m.pridejPoptavku(s, { id: "p1", jmeno: "A" });'
            's = m.nastavText(s, "cs", "a", "x"); s = m.nastavText(s, "en", "a", "y");'
            'out(m.statistiky(s, A.zr, A.zs));')
    assert js(body) == {"recenzeCeka": 1, "recenzeCelkem": 3, "stavbyCelkem": 2,
                        "poptavkyNeprectene": 1, "textyZmeneno": 2}


def test_export_a_import(js):
    body = ('const s = m.nastavText(m.prazdnyStav(), "cs", "a", "x");'
            'const v = m.importJson(m.prazdnyStav(), m.exportJson(s)); out([v.ok, v.stav.texty]);')
    assert js(body) == [True, {"cs": {"a": "x"}}]
    v = js('out(m.importJson(m.prazdnyStav(), "{rozbite"));')
    assert v["ok"] is False and isinstance(v["chyba"], str) and v["chyba"]


def test_import_doplni_chybejici_casti(js):
    assert js('out(m.importJson(m.prazdnyStav(), JSON.stringify({ texty: {} })).stav.poptavky);') == []


def test_slug(js):
    assert js('out(m.slug("Výměna VZT — Školka Příbram 3"));') == "vymena-vzt-skolka-pribram-3"
