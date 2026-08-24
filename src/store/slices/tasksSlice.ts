import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RehydrateAction } from 'redux-persist'
import { REHYDRATE } from 'redux-persist/es/constants'
import { validate as uuidValidate, v4 as uuidv4 } from 'uuid'
import type { Category, DailyStats, Task, UUID } from '../../types'
import { trackTaskEvent } from '../../utils/analytics'
import type { RootState } from '../index'

const CATEGORY_LIST: Category[] = ['inbox', 'work', 'life', 'study', 'hobby']

// inbox以外のカテゴリ用の型
export type ListCategory = Exclude<Category, 'inbox'>
export type CategoryRecord<T> = Record<ListCategory, T>

const createEmptyLists = (): Record<Category, Task[]> => ({
  inbox: [],
  work: [],
  life: [],
  study: [],
  hobby: [],
})

interface TasksState {
  lists: Record<Category, Task[]>
  completed: Task[]
  dailyStats: DailyStats
}

const initialState: TasksState = {
  lists: createEmptyLists(),
  completed: [],
  dailyStats: {
    created: 0,
    classified: 0,
    completed: 0,
  },
}

const getAllActiveTasks = (state: TasksState): Task[] => CATEGORY_LIST.flatMap(category => state.lists[category])

const getAllTasks = (state: TasksState): Task[] => [...getAllActiveTasks(state), ...state.completed]

const isValidCategory = (value: unknown): value is Category =>
  typeof value === 'string' && (CATEGORY_LIST as readonly string[]).includes(value)

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const toValidUUID = (value: unknown): UUID => {
  if (typeof value === 'string' && uuidValidate(value)) {
    return value as UUID
  }
  return uuidv4() as UUID
}

const toNumberOrZero = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0)

const normalizeTask = (raw: unknown): Task => {
  const s = isObject(raw) ? raw : {}
  const now = new Date().toISOString()

  return {
    id: toValidUUID(s.id),
    title: typeof s.title === 'string' && s.title.trim() ? s.title : '(untitled)',
    category: isValidCategory(s.category) ? s.category : 'inbox',
    created_at: typeof s.created_at === 'string' ? s.created_at : now,
    updated_at: typeof s.updated_at === 'string' ? s.updated_at : now,
    status: s.status === 'done' ? 'done' : 'active',
    isExecuting: s.isExecuting === true,
  }
}

const normalizeDailyStats = (value: unknown): DailyStats => {
  const v = isObject(value) ? value : {}
  return {
    created: toNumberOrZero(v.created),
    classified: toNumberOrZero(v.classified),
    completed: toNumberOrZero(v.completed),
  }
}

const normalizePersistedState = (persisted: unknown): TasksState => {
  if (!isObject(persisted) || !isObject(persisted.lists)) return { ...initialState, lists: createEmptyLists() }

  const lists = persisted.lists

  return {
    lists: Object.fromEntries(
      CATEGORY_LIST.map(cat => [cat, Array.isArray(lists[cat]) ? (lists[cat] as unknown[]).map(normalizeTask) : []])
    ) as Record<Category, Task[]>,
    completed: Array.isArray(persisted.completed) ? (persisted.completed as unknown[]).map(normalizeTask) : [],
    dailyStats: normalizeDailyStats(persisted.dailyStats),
  }
}

