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
import { FLUENT, PICTOS } from '../js/app/emojis-dispo.js';
import { readFileSync } from 'node:fs';

// Emoji → icône Fluent 3D (comme dans l'application) ; l'emoji reste en texte de remplacement.
// Signes d'interface : pictogramme Phosphor intégré (SVG, couleur du texte).
const picto = (n) => readFileSync(new URL(`assets/ui/pictos/${n}.svg`, RACINE), 'utf8').replace('<svg ', '<svg class="pi" aria-hidden="true" ');
const emo = (e) => (PICTOS[e] ? picto(PICTOS[e]) : FLUENT[e] ? `<img class="emo" src="../assets/emoji/${FLUENT[e]}.webp" alt="${e}" width="36" height="36">` : e);
const icMat = (id) => `<img class="ic" src="../assets/ui/${id}.webp" alt="" width="40" height="40">`;

const RACINE = new URL('../', import.meta.url);
const SITE = 'https://missionceb.be/';
const MATIERES = {
  fr: { nom: 'Français', e: '📖', long: 'français', court: 'français' },
  ma: { nom: 'Mathématiques', e: '📐', long: 'mathématiques', court: 'maths' },
  hg: { nom: 'Histoire-géographie', e: '🌍', long: 'histoire-géographie', court: 'histoire-géo' },
  sc: { nom: 'Sciences', e: '🧪', long: 'sciences', court: 'sciences' },
};
export const MAX_TITRE = 60;

// Titre pour Google (≤ 60 caractères, sinon il est coupé dans les résultats) :
// « <notion> – Fiche CEB <matière> », en raccourcissant d'abord la parenthèse, puis la notion.
export function titreGoogle(titre, matiere) {
  const suite = ` – Fiche CEB ${MATIERES[matiere].court}`;
  const essais = [titre, titre.replace(/\s*\([^)]*\)\s*/g, ' ').trim(), ` – Fiche CEB`];
  for (const t of essais.slice(0, 2)) if ((t + suite).length <= MAX_TITRE) return t + suite;
  const court = essais[1];
  if ((court + ' – Fiche CEB').length <= MAX_TITRE) return court + ' – Fiche CEB';
  return couper(court, MAX_TITRE - ' – Fiche CEB'.length) + ' – Fiche CEB';
}

