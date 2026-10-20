// « Signaler une erreur » : message pré-rempli, sans donnée personnelle, lien mailto de taille raisonnable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { messageSignalement, lienMailto, origineQuestion, ADRESSE_SIGNALEMENT } from '../js/app/signaler.js';

const qCEB = { id: 'ceb-2026-tc-l4-q2', source: 'examen', annee: 2026, referentiel: 'tronc_commun', livret: 4, numero: '2', enonce: 'Un agriculteur utilise 80 kg…' };

test('origine lisible : vrai CEB, question générée, banque', () => {
  assert.equal(origineQuestion(qCEB), 'CEB 2026 tronc commun · livret 4 · question 2');
  assert.equal(origineQuestion({ modeleId: 'ma-soldes' }), 'Question générée · famille ma-soldes');
});

test('le message contient de quoi retrouver la question et le commentaire, rien d\'autre', () => {
  const m = messageSignalement({ q: qCEB, reponseDonnee: '150', bonneReponse: '200', commentaire: 'Le calcul donne 200 ?' });
  assert.match(m.sujet, /^\[Mission CEB\] Erreur signalée — CEB 2026/);
  for (const t of ['ceb-2026-tc-l4-q2', 'Le calcul donne 200 ?', 'Réponse attendue par le site : 200', 'Réponse donnée : 150']) assert.ok(m.corps.includes(t), t);
  const f = messageSignalement({ fiche: { id: 'ma-pourcentages', titre: 'Les pourcentages' } });
  assert.match(f.sujet, /fiche « Les pourcentages »/);
  assert.match(f.corps, /qu'est-ce qui ne va pas/);
});

test('lien mailto vers l\'adresse du projet, raccourci si l\'énoncé est très long', () => {
  const long = { ...qCEB, enonce: 'Très long énoncé. '.repeat(400) };
  const url = lienMailto(messageSignalement({ q: long, commentaire: 'à vérifier' }));
  assert.ok(url.startsWith(`mailto:${ADRESSE_SIGNALEMENT}?subject=`));
  assert.ok(url.length <= 1900, String(url.length));
  assert.ok(decodeURIComponent(url).includes('ceb-2026-tc-l4-q2'), 'l\'identifiant est toujours gardé');
  assert.ok(decodeURIComponent(url).includes('à vérifier'));
});
