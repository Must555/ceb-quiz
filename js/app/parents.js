// Espace parents (Lot D) : logique pure, sans affichage (testée dans tests/parents.test.js).
//   - code PIN (verrou léger, stocké haché) ;
//   - temps de jeu du jour et limite choisie par le parent ;
//   - bilan des 7 derniers jours ;
//   - compte à rebours et plan de révision jusqu'au CEB.

import { hashString } from '../engine/random.js';
import { aujourdhui } from './store.js';
import { maitrise } from './coach.js';

// CEB 2027 : du lundi 21 au vendredi 25 juin 2027 (le matin), référentiels du tronc commun.
// Réussite : au moins 50 % dans chaque discipline ET au moins 60 % de moyenne
// (décret du 19 mars 2026 relevant les seuils de réussite des épreuves externes certificatives).
export const CEB = {
  annee: 2027,
  debut: '2027-06-21',
  jours: [
    { date: '2027-06-21', jour: 'Lundi 21 juin', matiere: 'Français' },
    { date: '2027-06-22', jour: 'Mardi 22 juin', matiere: 'Mathématiques' },
    { date: '2027-06-24', jour: 'Jeudi 24 juin', matiere: 'Sciences' },
    { date: '2027-06-25', jour: 'Vendredi 25 juin', matiere: 'Formation historique et géographique' },
  ],
  seuilMatiere: 50,
  seuilMoyenne: 60,
};

export const LIMITES = [null, 15, 20, 30, 45, 60, 90]; // minutes par jour (null = pas de limite)

// ---------------------------------------------------------------- PIN
export const hashPin = (pin) => hashString(`missionceb|parents|${pin}`).toString(36);
export const pinValide = (pin) => /^\d{4}$/.test(String(pin ?? ''));
export const verifierPin = (parents, pin) => !!parents?.pinHash && parents.pinHash === hashPin(pin);

