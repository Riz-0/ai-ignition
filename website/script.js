/* ============================================================
   2AM SHOPPERS — Pitch-deck website JS (v5)
   ============================================================ */

/* ── Where the web app lives ── */
function appBase() {
  const h = location.hostname;
  if (!h || h === 'localhost' || h === '127.0.0.1') return 'http://localhost:3003';
  return `${location.protocol}//${h}:3003`;
}

/* Build a deep link to the app that carries the session in the URL hash.
   This works ACROSS ORIGINS (website → app), unlike localStorage, which is
   per-origin. The app reads #session=<base64> on load and signs the user in. */
function appHandoffUrl(account, path) {
  const payload = { user: account, ts: Date.now() };
  let token = '';
  try { token = btoa(unescape(encodeURIComponent(JSON.stringify(payload)))); }
  catch { token = ''; }
  const base = appBase() + (path || '/login');
  return token ? `${base}#session=${token}` : base;
}

/* ============================================================
   NAV
   ============================================================ */
const nav       = document.getElementById('nav');
const navToggle = document.getElementById('nav-toggle');
const navLinks  = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

navToggle?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
});
function closeNavMenu() {
  navLinks?.classList.remove('open');
  navToggle?.classList.remove('open');
  navToggle?.setAttribute('aria-expanded', 'false');
}
navLinks?.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', closeNavMenu)
);
/* Close the mobile menu when tapping outside of it. */
document.addEventListener('click', (e) => {
  if (!navLinks?.classList.contains('open')) return;
  if (navLinks.contains(e.target) || navToggle?.contains(e.target)) return;
  closeNavMenu();
});

/* active link highlight */
const sections = document.querySelectorAll('section[id]');
const navIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks?.querySelectorAll('a').forEach(a =>
        a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => navIO.observe(s));

/* smooth scroll with nav offset */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const offset = (nav?.offsetHeight ?? 64) + 14;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  });
});

/* ============================================================
   SCROLL FADE-IN
   ============================================================ */
['.step', '.who-card', '.feat-card', '.priv-strip', '.tested-card', '.roadmap-step', '.value-card', '.pain-chip', '.goal-card', '.faq-item', '.h2', '.eyebrow', '.pain-punch']
  .forEach(sel => document.querySelectorAll(sel).forEach((el, i) => {
    el.classList.add('fade-in');
    el.style.transitionDelay = `${(i % 6) * 60}ms`;
  }));
const fadeObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); fadeObs.unobserve(e.target); } });
}, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
document.querySelectorAll('.fade-in').forEach(el => fadeObs.observe(el));

/* ============================================================
   HERO TYPEWRITER  (the "launch" moment)
   ============================================================ */
let typewriterTimer = null;
function startTypewriter(el) {
  if (!el) return;
  clearInterval(typewriterTimer);
  // Preserve the original text so re-runs (language change) use the latest.
  const text = el.getAttribute('data-type-text') || el.textContent || '';
  el.setAttribute('data-type-text', text);
  el.textContent = '';
  el.classList.remove('done');
  let i = 0;
  typewriterTimer = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) {
      clearInterval(typewriterTimer);
      el.classList.add('done');
    }
  }, 34);
}
function runHeroType() {
  const el = document.getElementById('hero-type');
  if (el) {
    // Drop any stored text so it picks up the freshly-translated string.
    el.removeAttribute('data-type-text');
    startTypewriter(el);
  }
}
// Kick off after the launch animation has started settling.
setTimeout(runHeroType, 1200);

/* ============================================================
   THEME
   ============================================================ */
const THEME_KEY = '2am-shoppers-website-theme';
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = theme === 'light' ? '🌙' : '☀️';
  localStorage.setItem(THEME_KEY, theme);
}
applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
document.getElementById('theme-btn')?.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
});

/* ============================================================
   TRANSLATIONS
   ============================================================ */
const LANG_META = {
  en: { flag: '🇬🇧', label: 'EN' },
  ja: { flag: '🇯🇵', label: 'JA' },
  zh: { flag: '🇨🇳', label: 'ZH' },
  th: { flag: '🇹🇭', label: 'TH' },
  ko: { flag: '🇰🇷', label: 'KO' },
};

