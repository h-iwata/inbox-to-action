import { CATEGORIES, type Category, type DailyStats, type Task } from '@/types'
import { generateUUID } from '@/utils/uuid'

/**
 * タスクの状態遷移ロジック。
 *
 * **ストア実装（Redux / Zustand）に依存しない**ように、draft を受け取って書き換える純粋な形にしてある。
 * Immer の `produce` の中で呼ぶ前提。こうしておくと、状態遷移のテストがストアの API に縛られない。
 *
 * 「守るべき不変条件」（CLAUDE.md）のうち、
 * 24時間ルール・`isExecuting` の単一性・並び順の維持はすべてこのファイルが担保する。
 *
 * **すべての mutation は戻り値を持たない**。Immer の producer は値を返すとエラーになるため、
 * 戻り値があると呼び出し側でブロック文にする必要が生じて事故りやすい。
 * 計測などで変更前の情報が要る場合は、呼び出し側が `taskSelectors` で先に取得する。
 */

export interface TasksState {
  lists: Record<Category, Task[]>
  completed: Task[]
  dailyStats: DailyStats
}

export const createEmptyLists = (): Record<Category, Task[]> => ({
  inbox: [],
  work: [],
  life: [],
  study: [],
  hobby: [],
})

export const createInitialTasksState = (): TasksState => ({
  lists: createEmptyLists(),
  completed: [],
  dailyStats: { created: 0, classified: 0, completed: 0 },
})

const now = () => new Date().toISOString()

// --- 内部ヘルパー ---

const allActiveTasks = (state: TasksState): Task[] => CATEGORIES.flatMap(category => state.lists[category])

const allTasks = (state: TasksState): Task[] => [...allActiveTasks(state), ...state.completed]

const findActiveTaskLocation = (state: TasksState, taskId: string): { category: Category; index: number } | null => {
  for (const category of CATEGORIES) {
    const index = state.lists[category].findIndex(task => task.id === taskId)
    if (index !== -1) return { category, index }
  }
  return null
}

const removeActiveTask = (state: TasksState, taskId: string): { task: Task; category: Category } | null => {
  const location = findActiveTaskLocation(state, taskId)
  if (!location) return null
  const [task] = state.lists[location.category].splice(location.index, 1)
  return { task, category: location.category }
}

const removeCompletedTask = (state: TasksState, taskId: string): Task | null => {
  const index = state.completed.findIndex(task => task.id === taskId)
  if (index === -1) return null
  const [task] = state.completed.splice(index, 1)
  return task
}

const hasExecutingTask = (state: TasksState): boolean =>
  CATEGORIES.some(category => state.lists[category].some(task => task.isExecuting === true))

/** アプリ全体で実行中フラグを降ろす。単一性を保つための唯一の手段。 */
export const clearExecutingFlags = (state: TasksState): void => {
  for (const category of CATEGORIES) {
    for (const task of state.lists[category]) {
      task.isExecuting = false
    }
  }
}

/** 指定カテゴリの先頭タスクを実行中にする。inbox は対象外。 */
export const setFirstTaskAsExecuting = (state: TasksState, category: Category): void => {
  if (category === 'inbox') return
  const list = state.lists[category]
  if (list.length === 0) return
  clearExecutingFlags(state)
  list[0].isExecuting = true
}

// --- 状態遷移 ---

export const addTask = (state: TasksState, title: string): void => {
  const task: Task = {
    id: generateUUID(),
    title,
    category: 'inbox',
    created_at: now(),
    updated_at: now(),
    status: 'active',
    isExecuting: false,
  }
  state.lists.inbox.push(task)
  state.dailyStats.created++
}

export const deleteTask = (state: TasksState, taskId: string): void => {
  const removedActive = removeActiveTask(state, taskId)
  if (removedActive) {
    if (removedActive.task.isExecuting) {
      setFirstTaskAsExecuting(state, removedActive.category)
    }
    return
  }

  removeCompletedTask(state, taskId)
}

