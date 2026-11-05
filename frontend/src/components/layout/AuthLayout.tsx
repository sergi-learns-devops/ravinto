'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useSession } from '@/hooks/useSession';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { TopBar } from '@/components/layout/TopBar';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { clsx } from 'clsx';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const sessionReady = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Persist sidebar state
  useEffect(() => {
    const saved = localStorage.getItem('ravinto-sidebar');
    if (saved !== null) setSidebarOpen(saved === 'true');
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('ravinto-sidebar', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (sessionReady && !accessToken) {
      router.replace('/login');
    }
  }, [sessionReady, accessToken, router]);

  if (!sessionReady || !accessToken) return null;

  return (
    <div className="min-h-screen">
      <AuroraBackground />
      <TopBar />
      <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />
      <main
        className={clsx(
          'pt-20 pb-28 lg:pb-8 px-4 md:px-6 lg:px-8 max-w-4xl mx-auto transition-all duration-300',
          sidebarOpen ? 'lg:ml-60' : 'lg:ml-16'
        )}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
