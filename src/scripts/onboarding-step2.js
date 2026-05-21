/* =============================================================
   Handles all interactivity on the "Set your Aim" page (Step 2).

   HOW IT WORKS (beginner-friendly):
   - A range input (slider) lets the user pick a score from 200–400.
   - As they drag, the big score number above the slider updates live.
   - When "Set Target" is clicked, the "Your Goal" card number updates
     and the two-tone progress bar animates accordingly.
   - The tier card description updates live as the slider moves.
   =============================================================


/* ── Grab DOM elements ───────────────────────────────────────── */
const scoreSlider  = document.getElementById('score-slider');
const scoreDisplay = document.getElementById('score-display');
const btnSetTarget = document.getElementById('btn-set-target');
const goalValue    = document.getElementById('goal-value');
const goalFillNavy = document.getElementById('goal-fill-navy');
const goalFillAmber= document.getElementById('goal-fill-amber');
const tierTitle    = document.getElementById('tier-title');
const tierDesc     = document.getElementById('tier-description');
const btnNext      = document.getElementById('btn-next');


/* ── Score range constants ───────────────────────────────────── */
const MIN_SCORE = 200;
const MAX_SCORE = 400;


/* ── Mock tier data ──────────────────────────────────────────────
   TODO (backend): Replace this array with an API call when ready.
   The backend should return the correct tier object based on score.
   ─────────────────────────────────────────────────────────────── */
const tierData = [
  {
    minScore: 350,
    maxScore: 400,
    title: 'Top 5% Tier',
    description:
      'A score in this range places you in the elite bracket. You are eligible for competitive courses like Medicine or Engineering at top Nigerian universities.',
  },
  {
    minScore: 300,
    maxScore: 349,
    title: 'Top 15% Tier',
    description:
      'A score in this range is excellent. You qualify for strong programmes like Law, Pharmacy, and Computer Science at leading Nigerian universities.',
  },
  {
    minScore: 250,
    maxScore: 299,
    title: 'Above Average',
    description:
      'A solid score. You are competitive for many degree programmes. With focused study, you can push into the top tier.',
  },
  {
    minScore: 200,
    maxScore: 249,
    title: 'Average Range',
    description:
      'This is around the national average. There is great room to grow. Your personalised study plan will help you aim higher.',
  },
];


/* ── Get the matching tier object for a score ────────────────── */
function getTierForScore(score) {
  return tierData.find(
    (tier) => score >= tier.minScore && score <= tier.maxScore
  );
}


/* ── Update the slider's filled left track colour ────────────────
   CSS range inputs don't colour the left side of the thumb by default
   so we use a gradient background trick to simulate it.
   ─────────────────────────────────────────────────────────────── */
function updateSliderFill(score) {
  const percent = ((score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * 100;
  scoreSlider.style.background = `linear-gradient(
    to right,
    var(--pillar-navy) 0%,
    var(--pillar-navy) ${percent}%,
    var(--pillar-border) ${percent}%,
    var(--pillar-border) 100%
  )`;
}


/* ── Update the two-tone Your Goal progress bar ─────────────────
   Navy  = how close the score is to 400 (high achievement)
   Amber = remaining portion (closer to 200 = more amber shows)
   ─────────────────────────────────────────────────────────────── */
function updateGoalBar(score) {
  const range        = MAX_SCORE - MIN_SCORE;        /* always 200      */
  const progress     = score - MIN_SCORE;            /* e.g 315-200=115 */
  const navyPercent  = (progress / range) * 100;     /* e.g 57.5%       */
  const amberPercent = 100 - navyPercent;            /* e.g 42.5%       */

  goalFillNavy.style.width  = `${navyPercent}%`;
  goalFillAmber.style.width = `${amberPercent}%`;
}


/* ── Update the tier card title and description ──────────────── */
function updateTierCard(score) {
  const tier = getTierForScore(score);
  if (tier) {
    tierTitle.textContent = tier.title;
    tierDesc.textContent  = tier.description;
  }
}


/* ── SLIDER: live input event ────────────────────────────────────
   Fires continuously as the user drags the slider.
   Updates the big score number, slider fill, and tier card live.
   ─────────────────────────────────────────────────────────────── */
/* Updated slider: min=0, max=400, button disabled below 200 */
scoreSlider.addEventListener('input', () => {
  const score = parseInt(scoreSlider.value, 10);

  /* Always update the displayed number */
  scoreDisplay.textContent = score;

  /* Update slider fill colour */
  updateSliderFill(score);

  /* Update tier card only if score is 200+ */
  if (score >= 200) {
    updateTierCard(score);
  }

  /* Disable Set Target button if below 200 */
  btnSetTarget.disabled = score < 200;
});

/* ── SET TARGET button: click event ──────────────────────────────
   Only when this button is clicked does the "YOUR GOAL" card update.
   ─────────────────────────────────────────────────────────────── */
btnSetTarget.addEventListener('click', () => {
  const score = parseInt(scoreSlider.value, 10);

  /* Update the "315" number inside the Your Goal card */
  goalValue.textContent = score;

  /* Update the two-tone bar to reflect this score */
  updateGoalBar(score);

  /*
    TODO: Persist the target score for the next page and backend.
    sessionStorage.setItem('targetScore', score);
  */
});


/* ── NEXT button navigation ─────────────────────────────────────────────────────────────── */
btnNext.addEventListener('click', () => {
  window.location.href = 'onboarding-step3.html'; /* TODO: update when next page is ready */
});


/* ── Initialise on page load ─────────────────────────────────────
   Run everything once so the page reflects the default score (315).
   ─────────────────────────────────────────────────────────────── */
const initialScore = parseInt(scoreSlider.value, 10);

scoreDisplay.textContent = initialScore;  /* show 315 in big number   */
updateSliderFill(initialScore);           /* colour the slider track  */
updateTierCard(initialScore);             /* set correct tier text    */
updateGoalBar(initialScore);              /* set goal bar fill        */
