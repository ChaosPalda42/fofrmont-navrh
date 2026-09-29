/** Jednotná sada ikon. Všechny 20×20, tažené čárou jako na výkrese. */
const tah = 'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

const KRESBY = {
  sipka: `<path d="M4 10h12m-5-5 5 5-5 5" ${tah}/>`,
  sipkaDolu: `<path d="M10 4v12m-5-5 5 5 5-5" ${tah}/>`,
  sipkaVlevo: `<path d="M16 10H4m5-5-5 5 5 5" ${tah}/>`,
  telefon: `<path d="M6.5 3h-2A1.5 1.5 0 0 0 3 4.6c0 6.8 5.6 12.4 12.4 12.4A1.5 1.5 0 0 0 17 15.5v-2l-3.4-1.2-1.5 1.8a11 11 0 0 1-5.2-5.2l1.8-1.5z" ${tah}/>`,
  obalka: `<rect x="2.5" y="4.5" width="15" height="11" rx="1.2" ${tah}/><path d="m3 6 7 4.6L17 6" ${tah}/>`,
  pin: `<path d="M10 17s6-5.2 6-9.4A6 6 0 0 0 4 7.6C4 11.8 10 17 10 17z" ${tah}/><circle cx="10" cy="7.6" r="2.1" ${tah}/>`,
  fajfka: `<path d="m4 10.4 4 4L16 5.6" ${tah}/>`,
  krizek: `<path d="m5 5 10 10M15 5 5 15" ${tah}/>`,
  plus: `<path d="M10 4v12M4 10h12" ${tah}/>`,
  hodiny: `<circle cx="10" cy="10" r="7" ${tah}/><path d="M10 6v4.4l2.8 1.8" ${tah}/>`,
  kalendar: `<rect x="3" y="4.5" width="14" height="12" rx="1.2" ${tah}/><path d="M3 8h14M7 3v3m6-3v3" ${tah}/>`,
  lupa: `<circle cx="9" cy="9" r="5.2" ${tah}/><path d="m13 13 4 4" ${tah}/>`,
  filtr: `<path d="M3 5h14l-5.4 6v4.6L8.4 17v-6z" ${tah}/>`,
  stahnout: `<path d="M10 3v9m-4-3.4L10 12l4-3.4M4 15.5h12" ${tah}/>`,
  nahrat: `<path d="M10 12.5V3.5m-4 3.4L10 3.5l4 3.4M4 15.5h12" ${tah}/>`,
  kos: `<path d="M4 6h12M8 6V4h4v2m-6 0 .7 10h6.6L14 6" ${tah}/>`,
  oko: `<path d="M2.5 10S5.5 5 10 5s7.5 5 7.5 5-3 5-7.5 5-7.5-5-7.5-5z" ${tah}/><circle cx="10" cy="10" r="2.2" ${tah}/>`,
  okoSkrtnute: `<path d="M4 4l12 12M8.2 8.4A2.2 2.2 0 0 0 10 12.2M6.2 6.4C4 7.8 2.5 10 2.5 10s3 5 7.5 5c1.2 0 2.3-.3 3.2-.8m2-1.6c1.4-1.3 2.3-2.6 2.3-2.6s-3-5-7.5-5c-.6 0-1.2.1-1.7.2" ${tah}/>`,
  hvezda: `<path d="m10 2.8 2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1L2.5 8.3l5.2-.8z" fill="currentColor"/>`,
  hvezdaPrazdna: `<path d="m10 2.8 2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1L2.5 8.3l5.2-.8z" ${tah}/>`,
  vykres: `<rect x="3" y="3" width="14" height="14" rx="1" ${tah}/><path d="M3 13h14M13 3v14" ${tah}/>`,
  potrubi: `<path d="M3 13h5.5a2 2 0 0 0 2-2V7a2 2 0 0 1 2-2H17" ${tah}/><path d="M3 11v4M17 3v4" ${tah}/>`,
  kohout: `<circle cx="10" cy="10" r="3" ${tah}/><path d="M10 3v4m0 6v4M3 10h4m6 0h4" ${tah}/>`,
  budova: `<path d="M4 17V5.5L10 3l6 2.5V17" ${tah}/><path d="M7.5 17v-4h5v4M7.5 8.5h1.2m2.6 0h1.2" ${tah}/>`,
  dum: `<path d="M3 9.5 10 4l7 5.5V17H3z" ${tah}/><path d="M8 17v-4.6h4V17" ${tah}/>`,
  parta: `<circle cx="7.4" cy="7.6" r="2.6" ${tah}/><path d="M3 16.5c0-2.4 2-4 4.4-4s4.4 1.6 4.4 4" ${tah}/><path d="M13.2 6.2a2.4 2.4 0 0 1 0 4.6m.6 1.9c2 .4 3.2 1.8 3.2 3.8" ${tah}/>`,
  stit: `<path d="M10 3 4.5 5.2v4.3c0 3.4 2.3 6.5 5.5 7.5 3.2-1 5.5-4.1 5.5-7.5V5.2z" ${tah}/><path d="m7.6 9.8 1.8 1.8 3.2-3.4" ${tah}/>`,
  vitr: `<path d="M3 7h8.5A2.2 2.2 0 1 0 9.3 4.8M3 11h11a2.2 2.2 0 1 1-2.2 2.2M3 9h5" ${tah}/>`,
  plamen: `<path d="M10 17c2.8 0 5-2 5-4.6 0-3.4-3.4-4.6-3.4-7.4 0 0-2.4 1.3-2.4 3.6 0 1.4.8 2 .8 3 0 .9-.7 1.6-1.6 1.6-1 0-1.6-.8-1.6-1.9C5.6 13 5 12 5 12.4 5 15 7.2 17 10 17z" ${tah}/>`,
  snehulka: `<path d="M10 3v14M4 6.5l12 7M16 6.5l-12 7" ${tah}/>`,
  kapka: `<path d="M10 3.5c3 3.6 4.5 6 4.5 8.2A4.5 4.5 0 0 1 5.5 11.7c0-2.2 1.5-4.6 4.5-8.2z" ${tah}/>`,
  slunce: `<circle cx="10" cy="10" r="3.6" ${tah}/><path d="M10 2.2v1.6M10 16.2v1.6M2.2 10h1.6M16.2 10h1.6M4.5 4.5l1.1 1.1M14.4 14.4l1.1 1.1M15.5 4.5l-1.1 1.1M5.6 14.4l-1.1 1.1" ${tah}/>`,
  mesic: `<path d="M16 11.8A6.6 6.6 0 0 1 8.2 4a6.8 6.8 0 1 0 7.8 7.8z" ${tah}/>`,
  cerpadlo: `<rect x="3" y="6" width="9" height="8" rx="1" ${tah}/><path d="M12 8h3.5a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5H12" ${tah}/><path d="M5.5 8.4v3.2m2-3.2v3.2m2-3.2v3.2" ${tah}/>`,
};

export function ikona(jmeno, options = {}) {
  const kresba = KRESBY[jmeno];
  if (!kresba) return "";
  const velikost = options.velikost || 20;
  const trida = options.trida ? ` class="${options.trida}"` : "";
  return `<svg${trida} width="${velikost}" height="${velikost}" viewBox="0 0 20 20" aria-hidden="true" focusable="false">${kresba}</svg>`;
}

export const IKONY_OBORU = { vzt: "vitr", ut: "plamen", zti: "kapka", chlazeni: "snehulka", tc: "cerpadlo", klic: "vykres" };
