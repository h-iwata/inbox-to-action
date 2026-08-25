import { useEffect, useRef } from 'react'
import type { CommandId } from '@/config/commands'
import { registerHandler, unregisterHandler } from './registry'
import type { CommandHandler } from './types'

/**
 * コマンドのハンドラをコンポーネントから登録する。
 *
 * ハンドラは ref 経由で参照するので、毎レンダリングで関数を作り直しても再登録は起きない。
 * 登録・解除はマウント / アンマウント時のみ。
 *
 * @param id `COMMANDS` に定義済みのコマンドID
 * @param handler キー入力時に呼ばれる関数
 */
export function useCommandHandler(id: CommandId, handler: CommandHandler | (() => void)): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    registerHandler(id, event => handlerRef.current(event))
    return () => unregisterHandler(id)
  }, [id])
}
