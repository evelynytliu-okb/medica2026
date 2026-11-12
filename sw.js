// MEDICA 2026 出差手冊：離線快取。版本 20261112-122721（每次 build 都會變 → 瀏覽器會自動裝新版）
const CACHE = 'medica26';
const SHELL = ['./', './index.html', './manifest.webmanifest'];
self.addEventListener('install', e => {
  // 一定從網路抓新頁面（cache:'reload' 跳過 HTTP 快取），存進快取後立刻接手
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u =>
    fetch(new Request(u, {cache: 'reload'})).then(r => { if (r.ok) return c.put(u, r); })
  ))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.endsWith('version.json') || url.pathname.endsWith('sw.js')) return;   // 永遠問網路
  const sameOrigin = url.origin === self.location.origin;
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !font) return;
  if (req.cache === 'reload' || req.cache === 'no-store') {             // 「檢查更新」或強制重新整理：走網路並更新快取
    e.respondWith(fetch(req).then(res => {
      if (res.ok && sameOrigin) caches.open(CACHE).then(c => c.put(req, res.clone()));
      return res;
    }).catch(() => caches.match(req, {ignoreSearch: true})));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, {ignoreSearch: sameOrigin});
    if (hit) return hit;                                          // 有存就用存的（省流量、離線可用）
    const res = await fetch(req);
    if (res.ok || res.type === 'opaque') c.put(req, res.clone());
    return res;
  }));
});
