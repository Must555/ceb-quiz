// Mode « Examen réel » : livret par livret, durée officielle réduite, aucune correction avant la fin.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chargerDonnees, ExamenReel, livretsReels } from '../js/engine/index.js';
import { appliquerDurees } from '../js/engine/loader.js';

const fetchJson = async (chemin) => JSON.parse(await readFile(new URL('../' + chemin, import.meta.url), 'utf8'));
const donnees = await chargerDonnees({ base: 'data/', fetchJson });
const dispo = donnees.examens.filter((e) => e.statut !== 'a_encoder');

// Horloge pilotée par le test.
const horloge = (t = 1_000_000) => { const h = { t, now: () => h.t, avancer: (s) => { h.t += s * 1000; } }; return h; };

function reponseParfaite(q) {
  switch (q.type) {
    case 'numerique': return String([].concat(q.reponse)[0]).replace('.', ',');
    case 'texte_court': return [].concat(q.reponse)[0];
    case 'trous': return q.reponse.map((r) => [].concat(r)[0]);
    case 'grille': return q.reponse.map((c) => [].concat(c)[0]);
    case 'ouverte': return 'ma réponse';
    default: return q.reponse;
  }
}

test('chaque livret de chaque examen reçoit une durée par une règle (jamais la valeur par défaut)', async () => {
  for (const meta of dispo) {
    const ex = await donnees.chargerExamen(meta.id);
    for (const l of ex.livrets) {
      assert.ok(l.duree >= 30 && l.duree <= 120, `${meta.id} livret ${l.n} (${l.titre}) : ${l.duree} min`);
      assert.notEqual(l.dureeSource, 'defaut', `${meta.id} livret ${l.n} (${l.titre}) : aucune règle`);
    }
  }
});

test('une durée écrite dans le fichier d\'examen prime sur les règles', () => {
  const ex = { livrets: [{ n: 1, titre: 'Grandeurs', duree: 33 }, { n: 2, titre: 'Grandeurs' }] };
  appliquerDurees(ex, { statut: 'a_verifier', regles: [{ motif: 'Grandeurs', minutes: 75 }] });
  assert.deepEqual(ex.livrets.map((l) => [l.duree, l.dureeSource]), [[33, 'examen'], [75, 'estimee']]);
});

test('la durée à l\'écran est réduite en proportion des points jouables', async () => {
  const ex = await donnees.chargerExamen('ceb-2026-tc');
  const livrets = livretsReels(ex);
  assert.ok(!livrets.some((l) => l.n === 1), 'Écouter (non encodé) n\'est pas proposé');
  for (const l of livrets) {
    assert.ok(l.dureeSecondes <= l.dureeOfficielle * 60, `livret ${l.n}`);
    assert.ok(l.dureeSecondes >= 5 * 60, `livret ${l.n}`);
    assert.ok(l.questions.length > 0);
  }
});

