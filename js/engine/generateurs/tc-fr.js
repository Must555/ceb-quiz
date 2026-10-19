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
};
// {S} sujet, {P} pronom qui reprend le sujet, {A} avoir à l'imparfait (accordé au sujet), {V} verbe, {C} complément.
const CADRES_C = {
  fa: [{ t: 'Avant midi, {S} {V} {C}.' }, { t: "D'ici ce soir, {S} {V} {C}." }, { t: 'Dans une heure, {S} {V} {C}.' }, { t: 'Quand {S} {V} {C}, nous pourrons jouer.', avoir: true }],
  pqp: [{ t: 'Quand le téléphone a sonné, {S} {V} {C}.' }, { t: 'Mamie était contente parce que {S} {V} {C}.' }, { t: "Le lendemain, j'ai appris que {S} {V} {C}." }],
  cp: [{ t: 'Si {S} {A} eu le temps, {P} {V} {C}.', pro: true }, { t: 'Si {S} {A} pu, {P} {V} {C}.', pro: true }, { t: 'Avec un peu plus de temps, {S} {V} {C}.' }],
  fp: [{ t: 'Dans cinq minutes, {S} {V} {C}.' }, { t: 'Ce soir, {S} {V} {C}.' }, { t: "Tout à l'heure, {S} {V} {C}." }],
  pc: [{ t: 'Hier, {S} {V} {C}.' }, { t: 'Ce matin, {S} {V} {C}.' }],
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
    .replace('{A}', auxForme('avoir', 'imparfait', s.idx)).replace('{V}', verbe).replace('{C}', c);
  return maj(elider(t));
}

function frConjComposes(modele, rng) {
  const forme = rng.pick(modele.formes ?? ['ecrire', 'ecrire', 'choisir', 'temps']);
  const t = rng.pick(forme === 'temps' ? ['pqp', 'fa', 'cp', 'fp', 'pc'] : ['pqp', 'fa', 'cp', 'fp']);
  const iC = rng.int(0, CADRES_C[t].length - 1);
  const cadre = CADRES_C[t][iC];
  const v = rng.pick(cadre.avoir ? VERBES_C.filter((x) => x[2] === 'avoir') : VERBES_C);
  const s = rng.pick(SUJETS_C);
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
    const autres = ['pqp', 'fa', 'cp', 'fp', 'pc'].filter((x) => x !== t).map((x) => formeComposee(v, x, s)[0]);
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
  const q = qcm(rng, T.nom, ['pqp', 'fa', 'cp', 'fp', 'pc'].map((x) => TEMPS_C[x].nom));
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
  const forme = rng.pick(modele.formes ?? ['ecrire', 'choisir']);
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
  const forme = rng.pick(modele.formes ?? ['trouver', 'trouver', 'corriger', 'corriger_libre']);
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
  const forme = rng.pick(modele.formes ?? ['fonction', 'fonction', 'trouver', 'nom', 'grille']);
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
  const forme = rng.pick(modele.formes ?? ['predicat', 'predicat', 'sujet', 'cp', 'supprimer', 'grille']);
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
  const forme = rng.pick(modele.formes ?? ['virgule', 'deux_points', 'parole_dp', 'parole_fin', 'guillemets', 'tiret', 'explication', 'correcte_enum', 'correcte_parole']);
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
  const forme = rng.pick(modele.formes ?? ['former', 'choisir', 'phrase', 'phrase_qcm', 'adjectif']);
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
  const forme = rng.pick(modele.formes ?? ['seul', 'relative', 'pronom', 'apres']);
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

export const GENERATEURS = {
  tc_fr_conj_composes: frConjComposes,
  tc_fr_radical_er: frRadicalEr,
  tc_fr_corriger: frCorriger,
  tc_fr_fonctions_gn: frFonctionsGN,
  tc_fr_predicat: frPredicat,
  tc_fr_ponctuation: frPonctuation,
  tc_fr_adverbes: frAdverbes,
  tc_fr_pp_accord: frPPAccord,
};
