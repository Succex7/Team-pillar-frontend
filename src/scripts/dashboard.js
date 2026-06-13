// src/scripts/dashboard.js
// Dashboard Overview — fetches real data from API

import { initShell } from '../components/shell.js';
import { userStore } from '../store/userStore.js';
import { api }       from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';

// SUBJECT COLOUR MAP
const SUBJECT_COLORS = {
  'Use of English': '#2563eb',
  'Mathematics':    '#f59e0b',
  'Biology':        '#22c55e',
  'Chemistry':      '#a855f7',
  'Physics':        '#ef4444',
  'Government':     '#06b6d4',
  'Economics':      '#f97316',
  'Literature':     '#ec4899',
};

function getSubjectColor(name) {
  return SUBJECT_COLORS[name] || '#6366f1';
}

function getAccuracyClass(pct) {
  if (pct < 65) return 'accuracy--low';
  return 'accuracy--medium';
}

function formatScore(val, max) {
  return `${val}<span>/${max}</span>`;
}


// INIT
async function init() {
  handleOAuthRedirect();

  if (!getStoredToken()) {
    renderDashboardFallback();
    showToast('Please sign in to view your dashboard.', 'error');
    setTimeout(() => {
      window.location.replace('/pages/login.html');
    }, 800);
    return;
  }

  initShell('overview', 'Dashboard Overview', 'Track your UTME preparation progress');
  await loadDashboard();
  initLazyImages();
}

function handleOAuthRedirect() {
  const params = new URLSearchParams(window.location.search);
  const token  = params.get('token');
  if (token) {
    localStorage.setItem('access_token', token);
    window.history.replaceState({}, '', window.location.pathname);
  }
}

function getStoredToken() {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
}

function clearAuthSession() {
  localStorage.removeItem('access_token');
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('token_expires_at');
}

function redirectToLogin() {
  window.location.replace('/pages/login.html');
}


// FETCH DASHBOARD DATA
async function loadDashboard() {
  try {
    const token = getStoredToken();

    if (!token) {
      renderDashboardFallback();
      showToast('Please sign in to view your dashboard.', 'error');
      setTimeout(redirectToLogin, 800);
      return;
    }

    const response = await api.get(ENDPOINTS.STUDENT_DASHBOARD);

    // API response shape: { success, message, data: { user, predictedScore, ... } }
    const data = response.data || response;

    renderDashboard(data);
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) {
      clearAuthSession();
      renderDashboardFallback();
      showToast('Your session has expired. Please sign in again.', 'error');
      setTimeout(redirectToLogin, 1000);
      return;
    }

    showToast('Failed to load dashboard data. Please refresh.', 'error');
    renderDashboardFallback();
  }
}


// RENDER ALL SECTIONS
function renderDashboard(data) {
  renderWelcome(data);
  renderStatCards(data);
  renderSubjectPerformance(data.subjectMastery || []);
  renderBottomStats(data);
  renderAiTutor(data);
  renderWeakTopics(data.weakAreas || []);
}


// WELCOME
function renderWelcome(data) {
  const heading = document.getElementById('welcomeHeading');
  const sub     = document.getElementById('welcomeSub');

  const storedProfile = userStore.getState().profile;
  const name = data.user?.name?.split(' ')[0]
    || storedProfile?.name?.split(' ')[0]
    || 'Student';

  if (heading) {
    heading.classList.remove('skeleton', 'skeleton-text', 'skeleton-text--mid');
    heading.textContent = `Welcome back, ${name}!`;
  }
  if (sub) {
    sub.classList.remove('skeleton', 'skeleton-text', 'skeleton-text--short');
    sub.textContent = 'Ready to crush your UTME preparation today?';
  }
}


