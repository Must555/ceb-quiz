// Confort : lecture à voix haute (texte prononcé, jamais pour la lecture), réglages par défaut.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { texteAVoix, peutLireAVoixHaute, confortDe, CONFORT_DEFAUT, appliquerConfort, sons } from '../js/app/confort.js';

test('la lecture à voix haute est refusée pour les questions de lecture et d\'écoute', () => {
  assert.equal(peutLireAVoixHaute({ domaine: 'fr.lire' }), false);
  assert.equal(peutLireAVoixHaute({ domaine: 'fr.lire.informatif' }), false);
  assert.equal(peutLireAVoixHaute({ domaine: 'fr.ecouter' }), false);
  assert.equal(peutLireAVoixHaute({ domaine: 'fr.grammaire' }), true);
  assert.equal(peutLireAVoixHaute({ domaine: 'ma.grandeurs' }), true);
});

test('texte prononcé : énoncé, propositions lettrées, blancs, sans emoji', () => {
  const t = texteAVoix({ type: 'qcm', enonce: '🧮 Combien font 3 × 4 ?', choix: ['7', '12'] });
  assert.equal(t, 'Combien font 3 × 4 ? A : 7. B : 12');
  assert.match(texteAVoix({ type: 'trous', enonce: 'Complète.', texte: 'Le chat {0} sur le mur.' }), /Le chat blanc sur le mur/);
  assert.match(texteAVoix({ type: 'vrai_faux', enonce: 'La Terre est ronde.' }), /Vrai ou faux \?$/);
  assert.match(texteAVoix({ type: 'grille', enonce: 'Coche.', lignes: ['Le cube'], colonnes: ['Oui', 'Non'] }), /Le cube : Oui ou Non \?/);
});

test('réglages de confort : valeurs par défaut et application sur la page', () => {
  assert.deepEqual(confortDe(null), CONFORT_DEFAUT);
  assert.equal(confortDe({ confort: { taille: 'grand' } }).taille, 'grand');
  const racine = { dataset: {} };
  appliquerConfort({ confort: { taille: 'tres-grand', espace: 'aere', sons: false } }, racine);
  assert.deepEqual(racine.dataset, { taille: 'tres-grand', espace: 'aere' });
  assert.equal(sons.actifs, false);
  sons.juste(); // sons coupés : ne fait rien, même sans audio (Node)
});
