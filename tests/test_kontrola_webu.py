"""Akceptační test C-011 — tools/kontrola_webu.py."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

HLAVICKA = '<meta name="robots" content="noindex, nofollow">'


def zapis(korenova: Path, jmeno: str, telo: str, *, title: str = "Stránka", noindex: bool = True) -> None:
    cesta = korenova / jmeno
    cesta.parent.mkdir(parents=True, exist_ok=True)
    hlava = (f"<title>{title}</title>" if title else "") + (HLAVICKA if noindex else "")
    cesta.write_text(f"<!doctype html><html><head>{hlava}</head><body>{telo}</body></html>",
                     encoding="utf-8")


@pytest.fixture()
def modul():
    from tools import kontrola_webu

    return kontrola_webu


def test_cisty_web_nema_problemy(tmp_path, modul):
    zapis(tmp_path, "index.html", '<h1>Fofrmont</h1><a href="kontakt.html">Kontakt</a><img src="logo.svg" alt="Logo">')
    zapis(tmp_path, "kontakt.html", "<h1>Kontakt</h1>")
    (tmp_path / "logo.svg").write_text("<svg></svg>", encoding="utf-8")
    v = modul.zkontroluj(tmp_path)
    assert v["stranek"] == 2
    assert v["problemy"] == []
    assert v["pocty"] == {}


def test_mrtvy_odkaz(tmp_path, modul):
    zapis(tmp_path, "index.html", '<h1>A</h1><a href="chybi.html">X</a><img src="neni.png" alt="">')
    v = modul.zkontroluj(tmp_path)
    typy = [p["typ"] for p in v["problemy"]]
    assert typy == ["mrtvy-odkaz", "mrtvy-odkaz"]
    assert v["problemy"][0]["detail"] == "chybi.html"
    assert v["problemy"][0]["soubor"] == "index.html"
    assert v["pocty"]["mrtvy-odkaz"] == 2


def test_externi_a_specialni_odkazy_se_netestuji(tmp_path, modul):
    telo = ('<h1>A</h1><a href="https://example.com">E</a><a href="mailto:a@b.cz">M</a>'
            '<a href="tel:+420777123456">T</a><a href="#sekce">K</a><a href="//cdn.cz/x.js">C</a>')
    zapis(tmp_path, "index.html", telo)
    assert modul.zkontroluj(tmp_path)["problemy"] == []


def test_kotva_a_dotaz_se_odrizne(tmp_path, modul):
    zapis(tmp_path, "index.html", '<h1>A</h1><a href="kontakt.html#mapa">K</a><a href="kontakt.html?x=1">Q</a>')
    zapis(tmp_path, "kontakt.html", "<h1>K</h1>")
    assert modul.zkontroluj(tmp_path)["problemy"] == []


def test_prazdny_a_absolutni_odkaz(tmp_path, modul):
    zapis(tmp_path, "index.html", '<h1>A</h1><a href="">A</a><a href="#">B</a><a>C</a><a href="/kontakt.html">D</a>')
    typy = [p["typ"] for p in modul.zkontroluj(tmp_path)["problemy"]]
    assert typy.count("prazdny-odkaz") == 3
    assert typy.count("absolutni-odkaz") == 1


def test_chybi_alt(tmp_path, modul):
    zapis(tmp_path, "index.html", '<h1>A</h1><img src="a.png"><img src="a.png" alt="">')
    (tmp_path / "a.png").write_bytes(b"x")
    typy = [p["typ"] for p in modul.zkontroluj(tmp_path)["problemy"]]
    assert typy == ["chybi-alt"]


def test_duplicitni_id(tmp_path, modul):
    zapis(tmp_path, "index.html", '<h1 id="a">A</h1><div id="a"></div><div id="b"></div>')
    p = modul.zkontroluj(tmp_path)["problemy"]
    assert [x["typ"] for x in p] == ["duplicitni-id"]
    assert p[0]["detail"] == "a"


def test_chybi_title_a_noindex(tmp_path, modul):
    zapis(tmp_path, "a.html", "<h1>A</h1>", title="", noindex=False)
    typy = sorted(x["typ"] for x in modul.zkontroluj(tmp_path)["problemy"])
    assert typy == ["chybi-noindex", "chybi-title"]


def test_prazdny_nadpis(tmp_path, modul):
    zapis(tmp_path, "index.html", "<h1>  </h1><h2><span>Text</span></h2><h3></h3>")
    typy = [x["typ"] for x in modul.zkontroluj(tmp_path)["problemy"]]
    assert typy == ["prazdny-nadpis", "prazdny-nadpis"]


def test_podslozky_a_relativni_cesty(tmp_path, modul):
    zapis(tmp_path, "index.html", '<h1>A</h1><a href="stavby/hala.html">H</a>')
    zapis(tmp_path, "stavby/hala.html", '<h1>H</h1><a href="../index.html">Zpět</a>')
    v = modul.zkontroluj(tmp_path)
    assert v["stranek"] == 2
    assert v["problemy"] == []


def test_problemy_jsou_serazene_podle_souboru(tmp_path, modul):
    zapis(tmp_path, "b.html", '<h1>B</h1><a href="chybi.html">X</a>')
    zapis(tmp_path, "a.html", '<h1>A</h1><a href="chybi.html">X</a>')
    soubory = [p["soubor"] for p in modul.zkontroluj(tmp_path)["problemy"]]
    assert soubory == ["a.html", "b.html"]


def test_hlavni_vraci_navratovy_kod(tmp_path, modul, capsys):
    zapis(tmp_path, "index.html", "<h1>A</h1>")
    assert modul.hlavni([str(tmp_path)]) == 0
    assert json.loads(capsys.readouterr().out)["stranek"] == 1
    zapis(tmp_path, "chyba.html", '<h1>A</h1><a href="nikam.html">X</a>')
    assert modul.hlavni([str(tmp_path)]) == 1
