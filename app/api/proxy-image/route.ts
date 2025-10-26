import { NextResponse } from 'next/server';

// Lightweight, restricted image proxy for img.zbt.com
// - Only allows fetching from https://img.zbt.com
// - Forwards the upstream image body and sets Access-Control-Allow-Origin: *
// - Adds cache headers to reduce upstream load

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const u = searchParams.get('u');
    if (!u) {
      return new Response('Missing `u` query parameter', { status: 400 });
    }

    let url: URL;
    try {
      url = new URL(u);
    } catch (err) {
      return new Response('Invalid URL', { status: 400 });
    }

    // Restrict to img.zbt.com only to avoid creating an open proxy
    if (url.hostname !== 'img.zbt.com') {
      return new Response('Forbidden host', { status: 403 });
    }

    // Fetch upstream image
    const upstream = await fetch(url.toString(), {
      // A simple UA may help some hosts; adjust if necessary
      headers: { 'User-Agent': 'CSGO-Dog Image Proxy (+https://github.com/50829/CSGO-Dog)' },
      // no-cors would be wrong here — we want the actual response
      method: 'GET',
    });

    if (!upstream.ok) {
      return new Response(`Upstream returned ${upstream.status}`, { status: upstream.status });
    }

    // Use upstream content-type when present
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    // Cache for 1 day in CDN / edge, allow revalidation
    headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');
    // Allow browsers to load the image cross-origin
    headers.set('Access-Control-Allow-Origin', '*');

    // Stream the upstream response body back to the client
    return new Response(upstream.body, { status: 200, headers });
  } catch (err) {
    // Don't leak error internals to clients
    return new Response('Internal server error', { status: 500 });
  }
}
