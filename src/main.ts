import { registerSW } from 'virtual:pwa-register'
import { ROLL_DURATION_MS, createApp } from './app'
import { createCryptoRandomSource } from './domain/dice'
import { createSoundPlayer } from './platform/sound'
import { createWakeLock } from './platform/wakeLock'
import { loadSettings, saveSettings } from './state/settings'
import './styles/tokens.css'
import './styles/app.css'

const root = document.getElementById('app')
if (root === null) {
  throw new Error('#app element is missing from index.html')
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

const app = createApp(root, {
  settings: loadSettings(),
  random: createCryptoRandomSource(),
  now: () => Date.now(),
  schedule: (task, delayMs) => {
    window.setTimeout(task, delayMs)
  },
  rollDurationMs: () => (reducedMotion.matches ? 0 : ROLL_DURATION_MS),
  // 保存に失敗しても今回の画面は動かし続ける（次回は初期値で起動する）。
  persist: (settings) => {
    saveSettings(settings)
  },
  playSound: createSoundPlayer().play,
  wakeLock: createWakeLock(navigator, document),
})

const updateServiceWorker = registerSW({
  onNeedRefresh: () => {
    app.showUpdatePrompt(() => {
      void updateServiceWorker(true)
    })
  },
})
