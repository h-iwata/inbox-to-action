/** カテゴリの一覧。型と値の単一の真実。並び順は inbox が先頭（一覧の走査順）。 */
export const CATEGORIES = ['inbox', 'work', 'life', 'study', 'hobby'] as const
export type Category = (typeof CATEGORIES)[number]

export const TASK_STATUSES = ['active', 'done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]
export type UUID = `${string}-${string}-${string}-${string}-${string}`

export interface Task {
  id: UUID
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
