// Générateur « faits » : fabrique des questions variées à partir d'une base de faits.
//
// Une base (data/faits/*.json, ou `items` directement dans le modèle) est une liste d'objets :
//   { "nom": "dauphin", "classe": "mammifère", "regime": "carnivore", ... }
// Un modèle choisit une base et une ou plusieurs « formes » de questions :
//
//   attribut  : « À quelle classe appartient le dauphin ? »          (qcm, ou saisie si saisie:true)
//   lequel    : « Lequel de ces animaux est un oiseau ? »             (qcm sur les noms)
//   intrus    : « Quel est l'intrus ? » (3 partagent une valeur, 1 non)
//   vrai_faux : « Le dauphin est un poisson. »
//   ordre     : « Range du plus ancien au plus récent »               (champ numérique)
//   extreme   : « Lequel s'est passé en premier ? »                   (min ou max d'un champ numérique)
//   association / grille : classer 3-4 éléments d'un coup
//   calcul    : question numérique sur 1 à 3 éléments (a, b, c), avec expressions
//
// Dans les textes : {champ} = champ de l'élément tiré, {valeur} = valeur visée,
// {cle} = nom de l'élément, {a.champ} / {=a_champ - b_champ} pour la forme calcul.
// Un champ absent est remplacé par une chaîne vide (pratique pour {info}).

import { evaluate } from '../expr.js';
import { formatNombre } from '../format.js';
import { remplir } from '../generator.js';

const premier = (v) => (Array.isArray(v) ? v[0] : v);
const liste = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const aff = (v) => (typeof v === 'number' ? formatNombre(v) : String(v));

// Remplace {x}, {x.y} et {=expr} ; un champ absent devient ''.
export function remplirSouple(texte, vars) {
  if (texte == null) return undefined;
  return String(texte).replace(/\{(=)?([^{}]+)\}/g, (_, isExpr, inner) => {
    if (isExpr) return remplir(`{=${inner}}`, vars);
    const [nom, champ] = inner.trim().split('.');
    let v = vars[nom];
    if (champ) v = v?.[champ];
    if (v == null) return '';
    return aff(premier(v));
  });
}

