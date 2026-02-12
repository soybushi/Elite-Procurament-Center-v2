import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // ── React Hooks (detect misuse) ──
      ...reactHooks.configs.recommended.rules,

      // ── React Refresh ──
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // ── TypeScript: relax for existing codebase ──
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // ── General: advisory only ──
      'no-console': 'off',
      'no-empty': 'warn',
      'prefer-const': 'warn',
    },
  },
);
