/*
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-07-18 17:24:29
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-06-02 14:57:15
 */
/** @type {import('tailwindcss').Config} */
export default {
  important: true,
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
    './build/loaders/jg-prefix-loader.cjs',
  ],
  // prefix: "",
  // theme: {}, // 已迁移到 global.css @theme inline
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
