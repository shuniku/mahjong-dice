import type { DieFace } from '../../domain/types'
import type { AppState } from '../../state/store'
import { h } from '../dom'
import { renderDie } from './die'

const IDLE_FACES: readonly [DieFace, DieFace] = [3, 4]

function facesToShow(state: AppState, result: AppState['mainResult']): readonly [DieFace, DieFace] {
  if (state.pending !== null) return state.pending.roll.dice
  return result?.roll.dice ?? IDLE_FACES
}

/** 2 個のサイコロ。タップでも振れる。 */
export function renderDiceStage(
  state: AppState,
  result: AppState['mainResult'],
  onRoll: () => void,
): HTMLElement {
  const [first, second] = facesToShow(state, result)
  return h(
    'button',
    {
      type: 'button',
      class: 'dice-stage',
      'data-testid': 'dice-stage',
      'aria-label': 'サイコロを振る',
      'aria-disabled': state.isRolling,
      onclick: onRoll,
    },
    renderDie(first, 0, state.isRolling),
    renderDie(second, 1, state.isRolling),
  )
}
