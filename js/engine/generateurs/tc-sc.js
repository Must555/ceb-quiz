// Générateurs des familles du tronc commun (référentiel P6), matière sc.
// Voir js/engine/generateurs/gen-*.js pour les conventions (formes, _signature, qcm…).
//
//   sc_releves     : lire des relevés d'expérience (tableau ou graphique SVG) : lire, comparer, écart, cause, conclure
//   sc_effort      : rythme cardiaque et ventilation au repos / après l'effort (chronomètre, moyenne de 3 mesures)
//   sc_emboites    : classification en ensembles emboîtés (figure de rectangles emboîtés, attributs partagés)
//   sc_attributs   : attributs des animaux (liste officielle P6) et notion d'espèce
//   sc_systemes    : liens entre systèmes respiratoire, circulatoire et digestif (trajets, diaphragme…)
//   sc_ventilation : modèle de la ventilation (bouteille, membrane, ballons) : correspondances, inspiration/expiration, limites
//   sc_demarche    : démarche d'investigation (facteur testé, un seul facteur qui change, témoin, fait/hypothèse/jugement)
//   sc_transfert   : la chaleur passe du chaud vers le froid ; équilibre des températures (courbes, mélanges)
//   sc_economie    : limiter les pertes de chaleur (isolation, gestes, choix d'un isolant ou d'un conducteur)
//   sc_mesures     : instruments et unités (thermomètre, balance, chronomètre, verre gradué, pluviomètre), lectures
//   sc_espece      : notion d'espèce (races, hybrides stériles, compter les espèces)

import { formatNombre as fmt } from '../format.js';

// ---------------------------------------------------------------- outils
const FILLES = ['Léa', 'Agathe', 'Manon', 'Louise', 'Juliette', 'Camille', 'Amélie', 'Chloé', 'Mathilde', 'Clémence', 'Élise', 'Claire', 'Pauline', 'Margaux'];
const GARCONS = ['Baptiste', 'Antoine', 'Maxime', 'Arthur', 'Mathis', 'Quentin', 'Louis', 'Étienne', 'Victor', 'Jules', 'Romain', 'Émile', 'Clément', 'Pierre'];
const PRENOMS = [...FILLES, ...GARCONS];
const VOY = /\bde (?=(Agathe|Amélie|Antoine|Arthur|Étienne|Émile|Élise)\b)/g;
const elider = (t) => (typeof t === 'string' ? t.replace(VOY, 'd\'') : t);
const il = (p) => (FILLES.includes(p) ? 'elle' : 'il');
const maj = (s) => (s ? String(s).replace(/^([«\s]*)(\p{L})/u, (_, a, b) => a + b.toUpperCase()) : s);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const largeur = (s, taille = 12) => String(s).length * taille * 0.56;

function qcm(rng, bonne, faux, extra = {}) {
  const f = [...new Set(faux)].filter((x) => x !== bonne);
  if (f.length < 2) return null;
  const choix = rng.shuffle([bonne, ...f.slice(0, 3)]);
  return { type: 'qcm', choix, reponse: choix.indexOf(bonne), ...extra };
}
const triee = (arr) => arr.slice().sort().join('|');

// Tire n éléments d'une liste en gardant leur ordre d'origine.
function sousSuite(rng, liste, n) {
  const idx = rng.shuffle(liste.map((_, i) => i)).slice(0, n).sort((a, b) => a - b);
  return idx.map((i) => liste[i]);
}
// Question « ordre » à partir d'une liste déjà dans le bon ordre.
function ordre(rng, bonOrdre) {
  let melange = rng.shuffle(bonOrdre.map((_, i) => i));
  if (melange.every((v, i) => v === i)) melange = melange.reverse();
  const elements = melange.map((i) => bonOrdre[i]);
  const reponse = bonOrdre.map((_, i) => melange.indexOf(i));
  return { type: 'ordre', elements, reponse };
}

// ---------------------------------------------------------------- figures SVG
const ENCRE = '#1c2333';
const STYLES = [
  { c: '#1c2333', dash: '', m: 'rond' },
  { c: '#c0392b', dash: '7 4', m: 'carre' },
  { c: '#1f5fbf', dash: '2 3', m: 'triangle' },
  { c: '#2e7d32', dash: '10 3 2 3', m: 'losange' },
];
const svg = (W, H, corps) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Arial, sans-serif">`
  + `<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>${corps}</svg>`;
function marqueur(m, x, y, c) {
  if (m === 'rond') return `<circle cx="${x}" cy="${y}" r="3.6" fill="${c}"/>`;
  if (m === 'carre') return `<rect x="${x - 3.5}" y="${y - 3.5}" width="7" height="7" fill="${c}"/>`;
  if (m === 'triangle') return `<path d="M${x} ${y - 4.5} L${x + 4.5} ${y + 3.5} L${x - 4.5} ${y + 3.5} Z" fill="${c}"/>`;
  return `<path d="M${x} ${y - 5} L${x + 4.5} ${y} L${x} ${y + 5} L${x - 4.5} ${y} Z" fill="${c}"/>`;
}

// Graphique en courbes : plusieurs séries sur les mêmes abscisses.
function svgCourbes({ titre, xs, series, xTitre, yTitre, yMin, yMax, yPas, yEtiq }) {
  const W = 400; const nLeg = Math.ceil(series.length / 2);
  const T = 30 + nLeg * 18 + 20; const B = 44; const L = 46; const R = 16;
  const hp = Math.max(190, Math.round(((yMax - yMin) / yPas) * 8)); const H = T + hp + B;
  const px = (x) => L + ((x - xs[0]) / (xs[xs.length - 1] - xs[0])) * (W - L - R);
  const py = (y) => H - B - ((y - yMin) / (yMax - yMin)) * (H - B - T);
  let s = `<text x="${W / 2}" y="18" font-size="13" font-weight="bold" text-anchor="middle" fill="${ENCRE}">${esc(titre)}</text>`;
  series.forEach((se, i) => {
    const st = STYLES[i]; const x0 = 14 + (i % 2) * 192; const y0 = 34 + Math.floor(i / 2) * 18;
    s += `<line x1="${x0}" y1="${y0}" x2="${x0 + 26}" y2="${y0}" stroke="${st.c}" stroke-width="2.4" stroke-dasharray="${st.dash}"/>`
      + marqueur(st.m, x0 + 13, y0, st.c)
      + `<text x="${x0 + 32}" y="${y0 + 4.5}" font-size="12" fill="${ENCRE}">${esc(se.nom)}</text>`;
  });
  for (let y = yMin; y <= yMax + 1e-9; y += yPas) {
    const fort = Math.abs(((y - yMin) / yEtiq) - Math.round((y - yMin) / yEtiq)) < 1e-9;
    s += `<line x1="${L}" y1="${py(y)}" x2="${W - R}" y2="${py(y)}" stroke="${fort ? '#9aa3b5' : '#d5dae3'}" stroke-width="${fort ? 1 : 0.8}"/>`;
    if (fort) s += `<text x="${L - 5}" y="${py(y) + 4}" font-size="12" text-anchor="end" fill="${ENCRE}">${fmt(y)}</text>`;
  }
  for (const x of xs) {
    s += `<line x1="${px(x)}" y1="${T}" x2="${px(x)}" y2="${H - B}" stroke="#d5dae3" stroke-width="0.8"/>`
      + `<text x="${px(x)}" y="${H - B + 16}" font-size="12" text-anchor="middle" fill="${ENCRE}">${fmt(x)}</text>`;
  }
  s += `<line x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}" stroke="${ENCRE}" stroke-width="1.4"/>`
    + `<line x1="${L}" y1="${T}" x2="${L}" y2="${H - B}" stroke="${ENCRE}" stroke-width="1.4"/>`
    + `<text x="${L}" y="${T - 8}" font-size="12" fill="${ENCRE}">${esc(yTitre)}</text>`
    + `<text x="${W - R}" y="${H - 8}" font-size="12" text-anchor="end" fill="${ENCRE}">${esc(xTitre)}</text>`;
  series.forEach((se, i) => {
    const st = STYLES[i];
    s += `<polyline fill="none" stroke="${st.c}" stroke-width="2.2" stroke-dasharray="${st.dash}" points="${se.v.map((v, k) => `${px(xs[k]).toFixed(1)},${py(v).toFixed(1)}`).join(' ')}"/>`;
    se.v.forEach((v, k) => { s += marqueur(st.m, +px(xs[k]).toFixed(1), +py(v).toFixed(1), st.c); });
  });
  return svg(W, H, s);
}

// Diagramme en barres (valeur écrite au-dessus de chaque barre).
function svgBarres({ titre, cats, vals, yTitre, yMax, yPas }) {
  const W = 400; const T = 52; const B = 50; const L = 46; const R = 14; const H = T + 180 + B;
  const py = (y) => H - B - (y / yMax) * (H - B - T);
  const pas = (W - L - R) / cats.length; const bw = Math.min(56, pas * 0.55);
  let s = `<text x="${W / 2}" y="18" font-size="13" font-weight="bold" text-anchor="middle" fill="${ENCRE}">${esc(titre)}</text>`;
  for (let y = 0; y <= yMax + 1e-9; y += yPas) {
    s += `<line x1="${L}" y1="${py(y)}" x2="${W - R}" y2="${py(y)}" stroke="#d5dae3" stroke-width="0.8"/>`
      + `<text x="${L - 5}" y="${py(y) + 4}" font-size="12" text-anchor="end" fill="${ENCRE}">${fmt(y)}</text>`;
  }
  cats.forEach((c, i) => {
    const cx = L + pas * (i + 0.5); const v = vals[i];
    s += `<rect x="${(cx - bw / 2).toFixed(1)}" y="${py(v).toFixed(1)}" width="${bw.toFixed(1)}" height="${(H - B - py(v)).toFixed(1)}" fill="#a9c1e3" stroke="${ENCRE}" stroke-width="1.2"/>`
      + `<text x="${cx.toFixed(1)}" y="${(py(v) - 5).toFixed(1)}" font-size="12" font-weight="bold" text-anchor="middle" fill="${ENCRE}">${fmt(v)}</text>`;
    const mots = String(c).split(' '); const lignes = [];
    for (const m of mots) {
      if (lignes.length && largeur(lignes[lignes.length - 1] + ' ' + m) < pas - 6) lignes[lignes.length - 1] += ' ' + m; else lignes.push(m);
    }
    lignes.slice(0, 2).forEach((l, k) => { s += `<text x="${cx.toFixed(1)}" y="${H - B + 16 + k * 14}" font-size="12" text-anchor="middle" fill="${ENCRE}">${esc(l)}</text>`; });
  });
  s += `<line x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}" stroke="${ENCRE}" stroke-width="1.4"/>`
    + `<line x1="${L}" y1="${T}" x2="${L}" y2="${H - B}" stroke="${ENCRE}" stroke-width="1.4"/>`
    + `<text x="${L}" y="${T - 12}" font-size="12" fill="${ENCRE}">${esc(yTitre)}</text>`;
  return svg(W, H, s);
}

// Tableau de données : en-têtes + lignes (la 1re colonne est un intitulé).
function svgTableau({ titre, entetes, lignes }) {
  const c0 = Math.max(...[entetes[0], ...lignes.map((l) => l[0])].map((t) => largeur(t, 12))) + 16;
  const autres = entetes.slice(1);
  let cw = Math.max(34, ...autres.map((t) => largeur(t, 12) + 12), ...lignes.flatMap((l) => l.slice(1)).map((t) => largeur(t, 12) + 12));
  if (c0 + cw * autres.length + 4 < 340) cw = (340 - 4 - c0) / autres.length;
  const W = Math.ceil(c0 + cw * autres.length + 4); const rh = 24; const T = 30;
  const H = T + rh * (lignes.length + 1) + 4;
  let s = `<text x="2" y="18" font-size="13" font-weight="bold" fill="${ENCRE}">${esc(titre)}</text>`;
  const xs = [2, ...autres.map((_, i) => 2 + c0 + cw * i)];
  s += `<rect x="2" y="${T}" width="${W - 4}" height="${rh}" fill="#e8edf5"/>`;
  [entetes, ...lignes].forEach((l, r) => {
    l.forEach((t, k) => {
      const x = k === 0 ? xs[0] + 6 : xs[k] + cw / 2;
      s += `<text x="${x.toFixed(1)}" y="${T + r * rh + 16}" font-size="12" ${k === 0 ? '' : 'text-anchor="middle" '}${r === 0 || k === 0 ? 'font-weight="bold" ' : ''}fill="${ENCRE}">${esc(t)}</text>`;
    });
  });
  for (let r = 0; r <= lignes.length + 1; r++) s += `<line x1="2" y1="${T + r * rh}" x2="${W - 2}" y2="${T + r * rh}" stroke="${ENCRE}" stroke-width="1"/>`;
  for (const x of [...xs, W - 2]) s += `<line x1="${x.toFixed(1)}" y1="${T}" x2="${x.toFixed(1)}" y2="${T + rh * (lignes.length + 1)}" stroke="${ENCRE}" stroke-width="1"/>`;
  return svg(W, H, s);
}

// ================================================================ 1. RELEVÉS D'EXPÉRIENCE
const rnd = (v, pas) => Math.round(v / pas) * pas;
// Courbe « régulière » : pas de palier suivi d'une reprise, pas d'écart qui grandit brusquement
// (évite les escaliers dus aux arrondis, physiquement faux pour un refroidissement ou un réchauffement).
const reguliere = (v, r) => {
  const d = v.slice(1).map((x, i) => Math.abs(x - v[i]));
  if (d[0] === 0) return false;
  for (let k = 1; k < d.length; k++) if ((d[k - 1] === 0 && d[k] > 0) || d[k] > d[k - 1] + r) return false;
  return true;
};
const jit = (rng, a = 0.9, b = 1.1) => a + rng.next() * (b - a);

const MATERIAUX = [
  { nom: 'Sans rien', k: 0.035, fonte: [35, 50] },
  { nom: 'Papier journal', k: 0.024, fonte: [60, 80] },
  { nom: 'Laine', k: 0.015, fonte: [100, 125] },
  { nom: 'Polystyrène', k: 0.0095, fonte: [140, 175] },
];
const avecIsolants = (rng) => {
  const iso = rng.shuffle(MATERIAUX.slice(1)).slice(0, rng.int(2, 3));
  return MATERIAUX.filter((m) => m === MATERIAUX[0] || iso.includes(m));
};
const deDes = (noms) => noms.map((n) => (n === 'Papier journal' ? 'de papier journal' : n === 'Laine' ? 'de laine' : 'de polystyrène'));
const listeEt = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} et ${l[l.length - 1]}`);
const listeOu = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} ou ${l[l.length - 1]}`);

const MAT = (n) => (n === 'Laine' ? { le: 'La laine', pr: 'elle' } : n === 'Polystyrène' ? { le: 'Le polystyrène', pr: 'il' } : { le: 'Le papier journal', pr: 'il' });
const QCM_ISOLANT_CHAUD = (iso) => ({
  enonce: `Pourquoi l'eau du pot « ${iso} » reste-t-elle chaude plus longtemps que celle du pot « Sans rien » ?`,
  bonne: `${MAT(iso).le} est un isolant thermique : ${MAT(iso).pr} ralentit le passage de la chaleur de l'eau chaude vers l'air plus froid.`,
  faux: [`${MAT(iso).le} produit de la chaleur qui réchauffe l'eau.`,
    'Le matériau empêche le froid d\'entrer dans le pot.',
    `${MAT(iso).le} est un bon conducteur thermique.`],
  pourquoi: 'La chaleur (énergie thermique) passe toujours du plus chaud vers le plus froid. Un isolant ne fabrique pas de chaleur : il ralentit ce passage. Ce n\'est pas « le froid qui entre », c\'est la chaleur qui sort.',
});

function expRefroid(rng, support) {
  const p = rng.pick(PRENOMS); const Ta = rng.pick([18, 20, 22]); const T0 = rng.pick([60, 70, 80, 90]);
  const pas = rng.pick([5, 10]); const xs = [0, 1, 2, 3, 4, 5, 6].map((i) => i * pas);
  const mats = avecIsolants(rng); const r = support === 'graphique' ? 2 : 1;
  let series;
  for (let essai = 0; essai < 25; essai++) {
    series = mats.map((m) => { const k = m.k * jit(rng, 0.92, 1.08); return { nom: m.nom, v: xs.map((t) => rnd(Ta + (T0 - Ta) * Math.exp(-k * t), r)) }; });
    if (series.every((x) => reguliere(x.v, r))) break;
    series = null;
  }
  if (!series) return null;
  const isos = mats.slice(1).map((m) => m.nom);
  const meilleur = series.slice(1).reduce((a, b) => (b.v[6] > a.v[6] ? b : a));
  if (series.slice(1).filter((x) => x.v[6] === meilleur.v[6]).length > 1) return null;
  const iso = rng.pick(isos);
  return {
    id: 'refroid', domaine: 'sc.energie', fiche: 'sc-chaleur', kind: 'ligne', xs, series, support,
    contexte: `${p} verse la même quantité d'eau chaude, à ${T0} °C, dans ${mats.length} pots identiques. Un pot reste sans rien ; les autres sont entourés ${listeOu(deDes(isos))}. La classe est à ${Ta} °C. Toutes les ${pas} minutes, ${il(p)} mesure la température de l'eau.`,
    titre: 'Température de l\'eau dans les pots', xTitre: 'Temps (min)', yTitre: 'Température (°C)', yNom: 'la température de l\'eau', unite: '°C', uniteMot: 'degrés',
    yMin: Math.floor(Math.min(...series.flatMap((x) => x.v)) / 10) * 10, yMax: T0, yPas: 2, yEtiq: 10,
    quand: (x) => (x === 0 ? 'au départ' : `après ${x} minutes`), objet: (n) => `du pot « ${n} »`, sens: 'baisse',
    borne: (x) => (x === 0 ? 'le départ' : `la ${x}e minute`),
    plus: { q: 'dans quel pot l\'eau est-elle', haut: 'la plus chaude', bas: 'la moins chaude' },
    ftable: (n) => n,
    specs: {
      cause: QCM_ISOLANT_CHAUD(iso),
      conclusion: {
        enonce: 'Quelle conclusion peut-on tirer de cette expérience ?',
        bonne: `Parmi les matériaux testés, ${meilleur.nom === 'Laine' ? 'la laine' : meilleur.nom === 'Polystyrène' ? 'le polystyrène' : 'le papier journal'} garde le mieux l'eau chaude : c'est le meilleur isolant thermique.`,
        faux: ['Le pot sans rien garde l\'eau chaude le plus longtemps.', 'Entourer un pot fait refroidir l\'eau plus vite.', 'Tous les pots refroidissent exactement à la même vitesse.'],
        pourquoi: `Après ${xs[6]} minutes, c'est dans le pot « ${meilleur.nom} » que l'eau est la plus chaude (${meilleur.v[6]} °C) : ce matériau ralentit le mieux la perte de chaleur.`,
      },
      demarche: {
        enonce: 'Pour que la comparaison entre les pots soit juste, qu\'est-ce qui doit être pareil pour tous les pots ?',
        bonne: 'La quantité d\'eau et sa température de départ.',
        faux: ['Le matériau autour du pot.', 'Seulement la quantité d\'eau : sa température de départ peut changer.', 'La température de l\'eau à la fin.'],
        pourquoi: 'Dans une expérience juste, on ne change qu\'une seule chose à la fois (ici, le matériau autour du pot). Tout le reste doit être identique.',
        fiche: 'sc-demarche',
      },
      tendance: {
        enonce: 'Si on attend plusieurs heures, quelle sera environ la température de l\'eau du pot « Sans rien » ?',
        bonne: `Environ ${Ta} °C, la température de la classe.`,
        faux: ['0 °C, comme de la glace.', `Toujours ${T0} °C.`, `Moins de ${Ta - 10} °C, plus froid que la classe.`],
        pourquoi: `L'eau perd de la chaleur tant qu'elle est plus chaude que l'air autour. Elle s'arrête de refroidir quand elle est à la même température que la classe (${Ta} °C).`,
      },
    },
  };
}

function expGlacon(rng, support) {
  const p = rng.pick(PRENOMS); const mats = avecIsolants(rng);
  const vals = mats.map((m) => rnd(rng.int(m.fonte[0], m.fonte[1]), 5));
  const iso = rng.pick(mats.slice(1).map((m) => m.nom));
  const le = (n) => MAT(n).le;
  return {
    id: 'glacon', domaine: 'sc.energie', fiche: 'sc-chaleur', kind: 'barres', support,
    cats: mats.map((m) => m.nom), vals,
    contexte: `${p} place des glaçons identiques dans de petits pots, dans la même pièce. Un pot reste sans rien ; les autres sont entourés ${listeOu(deDes(mats.slice(1).map((m) => m.nom)))}. ${maj(il(p))} note après combien de minutes chaque glaçon a complètement fondu.`,
    titre: 'Durée de fonte des glaçons', yTitre: 'Durée (min)', unite: 'min', uniteMot: 'minutes', yNom: 'la durée de fonte',
    lire: (c) => `Après combien de minutes le glaçon du pot « ${c} » a-t-il complètement fondu ?`,
    plus: { q: 'Quel glaçon a fondu', haut: 'le plus lentement', bas: 'le plus vite' },
    ecart: (a, b) => `Combien de minutes de plus le glaçon du pot « ${b} » a-t-il mis à fondre que celui du pot « ${a} » ?`,
    specs: {
      cause: {
        enonce: `Pourquoi le glaçon du pot « ${iso} » fond-il plus lentement que celui du pot « Sans rien » ?`,
        bonne: `${le(iso)} est un isolant thermique : ${MAT(iso).pr} ralentit le passage de la chaleur de l'air vers le glaçon.`,
        faux: [`${le(iso)} produit du froid.`, `${le(iso)} est un bon conducteur thermique.`, `${le(iso)} réchauffe le glaçon.`],
        pourquoi: 'La chaleur passe de l\'air (plus chaud) vers le glaçon (plus froid). Un isolant ralentit ce passage : le glaçon reçoit la chaleur moins vite et fond plus lentement.',
      },
      conclusion: {
        enonce: 'Quelle conclusion peut-on tirer de cette expérience ?',
        bonne: 'Un isolant thermique ne sert pas seulement à garder au chaud : il garde aussi au froid ce qui est froid.',
        faux: ['Un isolant sert seulement à garder au chaud.', 'Un glaçon emballé fond plus vite qu\'un glaçon sans rien.', 'Le matériau autour du glaçon ne change rien.'],
        pourquoi: 'Les glaçons entourés d\'un isolant ont fondu plus lentement : l\'isolant ralentit le passage de la chaleur dans les deux sens.',
      },
      demarche: {
        enonce: 'Pour que l\'expérience soit juste, qu\'est-ce qui doit être pareil pour tous les pots ?',
        bonne: 'La taille des glaçons et l\'endroit où sont posés les pots.',
        faux: ['Le matériau autour du pot.', 'Seulement la taille des glaçons : les pots peuvent être dans des pièces différentes.', 'La durée de fonte.'],
        pourquoi: 'On ne change qu\'une seule chose à la fois : le matériau. Les glaçons doivent être identiques et les pots placés dans la même pièce.',
        fiche: 'sc-demarche',
      },
    },
  };
}

function expSoleil(rng, support) {
  const p = rng.pick(PRENOMS); const T0 = rng.pick([14, 16, 18]); const xs = [0, 20, 40, 60, 80, 100, 120];
  const couleur = rng.next() < 0.5; const r = support === 'graphique' ? 2 : 1;
  const courbe = (E, k0) => {
    for (let essai = 0; essai < 25; essai++) {
      const k = k0 * jit(rng, 0.8, 1.2); const v = xs.map((t) => rnd(E - (E - T0) * Math.exp(-k * t), r));
      if (reguliere(v, r)) return v;
    }
    return null;
  };
  let series; let contexte; let cause; let demarche;
  if (couleur) {
    series = [{ nom: 'Bouteille noire', v: courbe(T0 + rng.int(26, 30), 0.022) }, { nom: 'Bouteille blanche', v: courbe(T0 + rng.int(13, 16), 0.02) }];
    if (rng.next() < 0.5) {
      // Deux bouteilles blanches : on précise toujours où elles sont pour lever l'ambiguïté.
      series = [{ nom: 'Noire au soleil', v: series[0].v }, { nom: 'Blanche au soleil', v: series[1].v }, { nom: 'Blanche à l\'ombre', v: courbe(T0 + rng.int(4, 6), 0.02) }];
    }
    contexte = `${p} remplit des bouteilles identiques avec la même quantité d'eau à ${T0} °C. ${series.length === 3 ? 'Une bouteille noire et une bouteille blanche sont posées au soleil, une autre bouteille blanche à l\'ombre.' : 'Une bouteille noire et une bouteille blanche sont posées côte à côte au soleil.'} Toutes les 20 minutes, ${il(p)} mesure la température de l'eau.`;
    cause = {
      enonce: `Pourquoi l'eau de la bouteille noire se réchauffe-t-elle plus que celle de la bouteille blanche${series.length === 3 ? ' posée au soleil' : ''} ?`,
      bonne: 'La bouteille noire absorbe davantage la lumière du Soleil ; la blanche en renvoie une grande partie.',
      faux: ['La bouteille noire contient plus d\'eau.', 'Le noir attire l\'air chaud qui se trouve autour de la bouteille.', 'Le blanc garde l\'eau au frais, comme un frigo.'],
      pourquoi: 'La lumière absorbée par la bouteille est transformée en énergie thermique (chaleur). Une surface noire absorbe plus de lumière qu\'une surface blanche.',
    };
    demarche = { faux: ['La couleur des bouteilles.', 'Seulement la quantité d\'eau : sa température de départ peut être différente.', 'La température de l\'eau à la fin.'],
      teste: series.length === 3 ? 'la couleur (bouteilles noire et blanche au soleil) ou l\'endroit (deux bouteilles blanches, au soleil et à l\'ombre)' : 'la couleur de la bouteille' };
  } else {
    series = [{ nom: 'Au soleil', v: courbe(T0 + rng.int(20, 25), 0.02) }, { nom: 'À l\'ombre', v: courbe(T0 + rng.int(4, 6), 0.02) }];
    contexte = `${p} remplit deux bouteilles identiques avec la même quantité d'eau à ${T0} °C. ${maj(il(p))} pose une bouteille au soleil et l'autre à l'ombre. Toutes les 20 minutes, ${il(p)} mesure la température de l'eau.`;
    cause = {
      enonce: 'Pourquoi l\'eau de la bouteille au soleil devient-elle plus chaude ?',
      bonne: 'La lumière du Soleil est absorbée par la bouteille et l\'eau, et transformée en énergie thermique.',
      faux: ['L\'air est plus chaud au soleil ; la lumière, elle, ne joue aucun rôle.', 'La bouteille au soleil contient plus d\'eau.', 'À l\'ombre, l\'eau s\'évapore et emporte sa chaleur.'],
      pourquoi: 'L\'énergie lumineuse du Soleil se transforme en énergie thermique quand elle est absorbée : l\'eau se réchauffe. À l\'ombre, elle reçoit beaucoup moins de lumière.',
    };
    demarche = { faux: ['L\'endroit où on pose la bouteille.', 'Seulement la quantité d\'eau : sa température de départ peut être différente.', 'La température de l\'eau à la fin.'], teste: 'l\'endroit (soleil ou ombre)' };
  }
  if (series.some((x) => !x.v)) return null;
  const max = Math.max(...series.flatMap((s) => s.v));
  return {
    id: 'soleil', domaine: 'sc.energie', fiche: 'sc-chaleur', kind: 'ligne', xs, series, support, contexte,
    titre: 'Température de l\'eau des bouteilles', xTitre: 'Temps (min)', yTitre: 'Température (°C)', yNom: 'la température de l\'eau', unite: '°C', uniteMot: 'degrés',
    yMin: Math.floor((T0 - 2) / 4) * 4, yMax: Math.ceil((max + 1) / 4) * 4, yPas: 2, yEtiq: 4,
    quand: (x) => (x === 0 ? 'au départ' : `après ${x} minutes`), objet: (n) => (n.startsWith('Bouteille') ? `de la ${n.toLowerCase()}` : `de la bouteille ${n === 'Au soleil' ? 'au soleil' : n === 'À l\'ombre' ? 'à l\'ombre' : n.toLowerCase()}`), sens: 'hausse',
    borne: (x) => (x === 0 ? 'le départ' : `la ${x}e minute`), egal: 'Les deux ont la même température',
    plus: { q: 'quelle bouteille contient l\'eau', haut: 'la plus chaude', bas: 'la moins chaude' },
    specs: {
      cause,
      demarche: {
        enonce: `Pour que la comparaison soit juste, qu'est-ce qui doit être pareil pour ${series.length === 2 ? 'les deux bouteilles' : 'toutes les bouteilles'} ?`,
        bonne: 'La quantité d\'eau, la taille des bouteilles et la température de départ.',
        faux: demarche.faux,
        pourquoi: `Entre deux bouteilles que l'on compare, on ne change qu'une seule chose : ici, ${demarche.teste}. Tout le reste doit rester identique.`,
        fiche: 'sc-demarche',
      },
    },
  };
}

