// Onboarding Step 2 — Set Your Aim (Target Score)
// DATA 

const SCORE_TIERS = [
  {
    min:   150,
    max:   199,
    title: 'Below Average',
    desc:  'This score range is below the national average. With the right study plan, you can significantly improve before your exam.',
  },
  {
    min:   200,
    max:   249,
    title: 'Average Tier',
    desc:  'You\'re aiming at the average range. This qualifies you for many courses — a focused study plan can push you higher.',
  },
  {
    min:   250,
    max:   299,
    title: 'Above Average',
    desc:  'A solid score that opens doors to many competitive courses. You are on track for a strong UTME performance.',
  },
  {
    min:   300,
    max:   349,
    title: 'Top 10% Tier',
    desc:  'A score in this range places you in the top 10% of candidates. You are eligible for competitive courses at leading universities.',
  },
  {
    min:   350,
    max:   400,
    title: 'Top 5% Tier',
    desc:  'A score of {score} places you in the elite bracket. You are eligible for competitive courses like Medicine or Engineering at top Nigerian universities.',
  },
];

const AVERAGE_SCORE    = 200;
const MAX_SCORE        = 400;
const DEFAULT_SCORE    = 315;

// STATE
let currentScore    = DEFAULT_SCORE;
let confirmedScore  = null; // set when user clicks "Set Target"

// DOM REFERENCES
const scoreSlider      = document.getElementById('scoreSlider');
const scoreDisplay     = document.getElementById('scoreDisplay');
const btnSetTarget     = document.getElementById('btnSetTarget');
const setTargetText    = document.getElementById('setTargetText');
const setTargetLoader  = document.getElementById('setTargetLoader');
const tierTitle        = document.getElementById('tierTitle');
const tierDescription  = document.getElementById('tierDescription');
const goalValue        = document.getElementById('goalValue');
const goalFillNavy     = document.getElementById('goalFillNavy');
const goalFillAmber    = document.getElementById('goalFillAmber');
const nextBtn          = document.getElementById('nextBtn');
const nextBtnText      = document.getElementById('nextBtnText');
const nextBtnLoader    = document.getElementById('nextBtnLoader');
const backLink         = document.getElementById('backLink');
const toast            = document.getElementById('toast');
const pageOverlay      = document.getElementById('pageOverlay');

// INIT
function init() {
  guardAccess();
  restoreSavedScore();
  updateScoreDisplay(currentScore);
  updateTierCard(currentScore);
  updateGoalBar(currentScore);
  updateSliderTrack(currentScore);
  bindSlider();
  bindSetTarget();
  bindNextButton();
  bindBackLink();
  fadeInOnLoad();
}

// GUARD — must have completed step 1
function guardAccess() {
  const step1Done = sessionStorage.getItem('onboarding_step1_done');
  if (!step1Done) {
    navigateTo('/pages/onboarding-step1.html');
  }
}

// RESTORE SAVED SCORE
function restoreSavedScore() {
  const saved = sessionStorage.getItem('onboarding_step2_data');
  if (!saved) return;

  try {
    const data = JSON.parse(saved);
    if (data.targetScore) {
      currentScore   = data.targetScore;
      confirmedScore = data.targetScore;

      if (scoreSlider) scoreSlider.value = currentScore;
    }
  } catch {
    // Ignore
  }
}

// SLIDER
function bindSlider() {
  if (!scoreSlider) return;

  scoreSlider.addEventListener('input', () => {
    currentScore = Number(scoreSlider.value);
    updateScoreDisplay(currentScore);
    updateTierCard(currentScore);
    updateGoalBar(currentScore);
    updateSliderTrack(currentScore);
  });
}

// Live score number above slider 

function updateScoreDisplay(score) {
  if (scoreDisplay) scoreDisplay.textContent = score;
}

// Slider filled track via CSS gradient
function updateSliderTrack(score) {
  if (!scoreSlider) return;

  const min     = Number(scoreSlider.min);
  const max     = Number(scoreSlider.max);
  const percent = ((score - min) / (max - min)) * 100;

  scoreSlider.style.background = `
    linear-gradient(
      to right,
      var(--pillar-navy) 0%,
      var(--pillar-navy) ${percent}%,
      var(--pillar-border) ${percent}%,
      var(--pillar-border) 100%
    )
  `;
}

