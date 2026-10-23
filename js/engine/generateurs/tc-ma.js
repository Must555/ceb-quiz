// Générateurs des familles du tronc commun (référentiel P6), matière ma.
// Voir js/engine/generateurs/gen-*.js pour les conventions (formes, _signature, qcm…).
//
// Familles : aires des quadrilatères, logique déductive, développements de solides,
// lecture de représentations (ensembles, arbres, tableaux, diagrammes), propriétés des figures,
// mouvements, périmètre constant, vocabulaire des opérations, égalités ; puis (étape 2) opérations sur les
// fractions, achats et promotions, graphes fléchés, solides et assemblages de cubes, symboles géométriques.
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
      const A = L * l;
      const bonne = `${fmt(A / 2)} cm²`;
      return { ...qcm(rng, bonne, [`${fmt(A)} cm²`, `${fmt(A / 4)} cm²`, `${fmt(2 * (L + l))} cm²`]), difficulte: 2, enonce: `On dessine un losange dans un rectangle de ${L} cm sur ${l} cm : ses sommets sont les milieux des côtés du rectangle. Quelle est l'aire du losange ?`, explication: `Les diagonales du losange mesurent ${L} cm et ${l} cm. Aire = ${L} × ${l} : 2 = ${fmt(L * l / 2)} cm² : c'est la moitié de l'aire du rectangle (${L * l} cm²).` };
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
      ['Avec un calque, on fait tourner la figure autour d\'un point. Quel est ce mouvement ?', 'Un pivotement', ['Un glissement', 'Un retournement', 'Un glissement suivi d\'un retournement'], 'Tourner autour d\'un point, c\'est pivoter.'],
      ['On retourne le calque comme une page de livre. Quel est ce mouvement ?', 'Un retournement', ['Un glissement', 'Un pivotement', 'Un pivotement d\'un demi-tour'], 'Retourner le calque donne une image en miroir : c\'est un retournement.'],
      ['On déplace le calque en ligne droite, sans le tourner. Quel est ce mouvement ?', 'Un glissement', ['Un retournement', 'Un pivotement', 'Un pivotement d\'un demi-tour'], 'Déplacer sans tourner ni retourner : c\'est un glissement.'],
      ['Quel mouvement donne une image « en miroir » de la figure ?', 'Un retournement', ['Un glissement', 'Un pivotement', 'Un pivotement d\'un demi-tour'], 'Le retournement (symétrie) donne l\'image dans un miroir.'],
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
    if (quoi === 'perimetre' && rng.next() < 0.5) {
      // Pour que la réponse ne soit pas toujours « il reste le même » : on change de quantités différentes.
      const j = rng.pick([1, 2, 3].filter((x) => x !== k && x < l));
      if (!j) return null;
      const L2 = L + k; const l2 = l - j; const p1 = 2 * (L + l); const p2 = 2 * (L2 + l2);
      const bonneP = p2 > p1 ? 'Il augmente' : 'Il diminue';
      return { ...qcm(rng, bonneP, ['Il reste le même', p2 > p1 ? 'Il diminue' : 'Il augmente']), difficulte: 2,
        enonce: `Un rectangle mesure ${L} cm sur ${l} cm. On allonge sa longueur de ${k} cm et on raccourcit sa largeur de ${j} cm. Que devient son périmètre ?`,
        explication: `On ajoute ${k} cm d'un côté mais on n'enlève que ${j} cm de l'autre (ou l'inverse) : ${L2} + ${l2} = ${L2 + l2} au lieu de ${L + l}. Le périmètre passe de ${p1} cm à ${p2} cm.` };
    }
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
    // Même nombre (singulier/pluriel) que la bonne réponse : sinon « Les termes » se devine à l'accord.
    const pluriel = (m) => /^les /i.test(m);
    const forme2 = (m) => (pluriel(mot) && !pluriel(m) ? m.replace(/^(le|la) /, 'les ').replace(/^(les \S+?)(?<!s)( |$)/, '$1s$2') : !pluriel(mot) && pluriel(m) ? m.replace(/^les (\S+?)s\b/, (_, w) => `le ${w}`) : m);
    const q = qcm(rng, majuscule(mot), [...new Set(MOTS_RESULTAT.map((x) => majuscule(forme2(x[1]))))].filter((x) => x !== majuscule(mot) && !(mot === 'la différence' && x === 'Le reste')), 4, 3);
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


// ===========================================================================
// 10. Opérations sur les fractions : × un entier, + et − (un dénominateur multiple de l'autre)
// ===========================================================================
const pgcdF = (a, b) => (b === 0 ? Math.abs(a) : pgcdF(b, a % b));
const simplifier = (n, d) => { const g = pgcdF(n, d); return [n / g, d / g]; };
const frac = (n, d) => (d === 1 ? String(n) : `${n}/${d}`);
const fracSimple = (n, d) => frac(...simplifier(n, d));
const memeValeur = ([a, b], [c, d]) => a * d === b * c;
function texteSimplification(n, d) {
  const [a, b] = simplifier(n, d);
  if (a === n) return '';
  return ` On simplifie : on divise le numérateur et le dénominateur par ${n / a}. ${frac(n, d)} = ${frac(a, b)}.`;
}
// QCM de fractions : aucun distracteur ne peut valoir la bonne réponse (2/4 et 1/2, par exemple).
function choixFractions(rng, bonne, cands) {
  const vus = new Set(); const fausses = [];
  for (const [n, d] of cands) {
    if (!Number.isInteger(n) || !Number.isInteger(d) || n <= 0 || d <= 0 || memeValeur([n, d], bonne)) continue;
    const t = frac(n, d);
    if (!vus.has(t)) { vus.add(t); fausses.push(t); }
  }
  return qcm(rng, fracSimple(...bonne), fausses, 4, 3);
}
// Deux fractions dont la seconde a un dénominateur multiple de la première.
function deuxFractions(rng, { somme = 'libre' } = {}) {
  const b = rng.int(2, 8); const m = rng.int(2, b <= 4 ? 5 : 3); const d = b * m;
  const a = rng.int(1, b - 1); const c = rng.int(1, d - 1);
  if (pgcdF(a, b) !== 1 || pgcdF(c, d) !== 1) return null;
  if (somme === 'moinsQueUn' && a * m + c >= d) return null;
  return { a, b, c, d, m, am: a * m };
}
const etapeEquivalente = ({ a, b, m, am, d }) => `${d} est un multiple de ${b} (${b} × ${m} = ${d}) : on écrit ${frac(a, b)} avec le dénominateur ${d}, en multipliant le numérateur et le dénominateur par ${m}. ${frac(a, b)} = ${frac(am, d)}.`;

const fractionsOperations = famille([
  // Multiplier une fraction par un nombre entier.
  forme((rng) => {
    const b = rng.int(2, 12); const a = rng.int(1, b + 3); const k = rng.int(2, 9);
    if (a % b === 0 || pgcdF(a, b) !== 1) return null;
    const n = k * a;
    const c = choixFractions(rng, [n, b], [[n, k * b], [a + k, b], [a, k * b], [n, b + k], [a + k, b + k], [n + 1, b], [n - 1, b]]);
    if (!c) return null;
    const calc = rng.next() < 0.7 ? `${k} × ${frac(a, b)}` : `${frac(a, b)} × ${k}`;
    return {
      ...c, difficulte: 2,
      enonce: `Calcule et simplifie si possible : ${calc}`,
      explication: `On multiplie le numérateur par ${k} et on garde le dénominateur : ${calc} = ${frac(n, b)} (c'est ${frac(a, b)} répété ${k} fois).${texteSimplification(n, b)}`,
    };
  }, 3),
  // Additionner ou soustraire deux fractions (un dénominateur est un multiple de l'autre).
  forme((rng) => {
    const f = deuxFractions(rng); if (!f) return null;
    const { a, b, c, d, am } = f;
    const plus = rng.next() < 0.55;
    if (!plus && am === c) return null;
    const n = plus ? am + c : Math.abs(am - c);
    const petitDabord = plus ? rng.next() < 0.5 : am > c;
    const calc = petitDabord ? `${frac(a, b)} ${plus ? '+' : '−'} ${frac(c, d)}` : `${frac(c, d)} ${plus ? '+' : '−'} ${frac(a, b)}`;
    const calc2 = petitDabord ? `${frac(am, d)} ${plus ? '+' : '−'} ${frac(c, d)}` : `${frac(c, d)} ${plus ? '+' : '−'} ${frac(am, d)}`;
    const cands = plus ? [[a + c, b + d], [a + c, d], [am + c, b + d], [a + c, b], [n + 1, d], [n, 2 * d]]
      : [[Math.abs(a - c), d - b], [Math.abs(a - c), d], [n + 1, d], [n, b], [Math.abs(a - c), b]];
    const q = choixFractions(rng, [n, d], cands);
    if (!q) return null;
    return {
      ...q, difficulte: 3,
      enonce: `Calcule et simplifie si possible : ${calc}`,
      explication: `Les dénominateurs sont différents : on ne peut pas ${plus ? 'additionner' : 'soustraire'} tout de suite. ${etapeEquivalente(f)} Puis ${calc2} = ${frac(n, d)}.${texteSimplification(n, d)} On ${plus ? 'n\'additionne' : 'ne soustrait'} jamais les dénominateurs.`,
    };
  }, 3),
  // Une grandeur fractionnée multipliée par un nombre entier (en situation).
  forme((rng) => {
    const P = rng.pick(PRENOMS); const il = P.g === 'f' ? 'elle' : 'il';
    const k = rng.int(2, 12);
    const cas = rng.pick([
      { bs: [2, 4, 5, 8, 10], f: 1, u: 'l', e: (x) => `${P.n} boit ${x} l de lait chaque jour. Combien de litres boit-${il} en ${k} jours ?` },
      { bs: [2, 3, 4, 5, 6, 10, 12], f: 60, u: 'min', g: 'h', e: (x) => `Une séance d'entraînement dure ${x} h. Combien de minutes durent ${k} séances ?` },
      { bs: [2, 4, 5, 10, 20, 25], f: 100, u: 'cm', g: 'm', e: (x) => `${P.n} coupe ${k} morceaux de ficelle de ${x} m chacun. Quelle longueur de ficelle utilise-t-${il}, en cm ?` },
      { bs: [2, 4, 5, 8, 10, 20], f: 1000, u: 'g', g: 'kg', e: (x) => `Une recette demande ${x} kg de farine pour un gâteau. Combien de grammes de farine faut-il pour ${k} gâteaux ?` },
      { bs: [2, 4, 5], f: 1, u: 'km', e: (x) => `${P.n} court ${x} km chaque matin. Combien de kilomètres court-${il} en ${k} matins ?` },
      { bs: [2, 3, 4, 6, 12], f: 60, u: 'min', g: 'h', e: (x) => `${P.n} lit ${x} h chaque soir. Combien de minutes lit-${il} en ${k} soirs ?` },
    ]);
    const b = rng.pick(cas.bs); const a = rng.int(1, b - 1);
    if (pgcdF(a, b) !== 1) return null;
    const v = r(k * a * cas.f / b);
    if (cas.f > 1 && !Number.isInteger(v)) return null;
    const [sn, sd] = simplifier(k * a, b);
    return {
      type: 'numerique', unite: cas.u, difficulte: 3,
      enonce: cas.e(frac(a, b)),
      reponse: v,
      explication: `${k} × ${frac(a, b)} = ${frac(k * a, b)}${sd !== b ? ` = ${frac(sn, sd)}` : ''} ${cas.g ?? cas.u}. ${cas.f === 1 ? (sd === 1 ? '' : `${frac(sn, sd)} ${cas.u} = ${sn} : ${sd} = ${fmt(v)} ${cas.u}. `) : `1 ${cas.g} = ${fmt(cas.f)} ${cas.u}, donc ${frac(sn, sd)} ${cas.g} = ${sd === 1 ? `${sn} × ${fmt(cas.f)}` : `${sn} × ${fmt(cas.f)} : ${sd}`} = ${fmt(v)} ${cas.u}. `}`.trim(),
    };
  }, 2),
  // Additionner des grandeurs fractionnées (en situation) : ce qui est pris, ce qui reste.
  forme((rng) => {
    const f = deuxFractions(rng, { somme: 'moinsQueUn' }); if (!f) return null;
    const { a, b, c, d, am } = f;
    const [P1, P2] = rng.shuffle(PRENOMS);
    const il = P1.g === 'f' ? 'elle' : 'il';
    const ctx = rng.pick([
      { t: `Dans le potager de ${P1.n}, ${frac(a, b)} du terrain est planté de légumes et ${frac(c, d)} de fleurs.`, pris: 'Quelle fraction du terrain est plantée ?', reste: 'Quelle fraction du terrain n\'est pas plantée ?' },
      { t: `${P1.n} mange ${frac(a, b)} d'une pizza et ${P2.n} en mange ${frac(c, d)}.`, pris: 'Quelle fraction de la pizza ont-ils mangée à deux ?', reste: 'Quelle fraction de la pizza reste-t-il ?' },
      { t: `${P1.n} dépense ${frac(a, b)} de ses économies pour un livre et ${frac(c, d)} pour un jeu.`, pris: `Quelle fraction de ses économies a-t-${il} dépensée ?`, reste: `Quelle fraction de ses économies lui reste-t-il ?` },
      { t: `Dans une école, ${frac(a, b)} des élèves viennent à pied et ${frac(c, d)} à vélo. Les autres viennent en voiture.`, pris: 'Quelle fraction des élèves vient à pied ou à vélo ?', reste: 'Quelle fraction des élèves vient en voiture ?' },
      { t: `Le mercredi après-midi, ${P1.n} passe ${frac(a, b)} de son temps à lire et ${frac(c, d)} à jouer dehors.`, pris: 'Quelle fraction de son après-midi cela fait-il en tout ?', reste: 'Quelle fraction de son après-midi lui reste-t-il pour autre chose ?' },
      { t: `On remplit un aquarium : ${frac(a, b)} le matin et ${frac(c, d)} l'après-midi.`, pris: 'Quelle fraction de l\'aquarium est remplie ?', reste: 'Quelle fraction de l\'aquarium reste-t-il à remplir ?' },
    ]);
    const reste = rng.next() < 0.45;
    const n = reste ? d - am - c : am + c;
    const q = choixFractions(rng, [n, d], [[a + c, b + d], [a + c, d], [reste ? am + c : d - am - c, d], [n + 1, d], [reste ? b + d - a - c : a + c + 1, b + d]]);
    if (!q) return null;
    return {
      ...q, difficulte: 3,
      enonce: `${ctx.t} ${reste ? ctx.reste : ctx.pris}`,
      explication: `${etapeEquivalente(f)} ${frac(am, d)} + ${frac(c, d)} = ${frac(am + c, d)}.${reste ? ` Le tout vaut ${frac(d, d)} : il reste ${frac(d, d)} − ${frac(am + c, d)} = ${frac(n, d)}.` : ''}${texteSimplification(n, d)}`,
    };
  }, 2),
  // Compléter pour obtenir 1 (ou une autre fraction).
  forme((rng) => {
    const f = deuxFractions(rng, { somme: 'moinsQueUn' }); if (!f) return null;
    const { a, b, d, am } = f;
    const viser1 = rng.next() < 0.6;
    const cible = viser1 ? d : rng.int(am + 1, d + Math.floor(d / 2));
    if (cible - am < 1 || (!viser1 && pgcdF(cible, d) !== 1)) return null;
    return {
      type: 'numerique', difficulte: 3,
      enonce: `Complète : ${frac(a, b)} + …/${d} = ${viser1 ? '1' : frac(cible, d)}`,
      reponse: cible - am,
      explication: `${etapeEquivalente(f)} ${viser1 ? `1 = ${frac(d, d)}. ` : ''}Il manque ${cible} − ${am} = ${cible - am} : ${frac(am, d)} + ${frac(cible - am, d)} = ${frac(cible, d)}${viser1 ? ' = 1' : ''}.`,
    };
  }),
  // Vrai ou faux : erreurs fréquentes.
  forme((rng) => {
    const f = deuxFractions(rng); if (!f) return null;
    const { a, b, c, d, am } = f;
    if (rng.next() < 0.5) {
      const juste = rng.next() < 0.5;
      const res = juste ? (rng.next() < 0.5 ? frac(am + c, d) : fracSimple(am + c, d)) : frac(a + c, b + d);
      if (!juste && memeValeur([a + c, b + d], [am + c, d])) return null;
      return {
        type: 'vrai_faux', reponse: juste, difficulte: 3,
        enonce: `Vrai ou faux ? ${frac(a, b)} + ${frac(c, d)} = ${res}`,
        explication: `${etapeEquivalente(f)} ${frac(am, d)} + ${frac(c, d)} = ${frac(am + c, d)}.${texteSimplification(am + c, d)} ${juste ? 'C\'est donc vrai.' : 'C\'est donc faux : on n\'additionne jamais les dénominateurs.'}`,
      };
    }
    const k = rng.int(2, 6); const juste = rng.next() < 0.5;
    const res = juste ? frac(k * a, b) : frac(k * a, k * b);
    return {
      type: 'vrai_faux', reponse: juste, difficulte: 2,
      enonce: `Vrai ou faux ? ${k} × ${frac(a, b)} = ${res}`,
      explication: `On multiplie seulement le numérateur : ${k} × ${frac(a, b)} = ${frac(k * a, b)}.${juste ? ' C\'est donc vrai.' : ` C'est donc faux : ${frac(k * a, k * b)} = ${frac(a, b)}, la fraction n'a pas changé de valeur.`}`,
    };
  }),
]);

