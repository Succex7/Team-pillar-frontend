// Onboarding Step 3 — Study Hours Selection

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
const optionsList         = document.getElementById('optionsList');
const finishBtn           = document.getElementById('finishBtn');
const finishBtnText       = document.getElementById('finishBtnText');
const finishBtnLoader     = document.getElementById('finishBtnLoader');
const motivationImage     = document.getElementById('motivationImage');
const motivationWrapper   = motivationImage?.parentElement;
const toast               = document.getElementById('toast');
const navbar              = document.getElementById('navbar');


// INIT
function init() {
  guardOnboardingAccess();
  renderOptions();
  restoreSavedSelection();
  bindNavbarScroll();
  bindFinishButton();
  initMotivationImage();
}

// GUARD — redirect to step 1 if onboarding not started

function guardOnboardingAccess() {
  const token = localStorage.getItem('access_token');

  if (!token) {
    // Not logged in — send to register
    window.location.href = '/pages/register.html';
    return;
  }

  // Check that previous steps were completed
  const step1Done = localStorage.getItem('onboarding_step1_done');
  const step2Done = localStorage.getItem('onboarding_step2_done');

  if (!step1Done) {
    window.location.href = '/pages/onboarding-step1.html';
    return;
  }

  if (!step2Done) {
    window.location.href = '/pages/onboarding-step2.html';
  }
}

// RENDER OPTIONS DYNAMICALLY

