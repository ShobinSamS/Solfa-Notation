import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: ['node_modules/**', 'dist/**', '__MACOSX/**']
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  build: {
    sourcemap: true
  }
});
