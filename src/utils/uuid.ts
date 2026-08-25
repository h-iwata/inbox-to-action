import type { UUID } from '@/types'

/**
 * UUID の生成と検証。
 *
 * `crypto.randomUUID()` はセキュアコンテキスト（HTTPS / localhost）でしか使えない。
 * LAN の IP アドレス経由で開発サーバーに接続した場合（実機確認など）に備えて
 * `crypto.getRandomValues()` によるフォールバックを持つ。こちらは非セキュアコンテキストでも動く。
 */

// uuid パッケージの validate と同じ判定（nil UUID と max UUID も許容する）
const UUID_PATTERN =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i

export const isUUID = (value: unknown): value is UUID => typeof value === 'string' && UUID_PATTERN.test(value)

export const generateUUID = (): UUID => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // RFC 4122 v4 相当を自前で組み立てる
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` as UUID
}