const findActiveTaskLocation = (state: TasksState, taskId: string): { category: Category; index: number } | null => {
  for (const category of CATEGORY_LIST) {
    const index = state.lists[category].findIndex(task => task.id === taskId)
    if (index !== -1) {
      return { category, index }
    }
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
  CATEGORY_LIST.some(category => state.lists[category].some(task => task.isExecuting === true))

const clearExecutingFlags = (state: TasksState) => {
  CATEGORY_LIST.forEach(category => {
    state.lists[category].forEach(task => {
      task.isExecuting = false
    })
  })
}

const setFirstTaskAsExecuting = (state: TasksState, category: Category) => {
  if (category === 'inbox') return
  const list = state.lists[category]
  if (list.length === 0) return
  clearExecutingFlags(state)
  list[0].isExecuting = true
}

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask: (state, action: PayloadAction<string>) => {
      const newTask: Task = {
        id: uuidv4() as UUID,
        title: action.payload,
        category: 'inbox',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
        isExecuting: false,
      }
      state.lists.inbox.push(newTask)
      state.dailyStats.created++

      trackTaskEvent('create', 'inbox')
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      const removedActive = removeActiveTask(state, action.payload)
      if (removedActive) {
        trackTaskEvent('delete', removedActive.category)
        if (removedActive.task.isExecuting) {
          setFirstTaskAsExecuting(state, removedActive.category)
        }
        return
      }

      const removedCompleted = removeCompletedTask(state, action.payload)
      if (removedCompleted) {
        trackTaskEvent('delete', removedCompleted.category)
      }
    },
    completeTask: (state, action: PayloadAction<string>) => {
      const removed = removeActiveTask(state, action.payload)
      if (!removed) return

      const { task, category } = removed
      task.status = 'done'
      task.updated_at = new Date().toISOString()
      task.isExecuting = false

      state.completed.push(task)
      state.dailyStats.completed++

      trackTaskEvent('complete', category)

      if (category !== 'inbox') {
        setFirstTaskAsExecuting(state, category)
      }
    },
    classifyTask: (state, action: PayloadAction<{ id: string; category: Category }>) => {
      const removed = removeActiveTask(state, action.payload.id)
      if (!removed) return

      const { task, category: oldCategory } = removed
      const wasExecuting = task.isExecuting === true
      const newCategory = action.payload.category

      task.category = newCategory
      task.updated_at = new Date().toISOString()
      task.isExecuting = false

      state.lists[newCategory].push(task)
      state.dailyStats.classified++

      if (wasExecuting) {
        setFirstTaskAsExecuting(state, oldCategory)
      }

      if (newCategory !== 'inbox' && state.lists[newCategory].length === 1 && !hasExecutingTask(state)) {
        clearExecutingFlags(state)
        task.isExecuting = true
      }
    },
    cleanupExpiredTasks: state => {
      const now = new Date()
      const threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      CATEGORY_LIST.forEach(category => {
        state.lists[category] = state.lists[category].filter(task => {
          const createdAt = new Date(task.created_at)
          return createdAt > threshold
        })
      })

      state.completed = state.completed.filter(task => {
        const createdAt = new Date(task.created_at)
        return createdAt > threshold
      })
    },
    updateStats: state => {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      const todayTasks = getAllTasks(state).filter(task => new Date(task.created_at) >= todayStart)

      state.dailyStats = {
        created: todayTasks.length,
        classified: todayTasks.filter(t => t.category !== 'inbox').length,
        completed: todayTasks.filter(t => t.status === 'done').length,
      }
    },
    toggleExecuting: (state, action: PayloadAction<string>) => {
      const location = findActiveTaskLocation(state, action.payload)
      if (!location) return

      const { category, index } = location
      if (category === 'inbox') return

      const list = state.lists[category]
      if (list[0]?.id !== action.payload) return

      const task = list[index]
      if (task.isExecuting) {
        task.isExecuting = false
      } else {
        clearExecutingFlags(state)
        task.isExecuting = true
      }
      task.updated_at = new Date().toISOString()
    },
    moveTaskToInbox: (state, action: PayloadAction<string>) => {
      const taskId = action.payload
      const removed = removeActiveTask(state, taskId)
      if (!removed) return

      const { task, category: oldCategory } = removed

      // 既にinboxにある場合は何もしない
      if (oldCategory === 'inbox') {
        state.lists.inbox.push(task)
        return
      }

      const wasExecuting = task.isExecuting === true

      // タスクをinboxに戻す
      task.category = 'inbox'
      task.updated_at = new Date().toISOString()
      task.isExecuting = false
      state.lists.inbox.push(task)

      // 実行中だった場合、元のカテゴリの先頭タスクを実行中に設定
      if (wasExecuting) {
        setFirstTaskAsExecuting(state, oldCategory)
      }
    },
    moveTaskToTop: (
      state,
      action: PayloadAction<{
        taskId: string
        category: Category
      }>
    ) => {
      const { category, taskId } = action.payload
      const list = state.lists[category]
      const currentIndex = list.findIndex(task => task.id === taskId)

      // タスクが見つからない、または既に先頭の場合は何もしない
      if (currentIndex <= 0) return

      // 配列から削除して先頭に挿入
      const [task] = list.splice(currentIndex, 1)
      list.unshift(task)
      task.updated_at = new Date().toISOString()

      // 先頭タスクが変わったので実行中フラグをリセット
      if (category !== 'inbox') {
        list.forEach(t => {
          t.isExecuting = false
        })
      }
    },
  },
  extraReducers: builder => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => {
      const normalized = normalizePersistedState((action.payload as Record<string, unknown> | undefined)?.tasks)
      state.lists = normalized.lists
      state.completed = normalized.completed
      state.dailyStats = normalized.dailyStats
    })
  },
})

export const {
  addTask,
  deleteTask,
  completeTask,
  classifyTask,
  cleanupExpiredTasks,
  updateStats,
  toggleExecuting,
  moveTaskToInbox,
  moveTaskToTop,
} = tasksSlice.actions

const selectTasksState = (state: RootState) => state.tasks

export const selectAllTasks = createSelector([selectTasksState], tasks => [
  ...getAllActiveTasks(tasks),
  ...tasks.completed,
])

export const selectInboxTasks = createSelector([selectTasksState], tasks => tasks.lists.inbox)

export const selectTasksByCategory = (category: Category) =>
  createSelector([selectTasksState], tasks => tasks.lists[category])

export const selectTasksGroupedByCategory = createSelector(
  [selectTasksState],
  (tasks): CategoryRecord<Task[]> => ({
    work: tasks.lists.work,
    life: tasks.lists.life,
    study: tasks.lists.study,
    hobby: tasks.lists.hobby,
  })
)

export const selectTopTasksByCategory = createSelector([selectTasksState], tasks => {
  const categories: ListCategory[] = ['work', 'study', 'life', 'hobby']
  return categories.map(category => tasks.lists[category][0]).filter((task): task is Task => Boolean(task))
})

export const selectTaskCountByCategory = createSelector(
  [selectTasksState],
  (tasks): CategoryRecord<number> => ({
    work: tasks.lists.work.length,
    life: tasks.lists.life.length,
    study: tasks.lists.study.length,
    hobby: tasks.lists.hobby.length,
  })
)

export const selectTodayCompletedByCategory = createSelector([selectTasksState], (tasks): CategoryRecord<number> => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const byCategory: CategoryRecord<number> = {
    work: 0,
    life: 0,
    study: 0,
    hobby: 0,
  }

  tasks.completed.forEach(task => {
    const completedDate = new Date(task.updated_at)
    completedDate.setHours(0, 0, 0, 0)
    if (completedDate.getTime() === today.getTime() && task.category !== 'inbox' && task.category in byCategory) {
      byCategory[task.category as ListCategory]++
    }
  })

  return byCategory
})

export default tasksSlice.reducer