function expPouls(rng) {
  const deux = rng.next() < 0.45;
  const noms = deux ? rng.shuffle(PRENOMS).slice(0, 2) : [rng.pick(PRENOMS)];
  const a = rng.pick([2, 3]); const d = rng.pick([3, 4]); const b = a + d; const xs = Array.from({ length: 13 }, (_, i) => i);
  const courbe = () => {
    const R = rng.pick([70, 80, 90]); const M = rng.pick([140, 150, 160, 170]);
    return xs.map((t) => {
      if (t <= a) return R;
      if (t === a + 1) return rnd(R + (M - R) * 0.6, 10);
      if (t <= b) return M;
      const f = [0, 0.45, 0.7, 0.88][t - b] ?? 1;
      return rnd(M - (M - R) * f, 10);
    });
  };
  const series = noms.map((n) => ({ nom: n, v: courbe() }));
  const p = noms[0];
  return {
    id: 'pouls', domaine: 'sc.vivant', fiche: 'sc-effort', kind: 'ligne', xs, series, support: 'graphique',
    contexte: deux
      ? `${noms[0]} et ${noms[1]} mesurent leur rythme cardiaque chaque minute : d'abord au repos, puis pendant une course de ${d} minutes, puis pendant la récupération.`
      : `${p} mesure son rythme cardiaque chaque minute : d'abord au repos, puis pendant une course de ${d} minutes, puis pendant la récupération.`,
    titre: 'Rythme cardiaque minute par minute', xTitre: 'Temps (min)', yTitre: 'Battements par minute', yNom: 'le rythme cardiaque', unite: 'battements par minute', uniteMot: 'battements par minute',
    yMin: 60, yMax: 180, yPas: 10, yEtiq: 20,
    masc: true, quand: (x) => `à la minute ${x}`, objet: (n) => `de ${n}`, sens: 'hausse', fixeDebut: 0,
    borne: (x) => `la minute ${x}`, egal: 'Les deux ont le même rythme cardiaque',
    plus: deux ? { q: 'qui a', haut: 'le rythme cardiaque le plus élevé', bas: 'le rythme cardiaque le moins élevé' } : null,
    specs: {
      cause: {
        enonce: `Pourquoi le rythme cardiaque de ${p} augmente-t-il pendant la course ?`,
        bonne: 'Ses muscles travaillent plus : ils ont besoin de plus de dioxygène et de nutriments, que le sang leur apporte.',
        faux: ['Ses muscles rejettent moins de dioxyde de carbone.', 'Son cœur fabrique du dioxygène pour les muscles.', 'Le sang devient plus épais pendant la course.'],
        pourquoi: 'Pendant l\'effort, les muscles consomment plus de dioxygène et de nutriments et rejettent plus de dioxyde de carbone. Le cœur bat plus vite pour faire circuler le sang plus vite.',
      },
      conclusion: {
        enonce: 'Que montre la fin du graphique, après la course ?',
        bonne: 'Au repos, le rythme cardiaque redescend peu à peu jusqu\'à sa valeur de départ.',
        faux: ['Au repos, le rythme cardiaque descend bien en dessous de sa valeur de départ.', 'Le rythme cardiaque reste élevé toute la journée.', 'Le rythme cardiaque continue à monter.'],
        pourquoi: 'Quand l\'effort s\'arrête, les muscles ont de nouveau moins besoin de dioxygène : le cœur ralentit progressivement et revient à son rythme de repos.',
      },
    },
  };
}

function expPlante(rng, support) {
  const p = rng.pick(PRENOMS); const xs = [0, 2, 4, 6, 8, 10, 12, 14]; const r = support === 'graphique' ? 2 : 1;
  const Hl = rng.pick([12, 14, 16]); const Hd = Hl + rng.pick([8, 10, 12]);
  const s = (t) => { const u = Math.min(1, Math.max(0, (t - 2) / 12)); return u * u * (3 - 2 * u); };
  const series = [{ nom: 'À la lumière', v: xs.map((t) => rnd(Hl * s(t), r)) }, { nom: 'Dans le noir', v: xs.map((t) => rnd(Hd * s(t), r)) }];
  return {
    id: 'plante', domaine: 'sc.vivant', fiche: 'sc-plantes', kind: 'ligne', xs, series, support,
    contexte: `${p} sème des graines de haricot dans deux pots identiques, avec la même terre et le même arrosage. Un pot est près de la fenêtre (à la lumière), l'autre dans une armoire fermée (dans le noir). Tous les 2 jours, ${il(p)} mesure la hauteur des plantes. À la fin, les feuilles de la plante à la lumière sont vertes ; celles de la plante dans le noir sont jaunes et la tige est très fine.`,
    titre: 'Hauteur des plants de haricot', xTitre: 'Temps (jours)', yTitre: 'Hauteur (cm)', yNom: 'la hauteur', unite: 'cm', uniteMot: 'centimètres',
    yMin: 0, yMax: Math.ceil((Hd + 1) / 4) * 4, yPas: 2, yEtiq: 4,
    quand: (x) => (x === 0 ? 'au départ' : `au jour ${x}`), objet: (n) => `de la plante « ${n} »`, sens: 'hausse', minX: 6,
    borne: (x) => `le jour ${x}`, egal: 'Les deux ont la même hauteur',
    note: 'Ce n\'est pas une erreur : dans le noir, la jeune plante s\'allonge vite grâce aux réserves de la graine, mais elle reste jaune et fragile.',
    plus: { q: 'quelle plante est', haut: 'la plus haute', bas: 'la moins haute' },
    specs: {
      conclusion: {
        enonce: 'Que peut-on conclure de cette expérience ?',
        bonne: 'Dans le noir, la plante pousse en hauteur mais reste jaune et fragile : sans lumière, elle ne peut pas fabriquer sa nourriture.',
        faux: ['La plante dans le noir est en meilleure santé, car elle est plus haute.', 'Les plantes n\'ont pas besoin de lumière pour vivre.', 'Dans le noir, la plante fabrique plus de nourriture.'],
        pourquoi: 'Une plante verte fabrique sa nourriture grâce à la lumière (photosynthèse). Dans le noir, elle s\'allonge en utilisant les réserves de la graine, mais elle reste jaune ; quand les réserves sont épuisées, elle meurt.',
      },
      demarche: {
        enonce: 'Dans cette expérience, quelle est la seule chose qui change entre les deux pots ?',
        bonne: 'La lumière.',
        faux: ['La sorte de graines.', 'La quantité d\'eau.', 'La terre.'],
        pourquoi: 'Pour savoir si la lumière a un effet, on garde tout identique (graines, terre, arrosage) et on ne change que la lumière.',
        fiche: 'sc-demarche',
      },
    },
  };
}

function expGermination(rng, support) {
  const p = rng.pick(PRENOMS); const g = rng.pick(['haricot', 'radis', 'cresson']);
  const vals = [rng.int(0, 2), rng.int(7, 13), rng.int(16, 20)];
  const cats = ['Frigo (4 °C)', 'Cave (12 °C)', 'Classe (21 °C)'];
  return {
    id: 'germination', domaine: 'sc.vivant', fiche: 'sc-plantes', kind: 'barres', support, cats, vals,
    contexte: `${p} place 20 graines de ${g} sur du coton mouillé dans trois boîtes fermées (dans le noir). Une boîte est mise au frigo, une à la cave et une en classe. Après 7 jours, ${il(p)} compte les graines qui ont germé.`,
    titre: 'Graines germées (sur 20) après 7 jours', yTitre: 'Nombre de graines', unite: 'graines', uniteMot: 'graines', yNom: 'le nombre de graines germées',
    lire: (c) => `Combien de graines ont germé dans la boîte « ${c} » ?`,
    plus: { q: 'Dans quelle boîte les graines ont-elles germé', haut: 'le mieux', bas: 'le moins bien' },
    ecart: (a, b) => `Combien de graines de plus ont germé dans la boîte « ${b} » que dans la boîte « ${a} » ?`,
    specs: {
      conclusion: {
        enonce: 'Que peut-on conclure de cette expérience ?',
        bonne: 'La chaleur favorise la germination : au froid, presque aucune graine ne germe.',
        faux: ['Les graines germent mieux au froid.', 'La température ne change rien à la germination.', 'Les graines ont besoin de lumière pour germer.'],
        pourquoi: `Les trois boîtes ne diffèrent que par la température : c'est en classe (21 °C) que le plus de graines ont germé (${vals[2]}), au frigo presque aucune (${vals[0]}). Pour germer, une graine a besoin d'eau, d'air et de chaleur.`,
      },
      demarche: {
        enonce: 'Pour que l\'expérience soit juste, qu\'est-ce qui doit être pareil dans les trois boîtes ?',
        bonne: 'Le nombre et la sorte de graines, et l\'humidité du coton.',
        faux: ['La température.', 'Seulement le nombre de graines : le coton peut être plus ou moins mouillé.', 'Le nombre de graines germées.'],
        pourquoi: 'On veut savoir si la température a un effet : c\'est la seule chose qui change. Tout le reste reste identique.',
        fiche: 'sc-demarche',
      },
    },
  };
}

function figureDe(ds) {
  if (ds.kind === 'barres') {
    if (ds.support === 'tableau') return svgTableau({ titre: ds.titre, entetes: [ds.id === 'germination' ? 'Boîte' : 'Pot', ds.yTitre], lignes: ds.cats.map((c, i) => [c, fmt(ds.vals[i])]) });
    const m = Math.max(...ds.vals); const pas = m > 60 ? 20 : m > 30 ? 10 : 5;
    return svgBarres({ titre: ds.titre, cats: ds.cats, vals: ds.vals, yTitre: ds.yTitre, yMax: Math.ceil((m + 1) / pas) * pas, yPas: pas });
  }
  if (ds.support === 'tableau') {
    return svgTableau({ titre: ds.titre, entetes: [ds.xTitre, ...ds.xs.map((x) => fmt(x))], lignes: ds.series.map((s) => [s.nom, ...s.v.map((v) => fmt(v))]) });
  }
  return svgCourbes({ titre: ds.titre, xs: ds.xs, series: ds.series, xTitre: ds.xTitre, yTitre: ds.yTitre, yMin: ds.yMin, yMax: ds.yMax, yPas: ds.yPas, yEtiq: ds.yEtiq });
}
const leSupport = (ds) => (ds.support === 'tableau' ? 'le tableau' : 'le graphique');
const valeursCle = (ds) => (ds.kind === 'barres' ? ds.cats.map((c, i) => `${c}=${ds.vals[i]}`).join(';') : ds.series.map((s) => `${s.nom}=${s.v.join(',')}`).join(';'));

function questionReleve(ds, rng) {
  const formes = ['lire', 'lire', 'plus', 'ecart', 'variation', ...Object.keys(ds.specs)];
  const f = rng.pick(formes);
  const sup = leSupport(ds);
  const base = { figure: figureDe(ds), domaine: ds.domaine };
  const cle = `${ds.id}|${ds.support}|${valeursCle(ds)}`;
  if (ds.kind === 'barres') {
    const n = ds.cats.length;
    if (f === 'lire' || f === 'variation') {
      const i = rng.int(0, n - 1);
      return { ...base, type: 'numerique', reponse: ds.vals[i], unite: ds.unite, fiche: 'sc-lire-donnees',
        enonce: `${ds.contexte} Observe ${sup}. ${ds.lire(ds.cats[i])}`,
        explication: `On repère « ${ds.cats[i]} » dans ${sup} et on lit la valeur : ${fmt(ds.vals[i])} ${ds.uniteMot}.`, _signature: `${cle}|lire|${i}` };
    }
    if (f === 'plus') {
      const haut = rng.next() < 0.5; const ext = haut ? Math.max(...ds.vals) : Math.min(...ds.vals);
      if (ds.vals.filter((v) => v === ext).length > 1) return null;
      const i = ds.vals.indexOf(ext);
      return { ...base, ...qcm(rng, ds.cats[i], ds.cats.filter((_, k) => k !== i)), fiche: 'sc-lire-donnees',
        enonce: `${ds.contexte} Observe ${sup}. ${ds.plus.q} ${haut ? ds.plus.haut : ds.plus.bas} ?`,
        explication: `${haut ? 'La plus grande' : 'La plus petite'} valeur est ${fmt(ext)} ${ds.uniteMot}, pour « ${ds.cats[i]} ».`, _signature: `${cle}|plus|${haut}` };
    }
    if (f === 'ecart') {
      const [i, j] = rng.shuffle([...Array(n).keys()]).slice(0, 2).sort((x, y) => ds.vals[x] - ds.vals[y]);
      const d = ds.vals[j] - ds.vals[i]; if (d <= 0) return null;
      return { ...base, type: 'numerique', reponse: d, unite: ds.unite, fiche: 'sc-lire-donnees',
        enonce: `${ds.contexte} Observe ${sup}. ${ds.ecart(ds.cats[i], ds.cats[j])}`,
        explication: `« ${ds.cats[j]} » : ${fmt(ds.vals[j])} ; « ${ds.cats[i]} » : ${fmt(ds.vals[i])}. Différence : ${fmt(ds.vals[j])} − ${fmt(ds.vals[i])} = ${fmt(d)} ${ds.uniteMot}.`, _signature: `${cle}|ecart|${i}|${j}` };
    }
  } else {
    const xs = ds.xs; const S = ds.series;
    const ixMin = ds.minX ? xs.indexOf(ds.minX) : 1;
    if (f === 'lire') {
      const s = rng.pick(S); const i = rng.int(ixMin, xs.length - 1);
      const quoi = ds.support === 'tableau' ? `la ligne « ${s.nom} »` : `la courbe « ${s.nom} »`;
      return { ...base, type: 'numerique', reponse: s.v[i], unite: ds.unite, fiche: 'sc-lire-donnees',
        enonce: `${ds.contexte} Observe ${sup}. ${ds.masc ? 'Quel' : 'Quelle'} est ${ds.yNom} ${ds.objet(s.nom)} ${ds.quand(xs[i])} ?`,
        explication: `On suit ${quoi} jusqu'à ${fmt(xs[i])} sur l'axe du temps et on lit : ${fmt(s.v[i])} ${ds.unite}.`, _signature: `${cle}|lire|${s.nom}|${i}` };
    }
    if (f === 'plus' && ds.plus && S.length >= 2) {
      const haut = rng.next() < 0.5; const i = rng.int(Math.max(ixMin, 2), xs.length - 1);
      const vals = S.map((s) => s.v[i]); const ext = haut ? Math.max(...vals) : Math.min(...vals);
      if (vals.filter((v) => v === ext).length > 1) return null;
      const bon = S[vals.indexOf(ext)];
      const r = qcm(rng, bon.nom, S.filter((s) => s !== bon).map((s) => s.nom).concat(S.length === 2 ? [ds.egal ?? 'Les deux sont égales'] : []));
      if (!r) return null;
      const q = `${maj(ds.quand(xs[i]))}, ${ds.plus.q} ${haut ? ds.plus.haut : ds.plus.bas} ?`;
      return { ...base, ...r, fiche: 'sc-lire-donnees',
        enonce: `${ds.contexte} Observe ${sup}. ${q}`,
        explication: `${maj(ds.quand(xs[i]))} : ${S.map((s) => `« ${s.nom} » ${fmt(s.v[i])} ${ds.unite}`).join(', ')}. ${haut ? 'La plus grande' : 'La plus petite'} valeur est pour « ${bon.nom} ».${ds.note ? ` ${ds.note}` : ''}`, _signature: `${cle}|plus|${haut}|${i}` };
    }
    if ((f === 'ecart' || f === 'plus') && S.length >= 2) {
      const [a, b] = rng.shuffle(S).slice(0, 2); const i = rng.int(Math.max(ixMin, 2), xs.length - 1);
      const [h, l] = a.v[i] >= b.v[i] ? [a, b] : [b, a]; const d = h.v[i] - l.v[i];
      if (d <= 0) return null;
      return { ...base, type: 'numerique', reponse: d, unite: ds.unite, fiche: 'sc-lire-donnees',
        enonce: `${ds.contexte} Observe ${sup}. ${maj(ds.quand(xs[i]))}, quelle est la différence entre ${ds.yNom} ${ds.objet(h.nom)} et ${ds.masc ? 'celui' : 'celle'} ${ds.objet(l.nom)} ?`,
        explication: `${maj(ds.quand(xs[i]))} : « ${h.nom} » ${fmt(h.v[i])} ${ds.unite} et « ${l.nom} » ${fmt(l.v[i])} ${ds.unite}. Différence : ${fmt(h.v[i])} − ${fmt(l.v[i])} = ${fmt(d)} ${ds.uniteMot}.${ds.note ? ` ${ds.note}` : ''}`, _signature: `${cle}|ecart|${h.nom}|${l.nom}|${i}` };
    }
    if (f === 'variation' || f === 'ecart' || f === 'plus') {
      const s = rng.pick(S); const i0 = ds.fixeDebut ?? 0; const i1 = rng.int(Math.max(ixMin, 2), xs.length - 1);
      const d = Math.abs(s.v[i1] - s.v[i0]); if (d === 0) return null;
      const verbe = s.v[i1] > s.v[i0] ? 'augmenté' : 'baissé';
      return { ...base, type: 'numerique', reponse: d, unite: ds.unite, fiche: 'sc-lire-donnees',
        enonce: `${ds.contexte} Observe ${sup}. De combien ${ds.yNom} ${ds.objet(s.nom)} a-t-${ds.masc ? 'il' : 'elle'} ${verbe} entre ${ds.borne(xs[i0])} et ${ds.borne(xs[i1])} ?`,
        explication: `${maj(ds.quand(xs[i0]))} : ${fmt(s.v[i0])} ${ds.unite} ; ${ds.quand(xs[i1])} : ${fmt(s.v[i1])} ${ds.unite}. ${fmt(Math.max(s.v[i0], s.v[i1]))} − ${fmt(Math.min(s.v[i0], s.v[i1]))} = ${fmt(d)} ${ds.uniteMot}.`, _signature: `${cle}|var|${s.nom}|${i1}` };
    }
  }
  const sp = ds.specs[f];
  if (!sp) return null;
  const r = qcm(rng, sp.bonne, sp.faux);
  return { ...base, ...r, fiche: sp.fiche ?? ds.fiche,
    enonce: `${ds.contexte} Observe ${sup}. ${sp.enonce}`,
    explication: `${sp.bonne} ${sp.pourquoi}`, _signature: `${cle}|${f}|${sp.bonne}` };
}

export function genererReleves(modele, rng) {
  const sup = rng.next() < 0.6 ? 'graphique' : 'tableau';
  const exps = [expRefroid, expRefroid, expGlacon, expSoleil, expSoleil, expPouls, expPlante, expGermination];
  const ds = rng.pick(exps)(rng, sup);
  if (!ds) return null;
  const q = questionReleve(ds, rng);
  if (!q) return null;
  q.cleContenu = q._signature;
  return q;
}

// ================================================================ 2. EFFORT : POULS ET VENTILATION
const DUREES = [{ s: 15, k: 4 }, { s: 15, k: 4 }, { s: 10, k: 6 }, { s: 20, k: 3 }, { s: 30, k: 2 }];

export function genererEffort(modele, rng) {
  const p = rng.pick(PRENOMS); const e = il(p);
  const forme = rng.pick(['pouls', 'pouls', 'ventil', 'moyenne', 'moyenne', 'moyPouls', 'hausse', 'tableau', 'pourquoi', 'pourquoi', 'vocab', 'mesure', 'vf', 'vf']);
  const apres = rng.next() < 0.5;
  const sport = rng.pick(['après avoir couru 5 minutes', 'après 30 sauts à la corde', 'juste après une course', 'après avoir monté les escaliers en courant', 'après 2 minutes de sauts en étoile']);
  const moment = apres ? sport : 'au repos, assis' + (FILLES.includes(p) ? 'e' : '');
  if (forme === 'pouls') {
    const { s, k } = rng.pick(DUREES);
    const bpm = apres ? rng.int(30, 44) * 4 : rng.int(18, 25) * 4;
    if (bpm % k) return null;
    const n = bpm / k;
    return { type: 'numerique', reponse: bpm, unite: 'battements par minute',
      enonce: `${p} pose deux doigts sur son poignet, ${moment}. Avec un chronomètre, ${e} compte ${n} battements en ${s} secondes. Quel est son rythme cardiaque, en battements par minute ?`,
      explication: `1 minute = 60 secondes = ${k} × ${s} secondes. Donc ${n} × ${k} = ${bpm} battements par minute.`, _signature: `pouls|${apres}|${n}|${s}` };
  }
  if (forme === 'ventil') {
    const { s, k } = rng.pick(DUREES.filter((d) => d.s !== 10));
    const vpm = apres ? rng.int(28, 44) : rng.int(14, 22);
    if (vpm % k) return null;
    const n = vpm / k;
    return { type: 'numerique', reponse: vpm, unite: 'mouvements par minute',
      enonce: `${moment.startsWith('au repos') ? `Au repos, ${p}` : `${maj(sport)}, ${p}`} compte combien de fois sa poitrine se soulève : ${n} fois en ${s} secondes. Combien de mouvements respiratoires fait-${e} par minute ?`,
      explication: `1 minute = ${k} × ${s} secondes. ${n} × ${k} = ${vpm} mouvements respiratoires par minute : c'est sa ventilation.`, _signature: `ventil|${apres}|${n}|${s}` };
  }
  if (forme === 'moyenne' || forme === 'moyPouls') {
    const pouls = forme === 'moyPouls' || rng.next() < 0.5;
    let m; let d1; let d2;
    if (forme === 'moyPouls') { m = apres ? rng.int(30, 42) : rng.int(18, 24); d1 = rng.int(-2, 2); d2 = rng.int(-2, 2); } else if (pouls) { m = apres ? rng.int(120, 170) : rng.int(72, 92); d1 = rng.int(-4, 4); d2 = rng.int(-4, 4); } else { m = apres ? rng.int(28, 42) : rng.int(14, 22); d1 = rng.int(-2, 2); d2 = rng.int(-2, 2); }
    const vals = [m + d1, m + d2, m - d1 - d2];
    if (new Set(vals).size < 2) return null;
    const somme = vals[0] + vals[1] + vals[2];
    if (forme === 'moyPouls') {
      return { type: 'numerique', reponse: m * 4, unite: 'battements par minute', difficulte: 3,
        enonce: `${p} compte ses battements de cœur pendant 15 secondes, ${moment}. ${maj(e)} recommence 3 fois et trouve ${vals.join(', ')} battements. Quel est son rythme cardiaque moyen, en battements par minute ?`,
        explication: `Moyenne sur 15 s : (${vals.join(' + ')}) : 3 = ${somme} : 3 = ${m}. Sur 1 minute (4 × 15 s) : ${m} × 4 = ${m * 4} battements par minute.`, _signature: `moyP|${vals.join(',')}` };
    }
    const unite = pouls ? 'battements par minute' : 'mouvements par minute';
    return { type: 'numerique', reponse: m, unite,
      enonce: `Pour avoir un résultat fiable, ${p} mesure 3 fois ${pouls ? 'son rythme cardiaque' : 'sa ventilation'} ${moment} : ${vals.join(', ')} ${unite}. Quelle est la moyenne de ces 3 mesures ?`,
      explication: `Moyenne = somme des mesures : nombre de mesures = (${vals.join(' + ')}) : 3 = ${somme} : 3 = ${m} ${unite}.`, _signature: `moy|${pouls}|${apres}|${vals.join(',')}` };
  }
  if (forme === 'hausse') {
    const pouls = rng.next() < 0.6;
    const a = pouls ? rng.int(68, 96) : rng.int(14, 22); const b = pouls ? rng.int(120, 175) : rng.int(28, 44);
    const quoi = pouls ? 'rythme cardiaque' : 'ventilation'; const unite = pouls ? 'battements par minute' : 'mouvements par minute';
    return { type: 'numerique', reponse: b - a, unite,
      enonce: `Au repos, ${pouls ? 'le rythme cardiaque' : 'la ventilation'} de ${p} est de ${a} ${unite}. ${maj(sport)}, ${pouls ? 'il' : 'elle'} est de ${b} ${unite}. De combien ${pouls ? 'son rythme cardiaque' : 'sa ventilation'} a-t-${pouls ? 'il' : 'elle'} augmenté ?`,
      explication: `${b} − ${a} = ${b - a} ${unite}. Pendant l'effort, ${quoi === 'ventilation' ? 'on respire plus vite pour apporter plus de dioxygène et rejeter plus de dioxyde de carbone' : 'le cœur bat plus vite pour apporter plus de dioxygène et de nutriments aux muscles'}.`, _signature: `hausse|${pouls}|${a}|${b}` };
  }
  if (forme === 'tableau') {
    const pouls = rng.next() < 0.5; const unite = pouls ? 'battements par minute' : 'mouvements par minute';
    const gen = (lo, hi, d) => { const m = rng.int(lo, hi); const a = rng.int(-d, d); const b = rng.int(-d, d); return { m, v: [m + a, m + b, m - a - b] }; };
    const rep = pouls ? gen(70, 95, 3) : gen(14, 22, 2); const eff = pouls ? gen(120, 165, 4) : gen(28, 42, 2);
    const fig = svgTableau({ titre: elider(pouls ? `Rythme cardiaque de ${p} (battements/min)` : `Ventilation de ${p} (mouvements/min)`),
      entetes: ['', 'Mesure 1', 'Mesure 2', 'Mesure 3'], lignes: [['Au repos', ...rep.v.map(String)], ['Après l\'effort', ...eff.v.map(String)]] });
    const q = rng.pick(['repos', 'effort', 'diff']);
    const expl = (o, nom) => `Moyenne ${nom} : (${o.v.join(' + ')}) : 3 = ${o.v[0] + o.v[1] + o.v[2]} : 3 = ${o.m} ${unite}.`;
    if (q === 'diff') {
      return { type: 'numerique', reponse: eff.m - rep.m, unite, figure: fig, difficulte: 3,
        enonce: `${p} a mesuré 3 fois ${pouls ? 'son rythme cardiaque' : 'sa ventilation'} au repos, puis 3 fois après l'effort. Calcule la moyenne de chaque ligne du tableau. De combien la moyenne après l'effort dépasse-t-elle la moyenne au repos ?`,
        explication: `${expl(rep, 'au repos')} ${expl(eff, 'après l\'effort')} Différence : ${eff.m} − ${rep.m} = ${eff.m - rep.m} ${unite}.`, _signature: `tab|${pouls}|${rep.v}|${eff.v}|diff` };
    }
    const o = q === 'repos' ? rep : eff;
    return { type: 'numerique', reponse: o.m, unite, figure: fig,
      enonce: `${p} a mesuré 3 fois ${pouls ? 'son rythme cardiaque' : 'sa ventilation'} au repos, puis 3 fois après l'effort. Quelle est la moyenne des mesures ${q === 'repos' ? 'au repos' : 'après l\'effort'} ?`,
      explication: expl(o, q === 'repos' ? 'au repos' : 'après l\'effort'), _signature: `tab|${pouls}|${rep.v}|${eff.v}|${q}` };
  }
  if (forme === 'pourquoi') {
    const QS = [
      { e: `${maj(sport)}, le cœur de ${p} bat beaucoup plus vite qu'au repos. Pourquoi ?`, b: 'Ses muscles ont besoin de plus de dioxygène et de nutriments : le sang doit les apporter plus vite.',
        f: ['Ses muscles rejettent moins de dioxyde de carbone.', 'Son cœur fabrique du dioxygène pour les muscles.', 'Le sang devient plus épais pendant l\'effort.', 'Son cœur a besoin de plus d\'air que d\'habitude.'],
        x: 'Pendant l\'effort, les muscles travaillent davantage. Le sang leur apporte dioxygène et nutriments et emporte le dioxyde de carbone : le cœur bat plus vite pour accélérer la circulation.' },
      { e: `${maj(sport)}, ${p} respire plus vite et plus fort. Pourquoi ?`, b: 'Pour faire entrer plus de dioxygène dans le sang et rejeter plus de dioxyde de carbone.',
        f: ['Pour refroidir ses poumons.', 'Pour rejeter plus de dioxygène.', 'Pour faire entrer plus de dioxyde de carbone dans ses muscles.', 'Pour que son cœur reçoive directement de l\'air.'],
        x: 'Les muscles en effort consomment plus de dioxygène et produisent plus de dioxyde de carbone. La ventilation augmente pour les échanges avec le sang dans les alvéoles des poumons.' },
      { e: `Pourquoi ${p} mesure-t-${e} son rythme cardiaque 3 fois avant de calculer la moyenne ?`, b: 'Pour obtenir un résultat plus fiable, car une seule mesure peut contenir une erreur.',
        f: ['Pour garder ensuite la plus grande des trois mesures.', 'Parce que le cœur bat plus vite à chaque nouvelle mesure.', 'Pour que la moyenne soit plus grande qu\'une seule mesure.'],
        x: 'En science, on répète une mesure et on fait la moyenne : les petites erreurs (un battement oublié, un départ trop tard) se compensent.' },
      { e: `Après la course, ${p} se repose 10 minutes et reprend son pouls. Que va-t-${e} constater ?`, b: 'Son rythme cardiaque est redescendu vers sa valeur de repos.',
        f: ['Son rythme cardiaque est encore plus rapide qu\'à la fin de la course.', 'Son cœur ne bat plus du tout.', 'Son rythme cardiaque est devenu plus lent que jamais.'],
        x: 'Quand l\'effort s\'arrête, les muscles ont moins besoin de dioxygène et de nutriments : le cœur ralentit peu à peu jusqu\'à son rythme de repos.' },
      { e: `${p} compte ses battements de cœur pendant 15 secondes. Par combien doit-${e} multiplier ce nombre pour obtenir le rythme cardiaque par minute ?`, b: 'Par 4', f: ['Par 15', 'Par 60', 'Par 2', 'Par 6'],
        x: '1 minute = 60 secondes = 4 × 15 secondes : on multiplie le nombre de battements par 4.' },
      { e: `${p} compte ses battements de cœur pendant 10 secondes. Par combien doit-${e} multiplier ce nombre pour obtenir le rythme cardiaque par minute ?`, b: 'Par 6', f: ['Par 10', 'Par 60', 'Par 4', 'Par 3'],
        x: '1 minute = 60 secondes = 6 × 10 secondes : on multiplie le nombre de battements par 6.' },
      { e: `${p} compte ses mouvements respiratoires pendant 30 secondes. Par combien doit-${e} multiplier ce nombre pour obtenir sa ventilation par minute ?`, b: 'Par 2', f: ['Par 30', 'Par 4', 'Par 60', 'Par 6'],
        x: '1 minute = 60 secondes = 2 × 30 secondes : on multiplie par 2.' },
    ];
    const Q = rng.pick(QS);
    const r = qcm(rng, Q.b, rng.shuffle(Q.f).slice(0, 3));
    return { ...r, enonce: Q.e, explication: `${Q.b}${/[.!?]$/.test(Q.b) ? '' : '.'} ${Q.x}`, _signature: `pq|${Q.e}` };
  }
  if (forme === 'vocab') {
    const QS = [
      { e: 'Comment appelle-t-on le nombre de battements du cœur en une minute ?', b: 'Le rythme cardiaque', f: ['La ventilation', 'La respiration cellulaire', 'La tension', 'La digestion'] },
      { e: 'Comment appelle-t-on les mouvements de l\'air qui entre et sort des poumons (inspiration et expiration) ?', b: 'La ventilation', f: ['Le rythme cardiaque', 'La circulation', 'La digestion', 'L\'absorption'] },
      { e: 'Dans quelle unité exprime-t-on le rythme cardiaque ?', b: 'En battements par minute', f: ['En degrés', 'En litres', 'En kilomètres par heure', 'En mouvements par seconde'] },
      { e: 'Quel instrument faut-il pour mesurer le rythme cardiaque en comptant ses battements ?', b: 'Un chronomètre', f: ['Un thermomètre', 'Une balance', 'Un mètre ruban', 'Une loupe'] },
      { e: 'Où peut-on facilement sentir son pouls avec deux doigts ?', b: 'Au poignet ou sur le côté du cou', f: ['Sur le front', 'Sur le ventre', 'Sur le genou', 'Sur le dos de la main'] },
      { e: 'Que compte-t-on pour mesurer la ventilation ?', b: 'Le nombre de fois où la poitrine se soulève en une minute', f: ['Le nombre de battements du cœur en une minute', 'Le nombre de pas en une minute', 'Le nombre de fois où l\'on avale en une minute'] },
    ];
    const Q = rng.pick(QS);
    const r = qcm(rng, Q.b, rng.shuffle(Q.f).slice(0, 3));
    return { ...r, enonce: Q.e, explication: `${Q.b}. Le rythme cardiaque se mesure en battements par minute ; la ventilation en mouvements respiratoires par minute. On les mesure avec un chronomètre.`, _signature: `voc|${Q.e}` };
  }
  if (forme === 'mesure') {
    // Comparer deux enfants (lire et comparer des mesures).
    const [a, b] = rng.shuffle(PRENOMS).slice(0, 2);
    const ra = rng.int(70, 95); const rb = rng.int(70, 95); const ea = rng.int(125, 170); const eb = rng.int(125, 170);
    if (ea - ra === eb - rb) return null;
    const plus = ea - ra > eb - rb ? a : b;
    const r = qcm(rng, plus, [plus === a ? b : a, 'Les deux augmentent de la même façon']);
    return { ...r,
      enonce: `Rythmes cardiaques (en battements par minute). ${a} : ${ra} au repos et ${ea} après l'effort. ${b} : ${rb} au repos et ${eb} après l'effort. Chez qui le rythme cardiaque a-t-il le plus augmenté ?`,
      explication: `${a} : ${ea} − ${ra} = ${ea - ra}. ${b} : ${eb} − ${rb} = ${eb - rb}. Le rythme a le plus augmenté chez ${plus}.`, _signature: `cmp|${a}|${b}|${ra}|${ea}|${rb}|${eb}` };
  }
  const VF = [
    ['Pendant un effort, le cœur bat plus vite qu\'au repos.', true, 'Les muscles ont besoin de plus de dioxygène et de nutriments : le sang doit circuler plus vite.'],
    ['Pendant un effort, on respire moins souvent qu\'au repos.', false, 'On respire plus souvent et plus profondément : la ventilation augmente.'],
    ['Le rythme cardiaque se mesure avec un chronomètre, en comptant les battements.', true, 'On compte les battements pendant un temps mesuré au chronomètre (par exemple 15 s × 4 = 1 minute).'],
    ['Pour obtenir les battements par minute, on peut compter pendant 15 secondes puis multiplier par 4.', true, '4 × 15 s = 60 s = 1 minute.'],
    ['Pour obtenir les battements par minute, on compte pendant 15 secondes puis on multiplie par 15.', false, 'Il faut multiplier par 4, car 4 × 15 s = 60 s = 1 minute.'],
    ['Une seule mesure suffit toujours : il est inutile de faire une moyenne.', false, 'On répète la mesure (par exemple 3 fois) et on fait la moyenne pour avoir un résultat plus fiable.'],
    ['Après l\'effort, le rythme cardiaque redescend peu à peu vers sa valeur de repos.', true, 'Les muscles ont de nouveau moins besoin de dioxygène : le cœur ralentit.'],
    ['Pendant l\'effort, les muscles produisent plus de dioxyde de carbone, qui doit être évacué par les poumons.', true, 'Le sang transporte le dioxyde de carbone jusqu\'aux poumons, où il est rejeté à l\'expiration.'],
    ['Le cœur bat plus vite pendant l\'effort parce qu\'il fabrique du dioxygène.', false, 'Le cœur ne fabrique pas de dioxygène : il pompe le sang, qui transporte le dioxygène pris dans les poumons.'],
    ['La ventilation, c\'est le nombre de battements du cœur par minute.', false, 'La ventilation, ce sont les mouvements respiratoires (inspiration et expiration). Les battements du cœur, c\'est le rythme cardiaque.'],
  ];
  const [t, v, x] = rng.pick(VF);
  return { type: 'vrai_faux', reponse: v, enonce: `Vrai ou faux ? ${t}`, explication: `${v ? 'Vrai' : 'Faux'}. ${x}`, _signature: `vf|${t}` };
}

