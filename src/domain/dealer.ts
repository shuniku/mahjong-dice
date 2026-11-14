import { seatForTotal } from './seat'
import type { DiceRoll, PlayerCount, Seat } from './types'

/** 起家決め（1 度振り）。当たる人の判定と同じ表を使う。 */
export function decideDealer(roll: DiceRoll, players: PlayerCount): Seat {
  return seatForTotal(roll.total, players)
}
