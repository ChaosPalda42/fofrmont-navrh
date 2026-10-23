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

## Doplněno 30. 9. 2026 — druhé kolo připomínek

1. **Poptávka podle segmentu.** Typ objektu se větví (domácnost nevidí haly, školy
   ani zdravotnictví) a fakturační pole (firma, IČO) se domácnosti vůbec neukážou
   — a nevalidují se.
2. **Administrace dodělaná tak, aby šla osahat.** Přehled s posledním děním,
   texty s přepínačem jazyka a filtrem oblasti, recenze s filtrem podle stavu,
   stavby s plným formulářem, došlé poptávky, kontaktní údaje a export/import.
   Klíčová věc: **co se změní v administraci, se opravdu projeví na webu.**
   Kontaktní údaje mají v šablonách `data-udaj="kontakt.*"`, texty se vyměňují
   podle původního znění, které si administrace uloží k přepisu (`_zaklad`).
3. **Statistiky návštěvnosti** (kontrakt C-013) v duchu byPalda.cz: dlaždice
   s porovnáním období, graf návštěv s nitkovým křížem, poptávky jako sdílená
   osa pod ním, zdroje, zařízení, nejčtenější stránky. Data jsou **deterministicky
   vymyšlená** (stejný seed = stejná čísla) a je to na stránce napsané.
4. **Přílohy u formulářů.** Bereme jen to, co se dá otevřít a prohlédnout:
   PDF, DWG, DXF, IFC, STEP, XLSX, CSV, DOCX a fotky. Archivy (ZIP, RAR) ani
   spustitelné soubory ne — jsou to typické nosiče škodlivého kódu. 15 MB na
   soubor, 40 MB dohromady, nejvýš 10 souborů; na větší je pole pro odkaz
   (celá dokumentace nebo BIM model se do 15 MB nevejde).
   **Pozor pro ostrou verzi:** kontrola v prohlížeči je jen pohodlí pro uživatele.
   Skutečná ochrana musí být na serveru — kontrola typu podle obsahu (ne podle
   přípony), limit velikosti a antivirus.
5. **Světlý a tmavý režim.** Přepínač v liště, výchozí podle nastavení systému,
   volba se pamatuje v `localStorage` (`fm-tema`). V tmavém režimu se z papíru
   stane modrotisk. Tokeny jsou rozdělené na `--tmave` (tmavá plocha: patička,
   modrotiskové pásy) a `--plne` (plný ovládací prvek: hlavní tlačítko, aktivní
   přepínač, bublina) — `--plne` se v tmavém režimu obrací na světlou.
6. **Načítací animace** trvá ~2 s, aby byla celá vidět; ukáže se jen při prvním
   otevření v relaci.

### Poučení do harnessu
**Když běží `factory run`, nesahej na projekt.** Harness vrací zpět všechno mimo
soubor právě zpracovávaného kontraktu (PATH_POLICY) — při běhu C-013 mi takhle
zmizel hotový kus `src/assets/style.css` a projevilo se to až jako nastylovaný
graf bez stylů. Buď počkat, nebo pracovat ve vlastním worktree.

## Schůzka s klientem 9. 10. 2026 — co se změnilo

Zápis ze schůzky (Fireflies) zůstal u Michaela; sem jdou jen rozhodnutí.
Objednaný rozsah: web 7 000 + administrace 1 000 + založení firmy na Googlu
a napojení recenzí 1 500 = **9 500 Kč**. Doména 200 Kč/rok (koupena), hosting
~500 Kč/rok. Fakturace až po odsouhlasení finální verze, zatím na IČO.

### Rozhodnutí promítnutá do webu
1. **Jedna značka — Fofrmont.** Sesterská firma **Real Staff** (pronájem aut
   a stavební techniky, správa nemovitostí) se nepropaguje samostatně; její
   nabídka je součástí Fofrmontu, jen s drobnou značkou u oboru.
   V ARESu pod názvem „Real Staff“ nic není — rejstříkové údaje nemáme
   a nevymýšlíme je.
2. **Úvodní stránka přestavěná.** Velký nadpis pokrývající montáže TZB
   i realizaci staveb, krátké představení a **hned všechny obory**, bez
   scrollování. Klient (resp. jeho otec) to chtěl výslovně takhle;
   nabídli jsme protinázor (jeden scroll), neprošel — měřit se to dá později.
3. **Izometrický výkres z hlavičky pryč.** Zůstal u referencí a jako dělicí
   prvek. `scenaB2b`/`scenaB2c` a otáčení zůstávají v kódu pro případ návratu.
4. **Rozdělení na firmy / domácnosti** je teď filtr oborů, ne přepínač výkresu.
5. **Náročné prostory odstraněny** — klient nechce působit, že si vybírá.
   `src/lib/obtiznost.mjs` (C-006), jeho test i data jsou **parkované**
   v `site.json` pod `_parkovano`, stránka se negeneruje.
6. **Stavby → Reference**, jen hotové realizace. Aktivní zakázky se vést nebudou.
7. **Statistiky návštěvnosti odstraněny** z administrace (klient si je nekoupil).
   `src/lib/statistiky.mjs` (C-013) a test zůstávají, panel je pryč.
