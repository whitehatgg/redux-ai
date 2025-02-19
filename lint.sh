#!/bin/bash
# Run ESLint only on source files
npx eslint "client/src/**/*.{ts,tsx}" "packages/*/src/**/*.{ts,tsx}" "server/**/*.ts" "*.config.ts" --fix