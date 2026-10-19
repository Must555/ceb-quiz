// Générateurs des familles du tronc commun (référentiel P6), matière ma.
// Voir js/engine/generateurs/gen-*.js pour les conventions (formes, _signature, qcm…).
//
// Familles : aires des quadrilatères, logique déductive, développements de solides,
// lecture de représentations (ensembles, arbres, tableaux, diagrammes), propriétés des figures,
// mouvements, périmètre constant, vocabulaire des opérations, égalités.
// Les figures sont des SVG autonomes (traits #1c2333 sur fond blanc, quadrillage gris clair).

import { formatNombre } from '../format.js';

// ---------------------------------------------------------------------------
// Outils communs
// ---------------------------------------------------------------------------
const r = (x, d = 6) => { const f = 10 ** d; return Math.round(x * f) / f; };
const fmt = (x) => formatNombre(r(x));
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const nbDecimales = (x) => { const s = String(r(x)); return s.includes('.') ? s.split('.')[1].length : 0; };
const enumerer = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} et ${l[l.length - 1]}`);
const majuscule = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const decimal = (rng, min, max, dec) => rng.int(min * 10 ** dec, max * 10 ** dec) / 10 ** dec;
const forme = (fn, poids = 1) => Object.assign(fn, { poids });

const PRENOMS = [
  ['Léa', 'f'], ['Emma', 'f'], ['Agathe', 'f'], ['Margaux', 'f'], ['Chloé', 'f'], ['Pauline', 'f'], ['Louise', 'f'],
  ['Alice', 'f'], ['Zoé', 'f'], ['Mathilde', 'f'], ['Juliette', 'f'], ['Julie', 'f'], ['Amélie', 'f'], ['Manon', 'f'],
  ['Baptiste', 'm'], ['Lucas', 'm'], ['Antoine', 'm'], ['Louis', 'm'], ['Arthur', 'm'], ['Jules', 'm'], ['Victor', 'm'],
  ['Nathan', 'm'], ['Romain', 'm'], ['Mathis', 'm'], ['Théo', 'm'], ['Hugo', 'm'], ['Tom', 'm'], ['Simon', 'm'],
].map(([n, g]) => ({ n, g }));

// QCM : bonne réponse + distracteurs distincts, mélangés.
function qcm(rng, bonne, fausses, n = 4, min = 2) {
  const b = String(bonne);
  const vus = new Set([b.trim().toLowerCase()]);
  const d = [];
  for (const f of fausses) {
    const s = String(f); const k = s.trim().toLowerCase();
    if (vus.has(k)) continue;
    vus.add(k); d.push(s);
  }
  if (d.length < min) return null;
  const choix = rng.shuffle([b, ...rng.shuffle(d).slice(0, n - 1)]);
  return { type: 'qcm', choix, reponse: choix.indexOf(b) };
}

// Assemble une famille à partir de ses formes. Une forme peut fournir `cle` : données qui varient
// (dessin, paramètres) quand l'énoncé est le même d'une variante à l'autre.
function famille(formes) {
  const liste = formes.flatMap((f, i) => Array(f.poids ?? 1).fill(i));
  return (modele, rng) => {
    const i = rng.pick(liste);
    const q = formes[i](rng, modele);
    if (!q) return null;
    if (q.type === 'numerique' && (!Number.isFinite(q.reponse) || nbDecimales(q.reponse) > 3)) return null;
    const extra = q.choix ? ` | ${[...q.choix].sort().join(' ; ')}` : '';
    const cle = q.enonce + (q.cle ? ` | ${q.cle}` : '') + extra;
    delete q.cle;
    return { cleContenu: cle, _signature: `${i}|${cle}`, ...q };
  };
}

// ---------------------------------------------------------------------------
// Outils SVG
// ---------------------------------------------------------------------------
const COUL = {
  trait: '#1c2333', grille: '#d5dbe5', doux: '#5b6475',
  bleu: '#d6e6ff', orange: '#ffe1c4', vert: '#d3f2dc', violet: '#e6ddfc', rose: '#ffdbe4', jaune: '#fff0b0',
  bleuF: '#2f6fd6', orangeF: '#d9822b', vertF: '#2e9d57', roseF: '#d6456b',
};
const FONDS = [COUL.bleu, COUL.orange, COUL.vert, COUL.violet, COUL.rose, COUL.jaune];
const n1 = (x) => Math.round(x * 10) / 10;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (w, h, corps) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n1(w)} ${n1(h)}" font-family="Arial, sans-serif"><rect width="${n1(w)}" height="${n1(h)}" fill="#ffffff"/>${corps}</svg>`;
const pts = (P) => P.map(([x, y]) => `${n1(x)},${n1(y)}`).join(' ');
const dashAttr = (dash) => (dash ? ` stroke-dasharray="${dash}"` : '');
const polySvg = (P, { fill = 'none', stroke = COUL.trait, sw = 2, dash } = {}) =>
  `<polygon points="${pts(P)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"${dashAttr(dash)}/>`;
const ligneSvg = ([x1, y1], [x2, y2], { stroke = COUL.trait, sw = 2, dash } = {}) =>
  `<line x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2)}" y2="${n1(y2)}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"${dashAttr(dash)}/>`;
const cercleSvg = (cx, cy, rr, { fill = 'none', stroke = COUL.trait, sw = 2, dash, opacite } = {}) =>
  `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(rr)}" fill="${fill}"${opacite ? ` fill-opacity="${opacite}"` : ''} stroke="${stroke}" stroke-width="${sw}"${dashAttr(dash)}/>`;
const texteSvg = (x, y, s, { size = 14, anchor = 'middle', fill = COUL.trait, bold = false, halo = false } = {}) =>
  `<text x="${n1(x)}" y="${n1(y)}" font-size="${size}" text-anchor="${anchor}" dominant-baseline="central" fill="${fill}"${bold ? ' font-weight="bold"' : ''}${halo ? ' stroke="#ffffff" stroke-width="4" stroke-linejoin="round" paint-order="stroke"' : ''}>${esc(s)}</text>`;
const rectSvg = (x, y, w, h, opts) => polySvg([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], opts);
function quadrillage(x0, y0, nx, ny, u) {
  let s = '';
  for (let i = 0; i <= nx; i++) s += `<line x1="${n1(x0 + i * u)}" y1="${n1(y0)}" x2="${n1(x0 + i * u)}" y2="${n1(y0 + ny * u)}"/>`;
  for (let j = 0; j <= ny; j++) s += `<line x1="${n1(x0)}" y1="${n1(y0 + j * u)}" x2="${n1(x0 + nx * u)}" y2="${n1(y0 + j * u)}"/>`;
  return `<g stroke="${COUL.grille}" stroke-width="1">${s}</g>`;
}
// Petit carré d'angle droit en P, côtés le long des directions unitaires u et v (repère écran).
const angleDroitSvg = (P, u, v, t = 9) => `<polyline points="${pts([[P[0] + u[0] * t, P[1] + u[1] * t], [P[0] + (u[0] + v[0]) * t, P[1] + (u[1] + v[1]) * t], [P[0] + v[0] * t, P[1] + v[1] * t]])}" fill="none" stroke="${COUL.trait}" stroke-width="1.5"/>`;

// Rendu de primitives en coordonnées « monde » (y vers le bas), cadrées dans W × H.
// Primitives : {t:'poly', P, fill, dash, sw} {t:'ligne', a, b, dash} {t:'cercle', c, r, fill}
//              {t:'texte', p, s, dx, dy, size, anchor} (décalage en pixels) {t:'angle', p, u, v}
function rendu(prims, W, H, { marge = 30, echelleMax = 40 } = {}) {
  const xs = []; const ys = [];
  for (const p of prims) {
    if (p.t === 'poly') p.P.forEach(([x, y]) => { xs.push(x); ys.push(y); });
    else if (p.t === 'ligne') { xs.push(p.a[0], p.b[0]); ys.push(p.a[1], p.b[1]); } else if (p.t === 'cercle') { xs.push(p.c[0] - p.r, p.c[0] + p.r); ys.push(p.c[1] - p.r, p.c[1] + p.r); }
  }
  const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys);
  const s = Math.min((W - 2 * marge) / Math.max(maxX - minX, 1e-6), (H - 2 * marge) / Math.max(maxY - minY, 1e-6), echelleMax);
  const ox = (W - (maxX - minX) * s) / 2 - minX * s; const oy = (H - (maxY - minY) * s) / 2 - minY * s;
  const T = ([x, y]) => [ox + x * s, oy + y * s];
  let out = '';
  for (const p of prims) {
    if (p.t === 'poly') out += polySvg(p.P.map(T), { fill: p.fill ?? 'none', dash: p.dash, sw: p.sw ?? 2 });
    else if (p.t === 'ligne') out += ligneSvg(T(p.a), T(p.b), { dash: p.dash, sw: p.sw ?? 2 });
    else if (p.t === 'cercle') { const [cx, cy] = T(p.c); out += cercleSvg(cx, cy, p.r * s, { fill: p.fill ?? 'none' }); }
  }
  for (const p of prims) {
    if (p.t === 'angle') out += angleDroitSvg(T(p.p), p.u, p.v);
    else if (p.t === 'texte') { const [x, y] = T(p.p); out += texteSvg(x + (p.dx ?? 0), y + (p.dy ?? 0), p.s, { size: p.size ?? 14, anchor: p.anchor ?? 'middle', bold: p.bold, halo: p.halo }); }
  }
  return svg(W, H, out);
}

// ===========================================================================
// 1. Aires du parallélogramme, du losange, du trapèze et du triangle
// ===========================================================================
// Triplets [hauteur, décalage, côté oblique] : le côté oblique affiché est exact (h² + d² = c²).
const PYTH = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [9, 12, 15], [12, 9, 15], [8, 15, 17], [15, 8, 17], [12, 16, 20], [16, 12, 20], [7, 24, 25], [24, 7, 25], [10, 24, 26]];
const FORMULES = {
  parallelogramme: 'Aire du parallélogramme = base × hauteur.',
  losange: 'Aire du losange = (grande diagonale × petite diagonale) : 2.',
  trapeze: 'Aire du trapèze = (grande base + petite base) × hauteur : 2.',
  triangle: 'Aire du triangle = base × hauteur : 2.',
};
const FIGTXT = { parallelogramme: 'ce parallélogramme', losange: 'ce losange', trapeze: 'ce trapèze', triangle: 'ce triangle' };

function figureAire(sorte, d, u) {
  const P = []; const L = (v) => `${fmt(v)} ${u}`;
  if (sorte === 'parallelogramme') {
    const { b, h, o, c } = d;
    const A = [0, h]; const B = [b, h]; const C = [b + o, 0]; const D = [o, 0]; const Hp = [o, h];
    P.push({ t: 'poly', P: [A, B, C, D], fill: COUL.bleu }, { t: 'ligne', a: D, b: Hp, dash: '6 4', sw: 1.8 }, { t: 'angle', p: Hp, u: [1, 0], v: [0, -1] });
    P.push({ t: 'texte', p: [b / 2, h], s: L(b), dy: 16 }, { t: 'texte', p: [o, h / 2], s: L(h), dx: 8, anchor: 'start' });
    if (c) P.push({ t: 'texte', p: [o / 2, h / 2], s: L(c), dx: -16, anchor: 'end' });
  } else if (sorte === 'trapeze') {
    const { B, b, h, o, c, rect } = d;
    if (rect) {
      const A = [0, h]; const Bp = [B, h]; const C = [b, 0]; const D = [0, 0];
      P.push({ t: 'poly', P: [A, Bp, C, D], fill: COUL.vert }, { t: 'angle', p: A, u: [1, 0], v: [0, -1] }, { t: 'angle', p: D, u: [1, 0], v: [0, 1] });
      P.push({ t: 'texte', p: [B / 2, h], s: L(B), dy: 16 }, { t: 'texte', p: [b / 2, 0], s: L(b), dy: -14 }, { t: 'texte', p: [0, h / 2], s: L(h), dx: 16, anchor: 'start' });
      if (c) P.push({ t: 'texte', p: [(B + b) / 2, h / 2], s: L(c), dx: 14, dy: -12, anchor: 'start' });
    } else {
      const A = [0, h]; const Bp = [B, h]; const C = [o + b, 0]; const D = [o, 0]; const Hp = [o, h];
      P.push({ t: 'poly', P: [A, Bp, C, D], fill: COUL.vert }, { t: 'ligne', a: D, b: Hp, dash: '6 4', sw: 1.8 }, { t: 'angle', p: Hp, u: [1, 0], v: [0, -1] });
      P.push({ t: 'texte', p: [B / 2, h], s: L(B), dy: 16 }, { t: 'texte', p: [o + b / 2, 0], s: L(b), dy: -14 }, { t: 'texte', p: [o, h / 2], s: L(h), dx: 8, anchor: 'start' });
      if (c) P.push({ t: 'texte', p: [B - o / 2, h / 2], s: L(c), dx: 10, anchor: 'start' });
    }
  } else if (sorte === 'triangle') {
    const { b, h, o, c } = d;
    const A = [0, h]; const B = [b, h]; const C = [o, 0]; const Hp = [o, h];
    P.push({ t: 'poly', P: [A, B, C], fill: COUL.orange }, { t: 'ligne', a: C, b: Hp, dash: '6 4', sw: 1.8 }, { t: 'angle', p: Hp, u: [1, 0], v: [0, -1] });
    P.push({ t: 'texte', p: [b / 2, h], s: L(b), dy: 16 }, { t: 'texte', p: [o, h * 0.6], s: L(h), dx: 8, anchor: 'start' });
    if (c) P.push({ t: 'texte', p: [o / 2, h / 2], s: L(c), dx: -10, anchor: 'end' });
  } else {
    const { D, dd } = d;
    const N = [D / 2, 0]; const E = [D, dd / 2]; const S = [D / 2, dd]; const O = [0, dd / 2];
    P.push({ t: 'poly', P: [O, N, E, S], fill: COUL.violet }, { t: 'ligne', a: O, b: E, dash: '6 4', sw: 1.8 }, { t: 'ligne', a: N, b: S, dash: '6 4', sw: 1.8 }, { t: 'angle', p: [D / 2, dd / 2], u: [1, 0], v: [0, -1] });
    P.push({ t: 'texte', p: [D * 0.27, dd / 2], s: L(D), dy: 13, halo: true }, { t: 'texte', p: [D / 2, dd * 0.7], s: L(dd), dx: 7, anchor: 'start', halo: true });
  }
  return rendu(P, 380, 230, { marge: 34, echelleMax: 30 });
}

function calculAire(sorte, d, u) {
  const u2 = `${u}²`;
  if (sorte === 'parallelogramme') { const a = r(d.b * d.h); return { a, x: `${FORMULES.parallelogramme} ${fmt(d.b)} × ${fmt(d.h)} = ${fmt(a)} ${u2}.` }; }
  if (sorte === 'triangle') { const a = r(d.b * d.h / 2); return { a, x: `${FORMULES.triangle} ${fmt(d.b)} × ${fmt(d.h)} : 2 = ${fmt(r(d.b * d.h))} : 2 = ${fmt(a)} ${u2}.` }; }
  if (sorte === 'losange') { const a = r(d.D * d.dd / 2); return { a, x: `${FORMULES.losange} ${fmt(d.D)} × ${fmt(d.dd)} : 2 = ${fmt(r(d.D * d.dd))} : 2 = ${fmt(a)} ${u2}.` }; }
  const a = r((d.B + d.b) * d.h / 2);
  return { a, x: `${FORMULES.trapeze} (${fmt(d.B)} + ${fmt(d.b)}) × ${fmt(d.h)} : 2 = ${fmt(r(d.B + d.b))} × ${fmt(d.h)} : 2 = ${fmt(a)} ${u2}.` };
}

