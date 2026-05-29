// Onboarding Step 3 — Study Hours Selection
// Connected to steps 1 & 2 via seamless page transitions

import { api }       from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';
import { userStore } from '../store/userStore.js';
import { strings }   from '../strings.js';

// DATA
const STUDY_HOURS_OPTIONS = [
  {
    id:    'hours-1-2',
    value: '1-2',
    label: '1–2 hours',
    desc:  'Great for steady daily improvement and long-term consistency.',
    icon: `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true">
        <path d="M13 2L4.09 12.97H11L10 22L20.91 11.03H14L13 2Z"/>
      </svg>
    `,
  },
  {
    id:    'hours-3-4',
    value: '3-4',
    label: '3–4 hours',
    desc:  'Recommended for students targeting competitive UTME scores.',
    icon: `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83
          M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    `,
  },
  {
    id:    'hours-5-plus',
    value: '5+',
    label: '5+ hours',
    desc:  'We\'ll create a deeper study schedule with more CBT simulations and reviews.',
    icon: `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true">
        <path d="M12 2.5s4 2 4 8.5c0 2.5-1.2 4.8-2 6l-2-1.5-2 1.5
          C9.2 15.8 8 13.5 8 11c0-6.5 4-8.5 4-8.5z"/>
        <circle cx="12" cy="17" r="2"/>
        <path d="M9 14c-1.5 1-2.5 2-2.5 3.5"/>
        <path d="M15 14c1.5 1 2.5 2 2.5 3.5"/>
      </svg>
    `,
  },
];

// STATE
let selectedValue = null;

// DOM REFERENCES
const optionsList       = document.getElementById('optionsList');
const finishBtn         = document.getElementById('finishBtn');
const finishBtnText     = document.getElementById('finishBtnText');
const finishBtnLoader   = document.getElementById('finishBtnLoader');
const motivationImage   = document.getElementById('motivationImage');
const motivationWrapper = motivationImage?.parentElement;
const toast             = document.getElementById('toast');
const navbar            = document.getElementById('navbar');
const backLink          = document.getElementById('backLink');
const pageOverlay       = document.getElementById('pageOverlay');

// INIT
function init() {
  guardOnboardingAccess();
  renderOptions();
  restoreSavedSelection();
  bindNavbarScroll();
  bindFinishButton();
  bindBackLink();
  initMotivationImage();
  fadeInOnLoad();
}

// GUARD
function guardOnboardingAccess() {
  const step1Done = sessionStorage.getItem('onboarding_step1_done');
  const step2Done = sessionStorage.getItem('onboarding_step2_done');

  if (!step1Done) {
    navigateTo('/pages/onboarding-step1.html');
    return;
  }

  if (!step2Done) {
    navigateTo('/pages/onboarding-step2.html');
  }
}

// RENDER OPTIONS
function renderOptions() {
  if (!optionsList) return;

  STUDY_HOURS_OPTIONS.forEach((option) => {
    const li = document.createElement('li');

    const input = document.createElement('input');
    input.type      = 'radio';
    input.name      = 'studyHours';
    input.id        = option.id;
    input.value     = option.value;
    input.className = 'option-input';

    const card = document.createElement('div');
    card.className = 'option-item';
    card.setAttribute('role',         'radio');
    card.setAttribute('aria-checked', 'false');
    card.setAttribute('tabindex',     '0');
    card.setAttribute('data-value',   option.value);

    const iconEl = document.createElement('div');
    iconEl.className = 'option-icon';
    iconEl.innerHTML = option.icon;

    const textEl = document.createElement('div');
    textEl.className = 'option-text';

    const titleEl = document.createElement('span');
    titleEl.className   = 'option-title';
    titleEl.textContent = option.label;

    const descEl = document.createElement('span');
    descEl.className   = 'option-desc';
    descEl.textContent = option.desc;

    textEl.appendChild(titleEl);
    textEl.appendChild(descEl);
    card.appendChild(iconEl);
    card.appendChild(textEl);
    li.appendChild(input);
    li.appendChild(card);
    optionsList.appendChild(li);

    card.addEventListener('click',   () => handleOptionSelect(option.value, card));
    card.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleOptionSelect(option.value, card);
      }
    });
  });
}

// OPTION SELECTION
function handleOptionSelect(value, clickedCard) {
  selectedValue = value;

  optionsList.querySelectorAll('.option-item').forEach((card) => {
    card.classList.remove('selected');
    card.setAttribute('aria-checked', 'false');
    const input = card.closest('li')?.querySelector('.option-input');
    if (input) input.checked = false;
  });

  clickedCard.classList.add('selected');
  clickedCard.setAttribute('aria-checked', 'true');

  const selectedInput = clickedCard.closest('li')?.querySelector('.option-input');
  if (selectedInput) selectedInput.checked = true;

  enableFinishButton();
  sessionStorage.setItem('onboarding_step3_hours', value);
}

