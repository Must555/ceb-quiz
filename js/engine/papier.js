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

export function nouveauCode(format = 'C', alea = Math.random) {
  if (!FORMATS[format]) throw new Error(`Format inconnu : ${format}`);
  let s = '';
  for (let i = 0; i < 5; i++) s += ALPHABET[Math.floor(alea() * ALPHABET.length)];
  return `${format}-${s}`;
}

// Normalise un code saisi à la main (« c 7kq4m » → « C-7KQ4M ») ; null s'il est invalide.
export function lireCode(saisie) {
  const brut = String(saisie ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  const m = brut.match(/^([A-Z])([0-9A-Z]{5})$/);
  if (!m || !FORMATS[m[1]]) return null;
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
