// Service Worker — Mon Tableau de Vie
const CACHE = "mon-tableau-v1780992411";
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
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (!url.origin.includes("github.io") && !url.origin.includes("localhost")) return;

  const isHtml = url.pathname.endsWith(".html") || url.pathname.endsWith("/");

  e.respondWith(
    // index.html : cache: 'no-cache' → le navigateur valide toujours avec le serveur
    fetch(e.request, isHtml ? { cache: "no-cache" } : {})
      .then(res => {
        if (res.ok && !isHtml) {
          // Cloner TOUT DE SUITE (avant return), sinon le corps est déjà consommé
          const copy = res.clone();
          const cacheUrl = new URL(e.request.url);
          cacheUrl.search = "";
          caches.open(CACHE).then(c => c.put(new Request(cacheUrl.toString()), copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

// Message skipWaiting (forcé depuis la page)
self.addEventListener("message", e => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});
