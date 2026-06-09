// Landing page logic
// Dynamic data, marquee, scroll reveal, counter animation, navbar scroll

// DATA

const UNIVERSITIES = [
  { name: 'UNILAG',   logo: '/logos/unilag.png'   },
  { name: 'UI',       logo: '/logos/ui.png'       },
  { name: 'OAU',      logo: '/logos/oau.png'      },
  { name: 'UNIBEN',   logo: '/logos/uniben.png'   },
  { name: 'UNN',      logo: '/logos/unn.png'      },
  { name: 'FUNAAB',   logo: '/logos/funaab.png'   },
  { name: 'UNIPORT',  logo: '/logos/uniport.png'  },
  { name: 'ABU',      logo: '/logos/abu.png'      },
  { name: 'UNILORIN', logo: '/logos/unilorin.png' },
  { name: 'LASU',     logo: '/logos/lasu.png'     },
  { name: 'FUTA',     logo: '/logos/futa.png'     },
  { name: 'UNIZIK',   logo: '/logos/unizik.png'   },
];

const FEATURES = [
  {
    icon: {
      bg: '#1a2e5a',
      svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" aria-hidden="true">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>`,
    },
    preview: '/images/solution-weak.png',
    title: 'Adaptive Learning',
    desc: 'Our AI identifies your weak spots and creates a personalized study path to fix them fast.',
  },
  {
    icon: {
      bg: '#0891b2',
      svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>`,
    },
    preview: '/images/solution-mock.png',
    title: 'CBT Simulation',
    desc: 'Practice with an interface identical to the official JAMB CBT environment to build exam-day confidence.',
  },
  {
    icon: {
      bg: '#059669',
      svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>`,
    },
    preview: '/images/feature-analytics.png',
    title: 'Performance Analytics',
    desc: 'Detailed breakdowns of your speed, accuracy, and subject-level mastery with beautiful chart.',
  },
  {
    icon: {
      bg: '#7c3aed',
      svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>`,
    },
    preview: '/images/feature-ai.png',
    title: 'AI Explanations',
    desc: 'Stuck on a question? Get instant, detailed step-by-step explanations powered by our proprietary AI tutor.',
  },
  {
    icon: {
      bg: '#b45309',
      svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" aria-hidden="true">
        <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/>
        <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
        <path d="M18 2H6v7a6 6 0 0012 0V2z"/>
      </svg>`,
    },
    preview: '/images/feature-gamification.png',
    title: 'Gamification',
    desc: 'Earn points, climb the leaderboard, and unlock badges. Study becomes as addictive as your favorite game.',
  },
  {
    icon: {
      bg: '#1a2e5a',
      svg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>`,
    },
    preview: '/images/feature-school.png',
    title: 'School Dashboard',
    desc: 'For administrators: Track the performance of all your students in real-time and provide targeted help.',
  },
];

const FOOTER_LINKS = [
  {
    title: 'Product',
    links: [
      { label: 'Features',    href: '#features'    },
      { label: 'Study Plans', href: '#study-plans' },
      { label: 'Mock Tests',  href: '#mock-tests'  },
      { label: 'Pricing',     href: '#pricing'     },
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

// INIT
function init() {
  renderMarquee();
  renderFeatures();
  renderPricing();
  renderFooterLinks();
  setCurrentYear();
  bindNavbar();
  bindHamburger();
  initScrollReveal();
  initCounterAnimation();
}


// MARQUEE 
// Duplicates items so the loop is seamless

function renderMarquee() {
  const track = document.getElementById('marqueeTrack');
  if (!track) return;

  // Build items for one full set
  function buildSet() {
    return UNIVERSITIES.map(({ name, logo }) => {
      const item = document.createElement('div');
      item.className = 'marquee-item';

      const img = document.createElement('img');
      img.src = logo;
      img.alt = '';             
      img.width = 24;
      img.height = 24;
      img.loading = 'lazy';
      // Graceful fallback if image not found
      img.onerror = () => { img.style.display = 'none'; };

      const label = document.createElement('span');
      label.textContent = name;

      item.appendChild(img);
      item.appendChild(label);
      return item;
    });
  }

  // Render two identical sets — CSS animation scrolls through first set
  // then seamlessly loops back from the identical second set
  const setA = buildSet();
  const setB = buildSet(); // duplicate for seamless loop
  const setC = buildSet(); // duplicate for seamless loop

  setA.forEach(el => track.appendChild(el));
  setB.forEach(el => track.appendChild(el));
  setC.forEach(el => track.appendChild(el));

  // Pause marquee when user prefers reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    track.style.animationPlayState = 'paused';
  }
}


// FEATURES 
function renderFeatures() {
  const grid = document.getElementById('featuresGrid');
  if (!grid) return;

  FEATURES.forEach((feature, index) => {
    const card = document.createElement('div');
    card.className = 'feature-card reveal';
    card.setAttribute('data-delay', String((index % 3) * 100));

    card.innerHTML = `
      <div class="feature-card-icon" style="background: ${feature.icon.bg};">
        ${feature.icon.svg}
      </div>
      <img
        class="feature-card-preview"
        src="${feature.preview}"
        alt="${feature.title} preview"
        loading="lazy"
      />
      <h3 class="feature-card-title">${feature.title}</h3>
      <p class="feature-card-desc">${feature.desc}</p>
    `;

    grid.appendChild(card);
  });
}

// PRICING — render cards dynamically

function renderPricing() {
  const grid = document.getElementById('pricingGrid');
  if (!grid) return;

  PRICING_PLANS.forEach((plan, index) => {
    const card = document.createElement('div');
    card.className = `pricing-card reveal${plan.featured ? ' featured' : ''}`;
    card.setAttribute('data-delay', String(index * 100));

    const checkColor = plan.featured ? 'rgba(255,255,255,0.9)' : '#16a34a';
    const crossColor = plan.featured ? 'rgba(255,255,255,0.35)' : '#d1d5db';

    const checkSVG = (color) => `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20 6L9 17l-5-5" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;

    const crossSVG = (color) => `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M18 6L6 18M6 6l12 12" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      </svg>`;

    const featuresHTML = plan.features.map(f => `
      <li class="pricing-feature">
        ${f.included ? checkSVG(checkColor) : crossSVG(crossColor)}
        ${f.text}
      </li>
    `).join('');

    const btnClass = plan.featured
      ? 'btn btn-cta pricing-cta'
      : 'btn btn-outline pricing-cta';

    card.innerHTML = `
      ${plan.badge ? `<div class="pricing-badge">${plan.badge}</div>` : ''}
      <p class="pricing-name">${plan.name}</p>
      <p class="pricing-price">${plan.price}</p>
      <p class="pricing-period">${plan.period}</p>
      <ul class="pricing-features" role="list">
        ${featuresHTML}
      </ul>
      <a href="${plan.cta.href}" class="${btnClass}">
        ${plan.cta.label}
      </a>
    `;

    grid.appendChild(card);
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

// NAVBAR — scroll shadow + active link highlight
function bindNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateNavbar() {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Highlight active nav section
    highlightActiveNavLink();

    lastScrollY = window.scrollY;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateNavbar);
      ticking = true;
    }
  }, { passive: true });
}

