import { useEffect } from 'react'
import { defaultKeybindingsHandlerIgnore, tinykeys } from 'tinykeys'
import { COMMANDS } from '@/config/commands'
import { useResponsive } from '@/hooks/useResponsive'
import { useCurrentMode } from '@/store/uiStore'
import { getHandler } from './registry'
import type { CommandDefinition, Scope } from './types'
import { isActiveScope } from './when'

/** 同じキーに複数のコマンドが割り当てられている場合にまとめる（Space が分類と実行で別の意味を持つケース）。 */
const groupByKey = (commands: readonly CommandDefinition[]): Map<string, CommandDefinition[]> => {
  const grouped = new Map<string, CommandDefinition[]>()
  for (const command of commands) {
    for (const key of command.keys) {
      const list = grouped.get(key) ?? []
      list.push(command)
      grouped.set(key, list)
    }
  }
  return grouped
}

/**
 * ダイアログを開いている間はアプリのショートカットを無効にする。
 *
 * Radix Dialog はフォーカスをダイアログ内に閉じ込めるが、tinykeys は window で購読しているため
 * そのままでは Tab などが背後のアプリに届いてしまう。ESC での閉じる操作は Radix 側が処理する。
 */
export const shouldIgnoreEvent = (event: KeyboardEvent): boolean => {
  const target = event.target
  if (target instanceof Element && target.closest('[role="dialog"]')) return true
  return defaultKeybindingsHandlerIgnore(event)
}

/**
 * アプリのルートで1回だけ呼び、全コマンドをキーボードに接続する。
 *
 * - スコープ（現在のモード）が変わるたびに再バインドする
 * - ハンドラが未登録のコマンドは発火しない（各コンポーネントが `useCommandHandler` で登録する）
 * - フォーム入力中・IME変換中・キーリピートの除外は tinykeys 側が行う
 * - モーダルダイアログを開いている間はアプリのショートカットを止める
 * - モバイル（768px未満）では一切バインドしない
 */
export function useKeybindings(): void {
  const currentMode = useCurrentMode()
  const { isDesktop } = useResponsive()

  useEffect(() => {
    if (!isDesktop) return

    const scopes = new Set<Scope>(['global', currentMode])
    const keyMap: Record<string, (event: KeyboardEvent) => void> = {}

    for (const [key, commands] of groupByKey(COMMANDS)) {
      keyMap[key] = event => {
        for (const command of commands) {
          if (!isActiveScope(command.when, scopes)) continue
          const handler = getHandler(command.id)
          if (!handler) continue
          event.preventDefault()
          handler(event)
          return
        }
      }
    }

    return tinykeys(window, keyMap, { ignore: shouldIgnoreEvent })
  }, [currentMode, isDesktop])
}
