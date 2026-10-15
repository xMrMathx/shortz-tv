/* Shortz TV service worker — app shell: network-first for the page (always fresh when online), cache-first for the rest */
const CACHE = "shortztv-v7"; // bumped 2026-10-15: catalog goes cache-first (Piece 1 transfer diet)
const CATALOG_CACHE = "shortztv-catalog-v1"; // survives shell bumps; keys are content-addressed URLs
const THUMBS = "shortztv-thumbs-v1";
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

function isJs(url) {
  if (url.origin !== location.origin) return false;
  return url.pathname.includes("/js/") && url.pathname.endsWith(".js");
}

function isShell(url) {
  if (url.origin !== location.origin) return false;
  const p = url.pathname;
  return SHELL.some(f => p.endsWith("/" + f));
}

function isThumb(url) {
  // Cover art hosts: cache-first so repeat visits render instantly.
  return /^(i\.ytimg\.com|vumbnail\.com|www\.dailymotion\.com|archive\.org)$/.test(url.hostname);
}

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== THUMBS && k !== CATALOG_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (isThumb(url)) {
    // Cover art: serve from cache instantly, refresh in background.
    e.respondWith(
      caches.open(THUMBS).then(c => c.match(e.request).then(hit => {
        const net = fetch(e.request).then(res => {
          if (res && res.ok) c.put(e.request, res.clone());
          return res;
        }).catch(() => hit);
        return hit || net;
      }))
    );
    return;
  }
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
  if (isJs(url)) {
    // App modules: network-first, like the catalog — a fresh page must
    // never pair with a stale module out of the HTTP cache (Pages serves
    // js with max-age=600; the ?fresh= reload only busts the document).
    // The script tags also carry ?v=<build>; this is the second lock.
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  if (!isShell(url)) return; // thumbnails/embeds: network
  if (isCatalog(url)) {
    // Catalog DATA — CACHE-FIRST in the dedicated catalog cache (Piece 1,
    // 2026-10-15). Both catalog URLs are content-addressed: catalog.js
    // carries ?v=<git blob hash of its content> (bumped by the ingest
    // pipeline on every catalog change) and the boot fetches
    // catalog.json?v=<build version> (the version stamp moves on every
    // ship). Same URL therefore always means same bytes, so a cache hit
    // is never stale — and repeat opens stop re-downloading ~88 MB of
    // catalog on every launch. A new deploy changes the URL, misses the
    // cache, and fetches fresh: the auto-fresh law is preserved exactly.
    e.respondWith(
      caches.open(CATALOG_CACHE).then(c => c.match(e.request).then(hit => {
        if (hit) return hit;
        return fetch(e.request).then(res => {
          if (res && res.ok) { const copy = res.clone(); c.put(e.request, copy); }
          return res;
        }).catch(() => caches.match(e.request));
      }))
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
