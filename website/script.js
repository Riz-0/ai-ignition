/* ============================================================
   THE 2AM SHOPPERS — Presentation Website JS
   ============================================================ */

/* ---------- Nav: scroll shadow + mobile toggle ---------- */
const nav       = document.getElementById('nav');
const navToggle = document.getElementById('nav-toggle');
const navLinks  = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
  const spans = navToggle.querySelectorAll('span');
  if (open) {
    spans[0].style.transform = 'translateY(7px) rotate(45deg)';
    spans[1].style.opacity   = '0';
    spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
  } else {
    spans.forEach((s) => { s.style.transform = ''; s.style.opacity = ''; });
  }
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.querySelectorAll('span').forEach((s) => { s.style.transform = ''; s.style.opacity = ''; });
  });
});

/* ---------- Active nav link on scroll ---------- */
const sections = document.querySelectorAll('section[id]');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      navLinks.querySelectorAll('a').forEach((a) => {
        a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`);
      });
    }
  });
}, { rootMargin: '-40% 0px -50% 0px' });

sections.forEach((s) => navObserver.observe(s));

const activeStyle = document.createElement('style');
activeStyle.textContent = `.nav-links a.active { color: #ff8fa3 !important; }`;
document.head.appendChild(activeStyle);

/* ---------- Scroll fade-in for all key elements ---------- */
const ANIMATE_SELECTORS = [
  '.pain-card', '.step-card', '.approach-card', '.metric-card',
  '.view-card', '.inspo-chip', '.notif-bubble', '.journey-step',
  '.proc-step', '.scope-col', '.section-title', '.section-desc',
  '.example-block', '.simple-example', '.team-connection',
  '.pilot-note', '.demo-focus',
];

ANIMATE_SELECTORS.forEach((sel) => {
  document.querySelectorAll(sel).forEach((el, i) => {
    el.classList.add('fade-in');
    el.style.transitionDelay = `${i * 55}ms`;
  });
});

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-in').forEach((el) => fadeObserver.observe(el));

/* ---------- Typewriter on hero subtitle ---------- */
const heroSub = document.querySelector('.hero-sub');
if (heroSub) {
  const text = heroSub.textContent;
  heroSub.textContent = '';
  heroSub.style.borderRight = '2px solid #ff8fa3';
  let i = 0;
  setTimeout(() => {
    const t = setInterval(() => {
      heroSub.textContent = text.slice(0, ++i);
      if (i >= text.length) {
        clearInterval(t);
        setTimeout(() => { heroSub.style.borderRight = 'none'; }, 500);
      }
    }, 30);
  }, 500);
}

/* ---------- Notification bubbles — staggered entrance ---------- */
const notifBubbles = document.querySelectorAll('.notif-bubble');
const notifObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    notifBubbles.forEach((b, i) => {
      setTimeout(() => {
        b.style.opacity   = '1';
        b.style.transform = 'translateX(0)';
      }, i * 220);
    });
    notifObserver.disconnect();
  }
}, { threshold: 0.3 });

notifBubbles.forEach((b) => {
  b.style.opacity   = '0';
  b.style.transform = 'translateX(-20px)';
  b.style.transition = 'opacity .45s ease, transform .45s ease';
});
if (notifBubbles.length) notifObserver.observe(notifBubbles[0].parentElement);

/* ---------- Journey steps — sequential highlight on scroll ---------- */
const journeySteps = document.querySelectorAll('.journey-step');
const journeyObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    journeySteps.forEach((step, i) => {
      setTimeout(() => step.classList.add('visible'), i * 80);
    });
    journeyObserver.disconnect();
  }
}, { threshold: 0.1 });

if (journeySteps.length) journeyObserver.observe(journeySteps[0].closest('.journey-timeline'));

/* ---------- Smooth scroll with nav offset ---------- */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = nav.offsetHeight + 16;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  });
});

/* ---------- Process steps — click to tick ---------- */
document.querySelectorAll('.proc-step').forEach((step) => {
  step.style.cursor = 'pointer';
  step.title = 'Click to mark done';
  step.addEventListener('click', () => {
    const done = step.classList.toggle('step-done');
    step.style.opacity          = done ? '0.45' : '';
    step.style.textDecoration   = done ? 'line-through' : '';
    step.style.borderLeftColor  = done ? 'var(--green-light)' : '';
    step.style.borderLeftWidth  = done ? '3px' : '';
    step.style.paddingLeft      = done ? '15px' : '';
  });
});

