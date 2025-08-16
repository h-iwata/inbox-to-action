import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Task, Category, DailyStats, WeeklyStats } from '../../types'

interface TasksState {
  items: Task[]
  filter: {
    category: Category | 'all'
    status: 'active' | 'done' | 'all'
  }
  stats: {
    daily: DailyStats
    weekly: WeeklyStats
  }
}

const initialState: TasksState = {
  items: [],
  filter: {
    category: 'all',
    status: 'all',
  },
  stats: {
    daily: {
      created: 0,
      classified: 0,
      completed: 0,
    },
    weekly: {
      completionRate: 0,
      productivity: 0,
      categoryBreakdown: {
        work: 0,
        life: 0,
        study: 0,
        hobby: 0,
        inbox: 0,
      },
      mostActiveHour: 0,
    },
  },
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
        order: state.items.filter((t) => t.category === 'inbox').length + 1,
        status: 'active',
      }
      state.items.push(newTask)
      state.stats.daily.created++
    },
    updateTask: (state, action: PayloadAction<{ id: string; updates: Partial<Task> }>) => {
      const index = state.items.findIndex((task) => task.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload.updates,
          updated_at: new Date().toISOString(),
        }
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((task) => task.id !== action.payload)
    },
    completeTask: (state, action: PayloadAction<string>) => {
      const index = state.items.findIndex((task) => task.id === action.payload)
      if (index !== -1) {
        state.items[index].status = 'done'
        state.items[index].updated_at = new Date().toISOString()
        state.stats.daily.completed++
      }
    },
    classifyTask: (state, action: PayloadAction<{ id: string; category: Category }>) => {
      const index = state.items.findIndex((task) => task.id === action.payload.id)
      if (index !== -1) {
        const task = state.items[index]
        task.category = action.payload.category
        task.updated_at = new Date().toISOString()
        task.order = state.items.filter((t) => t.category === action.payload.category).length + 1
        state.stats.daily.classified++
      }
    },
    moveToTop: (state, action: PayloadAction<string>) => {
      const index = state.items.findIndex((task) => task.id === action.payload)
      if (index !== -1) {
        const task = state.items[index]
        const sameCategoryTasks = state.items.filter(
          (t) => t.category === task.category && t.id !== task.id,
        )
        task.order = 1
        task.updated_at = new Date().toISOString()
        sameCategoryTasks.forEach((t) => {
          t.order++
        })
      }
    },
    cleanupExpiredTasks: (state) => {
      const now = new Date()
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      state.items = state.items.filter((task) => {
        if (task.order === 1) return true
        const updatedAt = new Date(task.updated_at)
        return updatedAt > twentyFourHoursAgo
      })
    },
    setFilter: (
      state,
      action: PayloadAction<{ category?: Category | 'all'; status?: 'active' | 'done' | 'all' }>,
    ) => {
      if (action.payload.category !== undefined) {
        state.filter.category = action.payload.category
      }
      if (action.payload.status !== undefined) {
        state.filter.status = action.payload.status
      }
    },
    updateStats: (state) => {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)

      const todayTasks = state.items.filter(
        (task) => new Date(task.created_at) >= todayStart,
      )
      const weekTasks = state.items.filter(
        (task) => new Date(task.created_at) >= weekStart,
      )

      state.stats.daily = {
        created: todayTasks.length,
        classified: todayTasks.filter((t) => t.category !== 'inbox').length,
        completed: todayTasks.filter((t) => t.status === 'done').length,
      }

      const completedWeekTasks = weekTasks.filter((t) => t.status === 'done')
      state.stats.weekly.completionRate =
        weekTasks.length > 0 ? (completedWeekTasks.length / weekTasks.length) * 100 : 0

      const categoryBreakdown: Record<Category, number> = {
        work: 0,
        life: 0,
        study: 0,
        hobby: 0,
        inbox: 0,
      }
      completedWeekTasks.forEach((task) => {
        categoryBreakdown[task.category]++
      })
      state.stats.weekly.categoryBreakdown = categoryBreakdown
    },
  },
})

export const {
  addTask,
  updateTask,
  deleteTask,
  completeTask,
  classifyTask,
  moveToTop,
  cleanupExpiredTasks,
  setFilter,
  updateStats,
} = tasksSlice.actions

export default tasksSlice.reducer