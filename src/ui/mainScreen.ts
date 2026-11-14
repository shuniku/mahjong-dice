import { SEAT_LABELS } from '../domain/seat'
import { wallBreakMessage, waremeMessage } from '../domain/wall'
import type { AppState, RollResult, Store } from '../state/store'
import { renderDiceStage } from './components/diceStage'
import { renderPlayerToggle } from './components/playerToggle'
import { renderTableDiagram } from './components/tableDiagram'
import { renderTotal } from './components/total'
import { h } from './dom'

function renderOutcome(result: RollResult, isWaremeVisible: boolean): HTMLElement {
  const { seat, roll } = result
  return h(
    'div',
    { class: 'outcome' },
    h('h2', { class: 'outcome__seat', 'data-testid': 'seat-label' }, `${SEAT_LABELS[seat]}の山`),
    h(
      'p',
      { class: 'outcome__wall', 'data-testid': 'wall-message' },
      wallBreakMessage(seat, roll.total),
    ),
    isWaremeVisible &&
      h(
        'p',
        { class: 'wareme', 'data-testid': 'wareme-message' },
        h('span', { class: 'wareme__mark', 'aria-hidden': 'true' }, '割'),
        waremeMessage(seat),
      ),
  )
}

export function renderMainScreen(state: AppState, store: Store): HTMLElement {
  const result = state.mainResult
  const isWaremeVisible = state.settings.waremeVisible
  return h(
    'section',
    { class: 'panel' },
    renderPlayerToggle(state, store),
    renderDiceStage(state, result, store.roll),
    renderTotal(result?.roll.total ?? null, state.isRolling),
    result !== null && !state.isRolling && renderOutcome(result, isWaremeVisible),
    renderTableDiagram({
      players: state.settings.players,
      hitSeat: state.isRolling ? null : (result?.seat ?? null),
      isWaremeVisible,
    }),
    h(
      'button',
      {
        type: 'button',
        class: 'primary-button',
        'data-testid': 'roll-button',
        'aria-disabled': state.isRolling,
        onclick: store.roll,
      },
      '振る',
    ),
  )
}
