import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrateLegacyStorage } from '@/store/migrateLegacyStorage'

const LEGACY_KEY = 'persist:root'
const NEW_KEY = 'inbox-to-action/tasks'

/** redux-persist の保存形式（スライスごとに値が JSON 文字列で二重にエンコードされる）を組み立てる。 */
const legacyPayload = (tasks: unknown) =>
  JSON.stringify({ tasks: JSON.stringify(tasks), _persist: JSON.stringify({ version: -1, rehydrated: true }) })

describe('migrateLegacyStorage', () => {
  let tasks: { lists: Record<string, unknown[]>; completed: unknown[]; dailyStats: Record<string, number> }
  const subject = () => {
    migrateLegacyStorage(NEW_KEY)
    return { migrated: localStorage.getItem(NEW_KEY), legacyLeft: localStorage.getItem(LEGACY_KEY) }
  }

  beforeEach(() => {
    localStorage.clear()
    tasks = {
      lists: { inbox: [{ title: '旧データ' }], work: [], life: [], study: [], hobby: [] },
      completed: [],
      dailyStats: { created: 1, classified: 0, completed: 0 },
    }
    localStorage.setItem(LEGACY_KEY, legacyPayload(tasks))
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('default: 旧データを新形式へ移し、旧キーを片付ける', () => {
    const { migrated, legacyLeft } = subject()
    expect(JSON.parse(migrated ?? '{}')).toEqual({ state: tasks, version: 0 })
    expect(legacyLeft).toBeNull()
  })

  context('with 旧データがない', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('何もしない', () => expect(subject().migrated).toBeNull())
  })

  context('with 新形式が既にある', () => {
    beforeEach(() => {
      localStorage.setItem(NEW_KEY, JSON.stringify({ state: { lists: {} }, version: 0 }))
    })

    it('上書きせず、旧キーだけ片付ける', () => {
      const { migrated, legacyLeft } = subject()
      expect(JSON.parse(migrated ?? '{}').state).toEqual({ lists: {} })
      expect(legacyLeft).toBeNull()
    })
  })

  context('with 旧データが壊れている', () => {
    beforeEach(() => {
      localStorage.setItem(LEGACY_KEY, 'not-json')
    })

    it('例外を投げずに諦め、旧キーを片付ける', () => {
      const { migrated, legacyLeft } = subject()
      expect(migrated).toBeNull()
      expect(legacyLeft).toBeNull()
    })
  })

  context('with 旧データが JSON だがオブジェクトでない', () => {
    beforeEach(() => {
      localStorage.setItem(LEGACY_KEY, '123')
    })

    it('何も書き込まない', () => expect(subject().migrated).toBeNull())
  })

  context('with 旧データが null', () => {
    beforeEach(() => {
      localStorage.setItem(LEGACY_KEY, 'null')
    })

    it('何も書き込まない', () => expect(subject().migrated).toBeNull())
  })

  context('with tasks スライスがない', () => {
    beforeEach(() => {
      localStorage.setItem(LEGACY_KEY, JSON.stringify({ _persist: '{}' }))
    })

    it('何も書き込まない', () => expect(subject().migrated).toBeNull())
  })
})
