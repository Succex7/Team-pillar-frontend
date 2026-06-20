// src/scripts/pricing.js
// Pricing page — fetches plans from API, handles billing toggle,
// Paystack initialization, FAQ accordion, mobile nav

import { api }       from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';

// PLAN DATA — fallback if API fails or returns incomplete data
// Prices match the API response but UI labels and features are defined here
const PLAN_FALLBACK = [
  {
    id:          'free',
    name:        'Free',
    tagline:     'A taste of excellence.',
    monthlyPrice: 0,
    yearlyPrice:  0,
    currency:    '₦',
    popular:     false,
    features: [
      'Basic practice access',
      '10 questions per day',
      'Community support',
    ],
    ctaLabel:    'Start Free',
    ctaVariant:  'outline',
  },
  {
    id:          'pro',
    name:        'Pro',
    tagline:     'The ultimate preparation kit.',
    monthlyPrice: 4500,
    yearlyPrice:  3600,
    currency:    '₦',
    popular:     true,
    features: [
      'Unlimited Mock Exams',
      'AI Tutor Support (24/7)',
      'Performance Heatmaps',
      'Personalized Study Plans',
      'Full question bank access',
    ],
    ctaLabel:    'Go Pro Now',
    ctaVariant:  'primary',
  },
  {
    id:          'standard',
    name:        'Standard',
    tagline:     'Perfect for daily revision.',
    monthlyPrice: 2500,
    yearlyPrice:  2000,
    currency:    '₦',
    popular:     false,
    features: [
      'Full question bank',
      'Basic analytics dashboard',
      '3 mock exams per month',
      'Priority email support',
    ],
    ctaLabel:    'Choose Standard',
    ctaVariant:  'outline',
  },
];

const COMPARE_ROWS = [
  {
    feature: 'Question Bank Access',
    free:     'Limited (10/day)',
    standard: 'Full Access',
    pro:      'Full Access',
  },
  {
    feature: 'Mock Exams',
    free:     false,
    standard: '3 per month',
    pro:      'Unlimited',
  },
  {
    feature: 'AI Tutor (Ask AI)',
    free:     false,
    standard: false,
    pro:      true,
  },
  {
    feature: 'Performance Analytics',
    free:     'Basic',
    standard: 'Detailed',
    pro:      'Heatmaps + Prediction',
  },
  {
    feature: 'Support',
    free:     'Community',
    standard: 'Priority Email',
    pro:      'Dedicated Concierge',
  },
];

const FAQ_DATA = [
  {
    question: 'Can I switch between plans anytime?',
    answer:   'Yes! You can upgrade from Standard to Pro at any time, and the difference will be prorated. Downgrades take effect at the end of your current billing cycle.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:   'We accept all major Nigerian debit and credit cards, bank transfers, and USSD payments through Paystack — Nigeria\'s most trusted payment provider.',
  },
  {
    question: 'How accurate are the Mock Exams?',
    answer:   'Our mock exams are built from verified past JAMB questions and follow the exact UTME format — 45 questions across 4 subjects in 2 hours. They are regularly updated to reflect the latest JAMB patterns.',
  },
  {
    question: 'Is there a refund policy?',
    answer:   'Yes. If you are not satisfied within 7 days of your first payment, contact us at support@pillarcbt.com and we will issue a full refund — no questions asked.',
  },
];

const FOOTER_LINKS = [
  {
    title: 'Product',
    links: [
      { label: 'Features',    href: '#features'    },
      { label: 'Study Plans', href: '#study-plans' },
      { label: 'Mock Tests',  href: '#mock-tests'  },
      { label: 'Pricing',     href: './pages/pricing.html'     },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Centre', href: '/help'    },
      { label: 'Contact',     href: '/contact' },
      { label: 'FAQ',         href: '/faq'     },
    ],
  },
  {
    title: 'Schools',
    links: [
      { label: 'For Schools',  href: '/schools'  },
      { label: 'For Tutors',   href: '/tutors'   },
      { label: 'Partnerships', href: '/partners' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us',       href: '/about'   },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms',          href: '/terms'   },
    ],
  },
];

// STATE
let billingPeriod  = 'monthly';
let apiPlans       = [];
let loadingPlanId  = null;

// DOM REFERENCES
const plansGrid         = document.getElementById('plansGrid');
const compareTableBody  = document.getElementById('compareTableBody');
const faqList           = document.getElementById('faqList');
const toggleMonthly     = document.getElementById('toggleMonthly');
const toggleYearly      = document.getElementById('toggleYearly');
const hamburger         = document.getElementById('hamburger');
const mobileMenu        = document.getElementById('mobileMenu');
const navbar            = document.getElementById('navbar');
const toast             = document.getElementById('toast');


// INIT
async function init() {
  bindNavbarScroll();
  bindMobileNav();
  bindBillingToggle();
  renderCompareTable();
  renderFaq();
  renderFooterLinks();
  setCurrentYear();
  await loadPlans();
}


