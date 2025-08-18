import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit'
import type { Task, Category, DailyStats, WeeklyStats } from '../../types'
import type { RootState } from '../index'

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
        isExecuting: false, // inboxのタスクは常に実行中フラグなし
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
        const completedTask = state.items[index]
        const taskCategory = completedTask.category
        
        // タスクを完了状態にする
        completedTask.status = 'done'
        completedTask.updated_at = new Date().toISOString()
        state.stats.daily.completed++
        
        // 実行中タスクを完了した場合、同じカテゴリの次のタスクを実行中にする
        if (completedTask.isExecuting === true && taskCategory !== 'inbox') {
          // 同じカテゴリのアクティブなタスクを取得
          const categoryTasks = state.items.filter(
            (t) => t.category === taskCategory && t.status === 'active'
          ).sort((a, b) => a.order - b.order)
          
          // order=2のタスクをorder=1に繰り上げ、実行中にする
          if (categoryTasks.length > 0) {
            // 全タスクの順序を1つずつ繰り上げる
            categoryTasks.forEach((t) => {
              t.order = t.order - 1
            })
            
            // 新しくorder=1になったタスクを実行中にする
            const newTopTask = categoryTasks.find(t => t.order === 1)
            if (newTopTask) {
              newTopTask.isExecuting = true
            }
          }
        }
      }
    },
    classifyTask: (state, action: PayloadAction<{ id: string; category: Category }>) => {
      const index = state.items.findIndex((task) => task.id === action.payload.id)
      if (index !== -1) {
        const task = state.items[index]
        const targetCategory = action.payload.category
        task.category = targetCategory
        task.updated_at = new Date().toISOString()
        
        // カテゴリ内にタスクがない場合は自動的にorder=1にする
        const categoryTasks = state.items.filter(
          (t) => t.category === targetCategory && t.id !== task.id && t.status === 'active'
        )
        
        if (categoryTasks.length === 0) {
          task.order = 1
          // 全体で実行中のタスクがない場合のみ実行中フラグをオンにする
          const hasExecutingTask = state.items.some(t => t.isExecuting === true && t.status === 'active' && t.id !== task.id)
          if (!hasExecutingTask) {
            task.isExecuting = true
          } else {
            task.isExecuting = false
          }
        } else {
          task.order = Math.max(...categoryTasks.map(t => t.order)) + 1
          task.isExecuting = false
        }
        
        state.stats.daily.classified++
      }
    },
    moveToTop: (state, action: PayloadAction<string>) => {
      const index = state.items.findIndex((task) => task.id === action.payload)
      if (index !== -1) {
        const task = state.items[index]
        // 同じカテゴリのタスクを取得
        const sameCategoryTasks = state.items.filter(
          (t) => t.category === task.category && t.id !== task.id && t.status === 'active',
        )
        // 現在のorder=1のタスクを探す
        const currentTopTask = sameCategoryTasks.find(t => t.order === 1)
        if (currentTopTask) {
          currentTopTask.order = task.order // 元の順序と入れ替え
        }
        task.order = 1
        task.updated_at = new Date().toISOString()
        // 他のタスクの順序を調整
        sameCategoryTasks
          .filter(t => t.id !== currentTopTask?.id)
          .sort((a, b) => a.order - b.order)
          .forEach((t, idx) => {
            if (t.order === 1) return // 新しいトップタスクはスキップ
            t.order = idx + 2
          })
        
        // 実行中フラグは別途toggleExecutingで管理するため、ここでは設定しない
        task.isExecuting = false
      }
    },
    cleanupExpiredTasks: (state) => {
      const now = new Date()
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      state.items = state.items.filter((task) => {
        // 24時間ルール: 作成から24時間経過したタスクは例外なく削除
        const createdAt = new Date(task.created_at)
        return createdAt > twentyFourHoursAgo
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
    toggleExecuting: (state, action: PayloadAction<string>) => {
      const index = state.items.findIndex((task) => task.id === action.payload)
      if (index !== -1) {
        const task = state.items[index]
        // order=1のタスクのみ実行中フラグを切り替え可能
        if (task.order === 1 && task.category !== 'inbox') {
          if (task.isExecuting) {
            // 実行中を一時停止にする
            task.isExecuting = false
          } else {
            // 一時停止を実行中にする前に、他の実行中タスクを一時停止にする
            state.items.forEach((t) => {
              if (t.isExecuting === true && t.id !== task.id) {
                t.isExecuting = false
              }
            })
            task.isExecuting = true
          }
          task.updated_at = new Date().toISOString()
        }
      }
    },
    changeCategory: (state, action: PayloadAction<{ taskId: string; newCategory: Category }>) => {
      const index = state.items.findIndex((task) => task.id === action.payload.taskId)
      if (index !== -1) {
        const task = state.items[index]
        const oldCategory = task.category
        const newCategory = action.payload.newCategory
        
        // 元のカテゴリのタスクを再整列
        const oldCategoryTasks = state.items.filter(
          (t) => t.category === oldCategory && t.id !== task.id && t.status === 'active'
        ).sort((a, b) => a.order - b.order)
        
        oldCategoryTasks.forEach((t, idx) => {
          t.order = idx + 1
        })
        
        // 新しいカテゴリにタスクを追加
        task.category = newCategory
        task.updated_at = new Date().toISOString()
        
        // 新しいカテゴリでの順序を設定
        const newCategoryTasks = state.items.filter(
          (t) => t.category === newCategory && t.id !== task.id && t.status === 'active'
        )
        
        if (newCategoryTasks.length === 0) {
          task.order = 1
        } else {
          task.order = Math.max(...newCategoryTasks.map(t => t.order)) + 1
        }
        
        // カテゴリ変更時、order=1のタスクまたは実行中タスクの場合はフラグをリセット
        const wasOrderOne = state.items.find(t => t.id === task.id && t.category === oldCategory)?.order === 1
        if (task.isExecuting === true || wasOrderOne || task.order === 1) {
          task.isExecuting = false
        }
      }
    },
    reorderTasksInCategory: (state, action: PayloadAction<{ 
      taskId: string; 
      newPosition: number; 
      category: Category 
    }>) => {
      const { taskId, newPosition, category } = action.payload
      const taskIndex = state.items.findIndex((task) => task.id === taskId)
      
      if (taskIndex === -1) return
      
      const task = state.items[taskIndex]
      const oldPosition = task.order
      
      // 位置が変わらない場合は何もしない
      if (oldPosition === newPosition) return
      
      // 順序を再計算 - state.itemsを直接更新
      if (oldPosition < newPosition) {
        // 下に移動する場合
        state.items.forEach((t) => {
          if (t.category === category && t.status === 'active') {
            if (t.id === taskId) {
              t.order = newPosition
            } else if (t.order > oldPosition && t.order <= newPosition) {
              t.order -= 1
            }
          }
        })
      } else {
        // 上に移動する場合
        state.items.forEach((t) => {
          if (t.category === category && t.status === 'active') {
            if (t.id === taskId) {
              t.order = newPosition
            } else if (t.order >= newPosition && t.order < oldPosition) {
              t.order += 1
            }
          }
        })
      }
      
      // 更新日時を設定
      task.updated_at = new Date().toISOString()
      
      // order=1のタスクを入れ替えた場合（元がorder=1または新しくorder=1になった場合）、フラグをリセット
      if (oldPosition === 1 || newPosition === 1) {
        task.isExecuting = false
      }
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
  toggleExecuting,
  changeCategory,
  reorderTasksInCategory,
} = tasksSlice.actions

// Selectors
const selectTasksState = (state: RootState) => state.tasks

export const selectAllTasks = createSelector(
  [selectTasksState],
  (tasks) => tasks.items
)

export const selectInboxTasks = createSelector(
  [selectAllTasks],
  (tasks) => tasks.filter(task => task.category === 'inbox' && task.status === 'active')
    .sort((a, b) => a.order - b.order)
)

export const selectTasksByCategory = (category: Category) =>
  createSelector(
    [selectAllTasks],
    (tasks) => tasks.filter(task => task.category === category && task.status === 'active')
      .sort((a, b) => a.order - b.order)
  )

export const selectTopTasksForExecution = createSelector(
  [selectAllTasks],
  (tasks) => {
    // 実行中のタスクを1つだけ取得（全カテゴリから）
    const executingTask = tasks.find(task => 
      task.isExecuting === true && 
      task.status === 'active' && 
      task.category !== 'inbox'
    )
    
    // 実行中タスクがあればそれを返す、なければ空配列
    return executingTask ? [executingTask] : []
  }
)

export const selectTopTasksByCategory = createSelector(
  [selectAllTasks],
  (tasks) => {
    const categories: Category[] = ['work', 'study', 'life', 'hobby']
    return categories
      .map(category => tasks
        .filter(task => task.category === category && task.status === 'active' && task.order === 1)
        .sort((a, b) => a.order - b.order)[0]
      )
      .filter(Boolean)
  }
)

export const selectDailyStats = createSelector(
  [selectTasksState],
  (tasks) => tasks.stats.daily
)

export const selectTodayCompletedByCategory = createSelector(
  [selectAllTasks],
  (tasks) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayCompleted = tasks.filter(task => {
      if (task.status !== 'done') return false
      const completedDate = new Date(task.updated_at)
      completedDate.setHours(0, 0, 0, 0)
      return completedDate.getTime() === today.getTime()
    })
    
    const byCategory = {
      work: 0,
      life: 0,
      study: 0,
      hobby: 0
    }
    
    todayCompleted.forEach(task => {
      if (task.category !== 'inbox' && task.category in byCategory) {
        byCategory[task.category as keyof typeof byCategory]++
      }
    })
    
    return byCategory
  }
)

export const selectWeeklyStats = createSelector(
  [selectTasksState],
  (tasks) => tasks.stats.weekly
)

export default tasksSlice.reducer