// STAT CARDS — top 3 cards
function renderStatCards(data) {
  const row = document.getElementById('statCardsRow');
  if (!row) return;

  const predicted       = data.predictedScore ?? 0;
  const targetScore     = data.targetScore    ?? 315;
  const streak          = data.streak         ?? 0;
  const avgScore        = data.avgScore       ?? 0;
  const sessionsToday   = data.sessionsToday  ?? 0;
  const dailyLimit      = data.dailyLimit     ?? 3;
  const isPro           = data.user?.isPro    ?? false;
  const pointsToGo      = Math.max(0, targetScore - predicted);
  const scorePercent    = Math.min(Math.round((predicted / 400) * 100), 100);
  const weeklyChange    = data.weeklyScoreChange ?? 0;

  row.innerHTML = `
    <div class="stat-card">
      <span class="stat-card-badge stat-card-badge--green">+${weeklyChange} this week</span>
      <div class="stat-card-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <p class="stat-card-label">PREDICTED UTME SCORE</p>
      <p class="stat-card-value">${formatScore(predicted, 400)}</p>
      <p class="stat-card-sub">Target: ${targetScore} · ${pointsToGo} points to go</p>
      <div class="stat-card-progress">
        <div class="stat-card-progress-fill stat-card-progress-fill--blue" style="width:${scorePercent}%"></div>
      </div>
    </div>

    <div class="stat-card">
      <span class="stat-card-badge stat-card-badge--orange">${streak > 0 ? `🔥 ${streak}` : '0'}</span>
      <div class="stat-card-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
        </svg>
      </div>
      <p class="stat-card-label">STUDY CONSISTENCY</p>
      <p class="stat-card-value">${avgScore}<span>%</span></p>
      <p class="stat-card-sub">${streak}-day streak · Keep it up!</p>
      <div class="stat-card-progress">
        <div class="stat-card-progress-fill stat-card-progress-fill--amber" style="width:${Math.min(avgScore, 100)}%"></div>
      </div>
    </div>

    <div class="stat-card">
      <span class="stat-card-badge stat-card-badge--gray">${isPro ? 'PRO TIER' : 'FREE TIER'}</span>
      <div class="stat-card-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <p class="stat-card-label">SESSIONS TODAY</p>
      <p class="stat-card-value">${sessionsToday}<span>/${dailyLimit}</span></p>
      <p class="stat-card-sub">${dailyLimit - sessionsToday} sessions remaining · Resets in 18h</p>
      ${!isPro ? `
        <button type="button" class="stat-card-upgrade-btn" id="upgradeForUnlimitedBtn">
          Upgrade for Unlimited
        </button>
      ` : ''}
    </div>
  `;

  // Bind upgrade button — opens billing modal
  const upgradeBtn = document.getElementById('upgradeForUnlimitedBtn');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', () => {
      window.location.href = '/pages/billing.html';
    });
  }
}


// SUBJECT PERFORMANCE
// API returns subjectMastery: [{ subject, mastery, questionsAttempted }]
function renderSubjectPerformance(subjects) {
  const list = document.getElementById('subjectPerformanceList');
  if (!list) return;

  if (!subjects.length) {
    list.innerHTML = `
      <p style="font-size:13px;color:var(--pillar-muted);text-align:center;padding:16px 0;">
        No subject data yet. Start a session!
      </p>`;
    return;
  }

  list.innerHTML = subjects.map(sub => {
    const name     = sub.subject || sub.name || 'Unknown';
    const mastery  = sub.mastery ?? sub.accuracy ?? 0;
    const attempts = sub.questionsAttempted ?? sub.questionsPracticed ?? 0;

    return `
      <div class="subject-row">
        <div class="subject-row-top">
          <span class="subject-row-name">
            ${name}
            <span class="subject-row-meta">${attempts} questions practiced</span>
          </span>
          <span class="subject-row-pct">${mastery}%</span>
        </div>
        <div class="subject-progress-bar">
          <div
            class="subject-progress-fill"
            style="width:${Math.min(mastery, 100)}%; background:${getSubjectColor(name)}"
          ></div>
        </div>
      </div>
    `;
  }).join('');
}


