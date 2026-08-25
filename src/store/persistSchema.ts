import * as v from 'valibot'
import { CATEGORIES, TASK_STATUSES, type UUID } from '@/types'
import { generateUUID, isUUID } from '@/utils/uuid'

/**
 * localStorage から復元したデータを検証・矯正するスキーマ。
 *
 * 「localStorage の内容を信頼しない」という不変条件を宣言的に表現する。
 * 壊れた値は例外を投げずに `fallback` で既定値へ倒す（ユーザーのデータが読めなくても
 * アプリが起動しないより、欠けた分だけ捨てて動く方が良い）。
 *
 * ここでの責務は **型の矯正まで**。24時間ルールや `isExecuting` の単一性のような
 * 状態の整合性は reducer 側の責務なので、このスキーマには持ち込まない。
 */

/** オブジェクト以外の入力を空オブジェクトに倒し、各フィールドの fallback を効かせる。 */
const toRecord = v.transform((value: unknown) => (typeof value === 'object' && value !== null ? value : {}))

const nowISOString = () => new Date().toISOString()

export const taskSchema = v.pipe(
  v.unknown(),
  toRecord,
  v.object({
    id: v.fallback(v.custom<UUID>(isUUID), generateUUID),
    // trim して空でなければ元の値をそのまま使う（前後の空白は保持する）
    title: v.fallback(
      v.pipe(
        v.string(),
        v.check(value => value.trim().length > 0)
      ),
      '(untitled)'
    ),
    category: v.fallback(v.picklist(CATEGORIES), 'inbox'),
    created_at: v.fallback(v.string(), nowISOString),
    updated_at: v.fallback(v.string(), nowISOString),
    status: v.fallback(v.picklist(TASK_STATUSES), 'active'),
    isExecuting: v.fallback(v.boolean(), false),
  })
)

/** キー自体が欠けている場合にも既定値を返せるよう optional で包む。 */
const taskListSchema = v.optional(v.fallback(v.array(taskSchema), []), [])

const finiteNumberSchema = v.fallback(
  v.pipe(
    v.number(),
    v.check((value: number) => Number.isFinite(value))
  ),
  0
)

export const dailyStatsSchema = v.pipe(
  v.unknown(),
  toRecord,
  v.object({
    created: finiteNumberSchema,
    classified: finiteNumberSchema,
    completed: finiteNumberSchema,
  })
)

const listsSchema = v.pipe(
  v.unknown(),
  toRecord,
  v.object(
    Object.fromEntries(CATEGORIES.map(category => [category, taskListSchema])) as Record<
      (typeof CATEGORIES)[number],
      typeof taskListSchema
    >
  )
)

export const persistedTasksSchema = v.pipe(
  v.unknown(),
  toRecord,
  v.object({
    lists: v.optional(listsSchema, {}),
    completed: taskListSchema,
    dailyStats: v.optional(dailyStatsSchema, {}),
  })
)

export type PersistedTasks = v.InferOutput<typeof persistedTasksSchema>

/** 復元データを検証して矯正する。例外は投げない。 */
export const parsePersistedTasks = (raw: unknown): PersistedTasks => v.parse(persistedTasksSchema, raw)
