import { createStore } from './appStore.js';

export const userStore = createStore({
  profile: null,
  token: null,
  role: null,        // student | tutor | school_admin | super_admin
  streaks: 0,
  lastSession: null,
});



