// Générateur « repères de temps » : périodes conventionnelles et siècles.
// Repères utilisés dans les épreuves de la FWB :
//   Préhistoire → vers 3500 av. J.-C. (invention de l'écriture) → Antiquité → 476 (chute de l'Empire romain
//   d'Occident) → Moyen Âge → 1492 (arrivée de Christophe Colomb en Amérique) → Temps modernes
//   → 1789 (Révolution française) → Époque contemporaine.

export const PERIODES = [
  { nom: 'Préhistoire', debut: -10000, fin: -3500 },
  { nom: 'Antiquité', debut: -3500, fin: 476 },
  { nom: 'Moyen Âge', debut: 476, fin: 1492 },
  { nom: 'Temps modernes', debut: 1492, fin: 1789 },
  { nom: 'Époque contemporaine', debut: 1789, fin: 2026 },
];

const MARGE = 15; // on évite les années trop proches d'une charnière (ambiguës)

export function periodeDe(annee) {
  return PERIODES.find((p) => annee >= p.debut && annee < p.fin) ?? PERIODES[PERIODES.length - 1];
}

export function siecleDe(annee) {
  return annee > 0 ? Math.floor((annee - 1) / 100) + 1 : -(Math.floor((-annee - 1) / 100) + 1);
}

export function romain(n) {
  const t = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, s] of t) while (n >= v) { out += s; n -= v; }
  return out;
}

const ecrireAnnee = (a) => (a < 0 ? `${-a} av. J.-C.` : String(a));

export function genererRepereTemps(modele, rng) {
  const sorte = modele.sorte ?? rng.pick(['periode', 'siecle']);

  if (sorte === 'periode') {
    let annee;
    do { annee = rng.int(-5000, 2025); }
    while (PERIODES.some((p) => Math.abs(annee - p.debut) < MARGE) || annee === 0);
    const bonne = periodeDe(annee);
    const choix = rng.shuffle(PERIODES.map((p) => p.nom));
    return {
      _signature: `periode|${annee}`,
      type: 'qcm',
      enonce: `Dans quelle période conventionnelle se situe l'année ${ecrireAnnee(annee)} ?`,
      choix,
      reponse: choix.indexOf(bonne.nom),
      explication: `${ecrireAnnee(annee)} se situe entre ${bonne.debut === -10000 ? "l'apparition de l'être humain" : ecrireAnnee(bonne.debut)} et ${bonne.fin === 2026 ? "aujourd'hui" : ecrireAnnee(bonne.fin)} : période « ${bonne.nom} ». Repères : 3500 av. J.-C., 476, 1492, 1789.`,
    };
  }

  // Siècle d'une année après J.-C.
  const annee = rng.int(1, 2025);
  const s = siecleDe(annee);
  return {
    _signature: `siecle|${annee}`,
    type: 'texte_court',
    enonce: `En quel siècle se situe l'année ${annee} ? (écris le numéro, en chiffres ou en chiffres romains)`,
    reponse: [String(s), romain(s), `${s}e`, `${s}e siecle`, `${romain(s)}e`, `${romain(s)}e siecle`, `${s}eme`],
    souple: true,
    explication: `Le ${romain(s)}e siècle va de l'an ${(s - 1) * 100 + 1} à l'an ${s * 100}. Astuce : ${annee} → on prend les centaines (${Math.floor((annee - 1) / 100)}) et on ajoute 1 → ${s}.`,
  };
}
