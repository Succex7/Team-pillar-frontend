// src/scripts/login.js
// Login page logic — Pillar UTME Platform
// Handles: form validation, password toggle, keep signed in,
//          Google OAuth, navbar scroll, redirect if already logged in

import { authService } from '../services/auth.service.js';
import { userStore }   from '../store/userStore.js';
import { strings }     from '../strings.js';
import { api }       from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';

// DOM REFERENCES
const loginForm       = document.getElementById('loginForm');
const emailInput      = document.getElementById('email');
const passwordInput   = document.getElementById('password');
const keepSignedIn    = document.getElementById('keepSignedIn');
const togglePasswordBtn = document.getElementById('togglePassword');
const eyeOpen         = document.getElementById('eyeOpen');
const eyeClosed       = document.getElementById('eyeClosed');
const signinBtn       = document.getElementById('signinBtn');
const signinBtnText   = document.getElementById('signinBtnText');
const signinBtnLoader = document.getElementById('signinBtnLoader');
const googleBtn       = document.getElementById('googleBtn');
const forgotLink      = document.getElementById('forgotLink');
const toast           = document.getElementById('toast');
const navbar          = document.getElementById('navbar');

// INIT
function init() {
  redirectIfLoggedIn();
  bindPasswordToggle();
  bindFormValidation();
  bindFormSubmit();
  bindGoogleLogin();
  bindNavbarScroll();
}

// REDIRECT IF ALREADY LOGGED IN
function redirectIfLoggedIn() {
  const token = localStorage.getItem('access_token');
  if (token) {
    window.location.href = '/pages/dashboard.html';
  }
}

function bindGoogleLogin() {
  if (!googleBtn) return;
  googleBtn.addEventListener('click', handleGoogleLogin);
}

// PASSWORD TOGGLE
function bindPasswordToggle() {
  if (!togglePasswordBtn) return;

  togglePasswordBtn.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';

    passwordInput.type = isHidden ? 'text' : 'password';

    eyeOpen.classList.toggle('hidden', isHidden);
    eyeClosed.classList.toggle('hidden', !isHidden);

    togglePasswordBtn.setAttribute(
      'aria-label',
      isHidden ? 'Hide password' : 'Show password'
    );
  });
}

// REAL-TIME VALIDATION
function bindFormValidation() {
  emailInput.addEventListener('blur',  () => validateEmail());
  passwordInput.addEventListener('blur', () => validatePassword());

  emailInput.addEventListener('input', () => {
    if (emailInput.classList.contains('is-error')) validateEmail();
  });

  passwordInput.addEventListener('input', () => {
    if (passwordInput.classList.contains('is-error')) validatePassword();
  });
}

function validateEmail() {
  const value    = emailInput.value.trim();
  const errorEl  = document.getElementById('emailError');

  if (!value) {
    return setFieldError(emailInput, errorEl, 'Email address is required');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return setFieldError(emailInput, errorEl, 'Enter a valid email address');
  }

  return setFieldValid(emailInput, errorEl);
}

function validatePassword() {
  const value   = passwordInput.value;
  const errorEl = document.getElementById('passwordError');

  if (!value) {
    return setFieldError(passwordInput, errorEl, 'Password is required');
  }

  if (value.length < 6) {
    return setFieldError(passwordInput, errorEl, 'Password must be at least 6 characters');
  }

  return setFieldValid(passwordInput, errorEl);
}

function setFieldError(input, errorEl, message) {
  input.classList.add('is-error');
  input.classList.remove('is-valid');
  errorEl.textContent = message;
  return false;
}

function setFieldValid(input, errorEl) {
  input.classList.remove('is-error');
  input.classList.add('is-valid');
  errorEl.textContent = '';
  return true;
}

function validateAll() {
  const results = [
    validateEmail(),
    validatePassword(),
  ];
  return results.every(Boolean);
}

// FORM SUBMISSION
function bindFormSubmit() {
  if (!loginForm) return;
  loginForm.addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();

  const isValid = validateAll();
  if (!isValid) return;

  const payload = {
    email:    emailInput.value.trim(),
    password: passwordInput.value,
  };

  setLoading(true);

  try {
  const response = await authService.login(payload.email, payload.password);

  const { token, user, expiresAt } = response.data;

  // Store token in memory (sessionStorage) — NOT localStorage per API docs
  // Only use localStorage if "keep me signed in" is checked
  const storage = keepSignedIn.checked ? localStorage : sessionStorage;
  storage.setItem('access_token', token);
  storage.setItem('token_expires_at', expiresAt);

  userStore.setState({
    profile: user,
    token:   token,
    role:    user.role,
  });

  showToast('Welcome back!', 'success');

  setTimeout(() => {
    const onboardingDone = user.onboarding && Object.keys(user.onboarding).length > 0;
    if (onboardingDone) {
      window.location.href = '/pages/dashboard.html';
    } else {
      window.location.href = '/pages/onboarding-step1.html';
    }
  }, 1000);

} catch (err) {
  showToast(getErrorMessage(err), 'error');
  setLoading(false);
}
}

// GOOGLE LOGIN
function handleGoogleLogin() {
  const apiBase = import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '');
  window.location.href = `${apiBase}/auth/google`;
}

// NAVBAR SCROLL
function bindNavbarScroll() {
  if (!navbar) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 10);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// HELPERS
function setLoading(isLoading) {
  if (!signinBtn || !signinBtnText || !signinBtnLoader) return;
  signinBtn.disabled = isLoading;
  signinBtnText.classList.toggle('hidden', isLoading);
  signinBtnLoader.classList.toggle('hidden', !isLoading);
}

function showToast(message, type = '') {
  if (!toast) return;
  toast.textContent = message;
  toast.className   = `toast ${type}`.trim();
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function getErrorMessage(err) {
  const statusMessages = {
    400: 'Invalid email or password.',
    401: strings?.errors?.invalidCredentials || 'Invalid email or password.',
    403: 'Your account has been suspended. Contact support.',
    404: 'No account found with this email. Please register.',
    429: 'Too many attempts. Please wait a moment and try again.',
    500: strings?.errors?.generic || 'Something went wrong. Please try again.',
  };

  return statusMessages[err?.status]
    || err?.message
    || strings?.errors?.generic
    || 'Something went wrong. Please try again.';
}

// BOOT
init();