// src/components/shell.js
// Shared dashboard shell — sidebar + topbar
// Used by: dashboard, study-session, mock-tests, settings, performance pages
// Call initShell(pageKey, title, subtitle) on every dashboard page

import { userStore }   from '../store/userStore.js';
import { authService } from '../services/auth.service.js';
import { api }         from '../services/api.js';
import { ENDPOINTS }   from '../services/endpoints.js';

// NAV ITEMS DATA
const MAIN_MENU_ITEMS = [
  {
    key:   'overview',
    label: 'Overview',
    href:  '/pages/dashboard.html',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>`,
    badge: null,
  },
  {
    key:   'study-session',
    label: 'Study Session',
    href:  '/pages/study-session.html',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>`,
    badge: { text: 'START', type: 'start' },
  },
  {
    key:   'mock-test',
    label: 'Mock Tests',
    href:  '/pages/mock-tests.html',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>`,
    badge: null,
  },
  {
    key:   'performance',
    label: 'Performance',
    href:  '/pages/performance.html',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>`,
    badge: null,
  },
];

const IMPROVE_MENU_ITEMS = [
  {
    key:   'ai-tutor',
    label: 'AI Tutor',
    href:  '/pages/settings.html?tab=ai-tutor',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v4l3 3"/>
    </svg>`,
    badge: { text: 'PRO', type: 'pro' },
  },
  {
    key:   'study-planner',
    label: 'Study Planner',
    href:  '/pages/settings.html?tab=study-planner',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8"  y1="2" x2="8"  y2="6"/>
      <line x1="3"  y1="10" x2="21" y2="10"/>
    </svg>`,
    badge: { text: 'PRO', type: 'pro' },
  },
];

// SHELL TEMPLATE
function buildSidebarHTML(activeKey, user, stats = {}) {
  const initials = getInitials(user?.name || 'Student');
  const plan = user?.subscription === 'pro' || user?.isPro ? 'Pro' : 'Free';
  const isPro = plan === 'Pro';
  
  const predictedScore = stats.predictedScore ?? 278;
  const scoreChange = stats.weeklyScoreChange ?? 12;

  const buildItems = (items) => items.map(item => {
    const isActive = item.key === activeKey;
    const badgeHTML = item.badge
      ? `<span class="nav-badge nav-badge--${item.badge.type}">${item.badge.text}</span>`
      : '';

    return `
      <li>
        <a href="${item.href}" class="nav-item ${isActive ? 'nav-item--active' : ''}" data-nav-key="${item.key}">
          <span class="nav-item-icon">${item.icon}</span>
          <span class="nav-item-label">${item.label}</span>
          ${badgeHTML}
        </a>
      </li>
    `;
  }).join('');

  return `
    <aside class="sidebar" id="sidebar" role="navigation" aria-label="Main navigation">
      <div class="sidebar-logo">
        <a href="/pages/dashboard.html" class="sidebar-logo-link" aria-label="Pillar home">
          <img src="/icon/logo-white.png" width="22" height="22">
          <span>Pillar</span>
        </a>
        <button type="button" class="sidebar-close-btn" id="sidebarCloseBtn" aria-label="Close navigation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- PREDICTED SCORE CAPSULE -->
      <div class="sidebar-score-capsule">
        <div class="score-lbl">PREDICTED SCORE</div>
        <div class="score-num-row">
          <span class="score-val">${predictedScore} <span class="score-max">/ 400</span></span>
          <span class="score-gain">+${scoreChange} pts</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="menu-category">MAIN MENU</div>
        <ul class="nav-list" role="list">
          ${buildItems(MAIN_MENU_ITEMS)}
        </ul>

        <div class="menu-category">IMPROVE</div>
        <ul class="nav-list" role="list">
          ${buildItems(IMPROVE_MENU_ITEMS)}
        </ul>

        <div class="menu-category">ACCOUNT</div>
        <ul class="nav-list" role="list">
          <li>
            <a href="/pages/settings.html" class="nav-item ${activeKey === 'settings' ? 'nav-item--active' : ''}" data-nav-key="settings">
              <span class="nav-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                </svg>
              </span>
              <span class="nav-item-label">Settings</span>
            </a>
          </li>
          <li>
            <a href="/pages/settings.html?tab=support" class="nav-item" data-nav-key="support">
              <span class="nav-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </span>
              <span class="nav-item-label">Help & Support</span>
            </a>
          </li>
        </ul>
      </nav>

      <div class="sidebar-bottom">
        ${!isPro ? `
          <div class="sidebar-upgrade-card">
            <div class="upgrade-card-title">Unlock Pro Intelligence</div>
            <div class="upgrade-card-desc">AI Tutor, Study Planner, deep analytics & personalised recommendations.</div>
            <button type="button" class="upgrade-card-btn" id="sidebarUpgradeBtn">
              <span class="star-icon">⭐</span> Upgrade to Pro
            </button>
          </div>
        ` : ''}

        <!-- USER BLOCK -->
        <div class="sidebar-user-block">
          <div class="user-block-avatar">${initials}</div>
          <div class="user-block-info">
            <div class="user-block-name">${user?.name || 'Victor Okafor'}</div>
            <div class="user-block-plan">${plan} plan · Science Track</div>
          </div>
          <div class="user-block-arrow">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>
      </div>
    </aside>

    <div class="sidebar-overlay" id="sidebarOverlay" aria-hidden="true"></div>
  `;
}

