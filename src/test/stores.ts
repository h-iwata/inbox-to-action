import { useTasksStore } from '@/store/tasksStore'
import { useUIStore } from '@/store/uiStore'

/**
 * ストアをテスト間で初期化する。
 *
 * Zustand のストアはモジュールスコープで共有されるため、
 * Integration テストでは各テストの前にこれを呼ぶ。
 */
export const resetStores = (): void => {
  useTasksStore.getState().actions.reset()
  useUIStore.setState({ currentMode: 'create', scrollToCategory: null })
  localStorage.clear()
}
