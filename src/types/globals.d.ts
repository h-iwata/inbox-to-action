import type { describe } from 'vitest'

declare global {
  /** `describe` の alias。BDD スタイルで「ある状態のとき」を表す（src/test/setup.ts で注入）。 */
  var context: typeof describe
}
