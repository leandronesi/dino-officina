/* La pagina è network-first: un nuovo deploy deve comparire subito. Gli asset
   restano cache-first, così il gioco continua a partire anche senza rete. */
var CACHE = 'dino-officina-bdbfb096d9';
var NAV_TIMEOUT = 2500;
var SHELL = ['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-180.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.allSettled(SHELL.map(function (u) { return c.add(u); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function cachedPage(req) {
  return caches.match(req, { ignoreSearch: true }).then(function (hit) {
    return hit || caches.match('./index.html', { ignoreSearch: true });
  });
}
function store(req, res) {
  if (!res || !res.ok) return;
  caches.open(CACHE).then(function (c) { c.put(req, res.clone()); }).catch(function () {});
}
function navigate(req) {
  return new Promise(function (resolve) {
    var settled = false;
    var timer = setTimeout(function () {
      if (settled) return;
      cachedPage(req).then(function (hit) { if (!settled && hit) { settled = true; resolve(hit); } });
    }, NAV_TIMEOUT);
    fetch(req).then(function (res) {
      clearTimeout(timer); store(req, res);
      if (!settled) { settled = true; resolve(res); }
    }).catch(function () {
      clearTimeout(timer);
      if (!settled) cachedPage(req).then(function (hit) { settled = true; resolve(hit || Response.error()); });
    });
  });
}
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate' || req.destination === 'document') { e.respondWith(navigate(req)); return; }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    if (hit) { fetch(req).then(function (res) { store(req, res); }).catch(function () {}); return hit; }
    return fetch(req).then(function (res) { store(req, res); return res; }).catch(function () { return cachedPage(req); });
  }));
});
