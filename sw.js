// Mission CEB — fonctionnement hors ligne (service worker).
// FICHIER GÉNÉRÉ par `npm run generer` à partir de scripts/sw-modele.js : ne pas le modifier à la main.
//
// - Le cœur du site (pages, code, questions, fiches, icônes) est copié à l'installation : tout marche sans internet.
// - Les pages du portfolio (images des examens) sont copiées au fur et à mesure qu'on les ouvre.
// - Nouvelle version publiée = nouveau numéro VERSION : le navigateur la télécharge en arrière-plan,
//   l'application propose « Mettre à jour », puis l'ancienne copie est effacée.
const VERSION = 'ee4ff3670c0e';
const COEUR = `coeur-${VERSION}`;
const IMAGES = 'images-v1';
const PAGES = 'pages-v1';
const POLICES = 'polices-v1';
const FICHIERS = [
 "./",
 "assets/avatars/01-renard.webp",
 "assets/avatars/02-loup.webp",
 "assets/avatars/03-tigre.webp",
 "assets/avatars/04-lion.webp",
 "assets/avatars/05-panda.webp",
 "assets/avatars/06-koala.webp",
 "assets/avatars/07-grenouille.webp",
 "assets/avatars/08-pieuvre.webp",
 "assets/avatars/09-requin.webp",
 "assets/avatars/10-dragon.webp",
 "assets/avatars/11-aigle.webp",
 "assets/avatars/12-licorne.webp",
 "assets/avatars/13-robot.webp",
 "assets/avatars/14-extraterrestre.webp",
 "assets/avatars/15-astronaute.webp",
 "assets/avatars/16-ninja.webp",
 "assets/avatars/17-astronaute-fille.webp",
 "assets/avatars/18-ninja-fille.webp",
 "assets/icones/apple-touch-icon.png",
 "assets/icones/favicon-32.png",
 "assets/icones/favicon-48.png",
 "assets/icones/favicon.ico",
 "assets/icones/icone-192.png",
 "assets/icones/icone-512.png",
 "assets/icones/icone-maskable-192.png",
 "assets/icones/icone-maskable-512.png",
 "assets/icones/logo-128.png",
 "assets/icones/partage.jpg",
 "assets/ui/accueil.webp",
 "assets/ui/amis.webp",
 "assets/ui/astuce.webp",
 "assets/ui/badges.webp",
 "assets/ui/chrono.webp",
 "assets/ui/defi.webp",
 "assets/ui/entrainement.webp",
 "assets/ui/examen.webp",
 "assets/ui/fiches.webp",
 "assets/ui/fr.webp",
 "assets/ui/gemmes.webp",
 "assets/ui/hg.webp",
 "assets/ui/ma.webp",
 "assets/ui/papier.webp",
 "assets/ui/progres.webp",
 "assets/ui/sc.webp",
 "assets/ui/serie.webp",
 "assets/ui/style.webp",
 "assets/ui/xp.webp",
 "css/app.css",
 "css/fiches.css",
 "css/papier.css",
 "data/banque/francais.json",
 "data/banque/histgeo.json",
 "data/banque/maths.json",
 "data/banque/sciences.json",
 "data/catalogue.json",
 "data/examens/ceb-2015.json",
 "data/examens/ceb-2016.json",
 "data/examens/ceb-2017.json",
 "data/examens/ceb-2018.json",
 "data/examens/ceb-2019.json",
 "data/examens/ceb-2021.json",
 "data/examens/ceb-2022.json",
 "data/examens/ceb-2023.json",
 "data/examens/ceb-2024.json",
 "data/examens/ceb-2025.json",
 "data/examens/ceb-2026-so.json",
 "data/examens/ceb-2026-tc.json",
 "data/examens/durees-livrets.json",
 "data/examens/index.json",
 "data/faits/fr.json",
 "data/faits/hg.json",
 "data/faits/ma.json",
 "data/faits/sc.json",
 "data/fiches-fr.json",
 "data/fiches-hg.json",
 "data/fiches-ma.json",
 "data/fiches-sc.json",
 "data/fiches.json",
 "data/modeles/familles-fr.json",
 "data/modeles/familles-hg.json",
 "data/modeles/familles-ma.json",
 "data/modeles/familles-sc.json",
 "data/modeles/francais.json",
 "data/modeles/histgeo.json",
 "data/modeles/maths.json",
 "data/modeles/tc-fr.json",
 "data/modeles/tc-hg.json",
 "data/modeles/tc-ma.json",
 "data/modeles/tc-sc.json",
 "imprimer.html",
 "index.html",
 "js/app/app.js",
 "js/app/avatars.js",
 "js/app/cartes.js",
 "js/app/coach.js",
 "js/app/confort.js",
 "js/app/defi-amis.js",
 "js/app/icones.js",
 "js/app/imprimer.js",
 "js/app/parents.js",
 "js/app/progression.js",
 "js/app/question-ui.js",
 "js/app/signaler.js",
 "js/app/store.js",
 "js/engine/checker.js",
 "js/engine/examen-reel.js",
 "js/engine/expr.js",
 "js/engine/format.js",
 "js/engine/generateurs/conjugaison.js",
 "js/engine/generateurs/faits.js",
 "js/engine/generateurs/gen-francais.js",
 "js/engine/generateurs/gen-histgeo.js",
 "js/engine/generateurs/gen-nombres.js",
 "js/engine/generateurs/gen-sciences.js",
 "js/engine/generateurs/histoire.js",
 "js/engine/generateurs/index.js",
 "js/engine/generateurs/tc-fr.js",
 "js/engine/generateurs/tc-hg.js",
 "js/engine/generateurs/tc-ma.js",
 "js/engine/generateurs/tc-sc.js",
 "js/engine/generator.js",
 "js/engine/index.js",
 "js/engine/loader.js",
 "js/engine/papier.js",
 "js/engine/random.js",
 "js/engine/session.js",
 "js/engine/traces.js",
 "manifest.webmanifest"
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(COEUR).then((c) => c.addAll(FICHIERS.map((f) => new Request(f, { cache: 'reload' })))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const nom of await caches.keys()) if (nom.startsWith('coeur-') && nom !== COEUR) await caches.delete(nom);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => { if (e.data === 'MISE_A_JOUR') self.skipWaiting(); });

