// appStore logic

export function createStore(initialState) {
  let state = { ...initialState };
  const listeners = [];

  return {
    getState() {
      return state;
    },

    setState(newState) {
      state = { ...state, ...newState };
      listeners.forEach((fn) => fn(state));
    },

    subscribe(fn) {
      listeners.push(fn);
      return () => {
        const index = listeners.indexOf(fn);
        if (index > -1) listeners.splice(index, 1);
      };
    },
  };
}

// Global app store — internet + auth status
export const appStore = createStore({
  user:            null,
  isAuthenticated: false,
  isOnline:        navigator.onLine,
});

// Keep isOnline in sync automatically
window.addEventListener('online',  () => appStore.setState({ isOnline: true }));
window.addEventListener('offline', () => appStore.setState({ isOnline: false }));