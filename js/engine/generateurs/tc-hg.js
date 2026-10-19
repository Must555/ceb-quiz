// Générateurs des familles du tronc commun (référentiel FHGES, attendus de P6), matière hg.
// Voir js/engine/generateurs/gen-*.js pour les conventions (formes, _signature, qcm…).
//
//   hg_tc_moments      : les quatre moments clés de P6 ↔ périodes, dates, faits ; faits marquants ; ordre chronologique
//   hg_tc_galloromains : échanges Celtes ↔ Romains, premiers chrétiens, Francs, Clovis, Charlemagne, familles de langues
//   hg_tc_migrations   : migrations de travail vers la Belgique après 1945 (accords, Bois du Cazier, intégration, apports)
//   hg_tc_colonisations: explorations et colonisations (XVe-XVIIIe s.), produits des Amériques, impacts, commerce triangulaire
//   hg_tc_rechauffement: causes, conséquences et solutions du réchauffement climatique
//   hg_tc_climatogramme: lecture d'un climatogramme (figure SVG générée, 6 types de climat, deux hémisphères)
//   hg_tc_population   : population mondiale (ordres de grandeur, espaces peuplés / vides, densité ≠ population totale)
//
// Chaque générateur tire une « sorte » de question (pondérée), puis la construit. Les faits utilisés
// sont volontairement limités à ce qui est sûr et enseigné en 6e primaire.

import { formatNombre as n } from '../format.js';
import { romain } from './histoire.js';

const maj = (s) => String(s).replace(/^([«\s]*)(\p{L})/u, (_, a, b) => a + b.toUpperCase());
const cle = (arr) => arr.slice().sort().join(',');

// QCM : la bonne réponse + `nb` distracteurs tirés dans `faux` (doublons et bonne réponse écartés).
function qcm(rng, bonne, faux, nb = 3) {
  const f = rng.shuffle([...new Set(faux)].filter((x) => x.toLowerCase() !== bonne.toLowerCase())).slice(0, nb);
  const choix = rng.shuffle([bonne, ...f]);
  return { type: 'qcm', choix, reponse: choix.indexOf(bonne) };
}
// Choix dans un ordre fixe (ex. les 5 périodes conventionnelles).
function qcmFixe(choix, bonne) {
  return { type: 'qcm', choix: choix.slice(), reponse: choix.indexOf(bonne) };
}
// Ordre : `items` à ranger selon `val` croissante ; `label` donne le texte affiché.
function ordreQ(rng, items, val, label) {
  const elements = rng.shuffle(items);
  const reponse = elements.map((_, i) => i).sort((i, j) => val(elements[i]) - val(elements[j]));
  return { type: 'ordre', elements: elements.map(label), reponse };
}
// Grille : `items` = [{ t: texte de la ligne, c: index de colonne }].
function grilleQ(items, colonnes) {
  return { type: 'grille', lignes: items.map((x) => maj(x.t)), colonnes, reponse: items.map((x) => x.c), points: items.length };
}
// Tire `k` éléments de `liste`, dont au moins un de chaque groupe (fonction groupe → clé).
function tirerMixte(rng, liste, k, groupe) {
  for (let essai = 0; essai < 20; essai++) {
    const t = rng.shuffle(liste).slice(0, k);
    if (new Set(t.map(groupe)).size > 1) return t;
  }
  return null;
}
// Une banque de questions { q, ok: string | string[], ko: [...], expl } → QCM.
function depuisBanque(rng, banque, prefixe) {
  const i = rng.int(0, banque.length - 1);
  const it = banque[i];
  const bonne = Array.isArray(it.ok) ? rng.pick(it.ok) : it.ok;
  const q = qcm(rng, bonne, it.ko, it.nb ?? 3);
  return {
    ...q, enonce: it.q, explication: it.expl,
    _signature: `${prefixe}|${i}|${bonne}|${cle(q.choix)}`,
    cleContenu: `${prefixe}|${i}|${bonne}`,
    ...(it.difficulte ? { difficulte: it.difficulte } : {}),
  };
}
function depuisVF(rng, liste, prefixe) {
  const i = rng.int(0, liste.length - 1);
  const it = liste[i];
  return { type: 'vrai_faux', enonce: `Vrai ou faux ? ${it.t}`, reponse: it.v, explication: it.expl, _signature: `${prefixe}|${i}` };
}

// Tire une sorte pondérée : sortes = [[poids, fonction], ...].
function famille(nom, sortes) {
  const total = sortes.reduce((s, [p]) => s + p, 0);
  return (modele, rng) => {
    let r = rng.next() * total;
    let i = 0;
    while (i < sortes.length - 1 && r >= sortes[i][0]) { r -= sortes[i][0]; i++; }
    const q = sortes[i][1](rng, modele);
    if (!q) return null;
    q._signature = `${nom}${i}|${q._signature}`;
    if (q.explication) q.explication = q.explication.replace(/J\.-C\.\./g, 'J.-C.');
    if (q.cleContenu) q.cleContenu = `${nom}${i}|${q.cleContenu}`;
    return q;
  };
}

// =====================================================================================
// 1. Moments clés (P6) — référentiel FHGES, 6e primaire
// =====================================================================================
const PERIODES = ['Préhistoire', 'Antiquité', 'Moyen Âge', 'Temps modernes', 'Époque contemporaine'];
const REPERES_PERIODES = 'Repères : écriture vers 3500 av. J.-C. (fin de la Préhistoire), 476 (début du Moyen Âge), 1492 (début des Temps modernes), 1789 (début de l\'Époque contemporaine).';

const MOMENTS = [
  {
    id: 'rom', p6: true, court: 'La période gallo-romaine', rupture: 'la romanisation de nos régions',
    moment: 'la période gallo-romaine dans nos régions', dates: 'd\'environ 50 av. J.-C. au Ve siècle', a: -50, periode: 'Antiquité',
    pourquoi: 'De 50 av. J.-C. au Ve siècle, c\'est avant 476 : l\'Antiquité.',
    faits: [
      { t: 'Jules César conquiert nos régions', d: 'vers 50 av. J.-C.', a: -50 },
      { t: 'le latin se répand dans nos régions' },
      { t: 'les Romains construisent des chaussées, des villas et des thermes' },
      { t: 'Servais est évêque de Tongres, un des premiers évêques de nos régions', d: 'IVe siècle', a: 350 },
      { t: 'les premiers chrétiens apparaissent dans nos régions' },
    ],
  },
  {
    id: 'hma', p6: true, court: 'Le Haut Moyen Âge', rupture: 'les grandes migrations (les royaumes barbares)',
    moment: 'le Haut Moyen Âge dans nos régions', dates: 'du Ve au Xe siècle', a: 500, periode: 'Moyen Âge',
    pourquoi: 'La chute de l\'Empire romain d\'Occident (476) ouvre le Moyen Âge : le Haut Moyen Âge en est le début.',
    faits: [
      { t: 'Childéric, roi des Francs et père de Clovis, est enterré à Tournai', d: 'vers 481', a: 481 },
      { t: 'Clovis, roi des Francs, se fait baptiser', d: 'vers 496', a: 496 },
      { t: 'des monastères sont fondés à Nivelles et à Stavelot', d: 'VIIe siècle', a: 650 },
      { t: 'Charlemagne est couronné empereur à Rome', d: '800', a: 800 },
      { t: 'les Francs, un peuple germanique, s\'installent dans nos régions' },
    ],
  },
  {
    id: 'col', p6: true, court: 'Les explorations et premières colonisations', rupture: 'les explorations et les premières colonisations européennes',
    moment: 'les explorations et les premières colonisations européennes', dates: 'du XVe au XVIIIe siècle', a: 1492, periode: 'Temps modernes',
    pourquoi: 'L\'arrivée de Christophe Colomb aux Amériques (1492) marque le début des Temps modernes (1492-1789).',
    faits: [
      { t: 'Christophe Colomb arrive aux Amériques', d: '1492', a: 1492 },
      { t: 'Vasco de Gama atteint l\'Inde par la mer en contournant l\'Afrique', d: '1498', a: 1498 },
      { t: 'l\'expédition de Magellan fait le premier tour du monde', d: '1519-1522', a: 1519 },
      { t: 'des millions d\'Africains sont déportés comme esclaves vers les Amériques' },
      { t: 'les Européens rapportent en Europe le cacao, la tomate et la pomme de terre' },
    ],
  },
  {
    id: 'apg', p6: true, court: 'L\'après 1945', rupture: 'l\'Après-Guerre',
    moment: 'l\'après 1945', dates: 'de 1945 à nos jours', a: 1945, periode: 'Époque contemporaine',
    pourquoi: 'Après 1789, c\'est l\'Époque contemporaine.',
    faits: [
      { t: 'la Belgique signe un accord avec l\'Italie pour faire venir des mineurs', d: '1946', a: 1946 },
      { t: 'la catastrophe du Bois du Cazier fait 262 morts à Marcinelle', d: '1956', a: 1956 },
      { t: 'la Belgique signe des accords avec le Maroc et la Turquie pour faire venir des travailleurs', d: '1964', a: 1964 },
      { t: 'les familles des travailleurs immigrés les rejoignent et la Belgique devient plus multiculturelle' },
    ],
  },
];
const P6 = MOMENTS.filter((m) => m.p6);
// Faits marquants du référentiel (P6) : passage d'une période conventionnelle à une autre.
const FAITS_MARQUANTS = [
  { t: 'l\'invention de l\'écriture au Proche-Orient', d: 'vers 3500 av. J.-C.', passage: 'de la Préhistoire à l\'Antiquité' },
  { t: 'le début de l\'ère chrétienne', d: 'an 1', passage: null },
  { t: 'la chute de l\'Empire romain d\'Occident', d: '476', passage: 'de l\'Antiquité au Moyen Âge' },
  { t: 'l\'arrivée de Christophe Colomb aux Amériques', d: '1492', passage: 'du Moyen Âge aux Temps modernes' },
  { t: 'la Révolution française', d: '1789', passage: 'des Temps modernes à l\'Époque contemporaine' },
];
const TOUS_FAITS = MOMENTS.flatMap((m) => m.faits.map((f) => ({ ...f, m })));
const avecDate = (f) => (f.d ? `${f.t} (${f.d})` : f.t);

const moments = famille('mc', [
  // Moment clé → période conventionnelle
  [3, (rng) => {
    const m = rng.pick(MOMENTS);
    const parRupture = rng.next() < 0.5;
    const quoi = parRupture ? `La rupture « ${m.rupture} » (${m.dates})` : `Le moment clé « ${m.moment} » (${m.dates})`;
    return {
      ...qcmFixe(PERIODES, m.periode),
      enonce: `${quoi} : à quelle période conventionnelle l'associes-tu ?`,
      explication: `${m.pourquoi} ${REPERES_PERIODES}`,
      _signature: `per|${m.id}|${parRupture}`,
      difficulte: 1,
    };
  }],
  // Fait → moment clé
  [4, (rng) => {
    const f = rng.pick(TOUS_FAITS);
    const date = f.d && rng.next() < 0.5;
    const autres = (f.m.p6 ? P6 : MOMENTS).filter((x) => x !== f.m);
    const pris = rng.shuffle(autres).slice(0, 3);
    const choix = rng.shuffle([f.m, ...pris]);
    return {
      type: 'qcm', choix: choix.map((x) => maj(x.moment)), reponse: choix.indexOf(f.m),
      enonce: `À quel moment clé de l'histoire de nos régions associes-tu ce fait : « ${maj(date ? avecDate(f) : f.t)} » ?`,
      explication: `${maj(avecDate(f))} : cela appartient au moment clé « ${f.m.moment} » (${f.m.dates}).`,
      _signature: `fm|${f.t}|${date}|${cle(choix.map((x) => x.id))}`,
      cleContenu: `fm|${f.t}|${date}`,
      difficulte: date ? 1 : 2,
    };
  }],
  // Fait → période conventionnelle
  [3, (rng) => {
    const f = rng.pick(TOUS_FAITS);
    const date = f.d && rng.next() < 0.6;
    return {
      ...qcmFixe(PERIODES, f.m.periode),
      enonce: `Pendant quelle période conventionnelle situes-tu ce fait : « ${maj(date ? avecDate(f) : f.t)} » ?`,
      explication: `${maj(avecDate(f))} : moment clé « ${f.m.moment} » (${f.m.dates}). ${f.m.pourquoi}`,
      _signature: `fp|${f.t}|${date}`,
      difficulte: date ? 1 : 2,
    };
  }],
  // Moment clé → dates
  [2, (rng) => {
    const m = rng.pick(MOMENTS);
    const autres = rng.shuffle(MOMENTS.filter((x) => x !== m)).slice(0, 3);
    const choix = rng.shuffle([m, ...autres]);
    return {
      type: 'qcm', choix: choix.map((x) => maj(x.dates)), reponse: choix.indexOf(m),
      enonce: `Quand situes-tu le moment clé « ${m.moment} » ?`,
      explication: `${maj(m.moment)} : ${m.dates} (${m.periode}).`,
      _signature: `dt|${m.id}|${cle(choix.map((x) => x.id))}`,
      cleContenu: `dt|${m.id}`,
      difficulte: 2,
    };
  }],
  // Ordre chronologique des moments clés
  [3, (rng) => {
    const p6 = rng.next() < 0.35;
    const base = p6 ? P6 : MOMENTS;
    const tires = rng.shuffle(base).slice(0, 4);
    const dates = rng.next() < 0.4;
    const o = ordreQ(rng, tires, (m) => m.a, (m) => maj(dates ? `${m.moment} (${m.dates})` : m.moment));
    const tri = tires.slice().sort((a, b) => a.a - b.a);
    return {
      ...o,
      enonce: p6
        ? 'Range les quatre moments clés étudiés en 6e dans l\'ordre chronologique, du plus ancien au plus récent.'
        : `Range ces moments clés de l'histoire de nos régions dans l'ordre chronologique, du plus ancien au plus récent${dates ? '' : ' (sans les dates)'}.`,
      explication: `Ordre : ${tri.map((m) => `${m.moment} (${m.dates})`).join(' → ')}.`,
      _signature: `ord|${cle(tires.map((m) => m.id))}|${dates}`,
      cleContenu: `ord|${cle(tires.map((m) => m.id))}|${dates}`,
      difficulte: dates ? 1 : 2,
    };
  }],
  // Ordre chronologique de faits datés (un par moment clé)
  [3, (rng) => {
    const ms = rng.shuffle(MOMENTS).slice(0, 4);
    const faits = ms.map((m) => rng.pick(m.faits.filter((f) => f.d)));
    const dates = rng.next() < 0.4;
    const o = ordreQ(rng, faits, (f) => f.a, (f) => maj(dates ? avecDate(f) : f.t));
    const tri = faits.slice().sort((a, b) => a.a - b.a);
    return {
      ...o,
      enonce: `Range ces faits dans l'ordre chronologique, du plus ancien au plus récent${dates ? '' : ' (sans les dates)'}.`,
      explication: `Ordre : ${tri.map(avecDate).join(' → ')}.`,
      _signature: `ordf|${cle(faits.map((f) => f.t))}|${dates}`,
      cleContenu: `ordf|${cle(faits.map((f) => f.t))}|${dates}`,
      difficulte: dates ? 1 : 3,
    };
  }],
  // Vrai / faux : ce fait appartient-il à ce moment clé ?
  [2, (rng) => {
    const f = rng.pick(TOUS_FAITS.filter((x) => x.m.p6));
    const vrai = rng.next() < 0.5;
    const m = vrai ? f.m : rng.pick(P6.filter((x) => x !== f.m));
    return {
      type: 'vrai_faux',
      enonce: `Vrai ou faux ? « ${maj(f.t)} » appartient au moment clé « ${m.moment} ».`,
      reponse: vrai,
      explication: `${maj(avecDate(f))} : c'est le moment clé « ${f.m.moment} » (${f.m.dates}).`,
      _signature: `vf|${f.t}|${m.id}`,
      difficulte: 2,
    };
  }],
  // Grille : un fait de chacun des quatre moments clés de P6
  [3, (rng) => {
    const k = rng.int(3, 4);
    const ms = rng.shuffle(P6).slice(0, k);
    const faits = ms.map((m) => ({ ...rng.pick(m.faits), m }));
    const items = faits.map((f) => ({ t: f.t, c: P6.indexOf(f.m) }));
    return {
      ...grilleQ(items, P6.map((m) => m.court)),
      enonce: 'Associe chaque fait au moment clé qui lui correspond.',
      explication: maj(faits.map((f) => `${avecDate(f)} → ${f.m.court} (${f.m.dates})`).join(' ; ')) + '.',
      _signature: `gr|${cle(faits.map((f) => f.t))}`,
      cleContenu: `gr|${cle(faits.map((f) => f.t))}`,
      difficulte: 2,
    };
  }],
  // Fait marquant ↔ passage d'une période conventionnelle à une autre
  [2, (rng) => {
    const f = rng.pick(FAITS_MARQUANTS.filter((x) => x.passage));
    const date = rng.next() < 0.5;
    const lib = (x) => maj(date ? `${x.t} (${x.d})` : x.t);
    const q = qcm(rng, lib(f), FAITS_MARQUANTS.map(lib));
    return {
      ...q,
      enonce: `Quel fait marquant correspond au passage ${f.passage} ?`,
      explication: `${maj(f.t)} (${f.d}) marque le passage ${f.passage}. ${REPERES_PERIODES}`,
      _signature: `fmq|${f.d}|${date}|${cle(q.choix)}`,
      cleContenu: `fmq|${f.d}|${date}`,
      difficulte: date ? 1 : 2,
    };
  }],
  // Fait marquant → date
  [1, (rng) => {
    const f = rng.pick(FAITS_MARQUANTS);
    return {
      ...qcmFixe(FAITS_MARQUANTS.map((x) => maj(x.d)), maj(f.d)),
      enonce: `Quelle est la date de ce fait marquant : « ${f.t} » ?`,
      explication: `${maj(f.t)} : ${f.d}${f.d.endsWith('.') ? '' : '.'}${f.passage ? ` Ce fait marque le passage ${f.passage}.` : ' C\'est le point de départ de notre façon de compter les années.'}`,
      _signature: `fmd|${f.d}`,
      difficulte: 1,
    };
  }],
]);

// =====================================================================================
// 2. Gallo-Romains, premiers chrétiens, Francs
// =====================================================================================
const APPORTS_ROMAINS = [
  'la langue latine', 'l\'écriture avec l\'alphabet latin', 'les chaussées (routes pavées)', 'les villas (grands domaines agricoles)',
  'les thermes (bains publics)', 'les maisons en pierre avec un toit de tuiles', 'les mosaïques', 'les dieux romains comme Jupiter et Mercure',
];
const APPORTS_CELTES = [
  'le tonneau en bois', 'les braies (une sorte de pantalon)', 'la déesse Épona, protectrice des chevaux', 'la cotte de mailles',
];
const COL_ECHANGES = ['Apport des Romains aux Celtes', 'Apport des Celtes aux Romains'];

const FRANCS = [
  { q: 'Quel roi des Francs s\'est fait baptiser vers 496, ce qui a favorisé la christianisation de son royaume ?', ok: 'Clovis',
    ko: ['Charlemagne', 'Jules César', 'Ambiorix', 'Charles Quint', 'Godefroid de Bouillon'],
    expl: 'Clovis, roi des Francs (Mérovingiens), se fait baptiser à Reims vers 496. Beaucoup de Francs deviennent alors chrétiens.' },
  { q: 'Qui a été couronné empereur à Rome par le pape, le jour de Noël de l\'an 800 ?', ok: 'Charlemagne',
    ko: ['Clovis', 'Jules César', 'Charles Quint', 'Godefroid de Bouillon', 'Léopold Ier'],
    expl: 'Charlemagne, roi des Francs, est couronné empereur à Rome le 25 décembre 800.' },
  { q: 'En quelle année Charlemagne a-t-il été couronné empereur ?', ok: '800',
    ko: ['476', '496', '1066', '1492', '50 av. J.-C.'],
    expl: 'Charlemagne est couronné empereur en 800, pendant le Haut Moyen Âge.' },
  { q: 'Les Francs, qui s\'installent dans nos régions à la fin de l\'Empire romain, sont un peuple…', ok: 'germanique, venu de l\'autre côté du Rhin',
    ko: ['romain, venu d\'Italie', 'celte, comme les Éburons d\'Ambiorix', 'viking, venu de Scandinavie', 'grec, venu d\'Athènes'],
    expl: 'Les Francs sont un peuple germanique. Ils franchissent le Rhin et s\'installent dans nos régions aux IVe et Ve siècles.' },
  { q: 'Dans quelle ville de Belgique a-t-on retrouvé la tombe de Childéric, roi des Francs et père de Clovis ?', ok: 'Tournai',
    ko: ['Tongres', 'Arlon', 'Liège', 'Bruges', 'Namur'],
    expl: 'La tombe de Childéric (mort vers 481) a été découverte à Tournai, une des premières capitales des rois francs.' },
  { q: 'Dans quelle ville Charlemagne avait-il son palais préféré, où il est mort en 814 ?', ok: 'Aix-la-Chapelle',
    ko: ['Rome', 'Paris', 'Tournai', 'Bruxelles', 'Gand'],
    expl: 'Charlemagne vivait souvent dans son palais d\'Aix-la-Chapelle (aujourd\'hui en Allemagne, près de la frontière belge). Il y meurt en 814.' },
  { q: 'Pendant le Haut Moyen Âge, que fondent des moines et des moniales à Nivelles, à Stavelot ou à Lobbes ?', ok: 'des monastères (abbayes)',
    ko: ['des usines', 'des thermes', 'des universités', 'des beffrois'],
    expl: 'Au VIIe siècle, des monastères sont fondés dans nos régions (Nivelles, Stavelot, Lobbes…). Ils aident à répandre le christianisme.' },
  { q: 'Comment s\'appelle la famille de rois francs à laquelle appartient Clovis ?', ok: 'les Mérovingiens',
    ko: ['les Carolingiens', 'les Habsbourg', 'les ducs de Bourgogne', 'les Saxe-Cobourg'],
    expl: 'Clovis est un Mérovingien (du nom de son ancêtre Mérovée). Charlemagne, lui, est un Carolingien.' },
  { q: 'Charlemagne appartient à la famille des…', ok: 'Carolingiens',
    ko: ['Mérovingiens', 'Habsbourg', 'Saxe-Cobourg', 'ducs de Bourgogne'],
    expl: 'Charlemagne est un Carolingien (Carolus = Charles en latin). Les Mérovingiens, comme Clovis, régnaient avant eux.' },
  { q: 'En 313, que décide l\'empereur romain Constantin ?', ok: 'Il autorise les chrétiens à pratiquer librement leur religion.',
    ko: ['Il interdit le christianisme dans tout l\'Empire.', 'Il conquiert nos régions avec Jules César.', 'Il se fait baptiser par Clovis.', 'Il fonde l\'Empire de Charlemagne.'],
    expl: 'En 313, Constantin autorise le christianisme. La religion chrétienne se répand alors dans l\'Empire romain, jusque dans nos régions.' },
  { q: 'Quand les premiers chrétiens apparaissent-ils dans nos régions ?', ok: 'Pendant la période gallo-romaine (Antiquité)',
    ko: ['Pendant la Préhistoire', 'Seulement après Charlemagne', 'Au XVe siècle, avec les grandes explorations', 'Après 1945'],
    expl: 'Le christianisme arrive dans nos régions à l\'époque romaine (au IVe siècle, Servais est évêque de Tongres). Il se répand ensuite au Haut Moyen Âge.' },
  { q: 'Quelle langue parlaient les Francs ?', ok: 'le francique, une langue germanique',
    ko: ['le latin', 'le grec', 'le français d\'aujourd\'hui', 'l\'italien'],
    expl: 'Les Francs parlaient le francique, une langue germanique. Au sud, le latin populaire a continué d\'évoluer et a donné les langues romanes (le wallon, le français…).' },
  { q: 'Qui a baptisé Clovis à Reims ?', ok: 'l\'évêque Remi',
    ko: ['le pape Léon III', 'Charlemagne', 'Jules César', 'l\'évêque Servais'],
    expl: 'Clovis a été baptisé à Reims par l\'évêque Remi (saint Remi), vers 496.' },
  { q: 'Pourquoi parle-t-on surtout une langue germanique au nord de la Belgique et une langue romane au sud ?', ok: 'Les Francs se sont installés plus nombreux au nord ; au sud, le latin a continué d\'évoluer.',
    ko: ['Les Romains n\'ont jamais conquis le sud de la Belgique.', 'Charlemagne a interdit le latin au nord.', 'Les Vikings ont apporté le néerlandais au XXe siècle.', 'C\'est une décision prise en 1830.'],
    expl: 'Au Haut Moyen Âge, les Francs (germaniques) s\'installent surtout au nord : les langues germaniques s\'y imposent. Au sud, le latin parlé devient peu à peu le wallon et le français. Cette frontière entre les langues s\'est formée lentement, pendant plusieurs siècles.', difficulte: 3 },
];

const LANGUES = [
  ...['le français', 'le wallon', 'l\'italien', 'l\'espagnol', 'le portugais', 'le roumain', 'le catalan'].map((t) => ({ t, c: 0 })),
  ...['le néerlandais', 'l\'allemand', 'l\'anglais', 'le luxembourgeois', 'le danois', 'le suédois', 'le norvégien'].map((t) => ({ t, c: 1 })),
];
const COL_LANGUES = ['Langue romane', 'Langue germanique'];

const CHANGEMENTS_HMA = {
  ok: [
    'Des rois francs remplacent l\'empereur romain.',
    'Des langues germaniques s\'installent au nord de nos régions.',
    'De nombreux monastères et églises sont construits.',
    'Le christianisme devient la religion de la plupart des habitants.',
  ],
  ko: [
    'Les premiers agriculteurs s\'installent dans nos régions.',
    'On construit la première ligne de chemin de fer.',
    'Christophe Colomb arrive aux Amériques.',
    'Les Romains conquièrent nos régions.',
    'Les premières usines à vapeur apparaissent.',
  ],
};

const VF_GALLO = [
  { t: 'Les Romains ont apporté la langue latine dans nos régions.', v: true, expl: 'Le latin des Romains est à l\'origine du wallon et du français.' },
  { t: 'Les Romains ont appris des Gaulois à fabriquer des tonneaux en bois.', v: true, expl: 'Le tonneau est une invention gauloise que les Romains ont adoptée pour transporter le vin.' },
  { t: 'Clovis a été couronné empereur à Rome en 800.', v: false, expl: 'C\'est Charlemagne qui a été couronné empereur en 800. Clovis, lui, s\'est fait baptiser vers 496.' },
  { t: 'Charlemagne a été couronné empereur en 800.', v: true, expl: 'Charlemagne est couronné empereur à Rome le 25 décembre 800.' },
  { t: 'Le wallon et le français viennent du latin.', v: true, expl: 'Ce sont des langues romanes : elles viennent du latin parlé dans l\'Empire romain.' },
  { t: 'Le néerlandais est une langue romane.', v: false, expl: 'Le néerlandais est une langue germanique, comme l\'allemand et l\'anglais.' },
  { t: 'Les Francs étaient un peuple germanique.', v: true, expl: 'Les Francs venaient de l\'autre côté du Rhin ; ils parlaient le francique, une langue germanique.' },
  { t: 'Les premiers chrétiens sont apparus dans nos régions pendant la période gallo-romaine.', v: true, expl: 'Le christianisme arrive dans nos régions à l\'époque romaine (IVe siècle), puis se répand au Haut Moyen Âge.' },
  { t: 'Le baptême de Clovis (vers 496) a eu lieu pendant l\'Antiquité.', v: false, expl: 'Vers 496, c\'est après 476 : c\'est déjà le Moyen Âge (le Haut Moyen Âge).' },
  { t: 'Les villas romaines étaient de grands domaines agricoles.', v: true, expl: 'Une villa gallo-romaine est un grand domaine agricole avec la maison du maître et des bâtiments de ferme.' },
  { t: 'Les Romains ont construit des chaussées, comme celle qui reliait Bavay à Cologne en passant par Tongres.', v: true, expl: 'Les chaussées romaines reliaient les villes de l\'Empire ; certaines routes actuelles suivent encore leur tracé.' },
  { t: 'Les monastères de Nivelles et de Stavelot ont été fondés pendant le Haut Moyen Âge.', v: true, expl: 'Ils ont été fondés au VIIe siècle, pendant le Haut Moyen Âge (Ve-Xe siècle).' },
  { t: 'Les Gaulois n\'ont rien apporté aux Romains.', v: false, expl: 'Les échanges allaient dans les deux sens : les Romains ont adopté le tonneau, les braies, la cotte de mailles ou la déesse Épona.' },
  { t: 'L\'anglais et l\'allemand font partie de la même famille de langues que le néerlandais.', v: true, expl: 'Ce sont trois langues germaniques.' },
  { t: 'L\'italien et l\'espagnol sont des langues germaniques.', v: false, expl: 'L\'italien et l\'espagnol viennent du latin : ce sont des langues romanes.' },
];

const galloromains = famille('gr', [
  // Grille : qui a adopté quoi ?
  [3, (rng) => {
    const pool = [...APPORTS_ROMAINS.map((t) => ({ t, c: 0 })), ...APPORTS_CELTES.map((t) => ({ t, c: 1 }))];
    const items = tirerMixte(rng, pool, 4, (x) => x.c);
    if (!items) return null;
    return {
      ...grilleQ(items, COL_ECHANGES),
      enonce: 'Celtes (Gaulois) et Romains ont échangé des idées et des objets. Chaque élément est-il un apport des Romains aux Celtes ou un apport des Celtes aux Romains ?',
      explication: maj(items.map((x) => `${x.t} : ${x.c === 0 ? 'apport des Romains' : 'apport des Celtes'}`).join(' ; ')) + '.',
      _signature: `ech|${cle(items.map((x) => x.t))}`,
      cleContenu: `ech|${cle(items.map((x) => x.t))}`,
      difficulte: 2,
    };
  }],
  // QCM : un apport celte parmi des apports romains (ou l'inverse)
  [3, (rng) => {
    const celte = rng.next() < 0.5;
    const bonne = rng.pick(celte ? APPORTS_CELTES : APPORTS_ROMAINS);
    const q = qcm(rng, maj(bonne), (celte ? APPORTS_ROMAINS : APPORTS_CELTES).map(maj));
    return {
      ...q,
      enonce: celte
        ? 'Lequel de ces éléments les Romains ont-ils emprunté aux Celtes (Gaulois) ?'
        : 'Lequel de ces éléments les Celtes de nos régions ont-ils emprunté aux Romains ?',
      explication: celte
        ? `${maj(bonne)} : c'est un apport des Celtes aux Romains. Les autres propositions sont des apports des Romains.`
        : `${maj(bonne)} : c'est un apport des Romains aux Celtes. Les autres propositions viennent des Celtes et ont été adoptées par les Romains.`,
      _signature: `ech1|${celte}|${bonne}|${cle(q.choix)}`,
      cleContenu: `ech1|${celte}|${cle(q.choix)}`,
      difficulte: 2,
    };
  }],
  [5, (rng) => depuisBanque(rng, FRANCS, 'fr')],
  // Familles de langues : grille
  [2, (rng) => {
    const items = tirerMixte(rng, LANGUES, 4, (x) => x.c);
    if (!items) return null;
    return {
      ...grilleQ(items, COL_LANGUES),
      enonce: 'Ces langues sont-elles des langues romanes (issues du latin) ou des langues germaniques ?',
      explication: `Langues romanes (issues du latin) : ${LANGUES.filter((x) => x.c === 0).map((x) => x.t).join(', ')}. Langues germaniques : ${LANGUES.filter((x) => x.c === 1).map((x) => x.t).join(', ')}.`,
      _signature: `lg|${cle(items.map((x) => x.t))}`,
      cleContenu: `lg|${cle(items.map((x) => x.t))}`,
      difficulte: 2,
    };
  }],
  // Familles de langues : QCM
  [2, (rng) => {
    const fam = rng.int(0, 1);
    const bonne = rng.pick(LANGUES.filter((x) => x.c === fam)).t;
    const q = qcm(rng, maj(bonne), LANGUES.filter((x) => x.c !== fam).map((x) => maj(x.t)));
    return {
      ...q,
      enonce: fam === 0 ? 'Laquelle de ces langues est une langue romane (issue du latin) ?' : 'Laquelle de ces langues est une langue germanique ?',
      explication: `${maj(bonne)} est une langue ${fam === 0 ? 'romane : elle vient du latin' : `germanique, comme ${['le néerlandais', 'l\'allemand', 'l\'anglais'].filter((x) => x !== bonne).slice(0, 2).join(' ou ')}`}. Les autres sont des langues ${fam === 0 ? 'germaniques' : 'romanes (issues du latin)'}.`,
      _signature: `lq|${fam}|${bonne}|${cle(q.choix)}`,
      cleContenu: `lq|${fam}|${cle(q.choix)}`,
      difficulte: 1,
    };
  }],
  // Changement entre période gallo-romaine et Haut Moyen Âge
  [2, (rng) => {
    const bonne = rng.pick(CHANGEMENTS_HMA.ok);
    const q = qcm(rng, bonne, CHANGEMENTS_HMA.ko);
    return {
      ...q,
      enonce: 'Quel changement se produit dans nos régions entre la période gallo-romaine et le Haut Moyen Âge ?',
      explication: `${bonne} Les autres propositions appartiennent à d'autres moments de l'histoire.`,
      _signature: `chg|${bonne}|${cle(q.choix)}`,
      cleContenu: `chg|${bonne}`,
      difficulte: 2,
    };
  }],
  [3, (rng) => ({ ...depuisVF(rng, VF_GALLO, 'vf'), difficulte: 1 })],
]);

