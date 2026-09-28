// Sauvegarde des joueurs sur l'appareil (localStorage).
// Zéro compte : un joueur = un pseudo + un avatar, stocké dans ce navigateur uniquement.
// Toutes les lectures/écritures sont protégées : si le stockage est bloqué (navigation privée…),
// l'application fonctionne quand même, la progression est simplement perdue à la fermeture.

const CLE = 'missionceb.v1';
const MAX_HISTORIQUE = 4000; // ids de questions déjà vues (préférence anti-répétition entre sessions)

let memoire = null; // copie en mémoire, source de vérité pendant la visite

function lire() {
  if (memoire) return memoire;
  try { memoire = JSON.parse(localStorage.getItem(CLE)) || null; } catch { memoire = null; }
  if (!memoire || typeof memoire !== 'object') memoire = { actif: null, joueurs: {} };
  return memoire;
}

function ecrire() {
  try { localStorage.setItem(CLE, JSON.stringify(memoire)); return true; } catch { return false; }
}

export function stockageDisponible() {
  try { localStorage.setItem('__test', '1'); localStorage.removeItem('__test'); return true; } catch { return false; }
}

export function aujourdhui(d = new Date()) {
  // Date locale AAAA-MM-JJ (pas UTC : la série doit suivre les jours de l'enfant)
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function nouveauJoueur(pseudo, avatar, couleur) {
  return {
    id: 'j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    pseudo, avatar, couleur,
    theme: 'neon',
    creeLe: new Date().toISOString(),
    xp: 0,
    gemmes: 0,
    serie: { jours: 0, dernierJour: null, record: 0 },
    parMatiere: {},     // { ma: { posees, bonnes } }
    parDomaine: {},     // { 'ma.grandeurs': { posees, bonnes } }
    jours: {},          // { '2026-09-28': { questions, bonnes, sessions, meilleurPct, meilleureSerie, defis: [] } }
    badges: {},         // { id: dateObtention }
    sessions: [],       // résumé des 50 dernières sessions
    historique: [],     // ids des questions déjà vues
    notions: {},        // coach : { idFiche: { r: [1, 0, 0.5…], vu } }
    aRevoir: {},        // coach : { 'm:idModele' | 'q:idQuestion': { notion, boite, due } }
    totalQuestions: 0,
    totalBonnes: 0,
  };
}

export function listeJoueurs() {
  return Object.values(lire().joueurs).sort((a, b) => (b.derniereVisite || '').localeCompare(a.derniereVisite || ''));
}

export function joueurActif() {
  const s = lire();
  const j = s.actif ? s.joueurs[s.actif] ?? null : null;
  if (j) { j.notions ??= {}; j.aRevoir ??= {}; } // joueurs créés avant le coach
  return j;
}

export function pseudoPris(pseudo) {
  return listeJoueurs().some((j) => j.pseudo.toLowerCase() === pseudo.toLowerCase());
}

export function creerJoueur(pseudo, avatar, couleur) {
  const s = lire();
  const j = nouveauJoueur(pseudo, avatar, couleur);
  j.derniereVisite = new Date().toISOString();
  s.joueurs[j.id] = j;
  s.actif = j.id;
  ecrire();
  return j;
}

export function choisirJoueur(id) {
  const s = lire();
  if (!s.joueurs[id]) return null;
  s.actif = id;
  s.joueurs[id].derniereVisite = new Date().toISOString();
  ecrire();
  return s.joueurs[id];
}

export function deconnecter() { lire().actif = null; ecrire(); }

export function supprimerJoueur(id) {
  const s = lire();
  delete s.joueurs[id];
  if (s.actif === id) s.actif = null;
  ecrire();
}

// Modifie le joueur actif via une fonction, puis sauvegarde.
export function modifier(fn) {
  const j = joueurActif();
  if (!j) return null;
  fn(j);
  if (j.historique.length > MAX_HISTORIQUE) j.historique = j.historique.slice(-MAX_HISTORIQUE);
  if (j.sessions.length > 50) j.sessions = j.sessions.slice(-50);
  ecrire();
  return j;
}

// Code de sauvegarde : permet de recopier sa progression sur un autre appareil.
export function exporterJoueur(j) {
  const brut = JSON.stringify(j);
  return btoa(unescape(encodeURIComponent(brut)));
}

export function importerJoueur(code) {
  const j = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  if (!j || !j.id || !j.pseudo) throw new Error('Code invalide');
  const s = lire();
  s.joueurs[j.id] = { ...nouveauJoueur(j.pseudo, j.avatar, j.couleur), ...j };
  s.actif = j.id;
  ecrire();
  return s.joueurs[j.id];
}
