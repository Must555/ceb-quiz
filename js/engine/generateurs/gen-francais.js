// Générateurs JS spécifiques (français). Chaque entrée : nom → fonction (modele, rng) => question | null.
// La question renvoyée doit contenir _signature (texte stable, unique par variante).
//
// Plusieurs générateurs lisent une base de faits (data/faits/fr.json, via `base` dans le modèle) :
//   fr_classes    : phrases annotées mot par mot   « {D:Le} {A:petit} {N:chat} {V:dort}. »
//   fr_fonctions  : phrases annotées par groupes    « {CP:Chaque matin}, {S:Léa} {V:prend} {CD:le bus}. »
//   fr_homophones : phrases à trou « ___ » + bonne réponse (r)
//   fr_e_er       : phrases à trou + verbe du 1er groupe (v) + forme attendue (r)
//   fr_accord_sv  : cadres de phrases avec sujets au singulier / pluriel
// Les autres (conjugaison, participe passé, accord de l'adjectif, ordre alphabétique) combinent
// des listes définies ci-dessous. `modele.formes` (liste de noms) choisit les sortes de questions.

import { conjuguer, avecPronom, commenceParVoyelle, participePasse, AUX_ETRE, TEMPS, AU_TEMPS, aImperatif } from './conjugaison.js';

const maj = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const bas = (s) => String(s).trim().toLowerCase();

// Tire n-1 distracteurs distincts (sans tenir compte des majuscules) et mélange avec la bonne réponse.
function melanger(rng, bonne, pool, n = 4) {
  const vus = new Set([bas(bonne)]);
  const d = [];
  for (const x of rng.shuffle(pool)) {
    if (vus.has(bas(x))) continue;
    vus.add(bas(x)); d.push(x);
    if (d.length === n - 1) break;
  }
  if (!d.length) return null;
  const choix = rng.shuffle([bonne, ...d]);
  return { choix, reponse: choix.indexOf(bonne) };
}

// Lit une phrase annotée : { texte, unites: [{ code, mot }] }.
function analyser(src) {
  const unites = [];
  let texte = '';
  let last = 0;
  const re = /\{([A-Z]+):([^{}]+)\}/g;
  let m;
  while ((m = re.exec(src))) {
    texte += src.slice(last, m.index);
    unites.push({ code: m[1], mot: m[2] });
    texte += m[2];
    last = re.lastIndex;
  }
  texte += src.slice(last);
  return { texte, unites };
}

// ───────────────────────── Classes de mots ─────────────────────────
const CLASSES = {
  N: 'nom commun', NP: 'nom propre', D: 'déterminant', A: 'adjectif', PR: 'pronom',
  V: 'verbe', ADV: 'adverbe', P: 'préposition', C: 'conjonction de coordination',
};
const UN = (code) => (code === 'P' || code === 'C' ? 'une' : 'un');
const ASTUCE_CLASSE = {
  N: 'On peut placer un déterminant devant (le, un, des…).',
  NP: 'Il commence par une majuscule et désigne une personne, un lieu ou une chose unique.',
  D: 'Il se place devant le nom et l\'introduit (le, un, mon, ce, des…).',
  A: 'Il donne une précision sur un nom et s\'accorde avec lui.',
  PR: 'Il remplace un nom ou un groupe nominal (ou désigne une personne : je, tu, nous…).',
  V: 'On peut le conjuguer à un autre temps (hier…, demain…).',
  ADV: 'Il est invariable et précise le sens d\'un verbe, d\'un adjectif ou d\'un autre adverbe.',
  P: 'Ce petit mot invariable introduit un groupe de mots (à, de, dans, sur, avec, pour, sans…).',
  C: 'Il relie deux mots, deux groupes ou deux phrases : mais, ou, et, donc, or, ni, car.',
};
const ORDRE_CLASSES = Object.keys(CLASSES);

// Mots qu'on peut interroger sans ambiguïté : une seule classe pour toutes leurs occurrences.
function motsSurs(unites) {
  const parMot = {};
  for (const u of unites) (parMot[bas(u.mot)] ??= new Set()).add(u.code);
  const vus = new Set();
  return unites.filter((u) => {
    const k = bas(u.mot);
    if (u.mot.endsWith("'") || parMot[k].size !== 1 || vus.has(k)) return false;
    vus.add(k); return true;
  });
}

function frClasses(modele, rng) {
  const it = rng.pick(modele.items);
  const { texte, unites } = analyser(it.nom);
  const surs = motsSurs(unites);
  if (!surs.length) return null;
  const forme = rng.pick(modele.formes ?? ['classe', 'lequel', 'grille', 'vrai_faux']);
  const phrase = `Dans la phrase « ${texte} »`;
  if (forme === 'classe') {
    const u = rng.pick(surs);
    const bonne = CLASSES[u.code];
    const q = melanger(rng, bonne, Object.values(CLASSES));
    return {
      _signature: `classe|${it.nom}|${u.mot}`, type: 'qcm', ...q,
      enonce: `${phrase}, quelle est la classe du mot « ${u.mot} » ?`,
      explication: `« ${u.mot} » est ${UN(u.code)} ${bonne}. ${ASTUCE_CLASSE[u.code]}`,
    };
  }
  if (forme === 'lequel') {
    const u = rng.pick(surs);
    const autres = rng.shuffle(surs.filter((x) => x.code !== u.code)).slice(0, 3);
    if (autres.length < 2) return null;
    const choix = rng.shuffle([u.mot, ...autres.map((x) => x.mot)]);
    return {
      _signature: `lequel|${it.nom}|${u.code}|${choix.map(bas).sort().join(',')}`, type: 'qcm', choix, reponse: choix.indexOf(u.mot),
      enonce: `${phrase}, quel mot est ${UN(u.code)} ${CLASSES[u.code]} ?`,
      explication: `« ${u.mot} » est ${UN(u.code)} ${CLASSES[u.code]}. ${ASTUCE_CLASSE[u.code]}`,
    };
  }
  if (forme === 'grille') {
    const pris = []; const codes = new Set();
    for (const u of rng.shuffle(surs)) {
      if (codes.has(u.code)) continue;
      codes.add(u.code); pris.push(u);
      if (pris.length === 4) break;
    }
    if (pris.length < 3) return null;
    const cols = ORDRE_CLASSES.filter((c) => codes.has(c));
    return {
      _signature: `grille|${it.nom}|${pris.map((u) => u.mot).sort().join(',')}`, type: 'grille',
      lignes: pris.map((u) => `« ${u.mot} »`), colonnes: cols.map((c) => CLASSES[c]),
      reponse: pris.map((u) => cols.indexOf(u.code)), points: pris.length,
      enonce: `${phrase}, indique la classe de chaque mot.`,
      explication: pris.map((u) => `« ${u.mot} » : ${CLASSES[u.code]}`).join(' ; ') + '.',
    };
  }
  // vrai_faux
  const u = rng.pick(surs);
  const vrai = rng.next() < 0.5;
  const code = vrai ? u.code : rng.pick(ORDRE_CLASSES.filter((c) => c !== u.code));
  return {
    _signature: `vf|${it.nom}|${u.mot}|${code}`, type: 'vrai_faux', reponse: vrai,
    enonce: `Vrai ou faux ? ${phrase}, le mot « ${u.mot} » est ${UN(code)} ${CLASSES[code]}.`,
    explication: `${vrai ? 'Vrai' : 'Faux'} : « ${u.mot} » est ${UN(u.code)} ${CLASSES[u.code]}. ${ASTUCE_CLASSE[u.code]}`,
  };
}