// Description (140-158 caractères) : la règle, puis ce qu'on y gagne.
export function descriptionGoogle(f) {
  const fin = ' Exemple, astuce et exercices corrigés gratuits.';
  const place = 158 - fin.length;
  // Des phrases entières tant qu'elles tiennent ; sinon la première, coupée proprement à un mot.
  const phrases = f.regle.join(' ').replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g).map((x) => x.trim());
  let texte = '';
  for (const ph of phrases) { const t = texte ? `${texte} ${ph}` : ph; if (t.length > place) break; texte = t; }
  if (!texte) texte = couper(phrases[0], place);
  // Trop court pour Google : on annonce la notion en tête (« Les cours d'eau : un cours d'eau naît… »).
  if ((texte + fin).length < 110 && `${f.titre} : ${texte}`.length <= place) texte = `${f.titre} : ${texte[0].toLowerCase()}${texte.slice(1)}`;
  if (!/[.!?…]$/.test(texte)) texte += '.';
  return texte + fin;
}

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
<meta name="theme-color" content="#10245e">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="Mission CEB">
<meta name="application-name" content="Mission CEB">
<meta property="og:locale" content="fr_BE">
<meta property="og:url" content="${SITE}${chemin}">
<meta property="og:title" content="${esc(titre)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${SITE}assets/icones/partage.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Baloo+2:wght@700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/fiches.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>\n` : ''}</head>
<body>
<header class="haut${type === 'website' ? ' grand' : ''}"><div class="barre-haut"><a class="marque" href="../"><img src="../assets/icones/logo-128.png" width="44" height="44" alt="">Mission CEB</a>
<nav class="menu" aria-label="Menu principal"><a href="../">Accueil</a><a href="./">Fiches</a><a href="../imprimer.html">Examens papier</a></nav>
<a class="btn-jouer" href="../app/">Jouer gratuitement</a></div>${type === 'website' ? '<!--heros-->' : ''}</header>
<main>`;
}

const pied = (lienSignaler) => `</main>
<footer class="pied">
<p><b>Mission CEB</b> : entraînement gratuit au CEB (Certificat d'Études de Base, Fédération Wallonie-Bruxelles), sans compte et sans publicité. La progression reste sur l'appareil de l'enfant.</p>
<p><a href="../">Accueil</a> · <a href="../app/">Ouvrir l'application</a> · <a href="./">Toutes les fiches</a> · <a href="${esc(lienSignaler)}">Signaler une erreur</a></p>
</footer>
</body>
</html>
`;

function pageFiche(f, voisines, nbEx) {
  const m = MATIERES[f.matiere];
  const titre = titreGoogle(f.titre, f.matiere);
  const description = descriptionGoogle(f);
  const sujet = `[Mission CEB] Erreur signalée — fiche « ${f.titre} »`;
  const signaler = `mailto:${ADRESSE_SIGNALEMENT}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(`Bonjour,\n\nJe pense avoir trouvé une erreur dans la fiche « ${f.titre} » (${f.id}).\n\nCommentaire : `)}`;
  // Fil d'Ariane (Google affiche « Mission CEB › Fiches › Mathématiques » au lieu de l'adresse) + ressource.
  const jsonld = [
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Mission CEB', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Fiches', item: `${SITE}fiches/` },
        { '@type': 'ListItem', position: 3, name: m.nom, item: `${SITE}fiches/#${f.matiere}` },
        { '@type': 'ListItem', position: 4, name: f.titre },
      ],
    },
    {
      '@context': 'https://schema.org', '@type': 'LearningResource', name: f.titre, description,
      inLanguage: 'fr-BE', learningResourceType: 'Fiche de révision', educationalLevel: '6e primaire (CEB)',
      about: m.nom, isAccessibleForFree: true, url: `${SITE}fiches/${f.id}.html`,
      publisher: { '@type': 'Organization', name: 'Mission CEB', url: SITE },
    },
  ];
  return `${tete({ titre, description, chemin: `fiches/${f.id}.html`, jsonld })}
<nav class="fil" aria-label="Fil d'Ariane"><a href="./">Fiches</a> › <a href="./#${f.matiere}">${m.nom}</a> › <span>${esc(f.titre)}</span></nav>
<article class="fiche">
<p class="sur">${icMat(f.matiere)} Fiche de révision · ${m.nom} · CEB 6e primaire</p>
<h1>${emo(f.e)} ${esc(f.titre)}</h1>
<h2>La règle</h2>
<ul class="regle">
${f.regle.map((r) => `<li>${esc(r)}</li>`).join('\n')}
</ul>
<div class="encart"><h2>Exemple</h2><p>${esc(f.exemple)}</p></div>
${f.astuce ? `<div class="encart astuce"><h2><img class="ic" src="../assets/ui/astuce.webp" alt="" width="40" height="40"> Astuce</h2><p>${esc(f.astuce)}</p></div>` : ''}
</article>
<section class="agir">
<h2>Et maintenant, entraîne-toi !</h2>
<div class="boutons">
${nbEx ? `<a class="btn btn-cta" href="../app/?fiche=${encodeURIComponent(f.id)}">${emo('🎯')} S'entraîner sur cette notion</a>` : `<a class="btn btn-cta" href="../app/">${emo('🎯')} S'entraîner au CEB</a>`}
<a class="btn" href="../imprimer.html?mode=fiche&amp;notions=${encodeURIComponent(f.id)}">${emo('🖨️')} Fiche d'exercices à imprimer</a>
</div>
<p class="mute">${nbEx ? 'Des questions toujours nouvelles sur cette notion, corrigées tout de suite, avec la règle en cas d\'erreur.' : 'Questions du CEB et exercices corrigés tout de suite.'} Gratuit, sans compte.</p>
</section>
<section class="voisines">
<h2>Autres fiches de ${m.long}</h2>
<ul>
${voisines.map((v) => `<li><a href="${v.id}.html">${emo(v.e)} ${esc(v.titre)}</a></li>`).join('\n')}
</ul>
</section>
${pied(signaler)}`;
}

