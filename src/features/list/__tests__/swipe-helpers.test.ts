import { describe, expect, it } from 'vitest'
import {
  clampSwipeOffset,
  detectSwipeDirection,
  isSwipeVisible,
  isTap,
  resolveSwipeAction,
  swipeProgress,
} from '../swipe-helpers'

describe('clampSwipeOffset', () => {
  it('default: 範囲内はそのまま', () => expect(clampSwipeOffset(50)).toBe(50))

  context('with 上限を超える', () => {
    it('80 で頭打ち', () => expect(clampSwipeOffset(200)).toBe(80))
  })

  context('with 下限を超える', () => {
    it('-80 で頭打ち', () => expect(clampSwipeOffset(-200)).toBe(-80))
  })
})

describe('detectSwipeDirection', () => {
  it('default: 右向き', () => expect(detectSwipeDirection(30)).toBe('right'))

  context('with 左向き', () => {
    it('left', () => expect(detectSwipeDirection(-30)).toBe('left'))
  })

  context('with しきい値ちょうど（5px）', () => {
    it('未確定', () => expect(detectSwipeDirection(5)).toBeNull())
  })

  context('with しきい値を1px超える', () => {
    it('確定する', () => expect(detectSwipeDirection(6)).toBe('right'))
  })
})

describe('resolveSwipeAction', () => {
  it('default: 左に十分引けば Inbox 送り', () => expect(resolveSwipeAction(-70, 'left')).toBe('moveToInbox'))

  context('with 右に十分引く', () => {
    it('削除', () => expect(resolveSwipeAction(70, 'right')).toBe('delete'))
  })

  context('with しきい値ちょうど（60px）', () => {
    it('何もしない', () => expect(resolveSwipeAction(-60, 'left')).toBeNull())
  })

  context('with 向きが未確定', () => {
    it('何もしない', () => expect(resolveSwipeAction(-100, null)).toBeNull())
  })
})

describe('isTap', () => {
  it('default: ほぼ動いていなければタップ', () => expect(isTap(5)).toBe(true))

  context('with しきい値ちょうど（10px）', () => {
    it('タップではない', () => expect(isTap(10)).toBe(false))
  })
})

describe('swipeProgress', () => {
  it('default: 半分引くと 0.5', () => expect(swipeProgress(40)).toBe(0.5))

  context('with 上限まで引く', () => {
    it('1', () => expect(swipeProgress(80)).toBe(1))
  })

  context('with 左方向', () => {
    it('符号によらず正の値', () => expect(swipeProgress(-40)).toBe(0.5))
  })
})

describe('isSwipeVisible', () => {
  it('default: 十分引けば表示', () => expect(isSwipeVisible(20)).toBe(true))

  context('with しきい値ちょうど（10px）', () => {
    it('まだ表示しない', () => expect(isSwipeVisible(10)).toBe(false))
  })
})
