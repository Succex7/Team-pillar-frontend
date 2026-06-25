// src/scripts/mock-quiz.js
import { api }       from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';

let mockSessionId = '';
let questions = [];
let subjectNames = [];
let currentQuestionIndex = 0;

let answers = {}; // questionId -> selectedOption ('A', 'B', 'C', 'D')
let flaggedQuestions = new Set();

let timerInterval = null;
let timeRemaining = 120 * 60; // 120 minutes in seconds

let activeSubjectName = '';
let filteredQuestions = [];

let violationCount = 0;
let isSubmitting = false;

async function init() {
  mockSessionId = sessionStorage.getItem('mock_session_id');
  
  try {
    questions = JSON.parse(sessionStorage.getItem('mock_session_questions') || '[]');
    subjectNames = JSON.parse(sessionStorage.getItem('mock_session_subjects') || '[]');
  } catch {
    questions = [];
    subjectNames = [];
  }

  if (!mockSessionId || questions.length === 0) {
    showToast('No active mock exam session found. Redirecting...', 'error');
    setTimeout(() => {
      window.location.href = '/pages/mock-tests.html';
    }, 1500);
    return;
  }

  // Set first subject active
  if (questions.length > 0) {
    const uniqueSubjects = [...new Set(questions.map(q => q.subjectName || q.subject?.name || 'Subject'))];
    if (subjectNames.length === 0) {
      subjectNames = uniqueSubjects;
    }
    activeSubjectName = subjectNames[0];
  }

  setupSubjectTabs();
  filterQuestionsBySubject();
  setupQuestionGrid();
  startExamTimer();
  loadQuestion(0);
  bindEvents();
  initAntiCheat();
}

// EXAM TIMER (120 minutes)
function startExamTimer() {
  const display = document.getElementById('timerText');
  const timerContainer = document.getElementById('timerDisplay');
  if (!display) return;

  timerInterval = setInterval(() => {
    timeRemaining--;
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timeRemaining = 0;
      display.textContent = '00:00:00';
      handleTimeOutSubmit();
    } else {
      const h = Math.floor(timeRemaining / 3600).toString().padStart(2, '0');
      const m = Math.floor((timeRemaining % 3600) / 60).toString().padStart(2, '0');
      const s = (timeRemaining % 60).toString().padStart(2, '0');
      
      display.textContent = `${h}:${m}:${s}`;
      
      // Warn user in last 5 minutes (flash red)
      if (timeRemaining < 300 && timerContainer) {
        timerContainer.classList.add('timer-warning');
      }
    }
  }, 1000);
}

// FILTER BY SUBJECT
function filterQuestionsBySubject() {
  filteredQuestions = questions.filter(q => {
    const qSubj = q.subjectName || q.subject?.name || 'Subject';
    return qSubj.toLowerCase() === activeSubjectName.toLowerCase();
  });
}

// SUBJECT NAVIGATION TABS
function setupSubjectTabs() {
  const container = document.getElementById('subjectTabButtons');
  if (!container) return;

  container.innerHTML = '';
  subjectNames.forEach(subj => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `subject-tab-btn ${subj === activeSubjectName ? 'active' : ''}`;
    btn.textContent = subj;
    btn.addEventListener('click', () => {
      activeSubjectName = subj;
      document.querySelectorAll('.subject-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      filterQuestionsBySubject();
      setupQuestionGrid();
      loadQuestion(0);
    });
    container.appendChild(btn);
  });
}

// QUESTIONS GRID
function setupQuestionGrid() {
  const grid = document.getElementById('questionsNavGrid');
  if (!grid) return;

  grid.innerHTML = '';
  filteredQuestions.forEach((q, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'grid-num-btn';
    btn.textContent = idx + 1;
    
    const qId = q._id || q.id;
    const isAnswered = answers[qId] != null;
    const isFlagged = flaggedQuestions.has(qId);
    
    if (idx === currentQuestionIndex) {
      btn.classList.add('state-current');
    }
    if (isAnswered && isFlagged) {
      btn.classList.add('state-flagged-answered');
    } else if (isAnswered) {
      btn.classList.add('state-answered');
    } else if (isFlagged) {
      btn.classList.add('state-flagged');
    }

    btn.addEventListener('click', () => {
      loadQuestion(idx);
    });

    grid.appendChild(btn);
  });
}

