// Génère les fichiers dérivés des données, à relancer après chaque changement de fiche ou de code :
//   npm run generer
// - fiches/<id>.html + fiches/index.html : une page lisible par Google pour chaque fiche Rappel ;
// - sitemap.xml et robots.txt ;
// - sw.js : le service worker (hors ligne), avec la liste des fichiers et un numéro de version
//   calculé sur leur contenu (toute modification publiée = nouvelle version proposée aux familles).
// Le test tests/generation.test.js échoue si ces fichiers ne sont plus à jour.

import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chargerDonnees } from '../js/engine/index.js';
import { exercicesParNotion } from '../js/app/cartes.js';
import { ADRESSE_SIGNALEMENT } from '../js/app/signaler.js';

const RACINE = new URL('../', import.meta.url);
const SITE = 'https://missionceb.be/';
const MATIERES = {
  fr: { nom: 'Français', e: '📖', long: 'français' },
  ma: { nom: 'Mathématiques', e: '📐', long: 'mathématiques' },
  hg: { nom: 'Histoire-géographie', e: '🌍', long: 'histoire-géographie' },
  sc: { nom: 'Sciences', e: '🧪', long: 'sciences' },
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const couper = (s, n) => { const t = String(s).replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t; };

async function lireDossier(rel) {
  const out = [];
  for (const e of await readdir(new URL(rel, RACINE), { withFileTypes: true })) {
    const p = `${rel}${e.name}`;
    if (e.isDirectory()) out.push(...await lireDossier(`${p}/`));
    else out.push(p);
  }
  return out;
}

function tete({ titre, description, chemin, type = 'article', jsonld = null }) {
  return `<!doctype html>
<html lang="fr-BE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titre)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${chemin}">
<link rel="icon" href="../assets/icones/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="apple-touch-icon" href="../assets/icones/apple-touch-icon.png">
<meta name="theme-color" content="#1f4e96">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="Mission CEB">
<meta property="og:locale" content="fr_BE">
<meta property="og:url" content="${SITE}${chemin}">
<meta property="og:title" content="${esc(titre)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${SITE}assets/icones/partage.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/fiches.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>\n` : ''}</head>
<body>
<header class="haut"><a class="marque" href="../"><img src="../assets/icones/logo-128.png" width="44" height="44" alt=""><span>Mission CEB<small>Réussis ton CEB en jouant</small></span></a>
<a class="btn-jouer" href="../">Jouer ▶</a></header>
<main>`;
}

const pied = (lienSignaler) => `</main>
<footer class="pied">
<p><b>Mission CEB</b> : entraînement gratuit au CEB (Certificat d'Études de Base, Fédération Wallonie-Bruxelles), sans compte et sans publicité. La progression reste sur l'appareil de l'enfant.</p>
<p><a href="../">Ouvrir l'application</a> · <a href="./">Toutes les fiches</a> · <a href="${esc(lienSignaler)}">Signaler une erreur</a></p>
</footer>
</body>
</html>
`;

function pageFiche(f, voisines, nbEx) {
  const m = MATIERES[f.matiere];
  const titre = `${f.titre} — fiche de révision CEB (${m.long}) | Mission CEB`;
  const description = couper(`${f.titre} : ${f.regle.join(' ')} Fiche de révision pour le CEB, 6e primaire.`, 158);
  const sujet = `[Mission CEB] Erreur signalée — fiche « ${f.titre} »`;
  const signaler = `mailto:${ADRESSE_SIGNALEMENT}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(`Bonjour,\n\nJe pense avoir trouvé une erreur dans la fiche « ${f.titre} » (${f.id}).\n\nCommentaire : `)}`;
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'LearningResource', name: f.titre, description,
    inLanguage: 'fr-BE', learningResourceType: 'Fiche de révision', educationalLevel: '6e primaire (CEB)',
    about: m.nom, isAccessibleForFree: true, url: `${SITE}fiches/${f.id}.html`,
    publisher: { '@type': 'Organization', name: 'Mission CEB', url: SITE },
  };
  return `${tete({ titre, description, chemin: `fiches/${f.id}.html`, jsonld })}
<nav class="fil" aria-label="Fil d'Ariane"><a href="./">Fiches</a> › <a href="./#${f.matiere}">${m.nom}</a> › <span>${esc(f.titre)}</span></nav>
<article class="fiche">
<p class="sur">${m.e} Fiche de révision · ${m.nom} · CEB 6e primaire</p>
<h1><span aria-hidden="true">${f.e}</span> ${esc(f.titre)}</h1>
<h2>La règle</h2>
<ul class="regle">
${f.regle.map((r) => `<li>${esc(r)}</li>`).join('\n')}
</ul>
<div class="encart"><h2>Exemple</h2><p>${esc(f.exemple)}</p></div>
${f.astuce ? `<div class="encart astuce"><h2>💡 Astuce</h2><p>${esc(f.astuce)}</p></div>` : ''}
</article>
<section class="agir">
<h2>Et maintenant, entraîne-toi !</h2>
<div class="boutons">
${nbEx ? `<a class="btn btn-cta" href="../?fiche=${encodeURIComponent(f.id)}">🎯 S'entraîner sur cette notion</a>` : `<a class="btn btn-cta" href="../">🎯 S'entraîner au CEB</a>`}
<a class="btn" href="../imprimer.html?mode=fiche&amp;notions=${encodeURIComponent(f.id)}">🖨️ Fiche d'exercices à imprimer</a>
</div>
<p class="mute">${nbEx ? 'Des questions toujours nouvelles sur cette notion, corrigées tout de suite, avec la règle en cas d\'erreur.' : 'Questions du CEB et exercices corrigés tout de suite.'} Gratuit, sans compte.</p>
</section>
<section class="voisines">
<h2>Autres fiches de ${m.long}</h2>
<ul>
${voisines.map((v) => `<li><a href="${v.id}.html"><span aria-hidden="true">${v.e}</span> ${esc(v.titre)}</a></li>`).join('\n')}
</ul>
</section>
${pied(signaler)}`;
}

function pageIndex(parMatiere, nbFiches) {
  const titre = 'Fiches de révision du CEB : français, maths, histoire-géo, sciences | Mission CEB';
  const description = `Les ${nbFiches} règles à connaître pour le CEB (6e primaire, Fédération Wallonie-Bruxelles), expliquées simplement avec un exemple et une astuce. Gratuit.`;
  return `${tete({ titre, description, chemin: 'fiches/', type: 'website' })}
<h1>📘 Fiches de révision du CEB</h1>
<p class="intro">Toutes les règles à connaître pour le CEB, en ${nbFiches} fiches courtes : la règle, un exemple et une astuce. Chaque fiche mène à des exercices corrigés tout de suite.</p>
<nav class="sommaire" aria-label="Matières">${Object.entries(MATIERES).map(([id, m]) => `<a href="#${id}">${m.e} ${m.nom}</a>`).join('')}</nav>
${Object.entries(MATIERES).map(([id, m]) => `<section class="matiere" id="${id}">
<h2>${m.e} ${m.nom} <small>${parMatiere[id].length} fiches</small></h2>
<ul class="liste">
${parMatiere[id].map((f) => `<li><a href="${f.id}.html"><span aria-hidden="true">${f.e}</span> ${esc(f.titre)}</a></li>`).join('\n')}
</ul>
</section>`).join('\n')}
${pied(`mailto:${ADRESSE_SIGNALEMENT}?subject=${encodeURIComponent('[Mission CEB] Erreur signalée')}`)}`;
}

// Renvoie { chemin: contenu } pour tous les fichiers générés.
export async function generer() {
  const lireTexte = async (c) => readFile(new URL(c, RACINE), 'utf8');
  const donnees = await chargerDonnees({ base: 'data/', fetchJson: async (c) => JSON.parse(await lireTexte(c)) });
  const banque = [...donnees.banque, ...await donnees.questionsExamens()];
  const nbEx = exercicesParNotion(banque, donnees.modeles);
  const fiches = Object.values(donnees.fiches).filter((f) => MATIERES[f.matiere]).sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));
  const parMatiere = Object.fromEntries(Object.keys(MATIERES).map((m) => [m, fiches.filter((f) => f.matiere === m)]));
  const out = {};
  for (const f of fiches) {
    const liste = parMatiere[f.matiere];
    const i = liste.indexOf(f);
    const voisines = [...liste.slice(i + 1), ...liste.slice(0, i)].slice(0, 8);
    out[`fiches/${f.id}.html`] = pageFiche(f, voisines, nbEx[f.id] ?? 0);
  }
  out['fiches/index.html'] = pageIndex(parMatiere, fiches.length);
  out['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[SITE, `${SITE}fiches/`, ...fiches.map((f) => `${SITE}fiches/${f.id}.html`)].map((u) => `<url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
  out['robots.txt'] = `User-agent: *\nAllow: /\nDisallow: /maquettes/\nDisallow: /moteur.html\n\nSitemap: ${SITE}sitemap.xml\n`;

  // Service worker : fichiers du cœur de l'application + version = empreinte de leur contenu.
  const coeur = [
    'index.html', 'imprimer.html', 'manifest.webmanifest',
    ...(await lireDossier('css/')), ...(await lireDossier('js/')), ...(await lireDossier('data/')), ...(await lireDossier('assets/icones/')), ...(await lireDossier('assets/avatars/')),
  ].filter((p) => !/(^|\/)\./.test(p)).sort();
  const h = createHash('sha256');
  for (const p of coeur) { h.update(p); h.update(await readFile(new URL(p, RACINE))); }
  const modele = await lireTexte('scripts/sw-modele.js');
  out['sw.js'] = modele.replace("'__VERSION__'", `'${h.digest('hex').slice(0, 12)}'`).replace('__FICHIERS__', JSON.stringify(['./', ...coeur], null, 1).replace(/\n/g, '\n'));
  return out;
}

// Exécution directe : écrit les fichiers (et retire les pages de fiches qui n'existent plus).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = await generer();
  await mkdir(new URL('fiches/', RACINE), { recursive: true });
  for (const ancien of await readdir(new URL('fiches/', RACINE))) if (!out[`fiches/${ancien}`]) await rm(new URL(`fiches/${ancien}`, RACINE));
  for (const [p, c] of Object.entries(out)) await writeFile(new URL(p, RACINE), c);
  console.log(`${Object.keys(out).length} fichiers générés (${Object.keys(out).filter((p) => p.startsWith('fiches/')).length} pages de fiches).`);
}
