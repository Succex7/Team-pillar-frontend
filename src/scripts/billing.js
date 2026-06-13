// src/scripts/billing.js
// Standalone billing/upgrade page
// Guards auth, fetches plans, handles Paystack initialization

import { api }       from '../services/api.js';
import { ENDPOINTS } from '../services/endpoints.js';
import { userStore } from '../store/userStore.js';

// PLAN DEFINITIONS — UI labels, features, and fallback prices
const PLAN_DEFS = [
  {
    id:           'standard',
    name:         'Standard',
    tagline:      'Perfect for daily revision.',
    monthlyPrice: 2500,
    yearlyPrice:  2000,
    currency:     '₦',
    popular:      false,
    features: [
      'Full question bank',
      'Basic analytics dashboard',
      '3 mock exams per month',
      'Priority email support',
    ],
    ctaLabel:   'Choose Standard',
    ctaVariant: 'outline',
  },
  {
    id:           'pro',
    name:         'Pro',
    tagline:      'The ultimate preparation kit.',
    monthlyPrice: 4500,
    yearlyPrice:  3600,
    currency:     '₦',
    popular:      true,
    features: [
      'Unlimited Mock Exams',
      'AI Tutor Support (24/7)',
      'Performance Heatmaps',
      'Personalized Study Plans',
      'Full question bank access',
    ],
    ctaLabel:   'Go Pro Now',
    ctaVariant: 'pro',
  },
];

// STATE
let billingPeriod = 'monthly';
let currentPlan   = 'free';
let loadingPlanId = null;
let apiPlans      = [];

// DOM REFERENCES
const plansGrid       = document.getElementById('plansGrid');
const toggleMonthly   = document.getElementById('toggleMonthly');
const toggleYearly    = document.getElementById('toggleYearly');
const backBtn         = document.getElementById('backBtn');
const currentPlanNote = document.getElementById('currentPlanNote');
const toast           = document.getElementById('toast');


// INIT
async function init() {
  guardAuth();
  readCurrentPlan();
  bindBackButton();
  bindBillingToggle();
  await loadPlans();
}


// GUARD — must be logged in to upgrade
function guardAuth() {
  const token =
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token');

  if (!token) {
    sessionStorage.setItem('intended_plan', 'pro');
    window.location.href = '/pages/login.html';
  }
}


// READ CURRENT PLAN FROM STORE
function readCurrentPlan() {
  const profile = userStore.getState().profile;
  if (profile?.isPro) {
    currentPlan = 'pro';
  } else {
    currentPlan = profile?.plan || 'free';
  }

  if (currentPlanNote) {
    currentPlanNote.textContent = currentPlan === 'pro'
      ? 'You are already on the Pro plan. Manage your subscription below.'
      : `You are currently on the ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan.`;
  }
}


// FETCH PLANS
async function loadPlans() {
  try {
    const response = await api.get(ENDPOINTS.BILLING_PLANS);
    const data     = response.data || response;
    if (Array.isArray(data) && data.length) {
      apiPlans = data;
    }
  } catch {
    // Use fallback prices silently
  }

  renderPlans();
}


// RENDER PLAN CARDS
function renderPlans() {
  if (!plansGrid) return;

  const plans = PLAN_DEFS.map(def => {
    const apiMatch = apiPlans.find(p =>
      p.id?.toLowerCase() === def.id ||
      p.name?.toLowerCase() === def.name.toLowerCase()
    );
    return {
      ...def,
      monthlyPrice: apiMatch?.price ?? def.monthlyPrice,
    };
  });

  plansGrid.innerHTML = plans.map(plan => buildPlanCard(plan)).join('');

  // Bind CTA buttons
  plansGrid.querySelectorAll('.plan-btn[data-plan-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      handlePlanClick(btn.dataset.planId, btn.dataset.planName);
    });
  });
}

