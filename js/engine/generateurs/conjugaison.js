// Générateur de questions de conjugaison (programme de fin de primaire).
// Verbes du 1er groupe réguliers (y compris -cer / -ger) et du 2e groupe conjugués par règle ;
// verbes irréguliers fréquents conjugués par table.
// Temps : présent, imparfait, futur simple, passé composé, passé simple, conditionnel présent,
// impératif présent (personnes idx 1 = tu, 3 = nous, 4 = vous).

export const PERSONNES = [
  { pronom: 'je', idx: 0 }, { pronom: 'tu', idx: 1 }, { pronom: 'il', idx: 2 },
  { pronom: 'elle', idx: 2 }, { pronom: 'on', idx: 2 }, { pronom: 'nous', idx: 3 },
  { pronom: 'vous', idx: 4 }, { pronom: 'ils', idx: 5 }, { pronom: 'elles', idx: 5 },
];

export const TEMPS = {
  present: 'présent',
  imparfait: 'imparfait',
  futur: 'futur simple',
  passe_compose: 'passé composé',
  passe_simple: 'passé simple',
  conditionnel: 'conditionnel présent',
  imperatif: 'impératif présent',
};
export const AU_TEMPS = {
  present: 'au présent', imparfait: "à l'imparfait", futur: 'au futur simple', passe_compose: 'au passé composé',
  passe_simple: 'au passé simple', conditionnel: 'au conditionnel présent', imperatif: "à l'impératif présent",
};
const TEMPS_HISTORIQUES = ['present', 'imparfait', 'futur', 'passe_compose'];

// 1er groupe « sans piège » (pas de -cer, -ger, -yer, -eler, -eter, e/é qui change).
const PREMIER_GROUPE = ['aimer', 'chanter', 'jouer', 'parler', 'regarder', 'marcher', 'danser',
  'écouter', 'porter', 'trouver', 'travailler', 'penser', 'donner', 'sauter', 'gagner',
  'dessiner', 'habiter', 'raconter', 'rester', 'tomber', 'arriver', 'demander', 'chercher',
  'ranger', 'nager', 'manger', 'commencer', 'lancer'].filter((v) => !/(ger|cer)$/.test(v));
const DEUXIEME_GROUPE = ['finir', 'choisir', 'grandir', 'réussir', 'remplir', 'obéir', 'réfléchir', 'rougir'];

// Verbes conjugués avec l'auxiliaire être au passé composé.
export const AUX_ETRE = new Set(['aller', 'venir', 'arriver', 'rester', 'tomber', 'partir', 'sortir', 'revenir', 'devenir', 'entrer']);

