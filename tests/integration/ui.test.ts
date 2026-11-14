import { describe, expect, test, vi } from 'vitest'
import { all, click, mountTestApp, q } from '../helpers/app'

function rollOnce(t: ReturnType<typeof mountTestApp>): void {
  click(t.root, 'roll-button')
  t.scheduler.flush()
}

describe('main screen', () => {
  test('shows a 4-player table with 東南西北 before any roll', () => {
    const { root } = mountTestApp([])
    const diagram = q(root, 'table-diagram')
    expect(diagram.getAttribute('data-players')).toBe('4')
    expect(all(diagram, 'seat').map((s) => s.getAttribute('data-seat'))).toEqual([
      'self',
      'shimocha',
      'toimen',
      'kamicha',
    ])
    expect(diagram.textContent).toContain('東')
    expect(diagram.textContent).toContain('南')
    expect(diagram.textContent).toContain('西')
    expect(diagram.textContent).toContain('北')
    expect(root.querySelector('[data-testid="wall-message"]')).toBeNull()
  })

  test('E-1 flow: roll shows dice, total, seat, wall message and wareme', () => {
    // Arrange: dice 3 and 4
    const t = mountTestApp([2, 3])
    // Act
    rollOnce(t)
    // Assert
    expect(q(t.root, 'die-0').getAttribute('data-face')).toBe('3')
    expect(q(t.root, 'die-1').getAttribute('data-face')).toBe('4')
    expect(q(t.root, 'total').textContent).toBe('七（7）')
    expect(q(t.root, 'seat-label').textContent).toBe('対面の山')
    expect(q(t.root, 'wall-message').textContent).toBe('対面の山を右から 7 幢残して取り始める')
    expect(q(t.root, 'wareme-message').textContent).toContain(
      '割れ目: 対面（点数の受け払いが 2 倍）',
    )
    const hit = all(t.root, 'seat').filter((s) => s.getAttribute('data-hit') === 'true')
    expect(hit.map((s) => s.getAttribute('data-seat'))).toEqual(['toimen'])
    expect(q(t.root, 'wareme-mark')).toBeTruthy()
  })

  test('hides results and marks dice as rolling while rolling', () => {
    const t = mountTestApp([2, 3])
    click(t.root, 'roll-button')
    expect(q(t.root, 'die-0').classList.contains('die--rolling')).toBe(true)
    expect(t.root.querySelector('[data-testid="wall-message"]')).toBeNull()
    expect(q(t.root, 'roll-button').getAttribute('aria-disabled')).toBe('true')
    t.scheduler.flush()
    expect(q(t.root, 'die-0').classList.contains('die--rolling')).toBe(false)
  })

  test('tapping the dice also rolls', () => {
    const t = mountTestApp([0, 0])
    click(t.root, 'dice-stage')
    t.scheduler.flush()
    expect(q(t.root, 'total').textContent).toBe('二（2）')
  })

  test('E-2: 3 players shows a three-way table without toimen', () => {
    const t = mountTestApp([2, 2])
    click(t.root, 'players-3')
    const diagram = q(t.root, 'table-diagram')
    expect(diagram.getAttribute('data-players')).toBe('3')
    expect(all(diagram, 'seat').map((s) => s.getAttribute('data-seat'))).toEqual([
      'self',
      'shimocha',
      'kamicha',
    ])
    expect(diagram.textContent).not.toContain('北')
    expect(q(t.root, 'players-3').getAttribute('aria-pressed')).toBe('true')
    rollOnce(t)
    expect(q(t.root, 'seat-label').textContent).toBe('上家の山')
  })

  test('E-4: hides wareme when turned off in settings', () => {
    const t = mountTestApp([2, 3], {
      settings: { players: 4, soundOn: false, waremeVisible: false },
    })
    rollOnce(t)
    expect(t.root.querySelector('[data-testid="wareme-message"]')).toBeNull()
    expect(t.root.querySelector('[data-testid="wareme-mark"]')).toBeNull()
    expect(q(t.root, 'wall-message')).toBeTruthy()
  })

  test('renders 1 pip in red and others in black', () => {
    const t = mountTestApp([0, 1])
    rollOnce(t)
    const redPips = q(t.root, 'die-0').querySelectorAll('.pip--red')
    expect(redPips).toHaveLength(1)
    expect(q(t.root, 'die-1').querySelectorAll('.pip')).toHaveLength(2)
    expect(q(t.root, 'die-1').querySelectorAll('.pip--red')).toHaveLength(0)
  })

  test('renders every face with the right pip count', () => {
    const t = mountTestApp([0, 1, 2, 3, 4, 5])
    const counts: number[] = []
    for (let i = 0; i < 3; i += 1) {
      rollOnce(t)
      counts.push(q(t.root, 'die-0').querySelectorAll('.pip').length)
      counts.push(q(t.root, 'die-1').querySelectorAll('.pip').length)
    }
    expect(counts).toEqual([1, 2, 3, 4, 5, 6])
  })

  test('keeps keyboard focus on the roll button after re-render', () => {
    const t = mountTestApp([0, 0])
    document.body.append(t.root)
    q(t.root, 'roll-button').focus()
    click(t.root, 'roll-button')
    expect(document.activeElement).toBe(q(t.root, 'roll-button'))
  })

  test('plays a sound on roll only when sound is on', () => {
    const quiet = mountTestApp([0, 0])
    click(quiet.root, 'roll-button')
    expect(quiet.playSound).not.toHaveBeenCalled()
    const loud = mountTestApp([0, 0], {
      settings: { players: 4, soundOn: true, waremeVisible: true },
    })
    click(loud.root, 'roll-button')
    expect(loud.playSound).toHaveBeenCalledTimes(1)
  })

  test('requests a wake lock on start', () => {
    const t = mountTestApp([])
    expect(t.acquireWakeLock).toHaveBeenCalled()
  })

  test('E-10: with zero duration the result appears immediately and nothing animates', () => {
    const t = mountTestApp([2, 3], { rollDurationMs: () => 0 })
    click(t.root, 'roll-button')
    expect(q(t.root, 'total').textContent).toBe('七（7）')
    expect(q(t.root, 'die-0').classList.contains('die--rolling')).toBe(false)
  })
})

