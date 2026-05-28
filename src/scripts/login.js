// src/scripts/login.js
// Login page logic — Pillar UTME Platform
// Handles: form validation, password toggle, keep signed in,
//          Google OAuth, navbar scroll, redirect if already logged in

import { authService } from '../services/auth.service.js';
import { userStore }   from '../store/userStore.js';
import { strings }     from '../strings.js';

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
    const data = await authService.login(payload.email, payload.password);

    // Store token based on "keep me signed in" choice
    const storage = keepSignedIn.checked ? localStorage : sessionStorage;
    storage.setItem('access_token', data.token);

    // Always keep in localStorage for app-wide access
    localStorage.setItem('access_token', data.token);

    userStore.setState({
      profile: data.user,
      token:   data.token,
      role:    data.user?.role || 'student',
    });

    showToast(strings?.auth?.loginSuccess || 'Welcome back!', 'success');

    setTimeout(() => {
      // Check if onboarding was completed
      const onboardingDone = localStorage.getItem('onboarding_step3_done');
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
function bindGoogleLogin() {
  if (!googleBtn) return;

  googleBtn.addEventListener('click', handleGoogleLogin);
}

async function handleGoogleLogin() {
  googleBtn.disabled = true;
  googleBtn.textContent = 'Redirecting...';

  try {
    // Redirect to Google OAuth endpoint
    // The backend will handle the OAuth flow and redirect back
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  } catch (err) {
    showToast(getErrorMessage(err), 'error');
    googleBtn.disabled = false;
    googleBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Continue with Google
    `;
  }
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