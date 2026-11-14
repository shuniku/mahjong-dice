const KANJI_NUMERALS: Readonly<Record<number, string>> = {
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '七',
  8: '八',
  9: '九',
  10: '十',
  11: '十一',
  12: '十二',
}

export function toKanji(total: number): string {
  const kanji = KANJI_NUMERALS[total]
  if (kanji === undefined) {
    throw new RangeError(`total must be an integer from 2 to 12: ${total}`)
  }
  return kanji
}

/** 漢数字と算用数字の併記。例: 「七（7）」 */
export function formatTotal(total: number): string {
  return `${toKanji(total)}（${total}）`
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/** 端末のローカル時刻を HH:MM:SS で返す。 */
export function formatTime(ms: number): string {
  const date = new Date(ms)
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}
