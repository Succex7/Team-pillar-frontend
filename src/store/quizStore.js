import { createStore } from './appStore.js';

// Quiz session state machine
export const quizStore = createStore({
  questions: [],
  currentIndex: 0,
  answers: {},       // { questionId: selectedOption }
  flagged: [],       // [questionId, ...]
  timeRemaining: 0,
  status: 'idle',   // idle | active | paused | submitted | reviewed
});