// =====================================================================================
// 3. Migrations vers la Belgique après 1945
// =====================================================================================
const POURQUOI_MIGR = [
  { q: 'Pourquoi la Belgique a-t-elle officiellement demandé des travailleurs à d\'autres pays après 1945 ?',
    ok: ['Il fallait reconstruire le pays et produire beaucoup de charbon, mais il manquait d\'ouvriers.', 'Les mines de charbon manquaient de mineurs : peu de Belges voulaient encore faire ce travail dur et dangereux.'],
    ko: ['Pour que les enfants belges apprennent d\'autres langues.', 'Parce que la Belgique voulait agrandir son territoire.', 'Parce que toutes les mines belges avaient fermé.', 'Pour remplacer les touristes partis à l\'étranger.'],
    expl: 'Après la Deuxième Guerre mondiale, il faut reconstruire le pays. Le charbon est l\'énergie principale, mais les mines manquent de mineurs : la Belgique fait appel à des travailleurs étrangers.' },
  { q: 'Dans quel secteur la Belgique avait-elle surtout besoin des travailleurs italiens en 1946 ?', ok: 'Les mines de charbon',
    ko: ['L\'agriculture', 'La pêche en mer du Nord', 'Le tourisme', 'L\'informatique'],
    expl: 'L\'accord belgo-italien de 1946 envoie des travailleurs italiens dans les charbonnages (mines de charbon) belges.' },
  { q: 'En 1946, la Belgique et l\'Italie signent un accord. Que reçoit l\'Italie en échange des travailleurs envoyés en Belgique ?', ok: 'Du charbon vendu à bas prix',
    ko: ['Du chocolat', 'Des terres en Belgique', 'Du pétrole', 'Des bateaux de pêche'],
    expl: 'C\'est l\'accord « des hommes contre du charbon » : l\'Italie envoie des mineurs, la Belgique lui vend du charbon à bas prix.' },
  { q: 'Quel pays a signé le premier accord avec la Belgique pour lui envoyer des travailleurs, en 1946 ?', ok: 'L\'Italie',
    ko: ['Le Maroc', 'La Turquie', 'L\'Espagne', 'La Grèce'],
    expl: 'Le premier accord est signé avec l\'Italie en 1946. Suivent l\'Espagne (1956), la Grèce (1957), puis le Maroc et la Turquie (1964).' },
  { q: 'Après la catastrophe du Bois du Cazier (1956), vers quels pays la Belgique se tourne-t-elle aussi pour trouver des travailleurs ?', ok: 'L\'Espagne et la Grèce, puis le Maroc et la Turquie',
    ko: ['Le Canada et les États-Unis', 'La Chine et le Japon', 'L\'Australie et la Nouvelle-Zélande', 'Le Brésil et l\'Argentine'],
    expl: 'L\'Italie se montre plus exigeante après la catastrophe : la Belgique signe des accords avec l\'Espagne (1956), la Grèce (1957), puis le Maroc et la Turquie (1964).', difficulte: 3 },
  { q: 'Pourquoi la Belgique arrête-t-elle officiellement de faire venir des travailleurs étrangers en 1974 ?', ok: 'Une crise économique (la crise du pétrole) fait augmenter le chômage.',
    ko: ['Toutes les maisons du pays sont reconstruites.', 'Les travailleurs étrangers sont tous rentrés chez eux.', 'Une loi interdit de parler une autre langue.', 'Les mines manquent encore de mineurs.'],
    expl: 'En 1974, après la crise du pétrole, le chômage augmente : la Belgique arrête officiellement l\'immigration de travail. Beaucoup de familles immigrées restent en Belgique.', difficulte: 3 },
  { q: 'Quelle était l\'énergie la plus importante pour faire tourner les usines et chauffer les maisons en Belgique après 1945 ?', ok: 'Le charbon',
    ko: ['L\'énergie solaire', 'Le vent', 'L\'énergie nucléaire'],
    expl: 'Après la guerre, le charbon est l\'énergie principale. C\'est pour en extraire davantage que la Belgique fait venir des mineurs étrangers.' },
];
const DATES_MIGR = [
  { t: 'la fin de la Deuxième Guerre mondiale', a: 1945 },
  { t: 'l\'accord avec l\'Italie (« des hommes contre du charbon »)', a: 1946 },
  { t: 'la catastrophe du Bois du Cazier à Marcinelle', a: 1956 },
  { t: 'l\'accord avec la Grèce', a: 1957, sansOrdre: true },
  { t: 'les accords avec le Maroc et la Turquie', a: 1964 },
  { t: 'l\'arrêt officiel de l\'immigration de travail', a: 1974 },
];
const CAZIER = [
  { q: 'Que s\'est-il passé le 8 août 1956 au charbonnage du Bois du Cazier, à Marcinelle ?', ok: 'Un incendie au fond de la mine a tué 262 mineurs.',
    ko: ['Une grève a fermé toutes les mines de Belgique.', 'La première mine de charbon de Belgique a ouvert.', 'Un accord a été signé avec l\'Italie.', 'Une inondation a détruit la ville de Charleroi.'],
    expl: 'Le 8 août 1956, un incendie éclate au fond de la mine du Bois du Cazier : 262 mineurs meurent, dont 136 Italiens.' },
  { q: 'Combien de mineurs sont morts dans la catastrophe du Bois du Cazier en 1956 ?', ok: '262',
    ko: ['26', '136', '1 262', '62'],
    expl: '262 mineurs sont morts, dont 136 Italiens : plus de la moitié des victimes étaient des immigrés italiens.' },
  { q: 'Parmi les 262 victimes de la catastrophe du Bois du Cazier, combien étaient italiennes ?', ok: '136, soit plus de la moitié',
    ko: ['Une dizaine', 'Aucune', 'Toutes'],
    expl: '136 des 262 victimes étaient italiennes : plus de la moitié. Cela montre combien de mineurs étaient des immigrés.' },
  { q: 'Près de quelle ville se trouve le site du Bois du Cazier ?', ok: 'Charleroi (à Marcinelle)',
    ko: ['Liège', 'Gand', 'Anvers', 'Arlon'],
    expl: 'Le Bois du Cazier se trouve à Marcinelle, une commune fusionnée avec Charleroi, dans le Hainaut.' },
  { q: 'Que nous apprend la catastrophe du Bois du Cazier sur le travail des immigrés dans les années 1950 ?', ok: 'Les mineurs immigrés faisaient un travail très dur et dangereux.',
    ko: ['Les immigrés travaillaient surtout dans les bureaux.', 'Les mines étaient très sûres à cette époque.', 'Les immigrés ne travaillaient pas dans les mines.'],
    expl: 'Au fond des mines, le travail était épuisant et dangereux (incendies, coups de grisou, maladies des poumons). Beaucoup de mineurs étaient des immigrés.' },
  { q: 'Qu\'est devenu aujourd\'hui le site du Bois du Cazier ?', ok: 'Un lieu de mémoire et un musée, inscrit au patrimoine mondial de l\'UNESCO',
    ko: ['Une mine de charbon encore en activité', 'Un aéroport', 'Une gare de chemin de fer'],
    expl: 'Le Bois du Cazier est aujourd\'hui un musée et un lieu de mémoire. Il fait partie des sites miniers de Wallonie inscrits au patrimoine mondial de l\'UNESCO (2012).' },
];
const PLATS = [
  { t: 'la pizza', p: 'Italie' }, { t: 'les lasagnes', p: 'Italie' }, { t: 'le tiramisu', p: 'Italie' },
  { t: 'le couscous', p: 'Maroc' }, { t: 'le tajine', p: 'Maroc' },
  { t: 'le döner kebab', p: 'Turquie' }, { t: 'le loukoum', p: 'Turquie' },
  { t: 'la paella', p: 'Espagne' }, { t: 'le gaspacho', p: 'Espagne' },
  { t: 'le tzatziki', p: 'Grèce' }, { t: 'le souvlaki', p: 'Grèce' },
];
const PAYS_MIGR = ['Italie', 'Maroc', 'Turquie', 'Espagne', 'Grèce'];
const APPORTS_MIGR = {
  ok: [
    'Des restaurants et des plats venus d\'Italie, du Maroc ou de Turquie',
    'Des mosquées et des églises orthodoxes',
    'Des chanteurs comme Salvatore Adamo, fils d\'un mineur sicilien',
    'Des associations et des fêtes culturelles',
    'De nouveaux mots et d\'autres langues entendues dans les rues',
  ],
  ko: ['Les chaussées romaines', 'Le beffroi de Bruges', 'Les monastères du Haut Moyen Âge', 'Les châteaux forts', 'Les villas gallo-romaines'],
};
const OBSTACLES = [
  'ne pas parler la langue du pays (français ou néerlandais)',
  'être logé dans de vieux baraquements, parfois d\'anciens camps de prisonniers',
  'vivre loin de sa famille restée au pays',
  'subir des préjugés ou du racisme',
  'faire un travail très dur et dangereux au fond de la mine',
  'découvrir un climat plus froid et plus pluvieux',
];
const FACILITES = [
  'être rejoint par sa famille (regroupement familial)',
  'être aidé par une association, comme l\'ACLI pour les Italiens',
  'avoir des enfants qui vont à l\'école et apprennent vite la langue',
  'être accueilli par des compatriotes déjà installés',
  'avoir un travail et un salaire dès son arrivée',
  'être défendu par un syndicat, comme les autres ouvriers',
];
const VF_MIGR = [
  { t: 'Après 1945, la Belgique a fait venir des travailleurs étrangers surtout pour les mines de charbon.', v: true, expl: 'Il fallait beaucoup de charbon pour reconstruire le pays, et les mines manquaient de mineurs.' },
  { t: 'L\'accord avec l\'Italie a été signé en 1964.', v: false, expl: 'L\'accord avec l\'Italie date de 1946. Ce sont les accords avec le Maroc et la Turquie qui datent de 1964.' },
  { t: 'Les accords avec le Maroc et la Turquie datent de 1964.', v: true, expl: 'En 1964, la Belgique signe des accords avec le Maroc et avec la Turquie.' },
  { t: 'La catastrophe du Bois du Cazier a eu lieu à Marcinelle, près de Charleroi, en 1956.', v: true, expl: 'Le 8 août 1956, un incendie dans la mine tue 262 mineurs.' },
  { t: 'Au Bois du Cazier, la plupart des victimes étaient belges.', v: false, expl: '136 des 262 victimes étaient italiennes : plus de la moitié.' },
  { t: 'En échange des travailleurs italiens, la Belgique vendait du charbon à bas prix à l\'Italie.', v: true, expl: 'C\'est l\'accord de 1946, souvent appelé « des hommes contre du charbon ».' },
  { t: 'Les familles des travailleurs immigrés n\'ont jamais pu les rejoindre en Belgique.', v: false, expl: 'Grâce au regroupement familial, beaucoup de familles ont rejoint les travailleurs et se sont installées en Belgique.' },
  { t: 'En 1974, la Belgique arrête officiellement de faire venir des travailleurs étrangers.', v: true, expl: 'Après la crise du pétrole, le chômage augmente : la Belgique arrête l\'immigration de travail en 1974.' },
  { t: 'Les premiers mineurs italiens étaient souvent logés dans des baraquements inconfortables.', v: true, expl: 'Beaucoup ont d\'abord vécu dans des baraquements, parfois d\'anciens camps de prisonniers de guerre : un obstacle à leur intégration.' },
  { t: 'L\'ACLI est une association qui aide les travailleurs italiens et leurs familles.', v: true, expl: 'L\'ACLI (associations chrétiennes des travailleurs italiens) aide les immigrés italiens : c\'est une facilité pour l\'intégration.' },
];

const migrations = famille('mi', [
  [3, (rng) => ({ ...depuisBanque(rng, POURQUOI_MIGR, 'pq'), difficulte: 2 })],
  // Dates
  [2, (rng) => {
    const e = rng.pick(DATES_MIGR);
    const annees = [...new Set(DATES_MIGR.map((x) => x.a))].map(String);
    const q = qcm(rng, String(e.a), [...annees, '1830', '1918', '1958', '1989']);
    return {
      ...q,
      enonce: `En quelle année situes-tu ${e.t} ?`,
      explication: `${maj(e.t)} : ${e.a}. Repères : 1946 (Italie), 1956 (Bois du Cazier), 1964 (Maroc et Turquie), 1974 (arrêt officiel).`,
      _signature: `an|${e.a}|${e.t}|${cle(q.choix)}`,
      cleContenu: `an|${e.t}`,
      difficulte: 2,
    };
  }],
  // Ordre chronologique
  [2, (rng) => {
    const dates = rng.next() < 0.4;
    const pool = dates ? DATES_MIGR : DATES_MIGR.filter((x) => !x.sansOrdre);
    const tires = rng.shuffle(pool).slice(0, 4);
    const o = ordreQ(rng, tires, (x) => x.a, (x) => maj(dates ? `${x.t} (${x.a})` : x.t));
    return {
      ...o,
      enonce: `Range ces faits dans l'ordre chronologique, du plus ancien au plus récent${dates ? '' : ' (sans les dates)'}.`,
      explication: `Ordre : ${tires.slice().sort((a, b) => a.a - b.a).map((x) => `${x.t} (${x.a})`).join(' → ')}.`,
      _signature: `ord|${cle(tires.map((x) => x.t))}|${dates}`,
      cleContenu: `ord|${cle(tires.map((x) => x.t))}|${dates}`,
      difficulte: dates ? 1 : 3,
    };
  }],
  [3, (rng) => ({ ...depuisBanque(rng, CAZIER, 'bc'), difficulte: 2 })],
  // Apports culturels : plats → pays
  [2, (rng) => {
    const k = rng.int(3, 4);
    const pays = rng.shuffle(PAYS_MIGR).slice(0, k);
    const plats = pays.map((p) => rng.pick(PLATS.filter((x) => x.p === p)));
    const items = rng.shuffle(plats).map((x) => ({ t: x.t, c: pays.indexOf(x.p) }));
    const colonnes = pays.map((p) => p);
    return {
      ...grilleQ(items, colonnes),
      enonce: 'Les migrations ont enrichi la cuisine en Belgique. De quel pays vient chaque plat ?',
      explication: maj(plats.map((x) => `${x.t} : ${x.p}`).join(' ; ')) + '. Ce sont des apports culturels des migrations depuis 1945.',
      _signature: `pl|${cle(plats.map((x) => x.t))}|${pays.join(',')}`,
      cleContenu: `pl|${cle(plats.map((x) => x.t))}`,
      difficulte: 1,
    };
  }],
  // Apports culturels : QCM
  [2, (rng) => {
    const bonne = rng.pick(APPORTS_MIGR.ok);
    const q = qcm(rng, bonne, APPORTS_MIGR.ko);
    return {
      ...q,
      enonce: 'Lequel de ces éléments est un apport culturel des migrations en Belgique depuis 1945 ?',
      explication: `${bonne} : c'est un apport des migrations après 1945. Les autres propositions datent d'époques bien plus anciennes.`,
      _signature: `ap|${bonne}|${cle(q.choix)}`,
      cleContenu: `ap|${bonne}`,
      difficulte: 1,
    };
  }],
  // Religions
  [1, (rng) => {
    const grecs = rng.next() < 0.35;
    const bonne = grecs ? 'le christianisme orthodoxe' : 'l\'islam';
    const q = qcm(rng, maj(bonne), ['le bouddhisme', 'l\'hindouisme', grecs ? 'l\'islam' : 'le christianisme orthodoxe', 'le judaïsme'].map(maj));
    return {
      ...q,
      enonce: grecs
        ? 'Quelle religion des travailleurs grecs et de leurs familles s\'est développée en Belgique après leur arrivée ?'
        : 'Quelle religion s\'est beaucoup développée en Belgique avec l\'arrivée des travailleurs marocains et turcs et de leurs familles ?',
      explication: grecs
        ? 'La plupart des Grecs sont chrétiens orthodoxes : des églises orthodoxes ont été ouvertes en Belgique.'
        : 'La plupart des Marocains et des Turcs sont musulmans : des mosquées ont été ouvertes en Belgique. C\'est un exemple de diversité religieuse.',
      _signature: `rel|${grecs}|${cle(q.choix)}`,
      cleContenu: `rel|${grecs}`,
      difficulte: 2,
    };
  }],
  // Intégration : grille facilité / obstacle
  [3, (rng) => {
    const pool = [...FACILITES.map((t) => ({ t, c: 0 })), ...OBSTACLES.map((t) => ({ t, c: 1 }))];
    const items = tirerMixte(rng, pool, 4, (x) => x.c);
    if (!items) return null;
    return {
      ...grilleQ(items, ['Facilité', 'Obstacle']),
      enonce: 'Pour un travailleur immigré arrivé en Belgique entre 1945 et 1970, chaque situation est-elle une facilité ou un obstacle à son intégration ?',
      explication: maj(items.map((x) => `${x.t} : ${x.c === 0 ? 'facilité' : 'obstacle'}`).join(' ; ')) + '.',
      _signature: `int|${cle(items.map((x) => x.t))}`,
      cleContenu: `int|${cle(items.map((x) => x.t))}`,
      difficulte: 2,
    };
  }],
  // Intégration : QCM
  [2, (rng) => {
    const fac = rng.next() < 0.5;
    const bonne = maj(rng.pick(fac ? FACILITES : OBSTACLES));
    const q = qcm(rng, bonne, (fac ? OBSTACLES : FACILITES).map(maj));
    return {
      ...q,
      enonce: `Pour un travailleur immigré arrivé en Belgique entre 1945 et 1970, laquelle de ces situations est ${fac ? 'une facilité' : 'un obstacle'} à son intégration ?`,
      explication: `${bonne} : c'est ${fac ? 'une aide pour s\'intégrer' : 'une difficulté pour s\'intégrer'}. Les autres propositions sont ${fac ? 'des obstacles' : 'des facilités'}.`,
      _signature: `intq|${fac}|${bonne}|${cle(q.choix)}`,
      cleContenu: `intq|${fac}|${bonne}`,
      difficulte: 2,
    };
  }],
  // ACLI
  [1, (rng) => {
    const q = qcm(rng, 'Une association qui aide les travailleurs italiens et leurs familles',
      ['Une mine de charbon près de Charleroi', 'Un accord signé avec le Maroc', 'Une équipe de football italienne', 'Un journal belge de 1830']);
    return {
      ...q,
      enonce: 'En Belgique, qu\'est-ce que l\'ACLI ?',
      explication: 'L\'ACLI (associations chrétiennes des travailleurs italiens) aide les immigrés italiens : conseils, cours, rencontres. Ces associations ont facilité leur intégration.',
      _signature: `acli|${cle(q.choix)}`,
      cleContenu: 'acli',
      difficulte: 2,
    };
  }],
  [3, (rng) => ({ ...depuisVF(rng, VF_MIGR, 'vf'), difficulte: 1 })],
]);

// =====================================================================================
// 4. Explorations et colonisations européennes (XVe-XVIIIe siècle)
// =====================================================================================
const PRODUITS_AMERIQUES = ['la pomme de terre', 'le maïs', 'la tomate', 'le cacao', 'le tabac', 'la dinde', 'le haricot', 'l\'ananas', 'la cacahuète', 'le piment', 'l\'avocat', 'la vanille', 'le tournesol'];
const PRODUITS_EUROPE = ['le blé', 'l\'orge', 'la pomme', 'la poire', 'le raisin', 'l\'olive', 'le chou', 'le navet', 'l\'oignon', 'l\'ail', 'la lentille', 'la fève', 'le petit pois', 'la cerise', 'le miel', 'le poulet'];
const COL_PRODUITS = ['Venu des Amériques', 'Déjà connu en Europe avant 1492'];

const EXPLORATEURS = [
  { qui: 'Christophe Colomb', quoi: 'arrive aux Amériques en traversant l\'océan Atlantique', a: 1492, d: '1492', pour: 'de l\'Espagne' },
  { qui: 'Vasco de Gama', quoi: 'atteint l\'Inde par la mer en contournant l\'Afrique', a: 1498, d: '1498', pour: 'du Portugal' },
  { qui: 'Bartolomeu Dias', quoi: 'est le premier Européen à contourner le sud de l\'Afrique par le cap de Bonne-Espérance', a: 1488, d: '1488', pour: 'du Portugal' },
  { qui: 'Fernand de Magellan', quoi: 'dirige l\'expédition qui fait le premier tour du monde', a: 1519, d: '1519-1522', pour: 'de l\'Espagne' },
  { qui: 'Pedro Álvares Cabral', quoi: 'arrive au Brésil', a: 1500, d: '1500', pour: 'du Portugal' },
  { qui: 'Hernán Cortés', quoi: 'conquiert l\'empire aztèque, au Mexique', a: 1521, d: '1519-1521', pour: 'de l\'Espagne' },
  { qui: 'Francisco Pizarro', quoi: 'conquiert l\'empire inca, au Pérou', a: 1532, d: '1532-1533', pour: 'de l\'Espagne' },
  { qui: 'Jacques Cartier', quoi: 'explore le golfe du Saint-Laurent, au Canada', a: 1534, d: '1534', pour: 'de la France' },
];
const IMPACTS = {
  ok: [
    'Des maladies apportées par les Européens (comme la variole) tuent un très grand nombre d\'Amérindiens.',
    'Les colonisateurs imposent leur langue (espagnol, portugais, anglais, français…).',
    'Les colonisateurs imposent la religion chrétienne.',
    'Les peuples colonisés sont obligés de travailler dans les mines et les plantations (travail forcé).',
    'Des millions d\'Africains sont réduits en esclavage et déportés vers les Amériques.',
    'Les empires aztèque et inca sont détruits.',
    'Les colonisateurs prennent les terres, l\'or et l\'argent des peuples colonisés.',
  ],
  ko: [
    'Les peuples colonisés deviennent plus riches que les Européens.',
    'Les Européens adoptent la langue des Aztèques.',
    'Les peuples colonisés gardent leurs terres et leurs lois.',
    'Les Amérindiens partent coloniser l\'Europe.',
    'Les Européens découvrent la pomme de terre et le cacao.',
  ],
};
const PAYS_LANGUE = [
  { ou: 'au Brésil', langue: 'le portugais', colon: 'Le Portugal' },
  { ou: 'au Mexique', langue: 'l\'espagnol', colon: 'L\'Espagne' },
  { ou: 'en Argentine', langue: 'l\'espagnol', colon: 'L\'Espagne' },
  { ou: 'au Pérou', langue: 'l\'espagnol', colon: 'L\'Espagne' },
  { ou: 'en Colombie', langue: 'l\'espagnol', colon: 'L\'Espagne' },
  { ou: 'au Chili', langue: 'l\'espagnol', colon: 'L\'Espagne' },
  { ou: 'à Cuba', langue: 'l\'espagnol', colon: 'L\'Espagne' },
  { ou: 'aux États-Unis', langue: 'l\'anglais', colon: 'L\'Angleterre' },
  { ou: 'en Jamaïque', langue: 'l\'anglais', colon: 'L\'Angleterre' },
  { ou: 'au Québec (Canada)', langue: 'le français', colon: 'La France' },
  { ou: 'en Haïti', langue: 'le français', colon: 'La France' },
  { ou: 'au Suriname', langue: 'le néerlandais', colon: 'Les Pays-Bas' },
];
const COLONS = ['Le Portugal', 'L\'Espagne', 'L\'Angleterre', 'La France', 'Les Pays-Bas'];
const TRIANGLE = [
  { de: 'De l\'Europe vers l\'Afrique', quoi: 'Des tissus, des armes, de l\'alcool et des objets fabriqués' },
  { de: 'De l\'Afrique vers les Amériques', quoi: 'Des esclaves africains' },
  { de: 'Des Amériques vers l\'Europe', quoi: 'Du sucre, du coton, du café et du tabac' },
];
const TRIANGLE_EXPL = 'Commerce triangulaire : les navires partent d\'Europe avec des tissus, des armes et de l\'alcool, échangés en Afrique contre des esclaves ; les esclaves sont vendus aux Amériques ; les navires rentrent en Europe chargés de sucre, de coton, de café et de tabac produits dans les plantations.';
const BANQUE_COLO = [
  { q: 'Pourquoi Christophe Colomb a-t-il appelé « Indiens » les habitants des Amériques ?', ok: 'Il croyait être arrivé aux Indes, en Asie.',
    ko: ['Parce qu\'ils venaient d\'Inde.', 'Parce que c\'était le nom de leur roi.', 'Parce qu\'ils parlaient indien.'],
    expl: 'Colomb voulait atteindre les Indes (l\'Asie) en naviguant vers l\'ouest. Il pensait y être arrivé : il a appelé les habitants « Indiens ». Aujourd\'hui, on dit plutôt « Amérindiens ».' },
  { q: 'Pourquoi les Européens cherchaient-ils, au XVe siècle, une nouvelle route maritime vers l\'Asie ?', ok: 'Pour acheter directement les épices et la soie, très recherchées.',
    ko: ['Pour fuir une épidémie de peste.', 'Pour trouver du charbon pour leurs usines.', 'Pour visiter les pyramides d\'Égypte.'],
    expl: 'Les épices (poivre, cannelle…) et la soie d\'Asie valaient très cher. Les Portugais et les Espagnols cherchent une route par la mer pour les acheter sans intermédiaires.' },
  { q: 'Pour quel pays Christophe Colomb a-t-il traversé l\'océan Atlantique en 1492 ?', ok: 'L\'Espagne',
    ko: ['Le Portugal', 'L\'Angleterre', 'La France', 'Les Pays-Bas'],
    expl: 'Christophe Colomb, né à Gênes en Italie, navigue pour les rois d\'Espagne.' },
  { q: 'Environ combien d\'Africains ont été déportés comme esclaves vers les Amériques, du XVIe au XIXe siècle ?', ok: 'Plus de 10 millions',
    ko: ['Environ 1 000', 'Environ 10 000', 'Environ 100 000'],
    expl: 'Plus de 10 millions d\'Africains ont été déportés à travers l\'Atlantique pour travailler comme esclaves dans les plantations et les mines des Amériques.', difficulte: 3 },
  { q: 'Que produisaient surtout les esclaves dans les plantations des Amériques ?', ok: 'Du sucre, du coton, du café et du tabac',
    ko: ['Des voitures et des machines', 'Du charbon et de l\'acier', 'Du blé pour l\'Afrique'],
    expl: 'Dans les plantations, les esclaves cultivaient la canne à sucre, le coton, le café ou le tabac, envoyés ensuite en Europe.' },
];

const colonisations = famille('co', [
  // Grille produits
  [3, (rng) => {
    const pool = [...PRODUITS_AMERIQUES.map((t) => ({ t, c: 0 })), ...PRODUITS_EUROPE.map((t) => ({ t, c: 1 }))];
    const items = tirerMixte(rng, pool, 4, (x) => x.c);
    if (!items) return null;
    return {
      ...grilleQ(items, COL_PRODUITS),
      enonce: 'Ces aliments étaient-ils déjà connus en Europe avant 1492, ou ont-ils été rapportés des Amériques par les Européens ?',
      explication: maj(items.map((x) => `${x.t} : ${x.c === 0 ? 'produit venu des Amériques' : 'produit déjà connu en Europe'}`).join(' ; ')) + '.',
      _signature: `pr|${cle(items.map((x) => x.t))}`,
      cleContenu: `pr|${cle(items.map((x) => x.t))}`,
      difficulte: 2,
    };
  }],
  // QCM produit
  [3, (rng) => {
    const am = rng.next() < 0.7;
    const bonne = maj(rng.pick(am ? PRODUITS_AMERIQUES : PRODUITS_EUROPE));
    const q = qcm(rng, bonne, (am ? PRODUITS_EUROPE : PRODUITS_AMERIQUES).map(maj));
    return {
      ...q,
      enonce: am
        ? 'Lequel de ces produits les Européens ont-ils découvert dans les Amériques et rapporté en Europe ?'
        : 'Lequel de ces produits était déjà connu en Europe avant l\'arrivée de Christophe Colomb aux Amériques ?',
      explication: am
        ? `${bonne} : produit venu des Amériques. Les autres propositions étaient déjà connues en Europe. Autres produits des Amériques : ${['pomme de terre', 'maïs', 'tomate', 'cacao', 'tabac', 'dinde', 'haricot', 'ananas'].filter((x) => !bonne.toLowerCase().endsWith(x)).join(', ')}.`
        : `${bonne} : produit déjà connu en Europe avant 1492. Les autres propositions viennent des Amériques.`,
      _signature: `prq|${am}|${bonne}|${cle(q.choix)}`,
      cleContenu: `prq|${am}|${cle(q.choix)}`,
      difficulte: am ? 1 : 2,
    };
  }],
  // Explorateurs : qui ?
  [3, (rng) => {
    const e = rng.pick(EXPLORATEURS);
    const q = qcm(rng, e.qui, EXPLORATEURS.map((x) => x.qui));
    return {
      ...q,
      enonce: `Quel navigateur ou conquérant ${e.quoi} (${e.d}) ?`,
      explication: `${e.d} : ${e.qui}, au service ${e.pour}, ${e.quoi}.`,
      _signature: `qui|${e.qui}|${cle(q.choix)}`,
      cleContenu: `qui|${e.qui}`,
      difficulte: 2,
    };
  }],
  // Explorateurs : ordre
  [2, (rng) => {
    const tires = [];
    for (const e of rng.shuffle(EXPLORATEURS)) {
      if (tires.every((x) => Math.abs(x.a - e.a) >= 3)) tires.push(e);
      if (tires.length === 4) break;
    }
    const o = ordreQ(rng, tires, (x) => x.a, (x) => `${x.qui} ${x.quoi} (${x.d})`);
    return {
      ...o,
      enonce: 'Range ces explorations et conquêtes dans l\'ordre chronologique, de la plus ancienne à la plus récente.',
      explication: `Ordre : ${tires.slice().sort((a, b) => a.a - b.a).map((x) => `${x.qui} (${x.d})`).join(' → ')}.`,
      _signature: `ord|${cle(tires.map((x) => x.qui))}`,
      cleContenu: `ord|${cle(tires.map((x) => x.qui))}`,
      difficulte: 1,
    };
  }],
  // Impacts
  [3, (rng) => {
    const bonne = rng.pick(IMPACTS.ok);
    const q = qcm(rng, bonne, IMPACTS.ko);
    return {
      ...q,
      enonce: 'Lequel de ces faits est un impact des colonisations européennes (XVe-XVIIIe siècle) sur les peuples colonisés ?',
      explication: `${bonne} Les colonisations ont eu de lourdes conséquences pour les peuples colonisés : maladies, travail forcé, esclavage, langue et religion imposées, richesses prises.`,
      _signature: `imp|${bonne}|${cle(q.choix)}`,
      cleContenu: `imp|${bonne}`,
      difficulte: 2,
    };
  }],
  // Langue imposée → pays colonisateur
  [2, (rng) => {
    const p = rng.pick(PAYS_LANGUE);
    const q = qcm(rng, p.colon, COLONS);
    return {
      ...q,
      enonce: `Aujourd'hui, on parle surtout ${p.langue} ${p.ou}. Quel pays européen y a imposé sa langue en colonisant cette région ?`,
      explication: `${p.colon} ${p.colon === 'Les Pays-Bas' ? 'ont' : 'a'} colonisé cette région et y ${p.colon === 'Les Pays-Bas' ? 'ont' : 'a'} imposé ${p.colon === 'Les Pays-Bas' ? 'leur' : 'sa'} langue : on y parle encore ${p.langue}. C'est un héritage de la colonisation.`,
      _signature: `lang|${p.ou}|${cle(q.choix)}`,
      cleContenu: `lang|${p.ou}`,
      difficulte: 2,
    };
  }],
  // Commerce triangulaire : grille
  [1, (rng) => {
    const lignes = rng.shuffle(TRIANGLE);
    const cols = rng.shuffle(TRIANGLE);
    const items = lignes.map((x) => ({ t: x.de, c: cols.indexOf(x) }));
    return {
      ...grilleQ(items, cols.map((x) => x.quoi)),
      enonce: 'Le commerce triangulaire : que transportaient les navires sur chaque trajet ?',
      explication: TRIANGLE_EXPL,
      _signature: `tri|${lignes.map((x) => x.de).join(',')}|${cols.map((x) => x.de).join(',')}`,
      cleContenu: 'tri|grille',
      difficulte: 3,
    };
  }],
  // Commerce triangulaire : QCM
  [1, (rng) => {
    const t = rng.pick(TRIANGLE);
    const q = qcm(rng, t.quoi, [...TRIANGLE.map((x) => x.quoi), 'Des épices et de la soie d\'Asie']);
    return {
      ...q,
      enonce: `Dans le commerce triangulaire, que transportaient les navires sur le trajet « ${t.de.charAt(0).toLowerCase()}${t.de.slice(1)} » ?`,
      explication: TRIANGLE_EXPL,
      _signature: `triq|${t.de}|${cle(q.choix)}`,
      cleContenu: `triq|${t.de}`,
      difficulte: 2,
    };
  }],
  [2, (rng) => ({ ...depuisBanque(rng, BANQUE_COLO, 'bq'), difficulte: 2 })],
]);

