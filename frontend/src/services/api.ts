import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type RequestOptions = {
  method: string;
  body?: unknown;
  auth: boolean;
  retry?: boolean;
};

// Single-flight refresh: concurrent 401s share one refresh request.
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) return false;
        const data = await response.json();
        useAuthStore.getState().setAccessToken(data.access_token);
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  private async request<T>(path: string, options: RequestOptions): Promise<T> {
    const headers: Record<string, string> = {};
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (options.auth) {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method,
      headers,
      credentials: 'include',
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 401 && options.auth && options.retry !== false) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        throw new Error('Session expired');
      }
      return this.request<T>(path, { ...options, retry: false });
    }

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      let detail: unknown = error?.detail;
      if (Array.isArray(detail)) {
        detail = detail[0]?.msg;
      }
      const message = typeof detail === 'string' ? detail : `Error ${response.status}`;
      throw new Error(message);
    }

    if (response.status === 204) {
      return null as T;
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET', auth: true });
  }

  async post<T>(path: string, body?: unknown, auth = true): Promise<T> {
    return this.request<T>(path, { method: 'POST', body, auth });
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body, auth: true });
  }

  async delete(path: string): Promise<void> {
    return this.request<void>(path, { method: 'DELETE', auth: true });
  }
}

export const api = new ApiClient();
