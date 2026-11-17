const BASE = '/api';
let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: '{}',
        });
        if (!response.ok) throw new Error('Session expired');
        return true;
      } catch {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('gucair_user');
          window.dispatchEvent(new Event('gucair-auth-change'));
        }
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const send = () => {
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
    });
  };

  let response = await send();
  const authEndpointWithoutRefresh = ['/auth/login', '/auth/register', '/auth/register-university', '/auth/refresh', '/auth/logout'].includes(path);
  if (response.status === 401 && !authEndpointWithoutRefresh) {
    if (await refreshSession()) response = await send();
  }
  const data = await response.json().catch(() => ({ message: 'Unexpected server response' }));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data as T;
}
