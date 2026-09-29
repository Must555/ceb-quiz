// Générateurs JS spécifiques (sciences). Chaque entrée : nom → fonction (modele, rng) => question | null.
// La question renvoyée doit contenir _signature (texte stable, unique par variante).
//
// Générateur « sciences » : même principe que le générateur « faits » (base + formes), avec des
// formes supplémentaires propres aux sciences. Toute forme inconnue ici est confiée à genererFaits.
//
//   affirmation         : « Vrai ou faux ? <affirmation> »          (éléments { nom, verite: bool, pourquoi })
//   affirmation_choix   : « Laquelle de ces affirmations est vraie/fausse ? » (cible: true|false, sinon au hasard)
//   affirmation_grille  : 4 affirmations à classer Vrai / Faux
//   suite_ordre         : remettre des étapes dans l'ordre         (éléments { nom, texte, suite, rang })
//   suite_apres         : « Quelle étape vient juste après … ? »    (sens: "avant" pour l'étape précédente)
//   chaine              : chaînes alimentaires                      (éléments { nom, maillons: [...] })
//   circuit             : l'ampoule s'allume-t-elle ?               (éléments { nom, electrique, pourquoi })
//   soleil              : position du Soleil, points cardinaux et ombres (en Belgique)
//   dents_reste         : petit calcul sur les dents
//
// Les suites sont décrites dans le modèle :
//   "suites": { "papillon": { "de": "du papillon", "circulaire": false, "enonceOrdre": "…", "enonceApres": "…" } }

import { genererFaits } from './faits.js';

const liste = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const majuscule = (s) => (s ? String(s).replace(/^([«\s]*)(\p{L})/u, (_, a, b) => a + b.toUpperCase()) : s);
const nettoyer = (s) => (s == null ? s : majuscule(String(s).replace(/\s+([.,])/g, '$1').replace(/\s{2,}/g, ' ').trim()));
const remplir = (t, vars) => String(t ?? '').replace(/\{([A-Za-z_]+)\}/g, (_, k) => (vars[k] == null ? '' : String(vars[k])));

const FILLES = ['Léa', 'Inès', 'Emma', 'Louise', 'Yasmine', 'Olivia', 'Amira', 'Chloé', 'Zoé', 'Sofia', 'Maëlle', 'Alice', 'Nora', 'Lina'];
const GARCONS = ['Noah', 'Adam', 'Mohamed', 'Arthur', 'Lucas', 'Nathan', 'Louis', 'Ilyes', 'Victor', 'Jules', 'Rayan', 'Elias', 'Théo', 'Hugo'];
const PRENOMS = [...FILLES, ...GARCONS];
const pronom = (p) => (FILLES.includes(p) ? 'elle' : 'il');

function correspond(item, filtre) {
  if (!filtre) return true;
  return Object.entries(filtre).every(([k, v]) => {
    const vals = liste(item[k]);
    return Array.isArray(v) ? vals.some((x) => v.includes(x)) : vals.includes(v);
  });
}
function itemsDe(modele, forme, requis = []) {
  return (modele.items ?? []).filter((it) => correspond(it, modele.filtre) && correspond(it, forme.filtre)
    && requis.every((c) => it[c] != null && it[c] !== ''));
}
const texteDe = (it) => it.texte ?? it.nom;

// ---------- Affirmations ----------
function affirmation(modele, forme, rng) {
  const items = itemsDe(modele, forme, ['verite']);
  if (!items.length) return null;
  const it = rng.pick(items);
  return {
    _signature: it.nom, type: 'vrai_faux', reponse: it.verite === true,
    enonce: remplir(forme.enonce ?? 'Vrai ou faux ? {cle}', { cle: it.nom }),
    explication: `${it.verite ? 'Vrai' : 'Faux'}. ${it.pourquoi ?? ''}`,
    cleContenu: it.nom,
  };
}