// =====================================================================================
// 5. Réchauffement climatique
// =====================================================================================
const ACT_GAZ = [
  ...['rouler en voiture à essence ou diesel', 'se chauffer au mazout ou au gaz', 'produire de l\'électricité dans une centrale au charbon', 'voyager en avion', 'brûler des forêts pour faire des champs', 'transporter des marchandises en camion'].map((t) => ({ t, c: 0 })),
  ...['élever des vaches (leur digestion)', 'cultiver le riz dans des rizières inondées', 'laisser pourrir des déchets dans une décharge'].map((t) => ({ t, c: 1 })),
];
const COL_GAZ = ['Dioxyde de carbone (CO₂)', 'Méthane (CH₄)'];
const CCS = {
  cause: ['brûler du pétrole, du charbon ou du gaz', 'couper et brûler les forêts', 'élever énormément de bétail', 'prendre souvent l\'avion', 'gaspiller l\'énergie (chauffage, éclairage)', 'faire de longs trajets en voiture tous les jours'],
  consequence: ['la fonte des glaciers de montagne', 'la montée du niveau des mers', 'des sécheresses plus fréquentes', 'des vagues de chaleur plus fortes', 'la disparition d\'une partie de la banquise', 'des animaux et des plantes qui migrent ou disparaissent', 'le réchauffement de l\'eau des océans'],
  solution: ['isoler les maisons', 'se déplacer à vélo, à pied ou en transports en commun', 'produire de l\'électricité avec le soleil et le vent', 'éviter de gaspiller la nourriture et l\'énergie', 'manger des fruits et des légumes locaux et de saison', 'protéger les forêts et planter des arbres', 'manger moins de viande'],
};
const COL_CCS = ['Cause', 'Conséquence', 'Solution'];
const NOMS_CCS = { cause: 'une cause', consequence: 'une conséquence', solution: 'une solution pour limiter' };
const ENERGIES = [
  ...['l\'énergie solaire', 'l\'énergie du vent (éolienne)', 'l\'énergie de l\'eau (hydraulique)', 'la chaleur de la Terre (géothermie)'].map((t) => ({ t, c: 0 })),
  ...['le charbon', 'le pétrole', 'le gaz naturel'].map((t) => ({ t, c: 1 })),
];
const COL_ENERGIES = ['Énergie renouvelable', 'Énergie fossile'];
const VF_RECH = [
  { t: 'L\'effet de serre est un phénomène naturel : sans lui, la Terre serait glaciale.', v: true, expl: 'Sans effet de serre, il ferait en moyenne environ −18 °C sur Terre. Le problème, c\'est que les activités humaines le renforcent.' },
  { t: 'Les activités humaines renforcent l\'effet de serre en rejetant des gaz comme le CO₂ et le méthane.', v: true, expl: 'Ces gaz retiennent davantage de chaleur autour de la Terre : la planète se réchauffe.' },
  { t: 'Le méthane est surtout produit par les panneaux solaires.', v: false, expl: 'Le méthane vient surtout de l\'élevage (digestion des vaches), des rizières et des décharges. Les panneaux solaires ne rejettent pas de gaz en fonctionnant.' },
  { t: 'Brûler du charbon, du pétrole ou du gaz rejette du dioxyde de carbone (CO₂).', v: true, expl: 'Les énergies fossiles rejettent du CO₂ quand on les brûle : c\'est la principale cause du réchauffement.' },
  { t: 'Les éoliennes rejettent beaucoup de CO₂ quand elles tournent.', v: false, expl: 'Une éolienne utilise la force du vent : elle ne brûle rien et ne rejette pas de CO₂ en fonctionnant.' },
  { t: 'Les arbres absorbent du CO₂ : protéger les forêts aide à lutter contre le réchauffement.', v: true, expl: 'Les plantes absorbent le CO₂ pour grandir. Couper et brûler les forêts, au contraire, en rejette.' },
  { t: 'La fonte des glaciers de montagne et des calottes de glace fait monter le niveau des mers.', v: true, expl: 'L\'eau de cette glace, posée sur la terre ferme, coule vers les océans. L\'eau qui se réchauffe prend aussi plus de place.' },
  { t: 'Le réchauffement climatique n\'a aucun effet sur les animaux et les plantes.', v: false, expl: 'Beaucoup d\'espèces doivent migrer vers des régions plus fraîches ; certaines risquent de disparaître.' },
  { t: 'Isoler le toit d\'une maison permet de consommer moins d\'énergie pour se chauffer.', v: true, expl: 'Moins de chaleur s\'échappe : on brûle moins de gaz ou de mazout, donc on rejette moins de CO₂.' },
  { t: 'Les vaches rejettent du méthane en digérant l\'herbe.', v: true, expl: 'La digestion des ruminants (vaches, moutons) produit du méthane, un gaz à effet de serre.' },
  { t: 'Avec le réchauffement climatique, les vagues de chaleur deviennent plus rares.', v: false, expl: 'C\'est le contraire : les vagues de chaleur deviennent plus fréquentes et plus fortes.' },
  { t: 'Le CO₂ des voitures disparaît dès qu\'il sort du pot d\'échappement.', v: false, expl: 'Le CO₂ reste longtemps dans l\'atmosphère et s\'accumule : il renforce l\'effet de serre.' },
];
const TRAJETS = ['aller à l\'école, à 2 km de chez toi', 'aller au club de sport, à 3 km', 'rendre visite à ta grand-mère, à 4 km', 'aller à la bibliothèque, à 1 km', 'aller au parc, à 2 km'];

const rechauffement = famille('re', [
  // Grille gaz
  [2, (rng) => {
    const items = tirerMixte(rng, ACT_GAZ, rng.int(3, 4), (x) => x.c);
    if (!items) return null;
    return {
      ...grilleQ(items, COL_GAZ),
      enonce: 'Quel gaz à effet de serre est surtout rejeté par chaque activité ?',
      explication: `${maj(items.map((x) => `${x.t} → ${x.c === 0 ? 'CO₂' : 'méthane'}`).join(' ; '))}. Brûler du charbon, du pétrole, du gaz ou du bois rejette du CO₂ ; l'élevage, les rizières et les décharges rejettent du méthane.`,
      _signature: `gaz|${cle(items.map((x) => x.t))}`,
      cleContenu: `gaz|${cle(items.map((x) => x.t))}`,
      difficulte: 2,
    };
  }],
  // Grille cause / conséquence / solution
  [3, (rng) => {
    const cats = ['cause', 'consequence', 'solution'];
    const pool = cats.flatMap((c, i) => CCS[c].map((t) => ({ t, c: i })));
    let items = null;
    for (let e = 0; e < 20 && !items; e++) {
      const t = rng.shuffle(pool).slice(0, 4);
      if (new Set(t.map((x) => x.c)).size === 3) items = t;
    }
    if (!items) return null;
    return {
      ...grilleQ(items, COL_CCS),
      enonce: 'Réchauffement climatique : chaque élément est-il une cause, une conséquence ou une solution ?',
      explication: maj(items.map((x) => `${x.t} : ${COL_CCS[x.c].toLowerCase()}`).join(' ; ')) + '.',
      _signature: `ccs|${cle(items.map((x) => x.t))}`,
      cleContenu: `ccs|${cle(items.map((x) => x.t))}`,
      difficulte: 2,
    };
  }],
  // QCM cause / conséquence / solution
  [4, (rng) => {
    const cat = rng.pick(['cause', 'consequence', 'solution']);
    const bonne = maj(rng.pick(CCS[cat]));
    const autres = Object.keys(CCS).filter((c) => c !== cat).flatMap((c) => CCS[c]).map(maj);
    const q = qcm(rng, bonne, autres);
    return {
      ...q,
      enonce: `Lequel de ces éléments est ${NOMS_CCS[cat]} le réchauffement climatique ?`.replace('une cause le', 'une cause du').replace('une conséquence le', 'une conséquence du'),
      explication: `${bonne} : c'est ${cat === 'cause' ? 'une cause (cela rejette des gaz à effet de serre)' : cat === 'consequence' ? 'une conséquence du réchauffement' : 'une solution (cela réduit les rejets de gaz à effet de serre)'}.`,
      _signature: `ccsq|${cat}|${bonne}|${cle(q.choix)}`,
      cleContenu: `ccsq|${cat}|${bonne}`,
      difficulte: 1,
    };
  }],
  // Énergies
  [2, (rng) => {
    const items = tirerMixte(rng, ENERGIES, 4, (x) => x.c);
    if (!items) return null;
    return {
      ...grilleQ(items, COL_ENERGIES),
      enonce: 'Ces sources d\'énergie sont-elles renouvelables ou fossiles ?',
      explication: 'Les énergies fossiles (charbon, pétrole, gaz naturel) s\'épuisent et rejettent du CO₂ quand on les brûle. Les énergies renouvelables (soleil, vent, eau, chaleur de la Terre) ne s\'épuisent pas et rejettent très peu de gaz à effet de serre.',
      _signature: `en|${cle(items.map((x) => x.t))}`,
      cleContenu: `en|${cle(items.map((x) => x.t))}`,
      difficulte: 1,
    };
  }],
  // Trajet le moins polluant
  [1, (rng) => {
    const tr = rng.pick(TRAJETS);
    const bonne = rng.pick(['À vélo', 'À pied']);
    const q = qcm(rng, bonne, ['En voiture à essence', 'En voiture diesel', 'En moto à essence', 'En scooter à essence']);
    return {
      ...q,
      enonce: `Pour ${tr}, quel moyen de déplacement ne rejette pas de gaz à effet de serre ?`,
      explication: `${bonne}, on ne brûle pas de carburant : aucun CO₂ n'est rejeté. Les véhicules à essence ou au diesel rejettent du CO₂.`,
      _signature: `trj|${tr}|${bonne}|${cle(q.choix)}`,
      cleContenu: `trj|${tr}`,
      difficulte: 1,
    };
  }],
  [3, (rng) => ({ ...depuisVF(rng, VF_RECH, 'vf'), difficulte: 2 })],
]);

// =====================================================================================
// 6. Climatogramme
// =====================================================================================
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const INIT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const CLIMATS = {
  oceanique: { nom: 'Tempéré océanique', sud: true, desc: 'hivers doux (au-dessus de 0 °C), étés frais (moins de 20 °C) et pluies régulières tous les mois' },
  mediterraneen: { nom: 'Méditerranéen', sud: true, desc: 'hivers doux et pluvieux, étés chauds et secs' },
  continental: { nom: 'Continental', sud: false, desc: 'hivers très froids (sous 0 °C), étés assez chauds et des pluies surtout en été' },
  tropical: { nom: 'Tropical humide', sud: true, desc: 'chaud toute l\'année, avec une saison des pluies très arrosée et une saison sèche' },
  aride: { nom: 'Aride (désertique)', sud: true, desc: 'presque pas de pluie de toute l\'année, étés très chauds' },
  polaire: { nom: 'Polaire', sud: false, desc: 'froid toute l\'année (même le mois le plus chaud reste sous 10 °C)' },
};
const p5 = (rng, a, b) => 5 * rng.int(Math.ceil(a / 5), Math.floor(b / 5));
const cosSaison = (tmin, tmax, m) => tmin + (tmax - tmin) * (1 - Math.cos((2 * Math.PI * m) / 12)) / 2;

// Données pour l'hémisphère Nord (mois le plus froid : janvier, le plus chaud : juillet).
function donneesClimat(type, rng) {
  let T; let P;
  const saison = (tmin, tmax) => Array.from({ length: 12 }, (_, m) => Math.round(cosSaison(tmin, tmax, m) + ([2, 3, 4, 8, 9, 10].includes(m) ? rng.int(-1, 1) * 0.6 : 0)));
  const plages = (pl) => pl.map(([a, b]) => p5(rng, a, b));
  switch (type) {
    case 'oceanique':
      T = saison(rng.int(2, 6), rng.int(16, 19));
      P = plages([[60, 90], [50, 75], [50, 75], [45, 65], [50, 70], [55, 75], [60, 85], [60, 85], [55, 75], [60, 85], [65, 90], [70, 95]]);
      break;
    case 'mediterraneen':
      T = saison(rng.int(8, 11), rng.int(24, 27));
      P = plages([[70, 110], [60, 90], [50, 75], [40, 60], [25, 45], [5, 20], [0, 10], [5, 20], [30, 50], [60, 95], [80, 120], [80, 120]]);
      break;
    case 'continental':
      T = saison(rng.int(-14, -7), rng.int(19, 23));
      P = plages([[30, 45], [25, 40], [30, 45], [35, 50], [50, 65], [70, 90], [75, 95], [65, 85], [50, 65], [45, 60], [40, 55], [35, 50]]);
      break;
    case 'tropical': {
      const o = rng.int(-1, 1);
      T = [24, 26, 28, 30, 29, 27, 26, 26, 27, 27, 26, 25].map((t) => t + o);
      P = plages([[0, 10], [0, 15], [5, 25], [20, 50], [70, 120], [140, 200], [200, 280], [220, 300], [150, 220], [60, 110], [5, 25], [0, 10]]);
      break;
    }
    case 'aride':
      T = saison(rng.int(12, 16), rng.int(32, 35));
      P = Array.from({ length: 12 }, () => 5 * rng.int(0, 2));
      break;
    case 'polaire':
      T = saison(rng.int(-30, -20), rng.int(2, 6));
      P = plages([[5, 15], [5, 15], [5, 15], [5, 15], [10, 20], [10, 25], [15, 30], [15, 30], [10, 25], [10, 20], [5, 15], [5, 15]]);
      break;
    default: return null;
  }
  // Mois le plus chaud et le plus froid uniques (écart ≥ 1 °C).
  const iMax = T.indexOf(Math.max(...T));
  const iMin = T.indexOf(Math.min(...T));
  const autresMax = Math.max(...T.filter((_, i) => i !== iMax));
  if (T[iMax] - autresMax < 1) T[iMax] = autresMax + 1;
  const autresMin = Math.min(...T.filter((_, i) => i !== iMin));
  if (autresMin - T[iMin] < 1) T[iMin] = autresMin - 1;
  // Mois le plus pluvieux unique (écart ≥ 10 mm), sauf climat aride.
  if (type !== 'aride') {
    const jMax = P.indexOf(Math.max(...P));
    const autresP = Math.max(...P.filter((_, i) => i !== jMax));
    if (P[jMax] - autresP < 10) P[jMax] = autresP + 10;
  }
  return { T, P };
}

function axes(T, P) {
  const tmin = Math.min(...T); const tmax = Math.max(...T);
  // L'axe des températures part au plus haut de 0 °C (sinon un climat chaud paraîtrait froid).
  const tS = tmax - Math.min(0, tmin) > 25 ? 10 : 5;
  const tLo = Math.min(0, Math.floor(tmin / tS) * tS);
  const nb = Math.max(4, Math.ceil((tmax - tLo) / tS));
  const pMax = Math.max(...P, 1);
  const pS = [10, 20, 25, 50, 100].find((s) => s * nb >= pMax + 5) ?? 100;
  return { tS, tLo, nb, pS };
}

function svgClimatogramme(T, P) {
  const { tS, tLo, nb, pS } = axes(T, P);
  const X0 = 56; const X1 = 344; const Y0 = 34; const Y1 = 226;
  const col = (X1 - X0) / 12;
  const yT = (t) => Y1 - ((t - tLo) / (nb * tS)) * (Y1 - Y0);
  const yP = (p) => Y1 - (p / (nb * pS)) * (Y1 - Y0);
  const r = (v) => Math.round(v * 10) / 10;
  const s = [];
  s.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" font-family="Arial, sans-serif">');
  s.push('<rect x="0" y="0" width="400" height="300" fill="#ffffff"/>');
  for (let k = 0; k <= nb; k++) {
    const y = r(Y1 - (k / nb) * (Y1 - Y0));
    const t = tLo + k * tS;
    s.push(`<line x1="${X0}" y1="${y}" x2="${X1}" y2="${y}" stroke="${t === 0 && tLo < 0 ? '#5b6475' : '#d9dde5'}" stroke-width="${t === 0 && tLo < 0 ? 1.2 : 1}"/>`);
    s.push(`<text x="${X0 - 6}" y="${r(y + 4)}" font-size="12" text-anchor="end" fill="#b3261e">${n(t)}</text>`);
    s.push(`<text x="${X1 + 6}" y="${r(y + 4)}" font-size="12" text-anchor="start" fill="#1f5fa8">${n(k * pS)}</text>`);
  }
  P.forEach((p, m) => {
    if (p <= 0) return;
    const x = r(X0 + m * col + 3); const y = r(yP(p));
    s.push(`<rect x="${x}" y="${y}" width="${r(col - 6)}" height="${r(Y1 - y)}" fill="#6aa6e8" stroke="#1f5fa8" stroke-width="1"/>`);
  });
  const pts = T.map((t, m) => `${r(X0 + (m + 0.5) * col)},${r(yT(t))}`).join(' ');
  s.push(`<polyline points="${pts}" fill="none" stroke="#d62828" stroke-width="2.5" stroke-linejoin="round"/>`);
  T.forEach((t, m) => s.push(`<circle cx="${r(X0 + (m + 0.5) * col)}" cy="${r(yT(t))}" r="3" fill="#d62828"/>`));
  s.push(`<line x1="${X0}" y1="${Y0}" x2="${X0}" y2="${Y1}" stroke="#1c2333" stroke-width="1.2"/>`);
  s.push(`<line x1="${X1}" y1="${Y0}" x2="${X1}" y2="${Y1}" stroke="#1c2333" stroke-width="1.2"/>`);
  s.push(`<line x1="${X0}" y1="${Y1}" x2="${X1}" y2="${Y1}" stroke="#1c2333" stroke-width="1.2"/>`);
  INIT.forEach((l, m) => s.push(`<text x="${r(X0 + (m + 0.5) * col)}" y="${Y1 + 17}" font-size="12" text-anchor="middle" fill="#1c2333">${l}</text>`));
  s.push(`<text x="${X0 - 4}" y="22" font-size="13" font-weight="bold" text-anchor="middle" fill="#b3261e">°C</text>`);
  s.push(`<text x="${X1 + 4}" y="22" font-size="13" font-weight="bold" text-anchor="middle" fill="#1f5fa8">mm</text>`);
  s.push('<rect x="40" y="266" width="16" height="12" fill="#6aa6e8" stroke="#1f5fa8" stroke-width="1"/>');
  s.push('<text x="62" y="276" font-size="12" fill="#1c2333">Précipitations (mm)</text>');
  s.push('<line x1="210" y1="272" x2="236" y2="272" stroke="#d62828" stroke-width="2.5"/><circle cx="223" cy="272" r="3" fill="#d62828"/>');
  s.push('<text x="242" y="276" font-size="12" fill="#1c2333">Températures (°C)</text>');
  s.push('</svg>');
  return s.join('');
}

const SAISON_SECHE = {
  'mediterraneen|N': 'Oui, de juin à août',
  'mediterraneen|S': 'Oui, de décembre à février',
  'tropical|N': 'Oui, de novembre à mars',
  'tropical|S': 'Oui, de mai à septembre',
  'oceanique|N': 'Non : il pleut assez tous les mois',
  'oceanique|S': 'Non : il pleut assez tous les mois',
  'aride|N': 'Il pleut très peu toute l\'année',
  'aride|S': 'Il pleut très peu toute l\'année',
};
const SECHE_CONFLITS = {
  'Oui, de juin à août': ['Oui, de mai à septembre'],
  'Oui, de mai à septembre': ['Oui, de juin à août'],
  'Oui, de décembre à février': ['Oui, de novembre à mars'],
  'Oui, de novembre à mars': ['Oui, de décembre à février'],
};
const deMois = (m) => (/^[aeiou]/.test(MOIS[m]) ? `d'${MOIS[m]}` : `de ${MOIS[m]}`);
const voisins = (m) => [m - 1, m + 1, m + 6, m - 3, m + 3, m - 2, m + 2].map((x) => ((x % 12) + 12) % 12).filter((x) => x !== m);

function climatogramme(modele, rng) {
  const types = Object.keys(CLIMATS);
  const type = rng.pick(types);
  const sud = CLIMATS[type].sud && rng.next() < 0.3;
  const d = donneesClimat(type, rng);
  if (!d) return null;
  const rot = (arr) => (sud ? arr.map((_, m) => arr[(m + 6) % 12]) : arr);
  const T = rot(d.T); const P = rot(d.P);
  const figure = svgClimatogramme(T, P);
  const { pS } = axes(T, P);
  const donnees = `${type}|${sud ? 'S' : 'N'}|${T.join(',')}|${P.join(',')}`;
  const iChaud = T.indexOf(Math.max(...T));
  const iFroid = T.indexOf(Math.min(...T));
  const iPluie = P.indexOf(Math.max(...P));
  const sortes = ['chaud', 'chaud', 'froid', 'pluie_mois', 'pluie_mois', 'temp_mois', 'type', 'type', 'type', 'seche', 'hemisphere', 'vf_temp'];
  if (type !== 'aride') sortes.push('pluvieux');
  const sorte = rng.pick(sortes);
  const base = { figure, fiche: 'hg-climats' };
  const lire = 'Sur un climatogramme, les barres bleues donnent les précipitations de chaque mois (axe de droite, en mm) et la courbe rouge la température moyenne (axe de gauche, en °C).';
  const qMois = (bonne, enonce, expl, sig, diff) => {
    const faux = rng.shuffle(voisins(bonne)).slice(0, 3);
    const choix = rng.shuffle([bonne, ...faux]);
    return {
      ...base, type: 'qcm', choix: choix.map((m) => maj(MOIS[m])), reponse: choix.indexOf(bonne),
      enonce, explication: expl, _signature: `${sig}|${donnees}|${cle(choix.map(String))}`, cleContenu: `${sig}|${donnees}`, difficulte: diff,
    };
  };
  switch (sorte) {
    case 'chaud':
      return qMois(iChaud, 'Observe ce climatogramme. Quel est le mois le plus chaud ?',
        `Le point le plus haut de la courbe rouge est en ${MOIS[iChaud]} (environ ${n(T[iChaud])} °C). ${lire}`, 'chaud', 1);
    case 'froid':
      return qMois(iFroid, 'Observe ce climatogramme. Quel est le mois le plus froid ?',
        `Le point le plus bas de la courbe rouge est en ${MOIS[iFroid]} (environ ${n(T[iFroid])} °C). ${lire}`, 'froid', 1);
    case 'pluvieux':
      return qMois(iPluie, 'Observe ce climatogramme. Quel est le mois le plus pluvieux ?',
        `La barre bleue la plus haute est celle ${deMois(iPluie)} (environ ${n(P[iPluie])} mm). ${lire}`, 'pluvieux', 1);
    case 'pluie_mois': {
      const mois = P.map((p, i) => (p >= 10 ? i : -1)).filter((i) => i >= 0);
      if (!mois.length) return null;
      const m = rng.pick(mois);
      const v = P[m];
      const cand = [v - 2 * pS, v - pS, v + pS, v + 2 * pS].filter((x) => x >= 0);
      const faux = rng.shuffle(cand).slice(0, 3);
      const choix = rng.shuffle([v, ...faux]);
      return {
        ...base, type: 'qcm', choix: choix.map((x) => `Environ ${n(x)} mm`), reponse: choix.indexOf(v),
        enonce: `Observe ce climatogramme. Combien de millimètres de pluie tombe-t-il environ en ${MOIS[m]} ?`,
        explication: `Pour lire les précipitations, on regarde le haut de la barre bleue ${deMois(m)} et on lit l'axe de droite (en mm) : environ ${n(v)} mm. Les lignes du quadrillage sont espacées de ${n(pS)} mm.`,
        _signature: `pm|${m}|${donnees}|${cle(choix.map(String))}`, cleContenu: `pm|${m}|${donnees}`, difficulte: 2,
      };
    }
    case 'temp_mois': {
      const m = rng.int(0, 11);
      const v = T[m];
      const faux = rng.shuffle([v - 10, v - 5, v + 5, v + 10]).slice(0, 3);
      const choix = rng.shuffle([v, ...faux]);
      return {
        ...base, type: 'qcm', choix: choix.map((x) => `Environ ${n(x)} °C`), reponse: choix.indexOf(v),
        enonce: `Observe ce climatogramme. Quelle est la température moyenne en ${MOIS[m]} ?`,
        explication: `On regarde le point de la courbe rouge au-dessus du mois ${deMois(m)} et on lit l'axe de gauche (en °C) : environ ${n(v)} °C.`,
        _signature: `tm|${m}|${donnees}|${cle(choix.map(String))}`, cleContenu: `tm|${m}|${donnees}`, difficulte: 2,
      };
    }
    case 'type': {
      const bon = CLIMATS[type].nom;
      const q = qcm(rng, bon, types.filter((t) => t !== type).map((t) => CLIMATS[t].nom));
      return {
        ...base, ...q,
        enonce: 'Observe ce climatogramme. De quel type de climat s\'agit-il ?',
        explication: `Climat ${bon.toLowerCase()} : ${CLIMATS[type].desc}. Ici, les températures vont d'environ ${n(Math.min(...T))} °C à ${n(Math.max(...T))} °C.${sud && type !== 'tropical' ? ' Les mois chauds sont en décembre-janvier : le lieu est dans l\'hémisphère Sud.' : ''}`,
        _signature: `ty|${donnees}|${cle(q.choix)}`, cleContenu: `ty|${donnees}`, difficulte: 3,
      };
    }
    case 'seche': {
      const bonne = SAISON_SECHE[`${type}|${sud ? 'S' : 'N'}`];
      if (!bonne) return null;
      const exclus = new Set([bonne, ...(SECHE_CONFLITS[bonne] ?? [])]);
      const pool = [...new Set(Object.values(SAISON_SECHE))].filter((x) => !exclus.has(x));
      const q = qcm(rng, bonne, pool);
      const expl = type === 'oceanique'
        ? 'Toutes les barres bleues sont assez hautes : il pleut régulièrement tous les mois, il n\'y a pas de saison sèche.'
        : type === 'aride'
          ? 'Les barres bleues sont minuscules (ou absentes) tous les mois : il ne pleut presque jamais, c\'est un climat aride.'
          : `Les barres bleues sont très basses pendant plusieurs mois de suite : c'est la saison sèche (${bonne.replace('Oui, ', '')}).`;
      return {
        ...base, ...q,
        enonce: 'Observe ce climatogramme. Ce lieu connaît-il une saison sèche (plusieurs mois de suite avec très peu de pluie) ?',
        explication: expl,
        _signature: `sec|${donnees}|${cle(q.choix)}`, cleContenu: `sec|${donnees}`, difficulte: 2,
      };
    }
    case 'hemisphere': {
      if (type === 'tropical') return null;
      const bonne = sud ? 'Dans l\'hémisphère Sud' : 'Dans l\'hémisphère Nord';
      const choix = ['Dans l\'hémisphère Nord', 'Dans l\'hémisphère Sud'];
      return {
        ...base, type: 'qcm', choix, reponse: choix.indexOf(bonne),
        enonce: 'Observe ce climatogramme. Dans quel hémisphère se trouve ce lieu ?',
        explication: sud
          ? `Le mois le plus chaud est ${MOIS[iChaud]} et le plus froid ${MOIS[iFroid]} : les saisons sont inversées par rapport à la Belgique. Le lieu est dans l'hémisphère Sud, où l'été tombe en décembre, janvier et février.`
          : `Le mois le plus chaud est ${MOIS[iChaud]} et le plus froid ${MOIS[iFroid]}, comme en Belgique : le lieu est dans l'hémisphère Nord.`,
        _signature: `hem|${donnees}`, cleContenu: `hem|${donnees}`, difficulte: 3,
      };
    }
    case 'vf_temp': {
      const m = rng.int(0, 11);
      const seuils = [0, 10, 20, 25, 30].filter((s0) => Math.abs(T[m] - s0) >= 3);
      if (!seuils.length) return null;
      const s0 = rng.pick(seuils);
      const plus = rng.next() < 0.5;
      const vrai = plus ? T[m] > s0 : T[m] < s0;
      return {
        ...base, type: 'vrai_faux',
        enonce: `Observe ce climatogramme. Vrai ou faux ? En ${MOIS[m]}, la température moyenne est ${plus ? 'supérieure' : 'inférieure'} à ${n(s0)} °C.`,
        reponse: vrai,
        explication: `En ${MOIS[m]}, la courbe rouge indique environ ${n(T[m])} °C, ce qui est ${T[m] > s0 ? 'plus' : 'moins'} que ${n(s0)} °C.`,
        _signature: `vft|${m}|${s0}|${plus}|${donnees}`, cleContenu: `vft|${m}|${s0}|${plus}|${donnees}`, difficulte: 1,
      };
    }
    default: return null;
  }
}

// =====================================================================================
// 7. Population mondiale
// =====================================================================================
const ORDRES_POP = [
  { q: 'Environ combien d\'êtres humains vivent sur Terre aujourd\'hui ?', ok: 'Environ 8 milliards',
    ko: ['Environ 8 millions', 'Environ 800 millions', 'Environ 80 milliards', 'Environ 2 milliards'],
    expl: 'La population mondiale a dépassé 8 milliards d\'habitants en 2022 (8 000 000 000).' },
  { q: 'Sur quel continent vivent le plus d\'êtres humains ?', ok: 'L\'Asie',
    ko: ['L\'Europe', 'L\'Afrique', 'L\'Amérique', 'L\'Océanie'],
    expl: 'Environ 6 humains sur 10 vivent en Asie. L\'Inde et la Chine sont les deux pays les plus peuplés du monde.' },
  { q: 'Sur 10 habitants de la Terre, environ combien vivent en Asie ?', ok: 'Environ 6',
    ko: ['Environ 1', 'Environ 3', 'Environ 9'],
    expl: 'Environ 60 % de l\'humanité vit en Asie, soit environ 6 personnes sur 10.' },
  { q: 'Sur 10 habitants de la Terre, environ combien vivent en Europe ?', ok: 'Environ 1',
    ko: ['Environ 3', 'Environ 5', 'Environ 6'],
    expl: 'Environ 10 % de l\'humanité vit en Europe, soit environ 1 personne sur 10.' },
  { q: 'Aujourd\'hui, quelle part de la population mondiale vit en ville ?', ok: 'Plus de la moitié',
    ko: ['Environ 1 personne sur 10', 'Environ un quart', 'Presque personne'],
    expl: 'Depuis le début du XXIe siècle, plus de la moitié des humains vivent en ville, et cette part augmente encore.' },
  { q: 'En dehors de l\'Antarctique, quel continent compte le moins d\'habitants ?', ok: 'L\'Océanie',
    ko: ['L\'Asie', 'L\'Afrique', 'L\'Europe', 'L\'Amérique'],
    expl: 'L\'Océanie (Australie, Nouvelle-Zélande, îles du Pacifique) compte environ 45 millions d\'habitants : c\'est le continent habité le moins peuplé.' },
  { q: 'Sur quel continent n\'y a-t-il aucun habitant permanent ?', ok: 'L\'Antarctique',
    ko: ['L\'Océanie', 'L\'Afrique', 'L\'Europe', 'L\'Amérique'],
    expl: 'L\'Antarctique est couvert de glace et glacial toute l\'année : seuls des scientifiques y séjournent dans des bases.' },
  { q: 'Quels sont les deux pays les plus peuplés du monde ?', ok: 'L\'Inde et la Chine',
    ko: ['Les États-Unis et la Russie', 'Le Brésil et le Canada', 'La France et l\'Allemagne', 'L\'Australie et l\'Égypte'],
    expl: 'L\'Inde et la Chine ont chacune plus de 1,4 milliard d\'habitants. Ensemble, elles rassemblent plus d\'un humain sur trois.' },
  { q: 'Près de quels endroits vivent beaucoup d\'êtres humains, partout dans le monde ?', ok: 'Près des côtes et des grands fleuves',
    ko: ['En haute montagne', 'Dans les grands déserts', 'Près des pôles', 'Au cœur des forêts équatoriales'],
    expl: 'Les littoraux et les vallées des fleuves offrent de l\'eau, des terres fertiles, des plaines et des ports : on y trouve beaucoup d\'habitants et de grandes villes.' },
  { q: 'Qu\'est-ce que la densité de population ?', ok: 'Le nombre moyen d\'habitants par km²',
    ko: ['Le nombre total d\'habitants d\'un pays', 'La superficie d\'un pays', 'Le nombre de villes d\'un pays'],
    expl: 'Densité = nombre d\'habitants ÷ superficie (en km²). Un pays peut avoir beaucoup d\'habitants mais une faible densité s\'il est très grand.' },
];
const LIEUX = [
  { t: 'le Sahara', ou: 'au Sahara', p: false, c: 'Il fait très chaud et il y a très peu d\'eau (désert chaud).' },
  { t: 'la Sibérie', ou: 'en Sibérie', p: false, c: 'Il y fait très froid pendant une grande partie de l\'année.' },
  { t: 'l\'Amazonie', ou: 'en Amazonie', p: false, c: 'C\'est une immense forêt dense, chaude et humide, difficile à traverser et à défricher.' },
  { t: 'l\'Himalaya', ou: 'dans l\'Himalaya', p: false, c: 'Ce sont de très hautes montagnes, aux pentes raides, où il fait froid et où l\'on cultive peu.' },
  { t: 'l\'Antarctique', ou: 'en Antarctique', p: false, c: 'C\'est un continent couvert de glace, glacial toute l\'année.' },
  { t: 'l\'intérieur du Groenland', ou: 'à l\'intérieur du Groenland', p: false, c: 'C\'est une région recouverte d\'une épaisse calotte de glace.' },
  { t: 'le centre de l\'Australie', ou: 'au centre de l\'Australie', p: false, c: 'C\'est une région très sèche (aride), avec très peu de pluie.' },
  { t: 'le Grand Nord canadien', ou: 'dans le Grand Nord canadien', p: false, c: 'Il y fait très froid pendant une grande partie de l\'année.' },
  { t: 'la vallée et le delta du Nil', ou: 'dans la vallée et le delta du Nil', p: true, c: 'L\'eau du fleuve permet de cultiver des terres fertiles au milieu du désert.' },
  { t: 'la plaine du Gange, en Inde', ou: 'dans la plaine du Gange, en Inde', p: true, c: 'C\'est une grande plaine fertile, arrosée par un fleuve et par les pluies de la mousson.' },
  { t: 'l\'est de la Chine', ou: 'dans l\'est de la Chine', p: true, c: 'On y trouve des plaines fertiles, de grands fleuves et un long littoral.' },
  { t: 'l\'île de Java, en Indonésie', ou: 'sur l\'île de Java, en Indonésie', p: true, c: 'Les sols volcaniques y sont fertiles et le climat chaud et humide convient au riz.' },
  { t: 'le Bangladesh', ou: 'au Bangladesh', p: true, c: 'C\'est un immense delta fertile, très favorable à la culture du riz.' },
  { t: 'l\'Europe de l\'Ouest', ou: 'en Europe de l\'Ouest', p: true, c: 'Le climat y est tempéré, avec des plaines, des fleuves et de nombreuses villes.' },
  { t: 'les côtes du Japon', ou: 'sur les côtes du Japon', p: true, c: 'Les plaines du littoral accueillent des ports et de très grandes villes.' },
  { t: 'la côte est des États-Unis', ou: 'sur la côte est des États-Unis', p: true, c: 'Le littoral offre des ports et de grandes villes ouvertes au commerce.' },
];
const PAYS_POP = [
  { nom: 'la Russie', pop: 144e6, sup: 17100000 },
  { nom: 'le Bangladesh', pop: 173e6, sup: 148000 },
  { nom: 'le Canada', pop: 41e6, sup: 9985000 },
  { nom: 'la Belgique', pop: 11.8e6, sup: 30700 },
  { nom: 'le Japon', pop: 124e6, sup: 378000 },
  { nom: 'l\'Australie', pop: 27e6, sup: 7700000 },
  { nom: 'le Brésil', pop: 212e6, sup: 8500000 },
  { nom: 'la Mongolie', pop: 3.5e6, sup: 1560000 },
  { nom: 'l\'Inde', pop: 1450e6, sup: 3290000 },
  { nom: 'la Chine', pop: 1410e6, sup: 9600000 },
  { nom: 'l\'Égypte', pop: 116e6, sup: 1000000 },
  { nom: 'le Nigeria', pop: 230e6, sup: 924000 },
  { nom: 'l\'Allemagne', pop: 84e6, sup: 357600 },
  { nom: 'le Pakistan', pop: 250e6, sup: 796000 },
];
const popTxt = (p) => (p >= 1e9 ? `${n(Math.round(p / 1e7) / 100)} milliard` : `${n(Math.round(p / 1e5) / 10)} millions`);
const dens = (x) => x.pop / x.sup;
const deNom = (nom) => (/^le /.test(nom) ? nom.replace(/^le /, 'du ') : /^les /.test(nom) ? nom.replace(/^les /, 'des ') : `de ${nom}`);
const densTxt = (x) => { const d = dens(x); return d < 10 ? n(Math.round(d * 10) / 10) : n(Math.round(d)); };

