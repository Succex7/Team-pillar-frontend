// settings logic
// Settings page — profile update, password change, logout
// Endpoints used:
//   GET  /auth/me           → load current profile
//   PATCH /auth/profile     → update name, language
//   POST /auth/change-password → change password
//   POST /auth/logout       → logout

import { initShell }  from '../components/shell.js';
import { userStore }  from '../store/userStore.js';
import { api }        from '../services/api.js';
import { ENDPOINTS }  from '../services/endpoints.js';

// DOM REFERENCES — Profile
const profileForm      = document.getElementById('profileForm');
const fullNameInput    = document.getElementById('fullName');
const emailInput       = document.getElementById('email');
const languageSelect   = document.getElementById('language');
const saveProfileBtn   = document.getElementById('saveProfileBtn');
const saveProfileText  = document.getElementById('saveProfileText');
const saveProfileLoader = document.getElementById('saveProfileLoader');

const profileAvatar    = document.getElementById('profileAvatar');
const profileAvatarName  = document.getElementById('profileAvatarName');
const profileAvatarEmail = document.getElementById('profileAvatarEmail');

const planDisplayText  = document.getElementById('planDisplayText');
const planUpgradeLink  = document.getElementById('planUpgradeLink');

// DOM REFERENCES — Password
const passwordForm       = document.getElementById('passwordForm');
const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput   = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const savePasswordBtn    = document.getElementById('savePasswordBtn');
const savePasswordText   = document.getElementById('savePasswordText');
const savePasswordLoader = document.getElementById('savePasswordLoader');

// DOM REFERENCES — Logout
const logoutBtn          = document.getElementById('logoutBtn');
const logoutModal        = document.getElementById('logoutModal');
const logoutCancelBtn    = document.getElementById('logoutCancelBtn');
const logoutConfirmBtn   = document.getElementById('logoutConfirmBtn');
const logoutConfirmText  = document.getElementById('logoutConfirmText');
const logoutConfirmLoader = document.getElementById('logoutConfirmLoader');

const toast = document.getElementById('toast');


// INIT
async function init() {
  initShell('settings', 'Settings', 'Manage your account preferences');
  await loadProfile();
  bindPasswordToggles();
  bindProfileForm();
  bindPasswordForm();
  bindLogout();
}


// LOAD PROFILE FROM API
async function loadProfile() {
  try {
    const response = await api.get(ENDPOINTS.GET_ME);
    const user     = response.data || response;

    // Update userStore
    userStore.setState({
      profile: user,
      token:   localStorage.getItem('access_token') || sessionStorage.getItem('access_token'),
      role:    user.role,
    });

    populateProfile(user);

  } catch {
    // Fall back to store data if API fails
    const stored = userStore.getState().profile;
    if (stored) populateProfile(stored);
  }
}

function populateProfile(user) {
  const name  = user.name  || '';
  const email = user.email || '';
  const isPro = user.isPro ?? false;
  const lang  = user.language || 'en';

  // Avatar initials
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() || '')
    .join('');

  if (profileAvatar)      profileAvatar.textContent      = initials;
  if (profileAvatarName)  profileAvatarName.textContent  = name;
  if (profileAvatarEmail) profileAvatarEmail.textContent = email;

  if (fullNameInput)  fullNameInput.value  = name;
  if (emailInput)     emailInput.value     = email;
  if (languageSelect) languageSelect.value = lang;

  // Plan display
  if (planDisplayText) {
    planDisplayText.textContent = isPro ? 'Pro Plan ✓' : 'Free Plan';
  }

  // Hide upgrade link if already pro
  if (planUpgradeLink) {
    if (isPro) {
      planUpgradeLink.classList.add('hidden');
    } else {
      planUpgradeLink.classList.remove('hidden');
    }
  }
}


// PROFILE FORM
function bindProfileForm() {
  if (!profileForm) return;

  // Real-time validation
  fullNameInput?.addEventListener('blur',  () => validateFullName());
  fullNameInput?.addEventListener('input', () => {
    if (fullNameInput.classList.contains('is-error')) validateFullName();
  });

  profileForm.addEventListener('submit', handleProfileSave);
}

