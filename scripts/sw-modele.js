// Mission CEB — fonctionnement hors ligne (service worker).
// FICHIER GÉNÉRÉ par `npm run generer` à partir de scripts/sw-modele.js : ne pas le modifier à la main.
//
// - Le cœur du site (pages, code, questions, fiches, icônes) est copié à l'installation : tout marche sans internet.
// - Les pages du portfolio (images des examens) sont copiées au fur et à mesure qu'on les ouvre.
// - Nouvelle version publiée = nouveau numéro VERSION : le navigateur la télécharge en arrière-plan,
//   l'application propose « Mettre à jour », puis l'ancienne copie est effacée.
const VERSION = '__VERSION__';
const COEUR = `coeur-${VERSION}`;
const IMAGES = 'images-v1';
const PAGES = 'pages-v1';
const POLICES = 'polices-v1';
const FICHIERS = __FICHIERS__;

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
  if (chemin.startsWith('assets/') && !chemin.startsWith('assets/icones/')) return e.respondWith(copieDabord(req, IMAGES));
  if (req.mode === 'navigate') {
    // L'application (index.html, imprimer.html) vient de la copie de la version installée : code et page restent assortis.
    const page = chemin === '' || chemin === 'index.html' ? 'index.html' : chemin;
    return e.respondWith(caches.match(page, { ignoreSearch: true, cacheName: COEUR }).then((r) => r ?? reseauDabord(req, PAGES)));
  }
  e.respondWith(copieDabord(req, COEUR));
});