function buildPlanCard(plan) {
  const price    = billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  const isCurrent = plan.id === currentPlan;
  const isPro     = plan.id === 'pro';

  let badgeHTML = '';
  if (isCurrent) {
    badgeHTML = `<div class="current-badge">CURRENT PLAN</div>`;
  } else if (plan.popular) {
    badgeHTML = `<div class="popular-badge">MOST POPULAR</div>`;
  }

  const featuresHTML = plan.features.map(f => `
    <li class="plan-feature-item">
      <svg class="plan-feature-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span class="plan-feature-text">${f}</span>
    </li>
  `).join('');

  let btnClass = 'plan-btn';
  let btnLabel = plan.ctaLabel;

  if (isCurrent) {
    btnClass = 'plan-btn plan-btn--current';
    btnLabel = 'Current Plan';
  } else if (isPro) {
    btnClass = 'plan-btn plan-btn--pro';
  }

  return `
    <div class="billing-plan-card ${isPro ? 'billing-plan-card--pro' : ''} ${isCurrent ? 'billing-plan-card--current' : ''}" role="article" aria-label="${plan.name} plan">
      ${badgeHTML}
      <div class="plan-header">
        <p class="plan-name">${plan.name}</p>
        <p class="plan-tagline">${plan.tagline}</p>
      </div>
      <div class="plan-price">
        <span class="plan-price-currency">${plan.currency}</span>
        <span class="plan-price-amount" data-price-for="${plan.id}">${price.toLocaleString()}</span>
        <span class="plan-price-period">/month</span>
      </div>
      <ul class="plan-features">
        ${featuresHTML}
      </ul>
      <button
        type="button"
        class="${btnClass}"
        data-plan-id="${plan.id}"
        data-plan-name="${plan.name}"
        ${isCurrent ? 'disabled' : ''}
        aria-label="${isCurrent ? 'Current plan' : 'Choose ' + plan.name + ' plan'}"
      >
        ${btnLabel}
      </button>
    </div>
  `;
}


// UPDATE PRICES ON TOGGLE
function updatePrices() {
  PLAN_DEFS.forEach(def => {
    const priceEl = plansGrid?.querySelector(`[data-price-for="${def.id}"]`);
    if (!priceEl) return;
    const price = billingPeriod === 'yearly' ? def.yearlyPrice : def.monthlyPrice;
    priceEl.textContent = price.toLocaleString();
  });
}


// HANDLE PLAN CLICK
async function handlePlanClick(planId, planName) {
  if (loadingPlanId) return;
  if (planId === currentPlan) return;

  loadingPlanId = planId;
  setButtonLoading(planId, true);

  try {
    const response = await api.post(ENDPOINTS.BILLING_INITIALIZE, { planId });
    const data     = response.data || response;

    if (data?.authorization_url) {
      window.location.href = data.authorization_url;
    } else {
      showToast('Payment could not be initialized. Please try again.', 'error');
      setButtonLoading(planId, false);
    }
  } catch (err) {
    const msg = err?.status === 401
      ? 'Your session expired. Please sign in again.'
      : 'Payment initialization failed. Please try again.';
    showToast(msg, 'error');
    setButtonLoading(planId, false);
  } finally {
    loadingPlanId = null;
  }
}


// BUTTON LOADING STATE
function setButtonLoading(planId, isLoading) {
  const btn  = plansGrid?.querySelector(`[data-plan-id="${planId}"]`);
  const plan = PLAN_DEFS.find(p => p.id === planId);
  if (!btn || !plan) return;

  const isPro = planId === 'pro';

  if (isLoading) {
    btn.disabled   = true;
    btn.innerHTML  = `
      <span class="btn-loader ${!isPro ? 'btn-loader--dark' : ''}"></span>
      Processing...
    `;
  } else {
    btn.disabled   = false;
    btn.innerHTML  = plan.ctaLabel;
  }
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
    updatePrices();
  });

  toggleYearly.addEventListener('click', () => {
    billingPeriod = 'yearly';
    toggleYearly.classList.add('toggle-btn--active');
    toggleYearly.setAttribute('aria-pressed', 'true');
    toggleMonthly.classList.remove('toggle-btn--active');
    toggleMonthly.setAttribute('aria-pressed', 'false');
    updatePrices();
  });
}


// BACK BUTTON
function bindBackButton() {
  if (!backBtn) return;
  backBtn.addEventListener('click', () => {
    // Go back to previous page — or dashboard if no history
    if (document.referrer && document.referrer.includes(window.location.hostname)) {
      window.history.back();
    } else {
      window.location.href = '/pages/dashboard.html';
    }
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


init();