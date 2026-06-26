/*
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-01-24 19:44:39
 * @LastEditors: Lei Zhang daisy_zlei@163.com
 * @LastEditTime: 2026-06-23 11:33:42
 */
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: [
      'dist',
      'build',
      'node_modules',
      'coverage',
      // Auto-generated files — do not lint
      'src/assets/icons/index.ts',
      'src/router/routeConfig.ts',
      'src/components/index.ts',
      'src/components/VirtualKeyboard/test-integration.js',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,

      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      'no-extra-semi': 'error',
      'no-unexpected-multiline': 'error',
      'no-sequences': 'error',

      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
];
