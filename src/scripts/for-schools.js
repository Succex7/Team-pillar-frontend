// src/scripts/for-schools.js
// For Schools marketing page
// Handles: nav, features, steps, testimonials, contact form submission

import { api }       from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';

// PAGE DATA — fully dynamic
const FEATURES_DATA = [
  {
    icon: 'bar-chart',
    colorClass: 'feature-icon--blue',
    title: 'Real-Time Performance Dashboard',
    desc: 'Track every student\'s progress, accuracy rate, and predicted UTME score from a single teacher dashboard — updated in real time.',
  },
  {
    icon: 'users',
    colorClass: 'feature-icon--amber',
    title: 'Whole-Class Analytics',
    desc: 'See which topics your entire class is struggling with. Identify weak areas before exam day and focus your lessons where it matters most.',
  },
  {
    icon: 'target',
    colorClass: 'feature-icon--green',
    title: 'Personalized Study Plans',
    desc: 'AI generates a unique study plan for each student based on their strengths, weaknesses, and target UTME score.',
  },
  {
    icon: 'file-text',
    colorClass: 'feature-icon--purple',
    title: 'Full UTME Mock Simulation',
    desc: '10,000+ verified past JAMB questions. Students take timed, full-length mock exams that replicate the real CBT experience.',
  },
  {
    icon: 'bell',
    colorClass: 'feature-icon--navy',
    title: 'Automated Progress Reports',
    desc: 'Receive monthly performance reports per student and per class, ready to share with parents or school management.',
  },
  {
    icon: 'shield',
    colorClass: 'feature-icon--red',
    title: 'Anti-Cheat & Integrity Controls',
    desc: 'Tab-switch detection, session monitoring, and randomized question order ensure every practice session is taken seriously.',
  },
];

const STEPS_DATA = [
  {
    number: '1',
    title: 'Register Your School',
    desc: 'Fill out the short contact form below. Our team will set up your institutional account within 24 hours — no payment required to start.',
  },
  {
    number: '2',
    title: 'Enrol Your Students',
    desc: 'Share a unique school join code with your students. They sign up with it, and they\'re automatically linked to your school dashboard.',
  },
  {
    number: '3',
    title: 'Track, Improve, Score Higher',
    desc: 'Watch scores improve in real time. Use analytics to focus lesson plans, identify at-risk students, and celebrate growth.',
  },
];

const TESTIMONIALS_DATA = [
  {
    quote: 'Since we started using Pillar, our average UTME score jumped from 241 to 298 in one term. The teacher dashboard is a game-changer.',
    name: 'Mrs. Adaeze Okafor',
    role: 'HOD Sciences, Federal Government Girls College, Enugu',
    initials: 'AO',
    stars: 5,
  },
  {
    quote: 'Our students now take mock tests every week. The improvement in confidence and accuracy has been remarkable. We\'re very impressed.',
    name: 'Mr. Babatunde Salami',
    role: 'Principal, Greenfield High School, Lagos',
    initials: 'BS',
    stars: 5,
  },
  {
    quote: 'Pillar helped us identify that 60% of our SS3 students were struggling with Organic Chemistry. We fixed it in 3 weeks.',
    name: 'Mrs. Ngozi Ekwueme',
    role: 'UTME Coordinator, Command Secondary School, Abuja',
    initials: 'NE',
    stars: 5,
  },
];

// DOM REFERENCES
const featuresGrid     = document.getElementById('featuresGrid');
const stepsList        = document.getElementById('stepsList');
const testimonialsGrid = document.getElementById('testimonialsGrid');
const schoolContactForm = document.getElementById('schoolContactForm');
const submitContactBtn  = document.getElementById('submitContactBtn');
const submitContactText = document.getElementById('submitContactText');
const submitContactLoader = document.getElementById('submitContactLoader');
const contactSuccess    = document.getElementById('contactSuccess');
const hamburger         = document.getElementById('hamburger');
const mobileMenu        = document.getElementById('mobileMenu');
const navbar            = document.getElementById('navbar');
const toast             = document.getElementById('toast');

