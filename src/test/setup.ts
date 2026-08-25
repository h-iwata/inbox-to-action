import { faker } from '@faker-js/faker'
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe } from 'vitest'

// BDD スタイル用に context を describe の alias として注入する（各テストでの import を不要にする）
globalThis.context = describe

// faker の出力を決定論的にして CI でも再現できるようにする
beforeEach(() => {
  faker.seed(12345)
})
