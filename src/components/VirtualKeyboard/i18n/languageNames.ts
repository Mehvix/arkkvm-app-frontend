/*
 * @Author: zhanglei
 * @Date: 2026-07-16 16:46:47
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-07-16 17:20:35
 */
/**
 * Localized display names for keyboard layout languages.
 *
 * This mapping is separate from the layout metadata so that language names
 * can be translated into any UI locale without touching the layout data.
 */
import { languageLayoutMetaMap } from '../data/language-layouts';

/**
 * locale -> language layout id -> localized display name.
 *
 * Add new locales here to support more UI languages for the language
 * selector dropdown.
 */
export const languageDisplayNames: Record<string, Record<string, string>> = {
  zh: {
    'en-US-qwerty': '美式英语',
    'en-GB-qwerty': '英式英语',
    'cs-CZ-qwerty': '捷克语',
    'de-CH-qwertz': '瑞士德语',
    'de-DE-qwertz': '德语',
    'nl-BE-azerty': '比利时荷兰语',
    'fr-FR-azerty': '法语',
    'es-ES-qwerty': '西班牙语',
    'pt-PT-qwerty': '葡萄牙语',
  },
};

/**
 * Get the best display name for a keyboard layout in the requested UI locale.
 *
 * Resolution order:
 * 1. Exact match in `languageDisplayNames[locale]`.
 * 2. The layout's `nativeName` when the requested locale matches the layout's
 *    primary language (e.g. 'fr' for 'fr-FR-azerty').
 * 3. The layout's `name` field (English) as a fallback.
 */
export function getLanguageDisplayName(
  layoutId: string,
  locale: string
): string {
  const meta = languageLayoutMetaMap[layoutId];
  if (!meta) return layoutId;

  const localeNames = languageDisplayNames[locale];
  if (localeNames?.[layoutId]) return localeNames[layoutId];

  const primaryLang = layoutId.split('-')[0]?.toLowerCase();
  if (locale.toLowerCase() === primaryLang) return meta.nativeName;

  return meta.name;
}
