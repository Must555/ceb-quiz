// Page « Pour les enseignants » et kit pour les écoles : fichiers présents, liens valides.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { pageEnseignants } from '../scripts/generer.mjs';

const existe = async (p) => { try { await access(new URL('../' + p, import.meta.url)); return true; } catch { return false; } };

test('kit pour les écoles : affiche, billets et QR code présents', async () => {
  for (const f of ['affiche-mission-ceb.pdf', 'billets-journal-de-classe.pdf', 'qr-missionceb.png', 'qr-missionceb.svg']) assert.ok(await existe(`assets/kit/${f}`), f);
  const svg = await readFile(new URL('../assets/kit/qr-missionceb.svg', import.meta.url), 'utf8');
  assert.match(svg, /^<svg/);
});

test('page enseignants : chaque lien interne mène à un fichier qui existe', async () => {
  const h = pageEnseignants();
  const liens = [...h.matchAll(/href="\.\.\/([^"#?]*)"/g)].map((m) => m[1]);
  assert.ok(liens.length > 8);
  for (const l of liens) assert.ok(await existe(l.endsWith('/') || l === '' ? `${l}index.html` : l), l);
  assert.ok(h.includes('<link rel="canonical" href="https://missionceb.be/enseignants/">'));
});