// ================================================================ 3 & 4. CLASSIFICATION
// Ensembles emboîtés (approche phylogénétique : attributs partagés).
const ENS = {
  racine: { parent: null, lignes: ['Animaux de la collection'] },
  si: { parent: 'racine', lignes: ['Squelette interne'], attr: 'un squelette interne', court: 'Un squelette interne', neg: "pas de squelette interne" },
  m4: { parent: 'si', lignes: ['4 membres'], attr: '4 membres', court: '4 membres', neg: "pas 4 membres" },
  po: { parent: 'm4', lignes: ['Poils'], attr: 'des poils', court: 'Des poils', neg: "pas de poils" },
  pl: { parent: 'm4', lignes: ['Plumes'], attr: 'des plumes', court: 'Des plumes', neg: "pas de plumes" },
  nr: { parent: 'si', lignes: ['Nageoires', 'rayonnées'], attr: 'des nageoires rayonnées', court: 'Des nageoires rayonnées', neg: "pas de nageoires rayonnées" },
  se: { parent: 'racine', lignes: ['Squelette externe,', 'pattes articulées'], attr: 'un squelette externe et des pattes articulées', court: 'Un squelette externe et des pattes articulées', neg: "ni squelette externe ni pattes articulées" },
  an: { parent: 'se', lignes: ['Antennes'], attr: 'des antennes', court: 'Des antennes', neg: "pas d'antennes" },
  p6: { parent: 'an', lignes: ['6 pattes'], attr: '6 pattes', court: '6 pattes', neg: "pas 6 pattes" },
  p8: { parent: 'se', lignes: ['8 pattes'], attr: '8 pattes', court: '8 pattes', neg: "pas 8 pattes" },
  pp: { parent: 'racine', lignes: ['Pied plat'], attr: 'un pied plat', court: 'Un pied plat', neg: "pas de pied plat" },
  co: { parent: 'pp', lignes: ['Coquille'], attr: 'une coquille', court: 'Une coquille', neg: "pas de coquille" },
  ar: { parent: 'racine', lignes: ['Corps mou', 'en anneaux'], attr: 'un corps mou en anneaux', court: 'Un corps mou en anneaux', neg: "pas de corps mou en anneaux" },
};
const ORDRE_ENS = Object.keys(ENS);
const chaineEns = (k) => { const out = []; for (let x = k; x && x !== 'racine'; x = ENS[x].parent) out.unshift(x); return out; };

// Animaux : article + nom, ensemble le plus petit (feuille) et groupe (pour les attributs).
const A = (art, nom, feuille, groupe, extra = {}) => ({ art, nom, feuille, groupe, ...extra });
const ANIMAUX = [
  A('le', 'chat', 'po', 'mam'), A('le', 'chien', 'po', 'mam'), A('le', 'lapin', 'po', 'mam'), A('le', 'cheval', 'po', 'mam'),
  A('la', 'vache', 'po', 'mam'), A('la', 'chauve-souris', 'po', 'mam', { note: 'ses ailes sont ses membres avant' }), A('le', 'renard', 'po', 'mam'),
  A('l\'', 'écureuil', 'po', 'mam'), A('la', 'taupe', 'po', 'mam'), A('le', 'cerf', 'po', 'mam'),
  A('le', 'pigeon', 'pl', 'ois'), A('la', 'poule', 'pl', 'ois'), A('le', 'merle', 'pl', 'ois'), A('le', 'canard', 'pl', 'ois'),
  A('le', 'manchot', 'pl', 'ois'), A('l\'', 'autruche', 'pl', 'ois'), A('la', 'chouette', 'pl', 'ois'), A('la', 'mésange', 'pl', 'ois'),
  A('la', 'grenouille', 'm4', 'amp'), A('le', 'crapaud', 'm4', 'amp'), A('la', 'salamandre', 'm4', 'amp'), A('le', 'triton', 'm4', 'amp'),
  A('le', 'lézard', 'm4', 'rep'), A('le', 'crocodile', 'm4', 'rep'),
  A('la', 'truite', 'nr', 'poi'), A('la', 'carpe', 'nr', 'poi'), A('le', 'brochet', 'nr', 'poi'), A('le', 'saumon', 'nr', 'poi'),
  A('la', 'perche', 'nr', 'poi'), A('le', 'hareng', 'nr', 'poi'),
  A('la', 'fourmi', 'p6', 'ins'), A('l\'', 'abeille', 'p6', 'ins'), A('la', 'coccinelle', 'p6', 'ins'), A('le', 'papillon', 'p6', 'ins'),
  A('la', 'mouche', 'p6', 'ins'), A('la', 'sauterelle', 'p6', 'ins'), A('la', 'libellule', 'p6', 'ins'), A('la', 'guêpe', 'p6', 'ins'), A('le', 'hanneton', 'p6', 'ins'),
  A('le', 'crabe', 'an', 'cru', { note: 'il a 10 pattes' }), A('la', 'crevette', 'an', 'cru', { note: 'elle a 10 pattes' }), A('le', 'homard', 'an', 'cru', { note: 'il a 10 pattes' }),
  A('l\'', 'écrevisse', 'an', 'cru', { note: 'elle a 10 pattes' }), A('le', 'cloporte', 'an', 'cru', { note: 'il a 14 pattes' }),
  A('l\'', 'araignée', 'p8', 'ara'), A('le', 'scorpion', 'p8', 'ara', { note: 'ses pinces ne sont pas des pattes' }), A('le', 'faucheux', 'p8', 'ara'),
  A('l\'', 'escargot', 'co', 'esc'), A('la', 'limace', 'pp', 'lim'),
  A('le', 'ver de terre', 'ar', 'ann'), A('la', 'sangsue', 'ar', 'ann'),
];
for (const a of ANIMAUX) if (a.groupe === 'ois') a.note = 'ses ailes sont ses membres avant';
const le = (a) => `${a.art}${a.art.endsWith('\'') ? '' : ' '}${a.nom}`;
const Le = (a) => maj(le(a));
const fem = (a) => a.art === 'la' || ['abeille', 'autruche', 'écrevisse', 'araignée'].includes(a.nom);
const ilA = (a) => (fem(a) ? 'elle' : 'il');

function attributsTexte(a) {
  const ch = chaineEns(a.feuille).flatMap((k) => (k === 'se' ? ['un squelette externe', 'des pattes articulées'] : [ENS[k].attr]));
  if (!ch.length) return 'aucun de ces attributs';
  return listeEt(ch);
}

// ---------- Mise en page des ensembles emboîtés
// noeud dessiné : { k, enfants, lettre?, noms[] } ; mesure puis place les rectangles.
const FS = 13; const LH = 16; const PAD = 8; const GAP = 8;
function mesurer(n, opts) {
  const lignes = n.etiquette;
  const lw = Math.max(...lignes.map((l) => largeur(l, FS) + (opts.gras ? 6 : 2)));
  n.enfants.forEach((e) => mesurer(e, opts));
  const horiz = n.k !== 'racine' || n.enfants.reduce((s, e) => s + e.w, 0) + GAP * (n.enfants.length - 1) <= 380;
  n.horiz = horiz;
  const cw = n.enfants.length ? (horiz ? n.enfants.reduce((s, e) => s + e.w, 0) + GAP * (n.enfants.length - 1) : Math.max(...n.enfants.map((e) => e.w))) : 0;
  const ch = n.enfants.length ? (horiz ? Math.max(...n.enfants.map((e) => e.h)) : n.enfants.reduce((s, e) => s + e.h, 0) + GAP * (n.enfants.length - 1)) : 0;
  // zone propre : noms des animaux (2 par ligne au plus) + lettre
  const lignesNoms = [];
  for (const nom of n.noms) {
    const der = lignesNoms[lignesNoms.length - 1];
    if (der && der.length < 2 && largeur([...der, nom].join(', '), 12) < Math.max(cw, 150) - 30) der.push(nom); else lignesNoms.push([nom]);
  }
  n.lignesNoms = lignesNoms.map((l) => l.join(', ') + (l === lignesNoms[lignesNoms.length - 1] ? '' : ','));
  const nw = n.lignesNoms.length ? Math.max(...n.lignesNoms.map((l) => largeur(l, 12))) : 0;
  const pied = Math.max(n.lettre ? 26 : 6, n.lignesNoms.length * 15 + 6);
  n.w = Math.max(lw, cw, nw + (n.lettre ? 30 : 0), n.lettre ? 60 : 40) + 2 * PAD;
  n.h = PAD + lignes.length * LH + 4 + (n.enfants.length ? ch + 6 : 0) + pied + 2;
  n.cw = cw; n.chh = ch;
}
function placer(n, x, y, w, h) {
  n.x = x; n.y = y; n.w2 = w; n.h2 = h;
  let cx = x + PAD; let cy = y + PAD + n.etiquette.length * LH + 4;
  if (n.horiz) {
    const total = n.enfants.reduce((s, e) => s + e.w, 0) + GAP * Math.max(0, n.enfants.length - 1);
    const extra = n.enfants.length ? (w - 2 * PAD - total) / n.enfants.length : 0;
    for (const e of n.enfants) { placer(e, cx, cy, e.w + extra, n.chh); cx += e.w + extra + GAP; }
  } else {
    for (const e of n.enfants) { placer(e, cx, cy, w - 2 * PAD, e.h); cy += e.h + GAP; }
  }
}
function dessiner(n, profondeur = 0) {
  const remp = ['#ffffff', '#f2f5fa', '#e6ecf5', '#dae3f0', '#cfdaeb'][Math.min(profondeur, 4)];
  let s = `<rect x="${n.x.toFixed(1)}" y="${n.y.toFixed(1)}" width="${n.w2.toFixed(1)}" height="${n.h2.toFixed(1)}" rx="8" fill="${remp}" stroke="${ENCRE}" stroke-width="1.5"/>`;
  n.etiquette.forEach((l, i) => {
    s += `<text x="${(n.x + PAD).toFixed(1)}" y="${(n.y + PAD + 12 + i * LH).toFixed(1)}" font-size="${FS}" font-weight="bold" fill="${ENCRE}">${esc(l)}</text>`;
  });
  for (const e of n.enfants) s += dessiner(e, profondeur + 1);
  const bas = n.y + n.h2;
  n.lignesNoms.forEach((l, i) => {
    s += `<text x="${(n.x + PAD).toFixed(1)}" y="${(bas - 8 - (n.lignesNoms.length - 1 - i) * 15).toFixed(1)}" font-size="12" font-style="italic" fill="${ENCRE}">${esc(l)}</text>`;
  });
  if (n.lettre) {
    const cx = n.x + n.w2 - 16; const cy = bas - 15;
    s += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="10" fill="#ffffff" stroke="${ENCRE}" stroke-width="1.4"/>`
      + `<text x="${cx.toFixed(1)}" y="${(cy + 4.5).toFixed(1)}" font-size="13" font-weight="bold" text-anchor="middle" fill="${ENCRE}">${n.lettre}</text>`;
  }
  return s;
}
function figureEnsembles(dessines, { lettres, noms, cache }) {
  const kids = (k) => ORDRE_ENS.filter((c) => dessines.has(c) && parentDessine(c, dessines) === k);
  const construire = (k) => ({ k, etiquette: k === cache ? ['?'] : ENS[k].lignes, lettre: lettres?.[k], noms: noms?.[k] ?? [], enfants: kids(k).map(construire) });
  const racine = construire('racine');
  mesurer(racine, {});
  placer(racine, 4, 4, racine.w, racine.h);
  const W = Math.ceil(racine.w + 8); const H = Math.ceil(racine.h + 8);
  return svg(W, H, dessiner(racine));
}
const parentDessine = (k, dessines) => { let x = ENS[k].parent; while (x !== 'racine' && !dessines.has(x)) x = ENS[x].parent; return x; };
const zoneDe = (a, dessines) => { let x = a.feuille; while (x !== 'racine' && !dessines.has(x)) x = ENS[x].parent; return x; };
const possede = (a, k) => k === 'racine' || chaineEns(a.feuille).includes(k);

function tirerScenario(rng) {
  const tops = rng.shuffle(['si', 'se', 'pp', 'ar']);
  let choisis = tops.slice(0, rng.int(2, 3));
  if (!choisis.includes('si') && !choisis.includes('se')) choisis[0] = rng.pick(['si', 'se']);
  const dessines = new Set(choisis);
  for (const k of ORDRE_ENS) {
    if (k === 'racine' || ENS[k].parent === 'racine') continue;
    const top = chaineEns(k)[0];
    if (dessines.has(top) && rng.next() < 0.7) dessines.add(k);
  }
  // Ne pas dépasser une largeur raisonnable : au plus 7 ensembles.
  while (dessines.size > 7) {
    const feuilles = [...dessines].filter((k) => ENS[k].parent !== 'racine' && ![...dessines].some((c) => ENS[c].parent === k));
    dessines.delete(rng.pick(feuilles));
  }
  return dessines;
}
function collection(rng, dessines, n) {
  // Au moins un animal dans chaque ensemble dessiné ; au plus un animal hors de tous les ensembles.
  const out = new Set();
  for (const k of dessines) {
    const cands = ANIMAUX.filter((a) => zoneDe(a, dessines) === k);
    if (cands.length) out.add(rng.pick(cands));
  }
  const hors = ANIMAUX.filter((a) => zoneDe(a, dessines) === 'racine');
  if (hors.length && rng.next() < 0.5) out.add(rng.pick(hors));
  const autres = rng.shuffle(ANIMAUX.filter((a) => zoneDe(a, dessines) !== 'racine'));
  for (const a of autres) { if (out.size >= n) break; out.add(a); }
  return [...out];
}
const LETTRES = 'ABCDEFGH';

export function genererEmboites(modele, rng) {
  const forme = rng.pick(['zone', 'zone', 'quiZone', 'etiquette', 'etiquette', 'partage', 'partage', 'dedans', 'intrus']);
  const dessines = tirerScenario(rng);
  const zones = ['racine', ...ORDRE_ENS.filter((k) => dessines.has(k))];
  const cleScen = zones.join(',');
  if (forme === 'zone' || forme === 'quiZone') {
    const ordreL = rng.shuffle(zones);
    const lettres = Object.fromEntries(ordreL.map((k, i) => [k, LETTRES[i]]));
    const fig = figureEnsembles(dessines, { lettres });
    if (forme === 'zone') {
      const a = rng.pick(ANIMAUX); const z = zoneDe(a, dessines);
      const r = qcm(rng, `Zone ${lettres[z]}`, rng.shuffle(zones.filter((k) => k !== z)).slice(0, 3).map((k) => `Zone ${lettres[k]}`));
      const expl = z === 'racine'
        ? `${Le(a)} a ${attributsTexte(a)}, mais aucun des ensembles dessinés ne porte ces attributs : on ${fem(a) ? 'la' : 'le'} place dans le grand rectangle « Animaux de la collection », hors des autres ensembles (zone ${lettres[z]}).`
        : `${Le(a)} a ${attributsTexte(a)}. On ${fem(a) ? 'la' : 'le'} place dans le plus petit ensemble qui lui correspond : « ${ENS[z].lignes.join(' ')} » (zone ${lettres[z]}).${a.note ? ` Attention : ${a.note}.` : ''}`;
      return { ...r, figure: fig, enonce: `Voici une classification en ensembles emboîtés. Dans quelle zone faut-il placer ${le(a)} ?`, explication: expl,
        _signature: `zone|${cleScen}|${ordreL.join('')}|${a.nom}` };
    }
    const z = rng.pick(zones);
    const bons = ANIMAUX.filter((a) => zoneDe(a, dessines) === z); if (!bons.length) return null;
    const bon = rng.pick(bons);
    const faux = rng.shuffle(ANIMAUX.filter((a) => zoneDe(a, dessines) !== z)).slice(0, 3);
    const r = qcm(rng, maj(bon.nom), faux.map((a) => maj(a.nom)));
    const expl = `${Le(bon)} a ${attributsTexte(bon)}${z === 'racine' ? ', mais aucun des ensembles dessinés ne porte ces attributs' : ''} : sa place est dans la zone ${lettres[z]}. ${maj(faux.map((a) => `${le(a)} va dans la zone ${lettres[zoneDe(a, dessines)]}`).join(' ; '))}.`;
    return { ...r, figure: fig, enonce: `Voici une classification en ensembles emboîtés. Quel animal faut-il placer dans la zone ${lettres[z]} ?`, explication: expl,
      _signature: `qui|${cleScen}|${ordreL.join('')}|${z}|${bon.nom}|${triee(faux.map((a) => a.nom))}` };
  }
  if (forme === 'etiquette') {
    const coll = collection(rng, dessines, rng.int(6, 8));
    const cands = [...dessines].filter((k) => {
      const dedans = coll.filter((a) => possede(a, k));
      const p = parentDessine(k, dessines);
      const reste = coll.filter((a) => possede(a, p) && !possede(a, k));
      const propre = coll.filter((a) => zoneDe(a, dessines) === k);
      const enfantsNonVides = [...dessines].filter((c) => parentDessine(c, dessines) === k && coll.some((a) => possede(a, c)));
      return dedans.length >= 2 && reste.length >= 1 && (propre.length >= 1 || enfantsNonVides.length >= 2);
    });
    if (!cands.length) return null;
    const cache = rng.pick(cands);
    const dedans = coll.filter((a) => possede(a, cache));
    const ancetres = chaineEns(cache);
    const faux = ORDRE_ENS.filter((k) => k !== 'racine' && !ancetres.includes(k) && dedans.some((a) => !possede(a, k))).map((k) => ENS[k].court);
    const noms = {};
    for (const a of coll) { const z = zoneDe(a, dessines); (noms[z] ??= []).push(a.nom); }
    const fig = figureEnsembles(dessines, { noms, cache });
    const r = qcm(rng, ENS[cache].court, rng.shuffle(faux).slice(0, 3));
    if (!r) return null;
    return { ...r, figure: fig, enonce: 'Dans cette classification en ensembles emboîtés, une étiquette a été remplacée par « ? ». Quel attribut faut-il écrire à sa place ?',
      explication: `Tous les animaux de cet ensemble (${dedans.map((a) => a.nom).join(', ')}) ont ${ENS[cache].attr}, et les autres animaux de l'ensemble qui l'entoure ne l'ont pas. Un ensemble regroupe les animaux qui partagent un même attribut.`,
      _signature: `etiq|${cleScen}|${cache}|${triee(coll.map((a) => a.nom))}` };
  }
  if (forme === 'partage') {
    const [a, b] = rng.shuffle(ANIMAUX).slice(0, 2);
    const ca = chaineEns(a.feuille); const cb = chaineEns(b.feuille);
    const communs = ca.filter((k) => cb.includes(k));
    if (!communs.length || a.feuille === b.feuille && rng.next() < 0.6) return null;
    const lca = communs[communs.length - 1];
    const faux = ORDRE_ENS.filter((k) => k !== 'racine' && !(possede(a, k) && possede(b, k))).map((k) => ENS[k].court);
    const r = qcm(rng, ENS[lca].court, rng.shuffle(faux).slice(0, 3));
    return { ...r, enonce: `Quel attribut ${le(a)} et ${le(b)} partagent-ils ?`,
      explication: `${Le(a)} a ${attributsTexte(a)}. ${Le(b)} a ${attributsTexte(b)}. Ils partagent ${listeEt(communs.map((k) => ENS[k].attr))} : dans une classification en ensembles emboîtés, ils sont tous les deux dans l'ensemble « ${ENS[lca].lignes.join(' ')} ».`,
      _signature: `part|${triee([a.nom, b.nom])}` };
  }
  if (forme === 'dedans') {
    const a = rng.pick(ANIMAUX); const k = rng.pick(ORDRE_ENS.filter((x) => x !== 'racine'));
    const v = possede(a, k);
    return { type: 'vrai_faux', reponse: v, enonce: `Vrai ou faux ? Dans une classification en ensembles emboîtés, ${le(a)} se trouve à l'intérieur de l'ensemble « ${ENS[k].lignes.join(' ')} ».`,
      explication: `${v ? 'Vrai' : 'Faux'}. ${Le(a)} a ${attributsTexte(a)}${v ? '' : ` : ${ilA(a)} n'a ${ENS[k].neg}`}.${a.note && ['m4', 'p6', 'p8'].includes(k) ? ` (${maj(a.note)}.)` : ''}`,
      _signature: `dedans|${a.nom}|${k}` };
  }
  // intrus : lequel ne peut pas aller dans l'ensemble k ?
  const k = rng.pick(ORDRE_ENS.filter((x) => x !== 'racine'));
  const oui = ANIMAUX.filter((a) => possede(a, k)); const non = ANIMAUX.filter((a) => !possede(a, k));
  if (oui.length < 3) return null;
  const bon = rng.pick(non); const faux = rng.shuffle(oui).slice(0, 3);
  const r = qcm(rng, maj(bon.nom), faux.map((a) => maj(a.nom)));
  return { ...r, enonce: `Lequel de ces animaux ne peut pas être placé dans l'ensemble « ${ENS[k].lignes.join(' ')} » ?`,
    explication: `${Le(bon)} a ${attributsTexte(bon)}, mais ${ilA(bon)} n'a ${ENS[k].neg}. ${maj(listeEt(faux.map(le)))} ont ${ENS[k].attr}.${k === 'm4' && faux.some((a) => a.note?.includes('ailes')) ? ' Les ailes des oiseaux et de la chauve-souris sont leurs membres avant.' : ''}`,
    _signature: `intrus|${k}|${bon.nom}|${triee(faux.map((a) => a.nom))}` };
}

// ---------- Attributs (liste officielle P6) : V vrai, F faux, ? douteux (jamais demandé)
const ATTR = {
  si: { txt: 'un squelette interne', neg: 'de squelette interne' },
  se: { txt: 'un squelette externe', neg: 'de squelette externe' },
  pa: { txt: 'des pattes articulées', neg: 'de pattes articulées' },
  an: { txt: 'des antennes', neg: 'd\'antennes' },
  po: { txt: 'des poils', neg: 'de poils' },
  pl: { txt: 'des plumes', neg: 'de plumes' },
  ec: { txt: 'des écailles', neg: 'd\'écailles' },
  co: { txt: 'une coquille', neg: 'de coquille' },
  te: { txt: 'des tentacules', neg: 'de tentacules' },
  pp: { txt: 'un pied plat', neg: 'de pied plat' },
  ar: { txt: 'un corps en anneaux', neg: 'de corps en anneaux' },
  nr: { txt: 'des nageoires rayonnées', neg: 'de nageoires rayonnées' },
  m4: { txt: '4 membres', neg: '4 membres' },
};
const CLES_ATTR = Object.keys(ATTR);
//            si  se  pa  an  po  pl  ec  co  te  pp  ar  nr  m4
const GROUPES = {
  mam: 'V F ? F V F F F F F F F V', ois: 'V F ? F F V ? F F F F F V', amp: 'V F ? F F F F F F F F F V',
  rep: 'V F ? F F F V F F F F F V', poi: 'V F F F F F V F ? F F V F', ins: 'F V V V ? F ? F F F ? F F',
  cru: 'F V V V ? F F ? F F ? F F', ara: 'F V V F ? F F F F F ? F F', esc: 'F ? F ? F F F V V V F F F',
  lim: 'F F F ? F F F ? V V F F F', ann: 'F F F F ? F F F F F V F F',
};
const NOM_GROUPE = { mam: 'mammifère', ois: 'oiseau', amp: 'amphibien', rep: 'reptile', poi: 'poisson', ins: 'insecte', cru: 'crustacé', ara: 'arachnide', esc: 'mollusque', lim: 'mollusque', ann: 'ver annelé' };
const NOTE_ATTR = {
  m4: { ois: 'Les ailes de l\'oiseau sont ses membres avant : il a bien 4 membres.', mam: '' },
  ec: { amp: 'Les amphibiens ont une peau nue et humide, sans écailles.' },
};
const noteAttr = (a, k) => (k === 'm4' && a.nom === 'chauve-souris' ? 'Les ailes de la chauve-souris sont ses membres avant : elle a bien 4 membres.' : NOTE_ATTR[k]?.[a.groupe] ?? '');
function etat(a, k) {
  if (a.nom === 'souris' && k === 'ec') return '?';
  return GROUPES[a.groupe].split(' ')[CLES_ATTR.indexOf(k)];
}
const avoir = (a, k) => etat(a, k) === 'V';
const pasAvoir = (a, k) => etat(a, k) === 'F';
const negation = (k) => (k === 'm4' ? 'n\'a pas 4 membres' : `n'a pas ${ATTR[k].neg}`);
function resumeAttr(a) {
  const v = CLES_ATTR.filter((k) => avoir(a, k)).map((k) => ATTR[k].txt);
  return `${Le(a)} (${NOM_GROUPE[a.groupe]}) a ${listeEt(v)}.`;
}

