import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAppStore from '../../store/appStore.js';
import styles from './CustomerHome.module.css';

export default function CustomerHome() {
  const { shopperProfile, getStudentBudget, getWorkingBudget, wishlist, conversations, reminders, purchaseHistory } = useAppStore();
  const isStudent = shopperProfile?.userType === 'student';
  const name      = shopperProfile?.name ?? 'there';
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return isStudent
    ? <StudentHome name={name} greeting={greeting} budget={getStudentBudget()} wishlist={wishlist} conversations={conversations} reminders={reminders} gamification={shopperProfile?.gamificationEnabled} />
    : <WorkingHome name={name} greeting={greeting} budget={getWorkingBudget()} wishlist={wishlist} conversations={conversations} purchaseHistory={purchaseHistory} />;
}

/* ── Student Dashboard ───────────────────────────────────── */
function StudentHome({ name, greeting, budget, wishlist, conversations, reminders, gamification }) {
  const dueReminders = reminders.filter(r => !r.fired).length;
  const b = budget ?? { allowance: 0, essentials: 0, savings: 0, spent: 0, discretionary: 0 };

  return (
    <div>
      <div className={styles.modeBadge} style={{ background: 'rgba(124,58,237,.12)', color: 'var(--violet-light)', borderColor: 'rgba(124,58,237,.25)' }}>🎓 Student</div>
      <h1 className="page-title">{greeting}, {name} 👋</h1>
      <p className="page-sub">Here's your week at a glance.</p>

      {/* Weekly budget card */}
      <div className={`card ${styles.budgetCard} ${styles.budgetStudent}`}>
        <div className={styles.budgetLabel}>Weekly budget</div>
        <div className={styles.budgetGrid}>
          <div className={styles.budgetRow}><span>Allowance</span><span>${b.allowance}</span></div>
          <div className={styles.budgetRow}><span>Essential reserves</span><span className={styles.minus}>−${b.essentials}</span></div>
          <div className={styles.budgetRow}><span>Savings allocation</span><span className={styles.minus}>−${b.savings}</span></div>
          <div className={styles.budgetRow}><span>Spent this week</span><span className={styles.minus}>−${b.spent.toFixed(2)}</span></div>
          <div className={`${styles.budgetRow} ${styles.budgetResult}`}>
            <span>Remaining discretionary</span>
            <span className={b.discretionary <= 5 ? styles.low : styles.ok}>${b.discretionary.toFixed(2)}</span>
          </div>
        </div>
        <p className={styles.budgetNote}>Recorded plan · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · missing imports shown separately</p>
      </div>

      {/* Next-step card */}
      <NextStepCard isStudent wishlist={wishlist} dueReminders={dueReminders} conversations={conversations} />

      {/* Quick actions */}
      <h2 className="section-title" style={{ marginTop: 28 }}>Quick actions</h2>
      <div className={styles.quickGrid}>
        <Link to="/customer/savings"     className={`${styles.quickCard} ${styles.qcStudent}`}><span>🎯</span><div><div className={styles.qTitle}>Save toward a goal</div><div className={styles.qSub}>Goal pockets and contribution plan</div></div></Link>
        <Link to="/customer/wishlist"    className={styles.quickCard}><span>❤️</span><div><div className={styles.qTitle}>Wishlist</div><div className={styles.qSub}>Products saved with budget links</div></div></Link>
        <Link to="/customer/feed"        className={styles.quickCard}><span>🎥</span><div><div className={styles.qTitle}>Discover</div><div className={styles.qSub}>Picks within your budget</div></div></Link>
        <Link to="/customer/connections" className={styles.quickCard}><span>🔗</span><div><div className={styles.qTitle}>Connections</div><div className={styles.qSub}>Shopee, SHEIN, TikTok and more</div></div></Link>
      </div>

      {/* Demo AI notification */}
      <DemoNotif isStudent />

      {gamification && <GamificationCard />}
    </div>
  );
}

