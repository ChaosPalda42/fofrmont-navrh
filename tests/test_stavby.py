"""Akceptační test C-005 — src/lib/stavby.mjs (reference)."""
from __future__ import annotations

import pytest

S = [
    {"id": "poliklinika", "nazev": "Poliklinika Písek", "misto": "Písek", "kraj": "Jihočeský",
     "segment": "b2b", "obory": ["vzt", "chlazeni"], "rok": 2025, "datum": "2025-06-01",
     "perex": "Vestavba strojovny", "rozsah": "1 250 m²"},
    {"id": "hala", "nazev": "Výrobní hala Rakovník", "misto": "Rakovník", "kraj": "Středočeský",
     "segment": "b2b", "obory": ["vzt", "ut"], "rok": 2024, "datum": "2024-09-01",
     "perex": "Vytápění haly", "rozsah": "3,5 MW"},
    {"id": "vila", "nazev": "Vila Hanspaulka", "misto": "Praha", "kraj": "Praha",
     "segment": "b2c", "obory": ["tc", "ut"], "rok": 2025, "datum": "2025-02-01",
     "perex": "Tepelné čerpadlo", "rozsah": "14 kW"},
    {"id": "skola", "nazev": "Základní škola Kladno", "misto": "Kladno", "kraj": "Středočeský",
     "segment": "b2b", "obory": ["vzt"], "rok": 2023, "datum": "2023-08-01", "perex": "Rekuperace učeben"},
]


@pytest.fixture()
def js():
    from tests.jsmod import run_js

    def call(body, **args):
        return run_js("stavby.mjs", body, args={"s": S, **args})

    return call


def test_normalizuj(js):
    assert js('out(m.normalizuj("Příbram ŽŽ"));') == "pribram zz"


def test_filtr_obor(js):
    assert js('out(m.filtruj(A.s, { obor: "vzt" }).map((x) => x.id));') == ["poliklinika", "hala", "skola"]
    assert js('out(m.filtruj(A.s, { obor: "vse" }).length);') == 4
    assert js("out(m.filtruj(A.s, {}).length);") == 4


def test_filtr_segment_kraj_rok(js):
    assert js('out(m.filtruj(A.s, { segment: "b2c" }).map((x) => x.id));') == ["vila"]
    assert js('out(m.filtruj(A.s, { kraj: "Středočeský" }).map((x) => x.id));') == ["hala", "skola"]
    assert js('out(m.filtruj(A.s, { rok: "2025" }).map((x) => x.id));') == ["poliklinika", "vila"]
    assert js("out(m.filtruj(A.s, { rok: 0 }).length);") == 4


def test_filtr_dotaz(js):
    assert js('out(m.filtruj(A.s, { dotaz: "pisek" }).map((x) => x.id));') == ["poliklinika"]
    assert js('out(m.filtruj(A.s, { dotaz: "hala vytapeni" }).map((x) => x.id));') == ["hala"]
    assert js('out(m.filtruj(A.s, { dotaz: "hala praha" }).length);') == 0


def test_filtr_kombinuje_a_nemutuje(js):
    assert js('out(m.filtruj(A.s, { obor: "vzt", kraj: "Středočeský" }).map((x) => x.id));') == ["hala", "skola"]
    assert js('m.filtruj(A.s, { obor: "vzt" }); out(A.s.length);') == 4


def test_facety(js):
    assert js('out(m.facety(A.s, "obory"));') == [
        {"id": "vzt", "pocet": 3}, {"id": "ut", "pocet": 2}, {"id": "chlazeni", "pocet": 1},
        {"id": "tc", "pocet": 1}]
    assert js('out(m.facety(A.s, "segment"));') == [{"id": "b2b", "pocet": 3}, {"id": "b2c", "pocet": 1}]
    assert js('out(m.facety(A.s, "kraj")[0]);') == {"id": "Středočeský", "pocet": 2}


def test_roky(js):
    assert js("out(m.roky(A.s));") == [2025, 2024, 2023]


def test_serad(js):
    assert js('out(m.serad(A.s, "nejnovejsi").map((x) => x.id));') == ["poliklinika", "hala", "vila", "skola"]
    assert js('out(m.serad(A.s, "nejstarsi").map((x) => x.id));') == ["skola", "vila", "hala", "poliklinika"]
    assert js('out(m.serad(A.s, "nazev").map((x) => x.id));') == ["poliklinika", "vila", "hala", "skola"]
    assert js('out(m.serad(A.s, "rozsah").map((x) => x.id));') == ["poliklinika", "vila", "hala", "skola"]


def test_cislo_z_rozsahu(js):
    assert js('out(m.cisloZRozsahu("1 250 m²"));') == 1250
    assert js('out(m.cisloZRozsahu("1 250 m²"));') == 1250
    assert js('out(m.cisloZRozsahu("3,5 MW"));') == 3.5
    assert js('out(m.cisloZRozsahu("bez čísla"));') == 0
    assert js("out(m.cisloZRozsahu(undefined));") == 0


def test_strankuj(js):
    assert js("out(m.strankuj(A.s, 1, 3));") == {
        "polozky": [S[0], S[1], S[2]], "stranka": 1, "stranek": 2, "celkem": 4}
    assert js("out(m.strankuj(A.s, 9, 3).stranka);") == 2
    assert js("out(m.strankuj(A.s, 0, 3).stranka);") == 1
    assert js("out(m.strankuj([], 1, 3));") == {"polozky": [], "stranka": 1, "stranek": 1, "celkem": 0}


def test_podobne(js):
    assert js('out(m.podobne(A.s, "poliklinika").map((x) => x.id));') == ["hala", "skola"]
    assert js('out(m.podobne(A.s, "poliklinika", 1).map((x) => x.id));') == ["hala"]
    assert js('out(m.podobne(A.s, "neznama"));') == []


def test_statistiky(js):
    assert js("out(m.statistiky(A.s));") == {
        "pocet": 4, "obory": 4, "kraje": 3, "odRoku": 2023, "doRoku": 2025, "celkovyRozsah": 1268}
    assert js("out(m.statistiky([]).odRoku);") == 0