// ===========================================================================
// 11. Achats : promotions, remises, bénéfice et perte
// ===========================================================================
const eur = (x) => { const c = Math.round(x * 100); return `${formatNombre(Math.floor(c / 100))}${c % 100 ? `,${String(c % 100).padStart(2, '0')}` : ''} €`; };
// [singulier, pluriel, article, prix min, prix max] (en euros)
const ARTICLES_PROMO = [
  ['paquet de biscuits', 'paquets de biscuits', 'un', 1, 4], ['bouteille de jus', 'bouteilles de jus', 'une', 1, 4],
  ['tube de dentifrice', 'tubes de dentifrice', 'un', 1.5, 4], ['boîte de céréales', 'boîtes de céréales', 'une', 2, 5],
  ['pot de confiture', 'pots de confiture', 'un', 1.5, 5], ['T-shirt', 'T-shirts', 'un', 6, 20], ['paire de chaussettes', 'paires de chaussettes', 'une', 2, 9],
  ['livre de poche', 'livres de poche', 'un', 5, 12], ['cahier', 'cahiers', 'un', 1, 4], ['tablette de chocolat', 'tablettes de chocolat', 'une', 1, 4],
  ['bande dessinée', 'bandes dessinées', 'une', 8, 16], ['jeu de cartes', 'jeux de cartes', 'un', 3, 12], ['ballon', 'ballons', 'un', 6, 25],
  ['sac de croquettes', 'sacs de croquettes', 'un', 4, 15], ['pot de peinture', 'pots de peinture', 'un', 8, 30], ['plante verte', 'plantes vertes', 'une', 4, 18],
];
const prixCents = (rng, min, max, pas) => rng.int(Math.ceil(min * 100 / pas), Math.floor(max * 100 / pas)) * pas;
const LOTS = [
  { txt: '1 acheté, 1 gratuit', lot: 2, paye: 1 }, { txt: '3 pour le prix de 2', lot: 3, paye: 2 },
  { txt: '4 pour le prix de 3', lot: 4, paye: 3 }, { txt: '2 achetés, le 3e offert', lot: 3, paye: 2 },
];
const MAGASINS = ['de vêtements', 'de chaussures', 'de jouets', 'de sport', 'de jardinage', 'de meubles', 'de jeux vidéo', 'de bricolage'];
const MARCHANDS = [
  ['Un libraire', 'livres', 'livre', 'Il'], ['Un fleuriste', 'bouquets', 'bouquet', 'Il'], ['Une boulangère', 'gâteaux', 'gâteau', 'Elle'], ['Un marchand de glaces', 'cornets', 'cornet', 'Il'],
  ['Une commerçante', 'sacs', 'sac', 'Elle'], ['Un vendeur de fruits', 'cageots de pommes', 'cageot', 'Il'], ['Une fermière', 'pots de miel', 'pot', 'Elle'], ['Une marchande de jouets', 'peluches', 'peluche', 'Elle'],
];

