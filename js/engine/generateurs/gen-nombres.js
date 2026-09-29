// Générateurs JS spécifiques (mathématiques). Chaque entrée : nom → fonction (modele, rng) => question | null.
// La question renvoyée doit contenir _signature (texte stable, unique par variante).
//
// Chaque famille est une liste de « formes » (fonctions rng => question). Le calcul se fait
// autant que possible en nombres entiers (millièmes, centimes…) pour éviter les artefacts
// flottants ; tout nombre affiché passe par fmt() (virgule décimale, espaces des milliers).

import { formatNombre } from '../format.js';

// ---------------------------------------------------------------------------
// Outils communs
// ---------------------------------------------------------------------------
const r = (x, d = 6) => { const f = 10 ** d; return Math.round(x * f) / f; };
const fmt = (x) => formatNombre(r(x));
const eur = (x) => {
  const c = Math.round(x * 100);
  return `${formatNombre(Math.floor(c / 100))}${c % 100 ? ',' + String(c % 100).padStart(2, '0') : ''} €`;
};
const pgcd = (a, b) => (b === 0 ? Math.abs(a) : pgcd(b, a % b));
const ppcm = (a, b) => (a / pgcd(a, b)) * b;
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const enumerer = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} et ${l[l.length - 1]}`);
const pluriel = (n, sing, plur = sing + 's') => (n > 1 ? plur : sing);
const dedoublonner = (arr) => [...new Set(arr)];

// Prénoms courants en Belgique (il/elle pour les accords).
const PRENOMS = [
  ['Léa', 'f'], ['Emma', 'f'], ['Inès', 'f'], ['Lina', 'f'], ['Chloé', 'f'], ['Nora', 'f'], ['Olivia', 'f'],
  ['Louise', 'f'], ['Alice', 'f'], ['Zoé', 'f'], ['Sarah', 'f'], ['Yasmine', 'f'], ['Maëlle', 'f'], ['Julie', 'f'],
  ['Amira', 'f'], ['Elif', 'f'], ['Manon', 'f'], ['Fatima', 'f'], ['Charlotte', 'f'], ['Aya', 'f'], ['Lucie', 'f'],
  ['Noah', 'm'], ['Lucas', 'm'], ['Adam', 'm'], ['Louis', 'm'], ['Mohamed', 'm'], ['Arthur', 'm'], ['Jules', 'm'],
  ['Victor', 'm'], ['Nathan', 'm'], ['Rayan', 'm'], ['Mehdi', 'm'], ['Yanis', 'm'], ['Théo', 'm'], ['Hugo', 'm'],
  ['Gabriel', 'm'], ['Liam', 'm'], ['Sacha', 'm'], ['Tom', 'm'], ['Milan', 'm'], ['Ilyes', 'm'], ['Simon', 'm'],
  ['Amine', 'm'], ['Mattéo', 'm'], ['Kenzo', 'm'], ['Bilal', 'm'],
].map(([n, g]) => ({ n, il: g === 'f' ? 'elle' : 'il', e: g === 'f' ? 'e' : '' }));

// QCM : la bonne réponse + des distracteurs distincts (textes). null si pas assez de choix.
function qcm(rng, bonne, fausses, n = 4, min = 3) {
  const b = String(bonne);
  const vus = new Set([b.trim().toLowerCase()]);
  const d = [];
  for (const f of fausses) {
    const s = String(f); const k = s.trim().toLowerCase();
    if (vus.has(k)) continue;
    vus.add(k); d.push(s);
  }
  if (d.length < min) return null;
  const choix = rng.shuffle([b, ...rng.shuffle(d).slice(0, n - 1)]);
  return { type: 'qcm', choix, reponse: choix.indexOf(b) };
}

// Heures et durées acceptées en saisie : « 14 h 05 », « 14h05 », « 14:05 », « 14 h 05 min »…
function heuresAcceptees(h, m) {
  const mm = String(m).padStart(2, '0');
  const l = [`${h} h ${mm}`, `${h}h${mm}`, `${h} h ${mm} min`, `${h}h${mm}min`, `${h}:${mm}`, `${h} h ${m}`, `${h}h${m}`, `${h} h ${m} min`];
  if (m === 0) l.push(`${h} h`, `${h}h`);
  return dedoublonner(l);
}
const heureTxt = (h, m) => `${h} h ${String(m).padStart(2, '0')}`;
const dureeTxt = (min) => {
  const h = Math.floor(min / 60); const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${String(m).padStart(2, '0')} min` : `${h} h`;
};

// Assemble une famille à partir de ses formes (choisies au hasard, avec poids éventuel).
function famille(formes) {
  const liste = formes.flatMap((f, i) => Array(f.poids ?? 1).fill(i));
  return (modele, rng) => {
    const i = rng.pick(liste);
    const q = formes[i](rng, modele);
    if (!q) return null;
    if (q.type === 'numerique' && (!Number.isFinite(q.reponse) || nbDecimales(q.reponse) > 3)) return null;
    const extra = q.choix ? ` | ${[...q.choix].sort().join(' ; ')}`
      : q.elements ? ` | ${[...q.elements].sort().join(' ; ')}`
        : q.lignes ? ` | ${[...q.lignes].sort().join(' ; ')}` : '';
    const cle = q.enonce + extra;
    return { cleContenu: cle, _signature: `${i}|${cle}`, ...q };
  };
}
const forme = (fn, poids = 1) => Object.assign(fn, { poids });

// ---------------------------------------------------------------------------
// Nombres en lettres (Belgique : septante, nonante ; rectifications de 1990 :
// traits d'union partout, « millions » reste séparé car c'est un nom).
// ---------------------------------------------------------------------------
const UNITES = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze',
  'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const DIZAINES = { 2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante', 7: 'septante', 8: 'quatre-vingt', 9: 'nonante' };
function moins100(n, final) {
  if (n < 20) return UNITES[n];
  const d = Math.floor(n / 10); const u = n % 10;
  if (d === 8) return u === 0 ? (final ? 'quatre-vingts' : 'quatre-vingt') : `quatre-vingt-${UNITES[u]}`;
  if (u === 0) return DIZAINES[d];
  if (u === 1) return `${DIZAINES[d]}-et-un`;
  return `${DIZAINES[d]}-${UNITES[u]}`;
}
function moins1000(n, final) {
  const c = Math.floor(n / 100); const reste = n % 100;
  const parts = [];
  if (c === 1) parts.push('cent');
  else if (c > 1) parts.push(`${UNITES[c]}-${reste === 0 && final ? 'cents' : 'cent'}`);
  if (reste) parts.push(moins100(reste, final));
  return parts.join('-');
}
export function enLettres(n) {
  if (n === 0) return 'zéro';
  const m = Math.floor(n / 1e6); const k = Math.floor((n % 1e6) / 1000); const u = n % 1000;
  const blocs = [];
  if (m) blocs.push(m === 1 ? 'un million' : `${moins1000(m, true)} millions`);
  let bas = '';
  if (k) bas = k === 1 ? 'mille' : `${moins1000(k, false)}-mille`;
  if (u) bas = bas ? `${bas}-${moins1000(u, true)}` : moins1000(u, true);
  if (bas) blocs.push(bas);
  return blocs.join(' ');
}

// Tirage d'un nombre entier à `nb` chiffres, avec des zéros intercalés (probabilité pz).
function nombreAvecZeros(rng, nb, pz = 0.3) {
  let s = String(rng.int(1, 9));
  for (let i = 1; i < nb; i++) s += rng.next() < pz ? '0' : String(rng.int(1, 9));
  return Number(s);
}
const classes = (n) => {
  const m = Math.floor(n / 1e6); const k = Math.floor((n % 1e6) / 1000); const u = n % 1000;
  const p3 = (x) => String(x).padStart(3, '0');
  if (m) return `classe des millions : ${m} ; classe des mille : ${p3(k)} ; classe des unités : ${p3(u)}`;
  return `classe des mille : ${k} ; classe des unités : ${p3(u)}`;
};

// Rangs (puissance de 10) pour la valeur de position.
const RANGS = {
  '-3': { pl: 'millièmes', sg: 'millième', au: 'au millième' },
  '-2': { pl: 'centièmes', sg: 'centième', au: 'au centième' },
  '-1': { pl: 'dixièmes', sg: 'dixième', au: 'au dixième' },
  0: { pl: 'unités', sg: 'unité', au: "à l'unité" },
  1: { pl: 'dizaines', sg: 'dizaine', au: 'à la dizaine' },
  2: { pl: 'centaines', sg: 'centaine', au: 'à la centaine' },
  3: { pl: 'unités de mille', sg: 'unité de mille', au: "à l'unité de mille" },
  4: { pl: 'dizaines de mille', sg: 'dizaine de mille', au: 'à la dizaine de mille' },
  5: { pl: 'centaines de mille', sg: 'centaine de mille', au: 'à la centaine de mille' },
};
const rangNom = (p, n) => (n > 1 ? RANGS[p].pl : RANGS[p].sg);
// Un nombre donné par ses chiffres : { chiffres: {p: d}, milliemes, valeur }
function nombreParChiffres(rng, pHaut, nbDec, distincts = true) {
  const pool = rng.shuffle(range(0, 9));
  const chiffres = {};
  let k = 0;
  for (let p = pHaut; p >= -nbDec; p--) {
    let d = distincts ? pool[k++] : rng.int(0, 9);
    if ((p === pHaut || p === -nbDec) && d === 0) d = distincts ? pool[k++] : rng.int(1, 9);
    chiffres[p] = d;
  }
  const milliemes = Object.entries(chiffres).reduce((s, [p, d]) => s + d * 10 ** (Number(p) + 3), 0);
  return { chiffres, milliemes, valeur: milliemes / 1000 };
}
// Écrit un nombre (en millièmes) avec exactement `dec` décimales (pour comparer : 3,500 / 3,450).
const avecDecimales = (milliemes, dec) => {
  const ent = Math.floor(milliemes / 1000);
  const frac = String(milliemes % 1000).padStart(3, '0').slice(0, dec);
  return dec ? `${formatNombre(ent)},${frac}` : formatNombre(ent);
};
const nbDecimales = (x) => { const s = String(r(x)); return s.includes('.') ? s.split('.')[1].length : 0; };

// ---------------------------------------------------------------------------
// NOMBRES
// ---------------------------------------------------------------------------
const nombresLettres = famille([
  forme((rng) => {
    const n = nombreAvecZeros(rng, rng.int(4, 8), 0.35);
    return {
      type: 'numerique', difficulte: n >= 1e6 ? 3 : 2,
      enonce: `Écris ce nombre en chiffres : « ${enLettres(n)} ».`,
      reponse: n,
      explication: `On découpe par classes de trois chiffres (${classes(n)}). On écrit donc ${fmt(n)}. Attention aux zéros qui marquent les rangs vides.`,
    };
  }, 3),
  forme((rng) => {
    const n = nombreAvecZeros(rng, rng.int(3, 6), 0.3);
    const s = String(n);
    const variantes = [];
    for (let i = 0; i < s.length - 1; i++) {
      const t = s.split(''); [t[i], t[i + 1]] = [t[i + 1], t[i]];
      if (t[0] !== '0') variantes.push(Number(t.join('')));
    }
    variantes.push(n * 10, Math.floor(n / 10), n + 10 ** (s.length - 1 - rng.int(0, 1)), Number(s.replace(/0/, '')) || n + 1);
    const fausses = rng.shuffle(dedoublonner(variantes).filter((v) => v !== n && v > 0)).map(enLettres);
    const c = qcm(rng, enLettres(n), fausses);
    if (!c) return null;
    const notes = [];
    if (/septante/.test(enLettres(n))) notes.push('septante = 70');
    if (/nonante/.test(enLettres(n))) notes.push('nonante = 90');
    if (/quatre-vingt/.test(enLettres(n))) notes.push('quatre-vingts = 80');
    return {
      ...c, difficulte: 1,
      enonce: `Comment s'écrit en lettres le nombre ${fmt(n)} ?`,
      explication: `${fmt(n)} se lit « ${enLettres(n)} ».${notes.length ? ` Rappel : ${notes.join(', ')}.` : ''} Lis bien chaque classe : les mille, puis les unités.`,
    };
  }, 2),
  forme((rng) => {
    const ent = rng.pick([rng.int(2, 20), rng.int(2, 99), rng.int(100, 999)]);
    if (ent % 10 === 1) return null; // « vingt-et-une unités » : on évite l'accord au féminin
    const k = rng.int(1, 3);
    const dec = rng.int(1, 10 ** k - 1);
    if (k > 1 && dec % 10 === 0) return null;
    const nomDec = ['dixième', 'centième', 'millième'][k - 1];
    const lettres = `${enLettres(ent)} unités ${enLettres(dec)} ${pluriel(dec, nomDec)}`;
    const v = r(ent + dec / 10 ** k);
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Écris ce nombre en chiffres : « ${lettres} ».`,
      reponse: v,
      explication: `${fmt(dec)} ${pluriel(dec, nomDec)} : le dernier chiffre doit être au rang des ${nomDec}s, le ${['1er', '2e', '3e'][k - 1]} chiffre après la virgule. On écrit ${fmt(v)}.`,
    };
  }, 2),
]);

const valeurPosition = famille([
  forme((rng) => {
    const nb = nombreParChiffres(rng, rng.int(2, 5), rng.int(0, 3));
    const ps = Object.keys(nb.chiffres).map(Number);
    const p = rng.pick(ps);
    const d = nb.chiffres[p];
    const aide = p < 0 ? 'Après la virgule, on trouve les dixièmes, puis les centièmes, puis les millièmes.'
      : 'Avant la virgule, de droite à gauche : unités, dizaines, centaines, unités de mille, dizaines de mille, centaines de mille.';
    return {
      type: 'numerique', difficulte: p < 0 || p > 3 ? 2 : 1,
      enonce: `Dans le nombre ${fmt(nb.valeur)}, quel est le chiffre des ${RANGS[p].pl} ?`,
      reponse: d,
      explication: `${aide} Le chiffre des ${RANGS[p].pl} est ${d}.`,
    };
  }, 2),
  forme((rng) => {
    const nb = nombreParChiffres(rng, rng.int(2, 5), rng.int(0, 3));
    const ps = Object.keys(nb.chiffres).map(Number).filter((p) => nb.chiffres[p] > 1);
    if (!ps.length) return null;
    const p = rng.pick(ps);
    const d = nb.chiffres[p];
    const autres = Object.keys(RANGS).map(Number).filter((x) => x !== p && Math.abs(x - p) <= 3);
    const c = qcm(rng, `${d} ${RANGS[p].pl}`, rng.shuffle(autres).map((x) => `${d} ${RANGS[x].pl}`));
    if (!c) return null;
    return {
      ...c, difficulte: 1,
      enonce: `Dans le nombre ${fmt(nb.valeur)}, que vaut le chiffre ${d} ?`,
      explication: `Le chiffre ${d} est au rang des ${RANGS[p].pl} : il vaut ${d} ${RANGS[p].pl}, c'est-à-dire ${fmt(r(d * 10 ** p))}.`,
    };
  }, 2),
  forme((rng) => {
    if (rng.next() < 0.25) {
      const v = rng.int(1001, 99999) / 100;
      if (Math.round(v * 100) % 10 === 0) return null;
      const n = Math.floor(r(v * 10));
      return {
        type: 'numerique', difficulte: 3,
        enonce: `Combien y a-t-il de dixièmes en tout dans le nombre ${fmt(v)} ?`,
        reponse: n,
        explication: `1 unité = 10 dixièmes. ${fmt(v)} = ${fmt(n)} dixièmes et ${Math.round(v * 100) % 10} centièmes. Astuce : on multiplie par 10 et on garde la partie entière.`,
      };
    }
    const n = nombreAvecZeros(rng, rng.int(4, 6), 0.15);
    const p = rng.pick([1, 2, 3].filter((x) => x < String(n).length - 1));
    const q = Math.floor(n / 10 ** p);
    const reste = n % 10 ** p;
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Combien y a-t-il de ${RANGS[p].pl} en tout dans le nombre ${fmt(n)} ?`,
      reponse: q,
      explication: `On prend tous les chiffres jusqu'à celui des ${RANGS[p].pl} (inclus) : ${fmt(n)} = ${fmt(q)} ${RANGS[p].pl}${reste ? ` et ${fmt(reste)} ${pluriel(reste, 'unité')}` : ''}.`,
    };
  }, 2),
  forme((rng) => {
    const p = rng.pick([-2, -1, 1, 2, 3]);
    let n = p < 0 ? rng.int(101, 9999) / 100 : rng.int(1000, 99999);
    if (rng.next() < 0.6) { // on force souvent un 9 au rang visé pour provoquer une retenue
      const unite = 10 ** p;
      const chiffre = Math.floor(r(n / unite)) % 10;
      n = r(n + (9 - chiffre) * unite);
    }
    const res = r(n + 10 ** p);
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Ajoute 1 ${RANGS[p].sg} au nombre ${fmt(n)}. Quel nombre obtiens-tu ?`,
      reponse: res,
      explication: `1 ${RANGS[p].sg} = ${fmt(10 ** p)}. ${fmt(n)} + ${fmt(10 ** p)} = ${fmt(res)}.${Math.floor(r(n / 10 ** p)) % 10 === 9 ? ` Le chiffre des ${RANGS[p].pl} était un 9 : il devient 0 et on fait une retenue au rang suivant.` : ''}`,
    };
  }),
]);

const decomposer = famille([
  forme((rng) => {
    const nb = nombreParChiffres(rng, rng.int(2, 4), rng.int(0, 2), false);
    const termes = Object.entries(nb.chiffres).filter(([, d]) => d > 0)
      .map(([p, d]) => ({ p: Number(p), d, v: r(d * 10 ** Number(p)) })).sort((a, b) => b.p - a.p);
    if (termes.length < 3) return null;
    const ordre = rng.next() < 0.5 ? rng.shuffle(termes) : termes;
    return {
      type: 'numerique', difficulte: 1,
      enonce: `Calcule : ${ordre.map((t) => fmt(t.v)).join(' + ')}`,
      reponse: nb.valeur,
      explication: `On place chaque chiffre à son rang : ${termes.map((t) => `${t.d} ${rangNom(t.p, t.d)}`).join(', ')}. Cela donne ${fmt(nb.valeur)}.`,
    };
  }),
  forme((rng) => {
    const nb = nombreParChiffres(rng, rng.int(1, 5), rng.int(0, 3), false);
    const termes = Object.entries(nb.chiffres).filter(([, d]) => d > 0).map(([p, d]) => ({ p: Number(p), d }))
      .sort((a, b) => b.p - a.p);
    if (termes.length < 3 || termes.length > 5) return null;
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Quel nombre est formé de ${enumerer(termes.map((t) => `${t.d} ${rangNom(t.p, t.d)}`))} ?`,
      reponse: nb.valeur,
      explication: `On écrit chaque chiffre à son rang et on met un 0 dans les rangs vides : ${fmt(nb.valeur)}.`,
    };
  }, 2),
  forme((rng) => {
    const t = rng.pick([
      () => [[rng.int(11, 99), 2], [rng.int(1, 9), 1], [rng.int(1, 9), 0]],
      () => [[rng.int(12, 60), 3], [rng.int(1, 9), 2]],
      () => [[rng.int(2, 9), 0], [rng.int(11, 39), -1]],
      () => [[rng.int(2, 9), 0], [rng.int(101, 350), -2]],
      () => [[rng.int(11, 99), 1], [rng.int(11, 99), 0]],
      () => [[rng.int(2, 9), 2], [rng.int(11, 40), 1]],
    ])();
    if (t.some(([n]) => n % 10 === 0)) return null;
    const v = r(t.reduce((s, [n, p]) => s + n * 10 ** p, 0));
    return {
      type: 'numerique', difficulte: 3,
      enonce: `Quel nombre est égal à ${t.map(([n, p]) => `${n} ${rangNom(p, n)}`).join(' + ')} ?`,
      reponse: v,
      explication: `${t.map(([n, p]) => `${n} ${rangNom(p, n)} = ${fmt(r(n * 10 ** p))}`).join(' ; ')}. En tout : ${fmt(v)}.`,
    };
  }, 2),
  forme((rng) => {
    const nb = nombreParChiffres(rng, rng.int(3, 5), rng.int(0, 2), false);
    const termes = Object.entries(nb.chiffres).filter(([, d]) => d > 0).map(([p, d]) => ({ p: Number(p), d })).sort((a, b) => b.p - a.p);
    if (termes.length < 3) return null;
    const ecr = (ts) => ts.map((t) => fmt(r(t.d * 10 ** t.p))).join(' + ');
    const fausses = [];
    for (let i = 0; i < termes.length; i++) {
      for (const dp of [1, -1]) {
        const ts = termes.map((t, j) => (j === i ? { ...t, p: t.p + dp } : t));
        if (new Set(ts.map((t) => t.p)).size === ts.length && ts.every((t) => t.p >= -3)) fausses.push(ecr(ts));
      }
    }
    const c = qcm(rng, ecr(termes), rng.shuffle(fausses));
    if (!c) return null;
    return {
      ...c, difficulte: 2,
      enonce: `Quelle décomposition correspond au nombre ${fmt(nb.valeur)} ?`,
      explication: `${fmt(nb.valeur)} = ${ecr(termes)}. Chaque chiffre vaut selon son rang : ${termes.map((t) => `${t.d} ${rangNom(t.p, t.d)}`).join(', ')}.`,
    };
  }),
]);

const arrondir = famille([
  forme((rng) => {
    const p = rng.pick([1, 2, 3, 0, -1, -2]);
    let m; // en millièmes
    if (p >= 1) m = rng.int(10 ** (p + 1), 10 ** (p + 2) * 9) * 1000;
    else if (p === 0) m = rng.int(1001, 99999) * (rng.next() < 0.5 ? 10 : 100);
    else if (p === -1) m = rng.int(1001, 99999) * (rng.next() < 0.5 ? 1 : 10);
    else m = rng.int(1001, 99999);
    const unite = 10 ** (p + 3);
    if (m % unite === 0) return null;
    const res = Math.floor(m / unite + 0.5) * unite;
    const suivant = Math.floor(m / (unite / 10)) % 10;
    const rv = res / 1000;
    return {
      type: 'numerique', difficulte: p < 0 ? 2 : 1,
      enonce: `Arrondis ${fmt(m / 1000)} ${RANGS[p].au}.`,
      reponse: rv,
      explication: `On regarde le chiffre juste après, celui des ${RANGS[p - 1].pl} : c'est ${suivant}. ${suivant >= 5 ? 'Il vaut 5 ou plus : on arrondit au-dessus' : 'Il est plus petit que 5 : on arrondit en dessous'}. Réponse : ${fmt(rv)}.`,
    };
  }, 3),
  forme((rng) => {
    const p = rng.pick([1, 2, 3]);
    const u = 10 ** p;
    const R = rng.int(3, 99) * u;
    const bon = R + rng.pick([-1, 1]) * rng.int(1, u / 2 - 1);
    if (bon % u === 0) return null;
    const fausses = [R + u / 2, R - u / 2 - rng.int(1, Math.max(1, u / 10)), R + u + rng.int(1, u / 2 - 1), R - u + rng.int(1 - u / 2, u / 2 - 1), R + u / 2 + rng.int(1, u / 5)]
      .filter((x) => Math.floor(x / u + 0.5) * u !== R && x > 0);
    const c = qcm(rng, fmt(bon), fausses.map(fmt));
    if (!c) return null;
    return {
      ...c, difficulte: 2,
      enonce: `Quel nombre, arrondi ${RANGS[p].au}, donne ${fmt(R)} ?`,
      explication: `Les nombres entiers qui s'arrondissent à ${fmt(R)} vont de ${fmt(R - u / 2)} à ${fmt(R + u / 2 - 1)}. ${fmt(bon)} en fait partie. Attention : ${fmt(R + u / 2)} s'arrondit à ${fmt(R + u)}.`,
    };
  }),
]);

// Ensembles de décimaux « pièges » (même partie entière, nombre de décimales différent).
function decimauxPieges(rng, n = 4) {
  const I = rng.int(0, 25);
  const [a, b, c] = rng.shuffle(range(1, 9));
  const cands = [
    [I, `${a}`], [I, `${a}${b}`], [I, `${b}${a}`], [I, `0${a}`], [I, `${a}0${b}`], [I, `${a}${b}${c}`],
    [I, `0${a}${b}`], [I, `${b}`], [I, `${a}${c}`], [I + 1, `0${a}`], [Math.max(0, I - 1), `${a}${b}`],
  ].map(([e, d]) => e * 1000 + Number(d.padEnd(3, '0')));
  const vals = rng.shuffle(dedoublonner(cands)).slice(0, n);
  return vals.length === n ? vals : null;
}
const aff = (m) => fmt(m / 1000);
const padTous = (vals) => { const dec = Math.max(...vals.map((m) => nbDecimales(m / 1000))); return vals.map((m) => avecDecimales(m, dec)); };

const comparerDecimaux = famille([
  forme((rng) => {
    const vals = decimauxPieges(rng);
    if (!vals) return null;
    const max = rng.next() < 0.5;
    const bon = max ? Math.max(...vals) : Math.min(...vals);
    const c = qcm(rng, aff(bon), vals.filter((v) => v !== bon).map(aff));
    if (!c) return null;
    return {
      ...c, difficulte: 2,
      enonce: `Quel nombre est le plus ${max ? 'grand' : 'petit'} ?`,
      explication: `On écrit tous les nombres avec le même nombre de décimales : ${padTous(vals).join(' ; ')}. On compare la partie entière, puis les dixièmes, puis les centièmes : le plus ${max ? 'grand' : 'petit'} est ${aff(bon)}.`,
    };
  }, 2),
  forme((rng) => {
    const vals = decimauxPieges(rng);
    if (!vals) return null;
    const croissant = rng.next() < 0.5;
    const idx = vals.map((_, i) => i).sort((i, j) => vals[i] - vals[j]);
    if (!croissant) idx.reverse();
    return {
      type: 'ordre', difficulte: 2,
      enonce: `Range ces nombres du plus ${croissant ? 'petit au plus grand' : 'grand au plus petit'}.`,
      elements: vals.map(aff), reponse: idx,
      explication: `Avec le même nombre de décimales : ${padTous(vals).join(' ; ')}. Ordre : ${idx.map((i) => aff(vals[i])).join(croissant ? ' < ' : ' > ')}.`,
    };
  }, 2),
  forme((rng) => {
    const vals = decimauxPieges(rng, 2);
    if (!vals) return null;
    const [x, y] = vals;
    const sym = rng.pick(['<', '>', '=']);
    let gauche = aff(x); let droite = aff(y); let vrai;
    if (sym === '=') {
      const e = Math.floor(x / 1000); const d = String(x % 1000).padStart(3, '0').replace(/0+$/, '');
      if (!d || d.length > 2) return null;
      vrai = rng.next() < 0.5;
      gauche = `${fmt(e)},${d}`;
      droite = vrai ? `${fmt(e)},${d}0` : `${fmt(e)},0${d}`;
    } else vrai = sym === '<' ? x < y : x > y;
    return {
      type: 'vrai_faux', difficulte: 2,
      enonce: `Vrai ou faux ? ${gauche} ${sym} ${droite}`,
      reponse: vrai,
      explication: sym === '='
        ? (vrai ? `Un zéro à la fin de la partie décimale ne change pas la valeur : ${gauche} = ${droite}.` : `${droite} a un 0 au rang des dixièmes : ce n'est pas le même nombre que ${gauche}.`)
        : `Avec le même nombre de décimales : ${padTous([x, y]).join(' et ')}. Donc ${x < y ? `${aff(x)} < ${aff(y)}` : `${aff(x)} > ${aff(y)}`}.`,
    };
  }),
  forme((rng) => {
    const base = rng.int(10, 99);
    const [a, b, c] = rng.shuffle([0, 9, rng.int(1, 8)]);
    const perms = [[a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a]];
    const vals = rng.shuffle(perms.map((t) => base * 1000 + t[0] * 100 + t[1] * 10 + t[2])).slice(0, 4);
    const croissant = rng.next() < 0.5;
    const idx = vals.map((_, i) => i).sort((i, j) => vals[i] - vals[j]);
    if (!croissant) idx.reverse();
    return {
      type: 'ordre', difficulte: 1,
      enonce: `Range ces nombres du plus ${croissant ? 'petit au plus grand' : 'grand au plus petit'}.`,
      elements: vals.map(fmt), reponse: idx,
      explication: `Ils commencent tous par ${base} : on compare les centaines, puis les dizaines, puis les unités. ${idx.map((i) => fmt(vals[i])).join(croissant ? ' < ' : ' > ')}.`,
    };
  }),
]);

