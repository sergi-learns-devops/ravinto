import { api } from './api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  age?: number | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  goal?: string | null;
  activity_level?: string | null;
  daily_goal_kcal: number;
  protein_goal_g?: number | null;
  carbs_goal_g?: number | null;
  fat_goal_g?: number | null;
  created_at: string;
}

export const authService = {
  async login(data: LoginData): Promise<TokenResponse> {
    return api.post<TokenResponse>('/api/auth/login', data, false);
  },

  async register(data: RegisterData): Promise<UserResponse> {
    return api.post<UserResponse>('/api/auth/register', data, false);
  },

  /** Exchange the HttpOnly refresh cookie for a new access token. */
  async refresh(): Promise<TokenResponse> {
    return api.post<TokenResponse>('/api/auth/refresh', undefined, false);
  },

  /** Revoke the refresh token server-side and clear the cookie. */
  async logout(): Promise<void> {
    return api.post<void>('/api/auth/logout', undefined, false);
  },

  async getMe(): Promise<UserResponse> {
    return api.get<UserResponse>('/api/auth/me');
  },

  async updateProfile(data: Record<string, unknown>): Promise<UserResponse> {
    return api.patch<UserResponse>('/api/auth/me', data);
  },
};
