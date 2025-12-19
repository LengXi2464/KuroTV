/* eslint-disable no-console */
import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * GET /api/subtitles/search
 * query: title (string), year (string|number), season (number), episode (number), languages (csv, optional)
 * Returns: { items: Array<{ file_id: number; language: string; release: string; filename: string; hearing_impaired?: boolean; fps?: number; votes?: number; score?: number; }>, disabled?: boolean }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title')?.trim();
  const year = searchParams.get('year')?.trim();
  const season = searchParams.get('season');
  const episode = searchParams.get('episode');
  const languages = searchParams.get('languages') || 'zh,en,zh-CN,zh-TW';

  if (!title) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  const apiKey = process.env.OPEN_SUBTITLES_API_KEY;
  if (!apiKey) {
    // Not configured; feature disabled but shouldn’t fail the app
    return NextResponse.json({ items: [], disabled: true }, { status: 200 });
  }

  const qs = new URLSearchParams();
  qs.set('query', title);
  if (year) qs.set('year', year);
  if (season) qs.set('season_number', season);
  if (episode) qs.set('episode_number', episode);
  if (languages) qs.set('languages', languages);
  qs.set('order_by', 'downloads');
  qs.set('order_direction', 'desc');
  qs.set('ai_translated', 'include');

  try {
    const resp = await fetch(`https://api.opensubtitles.com/api/v1/subtitles?${qs.toString()}` as string, {
      headers: {
        'Api-Key': apiKey,
        Accept: 'application/json',
      },
      // Edge fetch defaults are fine
    });

    if (!resp.ok) {
      console.error('OpenSubtitles search failed:', resp.status, await safeText(resp));
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const data = (await resp.json()) as any;
    const items = Array.isArray(data?.data)
      ? data.data.map((it: any) => ({
          file_id: it?.attributes?.files?.[0]?.file_id ?? it?.attributes?.file_id ?? it?.id,
          language: it?.attributes?.language || it?.attributes?.language || 'unknown',
          release: it?.attributes?.release || '',
          filename: it?.attributes?.files?.[0]?.file_name || it?.attributes?.feature_details?.feature || it?.attributes?.title || '',
          hearing_impaired: it?.attributes?.hearing_impaired || false,
          fps: it?.attributes?.fps || undefined,
          votes: it?.attributes?.votes || 0,
          score: it?.attributes?.score || 0,
        }))
      : [];

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Subtitles search error:', error);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

async function safeText(resp: Response) {
  try {
    return await resp.text();
  } catch {
    return '';
  }
} 