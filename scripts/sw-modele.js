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
const FICHIERS = __FICHIERS__;

self.addEventListener('install', (e) => {
  // Prend la main tout de suite : sinon une ancienne version reste active tant qu'un onglet est ouvert
  // (et continue d'afficher l'ancienne page d'accueil).
  e.waitUntil(caches.open(COEUR).then((c) => c.addAll(FICHIERS.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const nom of await caches.keys()) if ((nom.startsWith('coeur-') && nom !== COEUR) || nom === 'polices-v1') await caches.delete(nom); // polices-v1 : ancienne copie des polices Google
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
  if (url.origin !== self.location.origin) return;
  const chemin = url.pathname.slice(new URL(self.registration.scope).pathname.length);
  if (chemin.startsWith('fiches/') || chemin === 'sitemap.xml' || chemin === 'robots.txt') return e.respondWith(reseauDabord(req, PAGES));
  if (chemin.startsWith('assets/20')) return e.respondWith(copieDabord(req, IMAGES));
  // Textes d'écoute enregistrés (plusieurs Mo, lus par morceaux) : laissés au navigateur.
  if (chemin.startsWith('assets/audio/')) return;
  // Page d'accueil (vitrine) : toujours la version en ligne, la copie ne sert que hors ligne.
  if (req.mode === 'navigate' && (chemin === '' || chemin === 'index.html')) {
    return e.respondWith(fetch(req).catch(() => caches.match('index.html', { cacheName: COEUR }).then((r) => r ?? Response.error())));
  }
  if (req.mode === 'navigate') {
    // Pages du site (accueil, app/, imprimer.html) vient de la copie de la version installée : code et page restent assortis.
    const page = chemin === '' ? 'index.html' : chemin.endsWith('/') ? `${chemin}index.html` : chemin;
    return e.respondWith(caches.match(page, { ignoreSearch: true, cacheName: COEUR }).then((r) => r ?? reseauDabord(req, PAGES)));
  }
  e.respondWith(copieDabord(req, COEUR));
});
