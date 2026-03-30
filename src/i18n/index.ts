/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-07-16 17:52:09
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-05 00:59:48
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en_common from './locales/en/common.json'
import en_messages from './locales/en/messages.json'
import en_settings from './locales/en/settings.json'
import en_virtualMedia from './locales/en/virtualMedia.json'
import zh_common from './locales/zh/common.json'
import zh_messages from './locales/zh/messages.json'
import zh_settings from './locales/zh/settings.json'
import zh_virtualMedia from './locales/zh/virtualMedia.json'

const savedLanguage = localStorage.getItem('preferred-language')

i18n.use(initReactI18next).init({
  resources: {
    zh: {
      common: zh_common,
      settings: zh_settings,
      messages: zh_messages,
      virtualMedia: zh_virtualMedia,
    },
    en: {
      common: en_common,
      settings: en_settings,
      messages: en_messages,
      virtualMedia: en_virtualMedia,
      // screen: en_screen,
      // control: en_control,
    },
  },
  supportedLngs: ['en', 'zh'],

  lng: savedLanguage || 'en',
  fallbackLng: 'en',
  // Turn off noisy console logs like `i18next::translator: missingKey`
  debug: false,

  ns: ['common', 'settings', 'messages', 'virtualMedia', 'screen', 'control'],
  defaultNS: 'common',

  interpolation: {
    escapeValue: false,
  },
})

export default i18n