const PAIRES = [
  { a: 'un caniche', b: 'un berger allemand', meme: true, x: 'Ce sont deux races de chiens. Ensemble, ils peuvent avoir des chiots, qui pourront eux-mêmes avoir des petits : toutes les races de chiens forment une seule espèce.' },
  { a: 'un chat siamois', b: 'un chat persan', meme: true, x: 'Ce sont deux races de chats : leurs chatons seront féconds. Ils sont de la même espèce.' },
  { a: 'une vache Blanc-Bleu Belge', b: 'un taureau Holstein', meme: true, x: 'Ce sont deux races de bovins : leurs veaux seront féconds. Ils sont de la même espèce.' },
  { a: 'un cheval de trait brabançon', b: 'une jument pur-sang', meme: true, x: 'Ce sont deux races de chevaux : leurs poulains seront féconds. Ils sont de la même espèce.' },
  { a: 'une poule rousse', b: 'un coq blanc', meme: true, x: 'Malgré leurs couleurs différentes, leurs poussins seront féconds : ils sont de la même espèce.' },
  { a: 'deux êtres humains nés sur des continents différents', b: null, meme: true, x: 'Tous les êtres humains appartiennent à la même espèce : ils peuvent avoir ensemble des enfants, eux-mêmes féconds.' },
  { a: 'un âne', b: 'une jument', meme: false, x: 'Ils peuvent avoir un petit, le mulet, mais le mulet est stérile : il ne peut pas avoir de petits. L\'âne et le cheval sont donc deux espèces différentes.' },
  { a: 'un cheval', b: 'une ânesse', meme: false, x: 'Leur petit, le bardot, est stérile. Le cheval et l\'âne sont deux espèces différentes.' },
  { a: 'un zèbre', b: 'une jument', meme: false, x: 'Leur petit éventuel est stérile : le zèbre et le cheval sont deux espèces différentes.' },
  { a: 'un chat', b: 'une chienne', meme: false, x: 'Ils ne peuvent pas avoir de petits ensemble : ce sont deux espèces différentes.' },
  { a: 'un lapin', b: 'une hase (femelle du lièvre)', meme: false, x: 'Le lapin et le lièvre se ressemblent, mais ils ne peuvent pas avoir de petits ensemble : ce sont deux espèces différentes.' },
  { a: 'un loup', b: 'une renarde', meme: false, x: 'Ils ne peuvent pas avoir de petits ensemble : ce sont deux espèces différentes.' },
  { a: 'un pigeon', b: 'une poule', meme: false, x: 'Ce sont deux oiseaux, mais ils ne peuvent pas avoir de petits ensemble : ce sont deux espèces différentes.' },
  { a: 'une grenouille', b: 'un crapaud', meme: false, x: 'Ils se ressemblent, mais ils ne peuvent pas avoir de petits ensemble : ce sont deux espèces différentes.' },
];

export function genererAttributs(modele, rng) {
  const forme = rng.pick(['possede', 'possede', 'pasPossede', 'quiPossede', 'quiPossede', 'vf', 'vf', 'grille', 'espece', 'espece', 'especeQ']);
  const SANS = ANIMAUX.filter((a) => a.nom !== 'souris');
  if (forme === 'possede' || forme === 'pasPossede') {
    const a = rng.pick(SANS);
    const V = CLES_ATTR.filter((k) => avoir(a, k)); const F = CLES_ATTR.filter((k) => pasAvoir(a, k));
    const [bons, mauvais] = forme === 'possede' ? [V, F] : [F, V];
    if (!bons.length || mauvais.length < 3) return null;
    const k = rng.pick(bons); const faux = rng.shuffle(mauvais).slice(0, 3);
    const r = qcm(rng, maj(ATTR[k].txt), faux.map((x) => maj(ATTR[x].txt)));
    const note = noteAttr(a, k);
    return { ...r, enonce: forme === 'possede' ? `Lequel de ces attributs ${le(a)} possède-t-${ilA(a)} ?` : `Lequel de ces attributs ${le(a)} ne possède-t-${ilA(a)} pas ?`,
      explication: `${resumeAttr(a)}${forme === 'pasPossede' ? ` ${maj(ilA(a))} ${negation(k)}.` : ''}${note ? ` ${note}` : ''}`,
      _signature: `${forme}|${a.nom}|${k}|${triee(faux)}` };
  }
  if (forme === 'quiPossede') {
    const k = rng.pick(CLES_ATTR); const neg = rng.next() < 0.3;
    const V = SANS.filter((a) => avoir(a, k)); const F = SANS.filter((a) => pasAvoir(a, k));
    const [bons, mauvais] = neg ? [F, V] : [V, F];
    if (!bons.length || mauvais.length < 3) return null;
    const bon = rng.pick(bons); const faux = rng.shuffle(mauvais).slice(0, 3);
    const r = qcm(rng, maj(bon.nom), faux.map((a) => maj(a.nom)));
    return { ...r, enonce: neg ? `Lequel de ces animaux n'a pas ${ATTR[k].neg} ?` : `Lequel de ces animaux a ${ATTR[k].txt} ?`,
      explication: neg ? `${Le(bon)} ${negation(k)}. ${maj(listeEt(faux.map(le)))} ont ${ATTR[k].txt}.` : `${resumeAttr(bon)} ${maj(listeEt(faux.map(le)))} n'ont pas ${ATTR[k].neg}.`,
      _signature: `qui|${neg}|${k}|${bon.nom}|${triee(faux.map((a) => a.nom))}` };
  }
  if (forme === 'vf') {
    const a = rng.pick(SANS); const k = rng.pick(CLES_ATTR.filter((x) => etat(a, x) !== '?'));
    const v = avoir(a, k); const note = noteAttr(a, k);
    return { type: 'vrai_faux', reponse: v, enonce: `Vrai ou faux ? ${Le(a)} a ${ATTR[k].txt}.`,
      explication: `${v ? 'Vrai' : 'Faux'}. ${resumeAttr(a)}${v ? '' : ` ${maj(ilA(a))} ${negation(k)}.`}${note ? ` ${note}` : ''}`, _signature: `vf|${a.nom}|${k}` };
  }
  if (forme === 'grille') {
    const k = rng.pick(CLES_ATTR);
    const V = SANS.filter((a) => avoir(a, k)); const F = SANS.filter((a) => pasAvoir(a, k));
    if (V.length < 1 || F.length < 1) return null;
    const nv = rng.int(1, Math.min(3, V.length));
    const tires = rng.shuffle([...rng.shuffle(V).slice(0, nv), ...rng.shuffle(F).slice(0, 4 - nv)]);
    if (tires.length < 4) return null;
    return { type: 'grille', enonce: `Ces animaux ont-ils ${ATTR[k].txt} ? Choisis Oui ou Non pour chacun.`, lignes: tires.map((a) => maj(a.nom)), colonnes: ['Oui', 'Non'],
      reponse: tires.map((a) => (avoir(a, k) ? 0 : 1)), points: 4,
      explication: `Ont ${ATTR[k].txt} : ${tires.filter((a) => avoir(a, k)).map((a) => a.nom).join(', ') || 'aucun'}. N'ont pas ${ATTR[k].neg} : ${tires.filter((a) => !avoir(a, k)).map((a) => a.nom).join(', ') || 'aucun'}.${k === 'm4' && tires.some((a) => a.groupe === 'ois' || a.nom === 'chauve-souris') ? ' Les ailes des oiseaux et de la chauve-souris sont leurs membres avant.' : ''}`,
      _signature: `grille|${k}|${triee(tires.map((a) => a.nom))}` };
  }
  if (forme === 'espece') {
    const P = rng.pick(PAIRES);
    const sujet = P.b ? `${maj(P.a)} et ${P.b} sont de la même espèce.` : `${maj(P.a)} sont de la même espèce.`;
    return { type: 'vrai_faux', reponse: P.meme, enonce: `Vrai ou faux ? ${sujet}`, fiche: 'sc-espece',
      explication: `${P.meme ? 'Vrai' : 'Faux'}. ${P.x} Deux vivants sont de la même espèce s'ils peuvent avoir ensemble des petits, eux-mêmes féconds.`, _signature: `esp|${P.a}|${P.b}` };
  }
  const QS = [
    { e: 'Deux animaux appartiennent à la même espèce si…', b: 'ils peuvent avoir ensemble des petits, eux-mêmes capables d\'avoir des petits.',
      f: ['ils se ressemblent beaucoup.', 'ils vivent au même endroit.', 'ils mangent la même nourriture.', 'ils ont la même couleur.', 'ils ont la même taille.'] },
    { e: 'Un âne et une jument ont un petit : le mulet. Le mulet ne peut pas avoir de petits. Que peut-on conclure ?', b: 'L\'âne et le cheval sont deux espèces différentes.',
      f: ['L\'âne et le cheval sont de la même espèce.', 'Le mulet est une nouvelle espèce.', 'Le mulet est un cheval.', 'Le mulet est un âne.'] },
    { e: 'Comment s\'appelle le petit d\'un âne et d\'une jument ?', b: 'Le mulet', f: ['Le poulain', 'L\'ânon', 'Le bardot', 'Le veau'] },
    { e: 'Que veut dire « un petit fécond » ?', b: 'Un petit qui, adulte, pourra lui-même avoir des petits.', f: ['Un petit qui grandit très vite.', 'Un petit qui ressemble à ses parents.', 'Un petit qui ne peut pas avoir de petits.'] },
    { e: 'Un caniche et un saint-bernard sont très différents. Pourquoi sont-ils pourtant de la même espèce ?', b: 'Ils peuvent avoir ensemble des chiots, qui seront eux-mêmes féconds.',
      f: ['Parce qu\'ils ont tous les deux des poils.', 'Parce qu\'ils vivent tous les deux avec l\'être humain.', 'Parce qu\'ils mangent la même nourriture.'] },
    { e: 'Le lapin et le lièvre se ressemblent beaucoup. Ils ne peuvent pas avoir de petits ensemble. Que peut-on dire ?', b: 'Ce sont deux espèces différentes.',
      f: ['C\'est la même espèce, car ils se ressemblent.', 'Ce sont deux races de la même espèce.', 'On ne peut rien dire : il faudrait d\'abord comparer leur taille.'] },
    { cl: true, e: 'Dans une classification scientifique, sur quoi se base-t-on pour regrouper les animaux ?', b: 'Sur les attributs qu\'ils partagent (ce qu\'ils ont).',
      f: ['Sur l\'endroit où ils vivent.', 'Sur leur façon de se déplacer.', 'Sur leur taille.', 'Sur ce qu\'ils mangent.'] },
    { cl: true, e: 'À quoi sert la classification phylogénétique des animaux ?', b: 'À montrer les liens de parenté entre les espèces.',
      f: ['À ranger les animaux par ordre de taille.', 'À savoir quels animaux sont dangereux.', 'À ranger les animaux par ordre alphabétique.'] },
  ];
  const Q = rng.pick(QS);
  const r = qcm(rng, maj(Q.b), rng.shuffle(Q.f).slice(0, 3).map(maj));
  return { ...r, fiche: Q.cl ? 'sc-attributs' : 'sc-espece', enonce: Q.e, explication: `${maj(Q.b)} ${Q.cl ? 'Les scientifiques classent les animaux d\'après les attributs qu\'ils partagent : plus deux espèces partagent d\'attributs, plus elles sont proches parentes.' : 'Une espèce : des vivants qui peuvent se reproduire entre eux et avoir des descendants féconds.'}`, _signature: `espQ|${Q.e}` };
}

// ================================================================ 5. LIENS ENTRE LES SYSTÈMES
const TRAJETS = {
  o2: { titre: 'le trajet du dioxygène, de l\'air jusqu\'aux muscles', etapes: [
    'L\'air entre par le nez ou la bouche', 'L\'air descend dans la trachée', 'L\'air passe dans les bronches', 'L\'air arrive dans les alvéoles des poumons',
    'Le dioxygène passe dans le sang', 'Le sang riche en dioxygène arrive au cœur', 'Le cœur envoie le sang dans les artères', 'Le dioxygène arrive aux muscles'] },
  co2: { titre: 'le trajet du dioxyde de carbone, du muscle jusqu\'à l\'extérieur du corps', etapes: [
    'Le muscle produit du dioxyde de carbone', 'Le dioxyde de carbone passe dans le sang', 'Le sang revient au cœur par les veines', 'Le cœur envoie le sang vers les poumons',
    'Le dioxyde de carbone passe du sang dans les alvéoles', 'L\'air remonte par les bronches et la trachée', 'L\'air est rejeté par le nez ou la bouche'] },
  nut: { titre: 'le trajet d\'un aliment jusqu\'à ce que ses nutriments arrivent aux muscles', etapes: [
    'L\'aliment est mâché dans la bouche', 'L\'aliment descend par l\'œsophage', 'L\'aliment est brassé dans l\'estomac', 'Dans l\'intestin grêle, les nutriments passent dans le sang',
    'Le sang transporte les nutriments dans tout le corps', 'Les nutriments arrivent aux muscles'] },
  tube: { titre: 'le trajet des aliments dans le tube digestif', etapes: ['Bouche', 'Œsophage', 'Estomac', 'Intestin grêle', 'Côlon', 'Anus'] },
  air: { titre: 'le trajet de l\'air inspiré', etapes: ['Nez', 'Trachée', 'Bronches', 'Alvéoles des poumons'] },
  urine: { titre: 'le trajet de certains déchets transportés par le sang', etapes: [
    'Le sang transporte des déchets', 'Les reins filtrent le sang', 'Les déchets forment l\'urine', 'L\'urine est stockée dans la vessie', 'L\'urine est évacuée hors du corps'] },
};
const ORGANES = {
  respiratoire: ['Nez', 'Trachée', 'Bronches', 'Poumons', 'Alvéoles'],
  circulatoire: ['Cœur', 'Artères', 'Veines', 'Sang'],
  digestif: ['Œsophage', 'Estomac', 'Intestin grêle', 'Côlon', 'Anus', 'Foie', 'Pancréas', 'Glandes salivaires'],
};
const VENTIL = {
  inspiration: ['Le diaphragme se contracte et s\'abaisse', 'Les côtes se soulèvent', 'La cage thoracique s\'agrandit', 'L\'air entre dans les poumons'],
  expiration: ['Le diaphragme se relâche et remonte', 'Les côtes s\'abaissent', 'La cage thoracique diminue de volume', 'L\'air sort des poumons'],
};
const AFFIRM = [
  ['Le sang transporte le dioxygène, les nutriments et le dioxyde de carbone.', true, 'Le sang circule dans tout le corps : il apporte dioxygène et nutriments aux organes et emporte le dioxyde de carbone.'],
  ['La plupart des nutriments passent dans le sang au niveau de l\'intestin grêle.', true, 'C\'est l\'absorption intestinale : les nutriments traversent la paroi de l\'intestin grêle et passent dans le sang.'],
  ['Le dioxygène passe de l\'air au sang dans les alvéoles des poumons.', true, 'Les alvéoles sont entourées de petits vaisseaux sanguins : c\'est là que se font les échanges gazeux.'],
  ['Le dioxyde de carbone est rejeté hors du corps par les poumons, lors de l\'expiration.', true, 'Le sang apporte le dioxyde de carbone aux poumons ; il passe dans les alvéoles et sort avec l\'air expiré.'],
  ['Le côlon (gros intestin) absorbe encore de l\'eau avant que les restes soient évacués par l\'anus.', true, 'Une grande partie de l\'eau passe dans le sang dans l\'intestin grêle ; le côlon en absorbe encore : les restes deviennent plus solides et sont évacués par l\'anus.'],
  ['Les artères transportent le sang du cœur vers les organes.', true, 'Artères : du cœur vers les organes. Veines : des organes vers le cœur.'],
  ['Les veines ramènent le sang des organes vers le cœur.', true, 'Artères : du cœur vers les organes. Veines : des organes vers le cœur.'],
  ['Certains déchets transportés par le sang sont évacués dans l\'urine.', true, 'Les reins filtrent le sang : les déchets forment l\'urine.'],
  ['À l\'inspiration, le diaphragme s\'abaisse et la cage thoracique s\'agrandit.', true, 'Le volume de la cage thoracique augmente : l\'air entre dans les poumons.'],
  ['Les matières non absorbées sont évacuées par l\'anus.', true, 'Ce que le corps n\'a pas absorbé forme les selles, évacuées par l\'anus.'],
  ['Les aliments ne passent pas par le pancréas, mais il aide à la digestion.', true, 'Le pancréas est une glande annexe : il verse un suc digestif dans l\'intestin.'],
  ['Le cœur est un muscle qui pompe le sang.', true, 'En se contractant, le cœur envoie le sang dans les artères.'],
  ['La plupart des nutriments passent dans le sang au niveau de l\'estomac.', false, 'C\'est surtout au niveau de l\'intestin grêle que les nutriments passent dans le sang.'],
  ['L\'air que nous inspirons va dans l\'estomac.', false, 'L\'air passe par la trachée et les bronches jusqu\'aux poumons. L\'œsophage, lui, conduit les aliments à l\'estomac.'],
  ['Le dioxygène va directement des poumons aux muscles, sans passer par le sang.', false, 'Le dioxygène passe dans le sang au niveau des alvéoles ; c\'est le sang qui le transporte jusqu\'aux muscles.'],
  ['Les artères ramènent le sang des organes vers le cœur.', false, 'Ce sont les veines qui ramènent le sang vers le cœur ; les artères partent du cœur.'],
  ['Le dioxyde de carbone est évacué dans l\'urine.', false, 'Le dioxyde de carbone est rejeté par les poumons, à l\'expiration.'],
  ['À l\'inspiration, le diaphragme remonte.', false, 'À l\'inspiration, le diaphragme s\'abaisse ; il remonte à l\'expiration.'],
  ['Le sang transporte seulement du dioxygène.', false, 'Le sang transporte aussi les nutriments, le dioxyde de carbone et des déchets.'],
  ['L\'œsophage conduit l\'air de la bouche aux poumons.', false, 'L\'œsophage conduit les aliments à l\'estomac. L\'air passe par la trachée.'],
  ['Les aliments passent à l\'intérieur du foie.', false, 'Le foie est une glande annexe du système digestif : les aliments n\'y passent pas.'],
  ['Le cœur fabrique le dioxygène dont les muscles ont besoin.', false, 'Le dioxygène vient de l\'air inspiré ; le cœur pompe le sang qui le transporte.'],
  ['À l\'expiration, la cage thoracique s\'agrandit.', false, 'À l\'expiration, la cage thoracique diminue de volume : l\'air est chassé des poumons.'],
];
const QCMS = [
  { e: 'Où la plupart des nutriments passent-ils dans le sang ?', b: 'Dans l\'intestin grêle', f: ['Dans l\'estomac', 'Dans l\'œsophage', 'Dans les poumons'], x: 'C\'est l\'absorption intestinale.' },
  { e: 'Où le dioxygène de l\'air passe-t-il dans le sang ?', b: 'Dans les alvéoles des poumons', f: ['Dans la trachée', 'Dans le cœur', 'Dans l\'estomac'], x: 'Les alvéoles sont entourées de petits vaisseaux sanguins.' },
  { e: 'Quel système transporte le dioxygène et les nutriments jusqu\'aux muscles ?', b: 'Le système circulatoire', f: ['Le système respiratoire', 'Le système digestif', 'Le squelette'], x: 'Le sang, poussé par le cœur dans les vaisseaux, transporte tout dans le corps.' },
  { e: 'Par où le dioxyde de carbone produit par les muscles quitte-t-il le corps ?', b: 'Par les poumons, à l\'expiration', f: ['Par les reins, dans l\'urine', 'Par l\'intestin', 'Par le cœur'], x: 'Le sang l\'apporte aux poumons ; il est rejeté avec l\'air expiré.' },
  { e: 'Quels organes débarrassent le sang de certains déchets, évacués dans l\'urine ?', b: 'Les reins', f: ['La vessie', 'Le foie', 'L\'intestin grêle'], x: 'Les reins filtrent le sang ; la vessie, elle, ne fait que stocker l\'urine.' },
  { e: 'Quels vaisseaux transportent le sang du cœur vers les muscles ?', b: 'Les artères', f: ['Les veines', 'Les nerfs', 'Les tendons'], x: 'Artères : du cœur vers les organes.' },
  { e: 'Quels vaisseaux ramènent le sang des muscles vers le cœur ?', b: 'Les veines', f: ['Les artères', 'Les nerfs', 'Les tendons'], x: 'Veines : des organes vers le cœur.' },
  { e: 'Quel organe pompe le sang dans tout le corps ?', b: 'Le cœur', f: ['Les poumons', 'Le foie', 'L\'estomac'], x: 'Le cœur est un muscle qui se contracte sans arrêt.' },
  { e: 'Quel muscle en forme de dôme, situé sous les poumons, s\'abaisse à l\'inspiration ?', b: 'Le diaphragme', f: ['Le cœur', 'L\'estomac', 'Les abdominaux'], x: 'En s\'abaissant, il agrandit la cage thoracique : l\'air entre.' },
  { e: 'Lequel de ces organes est une glande annexe du système digestif (les aliments n\'y passent pas) ?', b: 'Le pancréas', f: ['L\'estomac', 'L\'œsophage', 'L\'intestin grêle', 'Le côlon'], x: 'Glandes annexes : glandes salivaires, pancréas et foie.' },
  { e: 'Lequel de ces organes est une glande annexe du système digestif (les aliments n\'y passent pas) ?', b: 'Le foie', f: ['L\'estomac', 'L\'œsophage', 'L\'intestin grêle', 'Le côlon'], x: 'Glandes annexes : glandes salivaires, pancréas et foie.' },
  { e: 'Dans quelle partie du tube digestif de l\'eau est-elle absorbée, juste avant l\'anus ?', b: 'Dans le côlon', f: ['Dans l\'estomac', 'Dans l\'intestin grêle', 'Dans l\'œsophage'], x: 'Le côlon (gros intestin) absorbe encore de l\'eau ; les restes sont évacués par l\'anus.' },
  { e: 'Quel conduit relie la gorge aux bronches ?', b: 'La trachée', f: ['L\'œsophage', 'Les alvéoles', 'L\'intestin grêle'], x: 'Nez ou bouche → trachée → bronches → alvéoles des poumons.' },
  { e: 'Que transporte le sang qui revient des muscles vers les poumons ?', b: 'Du dioxyde de carbone à rejeter', f: ['Des aliments non digérés', 'De l\'urine', 'De l\'air pur'], x: 'Les muscles produisent du dioxyde de carbone ; le sang l\'emporte jusqu\'aux poumons.' },
];
const SITUATIONS = [
  { ctx: (p) => `${p} court un 1 000 m. Ses muscles des jambes ont besoin de plus de dioxygène.`, q: 'Quel système fait entrer le dioxygène dans son corps ?', b: 'Le système respiratoire', x: 'Le système respiratoire (nez, trachée, bronches, poumons) fait entrer l\'air ; le dioxygène passe dans le sang dans les alvéoles.' },
  { ctx: (p) => `${p} court un 1 000 m. Le dioxygène est passé dans son sang au niveau des poumons.`, q: 'Quel système l\'amène jusqu\'aux muscles des jambes ?', b: 'Le système circulatoire', x: 'Le cœur pompe le sang dans les artères jusqu\'aux muscles.' },
  { ctx: (p) => `${p} a mangé une tartine avant son match de foot.`, q: 'Quel système transforme la tartine en nutriments ?', b: 'Le système digestif', x: 'Dans le tube digestif, la plupart des aliments sont transformés en nutriments, absorbés dans l\'intestin grêle.' },
  { ctx: (p) => `${p} a mangé une pomme. Les nutriments sont passés dans son sang au niveau de l'intestin grêle.`, q: 'Quel système les transporte jusqu\'à ses muscles ?', b: 'Le système circulatoire', x: 'Le sang, poussé par le cœur, transporte les nutriments dans tout le corps.' },
  { ctx: (p) => `Pendant une partie de basket, les muscles de ${p} produisent beaucoup de dioxyde de carbone.`, q: 'Quel système le rejette hors du corps ?', b: 'Le système respiratoire', x: 'Le sang (système circulatoire) l\'apporte aux poumons, et il est rejeté à l\'expiration.' },
  { ctx: (p) => `Pendant une partie de basket, les muscles de ${p} produisent beaucoup de dioxyde de carbone.`, q: 'Quel système le transporte des muscles jusqu\'aux poumons ?', b: 'Le système circulatoire', x: 'Le sang emporte le dioxyde de carbone jusqu\'aux poumons, où il est expiré.' },
];

export function genererSystemes(modele, rng) {
  const forme = rng.pick(['ordre', 'ordre', 'ordre', 'vf', 'vf', 'qcm', 'qcm', 'situation', 'ventil', 'ventilQ', 'organes']);
  if (forme === 'ordre') {
    const cle = rng.pick(['o2', 'o2', 'co2', 'co2', 'nut', 'nut', 'tube', 'air', 'urine']); const T = TRAJETS[cle];
    const n = Math.min(T.etapes.length, rng.int(4, 5));
    const tires = sousSuite(rng, T.etapes, n);
    const r = ordre(rng, tires);
    return { ...r, fiche: cle === 'tube' || cle === 'air' ? 'sc-liens-systemes' : undefined,
      enonce: `Remets dans l'ordre ${T.titre}.`,
      explication: `Ordre complet : ${T.etapes.join(' → ')}.`, _signature: `ordre|${cle}|${tires.join('|')}`, cleContenu: `ordre|${cle}|${triee(tires)}` };
  }
  if (forme === 'vf') {
    const [t, v, x] = rng.pick(AFFIRM);
    return { type: 'vrai_faux', reponse: v, enonce: `Vrai ou faux ? ${t}`, explication: `${v ? 'Vrai' : 'Faux'}. ${x}`, _signature: `vf|${t}` };
  }
  if (forme === 'qcm') {
    const Q = rng.pick(QCMS); const faux = rng.shuffle(Q.f).slice(0, 3);
    const r = qcm(rng, Q.b, faux);
    return { ...r, enonce: Q.e, explication: `${Q.b}. ${Q.x}`, _signature: `qcm|${Q.e}|${Q.b}|${triee(faux)}` };
  }
  if (forme === 'situation') {
    const S = rng.pick(SITUATIONS); const p = rng.pick(PRENOMS);
    const r = qcm(rng, S.b, ['Le système respiratoire', 'Le système circulatoire', 'Le système digestif'].filter((x) => x !== S.b));
    return { ...r, enonce: `${S.ctx(p)} ${S.q}`, explication: `${S.b}. ${S.x} Les trois systèmes travaillent ensemble : le digestif fournit les nutriments, le respiratoire le dioxygène, et le circulatoire transporte tout.`,
      _signature: `sit|${S.q}|${S.ctx('X')}|${p}` };
  }
  if (forme === 'ventil') {
    const ni = rng.int(1, 3);
    const tires = rng.shuffle([...rng.shuffle(VENTIL.inspiration).slice(0, ni), ...rng.shuffle(VENTIL.expiration).slice(0, 4 - ni)]);
    return { type: 'grille', enonce: 'Ces phrases décrivent-elles l\'inspiration ou l\'expiration ?', lignes: tires, colonnes: ['Inspiration', 'Expiration'],
      reponse: tires.map((t) => (VENTIL.inspiration.includes(t) ? 0 : 1)), points: 4,
      explication: 'Inspiration : le diaphragme se contracte et s\'abaisse, les côtes se soulèvent, la cage thoracique s\'agrandit, l\'air entre. Expiration : le diaphragme se relâche et remonte, les côtes s\'abaissent, la cage thoracique diminue de volume, l\'air sort.',
      _signature: `vent|${triee(tires)}` };
  }
  if (forme === 'ventilQ') {
    const insp = rng.next() < 0.5; const [bons, autres] = insp ? [VENTIL.inspiration, VENTIL.expiration] : [VENTIL.expiration, VENTIL.inspiration];
    const b = rng.pick(bons.slice(0, 3)); const faux = rng.shuffle(autres.slice(0, 3)).slice(0, 3);
    const r = qcm(rng, b, faux);
    return { ...r, enonce: `Que se passe-t-il lors de l'${insp ? 'inspiration' : 'expiration'} ?`,
      explication: `${b}. ${insp ? 'À l\'inspiration, la cage thoracique s\'agrandit : l\'air entre dans les poumons.' : 'À l\'expiration, la cage thoracique diminue de volume : l\'air sort des poumons.'}`,
      _signature: `ventQ|${insp}|${b}` };
  }
  // organes : à quel système appartient chaque organe ?
  const syst = Object.keys(ORGANES);
  const tires = []; const vus = new Set();
  for (const s of rng.shuffle(syst)) { const o = rng.pick(ORGANES[s]); tires.push([o, s]); vus.add(o); }
  while (tires.length < 4) { const s = rng.pick(syst); const o = rng.pick(ORGANES[s]); if (!vus.has(o)) { tires.push([o, s]); vus.add(o); } }
  const m = rng.shuffle(tires);
  return { type: 'grille', enonce: 'À quel système appartient chacun de ces éléments du corps ?', lignes: m.map(([o]) => o), colonnes: ['Respiratoire', 'Circulatoire', 'Digestif'],
    reponse: m.map(([, s]) => syst.indexOf(s)), points: 4,
    explication: `${m.map(([o, s]) => `${o} : système ${s}`).join(' ; ')}.`, _signature: `org|${triee(m.map(([o]) => o))}` };
}

