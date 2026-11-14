import { SEAT_LABELS } from '../../domain/seat'
import type { PlayerCount, Seat } from '../../domain/types'
import { svg } from '../dom'

interface SeatLayout {
  readonly seat: Seat
  readonly wind: string
  readonly x: number
  readonly y: number
}

const TILE_WIDTH = 88
const TILE_HEIGHT = 64

/** 振る人（自家）を下にして、反時計回りに 下家（右）→ 対面（上）→ 上家（左）。 */
const FOUR_PLAYER_LAYOUT: readonly SeatLayout[] = [
  { seat: 'self', wind: '東', x: 130, y: 214 },
  { seat: 'shimocha', wind: '南', x: 214, y: 130 },
  { seat: 'toimen', wind: '西', x: 130, y: 46 },
  { seat: 'kamicha', wind: '北', x: 46, y: 130 },
]
const THREE_PLAYER_LAYOUT: readonly SeatLayout[] = [
  { seat: 'self', wind: '東', x: 130, y: 214 },
  { seat: 'shimocha', wind: '南', x: 214, y: 130 },
  { seat: 'kamicha', wind: '西', x: 46, y: 130 },
]

export interface TableDiagramOptions {
  readonly players: PlayerCount
  readonly hitSeat: Seat | null
  readonly isWaremeVisible: boolean
}

function renderSeat(layout: SeatLayout, options: TableDiagramOptions): SVGElement {
  const isHit = layout.seat === options.hitSeat
  const hasWareme = isHit && options.isWaremeVisible
  const left = layout.x - TILE_WIDTH / 2
  const top = layout.y - TILE_HEIGHT / 2
  const className = ['seat', isHit ? 'seat--hit' : '', hasWareme ? 'seat--wareme' : '']
    .filter((name) => name !== '')
    .join(' ')
  return svg(
    'g',
    { class: className, 'data-testid': 'seat', 'data-seat': layout.seat, 'data-hit': isHit },
    svg('rect', {
      class: 'seat__tile',
      x: left,
      y: top,
      width: TILE_WIDTH,
      height: TILE_HEIGHT,
      rx: 10,
    }),
    svg(
      'text',
      { class: 'seat__wind', x: layout.x, y: layout.y + 4, 'text-anchor': 'middle' },
      layout.wind,
    ),
    svg(
      'text',
      { class: 'seat__name', x: layout.x, y: layout.y + 24, 'text-anchor': 'middle' },
      SEAT_LABELS[layout.seat],
    ),
    hasWareme && renderWaremeMark(left + TILE_WIDTH - 6, top + 6),
  )
}

function renderWaremeMark(cx: number, cy: number): SVGElement {
  return svg(
    'g',
    { class: 'wareme-badge', 'data-testid': 'wareme-mark' },
    svg('circle', { cx, cy, r: 15 }),
    svg('text', { x: cx, y: cy + 6, 'text-anchor': 'middle' }, '割'),
  )
}

/** 卓の図。当たった席を強調し、割れ目の印を付ける。 */
export function renderTableDiagram(options: TableDiagramOptions): SVGElement {
  const layouts = options.players === 4 ? FOUR_PLAYER_LAYOUT : THREE_PLAYER_LAYOUT
  return svg(
    'svg',
    {
      class: 'table-diagram',
      viewBox: '0 0 260 260',
      role: 'img',
      'aria-label': `${options.players}人打ちの卓の図`,
      'data-testid': 'table-diagram',
      'data-players': options.players,
    },
    svg('rect', { class: 'table-diagram__felt', x: 78, y: 78, width: 104, height: 104, rx: 8 }),
    ...layouts.map((layout) => renderSeat(layout, options)),
  )
}
