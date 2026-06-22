// src/scripts/study-session.js
import { initShell } from '../components/shell.js';
import { userStore } from '../store/userStore.js';
import { api }       from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';

const FREE_DAILY_LIMIT = 3;

const ICON_COLOURS = [
  { bg: '#FFF7ED', color: '#F97316' },
  { bg: '#F0FDF4', color: '#22C55E' },
  { bg: '#FAF5FF', color: '#A855F7' },
  { bg: '#EFF6FF', color: '#3B82F6' },
];

const WEAK_AREA_THRESHOLD = 60;
const MAX_SUGGESTIONS = 10;

let userSubjects   = [];
let allSubjects    = [];
let currentTopics  = [];
let sessionsUsedToday = 0;

async function init() {
  await initShell(
    'study-session',
    'Study Sessions',
    'Adaptive · up to 30 min · 5 subjects'
  );

  await Promise.allSettled([
    loadUserAndSubjects(),
    loadRecentSessions(),
    loadWeekStats(),
  ]);

  bindStartSession();
}

// USER PROFILE + SUBJECTS
async function loadUserAndSubjects() {
  try {
    const meRes  = await api.get(ENDPOINTS.GET_ME);
    const meData = meRes.data ?? meRes;
    const user   = meData.user ?? meData;

    const selectedSubjectIds = user?.selectedSubjects ?? [];

    if (user) {
      userStore.setState({ profile: user });
    }

    const subjRes  = await api.get(ENDPOINTS.GET_SUBJECTS);
    const subjData = subjRes.data ?? subjRes;

    allSubjects  = Array.isArray(subjData) ? subjData : [];
    userSubjects = allSubjects.filter(subj =>
      selectedSubjectIds.includes(subj._id)
    );

    if (userSubjects.length === 0 && selectedSubjectIds.length > 0) {
      userSubjects = allSubjects.filter(s => s.isActive);
    }

    populateSubjectDropdown(userSubjects);

  } catch (err) {
    showToast('Could not load your subjects. Please refresh.', 'error');

    const saved = sessionStorage.getItem('onboarding_step1_data');
    if (saved) {
      try {
        const step1  = JSON.parse(saved);
        userSubjects = step1.subjects.map(s => ({ _id: s.id, name: s.name }));
        populateSubjectDropdown(userSubjects);
      } catch {
        // ignore
      }
    }
  }
}

// Populates the subject <select> dropdown
function populateSubjectDropdown(subjects) {
  const select = document.getElementById('subjects');
  if (!select) return;

  // Clear old options but keep the placeholder
  select.innerHTML = '<option value="" disabled selected>Select a subject</option>';

  subjects.forEach(subj => {
    const option   = document.createElement('option');
    option.value   = subj._id;
    option.textContent = subj.name;
    select.appendChild(option);
  });

  select.addEventListener('change', handleSubjectChange);
}

// TOPIC DROPDOWN
async function handleSubjectChange() {
  const select     = document.getElementById('subjects');
  const topicSelect = document.getElementById('topics');
  if (!select || !topicSelect) return;

  const selectedId = select.value;
  const subject    = userSubjects.find(s => s._id === selectedId);

  // Reset topic dropdown
  topicSelect.innerHTML = '<option value="">All Topics</option>';
  currentTopics = [];

  if (!subject) return;

  try {
    const topicsRes  = await api.get(`${ENDPOINTS.GET_SUBJECTS}/${subject._id}/topics`);
    const topicsData = topicsRes.data ?? topicsRes;
    const topics     = Array.isArray(topicsData) ? topicsData : [];

    currentTopics = topics;

    topics.forEach(topic => {
      const option       = document.createElement('option');
      option.value       = topic._id ?? topic;
      option.textContent = topic.name ?? topic;
      topicSelect.appendChild(option);
    });

  } catch {
    // Topics endpoint not available yet — topic select stays as "All Topics"
    currentTopics = [];
  }
}

// START SESSION
function bindStartSession() {
  const btn = document.querySelector('.start-session-btn');
  if (!btn) return;
  btn.addEventListener('click', handleStartSession);
}

