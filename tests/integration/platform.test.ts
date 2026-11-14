import { describe, expect, test, vi } from 'vitest'
import { createWakeLock } from '../../src/platform/wakeLock'
import { createSoundPlayer, defaultAudioContextFactory } from '../../src/platform/sound'

function fakeSentinel() {
  return { release: vi.fn(() => Promise.resolve()) }
}

describe('wake lock', () => {
  test('I-8: does nothing and does not throw when unsupported', async () => {
    const wakeLock = createWakeLock({} as Navigator, document)
    await expect(wakeLock.acquire()).resolves.toBe(false)
    await expect(wakeLock.release()).resolves.toBeUndefined()
  })

  test('I-8: swallows a rejected request', async () => {
    const nav = { wakeLock: { request: () => Promise.reject(new Error('denied')) } }
    const wakeLock = createWakeLock(nav as unknown as Navigator, document)
    await expect(wakeLock.acquire()).resolves.toBe(false)
  })

  test('acquires and releases a lock when supported', async () => {
    const sentinel = fakeSentinel()
    const nav = { wakeLock: { request: vi.fn(() => Promise.resolve(sentinel)) } }
    const wakeLock = createWakeLock(nav as unknown as Navigator, document)
    await expect(wakeLock.acquire()).resolves.toBe(true)
    await wakeLock.release()
    expect(sentinel.release).toHaveBeenCalledTimes(1)
  })

  test('swallows a release failure', async () => {
    const sentinel = { release: () => Promise.reject(new Error('x')) }
    const nav = { wakeLock: { request: () => Promise.resolve(sentinel) } }
    const wakeLock = createWakeLock(nav as unknown as Navigator, document)
    await wakeLock.acquire()
    await expect(wakeLock.release()).resolves.toBeUndefined()
  })

  test('re-acquires when the page becomes visible again', async () => {
    const request = vi.fn(() => Promise.resolve(fakeSentinel()))
    const wakeLock = createWakeLock({ wakeLock: { request } } as unknown as Navigator, document)
    await wakeLock.acquire()
    const stop = wakeLock.watchVisibility()
    document.dispatchEvent(new Event('visibilitychange'))
    await Promise.resolve()
    expect(request).toHaveBeenCalledTimes(2)
    stop()
    document.dispatchEvent(new Event('visibilitychange'))
    await Promise.resolve()
    expect(request).toHaveBeenCalledTimes(2)
  })

  test('does not re-acquire after release()', async () => {
    const request = vi.fn(() => Promise.resolve(fakeSentinel()))
    const wakeLock = createWakeLock({ wakeLock: { request } } as unknown as Navigator, document)
    await wakeLock.acquire()
    await wakeLock.release()
    const stop = wakeLock.watchVisibility()
    document.dispatchEvent(new Event('visibilitychange'))
    await Promise.resolve()
    stop()
    expect(request).toHaveBeenCalledTimes(1)
  })
})

function fakeAudioContext() {
  const gain = {
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  }
  const filter = { type: '', frequency: { value: 0 }, connect: vi.fn() }
  const source = { buffer: null as unknown, connect: vi.fn(), start: vi.fn() }
  const ctx = {
    currentTime: 0,
    sampleRate: 8000,
    state: 'suspended',
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    createBuffer: vi.fn((_c: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    })),
    createBufferSource: vi.fn(() => source),
    createBiquadFilter: vi.fn(() => filter),
    createGain: vi.fn(() => gain),
  }
  return { ctx, source }
}

describe('sound player', () => {
  test('plays clicks through Web Audio', () => {
    const { ctx, source } = fakeAudioContext()
    const player = createSoundPlayer(() => ctx as unknown as AudioContext)
    expect(player.play()).toBe(true)
    expect(source.start).toHaveBeenCalled()
    expect(ctx.resume).toHaveBeenCalled()
  })

  test('reuses a single audio context', () => {
    const { ctx } = fakeAudioContext()
    const factory = vi.fn(() => ctx as unknown as AudioContext)
    const player = createSoundPlayer(factory)
    player.play()
    player.play()
    expect(factory).toHaveBeenCalledTimes(1)
  })

  test('is a no-op when Web Audio is unavailable', () => {
    expect(createSoundPlayer(() => null).play()).toBe(false)
  })

  test('returns false when the audio context throws', () => {
    const player = createSoundPlayer(() => {
      throw new Error('blocked')
    })
    expect(player.play()).toBe(false)
  })
})

describe('defaultAudioContextFactory', () => {
  test('returns null when no AudioContext exists', () => {
    expect(defaultAudioContextFactory()).toBeNull()
  })

  test('constructs an AudioContext when available', () => {
    const instance = {}
    const Fake = vi.fn(function () {
      return instance
    })
    vi.stubGlobal('AudioContext', Fake)
    try {
      expect(defaultAudioContextFactory()).toBe(instance)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
