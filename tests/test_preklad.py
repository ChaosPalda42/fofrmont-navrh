"""Akceptační test C-012 — tools/preklad.py."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

CS = {
    "nav": {"uvod": "Úvod", "stavby": "Stavby"},
    "hero": {"lead": "Montujeme <strong>TZB</strong> už {roky} let.", "prazdne": "  "},
    "vyhody": ["Rychle", "Přesně"],
    "cislo": 42,
}


@pytest.fixture()
def modul():
    from tools import preklad

    return preklad


def test_plochy(modul):
    p = modul.plochy(CS)
    assert p["nav.uvod"] == "Úvod"
    assert p["vyhody.1"] == "Přesně"
    assert "hero.prazdne" not in p
    assert "cislo" not in p


def test_davky(modul):
    assert modul.davky([1, 2, 3, 4, 5], 2) == [[1, 2], [3, 4], [5]]
    assert modul.davky([1, 2], 0) == [[1, 2]]
    assert modul.davky([], 3) == []


def test_sestav_prompt_obsahuje_klice_i_texty(modul):
    p = modul.sestav_prompt([("nav.uvod", "Úvod")], "angličtina")
    assert "nav.uvod" in p and "Úvod" in p and "angličtina" in p
    assert "JSON" in p.upper()


def test_vytahni_json(modul):
    assert modul.vytahni_json('```json\n{"a": "b"}\n```') == {"a": "b"}
    assert modul.vytahni_json('Tady je výsledek: {"a": "b"} a hotovo') == {"a": "b"}
    assert modul.vytahni_json("bez jsonu") == {}
    assert modul.vytahni_json('{"a": ') == {}


def test_znacky(modul):
    assert modul.znacky("Ahoj <b>světe</b> {jmeno}") == ["<b>", "</b>", "{jmeno}"]
    assert modul.znacky("nic") == []


def test_znacky_sedi(modul):
    assert modul.znacky_sedi("A <b>x</b> {n}", "A {n} <b>y</b>") is True
    assert modul.znacky_sedi("A <b>x</b>", "A x") is False
    assert modul.znacky_sedi("{a}", "{b}") is False


def test_zpracuj_odpoved(modul):
    davka = [("a", "Ahoj <b>x</b>"), ("b", "Text"), ("c", "Další")]
    odpoved = json.dumps({"a": "Hi <b>x</b>", "b": "Text EN", "d": "navic"})
    preklady, problemy = modul.zpracuj_odpoved(odpoved, davka)
    assert preklady == {"a": "Hi <b>x</b>", "b": "Text EN"}
    assert problemy == ["c"]


def test_zpracuj_odpoved_hlida_znacky(modul):
    davka = [("a", "Ahoj <b>x</b>")]
    preklady, problemy = modul.zpracuj_odpoved(json.dumps({"a": "Hi x"}), davka)
    assert preklady == {}
    assert problemy == ["a"]


def test_prelozi(modul):
    volani = []

    def klient(prompt: str) -> str:
        volani.append(prompt)
        return json.dumps({k: "EN " + k for k in ("nav.uvod", "nav.stavby", "hero.lead", "vyhody.0", "vyhody.1")})

    preklady, problemy = modul.prelozi(CS, "angličtina", klient, velikost_davky=2)
    assert len(volani) == 3
    assert preklady["nav.uvod"] == "EN nav.uvod"
    assert "hero.lead" in problemy


def test_prelozi_prezije_vyjimku_klienta(modul):
    stav = {"n": 0}

    def klient(prompt: str) -> str:
        stav["n"] += 1
        if stav["n"] == 1:
            raise RuntimeError("model spadl")
        return json.dumps({"vyhody.0": "Fast", "vyhody.1": "Precise"})

    preklady, problemy = modul.prelozi({"vyhody": ["Rychle", "Přesně"], "nav": {"a": "A", "b": "B"}},
                                       "angličtina", klient, velikost_davky=2)
    assert stav["n"] == 2
    assert "nav.a" in problemy and "nav.b" in problemy
    assert preklady == {"vyhody.0": "Fast", "vyhody.1": "Precise"}


def test_vnoreny(modul):
    assert modul.vnoreny({"a.b": "x", "s.0": "p", "s.1": "q"}) == {"a": {"b": "x"}, "s": ["p", "q"]}
    assert modul.vnoreny(modul.plochy(CS))["vyhody"] == ["Rychle", "Přesně"]


def test_vnoreny_objekt_uvnitr_seznamu(modul):
    """Texty webu mají tvar `sekce.polozky.0.nadpis` — seznam objektů."""
    plochy = {
        "b.pravidla.0.nadpis": "A", "b.pravidla.0.text": "a",
        "b.pravidla.1.nadpis": "B", "b.pravidla.1.text": "b",
    }
    assert modul.vnoreny(plochy) == {"b": {"pravidla": [
        {"nadpis": "A", "text": "a"}, {"nadpis": "B", "text": "b"}]}}


def test_vnoreny_seznam_v_seznamu(modul):
    assert modul.vnoreny({"m.0.0": "x", "m.0.1": "y", "m.1.0": "z"}) == {"m": [["x", "y"], ["z"]]}


def test_vnoreny_je_opakem_plochy_i_pro_slozity_tvar(modul):
    zdroj = {
        "nav": {"a": "A"},
        "pravidla": [{"nadpis": "N1", "text": "T1"}, {"nadpis": "N2", "text": "T2"}],
        "seznam": ["x", "y"],
        "hloubka": {"vnor": [{"k": ["p", "q"]}]},
    }
    assert modul.vnoreny(modul.plochy(zdroj)) == zdroj
