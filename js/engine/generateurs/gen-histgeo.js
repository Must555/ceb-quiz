// Générateurs JS spécifiques (histgeo). Chaque entrée : nom → fonction (modele, rng) => question | null.
// La question renvoyée doit contenir _signature (texte stable, unique par variante).
//
//   hg_evenements  : siècles, avant/après, le plus ancien, durées (base « hg-evenements »)
//   hg_orientation : rose des vents à 8 directions (rotations, opposés, directions intermédiaires)
//   hg_position    : direction d'une ville par rapport à une autre (base « hg-villes », vraies coordonnées)
//                    et déplacements sur un plan quadrillé
//   hg_echelle     : échelle d'une carte (carte ↔ réalité)
//   hg_densite     : densité de population (vraies données 2024 arrondies, ou commune imaginaire)
//   hg_latitude    : zones thermiques à partir d'une latitude
//   hg_banque      : questions à choix multiples dont les mauvaises réponses sont tirées dans une réserve
//   hg_melange     : tire au hasard un des générateurs ci-dessus (plusieurs notions voisines dans une seule famille)

import { formatNombre as n } from '../format.js';
import { romain } from './histoire.js';

// `sorte` peut être une liste : on en tire une au hasard à chaque variante (répéter une entrée = plus de poids).
// Une entrée peut être un objet { sorte, ecartMin, belgique, fiche, difficulte } qui complète le modèle.
// La sorte est tirée par `envelopper` (voir en bas) ; dans les générateurs, `modele.sorte` est déjà une chaîne.
const sorteDe = (modele) => modele.sorte;
// « de » + nom propre, avec élision devant une voyelle (d'Arlon, d'Ypres ; mais de Huy).
const de = (nom) => (/^[AEIOUYÉÈÊÂÎ]/i.test(nom) ? `d'${nom}` : `de ${nom}`);
const maj = (s) => s.replace(/^([«\s]*)(\p{L})/u, (_, a, b) => a + b.toUpperCase());

// ---------------------------------------------------------------- histoire : événements
const siecleDe = (a) => Math.floor((a - 1) / 100) + 1;
const nomSiecle = (s) => (s === 1 ? 'Ier siècle' : `${romain(s)}e siècle`);
const ordinal = (s) => (s === 1 ? '1er' : `${s}e`);

function evenements(modele, rng) {
  const q = evenementsBrut(modele, rng);
  if (q?.explication) q.explication = q.explication.replace(/J\.-C\.\./g, 'J.-C.');
  return q;
}

