import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore  from '../store/appStore.js';
import useAuthStore from '../store/authStore.js';
import { DEMO_ACCOUNTS } from '../store/demoAccounts.js';
import { useT } from '../i18n/I18nProvider.jsx';
import { UIPrefsCluster } from '../components/UIPrefs.jsx';
import styles from './ModeSelectPage.module.css';

const ACCENT = {
  student:  'cardStudent',
  working:  'cardWorking',
  business: 'cardBusiness',
  admin:    'cardStudent',
};

/**
 * Admin account picker.
 *
 * The admin (user / password) lands here and chooses which account to
 * enter. Picking an account:
 *   1. switches the auth session to that account,
 *   2. loads that account's pre-seeded profile into the active slots,
 *   3. routes straight into the matching dashboard.
 *
 * Because every demo account ships with a ready-made profile (seeded in
 * main.jsx), onboarding is skipped entirely — the admin jumps right in.
 */
export default function ModeSelectPage() {
  const { setAppMode, setActiveAccount, reset } = useAppStore();
  const { currentUser, switchToAccount, logout } = useAuthStore();
  const t = useT();
  const navigate = useNavigate();

  // The super-admin itself has no shopper/merchant dashboard, so if somehow
  // a non-admin reaches this page, send them to their own landing.
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  function enterAccount(bundle) {
    const id   = bundle.account.id;
    const role = bundle.account.role;

    // 1. Switch the auth session to the chosen account.
    const res = switchToAccount(id);
    if (!res.success) return;

    // 2. Load that account's seeded profile into the active slots.
    setActiveAccount(id);

    // 3. Set the app mode + route straight into the dashboard.
    if (role === 'business') {
      setAppMode('business');
      navigate('/business');
    } else if (role === 'admin') {
      // The admin account has no dashboard of its own — default to student.
      setAppMode('student');
      navigate('/customer/onboarding');
    } else {
      setAppMode(role); // 'student' | 'working'
      navigate('/customer');
    }
  }

  function handleLogout() { logout(); navigate('/login'); }

  // Everything except the super-admin account is a pickable persona.
  const pickable = DEMO_ACCOUNTS.filter(b => b.account.role !== 'admin');

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topbar}>
        <span className={styles.topbarLogo}>🛒 {t('common.appName')}</span>
        <div className={styles.topbarRight}>
          <UIPrefsCluster />
          <span className={styles.userChip}>
            <span className={styles.adminBadge}>⚡ {t('mode.admin')}</span>
            {currentUser?.username}
          </span>
          <button className={styles.logoutBtn} onClick={handleLogout}>{t('common.signOut')}</button>
        </div>
      </div>

      <div className={styles.inner}>
        <div className={styles.logo}>⚡</div>
        <h1 className={styles.title}>
          Admin <span className={styles.gradientText}>console</span>
        </h1>
        <p className={styles.sub}>
          Pick an account to jump straight into its dashboard. All demo accounts
          are pre-filled, so onboarding is skipped.
        </p>

        <div className={styles.adminBanner}>
          <span>⚡</span>
          <span>
            You're signed in as admin. Choose any account below to impersonate it.
            <button className={styles.resetLink} onClick={() => reset()}>{t('common.reset')}</button>
          </span>
        </div>

        <div className={styles.cards}>
          {pickable.map(bundle => (
            <button
              key={bundle.account.id}
              className={`${styles.card} ${styles[ACCENT[bundle.account.role]] ?? styles.cardStudent}`}
              onClick={() => enterAccount(bundle)}
            >
              <span className={styles.cardEmoji}>{bundle.card.emoji}</span>
              <h2>{bundle.card.label}</h2>
              <p>{bundle.card.blurb}</p>
              <div className={styles.cardDetail}>{bundle.card.tagline}</div>
              <span className={styles.cardArrow}>→</span>
            </button>
          ))}
        </div>

        {/* Download / install entry point */}
        <a className={styles.downloadEntry} href="#/download">📱 {t('download.title')} →</a>

        <p className={styles.hackathon}>Eslitec Hackathon · Problem Statement 1</p>
      </div>
    </div>
  );
}
