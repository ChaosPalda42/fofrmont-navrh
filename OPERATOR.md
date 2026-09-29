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

## Doplněno 30. 9. 2026

### Zpětná vazba od Michaela a co z ní vzešlo
1. „Je to statické" → přibyla vrstva pohybu: mřížka se jemně rozsvítí pod kurzorem
   (i pod prstem), značka skáče po uzlech mřížky jako uchycení v CADu, pravítko
   postupu čtení, počítadla čísel, kreslicí linka a parallax na kartách,
   běžící legenda profesí, dělicí trasa potrubí, živý průřez potrubí v kalkulačce.
2. „Pod myší to nemusí být tolik výrazné" → svit ztlumen na ~třetinu.
3. „Nesedí to do mřížky" → značka se počítala bez parallaxového posunu pozadí
   a v tmavých pásech má mřížka vlastní počátek. Uzel se teď počítá vůči tomu,
   nad čím kurzor právě je (`uzel()` v `src/ui/web.js`).
4. „Co ten přepínač dělá?" → přesunut nad výkres, který přepíná, popisek
   změněn na „Vyberte, co vám ukázat:" a popis varianty je pod výkresem.
5. „Načítací animace" → rýsovací hlava přejede list a odkryje web; ukáže se
   jen při prvním otevření v relaci (`sessionStorage`), aby neotravovala.
6. „Animace i při přepínání stránek" → View Transitions + přejezd rýsovací
   hlavy shora dolů (`.plotter`), obsah se odkrývá clip-pathem.
7. „Animace i na mobilu" → efekty pod kurzorem fungují i na dotyk, výkres
   se dá otočit prstem (`touch-action: pan-y`, aby zůstalo rolování).
8. Poptávka: typ objektu se větví podle segmentu — domácnost nevidí haly,
   školy ani zdravotnictví (dva kroky s `podminka`, ne jeden společný).

### Otáčení výkresu
Scéna hero výkresu je **data** (`scenaB2b`/`scenaB2c` v `src/templates/kresby.mjs`)
a vykresluje ji `src/lib/scena.mjs` — tentýž kód běží při sestavení webu i
v prohlížeči (`window.FM.scena`), takže se výkres dá tažením otočit o ±26°.
Výřez se počítá přes celý rozsah natočení (`viewBoxRozsahu`), jinak by výkres
při otáčení poskakoval.

### Co se naučilo z eskalací
- **C-005** eskaloval kvůli **chybě v akceptačním testu**, ne v kódu: očekávané
  pořadí referencí jsem odvodil podle pole `rok`, ale kontrakt řadí podle `datum`.
  Po opravě testu zelený na 4 iterace. Poučení: než pošlu paket zpátky jako
  „oprav kód", ověřím ručně, že test tvrdí to, co má.
- **C-012** prošel zeleně, a přesto spadl v provozu: `vnoreny()` neuměl objekt
  uvnitř seznamu (`pravidla.0.nadpis`), protože to můj test nepokrýval —
  testoval jen seznam řetězců. Stálo to 45 minut práce modelu. Test doplněn
  o objekt v seznamu, seznam v seznamu a o kontrolu `vnoreny(plochy(x)) == x`
  pro složitý tvar; kontrakt to teď žádá výslovně.
- Poučení do harnessu: **nástroj, který běží dlouho, musí být přerušitelný.**
  `tools/prelozit.py` teď ukládá hotové klíče po každé dávce do mezipaměti
  `data/content/.preklad-en.json`, takže pád ani Ctrl-C nezahodí práci modelu.
  Druhý běh (411 klíčů) trval 582 s a měl 0 problémových klíčů.

### Stav
64 stránek (CZ + EN), 178 akceptačních testů zelených, kontrola vygenerovaného
webu bez nálezu, balíček `_balicek/Fofrmont-ukazka.zip` (432 kB).
