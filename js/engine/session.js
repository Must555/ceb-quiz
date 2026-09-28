// Session de quiz : tirage aléatoire intelligent, anti-répétition, chrono, score.
//
// RÈGLE ABSOLUE : au cours d'une même session, une question ne revient jamais.
// Trois verrous le garantissent :
//   1. `vus` : ids déjà posés (questions de la banque ET variantes générées) ;
//   2. `contenus` : énoncés normalisés déjà posés (deux ids différents mais même texte = doublon) ;
//   3. les modèles sont limités en nombre de variantes par session et jamais tirés deux fois de suite,
//      pour éviter une impression de répétition (« encore un calcul de soldes ! »).
//
// En plus, `historique` (questions vues lors des sessions précédentes) sert de préférence douce :
// on pose d'abord ce que l'enfant n'a jamais vu, puis on complète si nécessaire.

import { createRng } from './random.js';
import { genererVariante } from './generator.js';
import { corriger } from './checker.js';
import { normaliserTexte, formatNombre } from './format.js';

const PAR_DEFAUT = {
  mode: 'entrainement',   // 'entrainement' | 'examen'
  nbQuestions: 10,
  dureeSecondes: null,     // null = pas de chrono
  matieres: null,          // ex. ['ma'] ; null = toutes
  domaines: null,          // ex. ['ma.grandeurs'] ; null = tous
  referentiel: null,       // 'socles' | 'tronc_commun' | null
  difficulteMax: 3,
  livrets: null,           // mode examen : ex. [4, 7] ; null = tous les livrets
  poidsModele: 3,          // un modèle « pèse » autant que 3 questions fixes
  maxParModele: 3,         // variantes d'un même modèle par session
  seed: undefined,
  now: () => Date.now(),   // injectable pour les tests
  // Pondération personnalisée (coach) : fonction (questionOuModele) => poids ≥ 0.
  // 0 = jamais tiré ; 5 = cinq fois plus de chances. N'affecte jamais l'anti-répétition.
  poids: null,
};

// Jouable à l'écran : un corrigé automatique, ou une question ouverte avec réponse modèle (autoévaluation).
export const estJouable = (q) => q.reponse != null || (q.type === 'ouverte' && !!q.reponseModele);

export class QuizSession {
  constructor({ banque = [], modeles = [], historique = [], examen = null }, options = {}) {
    this.o = { ...PAR_DEFAUT, ...options };
    this.rng = createRng(this.o.seed ?? Date.now());
    this.historique = new Set(historique);
    this.vus = new Set();
    this.contenus = new Set();
    this.parModele = new Map();
    this.epuises = new Set(); // modèles sans variante neuve pour cette session
    this.dernierModele = null;
    this.reponses = [];
    this.courante = null;
    this.serie = 0;
    this.meilleureSerie = 0;
    this.xp = 0;
    this.debut = null;

    if (this.o.mode === 'examen') {
      if (!examen) throw new Error('Le mode examen demande un examen.');
      this.fileExamen = examen.questions.filter((q) => q.numerisable !== false && estJouable(q)
        && this.filtre(q) && (!this.o.livrets || this.o.livrets.includes(q.livret)));
      this.o.nbQuestions = this.fileExamen.length;
    } else {
      this.banque = banque.filter((q) => q.numerisable !== false && estJouable(q) && this.filtre(q));
      this.modeles = modeles.filter((m) => this.filtre(m));
    }
  }

  filtre(q) {
    const o = this.o;
    if (o.matieres && !o.matieres.includes(q.matiere ?? q.domaine?.split('.')[0])) return false;
    if (o.domaines && !o.domaines.includes(q.domaine)) return false;
    if (o.referentiel && q.referentiels && !q.referentiels.includes(o.referentiel)) return false;
    if (o.referentiel && q.referentiel && q.referentiel !== o.referentiel) return false;
    if ((q.difficulte ?? 1) > o.difficulteMax) return false;
    return true;
  }

  // --- Chrono -------------------------------------------------------------
  tempsEcoule() { return this.debut == null ? 0 : Math.floor((this.o.now() - this.debut) / 1000); }
  tempsRestant() {
    if (!this.o.dureeSecondes) return null;
    return Math.max(0, this.o.dureeSecondes - this.tempsEcoule());
  }
  estTerminee() {
    if (this.tempsRestant() === 0) return true;
    return this.reponses.length >= this.o.nbQuestions;
  }

  // --- Tirage -------------------------------------------------------------
  dejaPosee(q) {
    return this.vus.has(q.id) || this.contenus.has(normaliserTexte(q.enonce));
  }

  suivante() {
    if (this.debut == null) this.debut = this.o.now();
    if (this.courante) return this.courante; // on ne saute pas une question sans y répondre
    if (this.estTerminee()) return null;

    const q = this.o.mode === 'examen' ? this.tirerExamen() : this.tirerAleatoire();
    if (!q) return null; // plus aucune question neuve disponible pour ces filtres
    this.vus.add(q.id);
    this.contenus.add(normaliserTexte(q.enonce));
    this.courante = q;
    return q;
  }

  tirerExamen() {
    return this.fileExamen[this.reponses.length] ?? null;
  }

  tirerAleatoire() {
    // Deux passes : d'abord sans ce qui a été vu aux sessions précédentes, puis en l'autorisant.
    for (const eviterHistorique of [true, false]) {
      const q = this.tirerDansPool(eviterHistorique);
      if (q) return q;
    }
    return null;
  }

