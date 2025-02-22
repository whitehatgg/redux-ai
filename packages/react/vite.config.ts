import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: format => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react-redux',
        '@reduxjs/toolkit',
        '@redux-ai/schema',
        '@redux-ai/state',
        '@redux-ai/vector',
      ],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  plugins: [
    dts({
      include: ['src'],
      exclude: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
      rollupTypes: true,
      insertTypesEntry: true,
      copyDtsFiles: true,
      aliasesExclude: [/@redux-ai\/.*/],
      afterBuild: () => {
        // Clean up any temporary files if needed
      },
    }),
  ],
});
