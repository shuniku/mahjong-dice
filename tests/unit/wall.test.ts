import { describe, expect, test } from 'vitest'
import { waremeMessage, wallBreakMessage } from '../../src/domain/wall'
import type { Seat } from '../../src/domain/types'

describe('wallBreakMessage', () => {
  test('U-W1: toimen with total 7', () => {
    expect(wallBreakMessage('toimen', 7)).toBe('対面の山を右から 7 幢残して取り始める')
  })

  test.each<[Seat, string]>([
    ['self', '自家'],
    ['shimocha', '下家'],
    ['toimen', '対面'],
    ['kamicha', '上家'],
  ])('U-W2: %s is named %s', (seat, name) => {
    expect(wallBreakMessage(seat, 5)).toBe(`${name}の山を右から 5 幢残して取り始める`)
  })
})

describe('waremeMessage', () => {
  test('U-W3: toimen', () => {
    expect(waremeMessage('toimen')).toBe('割れ目: 対面（点数の受け払いが 2 倍）')
  })

  test('uses the seat name', () => {
    expect(waremeMessage('kamicha')).toBe('割れ目: 上家（点数の受け払いが 2 倍）')
  })
})