function affirmationChoix(modele, forme, rng) {
  const items = itemsDe(modele, forme, ['verite']);
  const cible = forme.cible ?? (rng.next() < 0.5);
  const bons = items.filter((x) => x.verite === cible);
  const autres = items.filter((x) => x.verite !== cible);
  const n = (forme.choix ?? 4) - 1;
  if (!bons.length || autres.length < n) return null;
  const bon = rng.pick(bons);
  const faux = rng.shuffle(autres).slice(0, n);
  const choixItems = rng.shuffle([bon, ...faux]);
  const choix = choixItems.map((x) => x.nom);
  const cle = `${cible}|${choix.slice().sort().join('|')}`;
  return {
    _signature: cle, type: 'qcm', choix, reponse: choixItems.indexOf(bon),
    enonce: cible ? 'Laquelle de ces affirmations est vraie ?' : 'Laquelle de ces affirmations est fausse ?',
    explication: cible ? bon.pourquoi : `« ${bon.nom} » est faux. ${bon.pourquoi}`,
    cleContenu: cle,
  };
}

function affirmationGrille(modele, forme, rng) {
  const items = itemsDe(modele, forme, ['verite']);
  const n = forme.n ?? 4;
  const tires = rng.shuffle(items).slice(0, n);
  if (tires.length < n || tires.every((x) => x.verite) || tires.every((x) => !x.verite)) return null;
  const fausses = tires.filter((x) => !x.verite);
  const cle = tires.map((x) => x.nom).sort().join('|');
  return {
    _signature: cle, type: 'grille',
    enonce: forme.enonce ?? 'Vrai ou faux ? Choisis la bonne réponse pour chaque affirmation.',
    lignes: tires.map((x) => x.nom), colonnes: ['Vrai', 'Faux'],
    reponse: tires.map((x) => (x.verite ? 0 : 1)), points: n,
    explication: `${fausses.length > 1 ? 'Les affirmations fausses' : 'L\'affirmation fausse'} : ${fausses.map((x) => x.pourquoi).join(' ')}`,
    cleContenu: cle,
  };
}

// ---------- Suites (cycles, trajets, phases) ----------
function suiteDe(modele, forme, rng) {
  const noms = forme.suites ?? (forme.suite ? [forme.suite] : Object.keys(modele.suites ?? {}));
  const nom = rng.pick(noms);
  const etapes = itemsDe(modele, forme, ['rang']).filter((x) => x.suite === nom).sort((a, b) => a.rang - b.rang);
  return { nom, meta: modele.suites?.[nom] ?? {}, etapes };
}
const chaineTexte = (etapes, circulaire) => etapes.map(texteDe).join(' → ') + (circulaire ? ` → ${texteDe(etapes[0])} (et le cycle recommence)` : '');

function suiteOrdre(modele, forme, rng) {
  const { nom, meta, etapes } = suiteDe(modele, forme, rng);
  const n = Math.min(forme.n ?? meta.n ?? 4, etapes.length);
  if (n < 3) return null;
  let tires = rng.shuffle(etapes).slice(0, n).sort((a, b) => a.rang - b.rang);
  let debut = '';
  if (meta.circulaire) {
    const k = rng.int(0, n - 1);
    tires = [...tires.slice(k), ...tires.slice(0, k)];
    debut = texteDe(tires[0]);
  }
  const melange = rng.shuffle(tires);
  if (melange.every((x, k) => x === tires[k])) melange.reverse();
  const elements = melange.map((x) => majuscule(texteDe(x)));
  const reponse = tires.map((x) => melange.indexOf(x));
  const enonce = remplir(meta.enonceOrdre ?? forme.enonce, { de: meta.de ?? '', debut });
  return {
    _signature: `${nom}|${debut}|${tires.map((x) => x.nom).join(',')}`, type: 'ordre', elements, reponse,
    enonce, explication: `${meta.explication ? meta.explication + ' ' : ''}Ordre complet : ${chaineTexte(etapes, meta.circulaire)}.`,
    cleContenu: `${enonce}|${elements.slice().sort().join(',')}`,
  };
}

