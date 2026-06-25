// src/scripts/login.js

import { authService } from '../services/auth.service.js';
import { userStore }   from '../store/userStore.js';
import { strings }     from '../strings.js';

// DOM REFERENCES
const loginForm         = document.getElementById('loginForm');
const emailInput        = document.getElementById('email');
const passwordInput     = document.getElementById('password');
const keepSignedIn      = document.getElementById('keepSignedIn');
const togglePasswordBtn = document.getElementById('togglePassword');
const eyeOpen           = document.querySelector('#togglePassword .eye-open');
const eyeClosed         = document.querySelector('#togglePassword .eye-closed');
const signinBtn         = document.getElementById('signinBtn');
const signinBtnText     = document.getElementById('signinBtnText');
const signinBtnLoader   = document.getElementById('signinBtnLoader');
const googleBtn         = document.getElementById('googleBtn');
const toast             = document.getElementById('toast');


// INIT
function init() {
  redirectIfLoggedIn();
  bindPasswordToggle();
  bindFormValidation();
  bindFormSubmit();
  bindGoogleLogin();
}


// REDIRECT IF ALREADY LOGGED IN
function redirectIfLoggedIn() {
  const token =
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token');
  if (token) window.location.href = '/pages/dashboard.html';
}


// PASSWORD TOGGLE
function bindPasswordToggle() {
  if (!togglePasswordBtn) return;
  togglePasswordBtn.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    eyeOpen?.classList.toggle('hidden', isHidden);
    eyeClosed?.classList.toggle('hidden', !isHidden);
    togglePasswordBtn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });
}


// REAL-TIME VALIDATION
function bindFormValidation() {
  emailInput?.addEventListener('blur',  () => validateEmail());
  passwordInput?.addEventListener('blur', () => validatePassword());
  emailInput?.addEventListener('input', () => {
    if (emailInput.classList.contains('is-error')) validateEmail();
  });
  passwordInput?.addEventListener('input', () => {
    if (passwordInput.classList.contains('is-error')) validatePassword();
  });
}

function validateEmail() {
  const value   = emailInput.value.trim();
  const errorEl = document.getElementById('emailError');
  if (!value) return setFieldError(emailInput, errorEl, 'Email address is required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return setFieldError(emailInput, errorEl, 'Enter a valid email address');
  }
  return setFieldValid(emailInput, errorEl);
}

function validatePassword() {
  const value   = passwordInput.value;
  const errorEl = document.getElementById('passwordError');
  if (!value) return setFieldError(passwordInput, errorEl, 'Password is required');
  if (value.length < 6) return setFieldError(passwordInput, errorEl, 'Password must be at least 6 characters');
  return setFieldValid(passwordInput, errorEl);
}

function setFieldError(input, errorEl, message) {
  input.classList.add('is-error');
  input.classList.remove('is-valid');
  if (errorEl) errorEl.textContent = message;
  return false;
}

function setFieldValid(input, errorEl) {
  input.classList.remove('is-error');
  input.classList.add('is-valid');
  if (errorEl) errorEl.textContent = '';
  return true;
}

function validateAll() {
  return [validateEmail(), validatePassword()].every(Boolean);
}


// FORM SUBMIT
function bindFormSubmit() {
  if (!loginForm) return;
  loginForm.addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();
  if (!validateAll()) return;

  setLoading(true);

  try {
    const response = await authService.login(
      emailInput.value.trim(),
      passwordInput.value
    );

    // API response: { success, message, data: { user, token, expiresAt } }
    const { user, token, expiresAt } = response.data;

    // Store token — localStorage if keep signed in, else sessionStorage
    const storage = keepSignedIn?.checked ? localStorage : sessionStorage;
    storage.setItem('access_token', token);
    storage.setItem('token_expires_at', expiresAt || '');

    // Always keep in localStorage for auth guard
    localStorage.setItem('access_token', token);

    userStore.setState({ profile: user, token, role: user.role });

    showToast('Welcome back!', 'success');

    setTimeout(() => {
      // Check for intended plan redirect (from pricing page)
      const intendedPlan = sessionStorage.getItem('intended_plan');
      if (intendedPlan) {
        sessionStorage.removeItem('intended_plan');
        window.location.href = '/pages/billing.html';
        return;
      }

      // Check if onboarding is complete
      // API returns onboarding: {} when not done, with subjects array when done
      const onboarding     = user.onboarding || {};
      const onboardingDone = Array.isArray(onboarding.subjects) && onboarding.subjects.length > 0;

      window.location.href = onboardingDone
        ? '/pages/dashboard.html'
        : '/pages/onboarding-step1.html';
    }, 1000);

  } catch (err) {
    showToast(getErrorMessage(err), 'error');
    setLoading(false);
  }
}


// GOOGLE LOGIN
function bindGoogleLogin() {
  if (!googleBtn) return;
  googleBtn.addEventListener('click', () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '');
    window.location.href = `${apiBase}/auth/google`;
  });
}


// LOADING STATE
function setLoading(isLoading) {
  if (!signinBtn) return;
  signinBtn.disabled = isLoading;
  signinBtnText?.classList.toggle('hidden', isLoading);
  signinBtnLoader?.classList.toggle('hidden', !isLoading);
}


// TOAST
function showToast(message, type = '') {
  if (!toast) return;
  toast.textContent = message;
  toast.className   = `toast ${type}`.trim();
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}


// ERROR MESSAGES
function getErrorMessage(err) {
  const map = {
    400: 'Invalid email or password.',
    401: strings?.errors?.invalidCredentials || 'Invalid email or password.',
    403: 'Your account has been suspended. Contact support.',
    404: 'No account found with this email. Please register.',
    429: 'Too many attempts. Please wait a moment and try again.',
    500: strings?.errors?.generic || 'Something went wrong. Please try again.',
  };
  return map[err?.status] || err?.message || 'Something went wrong. Please try again.';
}


// BOOT
init();