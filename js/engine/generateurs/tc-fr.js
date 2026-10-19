// Générateurs des familles du tronc commun (référentiel P6), matière fr.
// Voir js/engine/generateurs/gen-*.js pour les conventions (formes, _signature, qcm…).
//
//   tc_fr_conj_composes : plus-que-parfait, futur antérieur, conditionnel passé, futur proche
//   tc_fr_radical_er    : verbes en -ER à radical variable (appeler, acheter, céder, payer, nettoyer…)
//   tc_fr_corriger      : trouver et corriger le mot mal écrit (une seule erreur par phrase)
//   tc_fr_fonctions_gn  : épithète, complément du nom (et attribut, pour les distinguer)
//   tc_fr_predicat      : groupe sujet, groupe prédicat, complément de phrase
//   tc_fr_ponctuation   : choisir le signe (virgule, deux-points, ?, !, guillemets, tiret)
//   tc_fr_adverbes      : formation des adverbes en -ment
//   tc_fr_pp_accord     : participe passé sans auxiliaire et avec avoir (complément direct placé avant)

import { conjuguer, PERSONNES, participePresent, participesPresents, verbesIrreguliers, AUX_ETRE } from './conjugaison.js';
import { VERBES_CONJ } from './gen-francais.js';
import { formesRectifiees } from '../checker.js';

// « formes » d'un modèle : noms de sortes de questions (chaînes). Les objets { fiche } listent seulement les fiches visées.
function choixForme(rng, modele, defaut) {
  const noms = (modele.formes ?? []).filter((x) => typeof x === 'string');
  return rng.pick(noms.length ? noms : defaut);
}
const maj = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const bas = (s) => String(s).trim().toLowerCase();
const cleRect = (x) => [...formesRectifiees(bas(x))][0].replace(/-/g, '');

// QCM : bonne réponse + distracteurs distincts (aussi en orthographe rectifiée).
// `prio` : distracteurs à placer en premier ; `interdits` : autres formes justes à ne jamais proposer.
function qcm(rng, bonne, pool, { n = 4, prio = [], interdits = [] } = {}) {
  const vus = new Set([cleRect(bonne), ...interdits.map(cleRect)]);
  const d = [];
  for (const x of [...prio, ...rng.shuffle(pool)]) {
    if (!x) continue;
    const k = cleRect(x);
    if (vus.has(k)) continue;
    vus.add(k); d.push(x);
    if (d.length === n - 1) break;
  }
  if (d.length < 2) return null;
  const choix = rng.shuffle([bonne, ...d]);
  return { type: 'qcm', choix, reponse: choix.indexOf(bonne) };
}

// Élision : je aurai → j'aurai, que il → qu'il, si il → s'il.
function elider(t) {
  return t
    .replace(/(^|[\s«(])([Jj]e|[Qq]ue) (?=[aeiouyhéèêâîôœAEIOUYÉ])/g, (m, a, w) => `${a}${w.slice(0, -1)}'`)
    .replace(/(^|\s)([Ss])i (?=ils?\b)/g, "$1$2'");
}

const GN = { ms: 'masculin singulier', fs: 'féminin singulier', mp: 'masculin pluriel', fp: 'féminin pluriel' };
function accorderPP(pp, code) {
  if (code === 'ms') return pp;
  if (code === 'fs') return pp + 'e';
  if (code === 'mp') return pp.endsWith('s') ? pp : pp + 's';
  return pp + 'es';
}

// ═════════════════════════ 1. Temps composés et futur proche ═════════════════════════
// Sujets : pr = pronom qui reprend le sujet ; g = genre connu (accord du participe avec être).
const SUJETS_C = [
  { s: 'je', pro: true, idx: 0 }, { s: 'tu', pro: true, idx: 1 }, { s: 'il', pro: true, idx: 2, g: 'm' },
  { s: 'elle', pro: true, idx: 2, g: 'f' }, { s: 'nous', pro: true, idx: 3 }, { s: 'vous', pro: true, idx: 4 },
  { s: 'ils', pro: true, idx: 5, g: 'm' }, { s: 'elles', pro: true, idx: 5, g: 'f' },
  { s: 'Léa', pr: 'elle', idx: 2, g: 'f' }, { s: 'Tom', pr: 'il', idx: 2, g: 'm' },
  { s: 'mes cousines', pr: 'elles', idx: 5, g: 'f' }, { s: 'les enfants', pr: 'ils', idx: 5, g: 'm' },
  { s: 'ma sœur', pr: 'elle', idx: 2, g: 'f' }, { s: 'mon père', pr: 'il', idx: 2, g: 'm' },
  { s: 'Léa et Tom', pr: 'ils', idx: 5, g: 'm' },
];
// [infinitif, participe passé, auxiliaire, complément]
export const VERBES_C = [
  ['finir', 'fini', 'avoir', 'le puzzle'], ['ranger', 'rangé', 'avoir', 'le grenier'], ['manger', 'mangé', 'avoir', 'tout le gâteau'],
  ['préparer', 'préparé', 'avoir', 'le repas'], ['lire', 'lu', 'avoir', 'la bande dessinée'], ['écrire', 'écrit', 'avoir', 'une lettre à Mamie'],
  ['terminer', 'terminé', 'avoir', 'le dessin'], ['construire', 'construit', 'avoir', 'une cabane'], ['réparer', 'réparé', 'avoir', 'le vélo'],
  ['nettoyer', 'nettoyé', 'avoir', 'la cuisine'], ['faire', 'fait', 'avoir', 'les courses'], ['choisir', 'choisi', 'avoir', 'un cadeau'],
  ['peindre', 'peint', 'avoir', 'la clôture'], ['ouvrir', 'ouvert', 'avoir', 'les cadeaux'], ['apprendre', 'appris', 'avoir', 'la poésie'],
  ['voir', 'vu', 'avoir', 'le film'], ['mettre', 'mis', 'avoir', 'la table'], ['vendre', 'vendu', 'avoir', 'la vieille voiture'],
  ['arroser', 'arrosé', 'avoir', 'les plantes'], ['laver', 'lavé', 'avoir', 'la voiture'], ['prendre', 'pris', 'avoir', 'le train'],
  ['partir', 'parti', 'être', 'en vacances'], ['aller', 'allé', 'être', 'à la piscine'], ['arriver', 'arrivé', 'être', 'à la gare'],
  ['rentrer', 'rentré', 'être', 'à la maison'], ['sortir', 'sorti', 'être', 'avec le chien'], ['venir', 'venu', 'être', 'à la fête'],
  ['monter', 'monté', 'être', 'au grenier'], ['descendre', 'descendu', 'être', 'à la cave'], ['retourner', 'retourné', 'être', "à l'école"],
];
const TEMPS_C = {
  pqp: { nom: 'plus-que-parfait', au: 'au plus-que-parfait', aux: 'imparfait', regle: "auxiliaire être ou avoir à l'imparfait + participe passé" },
  fa: { nom: 'futur antérieur', au: 'au futur antérieur', aux: 'futur', regle: 'auxiliaire être ou avoir au futur simple + participe passé' },
  cp: { nom: 'conditionnel passé', au: 'au conditionnel passé', aux: 'conditionnel', regle: 'auxiliaire être ou avoir au conditionnel présent + participe passé' },
  fp: { nom: 'futur proche', au: 'au futur proche', regle: 'verbe aller au présent + infinitif (ce n\'est pas un temps composé : il n\'y a pas de participe passé)' },
  pc: { nom: 'passé composé', au: 'au passé composé', aux: 'present', regle: 'auxiliaire être ou avoir au présent + participe passé' },
  pa: { nom: 'passé antérieur', au: 'au passé antérieur', aux: 'passe_simple', regle: 'auxiliaire être ou avoir au passé simple + participe passé ; il exprime une action terminée juste avant une autre action au passé simple' },
};
// {S} sujet, {P} pronom qui reprend le sujet, {A} avoir à l'imparfait (accordé au sujet), {V} verbe, {C} complément.
const CADRES_C = {
  fa: [{ t: 'Avant midi, {S} {V} {C}.' }, { t: "D'ici ce soir, {S} {V} {C}." }, { t: 'Dans une heure, {S} {V} {C}.' }, { t: 'Quand {S} {V} {C}, nous pourrons jouer.', avoir: true }],
  pqp: [{ t: 'Quand le téléphone a sonné, {S} {V} {C}.' }, { t: 'Mamie était contente parce que {S} {V} {C}.' }, { t: "Le lendemain, j'ai appris que {S} {V} {C}." }],
  cp: [{ t: 'Si {S} {A} eu le temps, {P} {V} {C}.', pro: true }, { t: 'Si {S} {A} pu, {P} {V} {C}.', pro: true }, { t: 'Avec un peu plus de temps, {S} {V} {C}.' }],
  fp: [{ t: 'Dans cinq minutes, {S} {V} {C}.' }, { t: 'Ce soir, {S} {V} {C}.' }, { t: "Tout à l'heure, {S} {V} {C}." }],
  pc: [{ t: 'Hier, {S} {V} {C}.' }, { t: 'Ce matin, {S} {V} {C}.' }],
  pa: [{ t: 'Quand {S} {V} {C}, {P} {PS:aller} se reposer.', pro: true, avoir: true }, { t: 'Dès que {S} {V} {C}, {P} {PS:sortir} dans le jardin.', pro: true, avoir: true },
    { t: 'Lorsque {S} {V} {C}, {P} {PS:téléphoner} à Mamie.', pro: true, avoir: true }],
};
const auxForme = (aux, temps, idx) => conjuguer(aux, temps, { pronom: 'x', idx }).forme;

function accordsC(pp, aux, s) {
  if (aux !== 'être') return [pp];
  const pl = s.idx >= 3 ? 's' : '';
  if (s.g) return [pp + (s.g === 'f' ? 'e' : '') + pl];
  return [pp + pl, pp + 'e' + pl];
}
function formeComposee(v, t, s) {
  if (t === 'fp') return [`${auxForme('aller', 'present', s.idx)} ${v[0]}`];
  const a = auxForme(v[2], TEMPS_C[t].aux, s.idx);
  return accordsC(v[1], v[2], s).map((p) => `${a} ${p}`);
}
function rendreC(cadre, s, verbe, c) {
  const t = cadre.t.replace('{S}', s.s).replace('{P}', s.pr ?? s.s)
    .replace('{A}', auxForme('avoir', 'imparfait', s.idx)).replace('{V}', verbe).replace('{C}', c)
    .replace(/\{PS:([^}]+)\}/, (_, v) => auxForme(v, 'passe_simple', s.idx));
  return maj(elider(t));
}

function frConjComposes(modele, rng) {
  const forme = choixForme(rng, modele, ['ecrire', 'ecrire', 'choisir', 'temps']);
  // Passé antérieur : peu tiré (environ 1 fois sur 12), seulement avec il, elle, ils, elles ou un nom.
  const t = rng.next() < 0.08 ? 'pa' : rng.pick(forme === 'temps' ? ['pqp', 'fa', 'cp', 'fp', 'pc'] : ['pqp', 'fa', 'cp', 'fp']);
  const iC = rng.int(0, CADRES_C[t].length - 1);
  const cadre = CADRES_C[t][iC];
  const v = rng.pick(cadre.avoir ? VERBES_C.filter((x) => x[2] === 'avoir') : VERBES_C);
  const s = rng.pick(t === 'pa' ? SUJETS_C.filter((x) => x.idx === 2 || x.idx === 5) : SUJETS_C);
  const formes = formeComposee(v, t, s);
  const T = TEMPS_C[t];
  const complete = rendreC(cadre, s, formes[0], v[3]);
  const sig = `${forme}|${t}|${iC}|${v[0]}|${s.s}`;
  let noteEtre = '';
  if (v[2] === 'être' && t !== 'fp') {
    noteEtre = " Avec l'auxiliaire être, le participe passé s'accorde avec le sujet";
    noteEtre += s.g ? '.' : ` (on écrit « ${formes[1]} » ${s.idx >= 3 ? 'si ce sont des filles' : "si c'est une fille"}).`;
  }
  const explication = `« ${complete} » ${maj(T.nom)} : ${T.regle}.${noteEtre}`;

  if (forme === 'ecrire') {
    const sujetVerbe = cadre.pro || s.pro ? (s.pr ?? s.s) : null;
    const rep = new Set();
    for (const f of formes) { rep.add(f); if (sujetVerbe) rep.add(elider(`${sujetVerbe} ${f}`)); }
    return {
      _signature: sig, type: 'texte_court', souple: false, reponse: [...rep],
      enonce: `Conjugue le verbe entre parenthèses ${T.au} : « ${rendreC(cadre, s, `(${v[0]})`, v[3])} »`,
      explication,
    };
  }
  if (forme === 'choisir') {
    const autres = ['pqp', 'fa', 'cp', 'fp', 'pc', 'pa'].filter((x) => x !== t).map((x) => formeComposee(v, x, s)[0]);
    const prio = [];
    if (v[2] === 'être' && s.g && t !== 'fp') {
      const pl = s.idx >= 3 ? 's' : '';
      const faux = v[1] + (s.g === 'f' ? '' : 'e') + pl;
      prio.push(`${auxForme('être', T.aux, s.idx)} ${faux}`);
    }
    const q = qcm(rng, formes[0], autres, { prio, interdits: formes });
    if (!q) return null;
    return {
      _signature: sig, ...q,
      enonce: `Complète avec le verbe « ${v[0]} » ${T.au} : « ${rendreC(cadre, s, '___', v[3])} »`,
      explication,
    };
  }
  // temps : reconnaître le temps
  const q = qcm(rng, T.nom, ['pqp', 'fa', 'cp', 'fp', 'pc', 'pa'].map((x) => TEMPS_C[x].nom), { prio: t === 'pa' ? ['plus-que-parfait'] : [] });
  return {
    _signature: sig, ...q,
    enonce: `Dans la phrase « ${complete} », à quel temps est conjugué le verbe « ${formes[0]} » ?`,
    explication: `« ${formes[0]} » est au ${T.nom} : ${T.regle}.`,
  };
}

// ═════════════════════════ 2. Verbes en -ER à radical variable ═════════════════════════
// [infinitif, type, complément, sujets imposés ?]
export const VERBES_ER = [
  ['appeler', 'double', 'le chien'], ['rappeler', 'double', 'le médecin'], ['jeter', 'double', 'les papiers à la poubelle'], ['projeter', 'double', 'un film'],
  ['acheter', 'grave', 'du pain'], ['peser', 'grave', 'les pommes'], ['lever', 'grave', 'la main'], ['mener', 'grave', 'la course'],
  ['amener', 'grave', 'un ami'], ['promener', 'grave', 'le chien'], ['semer', 'grave', 'des graines'], ['enlever', 'grave', 'le manteau'],
  ['peler', 'grave', 'une orange'], ['soulever', 'grave', 'la caisse'],
  ['céder', 'aigu', 'la place'], ['espérer', 'aigu', 'gagner'], ['répéter', 'aigu', 'la consigne'], ['préférer', 'aigu', 'le chocolat'],
  ['compléter', 'aigu', 'la grille'], ['posséder', 'aigu', 'un vélo'], ['sécher', 'aigu', 'le linge'], ['régler', 'aigu', 'le réveil'],
  ['célébrer', 'aigu', 'la victoire'],
  ['payer', 'ayer', 'les glaces'], ['essayer', 'ayer', 'le pull'], ['balayer', 'ayer', 'la cour'],
  ['nettoyer', 'oyer', 'la table'], ['employer', 'oyer', 'ce mot'], ['tutoyer', 'oyer', 'le voisin'], ['envoyer', 'oyer', 'une carte'],
  ['renvoyer', 'oyer', 'la balle'], ['aboyer', 'oyer', 'très fort', [{ pronom: 'le chien', idx: 2 }, { pronom: 'les chiens', idx: 5 }]],
  ['appuyer', 'oyer', 'sur le bouton'], ['essuyer', 'oyer', 'la vaisselle'], ['ennuyer', 'oyer', 'le chat'],
  ['commencer', 'cer', 'le match'], ['placer', 'cer', 'les assiettes'], ['lancer', 'cer', 'le ballon'], ['effacer', 'cer', 'le tableau'],
  ['manger', 'ger', 'une pomme'], ['nager', 'ger', 'dans le lac'], ['ranger', 'ger', 'la chambre'], ['voyager', 'ger', 'en train'],
  ['partager', 'ger', 'le gâteau'], ['changer', 'ger', 'de place'],
];
const PRES = ['e', 'es', 'e', 'ons', 'ez', 'ent'];
const IMP = ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'];
const FUT = ['ai', 'as', 'a', 'ons', 'ez', 'ont'];
const TEMPS_ER = {
  present: { nom: 'présent', au: 'au présent', amorce: 'Maintenant, ' },
  imparfait: { nom: 'imparfait', au: "à l'imparfait", amorce: 'Autrefois, ' },
  futur: { nom: 'futur simple', au: 'au futur simple', amorce: 'Demain, ' },
  conditionnel: { nom: 'conditionnel présent', au: 'au conditionnel présent', amorce: "Si c'était possible, " },
};
const CONS = '[^aeiouyéèêâîôû]+';
function radicalFort(rad, type) {
  switch (type) {
    case 'double': return rad + rad.at(-1);
    case 'grave': return rad.replace(new RegExp(`e(${CONS})$`), 'è$1');
    case 'aigu': return rad.replace(new RegExp(`é(${CONS})$`), 'è$1');
    case 'ayer': case 'oyer': return rad.slice(0, -1) + 'i';
    default: return rad;
  }
}
function coller(rad, term) {
  if (/^[ao]/.test(term)) {
    if (rad.endsWith('c')) return rad.slice(0, -1) + 'ç' + term;
    if (rad.endsWith('g')) return rad + 'e' + term;
  }
  return rad + term;
}
// Formes acceptées (la première est la forme de référence).
function conjER(inf, type, t, idx) {
  const rad = inf.slice(0, -2);
  const fort = radicalFort(rad, type);
  if (t === 'imparfait') return [coller(rad, IMP[idx])];
  if (t === 'present') {
    const muet = [0, 1, 2, 5].includes(idx);
    const f = coller(muet ? fort : rad, PRES[idx]);
    return type === 'ayer' && muet ? [f, rad + PRES[idx]] : [f];
  }
  const term = (t === 'futur' ? FUT : IMP)[idx];
  if (inf.endsWith('envoyer')) return [inf.slice(0, -5) + 'verr' + term];
  const f = (type === 'aigu' ? rad : fort) + 'er' + term;
  return type === 'ayer' ? [f, rad + 'er' + term] : [f];
}
// Formes fautives plausibles (radical mal choisi, cédille oubliée, futur/conditionnel confondus…).
function fauxER(inf, type, t, idx) {
  const rad = inf.slice(0, -2);
  const rads = new Set([rad, radicalFort(rad, type)]);
  if (type === 'double') rads.add(rad.replace(new RegExp(`e(${CONS})$`), 'è$1'));
  if (type === 'grave') { rads.add(rad + rad.at(-1)); rads.add(rad.replace(new RegExp(`e(${CONS})$`), 'é$1')); }
  if (type === 'aigu') rads.add(rad.normalize('NFD').replace(/[̀-ͯ]/g, ''));
  const out = [];
  for (const r of rads) {
    if (t === 'present') out.push(r + PRES[idx]);
    else if (t === 'imparfait') out.push(r + IMP[idx]);
    else out.push(r + 'er' + (t === 'futur' ? FUT : IMP)[idx]);
  }
  if (type === 'cer') { const b = rad.slice(0, -1); out.push(b + 'c' + (t === 'present' ? PRES : IMP)[idx], b + 'ç' + (t === 'present' ? PRES : IMP)[idx]); }
  if (type === 'ger') { out.push(rad + (t === 'present' ? PRES : IMP)[idx], rad + 'e' + (t === 'present' ? PRES : IMP)[idx]); }
  if (inf.endsWith('envoyer') && (t === 'futur' || t === 'conditionnel')) {
    const term = (t === 'futur' ? FUT : IMP)[idx];
    out.push(rad + 'er' + term, rad.slice(0, -1) + 'ier' + term, inf.slice(0, -5) + 'ver' + term);
  }
  if (t === 'futur') out.push(conjER(inf, type, 'conditionnel', idx)[0]);
  if (t === 'conditionnel') out.push(conjER(inf, type, 'futur', idx)[0]);
  return out;
}
function regleER(inf, type) {
  const c = (t, i) => conjER(inf, type, t, i)[0];
  const j = (f) => (/^[aeiouyéè]/.test(f) ? `j'${f}` : `je ${f}`);
  switch (type) {
    case 'double': return `Le verbe « ${inf} » double la consonne devant un e muet : ${j(c('present', 0))}, nous ${c('present', 3)}, ${j(c('futur', 0))}.`;
    case 'grave': return `Devant un e muet, le e du radical devient è : ${j(c('present', 0))}, nous ${c('present', 3)}, ${j(c('futur', 0))}.`;
    case 'aigu': return `Au présent, le é du radical devient è devant un e muet : ${j(c('present', 0))}, nous ${c('present', 3)}. Au futur et au conditionnel, on écrit ${j(c('futur', 0))} (ou avec è, en orthographe rectifiée).`;
    case 'ayer': return `Devant un e muet, le y peut devenir i : ${j(c('present', 0))} ou ${j(conjER(inf, type, 'present', 0)[1])} ; nous ${c('present', 3)}.`;
    case 'oyer': return inf.endsWith('envoyer')
      ? `Devant un e muet, le y devient i : ${j(c('present', 0))}, nous ${c('present', 3)}. Futur irrégulier : ${j(c('futur', 0))}.`
      : `Devant un e muet, le y devient i : ${j(c('present', 0))}, nous ${c('present', 3)}, ${j(c('futur', 0))}.`;
    case 'cer': return `Devant a et o, le c prend une cédille pour garder le son « s » : nous ${c('present', 3)}, ${j(c('imparfait', 0))}.`;
    default: return `Devant a et o, on ajoute un e après le g pour garder le son « je » : nous ${c('present', 3)}, ${j(c('imparfait', 0))}.`;
  }
}
const avecPron = (p, f) => (p === 'je' && /^[aeiouyéèh]/.test(f) ? `j'${f}` : `${p} ${f}`);

function frRadicalEr(modele, rng) {
  const forme = choixForme(rng, modele, ['ecrire', 'choisir']);
  const [inf, type, comp, sujets] = rng.pick(VERBES_ER);
  const t = rng.pick(['present', 'present', 'imparfait', 'futur', 'futur', 'conditionnel']);
  const p = rng.pick(sujets ?? PERSONNES);
  const formes = conjER(inf, type, t, p.idx);
  const T = TEMPS_ER[t];
  const sig = `${forme}|${inf}|${t}|${p.pronom}`;
  const explication = `${maj(avecPron(p.pronom, formes[0]))}${formes[1] ? ` (ou ${avecPron(p.pronom, formes[1])})` : ''} : ${inf}, ${T.nom}. ${regleER(inf, type)}`;
  if (forme === 'ecrire') {
    const rep = new Set();
    for (const f of formes) { rep.add(f); rep.add(avecPron(p.pronom, f)); }
    const pron = p.pronom === 'je' && /^[aeiouyéèh]/.test(formes[0]) ? "j'" : p.pronom;
    return {
      _signature: sig, type: 'texte_court', souple: false, reponse: [...rep],
      enonce: `Conjugue le verbe « ${inf} » ${T.au} : ${pron} …`,
      explication,
    };
  }
  const bonne = rng.pick(formes);
  const autres = PERSONNES.filter((x) => x.idx !== p.idx).flatMap((x) => conjER(inf, type, t, x.idx));
  const q = qcm(rng, bonne, autres, { prio: rng.shuffle(fauxER(inf, type, t, p.idx)).slice(0, 3), interdits: formes });
  if (!q) return null;
  const pron = p.pronom === 'je' && /^[aeiouyéèh]/.test(bonne) ? "j'" : `${p.pronom} `;
  return {
    _signature: `${sig}|${bonne}`, ...q,
    enonce: `Complète avec le verbe « ${inf} » ${T.au} : « ${T.amorce}${pron}___ ${comp}. »`,
    explication,
  };
}

