import { cookies } from 'next/headers';

export const AUTH_COOKIE_NAME = 'auth_token';

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7 // 7 days
};

export const clearAuthCookieOptions = {
  ...authCookieOptions,
  maxAge: 0
};

export function getAuthToken(): string | undefined {
  return cookies().get(AUTH_COOKIE_NAME)?.value;
}

