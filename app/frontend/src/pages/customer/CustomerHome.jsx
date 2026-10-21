import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAppStore from '../../store/appStore.js';
import styles from './CustomerHome.module.css';

export default function CustomerHome() {
  const { shopperProfile, getStudentBudget, getWorkingBudget, wishlist, reminders } = useAppStore();
  const isStudent = shopperProfile?.userType === 'student';
  const name      = shopperProfile?.name ?? 'there';
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const b = (isStudent ? getStudentBudget() : getWorkingBudget())
    ?? { discretionary: 0, spent: 0 };
  const period = isStudent ? 'this week' : 'this month';
  const low    = b.discretionary <= (isStudent ? 5 : 50);

  return (
    <div className={styles.page}>
      {/* Greeting */}
      <div className={styles.greet}>
        <span className={styles.modeChip}>{isStudent ? '🎓 Student' : '💼 Working Adult'}</span>
        <h1 className={styles.hello}>{greeting}, {name} 👋</h1>
      </div>

      {/* Hero budget — one clear number */}
      <div className={`${styles.hero} ${isStudent ? styles.heroStudent : styles.heroWorking}`}>
        <div className={styles.heroLabel}>You can spend {period}</div>
        <div className={`${styles.heroNum} ${low ? styles.low : ''}`}>${b.discretionary.toFixed(2)}</div>
        <Link to="/customer/savings" className={styles.heroLink}>See full breakdown →</Link>
      </div>

      {/* Quick actions — 3 concise tiles */}
      <div className={styles.tiles}>
        <Link to="/customer/feed" className={styles.tile}>
          <span className={styles.tileIcon}>🎥</span>
          <span className={styles.tileLabel}>Discover</span>
        </Link>
        <Link to="/customer/savings" className={styles.tile}>
          <span className={styles.tileIcon}>🎯</span>
          <span className={styles.tileLabel}>Save</span>
        </Link>
        <Link to="/customer/wishlist" className={styles.tile}>
          <span className={styles.tileIcon}>❤️</span>
          <span className={styles.tileLabel}>Wishlist</span>
        </Link>
        <Link to="/customer/chat" className={styles.tile}>
          <span className={styles.tileIcon}>💬</span>
          <span className={styles.tileLabel}>Chat</span>
        </Link>
      </div>

      {/* One AI nudge */}
      <DemoNotif isStudent={isStudent} />

      {/* Lightweight gamification for students */}
      {isStudent && shopperProfile?.gamificationEnabled && <StreakBar />}
    </div>
  );
}

/* ── One friendly AI nudge ───────────────────────────────── */
function DemoNotif({ isStudent }) {
  const [resp, setResp] = useState(null);
  const [gone, setGone] = useState(false);
  if (gone) return null;

  const notif = isStudent
    ? { emoji: '👟', text: "Those sneakers dropped to $38 — inside your budget. Save toward them or view cheaper options?", opts: ['Save for it', 'Cheaper options', 'Dismiss'] }
    : { emoji: '☕', text: "Running low on coffee? I can reorder your usual before it runs out.", opts: ['Reorder', 'Remind me later', 'Dismiss'] };

  return (
    <div className={styles.nudge}>
      <span className={styles.nudgeEmoji}>{notif.emoji}</span>
      <div className={styles.nudgeBody}>
        <p className={styles.nudgeText}>{notif.text}</p>
        {!resp ? (
          <div className={styles.nudgeBtns}>
            {notif.opts.map(o => (
              <button key={o} className={styles.nudgeBtn}
                onClick={() => (o === 'Dismiss' ? setGone(true) : setResp(o))}>{o}</button>
            ))}
          </div>
        ) : (
          <div className={styles.nudgeReply}>✓ Got it — <strong>{resp}</strong></div>
        )}
      </div>
    </div>
  );
}

/* ── Lightweight streak bar ──────────────────────────────── */
function StreakBar() {
  return (
    <div className={styles.streak}>
      <span className={styles.streakIcon}>🔥</span>
      <div className={styles.streakBody}>
        <div className={styles.streakTop}>
          <span className={styles.streakTitle}>Budget streak</span>
          <span className={styles.streakCount}>2 / 5 days</span>
        </div>
        <div className={styles.streakTrack}><div className={styles.streakFill} style={{ width: '40%' }} /></div>
      </div>
    </div>
  );
}
