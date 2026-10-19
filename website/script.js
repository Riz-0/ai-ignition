/* ============================================================
   THE 2AM SHOPPERS — Website JS (v4)
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
  '.eslitec-card', '.loop-card', '.get-app-platform',
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
// The typewriter runs after translations are applied (see i18n section below).

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
   DARK / LIGHT THEME
   ============================================================ */
const THEME_KEY = '2am-shoppers-website-theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('nav-theme-btn');
  if (btn) btn.textContent = theme === 'light' ? '🌙' : '☀️';
  btn?.setAttribute('title', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
  localStorage.setItem(THEME_KEY, theme);
}

// On load, apply saved or default theme
applyTheme(localStorage.getItem(THEME_KEY) || 'dark');

document.getElementById('nav-theme-btn')?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ============================================================
   TRANSLATIONS (EN / JA / ZH / TH)
   ============================================================ */
const LANG_META = {
  en: { flag: '🇬🇧', label: 'EN', name: 'English' },
  ja: { flag: '🇯🇵', label: 'JA', name: '日本語'   },
  zh: { flag: '🇨🇳', label: 'ZH', name: '中文'     },
  th: { flag: '🇹🇭', label: 'TH', name: 'ไทย'      },
};

const WEBSITE_TRANS = {
  en: {
    heroBadge:       'Eslitec Hackathon · Problem Statement 1 · One Less Thing',
    heroTitle:       '2am Shoppers',
    heroSub:         'One app for thoughtful shopping, savings goals and personalised customer conversations.',
    heroDesc:        'Students get a weekly budget and goal pockets. Working adults get monthly planning and smart reminders. Businesses get retention tools that respect their customers\' preferences.',
    heroCta1:        'Explore the three modes',
    heroCta2:        'Get started free',
    modeStudent:     '🎓 Student',
    modeWorking:     '💼 Working Adult',
    modeBusiness:    '🏪 Business',
    problemTitle:    'Scattered shopping. Generic promotions. No savings plan.',
    problemDesc:     'Students and working adults shop across multiple platforms, forget saved products and have no single view of budget versus spending. Businesses hold customer data but can\'t turn it into relevant conversations.',
    getStartedTitle: 'Ready to shop smarter?',
    getStartedDesc:  'Create a free account — choose Student, Working Adult or Business to get started.',
    pitchQuote:      'The 2am Shoppers brings shopping, savings goals and personalised customer conversations into one app. Students get a simple, optionally gamified budgeting experience; working adults get practical spending and savings planning; businesses get tools to market their own products and support returning customers.',
    signIn:          'Sign in',
    getStarted:      'Get started',
    getTheApp:       'Get the app',
  },
  ja: {
    heroBadge:       'Eslitec ハッカソン · 課題1 · One Less Thing',
    heroTitle:       '2am Shoppers',
    heroSub:         'お買い物・貯金目標・パーソナライズされた会話を一つに。',
    heroDesc:        '学生は週の予算と貯金ポケット。社会人は月の計画とリマインダー。事業者は顧客のプライバシーを守るリテンションツール。',
    heroCta1:        '3つのモードを見る',
    heroCta2:        '無料ではじめる',
    modeStudent:     '🎓 学生',
    modeWorking:     '💼 社会人',
    modeBusiness:    '🏪 事業者',
    problemTitle:    'バラバラなショッピング、画一的なプロモーション、貯金計画なし。',
    problemDesc:     '学生や社会人は複数のプラットフォームをまたいで買い物し、保存した商品を忘れ、予算と支出を一元管理できていません。事業者は顧客データを持ちながら、関連性のある会話につなげられていません。',
    getStartedTitle: 'かしこく買い物しよう',
    getStartedDesc:  '無料アカウントを作成 — 学生・社会人・事業者から選んでください。',
    pitchQuote:      '2am Shoppersはショッピング・貯金目標・パーソナライズされた顧客会話を一つのアプリに集約します。学生にはシンプルで楽しい予算管理体験を。社会人には実践的な支出・貯金プランを。事業者には既存顧客をサポートし繰り返し購入を促すツールを。',
    signIn:          'サインイン',
    getStarted:      'はじめる',
    getTheApp:       'アプリを入手',
  },
  zh: {
    heroBadge:       'Eslitec 黑客马拉松 · 问题陈述1 · One Less Thing',
    heroTitle:       '2am Shoppers',
    heroSub:         '一个应用，整合购物、储蓄目标与个性化客户对话。',
    heroDesc:        '学生获得每周预算和储蓄目标。上班族获得月度计划和智能提醒。企业获得尊重客户偏好的客户留存工具。',
    heroCta1:        '探索三种模式',
    heroCta2:        '免费开始',
    modeStudent:     '🎓 学生',
    modeWorking:     '💼 上班族',
    modeBusiness:    '🏪 商家',
    problemTitle:    '购物分散。推送千篇一律。没有储蓄计划。',
    problemDesc:     '学生和上班族在多个平台购物，忘记已保存的商品，没有统一的预算视图。企业掌握客户数据，却无法转化为有关联的对话。',
    getStartedTitle: '准备好更聪明地购物了吗？',
    getStartedDesc:  '创建免费账户 — 选择学生、上班族或商家即可开始。',
    pitchQuote:      '2am Shoppers 将购物、储蓄目标与个性化客户对话整合到一个应用中。学生获得简单、可选游戏化的预算体验；上班族获得实用的支出和储蓄规划；企业获得工具来营销自己的产品并支持回头客。',
    signIn:          '登录',
    getStarted:      '开始使用',
    getTheApp:       '获取应用',
  },
  th: {
    heroBadge:       'Eslitec Hackathon · แนวคิดที่ 1 · One Less Thing',
    heroTitle:       '2am Shoppers',
    heroSub:         'แอปเดียวสำหรับช้อปอย่างฉลาด ออมเพื่อเป้าหมาย และการสนทนาที่เป็นส่วนตัว',
    heroDesc:        'นักเรียนได้งบประมาณรายสัปดาห์และกระเป๋าออม คนทำงานได้แผนรายเดือนและแจ้งเตือนอัจฉริยะ ธุรกิจได้เครื่องมือรักษาลูกค้าที่เคารพความเป็นส่วนตัว',
    heroCta1:        'สำรวจสามโหมด',
    heroCta2:        'เริ่มต้นฟรี',
    modeStudent:     '🎓 นักเรียน',
    modeWorking:     '💼 คนทำงาน',
    modeBusiness:    '🏪 ธุรกิจ',
    problemTitle:    'ช้อปกระจัดกระจาย โปรโมชั่นซ้ำซาก ไม่มีแผนออม',
    problemDesc:     'นักเรียนและคนทำงานช้อปบนหลายแพลตฟอร์ม ลืมสินค้าที่บันทึกไว้ และไม่มีมุมมองรวมของงบประมาณ ธุรกิจมีข้อมูลลูกค้าแต่ไม่สามารถสร้างการสนทนาที่ตรงใจได้',
    getStartedTitle: 'พร้อมช้อปอย่างฉลาดแล้วหรือยัง?',
    getStartedDesc:  'สร้างบัญชีฟรี — เลือก นักเรียน คนทำงาน หรือธุรกิจ เพื่อเริ่มต้น',
    pitchQuote:      '2am Shoppers รวมการช้อปปิ้ง เป้าหมายออม และการสนทนาลูกค้าเฉพาะบุคคลไว้ในแอปเดียว นักเรียนได้ประสบการณ์งบประมาณที่สนุก คนทำงานได้แผนการใช้จ่ายและออม ธุรกิจได้เครื่องมือทำการตลาดและสนับสนุนลูกค้าที่กลับมา',
    signIn:          'เข้าสู่ระบบ',
    getStarted:      'เริ่มต้น',
    getTheApp:       'รับแอป',
  },
};

