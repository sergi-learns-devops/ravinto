'use client';

import { useTranslation } from '@/i18n';
import { clsx } from 'clsx';

const locales = [
  { value: 'es' as const, label: '🇪🇸 ES' },
  { value: 'en' as const, label: '🇬🇧 EN' },
  { value: 'ca' as const, label: '🏴 CA' },
];

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10">
      {locales.map((loc) => (
        <button
          key={loc.value}
          onClick={() => setLocale(loc.value)}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
            locale === loc.value
              ? 'bg-primary-400/10 text-primary-600 dark:text-primary-300 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          )}
        >
          {loc.label}
        </button>
      ))}
    </div>
  );
}
