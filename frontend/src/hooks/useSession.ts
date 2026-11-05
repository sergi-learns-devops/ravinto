'use client';

import { useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

/**
 * Restores the session on page load using the HttpOnly refresh cookie.
 * The access token is kept in memory only, so it is never persisted to disk.
 */
export function useSession(): boolean {
  const initialized = useAuthStore((s) => s.initialized);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    if (initialized) return;

    if (useAuthStore.getState().accessToken) {
      setInitialized(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const tokens = await authService.refresh();
        if (cancelled) return;
        setAccessToken(tokens.access_token);
        const me = await authService.getMe();
        if (cancelled) return;
        setUser(me);
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setInitialized(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialized, setAccessToken, setUser, setInitialized]);

  return initialized;
}
