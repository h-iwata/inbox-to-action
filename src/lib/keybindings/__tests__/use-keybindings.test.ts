import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { clearHandlers } from '@/lib/keybindings/registry'
import { useCommandHandler } from '@/lib/keybindings/use-command-handler'
import { useKeybindings } from '@/lib/keybindings/use-keybindings'
import { useUIStore } from '@/store/uiStore'

/** window に keydown を投げる。tinykeys が無視しない要素を target にする。 */
const pressKey = (key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { key, code: key, bubbles: true, ...init })
  window.dispatchEvent(event)
  return event
}

const setDesktop = (width = 1024) => {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
}

describe('useKeybindings', () => {
  let handler: Mock<() => void>

  beforeEach(() => {
    clearHandlers()
    setDesktop()
    useUIStore.setState({ currentMode: 'classify', scrollToCategory: null })
    handler = vi.fn<() => void>()
  })

  afterEach(() => {
    clearHandlers()
  })

  it('default: スコープが一致するコマンドが発火する', () => {
    renderHook(() => {
      useKeybindings()
      useCommandHandler('classify.work', handler)
    })

    pressKey('a')
    expect(handler).toHaveBeenCalledOnce()
  })

  it('global のコマンドはどのモードでも発火する', () => {
    renderHook(() => {
      useKeybindings()
      useCommandHandler('mode.next', handler)
    })

    pressKey('Tab')
    expect(handler).toHaveBeenCalledOnce()
  })

  context('with 別モードのコマンド', () => {
    it('発火しない', () => {
      renderHook(() => {
        useKeybindings()
        useCommandHandler('execute.complete', handler)
      })

      pressKey('Space')
      expect(handler).not.toHaveBeenCalled()
    })
  })

  context('with ハンドラが登録されていないコマンド', () => {
    it('何も起きない（例外を投げない）', () => {
      renderHook(() => {
        useKeybindings()
      })

      expect(() => pressKey('a')).not.toThrow()
    })
  })

  context('with モバイル幅', () => {
    beforeEach(() => {
      setDesktop(500)
    })

    it('一切バインドしない', () => {
      renderHook(() => {
        useKeybindings()
        useCommandHandler('classify.work', handler)
      })

      pressKey('a')
      expect(handler).not.toHaveBeenCalled()
    })
  })

  context('when モードが変わる', () => {
    it('新しいモードのコマンドが発火するようになる', () => {
      renderHook(() => {
        useKeybindings()
        useCommandHandler('execute.complete', handler)
      })

      pressKey('Space')
      expect(handler).not.toHaveBeenCalled()

      // モード変更による再バインドを待つ
      act(() => {
        useUIStore.setState({ currentMode: 'execute' })
      })
      pressKey('Space')
      expect(handler).toHaveBeenCalledOnce()
    })
  })

  context('when アンマウントされる', () => {
    it('バインドが外れる', () => {
      const { unmount } = renderHook(() => {
        useKeybindings()
        useCommandHandler('classify.work', handler)
      })

      unmount()
      pressKey('a')
      expect(handler).not.toHaveBeenCalled()
    })
  })

  it('矢印キーでも同じコマンドが発火する', () => {
    renderHook(() => {
      useKeybindings()
      useCommandHandler('classify.work', handler)
    })

    pressKey('ArrowLeft')
    expect(handler).toHaveBeenCalledOnce()
  })
})

describe('useCommandHandler', () => {
  let handler: Mock<() => void>

  beforeEach(() => {
    clearHandlers()
    setDesktop()
    useUIStore.setState({ currentMode: 'classify', scrollToCategory: null })
    handler = vi.fn<() => void>()
  })

  afterEach(() => {
    clearHandlers()
  })

  it('default: 毎レンダリングで関数を作り直しても最新が呼ばれる', () => {
    const first = vi.fn<() => void>()
    const second = vi.fn<() => void>()
    let current = first

    const { rerender } = renderHook(() => {
      useKeybindings()
      useCommandHandler('classify.work', () => current())
    })

    pressKey('a')
    expect(first).toHaveBeenCalledOnce()

    current = second
    rerender()
    pressKey('a')
    expect(second).toHaveBeenCalledOnce()
    expect(first).toHaveBeenCalledOnce()
  })

  context('when アンマウントされる', () => {
    it('ハンドラが解除される', () => {
      const { unmount } = renderHook(() => useCommandHandler('classify.work', handler))
      unmount()

      renderHook(() => useKeybindings())
      pressKey('a')
      expect(handler).not.toHaveBeenCalled()
    })
  })
})
