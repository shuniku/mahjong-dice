import { SEAT_LABELS } from '../domain/seat'
import type { HistoryEntry } from '../domain/types'
import type { AppState, Store } from '../state/store'
import { h } from './dom'
import { formatTime, formatTotal } from './format'

function renderToggle(
  testId: string,
  label: string,
  isChecked: boolean,
  onChange: (value: boolean) => void,
): HTMLElement {
  return h(
    'label',
    { class: 'toggle' },
    h('span', { class: 'toggle__label' }, label),
    h('input', {
      type: 'checkbox',
      class: 'toggle__input',
      'data-testid': testId,
      checked: isChecked,
      onchange: (event: Event) => onChange((event.target as HTMLInputElement).checked),
    }),
  )
}

function renderHistoryItem(entry: HistoryEntry): HTMLElement {
  return h(
    'li',
    { class: 'history__item', 'data-testid': 'history-item', 'data-total': entry.total },
    h('time', { class: 'history__time' }, formatTime(entry.rolledAt)),
    h('span', { class: 'history__dice' }, `${entry.dice[0]}・${entry.dice[1]}`),
    h('span', { class: 'history__total' }, formatTotal(entry.total)),
    h('span', { class: 'history__seat' }, SEAT_LABELS[entry.seat]),
  )
}

function renderHistory(history: readonly HistoryEntry[]): HTMLElement {
  if (history.length === 0) {
    return h(
      'p',
      { class: 'history__empty', 'data-testid': 'history-empty' },
      'まだ履歴はありません',
    )
  }
  return h(
    'ol',
    { class: 'history', 'data-testid': 'history-list' },
    ...history.map(renderHistoryItem),
  )
}

export function renderSettingsScreen(state: AppState, store: Store): HTMLElement {
  const { settings } = state
  return h(
    'section',
    { class: 'panel' },
    h('h2', { class: 'panel__title' }, '設定'),
    renderToggle('toggle-sound', 'サイコロの音', settings.soundOn, (soundOn) =>
      store.updateSettings({ soundOn }),
    ),
    renderToggle('toggle-wareme', '割れ目を表示する', settings.waremeVisible, (waremeVisible) =>
      store.updateSettings({ waremeVisible }),
    ),
    h('h2', { class: 'panel__title' }, '履歴（直近 20 回）'),
    renderHistory(state.history),
  )
}
