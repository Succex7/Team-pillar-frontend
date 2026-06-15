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

  // AUTH — PROTECTED
  LOGOUT:           `${BASE}/auth/logout`,
  LOGOUT_ALL:       `${BASE}/auth/logout-all`,
  GET_ME:           `${BASE}/auth/me`,
  UPDATE_PROFILE:   `${BASE}/auth/profile`,
  CHANGE_PASSWORD:  `${BASE}/auth/change-password`,
  GET_SESSIONS:     `${BASE}/auth/sessions`,
  DELETE_ACCOUNT:   `${BASE}/auth/account`,

  // AUTH — SETTINGS
  GET_SETTINGS:              `${BASE}/auth/settings`,
  UPDATE_SETTINGS_PROFILE:   `${BASE}/auth/settings/profile`,
  UPLOAD_PHOTO:              `${BASE}/auth/settings/photo`,
  UPDATE_NOTIFICATIONS:      `${BASE}/auth/settings/notifications`,
  UPDATE_PRIVACY:            `${BASE}/auth/settings/privacy`,
  GET_SUBSCRIPTION:          `${BASE}/auth/subscription`,
  DEACTIVATE_ACCOUNT:        `${BASE}/auth/deactivate`,
  REACTIVATE_ACCOUNT:        `${BASE}/auth/reactivate`,


  // STUDENT
  STUDENT_DASHBOARD:       `${BASE}/student/me/dashboard`,
  STUDENT_ONBOARDING:      `${BASE}/student/me/onboarding`,
  STUDENT_UPDATE_SUBJECTS: `${BASE}/student/me/subjects`,


  // PRACTICE — SUBJECTS & QUESTIONS
  GET_SUBJECTS:  `${BASE}/practice/subjects`,
  GET_QUESTIONS: `${BASE}/practice/questions`,

  // PRACTICE — SESSIONS
  SESSION_START:      `${BASE}/practice/session/start`,
  SESSION_SUBMIT:     `${BASE}/practice/session/submit`,
  SESSION_RESULT:     (id) => `${BASE}/practice/session/result/${id}`,
  SESSION_NEXT_Q:     `${BASE}/practice/questions/next`,
  SESSION_VISIBILITY: `${BASE}/practice/session/visibility`,
  PRACTICE_SESSIONS:  `${BASE}/practice/sessions`,

  // SMART MOCK
  SMART_MOCK_GENERATE: `${BASE}/practice/smart-mock/generate`,
  SMART_MOCK_SUBMIT:   `${BASE}/practice/smart-mock/submit`,

  // FULL MOCK TESTS — dedicated router
  MOCK_START:   `${BASE}/mock/start`,
  MOCK_SUBMIT:  `${BASE}/mock/submit`,
  MOCK_HISTORY: `${BASE}/mock/history`,
  MOCK_STATS:   `${BASE}/mock/stats`,


  // AI
  AI_EXPLAIN:          `${BASE}/ai/explain`,
  AI_STUDY_PLAN:       `${BASE}/ai/study-plan`,
  AI_QUESTION_INSIGHT: `${BASE}/ai/question-insight`,
  AI_CHAT:             `${BASE}/ai/chat`,


  // ANALYTICS — admin only
  ANALYTICS_STUDENT: (id) => `${BASE}/analytics/student/${id}`,
  ANALYTICS_ME:      `${BASE}/analytics/student/me`,
  ANALYTICS_SUMMARY: `${BASE}/analytics/summary`,
  ANALYTICS_REPORTS: `${BASE}/analytics/reports`,


  // BILLING
  BILLING_PLANS:      `${BASE}/billing/plans`,
  BILLING_INITIALIZE: `${BASE}/billing/initialize`,
  BILLING_SUBSCRIBE:  `${BASE}/billing/subscribe`,
  BILLING_VERIFY:     `${BASE}/billing/verify`,
  BILLING_WEBHOOK:    `${BASE}/billing/webhook`,


  // ACHIEVEMENTS, STREAKS, LEADERBOARD
  ACHIEVEMENTS: `${BASE}/achievements`,
  STREAKS:      `${BASE}/streaks`,
  LEADERBOARD:  `${BASE}/leaderboard`,


  // NOTIFICATIONS
  NOTIFICATIONS:               `${BASE}/notifications`,
  NOTIFICATIONS_UNREAD_COUNT:  `${BASE}/notifications/unread-count`,
  NOTIFICATIONS_MARK_ALL_READ: `${BASE}/notifications/mark-all-read`,
  NOTIFICATION_MARK_READ:      (id) => `${BASE}/notifications/${id}/read`,
  NOTIFICATION_DELETE:         (id) => `${BASE}/notifications/${id}`,


  // STUDY PLANNER
  PLANNER_SCHEDULE:   `${BASE}/planner/schedule`,
  PLANNER_GENERATE:   `${BASE}/planner/generate`,
  PLANNER_RESCHEDULE: `${BASE}/planner/reschedule-day`,
  PLANNER_COMPLETE:   (id) => `${BASE}/planner/session/${id}/complete`,


  // CLASSES
  CLASSES:     `${BASE}/classes`,
  CLASS_BY_ID: (id) => `${BASE}/classes/${id}`,


  // SUPPORT
  SUPPORT_TICKET: `${BASE}/support/ticket`,


  // ADMIN — DASHBOARD
  ADMIN_STATS:       `${BASE}/admin/dashboard/stats`,
  ADMIN_LIVE_MONITOR: `${BASE}/admin/live-monitor`,

  // ADMIN — STUDENTS
  ADMIN_STUDENTS:           `${BASE}/admin/students`,
  ADMIN_STUDENT_BY_ID:      (id) => `${BASE}/admin/students/${id}`,
  ADMIN_STUDENT_ACHIEVEMENTS: (id) => `${BASE}/admin/students/${id}/achievements`,
  ADMIN_STUDENTS_EXPORT:    `${BASE}/admin/students/export`,
  ADMIN_STUDENTS_REMIND:    `${BASE}/admin/students/remind`,

  // ADMIN — QUESTIONS
  ADMIN_QUESTIONS:       `${BASE}/admin/questions`,
  ADMIN_QUESTION_BY_ID:  (id) => `${BASE}/admin/questions/${id}`,
  ADMIN_QUESTIONS_STATS: `${BASE}/admin/questions/stats`,

  // ADMIN — ANALYTICS
  ADMIN_ANALYTICS_REPORTS: `${BASE}/admin/analytics/reports`,

  // ADMIN — SUBJECTS
  ADMIN_SUBJECTS:      `${BASE}/admin/subjects`,
  ADMIN_SUBJECT_BY_ID: (id) => `${BASE}/admin/subjects/${id}`,

  // ADMIN — USERS
  ADMIN_USERS:             `${BASE}/admin/users`,
  ADMIN_USER_BY_ID:        (userId) => `${BASE}/admin/users/${userId}`,
  ADMIN_USER_PROMOTE:      (userId) => `${BASE}/admin/users/${userId}/promote`,
  ADMIN_USER_TRIGGER_OTP:  (userId) => `${BASE}/admin/users/${userId}/otp`,
  ADMIN_CREATE_ADMIN:      `${BASE}/admin/users/create-admin`,
  ADMIN_DELETE_USER:       (userId) => `${BASE}/admin/users/${userId}`,

  // ADMIN — PRICING
  ADMIN_PRICING:              `${BASE}/admin/pricing`,
  ADMIN_PRICING_BY_ID:        (id) => `${BASE}/admin/pricing/${id}`,
  ADMIN_PRICING_TOGGLE_POP:   (id) => `${BASE}/admin/pricing/${id}/toggle-popular`,

  // ADMIN — SETTINGS & OTHER
  ADMIN_SETTINGS: `${BASE}/admin/settings`,
  ADMIN_TUTORS:   `${BASE}/admin/tutors`,

};