const aires = famille([
  // Figure cotée avec un côté oblique « piège » (longueur exacte grâce aux triplets).
  forme((rng) => {
    const sorte = rng.pick(['parallelogramme', 'trapeze', 'trapeze', 'triangle', 'losange']);
    const u = rng.pick(['cm', 'cm', 'm']);
    const [h, o, c] = rng.pick(PYTH.filter(([hh, oo]) => hh <= 16 && oo <= 16 && oo <= 1.6 * hh));
    let d;
    if (sorte === 'parallelogramme') d = { b: rng.int(o + 2, o + 14), h, o, c: rng.next() < 0.8 ? c : null };
    else if (sorte === 'triangle') d = { b: rng.int(o + 2, o + 14), h, o, c: rng.next() < 0.7 ? c : null };
    else if (sorte === 'trapeze') {
      const rect = rng.next() < 0.4; const b = rng.int(3, 14);
      d = rect ? { B: b + o, b, h, o, c: rng.next() < 0.8 ? c : null, rect } : { B: b + 2 * o, b, h, o, c: rng.next() < 0.8 ? c : null, rect };
    } else { const D = rng.int(6, 20); d = { D, dd: rng.int(Math.max(3, Math.ceil(D * 0.4)), D - 2) }; }
    const { a, x } = calculAire(sorte, d, u);
    const piege = d.c ? ` Le côté oblique (${fmt(d.c)} ${u}) ne sert pas : on utilise la hauteur, perpendiculaire à la base.` : '';
    return {
      type: 'numerique', unite: `${u}²`, difficulte: d.c ? 3 : 2,
      enonce: `Calcule l'aire de ${FIGTXT[sorte]}.`,
      cle: `${sorte}|${JSON.stringify(d)}|${u}`,
      figure: figureAire(sorte, d, u),
      reponse: a,
      explication: `${x}${piege}`,
    };
  }, 4),
  // Énoncés en situation (sans figure).
  forme((rng) => {
    const cas = rng.pick([
      () => { const b = rng.int(8, 60); const h = rng.int(5, 40); return { sorte: 'parallelogramme', d: { b, h }, u: 'm', e: `Un champ a la forme d'un parallélogramme. Sa base mesure ${b} m et sa hauteur ${h} m. Quelle est l'aire de ce champ ?` }; },
      () => { const D = rng.pick([40, 50, 60, 70, 80, 90, 100]); const dd = rng.pick([20, 30, 40, 50, 60].filter((x) => x < D)); return { sorte: 'losange', d: { D, dd }, u: 'cm', e: `Un cerf-volant a la forme d'un losange. Ses diagonales mesurent ${D} cm et ${dd} cm. Quelle est l'aire de ce cerf-volant ?` }; },
      () => { const b = rng.int(2, 6); const h = rng.int(3, 9); return { sorte: 'triangle', d: { b, h }, u: 'm', e: `La voile d'un bateau est un triangle de ${b} m de base et de ${h} m de hauteur. Quelle est l'aire de cette voile ?` }; },
      () => { const b = rng.int(8, 30); const B = b + rng.int(4, 20); const h = rng.int(5, 25); return { sorte: 'trapeze', d: { B, b, h }, u: 'm', e: `Un jardin a la forme d'un trapèze. La grande base mesure ${B} m, la petite base ${b} m et la hauteur ${h} m. Quelle est l'aire de ce jardin ?` }; },
      () => { const b = decimal(rng, 2, 12, 1); const h = rng.int(2, 12); return { sorte: 'parallelogramme', d: { b, h }, u: 'cm', e: `Un parallélogramme a une base de ${fmt(b)} cm et une hauteur de ${h} cm. Quelle est son aire ?` }; },
      () => { const b = rng.int(3, 20); const h = decimal(rng, 2, 10, 1); return { sorte: 'triangle', d: { b, h }, u: 'cm', e: `Un triangle a une base de ${b} cm et une hauteur de ${fmt(h)} cm. Quelle est son aire ?` }; },
      () => { const D = rng.int(6, 24); const dd = rng.int(3, D - 1); return { sorte: 'losange', d: { D, dd }, u: 'cm', e: `Les diagonales d'un losange mesurent ${D} cm et ${dd} cm. Quelle est son aire ?` }; },
      () => { const b = rng.int(3, 15); const B = b + rng.int(2, 12); const h = rng.int(2, 12); return { sorte: 'trapeze', d: { B, b, h }, u: 'cm', e: `Un trapèze a une grande base de ${B} cm, une petite base de ${b} cm et une hauteur de ${h} cm. Quelle est son aire ?` }; },
      () => { const b = rng.int(4, 30); const h = rng.int(3, 20); return { sorte: 'triangle', d: { b, h }, u: 'm', e: `Un terrain triangulaire a une base de ${b} m et une hauteur de ${h} m. Quelle est son aire ?` }; },
      () => { const D = rng.int(5, 16) * 2; const dd = rng.int(2, D / 2 - 1) * 2; return { sorte: 'losange', d: { D, dd }, u: 'm', e: `Un massif de fleurs a la forme d'un losange dont les diagonales mesurent ${D} m et ${dd} m. Quelle est son aire ?` }; },
    ])();
    const { a, x } = calculAire(cas.sorte, cas.d, cas.u);
    return { type: 'numerique', unite: `${cas.u}²`, difficulte: 2, enonce: cas.e, reponse: a, explication: x };
  }, 3),
  // Problèmes inverses : retrouver une dimension.
  forme((rng) => {
    const cas = rng.pick(['para', 'tri', 'los', 'trap']);
    const u = rng.pick(['cm', 'm']);
    if (cas === 'para') {
      const b = rng.int(3, 20); const h = rng.int(2, 15); const A = b * h;
      return { type: 'numerique', unite: u, difficulte: 3, enonce: `Un parallélogramme a une aire de ${A} ${u}² et une base de ${b} ${u}. Quelle est sa hauteur ?`, reponse: h, explication: `Aire = base × hauteur, donc hauteur = aire : base = ${A} : ${b} = ${h} ${u}.` };
    }
    if (cas === 'tri') {
      const b = rng.int(3, 20); const h = rng.int(2, 16); if ((b * h) % 2) return null; const A = b * h / 2;
      return { type: 'numerique', unite: u, difficulte: 3, enonce: `Un triangle a une aire de ${A} ${u}² et une base de ${b} ${u}. Quelle est sa hauteur ?`, reponse: h, explication: `Aire = base × hauteur : 2, donc base × hauteur = ${A} × 2 = ${2 * A}. Hauteur = ${2 * A} : ${b} = ${h} ${u}.` };
    }
    if (cas === 'los') {
      const D = rng.int(4, 20); const dd = rng.int(2, D - 1); if ((D * dd) % 2) return null; const A = D * dd / 2;
      return { type: 'numerique', unite: u, difficulte: 3, enonce: `Un losange a une aire de ${A} ${u}². Sa grande diagonale mesure ${D} ${u}. Combien mesure sa petite diagonale ?`, reponse: dd, explication: `Aire = D × d : 2, donc D × d = ${A} × 2 = ${2 * A}. Petite diagonale = ${2 * A} : ${D} = ${dd} ${u}.` };
    }
    const b = rng.int(2, 12); const B = b + rng.int(2, 10); const h = rng.int(2, 12); if (((B + b) * h) % 2) return null; const A = (B + b) * h / 2;
    return { type: 'numerique', unite: u, difficulte: 3, enonce: `Un trapèze a une aire de ${A} ${u}². Ses bases mesurent ${B} ${u} et ${b} ${u}. Quelle est sa hauteur ?`, reponse: h, explication: `Aire = (B + b) × h : 2, donc (B + b) × h = ${A} × 2 = ${2 * A}. B + b = ${B + b}. Hauteur = ${2 * A} : ${B + b} = ${h} ${u}.` };
  }, 2),
  // Unités différentes : il faut convertir avant de calculer.
  forme((rng) => {
    const sorte = rng.pick(['parallelogramme', 'triangle']);
    const bm = rng.int(1, 6); const hcm = rng.pick([20, 25, 40, 50, 60, 75, 80]);
    const h = hcm / 100;
    const a = sorte === 'triangle' ? r(bm * h / 2) : r(bm * h);
    const nom = sorte === 'triangle' ? 'Un triangle' : 'Un parallélogramme';
    return {
      type: 'numerique', unite: 'm²', difficulte: 3,
      enonce: `${nom} a une base de ${bm} m et une hauteur de ${hcm} cm. Quelle est son aire en m² ?`,
      reponse: a,
      explication: `On met tout dans la même unité : ${hcm} cm = ${fmt(h)} m. ${sorte === 'triangle' ? `${FORMULES.triangle} ${bm} × ${fmt(h)} : 2 = ${fmt(a)} m².` : `${FORMULES.parallelogramme} ${bm} × ${fmt(h)} = ${fmt(a)} m².`}`,
    };
  }),
  // Lien avec le rectangle (comprendre la formule).
  forme((rng) => {
    const sorte = rng.pick(['triangle', 'losange', 'parallelogramme']);
    const L = rng.int(4, 20); const l = rng.int(2, 15);
    if (sorte === 'triangle') {
      const bonne = 'La moitié de l\'aire du rectangle';
      return { ...qcm(rng, bonne, ['Le double de l\'aire du rectangle', 'La même aire que le rectangle', 'Le quart de l\'aire du rectangle']), difficulte: 2, enonce: `Un triangle a la même base (${L} cm) et la même hauteur (${l} cm) qu'un rectangle de ${L} cm sur ${l} cm. Quelle est l'aire du triangle ?`, explication: `Le triangle occupe la moitié du rectangle : ${L} × ${l} : 2 = ${fmt(L * l / 2)} cm², la moitié de ${L * l} cm².` };
    }
    if (sorte === 'losange') {
      const bonne = 'La moitié de l\'aire du rectangle';
      return { ...qcm(rng, bonne, ['Le double de l\'aire du rectangle', 'La même aire que le rectangle', 'Le quart de l\'aire du rectangle']), difficulte: 2, enonce: `On dessine un losange dans un rectangle de ${L} cm sur ${l} cm : ses sommets sont les milieux des côtés du rectangle. Quelle est l'aire du losange ?`, explication: `Les diagonales du losange mesurent ${L} cm et ${l} cm. Aire = ${L} × ${l} : 2 = ${fmt(L * l / 2)} cm² : c'est la moitié de l'aire du rectangle (${L * l} cm²).` };
    }
    const bonne = 'La même aire que le rectangle';
    return { ...qcm(rng, bonne, ['Le double de l\'aire du rectangle', 'La moitié de l\'aire du rectangle', 'Le quart de l\'aire du rectangle']), difficulte: 2, enonce: `On découpe un triangle d'un côté d'un parallélogramme et on le recolle de l'autre côté : on obtient un rectangle de ${L} cm sur ${l} cm. Quelle est l'aire du parallélogramme ?`, explication: `Découper et recoller ne change pas l'aire : le parallélogramme a la même aire que le rectangle, ${L} × ${l} = ${L * l} cm² (base × hauteur).` };
  }),
]);

// ===========================================================================
// 2. Logique déductive (tableau à double entrée, solution unique)
// ===========================================================================
const THEMES_LOGIQUE = [
  { intro: 'ont chacun un animal différent', pos: 'a', neg: "n'a pas", niPl: "n'ont", qPers: 'Quel animal a {P} ?',
    items: [['le chat', 'chat'], ['le chien', 'chien'], ['le lapin', 'lapin'], ['le hamster', 'hamster'], ['la tortue', 'tortue'], ['le perroquet', 'perroquet']] },
  { intro: 'pratiquent chacun un sport différent', pos: 'pratique', neg: 'ne pratique pas', niPl: 'ne pratiquent', qPers: 'Quel sport pratique {P} ?',
    items: [['le judo', 'judo'], ['le tennis', 'tennis'], ['la natation', 'natation'], ['le football', 'football'], ['la danse', 'danse'], ["l'escalade", 'escalade']] },
  { intro: "jouent chacun d'un instrument différent", pos: 'joue', neg: 'ne joue pas', niPl: 'ne jouent', qPers: 'De quel instrument joue {P} ?',
    items: [['du piano', 'piano'], ['de la guitare', 'guitare'], ['du violon', 'violon'], ['de la batterie', 'batterie'], ['de la flûte', 'flûte'], ['de la trompette', 'trompette']] },
  { intro: 'ont chacun choisi un dessert différent', pos: 'a choisi', neg: "n'a pas choisi", niPl: "n'ont choisi", qPers: 'Quel dessert a choisi {P} ?',
    items: [['la tarte', 'tarte'], ['la glace', 'glace'], ['la gaufre', 'gaufre'], ['le flan', 'flan'], ['la crêpe', 'crêpe'], ['la salade de fruits', 'salade de fruits']] },
  { intro: "ont chacun un vélo d'une couleur différente", pos: 'a', neg: "n'a pas", niPl: "n'ont", qPers: 'De quelle couleur est le vélo de {P} ?',
    items: [['le vélo rouge', 'rouge'], ['le vélo bleu', 'bleu'], ['le vélo vert', 'vert'], ['le vélo jaune', 'jaune'], ['le vélo noir', 'noir'], ['le vélo blanc', 'blanc']] },
  { intro: 'partent chacun en vacances dans un pays différent', pos: 'part', neg: 'ne part pas', niPl: 'ne partent', qPers: 'Dans quel pays part {P} ?',
    items: [['en Espagne', 'Espagne'], ['en Italie', 'Italie'], ['en Grèce', 'Grèce'], ['au Portugal', 'Portugal'], ['en France', 'France'], ['aux Pays-Bas', 'Pays-Bas']] },
];

function permutations(n) {
  if (n === 1) return [[0]];
  const out = [];
  for (const p of permutations(n - 1)) for (let i = 0; i <= p.length; i++) out.push([...p.slice(0, i), n - 1, ...p.slice(i)]);
  return out;
}
const PERMS = { 3: permutations(3), 4: permutations(4) };

// perm[p] = indice de l'élément attribué à la personne p.
function indiceVrai(ind, perm, genres) {
  switch (ind.t) {
    case 'neg': return perm[ind.p] !== ind.i;
    case 'pos': return perm[ind.p] === ind.i;
    case 'ni': return perm[ind.p1] !== ind.i && perm[ind.p2] !== ind.i;
    case 'soit': return perm[ind.p] === ind.i1 || perm[ind.p] === ind.i2;
    case 'genre': return genres[perm.indexOf(ind.i)] === ind.g;
    default: return false;
  }
}
function texteIndice(ind, th, noms, items) {
  switch (ind.t) {
    case 'neg': return `${noms[ind.p]} ${th.neg} ${items[ind.i][0]}.`;
    case 'pos': return `${noms[ind.p]} ${th.pos} ${items[ind.i][0]}.`;
    case 'ni': return `Ni ${noms[ind.p1]} ni ${noms[ind.p2]} ${th.niPl} ${items[ind.i][0]}.`;
    case 'soit': return `${noms[ind.p]} ${th.pos} soit ${items[ind.i1][0]}, soit ${items[ind.i2][0]}.`;
    case 'genre': return `C'est ${ind.g === 'f' ? 'une fille' : 'un garçon'} qui ${th.pos} ${items[ind.i][0]}.`;
    default: return '';
  }
}

function figureTableauLogique(noms, items) {
  // Colonnes assez larges pour l'étiquette la plus longue (« salade de fruits »).
  const n = noms.length; const c0 = 92; const cw = Math.max(64, Math.max(...items.map((it) => it[1].length)) * 7.4 + 12); const rh = 34; const h0 = 40;
  const W = c0 + n * cw + 8; const H = h0 + n * rh + 14;
  let s = '';
  s += rectSvg(8, 8, W - 16, h0 - 8, { fill: COUL.jaune, sw: 0 });
  for (let j = 0; j < n; j++) s += texteSvg(c0 + j * cw + cw / 2, 8 + (h0 - 8) / 2, items[j][1], { size: 12, bold: true });
  for (let i = 0; i < n; i++) {
    if (i % 2) s += rectSvg(8, h0 + i * rh, W - 16, rh, { fill: '#f4f6fa', sw: 0 });
    s += texteSvg(16, h0 + i * rh + rh / 2, noms[i], { size: 14, anchor: 'start', bold: true });
  }
  for (let i = 0; i <= n; i++) s += ligneSvg([8, h0 + i * rh], [W - 8, h0 + i * rh], { sw: i === 0 ? 2 : 1.2 });
  for (let j = 0; j <= n; j++) s += ligneSvg([c0 + j * cw, 8], [c0 + j * cw, h0 + n * rh], { sw: j === 0 ? 2 : 1.2 });
  s += polySvg([[8, 8], [W - 8, 8], [W - 8, h0 + n * rh], [8, h0 + n * rh]], { sw: 2 });
  return svg(W, H, s);
}

const logique = famille([
  forme((rng) => {
    const n = rng.next() < 0.45 ? 3 : 4;
    const th = rng.pick(THEMES_LOGIQUE);
    const pers = rng.shuffle(PRENOMS).slice(0, n);
    const noms = pers.map((p) => p.n); const genres = pers.map((p) => p.g);
    const items = rng.shuffle(th.items).slice(0, n);
    const sol = rng.shuffle(range(0, n - 1));
    const surItem = rng.next() < 0.5; // « Qui … ? » ou « Quel … a P ? »
    const pCible = rng.int(0, n - 1); const iCible = sol[pCible];

    // Réserve d'indices vrais (jamais l'affirmation directe de la réponse).
    const reserve = [];
    for (let p = 0; p < n; p++) for (let i = 0; i < n; i++) if (sol[p] !== i) reserve.push({ t: 'neg', p, i });
    for (let p1 = 0; p1 < n; p1++) for (let p2 = p1 + 1; p2 < n; p2++) for (let i = 0; i < n; i++) if (sol[p1] !== i && sol[p2] !== i) reserve.push({ t: 'ni', p1, p2, i });
    for (let p = 0; p < n; p++) { const autre = rng.pick(range(0, n - 1).filter((i) => i !== sol[p])); reserve.push(rng.next() < 0.5 ? { t: 'soit', p, i1: sol[p], i2: autre } : { t: 'soit', p, i1: autre, i2: sol[p] }); }
    for (let p = 0; p < n; p++) if (p !== pCible) reserve.push({ t: 'pos', p, i: sol[p] });
    // « C'est un garçon qui… » quand il n'y a qu'un seul garçon revient à donner la case directement :
    // on le traite comme un indice « pos » (jamais sur la personne de la question, au plus un).
    const seul = (g) => genres.filter((x) => x === g).length === 1;
    if (new Set(genres).size > 1) {
      for (let i = 0; i < n; i++) {
        const g = genres[sol.indexOf(i)];
        if (!seul(g)) reserve.push({ t: 'genre', i, g });
        else if (sol.indexOf(i) !== pCible) reserve.push({ t: 'genre', i, g, direct: true });
      }
    }
    // Un « soit…, soit… » dont une des deux options est déjà barrée par un autre indice est maladroit.
    const exclut = (y, p, i) => (y.t === 'neg' && y.p === p && y.i === i) || (y.t === 'ni' && (y.p1 === p || y.p2 === p) && y.i === i);
    const conflit = (x, y) => x.t === 'soit' && (exclut(y, x.p, x.i1) || exclut(y, x.p, x.i2));
    const estPos = (x) => x.t === 'pos' || x.direct;

    const perms = PERMS[n];
    const compte = (inds) => perms.filter((pm) => inds.every((ind) => indiceVrai(ind, pm, genres))).length;
    let choisis = [];
    let posUtilises = 0;
    for (const ind of rng.shuffle(reserve)) {
      if (estPos(ind) && posUtilises >= 1) continue;
      if (choisis.some((y) => conflit(ind, y) || conflit(y, ind))) continue;
      const avant = compte(choisis);
      if (avant === 1) break;
      if (compte([...choisis, ind]) < avant) { choisis.push(ind); if (estPos(ind)) posUtilises++; }
    }
    if (compte(choisis) !== 1) return null;
    // On retire les indices inutiles (énigme minimale).
    for (const ind of rng.shuffle([...choisis])) {
      const sans = choisis.filter((x) => x !== ind);
      if (compte(sans) === 1) choisis = sans;
    }
    if (choisis.length < 2 || choisis.length > 7) return null;
    // L'élève ne doit pas lire directement la réponse : aucune case de la question ne doit être « évidente ».
    if (!surItem && choisis.some((x) => x.t === 'soit' && x.p === pCible && choisis.some((y) => (y.t === 'neg' && y.p === pCible && (y.i === x.i1 || y.i === x.i2)) || (y.t === 'ni' && (y.p1 === pCible || y.p2 === pCible) && (y.i === x.i1 || y.i === x.i2))))) return null;

    const indicesTxt = choisis.map((ind, k) => `${k + 1}. ${texteIndice(ind, th, noms, items)}`);
    const listeItems = enumerer(items.map((it) => it[1]));
    const question = surItem ? `Qui ${th.pos} ${items[iCible][0]} ?` : th.qPers.replace('{P}', noms[pCible]);
    const intro = genres.every((g) => g === 'f') ? th.intro.replace('chacun ', 'chacune ') : th.intro;
    const enonce = `${enumerer(noms)} ${intro} : ${listeItems}.\n${indicesTxt.join('\n')}\n${question}`;
    const bonne = surItem ? noms[pCible] : majuscule(items[iCible][1]);
    const fausses = surItem ? noms.filter((x) => x !== bonne) : items.filter((_, i) => i !== iCible).map((it) => majuscule(it[1]));
    const q = qcm(rng, bonne, fausses, 4, 2);
    const solution = noms.map((nm, p) => `${nm} : ${items[sol[p]][1]}`).join(' ; ');
    return {
      ...q, difficulte: n === 3 ? 2 : 3,
      enonce,
      figure: figureTableauLogique(noms, items),
      explication: `Dans le tableau, on met une croix dans chaque case impossible (indice « ne… pas »). Quand une ligne ou une colonne n'a plus qu'une case libre, c'est la bonne : on barre alors le reste de sa ligne et de sa colonne. Solution : ${solution}. Réponse : ${bonne}.`,
    };
  }),
]);