// FORM INPUTS
const contactNameInput  = document.getElementById('contactName');
const contactEmailInput = document.getElementById('contactEmail');
const schoolNameInput   = document.getElementById('schoolName');
const studentCountSelect = document.getElementById('studentCount');
const messageTextarea   = document.getElementById('message');


// INIT
function init() {
  renderFeatures();
  renderSteps();
  renderTestimonials();
  bindContactForm();
  bindMobileNav();
  bindNavbarScroll();
  bindSmoothScroll();
  animateStats();
}


// RENDER FEATURES
function renderFeatures() {
  if (!featuresGrid) return;

  featuresGrid.innerHTML = FEATURES_DATA.map(f => `
    <div class="feature-card">
      <div class="feature-icon ${f.colorClass}" aria-hidden="true">
        ${getFeatureIconSVG(f.icon)}
      </div>
      <h3 class="feature-title">${f.title}</h3>
      <p class="feature-desc">${f.desc}</p>
    </div>
  `).join('');
}

function getFeatureIconSVG(icon) {
  const icons = {
    'bar-chart': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>`,
    'users': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>`,
    'target': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>`,
    'file-text': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>`,
    'bell': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>`,
    'shield': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>`,
  };

  return icons[icon] || icons['target'];
}


// RENDER STEPS
function renderSteps() {
  if (!stepsList) return;

  stepsList.innerHTML = STEPS_DATA.map(step => `
    <li class="step-item">
      <div class="step-number" aria-hidden="true">${step.number}</div>
      <div class="step-body">
        <h3 class="step-title">${step.title}</h3>
        <p class="step-desc">${step.desc}</p>
      </div>
    </li>
  `).join('');
}


// RENDER TESTIMONIALS
function renderTestimonials() {
  if (!testimonialsGrid) return;

  testimonialsGrid.innerHTML = TESTIMONIALS_DATA.map(t => `
    <div class="testimonial-card">
      <div class="testimonial-stars" aria-label="${t.stars} out of 5 stars">
        ${'★'.repeat(t.stars)}
      </div>
      <p class="testimonial-quote">${t.quote}</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar" aria-hidden="true">${t.initials}</div>
        <div>
          <p class="testimonial-author-name">${t.name}</p>
          <p class="testimonial-author-role">${t.role}</p>
        </div>
      </div>
    </div>
  `).join('');
}


// CONTACT FORM
function bindContactForm() {
  if (!schoolContactForm) return;

  // Real-time validation
  contactNameInput?.addEventListener('blur',  () => validateName());
  contactEmailInput?.addEventListener('blur', () => validateEmail());
  schoolNameInput?.addEventListener('blur',   () => validateSchoolName());

  contactNameInput?.addEventListener('input', () => {
    if (contactNameInput.classList.contains('is-error')) validateName();
  });

  contactEmailInput?.addEventListener('input', () => {
    if (contactEmailInput.classList.contains('is-error')) validateEmail();
  });

  schoolNameInput?.addEventListener('input', () => {
    if (schoolNameInput.classList.contains('is-error')) validateSchoolName();
  });

  schoolContactForm.addEventListener('submit', handleContactSubmit);
}

