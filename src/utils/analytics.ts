// Google Analytics utility functions

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

// Google Analytics Measurement ID
const GA_MEASUREMENT_ID = 'G-TY1RDJCS1M'

// 本番環境かどうかを判定
const isProduction = () => {
  return !window.location.hostname.includes('localhost') &&
         !window.location.hostname.includes('127.0.0.1') &&
         !window.location.hostname.includes('192.168.') &&
         !window.location.hostname.includes('10.')
}

// Google Analytics が利用可能かチェック
const isGoogleAnalyticsAvailable = () => {
  return isProduction() && typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID
}

// ページビューを送信
export const sendPageView = (path: string) => {
  if (!isGoogleAnalyticsAvailable()) return

  window.gtag!('config', GA_MEASUREMENT_ID, {
    page_path: path,
  })
}

// イベントを送信
export const sendEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (!isGoogleAnalyticsAvailable()) return

  window.gtag!('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

// タスク関連のイベント
export const trackTaskEvent = (
  action: 'create' | 'complete' | 'delete' | 'classify' | 'reorder',
  category?: string
) => {
  sendEvent(`task_${action}`, 'Task', category)
}

// モード切り替えイベント
export const trackModeChange = (mode: string) => {
  sendEvent('mode_change', 'Navigation', mode)
}

// レベルアップイベント
export const trackLevelUp = (level: number) => {
  sendEvent('level_up', 'Achievement', `Level ${level}`, level)
}