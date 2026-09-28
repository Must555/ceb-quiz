// Générateur de questions de conjugaison (programme de fin de primaire).
// Verbes du 1er groupe réguliers et du 2e groupe conjugués par règle ;
// verbes irréguliers fréquents conjugués par table.

const PERSONNES = [
  { pronom: 'je', idx: 0 }, { pronom: 'tu', idx: 1 }, { pronom: 'il', idx: 2 },
  { pronom: 'elle', idx: 2 }, { pronom: 'on', idx: 2 }, { pronom: 'nous', idx: 3 },
  { pronom: 'vous', idx: 4 }, { pronom: 'ils', idx: 5 }, { pronom: 'elles', idx: 5 },
];

export const TEMPS = {
  present: 'présent',
  imparfait: 'imparfait',
  futur: 'futur simple',
  passe_compose: 'passé composé',
};
const AU_TEMPS = { present: 'au présent', imparfait: "à l'imparfait", futur: 'au futur simple', passe_compose: 'au passé composé' };

// 1er groupe « sans piège » (pas de -cer, -ger, -yer, -eler, -eter, e/é qui change).
const PREMIER_GROUPE = ['aimer', 'chanter', 'jouer', 'parler', 'regarder', 'marcher', 'danser',
  'écouter', 'porter', 'trouver', 'travailler', 'penser', 'donner', 'sauter', 'gagner',
  'dessiner', 'habiter', 'raconter', 'rester', 'tomber', 'arriver', 'demander', 'chercher',
  'ranger', 'nager', 'manger', 'commencer', 'lancer'].filter((v) => !/(ger|cer)$/.test(v));
const DEUXIEME_GROUPE = ['finir', 'choisir', 'grandir', 'réussir', 'remplir', 'obéir', 'réfléchir', 'rougir'];

// Verbes conjugués avec l'auxiliaire être au passé composé.
const AUX_ETRE = new Set(['aller', 'venir', 'arriver', 'rester', 'tomber', 'partir']);

