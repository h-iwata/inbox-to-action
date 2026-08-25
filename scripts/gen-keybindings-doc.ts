/**
 * src/config/commands.ts から docs/KEY_BINDINGS.md を生成する。
 *
 *   npm run docs:keybindings
 *
 * コマンドを追加・変更したら必ず実行してドキュメントを同期させること。
 */
import { writeFileSync } from 'node:fs'
import { COMMANDS, SCOPE_LABELS } from '../src/config/commands.ts'
import { formatKey } from '../src/lib/keybindings/key-format.ts'
import { scopesOf } from '../src/lib/keybindings/when.ts'

const OUTPUT = 'docs/KEY_BINDINGS.md'

const byCategory = new Map<string, typeof COMMANDS>()
for (const command of COMMANDS) {
  byCategory.set(command.category, [...(byCategory.get(command.category) ?? []), command] as typeof COMMANDS)
}

const lines: string[] = [
  '# キーボードショートカット',
  '',
  '<!-- このファイルは `npm run docs:keybindings` で自動生成されます。直接編集しないでください。 -->',
  '<!-- 定義元: src/config/commands.ts -->',
  '',
  'デスクトップ（画面幅 768px 以上）でのみ有効です。',
  '入力欄にフォーカスがある間・IME 変換中・キーを押しっぱなしにしている間は発火しません。',
  '',
]

for (const [category, commands] of byCategory) {
  lines.push(`## ${category}`, '', '| キー | 動作 | 有効なモード |', '| --- | --- | --- |')
  for (const command of commands) {
    const keys = command.keys.map(key => `\`${formatKey(key)}\``).join(' / ')
    const scopes = scopesOf(command.when)
      .map(scope => SCOPE_LABELS[scope])
      .join(' / ')
    lines.push(`| ${keys} | ${command.label} | ${scopes} |`)
  }
  lines.push('')
}

writeFileSync(OUTPUT, `${lines.join('\n')}`)
console.log(`generated: ${OUTPUT} (${COMMANDS.length} commands)`)
