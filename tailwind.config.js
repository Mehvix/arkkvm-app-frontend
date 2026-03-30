/*
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-07-18 17:24:29
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-02-09 11:37:28
 */
/** @type {import('tailwindcss').Config} */
export default {
  important: true,
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
    './build/loaders/jg-prefix-loader.cjs',
  ],

  theme: {
    fontSize: {
      xs: ['10px', { lineHeight: '16px' }],
      sm: ['12px', { lineHeight: '18px' }],
      base: ['14px', { lineHeight: '22px' }],
      lg: ['14px', { lineHeight: '22px' }],
      xl: ['16px', { lineHeight: '24px' }],
      '2xl': ['18px', { lineHeight: '28px' }],
      '3xl': ['20px', { lineHeight: '32px' }],

      h1: ['16px', { lineHeight: '24px' }],
      body: ['14px', { lineHeight: '22px' }],
      sub: ['12px', { lineHeight: '18px' }],
      caption: ['10px', { lineHeight: '16px' }],
      micro: ['8px', { lineHeight: '12px' }],
    },
    extend: {
      fontFamily: {
        sans: [
          'Funnel Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica',
          'Arial',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
        ],
      },
      colors: {
        warning: '#FB923C',
      },
      borderWidth: {
        DEFAULT: '0.8px',
        0: '0px',
        2: '2px',
        4: '4px',
        8: '8px',
      },
    },
  },
  plugins: [],

  safelist: [
    { pattern: /^/ },
    { pattern: /^hover:/ },
    { pattern: /^focus:/ },
    { pattern: /^active:/ },
    { pattern: /^disabled:/ },
    { pattern: /^group-hover:/ },

    'text-h1',
    'text-body',
    'text-sub',
    'text-caption',
    'text-micro',
  ],
}