// ───────────────────────── Fonctions dans la phrase ─────────────────────────
const FONCTIONS = {
  S: 'sujet', CD: 'complément direct du verbe', CI: 'complément indirect du verbe',
  CP: 'complément de phrase', AT: 'attribut du sujet',
};
const LE_FONCTION = {
  CD: 'le complément direct du verbe', CI: 'le complément indirect du verbe',
  CP: 'le complément de phrase', AT: 'l\'attribut du sujet',
};
const ORDRE_FONCTIONS = Object.keys(FONCTIONS);

function explicationFonction(code, g, verbe, sujet) {
  switch (code) {
    case 'S': return `« ${g} » est le sujet du verbe « ${verbe} » : c'est lui qui commande l'accord du verbe. On peut l'encadrer par « c'est … qui » ou « ce sont … qui ».`;
    case 'CD': return `« ${g} » est un complément direct du verbe « ${verbe} » : il est relié au verbe sans préposition et on ne peut pas le déplacer.`;
    case 'CI': return `« ${g} » est un complément indirect du verbe « ${verbe} » : il est relié au verbe par une préposition (à, de…) et on ne peut pas le déplacer.`;
    case 'CP': return `« ${g} » est un complément de phrase : on peut le déplacer (en début ou en fin de phrase) et même le supprimer.`;
    case 'AT': return `« ${g} » est un attribut du sujet : il suit un verbe comme être, sembler, devenir, paraître ou rester et dit comment est le sujet « ${sujet} ».`;
    default: return '';
  }
}

function frFonctions(modele, rng) {
  const it = rng.pick(modele.items);
  const { texte, unites } = analyser(it.nom);
  const verbes = unites.filter((u) => u.code === 'V');
  if (verbes.length !== 1) return null;
  const verbe = verbes[0].mot;
  const groupes = unites.filter((u) => u.code !== 'V');
  if (new Set(groupes.map((g) => bas(g.mot))).size !== groupes.length) return null;
  const sujets = groupes.filter((u) => u.code === 'S');
  const sujet = sujets.length === 1 ? sujets[0].mot : null;
  const forme = rng.pick(modele.formes ?? ['fonction', 'trouver', 'grille']);
  const phrase = `Dans la phrase « ${texte} »`;

  if (forme === 'sujet') {
    if (!sujet || groupes.length < 2) return null;
    const autres = rng.shuffle(groupes.filter((g) => g.code !== 'S')).slice(0, 3).map((g) => g.mot);
    const choix = rng.shuffle([sujet, ...autres]);
    const iS = unites.findIndex((u) => u.code === 'S');
    const iV = unites.findIndex((u) => u.code === 'V');
    let note = '';
    if (iS > iV) note = ' Attention : ici, le sujet est placé après le verbe.';
    else if (iV - iS > 1) note = ' Attention : le sujet est séparé du verbe par d\'autres mots.';
    return {
      _signature: `sujet|${it.nom}`, type: 'qcm', choix, reponse: choix.indexOf(sujet),
      enonce: `${phrase}, quel est le sujet du verbe « ${verbe} » ?`,
      explication: `Le sujet du verbe « ${verbe} » est « ${sujet} ». On peut l'encadrer par « c'est … qui » ou « ce sont … qui ».${note}${it.note ? ' ' + it.note : ''}`,
    };
  }
  if (forme === 'fonction') {
    const g = rng.pick(groupes);
    const bonne = FONCTIONS[g.code];
    const q = melanger(rng, bonne, Object.values(FONCTIONS));
    return {
      _signature: `fonction|${it.nom}|${g.mot}`, type: 'qcm', ...q,
      enonce: `${phrase}, quelle est la fonction du groupe « ${g.mot} » ?`,
      explication: explicationFonction(g.code, g.mot, verbe, sujet),
    };
  }
  if (forme === 'trouver') {
    const codes = ['CD', 'CI', 'CP', 'AT'].filter((c) => groupes.filter((g) => g.code === c).length === 1);
    if (!codes.length || groupes.length < 2) return null;
    const code = rng.pick(codes);
    const g = groupes.find((x) => x.code === code);
    const autres = rng.shuffle(groupes.filter((x) => x !== g)).slice(0, 3).map((x) => x.mot);
    const choix = rng.shuffle([g.mot, ...autres]);
    return {
      _signature: `trouver|${it.nom}|${code}`, type: 'qcm', choix, reponse: choix.indexOf(g.mot),
      enonce: `${phrase}, quel groupe est ${LE_FONCTION[code]} ?`,
      explication: explicationFonction(code, g.mot, verbe, sujet),
    };
  }
  // grille
  const lignes = rng.shuffle(groupes).slice(0, 4);
  const codes = new Set(lignes.map((g) => g.code));
  if (lignes.length < 2 || codes.size < 2) return null;
  const cols = ORDRE_FONCTIONS.filter((c) => codes.has(c));
  return {
    _signature: `grille|${it.nom}|${lignes.map((g) => g.mot).sort().join(',')}`, type: 'grille',
    lignes: lignes.map((g) => `« ${g.mot} »`), colonnes: cols.map((c) => FONCTIONS[c]),
    reponse: lignes.map((g) => cols.indexOf(g.code)), points: lignes.length,
    enonce: `${phrase}, indique la fonction de chaque groupe (le verbe est « ${verbe} »).`,
    explication: lignes.map((g) => `« ${g.mot} » : ${FONCTIONS[g.code]}`).join(' ; ') + '.',
  };
}

