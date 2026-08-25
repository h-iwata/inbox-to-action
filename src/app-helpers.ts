import type { AppMode } from '@/store/uiStore'

/** モードごとの操作ヒント。モバイルとデスクトップで操作方法が違うので分けている。 */
const HINTS: Record<'mobile' | 'desktop', Record<AppMode, string>> = {
  mobile: {
    create: '下部のナビゲーションでモード切替',
    classify: '画面をタップして分類',
    list: 'タップで最優先設定 • 左スワイプでInbox • 右スワイプで削除',
    execute: '実行タスクを完了ボタンで完了',
  },
  desktop: {
    create: 'Tab: 次のモード • Shift+Tab: 前のモード',
    classify: 'W/↑: 学習 • A/←: 仕事 • D/→: 生活 • S/↓: 趣味',
    list: 'クリックで最優先設定 • タスクを左右にスワイプで操作',
    execute: 'スペース：タスク完了 • 1〜4キー：カテゴリ切り替え',
  },
}

/** Inbox が空のときの分類モードでは、分類操作の案内を出さずモード切替を案内する。 */
const FALLBACK_HINT = {
  mobile: HINTS.mobile.create,
  desktop: HINTS.desktop.create,
} as const

/** 画面下部に出す操作ヒントの文言を決める。 */
export const operationHint = (mode: AppMode, isMobile: boolean, hasInboxTasks: boolean): string => {
  const platform = isMobile ? 'mobile' : 'desktop'
  if (mode === 'classify' && !hasInboxTasks) return FALLBACK_HINT[platform]
  return HINTS[platform][mode]
}
