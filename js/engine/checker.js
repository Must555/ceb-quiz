// Correction automatique d'une réponse selon le type de question.
// Renvoie { correct, score, max, remarque? }
//   correct : true / false, ou null pour une question ouverte (autoévaluation)
//   score   : points obtenus (crédit partiel pour grille, trous, qcm_multi, ordre, association)

import { parseNombre, normaliserTexte } from './format.js';

const estRempli = (v) => v !== null && v !== undefined && v !== '';
const memeEnsemble = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

// Orthographe rectifiée (1990) : le référentiel du tronc commun impose de l'enseigner (FRALA p. 28),
// mais les manuels et les parents utilisent encore l'ancienne graphie. On accepte donc les deux :
//   - accent circonflexe sur i et u facultatif (connaître/connaitre, il paraît/parait), sauf quand il
//     distingue deux mots (dû, sûr, mûr, jeûne, croît), au passé simple (nous vînmes, vous fûtes)
//     et au subjonctif imparfait (qu'il fût) ;
//   - trait d'union facultatif ou soudure (porte-monnaie/portemonnaie, vingt et un/vingt-et-un) ;
//   - è au futur et au conditionnel des verbes en é-consonne-er (je cèderai/céderai), événement/évènement.
const CIRCONFLEXE_UTILE = /^(dû|dûs|dûe|dûes|sûr|sûre|sûrs|sûres|sûrement|mûr|mûre|mûrs|mûres|jeûne|jeûnes|jeûner|croît)$|[îû]n?(mes|tes)$|(?<![ao])[îû]n?t$/;
export function formesRectifiees(texte) {
  const mots = texte.split(/(\s+|-)/).map((m) => (CIRCONFLEXE_UTILE.test(m) ? m : m.replace(/î/g, 'i').replace(/û/g, 'u')));
  const base = mots.join('')
    .replace(/é([bcdfgjklmnpqrstvz]{1,2})er(ai|as|a|ons|ez|ont|ais|ait|ions|iez|aient)\b/g, 'è$1er$2')
    .replace(/événement/g, 'évènement');
  return new Set([base, base.replace(/-/g, ' '), base.replace(/-/g, '')]);
}

function comparerTexte(saisie, acceptees, souple) {
  const opts = { accents: !souple };
  const s = normaliserTexte(saisie, opts);
  if (acceptees.some((r) => normaliserTexte(r, opts) === s)) return { ok: true };
  const formesSaisie = formesRectifiees(s);
  if (acceptees.some((r) => [...formesRectifiees(normaliserTexte(r, opts))].some((f) => formesSaisie.has(f)))) return { ok: true };
  // En mode strict, on repère le cas « juste à un accent près » pour aider l'enfant.
  if (!souple && acceptees.some((r) => normaliserTexte(r) === normaliserTexte(saisie))) {
    return { ok: false, remarque: 'Presque ! Vérifie les accents.' };
  }
  return { ok: false };
}

