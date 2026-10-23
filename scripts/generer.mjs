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
import { chargerDonnees, genererVariante, createRng, bonneReponseLisible, livretsReels, estJouable, normaliserTexte } from '../js/engine/index.js';
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
  const fin = ' Exemple, astuce et exercices corrigés tout de suite.';
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
<link rel="preload" href="../assets/polices/baloo-2.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="../assets/polices/atkinson-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../css/polices.css">
<link rel="stylesheet" href="../css/fiches.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>\n` : ''}</head>
<body>
<header class="haut${type === 'website' ? ' grand' : ''}"><div class="barre-haut"><a class="marque" href="../"><img src="../assets/icones/logo-96.webp" width="44" height="44" alt="">Mission CEB</a>
<nav class="menu" aria-label="Menu principal"><a href="../">Accueil</a><a href="../fiches/">Fiches</a><a href="../examens/">Examens</a><a href="../exercices/">Exercices</a><a href="../ceb-2027/">CEB 2027</a></nav>
<a class="btn-jouer" href="../app/">Jouer</a></div>${type === 'website' ? '<!--heros-->' : ''}</header>
<main>`;
}

const pied = (lienSignaler) => `</main>
<footer class="pied">
<p><b>Mission CEB</b> : entraînement au CEB (Certificat d'Études de Base, Fédération Wallonie-Bruxelles), sans compte et sans publicité. La progression reste sur l'appareil de l'enfant.</p>
<p><a href="../">Accueil</a> · <a href="../app/">Ouvrir l'application</a> · <a href="../fiches/">Fiches</a> · <a href="../examens/">Anciens examens</a> · <a href="../exercices/">Exercices</a> · <a href="../ceb-2027/">CEB 2027</a> · <a href="../reviser-le-ceb/">Bien réviser</a> · <a href="../enseignants/">Enseignants</a> · <a href="${esc(lienSignaler)}">Signaler une erreur</a></p>
</footer>
</body>
</html>
`;

function pageFiche(f, voisines, nbEx, enrichi = { exemples: [], officielles: [], annees: [] }) {
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
${blocsEnrichis(enrichi)}
<section class="agir">
<h2>Et maintenant, entraîne-toi !</h2>
<div class="boutons">
${nbEx ? `<a class="btn btn-cta" href="../app/?fiche=${encodeURIComponent(f.id)}">${emo('🎯')} S'entraîner sur cette notion</a>` : `<a class="btn btn-cta" href="../app/">${emo('🎯')} S'entraîner au CEB</a>`}
<a class="btn" href="../imprimer.html?mode=fiche&amp;notions=${encodeURIComponent(f.id)}">${emo('🖨️')} Fiche d'exercices à imprimer</a>
</div>
<p class="mute">${nbEx ? 'Des questions toujours nouvelles sur cette notion, corrigées tout de suite, avec la règle en cas d\'erreur.' : 'Questions du CEB et exercices corrigés tout de suite.'} Sans compte.</p>
</section>
<section class="voisines">
<h2>Autres fiches de ${m.long}</h2>
<ul>
${voisines.map((v) => `<li><a href="${v.id}.html">${emo(v.e)} ${esc(v.titre)}</a></li>`).join('\n')}
</ul>
</section>
${pied(signaler)}`;
}

// ---------------------------------------------------------------- fiches enrichies
// Exercices corrigés (familles de la notion, graine fixe : la page ne change pas d'une génération à l'autre)
// et vraies questions du CEB qui se comprennent sans document.
const TYPES_PAGE = new Set(['qcm', 'qcm_multi', 'numerique', 'texte_court', 'vrai_faux', 'trous']);
const notionsDe = (c) => [c.fiche ?? c.domaine, ...(c.formes ?? []).map((x) => x?.fiche), ...(c.notions ?? [])].filter(Boolean);
const lisible = (q) => { try { return bonneReponseLisible(q) ?? ''; } catch { return ''; } };
// Une question officielle sans document peut encore renvoyer à un texte, une photo, une carte… : on l'écarte.
const DEICTIQUE = /\b(ces|cette|cet)\b|ci-dess|texte|document|photo|dessin|illustration|image|carte|schéma|tableau|graphique|\bplan\b|figure|portfolio|livret|page|légende|lithographie|représenté|« Je »|\bil\b|\belle\b/i;

export function exemplesFiche(modeles, id, n = 4) {
  const rng = createRng(`fiche-exemples|${id}`);
  const familles = rng.shuffle(modeles.filter((m) => notionsDe(m).includes(id) && (m.poids ?? 1) > 0));
  const out = [], vus = new Set(), cles = new Set(), parFamille = new Map();
  const plafond = Math.max(1, Math.ceil(n / Math.max(1, familles.length)));
  for (let t = 0; t < 600 && out.length < n && familles.length; t++) {
    const m = familles[t % familles.length];
    if ((parFamille.get(m.id) ?? 0) >= plafond) continue;
    let q = null; try { q = genererVariante(m, rng, vus); } catch { q = null; }
    if (!q || q.fiche !== id || !TYPES_PAGE.has(q.type) || q.figure || q.documents?.length || q.enonce.length > 240) continue;
    const r = lisible(q); if (!r || r.length > 200 || /undefined|NaN/.test(r + q.enonce)) continue;
    const cle = normaliserTexte(q.cleContenu ?? q.enonce); if (cles.has(cle)) continue;
    cles.add(cle); vus.add(q.id); parFamille.set(m.id, (parFamille.get(m.id) ?? 0) + 1); out.push(q);
  }
  return out.sort((a, b) => (a.difficulte ?? 2) - (b.difficulte ?? 2));
}