const population = famille('po', [
  [4, (rng) => ({ ...depuisBanque(rng, ORDRES_POP, 'og'), difficulte: 1 })],
  // Grille peuplé / peu peuplé
  [3, (rng) => {
    const items = tirerMixte(rng, LIEUX, 4, (x) => x.p);
    if (!items) return null;
    return {
      ...grilleQ(items.map((x) => ({ t: x.t, c: x.p ? 0 : 1 })), ['Très peuplé', 'Peu peuplé']),
      enonce: 'Ces espaces du monde sont-ils très peuplés ou peu peuplés ?',
      explication: maj(items.map((x) => `${x.t} : ${x.p ? 'très peuplé' : 'peu peuplé'}`).join(' ; ')) + '. Le relief, l\'eau, le climat et la proximité de la mer expliquent ces différences.',
      _signature: `pp|${cle(items.map((x) => x.t))}`,
      cleContenu: `pp|${cle(items.map((x) => x.t))}`,
      difficulte: 2,
    };
  }],
  // Cause
  [3, (rng) => {
    const l = rng.pick(LIEUX);
    const q = qcm(rng, l.c, LIEUX.filter((x) => x.p !== l.p).map((x) => x.c));
    return {
      ...q,
      enonce: `Pourquoi y a-t-il ${l.p ? 'beaucoup' : 'très peu'} d'habitants ${l.ou} ?`,
      explication: `${maj(l.ou)}, il y a ${l.p ? 'beaucoup' : 'très peu'} d'habitants : ${l.c.charAt(0).toLowerCase()}${l.c.slice(1)}`,
      _signature: `cause|${l.t}|${cle(q.choix)}`,
      cleContenu: `cause|${l.t}`,
      difficulte: 2,
    };
  }],
  // Lequel est peu peuplé / très peuplé
  [2, (rng) => {
    const peu = rng.next() < 0.5;
    const bonne = rng.pick(LIEUX.filter((x) => x.p !== peu));
    const q = qcm(rng, maj(bonne.t), LIEUX.filter((x) => x.p === peu).map((x) => maj(x.t)));
    return {
      ...q,
      enonce: `Lequel de ces espaces est ${peu ? 'très peu peuplé' : 'très peuplé'} ?`,
      explication: `${maj(bonne.t)} : ${bonne.c.charAt(0).toLowerCase()}${bonne.c.slice(1)}`,
      _signature: `leq|${peu}|${bonne.t}|${cle(q.choix)}`,
      cleContenu: `leq|${peu}|${cle(q.choix)}`,
      difficulte: 1,
    };
  }],
  // Densité ≠ population totale
  [4, (rng) => {
    const [a, b] = rng.shuffle(PAYS_POP).slice(0, 2);
    const rp = Math.max(a.pop, b.pop) / Math.min(a.pop, b.pop);
    const rd = Math.max(dens(a), dens(b)) / Math.min(dens(a), dens(b));
    if (rp < 1.3 || rd < 1.5) return null;
    const plusPeuple = a.pop > b.pop ? a : b;
    const plusDense = dens(a) > dens(b) ? a : b;
    const donnees = `En 2024, ${a.nom} compte environ ${popTxt(a.pop)} d'habitants pour ${n(a.sup)} km² ; ${b.nom} compte environ ${popTxt(b.pop)} d'habitants pour ${n(b.sup)} km².`;
    const calc = `Densités : ${a.nom} ≈ ${densTxt(a)} hab./km² ; ${b.nom} ≈ ${densTxt(b)} hab./km².`;
    const sorte = rng.pick(['dense', 'dense', 'peuple', 'vf']);
    const sig = `${a.nom}|${b.nom}|${sorte}`;
    if (sorte === 'vf') {
      const x = rng.next() < 0.5 ? a : b; const y = x === a ? b : a;
      return {
        type: 'vrai_faux',
        enonce: `${donnees} Vrai ou faux ? ${maj(x.nom)} a une densité de population plus forte que ${y.nom}.`,
        reponse: dens(x) > dens(y),
        explication: `${calc} La densité dépend du nombre d'habitants ET de la superficie : ce n'est pas toujours le pays le plus peuplé qui est le plus dense.`,
        _signature: `${sig}|${x.nom}`, difficulte: 3,
      };
    }
    const bonne = sorte === 'dense' ? plusDense : plusPeuple;
    const choix = [maj(a.nom), maj(b.nom)];
    return {
      type: 'qcm', choix, reponse: choix.indexOf(maj(bonne.nom)),
      enonce: `${donnees} Quel pays ${sorte === 'dense' ? 'est le plus densément peuplé' : 'a la plus grande population totale'} ?`,
      explication: sorte === 'dense'
        ? `${calc} La densité la plus forte est celle ${deNom(plusDense.nom)}${plusDense !== plusPeuple ? `, même si ${plusPeuple.nom} a plus d'habitants` : ''}.`
        : `On compare simplement le nombre d'habitants : ${plusPeuple.nom} en a le plus. ${calc}`,
      _signature: sig, difficulte: sorte === 'dense' ? 3 : 1,
    };
  }],
]);

// =====================================================================================
// ÉTAPE 2 — utilitaires communs (figures SVG)
// =====================================================================================
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r1 = (v) => Math.round(v * 10) / 10;
const svgOuvrir = (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" font-family="Arial, sans-serif"><rect x="0" y="0" width="${w}" height="${h}" fill="#ffffff"/>`;
// Pastille lettrée (repère sur une carte ou un dessin).
const pastille = (x, y, l) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="9.5" fill="#ffffff" stroke="#1c2333" stroke-width="1.6"/><text x="${r1(x)}" y="${r1(y + 4.6)}" font-size="13" font-weight="bold" text-anchor="middle" fill="#1c2333">${l}</text>`;
const LETTRES = ['A', 'B', 'C', 'D', 'E', 'F'];
const leLa = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// =====================================================================================
// 8. Planisphère (P6) : continents, océans, équateur, tropiques, cercles polaires
// =====================================================================================
// Fond de carte simplifié, projection équirectangulaire : x = longitude, y = latitude.
const PX = (lon) => ((lon + 180) * 400) / 360;
const PY = (lat) => 6 + ((90 - lat) * 200) / 180;
const TERRES = [
  // Amérique du Nord (avec l'Amérique centrale)
  [[-168, 66], [-162, 70], [-156, 71.3], [-141, 69.7], [-128, 70], [-115, 68.5], [-97, 68], [-94, 71.5], [-87, 68], [-82, 66.5], [-87, 64], [-94, 60], [-93, 57.5], [-87, 55.5], [-82, 52.5], [-79, 55], [-77, 59], [-71, 61], [-64, 60], [-61, 56], [-56, 52], [-60, 47.5], [-66, 44.8], [-70, 41.8], [-74, 40.5], [-76, 35.5], [-81, 31], [-80, 25.3], [-82.5, 28], [-84, 30], [-90, 29.2], [-94, 29.6], [-97.3, 27], [-97.5, 22], [-95, 18.7], [-91, 18.7], [-90.4, 21], [-87, 21.5], [-88, 16], [-83.5, 15], [-83.7, 11], [-79.5, 9.5], [-77.4, 8.6], [-79, 8], [-80.5, 7.3], [-85.7, 10], [-87.5, 13], [-91.5, 14], [-96.5, 15.7], [-105.5, 20], [-105.7, 23], [-110, 24.2], [-112.5, 29], [-114.5, 31.5], [-117, 32.5], [-120.6, 34.5], [-123, 38], [-124.2, 42], [-124, 46.5], [-125, 50], [-130, 54.5], [-136, 58], [-140, 59.8], [-146, 61], [-150, 59.5], [-154, 58], [-158, 56.5], [-163, 54.8], [-158, 58.5], [-162, 60], [-165.5, 62], [-164.5, 64], [-168, 65.6]],
  // Groenland
  [[-73, 78.2], [-62, 81.8], [-40, 83.2], [-22, 82.5], [-18, 77], [-20, 71], [-24, 68.5], [-32, 68], [-40, 65], [-43.5, 60], [-48, 61], [-51.5, 64.5], [-53.5, 68], [-55, 71], [-58, 75.5], [-66, 76.5]],
  // Archipel arctique canadien (simplifié)
  [[-121, 71.5], [-114, 74], [-104, 76], [-96, 78], [-84, 80.5], [-70, 82.5], [-62, 82], [-72, 78.5], [-78, 76], [-77, 72.8], [-70, 70.5], [-62.5, 66.8], [-66, 62.5], [-74, 64], [-80, 64], [-82, 69.5], [-90, 70], [-98, 72], [-105, 69], [-116, 69.2]],
  // Amérique du Sud
  [[-77.4, 8.6], [-75.5, 10.5], [-72, 12.3], [-68, 10.6], [-62, 10.5], [-60, 8.3], [-56, 6], [-52, 4.8], [-50, 1], [-48, -1], [-44, -2.5], [-38.5, -4], [-35, -6], [-35, -9], [-37.5, -12.5], [-39, -15], [-39.5, -18.5], [-41, -22], [-44.5, -23.3], [-48.5, -26], [-48.7, -28.5], [-53, -33.5], [-58.4, -34.7], [-57, -38], [-62, -39], [-65, -41], [-64, -42.8], [-65.5, -45], [-67.5, -46.5], [-66, -48], [-68.3, -50.2], [-68.5, -52.3], [-66.5, -55], [-70, -55.5], [-74, -52.5], [-75.5, -48.5], [-74, -44], [-73.5, -39], [-71.7, -32], [-71.4, -26], [-70.2, -18.5], [-75, -15.5], [-77, -12], [-79.5, -7.5], [-81.2, -6], [-80.4, -3.5], [-80, -0.5], [-79.8, 1.5], [-78, 3.5], [-77.3, 6.5]],
  // Eurasie
  [[-9, 37], [-8.8, 41.5], [-9, 43], [-4, 43.5], [-1.5, 43.5], [-1.2, 46], [-2.5, 47.3], [-4.6, 48.3], [-1.5, 48.7], [-1.3, 49.7], [1.5, 50.5], [3, 51.2], [4.5, 52.5], [5.2, 53.4], [8.4, 53.6], [8.4, 55.6], [8.2, 57], [10.5, 57.7], [10.6, 56], [10.2, 54.5], [12, 54.2], [14.2, 53.9], [17, 54.7], [19.6, 54.4], [21, 55.6], [21.3, 57.2], [23.5, 57.2], [24.3, 59.4], [28.2, 59.7], [30.2, 59.9], [28.5, 60.5], [25.5, 60.3], [22.5, 60.2], [21.4, 61.3], [21.6, 63.2], [24.5, 64.9], [25.4, 65.4], [22.5, 65.8], [21.2, 64.5], [19.5, 63.5], [17.5, 62.3], [17.3, 60.6], [18.9, 59.7], [16.7, 57.5], [16, 56.2], [14.3, 55.5], [12.9, 55.4], [12.6, 56.6], [11.8, 58], [10.5, 59.3], [9.5, 59], [7.5, 58], [5.6, 58.8], [5, 60], [5, 62], [6.5, 62.6], [8.5, 63.4], [10, 64.2], [12.5, 66], [14, 67.5], [15.5, 68.6], [18, 69.6], [21, 70.2], [24, 71], [28, 71], [30.5, 70], [33, 69.4], [36.5, 69], [40.5, 67.7], [41.2, 66.3], [38, 66], [34.5, 66], [33, 64.5], [37, 64], [40, 64.6], [44, 65.8], [44, 68.4], [46, 67.8], [53.5, 68.3], [58, 68.8], [61, 69.8], [66, 69.4], [68.5, 68.2], [67, 71], [69, 72.9], [72.5, 72.8], [72.6, 70], [75, 72.3], [80, 72.5], [83, 70.3], [83.5, 71.5], [80.5, 73.6], [87, 74.6], [94, 76], [100, 76.5], [104, 77.7], [108, 76.7], [113, 75.9], [113.5, 73.6], [118, 73.5], [124, 73.6], [128.5, 72.5], [131, 70.8], [136, 71.6], [140, 72.4], [146, 72.3], [152, 71], [159, 70.9], [161, 69.6], [168, 69.9], [170.5, 70.1], [176, 69.8], [180, 68.8], [180, 65.5], [178.5, 64.5], [176, 62.6], [173.5, 61.7], [170.5, 60], [165.5, 59.9], [163.3, 59], [162, 57.7], [163, 56.2], [161.8, 54.9], [158, 52.2], [156.7, 51.1], [155.8, 53.6], [155.5, 56.5], [156.5, 57.8], [161, 60.4], [159.5, 61.7], [154, 59.4], [151.3, 59.5], [148.5, 59.3], [143, 59.4], [139.5, 57.9], [135.3, 54.7], [137.2, 53.9], [140.5, 53.3], [141.4, 52.2], [140.5, 48.3], [138, 46], [135.5, 43.9], [132, 43.2], [129.7, 41.1], [129.5, 37.2], [129.2, 35.2], [127, 34.6], [126.3, 34.5], [126.6, 37.5], [124.8, 39.6], [121.7, 39], [121.5, 40.8], [119.6, 39.9], [117.7, 38.9], [118.9, 37.4], [120.8, 37.8], [122.5, 36.9], [120.3, 36], [119.2, 34.8], [120.8, 32.6], [121.9, 30.9], [121.5, 28.6], [119.6, 25.8], [117, 23.6], [114, 22.3], [111, 21.4], [109.7, 21.5], [108.5, 21.7], [106.7, 20.2], [105.7, 18.7], [107.5, 16.3], [109.3, 13.3], [109, 11.4], [107, 10.4], [104.7, 8.7], [105, 10.3], [103, 11.2], [100.9, 12.7], [100.1, 13.4], [99.2, 10.8], [100.4, 7.4], [101.4, 6.8], [103.4, 4.8], [104.2, 1.4], [103.4, 1.3], [101.3, 2.8], [100.3, 5.1], [98.3, 8.4], [98.5, 13.4], [97.6, 16.4], [94.3, 16.1], [94.3, 19.3], [92.4, 20.7], [91.8, 22.3], [90.4, 22], [88.9, 21.7], [86.9, 21], [86.5, 20.1], [84.8, 19.2], [82.2, 16.6], [80.2, 15.1], [79.8, 10.3], [78.4, 8.9], [77.5, 8.1], [76.3, 9.9], [74.8, 12.8], [73.4, 16], [72.8, 19.3], [72.6, 21.4], [70.5, 20.8], [69, 22.3], [67.4, 23.9], [66.4, 25.4], [61.5, 25.1], [57.4, 25.7], [56.4, 27.1], [54.7, 26.5], [51.5, 27.9], [50.1, 30.1], [47.9, 30], [48.6, 28], [50.1, 26.7], [50.8, 24.8], [51.6, 24.2], [54, 24.1], [56, 26], [56.4, 24.9], [57.4, 23.9], [59.8, 22.5], [58.6, 20.4], [57.8, 19], [55.3, 17.2], [52.2, 15.9], [49.1, 14.5], [45, 12.8], [43.5, 12.6], [42.8, 15.2], [42.6, 16.8], [40.9, 19.5], [39.1, 21.3], [38.5, 23.7], [37, 25.8], [35.1, 28.1], [34.6, 28.1], [34.9, 29.5], [34.3, 31.2], [34.6, 31.5], [35.5, 33.1], [35.9, 35.4], [36.2, 36.7], [34.7, 36.8], [32.5, 36.1], [30.6, 36.7], [28.7, 36.7], [27.6, 37.5], [26.3, 38.2], [26.8, 39.6], [26.2, 40.8], [24.9, 40.9], [23.7, 40.7], [24, 40.1], [22.8, 40.3], [23.4, 39.2], [23.4, 38.2], [22.8, 37.3], [21.7, 36.8], [21.1, 38.3], [20.2, 39.6], [19.4, 41.7], [18.4, 42.5], [17.5, 43.1], [16, 43.5], [15, 44.6], [14.3, 45.3], [13.7, 45.7], [12.3, 45.3], [12.4, 44.2], [13.5, 43.6], [14.7, 42.1], [16.2, 41.7], [17.9, 40.6], [18.5, 40.2], [17.2, 39.4], [16.6, 38.4], [15.7, 38], [15.9, 39.5], [15.4, 40.1], [14, 40.8], [12.3, 41.7], [10.5, 42.9], [10.2, 43.9], [8.9, 44.4], [7.5, 43.8], [6.5, 43.1], [4.6, 43.4], [3.1, 43.1], [3.2, 41.9], [0.8, 41], [-0.3, 39.3], [0.2, 38.7], [-0.7, 37.6], [-2.1, 36.7], [-4.4, 36.7], [-5.6, 36], [-6.5, 36.9], [-7.4, 37.2], [-8.9, 37.1]],
  // Îles britanniques, Islande
  [[-5.7, 50.1], [-3.5, 50.4], [0.8, 50.8], [1.5, 51.3], [1.7, 52.7], [0.2, 53.4], [-0.5, 54.5], [-1.6, 55.6], [-2, 57.1], [-1.8, 57.6], [-3.4, 57.7], [-3, 58.6], [-5, 58.6], [-5.8, 57.5], [-6.2, 56.5], [-5.6, 55.3], [-4.8, 54.8], [-3.3, 54.9], [-3.4, 54.3], [-3, 53.4], [-4.6, 53.3], [-4.2, 52.3], [-5.2, 51.7], [-3, 51.5], [-5, 51]],
  [[-6, 52.2], [-6.1, 53.5], [-5.6, 54.6], [-7.3, 55.3], [-8.4, 55.2], [-10, 54.2], [-9.9, 53.4], [-10.3, 51.9], [-8.5, 51.6]],
  [[-24.3, 65.5], [-22.5, 66.4], [-18, 66.2], [-14.5, 66.4], [-13.6, 65.1], [-15, 64.3], [-18.7, 63.4], [-22.6, 63.8]],
  // Japon, Sakhaline, Taïwan, Philippines, Sri Lanka
  [[130.2, 31.3], [131.2, 31.4], [132, 33.4], [134.6, 34.2], [136.8, 34.3], [139.8, 34.9], [140.8, 35.7], [141, 38.3], [142, 39.6], [141.4, 41.4], [140, 40.7], [139.9, 39.4], [139, 37.9], [136.8, 37.2], [136, 35.7], [133, 35.5], [131, 34.6]],
  [[140, 41.5], [141.2, 43.2], [141.7, 45.4], [143.8, 44.2], [145.5, 43.3], [143.3, 42], [141, 42.3]],
  [[142, 46], [143.5, 49.5], [142.8, 54.3], [142.2, 51]],
  [[120.1, 23], [121.9, 25], [121.6, 22]],
  [[120.6, 18.5], [122.3, 18.5], [122.2, 16.3], [124, 12.6], [126.3, 9.2], [126.2, 6.3], [125.4, 5.6], [122, 6.9], [123.3, 9.8], [120.6, 14.2]],
  [[79.8, 6.1], [79.9, 8.9], [80.4, 9.8], [81.9, 7.6], [81.6, 6.4]],
  // Indonésie, Nouvelle-Guinée
  [[95.3, 5.6], [97.5, 5.2], [100.4, 2.1], [104, -1.2], [106, -3.1], [105.9, -5.8], [104.5, -5.9], [102.3, -4], [100.4, -0.9], [98.5, 1.7]],
  [[109.6, 1.9], [109.7, -1.2], [110.3, -3], [114.5, -3.5], [116.5, -2.5], [117.5, 0.8], [118.9, 1.2], [117.9, 4.1], [119.2, 5.4], [117, 7], [116, 6], [114.5, 4.5], [111, 1.6]],
  [[105.2, -6.8], [108.6, -6.7], [110.5, -6.9], [112.6, -6.9], [114.6, -7.8], [113, -8.3], [108.5, -7.8], [106.4, -7.4]],
  [[119.4, -5.4], [120.4, -5.5], [121.6, -4.2], [121.4, -2], [123.1, -0.7], [124.9, 1.6], [120.9, 1.3], [119.8, 0.1], [119.2, -3.5]],
  [[131, -1.4], [134.1, -0.9], [138, -1.6], [141, -2.6], [144.6, -3.9], [147.6, -6.1], [148.1, -8], [150.5, -10.6], [147.1, -10.1], [146, -8.1], [143.4, -8.2], [141, -9.1], [138.9, -8.1], [137.6, -5.1], [134.7, -4.1], [132.4, -4], [132, -2.8]],
  // Afrique
  [[-17.1, 21], [-17.4, 14.7], [-16.7, 13.5], [-15.6, 11.5], [-13.2, 9], [-11.4, 6.8], [-7.5, 4.4], [-3.3, 5.1], [1.1, 6], [2.7, 6.3], [4.5, 6.3], [6, 4.3], [7.5, 4.5], [8.5, 4.5], [9.6, 3.6], [9.8, 1.1], [9.3, -0.7], [11.1, -3.8], [12.2, -5.8], [13.4, -9.3], [13.6, -12], [11.8, -15.8], [12.3, -19.1], [14.3, -22.5], [15.3, -27.3], [16.5, -28.6], [17.9, -31.3], [18.4, -34], [20, -34.8], [22.6, -33.9], [25.8, -33.7], [28.3, -32.2], [30.9, -29.9], [32.5, -28.5], [32.9, -26.2], [35.4, -24], [35.5, -21.2], [34.7, -19.8], [36.6, -18.6], [40.5, -15.4], [40.5, -10.6], [39.4, -7.1], [39.2, -4.7], [40.3, -2.6], [42.4, -0.6], [44.3, 1.5], [46.6, 3], [48.9, 6.7], [50.7, 9.8], [51.3, 11.9], [48.6, 11.3], [45.4, 10.6], [43.4, 11.6], [43.3, 12.6], [41.2, 14.8], [39.3, 15.9], [38.4, 18.1], [37.4, 21], [36.9, 22.1], [35.6, 23.9], [34.2, 26.2], [33.3, 28], [32.5, 29.9], [32.3, 31.2], [30.1, 31.5], [28.9, 30.9], [25.2, 31.6], [23.1, 32.6], [20.1, 32.2], [19.7, 30.5], [18, 30.8], [15.4, 32.3], [11.5, 33.1], [10.3, 34], [11.1, 35.2], [10.1, 37.1], [8.4, 36.9], [5.3, 36.7], [1.5, 36.6], [-1.2, 35.4], [-2.2, 35.2], [-5.4, 35.9], [-6.2, 35.1], [-6.9, 33.6], [-9.3, 32.6], [-9.7, 30.3], [-11.2, 28.2], [-13.2, 27.6], [-14.6, 25.4], [-16.3, 23.4], [-16.9, 21.7]],
  // Madagascar
  [[49.3, -12], [50.4, -15.5], [49.5, -17.1], [48, -22.6], [47.1, -24.9], [45.4, -25.6], [43.9, -24.6], [43.3, -22.1], [44.5, -19.9], [44, -17.3], [46.3, -15.8], [48, -13.6]],
  // Australie, Tasmanie, Nouvelle-Zélande
  [[113.4, -22], [113.8, -26.5], [114.9, -29.5], [115, -33.5], [116.7, -35], [119.9, -34], [123.5, -33.9], [126.2, -32.3], [129, -31.7], [131.3, -31.5], [134.2, -32.6], [135.9, -34.8], [137.7, -33], [137.8, -35.6], [139.6, -36.6], [140.6, -38], [143.6, -38.8], [146.3, -39.1], [148.3, -37.8], [150, -37.4], [150.9, -34.4], [152.9, -31.1], [153.6, -28.2], [153.1, -25], [150.9, -22.6], [149.2, -21.1], [147.4, -19.5], [146.1, -18.2], [145.3, -15.6], [145.2, -14.9], [143.6, -14], [142.5, -10.7], [141.6, -13.2], [141.6, -16.5], [140.6, -17.6], [139.3, -17.4], [137.3, -15.8], [135.4, -14.7], [136.9, -12.3], [134.7, -11.9], [132.6, -11.6], [131.3, -12.1], [130.2, -13.1], [129.5, -14.9], [127.7, -14.1], [125.1, -14.7], [123.6, -16.4], [122.3, -17.6], [121.1, -19.4], [119, -20], [117.2, -20.6], [114.7, -21.8]],
  [[144.7, -40.7], [146.3, -41.1], [148.3, -40.9], [148.3, -42.2], [147.4, -43.2], [146, -43.6], [145.2, -42.3]],
  [[172.6, -34.4], [174.3, -35.3], [175.9, -37.5], [178.5, -37.7], [177, -39.4], [176, -41.3], [174.6, -41.3], [174.6, -39.9], [173.8, -39.1], [174.6, -38], [174.4, -36.4]],
  [[172.7, -40.5], [174.2, -41.7], [173.2, -43.2], [171.4, -44.4], [170.6, -45.9], [169.3, -46.6], [166.5, -46], [168.2, -44], [170.5, -43], [171.8, -41.5]],
  // Antarctique
  [[-180, -90], [-180, -78], [-160, -78.5], [-150, -77], [-140, -75.3], [-125, -73.8], [-110, -74.3], [-100, -73.5], [-90, -73], [-80, -73.3], [-75, -71], [-68, -67.5], [-63, -64.6], [-57, -63.3], [-58.5, -65.2], [-61, -68.5], [-62, -72], [-61, -74.7], [-55, -77.5], [-45, -78.3], [-35, -77.8], [-26, -76], [-18, -73], [-10, -71.3], [0, -70.3], [10, -70], [20, -70], [30, -69.6], [40, -69], [50, -67], [60, -67.2], [70, -68.5], [75, -69.5], [80, -67.5], [90, -66.5], [100, -65.8], [110, -66], [120, -66.8], [130, -66.2], [140, -66.8], [150, -68.6], [160, -70.5], [165, -71.5], [170, -72], [167, -76], [165, -78], [172, -78.5], [180, -78], [180, -90]],
];
// Mers fermées tracées en « eau » par-dessus les terres.
const MERS = [
  // mer Noire, mer Caspienne
  [[28, 41.3], [28.5, 43.4], [30.7, 46.5], [33.5, 44.6], [36.6, 45.3], [38.2, 47.1], [39.7, 47], [38.3, 44.6], [41.6, 41.5], [36.5, 41.3], [33.3, 42], [31.3, 41.2]],
  [[47, 45], [50.3, 46.9], [53.2, 46.6], [52.7, 45.2], [51.3, 44.5], [52.7, 42], [54.2, 40.5], [53.1, 39.3], [53.9, 37.3], [51.5, 36.8], [49.2, 37.6], [49.5, 40.2], [47.8, 41.9]],
  // mer Baltique (golfe de Botnie) déjà découpée ; mer Rouge et golfe Persique : ouverts dans le tracé.
];
const CONTINENTS_P = [
  { id: 'eur', nom: 'l\'Europe', pos: [[16, 50]] },
  { id: 'asi', nom: 'l\'Asie', pos: [[95, 50], [80, 60]] },
  { id: 'afr', nom: 'l\'Afrique', pos: [[20, 8], [24, 18]] },
  { id: 'amn', nom: 'l\'Amérique du Nord', pos: [[-100, 47], [-108, 58]] },
  { id: 'ams', nom: 'l\'Amérique du Sud', pos: [[-58, -10], [-63, -22]] },
  { id: 'oce', nom: 'l\'Océanie', pos: [[125, -26]] },
  { id: 'ant', nom: 'l\'Antarctique', pos: [[20, -80], [100, -79]] },
];
const OCEANS_P = [
  { id: 'atl', nom: 'l\'océan Atlantique', pos: [[-40, 30], [-18, -22]] },
  { id: 'pac', nom: 'l\'océan Pacifique', pos: [[-140, 8], [-120, -30], [165, 18]] },
  { id: 'ind', nom: 'l\'océan Indien', pos: [[75, -22], [88, -12]] },
  { id: 'arc', nom: 'l\'océan Arctique', pos: [[5, 81], [-160, 79]] },
  { id: 'aus', nom: 'l\'océan Austral (ou océan Antarctique)', court: 'l\'océan Austral', pos: [[-120, -62], [60, -59]] },
];
const LIGNES_P = [
  { id: 'equ', nom: 'l\'équateur', lat: 0, def: 'partage la Terre en deux hémisphères, Nord et Sud', coul: '#b3261e' },
  { id: 'can', nom: 'le tropique du Cancer', lat: 23.44, def: 'est au nord de l\'équateur et limite la zone chaude au nord', coul: '#c26a00' },
  { id: 'cap', nom: 'le tropique du Capricorne', lat: -23.44, def: 'est au sud de l\'équateur et limite la zone chaude au sud', coul: '#c26a00' },
  { id: 'cpn', nom: 'le cercle polaire arctique', lat: 66.56, def: 'limite la zone froide du Nord', coul: '#1f5fa8' },
  { id: 'cps', nom: 'le cercle polaire antarctique', lat: -66.56, def: 'limite la zone froide du Sud', coul: '#1f5fa8' },
  { id: 'gre', nom: 'le méridien de Greenwich', lon: 0, def: 'passe par Londres et partage la Terre en hémisphère Est et hémisphère Ouest', coul: '#5b6475' },
];
const cheminP = (pts) => `M${pts.map(([lo, la]) => `${r1(PX(lo))} ${r1(PY(la))}`).join('L')}Z`;
const FOND_PLANISPHERE = (() => {
  const s = [];
  s.push('<rect x="0" y="6" width="400" height="200" fill="#d6ebf7" stroke="#1c2333" stroke-width="1"/>');
  s.push(`<path d="${TERRES.map(cheminP).join('')}" fill="#efe3c4" stroke="#1c2333" stroke-width="0.7" stroke-linejoin="round"/>`);
  s.push(`<path d="${MERS.map(cheminP).join('')}" fill="#d6ebf7" stroke="#1c2333" stroke-width="0.6"/>`);
  return s.join('');
})();

// cibles = [{ cat: 'cont' | 'ocean' | 'ligne', obj, lettre, pos? }]
function svgPlanisphere(cibles) {
  const s = [svgOuvrir(400, 214), FOND_PLANISPHERE];
  for (const c of cibles.filter((x) => x.cat === 'ligne')) {
    const l = c.obj;
    if (l.lon !== undefined) s.push(`<line x1="${r1(PX(l.lon))}" y1="6" x2="${r1(PX(l.lon))}" y2="206" stroke="${l.coul}" stroke-width="1.6" stroke-dasharray="6 3"/>`);
    else s.push(`<line x1="0" y1="${r1(PY(l.lat))}" x2="400" y2="${r1(PY(l.lat))}" stroke="${l.coul}" stroke-width="${l.id === 'equ' ? 2 : 1.6}" stroke-dasharray="${l.id === 'equ' ? '' : '6 3'}"/>`);
  }
  for (const c of cibles) {
    if (c.cat === 'ligne') {
      const l = c.obj;
      s.push(l.lon !== undefined ? pastille(PX(l.lon), PY(-48), c.lettre) : pastille(13, PY(l.lat), c.lettre));
    } else s.push(pastille(PX(c.pos[0]), PY(c.pos[1]), c.lettre));
  }
  s.push('</svg>');
  return s.join('');
}

const NOMS_LIGNES_EXPL = 'Repères : l\'équateur (0°) partage la Terre en hémisphère Nord et hémisphère Sud ; le tropique du Cancer est au nord de l\'équateur, le tropique du Capricorne au sud ; les cercles polaires (arctique au nord, antarctique au sud) entourent les zones froides.';
const QUESTIONS_GLOBE_SANS_CARTE = [
  { q: 'Quelle ligne imaginaire partage la Terre en hémisphère Nord et hémisphère Sud ?', ok: 'L\'équateur',
    ko: ['Le tropique du Cancer', 'Le tropique du Capricorne', 'Le cercle polaire arctique', 'Le méridien de Greenwich'],
    expl: 'L\'équateur (latitude 0°) fait le tour de la Terre à égale distance des deux pôles : il la partage en hémisphère Nord et hémisphère Sud.' },
  { q: 'Entre quelles lignes se trouve la zone chaude de la Terre ?', ok: 'Entre le tropique du Cancer et le tropique du Capricorne',
    ko: ['Entre l\'équateur et le cercle polaire arctique', 'Entre les deux cercles polaires', 'Entre le cercle polaire arctique et le pôle Nord'],
    expl: 'La zone chaude s\'étend de part et d\'autre de l\'équateur, entre le tropique du Cancer (au nord) et le tropique du Capricorne (au sud).' },
  { q: 'Quel tropique se trouve dans l\'hémisphère Sud ?', ok: 'Le tropique du Capricorne',
    ko: ['Le tropique du Cancer', 'Le cercle polaire arctique', 'L\'équateur'],
    expl: 'Le tropique du Capricorne est au sud de l\'équateur ; le tropique du Cancer est au nord.' },
  { q: 'Quel tropique se trouve dans l\'hémisphère Nord ?', ok: 'Le tropique du Cancer',
    ko: ['Le tropique du Capricorne', 'Le cercle polaire antarctique', 'L\'équateur'],
    expl: 'Le tropique du Cancer est au nord de l\'équateur (il traverse le Sahara et le Mexique) ; le tropique du Capricorne est au sud.' },
  { q: 'Quelle ligne entoure la zone froide autour du pôle Nord ?', ok: 'Le cercle polaire arctique',
    ko: ['Le cercle polaire antarctique', 'Le tropique du Cancer', 'L\'équateur'],
    expl: 'Au nord du cercle polaire arctique, c\'est la zone froide du Nord, autour du pôle Nord et de l\'océan Arctique.' },
  { q: 'Combien de continents compte-t-on sur la Terre ?', ok: '6 : Europe, Asie, Afrique, Amérique, Océanie et Antarctique',
    ko: ['4 : Europe, Asie, Afrique et Amérique', '5 : Europe, Asie, Afrique, Amérique et Océanie', '7 : Europe, Asie, Afrique, Amérique, Océanie, Antarctique et Groenland'],
    expl: 'On compte 6 continents : l\'Europe, l\'Asie, l\'Afrique, l\'Amérique (du Nord et du Sud), l\'Océanie et l\'Antarctique. Le Groenland est une île.' },
  { q: 'Quels sont les deux océans qui entourent les pôles ?', ok: 'L\'océan Arctique (au nord) et l\'océan Austral (au sud)',
    ko: ['L\'océan Atlantique et l\'océan Pacifique', 'L\'océan Indien et l\'océan Arctique', 'L\'océan Pacifique et l\'océan Austral'],
    expl: 'L\'océan Arctique entoure le pôle Nord ; l\'océan Austral, aussi appelé océan Antarctique, entoure le continent Antarctique et le pôle Sud.' },
];

function nomCible(c) { return c.obj.nom; }
const CAT_TXT = { cont: 'continent', ocean: 'océan', ligne: 'ligne' };

const planisphere = famille('pl', [
  // Lettre → nom (continent, océan ou ligne)
  [6, (rng) => {
    const cibles = tirerCibles(rng);
    const c = rng.pick(cibles);
    const pool = c.cat === 'cont' ? CONTINENTS_P : c.cat === 'ocean' ? OCEANS_P : LIGNES_P;
    const q = qcm(rng, maj(c.obj.nom), pool.filter((x) => x !== c.obj).map((x) => maj(x.nom)));
    const quoi = c.cat === 'cont' ? 'Quel continent' : c.cat === 'ocean' ? 'Quel océan' : 'Quelle ligne';
    return {
      ...q, figure: svgPlanisphere(cibles),
      enonce: `Observe ce planisphère. ${quoi} est ${c.cat === 'ligne' ? 'désignée' : 'désigné'} par la lettre ${c.lettre} ?`,
      explication: `La lettre ${c.lettre} désigne ${c.obj.nom}${c.cat === 'ligne' ? `, qui ${c.obj.def}` : ''}. ${c.cat === 'ligne' ? NOMS_LIGNES_EXPL : c.cat === 'ocean' ? 'Les 5 océans : Pacifique (le plus grand), Atlantique, Indien, Arctique (autour du pôle Nord) et Austral, aussi appelé océan Antarctique (autour de l\'Antarctique).' : 'Les 6 continents : Europe, Asie, Afrique, Amérique (du Nord et du Sud), Océanie et Antarctique.'}`,
      _signature: `nom|${sigCibles(cibles)}|${c.lettre}|${cle(q.choix)}`,
      cleContenu: `nom|${sigCibles(cibles)}|${c.lettre}`,
      difficulte: c.cat === 'ligne' ? 2 : 1,
    };
  }],
  // Nom → lettre
  [4, (rng) => {
    const cibles = tirerCibles(rng);
    const c = rng.pick(cibles);
    const choix = cibles.map((x) => x.lettre).sort();
    return {
      type: 'qcm', choix, reponse: choix.indexOf(c.lettre), figure: svgPlanisphere(cibles),
      enonce: `Observe ce planisphère. Quelle lettre désigne ${c.obj.court ?? c.obj.nom} ?`,
      explication: `${maj(c.obj.nom)} : lettre ${c.lettre}. ${cibles.filter((x) => x !== c).map((x) => `${x.lettre} = ${x.obj.court ?? x.obj.nom}`).join(' ; ')}.`,
      _signature: `let|${sigCibles(cibles)}|${c.obj.id}`,
      cleContenu: `let|${sigCibles(cibles)}|${c.obj.id}`,
      difficulte: c.cat === 'ligne' ? 2 : 1,
    };
  }],
  // Grille : chaque lettre → son nom (une seule catégorie)
  [3, (rng) => {
    const cat = rng.pick(['cont', 'cont', 'ocean', 'ligne']);
    const pool = cat === 'cont' ? CONTINENTS_P : cat === 'ocean' ? OCEANS_P : LIGNES_P.filter((l) => l.id !== 'gre');
    const k = Math.min(pool.length, rng.int(3, 4));
    const objs = rng.shuffle(pool).slice(0, k);
    const lettres = rng.shuffle(LETTRES).slice(0, k).sort();
    const cibles = objs.map((obj, i) => ({ cat, obj, lettre: lettres[i], pos: obj.pos ? rng.pick(obj.pos) : null }));
    const colonnes = rng.shuffle(objs);
    const items = cibles.map((c) => ({ t: `Lettre ${c.lettre}`, c: colonnes.indexOf(c.obj) }));
    return {
      ...grilleQ(items, colonnes.map((o) => maj(o.court ?? o.nom))),
      figure: svgPlanisphere(cibles),
      enonce: `Observe ce planisphère. Associe chaque lettre ${cat === 'cont' ? 'au continent' : cat === 'ocean' ? 'à l\'océan' : 'à la ligne'} qu'elle désigne.`,
      explication: `${cibles.map((c) => `${c.lettre} : ${c.obj.court ?? c.obj.nom}`).join(' ; ')}.${cat === 'ligne' ? ` ${NOMS_LIGNES_EXPL}` : ''}`,
      _signature: `gr|${sigCibles(cibles)}|${colonnes.map((o) => o.id).join(',')}`,
      cleContenu: `gr|${sigCibles(cibles)}`,
      difficulte: 2,
    };
  }],
  // Vrai ou faux sur la carte
  [2, (rng) => {
    const cibles = tirerCibles(rng);
    const c = rng.pick(cibles);
    const vrai = rng.next() < 0.5;
    const pool = c.cat === 'cont' ? CONTINENTS_P : c.cat === 'ocean' ? OCEANS_P : LIGNES_P;
    const affirme = vrai ? c.obj : rng.pick(pool.filter((x) => x !== c.obj));
    return {
      type: 'vrai_faux', figure: svgPlanisphere(cibles),
      enonce: `Observe ce planisphère. Vrai ou faux ? La lettre ${c.lettre} désigne ${affirme.court ?? affirme.nom}.`,
      reponse: vrai,
      explication: `La lettre ${c.lettre} désigne ${c.obj.nom}${c.cat === 'ligne' ? `, qui ${c.obj.def}` : ''}.`,
      _signature: `vf|${sigCibles(cibles)}|${c.lettre}|${affirme.id}`,
      cleContenu: `vf|${sigCibles(cibles)}|${c.lettre}|${affirme.id}`,
      difficulte: 1,
    };
  }],
  // Hémisphère d'un repère (lettre sur un continent entièrement d'un côté de l'équateur)
  [2, (rng) => {
    // Seulement des continents entièrement d'un côté de l'équateur (l'Asie et l'Océanie ont des îles des deux côtés).
    const cont = rng.pick(CONTINENTS_P.filter((x) => ['eur', 'amn', 'ant'].includes(x.id)));
    const autres = tirerCibles(rng, 2).filter((x) => x.obj !== cont && x.cat !== 'cont');
    const lettre = rng.pick(LETTRES.filter((l) => !autres.some((x) => x.lettre === l)));
    const c = { cat: 'cont', obj: cont, lettre, pos: rng.pick(cont.pos) };
    const equ = { cat: 'ligne', obj: LIGNES_P[0], lettre: rng.pick(LETTRES.filter((l) => l !== lettre && !autres.some((x) => x.lettre === l))) };
    const cibles = [c, equ, ...autres.filter((x) => x.obj.id !== 'equ')];
    const nord = cont.id !== 'ant';
    const choix = ['Dans l\'hémisphère Nord', 'Dans l\'hémisphère Sud'];
    return {
      type: 'qcm', choix, reponse: nord ? 0 : 1, figure: svgPlanisphere(cibles),
      enonce: `Observe ce planisphère. La lettre ${equ.lettre} désigne l'équateur. Dans quel hémisphère se trouve le continent désigné par la lettre ${lettre} ?`,
      explication: `La lettre ${lettre} désigne ${cont.nom}. Ce continent est ${nord ? 'au nord' : 'au sud'} de l'équateur : dans l'hémisphère ${nord ? 'Nord' : 'Sud'}. (L'Afrique et l'Amérique du Sud, elles, sont traversées par l'équateur : elles sont en partie dans chaque hémisphère.)`,
      _signature: `hem|${sigCibles(cibles)}`,
      cleContenu: `hem|${sigCibles(cibles)}`,
      difficulte: 2,
    };
  }],
  [2, (rng) => ({ ...depuisBanque(rng, QUESTIONS_GLOBE_SANS_CARTE, 'gl'), difficulte: 2 })],
]);

