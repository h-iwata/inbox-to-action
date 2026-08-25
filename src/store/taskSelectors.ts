import type { TasksState } from '@/store/taskMutations'
import { CATEGORIES, type Category, type Task } from '@/types'

/**
 * タスクの派生値を求める純粋関数。
 *
 * `taskMutations` と同じくストア実装に依存しない。フックからはここを呼ぶだけにして、
 * 計算ロジックをコンポーネントにも store 定義にも散らさない。
 */

/** inbox を除いたカテゴリ。 */
export type ListCategory = Exclude<Category, 'inbox'>

export type CategoryRecord<T> = Record<ListCategory, T>

/** タスクが属するカテゴリを探す。完了済みも対象。削除や完了の「前」に計測用の情報を取るために使う。 */
export const findTaskCategory = (state: TasksState, taskId: string): Category | null => {
  for (const category of CATEGORIES) {
    if (state.lists[category].some(task => task.id === taskId)) return category
  }
  return state.completed.find(task => task.id === taskId)?.category ?? null
}

/** 実行モードで表示する順序。分類モードの4方向の並びに合わせている。 */
const EXECUTE_ORDER: ListCategory[] = ['work', 'study', 'life', 'hobby']

export const tasksGroupedByCategory = (state: TasksState): CategoryRecord<Task[]> => ({
  work: state.lists.work,
  life: state.lists.life,
  study: state.lists.study,
  hobby: state.lists.hobby,
})

/** 各カテゴリの先頭タスク。タスクが無いカテゴリは含まれない。 */
export const topTasksByCategory = (state: TasksState): Task[] =>
  EXECUTE_ORDER.map(category => state.lists[category][0]).filter((task): task is Task => Boolean(task))

export const taskCountByCategory = (state: TasksState): CategoryRecord<number> => ({
  work: state.lists.work.length,
  life: state.lists.life.length,
  study: state.lists.study.length,
  hobby: state.lists.hobby.length,
})

/** 今日完了したタスクの数をカテゴリ別に数える。完了日は `updated_at` で判定する。 */
export const todayCompletedByCategory = (state: TasksState): CategoryRecord<number> => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const byCategory: CategoryRecord<number> = { work: 0, life: 0, study: 0, hobby: 0 }

  for (const task of state.completed) {
    if (task.category === 'inbox') continue

    const completedDate = new Date(task.updated_at)
    completedDate.setHours(0, 0, 0, 0)
    if (completedDate.getTime() === today.getTime()) {
      byCategory[task.category]++
    }
  }

  return byCategory
}
