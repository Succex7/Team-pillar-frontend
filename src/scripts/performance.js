import { initShell } from '../components/shell.js';
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
  if (pct < 60) return 'accuracy--low';
  if (pct < 80) return 'accuracy--medium';
  return 'accuracy--high';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NG', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  });
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now  = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 3600)  return 'Just now';
  if (diff < 86400) return 'Today';
  if (diff < 172800) return 'Yesterday';
  return formatDate(dateStr);
}


// INIT
async function init() {
  initShell('performance', 'Performance', 'Track your UTME preparation progress');
  await loadAllData();
}


// LOAD ALL DATA — parallel fetches for speed
async function loadAllData() {
  try {
    const [analyticsRes, mockStatsRes, mockHistoryRes, dashboardRes] = await Promise.allSettled([
      api.get(ENDPOINTS.ANALYTICS_ME),
      api.get(ENDPOINTS.MOCK_STATS),
      api.get(ENDPOINTS.MOCK_HISTORY),
      api.get(ENDPOINTS.STUDENT_DASHBOARD),
    ]);

    // Extract data safely from each settled promise
    const analytics  = analyticsRes.status  === 'fulfilled' ? (analyticsRes.value.data  || analyticsRes.value)  : null;
    const mockStats  = mockStatsRes.status  === 'fulfilled' ? (mockStatsRes.value.data  || mockStatsRes.value)  : null;
    const mockHistory = mockHistoryRes.status === 'fulfilled' ? (mockHistoryRes.value.data || mockHistoryRes.value) : null;
    const dashboard  = dashboardRes.status  === 'fulfilled' ? (dashboardRes.value.data  || dashboardRes.value)  : null;

    renderStatCards(analytics, mockStats, dashboard);
    renderSubjectPerformance(analytics?.subjectMastery || dashboard?.subjectMastery || []);
    renderScoreTrajectory(mockHistory || []);
    renderHeatmap(analytics?.subjectMastery || []);
    renderWeakTopics(analytics?.weakAreas || dashboard?.weakAreas || []);
    renderRecentMocks(Array.isArray(mockHistory) ? mockHistory.slice(0, 3) : []);

  } catch (err) {
    showToast('Failed to load performance data. Please refresh.', 'error');
  }
}


// STAT CARDS — top row
// Sources: analytics (avgScore, questionsAttempted), mockStats (avgMockScore, predictedScore, totalMocksTaken), dashboard (streak)
function renderStatCards(analytics, mockStats, dashboard) {
  const container = document.getElementById('perfStatCards');
  if (!container) return;

  const avgScore           = analytics?.avgScore          ?? dashboard?.avgScore          ?? 0;
  const questionsAttempted = analytics?.questionsAttempted ?? dashboard?.questionsAttempted ?? 0;
  const predictedScore     = mockStats?.predictedScore    ?? dashboard?.predictedScore    ?? 0;
  const streak             = dashboard?.streak            ?? 0;
  const mocksTaken         = mockStats?.totalMocksTaken   ?? dashboard?.mocksTaken        ?? 0;
  const avgMockScore       = mockStats?.avgMockScore      ?? 0;

  container.innerHTML = `
    <div class="perf-stat-card">
      <span class="perf-stat-badge perf-stat-badge--blue">Predicted</span>
      <p class="perf-stat-label">UTME Score</p>
      <p class="perf-stat-value">${predictedScore}<span>/400</span></p>
      <p class="perf-stat-sub">Based on recent performance</p>
    </div>

    <div class="perf-stat-card">
      <span class="perf-stat-badge perf-stat-badge--green">Overall</span>
      <p class="perf-stat-label">Accuracy Rate</p>
      <p class="perf-stat-value">${avgScore}<span>%</span></p>
      <p class="perf-stat-sub">Across all subjects</p>
    </div>

    <div class="perf-stat-card">
      <p class="perf-stat-label">Mock Avg Score</p>
      <p class="perf-stat-value">${avgMockScore}<span>/400</span></p>
      <p class="perf-stat-sub">${mocksTaken} mocks taken total</p>
    </div>

    <div class="perf-stat-card">
      <span class="perf-stat-badge perf-stat-badge--amber">${streak > 0 ? '🔥 Active' : 'Inactive'}</span>
      <p class="perf-stat-label">Study Streak</p>
      <p class="perf-stat-value">${streak}<span> days</span></p>
      <p class="perf-stat-sub">${questionsAttempted.toLocaleString()} questions done</p>
    </div>
  `;
}


