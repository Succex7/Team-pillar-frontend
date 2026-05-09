import { api } from './api.js';

export const analyticsService = {
  getPerformanceSummary: () =>
    api.get('/analytics/summary'),

  getSubjectBreakdown: () =>
    api.get('/analytics/subjects'),

  getScoreTrend: (days = 30) =>
    api.get(`/analytics/trend?days=${days}`),

  getWeakTopics: () =>
    api.get('/analytics/weak-topics'),

  getRecommendations: () =>
    api.get('/analytics/recommendations'),
};