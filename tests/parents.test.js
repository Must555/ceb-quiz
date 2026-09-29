// Espace parents : PIN, temps de jeu, bilan de la semaine, indicateur CEB, plan de révision.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chargerDonnees } from '../js/engine/index.js';
import { nouveauJoueur } from '../js/app/store.js';
import { enregistrerSession } from '../js/app/progression.js';
import { CEB, hashPin, pinValide, verifierPin, etatTemps, bilanSemaine, indicateurCEB, planRevision, decaler, joursEntre } from '../js/app/parents.js';

const fetchJson = async (c) => JSON.parse(await readFile(new URL('../' + c, import.meta.url), 'utf8'));
const { fiches } = await chargerDonnees({ base: 'data/', fetchJson });
const J = '2026-10-07'; // un mercredi

const resume = (questions, bonnes, secondes, dom = 'ma.grandeurs', mode = 'entrainement') => ({
  mode, questions, bonnes, points: bonnes, max: questions, pourcentage: Math.round((bonnes / questions) * 100), xp: bonnes * 10,
  meilleureSerie: 1, dureeSecondes: secondes, parDomaine: { [dom]: { posees: questions, bonnes } }, idsVus: [], details: [],
});

test('PIN : 4 chiffres, stocké haché, vérifié', () => {
  assert.ok(pinValide('0427'));
  for (const faux of ['123', '12345', 'abcd', '', null]) assert.ok(!pinValide(faux));
  const p = { pinHash: hashPin('0427') };
  assert.notEqual(p.pinHash, '0427');
  assert.ok(verifierPin(p, '0427'));
  assert.ok(!verifierPin(p, '0428'));
  assert.ok(!verifierPin({ pinHash: null }, '0427'));
});

test('temps de jeu : cumul du jour, limite, bonus et illimité', () => {
  const j = nouveauJoueur('Lea', '🦊', '#fff');
  enregistrerSession(j, resume(10, 7, 600), 'entrainement', J);
  enregistrerSession(j, resume(10, 8, 540), 'entrainement', J);
  assert.equal(j.jours[J].secondes, 1140);
  assert.deepEqual(j.jours[J].mat.ma, { posees: 20, bonnes: 15 });
  assert.equal(etatTemps(j, {}, J).atteint, false);
  const p = { limites: { [j.id]: 15 }, bonus: {} };
  assert.deepEqual(etatTemps(j, p, J), { limite: 15, minutes: 19, restant: 0, atteint: true });
  p.bonus[j.id] = { [J]: 15 };
  assert.equal(etatTemps(j, p, J).atteint, false);
  assert.equal(etatTemps(j, p, J).restant, 11);
  p.bonus[j.id] = { [J]: 'illimite' };
  assert.equal(etatTemps(j, p, J).limite, null);
  // le lendemain, le compteur repart de zéro et le bonus ne compte plus
  assert.equal(etatTemps(j, p, decaler(J, 1)).minutes, 0);
  assert.equal(etatTemps(j, p, decaler(J, 1)).limite, 15);
});

test('bilan de la semaine : 7 jours, totaux, matières, examens', () => {
  const j = nouveauJoueur('Lea', '🦊', '#fff');
  enregistrerSession(j, resume(10, 5, 300, 'fr.grammaire'), 'entrainement', decaler(J, -9)); // semaine d'avant
  enregistrerSession(j, resume(10, 6, 300, 'fr.grammaire'), 'entrainement', decaler(J, -6));
  enregistrerSession(j, resume(20, 18, 900, 'ma.grandeurs'), 'entrainement', decaler(J, -2));
  enregistrerSession(j, resume(10, 9, 420, 'sc.vivant'), 'entrainement', J);
  const b = bilanSemaine(j, J);
  assert.equal(b.jours.length, 7);
  assert.equal(b.jours[0].jour, decaler(J, -6));
  assert.equal(b.jours[6].jour, J);
  assert.equal(b.questions, 40);
  assert.equal(b.bonnes, 33);
  assert.equal(b.pourcentage, 83);
  assert.equal(b.minutes, 27);
  assert.equal(b.joursActifs, 3);
  assert.equal(b.semainePrecedente, 10);
  assert.deepEqual(b.parMatiere.ma, { posees: 20, bonnes: 18 });
  assert.equal(b.examens.length, 0);
});

test('indicateur CEB : 50 % par matière et 60 % de moyenne', () => {
  const j = nouveauJoueur('Lea', '🦊', '#fff');
  j.parMatiere = { fr: { posees: 40, bonnes: 30 }, ma: { posees: 40, bonnes: 28 }, sc: { posees: 30, bonnes: 18 }, hg: { posees: 30, bonnes: 14 } };
  let r = indicateurCEB(j);
  assert.ok(r.complet);
  assert.equal(r.lignes.find((l) => l.id === 'hg').ok, false); // 47 %
  assert.equal(r.ok, false);
  j.parMatiere.hg = { posees: 30, bonnes: 21 };
  r = indicateurCEB(j);
  assert.equal(r.moyenne, Math.round((75 + 70 + 60 + 70) / 4));
  assert.ok(r.ok);
  j.parMatiere.sc = { posees: 5, bonnes: 5 };
  assert.equal(indicateurCEB(j).complet, false); // trop peu de questions en sciences
});

test('plan de révision : compte à rebours, priorités, semaines d\'examens blancs', () => {
  assert.equal(CEB.debut, '2027-06-21');
  const j = nouveauJoueur('Lea', '🦊', '#fff');
  j.notions = { 'ma-fractions': { r: [0, 0, 0.5, 0], vu: J }, 'fr-homophones': { r: [0, 0, 0, 1], vu: J }, 'hg-provinces': { r: [1, 1, 1, 1, 1, 1, 1], vu: J } };
  const p = planRevision(j, fiches, J);
  assert.equal(p.joursRestants, joursEntre(J, '2027-06-21'));
  assert.equal(p.total, Object.keys(fiches).length);
  assert.equal(p.maitrisees, 1);
  assert.equal(p.semainesExamens, 3);
  // les deux notions fragiles ouvrent le plan
  assert.deepEqual(p.planning[0].notions.slice(0, 2).map((n) => n.id).sort(), ['fr-homophones', 'ma-fractions']);
  const toutes = p.planning.flatMap((s) => s.notions.map((n) => n.id));
  assert.equal(new Set(toutes).size, toutes.length, 'pas de notion en double');
  assert.equal(toutes.length, p.aTravailler, 'toutes les notions à travailler sont planifiées');
  assert.ok(!toutes.includes('hg-provinces'));
  assert.ok(p.planning.length <= p.semaines - p.semainesExamens);
  // la première semaine mêle plusieurs matières
  assert.ok(new Set(p.planning[1].notions.map((n) => n.matiere)).size >= 3);
  // après le CEB : plus rien à planifier mais pas d'erreur
  const apres = planRevision(j, fiches, '2027-07-01');
  assert.equal(apres.joursRestants, 0);
});
