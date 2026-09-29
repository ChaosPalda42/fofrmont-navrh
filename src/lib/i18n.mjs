// C-009 — Slovníky CZ/EN: tečkové klíče, skloňování počtu, formáty.

function jeObjekt(hodnota) {
  return hodnota !== null && typeof hodnota === "object";
}

export function get(slovnik, cesta) {
  let uzel = slovnik;
  for (const segment of String(cesta).split(".")) {
    if (!jeObjekt(uzel)) return null;
    if (!Object.prototype.hasOwnProperty.call(uzel, segment)) return null;
    uzel = uzel[segment];
  }
  return uzel === undefined ? null : uzel;
}

function doplnPromenne(text, promenne) {
  return text.replace(/\{([^{}]+)\}/g, (celky, klic) => {
    if (promenne && Object.prototype.hasOwnProperty.call(promenne, klic)) {
      return String(promenne[klic]);
    }
    return celky;
  });
}

export function t(slovnik, cesta, promenne = {}, zaskok = null) {
  let text = get(slovnik, cesta);
  if (!(typeof text === "string" && text.trim() !== "")) {
    const nahrad = get(zaskok, cesta);
    if (typeof nahrad === "string" && nahrad.trim() !== "") {
      text = nahrad;
    } else {
      return cesta;
    }
  }
  return doplnPromenne(text, promenne);
}

function jeList(hodnota) {
  return (
    typeof hodnota === "string" ||
    typeof hodnota === "number" ||
    typeof hodnota === "boolean"
  );
}

export function flatten(objekt, prefix = "") {
  const vysledek = {};
  const rekurze = (uzel, pred) => {
    if (Array.isArray(uzel)) {
      uzel.forEach((polozka, i) => rekurze(polozka, pred ? `${pred}.${i}` : String(i)));
    } else if (jeObjekt(uzel)) {
      for (const klic of Object.keys(uzel)) {
        rekurze(uzel[klic], pred ? `${pred}.${klic}` : klic);
      }
    } else if (jeList(uzel)) {
      vysledek[pred] = uzel;
    }
  };
  rekurze(objekt, prefix);
  return vysledek;
}

function jeCislicovySegment(segment) {
  return /^\d+$/.test(segment);
}

export function unflatten(mapa) {
  const vysledek = {};
  for (const klic of Object.keys(mapa)) {
    const casti = klic.split(".");
    let uzel = vysledek;
    for (let i = 0; i < casti.length - 1; i++) {
      const segment = casti[i];
      const dalsi = casti[i + 1];
      if (!(segment in uzel)) {
        uzel[segment] = jeCislicovySegment(dalsi) ? [] : {};
      }
      uzel = uzel[segment];
    }
    const posledni = casti[casti.length - 1];
    uzel[posledni] = mapa[klic];
  }
  return vysledek;
}

export function chybejici(referencni, slovnik) {
  const chybici = [];
  const plocha = flatten(referencni);
  for (const klic of Object.keys(plocha)) {
    const ref = plocha[klic];
    if (!(typeof ref === "string" && ref.trim() !== "")) continue;
    const hodnota = get(slovnik, klic);
    if (!(typeof hodnota === "string" && hodnota.trim() !== "")) {
      chybici.push(klic);
    }
  }
  return chybici;
}

export function pocet(n, tvary, jazyk = "cs") {
  const abs = Math.abs(n);
  let index;
  if (jazyk === "cs") {
    if (abs === 1) index = 0;
    else if (abs >= 2 && abs <= 4) index = 1;
    else index = 2;
  } else {
    index = abs === 1 ? 0 : 1;
  }
  if (tvary.length === 0) return "";
  if (index < tvary.length) return tvary[index];
  return tvary[tvary.length - 1];
}

export function cislo(hodnota, jazyk = "cs", desetinna = 0) {
  const n = Number(hodnota);
  const zaokr = n.toFixed(desetinna);
  const [cel, dec] = zaokr.split(".");
  const oddelovac = jazyk === "cs" ? "\u00A0" : ",";
  const zname = cel.replace(/\B(?=(\d{3})+(?!\d))/g, oddelovac);
  if (desetinna === 0) return zname;
  const desetinny = jazyk === "cs" ? "," : ".";
  return zname + desetinny + dec;
}

export const MESICE_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function datum(iso, jazyk = "cs") {
  const shoda = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  if (!shoda) return iso;
  const rok = shoda[1];
  const mesic = Number(shoda[2]);
  const den = Number(shoda[3]);
  if (jazyk === "cs") {
    return `${den}. ${mesic}. ${rok}`;
  }
  return `${den} ${MESICE_EN[mesic - 1]} ${rok}`;
}
