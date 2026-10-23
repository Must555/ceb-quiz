// RÈGLE ABSOLUE : dans une même session, jamais deux fois la même question, telle que l'enfant la voit
// (même texte, mêmes choix, même dessin), quel que soit l'ordre d'affichage ou la clé interne.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chargerDonnees, QuizSession } from '../js/engine/index.js';
import { cleVisible } from '../js/engine/session.js';

const fetchJson = async (chemin) => JSON.parse(await readFile(new URL('../' + chemin, import.meta.url), 'utf8'));
const donnees = await chargerDonnees({ base: 'data/', fetchJson });
const banque = [...donnees.banque, ...await donnees.questionsExamens()];

function jouer(session) {
  const vues = [];
  for (let q = session.suivante(); q; q = session.suivante()) { vues.push(q); session.passer(); }
  return vues;
}
const doublons = (vues) => vues.filter((q, i) => vues.findIndex((x) => cleVisible(x) === cleVisible(q)) !== i);

test('une série de 10 questions ne montre jamais deux fois la même question (60 séries mêlées)', () => {
  for (let s = 0; s < 60; s++) {
    const vues = jouer(new QuizSession({ banque, modeles: donnees.modeles }, { nbQuestions: 10, seed: `anti|${s}` }));
    assert.equal(vues.length, 10);
    assert.deepEqual(doublons(vues).map((q) => q.enonce), [], `série ${s}`);
  }
});

test('chaque famille seule, sur une longue session : pas de question visible deux fois', () => {
  for (const m of donnees.modeles) {
    const vues = jouer(new QuizSession({ banque: [], modeles: [m] }, { nbQuestions: 30, maxParModele: 30, seed: `seule|${m.id}` }));
    assert.deepEqual(doublons(vues).map((q) => q.enonce.slice(0, 80)), [], m.id);
  }
});

test('les vraies questions du CEB : deux questions identiques (2026 socles et tronc commun) ne sortent pas dans la même série', () => {
  const exam = banque.filter((q) => q.source === 'examen');
  for (let s = 0; s < 30; s++) {
    const vues = jouer(new QuizSession({ banque: exam, modeles: [] }, { nbQuestions: 40, seed: `exam|${s}` }));
    assert.deepEqual(doublons(vues).map((q) => q.id), [], `série ${s}`);
  }
});

test('séance : ce qui a été vu aux séries précédentes ne revient pas tant qu\'il reste du neuf', () => {
  let vusSeance = [];
  const tout = [];
  for (let s = 0; s < 15; s++) {
    const session = new QuizSession({ banque, modeles: donnees.modeles, vusSeance }, { nbQuestions: 10, seed: `seance|${s}` });
    const vues = jouer(session);
    tout.push(...vues);
    vusSeance = [...vusSeance, ...session.resume().visiblesVus];
  }
  assert.equal(tout.length, 150);
  assert.deepEqual(doublons(tout).map((q) => q.enonce.slice(0, 80)), []);
});

test('« remettre dans l\'ordre » : la question ne s\'affiche jamais déjà dans le bon ordre', async () => {
  const { sansOrdreDonne } = await import('../js/engine/session.js');
  const { genererVariante, createRng } = await import('../js/engine/index.js');
  const ordres = banque.filter((q) => q.type === 'ordre');
  for (const m of donnees.modeles) {
    const rng = createRng(`ordre|${m.id}`);
    for (let k = 0; k < 20; k++) { const v = genererVariante(m, rng); if (v?.type === 'ordre') ordres.push(v); }
  }
  assert.ok(ordres.length > 40);
  for (const q of ordres) {
    const vue = sansOrdreDonne(q);
    assert.ok(!vue.reponse.every((x, i) => x === i), q.id);
    assert.deepEqual(vue.reponse.map((i) => vue.elements[i]), q.reponse.map((i) => q.elements[i]), q.id);
  }
});
