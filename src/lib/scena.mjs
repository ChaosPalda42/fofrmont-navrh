/** Popis izometrické scény a její vykreslení do SVG.
 *  Bez importů: geometrii dodá volající jako `iso` (src/lib/izometrie.mjs),
 *  takže tentýž kód běží při sestavení webu i v prohlížeči (window.FM.scena). */

export function otoc(bod, uhel) {
  const s = Math.sin(uhel);
  const c = Math.cos(uhel);
  return { x: bod.x * c - bod.z * s, y: bod.y || 0, z: bod.x * s + bod.z * c };
}

function escXml(hodnota) {
  return String(hodnota ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function delka2d(body) {
  let d = 0;
  for (let i = 1; i < body.length; i += 1) d += Math.hypot(body[i].x - body[i - 1].x, body[i].y - body[i - 1].y);
  return Math.ceil(d) + 4;
}

const cesta = (body) => body.map((b, i) => `${i ? "L" : "M"} ${b.x} ${b.y}`).join(" ");

/** Vrátí { vnitrek, viewBox } pro danou scénu a úhel natočení ve stupních. */
export function vykresli(iso, scena, moznosti = {}) {
  const uhel = ((moznosti.uhel || 0) * Math.PI) / 180;
  const meritko = scena.meritko || 15;
  const stred = scena.stred || { x: 0, z: 0 };
  const animace = moznosti.animace !== false;
  const znacka = moznosti.znacka || "sipka-kota";

  const pr = (b) => iso.projekce(otoc({ x: (b.x || 0) - stred.x, y: b.y || 0, z: (b.z || 0) - stred.z }, uhel), meritko);
  const kusy = [];
  const vsechny = [];
  const zapis = (body) => { for (const b of body) vsechny.push(b); };

  if (scena.mrizka) {
    const { sirka, hloubka, krok = 1 } = scena.mrizka;
    const cary = [];
    for (let x = 0; x <= sirka + 1e-9; x += krok) cary.push(cesta([pr({ x, z: 0 }), pr({ x, z: hloubka })]));
    for (let z = 0; z <= hloubka + 1e-9; z += krok) cary.push(cesta([pr({ x: 0, z }), pr({ x: sirka, z })]));
    kusy.push(`<path class="vykres-mrizka" d="${cary.join(" ")}"/>`);
    zapis([pr({ x: 0, z: 0 }), pr({ x: sirka, z: hloubka }), pr({ x: sirka, z: 0 }), pr({ x: 0, z: hloubka })]);
  }

  for (const zavesa of scena.zavesy || []) {
    const a = pr({ x: zavesa.x, y: zavesa.y1, z: zavesa.z });
    const b = pr({ x: zavesa.x, y: zavesa.y2, z: zavesa.z });
    kusy.push(`<path class="vykres-osa" d="${cesta([a, b])}"/>`);
  }

  for (const [poradi, kvadr] of (scena.kvadry || []).entries()) {
    const k = iso.kvadr(kvadr.pozice, kvadr.rozmer);
    const v = k.vrcholy.map(pr);
    zapis(v);
    const sten = (idx, trida) => `<polygon class="${trida}" points="${idx.map((i) => `${v[i].x},${v[i].y}`).join(" ")}"/>`;
    const hrany = k.hrany.map(([a, b]) => cesta([v[a], v[b]])).join(" ");
    kusy.push(sten(k.steny.vrch, "vykres-vypln--2"));
    kusy.push(sten(k.steny.predni, "vykres-vypln"));
    kusy.push(sten(k.steny.bocni, "vykres-vypln"));
    kusy.push(`<path class="vykres-cara${kvadr.silna ? " vykres-cara--silna" : ""}${animace ? " kresli" : ""}"
      style="--delka:${delka2d(v) * 4};--zpozdeni:${kvadr.zpozdeni || poradi * 140}ms" d="${hrany}"/>`);
  }

  for (const polygon of scena.polygony || []) {
    const body = polygon.body.map(pr);
    zapis(body);
    kusy.push(`<polygon class="vykres-vypln" points="${body.map((b) => `${b.x},${b.y}`).join(" ")}"/>`);
  }

  for (const cara of scena.cary || []) {
    const body = cara.body.map(pr);
    zapis(body);
    kusy.push(`<path class="vykres-cara${animace ? " kresli" : ""}"
      style="--delka:${delka2d(body)};--zpozdeni:${cara.zpozdeni || 0}ms" d="${cesta(body)}"/>`);
  }

  for (const trasa of scena.trasy || []) {
    const body = iso.trasa(trasa.start, trasa.segmenty).map(pr);
    zapis(body);
    const tah = `vykres-cara vykres-cara--silna${trasa.signal ? " vykres-cara--signal" : ""}${animace ? " kresli" : ""}`;
    kusy.push(`<path class="${tah}" style="--delka:${delka2d(body)};--zpozdeni:${trasa.zpozdeni || 0}ms"
      d="${cesta(body)}"${trasa.id ? ` id="${escXml(trasa.id)}"` : ""} data-trasa="${escXml(JSON.stringify(body))}"/>`);
    for (const spoj of body.slice(1, -1)) {
      kusy.push(`<circle class="spoj" cx="${spoj.x}" cy="${spoj.y}" r="3.1" fill="var(--papir)" stroke="var(--cara)" stroke-width="1.2"/>`);
    }
  }

  for (const kota of scena.kotace || []) {
    const a = pr(kota.a);
    const b = pr(kota.b);
    const k = iso.kota(a, b, kota.odsazeni || 18);
    const smer = { x: (b.x - a.x) / (k.delka || 1), y: (b.y - a.y) / (k.delka || 1) };
    const kolmo = { x: smer.y * 4, y: -smer.x * 4 };
    zapis([k.start, k.konec, k.text]);
    kusy.push(`<path class="vykres-kota" d="${cesta([a, { x: k.start.x + kolmo.x, y: k.start.y + kolmo.y }])}"/>`);
    kusy.push(`<path class="vykres-kota" d="${cesta([b, { x: k.konec.x + kolmo.x, y: k.konec.y + kolmo.y }])}"/>`);
    kusy.push(`<path class="vykres-kota" d="${cesta([k.start, k.konec])}" marker-start="url(#${znacka})" marker-end="url(#${znacka})"/>`);
    kusy.push(`<text class="vykres-popis" x="${k.text.x}" y="${k.text.y}" text-anchor="middle">${escXml(kota.popis)}</text>`);
  }

  for (const v of scena.vynosky || []) {
    const z = pr(v.kotva);
    const konec = { x: z.x + v.dx, y: z.y + v.dy };
    const konecCary = { x: konec.x + (v.dx > 0 ? 30 : -30), y: konec.y };
    const sirkaTextu = Math.max(40, String(v.popis).length * 5.4);
    zapis([z, konec, { x: konecCary.x + (v.dx > 0 ? sirkaTextu : -sirkaTextu), y: konecCary.y }]);
    kusy.push(`<path class="vykres-kota" d="${cesta([z, konec, konecCary])}"/>`);
    kusy.push(`<circle cx="${z.x}" cy="${z.y}" r="2" fill="var(--signal)"/>`);
    kusy.push(`<text class="vykres-popis${v.signal ? " vykres-popis--signal" : ""}" x="${konecCary.x + (v.dx > 0 ? 5 : -5)}"
      y="${konecCary.y + 3}" text-anchor="${v.dx > 0 ? "start" : "end"}">${escXml(v.popis)}</text>`);
  }

  if (scena.tok) kusy.push(`<circle id="${escXml(scena.tok)}" r="4.2" fill="var(--signal)" opacity="0"/>`);

  return {
    vnitrek: kusy.join("\n"),
    viewBox: moznosti.viewBox || iso.viewBox(vsechny, scena.okraj ?? 18),
  };
}

/** Výřez, do kterého se scéna vejde v celém rozsahu natočení.
 *  Díky němu výkres při otáčení neposkakuje a nemění velikost. */
export function viewBoxRozsahu(iso, scena, mez = MEZ_UHLU, krok = 4) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let uhel = -mez; uhel <= mez + 1e-9; uhel += krok) {
    const kusy = vykresli(iso, scena, { uhel, animace: false }).viewBox.split(" ").map(Number);
    minX = Math.min(minX, kusy[0]);
    minY = Math.min(minY, kusy[1]);
    maxX = Math.max(maxX, kusy[0] + kusy[2]);
    maxY = Math.max(maxY, kusy[1] + kusy[3]);
  }
  const zaokrouhli = (v) => Math.round(v * 100) / 100;
  return [zaokrouhli(minX), zaokrouhli(minY), zaokrouhli(maxX - minX), zaokrouhli(maxY - minY)].join(" ");
}

/** Rozsah natočení, na který scéna vypadá dobře. */
export const MEZ_UHLU = 26;

export function omez(uhel) {
  return Math.max(-MEZ_UHLU, Math.min(MEZ_UHLU, uhel));
}
