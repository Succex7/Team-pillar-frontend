// Factory function (call this to create any store)
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
      // Returns an unsubscribe function
      return () => {
        const index = listeners.indexOf(fn);
        if (index > -1) listeners.splice(index, 1);
      };
    },
  };
}

// The main global app store (for the things every page needs)
export const appStore = createStore({
  user: null,              // logged-in user object
  isAuthenticated: false,  // is user logged in?
  isOnline: navigator.onLine, // internet connection status
});