8. **Fotky u referencí.** V administraci jde ke každé referenci nahrát až osm
   fotek; zmenší se na 1100 px / JPEG 0.68 a uloží se do `localStorage`.
   Při zaplnění úložiště se změna vrátí a ukáže se srozumitelná hláška.
9. **Reference přidané v administraci se objeví na webu.** Výpis je doplní
   klientsky, detail vykresluje `stavba.html?id=…` z uloženého stavu
   a poctivě říká, že je zatím jen v prohlížeči.
10. **Google.** Recenze mají zdroj (Google / web), na stránce recenzí je blok
    s odkazem na firemní profil (`site.kontakt.googleProfil`, zatím prázdný).
    Veta „recenze procházejí schválením“ z veřejné části zmizela — klientův
    otec správně namítl, že tím dává najevo výběr jen hezkých recenzí.

### Čeká se na klienta (bez toho nejde dokončit)
- rozpis činností Fofrmontu a Real Staffu (texty u oborů jsou zatím naše)
- logo Fofrmontu ve vektoru; podoba loga Real Staffu (návrh je na nás)
- podklady alespoň k jedné hotové realizaci (fotky + pár vět)
- skutečný telefon a e-maily
- kdo bude platit doménu a hosting

### Otevřené otázky k rozhodnutí
- přesné názvy oborů a znění úvodního nadpisu (teď „Montujeme a stavíme
  po celé republice“ — návrh, ne schválené)
- konečné rozdělení oborů mezi firmy a domácnosti (teď odhad)
- zda Real Staff dostane v rejstříku dohledatelný název

## Skutečné logo, 22. 10. 2026

Klient poslal tiskové PDF (`podklady/logo/FOFRMONT_CZ_logo_tisk.pdf`). Čistý vektor,
16 cest, **jedna barva #203C5A** (tmavá modrá). Značka: obrys domu, uvnitř kladivo,
vodovodní kohoutek a dvě vlnovky vzduchu — montáž / voda / vzduch, tedy přesně tři
obory firmy. Pod značkou nápis FOFRMONT. Žádný claim, žádné „CZ" v logu.

**Rozhodnutí (Michael, 22. 10.):** oranžová #ff6a1f zůstává jako doplňková.
Logo si drží svou modrou, akcenty (tlačítka, signální prvky) zůstávají oranžové.
Důvod: #203C5A je příliš tmavá na to, aby na ní hlavní tlačítko vyniklo, a oranžová
s tou modrou ladí. Značková modrá dostane vlastní token, aby se nemíchala s barvou
textu (`--tus` #0b1a2d je tmavší).

Vektorovou sadu pro web (logo.svg, znak.svg, napis.svg, znak-dily.svg s pojmenovanými
skupinami pro animaci) dělá session „Loga a animované titulky". Až dorazí, nahradí
vymyšlený čtvercový znak v hlavičce, ve faviconě a v úvodní animaci — tam se má dům
nakreslit, pak ťukne kladivo, kápne voda a rozvlní se vzduch.

**Dodatek 22. 10. večer.** Vektorová sada je zapojená: hlavička a favicona mají
skutečnou značku, nápis FOFRMONT jde z loga jako křivky, úvodní animace staví dům
(obrys přes `stroke-dasharray`), prolne ho do výplně a po řadě rozsvítí kladivo,
kohoutek a obě vlnky vzduchu. Značková modrá je v tokenu `--znacka`, v tmavém
režimu se obrací na #dbe6f6 (kontrast 14,4 proti liště).

`znak-maly.svg` měl v první dodávce rám užší než kresbu (ořezával pravý okap o 31,06
jednotky); session Loga to opravila na 0 0 345.92 282.43 a doplnila na to bránu.
Opravený soubor stihl dorazit ještě před prvním commitem, takže živý web vadu nikdy
neměl — dočasné přemostění v `znacka.mjs` bylo od začátku no-op a je zrušené.

Čtvercová favicona se nedělá zvlášť: `favicona()` v `src/templates/znacka.mjs` si
znak vycentruje do čtverce posunem, takže se při každé opravě značky přepočítá sama.

**Celá značka v hlavičce, 22. 10.** Michael si všiml, že v liště chybí vzduch —
byla tam zjednodušená `znak-maly.svg` bez vlnek. Hlavička teď bere značku po dílech
(`znacka(56, { dily: true, prefix: "hl-" })`), takže je celá a vlnky jdou adresovat
z CSS. Musela se zvětšit z 34 na 56 px: při 44 px má pásmo vlnek 3 řádky inkoustu
a mezera mezi vlnkami nespadne pod 50 % krytí, při 56 px jsou to 2 plné řádky na
vlnku a mezera klesá na 25 % — teprve tam jsou to dvě čáry, ne šmouha. V liště
(68 px) zbývá nad i pod značkou 13,5 px, na 320 i 375 px bez vodorovného přesahu.

Vzduch se vlní: `@keyframes znackaVzduch` mění krytí 1 ↔ 0,42 a posouvá vlnku
o 5 % šířky dovnitř, 3,2 s, obě vlnky v protifázi (`animation-delay: -1.6s`).
Protifáze je schválně — inkoustu je v logu pořád stejně, takže to nebliká, jen se
to převaluje. Posun jde doleva, protože špička vlnky sahá přesně na okraj viewBoxu.
Ověřeno: složená značka z dílů se od `znak.svg` liší na 5 z 433 920 pixelů
(0,0012 %, jen antialias na švech), pytest 0, kontrola_webu 72/0, prohlizec 0 chyb.

**Podtitul zarovnaný s nápisem, 23. 10.** Michael změřil okem to, co se dalo
změřit: podtitul vyčuhoval vpravo za nápis FOFRMONT o 37 z 103 px (36 %). Praha
z něj jde pryč — firma montuje po celé republice, takže z „montáže TZB · Praha"
zůstává „montáže TZB" (a v EN „HVAC installations"). Adresa Žižkova v kontaktech
a „práce v Praze a okolí" v kariéře zůstávají, to jsou jiná tvrzení.

