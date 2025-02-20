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
      inline: ['@redux-ai/schema', '@testing-library/jest-dom'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, '../../shared'),
      '@redux-ai/schema': resolve(__dirname, '../schema/src'),
      '@testing-library/jest-dom': resolve(
        __dirname,
        '../../node_modules/@testing-library/jest-dom'
      ),
    },
  },
});
