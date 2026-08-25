/** キー表記を人間向けの表示に整える（ドキュメント生成・UI 表示用）。 */

const KEY_LABELS: Record<string, string> = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
}

export const formatKey = (key: string): string =>
  key
    .split('+')
    .map(part => KEY_LABELS[part] ?? part)
    .join(' + ')
