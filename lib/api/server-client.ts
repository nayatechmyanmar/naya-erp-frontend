import { cookies, headers } from 'next/headers';

const BACKEND_URL = process.env.API_BACKEND_URL || 'http://localhost:3330/api/v1';

export async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get('auth_token')?.value;
    if (tokenFromCookie && tokenFromCookie !== 'undefined' && tokenFromCookie !== 'null') {
      return tokenFromCookie;
    }

    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    if (authHeader) {
      const parsed = authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7).trim()
        : authHeader.trim();
      if (parsed && parsed !== 'undefined' && parsed !== 'null') {
        return parsed;
      }
    }

    const xToken = headersList.get('x-access-token');
    if (xToken && xToken !== 'undefined' && xToken !== 'null') {
      return xToken.trim();
    }

    return null;
  } catch {
    return null;
  }
}

export async function backendFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; status: number }> {
  const token = await getAuthToken();
  const url = `${BACKEND_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store',
    });

    const data = await res.json().catch(() => null);

    return {
      success: res.ok && data?.success !== false,
      data: data?.data ?? data,
      message: data?.message || (res.ok ? 'Success' : `Request failed with status ${res.status}`),
      status: res.status,
    };
  } catch (error: any) {
    console.error(`Backend fetch error [${endpoint}]:`, error);
    return {
      success: false,
      message: error?.message || 'Failed to connect to backend server',
      status: 500,
    };
  }
}