export function officiellesParFiche(examens) {
  const parFiche = {}, annees = {};
  for (const ex of examens) for (const q of ex.questions) {
    if (!q.fiche) continue;
    (annees[q.fiche] ??= new Map()).set(ex.id, ex);
    if (q.numerisable === false || !estJouable(q) || !TYPES_PAGE.has(q.type)) continue;
    if (q.documents?.length || q.figure || q.enonce.length < 35 || q.enonce.length > 320) continue;
    if (/^(fr\.lire|fr\.ecouter)/.test(q.domaine ?? '')) continue;
    if (DEICTIQUE.test(`${q.enonce} ${q.texte ?? ''} ${(q.choix ?? []).join(' ')}`)) continue;
    const r = lisible(q); if (!r || r.length > 200) continue;
    (parFiche[q.fiche] ??= []).push({ ex, q });
  }
  const choisies = {};
  for (const [id, liste] of Object.entries(parFiche)) {
    liste.sort((a, b) => (b.q.corrigeVerifie === true) - (a.q.corrigeVerifie === true) || b.ex.annee - a.ex.annee || (b.ex.referentiel === 'tronc_commun') - (a.ex.referentiel === 'tronc_commun'));
    const cles = new Set(), annee = new Set(), garde = [];
    for (const x of liste) {
      const cle = normaliserTexte(x.q.enonce);
      if (cles.has(cle) || annee.has(x.ex.annee)) continue;
      cles.add(cle); annee.add(x.ex.annee); garde.push(x);
      if (garde.length === 2) break;
    }
    choisies[id] = garde;
  }
  const examensDe = Object.fromEntries(Object.entries(annees).map(([id, m]) => [id, [...m.values()].sort((a, b) => a.annee - b.annee || (a.referentiel === 'tronc_commun') - (b.referentiel === 'tronc_commun'))]));
  return { choisies, examensDe };
}

// Une question rendue en HTML statique : énoncé, texte à trous (« …… »), choix, puis réponse et explication repliées.
function questionStatique(q, i, source = '') {
  const texte = q.texte ? `<span class="texte-trous">${esc(q.texte).replace(/\{\d+\}/g, '……').replace(/\s+·\s+|\n/g, '<br>')}</span>` : '';
  const puce = q.type === 'qcm_multi' ? '☐' : '○';
  const choix = q.choix?.length ? `<span class="choix choix-liste">${q.choix.map((c) => `<span class="ch">${puce} ${esc(c)}</span>`).join('')}</span>` : '';
  const multi = q.type === 'qcm_multi' ? ' <i>(plusieurs réponses)</i>' : '';
  return `<details class="exemple"><summary><span class="num">${i + 1}</span>${esc(q.enonce).replace(/\n/g, '<br>')}${multi}${texte}${choix}${source}</summary><p><b>Réponse :</b> ${esc(lisible(q))}${q.explication ? `<br>${esc(q.explication)}` : ''}</p></details>`;
}

function blocsEnrichis({ exemples, officielles, annees }) {
  const nomEx = (ex) => ex.referentiel === 'tronc_commun' ? `CEB ${ex.annee} (tronc commun)` : ex.annee === 2026 ? `CEB ${ex.annee} (socles)` : `CEB ${ex.annee}`;
  const lienEx = (ex) => `../examens/${ex.id}.html`;
  let h = '';
  if (exemples.length) h += `<section class="matiere"><h2>Exercices corrigés</h2><p class="mute-t">Essaie de répondre, puis ouvre la réponse. Dans l'application, ces exercices changent à chaque partie.</p>
${exemples.map((q, i) => questionStatique(q, i)).join('\n')}</section>\n`;
  if (officielles.length) h += `<section class="matiere"><h2>Dans les vrais CEB</h2><p class="mute-t">Questions posées à l'épreuve officielle, avec la réponse du corrigé.</p>
${officielles.map(({ ex, q }, i) => questionStatique(q, i, `<span class="source-ceb">${esc(nomEx(ex))} · livret ${q.livret} · question ${esc(String(q.numero))}</span>`)).join('\n')}</section>\n`;
  if (annees.length) h += `<p class="dans-ceb">Cette notion dans les anciens CEB : ${annees.map((ex) => `<a href="${lienEx(ex)}">${esc(nomEx(ex))}</a>`).join(' · ')}</p>\n`;
  return h;
}

