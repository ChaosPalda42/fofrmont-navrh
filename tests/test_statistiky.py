"""Akceptační test C-013 — src/lib/statistiky.mjs (ukázková návštěvnost)."""
from __future__ import annotations

import pytest

# Očekávaná řada pro seed 20260930, 5 dnů, konec 2026-09-30.
RADA = [
    {"datum": "2026-09-26", "navstevy": 21, "uzivatele": 17, "zobrazeni": 43, "poptavky": 0},
    {"datum": "2026-09-27", "navstevy": 23, "uzivatele": 17, "zobrazeni": 53, "poptavky": 0},
    {"datum": "2026-09-28", "navstevy": 35, "uzivatele": 27, "zobrazeni": 78, "poptavky": 1},
    {"datum": "2026-09-29", "navstevy": 47, "uzivatele": 34, "zobrazeni": 122, "poptavky": 0},
    {"datum": "2026-09-30", "navstevy": 41, "uzivatele": 33, "zobrazeni": 85, "poptavky": 0},
]


@pytest.fixture()
def js():
    from tests.jsmod import run_js

    def call(body, **args):
        return run_js("statistiky.mjs", body, args={"r": RADA, **args})

    return call


def test_nahodne_je_deterministicke(js):
    v = js("const g = m.nahodne(7); out([g(), g(), g()].map((x) => Math.round(x * 1e10) / 1e10));")
    assert v == [0.2387808398, 0.9134932647, 0.6124916663]
    assert js("const a = m.nahodne(3), b = m.nahodne(3); out(a() === b());") is True


def test_nahodne_je_v_rozsahu(js):
    body = "const g = m.nahodne(123); let ok = true; for (let i = 0; i < 400; i += 1) { const x = g(); if (!(x >= 0 && x < 1)) ok = false; } out(ok);"
    assert js(body) is True


def test_generuj_presnou_radu(js):
    assert js('out(m.generuj(20260930, 5, "2026-09-30"));') == RADA


def test_generuj_je_reprodukovatelne(js):
    body = 'out(JSON.stringify(m.generuj(42, 12, "2026-06-15")) === JSON.stringify(m.generuj(42, 12, "2026-06-15")));'
    assert js(body) is True
    assert js('out(m.generuj(1, 30, "2026-06-15").length);') == 30
    assert js('out(m.generuj(1, 0, "2026-06-15"));') == []


def test_generuj_konci_zadanym_dnem(js):
    assert js('out(m.generuj(5, 3, "2026-01-02").map((d) => d.datum));') == ["2025-12-31", "2026-01-01", "2026-01-02"]


def test_vyrez_a_predchozi(js):
    assert js("out(m.vyrez(A.r, 2).map((d) => d.datum));") == ["2026-09-29", "2026-09-30"]
    assert js("out(m.vyrez(A.r, 99).length);") == 5
    assert js("out(m.vyrez(A.r, 0));") == []
    assert js("out(m.predchozi(A.r, 2).map((d) => d.datum));") == ["2026-09-27", "2026-09-28"]
    assert js("out(m.predchozi(A.r, 4).map((d) => d.datum));") == ["2026-09-26"]
    assert js("out(m.predchozi(A.r, 5));") == []
    assert js("m.vyrez(A.r, 2); out(A.r.length);") == 5


def test_souhrn(js):
    assert js("out(m.souhrn(A.r));") == {
        "navstevy": 167, "uzivatele": 128, "zobrazeni": 381, "poptavky": 1, "maximum": 47, "dnu": 5}
    assert js("out(m.souhrn([]));") == {
        "navstevy": 0, "uzivatele": 0, "zobrazeni": 0, "poptavky": 0, "maximum": 0, "dnu": 0}


def test_zmena(js):
    assert js("out([m.zmena(120, 100), m.zmena(80, 100), m.zmena(100, 100), m.zmena(5, 0)]);") == [20, -20, 0, 0]


def test_porovnani(js):
    v = js("out(m.porovnani(A.r, 2));")
    assert v["navstevy"] == {"hodnota": 88, "zmena": 52}
    assert v["poptavky"] == {"hodnota": 0, "zmena": -100}
    assert set(v) == {"navstevy", "uzivatele", "zobrazeni", "poptavky"}


def test_krivka(js):
    v = js('out(m.krivka(A.r, "navstevy", 100, 40));')
    assert v["max"] == 47
    assert v["body"][0] == {"x": 0, "y": 22.13}
    assert v["body"][4] == {"x": 100, "y": 5.11}
    assert v["cesta"].startswith("M 0 22.13 L 25 ")
    assert v["plocha"].endswith("L 100 40 L 0 40 Z")
    assert js('out(m.krivka([], "navstevy", 100, 40));') == {"body": [], "cesta": "", "plocha": "", "max": 1}


def test_krivka_jedna_polozka(js):
    v = js('out(m.krivka([{ navstevy: 10 }], "navstevy", 100, 40));')
    assert v["body"] == [{"x": 0, "y": 0}]


def test_osa(js):
    assert js("out(m.osa(A.r, 3));") == [
        {"index": 0, "datum": "2026-09-26"}, {"index": 2, "datum": "2026-09-28"}, {"index": 4, "datum": "2026-09-30"}]
    assert js("out(m.osa(A.r, 1));") == [{"index": 0, "datum": "2026-09-26"}]
    assert js("out(m.osa([], 3));") == []
    assert len(js("out(m.osa(A.r, 9));")) == 5


def test_podily(js):
    polozky = [{"id": "vyhledavace", "hodnota": 120}, {"id": "primo", "hodnota": 60},
               {"id": "odkazy", "hodnota": 20}, {"id": "site", "hodnota": 0}]
    v = js("out(m.podily(A.p));", p=polozky)
    assert v == [
        {"id": "vyhledavace", "hodnota": 120, "podil": 60},
        {"id": "primo", "hodnota": 60, "podil": 30},
        {"id": "odkazy", "hodnota": 20, "podil": 10},
        {"id": "site", "hodnota": 0, "podil": 0},
    ]
    assert js("out(m.podily([{ id: 'a', hodnota: 0 }])[0].podil);") == 0
    assert js("m.podily(A.p); out(A.p[0].id);", p=polozky) == "vyhledavace"


def test_podily_shoda_radi_podle_id(js):
    v = js("out(m.podily([{ id: 'b', hodnota: 5 }, { id: 'a', hodnota: 5 }]).map((x) => x.id));")
    assert v == ["a", "b"]


def test_formatuj_trvani(js):
    assert js("out([m.formatujTrvani(154), m.formatujTrvani(59), m.formatujTrvani(600), m.formatujTrvani(-3), m.formatujTrvani('x')]);") == [
        "2:34", "0:59", "10:00", "0:00", "0:00"]