// ===========================================================================
// 3. Développements de solides
// ===========================================================================
const TRANSF = [([x, y]) => [x, y], ([x, y]) => [-y, x], ([x, y]) => [-x, -y], ([x, y]) => [y, -x],
  ([x, y]) => [-x, y], ([x, y]) => [y, x], ([x, y]) => [x, -y], ([x, y]) => [-y, -x]];
const normaliserCases = (cells) => {
  const mx = Math.min(...cells.map((c) => c[0])); const my = Math.min(...cells.map((c) => c[1]));
  return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
};
const cleCases = (cells) => cells.map(([x, y]) => `${x},${y}`).join(';');
const orienter = (cells, t) => normaliserCases(cells.map(TRANSF[t]));
const canonique = (cells) => TRANSF.map((_, t) => cleCases(orienter(cells, t))).sort()[0];

// Un patron de 6 carrés est un développement du cube si, en « roulant » un cube de case en case,
// chaque case reçoit une face différente (et sans bloc 2 × 2).
function estPatronCube(cells) {
  const set = new Set(cells.map((c) => `${c[0]},${c[1]}`));
  let aretes = 0;
  for (const [x, y] of cells) { if (set.has(`${x + 1},${y}`)) aretes++; if (set.has(`${x},${y + 1}`)) aretes++; }
  if (aretes !== cells.length - 1) return false;
  const roule = {
    '1,0': (s) => ({ b: s.e, e: s.t, t: s.w, w: s.b, n: s.n, s: s.s }),
    '-1,0': (s) => ({ b: s.w, w: s.t, t: s.e, e: s.b, n: s.n, s: s.s }),
    '0,1': (s) => ({ b: s.s, s: s.t, t: s.n, n: s.b, e: s.e, w: s.w }),
    '0,-1': (s) => ({ b: s.n, n: s.t, t: s.s, s: s.b, e: s.e, w: s.w }),
  };
  const etats = new Map([[`${cells[0][0]},${cells[0][1]}`, { b: 0, t: 1, n: 2, s: 3, e: 4, w: 5 }]]);
  const file = [cells[0]];
  while (file.length) {
    const [x, y] = file.shift(); const st = etats.get(`${x},${y}`);
    for (const d of Object.keys(roule)) {
      const [dx, dy] = d.split(',').map(Number); const k = `${x + dx},${y + dy}`;
      if (set.has(k) && !etats.has(k)) { etats.set(k, roule[d](st)); file.push([x + dx, y + dy]); }
    }
  }
  return new Set([...etats.values()].map((s) => s.b)).size === 6;
}
let HEXA = null;
function hexominos() {
  if (HEXA) return HEXA;
  let cur = new Map([['0,0', [[0, 0]]]]);
  for (let k = 2; k <= 6; k++) {
    const next = new Map();
    for (const cells of cur.values()) {
      const set = new Set(cells.map((c) => `${c[0]},${c[1]}`));
      for (const [x, y] of cells) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (set.has(`${x + dx},${y + dy}`)) continue;
          const nc = normaliserCases([...cells, [x + dx, y + dy]]);
          next.set(cleCases(nc), nc);
        }
      }
    }
    cur = next;
  }
  const libres = new Map();
  for (const cells of cur.values()) { const c = canonique(cells); if (!libres.has(c)) libres.set(c, cells); }
  const tous = [...libres.values()];
  HEXA = { valides: tous.filter(estPatronCube), invalides: tous.filter((c) => !estPatronCube(c)) };
  return HEXA;
}

function dessinCases(cells, x0, y0, u, fill) {
  return cells.map(([x, y]) => rectSvg(x0 + x * u, y0 + y * u, u, u, { fill, sw: 1.8 })).join('');
}
function figurePatron(cells, fill) {
  const w = Math.max(...cells.map((c) => c[0])) + 1; const h = Math.max(...cells.map((c) => c[1])) + 1;
  const u = Math.min(300 / w, 200 / h, 46);
  const W = 340; const H = h * u + 40;
  return svg(W, H, dessinCases(cells, (W - w * u) / 2, 20, u, fill));
}
function figureQuatrePatrons(liste, fill) {
  const W = 400; const H = 340; const pw = 200; const ph = 170;
  let s = ligneSvg([W / 2, 10], [W / 2, H - 10], { stroke: COUL.grille, sw: 1.5 }) + ligneSvg([10, H / 2], [W - 10, H / 2], { stroke: COUL.grille, sw: 1.5 });
  liste.forEach((cells, k) => {
    const px = (k % 2) * pw; const py = Math.floor(k / 2) * ph;
    const w = Math.max(...cells.map((c) => c[0])) + 1; const h = Math.max(...cells.map((c) => c[1])) + 1;
    const u = Math.min(150 / w, 118 / h, 30);
    s += texteSvg(px + 16, py + 18, 'ABCD'[k], { size: 18, bold: true });
    s += dessinCases(cells, px + 30 + (160 - w * u) / 2, py + 34 + (122 - h * u) / 2, u, fill);
  });
  return svg(W, H, s);
}

// Patrons des autres solides (coordonnées monde, puis rendu cadré).
function patronPave(rng) {
  const [L, l, h] = rng.shuffle([2, 3, 4, 5]).slice(0, 3);
  const P = [];
  const x0 = l; const fill = COUL.orange;
  const faces = [[0, l], [l, h], [l + h, l], [2 * l + h, h]]; // [y, hauteur] : dessus, devant, dessous, arrière
  for (const [y, hh] of faces) P.push([[x0, y], [x0 + L, y], [x0 + L, y + hh], [x0, y + hh]]);
  const yG = rng.pick([l, 2 * l + h]); const yD = rng.pick([l, 2 * l + h]);
  P.push([[0, yG], [l, yG], [l, yG + h], [0, yG + h]]);
  P.push([[x0 + L, yD], [x0 + L + l, yD], [x0 + L + l, yD + h], [x0 + L, yD + h]]);
  const t = rng.int(0, 7);
  return { prims: P.map((poly) => ({ t: 'poly', P: poly.map(TRANSF[t]), fill })), cle: `pave|${L},${l},${h}|${yG},${yD}|${t}` };
}
function triangleSur(xa, ya, xb, yb, gauche, droite, sens) {
  const L0 = Math.hypot(xb - xa, yb - ya);
  const px = (L0 * L0 + gauche * gauche - droite * droite) / (2 * L0);
  const py = Math.sqrt(Math.max(gauche * gauche - px * px, 0));
  return [[xa, ya], [xb, yb], [xa + px, ya + sens * py]];
}
// Prisme droit à base triangulaire : 3 rectangles côte à côte + 2 triangles (un en haut, un en bas).
function patronPrisme(rng, { nbRect = 3, deuxEnHaut = false } = {}) {
  const iso = rng.next() < 0.5;
  const a = rng.pick([2, 2.5, 3]); const sIso = rng.pick([2.5, 3, 3.5]);
  const largeurs = iso ? rng.shuffle([a, sIso, sIso]) : [a, a, a];
  const H = rng.pick([3, 3.5, 4, 5]);
  const ws = nbRect === 3 ? largeurs : nbRect === 4 ? [a, a, a, a] : [a, a];
  const xs = [0]; ws.forEach((w) => xs.push(xs[xs.length - 1] + w));
  const fill = COUL.vert;
  const P = ws.map((w, k) => [[xs[k], 0], [xs[k] + w, 0], [xs[k] + w, H], [xs[k], H]]);
  const m = ws.length;
  const kHaut = rng.int(0, m - 1);
  let kBas = rng.int(0, m - 1);
  const cote = (k) => ws[((k % m) + m) % m];
  const triangle = (k, enHaut) => (enHaut
    ? triangleSur(xs[k], 0, xs[k] + ws[k], 0, nbRect === 3 ? cote(k - 1) : a, nbRect === 3 ? cote(k + 1) : a, -1)
    : triangleSur(xs[k], H, xs[k] + ws[k], H, nbRect === 3 ? cote(k - 1) : a, nbRect === 3 ? cote(k + 1) : a, 1));
  P.push(triangle(kHaut, true));
  if (deuxEnHaut) { kBas = (kHaut + 1 + rng.int(0, m - 2)) % m; P.push(triangle(kBas, true)); } else P.push(triangle(kBas, false));
  const t = rng.pick([0, 1, 2, 3]);
  return { prims: P.map((poly) => ({ t: 'poly', P: poly.map(TRANSF[t]), fill })), cle: `prisme|${ws.join(',')}|${H}|${kHaut},${kBas},${deuxEnHaut}|${t}` };
}
function patronPyramide(rng) {
  const a = 3; const t = rng.pick([2.2, 2.6, 3, 3.4, 3.8]);
  const fill = COUL.violet;
  const P = [[[0, 0], [a, 0], [a, a], [0, a]], [[0, 0], [a, 0], [a / 2, -t]], [[a, 0], [a, a], [a + t, a / 2]], [[a, a], [0, a], [a / 2, a + t]], [[0, a], [0, 0], [-t, a / 2]]];
  const tr = rng.pick([0, 1]);
  const rot = (p) => (tr ? [(p[0] - a / 2 - (p[1] - a / 2)) * Math.SQRT1_2, (p[0] - a / 2 + (p[1] - a / 2)) * Math.SQRT1_2] : p);
  return { prims: P.map((poly) => ({ t: 'poly', P: poly.map(rot), fill })), cle: `pyramide|${t}|${tr}` };
}
function patronCylindre(rng) {
  const rr = rng.pick([0.8, 1, 1.2, 1.4]); const W = r(2 * Math.PI * rr); const H = rng.pick([3, 4, 5, 6]);
  const xh = r(rr + rng.next() * (W - 2 * rr), 1); const xb = r(rr + rng.next() * (W - 2 * rr), 1);
  const fill = COUL.bleu;
  const vertical = rng.next() < 0.5;
  const T = vertical ? ([x, y]) => [y, x] : (p) => p;
  return {
    prims: [{ t: 'poly', P: [[0, 0], [W, 0], [W, H], [0, H]].map(T), fill }, { t: 'cercle', c: T([xh, -rr]), r: rr, fill }, { t: 'cercle', c: T([xb, H + rr]), r: rr, fill }],
    cle: `cylindre|${rr}|${H}|${xh},${xb}|${vertical}`,
  };
}
const SOLIDES = {
  cube: { nom: 'le cube', faces: 6, aretes: 12, sommets: 8 },
  pave: { nom: 'le pavé droit', faces: 6, aretes: 12, sommets: 8 },
  prisme: { nom: 'le prisme droit à base triangulaire', faces: 5, aretes: 9, sommets: 6 },
  pyramide: { nom: 'la pyramide à base carrée', faces: 5, aretes: 8, sommets: 5 },
  cylindre: { nom: 'le cylindre' },
};
const NOMS_SOLIDES = ['le cube', 'le pavé droit', 'le prisme droit à base triangulaire', 'la pyramide à base carrée', 'le cylindre', 'le cône', 'la pyramide à base triangulaire'];
const INDICES_SOLIDES = {
  cube: '6 carrés identiques : c\'est le développement d\'un cube.',
  pave: '6 rectangles, identiques deux à deux : c\'est le développement d\'un pavé droit.',
  prisme: '2 triangles (les bases) et 3 rectangles (les faces latérales) : c\'est un prisme droit à base triangulaire.',
  pyramide: 'Un carré (la base) et 4 triangles qui se rejoignent au sommet : c\'est une pyramide à base carrée.',
  cylindre: 'Un rectangle (la surface courbe une fois déroulée) et 2 disques : c\'est un cylindre.',
};
function patronSolide(rng, sorte) {
  if (sorte === 'cube') {
    const { valides } = hexominos(); const t = rng.int(0, 7); const k = rng.int(0, valides.length - 1);
    const cells = orienter(valides[k], t);
    return { figure: figurePatron(cells, COUL.jaune), cle: `cube|${cleCases(cells)}` };
  }
  const p = sorte === 'pave' ? patronPave(rng) : sorte === 'prisme' ? patronPrisme(rng) : sorte === 'pyramide' ? patronPyramide(rng) : patronCylindre(rng);
  return { figure: rendu(p.prims, 360, 260, { marge: 16, echelleMax: 40 }), cle: p.cle };
}

const developpements = famille([
  // Quel solide ?
  forme((rng) => {
    const sorte = rng.pick(['cube', 'pave', 'prisme', 'pyramide', 'cylindre']);
    const { figure, cle } = patronSolide(rng, sorte);
    const bonne = SOLIDES[sorte].nom;
    const fausses = NOMS_SOLIDES.filter((n) => n !== bonne && !(sorte === 'cube' && n === 'le pavé droit'));
    return {
      ...qcm(rng, majuscule(bonne), fausses.map(majuscule)), difficulte: 1,
      enonce: 'Quel solide obtient-on en pliant ce développement ?',
      cle, figure,
      explication: `${INDICES_SOLIDES[sorte]}`,
    };
  }, 3),
  // Combien de faces / arêtes / sommets aura le solide ?
  forme((rng) => {
    const sorte = rng.pick(['cube', 'pave', 'prisme', 'pyramide']);
    const { figure, cle } = patronSolide(rng, sorte);
    const S = SOLIDES[sorte];
    const quoi = rng.pick(['faces', 'aretes', 'sommets']);
    const mot = { faces: 'faces', aretes: 'arêtes', sommets: 'sommets' }[quoi];
    return {
      type: 'numerique', difficulte: quoi === 'faces' ? 2 : 3,
      enonce: `On plie ce développement pour construire un solide. Combien ${quoi === 'aretes' ? "d'arêtes" : `de ${mot}`} aura ce solide ?`,
      cle, figure, reponse: S[quoi],
      explication: `${INDICES_SOLIDES[sorte]} ${majuscule(S.nom)} a ${S.faces} faces, ${S.aretes} arêtes et ${S.sommets} sommets.`,
    };
  }, 2),
  // Lequel est (n'est pas) un développement du cube ?
  forme((rng) => {
    const { valides, invalides } = hexominos();
    const nier = rng.next() < 0.35;
    const pris = nier
      ? { bon: rng.pick(invalides), autres: rng.shuffle(valides).slice(0, 3) }
      : { bon: rng.pick(valides), autres: rng.shuffle(invalides.filter((c) => Math.max(...c.map((x) => x[0])) < 5 && Math.max(...c.map((x) => x[1])) < 5)).slice(0, 3) };
    const liste = rng.shuffle([pris.bon, ...pris.autres]).map((c) => orienter(c, rng.int(0, 7)));
    const idx = liste.findIndex((c) => canonique(c) === canonique(pris.bon));
    const lettres = ['A', 'B', 'C', 'D'];
    const bonne = lettres[idx];
    return {
      type: 'qcm', choix: lettres, reponse: idx, difficulte: 3,
      enonce: nier ? "Lequel de ces dessins n'est PAS un développement du cube ?" : 'Lequel de ces dessins est un développement du cube ?',
      cle: liste.map(cleCases).join('/'),
      figure: figureQuatrePatrons(liste, COUL.jaune),
      explication: nier
        ? `Le dessin ${bonne} ne se referme pas en cube : en le pliant, deux carrés viennent se superposer et une face reste ouverte. Les trois autres sont des développements du cube (il en existe 11 différents).`
        : `Seul le dessin ${bonne} se plie en cube. Dans les autres, deux carrés viennent se superposer en pliant (et une face manque). Astuce : imagine une face posée au sol et replie les autres autour.`,
    };
  }, 3),
  // Vrai ou faux : ce dessin est-il un développement du cube / du prisme ?
  forme((rng) => {
    if (rng.next() < 0.6) {
      const { valides, invalides } = hexominos();
      const ok = rng.next() < 0.5;
      const cells = orienter(ok ? rng.pick(valides) : rng.pick(invalides), rng.int(0, 7));
      return {
        type: 'vrai_faux', reponse: ok, difficulte: 3,
        enonce: 'Vrai ou faux ? Ce dessin est un développement du cube.',
        cle: cleCases(cells), figure: figurePatron(cells, COUL.jaune),
        explication: ok ? 'Vrai : en pliant, chaque carré devient une face différente du cube.' : 'Faux : en pliant, deux carrés se superposent et une face du cube reste ouverte.',
      };
    }
    const cas = rng.pick(['ok', 'ok', 'deuxEnHaut', 'quatre', 'deux']);
    const p = cas === 'ok' ? patronPrisme(rng) : cas === 'deuxEnHaut' ? patronPrisme(rng, { deuxEnHaut: true }) : patronPrisme(rng, { nbRect: cas === 'quatre' ? 4 : 2 });
    const expl = {
      ok: 'Vrai : 3 rectangles pour les faces latérales et un triangle de chaque côté de la bande de rectangles pour les deux bases.',
      deuxEnHaut: 'Faux : les deux triangles sont du même côté de la bande de rectangles. En pliant, ils viennent fermer la même base et se superposent : l\'autre base reste ouverte.',
      quatre: 'Faux : il y a 4 rectangles. Un prisme à base triangulaire a seulement 3 faces latérales (une par côté du triangle).',
      deux: 'Faux : il n\'y a que 2 rectangles. Un prisme à base triangulaire a 3 faces latérales (une par côté du triangle).',
    }[cas];
    return {
      type: 'vrai_faux', reponse: cas === 'ok', difficulte: 3,
      enonce: 'Vrai ou faux ? Ce dessin est un développement d\'un prisme droit à base triangulaire.',
      cle: p.cle, figure: rendu(p.prims, 360, 260, { marge: 16, echelleMax: 40 }),
      explication: expl,
    };
  }, 2),
]);

