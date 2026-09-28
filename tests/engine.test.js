// Tests du moteur : node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluate } from '../js/engine/expr.js';
import { chargerDonnees, QuizSession, genererVariante, corriger, createRng, parseNombre, formatNombre } from '../js/engine/index.js';
import { conjuguer } from '../js/engine/generateurs/conjugaison.js';
import { periodeDe, siecleDe } from '../js/engine/generateurs/histoire.js';

const fetchJson = async (chemin) => JSON.parse(await readFile(new URL('../' + chemin, import.meta.url), 'utf8'));
const donnees = await chargerDonnees({ base: 'data/', fetchJson });

// Donne la bonne réponse telle qu'un élève la saisirait.
function reponseParfaite(q) {
  switch (q.type) {
    case 'qcm': case 'vrai_faux': case 'qcm_multi': case 'grille': case 'ordre': case 'association': return q.reponse;
    case 'numerique': return String(q.reponse).replace('.', ',');
    case 'texte_court': return [].concat(q.reponse)[0];
    case 'trous': return q.reponse.map((r) => [].concat(r)[0]);
    default: return null;
  }
}

test('évaluateur d\'expressions', () => {
  assert.equal(evaluate('2 + 3 * 4'), 14);
  assert.equal(evaluate('(2 + 3) * 4'), 20);
  assert.equal(evaluate('prix - prix * r / 100', { prix: 72, r: 10 }), 64.8);
  assert.equal(evaluate('0.1 + 0.2'), 0.3);
  assert.equal(evaluate('a % 3 == 0 && a > 5', { a: 9 }), true);
  assert.equal(evaluate('round(2.345, 2)'), 2.35);
  assert.equal(evaluate('-3 + 1'), -2);
  assert.throws(() => evaluate('alert(1)'), /Fonction inconnue/);
  assert.throws(() => evaluate('x + 1'), /Variable inconnue/);
});

test('format des nombres', () => {
  assert.equal(parseNombre('64,80'), 64.8);
  assert.equal(parseNombre('64.8 €'), 64.8);
  assert.equal(parseNombre('1 234,5'), 1234.5);
  assert.ok(Number.isNaN(parseNombre('abc')));
  assert.ok(Number.isNaN(parseNombre('1,2,3')));
  assert.equal(formatNombre(1234.5), '1 234,5');
  assert.equal(formatNombre(64.8), '64,8');
});

test('chaque modèle produit des variantes valides, variées et auto-cohérentes', () => {
  const rng = createRng(42);
  for (const m of donnees.modeles) {
    const ids = new Set();
    for (let i = 0; i < 300; i++) {
      const q = genererVariante(m, rng, ids);
      if (!q) break; // modèle à petit nombre de variantes : épuisé, c'est permis
      assert.ok(!ids.has(q.id), `${m.id} : variante répétée ${q.id}`);
      ids.add(q.id);
      for (const champ of [q.enonce, q.explication, q.unite ?? '', ...(q.choix ?? [])]) {
        assert.doesNotMatch(String(champ), /undefined|NaN|Infinity|\{|\}/, `${m.id} : texte cassé « ${champ} »`);
      }
      if (q.type === 'numerique') assert.ok(Number.isFinite(q.reponse) && q.reponse >= 0, `${m.id} : réponse ${q.reponse}`);
      const res = corriger(q, reponseParfaite(q));
      assert.equal(res.correct, true, `${m.id} : la bonne réponse est refusée (${q.enonce} → ${reponseParfaite(q)})`);
    }
    assert.ok(ids.size >= 10, `${m.id} : seulement ${ids.size} variantes`);
  }
});

test('les questions de la banque sont corrigeables avec leur propre réponse', () => {
  for (const q of donnees.banque) {
    assert.equal(corriger(q, reponseParfaite(q)).correct, true, q.id);
  }
});

