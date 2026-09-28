// Tests du coach : maîtrise, révision espacée, missions ciblées.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chargerDonnees, QuizSession } from '../js/engine/index.js';
import { nouveauJoueur } from '../js/app/store.js';
import { enregistrerSession } from '../js/app/progression.js';
import { majCoach, maitrise, revisionsDues, faiblesses, poidsCoach, ajouterJours } from '../js/app/coach.js';

const fetchJson = async (c) => JSON.parse(await readFile(new URL('../' + c, import.meta.url), 'utf8'));
const donnees = await chargerDonnees({ base: 'data/', fetchJson });
const J0 = '2026-10-05';

function reponse(q, juste) {
  if (!juste) return q.type === 'qcm' ? (q.reponse + 1) % q.choix.length : q.type === 'vrai_faux' ? !q.reponse : 'zzz';
  switch (q.type) {
    case 'qcm': case 'vrai_faux': case 'qcm_multi': case 'grille': case 'ordre': case 'association': return q.reponse;
    case 'numerique': return String(q.reponse);
    case 'texte_court': return [].concat(q.reponse)[0];
    case 'trous': return q.reponse.map((r) => [].concat(r)[0]);
    default: return null;
  }
}

// Simule un enfant qui se trompe toujours sur une notion et réussit le reste.
function jouer(j, { notionFaible, sessions, jour = J0, options = {} }) {
  for (let s = 0; s < sessions; s++) {
    const sess = new QuizSession({ ...donnees, historique: j.historique }, { seed: `${jour}-${s}`, nbQuestions: 10, ...options });
    let q;
    const faibles = [].concat(notionFaible);
    while ((q = sess.suivante())) sess.repondre(reponse(q, !faibles.includes(q.fiche ?? q.domaine)));
    enregistrerSession(j, sess.resume(), options.poids ? 'cible' : 'entrainement', jour);
  }
}

test('les réponses sont rattachées à une notion (fiche)', () => {
  const sess = new QuizSession(donnees, { seed: 1, nbQuestions: 30 });
  let q;
  while ((q = sess.suivante())) { assert.ok(q.fiche, `question sans fiche : ${q.id}`); assert.ok(donnees.fiches[q.fiche], `fiche inconnue : ${q.fiche}`); sess.repondre(null); }
  const r = sess.resume();
  assert.equal(r.details.length, 30);
  assert.ok(r.details.every((d) => d.notion && 'ratio' in d));
});

test('maîtrise : les réponses récentes comptent davantage', () => {
  const j = nouveauJoueur('t', '🦊', '#fff');
  majCoach(j, Array.from({ length: 6 }, () => ({ notion: 'x', questionId: 'a', correct: false, ratio: 0 })), J0);
  const avant = maitrise(j, 'x');
  assert.equal(avant.statut, 'fragile');
  majCoach(j, Array.from({ length: 6 }, (_, i) => ({ notion: 'x', questionId: 'b' + i, correct: true, ratio: 1 })), J0);
  const apres = maitrise(j, 'x');
  assert.ok(apres.m > 0.6, `maîtrise ${apres.m} : la progression récente doit peser plus que 50 %`);
  assert.equal(maitrise(j, 'inconnue').statut, 'decouverte');
});

test('révision espacée : J+1, puis J+3, puis J+7, puis sortie', () => {
  const j = nouveauJoueur('t', '🦊', '#fff');
  const d = (ok) => [{ notion: 'n', modeleId: 'm1', questionId: 'm1#x', correct: ok, ratio: ok ? 1 : 0 }];
  majCoach(j, d(false), J0);
  assert.equal(revisionsDues(j, J0).length, 0, 'pas le jour même');
  const j1 = ajouterJours(J0, 1);
  assert.equal(revisionsDues(j, j1).length, 1);
  majCoach(j, d(true), j1);
  assert.equal(j.aRevoir['m:m1'].due, ajouterJours(j1, 3));
  const j4 = ajouterJours(j1, 3); majCoach(j, d(true), j4);
  assert.equal(j.aRevoir['m:m1'].due, ajouterJours(j4, 7));
  majCoach(j, d(true), ajouterJours(j4, 7));
  assert.equal(j.aRevoir['m:m1'], undefined, 'révisée 3 fois de suite : sortie de la boîte');
  // Une nouvelle erreur remet la question en boîte 1
  majCoach(j, d(false), J0);
  assert.equal(j.aRevoir['m:m1'].boite, 1);
});

