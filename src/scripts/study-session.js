// src/scripts/study-session.js
import { initShell } from '../components/shell.js';
import { userStore } from '../store/userStore.js';
import { api }       from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';

const FREE_DAILY_LIMIT = 3;
const MAX_FREE_SUBJECTS = 5;

const ICON_COLOURS = [
  { bg: '#FFF7ED', color: '#F97316' },
  { bg: '#F0FDF4', color: '#22C55E' },
  { bg: '#FAF5FF', color: '#A855F7' },
  { bg: '#EFF6FF', color: '#3B82F6' },
];

const SUBJECT_ICONS = {
  'Mathematics': 'ph-plus-minus',
  'Use of English': 'ph-text-aa',
  'English Language': 'ph-text-aa',
  'Biology': 'ph-dna',
  'Chemistry': 'ph-flask',
  'Physics': 'ph-atom',
  'Economics': 'ph-chart-bar',
  'Government': 'ph-buildings',
  'Literature': 'ph-book-open',
};

function getSubjectIcon(name) {
  return SUBJECT_ICONS[name] || 'ph-book';
}

const WEAK_AREA_THRESHOLD = 60;
const MAX_SUGGESTIONS = 10;

let userSubjects   = [];
let allSubjects    = [];
let currentTopics  = [];
let sessionsUsedToday = 0;
let isProUser = false;

async function init() {
  const user = userStore.getState().profile;
  isProUser = user?.subscription === 'pro' || user?.isPro || false;

  await initShell(
    'study-session',
    'Study Sessions',
    'Configure and start your study session'
  );

  await Promise.allSettled([
    loadUserAndSubjects(),
    loadRecentSessions(),
    loadWeekStats(),
  ]);

  bindFormHandlers();
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
      isProUser = user?.subscription === 'pro' || user?.isPro || false;
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

    renderSubjectsCheckboxGrid(userSubjects);

  } catch (err) {
    showToast('Could not load your subjects. Please refresh.', 'error');
  }
}

// Render Subjects Checkbox Grid
function renderSubjectsCheckboxGrid(subjects) {
  const grid = document.getElementById('subjectsCheckboxGrid');
  if (!grid) return;

  if (subjects.length === 0) {
    grid.innerHTML = '<div class="loading-placeholder">No subjects enrolled. Go to Settings to select subjects.</div>';
    return;
  }

  grid.innerHTML = '';
  subjects.forEach(subj => {
    const iconClass = getSubjectIcon(subj.name);
    const label = document.createElement('label');
    label.className = 'subject-checkbox-option';
    label.innerHTML = `
      <input type="checkbox" name="selectedSubjects" value="${subj._id}" data-name="${subj.name}">
      <div class="subject-checkbox-content">
        <i class="ph-bold ${iconClass} subj-icon"></i>
        <span class="subj-name">${subj.name}</span>
      </div>
    `;
    grid.appendChild(label);
  });

  // Bind change listeners to checkboxes
  const checkboxes = grid.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', handleCheckboxChange);
  });
}

// Handle Checkbox Change (Limits and topic display)
async function handleCheckboxChange() {
  const checked = document.querySelectorAll('input[name="selectedSubjects"]:checked');
  
  // Enforce Max 5 subjects limit for Free users
  if (!isProUser && checked.length > MAX_FREE_SUBJECTS) {
    this.checked = false;
    showToast(`Free plan limit: You can select up to ${MAX_FREE_SUBJECTS} subjects.`, 'error');
    return;
  }

  const topicGroup = document.getElementById('topicSelectionGroup');
  const topicSelect = document.getElementById('topics');

  if (checked.length === 1) {
    // Exactly 1 subject selected: show topic selector and fetch topics
    const subjectId = checked[0].value;
    const subjectName = checked[0].dataset.name;

    topicGroup.style.display = 'block';
    topicSelect.innerHTML = '<option value="">Loading topics...</option>';

    try {
      const topicsRes = await api.get(`${ENDPOINTS.GET_SUBJECTS}/${subjectId}/topics`);
      const topicsData = topicsRes.data ?? topicsRes;
      const topics = Array.isArray(topicsData) ? topicsData : [];

      currentTopics = topics;
      topicSelect.innerHTML = '<option value="">All Topics</option>';
      
      topics.forEach(topic => {
        const option = document.createElement('option');
        option.value = topic._id ?? topic;
        option.textContent = topic.name ?? topic;
        topicSelect.appendChild(option);
      });
    } catch {
      topicSelect.innerHTML = '<option value="">All Topics (Failed to load topics)</option>';
      currentTopics = [];
    }
  } else {
    // 0 or multiple subjects: hide topic selector
    topicGroup.style.display = 'none';
    if (topicSelect) topicSelect.innerHTML = '<option value="">All Topics</option>';
    currentTopics = [];
  }
}

// BIND FORM AND DURATION CLICKS
function bindFormHandlers() {
  const form = document.getElementById('studyConfigForm');
  if (form) {
    form.addEventListener('submit', handleStartSessionSubmit);
  }

  // Duration cards change listener
  const durationInputs = document.querySelectorAll('input[name="duration"]');
  durationInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      const val = e.target.value;
      if (!isProUser && (val === '45' || val === '60')) {
        // Prevent selection and redirect
        e.target.checked = false;
        // Select 30 instead
        const dur30 = document.querySelector('input[name="duration"][value="30"]');
        if (dur30) dur30.checked = true;
        
        showToast('Pro durations require a Premium subscription.', 'error');
        setTimeout(() => {
          window.location.href = '/pages/billing.html';
        }, 1000);
      }
    });
  });
}

