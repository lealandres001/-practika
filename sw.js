/* ============================================================
   PRACTIKA · Service Worker
   Cachea la app para uso offline (PWA instalable).
   Estrategia: cache-first con fallback a red.
   ============================================================ */
const CACHE = "practika-v3";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/css/styles.css",
  "./js/data/seed.js",
  "./js/core/store.js",
  "./js/core/state.js",
  "./js/core/format.js",
  "./js/core/api.js",
  "./js/core/gateway.js",
  "./js/services/catalog.service.js",
  "./js/services/cart.service.js",
  "./js/services/routing.service.js",
  "./js/services/order.service.js",
  "./js/services/metrics.service.js",
  "./js/services/prediction.service.js",
  "./js/ui/components.js",
  "./js/ui/catalog.view.js",
  "./js/ui/checkout.view.js",
  "./js/ui/academy.view.js",
  "./js/ui/operator.view.js",
  "./js/ui/admin.view.js",
  "./js/app.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
