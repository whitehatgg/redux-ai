import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['packages/**/src/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    deps: {
      inline: ['@redux-ai/schema', '@redux-ai/state', '@redux-ai/vector', '@redux-ai/react'],
    },
  },
  resolve: {
    alias: {
      '@redux-ai': resolve(__dirname, 'packages'),
      '@': resolve(__dirname, 'client/src'),
    },
  },
});
