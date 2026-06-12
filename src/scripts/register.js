// src/scripts/register.js

import { authService } from '../services/auth.service.js';
import { userStore }   from '../store/userStore.js';
import { strings }     from '../strings.js';

// DOM REFERENCES
const form          = document.getElementById('registerForm');
const fullNameInput = document.getElementById('fullName');
const emailInput    = document.getElementById('email');
const passwordInput = document.getElementById('password');

const togglePasswordBtn = document.getElementById('togglePassword');
const eyeOpen           = document.getElementById('eyeOpen');
const eyeClosed         = document.getElementById('eyeClosed');

const submitBtn    = document.getElementById('submitBtn');
const submitText   = document.getElementById('submitText');
const submitLoader = document.getElementById('submitLoader');

const googleBtn = document.getElementById('googleBtn');
const toast     = document.getElementById('toast');
const navbar    = document.getElementById('navbar');


// INIT
function init() {
  redirectIfLoggedIn();
  bindPasswordToggle();
  bindGoogleButton();
  bindNavbarScroll();
  bindFormValidation();
  bindFormSubmit();
}


// REDIRECT IF ALREADY LOGGED IN
function redirectIfLoggedIn() {
  const token =
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token');

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


// GOOGLE BUTTON
function bindGoogleButton() {
  if (!googleBtn) return;
  googleBtn.addEventListener('click', handleGoogleSignup);
}

function handleGoogleSignup() {
  const apiBase = import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '');
  window.location.href = `${apiBase}/auth/google`;
}


// NAVBAR SCROLL
function bindNavbarScroll() {
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}


// FORM VALIDATION
function bindFormValidation() {
  fullNameInput.addEventListener('blur',  () => validateFullName());
  emailInput.addEventListener('blur',     () => validateEmail());
  passwordInput.addEventListener('blur',  () => validatePassword());

  fullNameInput.addEventListener('input', () => {
    if (fullNameInput.classList.contains('is-error')) validateFullName();
  });

  emailInput.addEventListener('input', () => {
    if (emailInput.classList.contains('is-error')) validateEmail();
  });

  passwordInput.addEventListener('input', () => {
    if (passwordInput.classList.contains('is-error')) validatePassword();
  });
}

function validateFullName() {
  const value   = fullNameInput.value.trim();
  const errorEl = document.getElementById('fullNameError');

  if (!value) {
    return setFieldError(fullNameInput, errorEl, 'Full name is required');
  }
  if (value.length < 2) {
    return setFieldError(fullNameInput, errorEl, 'Name must be at least 2 characters');
  }
  if (!/^[a-zA-Z\s'-]+$/.test(value)) {
    return setFieldError(fullNameInput, errorEl, 'Name can only contain letters, spaces, hyphens, and apostrophes');
  }
  return setFieldValid(fullNameInput, errorEl);
}

function validateEmail() {
  const value   = emailInput.value.trim();
  const errorEl = document.getElementById('emailError');

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
  if (!/[A-Z]/.test(value)) {
    return setFieldError(passwordInput, errorEl, 'Must include at least one uppercase letter');
  }
  if (!/[a-z]/.test(value)) {
    return setFieldError(passwordInput, errorEl, 'Must include at least one lowercase letter');
  }
  if (!/[0-9]/.test(value)) {
    return setFieldError(passwordInput, errorEl, 'Must include at least one number');
  }
  if (!/[@$!%*?&]/.test(value)) {
    return setFieldError(passwordInput, errorEl, 'Must include at least one special character (@$!%*?&)');
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
    validateFullName(),
    validateEmail(),
    validatePassword(),
  ];
  return results.every(Boolean);
}


// FORM SUBMISSION
function bindFormSubmit() {
  if (!form) return;
  form.addEventListener('submit', handleSubmit);
}

async function handleSubmit(e) {
  e.preventDefault();

  const isValid = validateAll();
  if (!isValid) return;

  setLoading(true);

  try {
    // API accepts: name, email, password ONLY
    const payload = {
      name:     fullNameInput.value.trim(),
      email:    emailInput.value.trim(),
      password: passwordInput.value,
    };

    const response = await authService.register(payload);

    // Register returns user data but NO token
    // Token only comes after OTP email verification + login
    // response.data shape: { id, name, email, role, emailVerified, isPro, onboarding, createdAt }
    const user = response.data;

    // Save email so OTP verification screen knows who to verify
    sessionStorage.setItem('pending_verify_email', payload.email);

    userStore.setState({
      profile: user,
      token:   null,
      role:    user.role,
    });

    showToast('Account created! Check your email for a verification code.', 'success');

    setTimeout(() => {
      window.location.href = '/pages/verify-otp.html';
    }, 1200);

  } catch (err) {
    showToast(getErrorMessage(err), 'error');
    setLoading(false);
  }
}


// HELPERS
function setLoading(isLoading) {
  if (!submitBtn) return;
  submitBtn.disabled = isLoading;
  submitText.classList.toggle('hidden', isLoading);
  submitLoader.classList.toggle('hidden', !isLoading);
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
    400: 'Please check your details and try again.',
    409: 'An account with this email already exists. Try logging in.',
    422: 'Some fields are invalid. Please review your form.',
    429: 'Too many attempts. Please wait a moment.',
    500: strings?.errors?.generic || 'Something went wrong. Please try again.',
  };

  return statusMessages[err?.status]
    || err?.message
    || strings?.errors?.generic
    || 'Something went wrong. Please try again.';
}

// BOOT
init();