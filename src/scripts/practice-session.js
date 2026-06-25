// src/scripts/practice-session.js
import { api }       from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';

let activeSessionId = '';
let activeMode = 'practice'; // 'practice' or 'cbt'
let duration = 30; // duration in minutes
let questions = [];
let subjectNames = [];
let activeTopic = '';

let currentQuestionIndex = 0;
let answers = {}; // questionId -> selectedOption ('A', 'B', 'C', 'D')
let flaggedQuestions = new Set();
let checkedQuestions = new Set(); // Practice mode: which questions have been checked

let timerInterval = null;
let timeRemaining = 0; // seconds (for CBT)
let timeElapsed = 0; // seconds (for Practice)

let activeSubjectName = ''; // Subject filter key
let filteredQuestions = []; // Questions filtered by subject

let chatHistory = [];

async function init() {
  activeSessionId = sessionStorage.getItem('active_session_id');
  activeMode = sessionStorage.getItem('active_session_mode') || 'practice';
  duration = parseInt(sessionStorage.getItem('active_session_duration') || '30');
  activeTopic = sessionStorage.getItem('active_session_topic') || '';
  
  try {
    questions = JSON.parse(sessionStorage.getItem('active_session_questions') || '[]');
    subjectNames = JSON.parse(sessionStorage.getItem('active_session_subjects') || '[]');
  } catch {
    questions = [];
    subjectNames = [];
  }

  if (!activeSessionId || questions.length === 0) {
    showToast('No active session found. Redirecting...', 'error');
    setTimeout(() => {
      window.location.href = '/pages/study-session.html';
    }, 1500);
    return;
  }

  // Setup UI badges and title
  const modeBadge = document.getElementById('sessionModeBadge');
  if (modeBadge) {
    modeBadge.textContent = activeMode === 'cbt' ? 'CBT Simulation' : 'Practice Mode';
    modeBadge.className = `session-badge ${activeMode === 'cbt' ? 'badge-cbt' : 'badge-practice'}`;
  }

  const titleEl = document.getElementById('sessionTitle');
  if (titleEl) {
    titleEl.textContent = activeTopic 
      ? `Study Session · ${activeTopic}`
      : `Study Session (${subjectNames.join(', ')})`;
  }

  // Group questions by subject name and select first subject
  if (questions.length > 0) {
    // Extract actual subjects in the question list if empty in storage
    const uniqueSubjectsInList = [...new Set(questions.map(q => q.subjectName || q.subject?.name || 'Subject'))];
    if (subjectNames.length === 0) {
      subjectNames = uniqueSubjectsInList;
    }
    activeSubjectName = subjectNames[0];
  }

  setupSubjectTabs();
  filterQuestionsBySubject();
  setupQuestionGrid();
  startTimer();
  loadQuestion(0);
  bindEvents();
}

// TIMERS
function startTimer() {
  const display = document.getElementById('timerText');
  if (!display) return;

  if (activeMode === 'cbt') {
    timeRemaining = duration * 60;
    timerInterval = setInterval(() => {
      timeRemaining--;
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        timeRemaining = 0;
        display.textContent = '00:00';
        handleAutoSubmit();
      } else {
        const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
        const s = (timeRemaining % 60).toString().padStart(2, '0');
        display.textContent = `${m}:${s}`;
      }
    }, 1000);
  } else {
    timeElapsed = 0;
    timerInterval = setInterval(() => {
      timeElapsed++;
      const m = Math.floor(timeElapsed / 60).toString().padStart(2, '0');
      const s = (timeElapsed % 60).toString().padStart(2, '0');
      display.textContent = `${m}:${s}`;
    }, 1000);
  }
}

// FILTER QUESTIONS BY ACTIVE SUBJECT TAB
function filterQuestionsBySubject() {
  filteredQuestions = questions.filter(q => {
    const qSubj = q.subjectName || q.subject?.name || 'Subject';
    return qSubj.toLowerCase() === activeSubjectName.toLowerCase();
  });
}

// SETUP SUBJECT TAB BUTTONS
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
      // Update active styling
      document.querySelectorAll('.subject-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      filterQuestionsBySubject();
      setupQuestionGrid();
      loadQuestion(0);
    });
    container.appendChild(btn);
  });
}

