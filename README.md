# The 2am Shoppers

**A budget-first shopping companion: shop smarter, spend less, save for what matters.**

> **Team 2AM Deployers** · AI Ignition · Problem Statement 1 (Eslitec): personalised, automated e-commerce conversations that support retention

Young shoppers browse across many platforms, often late at night, forget what they saved and overspend, because shopping apps are built to sell rather than protect budgets. The 2am Shoppers always knows what you can safely spend, turns impulse moments into wishlist items and "sleep on it" reminders, and gives you **Hoot**, an AI assistant that offers honest, budget-aware advice in a voice that suits you.

---

## What's in this repository

```
ai-ignition/
├── website/            Landing site / pitch deck (static HTML, no build step)
│   ├── index.html      Hero, features, savings, how it works, who it's for,
│   │                   what we tested, next steps, get the app, FAQ
│   ├── login.html      Log in page   ─┐  hand the account over to the app
│   ├── signup.html     Sign-up page  ─┘  at localhost:3003
│   ├── styles.css      Design system (violet = student, coral = working adult)
│   └── script.js       Nav, animations, 5-language translations, auth handoff
│
├── app/
│   ├── frontend/       React + Vite app (installable PWA; Android via Capacitor)
│   └── backend/        Node.js + Express API, incl. Hoot's AI route (Claude)
│
├── 2amdepoloyers.md    Original project brief and spec
└── LAUNCH_GUIDE.md     Launch and partnership notes
```

---

## Quick start

You need **Node.js 18+** (developed on Node 24).

### 1. Run the app (required)

```powershell
cd app\frontend
npm install
npm run dev          # http://localhost:3003
```

The app works fully on its own: accounts, budgets, goals, wishlist and the video feed are stored in the browser (localStorage). Without the backend, Hoot answers in **offline mode** (budget, goals, wishlist and product picks from data on the device).

### 2. Run the backend (optional — for Hoot's live AI replies)

```powershell
cd app\backend
Copy-Item .env.example .env
# edit .env: set JWT_SECRET, and ANTHROPIC_API_KEY for Hoot's AI replies
npm install
npm start            # http://localhost:3001
```

The frontend's dev server forwards `/api/*` to the backend. Get an API key at <https://console.anthropic.com>. Never commit your `.env` file.

### 3. Open the website (optional)

Open `website/index.html` in a browser, or serve it:

```powershell
python -m http.server 8080 --directory website   # http://localhost:8080
```

Signing up or logging in on the website opens the app at `localhost:3003` with the same account, so keep the app running.

### Demo accounts

| Username | Password | What you get |
|---|---|---|
| `emily` | `emilypassword` | Student persona: beauty, fashion and travel; Hoot in **Bestie** voice |
| `john` | `johnpassword` | Working-adult persona: fitness and grooming; Hoot in **Coach** voice |
| `student` | `student` | Ready-made student account |
| `working` | `working` | Ready-made working-adult account |
| `business` | `business` | Merchant dashboard (demo data) |
| `user` | `password` | Admin: can switch between all modes |

These are demo credentials only. New sign-ups choose Student or Working Adult and are offered a short guided tour.

---

## Features

| Feature | Status |
|---|---|
| Student (weekly) and Working Adult (monthly) modes with tailored wording, colours and budgets | ✅ Working |
| Onboarding, budget calculation, savings goals, wishlist, reminders, expenses | ✅ Working |
| **Discover**: vertical video feed per persona (20 clips), shop link on each, sound on/off, save to wishlist | ✅ Working |
| Budget nudge while scrolling ("That's $40 but you have $20 left…") | ✅ Working |
| Late-night saves (10pm–5am) set a "still want it?" reminder for the morning | ✅ Working |
| **"Did you get it?"** check after visiting a shop link: Bought logs the spend, Still thinking adds to wishlist | ✅ Working |
| **Hoot** AI assistant: per-persona voice, budget/goal/wishlist answers, product recommendation cards | ✅ Offline mode tested · live AI needs `ANTHROPIC_API_KEY` |
| Phone and desktop notifications (due reminders, low budget), respecting quiet hours | ✅ Working while the app is open or in the background |
| Guided tour for new sign-ups, privacy page, 5 languages (EN/JA/ZH/TH/KO), dark/light theme, installable PWA | ✅ Working |
| Business dashboard (customers, journeys, catalogue, support) | 🟡 Demo data |
| Marketplace connections (Shopee, SHEIN, TikTok Shop, Taobao, Pinduoduo) | 🟡 Link-only; live APIs need platform approval |
| Purchase confirmation | 🟡 Self-reported by the user (no shop checkout data) |

---

## How the main pieces work

**Budgets** (`app/frontend/src/store/appStore.js`)

```
Student, weekly:   allowance − essentials − savings − spending in the last 7 days
Working, monthly:  income − essentials − savings − buffer − spending this month
```