// SCORE TRAJECTORY — SVG line chart from mock history
// mockHistory: [{ score, totalScore, createdAt }]
function renderScoreTrajectory(mockHistory) {
  const container = document.getElementById('scoreChart');
  if (!container) return;

  if (!mockHistory.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No mock test data yet.</p>
        <a href="/pages/mock-tests.html">Start your first mock →</a>
      </div>`;
    return;
  }

  // Take last 8 mocks, oldest first
  const sessions = [...mockHistory]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(-8);

  const scores    = sessions.map(s => s.score ?? s.totalScore ?? 0);
  const maxScore  = 400;
  const minScore  = Math.max(0, Math.min(...scores) - 30);
  const svgW      = 560;
  const svgH      = 180;
  const padLeft   = 40;
  const padRight  = 20;
  const padTop    = 20;
  const padBottom = 36;
  const chartW    = svgW - padLeft - padRight;
  const chartH    = svgH - padTop - padBottom;

  function xPos(i) {
    return padLeft + (i / Math.max(scores.length - 1, 1)) * chartW;
  }

  function yPos(score) {
    const pct = (score - minScore) / (maxScore - minScore);
    return padTop + chartH - pct * chartH;
  }

  // Build path
  const points  = scores.map((s, i) => `${xPos(i)},${yPos(s)}`);
  const linePath = `M ${points.join(' L ')}`;

  // Area fill path
  const firstX = xPos(0);
  const lastX  = xPos(scores.length - 1);
  const bottomY = padTop + chartH;
  const areaPath = `M ${firstX},${bottomY} L ${points.join(' L ')} L ${lastX},${bottomY} Z`;

  // Y axis labels
  const ySteps  = 4;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
    const val = Math.round(minScore + (maxScore - minScore) * (i / ySteps));
    const y   = yPos(val);
    return `
      <text x="${padLeft - 6}" y="${y + 4}" class="chart-label" text-anchor="end">${val}</text>
      <line x1="${padLeft}" y1="${y}" x2="${svgW - padRight}" y2="${y}" class="chart-grid" />
    `;
  });

  // X axis labels (dates)
  const xLabels = sessions.map((s, i) => {
    const label = new Date(s.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    return `<text x="${xPos(i)}" y="${svgH - 6}" class="chart-label" text-anchor="middle">${label}</text>`;
  });

  // Data points
  const circles = scores.map((s, i) => `
    <circle
      cx="${xPos(i)}"
      cy="${yPos(s)}"
      r="5"
      class="chart-point"
    >
      <title>Session ${i + 1}: ${s}/400</title>
    </circle>
  `);

  container.innerHTML = `
    <svg viewBox="0 0 ${svgW} ${svgH}" class="score-chart-svg" role="img" aria-label="Score trajectory chart">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="var(--pillar-blue-shade)" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="var(--pillar-blue-shade)" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <!-- Grid lines + Y labels -->
      ${yLabels.join('')}

      <!-- Area fill -->
      <path d="${areaPath}" fill="url(#areaGrad)" />

      <!-- Line -->
      <path d="${linePath}" fill="none" stroke="var(--pillar-blue-shade)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

      <!-- Points -->
      ${circles.join('')}

      <!-- X labels -->
      ${xLabels.join('')}
    </svg>
  `;
}


// HEATMAP — topic mastery grid
// subjectMastery: [{ subject, mastery, questionsAttempted }]
function renderHeatmap(subjectMastery) {
  const wrapper = document.getElementById('heatmapWrapper');
  if (!wrapper) return;

  if (!subjectMastery.length) {
    wrapper.innerHTML = `
      <div class="empty-state">
        <p>No topic data yet. Start a study session to see your heatmap.</p>
      </div>`;
    return;
  }

  // Simulate 7 session columns per subject using mastery as base
  // In production this would come from detailed analytics data
  const NUM_SESSIONS = 7;

  function masteryToLevel(mastery) {
    if (mastery === 0  || mastery == null) return 0;
    if (mastery < 30)  return 1;
    if (mastery < 50)  return 2;
    if (mastery < 70)  return 3;
    if (mastery < 85)  return 4;
    return 5;
  }

  function generateCells(mastery) {
    // Simulate session variance around the base mastery value
    return Array.from({ length: NUM_SESSIONS }, (_, i) => {
      const variance = (Math.sin(i * 1.5 + mastery) * 15);
      const val      = Math.max(0, Math.min(100, mastery + variance));
      return masteryToLevel(val);
    });
  }

  const rows = subjectMastery.map(sub => {
    const name   = sub.subject || sub.name || 'Unknown';
    const mastery = sub.mastery ?? sub.accuracy ?? 0;
    const cells   = generateCells(mastery);

    const cellsHTML = cells.map(level => `
      <div
        class="heatmap-cell heatmap-cell--${level}"
        title="${name}: ${level === 0 ? 'No data' : `Level ${level}/5`}"
        aria-label="${name} session mastery level ${level}"
      ></div>
    `).join('');

    return `
      <div class="heatmap-row">
        <p class="heatmap-row-label">${name}</p>
        <div class="heatmap-cells">${cellsHTML}</div>
      </div>
    `;
  });

  wrapper.innerHTML = `<div class="heatmap-grid">${rows.join('')}</div>`;
}


// SUBJECT PERFORMANCE LIST
// subjectMastery: [{ subject, mastery, questionsAttempted }]
function renderSubjectPerformance(subjectMastery) {
  const list = document.getElementById('subjectPerfList');
  if (!list) return;

  if (!subjectMastery.length) {
    list.innerHTML = `
      <div class="empty-state">
        <p>No subject data yet.</p>
        <a href="/pages/study-session.html">Start a study session →</a>
      </div>`;
    return;
  }

  list.innerHTML = subjectMastery.map(sub => {
    const name     = sub.subject || sub.name || 'Unknown';
    const mastery  = sub.mastery ?? sub.accuracy ?? 0;
    const attempts = sub.questionsAttempted ?? 0;
    const color    = getSubjectColor(name);

    return `
      <div class="subject-perf-item">
        <div class="subject-perf-top">
          <span class="subject-perf-name">
            ${name}
            <span class="subject-perf-meta">${attempts} attempted</span>
          </span>
          <span class="subject-perf-pct">${mastery}%</span>
        </div>
        <div class="subject-perf-bar-track">
          <div
            class="subject-perf-bar-fill"
            style="width: ${Math.min(mastery, 100)}%; background: ${color};"
            role="progressbar"
            aria-valuenow="${mastery}"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="${name} mastery"
          ></div>
        </div>
      </div>
    `;
  }).join('');
}


// WEAK TOPICS
// weakAreas: [{ topic, subject, accuracy }]
function renderWeakTopics(weakAreas) {
  const list    = document.getElementById('weakTopicsList');
  const badge   = document.getElementById('flaggedBadge');
  const subtitle = document.getElementById('weakTopicsSubtitle');

  if (!list) return;

  if (!weakAreas.length) {
    if (badge)    badge.textContent   = '';
    if (subtitle) subtitle.textContent = 'No weak areas detected yet';
    list.innerHTML = `
      <div class="empty-state">
        <p>No weak topics yet. Keep practicing!</p>
      </div>`;
    return;
  }

  if (badge)    badge.textContent   = `${weakAreas.length} flagged`;
  if (subtitle) subtitle.textContent = 'Flagged for priority review';

  list.innerHTML = weakAreas.map(topic => {
    const name     = topic.topic   || topic.name    || 'Unknown';
    const subject  = topic.subject || '';
    const accuracy = topic.accuracy ?? 0;
    const accClass = getAccuracyClass(accuracy);

    return `
      <div class="weak-topic-item">
        <div class="weak-topic-info">
          <p class="weak-topic-name">${name}</p>
          <p class="weak-topic-subject">${subject}</p>
        </div>
        <div class="weak-topic-right">
          <span class="weak-topic-accuracy ${accClass}">${accuracy}%</span>
          <a
            href="/pages/study-session.html?topic=${encodeURIComponent(name)}&subject=${encodeURIComponent(subject)}"
            class="weak-topic-practice"
          >Practice →</a>
        </div>
      </div>
    `;
  }).join('');
}


// RECENT MOCKS
// mockHistory item: { _id, score, totalScore, accuracy, subjects, createdAt }
function renderRecentMocks(mocks) {
  const list = document.getElementById('recentMocksList');
  if (!list) return;

  if (!mocks.length) {
    list.innerHTML = `
      <div class="empty-state">
        <p>No mock tests taken yet.</p>
        <a href="/pages/mock-tests.html">Take your first mock →</a>
      </div>`;
    return;
  }

  list.innerHTML = mocks.map(mock => {
    const score    = mock.score      ?? mock.totalScore ?? 0;
    const accuracy = mock.accuracy   ?? 0;
    const date     = formatRelativeTime(mock.createdAt);
    const subjects = Array.isArray(mock.subjects)
      ? mock.subjects.join(', ')
      : 'All Subjects';
    const mockId   = mock._id || mock.id || '';

    return `
      <div class="mock-item">
        <div class="mock-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div class="mock-info">
          <p class="mock-title">${subjects}</p>
          <p class="mock-meta">Accuracy: ${accuracy}% · ${date}</p>
        </div>
        <p class="mock-score">${score}<span>/400</span></p>
        ${mockId ? `<a href="/pages/mock-tests.html?review=${mockId}" class="mock-review-link">Review →</a>` : ''}
      </div>
    `;
  }).join('');
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