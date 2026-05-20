/* =============================================================
   subject-selection.js
   Handles all interactivity on the "Select your UTME subjects" page.

   HOW IT WORKS (beginner-friendly explanation):
   - We have a list of subjects stored as data (mock data for now).
   - We loop through that list and build a card for each subject in the HTML.
   - "Use of English" is pre-selected because it's compulsory.
   - Users can click cards to select/deselect (max 4 total, 3 additional).
   - As selections change, we update the progress bar, counter, and badge.
   - When exactly 4 subjects are selected, the Next button becomes active.
   ============================================================= */
 // import { lazyLoadImages } from '../utils/lazyLoad.js';
 // import { showSkeleton } from '../utils/skeleton.js';

/* ── STEP 1: Mock subject data ──────────────────────────────────
   Each subject has:
   - id        : unique identifier
   - name      : displayed on the card
   - icon      : Phosphor icon class name (ph = regular, ph-bold = bold)
   - compulsory: true means auto-selected and can't be deselected
   ──────────────────────────────────────────────────────────── */
const subjectsData = [
  { id: "english",    name: "Use of English", icon: "ph ph-book-open",      compulsory: true  },
  { id: "maths",      name: "Mathematics",    icon: "ph ph-math-operations", compulsory: false },
  { id: "biology",    name: "Biology",        icon: "ph ph-leaf",            compulsory: false },
  { id: "chemistry",  name: "Chemistry",      icon: "ph ph-flask",           compulsory: false },
  { id: "government", name: "Government",     icon: "ph ph-bank",            compulsory: false },
  { id: "physics",    name: "Physics",        icon: "ph ph-lightning",       compulsory: false },
  { id: "economics",  name: "Economics",      icon: "ph ph-chart-line-up",   compulsory: false },
  { id: "literature", name: "Literature",     icon: "ph ph-book-bookmark",   compulsory: false },
];

/* Maximum number of subjects a student can select */
const MAX_SUBJECTS = 4;

/* Track which subject IDs are currently selected.
   We start with "english" pre-selected (it's compulsory). */
const selectedSubjects = new Set(["english"]);


/* ── STEP 2: Grab DOM elements we'll need to update ──────────── */
const cardsContainer  = document.getElementById("subject-cards-container");
const selectedCount   = document.getElementById("selected-count");
const remainingBadge  = document.getElementById("remaining-badge");
const progressFill    = document.getElementById("progress-bar-fill");
const btnNext         = document.getElementById("btn-next");
const progressTrack   = document.querySelector(".progress-bar-track");


/* ──  Build and render each subject card ──────────────────
   This function creates a card element for each subject in subjectsData
   and inserts it into the page. This is dynamic -
   the HTML cards are created from data, not typed by hand.
   ──────────────────────────────────────────────────────────────── */
function renderSubjectCards() {
  /* Clear the container first (in case this is called again) */
  cardsContainer.innerHTML = "";

  subjectsData.forEach((subject) => {
    /* Is this subject currently selected? */
    const isSelected = selectedSubjects.has(subject.id);

    /* Create the article element (semantic = correct for a card/item) */
    const card = document.createElement("article");
    card.classList.add("subject-card");
    card.setAttribute("role", "listitem");
    card.setAttribute("aria-pressed", isSelected ? "true" : "false");
    card.setAttribute("aria-label", `${subject.name}${subject.compulsory ? ", compulsory" : ""}`);
    card.dataset.id = subject.id; /* store the subject id on the element */

    /* If pre-selected, add the selected CSS class */
    if (isSelected) card.classList.add("selected");

    /* Build the inner HTML of the card */
    card.innerHTML = `
      ${subject.compulsory
        /* Compulsory badge only shows on Use of English */
        ? `<span class="compulsory-badge" aria-label="Compulsory subject">Compulsory</span>`
        : ""
      }

      <!-- Icon wrapped in a styled circle -->
      <div class="card-icon-wrapper" aria-hidden="true">
        <i class="${subject.icon}"></i>
      </div>

      <!-- Subject name -->
      <p class="card-subject-name">${subject.name}</p>

      <!-- Selected/unselected status row -->
      <div class="card-status">
        <i class="card-status-icon ${isSelected ? "ph-fill ph-check-circle" : "ph ph-circle"}"></i>
        <span class="card-status-text">${isSelected ? "Selected" : ""}</span>
      </div>
    `;

    /* Attach click handler (only if not compulsory — English can't be deselected) */
    if (!subject.compulsory) {
      card.addEventListener("click", () => handleCardClick(subject.id));
    }

    /* Add the completed card to the container */
    cardsContainer.appendChild(card);
  });
}


