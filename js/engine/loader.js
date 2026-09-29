import { normaliserTexte } from './format.js';
// Chargement des données JSON (catalogue, banque, modèles, examens).
// `fetchJson` est injectable : fetch() dans le navigateur, lecture de fichiers dans les tests.

const fetchNavigateur = async (chemin) => {
  const r = await fetch(chemin);
  if (!r.ok) throw new Error(`Impossible de charger ${chemin} (${r.status})`);
  return r.json();
};

export async function chargerDonnees({ base = 'data/', fetchJson = fetchNavigateur } = {}) {
  const catalogue = await fetchJson(base + 'catalogue.json');
  const lire = (chemins) => Promise.all(chemins.map((c) => fetchJson(base + c).catch((e) => {
    console.warn(e.message); return null; // un fichier manquant ne bloque pas le reste
  })));

  const [banques, fichiersModeles, indexExamens, fichiersFiches, fichiersFaits] = await Promise.all([
    lire(catalogue.sources.banque),
    lire(catalogue.sources.modeles),
    fetchJson(base + catalogue.sources.examens[0]),
    lire([].concat(catalogue.sources.fiches ?? [])),
    lire(catalogue.sources.faits ?? []),
  ]);
  const fiches = Object.fromEntries(fichiersFiches.filter(Boolean).flatMap((f) => f.fiches).map((f) => [f.id, f]));
  // Bases de faits (générateur « faits ») : rattachées aux modèles qui les citent via `base`.
  const bases = Object.fromEntries(fichiersFaits.filter(Boolean).flatMap((f) => f.bases ?? [f]).map((b) => [b.id, b]));
  const avecBase = (m) => {
    if (!m.base) return m;
    const b = bases[m.base];
    if (!b) { console.warn(`Base de faits inconnue : ${m.base} (${m.id})`); return null; }
    return { cle: b.cle, ...m, items: [...(b.items ?? []), ...(m.items ?? [])], phrases: { ...(b.phrases ?? {}), ...(m.phrases ?? {}) } };
  };

  const banque = banques.filter(Boolean).flatMap((f) =>
    f.questions.map((q) => ({ matiere: f.matiere, source: 'banque', ...q })));
  const modeles = fichiersModeles.filter(Boolean).flatMap((f) =>
    f.modeles.map((m) => avecBase({ matiere: f.matiere, ...m })).filter(Boolean));

  verifierIdsUniques([...banque, ...modeles]);

  const chargerExamen = async (id) => {
    const meta = indexExamens.examens.find((e) => e.id === id);
    if (!meta) throw new Error(`Examen inconnu : ${id}`);
    const ex = await fetchJson(base + meta.fichier);
    const matiereDuLivret = Object.fromEntries((ex.livrets ?? []).map((l) => [l.n, l.matiere]));
    ex.questions = ex.questions.map((q) => ({
      source: 'examen', referentiel: ex.referentiel, annee: ex.annee,
      matiere: q.matiere ?? matiereDuLivret[q.livret] ?? q.domaine?.split('.')[0], ...q,
    }));
    return ex;
  };

  // Questions officielles jouables dans l'entraînement : documents joints, doublons entre examens retirés
  // (le CEB 2026 socles reprend une partie du tronc commun), questions ouvertes exclues.
  const questionsExamens = async () => {
    const dispo = indexExamens.examens.filter((e) => e.statut !== 'a_encoder');
    const examens = (await Promise.all(dispo.map((e) => chargerExamen(e.id).catch(() => null)))).filter(Boolean);
    const vus = new Set(); const out = [];
    for (const ex of examens) {
      const docs = new Map((ex.documents ?? []).map((d) => [d.id, d]));
      for (const q of ex.questions) {
        if (q.numerisable === false || q.reponse == null || q.type === 'ouverte') continue;
        const cle = normaliserTexte(`${q.enonce}|${(q.choix ?? q.elements ?? q.lignes ?? []).join('|')}`);
        if (vus.has(cle)) continue;
        vus.add(cle);
        out.push({ ...q, docsResolus: (q.documents ?? []).map((id) => docs.get(id)).filter(Boolean) });
      }
    }
    return out;
  };

  return {
    catalogue,
    banque,
    modeles,
    examens: indexExamens.examens,
    fiches,
    chargerExamen,
    questionsExamens,
  };
}

function verifierIdsUniques(items) {
  const vus = new Set();
  for (const it of items) {
    if (vus.has(it.id)) throw new Error(`Identifiant en double dans les données : ${it.id}`);
    vus.add(it.id);
  }
}
