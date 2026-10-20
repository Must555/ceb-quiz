// Avatars des joueurs : portraits illustrés (style animation 3D), l'emoji d'origine sert d'identifiant
// (les joueurs existants gardent le leur) et de secours si l'image ne se charge pas.
export const AVATARS = [
  { id: '🦊', nom: 'Renard', img: '01-renard' },
  { id: '🐺', nom: 'Loup', img: '02-loup' },
  { id: '🐯', nom: 'Tigre', img: '03-tigre' },
  { id: '🦁', nom: 'Lion', img: '04-lion' },
  { id: '🐼', nom: 'Panda', img: '05-panda' },
  { id: '🐨', nom: 'Koala', img: '06-koala' },
  { id: '🐸', nom: 'Grenouille', img: '07-grenouille' },
  { id: '🐙', nom: 'Pieuvre', img: '08-pieuvre' },
  { id: '🦈', nom: 'Requin', img: '09-requin' },
  { id: '🐲', nom: 'Dragon', img: '10-dragon' },
  { id: '🦅', nom: 'Aigle', img: '11-aigle' },
  { id: '🦄', nom: 'Licorne', img: '12-licorne' },
  { id: '🤖', nom: 'Robot', img: '13-robot' },
  { id: '👾', nom: 'Extraterrestre', img: '14-extraterrestre' },
  { id: '🧑‍🚀', nom: 'Astronaute (garçon)', img: '15-astronaute' },
  { id: '👩‍🚀', nom: 'Astronaute (fille)', img: '17-astronaute-fille' },
  { id: '🥷', nom: 'Ninja (garçon)', img: '16-ninja' },
  { id: 'ninja-fille', emoji: '🥷', nom: 'Ninja (fille)', img: '18-ninja-fille' },
];
const PAR_ID = new Map(AVATARS.map((a) => [a.id, a]));

export const avatarDe = (id) => PAR_ID.get(id) ?? { id, nom: 'Avatar', img: null };
// Pour les endroits sans image (listes déroulantes, textes) : l'emoji.
export const emojiAvatar = (id) => avatarDe(id).emoji ?? id ?? '🙂';
export const cheminAvatar = (id) => { const a = avatarDe(id); return a.img ? `assets/avatars/${a.img}.webp` : null; };

// <img> du portrait ; si l'image manque, l'emoji prend sa place.
export function imgAvatar(id) {
  const src = cheminAvatar(id);
  const emoji = emojiAvatar(id);
  if (!src) return emoji;
  return `<img src="${src}" alt="" decoding="async" draggable="false" onerror="this.replaceWith(document.createTextNode('${emoji}'))">`;
}
