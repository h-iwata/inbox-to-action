# CLAUDE.md

24時間でタスクが消えるやることリスト。React + TypeScript + Redux Toolkit のクライアント完結型SPA（バックエンドなし）。
Inbox → 分類 → 実行 → 完了 のワークフローを、4つの固定カテゴリ（仕事・生活・学習・趣味）で回す。

## コマンド

```bash
mise install        # Node.js を mise.toml (24.15.0) に同期。初回は mise trust も必要
npm ci              # 依存関係を lock どおりに導入

npm run dev         # 開発サーバー
npm run build       # tsc -b && vite build
npm run test -- --run   # テスト単発実行（引数なしの npm run test は watch）
npm run check-all   # typecheck + biome ci ← CIと同一基準
npm run fix-all     # biome check --write（lint自動修正 + 整形 + import整理）
```

変更を終えたら必ず `npm run check-all` を通す。`biome ci --error-on-warnings` なので warning もCIを落とす。

## 技術スタック

React 19 / TypeScript 5.9 / Redux Toolkit 2.11 + Redux Persist / Tailwind CSS 4（`@tailwindcss/postcss`）/ Framer Motion 12 / Vite 7 / Vitest 4 + jsdom / Biome 2.5 / mise / CircleCI / Vercel

Tailwind は v4 系。設定はCSS側の `@import 'tailwindcss'` が主で、`tailwind.config.js` に v3 流のユーティリティ定義を足そうとしないこと。

## アーキテクチャ

### State（[src/store/index.ts](src/store/index.ts)）

```typescript
RootState {
  tasks: {                          // persist対象（whitelist は tasks のみ）
    lists: Record<Category, Task[]> // inbox / work / life / study / hobby
    completed: Task[]
    dailyStats: { created, classified, completed }
  }
  ui:          { currentMode, scrollToCategory }  // 永続化されない
  keyBindings: { bindings }                       // 永続化されない
}
```

- `ui` と `keyBindings` はリロードで初期化される。永続化したい状態を足すなら whitelist を変更する
- セレクターは `createSelector` でメモ化する（[tasksSlice.ts](src/store/slices/tasksSlice.ts) の既存実装に合わせる）

### モードベースUI

`ui.currentMode`（`create` / `classify` / `list` / `execute`）で表示を差し替える単一画面（[src/App.tsx](src/App.tsx)）。モード固有のUIは `src/features/<mode>/` に置く。

### ディレクトリ

| パス                                                    | 内容                                       |
| ------------------------------------------------------- | ------------------------------------------ |
| `src/features/{create,classify,list,execute}/`          | モード固有のコンポーネント                 |
| `src/components/Layout/`                                | Header、ModeNavigator                      |
| `src/store/slices/`                                     | tasks / ui / keyBindings                   |
| `src/store/listenerMiddleware.ts`                       | window の keydown 購読（モード切り替え）   |
| `src/hooks/`、`src/config/`、`src/types/`、`src/utils/` | useResponsive、アイコン定義、型、analytics |

## 守るべき不変条件

**タスクの並び順は配列そのもの。** `order` フィールドは存在しない。並べ替えは `moveTaskToTop`（最上位への移動）だけを提供し、任意の並べ替えUIは追加しない。

**`isExecuting` はアプリ全体で常に1つだけ。** 立てられるのはカテゴリの先頭タスクのみで、inbox のタスクには立てられない。フラグを操作する処理を書くときは `clearExecutingFlags` / `setFirstTaskAsExecuting` を経由し、直接代入しない。

**24時間ルールに例外を作らない。** `created_at` から24時間で削除。完了済みタスクも対象。判定は `cleanupExpiredTasks` に集約し、起動時と5分間隔で dispatch される。

**localStorage の内容を信頼しない。** REHYDRATE 時に `normalizeTask` / `normalizeDailyStats` で型を矯正している。`Task` や `dailyStats` のスキーマを変えたら、この正規化も必ず更新する。

**キーバインドの定義元は [keyBindingsSlice.ts](src/store/slices/keyBindingsSlice.ts) のみ。** 現状は Tab/Shift+Tab（モード切替）、W/A/S/D と矢印キー（分類）、Space（完了）、1〜4（実行モードのカテゴリ切替）。キー処理をコンポーネントに直書きせず、スライスにアクションを足して参照する。デスクトップ（768px以上）専用で、入力欄フォーカス中は無効。

## Lint / Format

ESLint + Prettier ではなく **Biome** に統一している。設定は [biome.json](biome.json) の1ファイルのみ。

- `biome check` が lint・フォーマット・import整理を兼ねる。ESLint や Prettier を再導入しない
- 例外を作るときは `// biome-ignore lint/<rule>: <理由>` で局所的に抑制する。理由の記述は必須（Biomeが空の理由を拒否する）
- 無効化しているルールと理由:
  - `a11y/noStaticElementInteractions`、`a11y/useKeyWithClickEvents` — ドラッグ/スワイプ前提のカードUIを `div` で実装しているため。キーボードからの操作は keyBindings 側で提供している
  - `correctness/useExhaustiveDependencies` — 既存実装が依存配列を意図的に絞っているため
  - `index.html` は Google Analytics の公式スニペットを含むので `overrides` で lint 対象外（フォーマットのみ適用）
- a11y ルールを増やすより、`AboutModal` を Radix Dialog に置き換える方が本質的な改善になる（未着手）

## UI上の制約

- レスポンシブ判定は `useResponsive`（768px未満をモバイル）。モバイルは `ModeNavigator` を下部、デスクトップは上部に置く**単一カラム**構成（分割ビューではない）
- 常時ダークテーマ。ライトテーマ切り替えは未実装
- `React.memo` と仮想スクロールは未導入。パフォーマンス最適化を入れるなら計測してから

## テスト

現状は reducer とユーティリティの単体テストのみ（[tasksSlice.test.ts](src/store/slices/tasksSlice.test.ts) / [dateHelpers.test.ts](src/utils/dateHelpers.test.ts)、計10テスト）。コンポーネントテストとE2Eは未整備。

テストを足すなら、まず中核ルールから: `cleanupExpiredTasks`（24時間削除）、`toggleExecuting`（単一実行の保証）、REHYDRATE時の正規化。

## CI / デプロイ

- [.circleci/config.yml](.circleci/config.yml): `cimg/base` 上で mise を入れ、`mise.toml` から Node.js を解決する。**Nodeバージョンの定義箇所は `mise.toml` の1箇所だけ**なので、CI設定にバージョンを書き足さない
- `test` ジョブ: typecheck → lint:strict（`biome ci`）→ test → build
- `security-scan` ジョブ: `npm audit` / `npm outdated`（main と毎日UTC 2時）
- デプロイは Vercel の GitHub 連携。リポジトリ内にデプロイ用ワークフローはない

## その他

- Google Analytics は [analytics.ts](src/utils/analytics.ts) 経由。localhost とプライベートIPでは送信しない。計測イベントを増やすときもここに追加する
- 調査メモ・レポート・一時ファイルは `.local/` に書き出す（gitignore 済み）。リポジトリのルートやコミット対象を汚さない
- コミットは行わない（ユーザーが手動で行う）
