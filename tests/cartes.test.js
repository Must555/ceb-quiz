// Bibliothèque des fiches et cartes-mémoire : recherche, paquet du jour, répétition espacée.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { filtrerFiches, paquet, noterCarte, cartesDues, carteDue, exercicesParNotion, INTERVALLES_CARTES } from '../js/app/cartes.js';
import { chargerDonnees } from '../js/engine/index.js';

const fetchJson = async (chemin) => JSON.parse(await readFile(new URL('../' + chemin, import.meta.url), 'utf8'));
const donnees = await chargerDonnees({ base: 'data/', fetchJson });
const fiches = donnees.fiches;
const joueur = () => ({ notions: {}, cartes: {} });

test('recherche sans accents, par matière et par statut', () => {
  assert.ok(filtrerFiches(fiches, { texte: 'pourcentage' }).some((f) => f.id === 'ma-pourcentages'));
  assert.ok(filtrerFiches(fiches, { texte: 'SIECLE' }).length > 0, 'les accents et majuscules sont ignorés');
  assert.ok(filtrerFiches(fiches, { matiere: 'hg' }).every((f) => f.matiere === 'hg'));
  assert.equal(filtrerFiches(fiches).length, Object.keys(fiches).length);
  const j = { notions: { 'ma-pourcentages': { r: [0, 0, 0, 0] } } };
  assert.deepEqual(filtrerFiches(fiches, { statut: 'fragile', j }).map((f) => f.id), ['ma-pourcentages']);
});

test('paquet : cartes dues d\'abord, puis notions fragiles, 12 cartes au plus, sans doublon', () => {
  const j = joueur();
  j.cartes['fr-accords'] = { boite: 1, due: '2026-10-19' };
  j.cartes['ma-aires'] = { boite: 2, due: '2026-12-01' }; // pas encore due
  j.notions['hg-siecles'] = { r: [0, 0, 0] };
  const p = paquet(j, fiches, { jour: '2026-10-20', rng: () => 0.5 });
  assert.equal(p.length, 12);
  assert.equal(new Set(p).size, p.length);
  if (fiches['fr-accords']) assert.equal(p[0], 'fr-accords');
  if (fiches['hg-siecles']) assert.ok(p.indexOf('hg-siecles') <= 1);
  assert.ok(!p.includes('ma-aires'), 'une carte pas encore due attend son tour');
  assert.deepEqual(paquet(j, fiches, { ids: ['ma-pourcentages', 'inconnue'] }), ['ma-pourcentages']);
});

test('répétition espacée : « Je savais » espace la carte, « À revoir » la ramène demain', () => {
  const j = joueur();
  const jour = '2026-10-20';
  noterCarte(j, 'ma-pourcentages', true, jour);
  assert.equal(j.cartes['ma-pourcentages'].due, '2026-10-21');
  noterCarte(j, 'ma-pourcentages', true, '2026-10-21');
  assert.equal(j.cartes['ma-pourcentages'].due, '2026-10-24');
  for (let i = 0; i < 5; i++) noterCarte(j, 'ma-pourcentages', true, jour);
  assert.equal(j.cartes['ma-pourcentages'].boite, INTERVALLES_CARTES.length);
  assert.equal(j.cartes['ma-pourcentages'].due, '2026-11-03');
  noterCarte(j, 'ma-pourcentages', false, jour);
  assert.equal(j.cartes['ma-pourcentages'].boite, 1);
  assert.equal(j.cartes['ma-pourcentages'].due, '2026-10-21');
  assert.deepEqual(cartesDues(j, '2026-10-21'), ['ma-pourcentages']);
  assert.equal(carteDue(j, 'ma-pourcentages', jour), false);
  assert.equal(j.notions['ma-pourcentages'], undefined, 'les cartes ne modifient pas la maîtrise du coach');
});

test('la plupart des fiches ont des exercices à l\'écran pour « S\'entraîner »', () => {
  const n = exercicesParNotion(donnees.banque, donnees.modeles);
  const avec = Object.keys(fiches).filter((id) => n[id] > 0).length;
  assert.ok(avec / Object.keys(fiches).length > 0.8, `${avec} / ${Object.keys(fiches).length}`);
});
