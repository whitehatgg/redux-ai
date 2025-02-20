import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, '../shared'),
      '@redux-ai/state': resolve(__dirname, '../packages/state/src'),
      '@redux-ai/schema': resolve(__dirname, '../packages/schema/src'),
      '@redux-ai/vector': resolve(__dirname, '../packages/vector/src'),
      '@redux-ai/react': resolve(__dirname, '../packages/react/src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
