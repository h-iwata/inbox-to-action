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
npm run docs:keybindings   # src/config/commands.ts から docs/KEY_BINDINGS.md を生成
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

React 19 / TypeScript 7 / Zustand 5 + immer / Tailwind CSS 4（`@tailwindcss/vite`）/ Motion 13（`motion/react`）/ tinykeys 4 / valibot 1 / Radix UI / Vite 8 / Vitest 4 + jsdom 30 / Biome 2.5 / mise / CircleCI / Vercel

Tailwind は v4 系で、**設定ファイルを持たない**。[src/index.css](src/index.css) の `@import 'tailwindcss'` が起点で、
テーマを拡張するなら CSS 側の `@theme` を使う。`tailwind.config.js` と `postcss.config.js` は削除済み（v4 は
`@config` を書かない限り config ファイルを読まないため、置いても効かない）。PostCSS は経由せず
`@tailwindcss/vite` プラグインで直接処理する。

## アーキテクチャ

### State

Zustand のストアを2つ持つ。**ひとつの巨大なストアにまとめない。**

```typescript
// useTasksStore（localStorage に永続化）
{
  lists: Record<Category, Task[]>   // inbox / work / life / study / hobby
  completed: Task[]
  dailyStats: { created, classified, completed }
  actions: { addTask, deleteTask, completeTask, ... }   // 保存対象外
}

// useUIStore（永続化しない。リロードで作成モードに戻る）
{
  currentMode, scrollToCategory
  actions: { setMode, setModeWithScroll, clearScrollToCategory }
}
```

**責務を3層に分けている。**

| ファイル | 責務 |
|---|---|
| [taskMutations.ts](src/store/taskMutations.ts) | 状態遷移の純粋ロジック。**ストア実装に依存しない**（Immer の draft を受け取る形） |
| [taskSelectors.ts](src/store/taskSelectors.ts) | 派生値の計算。同じくストア非依存 |
| [tasksStore.ts](src/store/tasksStore.ts) | mutation の呼び出しと計測イベントの送信だけを行う薄い配線 |

こうしてある理由は、**状態遷移のテストをストアの API に縛られない形で書くため**。
ロジックをストアに直接書くと、ストアを差し替えるたびにテストも書き直しになる。

守るべきこと:

- **すべての mutation は戻り値を持たない**。Immer の producer は値を返すとエラーになるため、
  戻り値があると呼び出し側でブロック文にする必要が生じて事故りやすい。
  計測などで変更前の情報が要るときは、`set` の前に `taskSelectors` で取得する
- **アクションは `actions` オブジェクトにまとめる**。参照が安定するので
  `useTasksStore(state => state.actions)` で購読しても再レンダリングを誘発しない
- **新しい配列やオブジェクトを返すセレクターは `useShallow` で包む**
  （[useTasks.ts](src/store/useTasks.ts) の実装に倣う）。包まないと値が同じでも毎回再レンダリングされる
- 永続化の対象は `partialize` で明示する。`ui` を永続化したくなったら `useUIStore` に persist を足す
  （tasks 側に混ぜない）

### モードベースUI

`ui.currentMode`（`create` / `classify` / `list` / `execute`）で表示を差し替える単一画面（[src/App.tsx](src/App.tsx)）。モード固有のUIは `src/features/<mode>/` に置く。

### ディレクトリ

| パス                                                    | 内容                                       |
| ------------------------------------------------------- | ------------------------------------------ |
| `src/features/{create,classify,list,execute}/`          | モード固有のコンポーネント（`index.ts` が公開境界） |
| `src/components/Layout/`                                | Header、ModeNavigator                      |
| `src/components/ui/`                                    | 汎用UIコンポーネント（Dialog）             |
| `src/store/tasksStore.ts`、`src/store/uiStore.ts`       | Zustand ストア（薄い配線）                 |
| `src/store/taskMutations.ts`                            | 状態遷移の純粋ロジック                     |
| `src/store/taskSelectors.ts`、`src/store/useTasks.ts`   | 派生値の計算と購読フック                   |
| `src/store/persistSchema.ts`                            | 復元データの検証スキーマ（valibot）        |
| `src/store/migrateLegacyStorage.ts`                     | 旧 redux-persist データの移行（一度きり）  |
| `src/lib/keybindings/`                                  | コマンドレジストリ（tinykeys ブリッジ）    |
| `src/config/commands.ts`                                | 全ショートカットの定義元                   |
| `scripts/`、`docs/`                                     | ドキュメント生成スクリプトとその生成物     |
| `src/hooks/`、`src/config/`、`src/types/`、`src/utils/` | useResponsive、アイコン定義、型、analytics |

### feature の境界