async function handleStartSession() {
  const subjectSelect = document.getElementById('subjects');
  const topicSelect   = document.getElementById('topics');
  if (!subjectSelect) return;

  const selectedId = subjectSelect.value;

  if (!selectedId) {
    showToast('Please select a subject to start.', 'error');
    return;
  }

  const subject = userSubjects.find(s => s._id === selectedId);
  if (!subject) {
    showToast('Please choose a subject from your enrolled list.', 'error');
    return;
  }

  if (sessionsUsedToday >= FREE_DAILY_LIMIT) {
    showToast("You've used all 3 sessions for today. Come back tomorrow!", 'error');
    return;
  }

  const topicValue   = topicSelect?.value || '';
  const selectedTopic = currentTopics.find(
    t => (t._id ?? t) === topicValue
  );

  const btn = document.querySelector('.start-session-btn');
  setButtonLoading(btn, true);

  try {
    const body = { subjectId: subject._id };

    if (selectedTopic && topicValue) {
      body.topicId = selectedTopic._id ?? selectedTopic;
    }

    const res  = await api.post(ENDPOINTS.SESSION_START, body);
    const data = res.data ?? res;

    sessionStorage.setItem('active_session_id',       data.sessionId);
    sessionStorage.setItem('active_session_subject',   JSON.stringify(subject));
    sessionStorage.setItem('active_session_topic',     topicValue || '');
    sessionStorage.setItem('active_session_questions', JSON.stringify(data.questions ?? []));

    window.location.href = '/pages/practice-session.html';

  } catch (err) {
    if (err.status === 403) {
      showToast('Session limit reached. Upgrade to Pro for unlimited sessions.', 'error');
    } else {
      showToast('Could not start session. Please try again.', 'error');
    }
    setButtonLoading(btn, false);
  }
}

// RECENT SESSIONS
async function loadRecentSessions() {
  try {
    const res      = await api.get(ENDPOINTS.PRACTICE_SESSIONS);
    const resData  = res.data ?? res;
    const sessions = Array.isArray(resData) ? resData : [];

    const todayStr = new Date().toDateString();
    sessionsUsedToday = sessions.filter(s => {
      const sessionDate = new Date(s.startTime ?? s.createdAt);
      return sessionDate.toDateString() === todayStr;
    }).length;

    updateSessionsRemaining(sessionsUsedToday);
    renderRecentSessions(sessions);
    buildSuggestions(sessions);

  } catch (err) {
    showToast('Could not load recent sessions.', 'error');
    renderRecentSessions([]);
    buildSuggestions([]);
  }
}

function updateSessionsRemaining(usedToday) {
  const countEl = document.querySelector('.sessions-count');
  if (!countEl) return;

  const remaining   = Math.max(0, FREE_DAILY_LIMIT - usedToday);
  countEl.textContent = remaining;

  const sessionText = countEl.closest('.sessions-left');
  if (sessionText) {
    sessionText.innerHTML = `<span class="sessions-count">${remaining}</span> of ${FREE_DAILY_LIMIT} sessions remaining today`;
  }
}

