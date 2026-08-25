import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// vite.config.ts を継承する（パスエイリアス等の設定を二重管理しない）
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      coverage: {
        provider: 'v8',
        // 計測対象は .ts のみ。*.tsx を外すのは「component をテストしない」という意味ではなく、
        // カバレッジ数値に引きずられて JSX の分岐網羅テストを増やさないための明示的な選択
        // （component は Integration テストで behavior を検証し、分岐ロジックは *-helpers.ts に抽出する）。
        include: ['src/**/*.ts'],
        exclude: ['src/**/*.d.ts', 'src/test/**', 'src/types/**'],
        // 閾値の強制はフェーズ4（カバレッジ100%達成）から有効化する
        // thresholds: {
        //   'src/store/**': { statements: 100, branches: 100, functions: 100 },
        //   'src/utils/**': { statements: 100, branches: 100, functions: 100 },
        // },
      },
    },
  })
)
