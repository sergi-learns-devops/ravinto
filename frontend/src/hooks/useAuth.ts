'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { authService, LoginData, RegisterData } from '@/services/auth.service';

export function useAuth() {
  const router = useRouter();
  const { setAccessToken, setUser, logout: storeLogout, user, accessToken } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (data: LoginData, redirectTo = '/dashboard') => {
    setLoading(true);
    setError(null);
    try {
      const tokens = await authService.login(data);
      setAccessToken(tokens.access_token);
      const me = await authService.getMe();
      setUser(me);
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    setError(null);
    try {
      await authService.register(data);
      // Auto-login after register, redirect to onboarding
      const tokens = await authService.login({ email: data.email, password: data.password });
      setAccessToken(tokens.access_token);
      const me = await authService.getMe();
      setUser(me);
      router.push('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // The local session is cleared even if the server call fails.
    }
    storeLogout();
    router.push('/login');
  };

  return {
    user,
    isAuthenticated: !!accessToken,
    loading,
    error,
    login,
    register,
    logout,
    clearError: () => setError(null),
  };
}
