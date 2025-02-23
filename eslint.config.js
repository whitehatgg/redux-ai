import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  // Global ignores
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      'jest.config.ts',
      'drizzle.config.ts',
      'tailwind.config.ts',
      'vitest.config.ts',
      'vitest.setup.ts',
      'postcss.config.js',
      '**/generated/**',
      '**/packages/*/dist/**/*.d.ts',
    ],
  },
  // Configuration files
  {
    files: ['**/*.config.{js,ts}', '**/.eslintrc.js'],
    languageOptions: {
      globals: {
        module: true,
        require: true,
        __dirname: true,
        process: true,
      },
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  // Declaration files
  {
    files: ['**/*.d.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: null,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      'no-var': 'off',
      'no-undef': 'off',
    },
  },
  // Regular TypeScript/React files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
        MutationObserver: 'readonly',
        performance: 'readonly',
        IDBDatabase: 'readonly',
        IDBObjectStore: 'readonly',
        IDBIndex: 'readonly',
        IDBTransaction: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        test: 'readonly',
        // Remove jest global
        Blob: 'readonly',
        FormData: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-unused-vars': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-prototype-builtins': 'off',
      'no-undef': 'off',
    },
  },
  // Test files and utilities
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/test-utils.{ts,tsx}'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-undef': 'off',
    },
  },
  // Server files
  {
    files: ['server/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  // Vector package browser environment
  {
    files: ['packages/vector/src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        IDBDatabase: 'readonly',
        IDBObjectStore: 'readonly',
        IDBIndex: 'readonly',
        IDBTransaction: 'readonly',
      },
    },
  },
];
