import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-console': 'error',
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      'prefer-const': 'error',
      eqeqeq: 'error',
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: { 'max-lines-per-function': 'off', 'max-lines': 'off' },
  },
  {
    files: ['scripts/**/*.mjs', 'vite.config.ts', 'playwright.config.ts'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly', Buffer: 'readonly', fetch: 'readonly' } },
    rules: { 'no-console': 'off', 'max-lines-per-function': 'off' },
  },
)
