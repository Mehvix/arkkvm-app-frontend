/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-03-26 22:31:45
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en_common from './locales/en/common.json';
import en_messages from './locales/en/messages.json';
import en_settings from './locales/en/settings.json';
import en_virtualMedia from './locales/en/virtualMedia.json';
import en_errors from './locales/en/errors.json';
import en_toast from './locales/en/toast.json';
import zh_common from './locales/zh/common.json';
import zh_errors from './locales/zh/errors.json';
import zh_messages from './locales/zh/messages.json';
import zh_settings from './locales/zh/settings.json';
import zh_virtualMedia from './locales/zh/virtualMedia.json';
import zh_toast from './locales/zh/toast.json';

// Read preferred language from localStorage. Default language is English.
const preferredLanguage = localStorage.getItem('preferred-language');

i18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: {
        common: zh_common,
        settings: zh_settings,
        messages: zh_messages,
        virtualMedia: zh_virtualMedia,
        errors: zh_errors,
        toast: zh_toast,
      },
      en: {
        common: en_common,
        settings: en_settings,
        messages: en_messages,
        virtualMedia: en_virtualMedia,
        errors: en_errors,
        toast: en_toast,
        // screen: en_screen,
        // control: en_control,
      },
    },
    supportedLngs: ['en', 'zh'],
    // Use English by default; apply user preference only when explicitly saved.
    lng: preferredLanguage || 'en',
    fallbackLng: 'en',
    // Turn off noisy console logs like `i18next::translator: missingKey`
    debug: false,

    ns: ['common', 'settings', 'messages', 'virtualMedia', 'errors', 'toast', 'screen', 'control'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false, // React already escapes values by default.
    },
  });

export default i18n;
