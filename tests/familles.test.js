// Contrôle qualité de toutes les familles de questions (modèles) :
// textes sans trou, corrigé auto-cohérent, choix distincts, variété suffisante, fiche et domaine connus.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chargerDonnees, genererVariante, corriger, createRng, normaliserTexte } from '../js/engine/index.js';

const fetchJson = async (c) => JSON.parse(await readFile(new URL('../' + c, import.meta.url), 'utf8'));
const donnees = await chargerDonnees({ base: 'data/', fetchJson });
const domaines = new Set(donnees.catalogue.matieres.flatMap((m) => m.domaines.map((d) => d.id)));

function parfaite(q) {
  switch (q.type) {
    case 'numerique': return String(q.reponse).replace('.', ',');
    case 'texte_court': return [].concat(q.reponse)[0];
    case 'trous': return q.reponse.map((r) => [].concat(r)[0]);
    default: return q.reponse;
  }
}
function fausse(q) {
  switch (q.type) {
    case 'qcm': return (q.reponse + 1) % q.choix.length;
    case 'vrai_faux': return !q.reponse;
    case 'numerique': return String(q.reponse + 1);
    case 'ordre': return [...q.reponse].reverse();
    default: return undefined;
  }
}
const TEXTE_CASSE = /undefined|NaN|Infinity|\[object|\{|\}|\s[.,](?!\d)| {2,}/;

test('bases de faits : clés uniques', () => {
  for (const m of donnees.modeles.filter((x) => x.generateur === 'faits')) {
    const cle = m.cle ?? 'nom';
    const vus = new Set();
    for (const it of m.items) {
      const k = String([].concat(it[cle])[0]);
      assert.ok(k && k !== 'undefined', `${m.id} : élément sans « ${cle} »`);
      assert.ok(!vus.has(k), `${m.id} : élément en double « ${k} »`);
      vus.add(k);
    }
  }
});

for (const m of donnees.modeles) {
  test(`famille ${m.id}`, () => {
    const rng = createRng(m.id);
    const ids = new Set();
    let fiches = new Set();
    for (let i = 0; i < 400; i++) {
      const q = genererVariante(m, rng, ids);
      if (!q) break;
      ids.add(q.id);
      const ctx = `${m.id} → « ${q.enonce} »`;
      assert.ok(q.fiche && donnees.fiches[q.fiche], `${ctx} : fiche inconnue ${q.fiche}`);
      fiches.add(q.fiche);
      assert.ok(domaines.has(q.domaine), `${ctx} : domaine inconnu ${q.domaine}`);
      const textes = [q.enonce, q.explication ?? '', q.unite ?? '', ...(q.choix ?? []), ...(q.elements ?? []), ...(q.lignes ?? []), ...(q.colonnes ?? []), ...(q.gauche ?? []), ...(q.droite ?? [])];
      for (const t of textes) assert.doesNotMatch(String(t), TEXTE_CASSE, `${ctx} : texte cassé « ${t} »`);
      if (m.id.includes('-f-')) assert.ok(q.explication?.length > 5, `${ctx} : explication manquante`);
      const unique = (arr, quoi) => assert.equal(new Set(arr.map((x) => String(x).trim().toLowerCase())).size, arr.length, `${ctx} : ${quoi} en double ${JSON.stringify(arr)}`);
      if (q.type === 'qcm') { assert.ok(q.choix.length >= 2 && q.reponse >= 0 && q.reponse < q.choix.length, ctx); unique(q.choix, 'choix'); }
      if (q.type === 'ordre') unique(q.elements, 'éléments');
      if (q.type === 'association') { unique(q.gauche, 'gauche'); unique(q.droite, 'droite'); }
      if (q.type === 'grille') { unique(q.lignes, 'lignes'); assert.ok(q.reponse.every((c) => c >= 0 && c < q.colonnes.length), ctx); }
      if (q.type === 'numerique') {
        assert.ok(Number.isFinite(q.reponse), `${ctx} : réponse ${q.reponse}`);
        assert.ok(Math.abs(q.reponse * 1000 - Math.round(q.reponse * 1000)) < 1e-6, `${ctx} : réponse non arrondie ${q.reponse}`);
      }
      if (q.type === 'texte_court') assert.ok([].concat(q.reponse).every((r) => String(r).trim()), ctx);
      assert.equal(corriger(q, parfaite(q)).correct, true, `${ctx} : la bonne réponse est refusée`);
      const f = fausse(q);
      if (f !== undefined) assert.equal(corriger(q, f).correct, false, `${ctx} : une mauvaise réponse est acceptée`);
    }
    const min = m.variantesMin ?? 20;
    assert.ok(ids.size >= min, `${m.id} : seulement ${ids.size} variantes (minimum ${min})`);
  });
}