function renderOptions() {
  if (!optionsList) return;

  STUDY_HOURS_OPTIONS.forEach((option) => {
    const li = document.createElement('li');

    // Hidden radio for accessibility
    const input = document.createElement('input');
    input.type      = 'radio';
    input.name      = 'studyHours';
    input.id        = option.id;
    input.value     = option.value;
    input.className = 'option-input';

    // Visible card
    const card = document.createElement('div');
    card.className       = 'option-item';
    card.setAttribute('role',         'radio');
    card.setAttribute('aria-checked', 'false');
    card.setAttribute('tabindex',     '0');
    card.setAttribute('data-value',   option.value);
    card.setAttribute('data-id',      option.id);

    // Icon
    const iconEl = document.createElement('div');
    iconEl.className = 'option-icon';
    iconEl.innerHTML  = option.icon;

    // Text
    const textEl    = document.createElement('div');
    textEl.className = 'option-text';

    const titleEl       = document.createElement('span');
    titleEl.className   = 'option-title';
    titleEl.textContent = option.label;

    const descEl       = document.createElement('span');
    descEl.className   = 'option-desc';
    descEl.textContent = option.desc;

    textEl.appendChild(titleEl);
    textEl.appendChild(descEl);

    card.appendChild(iconEl);
    card.appendChild(textEl);

    li.appendChild(input);
    li.appendChild(card);
    optionsList.appendChild(li);

    // Bind click
    card.addEventListener('click', () => handleOptionSelect(option.value, card));

    // Keyboard: Space or Enter to select
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

  // Update all cards — deselect all then select clicked
  const allCards = optionsList.querySelectorAll('.option-item');

  allCards.forEach((card) => {
    card.classList.remove('selected');
    card.setAttribute('aria-checked', 'false');

    // Update hidden radio
    const input = card.closest('li')?.querySelector('.option-input');
    if (input) input.checked = false;
  });

  // Select the clicked card
  clickedCard.classList.add('selected');
  clickedCard.setAttribute('aria-checked', 'true');

  const selectedInput = clickedCard.closest('li')?.querySelector('.option-input');
  if (selectedInput) selectedInput.checked = true;

  // Enable finish button
  enableFinishButton();

  // Save selection to sessionStorage (persists across tab but not between sessions)
  sessionStorage.setItem('onboarding_step3_hours', value);
}

function enableFinishButton() {
  if (!finishBtn) return;
  finishBtn.disabled = false;
  finishBtn.setAttribute('aria-disabled', 'false');
}

function disableFinishButton() {
  if (!finishBtn) return;
  finishBtn.disabled = true;
  finishBtn.setAttribute('aria-disabled', 'true');
}

// RESTORE SAVED SELECTION — if user navigated back
function restoreSavedSelection() {
  const saved = sessionStorage.getItem('onboarding_step3_hours');
  if (!saved) return;

  const allCards = optionsList?.querySelectorAll('.option-item');
  if (!allCards) return;

  allCards.forEach((card) => {
    if (card.dataset.value === saved) {
      handleOptionSelect(saved, card);
    }
  });
}

// MOTIVATION IMAGE — skeleton loading
function initMotivationImage() {
  if (!motivationImage || !motivationWrapper) return;

  // Add skeleton class to wrapper while image loads
  motivationWrapper.classList.add('is-loading');
  motivationImage.classList.add('loading');

  // Add skeleton shimmer div inside wrapper
  const skeleton = document.createElement('div');
  skeleton.className = 'skeleton';
  skeleton.setAttribute('aria-hidden', 'true');
  skeleton.style.cssText = `
    position: absolute;
    inset: 0;
    border-radius: inherit;
  `;

  // Make wrapper relative to position skeleton
  motivationWrapper.style.position = 'relative';
  motivationWrapper.appendChild(skeleton);

  // When image loads — remove skeleton, reveal image
  motivationImage.addEventListener('load', () => {
    motivationWrapper.classList.remove('is-loading');
    motivationImage.classList.remove('loading');
    motivationImage.classList.add('loaded');
    skeleton.remove();
    motivationWrapper.style.position = '';
  });

  // If image fails to load — still remove skeleton gracefully
  motivationImage.addEventListener('error', () => {
    motivationWrapper.classList.remove('is-loading');
    skeleton.remove();
    motivationWrapper.style.position = '';
    // Show a fallback background
    motivationWrapper.style.background = 'var(--pillar-bg)';
  });
}

// NAVBAR SCROLL SHADOW
function bindNavbarScroll() {
  if (!navbar) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 10) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// FINISH BUTTON
function bindFinishButton() {
  if (!finishBtn) return;
  finishBtn.addEventListener('click', handleFinish);
}

async function handleFinish() {
  // Validate selection
  if (!selectedValue) {
    showToast('Please select your daily study hours to continue.', 'error');
    return;
  }

  setFinishLoading(true);

  try {
    // Save onboarding data to localStorage for persistence
    const onboardingData = buildOnboardingPayload();
    localStorage.setItem('onboarding_data', JSON.stringify(onboardingData));
    localStorage.setItem('onboarding_step3_done', 'true');

    // Update userStore with study hours preference
    const currentProfile = userStore.getState().profile;
    userStore.setState({
      profile: {
        ...currentProfile,
        studyHoursPerDay: selectedValue,
        onboardingComplete: true,
      },
    });

    // Optionally: send onboarding data to backend here
    // await onboardingService.complete(onboardingData);

    showToast('Great! Setting up your study plan...', 'success');

    // Short delay so toast is visible before navigating
    setTimeout(() => {
      window.location.href = '/pages/dashboard.html';
    }, 1200);

  } catch (err) {
    const message = getErrorMessage(err);
    showToast(message, 'error');
    setFinishLoading(false);
  }
}

// BUILD ONBOARDING PAYLOAD
// Collects all 3 steps into one object for backend/dashboard

function buildOnboardingPayload() {
  // Collect data saved by previous steps
  const step1Data = JSON.parse(sessionStorage.getItem('onboarding_step1_data') || '{}');
  const step2Data = JSON.parse(sessionStorage.getItem('onboarding_step2_data') || '{}');

  return {
    // Step 1 data (subjects — from teammate)
    subjects:         step1Data.subjects        || [],
    // Step 2 data (target score / preferences — from teammate)
    targetScore:      step2Data.targetScore     || null,
    targetUniversity: step2Data.university      || null,
    course:           step2Data.course          || null,
    // Step 3 data (this page)
    studyHoursPerDay: selectedValue,
    onboardingComplete: true,
    completedAt: new Date().toISOString(),
  };
}

// LOADING STATE HELPERS
function setFinishLoading(isLoading) {
  if (!finishBtn || !finishBtnText || !finishBtnLoader) return;

  finishBtn.disabled = isLoading;
  finishBtnText.classList.toggle('hidden', isLoading);
  finishBtnLoader.classList.toggle('hidden', !isLoading);
}

// TOAST
function showToast(message, type = '') {
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type}`.trim();

  // Force reflow to restart animation
  void toast.offsetWidth;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// ERROR MESSAGE MAPPER

function getErrorMessage(err) {
  const statusMessages = {
    400: 'Invalid data. Please try again.',
    401: 'Your session has expired. Please log in again.',
    500: strings?.errors?.generic || 'Something went wrong. Please try again.',
  };

  return statusMessages[err?.status]
    || err?.message
    || strings?.errors?.generic
    || 'Something went wrong. Please try again.';
}

// BOOT
init();


// INTEGRATION NOTE

// This page expects the following from Steps 1 & 2:
//
// sessionStorage keys (set by previous steps):
//   'onboarding_step1_done'   → '1' (set by step 1 on complete)
//   'onboarding_step2_done'   → '1' (set by step 2 on complete)
//   'onboarding_step1_data'   → JSON string { subjects: [] }
//   'onboarding_step2_data'   → JSON string { targetScore, university, course }
//
// localStorage keys (set on finish):
//   'onboarding_step3_done'   → '1'
//   'onboarding_data'         → JSON string (full payload of all 3 steps)
//   'access_token'            → JWT (set at login/register)
//
// Navigation flow:
//   register.html → onboarding-step1.html
//               → onboarding-step2.html
//               → onboarding-step3.html (this page)
//               → dashboard.html