// ───────────────────────── Homophones grammaticaux ─────────────────────────
const GROUPES_HOMOPHONES = [
  ['a', 'à'], ['et', 'est'], ['on', 'ont'], ['son', 'sont'], ['ces', 'ses', "c'est", "s'est"],
  ['ou', 'où'], ['ce', 'se'], ['la', 'là', "l'a"], ['mes', 'mais', 'met', 'mets'], ['leur', 'leurs'],
  ['peu', 'peut', 'peux'], ['sans', "s'en", 'cent', 'sang'], ['ni', "n'y"],
  ['quel', 'quelle', 'quels', 'quelles', "qu'elle", "qu'elles"], ['ma', "m'a"], ['ta', "t'a"], ['sa', 'ça'], ['mon', "m'ont"],
];
const REGLES_HOMOPHONES = {
  a: '« a » est le verbe avoir : on peut le remplacer par « avait ».',
  à: '« à » est une préposition : on ne peut pas le remplacer par « avait ».',
  et: '« et » relie deux mots ou deux groupes : on peut le remplacer par « et puis ».',
  est: '« est » est le verbe être : on peut le remplacer par « était ».',
  on: '« on » est un pronom sujet : on peut le remplacer par « il ».',
  ont: '« ont » est le verbe avoir : on peut le remplacer par « avaient ».',
  son: '« son » est un déterminant : on peut le remplacer par « mon ».',
  sont: '« sont » est le verbe être : on peut le remplacer par « étaient ».',
  ces: '« ces » est un déterminant qui montre : on peut dire « ces …-là ».',
  ses: '« ses » est un déterminant qui indique à qui c\'est : on peut dire « les siens » ou « les siennes ».',
  "c'est": '« c\'est » veut dire « cela est » : on peut le remplacer par « c\'était ».',
  "s'est": '« s\'est » se place devant le participe passé d\'un verbe pronominal (se laver → il s\'est lavé) : avec « je », on dirait « je me suis… ».',
  ou: '« ou » exprime un choix : on peut le remplacer par « ou bien ».',
  où: '« où » indique un lieu (ou un moment) : on ne peut pas le remplacer par « ou bien ».',
  ce: '« ce » est un déterminant (ce chien) ou un pronom (ce que, ce qui) : on peut dire « ce …-là » ou « cela ».',
  se: '« se » fait partie d\'un verbe pronominal (se laver, se cacher) : avec « je », on dirait « me ».',
  la: '« la » est un déterminant (la table) ou un pronom devant un verbe (je la vois) : on peut le remplacer par « une » ou par « le ».',
  là: '« là » indique un lieu : on peut le remplacer par « ici ».',
  "l'a": '« l\'a » = « l\' » + « a » (verbe avoir) : on peut le remplacer par « l\'avait ».',
  mes: '« mes » est un déterminant : on peut le remplacer par « tes » (les miens, les miennes).',
  mais: '« mais » exprime une opposition : c\'est une conjonction de coordination.',
  met: '« met » est le verbe mettre avec il, elle ou on : on peut dire « mettait ».',
  mets: '« mets » est le verbe mettre avec je ou tu (je mets, tu mets) : on peut dire « mettais ».',
  leurs: '« leurs » est un déterminant devant un nom au pluriel : il prend un -s.',
  peu: '« peu » est un adverbe, le contraire de « beaucoup ».',
  peut: '« peut » est le verbe pouvoir avec il, elle ou on : on peut dire « pouvait ».',
  peux: '« peux » est le verbe pouvoir avec je ou tu : on peut dire « pouvais ».',
  sans: '« sans » est une préposition, le contraire de « avec ».',
  "s'en": '« s\'en » = « se » + « en », devant un verbe (s\'en aller, s\'en souvenir).',
  cent: '« cent » est un nombre (100).',
  sang: '« sang » est un nom : le liquide rouge qui circule dans le corps.',
  ni: '« ni » relie des éléments dans une phrase négative (ni … ni …).',
  "n'y": '« n\'y » = « ne » + « y » (y remplace un lieu ou une chose) : on peut dire « ne … pas ».',
  "qu'elle": '« qu\'elle » = « que » + « elle » : on peut le remplacer par « qu\'il ».',
  "qu'elles": '« qu\'elles » = « que » + « elles » : on peut le remplacer par « qu\'ils ».',
  ma: '« ma » est un déterminant : on peut le remplacer par « ta » ou « sa ».',
  "m'a": '« m\'a » = « me » + « a » (verbe avoir) : on peut le remplacer par « m\'avait ».',
  ta: '« ta » est un déterminant : on peut le remplacer par « ma » ou « sa ».',
  "t'a": '« t\'a » = « te » + « a » (verbe avoir) : on peut le remplacer par « t\'avait ».',
  sa: '« sa » est un déterminant : on peut le remplacer par « ma » ou « ta ».',
  ça: '« ça » est un pronom : on peut le remplacer par « cela ».',
  mon: '« mon » est un déterminant : on peut le remplacer par « ton » ou « son ».',
  "m'ont": '« m\'ont » = « me » + « ont » (verbe avoir) : on peut le remplacer par « m\'avaient ».',
};
const QUEL = '« quel » est un déterminant qui s\'accorde avec le nom : quel (masculin singulier), quelle (féminin singulier), quels (masculin pluriel), quelles (féminin pluriel).';
function regleHomophone(it) {
  const r = it.r;
  if (r === 'leur') return it.cas === 'pronom'
    ? '« leur » placé devant un verbe est un pronom (au singulier, on dirait « lui ») : il ne prend jamais de -s.'
    : '« leur » est un déterminant devant un nom au singulier : pas de -s.';
  if (/^quel/.test(r)) return QUEL;
  return REGLES_HOMOPHONES[r];
}
const groupeHomophone = (r) => GROUPES_HOMOPHONES.find((g) => g.includes(r));
const completer = (phrase, mot) => (phrase.startsWith('___') ? maj(mot) + phrase.slice(3) : phrase.replace('___', mot));

function frHomophones(modele, rng) {
  const forme = rng.pick(modele.formes ?? ['choix', 'choix', 'choix', 'grille']);
  if (forme === 'grille') {
    const g = rng.pick(GROUPES_HOMOPHONES.filter((x) => x.length <= 4));
    const items = modele.items.filter((it) => g.includes(it.r));
    const pris = rng.shuffle(items).slice(0, 4);
    if (pris.length < 3 || new Set(pris.map((it) => it.r)).size < 2) return null;
    const regles = [];
    for (const it of pris) { const r = regleHomophone(it); if (!regles.includes(r)) regles.push(r); }
    return {
      _signature: `grille|${pris.map((it) => it.nom).sort().join('|')}`, type: 'grille',
      lignes: pris.map((it) => it.nom), colonnes: g, reponse: pris.map((it) => g.indexOf(it.r)), points: pris.length,
      enonce: 'Quel mot complète chaque phrase ?',
      explication: `${pris.map((it) => completer(it.nom, it.r)).join(' ')} ${regles.join(' ')}`,
    };
  }
  const it = rng.pick(modele.items);
  const g = groupeHomophone(it.r);
  if (!g) throw new Error(`Homophone inconnu : ${it.r}`);
  const debut = it.nom.startsWith('___');
  const aff = (m) => (debut ? maj(m) : m);
  const q = melanger(rng, aff(it.r), g.map(aff), Math.min(4, g.length));
  return {
    _signature: `choix|${it.nom}`, type: 'qcm', ...q,
    enonce: `Complète avec le bon mot : « ${it.nom} »`,
    explication: `${completer(it.nom, it.r)} ${regleHomophone(it)}${it.note ? ' ' + it.note : ''}`,
  };
}