function suiteApres(modele, forme, rng) {
  const { nom, meta, etapes } = suiteDe(modele, forme, rng);
  const avant = forme.sens === 'avant';
  const candidats = etapes.map((_, i) => i).filter((i) => meta.circulaire || (avant ? i > 0 : i < etapes.length - 1));
  if (!candidats.length || etapes.length < 4) return null;
  const i = rng.pick(candidats);
  const j = (i + (avant ? -1 : 1) + etapes.length) % etapes.length;
  const bon = etapes[j];
  const faux = rng.shuffle(etapes.filter((_, k) => k !== i && k !== j)).slice(0, (forme.choix ?? 4) - 1);
  const choix = rng.shuffle([bon, ...faux]).map((x) => majuscule(texteDe(x)));
  const modeleEnonce = (avant ? meta.enonceAvant : meta.enonceApres) ?? forme.enonce;
  const cle = `${nom}|${i}|${avant}|${choix.slice().sort().join(',')}`;
  return {
    _signature: cle, type: 'qcm', choix, reponse: choix.indexOf(majuscule(texteDe(bon))),
    enonce: remplir(modeleEnonce, { de: meta.de ?? '', cle: texteDe(etapes[i]) }),
    explication: `${avant ? 'Juste avant' : 'Juste après'} « ${texteDe(etapes[i])} », il y a « ${texteDe(bon)} ». Ordre complet : ${chaineTexte(etapes, meta.circulaire)}.`,
    cleContenu: cle,
  };
}

// ---------- Chaînes alimentaires ----------
const ROLES = ['producteur', 'consommateur primaire', 'consommateur secondaire', 'consommateur tertiaire'];
const RANG = ['', '1er', '2e', '3e'];
const ecrireChaine = (m) => m.join(' → ');

function chaine(modele, forme, rng) {
  const chaines = itemsDe(modele, forme, ['maillons']);
  const ch = rng.pick(chaines);
  const m = ch.maillons;
  const rappel = 'La flèche veut dire « est mangé par ».';
  const q = forme.question ?? rng.pick(['ordre', 'role', 'qui', 'manquant']);
  if (q === 'ordre') {
    const melange = rng.shuffle(m.map((_, i) => i));
    if (melange.every((v, i) => v === i)) melange.reverse();
    return {
      _signature: `ordre|${ch.nom}`, type: 'ordre', elements: melange.map((i) => majuscule(m[i])),
      reponse: m.map((_, i) => melange.indexOf(i)),
      enonce: 'Remets cette chaîne alimentaire dans l\'ordre, en commençant par le producteur.',
      explication: `${majuscule(ecrireChaine(m))}. Une chaîne commence toujours par un végétal (le producteur). ${rappel}`, cleContenu: `ordre|${ch.nom}`,
    };
  }
  if (q === 'role') {
    const i = rng.int(0, m.length - 1);
    const choix = [...ROLES.slice(0, Math.max(3, m.length)), 'décomposeur'].map(majuscule);
    return {
      _signature: `role|${ch.nom}|${i}`, type: 'qcm', choix, reponse: i,
      enonce: `Dans la chaîne alimentaire « ${ecrireChaine(m)} », quel est le rôle de cet être vivant : ${m[i]} ?`,
      explication: `${majuscule(m[i])} : ${i === 0 ? 'c\'est le producteur, un végétal qui fabrique sa propre matière grâce à la lumière du Soleil' : `c'est le ${ROLES[i]}, le ${RANG[i]} mangeur de la chaîne`}. ${rappel}`,
      cleContenu: `role|${ch.nom}|${i}`,
    };
  }
  if (q === 'qui') {
    const i = rng.int(0, m.length - 1);
    const choix = rng.shuffle(m.map(majuscule));
    return {
      _signature: `qui|${ch.nom}|${i}`, type: 'qcm', choix, reponse: choix.indexOf(majuscule(m[i])),
      enonce: `Dans la chaîne alimentaire « ${ecrireChaine(m)} », qui est le ${ROLES[i]} ?`,
      explication: `Réponse : ${m[i]}. ${i === 0 ? 'Le producteur est le végétal placé au début de la chaîne.' : `Le ${ROLES[i]} est le ${RANG[i]} mangeur de la chaîne.`} ${rappel}`,
      cleContenu: `qui|${ch.nom}|${i}`,
    };
  }
  // Maillon manquant. Distracteurs impossibles : des végétaux si l'on cherche un animal,
  // des animaux prédateurs si l'on cherche le végétal.
  const i = rng.int(0, m.length - 1);
  const autres = chaines.filter((c) => c !== ch);
  const pool = i === 0 ? autres.map((c) => c.maillons[c.maillons.length - 1]) : autres.map((c) => c.maillons[0]);
  const faux = rng.shuffle([...new Set(pool)].filter((x) => !m.includes(x))).slice(0, 3);
  if (faux.length < 3) return null;
  const choix = rng.shuffle([m[i], ...faux].map(majuscule));
  const trou = m.map((x, k) => (k === i ? '?' : x));
  const cle = `manque|${ch.nom}|${i}|${choix.slice().sort().join(',')}`;
  return {
    _signature: cle, type: 'qcm', choix, reponse: choix.indexOf(majuscule(m[i])),
    enonce: `Complète la chaîne alimentaire : ${ecrireChaine(trou)}`,
    explication: `${majuscule(ecrireChaine(m))}. ${i === 0 ? 'Il manque le producteur : un végétal.' : `${majuscule(m[i])} mange ${m[i - 1]}${i < m.length - 1 ? ` ; ${m[i + 1]} mange ${m[i]}` : ''}.`}`,
    cleContenu: cle,
  };
}

