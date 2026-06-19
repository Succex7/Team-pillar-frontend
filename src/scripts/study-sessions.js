// src/scripts/study-sessions.js
import { initShell } from '../components/shell.js';
import { userStore } from '../store/userStore.js';
import { api }       from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';

// Free plan allows 3 practice sessions per day
const FREE_DAILY_LIMIT = 3;

// Icon colour rotation order for recent session cards
const ICON_COLOURS = [
  { bg: '#FFF7ED', color: '#F97316' }, // orange
  { bg: '#F0FDF4', color: '#22C55E' }, // green
  { bg: '#FAF5FF', color: '#A855F7' }, // purple
  { bg: '#EFF6FF', color: '#3B82F6' }, // blue
];

// Anything below this accuracy is flagged as a weak area
const WEAK_AREA_THRESHOLD = 60;

// Maximum suggestions to show in "Suggested For You"
const MAX_SUGGESTIONS = 10;

let userSubjects   = [];
let allSubjects    = [];
let currentTopics  = [];

// Tracks sessions used today (derived from session history)
let sessionsUsedToday = 0;

async function init() {
  // Render shell 
  await initShell(
    'study-session',
    'Study Sessions',
    'Adaptive · up to 30 min · 5 subjects'
  );

  // Load all page data in parallel for speed
  await Promise.allSettled([
    loadUserAndSubjects(),
    loadRecentSessions(),
    loadWeekStats(),
  ]);

  // button event
  bindStartSession();
}

//USER PROFILE + SUBJECTS

async function loadUserAndSubjects() {
  try {
    const meRes  = await api.get(ENDPOINTS.GET_ME);
    const meData = meRes.data ?? meRes;
    const user   = meData.user ?? meData;

    const selectedSubjectIds = user?.selectedSubjects ?? [];

    // Store user in userStore for shell to use
    if (user) {
      userStore.setState({ profile: user });
    }

    const subjRes  = await api.get(ENDPOINTS.GET_SUBJECTS);
    const subjData = subjRes.data ?? subjRes;

    allSubjects = Array.isArray(subjData) ? subjData : [];

    userSubjects = allSubjects.filter(subj =>
      selectedSubjectIds.includes(subj._id)
    );

    // Fallback
    if (userSubjects.length === 0 && selectedSubjectIds.length > 0) {
      userSubjects = allSubjects.filter(s => s.isActive);
    }

    populateSubjectDropdown(userSubjects);

  } catch (err) {
    showToast('Could not load your subjects. Please refresh.', 'error');

    // Fallback: reading from sessionStorage saved during onboarding step 1
    const saved = sessionStorage.getItem('onboarding_step1_data');
    if (saved) {
      try {
        const step1 = JSON.parse(saved);
        // step1.subjects = [{ id, name }]
        userSubjects = step1.subjects.map(s => ({ _id: s.id, name: s.name }));
        populateSubjectDropdown(userSubjects);
      } catch {
        // Nothing
      }
    }
  }
}

function populateSubjectDropdown(subjects) {
  const datalist = document.getElementById('subjects-list');
  const input    = document.getElementById('subjects');
  if (!datalist || !input) return;

  // Clear old options
  datalist.innerHTML = '';

  subjects.forEach(subj => {
    const option   = document.createElement('option');
    option.value   = subj.name;
    
    datalist.appendChild(option);
  });

  // When subject changes, load topics for that subject
  input.addEventListener('change', handleSubjectChange);
}

