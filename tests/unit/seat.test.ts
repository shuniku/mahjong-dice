import { describe, expect, test } from 'vitest'
import { SEAT_LABELS, seatForTotal } from '../../src/domain/seat'
import type { PlayerCount, Seat } from '../../src/domain/types'

const FOUR: readonly (readonly [Seat, readonly number[]])[] = [
  ['self', [5, 9]],
  ['shimocha', [2, 6, 10]],
  ['toimen', [3, 7, 11]],
  ['kamicha', [4, 8, 12]],
]
const THREE: readonly (readonly [Seat, readonly number[]])[] = [
  ['self', [4, 7, 10]],
  ['shimocha', [2, 5, 8, 11]],
  ['kamicha', [3, 6, 9, 12]],
]

function expand(table: typeof FOUR): [number, Seat][] {
  return table.flatMap(([seat, totals]) => totals.map((t): [number, Seat] => [t, seat]))
}

describe('seatForTotal (4 players)', () => {
  test.each(expand(FOUR))('U-S1..S4: total %i hits %s', (total, seat) => {
    expect(seatForTotal(total, 4)).toBe(seat)
  })
})

describe('seatForTotal (3 players)', () => {
  test.each(expand(THREE))('U-S5..S7: total %i hits %s', (total, seat) => {
    expect(seatForTotal(total, 3)).toBe(seat)
  })

  test('U-S8: toimen never appears', () => {
    for (let total = 2; total <= 12; total += 1) {
      expect(seatForTotal(total, 3)).not.toBe('toimen')
    }
  })
})

describe('seatForTotal validation', () => {
  test.each([1, 13, 0, -1, 7.5, NaN, Infinity])('U-S9: throws for %s', (total) => {
    for (const players of [3, 4] as PlayerCount[]) {
      expect(() => seatForTotal(total, players)).toThrow(RangeError)
    }
  })

  test('throws for an unsupported player count', () => {
    expect(() => seatForTotal(7, 5 as PlayerCount)).toThrow(RangeError)
  })
})

describe('SEAT_LABELS', () => {
  test('U-W2: names each seat', () => {
    expect(SEAT_LABELS).toEqual({
      self: '自家',
      shimocha: '下家',
      toimen: '対面',
      kamicha: '上家',
    })
  })
})
