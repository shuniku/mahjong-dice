import type { PlayerCount } from '../../domain/types'
import type { AppState, Store } from '../../state/store'
import { h } from '../dom'

const OPTIONS: readonly { readonly players: PlayerCount; readonly label: string }[] = [
  { players: 4, label: '4人打ち' },
  { players: 3, label: '3人打ち' },
]

/** 4人打ち・3人打ちの切り替え。 */
export function renderPlayerToggle(state: AppState, store: Store): HTMLElement {
  const buttons = OPTIONS.map(({ players, label }) =>
    h(
      'button',
      {
        type: 'button',
        class: 'segmented__button',
        'data-testid': `players-${players}`,
        'aria-pressed': state.settings.players === players,
        'aria-disabled': state.isRolling,
        onclick: () => store.setPlayers(players),
      },
      label,
    ),
  )
  return h('div', { class: 'segmented', role: 'group', 'aria-label': '人数' }, ...buttons)
}
