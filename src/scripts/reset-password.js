// src/scripts/reset-password.js
// Reset Password — final step after OTP verification
// Reads email + OTP from sessionStorage, sends new password to backend

import { api }       from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';
import { strings }   from '../strings.js';

// DOM REFERENCES
const resetForm             = document.getElementById('resetForm');
const newPasswordInput      = document.getElementById('newPassword');
const confirmPasswordInput  = document.getElementById('confirmPassword');

const toggleNewBtn          = document.getElementById('toggleNewPassword');
const eyeOpenNew            = document.getElementById('eyeOpenNew');
const eyeClosedNew          = document.getElementById('eyeClosedNew');

const toggleConfirmBtn      = document.getElementById('toggleConfirmPassword');
const eyeOpenConfirm        = document.getElementById('eyeOpenConfirm');
const eyeClosedConfirm      = document.getElementById('eyeClosedConfirm');

const resetBtn              = document.getElementById('resetBtn');
const resetBtnText          = document.getElementById('resetBtnText');
const resetBtnLoader        = document.getElementById('resetBtnLoader');

const strengthBar1          = document.getElementById('strengthBar1');
const strengthBar2          = document.getElementById('strengthBar2');
const strengthBar3          = document.getElementById('strengthBar3');
const strengthBar4          = document.getElementById('strengthBar4');
const strengthLabel         = document.getElementById('strengthLabel');

const toast  = document.getElementById('toast');
const navbar = document.getElementById('navbar');


// INIT
function init() {
  guardAccess();
  bindNavbarScroll();
  bindPasswordToggles();
  bindFormValidation();
  bindFormSubmit();
}


// GUARD — must have gone through forgot-password first
function guardAccess() {
  const email = sessionStorage.getItem('forgot_password_email');
  const otp   = sessionStorage.getItem('reset_otp');

  if (!email || !otp) {
    // User landed here directly — send them back to forgot-password
    showToast('Please complete the reset flow from the beginning.', 'error');
    setTimeout(() => {
      window.location.href = '/pages/forgot-password.html';
    }, 1500);
  }
}


// PASSWORD TOGGLES
function bindPasswordToggles() {
  if (toggleNewBtn) {
    toggleNewBtn.addEventListener('click', () => {
      togglePasswordVisibility(
        newPasswordInput,
        eyeOpenNew,
        eyeClosedNew,
        toggleNewBtn
      );
    });
  }

  if (toggleConfirmBtn) {
    toggleConfirmBtn.addEventListener('click', () => {
      togglePasswordVisibility(
        confirmPasswordInput,
        eyeOpenConfirm,
        eyeClosedConfirm,
        toggleConfirmBtn
      );
    });
  }
}

function togglePasswordVisibility(input, openIcon, closedIcon, btn) {
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  openIcon.classList.toggle('hidden', isHidden);
  closedIcon.classList.toggle('hidden', !isHidden);
  btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
}


// FORM VALIDATION
function bindFormValidation() {
  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', () => {
      updateStrengthIndicator(newPasswordInput.value);
      if (newPasswordInput.classList.contains('is-error')) validateNewPassword();
      // Re-validate confirm if it has a value
      if (confirmPasswordInput.value) validateConfirmPassword();
    });
    newPasswordInput.addEventListener('blur', () => validateNewPassword());
  }

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('blur',  () => validateConfirmPassword());
    confirmPasswordInput.addEventListener('input', () => {
      if (confirmPasswordInput.classList.contains('is-error')) validateConfirmPassword();
    });
  }
}

