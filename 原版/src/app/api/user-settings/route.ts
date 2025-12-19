import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';
  if (storageType === 'localstorage') {
    return NextResponse.json({ settings: null }, { status: 200 });
  }
  const auth = getAuthInfoFromCookie(request);
  if (!auth?.username) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const settings = await (db as any).storage.getUserSettings(auth.username);
    return NextResponse.json({ settings: settings || null }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ settings: null }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';
  if (storageType === 'localstorage') {
    return NextResponse.json({ ok: true });
  }
  const auth = getAuthInfoFromCookie(request);
  if (!auth?.username) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const settings = typeof body === 'object' && body ? body : {};
    await (db as any).storage.setUserSettings(auth.username, settings);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
} 