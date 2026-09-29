// C-001: Recenze – souhrn, filtr, řazení, validace

const COMBINING = /[\u0300-\u036f]/g;

export function normalizuj(text) {
  return String(text).toLowerCase().normalize("NFD").replace(COMBINING, "");
}

export function viditelne(recenze) {
  return recenze.filter((r) => r.stav === "schvalena");
}

export function prumer(recenze) {
  const hodnoty = recenze
    .map((r) => r.hodnoceni)
    .filter((h) => typeof h === "number" && Number.isFinite(h));
  if (hodnoty.length === 0) return 0;
  const soucet = hodnoty.reduce((s, h) => s + h, 0);
  return Math.round((soucet / hodnoty.length) * 10) / 10;
}

export function histogram(recenze) {
  const h = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const r of recenze) {
    const v = r.hodnoceni;
    if (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5) {
      h[String(v)] += 1;
    }
  }
  return h;
}

export function souhrn(recenze) {
  let celkem = 0;
  let ano = 0;
  for (const r of recenze) {
    if (typeof r.doporucuje === "boolean") {
      celkem += 1;
      if (r.doporucuje === true) ano += 1;
    }
  }
  return {
    pocet: recenze.length,
    prumer: prumer(recenze),
    histogram: histogram(recenze),
    doporucujeProcent: celkem === 0 ? 0 : Math.round((ano / celkem) * 100),
  };
}

export function filtruj(recenze, filtr = {}) {
  const { segment, minHodnoceni, stavba, dotaz } = filtr;
  const slova =
    dotaz && String(dotaz).trim() !== ""
      ? String(dotaz).trim().split(/\s+/).map(normalizuj).filter(Boolean)
      : [];
  return recenze.filter((r) => {
    if (segment !== undefined && segment !== "" && segment !== "vse") {
      if (r.segment !== segment) return false;
    }
    if (minHodnoceni !== undefined && minHodnoceni !== null && minHodnoceni !== 0) {
      if (!(r.hodnoceni >= Number(minHodnoceni))) return false;
    }
    if (stavba !== undefined && stavba !== "") {
      if (r.stavba !== stavba) return false;
    }
    if (slova.length > 0) {
      const text = normalizuj(
        (r.jmeno ?? "") + " " + (r.firma ?? "") + " " + (r.text ?? "")
      );
      for (const slovo of slova) {
        if (!text.includes(slovo)) return false;
      }
    }
    return true;
  });
}

export function serad(recenze, mode) {
  const kopie = [...recenze];
  const datumDesc = (a, b) =>
    String(b.datum ?? "").localeCompare(String(a.datum ?? "")) ||
    (String(a.datum ?? "") < String(b.datum ?? "") ? -1 : 0);
  switch (mode) {
    case "nejstarsi":
      kopie.sort((a, b) =>
        String(a.datum ?? "").localeCompare(String(b.datum ?? ""))
      );
      break;
    case "nejlepsi":
      kopie.sort((a, b) => b.hodnoceni - a.hodnoceni || datumDesc(a, b));
      break;
    case "nejhorsi":
      kopie.sort(
        (a, b) =>
          a.hodnoceni - b.hodnoceni ||
          String(a.datum ?? "").localeCompare(String(b.datum ?? ""))
      );
      break;
    case "nejnovejsi":
    default:
      kopie.sort((a, b) => datumDesc(a, b));
      break;
  }
  return kopie;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

export function validuj(hodnoty) {
  const errors = {};
  const jmeno = typeof hodnoty.jmeno === "string" ? hodnoty.jmeno.trim() : "";
  if (jmeno === "") {
    errors.jmeno = "required";
  } else if (jmeno.length < 3) {
    errors.jmeno = "jmeno-kratke";
  }

  const h = Number(hodnoty.hodnoceni);
  if (!Number.isInteger(h) || h < 1 || h > 5) {
    errors.hodnoceni = "hodnoceni";
  }

  const text = typeof hodnoty.text === "string" ? hodnoty.text.trim() : "";
  if (text === "") {
    errors.text = "required";
  } else if (text.length < 20) {
    errors.text = "text-kratky";
  } else if (text.length > 1200) {
    errors.text = "text-dlouhy";
  }

  if (hodnoty.email !== undefined && hodnoty.email !== null && String(hodnoty.email) !== "") {
    const e = String(hodnoty.email);
    if (!EMAIL_RE.test(e) || e.split("@").length !== 2) {
      errors.email = "email";
    }
  }

  if (hodnoty.souhlas !== true) {
    errors.souhlas = "souhlas";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function slug(text) {
  const s = String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s === "" ? "host" : s;
}

export function nova(hodnoty, dnes = "") {
  const datum = String(dnes);
  const jmeno = String(hodnoty.jmeno ?? "").trim();
  const text = String(hodnoty.text ?? "").trim();
  const firma = String(hodnoty.firma ?? "").trim();
  return {
    id: "r-" + datum.replace(/-/g, "") + "-" + slug(jmeno),
    jmeno,
    firma,
    segment: hodnoty.segment === "b2b" ? "b2b" : "b2c",
    hodnoceni: Number(hodnoty.hodnoceni),
    text,
    datum,
    stav: "ceka",
    doporucuje: hodnoty.doporucuje === true,
  };
}

export function zkrat(text, limit) {
  const puvodni = String(text);
  if (puvodni.length <= limit) {
    return { text: puvodni, zkraceno: false };
  }
  let usek = puvodni.slice(0, limit);
  const mezera = usek.lastIndexOf(" ");
  if (mezera > 0) usek = usek.slice(0, mezera);
  usek = usek.replace(/[\s,.;:-]+$/, "");
  return { text: usek + "\u2026", zkraceno: true };
}
