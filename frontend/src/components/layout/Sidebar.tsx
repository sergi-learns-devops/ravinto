'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, CalendarDays, User, LogOut, Dumbbell, PanelLeftClose, PanelLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t.nav_home },
    { href: '/add-meal', icon: PlusCircle, label: t.add_meal },
    { href: '/workout', icon: Dumbbell, label: t.nav_workout },
    { href: '/history', icon: CalendarDays, label: t.nav_history },
    { href: '/profile', icon: User, label: t.nav_profile },
  ];

  return (
    <aside
      className={clsx(
        'hidden lg:fixed lg:flex lg:flex-col lg:h-screen lg:top-14 bg-white/50 dark:bg-[#0F1210]/50 backdrop-blur-2xl border-r border-white/30 dark:border-white/5 transition-all duration-300 z-20',
        open ? 'lg:w-60 p-4' : 'lg:w-16 p-2'
      )}
    >
      {/* Logo */}
      <div className={clsx('flex items-center gap-3 mb-8', open ? 'px-3' : 'justify-center px-0')}>
        <img src="/logo-36.png" alt="Ravinto" className="h-7 w-auto flex-shrink-0" />
        {open && (
          <span className="font-bold text-lg text-neutral-800 dark:text-white font-heading truncate">
            Ravinto
          </span>
        )}
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
              title={!open ? item.label : undefined}
              className={clsx(
                'flex items-center rounded-xl text-sm transition-all duration-200',
                open ? 'gap-3 px-4 py-3' : 'justify-center px-0 py-3',
                isActive
                  ? 'bg-primary-400/10 text-primary-600 dark:text-primary-300 font-semibold shadow-sm shadow-primary-400/5'
                  : 'text-neutral-500 hover:bg-white/50 dark:hover:bg-white/5 hover:text-neutral-700 dark:hover:text-neutral-200'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={isActive ? 2.2 : 1.5} />
              {open && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: collapse + logout */}
      <div className="flex flex-col gap-1.5 border-t border-white/20 dark:border-white/5 pt-3">
        <button
          onClick={onToggle}
          title={open ? 'Collapse' : 'Expand'}
          className={clsx(
            'flex items-center rounded-xl text-sm text-neutral-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-neutral-600 dark:hover:text-neutral-300 transition-all duration-200',
            open ? 'gap-3 px-4 py-3' : 'justify-center px-0 py-3'
          )}
        >
          {open ? (
            <>
              <PanelLeftClose className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">Collapse</span>
            </>
          ) : (
            <PanelLeft className="w-5 h-5 flex-shrink-0" />
          )}
        </button>
        <button
          onClick={logout}
          title={!open ? t.logout : undefined}
          className={clsx(
            'flex items-center rounded-xl text-sm text-neutral-500 hover:bg-red-50/50 dark:hover:bg-red-900/10 hover:text-red-600 transition-all duration-200',
            open ? 'gap-3 px-4 py-3' : 'justify-center px-0 py-3'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {open && <span>{t.logout}</span>}
        </button>
      </div>
    </aside>
  );
}