function buildTopbarHTML(pageTitle, pageSubtitle, user, stats = {}) {
  const initials = getInitials(user?.name || 'Student');
  const plan = user?.subscription === 'pro' || user?.isPro ? 'pro' : 'free';
  const isPro = plan === 'pro';

  const sessionsToday = stats.sessionsToday ?? stats.stats?.totalSessions ?? 1;
  const dailyLimit = stats.dailyLimit ?? 3;
  const sessionsLeft = Math.max(0, dailyLimit - sessionsToday);
  const streak = stats.streak ?? stats.stats?.studyStreak ?? 14;
  
  // Calculate dynamic days to UTME or default to 47
  const utmeDays = 47;

  return `
    <header class="topbar" id="topbar">
      <button
        type="button"
        class="topbar-menu-btn"
        id="topbarMenuBtn"
        aria-label="Open sidebar"
        aria-controls="sidebar"
        aria-expanded="false"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="3" y1="6"  x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <div class="topbar-page-info">
        <h1 class="topbar-title">${pageTitle}</h1>
        <p class="topbar-subtitle">${pageSubtitle}</p>
      </div>

      <div class="topbar-right">
        <!-- TOPBAR CHIPS -->
        <div class="topbar-chips-row">
          <span class="topbar-chip chip-yellow">
            <span class="chip-dot"></span>
            ${sessionsLeft} of ${dailyLimit} sessions left today
          </span>
          <span class="topbar-chip chip-orange">
            🔥 ${streak}-day streak
          </span>
          <span class="topbar-chip chip-blue">
            ⏳ UTME in ${utmeDays} days
          </span>
        </div>

        <button class="topbar-bell-btn" aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>

        <div class="topbar-user">
          <div class="user-avatar" aria-hidden="true">${initials}</div>
          <div class="user-info">
            <p class="user-name">${user?.name || 'Student'}</p>
            <p class="user-role">${isPro ? 'Pro' : 'Free'} Tier</p>
          </div>
        </div>
      </div>
    </header>
  `;
}

// HELPERS
function getInitials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('');
}

