// Register Logic
import { authService }  from '../services/auth.service.js';
import { userStore }    from '../store/userStore.js';
import { strings }      from '../strings.js';
import { api }       from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';

// DATA
const UNIVERSITIES = [
  { value: 'unilag',   label: 'University of Lagos (UNILAG)' },
  { value: 'ui',       label: 'University of Ibadan (UI)' },
  { value: 'abuja',    label: 'University of Abuja' },
  { value: 'oau',      label: 'Obafemi Awolowo University (OAU)' },
  { value: 'uniben',   label: 'University of Benin (UNIBEN)' },
  { value: 'unn',      label: 'University of Nigeria, Nsukka (UNN)' },
  { value: 'funaab',   label: 'Federal University of Agriculture, Abeokuta (FUNAAB)' },
  { value: 'uniport',  label: 'University of Port Harcourt (UNIPORT)' },
  { value: 'abu',      label: 'Ahmadu Bello University (ABU)' },
  { value: 'unizik',   label: 'Nnamdi Azikiwe University (UNIZIK)' },
  { value: 'lasu',     label: 'Lagos State University (LASU)' },
  { value: 'futa',     label: 'Federal University of Technology, Akure (FUTA)' },
  { value: 'unilorin', label: 'University of Ilorin (UNILORIN)' },
  { value: 'other',    label: 'Other' },
];

// DOM REFERENCES

const form           = document.getElementById('registerForm');
const fullNameInput  = document.getElementById('fullName');
const phoneInput     = document.getElementById('phone');
const emailInput     = document.getElementById('email');
const passwordInput  = document.getElementById('password');
const universitySelect = document.getElementById('university');
const courseInput    = document.getElementById('course');

const togglePasswordBtn = document.getElementById('togglePassword');
const eyeOpen        = document.getElementById('eyeOpen');
const eyeClosed      = document.getElementById('eyeClosed');

const submitBtn      = document.getElementById('submitBtn');
const submitText     = document.getElementById('submitText');
const submitLoader   = document.getElementById('submitLoader');

const toast          = document.getElementById('toast');
const navbar         = document.getElementById('navbar');


// INIT — run on page load
function init() {
  populateUniversities();
  bindPasswordToggle();
  bindNavbarScroll();
  bindFormValidation();
  bindFormSubmit();
  redirectIfLoggedIn();
}

// POPULATE UNIVERSITIES DROPDOWN

function populateUniversities() {
  // Keep the default "Select Institution" option
  UNIVERSITIES.forEach(({ value, label }) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    universitySelect.appendChild(option);
  });
}

// PASSWORD TOGGLE — eye open / crossed

function bindPasswordToggle() {
  togglePasswordBtn.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';

    // Toggle input type
    passwordInput.type = isHidden ? 'text' : 'password';

    // Toggle icons
    eyeOpen.classList.toggle('hidden', isHidden);   // hide open eye when showing text
    eyeClosed.classList.toggle('hidden', !isHidden); // show crossed eye when showing text

    // Update aria label
    togglePasswordBtn.setAttribute(
      'aria-label',
      isHidden ? 'Hide password' : 'Show password'
    );
  });
}

// GOOGLE LOGIN
function handleGoogleSignup() {
  const apiBase = import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '');
  window.location.href = `${apiBase}/auth/google`;
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


// NAVBAR FLOATING SHADOW ON SCROLL

function bindNavbarScroll() {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });
}

// REDIRECT IF ALREADY LOGGED IN

function redirectIfLoggedIn() {
  const token = localStorage.getItem('access_token');
  if (token) {
    window.location.href = '/pages/dashboard.html';
  }
}

// REAL-TIME FIELD VALIDATION

function bindFormValidation() {
  fullNameInput.addEventListener('blur',  () => validateFullName());
  phoneInput.addEventListener('blur',     () => validatePhone());
  emailInput.addEventListener('blur',     () => validateEmail());
  passwordInput.addEventListener('blur',  () => validatePassword());
  passwordInput.addEventListener('input', () => {
    // Clear error as user types after blurring
    if (passwordInput.classList.contains('is-error')) {
      validatePassword();
    }
  });
}

