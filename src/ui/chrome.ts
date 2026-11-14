import type { Mode, Store } from '../state/store'
import { h } from './dom'

export const MODE_ORDER: readonly Mode[] = ['main', 'dealer', 'settings']

const TABS: readonly { readonly mode: Mode; readonly label: string }[] = [
  { mode: 'main', label: '振る' },
  { mode: 'dealer', label: '起家' },
  { mode: 'settings', label: '設定' },
]

export function renderNav(current: Mode, store: Store): HTMLElement {
  const tabs = TABS.map(({ mode, label }) =>
    h(
      'button',
      {
        type: 'button',
        class: 'tabs__tab',
        'data-testid': `nav-${mode}`,
        'aria-current': current === mode ? 'page' : null,
        onclick: () => store.setMode(mode),
      },
      label,
    ),
  )
  return h('nav', { class: 'tabs', 'aria-label': '画面の切り替え' }, ...tabs)
}

export function renderUpdateBanner(onAccept: () => void, onDismiss: () => void): HTMLElement {
  return h(
    'div',
    { class: 'update-banner', role: 'status', 'data-testid': 'update-banner' },
    h('span', {}, '新しい版があります'),
    h('button', { type: 'button', 'data-testid': 'update-button', onclick: onAccept }, '更新'),
    h('button', { type: 'button', 'data-testid': 'update-dismiss', onclick: onDismiss }, '閉じる'),
  )
}

export function slideClass(from: Mode, to: Mode): string {
  if (from === to) return ''
  return MODE_ORDER.indexOf(to) > MODE_ORDER.indexOf(from)
    ? 'screen--from-right'
    : 'screen--from-left'
}
