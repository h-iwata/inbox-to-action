/**
 * redux-persist 形式で保存されていたデータを Zustand persist 形式へ移す。
 *
 * 旧形式: `localStorage['persist:root'] = '{"tasks":"<JSON文字列>","_persist":"..."}'`
 *   （redux-persist はスライスごとに値を JSON 文字列として二重にエンコードする）
 * 新形式: `localStorage['<storageKey>'] = '{"state":{...},"version":0}'`
 *
 * 24時間で消えるアプリなので取りこぼしても実害は小さいが、
 * 移行の瞬間に開いていた人のタスクが消えるのは避けたいので変換しておく。
 * 中身の妥当性は persist の `merge` で valibot が検証するため、ここでは形だけ整える。
 */

const LEGACY_KEY = 'persist:root'

export const migrateLegacyStorage = (storageKey: string): void => {
  if (typeof localStorage === 'undefined') return

  const legacy = localStorage.getItem(LEGACY_KEY)
  if (!legacy) return

  // 新形式が既にあるなら移行済み。旧データを片付けるだけにする
  if (localStorage.getItem(storageKey)) {
    localStorage.removeItem(LEGACY_KEY)
    return
  }

  try {
    const root: unknown = JSON.parse(legacy)
    if (typeof root !== 'object' || root === null) return

    const tasksJson = (root as Record<string, unknown>).tasks
    if (typeof tasksJson !== 'string') return

    localStorage.setItem(storageKey, JSON.stringify({ state: JSON.parse(tasksJson), version: 0 }))
  } catch {
    // 壊れていたら移行を諦める（新規状態で始める）
  } finally {
    localStorage.removeItem(LEGACY_KEY)
  }
}
