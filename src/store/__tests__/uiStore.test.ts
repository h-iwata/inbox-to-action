import { beforeEach, describe, expect, it } from 'vitest'
import { type AppMode, getNextMode, getPrevMode, MODE_ORDER, useUIStore } from '@/store/uiStore'

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

describe('useUIStore', () => {
  const { actions } = useUIStore.getState()

  beforeEach(() => {
    useUIStore.setState({ currentMode: 'create', scrollToCategory: null })
  })

  it('default: 作成モードで始まる', () => expect(useUIStore.getState().currentMode).toBe('create'))

  it('actions の参照は安定している', () => expect(useUIStore.getState().actions).toBe(actions))

  context('when setMode を呼ぶ', () => {
    it('モードが変わる', () => {
      actions.setMode('execute')
      expect(useUIStore.getState().currentMode).toBe('execute')
    })
  })

  context('when setModeWithScroll を呼ぶ', () => {
    it('モードとスクロール先が同時に変わる', () => {
      actions.setModeWithScroll('list', 'work')
      expect(useUIStore.getState()).toMatchObject({ currentMode: 'list', scrollToCategory: 'work' })
    })

    context('with スクロール先を省略', () => {
      it('scrollToCategory は null になる', () => {
        actions.setModeWithScroll('list')
        expect(useUIStore.getState().scrollToCategory).toBeNull()
      })
    })
  })

  context('when clearScrollToCategory を呼ぶ', () => {
    it('スクロール先が消える', () => {
      actions.setModeWithScroll('list', 'life')
      actions.clearScrollToCategory()
      expect(useUIStore.getState().scrollToCategory).toBeNull()
    })
  })
})