// ps : [radical, type de terminaisons du passé simple] ; imperatif : null si peu employé.
const IRREGULIERS = {
  etre: { inf: 'être', present: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'], imparfaitRad: 'ét', futurRad: 'ser', pp: 'été', ps: ['f', 'u'], imperatif: ['sois', 'soyons', 'soyez'] },
  avoir: { inf: 'avoir', present: ['ai', 'as', 'a', 'avons', 'avez', 'ont'], imparfaitRad: 'av', futurRad: 'aur', pp: 'eu', ps: ['e', 'u'], imperatif: ['aie', 'ayons', 'ayez'] },
  aller: { inf: 'aller', present: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'], imparfaitRad: 'all', futurRad: 'ir', pp: 'allé', ps: ['all', 'a'], imperatif: ['va', 'allons', 'allez'] },
  faire: { inf: 'faire', present: ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'], imparfaitRad: 'fais', futurRad: 'fer', pp: 'fait', ps: ['f', 'i'], imperatif: ['fais', 'faisons', 'faites'] },
  pouvoir: { inf: 'pouvoir', present: ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'], imparfaitRad: 'pouv', futurRad: 'pourr', pp: 'pu', ps: ['p', 'u'], imperatif: null },
  vouloir: { inf: 'vouloir', present: ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'], imparfaitRad: 'voul', futurRad: 'voudr', pp: 'voulu', ps: ['voul', 'u'], imperatif: null },
  prendre: { inf: 'prendre', present: ['prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'], imparfaitRad: 'pren', futurRad: 'prendr', pp: 'pris', ps: ['pr', 'i'], imperatif: ['prends', 'prenons', 'prenez'] },
  venir: { inf: 'venir', present: ['viens', 'viens', 'vient', 'venons', 'venez', 'viennent'], imparfaitRad: 'ven', futurRad: 'viendr', pp: 'venu', ps: ['v', 'in'], imperatif: ['viens', 'venons', 'venez'] },
  dire: { inf: 'dire', present: ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'], imparfaitRad: 'dis', futurRad: 'dir', pp: 'dit', ps: ['d', 'i'], imperatif: ['dis', 'disons', 'dites'] },
  voir: { inf: 'voir', present: ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'], imparfaitRad: 'voy', futurRad: 'verr', pp: 'vu', ps: ['v', 'i'], imperatif: ['vois', 'voyons', 'voyez'] },
  partir: { inf: 'partir', present: ['pars', 'pars', 'part', 'partons', 'partez', 'partent'], imparfaitRad: 'part', futurRad: 'partir', pp: 'parti', ps: ['part', 'i'], imperatif: ['pars', 'partons', 'partez'] },
  savoir: { inf: 'savoir', present: ['sais', 'sais', 'sait', 'savons', 'savez', 'savent'], imparfaitRad: 'sav', futurRad: 'saur', pp: 'su', ps: ['s', 'u'], imperatif: ['sache', 'sachons', 'sachez'] },
  devoir: { inf: 'devoir', present: ['dois', 'dois', 'doit', 'devons', 'devez', 'doivent'], imparfaitRad: 'dev', futurRad: 'devr', pp: 'dû', ps: ['d', 'u'], imperatif: null },
  mettre: { inf: 'mettre', present: ['mets', 'mets', 'met', 'mettons', 'mettez', 'mettent'], imparfaitRad: 'mett', futurRad: 'mettr', pp: 'mis', ps: ['m', 'i'], imperatif: ['mets', 'mettons', 'mettez'] },
  lire: { inf: 'lire', present: ['lis', 'lis', 'lit', 'lisons', 'lisez', 'lisent'], imparfaitRad: 'lis', futurRad: 'lir', pp: 'lu', ps: ['l', 'u'], imperatif: ['lis', 'lisons', 'lisez'] },
  ecrire: { inf: 'écrire', present: ['écris', 'écris', 'écrit', 'écrivons', 'écrivez', 'écrivent'], imparfaitRad: 'écriv', futurRad: 'écrir', pp: 'écrit', ps: ['écriv', 'i'], imperatif: ['écris', 'écrivons', 'écrivez'] },
  courir: { inf: 'courir', present: ['cours', 'cours', 'court', 'courons', 'courez', 'courent'], imparfaitRad: 'cour', futurRad: 'courr', pp: 'couru', ps: ['cour', 'u'], imperatif: ['cours', 'courons', 'courez'] },
  tenir: { inf: 'tenir', present: ['tiens', 'tiens', 'tient', 'tenons', 'tenez', 'tiennent'], imparfaitRad: 'ten', futurRad: 'tiendr', pp: 'tenu', ps: ['t', 'in'], imperatif: ['tiens', 'tenons', 'tenez'] },
  revenir: { inf: 'revenir', present: ['reviens', 'reviens', 'revient', 'revenons', 'revenez', 'reviennent'], imparfaitRad: 'reven', futurRad: 'reviendr', pp: 'revenu', ps: ['rev', 'in'], imperatif: ['reviens', 'revenons', 'revenez'] },
  devenir: { inf: 'devenir', present: ['deviens', 'deviens', 'devient', 'devenons', 'devenez', 'deviennent'], imparfaitRad: 'deven', futurRad: 'deviendr', pp: 'devenu', ps: ['dev', 'in'], imperatif: null },
  dormir: { inf: 'dormir', present: ['dors', 'dors', 'dort', 'dormons', 'dormez', 'dorment'], imparfaitRad: 'dorm', futurRad: 'dormir', pp: 'dormi', ps: ['dorm', 'i'], imperatif: ['dors', 'dormons', 'dormez'] },
  sortir: { inf: 'sortir', present: ['sors', 'sors', 'sort', 'sortons', 'sortez', 'sortent'], imparfaitRad: 'sort', futurRad: 'sortir', pp: 'sorti', ps: ['sort', 'i'], imperatif: ['sors', 'sortons', 'sortez'] },
  boire: { inf: 'boire', present: ['bois', 'bois', 'boit', 'buvons', 'buvez', 'boivent'], imparfaitRad: 'buv', futurRad: 'boir', pp: 'bu', ps: ['b', 'u'], imperatif: ['bois', 'buvons', 'buvez'] },
  croire: { inf: 'croire', present: ['crois', 'crois', 'croit', 'croyons', 'croyez', 'croient'], imparfaitRad: 'croy', futurRad: 'croir', pp: 'cru', ps: ['cr', 'u'], imperatif: ['crois', 'croyons', 'croyez'] },
  recevoir: { inf: 'recevoir', present: ['reçois', 'reçois', 'reçoit', 'recevons', 'recevez', 'reçoivent'], imparfaitRad: 'recev', futurRad: 'recevr', pp: 'reçu', ps: ['reç', 'u'], imperatif: null },
};
// Verbes irréguliers de la liste par défaut (modèles fr-m-conjugaison-*) : inchangée.
const IRREGULIERS_BASE = ['etre', 'avoir', 'aller', 'faire', 'pouvoir', 'vouloir', 'prendre', 'venir', 'dire', 'voir', 'partir'];

const TERM_IMPARFAIT = ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'];
const TERM_FUTUR = ['ai', 'as', 'a', 'ons', 'ez', 'ont'];
const TERM_PS = {
  a: ['ai', 'as', 'a', 'âmes', 'âtes', 'èrent'],
  i: ['is', 'is', 'it', 'îmes', 'îtes', 'irent'],
  u: ['us', 'us', 'ut', 'ûmes', 'ûtes', 'urent'],
  in: ['ins', 'ins', 'int', 'înmes', 'întes', 'inrent'],
};

function conjuguerAvoirPresent(idx) { return IRREGULIERS.avoir.present[idx]; }
function conjuguerEtrePresent(idx) { return IRREGULIERS.etre.present[idx]; }

// Verbes en -cer / -ger : ç ou ge devant a et o (nous commençons, il mangeait).
function coller(rad, term) {
  if (/^[aoâ]/.test(term)) {
    if (rad.endsWith('c')) return rad.slice(0, -1) + 'ç' + term;
    if (rad.endsWith('g')) return rad + 'e' + term;
  }
  return rad + term;
}

function sansAccent(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, ''); }
export const commenceParVoyelle = (mot) => /^[aeiouyhéèêâîôûàœ]/i.test(mot);

export function estIrregulier(infinitif) { return Boolean(IRREGULIERS[sansAccent(infinitif)]); }

function formesVerbe(infinitif) {
  if (IRREGULIERS[sansAccent(infinitif)]) {
    const v = IRREGULIERS[sansAccent(infinitif)];
    return {
      present: (i) => v.present[i],
      imparfait: (i) => v.imparfaitRad + TERM_IMPARFAIT[i],
      futur: (i) => v.futurRad + TERM_FUTUR[i],
      conditionnel: (i) => v.futurRad + TERM_IMPARFAIT[i],
      passe_simple: (i) => v.ps[0] + TERM_PS[v.ps[1]][i],
      imperatif: v.imperatif ? (i) => ({ 1: v.imperatif[0], 3: v.imperatif[1], 4: v.imperatif[2] })[i] : null,
      pp: v.pp,
    };
  }
  if (infinitif.endsWith('er')) {
    const rad = infinitif.slice(0, -2);
    const pres = ['e', 'es', 'e', 'ons', 'ez', 'ent'];
    return {
      present: (i) => coller(rad, pres[i]),
      imparfait: (i) => coller(rad, TERM_IMPARFAIT[i]),
      futur: (i) => infinitif + TERM_FUTUR[i],
      conditionnel: (i) => infinitif + TERM_IMPARFAIT[i],
      passe_simple: (i) => coller(rad, TERM_PS.a[i]),
      imperatif: (i) => coller(rad, { 1: 'e', 3: 'ons', 4: 'ez' }[i]),
      pp: rad + 'é',
    };
  }
  if (infinitif.endsWith('ir')) {
    const rad = infinitif.slice(0, -2);
    return {
      present: (i) => rad + ['is', 'is', 'it', 'issons', 'issez', 'issent'][i],
      imparfait: (i) => rad + 'iss' + TERM_IMPARFAIT[i],
      futur: (i) => infinitif + TERM_FUTUR[i],
      conditionnel: (i) => infinitif + TERM_IMPARFAIT[i],
      passe_simple: (i) => rad + TERM_PS.i[i],
      imperatif: (i) => rad + { 1: 'is', 3: 'issons', 4: 'issez' }[i],
      pp: rad + 'i',
    };
  }
  throw new Error(`Verbe non pris en charge : ${infinitif}`);
}

export function participePasse(infinitif) { return formesVerbe(infinitif).pp; }
export function auxiliaireDe(infinitif) { return AUX_ETRE.has(infinitif) ? 'être' : 'avoir'; }
export function aImperatif(infinitif) { return Boolean(formesVerbe(infinitif).imperatif); }

// Renvoie { forme, formesAcceptees } (sans le pronom).
// personne = { pronom, idx, genre? } ; genre 'm' / 'f' précise l'accord du participe avec être.
// Pour l'impératif, personne.idx doit valoir 1 (tu), 3 (nous) ou 4 (vous).
export function conjuguer(infinitif, temps, personne) {
  const f = formesVerbe(infinitif);
  const i = personne.idx;
  if (temps === 'passe_compose') {
    if (AUX_ETRE.has(infinitif)) {
      const aux = conjuguerEtrePresent(i);
      const pluriel = i >= 3;
      const fem = personne.genre ? personne.genre === 'f' : (personne.pronom === 'elle' || personne.pronom === 'elles');
      const accord = f.pp + (fem ? 'e' : '') + (pluriel ? 's' : '');
      // je/tu/nous/vous : le genre n'est pas connu, on accepte masculin et féminin.
      const connu = personne.genre || ['il', 'ils', 'elle', 'elles', 'on'].includes(personne.pronom);
      const variantes = connu
        ? [accord]
        : [f.pp + (pluriel ? 's' : ''), f.pp + 'e' + (pluriel ? 's' : '')];
      return { forme: `${aux} ${variantes[0]}`, formesAcceptees: variantes.map((v) => `${aux} ${v}`) };
    }
    const forme = `${conjuguerAvoirPresent(i)} ${f.pp}`;
    return { forme, formesAcceptees: [forme] };
  }
  if (!f[temps]) throw new Error(`${infinitif} : pas de ${temps}`);
  const forme = f[temps](i);
  return { forme, formesAcceptees: [forme] };
}

export function avecPronom(pronom, forme) {
  if (pronom === 'je' && commenceParVoyelle(forme)) return `j'${forme}`;
  return `${pronom} ${forme}`;
}

export function genererConjugaison(modele, rng) {
  const verbes = modele.verbes ?? [...PREMIER_GROUPE, ...DEUXIEME_GROUPE, ...IRREGULIERS_BASE.map((k) => IRREGULIERS[k].inf)];
  const temps = modele.temps ?? TEMPS_HISTORIQUES;
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