/* ── Working Adult Dashboard ─────────────────────────────── */
function WorkingHome({ name, greeting, budget, wishlist, conversations, purchaseHistory }) {
  const b = budget ?? { income: 0, essentials: 0, savings: 0, buffer: 0, spent: 0, discretionary: 0 };

  return (
    <div>
      <div className={styles.modeBadge} style={{ background: 'rgba(240,78,110,.12)', color: 'var(--coral-light)', borderColor: 'rgba(240,78,110,.25)' }}>💼 Working Adult</div>
      <h1 className="page-title">{greeting}, {name} 👋</h1>
      <p className="page-sub">Here's your month at a glance.</p>

      {/* Monthly budget card */}
      <div className={`card ${styles.budgetCard} ${styles.budgetWorking}`}>
        <div className={styles.budgetLabel}>Monthly overview</div>
        <div className={styles.budgetGrid}>
          <div className={styles.budgetRow}><span>Recorded income</span><span>${b.income}</span></div>
          <div className={styles.budgetRow}><span>Essential reserves</span><span className={styles.minus}>−${b.essentials}</span></div>
          <div className={styles.budgetRow}><span>Savings allocations</span><span className={styles.minus}>−${b.savings}</span></div>
          <div className={styles.budgetRow}><span>Buffer</span><span className={styles.minus}>−${b.buffer}</span></div>
          <div className={styles.budgetRow}><span>Recorded spending</span><span className={styles.minus}>−${b.spent.toFixed(2)}</span></div>
          <div className={`${styles.budgetRow} ${styles.budgetResult}`}>
            <span>Remaining discretionary</span>
            <span className={b.discretionary <= 50 ? styles.low : styles.ok}>${b.discretionary.toFixed(2)}</span>
          </div>
        </div>
        <p className={styles.budgetNote}>Recorded plan · missing expenses or unconfirmed imports are shown separately</p>
      </div>

      {/* Next-step card */}
      <NextStepCard wishlist={wishlist} conversations={conversations} purchaseHistory={purchaseHistory} />

      {/* Quick actions */}
      <h2 className="section-title" style={{ marginTop: 28 }}>Quick actions</h2>
      <div className={styles.quickGrid}>
        <Link to="/customer/savings"     className={`${styles.quickCard} ${styles.qcWorking}`}><span>📈</span><div><div className={styles.qTitle}>Savings goals</div><div className={styles.qSub}>Multiple goals, contributions and projections</div></div></Link>
        <Link to="/customer/wishlist"    className={styles.quickCard}><span>❤️</span><div><div className={styles.qTitle}>Shopping list</div><div className={styles.qSub}>Wishlist, replenishment and price alerts</div></div></Link>
        <Link to="/customer/feed"        className={styles.quickCard}><span>🎥</span><div><div className={styles.qTitle}>Discover</div><div className={styles.qSub}>Personalised picks around your plan</div></div></Link>
        <Link to="/customer/connections" className={styles.quickCard}><span>🔗</span><div><div className={styles.qTitle}>Connections</div><div className={styles.qSub}>Link Shopee, TikTok, SHEIN and more</div></div></Link>
      </div>

      <DemoNotif />
    </div>
  );
}

/* ── Shared sub-components ─────────────────────────────── */
function NextStepCard({ isStudent, wishlist, dueReminders, conversations, purchaseHistory }) {
  const item = wishlist[0];
  if (!item) return (
    <div className={`card ${styles.nextStep}`}>
      <span className={styles.nsIcon}>💡</span>
      <div>
        <div className={styles.nsTitle}>Nothing saved yet</div>
        <div className={styles.nsSub}><Link to="/customer/wishlist">Save your first product →</Link></div>
      </div>
    </div>
  );
  return (
    <div className={`card ${styles.nextStep}`}>
      <span className={styles.nsIcon}>❤️</span>
      <div>
        <div className={styles.nsTitle}>Saved: {item.title}</div>
        <div className={styles.nsSub}>
          {item.budget ? `Budget: $${item.budget}` : 'No budget set'}
          {' · '}
          <Link to="/customer/wishlist">View wishlist →</Link>
        </div>
      </div>
    </div>
  );
}

function DemoNotif({ isStudent }) {
  const [resp, setResp] = useState(null);
  const [gone, setGone] = useState(false);
  if (gone) return null;

  const notif = isStudent
    ? { emoji: '👟', text: "That hoodie is $25 and your recorded shopping budget has $12 left. Want to save toward it or view options under $12?", opts: ['Save for it', 'Show cheaper options', 'Edit budget', 'Dismiss'] }
    : { emoji: '☕', text: "Would you like to reorder your usual coffee or review alternatives? Your recorded discretionary budget has room.", opts: ['Reorder', 'Compare options', 'Remind me later', 'Dismiss'] };

  return (
    <div className={`card ${styles.notifCard}`} style={{ marginTop: 24 }}>
      <div className={styles.notifTop}>
        <span className={styles.notifEmoji}>{notif.emoji}</span>
        <p className={styles.notifText}>{notif.text}</p>
        <button className={styles.notifX} onClick={() => setGone(true)}>✕</button>
      </div>
      {!resp
        ? <div className={styles.notifBtns}>{notif.opts.map(o => <button key={o} className={styles.notifBtn} onClick={() => { o === 'Dismiss' ? setGone(true) : setResp(o); }}>{o}</button>)}</div>
        : <div className={styles.notifReply}>✓ Got it — <strong>{resp}</strong>. AI is adapting your journey.</div>
      }
    </div>
  );
}

function GamificationCard() {
  return (
    <div className={`card ${styles.gamCard}`}>
      <div className={styles.gamTitle}>🏅 This week's challenge</div>
      <p className={styles.gamDesc}>Stay within your discretionary budget 5 days in a row to earn the <strong>Budget Keeper</strong> badge.</p>
      <div className={styles.gamProgress}><div className={styles.gamBar} style={{ width: '40%' }} /></div>
      <p className={styles.gamNote}>Gamification is optional — turn it off in Settings any time. Skipping a day doesn't erase progress.</p>
    </div>
  );
}
