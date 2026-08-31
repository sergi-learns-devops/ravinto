import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (includeAuth) {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        throw new Error('Session expired');
      }
      return null; // signal to retry
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Error del servidor' }));
      throw new Error(error.detail || `Error ${response.status}`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      useAuthStore.getState().setTokens(data.access_token, refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(),
    });
    const result = await this.handleResponse(response);
    if (result === null && response.status === 401) {
      // Retry after refresh
      const retryResponse = await fetch(`${this.baseUrl}${path}`, {
        headers: this.getHeaders(),
      });
      return retryResponse.json();
    }
    return result;
  }

  async post<T>(path: string, body?: unknown, auth = true): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.getHeaders(auth),
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await this.handleResponse(response);
    if (result === null && response.status === 401) {
      const retryResponse = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: this.getHeaders(auth),
        body: body ? JSON.stringify(body) : undefined,
      });
      return retryResponse.json();
    }
    return result;
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse(response);
  }

  async delete(path: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    await this.handleResponse(response);
  }
}

export const api = new ApiClient();
