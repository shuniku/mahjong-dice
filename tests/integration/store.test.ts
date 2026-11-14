import { describe, expect, test } from 'vitest'
import { createStore } from '../../src/state/store'
import { DEFAULT_SETTINGS, type Settings } from '../../src/state/settings'
import { sequenceSource } from '../helpers/random'
import { createFakeScheduler } from '../helpers/scheduler'

function setup(values: number[], settings: Settings = DEFAULT_SETTINGS) {
  const scheduler = createFakeScheduler()
  const random = sequenceSource(values)
  const saved: Settings[] = []
  const store = createStore({
    settings,
    random,
    now: () => 5000,
    schedule: scheduler.schedule,
    rollDurationMs: () => 700,
    persist: (s) => saved.push(s),
  })
  return { store, scheduler, random, saved }
}

describe('store: rolling', () => {
  test('I-1: a roll fills result, seat and history together', () => {
    // Arrange: dice 3 and 4 -> total 7 -> toimen (4 players)
    const { store, scheduler } = setup([2, 3])
    // Act
    store.roll()
    scheduler.flush()
    // Assert
    const state = store.getState()
    expect(state.isRolling).toBe(false)
    expect(state.mainResult?.roll.total).toBe(7)
    expect(state.mainResult?.seat).toBe('toimen')
    expect(state.history).toEqual([{ dice: [3, 4], total: 7, seat: 'toimen', rolledAt: 5000 }])
  })

  test('the result is hidden while rolling', () => {
    const { store } = setup([2, 3])
    store.roll()
    expect(store.getState().isRolling).toBe(true)
    expect(store.getState().mainResult).toBeNull()
  })

  test('I-2: updating state never mutates the previous state', () => {
    // Arrange
    const { store, scheduler } = setup([2, 3, 0, 0])
    const before = store.getState()
    const snapshot = structuredClone(before)
    // Act
    store.roll()
    scheduler.flush()
    store.setPlayers(3)
    // Assert
    expect(before).toEqual(snapshot)
    expect(store.getState()).not.toBe(before)
  })

  test('I-3: switching to 3 players uses the 3-player table', () => {
    // Arrange: dice 3 and 3 -> total 6 -> kamicha for 3 players (shimocha for 4)
    const { store, scheduler } = setup([2, 2])
    // Act
    store.setPlayers(3)
    store.roll()
    scheduler.flush()
    // Assert
    expect(store.getState().mainResult?.seat).toBe('kamicha')
  })

  test('I-7: pressing again while rolling is ignored', () => {
    // Arrange
    const { store, scheduler, random } = setup([0, 1, 2, 3])
    // Act
    store.roll()
    store.roll()
    scheduler.flush()
    // Assert
    expect(random.calls()).toBe(2)
    expect(store.getState().history).toHaveLength(1)
    expect(scheduler.pendingCount()).toBe(0)
  })

  test('a dealer roll sets dealerResult only and skips history', () => {
    // Arrange: total 6 with 4 players -> shimocha
    const { store, scheduler } = setup([2, 2])
    // Act
    store.setMode('dealer')
    store.roll()
    scheduler.flush()
    // Assert
    const state = store.getState()
    expect(state.dealerResult?.seat).toBe('shimocha')
    expect(state.mainResult).toBeNull()
    expect(state.history).toHaveLength(0)
  })

  test('a dealer re-roll replaces the previous result', () => {
    const { store, scheduler } = setup([0, 0, 2, 2])
    store.setMode('dealer')
    store.roll()
    scheduler.flush()
    store.roll()
    scheduler.flush()
    expect(store.getState().dealerResult?.roll.total).toBe(6)
  })
})

describe('store: settings and mode', () => {
  test('setPlayers persists, clears stale results, and is ignored mid-roll', () => {
    // Arrange
    const { store, scheduler, saved } = setup([0, 0])
    store.roll()
    // Act: ignored while rolling
    store.setPlayers(3)
    expect(store.getState().settings.players).toBe(4)
    scheduler.flush()
    store.setPlayers(3)
    // Assert
    expect(store.getState().settings.players).toBe(3)
    expect(store.getState().mainResult).toBeNull()
    expect(saved).toEqual([{ players: 3, soundOn: false, waremeVisible: true }])
  })

  test('setPlayers with the same value does nothing', () => {
    const { store, saved } = setup([])
    const before = store.getState()
    store.setPlayers(4)
    expect(store.getState()).toBe(before)
    expect(saved).toHaveLength(0)
  })

  test('updateSettings merges and persists', () => {
    const { store, saved } = setup([])
    store.updateSettings({ soundOn: true })
    store.updateSettings({ waremeVisible: false })
    expect(store.getState().settings).toEqual({
      players: 4,
      soundOn: true,
      waremeVisible: false,
    })
    expect(saved).toHaveLength(2)
  })

  test('setMode changes screens and ignores no-op changes', () => {
    const { store } = setup([])
    const listener = { calls: 0 }
    store.subscribe(() => {
      listener.calls += 1
    })
    store.setMode('settings')
    store.setMode('settings')
    expect(store.getState().mode).toBe('settings')
    expect(listener.calls).toBe(1)
  })

  test('subscribe returns an unsubscribe function', () => {
    const { store } = setup([])
    let calls = 0
    const unsubscribe = store.subscribe(() => {
      calls += 1
    })
    unsubscribe()
    store.setMode('dealer')
    expect(calls).toBe(0)
  })

  test('a zero duration finishes the roll immediately', () => {
    const scheduler = createFakeScheduler()
    const store = createStore({
      settings: DEFAULT_SETTINGS,
      random: sequenceSource([0, 0]),
      now: () => 1,
      schedule: scheduler.schedule,
      rollDurationMs: () => 0,
      persist: () => undefined,
    })
    store.roll()
    expect(store.getState().isRolling).toBe(false)
    expect(store.getState().mainResult?.roll.total).toBe(2)
  })
})