test('déroulé complet : pas de correction avant la fin, livret fermé à jamais, score à la fin', async () => {
  const ex = await donnees.chargerExamen('ceb-2026-tc');
  const h = horloge();
  const er = new ExamenReel(ex, { now: h.now });
  assert.throws(() => er.correction(), /fin de l'examen/);
  const premier = er.ouvrirLivret();
  const q0 = er.question(0);
  assert.equal(er.noter(q0.id, reponseParfaite(q0)), true);
  // On peut changer d'avis dans le livret en cours.
  assert.equal(er.noter(q0.id, null), true);
  assert.equal(er.aRepondu(q0.id), false);
  er.noter(q0.id, reponseParfaite(q0));
  h.avancer(60);
  er.rendreLivret();
  // Le livret rendu ne se rouvre plus : une réponse à ses questions est refusée.
  assert.equal(er.noter(q0.id, 'autre'), false);
  assert.notEqual(er.livret.n, premier.n);
  // Livrets suivants : tout juste.
  while (!er.estTermine()) {
    er.ouvrirLivret();
    for (const q of er.questions()) er.noter(q.id, reponseParfaite(q));
    h.avancer(30);
    er.rendreLivret();
  }
  const r = er.resume();
  assert.equal(r.reel, true);
  assert.equal(r.mode, 'examen');
  assert.equal(r.questions, livretsReels(ex).reduce((s, l) => s + l.questions.length, 0));
  // Les livrets 2+ sont parfaits ; le livret 1 aussi (une seule question répondue, juste).
  const l1 = r.parLivret[premier.n];
  assert.ok(l1.bonnes >= 1);
  for (const [n, v] of Object.entries(r.parLivret)) if (+n !== premier.n) assert.equal(v.points, v.max, `livret ${n}`);
  assert.ok(r.dureeSecondes >= 60 && r.dureeSecondes < 3600);
  assert.equal(r.details.length, r.questions);
});

test('temps écoulé : le livret se ferme seul et les réponses tardives sont refusées', async () => {
  const ex = await donnees.chargerExamen('ceb-2025');
  const h = horloge();
  const er = new ExamenReel(ex, { now: h.now });
  const l = er.ouvrirLivret();
  const q = er.question(0);
  h.avancer(l.dureeSecondes + 1);
  assert.equal(er.noter(q.id, reponseParfaite(q)), false);
  assert.notEqual(er.livret?.n, l.n);
  assert.equal(er.fins[l.n], er.debuts[l.n] + l.dureeSecondes * 1000);
});

test('pause entre deux livrets : l\'état se sauvegarde et se reprend, le chrono compte l\'heure réelle', async () => {
  const ex = await donnees.chargerExamen('ceb-2024');
  const h = horloge();
  let er = new ExamenReel(ex, { now: h.now });
  er.ouvrirLivret();
  const q = er.question(0);
  er.noter(q.id, reponseParfaite(q));
  er.rendreLivret();
  const sauvegarde = JSON.parse(JSON.stringify(er.toJSON()));
  h.avancer(3 * 86400); // trois jours plus tard
  er = ExamenReel.depuis(ex, sauvegarde, { now: h.now });
  assert.equal(er.courant, 1);
  assert.equal(er.livretOuvert(), false, 'le livret suivant attend qu\'on l\'ouvre');
  assert.equal(er.tempsRestant(), er.livret.dureeSecondes, 'la pause ne consomme pas le temps du livret suivant');
  er.ouvrirLivret();
  // Fermer la page au milieu d'un livret n'arrête pas le chrono.
  const milieu = JSON.parse(JSON.stringify(er.toJSON()));
  h.avancer(120);
  er = ExamenReel.depuis(ex, milieu, { now: h.now });
  assert.equal(er.tempsRestant(), er.livret.dureeSecondes - 120);
  const autre = await donnees.chargerExamen('ceb-2023');
  assert.throws(() => ExamenReel.depuis(autre, milieu), /ne correspond pas/);
});

test('une question non répondue compte comme fausse ; une question ouverte ne compte pas', async () => {
  const ex = await donnees.chargerExamen('ceb-2026-tc');
  const h = horloge();
  const er = new ExamenReel(ex, { now: h.now });
  while (!er.estTermine()) { er.ouvrirLivret(); er.rendreLivret(); }
  const lignes = er.correction();
  assert.ok(lignes.every((x) => !x.repondu));
  assert.ok(lignes.filter((x) => x.q.type !== 'ouverte').every((x) => x.correct === false));
  assert.ok(lignes.filter((x) => x.q.type === 'ouverte').every((x) => x.correct === null));
  assert.equal(er.resume().points, 0);
});

test('statistiques du joueur : seules les questions répondues comptent', async () => {
  const ex = await donnees.chargerExamen('ceb-2026-tc');
  const er = new ExamenReel(ex, { now: horloge().now });
  er.ouvrirLivret();
  const q = er.question(0);
  er.noter(q.id, reponseParfaite(q));
  while (!er.estTermine()) { if (!er.livretOuvert()) er.ouvrirLivret(); er.rendreLivret(); }
  const r = er.resume(), s = er.resumeStats();
  assert.ok(r.questions > 100);
  assert.equal(s.questions, 1);
  assert.equal(s.details.length, 1);
  assert.equal(s.pourcentage, r.pourcentage, 'le score de l\'examen reste celui de l\'examen entier');
});

test('réponse de l\'élève en clair pour la revue', async () => {
  const { reponseEleveLisible } = await import('../js/engine/index.js');
  assert.equal(reponseEleveLisible({ type: 'qcm', choix: ['a', 'b'] }, 1), 'b');
  assert.equal(reponseEleveLisible({ type: 'vrai_faux' }, false), 'Faux');
  assert.equal(reponseEleveLisible({ type: 'trous' }, ['x', '']), 'x / —');
  assert.equal(reponseEleveLisible({ type: 'trous' }, ['', '']), null);
  assert.equal(reponseEleveLisible({ type: 'grille', lignes: ['L1', 'L2'], colonnes: ['Oui', 'Non'] }, [1, null]), 'L1 → Non\nL2 → —');
  assert.equal(reponseEleveLisible({ type: 'numerique' }, null), null);
});
