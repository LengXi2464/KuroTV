/* eslint-disable no-console */
import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * GET /api/subtitles/proxy?url=...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 });

  try {
    const resp = await fetch(url);
    const headers = new Headers(resp.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=86400');
    if (!headers.get('content-type')) {
      headers.set('Content-Type', guessContentType(url));
    }
    return new NextResponse(resp.body, { status: resp.status, headers });
  } catch (e) {
    console.error('Subtitle proxy error:', e);
    return NextResponse.json({ error: 'proxy failed' }, { status: 200 });
  }
}

function guessContentType(url: string) {
  const lower = url.toLowerCase();
  if (lower.endsWith('.vtt')) return 'text/vtt; charset=utf-8';
  if (lower.endsWith('.srt')) return 'application/x-subrip; charset=utf-8';
  return 'text/plain; charset=utf-8';
} 