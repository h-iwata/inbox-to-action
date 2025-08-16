# InboxToAction アプリ仕様書

## 1. 概要
日常で思いついたタスクのアイディアを気軽に入力し、分類し、順序を決定し、完了できるアプリ。
GTD的な Inbox → 分類 → 実行 → 完了 の流れを採用。

### コアコンセプト
- **シンプルで継続しやすい**設計
- **モード切替型**UI（作成・分類・一覧・実行）
- **24時間制限**による強制的なフレッシュ
- **ワンタップ操作**中心のUX(モバイル)
- **キー操作**中心のUX(PC)
- **ダークモード**による目に優しいデザイン

## 2. タスク管理ルール

### 基本ルール
- タスクは24時間以内に更新がない場合に自動削除
- **各カテゴリの最上位タスク（order=1）は時間無制限**
- **実行中タスクは全体で1つのみ**（他はorder=1でも一時停止中）
- **Inboxに追加されるタスクは実行フラグなし**
- カテゴリ分類または順序変更時にタスクの残り時間はリセット
- 順序変更はドラッグ＆ドロップで自由に可能（同一カテゴリ内での並び替え、カテゴリ間の移動を自動判定）

### カテゴリ設定
4つのカテゴリを固定（ダークモード用のミューテッドジュエルトーン）：
- 🏢 仕事（Sky-800: 落ち着いた青）
- 🏠 生活（Teal-800: 深い青緑）  
- 📚 学習（Violet-800: 深い紫）
- 🎮 趣味（Pink-800: 柔らかいピンク）

※MVP版ではカテゴリ名とアイコンの変更機能は含まない

## 3. モード詳細

### 3.1 作成モード
**目的**: 思いついたアイデアを素早く入力

#### UI仕様
- **タスクなし時**: 画面の60-70%を占める巨大インプットボックス
- **タスクあり時**: 上部にコンパクト入力エリア + 下部にタスクリスト
- プレースホルダー: 「今日やりたいことは？」
- エンターキーで即座に追加
- 新タスクは上からスライドイン表示

#### 機能
- 文字数制限: 100文字
- 空文字は追加不可
- 自動保存（Redux Persistによるローカルストレージ保存）
- タスク削除機能（×ボタン）
- **新規タスクは常に実行フラグなしで追加**

### 3.2 分類モード
**目的**: Inboxのタスクを4カテゴリに素早く分類

#### レイアウト
```
上部：4方向カテゴリ配置
      [📚 学習]
         ↑
[🏢 仕事] ← → [🏠 生活]
         ↓  
      [🎮 趣味]
      
下部：現在のタスク + 次のタスク一覧
```

#### 操作方法
**PC（キーボード）**
- `W/↑`: 学習, `A/←`: 仕事, `S/↓`: 趣味, `D/→`: 生活
- `Space`: スキップ（後で分類）

**モバイル（タッチ）**
- タップ：該当カテゴリに分類
- 上下左右フリック：対応方向のカテゴリに分類
- 長押し：スキップ

#### インタラクション
1. 選択したカテゴリが一瞬光る
2. 現在のタスクが選択方向にスライドアウト
3. 次のタスクが下からスライドイン（0.3秒）
4. 全タスク分類完了で自動モード遷移

### 3.3 一覧モード
**目的**: カテゴリごとのタスク表示・優先順位調整

#### 表示内容（全カテゴリ縦並び）
各カテゴリセクション：
- **最上位タスク（order=1）**: 
  - 実行中：「🔥 実行中」ラベル、オレンジ色強調
  - 一時停止中：「⏸️ 一時停止」ラベル、グレー色
  - 時間制限なし（∞マーク）
- **その他のタスク**: 残り時間表示（6h以下で赤文字警告）

#### 操作
- **タスククリック**: 
  - order=1のタスク：実行中/一時停止の切り替え（全体で1つのみ実行中）
  - その他のタスク：そのタスクを最上位（order: 1）に移動
- **ドラッグ＆ドロップ**: 
  - ドロップ位置により自動判定（Alt+ドラッグ不要）
  - 同じカテゴリ内へドロップ：順序変更
  - 異なるカテゴリへドロップ：カテゴリ移動
  - order=1のタスクを順序変更すると実行フラグがリセット
- **右クリック/長押し**: タスク削除

