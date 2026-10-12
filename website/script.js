/* ============================================================
   THE 2AM SHOPPERS — Website JS (v3)
   ============================================================ */

/* ── Nav scroll + mobile toggle ── */
const nav       = document.getElementById('nav');
const navToggle = document.getElementById('nav-toggle');
const navLinks  = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

navToggle?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
  const spans = navToggle.querySelectorAll('span');
  if (open) {
    spans[0].style.transform = 'translateY(7px) rotate(45deg)';
    spans[1].style.opacity   = '0';
    spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
  } else {
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});

navLinks?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
    navToggle?.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  });
});

/* ── Active nav highlight ── */
const sections = document.querySelectorAll('section[id]');
const navObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks?.querySelectorAll('a').forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`);
      });
    }
  });
}, { rootMargin: '-40% 0px -50% 0px' });
sections.forEach(s => navObserver.observe(s));

const activeStyle = document.createElement('style');
activeStyle.textContent = `.nav-links a.active { color: #a78bfa !important; }`;
document.head.appendChild(activeStyle);

/* ── Scroll fade-in ── */
const ANIMATE = [
  '.pain-card', '.mode-card', '.route-card', '.metric-card',
  '.savings-variant', '.save-step', '.j-step', '.scope-col',
  '.section-title', '.section-desc', '.guiding-rule', '.savings-formula',
  '.journey-rule', '.conn-status',
];
ANIMATE.forEach(sel => {
  document.querySelectorAll(sel).forEach((el, i) => {
    el.classList.add('fade-in');
    el.style.transitionDelay = `${i * 50}ms`;
  });
});
const fadeObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); fadeObs.unobserve(e.target); }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.fade-in').forEach(el => fadeObs.observe(el));

/* ── Typewriter on hero subtitle ── */
const heroSub = document.querySelector('.hero-sub');
if (heroSub) {
  const text = heroSub.textContent;
  heroSub.textContent = '';
  heroSub.style.borderRight = '2px solid #a78bfa';
  let i = 0;
  setTimeout(() => {
    const t = setInterval(() => {
      heroSub.textContent = text.slice(0, ++i);
      if (i >= text.length) { clearInterval(t); setTimeout(() => heroSub.style.borderRight = 'none', 500); }
    }, 28);
  }, 500);
}

/* ── Smooth scroll with nav offset ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = (nav?.offsetHeight ?? 64) + 16;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    setTimeout(() => document.getElementById('signin-username')?.focus?.(), 600);
  });
});

/* ============================================================
   AUTH SECTION
   ============================================================ */

let currentRole = 'student'; // 'student' | 'working' | 'business'
const AUTH_KEY  = '2am-shoppers-auth';

/* ── Tab switching ── */
window.switchTab = function(tab) {
  ['signin', 'signup'].forEach(key => {
    const panel = document.getElementById(`panel-${key}`);
    const tabEl = document.getElementById(`tab-${key}`);
    const isActive = key === tab;
    panel?.classList.toggle('auth-hidden', !isActive);
    tabEl?.classList.toggle('auth-tab-active', isActive);
    tabEl?.setAttribute('aria-selected', String(isActive));
  });
  clearError('signin-error');
  clearError('signup-error');
};

/* ── Role toggle — 3 roles ── */
window.setRole = function(role) {
  currentRole = role;
  ['student', 'working', 'business'].forEach(r => {
    document.getElementById(`role-${r}`)?.classList.toggle('role-active', r === role);
  });
};

/* ── Password visibility ── */
window.togglePass = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isText = input.type === 'text';
  input.type    = isText ? 'password' : 'text';
  btn.textContent = isText ? '👁️' : '🙈';
};

/* ── Account helpers ── */
function loadAccounts() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return JSON.parse(raw)?.state?.accounts ?? seedAccounts();
  } catch { return seedAccounts(); }
}

function seedAccounts() {
  return [{
    id: 'admin-001', username: 'user', password: 'password',
    email: 'admin@2amshoppers.com', name: 'Admin', role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  }];
}

function saveAccount(account) {
  try {
    const raw      = localStorage.getItem(AUTH_KEY);
    const existing = raw ? JSON.parse(raw) : { state: { accounts: [] }, version: 0 };
    if (!existing.state)          existing.state = {};
    if (!existing.state.accounts) existing.state.accounts = seedAccounts();
    existing.state.accounts.push(account);
    localStorage.setItem(AUTH_KEY, JSON.stringify(existing));
  } catch (e) { console.warn('Auth write failed:', e); }
}

function setSession(account) {
  try {
    const raw      = localStorage.getItem(AUTH_KEY);
    const existing = raw ? JSON.parse(raw) : { state: {}, version: 0 };
    existing.state.currentUser = account;
    existing.state.isLoggedIn  = true;
    localStorage.setItem(AUTH_KEY, JSON.stringify(existing));
  } catch (e) { console.warn('Session write failed:', e); }
}

