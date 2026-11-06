const API_URL = (() => {
  const value = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
  return value.replace(/\/+$/, '');
})();

export function getApiBaseUrl() {
  return API_URL;
}

export async function apiRequest(path, { method = 'GET', body, token, headers = {}, timeoutMs = 15000 } = {}) {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': body instanceof FormData ? undefined : 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body == null ? undefined : typeof body === 'string' || body instanceof FormData ? body : JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch (error) {
      payload = text;
    }

    return {
      ok: response.ok,
      status: response.status,
      payload,
      headers: response.headers,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getStoredAuthToken() {
  try {
    const raw = globalThis?.localStorage?.getItem?.('cosmozpay_token');
    return raw || null;
  } catch (error) {
    return null;
  }
}

export function setStoredAuthToken(token) {
  try {
    if (typeof globalThis?.localStorage?.setItem === 'function') {
      globalThis.localStorage.setItem('cosmozpay_token', token);
    }
  } catch (error) {
    // ignore storage issues in the non-browser runtime
  }
}

export function removeStoredAuthToken() {
  try {
    if (typeof globalThis?.localStorage?.removeItem === 'function') {
      globalThis.localStorage.removeItem('cosmozpay_token');
    }
  } catch (error) {
    // ignore storage issues in the non-browser runtime
  }
}