// 3 à 5 repères de catégories mêlées, lettres distinctes, sans deux repères au même endroit.
function tirerCibles(rng, k = rng.int(3, 5)) {
  const objs = [];
  const pool = rng.shuffle([
    ...CONTINENTS_P.map((obj) => ({ cat: 'cont', obj })),
    ...OCEANS_P.map((obj) => ({ cat: 'ocean', obj })),
    ...LIGNES_P.map((obj) => ({ cat: 'ligne', obj })),
  ]);
  let lignes = 0;
  for (const x of pool) {
    if (x.cat === 'ligne' && lignes >= 2) continue;
    if (x.cat === 'ligne') lignes++;
    objs.push(x);
    if (objs.length === k) break;
  }
  const lettres = rng.shuffle(LETTRES).slice(0, k);
  return objs.map((x, i) => ({ ...x, lettre: lettres[i], pos: x.obj.pos ? rng.pick(x.obj.pos) : null }));
}
const sigCibles = (cibles) => cibles.map((c) => `${c.lettre}${c.obj.id}${c.pos ? c.pos.join('/') : ''}`).sort().join(',');

// =====================================================================================
// 9. Millénaires, siècles, an 1 (frise graduée en millénaires, durées)
// =====================================================================================
// Une année est un entier non nul : négatif = avant J.-C. (il n'y a pas d'an 0).
const anTxt = (y) => (y < 0 ? `${-y} av. J.-C.` : y === 1 ? 'l\'an 1' : String(y));
const anTxtC = (y) => (y < 0 ? `${-y} av. J.-C.` : y === 1 ? 'an 1' : String(y));
const rangDe = (y) => Math.floor((Math.abs(y) - 1) / 1000) + 1; // millénaire (dans son ère)
const rangSiecle = (y) => Math.floor((Math.abs(y) - 1) / 100) + 1;
const ordR = (k) => (k === 1 ? 'Ier' : `${romain(k)}e`);
const nomMil = (k, av) => `${ordR(k)} millénaire ${av ? 'av.' : 'apr.'} J.-C.`;
const nomSie = (k, av) => `${ordR(k)} siècle ${av ? 'av.' : 'apr.'} J.-C.`;
const bornesMil = (k, av) => (av ? `de ${k * 1000} av. J.-C. à ${(k - 1) * 1000 + 1} av. J.-C.` : `de ${k === 1 ? 'l\'an 1' : (k - 1) * 1000 + 1} à ${k * 1000}`);
const bornesSie = (k, av) => (av ? `de ${k * 100} av. J.-C. à ${(k - 1) * 100 + 1} av. J.-C.` : `de ${k === 1 ? 'l\'an 1' : (k - 1) * 100 + 1} à ${k * 100}`);

// Première ou dernière année d'un siècle (p = 100) ou d'un millénaire (p = 1000), sinon ''.
// Avant J.-C., on compte à rebours : 1000 av. J.-C. ouvre le Ier millénaire av. J.-C., 1001 av. J.-C. clôt le IIe.
function extremite(y, p) {
  const a = Math.abs(y);
  if (a % p === 0) return y < 0 ? 'première' : 'dernière';
  if (a % p === 1) return y < 0 ? 'dernière' : 'première';
  return '';
}
function tirerAnnee(rng) {
  const r = rng.next();
  if (r < 0.12) return rng.pick([1000, 2000, 1001, 2001, 1, 100, 101, 1900, 1901]);
  if (r < 0.62) return rng.int(2, 2026);
  if (r < 0.7) return -rng.pick([1000, 2000, 3000, 1001, 2001, 3001, 100, 101, 1]);
  return -rng.int(2, 5000);
}

// Frise de 4000 av. J.-C. à 2000, graduée en millénaires (55 unités par millénaire).
const FX = (y) => 34 + ((y < 0 ? y : y - 1) + 4000) * 0.055;
function svgFrise(reperes) {
  const s = [svgOuvrir(400, 128)];
  s.push('<line x1="24" y1="70" x2="386" y2="70" stroke="#1c2333" stroke-width="2"/><path d="M394 70 L384 65 L384 75 Z" fill="#1c2333"/>');
  for (let k = 0; k <= 6; k++) {
    const x = 34 + k * 55; const y = k < 4 ? -(4 - k) * 1000 : k === 4 ? 1 : (k - 4) * 1000;
    s.push(`<line x1="${x}" y1="62" x2="${x}" y2="78" stroke="#1c2333" stroke-width="2"/>`);
    if (y < 0) s.push(`<text x="${x}" y="94" font-size="12" text-anchor="middle" fill="#1c2333">${-y}</text><text x="${x}" y="108" font-size="12" text-anchor="middle" fill="#1c2333">av. J.-C.</text>`);
    else s.push(`<text x="${x}" y="94" font-size="12" font-weight="${y === 1 ? 'bold' : 'normal'}" text-anchor="middle" fill="#1c2333">${y === 1 ? 'an 1' : y}</text>`);
  }
  for (const r of reperes) {
    const x = r1(r.x);
    s.push(`<line x1="${x}" y1="44" x2="${x}" y2="70" stroke="#b3261e" stroke-width="1.8"/><circle cx="${x}" cy="70" r="3.2" fill="#b3261e"/>`);
    s.push(pastille(x, 32, r.lettre));
  }
  s.push('</svg>');
  return s.join('');
}
const MIL_FRISE = [
  { k: 4, av: true }, { k: 3, av: true }, { k: 2, av: true }, { k: 1, av: true }, { k: 1, av: false }, { k: 2, av: false },
];
const GRAD_FRISE = [-4000, -3000, -2000, -1000, 1, 1000, 2000];
const FAITS_FRISE = [
  { t: 'L\'invention de l\'écriture (vers 3500 av. J.-C.)', y: -3500 },
  { t: 'Le début de l\'ère chrétienne (an 1)', y: 1 },
  { t: 'La chute de l\'Empire romain d\'Occident (476)', y: 476 },
  { t: 'L\'arrivée de Christophe Colomb aux Amériques (1492)', y: 1492, groupe: 'tard' },
  { t: 'La Révolution française (1789)', y: 1789, groupe: 'tard' },
];
const AN1 = [
  { q: 'Quelle année vient juste après l\'an 1 av. J.-C. ?', ok: 'L\'an 1 apr. J.-C.', ko: ['L\'an 0', 'L\'an 2 av. J.-C.', 'L\'an 2 apr. J.-C.'],
    expl: 'Il n\'y a pas d\'an 0 : on passe directement de l\'an 1 av. J.-C. à l\'an 1 apr. J.-C.' },
  { q: 'Que marque l\'an 1 dans notre calendrier ?', ok: 'Le début de l\'ère chrétienne, du Ier siècle et du Ier millénaire apr. J.-C.',
    ko: ['La fin de la Préhistoire', 'La chute de l\'Empire romain d\'Occident', 'Le début du Moyen Âge'],
    expl: 'L\'an 1 est le début de l\'ère chrétienne : c\'est la première année du Ier siècle et du Ier millénaire après J.-C. La Préhistoire se termine vers 3500 av. J.-C., le Moyen Âge commence en 476.' },
  { q: 'L\'an 1 est la première année de quel siècle ?', ok: 'Du Ier siècle apr. J.-C.', ko: ['Du Ier siècle av. J.-C.', 'Du IIe siècle apr. J.-C.', 'Du siècle 0'],
    expl: 'Le Ier siècle apr. J.-C. va de l\'an 1 à l\'an 100. Il n\'y a ni an 0 ni siècle 0.' },
  { q: 'L\'an 1 est la première année de quel millénaire ?', ok: 'Du Ier millénaire apr. J.-C.', ko: ['Du Ier millénaire av. J.-C.', 'Du IIe millénaire apr. J.-C.', 'Du millénaire 0'],
    expl: 'Le Ier millénaire apr. J.-C. va de l\'an 1 à l\'an 1000.' },
  { q: 'Quelle est la dernière année du Ier siècle av. J.-C. ?', ok: 'L\'an 1 av. J.-C.', ko: ['L\'an 0', 'L\'an 100 av. J.-C.', 'L\'an 1 apr. J.-C.'],
    expl: 'Le Ier siècle av. J.-C. va de 100 av. J.-C. à 1 av. J.-C. (avant J.-C., on compte à rebours). L\'année suivante est l\'an 1 apr. J.-C.' },
  { q: 'Pendant quelle période conventionnelle se situe l\'an 1 ?', ok: 'L\'Antiquité', ko: ['La Préhistoire', 'Le Moyen Âge', 'Les Temps modernes'],
    expl: 'L\'Antiquité va de l\'invention de l\'écriture (vers 3500 av. J.-C.) à la chute de l\'Empire romain d\'Occident (476) : l\'an 1 est en pleine Antiquité.' },
];
const VF_AN1 = [
  { t: 'Dans notre calendrier, l\'an 0 n\'existe pas.', v: true, expl: 'On passe directement de l\'an 1 av. J.-C. à l\'an 1 apr. J.-C.' },
  { t: 'Un millénaire dure 1 000 ans, soit 10 siècles.', v: true, expl: '1 siècle = 100 ans ; 1 millénaire = 1 000 ans = 10 siècles.' },
  { t: 'Un millénaire dure 100 ans.', v: false, expl: 'C\'est un siècle qui dure 100 ans. Un millénaire dure 1 000 ans (10 siècles).' },
  { t: 'L\'an 2000 est la dernière année du IIe millénaire.', v: true, expl: 'Le IIe millénaire va de 1001 à 2000 ; le IIIe millénaire a commencé le 1er janvier 2001.' },
  { t: 'L\'an 2000 est la première année du IIIe millénaire.', v: false, expl: 'Le IIIe millénaire commence en 2001. L\'an 2000 est la dernière année du IIe millénaire (1001-2000).' },
  { t: 'Avant J.-C., plus le nombre de l\'année est grand, plus l\'année est ancienne.', v: true, expl: 'Avant J.-C., on compte à rebours : 3000 av. J.-C. est plus ancien que 500 av. J.-C.' },
  { t: 'L\'an 1 marque le début de l\'ère chrétienne.', v: true, expl: 'Notre calendrier compte les années à partir de l\'an 1, début de l\'ère chrétienne.' },
  { t: 'Le IVe millénaire av. J.-C. est plus récent que le IIe millénaire av. J.-C.', v: false, expl: 'Avant J.-C., on compte à rebours : le IVe millénaire av. J.-C. (4000 à 3001 av. J.-C.) est plus ancien que le IIe (2000 à 1001 av. J.-C.).' },
];

function choixVoisins(rng, bonneK, bonneAv, nomF, maxK) {
  const cands = [[bonneK - 1, bonneAv], [bonneK + 1, bonneAv], [bonneK, !bonneAv], [bonneK + 2, bonneAv], [bonneK - 2, bonneAv]]
    .filter(([k, av]) => k >= 1 && k <= (av ? maxK : bonneAv ? maxK : Math.max(maxK, bonneK + 2)));
  const faux = rng.shuffle(cands).slice(0, 3).map(([k, av]) => nomF(k, av));
  const bonne = nomF(bonneK, bonneAv);
  const choix = rng.shuffle([bonne, ...faux.filter((f) => f !== bonne)]);
  return { type: 'qcm', choix, reponse: choix.indexOf(bonne) };
}

const millenaires = famille('mil', [
  // Année → millénaire
  [4, (rng) => {
    const y = tirerAnnee(rng); const av = y < 0; const k = rangDe(y);
    const q = choixVoisins(rng, k, av, nomMil, av ? 5 : 3);
    const piege = extremite(y, 1000);
    return {
      ...q,
      enonce: `Dans quel millénaire se situe l'année ${anTxtC(y)} ?`,
      explication: `Le ${nomMil(k, av)} va ${bornesMil(k, av)}${av ? ' (avant J.-C., on compte à rebours)' : ''}.${piege ? ` Attention : ${anTxtC(y)} est la ${piege} année de ce millénaire.` : ''}${y === 1 ? ' L\'an 1 est le début de l\'ère chrétienne.' : ''}`,
      _signature: `ym|${y}|${cle(q.choix)}`, cleContenu: `ym|${y}`,
      difficulte: av || piege ? 3 : 2,
    };
  }],
  // Année → siècle (aussi avant J.-C.)
  [3, (rng) => {
    let y = tirerAnnee(rng); if (y < 0 && rng.next() < 0.5) y = -rng.int(1, 999);
    const av = y < 0; const k = rangSiecle(y);
    const q = choixVoisins(rng, k, av, nomSie, av ? 50 : 21);
    const piege = extremite(y, 100);
    return {
      ...q,
      enonce: `Dans quel siècle se situe l'année ${anTxtC(y)} ?`,
      explication: `Le ${nomSie(k, av)} va ${bornesSie(k, av)}${av ? ' (avant J.-C., on compte à rebours)' : ''}.${piege ? ` Attention : ${anTxtC(y)} est la ${piege} année de ce siècle.` : ''}`,
      _signature: `ys|${y}|${cle(q.choix)}`, cleContenu: `ys|${y}`,
      difficulte: av || piege ? 3 : 2,
    };
  }],
  // Millénaire → bornes
  [2, (rng) => {
    const av = rng.next() < 0.4; const k = av ? rng.int(1, 5) : rng.int(1, 3);
    const bonne = maj(bornesMil(k, av));
    const faux = av
      ? [`De ${(k - 1) * 1000 + 1} av. J.-C. à ${k * 1000} av. J.-C.`, `De ${(k + 1) * 1000} av. J.-C. à ${k * 1000 + 1} av. J.-C.`,
        k > 1 ? `De ${k * 1000 - 1} av. J.-C. à ${(k - 1) * 1000} av. J.-C.` : 'De 1000 av. J.-C. à l\'an 1000 apr. J.-C.']
      : k === 1
        ? ['De 1 à 999', 'De 1001 à 2000', 'De 100 à 1000']
        : [`De ${(k - 1) * 1000} à ${k * 1000 - 1}`, `De ${k * 1000 + 1} à ${(k + 1) * 1000}`, `De ${(k - 2) * 1000 + 1 === 1 ? 'l\'an 1' : (k - 2) * 1000 + 1} à ${(k - 1) * 1000}`];
    const q = qcm(rng, bonne, faux);
    return {
      ...q,
      enonce: `Quelles sont la première et la dernière année du ${nomMil(k, av)} ?`,
      explication: `Le ${nomMil(k, av)} va ${bornesMil(k, av)}. Un millénaire compte 1 000 ans et, comme il n'y a pas d'an 0, ${av ? 'il se termine par une année en « 001 » avant J.-C.' : 'il commence par une année en « 001 » (ou l\'an 1) et se termine par une année en « 000 ».'}`,
      _signature: `bo|${k}|${av}|${cle(q.choix)}`, cleContenu: `bo|${k}|${av}`,
      difficulte: 2,
    };
  }],
  // Durées : millénaires, siècles, années
  [3, (rng) => {
    const sorte = rng.int(0, 3);
    if (sorte < 3) {
      const nm = rng.int(2, 9);
      const [enonce, reponse, expl] = [
        [`Combien d'années y a-t-il dans ${nm} millénaires ?`, nm * 1000, `1 millénaire = 1 000 ans, donc ${nm} millénaires = ${n(nm * 1000)} ans.`],
        [`Combien de siècles y a-t-il dans ${nm} millénaires ?`, nm * 10, `1 millénaire = 10 siècles, donc ${nm} millénaires = ${nm * 10} siècles.`],
        [`${nm * 10} siècles, cela fait combien de millénaires ?`, nm, `10 siècles = 1 millénaire, donc ${nm * 10} siècles = ${nm} millénaires.`],
      ][sorte];
      return { type: 'numerique', reponse, unite: sorte === 0 ? 'ans' : sorte === 1 ? 'siècles' : 'millénaires', enonce, explication: expl, _signature: `du|${sorte}|${nm}`, difficulte: 1 };
    }
    // Comparer trois durées
    for (let e = 0; e < 20; e++) {
      const d = [{ v: rng.int(1, 4) * 1000, t: null }, { v: rng.int(5, 39) * 100, t: null }, { v: rng.int(4, 45) * 100 + rng.pick([0, 50]), t: null }];
      d[0].t = `${d[0].v / 1000} millénaire${d[0].v > 1000 ? 's' : ''}`;
      d[1].t = `${d[1].v / 100} siècles`;
      d[2].t = `${n(d[2].v)} ans`;
      if (new Set(d.map((x) => x.v)).size < 3) continue;
      const vs = d.map((x) => x.v).sort((a, b) => a - b);
      if (vs[2] - vs[1] < 200) continue;
      const max = d.find((x) => x.v === vs[2]);
      const q = qcm(rng, max.t, d.map((x) => x.t), 2);
      return {
        ...q,
        enonce: 'Quelle est la durée la plus longue ?',
        explication: `On convertit tout en années : ${d.map((x) => `${x.t} = ${n(x.v)} ans`).join(' ; ')}. La plus longue : ${max.t}.`,
        _signature: `cmp|${d.map((x) => x.v).join(',')}|${cle(q.choix)}`, cleContenu: `cmp|${d.map((x) => x.v).sort().join(',')}`,
        difficulte: 2,
      };
    }
    return null;
  }],
  // L'an 1
  [2, (rng) => (rng.next() < 0.55 ? { ...depuisBanque(rng, AN1, 'an1'), difficulte: 2 } : { ...depuisVF(rng, VF_AN1, 'vfan1'), difficulte: 2 })],
  // Calcul de durée à cheval sur l'an 1 (au 1er janvier : pas d'an 0)
  [2, (rng) => {
    const a = rng.int(2, 60); const b = rng.int(2, 60);
    const d = a + b - 1;
    if (rng.next() < 0.5) {
      return {
        type: 'numerique', reponse: d, unite: 'ans',
        enonce: `Combien d'années se sont écoulées entre le 1er janvier de l'an ${a} av. J.-C. et le 1er janvier de l'an ${b} apr. J.-C. ?`,
        explication: `Du 1er janvier ${a} av. J.-C. au 1er janvier de l'an 1 apr. J.-C. : ${a} ans. Du 1er janvier de l'an 1 au 1er janvier ${b} : ${b - 1} ans. Total : ${a} + ${b - 1} = ${d} ans. Il n'y a pas d'an 0, c'est pourquoi on n'obtient pas ${a} + ${b} = ${a + b}.`,
        _signature: `jc|${a}|${b}`, difficulte: 3,
      };
    }
    const age = d;
    const bonne = `Le 1er janvier de l'an ${b} apr. J.-C.`;
    const q = qcm(rng, bonne, [`Le 1er janvier de l'an ${b - 1 === 1 ? '1' : b - 1} apr. J.-C.`, `Le 1er janvier de l'an ${b + 1} apr. J.-C.`, `Le 1er janvier de l'an ${b} av. J.-C.`]);
    return {
      ...q,
      enonce: `Un olivier est planté le 1er janvier de l'an ${a} av. J.-C. À quelle date a-t-il exactement ${age} ans ?`,
      explication: `Du 1er janvier ${a} av. J.-C. au 1er janvier de l'an 1 apr. J.-C., il s'écoule ${a} ans. Il reste ${age} − ${a} = ${age - a} ans à compter à partir de l'an 1 : on arrive au 1er janvier de l'an ${b}. Il n'y a pas d'an 0.`,
      _signature: `age|${a}|${b}|${cle(q.choix)}`, cleContenu: `age|${a}|${b}`, difficulte: 3,
    };
  }],
  // Frise : repère → millénaire
  [3, (rng) => {
    const k = rng.int(2, 3);
    const segs = rng.shuffle(MIL_FRISE).slice(0, k);
    const lettres = rng.shuffle(LETTRES).slice(0, k);
    const reperes = segs.map((m, i) => {
      const deb = m.av ? -m.k * 1000 : (m.k - 1) * 1000 + 1;
      const y = deb + rng.int(250, 750);
      return { ...m, y, x: FX(y), lettre: lettres[i] };
    });
    const c = rng.pick(reperes);
    const q = choixVoisins(rng, c.k, c.av, nomMil, 4);
    return {
      ...q, figure: svgFrise(reperes),
      enonce: `Observe cette frise graduée en millénaires. Dans quel millénaire se trouve le repère ${c.lettre} ?`,
      explication: `Le repère ${c.lettre} est entre ${c.av ? `${c.k * 1000} av. J.-C. et ${c.k === 1 ? 'l\'an 1' : `${(c.k - 1) * 1000} av. J.-C.`}` : `${c.k === 1 ? 'l\'an 1' : (c.k - 1) * 1000} et ${c.k * 1000}`} : c'est le ${nomMil(c.k, c.av)}. Chaque intervalle de la frise représente un millénaire (1 000 ans).`,
      _signature: `fr|${reperes.map((r) => `${r.lettre}${r.y}`).join(',')}|${c.lettre}|${cle(q.choix)}`,
      cleContenu: `fr|${reperes.map((r) => `${r.lettre}${r.y}`).join(',')}|${c.lettre}`,
      difficulte: 2,
    };
  }],
  // Frise : repère sur une graduation → date
  [2, (rng) => {
    const g = rng.pick(GRAD_FRISE.slice(1, 6));
    const lettre = rng.pick(LETTRES);
    const choix = rng.shuffle([g, ...rng.shuffle(GRAD_FRISE.filter((x) => x !== g)).slice(0, 3)]).map((y) => maj(anTxtC(y)));
    const bonne = maj(anTxtC(g));
    return {
      type: 'qcm', choix, reponse: choix.indexOf(bonne), figure: svgFrise([{ x: FX(g === 1 ? 1 : g), lettre }]),
      enonce: `Observe cette frise graduée en millénaires. Le repère ${lettre} est placé sur une graduation. Quelle date indique-t-il ?`,
      explication: `Les graduations sont espacées de 1 000 ans. Le repère ${lettre} est sur la graduation ${anTxtC(g)}.${g === 1 ? ' L\'an 1 sépare les années avant J.-C. (à gauche) des années après J.-C. (à droite).' : ''}`,
      _signature: `grad|${g}|${lettre}|${cle(choix)}`, cleContenu: `grad|${g}|${lettre}`,
      difficulte: 1,
    };
  }],
  // Frise : fait marquant placé
  [2, (rng) => {
    const tard = rng.pick(FAITS_FRISE.filter((f) => f.groupe));
    const pool = FAITS_FRISE.filter((f) => !f.groupe || f === tard);
    const k = rng.int(2, 3);
    const places = rng.shuffle(pool).slice(0, k);
    const lettres = rng.shuffle(LETTRES).slice(0, k);
    const reperes = places.map((f, i) => ({ ...f, x: FX(f.y), lettre: lettres[i] }));
    const c = rng.pick(reperes);
    const q = qcm(rng, c.t, pool.map((f) => f.t));
    return {
      ...q, figure: svgFrise(reperes),
      enonce: `Observe cette frise graduée en millénaires. Quel fait marquant est placé au repère ${c.lettre} ?`,
      explication: `Le repère ${c.lettre} est placé en ${anTxtC(c.y).replace(/^an 1$/, 'l\'an 1')}. ${reperes.filter((x) => x !== c).map((x) => `Repère ${x.lettre} : ${leLa(x.t)}`).join(' ; ')}${reperes.length > 1 ? '.' : ''}`.trim(),
      _signature: `fm|${reperes.map((r) => `${r.lettre}${r.y}`).join(',')}|${c.lettre}|${cle(q.choix)}`,
      cleContenu: `fm|${reperes.map((r) => `${r.lettre}${r.y}`).join(',')}|${c.lettre}`,
      difficulte: 2,
    };
  }],
  // Ordre chronologique de dates mêlées (av. / apr. J.-C.)
  [2, (rng) => {
    const ys = [];
    for (let e = 0; e < 40 && ys.length < 4; e++) {
      const y = rng.next() < 0.5 ? -rng.int(1, 40) * 50 : rng.int(1, 40) * 50;
      if (ys.every((z) => Math.abs(z - y) >= 100)) ys.push(y);
    }
    if (ys.length < 4 || ys.every((y) => y > 0) || ys.every((y) => y < 0)) return null;
    const o = ordreQ(rng, ys, (y) => y, (y) => anTxtC(y));
    return {
      ...o,
      enonce: 'Range ces années dans l\'ordre chronologique, de la plus ancienne à la plus récente.',
      explication: `Ordre : ${ys.slice().sort((a, b) => a - b).map(anTxtC).join(' → ')}. Avant J.-C., plus le nombre est grand, plus l'année est ancienne.`,
      _signature: `ord|${ys.slice().sort((a, b) => a - b).join(',')}`, cleContenu: `ord|${ys.slice().sort((a, b) => a - b).join(',')}`,
      difficulte: 2,
    };
  }],
]);

