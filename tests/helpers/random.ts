import type { RandomSource } from '../../src/domain/types'

export interface RecordingSource extends RandomSource {
  readonly calls: () => number
}

/** 決まった値を順に返す偽の乱数源。尽きたら例外を投げる。 */
export function sequenceSource(values: readonly number[]): RecordingSource {
  let index = 0
  return {
    nextUint32: () => {
      const value = values[index]
      if (value === undefined) throw new Error('sequenceSource exhausted')
      index += 1
      return value
    },
    calls: () => index,
  }
}

/** 目 1〜6 を指定して、棄却されない乱数値の列を作る。 */
export function valuesForFaces(faces: readonly number[]): number[] {
  return faces.map((face) => face - 1)
}
