import { describe, expect, test } from 'vitest'
import { decideDealer } from '../../src/domain/dealer'
import { seatForTotal } from '../../src/domain/seat'
import type { DiceRoll, PlayerCount } from '../../src/domain/types'

function rollOf(a: DiceRoll['dice'][0], b: DiceRoll['dice'][1]): DiceRoll {
  return { dice: [a, b], total: a + b, rolledAt: 0 }
}

describe('decideDealer', () => {
  test('U-K1: 4 players, total 6 -> shimocha', () => {
    expect(decideDealer(rollOf(3, 3), 4)).toBe('shimocha')
  })

  test('U-K2: 3 players, total 6 -> kamicha', () => {
    expect(decideDealer(rollOf(2, 4), 3)).toBe('kamicha')
  })

  test('U-K3: uses the same table as seatForTotal for every total', () => {
    for (const players of [3, 4] as PlayerCount[]) {
      for (let a = 1 as DiceRoll['dice'][0]; a <= 6; a = (a + 1) as DiceRoll['dice'][0]) {
        for (let b = 1 as DiceRoll['dice'][1]; b <= 6; b = (b + 1) as DiceRoll['dice'][1]) {
          const roll = rollOf(a, b)
          expect(decideDealer(roll, players)).toBe(seatForTotal(roll.total, players))
        }
      }
    }
  })
})
