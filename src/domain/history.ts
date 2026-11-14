import type { HistoryEntry } from './types'

export const MAX_HISTORY = 20

/** 新しい順に先頭へ追加し、最大 20 件に切り詰めた新しい配列を返す。 */
export function appendHistory(
  history: readonly HistoryEntry[],
  entry: HistoryEntry,
): readonly HistoryEntry[] {
  return [entry, ...history].slice(0, MAX_HISTORY)
}