const intercaler = famille([
  forme((rng) => {
    const k = rng.pick([1, 1, 2]); // décimales des bornes
    const pas = 10 ** (3 - k);
    const A = rng.int(1, 300) * pas + (k === 1 ? rng.int(0, 9) * 1000 : 0);
    const B = A + pas;
    const bon = A + rng.int(1, 9) * (pas / 10);
    const ent = Math.floor(A / 1000);
    const fausses = [A - rng.int(1, 9) * pas / 10, B + rng.int(1, 9) * pas / 10, ent * 1000 + (A % 1000) / 10 + rng.int(1, 9), A + 10 * pas + rng.int(1, 9) * pas / 10]
      .filter((x) => x > 0 && (x <= A || x >= B) && x % 1 === 0);
    const c = qcm(rng, aff(bon), fausses.map(aff));
    if (!c) return null;
    return {
      ...c, difficulte: 2,
      enonce: `Quel nombre est compris entre ${aff(A)} et ${aff(B)} ?`,
      explication: `On ajoute un chiffre après les ${k === 1 ? 'dixièmes' : 'centièmes'} : entre ${avecDecimales(A, k + 1)} et ${avecDecimales(B, k + 1)}, on trouve ${aff(bon)}.`,
    };
  }, 2),
  forme((rng) => {
    const k = rng.pick([1, 2]);
    const pas = 10 ** (3 - k);
    const A = rng.int(10, 999) * pas;
    const ecart = rng.int(1, 9) * pas * (rng.next() < 0.3 ? 10 : 1);
    const B = A + ecart;
    const m = (A + B) / 2;
    return {
      type: 'numerique', difficulte: 3,
      enonce: `Quel nombre se trouve exactement au milieu de ${aff(A)} et ${aff(B)} ?`,
      reponse: m / 1000,
      explication: `Le milieu, c'est la moitié de la somme : (${aff(A)} + ${aff(B)}) : 2 = ${aff(A + B)} : 2 = ${aff(m)}.`,
    };
  }),
  forme((rng) => {
    const A = rng.int(1, 150) * 10 + rng.int(1, 9);
    const B = A + rng.int(15, 75) + rng.int(1, 9);
    if (B % 10 === 0) return null;
    const entiers = range(Math.ceil(A / 10), Math.floor(B / 10));
    if (entiers.length < 2 || entiers.length > 8) return null;
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Combien de nombres entiers sont compris entre ${fmt(A / 10)} et ${fmt(B / 10)} ?`,
      reponse: entiers.length,
      explication: `Ce sont ${enumerer(entiers.map(fmt))} : il y en a ${entiers.length}.`,
    };
  }),
]);

const droiteGraduee = famille([
  forme((rng) => {
    const cas = rng.pick([[0, 1, 10], [0, 1, 5], [0, 1, 4], [0, 1, 2], [2, 3, 10], [5, 6, 4], [100, 200, 10], [100, 200, 4], [0, 1000, 5],
      [0, 100, 20], [1000, 2000, 5], [0, 0.1, 10], [3, 3.5, 5], [0, 10, 4], [50, 60, 5], [0, 500, 10], [7, 8, 5], [1, 2, 10]]);
    const decal = rng.int(0, 5) * (cas[1] - cas[0]);
    const A = r(cas[0] + decal); const B = r(cas[1] + decal); const n = cas[2];
    const step = r((B - A) / n);
    const k = rng.int(1, n - 1);
    const v = r(A + k * step);
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Sur une droite graduée, l'espace entre ${fmt(A)} et ${fmt(B)} est partagé en ${n} parts égales. Quel nombre se trouve à la ${k === 1 ? '1re' : `${k}e`} graduation après ${fmt(A)} ?`,
      reponse: v,
      explication: `Une part vaut (${fmt(B)} − ${fmt(A)}) : ${n} = ${fmt(step)}. ${fmt(A)} + ${k} × ${fmt(step)} = ${fmt(v)}.`,
    };
  }, 2),
  forme((rng) => {
    const cas = rng.pick([[0, 1, 10], [0, 1, 5], [0, 1, 4], [0, 10, 5], [0, 100, 4], [0, 1000, 8], [0, 1, 20], [0, 0.1, 5], [0, 50, 10], [0, 200, 8], [0, 1, 8]]);
    const decal = rng.int(1, 9) * cas[1];
    const A = r(cas[0] + decal); const B = r(cas[1] + decal);
    const step = r((B - A) / cas[2]);
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Sur une droite graduée, il y a ${cas[2]} intervalles égaux entre ${fmt(A)} et ${fmt(B)}. Combien vaut un intervalle ?`,
      reponse: step,
      explication: `On partage l'écart en ${cas[2]} : (${fmt(B)} − ${fmt(A)}) : ${cas[2]} = ${fmt(r(B - A))} : ${cas[2]} = ${fmt(step)}.`,
    };
  }),
  forme((rng) => {
    const step = rng.pick([0.1, 0.2, 0.25, 0.5, 2, 5, 25, 50, 0.01, 0.05]);
    const A = r(rng.int(2, 40) * step);
    const k = rng.int(2, 7);
    const gauche = rng.next() < 0.35 && A - k * step > 0;
    const v = r(gauche ? A - k * step : A + k * step);
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Sur une droite graduée, deux graduations voisines sont séparées de ${fmt(step)}. Le point A est sur ${fmt(A)}. Quel nombre se trouve ${k} graduations plus loin vers la ${gauche ? 'gauche' : 'droite'} ?`,
      reponse: v,
      explication: `Vers la ${gauche ? 'gauche, les nombres diminuent' : 'droite, les nombres augmentent'} : ${fmt(A)} ${gauche ? '−' : '+'} ${k} × ${fmt(step)} = ${fmt(v)}.`,
    };
  }),
]);

function suite(rng) {
  const t = rng.int(0, 5);
  if (t === 0) { const s = rng.pick([3, 4, 6, 7, 8, 9, 11, 12, 15, 25, 50, 75, 125, 250]); const a = rng.int(1, 60) * rng.pick([1, 5]); return { f: (i) => a + i * s, regle: `+ ${fmt(s)}`, txt: `On ajoute ${fmt(s)} à chaque fois`, s, op: '+' }; }
  if (t === 1) { const s = rng.pick([3, 4, 6, 7, 9, 11, 15, 25, 50, 125]); const a = s * 6 + rng.int(1, 300); return { f: (i) => a - i * s, regle: `− ${fmt(s)}`, txt: `On enlève ${fmt(s)} à chaque fois`, s, op: '−' }; }
  if (t === 2) {
    const s = rng.pick([0.1, 0.2, 0.25, 0.3, 0.5, 0.05, 0.15, 1.5, 0.4]); const a = r(rng.int(0, 40) * 0.1); const dec = rng.next() < 0.4; const a2 = dec ? r(a + 6 * s) : a;
    return { f: (i) => r(dec ? a2 - i * s : a2 + i * s), regle: `${dec ? '−' : '+'} ${fmt(s)}`, txt: `On ${dec ? 'enlève' : 'ajoute'} ${fmt(s)} à chaque fois`, s, op: dec ? '−' : '+' };
  }
  if (t === 3) { const k = rng.pick([2, 2, 3, 10]); const a = k === 10 ? rng.pick([0.003, 0.02, 0.5, 4, 7, 0.06]) : rng.int(1, k === 2 ? 30 : 5); return { f: (i) => r(a * k ** i), regle: `× ${k}`, txt: `On multiplie par ${k} à chaque fois`, s: k, op: '×' }; }
  if (t === 4) { const a = rng.int(1, 7) * 2 ** 6; return { f: (i) => a / 2 ** i, regle: ': 2', txt: 'On divise par 2 à chaque fois (on prend la moitié)', s: 2, op: ':' }; }
  const s = rng.pick([1000, 500, 250, 100]); const a = rng.int(1, 9) * 1000 + rng.int(0, 9) * 100;
  return { f: (i) => a + i * s, regle: `+ ${fmt(s)}`, txt: `On ajoute ${fmt(s)} à chaque fois`, s, op: '+' };
}
const suites = famille([
  forme((rng) => {
    const S = suite(rng);
    const termes = range(0, 5).map(S.f);
    if (termes.some((x) => x < 0 || nbDecimales(x) > 3)) return null;
    const trou = rng.int(1, 5);
    return {
      type: 'numerique', difficulte: S.op === '×' || S.op === ':' || nbDecimales(termes[1]) ? 2 : 1,
      enonce: `Complète la suite : ${termes.map((x, i) => (i === trou ? '…' : fmt(x))).join(' ; ')}`,
      reponse: termes[trou],
      explication: `${S.txt} : ${fmt(termes[trou - 1])} ${S.regle} = ${fmt(termes[trou])}.`,
    };
  }, 3),
  forme((rng) => {
    const S = suite(rng);
    const termes = range(0, 4).map(S.f);
    if (termes.some((x) => x < 0 || nbDecimales(x) > 3)) return null;
    const d = r(termes[1] - termes[0]);
    const fausses = [
      S.op === '+' ? `− ${fmt(S.s)}` : S.op === '−' ? `+ ${fmt(S.s)}` : S.op === '×' ? `: ${S.s}` : `× ${S.s}`,
      d > 0 ? `+ ${fmt(d)}` : `− ${fmt(-d)}`,
      S.op === '+' || S.op === '−' ? '× 2' : `+ ${fmt(Math.abs(d))}`,
      `${S.op === '−' ? '−' : '+'} ${fmt(r(S.s * 2))}`,
      S.op === '+' || S.op === '−' ? `${S.op} ${fmt(r(S.s * 10))}` : `× ${S.s + 1}`,
    ].filter((x) => x !== S.regle);
    const c = qcm(rng, S.regle, fausses);
    if (!c) return null;
    return {
      ...c, difficulte: 2,
      enonce: `Quelle est la règle de cette suite : ${termes.map(fmt).join(' ; ')} ?`,
      explication: `${S.txt} : ${fmt(termes[0])} ${S.regle} = ${fmt(termes[1])}, ${fmt(termes[1])} ${S.regle} = ${fmt(termes[2])}… La règle doit marcher pour tous les termes.`,
    };
  }),
]);

// ---------------------------------------------------------------------------
// FRACTIONS
// ---------------------------------------------------------------------------
const fr = (n, d) => `${n}/${d}`;
const lesFr = (n, d) => (n > 1 ? `les ${n}/${d}` : `${n}/${d}`);
function fractionIrreductible(rng, dMax = 12) {
  for (let i = 0; i < 50; i++) {
    const d = rng.int(2, dMax); const n = rng.int(1, d - 1);
    if (pgcd(n, d) === 1) return [n, d];
  }
  return [1, 2];
}
const egales = ([a, b], [c, d]) => a * d === b * c;
const fracOk = (x) => { const [n, d] = x; return Number.isInteger(n) && Number.isInteger(d) && n > 0 && d > 0; };

const fractionsEquivalentes = famille([
  forme((rng) => {
    const [a, b] = fractionIrreductible(rng, 10);
    const k = rng.int(2, 9);
    const numManquant = rng.next() < 0.5;
    return {
      type: 'numerique', difficulte: 1,
      enonce: numManquant ? `Complète : ${fr(a, b)} = …/${b * k}` : `Complète : ${fr(a, b)} = ${a * k}/…`,
      reponse: numManquant ? a * k : b * k,
      explication: `On multiplie le numérateur et le dénominateur par le même nombre : ${numManquant ? `${b} × ${k} = ${b * k}, donc ${a} × ${k} = ${a * k}` : `${a} × ${k} = ${a * k}, donc ${b} × ${k} = ${b * k}`}. ${fr(a, b)} = ${fr(a * k, b * k)}.`,
    };
  }, 2),
  forme((rng) => {
    const [a, b] = fractionIrreductible(rng, 9);
    const k = rng.int(2, 6);
    const cands = [[a + k, b + k], [a * k, b * (k + 1)], [a * k + 1, b * k], [b, a], [a * (k + 1), b * k], [a + 1, b + 1], [a * k, b + k], [a * 2, b * 3]]
      .filter((x) => fracOk(x) && !egales(x, [a, b]));
    const c = qcm(rng, fr(a * k, b * k), cands.map((x) => fr(...x)));
    if (!c) return null;
    return {
      ...c, difficulte: 2,
      enonce: `Quelle fraction est égale à ${fr(a, b)} ?`,
      explication: `${fr(a, b)} = ${fr(a * k, b * k)} : on a multiplié le numérateur et le dénominateur par ${k}. Attention : ajouter le même nombre en haut et en bas ne donne pas une fraction égale.`,
    };
  }, 2),
  forme((rng) => {
    const [a, b] = fractionIrreductible(rng, 9);
    const k = rng.pick([4, 6, 8, 9, 10, 12]);
    const f = rng.pick(range(2, k - 1).filter((x) => k % x === 0));
    const cands = [[a * k / f, b * k / f], [a + 1, b], [a, b + 1], [b, a], [a * k / f, b * k], [a + 2, b + 1]]
      .filter((x) => fracOk(x) && x[0] !== x[1] && !(x[0] === a && x[1] === b) && !(x[0] === a * k && x[1] === b * k));
    const c = qcm(rng, fr(a, b), cands.map((x) => fr(...x)));
    if (!c) return null;
    return {
      ...c, difficulte: 2,
      enonce: `Simplifie au maximum la fraction ${fr(a * k, b * k)}.`,
      explication: `Le plus grand nombre qui divise ${a * k} et ${b * k} est ${k} : ${a * k} : ${k} = ${a} et ${b * k} : ${k} = ${b}. ${fr(a, b)} ne peut plus être simplifiée.`,
    };
  }),
  forme((rng) => {
    const [a, b] = fractionIrreductible(rng, 9);
    const k = rng.int(2, 5); const j = rng.int(2, 5);
    const vrai = rng.next() < 0.5;
    const g = [a * k, b * k];
    const d = vrai ? [a * j, b * j] : rng.pick([[a * j + 1, b * j], [a * j, b * j + 1], [a + j, b + j]]);
    if (egales(g, d) !== vrai || (g[0] === d[0] && g[1] === d[1])) return null;
    return {
      type: 'vrai_faux', difficulte: 2,
      enonce: `Vrai ou faux ? ${fr(...g)} = ${fr(...d)}`,
      reponse: vrai,
      explication: vrai ? `Les deux fractions se simplifient en ${fr(a, b)} : elles sont égales.`
        : `${fr(...g)} se simplifie en ${fr(a, b)}, mais pas ${fr(...d)} : elles ne sont pas égales.`,
    };
  }),
]);

const comparerFractions = famille([
  forme((rng) => {
    const t = rng.int(0, 2);
    let f4; let expl;
    const max = rng.next() < 0.5;
    if (t === 0) {
      const d = rng.int(5, 15);
      f4 = rng.shuffle(range(1, d - 1)).slice(0, 4).map((n) => [n, d]);
      expl = `Même dénominateur : la plus ${max ? 'grande' : 'petite'} fraction est celle qui a le plus ${max ? 'grand' : 'petit'} numérateur.`;
    } else if (t === 1) {
      const n = rng.int(1, 5);
      f4 = rng.shuffle(range(n + 1, n + 12)).slice(0, 4).map((d) => [n, d]);
      expl = `Même numérateur : plus le dénominateur est grand, plus les parts sont petites. La plus ${max ? 'grande' : 'petite'} fraction a donc le plus ${max ? 'petit' : 'grand'} dénominateur.`;
    } else {
      const D = rng.pick([12, 24, 20, 30, 18]);
      const ds = range(2, D).filter((x) => D % x === 0);
      f4 = [];
      for (let i = 0; i < 30 && f4.length < 4; i++) {
        const d = rng.pick(ds); const n = rng.int(1, d - 1);
        if (pgcd(n, d) === 1 && !f4.some((f) => egales(f, [n, d]))) f4.push([n, d]);
      }
      if (f4.length < 4) return null;
      expl = `On met toutes les fractions sur le même dénominateur ${D} : ${f4.map(([n, d]) => `${fr(n, d)} = ${fr(n * D / d, D)}`).join(' ; ')}.`;
    }
    const vals = f4.map(([n, d]) => n / d);
    const bon = f4[vals.indexOf(max ? Math.max(...vals) : Math.min(...vals))];
    const c = qcm(rng, fr(...bon), f4.filter((f) => f !== bon).map((f) => fr(...f)));
    if (!c) return null;
    return {
      ...c, difficulte: t === 2 ? 3 : 2,
      enonce: `Quelle fraction est la plus ${max ? 'grande' : 'petite'} ?`,
      explication: `${expl} Réponse : ${fr(...bon)}.`,
    };
  }, 2),
  forme((rng) => {
    const [a, b] = fractionIrreductible(rng, 10);
    const k = rng.int(2, 4);
    const t = rng.int(0, 2);
    const autre = t === 0 ? [a * k, b * k] : t === 1 ? [a * k + 1, b * k] : [a * k - 1, b * k];
    const signe = egales([a, b], autre) ? '=' : a / b < autre[0] / autre[1] ? '<' : '>';
    const choix = ['<', '>', '='];
    return {
      type: 'qcm', choix, reponse: choix.indexOf(signe), difficulte: 2,
      enonce: `Quel signe faut-il placer entre ${fr(a, b)} et ${fr(...autre)} ?`,
      explication: `${fr(a, b)} = ${fr(a * k, b * k)}. On compare ${fr(a * k, b * k)} et ${fr(...autre)} : même dénominateur, on compare les numérateurs. Donc ${fr(a, b)} ${signe} ${fr(...autre)}.`,
    };
  }, 2),
  forme((rng) => {
    const D = rng.pick([12, 8, 10, 6, 20]);
    const ds = range(2, D).filter((x) => D % x === 0);
    const f = [];
    for (let i = 0; i < 40 && f.length < 4; i++) {
      const d = rng.pick(ds); const n = rng.int(1, d - 1);
      if (pgcd(n, d) === 1 && !f.some((x) => egales(x, [n, d]))) f.push([n, d]);
    }
    if (f.length < 4) return null;
    const idx = f.map((_, i) => i).sort((i, j) => f[i][0] / f[i][1] - f[j][0] / f[j][1]);
    return {
      type: 'ordre', difficulte: 3,
      enonce: 'Range ces fractions de la plus petite à la plus grande.',
      elements: f.map((x) => fr(...x)), reponse: idx,
      explication: `Sur le dénominateur ${D} : ${f.map(([n, d]) => `${fr(n, d)} = ${fr(n * D / d, D)}`).join(' ; ')}. Ordre : ${idx.map((i) => fr(...f[i])).join(' < ')}.`,
    };
  }),
  forme((rng) => {
    const plus = rng.next() < 0.5;
    const f = [];
    for (let i = 0; i < 80 && f.length < 4; i++) {
      const d = rng.int(3, 15); const n = rng.int(1, d - 1);
      if (2 * n === d) continue;
      const veut = f.length === 0 ? plus : !plus;
      if ((2 * n > d) === veut && !f.some((x) => egales(x, [n, d]))) f.push([n, d]);
    }
    if (f.length < 4) return null;
    const c = qcm(rng, fr(...f[0]), f.slice(1).map((x) => fr(...x)));
    if (!c) return null;
    return {
      ...c, difficulte: 2,
      enonce: `Quelle fraction est ${plus ? 'plus grande' : 'plus petite'} que 1/2 ?`,
      explication: `Une fraction vaut 1/2 quand le numérateur est la moitié du dénominateur. Pour ${fr(...f[0])}, la moitié de ${f[0][1]} est ${fmt(f[0][1] / 2)} et ${f[0][0]} est ${plus ? 'plus grand' : 'plus petit'}. Les autres fractions sont ${plus ? 'plus petites' : 'plus grandes'} que 1/2.`,
    };
  }),
]);

// Fractions « faciles » à convertir en décimal / pourcentage.
function fractionDecimale(rng) {
  const d = rng.pick([2, 4, 5, 10, 20, 25, 50, 100, 8, 4, 5, 20]);
  let n = 1;
  for (let i = 0; i < 20; i++) { n = rng.int(1, d - 1); if (pgcd(n, d) === 1) break; }
  if (pgcd(n, d) !== 1) return null;
  const vers = d === 8 ? 1000 : 100;
  return { n, d, vers, k: vers / d, v: r(n / d) };
}
const fracDecPct = famille([
  forme((rng) => {
    const f = fractionDecimale(rng);
    if (!f) return null;
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Écris ${fr(f.n, f.d)} sous forme de nombre décimal.`,
      reponse: f.v,
      explication: f.d === f.vers ? `${fr(f.n, f.d)} = ${fmt(f.v)}.` : `On multiplie le numérateur et le dénominateur par ${f.k} : ${fr(f.n, f.d)} = ${fr(f.n * f.k, f.vers)} = ${fmt(f.v)}.`,
    };
  }, 2),
  forme((rng) => {
    const f = fractionDecimale(rng);
    if (!f || f.d === 8) return null;
    const p = r(f.v * 100);
    return {
      type: 'numerique', unite: '%', difficulte: 2,
      enonce: `Quel pourcentage correspond à ${fr(f.n, f.d)} ?`,
      reponse: p,
      explication: `Un pourcentage, c'est une fraction sur 100 : ${fr(f.n, f.d)} = ${fr(p, 100)} = ${fmt(p)} %.`,
    };
  }),
  forme((rng) => {
    const v = rng.pick([rng.int(1, 99) / 100, rng.int(1, 9) / 10, rng.int(1, 19) / 100]);
    const p = r(v * 100);
    return rng.next() < 0.5 ? {
      type: 'numerique', difficulte: 2,
      enonce: `Écris ${fmt(p)} % sous forme de nombre décimal.`,
      reponse: r(v),
      explication: `${fmt(p)} % = ${fmt(p)}/100 = ${fmt(v)}.`,
    } : {
      type: 'numerique', unite: '%', difficulte: 2,
      enonce: `Écris ${fmt(v)} sous forme de pourcentage.`,
      reponse: p,
      explication: `${fmt(v)} = ${fmt(p)}/100 = ${fmt(p)} %.`,
    };
  }),
  forme((rng) => {
    const f = fractionDecimale(rng);
    if (!f || f.d === 8 || f.d === 100) return null;
    const p = r(f.v * 100);
    const cands = [[1, p], [p, 10], [f.d, f.n], [f.n, f.d + 1], [f.n + 1, f.d], [1, f.d], [p, 1000]]
      .filter((x) => fracOk(x) && !egales(x, [f.n, f.d]));
    const c = qcm(rng, fr(f.n, f.d), cands.map((x) => fr(...x)));
    if (!c) return null;
    return {
      ...c, difficulte: 2,
      enonce: `Quelle fraction est égale à ${fmt(p)} % ?`,
      explication: `${fmt(p)} % = ${fr(p, 100)}. On divise le numérateur et le dénominateur par ${fmt(100 / f.d)} : ${fr(f.n, f.d)}.`,
    };
  }),
  forme((rng) => {
    const f = fractionDecimale(rng);
    if (!f || f.d === 8) return null;
    const p = r(f.v * 100);
    const formes = [{ t: fmt(f.v) }, { t: `${fmt(p)} %` }, { t: fr(f.n, f.d) }];
    const cible = rng.pick(formes);
    const bonne = rng.pick(formes.filter((x) => x !== cible));
    const fausses = [
      { t: `${fmt(f.n)} %`, v: f.n / 100 }, { t: fmt(r(f.n / 10)), v: r(f.n / 10) }, { t: `${fmt(r(p / 10))} %`, v: r(p / 1000) },
      { t: fr(f.d, f.n), v: f.d / f.n }, { t: fmt(r(f.v * 10)), v: r(f.v * 10) }, { t: `${fmt(f.d)} %`, v: f.d / 100 },
      { t: fmt(r(f.v + 1)), v: r(f.v + 1) },
    ].filter((x) => Math.abs(x.v - f.v) > 1e-9 && x.t !== cible.t).map((x) => x.t);
    const c = qcm(rng, bonne.t, fausses);
    if (!c) return null;
    return {
      ...c, difficulte: 2,
      enonce: `Quelle écriture est égale à ${cible.t} ?`,
      explication: `${fr(f.n, f.d)} = ${fmt(f.v)} = ${fmt(p)} % : ces trois écritures représentent le même nombre.`,
    };
  }),
]);

