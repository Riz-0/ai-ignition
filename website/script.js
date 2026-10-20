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
  navToggle.setAttribute('aria-expanded', String(open));
});
navLinks?.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => navLinks.classList.remove('open'))
);

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
['.step', '.who-card', '.why-card', '.quote', '.pain-chip', '.goal-card', '.faq-item', '.h2', '.eyebrow', '.pain-punch']
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
    navHow: 'How it works', navWho: "Who it's for", navWhy: 'Why people love it', navFaq: 'FAQ',
    navSignIn: 'Sign in', navStart: 'Start free',
    heroPill: 'Your 2am shopping buddy — now awake 24/7',
    heroLine1: 'Shop smarter.', heroLine2: 'Spend less.', heroLine3: 'Save for what matters.',
    heroP: "Meet the AI buddy that remembers your budget, tracks what you're saving for, and only pings you when it actually helps. No spam. No overspending. No stress.",
    heroCtaMain: 'Get your shopping buddy — free', heroCtaSub: 'See how it works',
    heroTrust1: '⭐ Built for students & working adults', heroTrust2: '🔒 Your money data stays private', heroTrust3: '💸 Free to start',
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
    whoBusinessT: 'Businesses', whoBusinessP: 'Turn one-time buyers into regulars with friendly, well-timed nudges — that respect the customer\'s budget.', whoBusinessTag: 'Real customers · Right timing · Repeat sales',
    whyEyebrow: 'Why people love it', whyTitle: 'A buddy, not a billboard.',
    why1T: 'Remembers everything', why1P: "Every product, price and payday — so you don't have to.",
    why2T: 'Protects your budget', why2P: "It'll never push something you can't comfortably afford.",
    why3T: 'Zero spam', why3P: 'Quiet hours, your frequency. It only pings when it helps.',
    why4T: 'Saves for your goals', why4P: 'Goal pockets turn "someday" into "almost there."',
    why5T: 'All your shops, one place', why5P: 'Shopee, SHEIN, TikTok, Taobao, Pinduoduo — one tidy list.',
    why6T: 'Private by default', why6P: 'Your budget and savings are yours. Shops never see them.',
    saveEyebrow: 'Save without thinking', saveTitle: 'Turn "I want it" into "I got it."',
    saveLead: "See something you love but it's over budget? Your buddy sets up a goal pocket and quietly helps you get there — then checks the price is still right before you buy.",
    saveLi1: '✅ Set a goal in one tap', saveLi2: '✅ Watch the progress bar fill up', saveLi3: '✅ Buy when you\'re actually ready',
    saveGoalName: 'Japan trip', saveGoalSub: '$320 of $500 saved', saveGoalFoot: '🎉 64% there — about 4 weeks to go',
    saveGoal2Name: 'New sneakers', saveGoal2Sub: '$48 of $60 saved', saveGoal2Foot: 'Almost there! 🔥',
    lovedTitle: 'People are into it 💜',
    quote1: '"Finally stopped impulse-buying. It literally told me to wait and save — and I did."', quote1By: '— Mia, student',
    quote2: '"It reorders my coffee right before I run out. Feels like it reads my mind."', quote2By: '— Daniel, working adult',
    quote3: '"My regulars come back more — and they don\'t feel spammed. Win-win."', quote3By: '— Brew & Bites, café',
    startEyebrow: 'Get started', startTitle: 'Meet your buddy in 30 seconds',
    startLead: "Create a free account, then we'll drop you right into the app.",
    tabSignup: 'Create account', tabSignin: 'Sign in',
    roleStudent: 'Student', roleWorking: 'Working', roleBusiness: 'Business',
    phUsername: 'Pick a username', phEmail: 'Email (optional)', phPassword: 'Password (6+ characters)', phConfirm: 'Confirm password',
    phUsername2: 'Username', phPassword2: 'Password',
    signupBtn: 'Create my account →', signinBtn: 'Sign in & open the app →',
    demoHint: 'Try the demo — user: <strong>user</strong> · pass: <strong>password</strong>',
    authFoot: 'Free forever to start · No card needed · Takes under a minute',
    faqTitle: 'Quick questions',
    faqQ1: 'Is it really free?', faqA1: 'Yes — creating an account and using your shopping buddy is free to start. No card required.',
    faqQ2: 'Can it see my bank account?', faqA2: 'No. You tell it your budget and goals. It never touches your bank, and shops never see your private numbers.',
    faqQ3: 'Will it spam me?', faqA3: 'Never. You set quiet hours and how often it can message you. It only pings when it\'s genuinely useful.',
    faqQ4: 'Which shops does it work with?', faqA4: 'Save links from Shopee, SHEIN, TikTok Shop, Taobao and Pinduoduo — all in one tidy list.',
    finalTitle: 'Your wallet will thank you.', finalP: 'Join the shoppers who buy smarter and save for what matters.', finalCta: "Get your buddy — it's free",
    footerTag: 'Shop smarter. Spend less. Save for what matters.', footerNote: 'Eslitec Hackathon · Problem Statement 1 · A concept demo',
    navGetApp: 'Get the app',
    heroTypePrefix: "It's like having a friend who says:",
    heroType: '"Wait — you can get it cheaper on Friday. Let\'s save $12 first. 😉"',
    getAppEyebrow: 'Get the app', getAppTitle: 'Scan. Install. Shop smarter.',
    getAppLead: "Point your phone camera at the code and your buddy installs in seconds — works offline once it's in.",
    getAppScan: '📷 Scan with your phone camera',
    getAppIosT: 'iPhone / iPad (Safari)', getAppIos1: 'Open the link in Safari.', getAppIos2: 'Tap the Share button.', getAppIos3: 'Tap Add to Home Screen.', getAppIos4: 'Tap Add — done! 🎉',
    getAppAndT: 'Android (Chrome)', getAppAnd1: 'Open the link in Chrome.', getAppAnd2: 'Tap the menu (⋮).', getAppAnd3: 'Tap Install app.', getAppAnd4: "Confirm — it's on your home screen. 🎉",
    getAppPcT: 'Desktop (Chrome / Edge)', getAppPc1: 'Open localhost:3003.', getAppPc2: 'Click the install icon (⊕) in the address bar.', getAppPc3: 'Click Install — opens in its own window.',
  },

  ja: {
    navHow: '使い方', navWho: '対象ユーザー', navWhy: '人気の理由', navFaq: 'FAQ',
    navSignIn: 'サインイン', navStart: '無料で始める',
    heroPill: 'あなたの2amショッピング相棒 — 24時間稼働',
    heroLine1: 'かしこく買う。', heroLine2: '使いすぎない。', heroLine3: '大切なものに貯める。',
    heroP: 'あなたの予算を覚え、貯金目標を追いかけ、本当に役立つときだけ通知するAIの相棒。スパムなし、使いすぎなし、ストレスなし。',
    heroCtaMain: '相棒を無料で手に入れる', heroCtaSub: '使い方を見る',
    heroTrust1: '⭐ 学生・社会人向け', heroTrust2: '🔒 お金のデータは非公開', heroTrust3: '💸 無料で開始',
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
    whoBusinessT: '事業者', whoBusinessP: '一度きりの購入者を常連に。顧客の予算を尊重した、親しみやすい適切なタイミングの通知で。', whoBusinessTag: '実顧客 · 適切な時機 · リピート',
    whyEyebrow: '人気の理由', whyTitle: '広告じゃなく、相棒。',
    why1T: 'すべて記憶', why1P: '商品も価格も給料日も — あなたの代わりに。',
    why2T: '予算を守る', why2P: '無理な買い物は決して勧めません。',
    why3T: 'スパムゼロ', why3P: '静かな時間も頻度もあなた次第。役立つときだけ通知。',
    why4T: '目標に貯金', why4P: '目標ポケットで「いつか」を「もうすぐ」に。',
    why5T: '全ショップを一箇所に', why5P: 'Shopee, SHEIN, TikTok, Taobao, Pinduoduo — すっきり一覧。',
    why6T: '初めからプライベート', why6P: '予算も貯金もあなたのもの。ショップには見えません。',
    saveEyebrow: '考えずに貯金', saveTitle: '「欲しい」を「手に入れた」に。',
    saveLead: '気に入ったけど予算オーバー？相棒が目標ポケットを作り、そっと貯金を助け、買う前に価格を再確認。',
    saveLi1: '✅ ワンタップで目標設定', saveLi2: '✅ 進捗バーが伸びるのを見る', saveLi3: '✅ 本当に準備できたら買う',
    saveGoalName: '日本旅行', saveGoalSub: '$500中$320貯金', saveGoalFoot: '🎉 64%達成 — あと約4週間',
    saveGoal2Name: '新しいスニーカー', saveGoal2Sub: '$60中$48貯金', saveGoal2Foot: 'もうすぐ！🔥',
    lovedTitle: 'みんな夢中 💜',
    quote1: '「衝動買いが止まった。待って貯金しろと言われて、実際そうした。」', quote1By: '— ミア（学生）',
    quote2: '「コーヒーが切れる直前に再注文してくれる。心を読まれてるみたい。」', quote2By: '— ダニエル（社会人）',
    quote3: '「常連がもっと戻ってくる — しかもスパム感なし。双方にメリット。」', quote3By: '— Brew & Bites（カフェ）',
    startEyebrow: '始める', startTitle: '30秒で相棒に出会う',
    startLead: '無料アカウントを作成したら、アプリへご案内します。',
    tabSignup: 'アカウント作成', tabSignin: 'サインイン',
    roleStudent: '学生', roleWorking: '社会人', roleBusiness: '事業者',
    phUsername: 'ユーザー名を選択', phEmail: 'メール（任意）', phPassword: 'パスワード（6文字以上）', phConfirm: 'パスワード確認',
    phUsername2: 'ユーザー名', phPassword2: 'パスワード',
    signupBtn: 'アカウントを作成 →', signinBtn: 'サインインしてアプリを開く →',
    demoHint: 'デモを試す — user: <strong>user</strong> · pass: <strong>password</strong>',
    authFoot: '無料で開始 · カード不要 · 1分以内',
    faqTitle: 'よくある質問',
    faqQ1: '本当に無料？', faqA1: 'はい — アカウント作成と相棒の利用は無料で始められます。カード不要。',
    faqQ2: '銀行口座は見える？', faqA2: 'いいえ。予算と目標を伝えるだけ。銀行には一切触れず、ショップに数字は見えません。',
    faqQ3: 'スパムは来る？', faqA3: '来ません。静かな時間と頻度を設定でき、役立つときだけ通知します。',
    faqQ4: 'どのショップに対応？', faqA4: 'Shopee, SHEIN, TikTok Shop, Taobao, Pinduoduoのリンクを一覧で保存。',
    finalTitle: 'お財布が喜ぶ。', finalP: 'かしこく買い、大切なものに貯めるショッパーの仲間入り。', finalCta: '相棒を無料で手に入れる',
    footerTag: 'かしこく買う。使いすぎない。大切なものに貯める。', footerNote: 'Eslitec ハッカソン · 課題1 · コンセプトデモ',
    navGetApp: 'アプリを入手',
    heroTypePrefix: 'こう言ってくれる友達みたいな存在:',
    heroType: '「待って — 金曜ならもっと安いよ。まず$12貯めよう 😉」',
    getAppEyebrow: 'アプリを入手', getAppTitle: 'スキャン。インストール。かしこく買い物。',
    getAppLead: 'スマホのカメラでコードを読み取れば、数秒で相棒をインストール — 入れたらオフラインでも動きます。',
    getAppScan: '📷 スマホのカメラでスキャン',
    getAppIosT: 'iPhone / iPad (Safari)', getAppIos1: 'Safariでリンクを開く。', getAppIos2: '共有ボタンをタップ。', getAppIos3: '「ホーム画面に追加」をタップ。', getAppIos4: '「追加」をタップ — 完了！🎉',
    getAppAndT: 'Android (Chrome)', getAppAnd1: 'Chromeでリンクを開く。', getAppAnd2: 'メニュー (⋮) をタップ。', getAppAnd3: '「アプリをインストール」をタップ。', getAppAnd4: '確認 — ホーム画面に追加されます。🎉',
    getAppPcT: 'デスクトップ (Chrome / Edge)', getAppPc1: 'localhost:3003 を開く。', getAppPc2: 'アドレスバーのインストールアイコン (⊕) をクリック。', getAppPc3: '「インストール」をクリック — 独立したウィンドウで開きます。',
  },

  zh: {
    navHow: '如何运作', navWho: '适合谁', navWhy: '为何喜爱', navFaq: '常见问题',
    navSignIn: '登录', navStart: '免费开始',
    heroPill: '你的2am购物伙伴 — 24小时在线',
    heroLine1: '更聪明地购物。', heroLine2: '花得更少。', heroLine3: '为重要的事存钱。',
    heroP: '认识这位AI伙伴：记住你的预算，追踪你的储蓄目标，只在真正有用时提醒你。无垃圾信息，不超支，没压力。',
    heroCtaMain: '免费获取你的购物伙伴', heroCtaSub: '看看如何运作',
    heroTrust1: '⭐ 为学生和上班族打造', heroTrust2: '🔒 你的财务数据保密', heroTrust3: '💸 免费开始',
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
    whoBusinessT: '商家', whoBusinessP: '用友好、适时且尊重客户预算的提醒，把一次性买家变成常客。', whoBusinessTag: '真实客户 · 恰当时机 · 回头客',
    whyEyebrow: '为何喜爱', whyTitle: '是伙伴，不是广告牌。',
    why1T: '记住一切', why1P: '每件商品、每个价格、每个发薪日 — 你不用操心。',
    why2T: '守护你的预算', why2P: '绝不推荐你负担不起的东西。',
    why3T: '零垃圾信息', why3P: '安静时段、频率由你定。只在有用时提醒。',
    why4T: '为目标存钱', why4P: '目标钱包把"将来"变成"快了"。',
    why5T: '所有商店，一处搞定', why5P: 'Shopee, SHEIN, TikTok, Taobao, Pinduoduo — 一个清单。',
    why6T: '默认隐私', why6P: '你的预算和储蓄是你的。商店永远看不到。',
    saveEyebrow: '轻松存钱', saveTitle: '把"我想要"变成"我拥有"。',
    saveLead: '看到喜欢但超预算的东西？伙伴帮你建目标钱包，默默助你达成 — 购买前再确认价格合适。',
    saveLi1: '✅ 一键设定目标', saveLi2: '✅ 看着进度条填满', saveLi3: '✅ 真正准备好再买',
    saveGoalName: '日本旅行', saveGoalSub: '已存$320/$500', saveGoalFoot: '🎉 完成64% — 约还剩4周',
    saveGoal2Name: '新运动鞋', saveGoal2Sub: '已存$48/$60', saveGoal2Foot: '快到了！🔥',
    lovedTitle: '大家都爱上了 💜',
    quote1: '"终于不再冲动消费。它真的叫我等一等、存一存 — 我照做了。"', quote1By: '— Mia，学生',
    quote2: '"快喝完时它就帮我重订咖啡。像能读懂我的心。"', quote2By: '— Daniel，上班族',
    quote3: '"回头客更多了 — 而且不觉得被打扰。双赢。"', quote3By: '— Brew & Bites 咖啡馆',
    startEyebrow: '开始', startTitle: '30秒认识你的伙伴',
    startLead: '创建免费账户，我们马上带你进入应用。',
    tabSignup: '创建账户', tabSignin: '登录',
    roleStudent: '学生', roleWorking: '上班族', roleBusiness: '商家',
    phUsername: '选个用户名', phEmail: '邮箱（可选）', phPassword: '密码（6位以上）', phConfirm: '确认密码',
    phUsername2: '用户名', phPassword2: '密码',
    signupBtn: '创建我的账户 →', signinBtn: '登录并打开应用 →',
    demoHint: '试用演示 — 用户: <strong>user</strong> · 密码: <strong>password</strong>',
    authFoot: '免费开始 · 无需银行卡 · 一分钟搞定',
    faqTitle: '快速解答',
    faqQ1: '真的免费吗？', faqA1: '是的 — 创建账户和使用购物伙伴免费开始。无需银行卡。',
    faqQ2: '它能看到我的银行账户吗？', faqA2: '不能。你只告诉它预算和目标。它从不接触你的银行，商店也看不到你的隐私数据。',
    faqQ3: '会给我发垃圾信息吗？', faqA3: '绝不。你设定安静时段和消息频率。只在真正有用时提醒。',
    faqQ4: '支持哪些商店？', faqA4: '保存来自Shopee、SHEIN、TikTok Shop、Taobao和Pinduoduo的链接 — 一个清单搞定。',
    finalTitle: '你的钱包会感谢你。', finalP: '加入更聪明购物、为重要事物存钱的人们。', finalCta: '免费获取你的伙伴',
    footerTag: '更聪明地购物。花得更少。为重要的事存钱。', footerNote: 'Eslitec 黑客松 · 问题陈述1 · 概念演示',
    navGetApp: '获取应用',
    heroTypePrefix: '就像有个朋友对你说：',
    heroType: '"等等 — 周五更便宜哦。先存$12吧 😉"',
    getAppEyebrow: '获取应用', getAppTitle: '扫码。安装。更聪明购物。',
    getAppLead: '用手机相机对准二维码，几秒即可安装你的伙伴 — 装好后离线也能用。',
    getAppScan: '📷 用手机相机扫描',
    getAppIosT: 'iPhone / iPad (Safari)', getAppIos1: '在Safari中打开链接。', getAppIos2: '点击分享按钮。', getAppIos3: '点击"添加到主屏幕"。', getAppIos4: '点击添加 — 完成！🎉',
    getAppAndT: 'Android (Chrome)', getAppAnd1: '在Chrome中打开链接。', getAppAnd2: '点击菜单 (⋮)。', getAppAnd3: '点击"安装应用"。', getAppAnd4: '确认 — 已添加到主屏幕。🎉',
    getAppPcT: '桌面 (Chrome / Edge)', getAppPc1: '打开 localhost:3003。', getAppPc2: '点击地址栏的安装图标 (⊕)。', getAppPc3: '点击安装 — 在独立窗口中打开。',
  },

  th: {
    navHow: 'วิธีใช้งาน', navWho: 'เหมาะกับใคร', navWhy: 'ทำไมถึงชอบ', navFaq: 'คำถามพบบ่อย',
    navSignIn: 'เข้าสู่ระบบ', navStart: 'เริ่มฟรี',
    heroPill: 'เพื่อนช้อปปิ้ง 2am ของคุณ — ตื่นตลอด 24 ชม.',
    heroLine1: 'ช้อปฉลาดขึ้น', heroLine2: 'ใช้จ่ายน้อยลง', heroLine3: 'เก็บเงินเพื่อสิ่งที่สำคัญ',
    heroP: 'พบกับเพื่อน AI ที่จำงบของคุณได้ ติดตามเป้าหมายการออม และเตือนเฉพาะตอนที่มีประโยชน์จริง ไม่มีสแปม ไม่ใช้จ่ายเกิน ไม่เครียด',
    heroCtaMain: 'รับเพื่อนช้อปฟรี', heroCtaSub: 'ดูวิธีใช้งาน',
    heroTrust1: '⭐ สำหรับนักเรียนและคนทำงาน', heroTrust2: '🔒 ข้อมูลการเงินเป็นส่วนตัว', heroTrust3: '💸 เริ่มฟรี',
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
    whoBusinessT: 'ธุรกิจ', whoBusinessP: 'เปลี่ยนลูกค้าครั้งเดียวให้เป็นขาประจำ ด้วยการเตือนที่เป็นมิตรและถูกเวลา — เคารพงบของลูกค้า', whoBusinessTag: 'ลูกค้าจริง · เวลาที่ใช่ · ซื้อซ้ำ',
    whyEyebrow: 'ทำไมถึงชอบ', whyTitle: 'เพื่อน ไม่ใช่ป้ายโฆษณา',
    why1T: 'จำได้ทุกอย่าง', why1P: 'ทุกสินค้า ราคา และวันเงินเดือน — คุณไม่ต้องจำ',
    why2T: 'ปกป้องงบของคุณ', why2P: 'ไม่มีวันเชียร์ของที่คุณจ่ายไม่ไหว',
    why3T: 'ไม่มีสแปม', why3P: 'ช่วงเวลาเงียบและความถี่ตามใจคุณ เตือนเฉพาะตอนมีประโยชน์',
    why4T: 'ออมเพื่อเป้าหมาย', why4P: 'กระเป๋าเป้าหมายเปลี่ยน "สักวัน" เป็น "ใกล้แล้ว"',
    why5T: 'ทุกร้านในที่เดียว', why5P: 'Shopee, SHEIN, TikTok, Taobao, Pinduoduo — รายการเดียวเป็นระเบียบ',
    why6T: 'ส่วนตัวตั้งแต่ต้น', why6P: 'งบและเงินออมเป็นของคุณ ร้านค้ามองไม่เห็น',
    saveEyebrow: 'ออมแบบไม่ต้องคิด', saveTitle: 'เปลี่ยน "อยากได้" เป็น "ได้มาแล้ว"',
    saveLead: 'เจอของที่ชอบแต่เกินงบ? เพื่อนจะตั้งกระเป๋าเป้าหมายและช่วยคุณเก็บเงินอย่างเงียบๆ — แล้วตรวจราคาอีกครั้งก่อนซื้อ',
    saveLi1: '✅ ตั้งเป้าหมายในแตะเดียว', saveLi2: '✅ ดูแถบความคืบหน้าเต็มขึ้น', saveLi3: '✅ ซื้อเมื่อพร้อมจริงๆ',
    saveGoalName: 'ทริปญี่ปุ่น', saveGoalSub: 'ออมแล้ว $320 จาก $500', saveGoalFoot: '🎉 ถึง 64% แล้ว — อีกราว 4 สัปดาห์',
    saveGoal2Name: 'รองเท้าใหม่', saveGoal2Sub: 'ออมแล้ว $48 จาก $60', saveGoal2Foot: 'เกือบถึงแล้ว! 🔥',
    lovedTitle: 'ใครๆ ก็ติดใจ 💜',
    quote1: '"เลิกซื้อของตามอารมณ์ได้สักที มันบอกให้รอและเก็บเงิน — แล้วฉันก็ทำ"', quote1By: '— Mia, นักศึกษา',
    quote2: '"มันสั่งกาแฟให้ก่อนจะหมดพอดี เหมือนอ่านใจได้"', quote2By: '— Daniel, คนทำงาน',
    quote3: '"ลูกค้าประจำกลับมาบ่อยขึ้น — แถมไม่รู้สึกถูกสแปม ได้ทั้งคู่"', quote3By: '— Brew & Bites, คาเฟ่',
    startEyebrow: 'เริ่มต้น', startTitle: 'พบเพื่อนของคุณใน 30 วินาที',
    startLead: 'สร้างบัญชีฟรี แล้วเราจะพาคุณเข้าแอปทันที',
    tabSignup: 'สร้างบัญชี', tabSignin: 'เข้าสู่ระบบ',
    roleStudent: 'นักเรียน', roleWorking: 'คนทำงาน', roleBusiness: 'ธุรกิจ',
    phUsername: 'เลือกชื่อผู้ใช้', phEmail: 'อีเมล (ไม่บังคับ)', phPassword: 'รหัสผ่าน (6+ ตัว)', phConfirm: 'ยืนยันรหัสผ่าน',
    phUsername2: 'ชื่อผู้ใช้', phPassword2: 'รหัสผ่าน',
    signupBtn: 'สร้างบัญชีของฉัน →', signinBtn: 'เข้าสู่ระบบและเปิดแอป →',
    demoHint: 'ลองเดโม — user: <strong>user</strong> · pass: <strong>password</strong>',
    authFoot: 'เริ่มฟรี · ไม่ต้องใช้บัตร · ไม่ถึงนาที',
    faqTitle: 'คำถามด่วน',
    faqQ1: 'ฟรีจริงไหม?', faqA1: 'ใช่ — สร้างบัญชีและใช้เพื่อนช้อปปิ้งเริ่มฟรี ไม่ต้องใช้บัตร',
    faqQ2: 'มันเห็นบัญชีธนาคารฉันไหม?', faqA2: 'ไม่ คุณแค่บอกงบและเป้าหมาย มันไม่แตะธนาคาร และร้านค้าไม่เห็นตัวเลขส่วนตัวของคุณ',
    faqQ3: 'จะสแปมฉันไหม?', faqA3: 'ไม่มีวัน คุณตั้งช่วงเวลาเงียบและความถี่ได้ เตือนเฉพาะตอนมีประโยชน์จริง',
    faqQ4: 'ใช้กับร้านไหนได้บ้าง?', faqA4: 'บันทึกลิงก์จาก Shopee, SHEIN, TikTok Shop, Taobao และ Pinduoduo — รวมในรายการเดียว',
    finalTitle: 'กระเป๋าเงินคุณจะขอบคุณ', finalP: 'ร่วมกับนักช้อปที่ซื้อฉลาดขึ้นและเก็บเงินเพื่อสิ่งสำคัญ', finalCta: 'รับเพื่อนของคุณฟรี',
    footerTag: 'ช้อปฉลาดขึ้น ใช้จ่ายน้อยลง เก็บเงินเพื่อสิ่งสำคัญ', footerNote: 'Eslitec Hackathon · โจทย์ 1 · เดโมคอนเซ็ปต์',
    navGetApp: 'ดาวน์โหลดแอป',
    heroTypePrefix: 'เหมือนมีเพื่อนที่บอกว่า:',
    heroType: '"เดี๋ยว — วันศุกร์ถูกกว่านะ เก็บ $12 ก่อนดีกว่า 😉"',
    getAppEyebrow: 'ดาวน์โหลดแอป', getAppTitle: 'สแกน ติดตั้ง ช้อปฉลาดขึ้น',
    getAppLead: 'ส่องกล้องมือถือที่โค้ด แล้วเพื่อนของคุณจะติดตั้งในไม่กี่วินาที — ใช้งานออฟไลน์ได้หลังติดตั้ง',
    getAppScan: '📷 สแกนด้วยกล้องมือถือ',
    getAppIosT: 'iPhone / iPad (Safari)', getAppIos1: 'เปิดลิงก์ใน Safari', getAppIos2: 'แตะปุ่มแชร์', getAppIos3: 'แตะ เพิ่มไปยังหน้าจอหลัก', getAppIos4: 'แตะ เพิ่ม — เสร็จ! 🎉',
    getAppAndT: 'Android (Chrome)', getAppAnd1: 'เปิดลิงก์ใน Chrome', getAppAnd2: 'แตะเมนู (⋮)', getAppAnd3: 'แตะ ติดตั้งแอป', getAppAnd4: 'ยืนยัน — อยู่บนหน้าจอหลักแล้ว 🎉',
    getAppPcT: 'เดสก์ท็อป (Chrome / Edge)', getAppPc1: 'เปิด localhost:3003', getAppPc2: 'คลิกไอคอนติดตั้ง (⊕) ในแถบที่อยู่', getAppPc3: 'คลิก ติดตั้ง — เปิดในหน้าต่างของตัวเอง',
  },

  ko: {
    navHow: '사용 방법', navWho: '누구를 위한 건가요', navWhy: '왜 좋아하나요', navFaq: '자주 묻는 질문',
    navSignIn: '로그인', navStart: '무료로 시작',
    heroPill: '당신의 2am 쇼핑 버디 — 24시간 대기 중',
    heroLine1: '더 똑똑하게 쇼핑하세요.', heroLine2: '덜 쓰세요.', heroLine3: '소중한 것을 위해 모으세요.',
    heroP: '당신의 예산을 기억하고, 저축 목표를 따라가고, 정말 도움될 때만 알려주는 AI 버디. 스팸 없음, 과소비 없음, 스트레스 없음.',
    heroCtaMain: '쇼핑 버디 무료로 받기', heroCtaSub: '사용 방법 보기',
    heroTrust1: '⭐ 학생과 직장인을 위해', heroTrust2: '🔒 금융 데이터는 비공개', heroTrust3: '💸 무료로 시작',
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
    whoBusinessT: '비즈니스', whoBusinessP: '친근하고 때맞춘 넛지로 일회성 구매자를 단골로 — 고객의 예산을 존중하면서.', whoBusinessTag: '실제 고객 · 적절한 시점 · 재구매',
    whyEyebrow: '왜 좋아하나요', whyTitle: '광고판이 아닌, 버디.',
    why1T: '모든 걸 기억해요', why1P: '모든 상품, 가격, 급여일 — 당신 대신에.',
    why2T: '예산을 지켜요', why2P: '감당 못 할 걸 절대 밀어붙이지 않아요.',
    why3T: '스팸 제로', why3P: '방해 금지 시간과 빈도는 당신 마음대로. 도움될 때만 알려요.',
    why4T: '목표를 위해 저축', why4P: '목표 포켓이 "언젠가"를 "거의 다 됐어"로.',
    why5T: '모든 쇼핑몰, 한 곳에', why5P: 'Shopee, SHEIN, TikTok, Taobao, Pinduoduo — 깔끔한 목록 하나로.',
    why6T: '기본이 프라이버시', why6P: '예산과 저축은 당신 것. 쇼핑몰은 절대 못 봐요.',
    saveEyebrow: '생각 없이 저축', saveTitle: '"갖고 싶어"를 "가졌어"로.',
    saveLead: '마음에 드는데 예산 초과인가요? 버디가 목표 포켓을 만들어 조용히 도와주고 — 사기 전에 가격이 여전히 맞는지 확인해요.',
    saveLi1: '✅ 한 번의 탭으로 목표 설정', saveLi2: '✅ 진행 바가 차오르는 걸 보세요', saveLi3: '✅ 정말 준비됐을 때 구매',
    saveGoalName: '일본 여행', saveGoalSub: '$500 중 $320 저축', saveGoalFoot: '🎉 64% 달성 — 약 4주 남음',
    saveGoal2Name: '새 운동화', saveGoal2Sub: '$60 중 $48 저축', saveGoal2Foot: '거의 다 왔어요! 🔥',
    lovedTitle: '다들 푹 빠졌어요 💜',
    quote1: '"드디어 충동구매를 멈췄어요. 기다렸다 저축하라고 하더니 — 진짜 그렇게 했죠."', quote1By: '— Mia, 학생',
    quote2: '"커피 떨어지기 직전에 재주문해줘요. 제 마음을 읽는 것 같아요."', quote2By: '— Daniel, 직장인',
    quote3: '"단골이 더 자주 돌아와요 — 스팸 느낌도 없고요. 윈윈이죠."', quote3By: '— Brew & Bites, 카페',
    startEyebrow: '시작하기', startTitle: '30초 만에 버디를 만나요',
    startLead: '무료 계정을 만들면 바로 앱으로 안내해 드려요.',
    tabSignup: '계정 만들기', tabSignin: '로그인',
    roleStudent: '학생', roleWorking: '직장인', roleBusiness: '비즈니스',
    phUsername: '사용자 이름 선택', phEmail: '이메일 (선택)', phPassword: '비밀번호 (6자 이상)', phConfirm: '비밀번호 확인',
    phUsername2: '사용자 이름', phPassword2: '비밀번호',
    signupBtn: '내 계정 만들기 →', signinBtn: '로그인하고 앱 열기 →',
    demoHint: '데모 사용 — user: <strong>user</strong> · pass: <strong>password</strong>',
    authFoot: '무료로 시작 · 카드 불필요 · 1분 이내',
    faqTitle: '간단한 질문',
    faqQ1: '정말 무료인가요?', faqA1: '네 — 계정 생성과 쇼핑 버디 사용은 무료로 시작해요. 카드 불필요.',
    faqQ2: '제 은행 계좌를 볼 수 있나요?', faqA2: '아니요. 예산과 목표만 알려주면 돼요. 은행은 건드리지 않고, 쇼핑몰도 개인 숫자를 못 봐요.',
    faqQ3: '스팸을 보내나요?', faqA3: '절대 아니에요. 방해 금지 시간과 메시지 빈도를 직접 설정하고, 정말 유용할 때만 알려요.',
    faqQ4: '어떤 쇼핑몰과 연동되나요?', faqA4: 'Shopee, SHEIN, TikTok Shop, Taobao, Pinduoduo 링크를 한 목록에 저장해요.',
    finalTitle: '당신의 지갑이 고마워할 거예요.', finalP: '더 똑똑하게 사고 소중한 것을 위해 저축하는 쇼퍼들과 함께하세요.', finalCta: '버디 받기 — 무료예요',
    footerTag: '더 똑똑하게 쇼핑. 덜 쓰기. 소중한 것을 위해 저축.', footerNote: 'Eslitec 해커톤 · 문제 1 · 콘셉트 데모',
    navGetApp: '앱 받기',
    heroTypePrefix: '이렇게 말해주는 친구 같아요:',
    heroType: '"잠깐 — 금요일에 더 싸게 살 수 있어. $12 먼저 모으자 😉"',
    getAppEyebrow: '앱 받기', getAppTitle: '스캔. 설치. 더 똑똑하게 쇼핑.',
    getAppLead: '휴대폰 카메라로 코드를 비추면 몇 초 만에 버디가 설치돼요 — 설치 후엔 오프라인에서도 작동해요.',
    getAppScan: '📷 휴대폰 카메라로 스캔하세요',
    getAppIosT: 'iPhone / iPad (Safari)', getAppIos1: 'Safari에서 링크를 열어요.', getAppIos2: '공유 버튼을 누르세요.', getAppIos3: '"홈 화면에 추가"를 누르세요.', getAppIos4: '추가를 누르면 — 완료! 🎉',
    getAppAndT: 'Android (Chrome)', getAppAnd1: 'Chrome에서 링크를 열어요.', getAppAnd2: '메뉴 (⋮)를 누르세요.', getAppAnd3: '"앱 설치"를 누르세요.', getAppAnd4: '확인하면 — 홈 화면에 추가돼요. 🎉',
    getAppPcT: '데스크톱 (Chrome / Edge)', getAppPc1: 'localhost:3003을 열어요.', getAppPc2: '주소창의 설치 아이콘 (⊕)을 클릭하세요.', getAppPc3: '설치를 클릭하면 — 자체 창에서 열려요.',
  },
};

const LANG_KEY = '2am-shoppers-website-lang';

function applyLang(code) {
  const dict = T[code] || T.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] != null) el.innerHTML = dict[key];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (dict[key] != null) el.setAttribute('placeholder', dict[key]);
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
   AUTH  (shared localStorage with the app's auth store + URL handoff)
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

window.switchTab = function(tab) {
  const isSignup = tab === 'signup';
  document.getElementById('panel-signup')?.classList.toggle('hidden', !isSignup);
  document.getElementById('panel-signin')?.classList.toggle('hidden', isSignup);
  document.getElementById('tab-signup')?.classList.toggle('active', isSignup);
  document.getElementById('tab-signin')?.classList.toggle('active', !isSignup);
  clearError('signup-error'); clearError('signin-error');
};

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
