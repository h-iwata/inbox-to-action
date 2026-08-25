import { createEmptyLists, createInitialTasksState, type TasksState } from '@/store/taskMutations'
import type { Category, Task } from '@/types'

/** 一部のカテゴリだけ指定して lists を組み立てる。 */
export const listsWith = (partial: Partial<Record<Category, Task[]>>): Record<Category, Task[]> => ({
  ...createEmptyLists(),
  ...partial,
})

/** 一部だけ指定して TasksState を組み立てる。 */
export const tasksStateWith = (overrides: Partial<TasksState> = {}): TasksState => ({
  ...createInitialTasksState(),
  ...overrides,
})
