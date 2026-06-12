// src/components/shell.js
// Shared dashboard shell — sidebar + topbar
// Used by: dashboard, study-session, mock-tests pages
// Call initShell(pageKey) on every dashboard page

import { userStore }   from '../store/userStore.js';
import { authService } from '../services/auth.service.js';

// NAV ITEMS DATA
const NAV_ITEMS = [
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
    label: 'Mock Test',
    href:  '/pages/mock-tests.html',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
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
  {
    key:   'ai-tutor',
    label: 'AI Tutor',
    href:  '/pages/ai-tutor.html',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v4l3 3"/>
    </svg>`,
    badge: { text: 'PRO', type: 'pro' },
  },
  {
    key:   'study-planner',
    label: 'Study Planner',
    href:  '/pages/study-planner.html',
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
function buildSidebarHTML(activeKey, user) {
  const initials = getInitials(user?.name || 'User');

  const navItemsHTML = NAV_ITEMS.map(item => {
    const isActive = item.key === activeKey;
    const badgeHTML = item.badge
      ? `<span class="nav-badge nav-badge--${item.badge.type}">${item.badge.text}</span>`
      : '';

    return `
      <li>
        <a
          href="${item.href}"
          class="nav-item ${isActive ? 'nav-item--active' : ''}"
          aria-current="${isActive ? 'page' : 'false'}"
        >
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
          <img src="/icon/logo.png" width="22" height="22">
          <span>Pillar</span>
        </a>
        <button type="button" class="sidebar-close-btn" id="sidebarCloseBtn" aria-label="Close navigation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <ul class="nav-list" role="list">
          ${navItemsHTML}
        </ul>
      </nav>

      <div class="sidebar-bottom">
        <a href="/pages/settings.html" class="nav-item nav-item--settings">
          <span class="nav-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </span>
          <span class="nav-item-label">Settings</span>
        </a>

        <div class="sidebar-upgrade-card">
          <div class="upgrade-card-icon" aria-hidden="true"><img src="/icon/energy-icon.png"></div>
          <p class="upgrade-card-title">Upgrade to Pro</p>
          <p class="upgrade-card-desc">Unlock AI Tutor, unlimited sessions, and more</p>
          <button type="button" class="upgrade-card-btn" id="sidebarUpgradeBtn">
            Upgrade Now
          </button>
        </div>
      </div>
    </aside>

    <div class="sidebar-overlay" id="sidebarOverlay" aria-hidden="true"></div>
  `;
}

function buildTopbarHTML(pageTitle, pageSubtitle, user) {
  const initials = getInitials(user?.name || 'User');
  const firstName = (user?.name || 'User').split(' ')[0];
  const plan = user?.subscription?.plan || 'free';
  const isPro = plan === 'pro';

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
        <div class="topbar-plan">
          <span class="plan-label">${isPro ? 'PRO PLAN' : 'FREE PLAN'}</span>
          ${!isPro ? `
            <button type="button" class="plan-upgrade-btn" id="topbarUpgradeBtn">
              Upgrade to Pro
            </button>
          ` : ''}
        </div>

        <div class="topbar-user">
          <div class="user-avatar" aria-hidden="true">${initials}</div>
          <div class="user-info">
            <p class="user-name">${user?.name || 'Student'}</p>
            <p class="user-role">Student</p>
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
export function initShell(pageKey, pageTitle, pageSubtitle) {
  guardAuth();

  const user       = userStore.getState().profile;
  const shellRoot  = document.getElementById('shellRoot');
  const topbarRoot = document.getElementById('topbarRoot');

  if (!shellRoot) return;

  shellRoot.innerHTML = buildSidebarHTML(pageKey, user);

  if (topbarRoot) {
    topbarRoot.innerHTML = buildTopbarHTML(pageTitle, pageSubtitle, user);
  }

  bindSidebarToggle();
  bindUpgradeButtons();
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
      window.location.href = '/pages/pricing.html';
    });
  });
}