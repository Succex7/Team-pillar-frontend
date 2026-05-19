// Register Logic
import { authService }  from '../services/auth.service.js';
import { userStore }    from '../store/userStore.js';
import { strings }      from '../strings.js';

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

// FORM SUBMISSIO

function bindFormSubmit() {
  form.addEventListener('submit', handleSubmit);
}

async function handleSubmit(e) {
  e.preventDefault();

  // Run all validations first
  const isValid = validateAll();
  if (!isValid) return;

  // Collect form data dynamically
  const payload = {
    fullName:   fullNameInput.value.trim(),
    phone:      phoneInput.value.trim(),
    email:      emailInput.value.trim(),
    password:   passwordInput.value,
    university: universitySelect.value || null,
    course:     courseInput.value.trim() || null,
  };

  setLoading(true);

  try {
    const data = await authService.register(payload);

    // Save auth data to store and localStorage
    localStorage.setItem('access_token', data.token);
    userStore.setState({
      profile: data.user,
      token:   data.user,
      role:    data.user?.role || 'student',
    });

    showToast(strings.auth?.registerSuccess || 'Account created! Redirecting…', 'success');

    // Small delay so toast is visible before redirect
    setTimeout(() => {
      // Redirect to onboarding/subjects screen (next step)
      window.location.href = '/pages/onboarding.html';
    }, 1200);

  } catch (err) {
    const message = getErrorMessage(err);
    showToast(message, 'error');
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