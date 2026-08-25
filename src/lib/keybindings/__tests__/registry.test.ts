import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { clearHandlers, getHandler, registerHandler, unregisterHandler } from '@/lib/keybindings/registry'
import type { CommandHandler } from '@/lib/keybindings/types'

describe('registry', () => {
  let handler: Mock<CommandHandler>

  beforeEach(() => {
    handler = vi.fn<CommandHandler>()
    registerHandler('mode.next', handler)
  })

  afterEach(() => {
    clearHandlers()
  })

  it('default: 登録したハンドラを引ける', () => expect(getHandler('mode.next')).toBe(handler))

  context('with 未登録のID', () => {
    it('undefined', () => expect(getHandler('execute.complete')).toBeUndefined())
  })

  context('when 同じIDで再登録する', () => {
    let replacement: Mock<CommandHandler>

    beforeEach(() => {
      replacement = vi.fn<CommandHandler>()
      registerHandler('mode.next', replacement)
    })

    it('後勝ち', () => expect(getHandler('mode.next')).toBe(replacement))
  })

  context('when 解除する', () => {
    beforeEach(() => {
      unregisterHandler('mode.next')
    })

    it('引けなくなる', () => expect(getHandler('mode.next')).toBeUndefined())
  })
})
