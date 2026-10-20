import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { I18nProvider } from './i18n/I18nProvider.jsx';
import useAppStore  from './store/appStore.js';
import useAuthStore from './store/authStore.js';
import { DEMO_ACCOUNTS } from './store/demoAccounts.js';
import './index.css';

/* ── Apply persisted theme + language before render ────────
   The store is persisted to localStorage by zustand/persist, so we
   can read it synchronously to set the html data-theme attribute
   before React mounts — this avoids a flash of the wrong theme.
*/
function applyInitialTheme() {
  try {
    const raw = JSON.parse(localStorage.getItem('2am-shoppers-store') || '{}');
    const theme = raw?.state?.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}
applyInitialTheme();

/* ── Keep html[data-theme] in sync with the store ─────────── */
function ThemeSync() {
  const theme = useAppStore((s) => s.theme);
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return null;
}

/* ── Read a session handed off from the marketing website ──────
   The website deep-links to the app as  .../login#session=<base64>
   because localStorage is per-origin and is NOT shared between the
   two sites. We decode it, adopt the account, and clean the URL. */
function readSessionFromHash() {
  try {
    const m = window.location.hash.match(/session=([^&]+)/);
    if (!m) return null;
    const json = decodeURIComponent(escape(atob(m[1])));
    const payload = JSON.parse(json);
    // Strip the hash so a refresh doesn't re-trigger it.
    history.replaceState(null, '', window.location.pathname + window.location.search);
    return payload?.user ?? null;
  } catch {
    return null;
  }
}

/* ── Pick up a session (from URL hash or shared storage) and load
      that account's per-account profile into the active slots ──── */
function StorageSync() {
  const syncFromStorage  = useAuthStore((s) => s.syncFromStorage);
  const adoptSession     = useAuthStore((s) => s.adoptSession);
  const currentUser      = useAuthStore((s) => s.currentUser);
  const activeAccountId  = useAppStore((s) => s.activeAccountId);
  const setActiveAccount = useAppStore((s) => s.setActiveAccount);
  const seedDemoProfiles = useAppStore((s) => s.seedDemoProfiles);

  React.useEffect(() => {
    // 0. Make sure every demo/persona account has its ready-to-go profile.
    seedDemoProfiles(DEMO_ACCOUNTS);

    // 1. Website handoff via URL hash takes priority.
    const handoff = readSessionFromHash();
    if (handoff) {
      const res = adoptSession(handoff);
      if (res?.accountId) setActiveAccount(res.accountId);
      return;
    }
    // 2. Otherwise pick up a same-origin session.
    syncFromStorage();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Whenever the logged-in account changes, swap in its saved profile.
  React.useEffect(() => {
    if (currentUser?.id && activeAccountId !== currentUser.id) {
      setActiveAccount(currentUser.id);
    }
  }, [currentUser, activeAccountId, setActiveAccount]);

  return null;
}

/* ── Register the PWA service worker ─────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      // SW registration is best-effort; the app still works without it.
      console.warn('SW registration failed:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <ThemeSync />
        <StorageSync />
        <App />
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>
);
