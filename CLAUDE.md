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
npm run typecheck   # tsc -b --noEmit
npm run check-all   # typecheck + biome ci ← CIと同一基準
npm run fix-all     # biome check --write（lint自動修正 + 整形 + import整理）
```

変更を終えたら必ず `npm run check-all` を通す。`biome ci --error-on-warnings` なので warning もCIを落とす。

型チェックは **`tsc -b`（プロジェクト参照を辿る）で実行する**。ルートの [tsconfig.json](tsconfig.json) は
`files: []` + `references` なので、`tsc --noEmit` にすると src を1ファイルも検査せずに成功してしまう。

### TypeScript 7 について

Go 実装のネイティブコンパイラ。CLI の型チェックが 5.9 比で約3倍速い（キャッシュなしで 1.98s → 0.67s）。
移行にあたって知っておくべき制約:

- **`baseUrl` は削除された**（TS5102）。`paths` は tsconfig からの相対で解決されるので `baseUrl` なしで書く
- **パッケージに `tsserver.js` / `typescript.js` が含まれない**。同梱されるのは `tsc.js` と
  プラットフォーム別のネイティブバイナリだけ。そのため
  - VSCode の `typescript.tsdk` にこの `lib` を指定できない → **エディタの IntelliSense は VSCode 内蔵の
    TypeScript（5.x 系）が担当し、CLI とはバージョンが分かれる**
  - Compiler API（`import ts from 'typescript'`）に依存するツールは動かない。導入する前に確認すること
  - このプロジェクトのツールチェーン（Vite / Vitest / Biome）はいずれも TS の Compiler API を使わないため影響はない

## 技術スタック

React 19 / TypeScript 7 / Redux Toolkit 2.12 + Redux Persist / Tailwind CSS 4（`@tailwindcss/vite`）/ Motion 13（`motion/react`）/ Vite 8 / Vitest 4 + jsdom 30 / Biome 2.5 / mise / CircleCI / Vercel

Tailwind は v4 系で、**設定ファイルを持たない**。[src/index.css](src/index.css) の `@import 'tailwindcss'` が起点で、
テーマを拡張するなら CSS 側の `@theme` を使う。`tailwind.config.js` と `postcss.config.js` は削除済み（v4 は
`@config` を書かない限り config ファイルを読まないため、置いても効かない）。PostCSS は経由せず
`@tailwindcss/vite` プラグインで直接処理する。

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

### import

`src` 配下は `@/` エイリアスで参照する。親を遡る相対 import（`../../store` など）は書かない。
同一ディレクトリ内の `./` は可。

エイリアスの定義箇所は [vite.config.ts](vite.config.ts)（`resolve.alias`）と
[tsconfig.app.json](tsconfig.app.json)（`paths`）の2つ。[vitest.config.ts](vitest.config.ts) は
`mergeConfig` で vite の設定を継承しているので、そこに定義を書き足さない。

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

Vitest + jsdom。`__tests__/` を対象ファイルの隣に置く（[tasksSlice の例](src/store/slices/__tests__/tasksSlice.test.ts)）。

**BDD スタイルで書く。**

- `context`（`describe` の alias。[setup.ts](src/test/setup.ts) で注入、import 不要）で「ある状態のとき」を表す
- `let` + `beforeEach` で default setup を作り、各 context では**差分だけ**上書きする
- `const subject = () => ...` でテスト対象を固定する
- `context` 名は実装の説明ではなく**引数・状態**で書く（`with 存在しない id` / `with created_at=25時間前`）
- `it` は短い日本語で結論を書く（`そのまま` / `末尾に追加`）。1行で書けるなら1行に
- 並び順は **成功 → 失敗 → 特殊ケース**
- フィルタ系の default には**境界の両側を混在**させる。削除対象と非対象を両方置けば、default のテスト1つで
  「何が残るか」＝関数の本質が見える

**テストデータは [taskFactory](src/test/factories/task.ts)（fishery + faker）を使う。**

- trait は作らず `taskFactory.build({ ... })` の overrides でテスト側に差分を書く
- faker は `faker.seed(12345)` で決定論。ただし**時刻に依存するテストでは `created_at` を必ず明示的に
  override する**（[hoursAgo](src/test/helpers.ts) を使う）。ランダム日時のままだと24時間境界で不安定になる

**カバレッジ計測は `.ts` のみ**（`*.tsx` は対象外）。これは component をテストしないという意味ではなく、
カバレッジ数値に引きずられて JSX の分岐網羅テストを増やさないための選択。component は behavior 駆動で書き、
分岐の多いロジックは `*-helpers.ts` に抽出して unit test で覆う。閾値の強制は未設定（最終的に中核ロジック100%を目指す）。

未整備なのはコンポーネントテストとE2E。埋める順序は中核ルールから: `cleanupExpiredTasks`（24時間削除）、
`toggleExecuting`（単一実行の保証）、REHYDRATE 時の正規化。

なお `context` を alias にしている都合で Biome の `noDuplicateTestHooks` が誤検知するため、このルールは off にしてある。

## CI / デプロイ

- [.circleci/config.yml](.circleci/config.yml): `cimg/base` 上で mise を入れ、`mise.toml` から Node.js を解決する。**Nodeバージョンの定義箇所は `mise.toml` の1箇所だけ**なので、CI設定にバージョンを書き足さない
- `test` ジョブ: typecheck → lint:strict（`biome ci`）→ test → build
- `security-scan` ジョブ: `npm audit` / `npm outdated`（main と毎日UTC 2時）
- デプロイは Vercel の GitHub 連携。リポジトリ内にデプロイ用ワークフローはない

## その他

- **redux-persist は `es/` 配下から import する**（`redux-persist/es/storage`、`redux-persist/es/constants`）。
  `lib/` は CommonJS で、Vite 8（Rolldown）の CJS interop が `export default require_storage()` という
  二重ラップを生むため、`storage.getItem is not a function` で起動時に落ちる。
  パッケージ本体（`from 'redux-persist'`）と `integration/react` は `module` フィールドがあるので
  そのままで ESM 版が使われる
- UUID の生成・検証は [utils/uuid.ts](src/utils/uuid.ts) の `generateUUID()` / `isUUID()` を使う。
  `crypto.randomUUID()` を直接呼ばない — セキュアコンテキスト（HTTPS / localhost）でしか使えず、
  LAN の IP 経由で開発サーバーに繋いだ実機確認時に落ちるため、`crypto.getRandomValues()` による
  フォールバックを持たせてある
- Google Analytics は [analytics.ts](src/utils/analytics.ts) 経由。localhost とプライベートIPでは送信しない。計測イベントを増やすときもここに追加する
- 調査メモ・レポート・一時ファイルは `.local/` に書き出す（gitignore 済み）。リポジトリのルートやコミット対象を汚さない
- コミットは行わない（ユーザーが手動で行う）