const T = {
  en: {
navHow: 'How it works', navWho: "Who it's for",navFaq: 'FAQ',
    heroPill: 'Your 2am shopping buddy — now awake 24/7',
    heroLine1: 'Shop smarter.', heroLine2: 'Spend less.', heroLine3: 'Save for what matters.',
    heroP: "Meet the AI buddy that remembers your budget, tracks what you're saving for, and only pings you when it actually helps. No spam. No overspending. No stress.",
    heroCtaMain: 'Meet your shopping buddy', heroCtaSub: 'See what it does',
    heroTrust1: '🤝 Built for students & working adults', heroTrust2: '🔒 Your money data stays private', heroTrust3: '🌏 Made for everyone, across Asia',
    missionEyebrow: 'Our mission', missionTitle: "Smart money shouldn't be a luxury.",
    missionLead: 'The best financial tools have always been built for people who already have money and know-how. We\'re flipping that. We put approachable, everyday AI in the hands of students and working people — so smarter spending is open to everyone, not just the few.',
    value1T: 'AI for everyone', value1P: 'No finance degree, no spreadsheets, no jargon. If you can chat, you can use it — at any age, in your own language.',
    value2T: 'On your side, always', value2P: 'We make money when you shop well, not when you overspend. Our buddy works for you — never for the loudest advertiser.',
    value3T: 'Good habits, gently', value3P: 'Small wins add up. Goal pockets, streaks and friendly check-ins help better money habits stick — no guilt trips.',
    value4T: 'Respect by default', value4P: 'Your budget, your pace, your privacy. We earn trust with quiet, honest help — not pressure or spam.',
    value5T: 'Simple on purpose', value5P: 'Powerful tech, kept effortless. Learn it in minutes, master it in a day — because tools should fit your life, not the reverse.',
    value6T: 'Built for our region', value6P: 'From Taiwan to Thailand, Japan to Singapore — many languages, many markets, one welcoming experience.',
    demoMsg1: 'Still eyeing those sneakers? 👀 They just dropped to $38 — inside your $40 budget.',
    demoMsg2: 'nice! but can I afford it this week?',
    demoMsg3: "You've got $52 left this week. Grab them, or save $12 toward your trip goal first?",
    demoChip1: 'Buy now', demoChip2: 'Save for trip', demoChip3: 'Remind me Friday',
    painTitle: 'Sound familiar?',
    pain1: '"Wait, where did I save that?"', pain2: '"Oops, overspent again."',
    pain3: '"Searched the same thing 5 times."', pain4: '"Why do all these ads feel random?"',
    painPunch: "You don't need another shopping app. You need a buddy who actually gets your money.",
    howEyebrow: 'How it works', howTitle: "Three taps. That's it.",
    how1Title: 'Tell it your vibe', how1Desc: "Set your budget and what you're saving for. Takes 30 seconds.",
    how2Title: 'Let it watch your back', how2Desc: 'Save products, and your buddy tracks prices, stock and your budget for you.',
    how3Title: 'Buy at the right time', how3Desc: 'It pings you when the price fits — never before you can afford it.',
    whoEyebrow: "Who it's for", whoTitle: 'One buddy. Your way.',
    whoStudentT: 'Students', whoStudentP: 'Stretch your allowance every week. Save up for the big stuff with goal pockets and little wins along the way.', whoStudentTag: 'Weekly budget · Goal pockets · Fun streaks',
    whoWorkingT: 'Working adults', whoWorkingP: 'Plan around payday. Keep your subscriptions, savings and treats in balance — without a spreadsheet.', whoWorkingTag: 'Monthly plan · Smart reminders · Reorders',
    saveEyebrow: 'Save without thinking', saveTitle: 'Turn "I want it" into "I got it."',
    saveLead: "See something you love but it's over budget? Your buddy sets up a goal pocket and quietly helps you get there — then checks the price is still right before you buy.",
    saveLi1: '✅ Set a goal in one tap', saveLi2: '✅ Watch the progress bar fill up', saveLi3: '✅ Buy when you\'re actually ready',
    saveGoalName: 'Japan trip', saveGoalSub: '$320 of $500 saved', saveGoalFoot: '🎉 64% there — about 4 weeks to go',
    saveGoal2Name: 'New sneakers', saveGoal2Sub: '$48 of $60 saved', saveGoal2Foot: 'Almost there! 🔥',
    roleStudent: 'Student', roleWorking: 'Working',
    phUsername: 'Pick a username', phEmail: 'Email (optional)', phPassword: 'Password (6+ characters)', phConfirm: 'Confirm password',
    phUsername2: 'Username', phPassword2: 'Password',
    signupBtn: 'Create my account →', signinBtn: 'Sign in & open the app →',
    demoHint: 'Try the demo — user: <strong>user</strong> · pass: <strong>password</strong>',
    authFoot: 'Takes under a minute · Your data stays private · Built for everyone',
    faqTitle: 'Quick questions',
    faqQ1: 'Who is this really for?', faqA1: 'Anyone who wants to shop with intention — students stretching an allowance and working adults planning around payday. No finance background needed.',
    faqQ2: 'Can it see my bank account?', faqA2: 'No. You tell it your budget and goals. It never touches your bank, and shops never see your private numbers.',
    faqQ3: 'Will it spam me?', faqA3: 'Never. You set quiet hours and how often it can message you. It only pings when it\'s genuinely useful.',
    faqQ4: 'Which shops does it work with?', faqA4: 'Save links from Shopee, SHEIN, TikTok Shop, Taobao and Pinduoduo — all in one tidy list.',
    finalTitle: 'Smarter shopping, open to everyone.', finalP: 'Join the shoppers choosing intention over impulse.', finalCta: 'Meet your buddy',
    footerTag: 'Shop smarter. Spend less. Save for what matters.', footerNote: 'The 2am Shoppers · Team 2AM Deployers · AI Ignition · Problem Statement 1',
    navGetApp: 'Get the app',
    heroTypePrefix: "It's like having a friend who says:",
    heroType: '"Wait — you can get it cheaper on Friday. Let\'s save $12 first. 😉"',
    getAppEyebrow: 'Get the app', getAppTitle: 'Scan. Install. Shop smarter.',
    getAppLead: "Point your phone camera at the code and your buddy installs in seconds — works offline once it's in.",
    getAppScan: '📷 Scan with your phone camera',
    getAppIosT: 'iPhone / iPad (Safari)', getAppIos1: 'Open the link in Safari.', getAppIos2: 'Tap the Share button.', getAppIos3: 'Tap Add to Home Screen.', getAppIos4: 'Tap Add — done! 🎉',
    getAppAndT: 'Android (Chrome)', getAppAnd1: 'Open the link in Chrome.', getAppAnd2: 'Tap the menu (⋮).', getAppAnd3: 'Tap Install app.', getAppAnd4: "Confirm — it's on your home screen. 🎉",
    getAppPcT: 'Desktop (Chrome / Edge)', getAppPc1: 'Open localhost:3003.', getAppPc2: 'Click the install icon (⊕) in the address bar.', getAppPc3: 'Click Install — opens in its own window.',
    navFeatures: 'Features', navLogin: 'Log in',
    navSignup: 'Sign up', featEyebrow: 'Features',
    featTitle: 'Everything you need to shop with intention', featLead: 'From "should I buy this?" to "I saved for it" — one app covers the whole journey.',
    feat1T: '2AM Assistant', feat1P: 'Ask before you buy. It knows your budget and gives you an honest second opinion, any time of night.',
    pv1Me: 'Should I get these $59 earbuds?', pv1Ai: 'You\'ve got $52 left this week. Wait for Friday\'s sale?',
    feat2T: 'A budget that fits your life', feat2P: 'Weekly for students, monthly for working adults. Always see what\'s left after essentials and savings.',
    pv2Label: 'Left this week', pv2Spent: 'Spent $28',
    feat3T: 'Goal pockets', feat3P: 'Turn "someday" into a plan. Set a goal, add a little each week and watch it fill up.',
    feat4T: 'Sleep on it', feat4P: 'Save it to your wishlist at 2am, decide in the morning. We check in before you buy, not while you scroll.',
    pv4Item: 'Wireless earbuds', pv4Tag: '⏰ 9:00 AM',
    pv4Item2: 'Linen shirt', pv4Tag2: '✓ In budget',
    feat5T: 'Discover, filtered for you', feat5P: 'Swipe short product videos picked for your interests and filtered to what you can afford.',
    pv5Cap: 'Cold brew kit · $18', pv5Chip1: '☕ Coffee',
    pv5Chip2: 'Under $20', feat6T: 'Every shop, one list',
    feat6P: 'Save links from Shopee, SHEIN, TikTok Shop, Taobao and Pinduoduo into one tidy wishlist.', pv6: 'One wishlist',
    privT: 'Privacy first', privP: 'Your budget, savings and wishlist stay on your device. Shops never see your numbers, and we never ask for your marketplace passwords.',
    loginTitle: 'Welcome back', loginSub: 'Sign in to pick up where you left off.',
    signupTitle: 'Create your account', signupSub: 'Takes under a minute. Then we\'ll take you straight into the app.',
    haveAccount: 'Already a member?', signInLink: 'Sign in',
    newHere: 'New here?', createLink: 'Create an account',
    backHome: '← Back to home',
    heroTeam: 'A project by <strong>Team 2AM Deployers</strong> · AI Ignition · Problem Statement 1', testEyebrow: 'Progress',
    testTitle: 'What we built, tested and learned', testLead: 'A working prototype you can try today, with the parts that are still simulated clearly marked.',
    testBuiltT: '✅ Built and tested', testBuilt1: 'Student (weekly) and Working Adult (monthly) modes that work out safe spending money.',
    testBuilt2: 'A personal video feed for each persona: 20 real product clips, each with a shop link and a sound toggle.', testBuilt3: '"Did you get it?" check-ins: logging a $22.34 purchase took a $50 weekly budget to $27.66.',
    testBuilt4: 'Hoot, our AI assistant, in two voices, with product cards and answers that still work offline.', testBuilt5: 'Reminders and low-budget alerts that arrive once and respect quiet hours.',
    testBuilt6: 'Phone and desktop layouts, five languages, dark and light themes.', testLearnT: '💡 What we learned',
    testLearn1: 'One budget doesn\'t fit all: students think weekly and working adults think monthly, so each got its own screens and wording.', testLearn2: 'Tone matters. The same advice lands better from a "bestie" or a "coach" that matches the person.',
    testLearn3: 'Shops can\'t tell us if someone bought. Asking once, when they come back, is simple and works with any shop.', testLearn4: 'Browsers mute videos and block notifications by default, so we ask for permission at the moment it helps.',
    testLearn5: 'An assistant should never break: when the AI server is offline, Hoot still answers from data on the phone.', testSimT: '🧪 Still simulated',
    testSim1: 'Marketplace connections are link-only; no live shop APIs yet.', testSim2: 'Purchases are confirmed by the user, not by the shop.',
    testSim3: 'Live AI replies need an API key and a hosted server; we tested the offline mode.', testSim4: 'Accounts are stored per device, and the demo videos are third-party clips.',
    nextEyebrow: 'Next steps', nextTitle: 'Where we go from here',
    next1T: 'Launch a hosted beta', next1P: 'Put the app and AI server online, with real accounts that sync across devices.',
    next2T: 'Confirm purchases automatically', next2P: 'Join the Shopee and TikTok Shop affiliate programmes, so the app knows when a link led to an order.',
    next3T: 'Notifications that always arrive', next3P: 'Add a push server so reminders arrive even when the app is closed.',
    next4T: 'A "For You" feed with partner videos', next4P: 'Brands upload their own videos, and the feed learns from what users watch, save and skip, always filtered to their budget.',
    next5T: 'Pilot and measure', next5P: 'Test with students and working adults, and measure impulse buys avoided and savings goals reached.',
    finalTeam: '<strong>The 2am Shoppers</strong> · built by Team 2AM Deployers for AI Ignition, Problem Statement 1',
  },

  ja: {
    navHow: '使い方', navWho: '対象ユーザー',navFaq: 'FAQ',
    heroPill: 'あなたの2amショッピング相棒 — 24時間稼働',
    heroLine1: 'かしこく買う。', heroLine2: '使いすぎない。', heroLine3: '大切なものに貯める。',
    heroP: 'あなたの予算を覚え、貯金目標を追いかけ、本当に役立つときだけ通知するAIの相棒。スパムなし、使いすぎなし、ストレスなし。',
    heroCtaMain: '相棒に会う', heroCtaSub: '機能を見る',
    heroTrust1: '🤝 学生と社会人のために', heroTrust2: '🔒 お金のデータは非公開', heroTrust3: '🌏 アジア全域、みんなのために',
    missionEyebrow: '私たちの使命', missionTitle: 'かしこいお金の管理は、特権であってはならない。',
    missionLead: '優れた金融ツールは、いつもお金と知識を持つ人のために作られてきました。私たちはそれを変えます。親しみやすい日常のAIを、学生と働く人の手に。かしこい支出を、一部の人だけでなく、みんなに。',
    value1T: 'みんなのためのAI', value1P: '金融の学位も表計算も専門用語も不要。チャットできれば使えます — どんな年齢でも、あなたの言葉で。',
    value2T: 'いつもあなたの味方', value2P: '私たちはあなたが上手に買い物したときに収益を得ます。使いすぎたときではありません。相棒はあなたのために働きます。',
    value3T: '良い習慣を、やさしく', value3P: '小さな成功が積み重なります。貯金ポケット、連続記録、やさしい声かけで、お金の良い習慣が自然と身につきます。',
    value4T: '初めから敬意を', value4P: 'あなたの予算、ペース、プライバシー。静かで誠実な助けで信頼を築きます — 圧力やスパムではなく。',
    value5T: 'あえてシンプルに', value5P: '強力な技術を、手軽なままに。数分で学べて、一日で使いこなせる — ツールは生活に合わせるべきだから。',
    value6T: '私たちの地域のために', value6P: '台湾からタイ、日本からシンガポールまで — 多くの言語、多くの市場、一つの温かい体験。',
    demoMsg1: 'あのスニーカーまだ気になってる？👀 $38に値下げ — 予算$40以内だよ。',
    demoMsg2: 'いいね！でも今週買える？',
    demoMsg3: '今週はあと$52あるよ。買う？それとも旅行目標に$12貯める？',
    demoChip1: '今すぐ買う', demoChip2: '旅行に貯金', demoChip3: '金曜に通知',
    painTitle: '心当たりある？',
    pain1: '「あれ、どこに保存した？」', pain2: '「また使いすぎた…」',
    pain3: '「同じ物を5回も検索した」', pain4: '「広告がどれも的外れ」',
    painPunch: 'もう一つのショッピングアプリはいらない。お金を本当に分かってくれる相棒が必要。',
    howEyebrow: '使い方', howTitle: 'たった3タップ。',
    how1Title: '好みを伝える', how1Desc: '予算と貯金目標を設定。30秒で完了。',
    how2Title: '任せて見守る', how2Desc: '商品を保存すれば、相棒が価格・在庫・予算を追跡。',
    how3Title: 'ベストなタイミングで買う', how3Desc: '予算に合ったときだけ通知 — 買える前に迫らない。',
    whoEyebrow: '対象ユーザー', whoTitle: '一つの相棒、あなた流に。',
    whoStudentT: '学生', whoStudentP: '毎週のお小遣いを賢く。目標ポケットと小さな達成で大きな買い物に貯金。', whoStudentTag: '週予算 · 目標ポケット · 連続記録',
    whoWorkingT: '社会人', whoWorkingP: '給料日に合わせて計画。サブスク・貯金・ご褒美をスプレッドシートなしで管理。', whoWorkingTag: '月間計画 · スマート通知 · 再注文',
    saveEyebrow: '考えずに貯金', saveTitle: '「欲しい」を「手に入れた」に。',
    saveLead: '気に入ったけど予算オーバー？相棒が目標ポケットを作り、そっと貯金を助け、買う前に価格を再確認。',
    saveLi1: '✅ ワンタップで目標設定', saveLi2: '✅ 進捗バーが伸びるのを見る', saveLi3: '✅ 本当に準備できたら買う',
    saveGoalName: '日本旅行', saveGoalSub: '$500中$320貯金', saveGoalFoot: '🎉 64%達成 — あと約4週間',
    saveGoal2Name: '新しいスニーカー', saveGoal2Sub: '$60中$48貯金', saveGoal2Foot: 'もうすぐ！🔥',
    roleStudent: '学生', roleWorking: '社会人',
    phUsername: 'ユーザー名を選択', phEmail: 'メール（任意）', phPassword: 'パスワード（6文字以上）', phConfirm: 'パスワード確認',
    phUsername2: 'ユーザー名', phPassword2: 'パスワード',
    signupBtn: 'アカウントを作成 →', signinBtn: 'サインインしてアプリを開く →',
    demoHint: 'デモを試す — user: <strong>user</strong> · pass: <strong>password</strong>',
    authFoot: '1分以内 · データは非公開 · みんなのために',
    faqTitle: 'よくある質問',
    faqQ1: '誰のためのもの？', faqA1: '意図を持って買い物したいすべての人へ — お小遣いをやりくりする学生、給料日に合わせて計画する社会人。金融の知識は不要です。',
    faqQ2: '銀行口座は見える？', faqA2: 'いいえ。予算と目標を伝えるだけ。銀行には一切触れず、ショップに数字は見えません。',
    faqQ3: 'スパムは来る？', faqA3: '来ません。静かな時間と頻度を設定でき、役立つときだけ通知します。',
    faqQ4: 'どのショップに対応？', faqA4: 'Shopee, SHEIN, TikTok Shop, Taobao, Pinduoduoのリンクを一覧で保存。',
    finalTitle: 'かしこい買い物を、みんなに。', finalP: '衝動より意図を選ぶショッパーの仲間に。', finalCta: '相棒に会う',
    footerTag: 'かしこく買う。使いすぎない。大切なものに貯める。', footerNote: 'The 2am Shoppers · Team 2AM Deployers · AI Ignition · Problem Statement 1',
    navGetApp: 'アプリを入手',
    heroTypePrefix: 'こう言ってくれる友達みたいな存在:',
    heroType: '「待って — 金曜ならもっと安いよ。まず$12貯めよう 😉」',
    getAppEyebrow: 'アプリを入手', getAppTitle: 'スキャン。インストール。かしこく買い物。',
    getAppLead: 'スマホのカメラでコードを読み取れば、数秒で相棒をインストール — 入れたらオフラインでも動きます。',
    getAppScan: '📷 スマホのカメラでスキャン',
    getAppIosT: 'iPhone / iPad (Safari)', getAppIos1: 'Safariでリンクを開く。', getAppIos2: '共有ボタンをタップ。', getAppIos3: '「ホーム画面に追加」をタップ。', getAppIos4: '「追加」をタップ — 完了！🎉',
    getAppAndT: 'Android (Chrome)', getAppAnd1: 'Chromeでリンクを開く。', getAppAnd2: 'メニュー (⋮) をタップ。', getAppAnd3: '「アプリをインストール」をタップ。', getAppAnd4: '確認 — ホーム画面に追加されます。🎉',
    getAppPcT: 'デスクトップ (Chrome / Edge)', getAppPc1: 'localhost:3003 を開く。', getAppPc2: 'アドレスバーのインストールアイコン (⊕) をクリック。', getAppPc3: '「インストール」をクリック — 独立したウィンドウで開きます。',
    navFeatures: '機能', navLogin: 'ログイン',
    navSignup: '新規登録', featEyebrow: '機能',
    featTitle: '意図ある買い物に必要なすべて', featLead: '「これ買うべき？」から「貯めて買えた！」まで、ひとつのアプリで。',
    feat1T: '2AMアシスタント', feat1P: '買う前に相談。予算を把握したうえで、深夜でも正直なセカンドオピニオンをくれます。',
    pv1Me: 'この$59のイヤホン、買っていい？', pv1Ai: '今週の残りは$52。金曜のセールまで待つ？',
    feat2T: '暮らしに合う予算', feat2P: '学生は週単位、社会人は月単位。必需品と貯金を除いた残りがいつでもわかります。',
    pv2Label: '今週の残り', pv2Spent: '使った額 $28',
    feat3T: '貯金ポケット', feat3P: '「いつか」を計画に。目標を決めて毎週少しずつ、たまっていくのを見守りましょう。',
    feat4T: 'ひと晩寝かせる', feat4P: '深夜2時はウィッシュリストに保存して、朝に決める。スクロール中ではなく、買う前に確認します。',
    pv4Item: 'ワイヤレスイヤホン', pv4Tag: '⏰ 午前9:00',
    pv4Item2: 'リネンシャツ', pv4Tag2: '✓ 予算内',
    feat5T: 'あなた向けの発見', feat5P: '興味に合わせて選ばれ、予算で絞り込まれた短い商品動画をスワイプ。',
    pv5Cap: 'コールドブリューキット · $18', pv5Chip1: '☕ コーヒー',
    pv5Chip2: '$20以下', feat6T: 'すべてのショップを一つに',
    feat6P: 'Shopee、SHEIN、TikTok Shop、Taobao、Pinduoduoのリンクを一つのウィッシュリストに。', pv6: 'ひとつのウィッシュリスト',
    privT: 'プライバシー第一', privP: '予算・貯金・ウィッシュリストはあなたの端末に保存。ショップがあなたの数字を見ることはなく、ショップのパスワードを求めることもありません。',
    loginTitle: 'おかえりなさい', loginSub: 'サインインして続きから始めましょう。',
    signupTitle: 'アカウントを作成', signupSub: '1分以内で完了。そのままアプリへご案内します。',
    haveAccount: 'すでにメンバーですか？', signInLink: 'サインイン',
    newHere: '初めてですか？', createLink: 'アカウントを作成',
    backHome: '← ホームに戻る',
    heroTeam: '<strong>Team 2AM Deployers</strong> によるプロジェクト · AI Ignition · 課題1', testEyebrow: '進捗',
    testTitle: '作ったもの・試したこと・学んだこと', testLead: '今すぐ試せる動くプロトタイプです。まだシミュレーションの部分ははっきり示しています。',
    testBuiltT: '✅ 実装・テスト済み', testBuilt1: '学生（週単位）と社会人（月単位）のモードで、安心して使える金額を計算。',
    testBuilt2: 'ペルソナごとの動画フィード：実際の商品動画20本、それぞれにショップリンクと音声切り替え付き。', testBuilt3: '「買いましたか？」チェック：$22.34の購入を記録すると、週予算$50が$27.66に。',
    testBuilt4: 'AIアシスタントのHootは2つの話し方に対応。商品カード付きで、オフラインでも回答。', testBuilt5: 'リマインダーと予算アラートは一度だけ届き、お休み時間を守ります。',
    testBuilt6: 'スマホとPCのレイアウト、5言語、ダーク・ライトテーマ。', testLearnT: '💡 学んだこと',
    testLearn1: '予算は一つでは合わない：学生は週、社会人は月で考えるので、それぞれ専用の画面と言葉にしました。', testLearn2: '話し方は大事。同じアドバイスでも、その人に合う「親友」や「コーチ」から聞くと届きやすい。',
    testLearn3: 'ショップは購入したかを教えてくれません。戻ってきたときに一度聞くのが簡単で、どのショップでも使えます。', testLearn4: 'ブラウザは動画を消音し、通知を初期状態でブロックするので、役立つタイミングで許可を求めます。',
    testLearn5: 'アシスタントは止まってはいけない：AIサーバーがオフラインでも、Hootは端末のデータで答えます。', testSimT: '🧪 まだシミュレーション',
    testSim1: 'マーケットプレイス連携はリンクのみで、ショップのAPIとはまだ接続していません。', testSim2: '購入はショップではなく、ユーザーの回答で確認しています。',
    testSim3: 'AIのライブ回答にはAPIキーとサーバーが必要です。テストしたのはオフラインモードです。', testSim4: 'アカウントは端末ごとに保存され、デモ動画は第三者のクリップです。',
    nextEyebrow: '次のステップ', nextTitle: 'これからの計画',
    next1T: 'ベータ版を公開', next1P: 'アプリとAIサーバーをオンライン化し、端末間で同期する本物のアカウントを導入。',
    next2T: '購入を自動で確認', next2P: 'ShopeeとTikTok Shopのアフィリエイトに参加し、リンクから注文があったか分かるように。',
    next3T: '必ず届く通知', next3P: 'プッシュサーバーを追加し、アプリを閉じていてもリマインダーが届くように。',
    next4T: 'パートナー動画の「おすすめ」フィード', next4P: 'ブランドが自社動画を投稿し、視聴・保存・スキップから学ぶフィードに。常に予算でフィルター。',
    next5T: 'パイロットと効果測定', next5P: '学生と社会人で試し、避けられた衝動買いと達成した貯金目標を測定。',
    finalTeam: '<strong>The 2am Shoppers</strong> · Team 2AM Deployers が AI Ignition 課題1のために制作',
  },

  zh: {
    navHow: '如何运作', navWho: '适合谁',navFaq: '常见问题',
    heroPill: '你的2am购物伙伴 — 24小时在线',
    heroLine1: '更聪明地购物。', heroLine2: '花得更少。', heroLine3: '为重要的事存钱。',
    heroP: '认识这位AI伙伴：记住你的预算，追踪你的储蓄目标，只在真正有用时提醒你。无垃圾信息，不超支，没压力。',
    heroCtaMain: '认识你的购物伙伴', heroCtaSub: '看看功能',
    heroTrust1: '🤝 为学生和上班族打造', heroTrust2: '🔒 你的财务数据保密', heroTrust3: '🌏 为亚洲每个人而生',
    missionEyebrow: '我们的使命', missionTitle: '聪明理财，不该是奢侈品。',
    missionLead: '最好的理财工具，一直是为本来就有钱、懂行的人打造的。我们要改变这一点。我们把亲切、日常的AI交到学生和上班族手中——让更聪明的消费属于每个人，而不只是少数人。',
    value1T: '人人可用的AI', value1P: '不需要金融学位、表格或行话。会聊天就会用 — 不分年龄，用你自己的语言。',
    value2T: '始终站在你这边', value2P: '你买得明智我们才赚钱，而非你超支时。你的伙伴为你服务 — 绝不为出价最高的广告商。',
    value3T: '温和地养成好习惯', value3P: '小小的胜利会累积。目标口袋、连续打卡和贴心提醒，帮你自然养成更好的理财习惯——没有说教。',
    value4T: '尊重为本', value4P: '你的预算、你的节奏、你的隐私。我们用安静诚实的帮助赢得信任 — 而非施压或骚扰。',
    value5T: '刻意保持简单', value5P: '强大的技术，始终轻松上手。几分钟学会，一天精通 — 因为工具该配合你的生活，而非相反。',
    value6T: '为我们的地区而建', value6P: '从台湾到泰国，从日本到新加坡 — 多种语言、多个市场，一致的友好体验。',
    demoMsg1: '还在看那双运动鞋吗？👀 刚降到$38 — 在你$40预算内。',
    demoMsg2: '不错！但这周买得起吗？',
    demoMsg3: '你这周还剩$52。现在买，还是先为旅行目标存$12？',
    demoChip1: '立即购买', demoChip2: '为旅行存钱', demoChip3: '周五提醒我',
    painTitle: '听起来耳熟吗？',
    pain1: '"等等，我存哪了？"', pain2: '"糟糕，又超支了。"',
    pain3: '"同样的东西搜了5次。"', pain4: '"为什么广告都这么随机？"',
    painPunch: '你不需要又一个购物应用。你需要一个真正懂你钱包的伙伴。',
    howEyebrow: '如何运作', howTitle: '三次点击，就这么简单。',
    how1Title: '告诉它你的喜好', how1Desc: '设置预算和储蓄目标。只需30秒。',
    how2Title: '让它为你把关', how2Desc: '保存商品，伙伴帮你追踪价格、库存和预算。',
    how3Title: '在对的时机购买', how3Desc: '价格合适时才提醒 — 绝不在你买得起之前催促。',
    whoEyebrow: '适合谁', whoTitle: '一个伙伴，随你所需。',
    whoStudentT: '学生', whoStudentP: '每周精打细算零用钱。用目标钱包和小成就为大件存钱。', whoStudentTag: '每周预算 · 目标钱包 · 趣味连击',
    whoWorkingT: '上班族', whoWorkingP: '围绕发薪日规划。平衡订阅、储蓄和犒赏 — 无需表格。', whoWorkingTag: '月度计划 · 智能提醒 · 再次购买',
    saveEyebrow: '轻松存钱', saveTitle: '把"我想要"变成"我拥有"。',
    saveLead: '看到喜欢但超预算的东西？伙伴帮你建目标钱包，默默助你达成 — 购买前再确认价格合适。',
    saveLi1: '✅ 一键设定目标', saveLi2: '✅ 看着进度条填满', saveLi3: '✅ 真正准备好再买',
    saveGoalName: '日本旅行', saveGoalSub: '已存$320/$500', saveGoalFoot: '🎉 完成64% — 约还剩4周',
    saveGoal2Name: '新运动鞋', saveGoal2Sub: '已存$48/$60', saveGoal2Foot: '快到了！🔥',
    roleStudent: '学生', roleWorking: '上班族',
    phUsername: '选个用户名', phEmail: '邮箱（可选）', phPassword: '密码（6位以上）', phConfirm: '确认密码',
    phUsername2: '用户名', phPassword2: '密码',
    signupBtn: '创建我的账户 →', signinBtn: '登录并打开应用 →',
    demoHint: '试用演示 — 用户: <strong>user</strong> · 密码: <strong>password</strong>',
    authFoot: '一分钟搞定 · 数据保密 · 为每个人打造',
    faqTitle: '快速解答',
    faqQ1: '这到底是为谁准备的？', faqA1: '任何想有计划地购物的人——精打细算零花钱的学生，围绕发薪日做规划的上班族。不需要任何理财背景。',
    faqQ2: '它能看到我的银行账户吗？', faqA2: '不能。你只告诉它预算和目标。它从不接触你的银行，商店也看不到你的隐私数据。',
    faqQ3: '会给我发垃圾信息吗？', faqA3: '绝不。你设定安静时段和消息频率。只在真正有用时提醒。',
    faqQ4: '支持哪些商店？', faqA4: '保存来自Shopee、SHEIN、TikTok Shop、Taobao和Pinduoduo的链接 — 一个清单搞定。',
    finalTitle: '聪明购物，人人可及。', finalP: '加入选择理性而非冲动的购物者。', finalCta: '认识你的伙伴',
    footerTag: '更聪明地购物。花得更少。为重要的事存钱。', footerNote: 'The 2am Shoppers · Team 2AM Deployers · AI Ignition · Problem Statement 1',
    navGetApp: '获取应用',
    heroTypePrefix: '就像有个朋友对你说：',
    heroType: '"等等 — 周五更便宜哦。先存$12吧 😉"',
    getAppEyebrow: '获取应用', getAppTitle: '扫码。安装。更聪明购物。',
    getAppLead: '用手机相机对准二维码，几秒即可安装你的伙伴 — 装好后离线也能用。',
    getAppScan: '📷 用手机相机扫描',
    getAppIosT: 'iPhone / iPad (Safari)', getAppIos1: '在Safari中打开链接。', getAppIos2: '点击分享按钮。', getAppIos3: '点击"添加到主屏幕"。', getAppIos4: '点击添加 — 完成！🎉',
    getAppAndT: 'Android (Chrome)', getAppAnd1: '在Chrome中打开链接。', getAppAnd2: '点击菜单 (⋮)。', getAppAnd3: '点击"安装应用"。', getAppAnd4: '确认 — 已添加到主屏幕。🎉',
    getAppPcT: '桌面 (Chrome / Edge)', getAppPc1: '打开 localhost:3003。', getAppPc2: '点击地址栏的安装图标 (⊕)。', getAppPc3: '点击安装 — 在独立窗口中打开。',
    navFeatures: '功能', navLogin: '登录',
    navSignup: '注册', featEyebrow: '功能',
    featTitle: '有计划购物所需的一切', featLead: '从“该不该买？”到“我存够了！”——一个应用搞定全过程。',
    feat1T: '2AM 助手', feat1P: '买之前先问问。它了解你的预算，深夜也能给你诚实的第二意见。',
    pv1Me: '这副 $59 的耳机该买吗？', pv1Ai: '你这周还剩 $52。等周五打折？',
    feat2T: '贴合生活的预算', feat2P: '学生按周，上班族按月。随时看到扣除必需开支和储蓄后还剩多少。',
    pv2Label: '本周剩余', pv2Spent: '已花 $28',
    feat3T: '目标口袋', feat3P: '把“总有一天”变成计划。设定目标，每周存一点，看着它慢慢填满。',
    feat4T: '睡一觉再决定', feat4P: '凌晨两点先加入心愿单，早上再决定。我们在你购买前提醒，而不是在你刷屏时。',
    pv4Item: '无线耳机', pv4Tag: '⏰ 上午 9:00',
    pv4Item2: '亚麻衬衫', pv4Tag2: '✓ 在预算内',
    feat5T: '为你筛选的发现', feat5P: '滑动浏览按兴趣挑选、按预算筛选的商品短视频。',
    pv5Cap: '冷萃咖啡套装 · $18', pv5Chip1: '☕ 咖啡',
    pv5Chip2: '$20 以下', feat6T: '所有商店，一个清单',
    feat6P: '把 Shopee、SHEIN、TikTok Shop、淘宝和拼多多的链接存进同一个心愿单。', pv6: '一个心愿单',
    privT: '隐私优先', privP: '你的预算、储蓄和心愿单都保存在你的设备上。商店看不到你的数字，我们也从不索要你的购物平台密码。',
    loginTitle: '欢迎回来', loginSub: '登录后从上次的地方继续。',
    signupTitle: '创建账户', signupSub: '不到一分钟，然后直接带你进入应用。',
    haveAccount: '已经是会员？', signInLink: '登录',
    newHere: '第一次来？', createLink: '创建账户',
    backHome: '← 返回首页',
    heroTeam: '<strong>Team 2AM Deployers</strong> 的项目 · AI Ignition · 问题陈述 1', testEyebrow: '进展',
    testTitle: '我们做了什么、测试了什么、学到了什么', testLead: '一个今天就能试用的可运行原型，仍为模拟的部分都已清楚标注。',
    testBuiltT: '✅ 已完成并测试', testBuilt1: '学生（按周）和上班族（按月）模式，算出可放心花的钱。',
    testBuilt2: '每个用户画像都有专属视频流：20 段真实商品视频，每段都有商店链接和声音开关。', testBuilt3: '"买了吗？"确认：记录一笔 $22.34 的购买后，每周 $50 的预算变为 $27.66。',
    testBuilt4: 'AI 助手 Hoot 有两种语气，带商品卡片，离线时也能回答。', testBuilt5: '提醒和预算警报只发一次，并遵守免打扰时段。',
    testBuilt6: '手机和电脑布局、五种语言、深色和浅色主题。', testLearnT: '💡 我们学到的',
    testLearn1: '一种预算不适合所有人：学生按周思考，上班族按月思考，所以各有专属界面和用语。', testLearn2: '语气很重要。同样的建议，由贴合用户的"闺蜜"或"教练"说出来更容易被接受。',
    testLearn3: '商店不会告诉我们用户是否购买。在用户回来时问一次，简单又适用于任何商店。', testLearn4: '浏览器默认静音视频并阻止通知，所以我们在真正有用的时候才请求权限。',
    testLearn5: '助手不能"罢工"：AI 服务器离线时，Hoot 仍能用手机上的数据回答。', testSimT: '🧪 仍为模拟',
    testSim1: '购物平台连接仅为链接，尚未接入商店 API。', testSim2: '购买由用户确认，而不是由商店确认。',
    testSim3: 'AI 实时回复需要 API 密钥和托管服务器；我们测试的是离线模式。', testSim4: '账户按设备保存，演示视频为第三方片段。',
    nextEyebrow: '下一步', nextTitle: '接下来的计划',
    next1T: '推出托管测试版', next1P: '将应用和 AI 服务器上线，并提供可跨设备同步的真实账户。',
    next2T: '自动确认购买', next2P: '加入 Shopee 和 TikTok Shop 联盟计划，让应用知道链接是否带来了订单。',
    next3T: '一定送达的通知', next3P: '加入推送服务器，即使应用关闭也能收到提醒。',
    next4T: '合作伙伴视频的"为你推荐"', next4P: '品牌上传自己的视频，推荐流根据观看、收藏和跳过来学习，并始终按预算筛选。',
    next5T: '试点并评估', next5P: '与学生和上班族一起测试，衡量避免的冲动消费和达成的储蓄目标。',
    finalTeam: '<strong>The 2am Shoppers</strong> · 由 Team 2AM Deployers 为 AI Ignition 问题陈述 1 打造',
  },

  th: {
    navHow: 'วิธีใช้งาน', navWho: 'เหมาะกับใคร',navFaq: 'คำถามพบบ่อย',
    heroPill: 'เพื่อนช้อปปิ้ง 2am ของคุณ — ตื่นตลอด 24 ชม.',
    heroLine1: 'ช้อปฉลาดขึ้น', heroLine2: 'ใช้จ่ายน้อยลง', heroLine3: 'เก็บเงินเพื่อสิ่งที่สำคัญ',
    heroP: 'พบกับเพื่อน AI ที่จำงบของคุณได้ ติดตามเป้าหมายการออม และเตือนเฉพาะตอนที่มีประโยชน์จริง ไม่มีสแปม ไม่ใช้จ่ายเกิน ไม่เครียด',
    heroCtaMain: 'พบเพื่อนช้อปของคุณ', heroCtaSub: 'ดูฟีเจอร์',
    heroTrust1: '🤝 สร้างมาเพื่อนักเรียนและคนทำงาน', heroTrust2: '🔒 ข้อมูลการเงินเป็นส่วนตัว', heroTrust3: '🌏 เพื่อทุกคนทั่วเอเชีย',
    missionEyebrow: 'พันธกิจของเรา', missionTitle: 'การเงินที่ชาญฉลาด ไม่ควรเป็นของฟุ่มเฟือย',
    missionLead: 'เครื่องมือการเงินที่ดีที่สุดมักถูกสร้างมาเพื่อคนที่มีเงินและมีความรู้อยู่แล้ว เราจะเปลี่ยนสิ่งนั้น เรานำ AI ที่เป็นมิตรและใช้ได้ทุกวันไปอยู่ในมือของนักเรียนและคนทำงาน เพื่อให้การใช้จ่ายอย่างชาญฉลาดเป็นของทุกคน ไม่ใช่แค่คนส่วนน้อย',
    value1T: 'AI เพื่อทุกคน', value1P: 'ไม่ต้องมีปริญญาการเงิน ไม่ต้องใช้ตาราง ไม่มีศัพท์เทคนิค ถ้าแชทได้ก็ใช้ได้ — ทุกวัย ในภาษาของคุณเอง',
    value2T: 'อยู่ข้างคุณเสมอ', value2P: 'เราได้รายได้เมื่อคุณช้อปอย่างฉลาด ไม่ใช่เมื่อคุณใช้จ่ายเกิน เพื่อนของเราทำงานเพื่อคุณ — ไม่ใช่เพื่อผู้ลงโฆษณาที่เสียงดังที่สุด',
    value3T: 'สร้างนิสัยดีอย่างอ่อนโยน', value3P: 'ชัยชนะเล็ก ๆ สะสมได้ กระเป๋าเป้าหมาย สถิติต่อเนื่อง และการทักทายที่เป็นมิตร ช่วยให้นิสัยการเงินที่ดีติดตัว โดยไม่ต้องรู้สึกผิด',
    value4T: 'เคารพเป็นค่าเริ่มต้น', value4P: 'งบของคุณ จังหวะของคุณ ความเป็นส่วนตัวของคุณ เราสร้างความไว้วางใจด้วยความช่วยเหลือที่เงียบและจริงใจ — ไม่ใช่การกดดันหรือสแปม',
    value5T: 'เรียบง่ายอย่างตั้งใจ', value5P: 'เทคโนโลยีทรงพลัง แต่ใช้ง่าย เรียนรู้ในไม่กี่นาที เชี่ยวชาญในหนึ่งวัน — เพราะเครื่องมือควรเข้ากับชีวิตคุณ ไม่ใช่ตรงกันข้าม',
    value6T: 'สร้างเพื่อภูมิภาคของเรา', value6P: 'จากไต้หวันถึงไทย ญี่ปุ่นถึงสิงคโปร์ — หลายภาษา หลายตลาด หนึ่งประสบการณ์ที่อบอุ่น',
    demoMsg1: 'ยังมองรองเท้าคู่นั้นอยู่ไหม? 👀 เพิ่งลดเหลือ $38 — อยู่ในงบ $40 ของคุณ',
    demoMsg2: 'เยี่ยม! แต่สัปดาห์นี้ซื้อไหวไหม?',
    demoMsg3: 'สัปดาห์นี้เหลือ $52 ซื้อเลย หรือเก็บ $12 เข้าเป้าหมายทริปก่อน?',
    demoChip1: 'ซื้อเลย', demoChip2: 'เก็บเพื่อทริป', demoChip3: 'เตือนวันศุกร์',
    painTitle: 'คุ้นๆ ไหม?',
    pain1: '"เอ๊ะ บันทึกไว้ที่ไหนนะ?"', pain2: '"อุ๊ย ใช้จ่ายเกินอีกแล้ว"',
    pain3: '"ค้นหาของเดิม 5 รอบ"', pain4: '"ทำไมโฆษณาดูมั่วไปหมด?"',
    painPunch: 'คุณไม่ต้องการแอปช้อปปิ้งอีกตัว คุณต้องการเพื่อนที่เข้าใจเงินของคุณจริงๆ',
    howEyebrow: 'วิธีใช้งาน', howTitle: 'แค่สามแตะ เท่านั้น',
    how1Title: 'บอกสไตล์ของคุณ', how1Desc: 'ตั้งงบและเป้าหมายการออม ใช้เวลา 30 วินาที',
    how2Title: 'ให้มันคอยดูแล', how2Desc: 'บันทึกสินค้า แล้วเพื่อนจะติดตามราคา สต็อก และงบให้คุณ',
    how3Title: 'ซื้อในเวลาที่ใช่', how3Desc: 'เตือนเมื่อราคาเหมาะ — ไม่เร่งก่อนที่คุณจะซื้อไหว',
    whoEyebrow: 'เหมาะกับใคร', whoTitle: 'เพื่อนคนเดียว ในแบบของคุณ',
    whoStudentT: 'นักเรียน/นักศึกษา', whoStudentP: 'ยืดเงินค่าขนมทุกสัปดาห์ เก็บเงินก้อนใหญ่ด้วยกระเป๋าเป้าหมายและชัยชนะเล็กๆ', whoStudentTag: 'งบรายสัปดาห์ · กระเป๋าเป้าหมาย · สตรีคสนุก',
    whoWorkingT: 'คนทำงาน', whoWorkingP: 'วางแผนรอบเงินเดือน จัดสมดุลซับสคริปชัน การออม และของรางวัล — โดยไม่ต้องใช้ตาราง', whoWorkingTag: 'แผนรายเดือน · เตือนอัจฉริยะ · สั่งซ้ำ',
    saveEyebrow: 'ออมแบบไม่ต้องคิด', saveTitle: 'เปลี่ยน "อยากได้" เป็น "ได้มาแล้ว"',
    saveLead: 'เจอของที่ชอบแต่เกินงบ? เพื่อนจะตั้งกระเป๋าเป้าหมายและช่วยคุณเก็บเงินอย่างเงียบๆ — แล้วตรวจราคาอีกครั้งก่อนซื้อ',
    saveLi1: '✅ ตั้งเป้าหมายในแตะเดียว', saveLi2: '✅ ดูแถบความคืบหน้าเต็มขึ้น', saveLi3: '✅ ซื้อเมื่อพร้อมจริงๆ',
    saveGoalName: 'ทริปญี่ปุ่น', saveGoalSub: 'ออมแล้ว $320 จาก $500', saveGoalFoot: '🎉 ถึง 64% แล้ว — อีกราว 4 สัปดาห์',
    saveGoal2Name: 'รองเท้าใหม่', saveGoal2Sub: 'ออมแล้ว $48 จาก $60', saveGoal2Foot: 'เกือบถึงแล้ว! 🔥',
    roleStudent: 'นักเรียน', roleWorking: 'คนทำงาน',
    phUsername: 'เลือกชื่อผู้ใช้', phEmail: 'อีเมล (ไม่บังคับ)', phPassword: 'รหัสผ่าน (6+ ตัว)', phConfirm: 'ยืนยันรหัสผ่าน',
    phUsername2: 'ชื่อผู้ใช้', phPassword2: 'รหัสผ่าน',
    signupBtn: 'สร้างบัญชีของฉัน →', signinBtn: 'เข้าสู่ระบบและเปิดแอป →',
    demoHint: 'ลองเดโม — user: <strong>user</strong> · pass: <strong>password</strong>',
    authFoot: 'ไม่ถึงนาที · ข้อมูลเป็นส่วนตัว · เพื่อทุกคน',
    faqTitle: 'คำถามด่วน',
    faqQ1: 'จริงๆ แล้วเพื่อใคร?', faqA1: 'ทุกคนที่อยากช้อปอย่างมีเป้าหมาย ทั้งนักเรียนที่บริหารค่าขนม และคนทำงานที่วางแผนตามวันเงินเดือนออก ไม่ต้องมีพื้นฐานการเงิน',
    faqQ2: 'มันเห็นบัญชีธนาคารฉันไหม?', faqA2: 'ไม่ คุณแค่บอกงบและเป้าหมาย มันไม่แตะธนาคาร และร้านค้าไม่เห็นตัวเลขส่วนตัวของคุณ',
    faqQ3: 'จะสแปมฉันไหม?', faqA3: 'ไม่มีวัน คุณตั้งช่วงเวลาเงียบและความถี่ได้ เตือนเฉพาะตอนมีประโยชน์จริง',
    faqQ4: 'ใช้กับร้านไหนได้บ้าง?', faqA4: 'บันทึกลิงก์จาก Shopee, SHEIN, TikTok Shop, Taobao และ Pinduoduo — รวมในรายการเดียว',
    finalTitle: 'ช้อปอย่างฉลาด เพื่อทุกคน', finalP: 'มาร่วมกับนักช้อปที่เลือกความตั้งใจมากกว่าความหุนหันพลันแล่น', finalCta: 'พบเพื่อนของคุณ',
    footerTag: 'ช้อปฉลาดขึ้น ใช้จ่ายน้อยลง เก็บเงินเพื่อสิ่งสำคัญ', footerNote: 'The 2am Shoppers · Team 2AM Deployers · AI Ignition · Problem Statement 1',
    navGetApp: 'ดาวน์โหลดแอป',
    heroTypePrefix: 'เหมือนมีเพื่อนที่บอกว่า:',
    heroType: '"เดี๋ยว — วันศุกร์ถูกกว่านะ เก็บ $12 ก่อนดีกว่า 😉"',
    getAppEyebrow: 'ดาวน์โหลดแอป', getAppTitle: 'สแกน ติดตั้ง ช้อปฉลาดขึ้น',
    getAppLead: 'ส่องกล้องมือถือที่โค้ด แล้วเพื่อนของคุณจะติดตั้งในไม่กี่วินาที — ใช้งานออฟไลน์ได้หลังติดตั้ง',
    getAppScan: '📷 สแกนด้วยกล้องมือถือ',
    getAppIosT: 'iPhone / iPad (Safari)', getAppIos1: 'เปิดลิงก์ใน Safari', getAppIos2: 'แตะปุ่มแชร์', getAppIos3: 'แตะ เพิ่มไปยังหน้าจอหลัก', getAppIos4: 'แตะ เพิ่ม — เสร็จ! 🎉',
    getAppAndT: 'Android (Chrome)', getAppAnd1: 'เปิดลิงก์ใน Chrome', getAppAnd2: 'แตะเมนู (⋮)', getAppAnd3: 'แตะ ติดตั้งแอป', getAppAnd4: 'ยืนยัน — อยู่บนหน้าจอหลักแล้ว 🎉',
    getAppPcT: 'เดสก์ท็อป (Chrome / Edge)', getAppPc1: 'เปิด localhost:3003', getAppPc2: 'คลิกไอคอนติดตั้ง (⊕) ในแถบที่อยู่', getAppPc3: 'คลิก ติดตั้ง — เปิดในหน้าต่างของตัวเอง',
    navFeatures: 'ฟีเจอร์', navLogin: 'เข้าสู่ระบบ',
    navSignup: 'สมัครสมาชิก', featEyebrow: 'ฟีเจอร์',
    featTitle: 'ทุกอย่างที่คุณต้องใช้เพื่อช้อปอย่างตั้งใจ', featLead: 'ตั้งแต่ "ควรซื้อไหม?" จนถึง "เก็บเงินซื้อได้แล้ว" แอปเดียวครบทุกขั้นตอน',
    feat1T: 'ผู้ช่วย 2AM', feat1P: 'ถามก่อนซื้อ ผู้ช่วยรู้งบของคุณและให้ความเห็นที่ตรงไปตรงมา แม้ตอนดึก',
    pv1Me: 'หูฟัง $59 อันนี้ควรซื้อไหม?', pv1Ai: 'สัปดาห์นี้เหลือ $52 รอเซลวันศุกร์ดีไหม?',
    feat2T: 'งบประมาณที่เข้ากับชีวิตคุณ', feat2P: 'รายสัปดาห์สำหรับนักเรียน รายเดือนสำหรับคนทำงาน เห็นยอดคงเหลือหลังหักค่าจำเป็นและเงินออมเสมอ',
    pv2Label: 'เหลือสัปดาห์นี้', pv2Spent: 'ใช้ไป $28',
    feat3T: 'กระเป๋าเป้าหมาย', feat3P: 'เปลี่ยน "สักวัน" ให้เป็นแผน ตั้งเป้าหมาย ออมทีละนิดทุกสัปดาห์ แล้วดูมันเต็มขึ้น',
    feat4T: 'นอนคิดก่อน', feat4P: 'ตีสองเก็บไว้ในวิชลิสต์ก่อน ตัดสินใจตอนเช้า เราจะทักก่อนคุณซื้อ ไม่ใช่ตอนที่คุณเลื่อนดู',
    pv4Item: 'หูฟังไร้สาย', pv4Tag: '⏰ 9:00 น.',
    pv4Item2: 'เสื้อผ้าลินิน', pv4Tag2: '✓ อยู่ในงบ',
    feat5T: 'ค้นพบสิ่งที่ใช่สำหรับคุณ', feat5P: 'ปัดดูวิดีโอสินค้าสั้น ๆ ที่คัดตามความสนใจและกรองตามงบที่คุณจ่ายไหว',
    pv5Cap: 'ชุดกาแฟสกัดเย็น · $18', pv5Chip1: '☕ กาแฟ',
    pv5Chip2: 'ไม่เกิน $20', feat6T: 'ทุกร้าน ในลิสต์เดียว',
    feat6P: 'บันทึกลิงก์จาก Shopee, SHEIN, TikTok Shop, Taobao และ Pinduoduo ไว้ในวิชลิสต์เดียว', pv6: 'วิชลิสต์เดียว',
    privT: 'ความเป็นส่วนตัวมาก่อน', privP: 'งบ เงินออม และวิชลิสต์ของคุณอยู่บนอุปกรณ์ของคุณ ร้านค้าไม่เห็นตัวเลขของคุณ และเราไม่เคยขอรหัสผ่านแพลตฟอร์มช้อปปิ้งของคุณ',
    loginTitle: 'ยินดีต้อนรับกลับ', loginSub: 'เข้าสู่ระบบเพื่อทำต่อจากที่ค้างไว้',
    signupTitle: 'สร้างบัญชีของคุณ', signupSub: 'ใช้เวลาไม่ถึงนาที แล้วเราจะพาคุณเข้าแอปทันที',
    haveAccount: 'เป็นสมาชิกอยู่แล้ว?', signInLink: 'เข้าสู่ระบบ',
    newHere: 'มาใหม่ใช่ไหม?', createLink: 'สร้างบัญชี',
    backHome: '← กลับหน้าแรก',
    heroTeam: 'โปรเจกต์โดย <strong>Team 2AM Deployers</strong> · AI Ignition · โจทย์ที่ 1', testEyebrow: 'ความคืบหน้า',
    testTitle: 'สิ่งที่เราสร้าง ทดสอบ และได้เรียนรู้', testLead: 'ต้นแบบที่ใช้งานได้จริงวันนี้ โดยระบุชัดเจนว่าส่วนไหนยังเป็นการจำลอง',
    testBuiltT: '✅ สร้างและทดสอบแล้ว', testBuilt1: 'โหมดนักเรียน (รายสัปดาห์) และคนทำงาน (รายเดือน) ที่คำนวณเงินที่ใช้ได้อย่างปลอดภัย',
    testBuilt2: 'ฟีดวิดีโอเฉพาะของแต่ละผู้ใช้: คลิปสินค้าจริง 20 คลิป พร้อมลิงก์ร้านค้าและปุ่มเปิดปิดเสียง', testBuilt3: 'การถาม "ซื้อแล้วหรือยัง?": บันทึกการซื้อ $22.34 ทำให้งบรายสัปดาห์ $50 เหลือ $27.66',
    testBuilt4: 'Hoot ผู้ช่วย AI มีสองน้ำเสียง พร้อมการ์ดสินค้า และตอบได้แม้ออฟไลน์', testBuilt5: 'การเตือนและการแจ้งเตือนงบมาแค่ครั้งเดียวและเคารพช่วงเวลาเงียบ',
    testBuilt6: 'เลย์เอาต์มือถือและคอมพิวเตอร์ ห้าภาษา ธีมมืดและสว่าง', testLearnT: '💡 สิ่งที่เราได้เรียนรู้',
    testLearn1: 'งบเดียวใช้กับทุกคนไม่ได้: นักเรียนคิดเป็นรายสัปดาห์ คนทำงานคิดเป็นรายเดือน จึงมีหน้าจอและคำพูดของตัวเอง', testLearn2: 'น้ำเสียงสำคัญ คำแนะนำเดียวกันจะได้ผลกว่าเมื่อมาจาก "เพื่อนสนิท" หรือ "โค้ช" ที่เหมาะกับคนนั้น',
    testLearn3: 'ร้านค้าไม่บอกเราว่ามีการซื้อหรือไม่ การถามครั้งเดียวตอนกลับมาเป็นวิธีง่ายและใช้ได้กับทุกร้าน', testLearn4: 'เบราว์เซอร์ปิดเสียงวิดีโอและบล็อกการแจ้งเตือนเป็นค่าเริ่มต้น เราจึงขออนุญาตในจังหวะที่เป็นประโยชน์',
    testLearn5: 'ผู้ช่วยต้องไม่ล่ม: เมื่อเซิร์ฟเวอร์ AI ออฟไลน์ Hoot ยังตอบได้จากข้อมูลในมือถือ', testSimT: '🧪 ยังเป็นการจำลอง',
    testSim1: 'การเชื่อมต่อแพลตฟอร์มช้อปปิ้งเป็นแบบลิงก์เท่านั้น ยังไม่มี API ร้านค้าจริง', testSim2: 'การซื้อได้รับการยืนยันจากผู้ใช้ ไม่ใช่จากร้านค้า',
    testSim3: 'คำตอบ AI แบบสดต้องใช้ API key และเซิร์ฟเวอร์ เราทดสอบโหมดออฟไลน์', testSim4: 'บัญชีเก็บแยกตามอุปกรณ์ และวิดีโอเดโมเป็นคลิปของบุคคลที่สาม',
    nextEyebrow: 'ขั้นต่อไป', nextTitle: 'สิ่งที่เราจะทำต่อ',
    next1T: 'เปิดตัวเบต้าออนไลน์', next1P: 'นำแอปและเซิร์ฟเวอร์ AI ขึ้นออนไลน์ พร้อมบัญชีจริงที่ซิงก์ข้ามอุปกรณ์',
    next2T: 'ยืนยันการซื้ออัตโนมัติ', next2P: 'เข้าร่วมโปรแกรม affiliate ของ Shopee และ TikTok Shop เพื่อให้แอปรู้ว่าลิงก์นำไปสู่คำสั่งซื้อ',
    next3T: 'การแจ้งเตือนที่มาถึงเสมอ', next3P: 'เพิ่มเซิร์ฟเวอร์ push ให้การเตือนมาถึงแม้ปิดแอปอยู่',
    next4T: 'ฟีด "For You" จากวิดีโอพาร์ทเนอร์', next4P: 'แบรนด์อัปโหลดวิดีโอเอง และฟีดเรียนรู้จากสิ่งที่ผู้ใช้ดู บันทึก และข้าม โดยกรองตามงบเสมอ',
    next5T: 'ทดลองใช้และวัดผล', next5P: 'ทดสอบกับนักเรียนและคนทำงาน และวัดการซื้อแบบหุนหันที่หลีกเลี่ยงได้และเป้าหมายการออมที่สำเร็จ',
    finalTeam: '<strong>The 2am Shoppers</strong> · สร้างโดย Team 2AM Deployers สำหรับ AI Ignition โจทย์ที่ 1',
  },

  ko: {
    navHow: '사용 방법', navWho: '누구를 위한 건가요',navFaq: '자주 묻는 질문',
    heroPill: '당신의 2am 쇼핑 버디 — 24시간 대기 중',
    heroLine1: '더 똑똑하게 쇼핑하세요.', heroLine2: '덜 쓰세요.', heroLine3: '소중한 것을 위해 모으세요.',
    heroP: '당신의 예산을 기억하고, 저축 목표를 따라가고, 정말 도움될 때만 알려주는 AI 버디. 스팸 없음, 과소비 없음, 스트레스 없음.',
    heroCtaMain: '쇼핑 버디 만나기', heroCtaSub: '기능 보기',
    heroTrust1: '🤝 학생과 직장인을 위해', heroTrust2: '🔒 금융 데이터는 비공개', heroTrust3: '🌏 아시아 전역, 모두를 위해',
    missionEyebrow: '우리의 미션', missionTitle: '똑똑한 돈 관리가 사치여서는 안 됩니다.',
    missionLead: '최고의 금융 도구는 늘 이미 돈과 지식이 있는 사람들을 위해 만들어져 왔어요. 우리는 그걸 바꿉니다. 친근한 일상 AI를 학생과 직장인의 손에 — 더 똑똑한 소비가 소수가 아닌 모두의 것이 되도록.',
    value1T: '모두를 위한 AI', value1P: '금융 학위도, 스프레드시트도, 전문 용어도 필요 없어요. 대화할 수 있다면 쓸 수 있어요 — 어떤 나이든, 당신의 언어로.',
    value2T: '언제나 당신 편', value2P: '우리는 당신이 과소비할 때가 아니라 현명하게 쇼핑할 때 수익을 얻어요. 버디는 당신을 위해 일해요 — 가장 목소리 큰 광고주가 아니라.',
    value3T: '좋은 습관, 부드럽게', value3P: '작은 성공이 쌓여요. 목표 포켓, 연속 기록, 다정한 체크인으로 더 나은 돈 습관이 자연스럽게 자리 잡아요 — 죄책감 없이.',
    value4T: '기본이 존중', value4P: '당신의 예산, 당신의 속도, 당신의 프라이버시. 우리는 압박이나 스팸이 아니라 조용하고 정직한 도움으로 신뢰를 얻어요.',
    value5T: '의도적으로 단순하게', value5P: '강력한 기술을 손쉽게. 몇 분이면 배우고 하루면 익숙해져요 — 도구는 당신의 삶에 맞춰야 하니까요.',
    value6T: '우리 지역을 위해', value6P: '대만에서 태국, 일본에서 싱가포르까지 — 여러 언어, 여러 시장, 하나의 따뜻한 경험.',
    demoMsg1: '그 운동화 아직 보고 있어요? 👀 방금 $38로 내려갔어요 — $40 예산 안이에요.',
    demoMsg2: '좋아! 근데 이번 주에 살 수 있을까?',
    demoMsg3: '이번 주 $52 남았어요. 지금 살까요, 아니면 여행 목표에 $12 먼저 모을까요?',
    demoChip1: '지금 구매', demoChip2: '여행 위해 저축', demoChip3: '금요일에 알림',
    painTitle: '익숙한가요?',
    pain1: '"어, 어디에 저장했더라?"', pain2: '"앗, 또 과소비했네."',
    pain3: '"같은 걸 5번이나 검색했어."', pain4: '"광고가 다 왜 이렇게 뜬금없지?"',
    painPunch: '또 다른 쇼핑 앱이 필요한 게 아니에요. 당신의 돈을 진짜 이해하는 버디가 필요하죠.',
    howEyebrow: '사용 방법', howTitle: '세 번의 탭. 그게 전부예요.',
    how1Title: '취향을 알려주세요', how1Desc: '예산과 저축 목표를 설정하세요. 30초면 돼요.',
    how2Title: '버디에게 맡기세요', how2Desc: '상품을 저장하면 버디가 가격, 재고, 예산을 추적해요.',
    how3Title: '딱 맞는 때에 구매', how3Desc: '가격이 맞을 때만 알려줘요 — 살 수 있기 전엔 재촉하지 않아요.',
    whoEyebrow: '누구를 위한 건가요', whoTitle: '하나의 버디, 당신 방식대로.',
    whoStudentT: '학생', whoStudentP: '매주 용돈을 알뜰하게. 목표 포켓과 작은 성취로 큰 목표를 위해 저축하세요.', whoStudentTag: '주간 예산 · 목표 포켓 · 재미있는 연속 기록',
    whoWorkingT: '직장인', whoWorkingP: '급여일에 맞춰 계획하세요. 구독, 저축, 보상을 스프레드시트 없이 균형 있게.', whoWorkingTag: '월간 계획 · 스마트 알림 · 재주문',
    saveEyebrow: '생각 없이 저축', saveTitle: '"갖고 싶어"를 "가졌어"로.',
    saveLead: '마음에 드는데 예산 초과인가요? 버디가 목표 포켓을 만들어 조용히 도와주고 — 사기 전에 가격이 여전히 맞는지 확인해요.',
    saveLi1: '✅ 한 번의 탭으로 목표 설정', saveLi2: '✅ 진행 바가 차오르는 걸 보세요', saveLi3: '✅ 정말 준비됐을 때 구매',
    saveGoalName: '일본 여행', saveGoalSub: '$500 중 $320 저축', saveGoalFoot: '🎉 64% 달성 — 약 4주 남음',
    saveGoal2Name: '새 운동화', saveGoal2Sub: '$60 중 $48 저축', saveGoal2Foot: '거의 다 왔어요! 🔥',
    roleStudent: '학생', roleWorking: '직장인',
    phUsername: '사용자 이름 선택', phEmail: '이메일 (선택)', phPassword: '비밀번호 (6자 이상)', phConfirm: '비밀번호 확인',
    phUsername2: '사용자 이름', phPassword2: '비밀번호',
    signupBtn: '내 계정 만들기 →', signinBtn: '로그인하고 앱 열기 →',
    demoHint: '데모 사용 — user: <strong>user</strong> · pass: <strong>password</strong>',
    authFoot: '1분 이내 · 데이터는 비공개 · 모두를 위해',
    faqTitle: '간단한 질문',
    faqQ1: '정말 누구를 위한 건가요?', faqA1: '의도를 가지고 쇼핑하고 싶은 모든 사람 — 용돈을 알뜰하게 쓰는 학생, 월급날에 맞춰 계획하는 직장인. 금융 배경은 필요 없어요.',
    faqQ2: '제 은행 계좌를 볼 수 있나요?', faqA2: '아니요. 예산과 목표만 알려주면 돼요. 은행은 건드리지 않고, 쇼핑몰도 개인 숫자를 못 봐요.',
    faqQ3: '스팸을 보내나요?', faqA3: '절대 아니에요. 방해 금지 시간과 메시지 빈도를 직접 설정하고, 정말 유용할 때만 알려요.',
    faqQ4: '어떤 쇼핑몰과 연동되나요?', faqA4: 'Shopee, SHEIN, TikTok Shop, Taobao, Pinduoduo 링크를 한 목록에 저장해요.',
    finalTitle: '똑똑한 쇼핑, 모두에게 열려 있어요.', finalP: '충동보다 의도를 선택하는 쇼퍼들과 함께하세요.', finalCta: '버디 만나기',
    footerTag: '더 똑똑하게 쇼핑. 덜 쓰기. 소중한 것을 위해 저축.', footerNote: 'The 2am Shoppers · Team 2AM Deployers · AI Ignition · Problem Statement 1',
    navGetApp: '앱 받기',
    heroTypePrefix: '이렇게 말해주는 친구 같아요:',
    heroType: '"잠깐 — 금요일에 더 싸게 살 수 있어. $12 먼저 모으자 😉"',
    getAppEyebrow: '앱 받기', getAppTitle: '스캔. 설치. 더 똑똑하게 쇼핑.',
    getAppLead: '휴대폰 카메라로 코드를 비추면 몇 초 만에 버디가 설치돼요 — 설치 후엔 오프라인에서도 작동해요.',
    getAppScan: '📷 휴대폰 카메라로 스캔하세요',
    getAppIosT: 'iPhone / iPad (Safari)', getAppIos1: 'Safari에서 링크를 열어요.', getAppIos2: '공유 버튼을 누르세요.', getAppIos3: '"홈 화면에 추가"를 누르세요.', getAppIos4: '추가를 누르면 — 완료! 🎉',
    getAppAndT: 'Android (Chrome)', getAppAnd1: 'Chrome에서 링크를 열어요.', getAppAnd2: '메뉴 (⋮)를 누르세요.', getAppAnd3: '"앱 설치"를 누르세요.', getAppAnd4: '확인하면 — 홈 화면에 추가돼요. 🎉',
    getAppPcT: '데스크톱 (Chrome / Edge)', getAppPc1: 'localhost:3003을 열어요.', getAppPc2: '주소창의 설치 아이콘 (⊕)을 클릭하세요.', getAppPc3: '설치를 클릭하면 — 자체 창에서 열려요.',
    navFeatures: '기능', navLogin: '로그인',
    navSignup: '회원가입', featEyebrow: '기능',
    featTitle: '의도 있는 쇼핑에 필요한 모든 것', featLead: '"이거 사도 될까?"부터 "모아서 샀다!"까지 — 앱 하나로 전부.',
    feat1T: '2AM 어시스턴트', feat1P: '사기 전에 물어보세요. 예산을 알고 있어서 한밤중에도 솔직한 두 번째 의견을 줘요.',
    pv1Me: '이 $59 이어폰 사도 될까?', pv1Ai: '이번 주 남은 돈은 $52예요. 금요일 세일까지 기다릴까요?',
    feat2T: '생활에 맞는 예산', feat2P: '학생은 주 단위, 직장인은 월 단위. 필수 지출과 저축을 빼고 얼마 남았는지 항상 보여요.',
    pv2Label: '이번 주 남은 금액', pv2Spent: '사용 $28',
    feat3T: '목표 포켓', feat3P: '"언젠가"를 계획으로. 목표를 정하고 매주 조금씩 모으며 채워지는 걸 지켜보세요.',
    feat4T: '하룻밤 생각하기', feat4P: '새벽 2시엔 위시리스트에 담고, 아침에 결정하세요. 스크롤할 때가 아니라 사기 전에 확인해 드려요.',
    pv4Item: '무선 이어폰', pv4Tag: '⏰ 오전 9:00',
    pv4Item2: '린넨 셔츠', pv4Tag2: '✓ 예산 내',
    feat5T: '나를 위한 발견', feat5P: '관심사에 맞춰 고르고 예산으로 걸러낸 짧은 상품 영상을 넘겨보세요.',
    pv5Cap: '콜드브루 키트 · $18', pv5Chip1: '☕ 커피',
    pv5Chip2: '$20 이하', feat6T: '모든 쇼핑몰을 한 목록에',
    feat6P: 'Shopee, SHEIN, TikTok Shop, Taobao, Pinduoduo 링크를 하나의 위시리스트에 저장하세요.', pv6: '하나의 위시리스트',
    privT: '프라이버시 우선', privP: '예산, 저축, 위시리스트는 내 기기에 저장돼요. 쇼핑몰은 내 숫자를 볼 수 없고, 쇼핑몰 비밀번호도 절대 묻지 않아요.',
    loginTitle: '다시 오신 걸 환영해요', loginSub: '로그인하고 이어서 시작하세요.',
    signupTitle: '계정 만들기', signupSub: '1분이면 끝나요. 바로 앱으로 안내해 드릴게요.',
    haveAccount: '이미 회원이신가요?', signInLink: '로그인',
    newHere: '처음이신가요?', createLink: '계정 만들기',
    backHome: '← 홈으로',
    heroTeam: '<strong>Team 2AM Deployers</strong>의 프로젝트 · AI Ignition · 과제 1', testEyebrow: '진행 상황',
    testTitle: '우리가 만들고, 테스트하고, 배운 것', testLead: '오늘 바로 써볼 수 있는 작동하는 프로토타입이며, 아직 시뮬레이션인 부분은 명확히 표시했어요.',
    testBuiltT: '✅ 구현 및 테스트 완료', testBuilt1: '학생(주 단위)과 직장인(월 단위) 모드로 안전하게 쓸 수 있는 금액을 계산해요.',
    testBuilt2: '페르소나별 영상 피드: 실제 상품 영상 20개, 각각 쇼핑 링크와 소리 켜기/끄기 포함.', testBuilt3: '"구매하셨나요?" 확인: $22.34 구매를 기록하면 주간 예산 $50이 $27.66이 돼요.',
    testBuilt4: 'AI 어시스턴트 Hoot는 두 가지 말투로, 상품 카드와 함께 오프라인에서도 답해요.', testBuilt5: '리마인더와 예산 알림은 한 번만 오고 방해 금지 시간을 지켜요.',
    testBuilt6: '휴대폰·데스크톱 레이아웃, 5개 언어, 다크·라이트 테마.', testLearnT: '💡 우리가 배운 것',
    testLearn1: '예산 하나로는 모두에게 맞지 않아요: 학생은 주 단위, 직장인은 월 단위로 생각해서 각자 화면과 말투를 따로 만들었어요.', testLearn2: '말투가 중요해요. 같은 조언도 그 사람에게 맞는 "베프"나 "코치"가 하면 더 잘 전달돼요.',
    testLearn3: '쇼핑몰은 구매 여부를 알려주지 않아요. 돌아왔을 때 한 번 묻는 방식이 간단하고 어떤 쇼핑몰에서도 통해요.', testLearn4: '브라우저는 기본적으로 영상을 음소거하고 알림을 막아서, 도움이 되는 순간에 권한을 요청해요.',
    testLearn5: '어시스턴트는 멈추면 안 돼요: AI 서버가 오프라인이어도 Hoot는 휴대폰의 데이터로 답해요.', testSimT: '🧪 아직 시뮬레이션',
    testSim1: '쇼핑몰 연동은 링크만 가능하고, 실제 쇼핑몰 API는 아직 없어요.', testSim2: '구매는 쇼핑몰이 아니라 사용자의 답으로 확인해요.',
    testSim3: '실시간 AI 답변에는 API 키와 서버가 필요해요. 테스트한 것은 오프라인 모드예요.', testSim4: '계정은 기기별로 저장되고, 데모 영상은 제3자 클립이에요.',
    nextEyebrow: '다음 단계', nextTitle: '앞으로의 계획',
    next1T: '호스팅 베타 출시', next1P: '앱과 AI 서버를 온라인에 올리고, 기기 간 동기화되는 실제 계정을 제공해요.',
    next2T: '구매 자동 확인', next2P: 'Shopee와 TikTok Shop 제휴 프로그램에 참여해 링크로 주문이 생겼는지 알 수 있게 해요.',
    next3T: '항상 도착하는 알림', next3P: '푸시 서버를 추가해 앱이 닫혀 있어도 리마인더가 도착하게 해요.',
    next4T: '파트너 영상 "For You" 피드', next4P: '브랜드가 직접 영상을 올리고, 피드는 시청·저장·건너뛰기로 학습하며 항상 예산에 맞게 걸러요.',
    next5T: '시범 운영과 측정', next5P: '학생과 직장인과 함께 테스트하고, 피한 충동구매와 달성한 저축 목표를 측정해요.',
    finalTeam: '<strong>The 2am Shoppers</strong> · Team 2AM Deployers가 AI Ignition 과제 1을 위해 제작',
  },
};

