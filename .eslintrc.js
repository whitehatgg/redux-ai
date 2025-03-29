module.exports = {
  root: true,
  extends: ['@redux-ai/eslint-config'],
  rules: {
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn', // Downgrade to warning
    'react-hooks/exhaustive-deps': [
      'warn',
      {
        additionalHooks: '(useSelector|useReduxAIContext)',
        enableDangerousAutofixThisMayCauseInfiniteLoops: false,
      }
    ],
    // Prevent console statements in production code
    'no-console': ['error', { allow: ['warn', 'error'] }],
    // Allow certain variables to be ignored in exhaustive-deps
    'react-hooks/rules-of-hooks': 'error',
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/consistent-type-imports': 'off',
        '@typescript-eslint/no-non-null-assertion': ['warn', {
          message: 'Non-null assertions should be used sparingly and only when the value is guaranteed to be non-null'
        }],
        'react-hooks/exhaustive-deps': [
          'warn',
          {
            additionalHooks: '(useSelector|useReduxAIContext)',
            enableDangerousAutofixThisMayCauseInfiniteLoops: false,
          }
        ],
        // Prevent console statements in TypeScript files
        'no-console': ['error', { allow: ['warn', 'error'] }],
      },
    },
    {
      // Test files can be more lenient with warnings and console usage
      files: ['**/__tests__/**/*', '**/*.test.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        'react-hooks/exhaustive-deps': 'off',
        'no-console': 'off' // Allow console statements in test files
      }
    },
    {
      // Middleware requires console logging for debugging purposes
      files: ['**/middleware.ts', '**/index.ts'],
      rules: {
        'no-console': 'off', // Allow console for debugging as it's part of our requirements
        '@typescript-eslint/no-unused-vars': 'warn' // Downgrade to warning
      }
    }
  ],
};