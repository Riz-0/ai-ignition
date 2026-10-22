import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import useAppStore  from '../store/appStore.js';
import { DEMO_ACCOUNTS } from '../store/demoAccounts.js';
import { useT } from '../i18n/I18nProvider.jsx';
import { UIPrefsCluster } from '../components/UIPrefs.jsx';
import styles from './AuthPage.module.css';

const ACCENT = {
  student:  { bg: 'rgba(124,58,237,.14)', fg: '#a78bfa' },
  working:  { bg: 'rgba(240,78,110,.14)', fg: '#ff8fa3' },
  business: { bg: 'rgba(245,158,11,.14)', fg: '#fcd34d' },
  admin:    { bg: 'rgba(16,185,129,.14)', fg: '#6ee7b7' },
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showDemos, setShowDemos] = useState(false);

  const { login, isLoggedIn }     = useAuthStore();
  const { setActiveAccount }      = useAppStore();
  const t = useT();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isLoggedIn) navigate('/', { replace: true });
  }, [isLoggedIn, navigate]);

  function completeLogin(result) {
    setActiveAccount(result.accountId);
    navigate('/');
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = login(username.trim(), password);
      setLoading(false);
      if (!result.success) { setError(t('login.error')); return; }
      completeLogin(result);
    }, 300);
  }

  function quickLogin(bundle) {
    const { username: u, password: p } = bundle.account;
    const result = login(u, p);
    if (!result.success) { setError(t('login.error')); return; }
    completeLogin(result);
  }

  return (
    <div className={styles.page}>
      <div className={styles.prefsBar}><UIPrefsCluster /></div>

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.brandRow}>
            <span className={styles.brandIcon}>🛒</span>
            <span className={styles.brandName}>{t('common.appName')}</span>
          </div>
          <h1 className={styles.title}>{t('login.welcome')}</h1>
          <p className={styles.sub}>{t('login.sub')}</p>
        </div>

        {/* ── Primary: normal login form ── */}
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            {t('login.username')}
            <input
              className={styles.input}
              type="text"
              autoComplete="username"
              placeholder={t('login.username')}
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              required
            />
          </label>

          <label className={styles.label}>
            {t('login.password')}
            <div className={styles.passwordWrap}>
              <input
                className={styles.input}
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder={t('login.password')}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                required
              />
              <button type="button" className={styles.togglePass}
                onClick={() => setShowPass(v => !v)}
                aria-label={showPass ? t('authExtra.hidePassword') : t('authExtra.showPassword')}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? t('login.signingIn') : t('login.submit')}
          </button>
        </form>

        <div className={styles.footer}>
          <span>{t('login.noAccount')}</span>
          <Link to="/signup" className={styles.switchLink}>{t('login.createOne')}</Link>
        </div>

        {/* ── Secondary: quick demo logins ── */}
        <div className={styles.demoSection}>
          <button type="button" className={styles.demoToggle} onClick={() => setShowDemos(v => !v)}>
            <span>{t('authExtra.demoAccounts')}</span>
            <span className={styles.demoChevron}>{showDemos ? '▲' : '▼'}</span>
          </button>

          {showDemos && (
            <div className={styles.demoList}>
              {DEMO_ACCOUNTS.map(bundle => {
                const a = ACCENT[bundle.card.accent] ?? ACCENT.admin;
                return (
                  <button
                    key={bundle.account.id}
                    type="button"
                    className={styles.demoRow}
                    onClick={() => quickLogin(bundle)}
                  >
                    <span className={styles.demoEmoji} style={{ background: a.bg }}>{bundle.card.emoji}</span>
                    <span className={styles.demoInfo}>
                      <span className={styles.demoName}>{bundle.card.label}</span>
                      <span className={styles.demoTag} style={{ color: a.fg }}>{bundle.card.tagline}</span>
                    </span>
                    <span className={styles.demoGo} style={{ color: a.fg }}>→</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.downloadLink}>
          <Link to="/download">📱 {t('download.title')}</Link>
        </div>
      </div>
    </div>
  );
}