[Bulletproof React](https://github.com/alan2207/bulletproof-react) の feature-based architecture に従う。

- **外部から feature を使うときは必ずバレル（`@/features/<name>`）経由**。内部ファイルへの直接参照は
  Biome の `style/noRestrictedImports` がエラーにする（規約を口約束にせず lint で守らせる）
- feature 内部のファイル同士は相対 import（`./ClassifyOverlay`）でよい
- **feature 間では import しない**。共有が必要になったら `components/` / `hooks/` / `lib/` に昇格させる
- feature に新しい公開物を足したら `index.ts` に export を追加する

### ロジックの抽出

分岐が3つ以上ある純粋ロジックは、コンポーネントから `*-helpers.ts` に切り出す。

- `.ts` なのでカバレッジ計測の対象に残り、component 側は「helper を呼ぶだけ」になる
- しきい値などのマジックナンバーは helper 側に名前付き定数として置く
  （例: [swipe-helpers.ts](src/features/list/swipe-helpers.ts) の `SWIPE_ACTION_THRESHOLD_PX`）
- 既存の例: [classify-helpers.ts](src/features/classify/classify-helpers.ts)（ドラッグ方向の判定）、
  [swipe-helpers.ts](src/features/list/swipe-helpers.ts)（スワイプ判定）、
  [completion-helpers.ts](src/components/CategoryCompletionBar/completion-helpers.ts)（レベル算出）、
  [app-helpers.ts](src/app-helpers.ts)（操作ヒント）
- **JSX が大きいだけのファイルは helper では小さくならない**（`ExecuteMode` が該当）。
  分割するなら `features/<name>/ui/` に UI コンポーネントとして切り出すが、
  回帰を検出できるコンポーネントテストを用意してから行うこと

### import

`src` 配下は `@/` エイリアスで参照する。親を遡る相対 import（`../../store` など）は書かない。
同一ディレクトリ内の `./` は可。

エイリアスの定義箇所は [vite.config.ts](vite.config.ts)（`resolve.alias`）と
[tsconfig.app.json](tsconfig.app.json)（`paths`）の2つ。[vitest.config.ts](vitest.config.ts) は
`mergeConfig` で vite の設定を継承しているので、そこに定義を書き足さない。

## 守るべき不変条件

不変条件はすべて [taskMutations.ts](src/store/taskMutations.ts) が担保する。コンポーネントや
ストアの配線側で状態を直接いじらない。

**タスクの並び順は配列そのもの。** `order` フィールドは存在しない。並べ替えは `moveTaskToTop`（最上位への移動）だけを提供し、任意の並べ替えUIは追加しない。

**`isExecuting` はアプリ全体で常に1つだけ。** 立てられるのはカテゴリの先頭タスクのみで、inbox のタスクには立てられない。フラグを操作する処理を書くときは `clearExecutingFlags` / `setFirstTaskAsExecuting` を経由し、直接代入しない。

**24時間ルールに例外を作らない。** `created_at` から24時間で削除。完了済みタスクも対象。判定は `cleanupExpiredTasks` に集約し、起動時と5分間隔で dispatch される。

**localStorage の内容を信頼しない。** 復元時（persist の `merge`）に [persistSchema.ts](src/store/persistSchema.ts) の
valibot スキーマで型を矯正している。壊れた値は例外を投げずに `fallback` で既定値へ倒す
（データが読めなくてもアプリは起動する方を選ぶ）。

- `Task` や `DailyStats` のスキーマを変えたら、このスキーマも必ず更新する
- **スキーマの責務は型の矯正まで**。24時間ルールや `isExecuting` の単一性のような状態の整合性は
  reducer 側の責務なので、スキーマに持ち込まない
- カテゴリと status の一覧は [types/Task.ts](src/types/Task.ts) の `CATEGORIES` / `TASK_STATUSES` が
  型と値の単一の真実。`v.picklist` はここから引く

**キーバインドの定義元は [src/config/commands.ts](src/config/commands.ts) のみ。** VS Code 風のコマンドレジストリ方式で、
定義（キー・ラベル・有効スコープ）と実装（ハンドラ）を分離している。

- コマンドを足すときは `COMMANDS` に定義を書き、コンポーネント側で `useCommandHandler(id, fn)` を呼ぶ。
  **`window.addEventListener('keydown', ...)` をコンポーネントに直接書かない**
- `id` は `COMMANDS` から型が引かれるので、存在しないIDを渡すとコンパイルエラーになる
- `when` に有効なモードを書く（全モード共通なら `'global'`）。スコープ判定は [use-keybindings.ts](src/lib/keybindings/use-keybindings.ts) が行う
- 実際にキーへ接続するのは `useKeybindings()`。**[App.tsx](src/App.tsx) で1回だけ呼ぶ**
- ハンドラ未登録のコマンドは発火しない。「このモードではこの操作を有効にしない」は登録の有無で制御する
- デスクトップ（768px以上）専用。入力欄フォーカス中・IME変換中・キーリピート中に発火しないのは
  **tinykeys 側の既定動作**なので、自前で判定を書かない
- コマンドを変更したら `npm run docs:keybindings` で [docs/KEY_BINDINGS.md](docs/KEY_BINDINGS.md) を再生成する

## Lint / Format

ESLint + Prettier ではなく **Biome** に統一している。設定は [biome.json](biome.json) の1ファイルのみ。

- `biome check` が lint・フォーマット・import整理を兼ねる。ESLint や Prettier を再導入しない
- 例外を作るときは `// biome-ignore lint/<rule>: <理由>` で局所的に抑制する。理由の記述は必須（Biomeが空の理由を拒否する）
- 無効化しているルールと理由:
  - `a11y/noStaticElementInteractions`、`a11y/useKeyWithClickEvents` — ドラッグ/スワイプ前提のカードUIを `div` で実装しているため（[ClassifyMode](src/features/classify/ClassifyMode.tsx) / [ExecuteMode](src/features/execute/ExecuteMode.tsx) / [ListMode](src/features/list/ListMode.tsx) / [SwipeableTaskCard](src/features/list/SwipeableTaskCard.tsx) の計7箇所）。キーボードからの操作はコマンドレジストリ側で提供している
  - `correctness/useExhaustiveDependencies` — 既存実装が依存配列を意図的に絞っているため
  - `index.html` は Google Analytics の公式スニペットを含むので `overrides` で lint 対象外（フォーマットのみ適用）
  - `suspicious/noDuplicateTestHooks` — `context` を `describe` の alias にしているため誤検知する
- クリックのみの箇所（ExecuteMode / ListMode）は `button` 要素に置き換えれば違反を減らせる。ドラッグ・スワイプ前提の2箇所は構造上残る

## UIコンポーネント

汎用UIは [src/components/ui/](src/components/ui/) に置く。**shadcn/ui の CSS 変数によるテーマ機構は導入していない**
（常時ダークテーマなので不要）。配色は Tailwind のクラスを直接書く。

- モーダルは [Dialog](src/components/ui/Dialog.tsx)（Radix Dialog の薄いラッパー）を使う。
  フォーカストラップ・ESC・背景クリック・背景スクロール固定・aria 属性は Radix が担当するので**自前で実装しない**
- **ダイアログを開いている間、アプリのショートカットは無効になる**
  （[use-keybindings.ts](src/lib/keybindings/use-keybindings.ts) の `shouldIgnoreEvent` が `[role="dialog"]` 配下を無視する）。
  Radix はフォーカスを閉じ込めるが tinykeys は window で購読しているため、この処理がないと Tab がアプリ側に届く
- `class-variance-authority` / `tailwind-merge` は入れていない。ボタン等は個別のスタイルが強く、
  バリアントに切り出す利点が薄いため。必要になった時点で導入する

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

**カバレッジは `.ts` のみを計測し、100% を維持する**（`npm run test:coverage`。CI でも強制される）。

- `*.tsx` は計測対象外。component をテストしないという意味ではなく、**カバレッジ数値に引きずられて
  JSX の分岐網羅テストを増やさない**ための選択。component は behavior 駆動で書き、分岐の多いロジックは
  `*-helpers.ts` に抽出して unit test で覆う
- **新しい `.ts` を追加したらテストも書く**。100% を割ると CI が落ちる
- 到達不能な防御分岐だけ `/* v8 ignore next -- 理由 */` で個別に除外する（濫用しない）。
  現在の唯一の例は [migrateLegacyStorage.ts](src/store/migrateLegacyStorage.ts) の `localStorage` 未定義チェック
- テストできない設計になっていたら、まずロジックを純粋関数に切り出す。
  `taskMutations` / `taskSelectors` / `*-helpers.ts` がその形

**component は Integration テストで behavior を検証する**（カバレッジ対象外なので数を追わない）。

- 書くもの: interaction を持つ component（1〜2シナリオ）、feature 全体の縦串
- 書かないもの: 純表示 component、分岐網羅を目的にしたテスト
- **DOM 構造に強く依存するクエリは避ける**。同じ文言が複数箇所に出る画面が多いので、
  `getByText` で複数マッチして落ちるより `getAllByText` か role ベースのクエリを選ぶ。
  それでも不安定なら、そのシナリオは書かない（ロジックを helper に切り出して unit test で覆う）
- アニメーション待ちがある操作（完了ボタンなど）は `waitFor` で待つ。fake timers と userEvent の併用は避ける
- 既存の縦串テスト: [App.test.tsx](src/__tests__/App.test.tsx)（作成 → 分類 → 実行 → 完了、
  キーボードでのモード遷移、入力中はショートカットが無効）

未整備なのは E2E（実ブラウザでの通し確認）。

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