// LOAD CURRENT QUESTION CONTENT
function loadQuestion(index) {
  currentQuestionIndex = index;
  const question = filteredQuestions[index];
  if (!question) return;

  const qId = question._id || question.id;

  // Toggle active highlights
  document.querySelectorAll('.grid-num-btn').forEach((btn, bIdx) => {
    btn.classList.toggle('state-current', bIdx === index);
  });

  const subjectChip = document.getElementById('currentSubjectChip');
  if (subjectChip) subjectChip.textContent = activeSubjectName;

  const numEl = document.getElementById('currentQuestionNum');
  if (numEl) numEl.textContent = `Question ${index + 1} of ${filteredQuestions.length}`;

  const textEl = document.getElementById('questionText');
  if (textEl) textEl.innerHTML = question.question || question.text || '';

  // Render passage if present
  const passageBox = document.getElementById('passageBox');
  const passageText = document.getElementById('passageText');
  const passage = question.passage || question.passageText || '';
  if (passage) {
    passageBox.style.display = 'block';
    passageText.innerHTML = passage;
  } else {
    passageBox.style.display = 'none';
  }

  // Render option selections
  const optionsContainer = document.getElementById('optionsList');
  optionsContainer.innerHTML = '';

  const optionKeys = ['A', 'B', 'C', 'D'];
  const selectedAnswer = answers[qId];

  optionKeys.forEach(key => {
    const txt = getOptionText(question, key);
    if (!txt) return;

    const label = document.createElement('label');
    label.className = 'option-card-label';

    const isSelected = selectedAnswer === key;

    label.innerHTML = `
      <input type="radio" name="mockOption" value="${key}" ${isSelected ? 'checked' : ''}>
      <div class="option-indicator">${key}</div>
      <div class="option-text">${txt}</div>
    `;

    label.querySelector('input').addEventListener('change', () => {
      answers[qId] = key;
      updateProgressBar();
      setupQuestionGrid();
    });

    optionsContainer.appendChild(label);
  });

  document.getElementById('prevQuestionBtn').disabled = index === 0;
  document.getElementById('nextQuestionBtn').disabled = index === filteredQuestions.length - 1;

  // Toggle flag button styling
  const flagBtn = document.getElementById('flagQuestionBtn');
  if (flagBtn) {
    const isFlagged = flaggedQuestions.has(qId);
    flagBtn.className = isFlagged ? 'btn-secondary text-orange font-bold' : 'btn-secondary';
    flagBtn.innerHTML = isFlagged
      ? '<i class="ph-fill ph-flag"></i> Flagged'
      : '<i class="ph-bold ph-flag"></i> Flag Question';
  }
}

function getOptionText(question, key) {
  if (!question.options) return '';
  if (Array.isArray(question.options)) {
    const idx = key.charCodeAt(0) - 65;
    return question.options[idx] || '';
  }
  return question.options[key] || '';
}

// UPDATE PROGRESS BAR
function updateProgressBar() {
  const total = questions.length;
  const answered = Object.keys(answers).length;

  const pct = total > 0 ? (answered / total) * 100 : 0;
  const fill = document.getElementById('progressBarFill');
  if (fill) fill.style.width = `${pct}%`;

  const txt = document.getElementById('progressText');
  if (txt) txt.textContent = `${answered} / ${total} Completed`;
}

// ANTI CHEAT LOCKDOWNS & TABS DETECTION
function initAntiCheat() {
  // Hide fullscreen exit block initially
  const fsModal = document.getElementById('fullscreenRestoreModal');
  if (fsModal) fsModal.classList.remove('open');

  // Enforce fullscreen state check
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);

  // Tab switch detection (Page visibility)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      logVisibilityViolation('tab_switch');
    }
  });

  // Block context right-clicks
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Block copy/paste/select
  document.addEventListener('copy', (e) => e.preventDefault());
  document.addEventListener('paste', (e) => e.preventDefault());
  document.addEventListener('selectstart', (e) => e.preventDefault());

  // Block dev shortcuts
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.shiftKey && e.key === 'C') ||
      (e.ctrlKey && e.shiftKey && e.key === 'J') ||
      (e.ctrlKey && e.key === 'u') ||
      (e.ctrlKey && e.key === 'r') ||
      e.key === 'F5'
    ) {
      e.preventDefault();
      showToast('Shortcut locked for anti-cheat purposes.', 'warning');
    }
  });
}

function handleFullscreenChange() {
  const isFS = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
  const fsModal = document.getElementById('fullscreenRestoreModal');
  
  if (!isFS && !isSubmitting) {
    // Left fullscreen mode: pop blocking restore modal and log violation
    if (fsModal) fsModal.classList.add('open');
    logVisibilityViolation('fullscreen_exit');
  }
}

async function logVisibilityViolation(reason) {
  violationCount++;
  
  // Update UI warn statement
  const warnEl = document.getElementById('violationCountWarning');
  if (warnEl) {
    warnEl.textContent = `Visibilities lost: ${violationCount} of 3. Repeated tab switches submit the exam automatically.`;
  }

  showToast(`⚠️ Anti-Cheat Warning ${violationCount}/3: Leaving the exam environment is prohibited.`, 'error');

  try {
    await api.post(ENDPOINTS.SESSION_VISIBILITY, {
      sessionId: mockSessionId,
      visibilityState: 'hidden',
      reason: reason,
      violations: violationCount
    });
  } catch (err) {
    console.warn('Failed to sync visibility logs to server:', err);
  }

  // Force submit if violation count exceeds 3
  if (violationCount >= 3) {
    alert('Your mock exam is being auto-submitted due to repeated anti-cheat violations.');
    submitExam();
  }
}

