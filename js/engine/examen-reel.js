// Mode « Examen réel » : comme le jour du CEB.
//
// - L'examen se passe livret par livret, dans l'ordre officiel.
// - Chaque livret a sa durée. Le chrono tourne dès l'ouverture du livret, sans pause possible
//   (il compte l'heure réelle : fermer la page ne l'arrête pas).
// - Aucune correction pendant l'épreuve. Dans le livret en cours, l'enfant peut revenir sur
//   ses réponses et les changer. Un livret fermé (fini ou temps écoulé) ne se rouvre plus.
// - Pause possible ENTRE deux livrets : l'état complet se sauvegarde (toJSON) et se reprend (depuis).
// - À la fin, tout est corrigé d'un coup : score par livret, par matière, et détail pour le coach.
//
// Durée d'un livret à l'écran : les questions à faire sur papier (écoute, tracés, rédaction) sont
// retirées, donc la durée officielle est réduite en proportion des points jouables à l'écran.

import { corriger } from './checker.js';
import { estJouable, bonneReponseLisible } from './session.js';

// Durée officielle (min) quand le fichier d'examen ne la donne pas encore (`livret.duree`).
export const DUREE_LIVRET_DEFAUT = 50;
export const DUREE_MIN_SECONDES = 5 * 60;

const jouable = (q) => q.numerisable !== false && estJouable(q);
const ptsDe = (q) => q.points ?? 1;

// Livrets jouables d'un examen, avec leur durée à l'écran.
export function livretsReels(examen) {
  return (examen.livrets ?? []).map((l) => {
    const toutes = examen.questions.filter((q) => q.livret === l.n);
    const questions = toutes.filter(jouable);
    if (!questions.length) return null;
    const dureeOfficielle = l.duree ?? DUREE_LIVRET_DEFAUT;
    const ptsTotal = l.points ?? toutes.reduce((s, q) => s + ptsDe(q), 0);
    const ptsJouables = questions.reduce((s, q) => s + ptsDe(q), 0);
    const part = ptsTotal ? Math.min(1, ptsJouables / ptsTotal) : 1;
    const dureeSecondes = Math.max(DUREE_MIN_SECONDES, Math.round(dureeOfficielle * part) * 60);
    return {
      n: l.n, titre: l.titre, matiere: l.matiere, date: l.date ?? null,
      dureeOfficielle, dureeEstimee: l.duree == null || !['officielle', 'examen'].includes(l.dureeSource),
      dureeSecondes, part, questions: questions.map((q) => q.id),
    };
  }).filter(Boolean);
}

export class ExamenReel {
  constructor(examen, { now = () => Date.now(), etat = null } = {}) {
    this.examen = examen;
    this.now = now;
    this.parId = new Map(examen.questions.map((q) => [q.id, q]));
    this.livrets = livretsReels(examen);
    if (!this.livrets.length) throw new Error('Cet examen n\'a aucun livret jouable à l\'écran.');
    const e = etat ? JSON.parse(JSON.stringify(etat)) : {}; // copie : l'état sauvegardé n'est jamais modifié
    this.courant = e.courant ?? 0;                 // index du livret en cours ou à ouvrir
    this.debuts = e.debuts ?? {};                  // { n: timestamp d'ouverture }
    this.fins = e.fins ?? {};                      // { n: timestamp de fermeture }
    this.reponses = e.reponses ?? {};              // { questionId: réponse brute }
    this.autoeval = e.autoeval ?? {};              // { questionId: true|false } questions ouvertes
    this.position = e.position ?? 0;               // question affichée dans le livret en cours
    this.commenceLe = e.commenceLe ?? null;
    this.fermerSiTempsEcoule();
  }

  // Reprise après une pause (état sauvegardé par toJSON).
  static depuis(examen, etat, opts = {}) {
    if (etat?.examenId !== examen.id) throw new Error('Cet état ne correspond pas à cet examen.');
    return new ExamenReel(examen, { ...opts, etat });
  }

  toJSON() {
    return {
      examenId: this.examen.id, courant: this.courant, debuts: this.debuts, fins: this.fins,
      reponses: this.reponses, autoeval: this.autoeval, position: this.position, commenceLe: this.commenceLe,
    };
  }

  // --- Livrets ------------------------------------------------------------
  get livret() { return this.livrets[this.courant] ?? null; }
  estTermine() { return this.courant >= this.livrets.length; }
  livretOuvert() { const l = this.livret; return !!l && this.debuts[l.n] != null && this.fins[l.n] == null; }

  ouvrirLivret() {
    const l = this.livret;
    if (!l) throw new Error('L\'examen est terminé.');
    if (this.debuts[l.n] == null) {
      this.debuts[l.n] = this.now();
      this.commenceLe ??= this.debuts[l.n];
      this.position = 0;
    }
    return l;
  }

  tempsRestant() {
    const l = this.livret;
    if (!l || this.debuts[l.n] == null) return l?.dureeSecondes ?? 0;
    const fin = this.fins[l.n] ?? this.now();
    return Math.max(0, l.dureeSecondes - Math.floor((fin - this.debuts[l.n]) / 1000));
  }