// ───────────────────────── -é / -er / -ez / -ait ─────────────────────────
function frEEr(modele, rng) {
  const it = rng.pick(modele.items);
  const v = it.v;
  const pp = participePasse(v);
  const f = {
    er: v, e: pp,
    ez: conjuguer(v, 'present', { pronom: 'vous', idx: 4 }).forme,
    ait: conjuguer(v, 'imparfait', { pronom: 'il', idx: 2 }).forme,
    ais: conjuguer(v, 'imparfait', { pronom: 'je', idx: 0 }).forme,
  };
  let sorte;
  if (it.r === f.er) sorte = 'er';
  else if (it.r === f.ez) sorte = 'ez';
  else if (it.r === f.ait) sorte = 'ait';
  else if (it.r === f.ais) sorte = 'ais';
  else if (it.r.startsWith(pp)) sorte = 'e';
  else throw new Error(`fr_e_er : forme inattendue ${it.r} (${v})`);
  const choix = rng.shuffle([f.er, sorte === 'e' ? it.r : f.e, f.ez, sorte === 'ais' ? f.ais : f.ait]);
  const astuces = {
    er: 'Après une préposition (à, de, pour, sans…) ou après un verbe conjugué, on écrit l\'infinitif en -er. Astuce : remplace par « vendre » ; si ça marche, c\'est -er.',
    e: 'Après l\'auxiliaire avoir ou être, ou employé comme un adjectif, c\'est le participe passé en -é. Astuce : remplace par « vendu » ; si ça marche, c\'est -é.',
    ez: 'Avec le sujet « vous », le verbe se termine par -ez.',
    ait: 'À l\'imparfait, avec il, elle ou on, le verbe se termine par -ait.',
    ais: 'À l\'imparfait, avec je ou tu, le verbe se termine par -ais.',
  };
  return {
    _signature: it.nom, type: 'qcm', choix, reponse: choix.indexOf(it.r),
    enonce: `Complète avec la bonne forme du verbe « ${v} » : « ${it.nom} »`,
    explication: `${completer(it.nom, it.r)} ${astuces[sorte]}${it.note ? ' ' + it.note : ''}`,
  };
}

// ───────────────────────── Accord sujet-verbe ─────────────────────────
const NOTES_SV = {
  loin: 'Le sujet est séparé du verbe : cherche qui fait l\'action, pas le mot le plus proche.',
  inv: 'Attention : ici, le sujet est placé après le verbe.',
  qui: '« qui » reprend le nom placé juste avant lui : le verbe s\'accorde avec ce nom.',
  pron: 'Le petit pronom placé devant le verbe (le, la, les, leur, lui) n\'est jamais le sujet.',
  cn: 'Le groupe qui complète le nom (de…, du…, des…) ne commande pas l\'accord : c\'est le noyau du sujet qui compte.',
};
function frAccordSV(modele, rng) {
  const it = rng.pick(modele.items);
  const [s, nb] = rng.pick(it.sujets);
  const bonne = nb === 'p' ? it.v[1] : it.v[0];
  const phrase = maj(it.nom.replace('{S}', s).replace('{V}', '…'));
  const choix = rng.shuffle([it.v[0], it.v[1], ...(it.faux ?? [])]);
  return {
    _signature: `${it.nom}|${s}`, type: 'qcm', choix, reponse: choix.indexOf(bonne),
    enonce: `Choisis la bonne forme du verbe « ${it.inf} » au présent : « ${phrase} »`,
    explication: it.k === 'qui'
      ? `« qui » reprend « ${s} », ${nb === 'p' ? 'au pluriel' : 'au singulier'} : on écrit « ${bonne} ». ${NOTES_SV.qui}`
      : `Le sujet est « ${s} », ${nb === 'p' ? 'au pluriel' : 'au singulier'} : on écrit « ${bonne} ». ${NOTES_SV[it.k] ?? ''}`.trim(),
  };
}

// ───────────────────────── Participe passé (être / avoir) ─────────────────────────
const SUJETS_PP = [
  ['Léa', 'f', 's'], ['Tom', 'm', 's'], ['ma tante', 'f', 's'], ['mon oncle', 'm', 's'], ['Mamie', 'f', 's'],
  ['Papi', 'm', 's'], ['la voisine', 'f', 's'], ['le facteur', 'm', 's'], ['Yasmine', 'f', 's'], ['Mehdi', 'm', 's'],
  ['Emma et Zoé', 'f', 'p'], ['Noah et Adam', 'm', 'p'], ['Inès et Lucas', 'm', 'p', true], ['mes cousines', 'f', 'p'],
  ['les garçons', 'm', 'p'], ['Nora et sa sœur', 'f', 'p'], ['Chloé et Samuel', 'm', 'p', true], ['les filles', 'f', 'p'],
  ['les joueuses', 'f', 'p'], ['Victor et Elias', 'm', 'p'],
];
const VERBES_PP = [
  ['aller', 'à la piscine'], ['partir', 'en vacances'], ['arriver', 'en retard'], ['venir', 'à la fête'],
  ['tomber', 'dans la boue'], ['rester', 'à la maison'], ['sortir', 'du magasin'], ['revenir', 'de l\'école'],
  ['entrer', 'dans la classe'],
  ['manger', 'une glace'], ['finir', 'le puzzle'], ['prendre', 'le bus'], ['faire', 'un gâteau'], ['dire', 'la vérité'],
  ['voir', 'un film'], ['mettre', 'un pull'], ['lire', 'un roman'], ['écrire', 'une lettre'], ['choisir', 'un livre'],
  ['ranger', 'la classe'], ['gagner', 'le match'], ['réussir', 'le test'],
];
const GENRE_NB = { fs: 'féminin singulier', ms: 'masculin singulier', fp: 'féminin pluriel', mp: 'masculin pluriel' };
function frParticipe(modele, rng) {
  const [s, g, n, mixte] = rng.pick(SUJETS_PP);
  const [v, c] = rng.pick(VERBES_PP);
  const pp = participePasse(v);
  const etre = AUX_ETRE.has(v);
  const aux = etre ? (n === 'p' ? 'sont' : 'est') : (n === 'p' ? 'ont' : 'a');
  const accord = pp + (g === 'f' ? 'e' : '') + (n === 'p' && !(g === 'm' && pp.endsWith('s')) ? 's' : '');
  const bonne = etre ? accord : pp;
  const formes = [pp, pp + 'e', pp.endsWith('s') ? pp : pp + 's', pp + 'es'];
  const choix = rng.shuffle([...new Set(formes)]);
  const explication = etre
    ? `Avec l'auxiliaire être, le participe passé s'accorde avec le sujet « ${s} » (${GENRE_NB[g + n]}${mixte ? ' : un garçon et une fille ensemble → masculin' : ''}) : « ${bonne} ».`
    : `Avec l'auxiliaire avoir, le participe passé ne s'accorde pas avec le sujet : « ${bonne} ».`;
  return {
    _signature: `${s}|${v}`, type: 'qcm', choix, reponse: choix.indexOf(bonne),
    enonce: `Complète avec le participe passé du verbe « ${v} » : « Hier, ${s} ${aux} … ${c}. »`,
    explication,
  };
}