const achatsPromos = famille([
  // « Le deuxième à moitié prix »
  forme((rng) => {
    const [sg, pl, art, mn, mx] = rng.pick(ARTICLES_PROMO);
    const p = prixCents(rng, mn, mx, 10); const n = rng.int(2, 7);
    const paires = Math.floor(n / 2); const seul = n % 2;
    const tot = paires * (p + p / 2) + seul * p;
    return {
      type: 'numerique', unite: '€', difficulte: 3,
      enonce: `Promotion : « le deuxième à moitié prix ». ${majuscule(art)} ${sg} coûte ${eur(p / 100)}. Combien paies-tu pour ${n} ${pl} ?${n > 2 ? ' (La promotion compte pour chaque paire d\'articles.)' : ''}`,
      reponse: tot / 100,
      explication: `Une paire coûte ${eur(p / 100)} + ${eur(p / 200)} (la moitié) = ${eur(1.5 * p / 100)}. ${n} articles = ${paires} ${paires > 1 ? 'paires' : 'paire'}${seul ? ' et 1 article au prix normal' : ''}. Total : ${paires} × ${eur(1.5 * p / 100)}${seul ? ` + ${eur(p / 100)}` : ''} = ${eur(tot / 100)}.`,
    };
  }, 2),
  // Lots : « 1 acheté, 1 gratuit », « 3 pour le prix de 2 »…
  forme((rng) => {
    const [, pl, , mn, mx] = rng.pick(ARTICLES_PROMO);
    const L = rng.pick(LOTS);
    const p = prixCents(rng, mn, mx, 5); const n = rng.int(L.lot, 3 * L.lot + L.lot - 1);
    const lots = Math.floor(n / L.lot); const reste = n % L.lot;
    const tot = (lots * L.paye + reste) * p;
    return {
      type: 'numerique', unite: '€', difficulte: 3,
      enonce: `Promotion sur les ${pl} : « ${L.txt} ». Un article coûte ${eur(p / 100)}. Combien paies-tu pour ${n} ${pl} ?${n > L.lot ? ' (La promotion compte pour chaque lot complet.)' : ''}`,
      reponse: tot / 100,
      explication: `Un lot, c'est ${L.lot} articles dont tu paies ${L.paye}. ${n} articles = ${lots} ${lots > 1 ? 'lots' : 'lot'}${reste ? ` et ${reste} ${reste > 1 ? 'articles' : 'article'} sans promotion` : ''}. Tu paies ${lots} × ${L.paye}${reste ? ` + ${reste}` : ''} = ${lots * L.paye + reste} ${lots * L.paye + reste > 1 ? 'articles' : 'article'} : ${lots * L.paye + reste} × ${eur(p / 100)} = ${eur(tot / 100)}.`,
    };
  }, 2),
  // Remise en pourcentage.
  forme((rng) => {
    const [sg, , art, mn, mx] = rng.pick(ARTICLES_PROMO);
    const pct = rng.pick([10, 15, 20, 25, 30, 40, 50, 60, 70]);
    const p = prixCents(rng, Math.max(mn, 2), mx * 1.5, rng.pick([100, 50, 20, 10]));
    if ((p * pct) % 100) return null;
    const remise = p * pct / 100;
    const demandeRemise = rng.next() < 0.3;
    return {
      type: 'numerique', unite: '€', difficulte: 2,
      enonce: `${majuscule(art)} ${sg} coûte ${eur(p / 100)}. Pendant les soldes, il y a ${pct} % de remise. ${demandeRemise ? 'De combien d\'euros le prix diminue-t-il ?' : 'Quel est le nouveau prix ?'}`,
      reponse: (demandeRemise ? remise : p - remise) / 100,
      explication: `${pct} % de ${eur(p / 100)} = ${eur(p / 100)} × ${pct} : 100 = ${eur(remise / 100)}.${demandeRemise ? '' : ` Nouveau prix : ${eur(p / 100)} − ${eur(remise / 100)} = ${eur((p - remise) / 100)}.`}`,
    };
  }, 2),
  // Comprendre les annonces : « jusqu'à … % », « à partir de … ».
  forme((rng) => {
    if (rng.next() < 0.55) {
      const pct = rng.pick([30, 40, 50, 60, 70]); const mag = rng.pick(MAGASINS);
      const bonne = `Aucun article n'a une remise de plus de ${pct} %.`;
      const c = qcm(rng, bonne, [`Tous les articles ont une remise de ${pct} %.`, `Tous les articles ont une remise d'au moins ${pct} %.`, `Certains articles ont une remise de plus de ${pct} %.`]);
      return {
        ...c, difficulte: 2,
        enonce: `Un magasin ${mag} annonce : « Jusqu'à ${pct} % de remise ! » Quelle phrase est forcément vraie ?`,
        explication: `« Jusqu'à ${pct} % » veut dire que ${pct} % est la remise la plus grande. D'autres articles peuvent avoir une remise plus petite, mais aucun n'a plus de ${pct} %.`,
      };
    }
    // [singulier, pluriel, prix minimum, prix maximum, pas] : des prix « à partir de » réalistes.
    const [obj, objs, pmin, pmax, pas] = rng.pick([['vélo', 'vélos', 90, 400, 10], ['séjour', 'séjours', 150, 900, 10], ['ordinateur', 'ordinateurs', 250, 900, 10], ['canapé', 'canapés', 200, 900, 10],
      ['abonnement', 'abonnements', 5, 30, 1], ['menu', 'menus', 8, 25, 1], ['manteau', 'manteaux', 25, 120, 5], ['casque', 'casques', 15, 60, 5]]);
    const prix = rng.int(pmin / pas, pmax / pas) * pas;
    const le = /^[aeéiou]/.test(obj) ? 'L\'' : 'Le ';
    const c = qcm(rng, `${le}${obj} le moins cher coûte ${prix} €.`, [`Tous les ${objs} coûtent ${prix} €.`, `${le}${obj} le plus cher coûte ${prix} €.`, `Aucun ${obj} ne coûte plus de ${prix} €.`]);
    return {
      ...c, difficulte: 2,
      enonce: `Une publicité annonce : « ${majuscule(objs)} à partir de ${prix} € ». Que peux-tu en déduire ?`,
      explication: `« À partir de ${prix} € » veut dire que le prix commence à ${prix} € : c'est le prix le plus bas. Les autres ${objs} coûtent plus cher.`,
    };
  }),
  // Bénéfice, perte, prix de revient.
  forme((rng) => {
    const [qui, objs, obj, Il] = rng.pick(MARCHANDS);
    const t = rng.int(0, 2);
    if (t === 0) {
      const k = rng.int(8, 60); const achat = prixCents(rng, 1, 20, 10);
      const gain = rng.next() < 0.75;
      const vente = gain ? achat + prixCents(rng, 0.2, 8, 10) : achat - prixCents(rng, 0.1, Math.min(achat / 200, 4), 10);
      if (vente <= 0 || vente === achat) return null;
      const diff = Math.abs(vente - achat) * k;
      return {
        type: 'numerique', unite: '€', difficulte: 3,
        enonce: `${qui} achète ${k} ${objs} à ${eur(achat / 100)} pièce. ${gain ? `${Il} les revend tous à ${eur(vente / 100)} pièce. Quel est son bénéfice ?` : `${Il} ne parvient à les revendre qu'à ${eur(vente / 100)} pièce. Quelle est sa perte ?`}`,
        reponse: diff / 100,
        explication: `Par ${obj} : ${gain ? `${eur(vente / 100)} − ${eur(achat / 100)} = ${eur((vente - achat) / 100)} de bénéfice` : `${eur(achat / 100)} − ${eur(vente / 100)} = ${eur((achat - vente) / 100)} de perte`}. Pour ${k} ${objs} : ${k} × ${eur(Math.abs(vente - achat) / 100)} = ${eur(diff / 100)}. ${gain ? '(On peut aussi calculer : prix de vente total − prix d\'achat total.)' : '(On peut aussi calculer : prix d\'achat total − prix de vente total.)'}`,
      };
    }
    const achat = rng.int(40, 900) * 100 + rng.pick([0, 50]); const frais = rng.int(5, 120) * 100 + rng.pick([0, 50]);
    const revient = achat + frais;
    const gain = rng.next() < 0.7;
    const vente = gain ? revient + rng.int(10, 400) * 100 : revient - rng.int(5, Math.min(100, Math.floor(revient / 200))) * 100;
    if (t === 1) {
      const demande = rng.pick(['revient', 'resultat', 'resultat']);
      if (demande === 'revient') {
        return {
          type: 'numerique', unite: '€', difficulte: 2,
          enonce: `${qui} achète des ${objs} pour ${eur(achat / 100)}. Le transport lui coûte ${eur(frais / 100)}. Quel est le prix de revient de ces ${objs} ?`,
          reponse: revient / 100,
          explication: `Le prix de revient, c'est tout ce que le commerçant a dépensé : prix d'achat + frais. ${eur(achat / 100)} + ${eur(frais / 100)} = ${eur(revient / 100)}.`,
        };
      }
      return {
        type: 'numerique', unite: '€', difficulte: 3,
        enonce: `${qui} achète des ${objs} pour ${eur(achat / 100)}. Le transport lui coûte ${eur(frais / 100)}. ${Il} vend tout pour ${eur(vente / 100)}. ${gain ? 'Quel est son bénéfice ?' : 'Quelle est sa perte ?'}`,
        reponse: Math.abs(vente - revient) / 100,
        explication: `Prix de revient : ${eur(achat / 100)} + ${eur(frais / 100)} = ${eur(revient / 100)}. ${gain ? `Bénéfice = prix de vente − prix de revient = ${eur(vente / 100)} − ${eur(revient / 100)} = ${eur((vente - revient) / 100)}.` : `Il vend moins cher que le prix de revient : perte = ${eur(revient / 100)} − ${eur(vente / 100)} = ${eur((revient - vente) / 100)}.`}`,
      };
    }
    const d = Math.abs(vente - revient); const d2 = Math.abs(vente - achat);
    const bonne = `${gain ? 'Un bénéfice' : 'Une perte'} de ${eur(d / 100)}`;
    const fausses = [`${gain ? 'Une perte' : 'Un bénéfice'} de ${eur(d / 100)}`, `${vente > achat ? 'Un bénéfice' : 'Une perte'} de ${eur(d2 / 100)}`, `${gain ? 'Un bénéfice' : 'Une perte'} de ${eur((d + 2 * frais) / 100)}`];
    const c = qcm(rng, bonne, fausses);
    if (!c) return null;
    return {
      ...c, difficulte: 3,
      enonce: `${qui} achète des ${objs} pour ${eur(achat / 100)} et paie ${eur(frais / 100)} de transport. ${Il} vend tout pour ${eur(vente / 100)}. Fait-${Il.toLowerCase()} un bénéfice ou une perte ?`,
      explication: `Prix de revient : ${eur(achat / 100)} + ${eur(frais / 100)} = ${eur(revient / 100)}. ${Il} vend pour ${eur(vente / 100)}, ${gain ? 'plus' : 'moins'} que le prix de revient : ${gain ? `bénéfice de ${eur(vente / 100)} − ${eur(revient / 100)}` : `perte de ${eur(revient / 100)} − ${eur(vente / 100)}`} = ${eur(d / 100)}. Attention à ne pas oublier les frais de transport !`,
    };
  }, 3),
  // Comparer deux promotions.
  forme((rng) => {
    const [sg, pl, art, mn, mx] = rng.pick(ARTICLES_PROMO);
    const p = prixCents(rng, mn, mx, 20); const n = rng.int(2, 6);
    const OFFRES = [
      { txt: 'le deuxième à moitié prix', tot: () => Math.floor(n / 2) * 1.5 * p + (n % 2) * p, calc: () => `${Math.floor(n / 2)} ${n >= 4 ? 'paires' : 'paire'} à ${eur(1.5 * p / 100)} (${eur(p / 100)} + ${eur(p / 200)})${n % 2 ? ` + 1 article à ${eur(p / 100)}` : ''}`, unit: true },
      { txt: '3 pour le prix de 2', tot: () => (Math.floor(n / 3) * 2 + (n % 3)) * p, calc: () => `${Math.floor(n / 3) * 2 + (n % 3)} ${Math.floor(n / 3) * 2 + (n % 3) > 1 ? 'articles payés' : 'article payé'} × ${eur(p / 100)}` },
      { txt: '− 30 % sur chaque article', tot: () => n * p * 0.7, calc: () => `${n} × ${eur(0.7 * p / 100)} (prix réduit de 30 %)` },
      { txt: '− 20 % sur chaque article', tot: () => n * p * 0.8, calc: () => `${n} × ${eur(0.8 * p / 100)} (prix réduit de 20 %)` },
      { txt: '1 acheté, 1 gratuit', tot: () => (Math.ceil(n / 2)) * p, calc: () => `${Math.ceil(n / 2)} ${Math.ceil(n / 2) > 1 ? 'articles payés' : 'article payé'} × ${eur(p / 100)}` },
    ];
    const [A, B] = rng.shuffle(OFFRES).slice(0, 2);
    if (A.txt.includes('%') && B.txt.includes('%')) return null; // − 20 % contre − 30 % : rien à calculer
    const ta = Math.round(A.tot()); const tb = Math.round(B.tot());
    const choix = ['L\'offre A', 'L\'offre B', 'Les deux offres coûtent la même chose'];
    const rep = ta < tb ? 0 : tb < ta ? 1 : 2;
    return {
      type: 'qcm', choix, reponse: rep, difficulte: 3,
      enonce: `${majuscule(art)} ${sg} coûte ${eur(p / 100)}. Tu veux acheter ${n} ${pl}. Offre A : « ${A.txt} ». Offre B : « ${B.txt} ». Quelle offre est la moins chère ?`,
      explication: `Offre A : ${A.calc()} = ${eur(ta / 100)}. Offre B : ${B.calc()} = ${eur(tb / 100)}. ${rep === 2 ? 'Les deux offres coûtent la même chose.' : `L'offre ${rep === 0 ? 'A' : 'B'} est la moins chère.`}`,
    };
  }, 2),
]);

// ===========================================================================
// 12. Graphes fléchés
// ===========================================================================
// Flèche de P vers Q (pointe dessinée à la main : pas de <marker>, donc pas d'identifiant partagé).
function flecheSvg(P, Q, { recul = 0, avance = 0, stroke = COUL.trait, sw = 1.8 } = {}) {
  const dx = Q[0] - P[0]; const dy = Q[1] - P[1]; const L = Math.hypot(dx, dy); const ux = dx / L; const uy = dy / L;
  const A = [P[0] + ux * avance, P[1] + uy * avance]; const B = [Q[0] - ux * recul, Q[1] - uy * recul];
  const base = [B[0] - ux * 10, B[1] - uy * 10];
  return ligneSvg(A, base, { stroke, sw }) + `<polygon points="${pts([B, [base[0] - uy * 5, base[1] + ux * 5], [base[0] + uy * 5, base[1] - ux * 5]])}" fill="${stroke}"/>`;
}
const ellipseSvg = (cx, cy, rx, ry, fill) => `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(rx)}" ry="${n1(ry)}" fill="${fill}" stroke="${COUL.trait}" stroke-width="2"/>`;

