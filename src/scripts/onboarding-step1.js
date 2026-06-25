// Onboarding Step 1 — Select UTME Subjects
// Handles: subject rendering, selection logic, progress bar,
//          validation, session persistence, seamless navigation, API integration

import { api } from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';
import { authService } from '../services/auth.service.js';
import { userStore } from '../store/userStore.js';

// STATIC FALLBACK DATA (with SVG icons)
const STATIC_SUBJECTS = [
  {
    id:          'use-of-english',
    name:        'Use of English',
    compulsory:  true,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>`,
  },
  {
    id:         'mathematics',
    name:       'Mathematics',
    compulsory:  false,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01M12 9v6"/>
    </svg>`,
  },
  {
    id:         'biology',
    name:       'Biology',
    compulsory:  false,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22c4.97 0 9-3.582 9-8 0-2.91-1.64-5.455-4.125-6.965"/>
      <path d="M3 14c0 4.418 4.03 8 9 8"/>
      <path d="M12 2C7.03 2 3 5.582 3 10c0 2.91 1.64 5.455 4.125 6.965"/>
      <path d="M21 10c0-4.418-4.03-8-9-8"/>
    </svg>`,
  },
  {
    id:         'chemistry',
    name:       'Chemistry',
    compulsory:  false,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 3h6M9 3v7l-5 9.5A2 2 0 0 0 5.76 22h12.48A2 2 0 0 0 20 19.5L15 10V3M9 3h6"/>
    </svg>`,
  },
  {
    id:         'government',
    name:       'Government',
    compulsory:  false,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L22 8H2L12 2Z"/>
      <rect x="4" y="9" width="3" height="10" rx="1"/>
      <rect x="10.5" y="9" width="3" height="10" rx="1"/>
      <rect x="17" y="9" width="3" height="10" rx="1"/>
      <rect x="2" y="19" width="20" height="2" rx="0.5"/>
    </svg>`,
  },
  {
    id:         'physics',
    name:       'Physics',
    compulsory:  false,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M13 2L4.09 12.97H11L10 22L20.91 11.03H14L13 2Z"/>
    </svg>`,
  },
  {
    id:         'economics',
    name:       'Economics',
    compulsory:  false,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>`,
  },
  {
    id:         'literature',
    name:       'Literature',
    compulsory:  false,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>`,
  },
];

const MAX_SUBJECTS   = 4;
const TOTAL_SUBJECTS = 4;

// STATE
let activeSubjects = [];
let selectedIds = new Set();

// DOM REFERENCES
const subjectsGrid   = document.getElementById('subjectsGrid');
const nextBtn        = document.getElementById('nextBtn');
const nextBtnText    = document.getElementById('nextBtnText');
const nextBtnLoader  = document.getElementById('nextBtnLoader');
const progressCount  = document.getElementById('progressCount');
const progressFill   = document.getElementById('progressFill');
const remainingBadge = document.getElementById('remainingBadge');
const toast          = document.getElementById('toast');
const pageOverlay    = document.getElementById('pageOverlay');

// INIT
async function init() {
  guardAuth();
  await checkOnboardingState();
  await loadSubjects();
  restoreSavedSelection();
  renderSubjects();
  updateProgress();
  updateNextButton();
}

function guardAuth() {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  if (!token) {
    window.location.href = '/pages/login.html';
  }
}

async function checkOnboardingState() {
  try {
    const res = await authService.getMe();
    const payload = res?.data?.data ?? res?.data ?? res;
    const user = payload?.user ?? payload;
    if (user) {
      userStore.setState({ profile: user, role: user.role });

      // Auto-fix invalid user language values (e.g. 'en', 'yoruba', etc.)
      const validLangs = ['EN', 'FR', 'DE'];
      if (!validLangs.includes(user.language)) {
        console.log(`Auto-fixing invalid language '${user.language}' to 'EN' in the database...`);
        try {
          await api.patch(ENDPOINTS.UPDATE_PROFILE, { language: 'EN' });
          user.language = 'EN';
          userStore.setState({ profile: user });
        } catch (e) {
          console.warn("Failed to auto-fix language:", e);
        }
      }

      if (user.onboardingComplete) {
        window.location.href = '/pages/dashboard.html';
      }
    }
  } catch (err) {
    console.warn('Failed to verify user onboarding status:', err);
  }
}

// FETCH SUBJECTS FROM BACKEND
async function loadSubjects() {
  try {
    const res = await api.get(ENDPOINTS.GET_SUBJECTS);
    const data = res?.data ?? res;
    const backendList = Array.isArray(data) ? data : (Array.isArray(data?.subjects) ? data.subjects : (Array.isArray(data?.data) ? data.data : []));
    
    if (backendList && backendList.length > 0) {
      activeSubjects = backendList.map(mapSubjectWithIcon);
      return;
    }
  } catch (err) {
    console.warn('Failed to load subjects from backend, using fallbacks', err);
  }
  
  // Use fallbacks
  activeSubjects = STATIC_SUBJECTS.map(s => ({
    id: s.id,
    name: s.name,
    compulsory: s.compulsory,
    icon: s.icon
  }));
}

