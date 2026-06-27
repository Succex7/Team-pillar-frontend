// src/scripts/onboarding-step1.js
// Onboarding Step 1 — Select UTME Subjects
// First-time only. If user.onboardingComplete === true, redirects to dashboard.
// Subjects fetched from backend. Selection sent to backend on Next.

import { api } from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';
import { authService } from '../services/auth.service.js';
import { userStore } from '../store/userStore.js';

// STATIC FALLBACK SUBJECTS + ICONS
const STATIC_SUBJECTS = [
  {
    id: 'use-of-english',
    name: 'Use of English',
    compulsory: true,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>`,
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    compulsory: false,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01M12 9v6"/>
    </svg>`,
  },
  {
    id: 'biology',
    name: 'Biology',
    compulsory: false,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22c4.97 0 9-3.582 9-8 0-2.91-1.64-5.455-4.125-6.965"/>
      <path d="M3 14c0 4.418 4.03 8 9 8"/>
      <path d="M12 2C7.03 2 3 5.582 3 10c0 2.91 1.64 5.455 4.125 6.965"/>
      <path d="M21 10c0-4.418-4.03-8-9-8"/>
    </svg>`,
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    compulsory: false,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 3h6M9 3v7l-5 9.5A2 2 0 0 0 5.76 22h12.48A2 2 0 0 0 20 19.5L15 10V3M9 3h6"/>
    </svg>`,
  },
  {
    id: 'physics',
    name: 'Physics',
    compulsory: false,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M13 2L4.09 12.97H11L10 22L20.91 11.03H14L13 2Z"/>
    </svg>`,
  },
  {
    id: 'economics',
    name: 'Economics',
    compulsory: false,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>`,
  },
  {
    id: 'government',
    name: 'Government',
    compulsory: false,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L22 8H2L12 2Z"/>
      <rect x="4" y="9" width="3" height="10" rx="1"/>
      <rect x="10.5" y="9" width="3" height="10" rx="1"/>
      <rect x="17" y="9" width="3" height="10" rx="1"/>
      <rect x="2" y="19" width="20" height="2" rx="0.5"/>
    </svg>`,
  },
  {
    id: 'literature',
    name: 'Literature',
    compulsory: false,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>`,
  },
];

// Like the React version: min 4, max 6 subjects
const MIN_SUBJECTS = 4;
const MAX_SUBJECTS = 6;

// STATE
let activeSubjects = [];  // subjects from backend or fallback
let selectedIds = new Set();
let backendUser = null;

// DOM
const subjectsGrid = document.getElementById('subjectsGrid');
const nextBtn = document.getElementById('nextBtn');
const nextBtnText = document.getElementById('nextBtnText');
const nextBtnLoader = document.getElementById('nextBtnLoader');
const progressCount = document.getElementById('progressCount');
const progressFill = document.getElementById('progressFill');
const remainingBadge = document.getElementById('remainingBadge');
const toast = document.getElementById('toast');
const pageOverlay = document.getElementById('pageOverlay');


// ── INIT ──────────────────────────────────────────────────────────
async function init() {
  guardAuth();
  await checkOnboardingState();
  await loadSubjects();
  restoreSavedSelection();
  renderSubjects();
  updateProgress();
  updateNextButton();
  bindNextButton();
  fadeInOnLoad();
}


// ── AUTH GUARD ────────────────────────────────────────────────────
function guardAuth() {
  const token =
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token');
  if (!token) window.location.href = '/pages/login.html';
}


// ── CHECK IF ALREADY ONBOARDED ────────────────────────────────────
// Mirrors React's useAuth() + refreshOnboardingStatus()
async function checkOnboardingState() {
  try {
    const res = await authService.getMe();
    const data = res?.data?.data ?? res?.data ?? res;
    const user = data?.user ?? data;

    if (!user) return;

    backendUser = user;
    userStore.setState({ profile: user, role: user.role });

    // Fix stale lowercase language — backend enum requires 'EN' | 'FR' | 'DE'
    const validLangs = ['EN', 'FR', 'DE'];
    if (user.language && !validLangs.includes(user.language)) {
      try {
        await api.patch(ENDPOINTS.UPDATE_PROFILE, { language: 'EN' });
        user.language = 'EN';
        userStore.setState({ profile: user });
      } catch (e) {
        console.warn('Language fix failed:', e);
      }
    }

    // If already onboarded → go straight to dashboard
    if (user.onboardingComplete) {
      window.location.href = '/pages/dashboard.html';
    }
  } catch (err) {
    console.warn('onboarding-step1 checkOnboardingState:', err);
  }
}


