import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    // Flags disable comments that no longer suppress anything.
    linterOptions: { reportUnusedDisableDirectives: 'error' },

    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/no-explicit-any': 'error',

      // `as const` is unaffected — it is a const assertion, not a type assertion.
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],

      '@typescript-eslint/no-non-null-assertion': 'error',

      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      'import/no-duplicates': 'error',

      'import/no-cycle': 'error',

      eqeqeq: ['error', 'always', { null: 'ignore' }],

      'no-param-reassign': ['error', { props: true }],

      'no-nested-ternary': 'error',

      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Must come last — disables every rule that would conflict with Prettier.
  prettier,

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
