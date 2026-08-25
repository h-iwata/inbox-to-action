import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { sendEvent, sendPageView, trackLevelUp, trackModeChange, trackTaskEvent } from '@/utils/analytics'

/**
 * Google Analytics 送信の検証。
 *
 * localhost とプライベートIPでは送信しないのが仕様なので、
 * 「送る条件」と「送らない条件」の両方を hostname を差し替えて確認する。
 */
const setHostname = (hostname: string) => {
  Object.defineProperty(window, 'location', { value: { hostname }, configurable: true, writable: true })
}

describe('analytics', () => {
  let gtag: Mock<(...args: unknown[]) => void>
  const originalLocation = window.location

  beforeEach(() => {
    gtag = vi.fn<(...args: unknown[]) => void>()
    window.gtag = gtag
    setHostname('inbox-to-action.vercel.app')
  })

  afterEach(() => {
    window.gtag = undefined
    Object.defineProperty(window, 'location', { value: originalLocation, configurable: true, writable: true })
  })

  describe('送信しない条件', () => {
    const doesNotSend = (hostname: string) => {
      setHostname(hostname)
      sendEvent('action', 'category')
      return gtag.mock.calls.length === 0
    }

    it('default: localhost では送らない', () => expect(doesNotSend('localhost')).toBe(true))
    it('127.0.0.1 では送らない', () => expect(doesNotSend('127.0.0.1')).toBe(true))
    it('192.168 系では送らない', () => expect(doesNotSend('192.168.1.5')).toBe(true))
    it('10 系では送らない', () => expect(doesNotSend('10.0.1.2')).toBe(true))

    context('with gtag が読み込まれていない', () => {
      beforeEach(() => {
        window.gtag = undefined
      })

      it('送らない（例外も投げない）', () => expect(() => sendEvent('action', 'category')).not.toThrow())
    })
  })

  describe('sendEvent', () => {
    it('default: 本番ホストなら gtag に渡す', () => {
      sendEvent('task_create', 'Task', 'work', 3)
      expect(gtag).toHaveBeenCalledWith('event', 'task_create', {
        event_category: 'Task',
        event_label: 'work',
        value: 3,
      })
    })

    context('with label と value を省略', () => {
      it('undefined のまま渡る', () => {
        sendEvent('mode_change', 'Navigation')
        expect(gtag).toHaveBeenCalledWith('event', 'mode_change', {
          event_category: 'Navigation',
          event_label: undefined,
          value: undefined,
        })
      })
    })
  })

  describe('sendPageView', () => {
    it('default: config として送る', () => {
      sendPageView('/list')
      expect(gtag).toHaveBeenCalledWith('config', expect.any(String), { page_path: '/list' })
    })

    context('with localhost', () => {
      beforeEach(() => {
        setHostname('localhost')
      })

      it('送らない', () => {
        sendPageView('/list')
        expect(gtag).not.toHaveBeenCalled()
      })
    })
  })

  describe('trackTaskEvent', () => {
    it('default: task_ 接頭辞のイベントになる', () => {
      trackTaskEvent('create', 'work')
      expect(gtag).toHaveBeenCalledWith('event', 'task_create', expect.objectContaining({ event_label: 'work' }))
    })

    context('with カテゴリ省略', () => {
      it('label なしで送る', () => {
        trackTaskEvent('delete')
        expect(gtag).toHaveBeenCalledWith('event', 'task_delete', expect.objectContaining({ event_label: undefined }))
      })
    })
  })

  describe('trackModeChange', () => {
    it('default: Navigation カテゴリで送る', () => {
      trackModeChange('execute')
      expect(gtag).toHaveBeenCalledWith(
        'event',
        'mode_change',
        expect.objectContaining({ event_category: 'Navigation', event_label: 'execute' })
      )
    })
  })

  describe('trackLevelUp', () => {
    it('default: レベルを label と value の両方に入れる', () => {
      trackLevelUp(3)
      expect(gtag).toHaveBeenCalledWith(
        'event',
        'level_up',
        expect.objectContaining({ event_category: 'Achievement', event_label: 'Level 3', value: 3 })
      )
    })
  })
})
