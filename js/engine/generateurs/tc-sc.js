// Générateurs des familles du tronc commun (référentiel P6), matière sc.
// Voir js/engine/generateurs/gen-*.js pour les conventions (formes, _signature, qcm…).
//
//   sc_releves     : lire des relevés d'expérience (tableau ou graphique SVG) : lire, comparer, écart, cause, conclure
//   sc_effort      : rythme cardiaque et ventilation au repos / après l'effort (chronomètre, moyenne de 3 mesures)
//   sc_emboites    : classification en ensembles emboîtés (figure de rectangles emboîtés, attributs partagés)
//   sc_attributs   : attributs des animaux (liste officielle P6) et notion d'espèce
//   sc_systemes    : liens entre systèmes respiratoire, circulatoire et digestif (trajets, diaphragme…)

import { formatNombre as fmt } from '../format.js';

// ---------------------------------------------------------------- outils
const FILLES = ['Léa', 'Inès', 'Emma', 'Louise', 'Yasmine', 'Olivia', 'Amira', 'Chloé', 'Zoé', 'Sofia', 'Maëlle', 'Alice', 'Nora', 'Lina'];
const GARCONS = ['Noah', 'Adam', 'Mohamed', 'Arthur', 'Lucas', 'Nathan', 'Louis', 'Ilyes', 'Victor', 'Jules', 'Rayan', 'Elias', 'Théo', 'Hugo'];
const PRENOMS = [...FILLES, ...GARCONS];
const VOY = /\bde (?=(Inès|Emma|Olivia|Amira|Alice|Adam|Arthur|Ilyes|Elias|Hugo)\b)/g;
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
        faux: ['Le matériau autour du pot.', 'Rien : on peut tout changer.', 'La température de l\'eau à la fin.'],
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
        faux: ['Le matériau autour du pot.', 'Rien : on peut tout changer.', 'La durée de fonte.'],
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
      faux: ['La bouteille noire contient plus d\'eau.', 'Le noir produit de la chaleur tout seul, même dans l\'obscurité.', 'La bouteille blanche fabrique du froid.'],
      pourquoi: 'La lumière absorbée par la bouteille est transformée en énergie thermique (chaleur). Une surface noire absorbe plus de lumière qu\'une surface blanche.',
    };
    demarche = { faux: ['La couleur des bouteilles.', 'Rien : on peut tout changer.', 'La température de l\'eau à la fin.'],
      teste: series.length === 3 ? 'la couleur (bouteilles noire et blanche au soleil) ou l\'endroit (deux bouteilles blanches, au soleil et à l\'ombre)' : 'la couleur de la bouteille' };
  } else {
    series = [{ nom: 'Au soleil', v: courbe(T0 + rng.int(20, 25), 0.02) }, { nom: 'À l\'ombre', v: courbe(T0 + rng.int(4, 6), 0.02) }];
    contexte = `${p} remplit deux bouteilles identiques avec la même quantité d'eau à ${T0} °C. ${maj(il(p))} pose une bouteille au soleil et l'autre à l'ombre. Toutes les 20 minutes, ${il(p)} mesure la température de l'eau.`;
    cause = {
      enonce: 'Pourquoi l\'eau de la bouteille au soleil devient-elle plus chaude ?',
      bonne: 'La lumière du Soleil est absorbée par la bouteille et l\'eau, et transformée en énergie thermique.',
      faux: ['L\'ombre fabrique du froid qui refroidit l\'autre bouteille.', 'La bouteille au soleil contient plus d\'eau.', 'Au soleil, l\'eau se transforme en dioxygène.'],
      pourquoi: 'L\'énergie lumineuse du Soleil se transforme en énergie thermique quand elle est absorbée : l\'eau se réchauffe. À l\'ombre, elle reçoit beaucoup moins de lumière.',
    };
    demarche = { faux: ['L\'endroit où on pose la bouteille.', 'Rien : on peut tout changer.', 'La température de l\'eau à la fin.'], teste: 'l\'endroit (soleil ou ombre)' };
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
        enonce: 'Pour que la comparaison soit juste, qu\'est-ce qui doit être pareil pour toutes les bouteilles ?',
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
        faux: ['Son cœur doit digérer plus vite le repas.', 'Son cœur fabrique du dioxygène pour les muscles.', 'Le sang devient plus lourd pendant la course.'],
        pourquoi: 'Pendant l\'effort, les muscles consomment plus de dioxygène et de nutriments et rejettent plus de dioxyde de carbone. Le cœur bat plus vite pour faire circuler le sang plus vite.',
      },
      conclusion: {
        enonce: 'Que montre la fin du graphique, après la course ?',
        bonne: 'Au repos, le rythme cardiaque redescend peu à peu jusqu\'à sa valeur de départ.',
        faux: ['Le cœur s\'arrête de battre pour se reposer.', 'Le rythme cardiaque reste élevé toute la journée.', 'Le rythme cardiaque continue à monter.'],
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
        faux: ['La température.', 'Rien : on peut tout changer.', 'Le nombre de graines germées.'],
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
        explication: `Moyenne sur 15 s : (${vals.join(' + ')}) ÷ 3 = ${somme} ÷ 3 = ${m}. Sur 1 minute (4 × 15 s) : ${m} × 4 = ${m * 4} battements par minute.`, _signature: `moyP|${vals.join(',')}` };
    }
    const unite = pouls ? 'battements par minute' : 'mouvements par minute';
    return { type: 'numerique', reponse: m, unite,
      enonce: `Pour avoir un résultat fiable, ${p} mesure 3 fois ${pouls ? 'son rythme cardiaque' : 'sa ventilation'} ${moment} : ${vals.join(', ')} ${unite}. Quelle est la moyenne de ces 3 mesures ?`,
      explication: `Moyenne = somme des mesures ÷ nombre de mesures = (${vals.join(' + ')}) ÷ 3 = ${somme} ÷ 3 = ${m} ${unite}.`, _signature: `moy|${pouls}|${apres}|${vals.join(',')}` };
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
    const expl = (o, nom) => `Moyenne ${nom} : (${o.v.join(' + ')}) ÷ 3 = ${o.v[0] + o.v[1] + o.v[2]} ÷ 3 = ${o.m} ${unite}.`;
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
        f: ['Son cœur a besoin de se reposer.', 'Son cœur doit digérer plus vite le repas.', 'Le sang devient plus lourd pendant l\'effort.', 'Son cœur fabrique du dioxygène.'],
        x: 'Pendant l\'effort, les muscles travaillent davantage. Le sang leur apporte dioxygène et nutriments et emporte le dioxyde de carbone : le cœur bat plus vite pour accélérer la circulation.' },
      { e: `${maj(sport)}, ${p} respire plus vite et plus fort. Pourquoi ?`, b: 'Pour faire entrer plus de dioxygène dans le sang et rejeter plus de dioxyde de carbone.',
        f: ['Pour refroidir ses poumons.', 'Pour faire entrer plus d\'air dans son estomac.', 'Pour rejeter plus de dioxygène.', 'Parce que ses poumons rapetissent pendant l\'effort.'],
        x: 'Les muscles en effort consomment plus de dioxygène et produisent plus de dioxyde de carbone. La ventilation augmente pour les échanges avec le sang dans les alvéoles des poumons.' },
      { e: `Pourquoi ${p} mesure-t-${e} son rythme cardiaque 3 fois avant de calculer la moyenne ?`, b: 'Pour obtenir un résultat plus fiable, car une seule mesure peut contenir une erreur.',
        f: ['Pour que son cœur batte plus vite.', 'Parce qu\'un chronomètre ne marche qu\'une fois sur trois.', 'Pour obtenir le plus grand nombre possible.'],
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
      { e: 'Où peut-on facilement sentir son pouls avec deux doigts ?', b: 'Au poignet ou sur le côté du cou', f: ['Au bout du nez', 'Sur le genou', 'Sur l\'ongle', 'Sur le coude'] },
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
      f: ['C\'est la même espèce, car ils se ressemblent.', 'Le lièvre est le mâle du lapin.', 'Le lapin est le petit du lièvre.'] },
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
  digestif: ['Bouche', 'Œsophage', 'Estomac', 'Intestin grêle', 'Côlon', 'Anus', 'Foie', 'Pancréas', 'Glandes salivaires'],
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
  { e: 'Quels organes débarrassent le sang de certains déchets, évacués dans l\'urine ?', b: 'Les reins', f: ['Les poumons', 'Le cœur', 'L\'estomac'], x: 'Les reins filtrent le sang.' },
  { e: 'Quels vaisseaux transportent le sang du cœur vers les muscles ?', b: 'Les artères', f: ['Les veines', 'Les bronches', 'L\'œsophage'], x: 'Artères : du cœur vers les organes.' },
  { e: 'Quels vaisseaux ramènent le sang des muscles vers le cœur ?', b: 'Les veines', f: ['Les artères', 'Les bronches', 'La trachée'], x: 'Veines : des organes vers le cœur.' },
  { e: 'Quel organe pompe le sang dans tout le corps ?', b: 'Le cœur', f: ['Les poumons', 'Le foie', 'L\'estomac'], x: 'Le cœur est un muscle qui se contracte sans arrêt.' },
  { e: 'Quel muscle en forme de dôme, situé sous les poumons, s\'abaisse à l\'inspiration ?', b: 'Le diaphragme', f: ['Le cœur', 'L\'œsophage', 'Le biceps'], x: 'En s\'abaissant, il agrandit la cage thoracique : l\'air entre.' },
  { e: 'Lequel de ces organes est une glande annexe du système digestif (les aliments n\'y passent pas) ?', b: 'Le pancréas', f: ['L\'estomac', 'L\'œsophage', 'L\'intestin grêle', 'Le côlon'], x: 'Glandes annexes : glandes salivaires, pancréas et foie.' },
  { e: 'Lequel de ces organes est une glande annexe du système digestif (les aliments n\'y passent pas) ?', b: 'Le foie', f: ['L\'estomac', 'L\'œsophage', 'L\'intestin grêle', 'Le côlon'], x: 'Glandes annexes : glandes salivaires, pancréas et foie.' },
  { e: 'Dans quelle partie du tube digestif de l\'eau est-elle absorbée, juste avant l\'anus ?', b: 'Dans le côlon', f: ['Dans l\'œsophage', 'Dans la bouche', 'Dans la trachée'], x: 'Le côlon (gros intestin) absorbe encore de l\'eau ; les restes sont évacués par l\'anus.' },
  { e: 'Quel conduit amène l\'air jusqu\'aux bronches ?', b: 'La trachée', f: ['L\'œsophage', 'L\'artère', 'L\'intestin grêle'], x: 'Nez ou bouche → trachée → bronches → alvéoles des poumons.' },
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
};
