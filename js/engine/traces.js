// Questions de tracé pour les examens papier (Lot C).
//
// Chaque question produite est `numerisable: false` : elle ne sert que sur papier.
// Elle porte deux dessins SVG :
//   figure   : ce que l'enfant reçoit (quadrillage, point, droite…) ;
//   solution : le tracé attendu, pour le corrigé.
// Les dessins sont à l'échelle réelle (1 unité SVG = 1 mm), pour mesurer avec une vraie latte.
// Toutes les coordonnées sont entières ou arrondies : un même code de reproduction redonne le même dessin.

const U = 10; // 1 cm
const NOIR = '#111';
const ROUGE = '#d0021b';
const GRIS = '#9aa3ad';

const r1 = (x) => Math.round(x * 10) / 10;
const fmt = (x) => String(r1(x)).replace('.', ',');

export function svg(w, h, corps, echelle = 1) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r1(w)} ${r1(h)}" width="${r1(w * echelle)}mm" height="${r1(h * echelle)}mm" class="trace" font-family="Arial, sans-serif">${corps}</svg>`;
}

function quadrillage(cols, rows, ox = 0, oy = 0) {
  let s = '';
  for (let i = 0; i <= cols; i++) s += `<line x1="${ox + i * U}" y1="${oy}" x2="${ox + i * U}" y2="${oy + rows * U}"/>`;
  for (let j = 0; j <= rows; j++) s += `<line x1="${ox}" y1="${oy + j * U}" x2="${ox + cols * U}" y2="${oy + j * U}"/>`;
  return `<g stroke="${GRIS}" stroke-width="0.25">${s}</g>`;
}

const cadre = (w, h) => `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="${GRIS}" stroke-width="0.3" stroke-dasharray="2 2"/>`;
const poly = (pts, couleur = NOIR, extra = '') => `<polygon points="${pts.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')}" fill="none" stroke="${couleur}" stroke-width="0.7" stroke-linejoin="round" ${extra}/>`;
const seg = ([x1, y1], [x2, y2], couleur = NOIR, largeur = 0.6, extra = '') => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${couleur}" stroke-width="${largeur}" ${extra}/>`;
const texte = (x, y, t, { taille = 4, couleur = NOIR, ancre = 'middle', gras = false } = {}) =>
  `<text x="${r1(x)}" y="${r1(y)}" font-size="${taille}" fill="${couleur}" text-anchor="${ancre}"${gras ? ' font-weight="bold"' : ''}>${t}</text>`;
const point = ([x, y], nom, dx = 2.5, dy = -2) => `<g><line x1="${r1(x - 1.5)}" y1="${r1(y - 1.5)}" x2="${r1(x + 1.5)}" y2="${r1(y + 1.5)}" stroke="${NOIR}" stroke-width="0.5"/><line x1="${r1(x - 1.5)}" y1="${r1(y + 1.5)}" x2="${r1(x + 1.5)}" y2="${r1(y - 1.5)}" stroke="${NOIR}" stroke-width="0.5"/>${nom ? texte(x + dx, y + dy, nom, { taille: 4.5, gras: true }) : ''}</g>`;