const IRREGULIERS = {
  etre: { inf: 'être', present: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'], imparfaitRad: 'ét', futurRad: 'ser', pp: 'été' },
  avoir: { inf: 'avoir', present: ['ai', 'as', 'a', 'avons', 'avez', 'ont'], imparfaitRad: 'av', futurRad: 'aur', pp: 'eu' },
  aller: { inf: 'aller', present: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'], imparfaitRad: 'all', futurRad: 'ir', pp: 'allé' },
  faire: { inf: 'faire', present: ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'], imparfaitRad: 'fais', futurRad: 'fer', pp: 'fait' },
  pouvoir: { inf: 'pouvoir', present: ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'], imparfaitRad: 'pouv', futurRad: 'pourr', pp: 'pu' },
  vouloir: { inf: 'vouloir', present: ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'], imparfaitRad: 'voul', futurRad: 'voudr', pp: 'voulu' },
  prendre: { inf: 'prendre', present: ['prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'], imparfaitRad: 'pren', futurRad: 'prendr', pp: 'pris' },
  venir: { inf: 'venir', present: ['viens', 'viens', 'vient', 'venons', 'venez', 'viennent'], imparfaitRad: 'ven', futurRad: 'viendr', pp: 'venu' },
  dire: { inf: 'dire', present: ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'], imparfaitRad: 'dis', futurRad: 'dir', pp: 'dit' },
  voir: { inf: 'voir', present: ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'], imparfaitRad: 'voy', futurRad: 'verr', pp: 'vu' },
  partir: { inf: 'partir', present: ['pars', 'pars', 'part', 'partons', 'partez', 'partent'], imparfaitRad: 'part', futurRad: 'partir', pp: 'parti' },
};

const TERM_IMPARFAIT = ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'];
const TERM_FUTUR = ['ai', 'as', 'a', 'ons', 'ez', 'ont'];

function conjuguerAvoirPresent(idx) { return IRREGULIERS.avoir.present[idx]; }
function conjuguerEtrePresent(idx) { return IRREGULIERS.etre.present[idx]; }

function formesVerbe(infinitif) {
  if (IRREGULIERS[sansAccent(infinitif)]) {
    const v = IRREGULIERS[sansAccent(infinitif)];
    return {
      present: (i) => v.present[i],
      imparfait: (i) => v.imparfaitRad + TERM_IMPARFAIT[i],
      futur: (i) => v.futurRad + TERM_FUTUR[i],
      pp: v.pp,
    };
  }
  if (infinitif.endsWith('er')) {
    const rad = infinitif.slice(0, -2);
    return {
      present: (i) => rad + ['e', 'es', 'e', 'ons', 'ez', 'ent'][i],
      imparfait: (i) => rad + TERM_IMPARFAIT[i],
      futur: (i) => infinitif + TERM_FUTUR[i],
      pp: rad + 'é',
    };
  }
  if (infinitif.endsWith('ir')) {
    const rad = infinitif.slice(0, -2);
    return {
      present: (i) => rad + ['is', 'is', 'it', 'issons', 'issez', 'issent'][i],
      imparfait: (i) => rad + 'iss' + TERM_IMPARFAIT[i],
      futur: (i) => infinitif + TERM_FUTUR[i],
      pp: rad + 'i',
    };
  }
  throw new Error(`Verbe non pris en charge : ${infinitif}`);
}

function sansAccent(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, ''); }
const commenceParVoyelle = (mot) => /^[aeiouyhéèêâîôûàœ]/i.test(mot);

// Renvoie { forme, formesAcceptees } (sans le pronom).
export function conjuguer(infinitif, temps, personne) {
  const f = formesVerbe(infinitif);
  const i = personne.idx;
  if (temps === 'passe_compose') {
    if (AUX_ETRE.has(infinitif)) {
      const aux = conjuguerEtrePresent(i);
      const pluriel = i >= 3;
      const fem = personne.pronom === 'elle' || personne.pronom === 'elles';
      const accord = f.pp + (fem ? 'e' : '') + (pluriel ? 's' : '');
      // je/tu/nous/vous : le genre n'est pas connu, on accepte masculin et féminin.
      const variantes = ['il', 'ils', 'elle', 'elles', 'on'].includes(personne.pronom)
        ? [accord]
        : [f.pp + (pluriel ? 's' : ''), f.pp + 'e' + (pluriel ? 's' : '')];
      return { forme: `${aux} ${variantes[0]}`, formesAcceptees: variantes.map((v) => `${aux} ${v}`) };
    }
    const forme = `${conjuguerAvoirPresent(i)} ${f.pp}`;
    return { forme, formesAcceptees: [forme] };
  }
  const forme = f[temps](i);
  return { forme, formesAcceptees: [forme] };
}

export function avecPronom(pronom, forme) {
  if (pronom === 'je' && commenceParVoyelle(forme)) return `j'${forme}`;
  return `${pronom} ${forme}`;
}

export function genererConjugaison(modele, rng) {
  const verbes = modele.verbes ?? [...PREMIER_GROUPE, ...DEUXIEME_GROUPE, ...Object.values(IRREGULIERS).map((v) => v.inf)];
  const temps = modele.temps ?? Object.keys(TEMPS);
  const infinitif = rng.pick(verbes);
  const t = rng.pick(temps);
  const personne = rng.pick(PERSONNES);
  const { forme, formesAcceptees } = conjuguer(infinitif, t, personne);

  const acceptees = new Set();
  for (const f of formesAcceptees) { acceptees.add(f); acceptees.add(avecPronom(personne.pronom, f)); }

  const pronomAffiche = personne.pronom === 'je' && commenceParVoyelle(forme) ? "j'" : personne.pronom;
  const groupe = IRREGULIERS[sansAccent(infinitif)] ? 'irrégulier' : infinitif.endsWith('er') ? '1er groupe' : '2e groupe';
  return {
    _signature: `${infinitif}|${t}|${personne.pronom}`,
    type: 'texte_court',
    enonce: `Conjugue le verbe « ${infinitif} » ${AU_TEMPS[t]} : ${pronomAffiche} …`,
    reponse: [...acceptees],
    souple: false, // les accents comptent : « il a chante » ≠ « il a chanté »
    explication: `${avecPronom(personne.pronom, forme)} (${infinitif}, ${groupe}, ${TEMPS[t]}).`,
  };
}
