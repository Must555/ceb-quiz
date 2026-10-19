// Générateur de questions de conjugaison (programme de fin de primaire).
// Verbes du 1er groupe réguliers (y compris -cer / -ger) et du 2e groupe conjugués par règle ;
// verbes irréguliers (3e groupe) conjugués par table.
// Temps : présent, imparfait, futur simple, passé composé, passé simple, conditionnel présent,
// impératif présent (personnes idx 1 = tu, 3 = nous, 4 = vous), subjonctif présent ;
// participe présent et participe passé.
//
// Formes doubles : « assieds|assois » = deux formes correctes (la première sert de référence).

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
  subjonctif: 'subjonctif présent',
};
export const AU_TEMPS = {
  present: 'au présent', imparfait: "à l'imparfait", futur: 'au futur simple', passe_compose: 'au passé composé',
  passe_simple: 'au passé simple', conditionnel: 'au conditionnel présent', imperatif: "à l'impératif présent",
  subjonctif: 'au subjonctif présent',
};
const TEMPS_HISTORIQUES = ['present', 'imparfait', 'futur', 'passe_compose'];

// 1er groupe « sans piège » (pas de -cer, -ger, -yer, -eler, -eter, e/é qui change).
const PREMIER_GROUPE = ['aimer', 'chanter', 'jouer', 'parler', 'regarder', 'marcher', 'danser',
  'écouter', 'porter', 'trouver', 'travailler', 'penser', 'donner', 'sauter', 'gagner',
  'dessiner', 'habiter', 'raconter', 'rester', 'tomber', 'arriver', 'demander', 'chercher',
  'ranger', 'nager', 'manger', 'commencer', 'lancer'].filter((v) => !/(ger|cer)$/.test(v));
const DEUXIEME_GROUPE = ['finir', 'choisir', 'grandir', 'réussir', 'remplir', 'obéir', 'réfléchir', 'rougir'];

// Verbes conjugués avec l'auxiliaire être au passé composé (dans les phrases de ce site).
export const AUX_ETRE = new Set(['aller', 'venir', 'arriver', 'rester', 'tomber', 'partir', 'sortir', 'revenir', 'devenir', 'entrer',
  'mourir', 'naître', 'parvenir', 'repartir', 'descendre', 'apparaître']);