// ═════════════════════════ 3. Trouver et corriger le mot mal écrit ═════════════════════════
// [catégorie, phrase correcte avec [bon|faux]]
const PHRASES_CORR = [
  ['sv', 'Les enfants [jouent|joue] dans la cour de récréation.'], ['sv', 'Mes parents [regardent|regarde] un film à la télévision.'],
  ['sv', 'Le chien de mes voisins [aboie|aboient] toute la nuit.'], ['sv', 'Chaque matin, les oiseaux [chantent|chante] dans le jardin.'],
  ['sv', 'Mes sœurs [mangent|mange] leur dessert trop vite.'], ['sv', 'Mes cousins [partent|part] en vacances demain.'],
  ['sv', 'Les élèves de ma classe [préparent|prépare] un spectacle.'], ['sv', 'Dans la forêt [vivent|vit] des cerfs et des sangliers.'],
  ['sv', 'Ma sœur et mon frère [font|fait] leurs devoirs.'], ['sv', 'Ces élèves [finissent|finit] toujours avant les autres.'],
  ['sv', 'Les fleurs du jardin [sentent|sent] très bon.'], ['sv', 'Le maître [explique|expliquent] la leçon aux élèves.'],
  ['sv', 'Les pommes de cet arbre [sont|est] bien mûres.'], ['sv', 'Mon frère [range|ranges] ses affaires dans son cartable.'],
  ['sv', 'Mes amis [viennent|vient] souvent jouer chez moi.'], ['sv', 'Les voitures [roulent|roule] lentement dans la rue.'],
  ['sv', 'Le facteur [apporte|apportent] les lettres.'], ['sv', 'Où [vont|va] tes cousins cet été ?'],
  ['sv', "Les joueurs de l'équipe [courent|court] très vite."], ['sv', 'Mon grand-père nous [raconte|racontent] une histoire.'],
  ['gn', 'Léa porte une robe [verte|vert] pour la fête.'], ['gn', 'Nous avons vu de [grands|grand] arbres dans le parc.'],
  ['gn', 'Mon oncle habite une [petite|petit] maison au bord de la mer.'], ['gn', 'Les [vieilles|vieille] photos de Mamie sont dans une boîte.'],
  ['gn', 'Il a mangé des fraises [délicieuses|délicieuse] au goûter.'], ['gn', 'Tom a reçu des chaussures [neuves|neuve] pour son anniversaire.'],
  ['gn', "J'aime les [longues|longue] promenades en forêt."], ['gn', 'Cette chanson [joyeuse|joyeux] me donne envie de danser.'],
  ['gn', 'Les [petits|petit] chats dorment près du feu.'], ['gn', 'Ma tante a acheté des rideaux [bleus|bleu].'],
  ['gn', 'Nous avons cueilli des pommes [rouges|rouge].'], ['gn', 'Ces [belles|belle] fleurs poussent dans notre jardin.'],
  ['gn', 'Il porte toujours des chaussettes [blanches|blanche].'], ['gn', 'Mes [nouveaux|nouveau] voisins sont très gentils.'],
  ['gn', 'Une [grosse|gros] araignée descend du plafond.'], ['gn', 'Papa prépare une soupe [chaude|chaud] pour le souper.'],
  ['gn', 'Le chat a des yeux [verts|vert] magnifiques.'], ['gn', 'Mamie a tricoté une écharpe [douce|doux] pour Tom.'],
  ['pp', 'Mes cousines sont [arrivées|arrivé] hier soir.'], ['pp', 'Léa est [partie|parti] à la piscine avec son père.'],
  ['pp', "Les enfants sont [rentrés|rentré] de l'école à quatre heures."], ['pp', 'Ma grand-mère est [venue|venu] nous voir dimanche.'],
  ['pp', 'Les feuilles sont [tombées|tombé] dans le jardin.'], ['pp', 'Nos voisins sont [allés|allé] en Espagne.'],
  ['pp', 'La petite fille est [tombée|tombé] de son vélo.'], ['pp', 'Elles sont [restées|resté] à la maison toute la journée.'],
  ['pp', 'Les lettres sont [arrivées|arrivée] ce matin.'], ['pp', 'Ma sœur est [née|né] en hiver.'],
  ['pp', 'Mes parents sont [sortis|sorti] au restaurant.'], ['pp', 'Julie et Emma sont [montées|monté] au grenier.'],
  ['pp', 'Les fenêtres sont [ouvertes|ouverte] car il fait chaud.'], ['pp', 'La boulangerie est [fermée|fermé] le lundi.'],
  ['a', 'Mon frère [a|à] perdu son bonnet.'], ['a', 'Nous allons [à|a] la piscine le mercredi.'],
  ['a', 'Léa [a|à] un chat très câlin.'], ['a', 'Ce soir, je dors chez ma tante [à|a] Namur.'],
  ['a', 'Tom [a|à] mal aux dents depuis hier.'], ['a', "J'ai donné un dessin [à|a] ma voisine."],
  ['a', 'Le boulanger [a|à] préparé des croissants.'], ['a', 'Elle [a|à] rangé sa chambre.'],
  ['a', 'Nous mangeons une tarte [à|a] la crème.'], ['a', 'Mon cousin habite [à|a] Bruxelles.'],
  ['et', 'Le ciel [est|et] gris ce matin.'], ['et', "J'ai acheté du pain [et|est] du fromage."],
  ['et', 'Mon chien [est|et] très obéissant.'], ['et', 'Léa [et|est] Tom jouent ensemble.'],
  ['et', 'La soupe [est|et] trop chaude.'], ['et', 'Il pleut [et|est] il fait froid.'],
  ['et', 'Mon père [est|et] parti travailler.'], ['et', "J'aime les pommes [et|est] les poires."],
  ['son', 'Les enfants [sont|son] dans le jardin.'], ['son', "Hugo a oublié [son|sont] cartable à l'école."],
  ['son', 'Mes cousins [sont|son] très gentils.'], ['son', 'Léa promène [son|sont] chien tous les soirs.'],
  ['son', 'Les magasins [sont|son] fermés le dimanche.'], ['son', 'Le chat dort sur [son|sont] coussin.'],
  ['son', 'Ils [sont|son] partis tôt ce matin.'], ['son', 'Mon père répare [son|sont] vélo.'],
  // ses → ces n'est pas retenu : « Le chat lèche ces pattes » reste une phrase correcte.
  ['ces', '[Ces|Ses] jours-ci, il fait très froid.'], ['ces', 'Combien coûtent [ces|ses] pommes-là ?'],
  ['ces', 'Regarde [ces|ses] nuages-là : ils annoncent la pluie.'], ['ces', '[Ces|Ses] chaussures-ci sont trop petites pour moi.'],
  ['er', 'Je vais [manger|mangé] chez ma grand-mère.'], ['er', 'Nous avons [joué|jouer] au football.'],
  ['er', 'Il faut [ranger|rangé] ta chambre.'], ['er', 'Tom a [regardé|regarder] un dessin animé.'],
  ['er', "Elle veut [chanter|chanté] à la fête de l'école."], ['er', 'Hier, nous avons [visité|visiter] un château.'],
  ['er', 'Mon chat aime [jouer|joué] avec une balle.'], ['er', 'Léa a [trouvé|trouver] une pièce dans la rue.'],
  ['er', 'Tu dois [terminer|terminé] tes exercices.'], ['er', "J'ai [lavé|laver] la vaisselle."],
  ['er', 'Nous allons [préparer|préparé] un gâteau.'], ['er', 'Papa a [réparé|réparer] mon vélo.'],
  ['er', 'Le bébé commence à [marcher|marché].'], ['er', 'Vous avez [gagné|gagner] le match.'],
];
const FICHE_CORR = { sv: 'fr-accord-sujet-verbe', gn: 'fr-accord-adjectif', pp: 'fr-participe-passe', a: 'fr-homophones', et: 'fr-homophones', son: 'fr-homophones', ces: 'fr-homophones', er: 'fr-e-er' };
function regleCorr(cat, bon) {
  switch (cat) {
    case 'sv': return "Le verbe s'accorde avec son sujet : cherche-le avec « c'est … qui » ou « ce sont … qui ».";
    case 'gn': return "Dans le groupe nominal, l'adjectif prend le genre et le nombre du nom qu'il accompagne.";
    case 'pp': return "Avec l'auxiliaire être, le participe passé s'accorde avec le sujet.";
    case 'a': return bon === 'a' ? '« a » est le verbe avoir : on peut le remplacer par « avait ».' : '« à » est une préposition : on ne peut pas le remplacer par « avait ».';
    case 'et': return bon === 'est' ? '« est » est le verbe être : on peut le remplacer par « était ».' : '« et » relie deux mots ou deux groupes : on peut le remplacer par « et puis ».';
    case 'son': return bon === 'sont' ? '« sont » est le verbe être : on peut le remplacer par « étaient ».' : '« son » est un déterminant possessif : on peut le remplacer par « mon » ou « ton ».';
    case 'ces': return bon.toLowerCase() === 'ses' ? '« ses » veut dire « les siens, les siennes » : on peut le remplacer par « mes ».' : '« ces » montre quelque chose (ceux-là, celles-là) : au singulier, on dirait « ce » ou « cette ».';
    default: return /er$/.test(bon)
      ? 'Après une préposition (à, de, pour…) ou un verbe comme aller, vouloir, devoir, aimer, il faut…, on écrit l\'infinitif en -er : on peut le remplacer par « vendre ».'
      : 'Après l\'auxiliaire avoir, on écrit le participe passé en -é : on peut le remplacer par « vendu ».';
  }
}
const motsDe = (phrase) => phrase.split(/[\s,.;:!?«»]+/).filter((m) => m && !m.includes("'"));

function frCorriger(modele, rng) {
  const i = rng.int(0, PHRASES_CORR.length - 1);
  const [cat, src] = PHRASES_CORR[i];
  const m = src.match(/\[([^|\]]+)\|([^\]]+)\]/);
  const [bon, faux] = [m[1], m[2]];
  const correcte = src.replace(m[0], bon);
  const fautive = src.replace(m[0], faux);
  const mots = motsDe(fautive);
  if (mots.filter((x) => bas(x) === bas(faux)).length !== 1) return null;
  // modele.formes liste ici des entrées { fiche } (notions visées) : choixForme les ignore.
  const forme = choixForme(rng, modele, ['trouver', 'trouver', 'corriger', 'corriger_libre']);
  const explication = `Il faut écrire « ${bon} » : « ${correcte} » ${regleCorr(cat, bon)}`;
  const base = { fiche: FICHE_CORR[cat], explication };
  if (forme === 'trouver') {
    const autres = [...new Set(mots.filter((x) => bas(x) !== bas(faux)))];
    const q = qcm(rng, faux, autres);
    if (!q) return null;
    return { _signature: `trouver|${i}|${q.choix.map(bas).sort().join(',')}`, ...q, ...base,
      enonce: `Un seul mot est mal écrit dans cette phrase. Lequel ? « ${fautive} »` };
  }
  if (forme === 'corriger') {
    return { _signature: `corriger|${i}`, type: 'texte_court', souple: false, reponse: [bon], ...base,
      enonce: `Dans la phrase « ${fautive} », le mot « ${faux} » est mal écrit. Écris-le correctement.` };
  }
  return { _signature: `libre|${i}`, type: 'texte_court', souple: false, reponse: [bon], ...base, fiche: 'fr-relire',
    enonce: `Un seul mot est mal écrit dans cette phrase. Écris ce mot correctement (seulement ce mot) : « ${fautive} »` };
}

// ═════════════════════════ 4. Épithète et complément du nom ═════════════════════════
// {N:nom} ; {EP@nom:adjectif} épithète ; {CN@nom:groupe} complément du nom ; {AT:…} attribut ; {CP:…} ; {CD:…}
const PHRASES_GN = [
  'Le {N:chat} {EP@chat:noir} {CN@chat:de la voisine} dort {CP:sur le muret}.',
  '{CP:Hier}, ma {EP@tante:vieille} {N:tante} a préparé une {N:tarte} {CN@tarte:aux pommes}.',
  '{CP:Aujourd\'hui}, les {N:élèves} {CN@élèves:de sixième} visitent un {N:musée} {EP@musée:immense}.',
  '{CP:En hiver}, ce {N:pull} {CN@pull:en laine} est {AT:chaud}.',
  '{CP:Au bout de la rue}, on aperçoit une {EP@maison:jolie} {N:maison} {CN@maison:en briques}.',
  '{CP:Dans le jardin}, les {N:roses} {EP@roses:rouges} semblent {AT:fragiles}.',
  '{CP:Depuis lundi}, le {N:vélo} {CN@vélo:de Tom} est {AT:cassé}.',
  'Mon {N:oncle} {CN@oncle:de Liège} conduit un {N:camion} {EP@camion:énorme} {CP:chaque jour}.',
  'La {N:soupe} {CN@soupe:aux légumes} est {AT:brûlante} {CP:ce soir}.',
  '{CP:Au marché}, Papa choisit des {N:tomates} {EP@tomates:mûres} et un {N:melon} {CN@melon:du Portugal}.',
  'Le {N:chien} {CN@chien:du fermier} garde les {N:moutons} {EP@moutons:blancs} {CP:jour et nuit}.',
  '{CP:Ce soir}, ma {N:sœur} porte une {N:robe} {EP@robe:longue} {CN@robe:à fleurs}.',
  'Les {N:feuilles} {CN@feuilles:du chêne} deviennent {AT:jaunes} {CP:en automne}.',
  '{CP:Cette nuit}, un {EP@orage:violent} {N:orage} a secoué la {N:maison} {CN@maison:de mes grands-parents}.',
  '{CP:Sur la table}, le {N:gâteau} {CN@gâteau:au chocolat} semble {AT:délicieux}.',
  'Notre {N:professeur} {CN@professeur:de gymnastique} organise un {N:tournoi} {EP@tournoi:amusant} {CP:vendredi}.',
  'Le {EP@pont:vieux} {N:pont} {CN@pont:de pierre} traverse la {N:rivière} {EP@rivière:calme}.',
  '{CP:Ce soir}, les {N:enfants} {EP@enfants:sages} reçoivent une {N:récompense} {CN@récompense:en chocolat}.',
  '{CP:Depuis la place}, la {N:tour} {CN@tour:de l\'église} paraît {AT:immense}.',
  '{CP:Le dimanche}, mon {N:grand-père} lit le {N:journal} {CN@journal:du village} dans son {N:fauteuil} {EP@fauteuil:préféré}.',
  'Une {N:abeille} {EP@abeille:curieuse} vole autour du {N:pot} {CN@pot:de confiture} {CP:depuis dix minutes}.',
  '{CP:Ce samedi}, le {N:train} {CN@train:pour Ostende} est {AT:complet}.',
  '{CP:Depuis l\'été}, les {N:murs} {CN@murs:de ma chambre} sont {AT:bleus}.',
  '{CP:Pendant les vacances}, Tom a trouvé une {N:pièce} {EP@pièce:ancienne} {CN@pièce:en argent}.',
  'La {N:boulangère} {EP@boulangère:souriante} vend du {N:pain} {EP@pain:frais} {CP:chaque matin}.',
  'Le {N:jardin} {CN@jardin:de Mamie} devient {AT:magnifique} {CP:au printemps}.',
  '{CP:Hier}, ma {N:mère} a acheté une {N:lampe} {EP@lampe:moderne} {CN@lampe:en verre}.',
  '{CP:Depuis midi}, les {N:nuages} {EP@nuages:gris} annoncent un {N:orage} {EP@orage:terrible}.',
  '{CP:Aujourd\'hui}, le {N:directeur} {CN@directeur:de l\'école} paraît {AT:inquiet}.',
  '{CP:Avant de sortir}, j\'ai mis mon {N:bonnet} {CN@bonnet:en laine} et mes {N:gants} {EP@gants:chauds}.',
  '{CP:Selon ma sœur}, ce {N:livre} {CN@livre:d\'aventures} est {AT:passionnant}.',
  'Les {N:poules} {CN@poules:de la ferme} pondent des {N:œufs} {EP@œufs:frais} {CP:tous les jours}.',
  'Une {EP@voiture:petite} {N:voiture} {CN@voiture:de sport} attend {CP:devant la maison}.',
  'Mon {N:ami} {EP@ami:fidèle} reste {AT:calme} {CP:pendant l\'orage}.',
  '{CP:À la plage}, les {N:enfants} construisent un {EP@château:grand} {N:château} {CN@château:de sable}.',
  'L\'{N:eau} {CN@eau:de la piscine} semble {AT:froide} {CP:ce matin}.',
  'Le {N:facteur} {CN@facteur:du quartier} apporte un {EP@colis:gros} {N:colis} {CP:à midi}.',
  '{CP:Cette année}, les {N:fraises} {CN@fraises:du jardin} sont {AT:sucrées}.',
  'Le {EP@lapin:petit} {N:lapin} {CN@lapin:de Zoé} mange une {N:carotte} {CP:chaque soir}.',
  '{CP:Soudain}, une {EP@odeur:délicieuse} {N:odeur} {CN@odeur:de crêpes} remplit la {N:cuisine}.',
  '{CP:Dès cinq heures}, le {N:boulanger} {EP@boulanger:courageux} prépare des {N:croissants} {CN@croissants:au beurre}.',
  'Mes {N:cousins} {CN@cousins:de Namur} semblent {AT:heureux} {CP:depuis leur arrivée}.',
];
const FONCTIONS_GN = { EP: 'épithète', CN: 'complément du nom', AT: 'attribut du sujet', CP: 'complément de phrase', CD: 'complément direct du verbe' };
function analyserGN(src) {
  const unites = [];
  const texte = src.replace(/\{([A-Z]+)(?:@([^:{}]+))?:([^{}]+)\}/g, (_, code, nom, mot) => { unites.push({ code, nom, mot }); return mot; });
  return { texte, unites };
}
function explGN(u) {
  switch (u.code) {
    case 'EP': return `« ${u.mot} » est un adjectif épithète du nom « ${u.nom} » : il est placé juste à côté du nom (avant ou après), sans verbe entre les deux, et il s'accorde avec lui.`;
    case 'CN': return `« ${u.mot} » est un complément du nom « ${u.nom} » : ce groupe précise le nom et commence par une préposition (de, à, en, pour…). On peut le supprimer.`;
    case 'AT': return `« ${u.mot} » est un attribut du sujet : il est relié au sujet par un verbe comme être, sembler, devenir, paraître ou rester.`;
    case 'CP': return `« ${u.mot} » est un complément de phrase : on peut le déplacer et le supprimer.`;
    default: return `« ${u.mot} » est un complément direct du verbe.`;
  }
}

function frFonctionsGN(modele, rng) {
  const i = rng.int(0, PHRASES_GN.length - 1);
  const { texte, unites } = analyserGN(PHRASES_GN[i]);
  const groupes = unites.filter((u) => u.code !== 'N');
  const noms = unites.filter((u) => u.code === 'N').map((u) => u.mot);
  const cibles = groupes.filter((u) => ['EP', 'CN', 'AT'].includes(u.code));
  const forme = choixForme(rng, modele, ['fonction', 'fonction', 'trouver', 'nom', 'grille']);
  const phrase = `Dans la phrase « ${texte} »`;
  if (forme === 'fonction') {
    const u = rng.pick(cibles);
    const q = qcm(rng, FONCTIONS_GN[u.code], Object.values(FONCTIONS_GN), { prio: rng.shuffle(['épithète', 'complément du nom', 'attribut du sujet']) });
    return { _signature: `fonction|${i}|${u.mot}`, ...q, enonce: `${phrase}, quelle est la fonction de « ${u.mot} » ?`, explication: explGN(u) };
  }
  if (forme === 'trouver') {
    const u = rng.pick(cibles.filter((x) => x.code !== 'AT'));
    if (!u || groupes.filter((x) => x.code === u.code && x.nom === u.nom).length !== 1) return null;
    const autres = groupes.filter((x) => x !== u).map((x) => x.mot);
    const q = qcm(rng, u.mot, autres);
    if (!q) return null;
    const quoi = u.code === 'EP' ? `quel adjectif est épithète du nom « ${u.nom} »` : `quel groupe est complément du nom « ${u.nom} »`;
    return { _signature: `trouver|${i}|${u.mot}|${q.choix.map(bas).sort().join(',')}`, ...q, enonce: `${phrase}, ${quoi} ?`, explication: explGN(u) };
  }
  if (forme === 'nom') {
    const u = rng.pick(cibles.filter((x) => x.code !== 'AT'));
    if (!u) return null;
    const q = qcm(rng, u.nom, noms.filter((x) => x !== u.nom));
    if (!q) return null;
    const quoi = u.code === 'EP' ? `l'adjectif épithète « ${u.mot} »` : `le complément du nom « ${u.mot} »`;
    return { _signature: `nom|${i}|${u.mot}`, ...q, enonce: `${phrase}, quel nom ${quoi} complète-t-il ?`, explication: explGN(u) };
  }
  // grille
  const lignes = rng.shuffle(groupes).slice(0, 4);
  const codes = [...new Set(lignes.map((u) => u.code))];
  if (lignes.length < 3 || codes.length < 2 || !lignes.some((u) => u.code === 'EP' || u.code === 'CN')) return null;
  const cols = ['EP', 'CN', 'AT', 'CP', 'CD'].filter((c) => codes.includes(c));
  return {
    _signature: `grille|${i}|${lignes.map((u) => u.mot).sort().join(',')}`, type: 'grille',
    lignes: lignes.map((u) => `« ${u.mot} »`), colonnes: cols.map((c) => FONCTIONS_GN[c]),
    reponse: lignes.map((u) => cols.indexOf(u.code)), points: lignes.length,
    enonce: `${phrase}, indique la fonction de chaque mot ou groupe.`,
    explication: lignes.map((u) => `« ${u.mot} » : ${FONCTIONS_GN[u.code]}${u.nom ? ` du nom « ${u.nom} »` : ''}`.replace('complément du nom du nom', 'complément du nom').replace('épithète du nom', 'épithète du nom')).join(' ; ') + '.',
  };
}

