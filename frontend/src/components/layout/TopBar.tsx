'use client';

import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { LanguagePill } from '@/components/ui/LanguagePill';

export function TopBar() {
  const { theme, setTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <header className="fixed top-0 right-0 left-0 z-30 h-14 flex items-center justify-between px-4 lg:px-6 bg-white/60 dark:bg-[#0F1210]/60 backdrop-blur-2xl border-b border-white/30 dark:border-white/5">
      {/* Left: logo on mobile */}
      <div className="flex items-center gap-2 lg:hidden">
        <img src="/logo-36.png" alt="Ravinto" className="h-6 w-auto" />
        <span className="font-bold text-base text-neutral-800 dark:text-white font-heading">Ravinto</span>
      </div>
      {/* Empty spacer on desktop */}
      <div className="hidden lg:block" />

      {/* Right: language + theme */}
      <div className="flex items-center gap-2">
        <LanguagePill />
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="p-2.5 rounded-xl bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-neutral-600" />
          )}
        </button>
      </div>
    </header>
  );
}