// ───────────────────────── Accord de l'adjectif ─────────────────────────
// [groupe nominal, sujet pour la phrase attributive, genre, nombre, catégorie]
// catégories : v = vêtement, o = objet, g = grand objet, p = personne, a = animal
const NOMS_ADJ = [
  ['une robe', 'Ma robe', 'f', 's', 'v'], ['des chaussures', 'Mes chaussures', 'f', 'p', 'v'], ['un pull', 'Ton pull', 'm', 's', 'v'],
  ['des chaussettes', 'Tes chaussettes', 'f', 'p', 'v'], ['un manteau', 'Le manteau de Tom', 'm', 's', 'v'], ['des gants', 'Les gants de Mamie', 'm', 'p', 'v'],
  ['une écharpe', 'L\'écharpe de Léa', 'f', 's', 'v'], ['des bottes', 'Les bottes de Noé', 'f', 'p', 'v'], ['une chemise', 'Sa chemise', 'f', 's', 'v'],
  ['des pantalons', 'Ces pantalons', 'm', 'p', 'v'], ['une veste', 'La veste de Papa', 'f', 's', 'v'], ['des bonnets', 'Nos bonnets', 'm', 'p', 'v'],
  ['un cartable', 'Mon cartable', 'm', 's', 'o'], ['une trousse', 'Ta trousse', 'f', 's', 'o'], ['des crayons', 'Mes crayons', 'm', 'p', 'o'],
  ['une valise', 'La valise', 'f', 's', 'o'], ['des sacs', 'Les sacs', 'm', 'p', 'o'], ['des boîtes', 'Ces boîtes', 'f', 'p', 'o'],
  ['un vélo', 'Le vélo de Sami', 'm', 's', 'g'], ['des voitures', 'Les voitures', 'f', 'p', 'g'], ['une maison', 'Cette maison', 'f', 's', 'g'],
  ['des volets', 'Les volets', 'm', 'p', 'g'], ['une porte', 'La porte du garage', 'f', 's', 'g'], ['des murs', 'Les murs de la classe', 'm', 'p', 'g'],
  ['une fillette', 'La fillette', 'f', 's', 'p'], ['des garçons', 'Les garçons', 'm', 'p', 'p'], ['une chanteuse', 'La chanteuse', 'f', 's', 'p'],
  ['des joueuses', 'Les joueuses', 'f', 'p', 'p'], ['un pompier', 'Le pompier', 'm', 's', 'p'], ['des infirmières', 'Les infirmières', 'f', 'p', 'p'],
  ['un voisin', 'Notre voisin', 'm', 's', 'p'], ['des cousines', 'Mes cousines', 'f', 'p', 'p'], ['une élève', 'Cette élève', 'f', 's', 'p'],
  ['des frères', 'Ses frères', 'm', 'p', 'p'], ['une grand-mère', 'Ma grand-mère', 'f', 's', 'p'], ['des garçons', 'Ces garçons', 'm', 'p', 'p'],
  ['un chaton', 'Le chaton', 'm', 's', 'a'], ['des chiennes', 'Les chiennes', 'f', 'p', 'a'], ['une jument', 'La jument', 'f', 's', 'a'],
  ['des lapins', 'Les lapins', 'm', 'p', 'a'], ['une chatte', 'Ma chatte', 'f', 's', 'a'], ['des poneys', 'Les poneys', 'm', 'p', 'a'],
].filter((n, i, t) => t.findIndex((x) => x[0] === n[0]) === i);
// [masc. sing., fém. sing., masc. plur., fém. plur.], catégories de noms
const ADJ = [
  [['vert', 'verte', 'verts', 'vertes'], 'vog'], [['noir', 'noire', 'noirs', 'noires'], 'vog'], [['gris', 'grise', 'gris', 'grises'], 'vog'],
  [['blanc', 'blanche', 'blancs', 'blanches'], 'vog'], [['violet', 'violette', 'violets', 'violettes'], 'vog'], [['bleu', 'bleue', 'bleus', 'bleues'], 'vog'],
  [['neuf', 'neuve', 'neufs', 'neuves'], 'vog'], [['lourd', 'lourde', 'lourds', 'lourdes'], 'o'], [['léger', 'légère', 'légers', 'légères'], 'vo'],
  [['mouillé', 'mouillée', 'mouillés', 'mouillées'], 'vo'], [['long', 'longue', 'longs', 'longues'], 'v'], [['ancien', 'ancienne', 'anciens', 'anciennes'], 'g'],
  [['sec', 'sèche', 'secs', 'sèches'], 'v'], [['propre', 'propre', 'propres', 'propres'], 'vg'], [['abîmé', 'abîmée', 'abîmés', 'abîmées'], 'vog'],
  [['content', 'contente', 'contents', 'contentes'], 'pa'], [['heureux', 'heureuse', 'heureux', 'heureuses'], 'pa'], [['fatigué', 'fatiguée', 'fatigués', 'fatiguées'], 'pa'],
  [['sportif', 'sportive', 'sportifs', 'sportives'], 'p'], [['curieux', 'curieuse', 'curieux', 'curieuses'], 'pa'], [['gentil', 'gentille', 'gentils', 'gentilles'], 'pa'],
  [['joyeux', 'joyeuse', 'joyeux', 'joyeuses'], 'p'], [['courageux', 'courageuse', 'courageux', 'courageuses'], 'p'], [['inquiet', 'inquiète', 'inquiets', 'inquiètes'], 'pa'],
  [['fier', 'fière', 'fiers', 'fières'], 'p'], [['gourmand', 'gourmande', 'gourmands', 'gourmandes'], 'pa'], [['prudent', 'prudente', 'prudents', 'prudentes'], 'p'],
  [['sérieux', 'sérieuse', 'sérieux', 'sérieuses'], 'p'], [['attentif', 'attentive', 'attentifs', 'attentives'], 'p'], [['peureux', 'peureuse', 'peureux', 'peureuses'], 'pa'],
  [['calme', 'calme', 'calmes', 'calmes'], 'pa'], [['doux', 'douce', 'doux', 'douces'], 'a'], [['joueur', 'joueuse', 'joueurs', 'joueuses'], 'a'],
];
const IDX_GN = { ms: 0, fs: 1, mp: 2, fp: 3 };
function frAccordAdj(modele, rng) {
  const forme = rng.pick(modele.formes ?? ['epithete', 'attribut', 'coord']);
  const [formes, cats] = rng.pick(ADJ);
  const noms = NOMS_ADJ.filter((n) => cats.includes(n[4]));
  const choix = rng.shuffle([...new Set(formes)]);
  const noyau = (n) => n[0].split(' ').slice(1).join(' ');
  if (forme === 'coord') {
    const a = rng.pick(noms.filter((n) => n[3] === 's'));
    const b = rng.pick(noms.filter((n) => n[3] === 's' && n !== a));
    if (!a || !b) return null;
    const g = a[2] === 'f' && b[2] === 'f' ? 'f' : 'm';
    const bonne = formes[IDX_GN[g + 'p']];
    const sujet = `${a[1]} et ${b[1].charAt(0).toLowerCase()}${b[1].slice(1)}`;
    return {
      _signature: `coord|${formes[0]}|${a[0]}|${b[0]}`, type: 'qcm', choix, reponse: choix.indexOf(bonne),
      enonce: `Accorde l'adjectif « ${formes[0]} » : « ${sujet} sont … »`,
      explication: `Le sujet « ${sujet} » est ${g === 'f' ? 'féminin pluriel (deux noms féminins)' : 'masculin pluriel (dès qu\'il y a un nom masculin, on accorde au masculin)'} : « ${bonne} ».`,
    };
  }
  const n = rng.pick(noms);
  const bonne = formes[IDX_GN[n[2] + n[3]]];
  if (forme === 'epithete') {
    return {
      _signature: `epi|${formes[0]}|${n[0]}`, type: 'qcm', choix, reponse: choix.indexOf(bonne),
      enonce: `Accorde l'adjectif « ${formes[0]} » : « ${n[0]} … »`,
      explication: `L'adjectif s'accorde avec le nom « ${noyau(n)} » (${GENRE_NB[n[2] + n[3]]}) : « ${n[0]} ${bonne} ».`,
    };
  }
  return {
    _signature: `attr|${formes[0]}|${n[0]}`, type: 'qcm', choix, reponse: choix.indexOf(bonne),
    enonce: `Accorde l'adjectif « ${formes[0]} » : « ${n[1]} ${n[3] === 'p' ? 'sont' : 'est'} … »`,
    explication: `Après le verbe être, l'adjectif (attribut du sujet) s'accorde avec le sujet « ${n[1]} » (${GENRE_NB[n[2] + n[3]]}) : « ${bonne} ».`,
  };
}

