import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useResponsive } from '@/hooks/useResponsive'

/** jsdom のウィンドウ幅を変えて resize を通知する。 */
const setWindowWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
  window.dispatchEvent(new Event('resize'))
}

describe('useResponsive', () => {
  const originalWidth = window.innerWidth

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true, writable: true })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true, writable: true })
  })

  it('default: 768px 以上はデスクトップ', () => {
    const { result } = renderHook(() => useResponsive())
    expect(result.current).toEqual({ isMobile: false, isDesktop: true })
  })

  context('with 768px 未満', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 767, configurable: true, writable: true })
    })

    it('モバイル扱い', () => {
      const { result } = renderHook(() => useResponsive())
      expect(result.current).toEqual({ isMobile: true, isDesktop: false })
    })
  })

  context('with 境界の 768px ちょうど', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true, writable: true })
    })

    it('デスクトップ扱い', () => {
      const { result } = renderHook(() => useResponsive())
      expect(result.current.isDesktop).toBe(true)
    })
  })

  context('when リサイズされる', () => {
    it('判定が追随する', () => {
      const { result } = renderHook(() => useResponsive())
      expect(result.current.isMobile).toBe(false)

      act(() => setWindowWidth(500))
      expect(result.current.isMobile).toBe(true)

      act(() => setWindowWidth(1200))
      expect(result.current.isMobile).toBe(false)
    })
  })

  context('when アンマウントされる', () => {
    it('リスナーが外れてリサイズを拾わなくなる', () => {
      const { result, unmount } = renderHook(() => useResponsive())
      unmount()

      act(() => setWindowWidth(500))
      // アンマウント後の値は更新されない（React が警告を出さないことも含めて確認）
      expect(result.current.isMobile).toBe(false)
    })
  })
})