// =====================================================================================
// 10. Outils d'information : table des matières, index, moteur de recherche
// =====================================================================================
const PRENOMS_F = ['Léa', 'Chloé', 'Manon', 'Camille', 'Juliette', 'Mathilde', 'Pauline', 'Agathe', 'Amélie', 'Élise', 'Margaux', 'Clémence'];
const PRENOMS_G = ['Louis', 'Arthur', 'Jules', 'Victor', 'Antoine', 'Baptiste', 'Maxime', 'Romain', 'Mathis', 'Quentin', 'Étienne', 'Émile', 'Clément'];
const PRENOMS = [...PRENOMS_F, ...PRENOMS_G];
const LIVRES = [
  { titre: 'Histoire de nos régions', chap: [
    { t: 'La Préhistoire', mots: ['les outils en silex', 'les premiers agriculteurs de nos régions', 'les peintures dans les grottes'], idx: ['Silex', 'Grotte', 'Néolithique'] },
    { t: 'Les Gallo-Romains', mots: ['la conquête de nos régions par Jules César', 'les villas romaines', 'les chaussées romaines'], idx: ['César (Jules)', 'Villa romaine', 'Chaussée romaine'] },
    { t: 'Le Haut Moyen Âge : les Francs', mots: ['le baptême de Clovis', 'le couronnement de Charlemagne', 'les monastères de Nivelles et de Stavelot'], idx: ['Clovis', 'Charlemagne', 'Monastère'] },
    { t: 'Explorations et colonisations', mots: ['le voyage de Christophe Colomb en 1492', 'le commerce triangulaire', 'le tour du monde de Magellan'], idx: ['Colomb (Christophe)', 'Esclavage', 'Magellan (Fernand de)'] },
    { t: 'Les migrations après 1945', mots: ['la catastrophe du Bois du Cazier', 'l\'accord belgo-italien de 1946', 'l\'arrivée des travailleurs marocains et turcs'], idx: ['Bois du Cazier', 'Italie', 'Maroc'] },
  ] },
  { titre: 'Atlas du monde', chap: [
    { t: 'Continents et océans', mots: ['l\'océan Indien', 'la forme des continents', 'les noms des six continents'], idx: ['Océan', 'Équateur', 'Tropique'] },
    { t: 'Les climats de la Terre', mots: ['le climat méditerranéen', 'la saison sèche du climat tropical', 'la lecture d\'un climatogramme'], idx: ['Climatogramme', 'Méditerranéen (climat)', 'Tropical (climat)'] },
    { t: 'La population du monde', mots: ['la densité de population', 'les pays les plus peuplés', 'les grandes villes du monde'], idx: ['Densité', 'Inde', 'Ville'] },
    { t: 'Le réchauffement climatique', mots: ['la fonte de la banquise', 'les gaz à effet de serre', 'la montée du niveau des mers'], idx: ['Glacier', 'Effet de serre', 'Banquise'] },
    { t: 'Fleuves et montagnes', mots: ['le Nil et l\'Amazone', 'l\'Himalaya et l\'Everest', 'la chaîne des Andes'], idx: ['Nil', 'Himalaya', 'Andes'] },
  ] },
  { titre: 'La Belgique', chap: [
    { t: 'Régions et provinces', mots: ['le chef-lieu de chaque province', 'les trois Régions du pays', 'la frontière linguistique'], idx: ['Province', 'Région', 'Frontière linguistique'] },
    { t: 'Relief et cours d\'eau', mots: ['le plateau de l\'Ardenne', 'la Meuse et ses affluents', 'le point le plus haut du pays'], idx: ['Ardenne', 'Meuse', 'Signal de Botrange'] },
    { t: 'La population belge', mots: ['les villes les plus peuplées', 'le nombre d\'habitants par km² dans chaque province', 'le sillon Sambre-et-Meuse'], idx: ['Anvers', 'Densité', 'Sillon Sambre-et-Meuse'] },
    { t: 'Les transports', mots: ['le port d\'Anvers', 'le réseau des autoroutes', 'les canaux et les péniches'], idx: ['Port', 'Autoroute', 'Canal'] },
    { t: 'Le climat de la Belgique', mots: ['les pluies en Belgique', 'les températures en hiver', 'le climat tempéré océanique'], idx: ['Pluie', 'Hiver', 'Océanique (climat)'] },
  ] },
];
const triFr = (a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' });

function pagination(rng, nb) {
  const debuts = [rng.int(3, 7)];
  for (let i = 1; i <= nb; i++) debuts.push(debuts[i - 1] + rng.int(6, 19));
  return debuts; // nb débuts + la page qui suit le dernier chapitre
}
function svgTable(titre, chap, debuts) {
  const h = 58 + chap.length * 28;
  const s = [svgOuvrir(400, h)];
  s.push(`<rect x="8" y="6" width="384" height="${h - 12}" rx="6" fill="#fffdf6" stroke="#1c2333" stroke-width="1.2"/>`);
  s.push(`<text x="200" y="30" font-size="15" font-weight="bold" text-anchor="middle" fill="#1c2333">${esc(titre)} — Table des matières</text>`);
  chap.forEach((c, i) => {
    const y = 60 + i * 28;
    const lib = `${i + 1}. ${c.t}`;
    s.push(`<text x="22" y="${y}" font-size="13" fill="#1c2333">${esc(lib)}</text>`);
    s.push(`<line x1="${r1(26 + lib.length * 6.3)}" y1="${y - 3}" x2="352" y2="${y - 3}" stroke="#5b6475" stroke-width="1.2" stroke-dasharray="1.5 3.5"/>`);
    s.push(`<text x="378" y="${y}" font-size="13" font-weight="bold" text-anchor="end" fill="#1c2333">${debuts[i]}</text>`);
  });
  s.push('</svg>');
  return s.join('');
}
function svgIndex(titre, entrees) {
  const h = 56 + entrees.length * 24;
  const s = [svgOuvrir(400, h)];
  s.push(`<rect x="8" y="6" width="384" height="${h - 12}" rx="6" fill="#fffdf6" stroke="#1c2333" stroke-width="1.2"/>`);
  s.push(`<text x="200" y="30" font-size="15" font-weight="bold" text-anchor="middle" fill="#1c2333">${esc(titre)} — Index</text>`);
  entrees.forEach((e, i) => {
    const y = 58 + i * 24;
    s.push(`<text x="22" y="${y}" font-size="13" fill="#1c2333">${esc(e.mot)}</text>`);
    s.push(`<line x1="${r1(26 + e.mot.length * 6.3)}" y1="${y - 3}" x2="${r1(372 - e.pages.join(', ').length * 7)}" y2="${y - 3}" stroke="#5b6475" stroke-width="1.2" stroke-dasharray="1.5 3.5"/>`);
    s.push(`<text x="378" y="${y}" font-size="13" text-anchor="end" fill="#1c2333">${e.pages.join(', ')}</text>`);
  });
  s.push('</svg>');
  return s.join('');
}
// Entrées d'index cohérentes avec la pagination : chaque mot renvoie à des pages de son chapitre.
function entreesIndex(rng, livre, debuts) {
  const out = [];
  livre.chap.forEach((c, i) => {
    for (const mot of c.idx) {
      const a = debuts[i]; const b = debuts[i + 1] - 1;
      const p1 = rng.int(a, b);
      const pages = rng.next() < 0.35 ? [...new Set([p1, rng.int(a, b)])].sort((x, y) => x - y) : [p1];
      out.push({ mot, pages, chap: c });
    }
  });
  return out;
}

const OUTILS = [
  { q: 'Pour savoir rapidement à quelles pages un livre parle de Charlemagne, que consultes-tu ?', ok: 'L\'index, à la fin du livre',
    ko: ['La couverture', 'La première page du premier chapitre', 'La quatrième de couverture (le dos du livre)'],
    expl: 'L\'index est une liste alphabétique des mots importants avec les pages où on en parle. Il se trouve en général à la fin du livre.' },
  { q: 'Pour connaître les grandes parties (les chapitres) d\'un livre et leur page de début, que consultes-tu ?', ok: 'La table des matières',
    ko: ['L\'index', 'Un dictionnaire', 'La couverture'],
    expl: 'La table des matières donne la liste des chapitres dans l\'ordre du livre, avec la page où chacun commence.' },
  { q: 'Dans un index, comment les mots sont-ils rangés ?', ok: 'Par ordre alphabétique',
    ko: ['Dans l\'ordre des chapitres', 'Du plus court au plus long', 'Par ordre chronologique'],
    expl: 'Dans un index, les mots sont rangés par ordre alphabétique pour être retrouvés vite. C\'est la table des matières qui suit l\'ordre des chapitres.' },
  { q: 'Dans une table des matières, comment les chapitres sont-ils rangés ?', ok: 'Dans l\'ordre où ils apparaissent dans le livre',
    ko: ['Par ordre alphabétique', 'Du plus long au plus court', 'Au hasard'],
    expl: 'La table des matières suit l\'ordre du livre : les numéros de page augmentent d\'une ligne à l\'autre.' },
  { q: 'Quel ouvrage consultes-tu pour trouver une carte des climats du monde ?', ok: 'Un atlas',
    ko: ['Un dictionnaire', 'Un livre de recettes', 'Un roman'],
    expl: 'Un atlas est un livre de cartes : cartes du relief, des climats, de la population, des pays…' },
  { q: 'Quel ouvrage consultes-tu pour trouver le sens du mot « affluent » ?', ok: 'Un dictionnaire',
    ko: ['Un atlas', 'Un annuaire téléphonique', 'Un calendrier'],
    expl: 'Le dictionnaire donne la définition des mots, rangés par ordre alphabétique.' },
  { q: 'Où se trouve généralement la table des matières ?', ok: 'Au début ou à la fin du livre',
    ko: ['Au milieu du livre', 'Sur la couverture', 'Dans chaque chapitre'],
    expl: 'Selon les livres, la table des matières est placée au début ou à la fin. L\'index, lui, est en général à la fin.' },
];
const RECHERCHES = [
  { besoin: 'la date de la catastrophe du Bois du Cazier', ok: 'Bois du Cazier catastrophe date', ko: ['catastrophe', 'mine', 'histoire de la Belgique'] },
  { besoin: 'le nombre d\'habitants de la province de Namur', ok: 'population province de Namur', ko: ['Namur', 'province', 'habitants'] },
  { besoin: 'le climat de l\'Égypte', ok: 'climat Égypte', ko: ['Égypte', 'climat', 'pyramides Égypte'] },
  { besoin: 'les causes de la fonte des glaciers', ok: 'causes fonte des glaciers', ko: ['glace', 'montagne', 'eau'] },
  { besoin: 'l\'année du couronnement de Charlemagne', ok: 'Charlemagne couronnement année', ko: ['roi', 'empereur', 'Moyen Âge'] },
  { besoin: 'les produits que les Européens ont rapportés des Amériques', ok: 'produits rapportés des Amériques en Europe', ko: ['Amérique', 'produits', 'Europe'] },
  { besoin: 'la longueur du fleuve Amazone', ok: 'longueur fleuve Amazone', ko: ['fleuve', 'forêt amazonienne animaux', 'Brésil'] },
  { besoin: 'les pays d\'où venaient les travailleurs immigrés en Belgique après 1945', ok: 'pays d\'origine travailleurs immigrés Belgique après 1945', ko: ['travail', 'Belgique', 'pays du monde'] },
];

const outilsInfo = famille('oi', [
  // Table des matières : quel chapitre ?
  [5, (rng) => {
    const livre = rng.pick(LIVRES);
    const debuts = pagination(rng, livre.chap.length);
    const i = rng.int(0, livre.chap.length - 1);
    const mot = rng.pick(livre.chap[i].mots);
    const qui = rng.pick(PRENOMS);
    const choix = livre.chap.map((_, k) => `Page ${debuts[k]}`);
    return {
      type: 'qcm', choix, reponse: i, figure: svgTable(livre.titre, livre.chap, debuts),
      enonce: `${qui} cherche des informations sur ${mot}. Observe la table des matières : à quelle page commence le chapitre à lire ?`,
      explication: `${maj(mot)} : c'est le sujet du chapitre « ${livre.chap[i].t} », qui commence à la page ${debuts[i]}. La table des matières donne la page de début de chaque chapitre.`,
      _signature: `tm|${livre.titre}|${debuts.join(',')}|${mot}`,
      cleContenu: `tm|${livre.titre}|${debuts.join(',')}|${mot}`,
      difficulte: 2,
    };
  }],
  // Table des matières : dernière page d'un chapitre
  [3, (rng) => {
    const livre = rng.pick(LIVRES);
    const debuts = pagination(rng, livre.chap.length);
    const i = rng.int(0, livre.chap.length - 2);
    const fin = debuts[i + 1] - 1;
    if (rng.next() < 0.5) {
      return {
        type: 'numerique', reponse: fin, figure: svgTable(livre.titre, livre.chap, debuts),
        enonce: `Observe la table des matières. Quelle est la dernière page du chapitre « ${livre.chap[i].t} » ?`,
        explication: `Le chapitre « ${livre.chap[i].t} » commence à la page ${debuts[i]} et le chapitre suivant à la page ${debuts[i + 1]} : il se termine donc à la page ${debuts[i + 1]} − 1 = ${fin}.`,
        _signature: `fin|${livre.titre}|${debuts.join(',')}|${i}`, cleContenu: `fin|${livre.titre}|${debuts.join(',')}|${i}`,
        difficulte: 2,
      };
    }
    const nb = debuts[i + 1] - debuts[i];
    return {
      type: 'numerique', reponse: nb, unite: 'pages', figure: svgTable(livre.titre, livre.chap, debuts),
      enonce: `Observe la table des matières. Combien de pages compte le chapitre « ${livre.chap[i].t} » ?`,
      explication: `Il va de la page ${debuts[i]} à la page ${fin} (le chapitre suivant commence page ${debuts[i + 1]}) : ${debuts[i + 1]} − ${debuts[i]} = ${nb} pages.`,
      _signature: `nbp|${livre.titre}|${debuts.join(',')}|${i}`, cleContenu: `nbp|${livre.titre}|${debuts.join(',')}|${i}`,
      difficulte: 3,
    };
  }],
  // Table des matières : sur quel chapitre tombe une page ?
  [2, (rng) => {
    const livre = rng.pick(LIVRES);
    const debuts = pagination(rng, livre.chap.length);
    const i = rng.int(0, livre.chap.length - 2);
    const page = rng.int(debuts[i] + 1, debuts[i + 1] - 1);
    const choix = livre.chap.map((c) => c.t);
    return {
      type: 'qcm', choix, reponse: i, figure: svgTable(livre.titre, livre.chap, debuts),
      enonce: `Observe la table des matières. Le livre est ouvert à la page ${page}. Dans quel chapitre se trouve cette page ?`,
      explication: `Le chapitre « ${livre.chap[i].t} » commence à la page ${debuts[i]} et le suivant à la page ${debuts[i + 1]} : la page ${page} se trouve entre les deux.`,
      _signature: `pg|${livre.titre}|${debuts.join(',')}|${page}`, cleContenu: `pg|${livre.titre}|${debuts.join(',')}|${page}`,
      difficulte: 2,
    };
  }],
  // Index : pages d'un mot
  [3, (rng) => {
    const livre = rng.pick(LIVRES);
    const debuts = pagination(rng, livre.chap.length);
    const toutes = entreesIndex(rng, livre, debuts);
    const montre = rng.shuffle(toutes).slice(0, rng.int(6, 8)).sort((a, b) => triFr(a.mot, b.mot));
    if (new Set(montre.map((e) => e.pages.join(','))).size < montre.length) return null;
    const e = rng.pick(montre);
    const q = qcm(rng, `Page${e.pages.length > 1 ? 's' : ''} ${e.pages.join(' et ')}`, montre.filter((x) => x !== e).map((x) => `Page${x.pages.length > 1 ? 's' : ''} ${x.pages.join(' et ')}`));
    return {
      ...q, figure: svgIndex(livre.titre, montre),
      enonce: `Observe l'index de ce livre. À quelle(s) page(s) trouves-tu des informations sur « ${e.mot} » ?`,
      explication: `Dans l'index, les mots sont rangés par ordre alphabétique : « ${e.mot} » renvoie à la page${e.pages.length > 1 ? 's' : ''} ${e.pages.join(' et ')}.`,
      _signature: `ix|${livre.titre}|${montre.map((x) => x.mot + x.pages.join('-')).join(',')}|${e.mot}|${cle(q.choix)}`,
      cleContenu: `ix|${livre.titre}|${montre.map((x) => x.mot + x.pages.join('-')).join(',')}|${e.mot}`,
      difficulte: 1,
    };
  }],
  // Index : où insérer un mot oublié (ordre alphabétique) ?
  [3, (rng) => {
    const livre = rng.pick(LIVRES);
    const debuts = pagination(rng, livre.chap.length);
    const toutes = entreesIndex(rng, livre, debuts).sort((a, b) => triFr(a.mot, b.mot));
    const k = rng.int(1, toutes.length - 2);
    const oublie = toutes[k];
    const reste = toutes.filter((x) => x !== oublie);
    // On garde 5 ou 6 mots autour de la place du mot oublié.
    const deb = Math.max(0, Math.min(k - rng.int(1, 3), reste.length - 6));
    const montre = reste.slice(deb, deb + 6);
    const pos = montre.findIndex((x) => triFr(x.mot, oublie.mot) > 0);
    if (pos <= 0) return null;
    const paires = montre.slice(0, -1).map((x, j) => `Entre « ${x.mot} » et « ${montre[j + 1].mot} »`);
    const bonne = paires[pos - 1];
    const q = qcm(rng, bonne, paires);
    return {
      ...q, figure: svgIndex(livre.titre, montre),
      enonce: `Le mot « ${oublie.mot} » a été oublié dans cet index. Où faut-il l'écrire pour respecter l'ordre alphabétique ?`,
      explication: `Dans un index, les mots sont rangés par ordre alphabétique (on compare la 1re lettre, puis la 2e…). « ${oublie.mot} » se place après « ${montre[pos - 1].mot} » et avant « ${montre[pos].mot} ».`,
      _signature: `ins|${livre.titre}|${montre.map((x) => x.mot).join(',')}|${oublie.mot}|${cle(q.choix)}`,
      cleContenu: `ins|${livre.titre}|${montre.map((x) => x.mot).join(',')}|${oublie.mot}`,
      difficulte: 2,
    };
  }],
  // Quel outil ?
  [2, (rng) => ({ ...depuisBanque(rng, OUTILS, 'out'), difficulte: 1 })],
  // Moteur de recherche : les meilleurs mots-clés
  [2, (rng) => {
    const r = rng.pick(RECHERCHES);
    const qui = rng.pick(PRENOMS);
    const q = qcm(rng, `« ${r.ok} »`, r.ko.map((x) => `« ${x} »`));
    return {
      ...q,
      enonce: `${qui} veut trouver sur internet ${r.besoin}. Quels mots-clés doit-${PRENOMS_F.includes(qui) ? 'elle' : 'il'} taper dans le moteur de recherche ?`,
      explication: `Les meilleurs mots-clés sont précis et reprennent les mots importants de la question : « ${r.ok} ». Des mots trop vagues donnent des milliers de résultats qui ne répondent pas à la question.`,
      _signature: `mr|${r.besoin}|${qui}|${cle(q.choix)}`, cleContenu: `mr|${r.besoin}`,
      difficulte: 2,
    };
  }],
]);

// =====================================================================================
// 11. Juger un document : auteur, date, lieu, trace du passé / travail postérieur, pertinence
// =====================================================================================
const MOIS_TXT = MOIS;
const dateJour = (rng, a) => `${rng.int(2, 27)} ${rng.pick(MOIS_TXT)} ${a}`;
// Documents (fictifs mais vraisemblables) : chaque fabrique tire lieu et dates, et donne des distracteurs naturels.
const FAB_DOCS = [
  (rng) => {
    const a = rng.int(1947, 1955); const lieu = rng.pick(['Marcinelle', 'Charleroi', 'Seraing', 'La Louvière', 'Frameries']);
    return { genre: 'une lettre', texte: `Une lettre écrite à ${lieu} le ${dateJour(rng, a)} par un mineur italien à sa mère, restée en Italie. Il lui raconte son travail au fond de la mine.`,
      auteur: 'Un mineur italien', fauxAuteurs: ['Sa mère, restée en Italie', 'Le directeur de la mine', 'Un historien d\'aujourd\'hui'],
      lieu, fauxLieux: ['En Italie', 'À Bruxelles', 'À Rome'], prod: a, evoque: a, evTxt: String(a), trace: true };
  },
  (rng) => {
    const anniv = rng.pick([40, 50, 60, 65]); const a = 1956 + anniv; const lieu = rng.pick(['Bruxelles', 'Liège', 'Namur', 'Mons']);
    return { genre: 'un article de journal', texte: `Un article écrit à ${lieu} en ${a} par une journaliste belge, pour les ${anniv} ans de la catastrophe du Bois du Cazier (1956) à Marcinelle.`,
      auteur: 'Une journaliste belge', fauxAuteurs: ['Les mineurs du Bois du Cazier', 'Le roi Baudouin', 'Les familles italiennes de 1956'],
      lieu, fauxLieux: ['À Marcinelle', 'En Italie', 'À Anvers'], prod: a, evoque: 1956, evTxt: '1956', trace: false };
  },
  (rng) => {
    const a = rng.int(2005, 2023); const lieu = rng.pick(['Namur', 'Liège', 'Wavre', 'Arlon']);
    return { genre: 'un manuel d\'histoire', texte: `Un manuel d'histoire écrit à ${lieu} en ${a} par deux enseignantes. Il explique le baptême de Clovis, roi des Francs, vers 496.`,
      auteur: 'Deux enseignantes', fauxAuteurs: ['Clovis, roi des Francs', 'L\'évêque Remi', 'Des moines du Moyen Âge'],
      lieu, fauxLieux: ['À Reims', 'À Tournai', 'À Rome'], prod: a, evoque: 496, evTxt: 'vers 496', trace: false };
  },
  (rng) => {
    const arrivee = rng.int(1964, 1972); const a = rng.int(2005, 2020); const lieu = rng.pick(['Liège', 'Bruxelles', 'Charleroi', 'Genk']);
    return { genre: 'un témoignage enregistré', texte: `Un témoignage enregistré à ${lieu} en ${a} : une dame arrivée du Maroc en ${arrivee} raconte son premier hiver en Belgique.`,
      auteur: 'Une dame arrivée du Maroc', fauxAuteurs: ['Le roi des Belges', 'Un ministre marocain', 'Un journaliste de 1964'],
      lieu, fauxLieux: ['Au Maroc', 'À Anvers', 'À Rome'], prod: a, evoque: arrivee, evTxt: String(arrivee), temoin: true };
  },
  (rng) => {
    const a = rng.int(1955, 1966); const lieu = rng.pick(['Charleroi', 'Liège', 'Genk', 'Mons']);
    return { genre: 'une photographie', texte: `Une photographie prise à ${lieu} en ${a} par un photographe belge. On y voit des mineurs qui remontent du fond de la mine.`,
      auteur: 'Un photographe belge', fauxAuteurs: ['Les mineurs', 'Un historien d\'aujourd\'hui', 'Le patron de la mine'],
      lieu, fauxLieux: ['À Bruxelles', 'En Italie', 'Au Maroc'], prod: a, evoque: a, evTxt: String(a), trace: true };
  },
  (rng) => {
    const a = rng.int(2008, 2024); const lieu = rng.pick(['Tongres', 'Arlon', 'Tournai']);
    return { genre: 'une maquette', texte: `Une maquette d'une villa gallo-romaine, construite en ${a} par une classe de 6e ${/^[AEIOU]/.test(lieu) ? 'd\'' : 'de '}${lieu} pour une exposition.`,
      auteur: 'Une classe de 6e', fauxAuteurs: ['Les Romains', 'Jules César', 'Un propriétaire de villa romaine'],
      lieu, fauxLieux: ['À Rome', 'En Gaule, il y a 2 000 ans', 'À Athènes'], prod: a, evoque: null, evTxt: 'l\'époque gallo-romaine', trace: false };
  },
];

const TRACES = [
  'une pièce de monnaie romaine trouvée à Tongres', 'la mosaïque d\'une villa gallo-romaine', 'la tombe de Childéric découverte à Tournai',
  'une lettre écrite en 1950 par un mineur italien', 'une photo prise au Bois du Cazier en 1956', 'le contrat de travail d\'un mineur marocain signé en 1965',
  'une carte du monde dessinée par Mercator en 1569', 'le journal de bord d\'un navire du XVIIIe siècle', 'une affiche de 1946 qui propose du travail dans les mines belges',
];
const POSTERIEURS = [
  'un manuel scolaire de 2020 sur les Gallo-Romains', 'un film de 2015 sur Christophe Colomb', 'une bande dessinée de 1990 sur Charlemagne',
  'un site internet créé en 2022 sur l\'immigration italienne', 'une maquette de villa romaine construite par une classe en 2024', 'un documentaire de 2006 sur la catastrophe du Bois du Cazier',
  'un dessin d\'enfant de 2023 représentant Clovis', 'une exposition de 2019 sur le commerce triangulaire',
];

const SUJETS_DOC = [
  { g: 'migr', q: 'Pourquoi des mineurs italiens sont-ils venus en Belgique après 1945 ?', docs: [
    'le texte de l\'accord belgo-italien de 1946 (« des hommes contre du charbon »)', 'une affiche de 1946 qui propose aux Italiens du travail dans les mines belges', 'une lettre de 1948 d\'un mineur italien qui explique pourquoi il a quitté son village'] },
  { g: 'rom', q: 'Comment vivaient les Gallo-Romains dans nos régions ?', docs: [
    'le plan d\'une villa gallo-romaine découverte en Wallonie', 'des objets du quotidien trouvés dans des tombes gallo-romaines à Tongres', 'une mosaïque retrouvée dans une villa romaine de nos régions'] },
  { g: 'colo', q: 'Quels aliments inconnus en Europe avant 1492 les Européens ont-ils découverts dans les Amériques ?', docs: [
    'une liste de marchandises débarquées en Espagne par des navires au XVIe siècle', 'une gravure du XVIe siècle qui montre des plants de maïs et de tabac', 'un tableau qui compare les aliments connus en Europe avant et après 1492'] },
  { g: 'migr', q: 'Comment s\'est déroulée la catastrophe du Bois du Cazier ?', docs: [
    'un article de journal du 9 août 1956 sur l\'incendie de la mine', 'le témoignage d\'un mineur sauvé de l\'incendie de 1956', 'la liste des 262 victimes, avec leur nationalité'] },
  { g: 'hma', q: 'Qui était Charlemagne ?', docs: [
    'la vie de Charlemagne écrite par Éginhard, un savant de sa cour', 'une pièce de monnaie frappée au nom de Charlemagne', 'un récit de son couronnement à Rome en 800'] },
  { g: 'migr', q: 'Quels apports culturels les migrations après 1945 ont-elles laissés en Belgique ?', docs: [
    'une photo d\'un restaurant marocain ouvert à Bruxelles en 1975', 'un article sur la fête annuelle d\'une association italienne de Charleroi', 'un reportage sur une mosquée construite à Liège'] },
  { g: 'colo', q: 'Comment fonctionnait le commerce triangulaire ?', docs: [
    'le journal de bord d\'un navire négrier du XVIIIe siècle', 'le récit d\'un ancien esclave sur sa traversée de l\'Atlantique', 'un registre de vente d\'esclaves aux Antilles en 1750'] },
];
// Questions de recherche et documents qui ne conviennent pas pour UNE raison (sujet, époque ou lieu).
const RAISONS = ['Il ne parle pas du bon sujet.', 'Il ne parle pas de la bonne époque.', 'Il ne parle pas du bon lieu.'];
const NON_PERT = [
  { q: 'Que mangeaient les habitants de nos régions au Moyen Âge ?', docs: [
    { t: 'le plan d\'un château fort de nos régions au XIIe siècle', r: 0 },
    { t: 'un livre de recettes belges publié en 2020', r: 1 },
    { t: 'un texte sur ce que mangeaient les paysans chinois au Moyen Âge', r: 2 }] },
  { q: 'Comment travaillaient les mineurs en Belgique dans les années 1950 ?', docs: [
    { t: 'une photo de la récolte des betteraves en Hesbaye en 1955', r: 0 },
    { t: 'une photo de mineurs belges au travail en 1890', r: 1 },
    { t: 'un reportage sur des mineurs au travail en Pologne en 1955', r: 2 }] },
  { q: 'Pourquoi des travailleurs marocains sont-ils venus en Belgique dans les années 1960 ?', docs: [
    { t: 'un article sur la construction d\'une autoroute en Belgique en 1965', r: 0 },
    { t: 'un article sur des travailleurs marocains arrivés en Belgique en 2020', r: 1 },
    { t: 'un article sur les travailleurs marocains partis en France dans les années 1960', r: 2 }] },
  { q: 'Quelles routes les Romains ont-ils construites dans nos régions ?', docs: [
    { t: 'une carte des grands fleuves de nos régions à l\'époque romaine', r: 0 },
    { t: 'une carte des autoroutes belges de 2024', r: 1 },
    { t: 'une carte des routes romaines en Espagne', r: 2 }] },
];
const INTENTIONS = ['Convaincre (persuader) les lecteurs', 'Informer, expliquer', 'Donner des nouvelles à sa famille', 'Rendre hommage à des personnes', 'Vendre un produit', 'Faire rire'];
// ex : intentions voisines écartées des choix (une affiche qui convainc informe aussi un peu…).
const DOCS_INTENTION = [
  { t: 'Une affiche de 1946 collée dans des villages italiens : « Travaillez dans les mines belges ! Bon salaire, logement, voyage gratuit ! »', i: 0, ex: [1, 4] },
  { t: 'Un panneau d\'un musée qui explique comment on extrayait le charbon au fond de la mine.', i: 1, ex: [] },
  { t: 'Une lettre d\'un mineur à sa femme : « Je vais bien, le travail est dur, je pense à vous chaque jour. »', i: 2, ex: [1] },
  { t: 'Un discours prononcé chaque 8 août au Bois du Cazier, devant la liste des 262 mineurs morts en 1956.', i: 3, ex: [1] },
  { t: 'Une publicité de 1960 pour une nouvelle marque de chocolat belge.', i: 4, ex: [0, 1] },
  { t: 'Une page de manuel scolaire qui décrit la vie dans une villa gallo-romaine.', i: 1, ex: [] },
  { t: 'Une affiche de 2024 qui encourage les habitants à venir à vélo au travail : « Moins de CO₂, plus de santé ! »', i: 0, ex: [1] },
  { t: 'Une plaque commémorative posée sur un monument, avec les noms des mineurs morts dans une catastrophe.', i: 3, ex: [1] },
];
const INFERER = [
  { doc: 'Lettre d\'un mineur, 1952 : « Ici, nous dormons à six dans une baraque en tôle. L\'hiver, on a très froid. »',
    ok: 'Ses conditions de logement étaient difficiles.', lu: ['Il dort à six dans une baraque en tôle.', 'L\'hiver, il a très froid.'], faux: ['Il habitait un grand château.'] },
  { doc: 'Affiche de 1946 : « Les mineurs en Belgique reçoivent un bon salaire, un logement et le voyage gratuit. »',
    ok: 'La Belgique avait besoin de beaucoup de mineurs.', lu: ['Le voyage est gratuit.', 'Les mineurs reçoivent un logement.'], faux: ['Les mines belges allaient fermer.'] },
  { doc: 'Article, 9 août 1956 : « Des centaines de familles attendent devant les grilles du Bois du Cazier depuis hier matin. »',
    ok: 'Beaucoup de mineurs étaient encore bloqués au fond de la mine.', lu: ['Des familles attendent devant les grilles.', 'Elles attendent depuis la veille au matin.'], faux: ['La mine était vide ce jour-là.'] },
  { doc: 'Journal de bord, 1750 : « Nous avons échangé en Afrique nos tissus et nos fusils contre des captifs. »',
    ok: 'Des êtres humains étaient vendus comme des marchandises.', lu: ['Le navire transportait des tissus et des fusils.', 'L\'échange a eu lieu en Afrique.'], faux: ['Le navire transportait des touristes.'] },
];

const pertinence = famille('pd', [
  // Auteur / lieu / date de réalisation / époque évoquée
  [6, (rng) => {
    const d = rng.pick(FAB_DOCS)(rng);
    // Pas de question « trace ou travail postérieur » pour un témoignage recueilli plus tard (classement discuté).
    const quoi = rng.pick(['auteur', 'auteur', 'lieu', 'date', 'date', ...(d.temoin ? [] : ['trace'])]);
    const doc = `Document : ${d.texte}`;
    if (quoi === 'auteur') {
      const q = qcm(rng, d.auteur, d.fauxAuteurs);
      return { ...q, enonce: `${doc}\nQui est l'auteur de ce document ?`, explication: `L'auteur est la personne qui a réalisé le document : ${leLa(d.auteur)}.${d.temoin ? ' Dans un témoignage, l\'auteur est le témoin qui raconte.' : ''}`, _signature: `au|${d.texte}|${cle(q.choix)}`, cleContenu: `au|${d.texte}`, difficulte: 1 };
    }
    if (quoi === 'lieu') {
      const bonne = `À ${d.lieu}`;
      const q = qcm(rng, bonne, d.fauxLieux.filter((x) => x !== bonne));
      return { ...q, enonce: `${doc}\nOù ce document a-t-il été réalisé ?`, explication: `Le document a été réalisé à ${d.lieu}. Attention à ne pas confondre le lieu où le document a été fait avec les lieux dont il parle.`, _signature: `li|${d.texte}|${cle(q.choix)}`, cleContenu: `li|${d.texte}`, difficulte: 2 };
    }
    const faux = [...new Set([d.evoque, d.prod - 10, d.prod + 10, d.prod - 20, 1830, 1789].filter((x) => x && x !== d.prod))];
    if (quoi === 'date') {
      const decale = d.prod !== d.evoque;
      const q = qcm(rng, String(d.prod), (decale && d.evoque ? [d.evoque, ...rng.shuffle(faux.slice(1)).slice(0, 2)] : rng.shuffle(faux).slice(0, 3)).map(String));
      return { ...q, enonce: `${doc}\nEn quelle année ce document a-t-il été réalisé ?`, explication: `Le document a été réalisé en ${d.prod}.${decale ? ` Il parle de faits plus anciens (${d.evTxt}) : la date de réalisation d'un document n'est pas toujours la date des faits dont il parle.` : ''}`, _signature: `da|${d.texte}|${cle(q.choix)}`, cleContenu: `da|${d.texte}`, difficulte: decale ? 3 : 1 };
    }
    // Trace du passé ou travail postérieur ?
    const choix = ['Une trace du passé (réalisée à l\'époque des faits)', 'Un travail postérieur (réalisé plus tard)'];
    return { type: 'qcm', choix, reponse: d.trace ? 0 : 1, enonce: `${doc}\nPour connaître les faits dont il parle, ce document est-il une trace du passé ou un travail postérieur ?`,
      explication: d.trace ? 'C\'est une trace du passé : il a été réalisé au moment des faits, par quelqu\'un qui les a vécus ou vus.' : `C'est un travail postérieur : il a été réalisé en ${d.prod}, bien après les faits dont il parle (${d.evTxt}).`,
      _signature: `tp|${d.texte}`, cleContenu: `tp|${d.texte}`, difficulte: 2 };
  }],
  // Grille trace / travail postérieur
  [3, (rng) => {
    const pool = [...TRACES.map((t) => ({ t, c: 0 })), ...POSTERIEURS.map((t) => ({ t, c: 1 }))];
    const items = tirerMixte(rng, pool, 4, (x) => x.c);
    if (!items) return null;
    return {
      ...grilleQ(items, ['Trace du passé', 'Travail postérieur']),
      enonce: 'Chaque document est-il une trace du passé (réalisée à l\'époque des faits) ou un travail postérieur (réalisé plus tard, par exemple par un historien ou un auteur d\'aujourd\'hui) ?',
      explication: maj(items.map((x) => `${x.t} : ${x.c === 0 ? 'trace du passé' : 'travail postérieur'}`).join(' ; ')) + '.',
      _signature: `gtp|${cle(items.map((x) => x.t))}`, cleContenu: `gtp|${cle(items.map((x) => x.t))}`,
      difficulte: 2,
    };
  }],
  // Quel document est pertinent ?
  [4, (rng) => {
    const s = rng.pick(SUJETS_DOC);
    const bonne = maj(rng.pick(s.docs));
    // Distracteurs pris dans d'autres thèmes (pas de document voisin qui pourrait aussi convenir).
    const autres = SUJETS_DOC.filter((x) => x.g !== s.g).flatMap((x) => x.docs).map(maj);
    const q = qcm(rng, bonne, autres);
    const qui = rng.pick(PRENOMS);
    return {
      ...q,
      enonce: `${qui} fait une recherche sur la question : « ${s.q} » Quel document est pertinent (utile) pour y répondre ?`,
      explication: `${bonne} : ce document parle du sujet de la question, à la bonne époque et au bon endroit. Les autres documents parlent d'autres sujets.`,
      _signature: `pert|${s.q}|${bonne}|${cle(q.choix)}`, cleContenu: `pert|${s.q}|${bonne}`,
      difficulte: 2,
    };
  }],
  // Quel document n'est pas pertinent ?
  [2, (rng) => {
    const s = rng.pick(SUJETS_DOC);
    const intrus = maj(rng.pick(SUJETS_DOC.filter((x) => x.g !== s.g).flatMap((x) => x.docs)));
    const choix = rng.shuffle([intrus, ...s.docs.map(maj)]);
    return {
      type: 'qcm', choix, reponse: choix.indexOf(intrus),
      enonce: `Question de recherche : « ${s.q} » Quel document n'est pas pertinent pour y répondre ?`,
      explication: `${intrus} : ce document parle d'un autre sujet. Les trois autres aident à répondre à la question.`,
      _signature: `npert|${s.q}|${intrus}|${choix.join(',')}`, cleContenu: `npert|${s.q}|${intrus}`,
      difficulte: 2,
    };
  }],
  // Pourquoi ce document ne convient-il pas ?
  [3, (rng) => {
    const s = rng.pick(NON_PERT);
    const d = rng.pick(s.docs);
    return {
      ...qcmFixe(RAISONS, RAISONS[d.r]),
      enonce: `Question de recherche : « ${s.q} »\nDocument : ${d.t}.\nPourquoi ce document n'est-il pas pertinent ?`,
      explication: `${RAISONS[d.r]} Un document pertinent doit parler du bon sujet, de la bonne époque et du bon lieu.`,
      _signature: `rais|${s.q}|${d.t}`, cleContenu: `rais|${s.q}|${d.t}`,
      difficulte: 3,
    };
  }],
  // Intention de l'auteur
  [2, (rng) => {
    const d = rng.pick(DOCS_INTENTION);
    const q = qcm(rng, INTENTIONS[d.i], INTENTIONS.filter((_, k) => !d.ex.includes(k)));
    return {
      ...q,
      enonce: `Document : ${d.t}\nQuelle est l'intention de l'auteur ?`,
      explication: `${INTENTIONS[d.i]} : c'est ce que cherche à faire l'auteur de ce document. Se demander « pourquoi ce document a-t-il été fait ? » aide à le critiquer.`,
      _signature: `int|${d.t}|${cle(q.choix)}`, cleContenu: `int|${d.t}`,
      difficulte: 2,
    };
  }],
  // Ce qu'on lit / ce qu'on peut en déduire
  [2, (rng) => {
    const d = rng.pick(INFERER);
    const q = qcm(rng, d.ok, [...d.lu, ...d.faux], 3);
    return {
      ...q,
      enonce: `${d.doc}\nQuelle information n'est pas écrite dans le document, mais peut en être déduite ?`,
      explication: `${d.ok} On le déduit du document, mais ce n'est pas écrit. ${d.lu.join(' ')} : cela, on le lit directement.`,
      _signature: `inf|${d.doc}|${cle(q.choix)}`, cleContenu: `inf|${d.doc}`,
      difficulte: 3,
    };
  }],
]);

// =====================================================================================
// 12. Changements et continuités entre deux époques
// =====================================================================================
const EPOQUES_CC = [
  { a: 'la période gallo-romaine', b: 'le Haut Moyen Âge', ou: 'dans nos régions',
    ch: ['des rois francs remplacent l\'empereur romain', 'le christianisme devient la religion de la plupart des habitants', 'de nombreux monastères sont construits', 'au nord de nos régions, une langue germanique s\'impose'],
    co: ['la plupart des habitants vivent de l\'agriculture', 'au sud de nos régions, on parle toujours une langue issue du latin', 'on cultive toujours le blé pour faire du pain'] },
  { a: 'le XVe siècle (avant 1492)', b: 'le XVIIe siècle', ou: 'en Europe',
    ch: ['on mange de nouveaux aliments venus des Amériques, comme la tomate ou le cacao', 'les Européens savent que les Amériques existent', 'des navigateurs européens ont déjà fait le tour du monde'],
    co: ['la plupart des gens vivent à la campagne et travaillent la terre', 'on voyage sur terre à pied, à cheval ou en charrette', 'les navires avancent grâce au vent qui gonfle leurs voiles', 'on fait toujours du pain avec du blé'] },
  { a: 'les années 1950', b: 'aujourd\'hui', ou: 'en Belgique',
    ch: ['il n\'y a plus aucune mine de charbon en activité', 'on paie en euros', 'on trouve des mosquées dans de nombreuses villes', 'beaucoup de familles ont un ordinateur et un smartphone', 'on mange couramment des pizzas, du couscous ou des kebabs'],
    co: ['la Belgique est un royaume, avec un roi', 'Bruxelles est la capitale du pays', 'des personnes venues d\'autres pays s\'installent en Belgique pour y travailler', 'on fête la Saint-Nicolas le 6 décembre'] },
  { a: 'la période gallo-romaine', b: 'aujourd\'hui', ou: 'dans nos régions',
    ch: ['on n\'écrit plus en latin, mais en français, en néerlandais ou en allemand', 'on se déplace en voiture et en train', 'on s\'éclaire à l\'électricité', 'le christianisme et d\'autres religions ont remplacé les dieux romains'],
    co: ['certaines routes suivent encore le tracé des chaussées romaines', 'beaucoup de mots français viennent du latin', 'des villes fondées par les Romains, comme Tongres et Arlon, existent toujours', 'on utilise des pièces de monnaie pour acheter'] },
];
const COL_CC = ['Changement', 'Continuité'];
const TABLEAU_CC = [
  { th: 'Énergie principale', a: 'charbon', b: 'gaz, pétrole…', co: false },
  { th: 'Monnaie', a: 'franc belge', b: 'euro', co: false },
  { th: 'Mines de charbon', a: 'très nombreuses', b: 'toutes fermées', co: false },
  { th: 'Lieux de culte', a: 'surtout des églises', b: 'églises, mosquées…', co: false },
  { th: 'Pour communiquer', a: 'lettre, téléphone', b: 'smartphone', co: false },
  { th: 'Capitale', a: 'Bruxelles', b: 'Bruxelles', co: true },
  { th: 'Chef de l\'État', a: 'un roi', b: 'un roi', co: true },
  { th: 'Saint-Nicolas', a: 'le 6 décembre', b: 'le 6 décembre', co: true },
];
function svgTableauCC(lignes) {
  const h = 40 + lignes.length * 30;
  const s = [svgOuvrir(400, h)];
  const xs = [8, 150, 271, 392];
  s.push(`<rect x="8" y="8" width="384" height="26" fill="#e8eef7" stroke="#1c2333" stroke-width="1"/>`);
  ['', 'En 1950', 'Aujourd\'hui'].forEach((t, i) => s.push(`<text x="${(xs[i] + xs[i + 1]) / 2}" y="26" font-size="13" font-weight="bold" text-anchor="middle" fill="#1c2333">${esc(t)}</text>`));
  lignes.forEach((l, i) => {
    const y = 34 + i * 30;
    s.push(`<rect x="8" y="${y}" width="384" height="30" fill="#ffffff" stroke="#1c2333" stroke-width="1"/>`);
    s.push(`<text x="14" y="${y + 19}" font-size="12.5" font-weight="bold" fill="#1c2333">${esc(l.th)}</text>`);
    s.push(`<text x="210.5" y="${y + 19}" font-size="12" text-anchor="middle" fill="#1c2333">${esc(l.a)}</text>`);
    s.push(`<text x="331.5" y="${y + 19}" font-size="12" text-anchor="middle" fill="#1c2333">${esc(l.b)}</text>`);
  });
  for (const x of xs.slice(1, 3)) s.push(`<line x1="${x}" y1="8" x2="${x}" y2="${h - 6}" stroke="#1c2333" stroke-width="1"/>`);
  s.push('</svg>');
  return s.join('');
}
const DEF_CC = [
  { q: 'En histoire, qu\'est-ce qu\'une continuité ?', ok: 'Quelque chose qui reste pareil d\'une époque à l\'autre',
    ko: ['Quelque chose qui change d\'une époque à l\'autre', 'Un événement qui se passe en une seule journée', 'La date de début d\'une période'],
    expl: 'Une continuité (ou permanence) est ce qui ne change pas entre deux époques. Un changement est ce qui est différent.' },
  { q: 'En histoire, qu\'est-ce qu\'un changement ?', ok: 'Quelque chose qui est différent d\'une époque à l\'autre',
    ko: ['Quelque chose qui reste pareil d\'une époque à l\'autre', 'Un document écrit à l\'époque des faits', 'Une période de mille ans'],
    expl: 'Un changement, c\'est ce qui est différent entre deux époques. Ce qui reste pareil s\'appelle une continuité (ou permanence).' },
];

const changeContinue = famille('cc', [
  // Grille changement / continuité
  [5, (rng) => {
    const e = rng.pick(EPOQUES_CC);
    const pool = [...e.ch.map((t) => ({ t, c: 0 })), ...e.co.map((t) => ({ t, c: 1 }))];
    const items = tirerMixte(rng, pool, 4, (x) => x.c);
    if (!items) return null;
    return {
      ...grilleQ(items, COL_CC),
      enonce: `Compare ${e.a} et ${e.b}, ${e.ou}. Chaque phrase décrit la situation ${e.b === 'aujourd\'hui' ? 'd\'aujourd\'hui' : `pendant ${e.b}`}. Est-ce un changement ou une continuité (ce qui ne change pas) par rapport à ${e.a} ?`,
      explication: maj(items.map((x) => `${x.t} : ${x.c === 0 ? 'changement' : 'continuité'}`).join(' ; ')) + '.',
      _signature: `gr|${e.a}|${e.b}|${cle(items.map((x) => x.t))}`, cleContenu: `gr|${e.a}|${e.b}|${cle(items.map((x) => x.t))}`,
      difficulte: 2,
    };
  }],
  // QCM : un changement parmi des continuités (ou l'inverse)
  [4, (rng) => {
    const e = rng.pick(EPOQUES_CC);
    const cherche = rng.next() < 0.5 ? 'ch' : 'co';
    const bonne = maj(rng.pick(e[cherche]));
    const q = qcm(rng, bonne, e[cherche === 'ch' ? 'co' : 'ch'].map(maj));
    return {
      ...q,
      enonce: `Entre ${e.a} et ${e.b}, ${e.ou}, laquelle de ces phrases décrit ${cherche === 'ch' ? 'un changement' : 'une continuité (quelque chose qui ne change pas)'} ?`,
      explication: `${bonne} : c'est ${cherche === 'ch' ? 'un changement' : 'une continuité'}. Les autres phrases décrivent ${cherche === 'ch' ? 'des continuités' : 'des changements'}.`,
      _signature: `q|${e.a}|${e.b}|${cherche}|${bonne}|${cle(q.choix)}`, cleContenu: `q|${e.a}|${e.b}|${cherche}|${bonne}`,
      difficulte: 2,
    };
  }],
  // Tableau à double entrée (1950 / aujourd'hui)
  [3, (rng) => {
    const cherche = rng.next() < 0.6;
    const cible = rng.pick(TABLEAU_CC.filter((x) => x.co === cherche));
    const autres = rng.shuffle(TABLEAU_CC.filter((x) => x.co !== cherche)).slice(0, 3);
    const lignes = rng.shuffle([cible, ...autres]);
    const choix = lignes.map((l) => l.th);
    return {
      type: 'qcm', choix, reponse: choix.indexOf(cible.th), figure: svgTableauCC(lignes),
      enonce: `Observe ce tableau qui compare la Belgique en 1950 et aujourd'hui. Dans quelle ligne observes-tu ${cherche ? 'une continuité (quelque chose qui n\'a pas changé)' : 'un changement'} ?`,
      explication: `« ${cible.th} » : ${cible.a} en 1950, ${cible.b} aujourd'hui. ${cherche ? 'C\'est pareil : une continuité.' : 'C\'est différent : un changement.'} Dans les autres lignes, ${cherche ? 'les deux colonnes sont différentes' : 'les deux colonnes sont identiques'}.`,
      _signature: `tab|${lignes.map((l) => l.th).join(',')}|${cherche}`, cleContenu: `tab|${cle(lignes.map((l) => l.th))}|${cherche}`,
      difficulte: 1,
    };
  }],
  // Vrai / faux
  [2, (rng) => {
    const e = rng.pick(EPOQUES_CC);
    const estCh = rng.next() < 0.5;
    const t = rng.pick(estCh ? e.ch : e.co);
    const ditCh = rng.next() < 0.5;
    return {
      type: 'vrai_faux',
      enonce: `Vrai ou faux ? Entre ${e.a} et ${e.b}, ${e.ou}, « ${t} » est ${ditCh ? 'un changement' : 'une continuité'}.`,
      reponse: ditCh === estCh,
      explication: `${maj(t)} : c'est ${estCh ? 'un changement (c\'est différent d\'une époque à l\'autre)' : 'une continuité (c\'est pareil aux deux époques)'}.`,
      _signature: `vf|${e.a}|${e.b}|${t}|${ditCh}`,
      difficulte: 2,
    };
  }],
  [1, (rng) => ({ ...depuisBanque(rng, DEF_CC, 'def'), difficulte: 1 })],
]);

// =====================================================================================
// 13. Rappel P5 : le peuplement de la Belgique (base « hg-provinces », Statbel 1er janvier 2024)
// =====================================================================================
const REGIONS_POP = [
  { nom: 'la Région flamande', pop: 6821770, sup: 13625 },
  { nom: 'la Région wallonne', pop: 3692283, sup: 16901 },
  { nom: 'la Région de Bruxelles-Capitale', pop: 1249597, sup: 162 },
];
const BELGIQUE_POP = 11763650;
const millions = (p) => `${n(Math.round(p / 1e5) / 10)} million${p >= 1.95e6 ? 's' : ''}`;
const ESPACES_BE = {
  peuples: ['L\'espace Bruxelles-Gand-Anvers-Louvain', 'Le sillon Sambre-et-Meuse (de Charleroi à Liège)'],
  vides: ['L\'Ardenne', 'Le plateau des Hautes Fagnes', 'La Famenne'],
};
const VILLES_ESPACES = [
  ...['Charleroi', 'Namur', 'Liège', 'Huy', 'Seraing', 'Andenne'].map((t) => ({ t, c: 0 })),
  ...['Bruxelles', 'Gand', 'Anvers', 'Louvain', 'Malines'].map((t) => ({ t, c: 1 })),
];
const COL_ESPACES = ['Sillon Sambre-et-Meuse', 'Espace Bruxelles-Gand-Anvers-Louvain'];
const BANQUE_PEUPL = [
  { q: 'Quelle est la province la plus peuplée de Belgique ?', ok: 'La province d\'Anvers', ko: ['La province de Hainaut', 'La province de Liège', 'La province de Luxembourg', 'La province de Namur'],
    expl: 'Au 1er janvier 2024, la province d\'Anvers comptait un peu plus de 1,9 million d\'habitants : c\'est la plus peuplée.' },
  { q: 'Quelle est la province la moins peuplée de Belgique ?', ok: 'La province de Luxembourg', ko: ['La province d\'Anvers', 'La province de Hainaut', 'La province de Liège', 'La province de Flandre orientale'],
    expl: 'La province de Luxembourg (environ 295 000 habitants en 2024) est la moins peuplée. C\'est aussi la plus grande province : sa densité est la plus faible du pays (environ 66 habitants par km²).' },
  { q: 'Quelle province a la plus faible densité de population ?', ok: 'La province de Luxembourg', ko: ['La province d\'Anvers', 'La province du Brabant flamand', 'La province de Flandre orientale', 'La province du Brabant wallon'],
    expl: 'Dans la province de Luxembourg, en Ardenne, il y a environ 66 habitants par km² : c\'est la densité la plus faible de Belgique.' },
  { q: 'Quelle Région belge compte le plus d\'habitants ?', ok: 'La Région flamande', ko: ['La Région wallonne', 'La Région de Bruxelles-Capitale'],
    expl: 'En 2024 : Région flamande ≈ 6,8 millions, Région wallonne ≈ 3,7 millions, Région de Bruxelles-Capitale ≈ 1,2 million d\'habitants.' },
  { q: 'Quelle Région belge a la plus forte densité de population ?', ok: 'La Région de Bruxelles-Capitale', ko: ['La Région flamande', 'La Région wallonne'],
    expl: 'La Région de Bruxelles-Capitale compte environ 1,2 million d\'habitants sur seulement 162 km² : plus de 7 000 habitants par km² !' },
  { q: 'Quelle est la commune la plus peuplée de Belgique ?', ok: 'Anvers', ko: ['Gand', 'Charleroi', 'Liège', 'Namur'],
    expl: 'La commune d\'Anvers compte plus d\'un demi-million d\'habitants : c\'est la plus peuplée du pays.' },
  { q: 'Quelles sont les deux villes les plus peuplées de Wallonie ?', ok: 'Charleroi et Liège', ko: ['Namur et Mons', 'Arlon et Bastogne', 'Wavre et Dinant'],
    expl: 'Charleroi et Liège, deux villes du sillon Sambre-et-Meuse, comptent chacune environ 200 000 habitants.' },
  { q: 'Pourquoi le sillon Sambre-et-Meuse est-il très peuplé ?', ok: 'Les vallées de la Sambre et de la Meuse ont attiré mines, usines et villes.',
    ko: ['C\'est la région la plus haute de Belgique.', 'C\'est une grande forêt protégée.', 'Il n\'y a ni route ni rivière.'],
    expl: 'Le long de la Sambre et de la Meuse se sont développées les mines de charbon et les industries : beaucoup de gens sont venus y travailler et y habiter (Charleroi, Namur, Liège).' },
  { q: 'Pourquoi l\'Ardenne est-elle peu peuplée ?', ok: 'C\'est un plateau élevé, couvert de forêts, au climat plus froid et plus humide.',
    ko: ['C\'est une grande plaine couverte de villes.', 'C\'est la région où se trouvent les plus grands ports.', 'Elle est située au bord de la mer du Nord.'],
    expl: 'En Ardenne, le relief est plus élevé, les forêts nombreuses et le climat plus rude : il y a peu de grandes villes et la densité est faible.' },
];

const peuplementBe = famille('pb', [
  // Comparer des provinces à partir des données (population totale ≠ densité)
  [5, (rng, modele) => {
    const provs = (modele.items ?? []).filter((x) => x.pop && x.sup);
    if (provs.length < 4) return null;
    const k = rng.int(3, 4);
    const tires = rng.shuffle(provs).slice(0, k);
    const sorte = rng.pick(['dense', 'dense', 'peu_dense', 'peuple']);
    const val = (p) => (sorte === 'peuple' ? p.pop : p.pop / p.sup);
    const tri = tires.slice().sort((a, b) => val(b) - val(a));
    const bon = sorte === 'peu_dense' ? tri[tri.length - 1] : tri[0];
    const second = sorte === 'peu_dense' ? tri[tri.length - 2] : tri[1];
    const ratio = Math.max(val(bon), val(second)) / Math.min(val(bon), val(second));
    if (ratio < 1.15) return null;
    const pop = (p) => Math.round(p.pop / 1000) * 1000;
    const donnees = tires.map((p) => `${maj(p.nom)} : ${n(pop(p))} habitants pour ${n(p.sup)} km²`).join('\n');
    const q = { type: 'qcm', choix: tires.map((p) => maj(p.nom)), reponse: tires.indexOf(bon) };
    const dens = tires.map((p) => `${p.court} ≈ ${n(Math.round(p.pop / p.sup))} hab./km²`).join(' ; ');
    return {
      ...q,
      enonce: `Population au 1er janvier 2024 (Statbel) :\n${donnees}\n${sorte === 'peuple' ? 'Quelle province compte le plus d\'habitants ?' : sorte === 'dense' ? 'Quelle province a la plus forte densité de population ?' : 'Quelle province a la plus faible densité de population ?'}`,
      explication: sorte === 'peuple'
        ? `On compare le nombre total d'habitants : ${bon.nom} en a le plus. (Densités : ${dens}.)`
        : `Densité = nombre d'habitants ÷ superficie. ${dens}. ${sorte === 'dense' ? 'La plus forte' : 'La plus faible'} : ${bon.nom}.`,
      _signature: `cmp|${sorte}|${cle(tires.map((p) => p.court))}`, cleContenu: `cmp|${sorte}|${cle(tires.map((p) => p.court))}`,
      difficulte: sorte === 'peuple' ? 1 : 3,
    };
  }],
  // Espaces très peuplés / peu peuplés
  [3, (rng) => {
    const peu = rng.next() < 0.5;
    const bonne = rng.pick(peu ? ESPACES_BE.vides : ESPACES_BE.peuples);
    const q = qcm(rng, bonne, peu ? ESPACES_BE.peuples : ESPACES_BE.vides, peu ? 2 : 3);
    return {
      ...q,
      enonce: `Lequel de ces espaces de Belgique est ${peu ? 'peu peuplé' : 'très peuplé'} ?`,
      explication: 'Les espaces les plus peuplés de Belgique sont l\'espace Bruxelles-Gand-Anvers-Louvain et le sillon Sambre-et-Meuse (Charleroi, Namur, Liège). L\'Ardenne, la Famenne et les Hautes Fagnes, plus élevées et boisées, sont peu peuplées.',
      _signature: `esp|${peu}|${bonne}|${cle(q.choix)}`, cleContenu: `esp|${peu}|${bonne}`,
      difficulte: 1,
    };
  }],
  // Villes → espace peuplé
  [3, (rng) => {
    const items = tirerMixte(rng, VILLES_ESPACES, 4, (x) => x.c);
    if (!items) return null;
    return {
      ...grilleQ(items, COL_ESPACES),
      enonce: 'Ces villes se trouvent dans un des deux espaces les plus peuplés de Belgique. Lequel ?',
      explication: 'Sillon Sambre-et-Meuse : Charleroi, Namur, Andenne, Huy, Seraing, Liège (le long de la Sambre et de la Meuse). Espace Bruxelles-Gand-Anvers-Louvain : Bruxelles, Gand, Anvers, Louvain et Malines.',
      _signature: `vil|${cle(items.map((x) => x.t))}`, cleContenu: `vil|${cle(items.map((x) => x.t))}`,
      difficulte: 2,
    };
  }],
  // Ordres de grandeur (au dixième de million)
  [3, (rng) => {
    const terr = rng.pick([...REGIONS_POP, { nom: 'la Belgique', pop: BELGIQUE_POP }]);
    const bonne = `Environ ${millions(terr.pop)}`;
    const faux = [...REGIONS_POP, { pop: BELGIQUE_POP }].filter((x) => x.pop !== terr.pop).map((x) => `Environ ${millions(x.pop)}`);
    const q = qcm(rng, bonne, faux);
    return {
      ...q,
      enonce: `Au 1er janvier 2024, environ combien d'habitants compte ${terr.nom} ?`,
      explication: `${maj(terr.nom)} compte environ ${millions(terr.pop)} d'habitants. Repères 2024 : Belgique ≈ 11,8 millions ; Région flamande ≈ 6,8 millions ; Région wallonne ≈ 3,7 millions ; Région de Bruxelles-Capitale ≈ 1,2 million.`,
      _signature: `og|${terr.nom}|${cle(q.choix)}`, cleContenu: `og|${terr.nom}`,
      difficulte: 2,
    };
  }],
  [3, (rng) => ({ ...depuisBanque(rng, BANQUE_PEUPL, 'bq'), difficulte: 2 })],
  // Vrai / faux : population totale et densité des Régions
  [2, (rng) => {
    const [a, b] = rng.shuffle(REGIONS_POP).slice(0, 2);
    const dense = rng.next() < 0.5;
    const v = (x) => (dense ? x.pop / x.sup : x.pop);
    return {
      type: 'vrai_faux',
      enonce: `Vrai ou faux ? ${maj(a.nom)} ${dense ? 'a une densité de population plus forte que' : 'compte plus d\'habitants que'} ${b.nom}.`,
      reponse: v(a) > v(b),
      explication: `${maj(a.nom)} : ≈ ${millions(a.pop)} d'habitants pour ${n(a.sup)} km² (≈ ${n(Math.round(a.pop / a.sup))} hab./km²). ${maj(b.nom)} : ≈ ${millions(b.pop)} d'habitants pour ${n(b.sup)} km² (≈ ${n(Math.round(b.pop / b.sup))} hab./km²).`,
      _signature: `vf|${a.nom}|${b.nom}|${dense}`,
      difficulte: 2,
    };
  }],
]);

// =====================================================================================
// 14. Rappel P5 : vocabulaire de l'eau (hydrographie) et du relief
// =====================================================================================
// Schéma d'un fleuve : source en montagne, méandre, affluent, confluent, embouchure (estuaire ou delta).
// Dessiné avec la mer à droite ; `miroir` la met à gauche.
const ELEMENTS_EAU = {
  source: { nom: 'la source', def: 'l\'endroit où le cours d\'eau prend naissance' },
  meandre: { nom: 'un méandre', def: 'une grande boucle (courbe) du cours d\'eau' },
  affluent: { nom: 'un affluent', def: 'un cours d\'eau qui se jette dans un autre cours d\'eau' },
  confluent: { nom: 'le confluent', def: 'l\'endroit où deux cours d\'eau se rejoignent' },
  embouchure: { nom: 'l\'embouchure', def: 'l\'endroit où le fleuve se jette dans la mer' },
};
function svgFleuve(delta, miroir, lettres) {
  const X = (x) => (miroir ? 400 - x : x);
  const P = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x)} ${y}`).join('');
  const s = [svgOuvrir(400, 240)];
  // Mer
  s.push(`<path d="${P([[352, 0], [400, 0], [400, 240], [330, 240], [338, 190], [352, 150], [345, 110], [356, 60]])}Z" fill="#cfe6f7" stroke="#1f5fa8" stroke-width="1.2"/>`);
  s.push(`<text x="${X(378)}" y="40" font-size="13" font-weight="bold" text-anchor="middle" fill="#1f5fa8">MER</text>`);
  // Montagnes
  for (const [x, y, h] of [[30, 70, 46], [64, 64, 56], [98, 72, 40], [230, 44, 40], [262, 38, 48]]) {
    s.push(`<path d="${P([[x - 26, y], [x, y - h], [x + 26, y]])}Z" fill="#d9c7a0" stroke="#6b5a3a" stroke-width="1.2"/>`);
    s.push(`<path d="${P([[x - 8, y - h + 14], [x, y - h], [x + 8, y - h + 14]])}" fill="none" stroke="#ffffff" stroke-width="2"/>`);
  }
  const eau = 'fill="none" stroke="#1f5fa8" stroke-linecap="round" stroke-linejoin="round"';
  // Fleuve : source (70, 78) → méandre → confluent (250, 150) → embouchure
  s.push(`<path d="M${X(70)} 78 C${X(80)} 110 ${X(70)} 130 ${X(100)} 150 C${X(130)} 170 ${X(120)} 210 ${X(160)} 205 C${X(200)} 200 ${X(165)} 150 ${X(205)} 145 L${X(250)} 150 C${X(280)} 154 ${X(300)} 156 ${X(318)} 158" ${eau} stroke-width="4"/>`);
  // Affluent : depuis les montagnes de droite (246, 60) jusqu'au confluent
  s.push(`<path d="M${X(246)} 62 C${X(258)} 90 ${X(236)} 110 ${X(250)} 150" ${eau} stroke-width="2.6"/>`);
  if (delta) {
    s.push(`<path d="${P([[314, 158], [366, 118], [374, 158], [366, 198]])}Z" fill="#dfe8c4" stroke="#6b7a3a" stroke-width="1.2"/>`);
    s.push(`<path d="${P([[314, 158], [362, 124]])} M${X(314)} 158 L${X(372)} 158 M${X(314)} 158 L${X(362)} 192 M${X(338)} 158 L${X(352)} 140" ${eau} stroke-width="2.6"/>`);
  } else {
    s.push(`<path d="${P([[312, 154], [350, 136], [354, 178], [312, 162]])}Z" fill="#cfe6f7" stroke="#1f5fa8" stroke-width="2"/>`);
  }
  s.push(`<circle cx="${X(70)}" cy="78" r="3.5" fill="#1f5fa8"/>`);
  const pos = { source: [70, 96], meandre: [150, 222], affluent: [228, 100], confluent: [250, 172], embouchure: [326, 182] };
  for (const [k, l] of Object.entries(lettres)) {
    const [x, y] = pos[k];
    s.push(pastille(X(x), y, l));
  }
  s.push('</svg>');
  return s.join('');
}
// Profil du relief : mer, plaine, plateau entaillé par une vallée (deux versants), montagne.
function profilRelief(rng) {
  const plaine = rng.pick([20, 40, 60, 80]);
  const plateau = rng.int(3, 6) * 100;
  const fond = plateau - rng.int(2, 3) * 100;
  const sommet = rng.int(9, 13) * 100;
  return { plaine, plateau, fond, sommet };
}
function svgRelief(p, lettres, pointAlt) {
  const s = [svgOuvrir(400, 236)];
  const Y = (a) => 196 - a * 0.13;
  const pts = [[44, Y(0)], [70, Y(0)], [78, Y(p.plaine)], [140, Y(p.plaine)], [168, Y(p.plateau)], [212, Y(p.plateau)], [236, Y(p.fond)], [246, Y(p.fond)], [270, Y(p.plateau)], [300, Y(p.plateau)], [340, Y(p.sommet)], [368, Y(p.plateau + 100)], [392, Y(p.plateau + 50)], [392, 200], [44, 200]];
  for (let a = 0; a <= 1300; a += 100) {
    s.push(`<line x1="44" y1="${r1(Y(a))}" x2="392" y2="${r1(Y(a))}" stroke="${a % 500 === 0 ? '#b8c0cc' : '#e3e7ee'}" stroke-width="1"/>`);
    if (a % 200 === 0) s.push(`<text x="40" y="${r1(Y(a) + 4)}" font-size="12" text-anchor="end" fill="#1c2333">${n(a)}</text>`);
  }
  s.push(`<text x="8" y="16" font-size="12" font-weight="bold" fill="#1c2333">Altitude (m)</text>`);
  s.push(`<path d="M44 ${r1(Y(0))} L70 ${r1(Y(0))} L70 200 L44 200 Z" fill="#cfe6f7" stroke="none"/>`);
  s.push(`<path d="M${pts.slice(1).map(([x, y]) => `${x} ${r1(y)}`).join('L')}Z" fill="#e6d7b0" stroke="#6b5a3a" stroke-width="1.6" stroke-linejoin="round"/>`);
  s.push(`<line x1="44" y1="${r1(Y(0))}" x2="70" y2="${r1(Y(0))}" stroke="#1f5fa8" stroke-width="2"/>`);
  s.push(`<circle cx="241" cy="${r1(Y(p.fond) - 2)}" r="3.5" fill="#1f5fa8"/>`);
  s.push('<line x1="44" y1="200" x2="392" y2="200" stroke="#1c2333" stroke-width="1.2"/><line x1="44" y1="20" x2="44" y2="200" stroke="#1c2333" stroke-width="1.2"/>');
  const pos = { mer: [57, Y(0) + 14], plaine: [108, Y(p.plaine) - 16], plateau: [190, Y(p.plateau) - 16], vallee: [241, Y(p.fond) + 16], versant: [258, (Y(p.fond) + Y(p.plateau)) / 2 - 2], montagne: [340, Y(p.sommet) - 16] };
  for (const [k, l] of Object.entries(lettres)) s.push(pastille(pos[k][0], pos[k][1], l));
  if (pointAlt) {
    const [x, a] = pointAlt;
    s.push(`<circle cx="${x}" cy="${r1(Y(a))}" r="4.5" fill="#b3261e" stroke="#ffffff" stroke-width="1.5"/>`);
    s.push(pastille(x, Y(a) - 17, pointAlt[2]));
  }
  s.push('</svg>');
  return s.join('');
}
const ELEMENTS_RELIEF = {
  plaine: { nom: 'une plaine', def: 'une surface plane et peu élevée, où les cours d\'eau sont peu ou pas encaissés' },
  plateau: { nom: 'un plateau', def: 'une surface assez plane, plus élevée, dans laquelle les cours d\'eau sont encaissés (ils creusent des vallées)' },
  vallee: { nom: 'une vallée', def: 'un creux allongé, creusé par un cours d\'eau' },
  versant: { nom: 'un versant', def: 'une pente qui descend vers le fond d\'une vallée' },
  montagne: { nom: 'une montagne', def: 'un relief d\'altitude élevée, avec de fortes pentes' },
  mer: { nom: 'la mer', def: 'le niveau 0 à partir duquel on mesure l\'altitude' },
};
const VOCAB_EAU = [
  { def: 'L\'endroit où un cours d\'eau prend naissance', ok: 'La source', ko: ['L\'embouchure', 'Le confluent', 'Le méandre'] },
  { def: 'L\'endroit où deux cours d\'eau se rejoignent', ok: 'Le confluent', ko: ['La source', 'L\'embouchure', 'Le delta'] },
  { def: 'Un cours d\'eau qui se jette dans un autre cours d\'eau', ok: 'Un affluent', ko: ['Un fleuve', 'Un estuaire', 'Un méandre'] },
  { def: 'L\'endroit où un fleuve se jette dans la mer', ok: 'L\'embouchure', ko: ['La source', 'Le confluent', 'Le méandre'] },
  { def: 'Une embouchure large, en forme d\'entonnoir, où la marée remonte', ok: 'Un estuaire', ko: ['Un delta', 'Une source', 'Un méandre'] },
  { def: 'Une embouchure où le fleuve se divise en plusieurs bras, formant une sorte de triangle', ok: 'Un delta', ko: ['Un estuaire', 'Un confluent', 'Une source'] },
  { def: 'Une grande boucle que forme un cours d\'eau', ok: 'Un méandre', ko: ['Un delta', 'Un confluent', 'Une source'] },
  { def: 'Un cours d\'eau qui se jette dans la mer', ok: 'Un fleuve', ko: ['Un affluent', 'Un méandre', 'Un confluent'] },
  { def: 'Une surface plane et peu élevée, où les cours d\'eau sont peu ou pas encaissés', ok: 'Une plaine', ko: ['Un plateau', 'Une montagne', 'Un versant'] },
  { def: 'Une surface assez plane et élevée, entaillée par des cours d\'eau encaissés', ok: 'Un plateau', ko: ['Une plaine', 'Une vallée', 'Un versant'] },
  { def: 'Un relief d\'altitude élevée, avec de fortes pentes', ok: 'Une montagne', ko: ['Une plaine', 'Un plateau', 'Une vallée'] },
  { def: 'Un creux allongé creusé par un cours d\'eau', ok: 'Une vallée', ko: ['Un plateau', 'Une plaine', 'Un sommet'] },
  { def: 'Chacune des deux pentes d\'une vallée', ok: 'Un versant', ko: ['Un sommet', 'Une plaine', 'Un confluent'] },
  { def: 'La hauteur d\'un lieu par rapport au niveau de la mer', ok: 'L\'altitude', ko: ['La longueur', 'La profondeur', 'La latitude'] },
];
const BELGIQUE_EAU = [
  { q: 'La Sambre se jette dans la Meuse à Namur. Pour la Meuse, la Sambre est…', ok: 'un affluent', ko: ['un fleuve', 'un estuaire', 'un delta'],
    expl: 'La Sambre se jette dans un autre cours d\'eau (la Meuse) : c\'est un affluent de la Meuse.' },
  { q: 'Namur est construite à l\'endroit où la Sambre rejoint la Meuse. Cet endroit s\'appelle…', ok: 'un confluent', ko: ['une source', 'une embouchure', 'un méandre'],
    expl: 'Le confluent est l\'endroit où deux cours d\'eau se rejoignent. Liège (Ourthe et Meuse) et Gand (Lys et Escaut) sont aussi des villes de confluent.' },
  { q: 'L\'Escaut se jette dans la mer du Nord, aux Pays-Bas, par une large embouchure en forme d\'entonnoir. Comment appelle-t-on ce type d\'embouchure ?', ok: 'Un estuaire', ko: ['Un delta', 'Un confluent', 'Un méandre'],
    expl: 'Une embouchure large et évasée, où la marée remonte, est un estuaire. L\'estuaire de l\'Escaut mène au port d\'Anvers.' },
  { q: 'En Égypte, le Nil se divise en plusieurs bras avant de se jeter dans la mer Méditerranée. Comment appelle-t-on cette embouchure ?', ok: 'Un delta', ko: ['Un estuaire', 'Un confluent', 'Une source'],
    expl: 'Le Nil forme un delta : il se divise en plusieurs bras, sur une zone en forme de triangle (comme la lettre grecque delta, Δ).' },
  { q: 'La Meuse se jette dans la mer du Nord. C\'est donc…', ok: 'un fleuve', ko: ['une rivière', 'un affluent', 'un ruisseau'],
    expl: 'Un fleuve se jette dans la mer ; une rivière se jette dans un autre cours d\'eau. La Meuse et l\'Escaut sont les deux grands fleuves de Belgique.' },
  { q: 'Dans quel pays la Meuse prend-elle sa source ?', ok: 'En France', ko: ['En Belgique', 'Aux Pays-Bas', 'En Allemagne'],
    expl: 'La Meuse prend sa source en France (plateau de Langres), traverse la Belgique (Dinant, Namur, Liège) et se jette dans la mer du Nord aux Pays-Bas.' },
  { q: 'L\'Ardenne est une région élevée, assez plane, où les rivières coulent au fond de vallées profondes. C\'est…', ok: 'un plateau', ko: ['une plaine', 'une montagne', 'un delta'],
    expl: 'L\'Ardenne est un plateau : une surface assez plane et élevée, entaillée par des vallées encaissées (Semois, Ourthe, Amblève…).' },
  { q: 'La Flandre, près de la mer du Nord, est une région basse et plate. C\'est…', ok: 'une plaine', ko: ['un plateau', 'une montagne', 'un versant'],
    expl: 'La basse Belgique (Flandre, polders) est une plaine : une surface plane et peu élevée.' },
  { q: 'Quelle est l\'altitude du point le plus haut de Belgique, le signal de Botrange ?', ok: 'Environ 700 m', ko: ['Environ 70 m', 'Environ 2 000 m', 'Environ 4 800 m'],
    expl: 'Le signal de Botrange, dans les Hautes Fagnes, culmine à 694 m. Le mont Blanc, le plus haut sommet des Alpes, dépasse 4 800 m.' },
  { q: 'Près de Bouillon, la Semois dessine de grandes boucles. Comment appelle-t-on ces boucles ?', ok: 'Des méandres', ko: ['Des deltas', 'Des confluents', 'Des estuaires'],
    expl: 'Un méandre est une grande boucle d\'un cours d\'eau. La Semois en forme de nombreux, autour de Bouillon notamment.' },
];

const eauRelief = famille('er', [
  // Schéma d'un fleuve : lettre → élément
  [5, (rng) => {
    const delta = rng.next() < 0.5; const miroir = rng.next() < 0.5;
    const k = rng.int(3, 5);
    const elts = rng.shuffle(Object.keys(ELEMENTS_EAU)).slice(0, k);
    const ls = rng.shuffle(LETTRES).slice(0, k);
    const lettres = Object.fromEntries(elts.map((e, i) => [e, ls[i]]));
    const cible = rng.pick(elts);
    const noms = Object.values(ELEMENTS_EAU).map((x) => maj(x.nom));
    const q = qcm(rng, maj(ELEMENTS_EAU[cible].nom), noms);
    return {
      ...q, figure: svgFleuve(delta, miroir, lettres),
      enonce: `Observe ce schéma d'un fleuve. Que désigne la lettre ${lettres[cible]} ?`,
      explication: `La lettre ${lettres[cible]} désigne ${ELEMENTS_EAU[cible].nom} : ${ELEMENTS_EAU[cible].def}.`,
      _signature: `fl|${delta}|${miroir}|${elts.map((e) => e + lettres[e]).join(',')}|${cible}|${cle(q.choix)}`,
      cleContenu: `fl|${delta}|${miroir}|${elts.map((e) => e + lettres[e]).join(',')}|${cible}`,
      difficulte: 2,
    };
  }],
  // Schéma d'un fleuve : estuaire ou delta ?
  [2, (rng) => {
    const delta = rng.next() < 0.5; const miroir = rng.next() < 0.5;
    const l = rng.pick(LETTRES);
    const choix = ['Un estuaire', 'Un delta'];
    return {
      type: 'qcm', choix, reponse: delta ? 1 : 0, figure: svgFleuve(delta, miroir, { embouchure: l }),
      enonce: `Observe ce schéma. Quelle forme a l'embouchure du fleuve (lettre ${l}) ?`,
      explication: delta
        ? 'Le fleuve se divise en plusieurs bras avant d\'atteindre la mer : c\'est un delta (comme le Nil ou le Rhône).'
        : 'L\'embouchure s\'élargit en forme d\'entonnoir : c\'est un estuaire (comme l\'Escaut ou la Seine).',
      _signature: `ed|${delta}|${miroir}|${l}`, cleContenu: `ed|${delta}|${miroir}|${l}`,
      difficulte: 2,
    };
  }],
  // Profil du relief : lettre → élément
  [4, (rng) => {
    const p = profilRelief(rng);
    const k = rng.int(3, 5);
    const elts = rng.shuffle(Object.keys(ELEMENTS_RELIEF).filter((e) => e !== 'mer')).slice(0, k);
    const ls = rng.shuffle(LETTRES).slice(0, k);
    const lettres = Object.fromEntries(elts.map((e, i) => [e, ls[i]]));
    const cible = rng.pick(elts);
    const noms = Object.keys(ELEMENTS_RELIEF).filter((e) => e !== 'mer').map((e) => maj(ELEMENTS_RELIEF[e].nom));
    const q = qcm(rng, maj(ELEMENTS_RELIEF[cible].nom), noms);
    return {
      ...q, figure: svgRelief(p, lettres),
      enonce: `Observe ce profil du relief. Que désigne la lettre ${lettres[cible]} ?`,
      explication: `La lettre ${lettres[cible]} désigne ${ELEMENTS_RELIEF[cible].nom} : ${ELEMENTS_RELIEF[cible].def}.`,
      _signature: `rel|${p.plaine},${p.plateau},${p.fond},${p.sommet}|${elts.map((e) => e + lettres[e]).join(',')}|${cible}|${cle(q.choix)}`,
      cleContenu: `rel|${p.plaine},${p.plateau},${p.fond},${p.sommet}|${elts.map((e) => e + lettres[e]).join(',')}|${cible}`,
      difficulte: 2,
    };
  }],
  // Profil du relief : lire une altitude
  [3, (rng) => {
    const p = profilRelief(rng);
    const l = rng.pick(LETTRES);
    const quoi = rng.pick(['plateau', 'fond', 'sommet']);
    const alt = p[quoi];
    const x = quoi === 'plateau' ? rng.pick([184, 286]) : quoi === 'fond' ? 241 : 340;
    const faux = rng.shuffle([alt - 200, alt - 100, alt + 100, alt + 200].filter((a) => a > 0)).slice(0, 3);
    const choix = rng.shuffle([alt, ...faux]).map((a) => `${n(a)} m`);
    return {
      type: 'qcm', choix, reponse: choix.indexOf(`${n(alt)} m`), figure: svgRelief(p, {}, [x, alt, l]),
      enonce: `Observe ce profil du relief. Quelle est l'altitude du point ${l} ?`,
      explication: `On suit la ligne horizontale du point ${l} jusqu'à l'axe des altitudes : ${n(alt)} m. L'altitude est la hauteur par rapport au niveau de la mer (0 m). Chaque ligne du quadrillage représente 100 m.`,
      _signature: `alt|${p.plaine},${p.plateau},${p.fond},${p.sommet}|${quoi}|${l}|${cle(choix)}`,
      cleContenu: `alt|${p.plaine},${p.plateau},${p.fond},${p.sommet}|${quoi}|${l}`,
      difficulte: 2,
    };
  }],
  // Définitions
  [3, (rng) => {
    const it = rng.pick(VOCAB_EAU);
    const q = qcm(rng, it.ok, it.ko);
    return {
      ...q,
      enonce: `Quel mot correspond à cette définition : « ${it.def} » ?`,
      explication: `${it.ok} : ${leLa(it.def)}.`,
      _signature: `def|${it.ok}|${cle(q.choix)}`, cleContenu: `def|${it.ok}`,
      difficulte: 1,
    };
  }],
  [3, (rng) => ({ ...depuisBanque(rng, BELGIQUE_EAU, 'be'), difficulte: 2 })],
]);

