import type { CommandHandler } from './types'

/**
 * コマンドハンドラのレジストリ。
 *
 * ハンドラは関数なので Redux ストアには置かない。tinykeys 側はこの Map を直接引くため、
 * ハンドラの登録・解除でキーの再バインドは発生しない。
 */
const handlers = new Map<string, CommandHandler>()

export const registerHandler = (id: string, handler: CommandHandler): void => {
  handlers.set(id, handler)
}

export const unregisterHandler = (id: string): void => {
  handlers.delete(id)
}

export const getHandler = (id: string): CommandHandler | undefined => handlers.get(id)

/** テスト用。登録済みハンドラを全て消す。 */
export const clearHandlers = (): void => {
  handlers.clear()
}