function evenementsBrut(modele, rng) {
  const tous = modele.items ?? [];
  const exacts = tous.filter((e) => !e.approx);
  const base = modele.belgique ? tous.filter((x) => x.belgique) : tous;
  const ecart = modele.ecartMin ?? 100;

  switch (sorteDe(modele)) {
    case 'siecle': {
      const e = rng.pick(exacts.filter((x) => x.annee > 0));
      const s = siecleDe(e.annee);
      const faux = rng.shuffle([s - 1, s + 1, s + 2, s - 2].filter((x) => x >= 1 && x <= 21)).slice(0, 3);
      const choix = rng.shuffle([s, ...faux]).map(nomSiecle);
      const astuce = e.annee % 100 === 0
        ? ` Attention : ${e.annee} est la dernière année du ${nomSiecle(s)}. Pour une année qui se termine par 00, le siècle est simplement le nombre de centaines : ${s}.`
        : e.annee < 100
          ? ` Astuce : ${e.annee} est avant 100, donc dans le tout premier siècle après J.-C.`
          : ` Astuce : dans ${e.annee}, il y a ${Math.floor(e.annee / 100)} centaine${Math.floor(e.annee / 100) > 1 ? 's' : ''} complète${Math.floor(e.annee / 100) > 1 ? 's' : ''} ; on ajoute 1 : ${s}.`;
      return {
        _signature: `siecle|${e.nom}`,
        type: 'qcm',
        enonce: `${maj(e.nom)} : ${e.date}. En quel siècle cet événement a-t-il eu lieu ?`,
        choix, reponse: choix.indexOf(nomSiecle(s)),
        explication: `Le ${nomSiecle(s)} (${ordinal(s)} siècle) va de ${(s - 1) * 100 + 1} à ${s * 100}.${astuce}`,
      };
    }
    case 'siecle_lequel': {
      const pos = exacts.filter((x) => x.annee > 0);
      const cible = rng.pick(pos);
      const s = siecleDe(cible.annee);
      const pris = []; const siecles = new Set([s]);
      for (const x of rng.shuffle(pos)) {
        if (siecles.has(siecleDe(x.annee))) continue;
        siecles.add(siecleDe(x.annee)); pris.push(x);
        if (pris.length === 3) break;
      }
      if (pris.length < 3) return null;
      const items = rng.shuffle([cible, ...pris]);
      const choix = items.map((x) => `${maj(x.nom)} (${x.date})`);
      return {
        _signature: `slequel|${s}|${items.map((x) => x.annee).sort().join(',')}`,
        cleContenu: `slequel|${s}|${items.map((x) => x.annee).sort().join(',')}`,
        type: 'qcm',
        enonce: `Lequel de ces événements s'est passé au ${nomSiecle(s)} ?`,
        choix, reponse: items.indexOf(cible),
        explication: `Le ${nomSiecle(s)} va de ${(s - 1) * 100 + 1} à ${s * 100} : ${cible.nom} (${cible.date}) en fait partie.`,
      };
    }
    case 'avant_apres': {
      const [a, b] = rng.shuffle(base).slice(0, 2);
      if (!a || !b || Math.abs(a.annee - b.annee) < ecart) return null;
      const avant = rng.next() < 0.5;
      const vrai = avant ? a.annee < b.annee : a.annee > b.annee;
      return {
        _signature: `aa|${a.nom}|${b.nom}|${avant}`,
        type: 'vrai_faux',
        enonce: `Vrai ou faux ? ${maj(a.nom)}${a.nom.includes(', ') ? ',' : ''} a eu lieu ${avant ? 'avant' : 'après'} ${b.nom}.`,
        reponse: vrai,
        explication: `${maj(a.nom)} : ${a.date} ; ${b.nom} : ${b.date}. Le premier événement a donc eu lieu ${a.annee < b.annee ? 'avant' : 'après'} le second.`,
      };
    }
    case 'premier': {
      const tires = rng.shuffle(base).slice(0, 3).sort((x, y) => x.annee - y.annee);
      if (tires.length < 3 || tires[1].annee - tires[0].annee < ecart || tires[2].annee - tires[1].annee < ecart) return null;
      const recent = rng.next() < 0.5;
      const bon = recent ? tires[2] : tires[0];
      const items = rng.shuffle(tires);
      const choix = items.map((x) => maj(x.nom));
      return {
        _signature: `premier|${recent}|${tires.map((x) => x.nom).join(',')}`,
        cleContenu: `premier|${recent}|${tires.map((x) => x.nom).join(',')}`,
        type: 'qcm',
        enonce: recent ? 'Lequel de ces événements est le plus récent ?' : "Lequel de ces événements s'est passé en premier ?",
        choix, reponse: items.indexOf(bon),
        explication: `Dans l'ordre : ${tires.map((x) => `${x.nom} (${x.date})`).join(', puis ')}.`,
      };
    }
    case 'duree': {
      // Durée entre deux événements aux dates exactes, tous deux avant J.-C. ou tous deux après J.-C.
      const [a, b] = rng.shuffle(exacts).slice(0, 2).sort((x, y) => x.annee - y.annee);
      if (!a || !b || b.annee - a.annee < 5 || (a.annee < 0 && b.annee > 0)) return null;
      const d = b.annee - a.annee;
      return {
        _signature: `duree|${a.nom}|${b.nom}`,
        type: 'numerique', reponse: d, unite: 'ans',
        enonce: `Combien d'années se sont écoulées entre ${a.nom} (${a.date}) et ${b.nom} (${b.date}) ?`,
        explication: a.annee > 0
          ? `On soustrait la date la plus ancienne de la plus récente : ${b.annee} − ${a.annee} = ${n(d)} ans.`
          : `Les deux dates sont avant J.-C. : on compte à rebours, ${-a.annee} − ${-b.annee} = ${n(d)} ans.`,
      };
    }
    case 'duree_jc': {
      // De av. J.-C. à apr. J.-C. : il n'y a pas d'an 0, donc |a| + b − 1.
      const a = rng.pick(exacts.filter((x) => x.annee < 0));
      const b = rng.pick(exacts.filter((x) => x.annee > 0 && x.annee < 1600));
      const d = b.annee - a.annee - 1;
      const faux = [...new Set([b.annee + a.annee, d + 100, d - 100, d + 10, d - 10])].filter((x) => x > 0 && x !== d && x !== d + 1);
      const choix = rng.shuffle([d, ...rng.shuffle(faux).slice(0, 3)]).map((x) => `${n(x)} ans`);
      return {
        _signature: `dureejc|${a.nom}|${b.nom}`,
        type: 'qcm', choix, reponse: choix.indexOf(`${n(d)} ans`),
        enonce: `Combien d'années se sont écoulées entre ${a.nom} (${a.date}) et ${b.nom} (${b.date}) ?`,
        explication: `De ${-a.annee} av. J.-C. à l'an 1 apr. J.-C., il y a ${n(-a.annee)} ans ; de l'an 1 à ${b.annee}, ${n(b.annee - 1)} ans. Total : ${n(-a.annee)} + ${n(b.annee - 1)} = ${n(d)} ans. Il n'y a pas d'an 0 : on passe directement de l'an 1 av. J.-C. à l'an 1 apr. J.-C.`,
      };
    }
    default: return null;
  }
}

