import { SEAT_LABELS } from '../domain/seat'
import type { AppState, Store } from '../state/store'
import { renderDiceStage } from './components/diceStage'
import { renderPlayerToggle } from './components/playerToggle'
import { renderTableDiagram } from './components/tableDiagram'
import { renderTotal } from './components/total'
import { h } from './dom'

function dealerText(state: AppState): string {
  const result = state.dealerResult
  if (state.isRolling) return '振っています…'
  if (result === null) return '振った人から反時計回りに数えて起家を決めます'
  return `起家: ${SEAT_LABELS[result.seat]}`
}

/** 起家決め（1 度振り）。 */
export function renderDealerScreen(state: AppState, store: Store): HTMLElement {
  const result = state.dealerResult
  return h(
    'section',
    { class: 'panel' },
    h('h2', { class: 'panel__title' }, '起家決め'),
    renderPlayerToggle(state, store),
    renderDiceStage(state, result, store.roll),
    renderTotal(result?.roll.total ?? null, state.isRolling),
    h('p', { class: 'dealer-result', 'data-testid': 'dealer-result' }, dealerText(state)),
    renderTableDiagram({
      players: state.settings.players,
      hitSeat: state.isRolling ? null : (result?.seat ?? null),
      isWaremeVisible: false,
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
      result === null ? '振る' : '振り直す',
    ),
  )
}
