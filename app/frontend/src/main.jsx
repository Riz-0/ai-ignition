import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { I18nProvider } from './i18n/I18nProvider.jsx';
import useAppStore  from './store/appStore.js';
import useAuthStore from './store/authStore.js';
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

/* ── Pick up a session written by the website, and load that
      account's per-account profile into the active slots ──────── */
function StorageSync() {
  const syncFromStorage = useAuthStore((s) => s.syncFromStorage);
  const currentUser     = useAuthStore((s) => s.currentUser);
  const activeAccountId = useAppStore((s) => s.activeAccountId);
  const setActiveAccount = useAppStore((s) => s.setActiveAccount);

  React.useEffect(() => {
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