// ---------- Circuit électrique ----------
function circuit(modele, forme, rng) {
  const objets = itemsDe(modele, forme, ['electrique']);
  const o = rng.pick(objets);
  const ferme = rng.next() < 0.7;
  const conduit = o.electrique === 'conducteur';
  const p = rng.pick(PRENOMS);
  const variante = rng.int(0, 1);
  const enonce = variante === 0
    ? `${p} construit un circuit avec une pile, une ampoule, un interrupteur et des fils. Entre deux fils, ${pronom(p)} place ${o.nom}. L'interrupteur est ${ferme ? 'fermé' : 'ouvert'}. Vrai ou faux ? L'ampoule s'allume.`
    : `Dans un circuit avec une pile, une ampoule et un interrupteur, ${p} remplace un morceau de fil par ${o.nom}. L'interrupteur est ${ferme ? 'fermé' : 'ouvert'}. Vrai ou faux ? L'ampoule s'allume.`;
  let explication;
  if (!ferme) explication = `Faux. L'interrupteur est ouvert : le circuit est ouvert, le courant ne passe pas${conduit ? '' : ` (et de toute façon, ${o.nom} ne laisse pas passer le courant : ${o.pourquoi})`}.`;
  else if (!conduit) explication = `Faux. ${majuscule(o.nom)} ne laisse pas passer le courant : ${o.pourquoi}.`;
  else explication = `Vrai. L'interrupteur est fermé et ${o.nom} laisse passer le courant (${o.pourquoi}) : le circuit est fermé.`;
  const cle = `${o.nom}|${ferme}`;
  return { _signature: cle, type: 'vrai_faux', reponse: ferme && conduit, enonce, explication, cleContenu: cle };
}

// ---------- Soleil et points cardinaux (en Belgique) ----------
const CARDINAUX = ['nord', 'est', 'sud', 'ouest']; // dans le sens des aiguilles d'une montre
const MOMENTS = [
  { quand: 'Le matin', soleil: 'est', ou: 'se lève à l\'est' },
  { quand: 'En milieu de journée', soleil: 'sud', ou: 'est au sud, au plus haut dans le ciel' },
  { quand: 'Le soir', soleil: 'ouest', ou: 'se couche à l\'ouest' },
];
const art = (c) => (c === 'est' || c === 'ouest' ? `l'${c}` : `le ${c}`);
function soleil(modele, forme, rng) {
  const mo = rng.pick(MOMENTS);
  const s = CARDINAUX.indexOf(mo.soleil);
  const p = rng.pick(PRENOMS);
  const q = rng.pick(['dos', 'droite', 'gauche', 'ombre', 'dos_soleil']);
  let enonce; let bonne; let pourquoi;
  if (q === 'ombre') {
    bonne = CARDINAUX[(s + 2) % 4];
    enonce = `${mo.quand}, il fait beau en Belgique. Vers quel point cardinal l'ombre d'un arbre est-elle tournée ?`;
    pourquoi = `${mo.quand}, le Soleil ${mo.ou}. L'ombre se forme du côté opposé à la source de lumière : vers ${art(bonne)}.`;
  } else if (q === 'dos_soleil') {
    bonne = CARDINAUX[(s + 2) % 4];
    enonce = `${mo.quand}, ${p} a le Soleil dans le dos. Vers quel point cardinal regarde-t-${pronom(p)} ?`;
    pourquoi = `${mo.quand}, le Soleil ${mo.ou}. Quand on a le Soleil dans le dos, on regarde du côté opposé : vers ${art(bonne)}.`;
  } else {
    const d = { dos: 2, droite: 1, gauche: 3 }[q];
    bonne = CARDINAUX[(s + d) % 4];
    const ou = { dos: 'dans son dos', droite: 'à sa droite', gauche: 'à sa gauche' }[q];
    enonce = `${mo.quand}, ${p} se tourne vers le Soleil (sans le regarder directement). Quel point cardinal a-t-${pronom(p)} ${ou} ?`;
    pourquoi = `${mo.quand}, le Soleil ${mo.ou}. Quand on est tourné vers ${art(mo.soleil)}, on a ${art(bonne)} ${ou}. Astuce : nord → est → sud → ouest tournent dans le sens des aiguilles d'une montre.`;
  }
  const choix = CARDINAUX.map(majuscule);
  const cle = `${mo.soleil}|${q}`;
  return { _signature: cle, type: 'qcm', choix, reponse: CARDINAUX.indexOf(bonne), enonce, explication: pourquoi, cleContenu: cle };
}

