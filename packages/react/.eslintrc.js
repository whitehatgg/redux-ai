module.exports = {
  root: true,
  extends: ['../../eslint.config.js'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  env: {
    browser: true,
    node: true,
  },
};