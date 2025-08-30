// /lamaisonrose/sw.js
const CACHE_NAME = "lamaisonrose-v1";
const APP_SHELL = [
  "/lamaisonrose/",
  "/lamaisonrose/index.html",
  "/lamaisonrose/pronostics.html",
  "/lamaisonrose/inventairebb.html",
  "/lamaisonrose/vehicules.html",
  "/lamaisonrose/manifest.webmanifest"
  // + (facultatif) tes css/js externes si tu en as
];

// très simple: cache-first pour l'app shell, network-first pour le reste
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // Ne pas intercepter les appels Google Apps Script (laisser le réseau gérer)
  const isAppsScript = url.hostname.includes("script.google.com");
  if (isAppsScript) return; // réseau direct (utile pour POST et auth)

  // Cache-first pour l'app shell
  if (APP_SHELL.includes(url.pathname) || url.pathname === "/lamaisonrose/") {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }

  // Network-first par défaut
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