//Individual validators 
function validateFullName() {
  const value = fullNameInput.value.trim();
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

function validatePhone() {
  const value = phoneInput.value.trim();
  const errorEl = document.getElementById('phoneError');

  if (!value) {
    return setFieldError(phoneInput, errorEl, 'Phone number is required');
  }
  // Nigerian phone numbers: 11 digits, starts with 0
  if (!/^0[789][01]\d{8}$/.test(value)) {
    return setFieldError(phoneInput, errorEl, 'Enter a valid Nigerian phone number (e.g. 08012345678)');
  }
  return setFieldValid(phoneInput, errorEl);
}

function validateEmail() {
  const value = emailInput.value.trim();
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
  const value = passwordInput.value;
  const errorEl = document.getElementById('passwordError');

  if (!value) {
    return setFieldError(passwordInput, errorEl, 'Password is required');
  }
  if (value.length < 8) {
    return setFieldError(passwordInput, errorEl, 'Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(value)) {
    return setFieldError(passwordInput, errorEl, 'Password must include at least one uppercase letter');
  }
  if (!/[0-9]/.test(value)) {
    return setFieldError(passwordInput, errorEl, 'Password must include at least one number');
  }
  return setFieldValid(passwordInput, errorEl);
}

//Field state helpers 
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

function clearFieldState(input, errorEl) {
  input.classList.remove('is-error', 'is-valid');
  errorEl.textContent = '';
}

//Run all validators, return true if all pass

function validateAll() {
  const results = [
    validateFullName(),
    validatePhone(),
    validateEmail(),
    validatePassword(),
  ];
  return results.every(Boolean);
}

// FORM SUBMISSION

function bindFormSubmit() {
  form.addEventListener('submit', handleSubmit);
}

async function handleSubmit(e) {
  e.preventDefault();

  const isValid = validateAll();
  if (!isValid) return;

  setLoading(true);

  try {
    // Step 1 — Register (API only takes name, email, password)
    const registerPayload = {
      name:     fullNameInput.value.trim(),
      email:    emailInput.value.trim(),
      password: passwordInput.value,
    };

    const registerResponse = await authService.register(registerPayload);
    const { token, user }  = registerResponse.data;

    // Store token immediately so next call is authenticated
    localStorage.setItem('access_token', token);

    // Step 2 — Save phone number via profile update (non-blocking)
    const phone = phoneInput.value.trim();
    if (phone) {
      try {
        await api.patch(ENDPOINTS.UPDATE_PROFILE, { phone });
      } catch {
        console.warn('Phone number could not be saved.');
      }
    }

    // Step 3 — Save email for OTP screen
    sessionStorage.setItem('pending_verify_email', registerPayload.email);

    userStore.setState({ profile: user, token, role: user.role });

    showToast('Account created! Check your email for a verification code.', 'success');

    setTimeout(() => {
      window.location.href = '/pages/verify-otp.html';
    }, 1200);

  } catch (err) {
    showToast(getErrorMessage(err), 'error');
    setLoading(false);
  }
}

//HELPERS

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitText.classList.toggle('hidden', isLoading);
  submitLoader.classList.toggle('hidden', !isLoading);
}

function showToast(message, type = '') {
  toast.textContent = message;
  toast.className = `toast ${type}`;

  // Force reflow to restart animation if toast is already showing
  void toast.offsetWidth;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

function getErrorMessage(err) {
  // Map backend status codes to friendly messages
  const statusMessages = {
    400: 'Please check your details and try again.',
    409: 'An account with this email already exists. Try logging in.',
    422: 'Some fields are invalid. Please review your form.',
    429: 'Too many attempts. Please wait a moment.',
    500: strings.errors?.generic || 'Something went wrong. Please try again.',
  };

  return statusMessages[err?.status]
    || err?.message
    || strings.errors?.generic
    || 'Something went wrong. Please try again.';
}

// BOOT

init();