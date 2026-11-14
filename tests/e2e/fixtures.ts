import { expect, type Locator, type Page } from '@playwright/test'

export type DicePair = readonly [number, number]

/** 乱数を固定する。1 回振るごとに 2 個分（目 - 1）を順に返し、尽きたら本物の乱数に戻す。 */
export async function seedDice(page: Page, rolls: readonly DicePair[]): Promise<void> {
  const values = rolls.flatMap(([a, b]) => [a - 1, b - 1])
  await page.addInitScript((seeded: number[]) => {
    let index = 0
    const original = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = ((array: ArrayBufferView) => {
      const isSingleUint32 = array instanceof Uint32Array && array.length === 1
      const value = seeded[index]
      if (isSingleUint32 && value !== undefined) {
        index += 1
        ;(array as Uint32Array)[0] = value
        return array
      }
      return original(array as Uint32Array)
    }) as typeof crypto.getRandomValues
  }, values)
}

export const byId = (page: Page, testId: string): Locator => page.getByTestId(testId)

/** 振って、結果が出る（アニメーションが終わる）まで待つ。 */
export async function rollAndWait(page: Page): Promise<void> {
  await byId(page, 'roll-button').click()
  await expect(byId(page, 'roll-button')).toHaveAttribute('aria-disabled', 'false')
}
