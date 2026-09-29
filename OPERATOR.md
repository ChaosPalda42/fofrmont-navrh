# OPERATOR — fofrmont

## Co a proč
Navrh noveho webu pro FOFRMONT CZ s.r.o. - realizacni firma TZB (VZT, UT, ZTI, chlazeni, tepelna cerpadla), dodavka a montaz na klic

## Kde jsme
Viz STATE.md (generuje harness). Poslední shrnutí operátora: —

## Rozhodnutí
- 2026-09-29: projekt založen.

## Pravidla projektu
- Stack: python
- Testy: `uv run pytest -q`
- Nic nad rámec harnessu; obecná pravidla jsou v ~/factory/docs.

## Jak spustit
- `factory run` — spustí běh (kontrakty → workeři → brány → checkpointy)
- `factory status` — stav, otevřené balíčky
- `factory packets` — balíčky čekající na rozhodnutí; `factory answer <id> …`