const LANG_KEY = '2am-shoppers-website-lang';
let currentLang = localStorage.getItem(LANG_KEY) || 'en';

function applyTranslations(lang) {
  const t = WEBSITE_TRANS[lang] ?? WEBSITE_TRANS.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.textContent = t[key];
  });
  // Update html lang attribute for accessibility
  document.documentElement.lang = lang;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  applyTranslations(lang);
  // Update trigger button
  const meta = LANG_META[lang];
  if (meta) {
    const flagEl  = document.getElementById('nav-lang-flag');
    const labelEl = document.getElementById('nav-lang-label');
    if (flagEl)  flagEl.textContent  = meta.flag;
    if (labelEl) labelEl.textContent = meta.label;
  }
  // Highlight active option
  document.querySelectorAll('.nav-lang-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.lang === lang);
  });
  // Run typewriter again with new text if hero is visible
  const heroSub = document.querySelector('.hero-sub');
  if (heroSub) startTypewriter(heroSub);
}

// Language dropdown toggle
const langTrigger  = document.getElementById('nav-lang-trigger');
const langDropdown = document.getElementById('nav-lang-dropdown');

langTrigger?.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = langDropdown.classList.toggle('open');
  langTrigger.setAttribute('aria-expanded', String(open));
});

// Close on outside click
document.addEventListener('click', () => {
  langDropdown?.classList.remove('open');
  langTrigger?.setAttribute('aria-expanded', 'false');
});

