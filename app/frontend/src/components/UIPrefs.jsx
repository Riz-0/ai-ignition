import React, { useState, useRef, useEffect } from 'react';
import useAppStore from '../store/appStore.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

/**
 * Compact UI preferences cluster — language switcher + theme toggle.
 * Designed to sit in the topbar of the customer and business layouts,
 * and on the auth/mode-select screens.
 *
 * Language list comes from the i18n translations module so adding a
 * new locale updates the picker automatically.
 */

export function LanguageSwitcher({ compact = true }) {
  const { lang, setLang, languages } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = languages.find((l) => l.code === lang) ?? languages[0];

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        style={pickerBtn}
      >
        <span aria-hidden="true">{active.flag}</span>
        {!compact && <span style={{ marginLeft: 6 }}>{active.native}</span>}
        <span style={{ marginLeft: 4, fontSize: '.7rem', opacity: .6 }}>▾</span>
      </button>
      {open && (
        <div role="menu" style={menu}>
          {languages.map((l) => (
            <button
              key={l.code}
              role="menuitem"
              onClick={() => { setLang(l.code); setOpen(false); }}
              style={{
                ...menuItem,
                background: l.code === lang ? 'rgba(240,78,110,.12)' : 'transparent',
                color: l.code === lang ? 'var(--coral-light)' : 'var(--text)',
              }}
            >
              <span aria-hidden="true" style={{ marginRight: 8 }}>{l.flag}</span>
              <span style={{ fontWeight: l.code === lang ? 600 : 400 }}>{l.native}</span>
              <span style={{ marginLeft: 'auto', fontSize: '.72rem', color: 'var(--text-dim)' }}>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ThemeToggle({ compact = true }) {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      style={pickerBtn}
    >
      <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
      {!compact && <span style={{ marginLeft: 6 }}>{isDark ? 'Light' : 'Dark'}</span>}
    </button>
  );
}

/** Inline-styled so it can be reused across layouts without a CSS module. */
const pickerBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 2,
  background: 'transparent',
  border: '1px solid var(--border-light)',
  color: 'var(--text)',
  borderRadius: 'var(--radius-sm)',
  padding: '6px 10px',
  fontSize: '.8rem',
  fontFamily: 'var(--font)',
  cursor: 'pointer',
  transition: 'border-color .15s, background .15s',
};
const menu = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  right: 0,
  minWidth: 200,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-sm)',
  padding: 4,
  boxShadow: '0 12px 32px rgba(0,0,0,.35)',
  zIndex: 60,
  display: 'flex',
  flexDirection: 'column',
};
const menuItem = {
  display: 'flex',
  alignItems: 'center',
  border: 'none',
  background: 'transparent',
  color: 'var(--text)',
  fontFamily: 'var(--font)',
  fontSize: '.82rem',
  padding: '8px 10px',
  borderRadius: '4px',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
};

/** Clustered group for topbars. */
export function UIPrefsCluster() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <LanguageSwitcher />
      <ThemeToggle />
    </div>
  );
}
