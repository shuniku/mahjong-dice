import type { StorageLike } from '../../src/state/settings'

export function createMemoryStorage(initial: Record<string, string> = {}): StorageLike & {
  readonly dump: () => Record<string, string>
} {
  let data = { ...initial }
  return {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data = { ...data, [key]: value }
    },
    dump: () => ({ ...data }),
  }
}

export function createThrowingStorage(): StorageLike {
  const fail = (): never => {
    throw new Error('storage unavailable')
  }
  return { getItem: fail, setItem: fail }
}