// BOTTOM STATS — 3 small cards
// API fields: avgScore, questionsAttempted, mocksTaken, avgMockScore
function renderBottomStats(data) {
  const row = document.getElementById('bottomStatsRow');
  if (!row) return;

  const avgScore           = data.avgScore           ?? 0;
  const questionsAttempted = data.questionsAttempted ?? 0;
  const mocksTaken         = data.mocksTaken         ?? 0;
  const avgMockScore       = data.avgMockScore       ?? 0;

  row.innerHTML = `
    <div class="bottom-stat-card">
      <div class="bottom-stat-icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6"  y1="20" x2="6"  y2="14"/>
        </svg>
      </div>
      <p class="stat-card-label">ACCURACY RATE</p>
      <p class="bottom-stat-value">${avgScore}%</p>
      <p class="bottom-stat-sub">Across all subjects</p>
    </div>

    <div class="bottom-stat-card">
      <div class="bottom-stat-icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <p class="stat-card-label">QUESTIONS PRACTICED</p>
      <p class="bottom-stat-value">${questionsAttempted.toLocaleString()}</p>
      <p class="bottom-stat-sub">This month</p>
    </div>

    <div class="bottom-stat-card">
      <div class="bottom-stat-icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="8" r="4"/>
          <path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
        </svg>
      </div>
      <p class="stat-card-label">MOCK TESTS TAKEN</p>
      <p class="bottom-stat-value">${mocksTaken}</p>
      <p class="bottom-stat-sub">Average: ${avgMockScore}/400</p>
    </div>
  `;
}


// AI TUTOR INSIGHTS
function renderAiTutor(data) {
  const body  = document.getElementById('aiTutorBody');
  const isPro = data.user?.isPro ?? false;

  if (!body) return;

  if (!isPro) {
    body.innerHTML = `
      <div class="ai-tutor-locked">
        <p>Upgrade to see personalized AI insights</p>
        <button type="button" class="ai-tutor-unlock-btn" id="unlockAiBtn">
          Unlock AI Insights with Pro
        </button>
      </div>
    `;
    document.getElementById('unlockAiBtn')?.addEventListener('click', () => {
      window.location.href = '/pages/billing.html';
    });
    return;
  }

  const insights = data.aiInsights || [];
  if (!insights.length) {
    body.innerHTML = `
      <p style="font-size:13px;color:rgba(255,255,255,0.6);padding:8px 0;">
        No insights available yet. Keep practicing!
      </p>`;
    return;
  }

  body.innerHTML = insights.map(insight => `
    <div class="ai-insight-item">
      <p class="ai-insight-text">${insight.text || insight}</p>
    </div>
  `).join('');
}


// WEAK TOPICS / WEAK AREAS
// API returns weakAreas: [{ topic, subject, accuracy }]
function renderWeakTopics(topics) {
  const grid = document.getElementById('weakTopicsGrid');
  if (!grid) return;

  if (!topics.length) {
    grid.innerHTML = `
      <p style="font-size:13px;color:var(--pillar-muted);grid-column:1/-1;text-align:center;padding:16px 0;">
        No weak topics yet. Start practicing to see insights!
      </p>`;
    return;
  }

  grid.innerHTML = topics.map(topic => {
    const name     = topic.topic   || topic.name    || 'Unknown';
    const subject  = topic.subject || '';
    const accuracy = topic.accuracy ?? 0;

    return `
      <div class="weak-topic-card">
        <p class="weak-topic-name">${name}</p>
        <p class="weak-topic-subject">${subject}</p>
        <div class="weak-topic-bottom">
          <span class="weak-topic-accuracy ${getAccuracyClass(accuracy)}">${accuracy}%</span>
          <a
            href="/pages/study-session.html?topic=${encodeURIComponent(name)}&subject=${encodeURIComponent(subject)}"
            class="weak-topic-practice"
          >Practice →</a>
        </div>
      </div>
    `;
  }).join('');
}


// FALLBACK — show welcome without data
function renderDashboardFallback() {
  const heading = document.getElementById('welcomeHeading');
  const sub     = document.getElementById('welcomeSub');

  if (heading) {
    heading.classList.remove('skeleton', 'skeleton-text', 'skeleton-text--mid');
    heading.textContent = 'Welcome back!';
  }
  if (sub) {
    sub.classList.remove('skeleton', 'skeleton-text', 'skeleton-text--short');
    sub.textContent = 'Ready to crush your UTME preparation today?';
  }
}


// LAZY IMAGES
function initLazyImages() {
  const lazyImgs = document.querySelectorAll('img.lazy');
  if (!lazyImgs.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src   = img.dataset.src;
        img.addEventListener('load', () => img.classList.add('loaded'));
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  lazyImgs.forEach(img => observer.observe(img));
}


// TOAST
function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className   = `toast ${type}`.trim();
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}


init();