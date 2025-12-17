import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, authCookieOptions } from '@/lib/auth';

const gatewayBase = (process.env.GATEWAY_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const authUrl = (process.env.GATEWAY_URL ?? 'http://localhost:3010').replace(/\/$/, '')
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const response = await fetch(`${authUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return NextResponse.json(payload ?? { message: 'Login failed' }, { status: response.status });
  }

  const token =
    payload?.access_token ?? payload?.token ?? payload?.accessToken ?? payload?.jwt ?? null;
  const user = payload?.user ?? payload?.data ?? null;

  const res = NextResponse.json({ user, token }, { status: 200 });

  if (token) {
    res.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions);
  }

  return res;
}

