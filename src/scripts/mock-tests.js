// src/scripts/mock-tests.js
import { initShell } from '../components/shell.js';
import { userStore } from '../store/userStore.js';
import { api }       from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';

const ICON_COLOURS = [
  { bg: '#FFF7ED', color: '#F97316' },
  { bg: '#F0FDF4', color: '#22C55E' },
  { bg: '#FAF5FF', color: '#A855F7' },
  { bg: '#EFF6FF', color: '#3B82F6' },
];

const STREAK_MESSAGES = {
  zero:   { text: 'Take your first mock today!',    icon: 'ph-bold ph-rocket-launch' },
  low:    { text: 'Good start — keep it going!',    icon: 'ph-bold ph-trend-up'      },
  mid:    { text: "Keep it up! You're improving.",  icon: 'ph-bold ph-check-circle'  },
  high:   { text: "On fire! Don't stop now 🔥",     icon: 'ph-bold ph-fire'          },
  legend: { text: 'Legendary streak! JAMB ready.',  icon: 'ph-bold ph-trophy'        },
};

let userSubjects = [];
let allSubjects = [];
let isProUser = false;
let startPayload = null; // Stored payload before fullscreen confirm
let selectedMockSubjects = [];

async function init() {
  const user = userStore.getState().profile;
  isProUser = user?.subscription === 'pro' || user?.isPro || false;

  await initShell(
    'mock-test',
    'Mock Tests',
    'Full UTME simulations and anti-cheat exam engine'
  );

  await Promise.allSettled([
    loadMockHistory(),
    loadMockStats(),
    loadWeekStats(),
    loadUserSubjects(),
  ]);

  bindModalHandlers();
}

// FETCH USER SUBJECTS
async function loadUserSubjects() {
  try {
    const meRes = await api.get(ENDPOINTS.GET_ME);
    const meData = meRes.data ?? meRes;
    const user = meData.user ?? meData;

    const selectedSubjectIds = user?.selectedSubjects ?? [];

    if (user) {
      userStore.setState({ profile: user });
      isProUser = user?.subscription === 'pro' || user?.isPro || false;
    }

    const subjRes = await api.get(ENDPOINTS.GET_SUBJECTS);
    const subjData = subjRes.data ?? subjRes;

    allSubjects = Array.isArray(subjData) ? subjData : [];
    userSubjects = allSubjects.filter(subj =>
      selectedSubjectIds.includes(subj._id)
    );

    if (userSubjects.length === 0 && selectedSubjectIds.length > 0) {
      userSubjects = allSubjects.filter(s => s.isActive);
    }
  } catch (err) {
    console.error('Could not load user subjects:', err);
  }
}

// BIND MODAL OPEN/CLOSE & SUBMITS
function bindModalHandlers() {
  const openBtn = document.getElementById('openMockConfigBtn');
  const closeBtn = document.getElementById('closeMockConfigBtn');
  const modal = document.getElementById('mockConfigModal');
  const form = document.getElementById('mockConfigForm');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      selectedMockSubjects = [...userSubjects];
      renderModalSubjects();
      modal.classList.add('open');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  if (form) {
    form.addEventListener('submit', handleConfigSubmit);
  }

  // Fullscreen Confirmation Buttons
  const cancelFullBtn = document.getElementById('exitFullscreenLaunchBtn');
  const confirmFullBtn = document.getElementById('confirmFullscreenLaunchBtn');
  const fullModal = document.getElementById('fullscreenPromptModal');

  if (cancelFullBtn && fullModal) {
    cancelFullBtn.addEventListener('click', () => {
      fullModal.style.display = 'none';
      setButtonLoading(document.getElementById('launchMockExamBtn'), false);
    });
  }

  if (confirmFullBtn && fullModal) {
    confirmFullBtn.addEventListener('click', () => {
      fullModal.style.display = 'none';
      launchExamFullscreen();
    });
  }
}

