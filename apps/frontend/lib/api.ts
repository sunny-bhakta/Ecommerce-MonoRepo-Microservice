import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from './auth';
import type { Category, OrderSummary, PaymentSummary, Product, UserProfile } from './types';

const gatewayBase = (process.env.GATEWAY_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export class GatewayError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type GatewayRequestInit = RequestInit & {
  authenticated?: boolean;
  next?: RequestInit['next'];
};

function buildUrl(path: string) {
  return `${gatewayBase}${path.startsWith('/') ? path : `/${path}`}`;
}

async function parseResponse(res: Response) {
  const text = await res.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function gatewayFetch<T>(path: string, init: GatewayRequestInit = {}): Promise<T> {
  const url = buildUrl(path);
  const headers = new Headers(init.headers);

  if (
    init.body &&
    typeof init.body === 'object' &&
    !(init.body instanceof FormData) &&
    !headers.has('content-type')
  ) {
    headers.set('content-type', 'application/json');
  }

  if (init.authenticated !== false) {
    const token = cookies().get(AUTH_COOKIE_NAME)?.value;
    if (token && !headers.has('authorization')) {
      headers.set('authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...init,
    headers,
    body:
      headers.get('content-type')?.includes('application/json') &&
      typeof init.body === 'object' &&
      !(init.body instanceof FormData)
        ? JSON.stringify(init.body)
        : (init.body as BodyInit | null | undefined)
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new GatewayError(
      typeof payload === 'string' ? payload : 'Gateway request failed',
      response.status,
      payload
    );
  }

  return payload as T;
}

export async function listProducts() {
  return gatewayFetch<Product[]>('/catalog/products', {
    next: { revalidate: 60 }
  });
}

export async function getProduct(productId: string) {
  return gatewayFetch<Product>(`/catalog/products/${productId}`, {
    next: { revalidate: 300 }
  });
}

export async function listCategories() {
  return gatewayFetch<Category[]>('/catalog/categories', {
    next: { revalidate: 300 }
  });
}

export async function getProfile() {
  return gatewayFetch<UserProfile>('/me/profile', {
    cache: 'no-store'
  });
}

export async function listOrders() {
  return gatewayFetch<OrderSummary[]>('/orders', {
    cache: 'no-store'
  });
}

export async function getOrderSummary(orderId: string) {
  return gatewayFetch<OrderSummary>(`/orders/${orderId}/summary`, {
    cache: 'no-store'
  });
}

export async function listPayments(orderId: string) {
  return gatewayFetch<PaymentSummary[]>(`/orders/${orderId}/payments`, {
    cache: 'no-store'
  });
}