// ───────────────────────── Conjugaison en contexte ─────────────────────────
// [infinitif, complément]
const VERBES_CONJ = [
  ['chanter', 'une chanson'], ['jouer', 'au ballon'], ['regarder', 'les étoiles'], ['écouter', 'la radio'],
  ['dessiner', 'un dragon'], ['raconter', 'une blague'], ['chercher', 'un trésor'], ['marcher', 'dans la forêt'],
  ['danser', 'sur la scène'], ['aimer', 'les crêpes'], ['habiter', 'près de la gare'], ['arriver', 'à la gare'],
  ['tomber', 'dans la neige'], ['rester', 'à la maison'], ['manger', 'une tarte'], ['nager', 'dans le lac'],
  ['ranger', 'la classe'], ['voyager', 'en train'], ['partager', 'le gâteau'], ['commencer', 'un puzzle'],
  ['lancer', 'la balle'], ['placer', 'les chaises'], ['avancer', 'lentement'],
  ['finir', 'le puzzle'], ['choisir', 'un cadeau'], ['grandir', 'vite'], ['réussir', 'le test'], ['remplir', 'les verres'],
  ['obéir', 'aux règles'], ['réfléchir', 'longtemps'], ['applaudir', 'les artistes'], ['ralentir', 'dans le virage'],
  ['être', 'en retard'], ['avoir', 'de la chance'], ['aller', 'au marché'], ['faire', 'un gâteau'], ['pouvoir', 'entrer'],
  ['vouloir', 'un chien'], ['prendre', 'le train'], ['venir', 'à la fête'], ['dire', 'la vérité'], ['voir', 'un arc-en-ciel'],
  ['partir', 'en vacances'], ['savoir', 'la réponse'], ['devoir', 'partir tôt'], ['mettre', 'la table'], ['lire', 'un roman'],
  ['écrire', 'une lettre'], ['courir', 'très vite'], ['tenir', 'la corde'], ['revenir', 'du parc'], ['dormir', 'sous la tente'],
  ['sortir', 'du cinéma'], ['boire', 'un jus de pomme'], ['croire', 'cette histoire'], ['recevoir', 'un colis'],
];
const PAS_IMPERATIF = new Set(['être', 'avoir', 'tomber', 'arriver', 'habiter', 'aimer', 'savoir', 'voir', 'revenir', 'grandir', 'croire']);
// [texte, idx de personne, genre ('m'/'f' ou null si inconnu), pronom ?]
const SUJETS_CONJ = [
  ['je', 0, null, true], ['tu', 1, null, true], ['il', 2, 'm', true], ['elle', 2, 'f', true], ['nous', 3, null, true],
  ['vous', 4, null, true], ['ils', 5, 'm', true], ['elles', 5, 'f', true],
  ['Léa', 2, 'f'], ['Adam', 2, 'm'], ['Mon grand-père', 2, 'm'], ['La maîtresse', 2, 'f'], ['Mehdi', 2, 'm'], ['Sofia', 2, 'f'],
  ['Notre voisin', 2, 'm'], ['Yasmine et Chloé', 5, 'f'], ['Mes cousins', 5, 'm'], ['Nathan et Inès', 5, 'm'],
  ['Les filles', 5, 'f'], ['Lucas et Hugo', 5, 'm'], ['Ma sœur et moi', 3, null], ['Ton frère et toi', 4, null],
];
const TEMPS_CONJ = ['present', 'imparfait', 'futur', 'passe_compose', 'passe_simple', 'conditionnel'];
const INDICES_TEMPS = {
  present: 'Le présent exprime ce qui se passe maintenant ou une habitude.',
  imparfait: 'Terminaisons de l\'imparfait : -ais, -ais, -ait, -ions, -iez, -aient.',
  futur: 'Futur simple : radical du futur (souvent l\'infinitif) + -ai, -as, -a, -ons, -ez, -ont.',
  passe_compose: 'Passé composé : auxiliaire avoir ou être au présent + participe passé.',
  passe_simple: 'Passé simple, le temps du récit : il chanta, il finit, il voulut, il vint ; ils chantèrent, ils finirent…',
  conditionnel: 'Conditionnel présent : radical du futur + terminaisons de l\'imparfait (-ais, -ait, -ions, -aient…).',
};

