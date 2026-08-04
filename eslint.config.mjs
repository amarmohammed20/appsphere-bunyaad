import comments from '@eslint-community/eslint-plugin-eslint-comments';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

import { boundariesConfig } from './eslint.boundaries.mjs';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  boundariesConfig,

  {
    // Flags disable comments that no longer suppress anything.
    linterOptions: { reportUnusedDisableDirectives: 'error' },

    plugins: { '@eslint-community/eslint-comments': comments },

    rules: {
      // Silencing a rule is allowed, but it has to be argued for in the file.
      // Otherwise disables accumulate and every rule below decays to advice.
      '@eslint-community/eslint-comments/require-description': 'error',
      // A bare `/* eslint-disable */` turns off every rule for a whole file.
      '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
      '@eslint-community/eslint-comments/no-aggregating-enable': 'error',
      '@eslint-community/eslint-comments/no-duplicate-disable': 'error',

      // Type safety
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array' }],
      // `as const` is unaffected — it is a const assertion, not a type assertion.
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Correctness
      'require-await': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-param-reassign': ['error', { props: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Imports
      'import/no-duplicates': 'error',
      'import/no-cycle': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // Readability
      'object-shorthand': 'error',
      'prefer-arrow-callback': ['error', { allowNamedFunctions: false }],
      'no-nested-ternary': 'error',
      'react/jsx-fragments': ['error', 'syntax'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Must come last — disables every rule that would conflict with Prettier.
  prettier,

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
