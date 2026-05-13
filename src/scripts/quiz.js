import {
  initTabDetection,
  initFullscreenDetection,
  requestFullscreen,
  disableRightClick,
  disableKeyboardShortcuts,
  initContentBlur,
  addWatermark,
  disableTextSelection,
  getViolationCount
} from '../utils/antiCheat.js';

// Call these when quiz page loads
const userId = localStorage.getItem('user_id') || 'UNKNOWN';

requestFullscreen();                    // Go fullscreen on exam start
disableRightClick();                    // No right-click
disableKeyboardShortcuts();             // Block Ctrl+C, F12, PrintScreen etc.
disableTextSelection();                 // Can't select/copy text
addWatermark(userId);                   // Watermark with user ID
initContentBlur('quiz-root');           // Blur content if tab switched

initTabDetection((count, type) => {
  showViolationWarning(count, type);
  if (count >= 3) autoSubmitExam();     // Auto-submit after 3 violations
});

initFullscreenDetection(() => {
  // Prompt to re-enter fullscreen
  showFullscreenWarning();
});

function showViolationWarning(count, type) {
  alert(`⚠️ Warning ${count}/3: Leaving the exam tab is not allowed. Repeated violations will auto-submit your exam.`);
}

function showFullscreenWarning() {
  alert('⚠️ Please return to fullscreen mode to continue your exam.');
  requestFullscreen();
}

function autoSubmitExam() {
  alert('Your exam has been auto-submitted due to repeated violations.');
  // Call submit logic here
  window.location.href = '/pages/results.html';
}