/* ── STEP 4: Handle card clicks ──────────────────────────────────
   This runs every time a non-compulsory card is clicked.
   It toggles the subject in/out of the selectedSubjects Set,
   then re-renders the cards and updates the progress UI.
   ──────────────────────────────────────────────────────────────── */
function handleCardClick(subjectId) {
  if (selectedSubjects.has(subjectId)) {
    /* Subject is already selected — DESELECT it */
    selectedSubjects.delete(subjectId);
  } else {
    /* Subject is not selected — SELECT it (only if under the max) */
    if (selectedSubjects.size >= MAX_SUBJECTS) {
      /* Max reached: do nothing (button is disabled by CSS too) */
      return;
    }
    selectedSubjects.add(subjectId);
  }

  /* After every click, refresh the cards and counter UI */
  renderSubjectCards();
  updateProgressUI();
  updateDisabledCards();
}


/* ──  Update the progress bar + counter + badge ───────────
   Called every time a subject is selected or deselected.
   ──────────────────────────────────────────────────────────────── */
function updateProgressUI() {
  const count     = selectedSubjects.size;              /* e.g. 2       */
  const remaining = MAX_SUBJECTS - count;               /* e.g. 2       */
  const percent   = (count / MAX_SUBJECTS) * 100;       /* e.g. 50%     */

  /* Update the "1/4 Subjects Selected" counter */
  selectedCount.textContent = count;

  /* Update the "Remaining X" badge */
  remainingBadge.textContent = `Remaining ${remaining}`;

  /* Update the progress bar fill width */
  progressFill.style.width = `${percent}%`;

  /* Update the aria attribute for screen readers */
  progressTrack.setAttribute("aria-valuenow", count);

  /* Enable the Next button only when all 4 are selected */
  btnNext.disabled = count < MAX_SUBJECTS;
}


/* ──  Disable unselected cards when max is reached ────────
   When 4 subjects are selected, all unselected cards should look
   greyed out and be unclickable.
   ──────────────────────────────────────────────────────────────── */
function updateDisabledCards() {
  const allCards = cardsContainer.querySelectorAll(".subject-card");

  allCards.forEach((card) => {
    const id = card.dataset.id;
    const isCompulsory = subjectsData.find((s) => s.id === id)?.compulsory;

    if (!isCompulsory && !selectedSubjects.has(id) && selectedSubjects.size >= MAX_SUBJECTS) {
      /* Max reached and this card is not selected — disable it */
      card.classList.add("disabled");
    } else {
      /* Otherwise keep it interactive */
      card.classList.remove("disabled");
    }
  });
}


/* ── Next button navigation ──────────────────────────────
   When the user clicks Next (and it's enabled), navigate forward.
   The target page URL will be updated once the team decides.
   ──────────────────────────────────────────────────────────────── */
btnNext.addEventListener("click", () => {
  if (selectedSubjects.size === MAX_SUBJECTS) {
    
      sessionStorage.setItem("selectedSubjects", JSON.stringify([...selectedSubjects]));
    
    window.location.href = "/pages/aim-setter.html"; 
  }
});


/* ─ Initialise the page ─────────────────────────────────
   These three calls run as soon as the script loads.
   They build the cards, set up the UI, and handle disabled states.
   ──────────────────────────────────────────────────────────────── */
renderSubjectCards();   /* build all cards from subjectsData */
updateProgressUI();     /* set correct count/bar/badge from the start */
updateDisabledCards();  /* disable correct cards from the start */
 // lazyLoadImages() 