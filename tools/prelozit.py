"""Přeloží data/content/cs.json do dalšího jazyka lokálním modelem.

Operátorský skript (není kontrakt). Překlad běží po dávkách a po každé dávce
se hotové klíče ukládají do mezipaměti, takže pád ani přerušení neznamená
ztrátu práce — další spuštění navazuje tam, kde předchozí skončilo.

    uv run python -m tools.prelozit en
    uv run python -m tools.prelozit en --znovu       # zahodí mezipaměť
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
from pathlib import Path

from tools import preklad

KOREN = Path(__file__).resolve().parents[1]
JAZYKY = {"en": "angličtina"}


def klient_llama(port: int, model: str, timeout: int = 240):
    def zavolej(prompt: str) -> str:
        telo = json.dumps({
            "model": model,
            "messages": [
                {"role": "system", "content": "Jsi překladatel odborných textů ze stavebnictví a TZB. "
                                              "Odpovídáš výhradně JSON objektem."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
            "max_tokens": 2400,
        }).encode("utf-8")
        pozadavek = urllib.request.Request(
            f"http://127.0.0.1:{port}/v1/chat/completions",
            data=telo, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(pozadavek, timeout=timeout) as odpoved:
            data = json.loads(odpoved.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"]
    return zavolej


def hlavni(argv: list[str]) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("jazyk", choices=sorted(JAZYKY))
    p.add_argument("--port", type=int, default=8081)
    p.add_argument("--model", default="gemma-4-26b-a4b")
    p.add_argument("--davka", type=int, default=14)
    p.add_argument("--znovu", action="store_true", help="zahodí mezipaměť a přeloží vše znovu")
    a = p.parse_args(argv)

    zdroj = json.loads((KOREN / "data/content/cs.json").read_text(encoding="utf-8"))
    polozky = sorted(preklad.plochy(zdroj).items())
    mezipamet = KOREN / f"data/content/.preklad-{a.jazyk}.json"
    hotovo: dict[str, str] = {}
    if mezipamet.exists() and not a.znovu:
        hotovo = json.loads(mezipamet.read_text(encoding="utf-8"))

    zbyva = [(klic, text) for klic, text in polozky if klic not in hotovo]
    klient = klient_llama(a.port, a.model)
    problemy: list[str] = []
    zacatek = time.time()

    for cislo, davka in enumerate(preklad.davky(zbyva, a.davka), start=1):
        try:
            odpoved = klient(preklad.sestav_prompt(davka, JAZYKY[a.jazyk]))
        except Exception as chyba:  # výpadek modelu nesmí shodit celý běh
            problemy.extend(klic for klic, _ in davka)
            print(f"dávka {cislo}: {type(chyba).__name__}", flush=True)
            continue
        preklady, davka_problemy = preklad.zpracuj_odpoved(odpoved, davka)
        hotovo.update(preklady)
        problemy.extend(davka_problemy)
        mezipamet.write_text(json.dumps(hotovo, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"dávka {cislo}: +{len(preklady)} (celkem {len(hotovo)}/{len(polozky)})", flush=True)

    cil = KOREN / f"data/content/{a.jazyk}.json"
    cil.write_text(json.dumps(preklad.vnoreny(hotovo), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "jazyk": a.jazyk, "klicu": len(polozky), "prelozeno": len(hotovo),
        "problemu": len(problemy), "sekund": round(time.time() - zacatek),
        "prvni_problemy": problemy[:15],
    }, ensure_ascii=False))
    return 0 if len(hotovo) > len(polozky) * 0.9 else 1


if __name__ == "__main__":
    sys.exit(hlavni(sys.argv[1:]))