describe('dealer screen', () => {
  test('E-5: rolls once, shows the dealer, and can re-roll', () => {
    // Arrange: total 6 (shimocha), then total 3 (toimen)
    const t = mountTestApp([2, 2, 0, 1])
    click(t.root, 'nav-dealer')
    // Act + Assert
    click(t.root, 'roll-button')
    t.scheduler.flush()
    expect(q(t.root, 'dealer-result').textContent).toBe('起家: 下家')
    expect(q(t.root, 'total').textContent).toBe('六（6）')
    expect(q(t.root, 'roll-button').textContent).toBe('振り直す')
    click(t.root, 'roll-button')
    t.scheduler.flush()
    expect(q(t.root, 'dealer-result').textContent).toBe('起家: 対面')
  })

  test('uses the 3-player table when 3 players is selected', () => {
    const t = mountTestApp([2, 2], {
      settings: { players: 3, soundOn: false, waremeVisible: true },
    })
    click(t.root, 'nav-dealer')
    click(t.root, 'roll-button')
    t.scheduler.flush()
    expect(q(t.root, 'dealer-result').textContent).toBe('起家: 上家')
    expect(q(t.root, 'table-diagram').getAttribute('data-players')).toBe('3')
  })
})

describe('settings screen', () => {
  test('toggles sound and wareme and persists them', () => {
    const t = mountTestApp([])
    click(t.root, 'nav-settings')
    click(t.root, 'toggle-sound')
    click(t.root, 'toggle-wareme')
    expect(t.saved.at(-1)).toEqual({ players: 4, soundOn: true, waremeVisible: false })
    expect(q<HTMLInputElement>(t.root, 'toggle-sound').checked).toBe(true)
    expect(q<HTMLInputElement>(t.root, 'toggle-wareme').checked).toBe(false)
  })

  test('shows an empty message when there is no history', () => {
    const t = mountTestApp([])
    click(t.root, 'nav-settings')
    expect(q(t.root, 'history-empty').textContent).toBe('まだ履歴はありません')
  })

  test('E-6: lists rolls newest first with time, dice, total and seat', () => {
    // Arrange: totals 2, 3, 4, 5, 6
    const t = mountTestApp([0, 0, 0, 1, 1, 1, 1, 2, 2, 2])
    for (let i = 0; i < 5; i += 1) rollOnce(t)
    // Act
    click(t.root, 'nav-settings')
    // Assert
    const items = all(t.root, 'history-item')
    expect(items).toHaveLength(5)
    expect(items.map((li) => li.getAttribute('data-total'))).toEqual(['6', '5', '4', '3', '2'])
    expect(items[0]?.textContent).toContain('09:05:07')
    expect(items[0]?.textContent).toContain('六（6）')
    expect(items[0]?.textContent).toContain('下家')
  })
})

describe('navigation', () => {
  test('marks the current tab and slides the new screen in the right direction', () => {
    const t = mountTestApp([])
    click(t.root, 'nav-dealer')
    expect(q(t.root, 'nav-dealer').getAttribute('aria-current')).toBe('page')
    expect(q(t.root, 'screen').classList.contains('screen--from-right')).toBe(true)
    click(t.root, 'nav-main')
    expect(q(t.root, 'screen').classList.contains('screen--from-left')).toBe(true)
  })

  test('does not replay the slide when state changes within a screen', () => {
    const t = mountTestApp([0, 0])
    click(t.root, 'nav-dealer')
    click(t.root, 'roll-button')
    expect(q(t.root, 'screen').classList.contains('screen--from-right')).toBe(false)
  })
})

describe('update prompt', () => {
  test('E: shows a banner and calls the handler on accept', () => {
    const t = mountTestApp([])
    const onAccept = vi.fn()
    expect(t.root.querySelector('[data-testid="update-banner"]')).toBeNull()
    t.app.showUpdatePrompt(onAccept)
    expect(q(t.root, 'update-banner').textContent).toContain('新しい版があります')
    click(t.root, 'update-button')
    expect(onAccept).toHaveBeenCalledTimes(1)
  })

  test('the banner survives re-renders and can be dismissed', () => {
    const t = mountTestApp([0, 0])
    t.app.showUpdatePrompt(() => undefined)
    click(t.root, 'nav-settings')
    expect(q(t.root, 'update-banner')).toBeTruthy()
    click(t.root, 'update-dismiss')
    expect(t.root.querySelector('[data-testid="update-banner"]')).toBeNull()
  })
})
