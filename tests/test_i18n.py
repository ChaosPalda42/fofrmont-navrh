"""Akceptační test C-009 — src/lib/i18n.mjs."""
from __future__ import annotations

import pytest

CS = {"nav": {"uvod": "Úvod", "stavby": "Stavby"},
      "hero": {"nadpis": "Montujeme TZB", "lead": "Už {roky} let."},
      "vyhody": ["Rychle", "Přesně"],
      "prazdne": ""}
EN = {"nav": {"uvod": "Home"}, "hero": {"lead": "For {roky} years."}}


@pytest.fixture()
def js():
    from tests.jsmod import run_js

    def call(body, **args):
        return run_js("i18n.mjs", body, args={"cs": CS, "en": EN, **args})

    return call


def test_get(js):
    assert js('out(m.get(A.cs, "nav.stavby"));') == "Stavby"
    assert js('out(m.get(A.cs, "prazdne"));') == ""
    assert js('out(m.get(A.cs, "nav.kontakt"));') is None
    assert js('out(m.get(A.cs, "nav.uvod.hloub"));') is None


def test_t_zaskok_a_promenne(js):
    assert js('out(m.t(A.en, "nav.stavby", {}, A.cs));') == "Stavby"
    assert js('out(m.t(A.cs, "hero.lead", { roky: 12 }));') == "Už 12 let."
    assert js('out(m.t(A.en, "nic.tady", {}, A.cs));') == "nic.tady"
    assert js('out(m.t(A.cs, "hero.lead", {}));') == "Už {roky} let."
    assert js('out(m.t({ p: "" }, "p", {}, { p: "Náhrada" }));') == "Náhrada"


def test_flatten_a_unflatten(js):
    plochy = js("out(m.flatten(A.cs));")
    assert plochy["nav.uvod"] == "Úvod"
    assert plochy["vyhody.0"] == "Rychle"
    assert "nav" not in plochy
    assert js("out(m.unflatten(m.flatten(A.cs)));") == CS


def test_chybejici(js):
    assert js("out(m.chybejici(A.cs, A.en));") == ["nav.stavby", "hero.nadpis", "vyhody.0", "vyhody.1"]
    assert js("out(m.chybejici(A.cs, A.cs));") == []


def test_pocet_cesky(js):
    tv = ["stavba", "stavby", "staveb"]
    assert js("out([0, 1, 2, 4, 5, 11, -2].map((n) => m.pocet(n, A.t)));", t=tv) == [
        "staveb", "stavba", "stavby", "stavby", "staveb", "staveb", "stavby"]


def test_pocet_anglicky(js):
    assert js('out([1, 5].map((n) => m.pocet(n, A.t, "en")));', t=["site", "sites"]) == ["site", "sites"]


def test_cislo(js):
    assert js('out(m.cislo(1234567.891, "cs", 2));') == "1 234 567,89"
    assert js('out(m.cislo(1234.5, "en", 1));') == "1,234.5"
    assert js('out(m.cislo(-5000, "cs"));') == "-5 000"
    assert js('out(m.cislo(42, "cs"));') == "42"


def test_datum(js):
    assert js('out(m.datum("2025-03-14", "cs"));') == "14. 3. 2025"
    assert js('out(m.datum("2025-03-14", "en"));') == "14 March 2025"
    assert js('out(m.datum("2025-12-01", "cs"));') == "1. 12. 2025"
    assert js('out(m.datum("nesmysl", "cs"));') == "nesmysl"
