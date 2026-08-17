// Service worker : rend le jeu utilisable hors ligne une fois la premiere
// visite faite. Utile en voiture, en vacances, ou simplement quand le reseau
// est mauvais.
//
// Changer ce numero de version force le remplacement de tout l'ancien cache.
const CACHE = 'multiplication-v2.0.0';

// La musique n'est pas prechargee : 1,5 Mo imposes a quelqu'un qui ouvre juste
// la page serait exactement le probleme qu'on cherche a corriger. Elle rejoint
// le cache la premiere fois qu'une partie est lancee.
const SHELL = [
    './',
    './index.html',
    './config.html',
    './highscores.html',
    './manifest.webmanifest',
    './css/style.css',
    './js/storage.js',
    './js/config.js',
    './js/questions.js',
    './js/game.js',
    './js/config-page.js',
    './js/highscores-page.js',
    './js/register-sw.js',
    './js/vendor/confetti.min.js',
    './assets/fonts/Daydream.ttf',
    './assets/img/diamond_yellow.webp',
    './assets/img/diamond_pink.webp',
    './assets/img/diamond_shine.webp',
    './assets/img/config.webp',
    './assets/img/trophee.webp',
    './assets/img/mute.webp',
    './assets/img/unmute.webp',
    './assets/img/icon-192.png',
    './assets/audio/error.mp3'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE)
            .then(cache => cache.addAll(SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key !== CACHE).map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // L'archive v1.7 doit rester servie telle quelle, sans passer par ce cache.
    if (url.pathname.includes('/v1.7/')) return;

    // Pages HTML : le reseau d'abord, pour qu'une mise a jour du jeu arrive
    // sans avoir a vider le cache a la main. Le cache prend le relais hors ligne.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const copy = response.clone();
                    caches.open(CACHE).then(cache => cache.put(request, copy));
                    return response;
                })
                .catch(() => caches.match(request).then(hit => hit || caches.match('./index.html')))
        );
        return;
    }

    // Ressources : le cache d'abord, elles ne changent qu'avec une nouvelle
    // version du service worker.
    event.respondWith(
        caches.match(request).then(hit => {
            if (hit) return hit;
            return fetch(request).then(response => {
                // Les fichiers audio sont souvent demandes par tranches : la
                // reponse est alors un 206 partiel, que le Cache API refuse de
                // stocker. On ne met en cache que les reponses completes.
                const cacheable = response.status === 200
                    && response.type === 'basic'
                    && !request.headers.has('range');
                if (cacheable) {
                    const copy = response.clone();
                    caches.open(CACHE).then(cache => cache.put(request, copy));
                }
                return response;
            });
        })
    );
});
