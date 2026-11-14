import { describe, expect, test } from 'vitest'
import { formatTime, formatTotal, toKanji } from '../../src/ui/format'

describe('toKanji', () => {
  test('U-F1: converts 2..12', () => {
    const expected = ['二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
    const actual = Array.from({ length: 11 }, (_, i) => toKanji(i + 2))
    expect(actual).toEqual(expected)
  })

  test.each([1, 13, 7.5, NaN])('throws for %s', (n) => {
    expect(() => toKanji(n)).toThrow(RangeError)
  })
})

describe('formatTotal', () => {
  test('U-F2: shows kanji and digits together', () => {
    expect(formatTotal(7)).toBe('七（7）')
    expect(formatTotal(12)).toBe('十二（12）')
  })
})

describe('formatTime', () => {
  test('formats local time as HH:MM:SS with zero padding', () => {
    const ms = new Date(2026, 10, 14, 9, 5, 7).getTime()
    expect(formatTime(ms)).toBe('09:05:07')
  })
})
