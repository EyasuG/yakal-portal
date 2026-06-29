import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'app'),
  base: './',
  plugins: [react()],
  server: {
    port: 4173,
  },
  build: {
    outDir: path.resolve(__dirname, 'app', 'dist'),
    emptyOutDir: true,
  },
});