function pageIndex(parMatiere, nbFiches) {
  const titre = 'Fiches de révision du CEB : toutes les règles';
  const description = `Les ${nbFiches} règles à connaître pour le CEB en français, maths, histoire-géo et sciences, expliquées simplement. Exemples et exercices corrigés.`;
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

// ---------------------------------------------------------------- pages « recherche » (référencement)
const MAILTO = `mailto:${ADRESSE_SIGNALEMENT}?subject=${encodeURIComponent('[Mission CEB] Erreur signalée')}`;
const NOM_MAT_COURT = { fr: 'Français', ma: 'Maths', hg: 'Histoire-géo', sc: 'Sciences' };
const SLUG = { fr: 'francais', ma: 'maths', hg: 'histoire-geo', sc: 'sciences' };
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const dateLongue = (iso) => { const d = new Date(iso + 'T12:00:00'); return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`; };
const filAriane = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, ...(item ? { item } : {}) })) });
const heros = (sur, h1, intro, extra = '') => `<div class="heros"><p class="sur">${sur}</p><h1>${h1}</h1><p class="intro">${intro}</p>${extra}</div>`;
const pageSimple = ({ titre, description, chemin, ariane, h, corps }) =>
  `${tete({ titre, description, chemin, type: 'website', jsonld: [filAriane(ariane)] }).replace('<!--heros-->', h)}\n${corps}\n${pied(MAILTO)}`;
const blocJouer = (texte, lien = '../app/', bouton = 'Commencer') => `<section class="agir"><h2>${texte}</h2><div class="boutons"><a class="btn btn-cta" href="${lien}">${bouton}</a><a class="btn" href="../imprimer.html">Imprimer un examen blanc</a></div><p class="mute">Sans compte et sans publicité. La progression reste sur l'appareil de l'enfant.</p></section>`;

function nomExamen(ex) { return ex.referentiel === 'tronc_commun' ? `CEB ${ex.annee} (tronc commun)` : ex.annee === 2026 ? `CEB ${ex.annee} (socles)` : `CEB ${ex.annee}`; }
function slugExamen(ex) { return ex.id.replace(/^ceb-/, 'ceb-'); }

// Documents officiels : lien vers enseignement.be (FWB) + copie de secours hébergée dans archives/.
let TELE = null;
const NOM_DOC = { questionnaire: 'Questionnaire (livrets de questions)', portfolio: 'Portfolio (documents)', correction: 'Consignes de passation et correction' };
function blocTelechargements(ex) {
  const t = TELE?.examens?.[ex.id];
  if (!t) return '';
  const base = TELE.baseOfficielle.replace('{annee}', t.annee);
  return `<section class="matiere"><h2>Télécharger les documents officiels</h2>
<p>Publiés par la Fédération Wallonie-Bruxelles. Le lien « officiel » ouvre le fichier sur enseignement.be ; la « copie » est gardée par Mission CEB, au cas où le lien officiel ne marcherait plus.${ex.annee === 2021 ? ' L\'épreuve 2020 ayant été annulée, le CEB 2021 a repris les documents préparés pour 2020 : ils portent la mention « CEB2020 ».' : ''}</p>
<ul class="telechargements">${t.documents.map((d) => `<li><b>${NOM_DOC[d.type]}</b> <a class="btn" href="${base}${d.fichier}" rel="noopener">📄 Officiel (PDF)</a> <a class="btn" href="../archives/${d.fichier}" download>💾 Copie</a></li>`).join('')}</ul></section>`;
}

function pageExamen(ex, tous) {
  const nom = nomExamen(ex);
  const livrets = livretsReels(ex);
  const jouables = livrets.reduce((s, l) => s + l.questions.length, 0);
  const jours = [...new Set((ex.livrets ?? []).map((l) => l.date).filter(Boolean))].sort();
  const titre = ex.referentiel === 'tronc_commun' ? `CEB ${ex.annee} tronc commun : l'examen en ligne` : ex.annee === 2026 ? `CEB ${ex.annee} socles : l'examen en ligne` : `CEB ${ex.annee} : l'examen complet en ligne`;
  const description = `Le ${nom} livret par livret : matières, dates, durées et ${jouables} questions à refaire en ligne, corrigées tout de suite.`;
  const ligne = (l) => {
    const r = livrets.find((x) => x.n === l.n);
    return `<tr><td>${l.n}</td><td>${esc(l.titre)}</td><td>${NOM_MAT_COURT[l.matiere] ?? ''}</td><td class="nw">${l.date ? (() => { const d = new Date(l.date + 'T12:00:00'); return `${JOURS[d.getDay()].slice(0, 3)}. ${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}`; })() : '—'}</td><td class="pts">${l.points ?? '—'}</td><td>${r ? `${r.questions.length}` : '<span class="papier">papier</span>'}</td></tr>`;
  };
  const autres = tous.filter((x) => x.id !== ex.id);
  const corps = `<section class="matiere"><h2>Les livrets du ${esc(nom)}</h2>
<p>${jours.length ? `L'épreuve s'est déroulée du ${dateLongue(jours[0])} au ${dateLongue(jours.at(-1))}. ` : ''}${ex.referentiel === 'tronc_commun' ? 'Elle évalue les référentiels du <b>tronc commun</b>, comme le CEB 2027.' : 'Elle évalue les <b>socles de compétences</b>.'} Les questions à faire sur papier (écoute, rédaction, tracés) ne sont pas proposées à l'écran.</p>
<div class="tableau"><table><thead><tr><th>N°</th><th>Intitulé</th><th>Matière</th><th>Date</th><th class="pts">Points</th><th>En ligne</th></tr></thead><tbody>
${(ex.livrets ?? []).map(ligne).join('\n')}
</tbody></table></div></section>
${blocTelechargements(ex)}
<section class="agir"><h2>Refaire le ${esc(nom)}</h2><div class="boutons"><a class="btn btn-cta" href="../app/?examen=${encodeURIComponent(ex.id)}">Passer cet examen en ligne</a><a class="btn" href="../imprimer.html">Imprimer un examen blanc</a></div>
<p class="mute">${jouables} questions corrigées tout de suite, avec les documents du portfolio. Mode « Examen réel » : livret par livret, chronométré, correction à la fin. Le questionnaire officiel et son portfolio sont publiés par la Fédération Wallonie-Bruxelles sur <a href="https://www.enseignement.be" style="color:#fff">enseignement.be</a>.</p></section>
<section class="voisines"><h2>Les autres CEB</h2><ul>${autres.map((x) => `<li><a href="${slugExamen(x)}.html">${esc(nomExamen(x))}</a></li>`).join('')}</ul></section>`;
  return pageSimple({ titre, description, chemin: `examens/${slugExamen(ex)}.html`, ariane: [['Mission CEB', SITE], ['Examens', `${SITE}examens/`], [nom]],
    h: heros('Anciens examens', `Le ${esc(nom)}`, `${(ex.livrets ?? []).length} livrets, ${jouables} questions à refaire en ligne, corrigées tout de suite.`), corps });
}

function pageExamens(tous) {
  const carte = (ex) => { const n = livretsReels(ex).reduce((s, l) => s + l.questions.length, 0);
    return `<a class="carte-mat" href="${slugExamen(ex)}.html"><b>${ex.annee}${ex.referentiel === 'tronc_commun' ? ' · TC' : ex.annee === 2026 ? ' · socles' : ''}</b><small>${ex.referentiel === 'tronc_commun' ? 'Tronc commun (comme le CEB 2027)' : 'Socles de compétences'}</small><span>${n} questions →</span></a>`; };
  const corps = `<nav class="cartes-mat annees" aria-label="Années">${[...tous].reverse().map(carte).join('')}</nav>
<section class="matiere"><h2>Pourquoi refaire les anciens CEB ?</h2>
<ul class="regle"><li>On découvre la forme des questions et des livrets, et le rythme de l'épreuve.</li><li>On repère les matières à retravailler : le bilan indique le score par livret et par matière.</li><li>Le jour J, le stress baisse : on sait à quoi s'attendre.</li></ul>
<p>Le CEB 2027 porte sur les référentiels du <b>tronc commun</b> : commencez par le <a href="ceb-2026-tc.html">CEB 2026 tronc commun</a>, puis les années précédentes pour vous entraîner davantage.</p></section>
${blocJouer('Prêt pour un examen blanc ?', '../app/', 'Passer un examen en ligne')}`;
  return pageSimple({ titre: 'Anciens examens du CEB 2015-2026 en ligne', description: 'Tous les CEB depuis 2015 à refaire en ligne, livret par livret, avec correction immédiate et bilan par matière. Le CEB 2026 tronc commun en entier.',
    chemin: 'examens/', ariane: [['Mission CEB', SITE], ['Examens']], h: heros('Anciens examens', 'Tous les CEB depuis 2015, à refaire en ligne', 'Les épreuves officielles, avec leurs documents, corrigées tout de suite. À l\'écran comme le jour J, ou sur papier.'), corps });
}

function pageExercices(m, fiches, exemples) {
  const M = MATIERES[m];
  const titre = `Exercices CEB ${M.court} corrigés`;
  const description = `Exercices de ${M.long} pour le CEB : questions toujours nouvelles, corrigées tout de suite, et la règle à revoir. ${fiches.length} fiches.`;
  const ex = exemples.map((q, i) => `<details class="exemple"><summary><span class="num">${i + 1}</span>${esc(q.enonce)}${q.choix ? `<span class="choix">${q.choix.map((c) => esc(c)).join(' · ')}</span>` : ''}</summary><p><b>Réponse :</b> ${esc(bonneReponseLisible(q))}${q.explication ? `<br>${esc(q.explication)}` : ''}</p></details>`).join('\n');
  const corps = `<section class="matiere"><h2>Quelques exemples de questions</h2><p class="mute-t">Dans l'application, ces questions changent à chaque partie (nombres, mots, contextes) : l'enfant ne retombe jamais sur la même.</p>
${ex}</section>
${blocJouer(`S'entraîner en ${M.long}`, `../app/?matiere=${m}`, `Commencer les exercices de ${M.court}`)}
<section class="matiere"><h2>Les ${fiches.length} fiches de ${M.long}</h2><ul class="liste">${fiches.map((f) => `<li><a href="../fiches/${f.id}.html">${emo(f.e)}<span>${esc(f.titre)}</span></a></li>`).join('')}</ul></section>
<section class="voisines"><h2>Les autres matières</h2><ul>${Object.keys(MATIERES).filter((x) => x !== m).map((x) => `<li><a href="${SLUG[x]}.html">Exercices de ${MATIERES[x].long}</a></li>`).join('')}</ul></section>`;
  return pageSimple({ titre, description, chemin: `exercices/${SLUG[m]}.html`, ariane: [['Mission CEB', SITE], ['Exercices', `${SITE}exercices/`], [M.nom]],
    h: heros('Exercices pour le CEB', `<img src="../assets/ui/${m}.webp" alt="" width="64" height="64" class="ic-h1"> Exercices de ${M.long}`, `Des questions toujours nouvelles, corrigées tout de suite, et la règle à revoir en cas d'erreur.`), corps });
}

function pageExercicesIndex(parMatiere) {
  const SOUS = { fr: 'Lire, grammaire, conjugaison, orthographe', ma: 'Nombres, grandeurs, géométrie, données', hg: 'Repères, cartes, Belgique et monde', sc: 'Vivant, matière, énergie' };
  const corps = `<nav class="cartes-mat" aria-label="Matières">${Object.keys(MATIERES).map((m) => `<a class="carte-mat" href="${SLUG[m]}.html"><img src="../assets/ui/${m}.webp" alt="" width="88" height="88"><b>${NOM_MAT_COURT[m]}</b><small>${SOUS[m]}</small><span>Exercices →</span></a>`).join('')}</nav>
<section class="matiere"><h2>Comment fonctionnent les exercices ?</h2><ul class="regle">
<li><b>Des questions toujours nouvelles</b> : 222 familles de questions produisent des milliers de variantes ; jamais deux fois la même dans une partie.</li>
<li><b>Une correction immédiate</b>, avec la règle à revoir en cas d'erreur.</li>
<li><b>Un coach</b> qui repère les notions fragiles et les fait revenir quelques jours plus tard.</li>
<li><b>Les vraies questions du CEB</b> de 2015 à 2026, mélangées aux exercices si on le souhaite.</li></ul></section>
${blocJouer('Dix minutes par jour suffisent')}`;
  return pageSimple({ titre: 'Exercices corrigés pour le CEB', description: 'Exercices pour préparer le CEB en français, maths, histoire-géo et sciences : questions toujours nouvelles, corrigées tout de suite, sans compte.',
    chemin: 'exercices/', ariane: [['Mission CEB', SITE], ['Exercices']], h: heros('Exercices pour le CEB', 'S\'entraîner au CEB, matière par matière', 'Français, maths, histoire-géo et sciences : choisis une matière et réponds à 10 questions.'), corps });
}

// Page CEB 2027 : tout vient de data/ceb-2027.json (source unique, à mettre à jour le jour de la circulaire).
const dateCourte = (iso) => { const d = new Date(iso + 'T12:00:00'); return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`; };
export function pageCeb2027(C) {
  const confirme = C.statut === 'confirme';
  const src = C.source || {};
  const nomSource = [src.intitule || 'la circulaire officielle', src.numero ? `n° ${src.numero}` : '', src.date ? `du ${dateCourte(src.date)}` : ''].filter(Boolean).join(' ');
  const statut = confirme
    ? `<div class="encart statut-ok"><h2>✅ Informations officielles</h2><p>Confirmées par ${src.url ? `<a href="${esc(src.url)}" rel="noopener">${esc(nomSource)}</a>` : esc(nomSource)}. Mise à jour du ${dateCourte(C.miseAJour)}.</p></div>`
    : `<div class="encart statut-attente"><h2>⏳ Dates annoncées, en attente de la circulaire</h2><p>La Fédération Wallonie-Bruxelles publie chaque année une circulaire qui fixe officiellement le calendrier et l'organisation du CEB. Dès sa parution, cette page est mise à jour. Dernière mise à jour : ${dateCourte(C.miseAJour)}.</p></div>`;
  const avecLivrets = C.jours.some((j) => j.livrets);
  const premier = C.jours[0].date, dernier = C.jours.at(-1).date;
  const du = `du ${new Date(premier + 'T12:00:00').getDate()} au ${dateCourte(dernier)}`;
  const s = C.seuils;
  const echec = `En cas d'échec, le jury de l'école peut encore accorder le CEB en tenant compte du dossier de l'élève. Un élève sans CEB entre quand même en 1re secondaire, avec un accompagnement renforcé.`;
  const FAQ = [
    [`Quand a lieu le CEB ${C.annee} ?`, `${confirme ? 'Le' : 'Selon les dates annoncées, le'} CEB ${C.annee} a lieu ${du}, le matin : ${C.jours.map((j) => `${JOURS[new Date(j.date + 'T12:00:00').getDay()]} ${j.matiere.toLowerCase()}`).join(', ')}.`],
    [`Que faut-il pour réussir le CEB ${C.annee} ?`, `Au moins ${s.matiere} % dans chaque matière (français, mathématiques, sciences, formation historique et géographique) et au moins ${s.moyenne} % de moyenne. Ce seuil a été fixé par ${s.base}.`],
    ['Que se passe-t-il si mon enfant n\'obtient pas son CEB ?', echec],
    [`Sur quoi porte le CEB ${C.annee} ?`, `Sur les attendus des référentiels du tronc commun. L'épreuve 2026 « tronc commun » est le meilleur modèle pour s'entraîner.`],
    ...(C.resultats ? [[`Quand connaîtra-t-on les résultats du CEB ${C.annee} ?`, `Les résultats sont communiqués le ${dateCourte(C.resultats)}.`]] : []),
  ];
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, r]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: r } })) };
  const pageLd = { '@context': 'https://schema.org', '@type': 'WebPage', name: `CEB ${C.annee} : dates, matières et réussite`, url: `${SITE}ceb-2027/`, inLanguage: 'fr-BE', dateModified: C.miseAJour, ...(confirme && src.url ? { citation: src.url } : {}) };
  const corps = `<section class="matiere"><h2>Les dates du CEB ${C.annee}</h2>${statut}<div class="tableau"><table><thead><tr><th>Jour</th><th>Matière</th>${avecLivrets ? '<th>Livrets</th>' : ''}</tr></thead><tbody>
${C.jours.map((j) => `<tr><td>${dateLongue(j.date)}</td><td>${j.matiere}</td>${avecLivrets ? `<td>${esc(j.livrets || '')}</td>` : ''}</tr>`).join('')}</tbody></table></div>
<p>Les épreuves ont lieu le matin, dans l'école de l'élève, avec les mêmes questions dans toutes les écoles de la Fédération Wallonie-Bruxelles.${C.resultats ? ` Résultats communiqués le <b>${dateCourte(C.resultats)}</b>.` : ''}</p>
${(C.complements || []).map((t) => `<p>${t}</p>`).join('\n')}</section>
<section class="matiere"><h2>Ce qui change : le tronc commun</h2><p>Le CEB ${C.annee} évalue les attendus des nouveaux <b>référentiels du tronc commun</b>. En 2026, deux épreuves existaient (socles et tronc commun) ; l'épreuve 2026 « tronc commun » est donc le meilleur modèle pour s'entraîner. Les livrets portent des intitulés nouveaux, par exemple « Géométrie », « Arithmétique » ou « Traitement de données » en mathématiques.</p>
<p><a href="../examens/ceb-2026-tc.html">Voir le CEB 2026 tronc commun livret par livret →</a></p></section>
<section class="matiere"><h2>Comment réussir le CEB ?</h2><p>Il faut au moins <b>${s.matiere} % dans chaque matière</b> (français, mathématiques, sciences, formation historique et géographique) <b>et</b> au moins <b>${s.moyenne} % de moyenne</b>. Ce seuil a été fixé par ${s.base}. ${echec}</p>
<p class="mute-t">Seules les communications officielles de la Fédération Wallonie-Bruxelles (enseignement.be) et de l'école font foi.</p></section>
<section class="matiere"><h2>Questions fréquentes</h2>${FAQ.map(([q, r]) => `<details class="exemple faq"><summary>${esc(q)}</summary><p>${esc(r)}</p></details>`).join('\n')}</section>
<section class="matiere"><h2>Par où commencer ?</h2><ul class="regle"><li><a href="../reviser-le-ceb/">Un plan de révision en 8 semaines</a></li><li><a href="../exercices/">Des exercices par matière</a></li><li><a href="../fiches/">Les fiches de révision</a></li><li><a href="../examens/">Les anciens examens depuis 2015</a></li></ul></section>
${blocJouer('Commencer à réviser dès aujourd\'hui')}`;
  const description = `CEB ${C.annee} : les dates (${du}), les matières de chaque jour, le tronc commun et les seuils de réussite. Avec des exercices pour s'entraîner.`;
  const h = heros('Le guide', `CEB ${C.annee} : tout ce qu'il faut savoir`, 'Dates, matières, tronc commun et conditions de réussite, résumés pour les parents et les élèves.', `<p class="compte-a-rebours">Plus que <b id="jours">quelques</b> jours</p><script>{const j=Math.ceil((new Date("${premier}T08:00:00")-new Date())/864e5);if(j>0)document.getElementById("jours").textContent=j}</script>`);
  return `${tete({ titre: `CEB ${C.annee} : dates, matières et réussite`, description, chemin: 'ceb-2027/', type: 'website', jsonld: [filAriane([['Mission CEB', SITE], [`CEB ${C.annee}`]]), pageLd, faqLd] }).replace('<!--heros-->', h)}\n${corps}\n${pied(MAILTO)}`;
}