function mapSubjectWithIcon(backendSub) {
  const name = backendSub.name || '';
  const nameLower = name.toLowerCase();

  // Find matching static subject
  let match = STATIC_SUBJECTS.find(s => s.name.toLowerCase() === nameLower || nameLower.includes(s.id));
  if (!match) {
    if (nameLower.includes('english')) {
      match = STATIC_SUBJECTS.find(s => s.id === 'use-of-english');
    } else if (nameLower.includes('math')) {
      match = STATIC_SUBJECTS.find(s => s.id === 'mathematics');
    } else if (nameLower.includes('literature')) {
      match = STATIC_SUBJECTS.find(s => s.id === 'literature');
    }
  }

  return {
    id: backendSub._id || backendSub.id,
    name: backendSub.name,
    compulsory: match ? match.compulsory : (nameLower.includes('english') ? true : false),
    icon: match ? match.icon : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>`
  };
}

// RESTORE SAVED
function restoreSavedSelection() {
  // Add compulsory subjects by default
  activeSubjects.filter(s => s.compulsory).forEach(s => selectedIds.add(s.id));

  const saved = sessionStorage.getItem('onboarding_step1_subjects');
  if (!saved) return;

  try {
    const ids = JSON.parse(saved);
    if (Array.isArray(ids)) {
      ids.forEach(id => {
        // Only restore if the subject exists in our active list
        if (activeSubjects.some(s => s.id === id)) {
          selectedIds.add(id);
        }
      });
    }
  } catch {
    // Ignore fresh start
  }
}

// RENDER SUBJECTS
function renderSubjects() {
  if (!subjectsGrid) return;
  subjectsGrid.innerHTML = '';

  activeSubjects.forEach(subject => {
    const li = document.createElement('li');

    const card = document.createElement('div');
    card.className = buildCardClasses(subject);
    card.setAttribute('role',         'checkbox');
    card.setAttribute('aria-checked', String(selectedIds.has(subject.id)));
    card.setAttribute('tabindex',     subject.compulsory ? '-1' : '0');
    card.setAttribute('data-id',      subject.id);
    card.setAttribute('aria-label',   subject.name);

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
      <span>Selected</span>
    `;
    card.appendChild(statusEl);

    if (!subject.compulsory) {
      card.addEventListener('click',   () => handleToggle(subject.id, card));
      card.addEventListener('keydown', (e) => {
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

// TOGGLE SELECTION
function handleToggle(id, card) {
  const subject = activeSubjects.find(s => s.id === id);
  if (!subject || subject.compulsory) return;

  const isSelected = selectedIds.has(id);

  if (isSelected) {
    selectedIds.delete(id);
    card.classList.remove('selected');
    card.setAttribute('aria-checked', 'false');
  } else {
    if (selectedIds.size >= MAX_SUBJECTS) {
      showToast(`You can only select ${MAX_SUBJECTS} subjects.`, 'error');
      return;
    }
    selectedIds.add(id);
    card.classList.add('selected');
    card.setAttribute('aria-checked', 'true');
  }

  updateProgress();
  updateNextButton();
  saveSelection();
}

function updateProgress() {
  const count     = selectedIds.size;
  const remaining = MAX_SUBJECTS - count;
  const percent   = (count / TOTAL_SUBJECTS) * 100;

  if (progressCount)  progressCount.textContent  = count;
  if (progressFill)   progressFill.style.width    = `${percent}%`;

  if (remainingBadge) {
    remainingBadge.textContent = remaining > 0
      ? `Remaining ${remaining}`
      : 'Complete!';
  }

  const track = document.querySelector('.progress-track');
  if (track) track.setAttribute('aria-valuenow', count);
}

function updateNextButton() {
  if (!nextBtn) return;
  const isReady = selectedIds.size === MAX_SUBJECTS;
  nextBtn.disabled = !isReady;
  nextBtn.setAttribute('aria-disabled', String(!isReady));
}

function saveSelection() {
  sessionStorage.setItem(
    'onboarding_step1_subjects',
    JSON.stringify([...selectedIds])
  );
}

// NEXT BUTTON — navigate to step 2 with API sync
function bindNextButton() {
  if (!nextBtn) return;
  nextBtn.addEventListener('click', handleNext);
}

async function handleNext() {
  if (selectedIds.size < MAX_SUBJECTS) {
    showToast(`Please select ${MAX_SUBJECTS} subjects to continue.`, 'error');
    return;
  }

  setNextLoading(true);

  try {
    const subjectIds = [...selectedIds];
    
    // Sync Step 1: send subjects selection to backend
    await api.post(ENDPOINTS.STUDENT_ONBOARDING, { subjects: subjectIds });

    const step1Data = {
      subjects: subjectIds.map(id => {
        const subject = activeSubjects.find(s => s.id === id);
        return { id, name: subject?.name || id };
      }),
    };

    sessionStorage.setItem('onboarding_step1_data', JSON.stringify(step1Data));
    sessionStorage.setItem('onboarding_step1_done', '1');

    navigateTo('/pages/onboarding-step2.html');
  } catch (err) {
    showToast(err?.message || 'Failed to sync selection with backend. Please try again.', 'error');
  } finally {
    setNextLoading(false);
  }
}

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

function showToast(message, type = '') {
  if (!toast) return;
  toast.textContent = message;
  toast.className   = `toast ${type}`.trim();
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
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

function setNextLoading(isLoading) {
  if (!nextBtn || !nextBtnText || !nextBtnLoader) return;
  nextBtn.disabled = isLoading;
  nextBtnText.classList.toggle('hidden', isLoading);
  nextBtnLoader.classList.toggle('hidden', !isLoading);
}

init();
bindNextButton();
fadeInOnLoad();