// FETCH PLANS FROM API
async function loadPlans() {
  try {
    const response = await api.get(ENDPOINTS.BILLING_PLANS);
    const data     = response.data || response;

    // Map API response to our internal format
    if (Array.isArray(data) && data.length) {
      apiPlans = data;
    }
  } catch {
    // API failed — use fallback data silently
  }

  renderPlans();
}


// RENDER PLAN CARDS
function renderPlans() {
  if (!plansGrid) return;

  // Use API data if available, else use fallback
  const plans = apiPlans.length ? mergePlansWithFallback(apiPlans) : PLAN_FALLBACK;

  plansGrid.innerHTML = plans.map(plan => buildPlanCard(plan)).join('');

  // Bind CTA buttons
  plansGrid.querySelectorAll('.plan-btn').forEach(btn => {
    btn.addEventListener('click', () => handlePlanClick(btn.dataset.planId, btn.dataset.planName));
  });
}

function mergePlansWithFallback(apiData) {
  // Merge API prices into fallback plan definitions
  return PLAN_FALLBACK.map(fallback => {
    const apiPlan = apiData.find(p =>
      p.id?.toLowerCase() === fallback.id ||
      p.name?.toLowerCase() === fallback.name.toLowerCase()
    );

    if (!apiPlan) return fallback;

    return {
      ...fallback,
      monthlyPrice: apiPlan.price ?? fallback.monthlyPrice,
    };
  });
}

function buildPlanCard(plan) {
  const isPro     = plan.id === 'pro';
  const price     = billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  const isFree    = price === 0;

  const featuresHTML = plan.features.map(f => `
    <li class="plan-feature-item">
      <svg class="plan-feature-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span class="plan-feature-text">${f}</span>
    </li>
  `).join('');

  const popularBadge = plan.popular
    ? `<div class="popular-badge">MOST POPULAR</div>`
    : '';

  const btnClass = isPro ? 'plan-btn plan-btn--pro' : 'plan-btn';

  return `
    <div class="plan-card ${isPro ? 'plan-card--pro' : ''}" role="article" aria-label="${plan.name} plan">
      ${popularBadge}
      <div class="plan-header">
        <p class="plan-name">${plan.name}</p>
        <p class="plan-tagline">${plan.tagline}</p>
      </div>
      <div class="plan-price" aria-label="${plan.name} costs ${isFree ? 'free' : plan.currency + price + ' per month'}">
        <span class="plan-price-currency">${isFree ? '' : plan.currency}</span>
        <span class="plan-price-amount">${isFree ? '₦0' : price.toLocaleString()}</span>
        <span class="plan-price-period">${isFree ? '/month' : '/month'}</span>
      </div>
      <ul class="plan-features" aria-label="${plan.name} features">
        ${featuresHTML}
      </ul>
      <button
        type="button"
        class="${btnClass}"
        data-plan-id="${plan.id}"
        data-plan-name="${plan.name}"
        aria-label="Choose ${plan.name} plan"
      >
        ${plan.ctaLabel}
      </button>
    </div>
  `;
}

// Update prices when billing period changes — no full re-render
function updatePlanPrices() {
  if (!plansGrid) return;

  const plans = apiPlans.length ? mergePlansWithFallback(apiPlans) : PLAN_FALLBACK;

  plans.forEach(plan => {
    const priceEl = plansGrid.querySelector(
      `[data-plan-id="${plan.id}"]`
    )?.closest('.plan-card')?.querySelector('.plan-price-amount');

    if (!priceEl) return;

    const price = billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    priceEl.textContent = price === 0 ? '₦0' : price.toLocaleString();
  });
}


// HANDLE PLAN BUTTON CLICK
async function handlePlanClick(planId, planName) {
  if (planId === 'free') {
    // Free plan — just go to register
    window.location.href = '/pages/register.html';
    return;
  }

  // Check if user is logged in
  const token =
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token');

  if (!token) {
    // Not logged in — send to register with plan hint
    sessionStorage.setItem('intended_plan', planId);
    window.location.href = '/pages/register.html';
    return;
  }

  // Logged in — initialize Paystack payment
  await initializePayment(planId, planName);
}

async function initializePayment(planId, planName) {
  if (loadingPlanId) return;
  loadingPlanId = planId;

  // Show loading state on button
  const btn = plansGrid?.querySelector(`[data-plan-id="${planId}"]`);
  if (btn) {
    btn.disabled  = true;
    btn.innerHTML = `<span class="btn-loader ${planId !== 'pro' ? 'btn-loader--dark' : ''}"></span> Processing...`;
  }

  try {
    const response = await api.post(ENDPOINTS.BILLING_INITIALIZE, { planId });
    const data     = response.data || response;

    if (data?.authorization_url) {
      // Redirect to Paystack checkout
      window.location.href = data.authorization_url;
    } else {
      showToast('Payment could not be initialized. Please try again.', 'error');
      resetPlanButton(planId, planName);
    }

  } catch (err) {
    const msg = err?.status === 401
      ? 'Please sign in to upgrade your plan.'
      : 'Payment initialization failed. Please try again.';
    showToast(msg, 'error');
    resetPlanButton(planId, planName);
  } finally {
    loadingPlanId = null;
  }
}

