'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, CalendarDays, User, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n';

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t.nav_home },
    { href: '/add-meal', icon: PlusCircle, label: t.add_meal },
    { href: '/history', icon: CalendarDays, label: t.nav_history },
    { href: '/profile', icon: User, label: t.nav_profile },
  ];

  return (
    <aside className="hidden lg:fixed lg:flex lg:flex-col lg:w-64 lg:h-screen bg-white/50 dark:bg-[#0F1210]/50 backdrop-blur-2xl border-r border-white/30 dark:border-white/5 p-5">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 mb-10">
        <img src="/logo-36.png" alt="Ravinto" className="h-7 w-auto" />
        <span className="font-bold text-xl text-neutral-800 dark:text-white font-heading">
          Ravinto
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1.5 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200',
                isActive
                  ? 'bg-primary-400/10 text-primary-600 dark:text-primary-300 font-semibold shadow-sm shadow-primary-400/5'
                  : 'text-neutral-500 hover:bg-white/50 dark:hover:bg-white/5 hover:text-neutral-700 dark:hover:text-neutral-200'
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-neutral-500 hover:bg-red-50/50 dark:hover:bg-red-900/10 hover:text-red-600 transition-all duration-200"
      >
        <LogOut className="w-5 h-5" />
        {t.logout}
      </button>
    </aside>
  );
}
