/* Shortz TV service worker — app shell: network-first for the page (always fresh when online), cache-first for the rest */
const CACHE = "shortztv-v3";
const SHELL = ["catalog.js", "manifest.json",
  "icon-192.png", "icon-512.png", "icon-512-maskable.png"];
const PAGE = ["index.html"];

function isCatalog(url) {
  if (url.origin !== location.origin) return false;
  return url.pathname.endsWith("/catalog.js") || url.pathname.endsWith("/catalog.json");
}

function isPage(url) {
  if (url.origin !== location.origin) return false;
  const p = url.pathname;
  if (p.endsWith("/shortz-tv/") || p.endsWith("/shortz-tv")) return true; // start_url
  return PAGE.some(f => p.endsWith("/" + f));
}

function isShell(url) {
  if (url.origin !== location.origin) return false;
  const p = url.pathname;
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
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (isPage(url)) {
    // The page itself: always try network first so updates reach the app immediately.
    // (The app needs internet for videos anyway; cache is only the offline fallback.)
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
    return;
  }
  if (!isShell(url)) return; // thumbnails/embeds: network
  if (isCatalog(url)) {
    // Catalog DATA (not shell): network first, so a fresh catalog reaches
    // repeat viewers with no cache clearing. Full-URL match (no ignoreSearch)
    // so catalog.js?v=<new> can never serve a stale cached copy. Offline falls
    // back to the cached copy.
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
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
