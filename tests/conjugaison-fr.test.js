// Conjugaison (étape 2) : formes difficiles des verbes irréguliers et nombre de verbes connus.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conjuguer, participePresent, verbesIrreguliers } from '../js/engine/generateurs/conjugaison.js';
import { VERBES_CONJ } from '../js/engine/generateurs/gen-francais.js';
import { VERBES_ER, VERBES_C } from '../js/engine/generateurs/tc-fr.js';

const f = (v, t, idx, pronom = 'il') => conjuguer(v, t, { pronom, idx }).formesAcceptees;

test('formes difficiles des verbes irréguliers', () => {
  assert.deepEqual(f('acquérir', 'passe_simple', 5), ['acquirent']);
  assert.deepEqual(f('cueillir', 'futur', 0), ['cueillerai']);
  assert.deepEqual(f('résoudre', 'passe_simple', 3), ['résolûmes']);
  assert.deepEqual(f('vaincre', 'subjonctif', 2), ['vainque']);
  assert.deepEqual(f('asseoir', 'passe_simple', 2), ['assit']);
  assert.deepEqual(f('asseoir', 'present', 2), ['assied', 'assoit']);
  assert.deepEqual(f('asseoir', 'futur', 0), ['assiérai', 'assoirai']);
  assert.deepEqual(f('naître', 'passe_simple', 2), ['naquit']);
  assert.deepEqual(f('mourir', 'futur', 3), ['mourrons']);
  assert.deepEqual(f('acquérir', 'futur', 1), ['acquerras']);
  assert.deepEqual(f('acquérir', 'present', 5), ['acquièrent']);
  assert.deepEqual(f('coudre', 'present', 3), ['cousons']);
  assert.deepEqual(f('peindre', 'passe_simple', 5), ['peignirent']);
  assert.deepEqual(f('vivre', 'passe_simple', 2), ['vécut']);
  assert.deepEqual(f('rire', 'imparfait', 3), ['riions']);
  assert.deepEqual(f('fuir', 'present', 3), ['fuyons']);
  assert.deepEqual(f('interdire', 'present', 4), ['interdisez']);
  assert.deepEqual(f('prévoir', 'futur', 0), ['prévoirai']);
  assert.deepEqual(f('valoir', 'subjonctif', 2), ['vaille']);
  assert.deepEqual(f('faire', 'subjonctif', 3), ['fassions']);
  assert.deepEqual(f('aller', 'subjonctif', 5), ['aillent']);
  assert.deepEqual(f('prendre', 'subjonctif', 0), ['prenne']);
  assert.deepEqual(f('recevoir', 'subjonctif', 4), ['receviez']);
  assert.deepEqual(f('finir', 'subjonctif', 1), ['finisses']);
  assert.deepEqual(f('mourir', 'passe_compose', 5, 'elles'), ['sont mortes']);
  assert.deepEqual(f('asseoir', 'passe_compose', 5, 'ils'), ['ont assis']);
  assert.equal(participePresent('savoir'), 'sachant');
  assert.equal(participePresent('avoir'), 'ayant');
  assert.equal(participePresent('commencer'), 'commençant');
  assert.equal(participePresent('fuir'), 'fuyant');
});

test('au moins 240 verbes distincts', () => {
  const tous = new Set([...VERBES_CONJ.map(([v]) => v), ...verbesIrreguliers(), ...VERBES_ER.map(([v]) => v), ...VERBES_C.map(([v]) => v)]);
  assert.ok(tous.size >= 240, `${tous.size} verbes`);
});