// TOPIC DROPDOWN
async function handleSubjectChange() {
  const input        = document.getElementById('subjects');
  const topicInput   = document.getElementById('topics');
  const topicList    = document.getElementById('topics-list');
  if (!input || !topicInput || !topicList) return;

  const selectedName = input.value.trim();

  const subject = userSubjects.find(
    s => s.name.toLowerCase() === selectedName.toLowerCase()
  );

  if (!subject) {
    // clear topics if wrong subject is typed
    topicList.innerHTML = '';
    topicInput.value    = '';
    currentTopics       = [];
    return;
  }

  // Clear previous topics
  topicList.innerHTML = '';
  topicInput.value    = '';
  currentTopics       = [];

  // Replace with real topics endpoint when available
  try {
    const topicsRes  = await api.get(`${ENDPOINTS.GET_SUBJECTS}/${subject._id}/topics`);
    const topicsData = topicsRes.data ?? topicsRes;
    const topics     = Array.isArray(topicsData) ? topicsData : [];
    
    currentTopics = topics;

    if (topics.length > 0) {
      // Add "All Topics" as first option
      const allOpt   = document.createElement('option');
      allOpt.value   = 'All Topics';
      topicList.appendChild(allOpt);

      topics.forEach(topic => {
        const option = document.createElement('option');
        option.value = topic.name ?? topic;
        topicList.appendChild(option);
      });

      topicInput.value = 'All Topics';
    }
  } catch {
   // if no topics endpoints
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
  const subjectInput = document.getElementById('subjects');
  const topicInput   = document.getElementById('topics');
  if (!subjectInput) return;

  const selectedSubjectName = subjectInput.value.trim();

  // if no selected subject
  if (!selectedSubjectName) {
    showToast('Please select a subject to start.', 'error');
    return;
  }

  // if subject selected doesn't match one of their enrolled subjects
  const subject = userSubjects.find(
    s => s.name.toLowerCase() === selectedSubjectName.toLowerCase()
  );
  if (!subject) {
    showToast('Please choose a subject from your enrolled list.', 'error');
    return;
  }

  // Check daily session limit (FREE_DAILY_LIMIT = 3)
  if (sessionsUsedToday >= FREE_DAILY_LIMIT) {
    showToast("You've used all 3 sessions for today. Come back tomorrow!", 'error');
    return;
  }

  // Get optional topic
  const topicValue  = topicInput?.value?.trim() || '';
  const selectedTopic = currentTopics.find(
    t => (t.name ?? t).toLowerCase() === topicValue.toLowerCase()
  );

  // Show loading state
  const btn = document.querySelector('.start-session-btn');
  setButtonLoading(btn, true);

  try {
    const body = { subjectId: subject._id };

    if (selectedTopic && topicValue !== 'All Topics') {
      body.topicId = selectedTopic._id ?? selectedTopic;
    }

    const res  = await api.post(ENDPOINTS.SESSION_START, body);
    const data = res.data ?? res;
    
    // The practice page will read these from sessionStorage
    sessionStorage.setItem('active_session_id',      data.sessionId);
    sessionStorage.setItem('active_session_subject',  JSON.stringify(subject));
    sessionStorage.setItem('active_session_topic',    topicValue || '');
    sessionStorage.setItem('active_session_questions', JSON.stringify(data.questions ?? []));

    window.location.href = '/pages/practice-session.html';

  } catch (err) {
    // Handle freemium limit error from Backend 
    if (err.status === 403) {
      showToast('Session limit reached. Upgrade to Pro for unlimited sessions.', 'error');
    } else {
      showToast('Could not start session. Please try again.', 'error');
    }
    setButtonLoading(btn, false);
  }
}

// ─────────────────────────────────────────────
// 3. RECENT SESSIONS
async function loadRecentSessions() {
  try {
    const res     = await api.get(ENDPOINTS.PRACTICE_SESSIONS);
    const resData = res.data ?? res;

    // API returns an array of sessions
    const sessions = Array.isArray(resData) ? resData : [];

    // Derive how many sessions the student has taken TODAY
    // We compare session startTime to today's date
    const todayStr = new Date().toDateString();
    sessionsUsedToday = sessions.filter(s => {
      const sessionDate = new Date(s.startTime ?? s.createdAt);
      return sessionDate.toDateString() === todayStr;
    }).length;

    // Update the sessions remaining badge 
    updateSessionsRemaining(sessionsUsedToday);
    // Render the recent sessions list
    renderRecentSessions(sessions);
    // Build "Suggested For You" from weak areas in session data,no backend endpoint 
    buildSuggestions(sessions);

  } catch (err) {
    showToast('Could not load recent sessions.', 'error');
    // Still show empty state so the page doesn't just look broken
    renderRecentSessions([]);
    buildSuggestions([]);
  }
}

// Updates the "X of 3 sessions remaining today" badge
function updateSessionsRemaining(usedToday) {
  const countEl = document.querySelector('.sessions-count');
  if (!countEl) return;

  const remaining = Math.max(0, FREE_DAILY_LIMIT - usedToday);

  // Update count text
  countEl.textContent = remaining;

  // Update the full badge text
  const sessionText = countEl.closest('.sessions-left');
  if (sessionText) {
    sessionText.innerHTML = `<span class="sessions-count">${remaining}</span> of ${FREE_DAILY_LIMIT} sessions remaining today`;
  }
}

// Renders the list of recent session cards
function renderRecentSessions(sessions) {
  const container = document.querySelector('.past-study-session-box');
  if (!container) return;
  
  container.innerHTML = '';

  // Empty state — shown until student completes their first session
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

  // Render each session as a card, if >4, the CSS makes it scrollable
  sessions.forEach((session, index) => {
    const card = buildSessionCard(session, index);
    container.appendChild(card);
  });
}

// Builds a single recent session card element
function buildSessionCard(session, index) {
  // Get subject name — session has subjectId
  const subject = allSubjects.find(s => s._id === session.subjectId)
    ?? { name: 'Unknown Subject' };

  // Get topic from analytics if available
  const topic = session.analytics?.topMistakeTopic ?? session.topic ?? '';

  // Score and accuracy
  const score    = session.score ?? 0;
  const accuracy = session.analytics?.accuracy ?? 0;

  // Score colour: green if ≥ 70%, yellow if below
  const scoreColour    = score    >= 70 ? '#22C55E' : '#F59E0B';
  const accuracyColour = accuracy >= 70 ? '#22C55E' : '#F59E0B';

  // Icon colour rotates through ICON_COLOURS array using modulo
  const iconStyle = ICON_COLOURS[index % ICON_COLOURS.length];

  // date/time
  const dateStr = formatSessionDate(session.startTime ?? session.createdAt);

  // Build card div
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

  // Review button will navigate to results page
  const reviewBtn = card.querySelector('.rvw-btn');
  reviewBtn?.addEventListener('click', () => handleReview(session.id ?? session._id));

  return card;
}

// Redirects to the session result/review page
function handleReview(sessionId) {
  if (!sessionId) return;
  // Save the session ID so the review page knows what to load
  sessionStorage.setItem('review_session_id', sessionId);
  window.location.href = '/pages/session-result.html';
}

// DATE FORMATTER
// Converts ISO timestamp → "Today, 9:30 AM" / "Dec 15, 2:45 PM"

function formatSessionDate(isoString) {
  if (!isoString) return '—';

  const date  = new Date(isoString);
  const now   = new Date();

  const isToday     = date.toDateString() === now.toDateString();
  const yesterday   = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  // Format time as "9:30 AM"
  const timeStr = date.toLocaleTimeString('en-US', {
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday)     return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;

  // Older: "Dec 15, 2:45 PM"
  const monthStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${monthStr}, ${timeStr}`;
}

// SUGGESTED FOR YOU
function buildSuggestions(sessions) {
  // Group sessions by subject (and topic if available)
  // Calculate average accuracy per group
  const groups = {};

  sessions.forEach(session => {
    const subject = allSubjects.find(s => s._id === session.subjectId)
      ?? { _id: session.subjectId, name: 'Unknown' };

    const topic   = session.analytics?.topMistakeTopic ?? '';
    // Key: "subjectId|topic" so same subject with different topics are separate entries
    const key     = `${subject._id}|${topic}`;

    if (!groups[key]) {
      groups[key] = {
        subjectId:   subject._id,
        subjectName: subject.name,
        topic,
        accuracies:  [],
      };
    }
    groups[key].accuracies.push(session.analytics?.accuracy ?? 0);
  });

  // Calculate average accuracy for each group
  const weakAreas = Object.values(groups)
    .map(group => ({
      ...group,
      avgAccuracy: Math.round(
        group.accuracies.reduce((sum, a) => sum + a, 0) / group.accuracies.length
      ),
    }))
    // Only keep areas below the threshold
    .filter(g => g.avgAccuracy < WEAK_AREA_THRESHOLD)
    // Sort by worst accuracy first
    .sort((a, b) => a.avgAccuracy - b.avgAccuracy)
    // Cap at MAX_SUGGESTIONS
    .slice(0, MAX_SUGGESTIONS);

  renderSuggestions(weakAreas);
}

function renderSuggestions(weakAreas) {
  const container = document.querySelector('.suggestions-container');
  if (!container) return;

  container.innerHTML = '';

  // Empty state
  if (weakAreas.length === 0) {
    container.innerHTML = `
      <div class="empty-state empty-state--light">
        <i class="ph-bold ph-chart-line-up empty-icon"></i>
        <p class="empty-title">No weak areas yet</p>
        <p class="empty-desc">Complete sessions and we'll highlight topics to revisit here.</p>
      </div>
    `;
    return;
  }

  weakAreas.forEach(area => {
    const card = document.createElement('div');
    card.className = 'suggestion';

    // Accuracy dot colour
    // Yellow for 40–59%, red for below 40%
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

    // Practice button: pre-fills subject then starts session
    const practiceBtn = card.querySelector('.practice');
    practiceBtn?.addEventListener('click', () => {
      handlePracticeFromSuggestion(area.subjectId, area.subjectName, area.topic);
    });

    container.appendChild(card);
  });
}

async function handlePracticeFromSuggestion(subjectId, subjectName, topic) {
  const subjectInput = document.getElementById('subjects');
  const topicInput   = document.getElementById('topics');

  if (subjectInput) subjectInput.value = subjectName;
  if (topicInput && topic)   topicInput.value = topic;

  // Trigger the change event so topics load properly
  subjectInput?.dispatchEvent(new Event('change'));

  // Small delay to let topics populate, then start
  await new Promise(resolve => setTimeout(resolve, 300));

  handleStartSession();
}

// THIS WEEK STATS
async function loadWeekStats() {
  try {
    // Ping streak first to make sure it's up to date for today's visit
    api.post(ENDPOINTS.STREAKS, {}).catch(() => {
    });

    // Fetch dashboard stats for this week
    const res  = await api.get(`${ENDPOINTS.STUDENT_DASHBOARD}?period=week`);
    const data = res.data ?? res;

    const stats = data.stats ?? {};

    // Populate the streak card
    renderWeekStats(stats);

  } catch (err) {
    renderWeekStats({});
  }
}

function renderWeekStats(stats) {
  // Questions practiced this week
  const quesCountEl = document.querySelector('.ques-count');
  if (quesCountEl) {
    quesCountEl.textContent = stats.questionsAnswered ?? '—';
  }

  // Sessions this week
  const sessionsEl = document.querySelector('.sessions.streak-counts');
  if (sessionsEl) {
    sessionsEl.textContent = stats.totalSessions ?? '—';
  }

  // Average score this week
  const avgScoreEl = document.querySelector('.avg-score.streak-counts');
  if (avgScoreEl) {
    const avg = stats.averageScore;
    avgScoreEl.textContent = avg != null ? `${avg}%` : '—';
  }

  // Streak count
  const streakEl   = document.querySelector('.streak-count');
  const checkIcon  = document.querySelector('.keep-it-up-section .check');
  const streak     = stats.studyStreak ?? 0;

  if (streakEl) {
    if (streak > 0) {
      streakEl.textContent = `${streak} week streak active!`;
    } else {
      streakEl.textContent = 'Start your streak today!';
    }
  }
    
   //  If streak is 0, change icon to a motivation
  if (checkIcon && streak === 0) {
    checkIcon.className = 'ph-bold ph-rocket-launch check';
  }
}

// Shows a toast notification
function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className   = `toast ${type}`.trim();
  void toast.offsetWidth; // force reflow so animation restarts
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// loading state
function setButtonLoading(btn, isLoading) {
  if (!btn) return;
  if (isLoading) {
    btn.disabled = true;
    btn.innerHTML = `
      <span class="btn-spinner"></span> Starting...
    `;
  } else {
    btn.disabled = false;
    btn.innerHTML = `
      <img src="/icon/play.svg" alt=""> Start Session Now
    `;
  }
}

init();