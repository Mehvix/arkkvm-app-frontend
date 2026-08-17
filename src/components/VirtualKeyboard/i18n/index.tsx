/**
 * VirtualKeyboard self-contained i18n layer.
 *
 * A tiny, dependency-free translation system so the component can be used
 * standalone or as an open-source package without pulling in i18next.
 */
import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { VirtualKeyboardLocale, VirtualKeyboardTranslations } from './types';
import { en } from './locales/en';
import { zh } from './locales/zh';

export type { VirtualKeyboardLocale, VirtualKeyboardTranslations };
export {
  languageDisplayNames,
  getLanguageDisplayName,
} from './languageNames';

const localeMap: Record<string, VirtualKeyboardTranslations> = { en, zh };

/**
 * Resolve translations for a given locale. Falls back to English when the
 * requested locale is not registered.
 */
export function getTranslations(
  locale: VirtualKeyboardLocale = 'en'
): VirtualKeyboardTranslations {
  return localeMap[locale] || localeMap.en;
}

/** Translation function returned by the i18n hook. */
export type TFunction = (
  key: keyof VirtualKeyboardTranslations,
  params?: Record<string, string>
) => string;

/**
 * Build a translator function from a translation bundle.
 * Supports simple {{key}} interpolation.
 */
export function createT(translations: VirtualKeyboardTranslations): TFunction {
  return (key, params) => {
    let text = translations[key];
    if (typeof text !== 'string') return String(key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.split(`{{${k}}}`).join(v);
      });
    }
    return text;
  };
}

const I18nContext = createContext<TFunction | null>(null);

export interface I18nProviderProps {
  /** Locale identifier, e.g. 'en' or 'zh'. */
  locale?: VirtualKeyboardLocale;
  /** Partial translations to override the bundled strings. */
  translations?: Partial<VirtualKeyboardTranslations>;
  children: ReactNode;
}

/** Provides the i18n translator to VirtualKeyboard sub-components. */
export function I18nProvider({
  locale = 'en',
  translations = {},
  children,
}: I18nProviderProps) {
  const t = useMemo(() => {
    const base = getTranslations(locale);
    return createT({ ...base, ...translations });
  }, [locale, translations]);

  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
}

/**
 * Hook to access the VirtualKeyboard translator.
 * Falls back to English if used outside of an I18nProvider.
 */
export function useI18n(): TFunction {
  const t = useContext(I18nContext);
  return t ?? createT(getTranslations('en'));
}