// ===========================================================================
// 4. Lire des représentations : ensembles, arbres, tableaux, diagrammes à bandes
// ===========================================================================
const COUPLES_ENSEMBLES = [
  { qui: 'élèves', a: 'football', b: 'natation', c: 'judo', titre: 'Les sports des élèves de 6e', ph: { football: 'pratiquent le football', natation: 'pratiquent la natation' } },
  { qui: 'enfants', a: 'pommes', b: 'poires', c: 'fraises', titre: 'Les fruits préférés', ph: { pommes: 'aiment les pommes', poires: 'aiment les poires' } },
  { qui: 'élèves', a: 'néerlandais', b: 'anglais', c: 'arabe', titre: 'Les langues parlées', ph: { néerlandais: 'parlent néerlandais', anglais: 'parlent anglais' } },
  { qui: 'enfants', a: 'chat', b: 'chien', c: 'poisson', titre: 'Les animaux de la classe', ph: { chat: 'ont un chat', chien: 'ont un chien' } },
  { qui: 'élèves', a: 'piano', b: 'guitare', c: 'chant', titre: 'Les activités musicales', ph: { piano: 'font du piano', guitare: 'font de la guitare' } },
];
const verbeEns = (C, x) => C.ph[x];
function figureVenn2(C, v, avecNombres = true) {
  const W = 400; const H = 270;
  let s = rectSvg(10, 10, W - 20, H - 20, { fill: '#ffffff', sw: 1.8 });
  s += cercleSvg(155, 145, 95, { fill: COUL.bleuF, opacite: 0.14, sw: 2 }) + cercleSvg(245, 145, 95, { fill: COUL.orangeF, opacite: 0.14, sw: 2 });
  s += texteSvg(105, 34, majuscule(C.a), { size: 15, bold: true }) + texteSvg(295, 34, majuscule(C.b), { size: 15, bold: true });
  if (avecNombres) {
    s += texteSvg(108, 145, String(v.a), { size: 20, bold: true }) + texteSvg(200, 145, String(v.ab), { size: 20, bold: true }) + texteSvg(292, 145, String(v.b), { size: 20, bold: true });
    s += texteSvg(370, 240, String(v.o), { size: 20, bold: true });
  }
  return svg(W, H, s);
}
function figureVenn3(C, v) {
  const W = 400; const H = 340;
  let s = rectSvg(10, 10, W - 20, H - 20, { fill: '#ffffff', sw: 1.8 });
  const A = [160, 130]; const B = [240, 130]; const Cc = [200, 200]; const R = 88;
  s += cercleSvg(...A, R, { fill: COUL.bleuF, opacite: 0.12 }) + cercleSvg(...B, R, { fill: COUL.orangeF, opacite: 0.12 }) + cercleSvg(...Cc, R, { fill: COUL.vertF, opacite: 0.12 });
  s += texteSvg(70, 40, majuscule(C.a), { size: 15, bold: true }) + texteSvg(330, 40, majuscule(C.b), { size: 15, bold: true }) + texteSvg(200, 312, majuscule(C.c), { size: 15, bold: true });
  const T = (x, y, n) => texteSvg(x, y, String(n), { size: 18, bold: true });
  s += T(120, 110, v.a) + T(280, 110, v.b) + T(200, 245, v.c) + T(200, 95, v.ab) + T(150, 185, v.ac) + T(250, 185, v.bc) + T(200, 158, v.abc) + T(370, 310, v.o);
  return svg(W, H, s);
}
const PREMIERS_ENS = [[2, 'multiples de 2'], [3, 'multiples de 3'], [5, 'multiples de 5'], [4, 'multiples de 4']];
function figureVennNombres(lA, lB, zones) {
  const W = 400; const H = 270;
  let s = rectSvg(10, 10, W - 20, H - 20, { fill: '#ffffff', sw: 1.8 });
  s += cercleSvg(150, 145, 100, { fill: COUL.bleuF, opacite: 0.12 }) + cercleSvg(250, 145, 100, { fill: COUL.orangeF, opacite: 0.12 });
  s += texteSvg(100, 28, lA, { size: 14, bold: true }) + texteSvg(300, 28, lB, { size: 14, bold: true });
  const SLOTS = {
    a: [[85, 100], [85, 145], [85, 190], [122, 75], [122, 122], [122, 168], [122, 215]],
    ab: [[200, 85], [200, 125], [200, 165], [200, 205]],
    b: [[315, 100], [315, 145], [315, 190], [278, 75], [278, 122], [278, 168], [278, 215]],
    o: [[30, 250], [370, 250], [30, 215], [370, 215], [200, 255], [30, 180]],
  };
  for (const z of Object.keys(zones)) zones[z].forEach((n, k) => { const [x, y] = SLOTS[z][k]; s += texteSvg(x, y, String(n), { size: 15 }); });
  return svg(W, H, s);
}
function figureArbre(niveaux, titres) {
  // niveaux : listes d'options ; arbre complet horizontal.
  const feuilles = niveaux.reduce((p, l) => p * l.length, 1);
  const pas = 22; const H = feuilles * pas + 50; const W = 400;
  const xs = [18, 120, 235, 345].slice(0, niveaux.length + 1);
  let s = '';
  titres.forEach((t, k) => { s += texteSvg(xs[k + 1], 14, t, { size: 12, bold: true, fill: COUL.doux }); });
  const noeud = (niv, debut, nb) => {
    // renvoie y du nœud couvrant les feuilles [debut, debut + nb[
    return 36 + (debut + nb / 2) * pas;
  };
  const dessiner = (niv, debut, nb, yParent, xParent) => {
    if (niv === niveaux.length) return;
    const opts = niveaux[niv]; const part = nb / opts.length;
    opts.forEach((o, k) => {
      const y = noeud(niv, debut + k * part, part);
      s += ligneSvg([xParent + 4, yParent], [xs[niv + 1] - 4, y], { sw: 1.3 });
      s += cercleSvg(xs[niv + 1], y, 2.6, { fill: COUL.trait, sw: 0 });
      s += texteSvg(xs[niv + 1] + 4, y - 9, o, { size: 11.5, anchor: 'start', halo: true });
      dessiner(niv + 1, debut + k * part, part, y, xs[niv + 1]);
    });
  };
  const yRacine = noeud(0, 0, feuilles);
  s += cercleSvg(xs[0], yRacine, 4, { fill: COUL.trait, sw: 0 });
  dessiner(0, 0, feuilles, yRacine, xs[0]);
  return svg(W, H, s);
}
function figureTableau(lignes, colonnes, vals, coin) {
  const c0 = 96; const cw = Math.min(70, (390 - c0) / colonnes.length); const rh = 32; const h0 = 36;
  const W = c0 + colonnes.length * cw + 16; const H = h0 + lignes.length * rh + 16;
  let s = rectSvg(8, 8, W - 16, h0 - 8, { fill: COUL.jaune, sw: 0 });
  s += texteSvg(14, 8 + (h0 - 8) / 2, coin, { size: 10.5, anchor: 'start', fill: COUL.doux });
  colonnes.forEach((c, j) => { s += texteSvg(c0 + j * cw + cw / 2, 8 + (h0 - 8) / 2, c, { size: 12, bold: true }); });
  lignes.forEach((l, i) => {
    if (i % 2) s += rectSvg(8, h0 + i * rh, W - 16, rh, { fill: '#f4f6fa', sw: 0 });
    s += texteSvg(16, h0 + i * rh + rh / 2, l, { size: 13, anchor: 'start', bold: true });
    vals[i].forEach((v, j) => { s += texteSvg(c0 + j * cw + cw / 2, h0 + i * rh + rh / 2, fmt(v), { size: 14 }); });
  });
  for (let i = 0; i <= lignes.length; i++) s += ligneSvg([8, h0 + i * rh], [W - 8, h0 + i * rh], { sw: i === 0 ? 2 : 1.1 });
  for (let j = 0; j <= colonnes.length; j++) s += ligneSvg([c0 + j * cw, 8], [c0 + j * cw, h0 + lignes.length * rh], { sw: j === 0 ? 2 : 1.1 });
  s += polySvg([[8, 8], [W - 8, 8], [W - 8, h0 + lignes.length * rh], [8, h0 + lignes.length * rh]], { sw: 2 });
  return svg(W, H, s);
}
function figureBandes(cats, vals, pas, graduation, titre, horizontal) {
  const max = Math.ceil(Math.max(...vals) / graduation) * graduation + graduation;
  const W = 400; const H = 300;
  let s = texteSvg(W / 2, 16, titre, { size: 13, bold: true });
  if (!horizontal) {
    const x0 = 52; const y0 = 260; const hT = 220; const lT = 330; const k = hT / max;
    for (let v = 0; v <= max; v += pas) {
      const y = y0 - v * k;
      s += ligneSvg([x0, y], [x0 + lT, y], { stroke: COUL.grille, sw: 1 });
      if (v % graduation === 0) s += texteSvg(x0 - 6, y, fmt(v), { size: 11, anchor: 'end' });
    }
    const bw = lT / cats.length;
    cats.forEach((c, i) => {
      const hh = vals[i] * k;
      s += rectSvg(x0 + i * bw + bw * 0.2, y0 - hh, bw * 0.6, hh, { fill: FONDS[i % FONDS.length], sw: 1.6 });
      s += texteSvg(x0 + i * bw + bw / 2, y0 + 14, c, { size: c.length > 8 ? 10 : 12 });
    });
    s += ligneSvg([x0, y0], [x0 + lT, y0]) + ligneSvg([x0, y0], [x0, y0 - hT]);
  } else {
    const x0 = 96; const y0 = 36; const lT = 280; const hT = 230; const k = lT / max;
    for (let v = 0; v <= max; v += pas) {
      const x = x0 + v * k;
      s += ligneSvg([x, y0], [x, y0 + hT], { stroke: COUL.grille, sw: 1 });
      if (v % graduation === 0) s += texteSvg(x, y0 + hT + 13, fmt(v), { size: 11 });
    }
    const bh = hT / cats.length;
    cats.forEach((c, i) => {
      s += rectSvg(x0, y0 + i * bh + bh * 0.2, vals[i] * k, bh * 0.6, { fill: FONDS[i % FONDS.length], sw: 1.6 });
      s += texteSvg(x0 - 6, y0 + i * bh + bh / 2, c, { size: 12, anchor: 'end' });
    });
    s += ligneSvg([x0, y0], [x0, y0 + hT]) + ligneSvg([x0, y0 + hT], [x0 + lT, y0 + hT]);
  }
  return svg(W, H, s);
}
const CONTEXTES_TABLEAU = [
  { coin: 'classe / transport', lignes: ['5A', '5B', '6A', '6B'], colonnes: ['à pied', 'à vélo', 'en bus', 'en voiture'], qui: 'élèves', phrase: (l, c) => `Combien d'élèves de la ${l} viennent à l'école ${c} ?`, total: (c) => `Combien d'élèves viennent à l'école ${c} en tout ?`, totalL: (l) => `Combien d'élèves y a-t-il en ${l} ?`, max: (c) => `Quelle classe compte le plus d'élèves qui viennent ${c} ?`, nomL: (l) => `la ${l}` },
  { coin: 'jour / repas', lignes: ['lundi', 'mardi', 'jeudi', 'vendredi'], colonnes: ['pâtes', 'poisson', 'poulet', 'légumes'], qui: 'repas', phrase: (l, c) => `Combien de repas « ${c} » la cantine a-t-elle servis le ${l} ?`, total: (c) => `Combien de repas « ${c} » ont été servis en tout ?`, totalL: (l) => `Combien de repas ont été servis le ${l} ?`, max: (c) => `Quel jour a-t-on servi le plus de repas « ${c} » ?`, nomL: (l) => l },
  { coin: 'mois / livres', lignes: ['janvier', 'février', 'mars'], colonnes: ['romans', 'BD', 'documentaires'], qui: 'livres', phrase: (l, c) => `Combien de ${c} la bibliothèque a-t-elle prêté${c === 'BD' ? 'e' : ''}s en ${l} ?`, total: (c) => `Combien de ${c} ont été prêté${c === 'BD' ? 'e' : ''}s en tout ?`, totalL: (l) => `Combien de livres ont été prêtés en ${l} ?`, max: (c) => `En quel mois a-t-on prêté le plus de ${c} ?`, nomL: (l) => l },
  { coin: 'équipe / médailles', lignes: ['Rouges', 'Bleus', 'Verts', 'Jaunes'], colonnes: ['or', 'argent', 'bronze'], qui: 'médailles', phrase: (l, c) => `Combien de médailles ${c === 'or' || c === 'argent' ? "d'" : 'de '}${c} l'équipe des ${l} a-t-elle gagnées ?`, total: (c) => `Combien de médailles ${c === 'or' || c === 'argent' ? "d'" : 'de '}${c} ont été distribuées en tout ?`, totalL: (l) => `Combien de médailles l'équipe des ${l} a-t-elle gagnées ?`, max: (c) => `Quelle équipe a gagné le plus de médailles ${c === 'or' || c === 'argent' ? "d'" : 'de '}${c} ?`, nomL: (l) => `les ${l}` },
];
const CONTEXTES_BANDES = [
  { titre: 'Fruits vendus à la récréation', cats: ['pommes', 'bananes', 'poires', 'kiwis', 'oranges', 'prunes'], unite: 'fruits', ecart: (g, p) => `Quel est l'écart entre les ventes de ${g} et celles de ${p} ?`, q: (c) => `Combien de ${c} ont été vendu${c === 'pommes' || c === 'bananes' || c === 'poires' || c === 'oranges' || c === 'prunes' ? 'e' : ''}s ?` },
  { titre: 'Élèves inscrits par activité', cats: ['théâtre', 'judo', 'chorale', 'échecs', 'dessin', 'basket'], unite: 'élèves', ecart: (g, p) => `Combien d'élèves de plus sont inscrits à l'activité « ${g} » qu'à l'activité « ${p} » ?`, q: (c) => `Combien d'élèves sont inscrits à l'activité « ${c} » ?` },
  { titre: 'Visiteurs du musée', pasMin: 5, cats: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'], unite: 'visiteurs', ecart: (g, p) => `Combien de visiteurs de plus sont venus le ${g} que le ${p} ?`, q: (c) => `Combien de visiteurs sont venus le ${c} ?` },
  { titre: 'Livres lus pendant les vacances', cats: ['Léa', 'Tom', 'Agathe', 'Antoine', 'Zoé', 'Hugo'], unite: 'livres', ecart: (g, p) => `Combien de livres ${g} a-t-${['Léa', 'Agathe', 'Zoé'].includes(g) ? 'elle' : 'il'} lus de plus ${/^[AEIOUÉÈ]/.test(p) ? "qu'" : 'que '}${p} ?`, q: (c) => `Combien de livres ${c} a-t-${['Léa', 'Agathe', 'Zoé'].includes(c) ? 'elle' : 'il'} lus ?` },
];

const representations = famille([
  // Ensembles (2) avec effectifs.
  forme((rng) => {
    const C = rng.pick(COUPLES_ENSEMBLES);
    const v = { a: rng.int(2, 14), ab: rng.int(1, 9), b: rng.int(2, 14), o: rng.int(0, 6) };
    const total = v.a + v.ab + v.b + v.o;
    const fa = verbeEns(C, C.a); const fb = verbeEns(C, C.b);
    const qs = [
      [`Combien d'${C.qui} sont à la fois dans l'ensemble « ${C.a} » et dans l'ensemble « ${C.b} » ?`, v.ab, `On lit le nombre dans la partie commune aux deux ensembles (l'intersection) : ${v.ab}.`],
      [`Combien d'${C.qui} ${fa} seulement ?`, v.a, `« Seulement » : on prend la partie de l'ensemble « ${C.a} » qui n'est pas dans l'autre : ${v.a}.`],
      [`Combien d'${C.qui} ${fb} (en tout) ?`, v.b + v.ab, `Tout l'ensemble « ${C.b} » : ${v.b} + ${v.ab} = ${v.b + v.ab}. N'oublie pas l'intersection !`],
      [`Combien d'${C.qui} ${fa} (en tout) ?`, v.a + v.ab, `Tout l'ensemble « ${C.a} » : ${v.a} + ${v.ab} = ${v.a + v.ab}. N'oublie pas l'intersection !`],
      [`Combien d'${C.qui} sont représentés en tout dans ce diagramme ?`, total, `On additionne toutes les zones, même celle en dehors des cercles : ${v.a} + ${v.ab} + ${v.b} + ${v.o} = ${total}.`],
      [`Combien d'${C.qui} ne sont dans aucun des deux ensembles ?`, v.o, `On lit le nombre écrit en dehors des deux cercles : ${v.o}.`],
      [`Combien d'${C.qui} sont dans un seul des deux ensembles ?`, v.a + v.b, `Un seul ensemble : on additionne les deux parties sans l'intersection : ${v.a} + ${v.b} = ${v.a + v.b}.`],
    ];
    const [e, rep, x] = rng.pick(qs);
    return {
      type: 'numerique', difficulte: 2,
      enonce: `${C.titre} : chaque ${C.qui === 'élèves' ? 'élève' : 'enfant'} est compté une seule fois dans le diagramme.\n${e}`,
      cle: JSON.stringify(v), figure: figureVenn2(C, v), reponse: rep, explication: x,
    };
  }, 2),
  // Ensembles (3) avec intersections.
  forme((rng) => {
    const C = rng.pick(COUPLES_ENSEMBLES);
    const v = { a: rng.int(1, 9), b: rng.int(1, 9), c: rng.int(1, 9), ab: rng.int(0, 6), ac: rng.int(0, 6), bc: rng.int(0, 6), abc: rng.int(1, 5), o: rng.int(0, 5) };
    const tot = Object.values(v).reduce((a, b) => a + b, 0);
    const qs = [
      [`Combien d'${C.qui} sont dans les trois ensembles « ${C.a} », « ${C.b} » et « ${C.c} » ?`, v.abc, `La zone au centre, commune aux trois cercles : ${v.abc}.`],
      [`Combien d'${C.qui} sont seulement dans l'ensemble « ${C.a} » ?`, v.a, `La partie du cercle « ${C.a} » qui ne touche aucun autre cercle : ${v.a}.`],
      [`Combien d'${C.qui} sont dans les ensembles « ${C.a} » et « ${C.b} », mais pas « ${C.c} » ?`, v.ab, `La zone commune à « ${C.a} » et « ${C.b} », en dehors du cercle « ${C.c} » : ${v.ab}.`],
      [`Combien d'${C.qui} sont dans l'ensemble « ${C.c} » (en tout) ?`, v.c + v.ac + v.bc + v.abc, `Toutes les zones du cercle « ${C.c} » : ${v.c} + ${v.ac} + ${v.bc} + ${v.abc} = ${v.c + v.ac + v.bc + v.abc}.`],
      [`Combien d'${C.qui} sont dans exactement deux ensembles ?`, v.ab + v.ac + v.bc, `Les trois zones communes à deux cercles seulement (sans le centre) : ${v.ab} + ${v.ac} + ${v.bc} = ${v.ab + v.ac + v.bc}.`],
      [`Combien d'${C.qui} y a-t-il en tout ?`, tot, `On additionne les 8 zones, y compris celle en dehors des cercles : ${[v.a, v.b, v.c, v.ab, v.ac, v.bc, v.abc, v.o].join(' + ')} = ${tot}.`],
    ];
    const [e, rep, x] = rng.pick(qs);
    return {
      type: 'numerique', difficulte: 3,
      enonce: `${C.titre} (diagramme à trois ensembles).\n${e}`,
      cle: JSON.stringify(v), figure: figureVenn3(C, v), reponse: rep, explication: x,
    };
  }, 2),
  // Ensembles de nombres (multiples).
  forme((rng) => {
    const [[pA, lA], [pB, lB]] = rng.shuffle(PREMIERS_ENS.filter(([p]) => p !== 4)).slice(0, 2);
    const nombres = rng.shuffle(range(1, 60)).slice(0, rng.int(10, 14)).sort((x, y) => x - y);
    const zones = { a: [], ab: [], b: [], o: [] };
    for (const n of nombres) zones[n % pA === 0 && n % pB === 0 ? 'ab' : n % pA === 0 ? 'a' : n % pB === 0 ? 'b' : 'o'].push(n);
    if (zones.a.length > 7 || zones.b.length > 7 || zones.ab.length > 4 || zones.o.length > 6 || zones.ab.length === 0) return null;
    const qs = [
      [`Combien de nombres sont à la fois des ${lA} et des ${lB} ?`, zones.ab.length, `On compte les nombres de l'intersection : ${enumerer(zones.ab.map(String))}.`],
      [`Combien de nombres sont des ${lA} mais pas des ${lB} ?`, zones.a.length, zones.a.length ? `On compte la partie « ${lA} » sans l'intersection : ${enumerer(zones.a.map(String))}.` : 'Cette zone est vide : 0.'],
      [`Combien de nombres sont des ${lB} (en tout) ?`, zones.b.length + zones.ab.length, `Tout le cercle « ${lB} », intersection comprise : ${zones.b.length} + ${zones.ab.length} = ${zones.b.length + zones.ab.length}.`],
      [`Combien de nombres ne sont ni des ${lA}, ni des ${lB} ?`, zones.o.length, `On compte les nombres en dehors des deux cercles : ${zones.o.length ? enumerer(zones.o.map(String)) : 'aucun'}.`],
    ];
    const [e, rep, x] = rng.pick(qs);
    return {
      type: 'numerique', difficulte: 2, enonce: e,
      cle: JSON.stringify(zones), figure: figureVennNombres(majuscule(lA), majuscule(lB), zones), reponse: rep, explication: x,
    };
  }),
  // Arbre de choix (dénombrement).
  forme((rng) => {
    const MENUS = [
      { titres: ['entrée', 'plat', 'dessert'], opts: [['soupe', 'salade', 'melon'], ['pâtes', 'poulet', 'poisson', 'omelette'], ['glace', 'fruit', 'yaourt']], quoi: 'menus', f: '', phrase: 'Au restaurant scolaire, on choisit une entrée, un plat et un dessert.' },
      { titres: ['haut', 'bas', 'chaussures'], opts: [['t-shirt', 'pull', 'chemise'], ['jean', 'short', 'jupe'], ['baskets', 'sandales', 'bottes']], quoi: 'tenues', f: 'e', phrase: 'Pour s\'habiller, Léa choisit un haut, un bas et une paire de chaussures.' },
      { titres: ['contenant', 'parfum', 'sauce'], opts: [['cornet', 'pot'], ['vanille', 'fraise', 'chocolat', 'citron'], ['caramel', 'sans sauce', 'coulis']], quoi: 'glaces', f: 'e', phrase: 'Chez le glacier, on choisit un cornet ou un pot, un parfum et une sauce.' },
      { titres: ['pain', 'garniture'], opts: [['blanc', 'gris', 'complet', 'baguette'], ['fromage', 'jambon', 'thon', 'poulet', 'œuf']], quoi: 'sandwichs', f: '', phrase: 'À la sandwicherie, on choisit un pain et une garniture.' },
    ];
    const M = rng.pick(MENUS);
    const niveaux = M.opts.map((o) => rng.shuffle(o).slice(0, rng.int(2, Math.min(o.length, 4))));
    const total = niveaux.reduce((p, l) => p * l.length, 1);
    if (total > 14 || total < 4) return null;
    const avecFigure = rng.next() < 0.7;
    const produit = niveaux.map((l) => l.length).join(' × ');
    const k = rng.int(0, niveaux.length - 1); const choixFixe = rng.pick(niveaux[k]);
    const qs = [
      [`Combien de ${M.quoi} différent${M.f}s peut-on composer ?`, total, `On multiplie le nombre de possibilités à chaque étape : ${produit} = ${total}.${avecFigure ? ' C\'est aussi le nombre de branches au bout de l\'arbre.' : ''}`],
      [`Combien de ${M.quoi} différent${M.f}s peut-on composer avec le choix « ${choixFixe} » ?`, total / niveaux[k].length, (() => { const reste = niveaux.filter((_, i) => i !== k).map((l) => l.length); return `On fixe « ${choixFixe} » : il reste ${reste.length > 1 ? `${reste.join(' × ')} = ` : ''}${total / niveaux[k].length} possibilités pour les autres choix.${avecFigure ? ' Dans l\'arbre, on compte les branches qui passent par ce choix.' : ''}`; })()],
    ];
    const [q, rep, x] = rng.pick(qs);
    const listes = niveaux.map((l, i) => `${M.titres[i]} : ${l.join(', ')}`).join(' ; ');
    return {
      type: 'numerique', difficulte: 2,
      enonce: avecFigure ? `${M.phrase} L'arbre montre tous les choix possibles.\n${q}` : `${M.phrase} Choix possibles : ${listes}.\n${q}`,
      cle: JSON.stringify(niveaux), figure: avecFigure ? figureArbre(niveaux, M.titres) : undefined, reponse: rep, explication: x,
    };
  }, 2),
  // Tableau à double entrée.
  forme((rng) => {
    const T = rng.pick(CONTEXTES_TABLEAU);
    const vals = T.lignes.map(() => T.colonnes.map(() => rng.int(0, 15)));
    const i = rng.int(0, T.lignes.length - 1); const j = rng.int(0, T.colonnes.length - 1);
    const col = vals.map((l) => l[j]); const totC = col.reduce((a, b) => a + b, 0); const totL = vals[i].reduce((a, b) => a + b, 0);
    const fig = figureTableau(T.lignes, T.colonnes, vals, T.coin);
    const cle = JSON.stringify(vals);
    const sorte = rng.pick(['case', 'colonne', 'ligne', 'max']);
    if (sorte === 'max') {
      const m = Math.max(...col); if (col.filter((x) => x === m).length > 1) return null;
      const bonne = majuscule(T.nomL(T.lignes[col.indexOf(m)]));
      return { ...qcm(rng, bonne, T.lignes.filter((_, k) => k !== col.indexOf(m)).map((l) => majuscule(T.nomL(l)))), difficulte: 2, enonce: T.max(T.colonnes[j]), cle, figure: fig, explication: `On compare les nombres de la colonne « ${T.colonnes[j]} » : ${col.join(', ')}. Le plus grand est ${m} (${T.nomL(T.lignes[col.indexOf(m)])}).` };
    }
    if (sorte === 'case') return { type: 'numerique', difficulte: 1, enonce: T.phrase(T.lignes[i], T.colonnes[j]), cle, figure: fig, reponse: vals[i][j], explication: `On cherche la case au croisement de la ligne « ${T.lignes[i]} » et de la colonne « ${T.colonnes[j]} » : ${vals[i][j]}.` };
    if (sorte === 'colonne') return { type: 'numerique', difficulte: 2, enonce: T.total(T.colonnes[j]), cle, figure: fig, reponse: totC, explication: `On additionne toute la colonne « ${T.colonnes[j]} » : ${col.join(' + ')} = ${totC}.` };
    return { type: 'numerique', difficulte: 2, enonce: T.totalL(T.lignes[i]), cle, figure: fig, reponse: totL, explication: `On additionne toute la ligne « ${T.lignes[i]} » : ${vals[i].join(' + ')} = ${totL}.` };
  }, 2),
  // Diagramme à bandes.
  forme((rng) => {
    const B = rng.pick(CONTEXTES_BANDES);
    const n = rng.int(4, 6);
    const cats = B.cats.slice(0, n);
    const [pas, graduation] = rng.pick([[1, 2], [2, 4], [5, 10], [10, 20], [2, 2], [5, 5]].filter(([p]) => p >= (B.pasMin ?? 1)));
    const vals = cats.map(() => rng.int(1, 12) * pas);
    const horizontal = rng.next() < 0.35;
    const fig = figureBandes(cats, vals, pas, graduation, B.titre, horizontal);
    const cle = `${JSON.stringify(vals)}|${horizontal}|${graduation}`;
    const i = rng.int(0, n - 1); let j = rng.int(0, n - 1); if (j === i) j = (i + 1) % n;
    const sorte = rng.pick(['lire', 'lire', 'ecart', 'total', 'max']);
    if (sorte === 'max') {
      const m = Math.max(...vals); if (vals.filter((x) => x === m).length > 1) return null;
      const bonne = majuscule(cats[vals.indexOf(m)]);
      return { ...qcm(rng, bonne, cats.filter((c) => c !== cats[vals.indexOf(m)]).map(majuscule)), difficulte: 1, enonce: 'Quelle est la bande la plus longue (la plus grande valeur) dans ce diagramme ?', cle, figure: fig, explication: `La bande la plus longue est « ${cats[vals.indexOf(m)]} » : ${fmt(m)} ${B.unite}.` };
    }
    if (sorte === 'lire') return { type: 'numerique', difficulte: graduation > pas ? 2 : 1, enonce: B.q(cats[i]), cle, figure: fig, reponse: vals[i], explication: `On suit le bout de la bande « ${cats[i]} » jusqu'à l'axe gradué : ${fmt(vals[i])}.${graduation > pas ? ` Attention : chaque ligne de la grille vaut ${fmt(pas)}.` : ''}` };
    if (sorte === 'ecart') {
      if (vals[i] === vals[j]) return null;
      const [g, p] = vals[i] > vals[j] ? [i, j] : [j, i];
      return { type: 'numerique', difficulte: 2, enonce: B.ecart(cats[g], cats[p]), cle, figure: fig, reponse: vals[g] - vals[p], explication: `${cats[g]} : ${fmt(vals[g])} ; ${cats[p]} : ${fmt(vals[p])}. Écart : ${fmt(vals[g])} − ${fmt(vals[p])} = ${fmt(vals[g] - vals[p])}.` };
    }
    const tot = vals.reduce((a, b) => a + b, 0);
    return { type: 'numerique', difficulte: 2, enonce: `Combien ${B.unite === 'élèves' ? "d'élèves" : `de ${B.unite}`} en tout d'après ce diagramme ?`, cle, figure: fig, reponse: tot, explication: `On additionne toutes les bandes : ${vals.map(fmt).join(' + ')} = ${fmt(tot)}.` };
  }, 2),
]);

// ===========================================================================
// 5. Propriétés des figures (quadrilatères, hauteurs, polygones réguliers)
// ===========================================================================
// Propriétés toujours vraies (null = non utilisée pour cette figure, pour éviter toute ambiguïté).
const PROPS = {
  diag_milieu: 'les diagonales se coupent en leur milieu',
  diag_egales: 'les diagonales ont la même longueur',
  diag_perp: 'les diagonales sont perpendiculaires',
  diag_axes: 'les diagonales sont des axes de symétrie',
  med_axes: 'les médianes sont des axes de symétrie',
  med_perp: 'les médianes sont perpendiculaires',
  med_egales: 'les médianes ont la même longueur',
  cotes_egaux: 'les 4 côtés ont la même longueur',
  opp_egaux: 'les côtés opposés ont la même longueur',
  deux_paires: 'les côtés opposés sont parallèles deux à deux',
  angles_droits: 'les 4 angles sont droits',
};
const QUADS = {
  carré: { tout: 'tout carré', v: { diag_milieu: 1, diag_egales: 1, diag_perp: 1, diag_axes: 1, med_axes: 1, med_perp: 1, med_egales: 1, cotes_egaux: 1, opp_egaux: 1, deux_paires: 1, angles_droits: 1 } },
  rectangle: { tout: 'tout rectangle', v: { diag_milieu: 1, diag_egales: 1, diag_perp: 0, diag_axes: 0, med_axes: 1, med_perp: 1, med_egales: 0, cotes_egaux: 0, opp_egaux: 1, deux_paires: 1, angles_droits: 1 } },
  losange: { tout: 'tout losange', v: { diag_milieu: 1, diag_egales: 0, diag_perp: 1, diag_axes: 1, med_axes: 0, med_perp: 0, med_egales: 1, cotes_egaux: 1, opp_egaux: 1, deux_paires: 1, angles_droits: 0 } },
  parallélogramme: { tout: 'tout parallélogramme', v: { diag_milieu: 1, diag_egales: 0, diag_perp: 0, diag_axes: 0, med_axes: 0, med_perp: 0, med_egales: 0, cotes_egaux: 0, opp_egaux: 1, deux_paires: 1, angles_droits: 0 } },
  'trapèze isocèle': { tout: 'tout trapèze isocèle', v: { diag_milieu: 0, diag_egales: 1, diag_perp: 0, diag_axes: 0, cotes_egaux: 0, opp_egaux: 0, deux_paires: 0, angles_droits: 0 } },
};
const RESUME_QUADS = {
  carré: 'Le carré a toutes ces propriétés : 4 côtés égaux, 4 angles droits, diagonales de même longueur, perpendiculaires, qui se coupent en leur milieu ; diagonales et médianes sont ses 4 axes de symétrie.',
  rectangle: 'Rectangle : 4 angles droits, côtés opposés parallèles et égaux ; diagonales de même longueur qui se coupent en leur milieu (mais pas perpendiculaires) ; ses 2 médianes sont perpendiculaires et ce sont ses 2 axes de symétrie, mais elles n\'ont pas la même longueur.',
  losange: 'Losange : 4 côtés égaux, côtés opposés parallèles ; diagonales perpendiculaires qui se coupent en leur milieu, ce sont ses 2 axes de symétrie. Ses médianes ont la même longueur, mais elles ne sont ni perpendiculaires, ni des axes de symétrie.',
  parallélogramme: 'Parallélogramme : côtés opposés parallèles et de même longueur ; ses diagonales se coupent en leur milieu, mais n\'ont pas la même longueur et ne sont pas perpendiculaires ; ses médianes ne sont ni perpendiculaires, ni de même longueur ; il n\'a pas d\'axe de symétrie.',
  'trapèze isocèle': 'Trapèze isocèle : ses deux bases sont parallèles et ses diagonales ont la même longueur (mais elles ne se coupent pas en leur milieu) ; il a 1 axe de symétrie, qui passe par les milieux des deux bases.',
};
const POLYREG = [[5, 'pentagone'], [6, 'hexagone'], [8, 'octogone'], [10, 'décagone']];
const AXES_FIG = [['un carré', 4], ['un rectangle (qui n\'est pas un carré)', 2], ['un losange (qui n\'est pas un carré)', 2], ['un parallélogramme (qui n\'est ni un rectangle, ni un losange)', 0], ['un trapèze isocèle (qui n\'est pas un rectangle)', 1], ['un triangle équilatéral', 3], ['un triangle isocèle (qui n\'est pas équilatéral)', 1], ['un pentagone régulier', 5], ['un hexagone régulier', 6], ['un octogone régulier', 8], ['un décagone régulier', 10]];
const VF_POLYGONES = [
  [true, 'Un polygone régulier a tous ses côtés de même longueur et tous ses angles de même amplitude.', 'C\'est la définition d\'un polygone régulier.'],
  [true, 'Le carré est un polygone régulier.', 'Ses 4 côtés sont égaux et ses 4 angles aussi (droits) : c\'est le quadrilatère régulier.'],
  [false, 'Le rectangle est un polygone régulier.', 'Ses angles sont égaux, mais pas ses côtés (sauf si c\'est un carré).'],
  [false, 'Le losange est un polygone régulier.', 'Ses côtés sont égaux, mais pas ses angles (sauf si c\'est un carré).'],
  [true, 'Le triangle équilatéral est un polygone régulier.', 'Ses 3 côtés sont égaux et ses 3 angles mesurent 60°.'],
  [true, 'Un hexagone régulier peut être partagé en 6 triangles équilatéraux.', 'En reliant le centre aux 6 sommets, on obtient 6 triangles équilatéraux identiques.'],
  [true, 'Dans un hexagone régulier tracé dans un cercle, chaque côté a la même longueur que le rayon du cercle.', 'C\'est pour cela qu\'on peut le tracer en reportant 6 fois le rayon au compas sur le cercle.'],
  [false, 'Un polygone qui a tous ses côtés de même longueur est toujours régulier.', 'Il faut aussi que tous ses angles soient égaux : le losange a 4 côtés égaux mais n\'est pas régulier.'],
  [false, 'Le triangle isocèle est un polygone régulier.', 'Un triangle isocèle a seulement 2 côtés égaux (en général) : seul le triangle équilatéral est régulier.'],
];

function figurePolygoneRegulier(n, rot, fill) {
  const W = 300; const H = 260; const R = 105; const cx = W / 2; const cy = H / 2;
  const P = range(0, n - 1).map((k) => { const a = rot + (2 * Math.PI * k) / n - Math.PI / 2; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
  return svg(W, H, polySvg(P, { fill, sw: 2.2 }));
}
// Parallélogramme ou trapèze sur quadrillage avec un segment en pointillés à identifier.
function figureSegment(rng) {
  const u = 22; const nx = 16; const ny = 9; const x0 = 14; const y0 = 14;
  const sorte = rng.pick(['para', 'trap']);
  const h = rng.int(4, 7);
  let A; let B; let C; let D;
  if (sorte === 'para') {
    const o = rng.int(1, 4); const b = rng.int(Math.max(o + 3, 6), 13 - o);
    if (o * o + h * h === b * b) return null; // ce serait un losange (diagonales = axes)
    A = [0, h]; B = [b, h]; C = [b + o, 0]; D = [o, 0];
  } else {
    const o = rng.int(1, 4); const b = rng.int(3, 7); const o2 = rng.int(1, 5); if (o2 === o) return null;
    A = [0, h]; B = [o + b + o2, h]; C = [o + b, 0]; D = [o, 0];
  }
  const larg = Math.max(B[0], C[0]); const dx = rng.int(1, nx - 1 - larg); const dy = rng.int(1, ny - 1 - h);
  const T = ([x, y]) => [x0 + (x + dx) * u, y0 + (y + dy) * u];
  const mil = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const type = rng.pick(['diagonale', 'mediane', 'hauteur']);
  let a; let b; let marque = '';
  if (type === 'diagonale') [a, b] = rng.next() < 0.5 ? [A, C] : [B, D];
  else if (type === 'mediane') [a, b] = sorte === 'para' ? (rng.next() < 0.5 ? [mil(A, B), mil(D, C)] : [mil(A, D), mil(B, C)]) : [mil(A, D), mil(B, C)];
  else {
    const xMin = Math.max(A[0], D[0]); const xMax = Math.min(B[0], C[0]);
    const cands = range(xMin, xMax).filter((x) => x !== (A[0] + B[0]) / 2 && x !== (D[0] + C[0]) / 2 && x !== A[0] && x !== B[0]);
    if (!cands.length) return null;
    const x = rng.pick(cands); a = [x, 0]; b = [x, h];
    marque = angleDroitSvg(T(b), [1, 0], [0, -1], 8);
  }
  const s = quadrillage(x0, y0, nx, ny, u) + polySvg([A, B, C, D].map(T), { fill: COUL.bleu, sw: 2.2 }) + ligneSvg(T(a), T(b), { stroke: COUL.roseF, sw: 2.6, dash: '7 5' }) + marque;
  return { type, sorte, figure: svg(x0 * 2 + nx * u, y0 * 2 + ny * u, s), cle: `${sorte}|${[A, B, C, D, a, b, dx, dy].map(String).join('/')}` };
}
function figureHauteurTriangle(rng) {
  const u = 22; const nx = 15; const ny = 9; const x0 = 14; const y0 = 14;
  const b = rng.int(5, 9); const h = rng.int(3, 7);
  const obtus = rng.next() < 0.3;
  const ax = obtus ? rng.pick([-2, -1, b + 1, b + 2]) : rng.int(1, b - 1);
  const minX = Math.min(0, ax); const maxX = Math.max(b, ax);
  const dx = rng.int(1, nx - 1 - (maxX - minX)) - minX; const dy = rng.int(1, ny - 1 - h);
  const T = ([x, y]) => [x0 + (x + dx) * u, y0 + (y + dy) * u];
  const A = [0, h]; const B = [b, h]; const S = [ax, 0];
  const vraie = rng.next() < 0.5;
  let pied;
  if (vraie) pied = [ax, h];
  else {
    const cands = range(1, b - 1).filter((x) => Math.abs(x - ax) >= 2);
    if (!cands.length) return null;
    pied = [rng.pick(cands), h];
  }
  let s = quadrillage(x0, y0, nx, ny, u);
  if (obtus && vraie) s += ligneSvg(T(ax < 0 ? A : B), T([ax, h]), { stroke: COUL.doux, sw: 1.5, dash: '3 4' });
  s += polySvg([A, B, S].map(T), { fill: COUL.orange, sw: 2.2 }) + ligneSvg(T(S), T(pied), { stroke: COUL.roseF, sw: 2.6, dash: '7 5' });
  return { vraie, obtus, figure: svg(x0 * 2 + nx * u, y0 * 2 + ny * u, s), cle: `${b},${h},${ax},${pied[0]},${dx},${dy}` };
}

const proprietesFigures = famille([
  // Vrai ou faux sur les diagonales / médianes / côtés.
  forme((rng) => {
    const nom = rng.pick(Object.keys(QUADS)); const Q = QUADS[nom];
    const p = rng.pick(Object.keys(Q.v));
    const vrai = Q.v[p] === 1;
    return {
      type: 'vrai_faux', reponse: vrai, difficulte: 2, fiche: 'ma-diagonales-medianes',
      enonce: `Vrai ou faux ? Dans ${Q.tout}, ${PROPS[p]}.`,
      explication: `${vrai ? 'Vrai' : 'Faux'}. ${RESUME_QUADS[nom]}`,
    };
  }, 3),
  // Quel quadrilatère a toujours … ?
  forme((rng) => {
    const noms = rng.shuffle(Object.keys(QUADS)).slice(0, 4);
    const communs = Object.keys(PROPS).filter((p) => noms.every((n) => QUADS[n].v[p] !== undefined));
    const props = rng.shuffle(communs).slice(0, rng.int(1, 2));
    const ok = noms.filter((n) => props.every((p) => QUADS[n].v[p] === 1));
    if (ok.length !== 1) return null;
    const bonne = majuscule(`le ${ok[0]}`);
    const q = qcm(rng, bonne, noms.filter((n) => n !== ok[0]).map((n) => majuscule(`le ${n}`)));
    return {
      ...q, difficulte: 3, fiche: 'ma-diagonales-medianes',
      enonce: `Parmi ces quadrilatères, lequel a toujours ${props.length === 1 ? 'cette propriété' : 'ces deux propriétés'} : ${props.map((p) => PROPS[p]).join(' ; ')} ?`,
      explication: `${RESUME_QUADS[ok[0]]} Les autres figures proposées n'ont pas toujours ${props.length === 1 ? 'cette propriété' : 'ces deux propriétés'}.`,
    };
  }, 2),
  // Nombre d'axes de symétrie, de paires de côtés parallèles, d'angles droits.
  forme((rng) => {
    const cas = rng.pick([
      () => { const [f, n] = rng.pick(AXES_FIG); return { e: `Combien d'axes de symétrie a ${f} ?`, r: n, x: n ? `${majuscule(f)} a ${n} axe${n > 1 ? 's' : ''} de symétrie.${f.includes('régulier') ? ' Un polygone régulier a autant d\'axes que de côtés.' : ''}` : `${majuscule(f)} n'a aucun axe de symétrie : en le pliant, les deux moitiés ne se superposent jamais.`, fiche: 'ma-symetrie' }; },
      () => { const [f, n] = rng.pick([['un parallélogramme', 2], ['un losange', 2], ['un rectangle', 2], ['un carré', 2], ['un trapèze (qui n\'est pas un parallélogramme)', 1]]); return { e: `Combien de paires de côtés parallèles a ${f} ?`, r: n, x: `${majuscule(f)} a ${n} paire${n > 1 ? 's' : ''} de côtés parallèles.${n === 1 ? ' Seules ses deux bases sont parallèles.' : ''}`, fiche: 'ma-quadrilateres' }; },
      () => { const [f, n] = rng.pick([['un rectangle', 4], ['un carré', 4], ['un trapèze rectangle (qui n\'est pas un rectangle)', 2], ['un losange (qui n\'est pas un carré)', 0], ['un parallélogramme (qui n\'est pas un rectangle)', 0]]); return { e: `Combien d'angles droits a ${f} ?`, r: n, x: `${majuscule(f)} ${n ? `a ${n} angle${n > 1 ? 's' : ''} droit${n > 1 ? 's' : ''}` : "n'a aucun angle droit"}.${n === 2 ? ' Son côté perpendiculaire aux deux bases forme 2 angles droits.' : ''}`, fiche: 'ma-quadrilateres' }; },
      () => { const [n, nom] = rng.pick(POLYREG); const quoi = rng.pick(['côtés', 'sommets']); return { e: `Combien de ${quoi} a un ${nom} ?`, r: n, x: `Un ${nom} a ${n} côtés et ${n} sommets (penta = 5, hexa = 6, octo = 8, déca = 10).`, fiche: 'ma-polygones' }; },
    ])();
    return { type: 'numerique', difficulte: 2, enonce: cas.e, reponse: cas.r, explication: cas.x, fiche: cas.fiche };
  }, 2),
  // Nom d'un polygone régulier dessiné.
  forme((rng) => {
    const [n, nom] = rng.pick(POLYREG);
    const rot = rng.int(0, 5) * Math.PI / (3 * n);
    const fill = rng.pick(FONDS);
    const q = rng.next() < 0.75
      ? { ...qcm(rng, majuscule(`un ${nom} régulier`), POLYREG.filter(([k]) => k !== n).map(([, x]) => majuscule(`un ${x} régulier`))), enonce: 'Comment s\'appelle ce polygone régulier ?', explication: `On compte les côtés : ${n}. Un polygone à ${n} côtés est un ${nom}.` }
      : { type: 'numerique', reponse: n, enonce: 'Combien d\'axes de symétrie a ce polygone régulier ?', explication: `Il a ${n} côtés (c'est un ${nom}). Un polygone régulier a autant d'axes de symétrie que de côtés : ${n}.` };
    return { ...q, difficulte: 2, fiche: 'ma-polygones', cle: `${n}|${r(rot, 3)}|${fill}`, figure: figurePolygoneRegulier(n, rot, fill) };
  }, 2),
  // Vrai ou faux sur les polygones réguliers.
  forme((rng) => {
    if (rng.next() < 0.5) {
      const [v, e, x] = rng.pick(VF_POLYGONES);
      return { type: 'vrai_faux', reponse: v, difficulte: 2, fiche: 'ma-polygones', enonce: `Vrai ou faux ? ${e}`, explication: `${v ? 'Vrai' : 'Faux'}. ${x}` };
    }
    const [n, nom] = rng.pick(POLYREG);
    const quoi = rng.pick(['côtés', 'axes']);
    const vrai = rng.next() < 0.5;
    const k = vrai ? n : rng.pick(POLYREG.map(([m]) => m).filter((m) => m !== n));
    const e = quoi === 'côtés' ? `Un ${nom} a ${k} côtés.` : `Un ${nom} régulier a ${k} axes de symétrie.`;
    return { type: 'vrai_faux', reponse: vrai, difficulte: 2, fiche: 'ma-polygones', enonce: `Vrai ou faux ? ${e}`, explication: `${vrai ? 'Vrai' : 'Faux'}. Un ${nom} a ${n} côtés${quoi === 'axes' ? ` ; régulier, il a ${n} axes de symétrie` : ''}.` };
  }),
  // Diagonale, médiane ou hauteur ?
  forme((rng) => {
    const f = figureSegment(rng); if (!f) return null;
    const noms = { diagonale: 'une diagonale', mediane: 'une médiane', hauteur: 'une hauteur' };
    const q = qcm(rng, majuscule(noms[f.type]), ['Une diagonale', 'Une médiane', 'Une hauteur', 'Un axe de symétrie'], 4, 3);
    const fig = f.sorte === 'para' ? 'parallélogramme' : 'trapèze';
    const expl = {
      diagonale: 'Une diagonale relie deux sommets opposés.',
      mediane: 'Une médiane relie les milieux de deux côtés opposés.',
      hauteur: `Une hauteur est perpendiculaire aux côtés parallèles (les bases) : elle forme un angle droit avec eux.`,
    }[f.type];
    return { ...q, difficulte: 2, fiche: 'ma-diagonales-medianes', enonce: `Le segment en pointillés tracé dans ce ${fig} est…`, cle: f.cle, figure: f.figure, explication: `${expl} Ici, ce n'est pas un axe de symétrie : ce ${fig} n'a pas d'axe de symétrie.` };
  }, 2),
  // Hauteur d'un triangle.
  forme((rng) => {
    const f = figureHauteurTriangle(rng); if (!f) return null;
    return {
      type: 'vrai_faux', reponse: f.vraie, difficulte: 2, fiche: 'ma-triangles',
      enonce: 'Vrai ou faux ? Le segment en pointillés est une hauteur du triangle.',
      cle: f.cle, figure: f.figure,
      explication: f.vraie
        ? `Vrai : il part d'un sommet et arrive perpendiculairement (angle droit) sur la droite qui porte le côté opposé.${f.obtus ? ' Ici, il faut prolonger la base : la hauteur tombe en dehors du triangle.' : ''}`
        : 'Faux : le segment part bien d\'un sommet, mais il n\'est pas perpendiculaire au côté opposé (regarde le quadrillage : il penche).',
    };
  }, 2),
]);

// ===========================================================================
// 6. Mouvements : glisser, retourner, pivoter, agrandir, réduire
// ===========================================================================
const FORMES_MVT = {
  P: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]],
  F: [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]],
  L: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]],
  l: [[0, 0], [0, 1], [0, 2], [1, 2]],
  N: [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3]],
  Y: [[0, 1], [1, 0], [1, 1], [1, 2], [1, 3]],
  drapeau: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [0, 2], [0, 3]],
};
const tailleCases = (cells) => [Math.max(...cells.map((c) => c[0])) + 1, Math.max(...cells.map((c) => c[1])) + 1];
const agrandir = (cells) => cells.flatMap(([x, y]) => [[2 * x, 2 * y], [2 * x + 1, 2 * y], [2 * x, 2 * y + 1], [2 * x + 1, 2 * y + 1]]);
// Contour d'un assemblage de cases (arêtes non partagées).
function contourCases(cells, X, Y, u) {
  const set = new Set(cells.map((c) => `${c[0]},${c[1]}`));
  let s = '';
  for (const [x, y] of cells) {
    const px = X + x * u; const py = Y + y * u;
    if (!set.has(`${x},${y - 1}`)) s += `M${n1(px)} ${n1(py)}H${n1(px + u)}`;
    if (!set.has(`${x},${y + 1}`)) s += `M${n1(px)} ${n1(py + u)}H${n1(px + u)}`;
    if (!set.has(`${x - 1},${y}`)) s += `M${n1(px)} ${n1(py)}V${n1(py + u)}`;
    if (!set.has(`${x + 1},${y}`)) s += `M${n1(px + u)} ${n1(py)}V${n1(py + u)}`;
  }
  const fond = cells.map(([x, y]) => `<rect x="${n1(X + x * u)}" y="${n1(Y + y * u)}" width="${n1(u)}" height="${n1(u)}"/>`).join('');
  return { fond, trait: `<path d="${s}" stroke="${COUL.trait}" stroke-width="2.4" stroke-linecap="square" fill="none"/>` };
}
function dessinForme(cells, X, Y, u, fill, marque) {
  const { fond, trait } = contourCases(cells, X, Y, u);
  // Petit point dans la case « repère » pour aider à suivre l'orientation.
  const pt = marque ? cercleSvg(X + (marque[0] + 0.5) * u, Y + (marque[1] + 0.5) * u, u * 0.18, { fill: COUL.trait, sw: 0 }) : '';
  return `<g fill="${fill}">${fond}</g>${trait}${pt}`;
}
const chevauche = (a, b, marge = 1) => !(a.x + a.w + marge <= b.x || b.x + b.w + marge <= a.x || a.y + a.h + marge <= b.y || b.y + b.h + marge <= a.y);
const MOTS_MVT = { glissement: 'un glissement', retournement: 'un retournement', pivotement: 'un pivotement', agrandissement: 'un agrandissement', reduction: 'une réduction' };
const EXPL_MVT = {
  glissement: 'B a la même forme, la même taille et la même orientation que A : on a fait glisser A (glissement).',
  retournement: 'B est l\'image de A dans un miroir : on a retourné A (retournement). La taille est la même, mais la figure est « à l\'envers ».',
  pivotement: 'B a la même taille que A, mais elle a tourné : on a fait pivoter A (pivotement). Ce n\'est pas un retournement : B n\'est pas « en miroir ».',
  agrandissement: 'B a la même forme que A, mais toutes ses longueurs sont doublées : c\'est un agrandissement.',
  reduction: 'B a la même forme que A, mais toutes ses longueurs sont divisées par 2 : c\'est une réduction.',
};

