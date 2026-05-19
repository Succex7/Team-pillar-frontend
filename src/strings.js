/* All UI text (i18n-ready) */

export const strings = {
  app: {
    name: 'UTME Prep Platform',
    tagline: 'Study smarter. Score higher.',
  },
  auth: {
    login: 'Log In',
    register: 'Create Account',
    logout: 'Log Out',
    forgotPassword: 'Forgot Password?',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    registerSuccess:  'Account created! Redirecting…',
  },
  quiz: {
    startExam: 'Start Exam',
    submitExam: 'Submit Exam',
    nextQuestion: 'Next',
    prevQuestion: 'Previous',
    flagQuestion: 'Flag for Review',
    timeLeft: 'Time Left',
    warningTen: '10 minutes remaining!',
    warningTwo: '2 minutes remaining!',
    timeUp: "Time's up!",
    confirmSubmit: 'Are you sure you want to submit?',
    unanswered: (count) => `You have ${count} unanswered question(s).`,
  },
  dashboard: {
    welcome: (name) => `Welcome back, ${name}`,
    yourScore: 'Your Predicted Score',
    weakTopics: 'Weak Topics',
    recentSessions: 'Recent Sessions',
    recommendations: 'AI Recommendations',
  },
  errors: {
    network: 'No internet connection. Working offline.',
    sessionExpired: 'Your session expired. Please log in again.',
    generic: 'Something went wrong. Please try again.',
    invalidCredentials: 'Invalid email or password.',
  },
  offline: {
    banner: 'You are offline. Answers will sync when you reconnect.',
    synced: 'All answers synced successfully.',
  },
};