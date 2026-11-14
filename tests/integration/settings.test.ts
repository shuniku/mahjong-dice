import { describe, expect, test } from 'vitest'
import {
  DEFAULT_SETTINGS,
  STORAGE_KEY,
  getLocalStorage,
  loadSettings,
  saveSettings,
} from '../../src/state/settings'
import { createMemoryStorage, createThrowingStorage } from '../helpers/memoryStorage'

describe('settings persistence', () => {
  test('defaults are 4 players, sound off, wareme on', () => {
    expect(DEFAULT_SETTINGS).toEqual({ players: 4, soundOn: false, waremeVisible: true })
  })

  test('I-4: saved values come back after reload', () => {
    // Arrange
    const storage = createMemoryStorage()
    const settings = { players: 3, soundOn: true, waremeVisible: false } as const
    // Act
    const saved = saveSettings(settings, storage)
    const loaded = loadSettings(storage)
    // Assert
    expect(saved).toBe(true)
    expect(loaded).toEqual(settings)
  })

  test('I-5: a throwing storage falls back to defaults without crashing', () => {
    const storage = createThrowingStorage()
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS)
    expect(saveSettings(DEFAULT_SETTINGS, storage)).toBe(false)
  })

  test('works with no storage at all', () => {
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(saveSettings(DEFAULT_SETTINGS, null)).toBe(false)
  })

  test.each([
    ['invalid JSON', '{not json'],
    ['null', 'null'],
    ['an array', '[]'],
    ['players out of range', JSON.stringify({ players: 5, soundOn: true, waremeVisible: false })],
    ['players as a string', JSON.stringify({ players: '3', soundOn: true, waremeVisible: false })],
  ])('I-6: %s resets to defaults', (_name, raw) => {
    const storage = createMemoryStorage({ [STORAGE_KEY]: raw })
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS)
  })

  test('I-6: wrong-typed booleans fall back per field', () => {
    const raw = JSON.stringify({ players: 3, soundOn: 'yes', waremeVisible: 0 })
    const storage = createMemoryStorage({ [STORAGE_KEY]: raw })
    expect(loadSettings(storage)).toEqual({ players: 3, soundOn: false, waremeVisible: true })
  })

  test('getLocalStorage returns the storage, or null when access throws', () => {
    expect(getLocalStorage()).not.toBeNull()
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage')
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('denied')
      },
    })
    try {
      expect(getLocalStorage()).toBeNull()
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original)
    }
  })
})