#### 統計情報表示（最下部）
- 今日の活動（作成・分類・完了件数）
- 週間統計（完了率・生産性）
- カテゴリ別完了数
- 最も活発な時間帯

### 3.4 実行モード
**目的**: 各カテゴリのorder=1タスクを表示、実行中タスクを完了

#### 表示
- 各カテゴリのorder=1タスクを表示（最大4つ）
- 実行中タスク：「🔥 実行中」表示、完了ボタン有効
- 一時停止中タスク：「⏸️ 一時停止中」表示、クリックで実行開始、完了ボタン非表示
- **PC**: 2×2グリッドレイアウト
- **モバイル**: 縦スクロール

#### 完了機能
- **実行中タスクのみ完了可能**（一時停止中は完了ボタンが非表示）
- **PC**: 1-4キーまたは「✓完了」ボタンクリック
- **モバイル**: 「✓完了」ボタンタップ
- **完了後**: 同じカテゴリの次のタスク（order=2）が自動的にorder=1になり、実行中フラグが設定される

## 4. UI設計

### 4.1 レスポンシブ対応
- **768px以下**: モバイルUI（全画面モード切替）
- **769px以上**: PC UI（分割表示）

### 4.2 PC版レイアウト
- **左側70%**: メイン作業エリア
- **右側30%**: サブ情報エリア（統計・履歴・次タスク予告）
- **上部**: モード切替タブ
- **ホットキー対応**: Tab（モード切替）、Enter（追加）、1-4（完了）、WASD（分類）

### 4.3 共通デザイン要素
- **ダークモード**（Gray-900ベースの背景）
- **アニメーショングラデーションヘッダー**（Violet-400 → Cyan-400のグラデーション）
- 大きなボタンサイズ（PC/モバイル共通）
- スライドイン/アウトアニメーション
- カテゴリごとのミューテッドジュエルトーン色分け
- 直感的なアイコン使用

## 5. データ構造

```typescript
interface Task {
  id: string
  title: string
  category: 'work' | 'life' | 'study' | 'hobby' | 'inbox'
  createdAt: string  // ISO8601
  updatedAt: string  // ISO8601
  order: number
  isExecuting?: boolean  // 実行中フラグ（全体で1つのみtrue）
}
```

### データ管理ルール
- **時間制限判定**: 最上位タスク（order: 1）は削除対象外、その他は`updatedAt`から24時間で削除
- **順序管理**: `order`フィールドで管理、最上位移動時は他タスクの順序を自動調整
- **実行フラグ管理**: 全カテゴリを通じて1つのタスクのみ`isExecuting: true`
- **完了タスク**: 即座に削除、次のタスクを自動繰り上げ

## 6. 技術仕様

### MVP版（実装済み）
- **フレームワーク**: React 18 + TypeScript
- **状態管理**: Redux Toolkit + Redux Persist
- **スタイリング**: Tailwind CSS v4（ダークモード）
- **ビルドツール**: Vite
- **データ保存**: ローカルストレージ（Redux Persist経由）
- **対応ブラウザ**: モダンブラウザ（Chrome, Firefox, Safari, Edge）

### 将来拡張
- Google OAuth + クラウド同期
- プッシュ通知
- オフライン対応
- 見積もり時間フィールド追加

## 7. 実装優先度

### Phase 1 (MVP) ✅ 完了
1. ✅ 基本的なタスクCRUD
2. ✅ 4モードの実装（作成・分類・一覧・実行）
3. ✅ Redux Persistによるローカルストレージ保存
4. ✅ レスポンシブUI
5. ✅ 24時間自動削除機能
6. ✅ ダークモード実装
7. ✅ ドラッグ＆ドロップによる順序変更
8. ✅ 実行フラグ管理（全体で1つのみ）
9. ✅ タスク完了時の自動繰り上げ

### Phase 2 (機能拡張)
1. 統計情報詳細化
2. アニメーション強化
3. キーボードショートカット
4. エクスポート機能

### Phase 3 (本格運用)
1. クラウド同期
2. マルチデバイス対応
3. 通知機能
4. パフォーマンス最適化

## 8. 成功指標

### ユーザビリティ
- タスク作成から分類完了まで10秒以内
- 1日の継続使用率 > 70%
- エラー率 < 5%