// ─── Tables des verbes irréguliers ───
// present : 6 formes ; imparfaitRad (sert aussi au participe présent et au subjonctif avec nous/vous) ;
// futurRad (futur et conditionnel) ; pp ; ps : [radical, terminaisons du passé simple] ;
// imperatif : [tu, nous, vous] ou null si peu employé ; subj : 6 formes si elles ne suivent pas la règle
// (radical de « ils » au présent + e, es, e, ent ; radical de l'imparfait + ions, iez) ; ppr : participe présent particulier.
const IRREGULIERS = {
  etre: { inf: 'être', present: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'], imparfaitRad: 'ét', futurRad: 'ser', pp: 'été', ps: ['f', 'u'], imperatif: ['sois', 'soyons', 'soyez'], subj: ['sois', 'sois', 'soit', 'soyons', 'soyez', 'soient'] },
  avoir: { inf: 'avoir', present: ['ai', 'as', 'a', 'avons', 'avez', 'ont'], imparfaitRad: 'av', futurRad: 'aur', pp: 'eu', ps: ['e', 'u'], imperatif: ['aie', 'ayons', 'ayez'], subj: ['aie', 'aies', 'ait', 'ayons', 'ayez', 'aient'], ppr: 'ayant' },
  aller: { inf: 'aller', present: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'], imparfaitRad: 'all', futurRad: 'ir', pp: 'allé', ps: ['all', 'a'], imperatif: ['va', 'allons', 'allez'], subj: ['aille', 'ailles', 'aille', 'allions', 'alliez', 'aillent'] },
  faire: { inf: 'faire', present: ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'], imparfaitRad: 'fais', futurRad: 'fer', pp: 'fait', ps: ['f', 'i'], imperatif: ['fais', 'faisons', 'faites'], subj: ['fasse', 'fasses', 'fasse', 'fassions', 'fassiez', 'fassent'] },
  pouvoir: { inf: 'pouvoir', present: ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'], imparfaitRad: 'pouv', futurRad: 'pourr', pp: 'pu', ps: ['p', 'u'], imperatif: null, subj: ['puisse', 'puisses', 'puisse', 'puissions', 'puissiez', 'puissent'] },
  vouloir: { inf: 'vouloir', present: ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'], imparfaitRad: 'voul', futurRad: 'voudr', pp: 'voulu', ps: ['voul', 'u'], imperatif: null, subj: ['veuille', 'veuilles', 'veuille', 'voulions', 'vouliez', 'veuillent'] },
  prendre: { inf: 'prendre', present: ['prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'], imparfaitRad: 'pren', futurRad: 'prendr', pp: 'pris', ps: ['pr', 'i'], imperatif: ['prends', 'prenons', 'prenez'] },
  venir: { inf: 'venir', present: ['viens', 'viens', 'vient', 'venons', 'venez', 'viennent'], imparfaitRad: 'ven', futurRad: 'viendr', pp: 'venu', ps: ['v', 'in'], imperatif: ['viens', 'venons', 'venez'] },
  dire: { inf: 'dire', present: ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'], imparfaitRad: 'dis', futurRad: 'dir', pp: 'dit', ps: ['d', 'i'], imperatif: ['dis', 'disons', 'dites'] },
  voir: { inf: 'voir', present: ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'], imparfaitRad: 'voy', futurRad: 'verr', pp: 'vu', ps: ['v', 'i'], imperatif: ['vois', 'voyons', 'voyez'] },
  partir: { inf: 'partir', present: ['pars', 'pars', 'part', 'partons', 'partez', 'partent'], imparfaitRad: 'part', futurRad: 'partir', pp: 'parti', ps: ['part', 'i'], imperatif: ['pars', 'partons', 'partez'] },
  savoir: { inf: 'savoir', present: ['sais', 'sais', 'sait', 'savons', 'savez', 'savent'], imparfaitRad: 'sav', futurRad: 'saur', pp: 'su', ps: ['s', 'u'], imperatif: ['sache', 'sachons', 'sachez'], subj: ['sache', 'saches', 'sache', 'sachions', 'sachiez', 'sachent'], ppr: 'sachant' },
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

  // ── Ajouts (étape 2) : tables vérifiées (Bescherelle). ──
  acquerir: { inf: 'acquérir', present: ['acquiers', 'acquiers', 'acquiert', 'acquérons', 'acquérez', 'acquièrent'], imparfaitRad: 'acquér', futurRad: 'acquerr', pp: 'acquis', ps: ['acqu', 'i'], imperatif: null },
  conquerir: { inf: 'conquérir', present: ['conquiers', 'conquiers', 'conquiert', 'conquérons', 'conquérez', 'conquièrent'], imparfaitRad: 'conquér', futurRad: 'conquerr', pp: 'conquis', ps: ['conqu', 'i'], imperatif: null },
  mourir: { inf: 'mourir', present: ['meurs', 'meurs', 'meurt', 'mourons', 'mourez', 'meurent'], imparfaitRad: 'mour', futurRad: 'mourr', pp: 'mort', ps: ['mour', 'u'], imperatif: null },
  naitre: { inf: 'naître', present: ['nais', 'nais', 'naît', 'naissons', 'naissez', 'naissent'], imparfaitRad: 'naiss', futurRad: 'naîtr', pp: 'né', ps: ['naqu', 'i'], imperatif: null },
  asseoir: {
    inf: 'asseoir', present: ['assieds|assois', 'assieds|assois', 'assied|assoit', 'asseyons|assoyons', 'asseyez|assoyez', 'asseyent|assoient'],
    imparfaitRad: 'assey|assoy', futurRad: 'assiér|assoir', pp: 'assis', ps: ['ass', 'i'], imperatif: ['assieds|assois', 'asseyons|assoyons', 'asseyez|assoyez'],
    subj: ['asseye|assoie', 'asseyes|assoies', 'asseye|assoie', 'asseyions|assoyions', 'asseyiez|assoyiez', 'asseyent|assoient'],
  },
  vaincre: { inf: 'vaincre', present: ['vaincs', 'vaincs', 'vainc', 'vainquons', 'vainquez', 'vainquent'], imparfaitRad: 'vainqu', futurRad: 'vaincr', pp: 'vaincu', ps: ['vainqu', 'i'], imperatif: ['vaincs', 'vainquons', 'vainquez'] },
  convaincre: { inf: 'convaincre', present: ['convaincs', 'convaincs', 'convainc', 'convainquons', 'convainquez', 'convainquent'], imparfaitRad: 'convainqu', futurRad: 'convaincr', pp: 'convaincu', ps: ['convainqu', 'i'], imperatif: null },
  resoudre: { inf: 'résoudre', present: ['résous', 'résous', 'résout', 'résolvons', 'résolvez', 'résolvent'], imparfaitRad: 'résolv', futurRad: 'résoudr', pp: 'résolu', ps: ['résol', 'u'], imperatif: ['résous', 'résolvons', 'résolvez'] },
  cueillir: { inf: 'cueillir', present: ['cueille', 'cueilles', 'cueille', 'cueillons', 'cueillez', 'cueillent'], imparfaitRad: 'cueill', futurRad: 'cueiller', pp: 'cueilli', ps: ['cueill', 'i'], imperatif: ['cueille', 'cueillons', 'cueillez'] },
  accueillir: { inf: 'accueillir', present: ['accueille', 'accueilles', 'accueille', 'accueillons', 'accueillez', 'accueillent'], imparfaitRad: 'accueill', futurRad: 'accueiller', pp: 'accueilli', ps: ['accueill', 'i'], imperatif: ['accueille', 'accueillons', 'accueillez'] },
  coudre: { inf: 'coudre', present: ['couds', 'couds', 'coud', 'cousons', 'cousez', 'cousent'], imparfaitRad: 'cous', futurRad: 'coudr', pp: 'cousu', ps: ['cous', 'i'], imperatif: ['couds', 'cousons', 'cousez'] },
  plaire: { inf: 'plaire', present: ['plais', 'plais', 'plaît', 'plaisons', 'plaisez', 'plaisent'], imparfaitRad: 'plais', futurRad: 'plair', pp: 'plu', ps: ['pl', 'u'], imperatif: null },
  rire: { inf: 'rire', present: ['ris', 'ris', 'rit', 'rions', 'riez', 'rient'], imparfaitRad: 'ri', futurRad: 'rir', pp: 'ri', ps: ['r', 'i'], imperatif: ['ris', 'rions', 'riez'] },
  sourire: { inf: 'sourire', present: ['souris', 'souris', 'sourit', 'sourions', 'souriez', 'sourient'], imparfaitRad: 'souri', futurRad: 'sourir', pp: 'souri', ps: ['sour', 'i'], imperatif: ['souris', 'sourions', 'souriez'] },
  suivre: { inf: 'suivre', present: ['suis', 'suis', 'suit', 'suivons', 'suivez', 'suivent'], imparfaitRad: 'suiv', futurRad: 'suivr', pp: 'suivi', ps: ['suiv', 'i'], imperatif: ['suis', 'suivons', 'suivez'] },
  poursuivre: { inf: 'poursuivre', present: ['poursuis', 'poursuis', 'poursuit', 'poursuivons', 'poursuivez', 'poursuivent'], imparfaitRad: 'poursuiv', futurRad: 'poursuivr', pp: 'poursuivi', ps: ['poursuiv', 'i'], imperatif: ['poursuis', 'poursuivons', 'poursuivez'] },
  vivre: { inf: 'vivre', present: ['vis', 'vis', 'vit', 'vivons', 'vivez', 'vivent'], imparfaitRad: 'viv', futurRad: 'vivr', pp: 'vécu', ps: ['véc', 'u'], imperatif: ['vis', 'vivons', 'vivez'] },
  valoir: { inf: 'valoir', present: ['vaux', 'vaux', 'vaut', 'valons', 'valez', 'valent'], imparfaitRad: 'val', futurRad: 'vaudr', pp: 'valu', ps: ['val', 'u'], imperatif: null, subj: ['vaille', 'vailles', 'vaille', 'valions', 'valiez', 'vaillent'] },
  battre: { inf: 'battre', present: ['bats', 'bats', 'bat', 'battons', 'battez', 'battent'], imparfaitRad: 'batt', futurRad: 'battr', pp: 'battu', ps: ['batt', 'i'], imperatif: ['bats', 'battons', 'battez'] },
  combattre: { inf: 'combattre', present: ['combats', 'combats', 'combat', 'combattons', 'combattez', 'combattent'], imparfaitRad: 'combatt', futurRad: 'combattr', pp: 'combattu', ps: ['combatt', 'i'], imperatif: ['combats', 'combattons', 'combattez'] },
  fuir: { inf: 'fuir', present: ['fuis', 'fuis', 'fuit', 'fuyons', 'fuyez', 'fuient'], imparfaitRad: 'fuy', futurRad: 'fuir', pp: 'fui', ps: ['fu', 'i'], imperatif: ['fuis', 'fuyons', 'fuyez'] },
  mentir: { inf: 'mentir', present: ['mens', 'mens', 'ment', 'mentons', 'mentez', 'mentent'], imparfaitRad: 'ment', futurRad: 'mentir', pp: 'menti', ps: ['ment', 'i'], imperatif: null },
  sentir: { inf: 'sentir', present: ['sens', 'sens', 'sent', 'sentons', 'sentez', 'sentent'], imparfaitRad: 'sent', futurRad: 'sentir', pp: 'senti', ps: ['sent', 'i'], imperatif: ['sens', 'sentons', 'sentez'] },
  servir: { inf: 'servir', present: ['sers', 'sers', 'sert', 'servons', 'servez', 'servent'], imparfaitRad: 'serv', futurRad: 'servir', pp: 'servi', ps: ['serv', 'i'], imperatif: ['sers', 'servons', 'servez'] },
  repartir: { inf: 'repartir', present: ['repars', 'repars', 'repart', 'repartons', 'repartez', 'repartent'], imparfaitRad: 'repart', futurRad: 'repartir', pp: 'reparti', ps: ['repart', 'i'], imperatif: ['repars', 'repartons', 'repartez'] },
  ouvrir: { inf: 'ouvrir', present: ['ouvre', 'ouvres', 'ouvre', 'ouvrons', 'ouvrez', 'ouvrent'], imparfaitRad: 'ouvr', futurRad: 'ouvrir', pp: 'ouvert', ps: ['ouvr', 'i'], imperatif: ['ouvre', 'ouvrons', 'ouvrez'] },
  couvrir: { inf: 'couvrir', present: ['couvre', 'couvres', 'couvre', 'couvrons', 'couvrez', 'couvrent'], imparfaitRad: 'couvr', futurRad: 'couvrir', pp: 'couvert', ps: ['couvr', 'i'], imperatif: ['couvre', 'couvrons', 'couvrez'] },
  decouvrir: { inf: 'découvrir', present: ['découvre', 'découvres', 'découvre', 'découvrons', 'découvrez', 'découvrent'], imparfaitRad: 'découvr', futurRad: 'découvrir', pp: 'découvert', ps: ['découvr', 'i'], imperatif: ['découvre', 'découvrons', 'découvrez'] },
  offrir: { inf: 'offrir', present: ['offre', 'offres', 'offre', 'offrons', 'offrez', 'offrent'], imparfaitRad: 'offr', futurRad: 'offrir', pp: 'offert', ps: ['offr', 'i'], imperatif: ['offre', 'offrons', 'offrez'] },
  souffrir: { inf: 'souffrir', present: ['souffre', 'souffres', 'souffre', 'souffrons', 'souffrez', 'souffrent'], imparfaitRad: 'souffr', futurRad: 'souffrir', pp: 'souffert', ps: ['souffr', 'i'], imperatif: null },
  conduire: { inf: 'conduire', present: ['conduis', 'conduis', 'conduit', 'conduisons', 'conduisez', 'conduisent'], imparfaitRad: 'conduis', futurRad: 'conduir', pp: 'conduit', ps: ['conduis', 'i'], imperatif: ['conduis', 'conduisons', 'conduisez'] },
  construire: { inf: 'construire', present: ['construis', 'construis', 'construit', 'construisons', 'construisez', 'construisent'], imparfaitRad: 'construis', futurRad: 'construir', pp: 'construit', ps: ['construis', 'i'], imperatif: ['construis', 'construisons', 'construisez'] },
  detruire: { inf: 'détruire', present: ['détruis', 'détruis', 'détruit', 'détruisons', 'détruisez', 'détruisent'], imparfaitRad: 'détruis', futurRad: 'détruir', pp: 'détruit', ps: ['détruis', 'i'], imperatif: ['détruis', 'détruisons', 'détruisez'] },
  produire: { inf: 'produire', present: ['produis', 'produis', 'produit', 'produisons', 'produisez', 'produisent'], imparfaitRad: 'produis', futurRad: 'produir', pp: 'produit', ps: ['produis', 'i'], imperatif: null },
  traduire: { inf: 'traduire', present: ['traduis', 'traduis', 'traduit', 'traduisons', 'traduisez', 'traduisent'], imparfaitRad: 'traduis', futurRad: 'traduir', pp: 'traduit', ps: ['traduis', 'i'], imperatif: ['traduis', 'traduisons', 'traduisez'] },
  cuire: { inf: 'cuire', present: ['cuis', 'cuis', 'cuit', 'cuisons', 'cuisez', 'cuisent'], imparfaitRad: 'cuis', futurRad: 'cuir', pp: 'cuit', ps: ['cuis', 'i'], imperatif: ['cuis', 'cuisons', 'cuisez'] },
  peindre: { inf: 'peindre', present: ['peins', 'peins', 'peint', 'peignons', 'peignez', 'peignent'], imparfaitRad: 'peign', futurRad: 'peindr', pp: 'peint', ps: ['peign', 'i'], imperatif: ['peins', 'peignons', 'peignez'] },
  eteindre: { inf: 'éteindre', present: ['éteins', 'éteins', 'éteint', 'éteignons', 'éteignez', 'éteignent'], imparfaitRad: 'éteign', futurRad: 'éteindr', pp: 'éteint', ps: ['éteign', 'i'], imperatif: ['éteins', 'éteignons', 'éteignez'] },
  atteindre: { inf: 'atteindre', present: ['atteins', 'atteins', 'atteint', 'atteignons', 'atteignez', 'atteignent'], imparfaitRad: 'atteign', futurRad: 'atteindr', pp: 'atteint', ps: ['atteign', 'i'], imperatif: null },
  craindre: { inf: 'craindre', present: ['crains', 'crains', 'craint', 'craignons', 'craignez', 'craignent'], imparfaitRad: 'craign', futurRad: 'craindr', pp: 'craint', ps: ['craign', 'i'], imperatif: null },
  plaindre: { inf: 'plaindre', present: ['plains', 'plains', 'plaint', 'plaignons', 'plaignez', 'plaignent'], imparfaitRad: 'plaign', futurRad: 'plaindr', pp: 'plaint', ps: ['plaign', 'i'], imperatif: null },
  joindre: { inf: 'joindre', present: ['joins', 'joins', 'joint', 'joignons', 'joignez', 'joignent'], imparfaitRad: 'joign', futurRad: 'joindr', pp: 'joint', ps: ['joign', 'i'], imperatif: ['joins', 'joignons', 'joignez'] },
  rejoindre: { inf: 'rejoindre', present: ['rejoins', 'rejoins', 'rejoint', 'rejoignons', 'rejoignez', 'rejoignent'], imparfaitRad: 'rejoign', futurRad: 'rejoindr', pp: 'rejoint', ps: ['rejoign', 'i'], imperatif: ['rejoins', 'rejoignons', 'rejoignez'] },
  connaitre: { inf: 'connaître', present: ['connais', 'connais', 'connaît', 'connaissons', 'connaissez', 'connaissent'], imparfaitRad: 'connaiss', futurRad: 'connaîtr', pp: 'connu', ps: ['conn', 'u'], imperatif: null },
  reconnaitre: { inf: 'reconnaître', present: ['reconnais', 'reconnais', 'reconnaît', 'reconnaissons', 'reconnaissez', 'reconnaissent'], imparfaitRad: 'reconnaiss', futurRad: 'reconnaîtr', pp: 'reconnu', ps: ['reconn', 'u'], imperatif: ['reconnais', 'reconnaissons', 'reconnaissez'] },
  paraitre: { inf: 'paraître', present: ['parais', 'parais', 'paraît', 'paraissons', 'paraissez', 'paraissent'], imparfaitRad: 'paraiss', futurRad: 'paraîtr', pp: 'paru', ps: ['par', 'u'], imperatif: null },
  apparaitre: { inf: 'apparaître', present: ['apparais', 'apparais', 'apparaît', 'apparaissons', 'apparaissez', 'apparaissent'], imparfaitRad: 'apparaiss', futurRad: 'apparaîtr', pp: 'apparu', ps: ['appar', 'u'], imperatif: null },
  disparaitre: { inf: 'disparaître', present: ['disparais', 'disparais', 'disparaît', 'disparaissons', 'disparaissez', 'disparaissent'], imparfaitRad: 'disparaiss', futurRad: 'disparaîtr', pp: 'disparu', ps: ['dispar', 'u'], imperatif: null },
  rompre: { inf: 'rompre', present: ['romps', 'romps', 'rompt', 'rompons', 'rompez', 'rompent'], imparfaitRad: 'romp', futurRad: 'rompr', pp: 'rompu', ps: ['romp', 'i'], imperatif: null },
  interrompre: { inf: 'interrompre', present: ['interromps', 'interromps', 'interrompt', 'interrompons', 'interrompez', 'interrompent'], imparfaitRad: 'interromp', futurRad: 'interrompr', pp: 'interrompu', ps: ['interromp', 'i'], imperatif: null },
  apercevoir: { inf: 'apercevoir', present: ['aperçois', 'aperçois', 'aperçoit', 'apercevons', 'apercevez', 'aperçoivent'], imparfaitRad: 'apercev', futurRad: 'apercevr', pp: 'aperçu', ps: ['aperç', 'u'], imperatif: null },
  decevoir: { inf: 'décevoir', present: ['déçois', 'déçois', 'déçoit', 'décevons', 'décevez', 'déçoivent'], imparfaitRad: 'décev', futurRad: 'décevr', pp: 'déçu', ps: ['déç', 'u'], imperatif: null },
  prevoir: { inf: 'prévoir', present: ['prévois', 'prévois', 'prévoit', 'prévoyons', 'prévoyez', 'prévoient'], imparfaitRad: 'prévoy', futurRad: 'prévoir', pp: 'prévu', ps: ['prév', 'i'], imperatif: ['prévois', 'prévoyons', 'prévoyez'] },
  revoir: { inf: 'revoir', present: ['revois', 'revois', 'revoit', 'revoyons', 'revoyez', 'revoient'], imparfaitRad: 'revoy', futurRad: 'reverr', pp: 'revu', ps: ['rev', 'i'], imperatif: ['revois', 'revoyons', 'revoyez'] },
  interdire: { inf: 'interdire', present: ['interdis', 'interdis', 'interdit', 'interdisons', 'interdisez', 'interdisent'], imparfaitRad: 'interdis', futurRad: 'interdir', pp: 'interdit', ps: ['interd', 'i'], imperatif: null },
  predire: { inf: 'prédire', present: ['prédis', 'prédis', 'prédit', 'prédisons', 'prédisez', 'prédisent'], imparfaitRad: 'prédis', futurRad: 'prédir', pp: 'prédit', ps: ['préd', 'i'], imperatif: null },
  decrire: { inf: 'décrire', present: ['décris', 'décris', 'décrit', 'décrivons', 'décrivez', 'décrivent'], imparfaitRad: 'décriv', futurRad: 'décrir', pp: 'décrit', ps: ['décriv', 'i'], imperatif: ['décris', 'décrivons', 'décrivez'] },
  inscrire: { inf: 'inscrire', present: ['inscris', 'inscris', 'inscrit', 'inscrivons', 'inscrivez', 'inscrivent'], imparfaitRad: 'inscriv', futurRad: 'inscrir', pp: 'inscrit', ps: ['inscriv', 'i'], imperatif: ['inscris', 'inscrivons', 'inscrivez'] },
  relire: { inf: 'relire', present: ['relis', 'relis', 'relit', 'relisons', 'relisez', 'relisent'], imparfaitRad: 'relis', futurRad: 'relir', pp: 'relu', ps: ['rel', 'u'], imperatif: ['relis', 'relisons', 'relisez'] },
  elire: { inf: 'élire', present: ['élis', 'élis', 'élit', 'élisons', 'élisez', 'élisent'], imparfaitRad: 'élis', futurRad: 'élir', pp: 'élu', ps: ['él', 'u'], imperatif: null },
  parcourir: { inf: 'parcourir', present: ['parcours', 'parcours', 'parcourt', 'parcourons', 'parcourez', 'parcourent'], imparfaitRad: 'parcour', futurRad: 'parcourr', pp: 'parcouru', ps: ['parcour', 'u'], imperatif: ['parcours', 'parcourons', 'parcourez'] },
  secourir: { inf: 'secourir', present: ['secours', 'secours', 'secourt', 'secourons', 'secourez', 'secourent'], imparfaitRad: 'secour', futurRad: 'secourr', pp: 'secouru', ps: ['secour', 'u'], imperatif: ['secours', 'secourons', 'secourez'] },
  refaire: { inf: 'refaire', present: ['refais', 'refais', 'refait', 'refaisons', 'refaites', 'refont'], imparfaitRad: 'refais', futurRad: 'refer', pp: 'refait', ps: ['ref', 'i'], imperatif: ['refais', 'refaisons', 'refaites'], subj: ['refasse', 'refasses', 'refasse', 'refassions', 'refassiez', 'refassent'] },
  defaire: { inf: 'défaire', present: ['défais', 'défais', 'défait', 'défaisons', 'défaites', 'défont'], imparfaitRad: 'défais', futurRad: 'défer', pp: 'défait', ps: ['déf', 'i'], imperatif: ['défais', 'défaisons', 'défaites'], subj: ['défasse', 'défasses', 'défasse', 'défassions', 'défassiez', 'défassent'] },
  obtenir: { inf: 'obtenir', present: ['obtiens', 'obtiens', 'obtient', 'obtenons', 'obtenez', 'obtiennent'], imparfaitRad: 'obten', futurRad: 'obtiendr', pp: 'obtenu', ps: ['obt', 'in'], imperatif: null },
  retenir: { inf: 'retenir', present: ['retiens', 'retiens', 'retient', 'retenons', 'retenez', 'retiennent'], imparfaitRad: 'reten', futurRad: 'retiendr', pp: 'retenu', ps: ['ret', 'in'], imperatif: ['retiens', 'retenons', 'retenez'] },
  appartenir: { inf: 'appartenir', present: ['appartiens', 'appartiens', 'appartient', 'appartenons', 'appartenez', 'appartiennent'], imparfaitRad: 'apparten', futurRad: 'appartiendr', pp: 'appartenu', ps: ['appart', 'in'], imperatif: null },
  soutenir: { inf: 'soutenir', present: ['soutiens', 'soutiens', 'soutient', 'soutenons', 'soutenez', 'soutiennent'], imparfaitRad: 'souten', futurRad: 'soutiendr', pp: 'soutenu', ps: ['sout', 'in'], imperatif: ['soutiens', 'soutenons', 'soutenez'] },
  prevenir: { inf: 'prévenir', present: ['préviens', 'préviens', 'prévient', 'prévenons', 'prévenez', 'préviennent'], imparfaitRad: 'préven', futurRad: 'préviendr', pp: 'prévenu', ps: ['prév', 'in'], imperatif: ['préviens', 'prévenons', 'prévenez'] },
  parvenir: { inf: 'parvenir', present: ['parviens', 'parviens', 'parvient', 'parvenons', 'parvenez', 'parviennent'], imparfaitRad: 'parven', futurRad: 'parviendr', pp: 'parvenu', ps: ['parv', 'in'], imperatif: null },
  apprendre: { inf: 'apprendre', present: ['apprends', 'apprends', 'apprend', 'apprenons', 'apprenez', 'apprennent'], imparfaitRad: 'appren', futurRad: 'apprendr', pp: 'appris', ps: ['appr', 'i'], imperatif: ['apprends', 'apprenons', 'apprenez'] },
  comprendre: { inf: 'comprendre', present: ['comprends', 'comprends', 'comprend', 'comprenons', 'comprenez', 'comprennent'], imparfaitRad: 'compren', futurRad: 'comprendr', pp: 'compris', ps: ['compr', 'i'], imperatif: null },
  surprendre: { inf: 'surprendre', present: ['surprends', 'surprends', 'surprend', 'surprenons', 'surprenez', 'surprennent'], imparfaitRad: 'surpren', futurRad: 'surprendr', pp: 'surpris', ps: ['surpr', 'i'], imperatif: null },
  reprendre: { inf: 'reprendre', present: ['reprends', 'reprends', 'reprend', 'reprenons', 'reprenez', 'reprennent'], imparfaitRad: 'repren', futurRad: 'reprendr', pp: 'repris', ps: ['repr', 'i'], imperatif: ['reprends', 'reprenons', 'reprenez'] },
  permettre: { inf: 'permettre', present: ['permets', 'permets', 'permet', 'permettons', 'permettez', 'permettent'], imparfaitRad: 'permett', futurRad: 'permettr', pp: 'permis', ps: ['perm', 'i'], imperatif: null },
  promettre: { inf: 'promettre', present: ['promets', 'promets', 'promet', 'promettons', 'promettez', 'promettent'], imparfaitRad: 'promett', futurRad: 'promettr', pp: 'promis', ps: ['prom', 'i'], imperatif: ['promets', 'promettons', 'promettez'] },
  remettre: { inf: 'remettre', present: ['remets', 'remets', 'remet', 'remettons', 'remettez', 'remettent'], imparfaitRad: 'remett', futurRad: 'remettr', pp: 'remis', ps: ['rem', 'i'], imperatif: ['remets', 'remettons', 'remettez'] },
};

// Verbes en -dre (et -tre) réguliers du 3e groupe : je vends, il vend, nous vendons ; vendu ; il vendit.
function verbeDre(inf, { imperatif = true } = {}) {
  const r = inf.slice(0, -2);
  return { inf, present: [r + 's', r + 's', r, r + 'ons', r + 'ez', r + 'ent'], imparfaitRad: r, futurRad: r + 'r', pp: r + 'u', ps: [r, 'i'], imperatif: imperatif ? [r + 's', r + 'ons', r + 'ez'] : null };
}
for (const [inf, opts] of [
  ['vendre'], ['attendre'], ['entendre', { imperatif: false }], ['répondre'], ['rendre'], ['perdre', { imperatif: false }],
  ['descendre'], ['défendre'], ['mordre', { imperatif: false }], ['tordre'], ['fondre', { imperatif: false }], ['tondre'],
  ['étendre'], ['confondre', { imperatif: false }], ['suspendre'], ['pondre', { imperatif: false }], ['correspondre', { imperatif: false }],
]) {
  IRREGULIERS[sansAccent(inf)] = verbeDre(inf, opts);
}

// Verbes irréguliers de la liste par défaut (modèles fr-m-conjugaison-*) : inchangée.
const IRREGULIERS_BASE = ['etre', 'avoir', 'aller', 'faire', 'pouvoir', 'vouloir', 'prendre', 'venir', 'dire', 'voir', 'partir'];

const TERM_IMPARFAIT = ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'];
const TERM_FUTUR = ['ai', 'as', 'a', 'ons', 'ez', 'ont'];
const TERM_SUBJ = ['e', 'es', 'e', 'ions', 'iez', 'ent'];
const TERM_PS = {
  a: ['ai', 'as', 'a', 'âmes', 'âtes', 'èrent'],
  i: ['is', 'is', 'it', 'îmes', 'îtes', 'irent'],
  u: ['us', 'us', 'ut', 'ûmes', 'ûtes', 'urent'],
  in: ['ins', 'ins', 'int', 'înmes', 'întes', 'inrent'],
};

// Verbes en -cer / -ger : ç ou ge devant a et o (nous commençons, il mangeait).
function coller(rad, term) {
  if (/^[aoâ]/.test(term)) {
    if (rad.endsWith('c')) return rad.slice(0, -1) + 'ç' + term;
    if (rad.endsWith('g')) return rad + 'e' + term;
  }
  return rad + term;
}
// Radical(aux) « a|b » + terminaison → « a+t|b+t ».
const avec = (rads, term) => rads.split('|').map((r) => r + term).join('|');

function sansAccent(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, ''); }
export const commenceParVoyelle = (mot) => /^[aeiouyhéèêâîôûàœ]/i.test(mot);

export function estIrregulier(infinitif) { return Boolean(IRREGULIERS[sansAccent(infinitif)]); }
// Liste des infinitifs irréguliers connus du moteur.
export function verbesIrreguliers() { return Object.values(IRREGULIERS).map((v) => v.inf); }

function formesVerbe(infinitif) {
  if (IRREGULIERS[sansAccent(infinitif)]) {
    const v = IRREGULIERS[sansAccent(infinitif)];
    // Subjonctif : radical de « ils » au présent (je, tu, il, ils) et de l'imparfait (nous, vous).
    const subj = v.subj ?? [0, 1, 2, 3, 4, 5].map((i) => (i === 3 || i === 4
      ? avec(v.imparfaitRad, TERM_SUBJ[i])
      : v.present[5].split('|').map((f) => f.replace(/ent$/, '') + TERM_SUBJ[i]).join('|')));
    return {
      present: (i) => v.present[i],
      imparfait: (i) => avec(v.imparfaitRad, TERM_IMPARFAIT[i]),
      futur: (i) => avec(v.futurRad, TERM_FUTUR[i]),
      conditionnel: (i) => avec(v.futurRad, TERM_IMPARFAIT[i]),
      passe_simple: (i) => v.ps[0] + TERM_PS[v.ps[1]][i],
      imperatif: v.imperatif ? (i) => ({ 1: v.imperatif[0], 3: v.imperatif[1], 4: v.imperatif[2] })[i] : null,
      subjonctif: (i) => subj[i],
      pp: v.pp,
      ppr: v.ppr ?? avec(v.imparfaitRad, 'ant'),
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
      subjonctif: (i) => rad + TERM_SUBJ[i],
      pp: rad + 'é',
      ppr: coller(rad, 'ant'),
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
      subjonctif: (i) => rad + 'iss' + TERM_SUBJ[i],
      pp: rad + 'i',
      ppr: rad + 'issant',
    };
  }
  throw new Error(`Verbe non pris en charge : ${infinitif}`);
}

const premiere = (f) => f.split('|')[0];
export function participePasse(infinitif) { return formesVerbe(infinitif).pp; }
// Participe présent (forme de référence) ; participesPresents : toutes les formes correctes.
export function participePresent(infinitif) { return premiere(formesVerbe(infinitif).ppr); }
export function participesPresents(infinitif) { return formesVerbe(infinitif).ppr.split('|'); }
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
      const aux = IRREGULIERS.etre.present[i];
      const pluriel = i >= 3;
      const fem = personne.genre ? personne.genre === 'f' : (personne.pronom === 'elle' || personne.pronom === 'elles');
      const pp = (g) => f.pp + (g ? 'e' : '') + (pluriel && !(f.pp.endsWith('s') && !g) ? 's' : '');
      // je/tu/nous/vous : le genre n'est pas connu, on accepte masculin et féminin.
      const connu = personne.genre || ['il', 'ils', 'elle', 'elles', 'on'].includes(personne.pronom);
      const variantes = connu ? [pp(fem)] : [pp(false), pp(true)];
      return { forme: `${aux} ${variantes[0]}`, formesAcceptees: variantes.map((v) => `${aux} ${v}`) };
    }
    const forme = `${IRREGULIERS.avoir.present[i]} ${f.pp}`;
    return { forme, formesAcceptees: [forme] };
  }
  if (!f[temps]) throw new Error(`${infinitif} : pas de ${temps}`);
  const formes = f[temps](i).split('|');
  return { forme: formes[0], formesAcceptees: formes };
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