Zarovnání se nedělá odhadem prostrkání: podtitul je teď SVG text s `textLength`
a `lengthAdjust="spacing"` (`podtitulLoga()` ve `znacka.mjs`), nápis i podtitul
berou šířku z jedné proměnné `--napis`. Vysází se tedy vždy přesně do šířky nápisu
— v češtině (11 znaků) i angličtině (18) a i kdyby se nenačetlo JetBrains Mono,
což je přesně ta vada, co ji Michael viděl. Rámeček je utažený na verzálky, aby
sedělo odsazení, háček nad Ž smí přečuhovat (`overflow: visible`).

Změřeno: nápis i podtitul 104,00 px, rozdíl vlevo 0,00 a vpravo 0,00 na desktopu,
na mobilu i na /en/. Velikost písmen se nezměnila (verzálky 6,8 px jako dřív).

**Lockup na výšku a HVAC, 23. 10.** Text v hlavičce byl svisle vystředěný proti
značce (rozdíl středů 0,12 px), ale o 6,8 px kratší nahoře i dole. Teď je stejně
vysoký jako značka: nápis i podtitul berou šířku z jednoho `calc()`, který vychází
z výšky značky — `--napis = (0,73611 × --mark − --mezera) / 0,224752`, kde 0,73611
je poměr značky a 0,224752 součet výšek nápisu (82,6/517,05) a verzálek podtitulu
(65/1000) vůči šířce. Mění se tedy jen `--mark` a zbytek se dopočítá.

Značka 56 px (nápis 147,8), pod 30 rem 48 px (nápis 121,6) — jinak by lockup
(213,7 px) nevyšel na úzký telefon. Vlnky při 48 px drží i tak: na displeji
s DPR 2 a 3 je mezi nimi propad krytí na 25 %. Změřeno: rozdíl nahoře −0,09 px,
dole −0,11 px, vlevo i vpravo 0,00 — v CZ i EN, na desktopu i na mobilu.

Terminologie v EN sjednocená na HVAC (byla směs MEP a HVAC): titulek úvodní
stránky, „six HVAC trades" a „for HVAC trades".

## Srovnané řádky v mřížce oborů, 23. 10.

Michaelovi vadilo, že z deseti karet oborů vycházelo 6 + 4 a druhý řádek byl
napůl prázdný. CSS `auto-fill` neumí nic jiného — nasype do řádku, co se vejde.
Počet sloupců proto dopočítává `srovnejRadky()` ve `src/ui/web.js`: zjistí, kolik
sloupců se nejvýš vejde (karta nesmí být užší než `--karta-min`, to číslo je jen
v CSS), a z možností vybere tu s nejmenším součtem „díry v posledním řádku +
řádky nad nutné minimum“. Z deseti karet tak vyjde 2×5, z osmi (domácnosti) 2×4,
ze sedmi 4 + 3, z jedenácti 6 + 5.

Počítají se jen karty, které jsou vidět, takže to drží i po přepnutí segmentu;
přepočítá se po načtení, při změně šířky okna a při každém filtrování. Mřížka se
přihlásí atributem `data-srovnat`, zatím ho má jen mřížka oborů na úvodu. Bez JS
zůstane v CSS původní `auto-fill`.

Naměřeno (šířka mřížky → sloupců × řádků, poslední řádek, šířka karty):
firmy 1440 → 5×2 posl. 5 (279 px), 971 → 5×2 posl. 5 (185 px), 860 → 4×3 posl. 2,
715 → 2×5 posl. 2, 380 → 2×5 posl. 2 (184 px); domácnosti 1440 → 4×2 posl. 4,
860 → 4×2, 715 → 3×3 posl. 2, 380 → 2×4 posl. 2. Nikde nevyšel poslední řádek
s jedinou kartou, nikde karta pod `--karta-min` (175 px, pod 40rem 150 px) a nikde
mřížka nepřetekla. Na mobilu (375 px) 2 sloupce, karta 164 px.
