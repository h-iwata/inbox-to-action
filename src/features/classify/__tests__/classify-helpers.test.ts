import { beforeEach, describe, expect, it } from 'vitest'
import { CATEGORY_BY_DIRECTION, detectDragDirection } from '@/features/classify/classify-helpers'

describe('detectDragDirection', () => {
  let deltaX: number
  let deltaY: number
  const subject = () => detectDragDirection(deltaX, deltaY)

  // 画面座標系（下が正）。真上に大きく引いた状態を default にする
  beforeEach(() => {
    deltaX = 0
    deltaY = -100
  })

  it('default: 真上は up', () => expect(subject()).toBe('up'))

  context('with 真右', () => {
    beforeEach(() => {
      deltaX = 100
      deltaY = 0
    })

    it('right', () => expect(subject()).toBe('right'))
  })

  context('with 真下', () => {
    beforeEach(() => {
      deltaX = 0
      deltaY = 100
    })

    it('down', () => expect(subject()).toBe('down'))
  })

  context('with 真左', () => {
    beforeEach(() => {
      deltaX = -100
      deltaY = 0
    })

    it('left', () => expect(subject()).toBe('left'))
  })

  context('with しきい値ちょうど（80px）', () => {
    beforeEach(() => {
      deltaX = 0
      deltaY = -80
    })

    it('確定せず center', () => expect(subject()).toBe('center'))
  })

  context('with しきい値を1px超える', () => {
    beforeEach(() => {
      deltaX = 0
      deltaY = -81
    })

    it('方向が確定する', () => expect(subject()).toBe('up'))
  })

  context('with 移動なし', () => {
    beforeEach(() => {
      deltaX = 0
      deltaY = 0
    })

    it('center', () => expect(subject()).toBe('center'))
  })

  describe('斜め45度の境界', () => {
    it('右上がりの境界より上は up', () => expect(detectDragDirection(100, -101)).toBe('up'))
    it('右上がりの境界より右は right', () => expect(detectDragDirection(101, -100)).toBe('right'))
    it('右下がりの境界より下は down', () => expect(detectDragDirection(100, 101)).toBe('down'))
    it('左下の境界より左は left', () => expect(detectDragDirection(-101, 100)).toBe('left'))
  })
})

describe('CATEGORY_BY_DIRECTION', () => {
  it('4方向すべてにカテゴリが割り当てられている', () =>
    expect(CATEGORY_BY_DIRECTION).toEqual({ up: 'study', down: 'hobby', left: 'work', right: 'life' }))
})
