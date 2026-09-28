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

  const [banques, fichiersModeles, indexExamens] = await Promise.all([
    lire(catalogue.sources.banque),
    lire(catalogue.sources.modeles),
    fetchJson(base + catalogue.sources.examens[0]),
  ]);

  const banque = banques.filter(Boolean).flatMap((f) =>
    f.questions.map((q) => ({ matiere: f.matiere, source: 'banque', ...q })));
  const modeles = fichiersModeles.filter(Boolean).flatMap((f) =>
    f.modeles.map((m) => ({ matiere: f.matiere, ...m })));

  verifierIdsUniques([...banque, ...modeles]);

  return {
    catalogue,
    banque,
    modeles,
    examens: indexExamens.examens,
    chargerExamen: async (id) => {
      const meta = indexExamens.examens.find((e) => e.id === id);
      if (!meta) throw new Error(`Examen inconnu : ${id}`);
      const ex = await fetchJson(base + meta.fichier);
      const matiereDuLivret = Object.fromEntries((ex.livrets ?? []).map((l) => [l.n, l.matiere]));
      ex.questions = ex.questions.map((q) => ({
        source: 'examen', referentiel: ex.referentiel,
        matiere: q.matiere ?? matiereDuLivret[q.livret] ?? q.domaine?.split('.')[0], ...q,
      }));
      return ex;
    },
  };
}

function verifierIdsUniques(items) {
  const vus = new Set();
  for (const it of items) {
    if (vus.has(it.id)) throw new Error(`Identifiant en double dans les données : ${it.id}`);
    vus.add(it.id);
  }
}
