// Service Worker — Mon Tableau de Vie
const CACHE = "mon-tableau-v1792486556";
// index.html exclu du précache — toujours servi network-first avec no-cache
const ASSETS = [
  "/Mon-Tableau-de-Vie/manifest.json",
  "/Mon-Tableau-de-Vie/icon-192-v3.png",
  "/Mon-Tableau-de-Vie/icon-512-v3.png"
];
// Copie de SECOURS de la page, utilisée UNIQUEMENT hors connexion. Elle est mise à jour après chaque
// chargement réussi depuis le réseau (jamais pendant l'installation : c'est ce qui servait autrefois
// une vieille version après une mise à jour). En ligne, la page vient toujours du réseau.
const OFFLINE_PAGE = "/Mon-Tableau-de-Vie/__hors-ligne.html";

// Installation : mise en cache des ressources statiques (pas index.html)
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activation : suppression des anciens caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch : network-first pour l'app, cache en fallback
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // L'appli + ses bibliothèques (graphiques, Firebase) : gardées aussi pour pouvoir s'ouvrir hors connexion
  const LIBS = ["cdn.jsdelivr.net", "www.gstatic.com", "fonts.googleapis.com", "fonts.gstatic.com"];
  if (!url.origin.includes("github.io") && !url.origin.includes("localhost") && !LIBS.includes(url.hostname)) return;

  const isHtml = url.pathname.endsWith(".html") || url.pathname.endsWith("/");
  const isApp = url.pathname.endsWith("/Mon-Tableau-de-Vie/") || url.pathname.endsWith("/index.html"); // la page de l'appli (pas les maquettes)

  e.respondWith(
    // index.html : cache: 'no-cache' → le navigateur valide toujours avec le serveur
    fetch(e.request, isHtml ? { cache: "no-cache" } : {})
      .then(res => {
        if (res.ok || res.type === "opaque") { // "opaque" = script d'un autre site (bibliothèques), utilisable tel quel
          // Cloner TOUT DE SUITE (avant return), sinon le corps est déjà consommé
          const copy = res.clone();
          const cacheUrl = new URL(e.request.url);
          cacheUrl.search = "";
          if (!isHtml || isApp) caches.open(CACHE).then(c => c.put(new Request(isHtml ? OFFLINE_PAGE : cacheUrl.toString()), copy));
        }
        return res;
      })
      // Hors connexion : dernière version chargée de la page (avant : page d'erreur du navigateur)
      .catch(() => (isHtml ? caches.match(isApp ? OFFLINE_PAGE : e.request, { ignoreSearch: true }) : caches.match(e.request, { ignoreSearch: true }))
        .then(r => r || Response.error()))
  );
});

// Toucher une notification (rappel pilule) : ouvre ou ramène l'appli au premier plan
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    const c = list.find(w => w.url.includes("/Mon-Tableau-de-Vie/"));
    return c ? c.focus() : self.clients.openWindow("/Mon-Tableau-de-Vie/");
  }));
});

// Message skipWaiting (forcé depuis la page)
self.addEventListener("message", e => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});
