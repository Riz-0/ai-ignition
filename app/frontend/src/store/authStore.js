import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
        const accounts = get().accounts;
        const account  = accounts.find(
          a => a.username.toLowerCase() === username.toLowerCase().trim()
            && a.password === password
        );
        if (!account) return { success: false, error: 'Incorrect username or password.' };
        set({ currentUser: account, isLoggedIn: true });
        return { success: true, role: account.role };
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
        return { success: true, role: newAccount.role };
      },

      // ── Logout ───────────────────────────────────────────────
      logout: () => set({ currentUser: null, isLoggedIn: false }),

      // ── Helpers ──────────────────────────────────────────────
      isAdmin: () => get().currentUser?.role === 'admin',
    }),
    { name: '2am-shoppers-auth' }
  )
);

export default useAuthStore;
