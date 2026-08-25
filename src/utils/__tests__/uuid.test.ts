import { afterEach, describe, expect, it } from 'vitest'
import { generateUUID, isUUID } from '@/utils/uuid'

/** `crypto.randomUUID` を使えない状況（セキュアコンテキスト外）を再現する。 */
const withoutRandomUUID = <T>(fn: () => T): T => {
  const original = crypto.randomUUID
  Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true })
  try {
    return fn()
  } finally {
    Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true })
  }
}

describe('generateUUID', () => {
  afterEach(() => {
    // withoutRandomUUID が finally で戻すので、ここでは何もしない
  })

  it('default: 有効な UUID を返す', () => expect(isUUID(generateUUID())).toBe(true))

  it('毎回異なる値になる', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateUUID()))
    expect(ids.size).toBe(100)
  })

  context('with crypto.randomUUID が使えない（LAN の IP 経由など）', () => {
    it('フォールバックでも有効な UUID を返す', () => withoutRandomUUID(() => expect(isUUID(generateUUID())).toBe(true)))

    it('version 4 になっている', () => withoutRandomUUID(() => expect(generateUUID()[14]).toBe('4')))

    it('variant が正しい', () => withoutRandomUUID(() => expect('89ab').toContain(generateUUID()[19])))

    it('毎回異なる値になる', () =>
      withoutRandomUUID(() => {
        const ids = new Set(Array.from({ length: 100 }, () => generateUUID()))
        expect(ids.size).toBe(100)
      }))
  })
})

describe('isUUID', () => {
  it('default: v4 の UUID を受け入れる', () => expect(isUUID('9a8b7c6d-1234-4abc-89de-0123456789ab')).toBe(true))

  describe('特殊な UUID', () => {
    it('nil UUID を受け入れる', () => expect(isUUID('00000000-0000-0000-0000-000000000000')).toBe(true))
    it('max UUID を受け入れる', () => expect(isUUID('ffffffff-ffff-ffff-ffff-ffffffffffff')).toBe(true))
  })

  describe('不正な値', () => {
    it('UUID でない文字列を拒否', () => expect(isUUID('not-a-uuid')).toBe(false))
    it('未知のバージョンを拒否', () => expect(isUUID('9a8b7c6d-1234-9abc-89de-0123456789ab')).toBe(false))
    it('不正な variant を拒否', () => expect(isUUID('9a8b7c6d-1234-4abc-c9de-0123456789ab')).toBe(false))
    it('数値を拒否', () => expect(isUUID(123)).toBe(false))
    it('null を拒否', () => expect(isUUID(null)).toBe(false))
    it('undefined を拒否', () => expect(isUUID(undefined)).toBe(false))
    it('オブジェクトを拒否', () => expect(isUUID({})).toBe(false))
  })
})
