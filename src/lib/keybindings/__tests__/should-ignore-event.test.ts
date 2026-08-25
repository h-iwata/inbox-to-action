import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { shouldIgnoreEvent } from '@/lib/keybindings/use-keybindings'

/** 指定した要素を event.target に持つ keydown イベントを作る。 */
const keydownFrom = (target: Element, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { key: 'Tab', ...init })
  Object.defineProperty(event, 'target', { value: target, configurable: true })
  Object.defineProperty(event, 'currentTarget', { value: window, configurable: true })
  return event
}

describe('shouldIgnoreEvent', () => {
  let target: Element
  const subject = () => shouldIgnoreEvent(keydownFrom(target))

  beforeEach(() => {
    target = document.createElement('div')
    document.body.appendChild(target)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('default: 通常の要素からのイベントは処理する', () => expect(subject()).toBe(false))

  context('with ダイアログ内の要素', () => {
    beforeEach(() => {
      const dialog = document.createElement('div')
      dialog.setAttribute('role', 'dialog')
      dialog.appendChild(target)
      document.body.appendChild(dialog)
    })

    it('無視する', () => expect(subject()).toBe(true))
  })

  context('with ダイアログ要素そのもの', () => {
    beforeEach(() => {
      target.setAttribute('role', 'dialog')
    })

    it('無視する', () => expect(subject()).toBe(true))
  })

  context('with input 要素', () => {
    beforeEach(() => {
      target = document.createElement('input')
      document.body.appendChild(target)
    })

    it('無視する（tinykeys の既定動作）', () => expect(subject()).toBe(true))
  })

  context('with textarea 要素', () => {
    beforeEach(() => {
      target = document.createElement('textarea')
      document.body.appendChild(target)
    })

    it('無視する', () => expect(subject()).toBe(true))
  })

  context('when IME 変換中', () => {
    it('無視する', () => expect(shouldIgnoreEvent(keydownFrom(target, { isComposing: true }))).toBe(true))
  })

  context('when キーリピート中', () => {
    it('無視する', () => expect(shouldIgnoreEvent(keydownFrom(target, { repeat: true }))).toBe(true))
  })
})
