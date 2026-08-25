import type { CommandDefinition, Scope } from '@/lib/keybindings/types'

/** スコープの表示名。ドキュメント生成と UI 表示で共用する。 */
export const SCOPE_LABELS: Record<Scope, string> = {
  global: '全モード',
  create: '作成',
  classify: '分類',
  list: '一覧',
  execute: '実行',
}

/**
 * アプリ全体のキーボードショートカット（コマンド）一覧。
 *
 * このファイルが全コマンドの唯一の定義元。`docs/KEY_BINDINGS.md` は
 * `npm run docs:keybindings` でここから自動生成される。
 *
 * 追加時の手順:
 * 1. `id` は `<ドメイン>.<動作>` 形式で一意にする（例: `execute.complete`）
 * 2. `when` に有効なモードを書く（全モード共通なら `'global'`）
 * 3. コンポーネント側で `useCommandHandler(id, fn)` を呼んでハンドラを登録する
 * 4. `npm run docs:keybindings` でドキュメントを更新する
 *
 * キーは tinykeys 記法。`KeyboardEvent.key` と `code` のどちらでも書ける。
 * フォーム入力中・IME変換中・キーリピートの除外は tinykeys 側が行うので、ここでは考慮しない。
 */
export const COMMANDS = [
  // --- モード切り替え（全モード共通） ---
  {
    id: 'mode.next',
    label: '次のモードへ',
    category: 'モード切り替え',
    keys: ['Tab'],
    when: 'global',
  },
  {
    id: 'mode.prev',
    label: '前のモードへ',
    category: 'モード切り替え',
    keys: ['Shift+Tab'],
    when: 'global',
  },

  // --- 分類モード（WASD と矢印キーで4方向に振り分ける） ---
  {
    id: 'classify.work',
    label: '仕事に分類',
    category: '分類',
    keys: ['a', 'ArrowLeft'],
    when: 'classify',
  },
  {
    id: 'classify.life',
    label: '生活に分類',
    category: '分類',
    keys: ['d', 'ArrowRight'],
    when: 'classify',
  },
  {
    id: 'classify.study',
    label: '学習に分類',
    category: '分類',
    keys: ['w', 'ArrowUp'],
    when: 'classify',
  },
  {
    id: 'classify.hobby',
    label: '趣味に分類',
    category: '分類',
    keys: ['s', 'ArrowDown'],
    when: 'classify',
  },

  // --- 実行モード ---
  {
    id: 'execute.complete',
    label: '実行中タスクを完了',
    category: '実行',
    keys: ['Space'],
    when: 'execute',
  },
  {
    id: 'execute.switchToWork',
    label: '仕事のタスクに切り替え',
    category: '実行',
    keys: ['1'],
    when: 'execute',
  },
  {
    id: 'execute.switchToLife',
    label: '生活のタスクに切り替え',
    category: '実行',
    keys: ['2'],
    when: 'execute',
  },
  {
    id: 'execute.switchToStudy',
    label: '学習のタスクに切り替え',
    category: '実行',
    keys: ['3'],
    when: 'execute',
  },
  {
    id: 'execute.switchToHobby',
    label: '趣味のタスクに切り替え',
    category: '実行',
    keys: ['4'],
    when: 'execute',
  },
] as const satisfies readonly CommandDefinition[]

/** `COMMANDS` に定義済みのコマンドID。存在しないIDを渡すとコンパイルエラーになる。 */
export type CommandId = (typeof COMMANDS)[number]['id']