// Deux ensembles : étiquettes à gauche et à droite, flèches liens [i, j] (de gauche i vers droite j).
function figureDeuxEnsembles(gauche, droite, liens, { titreG = '', titreD = '', op = '' } = {}) {
  const n = Math.max(gauche.length, droite.length); const pas = 40;
  const y0 = (titreG || titreD ? 62 : 40) + (op ? 8 : 0); const H = y0 + n * pas + 14; const W = 360;
  const xg = 90; const xd = 270;
  const yG = (i) => y0 + pas / 2 + i * pas + (n - gauche.length) * pas / 2;
  const yD = (j) => y0 + pas / 2 + j * pas + (n - droite.length) * pas / 2;
  let s = ellipseSvg(xg, y0 + n * pas / 2, 58, n * pas / 2 + 8, COUL.bleu) + ellipseSvg(xd, y0 + n * pas / 2, 58, n * pas / 2 + 8, COUL.orange);
  if (titreG) s += texteSvg(xg, 18, titreG, { size: 13, bold: true });
  if (titreD) s += texteSvg(xd, 18, titreD, { size: 13, bold: true });
  if (op) s += rectSvg(W / 2 - 34, y0 - 30, 68, 24, { fill: COUL.jaune, sw: 1.5 }) + texteSvg(W / 2, y0 - 18, op, { size: 15, bold: true });
  for (const [i, j] of liens) s += flecheSvg([xg + 26, yG(i)], [xd - 26, yD(j)], { sw: 1.6 });
  gauche.forEach((t, i) => { s += texteSvg(xg, yG(i), t, { size: 15, bold: t === '?' }); });
  droite.forEach((t, j) => { s += texteSvg(xd, yD(j), t, { size: 15, bold: t === '?' }); });
  return svg(W, H, s);
}
// Un seul ensemble : nombres sur une ellipse, flèches éventuelles (i → j).
function figureUnEnsemble(nombres, liens, legende) {
  const W = 360; const H = 250; const cx = W / 2; const cy = 140; const rx = 120; const ry = 72;
  const k = nombres.length;
  const P = nombres.map((_, i) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / k + 0.3; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
  let s = ellipseSvg(cx, cy, rx + 36, ry + 30, COUL.vert);
  s += texteSvg(cx, 20, legende, { size: 13, bold: true });
  for (const [i, j] of liens) s += flecheSvg(P[i], P[j], { recul: 15, avance: 15, sw: 1.6 });
  nombres.forEach((t, i) => { s += cercleSvg(P[i][0], P[i][1], 3, { fill: COUL.trait }) + texteSvg(P[i][0], P[i][1] - 13, fmt(t), { size: 14, bold: true, halo: true }); });
  return svg(W, H, s);
}
const OPERATEURS = {
  fois: (k) => ({ txt: `× ${k}`, f: (x) => x * k, inv: (y) => y / k, mots: `multiplier par ${k}` }),
  plus: (k) => ({ txt: `+ ${k}`, f: (x) => x + k, inv: (y) => y - k, mots: `ajouter ${k}` }),
  moins: (k) => ({ txt: `− ${k}`, f: (x) => x - k, inv: (y) => y + k, mots: `retirer ${k}` }),
  div: (k) => ({ txt: `: ${k}`, f: (x) => x / k, inv: (y) => y * k, mots: `diviser par ${k}` }),
};
function operateurAuHasard(rng) {
  const sorte = rng.pick(['fois', 'fois', 'plus', 'moins', 'div']);
  const k = sorte === 'fois' || sorte === 'div' ? rng.int(2, 12) : rng.int(3, 75);
  const op = OPERATEURS[sorte](k);
  let gauche;
  if (sorte === 'div') gauche = rng.shuffle(range(2, 15)).slice(0, 4).map((x) => x * k);
  else if (sorte === 'moins') gauche = rng.shuffle(range(k + 1, k + 60)).slice(0, 4);
  else gauche = rng.shuffle(range(1, sorte === 'fois' ? 15 : 90)).slice(0, 4);
  return { sorte, k, op, gauche };
}
// Relations dans un seul ensemble : x → y signifie « x … y ».
const RELATIONS = [
  { txt: 'est le double de', ok: (x, y) => x === 2 * y },
  { txt: 'est la moitié de', ok: (x, y) => 2 * x === y },
  { txt: 'est le triple de', ok: (x, y) => x === 3 * y },
  { txt: 'a 5 de plus que', ok: (x, y) => x === y + 5 },
  { txt: 'a 10 de moins que', ok: (x, y) => x + 10 === y },
  { txt: 'est 10 fois plus grand que', ok: (x, y) => x === 10 * y },
];
const CONTEXTES_PROPORTION = [
  ['Nombre de cahiers', 'Prix (€)', 'cahier', [80, 350]], ['Nombre de kg de pommes', 'Prix (€)', 'kg', [150, 450]], ['Nombre de places', 'Prix (€)', 'place', [500, 1500]],
  ['Nombre de litres', 'Prix (€)', 'litre', [120, 220]], ['Nombre de tickets', 'Prix (€)', 'ticket', [150, 400]], ['Nombre de mètres', 'Prix (€)', 'mètre', [200, 900]],
];

const grapheFleche = famille([
  // Compléter un graphe fléché (opérateur donné).
  forme((rng) => {
    const { sorte, op, gauche } = operateurAuHasard(rng);
    const droite = gauche.map(op.f);
    const inverse = rng.next() < 0.3;
    const cache = rng.int(0, 3);
    const ordre = rng.next() < 0.5 ? range(0, 3) : rng.shuffle(range(0, 3));
    const g = gauche.map((x, i) => (inverse && i === cache ? '?' : fmt(x)));
    const dr = ordre.map((i) => (!inverse && i === cache ? '?' : fmt(droite[i])));
    const rep = inverse ? gauche[cache] : droite[cache];
    return {
      type: 'numerique', difficulte: inverse ? 3 : 2,
      enonce: `Complète ce graphe fléché : quel nombre remplace le point d'interrogation ?`,
      cle: `${op.txt}|${g.join(',')}|${dr.join(',')}`,
      figure: figureDeuxEnsembles(g, dr, gauche.map((_, i) => [i, ordre.indexOf(i)]), { op: op.txt }),
      reponse: rep,
      explication: inverse ? `Chaque flèche veut dire « ${op.mots} ». On remonte la flèche en faisant l'opération inverse : ${fmt(droite[cache])} ${sorte === 'fois' ? ':' : sorte === 'div' ? '×' : sorte === 'plus' ? '−' : '+'} ${op.txt.split(' ')[1]} = ${fmt(rep)}.` : `Chaque flèche veut dire « ${op.mots} » : ${fmt(gauche[cache])} ${op.txt} = ${fmt(rep)}.`,
    };
  }, 3),
  // Trouver l'opérateur.
  forme((rng) => {
    const sorte = rng.pick(['fois', 'plus']);
    const k = sorte === 'fois' ? rng.int(2, 9) : rng.int(3, 40);
    const op = OPERATEURS[sorte](k);
    const gauche = rng.shuffle(range(2, 12)).slice(0, 3);
    const droite = gauche.map(op.f);
    const verifie = (o) => gauche.every((x, i) => o.f(x) === droite[i]);
    const cands = [OPERATEURS.plus(droite[0] - gauche[0]), OPERATEURS.fois(k + 1), OPERATEURS.fois(k - 1), OPERATEURS.plus(k), OPERATEURS.fois(k), OPERATEURS.plus(droite[1] - gauche[1]), OPERATEURS.fois(2 * k)]
      .filter((o) => o.txt !== op.txt && !verifie(o) && !/[−] |\b0\b|× 1$|\+ 0$/.test(o.txt) && !o.txt.includes('-'));
    const c = qcm(rng, op.txt, cands.map((o) => o.txt));
    if (!c) return null;
    return {
      ...c, difficulte: 2,
      enonce: 'Quelle opération fait passer de chaque nombre de gauche à son nombre de droite ?',
      cle: `${gauche.join(',')}|${droite.join(',')}`,
      figure: figureDeuxEnsembles(gauche.map(fmt), droite.map(fmt), [[0, 0], [1, 1], [2, 2]]),
      explication: `${gauche.map((x, i) => `${x} ${op.txt} = ${droite[i]}`).join(' ; ')}. L'opération doit marcher pour toutes les flèches, pas seulement pour une.`,
    };
  }, 2),
  // Situation de proportionnalité : compléter le prix.
  forme((rng) => {
    const [tg, td, unite, [pmin, pmax]] = rng.pick(CONTEXTES_PROPORTION);
    const pu = rng.int(pmin / 10, pmax / 10) * 10;
    const qs = rng.shuffle(range(1, 12)).slice(0, 4);
    const cache = rng.int(1, 3);
    const g = qs.map(fmt); const dr = qs.map((q, i) => (i === cache ? '?' : eur(q * pu / 100).replace(' €', '')));
    if (qs[cache] === 1) return null;
    return {
      type: 'numerique', unite: '€', difficulte: 3,
      enonce: `Ce graphe fléché représente une situation de proportionnalité. Quel prix remplace le point d'interrogation ?`,
      cle: `${g.join(',')}|${dr.join(',')}`,
      figure: figureDeuxEnsembles(g, dr, qs.map((_, i) => [i, i]), { titreG: tg, titreD: td }),
      reponse: r(qs[cache] * pu / 100),
      explication: `${qs.includes(1) ? `On lit sur le graphe : 1 ${unite} coûte ${eur(pu / 100)}.` : `Prix pour 1 ${unite} : ${eur(qs[0] * pu / 100)} : ${qs[0]} = ${eur(pu / 100)}.`} Pour ${qs[cache]} : ${qs[cache]} × ${eur(pu / 100)} = ${eur(qs[cache] * pu / 100)}. On passe toujours de gauche à droite en multipliant par ${fmt(pu / 100)}.`,
    };
  }, 2),
  // Est-ce une situation de proportionnalité ?
  forme((rng) => {
    const prop = rng.next() < 0.5;
    const P = rng.pick(PRENOMS);
    let tg; let td; let gauche; let droite; let expl;
    if (prop) {
      const [a, b, k] = rng.pick([['Nombre de paquets', 'Nombre de biscuits', rng.int(6, 15)], ['Nombre de voitures', 'Nombre de roues', 4], ['Nombre de semaines', 'Nombre de jours', 7], ['Nombre de boîtes', 'Nombre d\'œufs', rng.pick([6, 10, 12])], ['Nombre d\'heures', 'Nombre de minutes', 60], ['Nombre de tables', 'Nombre de chaises', rng.int(4, 8)]]);
      tg = a; td = b; gauche = rng.shuffle(range(1, 9)).slice(0, 4).sort((x, y) => x - y); droite = gauche.map((x) => x * k);
      expl = `Vrai : on passe toujours de gauche à droite en multipliant par ${k}. Quand une grandeur double, l'autre double aussi.`;
    } else {
      const ctx = rng.pick([
        () => { const d = rng.int(2, 6); return [`Âge de ${P.n}`, 'Âge de son frère', (x) => x + d, `l'écart d'âge reste toujours ${d} ans (on ajoute ${d})`, 2]; },
        () => { const d = rng.int(2, 5); return ['Nombre d\'invités', 'Nombre de chaises', (x) => x + d, `on ajoute toujours ${d} chaises (+ ${d}), on ne multiplie pas`, 2]; },
        () => { const f = rng.int(2, 6); const c = rng.pick([3, 4, 5]); return ['Nombre de places', 'Prix avec frais (€)', (x) => f * x + c, `il y a ${c} € de frais fixes en plus du prix des places`, 1]; },
        () => { const e = rng.int(2, 6); const dep = rng.pick([5, 8, 10, 12, 15]); return ['Nombre de semaines', 'Argent dans la tirelire (€)', (x) => dep + e * x, `la tirelire contenait déjà ${dep} € au départ (on ajoute ${e} € par semaine à ces ${dep} €)`, 1]; },
      ])();
      tg = ctx[0]; td = ctx[1];
      gauche = rng.shuffle(range(ctx[4], 12)).slice(0, 4).sort((x, y) => x - y); droite = gauche.map(ctx[2]);
      expl = `Faux : ${ctx[3]}. Par exemple, ${gauche[0]} donne ${droite[0]}, mais le double, ${2 * gauche[0]}, ne donne pas ${2 * droite[0]}.`;
    }
    return {
      type: 'vrai_faux', reponse: prop, difficulte: 3,
      enonce: 'Vrai ou faux ? Ce graphe fléché représente une situation de proportionnalité.',
      cle: `${tg}|${gauche.join(',')}|${droite.join(',')}`,
      figure: figureDeuxEnsembles(gauche.map(fmt), droite.map(fmt), gauche.map((_, i) => [i, i]), { titreG: tg, titreD: td }),
      explication: expl,
    };
  }, 2),
  // Relation dans un seul ensemble : compter les flèches ou trouver celle qui manque.
  forme((rng) => {
    const R = rng.pick(RELATIONS);
    for (let essai = 0; essai < 30; essai++) {
      const k = rng.int(5, 6);
      const base = rng.shuffle(range(1, R.txt.includes('10 fois') ? 9 : 30)).slice(0, 3);
      const autres = base.map((x) => (R.ok(2 * x, x) ? 2 * x : R.ok(3 * x, x) ? 3 * x : R.ok(x + 5, x) ? x + 5 : R.ok(x, 2 * x) ? 2 * x : R.ok(x, x + 10) ? x + 10 : 10 * x));
      const nombres = rng.shuffle([...new Set([...base, ...autres, ...rng.shuffle(range(1, 60)).slice(0, 3)])]).slice(0, k);
      const liens = [];
      nombres.forEach((x, i) => nombres.forEach((y, j) => { if (i !== j && R.ok(x, y)) liens.push([i, j]); }));
      if (liens.length < 2 || liens.length > 4) continue;
      const couples = liens.map(([i, j]) => `${fmt(nombres[i])} → ${fmt(nombres[j])}`);
      if (rng.next() < 0.5) {
        return {
          type: 'numerique', difficulte: 3,
          enonce: `Dans cet ensemble, on veut tracer une flèche de x vers y quand « x ${R.txt} y ». Combien de flèches faut-il tracer ?`,
          cle: `${R.txt}|${nombres.join(',')}`,
          figure: figureUnEnsemble(nombres, [], `x → y : « x ${R.txt} y »`),
          reponse: liens.length,
          explication: `On teste chaque nombre avec tous les autres. Les flèches sont : ${couples.join(' ; ')}. Il y en a ${liens.length}.`,
        };
      }
      const manque = rng.int(0, liens.length - 1);
      const faux = [];
      nombres.forEach((x, i) => nombres.forEach((y, j) => { if (i !== j && !R.ok(x, y)) faux.push(`${fmt(x)} → ${fmt(y)}`); }));
      const inverses = liens.map(([i, j]) => `${fmt(nombres[j])} → ${fmt(nombres[i])}`).filter((t) => faux.includes(t));
      const c = qcm(rng, couples[manque], [...rng.shuffle(inverses).slice(0, 1), ...rng.shuffle(faux)]);
      if (!c) continue;
      return {
        ...c, difficulte: 3,
        enonce: `Dans ce graphe, une flèche de x vers y veut dire « x ${R.txt} y ». Il manque une flèche. Laquelle ?`,
        cle: `${R.txt}|${nombres.join(',')}|${manque}`,
        figure: figureUnEnsemble(nombres, liens.filter((_, i) => i !== manque), `x → y : « x ${R.txt} y »`),
        explication: `${couples[manque]} : ${fmt(nombres[liens[manque][0]])} ${R.txt} ${fmt(nombres[liens[manque][1]])}. Attention au sens de la flèche : elle part de x et arrive sur y.`,
      };
    }
    return null;
  }, 2),
  // Une flèche est fausse.
  forme((rng) => {
    const { op, gauche } = operateurAuHasard(rng);
    const droite = gauche.map(op.f);
    const faux = rng.int(0, 3);
    const d2 = droite.slice(); d2[faux] = droite[faux] + rng.pick([-10, -2, -1, 1, 2, 10, droite[faux]]);
    if (d2[faux] <= 0 || new Set(d2).size < 4 || gauche.some((x, i) => i !== faux && op.f(x) !== d2[i])) return null;
    const textes = gauche.map((x, i) => `${fmt(x)} → ${fmt(d2[i])}`);
    const c = { type: 'qcm', choix: textes, reponse: faux };
    return {
      ...c, difficulte: 2,
      enonce: `Dans ce graphe fléché, chaque flèche veut dire « ${op.txt} ». Une flèche est fausse. Laquelle ?`,
      cle: `${op.txt}|${textes.join(',')}`,
      figure: figureDeuxEnsembles(gauche.map(fmt), d2.map(fmt), gauche.map((_, i) => [i, i]), { op: op.txt }),
      explication: `${fmt(gauche[faux])} ${op.txt} = ${fmt(droite[faux])}, et pas ${fmt(d2[faux])}. Les autres flèches sont justes : ${gauche.filter((_, i) => i !== faux).map((x) => `${fmt(x)} ${op.txt} = ${fmt(op.f(x))}`).join(' ; ')}.`,
    };
  }),
]);

// ===========================================================================
// 13. Solides : faces, arêtes, sommets, faces parallèles ; assemblages de cubes
// ===========================================================================
const NOMS_BASES = { 3: ['triangulaire', 'triangle'], 4: ['carrée', 'carré'], 5: ['pentagonale', 'pentagone'], 6: ['hexagonale', 'hexagone'], 8: ['octogonale', 'octogone'] };
function prismeOuPyramide(sorte, n, R, H, rot) {
  const base = range(0, n - 1).map((i) => { const a = rot + (2 * Math.PI * i) / n; return [R * Math.cos(a), 0, R * Math.sin(a)]; });
  if (sorte === 'pyramide') {
    return { S: [...base, [0, H, 0]], F: [range(0, n - 1), ...range(0, n - 1).map((i) => [i, (i + 1) % n, n])] };
  }
  const haut = base.map(([x, , z]) => [x, H, z]);
  return { S: [...base, ...haut], F: [range(0, n - 1), range(n, 2 * n - 1), ...range(0, n - 1).map((i) => [i, (i + 1) % n, n + (i + 1) % n, n + i])] };
}
// Projection orthogonale (lacet puis tangage) ; faces visibles = normale tournée vers l'observateur.
function figureSolide(S, F, { lacet = 0.5, tangage = 0.45, W = 320, H = 240, etiquettes = null, fill = COUL.bleu, ecartMin = 0 } = {}) {
  const tourne = ([x, y, z]) => {
    const x1 = x * Math.cos(lacet) + z * Math.sin(lacet); const z1 = -x * Math.sin(lacet) + z * Math.cos(lacet);
    return [x1, y * Math.cos(tangage) - z1 * Math.sin(tangage), y * Math.sin(tangage) + z1 * Math.cos(tangage)];
  };
  const T = S.map(tourne);
  const centre = T.reduce((s, p) => [s[0] + p[0] / T.length, s[1] + p[1] / T.length, s[2] + p[2] / T.length], [0, 0, 0]);
  const visible = F.map((f) => {
    const [a, b, c] = [T[f[0]], T[f[1]], T[f[2]]];
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let nz = u[0] * v[1] - u[1] * v[0];
    const nrm = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], nz];
    const m = f.reduce((s, i) => [s[0] + T[i][0] / f.length, s[1] + T[i][1] / f.length, s[2] + T[i][2] / f.length], [0, 0, 0]);
    if (nrm[0] * (m[0] - centre[0]) + nrm[1] * (m[1] - centre[1]) + nrm[2] * (m[2] - centre[2]) < 0) nz = -nz;
    return nz > 1e-6;
  });
  const xs = T.map((p) => p[0]); const ys = T.map((p) => -p[1]);
  const marge = etiquettes ? 34 : 22;
  const s = Math.min((W - 2 * marge) / (Math.max(...xs) - Math.min(...xs)), (H - 2 * marge) / (Math.max(...ys) - Math.min(...ys)));
  const ox = (W - (Math.max(...xs) - Math.min(...xs)) * s) / 2 - Math.min(...xs) * s; const oy = (H - (Math.max(...ys) - Math.min(...ys)) * s) / 2 - Math.min(...ys) * s;
  const E = (p) => [ox + p[0] * s, oy - p[1] * s];
  // Deux sommets trop proches à l'écran (un sommet caché derrière un autre) : dessin refusé.
  if (ecartMin) { const Q = T.map(E); for (let i = 0; i < Q.length; i++) for (let j = i + 1; j < Q.length; j++) if (Math.hypot(Q[i][0] - Q[j][0], Q[i][1] - Q[j][1]) < ecartMin) return null; }
  const aretes = new Map();
  F.forEach((f, k) => f.forEach((i, t) => { const j = f[(t + 1) % f.length]; const cle = i < j ? `${i}-${j}` : `${j}-${i}`; aretes.set(cle, (aretes.get(cle) || false) || visible[k]); }));
  let out = '';
  F.forEach((f, k) => { if (visible[k]) out += polySvg(f.map((i) => E(T[i])), { fill, sw: 0 }); });
  for (const [cle, vis] of aretes) { if (!vis) { const [i, j] = cle.split('-').map(Number); out += ligneSvg(E(T[i]), E(T[j]), { sw: 1.4, dash: '5 4', stroke: COUL.doux }); } }
  for (const [cle, vis] of aretes) { if (vis) { const [i, j] = cle.split('-').map(Number); out += ligneSvg(E(T[i]), E(T[j]), { sw: 2 }); } }
  if (etiquettes) {
    // Chaque étiquette est placée autour de son sommet, là où elle est le plus loin des arêtes et des autres étiquettes
    // (un sommet caché ou le sommet de devant ne doit pas avoir son nom posé sur une arête).
    const segs = [...aretes.keys()].map((cle) => cle.split('-').map((i) => E(T[+i])));
    const distSeg = (q, [a, b]) => { const dx = b[0] - a[0]; const dy = b[1] - a[1]; const t = Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(q[0] - a[0] - t * dx, q[1] - a[1] - t * dy); };
    const poses = [];
    T.forEach((p, i) => {
      const q = E(p); let best = null;
      for (let k = 0; k < 16; k++) {
        const a = (2 * Math.PI * k) / 16; const c = [q[0] + Math.cos(a) * 15, q[1] + Math.sin(a) * 15];
        if (c[0] < 8 || c[0] > W - 8 || c[1] < 10 || c[1] > H - 6) continue;
        const sc = Math.min(...segs.map((sg) => distSeg(c, sg)), ...poses.map((o) => Math.hypot(c[0] - o[0], c[1] - o[1]) / 2));
        if (!best || sc > best[0]) best = [sc, c];
      }
      poses.push(best[1]);
      out += texteSvg(best[1][0], best[1][1], etiquettes[i], { size: 14, bold: true, halo: true });
    });
  }
  return svg(W, H, out);
}
const formules = (sorte, n) => (sorte === 'prisme'
  ? { faces: n + 2, aretes: 3 * n, sommets: 2 * n, x: `Un prisme dont la base a ${n} côtés : 2 bases + ${n} faces latérales = ${n + 2} faces ; ${n} arêtes en bas, ${n} en haut et ${n} verticales = ${3 * n} arêtes ; ${n} sommets en bas et ${n} en haut = ${2 * n} sommets.` }
  : { faces: n + 1, aretes: 2 * n, sommets: n + 1, x: `Une pyramide dont la base a ${n} côtés : 1 base + ${n} faces triangulaires = ${n + 1} faces ; ${n} arêtes autour de la base + ${n} qui montent au sommet = ${2 * n} arêtes ; ${n} sommets de la base + le sommet du haut = ${n + 1} sommets.` });
