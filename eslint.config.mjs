import tseslint from 'typescript-eslint';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import prettierPlugin from 'eslint-plugin-prettier';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/coverage/',
      '**/generated/',
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/seed.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.extends('prettier'),

  {
    plugins: {
      prettier: prettierPlugin,
    },

    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...globals.jest,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },

    rules: {
      // ----- TypeScript Core -----
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': 'allow-with-description',
          'ts-nocheck': 'allow-with-description',
        },
      ],

      // ----- TypeScript Quality -----
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // ----- Imports -----
      // Note: Install 'eslint-plugin-import' for advanced import linting:
      // pnpm add -D eslint-plugin-import eslint-import-resolver-typescript

      // ----- Prettier -----
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'lf',
          singleQuote: true,
          semi: true,
          printWidth: 100,
          trailingComma: 'all',
          tabWidth: 2,
          bracketSpacing: true,
        },
      ],

      // ----- Code Quality -----
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'warn',
      'object-shorthand': 'error',
      'no-nested-ternary': 'warn',
      'no-unneeded-ternary': 'error',
      'no-else-return': 'warn',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      curly: ['error', 'all'],

      // ----- Security & Safety -----
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-param-reassign': ['error', { props: false }],
      'no-return-await': 'off', // Handled by @typescript-eslint
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],

      // ----- Async/Await -----
      'require-await': 'off',
      '@typescript-eslint/require-await': 'error',
      'no-async-promise-executor': 'error',
      'no-promise-executor-return': 'error',

      // ----- NestJS Patterns -----
      'no-useless-constructor': 'off',
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/no-empty-function': [
        'error',
        {
          allow: ['constructors'],
        },
      ],
    },
  },
];
