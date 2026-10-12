# The 2am Shoppers

**One app for thoughtful shopping, savings goals and personalised customer conversations.**

> Eslitec Hackathon · Problem Statement 1 · "One Less Thing"

---

## Repository layout

```
ai-ignition/
├── website/          Presentation site — open index.html in any browser
│   ├── index.html    7 sections: hero, problem, 3 modes, savings, connections, journeys, MVP
│   ├── styles.css    Tri-colour design system (violet=student, coral=working, amber=business)
│   └── script.js     Nav, fade-in, typewriter, auth panel (3-role, shares localStorage with app)
│
├── app/
│   ├── frontend/     React + Vite — three tailored interfaces
│   └── backend/      Node.js + Express + SQLite API
│
└── 2amdepoloyers.md  Full project brief and spec
```

---

## Three modes

| Mode | Who | Planning period | Colour |
|------|-----|----------------|--------|
| 🎓 Student | Students with weekly allowance | Weekly | Violet |
| 💼 Working Adult | Working adults with monthly income | Monthly | Coral |
| 🏪 Business | Merchants with existing customers | Campaign period | Amber |

**Switching modes never merges personal finances with merchant records.**  
Shopper budgets, goal balances and expense records are never visible on the business side.

---

## Quick start

### Presentation website
Open `website/index.html` directly in any browser. No build step needed.  
The auth section (Sign in / Create account) shares `localStorage` with the app — create an account on the website and sign in from the app at `localhost:3003`.

**Admin account:** username `user` · password `password`

---

### App — frontend

```powershell
cd app\frontend
npm install
npm run dev          # opens at http://localhost:3003
```

The frontend is fully functional using Zustand + localStorage.  
The backend is optional for the MVP demo.

---

### App — backend

```powershell
cd app\backend
Copy-Item .env.example .env   # fill in JWT_SECRET at minimum
npm install
npm run dev          # runs at http://localhost:3001
```

The frontend proxies `/api/*` to the backend via Vite's dev proxy.

---

## Frontend routes

| Path | Description |
|------|-------------|
| `/login` | Sign in |
| `/signup` | Create account (Student / Working Adult / Business) |
| `/` | Mode select — 3 cards |
| `/customer/onboarding` | Student or working adult setup (6 steps) |
| `/customer` | Home dashboard (branches by userType) |
| `/customer/feed` | Discovery feed |
| `/customer/savings` | Goal pockets + ledger |
| `/customer/wishlist` | Wishlist with goal linking |
| `/customer/chat` | AI shopping assistant |
| `/customer/connections` | Connections Hub (5 platforms) |
| `/customer/settings` | Profile and preferences |
| `/business/onboarding` | Merchant setup (5 steps) |
| `/business` | Overview dashboard |
| `/business/customers` | Customer segments |
| `/business/journeys` | Trigger-based journeys |
| `/business/catalogue` | Product catalogue |
| `/business/support` | Support handovers |

---

## Student interface

**Navigation:** Home · Discover · Save · Wishlist · Assistant · Connections · Settings

**Weekly budget formula:**
```
Remaining discretionary = allowance
                        − essential reserves (food, transport, school)
                        − savings allocation
                        − recorded discretionary spending this week
```

**Savings:** Goal pockets with progress bars, contribution/planned/withdrawal ledger, icon picker, wishlist linking. Recording a contribution does not transfer funds.

**Gamification:** Optional badges, missions and progress milestones. Rewards saving and reflection — not purchases. Can be turned off in Settings. Skipping a day does not erase progress.

---

## Working Adult interface

**Navigation:** Overview · Spending · Savings · Shopping · Assistant · Connections · Settings

**Monthly budget formula:**
```
Remaining discretionary = recorded income
                        − essential reserves (bills, subscriptions, transport)
                        − savings allocations
                        − buffer
                        − recorded discretionary spending this month
```

**Savings:** Multiple goals, planned contributions, projected completion, editable allocation rules.

---

## Business interface

**Navigation:** Overview · Products · Customers · Journeys · Catalogue · Support

**Privacy rule:** The business view never shows shopper budgets, allowances or goal details. The app applies spending limits on the shopper side; businesses see only authorised customer context and permitted preferences.

**Wording variants:** Journeys can use student ("Coffee check ☕ Need a refill?") or working adult ("Would you like to reorder your usual coffee?") wording based on the customer's authorised mode, not financial inference.

---

## Connections Hub

Five platforms, four integration routes:

| Route | Status label | When to use |
|-------|-------------|-------------|
| Share / paste a link | ⚪ Link-only | Immediately for all 5 platforms |
| Import a purchase record | 🔵 Imported records | Upload receipt, screenshot or order export |
| Authorised merchant API | 🟢 Live connection | After platform approval (validate first) |
| External purchase handoff | 🟢 Live connection | Via authorised callback or user confirmation |

