// src/scripts/session-result.js
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
    'study-session',
    'Session Results',
    'Review your answers and performance analytics'
  );

  sessionId = sessionStorage.getItem('review_session_id');
  if (!sessionId) {
    showToast('No session ID found. Redirecting to dashboard...', 'error');
    setTimeout(() => {
      window.location.href = '/pages/dashboard.html';
    }, 1500);
    return;
  }

  await loadResults();
}

async function loadResults() {
  try {
    // Attempt to load detailed analytics from backend
    const res = await api.get(ENDPOINTS.SESSION_RESULT(sessionId));
    resultData = res.data ?? res;
  } catch (err) {
    console.warn('Backend results fetch failed, reading fallback storage:', err);
    // Read fallback storage if offline or backend route is missing
    const fallbackStr = sessionStorage.getItem('review_session_results');
    if (fallbackStr) {
      try {
        resultData = JSON.parse(fallbackStr);
      } catch {
        resultData = null;
      }
    }
  }

  if (!resultData) {
    showToast('Could not load session results.', 'error');
    return;
  }

  renderResults();
}

function renderResults() {
  const total = resultData.totalQuestions ?? resultData.questions?.length ?? 0;
  const correct = resultData.correctCount ?? 0;
  const incorrect = resultData.incorrectCount ?? (total - correct);
  const accuracy = resultData.score ?? (total > 0 ? Math.round((correct / total) * 100) : 0);
  const timeSpent = resultData.timeSpent || '15m 30s'; // default fallback

  // Update text counts
  document.getElementById('scorePctText').textContent = `${accuracy}%`;
  document.getElementById('correctCountText').textContent = correct;
  document.getElementById('incorrectCountText').textContent = incorrect;
  document.getElementById('totalQuestionsText').textContent = total;
  document.getElementById('timeSpentText').textContent = timeSpent;

  // Update Score circular progress ring
  const circle = document.getElementById('resultsCircle');
  if (circle) {
    const circumference = 2 * Math.PI * 60; // ~377
    const offset = circumference - (accuracy / 100) * circumference;
    circle.style.strokeDashoffset = offset;
  }

  // Render AI Performance Review (PRO Lock Check)
  renderAiInsights(accuracy);

  // Render Question review list
  renderQuestionReview();
}

function renderAiInsights(accuracy) {
  const container = document.getElementById('aiInsightsContent');
  if (!container) return;

  container.innerHTML = '';

  if (!isProUser) {
    // Render blurred Pro lock card
    const lockEl = document.createElement('div');
    lockEl.className = 'ai-insights-locked';
    lockEl.innerHTML = `
      <div class="lock-blur-overlay">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lock-icon">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <p class="lock-title">Deep AI Performance Analysis — Pro Only</p>
        <p class="lock-desc">Unlock detailed suggestions on your weak topics, learning gaps, and speed breakdown.</p>
        <button type="button" class="upgrade-insights-btn" id="resultsUpgradeBtn">Upgrade to Pro →</button>
      </div>
    `;
    container.appendChild(lockEl);
    
    document.getElementById('resultsUpgradeBtn')?.addEventListener('click', () => {
      window.location.href = '/pages/billing.html';
    });
  } else {
    // Display Pro Insights
    const tips = generateDynamicProTips(accuracy);
    const list = document.createElement('ul');
    list.style.paddingLeft = '20px';
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '8px';

    tips.forEach(tip => {
      const li = document.createElement('li');
      li.innerHTML = tip;
      list.appendChild(li);
    });

    container.appendChild(list);
  }
}

function generateDynamicProTips(accuracy) {
  const incorrectList = [];
  const questionsList = resultData.questions ?? [];
  const userAnswers = resultData.answers ?? {};

  questionsList.forEach(q => {
    const qId = q._id || q.id;
    const ans = userAnswers[qId];
    if (ans && !isAnswerCorrect(q, ans)) {
      incorrectList.push(q.subjectName || q.subject?.name || 'Unknown');
    }
  });

  // Extract most missed subjects
  const missedCounts = {};
  incorrectList.forEach(subj => {
    missedCounts[subj] = (missedCounts[subj] || 0) + 1;
  });

  const sortedMissed = Object.keys(missedCounts).sort((a, b) => missedCounts[b] - missedCounts[a]);

  const tips = [];
  if (accuracy >= 80) {
    tips.push('🏆 **Excellent accuracy!** You demonstrated a strong understanding of the tested concepts.');
    tips.push('⚡ Pro Tip: Work on reducing your average time per question to build a safety buffer for the main exam.');
  } else if (accuracy >= 60) {
    tips.push('📈 **Good progress.** You have core foundations down, but minor errors kept your accuracy under 80%.');
  } else {
    tips.push('⚠️ **Needs focus.** Your accuracy is currently low. Focus on studying specific topics before practicing again.');
  }

  if (sortedMissed.length > 0) {
    tips.push(`🔍 Highlight Area: You missed multiple questions in **${sortedMissed[0]}**. Make sure to review the topic lecture sheets.`);
  }

  return tips;
}

// RENDER DETAILED QUESTION LIST FOR REVIEW
function renderQuestionReview() {
  const container = document.getElementById('questionReviewList');
  if (!container) return;

  container.innerHTML = '';

  const questionsList = resultData.questions ?? [];
  const userAnswers = resultData.answers ?? {};

  if (questionsList.length === 0) {
    container.innerHTML = '<div class="loading-placeholder">No question details available.</div>';
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
        <!-- Render 4 options -->
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

// OPTION HELPERS
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
    const correctChar = String.fromCharCode(65 + correct);
    return selectedKey === correctChar;
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
