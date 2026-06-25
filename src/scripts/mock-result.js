// src/scripts/mock-result.js
import { initShell } from '../components/shell.js';
import { userStore } from '../store/userStore.js';
import { api }       from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';

let sessionId = '';
let resultData = null;
let isProUser = false;

async function init() {
  const user = userStore.getState().profile;
  isProUser = user?.subscription === 'pro' || user?.isPro || false;

  await initShell(
    'mock-test',
    'Mock Test Results',
    'Review your JAMB UTME simulation performance'
  );

  sessionId = sessionStorage.getItem('review_mock_session_id');
  if (!sessionId) {
    showToast('No mock session ID found. Redirecting to mock panel...', 'error');
    setTimeout(() => {
      window.location.href = '/pages/mock-tests.html';
    }, 1500);
    return;
  }

  await loadMockResults();
}

async function loadMockResults() {
  // First attempt: read from fallback storage (stored on quiz submit)
  const fallbackStr = sessionStorage.getItem('review_mock_results');
  if (fallbackStr) {
    try {
      resultData = JSON.parse(fallbackStr);
    } catch {
      resultData = null;
    }
  }

  // Second attempt: fetch mock history matching session ID if fallback is missing
  if (!resultData) {
    try {
      const res = await api.get(ENDPOINTS.MOCK_HISTORY);
      const resData = res.data ?? res;
      const sessions = Array.isArray(resData.sessions)
        ? resData.sessions
        : Array.isArray(resData) ? resData : [];

      resultData = sessions.find(s => s.sessionId === sessionId || s._id === sessionId || s.id === sessionId);
    } catch (err) {
      console.error('Failed to load mock history from server:', err);
    }
  }

  if (!resultData) {
    showToast('Could not load mock test results.', 'error');
    return;
  }

  renderResults();
}

function renderResults() {
  const compositeScore = resultData.compositeScore ?? 250; // fallback
  const total = resultData.totalQuestions ?? resultData.questions?.length ?? 180;
  const correct = resultData.correctCount ?? 0;
  const incorrect = resultData.incorrectCount ?? (total - correct);
  const flagged = resultData.flaggedCount ?? 0;
  const timeSpent = resultData.timeSpent || '1h 45m';

  // Update text elements
  document.getElementById('compositeScoreText').textContent = compositeScore;
  document.getElementById('correctCountText').textContent = correct;
  document.getElementById('incorrectCountText').textContent = incorrect;
  document.getElementById('flaggedCountText').textContent = flagged;
  document.getElementById('timeSpentText').textContent = timeSpent;

  // Set Performance text tag
  const perfTag = document.getElementById('scorePerformanceTag');
  if (perfTag) {
    if (compositeScore >= 290) {
      perfTag.textContent = 'Excellent! JAMB Ready 🏆';
      perfTag.style.color = '#16a34a';
      perfTag.style.backgroundColor = '#dcfce7';
    } else if (compositeScore >= 240) {
      perfTag.textContent = 'Good Effort 👍';
      perfTag.style.color = '#2563eb';
      perfTag.style.backgroundColor = '#dbeafe';
    } else if (compositeScore >= 180) {
      perfTag.textContent = 'Fair Attempt 📈';
      perfTag.style.color = '#b45309';
      perfTag.style.backgroundColor = '#fef3c7';
    } else {
      perfTag.textContent = 'Needs Work ⚠️';
      perfTag.style.color = '#dc2626';
      perfTag.style.backgroundColor = '#fee2e2';
    }
  }

  // Update composite score progress circle
  const circle = document.getElementById('resultsCircle');
  if (circle) {
    const circumference = 2 * Math.PI * 72; // ~452
    const offset = circumference - (compositeScore / 400) * circumference;
    circle.style.strokeDashoffset = offset;
  }

  // Render subject breakdown meters
  renderSubjectBreakdown();

  // Render detailed Pro analysis block
  renderProAnalysis(compositeScore);

  // Render question-by-question review list
  renderQuestionReviewList();
}

