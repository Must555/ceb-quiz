// Examens papier aléatoires (Lot C) : composition reproductible à partir d'un code.
//
// Le code de reproduction (ex. « C-7KQ4M ») contient le format (1re lettre) et la graine.
// Le même code redonne toujours le même examen et le même corrigé : un parent peut imprimer
// l'examen aujourd'hui et retrouver le corrigé demain en retapant le code.
//
// Anti-répétition : dans un même examen, une question n'apparaît jamais deux fois
// (même id, même énoncé), y compris d'une matière à l'autre.

import { createRng } from './random.js';
import { QuizSession } from './session.js';
import { normaliserTexte } from './format.js';
import { tirerTraces } from './traces.js';

export const FORMATS = {
  C: {
    nom: 'Examen complet', duree: 'environ 2 h 30', description: 'Français, maths et éveil, comme au CEB',
    sections: [
      { id: 'fr', titre: 'Français', matieres: ['fr'], n: 16 },
      { id: 'ma', titre: 'Mathématiques', matieres: ['ma'], n: 16, traces: 4 },
      { id: 'ev', titre: 'Éveil (histoire, géographie, sciences)', matieres: ['hg', 'sc'], n: 16 },
    ],
  },
  R: {
    nom: 'Examen court', duree: 'environ 1 h', description: 'Un peu de chaque matière',
    sections: [
      { id: 'fr', titre: 'Français', matieres: ['fr'], n: 7 },
      { id: 'ma', titre: 'Mathématiques', matieres: ['ma'], n: 7, traces: 2 },
      { id: 'ev', titre: 'Éveil (histoire, géographie, sciences)', matieres: ['hg', 'sc'], n: 7 },
    ],
  },
  F: { nom: 'Français', duree: 'environ 1 h', description: 'Lire, grammaire, conjugaison, orthographe', sections: [{ id: 'fr', titre: 'Français', matieres: ['fr'], n: 24 }] },
  M: { nom: 'Mathématiques', duree: 'environ 1 h 15', description: 'Nombres, grandeurs, données et tracés', sections: [{ id: 'ma', titre: 'Mathématiques', matieres: ['ma'], n: 18, traces: 6 }] },
  E: { nom: 'Éveil', duree: 'environ 1 h', description: 'Histoire, géographie et sciences', sections: [{ id: 'ev', titre: 'Éveil (histoire, géographie, sciences)', matieres: ['hg', 'sc'], n: 24 }] },
};

// Alphabet sans caractères ambigus (pas de 0/O, 1/I/L).
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

// Fiche ciblée : quelques notions choisies (points faibles du coach), avec leur rappel et des exercices.
export const FICHE = { nom: 'Fiche ciblée', duree: 'environ 30 min', description: 'Les notions à retravailler, avec rappel', maxNotions: 4 };
const formatConnu = (f) => !!FORMATS[f] || f === 'T';

export function nouveauCode(format = 'C', alea = Math.random) {
  if (!formatConnu(format)) throw new Error(`Format inconnu : ${format}`);
  let s = '';
  for (let i = 0; i < 5; i++) s += ALPHABET[Math.floor(alea() * ALPHABET.length)];
  return `${format}-${s}`;
}