function solideAuHasard(rng, ns = [3, 4, 5, 6, 8]) {
  const sorte = rng.pick(['prisme', 'pyramide']); const n = rng.pick(ns);
  const R = 1; const H = decimal(rng, sorte === 'prisme' ? 0.9 : 1.2, 2.2, 1);
  if (sorte === 'prisme' && Math.abs(H - 2 * Math.sin(Math.PI / n)) < 0.3) return solideAuHasard(rng, ns); // faces latérales bien rectangulaires (pas carrées)
  const rot = rng.int(0, 11) * Math.PI / 36 + (n === 4 ? Math.PI / 4 : 0.1);
  const lacet = rng.int(-6, 6) * 0.05; const tangage = decimal(rng, 0.32, 0.6, 2);
  const { S, F } = prismeOuPyramide(sorte, n, R, H, rot);
  const figure = figureSolide(S, F, { lacet, tangage, fill: rng.pick(FONDS), ecartMin: 16 });
  if (!figure) return solideAuHasard(rng, ns);
  return { sorte, n, H, figure, cle: `${sorte}|${n}` };
}
const nomSolide = (sorte, n) => `${sorte === 'prisme' ? 'le prisme droit' : 'la pyramide'} à base ${NOMS_BASES[n][0]}`;

// Assemblages de cubes en perspective (cavalière isométrique). h[y][x] = hauteur de la colonne.
function figureCubes(h, { W = 320, H = 220, s = 30 } = {}) {
  const c = Math.cos(Math.PI / 6) * s;
  const cubes = [];
  h.forEach((ligne, y) => ligne.forEach((k, x) => { for (let z = 0; z < k; z++) cubes.push([x, y, z]); }));
  cubes.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]) || a[2] - b[2]);
  const P = ([x, y, z]) => [(x - y) * c, (x + y) * s / 2 - z * s];
  const tous = cubes.flatMap(([x, y, z]) => [P([x, y, z + 1]), P([x + 1, y + 1, z]), P([x + 1, y, z]), P([x, y + 1, z])]);
  const minX = Math.min(...tous.map((p) => p[0])); const maxX = Math.max(...tous.map((p) => p[0]));
  const minY = Math.min(...tous.map((p) => p[1])); const maxY = Math.max(...tous.map((p) => p[1]));
  const ox = (W - (maxX - minX)) / 2 - minX; const oy = (H - (maxY - minY)) / 2 - minY;
  const Q = (p) => { const [a, b] = P(p); return [a + ox, b + oy]; };
  let out = '';
  for (const [x, y, z] of cubes) {
    out += polySvg([Q([x, y, z + 1]), Q([x + 1, y, z + 1]), Q([x + 1, y + 1, z + 1]), Q([x, y + 1, z + 1])], { fill: '#fff4c2', sw: 1.6 });
    out += polySvg([Q([x + 1, y, z]), Q([x + 1, y + 1, z]), Q([x + 1, y + 1, z + 1]), Q([x + 1, y, z + 1])], { fill: '#9cc3f5', sw: 1.6 });
    out += polySvg([Q([x, y + 1, z]), Q([x + 1, y + 1, z]), Q([x + 1, y + 1, z + 1]), Q([x, y + 1, z + 1])], { fill: '#5d8fd8', sw: 1.6 });
  }
  return { out, W, H };
}
// Hauteurs « en escalier » (jamais plus haut devant que derrière) : tous les cubes du dessus sont visibles.
function hauteursEscalier(rng, nx, ny, hmax, total) {
  for (let essai = 0; essai < 300; essai++) {
    const h = range(0, ny - 1).map(() => range(0, nx - 1).map(() => 0));
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const lim = Math.min(hmax, y ? h[y - 1][x] : hmax, x ? h[y][x - 1] : hmax);
        h[y][x] = rng.int(0, lim);
      }
    }
    const n = h.flat().reduce((a, b) => a + b, 0);
    if (n < total[0] || n > total[1] || !h[0][0]) continue;
    // assemblage d'un seul tenant (vue de dessus connexe)
    const cases = []; h.forEach((l, y) => l.forEach((k, x) => { if (k) cases.push([x, y]); }));
    const set = new Set(cases.map((p) => p.join())); const vu = new Set(['0,0']); const file = [[0, 0]];
    while (file.length) { const [x, y] = file.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = `${x + dx},${y + dy}`; if (set.has(k) && !vu.has(k)) { vu.add(k); file.push([x + dx, y + dy]); } } }
    if (vu.size !== cases.length) continue;
    return { h, n, cases };
  }
  return null;
}
function polyominoAuHasard(rng, k) {
  const cases = [[0, 0]]; const set = new Set(['0,0']);
  while (cases.length < k) {
    const [x, y] = rng.pick(cases); const [dx, dy] = rng.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    const key = `${x + dx},${y + dy}`;
    if (!set.has(key)) { set.add(key); cases.push([x + dx, y + dy]); }
  }
  return normaliserCases(cases);
}