test('ANTI-RÉPÉTITION : jamais deux fois la même question dans une session (500 sessions)', () => {
  for (let s = 0; s < 500; s++) {
    const session = new QuizSession(donnees, { seed: s, nbQuestions: 40 });
    const ids = new Set();
    const textes = new Set();
    let q;
    while ((q = session.suivante())) {
      assert.ok(!ids.has(q.id), `session ${s} : id répété ${q.id}`);
      assert.ok(!textes.has(q.enonce), `session ${s} : énoncé répété « ${q.enonce} »`);
      ids.add(q.id); textes.add(q.enonce);
      session.repondre(reponseParfaite(q));
    }
    assert.equal(ids.size, 40);
  }
});

test('ANTI-RÉPÉTITION : session très longue sur une seule matière jusqu\'à épuisement', () => {
  const session = new QuizSession(donnees, { seed: 7, nbQuestions: 5000, matieres: ['hg'] });
  const ids = new Set();
  let q;
  while ((q = session.suivante())) {
    assert.ok(!ids.has(q.id));
    ids.add(q.id);
    session.repondre('x');
  }
  // 10 questions fixes + 2 modèles × maxParModele (3)
  assert.equal(ids.size, 16);
});

test('pas deux fois de suite le même modèle', () => {
  const session = new QuizSession(donnees, { seed: 3, nbQuestions: 60 });
  let prec = null; let q;
  while ((q = session.suivante())) {
    if (q.modeleId) assert.notEqual(q.modeleId, prec, `modèle ${q.modeleId} deux fois de suite`);
    prec = q.modeleId ?? null;
    session.repondre(null);
  }
});

test('historique : on pose d\'abord ce qui n\'a jamais été vu', () => {
  const tousLesIds = donnees.banque.filter((q) => q.matiere === 'sc').map((q) => q.id);
  const historique = tousLesIds.slice(0, 7);
  const session = new QuizSession({ ...donnees, historique }, { seed: 1, nbQuestions: 3, matieres: ['sc'] });
  let q;
  while ((q = session.suivante())) { assert.ok(!historique.includes(q.id)); session.repondre(null); }
});

test('filtres matière / domaine / difficulté', () => {
  const session = new QuizSession(donnees, { seed: 9, nbQuestions: 30, domaines: ['ma.grandeurs'], difficulteMax: 2 });
  let q;
  while ((q = session.suivante())) {
    assert.equal(q.domaine, 'ma.grandeurs');
    assert.ok(q.difficulte <= 2);
    session.repondre(null);
  }
});

test('chrono : la session se termine quand le temps est écoulé', () => {
  let t = 0;
  const session = new QuizSession(donnees, { seed: 1, nbQuestions: 50, dureeSecondes: 60, now: () => t });
  session.suivante();
  assert.equal(session.etat().tempsRestant, 60);
  t = 30_000; assert.equal(session.etat().tempsRestant, 30);
  session.repondre(null);
  t = 61_000;
  assert.equal(session.suivante(), null);
  assert.equal(session.etat().terminee, true);
});

test('score, série et XP', () => {
  const session = new QuizSession(donnees, { seed: 5, nbQuestions: 4, matieres: ['sc'] });
  let q = session.suivante();
  const r1 = session.repondre(reponseParfaite(q));
  assert.equal(r1.correct, true); assert.equal(r1.serie, 1);
  q = session.suivante();
  const d2 = q.difficulte;
  const r2 = session.repondre(reponseParfaite(q));
  assert.equal(r2.correct, true); assert.equal(r2.serie, 2);
  assert.equal(r2.xpGagne, 10 + 5 * (d2 - 1) + 2, 'bonus de série de +2 XP');
  q = session.suivante();
  const r3 = session.repondre(q.type === 'qcm' ? (q.reponse + 1) % q.choix.length : 'mauvaise réponse');
  assert.equal(r3.correct, false); assert.equal(r3.serie, 0); assert.ok(r3.bonneReponse);
  const res = session.resume();
  assert.equal(res.bonnes, 2); assert.equal(res.meilleureSerie, 2);
});