// ================================================================ 6. ÉTAPE 2 : OUTILS COMMUNS
// Prénoms et noms de famille français uniquement (règle du projet).
const FILLES_F = ['Léa', 'Chloé', 'Manon', 'Camille', 'Juliette', 'Mathilde', 'Pauline', 'Agathe', 'Amélie', 'Élise', 'Margaux', 'Clémence'];
const GARCONS_F = ['Louis', 'Arthur', 'Jules', 'Victor', 'Antoine', 'Baptiste', 'Maxime', 'Romain', 'Mathis', 'Quentin', 'Étienne', 'Émile', 'Clément'];
const ENFANTS = [...FILLES_F, ...GARCONS_F];
const NOMS_FAMILLE = ['Dubois', 'Lambert', 'Martin', 'Lefèvre', 'Moreau', 'Dupont', 'Leroy', 'Mercier'];
const pr = (p) => (FILLES_F.includes(p) ? 'elle' : 'il');
const minus = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const point = (s) => (/[.!?]$/.test(s) ? s : `${s}.`);
// QCM dont les choix sont rangés (lettres, montages…) plutôt que mélangés.
function qcmRange(bonne, faux, tri = (a, b) => a.localeCompare(b)) {
  const f = [...new Set(faux)].filter((x) => x !== bonne).slice(0, 3);
  if (f.length < 2) return null;
  const choix = [bonne, ...f].sort(tri);
  return { type: 'qcm', choix, reponse: choix.indexOf(bonne) };
}
// « le » → « du », « la » → « de la », « l' » → « de l' », « les » → « des »
const deLe = (gn) => gn.replace(/^le /, 'du ').replace(/^la /, 'de la ').replace(/^l'/, 'de l\'').replace(/^les /, 'des ');
const aLe = (gn) => gn.replace(/^le /, 'au ').replace(/^la /, 'à la ').replace(/^l'/, 'à l\'').replace(/^les /, 'aux ');

// ================================================================ 7. MODÈLE DE LA VENTILATION (bouteille, ballons, membrane)
const VPARTS = {
  tube: { modele: 'le tube (la paille)', ligne: 'Le tube (la paille)', organe: 'la trachée' },
  branches: { modele: 'les deux branches du tube en Y', ligne: 'Les branches du tube en Y', organe: 'les bronches' },
  ballons: { modele: 'les ballons', ligne: 'Les ballons', organe: 'les poumons' },
  bouteille: { modele: 'la bouteille', ligne: 'La bouteille', organe: 'la cage thoracique' },
  membrane: { modele: 'la membrane en caoutchouc', ligne: 'La membrane en caoutchouc', organe: 'le diaphragme' },
};
const VCLES = Object.keys(VPARTS);
const ORG_EXTRA = ['le cœur', 'les fosses nasales']; // organes du thorax ou de la respiration, absents du modèle
const CORRESP = 'Dans ce modèle : la bouteille représente la cage thoracique, la membrane le diaphragme, les ballons les poumons, le tube la trachée et les branches du Y les bronches.';

function figureVentilation(etat, lettres) {
  const W = 372; const H = 336; const cx = 150; const yM = 266;
  const flex = etat === 'tiree' ? 30 : etat === 'poussee' ? -24 : 0;
  const [rx, ry] = etat === 'tiree' ? [27, 36] : etat === 'poussee' ? [13, 17] : [20, 26];
  let s = '';
  s += `<path d="M80 ${yM} L80 104 Q80 74 128 62 L128 34 L172 34 L172 62 Q220 74 220 104 L220 ${yM}" fill="#eef4fb" stroke="${ENCRE}" stroke-width="2.4"/>`;
  s += `<rect x="122" y="24" width="56" height="20" rx="3" fill="#b08d63" stroke="${ENCRE}" stroke-width="1.6"/>`;
  const tube = `M${cx} 6 L${cx} 128 M${cx} 128 L116 156 M${cx} 128 L184 156`;
  s += `<path d="${tube}" fill="none" stroke="${ENCRE}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path d="${tube}" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  for (const x of [116, 184]) s += `<ellipse cx="${x}" cy="${154 + ry}" rx="${rx}" ry="${ry}" fill="#f6cfd0" stroke="${ENCRE}" stroke-width="1.8"/>`;
  if (flex < 0) s += `<path d="M81.2 ${yM} Q${cx} ${yM + 2 * flex} 218.8 ${yM} Z" fill="#ffffff"/>`;
  s += `<path d="M76 ${yM} Q${cx} ${yM + 2 * flex} 224 ${yM}" fill="none" stroke="#c0392b" stroke-width="4.5" stroke-linecap="round"/>`;
  const yb = yM + flex;
  s += `<line x1="${cx}" y1="${yb}" x2="${cx}" y2="${yb + 14}" stroke="${ENCRE}" stroke-width="2"/><circle cx="${cx}" cy="${yb + 19}" r="5" fill="#ffffff" stroke="${ENCRE}" stroke-width="2"/>`;
  if (etat !== 'repos') {
    const x = cx - 44; const [y1, y2] = etat === 'tiree' ? [yM + 10, yM + 46] : [yM + 46, yM + 4];
    const d = y2 > y1 ? -1 : 1;
    s += `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2 + d * 6}" stroke="${ENCRE}" stroke-width="3"/>`
      + `<path d="M${x - 7} ${y2 + d * 9} L${x} ${y2} L${x + 7} ${y2 + d * 9} Z" fill="${ENCRE}"/>`;
  }
  if (lettres) {
    const yMem = yM + 0.4476 * flex;
    const cibles = {
      tube: [153, 100, 58], bouteille: [220, 122, 112], branches: [172, 145, 166],
      ballons: [184 + rx, 154 + ry, 216], membrane: [205, yMem, 296],
    };
    for (const [k, [tx, ty, ly]] of Object.entries(cibles)) {
      s += `<line x1="${tx}" y1="${ty.toFixed(1)}" x2="${330}" y2="${ly}" stroke="${ENCRE}" stroke-width="1.2"/>`
        + `<circle cx="${tx}" cy="${ty.toFixed(1)}" r="2.6" fill="${ENCRE}"/>`
        + `<circle cx="346" cy="${ly}" r="13" fill="#ffffff" stroke="${ENCRE}" stroke-width="1.6"/>`
        + `<text x="346" y="${ly + 5}" font-size="14" font-weight="bold" text-anchor="middle" fill="${ENCRE}">${lettres[k]}</text>`;
    }
  }
  return svg(W, H, s);
}

const V_LIMITES_VRAIES = [
  'Dans le corps, les côtes bougent et la cage thoracique s\'agrandit ; la bouteille, elle, ne change pas de forme.',
  'Dans le corps, le diaphragme est un muscle qui se contracte ; dans le modèle, c\'est la main qui tire la membrane.',
  'Les vrais poumons ne sont pas des sacs vides : ils contiennent des millions de petites alvéoles.',
  'Dans le corps, le dioxygène passe dans le sang au niveau des alvéoles ; dans le modèle, il n\'y a pas de sang.',
];
const V_LIMITES_FAUSSES = [
  'Dans le corps, l\'air entre dans les poumons quand le diaphragme remonte.',
  'Dans le corps, l\'air arrive aux poumons par l\'œsophage.',
  'Dans le corps, il n\'y a qu\'un seul poumon.',
  'Dans le corps, les poumons se gonflent quand la cage thoracique devient plus petite.',
  'Dans le corps, le diaphragme se trouve au-dessus des poumons.',
];
const V_ACTIONS = {
  tire: { txt: 'tire la membrane vers le bas', bonne: 'Les ballons se gonflent : l\'air entre par le tube.', mvt: 'l\'inspiration' },
  pousse: { txt: 'pousse la membrane vers le haut', bonne: 'Les ballons se dégonflent : l\'air sort par le tube.', mvt: 'l\'expiration' },
  relache: { txt: 'relâche la membrane qu\'il avait tirée vers le bas', bonne: 'Les ballons se dégonflent : l\'air sort par le tube.', mvt: 'l\'expiration' },
};
const V_REPONSES = ['Les ballons se gonflent : l\'air entre par le tube.', 'Les ballons se dégonflent : l\'air sort par le tube.', 'Les ballons ne bougent pas.', 'L\'air entre dans la bouteille par le fond.'];
const V_ORDRE = {
  tire: ['On tire la membrane vers le bas', 'Le volume à l\'intérieur de la bouteille augmente', 'L\'air extérieur entre par le tube et gonfle les ballons', 'On relâche la membrane : les ballons se dégonflent'],
  pousse: ['On pousse la membrane vers le haut', 'Le volume à l\'intérieur de la bouteille diminue', 'Les ballons sont comprimés', 'L\'air des ballons sort par le tube'],
};

export function genererVentilation(modele, rng) {
  const forme = rng.pick(['represente', 'represente', 'represente', 'lettre', 'lettre', 'etat', 'action', 'pourquoi', 'reel', 'reel', 'limite', 'limite', 'grille', 'vf', 'ordre']);
  const p = rng.pick(ENFANTS);
  const intro = `${p} a fabriqué un modèle du système respiratoire : une bouteille sans fond, fermée en bas par une membrane en caoutchouc, et un tube en Y relié à deux ballons.`;
  const verbeP = (a) => V_ACTIONS[a].txt.replace('qu\'il avait', `qu'${pr(p)} avait`);
  if (forme === 'represente' || forme === 'lettre') {
    const etat = rng.pick(['repos', 'tiree', 'poussee']);
    const ordreL = rng.shuffle(VCLES);
    const lettres = Object.fromEntries(ordreL.map((k, i) => [k, 'ABCDE'[i]]));
    const k = rng.pick(VCLES);
    const fig = figureVentilation(etat, lettres);
    const cle = `${forme}|${etat}|${VCLES.map((x) => lettres[x]).join('')}|${k}`;
    if (forme === 'represente') {
      const faux = rng.shuffle([...VCLES.filter((x) => x !== k).map((x) => VPARTS[x].organe), ...ORG_EXTRA]).slice(0, 3);
      const r = qcm(rng, maj(VPARTS[k].organe), faux.map(maj));
      return { ...r, figure: fig, enonce: `${intro} Dans ce modèle, que représente la partie ${lettres[k]} ?`,
        explication: `La partie ${lettres[k]} montre ${VPARTS[k].modele}, qui ${/^les/.test(VPARTS[k].modele) ? 'représentent' : 'représente'} ${VPARTS[k].organe}. ${CORRESP}`,
        _signature: `${cle}|${triee(faux)}`, cleContenu: cle };
    }
    const faux = rng.shuffle(VCLES.filter((x) => x !== k)).slice(0, 3).map((x) => lettres[x]);
    const r = qcmRange(lettres[k], faux);
    return { ...r, figure: fig, enonce: `${intro} Quelle lettre désigne la partie du modèle qui représente ${VPARTS[k].organe} ?`,
      explication: `La partie ${lettres[k]} montre ${VPARTS[k].modele}, qui ${/^les/.test(VPARTS[k].modele) ? 'représentent' : 'représente'} ${VPARTS[k].organe}. ${CORRESP}`,
      _signature: `${cle}|${triee(faux)}`, cleContenu: cle };
  }
  if (forme === 'etat') {
    const etat = rng.pick(['tiree', 'poussee']);
    const a = etat === 'tiree' ? 'tire' : 'pousse';
    const choix = ['L\'inspiration', 'L\'expiration', 'Aucun : l\'air ne bouge pas'];
    const bonne = etat === 'tiree' ? 0 : 1;
    return { type: 'qcm', choix, reponse: bonne, figure: figureVentilation(etat, null),
      enonce: `${intro} Sur le dessin, ${p} ${verbeP(a)} (flèche). Quel mouvement respiratoire le modèle imite-t-il ?`,
      explication: etat === 'tiree'
        ? 'Quand on tire la membrane vers le bas, le volume dans la bouteille augmente : l\'air entre dans les ballons. Dans le corps, c\'est l\'inspiration : le diaphragme s\'abaisse et l\'air entre dans les poumons.'
        : 'Quand on pousse la membrane vers le haut, le volume dans la bouteille diminue : l\'air sort des ballons. Dans le corps, c\'est l\'expiration : le diaphragme remonte et l\'air sort des poumons.',
      _signature: `etat|${etat}|${p}`, cleContenu: `etat|${etat}` };
  }
  if (forme === 'action') {
    const a = rng.pick(['tire', 'pousse', 'relache']);
    const A = V_ACTIONS[a];
    const r = qcm(rng, A.bonne, V_REPONSES);
    return { ...r, enonce: `${intro} ${p} ${verbeP(a)}. Que se passe-t-il ?`,
      explication: `${A.bonne} Le modèle imite ${A.mvt}. ${a === 'tire' ? 'Le volume dans la bouteille augmente, comme celui de la cage thoracique quand le diaphragme s\'abaisse.' : 'Le volume dans la bouteille diminue, comme celui de la cage thoracique quand le diaphragme remonte.'}`,
      _signature: `action|${a}|${p}`, cleContenu: `action|${a}` };
  }
  if (forme === 'pourquoi') {
    const tire = rng.next() < 0.5;
    const bonne = tire ? 'Le volume à l\'intérieur de la bouteille augmente : l\'air extérieur entre dans les ballons par le tube.'
      : 'Le volume à l\'intérieur de la bouteille diminue : l\'air des ballons est chassé par le tube.';
    const faux = tire
      ? ['La membrane souffle de l\'air dans les ballons.', 'Le caoutchouc de la membrane pousse l\'air vers les ballons.', 'L\'air entre dans les ballons par le fond de la bouteille.', 'Le volume à l\'intérieur de la bouteille diminue.']
      : ['La membrane aspire l\'air des ballons.', 'L\'air des ballons passe dans la bouteille, autour des ballons.', 'Le volume à l\'intérieur de la bouteille augmente.', 'Les ballons laissent passer l\'air à travers leur paroi.'];
    const f = rng.shuffle(faux).slice(0, 3);
    const r = qcm(rng, bonne, f);
    return { ...r, enonce: `${intro} Quand ${p} ${tire ? 'tire la membrane vers le bas, les ballons se gonflent' : 'pousse la membrane vers le haut, les ballons se dégonflent'}. Pourquoi ?`,
      explication: `${bonne} C'est la même chose dans le corps : ${tire ? 'quand le diaphragme s\'abaisse, la cage thoracique s\'agrandit et l\'air entre dans les poumons' : 'quand le diaphragme remonte, la cage thoracique diminue de volume et l\'air sort des poumons'}.`,
      _signature: `pq|${tire}|${triee(f)}`, cleContenu: `pq|${tire}|${triee(f)}` };
  }
  if (forme === 'reel') {
    const sens = rng.pick(['modeleTire', 'modelePousse', 'corpsBas', 'corpsHaut']);
    const contracte = 'Il se contracte et s\'abaisse : la cage thoracique s\'agrandit et l\'air entre (inspiration).';
    const relache = 'Il se relâche et remonte : la cage thoracique diminue et l\'air sort (expiration).';
    if (sens === 'modeleTire' || sens === 'modelePousse') {
      const t = sens === 'modeleTire';
      const bonne = t ? contracte : relache;
      const r = qcm(rng, bonne, rng.shuffle([t ? relache : contracte, 'Il se contracte et remonte : l\'air entre (inspiration).', 'Il se relâche et s\'abaisse : l\'air sort (expiration).', 'Il ne bouge pas : seuls les poumons bougent.']).slice(0, 3));
      return { ...r, enonce: `${intro} ${p} ${verbeP(t ? 'tire' : 'pousse')}. Dans le corps, que fait le diaphragme pour produire le même effet ?`,
        explication: `${bonne} La membrane du modèle représente le diaphragme, un muscle en forme de dôme placé sous les poumons.`,
        _signature: `reel|${sens}|${r.choix.slice().sort().join('|')}`, cleContenu: `reel|${sens}|${triee(r.choix)}` };
    }
    const bas = sens === 'corpsBas';
    const bonne = bas ? 'La tirer vers le bas.' : 'La pousser vers le haut.';
    const r = qcm(rng, bonne, rng.shuffle([bas ? 'La pousser vers le haut.' : 'La tirer vers le bas.', 'Souffler dans le tube sans toucher la membrane.', 'Pincer le tube pour bloquer l\'air.']).slice(0, 3));
    return { ...r, enonce: `${intro} Dans le corps, le diaphragme ${bas ? 's\'abaisse' : 'remonte'}. Que doit faire ${p} avec la membrane pour imiter ce mouvement ?`,
      explication: `${bonne} La membrane représente le diaphragme. ${bas ? 'Quand il s\'abaisse, la cage thoracique s\'agrandit et l\'air entre : c\'est l\'inspiration.' : 'Quand il remonte, la cage thoracique diminue et l\'air sort : c\'est l\'expiration.'}`,
      _signature: `reel|${sens}|${triee(r.choix)}`, cleContenu: `reel|${sens}|${triee(r.choix)}` };
  }
  if (forme === 'limite') {
    const b = rng.pick(V_LIMITES_VRAIES); const f = rng.shuffle(V_LIMITES_FAUSSES).slice(0, 3);
    const r = qcm(rng, b, f);
    return { ...r, enonce: `${intro} Un modèle ne montre pas tout. Laquelle de ces phrases décrit une vraie différence entre le modèle et le corps humain ?`,
      explication: `${b} Les autres phrases sont fausses : dans le corps, l'air passe par la trachée (pas par l'œsophage), il y a deux poumons, le diaphragme est sous les poumons et l'air entre quand la cage thoracique s'agrandit (le diaphragme s'abaisse).`,
      _signature: `lim|${b}|${triee(f)}`, cleContenu: `lim|${b}|${triee(f)}` };
  }
  if (forme === 'grille') {
    const tires = rng.shuffle(VCLES).slice(0, 4);
    const colonnes = rng.shuffle(tires).map((k) => maj(VPARTS[k].organe));
    return { type: 'grille', enonce: `${intro} Que représente chaque partie du modèle dans le corps ?`, lignes: tires.map((k) => VPARTS[k].ligne), colonnes,
      reponse: tires.map((k) => colonnes.indexOf(maj(VPARTS[k].organe))), points: 4,
      explication: `${maj(tires.map((k) => `${VPARTS[k].modele} → ${VPARTS[k].organe}`).join(' ; '))}.`,
      _signature: `grille|${tires.join(',')}|${colonnes.join(',')}`, cleContenu: `grille|${triee(tires)}` };
  }
  if (forme === 'vf') {
    const k = rng.pick(VCLES); const vrai = rng.next() < 0.45;
    const o = vrai ? VPARTS[k].organe : rng.pick([...VCLES.filter((x) => x !== k).map((x) => VPARTS[x].organe), ...ORG_EXTRA]);
    return { type: 'vrai_faux', reponse: vrai, enonce: `${intro} Vrai ou faux ? Dans ce modèle, ${VPARTS[k].modele} ${/^les/.test(VPARTS[k].modele) ? 'représentent' : 'représente'} ${o}.`,
      explication: `${vrai ? 'Vrai' : 'Faux'}. ${maj(VPARTS[k].modele)} ${/^les/.test(VPARTS[k].modele) ? 'représentent' : 'représente'} ${VPARTS[k].organe}. ${CORRESP}`,
      _signature: `vf|${k}|${o}`, cleContenu: `vf|${k}|${o}` };
  }
  const a = rng.pick(['tire', 'pousse']);
  const r = ordre(rng, V_ORDRE[a]);
  return { ...r, enonce: `${intro} Remets dans l'ordre ce qui se passe quand ${p} ${a === 'tire' ? 'tire la membrane vers le bas, puis la relâche' : 'pousse la membrane vers le haut'}.`,
    explication: `${V_ORDRE[a].join(' → ')}. ${a === 'tire' ? 'Dans le corps, tirer la membrane correspond à l\'inspiration, la relâcher à l\'expiration.' : 'Dans le corps, c\'est l\'expiration.'}`,
    _signature: `ordre|${a}|${r.elements.join('|')}`, cleContenu: `ordre|${a}|${r.elements.join('|')}` };
}

// ================================================================ 8. DÉMARCHE D'INVESTIGATION
// Chaque contexte : 3 facteurs à 2 valeurs. « temoin » : facteur dont la valeur 0 est « sans rien changer ».
const CTX_DEM = [
  { id: 'germ', dom: 'sc.vivant', tire: (rng) => ({ g: rng.pick(['haricot', 'lentille', 'radis', 'cresson', 'pois']) }),
    effet: (v) => `la germination des graines de ${v.g}`, mesure: 'le nombre de graines qui ont germé après une semaine',
    f: [{ nom: 'l\'eau', col: 'Coton', v: ['mouillé', 'sec'], ph: ['sur du coton mouillé', 'sur du coton sec'] }, { nom: 'la température', col: 'Température', v: ['20 °C', '4 °C'], ph: ['à 20 °C', 'à 4 °C'] }, { nom: 'la lumière', col: 'Lumière', v: ['oui', 'non'], ph: ['à la lumière', 'dans le noir'] }],
    fait: (rng, v) => `Après une semaine, ${rng.int(6, 10)} graines de ${v.g} sur 10 ont germé sur le coton mouillé.`,
    hyp: (v) => [`Je pense que les graines de ${v.g} ont besoin d'eau pour germer.`, 'Peut-être que les graines germent mieux au chaud qu\'au froid.'],
    jug: (v) => [`Les graines de ${v.g} sont les plus jolies de toutes les graines.`, 'Faire germer des graines, c\'est passionnant.'] },
  { id: 'plant', dom: 'sc.vivant', tire: (rng) => ({ g: rng.pick(['haricot', 'tomate', 'tournesol', 'pois']) }),
    effet: (v) => `la croissance d'un plant de ${v.g}`, mesure: 'la hauteur du plant après trois semaines',
    f: [{ nom: 'la lumière', col: 'Lumière', v: ['oui', 'non'], ph: ['à la lumière', 'dans le noir'] }, { nom: 'l\'arrosage', col: 'Arrosage', v: ['oui', 'non'], ph: ['arrosé', 'pas arrosé'] }, { nom: 'la sorte de terre', col: 'Terre', v: ['terreau', 'sable'], ph: ['dans du terreau', 'dans du sable'] }],
    fait: (rng, v) => `Après trois semaines, le plant de ${v.g} placé à la lumière mesure ${rng.int(9, 24)} cm.`,
    hyp: (v) => [`Je pense que le plant de ${v.g} a besoin de lumière pour bien pousser.`, 'Peut-être que les plants poussent mieux dans le terreau que dans le sable.'],
    jug: (v) => [`Les fleurs de ${v.g} sont les plus belles du jardin.`, 'Le pot vert est beaucoup plus joli que le pot brun.'] },
  { id: 'refroid', dom: 'sc.energie', tire: (rng) => ({ T: rng.pick([60, 70, 80]) }),
    effet: (v) => `le refroidissement de l'eau chaude (à ${v.T} °C au départ)`, mesure: 'la température de l\'eau après 30 minutes',
    f: [{ nom: 'le matériau autour du pot', col: 'Autour du pot', v: ['rien', 'laine'], ph: ['sans rien autour du pot', 'pot entouré de laine'], temoin: true, q: 'la laine autour d\'un pot ralentit le refroidissement de l\'eau chaude', desc: ['un pot d\'eau chaude sans rien autour', 'un pot d\'eau chaude entouré d\'une écharpe en laine'] },
      { nom: 'le couvercle', col: 'Couvercle', v: ['non', 'oui'], ph: ['sans couvercle', 'avec couvercle'], temoin: true, q: 'un couvercle ralentit le refroidissement de l\'eau chaude', desc: ['un pot d\'eau chaude sans couvercle', 'un pot d\'eau chaude fermé par un couvercle'] },
      { nom: 'la quantité d\'eau', col: 'Eau', v: ['200 ml', '400 ml'], ph: ['200 ml d\'eau', '400 ml d\'eau'] }],
    fait: (rng, v) => `Après 30 minutes, l'eau du pot entouré de laine est à ${rng.int(42, v.T - 12)} °C.`,
    hyp: () => ['Je pense que la laine va ralentir le refroidissement de l\'eau.', 'Peut-être qu\'un couvercle garde l\'eau chaude plus longtemps.'],
    jug: () => ['L\'écharpe en laine rouge est la plus belle.', 'Mesurer des températures, c\'est amusant.'] },
  { id: 'glacon', dom: 'sc.energie', tire: () => ({}),
    effet: () => 'la durée de fonte d\'un glaçon', mesure: 'le temps que met le glaçon pour fondre complètement',
    f: [{ nom: 'la taille du glaçon', col: 'Glaçon', v: ['petit', 'gros'], ph: ['petit glaçon', 'gros glaçon'] }, { nom: 'l\'endroit (soleil ou ombre)', col: 'Endroit', v: ['ombre', 'soleil'], ph: ['à l\'ombre', 'au soleil'] },
      { nom: 'l\'emballage du glaçon', col: 'Emballage', v: ['aucun', 'torchon'], ph: ['sans emballage', 'dans un torchon'], temoin: true, q: 'un torchon autour d\'un glaçon le fait fondre moins vite', desc: ['un glaçon posé sans rien dans une assiette', 'un glaçon enveloppé dans un torchon, dans une assiette'] }],
    fait: (rng) => `Le glaçon posé au soleil a complètement fondu en ${rng.int(14, 40)} minutes.`,
    hyp: () => ['Je pense qu\'un glaçon fond plus vite au soleil qu\'à l\'ombre.', 'Peut-être qu\'un gros glaçon met plus de temps à fondre qu\'un petit.'],
    jug: () => ['Les glaçons en forme d\'étoile sont les plus jolis.', 'Regarder un glaçon fondre, c\'est ennuyeux.'] },
  { id: 'sucre', dom: 'sc.matiere', tire: () => ({}),
    effet: () => 'la vitesse à laquelle le sucre se dissout dans l\'eau', mesure: 'le temps nécessaire pour que le sucre ne soit plus visible',
    f: [{ nom: 'la température de l\'eau', col: 'Eau', v: ['froide', 'chaude'], ph: ['eau froide', 'eau chaude'] }, { nom: 'le fait de remuer', col: 'On remue', v: ['non', 'oui'], ph: ['sans remuer', 'en remuant'], temoin: true, q: 'remuer fait dissoudre le sucre plus vite', desc: ['un verre d\'eau avec un morceau de sucre, sans remuer', 'un verre d\'eau avec un morceau de sucre, en remuant'] },
      { nom: 'la forme du sucre', col: 'Sucre', v: ['en morceau', 'en poudre'], ph: ['sucre en morceau', 'sucre en poudre'] }],
    fait: (rng) => `Dans l'eau chaude, le sucre en poudre n'est plus visible après ${rng.int(8, 40)} secondes.`,
    hyp: () => ['Je pense que le sucre se dissout plus vite dans l\'eau chaude.', 'Peut-être que le sucre en poudre se dissout plus vite que le sucre en morceau.'],
    jug: () => ['Le sucre en morceau est plus joli que le sucre en poudre.', 'L\'eau sucrée, c\'est délicieux.'] },
  { id: 'evap', dom: 'sc.matiere', tire: (rng) => ({ V: rng.pick([100, 150, 200]) }),
    effet: (v) => `l'évaporation de ${v.V} ml d'eau`, mesure: 'la quantité d\'eau qui reste après trois jours',
    f: [{ nom: 'la forme du récipient', col: 'Récipient', v: ['verre', 'assiette'], ph: ['dans un verre étroit', 'dans une assiette large'] }, { nom: 'l\'endroit', col: 'Endroit', v: ['pièce fraîche', 'radiateur'], ph: ['dans une pièce fraîche', 'près du radiateur'] },
      { nom: 'le couvercle', col: 'Couvercle', v: ['non', 'oui'], ph: ['sans couvercle', 'avec couvercle'], temoin: true, q: 'un couvercle empêche l\'eau de s\'évaporer', desc: ['un récipient d\'eau sans couvercle', 'un récipient d\'eau fermé par un couvercle'] }],
    fait: (rng, v) => `Après trois jours, il reste ${rng.int(Math.round(v.V * 0.8 / 10), Math.round(v.V * 0.95 / 10)) * 10} ml d'eau dans le verre étroit.`,
    hyp: () => ['Je pense que l\'eau s\'évapore plus vite dans une assiette large que dans un verre.', 'Peut-être que l\'eau s\'évapore plus vite près du radiateur.'],
    jug: () => ['L\'assiette bleue est la plus belle de la cuisine.', 'Cette expérience est trop longue, c\'est nul.'] },
  { id: 'bougie', dom: 'sc.matiere', tire: () => ({}),
    effet: () => 'la durée pendant laquelle une bougie reste allumée sous un bocal retourné', mesure: 'le temps avant que la flamme s\'éteigne',
    f: [{ nom: 'la taille du bocal', col: 'Bocal', v: ['petit', 'grand'], ph: ['petit bocal', 'grand bocal'] }, { nom: 'l\'épaisseur de la bougie', col: 'Bougie', v: ['fine', 'épaisse'], ph: ['bougie fine', 'bougie épaisse'] }, { nom: 'la couleur de la bougie', col: 'Couleur', v: ['blanche', 'rouge'], ph: ['bougie blanche', 'bougie rouge'] }],
    fait: (rng) => `Sous le petit bocal, la flamme s'est éteinte après ${rng.int(6, 25)} secondes.`,
    hyp: () => ['Je pense que la bougie restera allumée plus longtemps sous le grand bocal.', 'Peut-être que la couleur de la bougie ne change rien.'],
    jug: () => ['Les bougies rouges sont plus belles que les bougies blanches.', 'Les bougies parfumées sentent meilleur que les autres.'] },
  { id: 'pain', dom: 'sc.vivant', tire: () => ({}),
    effet: () => 'l\'apparition de moisissures sur une tranche de pain', mesure: 'le nombre de jours avant que des moisissures apparaissent',
    f: [{ nom: 'l\'humidité du pain', col: 'Pain', v: ['sec', 'humide'], ph: ['pain sec', 'pain humide'] }, { nom: 'la température', col: 'Endroit', v: ['frigo', 'cuisine'], ph: ['au frigo', 'dans la cuisine'] }, { nom: 'la sorte de pain', col: 'Sorte', v: ['blanc', 'gris'], ph: ['pain blanc', 'pain gris'] }],
    fait: (rng) => `La tranche de pain humide placée dans la cuisine a moisi après ${rng.int(3, 7)} jours.`,
    hyp: () => ['Je pense que le pain humide moisit plus vite que le pain sec.', 'Peut-être que le pain moisit moins vite au frigo.', 'Peut-être que le pain gris moisit moins vite que le pain blanc.'],
    jug: () => ['Le pain moisi, c\'est dégoûtant.', 'Le pain gris est meilleur que le pain blanc.', 'Une tartine de pain blanc, c\'est plus joli.'] },
];
const JUG_COMMUNS = ['Les sciences, c\'est la matière la plus intéressante.', 'C\'est l\'expérience la plus amusante de l\'année.', 'Mon carnet d\'expériences est le plus beau de la classe.'];
const diffs = (a, b) => a.map((x, i) => (x !== b[i] ? i : -1)).filter((i) => i >= 0);
const descMontage = (c, m) => c.f.map((f, i) => f.ph[m[i]]).join(', ');

