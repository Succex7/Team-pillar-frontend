// src/scripts/onboarding-step1.js
// Onboarding Step 1 — Select UTME Subjects
// Handles: subject rendering, selection logic, progress bar,
//          validation, session persistence, seamless navigation

// ═══════════════════════════════════════════════════════════
// DATA — all content dynamic
// ═══════════════════════════════════════════════════════════

const SUBJECTS = [
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

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════

// Pre-select compulsory subject
let selectedIds = new Set(
  SUBJECTS.filter(s => s.compulsory).map(s => s.id)
);

// ═══════════════════════════════════════════════════════════
// DOM REFERENCES
// ═══════════════════════════════════════════════════════════

const subjectsGrid   = document.getElementById('subjectsGrid');
const nextBtn        = document.getElementById('nextBtn');
const nextBtnText    = document.getElementById('nextBtnText');
const nextBtnLoader  = document.getElementById('nextBtnLoader');
const progressCount  = document.getElementById('progressCount');
const progressFill   = document.getElementById('progressFill');
const remainingBadge = document.getElementById('remainingBadge');
const toast          = document.getElementById('toast');
const pageOverlay    = document.getElementById('pageOverlay');

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════

function init() {
  restoreSavedSelection();
  renderSubjects();
  updateProgress();
  updateNextButton();
}

// ═══════════════════════════════════════════════════════════
// RESTORE SAVED — if user navigated back from step 2
// ═══════════════════════════════════════════════════════════

function restoreSavedSelection() {
  const saved = sessionStorage.getItem('onboarding_step1_subjects');
  if (!saved) return;

  try {
    const ids = JSON.parse(saved);
    if (Array.isArray(ids)) {
      selectedIds = new Set(ids);
      // Always keep compulsory selected
      SUBJECTS.filter(s => s.compulsory).forEach(s => selectedIds.add(s.id));
    }
  } catch {
    // Ignore parse errors — start fresh
  }
}

// ═══════════════════════════════════════════════════════════
// RENDER SUBJECTS DYNAMICALLY
// ═══════════════════════════════════════════════════════════

function renderSubjects() {
  if (!subjectsGrid) return;

  SUBJECTS.forEach(subject => {
    const li = document.createElement('li');

    const card = document.createElement('div');
    card.className = buildCardClasses(subject);
    card.setAttribute('role',         'checkbox');
    card.setAttribute('aria-checked', String(selectedIds.has(subject.id)));
    card.setAttribute('tabindex',     subject.compulsory ? '-1' : '0');
    card.setAttribute('data-id',      subject.id);
    card.setAttribute('aria-label',   subject.name);

    // Compulsory badge
    if (subject.compulsory) {
      const badge = document.createElement('div');
      badge.className = 'compulsory-badge';
      badge.textContent = 'Compulsory';
      card.appendChild(badge);
    }

    // Icon
    const iconEl = document.createElement('div');
    iconEl.className = 'subject-icon';
    iconEl.innerHTML = subject.icon;
    card.appendChild(iconEl);

    // Name
    const nameEl = document.createElement('span');
    nameEl.className = 'subject-name';
    nameEl.textContent = subject.name;
    card.appendChild(nameEl);

    // Status
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

    // Events — skip for compulsory
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

// ═══════════════════════════════════════════════════════════
// TOGGLE SELECTION
// ═══════════════════════════════════════════════════════════

function handleToggle(id, card) {
  const subject = SUBJECTS.find(s => s.id === id);
  if (!subject || subject.compulsory) return;

  const isSelected = selectedIds.has(id);

  if (isSelected) {
    // Deselect
    selectedIds.delete(id);
    card.classList.remove('selected');
    card.setAttribute('aria-checked', 'false');

  } else {
    // Select — check max limit
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

// ═══════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════

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

  // Update progressbar aria
  const track = document.querySelector('.progress-track');
  if (track) track.setAttribute('aria-valuenow', count);
}

// ═══════════════════════════════════════════════════════════
// NEXT BUTTON STATE
// ═══════════════════════════════════════════════════════════

function updateNextButton() {
  if (!nextBtn) return;
  const isReady = selectedIds.size === MAX_SUBJECTS;
  nextBtn.disabled = !isReady;
  nextBtn.setAttribute('aria-disabled', String(!isReady));
}

// ═══════════════════════════════════════════════════════════
// PERSIST SELECTION
// ═══════════════════════════════════════════════════════════

function saveSelection() {
  sessionStorage.setItem(
    'onboarding_step1_subjects',
    JSON.stringify([...selectedIds])
  );
}

// ═══════════════════════════════════════════════════════════
// NEXT BUTTON — navigate to step 2
// ═══════════════════════════════════════════════════════════

function bindNextButton() {
  if (!nextBtn) return;
  nextBtn.addEventListener('click', handleNext);
}

function handleNext() {
  if (selectedIds.size < MAX_SUBJECTS) {
    showToast(`Please select ${MAX_SUBJECTS} subjects to continue.`, 'error');
    return;
  }

  // Build step 1 payload
  const step1Data = {
    subjects: [...selectedIds].map(id => {
      const subject = SUBJECTS.find(s => s.id === id);
      return { id, name: subject?.name || id };
    }),
  };

  sessionStorage.setItem('onboarding_step1_data', JSON.stringify(step1Data));
  sessionStorage.setItem('onboarding_step1_done', '1');

  // Seamless transition to step 2
  navigateTo('/pages/onboarding-step2.html');
}

// ═══════════════════════════════════════════════════════════
// SEAMLESS PAGE TRANSITION
// ═══════════════════════════════════════════════════════════

function navigateTo(url) {
  if (!pageOverlay) {
    window.location.href = url;
    return;
  }

  // Fade out current page
  pageOverlay.classList.add('fade-in');

  // Navigate after fade completes
  setTimeout(() => {
    window.location.href = url;
  }, 300);
}

// ═══════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════

function showToast(message, type = '') {
  if (!toast) return;

  toast.textContent = message;
  toast.className   = `toast ${type}`.trim();

  void toast.offsetWidth; // reflow
  toast.classList.add('show');

  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ═══════════════════════════════════════════════════════════
// FADE IN ON PAGE LOAD (arriving from another step)
// ═══════════════════════════════════════════════════════════

function fadeInOnLoad() {
  if (!pageOverlay) return;
  // Briefly show overlay then fade out
  pageOverlay.classList.add('fade-in');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      pageOverlay.classList.remove('fade-in');
    });
  });
}

// ═══════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════

init();
bindNextButton();
fadeInOnLoad();