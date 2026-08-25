import type { AppMode } from '@/store/uiStore'

/** コマンドが有効になるスコープ。`global` は全モード共通、それ以外は特定のモード。 */
export type Scope = 'global' | AppMode

/** コマンドの有効条件。単一スコープ、または複数スコープのいずれか。 */
export type WhenCondition = Scope | readonly Scope[]

/** 静的なコマンド定義。[src/config/commands.ts](../../config/commands.ts) に集約する。 */
export interface CommandDefinition {
  /** `<ドメイン>.<動作>` 形式の一意なID。 */
  readonly id: string
  /** UI・ドキュメントに出す日本語ラベル。 */
  readonly label: string
  /** 分類（ドキュメントの見出しになる）。 */
  readonly category: string
  /**
   * 割り当てキー（tinykeys 記法）。`KeyboardEvent.key` と `KeyboardEvent.code` のどちらでも書ける。
   * 例: `'Tab'` / `'Shift+Tab'` / `'ArrowLeft'` / `'Space'`
   */
  readonly keys: readonly string[]
  /** 有効になる条件。 */
  readonly when: WhenCondition
}

/** 実行時に登録するコマンドの処理本体。 */
export type CommandHandler = (event: KeyboardEvent) => void
