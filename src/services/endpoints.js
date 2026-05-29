// src/services/endpoints.js
// Single source of truth for all API endpoint URLs
// Base URL is read from .env — never hardcode it here

const BASE = import.meta.env.VITE_API_BASE_URL;

export const ENDPOINTS = {

  // HEALTH
  HEALTH: `${BASE}/health`,


  // AUTH — PUBLIC
  REGISTER:        `${BASE}/auth/register`,
  LOGIN:           `${BASE}/auth/login`,
  REFRESH_TOKEN:   `${BASE}/auth/refresh`,
  VERIFY_OTP:      `${BASE}/auth/verify-otp`,
  VERIFY_EMAIL:    `${BASE}/auth/verify-email`,
  RESEND_OTP:      `${BASE}/auth/resend-otp`,
  FORGOT_PASSWORD: `${BASE}/auth/forgot-password`,
  RESET_PASSWORD:  `${BASE}/auth/reset-password`,
  GOOGLE_AUTH:     `${BASE}/auth/google`,
  APPLE_AUTH:      `${BASE}/auth/apple`,

  // AUTH — PROTECTED (requires Bearer token)
  LOGOUT:          `${BASE}/auth/logout`,
  GET_ME:          `${BASE}/auth/me`,
  UPDATE_PROFILE:  `${BASE}/auth/profile`,
  CHANGE_PASSWORD: `${BASE}/auth/change-password`,


  // STUDENT
  STUDENT_DASHBOARD:  `${BASE}/student/me/dashboard`,
  STUDENT_ONBOARDING: `${BASE}/student/me/onboarding`,


  // PRACTICE — SUBJECTS & QUESTIONS
  GET_SUBJECTS:  `${BASE}/practice/subjects`,
  GET_QUESTIONS: `${BASE}/practice/questions`,

  // PRACTICE — SESSIONS
  SESSION_START:      `${BASE}/practice/session/start`,
  SESSION_SUBMIT:     `${BASE}/practice/session/submit`,
  SESSION_RESULTS:    (id) => `${BASE}/practice/results/${id}`,
  SESSION_NEXT_Q:     `${BASE}/practice/questions/next`,
  SESSION_VISIBILITY: `${BASE}/practice/session/visibility`,

  // SMART MOCK
  SMART_MOCK_GENERATE: `${BASE}/practice/smart-mock/generate`,
  SMART_MOCK_SUBMIT:   `${BASE}/practice/smart-mock/submit`,


  // AI
  AI_EXPLAIN:         `${BASE}/ai/explain`,
  AI_STUDY_PLAN:      `${BASE}/ai/study-plan`,
  AI_QUESTION_INSIGHT: `${BASE}/ai/question-insight`,


  // ANALYTICS
  ANALYTICS_STUDENT: (id) => `${BASE}/analytics/student/${id}`,
  ANALYTICS_ME:      `${BASE}/analytics/student/me`,
  ANALYTICS_SUMMARY: `${BASE}/analytics/summary`,
  ANALYTICS_REPORTS: `${BASE}/analytics/reports`,


  // BILLING
  BILLING_PLANS:      `${BASE}/billing/plans`,
  BILLING_INITIALIZE: `${BASE}/billing/initialize`,
  BILLING_WEBHOOK:    `${BASE}/billing/webhook`,


  // CLASSES
  CLASSES:         `${BASE}/classes`,
  CLASS_BY_ID:     (id) => `${BASE}/classes/${id}`,


  // ADMIN — DASHBOARD
  ADMIN_STATS:     `${BASE}/admin/dashboard/stats`,

  // ADMIN — STUDENTS
  ADMIN_STUDENTS:          `${BASE}/admin/students`,
  ADMIN_STUDENT_BY_ID:     (id) => `${BASE}/admin/students/${id}`,
  ADMIN_STUDENTS_EXPORT:   `${BASE}/admin/students/export`,
  ADMIN_STUDENTS_REMIND:   `${BASE}/admin/students/remind`,

  // ADMIN — QUESTIONS
  ADMIN_QUESTIONS:          `${BASE}/admin/questions`,
  ADMIN_QUESTION_BY_ID:     (id) => `${BASE}/admin/questions/${id}`,
  ADMIN_QUESTIONS_STATS:    `${BASE}/admin/questions/stats`,

  // ADMIN — ANALYTICS
  ADMIN_ANALYTICS_REPORTS:        `${BASE}/admin/analytics/reports`,
  ADMIN_ANALYTICS_REPORTS_EXPORT: `${BASE}/admin/analytics/reports/export`,
  ADMIN_ANALYTICS_SCHEDULE:       `${BASE}/admin/analytics/schedule`,

  // ADMIN — SUBJECTS
  ADMIN_SUBJECTS:       `${BASE}/admin/subjects`,
  ADMIN_SUBJECT_BY_ID:  (id) => `${BASE}/admin/subjects/${id}`,

  // ADMIN — USERS
  ADMIN_USERS:              `${BASE}/auth/admin/users`,
  ADMIN_USER_PROMOTE:       (userId) => `${BASE}/auth/admin/users/${userId}/promote`,
  ADMIN_USER_TRIGGER_OTP:   (userId) => `${BASE}/auth/admin/users/${userId}/otp`,

  // ADMIN — OTHER
  ADMIN_TUTORS:    `${BASE}/admin/tutors`,
  ADMIN_SETTINGS:  `${BASE}/admin/settings`,

};