/* ---------- Logo scroll to top ---------- */
document.querySelector('.nav-logo')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ---------- Approach cards — interactive response demo ---------- */
// Map each response in the adaptation table to a colour signal
const approachCards = document.querySelectorAll('.approach-card');
approachCards.forEach((card) => {
  card.addEventListener('mouseenter', () => {
    card.style.boxShadow = '0 0 0 1px rgba(240,78,110,.4), 0 8px 24px rgba(240,78,110,.12)';
  });
  card.addEventListener('mouseleave', () => {
    card.style.boxShadow = '';
  });
});

/* ---------- Inspirations: hover glow ---------- */
document.querySelectorAll('.inspo-chip').forEach((chip) => {
  chip.addEventListener('mouseenter', () => {
    chip.style.background = 'rgba(240,78,110,.08)';
  });
  chip.addEventListener('mouseleave', () => {
    chip.style.background = '';
  });
});

/* ============================================================
   AUTH SECTION — tab switching, form logic, account storage
   ============================================================ */

// ── State ──────────────────────────────────────────────────
let currentRole = 'student'; // 'student' | 'working'

// ── Tab switching ──────────────────────────────────────────
window.switchTab = function (tab) {
  const panels = { signin: 'panel-signin', signup: 'panel-signup' };
  const tabs   = { signin: 'tab-signin',   signup: 'tab-signup'   };

  Object.keys(panels).forEach(key => {
    const panel = document.getElementById(panels[key]);
    const tabEl = document.getElementById(tabs[key]);
    if (!panel || !tabEl) return;
    if (key === tab) {
      panel.classList.remove('auth-hidden');
      tabEl.classList.add('auth-tab-active');
      tabEl.setAttribute('aria-selected', 'true');
    } else {
      panel.classList.add('auth-hidden');
      tabEl.classList.remove('auth-tab-active');
      tabEl.setAttribute('aria-selected', 'false');
    }
  });

  // Clear errors when switching
  clearError('signin-error');
  clearError('signup-error');
};

// ── Role toggle ────────────────────────────────────────────
window.setRole = function (role) {
  currentRole = role;
  document.getElementById('role-customer')?.classList.toggle('role-active', role === 'student');
  document.getElementById('role-merchant')?.classList.toggle('role-active', role === 'working');
};

// ── Password visibility toggle ─────────────────────────────
window.togglePass = function (inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isText = input.type === 'text';
  input.type    = isText ? 'password' : 'text';
  btn.textContent = isText ? '👁️' : '🙈';
};

// ── Account storage (mirrors the app's Zustand auth store) ─
// Reads/writes from the same localStorage key so accounts created
// on the website are immediately usable in the app.
const AUTH_KEY = '2am-shoppers-auth';

function loadAccounts() {
  try {
    const raw   = localStorage.getItem(AUTH_KEY);
    const state = raw ? JSON.parse(raw) : null;
    return state?.state?.accounts ?? [
      // Seed admin if store not yet initialised by the app
      {
        id:        'admin-001',
        username:  'user',
        password:  'password',
        email:     'admin@2amshoppers.com',
        name:      'Admin',
        role:      'admin',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];
  } catch { return []; }
}

function saveAccount(account) {
  try {
    const raw      = localStorage.getItem(AUTH_KEY);
    const existing = raw ? JSON.parse(raw) : { state: { accounts: [] }, version: 0 };
    if (!existing.state) existing.state = { accounts: [] };
    if (!existing.state.accounts) existing.state.accounts = [];
    existing.state.accounts.push(account);
    localStorage.setItem(AUTH_KEY, JSON.stringify(existing));
  } catch (e) {
    console.warn('Could not write to auth store:', e);
  }
}

function setSession(account) {
  try {
    const raw      = localStorage.getItem(AUTH_KEY);
    const existing = raw ? JSON.parse(raw) : { state: {}, version: 0 };
    existing.state.currentUser = account;
    existing.state.isLoggedIn  = true;
    localStorage.setItem(AUTH_KEY, JSON.stringify(existing));
  } catch (e) {
    console.warn('Could not write session:', e);
  }
}

// ── Show success state ──────────────────────────────────────
function showSuccess(name, isNew) {
  const panel = document.getElementById('auth-success');
  const title = document.getElementById('auth-success-title');
  const sub   = document.getElementById('auth-success-sub');
  if (!panel || !title || !sub) return;

  // Hide form panels
  document.getElementById('panel-signin')?.classList.add('auth-hidden');
  document.getElementById('panel-signup')?.classList.add('auth-hidden');
  document.getElementById('auth-success')?.classList.remove('auth-hidden');

  title.textContent = isNew
    ? `Welcome, ${name}! 🎉`
    : `Welcome back, ${name}!`;

  sub.textContent = 'Your account is ready. Click below to open the app.';

  // Auto-attempt redirect after 1.5 s
  setTimeout(() => {
    window.open('http://localhost:3003', '_blank', 'noopener');
  }, 1500);
}

// ── Error helpers ───────────────────────────────────────────
function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = '';
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.original = btn.textContent;
    btn.textContent = 'Please wait…';
  } else {
    btn.textContent = btn.dataset.original ?? btn.textContent;
  }
}