function validateNewPassword() {
  const value   = newPasswordInput.value;
  const errorEl = document.getElementById('newPasswordError');

  if (!value) {
    return setFieldError(newPasswordInput, errorEl, 'Password is required');
  }
  if (value.length < 8) {
    return setFieldError(newPasswordInput, errorEl, 'Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(value)) {
    return setFieldError(newPasswordInput, errorEl, 'Must include at least one uppercase letter');
  }
  if (!/[0-9]/.test(value)) {
    return setFieldError(newPasswordInput, errorEl, 'Must include at least one number');
  }
  return setFieldValid(newPasswordInput, errorEl);
}

function validateConfirmPassword() {
  const value   = confirmPasswordInput.value;
  const errorEl = document.getElementById('confirmPasswordError');

  if (!value) {
    return setFieldError(confirmPasswordInput, errorEl, 'Please confirm your password');
  }
  if (value !== newPasswordInput.value) {
    return setFieldError(confirmPasswordInput, errorEl, 'Passwords do not match');
  }
  return setFieldValid(confirmPasswordInput, errorEl);
}

function validateAll() {
  return [
    validateNewPassword(),
    validateConfirmPassword(),
  ].every(Boolean);
}


// PASSWORD STRENGTH INDICATOR
function updateStrengthIndicator(password) {
  const bars   = [strengthBar1, strengthBar2, strengthBar3, strengthBar4];
  const score  = getPasswordScore(password);
  const levels = [
    { min: 0, label: '',        color: '' },
    { min: 1, label: 'Weak',   color: 'weak' },
    { min: 2, label: 'Fair',   color: 'fair' },
    { min: 3, label: 'Good',   color: 'good' },
    { min: 4, label: 'Strong', color: 'strong' },
  ];

  const level = levels[score] || levels[0];

  bars.forEach((bar, i) => {
    bar.className = 'strength-bar';
    if (i < score) bar.classList.add(level.color);
  });

  if (strengthLabel) {
    strengthLabel.textContent = level.label;
    strengthLabel.style.color = {
      weak:   '#ef4444',
      fair:   '#f59e0b',
      good:   '#3b82f6',
      strong: '#22c55e',
    }[level.color] || '';
  }
}

function getPasswordScore(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8)         score++;
  if (/[A-Z]/.test(password))       score++;
  if (/[0-9]/.test(password))       score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}


// FORM SUBMISSION
function bindFormSubmit() {
  if (!resetForm) return;
  resetForm.addEventListener('submit', handleReset);
}

async function handleReset(e) {
  e.preventDefault();

  const isValid = validateAll();
  if (!isValid) return;

  const email       = sessionStorage.getItem('forgot_password_email');
  const otp         = sessionStorage.getItem('reset_otp');
  const newPassword = newPasswordInput.value;

  if (!email || !otp) {
    showToast('Session expired. Please start the reset process again.', 'error');
    setTimeout(() => {
      window.location.href = '/pages/forgot-password.html';
    }, 1500);
    return;
  }

  setLoading(true);

  try {
    await api.post(ENDPOINTS.RESET_PASSWORD, {
      email,
      otp,
      newPassword,
      confirmPassword: confirmPasswordInput.value,
    });

    // Clear reset session data
    sessionStorage.removeItem('forgot_password_email');
    sessionStorage.removeItem('reset_otp');

    showToast('Password reset successfully! Please sign in.', 'success');

    setTimeout(() => {
      window.location.href = '/pages/login.html';
    }, 1500);

  } catch (err) {
    showToast(getErrorMessage(err), 'error');
    setLoading(false);
  }
}


// NAVBAR SCROLL
function bindNavbarScroll() {
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}


// LOADING STATE
function setLoading(isLoading) {
  if (!resetBtn) return;
  resetBtn.disabled = isLoading;
  resetBtnText.classList.toggle('hidden', isLoading);
  resetBtnLoader.classList.toggle('hidden', !isLoading);
}


// FIELD HELPERS
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
    400: 'Invalid request. The code may have expired.',
    401: 'Invalid or expired reset code. Please try again.',
    404: 'Account not found. Please check your email.',
    422: 'Password does not meet requirements.',
    429: 'Too many attempts. Please wait a moment.',
    500: strings?.errors?.generic || 'Something went wrong. Please try again.',
  };

  return map[err?.status]
    || err?.message
    || 'Something went wrong. Please try again.';
}


// BOOT
init();