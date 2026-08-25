import type { Scope, WhenCondition } from './types'

/** コマンドが現在のスコープで有効かを判定する。 */
export const isActiveScope = (when: WhenCondition, scopes: ReadonlySet<Scope>): boolean =>
  typeof when === 'string' ? scopes.has(when) : when.some(scope => scopes.has(scope))

/** when 条件をスコープの配列に正規化する（ドキュメント生成・一覧表示用）。 */
export const scopesOf = (when: WhenCondition): readonly Scope[] => (typeof when === 'string' ? [when] : when)
