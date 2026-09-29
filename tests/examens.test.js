// Validation des fichiers d'examens officiels : structure, documents, corrigés cohérents.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { corriger } from '../js/engine/index.js';
import { estJouable } from '../js/engine/session.js';

const lire = async (c) => JSON.parse(await readFile(new URL('../' + c, import.meta.url), 'utf8'));
const index = await lire('data/examens/index.json');
const fiches = Object.fromEntries((await lire('data/fiches.json')).fiches.map((f) => [f.id, f]));
const dispo = index.examens.filter((e) => e.statut !== 'a_encoder');
const TYPES = ['qcm', 'qcm_multi', 'vrai_faux', 'grille', 'numerique', 'texte_court', 'trous', 'ordre', 'association', 'ouverte'];

// Réponse « parfaite » construite à partir du corrigé.
function parfaite(q) {
  switch (q.type) {
    case 'numerique': return String([].concat(q.reponse)[0]);
    case 'texte_court': return [].concat(q.reponse)[0];
    case 'trous': return q.reponse.map((r) => [].concat(r)[0]);
    default: return q.reponse;
  }
}

test('au moins deux examens disponibles', () => assert.ok(dispo.length >= 2));

for (const meta of dispo) {
  test(`${meta.id} : structure, documents et corrigés`, async () => {
    const ex = await lire('data/' + meta.fichier);
    assert.equal(ex.id, meta.id);
    const livrets = new Set(ex.livrets.map((l) => l.n));
    const docs = new Map(ex.documents.map((d) => [d.id, d]));
    for (const d of ex.documents) await access(new URL('../' + d.fichier, import.meta.url)); // l'image existe
    const ids = new Set();
    let jouables = 0;
    for (const q of ex.questions) {
      const ctx = q.id;
      assert.ok(!ids.has(q.id), `id en double : ${ctx}`); ids.add(q.id);
      assert.ok(TYPES.includes(q.type), `type inconnu : ${ctx}`);
      assert.ok(livrets.has(q.livret), `livret inconnu : ${ctx}`);
      assert.ok(q.enonce?.trim(), `énoncé vide : ${ctx}`);
      if (q.fiche) assert.ok(fiches[q.fiche], `fiche inconnue ${q.fiche} : ${ctx}`);
      for (const d of q.documents ?? []) assert.ok(docs.has(d), `document ${d} manquant : ${ctx}`);
      if (q.numerisable === false || !estJouable(q)) continue;
      jouables++;
      if (q.type === 'qcm') assert.ok(q.reponse >= 0 && q.reponse < q.choix.length, `réponse hors choix : ${ctx}`);
      if (q.type === 'qcm_multi') assert.ok(q.reponse.every((i) => i >= 0 && i < q.choix.length), ctx);
      if (q.type === 'grille') { assert.equal(q.reponse.length, q.lignes.length, ctx); assert.ok(q.reponse.every((c) => c >= 0 && c < q.colonnes.length), ctx); }
      if (q.type === 'ordre') assert.deepEqual([...q.reponse].sort((a, b) => a - b), q.elements.map((_, i) => i), ctx);
      if (q.type === 'association') assert.ok(q.reponse.every(([g, d]) => g < q.gauche.length && d < q.droite.length), ctx);
      if (q.type === 'trous') assert.equal((q.texte.match(/\{\d+\}/g) ?? []).length, q.reponse.length, `nombre de trous : ${ctx}`);
      if (q.type !== 'ouverte') {
        const r = corriger(q, parfaite(q));
        assert.equal(r.correct, true, `le corrigé ne se valide pas lui-même : ${ctx}`);
        assert.equal(corriger(q, null).correct, false, `réponse vide acceptée : ${ctx}`);
      }
    }
    assert.ok(jouables >= 100, `${meta.id} : seulement ${jouables} questions jouables`);
  });
}

test('questions officielles injectées dans l\'entraînement : documents joints, sans doublon', async () => {
  const { chargerDonnees, QuizSession } = await import('../js/engine/index.js');
  const d = await chargerDonnees({ base: 'data/', fetchJson: lire });
  const qs = await d.questionsExamens();
  assert.ok(qs.length >= 150, `${qs.length} questions`);
  assert.equal(new Set(qs.map((q) => q.id)).size, qs.length);
  for (const q of qs) {
    assert.equal(q.docsResolus.length, (q.documents ?? []).length, `document manquant : ${q.id}`);
    assert.notEqual(q.type, 'ouverte');
  }
  const s = new QuizSession({ banque: [...d.banque, ...qs], modeles: d.modeles }, { seed: 1, nbQuestions: 200 });
  let q, n = 0; while ((q = s.suivante())) { if (q.source === 'examen') n++; s.repondre(null); }
  assert.ok(n > 10, `seulement ${n} questions officielles sur 200`);
});