// Page « Pour les enseignants » : le kit pour les écoles (affiche, billets, QR, lien à copier).
export function pageEnseignants() {
  const lienHtml = '<a href="https://missionceb.be/">Mission CEB : s\'entraîner au CEB en ligne</a>';
  const corps = `<section class="matiere"><h2>Mission CEB en bref</h2><p>Un site pour s'entraîner au CEB, en classe ou à la maison : les <b>examens officiels de 2015 à 2026</b> livret par livret, des <b>questions toujours nouvelles</b> dans les quatre matières, et une <b>fiche</b> pour revoir la règle après chaque erreur. Les questions et les fiches suivent les référentiels du <b>tronc commun</b>, comme le CEB 2027.</p>
<ul class="regle"><li><b>Aucun compte</b> : l'élève choisit un pseudo, c'est tout.</li><li><b>Aucune donnée envoyée</b> : la progression reste dans le navigateur de l'appareil. Rien à déclarer, rien à faire signer aux parents.</li><li><b>Sans publicité</b>, sans achat dans l'application. Gratuit pour les élèves et pour les écoles.</li><li>Fonctionne sur <b>tablette, ordinateur, tableau interactif</b> et téléphone, même hors ligne une fois ouvert.</li></ul></section>
<section class="matiere"><h2>En classe</h2><ul class="regle">
<li><b>Examens blancs sur papier</b> : <a href="../imprimer.html">la page « Examen papier »</a> compose un examen complet, court ou par matière, avec son corrigé. Chaque examen a un <b>code</b> : le même code redonne exactement le même examen et le même corrigé, pour toute la classe.</li>
<li><b>Fiches ciblées</b> : une à quatre notions au choix, avec le rappel de la règle et des exercices du plus facile au plus difficile, à imprimer.</li>
<li><b>Anciens CEB</b> : <a href="../examens/">chaque examen depuis 2015</a>, livret par livret, à projeter ou à faire en salle informatique. Les documents officiels (questionnaire, portfolio, consignes de passation et correction) sont téléchargeables sur chaque page.</li>
<li><b>Défi de classe</b> : un élève lance un défi et partage le lien ; tous ceux qui l'ouvrent reçoivent les mêmes questions.</li>
<li><b>Mode « Examen réel »</b> : livret par livret, chronométré aux durées officielles, correction à la fin.</li></ul></section>
<section class="matiere"><h2>Le kit à imprimer</h2><ul class="telechargements">
<li><span class="kit-txt"><b>Affiche A4</b> pour la classe ou le couloir, avec QR code.</span><a class="btn" href="../assets/kit/affiche-mission-ceb.pdf" download>📄 Affiche (PDF)</a></li>
<li><span class="kit-txt"><b>Billets pour le journal de classe</b> : 4 billets par feuille, à découper et à coller, pour prévenir les parents.</span><a class="btn" href="../assets/kit/billets-journal-de-classe.pdf" download>📄 Billets (PDF)</a></li>
<li><span class="kit-txt"><b>QR code seul</b>, pour un document de l'école.</span><a class="btn" href="../assets/kit/qr-missionceb.png" download>🖼️ PNG</a> <a class="btn" href="../assets/kit/qr-missionceb.svg" download>🖼️ SVG</a></li></ul></section>
<section class="matiere"><h2>Mettre un lien sur le site de l'école</h2><p>Dans une page « Liens utiles » ou « 6e primaire », il suffit d'ajouter l'adresse <b>https://missionceb.be/</b>. Pour un site web, voici le lien prêt à copier :</p>
<pre class="code-lien"><code>${esc(lienHtml)}</code></pre>
<p>Pour un courriel ou une lettre aux parents : « Pour préparer le CEB à la maison, votre enfant peut s'entraîner sur missionceb.be (vrais examens du CEB, exercices corrigés, sans compte et sans publicité). »</p></section>
<section class="matiere"><h2>Une erreur, une idée ?</h2><p>Chaque question a un bouton « Signaler une erreur ». Pour une remarque d'enseignant (une réponse discutable, une notion qui manque, un usage en classe à faciliter), écrivez à <a href="mailto:${ADRESSE_SIGNALEMENT}">${ADRESSE_SIGNALEMENT}</a>.</p></section>
${blocJouer('Essayer comme un élève')}`;
  const ld = { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Mission CEB pour les enseignants', url: `${SITE}enseignants/`, inLanguage: 'fr-BE', audience: { '@type': 'EducationalAudience', educationalRole: 'teacher' } };
  const titre = 'Mission CEB pour les enseignants et les écoles';
  const description = 'Préparer le CEB en classe : examens blancs imprimables avec corrigé, anciens CEB livret par livret, fiches ciblées, affiche et billets pour les parents. Sans compte.';
  const h = heros('Pour les enseignants', 'Mission CEB en classe', 'Examens blancs, fiches à imprimer, anciens CEB à projeter, et un kit pour prévenir les parents.');
  return `${tete({ titre, description, chemin: 'enseignants/', type: 'website', jsonld: [filAriane([['Mission CEB', SITE], ['Enseignants']]), ld] }).replace('<!--heros-->', h)}\n${corps}\n${pied(MAILTO)}`;
}

function pageReviser() {
  const PLAN = [
    ['Semaines 1 et 2', 'Faire le point', 'Un examen blanc complet (le CEB 2026 tronc commun) pour repérer les matières fragiles. Puis 10 questions par jour en entraînement.'],
    ['Semaines 3 et 4', 'Les bases en maths et en français', 'Calcul, fractions, grandeurs ; conjugaison, accords, compréhension. Revoir la fiche de chaque erreur.'],
    ['Semaines 5 et 6', "L'éveil", 'Histoire, géographie et sciences : repères dans le temps, cartes, vivant, matière, énergie. Les cartes-mémoire aident à retenir.'],
    ['Semaine 7', 'Les points faibles', 'Missions ciblées du coach sur les notions fragiles, et une fiche papier par jour.'],
    ['Semaine 8', 'Comme le jour J', 'Un ou deux examens en mode « Examen réel », livret par livret et chronométrés, puis la revue des erreurs.'],
  ];
  const corps = `<section class="matiere"><h2>Un plan en 8 semaines</h2><ol class="plan">${PLAN.map(([q, t, d]) => `<li><span class="quand">${q}</span><b>${t}</b><p>${d}</p></li>`).join('')}</ol></section>
<section class="matiere"><h2>Nos conseils</h2><ul class="regle">
<li><b>Peu mais souvent</b> : dix à quinze minutes par jour valent mieux qu'une longue séance le week-end.</li>
<li><b>Revoir ses erreurs</b> : c'est là qu'on progresse le plus. Après une erreur, lire la règle, puis refaire une question du même type quelques jours plus tard.</li>
<li><b>Varier les matières</b> : l'éveil (histoire, géographie, sciences) compte autant que le français et les maths.</li>
<li><b>S'entraîner aussi sur papier</b> : le jour J, on écrit, on trace et on lit des documents.</li>
<li><b>Garder confiance</b> : le CEB vérifie ce qu'on a appris en primaire, rien de plus.</li></ul></section>
${blocJouer('Commencer le plan aujourd\'hui')}`;
  return pageSimple({ titre: 'Bien réviser le CEB : plan en 8 semaines', description: 'Comment s\'entraîner pour le CEB : un plan de révision en 8 semaines, des conseils simples et des exercices corrigés en français, maths et éveil.',
    chemin: 'reviser-le-ceb/', ariane: [['Mission CEB', SITE], ['Bien réviser le CEB']],
    h: heros('Le guide', 'Comment bien réviser le CEB', 'Un plan simple en 8 semaines et quelques conseils qui font la différence.'), corps });
}

// Exemples fixes (graine) pour les pages d'exercices : questions générées, sans les questions officielles.
function exemplesMatiere(modeles, m, n = 5) {
  const rng = createRng(`exemples|${m}`);
  const types = ['qcm', 'numerique', 'texte_court', 'vrai_faux'];
  const familles = modeles.filter((x) => x.matiere === m && (x.difficulte ?? 1) <= 2);
  const out = [], vus = new Set();
  for (let i = 0; i < familles.length * 3 && out.length < n; i++) {
    const f = familles[Math.floor(rng.next() * familles.length)];
    if (vus.has(f.id)) continue;
    let q = null; try { q = genererVariante(f, rng, new Set()); } catch { q = null; }
    if (!q || !types.includes(q.type) || q.enonce.length > 220 || q.figure || q.documents?.length) continue;
    vus.add(f.id); out.push(q);
  }
  return out;
}

// ---------------------------------------------------------------- corrigés à relire (enseignant)
// Pages imprimables, non référencées (noindex + robots.txt) : toutes les réponses établies par Mission CEB.
function pageRelecture(ex) {
  const nom = nomExamen(ex);
  const qs = ex.questions.filter((q) => q.numerisable !== false && (q.reponse != null || q.type === 'ouverte'));
  const aVerifier = qs.filter((q) => !q.corrigeVerifie).length;
  const lisible = (q) => { try { return bonneReponseLisible(q); } catch { return ''; } };
  const parLivret = (ex.livrets ?? []).map((l) => ({ l, qs: qs.filter((q) => q.livret === l.n) })).filter((x) => x.qs.length);
  return `<!doctype html>
<html lang="fr-BE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Relecture du corrigé — ${esc(nom)} | Mission CEB</title>
<style>
body { font:14px/1.45 'Atkinson Hyperlegible', Arial, sans-serif; color:#111; margin:24px auto; max-width:900px; padding:0 16px; }
h1 { font-size:22px; margin:0 0 4px; } h2 { font-size:17px; margin:22px 0 6px; border-bottom:2px solid #111; padding-bottom:3px; break-after:avoid; }
.intro { color:#444; margin:0 0 14px; } .intro b { color:#111; }
table { width:100%; border-collapse:collapse; } td, th { border:1px solid #bbb; padding:5px 7px; vertical-align:top; text-align:left; }
th { background:#f1f1f1; font-size:12px; } tr { break-inside:avoid; }
td.n { width:44px; font-weight:700; white-space:nowrap; } td.rep { width:28%; white-space:pre-line; } td.ok { width:150px; font-size:12px; color:#444; }
.choix { color:#555; font-size:12px; display:block; margin-top:3px; } .verif { color:#1a7a3c; font-weight:700; }
.case { display:inline-block; width:11px; height:11px; border:1.5px solid #333; vertical-align:-2px; margin-right:4px; }
.imprimer { float:right; font:700 14px Arial; padding:8px 14px; border-radius:8px; border:0; background:#1d3f9e; color:#fff; cursor:pointer; }
@media print { .imprimer { display:none; } body { margin:0; } }
</style></head><body>
<button class="imprimer" onclick="print()">Imprimer</button>
<h1>Relecture du corrigé — ${esc(nom)}</h1>
<p class="intro">${qs.length} questions corrigées par Mission CEB, dont <b>${aVerifier} à vérifier</b> (les autres, marquées « vérifiée », ont déjà été relues). Pour chaque ligne : cochez OK, ou écrivez la bonne réponse. Le questionnaire et le portfolio officiels sont publiés par la FWB sur enseignement.be. Renvoi : missionceb@outlook.be.</p>
${parLivret.map(({ l, qs: liste }) => `<h2>Livret ${l.n} · ${esc(l.titre)}</h2>
<table><thead><tr><th>Question</th><th>Énoncé (résumé)</th><th>Réponse du site</th><th>Votre avis</th></tr></thead><tbody>
${liste.map((q) => `<tr><td class="n">${esc(q.numero)}</td><td>${esc(couper(q.enonce, 260))}${q.choix ? `<span class="choix">${q.choix.map((c, i) => `${'ABCDEFGH'[i]}. ${esc(couper(c, 60))}`).join(' · ')}</span>` : ''}</td><td class="rep">${q.type === 'ouverte' ? '<i>Réponse modèle :</i> ' : ''}${esc(couper(lisible(q), 400))}</td><td class="ok">${q.corrigeVerifie ? '<span class="verif">✓ vérifiée</span>' : '<span class="case"></span>OK<br><span class="case"></span>À corriger :<br>…………………'}</td></tr>`).join('\n')}
</tbody></table>`).join('\n')}
</body></html>
`;
}

// Renvoie { chemin: contenu } pour tous les fichiers générés.
export async function generer() {
  const lireTexte = async (c) => readFile(new URL(c, RACINE), 'utf8');
  const lireJson = async (c) => JSON.parse(await lireTexte(c));
  const donnees = await chargerDonnees({ base: 'data/', fetchJson: async (c) => JSON.parse(await lireTexte(c)) });
  const banque = [...donnees.banque, ...await donnees.questionsExamens()];
  const nbEx = exercicesParNotion(banque, donnees.modeles);
  const fiches = Object.values(donnees.fiches).filter((f) => MATIERES[f.matiere]).sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));
  const parMatiere = Object.fromEntries(Object.keys(MATIERES).map((m) => [m, fiches.filter((f) => f.matiere === m)]));
  const out = {};
  const examens = [];
  for (const meta of (await lireJson('data/examens/index.json')).examens.filter((e) => e.statut !== 'a_encoder')) examens.push(await donnees.chargerExamen(meta.id));
  examens.sort((a, b) => a.annee - b.annee || (a.referentiel === 'tronc_commun') - (b.referentiel === 'tronc_commun'));
  const { choisies, examensDe } = officiellesParFiche(examens);
  for (const f of fiches) {
    const liste = parMatiere[f.matiere];
    const i = liste.indexOf(f);
    const voisines = [...liste.slice(i + 1), ...liste.slice(0, i)].slice(0, 8);
    const enrichi = { exemples: exemplesFiche(donnees.modeles, f.id), officielles: choisies[f.id] ?? [], annees: examensDe[f.id] ?? [] };
    out[`fiches/${f.id}.html`] = pageFiche(f, voisines, nbEx[f.id] ?? 0, enrichi);
  }
  out['fiches/index.html'] = pageIndex(parMatiere, fiches.length);
  // Pages « recherche » : examens par année, exercices par matière, guides.
  TELE = await lireJson('data/telechargements.json');
  for (const ex of examens) out[`examens/${slugExamen(ex)}.html`] = pageExamen(ex, examens);
  out['examens/index.html'] = pageExamens(examens);
  for (const m of Object.keys(MATIERES)) out[`exercices/${SLUG[m]}.html`] = pageExercices(m, parMatiere[m], exemplesMatiere(donnees.modeles, m));
  out['exercices/index.html'] = pageExercicesIndex(parMatiere);
  for (const ex of examens) out[`relecture/${slugExamen(ex)}.html`] = pageRelecture(ex);
  const CEB27 = await lireJson('data/ceb-2027.json');
  out['ceb-2027/index.html'] = pageCeb2027(CEB27);
  out['reviser-le-ceb/index.html'] = pageReviser();
  out['enseignants/index.html'] = pageEnseignants();
  out['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[SITE, `${SITE}ceb-2027/`, `${SITE}enseignants/`, `${SITE}examens/`, `${SITE}exercices/`, `${SITE}reviser-le-ceb/`, `${SITE}fiches/`,
  ...examens.map((ex) => `${SITE}examens/${slugExamen(ex)}.html`), ...Object.values(SLUG).map((x) => `${SITE}exercices/${x}.html`),
  ...fiches.map((f) => `${SITE}fiches/${f.id}.html`)].map((u) => `<url><loc>${u}</loc>${u === `${SITE}ceb-2027/` ? `<lastmod>${CEB27.miseAJour}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
  out['robots.txt'] = `User-agent: *\nAllow: /\nDisallow: /maquettes/\nDisallow: /relecture/\nDisallow: /moteur.html\n\nSitemap: ${SITE}sitemap.xml\n`;

  // Service worker : fichiers du cœur de l'application + version = empreinte de leur contenu.
  const coeur = [
    'index.html', 'app/index.html', 'imprimer.html', 'manifest.webmanifest',
    ...(await lireDossier('css/')), ...(await lireDossier('js/')), ...(await lireDossier('data/')), ...(await lireDossier('assets/icones/')), ...(await lireDossier('assets/polices/')), ...(await lireDossier('assets/avatars/')), ...(await lireDossier('assets/ui/')), ...(await lireDossier('assets/emoji/')),
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
  for (const d of ['examens/', 'exercices/', 'ceb-2027/', 'reviser-le-ceb/', 'enseignants/', 'relecture/']) await mkdir(new URL(d, RACINE), { recursive: true });
  for (const [p, c] of Object.entries(out)) await writeFile(new URL(p, RACINE), c);
  console.log(`${Object.keys(out).length} fichiers générés (${Object.keys(out).filter((p) => p.startsWith('fiches/')).length} pages de fiches).`);
}
