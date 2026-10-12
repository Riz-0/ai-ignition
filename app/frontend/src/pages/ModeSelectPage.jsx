import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore  from '../store/appStore.js';
import useAuthStore from '../store/authStore.js';
import styles from './ModeSelectPage.module.css';

export default function ModeSelectPage() {
  const { setAppMode, shopperProfile, merchantProfile, reset } = useAppStore();
  const { currentUser, isAdmin, logout } = useAuthStore();
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
        <span className={styles.topbarLogo}>🛒 2am Shoppers</span>
        <div className={styles.topbarRight}>
          <span className={styles.userChip}>
            {isAdmin() && <span className={styles.adminBadge}>⚡ Admin</span>}
            {currentUser?.username}
          </span>
          <button className={styles.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>
      </div>

      <div className={styles.inner}>
        <div className={styles.logo}>🛒</div>
        <h1 className={styles.title}>
          The <span className={styles.gradientText}>2am Shoppers</span>
        </h1>
        <p className={styles.sub}>
          Choose your mode. You can switch any time — personal finances never mix with merchant records.
        </p>

        {isAdmin() && (
          <div className={styles.adminBanner}>
            <span>⚡</span>
            <span>
              Admin — access all three modes and skip onboarding.
              {(shopperProfile || merchantProfile) && (
                <button className={styles.resetLink} onClick={() => reset()}>Reset all data</button>
              )}
            </span>
          </div>
        )}

        <div className={styles.cards}>
          {/* Student */}
          <button className={`${styles.card} ${styles.cardStudent}`} onClick={() => choose('student')}>
            <span className={styles.cardEmoji}>🎓</span>
            <h2>Student</h2>
            <p>Weekly allowance tracking, goal pockets and budget-filtered shopping picks.</p>
            <div className={styles.cardDetail}>Home · Discover · Save · Wishlist · Assistant</div>
            {shopperProfile?.userType === 'student' && (
              <span className={styles.returning}>← Continue as {shopperProfile.name}</span>
            )}
            <span className={styles.cardArrow}>→</span>
          </button>

          {/* Working Adult */}
          <button className={`${styles.card} ${styles.cardWorking}`} onClick={() => choose('working')}>
            <span className={styles.cardEmoji}>💼</span>
            <h2>Working Adult</h2>
            <p>Monthly income plan, multiple savings goals, smart shopping reminders and replenishment.</p>
            <div className={styles.cardDetail}>Overview · Spending · Savings · Shopping · Assistant</div>
            {shopperProfile?.userType === 'working' && (
              <span className={styles.returning}>← Continue as {shopperProfile.name}</span>
            )}
            <span className={styles.cardArrow}>→</span>
          </button>

          {/* Business */}
          <button className={`${styles.card} ${styles.cardBusiness}`} onClick={() => choose('business')}>
            <span className={styles.cardEmoji}>🏪</span>
            <h2>Business</h2>
            <p>Merchant CRM — journeys, catalogue, marketing, analytics and customer retention.</p>
            <div className={styles.cardDetail}>Overview · Products · Customers · Journeys · Analytics</div>
            {merchantProfile && (
              <span className={styles.returning}>← Continue as {merchantProfile.name}</span>
            )}
            <span className={styles.cardArrow}>→</span>
          </button>
        </div>

        <p className={styles.hackathon}>Eslitec Hackathon · Problem Statement 1</p>
      </div>
    </div>
  );
}