// BIND DOM EVENT HANDLERS
function bindEvents() {
  document.getElementById('prevQuestionBtn').addEventListener('click', () => {
    if (currentQuestionIndex > 0) loadQuestion(currentQuestionIndex - 1);
  });

  document.getElementById('nextQuestionBtn').addEventListener('click', () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) loadQuestion(currentQuestionIndex + 1);
  });

  document.getElementById('flagQuestionBtn').addEventListener('click', () => {
    const q = filteredQuestions[currentQuestionIndex];
    const qId = q._id || q.id;
    if (flaggedQuestions.has(qId)) {
      flaggedQuestions.delete(qId);
    } else {
      flaggedQuestions.add(qId);
    }
    loadQuestion(currentQuestionIndex);
    setupQuestionGrid();
  });

  // Modal resume buttons
  document.getElementById('restoreFullscreenBtn').addEventListener('click', async () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      }
      
      const fsModal = document.getElementById('fullscreenRestoreModal');
      if (fsModal) fsModal.classList.remove('open');
    } catch {
      showToast('Could not resume fullscreen. Click inside page body and try again.', 'error');
    }
  });

  document.getElementById('exitExamBtn').addEventListener('click', () => {
    if (confirm('Quit mock exam? This session will be scored zero.')) {
      exitFullscreenQuietly();
      window.location.href = '/pages/mock-tests.html';
    }
  });

  document.getElementById('quitExamBtn').addEventListener('click', () => {
    if (confirm('Quit exam? Your current questions will be submitted as-is.')) {
      submitExam();
    }
  });

  document.getElementById('submitExamBtn').addEventListener('click', () => {
    const total = questions.length;
    const answered = Object.keys(answers).length;
    if (confirm(`Submit your mock exam? You've answered ${answered} of ${total} questions. This action is final.`)) {
      submitExam();
    }
  });
}

// SUBMIT EXAM
function handleTimeOutSubmit() {
  showToast('Time allowed elapsed! Auto-submitting mock exam...', 'warning');
  setTimeout(() => {
    submitExam();
  }, 2000);
}

async function submitExam() {
  if (isSubmitting) return;
  isSubmitting = true;
  clearInterval(timerInterval);

  const btn = document.getElementById('submitExamBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Submitting...';
  }

  // Format answers payload
  const formattedAnswers = Object.keys(answers).map(qId => ({
    questionId: qId,
    selectedOption: answers[qId]
  }));

  try {
    const res = await api.post(ENDPOINTS.MOCK_SUBMIT, {
      sessionId: mockSessionId,
      answers: formattedAnswers
    });

    const data = res.data ?? res;
    sessionStorage.setItem('review_mock_session_id', mockSessionId);
    sessionStorage.setItem('review_mock_results', JSON.stringify(data));

    exitFullscreenQuietly();
    window.location.href = '/pages/mock-result.html';

  } catch (err) {
    showToast('Submit failed. Reviewing offline backup...', 'error');
    const localResult = generateLocalMockResultSummary();
    sessionStorage.setItem('review_mock_session_id', mockSessionId);
    sessionStorage.setItem('review_mock_results', JSON.stringify(localResult));
    
    setTimeout(() => {
      exitFullscreenQuietly();
      window.location.href = '/pages/mock-result.html';
    }, 1500);
  }
}

function generateLocalMockResultSummary() {
  let correctCount = 0;
  questions.forEach(q => {
    const qId = q._id || q.id;
    if (answers[qId] && isAnswerCorrect(q, answers[qId])) {
      correctCount++;
    }
  });

  const total = questions.length;
  const scorePercent = total > 0 ? (correctCount / total) : 0;
  const compositeScore = Math.round(scorePercent * 400);

  return {
    sessionId: mockSessionId,
    compositeScore: compositeScore,
    totalQuestions: total,
    correctCount: correctCount,
    subjectScores: subjectNames.map(subj => {
      const subjQs = questions.filter(q => (q.subjectName || q.subject?.name || '').toLowerCase() === subj.toLowerCase());
      let c = 0;
      subjQs.forEach(q => {
        const qId = q._id || q.id;
        if (answers[qId] && isAnswerCorrect(q, answers[qId])) c++;
      });
      return {
        subjectName: subj,
        correct: c,
        total: subjQs.length,
        score: subjQs.length > 0 ? Math.round((c / subjQs.length) * 100) : 0
      };
    }),
    answers: answers,
    questions: questions
  };
}

function isAnswerCorrect(question, selectedKey) {
  const correct = question.correctOption || question.answer || '';
  if (typeof correct === 'number') {
    return selectedKey === String.fromCharCode(65 + correct);
  }
  return String(selectedKey).toUpperCase() === String(correct).toUpperCase();
}

function exitFullscreenQuietly() {
  try {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  } catch {
    // bypass
  }
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
