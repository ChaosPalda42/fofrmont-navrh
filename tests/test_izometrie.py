"""Akceptační test C-008 — src/lib/izometrie.mjs."""
from __future__ import annotations

import pytest


@pytest.fixture()
def js():
    from tests.jsmod import run_js

    def call(body, **args):
        return run_js("izometrie.mjs", body, args=args)

    return call


def test_konstanty(js):
    assert js("out([m.COS30, m.SIN30]);") == [pytest.approx(0.8660254037844387), 0.5]


def test_projekce_os(js):
    assert js("out(m.projekce({ x: 10 }));") == {"x": 8.66, "y": 5}
    assert js("out(m.projekce({ z: 10 }));") == {"x": -8.66, "y": 5}
    assert js("out(m.projekce({ y: 10 }));") == {"x": 0, "y": -10}
    assert js("out(m.projekce({}));") == {"x": 0, "y": 0}


def test_projekce_meritko(js):
    assert js("out(m.projekce({ x: 10, y: 4, z: 2 }, 2));") == {"x": 13.86, "y": 4}


def test_projekce_bodu(js):
    assert js("out(m.projekceBodu([{ x: 10 }, { y: 10 }]));") == [{"x": 8.66, "y": 5}, {"x": 0, "y": -10}]


def test_cesta(js):
    assert js("out(m.cesta([{ x: 0, y: 0 }, { x: 10.5, y: -2 }]));") == "M 0 0 L 10.5 -2"
    assert js("out(m.cesta([]));") == ""


def test_trasa_a_delka(js):
    body = 'out(m.trasa({ x: 0, y: 0, z: 0 }, [{ osa: "x", delka: 10 }, { osa: "y", delka: 5 }, { osa: "z", delka: -3 }]));'
    assert js(body) == [{"x": 0, "y": 0, "z": 0}, {"x": 10, "y": 0, "z": 0},
                        {"x": 10, "y": 5, "z": 0}, {"x": 10, "y": 5, "z": -3}]
    assert js('out(m.trasa({ x: 0, y: 0, z: 0 }, [{ osa: "w", delka: 4 }]).length);') == 1
    assert js('out(m.delkaTrasy([{ osa: "x", delka: 10 }, { osa: "z", delka: -3 }, { osa: "w", delka: 100 }]));') == 13


def test_kvadr(js):
    v = js("out(m.kvadr({ x: 1, y: 2, z: 3 }, { d: 10, s: 6, v: 4 }));")
    assert v["vrcholy"][0] == {"x": 1, "y": 2, "z": 3}
    assert v["vrcholy"][2] == {"x": 11, "y": 2, "z": 9}
    assert v["vrcholy"][6] == {"x": 11, "y": 6, "z": 9}
    assert v["vrcholy"][7] == {"x": 1, "y": 6, "z": 9}
    assert len(v["vrcholy"]) == 8
    assert v["hrany"] == [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4],
                          [0, 4], [1, 5], [2, 6], [3, 7]]
    assert v["steny"] == {"vrch": [4, 5, 6, 7], "predni": [0, 1, 5, 4], "bocni": [1, 2, 6, 5]}


def test_ohraniceni(js):
    assert js("out(m.ohraniceni([{ x: 0, y: 0 }, { x: 10, y: 20 }, { x: -5, y: 4 }]));") == {
        "minX": -5, "minY": 0, "maxX": 10, "maxY": 20, "sirka": 15, "vyska": 20}
    assert js("out(m.ohraniceni([]));") == {"minX": 0, "minY": 0, "maxX": 0, "maxY": 0, "sirka": 0, "vyska": 0}


def test_view_box(js):
    assert js("out(m.viewBox([{ x: 0, y: 0 }, { x: 10, y: 20 }], 10));") == "-10 -10 30 40"
    assert js("out(m.viewBox([]));") == "0 0 0 0"


def test_delka_polylinie_a_bod(js):
    assert js("out(m.delkaPolylinie([{ x: 0, y: 0 }, { x: 3, y: 4 }]));") == 5
    assert js("out(m.delkaPolylinie([{ x: 1, y: 1 }]));") == 0
    assert js("out(m.bodNaPolylinii([{ x: 0, y: 0 }, { x: 10, y: 0 }], 0.5));") == {"x": 5, "y": 0}
    assert js("out(m.bodNaPolylinii([{ x: 0, y: 0 }, { x: 10, y: 0 }], -1));") == {"x": 0, "y": 0}
    assert js("out(m.bodNaPolylinii([{ x: 0, y: 0 }, { x: 10, y: 0 }], 2));") == {"x": 10, "y": 0}
    assert js("out(m.bodNaPolylinii([], 0.5));") == {"x": 0, "y": 0}


def test_bod_na_lomene_care(js):
    assert js("out(m.bodNaPolylinii([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }], 0.75));") == {"x": 10, "y": 5}


def test_rozdel(js):
    assert js("out(m.rozdel([{ x: 0, y: 0 }, { x: 10, y: 0 }], 4));") == [
        {"x": 0, "y": 0}, {"x": 4, "y": 0}, {"x": 8, "y": 0}, {"x": 10, "y": 0}]
    assert js("out(m.rozdel([{ x: 0, y: 0 }, { x: 10, y: 0 }], 5));") == [
        {"x": 0, "y": 0}, {"x": 5, "y": 0}, {"x": 10, "y": 0}]
    assert js("out(m.rozdel([{ x: 0, y: 0 }, { x: 10, y: 0 }], 0).length);") == 2


def test_kota_vodorovna(js):
    assert js("out(m.kota({ x: 0, y: 0 }, { x: 100, y: 0 }, 12));") == {
        "start": {"x": 0, "y": -12}, "konec": {"x": 100, "y": -12},
        "text": {"x": 50, "y": -18}, "delka": 100, "uhel": 0}


def test_kota_svisla(js):
    v = js("out(m.kota({ x: 0, y: 0 }, { x: 0, y: 50 }, 10));")
    assert v["start"] == {"x": 10, "y": 0}
    assert v["konec"] == {"x": 10, "y": 50}
    assert v["delka"] == 50
    assert v["uhel"] == 90


def test_kota_nulova_delka(js):
    v = js("out(m.kota({ x: 5, y: 5 }, { x: 5, y: 5 }, 10));")
    assert v["delka"] == 0
    assert v["uhel"] == 0
    assert v["start"] == {"x": 5, "y": 5}