// QUESTION GRID PANEL
function setupQuestionGrid() {
  const grid = document.getElementById('questionsNavGrid');
  if (!grid) return;

  grid.innerHTML = '';
  filteredQuestions.forEach((q, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'grid-num-btn';
    btn.textContent = idx + 1;
    
    // Set appropriate color classes
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

// OPTION SELECTORS AND PASSAGES RENDERING
function getOptionText(question, key) {
  if (!question.options) return '';
  if (Array.isArray(question.options)) {
    const idx = key.charCodeAt(0) - 65; // A=0, B=1...
    return question.options[idx] || '';
  }
  return question.options[key] || '';
}

function isAnswerCorrect(question, selectedKey) {
  const correct = question.correctOption || question.answer || '';
  if (typeof correct === 'number') {
    const correctKey = String.fromCharCode(65 + correct);
    return selectedKey === correctKey;
  }
  return String(selectedKey).toUpperCase() === String(correct).toUpperCase();
}

function getCorrectOptionChar(question) {
  const correct = question.correctOption || question.answer || '';
  if (typeof correct === 'number') {
    return String.fromCharCode(65 + correct);
  }
  return String(correct).toUpperCase();
}

function loadQuestion(index) {
  currentQuestionIndex = index;
  const question = filteredQuestions[index];
  if (!question) return;

  const qId = question._id || question.id;

  // Toggle buttons highlight
  document.querySelectorAll('.grid-num-btn').forEach((btn, bIdx) => {
    btn.classList.toggle('state-current', bIdx === index);
  });

  // Render subject and index labels
  const subjectChip = document.getElementById('currentSubjectChip');
  if (subjectChip) subjectChip.textContent = activeSubjectName;

  const numEl = document.getElementById('currentQuestionNum');
  if (numEl) numEl.textContent = `Question ${index + 1} of ${filteredQuestions.length}`;

  // Render question text
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

  // Render options list
  const optionsContainer = document.getElementById('optionsList');
  optionsContainer.innerHTML = '';

  const optionKeys = ['A', 'B', 'C', 'D'];
  const hasChecked = checkedQuestions.has(qId);
  const selectedAnswer = answers[qId];

  optionKeys.forEach(key => {
    const txt = getOptionText(question, key);
    if (!txt) return;

    const label = document.createElement('label');
    label.className = 'option-card-label';

    const isSelected = selectedAnswer === key;
    const isCorrect = getCorrectOptionChar(question) === key;

    // Apply color highlights if answer is already checked (Practice Mode only)
    if (activeMode === 'practice' && hasChecked) {
      if (isCorrect) {
        label.classList.add('option-correct');
      } else if (isSelected) {
        label.classList.add('option-incorrect');
      }
    }

    label.innerHTML = `
      <input type="radio" name="questionOption" value="${key}" ${isSelected ? 'checked' : ''} ${activeMode === 'practice' && hasChecked ? 'disabled' : ''}>
      <div class="option-indicator">${key}</div>
      <div class="option-text">${txt}</div>
    `;

    // Only allow selection if not already checked in practice mode
    if (activeMode === 'cbt' || !hasChecked) {
      label.querySelector('input').addEventListener('change', () => {
        answers[qId] = key;
        updateProgressBar();
        setupQuestionGrid();
        
        // Show/hide CBT vs Practice buttons
        if (activeMode === 'practice') {
          document.getElementById('checkAnswerBtn').style.display = 'block';
        }
      });
    }

    optionsContainer.appendChild(label);
  });

  // Setup Button Actions states
  const checkBtn = document.getElementById('checkAnswerBtn');
  const explainBtn = document.getElementById('aiExplainBtn');
  const feedbackCard = document.getElementById('instantFeedbackCard');
  
  if (activeMode === 'practice') {
    if (selectedAnswer && !hasChecked) {
      checkBtn.style.display = 'block';
      explainBtn.style.display = 'none';
      feedbackCard.style.display = 'none';
    } else if (hasChecked) {
      checkBtn.style.display = 'none';
      explainBtn.style.display = 'block';
      
      // Render instant feedback explanation
      const isCorrect = isAnswerCorrect(question, selectedAnswer);
      const feedbackStatus = document.getElementById('feedbackStatus');
      const feedbackText = document.getElementById('explanationText');
      
      feedbackCard.style.display = 'block';
      feedbackCard.className = `instant-feedback-card ${isCorrect ? 'correct' : 'incorrect'}`;
      
      feedbackStatus.className = `feedback-status ${isCorrect ? 'correct' : 'incorrect'}`;
      feedbackStatus.innerHTML = isCorrect
        ? '<i class="ph-fill ph-check-circle"></i> Correct! Well done.'
        : `<i class="ph-fill ph-x-circle"></i> Incorrect. The correct answer is ${getCorrectOptionChar(question)}.`;
        
      feedbackText.textContent = question.explanation || 'No immediate explanation available. Ask the AI Tutor for details.';
    } else {
      checkBtn.style.display = 'none';
      explainBtn.style.display = 'none';
      feedbackCard.style.display = 'none';
    }
  } else {
    // CBT mode never shows check or explain button inside cards
    checkBtn.style.display = 'none';
    explainBtn.style.display = 'none';
    feedbackCard.style.display = 'none';
  }

  // Prev/Next disable controls
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

// UPDATE PROGRESS BAR
function updateProgressBar() {
  const totalQuestionsCount = questions.length;
  const answeredCount = Object.keys(answers).length;

  const pct = totalQuestionsCount > 0 ? (answeredCount / totalQuestionsCount) * 100 : 0;
  const fill = document.getElementById('progressBarFill');
  if (fill) fill.style.width = `${pct}%`;

  const txt = document.getElementById('progressText');
  if (txt) txt.textContent = `${answeredCount} / ${totalQuestionsCount} Completed`;
}

// BIND DOM INTERACTS
function bindEvents() {
  // Navigation buttons
  document.getElementById('prevQuestionBtn').addEventListener('click', () => {
    if (currentQuestionIndex > 0) loadQuestion(currentQuestionIndex - 1);
  });

  document.getElementById('nextQuestionBtn').addEventListener('click', () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) loadQuestion(currentQuestionIndex + 1);
  });

  // Flag button
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

  // Check Answer button (Practice Mode)
  document.getElementById('checkAnswerBtn').addEventListener('click', () => {
    const q = filteredQuestions[currentQuestionIndex];
    const qId = q._id || q.id;
    checkedQuestions.add(qId);
    loadQuestion(currentQuestionIndex);
  });

  // Ask AI Explain button (Practice Mode)
  document.getElementById('aiExplainBtn').addEventListener('click', openAiTutorDrawer);

  // Close AI Drawer
  document.getElementById('closeDrawerBtn').addEventListener('click', closeAiTutorDrawer);

  // AI Chat Submit Form
  document.getElementById('drawerInputForm').addEventListener('submit', handleAiChatSubmit);

  // Submit button
  document.getElementById('submitSessionBtn').addEventListener('click', confirmSubmitSession);

  // Quit button
  document.getElementById('quitSessionBtn').addEventListener('click', confirmQuitSession);
}

// AI CHAT DRAWER LOGIC
function openAiTutorDrawer() {
  const drawer = document.getElementById('aiChatDrawer');
  if (drawer) drawer.classList.add('open');
  
  // Send first trigger response explanation
  const question = filteredQuestions[currentQuestionIndex];
  initializeAiExplanation(question);
}

function closeAiTutorDrawer() {
  const drawer = document.getElementById('aiChatDrawer');
  if (drawer) drawer.classList.remove('open');
}

async function initializeAiExplanation(question) {
  const chatArea = document.getElementById('drawerChatArea');
  chatArea.innerHTML = '<div class="loading-placeholder"><span class="btn-spinner"></span> Synthesising explanation...</div>';

  chatHistory = [];
  
  try {
    const qId = question._id || question.id;
    const res = await api.post(ENDPOINTS.AI_EXPLAIN, {
      questionId: qId,
      question: question.question || question.text,
      options: question.options,
      correctAnswer: getCorrectOptionChar(question),
      selectedAnswer: answers[qId] || ''
    });

    const explanation = res.explanation ?? res.data?.explanation ?? res.text ?? '';
    
    chatArea.innerHTML = '';
    appendChatMessage('ai', explanation || question.explanation || 'Sorry, I could not generate a custom explanation. Please let me know how I can clarify the concepts!');
  } catch {
    // Fallback if AI down
    chatArea.innerHTML = '';
    appendChatMessage('ai', `**Explanation of Answer:**\n\n${question.explanation || 'No offline explanation is set. Ask me a specific follow-up question below!'}`);
  }
}

async function handleAiChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('drawerChatInput');
  const message = input.value.trim();
  if (!message) return;

  appendChatMessage('user', message);
  input.value = '';

  // Append typing indicator
  const chatArea = document.getElementById('drawerChatArea');
  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.id = 'typingIndicator';
  indicator.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
  chatArea.appendChild(indicator);
  chatArea.scrollTop = chatArea.scrollHeight;

  const question = filteredQuestions[currentQuestionIndex];
  const qId = question._id || question.id;

  try {
    const response = await api.post(ENDPOINTS.AI_CHAT, {
      message: message,
      questionId: qId,
      history: chatHistory
    });

    document.getElementById('typingIndicator')?.remove();
    const reply = response.reply ?? response.data?.reply ?? response.message ?? 'I see. How else can I help?';
    appendChatMessage('ai', reply);
  } catch {
    document.getElementById('typingIndicator')?.remove();
    appendChatMessage('ai', "I'm experiencing connectivity issues reaching the AI core. Let's re-try in a second!");
  }
}

function appendChatMessage(sender, text) {
  const chatArea = document.getElementById('drawerChatArea');
  if (!chatArea) return;

  const bubble = document.createElement('div');
  bubble.className = `ai-chat-message message-${sender}`;
  bubble.textContent = text;
  chatArea.appendChild(bubble);

  chatHistory.push({ sender, text });
  chatArea.scrollTop = chatArea.scrollHeight;
}

// SUBMIT SESSION
function confirmSubmitSession() {
  const total = questions.length;
  const answered = Object.keys(answers).length;
  
  const confirmed = confirm(`Are you sure you want to submit your session? You've answered ${answered} of ${total} questions.`);
  if (confirmed) {
    submitSession();
  }
}

function handleAutoSubmit() {
  showToast('Time is up! Submitting your answers automatically.', 'warning');
  setTimeout(() => {
    submitSession();
  }, 2000);
}

async function submitSession() {
  clearInterval(timerInterval);

  const btn = document.getElementById('submitSessionBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Submitting...';
  }

  // Format payload
  const formattedAnswers = Object.keys(answers).map(qId => ({
    questionId: qId,
    selectedOption: answers[qId]
  }));

  try {
    const res = await api.post(ENDPOINTS.SESSION_SUBMIT, {
      sessionId: activeSessionId,
      answers: formattedAnswers
    });

    const data = res.data ?? res;
    sessionStorage.setItem('review_session_id', activeSessionId);
    sessionStorage.setItem('review_session_results', JSON.stringify(data));
    
    window.location.href = '/pages/session-result.html';
  } catch (err) {
    showToast('Failed to submit session. Storing offline review...', 'error');
    // Store local result fallback so the user does not lose progress
    const mockResult = generateLocalResultSummary();
    sessionStorage.setItem('review_session_id', activeSessionId);
    sessionStorage.setItem('review_session_results', JSON.stringify(mockResult));
    setTimeout(() => {
      window.location.href = '/pages/session-result.html';
    }, 1500);
  }
}

function generateLocalResultSummary() {
  // Generate a client-side summary if API fails to submit
  let correctCount = 0;
  questions.forEach(q => {
    const qId = q._id || q.id;
    if (answers[qId] && isAnswerCorrect(q, answers[qId])) {
      correctCount++;
    }
  });

  const total = questions.length;
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return {
    sessionId: activeSessionId,
    score: score,
    totalQuestions: total,
    correctCount: correctCount,
    incorrectCount: total - correctCount,
    answers: answers,
    questions: questions
  };
}

function confirmQuitSession() {
  if (confirm('Are you sure you want to quit? Your current session progress will be lost.')) {
    clearInterval(timerInterval);
    window.location.href = '/pages/study-session.html';
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