// ---------- Dents ----------
function dentsReste(modele, forme, rng) {
  const p = rng.pick(PRENOMS);
  const q = rng.int(0, 2);
  if (q === 0) {
    const n = rng.int(2, 14);
    return {
      _signature: `lait|${n}`, type: 'numerique', reponse: 20 - n, unite: 'dents',
      enonce: `${p} avait toutes ses dents de lait. ${majuscule(pronom(p))} en a déjà perdu ${n}. Combien de dents de lait lui reste-t-il ?`,
      explication: `Un enfant a 20 dents de lait. 20 − ${n} = ${20 - n}.`, cleContenu: `lait|${n}`,
    };
  }
  if (q === 1) {
    const n = rng.int(20, 31);
    return {
      _signature: `adulte|${n}`, type: 'numerique', reponse: 32 - n, unite: 'dents',
      enonce: `Un adulte a ${n} dents définitives. Combien lui en manque-t-il pour avoir une dentition complète ?`,
      explication: `Une dentition définitive complète compte 32 dents (dents de sagesse comprises). 32 − ${n} = ${32 - n}.`, cleContenu: `adulte|${n}`,
    };
  }
  const k = rng.int(2, 6);
  return {
    _signature: `groupe|${k}`, type: 'numerique', reponse: 20 * k, unite: 'dents',
    enonce: `${k} jeunes enfants ont chacun toutes leurs dents de lait. Combien de dents de lait ont-ils en tout ?`,
    explication: `Chaque enfant a 20 dents de lait. ${k} × 20 = ${20 * k}.`, cleContenu: `groupe|${k}`,
  };
}

const SORTES = {
  affirmation, affirmation_choix: affirmationChoix, affirmation_grille: affirmationGrille,
  suite_ordre: suiteOrdre, suite_apres: suiteApres, chaine, circuit, soleil, dents_reste: dentsReste,
};

export function genererSciences(modele, rng) {
  const formes = modele.formes ?? [];
  const i = formes.length === 1 ? 0 : rng.int(0, formes.length - 1);
  const forme = formes[i];
  const fn = SORTES[forme.sorte];
  if (!fn) {
    const q = genererFaits({ ...modele, formes: [forme] }, rng);
    if (!q) return null;
    // Choix, colonnes et étiquettes à relier commencent par une majuscule (les index de réponse ne changent pas).
    for (const k of ['choix', 'colonnes', 'droite']) if (Array.isArray(q[k])) q[k] = q[k].map((x) => majuscule(String(x)));
    return { ...q, _signature: `${i}|${q._signature}` };
  }
  const r = fn(modele, forme, rng);
  if (!r) return null;
  for (const k of ['choix', 'colonnes', 'droite']) if (Array.isArray(r[k])) r[k] = r[k].map((x) => majuscule(String(x)));
  return {
    ...r,
    _signature: `${i}|${r._signature}`,
    enonce: nettoyer(r.enonce),
    explication: nettoyer(r.explication),
    difficulte: forme.difficulte,
    fiche: forme.fiche,
    domaine: forme.domaine,
  };
}

export const GENERATEURS = { sciences: genererSciences };
