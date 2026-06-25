// src/scripts/register.js

import { authService } from '../services/auth.service.js';
import { userStore }   from '../store/userStore.js';
import { strings }     from '../strings.js';

// DOM REFERENCES
const form           = document.getElementById('registerForm');
const firstNameInput = document.getElementById('firstName');
const lastNameInput  = document.getElementById('lastName');
const emailInput     = document.getElementById('email');
const passwordInput  = document.getElementById('password');
const agreeTerms     = document.getElementById('agreeTerms');

const togglePasswordBtn = document.getElementById('togglePassword');
const eyeOpen           = document.querySelector('#togglePassword .eye-open');
const eyeClosed         = document.querySelector('#togglePassword .eye-closed');

const submitBtn    = document.getElementById('submitBtn');
const submitText   = document.getElementById('submitText');
const submitLoader = document.getElementById('submitLoader');

const googleBtn = document.getElementById('googleBtn');
const toast     = document.getElementById('toast');


// INIT
function init() {
  redirectIfLoggedIn();
  bindPasswordToggle();
  bindGoogleButton();
  bindFormValidation();
  bindFormSubmit();
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


// GOOGLE BUTTON
function bindGoogleButton() {
  if (!googleBtn) return;
  googleBtn.addEventListener('click', () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '');
    window.location.href = `${apiBase}/auth/google`;
  });
}


// FORM VALIDATION
function bindFormValidation() {
  firstNameInput?.addEventListener('blur',  () => validateFirstName());
  lastNameInput?.addEventListener('blur',   () => validateLastName());
  emailInput?.addEventListener('blur',      () => validateEmail());
  passwordInput?.addEventListener('blur',   () => validatePassword());

  firstNameInput?.addEventListener('input', () => {
    if (firstNameInput.classList.contains('is-error')) validateFirstName();
  });
  lastNameInput?.addEventListener('input', () => {
    if (lastNameInput.classList.contains('is-error')) validateLastName();
  });
  emailInput?.addEventListener('input', () => {
    if (emailInput.classList.contains('is-error')) validateEmail();
  });
  passwordInput?.addEventListener('input', () => {
    if (passwordInput.classList.contains('is-error')) validatePassword();
  });
}

function validateFirstName() {
  const value   = firstNameInput.value.trim();
  const errorEl = document.getElementById('firstNameError');
  if (!value) return setFieldError(firstNameInput, errorEl, 'First name is required');
  if (value.length < 2) return setFieldError(firstNameInput, errorEl, 'Must be at least 2 characters');
  if (!/^[a-zA-Z\s'-]+$/.test(value)) return setFieldError(firstNameInput, errorEl, 'Letters only');
  return setFieldValid(firstNameInput, errorEl);
}

function validateLastName() {
  const value   = lastNameInput.value.trim();
  const errorEl = document.getElementById('lastNameError');
  if (!value) return setFieldError(lastNameInput, errorEl, 'Last name is required');
  if (value.length < 2) return setFieldError(lastNameInput, errorEl, 'Must be at least 2 characters');
  if (!/^[a-zA-Z\s'-]+$/.test(value)) return setFieldError(lastNameInput, errorEl, 'Letters only');
  return setFieldValid(lastNameInput, errorEl);
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
  if (value.length < 6) return setFieldError(passwordInput, errorEl, 'At least 6 characters');
  if (!/[A-Z]/.test(value)) return setFieldError(passwordInput, errorEl, 'Must include an uppercase letter');
  if (!/[a-z]/.test(value)) return setFieldError(passwordInput, errorEl, 'Must include a lowercase letter');
  if (!/[0-9]/.test(value)) return setFieldError(passwordInput, errorEl, 'Must include a number');
  if (!/[@$!%*?&]/.test(value)) return setFieldError(passwordInput, errorEl, 'Must include a special character (@$!%*?&)');
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
  return [
    validateFirstName(),
    validateLastName(),
    validateEmail(),
    validatePassword(),
  ].every(Boolean);
}


// FORM SUBMIT
function bindFormSubmit() {
  if (!form) return;
  form.addEventListener('submit', handleSubmit);
}

async function handleSubmit(e) {
  e.preventDefault();

  if (!validateAll()) return;

  // Check terms checkbox
  if (!agreeTerms?.checked) {
    showToast('Please agree to the Terms of Service to continue.', 'error');
    return;
  }

  setLoading(true);

  try {
    // Combine first + last name — API only accepts `name`
    const fullName = `${firstNameInput.value.trim()} ${lastNameInput.value.trim()}`.trim();

    const payload = {
      name:     fullName,
      email:    emailInput.value.trim(),
      password: passwordInput.value,
    };

    const response = await authService.register(payload);

    // Register returns user data but NO token
    // Token only comes after OTP verification + login
    const user = response.data;

    // Save email for OTP screen
    sessionStorage.setItem('pending_verify_email', payload.email);

    userStore.setState({ profile: user, token: null, role: user?.role });

    showToast('Account created! Check your email for a verification code.', 'success');

    setTimeout(() => {
      window.location.href = '/pages/verify-otp.html';
    }, 1200);

  } catch (err) {
    showToast(getErrorMessage(err), 'error');
    setLoading(false);
  }
}


// LOADING STATE
function setLoading(isLoading) {
  if (!submitBtn) return;
  submitBtn.disabled = isLoading;
  submitText?.classList.toggle('hidden', isLoading);
  submitLoader?.classList.toggle('hidden', !isLoading);
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
    400: 'Please check your details and try again.',
    409: 'An account with this email already exists. Try logging in.',
    422: 'Some fields are invalid. Please review your form.',
    429: 'Too many attempts. Please wait a moment.',
    500: strings?.errors?.generic || 'Something went wrong. Please try again.',
  };
  return map[err?.status] || err?.message || 'Something went wrong. Please try again.';
}


// BOOT
init();