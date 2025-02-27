module.exports = {
  root: true,
  extends: ['@redux-ai/eslint-config'],
  rules: {
    '@typescript-eslint/consistent-type-imports': 'off',
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/consistent-type-imports': 'off',
      },
    },
  ],
};