// Grandeurs de référence pour les fractions d'une grandeur.
const GRANDEURS_FRAC = [
  { de: "d'une heure", un: '1 heure', tot: 60, u: 'minutes', uc: 'min', q: 'Combien de minutes font' },
  { de: "d'une journée", un: '1 journée', tot: 24, u: 'heures', uc: 'h', q: "Combien d'heures font" },
  { de: "d'un kilogramme", un: '1 kg', tot: 1000, u: 'grammes', uc: 'g', q: 'Combien de grammes font' },
  { de: "d'un kilomètre", un: '1 km', tot: 1000, u: 'mètres', uc: 'm', q: 'Combien de mètres font' },
  { de: "d'un mètre", un: '1 m', tot: 100, u: 'centimètres', uc: 'cm', q: 'Combien de centimètres font' },
  { de: "d'un litre", un: '1 l', tot: 100, u: 'centilitres', uc: 'cl', q: 'Combien de centilitres font' },
  { de: "d'une année", un: '1 année', tot: 12, u: 'mois', uc: 'mois', q: 'Combien de mois font' },
  { de: "d'un siècle", un: '1 siècle', tot: 100, u: 'années', uc: 'ans', q: "Combien d'années font" },
  { de: "d'une minute", un: '1 minute', tot: 60, u: 'secondes', uc: 's', q: 'Combien de secondes font' },
  { de: "d'un euro", un: '1 euro', tot: 100, u: 'cents', uc: 'cents', q: 'Combien de cents font' },
  { de: 'de 2 heures', un: '2 heures', tot: 120, u: 'minutes', uc: 'min', q: 'Combien de minutes font', plusieurs: true },
  { de: 'de 3 kilogrammes', un: '3 kg', tot: 3000, u: 'grammes', uc: 'g', q: 'Combien de grammes font', plusieurs: true },
  { de: 'de 2 litres', un: '2 l', tot: 200, u: 'centilitres', uc: 'cl', q: 'Combien de centilitres font', plusieurs: true },
  { de: 'de 5 kilomètres', un: '5 km', tot: 5000, u: 'mètres', uc: 'm', q: 'Combien de mètres font', plusieurs: true },
];
const fractionGrandeur = famille([
  forme((rng) => {
    const g = rng.pick(GRANDEURS_FRAC);
    const d = rng.pick(range(2, 12).filter((x) => g.tot % x === 0));
    const n = rng.int(1, d - 1);
    if (pgcd(n, d) !== 1) return null;
    const v = g.tot / d * n;
    return {
      type: 'numerique', unite: g.uc, difficulte: 2,
      enonce: `${g.q} ${lesFr(n, d)} ${g.de} ?`,
      reponse: v,
      explication: `${g.un} = ${fmt(g.tot)} ${g.uc}. On divise par ${d} : ${fmt(g.tot)} : ${d} = ${fmt(g.tot / d)}.${n > 1 ? ` On multiplie par ${n} : ${fmt(g.tot / d)} × ${n} = ${fmt(v)} ${g.uc}.` : ` Donc 1/${d} ${g.de} = ${fmt(v)} ${g.uc}.`}`,
    };
  }, 2),
  forme((rng) => {
    const g = rng.pick(GRANDEURS_FRAC.filter((x) => !x.plusieurs));
    const ds = range(2, 12).filter((x) => g.tot % x === 0);
    const d = rng.pick(ds);
    const n = rng.int(1, d - 1);
    if (pgcd(n, d) !== 1) return null;
    const part = g.tot / d * n;
    const cands = [];
    for (const dd of ds) for (let nn = 1; nn < dd; nn++) if (pgcd(nn, dd) === 1 && !egales([nn, dd], [n, d])) cands.push([nn, dd]);
    cands.sort((x, y) => Math.abs(x[0] / x[1] - n / d) - Math.abs(y[0] / y[1] - n / d));
    const c = qcm(rng, fr(n, d), cands.slice(0, 5).map((x) => fr(...x)));
    if (!c) return null;
    const unitePart = part > 1 || g.u === 'mois' ? g.u : g.u.replace(/s$/, '');
    return {
      ...c, difficulte: 3,
      enonce: `Quelle fraction ${g.de} ${part > 1 ? 'représentent' : 'représente'} ${fmt(part)} ${unitePart} ?`,
      explication: `${g.un} = ${fmt(g.tot)} ${g.uc}. ${fmt(part)} sur ${fmt(g.tot)}, c'est ${fr(part, g.tot)}, qui se simplifie en ${fr(n, d)}.`,
    };
  }),
  forme((rng) => {
    const ctx = rng.pick([
      { e: (n, d, p) => `Les ${fr(n, d)} des élèves d'une école viennent à pied, soit ${p} élèves. Combien d'élèves compte l'école ?`, u: 'élèves', min: 120, max: 600 },
      { e: (n, d, p, P) => `${P.n} a lu les ${fr(n, d)} de son livre, soit ${p} pages. Combien de pages compte le livre ?`, u: 'pages', min: 60, max: 400 },
      { e: (n, d, p) => `Un réservoir rempli aux ${fr(n, d)} contient ${p} litres. Quelle est sa capacité totale ?`, u: 'l', min: 20, max: 120 },
      { e: (n, d, p, P) => `${P.n} a déjà parcouru les ${fr(n, d)} d'une randonnée, soit ${p} km. Quelle est la longueur de la randonnée ?`, u: 'km', min: 6, max: 30 },
      { e: (n, d, p, P) => `${P.n} a dépensé les ${fr(n, d)} de ses économies, soit ${p} €. Combien avait-${P.il} au départ ?`, u: '€', min: 20, max: 300 },
      { e: (n, d, p) => `Les ${fr(n, d)} des places d'un cinéma sont occupées, soit ${p} places. Combien de places compte le cinéma ?`, u: 'places', min: 90, max: 450 },
    ]);
    const d = rng.int(3, 10); const n = rng.int(2, d - 1);
    if (pgcd(n, d) !== 1) return null;
    const bas = Math.max(2, Math.ceil(ctx.min / d)); const haut = Math.floor(ctx.max / d);
    if (haut < bas) return null;
    const unePart = rng.int(bas, haut);
    const p = unePart * n; const tot = unePart * d;
    return {
      type: 'numerique', unite: ctx.u, difficulte: 3,
      enonce: ctx.e(n, d, p, rng.pick(PRENOMS)),
      reponse: tot,
      explication: `Les ${fr(n, d)} valent ${p}, donc 1/${d} vaut ${p} : ${n} = ${unePart}. Le tout (${fr(d, d)}) vaut ${unePart} × ${d} = ${tot}.`,
    };
  }, 2),
  forme((rng) => {
    const obj = rng.pick([['Un ruban', 'm', 100, 'cm', 'mesure', 'coupe', 3], ['Une planche', 'm', 100, 'cm', 'mesure', 'scie', 3], ['Une bouteille de jus', 'l', 100, 'cl', 'contient', 'boit', 2],
      ['Un sac de farine', 'kg', 1000, 'g', 'pèse', 'utilise', 3], ['Un rouleau de corde', 'm', 100, 'cm', 'mesure', 'coupe', 3], ['Un bidon d\'eau', 'l', 100, 'cl', 'contient', 'verse', 3]]);
    const q = rng.int(1, obj[6]);
    const d = rng.pick([2, 4, 5, 8, 10, 3]);
    const n = rng.int(1, d - 1);
    const tot = q * obj[2];
    if (tot % d || pgcd(n, d) !== 1) return null;
    const utilise = tot / d * n; const reste = tot - utilise;
    return {
      type: 'numerique', unite: obj[3], difficulte: 3,
      enonce: `${obj[0]} ${obj[4]} ${q} ${obj[1]}. On en ${obj[5]} ${lesFr(n, d)}. Combien en reste-t-il, en ${obj[3]} ?`,
      reponse: reste,
      explication: `${q} ${obj[1]} = ${fmt(tot)} ${obj[3]}. ${fr(n, d)} de ${fmt(tot)} : ${fmt(tot)} : ${d} × ${n} = ${fmt(utilise)} ${obj[3]}. Il reste ${fmt(tot)} − ${fmt(utilise)} = ${fmt(reste)} ${obj[3]}, c'est-à-dire ${lesFr(d - n, d)}.`,
    };
  }),
]);

const additionFractions = famille([
  forme((rng) => {
    const d = rng.int(3, 15);
    const plus = rng.next() < 0.6;
    const a = rng.int(1, d - 1); const b = rng.int(1, d - 1);
    if (plus ? a + b >= d : a <= b) return null;
    const res = plus ? a + b : a - b;
    const cands = plus ? [[a + b, d + d], [a * b, d], [a + b + 1, d], [Math.abs(a - b), d], [a + b, d * d]]
      : [[res, d + d], [a + b, d], [res + 1, d], [res, d - 1], [res, 0]];
    const c = qcm(rng, fr(res, d), cands.filter((x) => fracOk(x) && !egales(x, [res, d])).map((x) => fr(...x)));
    if (!c) return null;
    return {
      ...c, difficulte: 2,
      enonce: `Calcule : ${fr(a, d)} ${plus ? '+' : '−'} ${fr(b, d)}`,
      explication: `Les dénominateurs sont les mêmes : on ${plus ? 'additionne' : 'soustrait'} les numérateurs (${a} ${plus ? '+' : '−'} ${b} = ${res}) et on garde le dénominateur ${d}. Résultat : ${fr(res, d)}.`,
    };
  }, 2),
  forme((rng) => {
    const obj = rng.pick(['une tarte', 'une pizza', 'un gâteau', 'une tablette de chocolat', 'une quiche', 'une galette']);
    const d = rng.pick([6, 8, 10, 12, 5, 9]);
    const a = rng.int(1, d - 2); const b = rng.int(1, d - 1 - a);
    const [P1, P2] = rng.shuffle(PRENOMS);
    const ils = P1.il === 'elle' && P2.il === 'elle' ? 'elles' : 'ils';
    const mange = rng.next() < 0.5;
    const res = mange ? a + b : d - a - b;
    const cands = [[a + b, d + d], [mange ? d - a - b : a + b, d], [res + 1, d], [res, d + 1], [res - 1, d]];
    const c = qcm(rng, fr(res, d), cands.filter((x) => fracOk(x) && !egales(x, [res, d])).map((x) => fr(...x)));
    if (!c) return null;
    return {
      ...c, difficulte: 2,
      enonce: `${P1.n} mange ${fr(a, d)} d'${obj} et ${P2.n} en mange ${fr(b, d)}. ${mange ? `Quelle fraction ont-${ils} mangée à deux ?` : 'Quelle fraction reste-t-il ?'}`,
      explication: mange ? `${fr(a, d)} + ${fr(b, d)} = ${fr(a + b, d)} : on additionne les numérateurs et on garde le dénominateur.`
        : `${ils === 'elles' ? 'Elles' : 'Ils'} ont mangé ${fr(a, d)} + ${fr(b, d)} = ${fr(a + b, d)}. Le tout vaut ${fr(d, d)} : il reste ${fr(d, d)} − ${fr(a + b, d)} = ${fr(res, d)}.`,
    };
  }),
  forme((rng) => {
    const d = rng.int(3, 12); const a = rng.int(1, d - 1);
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Complète : ${fr(a, d)} + …/${d} = 1`,
      reponse: d - a,
      explication: `1 = ${fr(d, d)}. Il manque ${d} − ${a} = ${d - a} : ${fr(a, d)} + ${fr(d - a, d)} = ${fr(d, d)} = 1.`,
    };
  }),
]);

// ---------------------------------------------------------------------------
// OPÉRATIONS
// ---------------------------------------------------------------------------
// Décimal aléatoire : entier de `chiffres` chiffres significatifs, avec `dec` décimales.
const decimal = (rng, min, max, dec) => rng.int(min * 10 ** dec, max * 10 ** dec) / 10 ** dec;

const calculEcrit = famille([
  forme((rng) => {
    const n = rng.int(2, 3);
    const termes = range(1, n).map(() => decimal(rng, 1, rng.pick([99, 999, 9999]), rng.int(0, 3)));
    if (termes.every((t) => nbDecimales(t) === nbDecimales(termes[0]))) return null;
    const s = r(termes.reduce((a, b) => a + b, 0));
    const dec = Math.max(...termes.map(nbDecimales));
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Effectue le calcul : ${termes.map(fmt).join(' + ')}`,
      reponse: s,
      explication: `On aligne les virgules (on peut compléter avec des 0 : ${termes.map((t) => avecDecimales(Math.round(t * 1000), dec)).join(' ; ')}), puis on additionne rang par rang : ${fmt(s)}.`,
    };
  }, 2),
  forme((rng) => {
    const t = rng.int(0, 2);
    let a; let b;
    if (t === 0) { a = nombreAvecZeros(rng, rng.int(4, 5), 0.5); b = rng.int(Math.floor(a / 10), a - 1); }
    else if (t === 1) { a = rng.int(2, 60); b = decimal(rng, 0.1, a - 0.01, 2); }
    else { a = decimal(rng, 10, 500, 1); b = decimal(rng, 1, a - 1, rng.int(2, 3)); }
    const d = r(a - b);
    if (d <= 0) return null;
    const dec = Math.max(nbDecimales(a), nbDecimales(b));
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Effectue le calcul : ${fmt(a)} − ${fmt(b)}`,
      reponse: d,
      explication: `${dec ? `On aligne les virgules et on complète avec des 0 : ${avecDecimales(Math.round(a * 1000), dec)} − ${avecDecimales(Math.round(b * 1000), dec)}. ` : ''}On soustrait rang par rang, avec les emprunts : ${fmt(d)}. Vérifie : ${fmt(d)} + ${fmt(b)} = ${fmt(a)}.`,
    };
  }, 2),
  forme((rng) => {
    const t = rng.int(0, 2);
    let a; let b;
    if (t === 0) { a = rng.int(102, 999); b = rng.int(12, 99); }
    else if (t === 1) { a = decimal(rng, 1, 99, rng.int(1, 2)); b = rng.int(3, 49); }
    else { a = rng.int(11, 99) * rng.pick([100, 1000]); b = rng.int(3, 9); if (a % 10000 === 0 || (a < 10000 && a % 1000 === 0)) return null; }
    if (b % 10 === 0) return null;
    const p = r(a * b);
    const da = nbDecimales(a);
    return {
      type: 'numerique', difficulte: t === 1 ? 2 : 2,
      enonce: `Effectue le calcul : ${fmt(a)} × ${fmt(b)}`,
      reponse: p,
      explication: da ? `On calcule sans la virgule : ${Math.round(a * 10 ** da)} × ${b} = ${fmt(Math.round(a * 10 ** da) * b)}. Il y a ${da} ${pluriel(da, 'chiffre')} après la virgule dans ${fmt(a)}, donc le résultat est ${fmt(p)}.`
        : t === 2 ? `${fmt(a / (a % 1000 === 0 ? 1000 : 100))} × ${b} = ${fmt(a / (a % 1000 === 0 ? 1000 : 100) * b)}, puis on ajoute les zéros : ${fmt(p)}.`
          : `${fmt(a)} × ${b} = ${fmt(a)} × ${Math.floor(b / 10) * 10} + ${fmt(a)} × ${b % 10} = ${fmt(a * Math.floor(b / 10) * 10)} + ${fmt(a * (b % 10))} = ${fmt(p)}.`,
    };
  }, 2),
  forme((rng) => {
    const t = rng.int(0, 2);
    const d = t === 2 ? rng.pick([12, 15, 25, 11, 21, 24, 32]) : rng.int(2, 9);
    const q = t === 1 ? decimal(rng, 1, 99, rng.int(1, 2)) : rng.int(12, 999);
    const n = r(q * d);
    if (t === 2 && n > 9999) return null;
    return {
      type: 'numerique', difficulte: t === 0 ? 2 : 3,
      enonce: `Effectue le calcul : ${fmt(n)} : ${d}`,
      reponse: q,
      explication: `On pose la division : ${fmt(n)} : ${d} = ${fmt(q)}. Vérifie avec la multiplication : ${fmt(q)} × ${d} = ${fmt(n)}.`,
    };
  }, 2),
]);

const calculMental = famille([
  forme((rng) => {
    const k = rng.pick([10, 100, 1000]);
    const mult = rng.next() < 0.5;
    const x = decimal(rng, 0, 99, rng.int(1, 3));
    if (x === 0) return null;
    const res = r(mult ? x * k : x / k);
    const z = String(k).length - 1;
    return {
      type: 'numerique', difficulte: 1,
      enonce: `Calcule mentalement : ${fmt(x)} ${mult ? '×' : ':'} ${fmt(k)}`,
      reponse: res,
      explication: `${mult ? '×' : ':'} ${fmt(k)} : chaque chiffre prend une valeur ${fmt(k)} fois plus ${mult ? 'grande' : 'petite'} ; la virgule se déplace de ${z} ${pluriel(z, 'rang')} vers la ${mult ? 'droite' : 'gauche'}. ${fmt(x)} ${mult ? '×' : ':'} ${fmt(k)} = ${fmt(res)}.`,
    };
  }, 2),
  forme((rng) => {
    const cas = rng.pick([
      { op: '× 0,1', f: 0.1, astuce: '× 0,1, c\'est la même chose que : 10' },
      { op: '× 0,01', f: 0.01, astuce: '× 0,01, c\'est la même chose que : 100' },
      { op: '× 0,5', f: 0.5, astuce: '× 0,5, c\'est prendre la moitié (: 2)' },
      { op: ': 0,5', f: 2, astuce: ': 0,5, c\'est la même chose que × 2 (il y a 2 moitiés dans 1)' },
      { op: ': 0,1', f: 10, astuce: ': 0,1, c\'est la même chose que × 10' },
      { op: ': 0,25', f: 4, astuce: ': 0,25, c\'est la même chose que × 4 (il y a 4 quarts dans 1)' },
      { op: '× 0,25', f: 0.25, astuce: '× 0,25, c\'est prendre le quart (: 4)' },
    ]);
    const x = rng.pick([rng.int(2, 99) * 2, decimal(rng, 1, 50, 1) * 2, rng.int(12, 400) * 4]);
    const res = r(x * cas.f);
    if (nbDecimales(res) > 3) return null;
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Calcule mentalement : ${fmt(x)} ${cas.op}`,
      reponse: res,
      explication: `${cas.astuce[0].toUpperCase()}${cas.astuce.slice(1)}. ${fmt(x)} ${cas.op} = ${fmt(res)}.`,
    };
  }, 2),
  forme((rng) => {
    const cas = rng.pick([
      { k: 5, e: (n) => `${fmt(n)} × 10 : 2 = ${fmt(n * 10)} : 2`, t: '× 5, c\'est × 10 puis : 2' },
      { k: 25, e: (n) => `${fmt(n)} × 100 : 4 = ${fmt(n * 100)} : 4`, t: '× 25, c\'est × 100 puis : 4' },
      { k: 50, e: (n) => `${fmt(n)} × 100 : 2 = ${fmt(n * 100)} : 2`, t: '× 50, c\'est × 100 puis : 2' },
      { k: 9, e: (n) => `${fmt(n)} × 10 − ${fmt(n)} = ${fmt(n * 10)} − ${fmt(n)}`, t: '× 9, c\'est × 10 moins une fois le nombre' },
      { k: 11, e: (n) => `${fmt(n)} × 10 + ${fmt(n)} = ${fmt(n * 10)} + ${fmt(n)}`, t: '× 11, c\'est × 10 plus une fois le nombre' },
      { k: 99, e: (n) => `${fmt(n)} × 100 − ${fmt(n)} = ${fmt(n * 100)} − ${fmt(n)}`, t: '× 99, c\'est × 100 moins une fois le nombre' },
      { k: 101, e: (n) => `${fmt(n)} × 100 + ${fmt(n)} = ${fmt(n * 100)} + ${fmt(n)}`, t: '× 101, c\'est × 100 plus une fois le nombre' },
    ]);
    const n = rng.int(12, 99) * (cas.k === 25 || cas.k === 50 || cas.k === 5 ? 1 : 1);
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Calcule mentalement : ${fmt(n)} × ${cas.k}`,
      reponse: n * cas.k,
      explication: `Astuce : ${cas.t}. ${cas.e(n)} = ${fmt(n * cas.k)}.`,
    };
  }, 2),
  forme((rng) => {
    const cas = rng.pick([
      () => { const c = rng.pick([100, 1000]); const a = rng.int(1, c - 1); return { a, c }; },
      () => { const a = decimal(rng, 0.01, 0.99, 2); return { a, c: 1 }; },
      () => { const a = decimal(rng, 0.1, 9.9, 1); return { a, c: 10 }; },
      () => { const a = decimal(rng, 1, 99.9, 1); return { a, c: 100 }; },
    ])();
    const res = r(cas.c - cas.a);
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Combien faut-il ajouter à ${fmt(cas.a)} pour obtenir ${fmt(cas.c)} ?`,
      reponse: res,
      explication: `On cherche le complément : ${fmt(cas.c)} − ${fmt(cas.a)} = ${fmt(res)}. Vérifie : ${fmt(cas.a)} + ${fmt(res)} = ${fmt(cas.c)}.`,
    };
  }),
  forme((rng) => {
    const double = rng.next() < 0.5;
    const x = double ? decimal(rng, 1, 500, rng.int(0, 2)) : decimal(rng, 1, 999, rng.int(0, 1)) * 1;
    const res = r(double ? x * 2 : x / 2);
    if (nbDecimales(res) > 3 || x < 1) return null;
    return {
      type: 'numerique', difficulte: 1,
      enonce: `Calcule mentalement ${double ? 'le double' : 'la moitié'} de ${fmt(x)}.`,
      reponse: res,
      explication: `${double ? `Le double, c'est multiplier par 2 : ${fmt(x)} × 2` : `La moitié, c'est diviser par 2 : ${fmt(x)} : 2`} = ${fmt(res)}.`,
    };
  }),
]);

// Transformation d'un facteur pour « Sachant que a × b = p, calcule… »
const FACTEURS = [
  { f: 10, t: 'multiplié par 10' }, { f: 0.1, t: 'divisé par 10' }, { f: 100, t: 'multiplié par 100' },
  { f: 0.01, t: 'divisé par 100' }, { f: 2, t: 'multiplié par 2' }, { f: 1, t: '' },
];
const proprietes = famille([
  forme((rng) => {
    const a = rng.int(12, 48); const b = rng.int(11, 39);
    const p = a * b;
    const ta = rng.pick(FACTEURS); const tb = rng.pick(FACTEURS);
    if (ta.f === 1 && tb.f === 1) return null;
    if ((ta.f === 2 && tb.f !== 1) || (tb.f === 2 && ta.f !== 1)) return null;
    const a2 = r(a * ta.f); const b2 = r(b * tb.f);
    const res = r(p * ta.f * tb.f);
    const k = r(ta.f * tb.f);
    const parts = [ta.f !== 1 ? `le 1er facteur est ${ta.t}` : '', tb.f !== 1 ? `le 2e facteur est ${tb.t}` : ''].filter(Boolean);
    const effet = k === 1 ? 'le produit ne change pas' : k > 1 ? `le produit est multiplié par ${fmt(k)}` : `le produit est divisé par ${fmt(r(1 / k))}`;
    return {
      type: 'numerique', difficulte: 3,
      enonce: `Sachant que ${a} × ${b} = ${fmt(p)}, calcule : ${fmt(a2)} × ${fmt(b2)}`,
      reponse: res,
      explication: `${parts.join(' et ')[0].toUpperCase()}${parts.join(' et ').slice(1)} : ${effet}. ${fmt(a2)} × ${fmt(b2)} = ${fmt(res)}.`,
    };
  }, 2),
  forme((rng) => {
    const t = rng.int(0, 2);
    if (t === 0) {
      const a = rng.int(120, 900); const b = rng.pick([18, 19, 28, 29, 38, 39, 48, 49, 97, 98, 99]);
      const rond = Math.ceil(b / 10) * 10; const ecart = rond - b;
      return {
        type: 'numerique', difficulte: 2,
        enonce: `Complète : ${fmt(a)} + ${b} = … + ${rond}`,
        reponse: a - ecart,
        explication: `On a ajouté ${ecart} à ${b} pour obtenir ${rond} : il faut enlever ${ecart} à l'autre terme pour garder la même somme. ${fmt(a)} − ${ecart} = ${fmt(a - ecart)}.`,
      };
    }
    if (t === 1) {
      const a = rng.int(120, 900); const b = rng.pick([18, 19, 28, 29, 38, 39, 47, 48, 49, 97, 98, 99]);
      const rond = Math.ceil(b / 10) * 10; const ecart = rond - b;
      return {
        type: 'numerique', difficulte: 3,
        enonce: `Complète : ${fmt(a)} − ${b} = … − ${rond}`,
        reponse: a + ecart,
        explication: `Dans une soustraction, on peut ajouter le même nombre aux deux termes : ${b} + ${ecart} = ${rond}, donc ${fmt(a)} + ${ecart} = ${fmt(a + ecart)}. La différence ne change pas.`,
      };
    }
    const y = rng.int(11, 39); const z = rng.int(1, 9) * 10 - y + rng.int(1, 4) * 10;
    if (z <= 0) return null;
    const x = rng.int(12, 89);
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Complète : (${x} + ${y}) + ${z} = … + ${y + z}`,
      reponse: x,
      explication: `On peut regrouper les termes autrement : (${x} + ${y}) + ${z} = ${x} + (${y} + ${z}) = ${x} + ${y + z}.`,
    };
  }, 2),
  forme((rng) => {
    const n = rng.int(6, 48);
    const cas = rng.pick([
      { k: 99, bon: [`${n} × 100 − ${n}`, n * 99], f: [[`${n} × 100 − 1`, n * 100 - 1], [`${n} × 90 + 9`, n * 90 + 9], [`${n} × 100 + ${n}`, n * 101]] },
      { k: 101, bon: [`${n} × 100 + ${n}`, n * 101], f: [[`${n} × 100 + 1`, n * 100 + 1], [`${n} × 10 + ${n}`, n * 11], [`${n} × 100 − ${n}`, n * 99]] },
      { k: 98, bon: [`${n} × 100 − ${n} × 2`, n * 98], f: [[`${n} × 100 − 2`, n * 100 - 2], [`${n} × 90 + 8`, n * 90 + 8], [`${n} × 100 + ${n} × 2`, n * 102]] },
      { k: 21, bon: [`${n} × 20 + ${n}`, n * 21], f: [[`${n} × 20 + 1`, n * 20 + 1], [`${n} × 2 + ${n}`, n * 3], [`${n} × 20 − ${n}`, n * 19]] },
      { k: 5, bon: [`${n} × 10 : 2`, n * 5], f: [[`${n} × 10 − 5`, n * 10 - 5], [`${n} × 2 + 3`, n * 2 + 3], [`${n} : 2 × 5 + 5`, n / 2 * 5 + 5]] },
      { k: 25, bon: [`${n} × 100 : 4`, n * 25], f: [[`${n} × 100 − 75`, n * 100 - 75], [`${n} × 20 + 5`, n * 20 + 5], [`${n} × 4 : 100`, n * 4 / 100]] },
      { k: 12, bon: [`${n} × 10 + ${n} × 2`, n * 12], f: [[`${n} × 10 + 2`, n * 10 + 2], [`${n} × 10 × 2`, n * 20], [`${n} + 10 × 2`, n + 20]] },
      { k: 19, bon: [`${n} × 20 − ${n}`, n * 19], f: [[`${n} × 20 − 1`, n * 20 - 1], [`${n} × 10 + 9`, n * 10 + 9], [`${n} × 20 + ${n}`, n * 21]] },
    ]);
    const fausses = cas.f.filter(([, v]) => Math.abs(v - cas.bon[1]) > 1e-9).map(([t]) => t);
    const c = qcm(rng, cas.bon[0], fausses);
    if (!c) return null;
    return {
      ...c, difficulte: 3,
      enonce: `Quel calcul donne le même résultat que ${n} × ${cas.k} ?`,
      explication: `${n} × ${cas.k} = ${fmt(cas.bon[1])}. On décompose ${cas.k} pour calculer facilement : ${cas.bon[0]} = ${fmt(cas.bon[1])}.`,
    };
  }, 2),
  forme((rng) => {
    const a = rng.int(12, 60); let b = rng.int(3, 11); if (b === a) b++;
    const c = 2;
    const B = b * 2; const A = B * rng.int(2, 6);
    const cas = rng.pick([
      { t: `${a} × ${b} = ${b} × ${a}`, v: true, e: 'La multiplication est commutative : on peut échanger les facteurs.' },
      { t: `${a} + ${b} = ${b} + ${a}`, v: true, e: 'L\'addition est commutative : on peut échanger les termes.' },
      { t: `${a} − ${b} = ${b} − ${a}`, v: false, e: `On ne peut pas échanger les termes d'une soustraction : ${a} − ${b} = ${a - b}, ce n'est pas la même chose que ${b} − ${a}.` },
      { t: `${A} : ${B} = ${B} : ${A}`, v: false, e: `On ne peut pas échanger les termes d'une division : ${A} : ${B} = ${A / B}, alors que ${B} : ${A} est plus petit que 1.` },
      { t: `(${a} + ${b}) + ${c} = ${a} + (${b} + ${c})`, v: true, e: 'Dans une addition, on peut regrouper les termes comme on veut (associativité).' },
      { t: `(${a} × ${b}) × ${c} = ${a} × (${b} × ${c})`, v: true, e: 'Dans une multiplication, on peut regrouper les facteurs comme on veut (associativité).' },
      { t: `(${a} − ${b}) − ${c} = ${a} − (${b} − ${c})`, v: false, e: `(${a} − ${b}) − ${c} = ${a - b - c}, mais ${a} − (${b} − ${c}) = ${a - b + c}. Les parenthèses changent le résultat d'une soustraction.` },
      { t: `(${A} : ${B}) : ${c} = ${A} : (${B} : ${c})`, v: false, e: `(${A} : ${B}) : ${c} = ${fmt(A / B / c)}, mais ${A} : (${B} : ${c}) = ${fmt(A / (B / c))}. Les parenthèses changent le résultat d'une division.` },
      { t: `${a} × (${b} + ${c}) = ${a} × ${b} + ${a} × ${c}`, v: true, e: `C'est la distributivité : ${a} × ${b + c} = ${a * b} + ${a * c} = ${a * (b + c)}.` },
      { t: `${a} × (${b} + ${c}) = ${a} × ${b} + ${c}`, v: false, e: `Il faut multiplier les deux termes par ${a} : ${a} × (${b} + ${c}) = ${a} × ${b} + ${a} × ${c} = ${a * (b + c)}.` },
      { t: `${a} × (${b} − ${c}) = ${a} × ${b} − ${a} × ${c}`, v: true, e: `C'est la distributivité : ${a} × ${b - c} = ${a * b} − ${a * c} = ${a * (b - c)}.` },
    ]);
    if (a - b - c < 0) return null;
    return {
      type: 'vrai_faux', difficulte: 2,
      enonce: `Vrai ou faux ? ${cas.t}`,
      reponse: cas.v,
      explication: cas.e,
    };
  }),
]);

