import React, { createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import { TRANSLATIONS, DEFAULT_LANGUAGE, LANGUAGES } from './translations.js';
import useAppStore from '../store/appStore.js';

/**
 * Lightweight i18n context.
 * Looks up a dotted key like `t('nav.home')` in the active language,
 * falling back to English, then to the key itself.
 *
 * Language preference is persisted in the global appStore so it
 * survives reloads and matches the user's locale (en / ja / zh / th).
 */
const I18nContext = createContext({
  lang: DEFAULT_LANGUAGE,
  setLang: () => {},
  t: (k) => k,
});

function resolve(dict, key) {
  const parts = key.split('.');
  let cur = dict;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
    else return undefined;
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function I18nProvider({ children }) {
  const lang = useAppStore((s) => s.language);
  const setLang = useAppStore((s) => s.setLanguage);

  // Auto-detect language once on first run from browser locale
  useEffect(() => {
    if (lang) return; // already chosen
    const nav = (navigator?.language || 'en').toLowerCase();
    let detected = DEFAULT_LANGUAGE;
    if (nav.startsWith('ja')) detected = 'ja';
    else if (nav.startsWith('zh')) detected = 'zh';
    else if (nav.startsWith('th')) detected = 'th';
    setLang(detected);
  }, [lang, setLang]);

  const t = useCallback(
    (key, vars) => {
      const active = TRANSLATIONS[lang] ?? TRANSLATIONS[DEFAULT_LANGUAGE];
      let val = resolve(active, key)
        ?? resolve(TRANSLATIONS[DEFAULT_LANGUAGE], key)
        ?? key;
      if (vars && typeof val === 'string') {
        for (const [k, v] of Object.entries(vars)) {
          val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return val;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t, languages: LANGUAGES }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

/** Convenience hook returning just the translator function. */
export function useT() {
  return useContext(I18nContext).t;
}