// ═════════════════════════ 5. Sujet, prédicat, complément de phrase ═════════════════════════
// [complément de phrase, position ('d' début, 'f' fin, '' aucun), sujet, verbe, suite du prédicat]
const PHRASES_PRED = [
  ['chaque soir', 'd', 'mon frère', 'lit', 'une BD'], ['ce matin', 'f', 'les élèves', 'visitent', 'le musée des sciences'],
  ['', '', 'le bébé', 'dort', ''], ['en hiver', 'd', 'la neige', 'recouvre', 'les montagnes'],
  ['pendant les vacances', 'f', 'ma grand-mère', 'tricote', 'une écharpe'], ['', '', 'le chat de Léa', 'est', 'très gourmand'],
  ['demain', 'd', 'nous', 'préparerons', 'un gâteau'], ['en quelques minutes', 'f', 'les pompiers', 'ont éteint', "l'incendie"],
  ["après l'école", 'd', 'Tom', 'téléphone', 'à sa cousine'], ['tous les soirs', 'f', 'mes parents', 'regardent', 'les informations'],
  ['le samedi', 'd', 'le marchand', 'vend', 'des fruits et des légumes'], ['', '', 'le soleil', 'brille', ''],
  ['', '', 'cette histoire', 'semble', 'incroyable'], ['pendant la récréation', 'd', 'les enfants', 'jouent', 'au ballon'],
  ['vers dix heures', 'f', 'le facteur', 'apporte', 'le courrier'], ['au printemps', 'd', 'les hirondelles', 'reviennent', ''],
  ['', '', 'ma sœur', 'deviendra', 'vétérinaire'], ['hier soir', 'd', "l'orage", 'a réveillé', 'toute la famille'],
  ['dès cinq heures', 'f', 'le boulanger', 'prépare', 'les croissants'], ['chaque mercredi', 'd', 'Zoé', 'apprend', 'le piano'],
  ['en automne', 'f', 'les feuilles des arbres', 'tombent', ''], ['le soir', 'f', 'le professeur', 'corrige', 'nos cahiers'],
  ['ce week-end', 'd', 'mes cousins', 'ont construit', 'une cabane'], ['', '', 'cette tarte aux pommes', 'est', 'délicieuse'],
  ['dans la cour', 'd', 'le chien', 'aboie', ''], ['avant le match', 'f', 'les joueurs', 'écoutent', "l'entraîneur"],
  ['à la ferme', 'd', 'Léa', 'nourrit', 'les lapins'], ['', '', 'mon oncle', 'parle', 'à ses voisins'],
  ['dans un mois', 'd', 'nous', 'partirons', ''], ['pendant la visite', 'f', 'les touristes', 'photographient', 'la cathédrale'],
  ['le matin', 'd', 'Papa', 'boit', 'un café'], ['ce soir', 'f', 'le petit garçon', 'paraît', 'fatigué'],
  ['cet été', 'd', 'mes grands-parents', 'visiteront', 'la Grèce'], ['', '', 'les abeilles', 'fabriquent', 'du miel'],
  ['avant de dormir', 'd', 'Hugo', 'lit', 'une histoire'], ['dans la grange', 'd', 'le chat', 'attrape', 'une souris'],
  ['tous les matins', 'd', 'la voisine', 'promène', 'son chien'], ['', '', 'les spectateurs', 'applaudissent', 'les acrobates'],
  ['pendant la nuit', 'd', 'la neige', 'est tombée', ''], ['depuis ce matin', 'd', 'le vent', 'secoue', 'les arbres'],
  ['au début du cours', 'f', 'la maîtresse', 'distribue', 'les dictionnaires'], ['à midi', 'd', 'les élèves', 'mangent', 'leurs tartines'],
  ['à dix-huit heures', 'f', 'le gardien', 'ferme', 'le parc'], ['', '', 'mes amis', 'sont', 'contents'],
];
function phrasePred(cp, pos, s, p) {
  if (pos === 'd') return `${maj(cp)}, ${s} ${p}.`;
  if (pos === 'f') return `${maj(s)} ${p} ${cp}.`;
  return `${maj(s)} ${p}.`;
}
function frPredicat(modele, rng) {
  const i = rng.int(0, PHRASES_PRED.length - 1);
  const [cp, pos, s, v, suite] = PHRASES_PRED[i];
  const p = suite ? `${v} ${suite}` : v;
  const texte = phrasePred(cp, pos, s, p);
  const aff = (g) => (texte.startsWith(maj(g)) ? maj(g) : g); // tel qu'écrit dans la phrase
  const forme = choixForme(rng, modele, ['predicat', 'predicat', 'sujet', 'cp', 'supprimer', 'grille']);
  const phrase = `Dans la phrase « ${texte} »`;
  const explP = `Le prédicat est « ${p} » : c'est ce qu'on dit du sujet « ${s} ». Il contient le verbe conjugué « ${v} »${suite ? ' et les mots qui le complètent' : ''}. On ne peut ni le déplacer ni le supprimer.`;
  const deplacee = pos === 'd' ? `${maj(s)} ${p} ${cp}.` : `${maj(cp)}, ${s} ${p}.`;
  const explCP = cp ? `« ${aff(cp)} » est un complément de phrase : on peut le déplacer (« ${deplacee} ») et le supprimer (« ${maj(s)} ${p}. »).` : '';
  const explS = `« ${aff(s)} » est le groupe sujet : c'est de lui qu'on parle ; on peut l'encadrer par « c'est … qui » ou « ce sont … qui ».`;
  if (forme === 'predicat') {
    const pool = [aff(s), cp ? aff(cp) : null, suite ? v : null, pos === 'f' ? `${p} ${cp}` : null, suite ? `${s} ${v}` : null].filter(Boolean);
    const q = qcm(rng, p, pool);
    if (!q) return null;
    return { _signature: `predicat|${i}`, ...q, enonce: `${phrase}, quel est le groupe prédicat ?`, explication: explP };
  }
  if (forme === 'sujet') {
    const pool = [p, cp ? aff(cp) : null, suite ? `${s} ${v}` : null, suite ? v : null].filter(Boolean);
    const q = qcm(rng, aff(s), pool);
    if (!q) return null;
    return { _signature: `sujet|${i}`, ...q, enonce: `${phrase}, quel est le groupe sujet ?`, explication: explS };
  }
  if (forme === 'cp') {
    if (!cp) return null;
    const q = qcm(rng, aff(cp), [aff(s), p, suite ? v : null, suite || null].filter(Boolean));
    if (!q) return null;
    return { _signature: `cp|${i}`, ...q, enonce: `${phrase}, quel groupe est le complément de phrase (on peut le déplacer ou le supprimer) ?`, explication: explCP };
  }
  if (forme === 'supprimer') {
    if (!cp) return null;
    const bonne = `${maj(s)} ${p}.`;
    const pool = [pos === 'd' ? `${maj(cp)}, ${s}.` : `${maj(s)} ${cp}.`, pos === 'd' ? `${maj(cp)}, ${p}.` : `${maj(p)} ${cp}.`];
    if (suite) pool.push(pos === 'd' ? `${maj(cp)}, ${s} ${v}.` : `${maj(s)} ${v} ${cp}.`);
    const q = qcm(rng, bonne, pool);
    if (!q) return null;
    return { _signature: `supprimer|${i}`, ...q, enonce: `On supprime le complément de phrase de « ${texte} ». Quelle phrase obtient-on ?`, explication: explCP };
  }
  // grille
  if (!cp) return null;
  const lignes = rng.shuffle([['S', aff(s)], ['P', p], ['CP', aff(cp)]]);
  const cols = ['groupe sujet', 'groupe prédicat', 'complément de phrase'];
  const idx = { S: 0, P: 1, CP: 2 };
  return {
    _signature: `grille|${i}`, type: 'grille', lignes: lignes.map(([, g]) => `« ${g} »`), colonnes: cols,
    reponse: lignes.map(([c]) => idx[c]), points: 3,
    enonce: `${phrase}, indique le rôle de chaque groupe.`,
    explication: `${explS} ${explP} ${explCP}`,
  };
}

// ═════════════════════════ 6. Ponctuation ═════════════════════════
const SIGNES = {
  '.': 'le point (.)', ',': 'la virgule (,)', ':': 'les deux-points (:)', '?': "le point d'interrogation (?)",
  '!': "le point d'exclamation (!)", '«»': 'les guillemets (« »)', '–': 'le tiret (–)',
};
const LISTES = {
  cartable: ['un cahier', 'une trousse', 'une règle', 'un livre', 'une gomme', 'un compas', 'un agenda'],
  fruits: ['des pommes', 'des poires', 'des fraises', 'des cerises', 'des prunes', 'des bananes', 'des abricots'],
  ferme: ['des vaches', 'des poules', 'des cochons', 'des moutons', 'des chèvres', 'des canards', 'des lapins'],
  hiver: ['un bonnet', 'des gants', 'une écharpe', 'un manteau', 'des bottes'],
  crepes: ['de la farine', 'du lait', 'des œufs', 'du sucre', 'du beurre', 'une pincée de sel'],
  sport: ['un short', 'un tee-shirt', 'des baskets', 'une gourde', 'une serviette'],
};
const CADRES_ENUM = [
  ['cartable', 'Dans mon cartable, il y a L.'], ['fruits', 'Au marché, Maman a acheté L.'], ['ferme', 'À la ferme, nous avons vu L.'],
  ['hiver', 'Pour sortir dans la neige, Tom met L.'], ['sport', 'Dans mon sac de sport, je range L.'], ['fruits', 'Dans la corbeille, il reste L.'],
  ['crepes', 'Mamie mélange L.'],
];
const CADRES_DP = [
  ['crepes', 'Pour faire des crêpes, voici les ingrédients L.'], ['cartable', 'Voici ce que tu dois apporter L.'], ['sport', 'Prépare tes affaires de sport L.'],
  ['fruits', 'Voici ma liste de courses L.'], ['ferme', 'Voici les animaux de la ferme L.'], ['hiver', 'En hiver, je porte tout ceci L.'],
];
const PAROLES = [
  ['Tu viens jouer avec nous', '?', 'demande'], ['Où as-tu caché le ballon', '?', 'demande'], ['Quelle heure est-il', '?', 'demande'],
  ['As-tu fini tes devoirs', '?', 'demande'], ['Pourquoi le ciel est-il bleu', '?', 'demande'], ['Est-ce que la piscine est ouverte', '?', 'demande'],
  ['Attention, le bus arrive', '!', 'crie'], ['Quel magnifique arc-en-ciel', '!', "s'exclame"], ['Au secours', '!', 'crie'],
  ['Bravo, tu as gagné', '!', "s'exclame"], ['Comme il fait chaud aujourd\'hui', '!', "s'exclame"], ['Quelle belle surprise', '!', "s'exclame"],
  ['Le repas est prêt', '.', 'annonce'], ['Je pars à la piscine', '.', 'annonce'], ['Nous allons visiter un château', '.', 'explique'],
  ['Il faut ranger la classe', '.', 'rappelle'], ['Le train partira à midi', '.', 'annonce'], ['Mon chat a eu trois chatons', '.', 'raconte'],
];
const LOCUTEURS = ['Léa', 'Tom', 'Maman', 'le maître', 'Hugo', 'Grand-père', 'la directrice', 'Zoé'];
// Réponses possibles pour chacune des 6 premières PAROLES (les questions) : la réponse doit aller avec la question.
const REPONSES = [
  ["Oui, j'arrive !", 'Non, pas maintenant.', 'Plus tard, peut-être.', 'Oui, avec plaisir !'],
  ['Sous mon lit.', 'Derrière la porte.', 'Je ne sais plus.'],
  ['Il est midi.', 'Il est déjà huit heures !', 'Je ne sais pas.'],
  ['Oui, depuis longtemps !', 'Pas encore.', 'Presque.'],
  ['Je ne sais pas.', 'Bonne question !'],
  ["Oui, jusqu'à six heures.", 'Non, elle est fermée.', 'Je crois que oui.'],
];
const REPONDANTS = [['Tom', 'répond'], ['Léa', 'répond'], ['Papa', 'répond'], ['Zoé', 'répond'], ['Hugo', 'dit']];
const EXPLICATIONS_DP = [
  ['Tom ne peut pas sortir', 'il a de la fièvre'], ['Prends ton parapluie', 'il va pleuvoir'], ['Léa est très contente', 'elle a gagné la course'],
  ['Le chien aboie', "quelqu'un sonne à la porte"], ["Nous restons à l'intérieur", 'il fait trop froid'], ['Mamie sourit', 'ses petits-enfants arrivent'],
  ['La route est fermée', 'un arbre est tombé'], ['Hugo a faim', "il n'a pas mangé à midi"], ['Les fleurs sont fanées', 'personne ne les a arrosées'],
  ['Le match est annulé', 'le terrain est inondé'],
];
const deLoc = (l) => (l.startsWith('le ') ? `du ${l.slice(3)}` : `de ${l}`);
const finSigne = (s) => (s === '.' ? '.' : ` ${s}`);
const enumerer = (items) => `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`;

function frPonctuation(modele, rng) {
  const forme = choixForme(rng, modele, ['virgule', 'deux_points', 'parole_dp', 'parole_fin', 'guillemets', 'tiret', 'explication', 'correcte_enum', 'correcte_parole']);
  const choixSignes = (bonne, exclus = []) => {
    const pool = ['.', ',', ':', '?', '!'].filter((x) => x !== bonne && !exclus.includes(x)).map((x) => SIGNES[x]);
    return qcm(rng, SIGNES[bonne], pool);
  };
  if (forme === 'virgule' || forme === 'deux_points' || forme === 'correcte_enum') {
    const cadres = forme === 'deux_points' ? CADRES_DP : CADRES_ENUM;
    const iC = rng.int(0, cadres.length - 1);
    const [l, t] = cadres[iC];
    const items = rng.shuffle(LISTES[l]).slice(0, rng.int(3, 4));
    const sig = `${forme}|${iC}|${items.join(',')}`;
    if (forme === 'virgule') {
      const trou = t.replace('L', `${items[0]}___ ${enumerer(items.slice(1))}`);
      const complete = t.replace('L', enumerer(items));
      return { _signature: sig, ...choixSignes(','), enonce: `Quel signe faut-il à la place de ___ ? « ${trou} »`,
        explication: `« ${complete} » Dans une énumération, on sépare les éléments par des virgules ; le dernier est relié par « et ».` };
    }
    if (forme === 'deux_points') {
      const trou = t.replace(' L', `___ ${enumerer(items)}`);
      const complete = t.replace(' L', ` : ${enumerer(items)}`);
      // Pas de virgule parmi les choix : « Voici ma liste de courses, des poires… » pourrait se défendre.
      return { _signature: sig, ...choixSignes(':', [',']), enonce: `Quel signe faut-il à la place de ___ ? « ${trou} »`,
        explication: `« ${complete} » Les deux-points annoncent l'énumération qui suit.` };
    }
    const bonne = t.replace('L', enumerer(items));
    const [verbe, objets] = [t.slice(0, t.indexOf(' L')), items];
    const faux = [
      `${verbe} ${objets.slice(0, -1).join(' ')} et ${objets.at(-1)}.`,
      `${verbe}, ${enumerer(objets)}.`,
      `${verbe} ${objets[0]} ${objets.slice(1, -1).join(', ')}, et ${objets.at(-1)}.`.replace(/ {2,}/g, ' '),
    ]; // (pas d'énumération sans « et » : « des pommes, des poires, des fraises. » est aussi correct)
    const q = qcm(rng, bonne, faux);
    if (!q) return null;
    return { _signature: sig, ...q, enonce: 'Quelle phrase est correctement ponctuée ?',
      explication: `« ${bonne} » Dans une énumération, une virgule sépare les éléments, sauf les deux derniers, reliés par « et ». Pas de virgule entre le verbe et son complément.` };
  }
  if (['parole_dp', 'parole_fin', 'guillemets', 'correcte_parole'].includes(forme)) {
    const iP = rng.int(0, PAROLES.length - 1);
    const [parole, signe, verbe] = PAROLES[iP];
    const loc = rng.pick(LOCUTEURS);
    const intro = `${maj(loc)} ${verbe}`;
    const complete = `${intro} : « ${parole}${finSigne(signe)} »`;
    const sig = `${forme}|${iP}|${loc}`;
    if (forme === 'parole_dp') {
      return { _signature: sig, ...choixSignes(':', [signe, ',']), enonce: `Quel signe faut-il à la place de ___ ? ${intro}___ « ${parole}${finSigne(signe)} »`,
        explication: `${complete} Les deux-points annoncent les paroles de quelqu'un ; les paroles sont encadrées par des guillemets.` };
    }
    if (forme === 'parole_fin') {
      const exclus = signe === '.' ? ['!'] : signe === '!' ? ['.'] : [];
      const regle = { '?': 'La phrase pose une question : elle se termine par un point d\'interrogation.', '!': 'La phrase exprime un sentiment fort (surprise, joie, peur…) : elle se termine par un point d\'exclamation.', '.': 'La phrase donne simplement une information : elle se termine par un point.' }[signe];
      return { _signature: sig, ...choixSignes(signe, exclus), enonce: `Quel signe faut-il à la place de ___ ? ${intro} : « ${parole}___ »`,
        explication: `${complete} ${regle}` };
    }
    if (forme === 'guillemets') {
      const q = qcm(rng, SIGNES['«»'], ['les parenthèses ( )', 'les points de suspension (…)', SIGNES[':'], SIGNES['–']]);
      return { _signature: sig, ...q, enonce: `Quels signes faut-il placer autour des paroles ${deLoc(loc)} ? ${intro} : ___ ${parole}${finSigne(signe)} ___`,
        explication: `${complete} Les guillemets encadrent les paroles rapportées.` };
    }
    const autreSigne = signe === '?' ? '.' : '?';
    const faux = [
      `${intro} « ${parole}${finSigne(signe)} »`,
      `${intro} : ${parole}${finSigne(signe)}`,
      `${intro} : « ${parole}${finSigne(autreSigne)} »`,
      `${intro}, ${parole}${finSigne(signe)}`,
    ];
    const q = qcm(rng, complete, faux);
    return { _signature: sig, ...q, enonce: 'Quelle phrase est correctement ponctuée ?',
      explication: `${complete} Les deux-points annoncent les paroles, les guillemets les encadrent et le signe de fin correspond au type de phrase.` };
  }
  if (forme === 'tiret') {
    const iP = rng.int(0, 5); // questions
    const [parole] = PAROLES[iP];
    const loc = rng.pick(LOCUTEURS);
    const iR = rng.int(0, REPONSES[iP].length - 1);
    const [rep, verbe] = rng.pick(REPONDANTS.filter(([n]) => bas(n) !== bas(loc)));
    const repo = REPONSES[iP][iR];
    const sansFin = repo.slice(0, -1).replace(/ $/, '');
    const fin = repo.endsWith('!') ? ' !' : '.';
    const rendu = (x) => `– ${parole} ? demande ${loc}. ${x} ${sansFin}${fin === '.' ? ',' : fin} ${verbe} ${rep}.`;
    const q = qcm(rng, SIGNES['–'], [SIGNES[':'], SIGNES['«»'], SIGNES[','], SIGNES['.']]);
    return { _signature: `tiret|${iP}|${loc}|${iR}|${rep}`, ...q,
      enonce: `Dans ce dialogue, quel signe faut-il à la place de ___ ? ${rendu('___')}`,
      explication: `${rendu('–')} Dans un dialogue, le tiret indique qu'un autre personnage prend la parole.` };
  }
  // explication
  const iE = rng.int(0, EXPLICATIONS_DP.length - 1);
  const [a, b] = EXPLICATIONS_DP[iE];
  // Ni virgule, ni tiret, ni points de suspension parmi les choix : ils pourraient aussi se défendre.
  const q = qcm(rng, SIGNES[':'], [SIGNES['?'], SIGNES['!'], SIGNES['«»']]);
  return { _signature: `explication|${iE}`, ...q,
    enonce: `Quel signe peut annoncer l'explication ? « ${a}___ ${b}. »`,
    explication: `« ${a} : ${b}. » Les deux-points annoncent une explication (la cause de ce qui précède).` };
}

// ═════════════════════════ 7. Adverbes en -ment ═════════════════════════
// [adjectif, féminin (si règle « féminin + ment »), adverbe, classe, phrase avec ___]
const ADVERBES = [
  ['doux', 'douce', 'doucement', 'fem', 'Le bébé dort : parle ___ !'], ['heureux', 'heureuse', 'heureusement', 'fem', '___, il ne pleut plus.'],
  ['léger', 'légère', 'légèrement', 'fem', 'La porte est ___ ouverte.'], ['fier', 'fière', 'fièrement', 'fem', 'Tom montre ___ sa médaille.'],
  ['sérieux', 'sérieuse', 'sérieusement', 'fem', 'Léa travaille ___.'], ['complet', 'complète', 'complètement', 'fem', 'Le gâteau a ___ brûlé.'],
  ['discret', 'discrète', 'discrètement', 'fem', 'Le chat entre ___ dans la cuisine.'], ['franc', 'franche', 'franchement', 'fem', 'Dis-moi ___ ce que tu penses.'],
  ['vif', 'vive', 'vivement', 'fem', 'Le public applaudit ___.'], ['attentif', 'attentive', 'attentivement', 'fem', 'Les élèves écoutent ___ la consigne.'],
  ['long', 'longue', 'longuement', 'fem', 'Il a réfléchi ___ avant de répondre.'], ['fou', 'folle', 'follement', 'fem', 'Les enfants s\'amusent ___.'],
  ['frais', 'fraîche', 'fraîchement', 'fem', 'Le pain est ___ sorti du four.'],
  ['facile', null, 'facilement', 'e', 'Tom a gagné la course ___.'], ['rapide', null, 'rapidement', 'e', 'Le guépard court ___.'],
  ['calme', null, 'calmement', 'e', 'Le pilote parle ___ aux passagers.'], ['tranquille', null, 'tranquillement', 'e', 'Le chat dort ___ au soleil.'],
  ['sage', null, 'sagement', 'e', 'Les enfants attendent ___ leur tour.'], ['triste', null, 'tristement', 'e', 'Le clown sourit ___.'],
  ['simple', null, 'simplement', 'e', 'Explique-moi ___ la règle du jeu.'], ['rare', null, 'rarement', 'e', 'Il neige ___ à la mer.'],
  ['habile', null, 'habilement', 'e', 'Le jongleur lance ___ ses balles.'], ['large', null, 'largement', 'e', 'Nous avons ___ le temps.'],
  ['vrai', null, 'vraiment', 'voy', 'Ce film est ___ drôle.'], ['poli', null, 'poliment', 'voy', 'Hugo salue ___ la voisine.'],
  ['joli', null, 'joliment', 'voy', 'La table est ___ décorée.'], ['absolu', null, 'absolument', 'voy', 'Tu dois ___ lire ce livre.'],
  ['aisé', null, 'aisément', 'voy', 'On reconnaît ___ sa voix.'], ['infini', null, 'infiniment', 'voy', 'Je te remercie ___.'],
  ['passionné', null, 'passionnément', 'voy', 'Léa lit ___ son roman.'],
  ['bruyant', null, 'bruyamment', 'ant', 'Les enfants entrent ___ dans la classe.'], ['courant', null, 'couramment', 'ant', 'Mon cousin parle ___ l\'anglais.'],
  ['méchant', null, 'méchamment', 'ant', 'Le loup regarde ___ les moutons.'], ['puissant', null, 'puissamment', 'ant', 'Le moteur gronde ___.'],
  ['élégant', null, 'élégamment', 'ant', 'La danseuse saute ___.'], ['brillant', null, 'brillamment', 'ant', 'Zoé a ___ réussi son examen.'],
  ['constant', null, 'constamment', 'ant', 'Mon petit frère bouge ___.'], ['abondant', null, 'abondamment', 'ant', 'Il a plu ___ cette nuit.'],
  ['prudent', null, 'prudemment', 'ent', 'Papa conduit ___ sous la pluie.'], ['patient', null, 'patiemment', 'ent', 'Nous attendons ___ le bus.'],
  ['évident', null, 'évidemment', 'ent', '___, tu es invité à ma fête !'], ['récent', null, 'récemment', 'ent', 'Nous avons ___ déménagé.'],
  ['fréquent', null, 'fréquemment', 'ent', 'Il pleut ___ en Belgique.'], ['violent', null, 'violemment', 'ent', 'Le vent souffle ___.'],
  ['intelligent', null, 'intelligemment', 'ent', 'Le renard a agi ___.'], ['différent', null, 'différemment', 'ent', 'Chaque élève dessine ___.'],
  ['gentil', null, 'gentiment', 'exc', 'Léa aide ___ sa petite sœur.'], ['bref', null, 'brièvement', 'exc', 'Le maître explique ___ le jeu.'],
  ['énorme', null, 'énormément', 'exc', 'Tom mange ___ de chocolat.'], ['précis', null, 'précisément', 'exc', 'Mesure ___ la longueur du banc.'],
  ['profond', null, 'profondément', 'exc', 'Le bébé dort ___.'], ['intense', null, 'intensément', 'exc', 'Les joueurs s\'entraînent ___.'],
  ['lent', 'lente', 'lentement', 'exc', 'La tortue avance ___.'],
];
function regleAdv([adj, fem, adv, cl]) {
  switch (cl) {
    case 'fem': return `On prend l'adjectif au féminin (${fem}) et on ajoute -ment : ${adv}.`;
    case 'e': return `L'adjectif se termine déjà par -e (${adj}) : on ajoute -ment.`;
    case 'voy': return `L'adjectif se termine par une voyelle (${adj}) : on ajoute -ment au masculin, sans e.`;
    case 'ant': return `L'adjectif se termine par -ant : -ant devient -amment (${adj} → ${adv}).`;
    case 'ent': return `L'adjectif se termine par -ent : -ent devient -emment, qu'on prononce « amment » (${adj} → ${adv}).`;
    default:
      if (adj === 'gentil') return 'Exception : gentil → gentiment (on n\'écrit pas le l).';
      if (adj === 'bref') return 'Exception : bref → brièvement.';
      if (fem) return `Attention : « ${adj} » se termine par -ent, mais il suit la règle générale : ${fem} + -ment → ${adv} (et non « ${adj.slice(0, -3)}emment »).`;
      return `Exception : on écrit -ément (${adj} → ${adv}).`;
  }
}
function fauxAdv([adj, fem, adv, cl]) {
  const r3 = adj.slice(0, -3);
  switch (cl) {
    case 'fem': return [adj + 'ment', fem + 'mment', adj + 'ement', fem.slice(0, -1) + 'ment'];
    case 'e': return [adj.slice(0, -1) + 'ment', adj + 'mment', adj + 'ement'];
    case 'voy': return [adj + 'ement', adj + 'mment', adj.replace(/é$/, 'e') + 'ment'];
    case 'ant': return [r3 + 'emment', adj + 'ement', r3 + 'ament', adj + 'ment'];
    case 'ent': return [r3 + 'amment', adj + 'ement', r3 + 'ement', adj + 'ment'];
    default:
      if (adj === 'gentil') return ['gentillement', 'gentilement', 'gentilment'];
      if (adj === 'bref') return ['brèvement', 'brefment', 'brévement'];
      if (fem) return [r3 + 'emment', r3 + 'amment', adj + 'ment'];
      return [adj.replace(/e$/, '') + 'ement', adj.replace(/e$/, '') + 'ment', adv.replace('ément', 'èment')];
  }
}
function frAdverbes(modele, rng) {
  const i = rng.int(0, ADVERBES.length - 1);
  const it = ADVERBES[i];
  const [adj, fem, adv, , ph] = it;
  const forme = choixForme(rng, modele, ['former', 'choisir', 'phrase', 'phrase_qcm', 'adjectif']);
  const explication = regleAdv(it);
  const complete = maj(ph.replace('___', adv));
  if (forme === 'former') {
    return { _signature: `former|${i}`, type: 'texte_court', souple: false, reponse: [adv], explication,
      enonce: `Forme l'adverbe en -ment à partir de l'adjectif « ${adj} ».` };
  }
  if (forme === 'choisir') {
    const q = qcm(rng, adv, fauxAdv(it));
    if (!q) return null;
    return { _signature: `choisir|${i}`, ...q, explication, enonce: `Quel est l'adverbe formé à partir de l'adjectif « ${adj} » ?` };
  }
  if (forme === 'phrase') {
    return { _signature: `phrase|${i}`, type: 'texte_court', souple: false, reponse: [adv], explication: `« ${complete} » ${explication}`,
      enonce: `Complète avec l'adverbe formé à partir de « ${adj} » : « ${ph} »` };
  }
  if (forme === 'phrase_qcm') {
    const q = qcm(rng, adv, fauxAdv(it));
    if (!q) return null;
    return { _signature: `phrase_qcm|${i}`, ...q, explication: `« ${complete} » ${explication}`,
      enonce: `Complète avec l'adverbe formé à partir de « ${adj} » : « ${ph} »` };
  }
  return { _signature: `adjectif|${i}`, type: 'texte_court', souple: false, reponse: [adj, ...(fem ? [fem] : [])], explication,
    enonce: `De quel adjectif vient l'adverbe « ${adv} » ? Écris l'adjectif au masculin.` };
}

