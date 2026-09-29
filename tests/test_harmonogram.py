"""Akceptační test C-010 — src/lib/harmonogram.mjs."""
from __future__ import annotations

import pytest

FAZE = [
    {"id": "priprava", "nazev": "Příprava a zaměření", "dny": 3},
    {"id": "rozvody", "nazev": "Rozvody potrubí", "dny": 5, "zavisi": ["priprava"]},
    {"id": "stroje", "nazev": "Osazení strojů", "dny": 4, "zavisi": ["priprava"]},
    {"id": "zapojeni", "nazev": "Zapojení a zkoušky", "dny": 2, "zavisi": ["rozvody", "stroje"]},
]


@pytest.fixture()
def js():
    from tests.jsmod import run_js

    def call(body, **args):
        return run_js("harmonogram.mjs", body, args={"f": FAZE, **args})

    return call


def test_je_vikend(js):
    assert js('out(["2026-03-06", "2026-03-07", "2026-03-08", "2026-03-09"].map(m.jeVikend));') == [
        False, True, True, False]


def test_posun_dny(js):
    assert js('out(m.posunDny("2026-02-28", 1));') == "2026-03-01"
    assert js('out(m.posunDny("2026-03-01", -1));') == "2026-02-28"
    assert js('out(m.posunDny("2024-02-28", 1));') == "2024-02-29"


def test_prvni_pracovni(js):
    assert js('out(m.prvniPracovni("2026-03-07"));') == "2026-03-09"
    assert js('out(m.prvniPracovni("2026-03-02"));') == "2026-03-02"


def test_posun_pracovni(js):
    assert js('out(m.posunPracovni("2026-03-02", 1));') == "2026-03-03"
    assert js('out(m.posunPracovni("2026-03-06", 1));') == "2026-03-09"
    assert js('out(m.posunPracovni("2026-03-07", 0));') == "2026-03-09"
    assert js('out(m.posunPracovni("2026-03-02", 5));') == "2026-03-09"


def test_pracovnich_dnu(js):
    assert js('out(m.pracovnichDnu("2026-03-02", "2026-03-13"));') == 10
    assert js('out(m.pracovnichDnu("2026-03-02", "2026-03-02"));') == 1
    assert js('out(m.pracovnichDnu("2026-03-13", "2026-03-02"));') == 0


def test_naplanuj(js):
    plan = js('out(m.naplanuj(A.f, "2026-03-02"));')
    assert [(p["id"], p["start"], p["konec"]) for p in plan] == [
        ("priprava", "2026-03-02", "2026-03-04"),
        ("rozvody", "2026-03-05", "2026-03-11"),
        ("stroje", "2026-03-05", "2026-03-10"),
        ("zapojeni", "2026-03-12", "2026-03-13"),
    ]
    assert plan[0]["nazev"] == "Příprava a zaměření"
    assert plan[1]["dny"] == 5


def test_naplanuj_zacina_o_vikendu_v_pondeli(js):
    assert js('out(m.naplanuj(A.f, "2026-03-07")[0].start);') == "2026-03-09"


def test_naplanuj_nemutuje_vstup(js):
    assert js('m.naplanuj(A.f, "2026-03-02"); out(A.f[1].zavisi);') == ["priprava"]


def test_naplanuj_ignoruje_nezname_zavislosti(js):
    body = 'out(m.naplanuj([{ id: "a", nazev: "A", dny: 2, zavisi: ["neni"] }], "2026-03-02")[0].start);'
    assert js(body) == "2026-03-02"


def test_trvani(js):
    assert js('out(m.trvani(m.naplanuj(A.f, "2026-03-02")));') == {
        "start": "2026-03-02", "konec": "2026-03-13", "pracovnichDnu": 10, "kalendarnichDnu": 12}
    assert js("out(m.trvani([]));") == {"start": "", "konec": "", "pracovnichDnu": 0, "kalendarnichDnu": 0}


def test_pozice(js):
    assert js('out(m.pozice(m.naplanuj(A.f, "2026-03-02")));') == [
        {"id": "priprava", "levo": 0, "sirka": 25},
        {"id": "rozvody", "levo": 25, "sirka": 58.33},
        {"id": "stroje", "levo": 25, "sirka": 50},
        {"id": "zapojeni", "levo": 83.33, "sirka": 16.67},
    ]
    assert js("out(m.pozice([]));") == []


def test_kriticka_cesta(js):
    assert js("out(m.kritickaCesta(A.f));") == ["priprava", "rozvody", "zapojeni"]
    assert js("out(m.kritickaCesta([]));") == []
    assert js('out(m.kritickaCesta([{ id: "a", dny: 1 }, { id: "b", dny: 9 }]));') == ["b"]
