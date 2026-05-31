// Service Worker — Mon Tableau de Vie
const CACHE = "mon-tableau-v142";
const ASSETS = [
  "/Mon-Tableau-de-Vie/",
  "/Mon-Tableau-de-Vie/index.html",
  "/Mon-Tableau-de-Vie/manifest.json",
  "/Mon-Tableau-de-Vie/icon-192.png",
  "/Mon-Tableau-de-Vie/icon-512.png"
];

// Installation : mise en cache des ressources principales
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
  // Ignore les requêtes non-GET et les externes (Firebase, CDN…)
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (!url.origin.includes("github.io") && !url.origin.includes("localhost")) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
