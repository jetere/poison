import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Electron loads dist/index.html from file://, not a web server.
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: { target: 'es2022', outDir: 'dist', emptyOutDir: true },
});
