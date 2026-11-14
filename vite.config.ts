import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const THEME_COLOR = '#2f5d3f'
const BACKGROUND_COLOR = '#f3ecd9'

/** 本番ビルドだけ、同じオリジン以外への通信・読み込みを禁じる CSP を入れる。 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

const cspPlugin: Plugin = {
  name: 'mahjong-dice-csp',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
      injectTo: 'head-prepend',
    },
  ],
}

export default defineConfig({
  base: './',
  plugins: [
    cspPlugin,
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: '麻雀サイコロ',
        short_name: '麻雀サイコロ',
        description: '麻雀用のサイコロ。配牌開始位置と割れ目を表示します。',
        lang: 'ja',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: THEME_COLOR,
        background_color: BACKGROUND_COLOR,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,webmanifest,ico}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/vite-env.d.ts'],
      reporter: ['text', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        'src/domain/**': { lines: 100, functions: 100, branches: 100, statements: 100 },
      },
    },
  },
})
