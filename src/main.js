// src/main.js — App entry point

import { appStore } from './store/appStore.js';

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
  });
}

// Online/offline status tracking
window.addEventListener('online',  () => appStore.setState({ isOnline: true }));
window.addEventListener('offline', () => appStore.setState({ isOnline: false }));