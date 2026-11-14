import { expect, test } from '@playwright/test'
import { byId, rollAndWait, seedDice } from './fixtures'

test.describe('main flow', () => {
  test('E-1: open and roll shows dice, total, seat, wall start and wareme', async ({ page }) => {
    await seedDice(page, [[3, 4]])
    await page.goto('/')
    await rollAndWait(page)

    await expect(byId(page, 'die-0')).toHaveAttribute('data-face', '3')
    await expect(byId(page, 'die-1')).toHaveAttribute('data-face', '4')
    await expect(byId(page, 'total')).toHaveText('七（7）')
    await expect(byId(page, 'seat-label')).toHaveText('対面の山')
    await expect(byId(page, 'wall-message')).toHaveText('対面の山を右から 7 幢残して取り始める')
    await expect(byId(page, 'wareme-message')).toContainText(
      '割れ目: 対面（点数の受け払いが 2 倍）',
    )
    await expect(page.locator('[data-testid="seat"][data-hit="true"]')).toHaveAttribute(
      'data-seat',
      'toimen',
    )
  })

  test('tapping the dice rolls too, and the dice animate while rolling', async ({ page }) => {
    await seedDice(page, [[1, 1]])
    await page.goto('/')
    await byId(page, 'dice-stage').click()
    await expect(byId(page, 'die-0')).toHaveClass(/die--rolling/)
    await expect(byId(page, 'total')).toHaveText('二（2）')
  })

  test('E-2: 3 players shows a three-way table and never toimen', async ({ page }) => {
    await seedDice(page, [[3, 3]])
    await page.goto('/')
    await byId(page, 'players-3').click()
    await expect(byId(page, 'table-diagram')).toHaveAttribute('data-players', '3')
    await expect(page.locator('[data-testid="seat"][data-seat="toimen"]')).toHaveCount(0)
    await rollAndWait(page)
    await expect(byId(page, 'seat-label')).toHaveText('上家の山')
  })

  test('E-3: 3 players survives a reload', async ({ page }) => {
    await page.goto('/')
    await byId(page, 'players-3').click()
    await page.reload()
    await expect(byId(page, 'players-3')).toHaveAttribute('aria-pressed', 'true')
    await expect(byId(page, 'table-diagram')).toHaveAttribute('data-players', '3')
  })

  test('E-4: turning wareme off hides it', async ({ page }) => {
    await seedDice(page, [[3, 4]])
    await page.goto('/')
    await byId(page, 'nav-settings').click()
    await byId(page, 'toggle-wareme').uncheck()
    await byId(page, 'nav-main').click()
    await rollAndWait(page)
    await expect(byId(page, 'wall-message')).toBeVisible()
    await expect(byId(page, 'wareme-message')).toHaveCount(0)
    await expect(byId(page, 'wareme-mark')).toHaveCount(0)
  })

  test('E-5: dealer screen shows the dealer and can re-roll', async ({ page }) => {
    await seedDice(page, [
      [3, 3],
      [1, 2],
    ])
    await page.goto('/')
    await byId(page, 'nav-dealer').click()
    await rollAndWait(page)
    await expect(byId(page, 'dealer-result')).toHaveText('起家: 下家')
    await expect(byId(page, 'roll-button')).toHaveText('振り直す')
    await rollAndWait(page)
    await expect(byId(page, 'dealer-result')).toHaveText('起家: 対面')
  })

  test('E-6: history lists five rolls newest first', async ({ page }) => {
    await seedDice(page, [
      [1, 1],
      [1, 2],
      [2, 2],
      [2, 3],
      [3, 3],
    ])
    await page.goto('/')
    for (let i = 0; i < 5; i += 1) await rollAndWait(page)
    await byId(page, 'nav-settings').click()
    const items = byId(page, 'history-item')
    await expect(items).toHaveCount(5)
    const totals = await items.evaluateAll((els) => els.map((el) => el.getAttribute('data-total')))
    expect(totals).toEqual(['6', '5', '4', '3', '2'])
  })
})

test.describe('platform', () => {
  test('E-7: works offline after the first visit', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Service worker offline check runs on Chromium')
    await seedDice(page, [[2, 3]])
    await page.goto('/')
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload()
    await context.setOffline(true)
    await page.reload()
    await rollAndWait(page)
    await expect(byId(page, 'total')).toHaveText('五（5）')
    await expect(byId(page, 'seat-label')).toHaveText('自家の山')
  })

  test('E-8: makes no requests outside its own origin', async ({ page, baseURL }) => {
    const external: string[] = []
    page.on('request', (request) => {
      const url = request.url()
      const isLocal =
        url.startsWith(baseURL ?? '') || url.startsWith('data:') || url.startsWith('blob:')
      if (!isLocal) external.push(url)
    })
    await page.goto('/')
    await byId(page, 'nav-settings').click()
    await byId(page, 'toggle-sound').check()
    await byId(page, 'nav-main').click()
    await rollAndWait(page)
    await page.reload()
    await page.evaluate(() => document.fonts.ready)
    expect(external).toEqual([])
  })

  test('E-9: manifest has name, icons and portrait orientation', async ({ page, request }) => {
    await page.goto('/')
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1)
    const response = await request.get('/manifest.webmanifest')
    const manifest = await response.json()
    expect(manifest.name).toBe('麻雀サイコロ')
    expect(manifest.orientation).toBe('portrait')
    expect(manifest.display).toBe('standalone')
    const sizes = (manifest.icons as { sizes: string }[]).map((icon) => icon.sizes)
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']))
  })

  test('E-10: reduced motion shows the result with no animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await seedDice(page, [[3, 4]])
    await page.goto('/')
    await byId(page, 'roll-button').click()
    await expect(byId(page, 'total')).toHaveText('七（7）', { timeout: 250 })
    await expect(byId(page, 'die-0')).not.toHaveClass(/die--rolling/)
    await byId(page, 'nav-settings').click()
    const animation = await byId(page, 'screen').evaluate(
      (el) => getComputedStyle(el).animationName,
    )
    expect(animation).toBe('none')
  })

  test('E-11: becomes rollable within 2 seconds on a throttled CPU', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'CPU throttling needs the Chromium DevTools protocol')
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    const startedAt = Date.now()
    await page.goto('/', { waitUntil: 'commit' })
    await expect(byId(page, 'roll-button')).toBeVisible()
    await expect(byId(page, 'roll-button')).toHaveAttribute('aria-disabled', 'false')
    expect(Date.now() - startedAt).toBeLessThan(2000)
  })

  test('bundled Mincho font loads from the app itself', async ({ page }) => {
    await page.goto('/')
    const isLoaded = await page.evaluate(async () => {
      await document.fonts.load('16px "Noto Serif JP Subset"', '麻雀')
      return document.fonts.check('16px "Noto Serif JP Subset"', '麻雀')
    })
    expect(isLoaded).toBe(true)
  })
})