const solidesFaces = famille([
  // Compter faces, arêtes, sommets sur un dessin.
  forme((rng) => {
    const sol = solideAuHasard(rng);
    const F = formules(sol.sorte, sol.n);
    const quoi = rng.pick(['faces', 'aretes', 'sommets']);
    return {
      type: 'numerique', difficulte: quoi === 'faces' ? 2 : 3,
      enonce: `Combien ${quoi === 'aretes' ? "d'arêtes" : `de ${quoi}`} a ce solide ? (Les traits en pointillé sont les arêtes cachées.)`,
      cle: sol.cle, figure: sol.figure, reponse: F[quoi],
      explication: F.x,
    };
  }, 3),
  // Nommer le solide dessiné.
  forme((rng) => {
    const sol = solideAuHasard(rng, [3, 5, 6, 8]);
    const bonne = majuscule(nomSolide(sol.sorte, sol.n));
    const autre = sol.sorte === 'prisme' ? 'pyramide' : 'prisme';
    const fausses = [nomSolide(autre, sol.n), ...[3, 5, 6, 8].filter((m) => m !== sol.n).map((m) => nomSolide(sol.sorte, m)), ...[3, 5, 6, 8].filter((m) => m !== sol.n).map((m) => nomSolide(autre, m))].map(majuscule);
    const c = qcm(rng, bonne, [fausses[0], ...rng.shuffle(fausses.slice(1))]);
    return {
      ...c, difficulte: 2,
      enonce: 'Comment s\'appelle ce solide ?',
      cle: sol.cle, figure: sol.figure,
      explication: `${sol.sorte === 'prisme' ? 'Il a deux bases identiques et parallèles reliées par des rectangles : c\'est un prisme droit.' : 'Toutes les faces latérales sont des triangles qui se rejoignent en un même sommet : c\'est une pyramide.'} Sa base a ${sol.n} côtés : c'est un ${NOMS_BASES[sol.n][1]}. ${bonne}.`,
    };
  }, 2),
  // Forme et nombre de faces d'une sorte donnée.
  forme((rng) => {
    const sol = solideAuHasard(rng, [3, 5, 6, 8]);
    const lat = sol.sorte === 'prisme' ? 'des rectangles' : 'des triangles';
    if (rng.next() < 0.5) {
      const c = qcm(rng, lat, ['des rectangles', 'des triangles', `des ${NOMS_BASES[sol.n][1]}s`, 'des trapèzes', 'des losanges']);
      return {
        ...c, difficulte: 2,
        enonce: 'Quelle est la forme des faces latérales de ce solide (les faces qui ne sont pas des bases) ?',
        cle: sol.cle, figure: sol.figure,
        explication: sol.sorte === 'prisme' ? `Dans un prisme droit, les faces latérales sont des rectangles ; les deux bases sont des ${NOMS_BASES[sol.n][1]}s.` : `Dans une pyramide, les faces latérales sont des triangles qui se rejoignent au sommet ; la base est un ${NOMS_BASES[sol.n][1]}.`,
      };
    }
    const forme = rng.pick(['triangles', 'rectangles']);
    const nb = sol.sorte === 'prisme' ? (forme === 'rectangles' ? sol.n : sol.n === 3 ? 2 : 0) : (forme === 'triangles' ? sol.n + (sol.n === 3 ? 1 : 0) : 0);
    return {
      type: 'numerique', difficulte: 3,
      enonce: `Combien de faces de ce solide sont des ${forme} ?`,
      cle: `${sol.cle}|${forme}`, figure: sol.figure, reponse: nb,
      explication: `${majuscule(nomSolide(sol.sorte, sol.n))} a ${sol.sorte === 'prisme' ? `2 bases (des ${NOMS_BASES[sol.n][1]}s) et ${sol.n} faces latérales rectangulaires` : `1 base (un ${NOMS_BASES[sol.n][1]}) et ${sol.n} faces latérales triangulaires`}. ${nb ? `Il y a donc ${nb} ${forme}.` : `Aucune face n'est donc un ${forme.slice(0, -1)} : la réponse est 0.`}`,
    };
  }, 2),
  // Pavé droit nommé : faces parallèles, perpendiculaires, isométriques.
  forme((rng) => {
    const L = rng.pick(['ABCDEFGH', 'IJKLMNOP', 'MNOPQRST', 'QRSTUVWX', 'EFGHIJKL']);
    const [a, b, c] = rng.shuffle([decimal(rng, 1, 1.4, 1), decimal(rng, 1.6, 2.2, 1), decimal(rng, 2.5, 3.4, 1)]);
    const S = [[0, 0, 0], [a, 0, 0], [a, 0, b], [0, 0, b], [0, c, 0], [a, c, 0], [a, c, b], [0, c, b]].map(([x, y, z]) => [x - a / 2, y, z - b / 2]);
    // Faces nommées en tournant : bas ABCD, haut EFGH, puis les 4 faces latérales.
    const FACES = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
    const OPP = [1, 0, 4, 5, 2, 3];
    const nom = (f) => FACES[f].map((i) => L[i]).join('');
    const f = rng.int(0, 5);
    const lacet = decimal(rng, -0.75, -0.35, 2) + rng.pick([0, Math.PI / 2]); const tangage = decimal(rng, 0.35, 0.55, 2);
    const figure = figureSolide(S, FACES, { lacet, tangage, etiquettes: L.split(''), fill: COUL.jaune, ecartMin: 45 });
    if (!figure) return null;
    const cle = `${L}|${a},${b},${c}|${lacet.toFixed(2)}|${tangage}`;
    const t = rng.pick(['parallele', 'parallele', 'iso', 'pasPerp', 'perp']);
    if (t === 'perp') {
      return {
        type: 'numerique', difficulte: 2,
        enonce: `Combien de faces de ce pavé droit sont perpendiculaires à la face ${nom(f)} ?`,
        cle: `${cle}|${f}|perp`, figure, reponse: 4,
        explication: `Dans un pavé droit, chaque face est parallèle à la face opposée (${nom(OPP[f])}) et perpendiculaire aux 4 autres faces.`,
      };
    }
    const autres = range(0, 5).filter((x) => x !== f && x !== OPP[f]).map(nom);
    const q = qcm(rng, nom(OPP[f]), rng.shuffle(autres));
    const enonce = {
      parallele: `Quelle face de ce pavé droit est parallèle à la face ${nom(f)} ?`,
      iso: `Les arêtes de ce pavé droit ont trois longueurs différentes. Quelle face est isométrique à la face ${nom(f)} (même forme et mêmes dimensions) ?`,
      pasPerp: `Quelle face de ce pavé droit n'est PAS perpendiculaire à la face ${nom(f)} ?`,
    }[t];
    return {
      ...q, difficulte: t === 'parallele' ? 2 : 3,
      enonce, cle: `${cle}|${f}|${t}`, figure,
      explication: `La face ${nom(OPP[f])} est la face opposée à ${nom(f)} : elles sont parallèles et isométriques. Les 4 autres faces (${enumerer(autres)}) sont perpendiculaires à ${nom(f)}.`,
    };
  }, 2),
  // Compter les cubes d'un assemblage.
  forme((rng) => {
    const nx = rng.int(2, 3); const ny = rng.int(2, 3);
    const a = hauteursEscalier(rng, nx, ny, 3, [4, 14]);
    if (!a) return null;
    const { out, W, H } = figureCubes(a.h);
    const petit = nx === 2 && ny === 2 && Math.max(...a.h.flat()) <= 2;
    const grand = rng.next() < 0.3 ? rng.pick([petit ? 8 : 27, 27].filter((g) => g > a.n)) : null;
    const detail = a.h.flatMap((l) => l.filter((k) => k > 0)).join(' + ');
    return {
      type: 'numerique', difficulte: grand ? 3 : 2, fiche: 'ma-assemblages-cubes',
      enonce: grand
        ? `Combien de petits cubes faut-il ajouter à cet assemblage pour obtenir un grand cube de ${grand === 8 ? '2 × 2 × 2' : '3 × 3 × 3'} cubes ? (Chaque cube est posé sur la table ou sur un autre cube.)`
        : 'Combien de petits cubes forment cet assemblage ? (Chaque cube est posé sur la table ou sur un autre cube : certains sont cachés.)',
      cle: `${JSON.stringify(a.h)}|${grand}`,
      figure: svg(W, H, out),
      reponse: grand ? grand - a.n : a.n,
      explication: `On compte colonne par colonne : chaque colonne contient autant de cubes que sa hauteur, même si les cubes du dessous sont cachés. ${detail} = ${a.n} cubes.${grand ? ` Le grand cube en a ${grand === 8 ? '2 × 2 × 2' : '3 × 3 × 3'} = ${grand} : il faut en ajouter ${grand} − ${a.n} = ${grand - a.n}.` : ''}`,
    };
  }, 2),
  // Vue de dessus d'un assemblage d'au plus 5 cubes.
  forme((rng) => {
    const a = hauteursEscalier(rng, 3, 3, 3, [3, 5]);
    if (!a || a.cases.length < 3) return null;
    const vue = normaliserCases(a.cases);
    const can = canonique(vue);
    const fausses = []; const vus = new Set([can]);
    for (let essai = 0; essai < 60 && fausses.length < 3; essai++) {
      const p = polyominoAuHasard(rng, Math.max(2, vue.length + rng.pick([-1, 0, 0, 1])));
      const cp = canonique(p);
      if (vus.has(cp) || Math.max(...p.map((x) => x[0])) > 3 || Math.max(...p.map((x) => x[1])) > 3) continue;
      vus.add(cp); fausses.push(orienter(p, rng.int(0, 7)));
    }
    if (fausses.length < 3) return null;
    const liste = rng.shuffle([vue, ...fausses]);
    const idx = liste.indexOf(vue);
    const { out } = figureCubes(a.h, { W: 360, H: 180, s: 30 });
    let s2 = `<g>${out}</g>`;
    liste.forEach((cells, k) => {
      const px = 10 + k * 87; const py = 190;
      const w = Math.max(...cells.map((c) => c[0])) + 1; const h2 = Math.max(...cells.map((c) => c[1])) + 1;
      const u = Math.min(60 / w, 60 / h2, 20);
      s2 += texteSvg(px + 10, py + 12, 'ABCD'[k], { size: 16, bold: true });
      s2 += dessinCases(cells, px + 22 + (60 - w * u) / 2, py + 22 + (60 - h2 * u) / 2, u, '#fff4c2');
    });
    return {
      type: 'qcm', choix: ['A', 'B', 'C', 'D'], reponse: idx, difficulte: 3, fiche: 'ma-assemblages-cubes',
      enonce: 'Quel dessin montre cet assemblage de cubes vu de dessus ?',
      cle: `${JSON.stringify(a.h)}|${liste.map(cleCases).join('/')}`,
      figure: svg(360, 290, s2),
      explication: `Vu de dessus, on voit une case pour chaque colonne de cubes, quelle que soit sa hauteur : ${vue.length} cases. C'est le dessin ${'ABCD'[idx]} (il peut être tourné). Les autres dessins n'ont pas la bonne forme.`,
    };
  }, 2),
]);