async function handleProfileSave(e) {
  e.preventDefault();

  const isValid = validateFullName();
  if (!isValid) return;

  setSaveProfileLoading(true);

  try {
    const payload = {
      name:     fullNameInput.value.trim(),
      language: languageSelect?.value || 'en',
    };

    const response = await api.patch(ENDPOINTS.UPDATE_PROFILE, payload);
    const user     = response.data || response;

    // Update store with new profile
    const currentState = userStore.getState();
    userStore.setState({
      ...currentState,
      profile: { ...currentState.profile, ...payload },
    });

    // Update avatar and name display immediately
    populateProfile({ ...userStore.getState().profile, ...user });

    showToast('Profile updated successfully!', 'success');

  } catch (err) {
    showToast(getErrorMessage(err, 'profile'), 'error');
  } finally {
    setSaveProfileLoading(false);
  }
}

function validateFullName() {
  const value   = fullNameInput?.value.trim() || '';
  const errorEl = document.getElementById('fullNameError');

  if (!value) return setFieldError(fullNameInput, errorEl, 'Full name is required');
  if (value.length < 2) return setFieldError(fullNameInput, errorEl, 'Name must be at least 2 characters');
  if (!/^[a-zA-Z\s'-]+$/.test(value)) {
    return setFieldError(fullNameInput, errorEl, 'Name can only contain letters, spaces, hyphens, and apostrophes');
  }
  return setFieldValid(fullNameInput, errorEl);
}


// PASSWORD FORM
function bindPasswordForm() {
  if (!passwordForm) return;

  newPasswordInput?.addEventListener('input', () => {
    if (newPasswordInput.classList.contains('is-error')) validateNewPassword();
    if (confirmPasswordInput?.value) validateConfirmPassword();
  });

  newPasswordInput?.addEventListener('blur',    () => validateNewPassword());
  confirmPasswordInput?.addEventListener('blur', () => validateConfirmPassword());
  currentPasswordInput?.addEventListener('blur', () => validateCurrentPassword());

  passwordForm.addEventListener('submit', handlePasswordChange);
}

async function handlePasswordChange(e) {
  e.preventDefault();

  const valid = [
    validateCurrentPassword(),
    validateNewPassword(),
    validateConfirmPassword(),
  ].every(Boolean);

  if (!valid) return;

  setSavePasswordLoading(true);

  try {
    await api.post(ENDPOINTS.CHANGE_PASSWORD, {
      currentPassword: currentPasswordInput.value,
      newPassword:     newPasswordInput.value,
    });

    // Clear password fields after success
    currentPasswordInput.value = '';
    newPasswordInput.value     = '';
    confirmPasswordInput.value = '';

    // Remove valid state from inputs
    [currentPasswordInput, newPasswordInput, confirmPasswordInput].forEach(input => {
      input?.classList.remove('is-valid', 'is-error');
    });

    showToast('Password updated successfully!', 'success');

  } catch (err) {
    showToast(getErrorMessage(err, 'password'), 'error');
  } finally {
    setSavePasswordLoading(false);
  }
}

function validateCurrentPassword() {
  const value   = currentPasswordInput?.value || '';
  const errorEl = document.getElementById('currentPasswordError');

  if (!value) return setFieldError(currentPasswordInput, errorEl, 'Current password is required');
  return setFieldValid(currentPasswordInput, errorEl);
}

function validateNewPassword() {
  const value   = newPasswordInput?.value || '';
  const errorEl = document.getElementById('newPasswordError');

  if (!value) return setFieldError(newPasswordInput, errorEl, 'New password is required');
  if (value.length < 6) return setFieldError(newPasswordInput, errorEl, 'Password must be at least 6 characters');
  if (!/[A-Z]/.test(value)) return setFieldError(newPasswordInput, errorEl, 'Must include at least one uppercase letter');
  if (!/[a-z]/.test(value)) return setFieldError(newPasswordInput, errorEl, 'Must include at least one lowercase letter');
  if (!/[0-9]/.test(value)) return setFieldError(newPasswordInput, errorEl, 'Must include at least one number');
  if (!/[@$!%*?&]/.test(value)) return setFieldError(newPasswordInput, errorEl, 'Must include a special character (@$!%*?&)');
  if (value === currentPasswordInput?.value) {
    return setFieldError(newPasswordInput, errorEl, 'New password must be different from current password');
  }
  return setFieldValid(newPasswordInput, errorEl);
}

function validateConfirmPassword() {
  const value   = confirmPasswordInput?.value || '';
  const errorEl = document.getElementById('confirmPasswordError');

  if (!value) return setFieldError(confirmPasswordInput, errorEl, 'Please confirm your new password');
  if (value !== newPasswordInput?.value) {
    return setFieldError(confirmPasswordInput, errorEl, 'Passwords do not match');
  }
  return setFieldValid(confirmPasswordInput, errorEl);
}


// PASSWORD VISIBILITY TOGGLES
function bindPasswordToggles() {
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input    = document.getElementById(targetId);
      if (!input) return;

      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';

      const eyeOpen   = btn.querySelector('.eye-open');
      const eyeClosed = btn.querySelector('.eye-closed');
      eyeOpen?.classList.toggle('hidden', isHidden);
      eyeClosed?.classList.toggle('hidden', !isHidden);
      btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    });
  });
}


