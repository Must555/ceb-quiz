// Fiches approfondies (champs facultatifs comprendre, exemplesExpliques, pieges, auCEB…) :
// chaque vraie question citée existe dans l'examen, sur la notion de la fiche ou une notion voisine,
// et les textes suivent les règles du site (« : » et jamais « ÷ », pas de renvoi au corrigé).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { blocApprofondi } from '../scripts/generer.mjs';

const lire = async (p) => JSON.parse(await readFile(new URL('../' + p, import.meta.url), 'utf8'));
const fiches = [];
for (const m of ['fr', 'ma', 'hg', 'sc']) fiches.push(...(await lire(`data/fiches-${m}.json`)).fiches);
const approfondies = fiches.filter((f) => f.comprendre || f.exemplesExpliques || f.pieges || f.auCEB || f.auCEBNote);
const examens = {};
for (const e of (await lire('data/examens/index.json')).examens) examens[e.id] = await lire(`data/examens/${e.id}.json`);

test('au moins les 9 fiches « explorées, non indexées » sont approfondies', () => {
  const ids = approfondies.map((f) => f.id);
  for (const id of ['sc-chaines', 'sc-lumiere-son', 'fr-determinants-pronoms', 'sc-demarche', 'sc-materiaux', 'sc-metamorphoses', 'fr-groupe-nominal', 'ma-droite-graduee', 'fr-reel-imaginaire']) assert.ok(ids.includes(id), id);
});

test('fiches approfondies : structure complète', () => {
  for (const f of approfondies) {
    assert.ok(f.comprendre?.length >= 2 && f.comprendre.every((p) => typeof p === 'string' && p.length > 40), `${f.id} : comprendre`);
    assert.ok(f.exemplesExpliques?.length >= 3 && f.exemplesExpliques.every((x) => x.cas && x.explication), `${f.id} : exemplesExpliques`);
    assert.ok(f.pieges?.length >= 3, `${f.id} : pieges`);
    assert.ok(f.auCEB?.length || f.auCEBNote, `${f.id} : auCEB ou auCEBNote`);
  }
});

test('chaque vraie question citée existe (examen, livret, numéro)', () => {
  for (const f of approfondies) for (const x of f.auCEB ?? []) {
    assert.ok(x.examens?.length && x.libelle && x.texte, `${f.id} : renvoi incomplet`);
    for (const id of x.examens) {
      const ex = examens[id];
      assert.ok(ex, `${f.id} : examen inconnu ${id}`);
      for (const n of x.questions) {
        const q = ex.questions.find((q) => q.livret === x.livret && String(q.numero) === n);
        assert.ok(q, `${f.id} : ${id} livret ${x.livret} question ${n} introuvable`);
      }
      const premiere = x.questions[0].match(/^A?\d+/)[0];
      assert.match(x.libelle, new RegExp(`^questions? ${premiere}(?![0-9])`), `${f.id} : libellé « ${x.libelle} » ≠ question ${x.questions[0]}`);
    }
  }
});

test('textes des fiches approfondies : notation et ton du site', () => {
  for (const f of approfondies) {
    const tout = JSON.stringify([f.comprendre, f.exemplesExpliques, f.pieges, f.auCEB, f.auCEBIntro, f.auCEBNote].filter((x) => x !== undefined));
    assert.doesNotMatch(tout, /÷/, `${f.id} : « ÷ »`);
    assert.doesNotMatch(tout, /selon le corrigé/i, f.id);
    assert.doesNotMatch(tout, /\bundefined\b|\bNaN\b|\bnull\b/, f.id);
    assert.doesNotMatch(tout, /\d h\d|\d:\d\d/, `${f.id} : heures au format « 6 h 57 »`);
  }
});

test('blocApprofondi : rubriques et liens vers les pages d\'examens', () => {
  const parId = Object.fromEntries(Object.values(examens).map((e) => [e.id, e]));
  for (const f of approfondies) {
    const h = blocApprofondi(f, parId);
    for (const t of ['Comprendre la règle', 'Exemples expliqués', 'Les pièges du CEB', 'Ce que le CEB t\'a déjà demandé']) assert.ok(h.includes(t), `${f.id} : ${t}`);
    for (const x of f.auCEB ?? []) for (const id of x.examens) assert.ok(h.includes(`../examens/${id}.html`), `${f.id} : lien ${id}`);
  }
  assert.equal(blocApprofondi({ id: 'x' }), '');
});