const mouvements = famille([
  // A et B : quel mouvement ?
  forme((rng) => {
    const nomF = rng.pick(Object.keys(FORMES_MVT));
    const base = orienter(FORMES_MVT[nomF], rng.int(0, 7));
    const mvt = rng.pick(['glissement', 'retournement', 'pivotement', 'pivotement', 'agrandissement', 'reduction']);
    let cA = base; let cB;
    let detail = '';
    if (mvt === 'glissement') cB = base;
    else if (mvt === 'retournement') { detail = rng.pick(['h', 'v']); cB = orienter(base, detail === 'h' ? 4 : 6); } else if (mvt === 'pivotement') { detail = rng.pick(['1', '2', '3']); cB = orienter(base, Number(detail)); } else if (mvt === 'agrandissement') { if (Math.max(...tailleCases(base)) > 4) return null; cB = agrandir(base); } else { if (Math.max(...tailleCases(base)) > 4) return null; cA = agrandir(base); cB = base; }
    const NX = 18; const NY = 10; const u = 20; const m = 14;
    const [wA, hA] = tailleCases(cA); const [wB, hB] = tailleCases(cB);
    let pA; let pB;
    for (let k = 0; k < 60 && !pB; k++) {
      const a = { x: rng.int(0, NX - wA), y: rng.int(0, NY - hA), w: wA, h: hA };
      let b;
      if (mvt === 'retournement' && detail === 'h') b = { x: rng.int(0, NX - wB), y: a.y, w: wB, h: hB };
      else if (mvt === 'retournement') b = { x: a.x, y: rng.int(0, NY - hB), w: wB, h: hB };
      else b = { x: rng.int(0, NX - wB), y: rng.int(0, NY - hB), w: wB, h: hB };
      if (b.x + wB > NX || b.y + hB > NY) continue;
      if (mvt === 'glissement' && a.x === b.x && a.y === b.y) continue;
      if (!chevauche(a, b)) { pA = a; pB = b; }
    }
    if (!pB) return null;
    const s = quadrillage(m, m, NX, NY, u)
      + dessinForme(cA, m + pA.x * u, m + pA.y * u, u, COUL.bleu) + dessinForme(cB, m + pB.x * u, m + pB.y * u, u, COUL.orange)
      + texteSvg(m + (pA.x + wA / 2) * u, m + (pA.y + hA / 2) * u, 'A', { size: 16, bold: true, fill: COUL.bleuF, halo: true })
      + texteSvg(m + (pB.x + wB / 2) * u, m + (pB.y + hB / 2) * u, 'B', { size: 16, bold: true, fill: COUL.orangeF, halo: true });
    const figure = svg(2 * m + NX * u, 2 * m + NY * u, s);
    const cle = `${nomF}|${cleCases(cA)}|${cleCases(cB)}|${pA.x},${pA.y},${pB.x},${pB.y}`;
    // Question précise sur le pivotement (quart de tour / demi-tour).
    if ((mvt === 'pivotement' || mvt === 'glissement' || mvt === 'retournement') && rng.next() < 0.35) {
      const bonneP = mvt === 'pivotement' ? (detail === '2' ? 'Un pivotement d\'un demi-tour' : 'Un pivotement d\'un quart de tour') : majuscule(MOTS_MVT[mvt]);
      const q = qcm(rng, bonneP, ['Un pivotement d\'un demi-tour', 'Un pivotement d\'un quart de tour', 'Un retournement', 'Un glissement'], 4, 3);
      return { ...q, difficulte: 3, enonce: 'La figure B est l\'image de la figure A. Quel mouvement a-t-on appliqué ?', cle: cle + '|precis', figure, explication: mvt === 'pivotement' ? `${EXPL_MVT.pivotement} Elle a tourné d'${detail === '2' ? 'un demi-tour : elle est « tête en bas »' : 'un quart de tour : ce qui était vertical est devenu horizontal'}.` : EXPL_MVT[mvt] };
    }
    const q = qcm(rng, majuscule(MOTS_MVT[mvt]), Object.values(MOTS_MVT).filter((x) => x !== MOTS_MVT[mvt]).map(majuscule), 4, 3);
    return { ...q, difficulte: 2, enonce: 'La figure B est l\'image de la figure A. Quel mouvement a-t-on appliqué ?', cle, figure, explication: EXPL_MVT[mvt] };
  }, 4),
  // A et quatre images : laquelle est obtenue par … ?
  forme((rng) => {
    const nomF = rng.pick(Object.keys(FORMES_MVT));
    const base = orienter(FORMES_MVT[nomF], rng.int(0, 7));
    const images = rng.shuffle([['glissement', base], ['retournement', orienter(base, 4)], ['quart', orienter(base, rng.pick([1, 3]))], ['demi', orienter(base, 2)]]);
    const u = 14; const m = 12; const slot = 5; const NX = 26; const NY = 6;
    const H = 2 * m + NY * u + 22;
    let s = quadrillage(m, m + 22, NX, NY, u);
    const yRow = 1;
    const tous = [['A', base], ...images.map(([k, c], i) => [String(i + 1), c, k])];
    tous.forEach(([lab, c], i) => {
      const [w, h] = tailleCases(c);
      const xc = 1 + i * slot; const yc = (lab === 'A' || images[i - 1][0] === 'glissement' || images[i - 1][0] === 'retournement') ? yRow : rng.int(0, NY - h);
      s += dessinForme(c, m + xc * u, m + 22 + yc * u, u, lab === 'A' ? COUL.bleu : COUL.orange);
      s += texteSvg(m + (xc + w / 2) * u, m + 9, lab === 'A' ? 'A' : `${lab}`, { size: 15, bold: true, fill: lab === 'A' ? COUL.bleuF : COUL.trait });
    });
    const figure = svg(2 * m + NX * u, H, s);
    const cible = rng.pick(images.map((x) => x[0]));
    const idx = images.findIndex((x) => x[0] === cible);
    const phrase = { glissement: 'un glissement', retournement: 'un retournement', quart: 'un pivotement d\'un quart de tour', demi: 'un pivotement d\'un demi-tour' }[cible];
    const choix = ['Figure 1', 'Figure 2', 'Figure 3', 'Figure 4'];
    return {
      type: 'qcm', choix, reponse: idx, difficulte: 3,
      enonce: `Quelle figure est l'image de A par ${phrase} ?`,
      cle: `${nomF}|${images.map((x) => x[0] + cleCases(x[1])).join('/')}`,
      figure,
      explication: `Figure ${idx + 1}. ${{ glissement: 'Même orientation que A : elle a seulement glissé.', retournement: 'Elle est « en miroir » par rapport à A : on a retourné A.', quart: 'Elle a tourné d\'un quart de tour : ce qui était vertical est devenu horizontal.', demi: 'Elle a tourné d\'un demi-tour : elle est « tête en bas », mais pas en miroir.' }[cible]}`,
    };
  }, 2),
  // Agrandissement / réduction : calculs.
  forme((rng) => {
    const red = rng.next() < 0.45;
    const L = red ? rng.int(2, 9) * 2 : rng.int(2, 9); const l = red ? rng.int(1, L / 2) * 2 : rng.int(1, L);
    if (L === l && rng.next() < 0.5) return null;
    const k = red ? 0.5 : 2;
    const L2 = L * k; const l2 = l * k;
    const quoi = rng.pick(['perimetre', 'aire', 'cote']);
    const fig = L === l ? 'On dessine un carré' : 'On dessine un rectangle';
    const dims = L === l ? `de ${L} carreaux de côté` : `de ${L} carreaux sur ${l}`;
    const act = red ? 'On le réduit de moitié' : 'On l\'agrandit au double';
    if (quoi === 'cote') return { type: 'numerique', unite: 'carreaux', difficulte: 1, enonce: `${fig} ${dims}. ${act}. Combien de carreaux mesure le plus grand côté de l'image ?`, reponse: Math.max(L2, l2), explication: `${red ? 'Réduire de moitié' : 'Agrandir au double'} : chaque longueur est ${red ? 'divisée' : 'multipliée'} par 2. ${Math.max(L, l)} ${red ? ':' : '×'} 2 = ${Math.max(L2, l2)} carreaux.` };
    if (quoi === 'perimetre') return { type: 'numerique', unite: 'carreaux', difficulte: 2, enonce: `${fig} ${dims}. ${act}. Quel est le périmètre de l'image (en carreaux) ?`, reponse: 2 * (L2 + l2), explication: `L'image mesure ${L2} sur ${l2}. Périmètre = (${L2} + ${l2}) × 2 = ${2 * (L2 + l2)} carreaux. Le périmètre est lui aussi ${red ? 'divisé' : 'multiplié'} par 2.` };
    return { type: 'numerique', unite: 'carreaux', difficulte: 3, enonce: `${fig} ${dims}. ${act}. Combien de carreaux couvre l'image ?`, reponse: L2 * l2, explication: `L'image mesure ${L2} sur ${l2} : ${L2} × ${l2} = ${L2 * l2} carreaux. Attention : l'aire n'est pas ${red ? 'divisée' : 'multipliée'} par 2 mais par 4 (${L * l} ${red ? ':' : '×'} 4 = ${L2 * l2}).` };
  }),
  // Vocabulaire des mouvements.
  forme((rng) => {
    const VF = [
      [true, 'Après un glissement, la figure garde la même taille et la même orientation.', 'Glisser, c\'est déplacer la figure sans la tourner ni la retourner.'],
      [true, 'Un retournement donne l\'image de la figure comme dans un miroir.', 'On retourne le calque : la figure est « à l\'envers ».'],
      [false, 'Après un pivotement, la figure change de taille.', 'Pivoter, c\'est tourner autour d\'un point : la taille ne change pas.'],
      [true, 'Un agrandissement au double multiplie toutes les longueurs par 2.', 'Chaque côté devient 2 fois plus long ; la forme reste la même.'],
      [false, 'Un agrandissement au double multiplie l\'aire par 2.', 'L\'aire est multipliée par 4 : 2 fois plus long et 2 fois plus large.'],
      [false, 'Un retournement change la taille de la figure.', 'Un retournement ne change ni les longueurs ni les angles.'],
      [true, 'Un pivotement d\'un demi-tour, c\'est deux pivotements d\'un quart de tour dans le même sens.', '1/4 de tour + 1/4 de tour = 1/2 tour.'],
      [true, 'Glisser, retourner ou pivoter une figure ne change ni ses longueurs ni ses angles.', 'Ce sont des mouvements qui conservent la forme et la taille.'],
      [false, 'Après une réduction de moitié, les angles de la figure sont deux fois plus petits.', 'Les angles ne changent pas : seules les longueurs sont divisées par 2.'],
      [true, 'Après un pivotement d\'un tour complet, la figure revient à sa position de départ.', 'Un tour complet, c\'est 4 quarts de tour : on revient au départ.'],
      [false, 'Après un glissement, la figure est « à l\'envers ».', 'C\'est le retournement qui met la figure en miroir ; le glissement garde l\'orientation.'],
    ];
    if (rng.next() < 0.6) {
      const [v, e, x] = rng.pick(VF);
      return { type: 'vrai_faux', reponse: v, difficulte: 1, enonce: `Vrai ou faux ? ${e}`, explication: `${v ? 'Vrai' : 'Faux'}. ${x}` };
    }
    const Q = [
      ['Quel mouvement change la taille de la figure ?', rng.pick(['Un agrandissement', 'Une réduction']), ['Un glissement', 'Un retournement', 'Un pivotement'], 'Seuls l\'agrandissement et la réduction changent la taille ; glisser, retourner et pivoter la conservent.'],
      ['Avec un calque, on fait tourner la figure autour d\'un point. Quel est ce mouvement ?', 'Un pivotement', ['Un glissement', 'Un retournement', 'Un agrandissement'], 'Tourner autour d\'un point, c\'est pivoter.'],
      ['On retourne le calque comme une page de livre. Quel est ce mouvement ?', 'Un retournement', ['Un glissement', 'Un pivotement', 'Une réduction'], 'Retourner le calque donne une image en miroir : c\'est un retournement.'],
      ['On déplace le calque en ligne droite, sans le tourner. Quel est ce mouvement ?', 'Un glissement', ['Un retournement', 'Un pivotement', 'Un agrandissement'], 'Déplacer sans tourner ni retourner : c\'est un glissement.'],
      ['Quel mouvement donne une image « en miroir » de la figure ?', 'Un retournement', ['Un glissement', 'Un pivotement', 'Un agrandissement'], 'Le retournement (symétrie) donne l\'image dans un miroir.'],
    ];
    const [e, b, f, x] = rng.pick(Q);
    return { ...qcm(rng, b, f, 4, 3), difficulte: 1, enonce: e, explication: x };
  }),
]);