// Segment d'une droite (point + direction) limité à un rectangle [x0,x1]×[y0,y1] (Liang-Barsky).
function droiteDansCadre([px, py], [dx, dy], x0, y0, x1, y1) {
  let t0 = -1e9, t1 = 1e9;
  for (const [p, q] of [[-dx, px - x0], [dx, x1 - px], [-dy, py - y0], [dy, y1 - py]]) {
    if (Math.abs(p) < 1e-12) { if (q < 0) return null; continue; }
    const t = q / p;
    if (p < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
  }
  if (t0 > t1) return null;
  return [[px + t0 * dx, py + t0 * dy], [px + t1 * dx, py + t1 * dy]];
}

// Polygone simple sur les nœuds d'un quadrillage, dans une boîte de w × h cases.
function polygoneQuadrillage(rng, w, h, nMin = 4, nMax = 6) {
  for (let essai = 0; essai < 200; essai++) {
    const n = rng.int(nMin, nMax);
    const pts = [];
    const vus = new Set();
    while (pts.length < n) {
      const p = [rng.int(0, w), rng.int(0, h)];
      if (vus.has(p.join())) continue;
      vus.add(p.join()); pts.push(p);
    }
    const cx = pts.reduce((s, p) => s + p[0], 0) / n;
    const cy = pts.reduce((s, p) => s + p[1], 0) / n;
    pts.sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
    // retire les sommets alignés avec leurs voisins
    const net = pts.filter((p, i) => {
      const a = pts[(i + n - 1) % n], c = pts[(i + 1) % n];
      return (p[0] - a[0]) * (c[1] - a[1]) - (p[1] - a[1]) * (c[0] - a[0]) !== 0;
    });
    if (net.length < nMin - 1 || net.length < 3) continue;
    const aire = Math.abs(net.reduce((s, p, i) => { const q = net[(i + 1) % net.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
    const xs = net.map((p) => p[0]), ys = net.map((p) => p[1]);
    if (aire < Math.max(3, (w * h) / 4)) continue;
    if (Math.max(...xs) - Math.min(...xs) < 2 || Math.max(...ys) - Math.min(...ys) < 2) continue;
    return net;
  }
  return [[0, 0], [w, 0], [w, h]];
}

const base = (id, sig, extra) => ({
  id: `trace-${id}#${sig}`,
  modeleId: `trace-${id}`,
  type: 'trace',
  source: 'trace',
  matiere: 'ma',
  domaine: 'ma.geometrie',
  numerisable: false,
  points: 2,
  difficulte: 2,
  ...extra,
});

// ------------------------------------------------------------------ 1. Symétrique sur quadrillage
function symetrie(rng) {
  const vertical = rng.next() < 0.6;
  const cols = vertical ? 14 : 12, rows = vertical ? 8 : 10;
  const bw = vertical ? 6 : 8, bh = vertical ? 6 : 4;
  const pts0 = polygoneQuadrillage(rng, bw, bh, 4, 6);
  const dx = vertical ? rng.int(0, 7 - bw) : rng.int(0, cols - bw);
  const dy = vertical ? rng.int(1, rows - bh - 1) : rng.int(0, 5 - bh);
  const pts = pts0.map(([x, y]) => [x + dx, y + dy]);
  const sym = pts.map(([x, y]) => (vertical ? [2 * 7 - x, y] : [x, 2 * 5 - y]));
  const axe = vertical ? seg([7 * U, -3], [7 * U, rows * U + 3], NOIR, 0.9) : seg([-3, 5 * U], [cols * U + 3, 5 * U], NOIR, 0.9);
  const lbl = vertical ? texte(7 * U + 2, -4, 'axe', { taille: 3.5 }) : texte(cols * U + 4, 5 * U - 2, 'axe', { taille: 3.5, ancre: 'start' });
  const W = cols * U + 16, H = rows * U + 8;
  const g = (c) => `<g transform="translate(3,6)">${quadrillage(cols, rows)}${axe}${lbl}${poly(pts.map(([x, y]) => [x * U, y * U]))}${c}</g>`;
  return base('symetrie', `${vertical ? 'v' : 'h'}${pts.flat().join('.')}`, {
    fiche: 'ma-symetrie',
    enonce: `Trace le symétrique de cette figure par rapport à l'axe ${vertical ? 'vertical' : 'horizontal'}.`,
    figure: svg(W, H, g('')),
    solution: svg(W, H, g(poly(sym.map(([x, y]) => [x * U, y * U]), ROUGE)), 0.6),
    reponseTexte: 'Figure symétrique (en rouge) : chaque sommet est à la même distance de l\'axe, de l\'autre côté.',
    explication: 'Compte les carreaux entre chaque sommet et l\'axe, puis reporte-les de l\'autre côté.',
  });
}

// ------------------------------------------------------------------ 2. Agrandissement
function agrandissement(rng) {
  const k = rng.pick([2, 2, 3]);
  const bw = k === 2 ? 3 : 2, bh = k === 2 ? 3 : 2;
  const pts0 = polygoneQuadrillage(rng, bw, bh, 3, 5);
  const cols = 16, rows = k * bh + 2;
  const ox = 1, oy = 1;
  const pts = pts0.map(([x, y]) => [x + ox, y + oy]);
  const ax = bw + 3, ay = 1;
  const grand = pts0.map(([x, y]) => [ax + k * x, ay + k * y]);
  const W = cols * U + 6, H = rows * U + 6;
  const [a0] = pts, [g0] = grand;
  const g = (c) => `<g transform="translate(3,3)">${quadrillage(cols, rows)}${poly(pts.map(([x, y]) => [x * U, y * U]))}${point([a0[0] * U, a0[1] * U], 'A', -3, -2)}${point([g0[0] * U, g0[1] * U], "A'", -3, -2)}${c}</g>`;
  return base('agrandissement', `${k}.${pts0.flat().join('.')}`, {
    fiche: 'ma-quadrilateres',
    difficulte: 3,
    enonce: `Reproduis cette figure en multipliant la longueur de ses côtés par ${k}. Commence au point A'.`,
    figure: svg(W, H, g('')),
    solution: svg(W, H, g(poly(grand.map(([x, y]) => [x * U, y * U]), ROUGE)), 0.6),
    reponseTexte: `Figure agrandie ${k} fois (en rouge), à partir de A'.`,
    explication: `Chaque déplacement d'un carreau devient un déplacement de ${k} carreaux, dans la même direction.`,
  });
}

// ------------------------------------------------------------------ 3. Cases à colorier
const LETTRES = 'ABCDEFGHIJKL';
function cases(rng) {
  const cols = 10, rows = 7;
  const n = rng.int(4, 6);
  const liste = [];
  const vus = new Set();
  while (liste.length < n) {
    const c = rng.int(0, cols - 1), r = rng.int(0, rows - 1);
    if (vus.has(`${c},${r}`)) continue;
    vus.add(`${c},${r}`); liste.push([c, r]);
  }
  const nom = ([c, r]) => `(${LETTRES[c]},${r + 1})`;
  const ox = 8, oy = 8;
  let etiquettes = '';
  for (let c = 0; c < cols; c++) etiquettes += texte(ox + c * U + U / 2, oy - 2.5, LETTRES[c], { taille: 4, gras: true });
  for (let r = 0; r < rows; r++) etiquettes += texte(ox - 3, oy + r * U + U / 2 + 1.5, String(r + 1), { taille: 4, gras: true });
  const W = ox + cols * U + 3, H = oy + rows * U + 3;
  const remplies = liste.map(([c, r]) => `<rect x="${ox + c * U}" y="${oy + r * U}" width="${U}" height="${U}" fill="${ROUGE}" fill-opacity="0.75"/>`).join('');
  const g = (c) => `${c}<g transform="translate(${ox},${oy})">${quadrillage(cols, rows)}</g>${etiquettes}`;
  return base('cases', liste.flat().join('.'), {
    fiche: 'ma-donnees',
    points: 1,
    difficulte: 1,
    enonce: `Colorie les cases ${liste.map(nom).join(' ; ')}. La lettre donne la colonne, le nombre donne la ligne.`,
    figure: svg(W, H, g('')),
    solution: svg(W, H, g(remplies), 0.6),
    reponseTexte: `Cases coloriées : ${liste.map(nom).join(', ')}.`,
    explication: 'On lit d\'abord la colonne (lettre), puis la ligne (nombre) : la case est au croisement.',
  });
}

// ------------------------------------------------------------------ 4. Figure aux dimensions données
function figureDimensions(rng) {
  const sorte = rng.pick(['rectangle', 'carre', 'triangle', 'perimetre']);
  let L, l, enonce, rep, expl, fiche = 'ma-quadrilateres', sig;
  if (sorte === 'rectangle') {
    L = rng.int(10, 24) / 2; l = rng.int(5, Math.floor(L * 2) - 2) / 2;
    enonce = `Trace un rectangle de ${fmt(L)} cm de longueur et ${fmt(l)} cm de largeur.`;
    rep = `Rectangle de ${fmt(L)} cm sur ${fmt(l)} cm, avec 4 angles droits.`;
    expl = 'Trace un côté à la latte, puis les angles droits avec l\'équerre.';
  } else if (sorte === 'carre') {
    L = l = rng.int(6, 14) / 2;
    enonce = `Trace un carré de ${fmt(L)} cm de côté.`;
    rep = `Carré de ${fmt(L)} cm de côté : 4 côtés égaux et 4 angles droits.`;
    expl = 'Les 4 côtés mesurent la même longueur et tous les angles sont droits (équerre).';
  } else if (sorte === 'perimetre') {
    L = rng.int(4, 10); l = rng.int(2, L - 1);
    enonce = `Trace un rectangle de ${2 * (L + l)} cm de périmètre dont la longueur mesure ${L} cm.`;
    rep = `Rectangle de ${L} cm sur ${l} cm (${2 * (L + l)} : 2 = ${L + l} ; ${L + l} − ${L} = ${l}).`;
    expl = 'Le demi-périmètre, c\'est une longueur plus une largeur.';
    fiche = 'ma-aires-perimetres';
  } else {
    L = rng.int(6, 20) / 2; l = rng.int(6, 14) / 2;
    enonce = `Trace un triangle rectangle dont les deux côtés de l'angle droit mesurent ${fmt(L)} cm et ${fmt(l)} cm.`;
    rep = `Triangle rectangle : côtés de l'angle droit de ${fmt(L)} cm et ${fmt(l)} cm.`;
    expl = 'Trace l\'angle droit avec l\'équerre, mesure les deux côtés, puis relie leurs extrémités.';
    fiche = 'ma-triangles';
  }
  sig = `${sorte}.${L}.${l}`;
  const W = 170, H = Math.max(60, l * U + 24);
  const x0 = (W - L * U) / 2, y0 = (H - l * U) / 2;
  let dessin;
  if (sorte === 'triangle') {
    const A = [x0, y0 + l * U], B = [x0 + L * U, y0 + l * U], C = [x0, y0];
    dessin = poly([A, B, C], ROUGE) + `<polyline points="${A[0] + 4},${A[1]} ${A[0] + 4},${A[1] - 4} ${A[0]},${A[1] - 4}" fill="none" stroke="${ROUGE}" stroke-width="0.4"/>`
      + texte((A[0] + B[0]) / 2, A[1] + 6, `${fmt(L)} cm`, { couleur: ROUGE }) + texte(x0 - 3, y0 + (l * U) / 2, `${fmt(l)} cm`, { couleur: ROUGE, ancre: 'end' });
  } else {
    dessin = poly([[x0, y0], [x0 + L * U, y0], [x0 + L * U, y0 + l * U], [x0, y0 + l * U]], ROUGE)
      + texte(x0 + (L * U) / 2, y0 + l * U + 6, `${fmt(L)} cm`, { couleur: ROUGE }) + texte(x0 - 3, y0 + (l * U) / 2 + 1.5, `${fmt(l)} cm`, { couleur: ROUGE, ancre: 'end' });
  }
  return base('dimensions', sig, {
    fiche,
    difficulte: sorte === 'perimetre' ? 3 : 2,
    enonce,
    figure: svg(W, H, cadre(W, H)),
    solution: svg(W, H, dessin, 0.6),
    reponseTexte: rep,
    explication: expl,
  });
}

// ------------------------------------------------------------------ 5. Cercle
function cercle(rng) {
  const parDiametre = rng.next() < 0.4;
  const r = parDiametre ? rng.int(4, 8) / 2 * 1 : rng.int(4, 9) / 2;
  const d = 2 * r;
  const W = 170, H = d * U + 16;
  const O = [W / 2, H / 2];
  const dessin = `<circle cx="${O[0]}" cy="${O[1]}" r="${r * U}" fill="none" stroke="${ROUGE}" stroke-width="0.7"/>` + seg(O, [O[0] + r * U, O[1]], ROUGE, 0.4)
    + texte(O[0] + (r * U) / 2, O[1] - 2, `${fmt(r)} cm`, { couleur: ROUGE, taille: 3.5 });
  return base('cercle', `${parDiametre ? 'd' : 'r'}${r}`, {
    fiche: 'ma-cercle',
    enonce: parDiametre ? `Trace un cercle de centre O et de ${fmt(d)} cm de diamètre.` : `Trace un cercle de centre O et de ${fmt(r)} cm de rayon.`,
    figure: svg(W, H, cadre(W, H) + point(O, 'O')),
    solution: svg(W, H, point(O, 'O') + dessin, 0.6),
    reponseTexte: `Cercle de centre O et de ${fmt(r)} cm de rayon${parDiametre ? ` (le rayon est la moitié du diamètre : ${fmt(d)} : 2 = ${fmt(r)})` : ''}.`,
    explication: parDiametre ? 'Le rayon est la moitié du diamètre : ouvre le compas de cette longueur.' : 'Ouvre le compas de la longueur du rayon et pique la pointe en O.',
  });
}

// ------------------------------------------------------------------ 6. Perpendiculaire / parallèle
function perpendiculaire(rng) {
  const para = rng.next() < 0.5;
  const W = 150, H = 80;
  const angle = rng.pick([20, 25, 30, 35, 40, 50, 55, 60, 120, 125, 130, 140, 145, 150, 155, 160]) * Math.PI / 180;
  const dir = [Math.cos(angle), -Math.sin(angle)];
  const n = [-dir[1], dir[0]];
  const C = [W / 2 + rng.int(-15, 15), H / 2 + rng.int(-5, 5)];
  const dist = rng.int(20, 32) * rng.pick([1, -1]);
  const A = [C[0] + n[0] * dist + dir[0] * rng.int(-20, 20), C[1] + n[1] * dist + dir[1] * rng.int(-20, 20)];
  if (A[0] < 12 || A[0] > W - 12 || A[1] < 10 || A[1] > H - 10) return null;
  const d = droiteDansCadre(C, dir, 4, 4, W - 4, H - 4);
  const sol = droiteDansCadre(A, para ? dir : n, 4, 4, W - 4, H - 4);
  if (!d || !sol) return null;
  const [d1, d2] = d;
  const etiquette = d2[0] > d1[0] ? d2 : d1;
  const base0 = cadre(W, H) + seg(d1, d2, NOIR, 0.6) + texte(etiquette[0] + (etiquette[0] > W - 12 ? -4 : 3), etiquette[1] + (etiquette[1] < 10 ? 6 : -2), 'd', { taille: 5, gras: true }) + point(A, 'A');
  let extra = '';
  if (!para) {
    // pied de la perpendiculaire + marque d'angle droit
    const t = (A[0] - C[0]) * dir[0] + (A[1] - C[1]) * dir[1];
    const H0 = [C[0] + t * dir[0], C[1] + t * dir[1]];
    const s = Math.sign((A[0] - H0[0]) * n[0] + (A[1] - H0[1]) * n[1]) || 1;
    const p1 = [H0[0] + dir[0] * 3, H0[1] + dir[1] * 3], p2 = [p1[0] + n[0] * 3 * s, p1[1] + n[1] * 3 * s], p3 = [H0[0] + n[0] * 3 * s, H0[1] + n[1] * 3 * s];
    extra = `<polyline points="${[p1, p2, p3].map((p) => p.map(r1).join(',')).join(' ')}" fill="none" stroke="${ROUGE}" stroke-width="0.4"/>`;
  }
  return base('perpendiculaire', `${para ? 'pa' : 'pe'}${Math.round(angle * 100)}.${A.map(Math.round).join('.')}.${C.join('.')}`, {
    fiche: 'ma-angles',
    enonce: para ? 'Trace la droite parallèle à la droite d qui passe par le point A.' : 'Trace la droite perpendiculaire à la droite d qui passe par le point A.',
    figure: svg(W, H, base0),
    solution: svg(W, H, base0 + seg(sol[0], sol[1], ROUGE, 0.7) + extra, 0.6),
    reponseTexte: para ? 'Droite passant par A, qui ne coupe jamais d (même direction).' : 'Droite passant par A, qui coupe d en formant un angle droit.',
    explication: para ? 'Pose l\'équerre sur d, fais glisser la latte le long de l\'équerre jusqu\'à A.' : 'Pose un côté de l\'angle droit de l\'équerre sur d et fais-la glisser jusqu\'à A.',
  });
}

// ------------------------------------------------------------------ 7. Axes de symétrie
const reg = (n, R, depart = -90) => Array.from({ length: n }, (_, i) => { const a = (depart + (360 / n) * i) * Math.PI / 180; return [R * Math.cos(a), R * Math.sin(a)]; });
const FIGURES = [
  { nom: 'ce rectangle', pts: () => [[-30, -17], [30, -17], [30, 17], [-30, 17]], axes: [0, 90] },
  { nom: 'ce carré', pts: () => [[-22, -22], [22, -22], [22, 22], [-22, 22]], axes: [0, 45, 90, 135] },
  { nom: 'ce losange', pts: () => [[0, -26], [18, 0], [0, 26], [-18, 0]], axes: [0, 90] },
  { nom: 'ce triangle isocèle', pts: () => [[0, -26], [18, 20], [-18, 20]], axes: [90] },
  { nom: 'ce triangle équilatéral', pts: () => reg(3, 28), axes: [90, 30, 150] },
  { nom: 'cet hexagone régulier', pts: () => reg(6, 26, 0), axes: [0, 30, 60, 90, 120, 150] },
  { nom: 'ce pentagone régulier', pts: () => reg(5, 26), axes: [90, 18, 54, 126, 162] },
  { nom: 'ce trapèze isocèle', pts: () => [[-15, -16], [15, -16], [30, 16], [-30, 16]], axes: [90] },
  { nom: 'ce cerf-volant', pts: () => [[0, -26], [16, -8], [0, 26], [-16, -8]], axes: [90] },
  { nom: 'ce parallélogramme', pts: () => [[-22, -16], [34, -16], [22, 16], [-34, 16]], axes: [] },
  { nom: 'ce triangle quelconque', pts: () => [[-26, 18], [30, 18], [-6, -22]], axes: [] },
];
function axesSymetrie(rng) {
  const f = rng.pick(FIGURES);
  const W = 120, H = 80, c = [W / 2, H / 2];
  const pts = f.pts().map(([x, y]) => [c[0] + x, c[1] + y]);
  const R = Math.max(...f.pts().map(([x, y]) => Math.hypot(x, y))) + 7;
  const axes = f.axes.map((a) => { const t = a * Math.PI / 180; const v = [Math.cos(t), -Math.sin(t)]; return seg([c[0] - v[0] * R, c[1] - v[1] * R], [c[0] + v[0] * R, c[1] + v[1] * R], ROUGE, 0.5, 'stroke-dasharray="3 1.5"'); }).join('');
  const n = f.axes.length;
  return base('axes', f.nom, {
    fiche: 'ma-symetrie',
    difficulte: n >= 3 || n === 0 ? 3 : 2,
    enonce: `Trace tous les axes de symétrie de ${f.nom}. Écris combien il y en a (0 s'il n'y en a pas).`,
    figure: svg(W, H, poly(pts)),
    solution: svg(W, H, poly(pts) + axes + texte(W - 4, H - 4, `${n} axe${n > 1 ? 's' : ''}`, { couleur: ROUGE, ancre: 'end', gras: true }), 0.6),
    reponseTexte: n === 0 ? `${f.nom[0].toUpperCase()}${f.nom.slice(1)} n'a aucun axe de symétrie : 0.` : `${n} axe${n > 1 ? 's' : ''} de symétrie (en pointillé rouge).`,
    explication: 'Un axe de symétrie partage la figure en deux moitiés qui se superposent exactement quand on plie.',
  });
}

// ------------------------------------------------------------------ 8. Diagramme en bâtonnets
const SERIES = [
  { titre: 'Livres lus par la classe', unite: 'livres', cats: ['Sept.', 'Oct.', 'Nov.', 'Déc.', 'Janv.'] },
  { titre: 'Fruits préférés des élèves', unite: 'élèves', cats: ['Pomme', 'Banane', 'Fraise', 'Orange', 'Kiwi'] },
  { titre: 'Jours de pluie par mois', unite: 'jours', cats: ['Mars', 'Avril', 'Mai', 'Juin', 'Juil.'] },
  { titre: 'Buts marqués par équipe', unite: 'buts', cats: ['Lions', 'Aigles', 'Loups', 'Ours', 'Renards'] },
  { titre: 'Visiteurs du musée (en centaines)', unite: 'centaines', cats: ['Lundi', 'Mardi', 'Merc.', 'Jeudi', 'Vend.'] },
];
function diagramme(rng) {
  const s = rng.pick(SERIES);
  const pas = rng.pick([1, 2, 5]);
  const nCats = rng.int(4, 5);
  const cats = s.cats.slice(0, nCats);
  const vals = cats.map(() => pas * rng.int(1, 7));
  const donne = rng.int(0, nCats - 1); // un bâtonnet déjà tracé, comme exemple
  const ox = 16, oy = 6, hGraph = 8 * U, larg = 20;
  const W = ox + nCats * larg + 8, H = oy + hGraph + 12;
  let axes = '';
  for (let k = 0; k <= 8; k++) {
    const y = oy + hGraph - k * U;
    axes += seg([ox, y], [ox + nCats * larg, y], GRIS, 0.2) + texte(ox - 2, y + 1.4, String(k * pas), { taille: 3.5, ancre: 'end' });
  }
  axes += seg([ox, oy - 3], [ox, oy + hGraph], NOIR, 0.5) + seg([ox, oy + hGraph], [ox + nCats * larg + 3, oy + hGraph], NOIR, 0.5);
  cats.forEach((c, i) => { axes += texte(ox + i * larg + larg / 2, oy + hGraph + 5, c, { taille: 3.4 }); });
  const baton = (i, couleur) => { const h = (vals[i] / pas) * U; return `<rect x="${ox + i * larg + 5}" y="${oy + hGraph - h}" width="${larg - 10}" height="${h}" fill="${couleur}" fill-opacity="0.8" stroke="${NOIR}" stroke-width="0.3"/>`; };
  const tableau = cats.map((c, i) => `${c} : ${vals[i]}`).join(' · ');
  return base('diagramme', `${s.titre}.${pas}.${vals.join('.')}.${donne}`, {
    fiche: 'ma-donnees',
    enonce: `${s.titre} : ${tableau}. Complète le diagramme en bâtonnets (le bâtonnet « ${cats[donne]} » est déjà tracé).`,
    figure: svg(W, H, axes + baton(donne, '#9aa3ad')),
    solution: svg(W, H, axes + cats.map((_, i) => baton(i, i === donne ? '#9aa3ad' : ROUGE)).join(''), 0.6),
    reponseTexte: `Bâtonnets : ${tableau} (1 carreau = ${pas} ${s.unite}).`,
    explication: `Chaque graduation vaut ${pas} : divise chaque nombre par ${pas} pour trouver la hauteur en carreaux.`,
  });
}

export const TRACES = { symetrie, agrandissement, cases, figureDimensions, cercle, perpendiculaire, axesSymetrie, diagramme };

// Tire `n` questions de tracé toutes différentes (familles variées d'abord).
export function tirerTraces(rng, n, exclure = new Set()) {
  const familles = rng.shuffle(Object.keys(TRACES));
  const out = [];
  for (let i = 0, essais = 0; out.length < n && essais < n * 40; i++, essais++) {
    const q = TRACES[familles[i % familles.length]](rng);
    if (!q || exclure.has(q.id) || out.some((x) => x.id === q.id)) continue;
    out.push(q);
  }
  return out;
}
