import { Buffer } from 'node:buffer';

export function productionConfigurationError(): string | null {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!process.env.MONGODB_URI?.startsWith('mongodb')) return 'MONGODB_URI must be configured.';
  if (!accessSecret || Buffer.byteLength(accessSecret, 'utf8') < 32) return 'JWT_ACCESS_SECRET must contain at least 32 bytes.';
  if (!refreshSecret || Buffer.byteLength(refreshSecret, 'utf8') < 32) return 'JWT_REFRESH_SECRET must contain at least 32 bytes.';
  if (accessSecret === refreshSecret) return 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.';

  const refreshDays = Number(process.env.REFRESH_TOKEN_DAYS || 7);
  if (!Number.isInteger(refreshDays) || refreshDays < 1 || refreshDays > 90) {
    return 'REFRESH_TOKEN_DAYS must be an integer from 1 to 90.';
  }
  if (!/^(\d+)(s|m|h|d)$/.test(process.env.ACCESS_TOKEN_TTL || '15m')) {
    return 'ACCESS_TOKEN_TTL must use seconds, minutes, hours, or days (for example 15m).';
  }
  return null;
}