function renderRecentSessions(sessions) {
  const container = document.querySelector('.past-study-session-box');
  if (!container) return;

  container.innerHTML = '';

  if (sessions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ph-bold ph-book-open-text empty-icon"></i>
        <p class="empty-title">No sessions yet</p>
        <p class="empty-desc">This is where your past sessions will appear. Start one above!</p>
      </div>
    `;
    return;
  }

  sessions.forEach((session, index) => {
    container.appendChild(buildSessionCard(session, index));
  });
}

function buildSessionCard(session, index) {
  const subject  = allSubjects.find(s => s._id === session.subjectId) ?? { name: 'Unknown Subject' };
  const topic    = session.analytics?.topMistakeTopic ?? session.topic ?? '';
  const score    = session.score ?? 0;
  const accuracy = session.analytics?.accuracy ?? 0;

  const scoreColour    = score    >= 70 ? '#22C55E' : '#F59E0B';
  const accuracyColour = accuracy >= 70 ? '#22C55E' : '#F59E0B';
  const iconStyle      = ICON_COLOURS[index % ICON_COLOURS.length];
  const dateStr        = formatSessionDate(session.startTime ?? session.createdAt);

  const card = document.createElement('div');
  card.className = 'study-sessions-listing';

  card.innerHTML = `
    <div class="icon-subj-stat">
      <i class="ph-bold ph-book-open book"
         style="background:${iconStyle.bg}; color:${iconStyle.color};"></i>
      <div class="all-subj">
        <h4 class="subj-name">
          ${subject.name}${topic ? ` <span class="session-topic">· ${topic}</span>` : ''}
        </h4>
        <div class="subj-stats">
          <p>Score: <span style="color:${scoreColour}; font-weight:600;">${score}%</span></p>
          <p>Accuracy: <span style="color:${accuracyColour}; font-weight:600;">${accuracy}%</span></p>
          <div class="subj-stats-time">
            <i class="ph ph-clock clock"></i>
            <p>${dateStr}</p>
          </div>
        </div>
      </div>
    </div>
    <button class="rvw-btn" data-session-id="${session.id ?? session._id}">
      Review
      <i class="ph-bold ph-arrow-right"></i>
    </button>
  `;

  card.querySelector('.rvw-btn')?.addEventListener('click', () =>
    handleReview(session.id ?? session._id)
  );

  return card;
}

function handleReview(sessionId) {
  if (!sessionId) return;
  sessionStorage.setItem('review_session_id', sessionId);
  window.location.href = '/pages/session-result.html';
}

// DATE FORMATTER
function formatSessionDate(isoString) {
  if (!isoString) return '—';

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

// SUGGESTED FOR YOU
function buildSuggestions(sessions) {
  const groups = {};

  sessions.forEach(session => {
    const subject = allSubjects.find(s => s._id === session.subjectId)
      ?? { _id: session.subjectId, name: 'Unknown' };
    const topic   = session.analytics?.topMistakeTopic ?? '';
    const key     = `${subject._id}|${topic}`;

    if (!groups[key]) {
      groups[key] = { subjectId: subject._id, subjectName: subject.name, topic, accuracies: [] };
    }
    groups[key].accuracies.push(session.analytics?.accuracy ?? 0);
  });

  const weakAreas = Object.values(groups)
    .map(group => ({
      ...group,
      avgAccuracy: Math.round(
        group.accuracies.reduce((sum, a) => sum + a, 0) / group.accuracies.length
      ),
    }))
    .filter(g => g.avgAccuracy < WEAK_AREA_THRESHOLD)
    .sort((a, b) => a.avgAccuracy - b.avgAccuracy)
    .slice(0, MAX_SUGGESTIONS);

  renderSuggestions(weakAreas);
}

function renderSuggestions(weakAreas) {
  const container = document.querySelector('.suggestions-container');
  if (!container) return;

  container.innerHTML = '';

  if (weakAreas.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ph-bold ph-chart-line-up empty-icon"></i>
        <p class="empty-title">No weak areas yet</p>
        <p class="empty-desc">Complete sessions and we'll highlight topics to revisit here.</p>
      </div>
    `;
    return;
  }

  weakAreas.forEach(area => {
    const card      = document.createElement('div');
    card.className  = 'suggestion';
    const dotColour = area.avgAccuracy < 40 ? '#EF4444' : '#F59E0B';

    card.innerHTML = `
      <h4 class="sugg-topic">${area.topic || area.subjectName}</h4>
      <p class="sugg-subj">${area.topic ? area.subjectName : ''}</p>
      <div class="accuracy-practice">
        <p class="accuracy">
          <i class="ph-fill ph-circle" style="color:${dotColour};"></i>
          <span class="weak-areas-accuracy" style="color:${dotColour};">${area.avgAccuracy}%</span> accuracy
        </p>
        <button class="practice"
          data-subject-id="${area.subjectId}"
          data-subject-name="${area.subjectName}"
          data-topic="${area.topic}">
          Practice<i class="ph-bold ph-arrow-right"></i>
        </button>
      </div>
    `;

    card.querySelector('.practice')?.addEventListener('click', () =>
      handlePracticeFromSuggestion(area.subjectId, area.subjectName, area.topic)
    );

    container.appendChild(card);
  });
}

async function handlePracticeFromSuggestion(subjectId, subjectName, topic) {
  const subjectSelect = document.getElementById('subjects');
  const topicSelect   = document.getElementById('topics');

  if (subjectSelect) subjectSelect.value = subjectId;
  subjectSelect?.dispatchEvent(new Event('change'));

  await new Promise(resolve => setTimeout(resolve, 300));

  if (topicSelect && topic) topicSelect.value = topic;

  handleStartSession();
}

// THIS WEEK STATS
async function loadWeekStats() {
  try {
    api.post(ENDPOINTS.STREAKS, {}).catch(() => {});

    const res   = await api.get(`${ENDPOINTS.STUDENT_DASHBOARD}?period=week`);
    const data  = res.data ?? res;
    const stats = data.stats ?? {};

    renderWeekStats(stats);

  } catch (err) {
    renderWeekStats({});
  }
}

function renderWeekStats(stats) {
fillStat(document.querySelector('.ques-count'),             stats.questionsAnswered, '0');
fillStat(document.querySelector('.sessions.streak-counts'), stats.totalSessions,     '0');

  const avg    = stats.averageScore;
  const avgEl  = document.querySelector('.avg-score.streak-counts');
  fillStat(avgEl, avg != null ? `${avg}%` : null, '—');

  const streak    = stats.studyStreak ?? 0;
  const streakEl  = document.querySelector('.streak-count');
  const checkIcon = document.querySelector('.keep-it-up-section .check');

  if (streakEl) {
    streakEl.textContent = streak > 0 ? `${streak} week streak active!` : 'Start your streak today!';
  }

  if (checkIcon && streak === 0) {
    checkIcon.className = 'ph-bold ph-rocket-launch check';
  }
}

// UI HELPERS

// fillStat: sets an element's text and toggles .stat-empty
// when value is null/undefined the placeholder (-- or 0) shows faintly
// when value is real the element renders bold at full opacity
function fillStat(el, value, placeholder = '--') {
  if (!el) return;
  const isEmpty    = value == null;
  el.textContent   = isEmpty ? placeholder : value;
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
    btn.innerHTML = `<img src="/icon/play.svg" alt=""> Start Session Now`;
  }
}

init();