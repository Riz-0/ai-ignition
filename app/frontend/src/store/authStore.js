import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Auth store — manages login sessions and user accounts.
 *
 * Pre-seeded admin account:
 *   username : user
 *   password : password
 *   role     : admin   (can access both customer and business views,
 *                        and skip onboarding entirely)
 *
 * Additional accounts can be created via the signup flow.
 * Passwords are stored as-is here (frontend demo only).
 * In production use bcrypt on the backend and never store plain passwords.
 */

const SEED_ACCOUNTS = [
  {
    id:        'admin-001',
    username:  'user',
    password:  'password',
    email:     'admin@2amshoppers.com',
    name:      'Admin',
    role:      'admin',   // 'admin' | 'customer' | 'merchant'
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── Accounts (includes seed + any signed-up users) ──────
      accounts: SEED_ACCOUNTS,

      // ── Current session ──────────────────────────────────────
      currentUser: null,   // the logged-in account object
      isLoggedIn:  false,

      // ── Login ────────────────────────────────────────────────
      login: (username, password) => {
        // Start with in-memory accounts (includes the seed + any accounts
        // created while the app was running).
        let accounts = get().accounts;

        // Merge any accounts written to localStorage by the website or another
        // tab — Zustand doesn't rehydrate on external writes after init.
        // We do a union by id so we never lose accounts from either side.
        try {
          const raw = localStorage.getItem('2am-shoppers-auth');
          if (raw) {
            const persisted = JSON.parse(raw)?.state?.accounts;
            if (Array.isArray(persisted) && persisted.length > 0) {
              const existingIds = new Set(accounts.map(a => a.id));
              const newAccounts = persisted.filter(a => !existingIds.has(a.id));
              if (newAccounts.length > 0) {
                accounts = [...accounts, ...newAccounts];
                set({ accounts });
              }
            }
          }
        } catch { /* ignore parse errors */ }

        const account = accounts.find(
          a => a.username.toLowerCase() === username.toLowerCase().trim()
            && a.password === password
        );
        if (!account) return { success: false, error: 'Incorrect username or password.' };
        set({ currentUser: account, isLoggedIn: true });
        return { success: true, role: account.role, accountId: account.id };
      },

      // ── Sign up ──────────────────────────────────────────────
      signup: (username, email, password, role) => {
        const accounts = get().accounts;

        if (!username?.trim())  return { success: false, error: 'Username is required.' };
        if (!password)          return { success: false, error: 'Password is required.' };
        if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };

        const taken = accounts.find(
          a => a.username.toLowerCase() === username.toLowerCase().trim()
        );
        if (taken) return { success: false, error: 'That username is already taken.' };

        const newAccount = {
          id:        crypto.randomUUID(),
          username:  username.trim(),
          password,
          email:     email?.trim() ?? '',
          name:      username.trim(),
          role:      role ?? 'student',  // 'student' | 'working' | 'admin'
          createdAt: new Date().toISOString(),
        };

        set(s => ({ accounts: [...s.accounts, newAccount], currentUser: newAccount, isLoggedIn: true }));
        return { success: true, role: newAccount.role, accountId: newAccount.id };
      },

      // ── Logout ───────────────────────────────────────────────
      logout: () => set({ currentUser: null, isLoggedIn: false }),

      // ── Sync from storage ────────────────────────────────────
      // Call once on app mount to pick up a session written by the website.
      syncFromStorage: () => {
        try {
          const raw = localStorage.getItem('2am-shoppers-auth');
          if (!raw) return;
          const parsed = JSON.parse(raw)?.state;
          if (!parsed) return;

          // Merge accounts
          const inMemory  = get().accounts;
          const persisted = parsed.accounts;
          if (Array.isArray(persisted) && persisted.length > 0) {
            const existingIds = new Set(inMemory.map(a => a.id));
            const newAccounts = persisted.filter(a => !existingIds.has(a.id));
            if (newAccounts.length > 0) {
              set({ accounts: [...inMemory, ...newAccounts] });
            }
          }

          // Adopt session if the website logged someone in and we are not yet logged in
          if (!get().isLoggedIn && parsed.isLoggedIn && parsed.currentUser) {
            set({ currentUser: parsed.currentUser, isLoggedIn: true });
          }
        } catch { /* ignore */ }
      },

      // ── Helpers ──────────────────────────────────────────────
      isAdmin: () => get().currentUser?.role === 'admin',
    }),
    {
      name: '2am-shoppers-auth',

      /**
       * Custom storage: merges accounts on every write so that entries written
       * by the website (same localStorage key) are never silently dropped when
       * the app's Zustand store re-persists in-memory state.
       */
      storage: createJSONStorage(() => ({
        getItem:    (key) => localStorage.getItem(key),
        removeItem: (key) => localStorage.removeItem(key),
        setItem:    (key, value) => {
          try {
            const existing = JSON.parse(localStorage.getItem(key) || '{}');
            const incoming = JSON.parse(value);

            // Union accounts by id — neither side loses entries.
            const existingAccounts = existing?.state?.accounts ?? [];
            const incomingAccounts = incoming?.state?.accounts ?? [];
            const byId = new Map(existingAccounts.map(a => [a.id, a]));
            incomingAccounts.forEach(a => byId.set(a.id, a));

            incoming.state.accounts = [...byId.values()];
            localStorage.setItem(key, JSON.stringify(incoming));
          } catch {
            localStorage.setItem(key, value);
          }
        },
      })),

      /**
       * Custom merge: when Zustand rehydrates on startup, union the stored
       * accounts with the initial SEED_ACCOUNTS so neither side drops entries.
       */
      merge: (persisted, current) => {
        const persistedAccounts = persisted?.accounts ?? [];
        const currentAccounts   = current.accounts ?? [];
        const allIds = new Set(currentAccounts.map(a => a.id));
        const merged = [
          ...currentAccounts,
          ...persistedAccounts.filter(a => !allIds.has(a.id)),
        ];
        return { ...current, ...persisted, accounts: merged };
      },
    }
  )
);

export default useAuthStore;
