import type { DieFace } from '../../domain/types'
import { h } from '../dom'

/** 3x3 の格子（0〜8）のうち、目を置くマス。 */
const PIP_CELLS: Readonly<Record<DieFace, readonly number[]>> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}
const GRID_CELLS = 9

function renderCell(face: DieFace, index: number): HTMLElement {
  const hasPip = PIP_CELLS[face].includes(index)
  const pipClass = face === 1 ? 'pip pip--red' : 'pip'
  return h('span', { class: 'die__cell' }, hasPip && h('span', { class: pipClass }))
}

/** 白地に黒の目。1 の目だけ赤。 */
export function renderDie(face: DieFace, slot: 0 | 1, isRolling: boolean): HTMLElement {
  const cells = Array.from({ length: GRID_CELLS }, (_, i) => renderCell(face, i))
  return h(
    'div',
    {
      class: isRolling ? 'die die--rolling' : 'die',
      role: 'img',
      'aria-label': `サイコロ ${face}`,
      'data-testid': `die-${slot}`,
      'data-face': face,
    },
    ...cells,
  )
}
