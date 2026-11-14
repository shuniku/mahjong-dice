import { decideDealer } from '../domain/dealer'
import { rollDice } from '../domain/dice'
import { appendHistory } from '../domain/history'
import { seatForTotal } from '../domain/seat'
import type { DiceRoll, HistoryEntry, PlayerCount, RandomSource, Seat } from '../domain/types'
import type { Settings } from './settings'

export type Mode = 'main' | 'dealer' | 'settings'
type RollTarget = 'main' | 'dealer'

export interface RollResult {
  readonly roll: DiceRoll
  readonly seat: Seat
}

interface PendingRoll {
  readonly roll: DiceRoll
  readonly target: RollTarget
}

export interface AppState {
  readonly settings: Settings
  readonly mode: Mode
  readonly isRolling: boolean
  readonly pending: PendingRoll | null
  readonly mainResult: RollResult | null
  readonly dealerResult: RollResult | null
  readonly history: readonly HistoryEntry[]
}

export function createInitialState(settings: Settings): AppState {
  return {
    settings,
    mode: 'main',
    isRolling: false,
    pending: null,
    mainResult: null,
    dealerResult: null,
    history: [],
  }
}

export function beginRoll(state: AppState, roll: DiceRoll): AppState {
  const target: RollTarget = state.mode === 'dealer' ? 'dealer' : 'main'
  return { ...state, isRolling: true, pending: { roll, target } }
}

export function finishRoll(state: AppState): AppState {
  const { pending } = state
  if (pending === null) return state
  const players = state.settings.players
  const { roll } = pending
  if (pending.target === 'dealer') {
    const result: RollResult = { roll, seat: decideDealer(roll, players) }
    return { ...state, isRolling: false, pending: null, dealerResult: result }
  }
  const seat = seatForTotal(roll.total, players)
  const entry: HistoryEntry = { dice: roll.dice, total: roll.total, seat, rolledAt: roll.rolledAt }
  return {
    ...state,
    isRolling: false,
    pending: null,
    mainResult: { roll, seat },
    history: appendHistory(state.history, entry),
  }
}

export function withPlayers(state: AppState, players: PlayerCount): AppState {
  return {
    ...state,
    settings: { ...state.settings, players },
    mainResult: null,
    dealerResult: null,
  }
}

export interface StoreDeps {
  readonly settings: Settings
  readonly random: RandomSource
  readonly now: () => number
  readonly schedule: (task: () => void, delayMs: number) => void
  readonly rollDurationMs: () => number
  readonly persist: (settings: Settings) => void
}

export interface Store {
  readonly getState: () => AppState
  readonly subscribe: (listener: () => void) => () => void
  readonly roll: () => void
  readonly setPlayers: (players: PlayerCount) => void
  readonly setMode: (mode: Mode) => void
  readonly updateSettings: (patch: Partial<Pick<Settings, 'soundOn' | 'waremeVisible'>>) => void
}

export function createStore(deps: StoreDeps): Store {
  let state = createInitialState(deps.settings)
  let listeners: readonly (() => void)[] = []

  const commit = (next: AppState): void => {
    state = next
    listeners.forEach((listener) => listener())
  }

  const roll = (): void => {
    if (state.isRolling) return
    commit(beginRoll(state, rollDice(deps.random, deps.now)))
    const duration = deps.rollDurationMs()
    if (duration <= 0) {
      commit(finishRoll(state))
      return
    }
    deps.schedule(() => commit(finishRoll(state)), duration)
  }

  const setPlayers = (players: PlayerCount): void => {
    if (state.isRolling || state.settings.players === players) return
    commit(withPlayers(state, players))
    deps.persist(state.settings)
  }

  const setMode = (mode: Mode): void => {
    if (state.mode === mode) return
    commit({ ...state, mode })
  }

  const updateSettings: Store['updateSettings'] = (patch) => {
    commit({ ...state, settings: { ...state.settings, ...patch } })
    deps.persist(state.settings)
  }

  const subscribe = (listener: () => void): (() => void) => {
    listeners = [...listeners, listener]
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }

  return { getState: () => state, subscribe, roll, setPlayers, setMode, updateSettings }
}
