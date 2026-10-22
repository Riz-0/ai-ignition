import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAppStore from '../../store/appStore.js';
import { useT } from '../../i18n/I18nProvider.jsx';
import styles from './CustomerHome.module.css';

export default function CustomerHome() {
  const { shopperProfile, getStudentBudget, getWorkingBudget, wishlist, reminders } = useAppStore();
  const t = useT();
  const isStudent = shopperProfile?.userType === 'student';
  const name      = shopperProfile?.name ?? t('homeExtra.fallbackName');
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? t('home.greetingMorning') : hour < 17 ? t('home.greetingAfternoon') : t('home.greetingEvening');

  const b = (isStudent ? getStudentBudget() : getWorkingBudget())
    ?? { discretionary: 0, spent: 0 };
  const low    = b.discretionary <= (isStudent ? 5 : 50);

  return (
    <div className={styles.page}>
      {/* Greeting */}
      <div className={styles.greet}>
        <span className={styles.modeChip}>{isStudent ? t('homeExtra.modeStudent') : t('homeExtra.modeWorking')}</span>
        <h1 className={styles.hello}>{greeting}, {name} 👋</h1>
      </div>

      {/* Hero budget — one clear number */}
      <div className={`${styles.hero} ${isStudent ? styles.heroStudent : styles.heroWorking}`}>
        <div className={styles.heroLabel}>{isStudent ? t('homeExtra.canSpendWeek') : t('homeExtra.canSpendMonth')}</div>
        <div className={`${styles.heroNum} ${low ? styles.low : ''}`}>${b.discretionary.toFixed(2)}</div>
        <Link to="/customer/savings" className={styles.heroLink}>{t('homeExtra.seeBreakdown')}</Link>
      </div>

      {/* Quick actions — 3 concise tiles */}
      <div className={styles.tiles}>
        <Link to="/customer/feed" className={styles.tile}>
          <span className={styles.tileIcon}>🎥</span>
          <span className={styles.tileLabel}>{t('homeExtra.tileDiscover')}</span>
        </Link>
        <Link to="/customer/savings" className={styles.tile}>
          <span className={styles.tileIcon}>🎯</span>
          <span className={styles.tileLabel}>{t('homeExtra.tileSave')}</span>
        </Link>
        <Link to="/customer/wishlist" className={styles.tile}>
          <span className={styles.tileIcon}>❤️</span>
          <span className={styles.tileLabel}>{t('homeExtra.tileWishlist')}</span>
        </Link>
        <Link to="/customer/chat" className={styles.tile}>
          <span className={styles.tileIcon}>💬</span>
          <span className={styles.tileLabel}>{t('homeExtra.tileChat')}</span>
        </Link>
      </div>

      {/* One AI nudge */}
      <DemoNotif isStudent={isStudent} t={t} />

      {/* Lightweight gamification for students */}
      {isStudent && shopperProfile?.gamificationEnabled && <StreakBar t={t} />}
    </div>
  );
}

/* ── One friendly AI nudge ───────────────────────────────── */
function DemoNotif({ isStudent, t }) {
  const [resp, setResp] = useState(null);
  const [gone, setGone] = useState(false);
  if (gone) return null;

  const notif = isStudent
    ? { emoji: '👟', text: t('homeExtra.nudgeStudent'), opts: [
        { key: 'optSaveForIt', label: t('homeExtra.optSaveForIt') },
        { key: 'optCheaper',   label: t('homeExtra.optCheaper') },
        { key: 'optDismiss',   label: t('homeExtra.optDismiss') },
      ] }
    : { emoji: '☕', text: t('homeExtra.nudgeWorking'), opts: [
        { key: 'optReorder',     label: t('homeExtra.optReorder') },
        { key: 'optRemindLater', label: t('homeExtra.optRemindLater') },
        { key: 'optDismiss',     label: t('homeExtra.optDismiss') },
      ] };

  return (
    <div className={styles.nudge}>
      <span className={styles.nudgeEmoji}>{notif.emoji}</span>
      <div className={styles.nudgeBody}>
        <p className={styles.nudgeText}>{notif.text}</p>
        {!resp ? (
          <div className={styles.nudgeBtns}>
            {notif.opts.map(o => (
              <button key={o.key} className={styles.nudgeBtn}
                onClick={() => (o.key === 'optDismiss' ? setGone(true) : setResp(o.label))}>{o.label}</button>
            ))}
          </div>
        ) : (
          <div className={styles.nudgeReply}>{t('homeExtra.gotIt')} <strong>{resp}</strong></div>
        )}
      </div>
    </div>
  );
}

/* ── Lightweight streak bar ──────────────────────────────── */
function StreakBar({ t }) {
  return (
    <div className={styles.streak}>
      <span className={styles.streakIcon}>🔥</span>
      <div className={styles.streakBody}>
        <div className={styles.streakTop}>
          <span className={styles.streakTitle}>{t('homeExtra.streakTitle')}</span>
          <span className={styles.streakCount}>{t('homeExtra.streakCount', { n: 2, total: 5 })}</span>
        </div>
        <div className={styles.streakTrack}><div className={styles.streakFill} style={{ width: '40%' }} /></div>
      </div>
    </div>
  );
}
