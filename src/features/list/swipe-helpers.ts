/** スワイプ操作の判定ロジック。しきい値の意味をここに集約する。 */

/** スワイプとして扱い始める移動量（px）。これ以下は手ぶれとみなす。 */
const SWIPE_START_THRESHOLD_PX = 5

/** アクションを確定する移動量（px）。ここまで引かずに離すと何も起きない。 */
const SWIPE_ACTION_THRESHOLD_PX = 60

/** カードを引きずれる最大量（px）。背後のアイコンの表示濃度もこの値を基準にする。 */
const SWIPE_MAX_OFFSET_PX = 80

/** タップとスワイプを区別する移動量（px）。 */
const TAP_THRESHOLD_PX = 10

export type SwipeDirection = 'left' | 'right' | null

/** スワイプを離したときに実行するアクション。 */
export type SwipeAction = 'moveToInbox' | 'delete' | null

/** カードの移動量を表示上の上限で丸める。 */
export const clampSwipeOffset = (rawOffset: number): number =>
  Math.max(-SWIPE_MAX_OFFSET_PX, Math.min(SWIPE_MAX_OFFSET_PX, rawOffset))

/** 横移動量から向きを判定する。しきい値未満は未確定（null）。 */
export const detectSwipeDirection = (deltaX: number): SwipeDirection => {
  if (Math.abs(deltaX) <= SWIPE_START_THRESHOLD_PX) return null
  return deltaX > 0 ? 'right' : 'left'
}

/** 離した時点の移動量と向きから、実行するアクションを決める。左が Inbox 送り、右が削除。 */
export const resolveSwipeAction = (rawOffset: number, direction: SwipeDirection): SwipeAction => {
  if (!direction || Math.abs(rawOffset) <= SWIPE_ACTION_THRESHOLD_PX) return null
  return direction === 'left' ? 'moveToInbox' : 'delete'
}

/** スワイプではなくタップとみなせるか。 */
export const isTap = (swipeOffset: number): boolean => Math.abs(swipeOffset) < TAP_THRESHOLD_PX

/** 背後のアイコンをどれだけ濃く出すか（0〜1）。 */
export const swipeProgress = (swipeOffset: number): number => Math.abs(swipeOffset) / SWIPE_MAX_OFFSET_PX

/** 背後のアイコンを表示し始めるか。 */
export const isSwipeVisible = (swipeOffset: number): boolean => Math.abs(swipeOffset) > TAP_THRESHOLD_PX
