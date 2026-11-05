import { create } from 'zustand';

export interface User {
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
}

interface AuthState {
  /** Short-lived access token. Kept in memory only (never in localStorage). */
  accessToken: string | null;
  user: User | null;
  /** True once the initial silent refresh (HttpOnly cookie) has completed. */
  initialized: boolean;
  setAccessToken: (access: string | null) => void;
  setUser: (user: User | null) => void;
  setInitialized: (initialized: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  initialized: false,
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  setInitialized: (initialized) => set({ initialized }),
  logout: () => set({ accessToken: null, user: null, initialized: true }),
}));
