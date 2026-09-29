"""Akceptační test C-001 — src/lib/recenze.mjs."""
from __future__ import annotations

import pytest

R = [
    {"id": "a", "jmeno": "Petr Novák", "firma": "Metrostav", "segment": "b2b", "hodnoceni": 5,
     "text": "Montáž VZT ve vestavbě, drželi termín.", "datum": "2025-06-01", "stavba": "poliklinika",
     "stav": "schvalena", "doporucuje": True},
    {"id": "b", "jmeno": "Jana Šťastná", "firma": "", "segment": "b2c", "hodnoceni": 4,
     "text": "Tepelné čerpadlo v podkroví.", "datum": "2025-06-01", "stav": "schvalena",
     "doporucuje": True},
    {"id": "c", "jmeno": "Karel Dvořák", "segment": "b2c", "hodnoceni": 3,
     "text": "Rozvody ZTI, drobné výhrady.", "datum": "2024-02-10", "stav": "ceka",
     "doporucuje": False},
    {"id": "d", "jmeno": "Ivo Král", "firma": "PSJ", "segment": "b2b", "hodnoceni": 5,
     "text": "Chlazení serverovny.", "datum": "2026-01-15", "stav": "skryta"},
]


@pytest.fixture()
def js():
    from tests.jsmod import run_js

    def call(body, **args):
        return run_js("recenze.mjs", body, args={"r": R, **args})

    return call


def test_viditelne_bere_jen_schvalene(js):
    assert js("out(m.viditelne(A.r).map((x) => x.id));") == ["a", "b"]


def test_viditelne_nemutuje_vstup(js):
    assert js("m.viditelne(A.r); out(A.r.length);") == 4


def test_prumer_zaokrouhluje_na_desetinu(js):
    assert js("out(m.prumer(A.r));") == 4.3
    assert js("out(m.prumer([]));") == 0
    assert js('out(m.prumer([{ hodnoceni: 5 }, { hodnoceni: "x" }]));') == 5


def test_histogram_ma_vzdy_pet_klicu(js):
    h = js("out(m.histogram(A.r));")
    assert h == {"1": 0, "2": 0, "3": 1, "4": 1, "5": 2}
    assert js("out(m.histogram([]));") == {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}


def test_histogram_ignoruje_hodnoty_mimo_rozsah(js):
    assert js("out(m.histogram([{ hodnoceni: 0 }, { hodnoceni: 6 }, { hodnoceni: 4.5 }])['4']);") == 0


def test_souhrn(js):
    s = js("out(m.souhrn(A.r));")
    assert s["pocet"] == 4
    assert s["prumer"] == 4.3
    assert s["doporucujeProcent"] == 67
    assert s["histogram"]["5"] == 2


def test_souhrn_bez_doporuceni_vraci_nulu(js):
    assert js("out(m.souhrn([{ hodnoceni: 5 }]).doporucujeProcent);") == 0


def test_filtr_segment(js):
    assert js('out(m.filtruj(A.r, { segment: "b2b" }).map((x) => x.id));') == ["a", "d"]
    assert js('out(m.filtruj(A.r, { segment: "vse" }).length);') == 4
    assert js("out(m.filtruj(A.r, {}).length);") == 4


def test_filtr_min_hodnoceni_a_stavba(js):
    assert js("out(m.filtruj(A.r, { minHodnoceni: 5 }).map((x) => x.id));") == ["a", "d"]
    assert js("out(m.filtruj(A.r, { minHodnoceni: 0 }).length);") == 4
    assert js('out(m.filtruj(A.r, { stavba: "poliklinika" }).map((x) => x.id));') == ["a"]


def test_filtr_dotaz_ignoruje_diakritiku_a_hleda_vsechna_slova(js):
    assert js('out(m.filtruj(A.r, { dotaz: "stastna" }).map((x) => x.id));') == ["b"]
    assert js('out(m.filtruj(A.r, { dotaz: "metrostav vzt" }).map((x) => x.id));') == ["a"]
    assert js('out(m.filtruj(A.r, { dotaz: "metrostav letiste" }).length);') == 0


