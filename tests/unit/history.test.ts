import { describe, expect, test } from 'vitest'
import { MAX_HISTORY, appendHistory } from '../../src/domain/history'
import type { HistoryEntry } from '../../src/domain/types'

function entry(n: number): HistoryEntry {
  return { dice: [1, 2], total: 3, seat: 'toimen', rolledAt: n }
}

describe('appendHistory', () => {
  test('U-H1: puts the new entry first', () => {
    // Arrange
    const history = [entry(1)]
    // Act
    const next = appendHistory(history, entry(2))
    // Assert
    expect(next.map((e) => e.rolledAt)).toEqual([2, 1])
  })

  test('U-H2: drops the oldest entry beyond 20', () => {
    // Arrange
    const full = Array.from({ length: MAX_HISTORY }, (_, i) => entry(MAX_HISTORY - i))
    // Act
    const next = appendHistory(full, entry(21))
    // Assert
    expect(MAX_HISTORY).toBe(20)
    expect(next).toHaveLength(20)
    expect(next[0]?.rolledAt).toBe(21)
    expect(next.some((e) => e.rolledAt === 1)).toBe(false)
  })

  test('U-H3: does not change the original array', () => {
    // Arrange
    const history = [entry(1), entry(0)]
    const snapshot = history.map((e) => ({ ...e }))
    // Act
    appendHistory(history, entry(2))
    // Assert
    expect(history).toEqual(snapshot)
    expect(history).toHaveLength(2)
  })
})
