"""Spustí překlad data/content/cs.json -> data/content/<jazyk>.json lokálním modelem.

Operátorský skript (není kontrakt): jen propojí tools/preklad.py s llama-serverem.
Použití: uv run python -m tools.prelozit en [--model gemma-4-26b-a4b] [--port 8081]
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
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
    a = p.parse_args(argv)

    zdroj = json.loads((KOREN / "data/content/cs.json").read_text(encoding="utf-8"))
    zacatek = time.time()
    preklady, problemy = preklad.prelozi(zdroj, JAZYKY[a.jazyk], klient_llama(a.port, a.model), a.davka)
    cil = KOREN / f"data/content/{a.jazyk}.json"
    cil.write_text(json.dumps(preklad.vnoreny(preklady), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    celkem = len(preklad.plochy(zdroj))
    print(json.dumps({
        "jazyk": a.jazyk, "klicu": celkem, "prelozeno": len(preklady),
        "problemu": len(problemy), "sekund": round(time.time() - zacatek),
        "prvni_problemy": problemy[:15],
    }, ensure_ascii=False))
    return 0 if len(preklady) > celkem * 0.9 else 1


if __name__ == "__main__":
    sys.exit(hlavni(sys.argv[1:]))
