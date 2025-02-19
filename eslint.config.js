import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/public/assets/**',
      '**/*.d.ts'  // Explicitly ignore .d.ts files
    ],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        },
        project: ['./tsconfig.json', './packages/*/tsconfig.json', './client/tsconfig.json']
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        // Node.js globals
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        // DOM element types
        HTMLDivElement: 'readonly',
        HTMLPreElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTableElement: 'readonly',
        HTMLTableSectionElement: 'readonly',
        HTMLTableRowElement: 'readonly',
        HTMLTableCellElement: 'readonly',
        HTMLParagraphElement: 'readonly',
        HTMLHeadingElement: 'readonly'
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-unused-vars': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-prototype-builtins': 'off'
    }
  },
  // Client-side files config
  {
    files: ['client/src/**/*.{ts,tsx}', 'packages/*/src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        MutationObserver: 'readonly',
        performance: 'readonly',
        IDBDatabase: 'readonly'
      }
    }
  },
  // Server and config files
  {
    files: ['server/**/*.ts', '*.config.ts'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        process: 'readonly',
        console: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        Buffer: 'readonly'
      }
    }
  },
  // Test files config
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly'
      }
    }
  }
];