const personneDe = (s) => ({ pronom: s[3] ? s[0] : ({ 3: 'nous', 4: 'vous', 5: 'ils' }[s[1]] ?? 'il'), idx: s[1], genre: s[2] ?? undefined });
const conjForme = (v, t, s) => conjuguer(v, t, personneDe(s)).forme;
function tempsPossibles(v, s) {
  return TEMPS_CONJ.filter((t) => {
    if (t === 'passe_simple' && ![2, 5].includes(s[1])) return false;
    if (t === 'passe_compose' && AUX_ETRE.has(v) && !s[2]) return false; // accord du participe inconnu
    return true;
  });
}
const phraseAvec = (s, f, c) => `${s[3] ? maj(avecPronom(s[0], f)) : `${s[0]} ${f}`} ${c}.`;

function frConj(modele, rng) {
  const mode = rng.pick(modele.formes ?? ['choisir']);
  const [v, c] = rng.pick(VERBES_CONJ);

  if (mode === 'mode') {
    const sorte = rng.pick(['indicatif', 'imperatif', 'infinitif']);
    if (['pouvoir', 'devoir', 'vouloir', 'recevoir'].includes(v)) return null;
    let phrase; let f;
    if (sorte === 'indicatif') {
      const s = rng.pick(SUJETS_CONJ);
      const t = rng.pick(['present', 'imparfait', 'futur']);
      f = conjForme(v, t, s);
      phrase = phraseAvec(s, f, c);
      if (s[3] && s[0] === 'je' && commenceParVoyelle(f)) f = `j'${f}`;
    } else if (sorte === 'imperatif') {
      if (PAS_IMPERATIF.has(v) || !aImperatif(v)) return null;
      f = maj(conjuguer(v, 'imperatif', { idx: rng.pick([1, 3, 4]) }).forme);
      phrase = `${f} ${c} !`;
    } else {
      if (['être', 'avoir', 'tomber', 'aller'].includes(v)) return null;
      const cadre = rng.pick(['Il faut ', 'Nous allons ', 'Papa nous demande de ']);
      const de = cadre.endsWith('de ') && commenceParVoyelle(v) ? `${cadre.slice(0, -3)}d'` : cadre;
      phrase = `${de}${v} ${c}.`;
      f = v;
    }
    const choix = ['indicatif', 'impératif', 'infinitif'];
    const bonne = { indicatif: 'indicatif', imperatif: 'impératif', infinitif: 'infinitif' }[sorte];
    const expl = {
      indicatif: 'Le verbe est conjugué avec un sujet et présente un fait : c\'est l\'indicatif.',
      imperatif: 'Le verbe n\'a pas de sujet exprimé et donne un ordre ou un conseil : c\'est l\'impératif.',
      infinitif: 'Le verbe n\'est pas conjugué, c\'est la forme du dictionnaire : c\'est l\'infinitif.',
    }[sorte];
    return {
      _signature: `mode|${phrase}`, type: 'qcm', choix, reponse: choix.indexOf(bonne), fiche: 'fr-modes',
      enonce: `Dans la phrase « ${phrase} », à quel mode est le verbe « ${f} » ?`,
      explication: `« ${f} » : ${bonne}. ${expl}`,
    };
  }

  if (mode === 'imperatif') {
    if (PAS_IMPERATIF.has(v) || !aImperatif(v)) return null;
    const idx = rng.pick([1, 3, 4]);
    const nomP = { 1: '2e personne du singulier', 3: '1re personne du pluriel', 4: '2e personne du pluriel' }[idx];
    const bonne = conjuguer(v, 'imperatif', { idx }).forme;
    const pool = [1, 3, 4].filter((i) => i !== idx).map((i) => conjuguer(v, 'imperatif', { idx: i }).forme);
    pool.push(conjuguer(v, 'present', { pronom: 'tu', idx: 1 }).forme, v);
    const q = melanger(rng, maj(bonne), pool.map(maj));
    if (!q) return null;
    return {
      _signature: `imp|${v}|${idx}`, type: 'qcm', ...q, fiche: 'fr-modes',
      enonce: `Complète à l'impératif présent (${nomP}) : « … ${c} ! »`,
      explication: `${maj(bonne)} ${c} ! L'impératif n'a pas de sujet exprimé.${v.endsWith('er') && idx === 1 ? ' Pour les verbes en -er, pas de -s à la 2e personne du singulier.' : ''}`,
    };
  }

  const s = rng.pick(SUJETS_CONJ);
  const temps = tempsPossibles(v, s);

  if (mode === 'temps') {
    const t = rng.pick(temps);
    const f = conjForme(v, t, s);
    // La forme ne doit correspondre qu'à un seul temps (ex. « il finit » : présent ET passé simple).
    const memes = TEMPS_CONJ.filter((u) => u !== t && !(u === 'passe_compose' && AUX_ETRE.has(v) && !s[2]))
      .filter((u) => conjForme(v, u, s) === f);
    if (memes.length) return null;
    const bonne = TEMPS[t];
    const q = melanger(rng, bonne, TEMPS_CONJ.map((u) => TEMPS[u]));
    const phrase = phraseAvec(s, f, c);
    return {
      _signature: `temps|${v}|${t}|${s[0]}`, type: 'qcm', ...q,
      fiche: ['passe_simple', 'conditionnel'].includes(t) ? 'fr-temps-recit' : t === 'passe_compose' ? 'fr-passe-compose' : 'fr-conjugaison-temps-simples',
      enonce: `À quel temps est conjugué le verbe dans la phrase « ${phrase} » ?`,
      explication: `« ${s[3] ? avecPronom(s[0], f) : f} » : verbe « ${v} » ${AU_TEMPS[t]}. ${INDICES_TEMPS[t]}`,
    };
  }

  if (mode === 'infinitif') {
    const t = rng.pick(temps.filter((x) => x !== 'passe_compose'));
    const f = conjForme(v, t, s);
    // Forme commune à deux temps (ex. « il applaudit » : présent ET passé simple) : l'explication serait ambiguë.
    if (TEMPS_CONJ.some((u) => u !== t && u !== 'passe_compose' && temps.includes(u) && conjForme(v, u, s) === f)) return null;
    const phrase = phraseAvec(s, f, c);
    return {
      _signature: `inf|${v}|${t}|${s[0]}`, type: 'texte_court', reponse: [v], souple: false,
      enonce: `Quel est l'infinitif du verbe conjugué dans la phrase « ${phrase} » ?`,
      explication: `« ${f} » est le verbe « ${v} » conjugué ${AU_TEMPS[t]}. L'infinitif est la forme du dictionnaire (celle qu'on dit après « il faut… »).`,
    };
  }

  if (mode === 'ecrire') {
    // Temps travaillés ici : passé simple (3e pers.), conditionnel, et verbes en -cer / -ger.
    const cerger = /[cg]er$/.test(v);
    const cand = temps.filter((t) => ['passe_simple', 'conditionnel'].includes(t) || (cerger && ['present', 'imparfait'].includes(t)));
    if (!cand.length) return null;
    const t = rng.pick(cand);
    if (cerger && t === 'present' && s[1] !== 3) return null;
    const f = conjForme(v, t, s);
    const rep = s[3] ? [f, avecPronom(s[0], f)] : [f, `${s[0]} ${f}`];
    const debut = s[3] ? (s[0] === 'je' && commenceParVoyelle(f) ? "J'…" : `${maj(s[0])} …`) : `${s[0]} …`;
    const cedille = cerger && /(ç|ge)[aoâ]/.test(f);
    return {
      _signature: `ecrire|${v}|${t}|${s[0]}`, type: 'texte_court', reponse: rep, souple: false,
      fiche: ['passe_simple', 'conditionnel'].includes(t) ? 'fr-temps-recit' : 'fr-conjugaison-temps-simples',
      enonce: `Écris le verbe « ${v} » ${AU_TEMPS[t]} : « ${debut} ${c}. »`,
      explication: `${phraseAvec(s, f, c)} ${cedille ? `Devant a ou o, on écrit ${v.endsWith('cer') ? '« ç »' : '« ge »'} pour garder le son. ` : ''}${INDICES_TEMPS[t]}`,
    };
  }

  // choisir : qcm de formes conjuguées
  const t = rng.pick(temps);
  const bonneF = conjForme(v, t, s);
  const aff = (f) => (s[3] ? avecPronom(s[0], f) : f);
  const pool = [];
  for (const u of temps) if (u !== t) pool.push(aff(conjForme(v, u, s)));
  const autresP = s[3] ? [0, 1, 2, 3, 4, 5].filter((i) => i !== s[1]) : [s[1] === 5 ? 2 : 5];
  for (const i of autresP) pool.push(aff(conjuguer(v, t, { pronom: 'il', idx: i, genre: s[2] ?? 'm' }).forme));
  const q = melanger(rng, aff(bonneF), pool);
  if (!q) return null;
  const enonce = s[3]
    ? `Quelle est la bonne forme du verbe « ${v} » ${AU_TEMPS[t]} avec « ${s[0]} » ?`
    : `Complète avec le verbe « ${v} » ${AU_TEMPS[t]} : « ${s[0]} … ${c}. »`;
  return {
    _signature: `choisir|${v}|${t}|${s[0]}`, type: 'qcm', ...q, enonce,
    explication: `${phraseAvec(s, bonneF, c)} ${INDICES_TEMPS[t]}`,
    fiche: ['passe_simple', 'conditionnel'].includes(t) ? 'fr-temps-recit' : t === 'passe_compose' ? 'fr-passe-compose' : 'fr-conjugaison-temps-simples',
  };
}

