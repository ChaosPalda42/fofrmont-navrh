"""Akceptační test C-006 — src/lib/obtiznost.mjs (náročnost prostoru)."""
from __future__ import annotations

import pytest

F = [
    {"id": "pristup", "nazev": "Přístup na místo", "vaha": 2,
     "moznosti": [{"id": "volny", "popis": "Volný", "body": 0}, {"id": "uzky", "popis": "Úzký", "body": 5},
                  {"id": "jerab", "popis": "Jen jeřábem", "body": 10}]},
    {"id": "provoz", "nazev": "Provoz budovy", "vaha": 3,
     "moznosti": [{"id": "prazdna", "popis": "Prázdná", "body": 0}, {"id": "cast", "popis": "Částečný", "body": 5},
                  {"id": "nepretrzity", "popis": "Nepřetržitý", "body": 10}]},
    {"id": "pamatka", "nazev": "Památková ochrana", "vaha": 1,
     "moznosti": [{"id": "ne", "popis": "Ne", "body": 0}, {"id": "ano", "popis": "Ano", "body": 10}]},
]
KATALOG = {
    "provoz": {"nepretrzity": "Montáž po etapách a v noci.", "cast": "Koordinace s provozem."},
    "pristup": {"jerab": "Zvedací technika a zábor."},
    "pamatka": {"ano": "Montáž po etapách a v noci."},
}


@pytest.fixture()
def js():
    from tests.jsmod import run_js

    def call(body, **args):
        return run_js("obtiznost.mjs", body, args={"f": F, "k": KATALOG, **args})

    return call


def test_najdi_moznost(js):
    assert js('out(m.najdiMoznost(A.f[0], { pristup: "uzky" }).body);') == 5
    assert js('out(m.najdiMoznost(A.f[0], { pristup: "nesmysl" }));') is None
    assert js("out(m.najdiMoznost(A.f[0], {}));") is None


def test_skore_maximum(js):
    v = js('out(m.skore(A.f, { pristup: "jerab", provoz: "nepretrzity", pamatka: "ano" }));')
    assert v == {"body": 60, "max": 60, "procent": 100, "stupen": "extremni"}


def test_skore_minimum(js):
    v = js('out(m.skore(A.f, { pristup: "volny", provoz: "prazdna", pamatka: "ne" }));')
    assert v == {"body": 0, "max": 60, "procent": 0, "stupen": "bezna"}


def test_skore_nezvoleny_faktor_prispiva_nulou(js):
    v = js('out(m.skore(A.f, { provoz: "nepretrzity" }));')
    assert v["body"] == 30
    assert v["max"] == 60
    assert v["procent"] == 50
    assert v["stupen"] == "slozita"


def test_stupne_podle_hranic(js):
    assert js('out(m.skore(A.f, { pristup: "uzky" }).stupen);') == "bezna"
    assert js('out(m.skore(A.f, { provoz: "cast", pamatka: "ano" }).stupen);') == "narocna"
    assert js("out(m.skore([], {}));") == {"body": 0, "max": 0, "procent": 0, "stupen": "bezna"}


def test_chybejici(js):
    assert js('out(m.chybejici(A.f, { provoz: "cast" }));') == ["pristup", "pamatka"]
    assert js('out(m.chybejici(A.f, { pristup: "volny", provoz: "cast", pamatka: "ne" }));') == []


def test_prispevky(js):
    v = js('out(m.prispevky(A.f, { pristup: "uzky", provoz: "nepretrzity", pamatka: "ano" }));')
    assert v == [
        {"id": "provoz", "nazev": "Provoz budovy", "body": 30, "podil": 60},
        {"id": "pristup", "nazev": "Přístup na místo", "body": 10, "podil": 20},
        {"id": "pamatka", "nazev": "Památková ochrana", "body": 10, "podil": 20},
    ]


def test_prispevky_pri_nulovem_souctu(js):
    v = js('out(m.prispevky(A.f, { pristup: "volny" }));')
    assert [x["podil"] for x in v] == [0, 0, 0]
    assert [x["id"] for x in v] == ["pristup", "provoz", "pamatka"]


def test_doporuceni_je_v_poradi_prispevku_a_bez_duplicit(js):
    v = js('out(m.doporuceni(A.f, { pristup: "jerab", provoz: "nepretrzity", pamatka: "ano" }, A.k));')
    assert v == ["Montáž po etapách a v noci.", "Zvedací technika a zábor."]


def test_doporuceni_prazdne(js):
    assert js('out(m.doporuceni(A.f, { pristup: "volny" }, A.k));') == []


def test_porovnej(js):
    v = js('out(m.porovnej(A.f, { provoz: "nepretrzity" }, { provoz: "cast" }));')
    assert v == {"rozdil": 25, "narocnejsi": "a"}
    assert js('out(m.porovnej(A.f, { provoz: "cast" }, { provoz: "cast" }));') == {"rozdil": 0, "narocnejsi": "shoda"}
    assert js('out(m.porovnej(A.f, {}, { provoz: "cast" }).narocnejsi);') == "b"


def test_popis_stupne(js):
    assert js('out(m.popisStupne("slozita", { slozita: "Složitý prostor" }));') == "Složitý prostor"
    assert js('out(m.popisStupne("slozita", {}));') == "slozita"
