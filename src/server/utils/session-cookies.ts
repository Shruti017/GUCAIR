import type { Response } from 'express';

export const ACCESS_COOKIE = 'gucair_access';
export const REFRESH_COOKIE = 'gucair_refresh';

function ttlMilliseconds(value: string, fallback: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(value || fallback);
  if (!match) throw new Error('ACCESS_TOKEN_TTL must use seconds, minutes, hours, or days (for example 15m).');
  const amount = Number(match[1]);
  const multiplier = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2] as 's' | 'm' | 'h' | 'd'];
  return amount * multiplier;
}

function refreshMilliseconds(): number {
  const days = Number(process.env.REFRESH_TOKEN_DAYS || 7);
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    throw new Error('REFRESH_TOKEN_DAYS must be an integer from 1 to 90.');
  }
  return days * 86_400_000;
}

const secure = process.env.NODE_ENV === 'production';
const baseOptions = {
  httpOnly: true,
  secure,
  sameSite: 'strict' as const,
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseOptions,
    path: '/api',
    maxAge: ttlMilliseconds(process.env.ACCESS_TOKEN_TTL || '15m', '15m'),
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseOptions,
    path: '/api/auth',
    maxAge: refreshMilliseconds(),
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...baseOptions, path: '/api' });
  res.clearCookie(REFRESH_COOKIE, { ...baseOptions, path: '/api/auth' });
}
