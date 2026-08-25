import { useShallow } from 'zustand/react/shallow'
import * as selectors from '@/store/taskSelectors'
import { useTasksStore } from '@/store/tasksStore'
import type { Category, Task } from '@/types'

/**
 * タスクの派生値を購読するフック。
 *
 * 新しい配列やオブジェクトを毎回作るセレクターは `useShallow` で包む。
 * 包まないと参照が毎回変わり、値が同じでも再レンダリングが走る。
 */

export const useInboxTasks = (): Task[] => useTasksStore(state => state.lists.inbox)

export const useTasksByCategory = (category: Category): Task[] => useTasksStore(state => state.lists[category])

export const useTasksGroupedByCategory = (): selectors.CategoryRecord<Task[]> =>
  useTasksStore(useShallow(selectors.tasksGroupedByCategory))

export const useTopTasksByCategory = (): Task[] => useTasksStore(useShallow(selectors.topTasksByCategory))

export const useTaskCountByCategory = (): selectors.CategoryRecord<number> =>
  useTasksStore(useShallow(selectors.taskCountByCategory))

export const useTodayCompletedByCategory = (): selectors.CategoryRecord<number> =>
  useTasksStore(useShallow(selectors.todayCompletedByCategory))