// =====================================================================================
// 15. Rappel P5 : comparer des vues aériennes (avant / après, habitat, ville / campagne)
// =====================================================================================
const VA = { cols: 8, rows: 5, w: 46, h: 28, x0: 16 };
const COUL_VA = {
  champ: '#f3e3a0', prairie: '#cfe8b0', foret: '#86b872', maisons: '#eeeeee', usine: '#d3d5da', immeubles: '#d6d6d6',
};
function celluleVA(type, x, y, rng) {
  const { w, h } = VA;
  const s = [`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${COUL_VA[type]}" stroke="#ffffff" stroke-width="1"/>`];
  if (type === 'champ') for (let k = 1; k < 4; k++) s.push(`<line x1="${x + 3}" y1="${y + k * 7}" x2="${x + w - 3}" y2="${y + k * 7}" stroke="#cdb562" stroke-width="1"/>`);
  if (type === 'foret') for (const [dx, dy] of [[10, 9], [24, 8], [37, 11], [16, 20], [31, 20]]) s.push(`<circle cx="${x + dx}" cy="${y + dy}" r="6" fill="#4f8a3e"/>`);
  if (type === 'maisons') for (const [dx, dy] of [[5, 4], [25, 5], [9, 16], [29, 17]]) s.push(`<rect x="${x + dx}" y="${y + dy}" width="11" height="8" fill="#c0504d" stroke="#1c2333" stroke-width="0.8"/>`);
  if (type === 'usine') s.push(`<rect x="${x + 4}" y="${y + 5}" width="30" height="17" fill="#8a8f99" stroke="#1c2333" stroke-width="0.8"/><rect x="${x + 36}" y="${y + 4}" width="6" height="18" fill="#5b6475"/>`);
  if (type === 'immeubles') s.push(`<rect x="${x + 4}" y="${y + 4}" width="16" height="20" fill="#9aa0aa" stroke="#1c2333" stroke-width="0.8"/><rect x="${x + 25}" y="${y + 4}" width="17" height="20" fill="#9aa0aa" stroke="#1c2333" stroke-width="0.8"/>`);
  return s.join('');
}
function vueVA(sc, y0, titre) {
  const { cols, rows, w, h, x0 } = VA;
  const s = [`<text x="${x0}" y="${y0 - 6}" font-size="13" font-weight="bold" fill="#1c2333">${esc(titre)}</text>`];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s.push(celluleVA(sc.g[r][c], x0 + c * w, y0 + r * h));
  const yR = y0 + sc.rangRiviere * h;
  s.push(`<path d="M${x0} ${yR} C${x0 + 60} ${yR - 12} ${x0 + 110} ${yR + 12} ${x0 + 184} ${yR} S${x0 + 300} ${yR - 10} ${x0 + cols * w} ${yR + 2}" fill="none" stroke="#3b82c4" stroke-width="5"/>`);
  const xRo = x0 + sc.colRoute * w;
  s.push(`<line x1="${xRo}" y1="${y0}" x2="${xRo}" y2="${y0 + rows * h}" stroke="#8a8f99" stroke-width="5"/>`);
  if (sc.autoroute) {
    const yA = y0 + sc.autoroute * h;
    s.push(`<line x1="${x0}" y1="${yA}" x2="${x0 + cols * w}" y2="${yA}" stroke="#5b6475" stroke-width="9"/><line x1="${x0}" y1="${yA}" x2="${x0 + cols * w}" y2="${yA}" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="6 5"/>`);
  }
  s.push(`<rect x="${x0}" y="${y0}" width="${cols * w}" height="${rows * h}" fill="none" stroke="#1c2333" stroke-width="1.4"/>`);
  return s.join('');
}
function legendeVA(y, types, autoroute) {
  const items = [...types.map((t) => ({ t })), { t: 'route' }, ...(autoroute ? [{ t: 'autoroute' }] : []), { t: 'riviere' }];
  const noms = { champ: 'Champs', prairie: 'Prairies', foret: 'Forêt', maisons: 'Maisons', usine: 'Usines', immeubles: 'Immeubles', route: 'Route', autoroute: 'Autoroute', riviere: 'Rivière' };
  const s = [];
  items.forEach((it, i) => {
    const x = 16 + (i % 4) * 94; const yy = y + Math.floor(i / 4) * 22;
    if (COUL_VA[it.t]) s.push(`<rect x="${x}" y="${yy}" width="16" height="13" fill="${COUL_VA[it.t]}" stroke="#1c2333" stroke-width="0.8"/>${it.t === 'maisons' ? `<rect x="${x + 4}" y="${yy + 3}" width="8" height="7" fill="#c0504d"/>` : it.t === 'foret' ? `<circle cx="${x + 8}" cy="${yy + 6.5}" r="5" fill="#4f8a3e"/>` : it.t === 'usine' ? `<rect x="${x + 3}" y="${yy + 3}" width="10" height="7" fill="#8a8f99"/>` : ''}`);
    else s.push(`<line x1="${x}" y1="${yy + 6.5}" x2="${x + 16}" y2="${yy + 6.5}" stroke="${it.t === 'riviere' ? '#3b82c4' : it.t === 'autoroute' ? '#5b6475' : '#8a8f99'}" stroke-width="${it.t === 'autoroute' ? 8 : 5}"/>`);
    s.push(`<text x="${x + 21}" y="${yy + 11}" font-size="12" fill="#1c2333">${noms[it.t]}</text>`);
  });
  return s.join('');
}
// Scène rurale de départ : champs et prairies, un bois, un village le long de la route, une rivière.
function sceneVA(rng) {
  const { cols, rows } = VA;
  const g = Array.from({ length: rows }, () => Array.from({ length: cols }, () => (rng.next() < 0.55 ? 'champ' : 'prairie')));
  const colRoute = rng.int(3, 5);
  const rangRiviere = rng.pick([3, 4]);
  // bois de 2 × 2 dans un coin
  const fr = rng.pick([0, 3]); const fc = rng.pick([0, 6]);
  for (const [r, c] of [[fr, fc], [fr, fc + 1], [fr + 1, fc], [fr + 1, fc + 1]]) g[r][c] = 'foret';
  // village : 2 cellules contre la route
  const vr = rng.int(1, 2);
  g[vr][colRoute - 1] = 'maisons'; g[vr][colRoute] = 'maisons';
  return { g, colRoute, rangRiviere, autoroute: 0 };
}
const copieVA = (sc) => ({ ...sc, g: sc.g.map((r) => r.slice()) });
const voisins4 = (r, c) => [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, b]) => a >= 0 && a < VA.rows && b >= 0 && b < VA.cols);
const MODIFS_VA = {
  lotissement: { txt: 'Des maisons ont été construites à la place de champs ou de prairies.', perm: 'Le nombre de maisons',
    appl(sc, rng) {
      const cand = []; sc.g.forEach((row, r) => row.forEach((t, c) => { if (t === 'maisons') for (const [a, b] of voisins4(r, c)) if (['champ', 'prairie'].includes(sc.g[a][b])) cand.push([a, b]); }));
      const pris = rng.shuffle([...new Map(cand.map((x) => [x.join(), x])).values()]).slice(0, 3);
      for (const [a, b] of pris) sc.g[a][b] = 'maisons';
      return pris.length >= 2;
    } },
  deboisement: { txt: 'Une partie de la forêt a été abattue pour faire des champs.', perm: 'La surface couverte par la forêt', exclut: 'reboisement',
    appl(sc, rng) {
      const f = []; sc.g.forEach((row, r) => row.forEach((t, c) => { if (t === 'foret') f.push([r, c]); }));
      const pris = rng.shuffle(f).slice(0, rng.int(2, 3));
      for (const [a, b] of pris) sc.g[a][b] = 'champ';
      return pris.length >= 2;
    } },
  reboisement: { txt: 'Des arbres ont été plantés sur d\'anciens champs : la forêt s\'est agrandie.', perm: 'La surface couverte par la forêt', exclut: 'deboisement',
    appl(sc, rng) {
      const cand = []; sc.g.forEach((row, r) => row.forEach((t, c) => { if (t === 'foret') for (const [a, b] of voisins4(r, c)) if (sc.g[a][b] === 'champ') cand.push([a, b]); }));
      const pris = rng.shuffle([...new Map(cand.map((x) => [x.join(), x])).values()]).slice(0, 2);
      for (const [a, b] of pris) sc.g[a][b] = 'foret';
      return pris.length >= 2;
    } },
  zoning: { txt: 'Des usines (un zoning industriel) ont été construites.', perm: 'Le nombre d\'usines',
    appl(sc, rng) {
      const r0 = rng.pick([0, 4].filter((r) => sc.g[r][sc.colRoute] !== 'maisons' && sc.g[r][sc.colRoute] !== 'foret'));
      if (r0 === undefined) return false;
      const cells = [[r0, sc.colRoute], [r0, sc.colRoute - 1]].filter(([a, b]) => ['champ', 'prairie'].includes(sc.g[a][b]));
      for (const [a, b] of cells) sc.g[a][b] = 'usine';
      return cells.length === 2;
    } },
  autoroute: { txt: 'Une autoroute a été construite.', perm: 'Le réseau des routes',
    appl(sc) { sc.autoroute = sc.rangRiviere === 3 ? 1 : 2; return true; } },
};
const PERMANENT_VA = ['Le tracé de la rivière'];
const FAUX_VA = ['La rivière a changé de tracé.', 'La route principale a disparu.', 'Le village a été entièrement détruit.'];

