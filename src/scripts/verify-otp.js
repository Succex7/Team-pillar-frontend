// src/scripts/verify-otp.js
// Email OTP Verification — after registration
// Flow: register → verify-otp → login → onboarding/dashboard

import { api }       from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';
import { strings }   from '../strings.js';

// DOM REFERENCES
const verifyForm       = document.getElementById('verifyForm');
const otpInputs        = Array.from(document.querySelectorAll('.otp-input'));
const verifyBtn        = document.getElementById('verifyBtn');
const verifyBtnText    = document.getElementById('verifyBtnText');
const verifyBtnLoader  = document.getElementById('verifyBtnLoader');
const resendBtn        = document.getElementById('resendBtn');
const emailDisplay     = document.getElementById('emailDisplay');
const toast            = document.getElementById('toast');

// STATE
let currentEmail   = '';
let resendInterval = null;


// INIT
function init() {
  guardAccess();
  bindOtpInputs();
  bindFormSubmit();
  bindResend();
  startResendCountdown();
}


// GUARD — must come from register
function guardAccess() {
  const email = sessionStorage.getItem('pending_verify_email');
  if (!email) {
    window.location.href = '/pages/register.html';
    return;
  }
  currentEmail = email;
  if (emailDisplay) emailDisplay.textContent = email;

  // Focus first input
  setTimeout(() => otpInputs[0]?.focus(), 300);
}


// OTP INPUT HANDLING
// Each box accepts 1 digit, auto-advances, supports backspace, paste
function bindOtpInputs() {
  otpInputs.forEach((input, index) => {

    input.addEventListener('input', (e) => {
      // Strip non-digits
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val.slice(0, 1);

      // Mark filled
      if (val) {
        input.classList.add('filled');
        // Advance to next
        if (index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }
      } else {
        input.classList.remove('filled');
      }

      // Clear error on typing
      clearOtpError();

      // Auto-submit when all 4 filled
      if (getOtpValue().length === 4) {
        setTimeout(() => verifyForm.requestSubmit(), 100);
      }
    });

    input.addEventListener('keydown', (e) => {
      // Backspace: clear current, move to previous
      if (e.key === 'Backspace') {
        if (!input.value && index > 0) {
          otpInputs[index - 1].value = '';
          otpInputs[index - 1].classList.remove('filled');
          otpInputs[index - 1].focus();
        }
      }

      // Left arrow
      if (e.key === 'ArrowLeft' && index > 0) {
        otpInputs[index - 1].focus();
      }

      // Right arrow
      if (e.key === 'ArrowRight' && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    // Handle paste — distribute digits across boxes
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
      pasted.split('').forEach((digit, i) => {
        if (otpInputs[i]) {
          otpInputs[i].value = digit;
          otpInputs[i].classList.add('filled');
        }
      });
      // Focus last filled or last box
      const lastIndex = Math.min(pasted.length, otpInputs.length - 1);
      otpInputs[lastIndex].focus();

      clearOtpError();
      if (pasted.length === 4) {
        setTimeout(() => verifyForm.requestSubmit(), 100);
      }
    });

  });
}

function getOtpValue() {
  return otpInputs.map(i => i.value).join('');
}

function clearOtpInputs() {
  otpInputs.forEach(i => {
    i.value = '';
    i.classList.remove('filled', 'is-error');
  });
  otpInputs[0]?.focus();
}

function clearOtpError() {
  const errorEl = document.getElementById('otpError');
  if (errorEl) errorEl.textContent = '';
  otpInputs.forEach(i => i.classList.remove('is-error'));
}

function setOtpError(message) {
  const errorEl = document.getElementById('otpError');
  if (errorEl) errorEl.textContent = message;
  otpInputs.forEach(i => i.classList.add('is-error'));
}


// FORM SUBMIT
function bindFormSubmit() {
  if (!verifyForm) return;
  verifyForm.addEventListener('submit', handleVerify);
}

async function handleVerify(e) {
  e.preventDefault();

  const otp = getOtpValue();

  if (otp.length < 4) {
    setOtpError('Please enter the complete 4-digit code');
    return;
  }

  setLoading(true);

  try {
    await api.post(ENDPOINTS.VERIFY_OTP, {
      email: currentEmail,
      otp,
    });

    // Clean up session storage
    sessionStorage.removeItem('pending_verify_email');

    showToast('Email verified! Please sign in to continue.', 'success');

    // Redirect to login after short delay
    setTimeout(() => {
      window.location.href = '/pages/login.html';
    }, 1400);

  } catch (err) {
    setOtpError(getErrorMessage(err));
    setLoading(false);
    clearOtpInputs();
  }
}


// RESEND OTP
function bindResend() {
  if (!resendBtn) return;
  resendBtn.addEventListener('click', handleResend);
}

async function handleResend() {
  resendBtn.disabled = true;

  try {
    await api.post(ENDPOINTS.RESEND_OTP, { email: currentEmail });
    showToast('A new code has been sent to your email.', 'success');
    clearOtpInputs();
    startResendCountdown();
  } catch (err) {
    showToast(getErrorMessage(err), 'error');
    resendBtn.disabled = false;
  }
}

function startResendCountdown() {
  let seconds = 60;
  resendBtn.disabled    = true;
  resendBtn.textContent = `Resend in ${seconds}s`;

  clearInterval(resendInterval);

  resendInterval = setInterval(() => {
    seconds -= 1;
    resendBtn.textContent = `Resend in ${seconds}s`;

    if (seconds <= 0) {
      clearInterval(resendInterval);
      resendBtn.disabled    = false;
      resendBtn.textContent = 'Resend now';
    }
  }, 1000);
}


// LOADING STATE
function setLoading(isLoading) {
  if (!verifyBtn) return;
  verifyBtn.disabled = isLoading;
  verifyBtnText?.classList.toggle('hidden', isLoading);
  verifyBtnLoader?.classList.toggle('hidden', !isLoading);
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
    400: 'Invalid or expired code. Please try again.',
    404: 'Account not found. Please register again.',
    410: 'This code has expired. Request a new one.',
    422: 'Invalid code. Enter the 4-digit code from your email.',
    429: 'Too many attempts. Please wait before trying again.',
    500: strings?.errors?.generic || 'Something went wrong. Please try again.',
  };
  return map[err?.status] || err?.message || 'Something went wrong. Please try again.';
}


// BOOT
init();