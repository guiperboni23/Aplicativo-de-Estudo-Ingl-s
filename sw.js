// Service worker: deixa o app abrir offline e funcionar como aplicativo no celular.
// Troque a versão quando mudar arquivos — isso limpa o cache antigo.
const VERSION = 'speakup-v4';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/app.js',
  './js/state.js',
  './js/speech.js',
  './js/utils.js',
  './js/lessons.js',
  './js/tutor.js',
  './js/ai.js',
  './js/persona.js',
  './js/corrector/engine.js',
  './js/corrector/rules.js',
  './js/corrector/morphology.js',
  './js/missions.js',
  './js/views/conversation.js',
  './js/views/map.js',
  './js/views/mission.js',
  './js/views/progress.js',
  './js/views/settings.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL).catch(() => { /* segue mesmo se um arquivo faltar */ });
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/api/')) return;

  // Páginas: rede primeiro (pega atualizações), cache se estiver offline.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(VERSION);
        cache.put(request, fresh.clone());
        return fresh;
      } catch {
        return (await caches.match(request)) || (await caches.match('./index.html'));
      }
    })());
    return;
  }

  // Demais arquivos: responde do cache e atualiza em segundo plano.
  event.respondWith((async () => {
    const cached = await caches.match(request);
    const network = fetch(request).then((response) => {
      if (response.ok) caches.open(VERSION).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(() => cached);
    return cached || network;
  })());
});
