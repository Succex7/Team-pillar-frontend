import { api } from './api.js';

export const quizService = {
  getQuestions: (params) =>
    api.get(`/questions?subject=${params.subject}&count=${params.count}`),

  startSession: (payload) =>
    api.post('/sessions/start', payload),

  submitSession: (sessionId, answers) =>
    api.post(`/sessions/${sessionId}/submit`, { answers }),

  pauseSession: (sessionId) =>
    api.post(`/sessions/${sessionId}/pause`),

  resumeSession: (sessionId) =>
    api.post(`/sessions/${sessionId}/resume`),

  getSessionResult: (sessionId) =>
    api.get(`/sessions/${sessionId}/result`),
};