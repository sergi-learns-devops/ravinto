'use client';

import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { LanguagePill } from './LanguagePill';

export function ThemeMiniToggle() {
  const { theme, setTheme } = useThemeStore();
  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <LanguagePill />
      <button
        onClick={toggleTheme}
        className="p-2.5 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
        aria-label="Cambiar tema"
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-neutral-600" />
        )}
      </button>
    </div>
  );
}
