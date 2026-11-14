import type { PlayerCount, Seat } from './types'

export const MIN_TOTAL = 2
export const MAX_TOTAL = 12

export const SEAT_LABELS: Readonly<Record<Seat, string>> = {
  self: '自家',
  shimocha: '下家',
  toimen: '対面',
  kamicha: '上家',
}

/** 合計を人数で割った余り（添字）→ 当たる人（SPEC 4.3）。 */
const FOUR_PLAYER_TABLE: readonly Seat[] = ['kamicha', 'self', 'shimocha', 'toimen']
const THREE_PLAYER_TABLE: readonly Seat[] = ['kamicha', 'self', 'shimocha']

function assertValidTotal(total: number): void {
  if (!Number.isInteger(total) || total < MIN_TOTAL || total > MAX_TOTAL) {
    throw new RangeError(`total must be an integer from ${MIN_TOTAL} to ${MAX_TOTAL}: ${total}`)
  }
}

export function seatForTotal(total: number, players: PlayerCount): Seat {
  assertValidTotal(total)
  if (players !== 3 && players !== 4) {
    throw new RangeError(`players must be 3 or 4: ${String(players)}`)
  }
  const table = players === 4 ? FOUR_PLAYER_TABLE : THREE_PLAYER_TABLE
  // 余りは 0..players-1 なので、検証済みの入力では必ず席が見つかる。
  return table[total % players] as Seat
}
