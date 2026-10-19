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

export const GENERATEURS = {
  hg_tc_moments: moments,
  hg_tc_galloromains: galloromains,
  hg_tc_migrations: migrations,
  hg_tc_colonisations: colonisations,
  hg_tc_rechauffement: rechauffement,
  hg_tc_climatogramme: climatogramme,
  hg_tc_population: population,
};