function enableFinishButton() {
  if (!finishBtn) return;
  finishBtn.disabled = false;
  finishBtn.setAttribute('aria-disabled', 'false');
}

// RESTORE SAVED SELECTION
function restoreSavedSelection() {
  const saved = sessionStorage.getItem('onboarding_step3_hours');
  if (!saved) return;

  optionsList?.querySelectorAll('.option-item').forEach((card) => {
    if (card.dataset.value === saved) {
      handleOptionSelect(saved, card);
    }
  });
}

// MOTIVATION IMAGE — skeleton loading
function initMotivationImage() {
  if (!motivationImage || !motivationWrapper) return;

  motivationWrapper.classList.add('is-loading');
  motivationImage.classList.add('loading');

  const skeleton = document.createElement('div');
  skeleton.className = 'skeleton';
  skeleton.setAttribute('aria-hidden', 'true');

  motivationWrapper.style.position = 'relative';
  motivationWrapper.appendChild(skeleton);

  motivationImage.addEventListener('load', () => {
    motivationWrapper.classList.remove('is-loading');
    motivationImage.classList.remove('loading');
    motivationImage.classList.add('loaded');
    skeleton.remove();
    motivationWrapper.style.position = '';
  });

  motivationImage.addEventListener('error', () => {
    motivationWrapper.classList.remove('is-loading');
    skeleton.remove();
    motivationWrapper.style.position = '';
  });
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

// BACK LINK — seamless transition to step 2
function bindBackLink() {
  if (!backLink) return;
  backLink.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('/pages/onboarding-step2.html');
  });
}

// FINISH BUTTON
function bindFinishButton() {
  if (!finishBtn) return;
  finishBtn.addEventListener('click', handleFinish);
}

async function handleFinish() {
  if (!selectedValue) {
    showToast('Please select your daily study hours to continue.', 'error');
    return;
  }

  setFinishLoading(true);

  try {
    const onboardingPayload = buildOnboardingPayload();

    // Send all onboarding data to the backend in one call
    const response = await api.post(ENDPOINTS.STUDENT_ONBOARDING, onboardingPayload);

    // Update userStore with returned user data
    const updatedUser = response.data;
    const currentState = userStore.getState();

    userStore.setState({
      profile: updatedUser,
      token:   currentState.token,
      role:    updatedUser.role,
    });

    // Save completion flag
    localStorage.setItem('onboarding_step3_done', '1');

    showToast('Great! Setting up your study plan...', 'success');

    setTimeout(() => {
      window.location.href = '/pages/dashboard.html';
    }, 1200);

  } catch (err) {
    showToast(getErrorMessage(err), 'error');
    setFinishLoading(false);
  }
}

// buildOnboardingPayload:
function buildOnboardingPayload() {
  const step1Data = JSON.parse(sessionStorage.getItem('onboarding_step1_data') || '{}');
  const step2Data = JSON.parse(sessionStorage.getItem('onboarding_step2_data') || '{}');

  const subjectNames = (step1Data.subjects || []).map(s => s.name || s.id);

  return {
    subjects:    subjectNames,
    targetScore: step2Data.targetScore || null,
    studyPlan:   [],    // AI will generate
    schedule:    [],    // AI will generate
  };
}

// SEAMLESS TRANSITION
function navigateTo(url) {
  if (!pageOverlay) {
    window.location.href = url;
    return;
  }

  pageOverlay.classList.add('fade-in');

  setTimeout(() => {
    window.location.href = url;
  }, 300);
}

function fadeInOnLoad() {
  if (!pageOverlay) return;
  pageOverlay.classList.add('fade-in');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      pageOverlay.classList.remove('fade-in');
    });
  });
}

// HELPERS
function setFinishLoading(isLoading) {
  if (!finishBtn || !finishBtnText || !finishBtnLoader) return;
  finishBtn.disabled = isLoading;
  finishBtnText.classList.toggle('hidden', isLoading);
  finishBtnLoader.classList.toggle('hidden', !isLoading);
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
  const map = {
    400: 'Invalid data. Please try again.',
    401: 'Your session has expired. Please log in again.',
    500: strings?.errors?.generic || 'Something went wrong. Please try again.',
  };
  return map[err?.status] || err?.message || 'Something went wrong. Please try again.';
}

// BOOT
init();