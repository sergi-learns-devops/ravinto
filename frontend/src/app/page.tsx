'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function Home() {
  const router = useRouter();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [accessToken, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <img
        src="/logo-160.png"
        alt="Ravinto"
        className="h-16 w-auto animate-pulse drop-shadow-lg"
      />
      <span className="text-lg font-bold font-heading text-neutral-800 dark:text-white">
        Ravinto
      </span>
    </div>
  );
}
