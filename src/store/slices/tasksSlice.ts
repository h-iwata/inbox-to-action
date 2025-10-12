import {
  createSlice,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit'
import type { Task, Category, DailyStats } from '../../types'
import type { RootState } from '../index'
import { trackTaskEvent } from '../../utils/analytics'
import { REHYDRATE } from 'redux-persist/es/constants'
import type { RehydrateAction } from 'redux-persist'

const CATEGORY_LIST: Category[] = ['inbox', 'work', 'life', 'study', 'hobby']

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

const getAllActiveTasks = (state: TasksState): Task[] =>
  CATEGORY_LIST.flatMap(category => state.lists[category])

const getAllTasks = (state: TasksState): Task[] => [
  ...getAllActiveTasks(state),
  ...state.completed,
]

const isValidCategory = (value: unknown): value is Category =>
  typeof value === 'string' &&
  (CATEGORY_LIST as readonly string[]).includes(value)

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toNumberOrZero = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0

const normalizeTask = (raw: unknown): Task => {
  const source = isObject(raw) ? raw : {}

  const categoryValue = source.category
  const category = isValidCategory(categoryValue) ? categoryValue : 'inbox'

  const statusValue = source.status
  const status: Task['status'] = statusValue === 'done' ? 'done' : 'active'

  const idValue = source.id
  const id =
    typeof idValue === 'string'
      ? idValue
      : typeof idValue === 'number'
        ? idValue.toString()
        : Date.now().toString()

  const titleValue = source.title
  const title =
    typeof titleValue === 'string' && titleValue.trim().length > 0
      ? titleValue
      : '(untitled)'

  const createdAtValue = source.created_at
  const created_at =
    typeof createdAtValue === 'string'
      ? createdAtValue
      : new Date().toISOString()

  const updatedAtValue = source.updated_at
  const updated_at =
    typeof updatedAtValue === 'string'
      ? updatedAtValue
      : new Date().toISOString()

  return {
    id,
    title,
    category,
    created_at,
    updated_at,
    status,
    isExecuting: source.isExecuting === true,
  }
}

const normalizeDailyStats = (value: unknown): DailyStats => {
  if (!isObject(value)) {
    return { ...initialState.dailyStats }
  }

  return {
    created: toNumberOrZero(value.created),
    classified: toNumberOrZero(value.classified),
    completed: toNumberOrZero(value.completed),
  }
}

const normalizePersistedState = (data: unknown): TasksState => {
  if (!isObject(data)) {
    return {
      lists: createEmptyLists(),
      completed: [],
      dailyStats: { ...initialState.dailyStats },
    }
  }

  const maybeLists = data.lists
  if (isObject(maybeLists)) {
    const listsSource = maybeLists as Record<string, unknown>
    const lists = createEmptyLists()
    CATEGORY_LIST.forEach(category => {
      const sourceList = listsSource[category]
      const normalizedList = Array.isArray(sourceList)
        ? sourceList.map(normalizeTask)
        : []
      lists[category] = normalizedList
    })

    const completedSource = data.completed
    const completed = Array.isArray(completedSource)
      ? completedSource.map(normalizeTask)
      : []

    return {
      lists,
      completed,
      dailyStats: normalizeDailyStats(data.dailyStats),
    }
  }

  const listsWithOrder: Record<Category, { task: Task; order: number }[]> = {
    inbox: [],
    work: [],
    life: [],
    study: [],
    hobby: [],
  }

  const completed: Task[] = []
  const legacyItems = Array.isArray(data.items) ? data.items : []

  legacyItems.forEach(raw => {
    const task = normalizeTask(raw)

    if (task.status === 'done') {
      completed.push(task)
      return
    }

    const source = isObject(raw) ? raw : {}
    const orderValue =
      typeof source.order === 'number' ? source.order : Number.MAX_SAFE_INTEGER

    listsWithOrder[task.category].push({ task, order: orderValue })
  })

  const lists = createEmptyLists()
  CATEGORY_LIST.forEach(category => {
    lists[category] = listsWithOrder[category]
      .sort((a, b) => a.order - b.order)
      .map(entry => entry.task)
  })

  return {
    lists,
    completed,
    dailyStats: normalizeDailyStats(data.dailyStats),
  }
}

const findActiveTaskLocation = (
  state: TasksState,
  taskId: string
): { category: Category; index: number } | null => {
  for (const category of CATEGORY_LIST) {
    const index = state.lists[category].findIndex(task => task.id === taskId)
    if (index !== -1) {
      return { category, index }
    }
  }
  return null
}

const removeActiveTask = (
  state: TasksState,
  taskId: string
): { task: Task; category: Category } | null => {
  const location = findActiveTaskLocation(state, taskId)
  if (!location) return null
  const [task] = state.lists[location.category].splice(location.index, 1)
  return { task, category: location.category }
}

const removeCompletedTask = (
  state: TasksState,
  taskId: string
): Task | null => {
  const index = state.completed.findIndex(task => task.id === taskId)
  if (index === -1) return null
  const [task] = state.completed.splice(index, 1)
  return task
}

const hasExecutingTask = (state: TasksState): boolean =>
  CATEGORY_LIST.some(category =>
    state.lists[category].some(task => task.isExecuting === true)
  )

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
        id: Date.now().toString(),
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
    classifyTask: (
      state,
      action: PayloadAction<{ id: string; category: Category }>
    ) => {
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

      if (
        newCategory !== 'inbox' &&
        state.lists[newCategory].length === 1 &&
        !hasExecutingTask(state)
      ) {
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
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      )

      const todayTasks = getAllTasks(state).filter(
        task => new Date(task.created_at) >= todayStart
      )

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
    changeCategory: (
      state,
      action: PayloadAction<{ taskId: string; newCategory: Category }>
    ) => {
      const removed = removeActiveTask(state, action.payload.taskId)
      if (!removed) return

      const { task, category: oldCategory } = removed
      const newCategory = action.payload.newCategory
      const wasExecuting = task.isExecuting === true

      if (oldCategory === newCategory) {
        state.lists[newCategory].push(task)
        return
      }

      task.category = newCategory
      task.updated_at = new Date().toISOString()
      task.isExecuting = false

      if (oldCategory === 'inbox' && newCategory !== 'inbox') {
        trackTaskEvent('classify', newCategory)
        state.dailyStats.classified++
      }

      state.lists[newCategory].push(task)

      if (wasExecuting) {
        setFirstTaskAsExecuting(state, oldCategory)
      }

      if (
        newCategory !== 'inbox' &&
        state.lists[newCategory].length === 1 &&
        !hasExecutingTask(state)
      ) {
        clearExecutingFlags(state)
        state.lists[newCategory][0].isExecuting = true
      }
    },
    reorderTasksInCategory: (
      state,
      action: PayloadAction<{
        taskId: string
        newPosition: number
        category: Category
      }>
    ) => {
      const { category, taskId, newPosition } = action.payload
      const list = state.lists[category]
      const currentIndex = list.findIndex(task => task.id === taskId)

      if (currentIndex === -1) return

      const targetIndex = Math.max(
        0,
        Math.min(newPosition - 1, list.length - 1)
      )
      if (currentIndex === targetIndex) return

      const [task] = list.splice(currentIndex, 1)
      list.splice(targetIndex, 0, task)
      task.updated_at = new Date().toISOString()

      if (category !== 'inbox' && (currentIndex === 0 || targetIndex === 0)) {
        list.forEach(t => {
          t.isExecuting = false
        })
      }
    },
  },
  extraReducers: builder => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => {
      const payload = action.payload
      if (!isObject(payload)) return

      const incoming =
        'tasks' in payload ? (payload as { tasks?: unknown }).tasks : undefined

      if (!incoming) return
      const normalized = normalizePersistedState(incoming)
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
  changeCategory,
  reorderTasksInCategory,
} = tasksSlice.actions

const selectTasksState = (state: RootState) => state.tasks

export const selectAllTasks = createSelector([selectTasksState], tasks => [
  ...getAllActiveTasks(tasks),
  ...tasks.completed,
])

export const selectInboxTasks = createSelector(
  [selectTasksState],
  tasks => tasks.lists.inbox
)

export const selectTasksByCategory = (category: Category) =>
  createSelector([selectTasksState], tasks => tasks.lists[category])

export const selectTopTasksByCategory = createSelector(
  [selectTasksState],
  tasks => {
    const categories: Category[] = ['work', 'study', 'life', 'hobby']
    return categories
      .map(category => tasks.lists[category][0])
      .filter((task): task is Task => Boolean(task))
  }
)

export const selectTodayCompletedByCategory = createSelector(
  [selectTasksState],
  tasks => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const byCategory = {
      work: 0,
      life: 0,
      study: 0,
      hobby: 0,
    }

    tasks.completed.forEach(task => {
      const completedDate = new Date(task.updated_at)
      completedDate.setHours(0, 0, 0, 0)
      if (
        completedDate.getTime() === today.getTime() &&
        task.category !== 'inbox' &&
        task.category in byCategory
      ) {
        byCategory[task.category as keyof typeof byCategory]++
      }
    })

    return byCategory
  }
)

export default tasksSlice.reducer
