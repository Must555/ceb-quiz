// Le coach : repère les points faibles et choisit les questions en conséquence.
//
// 1. Maîtrise par notion (= fiche Rappel) : moyenne pondérée des 12 dernières réponses,
//    les plus récentes comptent davantage → un enfant qui progresse voit sa jauge monter.
// 2. Révision espacée (boîtes de Leitner) : une question ratée revient à J+1, puis J+3, puis J+7
//    si elle est réussie à chaque fois. Pour un modèle généré, c'est la même notion avec
//    d'autres nombres qui revient. Jamais dans la même partie (règle anti-répétition intacte).
// 3. Pondération du tirage : les notions fragiles et les révisions dues sortent plus souvent,
//    la difficulté s'adapte (moins de questions « niveau CEB » tant que la notion est fragile).

import { aujourdhui } from './store.js';

const FENETRE = 12;
const INTERVALLES = [1, 3, 7]; // jours avant la révision suivante, boîte 1 → 3

export const STATUTS = {
  decouverte: { nom: 'À découvrir', e: '🆕', ordre: 2 },
  fragile: { nom: 'À retravailler', e: '🟠', ordre: 0 },
  progres: { nom: 'En progrès', e: '🟡', ordre: 1 },
  maitrise: { nom: 'Maîtrisé', e: '🟢', ordre: 3 },
};

export function ajouterJours(jour, n) {
  const d = new Date(jour + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return aujourdhui(d);
}

const cleRevision = (d) => (d.modeleId ? `m:${d.modeleId}` : `q:${d.questionId}`);

// Clé de révision d'un candidat au tirage (question de la banque ou modèle).
const cleCandidat = (c) => (c.source === 'banque' || c.source === 'examen' ? `q:${c.id}` : `m:${c.id}`);
const notionDe = (c) => c.fiche ?? c.domaine;

export function initialiser(j) {
  j.notions ??= {};
  j.aRevoir ??= {};
  return j;
}

// Enregistre les réponses d'une partie.
export function majCoach(j, details = [], jour = aujourdhui()) {
  initialiser(j);
  for (const d of details) {
    if (d.correct === null || d.correct === undefined) continue; // question ouverte : pas mesurable
    const ratio = d.correct === true ? 1 : d.ratio ?? 0;
    const n = (j.notions[d.notion] ??= { r: [], vu: null });
    n.r.push(Math.round(ratio * 100) / 100);
    if (n.r.length > FENETRE) n.r = n.r.slice(-FENETRE);
    n.vu = jour;

    const cle = cleRevision(d);
    const rev = j.aRevoir[cle];
    if (ratio < 1) {
      j.aRevoir[cle] = { notion: d.notion, boite: 1, due: ajouterJours(jour, INTERVALLES[0]) };
    } else if (rev && rev.due <= jour) {
      rev.boite += 1;
      if (rev.boite > INTERVALLES.length) delete j.aRevoir[cle];
      else rev.due = ajouterJours(jour, INTERVALLES[rev.boite - 1]);
    }
  }
}

export function maitrise(j, notion) {
  const r = j.notions?.[notion]?.r ?? [];
  if (r.length === 0) return { m: 0, n: 0, statut: 'decouverte' };
  let somme = 0, poids = 0;
  r.forEach((v, i) => { const w = i + 1; somme += v * w; poids += w; });
  const m = somme / poids;
  const statut = r.length < 3 ? 'decouverte' : m < 0.6 ? 'fragile' : m < 0.8 || r.length < 6 ? 'progres' : 'maitrise';
  return { m, n: r.length, statut };
}

export function revisionsDues(j, jour = aujourdhui()) {
  return Object.entries(j.aRevoir ?? {}).filter(([, v]) => v.due <= jour).map(([cle, v]) => ({ cle, ...v }));
}

// Toutes les notions connues (fiches), avec leur maîtrise.
export function carteNotions(j, fiches) {
  return Object.values(fiches).map((f) => ({ fiche: f, ...maitrise(j, f.id) }));
}

// Points faibles : notions fragiles (ou en progrès mais basses), les plus urgentes d'abord.
export function faiblesses(j, fiches, max = 3) {
  return carteNotions(j, fiches)
    .filter((x) => x.statut === 'fragile' || (x.statut === 'progres' && x.m < 0.7))
    .sort((a, b) => a.m - b.m || b.n - a.n)
    .slice(0, max);
}

export function coachPret(j) { return Object.values(j.notions ?? {}).reduce((s, n) => s + n.r.length, 0) >= 10; }

// Fonction de pondération passée au moteur (option `poids` de QuizSession).
//   mode 'cible' : on vise les faiblesses (ou une notion précise) ;
//   mode 'normal' : tirage libre, avec un petit coup de pouce aux révisions dues.
export function poidsCoach(j, { mode = 'normal', notion = null, jour = aujourdhui() } = {}) {
  const dues = new Set(revisionsDues(j, jour).map((r) => r.cle));
  return (c) => {
    const n = notionDe(c);
    const { statut } = maitrise(j, n);
    const due = dues.has(cleCandidat(c));
    let w = 1;
    if (mode === 'cible') {
      if (notion) w = n === notion ? 10 : 0.05;               // mission sur une notion précise
      else w = { fragile: 20, progres: 4, decouverte: 0.6, maitrise: 0.25 }[statut];
      if (due) w *= 5;
    } else if (due) {
      w *= 3;
    }
    // Difficulté adaptée : on ne noie pas l'enfant sous le « niveau CEB » quand ça coince,
    // et on évite les questions trop faciles sur ce qu'il maîtrise.
    const diff = c.difficulte ?? 1;
    if (statut === 'fragile' && diff >= 3) w *= 0.4;
    if (statut === 'maitrise' && diff <= 1) w *= 0.5;
    return w;
  };
}
