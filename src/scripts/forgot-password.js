// src/scripts/forgot-password.js
// Forgot Password — Step 1: Enter email, Step 2: Enter OTP
// On OTP verified → redirect to reset-password.html

import { api }       from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';
import { strings }   from '../strings.js';

// DOM REFERENCES
const stepEmail       = document.getElementById('stepEmail');
const stepOtp         = document.getElementById('stepOtp');

const forgotForm      = document.getElementById('forgotForm');
const emailInput      = document.getElementById('email');
const sendOtpBtn      = document.getElementById('sendOtpBtn');
const sendOtpText     = document.getElementById('sendOtpText');
const sendOtpLoader   = document.getElementById('sendOtpLoader');

const otpForm         = document.getElementById('otpForm');
const otpInput        = document.getElementById('otp');
const otpEmailDisplay = document.getElementById('otpEmailDisplay');
const verifyOtpBtn    = document.getElementById('verifyOtpBtn');
const verifyOtpText   = document.getElementById('verifyOtpText');
const verifyOtpLoader = document.getElementById('verifyOtpLoader');

const resendBtn       = document.getElementById('resendBtn');

const toast   = document.getElementById('toast');
const navbar  = document.getElementById('navbar');

// STATE
let currentEmail    = '';
let resendCountdown = null;


// INIT
function init() {
  bindNavbarScroll();
  bindForgotForm();
  bindOtpForm();
  bindResend();
  prefillEmailIfAvailable();
}


// PRE-FILL EMAIL — if user came from login page
function prefillEmailIfAvailable() {
  const saved = sessionStorage.getItem('forgot_password_email');
  if (saved && emailInput) {
    emailInput.value = saved;
  }
}


// STEP 1 — SEND OTP
function bindForgotForm() {
  if (!forgotForm) return;
  forgotForm.addEventListener('submit', handleSendOtp);
  emailInput.addEventListener('blur',  () => validateEmail());
  emailInput.addEventListener('input', () => {
    if (emailInput.classList.contains('is-error')) validateEmail();
  });
}

async function handleSendOtp(e) {
  e.preventDefault();

  const isValid = validateEmail();
  if (!isValid) return;

  currentEmail = emailInput.value.trim();
  setSendLoading(true);

  try {
    await api.post(ENDPOINTS.FORGOT_PASSWORD, { email: currentEmail });

    // Save email for use on reset-password page
    sessionStorage.setItem('forgot_password_email', currentEmail);

    showToast('Reset code sent! Check your email.', 'success');
    showOtpStep();

  } catch (err) {
    showToast(getErrorMessage(err), 'error');
  } finally {
    setSendLoading(false);
  }
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


// STEP 2 — VERIFY OTP
function bindOtpForm() {
  if (!otpForm) return;
  otpForm.addEventListener('submit', handleVerifyOtp);

  // Auto-format OTP input — numbers only
  if (otpInput) {
    otpInput.addEventListener('input', () => {
      otpInput.value = otpInput.value.replace(/\D/g, '').slice(0, 4);
      if (otpInput.classList.contains('is-error')) validateOtp();
    });
    otpInput.addEventListener('blur', () => validateOtp());
  }
}

async function handleVerifyOtp(e) {
  e.preventDefault();

  const isValid = validateOtp();
  if (!isValid) return;

  setVerifyLoading(true);

  try {
    await api.post(ENDPOINTS.VERIFY_OTP, {
      email: currentEmail,
      otp:   otpInput.value.trim(),
    });

    // Save OTP for use on reset-password page
    sessionStorage.setItem('reset_otp', otpInput.value.trim());

    showToast('Code verified! Set your new password.', 'success');

    // Small delay so toast is visible
    setTimeout(() => {
      window.location.href = '/pages/reset-password.html';
    }, 900);

  } catch (err) {
    showToast(getErrorMessage(err), 'error');
    setVerifyLoading(false);
  }
}

function validateOtp() {
  const value   = otpInput.value.trim();
  const errorEl = document.getElementById('otpError');

  if (!value) {
    return setFieldError(otpInput, errorEl, 'Please enter the code from your email');
  }
  if (value.length < 4) {
    return setFieldError(otpInput, errorEl, 'Code must be 4 digits');
  }
  return setFieldValid(otpInput, errorEl);
}


// RESEND OTP
function bindResend() {
  if (!resendBtn) return;
  resendBtn.addEventListener('click', handleResend);
}

async function handleResend() {
  if (!currentEmail) return;

  resendBtn.disabled = true;

  try {
    await api.post(ENDPOINTS.RESEND_OTP, { email: currentEmail });
    showToast('A new code has been sent to your email.', 'success');
    startResendCountdown();
  } catch (err) {
    showToast(getErrorMessage(err), 'error');
    resendBtn.disabled = false;
  }
}

function startResendCountdown() {
  let seconds = 60;
  resendBtn.disabled  = true;
  resendBtn.textContent = `Resend in ${seconds}s`;

  clearInterval(resendCountdown);

  resendCountdown = setInterval(() => {
    seconds -= 1;
    resendBtn.textContent = `Resend in ${seconds}s`;

    if (seconds <= 0) {
      clearInterval(resendCountdown);
      resendBtn.disabled    = false;
      resendBtn.textContent = 'Resend code';
    }
  }, 1000);
}


// STEP SWITCHING
function showOtpStep() {
  if (!stepEmail || !stepOtp) return;

  // Show the email in OTP step
  if (otpEmailDisplay) otpEmailDisplay.textContent = currentEmail;

  stepEmail.classList.add('hidden');
  stepOtp.classList.remove('hidden');

  // Focus OTP input
  setTimeout(() => otpInput?.focus(), 100);

  // Start a 60s countdown before allowing resend
  startResendCountdown();
}


// NAVBAR SCROLL
function bindNavbarScroll() {
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}


// LOADING STATES
function setSendLoading(isLoading) {
  if (!sendOtpBtn) return;
  sendOtpBtn.disabled = isLoading;
  sendOtpText.classList.toggle('hidden', isLoading);
  sendOtpLoader.classList.toggle('hidden', !isLoading);
}

function setVerifyLoading(isLoading) {
  if (!verifyOtpBtn) return;
  verifyOtpBtn.disabled = isLoading;
  verifyOtpText.classList.toggle('hidden', isLoading);
  verifyOtpLoader.classList.toggle('hidden', !isLoading);
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
    400: 'Invalid request. Please check your details.',
    404: 'No account found with this email address.',
    410: 'This code has expired. Please request a new one.',
    422: 'Invalid code. Please try again.',
    429: 'Too many attempts. Please wait a moment.',
    500: strings?.errors?.generic || 'Something went wrong. Please try again.',
  };

  return map[err?.status]
    || err?.message
    || 'Something went wrong. Please try again.';
}


// BOOT
init();