// ═════════════════════════ 8. Participe passé sans auxiliaire / avec avoir ═════════════════════════
// [phrase avec (infinitif), participe passé, genre-nombre, nom avec lequel il s'accorde]
const PP_SEUL = [
  ['Les feuilles (tomber) recouvrent le trottoir.', 'tombé', 'fp', 'feuilles'], ['Léa range ses chaussettes (laver) dans l\'armoire.', 'lavé', 'fp', 'chaussettes'],
  ['Le chat dort sur le pull (oublier) par Tom.', 'oublié', 'ms', 'pull'], ['Les fenêtres (ouvrir) laissent entrer l\'air frais.', 'ouvert', 'fp', 'fenêtres'],
  ['Une lettre (écrire) à la main fait toujours plaisir.', 'écrit', 'fs', 'lettre'], ['Mamie nous sert une tarte (cuire) au four.', 'cuit', 'fs', 'tarte'],
  ['Les joueurs (fatiguer) rentrent au vestiaire.', 'fatigué', 'mp', 'joueurs'], ['Le vase (casser) est dans la poubelle.', 'cassé', 'ms', 'vase'],
  ['Nous avons mangé des pommes (cueillir) le matin même.', 'cueilli', 'fp', 'pommes'], ['Les volets (fermer), la maison semble vide.', 'fermé', 'mp', 'volets'],
  ['Tom porte une chemise (repasser) par son père.', 'repassé', 'fs', 'chemise'], ['Les garçons (déguiser) défilent dans la rue.', 'déguisé', 'mp', 'garçons'],
  ['Il a jeté les journaux (déchirer).', 'déchiré', 'mp', 'journaux'], ['Les cadeaux (emballer) attendent sous le sapin.', 'emballé', 'mp', 'cadeaux'],
  ['La neige (tomber) cette nuit recouvre le jardin.', 'tombé', 'fs', 'neige'], ['Zoé cherche sa poupée (perdre).', 'perdu', 'fs', 'poupée'],
  ['Les devoirs (finir), Hugo peut aller jouer.', 'fini', 'mp', 'devoirs'], ['Un oiseau (blesser) est tombé du nid.', 'blessé', 'ms', 'oiseau'],
  ['Les tables (ranger), la classe paraît plus grande.', 'rangé', 'fp', 'tables'], ['Papa répare la chaise (abîmer).', 'abîmé', 'fs', 'chaise'],
  ['Les photos (prendre) pendant le voyage sont superbes.', 'pris', 'fp', 'photos'], ['Ces fleurs (offrir) par ma tante sentent bon.', 'offert', 'fp', 'fleurs'],
  ['Le dessin (colorier) par ma sœur est affiché au mur.', 'colorié', 'ms', 'dessin'], ['Des chiens (abandonner) attendent un maître au refuge.', 'abandonné', 'mp', 'chiens'],
  ['J\'ai trouvé une pièce (cacher) sous le tapis.', 'caché', 'fs', 'pièce'], ['Les gâteaux (préparer) par Mamie sont délicieux.', 'préparé', 'mp', 'gâteaux'],
  ['Une voiture (garer) devant l\'école gêne le passage.', 'garé', 'fs', 'voiture'], ['Les livres (lire) sont rangés sur l\'étagère.', 'lu', 'mp', 'livres'],
  ['La leçon (apprendre), Léa ferme son cahier.', 'appris', 'fs', 'leçon'], ['Le linge (sécher) est plié sur le lit.', 'séché', 'ms', 'linge'],
  ['Les bougies (éteindre), on mange le gâteau.', 'éteint', 'fp', 'bougies'], ['Les bras (croiser), Tom attend son tour.', 'croisé', 'mp', 'bras'],
];
// [groupe nominal, genre-nombre, fin de phrase (relative), verbes compatibles]
const CD_NOMS = [
  ['les pommes', 'fp', 'sont délicieuses', ['acheter', 'cueillir', 'laver', 'choisir']],
  ['la lettre', 'fs', 'est sur mon bureau', ['écrire', 'recevoir', 'lire', 'poster']],
  ['le gâteau', 'ms', 'est délicieux', ['préparer', 'acheter', 'cuire', 'décorer']],
  ['les fleurs', 'fp', 'sont magnifiques', ['cueillir', 'acheter', 'arroser', 'offrir']],
  ['les livres', 'mp', 'sont passionnants', ['lire', 'acheter', 'choisir', 'prêter']],
  ['les chaussures', 'fp', 'sont trop petites', ['acheter', 'mettre', 'nettoyer', 'choisir']],
  ['la chanson', 'fs', 'est très jolie', ['chanter', 'apprendre', 'écouter', 'écrire']],
  ['les photos', 'fp', 'sont réussies', ['prendre', 'regarder', 'imprimer', 'choisir']],
  ['les clés', 'fp', 'sont dans le tiroir', ['perdre', 'chercher', 'oublier', 'cacher']],
  ["l'histoire", 'fs', 'est passionnante', ['lire', 'raconter', 'écrire', 'inventer']],
  ['les dessins', 'mp', 'sont très beaux', ['faire', 'colorier', 'montrer', 'afficher']],
  ['la voiture', 'fs', 'est rouge', ['laver', 'réparer', 'conduire', 'vendre']],
  ['la cabane', 'fs', 'est solide', ['construire', 'peindre', 'décorer']],
  ['les exercices', 'mp', 'sont faciles', ['faire', 'finir', 'corriger', 'recopier']],
  ['les tartes', 'fp', 'sont délicieuses', ['préparer', 'cuire', 'partager', 'acheter']],
  ['le film', 'ms', 'était amusant', ['regarder', 'voir', 'choisir']],
  ['les jouets', 'mp', 'sont dans le coffre', ['ranger', 'prêter', 'réparer', 'donner']],
  ['la robe', 'fs', 'est très jolie', ['coudre', 'acheter', 'repasser', 'mettre']],
];
const PP_CD = {
  acheter: 'acheté', cueillir: 'cueilli', laver: 'lavé', choisir: 'choisi', écrire: 'écrit', recevoir: 'reçu', lire: 'lu', poster: 'posté',
  préparer: 'préparé', cuire: 'cuit', décorer: 'décoré', arroser: 'arrosé', offrir: 'offert', prêter: 'prêté', mettre: 'mis',
  nettoyer: 'nettoyé', chanter: 'chanté', apprendre: 'appris', écouter: 'écouté', prendre: 'pris', regarder: 'regardé', imprimer: 'imprimé',
  perdre: 'perdu', chercher: 'cherché', oublier: 'oublié', cacher: 'caché', raconter: 'raconté', inventer: 'inventé', faire: 'fait',
  colorier: 'colorié', montrer: 'montré', afficher: 'affiché', réparer: 'réparé', conduire: 'conduit', vendre: 'vendu',
  construire: 'construit', peindre: 'peint', finir: 'fini', corriger: 'corrigé', recopier: 'recopié', partager: 'partagé', voir: 'vu',
  ranger: 'rangé', donner: 'donné', coudre: 'cousu', repasser: 'repassé',
};
const SUJETS_AV = [['je', 'ai'], ['tu', 'as'], ['Léa', 'a'], ['nous', 'avons'], ['vous', 'avez'], ['mes parents', 'ont'], ['Tom', 'a']];

function frPPAccord(modele, rng) {
  const forme = choixForme(rng, modele, ['seul', 'relative', 'pronom', 'apres']);
  const mode = rng.pick(['ecrire', 'choisir']);
  let enonceTxt; let pp; let code; let bonne; let explication; let sig;
  if (forme === 'seul') {
    const i = rng.int(0, PP_SEUL.length - 1);
    const [ph, p, c, nom] = PP_SEUL[i];
    [pp, code] = [p, c];
    bonne = accorderPP(pp, code);
    enonceTxt = ph;
    explication = `« ${ph.replace(/\([^)]+\)/, bonne)} » Employé sans auxiliaire, le participe passé s'accorde comme un adjectif avec le nom « ${nom} » (${GN[code]}).`;
    sig = `seul|${i}`;
  } else {
    const iN = rng.int(0, CD_NOMS.length - 1);
    const [gn, c, fin, verbes] = CD_NOMS[iN];
    const v = rng.pick(verbes);
    const [s, av] = rng.pick(SUJETS_AV);
    [pp, code] = [PP_CD[v], c];
    const pron = c.endsWith('p') ? 'les' : "l'";
    if (forme === 'relative') {
      bonne = accorderPP(pp, code);
      const t = (x) => maj(elider(`${gn} que ${s} ${av} ${x} ${c.endsWith('p') ? fin : fin}.`));
      enonceTxt = t(`(${v})`);
      explication = `« ${t(bonne)} » Le pronom relatif « que » remplace « ${gn} » : c'est le complément direct du verbe (${elider(`${s} ${av} ${pp}`)} quoi ? → « ${gn} »), et il est placé avant le verbe. Avec avoir, le participe passé s'accorde donc avec lui (${GN[code]}).`;
    } else if (forme === 'pronom') {
      bonne = accorderPP(pp, code);
      const t = (x) => elider(`${maj(gn)}, ${s} ${pron}${pron === 'les' ? ' ' : ''}${av} ${x} hier.`);
      enonceTxt = t(`(${v})`);
      explication = `« ${t(bonne)} » Le pronom « ${pron === 'les' ? 'les' : "l'"} » remplace « ${gn} » ; ce complément direct est placé avant le verbe : avec avoir, le participe passé s'accorde avec lui (${GN[code]}).`;
    } else {
      bonne = pp;
      const t = (x) => elider(`Hier, ${s} ${av} ${x} ${gn}.`);
      enonceTxt = t(`(${v})`);
      explication = `« ${t(bonne)} » Avec avoir, le complément direct « ${gn} » est placé après le verbe : le participe passé ne s'accorde pas.`;
      code = 'ms';
    }
    sig = `${forme}|${iN}|${v}|${s}`;
  }
  if (mode === 'ecrire') {
    return { _signature: `${sig}|ecrire`, type: 'texte_court', souple: false, reponse: [bonne], explication,
      enonce: `Écris le participe passé du verbe entre parenthèses, bien accordé : « ${enonceTxt} »` };
  }
  const formes = [...new Set(['ms', 'fs', 'mp', 'fp'].map((x) => accorderPP(pp, x)))];
  const q = qcm(rng, bonne, formes);
  if (!q) return null;
  return { _signature: `${sig}|choisir`, ...q, explication,
    enonce: `Choisis le participe passé bien accordé : « ${enonceTxt.replace(/\([^)]+\)/, '___')} »` };
}

