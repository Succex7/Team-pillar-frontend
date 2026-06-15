import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:      'index.html',
        register:  'pages/register.html',
        forgotpassword:  'pages/forgot-password.html',
        resetpassword:  'pages/reset-password.html',
        login:     'pages/login.html',
        dashboard: 'pages/dashboard.html',
        onboarding1: 'pages/onboarding-step1.html',
        onboarding2:   'pages/onboarding-step2.html',
        onboarding3:   'pages/onboarding-step3.html',
        pricing:   'pages/pricing.html',
        billing:   'pages/billing.html',
        settings:   'pages/settings.html',
        forschools:   'pages/for-schools.html',
        performance:   'pages/performance.html',
      },
    },
  },
  server: {
    port: 5173,
  },
});