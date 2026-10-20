// Défi entre amis (lien) et difficulté adaptative.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chargerDonnees, QuizSession } from '../js/engine/index.js';
import { encoderDefi, decoderDefi, lienDefi, optionsDefi, comparer, nouvelleGraine, empreinteDonnees } from '../js/app/defi-amis.js';

const fetchJson = async (chemin) => JSON.parse(await readFile(new URL('../' + chemin, import.meta.url), 'utf8'));
const donnees = await chargerDonnees({ base: 'data/', fetchJson });
donnees.banque.push(...await donnees.questionsExamens());

test('code de défi : aller-retour, accents dans le pseudo, codes abîmés refusés', () => {
  const d = { graine: nouvelleGraine(), matiere: 'ma', pseudo: 'Zoé_2014', bonnes: 8, total: 10, secondes: 95, empreinte: 'abc123' };
  assert.deepEqual(decoderDefi(encoderDefi(d)), d);
  assert.match(encoderDefi(d), /^[A-Za-z0-9_-]+$/, 'utilisable tel quel dans une adresse');
  assert.equal(decoderDefi('nimporte quoi'), null);
  assert.equal(decoderDefi(encoderDefi({ ...d, bonnes: 12 })), null, 'plus de bonnes réponses que de questions');
  assert.equal(decoderDefi(encoderDefi({ ...d, matiere: 'xx' })), null);
  const url = new URL(lienDefi(d, 'https://must555.github.io/ceb-quiz/index.html?x=1#h'));
  assert.equal(url.pathname, '/ceb-quiz/index.html');
  assert.deepEqual([...url.searchParams.keys()], ['defi']);
});

test('même lien = mêmes 10 questions pour les deux amis, quel que soit leur historique', () => {
  const graine = 'k7m2p9qa';
  const tirer = (historique) => {
    const s = new QuizSession({ banque: donnees.banque, modeles: donnees.modeles, historique }, optionsDefi({ graine, matiere: '' }));
    const ids = [];
    for (let i = 0; i < 10; i++) { const q = s.suivante(); ids.push(q.enonce); s.repondre(i % 2 ? null : 'x'); }
    return ids;
  };
  const a = tirer([]);
  assert.equal(a.length, 10);
  assert.deepEqual(tirer([]), a);
  // L'historique du joueur n'entre pas dans un défi (l'app passe toujours historique: []).
  assert.equal(new Set(a).size, 10, 'anti-répétition intacte');
});

test('empreinte des données stable et sensible aux changements', () => {
  const e = empreinteDonnees(donnees.banque, donnees.modeles);
  assert.equal(e, empreinteDonnees(donnees.banque, donnees.modeles));
  assert.notEqual(e, empreinteDonnees(donnees.banque.slice(1), donnees.modeles));
});

test('qui gagne : bonnes réponses, puis rapidité', () => {
  assert.equal(comparer({ bonnes: 8, secondes: 200 }, { bonnes: 7, secondes: 50 }), 'gagne');
  assert.equal(comparer({ bonnes: 7, secondes: 90 }, { bonnes: 7, secondes: 80 }), 'perdu');
  assert.equal(comparer({ bonnes: 7, secondes: 80 }, { bonnes: 7, secondes: 80 }), 'egalite');
});

test('difficulté adaptative : 3 justes → niveau +1, 2 fautes → niveau −1, bornes 1 et 3', () => {
  const s = new QuizSession({ banque: donnees.banque, modeles: donnees.modeles }, { nbQuestions: 40, adaptatif: true, seed: 3 });
  assert.equal(s.niveau, 2);
  // On remplace la question tirée par un vrai/faux pour décider nous-mêmes du résultat.
  const forcer = (juste) => { s.suivante(); s.courante = { ...s.courante, type: 'vrai_faux', reponse: true }; return s.repondre(juste); };
  forcer(true); forcer(true); const r = forcer(true);
  assert.deepEqual(r.niveau, { avant: 2, apres: 3 });
  forcer(true); forcer(true); forcer(true);
  assert.equal(s.niveau, 3, 'pas au-delà de 3');
  forcer(false); const r2 = forcer(false);
  assert.deepEqual(r2.niveau, { avant: 3, apres: 2 });
  forcer(false); forcer(false); forcer(false); forcer(false);
  assert.equal(s.niveau, 1, 'pas en dessous de 1');
});

test('difficulté adaptative : au niveau 1, les questions faciles dominent ; sans adaptatif, rien ne change', () => {
  const part = (opts) => {
    let faciles = 0, connues = 0;
    for (let k = 0; k < 6; k++) {
      const s = new QuizSession({ banque: [], modeles: donnees.modeles }, { nbQuestions: 30, seed: 10 + k, ...opts });
      for (let i = 0; i < 30; i++) { const q = s.suivante(); if (!q) break; if (q.difficulte != null) { connues++; if (q.difficulte === 1) faciles++; } s.repondre(null); }
    }
    return faciles / connues;
  };
  const adapt = part({ adaptatif: true, niveauDepart: 1 });
  const normal = part({});
  // 2 fautes d'affilée gardent le niveau à 1 pendant tout le test (on passe toutes les questions).
  assert.ok(adapt > normal + 0.2, `adaptatif ${adapt.toFixed(2)} vs normal ${normal.toFixed(2)}`);
});
