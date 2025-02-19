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
      '**/*.d.ts',
      '**/public/**'
    ],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
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
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
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
      // React rules
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // General rules
      'no-unused-vars': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-prototype-builtins': 'off'
    }
  }
];