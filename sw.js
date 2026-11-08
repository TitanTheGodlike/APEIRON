// Apeiron service worker: always fetch the newest version when online, fall back to the
// cached copy when offline, so the game also works without a connection once visited.
const CACHE = 'apeiron-v3'; // v2: the game is split into css/ and js/; v3: every file is checked with the server
const FILES = ['./', './index.html', './css/style.css', './js/core.js', './js/content.js', './js/architect.js', './js/state.js', './js/actions.js', './js/tick.js', './js/cards.js', './js/save.js', './js/secrets.js', './js/sound.js', './js/intro.js', './js/story.js', './js/sky.js', './js/ui.js', './js/webs.js', './js/tabs.js', './js/main.js', './manifest.webmanifest', './favicon.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // no-cache: ask the server whether each file changed (a quick 304 if not), so after an update the page and its
  // scripts are never a mix of old and new copies from the browser cache
  const req = e.request.mode === 'navigate' ? e.request : new Request(e.request, { cache: 'no-cache' });
  e.respondWith(
    fetch(req)
      .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
