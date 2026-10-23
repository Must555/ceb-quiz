// Fichiers générés (pages fiches, sitemap, service worker) : à jour et cohérents.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { generer } from '../scripts/generer.mjs';

const out = await generer();
const lire = (p) => readFile(new URL('../' + p, import.meta.url), 'utf8');

test('les fichiers générés sont à jour (sinon : npm run generer)', async () => {
  for (const [p, contenu] of Object.entries(out)) {
    let disque = null;
    try { disque = await lire(p); } catch { /* absent */ }
    assert.ok(disque === contenu, `${p} n'est pas à jour : lance « npm run generer » puis recommence`);
  }
});

test('une page par fiche, avec titre, description, lien d\'entraînement et canonical', () => {
  const pages = Object.keys(out).filter((p) => /^fiches\/(?!index).+\.html$/.test(p));
  assert.ok(pages.length >= 190, String(pages.length));
  for (const p of pages) {
    const h = out[p];
    const titre = h.match(/<title>([^<]+)<\/title>/)[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    assert.ok(titre.length <= 60, `${p} : titre de ${titre.length} caractères (Google coupe après ~60) : ${titre}`);
    assert.match(titre, / – Fiche CEB/);
    const desc = h.match(/<meta name="description" content="([^"]+)">/)[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    assert.ok(desc.length >= 100 && desc.length <= 160, `${p} : description de ${desc.length} caractères`);
    assert.match(h, /"@type":"BreadcrumbList"/);
    assert.match(h, /<meta name="description" content="[^"]{40,260}">/);
    assert.match(h, new RegExp(`<link rel="canonical" href="https://missionceb.be/${p}">`));
    assert.match(h, /href="\.\.\/app\/(\?fiche=|")/);
    assert.ok(!/\bundefined\b|\bnull\b|\bNaN\b/.test(h.replace(/<script type="application\/ld\+json">.*?<\/script>/s, '')), p);
  }
  // Chaque adresse du plan du site correspond à un fichier publié.
  for (const [, u] of out['sitemap.xml'].matchAll(/<loc>https:\/\/missionceb\.be\/([^<]*)<\/loc>/g)) {
    const f = u === '' ? 'index.html' : u.endsWith('/') ? `${u}index.html` : u;
    assert.ok(out[f] || f === 'index.html', `sitemap : ${u} sans fichier`);
  }
});

test('le service worker met en cache des fichiers qui existent tous, et jamais les pages publiques', async () => {
  const liste = JSON.parse(out['sw.js'].match(/const FICHIERS = (\[[\s\S]*?\]);/)[1]);
  assert.ok(liste.includes('index.html') && liste.includes('js/app/app.js') && liste.includes('data/catalogue.json'));
  assert.ok(!liste.some((f) => f.startsWith('fiches/') || f === 'sw.js' || f.startsWith('assets/20')), 'ni pages publiques ni portfolios dans le cœur');
  for (const f of liste.filter((x) => x !== './')) await access(new URL('../' + f, import.meta.url));
  assert.match(out['sw.js'], /const VERSION = '[0-9a-f]{12}'/);
});

test('pages « recherche » : titres courts, descriptions, fil d\'Ariane, liens vers l\'application', () => {
  const pages = Object.keys(out).filter((p) => /^(examens|exercices|ceb-2027|reviser-le-ceb)\//.test(p));
  assert.ok(pages.length >= 20, String(pages.length));
  const dec = (x) => x.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  for (const p of pages) {
    const h = out[p];
    const titre = dec(h.match(/<title>([^<]+)<\/title>/)[1]);
    assert.ok(titre.length <= 60, `${p} : titre de ${titre.length} caractères : ${titre}`);
    const desc = dec(h.match(/<meta name="description" content="([^"]+)">/)[1]);
    assert.ok(desc.length >= 100 && desc.length <= 160, `${p} : description de ${desc.length} caractères`);
    assert.match(h, /"@type":"BreadcrumbList"/);
    assert.match(h, /href="\.\.\/app\//);
    assert.ok(!/undefined|NaN/.test(h), p);
  }
  assert.match(out['exercices/maths.html'], /class="exemple"/);
  assert.match(out['examens/ceb-2026-tc.html'], /app\/\?examen=ceb-2026-tc/);
});
