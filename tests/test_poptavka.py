"""Akceptační test C-002 — src/lib/poptavka.mjs (průvodce poptávkou)."""
from __future__ import annotations

import pytest

DEF = [
    {"id": "segment", "otazka": "Kdo poptává?", "typ": "volba", "povinne": True,
     "moznosti": [{"id": "b2b", "popis": "Firma"}, {"id": "b2c", "popis": "Domácnost"}]},
    {"id": "obory", "otazka": "Co potřebujete?", "typ": "vicevolba", "povinne": True, "min": 1, "max": 3,
     "moznosti": [{"id": "vzt", "popis": "Vzduchotechnika"}, {"id": "ut", "popis": "Vytápění"},
                  {"id": "tc", "popis": "Tepelné čerpadlo"}]},
    {"id": "vykres", "otazka": "Máte projekt?", "typ": "ano-ne", "povinne": True,
     "podminka": {"krok": "segment", "hodnota": "b2b"}},
    {"id": "dum", "otazka": "Typ objektu", "typ": "text", "min": 3,
     "podminka": {"krok": "segment", "hodnota": "b2c"}},
    {"id": "plocha", "otazka": "Plocha v m2", "typ": "cislo", "min": 10, "max": 10000,
     "podminka": {"krok": "obory", "jednaZ": ["vzt", "tc"]}},
    {"id": "pozn", "otazka": "Poznámka", "typ": "text", "max": 500},
]
B2B = {"segment": "b2b", "obory": ["vzt"]}


@pytest.fixture()
def js():
    from tests.jsmod import run_js

    def call(body, **args):
        return run_js("poptavka.mjs", body, args={"d": DEF, "b2b": B2B, **args})

    return call


def test_vyplneno(js):
    assert js("out([undefined, null, '', '   ', []].map(m.vyplneno));") == [False] * 5
    assert js("out([0, false, 'x', ['a']].map(m.vyplneno));") == [True] * 4


def test_viditelne_kroky_na_prazdnem_stavu(js):
    assert js("out(m.viditelneKroky(A.d, {}).map((k) => k.id));") == ["segment", "obory", "pozn"]


def test_viditelne_kroky_pro_firmu(js):
    assert js("out(m.viditelneKroky(A.d, A.b2b).map((k) => k.id));") == [
        "segment", "obory", "vykres", "plocha", "pozn"]


def test_viditelne_kroky_pro_domacnost(js):
    assert js('out(m.viditelneKroky(A.d, { segment: "b2c", obory: ["ut"] }).map((k) => k.id));') == [
        "segment", "obory", "dum", "pozn"]


def test_splnena_podminka_bez_podminky(js):
    assert js("out(m.splnenaPodminka(undefined, {}));") is True


def test_splnena_podminka_jedna_z_nad_polem(js):
    assert js('out(m.splnenaPodminka({ krok: "obory", jednaZ: ["tc"] }, { obory: ["ut", "tc"] }));') is True
    assert js('out(m.splnenaPodminka({ krok: "obory", jednaZ: ["tc"] }, { obory: ["ut"] }));') is False


def test_splnena_podminka_bez_hodnoty_znamena_vyplneno(js):
    assert js('out(m.splnenaPodminka({ krok: "pozn" }, { pozn: "ahoj" }));') is True
    assert js('out(m.splnenaPodminka({ krok: "pozn" }, { pozn: "  " }));') is False


def test_validuj_krok_povinne(js):
    assert js("out(m.validujKrok(A.d[0], undefined));") == "required"
    assert js("out(m.validujKrok(A.d[5], undefined));") is None


def test_validuj_krok_volba(js):
    assert js('out(m.validujKrok(A.d[0], "b2b"));') is None
    assert js('out(m.validujKrok(A.d[0], "nesmysl"));') == "volba"