const LANG_KEY = '2am-shoppers-website-lang';

function applyLang(code) {
  const dict = T[code] || T.en;
  // Fall back to English so a missing key never leaves the previous language behind.
  const tr = key => dict[key] ?? T.en[key];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = tr(el.getAttribute('data-i18n'));
    if (val != null) el.innerHTML = val;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const val = tr(el.getAttribute('data-i18n-ph'));
    if (val != null) el.setAttribute('placeholder', val);
  });
  document.documentElement.setAttribute('lang', code);
  const meta = LANG_META[code] || LANG_META.en;
  const flag = document.getElementById('lang-flag');
  const label = document.getElementById('lang-label');
  if (flag) flag.textContent = meta.flag;
  if (label) label.textContent = meta.label;
  localStorage.setItem(LANG_KEY, code);
  // Re-run the hero typewriter with the newly-translated line — but only
  // after the initial page load, so the launch sequence controls the first run.
  if (window._langReady && typeof runHeroType === 'function') runHeroType();
}

/* language dropdown */
const langBtn  = document.getElementById('lang-btn');
const langMenu = document.getElementById('lang-menu');
langBtn?.addEventListener('click', e => {
  e.stopPropagation();
  const open = langMenu.classList.toggle('open');
  langBtn.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', () => langMenu?.classList.remove('open'));
document.querySelectorAll('.lang-opt').forEach(opt =>
  opt.addEventListener('click', () => { applyLang(opt.dataset.lang); langMenu.classList.remove('open'); })
);

/* initial language: saved → browser → en */
(function initLang() {
  let code = localStorage.getItem(LANG_KEY);
  if (!code) {
    const n = (navigator.language || 'en').toLowerCase();
    if (n.startsWith('ja')) code = 'ja';
    else if (n.startsWith('zh')) code = 'zh';
    else if (n.startsWith('th')) code = 'th';
    else if (n.startsWith('ko')) code = 'ko';
    else code = 'en';
  }
  applyLang(code);
  window._langReady = true; // subsequent language switches may re-run the typewriter
})();

/* ============================================================
   AUTH  (login.html / signup.html — shared localStorage with the app's
          auth store + URL handoff)
   ============================================================ */
const AUTH_KEY = '2am-shoppers-auth';
let signupRole = 'student';

function seedAccounts() {
  return [{
    id: 'admin-001', username: 'user', password: 'password',
    email: 'admin@2amshoppers.com', name: 'Admin', role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  }];
}
function readAuthState() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; }
}
function loadAccounts() {
  return readAuthState()?.state?.accounts ?? seedAccounts();
}
function writeAuthState(updates) {
  try {
    const existing = readAuthState() ?? { state: {}, version: 0 };
    if (!existing.state) existing.state = {};
    if (!existing.state.accounts) existing.state.accounts = seedAccounts();
    Object.assign(existing.state, updates);
    localStorage.setItem(AUTH_KEY, JSON.stringify(existing));
  } catch (e) { console.warn('auth write failed', e); }
}

