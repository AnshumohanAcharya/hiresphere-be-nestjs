// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "node_modules/**",
      "commitlint.config.js", // Add this
      "eslint.config.mjs",    // Add this
      ".prettierrc.js"        // Add this
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        // 2. These are the magic flags for NestJS
        warnOnUnsupportedTypeScriptVersion: false,
        allowAutomaticSingleRunInference: true,
      },
    },
  },
  {
    rules: {
      'prettier/prettier': [
        'error',
        {
          parser: 'babel-ts',
        },
      ],
      // Turn off the noisy "Unsafe" rules for now
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Keep these as warnings so they don't block commits
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/require-await': 'warn',
    },
  },
);
