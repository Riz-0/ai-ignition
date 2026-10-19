import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore  from '../store/appStore.js';
import useAuthStore from '../store/authStore.js';
import { useT } from '../i18n/I18nProvider.jsx';
import { UIPrefsCluster } from '../components/UIPrefs.jsx';
import styles from './ModeSelectPage.module.css';

export default function ModeSelectPage() {
  const { setAppMode, shopperProfile, merchantProfile, reset } = useAppStore();
  const { currentUser, isAdmin, logout } = useAuthStore();
  const t = useT();
  const navigate = useNavigate();

  function choose(mode) {
    setAppMode(mode);
    if (mode === 'business') {
      navigate(merchantProfile ? '/business' : '/business/onboarding');
    } else {
      // student or working — both go to /customer routes
      navigate(shopperProfile ? '/customer' : '/customer/onboarding');
    }
  }

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topbar}>
        <span className={styles.topbarLogo}>🛒 {t('common.appName')}</span>
        <div className={styles.topbarRight}>
          <UIPrefsCluster />
          <span className={styles.userChip}>
            {isAdmin() && <span className={styles.adminBadge}>⚡ {t('mode.admin')}</span>}
            {currentUser?.username}
          </span>
          <button className={styles.logoutBtn} onClick={handleLogout}>{t('common.signOut')}</button>
        </div>
      </div>

      <div className={styles.inner}>
        <div className={styles.logo}>🛒</div>
        <h1 className={styles.title}>
          The <span className={styles.gradientText}>{t('mode.title').replace('The ', '')}</span>
        </h1>
        <p className={styles.sub}>{t('mode.sub')}</p>

        {isAdmin() && (
          <div className={styles.adminBanner}>
            <span>⚡</span>
            <span>
              {t('mode.adminBanner')}
              {(shopperProfile || merchantProfile) && (
                <button className={styles.resetLink} onClick={() => reset()}>{t('common.reset')}</button>
              )}
            </span>
          </div>
        )}

        <div className={styles.cards}>
          {/* Student */}
          <button className={`${styles.card} ${styles.cardStudent}`} onClick={() => choose('student')}>
            <span className={styles.cardEmoji}>🎓</span>
            <h2>{t('mode.student')}</h2>
            <p>{t('mode.studentDesc')}</p>
            <div className={styles.cardDetail}>{t('nav.home')} · {t('nav.discover')} · {t('nav.save')} · {t('nav.wishlist')} · {t('nav.assistant')}</div>
            {shopperProfile?.userType === 'student' && (
              <span className={styles.returning}>← {shopperProfile.name}</span>
            )}
            <span className={styles.cardArrow}>→</span>
          </button>

          {/* Working Adult */}
          <button className={`${styles.card} ${styles.cardWorking}`} onClick={() => choose('working')}>
            <span className={styles.cardEmoji}>💼</span>
            <h2>{t('mode.working')}</h2>
            <p>{t('mode.workingDesc')}</p>
            <div className={styles.cardDetail}>{t('nav.overview')} · {t('nav.spending')} · {t('nav.savings')} · {t('nav.shopping')} · {t('nav.assistant')}</div>
            {shopperProfile?.userType === 'working' && (
              <span className={styles.returning}>← {shopperProfile.name}</span>
            )}
            <span className={styles.cardArrow}>→</span>
          </button>

          {/* Business */}
          <button className={`${styles.card} ${styles.cardBusiness}`} onClick={() => choose('business')}>
            <span className={styles.cardEmoji}>🏪</span>
            <h2>{t('mode.business')}</h2>
            <p>{t('mode.businessDesc')}</p>
            <div className={styles.cardDetail}>{t('nav.dashboard')} · {t('nav.customers')} · {t('nav.journeys')} · {t('nav.catalogue')}</div>
            {merchantProfile && (
              <span className={styles.returning}>← {merchantProfile.name}</span>
            )}
            <span className={styles.cardArrow}>→</span>
          </button>
        </div>

        {/* Download / install entry point */}
        <a className={styles.downloadEntry} href="#/download">📱 {t('download.title')} →</a>

        <p className={styles.hackathon}>Eslitec Hackathon · Problem Statement 1</p>
      </div>
    </div>
  );
}
