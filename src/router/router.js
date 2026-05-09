// Client-side hash router
const routes = {};

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  window.location.hash = path;
}

function handleRoute() {
  const hash = window.location.hash.slice(1) || '/';
  const handler = routes[hash] || routes['/404'];
  if (handler) handler();
}

export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('load', handleRoute);
}