// Descriptions Google des fiches : les points des abréviations (J.-C., av., env.…) ne coupent pas les phrases.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { descriptionGoogle } from '../scripts/generer.mjs';

const fiches = ['fr', 'ma', 'hg', 'sc'].flatMap((m) => JSON.parse(readFileSync(new URL(`../data/fiches-${m}.json`, import.meta.url))).fiches)
  .concat(JSON.parse(readFileSync(new URL('../data/fiches.json', import.meta.url))).fiches ?? []);

test('aucune description ne contient un morceau d\'abréviation', () => {
  for (const f of fiches) {
    const d = descriptionGoogle(f);
    assert.doesNotMatch(d, /(^|\s)-C\.|\bav\.\s*\)|\bav\.\s*$|J\.\s/, `${f.id} : ${d}`);
    assert.ok(d.length <= 160, `${f.id} : ${d.length} caractères`);
  }
});

test('« av. J.-C. » reste entier', () => {
  const d = descriptionGoogle({ titre: 'Test', regle: ["L'écriture apparait vers 3500 av. J.-C. en Mésopotamie."] });
  assert.match(d, /3500 av\. J\.-C\. en Mésopotamie\./);
});
