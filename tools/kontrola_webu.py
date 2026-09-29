"""Kontrola vygenerovaného webu — mrtvé odkazy, alt, duplicitní id.

Používá jen standardní knihovnu (html.parser, pathlib, json, sys).
"""
from __future__ import annotations

import json
import sys
from html.parser import HTMLParser
from pathlib import Path

# Předpony, které se při kontrole mrtvých odkazů netestují.
NETESTOVANE = ("http:", "https:", "//", "mailto:", "tel:", "data:", "#")

NADPISY = {"h1", "h2", "h3", "h4", "h5", "h6"}


class _Kontrolor(HTMLParser):
    def __init__(self, soubor: str, korenova: Path, souborova: Path):
        super().__init__(convert_charrefs=True)
        self.soubor = soubor
        self.korenova = korenova
        self.souborova = souborova
        self.problemy: list[dict] = []
        self.ids: set[str] = set()
        self.maji_title = False
        self.title_text = ""
        self.maji_noindex = False
        self._v_nadpise: str | None = None
        self._nadpis_text = ""
        self._v_title = False

    def _prikaz(self, typ: str, detail: str) -> None:
        self.problemy.append({"soubor": self.soubor, "typ": typ, "detail": detail})

    def _zkontroluj_odkaz(self, hodnota: str) -> None:
        if hodnota.startswith(NETESTOVANE):
            return
        if hodnota.startswith("/"):
            self._prikaz("absolutni-odkaz", hodnota)
            return
        if not hodnota:
            return
        cesta = hodnota.split("#", 1)[0].split("?", 1)[0]
        if not cesta:
            return
        cil = (self.souborova.parent / cesta)
        if not cil.exists():
            self._prikaz("mrtvy-odkaz", hodnota)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        d = dict(attrs)
        if "id" in d:
            hodnota = d["id"]
            if hodnota in self.ids:
                self._prikaz("duplicitni-id", hodnota)
            else:
                self.ids.add(hodnota)
        if tag == "a":
            if "href" not in d:
                self._prikaz("prazdny-odkaz", "")
            else:
                hodnota = d["href"]
                if hodnota in ("", "#"):
                    self._prikaz("prazdny-odkaz", hodnota)
                else:
                    self._zkontroluj_odkaz(hodnota)
        elif tag == "img":
            if "alt" not in d:
                self._prikaz("chybi-alt", "")
            if "src" in d:
                self._zkontroluj_odkaz(d["src"])
        elif tag == "title":
            self._v_title = True
            self.maji_title = True
        elif tag == "meta":
            if (d.get("name") or "").lower() == "robots" and "noindex" in (d.get("content") or ""):
                self.maji_noindex = True
        elif tag in NADPISY:
            self._v_nadpise = tag
            self._nadpis_text = ""
        for atribut in ("href", "src"):
            if tag not in ("a", "img") and atribut in d:
                self._zkontroluj_odkaz(d[atribut])

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._v_title = False
        elif tag in NADPISY and self._v_nadpise == tag:
            if not self._nadpis_text.strip():
                self._prikaz("prazdny-nadpis", tag)
            self._v_nadpise = None

    def handle_data(self, data: str) -> None:
        if self._v_title:
            self.title_text += data
        if self._v_nadpise is not None:
            self._nadpis_text += data

    def zavrit(self) -> None:
        if not self.maji_title or not self.title_text.strip():
            self._prikaz("chybi-title", "")
        if not self.maji_noindex:
            self._prikaz("chybi-noindex", "")


def zkontroluj(korenova: str | Path) -> dict:
    korenova = Path(korenova)
    soubory = sorted(korenova.rglob("*.html"), key=lambda p: p.relative_to(korenova).as_posix())
    problemy: list[dict] = []
    for soubor in soubory:
        relativni = soubor.relative_to(korenova).as_posix()
        kontrolor = _Kontrolor(relativni, korenova, soubor)
        kontrolor.feed(soubor.read_text(encoding="utf-8"))
        kontrolor.close()
        kontrolor.zavrit()
        problemy.extend(kontrolor.problemy)
    pocty: dict[str, int] = {}
    for p in problemy:
        pocty[p["typ"]] = pocty.get(p["typ"], 0) + 1
    return {"stranek": len(soubory), "problemy": problemy, "pocty": pocty}


def hlavni(argv: list[str]) -> int:
    korenova = argv[0] if argv else "out"
    vysledek = zkontroluj(korenova)
    print(json.dumps(vysledek, ensure_ascii=False, indent=2))
    return 1 if vysledek["problemy"] else 0


if __name__ == "__main__":
    sys.exit(hlavni(sys.argv[1:]))
