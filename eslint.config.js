import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

// NOTE: eslint-plugin-tailwindcss@4.0.0-beta.0 does not support Tailwind CSS v4's CSS-based config yet.
// The VSCode Tailwind CSS IntelliSense extension provides suggestCanonicalClasses warnings instead.
// import tailwindcss from 'eslint-plugin-tailwindcss'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'off',
        { allowConstantExport: true },
      ],
      // TypeScript厳格ルール
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      // コードスタイル
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'warn',
      // React関連
      'react-hooks/exhaustive-deps': 'off',
    },
  },
)
