/** テスト用の時刻ヘルパー。24時間ルールの境界値を明示的に組み立てるために使う。 */

export const hoursAgo = (hours: number, from: Date = new Date()): string =>
  new Date(from.getTime() - hours * 60 * 60 * 1000).toISOString()

export const minutesAgo = (minutes: number, from: Date = new Date()): string =>
  new Date(from.getTime() - minutes * 60 * 1000).toISOString()