function pageIndex(parMatiere, nbFiches) {
  const titre = 'Fiches de révision du CEB : toutes les règles';
  const description = `Les ${nbFiches} règles à connaître pour le CEB en français, maths, histoire-géo et sciences, expliquées simplement. Exemples et exercices gratuits.`;
  const SOUS = { fr: 'Lire, grammaire, conjugaison, orthographe', ma: 'Nombres, grandeurs, géométrie, données', hg: 'Repères, cartes, Belgique et monde', sc: 'Vivant, matière, énergie' };
  const heros = `<div class="heros"><p class="sur">Fiches de révision</p><h1>Toutes les règles du CEB, expliquées simplement</h1>
<p class="intro">${nbFiches} fiches courtes : la règle, un exemple, une astuce, puis des exercices corrigés tout de suite.</p>
<label class="recherche"><span class="sr">Chercher une fiche</span><input id="cherche" type="search" placeholder="Chercher une règle : participe, aire, siècle…" autocomplete="off"></label></div>`;
  return `${tete({ titre, description, chemin: 'fiches/', type: 'website' }).replace('<!--heros-->', heros)}
<nav class="cartes-mat" aria-label="Matières">${Object.entries(MATIERES).map(([id, m]) => `<a class="carte-mat" href="#${id}"><img src="../assets/ui/${id}.webp" alt="" width="88" height="88"><b>${{ fr: 'Français', ma: 'Maths', hg: 'Histoire-géo', sc: 'Sciences' }[id]}</b><small>${SOUS[id]}</small><span>${parMatiere[id].length} fiches →</span></a>`).join('')}</nav>
<p class="aucun" id="aucun" hidden>Aucune fiche ne correspond. Essaie un autre mot.</p>
${Object.entries(MATIERES).map(([id, m]) => `<section class="matiere" id="${id}">
<h2><img src="../assets/ui/${id}.webp" alt="" width="44" height="44"> ${m.nom} <small>${parMatiere[id].length} fiches</small></h2>
<ul class="liste">
${parMatiere[id].map((f) => `<li data-texte="${esc([f.titre, ...f.regle].join(' ').toLowerCase().normalize('NFD').replace(/\p{M}/gu, ''))}"><a href="${f.id}.html">${emo(f.e)}<span>${esc(f.titre)}</span></a></li>`).join('\n')}
</ul>
</section>`).join('\n')}
<script>
  // Recherche instantanée (sans accents) dans les titres et les règles.
  const champ = document.getElementById('cherche'), aucun = document.getElementById('aucun');
  champ.addEventListener('input', () => {
    const mots = champ.value.toLowerCase().normalize('NFD').replace(/\\p{M}/gu, '').split(/\\s+/).filter(Boolean);
    let n = 0;
    document.querySelectorAll('.liste li').forEach((li) => { const ok = mots.every((m) => li.dataset.texte.includes(m)); li.hidden = !ok; n += ok; });
    document.querySelectorAll('section.matiere').forEach((s) => { s.hidden = !s.querySelector('li:not([hidden])'); });
    document.querySelector('.cartes-mat').hidden = mots.length > 0;
    aucun.hidden = n > 0;
  });
</script>
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
    'index.html', 'app/index.html', 'imprimer.html', 'manifest.webmanifest',
    ...(await lireDossier('css/')), ...(await lireDossier('js/')), ...(await lireDossier('data/')), ...(await lireDossier('assets/icones/')), ...(await lireDossier('assets/avatars/')), ...(await lireDossier('assets/ui/')), ...(await lireDossier('assets/emoji/')),
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
