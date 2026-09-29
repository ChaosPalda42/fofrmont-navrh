"""Překlad plochých českých textů do angličtiny lokálním modelem.

Model se volá přes předaný `klient` (volatelný objekt: prompt -> odpověď),
takže modul jde testovat bez sítě. Pouze standardní knihovna.
"""
from __future__ import annotations

import json
import logging
import re

logger = logging.getLogger(__name__)

ZNACKA = re.compile(r"<[^>]+>|\{[a-zA-Z0-9_]+\}")


def plochy(slovnik: dict, prefix: str = "") -> dict[str, str]:
    """Rekurzivně zploští slovník (objekty i seznamy) na { "a.b": "text" }.

    Zahrne jen listy typu str, které po strip() nejsou prázdné.
    """
    vysledek: dict[str, str] = {}
    if isinstance(slovnik, dict):
        for klic, hodnota in slovnik.items():
            cesta = f"{prefix}.{klic}" if prefix else str(klic)
            vysledek.update(plochy(hodnota, cesta))
    elif isinstance(slovnik, list):
        for index, hodnota in enumerate(slovnik):
            cesta = f"{prefix}.{index}" if prefix else str(index)
            vysledek.update(plochy(hodnota, cesta))
    elif isinstance(slovnik, str):
        if slovnik.strip():
            vysledek[prefix] = slovnik
    return vysledek


def davky(polozky: list, velikost: int) -> list[list]:
    """Rozdělí seznam na dávky dané velikosti; poslední může být kratší."""
    if velikost <= 0:
        return [list(polozky)] if polozky else []
    return [list(polozky[i:i + velikost]) for i in range(0, len(polozky), velikost)]


def sestav_prompt(davka: list[tuple[str, str]], jazyk: str) -> str:
    """Sestaví výzvu pro model: cílový jazyk, klíče s českými texty, pravidla."""
    radky = [f'{klic}: {text}' for klic, text in davka]
    return (
        f"Přelož následující české texty do jazyka {jazyk}.\n"
        "Pro každý klíč přelož jeho český text:\n"
        + "\n".join(radky)
        + "\n\nOdpověz JEN JSON objektem ve tvaru klíč -> překlad, bez dalšího textu.\n"
        "Zachovej v překladech HTML značky (např. <strong>) i zástupné symboly "
        "ve složených závorkách (např. {jmeno}) přesně tak, jak jsou v originálu."
    )


def vytahni_json(text: str) -> dict:
    """Z odpovědi modelu vytáhne JSON objekt (od první '{' po poslední '}')."""
    zacatek = text.find("{")
    konec = text.rfind("}")
    if zacatek == -1 or konec == -1 or konec <= zacatek:
        return {}
    try:
        vysledek = json.loads(text[zacatek:konec + 1])
    except (json.JSONDecodeError, ValueError):
        return {}
    return vysledek if isinstance(vysledek, dict) else {}


def znacky(text: str) -> list[str]:
    """Všechny výskyty ZNACKA v pořadí, v jakém jsou v textu."""
    return ZNACKA.findall(text)


def znacky_sedi(zdroj: str, preklad: str) -> bool:
    """True, když oba texty obsahují tytéž značky se stejnými počty."""
    return sorted(znacky(zdroj)) == sorted(znacky(preklad))


def zpracuj_odpoved(text: str, davka: list[tuple[str, str]]) -> tuple[dict, list[str]]:
    """Z odpovědi vezme jen klíče z dávky s neprázdnými řetězcovými hodnotami.

    Vrátí (preklady, problemy); problémy jsou klíče, které chybí nebo u nichž
    nesedí značky. Takové klíče v preklady nejsou.
    """
    odpoved = vytahni_json(text)
    platne = {klic for klic, _ in davka}
    preklady: dict[str, str] = {}
    problemy: list[str] = []
    for klic, zdroj in davka:
        if klic not in platne:
            continue
        hodnota = odpoved.get(klic)
        if not isinstance(hodnota, str) or not hodnota.strip():
            problemy.append(klic)
            continue
        if not znacky_sedi(zdroj, hodnota):
            problemy.append(klic)
            continue
        preklady[klic] = hodnota
    return preklady, problemy


def prelozi(slovnik: dict, jazyk: str, klient, velikost_davky: int = 20) -> tuple[dict, list[str]]:
    """Projde plochy(slovnik) po dávkách a volá klient(prompt) pro každou dávku.

    Výjimka z klient u jedné dávky neshodí celý překlad: klíče dávky se
    zapíšou do problémů a pokračuje se dál.
    """
    polozky = sorted(plochy(slovnik).items())
    preklady: dict[str, str] = {}
    problemy: list[str] = []
    for davka in davky(polozky, velikost_davky):
        try:
            odpoved = klient(sestav_prompt(davka, jazyk))
        except Exception:
            logger.exception("klient selhal pro dávku klíčů: %s", [k for k, _ in davka])
            problemy.extend(klic for klic, _ in davka)
            continue
        davka_preklady, davka_problemy = zpracuj_odpoved(odpoved, davka)
        preklady.update(davka_preklady)
        problemy.extend(davka_problemy)
    return preklady, problemy


def vnoreny(plochy_slovnik: dict) -> dict:
    """Opak funkce plochy: celočíselný segment vytvoří seznam, jinak slovník."""
    vysledek: dict = {}
    for cesta, hodnota in plochy_slovnik.items():
        segmenty = cesta.split(".")
        cil = vysledek
        for i, segment in enumerate(segmenty[:-1]):
            nasledujici = segmenty[i + 1]
            if isinstance(cil, list):
                idx = int(segment)
                while len(cil) <= idx:
                    cil.append(None)
                if cil[idx] is None:
                    cil[idx] = [] if nasledujici.isdigit() else {}
                cil = cil[idx]
            else:
                if segment not in cil:
                    cil[segment] = [] if nasledujici.isdigit() else {}
                cil = cil[segment]
                if isinstance(cil, list) and i + 1 < len(segmenty) - 1:
                    # This part is tricky. If we just entered a list, 
                    # the next segment must be an integer.
                    pass 

        posledni = segmenty[-1]
        if isinstance(cil, list):
            index = int(posledni)
            while len(cil) <= index:
                cil.append("")
            cil[index] = hodnota
        else:
            cil[posledni] = hodnota
    return vysledek
