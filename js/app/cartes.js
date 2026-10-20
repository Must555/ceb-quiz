// Bibliothèque des fiches Rappel et cartes-mémoire.
//
// Une carte = une fiche : recto = le titre (« que dit la règle ? »), verso = règle, exemple, astuce.
// L'enfant dit lui-même s'il savait. Répétition espacée (boîtes de Leitner, comme le coach) :
//   « Je savais » → boîte suivante, la carte revient dans 1, 3, 7 puis 14 jours ;
//   « À revoir » → retour en boîte 1 (demain), et elle repasse une fois à la fin du paquet.
// Ces cartes ne touchent pas la maîtrise du coach, qui ne se mesure que sur de vraies réponses.

import { aujourdhui } from './store.js';
import { maitrise } from './coach.js';

export const INTERVALLES_CARTES = [1, 3, 7, 14];
export const TAILLE_PAQUET = 12;

const plus = (jour, n) => { const d = new Date(jour + 'T12:00:00'); d.setDate(d.getDate() + n); return aujourdhui(d); };
const normal = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, ' ').trim();

// Recherche plein texte (sans accents) dans le titre, la règle, l'exemple et l'astuce.
export function filtrerFiches(fiches, { matiere = '', texte = '', statut = '', j = null } = {}) {
  const mots = normal(texte).split(' ').filter(Boolean);
  return Object.values(fiches).filter((f) => {
    if (matiere && f.matiere !== matiere) return false;
    if (statut && j && maitrise(j, f.id).statut !== statut) return false;
    if (!mots.length) return true;
    const tout = normal([f.titre, ...(f.regle ?? []), f.exemple, f.astuce].join(' '));
    return mots.every((m) => tout.includes(m));
  }).sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));
}

export const etatCarte = (j, id) => j.cartes?.[id] ?? null;
export const carteDue = (j, id, jour = aujourdhui()) => { const c = etatCarte(j, id); return !!c && c.due <= jour; };
export const cartesDues = (j, jour = aujourdhui()) => Object.entries(j.cartes ?? {}).filter(([, c]) => c.due <= jour).map(([id]) => id);

// Paquet du jour : d'abord les cartes dues, puis les notions fragiles ou en progrès jamais révisées en carte,
// puis les fiches jamais vues ; les cartes pas encore dues ne viennent qu'en dernier recours.
export function paquet(j, fiches, { ids = null, max = TAILLE_PAQUET, jour = aujourdhui(), rng = Math.random } = {}) {
  const pool = (ids ?? Object.keys(fiches)).filter((id) => fiches[id]);
  const melange = (a) => a.map((x) => [rng(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  const rang = (id) => {
    const c = etatCarte(j, id);
    if (c && c.due <= jour) return 0;
    if (c) return 4;
    const st = maitrise(j, id).statut;
    return st === 'fragile' ? 1 : st === 'progres' ? 2 : 3;
  };
  const groupes = [[], [], [], [], []];
  for (const id of pool) groupes[rang(id)].push(id);
  return groupes.flatMap((g, i) => (i === 0 ? g.sort((a, b) => j.cartes[a].due.localeCompare(j.cartes[b].due)) : melange(g))).slice(0, max);
}

// Réponse de l'enfant sur une carte. Renvoie le nouvel état.
export function noterCarte(j, id, savait, jour = aujourdhui()) {
  j.cartes ??= {};
  const c = j.cartes[id] ?? { boite: 0, vues: 0 };
  c.boite = savait ? Math.min(INTERVALLES_CARTES.length, c.boite + 1) : 1;
  c.due = plus(jour, INTERVALLES_CARTES[c.boite - 1]);
  c.vues = (c.vues ?? 0) + 1;
  c.vu = jour;
  j.cartes[id] = c;
  return c;
}

// Nombre d'exercices à l'écran qui travaillent une notion (pour proposer « S'entraîner »).
export function exercicesParNotion(banque, modeles) {
  const n = {};
  const ajouter = (id) => { if (id) n[id] = (n[id] ?? 0) + 1; };
  for (const q of banque) ajouter(q.fiche);
  for (const m of modeles) new Set([m.fiche, ...(m.notions ?? []), ...(m.formes ?? []).map((f) => f?.fiche)].filter(Boolean)).forEach(ajouter);
  return n;
}
