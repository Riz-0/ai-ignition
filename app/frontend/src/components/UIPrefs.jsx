import React, { useState, useRef, useEffect } from 'react';
import useAppStore from '../store/appStore.js';
import { useI18n } from '../i18n/I18nProvider.jsx';

/**
 * UIPrefs — language dropdown + theme toggle.
 * Used in every topbar and auth screen.
 */

export function LanguageSwitcher() {
  const { lang, setLang, languages } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = languages.find((l) => l.code === lang) ?? languages[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={wrap}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Select language"
        style={triggerBtn}
      >
        <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{active.flag}</span>
        <span style={{ fontWeight: 600, letterSpacing: '.02em' }}>{active.code.toUpperCase()}</span>
        <span style={{ fontSize: '.65rem', opacity: .65, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>

      {open && (
        <div role="menu" aria-label="Language options" style={dropdown}>
          {languages.map((l) => {
            const isActive = l.code === lang;
            return (
              <button
                key={l.code}
                role="menuitem"
                onClick={() => { setLang(l.code); setOpen(false); }}
                style={{
                  ...optionBtn,
                  background: isActive ? 'rgba(240,78,110,.12)' : 'transparent',
                  color: isActive ? 'var(--coral-light)' : 'var(--text)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{l.flag}</span>
                <span>{l.native}</span>
                <span style={{ marginLeft: 'auto', fontSize: '.7rem', color: 'var(--text-dim)', fontWeight: 400 }}>
                  {l.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ThemeToggle() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={themeBtn}
    >
      {/* Use text glyphs instead of emoji so they render reliably across OS */}
      {isDark ? '☀' : '☾'}
    </button>
  );
}

/** Clustered group for topbars — language + theme side by side. */
export function UIPrefsCluster() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <LanguageSwitcher />
      <ThemeToggle />
    </div>
  );
}

/* ── Shared inline styles ───────────────────────────────── */
const wrap = {
  position: 'relative',
};

const base = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-light)',
  color: 'var(--text)',
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font)',
  cursor: 'pointer',
  transition: 'border-color .15s, background .15s',
};

const triggerBtn = {
  ...base,
  padding: '6px 10px',
  fontSize: '.8rem',
  whiteSpace: 'nowrap',
};

const themeBtn = {
  ...base,
  padding: '6px 10px',
  fontSize: '1rem',
  fontWeight: 700,
  width: 34,
  height: 34,
  justifyContent: 'center',
};

const dropdown = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  right: 0,
  minWidth: 190,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-sm)',
  padding: 4,
  boxShadow: '0 12px 32px rgba(0,0,0,.4)',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
};

const optionBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  border: 'none',
  fontFamily: 'var(--font)',
  fontSize: '.83rem',
  padding: '9px 11px',
  borderRadius: 4,
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  transition: 'background .12s',
};