// ── LOAD SUBJECTS FROM BACKEND ────────────────────────────────────
async function loadSubjects() {
  try {
    const res = await api.get(ENDPOINTS.GET_SUBJECTS);
    const data = res?.data ?? res;
    const list =
      Array.isArray(data) ? data :
        Array.isArray(data?.subjects) ? data.subjects :
          Array.isArray(data?.data) ? data.data : [];

    if (list.length > 0) {
      activeSubjects = list.map(mapSubjectWithIcon);
      return;
    }
  } catch (err) {
    console.warn('Subjects fetch failed, using fallback:', err);
  }
  // Use static fallback
  activeSubjects = STATIC_SUBJECTS.map(s => ({ ...s }));
}

function mapSubjectWithIcon(backendSub) {
  const name = (backendSub.name || '').toLowerCase();
  const codeKey = (backendSub.code || '').toLowerCase();

  const match = STATIC_SUBJECTS.find(s =>
    name === s.name.toLowerCase() ||
    name.includes(s.id) ||
    codeKey === s.id ||
    (name.includes('english') && s.id === 'use-of-english') ||
    (name.includes('math') && s.id === 'mathematics') ||
    (name.includes('lit') && s.id === 'literature')
  );

  return {
    id: backendSub._id || backendSub.id,
    name: backendSub.name,
    compulsory: match?.compulsory ?? name.includes('english'),
    icon: match?.icon ?? STATIC_SUBJECTS[0].icon,
  };
}


// ── RESTORE SAVED SELECTION ───────────────────────────────────────
function restoreSavedSelection() {
  // Pre-select compulsory subjects (Use of English)
  activeSubjects.filter(s => s.compulsory).forEach(s => selectedIds.add(s.id));

  // Try backend first
  const backendSubjects =
    backendUser?.onboarding?.subjects ??
    backendUser?.selectedSubjects;

  if (Array.isArray(backendSubjects) && backendSubjects.length > 0) {
    backendSubjects.forEach(id => {
      if (activeSubjects.some(s => s.id === id)) selectedIds.add(id);
    });
    return;
  }

  // Fallback to sessionStorage
  try {
    const saved = sessionStorage.getItem('onboarding_step1_subjects');
    if (saved) {
      const ids = JSON.parse(saved);
      if (Array.isArray(ids)) {
        ids.forEach(id => {
          if (activeSubjects.some(s => s.id === id)) selectedIds.add(id);
        });
      }
    }
  } catch { /* ignore */ }
}