def test_validuj_krok_vicevolba(js):
    assert js('out(m.validujKrok(A.d[1], ["vzt", "ut"]));') is None
    assert js('out(m.validujKrok(A.d[1], ["vzt", "xx"]));') == "volba"
    assert js('out(m.validujKrok(A.d[1], "vzt"));') == "volba"
    assert js('out(m.validujKrok(A.d[1], ["vzt", "ut", "tc", "vzt"]));') == "max"


def test_validuj_krok_cislo(js):
    assert js('out(m.validujKrok(A.d[4], "120"));') is None
    assert js("out(m.validujKrok(A.d[4], 5));") == "min"
    assert js("out(m.validujKrok(A.d[4], 20000));") == "max"
    assert js('out(m.validujKrok(A.d[4], "abc"));') == "cislo"


def test_validuj_krok_text_a_ano_ne(js):
    assert js('out(m.validujKrok(A.d[3], "dům"));') is None
    assert js('out(m.validujKrok(A.d[3], "a "));') == "min"
    assert js("out(m.validujKrok(A.d[2], true));") is None
    assert js('out(m.validujKrok(A.d[2], "ano"));') == "volba"


def test_chyby_jen_pro_viditelne(js):
    assert js("out(m.chyby(A.d, {}));") == {"segment": "required", "obory": "required"}
    assert js('out(m.chyby(A.d, { segment: "b2b", obory: ["vzt"] }));') == {"vykres": "required"}


def test_dalsi_a_predchozi_krok(js):
    assert js("out(m.dalsiKrok(A.d, A.b2b, null));") == "segment"
    assert js('out(m.dalsiKrok(A.d, A.b2b, "obory"));') == "vykres"
    assert js('out(m.dalsiKrok(A.d, A.b2b, "pozn"));') is None
    assert js('out(m.dalsiKrok(A.d, {}, "vykres"));') is None
    assert js('out(m.predchoziKrok(A.d, A.b2b, "vykres"));') == "obory"
    assert js('out(m.predchoziKrok(A.d, A.b2b, "segment"));') is None


def test_postup(js):
    assert js("out(m.postup(A.d, {}));") == {"hotovo": 0, "celkem": 3, "procent": 0}
    assert js("out(m.postup(A.d, A.b2b));") == {"hotovo": 2, "celkem": 5, "procent": 40}
    assert js("out(m.postup([], {}).procent);") == 0


def test_lze_odeslat(js):
    assert js("out(m.lzeOdeslat(A.d, A.b2b));") is False
    assert js('out(m.lzeOdeslat(A.d, { segment: "b2b", obory: ["vzt"], vykres: true, plocha: 500 }));') is True


def test_popis_hodnoty(js):
    assert js('out(m.popisHodnoty(A.d[0], "b2b"));') == "Firma"
    assert js('out(m.popisHodnoty(A.d[1], ["tc", "vzt"]));') == "Tepelné čerpadlo, Vzduchotechnika"
    assert js("out(m.popisHodnoty(A.d[2], false));") == "ne"
    assert js("out(m.popisHodnoty(A.d[4], 120));") == "120"
    assert js("out(m.popisHodnoty(A.d[5], undefined));") == ""
    assert js('out(m.popisHodnoty(A.d[0], "neznama"));') == "neznama"


def test_shrnuti_a_text(js):
    s = js('out(m.shrnuti(A.d, { segment: "b2c", obory: ["ut"], dum: "rodinný dům" }));')
    assert s == [
        {"id": "segment", "otazka": "Kdo poptává?", "hodnota": "Domácnost"},
        {"id": "obory", "otazka": "Co potřebujete?", "hodnota": "Vytápění"},
        {"id": "dum", "otazka": "Typ objektu", "hodnota": "rodinný dům"},
    ]
    assert js('out(m.doTextu(m.shrnuti(A.d, { segment: "b2c" })));') == "Kdo poptává?: Domácnost"
    assert js("out(m.doTextu([]));") == ""


def test_vycisti_zahodi_skryte_i_nezname_klice(js):
    assert js('out(m.vycisti(A.d, { segment: "b2c", vykres: true, dum: "dům", nesmysl: 1 }));') == {
        "segment": "b2c", "dum": "dům"}