// ───────────────────────── Ordre alphabétique ─────────────────────────
const MOTS_ALPHA = ('abeille abricot accident acrobate adresse affiche agneau aiguille album allumette ananas ancre araignée arbre ardoise argent '
  + 'armoire artiste avion bagage baguette baleine ballon banane bateau bavard beurre bibliothèque bicyclette bijou biscuit blague bocal bonbon '
  + 'bougie boulanger bouteille branche brosse bruit bureau cabane cadeau cahier caillou camion canard carotte carton cerise chameau chapeau chaussette '
  + 'chemin cheval chocolat citron clown cochon colline concert crayon crocodile cuisine dauphin dentiste désert dessin dinosaure docteur domino '
  + 'dragon écharpe école écureuil éléphant enveloppe épinard escargot étoile fantôme farine fenêtre fleur forêt fourmi fraise fromage fusée '
  + 'galette garage gâteau girafe glace gomme gorille grenouille guitare hamster hérisson hibou horloge igloo image insecte jardin jongleur journal '
  + 'kangourou kiwi lampe lapin légume lion livre loup lunette magicien maison manteau marteau mouton musique nuage oiseau orange ours panda '
  + 'papillon parapluie pirate poisson pomme pompier poupée prince radis renard requin robot sable salade sapin serpent singe soleil souris '
  + 'tambour tartine tigre tomate tortue train trésor tulipe valise vélo village violon voiture volcan wagon yaourt zèbre').split(' ');
const cleAlpha = (m) => m.normalize('NFD').replace(/[̀-ͯ]/g, '');
function frAlpha(modele, rng) {
  const forme = rng.pick(modele.formes ?? ['ordre', 'premier', 'dernier']);
  // Souvent, des mots qui commencent par la même lettre (il faut regarder la 2e, la 3e lettre…).
  let pool = MOTS_ALPHA;
  if (rng.next() < 0.6) {
    const lettre = cleAlpha(rng.pick(MOTS_ALPHA)).charAt(0);
    const meme = MOTS_ALPHA.filter((m) => cleAlpha(m).charAt(0) === lettre);
    if (meme.length >= 4) pool = meme;
  }
  const mots = rng.shuffle(pool).slice(0, 4);
  const tries = mots.slice().sort((a, b) => (cleAlpha(a) < cleAlpha(b) ? -1 : 1));
  const liste = tries.join(' → ');
  const astuce = 'Si la première lettre est la même, compare la deuxième, puis la troisième…';
  if (forme === 'ordre') {
    return {
      _signature: `ordre|${mots.slice().sort().join(',')}`, type: 'ordre', elements: mots,
      reponse: tries.map((m) => mots.indexOf(m)),
      enonce: 'Range ces mots dans l\'ordre alphabétique (l\'ordre du dictionnaire).',
      explication: `${liste}. ${astuce}`,
    };
  }
  const bon = forme === 'premier' ? tries[0] : tries[tries.length - 1];
  return {
    _signature: `${forme}|${mots.slice().sort().join(',')}`, type: 'qcm', choix: mots, reponse: mots.indexOf(bon),
    enonce: forme === 'premier' ? 'Quel mot se trouve en premier dans le dictionnaire ?' : 'Quel mot se trouve en dernier dans le dictionnaire ?',
    explication: `Ordre alphabétique : ${liste}. ${astuce}`,
  };
}

export const GENERATEURS = {
  fr_classes: frClasses,
  fr_fonctions: frFonctions,
  fr_homophones: frHomophones,
  fr_e_er: frEEr,
  fr_accord_sv: frAccordSV,
  fr_participe: frParticipe,
  fr_accord_adj: frAccordAdj,
  fr_conj: frConj,
  fr_alpha: frAlpha,
};
