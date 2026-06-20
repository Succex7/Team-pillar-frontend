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

const SUBJECT_NAME_TO_ID = new Map([
  ['use of english', 'use-of-english'],
  ['mathematics', 'mathematics'],
  ['biology', 'biology'],
  ['chemistry', 'chemistry'],
  ['government', 'government'],
  ['physics', 'physics'],
  ['economics', 'economics'],
  ['literature', 'literature'],
]);

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
    const subjectCatalog = await fetchSubjectCatalog();

    if (!subjectCatalog.length) {
      showToast('We could not load your subject list from the server. Please refresh and try again.', 'error');
      setFinishLoading(false);
      return;
    }

    const onboardingPayload = buildOnboardingPayload(subjectCatalog);

    if (!onboardingPayload?.onboarding?.subjects?.length) {
      showToast('Your subject selection could not be verified. Please go back and select your subjects again.', 'error');
      setFinishLoading(false);
      return;
    }

    // Send all onboarding data to the backend in one call
    const response = await api.post(ENDPOINTS.STUDENT_ONBOARDING, onboardingPayload);

    // Update userStore with returned user data
    const updatedUser = response?.data || response;
    const currentState = userStore.getState();

    userStore.setState({
      profile: updatedUser?.user || updatedUser,
      token:   currentState.token || updatedUser?.token || null,
      role:    updatedUser?.role || currentState.role || 'student',
    });

    // Save completion flag
    sessionStorage.setItem('onboarding_step3_done', '1');
    localStorage.setItem('onboarding_step3_done', '1');

    sessionStorage.setItem('onboarding_step3_data', JSON.stringify(onboardingPayload));

    showToast('Great! Setting up your study plan...', 'success');

    setTimeout(() => {
      window.location.href = '/pages/dashboard.html';
    }, 1200);

  } catch (err) {
    showToast(getErrorMessage(err), 'error');
    setFinishLoading(false);
  }
}

async function fetchSubjectCatalog() {
  try {
    const response = await api.get(ENDPOINTS.GET_SUBJECTS);
    const data = response?.data || response;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.subjects)) return data.subjects;
    if (Array.isArray(data?.data)) return data.data;

    return [];
  } catch (err) {
    console.warn('Failed to load subject catalog for onboarding:', err);
    return [];
  }
}

function buildOnboardingPayload(subjectCatalog = []) {
  const step1Data = parseStoredJson('onboarding_step1_data', {});
  const step2Data = parseStoredJson('onboarding_step2_data', {});

  const rawStoredSubjects = sessionStorage.getItem('onboarding_step1_subjects');
  const legacySubjects = parseStoredLiteral(rawStoredSubjects || '');
  const selectedSubjects = toArray(step1Data.subjects).length
    ? step1Data.subjects
    : legacySubjects;

  const subjectIds = resolveSubjectIds(selectedSubjects, subjectCatalog);
  const studyHours = selectedValue || sessionStorage.getItem('onboarding_step3_hours');
  const targetScore = Number(step2Data.targetScore) || null;

  return {
    onboarding: {
      subjects: subjectIds,
      targetScore,
      studyHours,
      dailyStudyHours: studyHours,
      studyPlan: [],
      schedule: [],
      onboardingComplete: true,
    },
  };
}

function resolveSubjectIds(selectedSubjects, subjectCatalog) {
  const normalizedCandidates = normalizeSubjectCandidates(selectedSubjects);

  const fromCatalog = subjectCatalog
    .map((subject) => ({
      id: subject?._id || subject?.id || null,
      name: subject?.name || subject?.subjectName || '',
      slug: subject?.slug || subject?.code || '',
    }))
    .filter((subject) => subject.id)
    .filter((subject) => normalizedCandidates.some((candidate) =>
      matchesSubjectCandidate(subject, candidate)
    ));

  if (fromCatalog.length) {
    return [...new Set(fromCatalog.map((subject) => subject.id))];
  }

  return normalizeSubjectIds(selectedSubjects);
}

function matchesSubjectCandidate(subject, candidate) {
  const haystacks = [
    subject.name,
    subject.slug,
    subject.id,
    candidate.name,
    candidate.slug,
    candidate.id,
    candidate.normalized,
  ].filter(Boolean).map((value) => canonicalizeSubjectToken(value));

  const candidateToken = canonicalizeSubjectToken(candidate.normalized || candidate.slug || candidate.id || candidate.name);

  return haystacks.some((value) => value === candidateToken || value.includes(candidateToken) || candidateToken.includes(value));
}