export const completeTask = (state: TasksState, taskId: string): void => {
  const removed = removeActiveTask(state, taskId)
  if (!removed) return

  const { task, category } = removed
  task.status = 'done'
  task.updated_at = now()
  task.isExecuting = false

  state.completed.push(task)
  state.dailyStats.completed++

  if (category !== 'inbox') {
    setFirstTaskAsExecuting(state, category)
  }
}

export const classifyTask = (state: TasksState, taskId: string, newCategory: Category): void => {
  const removed = removeActiveTask(state, taskId)
  if (!removed) return

  const { task, category: oldCategory } = removed
  const wasExecuting = task.isExecuting === true

  task.category = newCategory
  task.updated_at = now()
  task.isExecuting = false

  state.lists[newCategory].push(task)
  state.dailyStats.classified++

  if (wasExecuting) {
    setFirstTaskAsExecuting(state, oldCategory)
  }

  // 分類先が空だった場合、他に実行中がなければこのタスクを実行中にする
  if (newCategory !== 'inbox' && state.lists[newCategory].length === 1 && !hasExecutingTask(state)) {
    clearExecutingFlags(state)
    task.isExecuting = true
  }
}

/** 作成から24時間を過ぎたタスクを削除する。完了済みも例外にしない。 */
export const cleanupExpiredTasks = (state: TasksState): void => {
  const threshold = Date.now() - 24 * 60 * 60 * 1000
  const isAlive = (task: Task) => new Date(task.created_at).getTime() > threshold

  for (const category of CATEGORIES) {
    state.lists[category] = state.lists[category].filter(isAlive)
  }
  state.completed = state.completed.filter(isAlive)
}

/** 今日ぶんの集計を取り直す。 */
export const updateStats = (state: TasksState): void => {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayTasks = allTasks(state).filter(task => new Date(task.created_at) >= todayStart)

  state.dailyStats = {
    created: todayTasks.length,
    classified: todayTasks.filter(task => task.category !== 'inbox').length,
    completed: todayTasks.filter(task => task.status === 'done').length,
  }
}

/** 実行中フラグを切り替える。カテゴリの先頭タスクのみ、かつアプリ全体で1つだけ。 */
export const toggleExecuting = (state: TasksState, taskId: string): void => {
  const location = findActiveTaskLocation(state, taskId)
  if (!location) return

  const { category, index } = location
  if (category === 'inbox') return

  const list = state.lists[category]
  if (list[0]?.id !== taskId) return

  const task = list[index]
  if (task.isExecuting) {
    task.isExecuting = false
  } else {
    clearExecutingFlags(state)
    task.isExecuting = true
  }
  task.updated_at = now()
}

export const moveTaskToInbox = (state: TasksState, taskId: string): void => {
  const removed = removeActiveTask(state, taskId)
  if (!removed) return

  const { task, category: oldCategory } = removed

  if (oldCategory === 'inbox') {
    state.lists.inbox.push(task)
    return
  }

  const wasExecuting = task.isExecuting === true

  task.category = 'inbox'
  task.updated_at = now()
  task.isExecuting = false
  state.lists.inbox.push(task)

  if (wasExecuting) {
    setFirstTaskAsExecuting(state, oldCategory)
  }
}

/** 指定タスクをカテゴリ内の先頭へ移す。並び順は配列そのものなので splice で動かす。 */
export const moveTaskToTop = (state: TasksState, taskId: string, category: Category): void => {
  const list = state.lists[category]
  const currentIndex = list.findIndex(task => task.id === taskId)

  // 見つからない、または既に先頭なら何もしない
  if (currentIndex <= 0) return

  const [task] = list.splice(currentIndex, 1)
  list.unshift(task)
  task.updated_at = now()

  // 先頭が変わったので実行中フラグを降ろす
  if (category !== 'inbox') {
    for (const item of list) {
      item.isExecuting = false
    }
  }
}
