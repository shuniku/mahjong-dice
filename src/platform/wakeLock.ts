export interface WakeLockController {
  readonly acquire: () => Promise<boolean>
  readonly release: () => Promise<void>
  /** 画面が再び表示されたときにロックを取り直す。解除関数を返す。 */
  readonly watchVisibility: () => () => void
}

/** Wake Lock API が使えない・拒否された場合は何もしない（false を返す）。 */
export function createWakeLock(nav: Navigator, doc: Document): WakeLockController {
  let sentinel: WakeLockSentinel | null = null
  let isWanted = false

  const request = async (): Promise<boolean> => {
    if (!('wakeLock' in nav)) return false
    try {
      sentinel = await nav.wakeLock.request('screen')
      return true
    } catch {
      sentinel = null
      return false
    }
  }

  const acquire = async (): Promise<boolean> => {
    isWanted = true
    return request()
  }

  const release = async (): Promise<void> => {
    isWanted = false
    const current = sentinel
    sentinel = null
    if (current === null) return
    try {
      await current.release()
    } catch {
      // すでに解放済みなど。スリープ防止は補助機能なので続行する。
    }
  }

  const watchVisibility = (): (() => void) => {
    const onChange = (): void => {
      if (isWanted && doc.visibilityState === 'visible') void request()
    }
    doc.addEventListener('visibilitychange', onChange)
    return () => doc.removeEventListener('visibilitychange', onChange)
  }

  return { acquire, release, watchVisibility }
}
