// src/scripts/dashboard.js
// Dashboard Overview — fetches real data from API

import { initShell }      from '../components/shell.js';
import { userStore }      from '../store/userStore.js';
import { api }            from '../services/api.js';
import { ENDPOINTS }      from '../services/endpoints.js';

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
  initShell('overview', 'Dashboard Overview', 'Track your UTME preparation progress');

  await loadDashboard();
  initLazyImages();
}

// FETCH DASHBOARD DATA
async function loadDashboard() {
  try {
    const response = await api.get(ENDPOINTS.STUDENT_DASHBOARD);
    const data     = response.data || response;
    renderDashboard(data);
  } catch (err) {
    showToast('Failed to load dashboard data. Please refresh.', 'error');
    renderDashboardFallback();
  }
}

// RENDER ALL SECTIONS
function renderDashboard(data) {
  renderWelcome(data);
  renderStatCards(data);
  renderSubjectPerformance(data.subjectPerformance || []);
  renderBottomStats(data);
  renderAiTutor(data);
  renderWeakTopics(data.weakTopics || []);
}

function renderWelcome(data) {
  const heading = document.getElementById('welcomeHeading');
  const sub     = document.getElementById('welcomeSub');
  const name    = data.user?.name?.split(' ')[0] || userStore.getState().profile?.name?.split(' ')[0] || 'Student';

  if (heading) {
    heading.classList.remove('skeleton', 'skeleton-text', 'skeleton-text--mid');
    heading.textContent = `Welcome back, ${name}!`;
  }
  if (sub) {
    sub.classList.remove('skeleton', 'skeleton-text', 'skeleton-text--short');
    sub.textContent = 'Ready to crush your UTME preparation today?';
  }
}

function renderStatCards(data) {
  const row = document.getElementById('statCardsRow');
  if (!row) return;

  const predicted   = data.predictedScore   || 0;
  const targetScore = data.targetScore      || 315;
  const consistency = data.studyConsistency || 0;
  const streak      = data.currentStreak    || 0;
  const sessionsToday     = data.sessionsToday     || 0;
  const maxSessionsToday  = data.maxSessionsToday  || 3;
  const isPro             = data.user?.subscription?.plan === 'pro';
  const pointsToGo        = Math.max(0, targetScore - predicted);

  row.innerHTML = `
    <div class="stat-card">
      <span class="stat-card-badge stat-card-badge--green">+${data.weeklyScoreChange || 12} this week</span>
      <div class="stat-card-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <p class="stat-card-label">Predicted UTME Score</p>
      <p class="stat-card-value">${formatScore(predicted, 400)}</p>
      <p class="stat-card-sub">Target: ${targetScore} · ${pointsToGo} points to go</p>
      <div class="stat-card-progress">
        <div class="stat-card-progress-fill stat-card-progress-fill--blue" style="width:${Math.round((predicted / 400) * 100)}%"></div>
      </div>
    </div>

    <div class="stat-card">
      <span class="stat-card-badge stat-card-badge--orange">${streak > 0 ? `🔥 ${streak}` : '0'}</span>
      <div class="stat-card-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>
        </svg>
      </div>
      <p class="stat-card-label">Study Consistency</p>
      <p class="stat-card-value">${consistency}<span>%</span></p>
      <p class="stat-card-sub">${streak}-day streak · Keep it up!</p>
      <div class="stat-card-progress">
        <div class="stat-card-progress-fill stat-card-progress-fill--amber" style="width:${consistency}%"></div>
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
      <p class="stat-card-label">Sessions Today</p>
      <p class="stat-card-value">${sessionsToday}<span>/${maxSessionsToday}</span></p>
      <p class="stat-card-sub">${maxSessionsToday - sessionsToday} sessions remaining · Resets in 18h</p>
      ${!isPro ? `<button type="button" class="stat-card-upgrade-btn" onclick="window.location.href='/pages/billing.html'">Upgrade for Unlimited</button>` : ''}
    </div>
  `;
}