// Arrondi à 2 chiffres significatifs (pour les estimations).
const deuxChiffres = (x) => { const p = 10 ** Math.max(0, Math.floor(Math.log10(Math.abs(x))) - 1); return Math.round(x / p) * p; };
const unChiffre = (x) => { const p = 10 ** Math.max(0, Math.floor(Math.log10(Math.abs(x)))); return Math.round(x / p) * p; };
const arrondiSimple = (x) => (x < 100 ? Math.round(x / 10) * 10 : deuxChiffres(x));
const estimation = famille([
  forme((rng) => {
    const op = rng.pick(['+', '−', '×', ':']);
    let a; let b; let e; let ra; let rb; let est;
    if (op === '+') { a = rng.int(1000, 90000); b = rng.int(1000, 60000); e = a + b; ra = deuxChiffres(a); rb = deuxChiffres(b); est = ra + rb; }
    else if (op === '−') { a = rng.int(10000, 90000); b = rng.int(1000, a - 5000); e = a - b; ra = deuxChiffres(a); rb = deuxChiffres(b); est = ra - rb; }
    else if (op === '×') {
      a = rng.int(21, 990); b = rng.int(16, 99);
      if ([4, 5, 6].includes(b % 10) || (a < 100 && [4, 5, 6].includes(a % 10))) return null;
      e = a * b; ra = arrondiSimple(a); rb = arrondiSimple(b); est = ra * rb;
    } else {
      b = rng.int(3, 9); const q = rng.int(21, 900); a = b * q + rng.int(1, b - 1); e = a / b; rb = b;
      const pw = 10 ** Math.max(0, Math.floor(Math.log10(q)) - 1);
      ra = Math.round(a / (b * pw)) * b * pw; est = ra / rb;
    }
    if (e <= 0 || est <= 0 || (ra === a && rb === b)) return null;
    const bon = deuxChiffres(e);
    const lead = 10 ** Math.floor(Math.log10(bon));
    const fausses = [bon * 10, bon / 10, bon * 100, ...(op === '+' || op === '−' ? [bon + 3 * lead, bon - 3 * lead] : [])]
      .filter((x) => x >= 1 && Math.abs(x - e) > Math.abs(bon - e) * 2 + lead / 2);
    const c = qcm(rng, fmt(bon), fausses.map(fmt));
    if (!c) return null;
    return {
      ...c, difficulte: 2,
      enonce: `Quelle est l'estimation la plus proche du résultat de ${fmt(a)} ${op} ${fmt(b)} ?`,
      explication: `On arrondit : ${ra === a ? '' : `${fmt(a)} ≈ ${fmt(ra)}`}${ra !== a && rb !== b ? ' et ' : ''}${rb === b ? '' : `${fmt(b)} ≈ ${fmt(rb)}`}. ${fmt(ra)} ${op} ${fmt(rb)} = ${fmt(est)}. La proposition la plus proche est ${fmt(bon)}.`,
    };
  }, 2),
  forme((rng) => {
    const a = decimal(rng, 2, 99, 1); const b = decimal(rng, 1.1, 9.9, 1);
    const p = r(a * b);
    const ea = Math.round(a); const eb = Math.round(b);
    const c = qcm(rng, fmt(p), [fmt(r(p / 10)), fmt(r(p * 10)), fmt(r(p / 100)), fmt(r(p * 100))]);
    if (!c || ea * eb === 0) return null;
    return {
      ...c, difficulte: 3,
      enonce: `Sans poser le calcul, trouve le bon résultat de ${fmt(a)} × ${fmt(b)}.`,
      explication: `Ordre de grandeur : ${fmt(a)} ≈ ${ea} et ${fmt(b)} ≈ ${eb}, donc le résultat est proche de ${ea} × ${eb} = ${fmt(ea * eb)}. Seul ${fmt(p)} convient.`,
    };
  }),
  forme((rng) => {
    const t = rng.int(0, 2);
    if (t === 0) {
      const a = rng.int(101, 999); const b = rng.int(101, 999);
      if (a % 100 === 50 || b % 100 === 50) return null;
      const ra = Math.round(a / 100) * 100; const rb = Math.round(b / 100) * 100;
      return {
        type: 'numerique', difficulte: 2,
        enonce: `Arrondis chaque terme à la centaine, puis calcule une estimation de ${a} + ${b}.`,
        reponse: ra + rb,
        explication: `${a} ≈ ${ra} et ${b} ≈ ${rb}. ${fmt(ra)} + ${fmt(rb)} = ${fmt(ra + rb)}.`,
      };
    }
    const a = rng.int(11, 99); const b = rng.int(11, 99);
    if (a % 10 === 5 || b % 10 === 5) return null;
    const ra = Math.round(a / 10) * 10; const rb = Math.round(b / 10) * 10;
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Arrondis chaque facteur à la dizaine, puis calcule une estimation de ${a} × ${b}.`,
      reponse: ra * rb,
      explication: `${a} ≈ ${ra} et ${b} ≈ ${rb}. ${ra} × ${rb} = ${fmt(ra * rb)}.`,
    };
  }),
]);

const OPS = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, ':': (a, b) => a / b };
const termeManquant = famille([
  forme((rng) => {
    const t = rng.int(0, 7);
    const a = rng.int(12, 999); const b = rng.int(12, 999);
    const x = rng.int(3, 12); const y = rng.int(12, 99);
    const cas = [
      { e: `… + ${fmt(b)} = ${fmt(a + b)}`, r: a, x: `${fmt(a + b)} − ${fmt(b)} = ${fmt(a)}` },
      { e: `${fmt(a)} + … = ${fmt(a + b)}`, r: b, x: `${fmt(a + b)} − ${fmt(a)} = ${fmt(b)}` },
      { e: `${fmt(a + b)} − … = ${fmt(a)}`, r: b, x: `${fmt(a + b)} − ${fmt(a)} = ${fmt(b)}` },
      { e: `… − ${fmt(b)} = ${fmt(a)}`, r: a + b, x: `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}` },
      { e: `${x} × … = ${fmt(x * y)}`, r: y, x: `${fmt(x * y)} : ${x} = ${y}` },
      { e: `… × ${x} = ${fmt(x * y)}`, r: y, x: `${fmt(x * y)} : ${x} = ${y}` },
      { e: `${fmt(x * y)} : … = ${y}`, r: x, x: `${fmt(x * y)} : ${y} = ${x}` },
      { e: `… : ${x} = ${y}`, r: x * y, x: `${y} × ${x} = ${fmt(x * y)}` },
    ][t];
    return {
      type: 'numerique', difficulte: t === 2 || t >= 6 ? 2 : 1,
      enonce: `Complète : ${cas.e}`,
      reponse: cas.r,
      explication: `On utilise l'opération inverse : ${cas.x}.`,
    };
  }, 2),
  forme((rng) => {
    const a = decimal(rng, 0.1, 20, rng.int(1, 2)); const cible = rng.pick([1, 5, 10, 20, 25, 50]);
    if (a >= cible) return null;
    const res = r(cible - a);
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Complète : ${fmt(a)} + … = ${cible}`,
      reponse: res,
      explication: `On calcule la différence : ${cible} − ${fmt(a)} = ${fmt(res)}.`,
    };
  }),
  forme((rng) => {
    const op = rng.pick(Object.keys(OPS));
    let a = rng.int(2, 99); let b = rng.int(2, 12);
    if (op === ':') a = b * rng.int(2, 12);
    if (op === '−' && a <= b) a += b + rng.int(1, 20);
    const res = OPS[op](a, b);
    const bons = Object.keys(OPS).filter((o) => OPS[o](a, b) === res);
    if (bons.length !== 1) return null;
    const choix = ['+', '−', '×', ':'];
    return {
      type: 'qcm', choix, reponse: choix.indexOf(op), difficulte: 1,
      enonce: `Quel signe faut-il placer à la place des points ? ${fmt(a)} … ${b} = ${fmt(res)}`,
      explication: `${fmt(a)} ${op} ${b} = ${fmt(res)}. ${res > a ? 'Le résultat est plus grand que le premier nombre' : 'Le résultat est plus petit que le premier nombre'} : ${op === '+' || op === '×' ? "c'est une addition ou une multiplication" : "c'est une soustraction ou une division"}.`,
    };
  }),
  forme((rng) => {
    const P = rng.pick(PRENOMS);
    const cas = rng.pick([
      () => { const n = rng.int(12, 80); const k = rng.pick([6, 12, 24]); return { e: `Un livreur transporte ${n} casiers de ${k} bouteilles. Quel calcul permet de trouver le nombre de bouteilles ?`, bon: `${n} × ${k}`, f: [`${n} + ${k}`, `${n} : ${k}`, `${n} − ${k}`] }; },
      () => { const b = rng.int(15, 40); const a = rng.int(3, 9); return { e: `Au basket, ${P.n} a marqué ${a} points de moins que ${P.il === 'elle' ? 'sa coéquipière' : 'son coéquipier'}, qui en a marqué ${b}. Quel calcul donne le nombre de points ${/^[AEIOUÉH]/.test(P.n) ? "d'" : 'de '}${P.n} ?`, bon: `${b} − ${a}`, f: [`${b} + ${a}`, `${b} × ${a}`, `${b} : ${a}`] }; },
      () => { const k = rng.int(3, 8); const n = k * rng.int(6, 25); return { e: `${n} billes sont partagées équitablement entre ${k} enfants. Quel calcul donne le nombre de billes par enfant ?`, bon: `${n} : ${k}`, f: [`${n} × ${k}`, `${n} − ${k}`, `${n} + ${k}`] }; },
      () => { const n = rng.int(120, 400); const k = rng.int(20, n - 20); return { e: `Un livre a ${n} pages. ${P.n} en a déjà lu ${k}. Quel calcul donne le nombre de pages qui restent à lire ?`, bon: `${n} − ${k}`, f: [`${n} + ${k}`, `${k} − ${n}`, `${n} : ${k}`] }; },
      () => { const n = rng.int(2, 9); const p = decimal(rng, 1.5, 9.5, 1); const s = rng.int(8, 30); return { e: `${P.n} achète ${n} cahiers à ${eur(p)} pièce et un sac à ${s} €. Quel calcul donne le prix total ?`, bon: `(${n} × ${fmt(p)}) + ${s}`, f: [`${n} × (${fmt(p)} + ${s})`, `${n} + ${fmt(p)} + ${s}`, `(${n} + ${fmt(p)}) × ${s}`] }; },
      () => { const k = rng.pick([4, 5, 6, 8]); const g = rng.int(40, 120); const f = k * rng.int(Math.ceil((g + 40) / k), Math.floor((g + 120) / k)) - g; return { e: `Une école compte ${g} garçons et ${f} filles, répartis en ${k} groupes égaux. Quel calcul donne le nombre d'élèves par groupe ?`, bon: `(${g} + ${f}) : ${k}`, f: [`${g} + (${f} : ${k})`, `(${g} + ${f}) × ${k}`, `(${g} − ${f}) : ${k}`] }; },
      () => { const t = rng.int(100, 300); const d = rng.int(20, 90); return { e: `Un train transporte ${t} voyageurs. À la gare, ${d} personnes descendent et ${d + rng.int(5, 30)} montent. Quel calcul donne le nombre de voyageurs dans le train ?`, bon: null, t, d }; },
    ])();
    if (!cas.bon) {
      const m = Number(cas.e.match(/ et (\d+) montent/)[1]);
      cas.bon = `${cas.t} − ${cas.d} + ${m}`;
      cas.f = [`${cas.t} + ${cas.d} − ${m}`, `${cas.t} − ${cas.d} − ${m}`, `${cas.t} + ${cas.d} + ${m}`];
    }
    const c = qcm(rng, cas.bon, cas.f);
    if (!c) return null;
    return {
      ...c, difficulte: 2,
      enonce: cas.e,
      explication: `Le bon calcul est ${cas.bon}. Demande-toi à chaque fois : faut-il réunir, enlever, répéter ou partager ?`,
    };
  }, 2),
]);

const priorites = famille([
  forme((rng) => {
    const a = rng.int(2, 12); const b = rng.int(2, 12); const c = rng.int(2, 9); const d = rng.int(2, 9);
    const t = rng.int(0, 6);
    const cas = [
      [`${a * c + rng.int(0, 0)} − (${b * c} : ${c})`, a * c - b, `${b * c} : ${c} = ${b}, puis ${a * c} − ${b} = ${a * c - b}`],
      [`(${a} + ${b}) × ${c}`, (a + b) * c, `${a} + ${b} = ${a + b}, puis ${a + b} × ${c} = ${(a + b) * c}`],
      [`${a + c + 5} × (${b + c} − ${b})`, (a + c + 5) * c, `${b + c} − ${b} = ${c}, puis ${a + c + 5} × ${c} = ${(a + c + 5) * c}`],
      [`(${a} × ${b}) + (${c} × ${d})`, a * b + c * d, `${a} × ${b} = ${a * b} et ${c} × ${d} = ${c * d}, puis ${a * b} + ${c * d} = ${a * b + c * d}`],
      [`(${a * c} + ${b * c}) : ${c}`, a + b, `${a * c} + ${b * c} = ${(a + b) * c}, puis ${(a + b) * c} : ${c} = ${a + b}`],
      [`${100 + a * 10} − (${b * 5} + ${c * 3})`, 100 + a * 10 - b * 5 - c * 3, `${b * 5} + ${c * 3} = ${b * 5 + c * 3}, puis ${100 + a * 10} − ${b * 5 + c * 3} = ${100 + a * 10 - b * 5 - c * 3}`],
      [`(${a + 10} − ${b}) × (${c} + ${d})`, (a + 10 - b) * (c + d), `${a + 10} − ${b} = ${a + 10 - b} et ${c} + ${d} = ${c + d}, puis ${a + 10 - b} × ${c + d} = ${(a + 10 - b) * (c + d)}`],
    ][t];
    if (cas[1] < 0) return null;
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Effectue le calcul : ${cas[0]}`,
      reponse: cas[1],
      explication: `On calcule d'abord ce qui est entre parenthèses : ${cas[2]}.`,
    };
  }, 2),
  forme((rng) => {
    const a = rng.int(2, 30); const b = rng.int(2, 9); const c = rng.int(2, 9); const d = rng.int(2, 9);
    const t = rng.int(0, 3);
    const cas = [
      [`${a} + ${b} × ${c}`, a + b * c, `${b} × ${c} = ${b * c}, puis ${a} + ${b * c} = ${a + b * c}`, (a + b) * c],
      [`${a + b * c} − ${b} × ${c}`, a, `${b} × ${c} = ${b * c}, puis ${a + b * c} − ${b * c} = ${a}`, (a + b * c - b) * c],
      [`${a} × ${b} + ${c} × ${d}`, a * b + c * d, `${a} × ${b} = ${a * b} et ${c} × ${d} = ${c * d}, puis ${a * b} + ${c * d} = ${a * b + c * d}`, (a * b + c) * d],
      [`${a} + ${b * c} : ${c}`, a + b, `${b * c} : ${c} = ${b}, puis ${a} + ${b} = ${a + b}`, (a + b * c) / c],
    ][t];
    return {
      type: 'numerique', difficulte: 3,
      enonce: `Effectue le calcul (attention aux priorités) : ${cas[0]}`,
      reponse: cas[1],
      explication: `Sans parenthèses, on fait d'abord les multiplications et les divisions, puis les additions et les soustractions : ${cas[2]}.`,
    };
  }),
  forme((rng) => {
    const a = rng.int(2, 15); const b = rng.int(2, 9); const c = rng.int(2, 9);
    const exprs = [
      [`(${a} + ${b}) × ${c}`, (a + b) * c], [`${a} + (${b} × ${c})`, a + b * c],
      [`(${a} × ${b}) + ${c}`, a * b + c], [`${a} × (${b} + ${c})`, a * (b + c)],
    ];
    const bon = rng.pick(exprs);
    if (exprs.filter((e) => e[1] === bon[1]).length > 1) return null;
    const c2 = qcm(rng, bon[0], exprs.filter((e) => e !== bon).map((e) => e[0]));
    if (!c2) return null;
    return {
      ...c2, difficulte: 2,
      enonce: `Quel calcul donne ${bon[1]} ?`,
      explication: `${exprs.map((e) => `${e[0]} = ${e[1]}`).join(' ; ')}. Les parenthèses indiquent ce qu'on calcule en premier.`,
    };
  }),
]);

// Multiples, diviseurs, nombres premiers, PPCM / PGCD
const diviseursDe = (n) => range(1, n).filter((d) => n % d === 0);
const estPremier = (n) => n > 1 && diviseursDe(n).length === 2;
const multiplesDiviseurs = famille([
  forme((rng) => {
    const k = rng.int(3, 12);
    const bon = k * rng.int(3, 15);
    const fausses = dedoublonner(range(1, 12).map(() => bon + rng.pick([1, 2, -1, -2, k + 1, k - 1, 10]))).filter((x) => x > 0 && x % k !== 0);
    const c = qcm(rng, fmt(bon), fausses.map(fmt));
    if (!c) return null;
    return {
      ...c, difficulte: 1,
      enonce: `Lequel de ces nombres est un multiple de ${k} ?`,
      explication: `${bon} = ${k} × ${bon / k} : il est dans la table de ${k}. Les autres nombres ne le sont pas.`,
    };
  }, 2),
  forme((rng) => {
    const n = rng.pick([12, 18, 20, 24, 30, 36, 40, 42, 45, 48, 50, 54, 56, 60, 63, 64, 72, 75, 80, 84, 90, 96, 100]);
    const div = diviseursDe(n).filter((d) => d > 1 && d < n);
    const non = range(2, 25).filter((d) => n % d !== 0);
    const bon = rng.pick(div);
    const c = qcm(rng, String(bon), rng.shuffle(non).map(String));
    if (!c) return null;
    return {
      ...c, difficulte: 2,
      enonce: `Lequel de ces nombres est un diviseur de ${n} ?`,
      explication: `${n} : ${bon} = ${n / bon}, sans reste : ${bon} est un diviseur de ${n}. Les diviseurs de ${n} sont ${enumerer(diviseursDe(n).map(String))}.`,
    };
  }, 2),
  forme((rng) => {
    const n = rng.int(6, 60);
    const d = diviseursDe(n);
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Combien le nombre ${n} a-t-il de diviseurs ?`,
      reponse: d.length,
      explication: `Les diviseurs de ${n} sont ${enumerer(d.map(String))} : il y en a ${d.length}. N'oublie pas 1 et ${n} lui-même.`,
    };
  }),
  forme((rng) => {
    const premiers = range(11, 97).filter(estPremier);
    const pieges = [21, 27, 33, 39, 49, 51, 57, 63, 69, 77, 81, 87, 91, 93, 15, 25, 35, 45, 55, 65, 85, 95, 9];
    const bon = rng.pick(premiers);
    const fausses = rng.shuffle(pieges).slice(0, 3);
    const c = qcm(rng, String(bon), fausses.map(String));
    const exemple = fausses.map((x) => { const d = diviseursDe(x)[1]; return `${x} = ${d} × ${x / d}`; });
    return {
      ...c, difficulte: 3,
      enonce: 'Lequel de ces nombres est un nombre premier ?',
      explication: `Un nombre premier a exactement 2 diviseurs : 1 et lui-même. ${bon} n'a pas d'autre diviseur, alors que ${enumerer(exemple)}.`,
    };
  }),
  forme((rng) => {
    const n = rng.int(2, 60);
    const vrai = estPremier(n);
    return {
      type: 'vrai_faux', difficulte: 2,
      enonce: `Vrai ou faux ? ${n} est un nombre premier.`,
      reponse: vrai,
      explication: vrai ? `${n} n'a que 2 diviseurs, 1 et ${n} : il est premier.`
        : `${n} a ${diviseursDe(n).length} diviseurs (${enumerer(diviseursDe(n).map(String))}) : il n'est pas premier.`,
    };
  }),
]);

const ppcmPgcd = famille([
  forme((rng) => {
    const [a, b] = rng.pick([[4, 6], [6, 8], [6, 9], [8, 12], [10, 15], [12, 18], [4, 10], [6, 10], [9, 12], [12, 15], [8, 10], [15, 20], [10, 12], [6, 15], [4, 14], [20, 30], [12, 20], [3, 8], [5, 6], [4, 9]]);
    const ctx = rng.pick([
      { e: (x, y) => `Deux phares s'allument en même temps. Le premier s'allume toutes les ${x} secondes, le second toutes les ${y} secondes. Après combien de secondes s'allumeront-ils de nouveau ensemble ?`, u: 's' },
      { e: (x, y) => `Deux bus partent ensemble de la gare à 8 h. L'un repart toutes les ${x} minutes, l'autre toutes les ${y} minutes. Après combien de minutes repartiront-ils de nouveau ensemble ?`, u: 'min' },
      { e: (x, y, P, Q) => { const f = P.il === 'elle' && Q.il === 'elle'; return `${P.n} va à la piscine tous les ${x} jours et ${Q.n} tous les ${y} jours. ${f ? 'Elles y sont allées' : 'Ils y sont allés'} ensemble aujourd'hui. Dans combien de jours s'y retrouveront-${f ? 'elles' : 'ils'} ensemble ?`; }, u: 'jours' },
      { e: (x, y) => `On construit une tour avec des cubes de ${x} cm de haut et une autre avec des cubes de ${y} cm de haut. Quelle est la plus petite hauteur (autre que 0) que les deux tours peuvent avoir en même temps ?`, u: 'cm' },
    ]);
    const [P, Q] = rng.shuffle(PRENOMS);
    const m = ppcm(a, b);
    const [x, y] = rng.next() < 0.5 ? [a, b] : [b, a];
    return {
      type: 'numerique', unite: ctx.u, difficulte: 3,
      enonce: ctx.e(x, y, P, Q),
      reponse: m,
      explication: `On cherche le plus petit multiple commun de ${x} et ${y}. Multiples de ${x} : ${range(1, m / x).map((i) => i * x).join(', ')}… Multiples de ${y} : ${range(1, m / y).map((i) => i * y).join(', ')}… Le premier commun est ${m}.`,
    };
  }, 2),
  forme((rng) => {
    const g = rng.pick([2, 3, 4, 5, 6, 8, 9, 10, 12]);
    let p; let q;
    for (let i = 0; i < 20; i++) { p = rng.int(2, 7); q = rng.int(2, 7); if (p !== q && pgcd(p, q) === 1) break; }
    if (pgcd(p, q) !== 1 || p === q) return null;
    const a = g * p; const b = g * q;
    const ctx = rng.pick([
      { e: `Une fleuriste a ${a} roses et ${b} tulipes. Elle veut faire des bouquets tous identiques en utilisant toutes les fleurs. Combien de bouquets peut-elle faire au maximum ?`, u: 'bouquets', g: 'Chaque bouquet', x: 'roses', y: 'tulipes' },
      { e: `Pour une fête, on a ${a} croissants et ${b} pains au chocolat. On prépare des plateaux identiques, sans reste. Combien de plateaux au maximum ?`, u: 'plateaux', g: 'Chaque plateau', x: 'croissants', y: 'pains au chocolat' },
      { e: `Un professeur a ${a} crayons rouges et ${b} crayons bleus. Il fait des pots identiques avec tous les crayons. Combien de pots au maximum ?`, u: 'pots', g: 'Chaque pot', x: 'crayons rouges', y: 'crayons bleus' },
      { e: `On veut répartir ${a} filles et ${b} garçons en équipes identiques (même nombre de filles et même nombre de garçons dans chaque équipe), sans reste. Combien d'équipes au maximum ?`, u: 'équipes', g: 'Chaque équipe', x: 'filles', y: 'garçons' },
      { e: `Un magasin a ${a} billes rouges et ${b} billes vertes. Il fait des sachets identiques avec toutes les billes. Combien de sachets au maximum ?`, u: 'sachets', g: 'Chaque sachet', x: 'billes rouges', y: 'billes vertes' },
    ]);
    return {
      type: 'numerique', unite: ctx.u, difficulte: 3,
      enonce: ctx.e,
      reponse: g,
      explication: `On cherche le plus grand diviseur commun de ${a} et ${b}. Diviseurs de ${a} : ${diviseursDe(a).join(', ')}. Diviseurs de ${b} : ${diviseursDe(b).join(', ')}. Le plus grand commun est ${g}. ${ctx.g} contient ${p} ${ctx.x} et ${q} ${ctx.y}.`,
    };
  }, 2),
  forme((rng) => {
    const plusPetitMultiple = rng.next() < 0.5;
    if (plusPetitMultiple) {
      const [a, b] = rng.pick([[4, 6], [6, 8], [6, 9], [8, 12], [10, 15], [3, 4], [4, 10], [6, 10], [9, 12], [5, 8], [3, 7], [12, 16]]);
      const m = ppcm(a, b);
      return {
        type: 'numerique', difficulte: 2,
        enonce: `Quel est le plus petit multiple commun à ${a} et à ${b} (autre que 0) ?`,
        reponse: m,
        explication: `Multiples de ${b} : ${range(1, m / b).map((i) => i * b).join(', ')}… Le premier qui est aussi dans la table de ${a} est ${m}.`,
      };
    }
    const [a, b] = rng.pick([[12, 18], [16, 24], [15, 25], [20, 30], [24, 36], [18, 27], [14, 21], [30, 45], [28, 42], [36, 48], [40, 60], [12, 20]]);
    const g = pgcd(a, b);
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Quel est le plus grand diviseur commun à ${a} et à ${b} ?`,
      reponse: g,
      explication: `Diviseurs de ${a} : ${diviseursDe(a).join(', ')}. Diviseurs de ${b} : ${diviseursDe(b).join(', ')}. Le plus grand commun est ${g}.`,
    };
  }),
]);

const REGLES_DIV = {
  2: { r: 'un nombre est divisible par 2 si son chiffre des unités est pair (0, 2, 4, 6, 8)', test: (n) => `son chiffre des unités est ${n % 10}` },
  3: { r: 'un nombre est divisible par 3 si la somme de ses chiffres est divisible par 3', test: (n) => `la somme de ses chiffres vaut ${String(n).split('').join(' + ')} = ${String(n).split('').reduce((s, c) => s + +c, 0)}` },
  4: { r: 'un nombre est divisible par 4 si le nombre formé par ses deux derniers chiffres est divisible par 4', test: (n) => `ses deux derniers chiffres forment ${String(n % 100).padStart(2, '0')}` },
  5: { r: 'un nombre est divisible par 5 s\'il se termine par 0 ou 5', test: (n) => `il se termine par ${n % 10}` },
  9: { r: 'un nombre est divisible par 9 si la somme de ses chiffres est divisible par 9', test: (n) => `la somme de ses chiffres vaut ${String(n).split('').join(' + ')} = ${String(n).split('').reduce((s, c) => s + +c, 0)}` },
  10: { r: 'un nombre est divisible par 10 s\'il se termine par 0', test: (n) => `il se termine par ${n % 10}` },
  25: { r: 'un nombre est divisible par 25 s\'il se termine par 00, 25, 50 ou 75', test: (n) => `il se termine par ${String(n % 100).padStart(2, '0')}` },
};
const divisibilite = famille([
  forme((rng) => {
    const k = Number(rng.pick(Object.keys(REGLES_DIV)));
    const vrai = rng.next() < 0.5;
    let n;
    for (let i = 0; i < 50; i++) { n = rng.int(100, 9999); if ((n % k === 0) === vrai) break; }
    if ((n % k === 0) !== vrai) return null;
    return {
      type: 'vrai_faux', difficulte: 2,
      enonce: `Vrai ou faux ? ${fmt(n)} est divisible par ${k}.`,
      reponse: vrai,
      explication: `Règle : ${REGLES_DIV[k].r}. Pour ${fmt(n)}, ${REGLES_DIV[k].test(n)} : ${vrai ? `il est donc divisible par ${k}` : `il n'est donc pas divisible par ${k}`}.`,
    };
  }, 2),
  forme((rng) => {
    const k = Number(rng.pick(Object.keys(REGLES_DIV)));
    const bons = []; const faux = [];
    for (let i = 0; i < 200 && (bons.length < 1 || faux.length < 3); i++) {
      const n = rng.int(100, 9999);
      if (n % k === 0) bons.push(n); else if (n % 10 !== 0 || k !== 10) faux.push(n);
    }
    if (!bons.length || faux.length < 3) return null;
    // Distracteurs « presque » : même début, dernier chiffre modifié.
    const c = qcm(rng, fmt(bons[0]), faux.map(fmt));
    if (!c) return null;
    return {
      ...c, difficulte: 2,
      enonce: `Lequel de ces nombres est divisible par ${k} ?`,
      explication: `Règle : ${REGLES_DIV[k].r}. Pour ${fmt(bons[0])}, ${REGLES_DIV[k].test(bons[0])}.`,
    };
  }, 2),
  forme((rng) => {
    const n = rng.int(100, 9999);
    const ks = Object.keys(REGLES_DIV).map(Number);
    const oui = ks.filter((k) => n % k === 0); const non = ks.filter((k) => n % k !== 0);
    if (!oui.length || non.length < 3) return null;
    const bon = rng.pick(oui);
    const c = qcm(rng, String(bon), non.map(String));
    return {
      ...c, difficulte: 3,
      enonce: `Par quel nombre ${fmt(n)} est-il divisible ?`,
      explication: `Règle : ${REGLES_DIV[bon].r}. Pour ${fmt(n)}, ${REGLES_DIV[bon].test(n)}. Il n'est divisible par aucun des autres nombres proposés.`,
    };
  }),
]);

