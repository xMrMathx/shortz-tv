// Cloudflare Pages Function: proxies MangaDex image hosts (*.mangadex.network,
// uploads.mangadex.org) through the app's own origin. Guarantees page images
// load even if the viewer's network can't reach those hosts directly.
export async function onRequestGet(context) {
  const u = new URL(context.request.url).searchParams.get('u') || '';
  let target;
  try { target = new URL(u); } catch (e) { return new Response('bad url', { status: 400 }); }
  const host = target.hostname.toLowerCase();
  const ok = host === 'uploads.mangadex.org' || host.endsWith('.mangadex.network');
  if (!ok) return new Response('forbidden host', { status: 403 });
  try {
    const resp = await fetch(target.toString(), {
      headers: { 'User-Agent': 'ShortzTV/1.0' },
    });
    if (!resp.ok) return new Response('upstream ' + resp.status, { status: 502 });
    const out = new Response(resp.body, {
      headers: { 'Content-Type': resp.headers.get('Content-Type') || 'image/jpeg' },
    });
    out.headers.set('Cache-Control', 'public, max-age=86400');
    return out;
  } catch (e) {
    return new Response('proxy failed', { status: 502 });
  }
}
