import { describe, expect, it } from 'vitest'
import { formatKey } from '@/lib/keybindings/key-format'

describe('formatKey', () => {
  it('default: 未知のキーはそのまま', () => expect(formatKey('Tab')).toBe('Tab'))

  context('with 矢印キー', () => {
    it('記号に置き換える', () => expect(formatKey('ArrowLeft')).toBe('←'))
  })

  context('with 修飾キー付き', () => {
    it('区切りを空白付きにする', () => expect(formatKey('Shift+Tab')).toBe('Shift + Tab'))
  })

  context('with 修飾キー + 矢印キー', () => {
    it('両方適用', () => expect(formatKey('Shift+ArrowUp')).toBe('Shift + ↑'))
  })
})