// RENDER SUBJECTS IN CONFIG MODAL
function renderModalSubjects() {
  const container = document.getElementById('modalSubjectsList');
  if (!container) return;

  container.innerHTML = '';

  if (userSubjects.length === 0) {
    container.innerHTML = '<div class="loading-placeholder">No subjects enrolled. Go to settings first.</div>';
    return;
  }

  if (selectedMockSubjects.length === 0) {
    selectedMockSubjects = [...userSubjects];
  }

  selectedMockSubjects.forEach(subj => {
    const isEnglish = subj.name.toLowerCase().includes('english');
    const item = document.createElement('div');
    item.className = 'subject-chip-checkbox';
    
    if (isEnglish) {
      item.innerHTML = `
        <div class="subject-chip-content flex-row-between">
          <span>${subj.name}</span>
          <span class="compulsory-lbl">Compulsory (60 Qs)</span>
        </div>
      `;
    } else {
      const availableOptions = allSubjects.filter(s =>
        !s.name.toLowerCase().includes('english') &&
        !selectedMockSubjects.some(selected => selected._id === s._id)
      );

      let selectHTML = `<select class="replace-subject-select" data-id="${subj._id}" aria-label="Replace ${subj.name}">`;
      selectHTML += `<option value="${subj._id}" selected>${subj.name} (Keep)</option>`;
      availableOptions.forEach(opt => {
        selectHTML += `<option value="${opt._id}">Replace with ${opt.name}</option>`;
      });
      selectHTML += `</select>`;

      item.innerHTML = `
        <div class="subject-chip-content flex-row-between">
          <span class="subj-name">${subj.name}</span>
          <div class="subj-actions-group">
            ${selectHTML}
            <span class="compulsory-lbl">40 Qs</span>
          </div>
        </div>
      `;

      const select = item.querySelector('.replace-subject-select');
      if (select) {
        select.addEventListener('change', (e) => {
          const newId = e.target.value;
          const oldId = e.target.dataset.id;
          if (newId === oldId) return;

          const newSubj = allSubjects.find(s => s._id === newId);
          if (newSubj) {
            selectedMockSubjects = selectedMockSubjects.map(s => s._id === oldId ? newSubj : s);
            renderModalSubjects();
          }
        });
      }
    }
    
    container.appendChild(item);
  });
}

// SYNC SELECTED SUBJECTS TO BACKEND
async function syncSelectedSubjects(subjectIds) {
  try {
    await api.patch(ENDPOINTS.STUDENT_UPDATE_SUBJECTS, { subjects: subjectIds }).catch(async () => {
      await api.put(ENDPOINTS.STUDENT_UPDATE_SUBJECTS, { subjects: subjectIds });
    });
    await api.patch(ENDPOINTS.UPDATE_PROFILE, { selectedSubjects: subjectIds });
    
    const profile = userStore.getState().profile || {};
    profile.selectedSubjects = subjectIds;
    if (profile.onboarding) {
      profile.onboarding.subjects = subjectIds;
    }
    userStore.setState({ profile });
    userSubjects = allSubjects.filter(subj => subjectIds.includes(subj._id));
  } catch (e) {
    console.warn("Failed to sync selected subjects to backend, attempting profile fallback:", e);
    try {
      await api.patch(ENDPOINTS.UPDATE_PROFILE, { selectedSubjects: subjectIds });
    } catch (err) {
      console.error("Critical: failed to update subjects:", err);
    }
  }
}

// VALIDATE & SUBMIT CONFIG FORM
async function handleConfigSubmit(e) {
  e.preventDefault();

  if (selectedMockSubjects.length !== 4) {
    showToast('A mock exam requires exactly 4 subjects (including English).', 'error');
    return;
  }

  const selectedSubjectIds = selectedMockSubjects.map(s => s._id);
  const selectedSubjectNames = selectedMockSubjects.map(s => s.name);

  const btn = document.getElementById('launchMockExamBtn');
  setButtonLoading(btn, true);

  try {
    await syncSelectedSubjects(selectedSubjectIds);
  } catch (err) {
    console.warn("Subject sync failed but proceeding anyway:", err);
  }

  startPayload = {
    subjectIds: selectedSubjectIds,
    subjectNames: selectedSubjectNames,
    questionLimit: 180,
    difficulty: 'fixed'
  };

  document.getElementById('mockConfigModal').classList.remove('open');
  
  const fullPrompt = document.getElementById('fullscreenPromptModal');
  if (fullPrompt) {
    fullPrompt.style.display = 'flex';
  } else {
    launchExamFullscreen();
  }
}

