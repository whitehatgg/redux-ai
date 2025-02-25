module.exports = {
  extends: [
    'next/core-web-vitals'
  ],
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'react/display-name': 'off',
    '@next/next/no-img-element': 'off'
  }
}