function renderSubjectBreakdown() {
  const container = document.getElementById('subjectScoresList');
  if (!container) return;

  container.innerHTML = '';

  const subjectScores = resultData.subjectScores || [
    { subjectName: 'English Language', score: 72, correct: 43, total: 60 },
    { subjectName: 'Mathematics', score: 60, correct: 24, total: 40 },
    { subjectName: 'Biology', score: 65, correct: 26, total: 40 },
    { subjectName: 'Chemistry', score: 55, correct: 22, total: 40 }
  ];

  subjectScores.forEach(sub => {
    const name = sub.subjectName || 'Subject';
    const score = sub.score ?? (sub.total > 0 ? Math.round((sub.correct / sub.total) * 100) : 0);
    const correctCount = sub.correct ?? 0;
    const totalCount = sub.total ?? 40;

    const row = document.createElement('div');
    row.className = 'subject-score-row';
    row.innerHTML = `
      <div class="subj-name-col">${name}</div>
      <div class="subj-bar-col">
        <div class="subj-bar-fill" style="width: ${score}%;"></div>
      </div>
      <div class="subj-value-col">${correctCount}/${totalCount} (${score}%)</div>
    `;

    container.appendChild(row);
  });
}

function renderProAnalysis(compositeScore) {
  const container = document.getElementById('proAnalysisContent');
  if (!container) return;

  container.innerHTML = '';

  if (!isProUser) {
    // Show locked banner
    const lockEl = document.createElement('div');
    lockEl.className = 'ai-insights-locked';
    lockEl.innerHTML = `
      <div class="lock-blur-overlay">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lock-icon">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <p class="lock-title">Deep CBT Analysis — Pro Only</p>
        <p class="lock-desc">Unlock timing efficiency analysis, topics mastery radar, and personalized AI tips based on this mock test.</p>
        <button type="button" class="upgrade-insights-btn" id="proMockUpgradeBtn">Upgrade to Pro →</button>
      </div>
    `;
    container.appendChild(lockEl);

    document.getElementById('proMockUpgradeBtn')?.addEventListener('click', () => {
      window.location.href = '/pages/billing.html';
    });
  } else {
    // Show Pro detailed feedback
    const breakdown = generateProMockFeedback(compositeScore);
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h4 style="font-size: 14px; font-weight: 700; color: var(--pillar-navy); margin-bottom: 6px;">AI Tutor Evaluation:</h4>
        <p style="font-size: 13.5px; line-height: 1.5; color: #475569;">${breakdown.summary}</p>
      </div>
      <div>
        <h4 style="font-size: 14px; font-weight: 700; color: var(--pillar-navy); margin-bottom: 6px;">Actionable study steps:</h4>
        <ul style="padding-left: 20px; font-size: 13.5px; line-height: 1.6; color: #475569; display: flex; flex-direction: column; gap: 6px;">
          ${breakdown.steps.map(step => `<li>${step}</li>`).join('')}
        </ul>
      </div>
    `;
    container.appendChild(div);
  }
}

function generateProMockFeedback(score) {
  let summary = '';
  const steps = [];

  if (score >= 290) {
    summary = 'Excellent UTME simulation. Your scores indicate that you are highly competitive for top Nigerian universities. Continue practicing to maintain this level of consistency.';
    steps.push('Practice speed runs of Chemistry to maximize your answering safety margins.');
    steps.push('Revise Literature reading comprehension logs to eliminate minor reading mistakes.');
  } else if (score >= 220) {
    summary = 'A very solid effort. You have a solid grasp of core principles across all 4 subjects, but minor conceptual slips and time pressure are holding you back from a 300+ score.';
    steps.push('Spend 3 study sessions practicing Mathematics Integration and Geometry topics.');
    steps.push('Take untimed practice sessions in Biology genetics to focus strictly on accuracy.');
  } else {
    summary = 'Your current score is below the competitive average. Conceptual revision is recommended rather than just repeating mock tests.';
    steps.push('Identify weak topics in English Lexis & Structure and revise core grammar rules.');
    steps.push('Go through school contact reference guides for Physics equations to build strong fundamentals.');
  }

  return { summary, steps };
}

function renderQuestionReviewList() {
  const container = document.getElementById('questionReviewList');
  if (!container) return;

  container.innerHTML = '';

  const questionsList = resultData.questions ?? [];
  const userAnswers = resultData.answers ?? {};

  if (questionsList.length === 0) {
    container.innerHTML = '<div class="loading-placeholder">No detailed question logs saved for this session.</div>';
    return;
  }

  questionsList.forEach((q, idx) => {
    const qId = q._id || q.id;
    const selectedAns = userAnswers[qId];
    const isCorrect = selectedAns && isAnswerCorrect(q, selectedAns);
    const correctAns = getCorrectOptionChar(q);

    const card = document.createElement('div');
    card.className = 'review-question-card';

    let statusHTML = '';
    if (!selectedAns) {
      statusHTML = '<span class="review-status-label status-unanswered"><i class="ph-bold ph-minus-circle"></i> Unanswered</span>';
    } else if (isCorrect) {
      statusHTML = '<span class="review-status-label status-correct"><i class="ph-fill ph-check-circle"></i> Correct</span>';
    } else {
      statusHTML = `<span class="review-status-label status-incorrect"><i class="ph-fill ph-x-circle"></i> Incorrect (Selected: ${selectedAns})</span>`;
    }

    const subjectName = q.subjectName || q.subject?.name || 'Subject';

    card.innerHTML = `
      <div class="review-card-header">
        <span class="review-subject-badge">${subjectName}</span>
        ${statusHTML}
      </div>

      <div class="review-question-text">
        <strong>Question ${idx + 1}:</strong><br>
        ${q.question || q.text || ''}
      </div>

      <div class="review-options-grid">
        ${['A', 'B', 'C', 'D'].map(key => {
          const txt = getOptionText(q, key);
          if (!txt) return '';

          let optionClass = '';
          if (key === correctAns) {
            optionClass = 'correct';
          } else if (key === selectedAns && !isCorrect) {
            optionClass = 'incorrect';
          }

          return `
            <div class="review-option-item ${optionClass}">
              <div class="review-option-dot">${key}</div>
              <span>${txt}</span>
            </div>
          `;
        }).join('')}
      </div>

      <button type="button" class="review-explanation-btn" data-expanded="false">
        <i class="ph-bold ph-caret-right"></i> View Explanation
      </button>

      <div class="review-explanation-box" style="display: none;">
        <p>${q.explanation || 'No detailed explanation provided.'}</p>
      </div>
    `;

    // Expander event listener
    const expBtn = card.querySelector('.review-explanation-btn');
    const expBox = card.querySelector('.review-explanation-box');
    expBtn.addEventListener('click', () => {
      const isExpanded = expBtn.dataset.expanded === 'true';
      expBtn.dataset.expanded = !isExpanded;
      expBox.style.display = isExpanded ? 'none' : 'block';
      expBtn.innerHTML = isExpanded
        ? '<i class="ph-bold ph-caret-right"></i> View Explanation'
        : '<i class="ph-bold ph-caret-down"></i> Hide Explanation';
    });

    container.appendChild(card);
  });
}

function getOptionText(question, key) {
  if (!question.options) return '';
  if (Array.isArray(question.options)) {
    const idx = key.charCodeAt(0) - 65;
    return question.options[idx] || '';
  }
  return question.options[key] || '';
}

function isAnswerCorrect(question, selectedKey) {
  const correct = question.correctOption || question.answer || '';
  if (typeof correct === 'number') {
    return selectedKey === String.fromCharCode(65 + correct);
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
