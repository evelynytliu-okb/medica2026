// MEDICA 2026 出差手冊：離線快取。頁面、發音檔、字型存在裝置裡；version.json 一律走網路。
const CACHE = 'medica26';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html', './manifest.webmanifest'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.endsWith('version.json')) return;            // 檢查更新：永遠問網路
  const sameOrigin = url.origin === self.location.origin;
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !font) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, {ignoreSearch: sameOrigin && url.pathname.endsWith('/')});
    if (hit) return hit;                                          // 有存就用存的（省流量、離線可用）
    const res = await fetch(req);
    if (res.ok || res.type === 'opaque') c.put(req, res.clone());
    return res;
  }));
});
