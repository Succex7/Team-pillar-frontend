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

async function init() {
  await initShell(
    'mock-test',
    'Mock Tests',
    'Full UTME simulation · 160 questions · 4 subjects · 2 hours'
  );

  await Promise.allSettled([
    loadMockHistory(),
    loadMockStats(),
    loadWeekStats(),
  ]);

  bindStartMock();
}

// START MOCK TEST
function bindStartMock() {
  const btn = document.querySelector('.start-session-btn');
  if (!btn) return;
  btn.addEventListener('click', handleStartMock);
}

async function handleStartMock() {
  const btn = document.querySelector('.start-session-btn');
  setButtonLoading(btn, true);

  try {
    const res  = await api.post(ENDPOINTS.MOCK_START, {});
    const data = res.data ?? res;

    sessionStorage.setItem('mock_session_id',        data.sessionId);
    sessionStorage.setItem('mock_session_questions', JSON.stringify(data.questions ?? []));

    window.location.href = '/pages/mock-quiz.html';

  } catch (err) {
    if (err.status === 403) {
      showToast('Mock test limit reached. Upgrade to Pro for unlimited mocks!', 'error');
    } else if (err.status === 400) {
      showToast('Please complete subject selection in onboarding first.', 'error');
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
  const container = document.querySelector('.past-mock-tests-box');
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
  const dateStr        = formatDate(session.createdAt);

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
    <button class="rvw-btn" data-session-id="${session.sessionId}">
      Review
      <i class="ph-bold ph-arrow-right"></i>
    </button>
  `;

  card.querySelector('.rvw-btn')?.addEventListener('click', () =>
    handleReview(session.sessionId)
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
  // Scores /400 — use '--' when empty (zero would look like a real score)
  fillStat(document.querySelector('.average-score'),  data.avgMockScore,     '--');
  fillStat(document.querySelector('.highest-score'),  data.highestMockScore, '--');
  // Count — use '0' when empty (zero is a real meaningful count here)
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
    const sessionDate = new Date(s.createdAt);
    return sessionDate >= monday && sessionDate <= now;
  });
}

function renderWeekStats({ mocksCompleted, avgScore, bestScore, streak }) {
  // Count — 0 when empty
  fillStat(document.querySelector('.mocks-complt-count'),   mocksCompleted, '0');
  // Scores /400 — '--' when empty
  fillStat(document.querySelector('.avg-score.scores-two'), avgScore,       '--');
  fillStat(document.querySelector('.best-score.scores-two'), bestScore,     '--');

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
      <h4 class="streak-count">${streak > 0 ? `${streak}-week streak active!` : 'No active streak yet'}</h4>
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

// fillStat: sets element text and toggles .stat-empty class
// empty → placeholder shows faintly via CSS
// real value → full opacity, bold (CSS default)
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
    btn.innerHTML = `<span class="btn-spinner"></span> Starting...`;
  } else {
    btn.disabled  = false;
    btn.innerHTML = `<img src="../public/icon/play.svg" alt=""> Start Session Now`;
  }
}

init();