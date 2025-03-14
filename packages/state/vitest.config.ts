import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../../vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/**', 'src/types/**', '**/*.d.ts', 'test/**', 'dist/**'],
    },
    deps: {
      optimizer: {
        web: {
          include: ['@redux-ai/schema', '@redux-ai/vector', '@testing-library/jest-dom'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@testing-library/jest-dom': resolve(
        __dirname,
        '../../node_modules/@testing-library/jest-dom'
      ),
    },
  },
} as any); // Type assertion to bypass strict type checking