// ── RENDER SUBJECTS ───────────────────────────────────────────────
function renderSubjects() {
  if (!subjectsGrid) return;
  subjectsGrid.innerHTML = '';

  activeSubjects.forEach(subject => {
    const li = document.createElement('li');
    const card = document.createElement('div');

    card.className = buildCardClasses(subject);
    card.setAttribute('role', 'checkbox');
    card.setAttribute('aria-checked', String(selectedIds.has(subject.id)));
    card.setAttribute('tabindex', subject.compulsory ? '-1' : '0');
    card.setAttribute('data-id', subject.id);
    card.setAttribute('aria-label', subject.name);

    if (subject.compulsory) {
      const badge = document.createElement('div');
      badge.className = 'compulsory-badge';
      badge.textContent = 'Compulsory';
      card.appendChild(badge);
    }

    const iconEl = document.createElement('div');
    iconEl.className = 'subject-icon';
    iconEl.innerHTML = subject.icon;
    card.appendChild(iconEl);

    const nameEl = document.createElement('span');
    nameEl.className = 'subject-name';
    nameEl.textContent = subject.name;
    card.appendChild(nameEl);

    const statusEl = document.createElement('div');
    statusEl.className = 'subject-status';
    statusEl.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span>${selectedIds.has(subject.id) ? 'Selected' : subject.compulsory ? 'Required' : ''}</span>
    `;
    card.appendChild(statusEl);

    if (!subject.compulsory) {
      card.addEventListener('click', () => handleToggle(subject.id, card));
      card.addEventListener('keydown', e => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleToggle(subject.id, card);
        }
      });
    }

    li.appendChild(card);
    subjectsGrid.appendChild(li);
  });
}

function buildCardClasses(subject) {
  const classes = ['subject-card'];
  if (selectedIds.has(subject.id)) classes.push('selected');
  if (subject.compulsory) classes.push('compulsory');
  return classes.join(' ');
}


// ── TOGGLE ────────────────────────────────────────────────────────
function handleToggle(id, card) {
  const subject = activeSubjects.find(s => s.id === id);
  if (!subject || subject.compulsory) return;

  if (selectedIds.has(id)) {
    selectedIds.delete(id);
    card.classList.remove('selected');
    card.setAttribute('aria-checked', 'false');
    card.querySelector('.subject-status span').textContent = '';
  } else {
    if (selectedIds.size >= MAX_SUBJECTS) {
      showToast(`You can only select up to ${MAX_SUBJECTS} subjects.`, 'error');
      return;
    }
    selectedIds.add(id);
    card.classList.add('selected');
    card.setAttribute('aria-checked', 'true');
    card.querySelector('.subject-status span').textContent = 'Selected';
  }

  updateProgress();
  updateNextButton();
  saveSelection();
}


// ── PROGRESS ──────────────────────────────────────────────────────
function updateProgress() {
  const count = selectedIds.size;
  const needed = Math.max(0, MIN_SUBJECTS - count);
  const percent = Math.min((count / MAX_SUBJECTS) * 100, 100);

  if (progressCount) progressCount.textContent = count;
  if (progressFill) progressFill.style.width = `${percent}%`;

  if (remainingBadge) {
    remainingBadge.textContent =
      count >= MIN_SUBJECTS ? 'Ready to go!' : `Select ${needed} more`;
  }

  const track = document.querySelector('.progress-track');
  if (track) track.setAttribute('aria-valuenow', count);
}

function updateNextButton() {
  if (!nextBtn) return;
  const ready = selectedIds.size >= MIN_SUBJECTS;
  nextBtn.disabled = !ready;
  nextBtn.setAttribute('aria-disabled', String(!ready));
}

function saveSelection() {
  sessionStorage.setItem(
    'onboarding_step1_subjects',
    JSON.stringify([...selectedIds])
  );
}


// ── NEXT ──────────────────────────────────────────────────────────
function bindNextButton() {
  if (!nextBtn) return;
  nextBtn.addEventListener('click', handleNext);
}

async function handleNext() {
  if (selectedIds.size < MIN_SUBJECTS) {
    showToast(`Please select at least ${MIN_SUBJECTS} subjects to continue.`, 'error');
    return;
  }

  setNextLoading(true);

  try {
    const subjectIds = [...selectedIds];

    // Send to backend — same endpoint as React version
    await api.post(ENDPOINTS.STUDENT_ONBOARDING, { subjects: subjectIds });

    // Persist for step 3 subject resolution
    const step1Data = {
      subjects: subjectIds.map(id => {
        const s = activeSubjects.find(s => s.id === id);
        return { id, name: s?.name || id };
      }),
    };
    sessionStorage.setItem('onboarding_step1_data', JSON.stringify(step1Data));
    sessionStorage.setItem('onboarding_step1_subjects', JSON.stringify(subjectIds));
    sessionStorage.setItem('onboarding_step1_done', '1');

    navigateTo('/pages/onboarding-step2.html');
  } catch (err) {
    const msg = err?.data?.message || err?.message || 'Failed to save subjects. Please try again.';
    showToast(msg, 'error');
  } finally {
    setNextLoading(false);
  }
}


// ── HELPERS ───────────────────────────────────────────────────────
function setNextLoading(isLoading) {
  if (!nextBtn) return;
  nextBtn.disabled = isLoading;
  nextBtnText?.classList.toggle('hidden', isLoading);
  nextBtnLoader?.classList.toggle('hidden', !isLoading);
}

function navigateTo(url) {
  if (!pageOverlay) { window.location.href = url; return; }
  pageOverlay.classList.add('fade-in');
  setTimeout(() => { window.location.href = url; }, 300);
}

function fadeInOnLoad() {
  if (!pageOverlay) return;
  pageOverlay.classList.add('fade-in');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { pageOverlay.classList.remove('fade-in'); });
  });
}

function showToast(message, type = '') {
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type}`.trim();
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}


// BOOT
init();