// ===========================================================================
// 7. Périmètre constant : rectangles de même périmètre, aires différentes
// ===========================================================================
function figureDeuxRectangles(r1, r2) {
  const u = 18; const m = 12; const NX = r1[0] + r2[0] + 5; const NY = Math.max(r1[1], r2[1]) + 3;
  const s = quadrillage(m, m, NX, NY, u)
    + rectSvg(m + u, m + 2 * u, r1[0] * u, r1[1] * u, { fill: COUL.bleu, sw: 2.2 }) + texteSvg(m + u + r1[0] * u / 2, m + u, 'A', { size: 15, bold: true, fill: COUL.bleuF })
    + rectSvg(m + (r1[0] + 3) * u, m + 2 * u, r2[0] * u, r2[1] * u, { fill: COUL.orange, sw: 2.2 }) + texteSvg(m + (r1[0] + 3 + r2[0] / 2) * u, m + u, 'B', { size: 15, bold: true, fill: COUL.orangeF });
  return svg(2 * m + NX * u, 2 * m + NY * u, s);
}
const perimetreConstant = famille([
  forme((rng) => {
    const s = rng.int(6, 30); const P = 2 * s;
    const ctx = rng.pick([
      `Avec une ficelle de ${P} cm, Léa forme des rectangles dont les côtés mesurent un nombre entier de cm.`,
      `Tom dispose de ${P} m de clôture pour faire un enclos rectangulaire (côtés en mètres entiers).`,
      `Des rectangles ont tous un périmètre de ${P} cm et des côtés qui mesurent un nombre entier de cm.`,
    ]);
    const u = ctx.includes(' m de clôture') ? 'm' : 'cm';
    const sorte = rng.pick(['max', 'max', 'min', 'nombre']);
    if (sorte === 'max') {
      const L = Math.ceil(s / 2); const l = Math.floor(s / 2);
      return { type: 'numerique', unite: `${u}²`, difficulte: 3, enonce: `${ctx} Quelle est la plus grande aire possible ?`, reponse: L * l, explication: `Longueur + largeur = ${P} : 2 = ${s} ${u}. L'aire est la plus grande quand les deux côtés sont le plus proches possible : ${L} et ${l} → ${L} × ${l} = ${L * l} ${u}².${L === l ? ' C\'est un carré (un carré est un rectangle particulier).' : ''}` };
    }
    if (sorte === 'min') return { type: 'numerique', unite: `${u}²`, difficulte: 3, enonce: `${ctx} Quelle est la plus petite aire possible ?`, reponse: s - 1, explication: `Longueur + largeur = ${P} : 2 = ${s} ${u}. L'aire est la plus petite quand le rectangle est très allongé : ${s - 1} et 1 → ${s - 1} × 1 = ${s - 1} ${u}².` };
    const n = Math.floor(s / 2);
    const liste = range(1, n).map((l) => `${s - l} × ${l}`);
    return { type: 'numerique', difficulte: 3, enonce: `${ctx} Combien de rectangles différents peut-on obtenir ? (Le carré compte aussi.)`, reponse: n, explication: `Longueur + largeur = ${s}. Possibilités : ${liste.join(' ; ')}. Cela fait ${n} rectangles.` };
  }, 3),
  forme((rng) => {
    const s = rng.int(6, 12);
    const paires = range(1, Math.floor(s / 2)).map((l) => [s - l, l]).filter(([L]) => L <= 10);
    if (paires.length < 2) return null;
    const [r1, r2] = rng.shuffle(paires).slice(0, 2);
    const a1 = r1[0] * r1[1]; const a2 = r2[0] * r2[1];
    const quoi = rng.pick(['aire', 'aire', 'perimetre']);
    const figure = figureDeuxRectangles(r1, r2);
    const pTxt = `A : (${r1[0]} + ${r1[1]}) × 2 = ${2 * s} ; B : (${r2[0]} + ${r2[1]}) × 2 = ${2 * s}`;
    const aTxt = `A : ${r1[0]} × ${r1[1]} = ${a1} carreaux ; B : ${r2[0]} × ${r2[1]} = ${a2} carreaux`;
    const choixT = ['Le rectangle A', 'Le rectangle B', 'Ils sont égaux'];
    if (quoi === 'perimetre') {
      return { type: 'qcm', choix: choixT, reponse: 2, difficulte: 2, enonce: 'Quel rectangle a le plus grand périmètre ?', cle: `${r1}|${r2}`, figure, explication: `On compte les côtés en carreaux. Périmètres : ${pTxt}. Ils ont le même périmètre… mais pas la même aire (${aTxt}).` };
    }
    return { type: 'qcm', choix: choixT, reponse: a1 > a2 ? 0 : 1, difficulte: 2, enonce: 'Ces deux rectangles ont le même périmètre. Lequel a la plus grande aire ?', cle: `${r1}|${r2}`, figure, explication: `Périmètres : ${pTxt}. Aires : ${aTxt}. Même périmètre ne veut pas dire même aire : le rectangle le plus « carré » a la plus grande aire.` };
  }, 2),
  forme((rng) => {
    const L = rng.int(5, 20); const l = rng.int(2, L - 1); const k = rng.int(1, l - 1);
    const surLargeur = rng.next() < 0.5;
    const nL = surLargeur ? L - k : L + k; const nl = surLargeur ? l + k : l - k;
    const a1 = L * l; const a2 = nL * nl;
    const action = surLargeur ? `On raccourcit sa longueur de ${k} cm et on allonge sa largeur de ${k} cm` : `On allonge sa longueur de ${k} cm et on raccourcit sa largeur de ${k} cm`;
    const quoi = rng.pick(['perimetre', 'aire', 'aireNum']);
    const base = `Un rectangle mesure ${L} cm sur ${l} cm. ${action}.`;
    if (quoi === 'perimetre') {
      return { ...qcm(rng, 'Il reste le même', ['Il augmente', 'Il diminue']), difficulte: 2, enonce: `${base} Que devient son périmètre ?`, explication: `Ce qu'on ajoute d'un côté, on l'enlève de l'autre : ${nL} + ${nl} = ${L} + ${l} = ${L + l}. Le périmètre reste (${L} + ${l}) × 2 = ${2 * (L + l)} cm.` };
    }
    if (quoi === 'aireNum') return { type: 'numerique', unite: 'cm²', difficulte: 2, enonce: `${base} Quelle est l'aire du nouveau rectangle ?`, reponse: a2, explication: `Nouvelles dimensions : ${nL} cm et ${nl} cm. Aire = ${nL} × ${nl} = ${a2} cm² (avant : ${L} × ${l} = ${a1} cm²). Le périmètre, lui, n'a pas changé.` };
    const bonne = a2 > a1 ? 'Elle augmente' : a2 < a1 ? 'Elle diminue' : 'Elle reste la même';
    return { ...qcm(rng, bonne, ['Elle augmente', 'Elle diminue', 'Elle reste la même']), difficulte: 3, enonce: `${base} Que devient son aire ?`, explication: `Avant : ${L} × ${l} = ${a1} cm². Après : ${nL} × ${nl} = ${a2} cm². ${bonne}. Le périmètre, lui, ne change pas.` };
  }, 2),
  forme((rng) => {
    const L = rng.int(4, 18); const l = rng.int(1, L - 1); const s = L + l;
    if (rng.next() < 0.5) {
      const L2 = rng.int(Math.ceil(s / 2), s - 1); if (L2 === L) return null; const l2 = s - L2;
      return { type: 'numerique', unite: 'cm²', difficulte: 3, enonce: `Un rectangle mesure ${L} cm sur ${l} cm. Un autre rectangle a le même périmètre et une longueur de ${L2} cm. Quelle est son aire ?`, reponse: L2 * l2, explication: `Périmètre : (${L} + ${l}) × 2 = ${2 * s} cm, donc longueur + largeur = ${s} cm. Largeur du 2e rectangle : ${s} − ${L2} = ${l2} cm. Aire : ${L2} × ${l2} = ${L2 * l2} cm².` };
    }
    const c = rng.next() < 0.6 ? s / 2 : rng.int(2, 15);
    if (!Number.isInteger(c)) return null;
    const vrai = 4 * c === 2 * s;
    return { type: 'vrai_faux', reponse: vrai, difficulte: 2, enonce: `Vrai ou faux ? Un rectangle de ${L} cm sur ${l} cm et un carré de ${c} cm de côté ont le même périmètre.`, explication: `${vrai ? 'Vrai' : 'Faux'}. Rectangle : (${L} + ${l}) × 2 = ${2 * s} cm. Carré : 4 × ${c} = ${4 * c} cm. ${vrai ? `Même périmètre, mais aires différentes : ${L * l} cm² et ${c * c} cm².` : 'Les périmètres sont différents.'}` };
  }, 2),
  forme((rng) => {
    const VF = [
      [false, 'Deux rectangles qui ont le même périmètre ont toujours la même aire.', 'Exemple : 5 × 1 et 3 × 3 ont tous les deux un périmètre de 12 cm, mais des aires de 5 cm² et 9 cm².'],
      [true, 'Parmi les rectangles de même périmètre, c\'est le plus proche du carré qui a la plus grande aire.', 'Plus les côtés sont proches, plus l\'aire est grande ; le carré est le champion.'],
      [false, 'Si on allonge un rectangle, son aire augmente toujours.', 'Si on raccourcit la largeur en même temps, l\'aire peut diminuer.'],
      [true, 'Deux rectangles peuvent avoir la même aire et des périmètres différents.', 'Exemple : 6 × 1 et 3 × 2 ont la même aire (6 cm²) mais des périmètres de 14 cm et 10 cm.'],
    ];
    const [v, e, x] = rng.pick(VF);
    return { type: 'vrai_faux', reponse: v, difficulte: 2, enonce: `Vrai ou faux ? ${e}`, explication: `${v ? 'Vrai' : 'Faux'}. ${x}` };
  }),
]);