  // Ferme le livret en cours si son temps est écoulé (appelé à la reprise et à chaque action).
  fermerSiTempsEcoule() {
    const l = this.livret;
    if (l && this.debuts[l.n] != null && this.fins[l.n] == null && this.tempsRestant() === 0) {
      this.fins[l.n] = this.debuts[l.n] + l.dureeSecondes * 1000;
      return this.passerAuSuivant(), true;
    }
    return false;
  }

  // L'enfant rend son livret (ou le temps est écoulé).
  rendreLivret() {
    const l = this.livret;
    if (!l || this.debuts[l.n] == null) throw new Error('Aucun livret ouvert.');
    this.fins[l.n] ??= this.now();
    this.passerAuSuivant();
    return l;
  }

  passerAuSuivant() { this.courant++; this.position = 0; }

  // --- Questions du livret en cours ----------------------------------------
  questions() { return (this.livret?.questions ?? []).map((id) => this.parId.get(id)); }
  question(i = this.position) { return this.questions()[i] ?? null; }

  aller(i) {
    this.fermerSiTempsEcoule();
    if (!this.livretOuvert()) return null;
    this.position = Math.max(0, Math.min(i, this.livret.questions.length - 1));
    return this.question();
  }

  // Enregistre une réponse sans la corriger. Refusé si le livret est fermé.
  noter(questionId, reponse) {
    if (this.fermerSiTempsEcoule() || !this.livretOuvert()) return false;
    if (!this.livret.questions.includes(questionId)) return false;
    const vide = reponse == null || reponse === '' || (Array.isArray(reponse) && reponse.length === 0);
    if (vide) delete this.reponses[questionId];
    else this.reponses[questionId] = reponse;
    return true;
  }

  aRepondu(questionId) { return this.reponses[questionId] != null; }
  nbRepondues(livret = this.livret) { return livret ? livret.questions.filter((id) => this.aRepondu(id)).length : 0; }

  // Autoévaluation d'une question ouverte, pendant la revue finale (ne compte pas dans le score).
  autoEvaluer(questionId, reussi) { this.autoeval[questionId] = !!reussi; }

  // --- Correction finale -----------------------------------------------------
  correction() {
    if (!this.estTermine()) throw new Error('La correction n\'est disponible qu\'à la fin de l\'examen.');
    return this.livrets.flatMap((l) => l.questions.map((id) => {
      const q = this.parId.get(id);
      const reponse = this.reponses[id] ?? null;
      const res = corriger(q, reponse);
      return { q, livret: l.n, reponse, repondu: reponse != null, ...res, bonneReponse: bonneReponseLisible(q) };
    }));
  }

  // Pour les statistiques du joueur (progression, badges, défis, coach) : seules les questions
  // répondues comptent. Une case laissée vide (souvent faute de temps) compte 0 dans le score de
  // l'examen, mais ne gonfle pas le nombre de questions jouées et ne trompe pas le coach.
  resume() { return this.resumeDe(this.correction()); }
  resumeStats() {
    const r = this.resume();
    const s = this.resumeDe(this.correction().filter((x) => x.repondu));
    return { ...r, questions: s.questions, bonnes: s.bonnes, parDomaine: s.parDomaine, details: s.details };
  }

  resumeDe(lignes) {
    const parDomaine = {}, parMatiere = {}, parLivret = {};
    let xp = 0, serie = 0, meilleureSerie = 0;
    for (const r of lignes) {
      const compte = r.correct !== null;
      const mat = r.q.matiere ?? r.q.domaine?.split('.')[0];
      for (const [obj, cle] of [[parDomaine, r.q.domaine], [parMatiere, mat], [parLivret, r.livret]]) {
        const c = (obj[cle] ??= { posees: 0, bonnes: 0, points: 0, max: 0 });
        c.posees++;
        if (r.correct === true) c.bonnes++;
        c.points += r.score ?? 0;
        c.max += compte ? r.max : 0;
      }
      if (r.correct === true) { serie++; meilleureSerie = Math.max(meilleureSerie, serie); xp += 10 + 5 * ((r.q.difficulte ?? 1) - 1); }
      else if (r.correct === false) { serie = 0; if (r.score > 0) xp += Math.round(10 * (r.score / r.max)); }
    }
    for (const c of [...Object.values(parMatiere), ...Object.values(parLivret)]) c.pourcentage = c.max ? Math.round((c.points / c.max) * 100) : 0;
    const points = lignes.reduce((s, r) => s + (r.score ?? 0), 0);
    const max = lignes.reduce((s, r) => s + (r.correct === null ? 0 : r.max), 0);
    const dureeSecondes = this.livrets.reduce((s, l) => s + Math.max(0, Math.floor(((this.fins[l.n] ?? 0) - (this.debuts[l.n] ?? 0)) / 1000)), 0);
    return {
      mode: 'examen', reel: true, examenId: this.examen.id,
      questions: lignes.length,
      repondues: lignes.filter((r) => r.repondu).length,
      bonnes: lignes.filter((r) => r.correct === true).length,
      points, max, pourcentage: max ? Math.round((points / max) * 100) : 0,
      xp, meilleureSerie, dureeSecondes,
      parDomaine, parMatiere, parLivret,
      idsVus: lignes.map((r) => r.q.id),
      details: lignes.map((r) => ({ questionId: r.q.id, modeleId: null, domaine: r.q.domaine, notion: r.q.fiche ?? r.q.domaine, correct: r.correct, ratio: r.max ? (r.score ?? 0) / r.max : 0 })),
    };
  }
}