function avantApres(rng, nbMod) {
  const avant = sceneVA(rng);
  const apres = copieVA(avant);
  const faites = [];
  for (const k of rng.shuffle(Object.keys(MODIFS_VA))) {
    if (faites.length === nbMod) break;
    if (faites.some((f) => MODIFS_VA[f].exclut === k)) continue;
    const essai = copieVA(apres);
    if (MODIFS_VA[k].appl(essai, rng)) { Object.assign(apres, essai); faites.push(k); }
  }
  if (faites.length < nbMod) return null;
  const a1 = rng.int(1965, 1985); const a2 = rng.int(2015, 2024);
  const types = [...new Set([...avant.g.flat(), ...apres.g.flat()])];
  const ordreT = ['champ', 'prairie', 'foret', 'maisons', 'usine', 'immeubles'].filter((t) => types.includes(t));
  const yL = 26 + 140 + 30 + 140 + 14;
  const hauteur = yL + Math.ceil((ordreT.length + 2 + (apres.autoroute ? 1 : 0)) / 4) * 22 + 4;
  const figure = `${svgOuvrir(400, hauteur)}${vueVA(avant, 26, `Vue 1 : en ${a1}`)}${vueVA(apres, 26 + 140 + 30, `Vue 2 : en ${a2}`)}${legendeVA(yL, ordreT, apres.autoroute)}</svg>`;
  const sig = `${avant.g.flat().join('').length}|${avant.g.map((r) => r.map((t) => t[0]).join('')).join('/')}|${apres.g.map((r) => r.map((t) => t[0]).join('')).join('/')}|${avant.colRoute}${avant.rangRiviere}${apres.autoroute}|${a1}|${a2}`;
  return { figure, faites, a1, a2, sig };
}

// Habitat groupé, dispersé ou linéaire (une seule vue).
function svgHabitat(rng, type) {
  const W = 368; const H = 190; const x0 = 16; const y0 = 12;
  const s = [svgOuvrir(400, 252)];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) s.push(`<rect x="${x0 + c * 46}" y="${y0 + r * 38}" width="46" height="38" fill="${rng.next() < 0.55 ? COUL_VA.champ : COUL_VA.prairie}" stroke="#ffffff" stroke-width="1"/>`);
  const maisons = [];
  const route = rng.int(70, 120);
  s.push(`<line x1="${x0}" y1="${y0 + route}" x2="${x0 + W}" y2="${y0 + route}" stroke="#8a8f99" stroke-width="6"/>`);
  if (type === 'groupe') {
    const cx = rng.int(120, 250); const cy = y0 + route;
    s.push(`<line x1="${x0 + cx}" y1="${y0}" x2="${x0 + cx}" y2="${y0 + H}" stroke="#8a8f99" stroke-width="5"/>`);
    for (let e = 0; e < 400 && maisons.length < 16; e++) {
      const x = x0 + cx + rng.int(-58, 58); const y = cy + rng.int(-50, 50);
      if (Math.abs(y - cy) < 9 || Math.abs(x - x0 - cx) < 9) continue;
      if (maisons.every(([a, b]) => Math.abs(a - x) > 15 || Math.abs(b - y) > 13)) maisons.push([x, y]);
    }
  } else if (type === 'disperse') {
    for (let e = 0; e < 400 && maisons.length < 7; e++) {
      const x = x0 + rng.int(14, W - 14); const y = y0 + rng.int(12, H - 12);
      if (Math.abs(y - y0 - route) < 12) continue;
      if (maisons.every(([a, b]) => Math.hypot(a - x, b - y) > 80)) maisons.push([x, y]);
    }
    for (const [x, y] of maisons) s.push(`<line x1="${x}" y1="${y}" x2="${x}" y2="${y0 + route}" stroke="#b9a77a" stroke-width="2"/>`);
  } else {
    for (let x = x0 + rng.int(14, 30); x < x0 + W - 12; x += rng.int(24, 30)) {
      maisons.push([x, y0 + route - 14]);
      if (rng.next() < 0.8) maisons.push([x + rng.int(-4, 4), y0 + route + 14]);
    }
  }
  for (const [x, y] of maisons) s.push(`<rect x="${x - 6}" y="${y - 5}" width="12" height="10" fill="#c0504d" stroke="#1c2333" stroke-width="0.9"/>`);
  s.push(`<rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="none" stroke="#1c2333" stroke-width="1.4"/>`);
  s.push(`<rect x="16" y="220" width="12" height="10" fill="#c0504d" stroke="#1c2333" stroke-width="0.9"/><text x="34" y="229" font-size="12" fill="#1c2333">Maison ou ferme</text>`);
  s.push(`<line x1="150" y1="225" x2="168" y2="225" stroke="#8a8f99" stroke-width="5"/><text x="174" y="229" font-size="12" fill="#1c2333">Route</text>`);
  s.push(`<rect x="230" y="219" width="16" height="12" fill="${COUL_VA.champ}" stroke="#1c2333" stroke-width="0.8"/><rect x="250" y="219" width="16" height="12" fill="${COUL_VA.prairie}" stroke="#1c2333" stroke-width="0.8"/><text x="272" y="229" font-size="12" fill="#1c2333">Champs, prairies</text>`);
  s.push('</svg>');
  return { figure: s.join(''), sig: maisons.map(([x, y]) => `${x},${y}`).join(';') };
}
const HABITATS = {
  groupe: { nom: 'Un habitat groupé', expl: 'Les maisons sont serrées les unes contre les autres autour d\'un carrefour : c\'est un habitat groupé (un village).' },
  disperse: { nom: 'Un habitat dispersé', expl: 'Les maisons (des fermes) sont isolées, loin les unes des autres, au milieu des champs : c\'est un habitat dispersé.' },
  lineaire: { nom: 'Un habitat linéaire (en ruban)', expl: 'Les maisons sont alignées le long de la route : c\'est un habitat linéaire (en ruban).' },
};

const vuesAeriennes = famille('va', [
  // Quel changement ?
  [5, (rng) => {
    const r = avantApres(rng, rng.int(1, 2));
    if (!r) return null;
    const bon = rng.pick(r.faites);
    const pasFaites = Object.keys(MODIFS_VA).filter((k) => !r.faites.includes(k));
    const q = qcm(rng, MODIFS_VA[bon].txt, [...pasFaites.map((k) => MODIFS_VA[k].txt), ...FAUX_VA]);
    return {
      ...q, figure: r.figure,
      enonce: `Compare ces deux vues aériennes du même endroit. Quel changement s'est produit entre ${r.a1} et ${r.a2} ?`,
      explication: `${MODIFS_VA[bon].txt}${r.faites.length > 1 ? ` On observe aussi : ${leLa(MODIFS_VA[r.faites.find((k) => k !== bon)].txt)}` : ''} La rivière et la route principale, elles, n'ont pas changé.`,
      _signature: `ch|${r.sig}|${bon}|${cle(q.choix)}`, cleContenu: `ch|${r.sig}|${bon}`,
      difficulte: 2,
    };
  }],
  // Qu'est-ce qui n'a pas changé ?
  [3, (rng) => {
    const r = avantApres(rng, rng.int(2, 3));
    if (!r) return null;
    const perm = [...new Set(r.faites.map((k) => MODIFS_VA[k].perm))];
    if (perm.length < 2) return null;
    const bonne = rng.pick([...PERMANENT_VA, ...(r.faites.includes('autoroute') ? [] : ['Le tracé de la route principale'])]);
    const q = qcm(rng, bonne, perm);
    return {
      ...q, figure: r.figure,
      enonce: `Compare ces deux vues aériennes du même endroit (${r.a1} et ${r.a2}). Quel élément n'a pas changé ?`,
      explication: `${bonne} est identique sur les deux vues : c'est une permanence. Ont changé : ${r.faites.map((k) => leLa(MODIFS_VA[k].txt).replace(/\.$/, '')).join(' ; ')}.`,
      _signature: `pe|${r.sig}|${bonne}|${cle(q.choix)}`, cleContenu: `pe|${r.sig}|${bonne}`,
      difficulte: 2,
    };
  }],
  // Type d'habitat
  [4, (rng) => {
    const type = rng.pick(Object.keys(HABITATS));
    const h = svgHabitat(rng, type);
    const choix = Object.values(HABITATS).map((x) => x.nom);
    return {
      type: 'qcm', choix, reponse: choix.indexOf(HABITATS[type].nom), figure: h.figure, fiche: 'hg-paysages',
      enonce: 'Observe cette vue aérienne. Quel type d\'habitat montre-t-elle ?',
      explication: HABITATS[type].expl,
      _signature: `hab|${type}|${h.sig}`, cleContenu: `hab|${type}|${h.sig}`,
      difficulte: 1,
    };
  }],
  // Ville ou campagne ?
  [2, (rng) => {
    const rural = sceneVA(rng);
    const urbain = copieVA(rural);
    urbain.g = urbain.g.map((row, r) => row.map((t, c) => (Math.abs(c - urbain.colRoute) <= 1 || r % 2 === 0 ? (rng.next() < 0.75 ? 'immeubles' : 'maisons') : (rng.next() < 0.3 ? 'usine' : 'immeubles'))));
    urbain.g[rng.int(0, 4)][rng.pick([0, 7])] = 'prairie';
    const urbainEn1 = rng.next() < 0.5;
    const [v1, v2] = urbainEn1 ? [urbain, rural] : [rural, urbain];
    const types = ['champ', 'prairie', 'foret', 'maisons', 'immeubles', 'usine'].filter((t) => [...v1.g.flat(), ...v2.g.flat()].includes(t));
    const yL = 26 + 140 + 30 + 140 + 14;
    const figure = `${svgOuvrir(400, yL + Math.ceil((types.length + 2) / 4) * 22 + 4)}${vueVA(v1, 26, 'Vue 1')}${vueVA(v2, 26 + 140 + 30, 'Vue 2')}${legendeVA(yL, types, 0)}</svg>`;
    const chercheRural = rng.next() < 0.5;
    const choix = ['Vue 1', 'Vue 2'];
    const bonne = chercheRural === urbainEn1 ? 'Vue 2' : 'Vue 1';
    return {
      type: 'qcm', choix, reponse: choix.indexOf(bonne), figure, fiche: 'hg-paysages',
      enonce: `Observe ces deux vues aériennes. Laquelle montre un paysage ${chercheRural ? 'rural (la campagne)' : 'urbain (la ville)'} ?`,
      explication: `${bonne} : ${chercheRural ? 'on y voit surtout des champs, des prairies et un bois, avec un petit village : c\'est un paysage rural.' : 'on y voit surtout des immeubles, des maisons serrées et des usines : c\'est un paysage urbain.'}`,
      _signature: `vc|${v1.g.flat().join('')}|${v2.g.flat().join('')}|${chercheRural}`, cleContenu: `vc|${v1.g.flat().join('')}|${v2.g.flat().join('')}|${chercheRural}`,
      difficulte: 1,
    };
  }],
]);

export const GENERATEURS = {
  hg_tc_vues_aeriennes: vuesAeriennes,
  hg_tc_eau_relief: eauRelief,
  hg_tc_peuplement_be: peuplementBe,
  hg_tc_change: changeContinue,
  hg_tc_pertinence: pertinence,
  hg_tc_outils_info: outilsInfo,
  hg_tc_planisphere: planisphere,
  hg_tc_millenaires: millenaires,
  hg_tc_moments: moments,
  hg_tc_galloromains: galloromains,
  hg_tc_migrations: migrations,
  hg_tc_colonisations: colonisations,
  hg_tc_rechauffement: rechauffement,
  hg_tc_climatogramme: climatogramme,
  hg_tc_population: population,
};
