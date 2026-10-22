import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Global store — The 2am Shoppers (v3)
 *
 * Three modes:
 *   'student'  — weekly budget, goal pockets, gamification
 *   'working'  — monthly plan, multiple savings goals, practical shopping
 *   'business' — merchant CRM, journeys, catalogue, analytics
 *
 * Shopper financial data is NEVER shared with merchant records.
 */
const useAppStore = create(
  persist(
    (set, get) => ({

      // ── App mode ─────────────────────────────────────────────
      // 'student' | 'working' | 'business' | null
      appMode: null,
      setAppMode: (mode) => set({ appMode: mode }),

      // ── Language + theme (UI preferences) ────────────────────
      // language: 'en' | 'ja' | 'zh' | 'th'  (matches Eslitec's markets)
      language: null,
      setLanguage: (language) => set({ language }),

      // theme: 'dark' | 'light'
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      // suggestionsEnabled — whether the 2AM Assistant shows proactive
      // budget-aware nudges while browsing (the floating pop-ups). On by
      // default; users can turn it off in Settings. Preserved across reset.
      suggestionsEnabled: true,
      setSuggestionsEnabled: (v) => set({ suggestionsEnabled: !!v }),

      // notificationsEnabled — phone/desktop notifications (reminders, budget
      // alerts). Off until the user turns them on and the browser allows it.
      // lastBudgetAlert remembers which week/month already got a low-budget alert.
      notificationsEnabled: false,
      setNotificationsEnabled: (v) => set({ notificationsEnabled: !!v }),
      lastBudgetAlert: null,
      setLastBudgetAlert: (key) => set({ lastBudgetAlert: key }),

      // ── Per-account profiles ─────────────────────────────────
      // Profiles are keyed by the logged-in account id so that two
      // accounts in the same browser never clobber each other, and
      // signing out does NOT wipe a user's saved onboarding.
      // { [accountId]: { shopper?: {...}, merchant?: {...} } }
      profilesByAccount: {},
      activeAccountId: null,

      // The active profiles mirror the entry for activeAccountId. Pages
      // read these directly. setActiveAccount() swaps them in on login.
      shopperProfile: null,
      merchantProfile: null,

      /**
       * Point the store at a given account. Loads that account's saved
       * shopper/merchant profiles into the active slots. Call on login.
       */
      setActiveAccount: (accountId) =>
        set((s) => {
          const entry = s.profilesByAccount[accountId] ?? {};
          return {
            activeAccountId: accountId,
            shopperProfile:  entry.shopper  ?? null,
            merchantProfile: entry.merchant ?? null,
          };
        }),

      setShopperProfile: (p) =>
        set((s) => {
          const id = s.activeAccountId;
          if (!id) return { shopperProfile: p };
          const entry = { ...(s.profilesByAccount[id] ?? {}), shopper: p };
          return {
            shopperProfile: p,
            profilesByAccount: { ...s.profilesByAccount, [id]: entry },
          };
        }),

      /**
       * Seed pre-filled profiles + savings goals for the demo/persona
       * accounts so they skip onboarding. Idempotent: only fills a slot if
       * that account has no profile yet, so it never overwrites real edits.
       *
       * @param {Array} bundles  from demoAccounts.DEMO_ACCOUNTS
       */
      seedDemoProfiles: (bundles) =>
        set((s) => {
          const profiles = { ...s.profilesByAccount };
          let goals = s.savingsGoals ? [...s.savingsGoals] : [];
          let touched = false;

          for (const b of bundles) {
            const id = b?.account?.id;
            if (!id || !b.profile) continue;
            if (profiles[id]) continue; // already has a profile — leave it

            const entry = {};
            if (b.profile.kind === 'merchant') entry.merchant = b.profile.data;
            else                                entry.shopper  = b.profile.data;
            profiles[id] = entry;
            touched = true;

            // Attach this account's demo savings goals (tagged by account).
            if (Array.isArray(b.goals) && b.goals.length) {
              const hasGoals = goals.some(g => g.accountId === id);
              if (!hasGoals) {
                b.goals.forEach(g => {
                  goals.push({
                    id: crypto.randomUUID(),
                    accountId: id,
                    createdAt: new Date().toISOString(),
                    status: 'active',
                    currentAmount: 0,
                    ...g,
                  });
                });
              }
            }
          }

          return touched ? { profilesByAccount: profiles, savingsGoals: goals } : {};
        }),

      // backward-compat setter only. NOTE: no `customerProfile` getter here —
      // Zustand's Object.assign snapshot freezes getters to their first value
      // (null), the stale-profile bug. Pages read `shopperProfile` directly.
      setCustomerProfile: (p) => get().setShopperProfile(p),

      // ── Coach-mark tour ──────────────────────────────────────
      // New sign-ups carry `offerTour` on their account; once they accept
      // or decline the offer it is recorded here by account id so it is
      // never asked again. tourActive is session-only (not persisted).
      tourOffersHandled: {},
      handleTourOffer: () =>
        set((s) => ({
          tourOffersHandled: { ...s.tourOffersHandled, [s.activeAccountId ?? 'local']: true },
        })),
      tourActive: false,
      startTour: () => set({ tourActive: true }),
      endTour: () => set({ tourActive: false }),

      // ── Feedback signals (explicit + implicit) ───────────────
      // Persisted so taps actually change future recommendations.
      // shape: { priceThreshold, dislikedCategories[], likedCategories[],
      //          skippedFeedIds[], lastResponse, updatedAt }
      feedback: {
        priceThreshold: null,
        dislikedCategories: [],
        likedCategories: [],
        skippedFeedIds: [],
        lastResponse: null,
      },

      /**
       * Explicit feedback loop (Phase 2). A quick-reply tap or typed
       * response updates stored preferences:
       *  - 'too_expensive' lowers the price threshold by 20%
       *  - 'wrong_style' / 'not_interested' record a disliked category
       *  - 'interested' records a liked category
       */
      applyFeedback: (intent, { category, currentPrice } = {}) =>
        set((s) => {
          const fb = { ...s.feedback, lastResponse: intent, updatedAt: new Date().toISOString() };
          if (intent === 'too_expensive' || intent === 'price_objection') {
            const base = Number(currentPrice) || s.feedback.priceThreshold || s.shopperProfile?.budget || 0;
            if (base > 0) fb.priceThreshold = Math.round(base * 0.8 * 100) / 100; // −20%
          }
          if ((intent === 'wrong_style' || intent === 'not_interested') && category) {
            fb.dislikedCategories = [...new Set([...s.feedback.dislikedCategories, category])];
            fb.likedCategories    = s.feedback.likedCategories.filter(c => c !== category);
          }
          if (intent === 'interested' && category) {
            fb.likedCategories    = [...new Set([...s.feedback.likedCategories, category])];
            fb.dislikedCategories = s.feedback.dislikedCategories.filter(c => c !== category);
          }
          return { feedback: fb };
        }),

      /** Implicit feedback loop — record a skipped feed item. */
      recordSkip: (feedId) =>
        set((s) => ({
          feedback: {
            ...s.feedback,
            skippedFeedIds: [...new Set([...s.feedback.skippedFeedIds, feedId])],
          },
        })),

      // ── Wishlist ─────────────────────────────────────────────
      wishlist: [],
      addToWishlist: (item) =>
        set((s) => ({ wishlist: [...s.wishlist, { id: crypto.randomUUID(), savedAt: new Date().toISOString(), ...item }] })),
      updateWishlistItem: (id, u) =>
        set((s) => ({ wishlist: s.wishlist.map((i) => i.id === id ? { ...i, ...u } : i) })),
      removeFromWishlist: (id) =>
        set((s) => ({ wishlist: s.wishlist.filter((i) => i.id !== id) })),

      // ── Savings goals (pockets) ──────────────────────────────
      savingsGoals: [],
      // [{ id, name, icon, targetAmount, currentAmount,
      //    contributionAmount, contributionFrequency,
      //    linkedWishlistId, status:'active'|'paused'|'complete',
      //    createdAt }]
      addSavingsGoal: (goal) =>
        set((s) => ({
          savingsGoals: [...s.savingsGoals, {
            id: crypto.randomUUID(),
            accountId: s.activeAccountId ?? null, // tag to the logged-in account
            createdAt: new Date().toISOString(),
            currentAmount: 0,
            status: 'active',
            ...goal,
          }],
        })),
      updateSavingsGoal: (id, u) =>
        set((s) => ({ savingsGoals: s.savingsGoals.map((g) => g.id === id ? { ...g, ...u } : g) })),
      deleteSavingsGoal: (id) =>
        set((s) => ({ savingsGoals: s.savingsGoals.filter((g) => g.id !== id) })),

      /**
       * Goals visible to the active account. A goal with no accountId
       * (legacy / created before scoping) shows for everyone; a tagged
       * goal shows only for its owner. Keeps persona goals separate.
       */
      getActiveGoals: () => {
        const s = get();
        const id = s.activeAccountId;
        return s.savingsGoals.filter(g => !g.accountId || g.accountId === id);
      },

      // ── Savings ledger entries ───────────────────────────────
      savingsLedger: [],
      // [{ id, goalId, type:'contribution'|'withdrawal'|'planned',
      //    amount, note, date, createdAt }]
      addLedgerEntry: (entry) =>
        set((s) => ({
          savingsLedger: [...s.savingsLedger, {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            date: new Date().toISOString().slice(0, 10),
            ...entry,
          }],
        })),
      removeLedgerEntry: (id) =>
        set((s) => ({ savingsLedger: s.savingsLedger.filter((e) => e.id !== id) })),

      // ── Expense records ──────────────────────────────────────
      expenses: [],
      // [{ id, category, amount, description, date, source, createdAt }]
      addExpense: (exp) =>
        set((s) => ({
          expenses: [...s.expenses, {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            date: new Date().toISOString().slice(0, 10),
            ...exp,
          }],
        })),
      removeExpense: (id) =>
        set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      // ── Connections hub ──────────────────────────────────────
      connections: {
        shopee:    { status: 'demo',      label: 'Shopee',         route: 'link-only'  },
        shein:     { status: 'demo',      label: 'SHEIN',          route: 'link-only'  },
        tiktok:    { status: 'demo',      label: 'TikTok Shop',    route: 'link-only'  },
        taobao:    { status: 'demo',      label: 'Taobao',         route: 'link-only'  },
        pinduoduo: { status: 'demo',      label: 'Pinduoduo',      route: 'link-only'  },
      },
      // status: 'live' | 'imported' | 'link-only' | 'needs-attention' | 'demo'
      updateConnection: (key, updates) =>
        set((s) => ({ connections: { ...s.connections, [key]: { ...s.connections[key], ...updates } } })),

      savedLinks: [],
      // [{ id, platform, url, title, price, currency, savedAt, verified }]
      addSavedLink: (link) =>
        set((s) => ({
          savedLinks: [...s.savedLinks, {
            id: crypto.randomUUID(),
            savedAt: new Date().toISOString(),
            verified: false,
            ...link,
          }],
        })),
      removeSavedLink: (id) =>
        set((s) => ({ savedLinks: s.savedLinks.filter((l) => l.id !== id) })),

      // ── Conversations ────────────────────────────────────────
      conversations: [],
      addConversation: (conv) =>
        set((s) => ({
          conversations: [...s.conversations, {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            status: 'active',
            messages: [],
            ...conv,
          }],
        })),
      addMessage: (convId, message) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, { id: crypto.randomUUID(), ts: new Date().toISOString(), ...message }] }
              : c
          ),
        })),
      closeConversation: (convId, reason) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId ? { ...c, status: 'closed', closedReason: reason } : c
          ),
        })),

      // ── Reminders ────────────────────────────────────────────
      reminders: [],
      addReminder: (r) =>
        set((s) => ({ reminders: [...s.reminders, { id: crypto.randomUUID(), createdAt: new Date().toISOString(), fired: false, ...r }] })),
      dismissReminder: (id) =>
        set((s) => ({ reminders: s.reminders.map((r) => r.id === id ? { ...r, fired: true } : r) })),
      // A notification was shown for this reminder (it still shows in the app until dismissed).
      markReminderNotified: (id) =>
        set((s) => ({ reminders: s.reminders.map((r) => r.id === id ? { ...r, notified: true } : r) })),

      // ── Purchase history ─────────────────────────────────────
      purchaseHistory: [],
      recordPurchase: (p) =>
        set((s) => ({ purchaseHistory: [...s.purchaseHistory, { id: crypto.randomUUID(), confirmedAt: new Date().toISOString(), ...p }] })),

      // ── Business / Merchant ──────────────────────────────────
      // merchantProfile is declared in the per-account section above.
      setMerchantProfile: (p) =>
        set((s) => {
          const id = s.activeAccountId;
          if (!id) return { merchantProfile: p };
          const entry = { ...(s.profilesByAccount[id] ?? {}), merchant: p };
          return {
            merchantProfile: p,
            profilesByAccount: { ...s.profilesByAccount, [id]: entry },
          };
        }),

      catalogue: [],
      addProduct: (p) =>
        set((s) => ({ catalogue: [...s.catalogue, { id: crypto.randomUUID(), createdAt: new Date().toISOString(), inStock: true, ...p }] })),
      updateProduct: (id, u) =>
        set((s) => ({ catalogue: s.catalogue.map((p) => p.id === id ? { ...p, ...u } : p) })),

      customers: [],
      addCustomer: (c) =>
        set((s) => ({ customers: [...s.customers, { id: crypto.randomUUID(), createdAt: new Date().toISOString(), segment: 'first_time', ...c }] })),
      updateCustomer: (id, u) =>
        set((s) => ({ customers: s.customers.map((c) => c.id === id ? { ...c, ...u } : c) })),

      journeys: [],
      addJourney: (j) =>
        set((s) => ({ journeys: [...s.journeys, { id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'active', events: [], ...j }] })),
      addJourneyEvent: (journeyId, event) =>
        set((s) => ({
          journeys: s.journeys.map((j) =>
            j.id === journeyId
              ? { ...j, events: [...j.events, { id: crypto.randomUUID(), ts: new Date().toISOString(), ...event }] }
              : j
          ),
        })),
      closeJourney: (journeyId, outcome) =>
        set((s) => ({
          journeys: s.journeys.map((j) =>
            j.id === journeyId ? { ...j, status: 'closed', outcome, closedAt: new Date().toISOString() } : j
          ),
        })),

      supportHandovers: [],
      addHandover: (h) =>
        set((s) => ({ supportHandovers: [...s.supportHandovers, { id: crypto.randomUUID(), createdAt: new Date().toISOString(), resolved: false, ...h }] })),
      resolveHandover: (id) =>
        set((s) => ({ supportHandovers: s.supportHandovers.map((h) => h.id === id ? { ...h, resolved: true, resolvedAt: new Date().toISOString() } : h) })),

      // ── Computed helpers ─────────────────────────────────────
      /**
       * Budget formula (student weekly):
       * discretionary = allowance − essentialReserve − savingsAllocation
       *               − recordedSpendingThisPeriod
       */
      getStudentBudget: () => {
        const p = get().shopperProfile;
        if (!p || p.userType !== 'student') return null;
        const allowance  = Number(p.allowance)              || 0;
        const essentials = Number(p.essentialReserveStudent) || 0;
        const savings    = Number(p.savingsAllocation)       || 0;
        const today      = new Date();
        const weekAgo    = new Date(today.getTime() - 7 * 86400000);
        const spent      = get().expenses
          .filter((e) => e.category !== 'essential' && new Date(e.date) >= weekAgo)
          .reduce((sum, e) => sum + Number(e.amount), 0);
        return {
          allowance, essentials, savings, spent,
          discretionary: Math.max(0, allowance - essentials - savings - spent),
        };
      },

      /**
       * Budget formula (working adult monthly):
       * discretionary = income − essentialReserve − savingsAllocation − buffer
       *               − recordedSpendingThisMonth
       */
      getWorkingBudget: () => {
        const p = get().shopperProfile;
        if (!p || p.userType !== 'working') return null;
        const income     = Number(p.income)          || 0;
        const essentials = Number(p.essentialReserve) || 0;
        const savings    = Number(p.savingsAllocation) || 0;
        const buffer     = Number(p.buffer)            || 0;
        const now        = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const spent      = get().expenses
          .filter((e) => e.category !== 'essential' && e.date >= monthStart)
          .reduce((sum, e) => sum + Number(e.amount), 0);
        return {
          income, essentials, savings, buffer, spent,
          discretionary: Math.max(0, income - essentials - savings - buffer - spent),
        };
      },

      // ── Switch mode (safe) ───────────────────────────────────
      // Clears the ACTIVE view so the user returns to mode-select, but
      // PRESERVES each account's saved onboarding (profilesByAccount) and
      // display preferences. This is what the sidebar "switch view" button
      // calls, so switching or signing out never wipes a user's quiz.
      switchMode: () => set({
        appMode: null,
        shopperProfile: null,
        merchantProfile: null,
      }),

      // ── Reset (full wipe) ─────────────────────────────────────
      // Explicit "Reset all data" — clears the CURRENT account's saved
      // profile plus all working data. Language and theme are preserved.
      reset: () => set((s) => {
        const next = { ...s.profilesByAccount };
        if (s.activeAccountId) delete next[s.activeAccountId];
        return {
          appMode: null,
          profilesByAccount: next,
          tourActive: false,
          shopperProfile: null,
          merchantProfile: null,
          feedback: { priceThreshold: null, dislikedCategories: [], likedCategories: [], skippedFeedIds: [], lastResponse: null },
          wishlist: [], savingsGoals: [], savingsLedger: [], expenses: [],
          savedLinks: [], conversations: [], reminders: [], purchaseHistory: [],
          connections: {
            shopee:    { status: 'demo', label: 'Shopee',      route: 'link-only' },
            shein:     { status: 'demo', label: 'SHEIN',       route: 'link-only' },
            tiktok:    { status: 'demo', label: 'TikTok Shop', route: 'link-only' },
            taobao:    { status: 'demo', label: 'Taobao',      route: 'link-only' },
            pinduoduo: { status: 'demo', label: 'Pinduoduo',   route: 'link-only' },
          },
          catalogue: [], customers: [], journeys: [], supportHandovers: [],
        };
      }),
    }),
    {
      name: '2am-shoppers-store',
      // eslint-disable-next-line no-unused-vars
      partialize: ({ tourActive, ...rest }) => rest,
    }
  )
);

export default useAppStore;
