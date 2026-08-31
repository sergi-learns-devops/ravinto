'use client';

import { useTranslation } from '@/i18n';
import { Locale } from '@/i18n/dictionaries';
import { clsx } from 'clsx';

const locales: { value: Locale; code: string; name: string; gradient: string; borderGradient: string }[] = [
  { value: 'ca', code: 'CA', name: 'Català', gradient: 'from-[#FFA44A] to-[#E63946]', borderGradient: '#FFA44A, #E63946' },
  { value: 'es', code: 'ES', name: 'Español', gradient: 'from-[#E63946] to-[#FFA44A]', borderGradient: '#E63946, #FFA44A' },
  { value: 'en', code: 'EN', name: 'English', gradient: 'from-[#A78BFA] to-[#5BB88A]', borderGradient: '#A78BFA, #5BB88A' },
];

export function LanguageCards() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="grid grid-cols-3 gap-2">
      {locales.map((loc) => {
        const isActive = locale === loc.value;
        return (
          <button
            key={loc.value}
            onClick={() => setLocale(loc.value)}
            className={clsx(
              'relative flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all duration-300 border',
              isActive
                ? 'bg-white/60 dark:bg-white/10 shadow-md'
                : 'bg-white/20 dark:bg-white/5 border-white/20 dark:border-white/5 hover:bg-white/40 dark:hover:bg-white/8'
            )}
            style={isActive ? {
              borderColor: 'transparent',
              background: undefined,
              boxShadow: `0 4px 20px ${loc.borderGradient.split(',')[0].trim()}20`,
            } : undefined}
          >
            {/* Active border gradient */}
            {isActive && (
              <div
                className="absolute inset-0 rounded-xl"
                style={{
                  padding: '1.5px',
                  background: `linear-gradient(135deg, ${loc.borderGradient})`,
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'xor',
                  WebkitMaskComposite: 'xor',
                }}
              />
            )}

            {/* Monogram circle */}
            <div className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
              isActive ? `bg-gradient-to-br ${loc.gradient} shadow-lg` : ''
            )}
              style={!isActive ? {
                background: `linear-gradient(${loc.borderGradient.split(',')[0].trim()}15, ${loc.borderGradient.split(',')[1].trim()}15)`,
                border: `1.5px solid ${loc.borderGradient.split(',')[0].trim()}40`,
              } : undefined}
            >
              <span className={clsx(
                'font-mono text-xs font-bold tracking-wide',
                isActive ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'
              )}>
                {loc.code}
              </span>
            </div>

            {/* Name */}
            <span className={clsx(
              'text-xs font-medium transition-colors',
              isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'
            )}>
              {loc.name}
            </span>

            {/* Active indicator dot */}
            {isActive && (
              <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-br ${loc.gradient}`} />
            )}
          </button>
        );
      })}
    </div>
  );
}
