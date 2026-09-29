// Règles de progression : niveaux, série de jours, défis du jour, badges, gemmes.
import { aujourdhui } from './store.js';
import { majCoach } from './coach.js';

// ---------- Niveaux ----------
// Seuil du niveau n = 50 × n × (n − 1) XP : 0, 100, 300, 600, 1000, 1500, 2100…
export const seuil = (n) => 50 * n * (n - 1);
const TITRES = ['Recrue', 'Apprenti', 'Curieux', 'Explorateur', 'Aventurier', 'Stratège', 'Expert', 'Maître', 'Légende', 'Champion du CEB'];

export function niveau(xp) {
  let n = 1;
  while (seuil(n + 1) <= xp) n++;
  const debut = seuil(n), fin = seuil(n + 1);
  return { n, titre: TITRES[Math.min(n, TITRES.length) - 1], debut, fin, dans: xp - debut, pour: fin - debut, pct: Math.round(((xp - debut) / (fin - debut)) * 100) };
}

// ---------- Série de jours ----------
function hier(jour) {
  const d = new Date(jour + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return aujourdhui(d);
}

// Série affichée : cassée si le dernier jour joué est avant-hier ou plus ancien.
export function serieActuelle(j, jour = aujourdhui()) {
  const d = j.serie.dernierJour;
  return d === jour || d === hier(jour) ? j.serie.jours : 0;
}

function avancerSerie(j, jour) {
  const d = j.serie.dernierJour;
  if (d === jour) return false;
  j.serie.jours = d === hier(jour) ? j.serie.jours + 1 : 1;
  j.serie.dernierJour = jour;
  j.serie.record = Math.max(j.serie.record, j.serie.jours);
  return true;
}

// ---------- Défis du jour ----------
export const DEFIS = [
  { id: 'q10', e: '🎯', titre: 'Réponds à 10 questions', xp: 50, gemmes: 10, prog: (jr) => Math.min(1, jr.questions / 10), txt: (jr) => `${Math.min(jr.questions, 10)}/10` },
  { id: 'p80', e: '⭐', titre: '80 % ou plus sur 10 questions', xp: 50, gemmes: 10, prog: (jr) => (jr.meilleurPct >= 80 ? 1 : jr.meilleurPct / 100), txt: (jr) => `${jr.meilleurPct} %` },
  { id: 's5', e: '🔥', titre: '5 bonnes réponses d\'affilée', xp: 30, gemmes: 5, prog: (jr) => Math.min(1, jr.meilleureSerie / 5), txt: (jr) => `${Math.min(jr.meilleureSerie, 5)}/5` },
];

export function jourDe(j, jour = aujourdhui()) {
  return j.jours[jour] ?? { questions: 0, bonnes: 0, sessions: 0, meilleurPct: 0, meilleureSerie: 0, defis: [] };
}

// ---------- Badges ----------
export const BADGES = [
  { id: 'premier_pas', e: '🚀', nom: 'Décollage', desc: 'Termine ta première mission', test: (j) => j.sessions.length >= 1 },
  { id: 'q100', e: '💯', nom: 'Centurion', desc: 'Réponds à 100 questions', test: (j) => j.totalQuestions >= 100 },
  { id: 'q500', e: '🧠', nom: 'Cerveau d\'acier', desc: 'Réponds à 500 questions', test: (j) => j.totalQuestions >= 500 },
  { id: 'sans_faute', e: '🎯', nom: 'Sans faute', desc: '100 % sur une mission d\'au moins 10 questions', test: (j, s) => s && s.questions >= 10 && s.pourcentage === 100 },
  { id: 'serie10', e: '⚡', nom: 'Éclair', desc: '10 bonnes réponses d\'affilée', test: (j, s) => s && s.meilleureSerie >= 10 },
  { id: 'jours3', e: '🔥', nom: 'En feu', desc: 'Joue 3 jours d\'affilée', test: (j) => j.serie.record >= 3 },
  { id: 'jours7', e: '🌋', nom: 'Volcan', desc: 'Joue 7 jours d\'affilée', test: (j) => j.serie.record >= 7 },
  { id: 'fr20', e: '📖', nom: 'Plume d\'or', desc: '20 bonnes réponses en français', test: (j) => (j.parMatiere.fr?.bonnes ?? 0) >= 20 },
  { id: 'ma20', e: '📐', nom: 'As des maths', desc: '20 bonnes réponses en maths', test: (j) => (j.parMatiere.ma?.bonnes ?? 0) >= 20 },
  { id: 'hg20', e: '🌍', nom: 'Globe-trotter', desc: '20 bonnes réponses en histoire-géo', test: (j) => (j.parMatiere.hg?.bonnes ?? 0) >= 20 },
  { id: 'sc20', e: '🧪', nom: 'Savant fou', desc: '20 bonnes réponses en sciences', test: (j) => (j.parMatiere.sc?.bonnes ?? 0) >= 20 },
  { id: 'coach', e: '🧭', nom: 'Bien guidé', desc: 'Termine une mission ciblée du coach', test: (j, s) => s && s.modeJeu === 'cible' },
  { id: 'examen', e: '📝', nom: 'Candidat', desc: 'Termine un examen blanc', test: (j, s) => s && s.mode === 'examen' },
  { id: 'chrono', e: '⏱️', nom: 'Contre la montre', desc: '10 bonnes réponses en mode Chrono', test: (j, s) => s && s.modeJeu === 'chrono' && s.bonnes >= 10 },
  { id: 'niveau5', e: '👑', nom: 'Aventurier', desc: 'Atteins le niveau 5', test: (j) => niveau(j.xp).n >= 5 },
];

// ---------- Fin de session ----------
// `resume` vient de QuizSession.resume() ; `modeJeu` = entrainement | defi | examen | chrono.
export function enregistrerSession(j, resume, modeJeu, jour = aujourdhui()) {
  const avant = niveau(j.xp).n;
  const res = { xpSession: resume.xp, xpDefis: 0, gemmes: 0, defisGagnes: [], nouveauxBadges: [], niveauAvant: avant, niveauApres: avant, serieAvancee: false };
  if (resume.questions === 0) return res;

  // Statistiques
  j.xp += resume.xp;
  j.gemmes += resume.bonnes; res.gemmes += resume.bonnes;
  j.totalQuestions += resume.questions;
  j.totalBonnes += resume.bonnes;
  for (const [dom, v] of Object.entries(resume.parDomaine)) {
    const mat = dom.split('.')[0];
    for (const [cle, obj] of [[dom, j.parDomaine], [mat, j.parMatiere]]) {
      const c = (obj[cle] ??= { posees: 0, bonnes: 0 });
      c.posees += v.posees; c.bonnes += v.bonnes;
    }
  }
  j.historique.push(...resume.idsVus);
  majCoach(j, resume.details, jour);

  const jr = (j.jours[jour] ??= jourDe(j, jour));
  jr.questions += resume.questions;
  jr.bonnes += resume.bonnes;
  jr.sessions += 1;
  // Pour l'espace parents : temps de jeu et matières du jour.
  jr.secondes = (jr.secondes ?? 0) + (resume.dureeSecondes ?? 0);
  jr.mat ??= {};
  for (const [dom, v] of Object.entries(resume.parDomaine)) {
    const c = (jr.mat[dom.split('.')[0]] ??= { posees: 0, bonnes: 0 });
    c.posees += v.posees; c.bonnes += v.bonnes;
  }
  if (resume.questions >= 10) jr.meilleurPct = Math.max(jr.meilleurPct, resume.pourcentage);
  jr.meilleureSerie = Math.max(jr.meilleureSerie, resume.meilleureSerie);
  if (modeJeu === 'defi') jr.defiDuJourFait = true;

  res.serieAvancee = avancerSerie(j, jour);

  // Défis du jour (une seule fois par jour chacun)
  for (const d of DEFIS) {
    if (!jr.defis.includes(d.id) && d.prog(jr) >= 1) {
      jr.defis.push(d.id);
      j.xp += d.xp; j.gemmes += d.gemmes;
      res.xpDefis += d.xp; res.gemmes += d.gemmes;
      res.defisGagnes.push(d);
    }
  }

  const s = { ...resume, modeJeu, date: new Date().toISOString() };
  delete s.idsVus;
  j.sessions.push(s);

  // Badges
  for (const b of BADGES) {
    if (!j.badges[b.id] && b.test(j, s)) { j.badges[b.id] = jour; res.nouveauxBadges.push(b); }
  }
  res.niveauApres = niveau(j.xp).n;
  return res;
}