  tirerDansPool(eviterHistorique) {
    const fixes = this.banque.filter((q) => !this.dejaPosee(q) && !(eviterHistorique && this.historique.has(q.id)));
    let modeles = this.modeles.filter((m) =>
      (this.parModele.get(m.id) ?? 0) < this.o.maxParModele && !this.epuises.has(m.id));
    // Pas deux fois de suite le même modèle, sauf s'il n'y a rien d'autre.
    if (modeles.length > 1 || fixes.length > 0) modeles = modeles.filter((m) => m.id !== this.dernierModele);

    const poids = this.o.poids ?? (() => 1);
    let candidats = [
      ...fixes.map((item) => ({ item, modele: false, w: poids(item) })),
      ...modeles.map((item) => ({ item, modele: true, w: this.o.poidsModele * poids(item) })),
    ].filter((c) => c.w > 0);

    for (let essai = 0; essai < 30 && candidats.length; essai++) {
      const total = candidats.reduce((s, c) => s + c.w, 0);
      let r = this.rng.next() * total;
      const c = candidats.find((x) => (r -= x.w) < 0) ?? candidats[candidats.length - 1];

      if (!c.modele) { this.dernierModele = null; return c.item; }

      const modele = c.item;
      const exclure = eviterHistorique ? new Set([...this.vus, ...this.historique]) : this.vus;
      const q = genererVariante(modele, this.rng, exclure);
      if (!q || this.dejaPosee(q)) {
        // Modèle épuisé pour cette session : on le retire du tirage.
        if (!q && !eviterHistorique) this.epuises.add(modele.id);
        candidats = candidats.filter((x) => x !== c);
        continue;
      }
      this.parModele.set(modele.id, (this.parModele.get(modele.id) ?? 0) + 1);
      this.dernierModele = modele.id;
      return q;
    }
    return null;
  }

  // --- Réponse ------------------------------------------------------------
  repondre(reponseEleve) {
    const q = this.courante;
    if (!q) throw new Error('Aucune question en cours.');
    const res = corriger(q, reponseEleve);

    let xpGagne = 0;
    if (res.correct === true) {
      this.serie++;
      this.meilleureSerie = Math.max(this.meilleureSerie, this.serie);
      xpGagne = 10 + 5 * ((q.difficulte ?? 1) - 1) + Math.min(this.serie - 1, 5) * 2;
    } else if (res.correct === false) {
      this.serie = 0;
      if (res.score > 0) xpGagne = Math.round(10 * (res.score / res.max)); // crédit partiel
    }
    this.xp += xpGagne;

    const entree = {
      questionId: q.id, modeleId: q.modeleId ?? null, domaine: q.domaine, notion: q.fiche ?? q.domaine,
      reponse: reponseEleve, ...res, xpGagne, t: this.tempsEcoule(),
    };
    this.reponses.push(entree);
    this.courante = null;
    return { ...entree, explication: q.explication, bonneReponse: bonneReponseLisible(q), serie: this.serie };
  }

  passer() { return this.repondre(null); }

  // --- Suivi --------------------------------------------------------------
  etat() {
    return {
      index: this.reponses.length + (this.courante ? 1 : 0),
      total: this.o.nbQuestions,
      bonnes: this.reponses.filter((r) => r.correct === true).length,
      serie: this.serie,
      xp: this.xp,
      tempsRestant: this.tempsRestant(),
      terminee: this.estTerminee(),
    };
  }

  resume() {
    const parDomaine = {};
    for (const r of this.reponses) {
      const d = (parDomaine[r.domaine] ??= { posees: 0, bonnes: 0, points: 0, max: 0 });
      d.posees++;
      if (r.correct === true) d.bonnes++;
      d.points += r.score ?? 0;
      d.max += r.correct === null ? 0 : r.max;
    }
    const points = this.reponses.reduce((s, r) => s + (r.score ?? 0), 0);
    const max = this.reponses.reduce((s, r) => s + (r.correct === null ? 0 : r.max), 0);
    return {
      mode: this.o.mode,
      questions: this.reponses.length,
      bonnes: this.reponses.filter((r) => r.correct === true).length,
      points, max,
      pourcentage: max ? Math.round((points / max) * 100) : 0,
      xp: this.xp,
      meilleureSerie: this.meilleureSerie,
      dureeSecondes: this.tempsEcoule(),
      parDomaine,
      idsVus: [...this.vus], // à ajouter à l'historique de l'enfant
      // Détail question par question (pour le coach : maîtrise par notion, révisions)
      details: this.reponses.map((r) => ({ questionId: r.questionId, modeleId: r.modeleId, domaine: r.domaine, notion: r.notion, correct: r.correct, ratio: r.max ? (r.score ?? 0) / r.max : 0 })),
    };
  }
}

export function bonneReponseLisible(q) {
  switch (q.type) {
    case 'qcm': return q.choix[q.reponse];
    case 'qcm_multi': return q.reponse.map((i) => q.choix[i]).join(' ; ');
    case 'vrai_faux': return q.reponse ? 'Vrai' : 'Faux';
    case 'numerique': return `${formatNombre(q.reponse)}${q.unite ? ' ' + q.unite : ''}`;
    case 'texte_court': return [].concat(q.reponse)[0];
    case 'trous': return q.reponse.map((r) => [].concat(r)[0]).join(' / ');
    case 'grille': return q.lignes.map((l, i) => `${l} → ${q.colonnes[q.reponse[i]]}`).join('\n');
    case 'ordre': return q.reponse.map((i) => q.elements[i]).join(' → ');
    case 'association': return q.reponse.map(([g, d]) => `${q.gauche[g]} ↔ ${q.droite[d]}`).join('\n');
    case 'ouverte': return q.reponseModele ?? '';
    default: return '';
  }
}