**Discover videos** (`app/frontend/src/data/feedVideos.js`, files in `app/frontend/public/videos/<emily|john|shared>/`)
Each clip is matched to its product. `linkType` says how exact the link is: `product` (exact product page), `brand` (brand's shop) or `search` (a Shopee Singapore search for generic items; prices shown as "~$ typical price"). To add a video: put the MP4 (portrait 9:16, ideally under 5 MB) in the persona's folder and add an entry to that persona's list.

**Hoot** (`app/frontend/src/components/assistant/`, `app/backend/src/routes/assistant.js`)
The chat sends `POST /api/assistant/chat` with the conversation, the voice to use and a short summary (first name, interests, budget left, goals, wishlist) plus a catalogue of products it may recommend. The backend calls Claude (`claude-opus-5-5`) and asks for a structured reply (text + product ids); only products really in the catalogue are returned, so Hoot can't invent products or links. If the server or key isn't available, `localReplies.js` answers on the device in the same voice.

**Notifications** (`app/frontend/src/lib/notifications.js`, `src/hooks/useNotificationScheduler.js`, `public/sw.js`)
Turn them on in **Settings → Notifications**. Uses the Web Notifications API through the service worker. Works on desktop browsers and Android Chrome; on iPhone only after "Add to Home Screen". Alerts with the app fully closed would need a push server (not set up).

**Purchase check** (`app/frontend/src/components/PurchaseCheck.jsx`)
Opening a shop link from Discover, Hoot or the wishlist records a pending check (saved on the device). When the user comes back or reopens the app, it asks Bought / Still thinking / Didn't buy.

---

## Android app

```powershell
cd app\frontend
npm run build
npx cap copy android
npx cap open android      # then Run ▶ in Android Studio
```

Repeat `npm run build` and `npx cap copy android` after every change. Browser notifications don't show inside the Android app; that needs the Capacitor Local Notifications plugin.

---

## Backend API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/assistant/chat` | Hoot's reply from Claude (503 `not_configured` without an API key) |
| GET/POST/PATCH/DELETE | `/api/wishlist` | Wishlist items |
| GET/POST | `/api/conversations` | Merchant conversation threads |
| POST | `/api/conversations/:id/reply` | Merchant-side intent reply (rule-based, optional OpenAI) |
| GET/POST/DELETE | `/api/reminders` | Reminders |
| GET/POST/PATCH/DELETE | `/api/savings/goals` | Savings goals |
| GET/POST/DELETE | `/api/savings/ledger` | Savings ledger entries |
| GET/POST/DELETE | `/api/expenses` | Expense records |
| GET | `/api/expenses/summary` | Budget summary |
| GET/PATCH | `/api/connections` | Platform connection status |
| GET/POST/DELETE | `/api/connections/links` | Saved product links |
| POST | `/api/connections/:platform/import` | Simulated import |
| GET/POST/PATCH/DELETE | `/api/catalogue` | Merchant catalogue |
| GET/POST/PATCH | `/api/customers` | Merchant customer records |
| GET/POST | `/api/journeys` | Customer journeys |
| POST | `/api/journeys/:id/event` | Record a customer response |
| GET | `/api/dashboard/summary` | Business KPI summary |
| GET | `/api/health` | Health check |

---

## Demo script (about 5 minutes)

1. Start the app (and the backend if you have an API key). Open `http://localhost:3003`.
2. Log in as **emily / emilypassword**. Home shows what she can spend this week.
3. Open **Discover**: scroll her videos, tap **🔇 Sound off** to turn sound on, tap **Find ↗** on a product.
4. Come back to the app: answer **Did you get it?** with *Still thinking*, and see it on the **Wishlist**.
5. Tap **Hoot** 🦉 (bottom-right) → *Recommend something cute ✨*. Hoot answers in Bestie voice with product cards.
6. Log out and log in as **john / johnpassword**: different feed, monthly budget, Hoot in Coach voice.
7. **Settings → Notifications → Turn on notifications → Send a test.**

---

## Troubleshooting

- **Old screens or missing videos after an update:** the service worker may hold an old copy. Reload once or twice; if it persists, open DevTools → Application → Service workers → *Unregister*, then reload.
- **Hoot says "Offline mode":** the backend isn't running or `ANTHROPIC_API_KEY` isn't set. Fix it, then reload the page.
- **Notifications blocked:** allow notifications for the site in the browser's settings, then turn them on again in Settings.

---

## Privacy and data

- Budgets, goals, wishlist and expenses are saved in the browser on the user's device.
- Hoot receives a short summary with each message (first name, interests, budget left, goals, wishlist); full spending history is never sent.
- Business mode never shows shopper budgets, goals or spending.
- Marketplace connections are link-only; the app never asks for shop passwords.

---

## Notes and limitations

- **Demo videos:** the Discover clips are third-party TikTok videos used for a hackathon demo. Get the creators' permission before any public use, or replace them with brand-provided videos.
- Accounts are stored per browser (no account server yet), and demo passwords are stored in plain text.
- Product prices marked "~$" are typical prices, not live prices.

## Next steps

- Host the app and backend (HTTPS), with real accounts that sync across devices.
- Shop affiliate tracking (Shopee, TikTok Shop) to confirm purchases automatically.
- A push server so notifications arrive with the app closed.
- Brand-uploaded videos and a "For You" feed that learns from what users watch, save and skip.
- Pilot with students and working adults to measure impulse buys avoided and goals reached.
