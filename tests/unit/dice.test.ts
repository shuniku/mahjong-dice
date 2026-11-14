import { describe, expect, test } from 'vitest'
import { REJECTION_LIMIT, createCryptoRandomSource, rollDice, rollDie } from '../../src/domain/dice'
import { sequenceSource } from '../helpers/random'

describe('rollDie', () => {
  test.each([
    [0, 1],
    [1, 2],
    [5, 6],
    [6, 1],
    [7, 2],
    [REJECTION_LIMIT - 1, 6],
  ])('U-D1: maps random value %i to face %i', (value, face) => {
    // Arrange
    const random = sequenceSource([value])
    // Act
    const result = rollDie(random)
    // Assert
    expect(result).toBe(face)
  })

  test('U-D2: redraws when the value falls in the biased range', () => {
    // Arrange
    const random = sequenceSource([REJECTION_LIMIT, 4294967295, 7])
    // Act
    const result = rollDie(random)
    // Assert
    expect(result).toBe(2)
    expect(random.calls()).toBe(3)
  })

  test('REJECTION_LIMIT is a multiple of 6 and the largest one below 2^32', () => {
    expect(REJECTION_LIMIT % 6).toBe(0)
    expect(REJECTION_LIMIT + 6).toBeGreaterThan(2 ** 32 - 1)
  })
})

describe('rollDice', () => {
  test('U-D3: total is the sum of both dice', () => {
    // Arrange
    const random = sequenceSource([2, 5])
    // Act
    const roll = rollDice(random, () => 1000)
    // Assert
    expect(roll.dice).toEqual([3, 6])
    expect(roll.total).toBe(roll.dice[0] + roll.dice[1])
  })

  test('U-D5: records the injected time', () => {
    // Arrange
    const random = sequenceSource([0, 0])
    // Act
    const roll = rollDice(random, () => 123456789)
    // Assert
    expect(roll.rolledAt).toBe(123456789)
  })
})

describe('createCryptoRandomSource', () => {
  test('reads one uint32 from the injected crypto object', () => {
    // Arrange
    const fakeCrypto = {
      getRandomValues: <T extends ArrayBufferView | null>(array: T): T => {
        ;(array as unknown as Uint32Array)[0] = 42
        return array
      },
    } as unknown as Crypto
    // Act
    const value = createCryptoRandomSource(fakeCrypto).nextUint32()
    // Assert
    expect(value).toBe(42)
  })

  test('uses the global crypto by default', () => {
    const value = createCryptoRandomSource().nextUint32()
    expect(Number.isInteger(value)).toBe(true)
    expect(value).toBeGreaterThanOrEqual(0)
  })

  test('U-D4: 60,000 real rolls are uniform (chi-square, p > 0.01)', () => {
    // Arrange
    const random = createCryptoRandomSource()
    const rolls = 60000
    const counts = [0, 0, 0, 0, 0, 0]
    // Act
    for (let i = 0; i < rolls; i += 1) {
      const face = rollDie(random)
      counts[face - 1] = (counts[face - 1] ?? 0) + 1
    }
    // Assert
    const expected = rolls / 6
    const chiSquare = counts.reduce((sum, c) => sum + (c - expected) ** 2 / expected, 0)
    const CRITICAL_VALUE_DF5_P001 = 15.086
    expect(chiSquare).toBeLessThan(CRITICAL_VALUE_DF5_P001)
    for (const count of counts) {
      expect(Math.abs(count / rolls - 1 / 6)).toBeLessThan(0.01)
    }
  })
})
