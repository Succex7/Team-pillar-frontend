import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:      'index.html',
        register:  'pages/register.html',
        login:     'pages/login.html',
        dashboard: 'pages/dashboard.html',
        onboarding1: 'pages/onboarding-step1.html',
        onboarding2:   'pages/onboarding-step2.html',
        onboarding3:   'pages/onboarding-step3.html',
      },
    },
  },
  server: {
    port: 5173,
  },
});