"""Akceptační test C-007 — src/lib/vypocty.mjs (orientační výpočty)."""
from __future__ import annotations

import pytest


@pytest.fixture()
def js():
    from tests.jsmod import run_js

    def call(body, **args):
        return run_js("vypocty.mjs", body, args=args)

    return call


def test_zaokrouhli(js):
    assert js("out([m.zaokrouhli(3.456, 1), m.zaokrouhli(3.456, 2), m.zaokrouhli(2.5), m.zaokrouhli(-2.5)]);") == [3.5, 3.46, 3, -2]
    assert js('out([m.zaokrouhli("x", 1), m.zaokrouhli(Infinity)]);') == [0, 0]


def test_objem_a_prutoky(js):
    assert js("out(m.objem(5, 4, 2.7));") == 54
    assert js("out(m.prutokVymeny(27, 1.5));") == 41
    assert js("out(m.prutokVymeny(-5, 2));") == 0
    assert js("out(m.prutokOsoby(8, 30));") == 240


def test_navrh_prutok(js):
    assert js("out(m.navrhPrutok({ delka: 5, sirka: 4, vyska: 2.7, vymeny: 2, osoby: 8, davka: 30 }));") == {
        "objem": 54, "podleVymen": 108, "podleOsob": 240, "navrh": 240}
    assert js("out(m.navrhPrutok({ delka: 3, sirka: 3, vyska: 3, vymeny: 1.5 }));") == {
        "objem": 27, "podleVymen": 41, "podleOsob": 0, "navrh": 50}
    assert js("out(m.navrhPrutok({}).navrh);") == 0


def test_rada_a_nejblizsi_prumer(js):
    assert js("out(m.RADA_KRUHOVA.length);") == 20
    assert js("out([m.RADA_KRUHOVA[0], m.RADA_KRUHOVA[19]]);") == [100, 1000]
    assert js("out([m.nejblizsiPrumer(297.4), m.nejblizsiPrumer(315), m.nejblizsiPrumer(5000), m.nejblizsiPrumer(0)]);") == [315, 315, 1000, 100]


def test_dimenze_kruhova(js):
    assert js("out(m.dimenzeKruhova(1000, 4));") == {
        "plocha": 0.0694, "prumer": 297.4, "prumerNorm": 315, "skutecnaRychlost": 3.56}
    assert js("out(m.dimenzeKruhova(3600, 5));") == {
        "plocha": 0.2, "prumer": 504.6, "prumerNorm": 560, "skutecnaRychlost": 4.06}
    assert js("out(m.dimenzeKruhova(0, 4));") == {
        "plocha": 0, "prumer": 0, "prumerNorm": 100, "skutecnaRychlost": 0}


def test_dimenze_hranata(js):
    assert js("out(m.dimenzeHranata(2000, 4, 300));") == {"sirka": 500, "vyska": 300, "skutecnaRychlost": 3.7}
    assert js("out(m.dimenzeHranata(200, 4, 300));") == {"sirka": 100, "vyska": 300, "skutecnaRychlost": 1.85}


def test_rychlost(js):
    assert js("out(m.rychlost(1000, 250));") == 5.66
    assert js("out(m.rychlost(1000, 0));") == 0


def test_tepelna_ztrata(js):
    assert js("out(m.tepelnaZtrata(120, 2.6, 60));") == 7.2
    assert js("out(m.tepelnaZtrata(120, 3.2, 60));") == 8.9
    assert js("out(m.tepelnaZtrata(120, 2.2, 60));") == 7.2


def test_navrh_tc(js):
    assert js("out(m.RADA_TC[0]);") == 3
    assert js("out(m.navrhTC(9.5));") == {"potreba": 8.1, "vykon": 9, "pokryti": 95}
    assert js("out(m.navrhTC(12, { tuv: 1.5 }));") == {"potreba": 11.7, "vykon": 12, "pokryti": 89}
    assert js("out(m.navrhTC(40).vykon);") == 24
    assert js("out(m.navrhTC(0).pokryti);") == 0


def test_uspora_rekuperace(js):
    assert js("out(m.usporaRekuperace(2000, 10, 250, 0.8, 20, 4.8));") == {
        "vykon": 13.47, "kwhRok": 26933, "korunRok": 129278}


def test_formatuj_cislo(js):
    assert js("out(m.formatujCislo(12500));") == "12 500"
    assert js("out(m.formatujCislo(3.456, 1));") == "3,5"
    assert js("out(m.formatujCislo(-1234.5, 2));") == "-1 234,50"
    assert js("out(m.formatujCislo(0));") == "0"
    assert js("out(m.formatujCislo(999));") == "999"
    assert js("out(m.formatujCislo(1000000, 0));") == "1 000 000"
