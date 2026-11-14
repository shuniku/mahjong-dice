import type { PlayerCount } from '../domain/types'

export interface Settings {
  readonly players: PlayerCount
  readonly soundOn: boolean
  readonly waremeVisible: boolean
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export const STORAGE_KEY = 'mahjong-dice:settings:v1'

export const DEFAULT_SETTINGS: Settings = { players: 4, soundOn: false, waremeVisible: true }

/** localStorage へのアクセス自体が例外を投げる環境（プライベートモード等）では null。 */
export function getLocalStorage(): StorageLike | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isPlayerCount(value: unknown): value is PlayerCount {
  return value === 3 || value === 4
}

function parseSettings(raw: string): Settings {
  const parsed: unknown = JSON.parse(raw)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return DEFAULT_SETTINGS
  }
  const record = parsed as Record<string, unknown>
  if (!isPlayerCount(record.players)) {
    return DEFAULT_SETTINGS
  }
  return {
    players: record.players,
    soundOn: typeof record.soundOn === 'boolean' ? record.soundOn : DEFAULT_SETTINGS.soundOn,
    waremeVisible:
      typeof record.waremeVisible === 'boolean'
        ? record.waremeVisible
        : DEFAULT_SETTINGS.waremeVisible,
  }
}

/** 読み込みに失敗しても例外は出さず、初期値を返す。 */
export function loadSettings(storage: StorageLike | null = getLocalStorage()): Settings {
  if (storage === null) return DEFAULT_SETTINGS
  try {
    const raw = storage.getItem(STORAGE_KEY)
    return raw === null ? DEFAULT_SETTINGS : parseSettings(raw)
  } catch {
    return DEFAULT_SETTINGS
  }
}

/** 保存できたかどうかを返す。失敗しても画面は動かし続ける。 */
export function saveSettings(
  settings: Settings,
  storage: StorageLike | null = getLocalStorage(),
): boolean {
  if (storage === null) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}
