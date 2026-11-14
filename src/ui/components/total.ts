import { toKanji } from '../format'
import { h } from '../dom'

/** 合計。漢数字を大きく、算用数字を併記する（例: 七（7））。 */
export function renderTotal(total: number | null, isRolling: boolean): HTMLElement {
  if (total === null) {
    const placeholder = isRolling ? '…' : '－'
    return h(
      'div',
      { class: 'total total--empty', 'data-testid': 'total', 'aria-live': 'polite' },
      placeholder,
    )
  }
  return h(
    'div',
    { class: 'total', 'data-testid': 'total', 'aria-live': 'polite' },
    h('span', { class: 'total__kanji' }, toKanji(total)),
    h('span', { class: 'total__digits' }, `（${total}）`),
  )
}
