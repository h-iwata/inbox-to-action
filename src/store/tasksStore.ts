import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { migrateLegacyStorage } from '@/store/migrateLegacyStorage'
import { parsePersistedTasks } from '@/store/persistSchema'
import * as mutations from '@/store/taskMutations'
import { findTaskCategory } from '@/store/taskSelectors'
import type { Category } from '@/types'
import { trackTaskEvent } from '@/utils/analytics'

/** localStorage のキー。 */
const STORAGE_KEY = 'inbox-to-action/tasks'

export interface TasksActions {
  addTask: (title: string) => void
  deleteTask: (taskId: string) => void
  completeTask: (taskId: string) => void
  classifyTask: (taskId: string, category: Category) => void
  cleanupExpiredTasks: () => void
  updateStats: () => void
  toggleExecuting: (taskId: string) => void
  moveTaskToInbox: (taskId: string) => void
  moveTaskToTop: (taskId: string, category: Category) => void
  /** テスト用。状態を初期値に戻す。 */
  reset: () => void
}

export type TasksStore = mutations.TasksState & { actions: TasksActions }

// 旧 Redux Persist のデータがあれば、ストア生成前に新形式へ移しておく
migrateLegacyStorage(STORAGE_KEY)

/**
 * タスクのストア。
 *
 * 状態遷移そのものは [taskMutations](./taskMutations.ts) に置き、ここは
 * 「mutation を呼ぶ」「計測イベントを送る」だけの薄い配線に保つ。
 * 計測に必要な変更前の情報は `set` の前に取得する（mutation は戻り値を持たない）。
 *
 * アクションは `actions` にまとめてある。参照が安定するので、
 * `useTasksStore(state => state.actions)` で購読しても再レンダリングを誘発しない。
 */
export const useTasksStore = create<TasksStore>()(
  devtools(
    persist(
      immer<TasksStore>((set, get) => ({
        ...mutations.createInitialTasksState(),

        actions: {
          addTask: title => {
            set(draft => {
              mutations.addTask(draft, title)
            })
            trackTaskEvent('create', 'inbox')
          },

          deleteTask: taskId => {
            const category = findTaskCategory(get(), taskId)
            set(draft => {
              mutations.deleteTask(draft, taskId)
            })
            if (category) trackTaskEvent('delete', category)
          },

          completeTask: taskId => {
            const category = findTaskCategory(get(), taskId)
            set(draft => {
              mutations.completeTask(draft, taskId)
            })
            if (category) trackTaskEvent('complete', category)
          },

          classifyTask: (taskId, category) => {
            set(draft => {
              mutations.classifyTask(draft, taskId, category)
            })
          },

          cleanupExpiredTasks: () => {
            set(mutations.cleanupExpiredTasks)
          },

          updateStats: () => {
            set(mutations.updateStats)
          },

          toggleExecuting: taskId => {
            set(draft => {
              mutations.toggleExecuting(draft, taskId)
            })
          },

          moveTaskToInbox: taskId => {
            set(draft => {
              mutations.moveTaskToInbox(draft, taskId)
            })
          },

          moveTaskToTop: (taskId, category) => {
            set(draft => {
              mutations.moveTaskToTop(draft, taskId, category)
            })
          },

          reset: () => {
            set(draft => {
              Object.assign(draft, mutations.createInitialTasksState())
            })
          },
        },
      })),
      {
        name: STORAGE_KEY,
        // 関数を保存しないよう、状態だけを明示的に取り出す
        partialize: state => ({ lists: state.lists, completed: state.completed, dailyStats: state.dailyStats }),
        // 復元値は信頼せず valibot で矯正してから取り込む
        merge: (persisted, current) => ({ ...current, ...parsePersistedTasks(persisted) }),
      }
    ),
    { name: 'tasks', enabled: import.meta.env.DEV }
  )
)

/** アクションだけを購読する。 */
export const useTaskActions = (): TasksActions => useTasksStore(state => state.actions)