// Normalise un code saisi à la main (« c 7kq4m » → « C-7KQ4M ») ; null s'il est invalide.
export function lireCode(saisie) {
  const brut = String(saisie ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  const m = brut.match(/^([A-Z])([0-9A-Z]{5})$/);
  if (!m || !formatConnu(m[1])) return null;
  if (![...m[2]].every((c) => ALPHABET.includes(c))) return null;
  return `${m[1]}-${m[2]}`;
}

// Barème simple et entier (les points officiels, avec leurs demi-points, ne s'additionnent pas bien
// d'un examen à l'autre) : 1 point, 2 pour les tracés et les questions à plusieurs cases.
export function pointsPapier(q) {
  if (q.type === 'trace') return 2;
  return ['grille', 'trous', 'association', 'ordre', 'qcm_multi'].includes(q.type) ? 2 : 1;
}

// Nombre maximum de pages de portfolio imprimées par examen (sinon l'examen devient un annuaire).
const MAX_DOCS = { C: 6, R: 3, F: 5, M: 4, E: 6 };

/**
 * @param {{banque: object[], modeles: object[], catalogue?: object}} donnees  banque = questions fixes + questions officielles jouables
 * @param {string} code  code de reproduction (voir lireCode)
 */
export function composerExamen(donnees, code) {
  const c = lireCode(code);
  if (!c) throw new Error(`Code invalide : ${code}`);
  const lettre = c[0];
  const format = FORMATS[lettre];
  if (!format) throw new Error(`Ce code n'est pas celui d'un examen : ${c}`);
  const rng = createRng(c);
  const idsVus = new Set();
  const contenus = new Set();
  const docsVus = new Set();
  const maxDocs = MAX_DOCS[lettre] ?? 4;
  const ordreDomaines = (donnees.catalogue?.matieres ?? []).flatMap((m) => m.domaines.map((d) => d.id));
  const rangDomaine = (d) => { const i = ordreDomaines.indexOf(d); return i < 0 ? 99 : i; };

  const cleContenu = (q) => normaliserTexte(`${q.cleContenu ?? q.enonce}|${(q.choix ?? q.elements ?? q.lignes ?? []).join('|')}`);
  const nouveau = (q) => !idsVus.has(q.id) && !contenus.has(cleContenu(q));
  const retenir = (q) => { idsVus.add(q.id); contenus.add(cleContenu(q)); };

  const sections = format.sections.map((sec, iSec) => {
    // Les questions officielles qui demandent une page du portfolio pèsent moins lourd :
    // on garde quelques documents, pas des dizaines de pages.
    const poids = (q) => (q.docsResolus?.length ? 0.25 : 1);
    const session = new QuizSession(
      { banque: donnees.banque, modeles: donnees.modeles },
      { mode: 'entrainement', nbQuestions: 10_000, matieres: sec.matieres, seed: `${c}/${iSec}`, poids },
    );
    const questions = [];
    for (let essais = 0; questions.length < sec.n && essais < sec.n * 20; essais++) {
      const q = session.suivante();
      if (!q) break;
      session.passer();
      if (!nouveau(q)) continue;
      const docs = (q.docsResolus ?? []).filter((d) => !docsVus.has(d.fichier));
      if (docs.length > 2 || (docs.length && docsVus.size + docs.length > maxDocs)) continue; // pas de texte de 4 pages
      docs.forEach((d) => docsVus.add(d.fichier));
      retenir(q);
      questions.push({ ...q }); // copie : les questions de la banque sont partagées
    }
    // Ordre de lecture : par domaine (comme dans un vrai livret), questions d'un même document côte à côte.
    const cleDoc = (q) => q.docsResolus?.[0]?.fichier ?? '';
    questions.sort((a, b) => rangDomaine(a.domaine) - rangDomaine(b.domaine) || cleDoc(a).localeCompare(cleDoc(b)));
    if (sec.traces) {
      for (const t of tirerTraces(rng, sec.traces, idsVus)) { retenir(t); questions.push(t); }
    }
    return { id: sec.id, titre: sec.titre, questions };
  });

  // Numérotation continue et barème.
  let numero = 0;
  for (const s of sections) {
    for (const q of s.questions) { q.numeroPapier = ++numero; q.pointsPapier = pointsPapier(q); }
    s.total = s.questions.reduce((t, q) => t + q.pointsPapier, 0);
  }
  return {
    code: c,
    format: lettre,
    nom: format.nom,
    duree: format.duree,
    sections,
    nbQuestions: numero,
    total: sections.reduce((t, s) => t + s.total, 0),
  };
}

// Notions couvertes par une question ou un modèle (une famille peut couvrir plusieurs fiches).
const notionsDe = (c) => [c.fiche ?? c.domaine, ...(c.formes ?? []).map((f) => f.fiche)].filter(Boolean);

/**
 * Fiche ciblée : pour chaque notion, le rappel (fiche) puis des exercices du plus facile au plus difficile,
 * et un ou deux tracés quand la notion s'y prête. Même code + mêmes notions = même fiche.
 * @param {{banque: object[], modeles: object[], fiches: object}} donnees
 * @param {string} code  code « T-XXXXX »
 * @param {string[]} notions  ids de fiches (1 à 4)
 */
export function composerFiche(donnees, code, notions) {
  const c = lireCode(code);
  if (!c || c[0] !== 'T') throw new Error(`Code de fiche invalide : ${code}`);
  const liste = [...new Set(notions)].filter((n) => donnees.fiches[n]).slice(0, FICHE.maxNotions);
  if (!liste.length) throw new Error('Aucune notion choisie.');
  const parNotion = { 1: 12, 2: 8, 3: 6, 4: 5 }[liste.length];
  const rng = createRng(`${c}|${liste.join(',')}`);
  const idsVus = new Set();
  const contenus = new Set();
  const docsVus = new Set();
  // Sur une fiche, deux questions au même énoncé (« Quelle fraction est égale à 1/2 ? ») se ressemblent trop.
  const cleContenu = (q) => normaliserTexte(q.cleContenu ?? q.enonce);

  const sections = liste.map((notion, i) => {
    const fiche = donnees.fiches[notion];
    // Les tracés de la notion d'abord réservés (2 au plus), le reste en exercices.
    const traces = [];
    for (let k = 0; k < 60 && traces.length < 2; k++) {
      const t = tirerTraces(rng, 1, idsVus)[0];
      if (t && t.fiche === notion && !traces.some((x) => x.id === t.id)) traces.push(t);
    }
    const nbTraces = Math.min(traces.length, parNotion >= 8 ? 2 : 1);
    const session = new QuizSession(
      { banque: donnees.banque, modeles: donnees.modeles },
      { mode: 'entrainement', nbQuestions: 10_000, maxParModele: 12, seed: `${c}/${notion}`, poids: (q) => (notionsDe(q).includes(notion) ? (q.docsResolus?.length ? 0.3 : 1) : 0) },
    );
    const questions = [];
    const voulues = parNotion - nbTraces;
    for (let essais = 0; questions.length < voulues && essais < voulues * 25; essais++) {
      const q = session.suivante();
      if (!q) break;
      session.passer();
      if (q.fiche !== notion || idsVus.has(q.id) || contenus.has(cleContenu(q))) continue;
      const docs = (q.docsResolus ?? []).filter((d) => !docsVus.has(d.fichier));
      if (docs.length > 1 || (docs.length && docsVus.size >= 3)) continue;
      docs.forEach((d) => docsVus.add(d.fichier));
      idsVus.add(q.id); contenus.add(cleContenu(q));
      questions.push({ ...q });
    }
    questions.sort((a, b) => (a.difficulte ?? 2) - (b.difficulte ?? 2));
    for (const t of traces.slice(0, nbTraces)) { idsVus.add(t.id); questions.push(t); }
    return { id: notion, titre: `${fiche.e ?? '📘'} ${fiche.titre}`, rappel: fiche, questions, rang: i };
  });

  let numero = 0;
  for (const s of sections) {
    for (const q of s.questions) { q.numeroPapier = ++numero; q.pointsPapier = pointsPapier(q); }
    s.total = s.questions.reduce((t, q) => t + q.pointsPapier, 0);
  }
  return {
    code: c,
    format: 'T',
    nom: FICHE.nom,
    duree: FICHE.duree,
    notions: liste,
    sections,
    nbQuestions: numero,
    total: sections.reduce((t, s) => t + s.total, 0),
  };
}