export function corriger(question, reponseEleve) {
  const max = question.points ?? 1;
  const vide = reponseEleve == null || reponseEleve === '' || (Array.isArray(reponseEleve) && reponseEleve.length === 0);
  if (vide && question.type !== 'ouverte') return { correct: false, score: 0, max, remarque: 'Pas de réponse.' };

  const typesTableau = ['qcm_multi', 'trous', 'grille', 'ordre', 'association'];
  if (typesTableau.includes(question.type) && !Array.isArray(reponseEleve)) {
    return { correct: false, score: 0, max, remarque: 'Réponse incomplète.' };
  }

  switch (question.type) {
    case 'qcm': {
      // reponse peut être une liste quand le corrigé officiel accepte plusieurs propositions.
      const ok = reponseEleve != null && reponseEleve !== '' && [].concat(question.reponse).includes(Number(reponseEleve));
      return { correct: ok, score: ok ? max : 0, max };
    }
    case 'vrai_faux': {
      const ok = Boolean(reponseEleve) === question.reponse;
      return { correct: ok, score: ok ? max : 0, max };
    }
    case 'qcm_multi': {
      // aussiAcceptes : propositions que le corrigé officiel tolère (ni exigées ni pénalisées).
      const tolerees = (question.aussiAcceptes ?? []).filter((i) => !question.reponse.includes(i));
      const tous = [...new Set(reponseEleve.map(Number))];
      const choisis = tous.filter((i) => !tolerees.includes(i));
      // nbAChoisir (« Choisis trois… ») : n'importe quel choix de ce nombre parmi les bonnes et les tolérées est juste.
      const nb = question.nbAChoisir;
      const ok = memeEnsemble(choisis, question.reponse)
        || (nb != null && tous.length === nb && tous.every((i) => question.reponse.includes(i) || tolerees.includes(i)));
      if (ok) return { correct: true, score: max, max };
      // parProposition : chaque proposition compte, qu'elle doive être cochée ou laissée (« 5 x ½ pt »).
      if (question.parProposition) {
        const bien = question.choix.filter((_, i) => choisis.includes(i) === question.reponse.includes(i)).length;
        return { correct: false, score: Math.round((bien / question.choix.length) * max * 100) / 100, max, detail: `${bien}/${question.choix.length}` };
      }
      if (!question.parReponse) return { correct: false, score: 0, max };
      // parReponse : « 1 pt par bonne réponse, −1 pt par réponse en trop » (jamais en dessous de 0).
      const bons = choisis.filter((i) => question.reponse.includes(i)).length;
      const trop = choisis.length - bons;
      const score = Math.round((Math.max(0, bons - trop) / question.reponse.length) * max * 100) / 100;
      return { correct: false, score, max, detail: `${bons}/${question.reponse.length}`, ...(trop ? { remarque: 'Une réponse en trop retire un point, comme à l\'épreuve.' } : {}) };
    }
    case 'numerique': {
      const n = parseNombre(reponseEleve);
      if (Number.isNaN(n)) return { correct: false, score: 0, max, remarque: 'Écris un nombre (avec une virgule pour les décimales).' };
      const ok = Math.abs(n - question.reponse) <= (question.tolerance ?? 1e-9);
      return { correct: ok, score: ok ? max : 0, max };
    }
    case 'texte_court': {
      const { ok, remarque } = comparerTexte(reponseEleve, [].concat(question.reponse), question.souple !== false);
      return { correct: ok, score: ok ? max : 0, max, remarque };
    }
    case 'trous': {
      // reponse = [[formes acceptées case 1], [case 2], ...]
      // differentes : true → « écris-en deux » : une même réponse répétée ne compte qu'une fois.
      const vues = new Set();
      let repetee = false;
      const oks = question.reponse.map((acc, i) => {
        const ok = comparerTexte(reponseEleve[i] ?? '', [].concat(acc), question.souple !== false).ok;
        if (!ok || !question.differentes) return ok;
        const cle = normaliserTexte(reponseEleve[i]).replace(/^(le |la |les |l'|un |une |des )/, '').replace(/s$/, '');
        if (vues.has(cle)) { repetee = true; return false; }
        vues.add(cle);
        return true;
      });
      const res = noter(oks, question, max, reponseEleve);
      return repetee ? { ...res, remarque: 'Il faut des réponses différentes.' } : res;
    }
    case 'grille': {
      // reponse = index de colonne attendu pour chaque ligne, ou liste des colonnes acceptées
      // (le corrigé officiel admet parfois plusieurs bonnes cases sur une ligne).
      // differentes : true → une même colonne choisie sur deux lignes ne compte qu'une fois.
      const vus = new Set();
      const oks = question.reponse.map((col, i) => {
        const ok = estRempli(reponseEleve[i]) && [].concat(col).includes(Number(reponseEleve[i]));
        if (!ok || !question.differentes) return ok;
        if (vus.has(Number(reponseEleve[i]))) return false;
        vus.add(Number(reponseEleve[i]));
        return true;
      });
      return noter(oks, question, max, reponseEleve);
    }
    case 'ordre': {
      const bons = question.reponse.filter((v, i) => estRempli(reponseEleve[i]) && Number(reponseEleve[i]) === v).length;
      const res = partiel(bons, question.reponse.length, max);
      return res.correct ? res : { ...res, score: 0 }; // un ordre n'est juste qu'en entier
    }
    case 'association': {
      // reponse = [[g, d], ...] ; l'élève fournit aussi des paires
      const attendu = new Set(question.reponse.map(([g, d]) => `${g}-${d}`));
      const bons = reponseEleve.filter(([g, d]) => attendu.has(`${g}-${d}`)).length;
      const res = partiel(bons, question.reponse.length, max);
      return question.toutOuRien && !res.correct ? { ...res, score: 0 } : res;
    }
    case 'ouverte':
      // Correction par l'élève à l'aide de reponseModele (ou par un adulte).
      return { correct: null, score: null, max, remarque: 'Compare ta réponse avec la réponse modèle.' };
    default:
      throw new Error(`Type de question inconnu : ${question.type}`);
  }
}

// Barème du correctif : toutOuRien → tous les points ou aucun ; groupes = [[0, 1], [2, 3]] → chaque
// groupe de cases est noté « tout ou rien » (les cases hors groupe comptent seules) ; pointsGroupes
// donne le poids de chaque groupe (sinon parts égales).
function noter(oks, question, max, reponseEleve) {
  const bons = oks.filter(Boolean).length;
  const base = partiel(bons, oks.length, max);
  // exclusif : « 0 point si un même élément est placé à deux endroits » (les colonnes que le corrigé
  // emploie plusieurs fois, comme « laissée vide », peuvent se répéter).
  if (question.exclusif && reponseEleve) {
    const attendu = question.reponse.map((r) => [].concat(r)[0]);
    const vus = new Map();
    reponseEleve.forEach((v) => { if (v != null && v !== '') vus.set(String(v), (vus.get(String(v)) ?? 0) + 1); });
    const double = [...vus].some(([v, n]) => n > 1 && attendu.filter((a) => String(a) === v).length < n);
    if (double) return { ...base, correct: false, score: 0, remarque: 'Un même élément est placé à deux endroits : à l\'épreuve, cela donne 0 point.' };
  }
  // paliers : [[nombre de cases justes, points], …] (ex. 3 à 5 mots justes = 1 pt, 6 ou 7 = 2 pts, 8 = 3 pts).
  if (question.paliers) {
    const pts = question.paliers.filter(([n]) => bons >= n).reduce((m, [, p]) => Math.max(m, p), 0);
    return { ...base, score: pts };
  }
  const avis = bons > 0 && !base.correct ? { remarque: `${bons} case${bons > 1 ? 's' : ''} sur ${oks.length} juste${bons > 1 ? 's' : ''}, mais à l'épreuve il faut tout juste pour avoir les points.` } : {};
  if (question.toutOuRien) return base.correct ? base : { ...base, score: 0, ...avis };
  if (!question.groupes) return base;
  const dans = new Set(question.groupes.flat());
  const groupes = [...question.groupes, ...oks.map((_, i) => i).filter((i) => !dans.has(i)).map((i) => [i])];
  const poids = question.pointsGroupes ?? groupes.map(() => max / groupes.length);
  const score = groupes.reduce((t, g, k) => t + (g.every((i) => oks[i]) ? poids[k] ?? 0 : 0), 0);
  const arrondi = Math.round(score * 100) / 100;
  return arrondi < base.score ? { ...base, score: arrondi, remarque: 'Certains groupes ne comptent que s\'ils sont entièrement justes, comme à l\'épreuve.' } : { ...base, score: arrondi };
}

function partiel(bons, total, max) {
  const score = Math.round((bons / total) * max * 100) / 100;
  return { correct: bons === total, score, max, detail: `${bons}/${total}` };
}
