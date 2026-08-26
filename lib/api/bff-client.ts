// Client-side API fetcher for calling Next.js BFF routes (/api/...)

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const url = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        message: json?.message || `HTTP error ${res.status}`,
        data: json?.data,
      };
    }

    return {
      success: json?.success ?? true,
      data: json?.data !== undefined ? json.data : json,
      message: json?.message,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network connection failed',
    };
  }
}