export function genererDemarche(modele, rng) {
  const forme = rng.pick(['paire', 'paire', 'paire', 'facteur', 'facteur', 'juste', 'juste', 'garder', 'mesure', 'temoin', 'nature', 'nature', 'natureQ', 'natureQ']);
  const c = rng.pick(CTX_DEM); const v = c.tire(rng); const p = rng.pick(ENFANTS);
  const base = { domaine: c.dom };
  const bits = () => [rng.int(0, 1), rng.int(0, 1), rng.int(0, 1)];
  const flip = (m, ...is) => m.map((x, i) => (is.includes(i) ? 1 - x : x));
  if (forme === 'paire') {
    const t = rng.int(0, 2); const n = rng.pick([3, 4, 4]);
    const m0 = bits(); const M = [m0, flip(m0, t)];
    const autres = rng.shuffle([0, 1, 2].filter((i) => i !== t));
    // Distracteurs plausibles : un montage qui ne diffère que par un AUTRE facteur, puis un qui diffère par deux facteurs.
    const cands = [flip(m0, autres[0]), flip(m0, t, autres[1]), flip(m0, autres[1]), flip(m0, t, autres[0]), flip(m0, autres[0], autres[1])];
    for (const x of cands) {
      if (M.length >= n) break;
      if (M.some((y) => y.join() === x.join())) continue;
      if (M.some((y) => { const d = diffs(x, y); return d.length === 1 && d[0] === t; })) continue;
      M.push(x);
    }
    if (M.length < n) return null;
    const ordreM = rng.shuffle(M.map((_, i) => i));
    const L = 'ABCD';
    const lettreDe = (i) => L[ordreM.indexOf(i)];
    const paires = [];
    for (let i = 0; i < M.length; i++) for (let j = i + 1; j < M.length; j++) paires.push([i, j]);
    const nom = ([i, j]) => [lettreDe(i), lettreDe(j)].sort().join(' et ');
    const bonnes = paires.filter(([i, j]) => { const d = diffs(M[i], M[j]); return d.length === 1 && d[0] === t; });
    if (bonnes.length !== 1) return null;
    const faux = rng.shuffle(paires.filter((x) => x !== bonnes[0])).slice(0, 3).map(nom);
    const r = qcmRange(nom(bonnes[0]), faux);
    if (!r) return null;
    const lignes = ordreM.map((i, k) => [L[k], ...M[i].map((b, f) => c.f[f].v[b])]);
    const fig = svgTableau({ titre: `Les montages de ${p}`, entetes: ['Montage', ...c.f.map((f) => f.col)], lignes });
    const [a, b] = nom(bonnes[0]).split(' et ');
    return { ...base, ...r, figure: fig, fiche: 'sc-demarche',
      enonce: `${p} veut savoir si ${c.f[t].nom} a une influence sur ${c.effet(v)}. ${maj(pr(p))} a préparé ces montages. Quels montages doit-${pr(p)} comparer ?`,
      explication: `Les montages ${a} et ${b} sont identiques, sauf pour « ${c.f[t].col} » (${c.f[t].v.join(' / ')}). Pour tester un facteur, on compare deux montages où seul ce facteur change ; dans les autres paires, autre chose change aussi (ou ce n'est pas le bon facteur).`,
      _signature: `paire|${c.id}|${t}|${lignes.map((l) => l.join(',')).join(';')}|${triee(faux)}`, cleContenu: `paire|${c.id}|${t}|${lignes.map((l) => l.join(',')).join(';')}` };
  }
  if (forme === 'facteur' || forme === 'juste') {
    const m1 = bits(); const t = rng.int(0, 2);
    let m2; let cas = 'un';
    if (forme === 'juste') {
      cas = rng.pick(['un', 'un', 'deux', 'autre']);
      const o = rng.pick([0, 1, 2].filter((i) => i !== t));
      m2 = cas === 'un' ? flip(m1, t) : cas === 'deux' ? flip(m1, t, o) : flip(m1, o);
    } else m2 = flip(m1, t);
    const txt = `Montage 1 : ${descMontage(c, m1)}. Montage 2 : ${descMontage(c, m2)}.`;
    const sig = `${c.id}|${m1.join('')}|${m2.join('')}|${t}`;
    if (forme === 'facteur') {
      const quest = rng.next() < 0.5;
      if (quest) {
        const Q = (i) => `Est-ce que ${c.f[i].nom} a une influence sur ${c.effet(v)} ?`;
        const r = qcm(rng, Q(t), [0, 1, 2].filter((i) => i !== t).map(Q));
        return { ...base, ...r, fiche: 'sc-demarche', enonce: `Pour une expérience sur ${c.effet(v)}, ${p} prépare deux montages. ${txt} À quelle question ${p} veut-${pr(p)} répondre ?`,
          explication: `Entre les deux montages, une seule chose change : ${c.f[t].nom} (${c.f[t].ph.join(' / ')}). ${p} teste donc ${c.f[t].nom}. Tout le reste est identique.`,
          _signature: `fq|${sig}|${triee(r.choix)}`, cleContenu: `fq|${sig}` };
      }
      const r = qcm(rng, maj(c.f[t].nom), [0, 1, 2].filter((i) => i !== t).map((i) => maj(c.f[i].nom)).concat([maj(c.mesure)]));
      return { ...base, ...r, fiche: 'sc-demarche', enonce: `Pour une expérience sur ${c.effet(v)}, ${p} prépare deux montages. ${txt} Quel facteur ${p} teste-t-${pr(p)} ?`,
        explication: `Entre les deux montages, une seule chose change : ${c.f[t].nom} (${c.f[t].ph.join(' / ')}). C'est le facteur testé. ${maj(c.mesure)}, c'est ce que l'on mesure (le résultat), pas un facteur.`,
        _signature: `fac|${sig}|${triee(r.choix)}`, cleContenu: `fac|${sig}` };
    }
    const d = diffs(m1, m2);
    const ok = cas === 'un';
    const pourquoi = ok ? `Une seule chose change entre les deux montages, ${c.f[t].nom} : la comparaison est juste.`
      : cas === 'deux' ? `Deux choses changent en même temps (${c.f[d[0]].nom} et ${c.f[d[1]].nom}) : si le résultat est différent, on ne saura pas laquelle est la cause.`
        : `Une seule chose change, mais c'est ${c.f[d[0]].nom} : cette comparaison teste ${c.f[d[0]].nom}, pas ${c.f[t].nom}.`;
    return { ...base, type: 'vrai_faux', reponse: ok, fiche: 'sc-demarche',
      enonce: `${p} veut savoir si ${c.f[t].nom} a une influence sur ${c.effet(v)}. ${txt} Vrai ou faux ? Comparer ces deux montages permet de répondre à sa question.`,
      explication: `${ok ? 'Vrai' : 'Faux'}. ${pourquoi} Dans une expérience juste, on ne change qu'un seul facteur à la fois.`,
      _signature: `juste|${sig}|${cas}`, cleContenu: `juste|${sig}` };
  }
  if (forme === 'garder') {
    const t = rng.int(0, 2); const o = rng.pick([0, 1, 2].filter((i) => i !== t));
    const r = qcm(rng, maj(c.f[o].nom), [maj(c.f[t].nom), maj(c.mesure), `${maj(c.f[t].nom)} et ${c.f[o].nom}`]);
    const autres = [0, 1, 2].filter((i) => i !== t).map((i) => c.f[i].nom);
    return { ...base, ...r, fiche: 'sc-demarche',
      enonce: `${p} veut savoir si ${c.f[t].nom} a une influence sur ${c.effet(v)}. Qu'est-ce qui doit rester identique dans ses deux montages ?`,
      explication: `On ne change que le facteur testé (${c.f[t].nom}). Tout le reste doit rester identique : ${listeEt(autres)}. ${maj(c.mesure)}, c'est le résultat que l'on mesure à la fin.`,
      _signature: `garder|${c.id}|${t}|${o}|${triee(r.choix)}`, cleContenu: `garder|${c.id}|${t}|${o}` };
  }
  if (forme === 'mesure') {
    const t = rng.int(0, 2);
    // Fausses réponses crédibles (contre-expertise, point 24) : les facteurs de la MÊME expérience,
    // celui qu'on fait varier et ceux qu'on garde identiques ; jamais une mesure d'une autre expérience.
    const faux = c.f.map((f) => maj(f.nom));
    const r = qcm(rng, maj(c.mesure), faux);
    const gardes = c.f.filter((_, i) => i !== t).map((f) => f.nom);
    return { ...base, ...r, fiche: 'sc-demarche',
      enonce: `${p} veut savoir si ${c.f[t].nom} a une influence sur ${c.effet(v)}. Que doit-${pr(p)} mesurer ou observer à la fin de l'expérience ?`,
      explication: `Pour connaître l'effet sur ${c.effet(v)}, on mesure ${c.mesure} dans chaque montage, puis on compare. ${maj(c.f[t].nom)}, c'est ce qu'on fait varier ; ${listeEt(gardes)} restent identiques : ce ne sont pas des résultats à mesurer.`,
      _signature: `mes|${c.id}|${t}|${triee(faux)}`, cleContenu: `mes|${c.id}|${t}|${triee(faux)}` };
  }
  if (forme === 'temoin') {
    const cs = CTX_DEM.filter((x) => x.f.some((f) => f.temoin));
    const cc = rng.pick(cs); const f = rng.pick(cc.f.filter((x) => x.temoin));
    const inv = rng.next() < 0.5;
    const [d1, d2] = inv ? [f.desc[1], f.desc[0]] : f.desc;
    const temoin = inv ? 'Le montage 2' : 'Le montage 1';
    const choix = ['Le montage 1', 'Le montage 2', 'Les deux montages'];
    return { type: 'qcm', choix, reponse: choix.indexOf(temoin), domaine: cc.dom, fiche: 'sc-demarche',
      enonce: `${p} veut savoir si ${f.q}. Montage 1 : ${d1}. Montage 2 : ${d2}. Pour le reste, les deux montages sont identiques. Quel montage sert de témoin ?`,
      explication: `Le témoin est le montage où l'on n'a rien ajouté ni changé : ici, ${f.desc[0]}. On compare l'autre montage au témoin pour voir l'effet du changement.`,
      _signature: `tem|${cc.id}|${f.col}|${inv}|${p}`, cleContenu: `tem|${cc.id}|${f.col}|${inv}` };
  }
  // Fait, hypothèse ou jugement de valeur ?
  const fait = c.fait(rng, v); const hyp = rng.pick(c.hyp(v)); const jug = rng.pick([...c.jug(v), ...JUG_COMMUNS]);
  const NAT = ['Un fait', 'Une hypothèse', 'Un jugement de valeur'];
  const rappel = 'Un fait est une observation ou une mesure que tout le monde peut vérifier. Une hypothèse est une idée à vérifier par une expérience (« Je pense que… », « Peut-être que… »). Un jugement de valeur est un avis personnel (beau, amusant, meilleur…).';
  if (forme === 'nature') {
    const tri = rng.shuffle([[fait, 0], [hyp, 1], [jug, 2]]);
    return { ...base, type: 'grille', fiche: 'sc-faits-hypotheses', points: 3,
      enonce: `Pendant une expérience sur ${c.effet(v)}, les élèves notent ces phrases. Est-ce un fait, une hypothèse ou un jugement de valeur ?`,
      lignes: tri.map(([t]) => t), colonnes: NAT, reponse: tri.map(([, k]) => k),
      explication: `Fait : « ${fait} » Hypothèse : « ${hyp} » Jugement de valeur : « ${jug} » ${rappel}`,
      _signature: `nat|${triee([fait, hyp, jug])}`, cleContenu: `nat|${triee([fait, hyp, jug])}` };
  }
  const k = rng.int(0, 2);
  const phrases = [fait, hyp, jug];
  const r = qcm(rng, phrases[k], phrases.filter((_, i) => i !== k).concat(k === 2 ? [rng.pick(c.hyp(v).filter((x) => x !== hyp))] : [rng.pick([...c.jug(v), ...JUG_COMMUNS].filter((x) => x !== jug))]));
  if (!r) return null;
  return { ...base, ...r, fiche: 'sc-faits-hypotheses',
    enonce: `Pendant une expérience sur ${c.effet(v)}, les élèves notent ces phrases. Laquelle est ${['un fait', 'une hypothèse', 'un jugement de valeur'][k]} ?`,
    explication: `« ${phrases[k]} » est ${['un fait', 'une hypothèse', 'un jugement de valeur'][k]}. ${rappel}`,
    _signature: `natQ|${k}|${triee(r.choix)}`, cleContenu: `natQ|${k}|${triee(r.choix)}` };
}

// ================================================================ 9. TRANSFERT DE CHALEUR ET ÉQUILIBRE
// chaud / froid : groupes nominaux ; env : true si le « froid » ou le « chaud » est l'air d'une pièce (température qui ne change presque pas).
const deg = (t) => `${fmt(t)} °C`;
const accord = (gn, sing, plur) => (/^les /.test(gn) ? plur : sing);
const SIT_CHALEUR = [
  { id: 'choco', env: 'froid', tire: (rng) => ({ c: rng.pick([60, 65, 70, 75, 80, 85]), f: rng.int(18, 23) }),
    txt: (p, t) => `${p} oublie sa tasse de chocolat chaud, à ${deg(t.c)}, sur la table de la cuisine, où il fait ${deg(t.f)}.`, chaud: 'le chocolat', froid: 'l\'air de la cuisine', objet: 'le chocolat' },
  { id: 'canette', env: 'chaud', tire: (rng) => ({ f: rng.int(3, 7), c: rng.int(19, 24) }),
    txt: (p, t) => `${p} sort une canette de jus du frigo, à ${deg(t.f)}, et la pose sur la table d'une pièce où il fait ${deg(t.c)}.`, chaud: 'l\'air de la pièce', froid: 'la canette', objet: 'le jus de la canette' },
  { id: 'yaourt', env: 'chaud', tire: (rng) => ({ f: rng.int(4, 6), c: rng.int(19, 23) }),
    txt: (p, t) => `${p} sort un pot de yaourt du frigo, à ${deg(t.f)}, et l'oublie dans la cuisine, où il fait ${deg(t.c)}.`, chaud: 'l\'air de la cuisine', froid: 'le yaourt', objet: 'le yaourt' },
  { id: 'bain', env: 'froid', tire: (rng) => ({ c: rng.int(36, 40), f: rng.int(18, 22) }),
    txt: (p, t) => `${p} oublie de vider la baignoire : l'eau du bain est à ${deg(t.c)} et l'air de la salle de bain à ${deg(t.f)}.`, chaud: 'l\'eau du bain', froid: 'l\'air de la salle de bain', objet: 'l\'eau du bain' },
  { id: 'plat', env: 'froid', tire: (rng) => ({ c: rng.pick([50, 55, 60, 65, 70]), f: rng.int(3, 6) }),
    txt: (p, t) => `${p} range un plat de pâtes encore chaud, à ${deg(t.c)}, dans un frigo réglé à ${deg(t.f)}.`, chaud: 'le plat de pâtes', froid: 'l\'air du frigo', objet: 'le plat de pâtes' },
  { id: 'cuillere', tire: (rng) => ({ f: rng.int(18, 22), c: rng.pick([70, 75, 80, 85, 90]) }),
    txt: (p, t) => `${p} plonge une cuillère en métal, à ${deg(t.f)}, dans une soupe à ${deg(t.c)}.`, chaud: 'la soupe', froid: 'la cuillère' },
  { id: 'glacon', tire: (rng) => ({ f: -rng.int(5, 18), c: rng.int(15, 25) }),
    txt: (p, t) => `${p} met un glaçon, à ${deg(t.f)}, dans un verre de limonade à ${deg(t.c)}.`, chaud: 'la limonade', froid: 'le glaçon', note: ' (il finit par fondre)' },
  { id: 'bouillotte', tire: (rng) => ({ c: rng.pick([50, 55, 60, 65]), f: rng.int(12, 17) }),
    txt: (p, t) => `${p} glisse une bouillotte, à ${deg(t.c)}, entre les draps de son lit, à ${deg(t.f)}.`, chaud: 'la bouillotte', froid: 'les draps' },
  { id: 'biberon', tire: (rng) => ({ f: rng.int(4, 8), c: rng.pick([45, 50, 55, 60]) }),
    txt: (p, t) => `Pour réchauffer le biberon de sa petite sœur, ${p} plonge le biberon de lait, à ${deg(t.f)}, dans une casserole d'eau chaude, à ${deg(t.c)}.`, chaud: 'l\'eau de la casserole', froid: 'le lait' },
  { id: 'rampe', tire: (rng) => ({ f: rng.int(1, 8), c: 30 }),
    txt: (p, t) => `En hiver, ${p} pose sa main (environ 30 °C) sur une rampe en métal à ${deg(t.f)}.`, chaud: 'la main', froid: 'la rampe' },
];
const CHALEUR_QCM = [
  { e: (p) => `${p} touche, dans la même pièce, une rampe en métal et une planche en bois. Les deux sont à la même température, mais le métal semble plus froid. Pourquoi ?`,
    b: 'Le métal est un bon conducteur thermique : il emporte plus vite la chaleur de la main.', f: ['Le métal fabrique du froid.', 'Le métal est toujours plus froid que le bois.', 'Le bois est un bon conducteur thermique : il réchauffe la main.'] },
  { e: (p) => `${p} tient un glaçon dans sa main : le glaçon fond. Pourquoi ?`,
    b: 'La chaleur passe de la main, plus chaude, vers le glaçon, plus froid.', f: ['Le froid du glaçon passe dans la main.', 'La chaleur passe du glaçon vers la main.', 'Le glaçon fond tout seul : la main n\'y est pour rien.'] },
  { e: (p) => `${p} a froid aux mains en hiver. Que se passe-t-il ?`,
    b: 'Ses mains perdent de la chaleur, qui passe vers l\'air plus froid.', f: ['Le froid de l\'air entre dans ses mains.', 'Son sang devient froid et refroidit ses mains de l\'intérieur.', 'L\'air froid lui donne de la chaleur.'] },
  { e: () => 'Quand s\'arrête le passage de la chaleur entre deux objets qui se touchent ?', b: 'Quand les deux objets ont la même température.',
    f: ['Quand l\'objet chaud est devenu le plus froid des deux.', 'Jamais : la chaleur passe sans fin.', 'Quand l\'objet froid est devenu le plus chaud des deux.'] },
  { e: () => 'Dans quel sens la chaleur (l\'énergie thermique) passe-t-elle toujours ?', b: 'D\'une matière chaude vers une matière plus froide.',
    f: ['D\'une matière froide vers une matière plus chaude.', 'Du bas vers le haut, toujours.', 'De la plus grosse matière vers la plus petite.'] },
  { e: (p) => `${p} souffle sur sa soupe chaude. Pourquoi la soupe refroidit-elle ?`, b: 'La soupe, plus chaude que l\'air, lui cède de la chaleur ; en soufflant, on remplace sans arrêt l\'air réchauffé par de l\'air plus frais.',
    f: ['Le souffle apporte du froid dans la soupe.', 'La soupe fabrique du froid quand on souffle.', 'Le souffle est plus chaud que la soupe.'] },
];
const CHALEUR_VF = [
  ['La chaleur passe toujours d\'une matière chaude vers une matière plus froide.', true, 'C\'est une loi de la nature : d\'elle-même, la chaleur ne passe jamais du froid vers le chaud.'],
  ['Un objet chaud posé dans une pièce refroidit jusqu\'à la température de la pièce.', true, 'Il perd de la chaleur tant qu\'il est plus chaud que l\'air autour, puis la température ne change plus.'],
  ['Un objet froid posé dans une pièce se réchauffe jusqu\'à devenir plus chaud que la pièce.', false, 'Il se réchauffe seulement jusqu\'à la température de la pièce : à ce moment, la chaleur ne passe plus.'],
  ['Quand on met un glaçon dans un jus, c\'est le froid du glaçon qui passe dans le jus.', false, 'C\'est la chaleur du jus qui passe dans le glaçon : le jus refroidit et le glaçon fond.'],
  ['Deux objets qui se touchent, et que rien ne chauffe ni ne refroidit, finissent par avoir la même température.', true, 'La chaleur passe du plus chaud vers le plus froid jusqu\'à ce que leurs températures soient égales.'],
  ['Si on mélange de l\'eau à 60 °C et de l\'eau à 20 °C, on obtient de l\'eau à 80 °C.', false, 'Les températures ne s\'additionnent pas : le mélange a une température entre 20 °C et 60 °C.'],
  ['Une cuillère en métal plongée dans une soupe chaude devient chaude.', true, 'La chaleur de la soupe passe dans la cuillère. Le métal est un bon conducteur thermique.'],
  ['Un pull en laine produit de la chaleur.', false, 'La laine ne produit pas de chaleur : c\'est un isolant qui ralentit la perte de la chaleur du corps.'],
];

function figureEquilibre(rng) {
  const k = rng.pick([2, 3, 4]); const V1 = rng.pick([100, 150, 200]);
  for (let essai = 0; essai < 40; essai++) {
    const T1 = rng.pick([60, 65, 70, 75, 80, 85]); const T2 = rng.pick([10, 15, 20]);
    const Te = (T1 + k * T2) / (1 + k);
    if (Te % 5 !== 0) continue;
    const r = 0.38 + rng.next() * 0.2; const xs = [0, 2, 4, 6, 8, 10, 12, 14];
    const tasse = xs.map((t) => Math.round(Te + (T1 - Te) * Math.exp(-r * t)));
    const bol = xs.map((t) => Math.round(Te - (Te - T2) * Math.exp(-r * t)));
    if (tasse[7] !== Te || bol[7] !== Te || tasse[6] !== Te || bol[6] !== Te) continue;
    return { k, V1, V2: k * V1, T1, T2, Te, xs, tasse, bol };
  }
  return null;
}

export function genererTransfert(modele, rng) {
  const forme = rng.pick(['sens', 'sens', 'sens', 'qui', 'finale', 'finale', 'melange', 'melange', 'courbe', 'courbe', 'courbe', 'pourquoi', 'vf']);
  const p = rng.pick(ENFANTS);
  if (forme === 'sens' || forme === 'qui' || forme === 'finale') {
    const pool = forme === 'finale' ? SIT_CHALEUR.filter((s) => s.env) : forme === 'qui' ? SIT_CHALEUR.filter((s) => !s.env && s.id !== 'rampe') : SIT_CHALEUR;
    const S = rng.pick(pool); const t = S.tire(rng);
    const sig = `${S.id}|${t.c}|${t.f}`;
    if (forme === 'sens') {
      const bonne = maj(`${deLe(S.chaud)} vers ${S.froid}`);
      const r = qcm(rng, bonne, [maj(`${deLe(S.froid)} vers ${S.chaud}`), maj(`Le froid passe ${deLe(S.froid)} vers ${S.chaud}`), 'La chaleur ne passe pas : chacun garde sa température']);
      return { ...r, enonce: `${S.txt(p, t)} Dans quel sens la chaleur passe-t-elle ?`,
        explication: `La chaleur passe toujours du plus chaud vers le plus froid : ${deLe(S.chaud)} (${deg(t.c)}) vers ${S.froid} (${deg(t.f)}). On ne dit pas que « le froid passe » : c'est la chaleur qui se déplace.`,
        _signature: `sens|${sig}|${triee(r.choix)}`, cleContenu: `sens|${sig}` };
    }
    if (forme === 'qui') {
      const chauffe = rng.next() < 0.5;
      const bonne = maj(chauffe ? S.froid : S.chaud);
      const r = qcm(rng, bonne, [maj(chauffe ? S.chaud : S.froid), 'Les deux', 'Aucun des deux']);
      return { ...r, enonce: `${S.txt(p, t)} Lequel des deux va ${chauffe ? 'se réchauffer' : 'se refroidir'} ?`,
        explication: `La chaleur passe ${deLe(S.chaud)} (${deg(t.c)}) vers ${S.froid} (${deg(t.f)}) : ${S.chaud} ${accord(S.chaud, 'se refroidit', 'se refroidissent')} et ${S.froid} ${accord(S.froid, 'se réchauffe', 'se réchauffent')}${S.note ?? ''}. La chaleur passe jusqu'à ce que leurs températures soient égales.`,
        _signature: `qui|${sig}|${chauffe}`, cleContenu: `qui|${sig}|${chauffe}` };
    }
    const Tenv = S.env === 'froid' ? t.f : t.c;
    return { type: 'numerique', reponse: Tenv, unite: '°C', enonce: `${S.txt(p, t)} Plusieurs heures plus tard, quelle est environ la température ${deLe(S.objet)} ?`,
      explication: `${maj(S.objet)} ${S.env === 'froid' ? 'perd de la chaleur' : 'reçoit de la chaleur'} tant que sa température est différente de celle ${deLe(S.env === 'froid' ? S.froid : S.chaud)}. Quand les températures sont égales, la chaleur ne passe plus : ${S.objet} finit à environ ${deg(Tenv)}, la température ${deLe(S.env === 'froid' ? S.froid : S.chaud)}.`,
      _signature: `fin|${sig}`, cleContenu: `fin|${sig}` };
  }
  if (forme === 'melange') {
    let T1; let T2;
    do { T1 = rng.int(9, 18) * 5; T2 = rng.int(2, 6) * 5; } while ((T1 + T2) % 2 || T1 - T2 < 30);
    const V = rng.pick([100, 150, 200, 250, 300]); const m = (T1 + T2) / 2;
    // Pièges : la somme et la différence (erreurs d'élève) et une valeur entre les deux
    // températures mais pas au milieu (oubli que les quantités sont égales).
    const q = Math.max(5, Math.round((T1 - T2) / 4 / 5) * 5);
    const pieges = [...new Set([T1 + T2, T1 - T2, rng.pick([m + q, m - q])])].filter((x) => x !== m && x > 0);
    if (pieges.length < 3) pieges.push(pieges.includes(m + q) ? m - q : m + q);
    const r = qcm(rng, deg(m), [...new Set(pieges)].filter((x) => x !== m).slice(0, 3).map(deg));
    return { ...r, enonce: `${p} verse ${V} ml d'eau à ${deg(T1)} et ${V} ml d'eau à ${deg(T2)} dans un même récipient. Quelle est environ la température du mélange ?`,
      explication: `L'eau chaude cède de la chaleur à l'eau froide jusqu'à ce qu'elles aient la même température : le mélange est forcément entre ${deg(T2)} et ${deg(T1)}. Avec la même quantité d'eau, c'est à peu près au milieu : (${T1} + ${T2}) : 2 = ${m} °C. Les températures ne s'additionnent pas.`,
      _signature: `mel|${T1}|${T2}|${V}|${triee(r.choix)}`, cleContenu: `mel|${T1}|${T2}|${V}` };
  }
  if (forme === 'courbe') {
    const E = figureEquilibre(rng); if (!E) return null;
    const inv = rng.next() < 0.5;
    const [nA, nB] = ['Courbe A', 'Courbe B'];
    const series = inv ? [{ nom: nA, v: E.bol }, { nom: nB, v: E.tasse }] : [{ nom: nA, v: E.tasse }, { nom: nB, v: E.bol }];
    const fig = svgCourbes({ titre: 'Température de l\'eau', xs: E.xs, series, xTitre: 'Temps (min)', yTitre: 'Température (°C)', yMin: 0, yMax: Math.ceil((E.T1 + 1) / 10) * 10, yPas: 5, yEtiq: 10 });
    const ctx = `${p} pose une tasse contenant ${E.V1} ml d'eau à ${deg(E.T1)} dans un bol contenant ${E.V2} ml d'eau à ${deg(E.T2)}. Le bol est placé dans une boîte en polystyrène. ${maj(pr(p))} mesure la température des deux eaux toutes les 2 minutes.`;
    const sig = `${E.T1}|${E.T2}|${E.k}|${E.V1}|${E.tasse.join(',')}|${inv}`;
    const q = rng.pick(['laquelle', 'finale', 'gain', 'perte', 'conclusion']);
    const nomTasse = inv ? nB : nA; const nomBol = inv ? nA : nB;
    if (q === 'laquelle') {
      const tasse = rng.next() < 0.5;
      const choix = [nA, nB];
      return { type: 'qcm', choix, reponse: choix.indexOf(tasse ? nomTasse : nomBol), figure: fig,
        enonce: `${ctx} Quelle courbe montre la température de l'eau ${tasse ? 'de la tasse' : 'du bol'} ?`,
        explication: `L'eau de la tasse part de ${deg(E.T1)} et se refroidit (${nomTasse}) ; l'eau du bol part de ${deg(E.T2)} et se réchauffe (${nomBol}). La chaleur passe de l'eau chaude vers l'eau froide.`,
        _signature: `cq|${sig}|${tasse}`, cleContenu: `cq|${sig}|${tasse}` };
    }
    if (q === 'finale') {
      return { type: 'numerique', reponse: E.Te, unite: '°C', figure: fig, enonce: `${ctx} À quelle température les deux eaux finissent-elles par arriver ?`,
        explication: `À la fin, les deux courbes se rejoignent à ${deg(E.Te)} : les deux eaux ont la même température, la chaleur ne passe plus. L'eau du bol, plus abondante, a moins changé de température que celle de la tasse.`,
        _signature: `cf|${sig}`, cleContenu: `cf|${sig}` };
    }
    if (q === 'gain' || q === 'perte') {
      const g = q === 'gain'; const d = g ? E.Te - E.T2 : E.T1 - E.Te;
      return { type: 'numerique', reponse: d, unite: '°C', figure: fig, enonce: `${ctx} De combien de degrés l'eau ${g ? 'du bol s\'est-elle réchauffée' : 'de la tasse s\'est-elle refroidie'} ?`,
        explication: `L'eau ${g ? `du bol passe de ${deg(E.T2)} à ${deg(E.Te)} : ${E.Te} − ${E.T2}` : `de la tasse passe de ${deg(E.T1)} à ${deg(E.Te)} : ${E.T1} − ${E.Te}`} = ${d} degrés.`,
        _signature: `cg|${sig}|${q}`, cleContenu: `cg|${sig}|${q}` };
    }
    const r = qcm(rng, 'La chaleur passe de l\'eau de la tasse vers l\'eau du bol, jusqu\'à ce qu\'elles aient la même température.',
      ['Le froid de l\'eau du bol passe dans l\'eau de la tasse.', 'L\'eau de la tasse devient plus froide que l\'eau du bol.', 'Chaque eau garde sa température de départ.']);
    return { ...r, figure: fig, enonce: `${ctx} Que montre ce graphique ?`,
      explication: `L'eau de la tasse (${deg(E.T1)}) se refroidit et l'eau du bol (${deg(E.T2)}) se réchauffe ; les deux courbes se rejoignent à ${deg(E.Te)}. La chaleur passe du chaud vers le froid jusqu'à l'équilibre des températures.`,
      _signature: `cc|${sig}|${triee(r.choix)}`, cleContenu: `cc|${sig}` };
  }
  if (forme === 'pourquoi') {
    const Q = rng.pick(CHALEUR_QCM);
    const r = qcm(rng, Q.b, Q.f);
    return { ...r, enonce: Q.e(p), explication: `${Q.b} La chaleur passe toujours du plus chaud vers le plus froid, jusqu'à ce que les températures soient égales.`,
      _signature: `pq|${Q.b}|${p}|${triee(r.choix)}`, cleContenu: `pq|${Q.b}|${p}` };
  }
  const [t, v, x] = rng.pick(CHALEUR_VF);
  return { type: 'vrai_faux', reponse: v, enonce: `Vrai ou faux ? ${t}`, explication: `${v ? 'Vrai' : 'Faux'}. ${x}`, _signature: `vf|${t}` };
}

