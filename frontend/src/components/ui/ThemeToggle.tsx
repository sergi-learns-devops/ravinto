'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { clsx } from 'clsx';

const options = [
  { value: 'light' as const, icon: Sun, label: 'Claro' },
  { value: 'dark' as const, icon: Moon, label: 'Oscuro' },
  { value: 'system' as const, icon: Monitor, label: 'Sistema' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;
        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
              isActive
                ? 'bg-primary-400/10 text-primary-600 dark:text-primary-300 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            )}
            title={option.label}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
