// Service worker ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â cache offline para a PWA "CrÃƒÆ’Ã‚Â´nicas do Vazio".
// Suba o CACHE_VERSION sempre que mudar arquivos para forÃƒÆ’Ã‚Â§ar atualizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o.
const CACHE_VERSION = 'cronicas-v5';

// Arquivos prÃƒÆ’Ã‚Â©-cacheados (caminhos relativos ao local do sw.js).
// IMPORTANTE: ao separar dados em data/*.js depois, adicione-os aqui,
// senÃƒÆ’Ã‚Â£o o app quebra offline.
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './Img/menu.png',
];

// Instala: prÃƒÆ’Ã‚Â©-cacheia os arquivos essenciais.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Ativa: remove caches de versÃƒÆ’Ã‚Âµes antigas.
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first. Se nÃƒÆ’Ã‚Â£o houver em cache, busca na rede e guarda.
// NavegaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o (abrir o app) sempre cai no index.html quando offline.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        // sÃƒÆ’Ã‚Â³ cacheia respostas vÃƒÆ’Ã‚Â¡lidas do mesmo domÃƒÆ’Ã‚Â­nio
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
