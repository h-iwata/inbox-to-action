import { beforeEach, describe, expect, it } from 'vitest'
import type { Scope, WhenCondition } from '@/lib/keybindings/types'
import { isActiveScope, scopesOf } from '@/lib/keybindings/when'

describe('isActiveScope', () => {
  let when: WhenCondition
  let scopes: Set<Scope>
  const subject = () => isActiveScope(when, scopes)

  beforeEach(() => {
    when = 'classify'
    scopes = new Set<Scope>(['global', 'classify'])
  })

  it('default: 現在のスコープに含まれる', () => expect(subject()).toBe(true))

  context('with when=別モード', () => {
    beforeEach(() => {
      when = 'execute'
    })

    it('無効', () => expect(subject()).toBe(false))
  })

  context('with when=global', () => {
    beforeEach(() => {
      when = 'global'
    })

    it('モードによらず有効', () => expect(subject()).toBe(true))
  })

  context('with when が配列', () => {
    beforeEach(() => {
      when = ['list', 'classify']
    })

    it('いずれか一致すれば有効', () => expect(subject()).toBe(true))
  })

  context('with when が配列でどれも一致しない', () => {
    beforeEach(() => {
      when = ['list', 'execute']
    })

    it('無効', () => expect(subject()).toBe(false))
  })

  context('with 空のスコープ集合', () => {
    beforeEach(() => {
      scopes = new Set<Scope>()
    })

    it('無効', () => expect(subject()).toBe(false))
  })
})

describe('scopesOf', () => {
  it('default: 単一スコープを配列にする', () => expect(scopesOf('classify')).toEqual(['classify']))

  context('with 配列', () => {
    it('そのまま', () => expect(scopesOf(['global', 'list'])).toEqual(['global', 'list']))
  })
})