// ===========================================================================
// 8. Vocabulaire des opérations
// ===========================================================================
const MOTS_RESULTAT = [
  ['le résultat d\'une addition', 'la somme'], ['le résultat d\'une soustraction', 'la différence'], ['le résultat d\'une multiplication', 'le produit'],
  ['le résultat d\'une division', 'le quotient'], ['les nombres que l\'on multiplie', 'les facteurs'], ['les nombres que l\'on additionne', 'les termes'],
  ['le nombre que l\'on divise', 'le dividende'], ['le nombre par lequel on divise', 'le diviseur'], ['ce qui reste quand le partage n\'est pas exact', 'le reste'],
];
const vocabulaireOperations = famille([
  // Calculer à partir des mots.
  forme((rng) => {
    const op = rng.pick(['somme', 'difference', 'produit', 'quotient']);
    if (op === 'somme') { const a = rng.int(12, 900); const b = rng.int(12, 900); return { type: 'numerique', difficulte: 1, enonce: `Quelle est la somme de ${fmt(a)} et ${fmt(b)} ?`, reponse: a + b, explication: `La somme est le résultat d'une addition : ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.` }; }
    if (op === 'difference') { const a = rng.int(50, 999); const b = rng.int(10, a - 1); return { type: 'numerique', difficulte: 1, enonce: `Quelle est la différence entre ${fmt(a)} et ${fmt(b)} ?`, reponse: a - b, explication: `La différence est le résultat d'une soustraction : ${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}.` }; }
    if (op === 'produit') { const a = rng.int(3, 25); const b = rng.int(3, 25); return { type: 'numerique', difficulte: 1, enonce: `Quel est le produit de ${a} et ${b} ?`, reponse: a * b, explication: `Le produit est le résultat d'une multiplication : ${a} × ${b} = ${a * b}.` }; }
    const b = rng.int(2, 12); const q = rng.int(3, 40);
    return { type: 'numerique', difficulte: 1, enonce: `Quel est le quotient de ${b * q} par ${b} ?`, reponse: q, explication: `Le quotient est le résultat d'une division : ${b * q} : ${b} = ${q}.` };
  }, 2),
  // Que représente ce nombre ?
  forme((rng) => {
    const op = rng.pick(['+', '−', '×', ':', ':r']);
    let ecr; let roles;
    if (op === '+') { const a = rng.int(10, 99); const b = rng.int(10, 99); if (a === b) return null; ecr = `${a} + ${b} = ${a + b}`; roles = [[a, 'Un terme'], [b, 'Un terme'], [a + b, 'La somme']]; }
    else if (op === '−') { const a = rng.int(40, 150); const b = rng.int(10, a - 10); if (b === a - b) return null; ecr = `${a} − ${b} = ${a - b}`; roles = [[a, 'Le premier terme'], [b, 'Le deuxième terme'], [a - b, 'La différence']]; }
    else if (op === '×') { const a = rng.int(3, 15); const b = rng.int(3, 15); if (a === b) return null; ecr = `${a} × ${b} = ${a * b}`; roles = [[a, 'Un facteur'], [b, 'Un facteur'], [a * b, 'Le produit']]; }
    else if (op === ':') { const b = rng.int(3, 12); const q = rng.int(3, 25); if (b === q) return null; ecr = `${b * q} : ${b} = ${q}`; roles = [[b * q, 'Le dividende'], [b, 'Le diviseur'], [q, 'Le quotient']]; }
    else { const b = rng.int(3, 9); const q = rng.int(4, 20); const re = rng.int(1, b - 1); if (new Set([b, q, re]).size < 3) return null; ecr = `${b * q + re} : ${b} = ${q} reste ${re}`; roles = [[b * q + re, 'Le dividende'], [b, 'Le diviseur'], [q, 'Le quotient'], [re, 'Le reste']]; }
    const [n, bonne] = rng.pick(roles.filter(([, rr], i, arr) => arr.findIndex((x) => x[1] === rr) === i || rr !== 'Un terme'));
    const pool = { '+': ['Un terme', 'La somme', 'Un facteur', 'Le produit', 'La différence'], '−': ['Le premier terme', 'Le deuxième terme', 'La différence', 'La somme', 'Le produit'], '×': ['Un facteur', 'Le produit', 'Un terme', 'Le quotient', 'La somme'], ':': ['Le dividende', 'Le diviseur', 'Le quotient', 'Le reste', 'Le produit'], ':r': ['Le dividende', 'Le diviseur', 'Le quotient', 'Le reste'] }[op];
    const q = qcm(rng, bonne, pool.filter((x) => x !== bonne), 4, 3);
    const nomOp = { '+': 'addition', '−': 'soustraction', '×': 'multiplication', ':': 'division', ':r': 'division' }[op];
    return { ...q, difficulte: 2, enonce: `Dans l'opération ${ecr}, que représente le nombre ${n} ?`, explication: `Dans une ${nomOp} : ${roles.map(([v, rr]) => `${v} = ${rr.toLowerCase()}`).join(' ; ')}.` };
  }, 2),
  // Problèmes inverses.
  forme((rng) => {
    const cas = rng.pick([
      () => { const a = rng.int(20, 500); const b = rng.int(20, 500); return { e: `La somme de deux nombres est ${fmt(a + b)}. L'un des termes est ${fmt(a)}. Quel est l'autre terme ?`, r: b, x: `Terme manquant = somme − terme connu : ${fmt(a + b)} − ${fmt(a)} = ${fmt(b)}.` }; },
      () => { const a = rng.int(3, 15); const b = rng.int(3, 15); return { e: `Le produit de deux facteurs est ${a * b}. L'un des facteurs est ${a}. Quel est l'autre facteur ?`, r: b, x: `Facteur manquant = produit : facteur connu : ${a * b} : ${a} = ${b}.` }; },
      () => { const b = rng.int(3, 12); const q = rng.int(5, 30); const re = rng.int(0, b - 1); return { e: `Dans une division, le diviseur est ${b}, le quotient ${q} et le reste ${re}. Quel est le dividende ?`, r: b * q + re, x: `Dividende = quotient × diviseur + reste : ${q} × ${b} + ${re} = ${b * q + re}.` }; },
      () => { const a = rng.int(30, 300); const d = rng.int(5, a - 5); return { e: `La différence entre deux nombres est ${d}. Le plus grand des deux est ${a}. Quel est le plus petit ?`, r: a - d, x: `Plus petit = plus grand − différence : ${a} − ${d} = ${a - d}.` }; },
      () => { const b = rng.int(3, 12); const q = rng.int(4, 40); return { e: `Le quotient d'une division exacte est ${q} et le diviseur est ${b}. Quel est le dividende ?`, r: b * q, x: `Dividende = quotient × diviseur : ${q} × ${b} = ${b * q}.` }; },
      () => { const b = rng.int(3, 9); const q = rng.int(5, 30); const re = rng.int(1, b - 1); return { e: `Quel est le reste de la division de ${b * q + re} par ${b} ?`, r: re, x: `${q} × ${b} = ${q * b} et ${b * q + re} − ${q * b} = ${re}. Le reste (${re}) est bien plus petit que le diviseur (${b}).` }; },
    ])();
    return { type: 'numerique', difficulte: 2, enonce: cas.e, reponse: cas.r, explication: cas.x };
  }, 2),
  // Phrases avec plusieurs opérations.
  forme((rng) => {
    const a = rng.int(2, 15); const b = rng.int(2, 15); const c = rng.int(2, 12);
    const cas = rng.pick([
      () => ({ e: `le produit de la somme de ${a} et ${b} par ${c}`, r: (a + b) * c, x: `(${a} + ${b}) × ${c} = ${a + b} × ${c} = ${(a + b) * c}` }),
      () => ({ e: `la somme du produit de ${a} par ${b} et de ${c}`, r: a * b + c, x: `(${a} × ${b}) + ${c} = ${a * b} + ${c} = ${a * b + c}` }),
      () => (a * b > c ? { e: `la différence entre le produit de ${a} par ${b} et ${c}`, r: a * b - c, x: `(${a} × ${b}) − ${c} = ${a * b} − ${c} = ${a * b - c}` } : null),
      () => ((a + b) % c === 0 ? { e: `le quotient de la somme de ${a} et ${b} par ${c}`, r: (a + b) / c, x: `(${a} + ${b}) : ${c} = ${a + b} : ${c} = ${(a + b) / c}` } : null),
      () => (a > b ? { e: `le produit de la différence entre ${a} et ${b} par ${c}`, r: (a - b) * c, x: `(${a} − ${b}) × ${c} = ${a - b} × ${c} = ${(a - b) * c}` } : null),
      () => ({ e: `le double de la somme de ${a} et ${b}`, r: 2 * (a + b), x: `(${a} + ${b}) × 2 = ${a + b} × 2 = ${2 * (a + b)}` }),
    ])();
    if (!cas) return null;
    return { type: 'numerique', difficulte: 3, enonce: `Calcule ${cas.e}.`, reponse: cas.r, explication: `On commence par l'opération « intérieure », entre parenthèses : ${cas.x}.` };
  }, 2),
  // Quel mot désigne … ?
  forme((rng) => {
    const [def, mot] = rng.pick(MOTS_RESULTAT);
    // « Le reste » se dit parfois du résultat d'une soustraction : on l'écarte comme distracteur dans ce cas.
    const q = qcm(rng, majuscule(mot), MOTS_RESULTAT.map((x) => majuscule(x[1])).filter((x) => x !== majuscule(mot) && !(mot === 'la différence' && x === 'Le reste')), 4, 3);
    return { ...q, difficulte: 1, enonce: `Comment appelle-t-on ${def} ?`, explication: `${majuscule(def)} : ${mot}. Addition → termes, somme ; soustraction → termes, différence ; multiplication → facteurs, produit ; division → dividende, diviseur, quotient, reste.` };
  }),
]);

