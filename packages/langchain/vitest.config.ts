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
    },
    deps: {
      inline: ['@redux-ai/runtime', 'langchain', '@testing-library/jest-dom'],
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
});