function canonicalizeSubjectToken(value) {
  return String(normalizeSubjectId(value) || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeSubjectCandidates(selectedSubjects) {
  const entries = Array.isArray(selectedSubjects) ? selectedSubjects : [selectedSubjects];

  return entries
    .map((entry) => {
      if (typeof entry === 'string') {
        return {
          name: entry,
          slug: entry,
          id: entry,
          normalized: normalizeSubjectId(entry),
        };
      }

      if (entry && typeof entry === 'object') {
        return {
          name: entry.name || entry.subjectName || '',
          slug: entry.slug || entry.code || '',
          id: entry._id || entry.id || entry.subjectId || entry.value || '',
          normalized: normalizeSubjectId(entry.name || entry.subjectName || entry._id || entry.id || entry.subjectId || entry.value || ''),
        };
      }

      return null;
    })
    .filter(Boolean);
}

function normalizeSubjectIds(rawSubjects) {
  const entries = toArray(rawSubjects);

  const normalized = entries.flatMap((entry) => {
    if (typeof entry === 'string') {
      const parsedList = toArray(parseStoredLiteral(entry));
      if (parsedList.length > 1 || (parsedList.length === 1 && parsedList[0]?.includes(','))) {
        return parsedList.flatMap((item) => toArray(normalizeSubjectId(item))).filter(Boolean);
      }

      const directId = normalizeSubjectId(entry);
      return toArray(directId).filter(Boolean);
    }

    if (entry && typeof entry === 'object') {
      const candidate = entry._id || entry.id || entry.subjectId || entry.value || null;
      const id = normalizeSubjectId(candidate || entry.name || entry.label || '');
      return toArray(id).filter(Boolean);
    }

    return [];
  });

  return [...new Set(normalized)];
}

function normalizeSubjectId(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => toArray(normalizeSubjectId(item))).filter(Boolean);
  }

  if (!value) return null;

  if (typeof value === 'object') {
    return normalizeSubjectId(value._id || value.id || value.subjectId || value.value || value.name || value.label);
  }

  const trimmed = String(value).trim();

  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.flatMap((item) => toArray(normalizeSubjectId(item))).filter(Boolean);
    }
    if (parsed && typeof parsed === 'object') {
      return normalizeSubjectId(parsed._id || parsed.id || parsed.value || parsed.name || parsed.label);
    }
  } catch {
    // Ignore invalid JSON and continue with the string normalization below.
  }

  const lowered = trimmed.toLowerCase();
  const mapped = SUBJECT_NAME_TO_ID.get(lowered) || SUBJECT_NAME_TO_ID.get(lowered.replace(/[_-]+/g, ' '));

  if (mapped) return mapped;

  return trimmed
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function parseStoredJson(key, fallback = {}) {
  const rawValue = sessionStorage.getItem(key);

  if (rawValue === null || rawValue === undefined) return fallback;

  try {
    return JSON.parse(rawValue) ?? fallback;
  } catch {
    const parsed = parseStoredLiteral(rawValue);
    return parsed ?? fallback;
  }
}

function parseStoredLiteral(value) {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();

  if (!trimmed) return '';

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const matches = trimmed.match(/'([^']*)'|"([^"]*)"|([^,\[\]\s]+)/g);

    if (matches) {
      return matches.map((item) => item.replace(/^['"]|['"]$/g, '').trim()).filter(Boolean);
    }
  }

  return trimmed;
}

function toArray(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      const matches = trimmed.match(/'([^']*)'|"([^"]*)"|([^,\[\]\s]+)/g);
      return matches
        ? matches.map((item) => item.replace(/^['"]|['"]$/g, '').trim()).filter(Boolean)
        : [trimmed];
    }
  }

  return value == null ? [] : [value];
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
  const backendMessage = err?.data?.message || err?.message;

  if (err?.status === 400) {
    return backendMessage || 'Invalid onboarding data. Please review your selections and try again.';
  }

  if (err?.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (err?.status === 403) {
    return 'You are not allowed to complete onboarding right now.';
  }

  if (err?.status === 422) {
    return backendMessage || 'The onboarding details are incomplete. Please review your selections.';
  }

  if (err?.status >= 500) {
    return backendMessage || strings?.errors?.generic || 'Our server is unavailable right now. Please try again in a moment.';
  }

  return backendMessage || 'Something went wrong. Please try again.';
}

// BOOT
init();