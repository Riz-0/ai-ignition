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

      // ── Shopper profile (student + working adult) ─────────────
      shopperProfile: null,
      // {
      //   name, userType: 'student'|'working',
      //   interests[], budget, quietStart, quietEnd,
      //   paydayDate, notifFreq,
      //   // working adult extras:
      //   income, planningPeriod: 'monthly'|'custom',
      //   essentialReserve, savingsAllocation, buffer,
      //   // student extras:
      //   allowance, allowancePeriod: 'weekly'|'monthly',
      //   essentialReserveStudent,
      //   gamificationEnabled: true
      // }
      setShopperProfile: (p) => set({ shopperProfile: p }),

      // backward compat alias
      get customerProfile() { return get().shopperProfile; },
      setCustomerProfile: (p) => set({ shopperProfile: p }),

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

      // ── Purchase history ─────────────────────────────────────
      purchaseHistory: [],
      recordPurchase: (p) =>
        set((s) => ({ purchaseHistory: [...s.purchaseHistory, { id: crypto.randomUUID(), confirmedAt: new Date().toISOString(), ...p }] })),

      // ── Business / Merchant ──────────────────────────────────
      merchantProfile: null,
      setMerchantProfile: (p) => set({ merchantProfile: p }),

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

      // ── Reset ────────────────────────────────────────────────
      reset: () => set({
        appMode: null,
        // NOTE: language and theme are intentionally preserved across reset —
        // a user switching modes shouldn't lose their display preferences.
        shopperProfile: null,
        wishlist: [], savingsGoals: [], savingsLedger: [], expenses: [],
        savedLinks: [], conversations: [], reminders: [], purchaseHistory: [],
        connections: {
          shopee:    { status: 'demo', label: 'Shopee',      route: 'link-only' },
          shein:     { status: 'demo', label: 'SHEIN',       route: 'link-only' },
          tiktok:    { status: 'demo', label: 'TikTok Shop', route: 'link-only' },
          taobao:    { status: 'demo', label: 'Taobao',      route: 'link-only' },
          pinduoduo: { status: 'demo', label: 'Pinduoduo',   route: 'link-only' },
        },
        merchantProfile: null, catalogue: [], customers: [],
        journeys: [], supportHandovers: [],
      }),
    }),
    { name: '2am-shoppers-store' }
  )
);

export default useAppStore;
