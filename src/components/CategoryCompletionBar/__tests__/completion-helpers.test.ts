import { beforeEach, describe, expect, it } from 'vitest'
import { barStyleClasses, summarizeCompletion } from '@/components/CategoryCompletionBar/completion-helpers'
import type { CategoryRecord } from '@/store/slices/tasksSlice'

describe('summarizeCompletion', () => {
  let completed: CategoryRecord<number>
  const subject = () => summarizeCompletion(completed)

  // 偏りのある内訳を default にする（合計6件、work が最多）
  beforeEach(() => {
    completed = { work: 3, life: 2, study: 1, hobby: 0 }
  })

  it('default: 合計と最多カテゴリを集計する', () => {
    const { total, maxCategory } = subject()
    expect(total).toBe(6)
    expect(maxCategory).toBe('work')
  })

  it('割合の合計は100%', () => {
    const sum = Object.values(subject().percentages).reduce((acc, value) => acc + value, 0)
    expect(sum).toBeCloseTo(100)
  })

  it('同じ入力なら同じメッセージ（再レンダリングで踊らない）', () =>
    expect(subject().message).toBe(subject().message))

  describe('レベル', () => {
    const levelOf = (total: number) => summarizeCompletion({ work: total, life: 0, study: 0, hobby: 0 }).level

    it('default: 3件で1レベル', () => expect(levelOf(3)).toBe(1))
    it('0件はレベル0', () => expect(levelOf(0)).toBe(0))
    it('2件はまだレベル0', () => expect(levelOf(2)).toBe(0))
    it('15件で最大レベル', () => expect(levelOf(15)).toBe(5))

    context('with 最大レベルを超える件数', () => {
      it('5で頭打ち', () => expect(levelOf(99)).toBe(5))
    })
  })

  describe('次のレベルまでの必要数', () => {
    const requirementOf = (total: number) =>
      summarizeCompletion({ work: total, life: 0, study: 0, hobby: 0 }).nextLevelRequirement

    it('default: 1件なら残り2件', () => expect(requirementOf(1)).toBe(2))
    it('0件なら残り3件', () => expect(requirementOf(0)).toBe(3))

    context('with 最大レベル到達済み', () => {
      it('0', () => expect(requirementOf(15)).toBe(0))
    })
  })

  describe('メッセージの選択', () => {
    const messageOf = (input: CategoryRecord<number>) => summarizeCompletion(input).message

    context('with 完了なし', () => {
      it('開始を促す文言になる', () => {
        const message = messageOf({ work: 0, life: 0, study: 0, hobby: 0 })
        expect(message).toBeTruthy()
        // starting のメッセージは balanced とは別物であることだけ確認する
        expect(message).not.toBe(messageOf({ work: 1, life: 1, study: 1, hobby: 1 }))
      })
    })

    context('with 均等に分散', () => {
      it('偏り時とは別のメッセージになる', () => {
        const balanced = messageOf({ work: 1, life: 1, study: 1, hobby: 1 })
        const focused = messageOf({ work: 4, life: 0, study: 0, hobby: 0 })
        expect(balanced).not.toBe(focused)
      })
    })
  })
})

describe('barStyleClasses', () => {
  it('default: レベル0は最小の高さ', () => expect(barStyleClasses(0)).toContain('h-2'))

  context('with 最大レベル', () => {
    it('最大の高さと強い装飾', () => {
      const classes = barStyleClasses(5)
      expect(classes).toContain('h-5')
      expect(classes).toContain('animate-glow')
    })
  })

  it('どのレベルでも共通クラスを含む', () => {
    for (let level = 0; level <= 5; level++) {
      expect(barStyleClasses(level)).toContain('rounded-full')
    }
  })
})
