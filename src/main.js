/* App entry point */

import { initRouter, registerRoute } from './router/router.js';
import { appStore } from './store/appStore.js';

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  });
}

// Online/offline status tracking
window.addEventListener('online', () => appStore.setState({ isOnline: true }));
window.addEventListener('offline', () => appStore.setState({ isOnline: false }));

// Register routes (pages will be imported and built later)
registerRoute('/', () => console.log('Home page'));
registerRoute('/login', () => console.log('Login page'));
registerRoute('/register', () => console.log('Register page'));
registerRoute('/dashboard', () => console.log('Dashboard'));
registerRoute('/quiz', () => console.log('Quiz'));
registerRoute('/results', () => console.log('Results'));
registerRoute('/404', () => console.log('404'));

// Boot the router
initRouter();