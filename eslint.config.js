import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  // Declaration files first to ensure they take precedence
  {
    files: ['**/*.d.ts'],
    ignores: ['**/dist/**', '**/node_modules/**'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: null, // Don't require tsconfig for .d.ts files
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-unused-vars': 'off', // Completely disable for .d.ts files
      'no-unused-vars': 'off', // Disable the base rule as well
      'no-var': 'off',
      'no-undef': 'off',
    },
  },
  // Regular TypeScript/React files
  {
    files: ['**/*.{ts,tsx}'],
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      'jest.config.ts',
      'drizzle.config.ts',
      '**/coverage/**',
      '.tsbuildinfo',
      '**/vitest.config.ts',
      '**/postcss.config.js',
      '**/generated/**',
      '**/*.d.ts',
    ],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: true,
        projectService: {
          projects: ['./tsconfig.json', './packages/*/tsconfig.json'],
          tsconfigRootDir: '.',
        },
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        MutationObserver: 'readonly',
        performance: 'readonly',
        IDBDatabase: 'readonly',
        IDBObjectStore: 'readonly',
        IDBIndex: 'readonly',
        IDBTransaction: 'readonly',
        // Node.js globals
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        // Test globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        test: 'readonly',
        jest: 'readonly',
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
      // React rules
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/prop-types': 'off',
      'react/display-name': 'off',

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // General rules
      'no-unused-vars': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-prototype-builtins': 'off',
    },
  },
  // Test files
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: true,
        projectService: {
          projects: ['./tsconfig.json', './packages/*/tsconfig.json'],
          tsconfigRootDir: '.',
        },
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-undef': 'off',
    },
  },
  // Configuration files
  {
    files: ['**/*.config.{js,ts}', '**/.eslintrc.js'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: null,
      },
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
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
  // Node.js specific config
  {
    files: ['server/**/*.ts'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],
    },
  },
  // Vite.ts specific config
  {
    files: ['server/vite.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