// ---------------------------------------------------------------- orientation
const DIR = [
  { le: 'le nord', vers: 'vers le nord', au: 'au nord' },
  { le: 'le nord-est', vers: 'vers le nord-est', au: 'au nord-est' },
  { le: "l'est", vers: "vers l'est", au: "à l'est" },
  { le: 'le sud-est', vers: 'vers le sud-est', au: 'au sud-est' },
  { le: 'le sud', vers: 'vers le sud', au: 'au sud' },
  { le: 'le sud-ouest', vers: 'vers le sud-ouest', au: 'au sud-ouest' },
  { le: "l'ouest", vers: "vers l'ouest", au: "à l'ouest" },
  { le: 'le nord-ouest', vers: 'vers le nord-ouest', au: 'au nord-ouest' },
];
const mod8 = (i) => ((i % 8) + 8) % 8;
const NOM_DIR = ['Nord', 'Nord-est', 'Est', 'Sud-est', 'Sud', 'Sud-ouest', 'Ouest', 'Nord-ouest'];

function choixDirections(rng, bonne, proches = true) {
  const faux = proches
    ? [...new Set([bonne + 2, bonne - 2, bonne + 4, bonne + 1, bonne - 1, bonne + 6].map(mod8))].filter((i) => i !== bonne)
    : [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => i !== bonne);
  const choix = rng.shuffle([bonne, ...rng.shuffle(faux).slice(0, 3)]).map((i) => NOM_DIR[i]);
  return { choix, reponse: choix.indexOf(NOM_DIR[bonne]) };
}

const TOURS = [
  { nom: 'un huitième de tour', pas: 1 },
  { nom: 'un quart de tour', pas: 2 },
  { nom: 'un demi-tour', pas: 4 },
  { nom: 'trois quarts de tour', pas: 6 },
];

function orientation(modele, rng) {
  switch (sorteDe(modele)) {
    case 'rotation': {
      const depart = rng.int(0, 7);
      const t = rng.pick(TOURS);
      const droite = rng.next() < 0.5;
      if (t.pas === 4 && !droite) return null; // pour un demi-tour, le sens ne change rien
      const bonne = mod8(depart + (droite ? t.pas : -t.pas));
      const sens = t.pas === 4 ? '' : droite ? " vers la droite (sens des aiguilles d'une montre)" : " vers la gauche (sens inverse des aiguilles d'une montre)";
      const { choix, reponse } = choixDirections(rng, bonne);
      return {
        _signature: `rot|${depart}|${t.pas}|${droite}`,
        type: 'qcm',
        enonce: `Tu regardes ${DIR[depart].vers}. Tu fais ${t.nom}${sens}. Vers où regardes-tu maintenant ?`,
        choix, reponse,
        explication: `Sur la rose des vents à 8 directions, un huitième de tour fait passer à la direction voisine, un quart de tour à 2 crans (du nord à l'est), un demi-tour à 4 crans, trois quarts de tour à 6 crans. En partant ${DIR[depart].vers.replace('vers ', 'de ').replace('de le ', 'du ')}, tu regardes maintenant ${DIR[bonne].vers}.`,
      };
    }
    case 'oppose': {
      const d = rng.int(0, 7);
      const bonne = mod8(d + 4);
      const { choix, reponse } = choixDirections(rng, bonne);
      return {
        _signature: `opp|${d}`,
        type: 'qcm',
        enonce: `Quelle est la direction opposée ${DIR[d].le.replace(/^le /, 'au ').replace(/^l'/, "à l'")} ?`,
        choix, reponse,
        explication: `La direction opposée est à un demi-tour : ${DIR[d].le} et ${DIR[bonne].le} sont face à face sur la rose des vents.`,
      };
    }
    case 'entre': {
      const d = rng.int(0, 3) * 2;
      const e = mod8(d + 2);
      const bonne = mod8(d + 1);
      const inverse = rng.next() < 0.5;
      const { choix, reponse } = choixDirections(rng, bonne, false);
      const [x, y] = inverse ? [e, d] : [d, e];
      return {
        _signature: `entre|${x}|${y}`,
        type: 'qcm',
        enonce: `Quelle direction se trouve exactement entre ${DIR[x].le} et ${DIR[y].le} ?`,
        choix, reponse,
        explication: `Entre deux points cardinaux voisins se trouve un point intermédiaire : entre ${DIR[d].le} et ${DIR[e].le}, c'est ${DIR[bonne].le}.`,
      };
    }
    default: return null;
  }
}

