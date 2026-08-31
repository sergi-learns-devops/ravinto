'use client';

import { useTranslation } from '@/i18n';
import { Locale } from '@/i18n/dictionaries';
import { clsx } from 'clsx';

const locales: { value: Locale; label: string; gradient: string; glowColor: string }[] = [
  { value: 'ca', label: 'CA', gradient: 'from-[#FFA44A] to-[#E63946]', glowColor: 'rgba(255,164,74,0.3)' },
  { value: 'es', label: 'ES', gradient: 'from-[#E63946] to-[#FFA44A]', glowColor: 'rgba(230,57,70,0.3)' },
  { value: 'en', label: 'EN', gradient: 'from-[#A78BFA] to-[#5BB88A]', glowColor: 'rgba(167,139,250,0.3)' },
];

export function LanguagePill() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm">
      {locales.map((loc) => {
        const isActive = locale === loc.value;
        return (
          <button
            key={loc.value}
            onClick={() => setLocale(loc.value)}
            className={clsx(
              'relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
              isActive ? 'scale-105' : 'opacity-50 hover:opacity-80'
            )}
            aria-label={loc.label}
          >
            {/* Glow effect when active */}
            {isActive && (
              <div
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${loc.gradient} blur-md opacity-40`}
              />
            )}
            {/* Circle with gradient */}
            <div
              className={clsx(
                'relative w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300',
                isActive
                  ? `bg-gradient-to-br ${loc.gradient}`
                  : 'bg-transparent'
              )}
              style={!isActive ? {
                background: `linear-gradient(white, white) padding-box, linear-gradient(to bottom right, ${loc.gradient.includes('FFA44A') && loc.gradient.includes('E63946') ? '#FFA44A, #E63946' : loc.gradient.includes('E63946') ? '#E63946, #FFA44A' : '#A78BFA, #5BB88A'}) border-box`,
                border: '1.5px solid transparent',
                borderRadius: '100%',
              } : undefined}
            >
              <span className={clsx(
                'font-mono text-[9px] font-bold tracking-wide',
                isActive ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'
              )}>
                {loc.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
