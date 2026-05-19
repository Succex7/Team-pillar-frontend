import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:      'index.html',
        register:  'pages/register.html',
        login:     'pages/login.html',
        dashboard: 'pages/dashboard.html',
        quiz:      'pages/quiz.html',
        results:   'pages/results.html',
      },
    },
  },
  server: {
    port: 5173,
  },
});