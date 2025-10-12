export type Category = 'work' | 'life' | 'study' | 'hobby' | 'inbox'
export type TaskStatus = 'active' | 'done'

export interface Task {
  id: string
  title: string
  category: Category
  created_at: string
  updated_at: string
  status: TaskStatus
  isExecuting?: boolean // 実行中フラグ（カテゴリ内の先頭タスクで使用）
}

export interface DailyStats {
  created: number
  classified: number
  completed: number
}