//Active nav link based on scroll position
function highlightActiveNavLink() {
  const sections = ['hero', 'how-it-works', 'features', 'pricing'];
  const navLinks = document.querySelectorAll('.nav-link');

  let currentSection = '';

  sections.forEach(id => {
    const section = document.getElementById(id);
    if (!section) return;
    const rect = section.getBoundingClientRect();
    if (rect.top <= 120) currentSection = id;
  });

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === `#${currentSection}`) {
      link.style.color = 'var(--pillar-navy)';
      link.style.fontWeight = '600';
    } else {
      link.style.color = '';
      link.style.fontWeight = '';
    }
  });
}

// HAMBURGER — mobile menu toggle
function bindHamburger() {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
  });

  // Close on mobile link click
  mobileMenu.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    const navbarWrapper = document.querySelector('.navbar-wrapper');
    if (navbarWrapper && !navbarWrapper.contains(e.target)) {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    }
  });
}

// SCROLL REVEAL — Intersection Observer

function initScrollReveal() {
  // Skip if reduced motion preferred
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Stop observing after reveal — no need to re-trigger
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  // Observe all .reveal elements (including dynamically added ones)
  // Use a MutationObserver to catch elements added after initial render
  function observeRevealElements() {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
      observer.observe(el);
    });
  }

  observeRevealElements();

  // Watch for new elements (features cards rendered by JS)
  const mutationObserver = new MutationObserver(() => {
    observeRevealElements();
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// COUNTER ANIMATION — hero stats count up
function initCounterAnimation() {
  const counterEls = document.querySelectorAll('.stat-num[data-target]');
  if (!counterEls.length) return;

  // Skip animation if reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    counterEls.forEach(el => {
      el.textContent = formatNumber(Number(el.dataset.target));
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counterEls.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target    = Number(el.dataset.target);
  const duration  = 1800; // ms
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = Math.round(eased * target);

    el.textContent = formatNumber(current);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

function formatNumber(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 0) + 'k';
  }
  return String(num);
}

// BOOT
init();

