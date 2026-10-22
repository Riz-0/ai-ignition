import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEMO_ACCOUNT_LIST } from './demoAccounts.js';

/**
 * Auth store — manages login sessions and user accounts.
 *
 * Pre-seeded demo accounts (see demoAccounts.js):
 *   user / password          → admin (all modes, skips onboarding)
 *   emily / emilypassword    → Emily, student persona
 *   john / johnpassword      → John, working-adult persona
 *   student / student        → demo student account
 *   working / working        → demo working-adult account
 *   business / business      → demo business account
 *
 * Additional accounts can be created via the signup flow.
 * Passwords are stored as-is here (frontend demo only).
 * In production use bcrypt on the backend and never store plain passwords.
 */

const SEED_ACCOUNTS = DEMO_ACCOUNT_LIST.map(a => ({
  createdAt: '2026-01-01T00:00:00.000Z',
  ...a,
}));

// Ids of the pre-seeded demo/persona accounts. Their credentials live in
// source (demoAccounts.js) and must ALWAYS win over anything in localStorage,
// otherwise a stale session from an older build (e.g. an old emily123 password)
// can shadow the current one and break login.
const SEED_IDS = new Set(SEED_ACCOUNTS.map(a => a.id));

/**
 * Union a persisted account list onto the seed list.
 * Demo accounts (ids in SEED_IDS) always keep the fresh seed copy; any other
 * accounts (real signups) are merged in. Returns a new array.
 */
function reconcileAccounts(seed, persisted) {
  const byId = new Map(seed.map(a => [a.id, a]));
  for (const a of persisted ?? []) {
    if (!a?.id) continue;
    // Never let a persisted copy override a demo/seed account.
    if (SEED_IDS.has(a.id)) continue;
    byId.set(a.id, a);
  }
  return [...byId.values()];
}

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
        // Rebuild the account list from the authoritative SEED_ACCOUNTS so
        // demo/persona credentials from source always win, then union in any
        // real signups that exist in memory or in localStorage.
        const inMemoryExtras = get().accounts.filter(a => !SEED_IDS.has(a.id));
        let accounts = reconcileAccounts(SEED_ACCOUNTS, inMemoryExtras);

        // Merge any accounts written to localStorage by the website or another
        // tab — Zustand doesn't rehydrate on external writes after init.
        try {
          const raw = localStorage.getItem('2am-shoppers-auth');
          if (raw) {
            const persisted = JSON.parse(raw)?.state?.accounts;
            if (Array.isArray(persisted) && persisted.length > 0) {
              accounts = reconcileAccounts(accounts, persisted);
            }
          }
        } catch { /* ignore parse errors */ }

        set({ accounts });

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
          offerTour: true,               // new sign-ups get offered the app tour
        };

        set(s => ({ accounts: [...s.accounts, newAccount], currentUser: newAccount, isLoggedIn: true }));
        return { success: true, role: newAccount.role, accountId: newAccount.id };
      },

      // ── Logout ───────────────────────────────────────────────
      logout: () => set({ currentUser: null, isLoggedIn: false }),

      // ── Switch the active session to another account by id ────
      // Used by the admin account picker: an admin can jump into any
      // seeded account without re-entering credentials.
      switchToAccount: (accountId) => {
        const account = get().accounts.find(a => a.id === accountId);
        if (!account) return { success: false, error: 'Account not found.' };
        set({ currentUser: account, isLoggedIn: true });
        return { success: true, role: account.role, accountId: account.id };
      },

      // ── Adopt a session handed off from the website ───────────
      // The marketing site passes the account via a URL hash
      // (#session=<base64>) because localStorage is per-origin and is
      // NOT shared between the website and the app. We merge the account
      // into the local list (so sign-in works later too) and log in.
      adoptSession: (account) => {
        if (!account?.username) return { success: false };
        const accounts = get().accounts;
        const existing = accounts.find(
          a => a.id === account.id || a.username.toLowerCase() === account.username.toLowerCase()
        );
        if (existing) {
          set({ currentUser: existing, isLoggedIn: true });
          return { success: true, accountId: existing.id, role: existing.role };
        }
        set(s => ({ accounts: [...s.accounts, account], currentUser: account, isLoggedIn: true }));
        return { success: true, accountId: account.id, role: account.role };
      },

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

      // Bump this whenever seed credentials change. On load, any persisted
      // state with an older version is migrated: demo/seed accounts are
      // dropped (so the fresh source copies take over) and only real signups
      // are kept. This guarantees an old `emily123`-style session can never
      // keep shadowing the current credentials.
      version: 2,
      migrate: (persisted) => {
        if (!persisted) return persisted;
        const kept = (persisted.accounts ?? []).filter(a => a?.id && !SEED_IDS.has(a.id));
        // If the logged-in user was a demo account, force a fresh login.
        const staleDemoSession = persisted.currentUser && SEED_IDS.has(persisted.currentUser.id);
        return {
          ...persisted,
          accounts: kept,
          currentUser: staleDemoSession ? null : persisted.currentUser,
          isLoggedIn: staleDemoSession ? false : persisted.isLoggedIn,
        };
      },

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
        // Demo accounts always keep their fresh source copy; real signups merge in.
        const merged = reconcileAccounts(
          current.accounts ?? SEED_ACCOUNTS,
          persisted?.accounts ?? []
        );

        // Restore a persisted session, but if the logged-in user is a demo
        // account, refresh its object from the (authoritative) seed so a stale
        // currentUser from an older build can never shadow current credentials.
        let currentUser = persisted?.currentUser ?? current.currentUser ?? null;
        if (currentUser && SEED_IDS.has(currentUser.id)) {
          currentUser = merged.find(a => a.id === currentUser.id) ?? currentUser;
        }

        return { ...current, ...persisted, accounts: merged, currentUser };
      },
    }
  )
);

export default useAuthStore;