// INIT SHELL
export async function initShell(pageKey, pageTitle, pageSubtitle) {
  guardAuth();

  const user = await ensureUserProfile();
  
  // Guard onboarding status: redirect to onboarding steps if incomplete
  if (user && !user.onboardingComplete) {
    // Prevent redirect loop if already on onboarding pages
    if (!window.location.pathname.includes('onboarding')) {
      window.location.href = '/pages/onboarding-step1.html';
      return;
    }
  }

  // Fetch dashboard stats for predicted score updates
  let stats = {};
  if (user) {
    try {
      const response = await api.get(ENDPOINTS.STUDENT_DASHBOARD);
      const dashData = response?.data ?? response;
      if (dashData) {
        stats = {
          predictedScore: dashData.predictedScore ?? dashData.stats?.predictedScore ?? 278,
          weeklyScoreChange: dashData.weeklyScoreChange ?? dashData.stats?.weeklyScoreChange ?? 12
        };
      }
    } catch {
      // Fallback
      stats = { predictedScore: 278, weeklyScoreChange: 12 };
    }
  }

  const shellRoot  = document.getElementById('shellRoot');
  const topbarRoot = document.getElementById('topbarRoot');

  if (shellRoot) {
    shellRoot.innerHTML = buildSidebarHTML(pageKey, user, stats);
  }

  if (topbarRoot) {
    topbarRoot.innerHTML = buildTopbarHTML(pageTitle, pageSubtitle, user, stats);
  }

  bindSidebarToggle();
  bindUpgradeButtons();
  bindTabLoader();
}

async function ensureUserProfile() {
  const existing = userStore.getState().profile;

  if (existing?.name || existing?.email) {
    return existing;
  }

  try {
    const response = await authService.getMe();
    const payload = response?.data?.data ?? response?.data ?? response;
    const user = payload?.user ?? payload;

    if (user) {
      userStore.setState({
        profile: user,
        token: userStore.getState().token || localStorage.getItem('access_token') || sessionStorage.getItem('access_token'),
        role: user.role ?? userStore.getState().role,
      });
      return user;
    }
  } catch {
    // Fall back to local token parse or whatever is stored
  }

  return existing;
}

// GUARD — redirect to login if not authenticated
function guardAuth() {
  const token =
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token');

  if (!token) {
    window.location.href = '/pages/login.html';
  }
}

// SIDEBAR MOBILE TOGGLE
function bindSidebarToggle() {
  const menuBtn = document.getElementById('topbarMenuBtn');
  const closeBtn = document.getElementById('sidebarCloseBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (!menuBtn || !sidebar || !overlay) return;

  function setMenuState(isOpen) {
    sidebar.classList.toggle('sidebar--open', isOpen);
    overlay.classList.toggle('sidebar-overlay--visible', isOpen);
    menuBtn.setAttribute('aria-expanded', String(isOpen));
    menuBtn.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('sidebar-is-open', isOpen);
  }

  function openSidebar() {
    setMenuState(true);
  }

  function closeSidebar() {
    setMenuState(false);
  }

  menuBtn.addEventListener('click', () => {
    const isOpen = sidebar.classList.contains('sidebar--open');
    isOpen ? closeSidebar() : openSidebar();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeSidebar);
  }

  overlay.addEventListener('click', closeSidebar);

  document.addEventListener('click', (e) => {
    const clickedInsideSidebar = sidebar.contains(e.target);
    const clickedMenu = menuBtn.contains(e.target);

    if (sidebar.classList.contains('sidebar--open') && !clickedInsideSidebar && !clickedMenu) {
      closeSidebar();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });
}

// UPGRADE BUTTONS
function bindUpgradeButtons() {
  const btns = document.querySelectorAll('#sidebarUpgradeBtn, #topbarUpgradeBtn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = '/pages/billing.html';
    });
  });
}

// PREMIUM TAB LOADING TRIGGER
function bindTabLoader() {
  let loader = document.getElementById('pageNavLoader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'pageNavLoader';
    loader.className = 'page-nav-loading-overlay';
    loader.innerHTML = `
      <div class="premium-spinner"></div>
      <div class="loading-logo-text">Loading Pillar...</div>
    `;
    document.body.appendChild(loader);
  }

  const navLinks = document.querySelectorAll('.nav-item, .sidebar-logo-link, .plan-upgrade-btn, .upgrade-card-btn, .plan-upgrade-btn');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      loader.classList.add('visible');
      setTimeout(() => {
        window.location.href = href;
      }, 450);
    });
  });
}