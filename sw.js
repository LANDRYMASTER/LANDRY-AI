/* ============================================================
   LANDRY — Service Worker
   Mise en cache pour fonctionnement hors-ligne (PWA)
   ============================================================ */

const CACHE_NAME = "landry-v1.0.0";

// Fichiers à mettre en cache pour fonctionner hors-ligne
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/variables.css",
  "./css/style.css",
  "./css/animation.css",
  "./css/responsive.css",
  "./js/config.js",
  "./js/storage.js",
  "./js/screens.js",
  "./js/app.js",
  "./assets/avatar-landry.png",
  "./assets/logo.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
];

/* ── Installation : mise en cache des ressources ─────────── */
self.addEventListener("install", (event) => {
  console.log("[LANDRY SW] Installation...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[LANDRY SW] Mise en cache des ressources");
      // On ignore les erreurs sur des ressources individuelles
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("[LANDRY SW] Impossible de mettre en cache:", url, err);
          })
        )
      );
    })
  );
  // Prendre le contrôle immédiatement
  self.skipWaiting();
});

/* ── Activation : nettoyage des anciens caches ────────────── */
self.addEventListener("activate", (event) => {
  console.log("[LANDRY SW] Activation...");
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("[LANDRY SW] Suppression ancien cache:", name);
            return caches.delete(name);
          })
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch : stratégie Cache First + Network Fallback ────── */
self.addEventListener("fetch", (event) => {
  // Ignorer les requêtes non GET et les appels API Dify
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("api.dify.ai") ||
    event.request.url.includes("fonts.gstatic.com")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Ressource trouvée en cache — servir immédiatement
        return cachedResponse;
      }

      // Pas en cache — aller chercher sur le réseau
      return fetch(event.request)
        .then((networkResponse) => {
          // Mettre en cache les nouvelles ressources
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Hors-ligne et pas en cache : page de fallback si HTML
          if (event.request.destination === "document") {
            return caches.match("./index.html");
          }
        });
    })
  );
});