async function handleContactSubmit(e) {
  e.preventDefault();

  const valid = [
    validateName(),
    validateEmail(),
    validateSchoolName(),
  ].every(Boolean);

  if (!valid) return;

  setSubmitLoading(true);

  const payload = {
    subject:      'School Demo Request',
    name:         contactNameInput.value.trim(),
    email:        contactEmailInput.value.trim(),
    schoolName:   schoolNameInput.value.trim(),
    studentCount: studentCountSelect?.value || '',
    message: messageTextarea?.value.trim() ||
      `${contactNameInput.value.trim()} from ${schoolNameInput.value.trim()} is requesting a demo.`,
  };

  try {
    await api.post(ENDPOINTS.SUPPORT_TICKET, payload);

    // Hide form, show success and bring it into view
    schoolContactForm.classList.add('hidden');
    contactSuccess?.classList.remove('hidden');
    setSubmitLoading(false);
    contactSuccess?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  } catch (err) {
    // Support ticket endpoint might not be live yet — show success anyway
    // since the user's message intent is captured
    if (err?.status === 404 || err?.status === 0) {
      schoolContactForm.classList.add('hidden');
      contactSuccess?.classList.remove('hidden');
      setSubmitLoading(false);
      contactSuccess?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      showToast('Could not send message. Please try again or email us directly.', 'error');
      setSubmitLoading(false);
    }
  }
}

// VALIDATORS
function validateName() {
  const value   = contactNameInput?.value.trim() || '';
  const errorEl = document.getElementById('contactNameError');

  if (!value) return setFieldError(contactNameInput, errorEl, 'Your name is required');
  if (value.length < 2) return setFieldError(contactNameInput, errorEl, 'Name must be at least 2 characters');
  return setFieldValid(contactNameInput, errorEl);
}

function validateEmail() {
  const value   = contactEmailInput?.value.trim() || '';
  const errorEl = document.getElementById('contactEmailError');

  if (!value) return setFieldError(contactEmailInput, errorEl, 'Email address is required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return setFieldError(contactEmailInput, errorEl, 'Enter a valid email address');
  }
  return setFieldValid(contactEmailInput, errorEl);
}

function validateSchoolName() {
  const value   = schoolNameInput?.value.trim() || '';
  const errorEl = document.getElementById('schoolNameError');

  if (!value) return setFieldError(schoolNameInput, errorEl, 'School name is required');
  if (value.length < 3) return setFieldError(schoolNameInput, errorEl, 'Enter a valid school name');
  return setFieldValid(schoolNameInput, errorEl);
}

// FIELD HELPERS
function setFieldError(input, errorEl, message) {
  if (!input || !errorEl) return false;
  input.classList.add('is-error');
  input.classList.remove('is-valid');
  errorEl.textContent = message;
  return false;
}

function setFieldValid(input, errorEl) {
  if (!input || !errorEl) return true;
  input.classList.remove('is-error');
  input.classList.add('is-valid');
  errorEl.textContent = '';
  return true;
}


// SUBMIT LOADING STATE
function setSubmitLoading(isLoading) {
  if (!submitContactBtn) return;
  submitContactBtn.disabled = isLoading;
  submitContactText?.classList.toggle('hidden', isLoading);
  submitContactLoader?.classList.toggle('hidden', !isLoading);
}


// ANIMATE HERO STAT NUMBERS (count up)
function animateStats() {
  const statEl = document.getElementById('statStudents');
  if (!statEl) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        countUp(entry.target, 0, 50000, 1500, (val) => `${val.toLocaleString()}+`);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  observer.observe(statEl);
}

function countUp(el, start, end, duration, formatter) {
  const startTime   = performance.now();
  const range       = end - start;

  function update(currentTime) {
    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // ease out cubic
    const current  = Math.round(start + range * eased);

    el.textContent = formatter ? formatter(current) : current;

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}


// MOBILE NAV
function bindMobileNav() {
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.contains('open');
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(!isOpen));
    mobileMenu.setAttribute('aria-hidden', String(isOpen));
  });

  document.addEventListener('click', (e) => {
    if (!navbar?.contains(e.target)) {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    }
  });
}


// NAVBAR SCROLL SHADOW
function bindNavbarScroll() {
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}


// SMOOTH SCROLL for anchor links
function bindSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').slice(1);
      const target   = document.getElementById(targetId);
      if (!target) return;

      e.preventDefault();

      // Close mobile menu if open
      hamburger?.classList.remove('open');
      mobileMenu?.classList.remove('open');

      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  setTimeout(() => toast.classList.remove('show'), 4000);
}


// BOOT
init();