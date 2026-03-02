// RaceFacer Frontend-Only Service Worker
// Caches static assets for faster loads; race data always comes from live WebSocket

const CACHE_NAME = 'racefacer-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.main.js',
    './js/core/config.js',
    './js/core/state.js',
    './js/services/websocket.service.js',
    './js/services/storage.service.js',
    './js/services/lap-tracker.service.js',
    './js/services/driver-selection.service.js',
    './js/services/session-history.service.js',
    './js/utils/time-formatter.js',
    './js/utils/ui-helpers.js',
    './js/utils/calculations.js',
    './js/utils/audio.js',
    './js/utils/tts.js',
    './js/utils/incident-detector.js',
    './js/utils/timestamp-filter.js',
    './js/views/race.view.js',
    './js/views/hud.view.js',
    './js/views/results.view.js',
    './js/views/compare.view.js',
    './js/views/summary.view.js',
    './js/views/settings.view.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Caching static assets');
            // Cache each file individually, ignoring failures (e.g. missing icons)
            return Promise.allSettled(STATIC_ASSETS.map(url => cache.add(url)));
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Always fetch WebSocket and external CDN requests from network
    const url = event.request.url;
    if (url.includes('socket.io') || url.includes('racefacer.com')) {
        return;
    }

    // Cache-first for static assets, network fallback
    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request);
        })
    );
});