// ---------------------------------------------------------------- dates
const date = (jour) => new Date(jour + 'T12:00:00');
export function decaler(jour, n) {
  const d = date(jour);
  d.setDate(d.getDate() + n);
  return aujourdhui(d);
}
export const joursEntre = (a, b) => Math.round((date(b) - date(a)) / 86_400_000);
const JOURS_COURTS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
export const jourCourt = (jour) => `${JOURS_COURTS[date(jour).getDay()]} ${date(jour).getDate()}`;
export function dateLongue(jour) {
  return date(jour).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ---------------------------------------------------------------- temps de jeu
export const secondesDuJour = (j, jour = aujourdhui()) => j?.jours?.[jour]?.secondes ?? 0;

// État du temps de jeu d'un enfant pour la journée.
export function etatTemps(j, parents, jour = aujourdhui()) {
  const limite = parents?.limites?.[j.id] ?? null;
  const bonus = parents?.bonus?.[j.id]?.[jour] ?? 0;
  const minutes = Math.floor(secondesDuJour(j, jour) / 60);
  if (limite == null || bonus === 'illimite') return { limite: null, minutes, restant: null, atteint: false };
  const total = limite + bonus;
  return { limite: total, minutes, restant: Math.max(0, total - minutes), atteint: minutes >= total };
}

// ---------------------------------------------------------------- bilan de la semaine
export function bilanSemaine(j, fin = aujourdhui()) {
  const jours = Array.from({ length: 7 }, (_, i) => decaler(fin, i - 6)).map((jour) => {
    const jr = j.jours?.[jour] ?? {};
    return { jour, questions: jr.questions ?? 0, bonnes: jr.bonnes ?? 0, secondes: jr.secondes ?? 0, mat: jr.mat ?? {} };
  });
  const somme = (liste, cle) => liste.reduce((s, x) => s + x[cle], 0);
  const avant = Array.from({ length: 7 }, (_, i) => j.jours?.[decaler(fin, i - 13)]?.questions ?? 0).reduce((a, b) => a + b, 0);
  const parMatiere = {};
  for (const x of jours) {
    for (const [m, v] of Object.entries(x.mat)) {
      const c = (parMatiere[m] ??= { posees: 0, bonnes: 0 });
      c.posees += v.posees; c.bonnes += v.bonnes;
    }
  }
  const questions = somme(jours, 'questions');
  const bonnes = somme(jours, 'bonnes');
  const dansLaSemaine = (iso) => { const d = aujourdhui(new Date(iso)); return d >= jours[0].jour && d <= fin; };
  const examens = (j.sessions ?? []).filter((s) => s.mode === 'examen' && s.date && dansLaSemaine(s.date));
  return {
    jours,
    questions,
    bonnes,
    pourcentage: questions ? Math.round((bonnes / questions) * 100) : 0,
    minutes: Math.round(somme(jours, 'secondes') / 60),
    joursActifs: jours.filter((x) => x.questions > 0).length,
    semainePrecedente: avant,
    parMatiere,
    examens,
  };
}

// Où en est l'enfant par rapport à la règle de réussite du CEB (indicatif : un taux de bonnes
// réponses dans l'application n'est pas une note du CEB). Éveil = sciences + histoire-géo.
export function indicateurCEB(j, minQuestions = 20) {
  const pm = j.parMatiere ?? {};
  const lignes = [
    { id: 'fr', nom: 'Français', ids: ['fr'] },
    { id: 'ma', nom: 'Maths', ids: ['ma'] },
    { id: 'sc', nom: 'Sciences', ids: ['sc'] },
    { id: 'hg', nom: 'Histoire-géo', ids: ['hg'] },
  ].map((l) => {
    const posees = l.ids.reduce((s, m) => s + (pm[m]?.posees ?? 0), 0);
    const bonnes = l.ids.reduce((s, m) => s + (pm[m]?.bonnes ?? 0), 0);
    const pct = posees ? Math.round((bonnes / posees) * 100) : null;
    return { ...l, posees, pct, assez: posees >= minQuestions, ok: pct != null && pct >= CEB.seuilMatiere };
  });
  const mesurees = lignes.filter((l) => l.assez);
  const moyenne = mesurees.length === 4 ? Math.round(mesurees.reduce((s, l) => s + l.pct, 0) / 4) : null;
  return { lignes, moyenne, complet: mesurees.length === 4, ok: moyenne != null && moyenne >= CEB.seuilMoyenne && lignes.every((l) => l.ok) };
}

// ---------------------------------------------------------------- plan de révision
// Toutes les notions pas encore maîtrisées, les plus urgentes d'abord (à retravailler, puis
// en progrès, puis à découvrir), réparties semaine par semaine en mêlant les matières.
// Les 3 dernières semaines sont gardées pour des examens blancs complets.
const ORDRE_STATUT = { fragile: 0, progres: 1, decouverte: 2, maitrise: 3 };

export function planRevision(j, fiches, jour = aujourdhui(), dateCEB = CEB.debut) {
  const joursRestants = Math.max(0, joursEntre(jour, dateCEB));
  const semaines = Math.floor(joursRestants / 7);
  const notes = Object.values(fiches).map((f) => ({ fiche: f, ...maitrise(j, f.id) }));
  const aTravailler = notes.filter((x) => x.statut !== 'maitrise')
    .sort((a, b) => ORDRE_STATUT[a.statut] - ORDRE_STATUT[b.statut] || a.m - b.m || a.fiche.id.localeCompare(b.fiche.id));

  // Mélange des matières : on prend tour à tour dans chaque matière, en gardant l'ordre de priorité.
  const parMatiere = {};
  for (const x of aTravailler) (parMatiere[x.fiche.matiere] ??= []).push(x);
  const melange = [];
  const groupes = Object.values(parMatiere);
  // D'abord toutes les notions fragiles (priorité absolue), puis le tourniquet des matières.
  const fragiles = aTravailler.filter((x) => x.statut === 'fragile');
  melange.push(...fragiles);
  for (let i = 0; melange.length < aTravailler.length; i++) {
    for (const g of groupes) {
      const x = g[i];
      if (x && !melange.includes(x)) melange.push(x);
    }
    if (i > aTravailler.length) break;
  }

  const semainesExamens = semaines >= 8 ? 3 : semaines >= 4 ? 1 : 0;
  const semainesNotions = Math.max(1, semaines - semainesExamens);
  const parSemaine = Math.min(8, Math.max(2, Math.ceil(melange.length / semainesNotions)));
  const planning = [];
  for (let s = 0; s < semainesNotions && s * parSemaine < melange.length; s++) {
    planning.push({ debut: decaler(jour, s * 7), notions: melange.slice(s * parSemaine, (s + 1) * parSemaine).map((x) => ({ id: x.fiche.id, titre: x.fiche.titre, e: x.fiche.e, matiere: x.fiche.matiere, statut: x.statut })) });
  }
  return {
    joursRestants,
    semaines,
    aTravailler: aTravailler.length,
    maitrisees: notes.length - aTravailler.length,
    total: notes.length,
    parSemaine,
    semainesExamens,
    debutExamens: semainesExamens ? decaler(dateCEB, -7 * semainesExamens) : null,
    planning,
    // Rythme conseillé : 10 questions par notion de la semaine, réparties sur 5 jours.
    questionsParJour: Math.max(10, Math.ceil((parSemaine * 10) / 5 / 5) * 5),
  };
}