// LAUNCH EXAM & FULLSCREEN LOCK
async function launchExamFullscreen() {
  if (!startPayload) return;

  const btn = document.getElementById('launchMockExamBtn');

  try {
    const res  = await api.post(ENDPOINTS.MOCK_START, {
      subjectIds: startPayload.subjectIds,
      questionLimit: startPayload.questionLimit,
      difficulty: startPayload.difficulty
    });
    
    const data = res.data ?? res;

    // Save configurations
    sessionStorage.setItem('mock_session_id', data.sessionId);
    sessionStorage.setItem('mock_session_questions', JSON.stringify(data.questions ?? []));
    sessionStorage.setItem('mock_session_subjects', JSON.stringify(startPayload.subjectNames));
    sessionStorage.setItem('mock_session_limit', startPayload.questionLimit);
    sessionStorage.setItem('mock_session_difficulty', startPayload.difficulty);
    sessionStorage.setItem('mock_session_duration', 120); // 120 mins (2 Hours)

    // Trigger Fullscreen API request
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.mozRequestFullScreen) { /* Firefox */
        await docEl.mozRequestFullScreen();
      } else if (docEl.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        await docEl.webkitRequestFullscreen();
      } else if (docEl.msRequestFullscreen) { /* IE/Edge */
        await docEl.msRequestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen request bypassed by browser policy. Proceeding to quiz...', e);
    }

    // Redirect to active mock page
    window.location.href = '/pages/mock-quiz.html';

  } catch (err) {
    if (err.status === 403) {
      showToast('Mock test limit reached. Upgrade to Pro for unlimited mocks!', 'error');
    } else if (err.status === 400) {
      showToast('Bad request. Please check selected subjects.', 'error');
    } else {
      showToast('Could not start mock test. Please try again.', 'error');
    }
    setButtonLoading(btn, false);
  }
}

// PAST MOCK TESTS
async function loadMockHistory() {
  try {
    const res     = await api.get(ENDPOINTS.MOCK_HISTORY);
    const resData = res.data ?? res;
    const sessions = Array.isArray(resData.sessions)
      ? resData.sessions
      : Array.isArray(resData) ? resData : [];

    renderMockHistory(sessions);

  } catch (err) {
    showToast('Could not load mock history.', 'error');
    renderMockHistory([]);
  }
}