// ---------------------------------------------------------------------------
// GRANDEURS : mesures, aires, volumes
// ---------------------------------------------------------------------------
// Unités exprimées dans la plus petite unité de chaque système (valeurs entières).
const SYSTEMES = {
  longueur: { nom: 'longueur', u: { km: 1e6, hm: 1e5, dam: 1e4, m: 1000, dm: 100, cm: 10, mm: 1 }, courantes: ['km', 'm', 'cm', 'mm', 'dm', 'hm'], plus: 'longue', moins: 'courte', obj: 'Quelle longueur' },
  masse: { nom: 'masse', u: { t: 1e9, kg: 1e6, hg: 1e5, dag: 1e4, g: 1000, dg: 100, cg: 10, mg: 1 }, courantes: ['t', 'kg', 'g', 'mg', 'hg', 'dag'], plus: 'lourde', moins: 'légère', obj: 'Quelle masse' },
  capacite: { nom: 'capacité', u: { hl: 1e5, dal: 1e4, l: 1000, dl: 100, cl: 10, ml: 1 }, courantes: ['hl', 'l', 'dl', 'cl', 'ml'], plus: 'grande', moins: 'petite', obj: 'Quelle capacité' },
};
// Exprime une quantité (en unité de base) dans l'unité u, si le nombre reste « scolaire ».
const dans = (sys, q, u) => r(q / sys.u[u]);
const lisible = (x) => x >= 0.01 && x < 100000 && nbDecimales(x) <= 3;
const lisible2 = (x) => x >= 0.1 && x < 10000 && nbDecimales(x) <= 2;
const egaliteMes = (sys, q, u, cu) => (u === cu ? mes(sys, q, u) : `${mes(sys, q, u)} = ${mes(sys, q, cu)}`);
const mes = (sys, q, u) => `${fmt(dans(sys, q, u))} ${u}`;
const unitePlusPetite = (sys, us) => us.reduce((a, b) => (sys.u[a] < sys.u[b] ? a : b));

const mesures = famille([
  forme((rng) => {
    const sys = SYSTEMES[rng.pick(Object.keys(SYSTEMES))];
    const us = sys.courantes;
    const base = rng.pick(us.filter((u) => u !== 'mm' && u !== 'ml' && u !== 'mg'));
    const V = rng.int(11, 99) * sys.u[base] / 10;
    const pas = V / rng.pick([10, 20, 5]);
    const qs = rng.shuffle(dedoublonner([V, V + pas, V - pas, V + 2 * pas, V - 2 * pas, V + pas / 2].filter((q) => q > 0))).slice(0, 4);
    const rep = qs.map((q) => { const ok = rng.shuffle(us).filter((u) => lisible2(dans(sys, q, u))); return ok.length ? { q, u: ok[0] } : null; });
    if (rep.some((x) => !x) || new Set(rep.map((x) => x.u)).size < 3) return null;
    const max = rng.next() < 0.5;
    const cible = max ? Math.max(...qs) : Math.min(...qs);
    const bon = rep.find((x) => x.q === cible);
    const c = qcm(rng, mes(sys, bon.q, bon.u), rep.filter((x) => x !== bon).map((x) => mes(sys, x.q, x.u)));
    if (!c) return null;
    const cu = unitePlusPetite(sys, rep.map((x) => x.u));
    return {
      ...c, difficulte: 2,
      enonce: `${sys.obj} est la plus ${max ? sys.plus : sys.moins} ?`,
      explication: `On convertit tout dans la même unité (${cu}) : ${rep.map((x) => egaliteMes(sys, x.q, x.u, cu)).join(' ; ')}. La plus ${max ? sys.plus : sys.moins} est ${mes(sys, bon.q, bon.u)}.`,
    };
  }, 2),
  forme((rng) => {
    const sys = SYSTEMES[rng.pick(Object.keys(SYSTEMES))];
    const paires = { longueur: [['m', 'cm'], ['km', 'm'], ['m', 'mm'], ['cm', 'mm'], ['m', 'dm']], masse: [['kg', 'g'], ['t', 'kg'], ['g', 'mg']], capacite: [['l', 'cl'], ['l', 'ml'], ['l', 'dl'], ['hl', 'l']] }[sys === SYSTEMES.longueur ? 'longueur' : sys === SYSTEMES.masse ? 'masse' : 'capacite'];
    const [u1, u2] = rng.pick(paires);
    const f = sys.u[u1] / sys.u[u2];
    const a = rng.pick([rng.int(1, 9), decimal(rng, 1, 9, 1)]);
    const b = rng.int(1, f - 1);
    const moins = rng.next() < 0.3;
    if (moins && a * f <= b) return null;
    const res = moins ? r(a * f - b) : r(a * f + b);
    const enU1 = rng.next() < 0.3;
    const reponse = enU1 ? r(res / f) : res;
    return {
      type: 'numerique', unite: enU1 ? u1 : u2, difficulte: 2,
      enonce: `Calcule et donne la réponse en ${enU1 ? u1 : u2} : ${fmt(a)} ${u1} ${moins ? '−' : '+'} ${fmt(b)} ${u2}`,
      reponse,
      explication: `1 ${u1} = ${fmt(f)} ${u2}, donc ${fmt(a)} ${u1} = ${fmt(r(a * f))} ${u2}. ${fmt(r(a * f))} ${moins ? '−' : '+'} ${fmt(b)} = ${fmt(res)} ${u2}${enU1 ? `, c'est-à-dire ${fmt(reponse)} ${u1}` : ''}.`,
    };
  }, 2),
  forme((rng) => {
    const sys = SYSTEMES[rng.pick(Object.keys(SYSTEMES))];
    const u = rng.pick(sys.courantes.filter((x) => x !== 't' && x !== 'hl'));
    const n = rng.int(2, 9);
    const k = rng.pick([10, 100, 1000]);
    const q = sys.u[u] * k; // valeur d'une unité après multiplication par k
    const bonU = Object.keys(sys.u).find((x) => sys.u[x] === q && x !== 't');
    const tous = Object.keys(sys.u).filter((x) => x !== 't');
    if (!bonU) return null;
    const fausses = tous.filter((x) => x !== bonU && x !== u).map((x) => `${n} ${x}`);
    const c = qcm(rng, `${n} ${bonU}`, rng.shuffle(fausses));
    if (!c) return null;
    return {
      ...c, difficulte: 3,
      enonce: `Quelle ${sys.nom} est ${fmt(k)} fois plus grande que ${n} ${u} ?`,
      explication: `${n} ${u} × ${fmt(k)} = ${fmt(n * k)} ${u} = ${n} ${bonU}. Dans le tableau des unités, on avance de ${String(k).length - 1} ${pluriel(String(k).length - 1, 'colonne')} vers la gauche.`,
    };
  }),
  forme((rng) => {
    const sys = SYSTEMES[rng.pick(Object.keys(SYSTEMES))];
    const [u1, u2] = rng.shuffle(sys.courantes).slice(0, 2);
    const v = rng.pick([rng.int(1, 99), decimal(rng, 0.1, 9.9, 1), decimal(rng, 0.01, 9.99, 2)]);
    const bon = r(v * sys.u[u1] / sys.u[u2]);
    if (!lisible(bon) || !lisible(v)) return null;
    const vrai = rng.next() < 0.5;
    const propose = vrai ? bon : rng.pick([r(bon * 10), r(bon / 10), r(bon * 100), r(bon / 100)]);
    if (!lisible(propose)) return null;
    return {
      type: 'vrai_faux', difficulte: 2,
      enonce: `Vrai ou faux ? ${fmt(v)} ${u1} = ${fmt(propose)} ${u2}`,
      reponse: vrai,
      explication: `1 ${u1} = ${fmt(r(sys.u[u1] / sys.u[u2]))} ${u2}, donc ${fmt(v)} ${u1} = ${fmt(bon)} ${u2}.`,
    };
  }),
  forme((rng) => {
    const sys = SYSTEMES[rng.pick(Object.keys(SYSTEMES))];
    const base = rng.pick(sys.courantes.filter((u) => !['mm', 'ml', 'mg', 't', 'hl'].includes(u)));
    const V = rng.int(11, 99) * sys.u[base] / 10;
    const pas = V / rng.pick([10, 5]);
    const qs = rng.shuffle(dedoublonner([V, V + pas, V - pas, V + 2 * pas, V - 2 * pas, V + 3 * pas].filter((q) => q > 0))).slice(0, 4);
    const rep = qs.map((q) => { const ok = rng.shuffle(sys.courantes).filter((u) => lisible2(dans(sys, q, u))); return ok.length ? { q, u: ok[0] } : null; });
    if (rep.some((x) => !x) || new Set(rep.map((x) => x.u)).size < 3) return null;
    const idx = rep.map((_, i) => i).sort((i, j) => rep[i].q - rep[j].q);
    const cu = unitePlusPetite(sys, rep.map((x) => x.u));
    return {
      type: 'ordre', difficulte: 3,
      enonce: `Range ces ${sys.nom === 'capacité' ? 'capacités' : sys.nom + 's'} de la plus petite à la plus grande.`,
      elements: rep.map((x) => mes(sys, x.q, x.u)), reponse: idx,
      explication: `En ${cu} : ${idx.map((i) => mes(sys, rep[i].q, cu)).join(' < ')}.`,
    };
  }),
]);

