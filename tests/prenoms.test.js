// Règle du projet : dans les questions générées, uniquement des prénoms français.
// (Les examens officiels du CEB, eux, sont reproduits tels quels.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const INTERDITS = ['Inès', 'Lina', 'Nora', 'Olivia', 'Sarah', 'Yasmine', 'Amira', 'Elif', 'Fatima', 'Aya', 'Nina',
  'Noah', 'Adam', 'Mohamed', 'Rayan', 'Mehdi', 'Yanis', 'Liam', 'Sacha', 'Ilyes', 'Elias', 'Amine', 'Mattéo',
  'Kenzo', 'Bilal', 'Nassim', 'Sami', 'Sam', 'Ryan', 'Kevin', 'Dylan', 'Jessica', 'Jennifer', 'Brandon', 'Kylian',
  'Ayoub', 'Omar', 'Youssef', 'Ibrahim', 'Aïcha', 'Leila', 'Leïla', 'Sofiane', 'Hamza', 'Ali', 'Mia', 'Ava', 'Jason'];
const re = new RegExp(`(?<![\\p{L}\\d])(${INTERDITS.join('|')})(?![\\p{L}\\d])`, 'u');
const fichiers = [
  ...readdirSync('data/faits').map((f) => `data/faits/${f}`),
  ...readdirSync('data/modeles').map((f) => `data/modeles/${f}`),
  ...readdirSync('data').filter((f) => f.startsWith('fiches')).map((f) => `data/${f}`),
  ...readdirSync('js/engine/generateurs').map((f) => `js/engine/generateurs/${f}`),
  'js/engine/traces.js',
];

test('les questions générées n\'utilisent que des prénoms français', () => {
  for (const f of fichiers) {
    readFileSync(f, 'utf8').split('\n').forEach((ligne, i) => {
      const m = ligne.match(re);
      assert.equal(m, null, `${f}:${i + 1} contient le prénom « ${m?.[1]} »`);
    });
  }
});