### 機能指標
- 24時間以内のタスク処理率 > 80%
- カテゴリ分類精度（ユーザー満足度）
- 実行モード使用率

---

*最終更新: 2025年8月16日*
*MVP版完成*

# InboxToAction 開発計画書

## 1. 技術スタック

### フロントエンド
- **React** + **TypeScript**
- **Redux Toolkit** (状態管理)
- **Tailwind CSS** (スタイリング)
- **Vite** (ビルドツール)

### 状態管理詳細
- **Redux Toolkit** + **RTK Query** (将来のAPI連携用)
- **Redux Persist** (ローカルストレージ永続化)
- **Redux DevTools** (デバッグ)

### デプロイ・ホスティング
- **Vercel** (本番環境)
- **GitHub** (ソース管理)
- **GitHub Actions** (CI/CD)

### 開発ツール
- **ESLint** + **Prettier** (コード品質)
- **Vitest** (テスト)
- **Husky** (Git hooks)

## 2. プロジェクト構成

```
inboxtoaction/
├── public/
│   ├── favicon.ico
│   ├── manifest.json          # PWA設定
│   └── robots.txt
├── src/
│   ├── components/           # 再利用可能なコンポーネント
│   │   ├── ui/              # 基本UIコンポーネント
│   │   ├── TaskCard/
│   │   ├── TaskInput/
│   │   └── StatCard/
│   ├── features/            # 機能別コンポーネント
│   │   ├── create/
│   │   ├── classify/
│   │   ├── list/
│   │   └── execute/
│   ├── store/               # Redux関連
│   │   ├── index.ts
│   │   ├── slices/
│   │   │   ├── tasksSlice.ts
│   │   │   └── uiSlice.ts
│   │   └── middleware/
│   ├── hooks/               # カスタムフック
│   ├── utils/               # ユーティリティ関数
│   ├── types/               # TypeScript型定義
│   ├── constants/           # 定数
│   └── App.tsx
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 3. Redux Store 設計

### 3.1 State 構造
```typescript
interface RootState {
  tasks: TasksState
  ui: UIState
}

interface TasksState {
  items: Task[]
  filter: {
    category: Category | 'all'
    status: TaskStatus | 'all'
  }
  stats: {
    daily: DailyStats
    weekly: WeeklyStats
  }
}

interface UIState {
  currentMode: 'create' | 'classify' | 'list' | 'execute'
  isLoading: boolean
  error: string | null
  lastUpdated: string
}

interface Task {
  id: string
  title: string
  category: 'work' | 'life' | 'study' | 'hobby' | 'inbox'
  created_at: string
  updated_at: string
  order: number
  status: 'active' | 'done'
}
```

### 3.2 Slice 設計
```typescript
// tasksSlice.ts の主要アクション
interface TasksSlice {
  // CRUD操作
  addTask: (title: string) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  completeTask: (id: string) => void
  
  // 分類・並び替え
  classifyTask: (id: string, category: Category) => void
  moveToTop: (id: string) => void
  
  // バッチ操作
  cleanupExpiredTasks: () => void
  clearCompletedTasks: () => void
  
  // フィルタ・検索
  setFilter: (filter: TaskFilter) => void
  
