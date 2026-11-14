import type { WakeLockController } from './platform/wakeLock'
import { createStore, type AppState, type Mode, type Store, type StoreDeps } from './state/store'
import { renderNav, renderUpdateBanner, slideClass } from './ui/chrome'
import { renderDealerScreen } from './ui/dealerScreen'
import { h } from './ui/dom'
import { renderMainScreen } from './ui/mainScreen'
import { renderSettingsScreen } from './ui/settingsScreen'

export const ROLL_DURATION_MS = 700

export interface AppDeps extends StoreDeps {
  readonly playSound: () => boolean
  readonly wakeLock: WakeLockController
}

export interface AppHandle {
  readonly store: Store
  readonly showUpdatePrompt: (onAccept: () => void) => void
}

type ScreenRenderer = (state: AppState, store: Store) => HTMLElement

const SCREENS: Readonly<Record<Mode, ScreenRenderer>> = {
  main: renderMainScreen,
  dealer: renderDealerScreen,
  settings: renderSettingsScreen,
}

function focusedKey(root: HTMLElement): string | null {
  const active = document.activeElement
  if (active === null || !root.contains(active)) return null
  return active.getAttribute('data-testid')
}

function restoreFocus(root: HTMLElement, key: string | null): void {
  if (key === null) return
  root.querySelector<HTMLElement>(`[data-testid="${key}"]`)?.focus()
}

export function createApp(root: HTMLElement, deps: AppDeps): AppHandle {
  const store = createStore(deps)
  let previousMode: Mode = store.getState().mode
  let wasRolling = false
  let updateAccept: (() => void) | null = null

  const dismissUpdate = (): void => {
    updateAccept = null
    render()
  }

  function render(): void {
    const state = store.getState()
    const key = focusedKey(root)
    const screen = h(
      'main',
      {
        class: `screen ${slideClass(previousMode, state.mode)}`.trim(),
        'data-testid': 'screen',
      },
      SCREENS[state.mode](state, store),
    )
    const banner = updateAccept !== null && renderUpdateBanner(updateAccept, dismissUpdate)
    root.replaceChildren(
      ...[
        banner,
        h('header', { class: 'title' }, '麻雀サイコロ'),
        screen,
        renderNav(state.mode, store),
      ].filter((node): node is HTMLElement => node !== false),
    )
    previousMode = state.mode
    restoreFocus(root, key)
  }

  store.subscribe(() => {
    const { isRolling, settings } = store.getState()
    if (isRolling && !wasRolling && settings.soundOn) deps.playSound()
    wasRolling = isRolling
    render()
  })

  void deps.wakeLock.acquire()
  deps.wakeLock.watchVisibility()
  render()

  return {
    store,
    showUpdatePrompt: (onAccept) => {
      updateAccept = onAccept
      render()
    },
  }
}
