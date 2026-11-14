export type PlayerCount = 3 | 4
/** 自家・下家・対面・上家 */
export type Seat = 'self' | 'shimocha' | 'toimen' | 'kamicha'
export type DieFace = 1 | 2 | 3 | 4 | 5 | 6

export interface RandomSource {
  /** 0 以上 2^32 未満の整数を一様に返す。 */
  nextUint32(): number
}

export interface DiceRoll {
  readonly dice: readonly [DieFace, DieFace]
  /** 2〜12 */
  readonly total: number
  /** 時刻（ミリ秒） */
  readonly rolledAt: number
}

export interface HistoryEntry {
  readonly dice: readonly [DieFace, DieFace]
  readonly total: number
  readonly seat: Seat
  readonly rolledAt: number
}