// ===========================================================================
// 14. Symboles et codage géométriques : A, a, [AB], //, ⊥, angle droit, longueurs égales
// ===========================================================================
const LETTRES_PTS = 'ABCDEFGHIJKLMNPRSTUVWXYZ';
const LETTRES_DR = 'abcdefghkmnprstuvw';
const deuxLettres = (rng, lettres, n = 2) => rng.shuffle(lettres.split('')).slice(0, n);
// Petits traits de codage au milieu d'un segment (k traits).
function codage(P, Q, k) {
  const m = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2]; const L = Math.hypot(Q[0] - P[0], Q[1] - P[1]);
  const u = [(Q[0] - P[0]) / L, (Q[1] - P[1]) / L]; const nrm = [-u[1], u[0]];
  let s = '';
  for (let i = 0; i < k; i++) {
    const o = (i - (k - 1) / 2) * 6; const c = [m[0] + u[0] * o, m[1] + u[1] * o];
    s += ligneSvg([c[0] - nrm[0] * 7 - u[0] * 2, c[1] - nrm[1] * 7 - u[1] * 2], [c[0] + nrm[0] * 7 + u[0] * 2, c[1] + nrm[1] * 7 + u[1] * 2], { sw: 2 });
  }
  return s;
}
// Carré d'angle droit au sommet P du polygone (voisins A et B).
function coinDroit(P, A, B, t = 11) {
  const ua = [(A[0] - P[0]) / Math.hypot(A[0] - P[0], A[1] - P[1]), (A[1] - P[1]) / Math.hypot(A[0] - P[0], A[1] - P[1])];
  const ub = [(B[0] - P[0]) / Math.hypot(B[0] - P[0], B[1] - P[1]), (B[1] - P[1]) / Math.hypot(B[0] - P[0], B[1] - P[1])];
  return angleDroitSvg(P, ua, ub, t);
}
const tourner = (P, a, c) => P.map(([x, y]) => [c[0] + (x - c[0]) * Math.cos(a) - (y - c[1]) * Math.sin(a), c[1] + (x - c[0]) * Math.sin(a) + (y - c[1]) * Math.cos(a)]);
function figurePolygoneCode(P, noms, codes, droits, fill) {
  const c = P.reduce((s, p) => [s[0] + p[0] / P.length, s[1] + p[1] / P.length], [0, 0]);
  let s = polySvg(P, { fill, sw: 2 });
  P.forEach((p, i) => { const q = P[(i + 1) % P.length]; if (codes[i]) s += codage(p, q, codes[i]); });
  droits.forEach((i) => { s += coinDroit(P[i], P[(i + P.length - 1) % P.length], P[(i + 1) % P.length]); });
  P.forEach((p, i) => { const d = Math.hypot(p[0] - c[0], p[1] - c[1]) || 1; s += texteSvg(p[0] + (p[0] - c[0]) / d * 16, p[1] + (p[1] - c[1]) / d * 16, noms[i], { size: 15, bold: true }); });
  return s;
}
// Cadre une liste de points dans W × H (garde les proportions).
function cadrer(P, W, H, marge) {
  const xs = P.map((p) => p[0]); const ys = P.map((p) => p[1]);
  const s = Math.min((W - 2 * marge) / (Math.max(...xs) - Math.min(...xs)), (H - 2 * marge) / (Math.max(...ys) - Math.min(...ys)));
  const ox = (W - (Math.max(...xs) - Math.min(...xs)) * s) / 2 - Math.min(...xs) * s; const oy = (H - (Math.max(...ys) - Math.min(...ys)) * s) / 2 - Math.min(...ys) * s;
  return P.map(([x, y]) => [ox + x * s, oy + y * s]);
}
const TRIANGLES_CODES = [
  { nom: 'équilatéral', pts: (r1) => [[0, 0], [10, 0], [5, -8.66]], codes: [1, 1, 1], droits: [], expl: 'Les trois côtés portent le même codage : ils ont la même longueur. C\'est un triangle équilatéral (il est aussi isocèle, mais « équilatéral » est plus précis).', exclus: ['isocèle'] },
  { nom: 'isocèle', pts: (r1) => [[0, 0], [10, 0], [5, -(r1 < 0.5 ? 6 + r1 * 1.6 : 11 + (r1 - 0.5) * 6)]], codes: [0, 1, 1], droits: [], expl: 'Deux côtés seulement portent le même codage : c\'est un triangle isocèle.', exclus: [] },
  { nom: 'rectangle', pts: (r1) => [[0, 0], [10, 0], [0, -(4 + r1 * 3)]], codes: [0, 0, 0], droits: [0], expl: 'Le petit carré indique un angle droit, et aucun codage n\'indique deux côtés de même longueur : c\'est un triangle rectangle.', exclus: ['scalène'] }, // un triangle rectangle est souvent aussi scalène : distracteur défendable
  { nom: 'rectangle isocèle', pts: () => [[0, 0], [10, 0], [0, -10]], codes: [1, 0, 1], droits: [0], expl: 'Un angle droit (petit carré) et deux côtés de même longueur (même codage) : c\'est un triangle rectangle isocèle.', exclus: ['rectangle', 'isocèle'] },
  { nom: 'scalène', pts: (r1) => [[0, 0], [10, 0], [2.5 + r1 * 2, -(5 + r1 * 3)]], codes: [1, 2, 3], droits: [], expl: 'Les trois côtés ont des codages différents : leurs longueurs sont toutes différentes. C\'est un triangle scalène.', exclus: [] },
];
const QUADS_CODES = [
  { nom: 'carré', pts: () => [[0, 0], [8, 0], [8, -8], [0, -8]], codes: [1, 1, 1, 1], droits: [0, 1, 2, 3], expl: 'Quatre côtés de même longueur et quatre angles droits : c\'est un carré (le nom le plus précis).' },
  { nom: 'rectangle', pts: (r1) => [[0, 0], [11, 0], [11, -(5 + r1 * 2)], [0, -(5 + r1 * 2)]], codes: [1, 2, 1, 2], droits: [0, 1, 2, 3], expl: 'Quatre angles droits et des côtés opposés de même longueur (deux codages différents) : c\'est un rectangle.' },
  { nom: 'losange', pts: (r1) => [[0, 0], [3 + r1, -5], [6 + 2 * r1, 0], [3 + r1, 5]], codes: [1, 1, 1, 1], droits: [], expl: 'Quatre côtés de même longueur, mais pas d\'angle droit : c\'est un losange.' },
  { nom: 'parallélogramme', pts: (r1) => [[0, 0], [10, 0], [12 + r1 * 2, -6], [2 + r1 * 2, -6]], codes: [1, 2, 1, 2], droits: [], expl: 'Les côtés opposés ont deux à deux la même longueur, sans angle droit : c\'est un parallélogramme.' },
];

