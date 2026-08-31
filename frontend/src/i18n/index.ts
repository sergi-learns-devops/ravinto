import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dictionaries, Locale, Dictionary } from './dictionaries';

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: 'ca',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'ravinto-locale' }
  )
);

export function useTranslation() {
  const { locale, setLocale } = useI18nStore();
  const t = dictionaries[locale] as Dictionary;

  return { t, locale, setLocale };
}