// ---------------------------------------------------------------- position sur une carte
const COL = 'ABCDEFGH';

function position(modele, rng) {
  const sorte = sorteDe(modele);
  if (sorte === 'villes') {
    const villes = (modele.items ?? []).filter((v) => v.lat != null);
    const [a, b] = rng.shuffle(villes).slice(0, 2);
    if (!a || !b) return null;
    const dx = (b.lon - a.lon) * Math.cos((a.lat * Math.PI) / 180);
    const dy = b.lat - a.lat;
    if (Math.hypot(dx, dy) < 0.25) return null; // villes trop proches
    const angle = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360; // 0 = nord, 90 = est
    const secteur = Math.round(angle / 45) % 8;
    const ecartAxe = Math.abs(((angle - secteur * 45 + 540) % 360) - 180);
    if (ecartAxe > 10) return null; // direction pas assez nette : on évite l'ambiguïté
    const { choix, reponse } = choixDirections(rng, secteur);
    return {
      _signature: `villes|${a.nom}|${b.nom}`,
      type: 'qcm',
      enonce: `Sur une carte de la Belgique (nord en haut), dans quelle direction se trouve ${b.nom} par rapport à ${a.nom} ?`,
      choix, reponse,
      explication: `Pour aller ${de(a.nom)} à ${b.nom}, tu te diriges ${DIR[secteur].vers}. Autrement dit, ${b.nom} est ${DIR[secteur].au} ${de(a.nom)}.`,
    };
  }
  if (sorte === 'quadrillage') {
    const lieux = ["l'école", 'la piscine', 'la gare', 'la bibliothèque', 'le parc', "l'hôtel de ville", 'la boulangerie', 'le stade', "l'église", 'le musée'];
    const [la, lb] = rng.shuffle(lieux).slice(0, 2);
    const deLa = la.startsWith('le ') ? `du ${la.slice(3)}` : `de ${la}`;
    const aLa = la.startsWith('le ') ? `au ${la.slice(3)}` : `à ${la}`;
    const ca = rng.int(0, 7), ra = rng.int(1, 8);
    const pe = rng.int(-4, 4), ps = rng.int(-4, 4);
    const cb = ca + pe, rb = ra + ps;
    if (cb < 0 || cb > 7 || rb < 1 || rb > 8 || (pe === 0 && ps === 0)) return null;
    const intro = "Sur un plan quadrillé, le nord est en haut. Les colonnes vont de A à H de gauche à droite (d'ouest en est) et les lignes de 1 à 8 de haut en bas (du nord au sud).";
    if (rng.next() < 0.5) {
      if (!(pe === 0 || ps === 0 || Math.abs(pe) === Math.abs(ps))) return null;
      const d = ps < 0 ? (pe > 0 ? 1 : pe < 0 ? 7 : 0) : ps > 0 ? (pe > 0 ? 3 : pe < 0 ? 5 : 4) : (pe > 0 ? 2 : 6);
      const { choix, reponse } = choixDirections(rng, d);
      const h = pe === 0 ? 'même colonne' : `${Math.abs(pe)} colonne${Math.abs(pe) > 1 ? 's' : ''} vers ${pe > 0 ? "la droite (l'est)" : "la gauche (l'ouest)"}`;
      const v = ps === 0 ? 'même ligne' : `${Math.abs(ps)} ligne${Math.abs(ps) > 1 ? 's' : ''} vers ${ps > 0 ? 'le bas (le sud)' : 'le haut (le nord)'}`;
      return {
        _signature: `qdir|${ca}${ra}|${cb}${rb}|${la}|${lb}`,
        cleContenu: `qdir|${ca}${ra}|${cb}${rb}`,
        type: 'qcm',
        enonce: `${intro} ${maj(la)} est en ${COL[ca]}${ra} et ${lb} en ${COL[cb]}${rb}. Dans quelle direction se trouve ${lb} par rapport ${aLa} ?`,
        choix, reponse,
        explication: `De ${COL[ca]}${ra} à ${COL[cb]}${rb} : ${h}, ${v}. ${maj(lb)} est donc ${DIR[d].au} ${deLa}.`,
      };
    }
    const dep = [];
    if (pe) dep.push(`${Math.abs(pe)} case${Math.abs(pe) > 1 ? 's' : ''} ${pe > 0 ? "vers l'est" : "vers l'ouest"}`);
    if (ps) dep.push(`${Math.abs(ps)} case${Math.abs(ps) > 1 ? 's' : ''} ${ps > 0 ? 'vers le sud' : 'vers le nord'}`);
    const bonne = `${COL[cb]}${rb}`;
    return {
      _signature: `qcase|${ca}${ra}|${pe}|${ps}|${la}`,
      cleContenu: `qcase|${ca}${ra}|${pe}|${ps}`,
      type: 'texte_court',
      enonce: `${intro} Tu pars ${deLa}, en ${COL[ca]}${ra}. Tu avances de ${dep.join(', puis de ')}. Dans quelle case arrives-tu ? (exemple : C4)`,
      reponse: [bonne, `${COL[cb]} ${rb}`, `${COL[cb]}-${rb}`],
      souple: true,
      explication: `Vers l'est ou l'ouest, tu changes de colonne (la lettre) ; vers le nord ou le sud, tu changes de ligne (le chiffre). De ${COL[ca]}${ra}, tu arrives en ${bonne}.`,
    };
  }
  return null;
}