// LOGOUT
function bindLogout() {
  // Open confirm modal
  logoutBtn?.addEventListener('click', () => {
    logoutModal?.classList.add('open');
  });

  // Cancel — close modal
  logoutCancelBtn?.addEventListener('click', () => {
    logoutModal?.classList.remove('open');
  });

  // Close on backdrop click
  logoutModal?.addEventListener('click', (e) => {
    if (e.target === logoutModal) logoutModal.classList.remove('open');
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') logoutModal?.classList.remove('open');
  });

  // Confirm logout
  logoutConfirmBtn?.addEventListener('click', handleLogout);
}

async function handleLogout() {
  setLogoutLoading(true);

  try {
    // Call logout endpoint to blacklist token on backend
    await api.post(ENDPOINTS.LOGOUT);
  } catch {
    // Even if API call fails, clear local state and redirect
  } finally {
    // Clear all stored auth data
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_expires_at');
    localStorage.removeItem('onboarding_data');
    localStorage.removeItem('onboarding_step3_done');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('token_expires_at');
    sessionStorage.removeItem('onboarding_step1_done');
    sessionStorage.removeItem('onboarding_step2_done');
    sessionStorage.removeItem('onboarding_step1_data');
    sessionStorage.removeItem('onboarding_step2_data');

    // Clear user store
    userStore.setState({ profile: null, token: null, role: null });

    // Redirect to login
    window.location.href = '/pages/login.html';
  }
}


// FIELD HELPERS
function setFieldError(input, errorEl, message) {
  if (!input || !errorEl) return false;
  input.classList.add('is-error');
  input.classList.remove('is-valid');
  errorEl.textContent = message;
  return false;
}

function setFieldValid(input, errorEl) {
  if (!input || !errorEl) return true;
  input.classList.remove('is-error');
  input.classList.add('is-valid');
  errorEl.textContent = '';
  return true;
}


// LOADING STATES
function setSaveProfileLoading(isLoading) {
  if (!saveProfileBtn) return;
  saveProfileBtn.disabled = isLoading;
  saveProfileText?.classList.toggle('hidden', isLoading);
  saveProfileLoader?.classList.toggle('hidden', !isLoading);
}

function setSavePasswordLoading(isLoading) {
  if (!savePasswordBtn) return;
  savePasswordBtn.disabled = isLoading;
  savePasswordText?.classList.toggle('hidden', isLoading);
  savePasswordLoader?.classList.toggle('hidden', !isLoading);
}

function setLogoutLoading(isLoading) {
  if (!logoutConfirmBtn) return;
  logoutConfirmBtn.disabled = isLoading;
  logoutConfirmText?.classList.toggle('hidden', isLoading);
  logoutConfirmLoader?.classList.toggle('hidden', !isLoading);
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
function getErrorMessage(err, context = '') {
  const passwordMap = {
    400: 'Current password is incorrect.',
    401: 'Your session expired. Please sign in again.',
    422: 'New password does not meet requirements.',
    429: 'Too many attempts. Please wait a moment.',
  };

  const profileMap = {
    400: 'Invalid data. Please check your input.',
    401: 'Your session expired. Please sign in again.',
    422: 'Some fields are invalid.',
    429: 'Too many requests. Please slow down.',
  };

  const map = context === 'password' ? passwordMap : profileMap;

  return map[err?.status]
    || err?.message
    || 'Something went wrong. Please try again.';
}


// BOOT
init();