// ================================================================ 10. LIMITER LES PERTES DE CHALEUR
const ECO_SITUATIONS = [
  { e: (f) => `La famille ${f} remplace ses vieilles fenêtres à simple vitrage par du double vitrage. Pourquoi cela permet-il d'économiser de l'énergie ?`,
    b: 'La couche d\'air (ou de gaz) entre les deux vitres est un isolant : la chaleur de la maison s\'échappe moins.',
    f: ['Le double vitrage produit de la chaleur.', 'Le double vitrage empêche le froid d\'entrer dans la maison.', 'Le double vitrage laisse entrer plus de soleil.'] },
  { e: (f) => `La famille ${f} pose une épaisse couche de laine de roche sous son toit. Pourquoi ?`,
    b: 'La laine de roche est un isolant : elle ralentit les pertes de chaleur par le toit.',
    f: ['La laine de roche produit de la chaleur.', 'La laine de roche est un bon conducteur thermique.', 'La laine de roche aspire le froid de la maison.'] },
  { e: (f) => `Le soir, en hiver, la famille ${f} ferme les volets et tire les rideaux épais. Pourquoi ?`,
    b: 'Les volets et les rideaux gardent une couche d\'air près des fenêtres : moins de chaleur s\'échappe.',
    f: ['Les rideaux réchauffent la pièce en produisant de la chaleur.', 'Les volets empêchent le froid d\'entrer.', 'C\'est seulement pour que les voisins ne voient pas à l\'intérieur.'] },
  { e: (f) => `La famille ${f} baisse son thermostat de 21 °C à 19 °C. Pourquoi est-ce une économie d'énergie ?`,
    b: 'Plus la maison est chaude par rapport à l\'extérieur, plus elle perd de chaleur : en chauffant un peu moins, on consomme moins.',
    f: ['À 19 °C, la chaudière s\'arrête complètement.', 'À 19 °C, le froid n\'entre plus dans la maison.', 'Cela ne change rien à la consommation.'] },
  { e: (f) => `En hiver, la famille ${f} aère en ouvrant grand les fenêtres 5 minutes, plutôt que de les laisser entrouvertes toute la journée. Pourquoi ?`,
    b: 'L\'air est vite renouvelé, mais les murs et les meubles n\'ont pas le temps de se refroidir : on perd moins de chaleur.',
    f: ['Quand les fenêtres sont grandes ouvertes, le froid n\'a pas le temps d\'entrer.', 'Une fenêtre entrouverte renouvelle l\'air plus vite qu\'une fenêtre grande ouverte.', 'Aérer longtemps réchauffe les murs.'] },
  { e: (f) => `La famille ${f} ferme toujours la porte entre le salon chauffé et le garage froid. Pourquoi ?`,
    b: 'La porte fermée ralentit le passage de la chaleur du salon vers le garage, plus froid : on chauffe seulement la pièce utilisée.',
    f: ['Pour que le froid du garage ne passe pas dans le salon.', 'Pour que le garage se réchauffe plus vite.', 'Pour que la chaleur du garage reste dans le garage.'] },
  { e: (p) => `${p} met un couvercle sur la casserole pour faire bouillir l'eau des pâtes. Pourquoi ?`,
    b: 'La chaleur s\'échappe moins : l\'eau bout plus vite et on utilise moins d\'énergie.',
    f: ['Le métal du couvercle chauffe l\'eau par le dessus.', 'Le couvercle empêche le froid d\'entrer dans la casserole.', 'Le couvercle fait bouillir l\'eau à plus de 100 °C.'], enfant: true },
  { e: (p) => `${p} emporte son thé dans une bouteille isotherme (thermos). Pourquoi le thé reste-t-il chaud longtemps ?`,
    b: 'Les deux parois de la bouteille sont séparées par du vide (ou de l\'air) qui laisse très mal passer la chaleur.',
    f: ['La bouteille isotherme produit de la chaleur.', 'La bouteille est en métal, un bon conducteur thermique.', 'Le bouchon empêche le froid d\'entrer dans la bouteille.'], enfant: true },
  { e: (p) => `${p} met ses boissons dans une glacière en polystyrène pour le pique-nique. Pourquoi restent-elles fraîches ?`,
    b: 'Le polystyrène est un isolant : il ralentit le passage de la chaleur de l\'air vers les boissons.',
    f: ['Le polystyrène produit du froid.', 'Le polystyrène est un bon conducteur thermique.', 'Le polystyrène attire le froid de l\'air.'], enfant: true },
  { e: (p) => `En hiver, ${p} porte plusieurs couches de vêtements (t-shirt, pull, veste). Pourquoi a-t-${pr(p)} plus chaud ?`,
    b: 'Entre les couches, de l\'air reste emprisonné : c\'est un bon isolant, la chaleur du corps s\'échappe moins.',
    f: ['Chaque vêtement produit de la chaleur.', 'Les vêtements empêchent le froid d\'entrer dans le corps.', 'Les vêtements serrés font circuler le sang plus vite.'], enfant: true },
  { e: () => 'En hiver, les oiseaux gonflent leurs plumes. Pourquoi ?',
    b: 'Ils emprisonnent de l\'air entre les plumes : cet air isole et leur corps perd moins de chaleur.',
    f: ['Les plumes gonflées produisent de la chaleur.', 'Pour paraître plus gros et faire peur au froid.', 'Les plumes gonflées laissent mieux sortir la chaleur.'] },
  { e: (p) => `${p} remarque que les casseroles ont un fond en métal et une poignée en bois ou en plastique. Pourquoi ?`,
    b: 'Le métal conduit bien la chaleur vers les aliments ; le bois et le plastique sont isolants : la poignée ne devient pas brûlante.',
    f: ['Le métal est isolant et le bois est conducteur.', 'Le bois produit du froid pour protéger la main.', 'C\'est seulement pour décorer la casserole.'], enfant: true },
  { e: (f) => `La famille ${f} fait isoler les murs de sa maison avec des plaques de polystyrène. Quel est le but ?`,
    b: 'Ralentir le passage de la chaleur de l\'intérieur chaud vers l\'extérieur froid.',
    f: ['Empêcher le froid de l\'extérieur d\'entrer.', 'Produire de la chaleur dans les murs.', 'Rendre les murs plus conducteurs.'] },
  { e: (f) => `La famille ${f} pose un boudin de bas de porte sous la porte d'entrée. Pourquoi ?`,
    b: 'Il bouche le passage sous la porte : l\'air chaud de la maison ne s\'échappe plus par là.',
    f: ['Il produit de la chaleur.', 'Il conduit la chaleur vers l\'extérieur.', 'Il empêche la porte de grincer.'] },
];
const GESTES_BONS = [
  'Fermer les volets et les rideaux le soir', 'Baisser le chauffage d\'un degré',
  'Fermer la porte des pièces non chauffées', 'Isoler le toit', 'Remplacer le simple vitrage par du double vitrage', 'Mettre un pull plutôt que monter le chauffage',
  'Baisser le chauffage la nuit et quand on part', 'Poser un boudin sous la porte d\'entrée', 'Isoler les murs', 'Fermer la porte d\'entrée rapidement en hiver',
];
const GESTES_MAUVAIS = [
  'Laisser une fenêtre entrouverte toute la journée avec le chauffage allumé', 'Monter le chauffage à 23 °C plutôt que de mettre un pull', 'Laisser la porte de la cave ouverte pour que l\'air circule',
  'Couvrir le radiateur avec du linge et des meubles', 'Laisser les volets ouverts toute la nuit en hiver', 'Laisser le chauffage de sa chambre allumé pendant qu\'on est à l\'école',
  'Aérer en laissant la fenêtre basculée pendant des heures', 'Garder des fenêtres à simple vitrage qui laissent passer l\'air',
];
const ISOLANTS = ['de la laine', 'du polystyrène', 'du liège', 'du feutre (un tissu épais)'];
const CONDUCTEURS = ['de l\'aluminium', 'du cuivre', 'du fer', 'de l\'acier'];
const GARDER = ['fabriquer une boîte pour garder une pizza chaude pendant le trajet', 'fabriquer une glacière pour garder des boissons fraîches', 'fabriquer un couvre-théière pour garder le thé chaud',
  'emballer un glaçon pour qu\'il fonde le moins vite possible', 'fabriquer un manchon pour garder une gourde d\'eau fraîche', 'isoler une niche pour que son chien n\'ait pas froid en hiver'];
const PASSER = ['fabriquer le fond d\'une casserole qui chauffe vite', 'fabriquer une poêle qui transmet bien la chaleur aux aliments', 'fabriquer un radiateur qui chauffe bien la pièce'];
const CHAUFFAGE = [{ u: 'litres de mazout', a: [1600, 3200], g: [0.18, 0.35] }, { u: 'mètres cubes de gaz', a: [1400, 2800], g: [0.18, 0.35] }];
const ECO_VF = [
  ['Un isolant thermique produit de la chaleur.', false, 'Un isolant ne produit pas de chaleur : il ralentit son passage.'],
  ['Un isolant peut aussi garder au froid ce qui est froid.', true, 'Il ralentit le passage de la chaleur dans les deux sens : une glacière garde les boissons fraîches.'],
  ['L\'air immobile est un bon isolant thermique.', true, 'C\'est pour cela qu\'on utilise le double vitrage, la laine ou les vêtements en couches : ils emprisonnent de l\'air.'],
  ['Les métaux sont de bons isolants thermiques.', false, 'Les métaux sont de bons conducteurs thermiques : la chaleur les traverse facilement.'],
  ['Une grande partie de l\'énergie utilisée à la maison sert à se chauffer.', true, 'En Belgique, le chauffage des maisons consomme beaucoup d\'énergie : bien isoler permet d\'en économiser.'],
  ['Isoler une maison permet de consommer moins de mazout ou de gaz.', true, 'La chaleur s\'échappe moins : la chaudière doit produire moins de chaleur.'],
  ['Le double vitrage empêche le froid d\'entrer dans la maison.', false, 'Ce n\'est pas le froid qui entre : c\'est la chaleur qui sort. Le double vitrage ralentit sa sortie.'],
  ['Un pull en laine réchauffe parce qu\'il fabrique de la chaleur.', false, 'Le pull ne fabrique rien : il ralentit la perte de la chaleur produite par le corps.'],
];

export function genererEconomie(modele, rng) {
  const forme = rng.pick(['situation', 'situation', 'situation', 'geste', 'geste', 'grille', 'grille', 'materiau', 'materiau', 'calcul', 'calcul', 'vf']);
  const p = rng.pick(ENFANTS); const fam = rng.pick(NOMS_FAMILLE);
  if (forme === 'situation') {
    const i = rng.int(0, ECO_SITUATIONS.length - 1); const S = ECO_SITUATIONS[i];
    const qui = S.enfant ? p : fam;
    const r = qcm(rng, S.b, S.f);
    return { ...r, enonce: S.e(qui), explication: `${S.b} Rappel : la chaleur passe toujours du chaud vers le froid ; un isolant ralentit ce passage, un métal (conducteur thermique) le facilite.`,
      _signature: `sit|${i}|${qui}|${r.choix.join('|')}`, cleContenu: `sit|${i}|${qui}` };
  }
  if (forme === 'geste') {
    const bon = rng.next() < 0.6;
    const [A, B] = bon ? [GESTES_BONS, GESTES_MAUVAIS] : [GESTES_MAUVAIS, GESTES_BONS];
    const b = rng.pick(A); const f = rng.shuffle(B).slice(0, 3);
    const r = qcm(rng, b, f);
    return { ...r, enonce: bon ? `La famille ${fam} veut dépenser moins d'énergie pour se chauffer. Lequel de ces gestes l'aide à limiter les pertes de chaleur ?` : `Lequel de ces gestes fait gaspiller de l'énergie de chauffage ?`,
      explication: bon ? `« ${b} » limite les pertes de chaleur. Les autres gestes laissent la chaleur s'échapper ou font chauffer pour rien.` : `« ${b} » gaspille l'énergie : la chaleur s'échappe ou on chauffe pour rien. Les autres gestes aident à économiser.`,
      _signature: `geste|${bon}|${b}|${triee(f)}`, cleContenu: `geste|${bon}|${b}|${triee(f)}` };
  }
  if (forme === 'grille') {
    const nb = rng.int(1, 3);
    const tires = rng.shuffle([...rng.shuffle(GESTES_BONS).slice(0, nb).map((g) => [g, 0]), ...rng.shuffle(GESTES_MAUVAIS).slice(0, 4 - nb).map((g) => [g, 1])]);
    return { type: 'grille', enonce: 'Ces gestes aident-ils à économiser l\'énergie de chauffage, ou la gaspillent-ils ?', lignes: tires.map(([g]) => g), colonnes: ['Économise', 'Gaspille'],
      reponse: tires.map(([, k]) => k), points: 4,
      explication: `Économisent l'énergie : ${tires.filter(([, k]) => k === 0).map(([g]) => minus(g)).join(' ; ') || 'aucun'}. Gaspillent : ${tires.filter(([, k]) => k === 1).map(([g]) => minus(g)).join(' ; ') || 'aucun'}.`,
      _signature: `grille|${triee(tires.map(([g]) => g))}`, cleContenu: `grille|${triee(tires.map(([g]) => g))}` };
  }
  if (forme === 'materiau') {
    const garder = rng.next() < 0.7;
    const but = garder ? rng.pick(GARDER) : rng.pick(PASSER);
    const b = garder ? rng.pick(ISOLANTS) : rng.pick(CONDUCTEURS);
    const f = rng.shuffle(garder ? CONDUCTEURS : ISOLANTS).slice(0, 3);
    const r = qcm(rng, maj(b), f.map(maj));
    return { ...r, fiche: 'sc-chaleur', enonce: `${p} veut ${but}. Quel matériau doit-${pr(p)} choisir ?`,
      explication: garder ? `${maj(b)} : c'est un isolant thermique, il ralentit le passage de la chaleur. Les métaux (${f.map((x) => x.replace(/^de l'|^du /, '')).join(', ')}) sont de bons conducteurs thermiques : la chaleur les traverse facilement.`
        : `${maj(b)} : c'est un métal, un bon conducteur thermique, la chaleur le traverse facilement. Les autres matériaux sont des isolants thermiques.`,
      _signature: `mat|${but}|${b}|${triee(f)}`, cleContenu: `mat|${but}|${b}|${triee(f)}` };
  }
  if (forme === 'calcul') {
    const C = rng.pick(CHAUFFAGE);
    const avant = rng.int(C.a[0] / 50, C.a[1] / 50) * 50;
    const gain = Math.round((avant * (C.g[0] + rng.next() * (C.g[1] - C.g[0]))) / 10) * 10;
    const apres = avant - gain; const trav = rng.pick(['isolé son toit', 'installé du double vitrage', 'isolé ses murs', 'isolé son toit et ses murs']);
    const q = rng.pick(['diff', 'diff', 'mois']);
    if (q === 'mois' && gain % 12) return null;
    if (q === 'mois') {
      return { type: 'numerique', reponse: gain / 12, unite: C.u, enonce: `Avant les travaux, la famille ${fam} utilisait ${fmt(avant)} ${C.u} par an pour se chauffer. Depuis qu'elle a ${trav}, elle en utilise ${fmt(apres)}. En moyenne, combien de ${C.u} économise-t-elle par mois ?`,
        explication: `Économie par an : ${fmt(avant)} − ${fmt(apres)} = ${fmt(gain)} ${C.u}. Par mois : ${fmt(gain)} : 12 = ${fmt(gain / 12)} ${C.u}. Une maison mieux isolée perd moins de chaleur : elle consomme moins.`,
        _signature: `cm|${C.u}|${avant}|${apres}|${trav}`, cleContenu: `cm|${C.u}|${avant}|${apres}` };
    }
    return { type: 'numerique', reponse: gain, unite: C.u, enonce: `Avant les travaux, la famille ${fam} utilisait ${fmt(avant)} ${C.u} par an pour se chauffer. Depuis qu'elle a ${trav}, elle en utilise ${fmt(apres)} par an. Combien de ${C.u} économise-t-elle chaque année ?`,
      explication: `${fmt(avant)} − ${fmt(apres)} = ${fmt(gain)} ${C.u}. La chaleur s'échappe moins de la maison : la chaudière doit en produire moins.`,
      _signature: `cd|${C.u}|${avant}|${apres}|${trav}`, cleContenu: `cd|${C.u}|${avant}|${apres}` };
  }
  const [t, v, x] = rng.pick(ECO_VF);
  return { type: 'vrai_faux', reponse: v, enonce: `Vrai ou faux ? ${t}`, explication: `${v ? 'Vrai' : 'Faux'}. ${x}`, _signature: `vf|${t}` };
}

// ================================================================ 11. INSTRUMENTS DE MESURE ET UNITÉS
// Grandeurs du primaire (P4-P6). Le dynamomètre et le newton ne sont vus qu'en S1 : exclus.
const UN = { '°C': 'en degrés Celsius (°C)', g: 'en grammes (g)', kg: 'en kilogrammes (kg)', s: 'en secondes (s)', min: 'en minutes (min)', ml: 'en millilitres (ml)', l: 'en litres (l)', mm: 'en millimètres (mm)', cm: 'en centimètres (cm)' };
const GRANDEURS = {
  temp: { sert: 'à mesurer une température', instr: ['un thermomètre'], unites: ['°C'], ctx: [
    { t: 'la température de l\'eau du bain de son petit frère', u: '°C', v: [35, 39] }, { t: 'la température de l\'air dans la classe', u: '°C', v: [18, 23] },
    { t: 'la température de l\'eau d\'une mare en hiver', u: '°C', v: [2, 8] }, { t: 'la température de l\'eau qui chauffe dans une casserole', u: '°C', v: [40, 95] },
    { t: 'la température à l\'intérieur du frigo', u: '°C', v: [3, 7] }, { t: 'la température de l\'eau d\'un pot entouré de laine', u: '°C', v: [30, 70] }] },
  masse: { sert: 'à mesurer une masse', instr: ['une balance'], unites: ['g', 'kg'], ctx: [
    { t: 'la masse de trois pommes', u: 'g', v: [35, 60], k: 10 }, { t: 'la masse d\'un chaton', u: 'g', v: [40, 90], k: 10 },
    { t: 'la masse du sable utilisé pour une expérience', u: 'g', v: [10, 50], k: 10 }, { t: 'la masse d\'un glaçon avant qu\'il fonde', u: 'g', v: [18, 40] },
    { t: 'la masse de son cartable', u: 'kg', v: [3, 7] }, { t: 'la masse d\'un sac de pommes de terre', u: 'kg', v: [2, 10] }] },
  duree: { sert: 'à mesurer une durée', instr: ['un chronomètre'], unites: ['s', 'min'], ctx: [
    { t: 'le temps que met un glaçon pour fondre complètement', u: 'min', v: [15, 60] }, { t: 'le temps de sa course de 60 mètres', u: 's', v: [9, 15] },
    { t: 'le temps que met un morceau de sucre pour se dissoudre', u: 's', v: [30, 180] }, { t: 'le temps pendant lequel une bougie reste allumée sous un bocal', u: 's', v: [5, 30] },
    { t: 'le temps que met l\'eau d\'une casserole pour bouillir', u: 'min', v: [5, 12] }] },
  volume: { sert: 'à mesurer un volume de liquide', instr: ['un verre gradué', 'une éprouvette graduée'], unites: ['ml', 'l'], ctx: [
    { t: 'le volume de lait pour une pâte à crêpes', u: 'ml', v: [5, 10], k: 50 }, { t: 'le volume d\'eau versé dans chaque pot de l\'expérience', u: 'ml', v: [2, 6], k: 50 },
    { t: 'le volume d\'eau resté dans un verre après trois jours', u: 'ml', v: [4, 18], k: 5 }, { t: 'le volume d\'huile pour une recette', u: 'ml', v: [2, 6], k: 10 }] },
  pluie: { sert: 'à mesurer la quantité de pluie tombée', instr: ['un pluviomètre'], unites: ['mm'], ctx: [
    { t: 'la quantité de pluie tombée pendant la nuit', u: 'mm', v: [2, 25] }, { t: 'la quantité de pluie tombée pendant un orage', u: 'mm', v: [5, 40] }] },
  longueur: { sert: 'à mesurer une longueur', instr: ['un mètre ruban'], unites: ['cm'], ctx: [
    { t: 'la hauteur d\'un plant de haricot', u: 'cm', v: [5, 40] }, { t: 'la longueur d\'un ver de terre', u: 'cm', v: [6, 20] }, { t: 'la taille d\'un élève de sa classe', u: 'cm', v: [135, 160] }] },
};
// Pour « écrire le résultat » : unités de la même grandeur (le piège est l'échelle, pas la grandeur).
// La température n'a qu'une unité au primaire : pas de question d'écriture pour elle.
const ECHELLE = { mm: 1, cm: 10, m: 1000, km: 1e6, mg: 1, g: 1e3, kg: 1e6, t: 1e9, s: 1, min: 60, h: 3600, j: 86400, ml: 1, cl: 10, dl: 100, l: 1000 };
const UNITES_SOEURS = { longueur: ['mm', 'cm', 'm', 'km'], masse: ['mg', 'g', 'kg', 't'], duree: ['s', 'min', 'h', 'j'], volume: ['ml', 'cl', 'dl', 'l'], pluie: ['mm', 'cm', 'm', 'ml'] };
// Grandeurs qu'on ne propose jamais ensemble (sinon deux réponses défendables).
const CONFLITS = { masse: ['volume'], volume: ['masse', 'pluie'], pluie: ['volume', 'longueur'], longueur: ['pluie'] };
const compatibles = (g) => Object.keys(GRANDEURS).filter((x) => x !== g && !(CONFLITS[g] ?? []).includes(x));

function figThermometre(lo, hi, pas, etiq, val) {
  const W = 230; const H = 360; const x0 = 98; const yb = 318; const yT = 290; const yH = 34;
  const y = (t) => yT - ((t - lo) / (hi - lo)) * (yT - yH);
  let s = `<text x="${x0 + 8}" y="20" font-size="13" font-weight="bold" text-anchor="middle" fill="${ENCRE}">°C</text>`;
  s += `<rect x="${x0}" y="${yH - 10}" width="16" height="${yb - yH}" rx="8" fill="#ffffff" stroke="${ENCRE}" stroke-width="1.8"/>`;
  s += `<rect x="${x0 + 4}" y="${y(val).toFixed(1)}" width="8" height="${(yb - y(val)).toFixed(1)}" fill="#c0392b"/>`;
  s += `<circle cx="${x0 + 8}" cy="${yb}" r="16" fill="#c0392b" stroke="${ENCRE}" stroke-width="1.8"/>`;
  for (let t = lo; t <= hi + 1e-9; t += pas) {
    const maj5 = Math.abs(((t - lo) / etiq) - Math.round((t - lo) / etiq)) < 1e-9;
    const yy = y(t).toFixed(1);
    s += `<line x1="${x0 + 18}" y1="${yy}" x2="${x0 + 18 + (maj5 ? 16 : 8)}" y2="${yy}" stroke="${ENCRE}" stroke-width="${maj5 ? 1.6 : 1}"/>`;
    if (maj5) s += `<text x="${x0 + 40}" y="${(+yy + 4.5).toFixed(1)}" font-size="13" fill="${ENCRE}">${fmt(t)}</text>`;
  }
  return svg(W, H, s);
}
function figEprouvette(max, pas, etiq, val, unite, pluvio) {
  const W = 260; const H = 360; const xa = 90; const xb = 150; const yB = 316; const yH = 56;
  const y = (v) => yB - (v / max) * (yB - yH);
  let s = '';
  if (pluvio) s += `<path d="M60 18 L180 18 L${xb} 50 L${xa} 50 Z" fill="#ffffff" stroke="${ENCRE}" stroke-width="1.8"/>`;
  s += `<rect x="${xa}" y="${y(val).toFixed(1)}" width="${xb - xa}" height="${(yB - y(val)).toFixed(1)}" fill="#a9c9ec"/>`;
  s += `<line x1="${xa}" y1="${y(val).toFixed(1)}" x2="${xb}" y2="${y(val).toFixed(1)}" stroke="#1f5fbf" stroke-width="2"/>`;
  s += `<path d="M${xa} ${pluvio ? 50 : 40} L${xa} ${yB} L${xb} ${yB} L${xb} ${pluvio ? 50 : 40}" fill="none" stroke="${ENCRE}" stroke-width="2"/>`;
  s += `<rect x="${xa - 8}" y="${yB}" width="${xb - xa + 16}" height="10" rx="2" fill="#d5dae3" stroke="${ENCRE}" stroke-width="1.4"/>`;
  for (let v = 0; v <= max + 1e-9; v += pas) {
    const m = Math.abs(v / etiq - Math.round(v / etiq)) < 1e-9; const yy = y(v).toFixed(1);
    s += `<line x1="${xb}" y1="${yy}" x2="${xb - (m ? 18 : 9)}" y2="${yy}" stroke="${ENCRE}" stroke-width="${m ? 1.5 : 1}"/>`;
    if (m) s += `<text x="${xb + 14}" y="${(+yy + 4.5).toFixed(1)}" font-size="13" fill="${ENCRE}">${fmt(v)}</text>`;
  }
  s += `<text x="${pluvio ? 194 : xb + 14}" y="${pluvio ? 38 : yH - 14}" font-size="13" font-weight="bold" fill="${ENCRE}">${unite}</text>`;
  return svg(W, H, s);
}
function figChrono(m, sec) {
  const W = 320; const H = 220; const d2 = (n) => String(n).padStart(2, '0');
  let s = `<rect x="146" y="10" width="28" height="18" rx="4" fill="#d5dae3" stroke="${ENCRE}" stroke-width="1.6"/>`;
  s += `<circle cx="160" cy="120" r="88" fill="#f2f5fa" stroke="${ENCRE}" stroke-width="2.4"/>`;
  s += `<rect x="82" y="88" width="156" height="58" rx="6" fill="#ffffff" stroke="${ENCRE}" stroke-width="1.8"/>`;
  s += `<text x="160" y="132" font-size="38" font-family="Courier New, monospace" font-weight="bold" text-anchor="middle" fill="${ENCRE}">${d2(m)}:${d2(sec)}</text>`;
  s += `<text x="122" y="166" font-size="13" text-anchor="middle" fill="${ENCRE}">min</text><text x="198" y="166" font-size="13" text-anchor="middle" fill="${ENCRE}">s</text>`;
  return svg(W, H, s);
}
function figBalance(affiche, objet) {
  const W = 320; const H = 220;
  let s = `<rect x="${160 - largeur(objet, 13) / 2 - 12}" y="34" width="${largeur(objet, 13) + 24}" height="44" rx="6" fill="#f6e7c8" stroke="${ENCRE}" stroke-width="1.6"/>`;
  s += `<text x="160" y="61" font-size="13" text-anchor="middle" fill="${ENCRE}">${esc(objet)}</text>`;
  s += `<ellipse cx="160" cy="84" rx="96" ry="9" fill="#d5dae3" stroke="${ENCRE}" stroke-width="1.6"/>`;
  s += `<path d="M58 100 L262 100 L282 196 L38 196 Z" fill="#f2f5fa" stroke="${ENCRE}" stroke-width="2"/>`;
  s += `<rect x="96" y="128" width="128" height="44" rx="5" fill="#ffffff" stroke="${ENCRE}" stroke-width="1.8"/>`;
  s += `<text x="160" y="159" font-size="24" font-family="Courier New, monospace" font-weight="bold" text-anchor="middle" fill="${ENCRE}">${esc(affiche)}</text>`;
  return svg(W, H, s);
}
const valeurCtx = (rng, c) => rng.int(c.v[0], c.v[1]) * (c.k ?? 1);

