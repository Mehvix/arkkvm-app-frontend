/*
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-01-24 19:44:39
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-01-24 19:48:29
 */
export default [
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      semi: ['error', 'never'],
      quotes: ['error', 'single'],
      'no-extra-semi': 'error',
      'no-unexpected-multiline': 'error',
      'no-sequences': 'error',
    },
  },
]