test('SIMULATION : le coach repère la faiblesse et la mission ciblée la travaille', () => {
  const j = nouveauJoueur('t', '🦊', '#fff');
  jouer(j, { notionFaible: 'ma-conversions', sessions: 25 });
  const f = faiblesses(j, donnees.fiches);
  assert.ok(f.length >= 1);
  assert.equal(f[0].fiche.id, 'ma-conversions', `faiblesse repérée : ${f.map((x) => x.fiche.id)}`);

  // Mission ciblée générale : la notion faible doit être très présente
  const sess = new QuizSession({ ...donnees, historique: j.historique }, { seed: 'cible', nbQuestions: 10, maxParModele: 4, poids: poidsCoach(j, { mode: 'cible', jour: ajouterJours(J0, 1) }) });
  const notions = []; let q;
  while ((q = sess.suivante())) { notions.push(q.fiche); sess.repondre(null); }
  const n = notions.filter((x) => x === 'ma-conversions').length;
  assert.ok(n >= 4, `seulement ${n} questions de conversions sur 10 : ${notions}`); // 1 seul modèle (max 4 variantes)
  assert.equal(new Set(sess.resume().idsVus).size, 10, 'toujours aucune répétition');
});

test('mission ciblée générale : au moins 5 questions sur 10 visent les faiblesses (moyenne sur 50 missions)', () => {
  const j = nouveauJoueur('t', '🦊', '#fff');
  // deux notions faibles, comme dans le test navigateur
  jouer(j, { notionFaible: ['ma-pourcentages', 'ma-durees'], sessions: 15, options: { matieres: ['ma'] } });
  const faibles = new Set(faiblesses(j, donnees.fiches).map((x) => x.fiche.id));
  let total = 0;
  for (let k = 0; k < 50; k++) {
    const sess = new QuizSession({ ...donnees, historique: j.historique }, { seed: 'm' + k, nbQuestions: 10, maxParModele: 5, poids: poidsCoach(j, { mode: 'cible' }) });
    let q; while ((q = sess.suivante())) { if (faibles.has(q.fiche)) total++; sess.repondre(null); }
  }
  assert.ok(total / 50 >= 5, `moyenne ${total / 50} questions ciblées sur 10 (faiblesses : ${[...faibles]})`);
});

test('mission sur une notion précise : presque uniquement cette notion', () => {
  const j = nouveauJoueur('t', '🦊', '#fff');
  const sess = new QuizSession(donnees, { seed: 3, nbQuestions: 10, maxParModele: 4, poids: poidsCoach(j, { mode: 'cible', notion: 'fr-homophones' }) });
  const notions = []; let q;
  while ((q = sess.suivante())) { notions.push(q.fiche); sess.repondre(null); }
  // 1 modèle homophones × 4 variantes max, le reste est complété par d'autres notions
  assert.equal(notions.filter((x) => x === 'fr-homophones').length, 4); // maxParModele 4 dans ce test
  assert.equal(notions.length, 10);
});

test('pondération zéro : un candidat de poids 0 n\'est jamais tiré', () => {
  const sess = new QuizSession(donnees, { seed: 4, nbQuestions: 50, poids: (c) => (c.matiere === 'sc' ? 1 : 0) });
  let q;
  while ((q = sess.suivante())) { assert.equal(q.matiere, 'sc'); sess.repondre(null); }
});