window.pickRole = function(role, el) {
  signupRole = role;
  document.querySelectorAll('.role').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
};

window.togglePw = function(id, btn) {
  const input = document.getElementById(id);
  if (!input) return;
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  btn.textContent = isText ? '👁️' : '🙈';
};

function showError(id, msg) { const el = document.getElementById(id); if (el) el.textContent = msg; }
function clearError(id)     { const el = document.getElementById(id); if (el) el.textContent = ''; }
function setLoading(id, on) {
  const b = document.getElementById(id); if (!b) return;
  b.disabled = on;
  if (on) { b.dataset.t = b.textContent; b.textContent = 'Please wait…'; }
  else b.textContent = b.dataset.t ?? b.textContent;
}

/* Shared congrats overlay + guaranteed handoff into the app. */
function openAppHandoff(account, { isNew }) {
  // Write to this origin's storage too (helps when site + app share origin).
  writeAuthState({ currentUser: account, isLoggedIn: true });

  const dest = appHandoffUrl(account, '/login');

  const overlay = document.getElementById('congrats-overlay');
  const emoji   = document.getElementById('congrats-emoji');
  const title   = document.getElementById('congrats-title');
  const sub     = document.getElementById('congrats-sub');
  const btn     = document.getElementById('congrats-btn');
  const small   = document.getElementById('congrats-small');
  const close   = document.getElementById('congrats-close');

  if (emoji) emoji.textContent = isNew ? '🎉' : '👋';
  if (title) title.textContent = isNew ? `Welcome, ${account.name}!` : `Welcome back, ${account.name}!`;
  if (sub)   sub.textContent   = 'Opening your shopping buddy…';
  if (btn)   { btn.href = dest; btn.textContent = 'Open the app →'; }
  if (small) small.textContent = 'Not opening? Make sure the app is running at localhost:3003, then tap the button.';
  if (overlay) overlay.style.display = 'flex';
  if (close)   close.onclick = () => overlay && (overlay.style.display = 'none');
  if (overlay) overlay.onclick = e => { if (e.target === overlay) overlay.style.display = 'none'; };

  // Auto-open the app in a new tab shortly after showing the overlay.
  setTimeout(() => { try { window.open(dest, '_blank', 'noopener'); } catch {} }, 900);
}

