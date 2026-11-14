import { SEAT_LABELS } from './seat'
import type { Seat } from './types'

export function wallBreakMessage(seat: Seat, total: number): string {
  return `${SEAT_LABELS[seat]}の山を右から ${total} 幢残して取り始める`
}

export function waremeMessage(seat: Seat): string {
  return `割れ目: ${SEAT_LABELS[seat]}（点数の受け払いが 2 倍）`
}
