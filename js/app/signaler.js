// « Signaler une erreur » : sans serveur, on ouvre la messagerie de l'appareil avec un message pré-rempli.
// Le message ne contient que ce qu'il faut pour retrouver la question (identifiant, origine, énoncé,
// réponses) et le commentaire écrit : jamais le pseudo ni la progression de l'enfant.

export const ADRESSE_SIGNALEMENT = 'missionceb@outlook.be';
const MAX_URL = 1900; // les liens mailto trop longs sont tronqués par certaines messageries

const couper = (s, n) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

// Origine lisible d'une question : vrai CEB, question générée (famille) ou banque.
export function origineQuestion(q) {
  if (!q) return '';
  if (q.source === 'examen') return `CEB ${q.annee ?? ''}${q.referentiel === 'tronc_commun' ? ' tronc commun' : q.annee === 2026 ? ' socles' : ''} · livret ${q.livret} · question ${q.numero}`;
  if (q.modeleId) return `Question générée · famille ${q.modeleId}`;
  return `Banque de questions · ${q.domaine ?? ''}`;
}

// Sujet et corps du message. `quoi` : { q, reponseDonnee, bonneReponse } ou { fiche }.
export function messageSignalement({ q = null, fiche = null, reponseDonnee = null, bonneReponse = null, commentaire = '', page = '' } = {}) {
  const id = q?.id ?? fiche?.id ?? 'inconnu';
  const sujet = `[Mission CEB] Erreur signalée — ${q ? origineQuestion(q) : `fiche « ${couper(fiche?.titre, 60)} »`}`;
  const lignes = [
    'Bonjour,', '',
    'Je pense avoir trouvé une erreur dans Mission CEB.', '',
    `Commentaire : ${commentaire.trim() || '(à compléter : qu\'est-ce qui ne va pas ?)'}`, '',
    '— Informations pour retrouver la question (ne pas modifier) —',
    `Identifiant : ${id}`,
  ];
  if (q) {
    lignes.push(`Origine : ${origineQuestion(q)}`);
    lignes.push(`Énoncé : ${couper(q.enonce, 320)}`);
    if (bonneReponse != null) lignes.push(`Réponse attendue par le site : ${couper(bonneReponse, 200)}`);
    if (reponseDonnee != null) lignes.push(`Réponse donnée : ${couper(reponseDonnee, 160)}`);
  }
  if (fiche) lignes.push(`Fiche : ${fiche.titre}`);
  if (page) lignes.push(`Écran : ${page}`);
  return { sujet, corps: lignes.join('\n') };
}

export function lienMailto(message, adresse = ADRESSE_SIGNALEMENT) {
  let { sujet, corps } = message;
  const url = (c) => `mailto:${adresse}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(c)}`;
  // Trop long : on raccourcit le corps (l'identifiant, placé avant l'énoncé, est toujours gardé).
  while (url(corps).length > MAX_URL && corps.length > 200) corps = corps.slice(0, Math.floor(corps.length * 0.9)) + '…';
  return url(corps);
}
