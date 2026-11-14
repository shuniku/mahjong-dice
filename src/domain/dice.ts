import type { DiceRoll, DieFace, RandomSource } from './types'

const FACE_COUNT = 6
const UINT32_RANGE = 2 ** 32
/** 6 の倍数のうち 2^32 以下で最大の値。これ以上の乱数は偏るので捨てる（棄却法）。 */
export const REJECTION_LIMIT = Math.floor(UINT32_RANGE / FACE_COUNT) * FACE_COUNT

export function createCryptoRandomSource(cryptoApi: Crypto = globalThis.crypto): RandomSource {
  return {
    nextUint32: () => {
      const buffer = new Uint32Array(1)
      cryptoApi.getRandomValues(buffer)
      return buffer[0] as number
    },
  }
}

export function rollDie(random: RandomSource): DieFace {
  let value = random.nextUint32()
  while (value >= REJECTION_LIMIT) {
    value = random.nextUint32()
  }
  return ((value % FACE_COUNT) + 1) as DieFace
}

export function rollDice(random: RandomSource, now: () => number): DiceRoll {
  const first = rollDie(random)
  const second = rollDie(random)
  return { dice: [first, second], total: first + second, rolledAt: now() }
}
