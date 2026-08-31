'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Plus, CalendarDays, User, Dumbbell } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from '@/i18n';

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t.nav_home },
    { href: '/workout', icon: Dumbbell, label: t.nav_workout },
    { href: '/history', icon: CalendarDays, label: t.nav_history },
    { href: '/profile', icon: User, label: t.nav_profile },
  ];

  return (
    <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
      <div className="relative bg-white/70 dark:bg-[#1A1F1C]/70 backdrop-blur-2xl rounded-2xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-2 py-2">
        <div className="flex items-center justify-around">
          {/* Left items */}
          {navItems.slice(0, 2).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-all duration-300',
                  isActive
                    ? 'text-primary-500 bg-primary-50/80 dark:bg-primary-900/20'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={clsx('text-[10px]', isActive ? 'font-semibold' : 'font-medium')}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* FAB Central */}
          <Link
            href="/add-meal"
            className="relative -mt-8"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-400/40 flex items-center justify-center transition-all duration-200 active:scale-90 hover:shadow-xl hover:shadow-primary-400/50">
              <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 rounded-full bg-primary-400/20 animate-ping" style={{ animationDuration: '3s' }} />
          </Link>

          {/* Right item */}
          {navItems.slice(2).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-all duration-300',
                  isActive
                    ? 'text-primary-500 bg-primary-50/80 dark:bg-primary-900/20'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={clsx('text-[10px]', isActive ? 'font-semibold' : 'font-medium')}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
