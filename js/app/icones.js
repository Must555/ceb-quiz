// Icônes illustrées (3D) de l'interface : assets/ui/<nom>.webp, 128 px, fond transparent.
// Elles remplacent les emojis aux endroits les plus visibles ; ailleurs, les emojis restent.
export const ICONES = ['accueil', 'progres', 'fiches', 'papier', 'style', 'entrainement', 'defi', 'examen', 'chrono', 'amis',
  'fr', 'ma', 'hg', 'sc', 'xp', 'serie', 'badges', 'gemmes', 'astuce'];

// <img> décoratif (le texte voisin dit déjà de quoi il s'agit, d'où alt="").
export const ic = (nom, cls = '') => `<img class="ic${cls ? ' ' + cls : ''}" src="assets/ui/${nom}.webp" alt="" width="64" height="64" decoding="async" draggable="false">`;
