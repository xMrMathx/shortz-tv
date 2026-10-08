// Cloudflare Pages Function: proxies the MangaDex API through the app's own
// origin. MangaDex sends no CORS headers, so the WebView blocks direct
// api.mangadex.org responses. Same-origin proxy = no CORS problem.
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const segs = context.params.path;
  const path = segs ? (Array.isArray(segs) ? segs.join('/') : segs) : '';
  const target = new URL('https://api.mangadex.org/' + path + url.search);
  try {
    const resp = await fetch(new Request(target, {
      method: 'GET',
      headers: { 'User-Agent': 'ShortzTV/1.0' },
    }));
    const out = new Response(resp.body, {
      status: resp.status,
      headers: { 'Content-Type': resp.headers.get('Content-Type') || 'application/json' },
    });
    out.headers.set('Access-Control-Allow-Origin', '*');
    out.headers.set('Cache-Control', 'public, max-age=60');
    return out;
  } catch (e) {
    return new Response(JSON.stringify({ error: 'proxy failed' }), { status: 502 });
  }
}
