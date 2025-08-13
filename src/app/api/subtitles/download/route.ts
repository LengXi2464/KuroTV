/* eslint-disable no-console */
import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * GET /api/subtitles/download?file_id=123
 * Returns: { url: string } or proxies content with correct headers when possible
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('file_id');

  if (!fileId) {
    return NextResponse.json({ error: 'missing file_id' }, { status: 400 });
  }

  const apiKey = process.env.OPEN_SUBTITLES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'subtitles disabled' }, { status: 200 });
  }

  try {
    const resp = await fetch(`https://api.opensubtitles.com/api/v1/download?file_id=${encodeURIComponent(fileId)}` as string, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!resp.ok) {
      console.error('OpenSubtitles download create failed:', resp.status, await safeText(resp));
      return NextResponse.json({ error: 'download failed' }, { status: 200 });
    }

    const data = (await resp.json()) as any;
    const url = data?.link || data?.url;
    if (!url) {
      return NextResponse.json({ error: 'no link' }, { status: 200 });
    }

    // Proxy fetch to add CORS/cache headers
    const fileResp = await fetch(url);
    const headers = new Headers(fileResp.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=86400');

    return new NextResponse(fileResp.body, {
      status: fileResp.status,
      headers,
    });
  } catch (error) {
    console.error('Subtitles fetch error:', error);
    return NextResponse.json({ error: 'error' }, { status: 200 });
  }
}

async function safeText(resp: Response) {
  try {
    return await resp.text();
  } catch {
    return '';
  }
} 