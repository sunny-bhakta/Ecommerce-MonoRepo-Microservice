import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

const gatewayBase = (process.env.GATEWAY_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handleProxy(req: NextRequest, context: { params: { path?: string[] } }) {
  const path = context.params.path?.join('/') ?? '';
  const target = `${gatewayBase}/${path}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.set('host', new URL(gatewayBase).host);
  headers.delete('content-length');
  headers.delete('accept-encoding');

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: req.body,
      redirect: 'manual',
      // @ts-expect-error - node18 streaming option
      duplex: 'half'
    });

    const responseHeaders = new Headers(upstream.headers);
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    return NextResponse.json({ message }, { status: 502 });
  }
}

export { handleProxy as GET, handleProxy as POST, handleProxy as PUT, handleProxy as PATCH, handleProxy as DELETE };

