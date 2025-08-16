# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイドラインを提供します。

## プロジェクト概要

InboxToActionは、React、TypeScript、Redux Toolkit、Tailwind CSSで構築されたGTDスタイルのタスク管理アプリケーションです。Inbox → 分類 → 実行 → 完了のワークフローに従い、4つの固定カテゴリ（仕事、生活、学習、趣味）でタスクを管理します。

## 開発コマンド

### 初期セットアップ
```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# プロダクションビルド
npm run build

# テストの実行
npm run test

# コードのリント
npm run lint

# コードのフォーマット
npm run format

# 型チェック
npm run typecheck
```

## アーキテクチャ

### コア技術スタック
- **フロントエンドフレームワーク**: React 18+ with TypeScript
- **状態管理**: Redux Toolkit + Redux Persist（ローカルストレージ永続化）
- **スタイリング**: Tailwind CSS（レスポンシブデザイン）
- **ビルドツール**: Vite
- **デプロイ**: Vercel

### 主要な設計パターン

1. **モードベースUI**: アプリは4つの異なるモード間を切り替えて使用：
   - 作成モード: タスクの素早い入力
   - 分類モード: Inboxタスクをカテゴリに振り分け
   - 一覧モード: カテゴリ別タスクの表示と優先順位調整
   - 実行モード: 各カテゴリの最上位タスクに集中

2. **タスクのライフサイクル**:
   - タスクは24時間後に自動削除（カテゴリの最上位タスク(order: 1)を除く）
   - 最上位タスクは時間無制限で「実行中」としてマーク
   - 完了タスクは24時間保持後に削除

3. **State構造**:
   ```typescript
   RootState {
     tasks: {
       items: Task[]
       filter: { category, status }
       stats: { daily, weekly }
     }
     ui: {
       currentMode: 'create' | 'classify' | 'list' | 'execute'
       isLoading: boolean
       error: string | null
     }
   }
   ```

### コンポーネント構成
- `/components/ui/` - 再利用可能なUIコンポーネント（Button、Inputなど）
- `/components/` - 共有コンポーネント（TaskCard、StatCardなど）
- `/features/` - 機能別に整理されたモード固有のコンポーネント
- `/store/` - Reduxストア、スライス、ミドルウェア
- `/hooks/` - カスタムReactフック
- `/utils/` - ユーティリティ関数

## 重要な実装上の注意点

1. **レスポンシブデザイン**: 
   - モバイルUI（< 768px）: フルスクリーンモード切り替え
   - デスクトップUI（≥ 768px）: 70%メインエリア、30%サイドパネルの分割ビュー

2. **キーボードショートカット**:
   - 分類モード: W/↑（学習）、A/←（仕事）、S/↓（趣味）、D/→（生活）、Space（スキップ）
   - 実行モード: 1-4キーでタスク完了
   - Tab: モード間の切り替え

3. **タスク順序管理**:
   - 「最上位に移動」操作のみ許可（細かい順序調整は不可）
   - タスクが最上位に移動すると、他のタスクのorder値が自動調整

4. **パフォーマンス考慮事項**:
   - 高負荷コンポーネントにはReact.memoを使用
   - reselectでReduxセレクターを最適化
   - 長いタスクリストには仮想スクロールを実装

5. **データ永続化**:
   - Redux Persist経由でlocalStorageに全データを保存
   - MVP版ではバックエンドAPIなし
   - 将来的にクラウド同期を追加予定

## テスト戦略

- Reduxスライスとユーティリティ関数の単体テスト
- React Testing Libraryによるコンポーネントテスト
- 重要なユーザーフロー（タスク作成→分類→完了）のE2Eテスト
- キーボードショートカットとタッチジェスチャーのテスト
- 24時間自動削除ロジックの検証

## デプロイ

GitHub Actions経由でmainブランチへのプッシュ時にVercelへ自動デプロイされます。デプロイパイプラインは、デプロイ前にリント、テスト、ビルドを実行します。