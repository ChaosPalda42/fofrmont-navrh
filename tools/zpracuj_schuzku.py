"""Ze záznamu schůzky vytáhne lokálním modelem jen požadavky na web.

Surový záznam zůstává na tomhle Macu. Na výstup jde strukturovaný seznam
požadavků bez jmen, citací, kontaktů a bez zmínek o jiných klientech —
to je jediné, co potřebuje operátor (Claude) k práci.

    uv run python -m tools.zpracuj_schuzku "<cesta k zaznamu.md>" [--vystup dokumenty/pozadavky.md]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path

KOREN = Path(__file__).resolve().parents[1]
ZAKAZANE = re.compile(
    r"\b(\+?\d[\d \-/]{7,}\d)"                     # telefonní čísla
    r"|\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b"             # e-maily
    r"|\b\d{9,10}/\d{4}\b",                        # čísla účtů
)


def zavolej(prompt: str, port: int, model: str, timeout: int = 420) -> str:
    telo = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content":
                "Jsi asistent, který ze zápisu ze schůzky vytáhne POUZE věcné požadavky na webové "
                "stránky. Nikdy neuvádíš jména lidí, citace, telefony, e-maily ani jiné osobní údaje "
                "a nezmiňuješ jiné zakázky nebo klienty. Odpovídáš česky."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.1,
        "max_tokens": 3000,
    }).encode("utf-8")
    pozadavek = urllib.request.Request(
        f"http://127.0.0.1:{port}/v1/chat/completions",
        data=telo, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(pozadavek, timeout=timeout) as odpoved:
        return json.loads(odpoved.read().decode("utf-8"))["choices"][0]["message"]["content"]


def davky(text: str, velikost: int = 9000) -> list[str]:
    odstavce = text.split("\n\n")
    kusy, aktualni = [], ""
    for o in odstavce:
        if len(aktualni) + len(o) > velikost and aktualni:
            kusy.append(aktualni)
            aktualni = ""
        aktualni += o + "\n\n"
    if aktualni.strip():
        kusy.append(aktualni)
    return kusy


SABLONA = """Níže je část zápisu ze schůzky s klientem. Vypiš z ní jen to, co se týká
webových stránek, jako odrážky. U každé odrážky uveď, čeho se týká (obsah, vzhled,
funkce, administrace, texty, jiné) a jestli jde o požadavek, nápad, nebo otevřenou otázku.

Pravidla:
- žádná jména lidí, žádné citace, žádné telefony, e-maily ani adresy
- když se v zápisu mluví o jiné zakázce nebo jiném klientovi, přeskoč to
- když část neobsahuje nic o webu, napiš jen: (nic)

Část zápisu:
---
{cast}
---"""


def hlavni(argv: list[str]) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("zaznam")
    p.add_argument("--vystup", default="dokumenty/pozadavky-ze-schuzky.md")
    p.add_argument("--port", type=int, default=8081)
    p.add_argument("--model", default="gemma-4-26b-a4b")
    a = p.parse_args(argv)

    zdroj = Path(a.zaznam).expanduser()
    if not zdroj.exists():
        print(f"nenalezeno: {zdroj}", file=sys.stderr)
        return 2
    text = zdroj.read_text(encoding="utf-8")

    casti = davky(text)
    vysledky = []
    for cislo, cast in enumerate(casti, start=1):
        odpoved = zavolej(SABLONA.format(cast=cast), a.port, a.model).strip()
        print(f"část {cislo}/{len(casti)}: {len(odpoved)} znaků", flush=True)
        if odpoved and "(nic)" not in odpoved[:20]:
            vysledky.append(odpoved)

    souhrn = "\n\n".join(vysledky)
    nalezy = ZAKAZANE.findall(souhrn)
    if nalezy:                       # pojistka: kontrolujeme jen POČTY, ne obsah
        souhrn = ZAKAZANE.sub("[odstraněno]", souhrn)

    cil = (KOREN / a.vystup) if not Path(a.vystup).is_absolute() else Path(a.vystup)
    cil.parent.mkdir(parents=True, exist_ok=True)
    cil.write_text("# Požadavky na web ze schůzky\n\n"
                   "_Vytaženo lokálním modelem ze zápisu, který zůstal na tomhle Macu._\n\n"
                   + souhrn + "\n", encoding="utf-8")
    print(json.dumps({
        "zdroj_znaku": len(text), "casti": len(casti), "vystup": str(cil),
        "vystup_znaku": len(souhrn), "zamaskovano_udaju": len(nalezy),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(hlavni(sys.argv[1:]))
