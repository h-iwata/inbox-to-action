import { beforeEach, describe, expect, it } from 'vitest'
import { operationHint } from '@/app-helpers'
import type { AppMode } from '@/store/slices/uiSlice'

describe('operationHint', () => {
  let mode: AppMode
  let isMobile: boolean
  let hasInboxTasks: boolean
  const subject = () => operationHint(mode, isMobile, hasInboxTasks)

  beforeEach(() => {
    mode = 'classify'
    isMobile = false
    hasInboxTasks = true
  })

  it('default: 分類モードはキー操作を案内する', () => expect(subject()).toContain('W/↑'))

  context('with モバイル', () => {
    beforeEach(() => {
      isMobile = true
    })

    it('タップ操作を案内する', () => expect(subject()).toContain('タップ'))
  })

  context('with Inbox が空', () => {
    beforeEach(() => {
      hasInboxTasks = false
    })

    it('分類ではなくモード切替を案内する', () => expect(subject()).toBe(operationHint('create', false, false)))
  })

  context('with Inbox が空かつモバイル', () => {
    beforeEach(() => {
      hasInboxTasks = false
      isMobile = true
    })

    it('モバイル向けのモード切替案内になる', () => expect(subject()).toBe(operationHint('create', true, false)))
  })

  describe('モードごとの文言', () => {
    const modes: AppMode[] = ['create', 'classify', 'list', 'execute']

    it('デスクトップは全モードで異なる', () => {
      const hints = modes.map(m => operationHint(m, false, true))
      expect(new Set(hints).size).toBe(modes.length)
    })

    it('モバイルは全モードで文言がある', () => {
      for (const m of modes) {
        expect(operationHint(m, true, true)).toBeTruthy()
      }
    })
  })
})