// Ordres de grandeur : « La masse d'un smartphone est d'environ 180 … »
const REALISTES = [
  ['masse', "La masse d'un smartphone est d'environ", 180, 'g'], ['masse', "La masse d'une pomme est d'environ", 150, 'g'],
  ['masse', "La masse d'un élève de 6e primaire est d'environ", 40, 'kg'], ['masse', "La masse d'une voiture est d'environ", 1200, 'kg'],
  ['masse', "La masse d'un éléphant adulte est d'environ", 5, 't'], ['masse', "La masse d'un camion chargé est d'environ", 30, 't'],
  ['masse', "La masse d'une fourmi est d'environ", 3, 'mg'], ['masse', "La masse d'un grain de riz est d'environ", 25, 'mg'],
  ['masse', "La masse d'un vélo est d'environ", 12, 'kg'], ['masse', "La masse d'une feuille de papier A4 est d'environ", 5, 'g'],
  ['masse', "La masse d'une tablette de chocolat est d'environ", 200, 'g'], ['masse', "La masse d'un bébé à la naissance est d'environ", 3.5, 'kg'],
  ['masse', "La masse d'une pièce de 1 euro est d'environ", 7.5, 'g'], ['masse', "La masse d'un paquet de beurre est d'environ", 250, 'g'],
  ['masse', "La masse d'un chat adulte est d'environ", 4, 'kg'], ['masse', "La masse d'un autobus est d'environ", 12, 't'],
  ['masse', "La masse d'un sac de pommes de terre est d'environ", 5, 'kg'], ['masse', "La masse d'un cheval est d'environ", 500, 'kg'],
  ['longueur', "La hauteur d'une porte est d'environ", 2, 'm'], ['longueur', "La longueur d'un crayon neuf est d'environ", 18, 'cm'],
  ['longueur', "L'épaisseur d'une pièce de 1 euro est d'environ", 2, 'mm'], ['longueur', "La longueur d'une fourmi est d'environ", 7, 'mm'],
  ['longueur', 'La distance entre Bruxelles et Liège est d\'environ', 100, 'km'], ['longueur', "La hauteur de l'Atomium est d'environ", 102, 'm'],
  ['longueur', "La taille d'un élève de 6e primaire est d'environ", 150, 'cm'], ['longueur', "La longueur d'un autobus est d'environ", 12, 'm'],
  ['longueur', "La largeur d'une feuille A4 est d'environ", 21, 'cm'], ['longueur', "La longueur d'une piscine olympique est de", 50, 'm'],
  ['longueur', "La longueur d'un marathon est d'environ", 42, 'km'], ['longueur', "La hauteur d'un immeuble de 10 étages est d'environ", 30, 'm'],
  ['longueur', "L'épaisseur d'un dictionnaire est d'environ", 6, 'cm'], ['longueur', "La longueur de la côte belge est d'environ", 67, 'km'],
  ['longueur', "L'épaisseur d'une carte bancaire est d'environ", 1, 'mm'], ['longueur', "La longueur d'un terrain de football est d'environ", 100, 'm'],
  ['capacite', "La capacité d'une gourde est d'environ", 0.7, 'l'], ['capacite', "La capacité d'une canette de soda est de", 33, 'cl'],
  ['capacite', "La capacité d'une baignoire est d'environ", 150, 'l'], ['capacite', "La capacité d'une cuillère à café est d'environ", 5, 'ml'],
  ['capacite', "La capacité d'un verre d'eau est d'environ", 20, 'cl'], ['capacite', "La capacité d'un seau est d'environ", 10, 'l'],
  ['capacite', "La capacité d'une bouteille d'eau est souvent de", 1.5, 'l'], ['capacite', "La capacité d'un tube de dentifrice est d'environ", 75, 'ml'],
  ['capacite', "La capacité d'une tasse de thé est d'environ", 25, 'cl'], ['capacite', "La capacité du réservoir d'une voiture est d'environ", 50, 'l'],
  ['duree', "La durée d'un match de football (sans les pauses) est de", 90, 'min'], ['duree', "La durée d'une nuit de sommeil d'un enfant est d'environ", 10, 'h'],
  ['duree', "La durée d'une récréation est d'environ", 15, 'min'], ['duree', 'Un champion court le 100 mètres en environ', 10, 's'],
  ['duree', "La durée d'un film au cinéma est d'environ", 2, 'h'], ['duree', 'Pour bien se brosser les dents, il faut environ', 3, 'min'],
  ['duree', "La durée des grandes vacances d'été est d'environ", 50, 'jours'], ['duree', "La durée d'une journée d'école est d'environ", 7, 'h'],
  ['duree', 'Pour lacer ses chaussures, il faut environ', 20, 's'], ['duree', 'Le trajet en train de Bruxelles à Namur dure environ', 1, 'h'],
  ['aire', "L'aire d'une chambre d'enfant est d'environ", 12, 'm²'], ['aire', "L'aire de la Belgique est d'environ", 30000, 'km²'],
  ['aire', "L'aire d'une feuille A4 est d'environ", 600, 'cm²'], ['aire', "L'aire d'un timbre-poste est d'environ", 6, 'cm²'],
  ['aire', "L'aire d'une classe est d'environ", 60, 'm²'], ['aire', "L'aire de la forêt de Soignes est d'environ", 4400, 'ha'],
];
const UNITES_REALISTES = { masse: ['mg', 'g', 'kg', 't'], longueur: ['mm', 'cm', 'm', 'km'], capacite: ['ml', 'cl', 'l', 'hl'], duree: ['s', 'min', 'h', 'jours'], aire: ['cm²', 'm²', 'ha', 'km²'] };
const mesuresRealistes = famille([
  forme((rng) => {
    const [g, phrase, v, u] = rng.pick(REALISTES);
    const choix = UNITES_REALISTES[g];
    return {
      type: 'qcm', choix, reponse: choix.indexOf(u), difficulte: 1,
      enonce: `${phrase} ${fmt(v)}…`,
      explication: `${phrase} ${fmt(v)} ${u}. Aide-toi d'objets que tu connais pour imaginer la bonne unité.`,
    };
  }, 2),
  forme((rng) => {
    const [g, phrase, v, u] = rng.pick(REALISTES.filter(([, p]) => /d'environ$/.test(p)));
    const fausses = [r(v * 10), r(v / 10), r(v * 100), r(v * 1000), r(v / 100)].filter((x) => x >= 0.1 && nbDecimales(x) <= 2).map((x) => `${fmt(x)} ${u}`);
    const c = qcm(rng, `${fmt(v)} ${u}`, fausses);
    if (!c) return null;
    const debut = phrase.replace(/ est d'environ$/, '');
    return {
      ...c, difficulte: 2,
      enonce: `${debut} : quelle est la mesure la plus vraisemblable ?`,
      explication: `${phrase} ${fmt(v)} ${u}. Les autres mesures sont 10, 100 ou 1 000 fois trop grandes ou trop petites.`,
    };
  }),
]);

const AIRES = { 'km²': 1e10, ha: 1e8, a: 1e6, 'm²': 1e4, 'dm²': 100, 'cm²': 1 };
const VOLUMES = { 'm³': 1e6, 'dm³': 1000, l: 1000, dl: 100, cl: 10, 'cm³': 1, ml: 1 };
const airesVolumes = famille([
  forme((rng) => {
    const paires = [['ha', 'a'], ['a', 'm²'], ['ha', 'm²'], ['km²', 'ha'], ['m²', 'dm²'], ['m²', 'cm²'], ['dm²', 'cm²'], ['a', 'ha'], ['m²', 'a'], ['m²', 'ha'], ['cm²', 'dm²'], ['cm²', 'm²'], ['ha', 'km²']];
    const [u1, u2] = rng.pick(paires);
    const v = rng.pick([rng.int(1, 99), decimal(rng, 0.5, 20, 1), rng.int(1, 99) * 100, rng.int(2, 900) * 10, decimal(rng, 0.05, 9, 2)]);
    const res = r(v * AIRES[u1] / AIRES[u2]);
    if (!lisible(res) || res > 50000) return null;
    const f = AIRES[u1] / AIRES[u2];
    return {
      type: 'numerique', unite: u2, difficulte: 2,
      enonce: `Convertis : ${fmt(v)} ${u1} = … ${u2}`,
      reponse: res,
      explication: `${f >= 1 ? `1 ${u1} = ${fmt(f)} ${u2}` : `1 ${u2} = ${fmt(1 / f)} ${u1}`}. Pour les aires, on avance de 2 chiffres par unité (1 ha = 100 a = 10 000 m²). ${fmt(v)} ${u1} = ${fmt(res)} ${u2}.`,
    };
  }, 2),
  forme((rng) => {
    const paires = [['dm³', 'l'], ['m³', 'l'], ['cm³', 'l'], ['l', 'cm³'], ['m³', 'dm³'], ['dm³', 'cm³'], ['cl', 'cm³'], ['ml', 'cm³'], ['l', 'dm³'], ['cm³', 'cl'], ['m³', 'hl']];
    const [u1, u2] = rng.pick(paires);
    const V2 = { ...VOLUMES, hl: 1e5 };
    const v = rng.pick([rng.int(1, 30), decimal(rng, 0.5, 9.5, 1), rng.int(1, 99) * 25, rng.int(2, 900) * 10]);
    const res = r(v * V2[u1] / V2[u2]);
    if (!lisible(res) || res > 50000) return null;
    return {
      type: 'numerique', unite: u2, difficulte: 3,
      enonce: `Convertis : ${fmt(v)} ${u1} = … ${u2}`,
      reponse: res,
      explication: `Rappel : 1 dm³ = 1 l = 1 000 cm³ et 1 m³ = 1 000 dm³ = 1 000 l. Donc ${fmt(v)} ${u1} = ${fmt(res)} ${u2}.`,
    };
  }, 2),
  forme((rng) => {
    const L = rng.pick([30, 40, 50, 60, 80, 100, 120]); const l = rng.pick([20, 25, 30, 40, 50]); const h = rng.pick([20, 25, 30, 40, 50, 60]);
    const P = rng.pick(PRENOMS);
    const frac = rng.pick([[1, 1], [3, 4], [1, 2], [4, 5], [2, 3]]);
    const cm3 = L * l * h; const litres = cm3 / 1000 * frac[0] / frac[1];
    if (nbDecimales(litres) > 1) return null;
    const plein = frac[0] === frac[1];
    return {
      type: 'numerique', unite: 'l', difficulte: 3,
      enonce: `${P.n} remplit d'eau un aquarium de ${L} cm de long, ${l} cm de large et ${h} cm de haut${plein ? ' jusqu\'en haut' : frac[0] === 1 ? ' jusqu\'à la moitié de sa hauteur' : ` aux ${fr(...frac)} de sa hauteur`}. Combien de litres d'eau a-t-${P.il} utilisés ? (1 litre = 1 dm³)`,
      reponse: litres,
      explication: `Volume de l'aquarium : ${L} × ${l} × ${h} = ${fmt(cm3)} cm³ = ${fmt(cm3 / 1000)} dm³ = ${fmt(cm3 / 1000)} l.${plein ? '' : frac[0] === 1 ? ` La moitié : ${fmt(cm3 / 1000)} : 2 = ${fmt(litres)} l.` : ` Les ${fr(...frac)} : ${fmt(cm3 / 1000)} : ${frac[1]} × ${frac[0]} = ${fmt(litres)} l.`}`,
    };
  }),
  forme((rng) => {
    const V = rng.int(5, 95) * 1e6; // en cm² : entre 5 et 95 ares
    const qs = rng.shuffle([V, V + 1e6 * rng.int(1, 4), V - 1e6 * rng.int(1, 4), V + 5e5, V * 2].filter((q) => q > 0)).slice(0, 4);
    if (new Set(qs).size < 4) return null;
    const rep = qs.map((q) => { const ok = rng.shuffle(['ha', 'a', 'm²']).filter((u) => lisible(r(q / AIRES[u])) && r(q / AIRES[u]) < 100000); return { q, u: ok[0] }; });
    if (rep.some((x) => !x.u) || new Set(rep.map((x) => x.u)).size < 2) return null;
    const max = rng.next() < 0.5;
    const cible = max ? Math.max(...qs) : Math.min(...qs);
    const aireTxt = (q, u) => `${fmt(r(q / AIRES[u]))} ${u}`;
    const bon = rep.find((x) => x.q === cible);
    const c = qcm(rng, aireTxt(bon.q, bon.u), rep.filter((x) => x !== bon).map((x) => aireTxt(x.q, x.u)));
    if (!c) return null;
    return {
      ...c, difficulte: 3,
      enonce: `Quel terrain est le plus ${max ? 'grand' : 'petit'} ?`,
      explication: `En m² : ${rep.map((x) => (x.u === 'm²' ? aireTxt(x.q, x.u) : `${aireTxt(x.q, x.u)} = ${aireTxt(x.q, 'm²')}`)).join(' ; ')}. Rappel : 1 ha = 100 a = 10 000 m².`,
    };
  }),
  forme((rng) => {
    const cas = rng.pick([
      () => { const ha = rng.int(2, 9); const a = rng.pick([20, 25, 50]); return { e: `Un champ de ${ha} ha est partagé en parcelles de ${a} a. Combien de parcelles obtient-on ?`, r: ha * 100 / a, x: `${ha} ha = ${ha * 100} a. ${ha * 100} : ${a} = ${ha * 100 / a} parcelles.`, u: 'parcelles' }; },
      () => { const c = rng.pick([30, 40, 50, 20]); const L = rng.int(3, 8); const l = rng.int(2, 6); const n = (L * 100 / c) * (l * 100 / c); return { e: `On pose des dalles carrées de ${c} cm de côté sur une terrasse rectangulaire de ${L} m sur ${l} m. Combien de dalles faut-il ?`, r: n, x: `En longueur : ${L * 100} : ${c} = ${L * 100 / c} dalles ; en largeur : ${l * 100} : ${c} = ${l * 100 / c} dalles. ${L * 100 / c} × ${l * 100 / c} = ${n} dalles.`, u: 'dalles', ok: (L * 100) % c === 0 && (l * 100) % c === 0 }; },
      () => { const b = rng.pick([1, 2, 5]); const v = rng.pick([20, 25, 50, 10]); return { e: `Combien de verres de ${v} cl peut-on remplir avec ${b} litre${b > 1 ? 's' : ''} de jus ?`, r: b * 100 / v, x: `${b} l = ${b * 100} cl. ${b * 100} : ${v} = ${b * 100 / v} verres.`, u: 'verres' }; },
      () => { const m3 = rng.int(2, 12); const s = rng.pick([10, 20, 25, 50]); return { e: `Une citerne contient ${m3} m³ d'eau. Combien de seaux de ${s} litres peut-on remplir ?`, r: m3 * 1000 / s, x: `${m3} m³ = ${fmt(m3 * 1000)} l. ${fmt(m3 * 1000)} : ${s} = ${fmt(m3 * 1000 / s)} seaux.`, u: 'seaux' }; },
    ])();
    if (cas.ok === false || !Number.isInteger(cas.r)) return null;
    return { type: 'numerique', unite: cas.u, difficulte: 3, enonce: cas.e, reponse: cas.r, explication: `On convertit d'abord dans la même unité. ${cas.x}` };
  }),
]);

const figures = famille([
  forme((rng) => {
    const c = rng.int(2, 25);
    const aireDemandee = rng.next() < 0.6;
    const u = rng.pick(['cm', 'm']);
    return aireDemandee ? {
      type: 'numerique', unite: `${u}²`, difficulte: 2,
      enonce: `Un carré a un périmètre de ${4 * c} ${u}. Quelle est son aire ?`,
      reponse: c * c,
      explication: `Le carré a 4 côtés égaux : ${4 * c} : 4 = ${c} ${u}. Aire = côté × côté = ${c} × ${c} = ${c * c} ${u}².`,
    } : {
      type: 'numerique', unite: u, difficulte: 2,
      enonce: `Un carré a une aire de ${c * c} ${u}². Quel est son périmètre ?`,
      reponse: 4 * c,
      explication: `Il faut trouver le nombre qui, multiplié par lui-même, donne ${c * c} : c'est ${c} (${c} × ${c} = ${c * c}). Périmètre = 4 × ${c} = ${4 * c} ${u}.`,
    };
  }),
  forme((rng) => {
    const L = rng.int(4, 30); const l = rng.int(2, L - 1);
    const u = rng.pick(['cm', 'm']);
    return rng.next() < 0.5 ? {
      type: 'numerique', unite: u, difficulte: 3,
      enonce: `Un rectangle a une aire de ${L * l} ${u}² et une longueur de ${L} ${u}. Quel est son périmètre ?`,
      reponse: 2 * (L + l),
      explication: `Largeur = aire : longueur = ${L * l} : ${L} = ${l} ${u}. Périmètre = (${L} + ${l}) × 2 = ${2 * (L + l)} ${u}.`,
    } : {
      type: 'numerique', unite: `${u}²`, difficulte: 3,
      enonce: `Un rectangle a un périmètre de ${2 * (L + l)} ${u} et une largeur de ${l} ${u}. Quelle est son aire ?`,
      reponse: L * l,
      explication: `Demi-périmètre : ${2 * (L + l)} : 2 = ${L + l} ${u}. Longueur = ${L + l} − ${l} = ${L} ${u}. Aire = ${L} × ${l} = ${L * l} ${u}².`,
    };
  }),
  forme((rng) => {
    const L = rng.int(6, 15); const l = rng.int(4, L - 1); const c = rng.int(1, Math.min(l, L) - 2);
    const lieu = rng.pick(['Une pièce', 'Un jardin', 'Une terrasse', 'Un salon']);
    const perim = rng.next() < 0.4;
    const txt = `${lieu} a la forme d'un rectangle de ${L} m sur ${l} m auquel on a retiré, dans un coin, un carré de ${c} m de côté (forme en L).`;
    return perim ? {
      type: 'numerique', unite: 'm', difficulte: 3,
      enonce: `${txt} Quel est son périmètre ?`,
      reponse: 2 * (L + l),
      explication: `Les deux côtés du coin retiré (${c} m et ${c} m) remplacent exactement les morceaux enlevés au rectangle : le périmètre reste (${L} + ${l}) × 2 = ${2 * (L + l)} m.`,
    } : {
      type: 'numerique', unite: 'm²', difficulte: 3,
      enonce: `${txt} Quelle est son aire ?`,
      reponse: L * l - c * c,
      explication: `Aire du rectangle : ${L} × ${l} = ${L * l} m². Aire du carré retiré : ${c} × ${c} = ${c * c} m². ${L * l} − ${c * c} = ${L * l - c * c} m².`,
    };
  }, 2),
  forme((rng) => {
    const poly = rng.pick([['triangle équilatéral', 3], ['carré', 4], ['pentagone régulier', 5], ['hexagone régulier', 6], ['octogone régulier', 8]]);
    const c = rng.pick([rng.int(2, 15), decimal(rng, 1.5, 9.5, 1)]);
    const p = r(c * poly[1]);
    const inverse = rng.next() < 0.4;
    return inverse ? {
      type: 'numerique', unite: 'cm', difficulte: 2,
      enonce: `Un ${poly[0]} a un périmètre de ${fmt(p)} cm. Combien mesure un côté ?`,
      reponse: c,
      explication: `Un ${poly[0]} a ${poly[1]} côtés égaux : ${fmt(p)} : ${poly[1]} = ${fmt(c)} cm.`,
    } : {
      type: 'numerique', unite: 'cm', difficulte: 1,
      enonce: `Un ${poly[0]} a des côtés de ${fmt(c)} cm. Quel est son périmètre ?`,
      reponse: p,
      explication: `Un ${poly[0]} a ${poly[1]} côtés égaux : ${poly[1]} × ${fmt(c)} = ${fmt(p)} cm.`,
    };
  }),
  forme((rng) => {
    const a = rng.int(3, 20); const b = rng.int(3, 20);
    if ((a * b) % 2) return null;
    return {
      type: 'numerique', unite: 'cm²', difficulte: 2,
      enonce: `Dans un triangle rectangle, les deux côtés de l'angle droit mesurent ${a} cm et ${b} cm. Quelle est l'aire de ce triangle ?`,
      reponse: a * b / 2,
      explication: `Le triangle rectangle est la moitié d'un rectangle de ${a} cm sur ${b} cm : (${a} × ${b}) : 2 = ${a * b} : 2 = ${a * b / 2} cm².`,
    };
  }),
  forme((rng) => {
    const c = rng.int(2, 12); const k = rng.pick([2, 3]);
    return {
      type: 'numerique', unite: 'cm²', difficulte: 3,
      enonce: `Un carré a des côtés de ${c} cm. On ${k === 2 ? 'double' : 'triple'} la longueur de ses côtés. Quelle est l'aire du nouveau carré ?`,
      reponse: (c * k) ** 2,
      explication: `Nouveau côté : ${c} × ${k} = ${c * k} cm. Aire : ${c * k} × ${c * k} = ${(c * k) ** 2} cm². L'aire n'est pas ${k === 2 ? 'doublée' : 'triplée'} : elle est multipliée par ${k * k} !`,
    };
  }),
]);

const cercle = famille([
  forme((rng) => {
    const x = rng.pick([rng.int(2, 60), decimal(rng, 1.5, 20, 1)]);
    const versD = rng.next() < 0.5;
    return {
      type: 'numerique', unite: 'cm', difficulte: 1,
      enonce: versD ? `Un cercle a un rayon de ${fmt(x)} cm. Combien mesure son diamètre ?` : `Un cercle a un diamètre de ${fmt(x)} cm. Combien mesure son rayon ?`,
      reponse: versD ? r(x * 2) : r(x / 2),
      explication: `Le diamètre vaut 2 fois le rayon. ${versD ? `${fmt(x)} × 2 = ${fmt(r(x * 2))} cm` : `${fmt(x)} : 2 = ${fmt(r(x / 2))} cm`}.`,
    };
  }),
  forme((rng) => {
    const obj = rng.pick([['Une roue de vélo', 'de diamètre', 60, 70], ['Une table ronde', 'de diamètre', 80, 150], ['Un rond-point', 'de diamètre', 20, 40, 'm'], ['Un bassin circulaire', 'de rayon', 2, 8, 'm'], ['Une pizza', 'de diamètre', 25, 40], ['Une horloge', 'de rayon', 10, 20]]);
    const u = obj[4] ?? 'cm';
    const v = rng.int(obj[2], obj[3]);
    const d = obj[1] === 'de rayon' ? 2 * v : v;
    const res = r(d * 3.14);
    return {
      type: 'numerique', unite: u, difficulte: 3,
      enonce: `${obj[0]} a ${obj[1].replace('de ', 'un ')} de ${v} ${u}. Calcule sa circonférence (le tour) avec π ≈ 3,14.`,
      reponse: res,
      explication: `Circonférence = diamètre × 3,14.${obj[1] === 'de rayon' ? ` Diamètre = 2 × ${v} = ${d} ${u}.` : ''} ${d} × 3,14 = ${fmt(res)} ${u}.`,
    };
  }, 2),
  forme((rng) => {
    const rr = rng.int(1, 12);
    const donne = rng.next() < 0.5 ? 'rayon' : 'diamètre';
    const res = r(rr * rr * 3.14);
    return {
      type: 'numerique', unite: 'cm²', difficulte: 3,
      enonce: `Un disque a un ${donne} de ${donne === 'rayon' ? rr : 2 * rr} cm. Calcule son aire avec π ≈ 3,14.`,
      reponse: res,
      explication: `Aire du disque = rayon × rayon × 3,14.${donne === 'diamètre' ? ` Rayon = ${2 * rr} : 2 = ${rr} cm.` : ''} ${rr} × ${rr} × 3,14 = ${fmt(res)} cm².`,
    };
  }),
  forme((rng) => {
    const items = [
      ['Le segment qui relie le centre du cercle à un point du cercle s\'appelle…', 'le rayon'],
      ['Le segment qui relie deux points du cercle en passant par le centre s\'appelle…', 'le diamètre'],
      ['Le point situé à la même distance de tous les points du cercle s\'appelle…', 'le centre'],
      ['La longueur du tour d\'un cercle s\'appelle…', 'la circonférence'],
      ['Pour tracer un cercle, on utilise…', 'un compas'],
      ['La surface à l\'intérieur d\'un cercle s\'appelle…', 'le disque'],
    ];
    const [e, bon] = rng.pick(items);
    const tous = ['le rayon', 'le diamètre', 'le centre', 'la circonférence', 'un compas', 'le disque', 'une équerre', 'la diagonale'];
    const c = qcm(rng, bon, rng.shuffle(tous.filter((x) => x !== bon)));
    return {
      ...c, difficulte: 1,
      enonce: e,
      explication: `Réponse : ${bon}. Rappel : le diamètre est 2 fois plus long que le rayon, et tous les rayons d'un même cercle ont la même longueur.`,
    };
  }),
]);

// ---------------------------------------------------------------------------
// GRANDEURS : temps, monnaie, pourcentages, échelle, vitesse, proportionnalité
// ---------------------------------------------------------------------------
const durees = famille([
  forme((rng) => {
    const h = rng.int(1, 5); const m = rng.int(1, 59);
    const t = rng.int(0, 2);
    if (t === 0) {
      const tot = h * 60 + m;
      return {
        type: 'texte_court', difficulte: 2, souple: true,
        enonce: `Combien d'heures et de minutes font ${tot} minutes ? (exemple de réponse : 2 h 15)`,
        reponse: [...heuresAcceptees(h, m), `${h} h ${String(m).padStart(2, '0')} min`],
        explication: `1 h = 60 min. Dans ${tot} min, il y a ${h} fois 60 min (${h * 60} min) et il reste ${tot - h * 60} min : ${heureTxt(h, m)}.`,
      };
    }
    if (t === 1) {
      const mn = rng.int(1, 9); const s = rng.int(1, 59);
      return {
        type: 'numerique', unite: 's', difficulte: 2,
        enonce: `Combien de secondes y a-t-il dans ${mn} min ${s} s ?`,
        reponse: mn * 60 + s,
        explication: `1 min = 60 s. ${mn} × 60 = ${mn * 60} s ; ${mn * 60} + ${s} = ${mn * 60 + s} s.`,
      };
    }
    return {
      type: 'numerique', unite: 'min', difficulte: 1,
      enonce: `Combien de minutes y a-t-il dans ${h} h ${String(m).padStart(2, '0')} ?`,
      reponse: h * 60 + m,
      explication: `1 h = 60 min. ${h} × 60 = ${h * 60} min ; ${h * 60} + ${m} = ${h * 60 + m} min.`,
    };
  }, 2),
  forme((rng) => {
    const ctx = rng.pick([
      ['Un train part à', 'et arrive à', 'le trajet'], ['Un film commence à', 'et se termine à', 'le film'],
      ['Le match commence à', 'et se termine à', 'le match'], ['Une randonnée commence à', 'et se termine à', 'la randonnée'],
      ['Le bus quitte Namur à', 'et arrive à Liège à', 'le trajet'], ['Un avion décolle à', 'et atterrit à', 'le vol'],
    ]);
    const d = rng.int(8, 22) * 60 + rng.int(0, 59);
    const duree = rng.int(20, 200);
    const f = d + duree;
    if (f >= 24 * 60) return null;
    const minutes = rng.next() < 0.5;
    const hd = Math.floor(d / 60); const md = d % 60; const hf = Math.floor(f / 60); const mf = f % 60;
    const base = {
      explication: hf === hd ? `${mf} − ${md} = ${duree} min.` : `De ${heureTxt(hd, md)} à ${heureTxt(hd + 1, 0)} : ${60 - md} min. De ${heureTxt(hd + 1, 0)} à ${heureTxt(hf, mf)} : ${dureeTxt(f - (hd + 1) * 60)}. En tout : ${dureeTxt(duree)}${duree >= 60 ? ` (${duree} min)` : ''}.`,
    };
    if (md === 0) return null;
    if (minutes || duree < 60) {
      return { ...base, type: 'numerique', unite: 'min', difficulte: 2, enonce: `${ctx[0]} ${heureTxt(hd, md)} ${ctx[1]} ${heureTxt(hf, mf)}. Combien de minutes dure ${ctx[2]} ?`, reponse: duree };
    }
    return {
      ...base, type: 'texte_court', souple: true, difficulte: 3,
      enonce: `${ctx[0]} ${heureTxt(hd, md)} ${ctx[1]} ${heureTxt(hf, mf)}. Combien de temps dure ${ctx[2]} ? (exemple de réponse : 1 h 25)`,
      reponse: heuresAcceptees(Math.floor(duree / 60), duree % 60),
    };
  }, 2),
  forme((rng) => {
    const ctx = rng.pick([['Un film dure', 'et se termine à', 'a-t-il commencé', 80, 180], ['Un trajet en train dure', 'et le train arrive à', 'est-il parti', 25, 180],
      ['Un gâteau doit cuire', 'et doit être prêt à', 'faut-il le mettre au four', 25, 90], ['Une course dure', 'et se termine à', 'a-t-elle commencé', 25, 180]]);
    const duree = rng.int(ctx[3], ctx[4]); const f = rng.int(10, 23) * 60 + rng.int(0, 11) * 5;
    const d = f - duree;
    if (d < 7 * 60 || duree % 5) return null;
    return {
      type: 'texte_court', souple: true, difficulte: 3,
      enonce: `${ctx[0]} ${dureeTxt(duree)} ${ctx[1]} ${heureTxt(Math.floor(f / 60), f % 60)}. À quelle heure ${ctx[2]} ? (exemple de réponse : 14 h 35)`,
      reponse: heuresAcceptees(Math.floor(d / 60), d % 60),
      explication: `On remonte le temps : ${heureTxt(Math.floor(f / 60), f % 60)} − ${dureeTxt(duree)} = ${heureTxt(Math.floor(d / 60), d % 60)}.`,
    };
  }),
  forme((rng) => {
    const cas = rng.pick([[1.5, 90], [0.5, 30], [0.25, 15], [0.75, 45], [2.5, 150], [1.25, 75], [0.1, 6], [1.2, 72], [0.2, 12], [2.75, 165], [3.5, 210], [1.75, 105]]);
    const [h, min] = cas;
    const txt = (m) => dureeTxt(m);
    const pieges = [Math.floor(h) * 60 + Math.round((h % 1) * 100), Math.floor(h) * 60 + Math.round((h % 1) * 10), min + 10, min - 10, Math.round(h * 100)]
      .filter((m) => m > 0 && m !== min);
    const c = qcm(rng, txt(min), pieges.map(txt));
    if (!c) return null;
    return {
      ...c, difficulte: 3,
      enonce: `Une durée de ${fmt(h)} h, c'est…`,
      explication: `Attention, les heures ne comptent pas en base 10 ! ${fmt(h)} h = ${fmt(h)} × 60 min = ${min} min${min >= 60 ? ` = ${txt(min)}` : ''}.`,
    };
  }),
]);

const MOIS = [['janvier', 31], ['février', 28], ['mars', 31], ['avril', 30], ['mai', 31], ['juin', 30], ['juillet', 31], ['août', 31], ['septembre', 30], ['octobre', 31], ['novembre', 30], ['décembre', 31]];
const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const bissextile = (a) => (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;
const calendrier = famille([
  forme((rng) => {
    const a = rng.int(1990, 2060);
    if (a % 100 === 0) return null;
    const vrai = bissextile(a);
    return {
      type: 'vrai_faux', difficulte: 2,
      enonce: `Vrai ou faux ? L'année ${a} est une année bissextile.`,
      reponse: vrai,
      explication: `Une année bissextile compte 366 jours (29 février). En général, ce sont les années divisibles par 4. ${a} : ${a % 100} ${vrai ? 'est' : "n'est pas"} divisible par 4, donc ${vrai ? 'elle est bissextile' : "elle n'est pas bissextile"}.`,
    };
  }),
  forme((rng) => {
    const i = rng.int(0, 11); const n = rng.int(2, 3);
    const mois = range(0, n - 1).map((k) => MOIS[(i + k) % 12]);
    if (mois.some(([m]) => m === 'février')) return null;
    const tot = mois.reduce((s, [, j]) => s + j, 0);
    return {
      type: 'numerique', unite: 'jours', difficulte: 1,
      enonce: `Combien de jours y a-t-il en tout en ${enumerer(mois.map(([m]) => m))} ?`,
      reponse: tot,
      explication: `${mois.map(([m, j]) => `${m} : ${j} jours`).join(' ; ')}. ${mois.map(([, j]) => j).join(' + ')} = ${tot} jours. Astuce : compte sur les bosses de tes poings !`,
    };
  }),
  forme((rng) => {
    const i = rng.pick([0, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const [m1, j1] = MOIS[i]; const [m2] = MOIS[i + 1];
    const d1 = rng.int(15, j1 - 1); const d2 = rng.int(1, 20);
    const ecart = j1 - d1 + d2;
    const art = (d, m) => `${d === 1 ? '1er' : d} ${m}`;
    return {
      type: 'numerique', unite: 'jours', difficulte: 2,
      enonce: `Nous sommes le ${art(d1, m1)}. Dans combien de jours serons-nous le ${art(d2, m2)} ?`,
      reponse: ecart,
      explication: `${m1[0].toUpperCase() + m1.slice(1)} a ${j1} jours : du ${art(d1, m1)} au ${j1} ${m1}, il y a ${j1 - d1} ${pluriel(j1 - d1, 'jour')}, puis encore ${d2} jours jusqu'au ${art(d2, m2)}. ${j1 - d1} + ${d2} = ${ecart} jours.`,
    };
  }),
  forme((rng) => {
    const j0 = rng.int(0, 6);
    const i = rng.pick([0, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const [m, nj] = MOIS[i];
    const d1 = rng.int(1, 12); const plus = rng.int(5, 25);
    if (plus % 7 === 0) return null;
    const d2 = d1 + plus;
    let cible; let m2 = m;
    if (d2 > nj) { cible = d2 - nj; m2 = MOIS[i + 1][0]; } else cible = d2;
    const j = JOURS[(j0 + plus) % 7];
    const c = qcm(rng, j, rng.shuffle(JOURS.filter((x) => x !== j)));
    const art = (d) => (d === 1 ? '1er' : d);
    return {
      ...c, difficulte: 3,
      enonce: `Le ${art(d1)} ${m} est un ${JOURS[j0]}. Quel jour de la semaine sera le ${art(cible)} ${m2} ?`,
      explication: `Du ${art(d1)} ${m} au ${art(cible)} ${m2}, il y a ${plus} jours${m2 !== m ? ` (${m} a ${nj} jours)` : ''}. ${plus} = ${Math.floor(plus / 7)} × 7 + ${plus % 7} : après ${Math.floor(plus / 7)} ${pluriel(Math.floor(plus / 7), 'semaine')}, on retombe un ${JOURS[j0]}, puis on avance de ${plus % 7} ${pluriel(plus % 7, 'jour')} : ${j}.`,
    };
  }, 2),
  forme((rng) => {
    const cas = rng.pick([
      () => { const s = rng.int(2, 9); const j = rng.int(1, 6); return { e: `Combien de jours y a-t-il dans ${s} semaines et ${j} ${pluriel(j, 'jour')} ?`, r: s * 7 + j, x: `${s} × 7 = ${s * 7} ; ${s * 7} + ${j} = ${s * 7 + j} jours.`, u: 'jours' }; },
      () => { const j = rng.int(30, 150); return { e: `Combien de semaines complètes y a-t-il dans ${j} jours ?`, r: Math.floor(j / 7), x: `${j} : 7 = ${Math.floor(j / 7)} reste ${j % 7} : ${Math.floor(j / 7)} semaines complètes.`, u: 'semaines' }; },
      () => { const a = rng.int(1, 6); return { e: `Combien de mois y a-t-il dans ${a === 1 ? 'un an' : `${a} ans`} et demi ?`, r: a * 12 + 6, x: `${a} × 12 = ${a * 12} mois, plus une demi-année (6 mois) : ${a * 12 + 6} mois.`, u: 'mois' }; },
      () => { const j = rng.int(2, 9); return { e: `Combien d'heures y a-t-il dans ${j} jours ?`, r: j * 24, x: `1 jour = 24 h. ${j} × 24 = ${j * 24} h.`, u: 'h' }; },
      () => { const s = rng.int(2, 10); return { e: `Combien de siècles y a-t-il dans ${s * 100} ans ?`, r: s, x: `1 siècle = 100 ans. ${s * 100} : 100 = ${s} siècles.`, u: 'siècles' }; },
      () => { const h = rng.int(2, 5); return { e: `Combien de secondes y a-t-il dans ${h} heures ?`, r: h * 3600, x: `1 h = 60 min = 3 600 s. ${h} × 3 600 = ${fmt(h * 3600)} s.`, u: 's' }; },
    ])();
    return { type: 'numerique', unite: cas.u, difficulte: 2, enonce: cas.e, reponse: cas.r, explication: cas.x };
  }),
]);

const PRODUITS = [
  ['paquet de café', 'g', [250, 500, 1000], 3, 18], ['paquet de riz', 'g', [500, 1000, 2000], 1.5, 4], ['sac de pommes de terre', 'kg', [2, 5, 10], 0.8, 2],
  ['bouteille de jus', 'cl', [75, 100, 150], 1.5, 3.5], ['boîte de biscuits', 'g', [200, 300, 400], 4, 12], ['pot de confiture', 'g', [250, 370, 450], 4, 9],
  ['paquet de pâtes', 'g', [500, 1000], 1.2, 3], ['bidon de lessive', 'l', [1, 2, 3], 3, 6], ['barquette de fraises', 'g', [250, 500], 6, 12],
];
const achats = famille([
  forme((rng) => {
    const [nom, u, tailles, pmin, pmax] = rng.pick(PRODUITS);
    const t = rng.shuffle(tailles).slice(0, 3);
    if (t.length < 2) return null;
    const ref = u === 'g' ? 1000 : u === 'cl' ? 100 : 1;
    const refTxt = u === 'g' ? 'kg' : u === 'cl' || u === 'l' ? 'litre' : u;
    const pu = decimal(rng, pmin, pmax, 2);
    const facteurs = rng.shuffle([1, 0.85, 1.15]);
    const offres = t.map((q, i) => {
      const facteur = facteurs[i] + rng.int(-3, 3) / 100;
      const prix = Math.round(pu * q / ref * facteur * 100) / 100;
      return { q, prix, unit: prix / q * ref };
    });
    const unit = offres.map((o) => o.unit);
    const best = Math.min(...unit);
    if (unit.filter((x) => x / best < 1.04).length > 1) return null;
    const L = ['A', 'B', 'C'];
    const txt = offres.map((o, i) => `${L[i]} : ${fmt(o.q)} ${u} pour ${eur(o.prix)}`);
    const choix = L.slice(0, offres.length).map((l) => `Offre ${l}`);
    const bi = unit.indexOf(best);
    return {
      type: 'qcm', choix, reponse: bi, difficulte: 3,
      enonce: `Quelle offre est la moins chère au ${refTxt} ? ${txt.join(' ; ')}.`,
      explication: `On calcule le prix pour 1 ${refTxt} : ${offres.map((o, i) => `${L[i]} ≈ ${eur(Math.round(o.unit * 100) / 100)}`).join(' ; ')}. L'offre ${L[bi]} est la moins chère au ${refTxt}.`,
    };
  }, 2),
  forme((rng) => {
    // [pluriel, singulier, article, prix unitaire min, max]
    const art = rng.pick([['yaourts', 'yaourt', 'un', 0.3, 0.9], ['cahiers', 'cahier', 'un', 0.8, 3], ['croissants', 'croissant', 'un', 0.8, 1.5], ['stylos', 'stylo', 'un', 0.5, 2.5],
      ['bouteilles d\'eau', 'bouteille d\'eau', 'une', 0.4, 1.2], ['tickets de bus', 'ticket de bus', 'un', 1.5, 3], ['briques de lait', 'brique de lait', 'une', 0.9, 1.6]]);
    const n = rng.pick([4, 5, 6, 8, 10, 12]);
    const pu = decimal(rng, art[3], art[4], 2);
    if (Math.round(pu * 100) % 5) return null;
    const tot = Math.round(pu * n * 100) / 100;
    const m = rng.int(2, 15);
    if (m === n) return null;
    const unitaire = rng.next() < 0.4;
    return unitaire ? {
      type: 'numerique', unite: '€', difficulte: 2,
      enonce: `${n} ${art[0]} coûtent ${eur(tot)}. Combien coûte ${art[2]} seul${art[2] === 'une' ? 'e' : ''} ${art[1]} ?`,
      reponse: pu,
      explication: `Prix d'${art[2]} ${art[1]} : ${eur(tot)} : ${n} = ${eur(pu)}.`,
    } : {
      type: 'numerique', unite: '€', difficulte: 2,
      enonce: `${n} ${art[0]} coûtent ${eur(tot)}. Combien coûtent ${m} ${art[0]} ?`,
      reponse: Math.round(pu * m * 100) / 100,
      explication: `Prix d'${art[2]} ${art[1]} : ${eur(tot)} : ${n} = ${eur(pu)}. Pour ${m} : ${m} × ${eur(pu)} = ${eur(pu * m)}.`,
    };
  }),
  forme((rng) => {
    const [nom, q, ref, refTxt] = rng.pick([['fromage', 250, 1000, 'kg'], ['jambon', 200, 1000, 'kg'], ['cerises', 500, 1000, 'kg'], ['noix', 125, 1000, 'kg'], ['viande hachée', 400, 1000, 'kg'], ['chocolat', 100, 1000, 'kg']]);
    const pk = decimal(rng, 6, 35, 1);
    const prix = Math.round(pk * q / ref * 100) / 100;
    if (Math.abs(prix * ref / q - pk) > 1e-9) return null;
    return {
      type: 'numerique', unite: '€', difficulte: 3,
      enonce: `${fmt(q)} g de ${nom} coûtent ${eur(prix)}. Quel est le prix d'un kilogramme ?`,
      reponse: pk,
      explication: `1 kg = 1 000 g = ${fmt(ref / q)} × ${q} g. Donc le prix d'un kg est ${fmt(ref / q)} × ${eur(prix)} = ${eur(pk)}.`,
    };
  }),
  forme((rng) => {
    const art = rng.pick(['bouteille de jus', 'paquet de biscuits', 'boîte de thé', 'savon', 'tube de dentifrice']);
    const p = decimal(rng, 0.8, 4.5, 2);
    if (Math.round(p * 100) % 5) return null;
    const promo = rng.pick([['3 pour le prix de 2', 3, 2], ['2 achetés, le 3e gratuit', 3, 2], ['4 pour le prix de 3', 4, 3]]);
    const lots = rng.int(1, 3);
    const n = lots * promo[1];
    const paye = Math.round(lots * promo[2] * p * 100) / 100;
    const plur = art.replace(/^(\S+)/, '$1s').replace('boîtes de thé', 'boîtes de thé');
    return {
      type: 'numerique', unite: '€', difficulte: 3,
      enonce: `Un ${art.startsWith('bouteille') || art.startsWith('boîte') ? '' : ''}${art} coûte ${eur(p)}. Promotion : « ${promo[0]} ». Combien paies-tu pour ${n} ${plur} ?`.replace(/^Un (bouteille|boîte)/, 'Une $1'),
      reponse: paye,
      explication: `${n} ${plur}, c'est ${lots} ${pluriel(lots, 'lot')} de ${promo[1]}. Dans chaque lot, tu paies ${promo[2]} articles : ${lots * promo[2]} × ${eur(p)} = ${eur(paye)}.`,
    };
  }),
]);

const pourcentages = famille([
  forme((rng) => {
    // [début, groupe, fin, effectif minimum réaliste]
    const ctx = rng.pick([
      ['Dans une école de', 'élèves', 'viennent à vélo', 120], ['Sur les', 'spectateurs d\'un match', 'sont des enfants', 200],
      ['Dans un club de', 'membres', 'ont moins de 12 ans', 40], ['Sur les', 'arbres d\'un parc', 'sont des chênes', 40],
      ['Sur', 'élèves interrogés', 'préfèrent les vacances à la mer', 20], ['Dans un village de', 'habitants', 'ont un chien', 300],
    ]);
    const p = rng.pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80]);
    const n = rng.pick([20, 40, 60, 80, 120, 150, 200, 240, 300, 400, 500, 600, 800, 1200].filter((x) => x >= ctx[3]));
    if ((n * p) % 100) return null;
    return {
      type: 'numerique', difficulte: 2,
      enonce: `${ctx[0]} ${fmt(n)} ${ctx[1]}, ${p} % ${ctx[2]}. Combien cela fait-il ?`,
      reponse: n * p / 100,
      explication: `${p} % de ${fmt(n)} = ${fmt(n)} × ${p} : 100 = ${fmt(n * p / 100)}.${p === 25 ? ' (25 %, c\'est le quart.)' : p === 50 ? ' (50 %, c\'est la moitié.)' : p === 75 ? ' (75 %, ce sont les trois quarts.)' : p === 10 ? ' (10 %, c\'est diviser par 10.)' : ''}`,
    };
  }),
  forme((rng) => {
    const P = rng.pick(PRENOMS);
    // [texte (n, k), tailles possibles]
    const ctx = rng.pick([
      [(n, k) => `Sur les ${n} élèves de la classe, ${k} aiment le football.`, [20, 25]],
      [(n, k) => `Un test compte ${n} questions. ${P.n} a répondu correctement à ${k} questions.`, [10, 20, 25, 40, 50]],
      [(n, k) => `Sur ${n} tirs au but, ${k} ont été réussis.`, [10, 20, 25, 40, 50]],
      [(n, k) => `Sur les ${n} bonbons du paquet, ${k} sont rouges.`, [20, 25, 40, 50]],
    ]);
    const n = rng.pick(ctx[1]);
    const k = rng.int(2, n - 1);
    const p = k * 100 / n;
    if (!Number.isInteger(p)) return null;
    return {
      type: 'numerique', unite: '%', difficulte: 3,
      enonce: `${ctx[0](n, k)} Quel pourcentage cela représente-t-il ?`,
      reponse: p,
      explication: `${k} sur ${n}, c'est ${fr(k, n)}. On cherche la fraction égale sur 100 : ${fr(k, n)} = ${fr(p, 100)} = ${p} %.`,
    };
  }),
  forme((rng) => {
    // [phrase, prix possibles, pourcentages réalistes, nom du prix]
    const ctx = rng.pick([['Un abonnement de fitness coûte', [20, 25, 30, 40, 50], [5, 10, 20], 'prix'], ['Le loyer mensuel d\'un appartement est de', [500, 600, 700, 800, 900], [2, 3, 4, 5], 'loyer'], ['Un vélo coûte', [200, 250, 300, 400, 500, 600], [5, 10, 20, 25], 'prix'],
      ['Un voyage scolaire coûte', [80, 120, 150, 200, 250, 300], [2, 5, 10], 'prix'], ['Une place de concert coûte', [30, 40, 50, 60, 80], [5, 10, 20, 25], 'prix'], ['Une trottinette coûte', [120, 150, 200, 250], [5, 10, 20], 'prix']]);
    const prix = rng.pick(ctx[1]);
    const p = rng.pick(ctx[2]);
    const aug = prix * p / 100;
    if (nbDecimales(aug) > 2) return null;
    const nom = ctx[3];
    return {
      type: 'numerique', unite: '€', difficulte: 2,
      enonce: `${ctx[0]} ${prix} €. ${nom === 'loyer' ? 'Il' : 'Son prix'} augmente de ${p} %. Quel est le nouveau ${nom} ?`,
      reponse: r(prix + aug),
      explication: `Augmentation : ${p} % de ${prix} = ${prix} × ${p} : 100 = ${eur(aug)}. Nouveau ${nom} : ${prix} + ${fmt(aug)} = ${eur(prix + aug)}.`,
    };
  }),
  forme((rng) => {
    const P = rng.pick(PRENOMS);
    const s = rng.pick([100, 200, 250, 300, 400, 500, 600, 800, 1000, 1500, 2000]);
    const t = rng.pick([1, 2, 3, 4, 5]); const ans = rng.int(1, 4);
    const i = s * t / 100 * ans;
    if (nbDecimales(i) > 2) return null;
    const total = rng.next() < 0.5;
    return {
      type: 'numerique', unite: '€', difficulte: 3,
      enonce: `${P.n} place ${fmt(s)} € sur un compte d'épargne à ${t} % par an. Chaque année, la banque ajoute ${t} % de la somme de départ. ${total ? `Combien ${P.n} aura-t-${P.il} en tout après ${ans} ${pluriel(ans, 'an')} ?` : `Combien d'intérêts ${P.n} aura-t-${P.il} reçus après ${ans} ${pluriel(ans, 'an')} ?`}`,
      reponse: total ? r(s + i) : r(i),
      explication: `Intérêts d'une année : ${t} % de ${fmt(s)} = ${eur(s * t / 100)}. Pour ${ans} ${pluriel(ans, 'an')} : ${ans} × ${fmt(s * t / 100)} = ${eur(i)}.${total ? ` En tout : ${fmt(s)} + ${fmt(i)} = ${eur(s + i)}.` : ''}`,
    };
  }),
  forme((rng) => {
    const p = rng.pick([10, 20, 25, 50, 30, 40]);
    // [objet, prix de départ min, max] (en dizaines d'euros)
    const o = rng.pick([['un jeu vidéo', 3, 8], ['une veste', 4, 15], ['une paire de baskets', 5, 15], ['un sac à dos', 2, 8], ['une lampe', 2, 10], ['un vélo', 15, 30], ['une console', 20, 30]]);
    const depart = rng.int(o[1], o[2]) * 10;
    const apres = depart * (100 - p) / 100;
    if (!Number.isInteger(apres)) return null;
    const obj = o[0];
    return {
      type: 'numerique', unite: '€', difficulte: 3,
      enonce: `Après une réduction de ${p} %, ${obj} coûte ${apres} €. Quel était son prix avant la réduction ?`,
      reponse: depart,
      explication: `Après ${p} % de réduction, on paie ${100 - p} % du prix de départ. ${100 - p} % valent ${apres} €, donc 1 % vaut ${fmt(r(apres / (100 - p)))} € et 100 % valent ${depart} €.`,
    };
  }),
  forme((rng) => {
    const cas = rng.pick([[50, 'la moitié'], [25, 'le quart'], [75, 'les trois quarts'], [10, 'le dixième'], [20, 'le cinquième'], [100, 'le tout']]);
    const c = qcm(rng, cas[1], ['la moitié', 'le quart', 'les trois quarts', 'le dixième', 'le cinquième', 'le tout', 'le tiers'].filter((x) => x !== cas[1]));
    return {
      ...c, difficulte: 1,
      enonce: `Prendre ${cas[0]} % d'une quantité, c'est prendre…`,
      explication: `${cas[0]} % = ${fr(cas[0], 100)}, c'est-à-dire ${cas[1]}.`,
    };
  }),
]);

const echelle = famille([
  forme((rng) => {
    const e = rng.pick([100000, 200000, 250000, 500000, 1000000, 50000, 25000]);
    const cm = rng.pick([rng.int(2, 20), decimal(rng, 1.5, 12, 1)]);
    const km = r(cm * e / 100000);
    if (nbDecimales(km) > 2 || km > 400) return null;
    const lieux = km < 30 ? rng.pick(['deux villages', 'deux fermes', 'deux châteaux']) : rng.pick(['deux villes', 'deux gares', 'deux ports']);
    return {
      type: 'numerique', unite: 'cm', difficulte: 3,
      enonce: `En ligne droite, ${lieux} sont à ${fmt(km)} km de distance. Quelle distance les sépare sur une carte à l'échelle 1/${fmt(e)} ?`,
      reponse: cm,
      explication: `1 cm sur la carte = ${fmt(e)} cm en réalité = ${fmt(e / 100000)} km. ${fmt(km)} : ${fmt(e / 100000)} = ${fmt(cm)} cm.`,
    };
  }),
  forme((rng) => {
    const e = rng.pick([50, 100, 200]);
    const piece = rng.pick(['la cuisine', 'le salon', 'la chambre', 'la salle de bain', 'le garage', 'la terrasse']);
    const cm = rng.pick([rng.int(2, 15), decimal(rng, 2, 12, 1)]);
    const m = r(cm * e / 100);
    if (m > 12 || m < 1.5 || nbDecimales(m) > 2) return null;
    return {
      type: 'numerique', unite: 'm', difficulte: 2,
      enonce: `Sur le plan d'une maison à l'échelle 1/${e}, ${piece} mesure ${fmt(cm)} cm de long. Quelle est sa longueur réelle en mètres ?`,
      reponse: m,
      explication: `1/${e} : 1 cm sur le plan = ${e} cm en réalité. ${fmt(cm)} × ${e} = ${fmt(r(cm * e))} cm = ${fmt(m)} m.`,
    };
  }),
  forme((rng) => {
    const e = rng.pick([10000, 25000, 50000, 100000, 200000, 500000, 1000000]);
    const cm = rng.int(2, 8);
    const reel = cm * e / 100000;
    const reelTxt = reel >= 1 ? `${fmt(reel)} km` : `${fmt(reel * 1000)} m`;
    const c = qcm(rng, `1/${fmt(e)}`, [e * 10, e / 10, e * 100, e / 100].filter((x) => x >= 100).map((x) => `1/${fmt(x)}`));
    if (!c) return null;
    return {
      ...c, difficulte: 3,
      enonce: `Sur une carte, ${cm} cm représentent ${reelTxt} en réalité. Quelle est l'échelle de la carte ?`,
      explication: `${cm} cm représentent ${reelTxt}, donc 1 cm représente ${reelTxt} : ${cm} = ${reel / cm >= 1 ? `${fmt(reel / cm)} km` : `${fmt(reel / cm * 1000)} m`} = ${fmt(e)} cm. L'échelle est 1/${fmt(e)}.`,
    };
  }),
  forme((rng) => {
    const e = rng.pick([10, 20, 43, 50, 87]);
    const obj = rng.pick([['voiture', 4.3, 'm'], ['avion', 36, 'm'], ['camion', 12, 'm'], ['bateau', 20, 'm'], ['locomotive', 17.2, 'm']]);
    const cm = r(obj[1] * 100 / e);
    if (nbDecimales(cm) > 1) return null;
    return {
      type: 'numerique', unite: 'cm', difficulte: 3,
      enonce: `Une maquette d'${obj[0] === 'voiture' || obj[0] === 'locomotive' ? 'une ' : 'un '}${obj[0]} est à l'échelle 1/${e}. L'objet réel mesure ${fmt(obj[1])} m de long. Combien mesure la maquette ?`.replace("d'une ", "d'une ").replace("d'un ", "d'un "),
      reponse: cm,
      explication: `La maquette est ${e} fois plus petite : ${fmt(obj[1])} m = ${fmt(obj[1] * 100)} cm ; ${fmt(obj[1] * 100)} : ${e} = ${fmt(cm)} cm.`,
    };
  }),
]);

const VEHICULES = [['Un cycliste', 12, 30], ['Un piéton', 4, 6], ['Une voiture', 50, 120], ['Un train', 80, 160], ['Un coureur', 8, 15], ['Un bateau', 10, 30], ['Un TGV', 200, 300], ['Un bus', 30, 60]];
const vitesse = famille([
  forme((rng) => {
    const [v0, vmin, vmax] = rng.pick(VEHICULES);
    const v = rng.int(vmin, vmax);
    const t = rng.pick([[0.5, '30 min'], [1.5, '1 h 30 min'], [2, '2 h'], [3, '3 h'], [0.25, '15 min'], [2.5, '2 h 30 min'], [0.75, '45 min'], [1.25, '1 h 15 min'], [4, '4 h']]);
    const d = r(v * t[0]);
    if (nbDecimales(d) > 1 || d > 800) return null;
    return {
      type: 'numerique', unite: 'km', difficulte: 2,
      enonce: `${v0} roule à ${v} km/h de moyenne pendant ${t[1]}. Quelle distance parcourt-il ?`.replace(/^(Une voiture) roule à (.+) Quelle distance parcourt-il/, '$1 roule à $2 Quelle distance parcourt-elle').replace(/^Un piéton roule/, 'Un piéton marche').replace(/^Un coureur roule/, 'Un coureur court').replace(/^Un bateau roule/, 'Un bateau navigue'),
      reponse: d,
      explication: `Distance = vitesse × durée.${Number.isInteger(t[0]) ? '' : ` ${t[1]} = ${fmt(t[0])} h.`} ${v} × ${fmt(t[0])} = ${fmt(d)} km.`,
    };
  }, 2),
  forme((rng) => {
    const [v0, vmin, vmax] = rng.pick(VEHICULES);
    const v = rng.pick(range(vmin, vmax).filter((x) => x % 2 === 0 || x % 5 === 0));
    const min = rng.pick([10, 15, 20, 30, 40, 45, 90, 120, 150, 75, 12, 6]);
    const d = r(v * min / 60);
    if (nbDecimales(d) > 1 || d < 1) return null;
    const elle = v0.startsWith('Une');
    const verbe = { 'Un piéton': 'marche', 'Un coureur': 'court', 'Un bateau': 'navigue' }[v0] ?? 'roule';
    const minParKm = r(60 / v);
    return {
      type: 'numerique', unite: 'min', difficulte: 3,
      enonce: `${v0} ${verbe} à ${v} km/h de moyenne. Combien de minutes lui faut-il pour parcourir ${fmt(d)} km ?`,
      reponse: min,
      explication: `En 1 h (60 min), ${elle ? 'elle' : 'il'} parcourt ${v} km${nbDecimales(minParKm) <= 2 ? `, donc 1 km en ${fmt(minParKm)} min` : ''}. Pour ${fmt(d)} km : ${fmt(d)} × 60 : ${v} = ${min} min.`,
    };
  }),
  forme((rng) => {
    const cands = [];
    for (let i = 0; i < 8; i++) {
      const t = rng.pick([[0.5, '30 min'], [1, '1 h'], [1.5, '1 h 30'], [2, '2 h'], [0.25, '15 min'], [3, '3 h']]);
      const v = rng.int(8, 30);
      const d = r(v * t[0]);
      if (nbDecimales(d) <= 1 && !cands.some((c) => c.v === v)) cands.push({ v, d, t });
    }
    const pers = rng.shuffle(PRENOMS).slice(0, 3);
    const trois = cands.slice(0, 3);
    if (trois.length < 3) return null;
    const max = Math.max(...trois.map((c) => c.v));
    const bi = trois.findIndex((c) => c.v === max);
    const choix = pers.map((p) => p.n);
    return {
      type: 'qcm', choix, reponse: bi, difficulte: 3,
      enonce: `À vélo, ${trois.map((c, i) => `${pers[i].n} parcourt ${fmt(c.d)} km en ${c.t[1]}`).join(', ')}. Qui roule le plus vite ?`,
      explication: `On calcule la vitesse en km/h (distance : durée en heures) : ${trois.map((c, i) => `${pers[i].n} : ${fmt(c.d)} : ${fmt(c.t[0])} = ${c.v} km/h`).join(' ; ')}. ${pers[bi].n} est le plus rapide.`.replace(/(\S+) est le plus rapide\.$/, (m, n) => `${n} est ${pers[bi].e ? 'la plus rapide' : 'le plus rapide'}.`),
    };
  }),
  forme((rng) => {
    const v = rng.pick([60, 80, 90, 100, 120, 50]);
    const d = rng.int(1, 8) * v / 2;
    const dureeMin = d / v * 60;
    const h = rng.int(7, 18); const m = rng.pick([0, 10, 15, 20, 30, 40, 45]);
    const f = h * 60 + m + dureeMin;
    if (f >= 24 * 60 || !Number.isInteger(dureeMin)) return null;
    return {
      type: 'texte_court', souple: true, difficulte: 3,
      enonce: `Une voiture part à ${heureTxt(h, m)} et roule à ${v} km/h de moyenne. Elle doit parcourir ${d} km. À quelle heure arrivera-t-elle ? (exemple de réponse : 14 h 35)`,
      reponse: heuresAcceptees(Math.floor(f / 60), f % 60),
      explication: `Durée = distance : vitesse = ${d} : ${v} = ${fmt(d / v)} h${Number.isInteger(d / v) ? '' : ` = ${dureeTxt(dureeMin)}`}. ${heureTxt(h, m)} + ${dureeTxt(dureeMin)} = ${heureTxt(Math.floor(f / 60), f % 60)}.`,
    };
  }),
]);

const proportionnalite = famille([
  forme((rng) => {
    const ctx = rng.pick([['Nombre de cahiers', 'Prix (€)', 0.5, 3], ['Nombre de personnes', 'Farine (g)', 50, 150], ['Heures de travail', 'Salaire (€)', 12, 20], ['Litres d\'essence', 'Prix (€)', 1.5, 2], ['Nombre de tickets', 'Prix (€)', 2, 8], ['Kilos de pommes', 'Prix (€)', 1.5, 3.5]]);
    const k = ctx[2] < 5 ? decimal(rng, ctx[2], ctx[3], 1) : rng.int(Math.ceil(ctx[2] / 5), Math.floor(ctx[3] / 5)) * 5;
    if (k <= 0) return null;
    const xs = rng.shuffle(range(2, 12)).slice(0, 4);
    const trou = rng.int(1, 3);
    const cols = xs.map((x, i) => (i === trou ? `${x} → …` : `${x} → ${fmt(r(x * k))}`));
    const res = r(xs[trou] * k);
    return {
      type: 'numerique', difficulte: 2,
      enonce: `Ce tableau est un tableau de proportionnalité (${ctx[0]} → ${ctx[1]}) : ${cols.join(' ; ')}. Quel nombre manque-t-il ?`,
      reponse: res,
      explication: `On passe de la 1re ligne à la 2e en multipliant toujours par le même nombre : ${fmt(r(xs[0] * k))} : ${xs[0]} = ${fmt(k)}. ${xs[trou]} × ${fmt(k)} = ${fmt(res)}.`,
    };
  }, 2),
  forme((rng) => {
    const rec = rng.pick([['crêpes', [['farine', 'g', 25], ['lait', 'ml', 50]]], ['cookies', [['beurre', 'g', 10], ['sucre', 'g', 8]]], ['personnes', [['pâtes', 'g', 100], ['sauce tomate', 'g', 75]]], ['gaufres', [['farine', 'g', 30], ['sucre', 'g', 10]]]]);
    const n1 = rng.pick([4, 6, 8, 10, 12]); const n2 = rng.pick([2, 3, 5, 9, 15, 18, 20, 24]);
    if (n1 === n2) return null;
    const ing = rng.pick(rec[1]);
    const q1 = ing[2] * n1; const q2 = ing[2] * n2;
    return {
      type: 'numerique', unite: ing[1], difficulte: 2,
      enonce: `Pour ${n1} ${rec[0]}, il faut ${q1} ${ing[1]} de ${ing[0]}. Combien faut-il de ${ing[0]} pour ${n2} ${rec[0]} ?`,
      reponse: q2,
      explication: `Pour 1 : ${q1} : ${n1} = ${ing[2]} ${ing[1]}. Pour ${n2} : ${n2} × ${ing[2]} = ${q2} ${ing[1]}.`,
    };
  }),
  forme((rng) => {
    const cas = rng.pick([
      ['Le prix payé et le nombre de baguettes achetées (toutes au même prix)', true, 'Si on achète 2 fois plus de baguettes, on paie 2 fois plus.'],
      ["L'âge d'un enfant et sa taille", false, "Un enfant de 10 ans n'est pas 2 fois plus grand qu'un enfant de 5 ans."],
      ["Le périmètre d'un carré et la longueur de son côté", true, 'Périmètre = 4 × côté : si le côté double, le périmètre double.'],
      ["L'aire d'un carré et la longueur de son côté", false, "Si le côté double, l'aire est multipliée par 4 (et pas par 2)."],
      ["La distance parcourue par une voiture qui roule toujours à la même vitesse et la durée du trajet", true, 'À vitesse constante, en 2 fois plus de temps, on va 2 fois plus loin.'],
      ["La quantité d'essence achetée et le prix payé à la pompe", true, 'Chaque litre coûte le même prix : 2 fois plus de litres, 2 fois plus cher.'],
      ["La masse d'un bébé et son âge", false, "Un bébé ne prend pas toujours le même poids chaque mois : ce n'est pas proportionnel."],
      ["Le nombre de tickets de cinéma (même tarif) et le prix total", true, 'Chaque ticket coûte le même prix.'],
      ["La température extérieure et l'heure de la journée", false, 'La température monte et descend : elle ne double pas quand l\'heure double.'],
      ["Le nombre de jours et le nombre d'heures", true, '1 jour = 24 h, toujours : on multiplie par 24.'],
      ["Le prix d'un taxi avec une prise en charge fixe et la distance parcourue", false, 'La prise en charge est payée même pour 0 km : ce n\'est pas proportionnel.'],
      ["Le nombre de pages lues par jour et le nombre de jours pour finir un livre", false, 'Plus on lit de pages par jour, moins il faut de jours : ce n\'est pas proportionnel.'],
    ]);
    return {
      type: 'vrai_faux', difficulte: 2,
      enonce: `Vrai ou faux ? Ces deux grandeurs sont proportionnelles : ${cas[0][0].toLowerCase()}${cas[0].slice(1)}.`,
      reponse: cas[1],
      explication: `${cas[1] ? 'Vrai' : 'Faux'} : ${/^\d/.test(cas[2]) ? cas[2] : cas[2][0].toLowerCase() + cas[2].slice(1)}`,
    };
  }),
  forme((rng) => {
    const k = rng.pick([2, 3, 4, 5, 1.5, 2.5, 6]);
    const xs = rng.shuffle(range(1, 10)).slice(0, 3).sort((a, b) => a - b);
    const prop = rng.next() < 0.5;
    const ys = xs.map((x, i) => r(x * k + (prop || i === 0 ? 0 : rng.pick([1, -1, 2]))));
    if (!prop && ys.every((y, i) => Math.abs(y - xs[i] * k) < 1e-9)) return null;
    return {
      type: 'vrai_faux', difficulte: 3,
      enonce: `Vrai ou faux ? Ce tableau est un tableau de proportionnalité : ${xs.map((x, i) => `${x} → ${fmt(ys[i])}`).join(' ; ')}.`,
      reponse: prop,
      explication: prop ? `On multiplie toujours par ${fmt(k)} : ${xs.map((x, i) => `${x} × ${fmt(k)} = ${fmt(ys[i])}`).join(' ; ')}.`
        : `${fmt(ys[0])} : ${xs[0]} = ${fmt(k)}, mais ${xs.map((x, i) => [x, ys[i]]).filter(([x, y]) => Math.abs(y - x * k) > 1e-9).map(([x, y]) => `${x} × ${fmt(k)} = ${fmt(r(x * k))} et pas ${fmt(y)}`).join(' ; ')}. Le coefficient n'est pas toujours le même.`,
    };
  }),
]);

const VILLES_TEMP = ['Bruxelles', 'Arlon', 'Ostende', 'Liège', 'Namur', 'Mons', 'Bastogne', 'Oslo', 'Moscou', 'Madrid', 'Rome', 'Helsinki'];
const signe = (t) => (t < 0 ? `−${Math.abs(t)}` : `${t}`);
const temperatures = famille([
  forme((rng) => {
    const a = rng.int(-12, 5); const b = rng.int(a + 2, Math.min(20, a + 16));
    const moment = rng.pick([['Le matin', "l'après-midi"], ['À 6 h', 'à 15 h'], ['La nuit', 'à midi']]);
    return {
      type: 'numerique', unite: '°C', difficulte: 2,
      enonce: `${moment[0]}, le thermomètre indique ${signe(a)} °C et ${moment[1]} ${signe(b)} °C. De combien de degrés la température a-t-elle augmenté ?`,
      reponse: b - a,
      explication: b <= 0 ? `On monte de ${signe(a)} °C à ${signe(b)} °C : ${b - a} degrés (compte les graduations sur le thermomètre).` : a < 0 ? `De ${signe(a)} °C à 0 °C : ${-a} degrés. De 0 °C à ${b} °C : ${b} degrés. ${-a} + ${b} = ${b - a} degrés.` : `${b} − ${a} = ${b - a} degrés.`,
    };
  }, 2),
  forme((rng) => {
    const a = rng.int(-5, 12); const d = rng.int(3, 15);
    const baisse = rng.next() < 0.7;
    const res = baisse ? a - d : a + d;
    // Réponse négative : on la propose en QCM (la saisie du signe − est peu pratique).
    const choixNeg = res < 0 ? qcm(rng, `${signe(res)} °C`, [`${signe(-res)} °C`, `${signe(res + 1)} °C`, `${signe(res - 1)} °C`, `${signe(a + d)} °C`]) : null;
    return {
      ...(choixNeg ?? {}),
      type: res < 0 ? 'qcm' : 'numerique', unite: res < 0 ? undefined : '°C', difficulte: 2,
      enonce: `Il fait ${signe(a)} °C. La température ${baisse ? 'baisse' : 'monte'} de ${d} degrés. Quelle température fait-il maintenant ?`,
      reponse: choixNeg ? choixNeg.reponse : res,
      explication: `${signe(a)} ${baisse ? '−' : '+'} ${d} = ${signe(res)} °C.${res < 0 && baisse ? ' Sous 0, on compte vers le bas : plus le nombre après le signe − est grand, plus il fait froid.' : ''}`,
    };
  }, 2),
  forme((rng) => {
    const villes = rng.shuffle(VILLES_TEMP).slice(0, 4);
    const ts = rng.shuffle(dedoublonner(range(1, 10).map(() => rng.int(-15, 12)))).slice(0, 4);
    if (ts.length < 4 || !ts.some((t) => t < 0)) return null;
    const froid = rng.next() < 0.6;
    const cible = froid ? Math.min(...ts) : Math.max(...ts);
    const i = ts.indexOf(cible);
    return {
      type: 'qcm', choix: villes, reponse: i, difficulte: 2,
      enonce: `Températures relevées un matin d'hiver : ${villes.map((v, k) => `${v} ${signe(ts[k])} °C`).join(' ; ')}. Où fait-il le plus ${froid ? 'froid' : 'chaud'} ?`,
      explication: `${froid ? 'La température la plus basse' : 'La température la plus haute'} est ${signe(cible)} °C, à ${villes[i]}. Attention : −12 °C est plus froid que −3 °C.`,
    };
  }),
  forme((rng) => {
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
    const ts = jours.map(() => rng.int(-8, 10));
    const max = Math.max(...ts); const min = Math.min(...ts);
    if (min >= 0 || max === min) return null;
    return {
      type: 'numerique', unite: '°C', difficulte: 3,
      enonce: `Températures à midi pendant une semaine : ${jours.map((j, i) => `${j} ${signe(ts[i])} °C`).join(', ')}. Quel est l'écart entre la température la plus haute et la plus basse ?`,
      reponse: max - min,
      explication: `Plus haute : ${signe(max)} °C. Plus basse : ${signe(min)} °C. Écart : ${max >= 0 ? `de ${signe(min)} à 0 : ${-min} degrés, puis de 0 à ${max} : ${max} degrés. ${-min} + ${max} = ${max - min}` : `de ${signe(min)} à ${signe(max)}, on monte de ${max - min}`} degrés.`,
    };
  }),
  forme((rng) => {
    const ts = rng.shuffle(dedoublonner(range(1, 12).map(() => rng.int(-15, 15)))).slice(0, 4);
    if (ts.length < 4 || ts.filter((t) => t < 0).length < 2) return null;
    const idx = ts.map((_, i) => i).sort((i, j) => ts[i] - ts[j]);
    return {
      type: 'ordre', difficulte: 2,
      enonce: 'Range ces températures de la plus froide à la plus chaude.',
      elements: ts.map((t) => `${signe(t)} °C`), reponse: idx,
      explication: `${idx.map((i) => `${signe(ts[i])} °C`).join(' < ')}. Sous zéro, plus le nombre est grand, plus il fait froid.`,
    };
  }),
]);

// Problèmes à plusieurs étapes, contextes variés.
const problemes = famille([
  forme((rng) => {
    const P = rng.pick(PRENOMS);
    const a1 = rng.pick([['cahiers', 1.2, 3.5], ['classeurs', 2.5, 5], ['bics', 0.8, 2.5], ['gommes', 0.5, 1.5], ['marqueurs', 1, 3]]);
    const a2 = rng.pick([['une trousse', 4, 12], ['un compas', 3, 9], ['une calculatrice', 8, 20], ['un agenda', 5, 12], ['une latte', 1, 3]]);
    const n = rng.int(2, 6);
    const p1 = decimal(rng, a1[1], a1[2], 2); const p2 = decimal(rng, a2[1], a2[2], 2);
    if (Math.round(p1 * 100) % 5 || Math.round(p2 * 100) % 5) return null;
    const tot = Math.round((n * p1 + p2) * 100) / 100;
    const billet = [20, 50].find((b) => b > tot);
    if (!billet) return null;
    const rendu = Math.round((billet - tot) * 100) / 100;
    return {
      type: 'numerique', unite: '€', difficulte: 2,
      enonce: `${P.n} achète ${n} ${a1[0]} à ${eur(p1)} pièce et ${a2[1] === 1 ? '' : ''}${a2[0]} à ${eur(p2)}. ${P.il === 'elle' ? 'Elle' : 'Il'} paie avec un billet de ${billet} €. Combien lui rend-on ?`,
      reponse: rendu,
      explication: `${n} × ${eur(p1)} = ${eur(n * p1)}. Total : ${eur(n * p1)} + ${eur(p2)} = ${eur(tot)}. Rendu : ${billet} − ${fmt(tot)} = ${eur(rendu)}.`,
    };
  }),
  forme((rng) => {
    const n = rng.int(18, 28); const car = rng.int(20, 60) * 10; const entree = decimal(rng, 3, 12, 1);
    if ((car * 100) % n) return null;
    const lieu = rng.pick(['au zoo', 'à la mer', 'au musée', 'dans un parc d\'attractions', 'à la ferme pédagogique', 'au château']);
    const parEleve = r(car / n + entree);
    if (nbDecimales(parEleve) > 2) return null;
    return {
      type: 'numerique', unite: '€', difficulte: 3,
      enonce: `Une classe de ${n} élèves part en excursion ${lieu}. Le car coûte ${car} € pour toute la classe et l'entrée coûte ${eur(entree)} par élève. Combien chaque élève doit-il payer ?`,
      reponse: parEleve,
      explication: `Car par élève : ${car} : ${n} = ${eur(car / n)}. Plus l'entrée : ${fmt(r(car / n))} + ${fmt(entree)} = ${eur(parEleve)}.`,
    };
  }),
  forme((rng) => {
    const P = rng.pick(PRENOMS);
    const jeu = rng.pick(['un jeu vidéo', 'un vélo', 'une console', 'des rollers', 'un skateboard', 'une tablette']);
    const prix = rng.int(6, 40) * 10; const a = rng.int(0, 10) * 5; const s = rng.pick([5, 7.5, 10, 12.5, 15, 20]);
    if (a >= prix) return null;
    const sem = Math.ceil((prix - a) / s);
    if (sem > 30 || sem < 2) return null;
    return {
      type: 'numerique', unite: 'semaines', difficulte: 3,
      enonce: `${P.n} veut acheter ${jeu} à ${prix} €. ${P.il === 'elle' ? 'Elle' : 'Il'} a déjà ${a} € et économise ${eur(s)} par semaine. Au bout de combien de semaines aura-t-${P.il} assez d'argent ?`,
      reponse: sem,
      explication: Number.isInteger((prix - a) / s) ? `Il manque ${prix} − ${a} = ${prix - a} €. ${prix - a} : ${fmt(s)} = ${sem} semaines.` : `Il manque ${prix} − ${a} = ${prix - a} €. Après ${sem - 1} semaines, ${P.il} a économisé ${eur((sem - 1) * s)} : pas encore assez. Après ${sem} semaines : ${eur(sem * s)}, c'est suffisant. Réponse : ${sem} semaines.`,
    };
  }),
  forme((rng) => {
    const conso = rng.pick([5, 6, 7, 8]); const km = rng.pick([150, 200, 250, 300, 350, 400, 450, 500]); const prix = decimal(rng, 1.6, 2, 2);
    if (Math.round(prix * 100) % 5) return null;
    const litres = conso * km / 100;
    if (Math.round(litres * prix * 1000) % 10) return null; // prix exact au centime (pas d'arrondi caché)
    const cout = Math.round(litres * prix * 100) / 100;
    return {
      type: 'numerique', unite: '€', difficulte: 3,
      enonce: `Une voiture consomme ${conso} litres d'essence pour 100 km. Le litre coûte ${eur(prix)}. Combien coûte l'essence pour un trajet de ${km} km ?`,
      reponse: cout,
      explication: `Litres : ${km} km = ${fmt(km / 100)} × 100 km, donc ${fmt(km / 100)} × ${conso} = ${fmt(litres)} l. Prix : ${fmt(litres)} × ${fmt(prix)} = ${eur(cout)}.`,
    };
  }),
  forme((rng) => {
    const P = rng.pick(PRENOMS);
    const repas = decimal(rng, 2.5, 4.5, 2); const jours = rng.pick([2, 3, 4]); const sem = rng.int(3, 8);
    if (Math.round(repas * 100) % 10) return null;
    const tot = Math.round(repas * jours * sem * 100) / 100;
    return {
      type: 'numerique', unite: '€', difficulte: 2,
      enonce: `Un repas à la cantine coûte ${eur(repas)}. ${P.n} mange à la cantine ${jours} jours par semaine pendant ${sem} semaines. Combien cela coûte-t-il en tout ?`,
      reponse: tot,
      explication: `Nombre de repas : ${jours} × ${sem} = ${jours * sem}. Prix : ${jours * sem} × ${eur(repas)} = ${eur(tot)}.`,
    };
  }),
  forme((rng) => {
    const adultes = rng.int(1, 3); const enfants = rng.int(1, 4);
    const pa = rng.int(8, 16); const pe = rng.int(4, pa - 2);
    const lieu = rng.pick(['au cinéma', 'à la piscine', 'au musée', 'au zoo', 'au bowling']);
    const reduc = rng.next() < 0.4 ? rng.pick([5, 10]) : 0;
    const tot = adultes * pa + enfants * pe - reduc;
    return {
      type: 'numerique', unite: '€', difficulte: 2,
      enonce: `Une famille de ${adultes} ${pluriel(adultes, 'adulte')} et ${enfants} ${pluriel(enfants, 'enfant')} va ${lieu}. L'entrée coûte ${pa} € par adulte et ${pe} € par enfant.${reduc ? ` La famille a un bon de réduction de ${reduc} €.` : ''} Combien paie la famille ?`,
      reponse: tot,
      explication: `Adultes : ${adultes} × ${pa} = ${adultes * pa} €. Enfants : ${enfants} × ${pe} = ${enfants * pe} €. Total : ${adultes * pa} + ${enfants * pe}${reduc ? ` − ${reduc}` : ''} = ${tot} €.`,
    };
  }),
  forme((rng) => {
    const equipes = rng.int(2, 6); const joueurs = rng.pick([5, 6, 7, 11, 15]); const maillots = rng.int(1, 2); const prix = rng.int(12, 30);
    const tot = equipes * joueurs * maillots * prix;
    const sport = { 5: 'basket', 6: 'volley', 7: 'handball', 11: 'football', 15: 'rugby' }[joueurs];
    return {
      type: 'numerique', unite: '€', difficulte: 2,
      enonce: `Un club de ${sport} a ${equipes} équipes de ${joueurs} joueurs. Chaque joueur reçoit ${maillots === 1 ? 'un maillot' : '2 maillots'} à ${prix} € pièce. Combien le club dépense-t-il ?`,
      reponse: tot,
      explication: `Joueurs : ${equipes} × ${joueurs} = ${equipes * joueurs}. Maillots : ${equipes * joueurs} × ${maillots} = ${equipes * joueurs * maillots}. Prix : ${equipes * joueurs * maillots} × ${prix} = ${fmt(tot)} €.`,
    };
  }),
  forme((rng) => {
    const enfants = rng.int(3000, 15000); const n1 = rng.int(1000, Math.floor(enfants / 2)); const ad1 = rng.int(5000, 25000); const ad2 = rng.int(5000, 25000);
    const pays = rng.pick(['la Norvège', 'la France', "l'Espagne", 'les Pays-Bas', "l'Italie"]);
    const tot = enfants + ad1 + ad2;
    return {
      type: 'numerique', unite: 'spectateurs', difficulte: 3,
      enonce: `Lors d'un match Belgique – ${pays[0] === 'l' && pays[1] === "'" ? pays.slice(2)[0].toUpperCase() + pays.slice(3) : pays.replace(/^(la|les) /, '').replace(/^\w/, (c) => c.toUpperCase())}, il y a ${fmt(enfants)} enfants dans les gradins, dont ${fmt(n1)} supportent ${pays}. ${pays[0].toUpperCase() + pays.slice(1)} ${pays.startsWith('les') ? 'sont aussi encouragés' : 'est aussi encouragée'} par ${fmt(ad1)} adultes et la Belgique par ${fmt(ad2)} adultes. Combien y a-t-il de spectateurs en tout ?`,
      reponse: tot,
      explication: `Tous les enfants : ${fmt(enfants)}. Tous les adultes : ${fmt(ad1)} + ${fmt(ad2)} = ${fmt(ad1 + ad2)}. Total : ${fmt(enfants)} + ${fmt(ad1 + ad2)} = ${fmt(tot)}. Le nombre ${fmt(n1)} ne sert pas : il est déjà compté dans les enfants !`,
    };
  }),
]);

// ---------------------------------------------------------------------------
// GÉOMÉTRIE : triangles et angles
// ---------------------------------------------------------------------------
const NATURES = ['équilatéral', 'isocèle', 'scalène'];
const triangles = famille([
  forme((rng) => {
    const t = rng.int(0, 2);
    let c;
    if (t === 0) { const a = rng.int(3, 15); c = [a, a, a]; }
    else if (t === 1) { const a = rng.int(4, 15); let b = rng.int(3, 2 * a - 1); if (b === a) b++; c = rng.shuffle([a, a, b]); }
    else { const s = rng.shuffle(range(3, 15)).slice(0, 3).sort((x, y) => x - y); if (s[0] + s[1] <= s[2]) return null; c = rng.shuffle(s); }
    if (t === 1) { const [x, , z] = [...c].sort((p, q) => p - q); if (x + [...c].sort((p, q) => p - q)[1] <= z) return null; }
    return {
      type: 'qcm', choix: NATURES, reponse: t, difficulte: 1,
      enonce: `Un triangle a des côtés de ${c[0]} cm, ${c[1]} cm et ${c[2]} cm. Quel est le nom le plus précis de ce triangle ?`,
      explication: `${t === 0 ? "Ses 3 côtés sont égaux : c'est un triangle équilatéral (c'est aussi un triangle isocèle particulier, mais « équilatéral » est plus précis)" : t === 1 ? "Il a exactement 2 côtés égaux : c'est un triangle isocèle" : "Ses 3 côtés sont de longueurs différentes : c'est un triangle scalène"}.`,
    };
  }, 2),
  forme((rng) => {
    const a = rng.int(20, 110); const b = rng.int(20, 150 - a);
    const c = 180 - a - b;
    if (c <= 0) return null;
    return {
      type: 'numerique', unite: '°', difficulte: 2,
      enonce: `Dans un triangle, deux angles mesurent ${a}° et ${b}°. Combien mesure le troisième angle ?`,
      reponse: c,
      explication: `La somme des angles d'un triangle vaut toujours 180°. 180 − ${a} − ${b} = ${c}°.`,
    };
  }, 2),
  forme((rng) => {
    const t = rng.int(0, 2);
    if (t === 0) {
      const a = rng.int(20, 70);
      return { type: 'numerique', unite: '°', difficulte: 3, enonce: `Dans un triangle rectangle, un des angles aigus mesure ${a}°. Combien mesure l'autre angle aigu ?`, reponse: 90 - a, explication: `Un angle droit mesure 90°. Il reste 180 − 90 = 90° pour les deux autres angles : 90 − ${a} = ${90 - a}°.` };
    }
    if (t === 1) {
      const s = rng.int(10, 80) * 2 + (rng.next() < 0.5 ? 0 : 0);
      if (s >= 180) return null;
      return { type: 'numerique', unite: '°', difficulte: 3, enonce: `Dans un triangle isocèle, l'angle au sommet principal mesure ${s}°. Combien mesure chacun des deux angles à la base ?`, reponse: (180 - s) / 2, explication: `Les deux angles à la base sont égaux. 180 − ${s} = ${180 - s}° ; ${180 - s} : 2 = ${(180 - s) / 2}°.` };
    }
    return { type: 'numerique', unite: '°', difficulte: 2, enonce: 'Dans un triangle équilatéral, combien mesure chaque angle ?', reponse: 60, explication: 'Les 3 angles sont égaux : 180 : 3 = 60°.' };
  }),
  forme((rng) => {
    const cas = rng.pick([
      ['Un triangle peut avoir deux angles droits.', false, 'Deux angles droits font déjà 180° : il ne resterait rien pour le 3e angle.'],
      ['Un triangle équilatéral est aussi isocèle.', true, 'Il a au moins deux côtés égaux (il en a même trois).'],
      ['Un triangle rectangle peut être isocèle.', true, 'Par exemple, la moitié d\'un carré coupé par une diagonale.'],
      ['Un triangle peut avoir un angle obtus et un angle droit.', false, 'Un angle obtus + un angle droit dépassent 180°.'],
      ['Un triangle équilatéral peut avoir un angle droit.', false, 'Ses 3 angles mesurent toujours 60°.'],
      ['Dans un triangle, la somme des angles vaut 180°.', true, "C'est vrai pour tous les triangles."],
      ['Un triangle scalène a deux côtés de même longueur.', false, 'Un triangle scalène a 3 côtés de longueurs différentes.'],
      ['Un triangle isocèle a au moins un axe de symétrie.', true, "L'axe passe par le sommet principal et le milieu de la base."],
      ['Un triangle peut avoir deux angles obtus.', false, 'Deux angles obtus dépassent déjà 180°.'],
      ['Un triangle équilatéral a 3 axes de symétrie.', true, 'Chaque axe passe par un sommet et le milieu du côté opposé.'],
      ['Un triangle scalène a un axe de symétrie.', false, "Ses côtés sont tous différents : il n'a aucun axe de symétrie."],
    ]);
    return { type: 'vrai_faux', difficulte: 2, enonce: `Vrai ou faux ? ${cas[0]}`, reponse: cas[1], explication: cas[2] };
  }),
  forme((rng) => {
    const t = rng.int(0, 2);
    let ang;
    if (t === 0) { const a = rng.int(20, 70); ang = [90, a, 90 - a]; }
    else if (t === 1) { const a = rng.int(95, 140); const b = rng.int(10, 180 - a - 10); ang = [a, b, 180 - a - b]; }
    else { const a = rng.int(40, 80); const b = rng.int(Math.max(40, 91 - a), 89); if (180 - a - b >= 90 || 180 - a - b <= 0) return null; ang = [a, b, 180 - a - b]; }
    ang = rng.shuffle(ang);
    const choix = ['il a un angle droit', 'il a un angle obtus', 'ses 3 angles sont aigus'];
    return {
      type: 'qcm', choix, reponse: t, difficulte: 2,
      enonce: `Un triangle a des angles de ${ang[0]}°, ${ang[1]}° et ${ang[2]}°. Que peux-tu dire de ce triangle ?`,
      explication: t === 0 ? 'Il a un angle de 90° : c\'est un triangle rectangle.' : t === 1 ? `Il a un angle de plus de 90° (${Math.max(...ang)}°) : c'est un angle obtus.` : 'Ses 3 angles mesurent moins de 90° : ils sont tous aigus.',
    };
  }),
]);

const angles = famille([
  forme((rng) => {
    const a = rng.pick([rng.int(5, 89), 90, rng.int(91, 179), 180, rng.int(10, 85), rng.int(95, 170)]);
    const nat = a < 90 ? 'aigu' : a === 90 ? 'droit' : a < 180 ? 'obtus' : 'plat';
    const choix = ['aigu', 'droit', 'obtus', 'plat'];
    return {
      type: 'qcm', choix, reponse: choix.indexOf(nat), difficulte: 1,
      enonce: `Un angle de ${a}° est un angle…`,
      explication: `Aigu : moins de 90°. Droit : 90°. Obtus : entre 90° et 180°. Plat : 180°. ${a}° : angle ${nat}.`,
    };
  }, 2),
  forme((rng) => {
    const a = rng.int(50, 130); const b = rng.int(50, 130); const c = rng.int(50, 130);
    const d = 360 - a - b - c;
    if (d <= 20 || d >= 180) return null;
    return {
      type: 'numerique', unite: '°', difficulte: 3,
      enonce: `Dans un quadrilatère, trois angles mesurent ${a}°, ${b}° et ${c}°. Combien mesure le quatrième angle ?`,
      reponse: d,
      explication: `La somme des angles d'un quadrilatère vaut 360° (c'est 2 triangles). 360 − ${a} − ${b} − ${c} = ${d}°.`,
    };
  }),
  forme((rng) => {
    const h = rng.int(1, 11);
    const ecart = Math.min(h, 12 - h) * 30;
    return {
      type: 'numerique', unite: '°', difficulte: 3,
      enonce: `Il est exactement ${h} h. Quelle est la mesure du plus petit angle formé par les deux aiguilles de l'horloge ?`,
      reponse: ecart,
      explication: `Le cadran est partagé en 12 heures : 360 : 12 = 30° entre deux heures. Les aiguilles sont séparées de ${Math.min(h, 12 - h)} ${pluriel(Math.min(h, 12 - h), 'heure')} : ${Math.min(h, 12 - h)} × 30 = ${ecart}°.`,
    };
  }),
  forme((rng) => {
    const plat = rng.next() < 0.5;
    const tot = plat ? 180 : 90;
    const a = rng.int(10, tot - 10);
    return {
      type: 'numerique', unite: '°', difficulte: 2,
      enonce: `Deux angles placés côte à côte forment ensemble un angle ${plat ? 'plat' : 'droit'}. L'un mesure ${a}°. Combien mesure l'autre ?`,
      reponse: tot - a,
      explication: `Un angle ${plat ? 'plat' : 'droit'} mesure ${tot}°. ${tot} − ${a} = ${tot - a}°.`,
    };
  }),
  forme((rng) => {
    const cas = rng.pick([
      ['un quart de tour', 90], ['un demi-tour', 180], ['un tour complet', 360], ['trois quarts de tour', 270],
      ["l'angle de chaque coin d'une feuille A4", 90], ["chaque angle d'un carré", 90], ["chaque angle d'un triangle équilatéral", 60],
    ]);
    return { type: 'numerique', unite: '°', difficulte: 1, enonce: `Combien de degrés mesure ${cas[0]} ?`, reponse: cas[1], explication: `Un tour complet = 360° ; un demi-tour = 180° ; un quart de tour = 90° (angle droit). Réponse : ${cas[1]}°.` };
  }),
]);

// ---------------------------------------------------------------------------
// TRAITEMENT DE DONNÉES
// ---------------------------------------------------------------------------
const CONTEXTES_DONNEES = [
  { titre: 'Livres lus pendant les vacances', noms: () => null, u: 'livres', min: 1, max: 15, q: ['Qui a lu le plus de livres ?', 'Qui a lu le moins de livres ?'] },
  { titre: 'Buts marqués cette saison', noms: () => null, u: 'buts', min: 2, max: 30, q: ['Qui a marqué le plus de buts ?', 'Qui a marqué le moins de buts ?'] },
  { titre: 'Élèves inscrits par activité', noms: () => ['football', 'natation', 'danse', 'judo', 'théâtre', 'basket'], u: 'élèves', min: 5, max: 40, q: ["Quelle activité a le plus d'inscrits ?", "Quelle activité a le moins d'inscrits ?"] },
  { titre: "Visiteurs d'un musée", noms: () => ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'], u: 'visiteurs', min: 40, max: 400, q: ['Quel jour y a-t-il eu le plus de visiteurs ?', 'Quel jour y a-t-il eu le moins de visiteurs ?'] },
  { titre: 'Glaces vendues par parfum', noms: () => ['vanille', 'chocolat', 'fraise', 'pistache', 'citron', 'moka'], u: 'glaces', min: 12, max: 90, q: ['Quel parfum a été le plus vendu ?', 'Quel parfum a été le moins vendu ?'] },
  { titre: 'Pluie tombée par mois (en mm)', noms: () => ['janvier', 'février', 'mars', 'avril', 'mai', 'juin'], u: 'mm', min: 30, max: 95, q: ['Quel mois a été le plus pluvieux ?', 'Quel mois a été le moins pluvieux ?'] },
];
const tableauxDonnees = famille([
  forme((rng) => {
    const ctx = rng.pick(CONTEXTES_DONNEES);
    const n = rng.int(4, 5);
    const noms = (ctx.noms() ?? rng.shuffle(PRENOMS).map((p) => p.n)).slice(0, 6);
    const lignes = rng.shuffle(noms).slice(0, n);
    const vals = dedoublonner(range(1, 20).map(() => rng.int(ctx.min, ctx.max))).slice(0, n);
    if (vals.length < n) return null;
    const table = lignes.map((l, i) => `${l} : ${vals[i]}`).join(' ; ');
    const t = rng.int(0, 3);
    const iMax = vals.indexOf(Math.max(...vals)); const iMin = vals.indexOf(Math.min(...vals));
    const intro = `${ctx.titre} — ${table}.`;
    if (t === 0) {
      const max = rng.next() < 0.5; const i = max ? iMax : iMin;
      return { type: 'qcm', choix: lignes, reponse: i, difficulte: 1, enonce: `${intro} ${ctx.q[max ? 0 : 1]}`, explication: `On compare toutes les valeurs : la plus ${max ? 'grande' : 'petite'} est ${vals[i]} (${lignes[i]}).` };
    }
    if (t === 1) {
      const tot = vals.reduce((a, b) => a + b, 0);
      return { type: 'numerique', unite: ctx.u, difficulte: 1, enonce: `${intro} Quel est le total ?`, reponse: tot, explication: `${vals.join(' + ')} = ${fmt(tot)}.` };
    }
    if (t === 2) {
      const [a, b] = rng.shuffle(range(0, n - 1)).slice(0, 2);
      const [g, p] = vals[a] > vals[b] ? [a, b] : [b, a];
      return { type: 'numerique', unite: ctx.u, difficulte: 2, enonce: `${intro} Quelle est la différence entre ${lignes[g]} et ${lignes[p]} ?`, reponse: vals[g] - vals[p], explication: `${vals[g]} − ${vals[p]} = ${vals[g] - vals[p]}.` };
    }
    return { type: 'numerique', unite: ctx.u, difficulte: 2, enonce: `${intro} Quel est l'écart entre la plus grande et la plus petite valeur ?`, reponse: vals[iMax] - vals[iMin], explication: `Plus grande : ${vals[iMax]} ; plus petite : ${vals[iMin]}. ${vals[iMax]} − ${vals[iMin]} = ${vals[iMax] - vals[iMin]}.` };
  }, 3),
  forme((rng) => {
    const n = rng.pick([3, 4, 5]);
    const vals = range(1, n).map(() => rng.int(8, 20));
    const s = vals.reduce((a, b) => a + b, 0);
    if (s % n) return null;
    const P = rng.pick(PRENOMS);
    const ctx = rng.pick([['points', `${P.n} a obtenu ces notes sur 20 :`, 'Quelle est sa moyenne sur 20 ?'], ['km', `${P.n} a parcouru ces distances à vélo pendant ${n} jours :`, 'Combien de kilomètres a-t-' + P.il + ' parcourus en moyenne par jour ?'], ['°C', `Températures relevées pendant ${n} jours :`, 'Quelle est la température moyenne ?']]);
    return {
      type: 'numerique', unite: ctx[0] === 'points' ? undefined : ctx[0], difficulte: 2,
      enonce: `${ctx[1]} ${vals.join(' ; ')}. ${ctx[2]}`,
      reponse: s / n,
      explication: `Moyenne = somme : nombre de valeurs. (${vals.join(' + ')}) : ${n} = ${s} : ${n} = ${s / n}.`,
    };
  }),
  forme((rng) => {
    const total = rng.pick([20, 25, 50, 40, 200]);
    const cats = rng.pick([['vélo', 'voiture', 'à pied', 'bus'], ['chien', 'chat', 'poisson', 'aucun animal'], ['football', 'natation', 'danse', 'autre sport']]);
    const p1 = rng.pick([10, 20, 25, 30, 40, 50]);
    const k = total * p1 / 100;
    if (!Number.isInteger(k)) return null;
    const cible = rng.pick(cats);
    const inverse = rng.next() < 0.5;
    return inverse ? {
      type: 'numerique', unite: '%', difficulte: 3,
      enonce: `On a interrogé ${total} élèves. ${k} ont répondu « ${cible} ». Quel pourcentage des élèves cela représente-t-il ?`,
      reponse: p1,
      explication: `${k} sur ${total} = ${fr(k, total)} = ${fr(p1, 100)} = ${p1} %.`,
    } : {
      type: 'numerique', difficulte: 2,
      enonce: `On a interrogé ${total} élèves. Dans un diagramme circulaire, la part « ${cible} » représente ${p1} %. Combien d'élèves ont répondu « ${cible} » ?`,
      reponse: k,
      explication: `${p1} % de ${total} = ${total} × ${p1} : 100 = ${k} élèves.`,
    };
  }),
  forme((rng) => {
    const ages = range(1, rng.int(8, 12)).map(() => rng.int(10, 13));
    const age = rng.pick(dedoublonner(ages));
    const eff = ages.filter((a) => a === age).length;
    return {
      type: 'numerique', unite: 'élèves', difficulte: 1,
      enonce: `Voici l'âge des élèves d'un groupe : ${ages.join(' ; ')}. Combien d'élèves ont ${age} ans ? (C'est l'effectif de la valeur ${age}.)`,
      reponse: eff,
      explication: `On compte les ${age} : il y en a ${eff}. L'effectif, c'est le nombre de fois qu'une valeur apparaît.`,
    };
  }),
]);


export const GENERATEURS = {
  ma_nombres_lettres: nombresLettres,
  ma_valeur_position: valeurPosition,
  ma_decomposer: decomposer,
  ma_arrondir: arrondir,
  ma_comparer_decimaux: comparerDecimaux,
  ma_intercaler: intercaler,
  ma_droite_graduee: droiteGraduee,
  ma_suites: suites,
  ma_fractions_equivalentes: fractionsEquivalentes,
  ma_comparer_fractions: comparerFractions,
  ma_frac_dec_pct: fracDecPct,
  ma_fraction_grandeur: fractionGrandeur,
  ma_addition_fractions: additionFractions,
  ma_calcul_ecrit: calculEcrit,
  ma_calcul_mental: calculMental,
  ma_proprietes: proprietes,
  ma_estimation: estimation,
  ma_terme_manquant: termeManquant,
  ma_priorites: priorites,
  ma_multiples_diviseurs: multiplesDiviseurs,
  ma_ppcm_pgcd: ppcmPgcd,
  ma_divisibilite: divisibilite,
  ma_mesures: mesures,
  ma_mesures_realistes: mesuresRealistes,
  ma_aires_volumes: airesVolumes,
  ma_figures: figures,
  ma_cercle: cercle,
  ma_durees: durees,
  ma_calendrier: calendrier,
  ma_achats: achats,
  ma_pourcentages: pourcentages,
  ma_echelle: echelle,
  ma_vitesse: vitesse,
  ma_proportionnalite: proportionnalite,
  ma_temperatures: temperatures,
  ma_problemes: problemes,
  ma_triangles: triangles,
  ma_angles: angles,
  ma_donnees: tableauxDonnees,
};
