// Exam integrity protection utilities

let violations = 0;
const MAX_VIOLATIONS = 3;

//Tab / Window Switch Detection 
export function initTabDetection(onViolation) {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      violations++;
      logViolation('TAB_SWITCH');
      onViolation(violations, 'TAB_SWITCH');
    }
  });

  window.addEventListener('blur', () => {
    violations++;
    logViolation('WINDOW_BLUR');
    onViolation(violations, 'WINDOW_BLUR');
  });
}

//Fullscreen Enforcement 
export function requestFullscreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen();
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
}

export function initFullscreenDetection(onExit) {
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      logViolation('FULLSCREEN_EXIT');
      onExit();
    }
  });
}

//Disable Right-Click
export function disableRightClick() {
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}

//Disable Dangerous Keyboard Shortcuts
export function disableKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    const blocked = [
      e.ctrlKey && e.key === 'c',           // Ctrl+C (copy)
      e.ctrlKey && e.key === 'v',           // Ctrl+V (paste)
      e.ctrlKey && e.key === 'p',           // Ctrl+P (print)
      e.ctrlKey && e.key === 's',           // Ctrl+S (save)
      e.ctrlKey && e.key === 'u',           // Ctrl+U (view source)
      e.ctrlKey && e.shiftKey && e.key === 'i', // Ctrl+Shift+I (devtools)
      e.ctrlKey && e.shiftKey && e.key === 'j', // Ctrl+Shift+J (console)
      e.key === 'F12',                      // F12 (devtools)
      e.key === 'PrintScreen',              // Print Screen key
    ];

    if (blocked.some(Boolean)) {
      e.preventDefault();
      logViolation('KEYBOARD_SHORTCUT');
    }
  });
}

//Blur Content on Tab Switch
export function initContentBlur(contentId) {
  const content = document.getElementById(contentId);
  if (!content) return;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      content.style.filter = 'blur(8px)';
    } else {
      content.style.filter = 'none';
    }
  });
}

//Watermark with User ID 
export function addWatermark(userId) {
  const watermark = document.createElement('div');
  watermark.id = 'exam-watermark';
  watermark.textContent = `ID: ${userId} | UTME Prep`;
  watermark.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 14px;
    color: rgba(0,0,0,0.06);
    pointer-events: none;
    z-index: 9999;
    white-space: nowrap;
    font-weight: bold;
    letter-spacing: 2px;
    user-select: none;
  `;
  document.body.appendChild(watermark);
}

//Disable Text Selection 
export function disableTextSelection() {
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
}

//Violation Logger
function logViolation(type) {
  const existing = JSON.parse(localStorage.getItem('exam_violations') || '[]');
  existing.push({ type, timestamp: new Date().toISOString() });
  localStorage.setItem('exam_violations', JSON.stringify(existing));
  console.warn(`[ANTI-CHEAT] Violation logged: ${type} (Total: ${violations})`);
}

export function getViolations() {
  return JSON.parse(localStorage.getItem('exam_violations') || '[]');
}

export function clearViolations() {
  localStorage.removeItem('exam_violations');
  violations = 0;
}

export function getViolationCount() {
  return violations;
}