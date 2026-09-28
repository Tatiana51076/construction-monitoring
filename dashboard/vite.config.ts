import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Адрес API (сервер Георгия)
const API_TARGET = 'http://217.18.63.89:8000';

// Прокси: браузер обращается к нашему приложению (localhost), а Vite серверно
// пересылает запросы к API — поэтому CORS не нужен и «смешанного контента» нет.
const proxy = {
  '/health': { target: API_TARGET, changeOrigin: true },
  '/upload': { target: API_TARGET, changeOrigin: true },
  '/photos': { target: API_TARGET, changeOrigin: true },
  '/api': { target: API_TARGET, changeOrigin: true },
  '/uploads': { target: API_TARGET, changeOrigin: true },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy,
  },
  preview: {
    proxy,
  },
});
