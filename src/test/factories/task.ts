import { faker } from '@faker-js/faker'
import { Factory } from 'fishery'
import type { Task } from '@/types'
import { generateUUID } from '@/utils/uuid'

/**
 * Task の factory。
 *
 * variant は `build({ ... })` の overrides でテスト側に書く（trait は作らない）。
 * 24時間ルールなど時刻に依存するテストでは `created_at` を必ず明示的に override すること
 * （faker のランダム日時のままだと境界付近で不安定になる）。
 */
export const taskFactory = Factory.define<Task>(({ sequence }) => ({
  id: generateUUID(),
  title: `task ${sequence}`,
  category: 'inbox',
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  status: 'active',
}))