// ---------------------------------------------------------------- échelle
const ECHELLES = [10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000, 1000000];
const valeurCm = (e) => (e >= 100000 ? `${n(e / 100000)} km` : `${n(e / 100)} m`);

function echelle(modele, rng) {
  switch (sorteDe(modele)) {
    case 'carte_reel': {
      const e = rng.pick(ECHELLES);
      const cm = rng.pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 1.5, 2.5, 3.5, 4.5]);
      const metres = (cm * e) / 100;
      const enKm = metres >= 1000;
      const rep = enKm ? metres / 1000 : metres;
      if (!Number.isInteger(rep * 100)) return null;
      return {
        _signature: `cr|${e}|${cm}`,
        type: 'numerique',
        enonce: `Sur une carte à l'échelle 1/${n(e)}, deux villages sont séparés de ${n(cm)} cm. Quelle est la distance réelle, en ${enKm ? 'kilomètres' : 'mètres'} ?`,
        reponse: rep, unite: enKm ? 'km' : 'm',
        explication: `À 1/${n(e)}, 1 cm sur la carte représente ${n(e)} cm en réalité, soit ${valeurCm(e)}. Donc ${n(cm)} cm ${cm < 2 ? 'représente' : 'représentent'} ${n(cm)} × ${valeurCm(e)} = ${n(rep)} ${enKm ? 'km' : 'm'}.`,
      };
    }
    case 'reel_carte': {
      const e = rng.pick([50000, 100000, 200000, 250000, 500000, 1000000]);
      const km = rng.pick([1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 150, 200]);
      const cm = (km * 100000) / e;
      if (!Number.isInteger(cm * 10) || cm < 0.5 || cm > 40) return null;
      return {
        _signature: `rc|${e}|${km}`,
        type: 'numerique',
        enonce: `Deux villes sont distantes de ${n(km)} km en réalité. Sur une carte à l'échelle 1/${n(e)}, combien de centimètres les séparent ?`,
        reponse: cm, unite: 'cm',
        explication: e >= 100000
          ? `À 1/${n(e)}, 1 cm sur la carte représente ${valeurCm(e)}. ${n(km)} km ÷ ${valeurCm(e)} = ${n(cm)}, donc ${n(cm)} cm.`
          : `À 1/${n(e)}, 1 cm sur la carte représente ${valeurCm(e)}. ${n(km)} km = ${n(km * 1000)} m ; ${n(km * 1000)} m ÷ ${valeurCm(e)} = ${n(cm)}, donc ${n(cm)} cm.`,
      };
    }
    case 'graphique': {
      const km = rng.pick([2, 5, 10, 20, 25, 50]);
      const cm = rng.pick([2, 3, 4, 5, 6, 7, 8, 9, 1.5, 2.5, 3.5, 4.5]);
      const rep = km * cm;
      return {
        _signature: `gr|${km}|${cm}`,
        type: 'numerique',
        enonce: `Sur une carte, l'échelle graphique indique que 1 cm représente ${n(km)} km. Tu mesures ${n(cm)} cm entre deux villes. Quelle est la distance réelle ?`,
        reponse: rep, unite: 'km',
        explication: `Chaque centimètre vaut ${n(km)} km : ${n(cm)} × ${n(km)} = ${n(rep)} km.`,
      };
    }
    case 'detail': {
      const [a, b] = rng.shuffle([10000, 25000, 50000, 100000, 250000, 1000000]).slice(0, 2).sort((x, y) => x - y);
      const plusDetail = rng.next() < 0.5;
      const bon = plusDetail ? a : b;
      const choix = rng.shuffle([a, b]).map((x) => `La carte à 1/${n(x)}`);
      return {
        _signature: `det|${a}|${b}|${plusDetail}`,
        type: 'qcm',
        enonce: plusDetail
          ? 'Tu as deux cartes. Laquelle montre le plus de détails (petites rues, maisons…) ?'
          : 'Tu as deux cartes de même taille. Laquelle montre le plus grand territoire ?',
        choix, reponse: choix.indexOf(`La carte à 1/${n(bon)}`),
        explication: `À 1/${n(a)}, 1 cm représente ${valeurCm(a)} ; à 1/${n(b)}, 1 cm représente ${valeurCm(b)}. Plus le nombre sous le « 1 » est petit, plus la carte est détaillée ; plus il est grand, plus elle montre un grand territoire.`,
      };
    }
    default: return null;
  }
}