window.handleSignup = function(e) {
  e.preventDefault();
  clearError('signup-error');
  const username = document.getElementById('signup-username')?.value.trim();
  const email    = document.getElementById('signup-email')?.value.trim();
  const password = document.getElementById('signup-password')?.value;
  const confirm  = document.getElementById('signup-confirm')?.value;

  if (!username)            return showError('signup-error', 'Pick a username to continue.');
  if (!password)            return showError('signup-error', 'Add a password.');
  if (password.length < 6)  return showError('signup-error', 'Password needs at least 6 characters.');
  if (password !== confirm) return showError('signup-error', "Passwords don't match.");

  setLoading('signup-btn', true);
  setTimeout(() => {
    const accounts = loadAccounts();
    if (accounts.find(a => a.username.toLowerCase() === username.toLowerCase())) {
      setLoading('signup-btn', false);
      return showError('signup-error', 'That username is taken — try another.');
    }
    const account = {
      id: (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
      username, password, email: email ?? '', name: username, role: signupRole,
      createdAt: new Date().toISOString(),
      offerTour: true, // the app offers its tour to new sign-ups
    };
    writeAuthState({ accounts: [...accounts, account], currentUser: account, isLoggedIn: true });
    setLoading('signup-btn', false);
    openAppHandoff(account, { isNew: true });
  }, 450);
};

window.handleSignin = function(e) {
  e.preventDefault();
  clearError('signin-error');
  const username = document.getElementById('signin-username')?.value.trim();
  const password = document.getElementById('signin-password')?.value;
  if (!username || !password) return showError('signin-error', 'Enter your username and password.');

  setLoading('signin-btn', true);
  setTimeout(() => {
    const account = loadAccounts().find(a =>
      a.username.toLowerCase() === username.toLowerCase() && a.password === password);
    setLoading('signin-btn', false);
    if (!account) {
      showError('signin-error', 'Wrong username or password.');
      const el = document.getElementById('signin-username');
      el?.classList.add('shake'); setTimeout(() => el?.classList.remove('shake'), 500);
      return;
    }
    openAppHandoff(account, { isNew: false });
  }, 450);
};

/* shake keyframes */
(function() {
  const s = document.createElement('style');
  s.textContent = `@keyframes shk{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}.shake{animation:shk .4s ease}`;
  document.head.appendChild(s);
})();

/* progress bars animate when scrolled into view (already CSS, nothing needed) */