// ── Sign-in handler ─────────────────────────────────────────
window.handleSignin = function (e) {
  e.preventDefault();
  clearError('signin-error');

  const username = document.getElementById('signin-username')?.value.trim();
  const password = document.getElementById('signin-password')?.value;

  if (!username || !password) {
    showError('signin-error', 'Please fill in all fields.');
    return;
  }

  setLoading('signin-btn', true);

  setTimeout(() => {
    const accounts = loadAccounts();
    const account  = accounts.find(
      a => a.username.toLowerCase() === username.toLowerCase()
        && a.password === password
    );

    setLoading('signin-btn', false);

    if (!account) {
      showError('signin-error', 'Incorrect username or password.');
      // Shake animation on the input
      const input = document.getElementById('signin-username');
      input?.classList.add('input-shake');
      setTimeout(() => input?.classList.remove('input-shake'), 500);
      return;
    }

    setSession(account);
    showSuccess(account.name ?? account.username, false);
  }, 500);
};

// ── Sign-up handler ─────────────────────────────────────────
window.handleSignup = function (e) {
  e.preventDefault();
  clearError('signup-error');

  const username = document.getElementById('signup-username')?.value.trim();
  const email    = document.getElementById('signup-email')?.value.trim();
  const password = document.getElementById('signup-password')?.value;
  const confirm  = document.getElementById('signup-confirm')?.value;

  if (!username) { showError('signup-error', 'Username is required.'); return; }
  if (!password) { showError('signup-error', 'Password is required.'); return; }
  if (password.length < 6) { showError('signup-error', 'Password must be at least 6 characters.'); return; }
  if (password !== confirm) { showError('signup-error', 'Passwords do not match.'); return; }

  setLoading('signup-btn', true);

  setTimeout(() => {
    const accounts = loadAccounts();
    const taken    = accounts.find(a => a.username.toLowerCase() === username.toLowerCase());

    if (taken) {
      setLoading('signup-btn', false);
      showError('signup-error', 'That username is already taken. Choose another.');
      return;
    }

    const newAccount = {
      id:        crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      username,
      password,
      email:     email ?? '',
      name:      username,
      role:      currentRole,
      createdAt: new Date().toISOString(),
    };

    saveAccount(newAccount);
    setSession(newAccount);
    setLoading('signup-btn', false);
    showSuccess(newAccount.name, true);
  }, 500);
};

// ── Shake animation style injection ────────────────────────
(function injectShakeStyle() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes inputShake {
      0%,100% { transform: translateX(0); }
      20%      { transform: translateX(-6px); }
      40%      { transform: translateX(6px); }
      60%      { transform: translateX(-4px); }
      80%      { transform: translateX(4px); }
    }
    .input-shake { animation: inputShake .4s ease; }
  `;
  document.head.appendChild(style);
})();

// ── Auto-scroll "Get started" nav buttons to section ───────
document.querySelectorAll('a[href="#get-started"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.getElementById('get-started');
    if (!target) return;
    const offset = document.getElementById('nav')?.offsetHeight ?? 64;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset - 16, behavior: 'smooth' });
    // Focus the first input after scroll
    setTimeout(() => {
      document.getElementById('signin-username')?.focus();
    }, 600);
  });
});