//Tier card — title and description update on slide

function updateTierCard(score) {
  const tier = SCORE_TIERS.find(t => score >= t.min && score <= t.max);
  if (!tier) return;

  if (tierTitle) {
    tierTitle.textContent = tier.title;
  }

  if (tierDescription) {
    tierDescription.textContent = tier.desc.replace('{score}', score);
  }
}

// Goal bar — two-tone bar

function updateGoalBar(score) {
  if (!goalFillNavy || !goalFillAmber) return;

  // Navy portion: how far above average (200) the goal is
  // Amber portion: the remaining stretch to max (400)
  const navyPercent  = Math.min(((score - AVERAGE_SCORE) / (MAX_SCORE - AVERAGE_SCORE)) * 100, 100);
  const amberPercent = 100 - navyPercent;

  goalFillNavy.style.width  = `${navyPercent}%`;
  goalFillAmber.style.width = `${amberPercent > 5 ? 15 : 0}%`; // amber shows as accent

  if (goalValue) goalValue.textContent = score;
}

// SET TARGET BUTTON
function bindSetTarget() {
  if (!btnSetTarget) return;
  btnSetTarget.addEventListener('click', handleSetTarget);
}

function handleSetTarget() {
  confirmedScore = currentScore;

  // Visual feedback
  setTargetLoading(true);

  setTimeout(() => {
    setTargetLoading(false);

    // Update button label to show confirmation
    if (setTargetText) setTargetText.textContent = `Target Set: ${confirmedScore} ✓`;

    // Save to session
    const step2Data = {
      targetScore: confirmedScore,
    };
    sessionStorage.setItem('onboarding_step2_data', JSON.stringify(step2Data));
    sessionStorage.setItem('onboarding_step2_done', '1');

    showToast(`Target score set to ${confirmedScore}!`, 'success');

    // Re-enable next button after target set
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.setAttribute('aria-disabled', 'false');
    }

  }, 600);
}

function setTargetLoading(isLoading) {
  if (!btnSetTarget || !setTargetText || !setTargetLoader) return;
  btnSetTarget.disabled = isLoading;
  setTargetText.classList.toggle('hidden', isLoading);
  setTargetLoader.classList.toggle('hidden', !isLoading);
}

// NEXT BUTTON
function bindNextButton() {
  if (!nextBtn) return;

  // Disable until Set Target is clicked
  const alreadyDone = sessionStorage.getItem('onboarding_step2_done');
  if (!alreadyDone) {
    nextBtn.disabled = true;
    nextBtn.setAttribute('aria-disabled', 'true');
  }

  nextBtn.addEventListener('click', handleNext);
}

function handleNext() {
  if (!confirmedScore && !sessionStorage.getItem('onboarding_step2_done')) {
    showToast('Please set your target score before continuing.', 'error');
    return;
  }

  // If user skipped Set Target click but score is valid — auto-confirm
  if (!confirmedScore) {
    confirmedScore = currentScore;
    const step2Data = { targetScore: confirmedScore };
    sessionStorage.setItem('onboarding_step2_data', JSON.stringify(step2Data));
    sessionStorage.setItem('onboarding_step2_done', '1');
  }

  navigateTo('/pages/onboarding-step3.html');
}

// BACK LINK — navigate back to step 1 seamlessly
function bindBackLink() {
  if (!backLink) return;
  backLink.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('/pages/onboarding-step1.html');
  });
}

// SEAMLESS PAGE TRANSITION
function navigateTo(url) {
  if (!pageOverlay) {
    window.location.href = url;
    return;
  }

  pageOverlay.classList.add('fade-in');

  setTimeout(() => {
    window.location.href = url;
  }, 300);
}

function fadeInOnLoad() {
  if (!pageOverlay) return;
  pageOverlay.classList.add('fade-in');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      pageOverlay.classList.remove('fade-in');
    });
  });
}

// TOAST
function showToast(message, type = '') {
  if (!toast) return;

  toast.textContent = message;
  toast.className   = `toast ${type}`.trim();

  void toast.offsetWidth;
  toast.classList.add('show');

  setTimeout(() => toast.classList.remove('show'), 3500);
}

// BOOT
init();