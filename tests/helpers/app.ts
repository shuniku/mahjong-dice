import { createApp, type AppDeps, type AppHandle } from '../../src/app'
import { DEFAULT_SETTINGS, type Settings } from '../../src/state/settings'
import { sequenceSource } from './random'
import { createFakeScheduler, type FakeScheduler } from './scheduler'

export interface TestApp {
  readonly root: HTMLElement
  readonly app: AppHandle
  readonly scheduler: FakeScheduler
  readonly saved: Settings[]
  readonly playSound: ReturnType<typeof vi.fn>
  readonly acquireWakeLock: ReturnType<typeof vi.fn>
}

import { vi } from 'vitest'

export function mountTestApp(
  values: number[],
  options: Partial<Pick<AppDeps, 'settings' | 'rollDurationMs'>> = {},
): TestApp {
  document.body.innerHTML = '<div id="app"></div>'
  const root = document.getElementById('app') as HTMLElement
  const scheduler = createFakeScheduler()
  const saved: Settings[] = []
  const playSound = vi.fn(() => true)
  const acquireWakeLock = vi.fn(() => Promise.resolve(true))
  const app = createApp(root, {
    settings: options.settings ?? DEFAULT_SETTINGS,
    random: sequenceSource(values),
    now: () => new Date(2026, 10, 14, 9, 5, 7).getTime(),
    schedule: scheduler.schedule,
    rollDurationMs: options.rollDurationMs ?? (() => 700),
    persist: (s) => saved.push(s),
    playSound,
    wakeLock: { acquire: acquireWakeLock, release: vi.fn(), watchVisibility: () => vi.fn() },
  })
  return { root, app, scheduler, saved, playSound, acquireWakeLock }
}

export function q<T extends Element = HTMLElement>(root: ParentNode, testId: string): T {
  const el = root.querySelector<T>(`[data-testid="${testId}"]`)
  if (el === null) throw new Error(`missing element: ${testId}`)
  return el
}

export function all(root: ParentNode, testId: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`))
}

export function click(root: ParentNode, testId: string): void {
  q(root, testId).click()
}