// START SESSION SUBMIT
async function handleStartSessionSubmit(e) {
  e.preventDefault();

  const checked = document.querySelectorAll('input[name="selectedSubjects"]:checked');
  if (checked.length === 0) {
    showToast('Please select at least one subject to practice.', 'error');
    return;
  }

  if (sessionsUsedToday >= FREE_DAILY_LIMIT && !isProUser) {
    showToast("You've used all 3 sessions for today. Upgrade to Pro for unlimited sessions!", 'error');
    return;
  }

  const btn = document.getElementById('startSessionBtn');
  setButtonLoading(btn, true);

  const selectedIds = Array.from(checked).map(cb => cb.value);
  const selectedNames = Array.from(checked).map(cb => cb.dataset.name);
  
  const practiceMode = document.querySelector('input[name="practiceMode"]:checked').value;
  const duration = document.querySelector('input[name="duration"]:checked').value;
  const topicValue = document.getElementById('topics')?.value || '';

  const selectedTopic = currentTopics.find(t => (t._id ?? t) === topicValue);

  try {
    const body = {
      subjectId: selectedIds[0], // fallback for single-subject backend
      subjectIds: selectedIds,   // multi-subject support
      mode: practiceMode,
      duration: parseInt(duration),
    };

    if (selectedTopic && topicValue) {
      body.topicId = selectedTopic._id ?? selectedTopic;
    }

    const res  = await api.post(ENDPOINTS.SESSION_START, body);
    const data = res.data ?? res;

    // Save configs to sessionStorage
    sessionStorage.setItem('active_session_id', data.sessionId);
    sessionStorage.setItem('active_session_mode', practiceMode);
    sessionStorage.setItem('active_session_duration', duration);
    sessionStorage.setItem('active_session_subjects', JSON.stringify(selectedNames));
    sessionStorage.setItem('active_session_questions', JSON.stringify(data.questions ?? []));
    sessionStorage.setItem('active_session_topic', selectedTopic ? selectedTopic.name : '');

    window.location.href = '/pages/practice-session.html';

  } catch (err) {
    if (err.status === 403) {
      showToast('Daily practice limit reached. Upgrade to Pro for unlimited access.', 'error');
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

    renderRecentSessions(sessions);
    buildSuggestions(sessions);

  } catch (err) {
    showToast('Could not load recent sessions.', 'error');
    renderRecentSessions([]);
    buildSuggestions([]);
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
  const subjectName = session.subjectName ?? 'Subject';
  const topic = session.analytics?.topMistakeTopic ?? session.topic ?? '';
  const score = session.score ?? 0;
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
          ${subjectName}${topic ? ` <span class="session-topic">· ${topic}</span>` : ''}
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
    const subjectId = session.subjectId ?? 'Unknown';
    const subjectName = session.subjectName ?? 'Subject';
    const topic   = session.analytics?.topMistakeTopic ?? '';
    const key     = `${subjectId}|${topic}`;

    if (!groups[key]) {
      groups[key] = { subjectId, subjectName, topic, accuracies: [] };
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
  // Check the subject checkbox in the grid
  const cb = document.querySelector(`input[name="selectedSubjects"][value="${subjectId}"]`);
  if (cb) {
    // Uncheck all first
    document.querySelectorAll('input[name="selectedSubjects"]').forEach(box => box.checked = false);
    cb.checked = true;
    // Trigger change event to load topics
    await handleCheckboxChange.call(cb);

    // Scroll to form config
    document.getElementById('studyConfigForm')?.scrollIntoView({ behavior: 'smooth' });

    // Wait a brief moment for topics to load and select the specific topic
    if (topic) {
      setTimeout(() => {
        const topicSelect = document.getElementById('topics');
        if (topicSelect) {
          // Find option with matching text
          for (let i = 0; i < topicSelect.options.length; i++) {
            if (topicSelect.options[i].text === topic || topicSelect.options[i].value === topic) {
              topicSelect.selectedIndex = i;
              break;
            }
          }
        }
      }, 500);
    }
  }
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
  fillStat(document.querySelector('.sessions'),               stats.totalSessions,     '0');

  const avg    = stats.averageScore;
  const avgEl  = document.querySelector('.avg-score');
  fillStat(avgEl, avg != null ? `${avg}%` : null, '--');

  const streak    = stats.studyStreak ?? 0;
  const streakEl  = document.querySelector('.keep-it-up-section .streak-count');
  const checkIcon = document.querySelector('.keep-it-up-section .check');

  if (streakEl) {
    streakEl.textContent = streak > 0 ? `${streak}-day streak active!` : 'Start your streak today!';
  }

  if (checkIcon && streak === 0) {
    checkIcon.className = 'ph-bold ph-rocket-launch check';
  }
}

// UI HELPERS
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
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 6px;">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
      Start Session Now
    `;
  }
}

init();