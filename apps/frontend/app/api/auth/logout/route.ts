import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, clearAuthCookieOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE_NAME, '', clearAuthCookieOptions);
  return res;
}