function resetPlanButton(planId, planName) {
  const plans   = apiPlans.length ? mergePlansWithFallback(apiPlans) : PLAN_FALLBACK;
  const plan    = plans.find(p => p.id === planId);
  const isPro   = planId === 'pro';
  const btn     = plansGrid?.querySelector(`[data-plan-id="${planId}"]`);

  if (!btn || !plan) return;

  btn.disabled  = false;
  btn.className = isPro ? 'plan-btn plan-btn--pro' : 'plan-btn';
  btn.textContent = plan.ctaLabel;
}


// BILLING TOGGLE
function bindBillingToggle() {
  if (!toggleMonthly || !toggleYearly) return;

  toggleMonthly.addEventListener('click', () => {
    billingPeriod = 'monthly';
    toggleMonthly.classList.add('toggle-btn--active');
    toggleMonthly.setAttribute('aria-pressed', 'true');
    toggleYearly.classList.remove('toggle-btn--active');
    toggleYearly.setAttribute('aria-pressed', 'false');
    updatePlanPrices();
  });

  toggleYearly.addEventListener('click', () => {
    billingPeriod = 'yearly';
    toggleYearly.classList.add('toggle-btn--active');
    toggleYearly.setAttribute('aria-pressed', 'true');
    toggleMonthly.classList.remove('toggle-btn--active');
    toggleMonthly.setAttribute('aria-pressed', 'false');
    updatePlanPrices();
  });
}


// RENDER COMPARE TABLE
function renderCompareTable() {
  if (!compareTableBody) return;

  const checkIcon = `
    <span class="check-icon" aria-label="Included">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </span>
  `;

  const crossIcon = `
    <span class="cross-icon" aria-label="Not included">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </span>
  `;

  compareTableBody.innerHTML = COMPARE_ROWS.map(row => `
    <tr>
      <td class="compare-td-feature">${row.feature}</td>
      <td class="compare-td-value">${row.free === false ? crossIcon : row.free === true ? checkIcon : row.free}</td>
      <td class="compare-td-value">${row.standard === false ? crossIcon : row.standard === true ? checkIcon : row.standard}</td>
      <td class="compare-td-pro">${row.pro === false ? crossIcon : row.pro === true ? checkIcon : `<strong>${row.pro}</strong>`}</td>
    </tr>
  `).join('');
}


// RENDER FAQ
function renderFaq() {
  if (!faqList) return;

  faqList.innerHTML = FAQ_DATA.map((item, i) => `
    <div class="faq-item" role="listitem">
      <button
        type="button"
        class="faq-question-btn"
        aria-expanded="false"
        aria-controls="faq-answer-${i}"
        id="faq-btn-${i}"
      >
        <span>${item.question}</span>
        <svg class="faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div class="faq-answer" id="faq-answer-${i}" role="region" aria-labelledby="faq-btn-${i}">
        <p class="faq-answer-inner">${item.answer}</p>
      </div>
    </div>
  `).join('');

  // Bind accordion toggle
  faqList.querySelectorAll('.faq-question-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item     = btn.closest('.faq-item');
      const isOpen   = item.classList.contains('open');

      // Close all
      faqList.querySelectorAll('.faq-item').forEach(el => {
        el.classList.remove('open');
        el.querySelector('.faq-question-btn').setAttribute('aria-expanded', 'false');
      });

      // Open clicked if it was closed
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
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

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!navbar?.contains(e.target)) {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    }
  });
}


// FOOTER LINKS
function renderFooterLinks() {
  const grid = document.getElementById('footerLinksGrid');
  if (!grid) return;

  FOOTER_LINKS.forEach(col => {
    const colEl = document.createElement('div');
    colEl.className = 'footer-col';

    const title = document.createElement('p');
    title.className = 'footer-col-title';
    title.textContent = col.title;

    const list = document.createElement('ul');
    list.className = 'footer-link-list';
    list.setAttribute('role', 'list');

    col.links.forEach(link => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = link.href;
      a.className = 'footer-link';
      a.textContent = link.label;
      li.appendChild(a);
      list.appendChild(li);
    });

    colEl.appendChild(title);
    colEl.appendChild(list);
    grid.appendChild(colEl);
  });
}

// CURRENT YEAR in footer
function setCurrentYear() {
  const el = document.getElementById('currentYear');
  if (el) el.textContent = new Date().getFullYear();
}


// NAVBAR SCROLL SHADOW
function bindNavbarScroll() {
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
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