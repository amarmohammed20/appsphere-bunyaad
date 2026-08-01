import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      // Unused code is a bug unless deliberately named with a leading underscore.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // `any` opts out of type safety — allowed, but it must be a visible decision.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Type-only imports are erased at build time; mixing them bloats the bundle.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // A predictable import order keeps diffs small and reviews fast.
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // Server code logs through the app logger, not the console.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Must come last — turns off every rule that would fight Prettier.
  prettier,

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
