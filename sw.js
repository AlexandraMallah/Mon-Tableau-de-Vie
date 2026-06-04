// Service Worker — Mon Tableau de Vie
const CACHE = "mon-tableau-v1780561369";
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
          // Mise en cache sans query params (pour gérer ?_cb=timestamp)
          const cacheUrl = new URL(e.request.url);
          cacheUrl.search = "";
          const cacheReq = new Request(cacheUrl.toString(), e.request);
          caches.open(CACHE).then(c => c.put(cacheReq, clone));
        }
        return res;
      })
      .catch(() =>
        // Cherche d'abord avec l'URL exacte, puis sans query params
        caches.match(e.request, { ignoreSearch: true })
      )
  );
});

// Message skipWaiting (forcé depuis la page)
self.addEventListener("message", e => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});