// Majuscule en début de phrase (après un éventuel « « »).
const enumerer = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} et ${l[l.length - 1]}`);

// Formes « en phrase » d'une valeur : phrases.classe.mammifère = « un mammifère »,
// phrases.classe_pluriel.mammifère = « mammifères ».
function enrichir(modele, forme, vars) {
  const ph = (suffixe, v) => (v == null ? undefined : modele.phrases?.[forme.champ + suffixe]?.[v] ?? (suffixe ? `${v}s` : v));
  for (const k of ['valeur', 'bonne', 'valeurIntrus']) {
    if (vars[k] == null) continue;
    vars[k + 'Phrase'] ??= ph('', vars[k]);
    vars[k + 'Pluriel'] ??= ph('_pluriel', vars[k]);
  }
  return vars;
}

const majuscule = (s) => (s ? s.replace(/^([«\s]*)(\p{L})/u, (_, a, b) => a + b.toUpperCase()) : s);

function correspond(item, filtre) {
  if (!filtre) return true;
  return Object.entries(filtre).every(([k, v]) => {
    const vals = liste(item[k]);
    return Array.isArray(v) ? vals.some((x) => v.includes(x)) : vals.includes(v);
  });
}

function itemsDe(modele, forme) {
  const tous = modele.items ?? [];
  const requis = [...liste(forme.champ), ...liste(forme.avec)];
  return tous.filter((it) => correspond(it, modele.filtre) && correspond(it, forme.filtre)
    && requis.every((c) => it[c] != null && it[c] !== ''));
}

const nomDe = (modele, forme, it) => aff(premier(it[forme.cle ?? modele.cle ?? 'nom']));

// Valeurs possibles d'un champ (liste explicite, ou valeurs présentes dans la base).
function valeursDe(modele, forme, items) {
  if (forme.valeurs) return forme.valeurs;
  return [...new Set(items.flatMap((it) => liste(it[forme.champ])).map(aff))];
}

function tirerDistincts(rng, items, n, cleFn) {
  const out = []; const vus = new Set();
  for (const it of rng.shuffle(items)) {
    const k = cleFn(it);
    if (vus.has(k)) continue;
    vus.add(k); out.push(it);
    if (out.length === n) break;
  }
  return out.length === n ? out : null;
}

function varsElement(modele, forme, it, extra = {}) {
  return { ...it, cle: nomDe(modele, forme, it), Cle: majuscule(nomDe(modele, forme, it)), ...extra };
}

const FORMES = {
  attribut(modele, forme, rng) {
    const items = itemsDe(modele, forme);
    const it = rng.pick(items);
    const bonnes = liste(it[forme.champ]).map(aff);
    const vars = varsElement(modele, forme, it, { valeur: bonnes[0] });
    const base = { _signature: nomDe(modele, forme, it), cle: remplirSouple(forme.enonce, vars), vars };
    if (forme.saisie) {
      const acc = [...bonnes, ...liste(it[`${forme.champ}_accepte`]).map(aff)];
      return { ...base, type: 'texte_court', reponse: acc, souple: forme.souple ?? true };
    }
    const faux = forme.distracteurs
      ? liste(it[forme.distracteurs]).map(aff)
      : rng.shuffle(valeursDe(modele, forme, items));
    const distracteurs = [...new Set(faux)].filter((v) => !bonnes.includes(v)).slice(0, (forme.choix ?? 4) - 1);
    if (distracteurs.length < 1) return null;
    const choix = forme.ordreFixe
      ? valeursDe(modele, forme, items).filter((v) => v === bonnes[0] || distracteurs.includes(v))
      : rng.shuffle([bonnes[0], ...distracteurs]);
    return { ...base, type: 'qcm', choix, reponse: choix.indexOf(bonnes[0]) };
  },

  lequel(modele, forme, rng) {
    const items = itemsDe(modele, forme);
    const valeurs = forme.cibles ?? valeursDe(modele, forme, items);
    const v = rng.pick(valeurs);
    const avec = items.filter((it) => liste(it[forme.champ]).map(aff).includes(v));
    const sans = items.filter((it) => !liste(it[forme.champ]).map(aff).includes(v));
    if (!avec.length || sans.length < 2) return null;
    const bon = rng.pick(avec);
    const autres = tirerDistincts(rng, sans.filter((x) => nomDe(modele, forme, x) !== nomDe(modele, forme, bon)), (forme.choix ?? 4) - 1, (x) => nomDe(modele, forme, x));
    if (!autres) return null;
    const choixItems = rng.shuffle([bon, ...autres]);
    const choix = choixItems.map((x) => majuscule(nomDe(modele, forme, x)));
    const vars = varsElement(modele, forme, bon, { valeur: v, valeurPhrase: modele.phrases?.[forme.champ]?.[v] ?? v });
    return {
      _signature: `${v}|${choix.slice().sort().join(',')}`,
      cle: `${remplirSouple(forme.enonce, vars)}|${choix.slice().sort().join(',')}`,
      vars, type: 'qcm', choix, reponse: choixItems.indexOf(bon),
    };
  },

  intrus(modele, forme, rng) {
    const items = itemsDe(modele, forme);
    const valeurs = valeursDe(modele, forme, items);
    const v = rng.pick(valeurs);
    const avec = items.filter((it) => liste(it[forme.champ]).map(aff).includes(v));
    const sans = items.filter((it) => !liste(it[forme.champ]).map(aff).includes(v));
    const n = (forme.choix ?? 4) - 1;
    const groupe = tirerDistincts(rng, avec, n, (x) => nomDe(modele, forme, x));
    if (!groupe || !sans.length) return null;
    const intrus = rng.pick(sans);
    const choixItems = rng.shuffle([intrus, ...groupe]);
    const choix = choixItems.map((x) => majuscule(nomDe(modele, forme, x)));
    const vars = varsElement(modele, forme, intrus, {
      valeur: v, valeurPhrase: modele.phrases?.[forme.champ]?.[v] ?? v,
      valeurIntrus: aff(premier(intrus[forme.champ])),
      valeurIntrusPhrase: modele.phrases?.[forme.champ]?.[aff(premier(intrus[forme.champ]))] ?? aff(premier(intrus[forme.champ])),
      groupe: enumerer(groupe.map((x) => nomDe(modele, forme, x))),
    });
    return {
      _signature: choix.slice().sort().join(','),
      cle: `${remplirSouple(forme.enonce, vars)}|${choix.slice().sort().join(',')}`,
      vars, type: 'qcm', choix, reponse: choixItems.indexOf(intrus),
    };
  },

  vrai_faux(modele, forme, rng) {
    const items = itemsDe(modele, forme);
    const it = rng.pick(items);
    const bonnes = liste(it[forme.champ]).map(aff);
    const vrai = rng.next() < 0.5;
    let v = bonnes[0];
    if (!vrai) {
      const autres = valeursDe(modele, forme, items).filter((x) => !bonnes.includes(x));
      if (!autres.length) return null;
      v = rng.pick(autres);
    }
    const vars = varsElement(modele, forme, it, { valeur: v, valeurPhrase: modele.phrases?.[forme.champ]?.[v] ?? v, bonne: bonnes[0], bonnePhrase: modele.phrases?.[forme.champ]?.[bonnes[0]] ?? bonnes[0] });
    return { _signature: `${nomDe(modele, forme, it)}|${v}`, cle: remplirSouple(forme.enonce, vars), vars, type: 'vrai_faux', reponse: vrai };
  },

  ordre(modele, forme, rng) {
    const items = itemsDe(modele, forme);
    const n = forme.n ?? 4;
    const ecart = forme.ecartMin ?? 0;
    for (let essai = 0; essai < 30; essai++) {
      const tires = tirerDistincts(rng, items, n, (x) => nomDe(modele, forme, x));
      if (!tires) return null;
      const vals = tires.map((x) => premier(x[forme.champ])).sort((a, b) => a - b);
      if (vals.some((v, i) => i > 0 && v - vals[i - 1] < Math.max(ecart, 1e-9))) continue;
      const elements = tires.map((x) => majuscule(remplirSouple(forme.element ?? '{cle}', varsElement(modele, forme, x))));
      const idx = tires.map((_, i) => i).sort((i, j) => premier(tires[i][forme.champ]) - premier(tires[j][forme.champ]));
      if (forme.sens === 'decroissant') idx.reverse();
      const vars = { liste: idx.map((i) => `${nomDe(modele, forme, tires[i])} (${remplirSouple(forme.valeurAffichee ?? '{' + forme.champ + '}', tires[i])})`).join(' → ') };
      return { _signature: elements.slice().sort().join(','), cle: `${forme.enonce}|${elements.slice().sort().join(',')}`, vars, type: 'ordre', elements, reponse: idx };
    }
    return null;
  },

  extreme(modele, forme, rng) {
    const items = itemsDe(modele, forme);
    const n = forme.choix ?? 3;
    for (let essai = 0; essai < 30; essai++) {
      const tires = tirerDistincts(rng, items, n, (x) => nomDe(modele, forme, x));
      if (!tires) return null;
      const vals = tires.map((x) => premier(x[forme.champ]));
      if (new Set(vals).size !== vals.length) continue;
      const cible = forme.sens === 'max' ? Math.max(...vals) : Math.min(...vals);
      const bon = tires[vals.indexOf(cible)];
      const choix = tires.map((x) => majuscule(nomDe(modele, forme, x)));
      const vars = varsElement(modele, forme, bon, { liste: tires.map((x) => `${nomDe(modele, forme, x)} : ${remplirSouple(forme.valeurAffichee ?? '{' + forme.champ + '}', x)}`).join(' ; ') });
      return { _signature: choix.slice().sort().join(','), cle: `${forme.enonce}|${choix.slice().sort().join(',')}`, vars, type: 'qcm', choix, reponse: tires.indexOf(bon) };
    }
    return null;
  },

  association(modele, forme, rng) {
    const items = itemsDe(modele, forme);
    const n = forme.n ?? 3;
    const tires = tirerDistincts(rng, items, n, (x) => aff(premier(x[forme.champ])));
    if (!tires) return null;
    const gauche = tires.map((x) => majuscule(nomDe(modele, forme, x)));
    const droite = rng.shuffle(tires.map((x) => aff(premier(x[forme.champ]))));
    const reponse = tires.map((x, i) => [i, droite.indexOf(aff(premier(x[forme.champ])))]);
    // Toutes les valeurs doivent être distinctes ET chaque élément ne doit correspondre qu'à une seule valeur proposée.
    if (tires.some((x) => liste(x[forme.champ]).map(aff).filter((v) => droite.includes(v)).length > 1)) return null;
    const vars = { liste: tires.map((x) => `${nomDe(modele, forme, x)} → ${aff(premier(x[forme.champ]))}`).join(' ; ') };
    return { _signature: gauche.slice().sort().join(','), cle: `${forme.enonce}|${gauche.slice().sort().join(',')}`, vars, type: 'association', gauche, droite, reponse };
  },

  grille(modele, forme, rng) {
    const items = itemsDe(modele, forme);
    const colonnes = forme.valeurs ?? valeursDe(modele, forme, items);
    if (colonnes.length > 4) return null;
    const tires = tirerDistincts(rng, items, forme.n ?? 4, (x) => nomDe(modele, forme, x));
    if (!tires) return null;
    if (tires.some((x) => liste(x[forme.champ]).map(aff).filter((v) => colonnes.includes(v)).length !== 1)) return null;
    const lignes = tires.map((x) => majuscule(remplirSouple(forme.element ?? '{cle}', varsElement(modele, forme, x))));
    const reponse = tires.map((x) => colonnes.indexOf(liste(x[forme.champ]).map(aff).find((v) => colonnes.includes(v))));
    const vars = { liste: tires.map((x) => `${nomDe(modele, forme, x)} → ${aff(premier(x[forme.champ]))}`).join(' ; ') };
    return { _signature: lignes.slice().sort().join(','), cle: `${forme.enonce}|${lignes.slice().sort().join(',')}`, vars, type: 'grille', lignes, colonnes, reponse, points: tires.length };
  },

  calcul(modele, forme, rng) {
    const items = itemsDe(modele, forme);
    const noms = ['a', 'b', 'c'].slice(0, forme.n ?? 1);
    for (let essai = 0; essai < 40; essai++) {
      const tires = tirerDistincts(rng, items, noms.length, (x) => nomDe(modele, forme, x));
      if (!tires) return null;
      const vars = {};
      noms.forEach((k, i) => { vars[k] = { ...tires[i], cle: nomDe(modele, forme, tires[i]) }; });
      const plats = {};
      for (const [k, o] of Object.entries(vars)) for (const [ck, cv] of Object.entries(o)) if (typeof cv === 'number' || typeof cv === 'boolean') plats[`${k}_${ck}`] = cv;
      if (!(forme.contraintes ?? []).every((c) => evaluate(c, plats) === true)) continue;
      const reponse = evaluate(forme.reponse, plats);
      const nomsTires = tires.map((x) => nomDe(modele, forme, x));
      return {
        _signature: (forme.ordonne === false ? nomsTires.slice().sort() : nomsTires).join(','),
        cle: remplir(forme.enonce, vars), vars, type: 'numerique', reponse,
        unite: forme.unite, tolerance: forme.tolerance,
      };
    }
    return null;
  },
};

export function genererFaits(modele, rng) {
  const formes = modele.formes ?? [modele];
  const i = formes.length === 1 ? 0 : rng.int(0, formes.length - 1);
  const forme = formes[i];
  const fn = FORMES[forme.sorte];
  if (!fn) throw new Error(`${modele.id} : forme inconnue « ${forme.sorte} »`);
  const r = fn(modele, forme, rng);
  if (!r) return null;
  const { vars: v0, cle, _signature, ...q } = r;
  const vars = forme.sorte === 'calcul' ? v0 : enrichir(modele, forme, v0);
  const enonce = forme.sorte === 'calcul' ? remplir(forme.enonce, vars) : remplirSouple(forme.enonce, vars);
  const explication = forme.explication == null ? undefined
    : forme.sorte === 'calcul' ? remplir(forme.explication, vars) : remplirSouple(forme.explication, vars);
  return {
    ...q,
    _signature: `${i}|${_signature}`,
    enonce: majuscule(enonce),
    explication: explication ? majuscule(explication.replace(/\s+([.,])/g, '$1').replace(/\s{2,}/g, ' ').trim()) : undefined,
    cleContenu: cle,
    difficulte: forme.difficulte,
    fiche: forme.fiche,
    domaine: forme.domaine,
  };
}
