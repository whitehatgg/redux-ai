import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
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
          include: [
            '@redux-ai/schema',
            '@redux-ai/state',
            '@redux-ai/vector',
            'react',
            'react-dom',
            '@testing-library/jest-dom',
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, '../../shared'),
      '@redux-ai/schema': resolve(__dirname, '../schema/src'),
      '@redux-ai/state': resolve(__dirname, '../state/src'),
      '@redux-ai/vector': resolve(__dirname, '../vector/src'),
      react: resolve(__dirname, '../../node_modules/react'),
      'react-dom': resolve(__dirname, '../../node_modules/react-dom'),
      '@testing-library/jest-dom': resolve(
        __dirname,
        '../../node_modules/@testing-library/jest-dom'
      ),
    },
  },
} as any); // Type assertion to bypass strict type checking