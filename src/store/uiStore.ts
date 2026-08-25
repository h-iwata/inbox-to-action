import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Category } from '@/types'
import { trackModeChange } from '@/utils/analytics'

export type AppMode = 'create' | 'classify' | 'list' | 'execute' // 作成, 分類, 一覧, 実行

/** モードの並び順。Tab / Shift+Tab はこの順序で循環する。 */
export const MODE_ORDER: readonly AppMode[] = ['create', 'classify', 'list', 'execute']

export const getNextMode = (current: AppMode): AppMode =>
  MODE_ORDER[(MODE_ORDER.indexOf(current) + 1) % MODE_ORDER.length]

export const getPrevMode = (current: AppMode): AppMode =>
  MODE_ORDER[(MODE_ORDER.indexOf(current) - 1 + MODE_ORDER.length) % MODE_ORDER.length]

interface UIState {
  currentMode: AppMode
  /** 一覧モードへ移ったときにスクロールさせたいカテゴリ。 */
  scrollToCategory: Category | null
}

interface UIActions {
  setMode: (mode: AppMode) => void
  setModeWithScroll: (mode: AppMode, scrollToCategory?: Category) => void
  clearScrollToCategory: () => void
}

export type UIStore = UIState & { actions: UIActions }

/** UI の一時状態。**永続化しない**（リロードで作成モードに戻る）。 */
export const useUIStore = create<UIStore>()(
  devtools(
    set => ({
      currentMode: 'create',
      scrollToCategory: null,

      actions: {
        setMode: mode => {
          set({ currentMode: mode })
          trackModeChange(mode)
        },

        setModeWithScroll: (mode, scrollToCategory) => {
          set({ currentMode: mode, scrollToCategory: scrollToCategory ?? null })
          trackModeChange(mode)
        },

        clearScrollToCategory: () => set({ scrollToCategory: null }),
      },
    }),
    { name: 'ui', enabled: import.meta.env.DEV }
  )
)

/** アクションだけを購読する。 */
export const useUIActions = (): UIActions => useUIStore(state => state.actions)

/** 現在のモードだけを購読する。 */
export const useCurrentMode = (): AppMode => useUIStore(state => state.currentMode)