test('mode examen : questions officielles dans l\'ordre, sans les questions papier', async () => {
  const ex = await donnees.chargerExamen('ceb-2026-tc');
  const session = new QuizSession({ examen: ex }, { mode: 'examen' });
  const ids = []; let q;
  while ((q = session.suivante())) { ids.push(q.id); session.repondre(null); }
  assert.ok(ids.length >= 3);
  assert.ok(!ids.includes('ceb-2026-tc-l3-q2'), 'question de tracé exclue');
  assert.ok(!ids.includes('ceb-2026-tc-l2-q1'), 'production écrite (papier) exclue');
  assert.ok(ids.includes('ceb-2026-tc-l4-q30'), 'question ouverte avec réponse modèle incluse');
  assert.equal(new Set(ids).size, ids.length, 'aucune question en double');
});

test('mode examen : un seul livret', async () => {
  const ex = await donnees.chargerExamen('ceb-2026-tc');
  const session = new QuizSession({ examen: ex }, { mode: 'examen', livrets: [4] });
  let q, n = 0;
  while ((q = session.suivante())) { assert.equal(q.livret, 4); n++; session.repondre(null); }
  assert.equal(n, session.o.nbQuestions);
  assert.ok(n >= 20);
});

test('correction : cas particuliers', () => {
  const num = { type: 'numerique', reponse: 64.8 };
  assert.equal(corriger(num, '64,80').correct, true);
  assert.equal(corriger(num, '64,8 €').correct, true);
  assert.equal(corriger(num, '65').correct, false);
  const conj = { type: 'texte_court', reponse: ['chanté'], souple: false };
  const r = corriger(conj, 'chante');
  assert.equal(r.correct, false); assert.match(r.remarque, /accents/);
  const souple = { type: 'texte_court', reponse: ['Moyen Âge'], souple: true };
  assert.equal(corriger(souple, 'moyen age').correct, true);
  const grille = { type: 'grille', reponse: [0, 1, 1], points: 3 };
  assert.deepEqual([corriger(grille, [0, 1, 0]).score, corriger(grille, [0, 1, 0]).correct], [2, false]);
  // Une grille laissée vide ne rapporte aucun point (null ne vaut pas « colonne 0 »).
  assert.equal(corriger(grille, [null, null, null]).score, 0);
  const ordre = { type: 'ordre', reponse: [0, 1, 2] };
  assert.equal(corriger(ordre, [undefined, null, '']).score, 0);
});

test('conjugaison', () => {
  const p = (pronom, idx) => ({ pronom, idx });
  assert.equal(conjuguer('chanter', 'futur', p('nous', 3)).forme, 'chanterons');
  assert.equal(conjuguer('finir', 'present', p('ils', 5)).forme, 'finissent');
  assert.equal(conjuguer('finir', 'imparfait', p('nous', 3)).forme, 'finissions');
  assert.equal(conjuguer('aller', 'passe_compose', p('elle', 2)).forme, 'est allée');
  assert.deepEqual(conjuguer('aller', 'passe_compose', p('nous', 3)).formesAcceptees, ['sommes allés', 'sommes allées']);
  assert.equal(conjuguer('être', 'imparfait', p('nous', 3)).forme, 'étions');
  assert.equal(conjuguer('faire', 'futur', p('vous', 4)).forme, 'ferez');
  assert.equal(conjuguer('prendre', 'passe_compose', p('ils', 5)).forme, 'ont pris');
  assert.equal(conjuguer('voir', 'imparfait', p('nous', 3)).forme, 'voyions');
});

test('repères historiques', () => {
  assert.equal(periodeDe(1500).nom, 'Temps modernes');
  assert.equal(periodeDe(800).nom, 'Moyen Âge');
  assert.equal(periodeDe(-50).nom, 'Antiquité');
  assert.equal(periodeDe(1830).nom, 'Époque contemporaine');
  assert.equal(siecleDe(1900), 19);
  assert.equal(siecleDe(1901), 20);
  assert.equal(siecleDe(2026), 21);
});
