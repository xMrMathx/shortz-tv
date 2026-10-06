/* Shortz TV service worker — cache the app shell, leave media on network */
const CACHE = "shortztv-v1";
const SHELL = ["index.html", "catalog.js", "manifest.json",
  "icon-192.png", "icon-512.png", "icon-512-maskable.png"];

function isShell(url) {
  if (url.origin !== location.origin) return false;
  const p = url.pathname;
  if (p.endsWith("/shortz-tv/") || p.endsWith("/shortz-tv")) return true; // start_url
  return SHELL.some(f => p.endsWith("/" + f));
}

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !isShell(new URL(e.request.url))) return; // thumbnails/embeds: network
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match("index.html"));
    })
  );
});