// ---------------------------------------------------------------- densité
// Population au 1er janvier 2024 (Statbel), arrondie au millier ; superficie en km².
const TERRITOIRES = [
  { nom: "la province d'Anvers", pop: 1927000, sup: 2876, prov: true },
  { nom: 'la province de Limbourg', pop: 900000, sup: 2427, prov: true },
  { nom: 'la province de Flandre orientale', pop: 1572000, sup: 3007, prov: true },
  { nom: 'la province de Flandre occidentale', pop: 1226000, sup: 3197, prov: true },
  { nom: 'la province du Brabant flamand', pop: 1197000, sup: 2118, prov: true },
  { nom: 'la province du Brabant wallon', pop: 414000, sup: 1097, prov: true },
  { nom: 'la province de Hainaut', pop: 1360000, sup: 3813, prov: true },
  { nom: 'la province de Liège', pop: 1119000, sup: 3857, prov: true },
  { nom: 'la province de Luxembourg', pop: 295000, sup: 4459, prov: true },
  { nom: 'la province de Namur', pop: 504000, sup: 3675, prov: true },
  { nom: 'la Région de Bruxelles-Capitale', pop: 1250000, sup: 162 },
  { nom: 'la Région flamande', pop: 6822000, sup: 13625 },
  { nom: 'la Région wallonne', pop: 3692000, sup: 16901 },
  { nom: 'la Belgique', pop: 11764000, sup: 30689 },
];
const densite = (t) => Math.round(t.pop / t.sup);
const LEGENDES = [[0, 200, 400, 600], [0, 150, 300, 450], [0, 100, 300, 500], [0, 250, 400, 550]];
const tranche = (b, i) => (i === b.length - 1 ? `${n(b[i])} et plus` : `De ${n(b[i])} à ${n(b[i + 1] - 1)}`);
const nomCourt = (t) => t.nom.replace(/^la province (de |d'|du )/, '');

function densitePop(modele, rng) {
  const provinces = TERRITOIRES.filter((t) => t.prov);
  switch (sorteDe(modele)) {
    case 'estimation': {
      const t = rng.pick(TERRITOIRES);
      const d = densite(t);
      const vals = [d, d * 10, Math.round(d / 10)];
      if (new Set(vals).size < 3 || vals[2] < 1) return null;
      const choix = rng.shuffle(vals).map((v) => `Environ ${n(v)} hab./km²`);
      return {
        _signature: `est|${t.nom}`,
        type: 'qcm',
        enonce: `Au 1er janvier 2024, ${t.nom} comptait environ ${n(t.pop)} habitants, pour une superficie de ${n(t.sup)} km². Quelle est sa densité de population ?`,
        choix, reponse: choix.indexOf(`Environ ${n(d)} hab./km²`),
        explication: `Densité = nombre d'habitants ÷ superficie : ${n(t.pop)} ÷ ${n(t.sup)} ≈ ${n(d)} habitants par km². Vérifie l'ordre de grandeur : ${n(d)} × ${n(t.sup)} ≈ ${n(t.pop)}.`,
      };
    }
    case 'tranches': {
      const bornes = rng.pick(LEGENDES);
      const tires = rng.shuffle(provinces).slice(0, 4);
      const colonnes = bornes.map((_, i) => tranche(bornes, i));
      const idx = tires.map((t) => { const d = densite(t); let i = 0; while (i < bornes.length - 1 && d >= bornes[i + 1]) i++; return i; });
      return {
        _signature: `tr|${bornes.join('-')}|${tires.map((t) => t.nom).sort().join(',')}`,
        cleContenu: `tr|${bornes.join('-')}|${tires.map((t) => t.nom).sort().join(',')}`,
        type: 'grille',
        enonce: 'Voici la densité de population de quelques provinces en 2024 (en habitants par km², arrondie). Dans quelle classe de la légende places-tu chaque province ?',
        lignes: tires.map((t) => `${maj(nomCourt(t))} : ${n(densite(t))} hab./km²`),
        colonnes, reponse: idx, points: 4,
        explication: `${tires.map((t, i) => `${n(densite(t))} → ${colonnes[idx[i]].toLowerCase()}`).join(' ; ')}.`,
      };
    }
    case 'comparer': {
      const tires = rng.shuffle(provinces).slice(0, 3);
      const ds = tires.map(densite);
      const plus = rng.next() < 0.5;
      const cible = plus ? Math.max(...ds) : Math.min(...ds);
      const tri = [...ds].sort((a, b) => a - b);
      if (tri[1] - tri[0] < 40 || tri[2] - tri[1] < 40) return null;
      const choix = tires.map((t) => maj(nomCourt(t)));
      return {
        _signature: `cmp|${plus}|${tires.map((t) => t.nom).sort().join(',')}`,
        type: 'qcm',
        enonce: `En 2024 : ${tires.map((t) => `${nomCourt(t)}, environ ${n(t.pop)} habitants sur ${n(t.sup)} km²`).join(' ; ')}. Quelle province est la ${plus ? 'plus' : 'moins'} densément peuplée ?`,
        choix, reponse: ds.indexOf(cible),
        explication: `On calcule habitants ÷ superficie : ${tires.map((t) => `${nomCourt(t)} ≈ ${n(densite(t))} hab./km²`).join(' ; ')}. Ce n'est pas forcément la province qui a le plus d'habitants !`,
      };
    }
    case 'calcul': {
      const sup = rng.pick([4, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60]);
      const d = rng.pick([30, 40, 50, 60, 75, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1500]);
      const pop = sup * d;
      if (rng.next() < 0.35) {
        return {
          _signature: `inv|${sup}|${d}`,
          type: 'numerique',
          enonce: `Une commune imaginaire a une superficie de ${n(sup)} km² et une densité de population de ${n(d)} habitants par km². Combien d'habitants compte-t-elle ?`,
          reponse: pop, unite: 'habitants',
          explication: `Nombre d'habitants = densité × superficie = ${n(d)} × ${n(sup)} = ${n(pop)} habitants.`,
        };
      }
      return {
        _signature: `calc|${sup}|${d}`,
        type: 'numerique',
        enonce: `Une commune imaginaire compte ${n(pop)} habitants pour une superficie de ${n(sup)} km². Quelle est sa densité de population ?`,
        reponse: d, unite: 'hab./km²',
        explication: `Densité = nombre d'habitants ÷ superficie = ${n(pop)} ÷ ${n(sup)} = ${n(d)} habitants par km².`,
      };
    }
    default: return null;
  }
}

// ---------------------------------------------------------------- latitudes et zones thermiques
const TROPIQUE = 23.4, CERCLE = 66.6;
function latitude(modele, rng) {
  const lat = rng.int(1, 89);
  const nord = rng.next() < 0.5;
  if (Math.abs(lat - TROPIQUE) < 3 || Math.abs(lat - CERCLE) < 3) return null;
  const NS = nord ? 'du Nord' : 'du Sud';
  const zone = lat < TROPIQUE ? 'la zone chaude' : lat < CERCLE ? `la zone tempérée ${NS}` : `la zone froide ${NS}`;
  const toutes = ['la zone chaude', 'la zone tempérée du Nord', 'la zone tempérée du Sud', 'la zone froide du Nord', 'la zone froide du Sud'];
  const faux = rng.shuffle(toutes.filter((z) => z !== zone)).slice(0, 3);
  const choix = rng.shuffle([zone, ...faux]).map(maj);
  const tropique = nord ? 'du Cancer' : 'du Capricorne';
  const cercle = nord ? 'arctique' : 'antarctique';
  const pourquoi = lat < TROPIQUE
    ? `entre l'équateur (0°) et le tropique ${tropique} (environ 23° ${nord ? 'N' : 'S'})`
    : lat < CERCLE
      ? `entre le tropique ${tropique} (environ 23°) et le cercle polaire ${cercle} (environ 66°)`
      : `au-delà du cercle polaire ${cercle} (environ 66°)`;
  return {
    _signature: `lat|${lat}|${nord}`,
    type: 'qcm',
    enonce: `Un lieu se trouve à ${lat}° de latitude ${nord ? 'nord' : 'sud'}. Dans quelle zone thermique se trouve-t-il ?`,
    choix, reponse: choix.indexOf(maj(zone)),
    explication: `${lat}° ${nord ? 'N' : 'S'}, c'est ${pourquoi} : ${zone}.`,
  };
}

// ---------------------------------------------------------------- banque de QCM à réserve de distracteurs
function banque(modele, rng) {
  const it = rng.pick(modele.items ?? []);
  const faux = rng.shuffle(it.ko).slice(0, 3);
  const choix = rng.shuffle([it.ok, ...faux]);
  return {
    _signature: `${it.q}|${faux.slice().sort().join(',')}`,
    cleContenu: it.q,
    type: 'qcm',
    enonce: it.q,
    choix, reponse: choix.indexOf(it.ok),
    explication: it.expl,
  };
}

// ---------------------------------------------------------------- tirage de la sorte et mélange de générateurs
function envelopper(fn) {
  return (modele, rng) => {
    const s = Array.isArray(modele.sorte) ? rng.pick(modele.sorte) : modele.sorte;
    const p = s && typeof s === 'object' ? { ...modele, ...s } : { ...modele, sorte: s };
    const q = fn(p, rng);
    if (!q) return null;
    if (s && typeof s === 'object') {
      if (s.fiche) q.fiche = s.fiche;
      if (s.difficulte) q.difficulte = s.difficulte;
    }
    return q;
  };
}

const BASE = {
  hg_evenements: envelopper(evenements),
  hg_orientation: envelopper(orientation),
  hg_position: envelopper(position),
  hg_echelle: envelopper(echelle),
  hg_densite: envelopper(densitePop),
  hg_latitude: envelopper(latitude),
  hg_banque: envelopper(banque),
};

// hg_melange : `melange` = liste d'entrées { generateur, sorte?, fiche?, difficulte? } ; on en tire une.
function melange(modele, rng) {
  const i = rng.int(0, modele.melange.length - 1);
  const e = modele.melange[i];
  const q = BASE[e.generateur]({ ...modele, ...e }, rng);
  if (!q) return null;
  if (e.fiche) q.fiche = e.fiche;
  if (e.difficulte) q.difficulte = e.difficulte;
  q._signature = `${i}|${q._signature}`;
  if (q.cleContenu) q.cleContenu = `${i}|${q.cleContenu}`;
  return q;
}

export const GENERATEURS = { ...BASE, hg_melange: melange };
