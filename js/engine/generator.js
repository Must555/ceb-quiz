// Génération dynamique : transforme un modèle (data/modeles/*.json) en question concrète.
//
// Un modèle déclare :
//   variables  : { nom: { liste: [...] } | { min, max, pas?, decimales? } }
//   derivees   : { nom: "expression" }          (valeurs calculées à partir des variables)
//   contraintes: ["expression booléenne", ...]  (on retire au sort tant qu'elles échouent)
//   enonce / explication : texte avec {var}, {var.champ} et {=expression}
//   reponse    : "expression" (numerique), ou valeur/texte selon le type
//   distracteurs (qcm) : ["expression", ...]    -> choix mélangés avec la bonne réponse
//   generateur : nom d'un générateur codé en JS (ex. "conjugaison") au lieu des champs ci-dessus
//
// Chaque variante reçoit un id stable : <id du modèle>#<valeurs tirées>. C'est ce qui
// permet à la session de garantir qu'une même variante ne revient jamais.

import { evaluate } from './expr.js';
import { formatNombre } from './format.js';
import { GENERATEURS } from './generateurs/index.js';

const MAX_ESSAIS = 200;

function tirerValeur(def, rng) {
  if (Array.isArray(def.liste)) return rng.pick(def.liste);
  const pas = def.pas ?? (def.decimales ? 10 ** -def.decimales : 1);
  const nbPas = Math.floor((def.max - def.min) / pas + 1e-9);
  const v = def.min + rng.int(0, nbPas) * pas;
  return Math.round(v * 1e9) / 1e9;
}

// Les variables "liste" peuvent contenir des objets ({prenom, il}) : on expose
// aux expressions uniquement les valeurs numériques / booléennes à plat (obj.champ -> obj_champ).
function varsPourExpressions(vars) {
  const out = {};
  for (const [k, v] of Object.entries(vars)) {
    if (v && typeof v === 'object') {
      for (const [ck, cv] of Object.entries(v)) out[`${k}_${ck}`] = cv;
    } else out[k] = v;
  }
  return out;
}

export function remplir(texte, vars) {
  if (texte == null) return texte;
  const exprVars = varsPourExpressions(vars);
  return String(texte).replace(/\{(=)?([^{}]+)\}/g, (_, isExpr, inner) => {
    if (isExpr) {
      const v = evaluate(inner, exprVars);
      return typeof v === 'number' ? formatNombre(v) : String(v);
    }
    const [nom, champ] = inner.trim().split('.');
    let v = vars[nom];
    if (champ) v = v?.[champ];
    if (v === undefined) throw new Error(`Variable « ${inner} » absente du modèle`);
    return typeof v === 'number' ? formatNombre(v) : String(v);
  });
}

function signature(vars) {
  return Object.keys(vars).sort().map((k) => {
    const v = vars[k];
    return `${k}=${v && typeof v === 'object' ? JSON.stringify(v) : v}`;
  }).join('&');
}

// Instancie un modèle. `exclure` = ensemble d'ids déjà vus : on retire au sort pour l'éviter.
// Renvoie null si aucune variante neuve n'a été trouvée (modèle épuisé).
export function genererVariante(modele, rng, exclure = new Set()) {
  if (modele.generateur) {
    const gen = GENERATEURS[modele.generateur];
    if (!gen) throw new Error(`Générateur inconnu : ${modele.generateur}`);
    for (let i = 0; i < MAX_ESSAIS; i++) {
      const q = gen(modele, rng);
      if (!q) continue;
      q.id = `${modele.id}#${q._signature}`;
      delete q._signature;
      if (!exclure.has(q.id)) return finaliser(q, modele);
    }
    return null;
  }

  for (let essai = 0; essai < MAX_ESSAIS; essai++) {
    const vars = {};
    for (const [nom, def] of Object.entries(modele.variables || {})) vars[nom] = tirerValeur(def, rng);

    const exprVars = varsPourExpressions(vars);
    for (const [nom, expr] of Object.entries(modele.derivees || {})) {
      vars[nom] = evaluate(expr, exprVars);
      exprVars[nom] = vars[nom];
    }
    if (!(modele.contraintes || []).every((c) => evaluate(c, exprVars) === true)) continue;

    const id = `${modele.id}#${signature(vars)}`;
    if (exclure.has(id)) continue;

    const q = {
      id,
      type: modele.type,
      enonce: remplir(modele.enonce, vars),
      explication: remplir(modele.explication, vars),
      unite: modele.unite ? remplir(modele.unite, vars) : undefined,
      tolerance: modele.tolerance,
    };

    if (modele.type === 'numerique') {
      q.reponse = evaluate(modele.reponse, exprVars);
    } else if (modele.type === 'qcm') {
      const bonne = valeurAffichee(modele.reponse, exprVars, vars);
      const distracteurs = [...new Set(modele.distracteurs.map((d) => valeurAffichee(d, exprVars, vars)))]
        .filter((d) => d !== bonne);
      if (distracteurs.length < 1) continue; // pas de choix distinct : on retire
      const choix = rng.shuffle([bonne, ...distracteurs.slice(0, 3)]);
      q.choix = choix;
      q.reponse = choix.indexOf(bonne);
    } else if (modele.type === 'vrai_faux') {
      q.reponse = evaluate(modele.reponse, exprVars) === true;
    } else if (modele.type === 'texte_court') {
      q.reponse = [].concat(modele.reponse).map((r) => remplir(r, vars));
      q.souple = modele.souple ?? true;
    } else {
      throw new Error(`Type non pris en charge par les modèles : ${modele.type}`);
    }
    return finaliser(q, modele);
  }
  return null;
}

// Une valeur de choix est soit une expression (« prix * 2 »), soit un texte à trous (« {mot.bon} »).
function valeurAffichee(expr, exprVars, vars) {
  if (String(expr).includes('{')) return remplir(expr, vars);
  const v = evaluate(expr, exprVars);
  return typeof v === 'number' ? formatNombre(v) : String(v);
}

function finaliser(q, modele) {
  return {
    ...q,
    source: 'modele',
    modeleId: modele.id,
    fiche: q.fiche ?? modele.fiche,
    matiere: modele.matiere,
    domaine: q.domaine ?? modele.domaine,
    difficulte: q.difficulte ?? modele.difficulte ?? 2,
    referentiels: modele.referentiels ?? ['socles', 'tronc_commun'],
    numerisable: true,
  };
}
