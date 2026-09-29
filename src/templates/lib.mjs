/** Pomocníci pro šablony. Žádný stav, jen funkce nad daty. */

export function esc(hodnota) {
  return String(hodnota ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Odstavce z textu s prázdnými řádky; jednoduché \n se mění na <br>. */
export function odstavce(text, trida = "") {
  return String(text ?? "").split(/\n{2,}/).map((kus) =>
    `<p${trida ? ` class="${trida}"` : ""}>${esc(kus).replace(/\n/g, "<br>")}</p>`).join("\n");
}

export function atr(mapa) {
  return Object.entries(mapa)
    .filter(([, v]) => v !== null && v !== undefined && v !== false && v !== "")
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`)).join("");
}

export function trida(...kusy) {
  return kusy.flat().filter(Boolean).join(" ");
}

/** Délka polylinie v SVG jednotkách — pro animaci kreslení (stroke-dasharray). */
export function delkaCesty(body) {
  let d = 0;
  for (let i = 1; i < body.length; i += 1) {
    d += Math.hypot(body[i].x - body[i - 1].x, body[i].y - body[i - 1].y);
  }
  return Math.ceil(d) + 4;
}

export function cisloCs(hodnota, desetinna = 0) {
  const n = Math.round(Number(hodnota) * 10 ** desetinna) / 10 ** desetinna;
  const [cela, zbytek = ""] = Math.abs(n).toFixed(desetinna).split(".");
  const s = cela.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (n < 0 ? "-" : "") + s + (zbytek ? "," + zbytek : "");
}

export function datumCs(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ""));
  if (!m) return String(iso ?? "");
  return `${Number(m[3])}. ${Number(m[2])}. ${m[1]}`;
}

export function datumEn(iso) {
  const mesice = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ""));
  if (!m) return String(iso ?? "");
  return `${Number(m[3])} ${mesice[Number(m[2]) - 1]} ${m[1]}`;
}