function renderMockHistory(sessions) {
  const container = document.getElementById('pastMockTestsBox');
  if (!container) return;

  container.innerHTML = '';

  if (sessions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ph-bold ph-exam empty-icon"></i>
        <p class="empty-title">No mock tests yet</p>
        <p class="empty-desc">This is where your past mock tests will appear. Start one above!</p>
      </div>
    `;
    return;
  }

  sessions.forEach((session, index) => {
    container.appendChild(buildMockCard(session, index));
  });
}

function buildMockCard(session, index) {
  const compositeScore = session.compositeScore ?? 0;
  const subjectScores  = session.subjectScores ?? [];

  let accuracy = 0;
  if (subjectScores.length > 0) {
    const totalCorrect = subjectScores.reduce((sum, s) => sum + (s.correct ?? 0), 0);
    const totalQs      = subjectScores.reduce((sum, s) => sum + (s.total   ?? 0), 0);
    accuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;
  }

  const scorePercent   = Math.round((compositeScore / 400) * 100);
  const scoreColour    = scorePercent >= 70 ? '#22C55E' : '#F59E0B';
  const accuracyColour = accuracy    >= 70 ? '#22C55E' : '#F59E0B';
  const iconStyle      = ICON_COLOURS[index % ICON_COLOURS.length];
  const dateStr        = formatDate(session.createdAt || session.startTime);

  const card = document.createElement('div');
  card.className = 'mock-tests-listing';

  card.innerHTML = `
    <div class="icon-subj-stat">
      <i class="ph-bold ph-book-open book"
         style="background:${iconStyle.bg}; color:${iconStyle.color};"></i>
      <div class="all-subj">
        <h4>All 4 Subjects</h4>
        <div class="all-subj-stats">
          <p>Score: <span style="color:${scoreColour}; font-weight:600;">${compositeScore}/400</span></p>
          <p>Accuracy: <span style="color:${accuracyColour}; font-weight:600;">${accuracy}%</span></p>
          <div class="all-subj-stats-time">
            <i class="ph ph-clock clock"></i>
            <p>${dateStr}</p>
          </div>
        </div>
      </div>
    </div>
    <button class="rvw-btn" data-session-id="${session.sessionId || session._id || session.id}">
      Review
      <i class="ph-bold ph-arrow-right"></i>
    </button>
  `;

  card.querySelector('.rvw-btn')?.addEventListener('click', () =>
    handleReview(session.sessionId || session._id || session.id)
  );

  return card;
}

function handleReview(sessionId) {
  if (!sessionId) return;
  sessionStorage.setItem('review_mock_session_id', sessionId);
  window.location.href = '/pages/mock-result.html';
}

// ALL-TIME MOCK STATS
async function loadMockStats() {
  try {
    const res  = await api.get(ENDPOINTS.MOCK_STATS);
    const data = res.data ?? res;
    renderMockStats(data);
  } catch (err) {
    renderMockStats({});
  }
}

function renderMockStats(data) {
  fillStat(document.querySelector('.average-score'),  data.avgMockScore,     '--');
  fillStat(document.querySelector('.highest-score'),  data.highestMockScore, '--');
  fillStat(document.querySelector('.mocks-count'),    data.totalMocksTaken,  '0');
}

// THIS WEEK STATS + STREAK
async function loadWeekStats() {
  try {
    api.post(ENDPOINTS.STREAKS, {}).catch(() => {});

    const histRes     = await api.get(ENDPOINTS.MOCK_HISTORY);
    const histData    = histRes.data ?? histRes;
    const allSessions = Array.isArray(histData.sessions)
      ? histData.sessions
      : Array.isArray(histData) ? histData : [];

    const weekSessions   = filterThisWeek(allSessions);
    const mocksCompleted = weekSessions.length;

    const avgScore = mocksCompleted > 0
      ? Math.round(weekSessions.reduce((sum, s) => sum + (s.compositeScore ?? 0), 0) / mocksCompleted)
      : null;

    const bestScore = mocksCompleted > 0
      ? Math.max(...weekSessions.map(s => s.compositeScore ?? 0))
      : null;

    const dashRes  = await api.get(`${ENDPOINTS.STUDENT_DASHBOARD}?period=week`);
    const dashData = dashRes.data ?? dashRes;
    const streak   = dashData?.stats?.studyStreak ?? 0;

    renderWeekStats({ mocksCompleted, avgScore, bestScore, streak });

  } catch (err) {
    renderWeekStats({ mocksCompleted: null, avgScore: null, bestScore: null, streak: 0 });
  }
}

function filterThisWeek(sessions) {
  const now       = new Date();
  const dayOfWeek = now.getDay();
  const monday    = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  return sessions.filter(s => {
    const sessionDate = new Date(s.createdAt || s.startTime);
    return sessionDate >= monday && sessionDate <= now;
  });
}

function renderWeekStats({ mocksCompleted, avgScore, bestScore, streak }) {
  fillStat(document.querySelector('.mocks-complt-count'),   mocksCompleted, '0');
  fillStat(document.querySelector('.avg-score'),            avgScore,       '--');
  fillStat(document.querySelector('.best-score'),           bestScore,      '--');

  renderStreakMessage(streak);
}

function renderStreakMessage(streak) {
  const keepItUpSection = document.querySelector('.keep-it-up-section');
  if (!keepItUpSection) return;

  let message;
  if (streak === 0)      message = STREAK_MESSAGES.zero;
  else if (streak <= 2)  message = STREAK_MESSAGES.low;
  else if (streak <= 4)  message = STREAK_MESSAGES.mid;
  else if (streak <= 7)  message = STREAK_MESSAGES.high;
  else                   message = STREAK_MESSAGES.legend;

  keepItUpSection.innerHTML = `
    <i class="${message.icon} check"></i>
    <div>
      <p class="motivation">${message.text}</p>
      <h4 class="streak-count">${streak > 0 ? `${streak}-day streak active!` : 'No active streak yet'}</h4>
    </div>
  `;
}

// DATE FORMATTER
function formatDate(isoString) {
  if (!isoString) return '--';

  const date      = new Date(isoString);
  const now       = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

  if (date.toDateString() === now.toDateString())       return `Today, ${timeStr}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${timeStr}`;

  const monthStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${monthStr}, ${timeStr}`;
}

// UI HELPERS
function fillStat(el, value, placeholder = '--') {
  if (!el) return;
  const isEmpty  = value == null;
  el.textContent = isEmpty ? placeholder : value;
  el.classList.toggle('stat-empty', isEmpty);
}

function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className   = `toast ${type}`.trim();
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function setButtonLoading(btn, isLoading) {
  if (!btn) return;
  if (isLoading) {
    btn.disabled  = true;
    btn.innerHTML = `<span class="btn-spinner"></span> Launching...`;
  } else {
    btn.disabled  = false;
    btn.innerHTML = `Begin Exam (Launch Fullscreen)`;
  }
}

init();