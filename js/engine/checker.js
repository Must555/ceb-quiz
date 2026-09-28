// Correction automatique d'une réponse selon le type de question.
// Renvoie { correct, score, max, remarque? }
//   correct : true / false, ou null pour une question ouverte (autoévaluation)
//   score   : points obtenus (crédit partiel pour grille, trous, qcm_multi, ordre, association)

import { parseNombre, normaliserTexte } from './format.js';

const estRempli = (v) => v !== null && v !== undefined && v !== '';
const memeEnsemble = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

function comparerTexte(saisie, acceptees, souple) {
  const opts = { accents: !souple };
  const s = normaliserTexte(saisie, opts);
  if (acceptees.some((r) => normaliserTexte(r, opts) === s)) return { ok: true };
  // En mode strict, on repère le cas « juste à un accent près » pour aider l'enfant.
  if (!souple && acceptees.some((r) => normaliserTexte(r) === normaliserTexte(saisie))) {
    return { ok: false, remarque: 'Presque ! Vérifie les accents.' };
  }
  return { ok: false };
}

export function corriger(question, reponseEleve) {
  const max = question.points ?? 1;
  const vide = reponseEleve == null || reponseEleve === '' || (Array.isArray(reponseEleve) && reponseEleve.length === 0);
  if (vide && question.type !== 'ouverte') return { correct: false, score: 0, max, remarque: 'Pas de réponse.' };

  const typesTableau = ['qcm_multi', 'trous', 'grille', 'ordre', 'association'];
  if (typesTableau.includes(question.type) && !Array.isArray(reponseEleve)) {
    return { correct: false, score: 0, max, remarque: 'Réponse incomplète.' };
  }

  switch (question.type) {
    case 'qcm': {
      const ok = Number(reponseEleve) === question.reponse;
      return { correct: ok, score: ok ? max : 0, max };
    }
    case 'vrai_faux': {
      const ok = Boolean(reponseEleve) === question.reponse;
      return { correct: ok, score: ok ? max : 0, max };
    }
    case 'qcm_multi': {
      const ok = memeEnsemble(reponseEleve.map(Number), question.reponse);
      return { correct: ok, score: ok ? max : 0, max };
    }
    case 'numerique': {
      const n = parseNombre(reponseEleve);
      if (Number.isNaN(n)) return { correct: false, score: 0, max, remarque: 'Écris un nombre (avec une virgule pour les décimales).' };
      const ok = Math.abs(n - question.reponse) <= (question.tolerance ?? 1e-9);
      return { correct: ok, score: ok ? max : 0, max };
    }
    case 'texte_court': {
      const { ok, remarque } = comparerTexte(reponseEleve, [].concat(question.reponse), question.souple !== false);
      return { correct: ok, score: ok ? max : 0, max, remarque };
    }
    case 'trous': {
      // reponse = [[formes acceptées case 1], [case 2], ...]
      const bons = question.reponse.filter((acc, i) =>
        comparerTexte(reponseEleve[i] ?? '', [].concat(acc), question.souple !== false).ok).length;
      return partiel(bons, question.reponse.length, max);
    }
    case 'grille': {
      // reponse = index de colonne attendu pour chaque ligne
      const bons = question.reponse.filter((col, i) => estRempli(reponseEleve[i]) && Number(reponseEleve[i]) === col).length;
      return partiel(bons, question.reponse.length, max);
    }
    case 'ordre': {
      const bons = question.reponse.filter((v, i) => estRempli(reponseEleve[i]) && Number(reponseEleve[i]) === v).length;
      const res = partiel(bons, question.reponse.length, max);
      return res.correct ? res : { ...res, score: 0 }; // un ordre n'est juste qu'en entier
    }
    case 'association': {
      // reponse = [[g, d], ...] ; l'élève fournit aussi des paires
      const attendu = new Set(question.reponse.map(([g, d]) => `${g}-${d}`));
      const bons = reponseEleve.filter(([g, d]) => attendu.has(`${g}-${d}`)).length;
      return partiel(bons, question.reponse.length, max);
    }
    case 'ouverte':
      // Correction par l'élève à l'aide de reponseModele (ou par un adulte).
      return { correct: null, score: null, max, remarque: 'Compare ta réponse avec la réponse modèle.' };
    default:
      throw new Error(`Type de question inconnu : ${question.type}`);
  }
}

function partiel(bons, total, max) {
  const score = Math.round((bons / total) * max * 100) / 100;
  return { correct: bons === total, score, max, detail: `${bons}/${total}` };
}