  // 統計更新
  updateStats: () => void
}
```

## 4. コンポーネント設計

### 4.1 ページレベルコンポーネント
```typescript
// App.tsx
const App = () => {
  const currentMode = useSelector(selectCurrentMode)
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto">
        {currentMode === 'create' && <CreateMode />}
        {currentMode === 'classify' && <ClassifyMode />}
        {currentMode === 'list' && <ListMode />}
        {currentMode === 'execute' && <ExecuteMode />}
      </main>
      <ModeNavigator />
    </div>
  )
}
```

### 4.2 レスポンシブ対応
```typescript
// hooks/useResponsive.ts
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkDevice = () => setIsMobile(window.innerWidth < 768)
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])
  
  return { isMobile, isDesktop: !isMobile }
}
```

### 4.3 主要コンポーネント例
```typescript
// components/TaskCard/TaskCard.tsx
interface TaskCardProps {
  task: Task
  variant: 'create' | 'classify' | 'list' | 'execute'
  onComplete?: (taskId: string) => void
  onDelete?: (taskId: string) => void
  onMoveToTop?: (taskId: string) => void
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  variant, 
  onComplete,
  onDelete,
  onMoveToTop 
}) => {
  const dispatch = useDispatch()
  
  const handleComplete = () => {
    dispatch(completeTask(task.id))
    onComplete?.(task.id)
  }
  
  return (
    <div className={`
      p-4 rounded-lg border transition-all duration-200
      ${variant === 'execute' ? 'bg-white shadow-md hover:shadow-lg' : ''}
      ${task.order === 1 ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}
    `}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{task.title}</h3>
        {variant === 'execute' && (
          <button
            onClick={handleComplete}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            ✓ 完了
          </button>
        )}
      </div>
    </div>
  )
}
```

## 5. 開発フェーズ

### Phase 1: 基盤構築 (1-2週間)
1. **プロジェクト初期設定**
   - Create React App + TypeScript
   - Redux Toolkit + Redux Persist設定
   - Tailwind CSS設定
   - ESLint/Prettier設定

2. **基本Redux Store実装**
   - tasksSlice基本CRUD
   - uiSlice (currentMode管理)
   - ローカルストレージ永続化
   - 型定義整備

3. **ベースコンポーネント**
   - レイアウトコンポーネント
   - モードナビゲーター
   - 基本的なTaskCard

### Phase 2: コア機能実装 (2-3週間)
1. **作成モード**
   - 巨大入力ボックス/コンパクト入力切り替え
   - タスクリスト表示
   - バリデーション

2. **分類モード**
   - 4方向カテゴリレイアウト
   - キーボード/タッチ操作
   - アニメーション

3. **一覧モード**
   - カテゴリ別表示
   - 順序変更機能
   - 統計情報表示

4. **実行モード**
   - 横断的タスク表示
   - 完了機能
   - 履歴表示

### Phase 3: UX向上 (1-2週間)
1. **レスポンシブ対応**
   - PC/モバイル切り替え
   - タッチジェスチャー
   - キーボードショートカット

2. **アニメーション実装**
   - ページ遷移
   - タスク追加/削除
   - スライドイン/アウト

3. **24時間自動削除機能**
   - バックグラウンド処理
   - 警告表示
   - 例外処理（最上位タスク）

### Phase 4: 最適化・デプロイ (1週間)
1. **パフォーマンス最適化**
   - React.memo最適化
   - Redux Selector最適化
   - バンドルサイズ削減

2. **PWA対応**
   - Service Worker
   - マニフェスト設定
   - オフライン対応

3. **デプロイ準備**
   - Vercel設定
   - GitHub Actions CI/CD
   - 環境変数管理

## 6. ファイル実装優先順序

### 1. 基盤ファイル
```bash
# 1. プロジェクト設定
- package.json
- vite.config.ts
- tailwind.config.js
- tsconfig.json

# 2. 型定義
- src/types/Task.ts
- src/types/index.ts

# 3. Redux設定
- src/store/index.ts
- src/store/slices/tasksSlice.ts
- src/store/slices/uiSlice.ts
```

### 2. コアコンポーネント
```bash
# 4. ベースコンポーネント
- src/components/ui/Button.tsx
- src/components/ui/Input.tsx
- src/components/TaskCard/TaskCard.tsx

# 5. レイアウト
- src/components/Layout/Header.tsx
- src/components/Layout/ModeNavigator.tsx
- src/App.tsx
```

### 3. 機能別実装
```bash
# 6. 各モード実装
- src/features/create/CreateMode.tsx
- src/features/classify/ClassifyMode.tsx
- src/features/list/ListMode.tsx
- src/features/execute/ExecuteMode.tsx
```

## 7. デプロイ・CI/CD

### Vercel設定
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 8. 成功指標・テスト項目

### パフォーマンス目標
- **初回ロード**: < 3秒
- **操作レスポンス**: < 100ms
- **バンドルサイズ**: < 500KB (gzipped)

### 機能テスト
- [ ] 全モード間のスムーズな切り替え
- [ ] タスクCRUD操作の正常動作
- [ ] 24時間自動削除の動作確認
- [ ] レスポンシブデザインの確認
- [ ] ローカルストレージ永続化の確認

### ブラウザ対応
- Chrome (最新)
- Firefox (最新)
- Safari (最新)
- Edge (最新)

---

**総開発期間予想**: 6-8週間
**MVP完成目標**: Phase 3完了時点
**本格リリース**: Phase 4完了時点