// ═════════════════════════ Étape 2 : outils communs ═════════════════════════
// Prénoms français uniquement (règle du projet).
const FILLES = ['Léa', 'Chloé', 'Manon', 'Camille', 'Juliette', 'Mathilde', 'Pauline', 'Agathe', 'Amélie', 'Élise', 'Margaux', 'Clémence'];
const GARCONS = ['Louis', 'Arthur', 'Jules', 'Victor', 'Antoine', 'Baptiste', 'Maxime', 'Romain', 'Mathis', 'Quentin', 'Étienne', 'Émile', 'Clément'];
function personnage(rng) {
  const f = rng.next() < 0.5;
  return { nom: rng.pick(f ? FILLES : GARCONS), f };
}
// Gabarit : {P} prénom, {Il}/{il} pronom, {e} accord féminin, {lui} lui/elle.
// [a|b] : a pour un narrateur interne (« je »), b pour un narrateur externe (« il / elle »).
function rendreGabarit(t, perso, interne = false) {
  return t
    .replace(/\[([^|\]]*)\|([^\]]*)\]/g, (_, a, b) => (interne ? a : b))
    .replace(/\{P\}/g, perso.nom)
    .replace(/\{Il\}/g, perso.f ? 'Elle' : 'Il')
    .replace(/\{il\}/g, perso.f ? 'elle' : 'il')
    .replace(/\{lui\}/g, perso.f ? 'elle' : 'lui')
    .replace(/\{e\}/g, perso.f ? 'e' : '');
}
const sansAcc = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const listeEt = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} et ${l.at(-1)}`);
// QCM à choix fixes (ordre conservé).
function qcmFixe(bonne, choix) { return { type: 'qcm', choix: [...choix], reponse: choix.indexOf(bonne) }; }

// ═════════════════════════ 9. Sous-classes de déterminants et de pronoms ═════════════════════════
const CLASSES_FINES = {
  'D.def': 'article défini', 'D.ind': 'article indéfini', 'D.part': 'article partitif',
  'D.poss': 'déterminant possessif', 'D.dem': 'déterminant démonstratif', 'D.num': 'déterminant numéral cardinal',
  'D.int': 'déterminant interrogatif', 'D.exc': 'déterminant exclamatif', 'D.indef': 'déterminant indéfini',
  'P.pers': 'pronom personnel', 'P.poss': 'pronom possessif', 'P.dem': 'pronom démonstratif',
  'P.num': 'pronom numéral', 'P.indef': 'pronom indéfini',
};
const EXPL_CLASSES = {
  'D.def': "c'est un article défini (le, la, l', les) : il accompagne un nom qui désigne quelque chose de précis, de connu.",
  'D.ind': "c'est un article indéfini (un, une, des) : il accompagne un nom qui désigne quelque chose de non précisé.",
  'D.part': "c'est un article partitif (du, de la, de l') : il présente une quantité qu'on ne compte pas (du pain, de l'eau).",
  'D.poss': "c'est un déterminant possessif (mon, ton, son, notre, votre, leur, mes…) : placé devant un nom, il indique à qui appartient la chose.",
  'D.dem': "c'est un déterminant démonstratif (ce, cet, cette, ces) : placé devant un nom, il montre ce dont on parle.",
  'D.num': "c'est un déterminant numéral cardinal (deux, trois, vingt…) : placé devant un nom, il donne le nombre exact.",
  'D.int': "c'est un déterminant interrogatif (quel, quelle, quels, quelles) : placé devant un nom, il sert à poser une question.",
  'D.exc': "c'est un déterminant exclamatif (quel, quelle, quels, quelles) : placé devant un nom, il exprime un sentiment fort dans une phrase exclamative.",
  'D.indef': "c'est un déterminant indéfini (chaque, plusieurs, quelques, aucun, certains…) : placé devant un nom, il donne une idée vague de la quantité.",
  'P.pers': "c'est un pronom personnel (je, tu, il, nous, me, te, le, la, les, lui, leur, moi…) : il désigne une personne ou remplace un nom, sans l'accompagner.",
  'P.poss': "c'est un pronom possessif (le mien, la tienne, les nôtres…) : il remplace un groupe nominal et indique à qui appartient la chose.",
  'P.dem': "c'est un pronom démonstratif (celui, celle, ceux, celui-ci, cela, ça…) : il remplace un nom en le montrant.",
  'P.num': "c'est un pronom numéral : le nombre est employé seul, sans nom, et remplace un groupe nominal.",
  'P.indef': "c'est un pronom indéfini (quelqu'un, personne, rien, chacun, plusieurs, certains, tout…) : il désigne des personnes ou des choses de façon vague, sans nom après lui.",
};
const PHRASES_FINES = [
  '{D.poss:Mon} frère a perdu {D.poss:ses} clés dans {D.def:le} jardin.',
  '{D.dem:Cette} maison appartient à {D.poss:nos} voisins.',
  '{D.int:Quel} livre préfères-{P.pers:tu} ?',
  '{D.exc:Quelle} belle surprise !',
  '{D.num:Trois} chats dorment sur {D.def:le} muret.',
  '{D.indef:Chaque} élève a reçu {D.ind:un} dictionnaire.',
  'Nous avons mangé {D.part:du} fromage et {D.part:de la} confiture.',
  '{D.indef:Plusieurs} enfants jouent dans {D.def:la} cour.',
  '{P.pers:Je} {P.pers:te} prête {D.poss:mon} vélo.',
  '{D.poss:Ton} dessin est joli, mais {P.poss:le mien} est plus coloré.',
  '{D.poss:Leur} maison est au bord de {D.def:la} mer.',
  'Mes cousins arrivent : {P.pers:je} {P.pers:leur} prépare {D.ind:une} surprise.',
  '{P.dem:Celui-ci} est trop petit ; prends plutôt {P.dem:celui-là}.',
  '{P.indef:Quelqu\'un} a sonné à {D.def:la} porte.',
  '{P.indef:Personne} n\'a vu {D.def:le} voleur.',
  '{P.indef:Chacun} range {D.poss:ses} affaires.',
  'J\'ai {D.num:trois} billes ; {P.num:deux} sont bleues.',
  '{D.ind:Des} oiseaux chantent dans {D.dem:cet} arbre.',
  '{P.pers:Il} {P.pers:la} regarde avec {D.def:les} jumelles.',
  '{D.dem:Ces} gants sont à Louis ; {P.poss:les tiens} sont dans {D.def:le} tiroir.',
  '{P.dem:Cela} {P.pers:me} fait plaisir.',
  '{D.indef:Quelques} nuages cachent {D.def:le} soleil.',
  '{D.indef:Aucun} bruit ne sort de {D.dem:cette} vieille maison.',
  'Les élèves sont tous là : {P.indef:aucun} ne manque.',
  '{D.int:Quelle} heure est-{P.pers:il} ?',
  '{D.exc:Quel} courage {P.pers:il} a eu !',
  '{D.num:Vingt} élèves participent à {D.def:la} course.',
  '{D.poss:Notre} chien aboie quand {P.pers:il} entend {D.def:le} facteur.',
  '{D.poss:Votre} maîtresse {P.pers:vous} attend.',
  '{P.dem:Ceux} qui ont fini peuvent sortir.',
  '{D.poss:Ma} trottinette est bleue ; {P.dem:celle} de Chloé est rouge.',
  '{P.indef:Tout} est prêt pour {D.def:la} fête.',
  '{P.indef:Rien} ne bouge dans {D.def:la} forêt.',
  'Les invités arrivent ; {P.indef:plusieurs} sont déjà là.',
  '{P.indef:Certains} préfèrent {D.def:le} chocolat.',
  '{D.indef:Certains} enfants préfèrent {D.def:la} vanille.',
  'Arthur a {D.ind:une} nouvelle voiture : {P.poss:la sienne} est plus rapide que {P.poss:la nôtre}.',
  '{D.dem:Ce} matin, {P.pers:nous} irons à {D.def:la} piscine.',
  '{D.ind:Une} abeille vole autour de {D.poss:ton} verre.',
  '{D.num:Cinq} joueurs sont blessés ; {P.num:trois} ne joueront pas samedi.',
  '{D.num:Six} gâteaux étaient sur {D.def:la} table ; il en reste {P.num:deux}.',
  '{D.int:Quels} films avez-{P.pers:vous} vus ?',
  '{D.exc:Quelles} jolies fleurs !',
  '{P.pers:Elle} {P.pers:nous} a invités à {D.poss:son} anniversaire.',
  '{D.dem:Ces} enfants jouent avec {D.poss:leurs} cerfs-volants.',
  'Prête-{P.pers:moi} {D.poss:ta} gomme, s\'il te plaît.',
  'En automne, {D.def:les} arbres perdent {D.poss:leurs} feuilles.',
  '{D.ind:Un} renard rôde près de {D.def:la} ferme.',
  'Je cherche {D.poss:mes} lunettes. Tu {P.pers:les} as vues ?',
  '{P.dem:Ça} sent bon dans {D.def:la} cuisine !',
  'Voici deux livres : prends {P.dem:celui} que tu préfères.',
  '{P.indef:Quelque chose} brille au fond de {D.def:la} rivière.',
  '{D.num:Dix} minutes plus tard, {D.def:le} bus est arrivé.',
  '{D.dem:Cet} oiseau construit {D.poss:son} nid.',
  '{D.int:Quelle} robe vas-{P.pers:tu} mettre ?',
  '{D.def:Les} biscuits de Mamie sont meilleurs que {P.poss:les nôtres}.',
  '{D.poss:Notre} vélo est ici ; {P.poss:le vôtre} est dans {D.def:le} garage.',
  '{P.pers:Tu} {P.pers:lui} as répondu ?',
  'Papa achète {D.part:du} pain et {D.ind:des} croissants.',
  '{D.indef:Chaque} matin, {P.pers:elle} boit {D.part:du} lait.',
  'Les joueuses sont contentes : {P.indef:chacune} a reçu {D.ind:une} médaille.',
  '{D.poss:Vos} chaussures sont sous {D.def:le} lit.',
  '{D.exc:Quel} beau temps !',
  '{D.indef:Quelques} élèves sont absents ; {P.indef:certains} sont malades.',
  'Ce cahier est à Jules ; {P.dem:celui-ci} est à {P.pers:moi}.',
  '{D.num:Deux} chiens et {D.num:quatre} chats vivent dans {D.dem:cette} ferme.',
  '{D.poss:Sa} sœur {P.pers:lui} a offert {D.ind:un} pull.',
  '{P.pers:Nous} {P.pers:les} avons rencontrés au marché.',
  'Il boit {D.part:de l\'}eau et mange {D.ind:une} pomme.',
  '{D.int:Quelles} chaussures as-{P.pers:tu} choisies ?',
  'Mes crayons sont cassés ; prête-moi {P.poss:les tiens}.',
  '{P.indef:Personne} ne connaît {D.def:la} réponse.',
];
function analyserFines(src) {
  const unites = [];
  const texte = src.replace(/\{([DP]\.[a-z]+):([^{}]+)\}/g, (_, code, mot) => { unites.push({ code, mot }); return mot; });
  return { texte, unites };
}
// Nombre d'occurrences d'un mot (ou groupe) isolé dans la phrase.
function occurrences(texte, mot) {
  const fin = mot.endsWith("'") ? '' : '(?![\\p{L}])';
  const re = new RegExp(`(^|[^\\p{L}'])${mot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${fin}`, 'giu');
  return [...texte.matchAll(re)].length;
}
const famille = (code) => (code.startsWith('D') ? 'déterminant' : 'pronom');
// « article indéfini » et « déterminant indéfini » ne sont jamais proposés ensemble (un, des… sont parfois appelés déterminants indéfinis).
const conflitIndef = (a, b) => [a, b].sort().join() === ['article indéfini', 'déterminant indéfini'].sort().join();

// Le référentiel P6 (FRALA) nomme les sous-classes de déterminants « possessifs, démonstratifs, interrogatifs,
// exclamatifs, cardinaux, indéfinis » : pas d'« article ». Les articles (le, un, du…) ne servent donc
// que dans la question « déterminant ou pronom ? », jamais comme classe précise demandée ou proposée.
const ARTICLES = new Set(['D.def', 'D.ind', 'D.part']);
const CLASSES_P6 = Object.entries(CLASSES_FINES).filter(([c]) => !ARTICLES.has(c)).map(([, l]) => l);
const leMot = (m, de = false) => `${de ? 'du' : 'le'} ${/\s/.test(m) ? 'groupe de mots' : 'mot'} « ${m} »`;

function frClassesFines(modele, rng) {
  const i = rng.int(0, PHRASES_FINES.length - 1);
  const { texte, unites } = analyserFines(PHRASES_FINES[i]);
  const forme = choixForme(rng, modele, ['classe', 'classe', 'det_pron', 'trouver', 'grille']);
  const surs = unites.filter((u) => occurrences(texte, u.mot) === 1 && (forme === 'det_pron' || !ARTICLES.has(u.code)));
  const phrase = `Dans la phrase « ${texte} »`;
  const expl = (u) => `« ${u.mot} » : ${EXPL_CLASSES[u.code]}`;
  if (forme === 'classe') {
    const u = rng.pick(surs);
    if (!u) return null;
    const bonne = CLASSES_FINES[u.code];
    const jumeau = CLASSES_FINES[(u.code.startsWith('D') ? 'P' : 'D') + u.code.slice(1)];
    const memeFamille = Object.entries(CLASSES_FINES).filter(([c]) => c[0] === u.code[0] && !ARTICLES.has(c)).map(([, l]) => l);
    const pool = rng.shuffle([...memeFamille, ...CLASSES_P6]).filter((l) => !conflitIndef(l, bonne));
    const prio = jumeau && !conflitIndef(jumeau, bonne) ? [jumeau] : [];
    const q = qcm(rng, bonne, pool, { prio });
    if (!q || q.choix.some((a) => q.choix.some((b) => conflitIndef(a, b)))) return null;
    return { _signature: `classe|${i}|${u.mot}`, ...q, enonce: `${phrase}, quelle est la classe précise ${leMot(u.mot, true)} ?`, explication: expl(u) };
  }
  if (forme === 'det_pron') {
    const u = rng.pick(surs);
    if (!u) return null;
    const bonne = famille(u.code);
    const pourquoi = bonne === 'déterminant'
      ? 'Il est placé devant un nom (parfois avec un adjectif) et l\'introduit.'
      : 'Il n\'accompagne pas de nom : il remplace un nom ou désigne une personne.';
    return { _signature: `dp|${i}|${u.mot}`, ...qcmFixe(bonne, ['déterminant', 'pronom']),
      enonce: `${phrase}, ${leMot(u.mot)} est-il un déterminant ou un pronom ?`,
      explication: `« ${u.mot} » est un ${bonne}. ${pourquoi} Précisément, ${EXPL_CLASSES[u.code]}` };
  }
  if (forme === 'trouver') {
    const u = rng.pick(surs);
    if (!u) return null;
    const autres = surs.filter((x) => x !== u && CLASSES_FINES[x.code] !== CLASSES_FINES[u.code]
      && !conflitIndef(CLASSES_FINES[x.code], CLASSES_FINES[u.code])).map((x) => x.mot);
    const q = qcm(rng, u.mot, autres);
    if (!q) return null;
    return { _signature: `trouver|${i}|${u.mot}|${q.choix.map(bas).sort().join(',')}`, ...q,
      enonce: `${phrase}, quel mot est un ${CLASSES_FINES[u.code]} ?`, explication: expl(u) };
  }
  // grille : 3 ou 4 mots de classes différentes
  const pris = []; const vus = new Set();
  for (const u of rng.shuffle(surs)) {
    const l = CLASSES_FINES[u.code];
    if (vus.has(l) || [...vus].some((v) => conflitIndef(v, l))) continue;
    vus.add(l); pris.push(u);
    if (pris.length === 4) break;
  }
  if (pris.length < 3) return null;
  const cols = Object.values(CLASSES_FINES).filter((l) => vus.has(l));
  return {
    _signature: `grille|${i}|${pris.map((u) => u.mot).sort().join(',')}`, type: 'grille',
    lignes: pris.map((u) => `« ${u.mot} »`), colonnes: cols, reponse: pris.map((u) => cols.indexOf(CLASSES_FINES[u.code])), points: pris.length,
    enonce: `${phrase}, indique la classe précise de chaque mot.`,
    explication: pris.map((u) => `« ${u.mot} » : ${CLASSES_FINES[u.code]}`).join(' ; ') + '.',
  };
}

// ═════════════════════════ 10. Le narrateur ; point de vue objectif ou subjectif ═════════════════════════
// r : récit (narrateur interne ou externe) ; pov : 'subj' (avis, sentiments) ou 'obj' (faits seulement, rendu externe).
// *mot* : mot qui montre la subjectivité ; neutres : mots du texte qui ne donnent pas d'avis.
const PASSAGES_NARR = [
  { r: true, t: "Ce matin-là, [je me suis réveillé{e}|{P} s'est réveillé{e}] très tôt. [Mon|Son] chat dormait encore au pied du lit. [J'ai|{Il} a] ouvert les volets sans faire de bruit." },
  { r: true, t: "Le jour de la rentrée, [j'avais|{P} avait] mal au ventre. [Je ne connaissais|{Il} ne connaissait] personne dans [ma|sa] nouvelle classe. Une fille aux tresses rousses [m'a|lui a] souri." },
  { r: true, t: "[J'ai|{P} a] grimpé jusqu'en haut du vieux chêne. De là-haut, [je voyais|{il} voyait] tout le village : l'église, l'école et la maison de [mes|ses] grands-parents." },
  { r: true, t: "Quand le gâteau est sorti du four, [je n'ai|{P} n'a] pas pu attendre. [J'en ai|{Il} en a] pris un morceau encore brûlant et [je me suis|{il} s'est] brûlé la langue." },
  { r: true, t: "Au milieu de la nuit, [j'ai|{P} a] entendu un grattement contre la fenêtre. [J'ai|{Il} a] allumé [ma|sa] lampe de poche et [j'ai|{il} a] découvert un petit hérisson." },
  { r: true, t: "Pendant les vacances, [je suis allé{e}|{P} est allé{e}] pêcher avec [mon|son] grand-père. [Nous avons|Ils ont] attendu deux heures, puis un énorme poisson a mordu à l'hameçon." },
  { r: true, t: "[J'ai|{P} a] trouvé une vieille clé dans le grenier. [Je l'ai|{Il} l'a] glissée dans [ma|sa] poche : peut-être ouvrait-elle le coffre de la cave ?" },
  { r: true, t: "Le jour du match, [j'ai|{P} a] marqué le but de la victoire. À la fin, toute l'équipe [m'a|l'a] porté{e} en triomphe." },
  { r: true, t: "En rentrant de l'école, [j'ai|{P} a] vu un chaton caché sous une voiture. [Je l'ai|{Il} l'a] pris dans [mes|ses] bras et [je l'ai|{il} l'a] ramené à la maison." },
  { r: true, t: "[Je suis monté{e}|{P} est monté{e}] dans le train pour Ostende. Par la fenêtre, [je regardais|{il} regardait] défiler les champs et les vaches." },
  { r: true, t: "Ce soir-là, [je suis resté{e}|{P} est resté{e}] seul{e} à la maison. Dehors, le vent soufflait et les volets claquaient. [J'ai|{Il} a] allumé toutes les lumières." },
  { r: true, t: "À la piscine, [j'ai|{P} a] plongé pour la première fois du grand plongeoir. L'eau était froide, mais [je suis|{il} est] remonté{e} à la surface en riant." },
  { r: true, pov: 'subj', t: "[J'ai|{P} a] visité le château de Bouillon. C'était *magnifique* ! Les remparts étaient immenses et la vue sur la Semois était *superbe*.", neutres: ['château', 'remparts', 'visité', 'vue'] },
  { r: true, pov: 'subj', t: "Hier, [j'ai|{P} a] goûté des choux de Bruxelles pour la première fois. C'était *horrible* : jamais [je n'avais|{il} n'avait] mangé quelque chose d'aussi amer !", neutres: ['choux', 'goûté', 'première', 'hier'] },
  { r: true, pov: 'subj', t: "Le spectacle de fin d'année était *extraordinaire*. [J'ai|{P} a] trouvé que les danseurs étaient *formidables*.", neutres: ['spectacle', 'danseurs', 'année', 'fin'] },
  { r: true, pov: 'subj', t: "Ce film était vraiment *ennuyeux*. [Je me suis|{P} s'est] endormi{e} bien avant la fin !", neutres: ['film', 'endormi', 'fin', 'avant'] },
  { r: true, pov: 'subj', t: "[Je trouve|{P} trouve] que la mer du Nord est *merveilleuse* en hiver, quand les vagues sont grises et que le vent souffle.", neutres: ['vagues', 'hiver', 'vent', 'grises'] },
  { pov: 'obj', t: 'Le train est parti à huit heures. Il s\'est arrêté à Namur, puis à Liège. Les voyageurs sont descendus sur le quai.' },
  { pov: 'obj', t: '{P} a ouvert la porte du garage. Il y avait un vélo, deux pneus et une caisse en bois.' },
  { pov: 'obj', t: 'La piscine ouvre à neuf heures. Les nageurs déposent leurs affaires dans les casiers, puis ils entrent dans l\'eau.' },
  { pov: 'obj', t: 'Le musée est ouvert du mardi au dimanche, de 10 h à 17 h. L\'entrée coûte 5 € pour les enfants.' },
  { pov: 'obj', t: 'Le hérisson est un petit mammifère. Il chasse la nuit et dort pendant la journée.' },
  { pov: 'obj', t: 'Le marché a lieu chaque samedi sur la place du village. On y vend des fruits, des légumes et du fromage.' },
  { pov: 'obj', t: 'Hier soir, un arbre est tombé sur la route de Dinant. Les pompiers l\'ont dégagé en deux heures.' },
  { pov: 'obj', t: 'La bibliothèque prête des livres, des bandes dessinées et des magazines. On peut les garder trois semaines.' },
  { pov: 'subj', t: 'Ce musée est *passionnant* ! Les salles sont *superbes* et le guide est vraiment *sympathique*.', neutres: ['musée', 'salles', 'guide'] },
  { pov: 'subj', t: 'La nouvelle plaine de jeux est *fantastique* : c\'est la plus belle de la ville !', neutres: ['plaine', 'jeux', 'ville', 'nouvelle'] },
  { pov: 'subj', t: 'Le hérisson est un animal *adorable*. Il chasse la nuit et dort pendant la journée.', neutres: ['hérisson', 'animal', 'nuit', 'journée'] },
  { pov: 'subj', t: 'Le marché du samedi est *formidable* : les fruits y sont *délicieux* et les marchands sont *charmants*.', neutres: ['marché', 'samedi', 'fruits', 'marchands'] },
  { pov: 'subj', t: 'Ce roman est *passionnant* : l\'histoire se passe dans un phare, au bord de la mer.', neutres: ['roman', 'histoire', 'phare', 'mer'] },
  { pov: 'subj', t: 'Hier soir, un arbre est tombé sur la route de Dinant. Quelle *terrible* nuit ! Les pompiers ont été *formidables*.', neutres: ['arbre', 'route', 'pompiers', 'nuit'] },
];
const CHOIX_NARR = ["un personnage de l'histoire (narrateur interne)", "quelqu'un qui n'est pas un personnage (narrateur externe)"];
const CHOIX_POV = ["objectif : il présente les faits sans donner d'avis", 'subjectif : il donne un avis ou des sentiments'];

function frNarrateur(modele, rng) {
  const i = rng.int(0, PASSAGES_NARR.length - 1);
  const it = PASSAGES_NARR[i];
  const perso = personnage(rng);
  const forme = choixForme(rng, modele, ['narrateur', 'narrateur', 'pov', 'mot']);
  if (forme === 'narrateur') {
    if (!it.r) return null;
    const interne = rng.next() < 0.5;
    const texte = rendreGabarit(it.t, perso, interne).replace(/\*/g, '');
    const expl = interne
      ? "Le narrateur dit « je » (j', me, mon, ma…) : c'est un personnage de l'histoire qui raconte ce qu'il vit. C'est un narrateur interne."
      : `Le narrateur parle ${/^[AEIOUYÉÈ]/.test(perso.nom) ? "d'" : 'de '}${perso.nom} avec « ${perso.f ? 'elle' : 'il'} » : il raconte l'histoire sans y participer. C'est un narrateur externe.`;
    return { _signature: `narr|${i}|${interne}|${perso.nom}`, ...qcmFixe(CHOIX_NARR[interne ? 0 : 1], CHOIX_NARR),
      enonce: `Lis ce passage : « ${texte} » Qui raconte l'histoire ?`, explication: expl };
  }
  if (!it.pov) return null;
  // Récit subjectif : version « je », pour que l'avis soit bien celui du narrateur (et non d'un personnage).
  const interne = Boolean(it.r && it.pov === 'subj');
  const brut = rendreGabarit(it.t, perso, interne);
  const texte = brut.replace(/\*/g, '');
  const marques = [...brut.matchAll(/\*([^*]+)\*/g)].map((m) => m[1]);
  const sig = `${i}|${interne}|${/\{P\}|\[/.test(it.t) ? perso.nom : ''}`;
  if (forme === 'pov') {
    const subj = it.pov === 'subj';
    const expl = subj
      ? `Des mots comme ${listeEt(marques.map((m) => `« ${m} »`))} donnent un avis, un jugement : le point de vue est subjectif.`
      : 'Le texte donne seulement des faits que tout le monde peut vérifier (lieux, heures, actions), sans mots qui jugent : le point de vue est objectif.';
    return { _signature: `pov|${sig}`, ...qcmFixe(CHOIX_POV[subj ? 1 : 0], CHOIX_POV),
      enonce: `Lis ce texte : « ${texte} » Le point de vue de l'auteur est-il objectif ou subjectif ?`, explication: expl };
  }
  // mot : quel mot montre la subjectivité ?
  if (it.pov !== 'subj') return null;
  const bon = rng.pick(marques);
  const q = qcm(rng, bon, it.neutres.filter((m) => texte.toLowerCase().includes(m)));
  if (!q) return null;
  return { _signature: `mot|${sig}|${bon}|${q.choix.map(bas).sort().join(',')}`, ...q,
    enonce: `Lis ce texte : « ${texte} » Quel mot montre que l'auteur donne son avis (point de vue subjectif) ?`,
    explication: `« ${bon} » est un mot qui juge : tout le monde ne serait pas forcément d'accord. Les autres mots désignent des choses ou des faits.` };
}

// ═════════════════════════ 11. Réel / imaginaire, vraisemblable / invraisemblable ═════════════════════════
// Sujets et actions possibles dans la réalité (v) ; actions impossibles (inv : propres au sujet ou communes à sa catégorie).
const SUJETS_RI = [
  { s: 'le chien de {P}', c: 'animal', v: ['aboie quand le facteur arrive', 'creuse un trou dans le jardin', 'rapporte la balle qu\'on lui lance', 'se roule dans la boue'] },
  { s: 'le chat de la voisine', c: 'animal', v: ['dort au soleil sur le rebord de la fenêtre', 'attrape une souris dans la grange', 'grimpe sur le toit du garage'] },
  { s: 'un écureuil', c: 'animal', v: ['cache des noisettes au pied d\'un arbre', 'grimpe en haut d\'un chêne'] },
  { s: 'la vache du fermier', c: 'animal', v: ['broute l\'herbe du pré', 'donne du lait chaque matin'] },
  { s: 'un renard', c: 'animal', v: ['rôde autour du poulailler', 'traverse la route en pleine nuit'] },
  { s: 'le poisson rouge', c: 'animal', v: ['nage en rond dans son bocal'] },
  { s: 'une hirondelle', c: 'animal', v: ['construit son nid sous le toit de la grange'] },
  { s: 'le boulanger', c: 'humain', v: ['prépare des croissants à cinq heures du matin', 'vend du pain aux habitants du village'] },
  { s: 'la maîtresse', c: 'humain', v: ['corrige les cahiers après la classe', 'explique une leçon de grammaire'] },
  { s: '{P}', c: 'humain', v: ['rate le bus et arrive en retard à l\'école', 'perd une dent en croquant une pomme', 'tombe de vélo et se fait mal au genou'] },
  { s: 'mon grand-père', c: 'humain', v: ['répare la vieille horloge du salon', 'plante des tomates dans le potager'] },
  { s: 'les pompiers', c: 'humains', v: ['éteignent un incendie dans une ferme', 'sauvent un chat coincé dans un arbre'] },
  { s: 'le vieux fauteuil', c: 'objet', v: ['grince quand on s\'assoit dessus'] },
  { s: 'la bouilloire', c: 'objet', v: ['siffle quand l\'eau bout'] },
  { s: 'le parapluie de Mamie', c: 'objet', v: ['se retourne à cause du vent'] },
  { s: 'la statue du parc', c: 'objet', v: ['est recouverte de neige en hiver'] },
];
const INV_RI = {
  animal: ['récite une poésie devant la classe', 'conduit la voiture de Papa', 'lit le journal en buvant un café', 'téléphone à sa grand-mère', 'fait ses devoirs de mathématiques', 'joue du piano au concert de l\'école'],
  humain: ['s\'envole au-dessus des toits en battant des bras', 'devient invisible en claquant des doigts', 'traverse un mur sans se faire mal', 'soulève un camion d\'une seule main', 'respire sous l\'eau pendant des heures, sans bouteille'],
  humains: ['s\'envolent au-dessus des toits en battant des bras', 'deviennent invisibles en claquant des doigts', 'traversent un mur sans se faire mal', 'soulèvent un camion d\'une seule main'],
  objet: ['se met à chanter une chanson', 'raconte des histoires aux enfants', 's\'envole par la fenêtre en riant', 'ouvre les yeux et dit bonjour', 'se promène dans la rue en sifflant'],
};
const CHOIX_VR = ['vraisemblable : cela pourrait arriver dans la réalité', 'invraisemblable : c\'est impossible dans la réalité'];
// Extraits avec leur source : réel (faits vrais) ou imaginaire (fiction). vr : pour une fiction, vraisemblable ou non.
const EXTRAITS_RI = [
  ['un article de journal', 'Samedi, la Meuse est sortie de son lit à Namur. Plusieurs caves ont été inondées.', 'reel'],
  ['une encyclopédie', 'Les abeilles fabriquent le miel à partir du nectar des fleurs.', 'reel'],
  ['un manuel de sciences', 'Le cœur pompe le sang et l\'envoie dans tout le corps.', 'reel'],
  ['un guide touristique', 'Bruxelles est la capitale de la Belgique. On peut y visiter l\'Atomium.', 'reel'],
  ['une encyclopédie', 'La Lune tourne autour de la Terre en un peu moins d\'un mois.', 'reel'],
  ['un documentaire sur les animaux', 'Le hérisson se roule en boule quand il a peur.', 'reel'],
  ['un manuel d\'histoire', 'Les châteaux forts du Moyen Âge étaient entourés de remparts.', 'reel'],
  ['un conte', 'La fée toucha la citrouille avec sa baguette : elle devint un magnifique carrosse.', 'imag', false],
  ['un roman', 'Le géant posa sa botte sur le clocher, et tout le village trembla.', 'imag', false],
  ['une bande dessinée', 'Le chien de Jules ouvrit le frigo et se prépara un sandwich en chantant.', 'imag', false],
  ['un conte', 'Dans ce pays lointain, les arbres parlaient aux enfants qui se perdaient.', 'imag', false],
  ['un roman', 'Margaux ouvrit la lettre de sa cousine et éclata de rire.', 'imag', true],
  ['un roman', 'Ce soir-là, Arthur rata le dernier bus et dut rentrer à pied sous la pluie.', 'imag', true],
  ['une nouvelle', 'Quand Élise arriva à la gare, le train venait de partir. Elle s\'assit sur un banc et attendit le suivant.', 'imag', true],
  ['un roman', 'Victor trouva un portefeuille sur le trottoir et le rapporta au commissariat.', 'imag', true],
];
const CHOIX_REEL = ['du réel : des faits vrais, que l\'on peut vérifier', 'de l\'imaginaire : une histoire inventée'];

function elementRI(rng, vrai, exclus = []) {
  const sujets = SUJETS_RI.filter((x) => !exclus.includes(x.s));
  const sj = rng.pick(sujets);
  const action = vrai ? rng.pick(sj.v) : rng.pick(INV_RI[sj.c]);
  const perso = personnage(rng);
  return { s: sj.s, texte: maj(`${rendreGabarit(sj.s, perso)} ${action}.`) };
}
function frReelImaginaire(modele, rng) {
  const forme = choixForme(rng, modele, ['vr', 'vr', 'lequel', 'grille', 'reel', 'fiction']);
  if (forme === 'vr') {
    const vrai = rng.next() < 0.5;
    const e = elementRI(rng, vrai);
    return { _signature: `vr|${e.texte}`, ...qcmFixe(CHOIX_VR[vrai ? 0 : 1], CHOIX_VR),
      enonce: `Dans un récit, on lit : « ${e.texte} » Cet évènement est-il vraisemblable ou invraisemblable ?`,
      explication: vrai ? 'Cela peut arriver dans la vraie vie : c\'est vraisemblable.' : 'Cela ne peut pas arriver dans la vraie vie (un animal ne parle pas, un objet ne vit pas, personne n\'a de pouvoirs magiques) : c\'est invraisemblable.' };
  }
  if (forme === 'lequel') {
    const cherche = rng.next() < 0.5; // true : on cherche l'invraisemblable
    const bon = elementRI(rng, !cherche);
    const pris = [bon.s]; const autres = [];
    for (let k = 0; k < 3; k++) { const e = elementRI(rng, cherche, pris); pris.push(e.s); autres.push(e.texte); }
    const q = qcm(rng, bon.texte, autres);
    if (!q) return null;
    return { _signature: `lequel|${cherche}|${q.choix.slice().sort().join('|')}`, ...q,
      enonce: `Lequel de ces évènements est ${cherche ? 'invraisemblable (impossible dans la réalité)' : 'vraisemblable (possible dans la réalité)'} ?`,
      explication: cherche ? `« ${bon.texte} » : c'est impossible dans la réalité. Les autres évènements pourraient vraiment arriver.` : `« ${bon.texte} » : cela pourrait vraiment arriver. Les autres évènements sont impossibles dans la réalité.` };
  }
  if (forme === 'grille') {
    const lignes = []; const rep = []; const pris = [];
    const vals = rng.shuffle([true, false, rng.next() < 0.5, rng.next() < 0.5]);
    for (const v of vals) { const e = elementRI(rng, v, pris); pris.push(e.s); lignes.push(e.texte); rep.push(v ? 0 : 1); }
    return { _signature: `grille|${lignes.slice().sort().join('|')}`, type: 'grille', lignes, colonnes: ['vraisemblable', 'invraisemblable'],
      reponse: rep, points: 4, enonce: 'Dans un récit, ces évènements sont-ils vraisemblables (possibles dans la réalité) ou invraisemblables ?',
      explication: lignes.map((l, k) => `${l.replace(/\.$/, '')} → ${rep[k] ? 'invraisemblable' : 'vraisemblable'}`).join(' ; ') + '.' };
  }
  const i = rng.int(0, EXTRAITS_RI.length - 1);
  const [source, texte, nature, vr] = EXTRAITS_RI[i];
  if (forme === 'reel') {
    const reel = nature === 'reel';
    return { _signature: `reel|${i}`, ...qcmFixe(CHOIX_REEL[reel ? 0 : 1], CHOIX_REEL),
      enonce: `Voici un extrait d'${source} : « ${texte} » Ce texte parle-t-il du réel ou de l'imaginaire ?`,
      explication: reel ? `C'est ${source} : il donne des informations vraies, qu'on peut vérifier. Il parle du réel.` : `C'est ${source} : l'auteur a inventé cette histoire${vr ? ', même si elle pourrait arriver' : ''}. Elle appartient à l'imaginaire.` };
  }
  // fiction : extrait inventé, vraisemblable ou non ?
  if (nature !== 'imag') return null;
  return { _signature: `fiction|${i}`, ...qcmFixe(CHOIX_VR[vr ? 0 : 1], CHOIX_VR),
    enonce: `Cet extrait d'${source} est une histoire inventée : « ${texte} » Ce qu'il raconte est-il vraisemblable ou invraisemblable ?`,
    explication: vr ? 'L\'histoire est inventée (imaginaire), mais rien n\'est impossible : elle est vraisemblable.' : 'L\'histoire est inventée et raconte quelque chose d\'impossible dans la réalité : elle est invraisemblable.' };
}

// ═════════════════════════ 12. Remettre un récit dans l'ordre (organisateurs) ═════════════════════════
// Étapes : [organisateur ou null, suite de la phrase]. {P}, {il}, {Il}, {e}, {lui} : personnage tiré au sort.
const RECITS = [
  [["D'abord", '{P} a mélangé la farine et les œufs dans un grand saladier.'], ['Ensuite', '{il} a versé le lait petit à petit en remuant.'], ['Puis', '{il} a fait cuire la pâte dans une poêle bien chaude.'], ['Enfin', 'toute la famille a dégusté les crêpes avec du sucre.']],
  [['Un samedi matin', '{P} a décidé de construire une cabane au fond du jardin.'], ["D'abord", '{il} a rassemblé des planches et des branches.'], ['Ensuite', '{il} a cloué les planches avec l\'aide de son père.'], ['Finalement', '{il} a installé un vieux tapis et des coussins à l\'intérieur.']],
  [[null, 'Il était une fois un petit lapin qui vivait au bord d\'une forêt.'], ['Un jour', 'il partit chercher des carottes dans le potager du fermier.'], ['Soudain', 'le chien du fermier se mit à aboyer.'], ['Alors', 'le lapin s\'enfuit à toute vitesse jusqu\'à son terrier.'], ['Depuis ce jour', 'il ne s\'approche plus jamais du potager.']],
  [['Ce matin-là', 'les élèves de sixième sont montés dans le car pour visiter le musée.'], ['Pendant le trajet', 'ils ont chanté des chansons.'], ['À leur arrivée', 'un guide les a accueillis à l\'entrée du musée.'], ['Après la visite', 'ils ont pique-niqué dans le parc.'], ['Le soir', 'ils sont rentrés à l\'école, fatigués mais contents.']],
  [['Au printemps', '{P} a semé des graines de tournesol dans un pot.'], ['Chaque jour', '{il} arrosait la terre.'], ['Au bout d\'une semaine', 'une petite pousse verte est apparue.'], ['À la fin de l\'été', 'le tournesol était plus grand que {lui}.']],
  [['Dimanche', '{P} promenait son chien dans le parc.'], ['Tout à coup', 'le chien a aperçu un écureuil et s\'est enfui.'], [null, '{P} l\'a cherché pendant une heure en l\'appelant.'], ['Finalement', '{il} l\'a retrouvé au pied d\'un arbre, la langue pendante.']],
  [["D'abord", '{P} se lève et ouvre les volets.'], ['Ensuite', '{il} prend son petit-déjeuner dans la cuisine.'], ['Puis', '{il} enfile son manteau et prend son cartable.'], ['Enfin', '{il} part à l\'école avec sa sœur.']],
  [[null, 'Il était une fois une princesse qui s\'ennuyait dans son château.'], ['Un matin', 'elle décida de partir explorer la forêt.'], ['Soudain', 'un dragon surgit devant elle.'], ['Au lieu de s\'enfuir', 'la princesse lui offrit une pomme.'], ['Depuis ce jour', 'le dragon et la princesse sont les meilleurs amis du monde.']],
  [['Ce matin', 'en ouvrant les rideaux, {P} a vu que tout était blanc.'], [null, '{Il} a vite mis son bonnet, ses gants et ses bottes.'], ['Dans le jardin', '{il} a roulé deux grosses boules de neige.'], ['Pour finir', '{il} a planté une carotte au milieu de la tête du bonhomme.']],
  [['Lundi', 'le réveil de {P} n\'a pas sonné.'], ['Quand {il} s\'est réveillé{e}', 'il était déjà huit heures.'], [null, '{Il} a couru jusqu\'à l\'arrêt, mais le bus venait de partir.'], ['Finalement', 'son père l\'a conduit{e} à l\'école en voiture.']],
  [["D'abord", 'préchauffe le four.'], ['Ensuite', 'mélange le beurre et le sucre dans un saladier.'], ['Puis', 'ajoute les œufs et la farine.'], ['Enfin', 'verse la pâte dans le moule et fais cuire trente minutes.']],
  [['La semaine dernière', '{P} a reçu une invitation pour l\'anniversaire de sa cousine.'], ['Le samedi suivant', '{il} a emballé son cadeau dans du papier doré.'], ['À la fête', '{il} a joué à cache-cache avec les autres enfants.'], ['En fin d\'après-midi', 'tout le monde a chanté devant le gâteau.']],
  [['Cet après-midi-là', 'le ciel était tout bleu.'], ['Peu à peu', 'de gros nuages noirs ont envahi le ciel.'], ['Soudain', 'un éclair a illuminé la campagne.'], ['Quelques secondes plus tard', 'le tonnerre a grondé.'], ['Après l\'orage', 'un magnifique arc-en-ciel est apparu.']],
  [['Mardi', '{P} a emprunté un roman à la bibliothèque.'], ['Le soir même', '{il} a commencé à le lire dans son lit.'], ['Trois jours plus tard', '{il} avait déjà terminé le livre.'], ['Le samedi suivant', '{il} l\'a rapporté à la bibliothèque.']],
  [["Pour commencer", 'découpe un carré de papier.'], ['Ensuite', 'plie-le en deux pour former un triangle.'], ['Puis', 'replie les deux pointes vers le haut.'], ['Pour terminer', 'dessine les yeux et le museau de ton renard en papier.']],
  [['Il y a très longtemps', 'un roi très riche vivait dans un immense château.'], ['Un soir', 'un voleur se glissa dans la salle du trésor.'], ['Tout à coup', 'les gardes surgirent avec leurs lanternes.'], ['Finalement', 'le voleur fut enfermé dans la plus haute tour.']],
];
const ORG_DEBUT = ["D'abord", 'Pour commencer', 'Au début'];
const ORG_FIN = ['Finalement', 'Enfin', 'Pour finir', 'Pour terminer'];
const ORG_SOUDAIN = ['Soudain', 'Tout à coup'];
const phraseEtape = ([org, suite], perso) => maj(rendreGabarit(org ? `${org}, ${suite}` : suite, perso));

function frOrdreRecit(modele, rng) {
  const i = rng.int(0, RECITS.length - 1);
  const perso = personnage(rng);
  const avecP = RECITS[i].some(([o, t]) => /\{/.test(`${o}${t}`));
  let etapes = RECITS[i];
  if (etapes.length === 5 && rng.next() < 0.5) {
    // On retire une étape du milieu (jamais l'évènement soudain, nécessaire à la suite).
    const k = rng.pick([1, 2, 3].filter((j) => !ORG_SOUDAIN.includes(etapes[j][0])));
    etapes = etapes.filter((_, j) => j !== k);
  }
  const phrases = etapes.map((e) => phraseEtape(e, perso));
  const forme = choixForme(rng, modele, ['ordre', 'ordre', 'premier', 'organisateur']);
  const sig = `${i}|${etapes.length}|${phrases[1]}|${avecP ? perso.nom : ''}`;
  const orgs = etapes.map(([o]) => o).filter(Boolean);
  const indices = `Les organisateurs (${orgs.map((o) => `« ${o.replace(/ \{.*$/, '')} »`).join(', ')}) et la logique de l'histoire indiquent l'ordre.`;
  if (forme === 'ordre') {
    const elements = rng.shuffle(phrases);
    if (elements.every((p, k) => p === phrases[k])) return null;
    return { _signature: `ordre|${sig}`, type: 'ordre', elements, reponse: phrases.map((p) => elements.indexOf(p)),
      enonce: 'Remets les phrases de ce récit dans le bon ordre.', explication: `${phrases.join(' ')} ${indices}` };
  }
  if (forme === 'premier') {
    const q = qcm(rng, phrases[0], phrases.slice(1));
    if (!q) return null;
    return { _signature: `premier|${sig}`, ...q, enonce: 'Ces phrases forment un récit. Laquelle vient en premier ?', explication: `${phrases.join(' ')} ${indices}` };
  }
  // organisateur manquant (début, fin ou évènement soudain)
  const cand = etapes.map((e, k) => [e[0], k]).filter(([o]) => [...ORG_DEBUT, ...ORG_FIN, ...ORG_SOUDAIN].includes(o));
  if (!cand.length) return null;
  const [org, k] = rng.pick(cand);
  const pool = ORG_DEBUT.includes(org) ? ORG_FIN : ORG_FIN.includes(org) ? ORG_DEBUT : [...ORG_DEBUT, ...ORG_FIN];
  const q = qcm(rng, org, pool);
  if (!q) return null;
  const trou = phrases.map((p, j) => (j === k ? `___, ${rendreGabarit(etapes[j][1], perso)}` : p)).join(' ');
  const role = ORG_DEBUT.includes(org) ? 'annonce la première étape' : ORG_FIN.includes(org) ? 'annonce la dernière étape' : 'annonce un évènement brusque, inattendu';
  return { _signature: `org|${sig}|${k}`, ...q, enonce: `Quel organisateur convient à la place de ___ ? « ${trou} »`,
    explication: `« ${org} » ${role}. ${phrases.join(' ')}` };
}

// ═════════════════════════ 13. Exécuter un enchaînement de trois consignes ═════════════════════════
// [mot, genre, pluriel, catégorie]
const MOTS_CONSIGNES = [
  ['cheval', 'm', 'chevaux', 'animal'], ['lapin', 'm', 'lapins', 'animal'], ['girafe', 'f', 'girafes', 'animal'], ['hibou', 'm', 'hiboux', 'animal'],
  ['souris', 'f', 'souris', 'animal'], ['éléphant', 'm', 'éléphants', 'animal'], ['tortue', 'f', 'tortues', 'animal'], ['oiseau', 'm', 'oiseaux', 'animal'],
  ['renard', 'm', 'renards', 'animal'], ['abeille', 'f', 'abeilles', 'animal'], ['poule', 'f', 'poules', 'animal'], ['escargot', 'm', 'escargots', 'animal'],
  ['mouton', 'm', 'moutons', 'animal'], ['chameau', 'm', 'chameaux', 'animal'], ['ours', 'm', 'ours', 'animal'], ['autruche', 'f', 'autruches', 'animal'],
  ['pomme', 'f', 'pommes', 'fruit'], ['cerise', 'f', 'cerises', 'fruit'], ['ananas', 'm', 'ananas', 'fruit'], ['abricot', 'm', 'abricots', 'fruit'],
  ['banane', 'f', 'bananes', 'fruit'], ['orange', 'f', 'oranges', 'fruit'], ['citron', 'm', 'citrons', 'fruit'], ['fraise', 'f', 'fraises', 'fruit'],
  ['poire', 'f', 'poires', 'fruit'], ['prune', 'f', 'prunes', 'fruit'],
  ['crayon', 'm', 'crayons', 'objet'], ['cahier', 'm', 'cahiers', 'objet'], ['gomme', 'f', 'gommes', 'objet'], ['cartable', 'm', 'cartables', 'objet'],
  ['bijou', 'm', 'bijoux', 'objet'], ['clou', 'm', 'clous', 'objet'], ['journal', 'm', 'journaux', 'objet'], ['ballon', 'm', 'ballons', 'objet'],
  ['lampe', 'f', 'lampes', 'objet'], ['couteau', 'm', 'couteaux', 'objet'], ['parapluie', 'm', 'parapluies', 'objet'], ['bateau', 'm', 'bateaux', 'objet'],
  ['cadeau', 'm', 'cadeaux', 'objet'], ['écharpe', 'f', 'écharpes', 'objet'], ['valise', 'f', 'valises', 'objet'], ['armoire', 'f', 'armoires', 'objet'],
  ['horloge', 'f', 'horloges', 'objet'], ['échelle', 'f', 'échelles', 'objet'], ['chapeau', 'm', 'chapeaux', 'objet'], ['tuyau', 'm', 'tuyaux', 'objet'],
];
const CAT_CONSIGNES = { animal: "les noms d'animaux", fruit: 'les noms de fruits', objet: "les noms d'objets" };
const FILTRES = [
  { k: 'cat', txt: (c) => `Garde seulement ${CAT_CONSIGNES[c]}.`, f: (m, c) => m[3] === c, param: ['animal', 'fruit', 'objet'] },
  { k: 'voy', txt: () => 'Garde seulement les mots qui commencent par une voyelle.', f: (m) => /^[aeiouy]/.test(sansAcc(m[0])) },
  { k: 'long', txt: () => 'Garde seulement les mots de plus de cinq lettres.', f: (m) => m[0].length > 5 },
  { k: 'court', txt: () => 'Garde seulement les mots de cinq lettres ou moins.', f: (m) => m[0].length <= 5 },
  { k: 'fem', txt: () => 'Garde seulement les noms féminins (ceux devant lesquels on peut écrire « une »).', f: (m) => m[1] === 'f' },
  { k: 'masc', txt: () => 'Garde seulement les noms masculins (ceux devant lesquels on peut écrire « un »).', f: (m) => m[1] === 'm' },
  { k: 'lettreA', txt: () => 'Garde seulement les mots qui contiennent la lettre « a ».', f: (m) => sansAcc(m[0]).includes('a') },
  { k: 'lettreO', txt: () => 'Garde seulement les mots qui contiennent la lettre « o ».', f: (m) => sansAcc(m[0]).includes('o') },
];
const SELECTEURS = [
  { k: 'premier', txt: 'Parmi les mots qui restent, choisis celui qui vient en premier dans l\'ordre alphabétique.', f: (l) => l.slice().sort((a, b) => (sansAcc(a[0]) < sansAcc(b[0]) ? -1 : 1))[0] },
  { k: 'dernier', txt: 'Parmi les mots qui restent, choisis celui qui vient en dernier dans l\'ordre alphabétique.', f: (l) => l.slice().sort((a, b) => (sansAcc(a[0]) < sansAcc(b[0]) ? 1 : -1))[0] },
  { k: 'long', txt: 'Parmi les mots qui restent, choisis le plus long.', f: (l) => { const m = Math.max(...l.map((x) => x[0].length)); const t = l.filter((x) => x[0].length === m); return t.length === 1 ? t[0] : null; } },
  { k: 'court', txt: 'Parmi les mots qui restent, choisis le plus court.', f: (l) => { const m = Math.min(...l.map((x) => x[0].length)); const t = l.filter((x) => x[0].length === m); return t.length === 1 ? t[0] : null; } },
];
const ACTIONS = [
  { k: 'pluriel', txt: 'Écris ce mot au pluriel.' },
  { k: 'det', txt: 'Écris ce mot avec « un » ou « une » devant.' },
  { k: 'lettres', txt: 'Écris le nombre de lettres de ce mot.' },
];

function frConsignes(modele, rng) {
  for (let essai = 0; essai < 20; essai++) {
    const mots = rng.shuffle(MOTS_CONSIGNES).slice(0, rng.int(5, 7));
    const filtre = rng.pick(FILTRES);
    const param = filtre.param ? rng.pick(filtre.param) : null;
    const restants = mots.filter((m) => filtre.f(m, param));
    if (restants.length < 2 || restants.length > mots.length - 2) continue;
    const sel = rng.pick(SELECTEURS);
    const choisi = sel.f(restants);
    if (!choisi) continue;
    const action = rng.pick(ACTIONS);
    const consignes = `1. ${filtre.txt(param)} 2. ${sel.txt} 3. ${action.txt}`;
    const enonce = `Voici une liste de mots : ${mots.map((m) => m[0]).join(', ')}. Exécute ces trois consignes dans l'ordre. ${consignes}`;
    const etapes = `1. Il reste : ${restants.map((m) => m[0]).join(', ')}. 2. On choisit « ${choisi[0]} ».`;
    const sig = `${mots.map((m) => m[0]).join(',')}|${filtre.k}${param ?? ''}|${sel.k}|${action.k}`;
    const article = choisi[1] === 'f' ? 'une' : 'un';
    if (action.k === 'lettres') {
      return { _signature: sig, type: 'numerique', reponse: choisi[0].length, enonce,
        explication: `${etapes} 3. « ${choisi[0]} » a ${choisi[0].length} lettres.` };
    }
    if (action.k === 'pluriel') {
      const pl = choisi[2];
      return { _signature: sig, type: 'texte_court', souple: false, reponse: [pl, `des ${pl}`, `les ${pl}`], enonce,
        explication: `${etapes} 3. Au pluriel : « ${pl} »${pl === choisi[0] ? ' (ce mot ne change pas au pluriel)' : ''}.` };
    }
    const rep = `${article} ${choisi[0]}`;
    return { _signature: sig, type: 'texte_court', souple: false, reponse: [rep], enonce,
      explication: `${etapes} 3. « ${choisi[0]} » est ${choisi[1] === 'f' ? 'féminin' : 'masculin'} : « ${rep} ».` };
  }
  return null;
}

// ═════════════════════════ 14. Voix passive, mise en évidence, subjonctif et participes ═════════════════════════
// [agent, nombre de l'agent, verbe, objet, genre de l'objet, nombre de l'objet]
const PASSIF = [
  ['le chat', 's', 'attraper', 'la souris', 'f', 's'], ['les pompiers', 'p', 'éteindre', "l'incendie", 'm', 's'],
  ['le vent', 's', 'emporter', 'les feuilles', 'f', 'p'], ['la maîtresse', 's', 'corriger', 'les cahiers', 'm', 'p'],
  ['Léa', 's', 'peindre', 'le portail', 'm', 's'], ['les élèves', 'p', 'décorer', 'la classe', 'f', 's'],
  ['le facteur', 's', 'apporter', 'les lettres', 'f', 'p'], ['un orage', 's', 'détruire', 'la cabane', 'f', 's'],
  ['la neige', 's', 'couvrir', 'les toits', 'm', 'p'], ['le boulanger', 's', 'préparer', 'les croissants', 'm', 'p'],
  ['les abeilles', 'p', 'butiner', 'les fleurs', 'f', 'p'], ['le jardinier', 's', 'tailler', 'la haie', 'f', 's'],
  ['mon frère', 's', 'réparer', 'le vélo', 'm', 's'], ['le chien', 's', 'mordre', 'le facteur', 'm', 's'],
  ['les spectateurs', 'p', 'applaudir', 'la chanteuse', 'f', 's'], ['le directeur', 's', 'féliciter', 'les gagnants', 'm', 'p'],
  ['le vétérinaire', 's', 'soigner', 'la jument', 'f', 's'], ['la tempête', 's', 'déraciner', 'les arbres', 'm', 'p'],
  ['les enfants', 'p', 'construire', 'le château de sable', 'm', 's'], ['Arthur', 's', 'écrire', 'cette lettre', 'f', 's'],
  ['la police', 's', 'arrêter', 'le voleur', 'm', 's'], ['ma grand-mère', 's', 'tricoter', 'ces écharpes', 'f', 'p'],
  ['le guide', 's', 'accompagner', 'les touristes', 'm', 'p'], ['le pirate', 's', 'cacher', 'le trésor', 'm', 's'],
  ['les élèves', 'p', 'planter', 'ces arbres', 'm', 'p'], ['un chauffeur prudent', 's', 'conduire', 'le car', 'm', 's'],
  ['le cuisinier', 's', 'servir', 'la soupe', 'f', 's'], ['les ouvriers', 'p', 'bâtir', 'la nouvelle école', 'f', 's'],
  ['le soleil', 's', 'éclairer', 'la pièce', 'f', 's'], ['Chloé', 's', 'cueillir', 'ces cerises', 'f', 'p'],
  ['les voisins', 'p', 'inviter', 'mes parents', 'm', 'p'], ['le maire', 's', 'inaugurer', 'la bibliothèque', 'f', 's'],
];
// Phrases actives avec être + participe passé (verbes de mouvement) : pièges pour la reconnaissance de la voix.
const ACTIVES_ETRE = [
  "Les enfants sont arrivés à l'école.", 'Léa est partie en vacances.', 'Mes cousins sont venus à la fête.', 'La neige est tombée toute la nuit.',
  'Le train est entré en gare.', 'Mamie est restée à la maison.', 'Les hirondelles sont revenues au printemps.', 'Mon frère est sorti avec ses amis.',
  'Ma sœur est née en hiver.', 'Les touristes sont montés au sommet de la tour.',
];
const TEMPS_PASSIF = {
  present: { etre: ['est', 'sont'], nom: 'présent' },
  imparfait: { etre: ['était', 'étaient'], nom: 'imparfait' },
  futur: { etre: ['sera', 'seront'], nom: 'futur simple' },
  passe_compose: { etre: ['a été', 'ont été'], nom: 'passé composé' },
};
const accordPP = (pp, g, n) => pp + (g === 'f' ? 'e' : '') + (n === 'p' && !(pp.endsWith('s') && g === 'm') ? 's' : '');
function actif(it, t) {
  const [ag, nA, v, obj] = it;
  return maj(`${ag} ${conjuguer(v, t, { pronom: nA === 'p' ? 'ils' : 'il', idx: nA === 'p' ? 5 : 2 }).forme} ${obj}.`);
}
function passif(it, t, { agent = true, accord = true, etreT = t } = {}) {
  const [ag, , v, obj, g, n] = it;
  const pp = conjuguer(v, 'passe_compose', { pronom: 'il', idx: 2 }).forme.split(' ').at(-1);
  const etre = TEMPS_PASSIF[etreT].etre[n === 'p' ? 1 : 0];
  return maj(`${obj} ${etre} ${accord ? accordPP(pp, g, n) : pp}${agent ? ` par ${ag}` : ''}.`);
}
function evidence(it, t, cible) {
  const [ag, nA, v, obj, g, n] = it;
  let f = conjuguer(v, t, { pronom: nA === 'p' ? 'ils' : 'il', idx: nA === 'p' ? 5 : 2 }).forme;
  // « C'est la souris que le chat a attrapée » : le complément direct « que » est placé avant avoir.
  if (cible === 'objet' && t === 'passe_compose') { const [aux, pp] = f.split(' '); f = `${aux} ${accordPP(pp, g, n)}`; }
  const c = (gn) => (/^(les|ces|mes|tes|ses|nos|vos|leurs) /.test(gn) ? 'Ce sont' : "C'est");
  if (cible === 'agent') return `${c(ag)} ${ag} qui ${f} ${obj}.`;
  return `${c(obj)} ${obj} que ${ag} ${f}.`.replace(/ que (?=[aeiouyéèh])/i, " qu'");
}
const CHOIX_VOIX = ['voix active', 'voix passive'];
// Subjonctif et participes : verbes d'action tirés de la liste de conjugaison.
const VERBES_ACTION = () => VERBES_CONJ.filter(([v]) => !['être', 'avoir', 'aller', 'pouvoir', 'devoir', 'vouloir', 'falloir', 'naître', 'mourir', 'plaire',
  'paraître', 'apparaître', 'disparaître', 'appartenir', 'correspondre', 'tomber', 'arriver', 'perdre', 'casser', 'oublier', 'salir', 'trahir',
  'mentir', 'décevoir', 'souffrir', 'pleurer', 'grossir', 'maigrir', 'vieillir', 'pâlir', 'frémir', 'guérir', 'rompre', 'interrompre', 'fondre',
  'confondre', 'craindre', 'envahir', 'savoir', 'croire', 'recevoir', 'grandir', 'mordre', 'atterrir'].includes(v));
const AVANT_DE = ['sortir', 'jouer', 'partir', 'dormir', 'manger', 'regarder la télévision'];
const RENTRER = [['est rentré{e}', 'rentré{e}', 'rentrer'], ['est arrivé{e}', 'arrivé{e}', 'arriver'], ['est parti{e}', 'parti{e}', 'partir'], ['est revenu{e}', 'revenu{e}', 'revenir']];

function frTempsPassive(modele, rng) {
  const forme = choixForme(rng, modele, ['voix', 'voix', 'transformer', 'agent', 'evidence', 'evidence', 'subjonctif', 'participe']);
  const i = rng.int(0, PASSIF.length - 1);
  const it = PASSIF[i];
  const t = rng.pick(Object.keys(TEMPS_PASSIF));
  const regleP = "À la voix passive, le sujet subit l'action : on emploie l'auxiliaire être (au temps du verbe actif) + le participe passé, accordé avec le sujet. Celui qui fait l'action est le complément d'agent, introduit par « par ».";
  if (forme === 'voix') {
    const sorte = rng.pick(['actif', 'passif', 'passif', 'piege']);
    let phrase;
    if (sorte === 'piege') phrase = rng.pick(ACTIVES_ETRE);
    else phrase = sorte === 'actif' ? actif(it, t) : passif(it, t, { agent: rng.next() < 0.75 });
    const passiveP = sorte === 'passif';
    const expl = passiveP ? `Le sujet subit l'action : « ${phrase} » est à la voix passive (être + participe passé${phrase.includes(' par ') ? ', complément d\'agent introduit par « par »' : ''}).`
      : sorte === 'piege' ? `Attention : « ${phrase} » est à la voix active. Le verbe est au passé composé avec l'auxiliaire être, mais le sujet fait l'action lui-même (on ne peut pas ajouter « par… »).`
        : `Le sujet fait l'action : « ${phrase} » est à la voix active.`;
    return { _signature: `voix|${phrase}`, ...qcmFixe(CHOIX_VOIX[passiveP ? 1 : 0], CHOIX_VOIX), fiche: 'fr-passive-mise-en-evidence',
      enonce: `La phrase « ${phrase} » est-elle à la voix active ou à la voix passive ?`, explication: expl };
  }
  if (forme === 'transformer') {
    const bonne = passif(it, t);
    const autreT = rng.pick(Object.keys(TEMPS_PASSIF).filter((x) => x !== t));
    const inverse = maj(`${it[0]} ${TEMPS_PASSIF[t].etre[it[1] === 'p' ? 1 : 0]} ${accordPP(conjuguer(it[2], 'passe_compose', { pronom: 'il', idx: 2 }).forme.split(' ').at(-1), 'm', it[1])} par ${it[3]}.`);
    const q = qcm(rng, bonne, [passif(it, t, { accord: false }), passif(it, t, { etreT: autreT }), inverse, actif(it, t)]);
    if (!q) return null;
    return { _signature: `transf|${i}|${t}`, ...q, fiche: 'fr-passive-mise-en-evidence',
      enonce: `Quelle phrase dit la même chose que « ${actif(it, t)} », mais à la voix passive ?`,
      explication: `« ${bonne} » ${regleP}` };
  }
  if (forme === 'agent') {
    const sansAgent = rng.next() < 0.25;
    const phrase = passif(it, t, { agent: !sansAgent });
    if (sansAgent) {
      const choix = [maj(it[3]), 'la phrase ne le dit pas'];
      return { _signature: `agent|${i}|${t}|0`, ...qcmFixe('la phrase ne le dit pas', choix), fiche: 'fr-passive-mise-en-evidence',
        enonce: `Dans la phrase passive « ${phrase} », qui fait l'action ?`,
        explication: `Il n'y a pas de complément d'agent (pas de groupe introduit par « par ») : la phrase ne dit pas qui fait l'action. « ${maj(it[3])} » est le sujet : il subit l'action.` };
    }
    const q = qcm(rng, maj(it[0]), [maj(it[3]), 'la phrase ne le dit pas']);
    if (!q) return null;
    return { _signature: `agent|${i}|${t}|1`, ...q, fiche: 'fr-passive-mise-en-evidence',
      enonce: `Dans la phrase passive « ${phrase} », qui fait l'action ?`,
      explication: `C'est « ${it[0]} », le complément d'agent introduit par « par ». Le sujet « ${it[3]} » subit l'action.` };
  }
  if (forme === 'evidence') {
    const tt = rng.pick(['present', 'passe_compose', 'imparfait']);
    const cible = rng.pick(['agent', 'objet']);
    const gn = cible === 'agent' ? it[0] : it[3];
    const phrase = evidence(it, tt, cible);
    if (rng.next() < 0.5) {
      const verbe = conjuguer(it[2], tt, { pronom: 'il', idx: it[1] === 'p' ? 5 : 2 }).forme;
      const q = qcm(rng, gn, [cible === 'agent' ? it[3] : it[0], verbe]);
      if (!q) return null;
      return { _signature: `ev1|${i}|${tt}|${cible}`, ...q, fiche: 'fr-passive-mise-en-evidence',
        enonce: `Quel groupe est mis en évidence dans la phrase « ${phrase} » ?`,
        explication: `« ${gn} » est encadré par « ${phrase.startsWith('Ce sont') ? 'ce sont' : "c'est"} … ${cible === 'agent' ? 'qui' : 'que'} » : c'est lui que la phrase met en évidence.` };
    }
    const q = qcm(rng, phrase, [evidence(it, tt, cible === 'agent' ? 'objet' : 'agent'), actif(it, tt), passif(it, tt)]);
    if (!q) return null;
    return { _signature: `ev2|${i}|${tt}|${cible}`, ...q, fiche: 'fr-passive-mise-en-evidence',
      enonce: `Quelle phrase met en évidence « ${gn} » ?`,
      explication: `« ${phrase} » Pour mettre un groupe en évidence, on l'encadre par « c'est … qui » (ou « ce sont … qui ») quand il est sujet, par « c'est … que » quand il est complément.` };
  }
  if (forme === 'subjonctif') {
    const [v, c] = rng.pick(VERBES_ACTION());
    const p = rng.pick([{ pronom: 'tu', idx: 1 }, { pronom: 'il', idx: 2 }, { pronom: 'elle', idx: 2 }, { pronom: 'nous', idx: 3 }, { pronom: 'vous', idx: 4 }, { pronom: 'ils', idx: 5 }]);
    const subj = conjuguer(v, 'subjonctif', p).forme;
    const qui = rng.pick([['Maman', 'veut'], ['Le maître', 'exige'], ['Papa', 'souhaite'], ['La directrice', 'demande']]);
    const apres = rng.pick(AVANT_DE.filter((x) => !x.startsWith(v)));
    const inf = apres.split(' ')[0];
    const phrase = `${qui[0]} ${qui[1]} que ${p.pronom} ${subj} ${c} avant de ${apres}.`.replace(/ que (?=[aeiouéè])/, " qu'");
    const q = qcm(rng, subj, [qui[1], inf]);
    if (!q) return null;
    return { _signature: `subj|${v}|${p.pronom}|${qui[0]}|${apres}`, ...q, fiche: 'fr-subjonctif-participe',
      enonce: `Dans la phrase « ${phrase} », quel verbe est au subjonctif ?`,
      explication: `« ${subj} » (verbe ${v}) est au subjonctif présent : il suit « ${qui[1]} que ». « ${qui[1]} » est à l'indicatif et « ${inf} » à l'infinitif.` };
  }
  // participe : présent ou passé dans « X est rentré(e) en …-ant … »
  const [v, c] = rng.pick(VERBES_ACTION());
  const perso = personnage(rng);
  const [aux, pp, inf] = rng.pick(RENTRER).map((x) => rendreGabarit(x, perso));
  const ppr = participePresent(v);
  if (inf === v) return null;
  const phrase = `${perso.nom} ${aux} en ${ppr} ${c}.`;
  const cherche = rng.pick(['présent', 'passé']);
  const bon = cherche === 'présent' ? ppr : pp;
  const q = qcm(rng, bon, [cherche === 'présent' ? pp : ppr, aux.split(' ')[0]]);
  if (!q) return null;
  return { _signature: `part|${v}|${perso.nom}|${inf}|${cherche}`, ...q, fiche: 'fr-subjonctif-participe',
    enonce: `Dans la phrase « ${phrase} », quel mot est un participe ${cherche} ?`,
    explication: `« ${ppr} » est le participe présent du verbe « ${v} » (terminaison -ant, invariable). « ${pp} » est le participe passé du verbe « ${inf} » (avec l'auxiliaire « ${aux.split(' ')[0]} »).` };
}

// ═════════════════════════ 15. Le participe présent ═════════════════════════
const EXCLUS_PPR = new Set(['vaincre', 'convaincre', 'asseoir']);
const verbesPPR = () => [...new Set([...VERBES_CONJ.map(([v]) => v), ...VERBES_ER.map(([v]) => v)])].filter((v) => !EXCLUS_PPR.has(v));
function fauxPPR(v, ppr) {
  const out = [];
  const racine = v.replace(/(er|ir|re|oir)$/, '');
  out.push(racine + 'ant');
  // Verbes à radical variable (appeler, nettoyer…) : le moteur ne conjugue correctement que « nous » et l'imparfait.
  const variable = VERBES_ER.some(([x, t]) => x === v && ['double', 'grave', 'aigu', 'ayer', 'oyer'].includes(t));
  if (variable) out.push(conjuguer(v, 'imparfait', { pronom: 'il', idx: 2 }).forme);
  else {
    const ils = conjuguer(v, 'present', { pronom: 'ils', idx: 5 }).forme;
    out.push(ils, ils.replace(/ent$/, 'ant'));
  }
  if (/çant$/.test(ppr)) out.push(ppr.replace('çant', 'cant'));
  if (/geant$/.test(ppr)) out.push(ppr.replace('geant', 'gant'));
  out.push(conjuguer(v, 'passe_compose', { pronom: 'il', idx: 2 }).forme.split(' ').at(-1));
  return out;
}
function explPPR(v) {
  const ppr = participePresent(v);
  if (v === 'être' || v === 'avoir' || v === 'savoir') return `Le participe présent de « ${v} » est « ${ppr} » : c'est une exception à retenir.`;
  const nous = conjuguer(v, 'present', { pronom: 'nous', idx: 3 }).forme;
  return `On prend le radical du verbe au présent avec « nous » (nous ${nous}) et on remplace -ons par -ant : ${ppr}. Le participe présent est invariable.`;
}
function frParticipePresent(modele, rng) {
  const v = rng.pick(verbesPPR());
  const ppr = participePresent(v);
  const forme = choixForme(rng, modele, ['former', 'choisir', 'choisir', 'nous', 'radical']);
  if (forme === 'former') {
    return { _signature: `former|${v}`, type: 'texte_court', souple: false, reponse: participesPresents(v),
      enonce: `Écris le participe présent du verbe « ${v} ».`, explication: explPPR(v) };
  }
  if (forme === 'choisir') {
    const q = qcm(rng, ppr, rng.shuffle(fauxPPR(v, ppr)), { interdits: participesPresents(v) });
    if (!q) return null;
    return { _signature: `choisir|${v}`, ...q, enonce: `Quel est le participe présent du verbe « ${v} » ?`, explication: explPPR(v) };
  }
  if (forme === 'nous') {
    if (['être', 'avoir', 'savoir'].includes(v)) return null;
    const nous = conjuguer(v, 'present', { pronom: 'nous', idx: 3 }).forme;
    return { _signature: `nous|${v}`, type: 'texte_court', souple: false, reponse: participesPresents(v),
      enonce: `On dit « nous ${nous} ». Écris le participe présent de ce verbe (${v}).`,
      explication: `nous ${nous} → radical « ${nous.replace(/ons$/, '')} » + -ant = ${ppr}.` };
  }
  // radical / terminaison
  const rad = ppr.slice(0, -3);
  const decoupe = (r) => `radical « ${r}- » + terminaison « -${ppr.slice(r.length)} »`;
  const pool = [ppr.slice(0, -4), ppr.slice(0, -2), ppr.slice(0, -5)].filter((r) => r.length >= 1 && r !== rad).map(decoupe);
  const q = qcm(rng, decoupe(rad), pool);
  if (!q) return null;
  return { _signature: `radical|${v}`, ...q, enonce: `Comment se découpe le participe présent « ${ppr} » (verbe ${v}) ?`,
    explication: `${maj(decoupe(rad))} : tous les participes présents se terminent par -ant. ${explPPR(v)}` };
}

// ═════════════════════════ 16. Le champ lexical ═════════════════════════
// [thème, groupe (les thèmes d'un même groupe peuvent partager des mots), mots]
const CHAMPS = [
  ['la mer', 'A', ['vague', 'plage', 'sable', 'coquillage', 'marée', 'mouette', 'phare', 'crabe', 'algue', 'port', 'voilier', 'nager', 'salé', 'plongeur']],
  ["l'hiver", 'A', ['neige', 'flocon', 'gel', 'luge', 'bonnet', 'écharpe', 'frissonner', 'verglas', 'patinoire', 'gelé', 'moufle', 'bonhomme de neige']],
  ['la ferme', 'A', ['tracteur', 'grange', 'fermier', 'poule', 'vache', 'étable', 'foin', 'labourer', 'poulailler', 'cochon', 'paille', 'traire']],
  ['la forêt', 'A', ['chêne', 'sapin', 'champignon', 'écureuil', 'clairière', 'sentier', 'mousse', 'branche', 'bûcheron', 'sanglier', 'tronc', 'hêtre']],
  ['la montagne', 'A', ['sommet', 'alpiniste', 'pente', 'rocher', 'téléphérique', 'glacier', 'chalet', 'randonnée', 'escalader', 'falaise']],
  ['le jardin', 'A', ['râteau', 'arrosoir', 'potager', 'bêche', 'semer', 'tondeuse', 'haie', 'pelouse', 'brouette', 'arroser', 'massif de fleurs']],
  ['la météo', 'A', ['pluie', 'nuage', 'orage', 'tonnerre', 'éclair', 'averse', 'arc-en-ciel', 'grêle', 'brouillard', 'pluvieux', 'nuageux']],
  ["l'école", 'B', ['cartable', 'cahier', 'récréation', 'maîtresse', 'élève', 'tableau', 'leçon', 'dictée', 'classe', 'trousse', 'devoirs', 'bulletin']],
  ['la cuisine', 'B', ['casserole', 'poêle', 'four', 'louche', 'recette', 'cuisiner', 'éplucher', 'frigo', 'saladier', 'fouet', 'mijoter', 'tablier']],
  ['la santé', 'B', ['médecin', 'malade', 'fièvre', 'thermomètre', 'pharmacie', 'ordonnance', 'sirop', 'guérir', 'tousser', 'hôpital', 'infirmière', 'vaccin']],
  ['le cirque', 'C', ['clown', 'jongleur', 'acrobate', 'chapiteau', 'piste', 'dompteur', 'trapèze', 'funambule', 'magicien', 'jongler']],
  ['le football', 'C', ['ballon', 'but', 'gardien', 'arbitre', 'penalty', 'stade', 'maillot', 'crampons', 'marquer', 'équipe', 'supporter', 'pelouse']],
  ['la musique', 'C', ['guitare', 'piano', 'chanteur', 'mélodie', 'orchestre', 'violon', 'refrain', 'concert', 'partition', 'tambour', 'rythme', 'chorale']],
  ['le château fort', 'D', ['chevalier', 'donjon', 'rempart', 'pont-levis', 'douves', 'armure', 'épée', 'seigneur', 'créneau', 'tournoi', 'meurtrière']],
  ["l'espace", 'D', ['fusée', 'astronaute', 'planète', 'étoile', 'comète', 'galaxie', 'satellite', 'orbite', 'télescope', 'cosmonaute']],
  ['la peur', 'E', ['trembler', 'frisson', 'cauchemar', 'effrayé', 'terreur', 'angoisse', 'frayeur', 'épouvante', 'terrifié', 'panique']],
  ['la joie', 'E', ['bonheur', 'heureux', 'ravi', 'enchanté', 'joyeux', 'gaieté', 'rayonnant', 'allégresse', 'content']],
];
// Groupes qu'on ne mélange pas (un mot de l'un pourrait se rattacher à l'autre).
const PROCHES = new Set(['C|E', 'E|C']);
const THEMES_PROCHES = [["l'hiver", 'la santé'], ['la cuisine', 'la ferme'], ['la cuisine', 'le jardin'], ['la mer', 'la cuisine'], ['la ferme', 'la santé'], ["l'école", 'la musique']];
const compatibles = (a, b) => a[1] !== b[1] && !PROCHES.has(`${a[1]}|${b[1]}`) && !a[2].some((m) => b[2].includes(m))
  && !THEMES_PROCHES.some(([x, y]) => (x === a[0] && y === b[0]) || (x === b[0] && y === a[0]));

const deT = (t) => t.replace(/^le /, 'du ').replace(/^(la |l')/, 'de $1');
const aT = (t) => t.replace(/^le /, 'au ').replace(/^(la |l')/, 'à $1');
function frChampLexical(modele, rng) {
  const i = rng.int(0, CHAMPS.length - 1);
  const [theme, , mots] = CHAMPS[i];
  const loin = CHAMPS.filter((c) => compatibles(CHAMPS[i], c));
  const forme = choixForme(rng, modele, ['intrus', 'intrus', 'theme', 'lequel', 'grille']);
  if (forme === 'intrus') {
    const groupe = rng.shuffle(mots).slice(0, 3);
    const autre = rng.pick(loin);
    const intrus = rng.pick(autre[2]);
    const q = qcm(rng, intrus, groupe);
    if (!q) return null;
    return { _signature: `intrus|${i}|${q.choix.slice().sort().join(',')}`, ...q,
      enonce: `Trois de ces mots appartiennent au champ lexical ${deT(theme)}. Lequel est l'intrus ?`,
      explication: `${listeEt(groupe.map((m) => `« ${m} »`))} font penser ${aT(theme)}. « ${intrus} » appartient plutôt au champ lexical ${deT(autre[0])}.` };
  }
  if (forme === 'theme') {
    const groupe = rng.shuffle(mots).slice(0, 4);
    const q = qcm(rng, theme, loin.map((c) => c[0]));
    if (!q) return null;
    return { _signature: `theme|${i}|${groupe.slice().sort().join(',')}`, ...q,
      enonce: `Ces mots appartiennent au même champ lexical : ${groupe.join(', ')}. Quel est le thème ?`,
      explication: `Ces mots font tous penser ${aT(theme)} : ils forment le champ lexical ${deT(theme)}.` };
  }
  if (forme === 'lequel') {
    const bon = rng.pick(mots);
    const autres = rng.shuffle(loin).slice(0, 3).map((c) => rng.pick(c[2]));
    const q = qcm(rng, bon, autres);
    if (!q) return null;
    return { _signature: `lequel|${i}|${q.choix.slice().sort().join(',')}`, ...q,
      enonce: `Lequel de ces mots appartient au champ lexical ${deT(theme)} ?`,
      explication: `« ${bon} » fait penser ${aT(theme)}. Un champ lexical regroupe des mots (noms, verbes, adjectifs…) qui se rapportent à un même thème.` };
  }
  // grille : deux thèmes
  const autre = rng.pick(loin);
  const lignes = [...rng.shuffle(mots).slice(0, 2).map((m) => [m, 0]), ...rng.shuffle(autre[2]).slice(0, 2).map((m) => [m, 1])];
  const tri = rng.shuffle(lignes);
  return { _signature: `grille|${tri.map((x) => x[0]).sort().join(',')}`, type: 'grille', lignes: tri.map((x) => x[0]), colonnes: [theme, autre[0]],
    reponse: tri.map((x) => x[1]), points: 4, enonce: 'Range chaque mot dans le bon champ lexical.',
    explication: tri.map(([m, k]) => `« ${m} » → ${k ? autre[0] : theme}`).join(' ; ') + '.' };
}

// ═════════════════════════ 17. Intensité, certitude et probabilité ═════════════════════════
// Échelles d'intensité, du plus faible au plus fort.
const ECHELLES = [
  ['tiède', 'chaud', 'brûlant'], ['frais', 'froid', 'glacial'], ['inquiet', 'effrayé', 'terrorisé'], ['agacé', 'fâché', 'furieux'],
  ['grignoter', 'manger', 'dévorer'], ['apprécier', 'aimer', 'adorer'], ['joli', 'beau', 'magnifique'], ['amusant', 'drôle', 'hilarant'],
  ['humide', 'mouillé', 'trempé'], ['chuchoter', 'parler', 'crier'], ['une brise', 'une tempête', 'un ouragan'], ['sourire', 'rire', 'éclater de rire'],
  ['un peu', 'beaucoup', 'énormément'], ['marcher', 'courir', 'foncer'], ['une averse', 'un déluge'], ['grand', 'immense'], ['bon', 'délicieux'],
  ['petit', 'minuscule'], ['fatigué', 'épuisé'], ['sale', 'crasseux'],
];
// [sujet + verbe, adjectif] et adverbes d'intensité
const PHRASES_INT = [
  ['Ce gâteau est', 'bon'], ['La soupe est', 'chaude'], ['Le film était', 'long'], ['Cette valise est', 'lourde'], ['Le chemin est', 'étroit'],
  ['Mon frère est', 'fatigué'], ['Ce problème est', 'difficile'], ['La mer était', 'froide'], ['Ton dessin est', 'joli'], ['Le chien de Louis est', 'gentil'],
  ['Cette histoire est', 'drôle'], ['Le parc est', 'calme'], ['Ma sœur était', 'contente'], ['Le pull est', 'grand'], ['Le bruit était', 'fort'],
];
const ADV_INT = ['très', 'trop', 'si', 'assez', 'peu', 'extrêmement', 'tellement', 'vraiment'];
// Propositions au futur ; marques de certitude et de possibilité.
const INFOS_MOD = ['il pleuvra demain', 'Léa gagnera la course', 'le train aura du retard', 'nous partirons en vacances en juillet', 'le magasin sera fermé lundi',
  'Louis viendra à la fête', "l'équipe de l'école remportera le tournoi", 'il neigera à Noël', 'les cerises seront mûres en juin', 'le spectacle commencera à vingt heures',
  'ma tante arrivera ce soir', 'le bus passera dans cinq minutes', 'Arthur réussira son examen', 'les hirondelles reviendront au printemps', 'le colis arrivera mardi'];
const CERTAIN = [(x) => `Il est certain que ${x}.`, (x) => `Je suis sûr que ${x}.`, (x) => `Sans aucun doute, ${x}.`, (x) => `J'en suis certaine : ${x}.`, (x) => `C'est sûr : ${x}.`];
// (« Il est possible que » est exclu : il demande le subjonctif.)
const POSSIBLE = [(x) => `Peut-être que ${x}.`, (x) => `Probablement, ${x}.`, (x) => `Sans doute, ${x}.`, (x) => `Il est probable que ${x}.`];
const MARQUES = { certain: ['Il est certain que', 'Je suis sûr que', 'Sans aucun doute', "J'en suis certaine", "C'est sûr"], possible: ['Peut-être que', 'Probablement', 'Sans doute', 'Il est probable que'] };
const CHOIX_MOD = ['certaine', 'possible, mais pas sûre'];
const elision = (s) => s.replace(/ que (?=[aeiouyéèhAEIOUYÉ])/g, " qu'");

function frIntensiteModalite(modele, rng) {
  const forme = choixForme(rng, modele, ['ordre', 'fort', 'adverbe', 'modalite', 'modalite', 'laquelle']);
  if (forme === 'ordre' || forme === 'fort') {
    const iE = rng.int(0, ECHELLES.length - 1);
    const e = ECHELLES[iE];
    if (forme === 'ordre') {
      if (e.length < 3) return null;
      const elements = rng.shuffle(e);
      if (elements.every((x, k) => x === e[k])) return null;
      return { _signature: `ordre|${iE}|${elements.join(',')}`, type: 'ordre', elements, reponse: e.map((x) => elements.indexOf(x)),
        enonce: "Range ces mots du plus faible au plus fort (ordre d'intensité).", explication: `${e.join(' → ')} : chaque mot exprime la même idée, de plus en plus fort.` };
    }
    const choix = rng.shuffle(e);
    return { _signature: `fort|${iE}|${choix.join(',')}`, ...qcmFixe(e.at(-1), choix), enonce: "Lequel de ces mots exprime l'idée la plus forte ?",
      explication: `${e.join(' → ')} : « ${e.at(-1)} » exprime l'idée la plus forte.` };
  }
  if (forme === 'adverbe') {
    const iP = rng.int(0, PHRASES_INT.length - 1);
    const [sv, adj] = PHRASES_INT[iP];
    const adv = rng.pick(ADV_INT);
    const phrase = `${sv} ${adv} ${adj}.`;
    const mots = sv.split(' ');
    const q = qcm(rng, adv, [adj, mots.at(-1), mots.at(-2)]);
    if (!q) return null;
    const sens = { très: 'une forte intensité', trop: 'un excès (plus que ce qu\'il faut)', si: 'une forte intensité', assez: 'une intensité moyenne', peu: 'une faible intensité', extrêmement: 'une très forte intensité', tellement: 'une forte intensité', vraiment: 'une forte intensité' }[adv];
    return { _signature: `adv|${iP}|${adv}|${q.choix.slice().sort().join(',')}`, ...q,
      enonce: `Dans la phrase « ${phrase} », quel mot modifie l'intensité de l'adjectif « ${adj} » ?`,
      explication: `« ${adv} » est un adverbe d'intensité : il exprime ${sens}.` };
  }
  const info = rng.pick(INFOS_MOD);
  if (forme === 'modalite') {
    const certain = rng.next() < 0.5;
    const iM = rng.int(0, (certain ? CERTAIN : POSSIBLE).length - 1);
    const phrase = elision(maj((certain ? CERTAIN : POSSIBLE)[iM](info)));
    const marque = (certain ? MARQUES.certain : MARQUES.possible)[iM];
    return { _signature: `mod|${phrase}`, ...qcmFixe(CHOIX_MOD[certain ? 0 : 1], CHOIX_MOD),
      enonce: `Dans la phrase « ${phrase} », l'information est-elle présentée comme certaine ou seulement comme possible ?`,
      explication: certain ? `« ${elision(marque)} » montre que celui qui parle est sûr : l'information est présentée comme certaine.`
        : `« ${elision(marque)} » montre que celui qui parle n'est pas sûr : l'information est seulement possible ou probable.${marque === 'Sans doute' ? ' Attention : « sans doute » veut dire « probablement », pas « c\'est certain ».' : ''}` };
  }
  // laquelle : 1 phrase certaine parmi 3 possibles (ou l'inverse)
  const cherche = rng.next() < 0.5 ? 'certaine' : 'possible';
  const bonF = rng.pick(cherche === 'certaine' ? CERTAIN : POSSIBLE);
  const autres = rng.shuffle(cherche === 'certaine' ? POSSIBLE : CERTAIN).slice(0, 3).map((f) => elision(maj(f(info))));
  const bonne = elision(maj(bonF(info)));
  const q = qcm(rng, bonne, autres);
  if (!q) return null;
  return { _signature: `laquelle|${cherche}|${q.choix.slice().sort().join('|')}`, ...q,
    enonce: cherche === 'certaine' ? "Laquelle de ces phrases présente l'information comme certaine ?" : "Laquelle de ces phrases présente l'information comme seulement possible (pas sûre) ?",
    explication: `« ${bonne} » ${cherche === 'certaine' ? 'Les autres phrases contiennent un mot qui montre un doute (peut-être, probablement, sans doute, il est probable que…).' : 'Les autres phrases contiennent un mot qui montre la certitude (il est certain que, sans aucun doute, c\'est sûr…).'}` };
}

// ═════════════════════════ 18. Mots composés ; justifier une graphie ═════════════════════════
// [mot, sorte, pluriel, faux pluriels, règle du pluriel]
const COMPOSES = [
  ['portefeuille', 'soudé', 'portefeuilles', ['portesfeuilles', 'portefeuille'], 'soude'], ['tournesol', 'soudé', 'tournesols', ['tournesol', 'tournesoles'], 'soude'],
  ['parapluie', 'soudé', 'parapluies', ['parapluie', 'parapluis'], 'soude'], ['passeport', 'soudé', 'passeports', ['passeport', 'passesports'], 'soude'],
  ['portemanteau', 'soudé', 'portemanteaux', ['portemanteaus', 'portesmanteaux'], 'soude'], ['autoroute', 'soudé', 'autoroutes', ['autoroute', 'autosroutes'], 'soude'],
  ['marchepied', 'soudé', 'marchepieds', ['marchepied', 'marchespieds'], 'soude'], ['paratonnerre', 'soudé', 'paratonnerres', ['paratonnerre', 'parastonnerres'], 'soude'],
  ['parachute', 'soudé', 'parachutes', ['parachute', 'paraschutes'], 'soude'], ['gendarme', 'soudé', 'gendarmes', ['gendarme', 'gensdarmes'], 'soude'],
  ['chou-fleur', "trait d'union", 'choux-fleurs', ['choux-fleur', 'chou-fleurs', 'chous-fleurs'], 'nn'], ['coffre-fort', "trait d'union", 'coffres-forts', ['coffre-forts', 'coffres-fort'], 'na'],
  ['cerf-volant', "trait d'union", 'cerfs-volants', ['cerf-volants', 'cerfs-volant'], 'na'], ['rouge-gorge', "trait d'union", 'rouges-gorges', ['rouge-gorges', 'rouges-gorge'], 'na'],
  ['oiseau-mouche', "trait d'union", 'oiseaux-mouches', ['oiseau-mouches', 'oiseaux-mouche', 'oiseaus-mouches'], 'nn'], ['bateau-mouche', "trait d'union", 'bateaux-mouches', ['bateau-mouches', 'bateaux-mouche'], 'nn'],
  ['wagon-restaurant', "trait d'union", 'wagons-restaurants', ['wagon-restaurants', 'wagons-restaurant'], 'nn'], ['timbre-poste', "trait d'union", 'timbres-poste', ['timbres-postes', 'timbre-postes'], 'nc'],
  ['sous-marin', "trait d'union", 'sous-marins', ['sous-marin', 'sous-marines'], 'inv'], ['sous-sol', "trait d'union", 'sous-sols', ['sous-sol', 'sous-solx'], 'inv'],
  ['avant-bras', "trait d'union", 'avant-bras', ['avants-bras', 'avant-bra'], 'inv'], ['demi-heure', "trait d'union", 'demi-heures', ['demies-heures', 'demis-heures'], 'demi'],
  ['belle-sœur', "trait d'union", 'belles-sœurs', ['belle-sœurs', 'belles-sœur'], 'na'],
  ['pomme de terre', 'avec un connecteur', 'pommes de terre', ['pommes de terres', 'pomme de terres'], 'prep'], ['machine à laver', 'avec un connecteur', 'machines à laver', ['machines à lavers', 'machine à laver'], 'prep'],
  ['brosse à dents', 'avec un connecteur', 'brosses à dents', ['brosses à dent', 'brosse à dents'], 'prep'], ['sac à dos', 'avec un connecteur', 'sacs à dos', ['sac à dos', 'sacs à doss'], 'prep'],
  ['moulin à vent', 'avec un connecteur', 'moulins à vent', ['moulins à vents', 'moulin à vents'], 'prep'], ['fer à repasser', 'avec un connecteur', 'fers à repasser', ['fers à repassers', 'fer à repasser'], 'prep'],
  ['boîte aux lettres', 'avec un connecteur', 'boîtes aux lettres', ['boîtes aux lettre', 'boîte aux lettres'], 'prep'], ['chemin de fer', 'avec un connecteur', 'chemins de fer', ['chemins de fers', 'chemin de fers'], 'prep'],
  ['hôtel de ville', 'avec un connecteur', 'hôtels de ville', ['hôtels de villes', 'hôtel de villes'], 'prep'], ['pomme de pin', 'avec un connecteur', 'pommes de pin', ['pommes de pins', 'pomme de pins'], 'prep'],
  ['carte postale', 'juxtaposé', 'cartes postales', ['cartes postale', 'carte postales'], 'na'], ['bande dessinée', 'juxtaposé', 'bandes dessinées', ['bandes dessinée', 'bande dessinées'], 'na'],
  ['chaise longue', 'juxtaposé', 'chaises longues', ['chaises longue', 'chaise longues'], 'na'], ['poisson rouge', 'juxtaposé', 'poissons rouges', ['poissons rouge', 'poisson rouges'], 'na'],
  ['chien policier', 'juxtaposé', 'chiens policiers', ['chiens policier', 'chien policiers'], 'nn'],
  ['arc-en-ciel', null, 'arcs-en-ciel', ['arcs-en-ciels', 'arc-en-ciels'], 'prep'], ["chef-d'œuvre", null, "chefs-d'œuvre", ["chefs-d'œuvres", "chef-d'œuvres"], 'prep'],
];
const FEMININS_COMP = new Set(['autoroute', 'demi-heure', 'belle-sœur', 'pomme de terre', 'machine à laver', 'brosse à dents', 'boîte aux lettres', 'pomme de pin', 'carte postale', 'bande dessinée', 'chaise longue']);
const SORTES_COMP = {
  soudé: 'soudé (les mots sont collés en un seul mot)', "trait d'union": "avec un trait d'union", 'avec un connecteur': 'avec un connecteur (de, à, en…)', juxtaposé: "juxtaposé (deux mots séparés par une espace, sans trait d'union)",
};
const REGLES_COMP = {
  soude: 'Un mot composé soudé prend la marque du pluriel comme un mot simple, à la fin.',
  nn: 'Nom + nom : les deux noms prennent la marque du pluriel.',
  na: 'Nom + adjectif (ou adjectif + nom) : les deux mots prennent la marque du pluriel.',
  nc: 'Le second nom complète le premier (un timbre pour la poste) : seul le premier nom prend la marque du pluriel.',
  inv: 'Le premier mot est invariable (sous, avant…) : seul le nom prend la marque du pluriel (s\'il ne se termine pas déjà par s).',
  demi: '« Demi » placé devant le nom, avec un trait d\'union, reste invariable : seul le nom prend la marque du pluriel.',
  prep: 'Avec un connecteur (de, à, en…), seul le premier nom prend la marque du pluriel : le reste complète ce nom.',
};
// Graphies justifiées par un préfixe : [mot, préfixe, base, lettre doublée]
const GRAPHIES = [
  ['immangeable', 'im-', 'mangeable', 'm'], ['immobile', 'im-', 'mobile', 'm'], ['immortel', 'im-', 'mortel', 'm'], ['innombrable', 'in-', 'nombrable', 'n'],
  ['illisible', 'il-', 'lisible', 'l'], ['illégal', 'il-', 'légal', 'l'], ['illimité', 'il-', 'limité', 'l'], ['illogique', 'il-', 'logique', 'l'],
  ['irréel', 'ir-', 'réel', 'r'], ['irrégulier', 'ir-', 'régulier', 'r'], ['irremplaçable', 'ir-', 'remplaçable', 'r'], ['irresponsable', 'ir-', 'responsable', 'r'],
  ['irréparable', 'ir-', 'réparable', 'r'], ['emmener', 'em-', 'mener', 'm'], ['emmêler', 'em-', 'mêler', 'm'], ['enneigé', 'en-', 'neige', 'n'],
  ['inoubliable', 'in-', 'oubliable', null], ['impossible', 'im-', 'possible', null], ['imbuvable', 'im-', 'buvable', null], ['immature', 'im-', 'mature', 'm'],
];
function frMotsComposes(modele, rng) {
  const forme = choixForme(rng, modele, ['sorte', 'pluriel', 'pluriel', 'pluriel_ecrire', 'graphie']);
  if (forme === 'graphie') {
    const iG = rng.int(0, GRAPHIES.length - 1);
    const [mot, pre, base, double] = GRAPHIES[iG];
    if (!double) return null;
    const bonne = `On ajoute le préfixe ${pre} devant le mot « ${base} ».`;
    const faux = ['On double toujours cette consonne au début d\'un mot.', 'C\'est une exception sans explication, à retenir par cœur.',
      `Le mot vient de « ${pre.replace('-', '')} » et de « ${double}${base.slice(1)} ».`, `Le mot de base « ${base} » s'écrit déjà avec deux « ${double} ».`];
    const q = qcm(rng, bonne, faux.slice(0, 2).concat(faux[3]));
    if (!q) return null;
    return { _signature: `graphie|${iG}`, ...q, fiche: 'fr-prefixes-suffixes',
      enonce: `Pourquoi le mot « ${mot} » s'écrit-il avec deux « ${double} » ?`,
      explication: `${mot} = ${pre} + ${base}. ${pre === 'il-' ? 'Devant l, le préfixe in- devient il-.' : pre === 'ir-' ? 'Devant r, le préfixe in- devient ir-.' : pre === 'im-' ? 'Devant m, b ou p, le préfixe in- devient im-.' : pre === 'em-' ? 'Devant m, b ou p, le préfixe en- devient em-.' : 'Le préfixe se termine par n et le mot de base commence par n.'} La consonne du préfixe et celle du mot de base se suivent : on en écrit deux.` };
  }
  const iC = rng.int(0, COMPOSES.length - 1);
  const [mot, sorte, pl, faux, regle] = COMPOSES[iC];
  if (forme === 'sorte') {
    if (!sorte) return null;
    const q = qcmFixe(SORTES_COMP[sorte], Object.values(SORTES_COMP));
    return { _signature: `sorte|${iC}`, ...q, enonce: `Comment est formé le mot composé « ${mot} » ?`,
      explication: `« ${mot} » est un mot composé ${SORTES_COMP[sorte]}. Un mot composé est formé de plusieurs mots et désigne une seule chose.` };
  }
  const un = FEMININS_COMP.has(mot) ? 'une' : 'un';
  const expl = `${maj(un)} ${mot}, des ${pl}. ${REGLES_COMP[regle]}`;
  if (forme === 'pluriel') {
    const q = qcm(rng, pl, faux);
    if (!q) return null;
    return { _signature: `pluriel|${iC}`, ...q, enonce: `Quel est le pluriel de « ${mot} » ?`, explication: expl };
  }
  return { _signature: `plecrire|${iC}`, type: 'texte_court', souple: false, reponse: [pl, `des ${pl}`],
    enonce: `Écris au pluriel : ${un} ${mot} → des …`, explication: expl };
}

// ═════════════════════════ 19. Cohérence des temps dans un récit au passé ═════════════════════════
// Actions qui durent (arrière-plan, imparfait) : [verbe, complément] ; évènements soudains (passé simple) : [sujet, verbe, complément].
// Lieu : i = à l'intérieur, o = dehors, b = les deux (l'évènement doit être possible à l'endroit de l'action).
const FONDS = [['lire', 'un roman', 'b'], ['dormir', 'sous la tente', 'o'], ['jouer', 'au ballon', 'o'], ['regarder', 'les étoiles', 'o'], ['marcher', 'dans la forêt', 'o'],
  ['dessiner', 'un dragon', 'i'], ['ranger', 'sa chambre', 'i'], ['écouter', 'la radio', 'i'], ['chanter', 'une chanson', 'b'], ['nager', 'dans le lac', 'o'],
  ['tricoter', 'une écharpe', 'i'], ['peindre', 'un paysage', 'b'], ['attendre', 'le bus', 'o'], ['écrire', 'une lettre', 'i'], ['préparer', 'le repas', 'i'], ['réfléchir', 'à son problème', 'b']];
const EVENEMENTS = [['le téléphone', 'sonner', '', 'b'], ['un éclair', 'illuminer', 'le ciel', 'b'], ['une voiture', 'klaxonner', 'dans la rue', 'i'], ["quelqu'un", 'frapper', 'à la porte', 'i'],
  ['un oiseau', 'entrer', 'par la fenêtre', 'i'], ['le vent', 'claquer', 'la porte', 'i'], ['un vase', 'tomber', "de l'étagère", 'i'], ['un renard', 'apparaître', 'au bout du chemin', 'o'],
  ['un orage', 'éclater', '', 'b'], ['une souris', 'traverser', 'la cuisine', 'i'], ['un inconnu', 'venir', 'vers lui', 'b'],
  ['la lumière', 'trembler', '', 'i'], ['un chien', 'grogner', 'derrière la haie', 'o'], ['un hibou', 'hululer', 'tout près', 'o']];
const DECORS = [['faire', 'Il', 'nuit'], ['être', 'Il', 'tard'], ['faire', 'Il', 'froid'], ['souffler', 'Le vent', 'fort'], ['briller', 'La lune', 'dans le ciel']];
const conj3 = (v, t, idx = 2) => conjuguer(v, t, { pronom: idx === 5 ? 'ils' : 'il', idx }).forme;
const avecC = (...m) => m.filter(Boolean).join(' ');
const REGLE_REC = "Dans un récit au passé, l'imparfait décrit le décor ou une action qui dure (l'arrière-plan) ; le passé simple raconte une action soudaine, qui fait avancer l'histoire (le premier plan).";

function frCoherenceTemps(modele, rng) {
  const perso = personnage(rng);
  const plur = rng.next() < 0.25;
  const sujet = plur ? rng.pick(['les enfants', 'mes cousins', 'les campeurs']) : perso.nom;
  const idx = plur ? 5 : 2;
  const [vF, cF, lieu] = rng.pick(FONDS);
  const ev = rng.pick(EVENEMENTS.filter((e) => !(e[2] === 'vers lui' && plur) && (lieu === 'b' || e[3] === 'b' || e[3] === lieu)));
  const [sE, vE, cE] = ev;
  const cFond = cF.replace(/^sa /, plur ? 'leur ' : 'sa ').replace('son problème', plur ? 'leur problème' : 'son problème');
  const fond = conj3(vF, 'imparfait', idx);
  const evt = conj3(vE, 'passe_simple');
  const lui = ev[2] === 'vers lui' ? (perso.f ? 'vers elle' : 'vers lui') : cE;
  const forme = choixForme(rng, modele, ['fond', 'evenement', 'intrus']);
  const phrase = (f, e) => maj(avecC(sujet, f, cFond, 'quand, tout à coup,', sE, e, lui)) + '.';
  const sig = `${sujet}|${vF}|${vE}`;
  if (forme === 'fond') {
    const pool = [conj3(vF, 'passe_simple', idx), conj3(vF, 'present', idx), conj3(vF, 'futur', idx)];
    const q = qcm(rng, fond, pool);
    if (!q) return null;
    return { _signature: `fond|${sig}`, ...q, fiche: 'fr-coherence-temps',
      enonce: `Complète ce récit au passé avec le verbe « ${vF} » : « ${phrase('___', evt)} »`,
      explication: `« ${phrase(fond, evt)} » Cette action dure encore quand l'évènement arrive : imparfait. ${REGLE_REC}` };
  }
  if (forme === 'evenement') {
    if (conj3(vE, 'present') === evt) return null;
    const pool = [conj3(vE, 'imparfait'), conj3(vE, 'present'), conj3(vE, 'futur')];
    const q = qcm(rng, evt, pool);
    if (!q) return null;
    return { _signature: `evt|${sig}`, ...q, fiche: 'fr-coherence-temps',
      enonce: `Complète ce récit au passé avec le verbe « ${vE} » : « ${phrase(fond, '___')} »`,
      explication: `« ${phrase(fond, evt)} » « Tout à coup » annonce une action soudaine, qui fait avancer le récit : passé simple. ${REGLE_REC}` };
  }
  // intrus : un des trois verbes n'est pas au bon temps
  const decor = rng.pick(DECORS);
  const dImp = conj3(decor[0], 'imparfait');
  const verbes = [dImp, fond, evt];
  const k = rng.int(0, 2);
  const tFaux = rng.pick(['present', 'futur']);
  const faux = [conj3(decor[0], tFaux), conj3(vF, tFaux, idx), conj3(vE, tFaux)][k];
  if (faux === verbes[k]) return null;
  const v2 = verbes.slice(); v2[k] = faux;
  const texte = (vs) => `${avecC(decor[1], vs[0], decor[2])}. ${maj(avecC(sujet, vs[1], cFond))}. Soudain, ${avecC(sE, vs[2], lui)}.`;
  const q = qcm(rng, faux, v2.filter((_, j) => j !== k));
  if (!q) return null;
  return { _signature: `intrus|${sig}|${decor[0]}|${k}|${tFaux}`, ...q, fiche: 'fr-coherence-temps',
    enonce: `Dans ce récit au passé, un verbe n'est pas conjugué au bon temps. Lequel ? « ${texte(v2)} »`,
    explication: `Il faut écrire « ${verbes[k]} » : « ${texte(verbes)} » ${REGLE_REC}` };
}

// ═════════════════════════ 20. Le paratexte (termes du support de lecture) ═════════════════════════
const PARATEXTE = [
  ['le titre', ["Il annonce le sujet du texte ou du livre ; il est écrit en gros caractères, tout en haut.", "Sur la couverture d'un livre, « Le Petit Prince » est ___."]],
  ['le chapeau', ["Dans un article de journal, c'est le court texte placé sous le titre, souvent en gras, qui résume l'essentiel.", "Sous le titre d'un article, on lit en gras : « Samedi, deux cents enfants ont couru pour une association. » Ce petit texte est ___."]],
  ['la légende', ["C'est le court texte placé sous (ou à côté d') une photo ou un dessin, qui explique ce qu'on voit.", "Sous la photo d'un renard, on lit : « Un renard roux dans la neige. » Ce texte est ___."]],
  ['le sommaire', ["Au début d'un magazine ou d'un livre, c'est la liste des parties avec leur numéro de page.", "Pour savoir à quelle page commence le chapitre 3, tu regardes au début du livre, dans ___."]],
  ["l'index", ["À la fin d'un livre documentaire, c'est la liste des mots importants, rangés dans l'ordre alphabétique, avec les pages où on en parle.", "Pour trouver vite la page qui parle du hérisson dans un gros documentaire, tu cherches le mot « hérisson » dans ___, à la fin du livre."]],
  ['la quatrième de couverture', ["C'est le dos du livre : on y trouve souvent un résumé de l'histoire pour donner envie de le lire.", "Pour lire le résumé d'un roman avant de l'emprunter, tu retournes le livre et tu lis ___."]],
  ['un intertitre', ["C'est un petit titre placé à l'intérieur d'un texte pour annoncer la partie qui suit.", "Au milieu d'un article sur les abeilles, on lit en gras : « Comment fabriquent-elles le miel ? » C'est ___."]],
  ['un encadré', ["C'est un petit texte entouré d'un cadre, à côté du texte principal, qui donne une information en plus.", "À côté d'un article sur les volcans, un petit texte dans un cadre de couleur commence par « Le savais-tu ? ». C'est ___."]],
  ['une note de bas de page', ["C'est une explication placée en bas de la page ; dans le texte, un astérisque (*) ou un petit chiffre y renvoie.", "Dans un texte, le mot « menhir » est suivi d'un astérisque (*). L'explication de ce mot se trouve dans ___."]],
  ["la maison d'édition", ["C'est l'entreprise qui a fabriqué et publié le livre ; son nom ou son logo figure sur la couverture.", "Sur la couverture, sous le nom de l'auteur, on lit « Éditions du Lombard » : c'est ___."]],
  ['la collection', ["C'est un ensemble de livres d'un même éditeur qui se ressemblent (même format, même genre).", "Sur la tranche de plusieurs romans, on lit « Folio Junior » : c'est le nom de ___."]],
  ['un hyperlien', ["Sur une page internet, c'est un mot ou une image sur lequel on clique pour aller vers une autre page.", "Sur un site, le mot « volcans » est souligné en bleu ; quand on clique dessus, une autre page s'ouvre. Ce mot est ___."]],
];
function frParatexte(modele, rng) {
  const i = rng.int(0, PARATEXTE.length - 1);
  const [terme, descs] = PARATEXTE[i];
  const autres = PARATEXTE.filter((_, j) => j !== i);
  const forme = choixForme(rng, modele, ['terme', 'terme', 'definition']);
  if (forme === 'terme') {
    const k = rng.int(0, descs.length - 1);
    const d = descs[k];
    const q = qcm(rng, terme, autres.map((x) => x[0]));
    if (!q) return null;
    return { _signature: `terme|${i}|${k}|${q.choix.slice().sort().join(',')}`, ...q,
      enonce: d.includes('___') ? `Complète : ${d}` : `${d} Comment appelle-t-on cet élément ?`,
      explication: `C'est ${terme} : ${descs[0].charAt(0).toLowerCase()}${descs[0].slice(1)}` };
  }
  const q = qcm(rng, descs[0], autres.map((x) => x[1][0]));
  if (!q) return null;
  return { _signature: `def|${i}|${q.choix.slice().sort().join('|')}`, ...q,
    enonce: `Qu'est-ce ${/^(un|une) /.test(terme) ? "qu'" : 'que '}${terme} ?`, explication: `${maj(terme)} : ${descs[0].charAt(0).toLowerCase()}${descs[0].slice(1)}` };
}

// ═════════════════════════ 21. Sources, fiabilité, pertinence d'un lien ═════════════════════════
const SUJETS_RECH = [
  ['les volcans', 'Les volcans : comment se forme une éruption ?'], ['les abeilles', 'La vie des abeilles dans la ruche'], ['les châteaux forts', 'Les châteaux forts au Moyen Âge'],
  ['le hérisson', 'Le hérisson : alimentation et hibernation'], ['la Lune', 'La Lune et ses phases'], ['les dinosaures', 'Les dinosaures : quand ont-ils disparu ?'],
  ['le recyclage', 'Comment trier et recycler ses déchets ?'], ['les pyramides d\'Égypte', 'Les pyramides d\'Égypte et les pharaons'], ['la Meuse', 'La Meuse, de sa source à la mer du Nord'],
  ['le corps humain', 'Le squelette et les muscles du corps humain'], ['les baleines', 'Les baleines : des mammifères marins géants'], ['les éclairs', 'Les orages et les éclairs expliqués aux enfants'],
];
const deX = (x) => (x.startsWith('les ') ? `des ${x.slice(4)}` : x.startsWith('le ') ? `du ${x.slice(3)}` : `de ${x}`);
const FIABLES = [(s) => `une encyclopédie pour la jeunesse, article « ${s} », mise à jour cette année`, (s) => `le site d'un musée, page « ${s} »`, (s) => `un livre documentaire sur ${s}, écrit par un spécialiste`];
const PAS_FIABLES = [(s) => `un message anonyme sur un forum : « Je crois avoir lu un truc sur ${s}… »`, (s) => `une publicité : « Achetez notre jeu sur ${s} ! »`, (s) => `le blog d'un inconnu, sans date ni auteur, qui parle ${deX(s)}`, (s) => `une vidéo de blagues sur ${s}`];
function frSources(modele, rng) {
  const i = rng.int(0, SUJETS_RECH.length - 1);
  const [sujet, titre] = SUJETS_RECH[i];
  const forme = choixForme(rng, modele, ['lien', 'lien', 'fiable', 'date']);
  if (forme === 'lien') {
    const autres = rng.shuffle(SUJETS_RECH.filter((_, j) => j !== i)).slice(0, 3).map((x) => x[1]);
    const q = qcm(rng, titre, autres);
    if (!q) return null;
    return { _signature: `lien|${i}|${q.choix.slice().sort().join('|')}`, ...q,
      enonce: `Tu prépares un exposé sur ${sujet}. Sur un moteur de recherche, quel lien est pertinent (utile pour ta recherche) ?`,
      explication: `« ${titre} » parle ${deX(sujet)} : ce lien correspond à ton but de lecture. Avant de cliquer, lis bien le titre du lien.` };
  }
  if (forme === 'fiable') {
    const kF = rng.int(0, FIABLES.length - 1);
    const bon = FIABLES[kF](sujet);
    const q = qcm(rng, bon, PAS_FIABLES.map((f) => f(sujet)));
    if (!q) return null;
    return { _signature: `fiable|${i}|${kF}|${q.choix.slice().sort().join('|')}`, ...q,
      enonce: `Pour un exposé sur ${sujet}, quelle source est la plus fiable ?`,
      explication: `${maj(bon)} : on connaît l'auteur ou l'organisme, l'information est vérifiée et datée. Un message anonyme, une publicité ou une vidéo de blagues ne sont pas des sources sûres.` };
  }
  // date : l'information la plus récente
  const quoi = rng.pick([['les horaires actuels des bus de ta ville', 'Les horaires changent souvent'], ['la météo de ce week-end', 'La météo change chaque jour'],
    ['les prix actuels des places de cinéma', 'Les prix changent souvent'], ['le classement actuel de ton équipe de football', 'Le classement change après chaque match']]);
  const base = rng.int(2012, 2018);
  const annees = rng.shuffle([base, base + 2, base + 4, base + 7]);
  const docs = annees.map((a) => `un document daté de ${a}`);
  const recent = Math.max(...annees);
  const q = qcmFixe(docs[annees.indexOf(recent)], docs);
  return { _signature: `date|${quoi[0]}|${annees.join(',')}`, ...q,
    enonce: `Tu cherches ${quoi[0]}. Plusieurs documents en parlent. Lequel choisis-tu ?`,
    explication: `${quoi[1]} : il faut le document le plus récent (${recent}). Regarde toujours la date d'un document.` };
}

export const GENERATEURS = {
  tc_fr_conj_composes: frConjComposes,
  tc_fr_radical_er: frRadicalEr,
  tc_fr_corriger: frCorriger,
  tc_fr_fonctions_gn: frFonctionsGN,
  tc_fr_predicat: frPredicat,
  tc_fr_ponctuation: frPonctuation,
  tc_fr_adverbes: frAdverbes,
  tc_fr_pp_accord: frPPAccord,
  tc_fr_classes_fines: frClassesFines,
  tc_fr_narrateur: frNarrateur,
  tc_fr_reel_imaginaire: frReelImaginaire,
  tc_fr_ordre_recit: frOrdreRecit,
  tc_fr_consignes: frConsignes,
  tc_fr_temps_passive: frTempsPassive,
  tc_fr_participe_present: frParticipePresent,
  tc_fr_champ_lexical: frChampLexical,
  tc_fr_intensite_modalite: frIntensiteModalite,
  tc_fr_mots_composes: frMotsComposes,
  tc_fr_coherence_temps: frCoherenceTemps,
  tc_fr_paratexte: frParatexte,
  tc_fr_sources: frSources,
};