// ===========================================================================
// 9. Égalités : résultat, équivalence et fausses égalités
// ===========================================================================
const OPS = {
  '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, ':': (a, b) => (b && a % b === 0 ? a / b : NaN),
};
// Tire une expression « a op b » de valeur entière positive.
function expression(rng, op) {
  if (op === '+') { const a = rng.int(5, 200); const b = rng.int(5, 200); return [a, b]; }
  if (op === '−') { const a = rng.int(30, 300); const b = rng.int(5, a - 5); return [a, b]; }
  if (op === '×') return [rng.int(2, 15), rng.int(2, 25)];
  const b = rng.int(2, 12); return [b * rng.int(2, 25), b];
}
const txtExpr = (a, op, b) => `${fmt(a)} ${op} ${fmt(b)}`;

const egalites = famille([
  // Fausses égalités en chaîne.
  forme((rng) => {
    const op1 = rng.pick(['×', '+', '−']); const [a, b] = expression(rng, op1); const r1 = OPS[op1](a, b);
    const op2 = rng.pick(['+', '−']); const c = op2 === '+' ? rng.int(3, 90) : rng.int(2, Math.max(2, r1 - 1));
    const r2 = OPS[op2](r1, c);
    if (r2 <= 0) return null;
    const sorte = rng.pick(['chaine', 'chaine', 'parentheses', 'deuxLignes', 'repete']);
    const ecr = {
      chaine: `${txtExpr(a, op1, b)} = ${fmt(r1)} ${op2} ${fmt(c)} = ${fmt(r2)}`,
      parentheses: `(${txtExpr(a, op1, b)}) ${op2} ${fmt(c)} = ${fmt(r1)} ${op2} ${fmt(c)} = ${fmt(r2)}`,
      deuxLignes: `${txtExpr(a, op1, b)} = ${fmt(r1)} et ${fmt(r1)} ${op2} ${fmt(c)} = ${fmt(r2)}`,
      repete: `${txtExpr(a, op1, b)} = ${fmt(r1)} = ${fmt(r1)} ${op2} ${fmt(c)} = ${fmt(r2)}`,
    }[sorte];
    const vrai = sorte === 'parentheses' || sorte === 'deuxLignes';
    const bonneEcriture = `${txtExpr(a, op1, b)} = ${fmt(r1)} puis ${fmt(r1)} ${op2} ${fmt(c)} = ${fmt(r2)}, ou bien (${txtExpr(a, op1, b)}) ${op2} ${fmt(c)} = ${fmt(r2)}`;
    return {
      type: 'vrai_faux', reponse: vrai, difficulte: 3, fiche: 'ma-egalites',
      enonce: `Vrai ou faux ? Pour calculer « ${txtExpr(a, op1, b)}, puis ${op2 === '+' ? 'ajouter' : 'retirer'} ${fmt(c)} », Paul écrit :\n${ecr}\nCette écriture est correcte.`,
      explication: vrai
        ? `Vrai : chaque signe « = » relie deux écritures qui ont la même valeur.`
        : `Faux : le signe « = » doit relier deux choses égales. Ici, ${sorte === 'chaine' ? `on lit ${txtExpr(a, op1, b)} = ${fmt(r2)}, ce qui est faux (${txtExpr(a, op1, b)} = ${fmt(r1)})` : `on lit ${fmt(r1)} = ${fmt(r1)} ${op2} ${fmt(c)}, ce qui est faux`}. Il faut écrire : ${bonneEcriture}.`,
    };
  }, 2),
  // Égalité-équivalence : vrai ou faux ?
  forme((rng) => {
    const op1 = rng.pick(['+', '−', '×', ':']); const [a, b] = expression(rng, op1); const v = OPS[op1](a, b);
    const op2 = rng.pick(['+', '−', '×', ':'].filter((o) => o !== op1 || rng.next() < 0.3));
    const vrai = rng.next() < 0.5;
    const cible = vrai ? v : v + rng.pick([-10, -2, -1, 1, 2, 10]);
    if (cible <= 1) return null;
    let c; let d;
    if (op2 === '+') { c = rng.int(1, cible - 1); d = cible - c; } else if (op2 === '−') { d = rng.int(2, 120); c = cible + d; } else if (op2 === '×') { const divs = range(2, cible - 1).filter((k) => cible % k === 0 && cible / k > 1); if (!divs.length) return null; c = rng.pick(divs); d = cible / c; } else { d = rng.int(2, 8); c = cible * d; }
    const gauche = txtExpr(a, op1, b); const droite = txtExpr(c, op2, d);
    if (gauche === droite) return null;
    const vd = OPS[op2](c, d);
    return {
      type: 'vrai_faux', reponse: vrai, difficulte: 2, fiche: 'ma-egalites',
      enonce: `Vrai ou faux ? ${gauche} = ${droite}`,
      explication: `On calcule chaque membre : ${gauche} = ${fmt(v)} et ${droite} = ${fmt(vd)}. ${vrai ? 'Les deux valeurs sont égales : l\'égalité est vraie.' : `${fmt(v)} ≠ ${fmt(vd)} : l'égalité est fausse.`}`,
    };
  }, 2),
  // Compléter une égalité.
  forme((rng) => {
    const op1 = rng.pick(['+', '−', '×', ':']); const [a, b] = expression(rng, op1); const v = OPS[op1](a, b);
    const op2 = rng.pick(['+', '−', '×', ':']);
    const manque = rng.pick([0, 1]); // 0 : premier nombre manquant, 1 : second
    let c; let d;
    if (op2 === '+') { if (v < 4) return null; c = rng.int(1, v - 1); d = v - c; } else if (op2 === '−') { d = rng.int(2, 150); c = v + d; } else if (op2 === '×') { const divs = range(2, v - 1).filter((k) => v % k === 0 && v / k > 1); if (!divs.length) return null; c = rng.pick(divs); d = v / c; } else { d = rng.int(2, v > 100 ? 4 : 9); c = v * d; }
    if (op2 === op1 && c === a && d === b) return null; // même calcul des deux côtés : sans intérêt
    const rep = manque ? d : c;
    const droite = manque ? `${fmt(c)} ${op2} …` : `… ${op2} ${fmt(d)}`;
    const gaucheAGauche = rng.next() < 0.75;
    const gauche = txtExpr(a, op1, b);
    const expl = `${gauche} = ${fmt(v)}. On cherche le nombre qui rend l'autre membre égal à ${fmt(v)} : ${txtExpr(c, op2, d)} = ${fmt(v)}. Il manque ${fmt(rep)}.`;
    return {
      type: 'numerique', difficulte: 2, fiche: 'ma-egalites',
      enonce: `Complète pour que l'égalité soit vraie : ${gaucheAGauche ? `${gauche} = ${droite}` : `${droite} = ${gauche}`}`,
      reponse: rep, explication: expl,
    };
  }, 3),
  // Quelle écriture est correcte ?
  forme((rng) => {
    const op1 = rng.pick(['×', '+']); const [a, b] = expression(rng, op1); const r1 = OPS[op1](a, b);
    const c = rng.int(3, 90); const r2 = r1 + c;
    const verbe = op1 === '×' ? `multiplie ${fmt(a)} par ${fmt(b)}` : `additionne ${fmt(a)} et ${fmt(b)}`;
    const bonne = rng.pick([`${txtExpr(a, op1, b)} = ${fmt(r1)} ; ${fmt(r1)} + ${fmt(c)} = ${fmt(r2)}`, `(${txtExpr(a, op1, b)}) + ${fmt(c)} = ${fmt(r1)} + ${fmt(c)} = ${fmt(r2)}`]);
    const fausses = [`${txtExpr(a, op1, b)} = ${fmt(r1)} + ${fmt(c)} = ${fmt(r2)}`, `${txtExpr(a, op1, b)} = ${fmt(r1)} = ${fmt(r1)} + ${fmt(c)} = ${fmt(r2)}`, `${txtExpr(a, op1, b)} = ${fmt(r2)}`];
    return {
      ...qcm(rng, bonne, fausses), difficulte: 3, fiche: 'ma-egalites',
      enonce: `On ${verbe}, puis on ajoute ${fmt(c)}. Quelle écriture est correcte ?`,
      explication: `Seule « ${bonne} » est correcte : chaque signe « = » relie deux écritures de même valeur. Les autres écritures affirment que ${txtExpr(a, op1, b)} vaut ${fmt(r2)}, ou que ${fmt(r1)} = ${fmt(r1)} + ${fmt(c)} : c'est faux, car ${txtExpr(a, op1, b)} = ${fmt(r1)}.`,
    };
  }, 2),
  // = ou ≠ ?
  forme((rng) => {
    const op1 = rng.pick(['+', '−', '×']); const [a, b] = expression(rng, op1); const v = OPS[op1](a, b);
    const egal = rng.next() < 0.5;
    const cible = egal ? v : v + rng.pick([-3, -1, 1, 3, 10]);
    if (cible < 3) return null;
    const op2 = rng.pick(['+', '−']);
    const [c, d] = op2 === '+' ? (() => { const x = rng.int(1, cible - 1); return [x, cible - x]; })() : (() => { const y = rng.int(1, 60); return [cible + y, y]; })();
    const choix = ['=', '≠'];
    return {
      type: 'qcm', choix, reponse: egal ? 0 : 1, difficulte: 1, fiche: 'ma-egalites',
      enonce: `Quel signe faut-il écrire ? ${txtExpr(a, op1, b)} … ${txtExpr(c, op2, d)}`,
      explication: `${txtExpr(a, op1, b)} = ${fmt(v)} et ${txtExpr(c, op2, d)} = ${fmt(OPS[op2](c, d))}. ${egal ? 'Mêmes valeurs : on écrit « = ».' : 'Valeurs différentes : on écrit « ≠ » (« n\'est pas égal à »).'}`,
    };
  }),
]);


export const GENERATEURS = {
  ma_tc_aires_quadrilateres: aires,
  ma_tc_logique_deductive: logique,
  ma_tc_developpements: developpements,
  ma_tc_lire_representations: representations,
  ma_tc_proprietes_figures: proprietesFigures,
  ma_tc_mouvements: mouvements,
  ma_tc_perimetre_constant: perimetreConstant,
  ma_tc_vocabulaire_operations: vocabulaireOperations,
  ma_tc_egalites: egalites,
};