export function genererMesures(modele, rng) {
  const forme = rng.pick(['instrument', 'instrument', 'ecriture', 'ecriture', 'ecriture', 'grandeur', 'grille', 'thermo', 'thermo', 'eprouvette', 'pluvio', 'chrono', 'balance']);
  const p = rng.pick(ENFANTS);
  const G = Object.keys(GRANDEURS);
  if (forme === 'instrument' || forme === 'unite' || forme === 'ecriture') {
    const g = rng.pick(forme === 'ecriture' ? Object.keys(UNITES_SOEURS) : G); const c = rng.pick(GRANDEURS[g].ctx); const autres = rng.shuffle(compatibles(g)).slice(0, 3);
    const instr = rng.pick(GRANDEURS[g].instr);
    if (forme === 'instrument') {
      const faux = autres.map((x) => rng.pick(GRANDEURS[x].instr));
      const r = qcm(rng, maj(instr), faux.map(maj));
      return { ...r, enonce: `${p} veut mesurer ${c.t}. Quel instrument doit-${pr(p)} utiliser ?`,
        explication: `Pour mesurer ${c.t}, on utilise ${instr} : ${/^une /.test(instr) ? 'elle' : 'il'} sert ${GRANDEURS[g].sert}. On exprime le résultat ${UN[c.u]}.`,
        _signature: `ins|${c.t}|${instr}|${triee(faux)}`, cleContenu: `ins|${c.t}|${triee(faux)}` };
    }
    if (forme === 'unite') {
      const faux = autres.map((x) => UN[rng.pick(GRANDEURS[x].unites)]);
      const r = qcm(rng, maj(UN[c.u]), faux.map(maj));
      return { ...r, enonce: `Avec ${instr}, ${p} mesure ${c.t}. Dans quelle unité va-t-${pr(p)} exprimer son résultat ?`,
        explication: `${maj(instr)} sert ${GRANDEURS[g].sert}. Ici, on exprime le résultat ${UN[c.u]}.`,
        _signature: `uni|${c.t}|${instr}|${triee(faux)}`, cleContenu: `uni|${c.t}|${triee(faux)}` };
    }
    const val = valeurCtx(rng, c);
    const bonne = `${fmt(val)} ${c.u}`;
    // Pièges : unités de la même grandeur, à une autre échelle (13 mm, 13 m, 13 km pour un ver de 13 cm).
    // Pas d'unité voisine (rapport 10 : 30 ml / 30 cl, 13 cm / 13 mm), qui donnerait souvent une valeur plausible aussi.
    const faux = rng.shuffle(UNITES_SOEURS[g].filter((u) => u !== c.u && !(!(g === 'pluie' && (u === 'ml' || c.u === 'ml')) && Math.max(ECHELLE[u] / ECHELLE[c.u], ECHELLE[c.u] / ECHELLE[u]) < 50))).slice(0, 3).map((u) => `${fmt(val)} ${u}`);
    const r = qcm(rng, bonne, faux);
    return { ...r, enonce: `Avec ${instr}, ${p} mesure ${c.t}. L'instrument indique ${fmt(val)}. Comment écrire correctement le résultat ?`,
      explication: `${maj(instr)} sert ${GRANDEURS[g].sert} : le résultat s'écrit ${bonne}. Un nombre sans la bonne unité ne veut rien dire en sciences.`,
      _signature: `ecr|${c.t}|${val}|${triee(faux)}`, cleContenu: `ecr|${c.t}|${val}` };
  }
  if (forme === 'grandeur') {
    const g = rng.pick(G); const instr = rng.pick(GRANDEURS[g].instr); const autres = rng.shuffle(compatibles(g)).slice(0, 3);
    const r = qcm(rng, maj(GRANDEURS[g].sert), autres.map((x) => maj(GRANDEURS[x].sert)));
    return { ...r, enonce: `À quoi sert ${instr} ?`, explication: `${maj(instr)} sert ${GRANDEURS[g].sert}. Unité : ${GRANDEURS[g].unites.map((u) => UN[u].replace(/^en /, '')).join(' ou ')}.`,
      _signature: `gr|${instr}|${triee(autres)}`, cleContenu: `gr|${instr}|${triee(autres)}` };
  }
  if (forme === 'grille') {
    let gs;
    for (let essai = 0; essai < 20; essai++) {
      gs = rng.shuffle(G).slice(0, 4);
      if (gs.every((a) => gs.every((b) => !(CONFLITS[a] ?? []).includes(b)))) break;
      gs = null;
    }
    if (!gs) return null;
    const lignes = gs.map((g) => maj(rng.pick(GRANDEURS[g].instr)));
    const colonnes = rng.shuffle(gs).map((g) => maj(GRANDEURS[g].sert.replace(/^à mesurer /, '')));
    return { type: 'grille', enonce: 'Que mesure chacun de ces instruments ?', lignes, colonnes,
      reponse: gs.map((g) => colonnes.indexOf(maj(GRANDEURS[g].sert.replace(/^à mesurer /, '')))), points: 4,
      explication: `${gs.map((g, i) => `${lignes[i]} : ${GRANDEURS[g].sert.replace(/^à mesurer /, '')} (${GRANDEURS[g].unites.join(' ou ')})`).join(' ; ')}.`,
      _signature: `grille|${lignes.join(',')}|${colonnes.join(',')}`, cleContenu: `grille|${triee(lignes)}` };
  }
  if (forme === 'thermo') {
    const [lo, hi, pas, etiq] = rng.pick([[-10, 30, 1, 5], [0, 40, 1, 5], [10, 50, 1, 5], [-20, 40, 2, 10], [0, 60, 2, 10], [20, 100, 2, 10]]);
    const n = Math.round((hi - lo) / pas); let k = rng.int(Math.max(1, Math.floor(-lo / pas) + 1), n - 1); // valeur positive (les réponses numériques négatives ne sont pas admises)
    if (rng.next() < 0.8 && ((k * pas) % etiq === 0)) k += 1;
    const val = lo + k * pas;
    const c = val > 60 ? 'L\'eau chauffe sur la cuisinière.' : '';
    return { type: 'numerique', reponse: val, unite: '°C', figure: figThermometre(lo, hi, pas, etiq, val),
      enonce: `${p} relève une température. ${c} Quelle température indique ce thermomètre ?`.replace(/ {2}/g, ' '),
      explication: `Entre deux nombres écrits, il y a ${etiq} °C, partagés en ${etiq / pas} intervalles : chaque petit trait vaut ${pas} °C. Le haut de la colonne rouge est à ${deg(val)}.`,
      _signature: `th|${lo}|${pas}|${val}`, cleContenu: `th|${lo}|${pas}|${val}` };
  }
  if (forme === 'eprouvette' || forme === 'pluvio') {
    const pl = forme === 'pluvio';
    const [max, pas, etiq] = pl ? rng.pick([[40, 1, 5], [60, 2, 10], [30, 1, 5]]) : rng.pick([[100, 5, 20], [100, 2, 10], [250, 10, 50], [500, 20, 100], [200, 5, 50]]);
    const n = Math.round(max / pas); let k = rng.int(2, n - 1);
    if (rng.next() < 0.8 && ((k * pas) % etiq === 0)) k += 1;
    const val = k * pas; const u = pl ? 'mm' : 'ml';
    const instr = pl ? 'ce pluviomètre' : rng.pick(['cette éprouvette graduée', 'ce verre gradué']);
    return { type: 'numerique', reponse: val, unite: u, figure: figEprouvette(max, pas, etiq, val, u, pl),
      enonce: pl ? `Après une averse, ${p} lit le niveau de l'eau dans le pluviomètre de l'école. Combien de millimètres de pluie sont tombés ?`
        : `${p} a versé de l'eau dans ${instr}. Quel volume d'eau contient-${/^cette/.test(instr) ? 'elle' : 'il'} ?`,
      explication: `Entre deux nombres écrits, il y a ${fmt(etiq)} ${u}, partagés en ${etiq / pas} intervalles : chaque petit trait vaut ${fmt(pas)} ${u}. Le niveau de l'eau est à ${fmt(val)} ${u}.`,
      _signature: `${forme}|${max}|${pas}|${val}`, cleContenu: `${forme}|${max}|${pas}|${val}` };
  }
  if (forme === 'chrono') {
    const m = rng.int(1, 9); const sec = rng.int(1, 59);
    const quoi = rng.pick(['le temps que met un glaçon pour fondre', 'le temps que met un morceau de sucre pour se dissoudre', 'le temps pendant lequel une bougie reste allumée', 'le temps que met l\'eau pour bouillir']);
    return { type: 'numerique', reponse: m * 60 + sec, unite: 's', figure: figChrono(m, sec),
      enonce: `${p} a mesuré ${quoi}. Voici ce qu'affiche son chronomètre. Combien de secondes cela fait-il en tout ?`,
      explication: `Le chronomètre affiche ${m} min ${sec} s. 1 minute = 60 secondes : ${m} × 60 + ${sec} = ${m * 60} + ${sec} = ${m * 60 + sec} secondes.`,
      _signature: `chr|${m}|${sec}|${quoi}`, cleContenu: `chr|${m}|${sec}` };
  }
  const [objet, lib] = rng.pick([['de la farine', 'Farine'], ['des pommes de terre', 'Pommes de terre'], ['du sable', 'Sable'], ['du sucre', 'Sucre'], ['des cerises', 'Cerises'], ['du terreau', 'Terreau'], ['des noix', 'Noix']]);
  const enG = rng.next() < 0.5;
  const grammes = enG ? rng.int(21, 380) * 5 : rng.int(4, 79) * 25;
  if (enG && grammes < 1000) return null;
  const kg = grammes / 1000;
  return { type: 'numerique', reponse: enG ? kg : grammes, unite: enG ? 'kg' : 'g', figure: figBalance(enG ? `${fmt(grammes)} g` : `${fmt(kg)} kg`, lib),
    enonce: `${p} pèse ${objet} sur une balance. Quelle est la masse ${enG ? 'en kilogrammes (kg)' : 'en grammes (g)'} ?`,
    explication: `1 kg = 1 000 g. ${enG ? `${fmt(grammes)} g = ${fmt(grammes)} : 1 000 = ${fmt(kg)} kg.` : `${fmt(kg)} kg = ${fmt(kg)} × 1 000 = ${fmt(grammes)} g.`}`,
    _signature: `bal|${lib}|${grammes}|${enG}`, cleContenu: `bal|${grammes}|${enG}` };
}

// ================================================================ 12. LA NOTION D'ESPÈCE (races, hybrides stériles, compter les espèces)
const ESP = {
  chien: { gn: 'un chien', races: ['caniche', 'berger allemand', 'labrador', 'teckel', 'dalmatien', 'bouvier des Flandres', 'beagle', 'border collie', 'berger malinois', 'golden retriever'], f: 'une chienne', m: 'un chien', petits: 'chiots', nomEsp: 'les chiens', proche: ['renard'] },
  chat: { gn: 'un chat', races: ['siamois', 'persan', 'chartreux', 'maine coon', 'sacré de Birmanie', 'bengal'], f: 'une chatte', m: 'un chat', petits: 'chatons', nomEsp: 'les chats', proche: [] },
  cheval: { gn: 'un cheval', races: ['frison', 'pur-sang', 'haflinger', 'trait belge', 'appaloosa', 'lipizzan'], f: 'une jument', m: 'un étalon', petits: 'poulains', nomEsp: 'les chevaux', proche: ['ane', 'zebre'] },
  vache: { gn: 'une vache', races: ['blanc-bleu belge', 'holstein', 'limousine', 'charolaise', 'highland', 'jersiaise'], f: 'une vache', m: 'un taureau', petits: 'veaux', nomEsp: 'les bovins', proche: [] },
  lapin: { gn: 'un lapin', races: ['géant des Flandres', 'bélier', 'rex', 'tête de lion', 'angora'], f: 'une lapine', m: 'un lapin', petits: 'lapereaux', nomEsp: 'les lapins', proche: ['lievre'] },
  poule: { gn: 'une poule', races: ['coucou de Malines', 'brahma', 'sussex', 'leghorn', 'soie'], f: 'une poule', m: 'un coq', petits: 'poussins', nomEsp: 'les poules', proche: [] },
  mouton: { gn: 'un mouton', races: ['texel', 'suffolk', 'mérinos', 'ouessant'], f: 'une brebis', m: 'un bélier', petits: 'agneaux', nomEsp: 'les moutons', proche: ['chevre'] },
  chevre: { gn: 'une chèvre', races: ['alpine', 'saanen', 'poitevine'], f: 'une chèvre', m: 'un bouc', petits: 'chevreaux', nomEsp: 'les chèvres', proche: ['mouton'] },
};
const SEULS = { ane: { gn: 'un âne', nomEsp: 'les ânes' }, zebre: { gn: 'un zèbre', nomEsp: 'les zèbres' }, lievre: { gn: 'un lièvre', nomEsp: 'les lièvres' }, renard: { gn: 'un renard', nomEsp: 'les renards' } };
const nomAnimal = (e, race) => (race ? `${ESP[e].gn} de race ${race}` : (ESP[e]?.gn ?? SEULS[e].gn));
const nomEspece = (e) => (ESP[e] ?? SEULS[e]).nomEsp;
const HYBRIDES = [
  { txt: (r) => `Une jument de race ${r} et un âne ont un petit : un mulet. Devenu adulte, le mulet ne peut pas avoir de petits (il est stérile).`, a: 'la jument', b: 'l\'âne', race: 'cheval' },
  { txt: (r) => `Un étalon de race ${r} et une ânesse ont un petit : un bardot. Le bardot est stérile : il ne peut pas avoir de petits.`, a: 'le cheval', b: 'l\'ânesse', race: 'cheval' },
  { txt: (r) => `Une jument de race ${r} et un zèbre ont eu un petit, un zébrule. Le zébrule est stérile : il ne peut pas avoir de petits.`, a: 'la jument', b: 'le zèbre', race: 'cheval' },
  { txt: () => 'Une cane de Pékin et un canard de Barbarie ont des canetons, les canards mulards. Les canards mulards sont stériles : ils ne peuvent pas avoir de petits.', a: 'la cane de Pékin', b: 'le canard de Barbarie' },
];
const RESSEMBLE = [['lapin', 'lievre'], ['chien', 'renard'], ['cheval', 'ane'], ['mouton', 'chevre'], ['cheval', 'zebre']];
const DIFFERENTS = [['chien', ['caniche', 'labrador']], ['chien', ['dalmatien', 'teckel']], ['chien', ['bouvier des Flandres', 'teckel']], ['chat', ['persan', 'siamois']],
  ['chat', ['sacré de Birmanie', 'chartreux']], ['cheval', ['frison', 'haflinger']], ['poule', ['soie', 'Leghorn']], ['vache', ['Highland', 'Holstein']], ['lapin', ['angora', 'rex']]];
const DEF_ESPECE = 'Une espèce : des vivants qui peuvent se reproduire entre eux et avoir des petits féconds (capables, à leur tour, d\'avoir des petits).';
const animalAleatoire = (rng, e) => (ESP[e] ? nomAnimal(e, rng.pick(ESP[e].races)) : nomAnimal(e));

export function genererEspece(modele, rng) {
  const forme = rng.pick(['compte', 'compte', 'compte', 'meme', 'meme', 'scenario', 'scenario', 'verifier', 'ressemble', 'vf', 'vf', 'grille']);
  const p = rng.pick(ENFANTS);
  const CL = Object.keys(ESP);
  if (forme === 'compte') {
    const ne = rng.int(2, 4);
    let esps = rng.shuffle(CL).slice(0, ne);
    if (rng.next() < 0.65) { // piège : un animal qui ressemble à une espèce de la liste
      const avecProche = esps.filter((e) => ESP[e].proche.length);
      if (avecProche.length) { const pr0 = rng.pick(ESP[rng.pick(avecProche)].proche); if (!esps.includes(pr0)) esps = [...esps.slice(0, ne - 1), pr0]; }
    }
    if (new Set(esps).size !== esps.length || esps.length < 2) return null;
    const total = rng.int(Math.max(ne + 1, 5), 6);
    const items = esps.map((e) => [e, ESP[e] ? rng.pick(ESP[e].races) : null]);
    let essais = 0;
    while (items.length < total && essais++ < 50) {
      const e = rng.pick(esps.filter((x) => ESP[x]));
      if (!e) break;
      const r = rng.pick(ESP[e].races);
      if (!items.some(([a, b]) => a === e && b === r)) items.push([e, r]);
    }
    if (items.length < total) return null;
    const liste = rng.shuffle(items);
    const nb = new Set(liste.map(([e]) => e)).size;
    const eDouble = [...new Set(liste.map(([e]) => e))].find((e) => liste.filter(([x]) => x === e).length > 1);
    const racesEx = liste.filter(([x]) => x === eDouble).map(([, r]) => r).slice(0, 2);
    const groupes = [...new Set(liste.map(([e]) => e))].map((e) => `${nomEspece(e)} (${liste.filter(([x]) => x === e).length})`);
    return { type: 'numerique', reponse: nb, unite: 'espèces',
      enonce: `${p} a fait la liste des animaux qu'${pr(p)} a vus dans un parc animalier : ${listeEt(liste.map(([e, r]) => nomAnimal(e, r)))}. Combien d'espèces différentes y a-t-il dans cette liste ?`,
      explication: `Il y a ${nb} espèces : ${listeEt(groupes)}. Des races différentes (comme ${listeEt(racesEx)}) appartiennent à la même espèce : elles peuvent avoir ensemble des petits féconds.${liste.some(([e]) => SEULS[e] || ['mouton', 'chevre'].every((x) => liste.some(([y]) => y === x))) ? ' Attention aux animaux qui se ressemblent : le lapin et le lièvre, le cheval, l\'âne et le zèbre, le chien et le renard, le mouton et la chèvre sont des espèces différentes.' : ''}`,
      _signature: `cpt|${liste.map(([e, r]) => `${e}:${r}`).join(',')}`, cleContenu: `cpt|${triee(liste.map(([e, r]) => `${e}:${r}`))}` };
  }
  if (forme === 'meme') {
    // Seulement les espèces qui ont un animal qui leur ressemble (sinon un seul choix contient le nom de l'espèce).
    const e = rng.pick(CL.filter((x) => ESP[x].proche.length)); const [r1, r2] = rng.shuffle(ESP[e].races).slice(0, 2);
    const proches = ESP[e].proche.map((x) => animalAleatoire(rng, x));
    const autres = rng.shuffle(CL.filter((x) => x !== e && !ESP[e].proche.includes(x))).slice(0, 3).map((x) => animalAleatoire(rng, x));
    const faux = [...proches, ...autres].slice(0, 3);
    const r = qcm(rng, maj(nomAnimal(e, r2)), faux.map(maj));
    const pl = proches.length > 1;
    return { ...r, enonce: `Lequel de ces animaux est de la même espèce qu'${nomAnimal(e, r1)} ?`,
      explication: `${maj(nomAnimal(e, r1))} et ${nomAnimal(e, r2)} sont deux races de la même espèce : ${ESP[e].gn.startsWith('une') ? 'elles' : 'ils'} peuvent avoir ensemble des petits, eux-mêmes féconds.${proches.length ? ` ${maj(listeEt(proches.map((x) => x.replace(/ de race .*/, ''))))} : ${pl ? 'ils ressemblent' : 'il ressemble'} peut-être à ${ESP[e].gn}, mais ${pl ? 'ce sont d\'autres espèces' : 'c\'est une autre espèce'}.` : ''}`,
      _signature: `meme|${e}|${r1}|${r2}|${triee(faux)}`, cleContenu: `meme|${e}|${r1}|${r2}|${triee(faux)}` };
  }
  const CHOIX3 = ['Ils sont de la même espèce.', 'Ils sont de deux espèces différentes.', 'On ne peut pas encore conclure.'];
  if (forme === 'scenario') {
    const hyb = rng.next() < 0.45;
    if (hyb) {
      const H = rng.pick(HYBRIDES); const r = H.race ? rng.pick(ESP.cheval.races) : '';
      return { type: 'qcm', choix: CHOIX3, reponse: 1, fiche: 'sc-espece',
        enonce: `${H.txt(r)} Que peut-on conclure sur ${H.a} et ${H.b} ?`,
        explication: `Ils peuvent avoir un petit, mais ce petit est stérile : ils ne peuvent pas avoir de descendants féconds. Ce sont donc deux espèces différentes. ${DEF_ESPECE}`,
        _signature: `hyb|${HYBRIDES.indexOf(H)}|${r}`, cleContenu: `hyb|${HYBRIDES.indexOf(H)}|${r}` };
    }
    const e = rng.pick(CL); const [r1, r2] = rng.shuffle(ESP[e].races).slice(0, 2); const E = ESP[e];
    return { type: 'qcm', choix: CHOIX3, reponse: 0, fiche: 'sc-espece',
      enonce: `${maj(E.f)} de race ${r1} et ${E.m} de race ${r2} ont des ${E.petits}. Devenus adultes, ces ${E.petits} ont eux-mêmes des petits. Que peut-on conclure sur les deux parents ?`,
      explication: `Ils ont des petits, et ces petits sont féconds : les deux parents sont de la même espèce, même s'ils sont de races différentes. ${DEF_ESPECE}`,
      _signature: `cro|${e}|${r1}|${r2}`, cleContenu: `cro|${e}|${r1}|${r2}` };
  }
  if (forme === 'verifier') {
    const e = rng.pick(CL); const [r1, r2] = rng.shuffle(ESP[e].races).slice(0, 2); const E = ESP[e];
    const b = `Que les ${E.petits}, devenus adultes, peuvent eux aussi avoir des petits.`;
    const r = qcm(rng, b, rng.shuffle([`Que les ${E.petits} ressemblent à leurs parents.`, `Que les ${E.petits} sont nés en bonne santé.`, 'Que les deux parents ont la même couleur.', 'Que les deux parents mangent la même nourriture.']).slice(0, 3));
    return { ...r, fiche: 'sc-espece', enonce: `${maj(E.f)} de race ${r1} et ${E.m} de race ${r2} ont eu des ${E.petits}. Pour montrer qu'ils sont de la même espèce, que faut-il encore vérifier ?`,
      explication: `${b} Avoir des petits ne suffit pas : il faut que ces petits soient féconds (le mulet, petit d'un âne et d'une jument, est stérile). ${DEF_ESPECE}`,
      _signature: `ver|${e}|${r1}|${r2}|${triee(r.choix)}`, cleContenu: `ver|${e}|${r1}|${r2}` };
  }
  if (forme === 'ressemble') {
    const sem = rng.next() < 0.5;
    if (sem) {
      const [a, b] = rng.pick(RESSEMBLE);
      const na = animalAleatoire(rng, a).replace(/ de race .*/, ''); const nb = animalAleatoire(rng, b).replace(/ de race .*/, '');
      const bonne = 'Non : la ressemblance ne suffit pas. Il faudrait qu\'ils puissent avoir ensemble des petits féconds, et ce n\'est pas le cas.';
      const r = qcm(rng, bonne, ['Oui : ils se ressemblent, donc ils sont de la même espèce.', 'Oui : ils ont tous les deux quatre pattes et des poils.', 'Non : ils ne vivent pas au même endroit.']);
      return { ...r, enonce: `${maj(na)} et ${nb} se ressemblent beaucoup. ${p} en conclut qu'ils sont de la même espèce. A-t-${pr(p)} raison ?`,
        explication: `${bonne} ${maj(nomEspece(a))} et ${nomEspece(b)} sont deux espèces différentes. ${DEF_ESPECE}`,
        _signature: `res|${a}|${b}|${p}`, cleContenu: `res|${a}|${b}` };
    }
    const [e, [r1, r2]] = rng.pick(DIFFERENTS);
    const il2 = ESP[e].gn.startsWith('une') ? 'elles' : 'ils';
    const bonne = `Non : ${il2} peuvent avoir ensemble des ${ESP[e].petits} féconds, donc ${il2} sont de la même espèce.`;
    const r = qcm(rng, bonne, [`Oui : ${il2} sont très différent${il2 === 'elles' ? 'e' : ''}s, donc ce sont deux espèces.`, `Oui : ${il2} n'ont pas la même taille ni la même couleur.`, `Non : ${il2} vivent tous les deux avec l'être humain.`.replace('elles vivent tous', 'elles vivent toutes')]);
    return { ...r, enonce: `${maj(nomAnimal(e, r1))} et ${nomAnimal(e, r2)} ne se ressemblent pas du tout. ${p} en conclut qu'${il2} sont de deux espèces différentes. A-t-${pr(p)} raison ?`,
      explication: `${bonne} Ce sont deux races de la même espèce. ${DEF_ESPECE}`,
      _signature: `dif|${e}|${r1}|${r2}|${p}`, cleContenu: `dif|${e}|${r1}|${r2}` };
  }
  // Paires : même espèce ou espèces différentes ?
  const paire = () => {
    const k = rng.pick(['meme', 'meme', 'proche', 'autre']);
    if (k === 'meme') { const e = rng.pick(CL); const [a, b] = rng.shuffle(ESP[e].races).slice(0, 2); return { t: `${maj(nomAnimal(e, a))} et ${nomAnimal(e, b)}`, v: true, x: `deux races de la même espèce (${nomEspece(e)})` }; }
    if (k === 'proche') { const [a, b] = rng.pick(RESSEMBLE); return { t: `${maj(animalAleatoire(rng, a))} et ${animalAleatoire(rng, b)}`, v: false, x: `deux espèces différentes (${nomEspece(a)} et ${nomEspece(b)}), même s'ils se ressemblent` }; }
    const [a, b] = rng.shuffle(CL).slice(0, 2); return { t: `${maj(animalAleatoire(rng, a))} et ${animalAleatoire(rng, b)}`, v: false, x: `deux espèces différentes (${nomEspece(a)} et ${nomEspece(b)})` };
  };
  if (forme === 'vf') {
    const P = paire();
    return { type: 'vrai_faux', reponse: P.v, fiche: 'sc-espece', enonce: `Vrai ou faux ? ${P.t} sont de la même espèce.`,
      explication: `${P.v ? 'Vrai' : 'Faux'} : ${P.x}. ${DEF_ESPECE}`, _signature: `vf|${P.t}`, cleContenu: `vf|${P.t}` };
  }
  const ps = []; let essais = 0;
  while (ps.length < 4 && essais++ < 30) { const P = paire(); if (!ps.some((x) => x.t === P.t)) ps.push(P); }
  if (ps.length < 4 || ps.every((x) => x.v) || ps.every((x) => !x.v)) return null;
  return { type: 'grille', fiche: 'sc-espece', enonce: 'Ces deux animaux sont-ils de la même espèce ?', lignes: ps.map((x) => x.t), colonnes: ['Même espèce', 'Espèces différentes'],
    reponse: ps.map((x) => (x.v ? 0 : 1)), points: 4, explication: `${ps.map((x) => `${x.t} : ${x.x}`).join(' ; ')}. ${DEF_ESPECE}`,
    _signature: `grille|${triee(ps.map((x) => x.t))}`, cleContenu: `grille|${triee(ps.map((x) => x.t))}` };
}

// ---------------------------------------------------------------- enregistrement
const avecCle = (fn) => (modele, rng) => {
  const q = fn(modele, rng);
  if (!q || !q.type || (q.type === 'qcm' && !q.choix)) return null;
  for (const k of ['enonce', 'explication']) q[k] = elider(q[k]);
  if (Array.isArray(q.choix)) q.choix = q.choix.map(elider);
  if (!q.cleContenu) q.cleContenu = q._signature;
  if (q.fiche === undefined) delete q.fiche;
  return q;
};

export const GENERATEURS = {
  sc_releves: avecCle(genererReleves),
  sc_effort: avecCle(genererEffort),
  sc_emboites: avecCle(genererEmboites),
  sc_attributs: avecCle(genererAttributs),
  sc_systemes: avecCle(genererSystemes),
  sc_ventilation: avecCle(genererVentilation),
  sc_demarche: avecCle(genererDemarche),
  sc_transfert: avecCle(genererTransfert),
  sc_economie: avecCle(genererEconomie),
  sc_mesures: avecCle(genererMesures),
  sc_espece: avecCle(genererEspece),
};
