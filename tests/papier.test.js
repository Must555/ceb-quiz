// Examens papier (Lot C) : codes, reproductibilité, anti-doublon, tracés.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chargerDonnees, createRng, normaliserTexte } from '../js/engine/index.js';
import { FORMATS, composerExamen, nouveauCode, lireCode } from '../js/engine/papier.js';
import { TRACES, tirerTraces } from '../js/engine/traces.js';

const fetchJson = async (c) => JSON.parse(await readFile(new URL('../' + c, import.meta.url), 'utf8'));
const donnees = await chargerDonnees({ base: 'data/', fetchJson });
donnees.banque.push(...await donnees.questionsExamens());

test('codes : création et lecture', () => {
  for (const f of Object.keys(FORMATS)) {
    const c = nouveauCode(f);
    assert.match(c, /^[A-Z]-[2-9A-Z]{5}$/);
    assert.equal(lireCode(c), c);
    assert.equal(lireCode(c.toLowerCase().replace('-', ' ')), c);
  }
  for (const faux of ['', 'X-ABCDE', 'C-ABCD', 'C-ABCDEF', 'C-0O1IL', null]) assert.equal(lireCode(faux), null, String(faux));
});

test('un même code redonne exactement le même examen', () => {
  for (const f of Object.keys(FORMATS)) {
    const c = nouveauCode(f);
    assert.deepEqual(composerExamen(donnees, c), composerExamen(donnees, c));
  }
});

test('deux codes différents donnent des examens différents', () => {
  const a = composerExamen(donnees, 'C-22222').sections.flatMap((s) => s.questions.map((q) => q.id));
  const b = composerExamen(donnees, 'C-33333').sections.flatMap((s) => s.questions.map((q) => q.id));
  const communs = a.filter((id) => b.includes(id));
  assert.ok(communs.length < a.length / 3, `${communs.length} questions communes`);
});

test('composition : nombre de questions, matières, aucun doublon, documents limités', () => {
  const rng = createRng('papier');
  for (let k = 0; k < 25; k++) {
    const f = rng.pick(Object.keys(FORMATS));
    const code = nouveauCode(f, rng.next);
    const ex = composerExamen(donnees, code);
    const ids = new Set(); const contenus = new Set(); const docs = new Set();
    ex.sections.forEach((s, i) => {
      const def = FORMATS[f].sections[i];
      assert.equal(s.questions.length, def.n + (def.traces ?? 0), `${code} ${s.id}`);
      for (const q of s.questions) {
        assert.ok(!ids.has(q.id), `${code} : id en double ${q.id}`); ids.add(q.id);
        const cle = normaliserTexte(`${q.enonce}|${(q.choix ?? q.elements ?? q.lignes ?? []).join('|')}`);
        assert.ok(!contenus.has(cle), `${code} : énoncé en double ${q.enonce}`); contenus.add(cle);
        if (q.type !== 'trace') assert.ok(def.matieres.includes(q.matiere), `${code} : matière ${q.matiere} dans ${s.id}`);
        assert.ok(Number.isInteger(q.pointsPapier) && q.pointsPapier > 0);
        (q.docsResolus ?? []).forEach((d) => docs.add(d.fichier));
        assert.ok((q.docsResolus ?? []).length <= 2);
      }
    });
    assert.ok(docs.size <= 6, `${code} : ${docs.size} pages de portfolio`);
    assert.equal(ex.total, ex.sections.reduce((t, s) => t + s.questions.reduce((u, q) => u + q.pointsPapier, 0), 0));
  }
});

test('tracés : chaque famille produit des dessins valides et variés', () => {
  for (const [nom, gen] of Object.entries(TRACES)) {
    const rng = createRng(`trace-${nom}`);
    const ids = new Set();
    let ok = 0;
    for (let i = 0; i < 300; i++) {
      const q = gen(rng);
      if (!q) continue;
      ok++;
      ids.add(q.id);
      assert.equal(q.type, 'trace');
      assert.equal(q.numerisable, false);
      for (const champ of ['figure', 'solution']) {
        assert.match(q[champ], /^<svg [^>]*viewBox="0 0 [\d.]+ [\d.]+"/, `${nom} ${champ}`);
        assert.doesNotMatch(q[champ], /NaN|undefined|Infinity/, `${nom} ${champ}`);
      }
      assert.ok(q.enonce && q.reponseTexte && q.explication && q.fiche, nom);
      assert.ok(donnees.fiches[q.fiche], `${nom} : fiche inconnue ${q.fiche}`);
    }
    assert.ok(ok >= 250, `${nom} : seulement ${ok} tracés produits`);
    assert.ok(ids.size >= (['axesSymetrie', 'cercle'].includes(nom) ? 10 : 40), `${nom} : seulement ${ids.size} variantes`);
  }
  assert.equal(tirerTraces(createRng(1), 6).length, 6);
});

test('les tracés restent hors du jeu à l\'écran', () => {
  assert.ok(!donnees.modeles.some((m) => m.id.startsWith('trace-')));
  assert.ok(!donnees.banque.some((q) => q.type === 'trace'));
});

test('fiche ciblée : notions respectées, reproductible, sans doublon', async () => {
  const { composerFiche } = await import('../js/engine/papier.js');
  const notions = ['ma-fractions', 'fr-homophones', 'ma-symetrie'];
  const a = composerFiche(donnees, 'T-7KQ4M', notions);
  assert.deepEqual(a, composerFiche(donnees, 'T-7KQ4M', notions));
  assert.equal(a.sections.length, 3);
  const ids = new Set();
  for (const s of a.sections) {
    assert.ok(s.rappel && s.rappel.regle.length);
    assert.ok(s.questions.length >= 5, `${s.id} : ${s.questions.length} exercices`);
    for (const q of s.questions) {
      assert.equal(q.fiche, s.id);
      assert.ok(!ids.has(q.id)); ids.add(q.id);
    }
  }
  assert.ok(a.sections[2].questions.some((q) => q.type === 'trace'), 'la symétrie a un tracé');
  // une seule notion : une fiche plus longue
  assert.ok(composerFiche(donnees, 'T-22222', ['ma-proportionnalite']).nbQuestions >= 10);
  assert.throws(() => composerFiche(donnees, 'C-22222', notions));
  assert.throws(() => composerFiche(donnees, 'T-22222', []));
  assert.throws(() => composerExamen(donnees, 'T-22222'));
});

test('fiche ciblée : chaque notion a au moins un exercice', async () => {
  const { composerFiche } = await import('../js/engine/papier.js');
  for (const id of Object.keys(donnees.fiches)) {
    assert.ok(composerFiche(donnees, 'T-33333', [id]).nbQuestions >= 1, id);
  }
});
