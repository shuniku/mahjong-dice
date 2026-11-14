export type AudioContextFactory = () => AudioContext | null

export interface SoundPlayer {
  /** 音を鳴らせたら true。Web Audio が使えなければ何もしない。 */
  readonly play: () => boolean
}

const CLICK_COUNT = 5
const CLICK_SPACING_SECONDS = 0.07
const CLICK_LENGTH_SECONDS = 0.03
const CLICK_VOLUME = 0.35
const CLICK_FILTER_HZ = 1800

type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }

export function defaultAudioContextFactory(): AudioContext | null {
  const win = window as AudioWindow
  const Ctor = win.AudioContext ?? win.webkitAudioContext
  return Ctor === undefined ? null : new Ctor()
}

function scheduleClick(ctx: AudioContext, startAt: number): void {
  const length = Math.max(1, Math.floor(ctx.sampleRate * CLICK_LENGTH_SECONDS))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length)
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = CLICK_FILTER_HZ
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(CLICK_VOLUME, startAt)
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + CLICK_LENGTH_SECONDS)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start(startAt)
}

export function createSoundPlayer(
  factory: AudioContextFactory = defaultAudioContextFactory,
): SoundPlayer {
  let ctx: AudioContext | null = null
  const play = (): boolean => {
    try {
      ctx = ctx ?? factory()
      if (ctx === null) return false
      if (ctx.state === 'suspended') void ctx.resume()
      for (let i = 0; i < CLICK_COUNT; i += 1) {
        scheduleClick(ctx, ctx.currentTime + i * CLICK_SPACING_SECONDS)
      }
      return true
    } catch {
      return false
    }
  }
  return { play }
}