const symbolesGeo = famille([
  // Sens des symboles (sans figure).
  forme((rng) => {
    const [A, B] = deuxLettres(rng, LETTRES_PTS); const [d, e] = deuxLettres(rng, LETTRES_DR);
    const cas = rng.pick([
      { e: `Que désigne l'écriture [${A}${B}] ?`, b: `Le segment dont les extrémités sont les points ${A} et ${B}`, f: [`La droite qui passe par les points ${A} et ${B}`, `La demi-droite d'origine ${A} qui passe par ${B}`, `La longueur du segment qui relie ${A} et ${B}`], x: `[${A}${B}] désigne le segment d'extrémités ${A} et ${B} : les crochets montrent que le trait s'arrête en ${A} et en ${B}.` },
      { e: `Que signifie l'écriture ${d} // ${e} ?`, b: `La droite ${d} est parallèle à la droite ${e}.`, f: [`La droite ${d} est perpendiculaire à la droite ${e}.`, `Les droites ${d} et ${e} se coupent.`, `Les droites ${d} et ${e} sont confondues.`], x: 'Le symbole // signifie « est parallèle à » : les deux droites ont la même direction et ne se coupent jamais.' },
      { e: `Que signifie l'écriture ${d} ⊥ ${e} ?`, b: `La droite ${d} est perpendiculaire à la droite ${e}.`, f: [`La droite ${d} est parallèle à la droite ${e}.`, `Les droites ${d} et ${e} se coupent, sans former d'angle droit.`, `Les droites ${d} et ${e} sont confondues.`], x: 'Le symbole ⊥ signifie « est perpendiculaire à » : les deux droites se coupent en formant un angle droit.' },
      { e: `Comment écrit-on « la droite ${d} est parallèle à la droite ${e} » ?`, b: `${d} // ${e}`, f: [`${d} ⊥ ${e}`, `[${d}${e}]`, `${d} = ${e}`], x: '« Est parallèle à » s\'écrit avec le symbole //.' },
      { e: `Comment écrit-on « la droite ${d} est perpendiculaire à la droite ${e} » ?`, b: `${d} ⊥ ${e}`, f: [`${d} // ${e}`, `[${d}${e}]`, `${d} = ${e}`], x: '« Est perpendiculaire à » s\'écrit avec le symbole ⊥.' },
      { e: `Comment écrit-on « le segment d'extrémités ${A} et ${B} » ?`, b: `[${A}${B}]`, f: [`(${A}${B})`, `[${A}${B})`, `${A}${B}`], x: `Un segment s'écrit avec des crochets et les noms de ses deux extrémités : [${A}${B}].` },
      { e: `Sur une figure, on lit « ${A} » et « ${d} ». Que désignent-ils ?`, b: `${A} est un point et ${d} est une droite.`, f: [`${A} est une droite et ${d} est un point.`, `${A} et ${d} sont deux points.`, `${A} et ${d} sont deux droites.`], x: 'On nomme un point par une lettre majuscule (A) et une droite par une lettre minuscule (a).' },
    ]);
    return { ...qcm(rng, cas.b, cas.f), difficulte: 1, enonce: cas.e, explication: cas.x };
  }, 2),
  // Droites parallèles et perpendiculaires sur une figure.
  forme((rng) => {
    const [a, b, c, d] = deuxLettres(rng, LETTRES_DR, 4);
    const W = 340; const H = 240; const ctr = [W / 2, H / 2];
    const th = rng.int(0, 35) * 5 * Math.PI / 180; const u = [Math.cos(th), Math.sin(th)]; const nv = [-u[1], u[0]];
    const ecart = rng.int(55, 85); const decal = rng.int(-40, 40);
    const phi = th + rng.pick([1, -1]) * rng.int(30, 60) * Math.PI / 180; const w = [Math.cos(phi), Math.sin(phi)];
    const pA = [ctr[0] - nv[0] * ecart / 2, ctr[1] - nv[1] * ecart / 2]; const pB = [ctr[0] + nv[0] * ecart / 2, ctr[1] + nv[1] * ecart / 2];
    const pC = [ctr[0] + u[0] * decal, ctr[1] + u[1] * decal]; const offD = decal + rng.pick([-1, 1]) * rng.int(45, 70); const pD = [ctr[0] + u[0] * offD, ctr[1] + u[1] * offD];
    const droite = (p, v, nom) => {
      const t = 300; const A1 = [p[0] - v[0] * t, p[1] - v[1] * t]; const B1 = [p[0] + v[0] * t, p[1] + v[1] * t];
      return { A1, B1, nom, p, v };
    };
    const D = [droite(pA, u, a), droite(pB, u, b), droite(pC, nv, c), droite(pD, w, d)];
    // Découpe dans le cadre.
    const clip = ({ p, v }) => { let t0 = -1e9; let t1 = 1e9; for (const [pp, q] of [[-v[0], p[0] - 12], [v[0], W - 12 - p[0]], [-v[1], p[1] - 12], [v[1], H - 12 - p[1]]]) { if (Math.abs(pp) < 1e-9) continue; const t = q / pp; if (pp < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t); } return [[p[0] + v[0] * t0, p[1] + v[1] * t0], [p[0] + v[0] * t1, p[1] + v[1] * t1]]; };
    let s = '';
    const inter = (L1, L2) => { const det = L1.v[0] * L2.v[1] - L1.v[1] * L2.v[0]; const t = ((L2.p[0] - L1.p[0]) * L2.v[1] - (L2.p[1] - L1.p[1]) * L2.v[0]) / det; return [L1.p[0] + L1.v[0] * t, L1.p[1] + L1.v[1] * t]; };
    D.forEach((L) => { const [e1, e2] = clip(L); L.e = [e1, e2]; s += ligneSvg(e1, e2, { sw: 2 }); });
    const marque = rng.next() < 0.5 ? [0] : [0, 1];
    for (const i of marque) { const I = inter(D[i], D[2]); s += angleDroitSvg(I, D[i].v, D[2].v, 10); }
    // Étiquettes : près d'un bout de chaque droite, loin des autres étiquettes et des autres droites.
    const distDroite = (q, L) => Math.abs((q[0] - L.p[0]) * L.v[1] - (q[1] - L.p[1]) * L.v[0]);
    // La droite oblique ne doit pas passer près des angles droits (sinon on croirait qu'elle y passe).
    if ([0, 1].some((i) => distDroite(inter(D[i], D[2]), D[3]) < 30)) return null;
    const poses = [];
    for (const L of D) {
      const cands = [];
      for (const [e, f] of [[L.e[1], L.e[0]], [L.e[0], L.e[1]]]) {
        for (const t of [16, 34]) {
          for (const sg of [1, -1]) {
            const dir = [f[0] - e[0], f[1] - e[1]]; const n2 = Math.hypot(...dir);
            const q = [e[0] + dir[0] / n2 * t - dir[1] / n2 * 11 * sg, e[1] + dir[1] / n2 * t + dir[0] / n2 * 11 * sg];
            if (q[0] < 10 || q[0] > W - 10 || q[1] < 12 || q[1] > H - 10) continue;
            const score = Math.min(...poses.map((p2) => Math.hypot(q[0] - p2[0], q[1] - p2[1]) / 2.4), ...D.filter((M) => M !== L).map((M) => distDroite(q, M)));
            cands.push([score, q]);
          }
        }
      }
      cands.sort((x, y) => y[0] - x[0]);
      if (!cands.length || cands[0][0] < 9) return null;
      poses.push(cands[0][1]);
      s += texteSvg(cands[0][1][0], cands[0][1][1], L.nom, { size: 16, bold: true, halo: true });
    }
    const vraies = [`${a} // ${b}`, `${b} // ${a}`, `${c} ⊥ ${a}`, `${a} ⊥ ${c}`, `${c} ⊥ ${b}`, `${b} ⊥ ${c}`];
    const fausses = [`${a} ⊥ ${b}`, `${c} // ${a}`, `${c} // ${b}`, `${d} ⊥ ${a}`, `${d} // ${c}`, `${d} // ${a}`, `${b} ⊥ ${d}`, `${d} ⊥ ${c}`];
    const nier = rng.next() < 0.3;
    const q = nier ? qcm(rng, rng.pick(fausses), rng.shuffle(vraies).filter((x, i, arr) => arr.findIndex((y) => y.split(' ').sort().join() === x.split(' ').sort().join()) === i))
      : qcm(rng, rng.pick(vraies), rng.shuffle(fausses));
    return {
      ...q, difficulte: 2,
      enonce: nier ? 'D\'après la figure, quelle écriture est FAUSSE ?' : 'D\'après la figure, quelle écriture est vraie ?',
      cle: `${a}${b}${c}${d}|${th.toFixed(2)}|${phi.toFixed(2)}|${ecart}|${decal}|${offD}|${marque.length}`,
      figure: svg(W, H, s),
      explication: `${a} et ${b} ne se coupent pas : ${a} // ${b}. Le petit carré montre un angle droit : ${c} ⊥ ${a}, et comme ${b} // ${a}, on a aussi ${c} ⊥ ${b}. La droite ${d} coupe les autres droites sans former d'angle droit : elle n'est ni parallèle ni perpendiculaire aux autres.`,
    };
  }, 2),
  // Nature d'une figure d'après le codage.
  forme((rng) => {
    const tri = rng.next() < 0.5;
    const modele = rng.pick(tri ? TRIANGLES_CODES : QUADS_CODES);
    const r1 = rng.int(0, 10) / 10;
    let P = tourner(modele.pts(r1), rng.int(-8, 8) * 5 * Math.PI / 180, [5, -3]);
    const miroir = rng.next() < 0.5;
    if (miroir) P = P.map(([x, y]) => [-x, y]);
    const noms = deuxLettres(rng, LETTRES_PTS, P.length);
    const Pc = cadrer(P, 320, 210, 36);
    const figure = svg(320, 210, figurePolygoneCode(Pc, noms, modele.codes, modele.droits, rng.pick(FONDS)));
    const nom = `${tri ? 'triangle ' : ''}${modele.nom}`;
    const pool = tri ? TRIANGLES_CODES.map((m) => m.nom).filter((x) => x !== modele.nom && !(modele.exclus || []).includes(x)).map((x) => `triangle ${x}`)
      : ['carré', 'rectangle', 'losange', 'parallélogramme', 'trapèze'].filter((x) => x !== modele.nom);
    const q = qcm(rng, nom, rng.shuffle(pool));
    return {
      ...q, difficulte: 2,
      enonce: `D'après le codage, quel est le nom le plus précis de ${tri ? 'ce triangle' : 'ce quadrilatère'} ${noms.join('')} ?`,
      cle: `${modele.nom}|${r1}|${noms.join('')}|${miroir}|${Pc.flat().map(Math.round).join(',')}`,
      figure,
      explication: `${modele.expl} (Petits traits identiques = côtés de même longueur ; petit carré = angle droit.)`,
    };
  }, 2),
  // Quels côtés ont la même longueur d'après le codage ?
  forme((rng) => {
    const n = rng.pick([4, 4, 5]);
    const base = n === 4 ? [[0, 0], [rng.int(8, 12), rng.int(-1, 1)], [rng.int(8, 12), -rng.int(5, 8)], [rng.int(0, 3), -rng.int(5, 8)]]
      : [[0, 0], [rng.int(7, 10), 0], [rng.int(10, 12), -rng.int(4, 6)], [rng.int(4, 6), -rng.int(8, 10)], [-rng.int(1, 3), -rng.int(4, 6)]];
    const P = tourner(base, rng.int(-6, 6) * 5 * Math.PI / 180, [5, -4]);
    const [i, j] = rng.shuffle(range(0, n - 1)).slice(0, 2);
    const codes = range(0, n - 1).map(() => 0);
    const autres = rng.shuffle(range(0, n - 1).filter((k) => k !== i && k !== j));
    codes[i] = 2; codes[j] = 2; codes[autres[0]] = 1; if (autres[1] !== undefined && rng.next() < 0.6) codes[autres[1]] = 3;
    const noms = deuxLettres(rng, LETTRES_PTS, n);
    const seg = (k) => `[${noms[k]}${noms[(k + 1) % n]}]`;
    const Pc = cadrer(P, 320, 210, 36);
    // Le codage ne doit pas contredire grossièrement le dessin : les deux côtés codés pareil ont presque la même longueur.
    const lg = (k) => Math.hypot(Pc[(k + 1) % n][0] - Pc[k][0], Pc[(k + 1) % n][1] - Pc[k][1]);
    if (Math.max(lg(i), lg(j)) / Math.min(lg(i), lg(j)) > 1.25) return null;
    const paires = [];
    for (let x = 0; x < n; x++) for (let y = x + 1; y < n; y++) paires.push([x, y]);
    const bonne = `${seg(Math.min(i, j))} et ${seg(Math.max(i, j))}`;
    const fausses = paires.filter(([x, y]) => !(codes[x] && codes[x] === codes[y])).map(([x, y]) => `${seg(x)} et ${seg(y)}`);
    const q = qcm(rng, bonne, rng.shuffle(fausses));
    return {
      ...q, difficulte: 2,
      enonce: `D'après le codage, quels côtés de ce polygone ont la même longueur ?`,
      cle: `${noms.join('')}|${codes.join('')}|${Pc.flat().map(Math.round).join(',')}`,
      figure: svg(320, 210, figurePolygoneCode(Pc, noms, codes, [], rng.pick(FONDS))),
      explication: `Les côtés ${seg(Math.min(i, j))} et ${seg(Math.max(i, j))} portent le même codage (deux petits traits) : ils ont la même longueur (le dessin n'est pas forcément exact : on se fie au codage). Un codage différent (un trait, trois traits) indique une autre longueur.`,
    };
  }, 2),
  // Le petit carré : angle droit.
  forme((rng) => {
    const noms = deuxLettres(rng, LETTRES_PTS, 4);
    const k = rng.int(0, 3);
    const P = cadrer(tourner([[0, 0], [rng.int(9, 13), 0], [rng.int(8, 12), -rng.int(5, 8)], [rng.int(0, 3), -rng.int(5, 8)]], rng.int(-6, 6) * 5 * Math.PI / 180, [5, -4]), 320, 200, 36);
    // On redresse l'angle k pour qu'il soit vraiment droit : on place le sommet suivant sur la perpendiculaire.
    const A = P[(k + 3) % 4]; const S = P[k]; const B = P[(k + 1) % 4];
    const u = [(A[0] - S[0]) / Math.hypot(A[0] - S[0], A[1] - S[1]), (A[1] - S[1]) / Math.hypot(A[0] - S[0], A[1] - S[1])];
    const lb = Math.hypot(B[0] - S[0], B[1] - S[1]); const v1 = [-u[1], u[0]]; const v2 = [u[1], -u[0]];
    const choixV = Math.hypot(S[0] + v1[0] * lb - B[0], S[1] + v1[1] * lb - B[1]) < Math.hypot(S[0] + v2[0] * lb - B[0], S[1] + v2[1] * lb - B[1]) ? v1 : v2;
    P[(k + 1) % 4] = [S[0] + choixV[0] * lb, S[1] + choixV[1] * lb];
    const Pc = cadrer(P, 320, 200, 36);
    const bonne = `L'angle en ${noms[k]} est un angle droit.`;
    const q = qcm(rng, bonne, [`Les côtés qui partent de ${noms[k]} ont la même longueur.`, `L'angle en ${noms[k]} est plus petit qu'un angle droit.`, `L'angle en ${noms[k]} est plus grand qu'un angle droit.`]);
    return {
      ...q, difficulte: 1,
      enonce: `Que signifie le petit carré dessiné en ${noms[k]} ?`,
      cle: `${noms.join('')}|${k}|${Pc.flat().map(Math.round).join(',')}`,
      figure: svg(320, 200, figurePolygoneCode(Pc, noms, [0, 0, 0, 0], [k], rng.pick(FONDS))),
      explication: `Le petit carré est le codage de l'angle droit : en ${noms[k]}, les côtés [${noms[(k + 3) % 4]}${noms[k]}] et [${noms[k]}${noms[(k + 1) % 4]}] sont perpendiculaires.`,
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
  ma_tc_fractions_operations: fractionsOperations,
  ma_tc_achats_promos: achatsPromos,
  ma_tc_graphe_fleche: grapheFleche,
  ma_tc_solides_faces: solidesFaces,
  ma_tc_symboles_geo: symbolesGeo,
};