// Réseau d'abord (page à jour), copie de secours sinon.
async function reseauDabord(req, nomCache) {
  const cache = await caches.open(nomCache);
  try {
    const r = await fetch(req);
    if (r.ok) cache.put(req, r.clone());
    return r;
  } catch {
    return (await cache.match(req)) ?? (await caches.match(req)) ?? Response.error();
  }
}
// Copie d'abord (rapide, hors ligne), réseau si absent ; la copie est gardée.
async function copieDabord(req, nomCache) {
  const deja = await caches.match(req, { ignoreSearch: nomCache === COEUR });
  if (deja) return deja;
  try {
    const r = await fetch(req);
    if (r.ok || r.type === 'opaque') (await caches.open(nomCache)).put(req, r.clone());
    return r;
  } catch {
    return Response.error(); // hors ligne et jamais copié (ex. une police) : la page fait sans
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Polices Google : gardées après la première visite.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') return e.respondWith(copieDabord(req, POLICES));
  if (url.origin !== self.location.origin) return;
  const chemin = url.pathname.slice(new URL(self.registration.scope).pathname.length);
  if (chemin.startsWith('fiches/') || chemin === 'sitemap.xml' || chemin === 'robots.txt') return e.respondWith(reseauDabord(req, PAGES));
  if (chemin.startsWith('assets/20')) return e.respondWith(copieDabord(req, IMAGES));
  if (req.mode === 'navigate') {
    // L'application (index.html, imprimer.html) vient de la copie de la version installée : code et page restent assortis.
    const page = chemin === '' || chemin === 'index.html' ? 'index.html' : chemin;
    return e.respondWith(caches.match(page, { ignoreSearch: true, cacheName: COEUR }).then((r) => r ?? reseauDabord(req, PAGES)));
  }
  e.respondWith(copieDabord(req, COEUR));
});
