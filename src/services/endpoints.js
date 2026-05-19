const BASE = import.meta.env.VITE_API_BASE_URL;

export const ENDPOINTS = {

  //Auth
  LOGIN:            `${BASE}/auth/login`,
  REGISTER:         `${BASE}/auth/register`,
  LOGOUT:           `${BASE}/auth/logout`,
  REFRESH_TOKEN:    `${BASE}/auth/refresh`,
  FORGOT_PASSWORD:  `${BASE}/auth/forgot-password`,
  RESET_PASSWORD:   `${BASE}/auth/reset-password`,
  VERIFY_EMAIL:     `${BASE}/auth/verify-email`,

  //Questions
  GET_QUESTIONS:    `${BASE}/questions`,

  //Sessions (CBT Exam)
  START_SESSION:    `${BASE}/sessions/start`,
  SUBMIT_SESSION:   (id) => `${BASE}/sessions/${id}/submit`,
  PAUSE_SESSION:    (id) => `${BASE}/sessions/${id}/pause`,
  RESUME_SESSION:   (id) => `${BASE}/sessions/${id}/resume`,
  SESSION_RESULT:   (id) => `${BASE}/sessions/${id}/result`,

  //Analytics 
  PERFORMANCE_SUMMARY:  `${BASE}/analytics/summary`,
  SUBJECT_BREAKDOWN:    `${BASE}/analytics/subjects`,
  SCORE_TREND:          `${BASE}/analytics/trend`,
  WEAK_TOPICS:          `${BASE}/analytics/weak-topics`,

  //Recommendations
  RECOMMENDATIONS:  `${BASE}/analytics/recommendations`,

  //School Dashboard 
  SCHOOL_COHORT:    `${BASE}/school/cohort`,
  SCHOOL_EXPORT:    `${BASE}/school/export`,

};