function showSuccess(name, isNew) {
  ['panel-signin', 'panel-signup'].forEach(id => document.getElementById(id)?.classList.add('auth-hidden'));
  const successEl = document.getElementById('auth-success');
  if (successEl) successEl.classList.remove('auth-hidden');
  const titleEl = document.getElementById('auth-success-title');
  const subEl   = document.getElementById('auth-success-sub');
  if (titleEl) titleEl.textContent = isNew ? `Welcome, ${name}! 🎉` : `Welcome back, ${name}!`;
  if (subEl)   subEl.textContent   = 'Your account is ready. Click below to open the app.';
  setTimeout(() => window.open('http://localhost:3003', '_blank', 'noopener'), 1500);
}

function showError(id, msg) { const el = document.getElementById(id); if (el) el.textContent = msg; }
function clearError(id)     { const el = document.getElementById(id); if (el) el.textContent = ''; }

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) { btn.dataset.orig = btn.textContent; btn.textContent = 'Please wait…'; }
  else         { btn.textContent = btn.dataset.orig ?? btn.textContent; }
}

/* ── Sign-in ── */
window.handleSignin = function(e) {
  e.preventDefault();
  clearError('signin-error');
  const username = document.getElementById('signin-username')?.value.trim();
  const password = document.getElementById('signin-password')?.value;
  if (!username || !password) { showError('signin-error', 'Please fill in all fields.'); return; }

  setLoading('signin-btn', true);
  setTimeout(() => {
    const accounts = loadAccounts();
    const account  = accounts.find(a =>
      a.username.toLowerCase() === username.toLowerCase() && a.password === password
    );
    setLoading('signin-btn', false);
    if (!account) {
      showError('signin-error', 'Incorrect username or password.');
      const input = document.getElementById('signin-username');
      input?.classList.add('input-shake');
      setTimeout(() => input?.classList.remove('input-shake'), 500);
      return;
    }
    setSession(account);
    showSuccess(account.name ?? account.username, false);
  }, 500);
};

/* ── Sign-up ── */
window.handleSignup = function(e) {
  e.preventDefault();
  clearError('signup-error');
  const username = document.getElementById('signup-username')?.value.trim();
  const email    = document.getElementById('signup-email')?.value.trim();
  const password = document.getElementById('signup-password')?.value;
  const confirm  = document.getElementById('signup-confirm')?.value;

  if (!username)         { showError('signup-error', 'Username is required.'); return; }
  if (!password)         { showError('signup-error', 'Password is required.'); return; }
  if (password.length<6) { showError('signup-error', 'Password must be at least 6 characters.'); return; }
  if (password !== confirm) { showError('signup-error', 'Passwords do not match.'); return; }

  setLoading('signup-btn', true);
  setTimeout(() => {
    const accounts = loadAccounts();
    if (accounts.find(a => a.username.toLowerCase() === username.toLowerCase())) {
      setLoading('signup-btn', false);
      showError('signup-error', 'That username is already taken.');
      return;
    }
    const newAccount = {
      id:        (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
      username, password, email: email ?? '',
      name:      username, role: currentRole,
      createdAt: new Date().toISOString(),
    };
    saveAccount(newAccount);
    setSession(newAccount);
    setLoading('signup-btn', false);
    showSuccess(newAccount.name, true);
  }, 500);
};

/* ── Shake animation ── */
(function() {
  const s = document.createElement('style');
  s.textContent = `
    @keyframes inputShake {
      0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)}
      40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)}
    }
    .input-shake { animation: inputShake .4s ease; }
  `;
  document.head.appendChild(s);
})();

/* ── Budget calc rows: hover highlight ── */
document.querySelectorAll('.budget-row').forEach(row => {
  row.addEventListener('mouseenter', () => row.style.background = 'rgba(255,255,255,.03)');
  row.addEventListener('mouseleave', () => row.style.background = '');
});

/* ── Mode cards: accent glow on hover ── */
const modeGlows = {
  'mode-student':  '0 0 0 1px rgba(124,58,237,.4), 0 8px 24px rgba(124,58,237,.12)',
  'mode-working':  '0 0 0 1px rgba(240,78,110,.4), 0 8px 24px rgba(240,78,110,.12)',
  'mode-business': '0 0 0 1px rgba(245,158,11,.4), 0 8px 24px rgba(245,158,11,.12)',
};
document.querySelectorAll('.mode-card').forEach(card => {
  const cls = [...card.classList].find(c => modeGlows[c]);
  if (!cls) return;
  card.addEventListener('mouseenter', () => { card.style.boxShadow = modeGlows[cls]; });
  card.addEventListener('mouseleave', () => { card.style.boxShadow = ''; });
});

/* ── Logo click: scroll to top ── */
document.querySelector('.nav-logo')?.addEventListener('click', e => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
