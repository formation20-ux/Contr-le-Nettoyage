const CACHE_NAME = 'controle-nettoyage-v3';
const APP_SHELL = [
  './index.html',
  './app.js',
  './manifest.json',
];

self.addEventListener('install', (event)=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event)=>{
  event.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stratégie "cache d'abord" pour la coquille de l'appli : permet de
// recharger l'appli même sans réseau (réserve, sous-sol...). Les points de
// contrôle eux-mêmes sont stockés dans IndexedDB, géré côté app.js.
self.addEventListener('fetch', (event)=>{
  if(event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached=>{
      return cached || fetch(event.request).then(resp=>{
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(event.request, clone));
        return resp;
      }).catch(()=>cached);
    })
  );
});