// Option click
document.querySelectorAll('.nav-lang-option').forEach(opt => {
  opt.addEventListener('click', (e) => {
    e.stopPropagation();
    setLang(opt.dataset.lang);
    langDropdown.classList.remove('open');
    langTrigger?.setAttribute('aria-expanded', 'false');
  });
});

// Apply on load
setLang(currentLang);

/* ── Typewriter on hero subtitle ── */
let typewriterTimer = null;
function startTypewriter(el) {
  if (!el) return;
  clearInterval(typewriterTimer);
  const text = el.textContent || el.getAttribute('data-i18n-text') || '';
  el.setAttribute('data-i18n-text', text); // preserve original
  el.textContent = '';
  el.style.borderRight = '2px solid #a78bfa';
  let i = 0;
  typewriterTimer = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) {
      clearInterval(typewriterTimer);
      setTimeout(() => { el.style.borderRight = 'none'; }, 500);
    }
  }, 28);
}

// Run typewriter once on first load, after translations
setTimeout(() => {
  const heroSub = document.querySelector('.hero-sub');
  if (heroSub) startTypewriter(heroSub);
}, 300);

/* ============================================================
   AUTH SECTION
   ============================================================ */

let currentRole = 'student'; // 'student' | 'working' | 'business'

/*
 * AUTH_KEY must match the Zustand persist name in authStore.js.
 * The app stores: { state: { accounts, currentUser, isLoggedIn, ... }, version: 0 }
 * We write to the same key so the app picks up accounts and the session
 * immediately on load — no reload required.
 */
const AUTH_KEY = '2am-shoppers-auth';

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
  input.type      = isText ? 'password' : 'text';
  btn.textContent = isText ? '👁️' : '🙈';
};

/* ── Storage helpers ──
   Always read the full persisted state, modify just what we need,
   and write it back atomically so the app's Zustand rehydrate gets
   a consistent snapshot.
*/
function readAuthState() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Zustand persist: { state: { accounts, currentUser, isLoggedIn, ... }, version: 0 }
    return parsed;
  } catch { return null; }
}

function seedAccounts() {
  return [{
    id: 'admin-001', username: 'user', password: 'password',
    email: 'admin@2amshoppers.com', name: 'Admin', role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  }];
}

function loadAccounts() {
  const stored = readAuthState();
  return stored?.state?.accounts ?? seedAccounts();
}

/* Write a full auth state update in one atomic localStorage write. */
function writeAuthState(updates) {
  try {
    const existing = readAuthState() ?? { state: {}, version: 0 };
    if (!existing.state)          existing.state = {};
    if (!existing.state.accounts) existing.state.accounts = seedAccounts();
    Object.assign(existing.state, updates);
    localStorage.setItem(AUTH_KEY, JSON.stringify(existing));
  } catch (e) { console.warn('Auth write failed:', e); }
}

function showSuccess(name, isNew) {
  ['panel-signin', 'panel-signup'].forEach(id => document.getElementById(id)?.classList.add('auth-hidden'));
  const successEl = document.getElementById('auth-success');
  if (successEl) successEl.classList.remove('auth-hidden');
  const titleEl = document.getElementById('auth-success-title');
  const subEl   = document.getElementById('auth-success-sub');
  if (titleEl) titleEl.textContent = isNew ? `Welcome, ${name}! 🎉` : `Welcome back, ${name}!`;
  if (subEl)   subEl.textContent   = 'Your account is ready. Click below to open the app.';
  // Auto-open the app after a short delay
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
    // Write session: keep accounts intact, update session fields only
    writeAuthState({ currentUser: account, isLoggedIn: true });
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

  if (!username)            { showError('signup-error', 'Username is required.'); return; }
  if (!password)            { showError('signup-error', 'Password is required.'); return; }
  if (password.length < 6)  { showError('signup-error', 'Password must be at least 6 characters.'); return; }
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
    // Atomic write: add the new account AND set the session in one write
    writeAuthState({
      accounts:    [...accounts, newAccount],
      currentUser: newAccount,
      isLoggedIn:  true,
    });
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

/* ============================================================
   GET-THE-APP — dynamic QR code
   ============================================================ */
(function () {
  const qrImg      = document.getElementById('qr-img');
  const qrFallback = document.getElementById('qr-fallback');
  if (!qrImg) return;

  function appUrl() {
    const host = location.hostname;
    if (!host || host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3003/download';
    }
    return `${location.protocol}//${host}:3003/download`;
  }

  const url = appUrl();
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=192x192&margin=8&data=${encodeURIComponent(url)}`;
  if (qrFallback) qrFallback.textContent = url.replace(/^https?:\/\//, '');
})();
