'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { AuroraBackground } from '@/components/ui/AuroraBackground';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
    }
  }, [accessToken, router]);

  if (!accessToken) return null;

  return (
    <div className="min-h-screen">
      <AuroraBackground />
      <Sidebar />
      <main className="lg:ml-64 pb-28 lg:pb-8 px-4 md:px-6 lg:px-8 pt-6 max-w-4xl mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
