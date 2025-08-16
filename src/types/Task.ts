export type Category = 'work' | 'life' | 'study' | 'hobby' | 'inbox'
export type TaskStatus = 'active' | 'done'

export interface Task {
  id: string
  title: string
  category: Category
  created_at: string
  updated_at: string
  order: number
  status: TaskStatus
  isExecuting?: boolean // 実行中フラグ（order=1のタスクのみ有効）
}

export interface DailyStats {
  created: number
  classified: number
  completed: number
}

export interface WeeklyStats {
  completionRate: number
  productivity: number
  categoryBreakdown: Record<Category, number>
  mostActiveHour: number
}