function renderSubjectPerformance(subjects) {
  const list = document.getElementById('subjectPerformanceList');
  if (!list) return;

  if (!subjects.length) {
    list.innerHTML = `<p style="font-size:13px;color:var(--pillar-muted);text-align:center;padding:16px 0;">No subject data yet. Start a session!</p>`;
    return;
  }

  list.innerHTML = subjects.map(sub => `
    <div class="subject-row">
      <div class="subject-row-top">
        <span class="subject-row-name">
          ${sub.name}
          <span class="subject-row-meta">${sub.questionsPracticed || 0} questions practiced</span>
        </span>
        <span class="subject-row-pct">${sub.accuracy || 0}%</span>
      </div>
      <div class="subject-progress-bar">
        <div
          class="subject-progress-fill"
          style="width:${sub.accuracy || 0}%; background:${getSubjectColor(sub.name)}"
        ></div>
      </div>
    </div>
  `).join('');
}

function renderBottomStats(data) {
  const row = document.getElementById('bottomStatsRow');
  if (!row) return;

  row.innerHTML = `
    <div class="bottom-stat-card">
      <div class="bottom-stat-icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6"  y1="20" x2="6"  y2="14"/>
        </svg>
      </div>
      <p class="stat-card-label">Accuracy Rate</p>
      <p class="bottom-stat-value">${data.accuracyRate || 0}%</p>
      <p class="bottom-stat-sub">Across all subjects</p>
    </div>

    <div class="bottom-stat-card">
      <div class="bottom-stat-icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <p class="stat-card-label">Questions Practiced</p>
      <p class="bottom-stat-value">${(data.totalQuestions || 0).toLocaleString()}</p>
      <p class="bottom-stat-sub">This month</p>
    </div>

    <div class="bottom-stat-card">
      <div class="bottom-stat-icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="8" r="4"/>
          <path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
        </svg>
      </div>
      <p class="stat-card-label">Mock Tests Taken</p>
      <p class="bottom-stat-value">${data.mockTestsTaken || 0}</p>
      <p class="bottom-stat-sub">Average: ${data.avgMockScore || 0}/400</p>
    </div>
  `;
}

function renderAiTutor(data) {
  const body  = document.getElementById('aiTutorBody');
  const isPro = data.user?.subscription?.plan === 'pro';

  if (!body) return;

  if (!isPro) {
    body.innerHTML = `
      <div class="ai-tutor-locked">
        <p>Upgrade to see personalized AI insights</p>
        <button type="button" class="ai-tutor-unlock-btn" onclick="window.location.href='/pages/billing.html'">
          Unlock AI Insights with Pro
        </button>
      </div>
    `;
    return;
  }

  const insights = data.aiInsights || [];
  if (!insights.length) {
    body.innerHTML = `<p style="font-size:13px;color:rgba(255,255,255,0.6);padding:8px 0;">No insights available yet. Keep practicing!</p>`;
    return;
  }

  body.innerHTML = insights.map(insight => `
    <div class="ai-insight-item">
      <p class="ai-insight-text">${insight.text}</p>
    </div>
  `).join('');
}

function renderWeakTopics(topics) {
  const grid = document.getElementById('weakTopicsGrid');
  if (!grid) return;

  if (!topics.length) {
    grid.innerHTML = `<p style="font-size:13px;color:var(--pillar-muted);grid-column:1/-1;text-align:center;padding:16px 0;">No weak topics yet. Start practicing to see insights!</p>`;
    return;
  }

  grid.innerHTML = topics.map(topic => `
    <div class="weak-topic-card">
      <p class="weak-topic-name">${topic.name}</p>
      <p class="weak-topic-subject">${topic.subject}</p>
      <div class="weak-topic-bottom">
        <span class="weak-topic-accuracy ${getAccuracyClass(topic.accuracy)}">${topic.accuracy}%</span>
        <a href="/pages/study-session.html?topic=${encodeURIComponent(topic.name)}&subject=${encodeURIComponent(topic.subject)}" class="weak-topic-practice">Practice →</a>
      </div>
    </div>
  `).join('');
}

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

function initLazyImages() {
  const lazyImgs = document.querySelectorAll('img.lazy');
  if (!lazyImgs.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.addEventListener('load', () => img.classList.add('loaded'));
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  lazyImgs.forEach(img => observer.observe(img));
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

init();