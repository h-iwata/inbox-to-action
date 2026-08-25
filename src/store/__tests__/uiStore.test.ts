import { beforeEach, describe, expect, it } from 'vitest'
import { type AppMode, getNextMode, getPrevMode, MODE_ORDER } from '@/store/uiStore'

describe('getNextMode', () => {
  let current: AppMode
  const subject = () => getNextMode(current)

  beforeEach(() => {
    current = 'create'
  })

  it('default: 次のモード', () => expect(subject()).toBe('classify'))

  context('with current=末尾のモード', () => {
    beforeEach(() => {
      current = 'execute'
    })

    it('先頭へ循環', () => expect(subject()).toBe('create'))
  })

  it('4回進めると元に戻る', () => {
    const looped = MODE_ORDER.reduce<AppMode>(mode => getNextMode(mode), 'create')
    expect(looped).toBe('create')
  })
})

describe('getPrevMode', () => {
  let current: AppMode
  const subject = () => getPrevMode(current)

  beforeEach(() => {
    current = 'execute'
  })

  it('default: 前のモード', () => expect(subject()).toBe('list'))

  context('with current=先頭のモード', () => {
    beforeEach(() => {
      current = 'create'
    })

    it('末尾へ循環', () => expect(subject()).toBe('execute'))
  })

  it('next の逆になる', () => expect(getPrevMode(getNextMode('list'))).toBe('list'))
})