**Rule:** Never show "Connected" if only a product link was saved. Price and stock claims must come from verified catalogue data.

**Platform validation required before live release:**
- Shopee: Open Platform — regions, eligibility, catalogue/order permissions
- SHEIN: Developer Platform — seller eligibility, supported scopes
- TikTok Shop: Partner Center — app approval, shop scope, region
- Taobao / Pinduoduo: Open Platforms — eligibility and permissions unverified at time of writing

---

## Backend API

| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PATCH/DELETE | `/api/wishlist` | Wishlist items |
| GET/POST | `/api/conversations` | Conversation threads |
| POST | `/api/conversations/:id/reply` | AI reply (rule-based or OpenAI) |
| GET/POST/DELETE | `/api/reminders` | Reminders |
| GET/POST/PATCH/DELETE | `/api/savings/goals` | Savings goal pockets |
| GET/POST/DELETE | `/api/savings/ledger` | Ledger entries (contributions / planned / withdrawals) |
| GET/POST/DELETE | `/api/expenses` | Expense records |
| GET | `/api/expenses/summary` | Deterministic budget summary |
| GET/PATCH | `/api/connections` | Platform connection status |
| GET/POST/DELETE | `/api/connections/links` | Saved product links |
| POST | `/api/connections/:platform/import` | Simulated import (returns sample records for confirmation) |
| GET/POST/PATCH/DELETE | `/api/catalogue` | Merchant catalogue |
| GET/POST/PATCH | `/api/customers` | Merchant customer records |
| GET/POST | `/api/journeys` | Customer journeys |
| POST | `/api/journeys/:id/event` | Record customer response |
| GET | `/api/dashboard/summary` | Business KPI summary |
| GET | `/api/dashboard/segments` | Segment breakdown |
| GET | `/api/health` | Health check |

---

## AI conversation

**Default (no key):** Rule-based response map — too expensive → alternatives, remind me later → schedule, wrong style → update preferences, etc.

**With OpenAI:** Set `OPENAI_API_KEY` in `.env`. The service calls `gpt-4o-mini` with rules from the spec grounding the prompt.

**With AWS Bedrock:** Replace `getLLMReply()` in `app/backend/src/services/conversationService.js` with a `BedrockRuntimeClient` call.

---

## Hackathon demo script

1. Open `http://localhost:3003` → sign in as `user` / `password`
2. Choose **Student** → complete onboarding (set $80 allowance, $45 essentials, $15 savings, goal: "New shoes $60")
3. On Home, interact with the AI notification card
4. Go to **Save** → record a $10 contribution toward the shoes goal
5. Switch to **Working Adult** via mode select → onboard as Alicia ($2,400 income, $1,500 essentials, $400 savings, $200 buffer)
6. Go to **Connections** → save a Shopee product link
7. Switch to **Business** → load demo customers (Alicia, Ben, Chloe)
8. Go to **Journeys** → start a replenishment journey for Alicia's coffee
9. Record outcome as **Purchased**
10. Check **Overview** — conv-to-purchase rate updates

All simulated purchases, feeds and integrations are clearly labelled.

---

## Measurements (fill in after timed demo)

| Metric | Result |
|--------|--------|
| Students able to see weekly discretionary budget | — |
| Working adults able to complete monthly plan | — |
| Business journey from trigger to confirmed purchase | — |
| Time: manual coordination vs with app | — |

> Hackathon sample data demonstrates the reporting process. It does not prove real retention improvements or customer lifetime value increases.

---

## Savings workspace — key rules

- **Planning ledger only.** Money stays in the user's existing accounts.
- Recording "$10 saved" does not transfer funds, create a deposit or earn interest.
- Label all figures as a recorded plan with last-update time and missing inputs shown.
- Planned contributions remain separate from completed entries.
- Forecast progress is a projection, not a guaranteed outcome.
- Unused budget is not automatically "money saved" — the user confirms where it was allocated.
- Shopping credit, loyalty points and vouchers are not cash savings.

---

## Development tools

| Tool | Role |
|------|------|
| **Kiro** | Plan and implement application, workflows and integrations |
| **IBM Bob** | Analyse, debug, review and improve the implementation |
| **Runtime AI** | Interprets customer intent and generates grounded conversations |
| **Workflow logic** | Controls triggers, reminders, exits, permissions and approved actions |

---

## Later enhancements

- Additional live marketplace integrations (validate regions and permissions first)
- Real short-video content and supported ad publishing
- Group-buy checkout
- Multilingual conversations
- Light/dark mode
- Broader analytics and product comparisons
- Validated partner-backed money tracking or transfer features (separate future scope with explicit permissions)
