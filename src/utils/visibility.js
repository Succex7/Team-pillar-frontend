/* Tab-switch detection */
let violations = 0;

export function initTabDetection(onViolation) {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      violations++;
      onViolation(violations);
    }
  });
}

export function getViolations() {
  return violations;
}

export function resetViolations() {
  violations = 0;
}