def test_filtr_kombinuje_podminky(js):
    assert js('out(m.filtruj(A.r, { segment: "b2b", minHodnoceni: 5, dotaz: "serverovny" }).map((x) => x.id));') == ["d"]


def test_serazeni(js):
    assert js('out(m.serad(A.r, "nejnovejsi").map((x) => x.id));') == ["d", "a", "b", "c"]
    assert js('out(m.serad(A.r, "nejstarsi").map((x) => x.id));') == ["c", "a", "b", "d"]
    assert js('out(m.serad(A.r, "nejlepsi").map((x) => x.id));') == ["d", "a", "b", "c"]
    assert js('out(m.serad(A.r, "nejhorsi").map((x) => x.id));') == ["c", "b", "a", "d"]


def test_serazeni_je_stabilni_a_nemutuje(js):
    assert js('out(m.serad(A.r, "neznamy").map((x) => x.id));') == ["d", "a", "b", "c"]
    assert js('m.serad(A.r, "nejstarsi"); out(A.r.map((x) => x.id));') == ["a", "b", "c", "d"]


def test_validace_projde(js):
    assert js('out(m.validuj({ jmeno: "Jan Novotný", hodnoceni: 5, text: "Montáž proběhla v pořádku a včas.", souhlas: true }));') == {
        "ok": True, "errors": {}
    }


def test_validace_hlasi_kody(js):
    e = js('out(m.validuj({ jmeno: "Jo", hodnoceni: 9, text: "krátký", email: "a@b", souhlas: false }).errors);')
    assert e == {"jmeno": "jmeno-kratke", "hodnoceni": "hodnoceni", "text": "text-kratky",
                 "email": "email", "souhlas": "souhlas"}


def test_validace_prazdna_pole(js):
    e = js("out(m.validuj({}).errors);")
    assert e["jmeno"] == "required"
    assert e["text"] == "required"
    assert "email" not in e


def test_validace_prijima_hodnoceni_jako_retezec(js):
    assert js('out(m.validuj({ hodnoceni: "4" }).errors.hodnoceni ?? null);') is None


def test_validace_dlouhy_text(js):
    assert js('out(m.validuj({ text: "a".repeat(1201) }).errors.text);') == "text-dlouhy"


def test_slug(js):
    assert js('out(m.slug("Jana Šťastná — Praha 3"));') == "jana-stastna-praha-3"
    assert js('out(m.slug("!!!"));') == "host"


def test_nova_recenze(js):
    r = js('out(m.nova({ jmeno: "  Petr Král ", text: " Skvělá práce. ", hodnoceni: "5", segment: "b2b", doporucuje: true }, "2026-03-14"));')
    assert r["id"] == "r-20260314-petr-kral"
    assert r["jmeno"] == "Petr Král"
    assert r["text"] == "Skvělá práce."
    assert r["hodnoceni"] == 5
    assert r["stav"] == "ceka"
    assert r["segment"] == "b2b"
    assert r["firma"] == ""
    assert r["doporucuje"] is True


def test_nova_recenze_vychozi_segment(js):
    assert js('out(m.nova({ jmeno: "A" }, "2026-01-01").segment);') == "b2c"
    assert js('out(m.nova({ jmeno: "A", doporucuje: "ano" }, "2026-01-01").doporucuje);') is False


def test_zkrat(js):
    assert js('out(m.zkrat("krátký text", 50));') == {"text": "krátký text", "zkraceno": False}
    v = js('out(m.zkrat("Montáž vzduchotechniky proběhla naprosto bez problémů.", 20));')
    assert v["zkraceno"] is True
    assert v["text"] == "Montáž…" or v["text"].endswith("…")
    assert len(v["text"]) <= 21


def test_zkrat_orizne_koncovou_interpunkci(js):
    assert js('out(m.zkrat("Ano, ale ne úplně vše", 5).text);') == "Ano…"
