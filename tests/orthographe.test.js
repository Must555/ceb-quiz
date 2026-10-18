// Orthographe rectifiée : les deux graphies sont acceptées, sauf quand l'accent distingue deux mots.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { corriger } from '../js/engine/index.js';

const accepte = (attendu, saisie, souple = false) => corriger({ type: 'texte_court', reponse: [attendu], souple }, saisie).correct;

test('accent circonflexe sur i et u facultatif', () => {
  for (const [a, b] of [['connaître', 'connaitre'], ['il paraît', 'il parait'], ['chaîne', 'chaine'], ['goût', 'gout'], ['août', 'aout'], ['il plaît', 'il plait']]) {
    assert.ok(accepte(a, b), `${a} / ${b}`);
    assert.ok(accepte(b, a), `${b} / ${a}`);
  }
});

test("l'accent qui distingue deux mots reste obligatoire", () => {
  for (const [a, b] of [['sûr', 'sur'], ['dû', 'du'], ['mûr', 'mur'], ['nous vînmes', 'nous vinmes'], ["qu'il fût", "qu'il fut"], ['il fut', 'il fût'], ['aimé', 'aime']]) {
    assert.ok(!accepte(a, b), `${a} / ${b}`);
  }
});

test('trait d\'union, soudure et accent grave au futur', () => {
  for (const [a, b] of [['porte-monnaie', 'portemonnaie'], ['porte-monnaie', 'porte monnaie'], ['vingt et un', 'vingt-et-un'], ['je céderai', 'je cèderai'], ['ils répéteraient', 'ils répèteraient'], ['événement', 'évènement']]) {
    assert.ok(accepte(a, b), `${a} / ${b}`);
  }
  assert.ok(!accepte('je cède', 'je céde'));
});

test('les trous acceptent aussi les deux graphies', () => {
  const q = { type: 'trous', reponse: [['connaître'], ['week-end']], souple: false };
  assert.equal(corriger(q, ['connaitre', 'weekend']).correct, true);
});
