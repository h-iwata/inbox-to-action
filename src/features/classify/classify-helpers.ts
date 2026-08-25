import type { Category } from '@/types'

/** ドラッグの4方向。 */
export type Direction = 'up' | 'down' | 'left' | 'right'

/** ドラッグの状態。`center` は方向が未確定（しきい値未満）、`null` は操作していない。 */
export type DragDirection = Direction | 'center' | null

export type ClassifyCategory = Exclude<Category, 'inbox'>

/** 方向を確定するのに必要なドラッグ距離（px）。これ以下はキャンセル扱いにする。 */
const DIRECTION_THRESHOLD_PX = 80

/** 各方向に割り当てるカテゴリ。キーボード操作（W/A/S/D）もこの対応に揃えている。 */
export const CATEGORY_BY_DIRECTION = {
  up: 'study',
  down: 'hobby',
  left: 'work',
  right: 'life',
} as const satisfies Record<Direction, ClassifyCategory>

/**
 * 中心からの変位でドラッグ方向を判定する。
 *
 * しきい値未満の移動は `center`（キャンセル）。それ以上なら 45 度ずつの範囲で4方向に割り当てる。
 */
export const detectDragDirection = (deltaX: number, deltaY: number): Exclude<DragDirection, null> => {
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  if (distance <= DIRECTION_THRESHOLD_PX) return 'center'

  const degrees = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
  if (degrees >= -135 && degrees < -45) return 'up'
  if (degrees >= -45 && degrees < 45) return 'right'
  if (degrees >= 45 && degrees < 135) return 'down'
  return 'left'
}
