// CEB 2027 : data/ceb-2027.json est la source unique ; l'accueil et l'espace parents doivent la suivre.
// Le jour de la circulaire : modifier le JSON, npm run generer, npm test → ce fichier dit ce qui reste à aligner.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CEB } from '../js/app/parents.js';
import { pageCeb2027 } from '../scripts/generer.mjs';

const lire = (p) => readFile(new URL('../' + p, import.meta.url), 'utf8');
const C = JSON.parse(await lire('data/ceb-2027.json'));
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const d = (iso) => new Date(iso + 'T12:00:00');

test('data/ceb-2027.json est complet et cohérent', () => {
  assert.ok(['annonce', 'confirme'].includes(C.statut), 'statut : "annonce" ou "confirme"');
  assert.match(C.miseAJour, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(C.jours.length >= 4);
  for (const j of C.jours) {
    assert.match(j.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(d(j.date).getFullYear(), C.annee);
    assert.ok(![0, 6].includes(d(j.date).getDay()), `${j.date} tombe un week-end`);
  }
  const dates = C.jours.map((j) => j.date);
  assert.deepEqual([...dates].sort(), dates, 'jours dans l\'ordre');
  if (C.statut === 'confirme') {
    assert.ok(C.source?.date && (C.source.numero || C.source.intitule), 'confirmé : préciser la circulaire (numéro ou intitulé, et date)');
    assert.ok(!C.source.url || /^https:\/\//.test(C.source.url));
  }
});

test('l\'espace parents (js/app/parents.js) suit data/ceb-2027.json', () => {
  assert.equal(CEB.annee, C.annee);
  assert.equal(CEB.debut, C.jours[0].date);
  assert.deepEqual(CEB.jours.map((j) => [j.date, j.matiere]), C.jours.map((j) => [j.date, j.matiere]));
  for (const j of CEB.jours) {
    const x = d(j.date);
    assert.equal(j.jour.toLowerCase(), `${JOURS[x.getDay()]} ${x.getDate()} ${MOIS[x.getMonth()]}`);
  }
  assert.equal(CEB.seuilMatiere, C.seuils.matiere);
  assert.equal(CEB.seuilMoyenne, C.seuils.moyenne);
});

test('le compte à rebours de l\'accueil (index.html) suit data/ceb-2027.json', async () => {
  const h = await lire('index.html');
  const x = d(C.jours[0].date);
  assert.ok(h.includes(`new Date('${C.jours[0].date}T08:00:00')`), 'index.html : date du compte à rebours');
  assert.ok(h.includes(`${JOURS[x.getDay()]} ${x.getDate()} ${MOIS[x.getMonth()]}</div>`), 'index.html : libellé du premier jour');
  assert.ok(h.includes(`CEB ${C.annee} dans`));
});

test('page CEB 2027 : statut affiché, date de mise à jour, FAQ en données structurées', () => {
  for (const statut of ['annonce', 'confirme']) {
    const page = pageCeb2027({ ...C, statut, source: { intitule: 'Circulaire', numero: '9999', date: '2027-01-15', url: 'https://www.enseignement.be/x' }, resultats: statut === 'confirme' ? '2027-07-01' : null });
    assert.ok(page.includes(statut === 'confirme' ? 'Informations officielles' : 'en attente de la circulaire'));
    if (statut === 'confirme') assert.ok(page.includes('n° 9999') && page.includes('https://www.enseignement.be/x') && page.includes('1 juillet 2027'));
    const ld = [...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).flat();
    const types = ld.map((o) => o['@type']);
    assert.ok(types.includes('FAQPage') && types.includes('WebPage'), types.join(','));
    assert.equal(ld.find((o) => o['@type'] === 'WebPage').dateModified, C.miseAJour);
    assert.ok(!/undefined|NaN|null/.test(page.replace(/<script[\s\S]*?<\/script>/g, '')));
  }
});
